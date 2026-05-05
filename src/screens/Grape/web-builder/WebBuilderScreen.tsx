'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import 'grapesjs/dist/css/grapes.min.css';
import '../ui.css';
import { type DockItemData } from '@/components/Dock';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Baseline,
    Bold,
    Eraser,
    Highlighter,
    Italic,
    Link,
    List,
    ListOrdered,
    MousePointerClick,
    Pilcrow,
    Type,
    Underline,
    Unlink,
} from 'lucide-react';
import { VscAccount, VscArchive, VscHome, VscSettingsGear } from 'react-icons/vsc';
import BuilderToolbar from '../builder-blocks/BuilderToolbar';
import BuilderElementsSidebar from '../builder-blocks/BuilderElementsSidebar';
import BuilderCanvasArea from '../builder-blocks/BuilderCanvasArea';
import BuilderContextMenu from '../builder-blocks/BuilderContextMenu';
import type { CanvasDeviceMode, DrawToolId, QuickEditAction } from '../builder-blocks/types';
import type { RecognizedShape, RecognizedShapeKind } from '@/lib/ai/types';
import {
    CANVAS_DEVICE_WIDTHS,
    CANVAS_INITIAL_TOP_GAP,
    CANVAS_INFINITE_PADDING,
    PAGE_HEIGHT,
    PAGE_WIDTH,
    applySnapForComponent,
    clampCanvasPageHeight,
    getCanvasContentHeight,
    getCanvasPageHeight,
    getSerializableComponents,
    getSerializableProjectData,
    getSerializableStyles,
    normalizeSavedDeviceMode,
    selectComponent,
    setCanvasViewport,
    type AnyComponent,
    type CanvasPage,
    type WrapperBoundsSnapshot,
    type WrapperElementSnapshot,
    type WebBuilderProps,
} from './builder-core';

import {
    useEditorState,
    useCanvasSync,
    useCanvasHandlers,
    useComponentHandlers,
    useFileHandlers,
    useDragDropHandlers,
    useSyncPageRefs,
    useSaveHandler,
    useEditorEventListeners,
    useKeyboardShortcuts,
    useContextMenuHandler,
} from './hooks';

import {
    initializeGrapesJS,
    useCanvasBackdrop,
    useSidebarGroups,
} from './initialization';

type CanvasPoint = {
    x: number;
    y: number;
};

type DrawStrokeSession = {
    start: CanvasPoint;
    points: CanvasPoint[];
    previewElement: SVGSVGElement | null;
};

type TextToolbarState = {
    x: number;
    y: number;
    tone: 'light' | 'dark';
    placement: 'top' | 'bottom';
    bold: boolean;
    italic: boolean;
    underline: boolean;
    align: 'left' | 'center' | 'right' | 'justify';
    fontSize: string;
    lineHeight: string;
    letterSpacing: string;
    color: string;
    backgroundColor: string;
    href: string;
    target: '_self' | '_blank';
    isLink: boolean;
    isButtonLike: boolean;
    listStyle: 'none' | 'disc' | 'decimal';
};

type TextStyleAction =
    | 'bold'
    | 'italic'
    | 'underline'
    | 'align-left'
    | 'align-center'
    | 'align-right'
    | 'font-size'
    | 'line-height'
    | 'letter-spacing'
    | 'color'
    | 'background-color'
    | 'list-bullet'
    | 'list-number'
    | 'link-url'
    | 'link-target'
    | 'link-remove'
    | 'buttonify'
    | 'clear-formatting';

type TextStyleValue = string | number | boolean | null;

const DRAW_STROKE_WIDTH = 4;
const DRAW_PREVIEW_STROKE = '#f472b6';
const DRAW_PREVIEW_FILL = 'rgba(244, 114, 182, 0.18)';
const MIN_DRAW_SIZE = 24;
const DEFAULT_SHAPE_SIZE = 140;
const FONT_SIZE_PRESETS = ['12', '14', '16', '18', '20', '24', '28', '32', '40', '48', '64', '80'];
const LINE_HEIGHT_PRESETS = ['1', '1.15', '1.25', '1.35', '1.5', '1.75', '2'];
const LETTER_SPACING_PRESETS = ['-1', '0', '0.5', '1', '2', '4'];

const parseColorLuminance = (value: string): number | null => {
    const normalized = value.trim().toLowerCase();
    if (!normalized || normalized === 'transparent' || normalized === 'none') return null;

    const rgbMatch = normalized.match(/rgba?\(([^)]+)\)/);
    if (rgbMatch?.[1]) {
        const [r, g, b, alphaValue] = rgbMatch[1].split(',').map((part) => Number.parseFloat(part.trim()));
        const a = Number.isFinite(alphaValue) ? alphaValue : 1;
        if ([r, g, b].some((channel) => !Number.isFinite(channel))) return null;
        if (Number.isFinite(a) && a <= 0.08) return null;
        return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    }

    const hexMatch = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!hexMatch?.[1]) return null;
    const hex = hexMatch[1].length === 3
        ? hexMatch[1].split('').map((char) => `${char}${char}`).join('')
        : hexMatch[1];
    const r = Number.parseInt(hex.slice(0, 2), 16);
    const g = Number.parseInt(hex.slice(2, 4), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

const toHexColor = (value: string | number | undefined, fallback: string): string => {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/i.test(normalized)) return normalized;
    if (/^#[0-9a-f]{3}$/i.test(normalized)) {
        return `#${normalized.slice(1).split('').map((char) => `${char}${char}`).join('')}`;
    }

    const rgbMatch = normalized.match(/rgba?\(([^)]+)\)/);
    if (!rgbMatch?.[1]) return fallback;

    const [r, g, b, alphaValue] = rgbMatch[1].split(',').map((part) => Number.parseFloat(part.trim()));
    const alpha = Number.isFinite(alphaValue) ? alphaValue : 1;
    if ([r, g, b].some((channel) => !Number.isFinite(channel)) || alpha <= 0.08) return fallback;

    const toChannel = (channel: number) => Math.max(0, Math.min(255, Math.round(channel)))
        .toString(16)
        .padStart(2, '0');
    return `#${toChannel(r)}${toChannel(g)}${toChannel(b)}`;
};

function TextSelectionToolbar({
    state,
    onApply,
}: {
    state: TextToolbarState | null;
    onApply: (action: TextStyleAction, value?: TextStyleValue) => void;
}) {
    if (!state) return null;

    const buttonClass = (active: boolean) => (active ? 'is-active' : '');

    return (
        <div
            className={`draw-text-toolbar ${state.tone === 'dark' ? 'is-dark' : ''} ${state.placement === 'bottom' ? 'is-below' : ''}`}
            style={{
                '--draw-text-toolbar-x': `${state.x}px`,
                '--draw-text-toolbar-y': `${state.y}px`,
            } as CSSProperties}
            onMouseDown={(event) => event.stopPropagation()}
        >
            <div className="draw-text-toolbar-group">
                <button type="button" className={buttonClass(state.bold)} onMouseDown={(event) => event.preventDefault()} onClick={() => onApply('bold')} aria-label="Negrito" title="Negrito">
                    <Bold size={16} />
                </button>
                <button type="button" className={buttonClass(state.italic)} onMouseDown={(event) => event.preventDefault()} onClick={() => onApply('italic')} aria-label="Italico" title="Italico">
                    <Italic size={16} />
                </button>
                <button type="button" className={buttonClass(state.underline)} onMouseDown={(event) => event.preventDefault()} onClick={() => onApply('underline')} aria-label="Sublinhado" title="Sublinhado">
                    <Underline size={16} />
                </button>
            </div>

            <div className="draw-text-toolbar-group">
                <button type="button" className={buttonClass(state.align === 'left')} onMouseDown={(event) => event.preventDefault()} onClick={() => onApply('align-left')} aria-label="Alinhar a esquerda" title="Alinhar a esquerda">
                    <AlignLeft size={16} />
                </button>
                <button type="button" className={buttonClass(state.align === 'center')} onMouseDown={(event) => event.preventDefault()} onClick={() => onApply('align-center')} aria-label="Centralizar" title="Centralizar">
                    <AlignCenter size={16} />
                </button>
                <button type="button" className={buttonClass(state.align === 'right')} onMouseDown={(event) => event.preventDefault()} onClick={() => onApply('align-right')} aria-label="Alinhar a direita" title="Alinhar a direita">
                    <AlignRight size={16} />
                </button>
            </div>

            <div className="draw-text-toolbar-group">
                <label className="draw-text-field draw-text-field-number" title="Tamanho da fonte">
                    <Type size={14} />
                    <input
                        type="number"
                        min={8}
                        max={160}
                        step={1}
                        value={state.fontSize}
                        list="draw-font-size-presets"
                        onChange={(event) => onApply('font-size', event.target.value)}
                        aria-label="Tamanho da fonte"
                    />
                </label>
                <datalist id="draw-font-size-presets">
                    {FONT_SIZE_PRESETS.map((size) => <option key={size} value={size} />)}
                </datalist>
                <label className="draw-text-field draw-text-field-select" title="Altura da linha">
                    <Pilcrow size={14} />
                    <select value={state.lineHeight} onChange={(event) => onApply('line-height', event.target.value)} aria-label="Altura da linha">
                        {!LINE_HEIGHT_PRESETS.includes(state.lineHeight) && <option value={state.lineHeight}>{state.lineHeight}</option>}
                        {LINE_HEIGHT_PRESETS.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                </label>
                <label className="draw-text-field draw-text-field-select" title="Espacamento entre letras">
                    <Baseline size={14} />
                    <select value={state.letterSpacing} onChange={(event) => onApply('letter-spacing', event.target.value)} aria-label="Espacamento entre letras">
                        {!LETTER_SPACING_PRESETS.includes(state.letterSpacing) && <option value={state.letterSpacing}>{state.letterSpacing}px</option>}
                        {LETTER_SPACING_PRESETS.map((value) => <option key={value} value={value}>{value}px</option>)}
                    </select>
                </label>
            </div>

            <div className="draw-text-toolbar-group">
                <label className="draw-text-swatch" title="Cor do texto">
                    <Baseline size={14} />
                    <input type="color" value={state.color} onChange={(event) => onApply('color', event.target.value)} aria-label="Cor do texto" />
                </label>
                <label className="draw-text-swatch" title="Cor de fundo">
                    <Highlighter size={14} />
                    <input type="color" value={state.backgroundColor} onChange={(event) => onApply('background-color', event.target.value)} aria-label="Cor de fundo" />
                </label>
            </div>

            <div className="draw-text-toolbar-group">
                <button type="button" className={buttonClass(state.listStyle === 'disc')} onMouseDown={(event) => event.preventDefault()} onClick={() => onApply('list-bullet')} aria-label="Lista com marcadores" title="Lista com marcadores">
                    <List size={16} />
                </button>
                <button type="button" className={buttonClass(state.listStyle === 'decimal')} onMouseDown={(event) => event.preventDefault()} onClick={() => onApply('list-number')} aria-label="Lista numerada" title="Lista numerada">
                    <ListOrdered size={16} />
                </button>
            </div>

            <div className="draw-text-toolbar-group draw-text-toolbar-link">
                <Link size={15} />
                <input
                    type="url"
                    value={state.href}
                    onChange={(event) => onApply('link-url', event.target.value)}
                    placeholder="https://..."
                    aria-label="Destino do link"
                />
                <select value={state.target} onChange={(event) => onApply('link-target', event.target.value)} aria-label="Abertura do link">
                    <option value="_self">Mesma aba</option>
                    <option value="_blank">Nova aba</option>
                </select>
                <button type="button" className={buttonClass(state.isLink)} onMouseDown={(event) => event.preventDefault()} onClick={() => onApply('link-remove')} aria-label="Remover link" title="Remover link">
                    <Unlink size={15} />
                </button>
                <button type="button" className={buttonClass(state.isButtonLike)} onMouseDown={(event) => event.preventDefault()} onClick={() => onApply('buttonify')} aria-label="Transformar em botao" title="Transformar em botao">
                    <MousePointerClick size={15} />
                </button>
            </div>

            <div className="draw-text-toolbar-group">
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onApply('clear-formatting')} aria-label="Remover formatacao" title="Remover formatacao">
                    <Eraser size={16} />
                </button>
            </div>
        </div>
    );
}


