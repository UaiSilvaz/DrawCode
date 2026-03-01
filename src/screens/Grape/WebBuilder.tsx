'use client';

import { ChangeEvent, DragEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import './ui.css';
import blocksElements from './blocks-elements';
import { type DockItemData } from '@/components/Dock';
import { VscAccount, VscArchive, VscHome, VscSettingsGear } from 'react-icons/vsc';
import BuilderToolbar from './builder-blocks/BuilderToolbar';
import BuilderElementsSidebar from './builder-blocks/BuilderElementsSidebar';
import BuilderCanvasArea from './builder-blocks/BuilderCanvasArea';
import BuilderPropertiesPanel from './builder-blocks/BuilderPropertiesPanel';
import BuilderContextMenu from './builder-blocks/BuilderContextMenu';
import type { ContextMenuState, SidebarBlockItem, SidebarGroup } from './builder-blocks/types';

type EditorInstance = ReturnType<typeof grapesjs.init>;
type EditorSelectTarget = Parameters<EditorInstance['select']>[0];
type ComponentCollection = {
    models: AnyComponent[];
    add: (data: unknown, options?: { at?: number }) => unknown;
    reset: (data: unknown) => void;
};

type AnyComponent = {
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

type CanvasCoordsApi = {
    getCoords: () => { x: number; y: number };
    setCoords: (x: number, y: number) => void;
};

interface WebBuilderProps {
    userId?: string;
    projectId?: string;
    projectName?: string;
}

interface CanvasElementNode {
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

interface CanvasPage {
    id: string;
    name: string;
    components: unknown[];
    styles: unknown;
    schema: CanvasElementNode[];
}

const GRID_STEP = 8;
const PAGE_WIDTH = 1320;
const PAGE_HEIGHT = 860;

const CATEGORY_TO_GROUP: Record<string, SidebarGroup> = {
    'layouts-pre-definidos': { id: 'layouts-pre-definidos', label: 'Layouts', icon: 'layout' },
    formas: { id: 'formas', label: 'Formas', icon: 'shape' },
    'componentes-ui': { id: 'componentes-ui', label: 'Componentes', icon: 'component' },
    imagens: { id: 'imagens', label: 'Imagens', icon: 'image' },
    texto: { id: 'texto', label: 'Texto', icon: 'text' },
};

const parseNumericValue = (value: unknown, fallback = 0): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value.replace('px', '').replace('%', '').trim());
        if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
};

const parseRotation = (value: string | undefined): number => {
    if (!value) return 0;
    const match = value.match(/rotate\(([-\d.]+)deg\)/);
    return match ? parseFloat(match[1] ?? '0') : 0;
};

const styleValue = (style: Record<string, string | number | undefined>, key: string, fallback = ''): string => {
    const direct = style[key];
    const camelKey = key.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    const camel = style[camelKey];
    const found = direct ?? camel;
    if (typeof found === 'number') return `${found}px`;
    return typeof found === 'string' ? found : fallback;
};

const inferTypeFromComponent = (component: AnyComponent): string => {
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

const extractContent = (component: AnyComponent, type: string): string | undefined => {
    const attrs = component.getAttributes?.() ?? {};
    const rawContent = component.get('content');
    const content = typeof rawContent === 'string' ? rawContent : undefined;

    if (type === 'input') return attrs.placeholder || attrs.value || content;
    if (type.includes('image')) return attrs.src || content;
    return content;
};

const serializeComponent = (component: AnyComponent): CanvasElementNode => {
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

const serializeCanvas = (editor: EditorInstance): CanvasElementNode[] => {
    const wrapper = editor.getWrapper() as unknown as AnyComponent;
    const nodes = wrapper.components().models ?? [];
    return nodes.map(serializeComponent);
};

const snapToGrid = (value: string | number | undefined, grid = GRID_STEP): string => {
    const parsed = parseNumericValue(value, 0);
    const snapped = Math.round(parsed / grid) * grid;
    return `${snapped}px`;
};

const applySnapForComponent = (component: AnyComponent): void => {
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

const normalizeTypeToTag = (type: string): string => {
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

const nodeToComponent = (node: CanvasElementNode): Record<string, unknown> => {
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

const extractImportedNodes = (payload: unknown): CanvasElementNode[] => {
    if (Array.isArray(payload)) return payload as CanvasElementNode[];
    if (payload && typeof payload === 'object') {
        const maybeObj = payload as { schema?: CanvasElementNode[]; elements?: CanvasElementNode[] };
        if (Array.isArray(maybeObj.schema)) return maybeObj.schema;
        if (Array.isArray(maybeObj.elements)) return maybeObj.elements;
    }
    return [];
};

const isInputElement = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || target.isContentEditable;
};

const unwrapAddedComponent = (value: unknown): AnyComponent | null => {
    if (!value) return null;
    if (Array.isArray(value)) return (value[0] ?? null) as AnyComponent | null;
    return value as AnyComponent;
};

const selectComponent = (editor: EditorInstance | null, component: AnyComponent | null): void => {
    if (!editor || !component) return;
    editor.select(component as unknown as EditorSelectTarget);
};

const slugify = (value: string): string =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

const stripHtml = (value: string): string => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export default function WebBuilder({ userId, projectId: initialProjectId, projectName: initialProjectName }: WebBuilderProps) {
    const initialPages: CanvasPage[] = useMemo(() => ([
        {
            id: 'page-1',
            name: 'Pagina 1',
            components: [],
            styles: [],
            schema: [],
        },
    ]), []);

    const [editor, setEditor] = useState<EditorInstance | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [currentProjectId, setCurrentProjectId] = useState(initialProjectId);
    const [projectName, setProjectName] = useState(initialProjectName ?? 'Sem titulo');
    const [snapEnabled, setSnapEnabled] = useState(true);
    const [canvasStructure, setCanvasStructure] = useState<CanvasElementNode[]>([]);
    const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(true);
    const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(true);
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({ open: false, x: 0, y: 0 });
    const [zoomLevel, setZoomLevel] = useState(100);
    const [activeGroupId, setActiveGroupId] = useState<string>('layouts-pre-definidos');
    const [groupPanelOpen, setGroupPanelOpen] = useState(false);
    const [sidebarBlocks, setSidebarBlocks] = useState<SidebarBlockItem[]>([]);
    const [pages, setPages] = useState<CanvasPage[]>(initialPages);
    const [activePageIndex, setActivePageIndex] = useState(0);
    const [isPanning, setIsPanning] = useState(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const imageInputRef = useRef<HTMLInputElement | null>(null);
    const canvasShellRef = useRef<HTMLDivElement | null>(null);
    const snapRef = useRef(snapEnabled);
    const pagesRef = useRef<CanvasPage[]>(initialPages);
    const activePageIndexRef = useRef(0);
    const zoomRef = useRef(zoomLevel);
    const panStartRef = useRef<{ x: number; y: number } | null>(null);
    const spacePressedRef = useRef(false);
    const draggedBlockIdRef = useRef<string | null>(null);
    const draggedBlockRef = useRef<SidebarBlockItem | null>(null);
    snapRef.current = snapEnabled;

    const syncCanvasSchema = useCallback((instance: EditorInstance) => {
        const next = serializeCanvas(instance);
        setCanvasStructure(next);
    }, []);

    useEffect(() => {
        pagesRef.current = pages;
    }, [pages]);

    useEffect(() => {
        activePageIndexRef.current = activePageIndex;
    }, [activePageIndex]);

    useEffect(() => {
        zoomRef.current = zoomLevel;
    }, [zoomLevel]);

    const applyCanvasBackdrop = useCallback((instance: EditorInstance, enabled: boolean) => {
        const doc = instance.Canvas.getDocument();
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
        doc.body.style.borderRadius = '24px';
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

    const groupedSidebar = useMemo(() => {
        const groupMap = new Map<string, SidebarGroup>();
        const blockMap = new Map<string, SidebarBlockItem[]>();

        sidebarBlocks.forEach((item) => {
            const fallbackGroup: SidebarGroup = {
                id: item.categoryId,
                label: item.categoryLabel,
                icon: 'component',
            };
            const group = CATEGORY_TO_GROUP[item.categoryId] ?? fallbackGroup;
            groupMap.set(group.id, group);
            if (!blockMap.has(group.id)) blockMap.set(group.id, []);
            blockMap.get(group.id)?.push(item);
        });

        const preferredOrder = ['layouts-pre-definidos', 'formas', 'componentes-ui', 'imagens', 'texto'];
        const sortedGroups = [...groupMap.values()].sort((a, b) => {
            const ia = preferredOrder.indexOf(a.id);
            const ib = preferredOrder.indexOf(b.id);
            const sa = ia === -1 ? 999 : ia;
            const sb = ib === -1 ? 999 : ib;
            return sa - sb;
        });

        return sortedGroups.map((group) => ({
            ...group,
            blocks: blockMap.get(group.id) ?? [],
        }));
    }, [sidebarBlocks]);

    const activeGroup = useMemo(
        () => groupedSidebar.find((group) => group.id === activeGroupId) ?? groupedSidebar[0],
        [groupedSidebar, activeGroupId],
    );

    const setCanvasZoom = useCallback((next: number) => {
        if (!editor) return;
        const clamped = Math.max(30, Math.min(200, Math.round(next)));
        editor.Canvas.setZoom(clamped);
        setZoomLevel(clamped);
    }, [editor]);

    const panCanvasBy = useCallback((deltaX: number, deltaY: number) => {
        if (!editor) return;
        const canvas = editor.Canvas as unknown as CanvasCoordsApi;
        if (!canvas.getCoords || !canvas.setCoords) return;
        const coords = canvas.getCoords();
        canvas.setCoords(coords.x + deltaX, coords.y + deltaY);
    }, [editor]);

    const beginPan = useCallback((clientX: number, clientY: number) => {
        panStartRef.current = { x: clientX, y: clientY };
        setIsPanning(true);
    }, []);

    const movePan = useCallback((clientX: number, clientY: number) => {
        const start = panStartRef.current;
        if (!start) return;
        const deltaX = clientX - start.x;
        const deltaY = clientY - start.y;
        panCanvasBy(deltaX, deltaY);
        panStartRef.current = { x: clientX, y: clientY };
    }, [panCanvasBy]);

    const endPan = useCallback(() => {
        panStartRef.current = null;
        setIsPanning(false);
    }, []);

    const snapshotCurrentPage = useCallback(() => {
        if (!editor) return;
        const idx = activePageIndexRef.current;
        const current = pagesRef.current[idx];
        if (!current) return;

        const nextPage: CanvasPage = {
            ...current,
            components: editor.getComponents() as unknown as unknown[],
            styles: editor.getStyle() as unknown,
            schema: serializeCanvas(editor),
        };

        const nextPages = [...pagesRef.current];
        nextPages[idx] = nextPage;
        pagesRef.current = nextPages;
        setPages(nextPages);
    }, [editor]);

    const applyPageToCanvas = useCallback((page: CanvasPage) => {
        if (!editor) return;
        const wrapper = editor.getWrapper() as unknown as AnyComponent;
        if (!wrapper) return;

        wrapper.components().reset(page.components ?? []);
        editor.setStyle((page.styles as never) ?? ([] as never));
        syncCanvasSchema(editor);
    }, [editor, syncCanvasSchema]);

    useEffect(() => {
        const instance = grapesjs.init({
            container: '#gjs',
            height: '100%',
            width: '100%',
            fromElement: false,
            storageManager: false,
            dragMode: 'absolute',
            selectorManager: { componentFirst: true },
            panels: { defaults: [] },
            blockManager: {},
            styleManager: {
                appendTo: '#styles',
                sectors: [
                    {
                        name: 'Cores',
                        open: true,
                        properties: ['background-color', 'color', 'opacity'],
                    },
                    {
                        name: 'Texto',
                        open: true,
                        properties: ['font-size', 'font-weight', 'line-height', 'text-align'],
                    },
                    {
                        name: 'Borda',
                        open: true,
                        properties: ['border-width', 'border-style', 'border-color', 'border-radius'],
                    },
                    {
                        name: 'Dimensao',
                        open: true,
                        properties: ['width', 'height', 'max-width', 'min-height'],
                    },
                    {
                        name: 'Posicao e Espacamento',
                        open: true,
                        properties: ['position', 'left', 'top', 'right', 'bottom', 'z-index', 'padding', 'margin'],
                    },
                    {
                        name: 'Transform',
                        open: false,
                        properties: ['transform'],
                    },
                ],
            },
            layerManager: { appendTo: '#layers' },
            traitManager: { appendTo: '#traits' },
            canvas: {
                styles: [
                    `
                    * { box-sizing: border-box; }
                    html { background: #050812; min-height: 100%; height: 100%; overflow: hidden; }
                    body { margin: 0; width: ${PAGE_WIDTH}px; height: ${PAGE_HEIGHT}px; min-height: ${PAGE_HEIGHT}px; max-height: ${PAGE_HEIGHT}px; overflow: hidden; background: #ffffff; position: relative; }
                `,
                ],
            },
        });

        blocksElements(instance);
        applyCanvasBackdrop(instance, snapRef.current);
        instance.Canvas.setZoom(100);
        const rawBlockModels = (instance.BlockManager.getAll().models ?? []) as Array<{
            id?: string;
            getId?: () => string;
            get: (key: string) => unknown;
        }>;
        const blockItems = rawBlockModels.map((block) => {
            const categoryRaw = block.get('category');
            const categoryLabel =
                typeof categoryRaw === 'string'
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
        }).filter((item) => item.id.length > 0);
        setSidebarBlocks(blockItems);

        instance.on('load', () => {
            applyCanvasBackdrop(instance, snapRef.current);
            syncCanvasSchema(instance);
        });

        instance.on('component:add', (raw: unknown) => {
            const component = raw as AnyComponent;
            const parent = component.parent();
            if (!parent) return;

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
            if (snapRef.current) applySnapForComponent(component);
            syncCanvasSchema(instance);
        });

        const schemaEvents = ['component:update', 'component:styleUpdate', 'component:remove', 'component:resize', 'component:clone', 'sorter:drag:end'];
        schemaEvents.forEach((eventName) => {
            instance.on(eventName, () => syncCanvasSchema(instance));
        });

        setEditor(instance);

        return () => {
            instance.destroy();
            setEditor(null);
        };
    }, [applyCanvasBackdrop, syncCanvasSchema]);

    useEffect(() => {
        if (!editor) return;
        applyCanvasBackdrop(editor, snapEnabled);
    }, [editor, snapEnabled, applyCanvasBackdrop]);

    useEffect(() => {
        if (!editor) return;
        const shell = canvasShellRef.current;
        const canvasDoc = editor.Canvas.getDocument();
        if (!shell || !canvasDoc) return;

        const onWheel = (event: WheelEvent) => {
            const isZoomGesture = event.ctrlKey || event.metaKey;
            event.preventDefault();

            if (isZoomGesture) {
                const nextZoom = zoomRef.current - event.deltaY * 0.08;
                setCanvasZoom(nextZoom);
                return;
            }

            // Two-finger scroll (trackpad) and mouse wheel pan the canvas viewport.
            panCanvasBy(-event.deltaX, -event.deltaY);
        };

        const onMouseDown = (event: MouseEvent) => {
            const shouldPan = event.button === 1 || (event.button === 0 && spacePressedRef.current);
            if (!shouldPan) return;
            event.preventDefault();
            beginPan(event.clientX, event.clientY);
        };

        const onMouseMove = (event: MouseEvent) => {
            if (!panStartRef.current) return;
            event.preventDefault();
            movePan(event.clientX, event.clientY);
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
        canvasDoc.addEventListener('wheel', onWheel, { passive: false });
        canvasDoc.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        return () => {
            shell.removeEventListener('wheel', onWheel);
            shell.removeEventListener('mousedown', onMouseDown);
            canvasDoc.removeEventListener('wheel', onWheel);
            canvasDoc.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [editor, beginPan, endPan, movePan, panCanvasBy, setCanvasZoom]);

    const withSelected = useCallback((run: (selected: AnyComponent) => void): boolean => {
        if (!editor) return false;
        const selected = editor.getSelected() as unknown as AnyComponent | null;
        if (!selected) return false;
        run(selected);
        syncCanvasSchema(editor);
        return true;
    }, [editor, syncCanvasSchema]);

    const handleDelete = useCallback(() => {
        withSelected((selected) => selected.remove());
    }, [withSelected]);

    const handleUndo = useCallback(() => {
        editor?.UndoManager.undo();
        if (editor) syncCanvasSchema(editor);
    }, [editor, syncCanvasSchema]);

    const handleRedo = useCallback(() => {
        editor?.UndoManager.redo();
        if (editor) syncCanvasSchema(editor);
    }, [editor, syncCanvasSchema]);

    const handleDuplicate = useCallback(() => {
        withSelected((selected) => {
            const parent = selected.parent();
            if (!parent) return;

            const collection = parent.components();
            const index = collection.models.indexOf(selected);
            const cloneJson = selected.toJSON() as Record<string, unknown>;
            const style = (cloneJson.style ?? {}) as Record<string, string | number | undefined>;
            cloneJson.style = {
                ...style,
                left: `${parseNumericValue(style.left, 0) + 24}px`,
                top: `${parseNumericValue(style.top, 0) + 24}px`,
            };
            const next = unwrapAddedComponent(collection.add(cloneJson, { at: index + 1 }));
            selectComponent(editor, next);
        });
    }, [editor, withSelected]);

    const moveLayer = useCallback((direction: 'up' | 'down') => {
        withSelected((selected) => {
            const parent = selected.parent();
            if (!parent) return;

            const collection = parent.components();
            const current = collection.models.indexOf(selected);
            const nextIndex = direction === 'up' ? current + 1 : current - 1;
            if (nextIndex < 0 || nextIndex >= collection.models.length) return;

            const data = selected.toJSON();
            selected.remove();
            const moved = unwrapAddedComponent(collection.add(data, { at: nextIndex }));
            selectComponent(editor, moved);
        });
    }, [editor, withSelected]);

    const handleGroup = useCallback(() => {
        withSelected((selected) => {
            const parent = selected.parent();
            if (!parent) return;

            const collection = parent.components();
            const currentIndex = collection.models.indexOf(selected);
            const selectedStyle = selected.getStyle?.() ?? {};
            const selectedJson = selected.toJSON();
            selected.remove();

            const wrapperData = {
                tagName: 'div',
                attributes: { 'data-dc-type': 'group' },
                style: {
                    position: selectedStyle.position || 'absolute',
                    left: selectedStyle.left || '64px',
                    top: selectedStyle.top || '64px',
                    width: selectedStyle.width || '300px',
                    height: selectedStyle.height || '200px',
                    padding: '10px',
                    border: '1px dashed #94a3b8',
                    'border-radius': '12px',
                    'background-color': 'rgba(248, 250, 252, 0.62)',
                },
                components: [selectedJson],
            };

            const group = unwrapAddedComponent(collection.add(wrapperData, { at: currentIndex }));
            selectComponent(editor, group);
        });
    }, [editor, withSelected]);

    const handleZoomIn = useCallback(() => {
        setCanvasZoom(zoomLevel + 10);
    }, [zoomLevel, setCanvasZoom]);

    const handleZoomOut = useCallback(() => {
        setCanvasZoom(zoomLevel - 10);
    }, [zoomLevel, setCanvasZoom]);

    const handleZoomReset = useCallback(() => {
        setCanvasZoom(100);
    }, [setCanvasZoom]);

    const handleZoomSliderChange = useCallback((value: number) => {
        setCanvasZoom(value);
    }, [setCanvasZoom]);

    const handleSwitchPage = useCallback((nextIndex: number) => {
        if (!editor) return;
        if (nextIndex === activePageIndexRef.current) return;
        const targetPage = pagesRef.current[nextIndex];
        if (!targetPage) return;

        snapshotCurrentPage();
        setActivePageIndex(nextIndex);
        activePageIndexRef.current = nextIndex;
        applyPageToCanvas(targetPage);
    }, [editor, applyPageToCanvas, snapshotCurrentPage]);

    const handleAddPage = useCallback(() => {
        if (!editor) return;
        snapshotCurrentPage();

        const nextIndex = pagesRef.current.length;
        const newPage: CanvasPage = {
            id: `page-${nextIndex + 1}`,
            name: `Pagina ${nextIndex + 1}`,
            components: [],
            styles: [],
            schema: [],
        };

        const nextPages = [...pagesRef.current, newPage];
        pagesRef.current = nextPages;
        setPages(nextPages);
        setActivePageIndex(nextIndex);
        activePageIndexRef.current = nextIndex;
        applyPageToCanvas(newPage);
    }, [editor, snapshotCurrentPage, applyPageToCanvas]);

    const closeContextMenu = useCallback(() => {
        setContextMenu((prev) => ({ ...prev, open: false }));
    }, []);

    const buildExportPayload = useCallback(() => {
        if (!editor) return null;
        snapshotCurrentPage();
        const schema = serializeCanvas(editor);
        setCanvasStructure(schema);
        return {
            projectName,
            exportedAt: new Date().toISOString(),
            schema,
            pages: pagesRef.current,
            activePageIndex: activePageIndexRef.current,
        };
    }, [editor, projectName, snapshotCurrentPage]);

    const handleExportJson = useCallback(() => {
        const payload = buildExportPayload();
        if (!payload) return;

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const safeName = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        link.href = url;
        link.download = `${safeName || 'projeto'}-canvas.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }, [buildExportPayload, projectName]);

    const importSchema = useCallback((nodes: CanvasElementNode[]) => {
        if (!editor) return;
        const wrapper = editor.getWrapper();
        if (!wrapper) return;
        const components = nodes.map(nodeToComponent);
        wrapper.components().reset(components);
        syncCanvasSchema(editor);
    }, [editor, syncCanvasSchema]);

    const handleInsertBlock = useCallback((payload: SidebarBlockItem | string) => {
        if (!editor) return;
        const fromSidebarItem = typeof payload !== 'string' ? payload : null;
        const safeBlockId = typeof payload === 'string' ? payload.trim() : payload.id.trim();
        if (!safeBlockId) return;

        const block = editor.BlockManager.get(safeBlockId);
        const content = fromSidebarItem?.content ?? block?.get('content');
        if (!content) return;

        const added = editor.addComponents(content as never);
        const inserted = unwrapAddedComponent(added);
        if (inserted) {
            if (snapRef.current) applySnapForComponent(inserted);
            selectComponent(editor, inserted);
        }

        syncCanvasSchema(editor);
    }, [editor, syncCanvasSchema]);

    const handleBlockDragStart = useCallback((item: SidebarBlockItem, event: DragEvent<HTMLButtonElement>) => {
        draggedBlockRef.current = item;
        draggedBlockIdRef.current = item.id;
        event.dataTransfer.setData('application/x-drawcode-block', item.id);
        event.dataTransfer.setData('text/plain', item.id);
        event.dataTransfer.effectAllowed = 'copy';
    }, []);

    const handleCanvasDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }, []);

    const handleCanvasDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const blockId =
            event.dataTransfer.getData('application/x-drawcode-block')
            || event.dataTransfer.getData('text/plain')
            || draggedBlockIdRef.current;
        const draggedItem = draggedBlockRef.current;
        if (!blockId) return;
        if (draggedItem && draggedItem.id === blockId) {
            handleInsertBlock(draggedItem);
        } else {
            const fallbackItem = sidebarBlocks.find((item) => item.id === blockId);
            if (fallbackItem) handleInsertBlock(fallbackItem);
            else handleInsertBlock(blockId);
        }
        draggedBlockRef.current = null;
        draggedBlockIdRef.current = null;
    }, [handleInsertBlock, sidebarBlocks]);

    useEffect(() => {
        if (!editor) return;
        const canvasDoc = editor.Canvas.getDocument();
        if (!canvasDoc) return;

        const onDragOver = (event: globalThis.DragEvent) => {
            event.preventDefault();
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
        };

        const onDrop = (event: globalThis.DragEvent) => {
            event.preventDefault();
            const droppedId =
                event.dataTransfer?.getData('application/x-drawcode-block')
                || event.dataTransfer?.getData('text/plain')
                || draggedBlockIdRef.current;
            if (!droppedId) return;

            const draggedItem = draggedBlockRef.current;
            if (draggedItem && draggedItem.id === droppedId) {
                handleInsertBlock(draggedItem);
            } else {
                const fallbackItem = sidebarBlocks.find((item) => item.id === droppedId);
                if (fallbackItem) handleInsertBlock(fallbackItem);
                else handleInsertBlock(droppedId);
            }

            draggedBlockRef.current = null;
            draggedBlockIdRef.current = null;
        };

        canvasDoc.addEventListener('dragover', onDragOver);
        canvasDoc.addEventListener('drop', onDrop);

        return () => {
            canvasDoc.removeEventListener('dragover', onDragOver);
            canvasDoc.removeEventListener('drop', onDrop);
        };
    }, [editor, handleInsertBlock, sidebarBlocks]);

    const handleImportFile = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const parsed = JSON.parse(text) as unknown as { pages?: CanvasPage[]; activePageIndex?: number };
            if (Array.isArray(parsed?.pages) && parsed.pages.length > 0) {
                const safePages = parsed.pages.map((page, index) => ({
                    id: page.id || `page-${index + 1}`,
                    name: page.name || `Pagina ${index + 1}`,
                    components: Array.isArray(page.components) ? page.components : [],
                    styles: page.styles ?? [],
                    schema: Array.isArray(page.schema) ? page.schema : [],
                }));
                const targetIndex = Math.max(0, Math.min(parsed.activePageIndex ?? 0, safePages.length - 1));
                pagesRef.current = safePages;
                setPages(safePages);
                setActivePageIndex(targetIndex);
                activePageIndexRef.current = targetIndex;
                applyPageToCanvas(safePages[targetIndex] as CanvasPage);
                setSaveMsg('JSON importado com sucesso.');
            } else {
                const nodes = extractImportedNodes(parsed);
                if (!nodes.length) {
                    setSaveMsg('JSON invalido para importacao.');
                    return;
                }

                importSchema(nodes);
                const singlePage: CanvasPage = {
                    id: 'page-1',
                    name: 'Pagina 1',
                    components: nodes.map(nodeToComponent),
                    styles: editor?.getStyle() ?? [],
                    schema: nodes,
                };
                pagesRef.current = [singlePage];
                setPages([singlePage]);
                setActivePageIndex(0);
                activePageIndexRef.current = 0;
                setSaveMsg('JSON importado com sucesso.');
            }
        } catch {
            setSaveMsg('Falha ao importar JSON.');
        } finally {
            event.target.value = '';
            setTimeout(() => setSaveMsg(''), 3000);
        }
    }, [importSchema, applyPageToCanvas, editor]);

    const handleImageUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !editor) return;

        const selected = editor.getSelected() as unknown as AnyComponent | null;
        if (!selected) {
            setSaveMsg('Selecione uma imagem no canvas antes do upload.');
            event.target.value = '';
            return;
        }

        const tagName = String(selected.get('tagName') ?? '').toLowerCase();
        const selectedType = inferTypeFromComponent(selected);
        if (tagName !== 'img' && !selectedType.includes('image')) {
            setSaveMsg('Selecione uma imagem no canvas antes do upload.');
            event.target.value = '';
            return;
        }

        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ''));
            reader.onerror = () => reject(new Error('Falha ao ler imagem'));
            reader.readAsDataURL(file);
        }).catch(() => '');

        if (!dataUrl) {
            setSaveMsg('Falha ao carregar imagem.');
            event.target.value = '';
            return;
        }

        const attrs = selected.getAttributes?.() ?? {};
        selected.setAttributes({
            ...attrs,
            src: dataUrl,
            alt: attrs.alt || file.name || 'Imagem',
        });
        syncCanvasSchema(editor);
        setSaveMsg('Imagem atualizada.');
        setTimeout(() => setSaveMsg(''), 2500);
        event.target.value = '';
    }, [editor, syncCanvasSchema]);

    const handleSave = useCallback(async () => {
        if (!editor || !userId) {
            setSaveMsg('Faca login para salvar projetos.');
            return;
        }

        setSaving(true);
        setSaveMsg('');

        try {
            snapshotCurrentPage();
            const schema = serializeCanvas(editor);
            setCanvasStructure(schema);

            const data = {
                components: editor.getComponents(),
                styles: editor.getStyle(),
                html: editor.getHtml(),
                css: editor.getCss(),
                schema,
                pages: pagesRef.current,
                activePageIndex: activePageIndexRef.current,
            };

            const res = await fetch('/api/grape/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: currentProjectId,
                    name: projectName,
                    data,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                setSaveMsg(`Erro: ${result.error}`);
            } else {
                setCurrentProjectId(result.project.id);
                setSaveMsg('Projeto salvo.');
                setTimeout(() => setSaveMsg(''), 3000);
            }
        } catch {
            setSaveMsg('Erro de conexao.');
        } finally {
            setSaving(false);
        }
    }, [editor, userId, currentProjectId, projectName, snapshotCurrentPage]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (!editor || isInputElement(event.target)) return;
            const isMeta = event.ctrlKey || event.metaKey;
            const key = event.key.toLowerCase();

            if (event.key === 'Delete') {
                event.preventDefault();
                handleDelete();
                closeContextMenu();
                return;
            }

            if (isMeta && key === 'd') {
                event.preventDefault();
                handleDuplicate();
                closeContextMenu();
                return;
            }

            if (isMeta && !event.shiftKey && key === 'z') {
                event.preventDefault();
                handleUndo();
                closeContextMenu();
                return;
            }

            if (isMeta && (key === 'y' || (event.shiftKey && key === 'z'))) {
                event.preventDefault();
                handleRedo();
                closeContextMenu();
                return;
            }

            if (event.key === 'Escape') {
                closeContextMenu();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [editor, handleDelete, handleDuplicate, handleRedo, handleUndo, closeContextMenu]);

    useEffect(() => {
        if (!editor) return;

        const canvasDoc = editor.Canvas.getDocument();
        const frameEl = editor.Canvas.getFrameEl();
        if (!canvasDoc || !frameEl) return;

        const onContextMenu = (event: MouseEvent) => {
            const selected = editor.getSelected();
            if (!selected) return;

            event.preventDefault();

            const frameRect = frameEl.getBoundingClientRect();
            const menuWidth = 210;
            const menuHeight = 280;
            const nextX = Math.min(frameRect.left + event.clientX, window.innerWidth - menuWidth);
            const nextY = Math.min(frameRect.top + event.clientY, window.innerHeight - menuHeight);
            setContextMenu({ open: true, x: Math.max(10, nextX), y: Math.max(10, nextY) });
        };

        const onAnyClick = () => closeContextMenu();
        const onScroll = () => closeContextMenu();

        canvasDoc.addEventListener('contextmenu', onContextMenu);
        canvasDoc.addEventListener('mousedown', onAnyClick);
        window.addEventListener('mousedown', onAnyClick);
        window.addEventListener('resize', onAnyClick);
        window.addEventListener('scroll', onScroll, true);

        return () => {
            canvasDoc.removeEventListener('contextmenu', onContextMenu);
            canvasDoc.removeEventListener('mousedown', onAnyClick);
            window.removeEventListener('mousedown', onAnyClick);
            window.removeEventListener('resize', onAnyClick);
            window.removeEventListener('scroll', onScroll, true);
        };
    }, [editor, closeContextMenu]);

    const dockItems: DockItemData[] = [
        { icon: <VscHome size={18} />, label: 'Dashboard', onClick: () => { window.location.href = '/dashboard'; } },
        { icon: <VscArchive size={18} />, label: 'Salvar', onClick: handleSave },
        { icon: <VscAccount size={18} />, label: 'Exportar JSON', onClick: handleExportJson },
        { icon: <VscSettingsGear size={18} />, label: 'Propriedades', onClick: () => setRightSidebarCollapsed((prev) => !prev) },
    ];

    return (
        <div className={`draw-layout ${leftSidebarCollapsed ? 'left-collapsed' : ''} ${rightSidebarCollapsed ? 'right-collapsed' : ''}`}>
            <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="draw-hidden-input"
                onChange={handleImportFile}
            />
            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="draw-hidden-input"
                onChange={handleImageUpload}
            />

            <BuilderToolbar
                projectName={projectName}
                saving={saving}
                canSave={Boolean(userId)}
                canUseEditorActions={Boolean(editor)}
                snapEnabled={snapEnabled}
                leftSidebarCollapsed={leftSidebarCollapsed}
                rightSidebarCollapsed={rightSidebarCollapsed}
                saveMsg={saveMsg}
                hasUser={Boolean(userId)}
                onProjectNameChange={(event) => setProjectName(event.target.value)}
                onSave={handleSave}
                onExportJson={handleExportJson}
                onImportJson={() => fileInputRef.current?.click()}
                onUploadImage={() => imageInputRef.current?.click()}
                onToggleSnap={() => setSnapEnabled((prev) => !prev)}
                onToggleLeftSidebar={() => setLeftSidebarCollapsed((prev) => !prev)}
                onToggleRightSidebar={() => setRightSidebarCollapsed((prev) => !prev)}
            />

            <BuilderElementsSidebar
                leftSidebarCollapsed={leftSidebarCollapsed}
                groupPanelOpen={groupPanelOpen}
                groupedSidebar={groupedSidebar}
                activeGroup={activeGroup}
                onCollapse={() => setLeftSidebarCollapsed(true)}
                onSelectGroup={(groupId) => {
                    setActiveGroupId(groupId);
                    setLeftSidebarCollapsed(false);
                    setGroupPanelOpen(true);
                }}
                onTogglePanel={() => setGroupPanelOpen((prev) => !prev)}
                onInsertBlock={handleInsertBlock}
                onBlockDragStart={handleBlockDragStart}
            />

            <BuilderCanvasArea
                canvasShellRef={canvasShellRef}
                snapEnabled={snapEnabled}
                isPanning={isPanning}
                zoomLevel={zoomLevel}
                canUseEditorActions={Boolean(editor)}
                dockItems={dockItems}
                onCanvasDragOver={handleCanvasDragOver}
                onCanvasDrop={handleCanvasDrop}
                onZoomSliderChange={handleZoomSliderChange}
                onZoomOut={handleZoomOut}
                onZoomReset={handleZoomReset}
                onZoomIn={handleZoomIn}
            />

            <BuilderPropertiesPanel
                rightSidebarCollapsed={rightSidebarCollapsed}
                canvasElementsCount={canvasStructure.length}
                onCollapse={() => setRightSidebarCollapsed(true)}
            />

            <BuilderContextMenu
                contextMenu={contextMenu}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onDuplicate={handleDuplicate}
                onGroup={handleGroup}
                onMoveFront={() => moveLayer('up')}
                onMoveBack={() => moveLayer('down')}
                onDelete={handleDelete}
                onClose={closeContextMenu}
            />
        </div>
    );
}
