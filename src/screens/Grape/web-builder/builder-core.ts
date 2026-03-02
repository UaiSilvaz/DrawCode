import grapesjs from 'grapesjs';
import type { SidebarGroup } from '../builder-blocks/types';

export type EditorInstance = ReturnType<typeof grapesjs.init>;
export type EditorSelectTarget = Parameters<EditorInstance['select']>[0];
export type ComponentCollection = {
    models: AnyComponent[];
    add: (data: unknown, options?: { at?: number }) => unknown;
    reset: (data: unknown) => void;
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
}

export const GRID_STEP = 8;
export const PAGE_WIDTH = 1320;
export const PAGE_HEIGHT = 860;

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
