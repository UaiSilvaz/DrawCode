import { useEffect } from 'react';
import type { CanvasPage } from '../builder-core';

export function useSyncPageRefs(
  pages: CanvasPage[],
  pagesRef: React.MutableRefObject<CanvasPage[]>,
  activePageIndex: number,
  activePageIndexRef: React.MutableRefObject<number>,
  zoomLevel: number,
  zoomRef: React.MutableRefObject<number>,
  snapEnabled: boolean,
  snapRef: React.MutableRefObject<boolean>,
) {
  useEffect(() => {
    pagesRef.current = pages;
  }, [pages, pagesRef]);

  useEffect(() => {
    activePageIndexRef.current = activePageIndex;
  }, [activePageIndex, activePageIndexRef]);

  useEffect(() => {
    zoomRef.current = zoomLevel;
  }, [zoomLevel, zoomRef]);

  useEffect(() => {
    snapRef.current = snapEnabled;
  }, [snapEnabled, snapRef]);
}
