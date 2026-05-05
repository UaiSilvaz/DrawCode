import grapesjs from 'grapesjs';
import type { CanvasDeviceMode, SidebarGroup } from '../builder-blocks/types';

export type EditorInstance = ReturnType<typeof grapesjs.init>;
export type EditorSelectTarget = Parameters<EditorInstance['select']>[0];
export type ComponentCollection = {
    models: AnyComponent[];
    add: (data: unknown, options?: { at?: number }) => unknown;
    reset: (data: unknown) => void;
    toJSON?: () => unknown;
};

export type AnyComponent = {
    get: (key: string) => unknown;
    getId: () => string;
    getStyle: () => Record<string, string | number | undefined>;
    setStyle: (style: Record<string, string | number>) => void;
    set: (key: string, value: unknown) => void;
    getAttributes: () => Record<string, string>;
    setAttributes: (attrs: Record<string, string>) => void;
    components: () => ComponentCollection;
    parent: () => AnyComponent | null;
    clone: () => AnyComponent;
    toJSON: () => unknown;
    remove: () => void;
    is: (type: string) => boolean;
};

export type CanvasCoordsApi = {
    getCoords: () => { x: number; y: number };
    setCoords: (x: number, y: number) => void;
};

export interface WebBuilderProps {
    userId?: string;
    projectId?: string;
    projectName?: string;
    projectData?: SavedGrapeProjectData | null;
}

export interface CanvasElementNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    style: {
        backgroundColor: string;
        color: string;
        fontSize: number;
        borderRadius: number;
        borderWidth: number;
        opacity: number;
        textAlign: string;
        padding: string;
        margin: string;
        rotation: number;
    };
    zIndex: number;
    content?: string;
    children?: CanvasElementNode[];
}

export interface CanvasPage {
    id: string;
    name: string;
    components: unknown[];
    styles: unknown;
    schema: CanvasElementNode[];
    height?: number;
    html?: string;
    css?: string;
    projectData?: unknown;
}

export interface SavedGrapeProjectData {
    components?: unknown;
    styles?: unknown;
    html?: unknown;
    css?: unknown;
    schema?: unknown;
    pageHeight?: unknown;
    pages?: unknown;
    activePageIndex?: unknown;
    activeDeviceMode?: unknown;
}

export const createDefaultCanvasPage = (): CanvasPage => ({
    id: 'page-1',
    name: '/home',
    components: [],
    styles: [],
    schema: [],
    height: PAGE_HEIGHT,
});

export const normalizePagePath = (value: string, fallback = '/page'): string => {
    const baseFallback = fallback.startsWith('/') ? fallback : `/${fallback}`;
    const cleanedRaw = value.trim().toLowerCase();
    const cleaned = cleanedRaw
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9/_-]/g, '')
        .replace(/\/{2,}/g, '/');
    let next = cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
    if (next.length > 1) next = next.replace(/\/+$/g, '');
    if (!next || next === '/') return baseFallback;
    return next;
};

export const normalizeSavedCanvasPages = (data?: SavedGrapeProjectData | null): CanvasPage[] => {
    const rawPages = Array.isArray(data?.pages) ? data.pages : [];
    if (rawPages.length > 0) {
        return rawPages.map((rawPage, index) => {
            const page = rawPage && typeof rawPage === 'object'
                ? rawPage as Partial<CanvasPage>
                : {};

            const schema: CanvasElementNode[] = Array.isArray(page.schema) ? page.schema : [];
            const components = collectionToPlainArray(page.components) ?? [];

            return {
                id: typeof page.id === 'string' && page.id.trim() ? page.id : `page-${index + 1}`,
                name: normalizePagePath(
                    typeof page.name === 'string' ? page.name : '',
                    index === 0 ? '/home' : `/page-${index + 1}`,
                ),
                components,
                styles: page.styles ?? [],
                schema,
                height: typeof page.height === 'number'
                    ? clampCanvasPageHeight(page.height)
                    : getCanvasSchemaHeight(schema),
                html: typeof page.html === 'string' ? page.html : '',
                css: typeof page.css === 'string' ? page.css : '',
                projectData: page.projectData ?? null,
            };
        });
    }

    const components = collectionToPlainArray(data?.components) ?? [];
    const schema = Array.isArray(data?.schema) ? data.schema as CanvasElementNode[] : [];
    if (components.length > 0 || schema.length > 0) {
        return [{
            id: 'page-1',
            name: '/home',
            components,
            styles: data?.styles ?? [],
            schema,
            height: clampCanvasPageHeight(data?.pageHeight ?? getCanvasSchemaHeight(schema)),
            html: typeof data?.html === 'string' ? data.html : '',
            css: typeof data?.css === 'string' ? data.css : '',
            projectData: null,
        }];
    }

    return [createDefaultCanvasPage()];
};

