import { useCallback, useEffect } from 'react';
import type { DragEvent } from 'react';
import type { EditorInstance } from '../builder-core';
import type { SidebarBlockItem } from '../../builder-blocks/types';
import { unwrapAddedComponent, selectComponent, applySnapForComponent } from '../builder-core';

type DropPointEvent = {
  clientX: number;
  clientY: number;
};

export function useDragDropHandlers(
  editor: EditorInstance | null,
  sidebarBlocks: SidebarBlockItem[],
  snapRef: React.MutableRefObject<boolean>,
  syncCanvasSchema: (instance: EditorInstance) => void,
  draggedBlockIdRef: React.MutableRefObject<string | null>,
  draggedBlockRef: React.MutableRefObject<SidebarBlockItem | null>,
) {
  const getDropStyle = useCallback((event: DropPointEvent): Record<string, string> => {
    if (!editor) return {};

    const canvasApi = (editor as { Canvas?: { getDocument?: () => Document | null } }).Canvas;
    const canvasDoc = canvasApi?.getDocument?.();
    const body = canvasDoc?.body;
    if (!body) return {};

    const rect = body.getBoundingClientRect();
    if (!rect.width || !rect.height) return {};

    const x = Math.max(0, Math.min(body.clientWidth, event.clientX - rect.left));
    const y = Math.max(0, event.clientY - rect.top);

    return {
      left: `${Math.round(x)}px`,
      top: `${Math.round(y)}px`,
    };
  }, [editor]);

  const handleInsertBlock = useCallback((
    payload: SidebarBlockItem | string,
    styleOverrides: Record<string, string> = {},
  ) => {
    if (!editor) return;
    const fromSidebarItem = typeof payload !== 'string' ? payload : null;
    const safeBlockId = typeof payload === 'string' ? payload.trim() : payload.id.trim();
    if (!safeBlockId) return;

    const block = editor.BlockManager.get(safeBlockId);
    const content = fromSidebarItem?.content ?? block?.get('content');
    if (!content) return;

    const added = editor.addComponents(content as never);
    const inserted = unwrapAddedComponent(added);
    if (inserted) {
      const currentStyle = inserted.getStyle?.() ?? {};
      const sanitizedStyle = Object.fromEntries(
        Object.entries(currentStyle).filter(([, value]) => value !== undefined),
      ) as Record<string, string | number>;
      inserted.setStyle({
        ...sanitizedStyle,
        ...styleOverrides,
      });
      if (snapRef.current) applySnapForComponent(inserted);
      selectComponent(editor, inserted);
    }

    syncCanvasSchema(editor);
  }, [editor, snapRef, syncCanvasSchema]);

  const handleBlockDragStart = useCallback((item: SidebarBlockItem, event: DragEvent<HTMLButtonElement>) => {
    draggedBlockRef.current = item;
    draggedBlockIdRef.current = item.id;
    event.dataTransfer.setData('application/x-drawcode-block', item.id);
    event.dataTransfer.effectAllowed = 'copy';
  }, [draggedBlockIdRef, draggedBlockRef]);

  const handleCanvasDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleCanvasDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const blockId =
      event.dataTransfer.getData('application/x-drawcode-block') ||
      draggedBlockIdRef.current;
    const draggedItem = draggedBlockRef.current;
    if (!blockId) return;
    const dropStyle = getDropStyle(event);
    if (draggedItem && draggedItem.id === blockId) {
      handleInsertBlock(draggedItem, dropStyle);
    } else {
      const fallbackItem = sidebarBlocks.find((item) => item.id === blockId);
      if (fallbackItem) handleInsertBlock(fallbackItem, dropStyle);
      else handleInsertBlock(blockId, dropStyle);
    }
    draggedBlockRef.current = null;
    draggedBlockIdRef.current = null;
  }, [draggedBlockRef, draggedBlockIdRef, getDropStyle, handleInsertBlock, sidebarBlocks]);

  // Setup canvas document drag and drop
  useEffect(() => {
    if (!editor) return;
    const canvasApi = (editor as { Canvas?: { getDocument?: () => Document | null } }).Canvas;
    const canvasDoc = canvasApi?.getDocument?.();
    if (!canvasDoc) return;

    const onDragOver = (event: globalThis.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    };

    const onDrop = (event: globalThis.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const droppedId =
        event.dataTransfer?.getData('application/x-drawcode-block') ||
        draggedBlockIdRef.current;
      if (!droppedId) return;

      const draggedItem = draggedBlockRef.current;
      const dropStyle = getDropStyle(event);
      if (draggedItem && draggedItem.id === droppedId) {
        handleInsertBlock(draggedItem, dropStyle);
      } else {
        const fallbackItem = sidebarBlocks.find((item) => item.id === droppedId);
        if (fallbackItem) handleInsertBlock(fallbackItem, dropStyle);
        else handleInsertBlock(droppedId, dropStyle);
      }

      draggedBlockRef.current = null;
      draggedBlockIdRef.current = null;
    };

    canvasDoc.addEventListener('dragover', onDragOver);
    canvasDoc.addEventListener('drop', onDrop);

    return () => {
      canvasDoc.removeEventListener('dragover', onDragOver);
      canvasDoc.removeEventListener('drop', onDrop);
    };
  }, [editor, getDropStyle, handleInsertBlock, sidebarBlocks, draggedBlockIdRef, draggedBlockRef]);

  return {
    handleInsertBlock,
    handleBlockDragStart,
    handleCanvasDragOver,
    handleCanvasDrop,
  };
}
