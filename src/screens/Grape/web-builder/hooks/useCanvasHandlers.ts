import { useCallback } from 'react';
import type { EditorInstance, CanvasCoordsApi } from '../builder-core';

type ZoomAnchor = {
  clientX: number;
  clientY: number;
} | null;

export function useCanvasHandlers(
  editor: EditorInstance | null,
  zoomRef: React.MutableRefObject<number>,
  setZoomLevel: (level: number) => void,
  canvasShellRef: React.MutableRefObject<HTMLDivElement | null>,
) {
  const refreshCanvasOverlays = useCallback(() => {
    if (!editor) return;
    window.requestAnimationFrame(() => {
      (editor as unknown as { refresh?: () => void }).refresh?.();
      (editor as unknown as { Canvas?: { refresh?: () => void } }).Canvas?.refresh?.();
    });
  }, [editor]);

  const setCanvasZoom = useCallback((next: number, anchor: ZoomAnchor = null) => {
    if (!editor) return;
    const canvasApi = (editor as { Canvas?: { setZoom?: (value: number) => void } }).Canvas;
    if (!canvasApi?.setZoom) return;
    const shell = canvasShellRef.current;
    const previousZoom = Math.max(1, zoomRef.current);
    const clamped = Math.max(20, Math.min(300, Math.round(next)));
    if (clamped === zoomRef.current) return;

    const shellRect = shell?.getBoundingClientRect();
    const anchorOffset = shell && shellRect && anchor
      ? {
          x: anchor.clientX - shellRect.left,
          y: anchor.clientY - shellRect.top,
          scrollX: shell.scrollLeft,
          scrollY: shell.scrollTop,
        }
      : null;

    zoomRef.current = clamped;
    canvasApi.setZoom(clamped);
    setZoomLevel(clamped);

    if (shell && anchorOffset) {
      const ratio = clamped / previousZoom;
      window.requestAnimationFrame(() => {
        shell.scrollLeft = (anchorOffset.scrollX + anchorOffset.x) * ratio - anchorOffset.x;
        shell.scrollTop = (anchorOffset.scrollY + anchorOffset.y) * ratio - anchorOffset.y;
        refreshCanvasOverlays();
      });
      return;
    }

    refreshCanvasOverlays();
  }, [canvasShellRef, editor, refreshCanvasOverlays, setZoomLevel, zoomRef]);

  const panCanvasBy = useCallback((deltaX: number, deltaY: number) => {
    const shell = canvasShellRef.current;
    if (shell && (shell.scrollWidth > shell.clientWidth || shell.scrollHeight > shell.clientHeight)) {
      shell.scrollLeft -= deltaX;
      shell.scrollTop -= deltaY;
      refreshCanvasOverlays();
      return;
    }

    if (!editor) return;
    const canvas = (editor as { Canvas?: CanvasCoordsApi }).Canvas;
    if (!canvas?.getCoords || !canvas?.setCoords) return;
    const coords = canvas.getCoords();
    if (!coords || !Number.isFinite(coords.x) || !Number.isFinite(coords.y)) return;
    if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) return;
    canvas.setCoords(coords.x + deltaX, coords.y + deltaY);
    refreshCanvasOverlays();
  }, [canvasShellRef, editor, refreshCanvasOverlays]);

  const beginPan = useCallback((clientX: number, clientY: number, panStartRef: React.MutableRefObject<{ x: number; y: number } | null>, setIsPanning: (isPanning: boolean) => void) => {
    panStartRef.current = { x: clientX, y: clientY };
    setIsPanning(true);
  }, []);

  const movePan = useCallback((clientX: number, clientY: number, panStartRef: React.MutableRefObject<{ x: number; y: number } | null>) => {
    const start = panStartRef.current;
    if (!start) return false;
    const deltaX = clientX - start.x;
    const deltaY = clientY - start.y;
    panCanvasBy(deltaX, deltaY);
    panStartRef.current = { x: clientX, y: clientY };
    return true;
  }, [panCanvasBy]);

  const endPan = useCallback((panStartRef: React.MutableRefObject<{ x: number; y: number } | null>, setIsPanning: (isPanning: boolean) => void) => {
    panStartRef.current = null;
    setIsPanning(false);
  }, []);

  const handleZoomIn = useCallback((zoomLevel: number) => {
    setCanvasZoom(zoomLevel + 10);
  }, [setCanvasZoom]);

  const handleZoomOut = useCallback((zoomLevel: number) => {
    setCanvasZoom(zoomLevel - 10);
  }, [setCanvasZoom]);

  const handleZoomReset = useCallback(() => {
    setCanvasZoom(100);
  }, [setCanvasZoom]);

  const handleZoomSliderChange = useCallback((value: number) => {
    setCanvasZoom(value);
  }, [setCanvasZoom]);

  return {
    setCanvasZoom,
    panCanvasBy,
    beginPan,
    movePan,
    endPan,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleZoomSliderChange,
  };
}