export const normalizeSavedActivePageIndex = (
    value: unknown,
    pageCount: number,
): number => {
    const numeric = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    return Math.max(0, Math.min(Math.floor(numeric), Math.max(0, pageCount - 1)));
};

export const normalizeSavedDeviceMode = (value: unknown): CanvasDeviceMode => (
    value === 'tablet' || value === 'phone' || value === 'desktop' ? value : 'desktop'
);

export interface WrapperElementSnapshot {
    id: string;
    tagName: string;
    type: string;
    text: string;
    html: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    style: {
        display: string;
        position: string;
        fontFamily: string;
        lineHeight: string;
        letterSpacing: string;
        textAlign: string;
        backgroundColor: string;
        backgroundImage: string;
        color: string;
        fontSize: string;
        fontWeight: string;
        padding: string;
        margin: string;
        border: string;
        borderRadius: string;
        borderWidth: string;
        borderColor: string;
        borderStyle: string;
        opacity: string;
        boxShadow: string;
        transform: string;
        zIndex: string;
    };
    attributes: Record<string, string>;
    children: WrapperElementSnapshot[];
}

export interface WrapperBoundsSnapshot {
    width: number;
    height: number;
}

export const GRID_STEP = 8;
export const PAGE_WIDTH = 1440;
export const PAGE_HEIGHT = 860;
export const CANVAS_DEVICE_WIDTHS = {
    desktop: PAGE_WIDTH,
    tablet: 900,
    phone: 390,
} as const;
export const CANVAS_INFINITE_PADDING = 1800;
export const CANVAS_INITIAL_TOP_GAP = 72;
export const PAGE_BOTTOM_PADDING = 180;
export const PAGE_MAX_HEIGHT = 12000;

export const clampCanvasPageHeight = (height: unknown): number => {
    const numeric = typeof height === 'number' && Number.isFinite(height) ? height : PAGE_HEIGHT;
    return Math.max(PAGE_HEIGHT, Math.min(PAGE_MAX_HEIGHT, Math.ceil(numeric)));
};

export const cloneSerializable = <T = unknown>(value: unknown, fallback: T): T => {
    if (value == null) return fallback;

    try {
        return JSON.parse(JSON.stringify(value)) as T;
    } catch {
        return fallback;
    }
};

const collectionToPlainArray = (value: unknown): unknown[] | null => {
    if (Array.isArray(value)) return cloneSerializable<unknown[]>(value, []);

    if (!value || typeof value !== 'object') return null;

    const maybeCollection = value as {
        models?: unknown[];
        toJSON?: () => unknown;
    };

    if (Array.isArray(maybeCollection.models)) {
        return maybeCollection.models.map((model) => {
            if (model && typeof model === 'object' && 'toJSON' in model) {
                const json = (model as { toJSON?: () => unknown }).toJSON?.();
                return cloneSerializable(json, {});
            }

            return cloneSerializable(model, {});
        });
    }

    const json = maybeCollection.toJSON?.();
    if (Array.isArray(json)) return cloneSerializable<unknown[]>(json, []);
    if (json && typeof json === 'object') return [cloneSerializable(json, {})];

    return null;
};

