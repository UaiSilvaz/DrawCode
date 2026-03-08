import type { DragEvent, RefObject } from 'react';
import { useMemo, useState } from 'react';
import Dock, { type DockItemData } from '@/components/Dock';
import { ChevronDown, FileText, Plus, X } from 'lucide-react';
import type { AIGenerationResult } from './types';

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

function AIPreviewPanel({
    aiPreview,
    previewSrcDoc,
    onCloseAiPreview,
}: {
    aiPreview: AIGenerationResult;
    previewSrcDoc: string;
    onCloseAiPreview: () => void;
}) {
    const [activePreviewTab, setActivePreviewTab] = useState<'preview' | 'html' | 'css' | 'js' | 'react' | 'backend'>('preview');

    return (
        <div className="draw-ai-preview-shell">
            <div className="draw-ai-preview-head">
                <div className="draw-ai-preview-copy">
                    <strong>Preview gerado com IA</strong>
                    <span>{aiPreview.summary}</span>
                </div>
                <button type="button" className="draw-ai-preview-close" onClick={onCloseAiPreview}>
                    <X size={16} />
                    <span>Voltar ao editor</span>
                </button>
            </div>
            <div className="draw-ai-preview-tabs">
                <button type="button" className={`draw-ai-preview-tab ${activePreviewTab === 'preview' ? 'is-active' : ''}`} onClick={() => setActivePreviewTab('preview')}>Preview</button>
                <button type="button" className={`draw-ai-preview-tab ${activePreviewTab === 'html' ? 'is-active' : ''}`} onClick={() => setActivePreviewTab('html')}>HTML</button>
                <button type="button" className={`draw-ai-preview-tab ${activePreviewTab === 'css' ? 'is-active' : ''}`} onClick={() => setActivePreviewTab('css')}>CSS</button>
                <button type="button" className={`draw-ai-preview-tab ${activePreviewTab === 'js' ? 'is-active' : ''}`} onClick={() => setActivePreviewTab('js')}>JS</button>
                <button type="button" className={`draw-ai-preview-tab ${activePreviewTab === 'react' ? 'is-active' : ''}`} onClick={() => setActivePreviewTab('react')}>React</button>
                <button type="button" className={`draw-ai-preview-tab ${activePreviewTab === 'backend' ? 'is-active' : ''}`} onClick={() => setActivePreviewTab('backend')}>Backend</button>
            </div>
            <div className="draw-ai-preview-body">
                {activePreviewTab === 'preview' ? (
                    <iframe
                        title="Preview gerado com IA"
                        className="draw-ai-preview-frame"
                        srcDoc={previewSrcDoc}
                    />
                ) : (
                    <pre className="draw-ai-preview-code">
                        {activePreviewTab === 'html' && aiPreview.code.html}
                        {activePreviewTab === 'css' && aiPreview.code.css}
                        {activePreviewTab === 'js' && aiPreview.code.js}
                        {activePreviewTab === 'react' && aiPreview.code.react}
                        {activePreviewTab === 'backend' && aiPreview.code.backend}
                    </pre>
                )}
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
    const previewSrcDoc = useMemo(() => {
        if (!aiPreview) return '';

        return `
            <!DOCTYPE html>
            <html lang="pt-BR">
                <head>
                    <meta charset="utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <style>
                        html, body { margin: 0; padding: 0; min-height: 100%; background: #ffffff; }
                        ${aiPreview.preview.css}
                    </style>
                </head>
                <body>
                    ${aiPreview.preview.html}
                    <script>
                        ${aiPreview.preview.js}
                    </script>
                </body>
            </html>
        `.trim();
    }, [aiPreview]);

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
                            <div className="draw-ai-loading">
                                <div className="draw-ai-loading-orbit" />
                                <div className="draw-ai-loading-ring" />
                                <div className="draw-ai-loading-text">
                                    <strong>Gerando site</strong>
                                    <span>A IA esta lendo o layout, interpretando os desenhos e montando um preview funcional.</span>
                                </div>
                            </div>
                        )}

                        {!aiGenerating && aiPreview && (
                            <AIPreviewPanel
                                key={`${aiPreview.summary}-${aiPreview.interpretedSketch}`}
                                aiPreview={aiPreview}
                                previewSrcDoc={previewSrcDoc}
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
