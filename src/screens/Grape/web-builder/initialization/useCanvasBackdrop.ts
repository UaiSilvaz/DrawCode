import { useCallback } from 'react';
import type { EditorInstance } from '../builder-core';
import { GRID_STEP, PAGE_HEIGHT, PAGE_WIDTH } from '../builder-core';

export function useCanvasBackdrop() {
  const applyCanvasBackdrop = useCallback((instance: EditorInstance, enabled: boolean) => {
    const canvasApi = (instance as { Canvas?: { getDocument?: () => Document | null } }).Canvas;
    const doc = canvasApi?.getDocument?.();
    if (!doc?.body) return;

    doc.body.style.margin = '0';
    doc.body.style.width = `${PAGE_WIDTH}px`;
    doc.body.style.height = `${PAGE_HEIGHT}px`;
    doc.body.style.minHeight = `${PAGE_HEIGHT}px`;
    doc.body.style.maxHeight = `${PAGE_HEIGHT}px`;
    doc.body.style.overflow = 'hidden';
    doc.body.style.position = 'relative';
    doc.body.style.backgroundColor = '#ffffff';
    doc.body.style.border = '2px solid rgba(124, 58, 237, 0.95)';
    doc.body.style.borderRadius = '0px';
    doc.body.style.overflow = 'hidden';
    doc.body.style.boxShadow = '0 26px 70px rgba(2, 6, 23, 0.55)';
    doc.body.style.backgroundImage = enabled
      ? `linear-gradient(to right, rgba(148, 163, 184, 0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.22) 1px, transparent 1px)`
      : 'none';
    doc.body.style.backgroundSize = enabled ? `${GRID_STEP}px ${GRID_STEP}px` : 'auto';

    if (doc.documentElement) {
      doc.documentElement.style.background = '#0a0318';
      doc.documentElement.style.minHeight = '100%';
      doc.documentElement.style.height = '100%';
      doc.documentElement.style.overflow = 'hidden';
    }
  }, []);

  return { applyCanvasBackdrop };
}