export const getSerializableComponents = (editor: EditorInstance): unknown[] => {
    const wrapper = editor.getWrapper() as unknown as AnyComponent | null;
    const wrapperComponents = wrapper?.components?.();
    const fromWrapper = collectionToPlainArray(wrapperComponents);
    if (fromWrapper) return fromWrapper;

    const fromEditor = collectionToPlainArray(editor.getComponents() as unknown);
    return fromEditor ?? [];
};

export const getSerializableStyles = (editor: EditorInstance): unknown => {
    const styles = editor.getStyle() as unknown;
    return collectionToPlainArray(styles) ?? cloneSerializable(styles, []);
};

export const getSerializableProjectData = (editor: EditorInstance): unknown => {
    const maybeEditor = editor as unknown as { getProjectData?: () => unknown };
    return cloneSerializable(maybeEditor.getProjectData?.(), {});
};

const getNodeBottom = (node: CanvasElementNode): number => {
    const ownBottom = node.position.y + node.size.height;
    const childBottom = node.children?.length
        ? Math.max(...node.children.map(getNodeBottom))
        : 0;
    return Math.max(ownBottom, childBottom);
};

export const getCanvasSchemaHeight = (schema: CanvasElementNode[] = []): number => {
    if (!schema.length) return PAGE_HEIGHT;
    const bottom = Math.max(...schema.map(getNodeBottom));
    return clampCanvasPageHeight(bottom + PAGE_BOTTOM_PADDING);
};

const getCanvasDomContentHeight = (editor: EditorInstance): number => {
    const canvasApi = (editor as {
        Canvas?: {
            getDocument?: () => Document | null;
        };
    }).Canvas;
    const doc = canvasApi?.getDocument?.();
    const body = doc?.body;

    if (!body) return PAGE_HEIGHT;

    const scaleRaw = doc?.documentElement.style.getPropertyValue('--dc-device-scale') || '1';
    const scale = Math.max(0.01, Number.parseFloat(scaleRaw) || 1);
    const bodyRect = body.getBoundingClientRect();
    const ElementCtor = doc?.defaultView?.HTMLElement;
    const childBottom = Array.from(body.children).reduce((max, child) => {
        if (ElementCtor && !(child instanceof ElementCtor)) return max;
        if (child.tagName.toLowerCase() === 'script') return max;

        const rect = child.getBoundingClientRect();
        const bottom = (rect.bottom - bodyRect.top) / scale;
        return Math.max(max, bottom);
    }, 0);

    return clampCanvasPageHeight(Math.max(
        PAGE_HEIGHT,
        childBottom > 0 ? childBottom + PAGE_BOTTOM_PADDING : 0,
    ));
};

const getCurrentCanvasViewportHeight = (editor: EditorInstance): number => {
    const canvasApi = (editor as {
        Canvas?: {
            getDocument?: () => Document | null;
        };
    }).Canvas;
    const doc = canvasApi?.getDocument?.();
    const heightRaw = doc?.documentElement.style.getPropertyValue('--dc-page-height');
    const height = heightRaw ? Number.parseFloat(heightRaw) : PAGE_HEIGHT;
    return clampCanvasPageHeight(height);
};

export const getCanvasContentHeight = (editor: EditorInstance): number => (
    clampCanvasPageHeight(Math.max(
        getCanvasSchemaHeight(serializeCanvas(editor)),
        getCanvasDomContentHeight(editor),
    ))
);

export const getCanvasPageHeight = (editor: EditorInstance): number => (
    clampCanvasPageHeight(Math.max(
        getCanvasContentHeight(editor),
        getCurrentCanvasViewportHeight(editor),
    ))
);

