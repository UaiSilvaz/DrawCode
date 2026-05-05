import { useCallback, useEffect, useRef } from 'react';
import type { EditorInstance, CanvasPage } from '../builder-core';
import {
  cloneSerializable,
  getSerializableComponents,
  getSerializableProjectData,
  getSerializableStyles,
  serializeCanvas,
} from '../builder-core';
import type { CanvasDeviceMode } from '../../builder-blocks/types';

export function useSaveHandler(
  editor: EditorInstance | null,
  userId: string | undefined,
  isOnline: boolean,
  currentProjectId: string,
  projectName: string,
  setSaving: (saving: boolean) => void,
  setSaveMsg: (msg: string) => void,
  setCurrentProjectId: (id: string) => void,
  pagesRef: React.MutableRefObject<CanvasPage[]>,
  activePageIndexRef: React.MutableRefObject<number>,
  snapshotCurrentPage: () => void,
  activeDeviceMode: CanvasDeviceMode,
) {
  const inFlightRef = useRef(false);
  const queuedAutoSaveRef = useRef(false);
  const currentProjectIdRef = useRef(currentProjectId);
  const saveProjectRef = useRef<(mode: 'manual' | 'auto') => Promise<boolean>>(
    async () => false,
  );

  useEffect(() => {
    currentProjectIdRef.current = currentProjectId;
  }, [currentProjectId]);

  const saveProject = useCallback(async (mode: 'manual' | 'auto') => {
    if (!editor || !userId) {
      if (mode === 'manual') {
        setSaveMsg('Faca login para salvar projetos.');
      }
      return false;
    }

    if (!isOnline) {
      if (mode === 'manual') {
        setSaveMsg('Sem internet. Conecte-se para salvar.');
      }
      return false;
    }

    if (inFlightRef.current) {
      if (mode === 'auto') {
        queuedAutoSaveRef.current = true;
      } else {
        setSaveMsg('Salvamento em andamento.');
      }
      return false;
    }

    inFlightRef.current = true;
    setSaving(true);
    setSaveMsg(mode === 'auto' ? 'Salvando automaticamente...' : '');

    try {
      snapshotCurrentPage();
      const schema = serializeCanvas(editor);
      const pages = cloneSerializable<CanvasPage[]>(pagesRef.current, []);

      const data = {
        components: getSerializableComponents(editor),
        styles: getSerializableStyles(editor),
        html: editor.getHtml(),
        css: editor.getCss(),
        schema,
        pageHeight: pagesRef.current[activePageIndexRef.current]?.height,
        pages,
        activePageIndex: activePageIndexRef.current,
        activeDeviceMode,
        projectData: getSerializableProjectData(editor),
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch('/api/grape/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectIdRef.current,
          name: projectName,
          data,
        }),
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeout);
      });

      const result = await res.json().catch(() => ({} as { error?: unknown; project?: { id?: unknown } }));

      if (!res.ok) {
        if (res.status === 401) {
          setSaveMsg('Sessao expirada. Faca login para salvar.');
          return false;
        }

        const fallbackError = mode === 'auto'
          ? 'Auto-save pausado: falha ao comunicar com servidor.'
          : 'Erro ao salvar projeto.';
        const errorMessage = result && typeof result === 'object' && 'error' in result
          ? String(result.error ?? fallbackError)
          : fallbackError;
        setSaveMsg(`Erro: ${errorMessage}`);
        return false;
      }

      const projectResult = result && typeof result === 'object' && 'project' in result
        ? result.project as { id?: unknown } | undefined
        : undefined;
      const savedProjectId = String(projectResult?.id ?? currentProjectIdRef.current);
      currentProjectIdRef.current = savedProjectId;
      setCurrentProjectId(savedProjectId);
      if (mode === 'manual') {
        setSaveMsg('Projeto salvo.');
      } else {
        const now = new Date();
        const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        setSaveMsg(`Salvo automaticamente as ${time}.`);
      }
      setTimeout(() => setSaveMsg(''), mode === 'manual' ? 2800 : 1800);
      return true;
    } catch {
      setSaveMsg(mode === 'auto'
        ? 'Auto-save pausado: sem conexao com servidor.'
        : 'Erro de conexao.');
      return false;
    } finally {
      inFlightRef.current = false;
      setSaving(false);
      if (queuedAutoSaveRef.current) {
        queuedAutoSaveRef.current = false;
        setTimeout(() => {
          void saveProjectRef.current('auto');
        }, 250);
      }
    }
  }, [
    editor,
    userId,
    isOnline,
    projectName,
    setSaving,
    setSaveMsg,
    setCurrentProjectId,
    pagesRef,
    activePageIndexRef,
    snapshotCurrentPage,
    activeDeviceMode,
  ]);

  saveProjectRef.current = saveProject;

  const handleSave = useCallback(async () => {
    await saveProject('manual');
  }, [saveProject]);

  const handleAutoSave = useCallback(async () => {
    await saveProject('auto');
  }, [saveProject]);

  return { handleSave, handleAutoSave };
}
