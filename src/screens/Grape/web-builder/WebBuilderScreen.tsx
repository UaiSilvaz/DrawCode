'use client';

import { useCallback, useEffect, useRef } from 'react';
import 'grapesjs/dist/css/grapes.min.css';
import '../ui.css';
import { type DockItemData } from '@/components/Dock';
import { VscAccount, VscArchive, VscHome, VscSettingsGear } from 'react-icons/vsc';
import BuilderToolbar from '../builder-blocks/BuilderToolbar';
import BuilderElementsSidebar from '../builder-blocks/BuilderElementsSidebar';
import BuilderCanvasArea from '../builder-blocks/BuilderCanvasArea';
import BuilderContextMenu from '../builder-blocks/BuilderContextMenu';
import type { AIGenerationResult, DrawToolId } from '../builder-blocks/types';
import {
    PAGE_HEIGHT,
    PAGE_WIDTH,
    applySnapForComponent,
    selectComponent,
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

const DRAW_STROKE_WIDTH = 4;
const DRAW_PREVIEW_STROKE = '#f472b6';
const DRAW_PREVIEW_FILL = 'rgba(244, 114, 182, 0.18)';
const MIN_DRAW_SIZE = 24;
const DEFAULT_SHAPE_SIZE = 140;


export default function WebBuilder({ userId, projectId: initialProjectId, projectName: initialProjectName }: WebBuilderProps) {
    // State management
    const editorState = useEditorState(initialProjectId, initialProjectName);
    const {
        editor,
        saving,
        saveMsg,
        aiOutput,
        aiGenerating,
        aiPreview,
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
        setAiPreview,
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
        const preview = canvasDoc.createElementNS('http://www.w3.org/2000/svg', 'svg');
        preview.setAttribute('width', String(PAGE_WIDTH));
        preview.setAttribute('height', String(PAGE_HEIGHT));
        preview.setAttribute('viewBox', `0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}`);
        preview.setAttribute('fill', 'none');
        preview.style.position = 'absolute';
        preview.style.left = '0';
        preview.style.top = '0';
        preview.style.width = `${PAGE_WIDTH}px`;
        preview.style.height = `${PAGE_HEIGHT}px`;
        preview.style.pointerEvents = 'none';
        preview.style.overflow = 'visible';
        preview.style.zIndex = '9999';
        canvasDoc.body.appendChild(preview);
        return preview;
    }, []);

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
            x: Math.max(0, Math.min(PAGE_WIDTH, xRatio * PAGE_WIDTH)),
            y: Math.max(0, Math.min(PAGE_HEIGHT, yRatio * PAGE_HEIGHT)),
        };
    }, [editor]);

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
        return inserted;
    }, [editor, snapRef, syncCanvasSchema]);

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
    } = useCanvasHandlers(editor, zoomRef, setZoomLevel);

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
    const { handleSave } = useSaveHandler(
        editor,
        userId,
        currentProjectId,
        projectName,
        setSaving,
        setSaveMsg,
        setCurrentProjectId,
        pagesRef,
        activePageIndexRef,
        snapshotCurrentPage,
    );

    // Close context menu callback
    const closeContextMenu = useCallback(() => {
        setContextMenu((prev) => ({ ...prev, open: false }));
    }, [setContextMenu]);

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
    }, [editor, snapshotCurrentPage, pagesRef, activePageIndexRef, setPages, setActivePageIndex, applyPageToCanvas]);

    const handleCreatePage = useCallback(() => {
        if (!editor) return;

        const snapshotPages = snapshotCurrentPage() ?? pagesRef.current;
        const nextIndex = snapshotPages.length;
        const newPage: CanvasPage = {
            id: `page-${Date.now()}-${nextIndex + 1}`,
            name: `Pagina ${nextIndex + 1}`,
            components: [],
            styles: [],
            schema: [],
        };

        const nextPages = [...snapshotPages, newPage];
        pagesRef.current = nextPages;
        setPages(nextPages);
        activePageIndexRef.current = nextIndex;
        setActivePageIndex(nextIndex);
        applyPageToCanvas(newPage);
    }, [editor, snapshotCurrentPage, pagesRef, activePageIndexRef, setPages, setActivePageIndex, applyPageToCanvas]);

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

        const wrapper = canvasDoc.body.querySelector('[data-gjs-type="wrapper"]') as HTMLElement | null;
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
                    backgroundColor: computed?.backgroundColor || '',
                    color: computed?.color || '',
                    fontSize: computed?.fontSize || '',
                    fontWeight: computed?.fontWeight || '',
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

    const handleGenerateAi = useCallback(async () => {
        if (!editor) {
            setSaveMsg('Editor indisponivel para gerar com IA.');
            return;
        }

        setAiGenerating(true);
        setAiPreview(null);
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

            const nextOutput = JSON.stringify(result.output, null, 2);
            setAiOutput(nextOutput);
            setAiPreview(result.output as AIGenerationResult);
            setLeftSidebarCollapsed(false);
            setLeftPanelMode('properties');
            setSaveMsg('Preview da IA gerado com sucesso.');
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
        setAiGenerating,
        setAiOutput,
        setAiPreview,
        setLeftSidebarCollapsed,
        setLeftPanelMode,
        setSaveMsg,
    ]);

    // Sync page refs
    useSyncPageRefs(pages, pagesRef, activePageIndex, activePageIndexRef, zoomLevel, zoomRef, snapEnabled, snapRef);
    // Initialize editor on mount
    useEffect(() => {
        const instance = initializeGrapesJS(snapRef, setSidebarBlocks, applyCanvasBackdrop, syncCanvasSchema);
        setEditor(instance);
        return () => {
            instance.destroy();
            setEditor(null);
        };
    }, [applyCanvasBackdrop, syncCanvasSchema, setSidebarBlocks, setEditor, snapRef]);

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

        body.style.cursor = drawModeActive && activeDrawTool !== 'select' ? 'crosshair' : '';

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
                onZoomOut={() => handleZoomOut(zoomLevel)}
                onZoomReset={handleZoomReset}
                onZoomIn={() => handleZoomIn(zoomLevel)}
                pages={pages}
                activePageIndex={activePageIndex}
                onCreatePage={handleCreatePage}
                onSelectPage={handleSelectPage}
                aiGenerating={aiGenerating}
                aiPreview={aiPreview}
                onCloseAiPreview={() => setAiPreview(null)}
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

