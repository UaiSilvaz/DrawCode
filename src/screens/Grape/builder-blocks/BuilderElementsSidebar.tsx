import type { DragEvent } from 'react';
import {
    Boxes,
    Circle,
    Image as ImageIcon,
    LayoutTemplate,
    MousePointer2,
    PencilLine,
    PenTool,
    Settings,
    Shapes,
    Slash,
    Square,
    Triangle,
    Type,
} from 'lucide-react';
import type { DrawToolId, SidebarBlockItem, SidebarGroupWithBlocks, SidebarIcon } from './types';

interface BuilderElementsSidebarProps {
    leftSidebarCollapsed: boolean;
    groupedSidebar: SidebarGroupWithBlocks[];
    activeGroup?: SidebarGroupWithBlocks;
    canvasElementsCount: number;
    aiOutput: string;
    onCollapse: () => void;
    onSelectGroup: (groupId: string) => void;
    propertiesActive: boolean;
    drawActive: boolean;
    activeDrawTool: DrawToolId;
    onToggleProperties: () => void;
    onToggleDraw: () => void;
    onSelectDrawTool: (toolId: DrawToolId) => void;
    onInsertBlock: (item: SidebarBlockItem) => void;
    onBlockDragStart: (item: SidebarBlockItem, event: DragEvent<HTMLButtonElement>) => void;
}

const renderGroupIcon = (icon: SidebarIcon) => {
    if (icon === 'layout') return <LayoutTemplate size={18} />;
    if (icon === 'shape') return <Shapes size={18} />;
    if (icon === 'image') return <ImageIcon size={18} />;
    if (icon === 'text') return <Type size={18} />;
    return <Boxes size={18} />;
};

const renderDrawToolIcon = (toolId: DrawToolId) => {
    if (toolId === 'select') return <MousePointer2 size={16} />;
    if (toolId === 'pencil') return <PencilLine size={16} />;
    if (toolId === 'line') return <Slash size={16} />;
    if (toolId === 'square') return <Square size={16} />;
    if (toolId === 'circle') return <Circle size={16} />;
    if (toolId === 'triangle') return <Triangle size={16} />;
    return <Type size={16} />;
};

const isShapeTool = (toolId: DrawToolId) => ['square', 'circle', 'triangle'].includes(toolId);

function DrawToolsPanel({
    activeDrawTool,
    onSelectDrawTool,
}: {
    activeDrawTool: DrawToolId;
    onSelectDrawTool: (toolId: DrawToolId) => void;
}) {
    return (
        <div className="draw-tools-panel">
            <button
                type="button"
                className={`draw-tool-item ${activeDrawTool === 'select' ? 'is-active' : ''}`}
                onClick={() => onSelectDrawTool('select')}
            >
                <span className="draw-tool-icon">{renderDrawToolIcon('select')}</span>
                <span>
                    <strong>Selecionar (S)</strong>
                    <small>Seleciona elementos no canvas</small>
                </span>
            </button>

            <button
                type="button"
                className={`draw-tool-item ${activeDrawTool === 'pencil' ? 'is-active' : ''}`}
                onClick={() => onSelectDrawTool('pencil')}
            >
                <span className="draw-tool-icon">{renderDrawToolIcon('pencil')}</span>
                <span>
                    <strong>Lapis (P)</strong>
                    <small>Desenho livre sobre o canvas</small>
                </span>
            </button>

            <button
                type="button"
                className={`draw-tool-item ${activeDrawTool === 'line' ? 'is-active' : ''}`}
                onClick={() => onSelectDrawTool('line')}
            >
                <span className="draw-tool-icon">{renderDrawToolIcon('line')}</span>
                <span>
                    <strong>Linha (L)</strong>
                    <small>Clique e arraste para criar linhas</small>
                </span>
            </button>

            <section className={`draw-tool-shapes ${isShapeTool(activeDrawTool) ? 'is-active' : ''}`}>
                <div className="draw-tool-shapes-head">
                    <span className="draw-tool-icon">
                        <Shapes size={16} />
                    </span>
                    <span>
                        <strong>Formas (F)</strong>
                        <small>Quadrado, circulo e triangulo</small>
                    </span>
                </div>
                <div className="draw-tool-shapes-grid">
                    <button
                        type="button"
                        className={`draw-tool-shape ${activeDrawTool === 'square' ? 'is-active' : ''}`}
                        onClick={() => onSelectDrawTool('square')}
                    >
                        <Square size={16} />
                        <span>Quadrado</span>
                    </button>
                    <button
                        type="button"
                        className={`draw-tool-shape ${activeDrawTool === 'circle' ? 'is-active' : ''}`}
                        onClick={() => onSelectDrawTool('circle')}
                    >
                        <Circle size={16} />
                        <span>Circulo</span>
                    </button>
                    <button
                        type="button"
                        className={`draw-tool-shape ${activeDrawTool === 'triangle' ? 'is-active' : ''}`}
                        onClick={() => onSelectDrawTool('triangle')}
                    >
                        <Triangle size={16} />
                        <span>Triangulo</span>
                    </button>
                </div>
            </section>

            <button
                type="button"
                className={`draw-tool-item ${activeDrawTool === 'text' ? 'is-active' : ''}`}
                onClick={() => onSelectDrawTool('text')}
            >
                <span className="draw-tool-icon">{renderDrawToolIcon('text')}</span>
                <span>
                    <strong>Titulo (T)</strong>
                    <small>Insere um titulo no canvas</small>
                </span>
            </button>
        </div>
    );
}

