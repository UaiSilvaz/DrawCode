import { useCallback } from 'react';
import type { ChangeEvent } from 'react';
import type { EditorInstance, CanvasPage, CanvasElementNode } from '../builder-core';
import {
  extractImportedNodes,
  getCanvasSchemaHeight,
  getSerializableStyles,
  inferTypeFromComponent,
  nodeToComponent,
  normalizePagePath,
  serializeCanvas,
} from '../builder-core';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = any;

export function useFileHandlers(
  editor: EditorInstance | null,
  projectName: string,
  setSaveMsg: (msg: string) => void,
  syncCanvasSchema: (instance: EditorInstance) => void,
) {
  const buildExportPayload = useCallback((pagesRef: React.MutableRefObject<CanvasPage[]>, activePageIndexRef: React.MutableRefObject<number>) => {
    if (!editor) return null;
    const schema = serializeCanvas(editor);
    return {
      projectName,
      exportedAt: new Date().toISOString(),
      schema,
      pages: pagesRef.current,
      activePageIndex: activePageIndexRef.current,
    };
  }, [editor, projectName]);

  const handleExportJson = useCallback((pagesRef: React.MutableRefObject<CanvasPage[]>, activePageIndexRef: React.MutableRefObject<number>, snapshotCurrentPage: () => void) => {
    snapshotCurrentPage();
    const payload = buildExportPayload(pagesRef, activePageIndexRef);
    if (!payload) return;

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    link.href = url;
    link.download = `${safeName || 'projeto'}-canvas.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [buildExportPayload, projectName]);

  const importSchema = useCallback((nodes: CanvasElementNode[]) => {
    if (!editor) return;
    const wrapper = editor.getWrapper();
    if (!wrapper) return;
    const components = nodes.map(nodeToComponent);
    wrapper.components().reset(components);
    syncCanvasSchema(editor);
  }, [editor, syncCanvasSchema]);

  const handleImportFile = useCallback(
    async (
      event: ChangeEvent<HTMLInputElement>,
      pagesRef: React.MutableRefObject<CanvasPage[]>,
      activePageIndexRef: React.MutableRefObject<number>,
      setPages: (pages: CanvasPage[]) => void,
      setActivePageIndex: (index: number) => void,
      applyPageToCanvas: (page: CanvasPage) => void,
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as unknown as { pages?: CanvasPage[]; activePageIndex?: number };
        if (Array.isArray(parsed?.pages) && parsed.pages.length > 0) {
          const safePages = parsed.pages.map((page, index) => ({
            id: page.id || `page-${index + 1}`,
            name: normalizePagePath(String(page.name || ''), index === 0 ? '/home' : `/page-${index + 1}`),
            components: Array.isArray(page.components) ? page.components : [],
            styles: page.styles ?? [],
            schema: Array.isArray(page.schema) ? page.schema : [],
            height: typeof page.height === 'number' ? page.height : getCanvasSchemaHeight(Array.isArray(page.schema) ? page.schema : []),
          }));
          const targetIndex = Math.max(0, Math.min(parsed.activePageIndex ?? 0, safePages.length - 1));
          pagesRef.current = safePages;
          setPages(safePages);
          setActivePageIndex(targetIndex);
          activePageIndexRef.current = targetIndex;
          applyPageToCanvas(safePages[targetIndex] as CanvasPage);
          setSaveMsg('JSON importado com sucesso.');
        } else {
          const nodes = extractImportedNodes(parsed);
          if (!nodes.length) {
            setSaveMsg('JSON invalido para importacao.');
            return;
          }

          importSchema(nodes);
          const singlePage: CanvasPage = {
            id: 'page-1',
            name: '/home',
            components: nodes.map(nodeToComponent),
            styles: editor ? getSerializableStyles(editor) : [],
            schema: nodes,
            height: getCanvasSchemaHeight(nodes),
          };
          pagesRef.current = [singlePage];
          setPages([singlePage]);
          setActivePageIndex(0);
          activePageIndexRef.current = 0;
          setSaveMsg('JSON importado com sucesso.');
        }
      } catch {
        setSaveMsg('Falha ao importar JSON.');
      } finally {
        event.target.value = '';
        setTimeout(() => setSaveMsg(''), 3000);
      }
    },
    [editor, importSchema, setSaveMsg],
  );

  const handleImageUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !editor) return;

      const selected = editor.getSelected() as unknown as AnyComponent | null;
      if (!selected) {
        setSaveMsg('Selecione uma imagem no canvas antes do upload.');
        event.target.value = '';
        return;
      }

      const tagName = String(selected.get('tagName') ?? '').toLowerCase();
      const selectedType = inferTypeFromComponent(selected);
      if (tagName !== 'img' && !selectedType.includes('image')) {
        setSaveMsg('Selecione uma imagem no canvas antes do upload.');
        event.target.value = '';
        return;
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => reject(new Error('Falha ao ler imagem'));
        reader.readAsDataURL(file);
      }).catch(() => '');

      if (!dataUrl) {
        setSaveMsg('Falha ao carregar imagem.');
        event.target.value = '';
        return;
      }

      const attrs = selected.getAttributes?.() ?? {};
      selected.setAttributes({
        ...attrs,
        src: dataUrl,
        alt: attrs.alt || file.name || 'Imagem',
      });
      syncCanvasSchema(editor);
      setSaveMsg('Imagem atualizada.');
      setTimeout(() => setSaveMsg(''), 2500);
      event.target.value = '';
    },
    [editor, syncCanvasSchema, setSaveMsg],
  );

  return {
    buildExportPayload,
    handleExportJson,
    importSchema,
    handleImportFile,
    handleImageUpload,
  };
}
