export interface ContextMenuState {
    open: boolean;
    x: number;
    y: number;
}

export type SidebarIcon = 'layout' | 'shape' | 'component' | 'image' | 'text';

export interface SidebarGroup {
    id: string;
    label: string;
    icon: SidebarIcon;
}

export interface SidebarBlockItem {
    id: string;
    label: string;
    categoryId: string;
    categoryLabel: string;
    previewHtml: string;
    content: unknown;
}

export interface SidebarGroupWithBlocks extends SidebarGroup {
    blocks: SidebarBlockItem[];
}