export const setCanvasViewport = (
    editor: EditorInstance,
    deviceWidth = PAGE_WIDTH,
    pageHeight = PAGE_HEIGHT,
): void => {
    const canvasApi = (editor as {
        Canvas?: {
            getDocument?: () => Document | null;
            getFrameEl?: () => HTMLIFrameElement | null;
            getFramesEl?: () => HTMLElement | null;
        };
    }).Canvas;
    const doc = canvasApi?.getDocument?.();
    const frameEl = canvasApi?.getFrameEl?.();
    const framesEl = canvasApi?.getFramesEl?.();
    const safeHeight = clampCanvasPageHeight(pageHeight);
    const safeWidth = Math.max(320, Math.min(PAGE_WIDTH, Math.round(deviceWidth)));
    const framePadding = CANVAS_INFINITE_PADDING;
    const frameAreaWidth = safeWidth + framePadding * 2;
    const deviceMode: CanvasDeviceMode = safeWidth <= 480
        ? 'phone'
        : safeWidth <= 1024
            ? 'tablet'
            : 'desktop';

    if (framesEl) {
        framesEl.style.boxSizing = 'border-box';
        framesEl.style.display = 'flex';
        framesEl.style.alignItems = 'flex-start';
        framesEl.style.justifyContent = 'center';
        framesEl.style.width = `${frameAreaWidth}px`;
        framesEl.style.minWidth = `${frameAreaWidth}px`;
        framesEl.style.minHeight = `${safeHeight + framePadding * 2}px`;
        framesEl.style.padding = `${framePadding}px`;
        framesEl.style.overflow = 'visible';
        framesEl.style.background = 'transparent';
    }

    if (frameEl) {
        const frameWrapper = frameEl.parentElement as HTMLElement | null;
        if (frameWrapper) {
            frameWrapper.style.width = `${safeWidth}px`;
            frameWrapper.style.height = `${safeHeight}px`;
            frameWrapper.style.minWidth = `${safeWidth}px`;
            frameWrapper.style.minHeight = `${safeHeight}px`;
            frameWrapper.style.maxWidth = 'none';
            frameWrapper.style.maxHeight = 'none';
            frameWrapper.style.flex = '0 0 auto';
            frameWrapper.style.background = '#ffffff';
            frameWrapper.style.boxShadow = '0 18px 46px rgba(2, 6, 23, 0.28)';
        }

        frameEl.style.width = `${safeWidth}px`;
        frameEl.style.height = `${safeHeight}px`;
        frameEl.style.minWidth = `${safeWidth}px`;
        frameEl.style.minHeight = `${safeHeight}px`;
        frameEl.style.maxWidth = 'none';
        frameEl.style.maxHeight = 'none';
        frameEl.style.background = '#ffffff';
    }

    if (!doc?.body || !doc.documentElement) return;

    doc.documentElement.dataset.dcDevice = deviceMode;
    doc.documentElement.style.setProperty('--dc-device-scale', '1');
    doc.documentElement.style.setProperty('--dc-page-height', `${safeHeight}px`);
    doc.documentElement.style.setProperty('--dc-page-visual-height', `${safeHeight}px`);
    doc.documentElement.style.setProperty('--dc-device-width', `${safeWidth}px`);
    doc.documentElement.style.background = 'transparent';
    doc.documentElement.style.width = '100%';
    doc.documentElement.style.minHeight = '100%';
    doc.documentElement.style.height = 'auto';
    doc.documentElement.style.overflowX = 'hidden';
    doc.documentElement.style.overflowY = 'hidden';

    doc.body.style.boxSizing = 'border-box';
    doc.body.style.width = '100%';
    doc.body.style.maxWidth = 'none';
    doc.body.style.height = 'auto';
    doc.body.style.minHeight = `${safeHeight}px`;
    doc.body.style.maxHeight = 'none';
    doc.body.style.overflowX = 'hidden';
    doc.body.style.overflowY = 'visible';
    doc.body.style.transform = 'none';
    doc.body.style.transformOrigin = 'top left';
};

