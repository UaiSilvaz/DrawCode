import { useCallback } from 'react';
import type { EditorInstance, CanvasCoordsApi } from '../builder-core';

export function useCanvasHandlers(editor: EditorInstance | null, zoomRef: React.MutableRefObject<number>, setZoomLevel: (level: number) => void) {
  const setCanvasZoom = useCallback((next: number) => {
    if (!editor) return;
    const canvasApi = (editor as { Canvas?: { setZoom?: (value: number) => void } }).Canvas;
    if (!canvasApi?.setZoom) return;
    const clamped = Math.max(20, Math.min(300, Math.round(next)));
    if (clamped === zoomRef.current) return;
    zoomRef.current = clamped;
    canvasApi.setZoom(clamped);
    setZoomLevel(clamped);
  }, [editor, setZoomLevel, zoomRef]);

  const panCanvasBy = useCallback((deltaX: number, deltaY: number) => {
    if (!editor) return;
    const canvas = (editor as { Canvas?: CanvasCoordsApi }).Canvas;
    if (!canvas?.getCoords || !canvas?.setCoords) return;
    const coords = canvas.getCoords();
    if (!coords || !Number.isFinite(coords.x) || !Number.isFinite(coords.y)) return;
    if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) return;
    canvas.setCoords(coords.x + deltaX, coords.y + deltaY);
  }, [editor]);

  const beginPan = useCallback((clientX: number, clientY: number, panStartRef: React.MutableRefObject<{ x: number; y: number } | null>, setIsPanning: (isPanning: boolean) => void) => {
    panStartRef.current = { x: clientX, y: clientY };
    setIsPanning(true);
  }, []);

  const movePan = useCallback((clientX: number, clientY: number, panStartRef: React.MutableRefObject<{ x: number; y: number } | null>) => {
    const start = panStartRef.current;
    if (!start) return;
    const deltaX = clientX - start.x;
    const deltaY = clientY - start.y;
    panCanvasBy(deltaX, deltaY);
    panStartRef.current = { x: clientX, y: clientY };
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
