import type { DragEvent } from 'react';
import { Boxes, Image as ImageIcon, LayoutTemplate, Settings, Shapes, Type } from 'lucide-react';
import type { SidebarBlockItem, SidebarGroupWithBlocks, SidebarIcon } from './types';

interface BuilderElementsSidebarProps {
    leftSidebarCollapsed: boolean;
    groupedSidebar: SidebarGroupWithBlocks[];
    activeGroup?: SidebarGroupWithBlocks;
    canvasElementsCount: number;
    onCollapse: () => void;
    onSelectGroup: (groupId: string) => void;
    propertiesActive: boolean;
    onToggleProperties: () => void;
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

export default function BuilderElementsSidebar({
    leftSidebarCollapsed,
    groupedSidebar,
    activeGroup,
    canvasElementsCount,
    onCollapse,
    onSelectGroup,
    propertiesActive,
    onToggleProperties,
    onInsertBlock,
    onBlockDragStart,
}: BuilderElementsSidebarProps) {
    return (
        <aside className={`draw-sidebar ${leftSidebarCollapsed ? 'is-collapsed' : ''}`}>
            <div className="draw-sidebar-icons">
                {!leftSidebarCollapsed && (
                    <button className="draw-side-toggle draw-icon-collapse" onClick={onCollapse}>
                        {'<'}
                    </button>
                )}
                {groupedSidebar.map((group) => (
                    <button
                        key={group.id}
                        className={`draw-group-icon ${activeGroup?.id === group.id ? 'is-active' : ''}`}
                        onClick={() => onSelectGroup(group.id)}
                    >
                        {renderGroupIcon(group.icon)}
                    </button>
                ))}
                <button
                    className={`draw-group-icon ${propertiesActive ? 'is-active' : ''}`}
                    onClick={onToggleProperties}
                >
                    <Settings size={18} />
                </button>
            </div>
            <div className={`draw-sidebar-panel ${leftSidebarCollapsed ? 'is-hidden' : ''}`}>
                <div className="draw-panel-head">
                    <div className="draw-panel-title">{propertiesActive ? 'Propriedades' : activeGroup?.label ?? 'Elementos'}</div>
                </div>
                <div className={`draw-group-list ${propertiesActive ? 'is-hidden' : ''}`}>
                    {(activeGroup?.blocks ?? []).map((item) => (
                        <button
                            key={item.id}
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
                        <h3>JSON da IA</h3>
                        <p>{canvasElementsCount} elementos no canvas</p>
                    </section>
                </div>
            </div>
        </aside>
    );
}
