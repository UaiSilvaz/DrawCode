import type { DragEvent, RefObject } from 'react';
import Dock, { type DockItemData } from '@/components/Dock';

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
}: BuilderCanvasAreaProps) {
    return (
        <main className="draw-canvas-main">
            <div
                ref={canvasShellRef}
                className={`draw-canvas-shell ${snapEnabled ? 'is-snap' : ''} ${isPanning ? 'is-panning' : ''}`}
                onDragOver={onCanvasDragOver}
                onDrop={onCanvasDrop}
            >
                <div id="gjs" className="draw-canvas" />
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
