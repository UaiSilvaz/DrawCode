import { useEffect } from 'react';
import type { EditorInstance } from '../builder-core';
import { isInputElement } from '../builder-core';

export function useEditorEventListeners(
  editor: EditorInstance | null,
  canvasShellRef: React.MutableRefObject<HTMLDivElement | null>,
  zoomRef: React.MutableRefObject<number>,
  spacePressedRef: React.MutableRefObject<boolean>,
  beginPan: (x: number, y: number) => void,
  movePan: (x: number, y: number) => void,
  endPan: () => void,
  setCanvasZoom: (zoom: number) => void,
) {
  // Wheel and mouse events for panning and zooming
  useEffect(() => {
    if (!editor) return;
    const shell = canvasShellRef.current;
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
    if (!shell || !canvasDoc || !frameEl) return;

    const toViewportPointer = (event: MouseEvent) => {
      // Mouse events from inside the Grapes iframe use iframe-local coordinates.
      if (event.view === canvasDoc.defaultView) {
        const frameRect = frameEl.getBoundingClientRect();
        return {
          x: event.clientX + frameRect.left,
          y: event.clientY + frameRect.top,
        };
      }
      return {
        x: event.clientX,
        y: event.clientY,
      };
    };

    const onWheel = (event: WheelEvent) => {
      const isZoomGesture = event.ctrlKey || event.metaKey;
      if (!isZoomGesture) return;
      event.preventDefault();

      const nextZoom = zoomRef.current - event.deltaY * 0.08;
      setCanvasZoom(nextZoom);
    };

    const onMouseDown = (event: MouseEvent) => {
      const shouldPan = (
        event.button === 1 ||
        (event.button === 0 && spacePressedRef.current)
      );
      if (!shouldPan) return;
      event.preventDefault();
      const pointer = toViewportPointer(event);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (beginPan as any)(pointer.x, pointer.y);
    };

    const onMouseMove = (event: MouseEvent) => {
      const pointer = toViewportPointer(event);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (movePan as any)(pointer.x, pointer.y);
    };

    const onMouseUp = () => endPan();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !isInputElement(event.target)) {
        spacePressedRef.current = true;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        spacePressedRef.current = false;
        endPan();
      }
    };

    shell.addEventListener('wheel', onWheel, { passive: false });
    shell.addEventListener('mousedown', onMouseDown);
    canvasDoc.addEventListener('wheel', onWheel, { passive: false });
    canvasDoc.addEventListener('mousedown', onMouseDown);
    canvasDoc.addEventListener('mousemove', onMouseMove);
    canvasDoc.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      shell.removeEventListener('wheel', onWheel);
      shell.removeEventListener('mousedown', onMouseDown);
      canvasDoc.removeEventListener('wheel', onWheel);
      canvasDoc.removeEventListener('mousedown', onMouseDown);
      canvasDoc.removeEventListener('mousemove', onMouseMove);
      canvasDoc.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [editor, canvasShellRef, zoomRef, spacePressedRef, beginPan, movePan, endPan, setCanvasZoom]);
}
