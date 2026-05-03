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
      const zoomDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX)
        ? event.deltaY
        : event.deltaX;
      if (!Number.isFinite(zoomDelta) || Math.abs(zoomDelta) < 0.01) return;
      event.preventDefault();
      const sensitivity = event.ctrlKey || event.metaKey ? 0.08 : 0.06;
      const nextZoom = zoomRef.current - zoomDelta * sensitivity;
      setCanvasZoom(nextZoom);
    };

    const touchDistance = (event: TouchEvent) => {
      if (event.touches.length < 2) return null;
      const first = event.touches[0];
      const second = event.touches[1];
      if (!first || !second) return null;
      return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
    };

    let pinchState: { distance: number; zoom: number } | null = null;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) return;
      const distance = touchDistance(event);
      if (!distance) return;
      event.preventDefault();
      pinchState = {
        distance,
        zoom: zoomRef.current,
      };
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!pinchState || event.touches.length !== 2) return;
      const distance = touchDistance(event);
      if (!distance) return;
      event.preventDefault();
      const ratio = distance / pinchState.distance;
      setCanvasZoom(pinchState.zoom * ratio);
    };

    const onTouchEnd = () => {
      pinchState = null;
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
    shell.addEventListener('touchstart', onTouchStart, { passive: false });
    shell.addEventListener('touchmove', onTouchMove, { passive: false });
    shell.addEventListener('touchend', onTouchEnd);
    shell.addEventListener('touchcancel', onTouchEnd);
    canvasDoc.addEventListener('wheel', onWheel, { passive: false });
    canvasDoc.addEventListener('mousedown', onMouseDown);
    canvasDoc.addEventListener('mousemove', onMouseMove);
    canvasDoc.addEventListener('mouseup', onMouseUp);
    canvasDoc.addEventListener('touchstart', onTouchStart, { passive: false });
    canvasDoc.addEventListener('touchmove', onTouchMove, { passive: false });
    canvasDoc.addEventListener('touchend', onTouchEnd);
    canvasDoc.addEventListener('touchcancel', onTouchEnd);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      shell.removeEventListener('wheel', onWheel);
      shell.removeEventListener('mousedown', onMouseDown);
      shell.removeEventListener('touchstart', onTouchStart);
      shell.removeEventListener('touchmove', onTouchMove);
      shell.removeEventListener('touchend', onTouchEnd);
      shell.removeEventListener('touchcancel', onTouchEnd);
      canvasDoc.removeEventListener('wheel', onWheel);
      canvasDoc.removeEventListener('mousedown', onMouseDown);
      canvasDoc.removeEventListener('mousemove', onMouseMove);
      canvasDoc.removeEventListener('mouseup', onMouseUp);
      canvasDoc.removeEventListener('touchstart', onTouchStart);
      canvasDoc.removeEventListener('touchmove', onTouchMove);
      canvasDoc.removeEventListener('touchend', onTouchEnd);
      canvasDoc.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [editor, canvasShellRef, zoomRef, spacePressedRef, beginPan, movePan, endPan, setCanvasZoom]);
}
