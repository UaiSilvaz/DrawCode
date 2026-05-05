import grapesjs from 'grapesjs';
import type { EditorInstance, AnyComponent } from '../builder-core';
import { PAGE_HEIGHT, PAGE_WIDTH, slugify, stripHtml, applySnapForComponent } from '../builder-core';
import type { SidebarBlockItem } from '../../builder-blocks/types';
import blocksElements from '../../blocks-elements';

const CANVAS_BASE_CSS = `
* { box-sizing: border-box; }
html {
  background: transparent;
  width: 100%;
  min-height: 100%;
  height: auto;
  overflow-x: hidden;
  overflow-y: hidden;
}
body {
  margin: 0;
  width: 100%;
  height: auto;
  min-height: var(--dc-page-height, ${PAGE_HEIGHT}px);
  max-height: none;
  overflow-x: hidden;
  overflow-y: visible;
  background: #ffffff;
  position: relative;
  transform: none;
  transform-origin: top left;
  color: #0f172a;
}
body > * {
  box-sizing: border-box;
  max-width: 100%;
  overflow-wrap: anywhere;
}
img,
video,
iframe {
  max-width: 100%;
}
[data-dc-type] {
  box-sizing: border-box;
}
[data-dc-type="button"],
button {
  white-space: normal;
}
[data-dc-type*="image"],
img {
  object-fit: cover;
}
@media (max-width: 900px) {
  body {
    --dc-fluid-edge: clamp(20px, 4vw, 40px);
  }
  body > [style*="position: absolute"],
  body > [style*="position:absolute"] {
    left: var(--dc-fluid-edge) !important;
    max-width: calc(100% - (var(--dc-fluid-edge) * 2)) !important;
  }
  body > section,
  body > article,
  body > nav,
  body > footer,
  body > div[data-dc-type="container"],
  body > div[data-dc-type^="layout"],
  body > div[data-dc-type="card"] {
    width: calc(100% - (var(--dc-fluid-edge) * 2)) !important;
  }
  [style*="display: flex"],
  [style*="display:flex"] {
    flex-wrap: wrap !important;
  }
  [style*="grid-template-columns"] {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
  h1,
  [data-dc-type="title"] {
    font-size: clamp(30px, 7vw, 54px) !important;
    line-height: 1.08 !important;
  }
}
@media (max-width: 520px) {
  body {
    --dc-fluid-edge: 16px;
  }
  body > [style*="position: absolute"],
  body > [style*="position:absolute"] {
    left: 16px !important;
    width: calc(100% - 32px) !important;
    max-width: calc(100% - 32px) !important;
  }
  body > [data-dc-type="shape-circle"][style] {
    width: min(58vw, 220px) !important;
    height: min(58vw, 220px) !important;
  }
  body > [data-dc-type="shape-line"] {
    height: 4px !important;
  }
  body > [data-dc-type*="image"],
  body > img {
    height: auto !important;
    aspect-ratio: 16 / 9;
  }
  [style*="grid-template-columns"] {
    grid-template-columns: 1fr !important;
  }
  h1,
  [data-dc-type="title"] {
    font-size: clamp(28px, 11vw, 44px) !important;
  }
  p,
  [data-dc-type="paragraph"] {
    font-size: clamp(14px, 4.2vw, 17px) !important;
  }
}
`;

const injectCanvasBaseStyles = (instance: EditorInstance) => {
  const canvasApi = (instance as { Canvas?: { getDocument?: () => Document | null } }).Canvas;
  const doc = canvasApi?.getDocument?.();
  if (!doc?.head) return;

  const styleId = 'drawcode-canvas-base';
  let styleEl = doc.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = doc.createElement('style');
    styleEl.id = styleId;
    doc.head.appendChild(styleEl);
  }
  styleEl.textContent = CANVAS_BASE_CSS;
};

