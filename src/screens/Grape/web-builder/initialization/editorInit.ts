import grapesjs from 'grapesjs';
import type { EditorInstance, AnyComponent } from '../builder-core';
import { PAGE_HEIGHT, PAGE_WIDTH, slugify, stripHtml, applySnapForComponent } from '../builder-core';
import type { SidebarBlockItem } from '../../builder-blocks/types';
import blocksElements from '../../blocks-elements';

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
          width: '',
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
      styles: [
        `
        * { box-sizing: border-box; }
        html { background: #050812; min-height: 100%; height: 100%; overflow: hidden; }
        body { margin: 0; width: ${PAGE_WIDTH}px; height: ${PAGE_HEIGHT}px; min-height: ${PAGE_HEIGHT}px; max-height: ${PAGE_HEIGHT}px; overflow: hidden; background: #ffffff; position: relative; }
      `,
      ],
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
    const wrapper = instance.getWrapper() as unknown as AnyComponent;
    if (wrapper) disableBadgesDeep(wrapper);
    removeTargetSpots();
    applyCanvasBackdrop(instance, snapRef.current);
    syncCanvasSchema(instance);
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
