import type { DragEvent, RefObject } from 'react';
import { useEffect, useState } from 'react';
import Dock, { type DockItemData } from '@/components/Dock';
import { ChevronDown, FileText, Plus } from 'lucide-react';
import type { AIGenerationResult } from './types';
import AIPreviewPanel from './AIPreviewPanel';

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
    aiPreview: AIGenerationResult | null;
    onCloseAiPreview: () => void;
}

function AILoadingState() {
    const [progress, setProgress] = useState(8);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setProgress((current) => Math.min(96, current + (current < 50 ? 9 : 4)));
        }, 420);

        return () => window.clearInterval(timer);
    }, []);

    return (
        <div className="draw-ai-loading">
            <div className="draw-ai-loading-grid" />
            <div className="draw-ai-loading-orbit" />
            <div className="draw-ai-loading-ring" />
            <div className="draw-ai-loading-text">
                <small>DrawCode AI Agent</small>
                <strong>Analisando desenho...</strong>
                <span>Detectando linhas, retangulos, circulos, textos e blocos para montar componentes editaveis em React + CSS.</span>
                <div className="draw-ai-progress" aria-label="Progresso da IA">
                    <span style={{ width: `${progress}%` }} />
                </div>
                <div className="draw-ai-progress-label">{progress}% processado</div>
                <div className="draw-ai-loading-steps">
                    <span>Lendo canvas</span>
                    <span>Reconhecendo formas</span>
                    <span>Gerando codigo</span>
                    <span>Preparando editor</span>
                </div>
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
    aiPreview,
    onCloseAiPreview,
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
                {(aiGenerating || aiPreview) && (
                    <div className="draw-ai-stage">
                        {aiGenerating && (
                            <AILoadingState />
                        )}

                        {!aiGenerating && aiPreview && (
                            <AIPreviewPanel
                                key={`${aiPreview.summary}-${aiPreview.interpretedSketch}`}
                                aiPreview={aiPreview}
                                onCloseAiPreview={onCloseAiPreview}
                            />
                        )}
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
