import { useCallback } from 'react';
import type { EditorInstance } from '../builder-core';
import { parseNumericValue, unwrapAddedComponent, selectComponent } from '../builder-core';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = any;

export function useComponentHandlers(editor: EditorInstance | null, syncCanvasSchema: (instance: EditorInstance) => void) {
  const withSelected = useCallback((run: (selected: AnyComponent) => void): boolean => {
    if (!editor) return false;
    const selected = editor.getSelected() as unknown as AnyComponent | null;
    if (!selected) return false;
    run(selected);
    syncCanvasSchema(editor);
    return true;
  }, [editor, syncCanvasSchema]);

  const handleDelete = useCallback(() => {
    withSelected((selected) => selected.remove());
  }, [withSelected]);

  const handleUndo = useCallback(() => {
    editor?.UndoManager.undo();
    if (editor) syncCanvasSchema(editor);
  }, [editor, syncCanvasSchema]);

  const handleRedo = useCallback(() => {
    editor?.UndoManager.redo();
    if (editor) syncCanvasSchema(editor);
  }, [editor, syncCanvasSchema]);

  const handleDuplicate = useCallback(() => {
    withSelected((selected) => {
      const parent = selected.parent();
      if (!parent) return;

      const collection = parent.components();
      const index = collection.models.indexOf(selected);
      const cloneJson = selected.toJSON() as Record<string, unknown>;
      const style = (cloneJson.style ?? {}) as Record<string, string | number | undefined>;
      cloneJson.style = {
        ...style,
        left: `${parseNumericValue(style.left, 0) + 24}px`,
        top: `${parseNumericValue(style.top, 0) + 24}px`,
      };
      const next = unwrapAddedComponent(collection.add(cloneJson, { at: index + 1 }));
      selectComponent(editor, next);
    });
  }, [editor, withSelected]);

  const moveLayer = useCallback((direction: 'up' | 'down') => {
    withSelected((selected) => {
      const parent = selected.parent();
      if (!parent) return;

      const collection = parent.components();
      const current = collection.models.indexOf(selected);
      const nextIndex = direction === 'up' ? current + 1 : current - 1;
      if (nextIndex < 0 || nextIndex >= collection.models.length) return;

      const data = selected.toJSON();
      selected.remove();
      const moved = unwrapAddedComponent(collection.add(data, { at: nextIndex }));
      selectComponent(editor, moved);
    });
  }, [editor, withSelected]);

  const handleGroup = useCallback(() => {
    withSelected((selected) => {
      const parent = selected.parent();
      if (!parent) return;

      const collection = parent.components();
      const currentIndex = collection.models.indexOf(selected);
      const selectedStyle = selected.getStyle?.() ?? {};
      const selectedJson = selected.toJSON();
      selected.remove();

      const wrapperData = {
        tagName: 'div',
        attributes: { 'data-dc-type': 'group' },
        style: {
          position: selectedStyle.position || 'absolute',
          left: selectedStyle.left || '64px',
          top: selectedStyle.top || '64px',
          width: selectedStyle.width || '300px',
          height: selectedStyle.height || '200px',
          padding: '10px',
          border: '1px dashed #94a3b8',
          'border-radius': '12px',
          'background-color': 'rgba(248, 250, 252, 0.62)',
        },
        components: [selectedJson],
      };

      const group = unwrapAddedComponent(collection.add(wrapperData, { at: currentIndex }));
      selectComponent(editor, group);
    });
  }, [editor, withSelected]);

  return {
    withSelected,
    handleDelete,
    handleUndo,
    handleRedo,
    handleDuplicate,
    moveLayer,
    handleGroup,
  };
}
