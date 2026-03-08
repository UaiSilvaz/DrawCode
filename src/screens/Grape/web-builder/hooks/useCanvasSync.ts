import { useCallback, useRef } from 'react';
import type { EditorInstance, CanvasPage, CanvasElementNode, AnyComponent } from '../builder-core';
import { serializeCanvas } from '../builder-core';

export function useCanvasSync(
  editor: EditorInstance | null,
  pagesRef: React.MutableRefObject<CanvasPage[]>,
  activePageIndexRef: React.MutableRefObject<number>,
  setCanvasStructure: (schema: CanvasElementNode[]) => void,
) {
  const lastSchemaKeyRef = useRef('');

  const syncCanvasSchema = useCallback((instance: EditorInstance) => {
    const next = serializeCanvas(instance);
    const nextKey = JSON.stringify(next);
    if (nextKey !== lastSchemaKeyRef.current) {
      lastSchemaKeyRef.current = nextKey;
      setCanvasStructure(next);
    }
    return next;
  }, [setCanvasStructure]);

  const snapshotCurrentPage = useCallback(() => {
    if (!editor) return;
    const idx = activePageIndexRef.current;
    const current = pagesRef.current[idx];
    if (!current) return;

    const nextPage: CanvasPage = {
      ...current,
      components: editor.getComponents() as unknown as unknown[],
      styles: editor.getStyle() as unknown,
      schema: serializeCanvas(editor),
    };

    const nextPages = [...pagesRef.current];
    nextPages[idx] = nextPage;
    pagesRef.current = nextPages;
    return nextPages;
  }, [editor, activePageIndexRef, pagesRef]);

  const applyPageToCanvas = useCallback((page: CanvasPage) => {
    if (!editor) return;
    const wrapper = editor.getWrapper() as unknown as AnyComponent | null;
    if (!wrapper) return;

    wrapper.components().reset(page.components ?? []);
    editor.setStyle((page.styles as never) ?? ([] as never));
    syncCanvasSchema(editor);
  }, [editor, syncCanvasSchema]);

  return {
    syncCanvasSchema,
    snapshotCurrentPage,
    applyPageToCanvas,
  };
}
