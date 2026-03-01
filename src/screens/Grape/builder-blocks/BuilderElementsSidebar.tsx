import type { DragEvent } from 'react';
import { Boxes, Image as ImageIcon, LayoutTemplate, Shapes, Type } from 'lucide-react';
import type { SidebarBlockItem, SidebarGroupWithBlocks, SidebarIcon } from './types';

interface BuilderElementsSidebarProps {
    leftSidebarCollapsed: boolean;
    groupPanelOpen: boolean;
    groupedSidebar: SidebarGroupWithBlocks[];
    activeGroup?: SidebarGroupWithBlocks;
    onCollapse: () => void;
    onSelectGroup: (groupId: string) => void;
    onTogglePanel: () => void;
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
    groupPanelOpen,
    groupedSidebar,
    activeGroup,
    onCollapse,
    onSelectGroup,
    onTogglePanel,
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
                        title={group.label}
                    >
                        {renderGroupIcon(group.icon)}
                    </button>
                ))}
            </div>
            <div className={`draw-sidebar-panel ${groupPanelOpen ? '' : 'is-hidden'} ${leftSidebarCollapsed ? 'is-hidden' : ''}`}>
                <div className="draw-panel-head">
                    <div className="draw-panel-title">{activeGroup?.label ?? 'Elementos'}</div>
                    <button className="draw-side-toggle" onClick={onTogglePanel}>
                        {groupPanelOpen ? '<' : '>'}
                    </button>
                </div>
                <div className="draw-group-list">
                    {(activeGroup?.blocks ?? []).map((item) => (
                        <button
                            key={item.id}
                            className="draw-group-item"
                            onClick={() => onInsertBlock(item)}
                            onDragStart={(event) => onBlockDragStart(item, event)}
                            draggable
                            title={item.label}
                        >
                            <span dangerouslySetInnerHTML={{ __html: item.previewHtml }} />
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    );
}
