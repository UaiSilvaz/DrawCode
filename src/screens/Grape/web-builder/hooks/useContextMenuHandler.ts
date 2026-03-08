import { useEffect } from 'react';
import type { EditorInstance } from '../builder-core';
import type { Dispatch, SetStateAction } from 'react';
import type { ContextMenuState } from '../../builder-blocks/types';

export function useContextMenuHandler(
  editor: EditorInstance | null,
  setContextMenu: Dispatch<SetStateAction<ContextMenuState>>,
  closeContextMenu: () => void,
) {
  useEffect(() => {
    if (!editor) return;

    const canvasApi = (
      editor as {
        Canvas?: {
          getDocument?: () => Document | null;
          getFrameEl?: () => HTMLIFrameElement | null;
        };
      }
    ).Canvas;
    const canvasDoc = canvasApi?.getDocument?.();
    const frameEl = canvasApi?.getFrameEl?.();
    if (!canvasDoc || !frameEl) return;

    const onContextMenu = (event: MouseEvent) => {
      const selected = editor.getSelected();
      if (!selected) return;

      event.preventDefault();

      const frameRect = frameEl.getBoundingClientRect();
      const menuWidth = 210;
      const menuHeight = 280;
      const nextX = Math.min(frameRect.left + event.clientX, window.innerWidth - menuWidth);
      const nextY = Math.min(frameRect.top + event.clientY, window.innerHeight - menuHeight);
      setContextMenu({ open: true, x: Math.max(10, nextX), y: Math.max(10, nextY) });
    };

    const onAnyClick = () => closeContextMenu();
    const onScroll = () => closeContextMenu();

    canvasDoc.addEventListener('contextmenu', onContextMenu);
    canvasDoc.addEventListener('mousedown', onAnyClick);
    window.addEventListener('mousedown', onAnyClick);
    window.addEventListener('resize', onAnyClick);
    window.addEventListener('scroll', onScroll, true);

    return () => {
      canvasDoc.removeEventListener('contextmenu', onContextMenu);
      canvasDoc.removeEventListener('mousedown', onAnyClick);
      window.removeEventListener('mousedown', onAnyClick);
      window.removeEventListener('resize', onAnyClick);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [editor, closeContextMenu, setContextMenu]);
}