export function initializeGrapesJS(
  snapRef: { current: boolean },
  setSidebarBlocks: (blocks: SidebarBlockItem[]) => void,
  applyCanvasBackdrop: (instance: EditorInstance, enabled: boolean) => void,
  syncCanvasSchema: (instance: EditorInstance) => void,
): EditorInstance {
  const instance = grapesjs.init({
    container: '#gjs',
    height: '100%',
    width: '100%',
    fromElement: false,
    storageManager: false,
    dragMode: 'absolute',
    selectorManager: { componentFirst: true },
    devicePreviewMode: true,
    deviceManager: {
      devices: [
        {
          id: 'Desktop',
          name: 'Desktop',
          width: `${PAGE_WIDTH}px`,
          widthMedia: `${PAGE_WIDTH}px`,
        },
        {
          id: 'Tablet',
          name: 'Tablet',
          width: '900px',
          widthMedia: '900px',
        },
        {
          id: 'Phone',
          name: 'Phone',
          width: '390px',
          widthMedia: '390px',
        },
      ],
    },
    panels: { defaults: [] },
    blockManager: {},
    styleManager: {
      appendTo: '#styles',
      sectors: [
        {
          name: 'Aparencia',
          open: true,
          properties: ['background-color', 'color', 'opacity', 'border-radius'],
        },
        {
          name: 'Tamanho e Posicao',
          open: true,
          properties: ['width', 'height', 'left', 'top'],
        },
        {
          name: 'Texto',
          open: false,
          properties: ['font-size', 'text-align'],
        },
        {
          name: 'Borda',
          open: false,
          properties: ['border-width', 'border-color'],
        },
      ],
    },
    layerManager: { appendTo: '#layers' },
    traitManager: { appendTo: '#traits' },
    canvas: {
      customSpots: { target: true },
      styles: [],
    },
  });

  instance.Canvas.setCustomBadgeLabel(() => '');

  const removeTargetSpots = () => {
    instance.Canvas.removeSpots({ type: 'target' });
  };

  const hideComponentOverlayName = (component: AnyComponent) => {
    component.set('badgable', false);
    component.set('name', '');
    component.set('icon', '');
  };

  blocksElements(instance);
  injectCanvasBaseStyles(instance);
  applyCanvasBackdrop(instance, snapRef.current);
  instance.Canvas.setZoom(100);

  const disableBadgesDeep = (component: AnyComponent) => {
    hideComponentOverlayName(component);
    const children = component.components?.().models ?? [];
    children.forEach((child) => disableBadgesDeep(child));
  };

  const rawBlockModels = (instance.BlockManager.getAll().models ?? []) as Array<{
    id?: string;
    getId?: () => string;
    get: (key: string) => unknown;
  }>;

  const blockItems = rawBlockModels
    .map((block) => {
      const categoryRaw = block.get('category');
      const categoryLabel = typeof categoryRaw === 'string'
        ? categoryRaw
        : String(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (categoryRaw as any)?.get?.('label') ??
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (categoryRaw as any)?.label ??
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (categoryRaw as any)?.id ??
          'Outros',
        );
      const categoryId = slugify(categoryLabel);

      const dcTitle = block.get('dcTitle');
      const rawLabel = String(block.get('label') ?? '');
      const fallbackLabel = stripHtml(rawLabel) || 'Bloco';
      const label = typeof dcTitle === 'string' ? dcTitle : fallbackLabel;
      const resolvedId = String(block.getId?.() ?? block.get('id') ?? block.id ?? '').trim();
      const content = block.get('content');

      return {
        id: resolvedId,
        label,
        categoryId,
        categoryLabel,
        previewHtml: rawLabel,
        content,
      };
    })
    .filter((item) => item.id.length > 0);

  setSidebarBlocks(blockItems);

  // Setup event listeners
  instance.on('load', () => {
    injectCanvasBaseStyles(instance);
    const wrapper = instance.getWrapper() as unknown as AnyComponent;
    if (wrapper) disableBadgesDeep(wrapper);
    removeTargetSpots();
    applyCanvasBackdrop(instance, snapRef.current);
    syncCanvasSchema(instance);
  });

  instance.on('canvas:frame:load:head', () => {
    injectCanvasBaseStyles(instance);
  });

  instance.on('canvas:frame:load:body', () => {
    injectCanvasBaseStyles(instance);
    applyCanvasBackdrop(instance, snapRef.current);
  });

  instance.on('canvas:spot:add', (payload: unknown) => {
    const spot = (payload as { spot?: { getType?: () => string } })?.spot;
    if (spot?.getType?.() === 'target') removeTargetSpots();
  });

  instance.on('component:add', (raw: unknown) => {
    const component = raw as AnyComponent;
    const parent = component.parent();
    if (!parent) return;

    hideComponentOverlayName(component);
    removeTargetSpots();
    const isRoot = parent.is('wrapper');
    if (isRoot) {
      const style = component.getStyle?.() ?? {};
      component.setStyle({
        position: 'absolute',
        left: style.left || '64px',
        top: style.top || '64px',
        width: style.width || '260px',
        height: style.height || '120px',
        ...style,
      });
    }

    component.set('resizable', {
      tl: 1,
      tc: 1,
      tr: 1,
      cl: 1,
      cr: 1,
      bl: 1,
      bc: 1,
      br: 1,
      keyWidth: 'width',
      keyHeight: 'height',
    });
    component.set('copyable', true);
  });

  instance.on('component:drag:end', (raw: unknown) => {
    const component = raw as AnyComponent;
    if (snapRef.current) {
      applySnapForComponent(component);
    }
    syncCanvasSchema(instance);
  });

  const normalizeComponentBackground = (component: AnyComponent) => {
    const style = component.getStyle?.() ?? {};
    const bgColorRaw = String(style['background-color'] ?? style.backgroundColor ?? '').trim();
    const bgRaw = String(style.background ?? '').trim();
    const bgImage = String(style['background-image'] ?? style.backgroundImage ?? '');
    const hasSolidBackground = (
      (bgColorRaw.length > 0 && bgColorRaw !== 'transparent') ||
      (bgRaw.length > 0 && !bgRaw.includes('gradient'))
    );
    if (!hasSolidBackground) return;

    const bg = String(style.background ?? '');
    const hasGradient = bgImage.includes('gradient') || bg.includes('gradient');
    if (!hasGradient) return;

    const nextStyle = { ...style } as Record<string, string | number | undefined>;
    delete nextStyle['background-image'];
    delete nextStyle.backgroundImage;
    delete nextStyle.background;
    component.setStyle(nextStyle as Record<string, string | number>);
  };

  instance.on('component:styleUpdate:background-color', (raw: unknown) => {
    normalizeComponentBackground(raw as AnyComponent);
  });

  instance.on('component:styleUpdate:background', (raw: unknown) => {
    normalizeComponentBackground(raw as AnyComponent);
  });

  instance.on('component:styleUpdate', (raw: unknown) => {
    normalizeComponentBackground(raw as AnyComponent);
  });

  const schemaEvents = ['component:update', 'component:styleUpdate', 'component:remove', 'component:resize', 'component:clone', 'sorter:drag:end'];
  schemaEvents.forEach((eventName) => {
    instance.on(eventName, () => syncCanvasSchema(instance));
  });

  return instance;
}