export default function BuilderElementsSidebar({
    leftSidebarCollapsed,
    groupedSidebar,
    activeGroup,
    canvasElementsCount,
    aiOutput,
    onCollapse,
    onSelectGroup,
    propertiesActive,
    drawActive,
    activeDrawTool,
    onToggleProperties,
    onToggleDraw,
    onSelectDrawTool,
    onInsertBlock,
    onBlockDragStart,
}: BuilderElementsSidebarProps) {
    const drawPanelVisible = drawActive && !leftSidebarCollapsed;
    const groupsVisible = !propertiesActive && !drawActive;
    const panelTitle = drawActive ? 'Desenhe' : propertiesActive ? 'Propriedades' : activeGroup?.label ?? 'Elementos';

    return (
        <aside className={`draw-sidebar ${leftSidebarCollapsed ? 'is-collapsed' : ''}`}>
            <div className="draw-sidebar-icons">
                {!leftSidebarCollapsed && (
                    <button type="button" className="draw-side-toggle draw-icon-collapse" onClick={onCollapse}>
                        {'<'}
                    </button>
                )}
                {groupedSidebar.map((group) => (
                    <button
                        key={group.id}
                        type="button"
                        className={`draw-group-icon ${!drawActive && activeGroup?.id === group.id ? 'is-active' : ''}`}
                        onClick={() => onSelectGroup(group.id)}
                    >
                        {renderGroupIcon(group.icon)}
                    </button>
                ))}
                <button
                    type="button"
                    className={`draw-group-icon draw-group-icon-draw ${drawActive ? 'is-active' : ''}`}
                    onClick={onToggleDraw}
                    aria-label="Desenhe"
                    title="Desenhe"
                >
                    <PenTool size={18} />
                </button>
                <button
                    type="button"
                    className={`draw-group-icon ${propertiesActive ? 'is-active' : ''}`}
                    onClick={onToggleProperties}
                >
                    <Settings size={18} />
                </button>
            </div>
            <div className={`draw-sidebar-panel ${leftSidebarCollapsed ? 'is-hidden' : ''}`}>
                <div className="draw-panel-head">
                    <div className="draw-panel-title">{panelTitle}</div>
                    {drawActive && <span className="draw-panel-badge">Modo desenho</span>}
                </div>

                {drawPanelVisible && (
                    <DrawToolsPanel activeDrawTool={activeDrawTool} onSelectDrawTool={onSelectDrawTool} />
                )}

                <div className={`draw-group-list ${groupsVisible ? '' : 'is-hidden'}`}>
                    {(activeGroup?.blocks ?? []).map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className="draw-group-item"
                            onClick={() => onInsertBlock(item)}
                            onDragStart={(event) => onBlockDragStart(item, event)}
                            draggable
                        >
                            <span dangerouslySetInnerHTML={{ __html: item.previewHtml }} />
                        </button>
                    ))}
                </div>

                <div className={`draw-props-list ${propertiesActive ? '' : 'is-hidden'}`}>
                    <section className="draw-side-section">
                        <h3>Propriedades</h3>
                        <div id="styles" />
                    </section>
                    <section className="draw-side-section">
                        <h3>Traits</h3>
                        <div id="traits" />
                    </section>
                    <section className="draw-side-section">
                        <h3>Camadas</h3>
                        <div id="layers" />
                    </section>
                    <section className="draw-side-section draw-json-preview">
                        <h3>Status</h3>
                        <p>{aiOutput || `${canvasElementsCount} elementos no canvas`}</p>
                    </section>
                </div>
            </div>
        </aside>
    );
}