export const CATEGORY_TO_GROUP: Record<string, SidebarGroup> = {
    'layouts-pre-definidos': { id: 'layouts-pre-definidos', label: 'Layouts', icon: 'layout' },
    formas: { id: 'formas', label: 'Formas', icon: 'shape' },
    'componentes-ui': { id: 'componentes-ui', label: 'Componentes', icon: 'component' },
    imagens: { id: 'imagens', label: 'Imagens', icon: 'image' },
    texto: { id: 'texto', label: 'Texto', icon: 'text' },
};

export const parseNumericValue = (value: unknown, fallback = 0): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value.replace('px', '').replace('%', '').trim());
        if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
};

export const parseRotation = (value: string | undefined): number => {
    if (!value) return 0;
    const match = value.match(/rotate\(([-\d.]+)deg\)/);
    return match ? parseFloat(match[1] ?? '0') : 0;
};

export const styleValue = (style: Record<string, string | number | undefined>, key: string, fallback = ''): string => {
    const direct = style[key];
    const camelKey = key.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    const camel = style[camelKey];
    const found = direct ?? camel;
    if (typeof found === 'number') return `${found}px`;
    return typeof found === 'string' ? found : fallback;
};

export const inferTypeFromComponent = (component: AnyComponent): string => {
    const attrs = component.getAttributes?.() ?? {};
    if (attrs['data-dc-type']) return attrs['data-dc-type'];

    const rawType = String(component.get('type') ?? 'default').toLowerCase();
    const tagName = String(component.get('tagName') ?? 'div').toLowerCase();

    if (rawType.includes('image') || tagName === 'img') return 'image';
    if (tagName === 'button') return 'button';
    if (tagName === 'input' || tagName === 'textarea') return 'input';
    if (tagName === 'nav') return 'navbar';
    if (tagName === 'footer') return 'footer';
    if (['h1', 'h2', 'h3'].includes(tagName)) return 'title';
    if (tagName === 'p') return 'paragraph';
    if (rawType.includes('text')) return 'text';
    return 'section';
};

export const extractContent = (component: AnyComponent, type: string): string | undefined => {
    const attrs = component.getAttributes?.() ?? {};
    const rawContent = component.get('content');
    const content = typeof rawContent === 'string' ? rawContent : undefined;

    if (type === 'input') return attrs.placeholder || attrs.value || content;
    if (type.includes('image')) return attrs.src || content;
    return content;
};

export const serializeComponent = (component: AnyComponent): CanvasElementNode => {
    const style = component.getStyle?.() ?? {};
    const childrenModels = component.components?.().models ?? [];
    const type = inferTypeFromComponent(component);

    const node: CanvasElementNode = {
        id: component.getId?.() ?? `element-${Math.random().toString(36).slice(2)}`,
        type,
        position: {
            x: parseNumericValue(styleValue(style, 'left'), 0),
            y: parseNumericValue(styleValue(style, 'top'), 0),
        },
        size: {
            width: parseNumericValue(styleValue(style, 'width'), 220),
            height: parseNumericValue(styleValue(style, 'height'), 120),
        },
        style: {
            backgroundColor: styleValue(style, 'background-color', 'transparent'),
            color: styleValue(style, 'color', '#0f172a'),
            fontSize: parseNumericValue(styleValue(style, 'font-size'), 16),
            borderRadius: parseNumericValue(styleValue(style, 'border-radius'), 0),
            borderWidth: parseNumericValue(styleValue(style, 'border-width'), 0),
            opacity: parseNumericValue(styleValue(style, 'opacity'), 1),
            textAlign: styleValue(style, 'text-align', 'left'),
            padding: styleValue(style, 'padding', '0px'),
            margin: styleValue(style, 'margin', '0px'),
            rotation: parseRotation(styleValue(style, 'transform')),
        },
        zIndex: parseNumericValue(styleValue(style, 'z-index'), 1),
        content: extractContent(component, type),
    };

    if (childrenModels.length > 0) {
        node.children = childrenModels.map(serializeComponent);
    }

    return node;
};

