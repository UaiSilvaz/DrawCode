import { useCallback, useRef } from 'react';
import type { EditorInstance, CanvasPage, CanvasElementNode, AnyComponent } from '../builder-core';
import {
  cloneSerializable,
  getCanvasPageHeight,
  getSerializableComponents,
  getSerializableProjectData,
  getSerializableStyles,
  nodeToComponent,
  serializeCanvas,
} from '../builder-core';

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
      components: getSerializableComponents(editor),
      styles: getSerializableStyles(editor),
      schema: serializeCanvas(editor),
      height: getCanvasPageHeight(editor),
      html: editor.getHtml(),
      css: editor.getCss(),
      projectData: getSerializableProjectData(editor),
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

    const components = Array.isArray(page.components) && page.components.length > 0
      ? page.components
      : page.schema.map(nodeToComponent);

    const serializableComponents = cloneSerializable<unknown[]>(components, []);
    const serializableStyles = cloneSerializable(page.styles ?? [], []);

    if (typeof editor.setComponents === 'function') {
      editor.setComponents(serializableComponents as never);
    } else {
      wrapper.components().reset(serializableComponents);
    }

    editor.setStyle(serializableStyles as never);
    syncCanvasSchema(editor);
  }, [editor, syncCanvasSchema]);

  return {
    syncCanvasSchema,
    snapshotCurrentPage,
    applyPageToCanvas,
  };
}
