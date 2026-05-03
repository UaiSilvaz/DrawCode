import { useState, type DragEvent, type KeyboardEvent, type RefObject } from 'react';
import Dock, { type DockItemData } from '@/components/Dock';
import { Check, FileText, Home, LoaderCircle, Monitor, Pencil, Plus, Smartphone, Sparkles, Tablet, X } from 'lucide-react';
import type { CanvasDeviceMode } from './types';

interface BuilderCanvasAreaProps {
    canvasShellRef: RefObject<HTMLDivElement | null>;
    deviceMode: CanvasDeviceMode;
    snapEnabled: boolean;
    isPanning: boolean;
    zoomLevel: number;
    canUseEditorActions: boolean;
    dockItems: DockItemData[];
    onCanvasDragOver: (event: DragEvent<HTMLDivElement>) => void;
    onCanvasDrop: (event: DragEvent<HTMLDivElement>) => void;
    onZoomSliderChange: (value: number) => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
    onZoomIn: () => void;
    pages: Array<{ id: string; name: string }>;
    activePageIndex: number;
    onCreatePage: () => void;
    onSelectPage: (index: number) => void;
    onRenamePage: (pageId: string, path: string) => void;
    onChangeDeviceMode: (mode: CanvasDeviceMode) => void;
    aiGenerating: boolean;
}

function AILoadingState() {
    return (
        <div className="draw-ai-loading">
            <div className="draw-ai-loading-icon">
                <Sparkles size={22} />
                <LoaderCircle size={22} className="draw-ai-loading-spinner" />
            </div>
            <div className="draw-ai-loading-text">
                <strong>Melhorando o layout</strong>
                <span>Transformando rabiscos e blocos em componentes reais no canvas.</span>
            </div>
        </div>
    );
}

export default function BuilderCanvasArea({
    canvasShellRef,
    deviceMode,
    snapEnabled,
    isPanning,
    zoomLevel,
    canUseEditorActions,
    dockItems,
    onCanvasDragOver,
    onCanvasDrop,
    onZoomSliderChange,
    onZoomOut,
    onZoomReset,
    onZoomIn,
    pages,
    activePageIndex,
    onCreatePage,
    onSelectPage,
    onRenamePage,
    onChangeDeviceMode,
    aiGenerating,
}: BuilderCanvasAreaProps) {
    const [editingPageId, setEditingPageId] = useState<string | null>(null);
    const [editingPath, setEditingPath] = useState('');

    const beginRename = (pageId: string, currentPath: string) => {
        setEditingPageId(pageId);
        setEditingPath(currentPath);
    };

    const cancelRename = () => {
        setEditingPageId(null);
        setEditingPath('');
    };

    const confirmRename = () => {
        if (!editingPageId) return;
        onRenamePage(editingPageId, editingPath);
        cancelRename();
    };

    const onRenameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            confirmRename();
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            cancelRename();
        }
    };

    return (
        <main className="draw-canvas-main">
            <aside className="draw-pages-panel">
                <div className="draw-pages-panel-head">
                    <h3>Pages</h3>
                    <button
                        type="button"
                        className="draw-pages-add"
                        onClick={onCreatePage}
                        disabled={!canUseEditorActions}
                        title="Nova pagina"
                        aria-label="Nova pagina"
                    >
                        <Plus size={14} />
                    </button>
                </div>
                <div className="draw-pages-panel-list">
                    {pages.map((page, index) => {
                        const selected = index === activePageIndex;
                        const isEditing = editingPageId === page.id;
                        const isHome = page.name === '/home' || page.name === '/';
                        return (
                            <div
                                key={page.id}
                                className={`draw-pages-panel-item ${selected ? 'is-active' : ''}`}
                            >
                                <button
                                    type="button"
                                    className="draw-pages-panel-select"
                                    onClick={() => onSelectPage(index)}
                                    disabled={!canUseEditorActions}
                                >
                                    <span className="draw-pages-panel-icon">
                                        {isHome ? <Home size={14} /> : <FileText size={14} />}
                                    </span>
                                    {isEditing ? (
                                        <input
                                            className="draw-pages-panel-input"
                                            value={editingPath}
                                            onChange={(event) => setEditingPath(event.target.value)}
                                            onKeyDown={onRenameKeyDown}
                                            autoFocus
                                        />
                                    ) : (
                                        <span className="draw-pages-panel-label">{isHome ? 'Home' : page.name}</span>
                                    )}
                                </button>
                                <div className="draw-pages-panel-actions">
                                    {isEditing ? (
                                        <>
                                            <button
                                                type="button"
                                                className="draw-pages-panel-action"
                                                onClick={confirmRename}
                                                aria-label="Salvar nome da pagina"
                                                title="Salvar"
                                            >
                                                <Check size={13} />
                                            </button>
                                            <button
                                                type="button"
                                                className="draw-pages-panel-action"
                                                onClick={cancelRename}
                                                aria-label="Cancelar edicao"
                                                title="Cancelar"
                                            >
                                                <X size={13} />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            className="draw-pages-panel-action"
                                            onClick={() => beginRename(page.id, page.name)}
                                            disabled={!canUseEditorActions}
                                            aria-label="Renomear pagina"
                                            title="Renomear"
                                        >
                                            <Pencil size={13} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </aside>
            <div className="draw-device-switcher">
                <button
                    type="button"
                    className={`draw-device-chip ${deviceMode === 'desktop' ? 'is-active' : ''}`}
                    onClick={() => onChangeDeviceMode('desktop')}
                    disabled={!canUseEditorActions}
                >
                    <Monitor size={14} />
                    <span>Desktop</span>
                </button>
                <button
                    type="button"
                    className={`draw-device-chip ${deviceMode === 'tablet' ? 'is-active' : ''}`}
                    onClick={() => onChangeDeviceMode('tablet')}
                    disabled={!canUseEditorActions}
                >
                    <Tablet size={14} />
                    <span>Tablet</span>
                </button>
                <button
                    type="button"
                    className={`draw-device-chip ${deviceMode === 'phone' ? 'is-active' : ''}`}
                    onClick={() => onChangeDeviceMode('phone')}
                    disabled={!canUseEditorActions}
                >
                    <Smartphone size={14} />
                    <span>Phone</span>
                </button>
            </div>
            <div
                ref={canvasShellRef}
                className={`draw-canvas-shell draw-canvas-shell--${deviceMode} ${snapEnabled ? 'is-snap' : ''} ${isPanning ? 'is-panning' : ''}`}
                onDragOver={onCanvasDragOver}
                onDrop={onCanvasDrop}
            >
                <div id="gjs" className="draw-canvas" />
                {aiGenerating && (
                    <div className="draw-ai-stage">
                        <AILoadingState />
                    </div>
                )}
            </div>
            <div className="draw-canvas-zoom">
                <input
                    type="range"
                    min={20}
                    max={300}
                    step={1}
                    value={zoomLevel}
                    onChange={(event) => onZoomSliderChange(Number(event.target.value))}
                    className="draw-zoom-slider"
                />
                <button className="draw-btn" onClick={onZoomOut} disabled={!canUseEditorActions}>-</button>
                <button className="draw-btn draw-btn-zoom-readout" onClick={onZoomReset} disabled={!canUseEditorActions}>
                    {zoomLevel}%
                </button>
                <button className="draw-btn" onClick={onZoomIn} disabled={!canUseEditorActions}>+</button>
            </div>
            <Dock items={dockItems} panelHeight={68} baseItemSize={50} magnification={72} />
        </main>
    );
}
