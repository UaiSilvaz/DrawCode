import { useCallback } from 'react';
import type { EditorInstance, CanvasPage } from '../builder-core';
import { serializeCanvas } from '../builder-core';

export function useSaveHandler(
  editor: EditorInstance | null,
  userId: string | undefined,
  currentProjectId: string,
  projectName: string,
  setSaving: (saving: boolean) => void,
  setSaveMsg: (msg: string) => void,
  setCurrentProjectId: (id: string) => void,
  pagesRef: React.MutableRefObject<CanvasPage[]>,
  activePageIndexRef: React.MutableRefObject<number>,
  snapshotCurrentPage: () => void,
) {
  const handleSave = useCallback(async () => {
    if (!editor || !userId) {
      setSaveMsg('Faca login para salvar projetos.');
      return;
    }

    setSaving(true);
    setSaveMsg('');

    try {
      snapshotCurrentPage();
      const schema = serializeCanvas(editor);

      const data = {
        components: editor.getComponents(),
        styles: editor.getStyle(),
        html: editor.getHtml(),
        css: editor.getCss(),
        schema,
        pages: pagesRef.current,
        activePageIndex: activePageIndexRef.current,
      };

      const res = await fetch('/api/grape/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          name: projectName,
          data,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setSaveMsg(`Erro: ${result.error}`);
      } else {
        setCurrentProjectId(result.project.id);
        setSaveMsg('Projeto salvo.');
        setTimeout(() => setSaveMsg(''), 3000);
      }
    } catch {
      setSaveMsg('Erro de conexao.');
    } finally {
      setSaving(false);
    }
  }, [editor, userId, currentProjectId, projectName, setSaving, setSaveMsg, setCurrentProjectId, pagesRef, activePageIndexRef, snapshotCurrentPage]);

  return { handleSave };
}
