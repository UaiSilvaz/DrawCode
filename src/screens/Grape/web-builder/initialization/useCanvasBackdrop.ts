import { useCallback } from 'react';
import type { EditorInstance } from '../builder-core';
import { GRID_STEP, PAGE_HEIGHT } from '../builder-core';

export function useCanvasBackdrop() {
  const applyCanvasBackdrop = useCallback((instance: EditorInstance, enabled: boolean) => {
    const canvasApi = (instance as { Canvas?: { getDocument?: () => Document | null } }).Canvas;
    const doc = canvasApi?.getDocument?.();
    if (!doc?.body) return;

    doc.body.style.margin = '0';
    doc.body.style.boxSizing = 'border-box';
    doc.body.style.width = '100%';
    doc.body.style.maxWidth = 'none';
    doc.body.style.height = 'auto';
    doc.body.style.minHeight = `var(--dc-page-height, ${PAGE_HEIGHT}px)`;
    doc.body.style.maxHeight = 'none';
    doc.body.style.overflowX = 'hidden';
    doc.body.style.overflowY = 'visible';
    doc.body.style.position = 'relative';
    doc.body.style.backgroundColor = '#ffffff';
    doc.body.style.border = '2px solid rgba(124, 58, 237, 0.95)';
    doc.body.style.borderRadius = '0px';
    doc.body.style.boxShadow = 'none';
    doc.body.style.transform = 'none';
    doc.body.style.transformOrigin = 'top left';
    doc.body.style.backgroundImage = enabled
      ? `linear-gradient(to right, rgba(148, 163, 184, 0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.22) 1px, transparent 1px)`
      : 'none';
    doc.body.style.backgroundSize = enabled ? `${GRID_STEP}px ${GRID_STEP}px` : 'auto';

    if (doc.documentElement) {
      doc.documentElement.style.background = 'transparent';
      doc.documentElement.style.minHeight = '100%';
      doc.documentElement.style.height = 'auto';
      doc.documentElement.style.overflowX = 'hidden';
      doc.documentElement.style.overflowY = 'hidden';
    }
  }, []);

  return { applyCanvasBackdrop };
}
