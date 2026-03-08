import { useEffect } from 'react';
import type { EditorInstance } from '../builder-core';
import { isInputElement } from '../builder-core';
import type { DrawToolId, LeftPanelMode } from '../../builder-blocks/types';

export function useKeyboardShortcuts(
  editor: EditorInstance | null,
  handleDelete: () => void,
  handleDuplicate: () => void,
  handleUndo: () => void,
  handleRedo: () => void,
  closeContextMenu: () => void,
  activeDrawTool: DrawToolId,
  setLeftPanelMode: (mode: LeftPanelMode) => void,
  setLeftSidebarCollapsed: (value: boolean) => void,
  setActiveDrawTool: (toolId: DrawToolId) => void,
) {
  useEffect(() => {
    const activateDrawTool = (toolId: DrawToolId) => {
      setLeftSidebarCollapsed(false);
      setLeftPanelMode('draw');
      setActiveDrawTool(toolId);
      closeContextMenu();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!editor || isInputElement(event.target)) return;
      const isMeta = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (event.key === 'Delete') {
        event.preventDefault();
        handleDelete();
        closeContextMenu();
        return;
      }

      if (isMeta && key === 'd') {
        event.preventDefault();
        handleDuplicate();
        closeContextMenu();
        return;
      }

      if (isMeta && !event.shiftKey && key === 'z') {
        event.preventDefault();
        handleUndo();
        closeContextMenu();
        return;
      }

      if (isMeta && (key === 'y' || (event.shiftKey && key === 'z'))) {
        event.preventDefault();
        handleRedo();
        closeContextMenu();
        return;
      }

      if (event.key === 'Escape') {
        closeContextMenu();
        return;
      }

      if (isMeta || event.altKey) return;

      if (key === 'p') {
        event.preventDefault();
        activateDrawTool('pencil');
        return;
      }

      if (key === 's') {
        event.preventDefault();
        activateDrawTool('select');
        return;
      }

      if (key === 'l') {
        event.preventDefault();
        activateDrawTool('line');
        return;
      }

      if (key === 'f') {
        event.preventDefault();
        const nextShapeTool = ['square', 'circle', 'triangle'].includes(activeDrawTool)
          ? activeDrawTool
          : 'square';
        activateDrawTool(nextShapeTool);
        return;
      }

      if (key === 't') {
        event.preventDefault();
        activateDrawTool('text');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    editor,
    handleDelete,
    handleDuplicate,
    handleRedo,
    handleUndo,
    closeContextMenu,
    activeDrawTool,
    setLeftPanelMode,
    setLeftSidebarCollapsed,
    setActiveDrawTool,
  ]);
}
