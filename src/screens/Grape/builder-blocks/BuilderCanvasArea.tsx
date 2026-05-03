import type { DragEvent, RefObject } from 'react';
import { useState } from 'react';
import Dock, { type DockItemData } from '@/components/Dock';
import { ChevronDown, FileText, LoaderCircle, Plus, Sparkles } from 'lucide-react';

interface BuilderCanvasAreaProps {
    canvasShellRef: RefObject<HTMLDivElement | null>;
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
    aiGenerating,
}: BuilderCanvasAreaProps) {
    const [pagesMenuOpen, setPagesMenuOpen] = useState(false);

    return (
        <main className="draw-canvas-main">
            <div className="draw-pages-control">
                <button
                    className="draw-pages-toggle"
                    onClick={() => setPagesMenuOpen((prev) => !prev)}
                    disabled={!canUseEditorActions}
                >
                    <Plus size={16} />
                    <span>Paginas</span>
                    <span className="draw-pages-count">{pages.length}</span>
                    <ChevronDown size={14} className={pagesMenuOpen ? 'is-open' : ''} />
                </button>
                {pagesMenuOpen && (
                    <div className="draw-pages-dropdown">
                        <button className="draw-pages-create" onClick={onCreatePage} disabled={!canUseEditorActions}>
                            <Plus size={14} />
                            Nova pagina
                        </button>
                        <div className="draw-pages-list">
                            {pages.map((page, index) => (
                                <button
                                    key={page.id}
                                    className={`draw-pages-item ${index === activePageIndex ? 'is-active' : ''}`}
                                    onClick={() => onSelectPage(index)}
                                    disabled={!canUseEditorActions}
                                >
                                    <FileText size={14} />
                                    <span className="draw-pages-item-label">
                                        {page.name || `Pagina ${index + 1}`}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div
                ref={canvasShellRef}
                className={`draw-canvas-shell ${snapEnabled ? 'is-snap' : ''} ${isPanning ? 'is-panning' : ''}`}
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
                    min={30}
                    max={200}
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