export const serializeCanvas = (editor: EditorInstance): CanvasElementNode[] => {
    const wrapper = editor.getWrapper() as unknown as AnyComponent;
    const nodes = wrapper.components().models ?? [];
    return nodes.map(serializeComponent);
};

export const snapToGrid = (value: string | number | undefined, grid = GRID_STEP): string => {
    const parsed = parseNumericValue(value, 0);
    const snapped = Math.round(parsed / grid) * grid;
    return `${snapped}px`;
};

export const applySnapForComponent = (component: AnyComponent): void => {
    const style = component.getStyle?.() ?? {};
    if (!style.position || String(style.position) !== 'absolute') return;

    component.setStyle({
        ...style,
        left: snapToGrid(style.left),
        top: snapToGrid(style.top),
        width: snapToGrid(style.width),
        height: snapToGrid(style.height),
    });
};

export const normalizeTypeToTag = (type: string): string => {
    if (type.includes('button')) return 'button';
    if (type.includes('input')) return 'input';
    if (type.includes('checkbox')) return 'label';
    if (type.includes('navbar')) return 'nav';
    if (type.includes('footer')) return 'footer';
    if (type.includes('title')) return 'h1';
    if (type.includes('paragraph')) return 'p';
    if (type.includes('image')) return 'img';
    return 'div';
};

export const nodeToComponent = (node: CanvasElementNode): Record<string, unknown> => {
    const style: Record<string, string | number> = {
        position: 'absolute',
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
        width: `${node.size.width}px`,
        height: `${node.size.height}px`,
        'background-color': node.style.backgroundColor,
        color: node.style.color,
        'font-size': `${node.style.fontSize}px`,
        'border-radius': `${node.style.borderRadius}px`,
        'border-width': `${node.style.borderWidth}px`,
        opacity: node.style.opacity,
        padding: node.style.padding,
        margin: node.style.margin,
        'text-align': node.style.textAlign,
        'z-index': node.zIndex,
    };

    if (node.style.rotation !== 0) {
        style.transform = `rotate(${node.style.rotation}deg)`;
    }

    const attributes: Record<string, string> = { 'data-dc-type': node.type };
    const tagName = normalizeTypeToTag(node.type);

    if (tagName === 'input') {
        attributes.placeholder = node.content || 'Digite aqui...';
    }

    if (tagName === 'img') {
        attributes.src = node.content || 'https://placehold.co/800x450?text=Image';
        attributes.alt = 'Imagem';
    }

    const next: Record<string, unknown> = {
        tagName,
        attributes,
        style,
    };

    if (node.content && tagName !== 'input' && tagName !== 'img') {
        next.content = node.content;
    }

    if (node.children?.length) {
        next.components = node.children.map(nodeToComponent);
    }

    return next;
};

export const extractImportedNodes = (payload: unknown): CanvasElementNode[] => {
    if (Array.isArray(payload)) return payload as CanvasElementNode[];
    if (payload && typeof payload === 'object') {
        const maybeObj = payload as { schema?: CanvasElementNode[]; elements?: CanvasElementNode[] };
        if (Array.isArray(maybeObj.schema)) return maybeObj.schema;
        if (Array.isArray(maybeObj.elements)) return maybeObj.elements;
    }
    return [];
};

export const isInputElement = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || target.isContentEditable;
};

export const unwrapAddedComponent = (value: unknown): AnyComponent | null => {
    if (!value) return null;
    if (Array.isArray(value)) return (value[0] ?? null) as AnyComponent | null;
    return value as AnyComponent;
};

export const selectComponent = (editor: EditorInstance | null, component: AnyComponent | null): void => {
    if (!editor || !component) return;
    editor.select(component as unknown as EditorSelectTarget);
};

export const slugify = (value: string): string =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

export const stripHtml = (value: string): string => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
