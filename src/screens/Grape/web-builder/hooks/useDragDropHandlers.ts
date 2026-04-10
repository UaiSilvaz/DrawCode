import { useCallback, useEffect } from 'react';
import type { DragEvent } from 'react';
import type { EditorInstance } from '../builder-core';
import type { SidebarBlockItem } from '../../builder-blocks/types';
import { unwrapAddedComponent, selectComponent, applySnapForComponent } from '../builder-core';

export function useDragDropHandlers(
  editor: EditorInstance | null,
  sidebarBlocks: SidebarBlockItem[],
  snapRef: React.MutableRefObject<boolean>,
  syncCanvasSchema: (instance: EditorInstance) => void,
  draggedBlockIdRef: React.MutableRefObject<string | null>,
  draggedBlockRef: React.MutableRefObject<SidebarBlockItem | null>,
) {
  const handleInsertBlock = useCallback((payload: SidebarBlockItem | string) => {
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
    if (draggedItem && draggedItem.id === blockId) {
      handleInsertBlock(draggedItem);
    } else {
      const fallbackItem = sidebarBlocks.find((item) => item.id === blockId);
      if (fallbackItem) handleInsertBlock(fallbackItem);
      else handleInsertBlock(blockId);
    }
    draggedBlockRef.current = null;
    draggedBlockIdRef.current = null;
  }, [draggedBlockRef, draggedBlockIdRef, handleInsertBlock, sidebarBlocks]);

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
      if (draggedItem && draggedItem.id === droppedId) {
        handleInsertBlock(draggedItem);
      } else {
        const fallbackItem = sidebarBlocks.find((item) => item.id === droppedId);
        if (fallbackItem) handleInsertBlock(fallbackItem);
        else handleInsertBlock(droppedId);
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
  }, [editor, handleInsertBlock, sidebarBlocks, draggedBlockIdRef, draggedBlockRef]);

  return {
    handleInsertBlock,
    handleBlockDragStart,
    handleCanvasDragOver,
    handleCanvasDrop,
  };
}