export default function WebBuilder({
    userId,
    projectId: initialProjectId,
    projectName: initialProjectName,
    projectData: initialProjectData,
}: WebBuilderProps) {
    // State management
    const editorState = useEditorState(initialProjectId, initialProjectName, initialProjectData);
    const {
        editor,
        saving,
        saveMsg,
        aiOutput,
        aiGenerating,
        currentProjectId,
        projectName,
        snapEnabled,
        canvasStructure,
        leftSidebarCollapsed,
        contextMenu,
        zoomLevel,
        activeGroupId,
        leftPanelMode,
        activeDrawTool,
        sidebarBlocks,
        pages,
        activePageIndex,
        isPanning,
        setEditor,
        setSaving,
        setSaveMsg,
        setAiOutput,
        setAiGenerating,
        setCurrentProjectId,
        setProjectName,
        setSnapEnabled,
        setCanvasStructure,
        setLeftSidebarCollapsed,
        setContextMenu,
        setZoomLevel,
        setActiveGroupId,
        setLeftPanelMode,
        setActiveDrawTool,
        setSidebarBlocks,
        setPages,
        setActivePageIndex,
        setIsPanning,
        fileInputRef,
        imageInputRef,
        canvasShellRef,
        snapRef,
        pagesRef,
        activePageIndexRef,
        zoomRef,
        panStartRef,
        spacePressedRef,
        draggedBlockIdRef,
        draggedBlockRef,
    } = editorState;

    // Canvas sync
    const { syncCanvasSchema, snapshotCurrentPage, applyPageToCanvas } = useCanvasSync(
        editor,
        pagesRef,
        activePageIndexRef,
        setCanvasStructure,
    );

    // Canvas backdrop
    const { applyCanvasBackdrop } = useCanvasBackdrop();

    // Sidebar groups
    const { groupedSidebar, activeGroup } = useSidebarGroups(sidebarBlocks, activeGroupId);
    const drawStrokeRef = useRef<DrawStrokeSession | null>(null);
    const drawModeActive = leftPanelMode === 'draw';
    const [hasSelectedComponent, setHasSelectedComponent] = useState(false);
    const [textToolbar, setTextToolbar] = useState<TextToolbarState | null>(null);
    const [deviceMode, setDeviceMode] = useState<CanvasDeviceMode>(() => (
        normalizeSavedDeviceMode(initialProjectData?.activeDeviceMode)
    ));
    const [isOnline, setIsOnline] = useState(true);
    const [isEditorHydrated, setIsEditorHydrated] = useState(false);
    const [autoSaveVersion, setAutoSaveVersion] = useState(0);
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const forcedAutoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const autoSaveReadyRef = useRef(false);
    const lastAutoSaveFingerprintRef = useRef('');
    const hydratedEditorRef = useRef(false);

    const getSelectedComponent = useCallback((): AnyComponent | null => {
        if (!editor) return null;
        const maybeEditor = editor as unknown as { getSelected?: () => unknown };
        return (maybeEditor.getSelected?.() ?? null) as AnyComponent | null;
    }, [editor]);

    const markAutoSaveDirty = useCallback(() => {
        setAutoSaveVersion((version) => version + 1);
    }, []);

    const getActivePageHeight = useCallback(() => (
        pagesRef.current[activePageIndexRef.current]?.height ?? PAGE_HEIGHT
    ), [activePageIndexRef, pagesRef]);

    const getActiveCanvasWidth = useCallback(() => (
        CANVAS_DEVICE_WIDTHS[deviceMode]
    ), [deviceMode]);

    const applyCanvasDeviceViewport = useCallback((
        mode: CanvasDeviceMode = deviceMode,
        height = getActivePageHeight(),
    ) => {
        if (!editor) return;
        setCanvasViewport(editor, CANVAS_DEVICE_WIDTHS[mode], height);
    }, [deviceMode, editor, getActivePageHeight]);

    const syncActivePageHeightFromCanvas = useCallback((updateState = false) => {
        if (!editor) return getActivePageHeight();
        const nextHeight = getCanvasPageHeight(editor);
        const pageIndex = activePageIndexRef.current;
        const currentPage = pagesRef.current[pageIndex];

        if (currentPage && currentPage.height !== nextHeight) {
            const nextPages = [...pagesRef.current];
            nextPages[pageIndex] = {
                ...currentPage,
                height: nextHeight,
            };
            pagesRef.current = nextPages;
            if (updateState) setPages(nextPages);
        }

        applyCanvasDeviceViewport(deviceMode, nextHeight);
        return nextHeight;
    }, [
        activePageIndexRef,
        applyCanvasDeviceViewport,
        deviceMode,
        editor,
        getActivePageHeight,
        pagesRef,
        setPages,
    ]);

    const clonePayload = useCallback((payload: unknown) => {
        if (payload == null) return payload;
        if (typeof payload === 'string') return payload;
        if (typeof structuredClone === 'function') return structuredClone(payload);
        return JSON.parse(JSON.stringify(payload)) as unknown;
    }, []);

    const buildPathData = useCallback((points: CanvasPoint[], offsetX = 0, offsetY = 0) => (
        points
            .map((point, index) => {
                const x = (point.x - offsetX).toFixed(1);
                const y = (point.y - offsetY).toFixed(1);
                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            })
            .join(' ')
    ), []);

    const createPreviewElement = useCallback((canvasDoc: Document) => {
        const previewHeight = getActivePageHeight();
        const previewWidth = getActiveCanvasWidth();
        const preview = canvasDoc.createElementNS('http://www.w3.org/2000/svg', 'svg');
        preview.setAttribute('width', String(previewWidth));
        preview.setAttribute('height', String(previewHeight));
        preview.setAttribute('viewBox', `0 0 ${previewWidth} ${previewHeight}`);
        preview.setAttribute('fill', 'none');
        preview.style.position = 'absolute';
        preview.style.left = '0';
        preview.style.top = '0';
        preview.style.width = `${previewWidth}px`;
        preview.style.height = `${previewHeight}px`;
        preview.style.pointerEvents = 'none';
        preview.style.overflow = 'visible';
        preview.style.zIndex = '9999';
        canvasDoc.body.appendChild(preview);
        return preview;
    }, [getActiveCanvasWidth, getActivePageHeight]);

    const clearPreviewElement = useCallback((session: DrawStrokeSession | null) => {
        session?.previewElement?.remove();
    }, []);

    const makeShapeBounds = useCallback((start: CanvasPoint, end: CanvasPoint) => {
        const rawWidth = Math.abs(end.x - start.x);
        const rawHeight = Math.abs(end.y - start.y);
        const width = rawWidth < 4 ? DEFAULT_SHAPE_SIZE : Math.max(rawWidth, MIN_DRAW_SIZE);
        const height = rawHeight < 4 ? DEFAULT_SHAPE_SIZE : Math.max(rawHeight, MIN_DRAW_SIZE);
        const left = rawWidth < 4 ? start.x : Math.min(start.x, end.x);
        const top = rawHeight < 4 ? start.y : Math.min(start.y, end.y);

        return { left, top, width, height };
    }, []);

    const makeLineBounds = useCallback((start: CanvasPoint, end: CanvasPoint) => {
        const deltaX = end.x - start.x;
        const deltaY = end.y - start.y;
        if (Math.hypot(deltaX, deltaY) < 4) {
            return {
                start,
                end: { x: start.x + DEFAULT_SHAPE_SIZE, y: start.y },
            };
        }

        return { start, end };
    }, []);

    const renderPreview = useCallback((toolId: DrawToolId, session: DrawStrokeSession) => {
        const preview = session.previewElement;
        if (!preview) return;

        preview.replaceChildren();
        const svgNs = 'http://www.w3.org/2000/svg';
        const currentPoint = session.points[session.points.length - 1] ?? session.start;

        if (toolId === 'pencil') {
            const path = preview.ownerDocument.createElementNS(svgNs, 'path');
            path.setAttribute('d', buildPathData(session.points));
            path.setAttribute('stroke', DRAW_PREVIEW_STROKE);
            path.setAttribute('stroke-width', String(DRAW_STROKE_WIDTH));
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            preview.appendChild(path);
            return;
        }

        if (toolId === 'line') {
            const normalized = makeLineBounds(session.start, currentPoint);
            const line = preview.ownerDocument.createElementNS(svgNs, 'line');
            line.setAttribute('x1', normalized.start.x.toFixed(1));
            line.setAttribute('y1', normalized.start.y.toFixed(1));
            line.setAttribute('x2', normalized.end.x.toFixed(1));
            line.setAttribute('y2', normalized.end.y.toFixed(1));
            line.setAttribute('stroke', DRAW_PREVIEW_STROKE);
            line.setAttribute('stroke-width', String(DRAW_STROKE_WIDTH));
            line.setAttribute('stroke-linecap', 'round');
            preview.appendChild(line);
            return;
        }

        const bounds = makeShapeBounds(session.start, currentPoint);

        if (toolId === 'square') {
            const rect = preview.ownerDocument.createElementNS(svgNs, 'rect');
            rect.setAttribute('x', bounds.left.toFixed(1));
            rect.setAttribute('y', bounds.top.toFixed(1));
            rect.setAttribute('width', bounds.width.toFixed(1));
            rect.setAttribute('height', bounds.height.toFixed(1));
            rect.setAttribute('fill', DRAW_PREVIEW_FILL);
            rect.setAttribute('stroke', DRAW_PREVIEW_STROKE);
            rect.setAttribute('stroke-width', '2');
            preview.appendChild(rect);
            return;
        }

        if (toolId === 'circle') {
            const ellipse = preview.ownerDocument.createElementNS(svgNs, 'ellipse');
            ellipse.setAttribute('cx', (bounds.left + bounds.width / 2).toFixed(1));
            ellipse.setAttribute('cy', (bounds.top + bounds.height / 2).toFixed(1));
            ellipse.setAttribute('rx', (bounds.width / 2).toFixed(1));
            ellipse.setAttribute('ry', (bounds.height / 2).toFixed(1));
            ellipse.setAttribute('fill', DRAW_PREVIEW_FILL);
            ellipse.setAttribute('stroke', DRAW_PREVIEW_STROKE);
            ellipse.setAttribute('stroke-width', '2');
            preview.appendChild(ellipse);
            return;
        }

        if (toolId === 'triangle') {
            const polygon = preview.ownerDocument.createElementNS(svgNs, 'polygon');
            const points = [
                `${(bounds.left + bounds.width / 2).toFixed(1)},${bounds.top.toFixed(1)}`,
                `${bounds.left.toFixed(1)},${(bounds.top + bounds.height).toFixed(1)}`,
                `${(bounds.left + bounds.width).toFixed(1)},${(bounds.top + bounds.height).toFixed(1)}`,
            ].join(' ');
            polygon.setAttribute('points', points);
            polygon.setAttribute('fill', DRAW_PREVIEW_FILL);
            polygon.setAttribute('stroke', DRAW_PREVIEW_STROKE);
            polygon.setAttribute('stroke-width', '2');
            preview.appendChild(polygon);
        }
    }, [buildPathData, makeLineBounds, makeShapeBounds]);

    const resolveCanvasPoint = useCallback((event: MouseEvent): CanvasPoint | null => {
        if (!editor) return null;
        const canvasApi = (editor as { Canvas?: { getDocument?: () => Document | null } }).Canvas;
        const canvasDoc = canvasApi?.getDocument?.();
        const body = canvasDoc?.body;
        if (!body) return null;

        const rect = body.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return null;

        const xRatio = (event.clientX - rect.left) / rect.width;
        const yRatio = (event.clientY - rect.top) / rect.height;

        return {
            x: Math.max(0, Math.min(getActiveCanvasWidth(), xRatio * getActiveCanvasWidth())),
            y: Math.max(0, Math.min(getActivePageHeight(), yRatio * getActivePageHeight())),
        };
    }, [editor, getActiveCanvasWidth, getActivePageHeight]);

    const addCanvasComponent = useCallback((payload: unknown, styleOverrides: Record<string, string> = {}) => {
        if (!editor) return null;
        const added = editor.addComponents(payload as never);
        const inserted = (Array.isArray(added) ? added[0] : added) as AnyComponent | null;
        if (!inserted) return null;

        const currentStyle = (inserted.getStyle?.() ?? {}) as Record<string, string | number | undefined>;
        const sanitizedStyle = Object.fromEntries(
            Object.entries(currentStyle).filter(([, value]) => value !== undefined),
        ) as Record<string, string | number>;
        inserted.setStyle({
            ...sanitizedStyle,
            ...styleOverrides,
        });

        if (snapRef.current) applySnapForComponent(inserted);
        selectComponent(editor, inserted);
        syncCanvasSchema(editor);
        syncActivePageHeightFromCanvas(true);
        markAutoSaveDirty();
        return inserted;
    }, [editor, markAutoSaveDirty, snapRef, syncActivePageHeightFromCanvas, syncCanvasSchema]);

    const insertBlockAtPoint = useCallback((
        blockId: string,
        point: CanvasPoint,
        styleOverrides: Record<string, string> = {},
    ) => {
        if (!editor) return null;
        const block = editor.BlockManager.get(blockId);
        const content = block?.get('content');
        if (!content) return null;

        return addCanvasComponent(clonePayload(content), {
            left: `${Math.round(point.x)}px`,
            top: `${Math.round(point.y)}px`,
            ...styleOverrides,
        });
    }, [addCanvasComponent, clonePayload, editor]);

    const insertShapeAtPoints = useCallback((toolId: DrawToolId, start: CanvasPoint, end: CanvasPoint) => {
        const bounds = makeShapeBounds(start, end);

        if (toolId === 'square') {
            return addCanvasComponent({
                tagName: 'div',
                attributes: { 'data-dc-type': 'shape-rectangle' },
                style: {
                    position: 'absolute',
                    left: `${Math.round(bounds.left)}px`,
                    top: `${Math.round(bounds.top)}px`,
                    width: `${Math.round(bounds.width)}px`,
                    height: `${Math.round(bounds.height)}px`,
                    border: '1px solid rgba(139, 92, 246, 0.9)',
                    'border-radius': '16px',
                    'background-color': '#8b5cf6',
                    'box-shadow': '0 0 30px rgba(236, 72, 153, 0.24)',
                },
            }, {
                'background-color': '#8b5cf6',
                'box-shadow': '0 0 30px rgba(236, 72, 153, 0.24)',
            });
        }

        if (toolId === 'circle') {
            return addCanvasComponent({
                tagName: 'div',
                attributes: { 'data-dc-type': 'shape-circle' },
                style: {
                    position: 'absolute',
                    left: `${Math.round(bounds.left)}px`,
                    top: `${Math.round(bounds.top)}px`,
                    width: `${Math.round(bounds.width)}px`,
                    height: `${Math.round(bounds.height)}px`,
                    border: '1px solid rgba(244, 114, 182, 0.85)',
                    'border-radius': '999px',
                    'background-color': '#f472b6',
                    'box-shadow': '0 0 28px rgba(236, 72, 153, 0.22)',
                },
            }, {
                'background-color': '#f472b6',
                border: '1px solid rgba(244, 114, 182, 0.85)',
                'box-shadow': '0 0 28px rgba(236, 72, 153, 0.22)',
            });
        }

        return addCanvasComponent({
            tagName: 'div',
            attributes: { 'data-dc-type': 'shape-triangle' },
            content: `
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${Math.round(bounds.width)} ${Math.round(bounds.height)}" preserveAspectRatio="none" fill="none">
                    <polygon points="${Math.round(bounds.width / 2)},0 0,${Math.round(bounds.height)} ${Math.round(bounds.width)},${Math.round(bounds.height)}" fill="#f472b6" stroke="rgba(244, 114, 182, 0.88)" stroke-width="2" />
                </svg>
            `,
            style: {
                position: 'absolute',
                left: `${Math.round(bounds.left)}px`,
                top: `${Math.round(bounds.top)}px`,
                width: `${Math.round(bounds.width)}px`,
                height: `${Math.round(bounds.height)}px`,
                'background-color': 'transparent',
                filter: 'drop-shadow(0 0 18px rgba(236, 72, 153, 0.35))',
                overflow: 'visible',
            },
        });
    }, [addCanvasComponent, makeShapeBounds]);

    const insertLineAtPoints = useCallback((start: CanvasPoint, end: CanvasPoint) => {
        const normalized = makeLineBounds(start, end);
        const minX = Math.min(normalized.start.x, normalized.end.x);
        const minY = Math.min(normalized.start.y, normalized.end.y);
        const maxX = Math.max(normalized.start.x, normalized.end.x);
        const maxY = Math.max(normalized.start.y, normalized.end.y);
        const padding = 8;
        const width = Math.max(Math.ceil(maxX - minX) + padding * 2, MIN_DRAW_SIZE);
        const height = Math.max(Math.ceil(maxY - minY) + padding * 2, MIN_DRAW_SIZE);
        const x1 = normalized.start.x - minX + padding;
        const y1 = normalized.start.y - minY + padding;
        const x2 = normalized.end.x - minX + padding;
        const y2 = normalized.end.y - minY + padding;

        return addCanvasComponent({
            tagName: 'div',
            attributes: { 'data-dc-type': 'shape-line' },
            content: `
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" fill="none">
                    <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#f472b6" stroke-width="${DRAW_STROKE_WIDTH}" stroke-linecap="round" />
                </svg>
            `,
            style: {
                position: 'absolute',
                left: `${Math.round(minX - padding)}px`,
                top: `${Math.round(minY - padding)}px`,
                width: `${width}px`,
                height: `${height}px`,
                'background-color': 'transparent',
                'box-shadow': '0 0 18px rgba(236, 72, 153, 0.42)',
                overflow: 'visible',
            },
        });
    }, [addCanvasComponent, makeLineBounds]);

    const insertPencilStroke = useCallback((points: CanvasPoint[]) => {
        if (points.length < 2) return null;

        const minX = Math.min(...points.map((point) => point.x));
        const minY = Math.min(...points.map((point) => point.y));
        const maxX = Math.max(...points.map((point) => point.x));
        const maxY = Math.max(...points.map((point) => point.y));
        const padding = 10;
        const width = Math.max(Math.ceil(maxX - minX) + padding * 2, 24);
        const height = Math.max(Math.ceil(maxY - minY) + padding * 2, 24);
        const pathData = buildPathData(points, minX - padding, minY - padding);
        const gradientId = `dc-draw-gradient-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const content = `
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" fill="none">
                <defs>
                    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#c084fc" />
                        <stop offset="100%" stop-color="#f472b6" />
                    </linearGradient>
                </defs>
                <path d="${pathData}" stroke="url(#${gradientId})" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        `;

        return addCanvasComponent({
            tagName: 'div',
            attributes: { 'data-dc-type': 'freehand-path' },
            content,
            style: {
                position: 'absolute',
                left: `${Math.round(minX - padding)}px`,
                top: `${Math.round(minY - padding)}px`,
                width: `${width}px`,
                height: `${height}px`,
                'background-color': 'transparent',
                overflow: 'visible',
            },
        });
    }, [addCanvasComponent, buildPathData]);

    // Canvas handlers
    const {
        setCanvasZoom,
        beginPan,
        movePan,
        endPan,
        handleZoomIn,
        handleZoomOut,
        handleZoomReset,
        handleZoomSliderChange,
    } = useCanvasHandlers(editor, zoomRef, setZoomLevel, canvasShellRef);

    const centerCanvasShell = useCallback((top = false) => {
        const shell = canvasShellRef.current;
        if (!shell) return;

        window.requestAnimationFrame(() => {
            shell.scrollLeft = Math.max(0, Math.round((shell.scrollWidth - shell.clientWidth) / 2));
            if (top) {
                shell.scrollTop = Math.max(0, CANVAS_INFINITE_PADDING - CANVAS_INITIAL_TOP_GAP);
            }
            (editor as unknown as { refresh?: () => void } | null)?.refresh?.();
            (editor as unknown as { Canvas?: { refresh?: () => void } } | null)?.Canvas?.refresh?.();
        });
    }, [canvasShellRef, editor]);

    const fitCanvasToViewport = useCallback((mode: CanvasDeviceMode = deviceMode) => {
        if (!canvasShellRef.current) return;
        const shellRect = canvasShellRef.current.getBoundingClientRect();
        if (!shellRect.width || !shellRect.height) return;

        const targetWidth = CANVAS_DEVICE_WIDTHS[mode];
        const widthRatio = (shellRect.width - 80) / targetWidth;
        const fitRatio = widthRatio;
        if (!Number.isFinite(fitRatio) || fitRatio <= 0) return;

        const fitZoom = Math.max(20, Math.min(100, Math.round(fitRatio * 100)));
        setCanvasZoom(fitZoom);
        setTimeout(() => centerCanvasShell(true), 90);
    }, [canvasShellRef, centerCanvasShell, deviceMode, setCanvasZoom]);

    const applyDeviceMode = useCallback((mode: CanvasDeviceMode) => {
        setDeviceMode(mode);
        if (!editor) return;
        const targetDevice = mode === 'desktop' ? 'Desktop' : mode === 'tablet' ? 'Tablet' : 'Phone';
        const maybeEditor = editor as unknown as { setDevice?: (name: string) => void };
        maybeEditor.setDevice?.(targetDevice);
        setTimeout(() => {
            applyCanvasDeviceViewport(mode);
            centerCanvasShell(true);
        }, 80);
    }, [applyCanvasDeviceViewport, centerCanvasShell, editor]);

    // Component handlers
    const {
        handleDelete,
        handleUndo,
        handleRedo,
        handleDuplicate,
        moveLayer,
        handleGroup,
    } = useComponentHandlers(editor, syncCanvasSchema);

    // File handlers
    const {
        handleExportJson,
        handleImportFile,
        handleImageUpload,
    } = useFileHandlers(editor, projectName, setSaveMsg, syncCanvasSchema);

    // Drag and drop
    const {
        handleInsertBlock,
        handleBlockDragStart,
        handleCanvasDragOver,
        handleCanvasDrop,
    } = useDragDropHandlers(editor, sidebarBlocks, snapRef, syncCanvasSchema, draggedBlockIdRef, draggedBlockRef);

    // Save handler
    const { handleSave, handleAutoSave } = useSaveHandler(
        editor,
        userId,
        isOnline,
        currentProjectId,
        projectName,
        setSaving,
        setSaveMsg,
        setCurrentProjectId,
        pagesRef,
        activePageIndexRef,
        snapshotCurrentPage,
        deviceMode,
    );

    // Close context menu callback
    const closeContextMenu = useCallback(() => {
        setContextMenu((prev) => ({ ...prev, open: false }));
    }, [setContextMenu]);

    const requestAutoSaveSoon = useCallback((delay = 900) => {
        markAutoSaveDirty();
        if (!editor || !userId || !isEditorHydrated || !isOnline) return;

        if (forcedAutoSaveTimerRef.current) {
            clearTimeout(forcedAutoSaveTimerRef.current);
        }

        forcedAutoSaveTimerRef.current = setTimeout(() => {
            lastAutoSaveFingerprintRef.current = '';
            void handleAutoSave();
        }, delay);
    }, [
        editor,
        handleAutoSave,
        isEditorHydrated,
        isOnline,
        markAutoSaveDirty,
        userId,
    ]);

    const adjustActivePageHeight = useCallback((delta: number) => {
        const pageIndex = activePageIndexRef.current;
        const currentPage = pagesRef.current[pageIndex];
        if (!currentPage) return;

        const contentHeight = editor ? getCanvasContentHeight(editor) : PAGE_HEIGHT;
        const currentHeight = clampCanvasPageHeight(currentPage.height ?? contentHeight);
        const minHeight = clampCanvasPageHeight(contentHeight);
        const shell = canvasShellRef.current;
        const wasNearBottom = shell
            ? shell.scrollTop + shell.clientHeight >= shell.scrollHeight - 80
            : false;
        const nextHeight = delta < 0
            ? Math.max(PAGE_HEIGHT, minHeight, currentHeight + delta)
            : clampCanvasPageHeight(currentHeight + delta);

        if (nextHeight === currentHeight) {
            setSaveMsg(delta < 0 ? 'A tela ja esta no menor tamanho seguro para o conteudo.' : '');
            if (delta < 0) setTimeout(() => setSaveMsg(''), 1800);
            return;
        }

        const nextPages = [...pagesRef.current];
        nextPages[pageIndex] = {
            ...currentPage,
            height: nextHeight,
        };
        pagesRef.current = nextPages;
        setPages(nextPages);
        applyCanvasDeviceViewport(deviceMode, nextHeight);
        window.requestAnimationFrame(() => {
            if (shell && delta > 0 && wasNearBottom) {
                shell.scrollTop = shell.scrollHeight;
            }
            centerCanvasShell(false);
        });
        requestAutoSaveSoon(600);
    }, [
        activePageIndexRef,
        applyCanvasDeviceViewport,
        canvasShellRef,
        centerCanvasShell,
        deviceMode,
        editor,
        pagesRef,
        requestAutoSaveSoon,
        setSaveMsg,
        setPages,
    ]);

    const normalizePagePath = useCallback((value: string, fallback = '/page') => {
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
    }, []);

    const makeUniquePagePath = useCallback((path: string, existingPaths: string[]) => {
        const normalizedSet = new Set(existingPaths.map((entry) => normalizePagePath(entry)));
        const normalizedPath = normalizePagePath(path);
        if (!normalizedSet.has(normalizedPath)) return normalizedPath;

        let suffix = 2;
        let candidate = `${normalizedPath}-${suffix}`;
        while (normalizedSet.has(candidate)) {
            suffix += 1;
            candidate = `${normalizedPath}-${suffix}`;
        }
        return candidate;
    }, [normalizePagePath]);

    const handleSelectPage = useCallback((targetIndex: number) => {
        if (!editor) return;
        if (targetIndex < 0 || targetIndex >= pagesRef.current.length) return;
        if (targetIndex === activePageIndexRef.current) return;

        const snapshotPages = snapshotCurrentPage() ?? pagesRef.current;
        const targetPage = snapshotPages[targetIndex];
        if (!targetPage) return;

        pagesRef.current = snapshotPages;
        setPages(snapshotPages);
        activePageIndexRef.current = targetIndex;
        setActivePageIndex(targetIndex);
        applyPageToCanvas(targetPage);
        setTimeout(() => {
            applyCanvasDeviceViewport(deviceMode, targetPage.height ?? PAGE_HEIGHT);
            centerCanvasShell(true);
        }, 0);
        requestAutoSaveSoon();
    }, [
        editor,
        snapshotCurrentPage,
        pagesRef,
        activePageIndexRef,
        setPages,
        setActivePageIndex,
        applyPageToCanvas,
        applyCanvasDeviceViewport,
        centerCanvasShell,
        deviceMode,
        requestAutoSaveSoon,
    ]);

    const handleCreatePage = useCallback(() => {
        if (!editor) return;

        const snapshotPages = snapshotCurrentPage() ?? pagesRef.current;
        const nextIndex = snapshotPages.length;
        const defaultPath = nextIndex === 0 ? '/home' : `/page-${nextIndex + 1}`;
        const nextPath = makeUniquePagePath(defaultPath, snapshotPages.map((page) => page.name));

        const newPage: CanvasPage = {
            id: `page-${Date.now()}-${nextIndex + 1}`,
            name: nextPath,
            components: [],
            styles: [],
            schema: [],
            height: PAGE_HEIGHT,
        };

        const nextPages = [...snapshotPages, newPage];
        pagesRef.current = nextPages;
        setPages(nextPages);
        activePageIndexRef.current = nextIndex;
        setActivePageIndex(nextIndex);
        applyPageToCanvas(newPage);
        setTimeout(() => {
            applyCanvasDeviceViewport(deviceMode, PAGE_HEIGHT);
            centerCanvasShell(true);
        }, 0);
        requestAutoSaveSoon();
    }, [
        editor,
        snapshotCurrentPage,
        pagesRef,
        setPages,
        activePageIndexRef,
        setActivePageIndex,
        makeUniquePagePath,
        applyPageToCanvas,
        applyCanvasDeviceViewport,
        centerCanvasShell,
        deviceMode,
        requestAutoSaveSoon,
    ]);

    const handleRenamePage = useCallback((pageId: string, nextPathInput: string) => {
        const pageIndex = pagesRef.current.findIndex((page) => page.id === pageId);
        if (pageIndex < 0) return;

        const existingPaths = pagesRef.current
            .filter((page) => page.id !== pageId)
            .map((page) => page.name);
        const normalized = normalizePagePath(nextPathInput, `/page-${pageIndex + 1}`);
        const uniquePath = makeUniquePagePath(normalized, existingPaths);

        const nextPages = [...pagesRef.current];
        const currentPage = nextPages[pageIndex];
        if (!currentPage) return;

        nextPages[pageIndex] = {
            ...currentPage,
            name: uniquePath,
        };
        pagesRef.current = nextPages;
        setPages(nextPages);
        requestAutoSaveSoon();
    }, [makeUniquePagePath, normalizePagePath, pagesRef, requestAutoSaveSoon, setPages]);

    const captureCanvasSnapshot = useCallback(() => {
        if (!editor) {
            return {
                canvasDocumentHtml: '',
                canvasBodyHtml: '',
                wrapperHtml: '',
                wrapperBounds: { width: PAGE_WIDTH, height: PAGE_HEIGHT } as WrapperBoundsSnapshot,
                wrapperElements: [] as WrapperElementSnapshot[],
            };
        }

        const canvasApi = (editor as { Canvas?: { getDocument?: () => Document | null } }).Canvas;
        const canvasDoc = canvasApi?.getDocument?.();
        if (!canvasDoc?.body || !canvasDoc.documentElement) {
            return {
                canvasDocumentHtml: '',
                canvasBodyHtml: '',
                wrapperHtml: '',
                wrapperBounds: { width: PAGE_WIDTH, height: PAGE_HEIGHT } as WrapperBoundsSnapshot,
                wrapperElements: [] as WrapperElementSnapshot[],
            };
        }

        const wrapper = ((
            canvasDoc.body.matches('[data-gjs-type="wrapper"]')
                ? canvasDoc.body
                : canvasDoc.body.querySelector('[data-gjs-type="wrapper"]')
        ) as HTMLElement | null) ?? canvasDoc.body;
        const wrapperRect = wrapper?.getBoundingClientRect();
        const wrapperBounds: WrapperBoundsSnapshot = {
            width: Math.round(wrapperRect?.width || PAGE_WIDTH),
            height: Math.round(wrapperRect?.height || PAGE_HEIGHT),
        };

        const serializeWrapperElement = (element: HTMLElement): WrapperElementSnapshot => {
            const computed = canvasDoc.defaultView?.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            const attributes = Object.fromEntries(
                Array.from(element.attributes)
                    .filter((attribute) => !attribute.name.startsWith('data-gjs-'))
                    .map((attribute) => [attribute.name, attribute.value]),
            );

            return {
                id: element.id || '',
                tagName: element.tagName.toLowerCase(),
                type: element.getAttribute('data-dc-type') || element.getAttribute('data-gjs-type') || 'default',
                text: element.textContent?.trim() || '',
                html: element.innerHTML,
                position: {
                    x: Math.round(rect.left - (wrapperRect?.left || rect.left)),
                    y: Math.round(rect.top - (wrapperRect?.top || rect.top)),
                },
                size: {
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                },
                style: {
                    display: computed?.display || '',
                    position: computed?.position || '',
                    fontFamily: computed?.fontFamily || '',
                    lineHeight: computed?.lineHeight || '',
                    letterSpacing: computed?.letterSpacing || '',
                    textAlign: computed?.textAlign || '',
                    backgroundColor: computed?.backgroundColor || '',
                    backgroundImage: computed?.backgroundImage || '',
                    color: computed?.color || '',
                    fontSize: computed?.fontSize || '',
                    fontWeight: computed?.fontWeight || '',
                    padding: computed?.padding || '',
                    margin: computed?.margin || '',
                    border: computed?.border || '',
                    borderRadius: computed?.borderRadius || '',
                    borderWidth: computed?.borderWidth || '',
                    borderColor: computed?.borderColor || '',
                    borderStyle: computed?.borderStyle || '',
                    opacity: computed?.opacity || '',
                    boxShadow: computed?.boxShadow || '',
                    transform: computed?.transform || '',
                    zIndex: computed?.zIndex || '',
                },
                attributes,
                children: Array.from(element.children)
                    .filter((child): child is HTMLElement => child instanceof HTMLElement)
                    .map(serializeWrapperElement),
            };
        };

        return {
            canvasDocumentHtml: canvasDoc.documentElement.outerHTML,
            canvasBodyHtml: canvasDoc.body.outerHTML,
            wrapperHtml: wrapper?.innerHTML || '',
            wrapperBounds,
            wrapperElements: wrapper
                ? Array.from(wrapper.children)
                    .filter((child): child is HTMLElement => child instanceof HTMLElement)
                    .map(serializeWrapperElement)
                : [],
        };
    }, [editor]);

    const buildSketchHints = useCallback(() => {
        const flattened = canvasStructure.flatMap((node) => {
            const stack = [node];
            const output: typeof canvasStructure = [];

            while (stack.length > 0) {
                const current = stack.shift();
                if (!current) continue;
                output.push(current);
                if (current.children?.length) {
                    stack.push(...current.children);
                }
            }

            return output;
        });

        const freehand = flattened.filter((node) => node.type === 'freehand-path');
        const lines = flattened.filter((node) => node.type === 'shape-line');
        const titles = flattened.filter((node) => node.type === 'title');
        const images = flattened.filter((node) => node.type.includes('image'));

        return {
            freehandCount: freehand.length,
            lineCount: lines.length,
            titleCount: titles.length,
            imageCount: images.length,
            freehandRegions: freehand.map((node) => ({
                x: node.position.x,
                y: node.position.y,
                width: node.size.width,
                height: node.size.height,
            })),
        };
    }, [canvasStructure]);

    const shapeKindToDataType = useCallback((kind: RecognizedShapeKind) => {
        if (kind === 'circle') return 'shape-circle';
        if (kind === 'line') return 'shape-line';
        if (kind === 'triangle') return 'shape-triangle';
        if (kind === 'button') return 'button';
        if (kind === 'input') return 'input';
        if (kind === 'text') return 'paragraph';
        if (kind === 'image') return 'image';
        if (kind === 'container') return 'container';
        return 'shape-rectangle';
    }, []);

    const shapeKindToTag = useCallback((kind: RecognizedShapeKind) => {
        if (kind === 'button') return 'button';
        if (kind === 'input') return 'input';
        if (kind === 'text') return 'p';
        if (kind === 'image') return 'img';
        return 'div';
    }, []);

    const normalizeGeneratedShape = useCallback((shape: RecognizedShape): RecognizedShape => {
        if (shape.kind !== 'circle') return shape;

        const size = Math.max(shape.width, shape.height);
        return {
            ...shape,
            x: Math.round(shape.x - (size - shape.width) / 2),
            y: Math.round(shape.y - (size - shape.height) / 2),
            width: size,
            height: size,
            borderRadius: 999,
        };
    }, []);

    const shapeToCanvasComponent = useCallback((rawShape: RecognizedShape): Record<string, unknown> => {
        const shape = normalizeGeneratedShape(rawShape);
        const tagName = shapeKindToTag(shape.kind);
        const solidColor = shape.color || '#8b5cf6';
        const height = shape.kind === 'line' ? Math.max(4, Math.min(10, shape.height)) : shape.height;
        const text = shape.text || shape.label;
        const style: Record<string, string | number> = {
            position: 'absolute',
            left: `${shape.x}px`,
            top: `${shape.y}px`,
            width: `${shape.width}px`,
            height: `${height}px`,
            'background-color': shape.kind === 'text' || shape.kind === 'image' ? 'transparent' : solidColor,
            color: shape.kind === 'text' || shape.kind === 'input' ? '#111827' : '#ffffff',
            'border-radius': `${shape.kind === 'circle' || shape.kind === 'line' ? 999 : shape.borderRadius}px`,
            border: shape.kind === 'input' ? '1px solid rgba(124, 58, 237, 0.28)' : '0',
            opacity: shape.opacity || 1,
            'z-index': shape.zIndex || 1,
            'box-sizing': 'border-box',
        };

        if (shape.kind === 'line') {
            style.transform = `rotate(${shape.rotation || 0}deg)`;
            style['transform-origin'] = 'left center';
        }

        if (shape.kind === 'triangle') {
            style['clip-path'] = 'polygon(50% 0%, 0 100%, 100% 100%)';
        }

        if (shape.kind === 'button') {
            style.display = 'inline-flex';
            style['align-items'] = 'center';
            style['justify-content'] = 'center';
            style['font-weight'] = 800;
            style.cursor = 'pointer';
        }

        if (shape.kind === 'text') {
            style.margin = '0';
            style.padding = '0';
            style['font-size'] = '18px';
            style['line-height'] = '1.35';
            style['font-weight'] = 700;
        }

        if (shape.kind === 'input') {
            style.padding = '0 14px';
            style['font-size'] = '16px';
        }

        const attributes: Record<string, string> = {
            'data-dc-type': shapeKindToDataType(shape.kind),
            'data-ai-generated': 'true',
        };

        if (tagName === 'input') {
            attributes.placeholder = text || 'Digite aqui';
        }

        if (tagName === 'img') {
            attributes.src = 'https://placehold.co/800x450?text=Imagem';
            attributes.alt = text || 'Imagem';
            style['object-fit'] = 'cover';
        }

        const component: Record<string, unknown> = {
            tagName,
            attributes,
            style,
        };

        if (tagName !== 'input' && tagName !== 'img' && ['button', 'text'].includes(shape.kind)) {
            component.content = text || (shape.kind === 'button' ? 'Botao' : 'Texto');
        }

        return component;
    }, [normalizeGeneratedShape, shapeKindToDataType, shapeKindToTag]);

    const applyAiGeneratedLayout = useCallback((shapes: RecognizedShape[]) => {
        if (!editor || shapes.length === 0) return false;

        const wrapper = editor.getWrapper() as unknown as AnyComponent | null;
        if (!wrapper) return false;

        const components = shapes
            .map(shapeToCanvasComponent)
            .sort((a, b) => {
                const styleA = a.style as Record<string, string | number>;
                const styleB = b.style as Record<string, string | number>;
                return Number(styleA['z-index'] || 0) - Number(styleB['z-index'] || 0);
            });

        editor.setComponents(components as never);
        editor.setStyle([] as never);
        const schema = syncCanvasSchema(editor);
        const nextHeight = getCanvasPageHeight(editor);
        const pageIndex = activePageIndexRef.current;
        const currentPage = pagesRef.current[pageIndex];

        if (currentPage) {
            const nextPages = [...pagesRef.current];
            nextPages[pageIndex] = {
                ...currentPage,
                components: getSerializableComponents(editor),
                styles: getSerializableStyles(editor),
                schema,
                height: nextHeight,
                html: editor.getHtml(),
                css: editor.getCss(),
                projectData: getSerializableProjectData(editor),
            };
            pagesRef.current = nextPages;
            setPages(nextPages);
        }

        applyCanvasDeviceViewport(deviceMode, nextHeight);
        markAutoSaveDirty();
        return true;
    }, [
        activePageIndexRef,
        applyCanvasDeviceViewport,
        deviceMode,
        editor,
        markAutoSaveDirty,
        pagesRef,
        setPages,
        shapeToCanvasComponent,
        syncCanvasSchema,
    ]);

    const handleGenerateAi = useCallback(async () => {
        if (!editor) {
            setSaveMsg('Editor indisponivel para gerar com IA.');
            return;
        }

        setAiGenerating(true);
        setSaveMsg('');

        try {
            const { canvasDocumentHtml, canvasBodyHtml, wrapperHtml, wrapperBounds, wrapperElements } = captureCanvasSnapshot();
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectName,
                    html: editor.getHtml(),
                    css: editor.getCss(),
                    canvasDocumentHtml,
                    canvasBodyHtml,
                    wrapperHtml,
                    wrapperBounds,
                    wrapperElements,
                    canvasStructure,
                    pages: pagesRef.current,
                    sketchHints: buildSketchHints(),
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(typeof result?.error === 'string' ? result.error : 'Falha ao gerar com IA.');
            }

            const output = result.output as { recognizedShapes?: RecognizedShape[]; summary?: string };
            const shapes = output.recognizedShapes ?? [];
            const canApplyRecognizedShapes = shapes.length > 0 && shapes.every((shape) => {
                const sourceType = shape.sourceType.toLowerCase();
                return sourceType.includes('freehand') || sourceType.includes('shape-');
            });
            const applied = canApplyRecognizedShapes ? applyAiGeneratedLayout(shapes) : false;
            const preservedStyles = shapes.length > 0 && !canApplyRecognizedShapes;

            setAiOutput(
                applied
                    ? 'Layout atualizado pela IA.'
                    : preservedStyles
                        ? 'IA gerou saida fiel preservando estilos, cores e CSS do canvas.'
                        : 'Nenhuma forma foi reconhecida para aplicar.',
            );
            setLeftSidebarCollapsed(true);
            setLeftPanelMode('elements');
            setSaveMsg(
                applied
                    ? 'Layout atualizado com IA.'
                    : preservedStyles
                        ? 'Layout preservado: estilos e CSS mantidos na geracao IA.'
                        : 'Desenhe ou adicione elementos antes de gerar com IA.',
            );
            setTimeout(() => setSaveMsg(''), 2800);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Falha ao gerar com IA.';
            setSaveMsg(message);
        } finally {
            setAiGenerating(false);
        }
    }, [
        editor,
        projectName,
        canvasStructure,
        pagesRef,
        captureCanvasSnapshot,
        buildSketchHints,
        applyAiGeneratedLayout,
        setAiGenerating,
        setAiOutput,
        setLeftSidebarCollapsed,
        setLeftPanelMode,
        setSaveMsg,
    ]);

    const isTextLikeComponent = useCallback((component: AnyComponent | null) => {
        if (!component) return false;
        const tagName = String(component.get?.('tagName') ?? '').toLowerCase();
        const type = String(component.getAttributes?.()?.['data-dc-type'] ?? component.get?.('type') ?? '').toLowerCase();
        return (
            ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'button', 'a', 'li'].includes(tagName) ||
            type.includes('text') ||
            type.includes('title') ||
            type.includes('paragraph') ||
            type.includes('button')
        );
    }, []);

    const getSelectedCanvasElement = useCallback((selected: AnyComponent, canvasDoc: Document) => (
        (selected as unknown as { getEl?: () => HTMLElement | null }).getEl?.()
        ?? canvasDoc.getElementById(selected.getId?.() ?? '')
    ), []);

    const getActiveTextRange = useCallback((canvasDoc: Document, componentEl: HTMLElement) => {
        const selection = canvasDoc.getSelection?.();
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;

        const range = selection.getRangeAt(0);
        const commonNode = range.commonAncestorContainer;
        const commonElement = commonNode.nodeType === 1
            ? commonNode as Element
            : commonNode.parentElement;
        if (!commonElement || !componentEl.contains(commonElement)) return null;

        return range;
    }, []);

    const refreshTextToolbar = useCallback(() => {
        if (!editor || (drawModeActive && activeDrawTool !== 'select')) {
            setTextToolbar(null);
            return;
        }

        const selected = getSelectedComponent();
        if (!selected || !isTextLikeComponent(selected)) {
            setTextToolbar(null);
            return;
        }

        const canvasApi = (editor as {
            Canvas?: {
                getDocument?: () => Document | null;
                getFrameEl?: () => HTMLIFrameElement | null;
            };
        }).Canvas;
        const canvasDoc = canvasApi?.getDocument?.();
        const frameEl = canvasApi?.getFrameEl?.();
        if (!canvasDoc || !frameEl) {
            setTextToolbar(null);
            return;
        }

        const componentEl = getSelectedCanvasElement(selected, canvasDoc);
        if (!componentEl) {
            setTextToolbar(null);
            return;
        }

        const componentRect = componentEl.getBoundingClientRect();
        if (componentRect.width < 2 || componentRect.height < 2) {
            setTextToolbar(null);
            return;
        }

        const selectedRange = getActiveTextRange(canvasDoc, componentEl);
        const rangeRect = selectedRange?.getBoundingClientRect();
        const anchorRect = rangeRect && rangeRect.width > 1 && rangeRect.height > 1
            ? rangeRect
            : componentRect;
        const computed = canvasDoc.defaultView?.getComputedStyle(componentEl);
        let backgroundLuminance: number | null = null;
        let backgroundProbe: HTMLElement | null = componentEl;
        while (backgroundProbe && backgroundLuminance == null) {
            const probeStyle = canvasDoc.defaultView?.getComputedStyle(backgroundProbe);
            backgroundLuminance = parseColorLuminance(probeStyle?.backgroundColor ?? '');
            backgroundProbe = backgroundProbe.parentElement;
        }
        backgroundLuminance ??= parseColorLuminance(canvasDoc.defaultView?.getComputedStyle(canvasDoc.body)?.backgroundColor ?? '') ?? 1;
        const frameRect = frameEl.getBoundingClientRect();
        const frameLayoutWidth = frameEl.offsetWidth || Number.parseFloat(frameEl.style.width) || getActiveCanvasWidth();
        const frameLayoutHeight = frameEl.offsetHeight || Number.parseFloat(frameEl.style.height) || getActivePageHeight();
        const scaleX = frameRect.width / Math.max(1, frameLayoutWidth);
        const scaleY = frameRect.height / Math.max(1, frameLayoutHeight);
        const visualCenterX = frameRect.left + (anchorRect.left + anchorRect.width / 2) * scaleX;
        const visualTop = frameRect.top + anchorRect.top * scaleY;
        const visualBottom = frameRect.top + (anchorRect.top + anchorRect.height) * scaleY;
        const estimatedHalfWidth = Math.min(390, Math.max(180, window.innerWidth * 0.38));
        const safeX = window.innerWidth < 560
            ? window.innerWidth / 2
            : Math.max(estimatedHalfWidth, Math.min(window.innerWidth - estimatedHalfWidth, visualCenterX));
        const shouldPlaceBelow = visualTop < 170;
        const currentStyle = selected.getStyle?.() ?? {};
        const attrs = selected.getAttributes?.() ?? {};
        const tagName = String(selected.get?.('tagName') ?? '').toLowerCase();
        const type = String(attrs['data-dc-type'] ?? selected.get?.('type') ?? '').toLowerCase();
        const fontWeight = String(currentStyle['font-weight'] ?? computed?.fontWeight ?? '');
        const numericWeight = Number.parseInt(fontWeight, 10);
        const textDecoration = String(
            currentStyle['text-decoration']
            ?? currentStyle['textDecoration']
            ?? computed?.textDecorationLine
            ?? '',
        ).toLowerCase();
        const fontSizeNumber = Math.round(Number.parseFloat(String(currentStyle['font-size'] ?? computed?.fontSize ?? '16')) || 16);
        const rawLineHeight = String(currentStyle['line-height'] ?? computed?.lineHeight ?? '1.25');
        const lineHeightNumber = Number.parseFloat(rawLineHeight);
        const lineHeight = rawLineHeight.includes('px') && Number.isFinite(lineHeightNumber) && fontSizeNumber > 0
            ? String(Math.round((lineHeightNumber / fontSizeNumber) * 100) / 100)
            : rawLineHeight === 'normal'
                ? '1.25'
                : rawLineHeight;
        const rawLetterSpacing = String(currentStyle['letter-spacing'] ?? computed?.letterSpacing ?? '0');
        const letterSpacing = rawLetterSpacing === 'normal'
            ? '0'
            : String(Number.parseFloat(rawLetterSpacing) || 0);
        const textAlign = String(currentStyle['text-align'] ?? computed?.textAlign ?? 'left').toLowerCase();
        const listStyle = String(currentStyle['list-style-type'] ?? computed?.listStyleType ?? '').toLowerCase();
        const align = textAlign === 'center' || textAlign === 'right' || textAlign === 'justify'
            ? textAlign
            : 'left';

        setTextToolbar({
            x: safeX,
            y: shouldPlaceBelow
                ? Math.max(18, Math.min(window.innerHeight - 80, visualBottom + 14))
                : Math.max(154, Math.min(window.innerHeight - 20, visualTop - 14)),
            placement: shouldPlaceBelow ? 'bottom' : 'top',
            tone: backgroundLuminance > 0.55 ? 'light' : 'dark',
            bold: fontWeight === 'bold' || (Number.isFinite(numericWeight) && numericWeight >= 600),
            italic: String(currentStyle['font-style'] ?? computed?.fontStyle ?? '').toLowerCase() === 'italic',
            underline: textDecoration.includes('underline'),
            align,
            fontSize: String(fontSizeNumber),
            lineHeight,
            letterSpacing,
            color: toHexColor(currentStyle.color ?? computed?.color, '#111827'),
            backgroundColor: toHexColor(currentStyle['background-color'] ?? computed?.backgroundColor, '#ffffff'),
            href: String(attrs.href ?? ''),
            target: attrs.target === '_blank' ? '_blank' : '_self',
            isLink: Boolean(attrs.href) || tagName === 'a',
            isButtonLike: tagName === 'button' || attrs.role === 'button' || type.includes('button'),
            listStyle: listStyle === 'disc' || listStyle === 'circle' || listStyle === 'square'
                ? 'disc'
                : listStyle === 'decimal'
                    ? 'decimal'
                    : 'none',
        });
    }, [
        activeDrawTool,
        drawModeActive,
        editor,
        getActiveCanvasWidth,
        getActivePageHeight,
        getActiveTextRange,
        getSelectedCanvasElement,
        getSelectedComponent,
        isTextLikeComponent,
    ]);

    const handleTextStyleAction = useCallback((action: TextStyleAction, value?: TextStyleValue) => {
        const selected = getSelectedComponent();
        if (!editor || !selected || !isTextLikeComponent(selected)) return;

        const canvasApi = (editor as { Canvas?: { getDocument?: () => Document | null } }).Canvas;
        const canvasDoc = canvasApi?.getDocument?.();
        const componentEl = canvasDoc ? getSelectedCanvasElement(selected, canvasDoc) : null;
        const selectedRange = canvasDoc && componentEl ? getActiveTextRange(canvasDoc, componentEl) : null;
        const hasTextRange = Boolean(selectedRange && componentEl);
        const runRangeCommand = (command: string, commandValue?: string) => {
            if (!canvasDoc || !componentEl || !hasTextRange) return false;
            componentEl.focus?.();
            canvasDoc.execCommand(command, false, commandValue);
            selected.set('content', componentEl.innerHTML);
            return true;
        };

        if (action === 'bold' && runRangeCommand('bold')) {
            syncCanvasSchema(editor);
            markAutoSaveDirty();
            window.requestAnimationFrame(refreshTextToolbar);
            return;
        }

        if (action === 'italic' && runRangeCommand('italic')) {
            syncCanvasSchema(editor);
            markAutoSaveDirty();
            window.requestAnimationFrame(refreshTextToolbar);
            return;
        }

        if (action === 'underline' && runRangeCommand('underline')) {
            syncCanvasSchema(editor);
            markAutoSaveDirty();
            window.requestAnimationFrame(refreshTextToolbar);
            return;
        }

        if (action === 'align-left' && runRangeCommand('justifyLeft')) {
            syncCanvasSchema(editor);
            markAutoSaveDirty();
            window.requestAnimationFrame(refreshTextToolbar);
            return;
        }

        if (action === 'align-center' && runRangeCommand('justifyCenter')) {
            syncCanvasSchema(editor);
            markAutoSaveDirty();
            window.requestAnimationFrame(refreshTextToolbar);
            return;
        }

        if (action === 'align-right' && runRangeCommand('justifyRight')) {
            syncCanvasSchema(editor);
            markAutoSaveDirty();
            window.requestAnimationFrame(refreshTextToolbar);
            return;
        }

        if (action === 'list-bullet' && runRangeCommand('insertUnorderedList')) {
            syncCanvasSchema(editor);
            markAutoSaveDirty();
            window.requestAnimationFrame(refreshTextToolbar);
            return;
        }

        if (action === 'list-number' && runRangeCommand('insertOrderedList')) {
            syncCanvasSchema(editor);
            markAutoSaveDirty();
            window.requestAnimationFrame(refreshTextToolbar);
            return;
        }

        if (action === 'clear-formatting' && runRangeCommand('removeFormat')) {
            syncCanvasSchema(editor);
            markAutoSaveDirty();
            window.requestAnimationFrame(refreshTextToolbar);
            return;
        }

        if (action === 'color' && typeof value === 'string' && runRangeCommand('foreColor', value)) {
            syncCanvasSchema(editor);
            markAutoSaveDirty();
            window.requestAnimationFrame(refreshTextToolbar);
            return;
        }

        if (action === 'background-color' && typeof value === 'string' && runRangeCommand('hiliteColor', value)) {
            syncCanvasSchema(editor);
            markAutoSaveDirty();
            window.requestAnimationFrame(refreshTextToolbar);
            return;
        }

        if (action === 'link-url' && typeof value === 'string' && value.trim() && runRangeCommand('createLink', value.trim())) {
            if (componentEl) {
                Array.from(componentEl.querySelectorAll('a[href]')).forEach((anchor) => {
                    anchor.setAttribute('target', textToolbar?.target ?? '_self');
                    if ((textToolbar?.target ?? '_self') === '_blank') {
                        anchor.setAttribute('rel', 'noopener noreferrer');
                    } else {
                        anchor.removeAttribute('rel');
                    }
                });
                selected.set('content', componentEl.innerHTML);
            }
            syncCanvasSchema(editor);
            markAutoSaveDirty();
            window.requestAnimationFrame(refreshTextToolbar);
            return;
        }

        const currentStyle = selected.getStyle?.() ?? {};
        const nextStyle: Record<string, string | number | undefined> = { ...currentStyle };
        const attrs = selected.getAttributes?.() ?? {};
        const nextAttrs: Record<string, string> = { ...attrs };
        const setStyleValue = (key: string, nextValue: string | number | undefined) => {
            if (nextValue === undefined || nextValue === '') {
                delete nextStyle[key];
                return;
            }
            nextStyle[key] = nextValue;
        };

        if (action === 'bold') {
            const currentWeight = String(currentStyle['font-weight'] ?? '');
            const numericWeight = Number.parseInt(currentWeight, 10);
            const active = textToolbar?.bold ?? (currentWeight === 'bold' || (Number.isFinite(numericWeight) && numericWeight >= 600));
            nextStyle['font-weight'] = active ? '400' : '800';
        }

        if (action === 'italic') {
            nextStyle['font-style'] = (textToolbar?.italic ?? String(currentStyle['font-style'] ?? '').toLowerCase() === 'italic')
                ? 'normal'
                : 'italic';
        }

        if (action === 'underline') {
            const decoration = String(currentStyle['text-decoration'] ?? currentStyle['textDecoration'] ?? '').toLowerCase();
            nextStyle['text-decoration'] = (textToolbar?.underline ?? decoration.includes('underline')) ? 'none' : 'underline';
        }

        if (action === 'align-left') setStyleValue('text-align', 'left');
        if (action === 'align-center') setStyleValue('text-align', 'center');
        if (action === 'align-right') setStyleValue('text-align', 'right');

        if (action === 'font-size') {
            const numeric = Number.parseFloat(String(value ?? ''));
            setStyleValue('font-size', Number.isFinite(numeric) && numeric > 0 ? `${Math.round(numeric)}px` : undefined);
        }

        if (action === 'line-height') {
            const numeric = Number.parseFloat(String(value ?? ''));
            setStyleValue('line-height', Number.isFinite(numeric) && numeric > 0 ? String(numeric) : undefined);
        }

        if (action === 'letter-spacing') {
            const numeric = Number.parseFloat(String(value ?? ''));
            setStyleValue('letter-spacing', Number.isFinite(numeric) ? `${numeric}px` : undefined);
        }

        if (action === 'color' && typeof value === 'string') setStyleValue('color', value);
        if (action === 'background-color' && typeof value === 'string') setStyleValue('background-color', value);

        if (action === 'list-bullet' || action === 'list-number') {
            const nextListStyle = action === 'list-bullet' ? 'disc' : 'decimal';
            const active = textToolbar?.listStyle === nextListStyle;
            setStyleValue('display', active ? undefined : 'list-item');
            setStyleValue('list-style-position', active ? undefined : 'outside');
            setStyleValue('list-style-type', active ? undefined : nextListStyle);
            setStyleValue('margin-left', active ? undefined : '1.4em');
        }

        if (action === 'link-url') {
            const href = String(value ?? '').trim();
            if (href) {
                selected.set('tagName', 'a');
                nextAttrs.href = href;
                nextAttrs.target = textToolbar?.target ?? nextAttrs.target ?? '_self';
                if (nextAttrs.target === '_blank') {
                    nextAttrs.rel = 'noopener noreferrer';
                } else {
                    delete nextAttrs.rel;
                }
            } else {
                delete nextAttrs.href;
            }
            selected.setAttributes(nextAttrs);
        }

        if (action === 'link-target') {
            const target = value === '_blank' ? '_blank' : '_self';
            nextAttrs.target = target;
            if (target === '_blank') {
                nextAttrs.rel = 'noopener noreferrer';
            } else {
                delete nextAttrs.rel;
            }
            selected.setAttributes(nextAttrs);
        }

        if (action === 'link-remove') {
            delete nextAttrs.href;
            delete nextAttrs.target;
            delete nextAttrs.rel;
            selected.setAttributes(nextAttrs);
        }

        if (action === 'buttonify') {
            selected.set('tagName', 'a');
            nextAttrs.href = nextAttrs.href || textToolbar?.href || '#';
            nextAttrs.role = 'button';
            nextAttrs['data-dc-type'] = 'button';
            nextAttrs.target = textToolbar?.target ?? nextAttrs.target ?? '_self';
            if (nextAttrs.target === '_blank') {
                nextAttrs.rel = 'noopener noreferrer';
            }
            selected.setAttributes(nextAttrs);
            setStyleValue('display', String(currentStyle.display ?? '').includes('flex') ? currentStyle.display : 'inline-flex');
            setStyleValue('align-items', currentStyle['align-items'] ?? 'center');
            setStyleValue('justify-content', currentStyle['justify-content'] ?? 'center');
            setStyleValue('gap', currentStyle.gap ?? '8px');
            setStyleValue('padding', currentStyle.padding ?? '12px 18px');
            setStyleValue('border-radius', currentStyle['border-radius'] ?? '12px');
            setStyleValue('background-color', currentStyle['background-color'] ?? '#7c3aed');
            setStyleValue('color', currentStyle.color ?? '#ffffff');
            setStyleValue('text-decoration', 'none');
            setStyleValue('font-weight', currentStyle['font-weight'] ?? '800');
            setStyleValue('cursor', 'pointer');
        }

        if (action === 'clear-formatting') {
            [
                'font-weight',
                'font-style',
                'text-decoration',
                'text-align',
                'font-size',
                'line-height',
                'letter-spacing',
                'color',
                'background-color',
                'list-style-position',
                'list-style-type',
                'margin-left',
            ].forEach((key) => delete nextStyle[key]);
        }

        selected.setStyle(Object.fromEntries(
            Object.entries(nextStyle).filter(([, entryValue]) => entryValue !== undefined && entryValue !== ''),
        ) as Record<string, string | number>);
        syncCanvasSchema(editor);
        markAutoSaveDirty();
        window.requestAnimationFrame(refreshTextToolbar);
    }, [
        editor,
        getActiveTextRange,
        getSelectedCanvasElement,
        getSelectedComponent,
        isTextLikeComponent,
        markAutoSaveDirty,
        refreshTextToolbar,
        syncCanvasSchema,
        textToolbar,
    ]);

    const handleApplyQuickEdit = useCallback((action: QuickEditAction) => {
        if (!editor) return;

        const selected = getSelectedComponent();
        if (!selected) {
            setSaveMsg('Selecione um elemento para usar a edicao rapida.');
            setTimeout(() => setSaveMsg(''), 1800);
            return;
        }

        const currentStyle = (selected.getStyle?.() ?? {}) as Record<string, string | number | undefined>;
        const nextStyle: Record<string, string | number | undefined> = { ...currentStyle };
        const currentWidth = Math.max(48, parseFloat(String(currentStyle.width ?? '220').replace('px', '')) || 220);
        const currentHeight = Math.max(48, parseFloat(String(currentStyle.height ?? '120').replace('px', '')) || 120);

        if (action === 'color-violet') nextStyle['background-color'] = '#7c3aed';
        if (action === 'color-blue') nextStyle['background-color'] = '#2563eb';
        if (action === 'color-rose') nextStyle['background-color'] = '#ec4899';
        if (action === 'color-neutral') nextStyle['background-color'] = '#334155';

        if (action === 'shape-square') {
            nextStyle['border-radius'] = '12px';
        }

        if (action === 'shape-circle') {
            const size = Math.max(currentWidth, currentHeight);
            nextStyle.width = `${Math.round(size)}px`;
            nextStyle.height = `${Math.round(size)}px`;
            nextStyle['border-radius'] = '999px';
        }

        if (action === 'shape-pill') {
            nextStyle['border-radius'] = '999px';
        }

        if (action === 'align-center') {
            nextStyle.display = 'flex';
            nextStyle['align-items'] = 'center';
            nextStyle['justify-content'] = 'center';
            nextStyle['text-align'] = 'center';
        }

        if (action === 'border-none') {
            nextStyle.border = '0';
            nextStyle['border-width'] = '0';
        }

        selected.setStyle(nextStyle as Record<string, string | number>);
        syncCanvasSchema(editor);
        setSaveMsg('Edicao rapida aplicada.');
        setTimeout(() => setSaveMsg(''), 1500);
    }, [editor, getSelectedComponent, setSaveMsg, syncCanvasSchema]);

    useEffect(() => {
        if (!editor) {
            setHasSelectedComponent(false);
            setTextToolbar(null);
            return;
        }

        const refreshSelection = () => {
            setHasSelectedComponent(Boolean(getSelectedComponent()));
            window.requestAnimationFrame(refreshTextToolbar);
        };
        const eventsApi = editor as unknown as {
            on: (name: string, callback: () => void) => void;
            off: (name: string, callback: () => void) => void;
        };
        const canvasDoc = (editor as { Canvas?: { getDocument?: () => Document | null } }).Canvas?.getDocument?.();
        const shell = canvasShellRef.current;
        const selectionEvents = [
            'component:selected',
            'component:deselected',
            'component:remove',
            'component:update',
            'component:styleUpdate',
            'component:drag',
            'component:drag:end',
            'component:resize',
            'canvas:coords',
            'canvas:zoom',
        ];

        refreshSelection();
        selectionEvents.forEach((eventName) => eventsApi.on(eventName, refreshSelection));
        canvasDoc?.addEventListener('selectionchange', refreshSelection);
        shell?.addEventListener('scroll', refreshSelection, { passive: true });
        window.addEventListener('resize', refreshSelection);

        return () => {
            selectionEvents.forEach((eventName) => eventsApi.off(eventName, refreshSelection));
            canvasDoc?.removeEventListener('selectionchange', refreshSelection);
            shell?.removeEventListener('scroll', refreshSelection);
            window.removeEventListener('resize', refreshSelection);
        };
    }, [canvasShellRef, editor, getSelectedComponent, refreshTextToolbar]);

    useEffect(() => {
        if (!editor || !isEditorHydrated) return;

        const eventsApi = editor as unknown as {
            on: (name: string, callback: () => void) => void;
            off: (name: string, callback: () => void) => void;
        };
        const dirtyEvents = [
            'update',
            'component:add',
            'component:update',
            'component:update:content',
            'component:styleUpdate',
            'component:remove',
            'component:resize',
            'component:drag:end',
            'component:clone',
            'sorter:drag:end',
            'canvas:drop',
            'canvas:dragend',
        ];

        const markDirtyAndResizePage = () => {
            syncActivePageHeightFromCanvas(true);
            markAutoSaveDirty();
        };

        dirtyEvents.forEach((eventName) => eventsApi.on(eventName, markDirtyAndResizePage));

        return () => {
            dirtyEvents.forEach((eventName) => eventsApi.off(eventName, markDirtyAndResizePage));
        };
    }, [editor, isEditorHydrated, markAutoSaveDirty, syncActivePageHeightFromCanvas]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const updateStatus = () => setIsOnline(window.navigator.onLine);
        updateStatus();

        const onOnline = () => {
            setIsOnline(true);
            setSaveMsg('Conexao restabelecida. Auto-save ativo.');
            setTimeout(() => setSaveMsg(''), 2200);
        };
        const onOffline = () => {
            setIsOnline(false);
            setSaveMsg('Sem internet. Auto-save pausado.');
        };

        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);

        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, [setSaveMsg]);

    useEffect(() => {
        if (!editor || !userId || !isEditorHydrated) return;
        if (!isOnline) return;

        const pagesFingerprint = pages
            .map((page) => `${page.id}:${page.name}:${page.schema?.length ?? 0}`)
            .join('|');
        const changeFingerprint = JSON.stringify({
            projectName,
            activePageIndex,
            deviceMode,
            pagesFingerprint,
            schema: canvasStructure,
            version: autoSaveVersion,
        });

        if (!autoSaveReadyRef.current) {
            autoSaveReadyRef.current = true;
            lastAutoSaveFingerprintRef.current = changeFingerprint;
            return;
        }

        if (lastAutoSaveFingerprintRef.current === changeFingerprint) {
            return;
        }

        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(() => {
            lastAutoSaveFingerprintRef.current = changeFingerprint;
            void handleAutoSave();
        }, 1200);

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [
        editor,
        userId,
        isOnline,
        isEditorHydrated,
        projectName,
        activePageIndex,
        deviceMode,
        pages,
        canvasStructure,
        autoSaveVersion,
        handleAutoSave,
    ]);

    useEffect(() => () => {
        if (forcedAutoSaveTimerRef.current) {
            clearTimeout(forcedAutoSaveTimerRef.current);
        }
    }, []);

    // Sync page refs
    useSyncPageRefs(pages, pagesRef, activePageIndex, activePageIndexRef, zoomLevel, zoomRef, snapEnabled, snapRef);
    // Initialize editor on mount
    useEffect(() => {
        const instance = initializeGrapesJS(snapRef, setSidebarBlocks, applyCanvasBackdrop, syncCanvasSchema);
        setEditor(instance);
        const maybeEditor = instance as unknown as { setDevice?: (name: string) => void };
        maybeEditor.setDevice?.('Desktop');
        return () => {
            instance.destroy();
            setEditor(null);
        };
    }, [applyCanvasBackdrop, syncCanvasSchema, setSidebarBlocks, setEditor, snapRef]);

    useEffect(() => {
        if (!editor || hydratedEditorRef.current) return;

        const targetPage = pagesRef.current[activePageIndexRef.current] ?? pagesRef.current[0];
        if (targetPage) {
            applyPageToCanvas(targetPage);
            syncCanvasSchema(editor);
        }

        hydratedEditorRef.current = true;
        autoSaveReadyRef.current = false;
        setIsEditorHydrated(true);
        setTimeout(() => {
            applyCanvasDeviceViewport(deviceMode, targetPage?.height ?? PAGE_HEIGHT);
            fitCanvasToViewport(deviceMode);
        }, 80);
    }, [
        applyCanvasDeviceViewport,
        editor,
        pagesRef,
        activePageIndexRef,
        applyPageToCanvas,
        syncCanvasSchema,
        fitCanvasToViewport,
        deviceMode,
    ]);

    useEffect(() => {
        if (!editor) return;
        const targetDevice = deviceMode === 'desktop' ? 'Desktop' : deviceMode === 'tablet' ? 'Tablet' : 'Phone';
        const maybeEditor = editor as unknown as { setDevice?: (name: string) => void };
        maybeEditor.setDevice?.(targetDevice);
        setTimeout(() => {
            applyCanvasDeviceViewport(deviceMode);
            centerCanvasShell(true);
        }, 50);
    }, [applyCanvasDeviceViewport, centerCanvasShell, editor, deviceMode]);

    // Apply canvas backdrop when snap changes
    useEffect(() => {
        if (!editor) return;
        applyCanvasBackdrop(editor, snapEnabled);
    }, [editor, snapEnabled, applyCanvasBackdrop]);

    useEffect(() => {
        if (!editor) return;
        const canvasApi = (editor as { Canvas?: { getDocument?: () => Document | null } }).Canvas;
        const canvasDoc = canvasApi?.getDocument?.();
        const body = canvasDoc?.body;
        if (!body) return;

        body.style.cursor = drawModeActive && activeDrawTool !== 'select' ? 'crosshair' : 'grab';

        return () => {
            body.style.cursor = '';
        };
    }, [editor, drawModeActive, activeDrawTool]);

    useEffect(() => {
        if (!editor || !drawModeActive) {
            clearPreviewElement(drawStrokeRef.current);
            drawStrokeRef.current = null;
            return;
        }

        const canvasApi = (editor as { Canvas?: { getDocument?: () => Document | null } }).Canvas;
        const canvasDoc = canvasApi?.getDocument?.();
        if (!canvasDoc) return;

        const consumeEvent = (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        };

        const onMouseDown = (event: MouseEvent) => {
            if (event.button !== 0 || activeDrawTool === 'select') return;

            const point = resolveCanvasPoint(event);
            if (!point) return;

            if (activeDrawTool === 'text') {
                consumeEvent(event);
                insertBlockAtPoint('text-title', point);
                return;
            }

            if (
                activeDrawTool === 'square' ||
                activeDrawTool === 'circle' ||
                activeDrawTool === 'triangle' ||
                activeDrawTool === 'line' ||
                activeDrawTool === 'pencil'
            ) {
                consumeEvent(event);
                const previewElement = createPreviewElement(canvasDoc);
                drawStrokeRef.current = { start: point, points: [point], previewElement };
                renderPreview(activeDrawTool, drawStrokeRef.current);
            }
        };

        const onMouseMove = (event: MouseEvent) => {
            if (!drawStrokeRef.current) return;
            consumeEvent(event);
            const point = resolveCanvasPoint(event);
            if (!point) return;

            if (activeDrawTool === 'pencil') {
                const lastPoint = drawStrokeRef.current.points[drawStrokeRef.current.points.length - 1];
                const distance = Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y);
                if (distance >= 2) {
                    drawStrokeRef.current.points.push(point);
                }
            } else {
                drawStrokeRef.current.points = [drawStrokeRef.current.start, point];
            }

            renderPreview(activeDrawTool, drawStrokeRef.current);
        };

        const onMouseUp = (event: MouseEvent) => {
            if (!drawStrokeRef.current) return;

            const point = resolveCanvasPoint(event) ?? drawStrokeRef.current.points[drawStrokeRef.current.points.length - 1];
            const currentStroke = drawStrokeRef.current;
            drawStrokeRef.current = null;
            clearPreviewElement(currentStroke);

            if (activeDrawTool === 'line') {
                consumeEvent(event);
                insertLineAtPoints(currentStroke.start, point);
                return;
            }

            if (activeDrawTool === 'pencil') {
                consumeEvent(event);
                const nextPoints = [...currentStroke.points];
                if (point) {
                    nextPoints.push(point);
                }
                insertPencilStroke(nextPoints);
                return;
            }

            if (activeDrawTool === 'square' || activeDrawTool === 'circle' || activeDrawTool === 'triangle') {
                consumeEvent(event);
                insertShapeAtPoints(activeDrawTool, currentStroke.start, point);
            }
        };

        canvasDoc.addEventListener('mousedown', onMouseDown, true);
        canvasDoc.addEventListener('mousemove', onMouseMove, true);
        canvasDoc.addEventListener('mouseup', onMouseUp, true);

        return () => {
            canvasDoc.removeEventListener('mousedown', onMouseDown, true);
            canvasDoc.removeEventListener('mousemove', onMouseMove, true);
            canvasDoc.removeEventListener('mouseup', onMouseUp, true);
            clearPreviewElement(drawStrokeRef.current);
            drawStrokeRef.current = null;
        };
    }, [
        editor,
        drawModeActive,
        activeDrawTool,
        clearPreviewElement,
        createPreviewElement,
        resolveCanvasPoint,
        insertBlockAtPoint,
        insertShapeAtPoints,
        insertLineAtPoints,
        insertPencilStroke,
        renderPreview,
    ]);

    // Setup event listeners
    useEditorEventListeners(
        editor,
        canvasShellRef,
        zoomRef,
        spacePressedRef,
        (x: number, y: number) => beginPan(x, y, panStartRef, setIsPanning),
        (x: number, y: number) => movePan(x, y, panStartRef),
        () => endPan(panStartRef, setIsPanning),
        setCanvasZoom,
        !drawModeActive || activeDrawTool === 'select',
    );

    // Context menu
    useContextMenuHandler(editor, setContextMenu, closeContextMenu);

    // Keyboard shortcuts
    useKeyboardShortcuts(
        editor,
        handleDelete,
        handleDuplicate,
        handleUndo,
        handleRedo,
        closeContextMenu,
        activeDrawTool,
        setLeftPanelMode,
        setLeftSidebarCollapsed,
        setActiveDrawTool,
    );

    // Dock items
    const dockItems: DockItemData[] = [
        { icon: <VscHome size={18} />, label: 'Dashboard', onClick: () => { window.location.href = '/dashboard'; } },
        { icon: <VscArchive size={18} />, label: 'Salvar', onClick: handleSave },
        { icon: <VscAccount size={18} />, label: 'Exportar JSON', onClick: () => handleExportJson(pagesRef, activePageIndexRef, snapshotCurrentPage) },
        {
            icon: <VscSettingsGear size={18} />,
            label: 'Propriedades',
            onClick: () => {
                setLeftSidebarCollapsed(false);
                setLeftPanelMode('properties');
            },
        },
    ];

    return (
        <div className={`draw-layout ${leftSidebarCollapsed ? 'left-collapsed' : ''}`}>
            <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="draw-hidden-input"
                onChange={(e) => handleImportFile(e, pagesRef, activePageIndexRef, setPages, setActivePageIndex, applyPageToCanvas)}
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
                aiGenerating={aiGenerating}
                canSave={Boolean(userId)}
                canUseEditorActions={Boolean(editor)}
                snapEnabled={snapEnabled}
                saveMsg={saveMsg}
                hasUser={Boolean(userId)}
                onProjectNameChange={(event) => setProjectName(event.target.value)}
                onSave={handleSave}
                onExportJson={() => handleExportJson(pagesRef, activePageIndexRef, snapshotCurrentPage)}
                onImportJson={() => fileInputRef.current?.click()}
                onUploadImage={() => imageInputRef.current?.click()}
                onToggleSnap={() => setSnapEnabled((prev: boolean) => !prev)}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onGenerateAi={handleGenerateAi}
            />

            <BuilderElementsSidebar
                leftSidebarCollapsed={leftSidebarCollapsed}
                groupedSidebar={groupedSidebar}
                activeGroup={activeGroup}
                canvasElementsCount={canvasStructure.length}
                aiOutput={aiOutput}
                propertiesActive={leftPanelMode === 'properties'}
                drawActive={leftPanelMode === 'draw'}
                activeDrawTool={activeDrawTool}
                hasSelectedComponent={hasSelectedComponent}
                onCollapse={() => setLeftSidebarCollapsed(true)}
                onSelectGroup={(groupId) => {
                    setActiveGroupId(groupId);
                    setLeftSidebarCollapsed(false);
                    setLeftPanelMode('elements');
                }}
                onToggleDraw={() => {
                    setLeftSidebarCollapsed(false);
                    setLeftPanelMode('draw');
                }}
                onSelectDrawTool={(toolId) => {
                    setLeftSidebarCollapsed(false);
                    setLeftPanelMode('draw');
                    setActiveDrawTool(toolId);
                }}
                onToggleProperties={() => {
                    setLeftSidebarCollapsed(false);
                    setLeftPanelMode('properties');
                }}
                onApplyQuickEdit={handleApplyQuickEdit}
                onInsertBlock={handleInsertBlock}
                onBlockDragStart={handleBlockDragStart}
            />

            <BuilderCanvasArea
                canvasShellRef={canvasShellRef}
                deviceMode={deviceMode}
                snapEnabled={snapEnabled}
                isPanning={isPanning}
                zoomLevel={zoomLevel}
                canUseEditorActions={Boolean(editor)}
                dockItems={dockItems}
                onCanvasDragOver={handleCanvasDragOver}
                onCanvasDrop={handleCanvasDrop}
                onZoomSliderChange={handleZoomSliderChange}
                onZoomOut={() => handleZoomOut(zoomLevel)}
                onZoomReset={handleZoomReset}
                onZoomIn={() => handleZoomIn(zoomLevel)}
                pageHeight={pages[activePageIndex]?.height ?? PAGE_HEIGHT}
                onIncreasePageHeight={() => adjustActivePageHeight(520)}
                onDecreasePageHeight={() => adjustActivePageHeight(-520)}
                pages={pages}
                activePageIndex={activePageIndex}
                onCreatePage={handleCreatePage}
                onSelectPage={handleSelectPage}
                onRenamePage={handleRenamePage}
                onChangeDeviceMode={applyDeviceMode}
                aiGenerating={aiGenerating}
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
            <TextSelectionToolbar state={textToolbar} onApply={handleTextStyleAction} />
        </div>
    );
}

