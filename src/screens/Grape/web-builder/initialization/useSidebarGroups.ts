import { useMemo } from 'react';
import type { SidebarBlockItem, SidebarGroup } from '../../builder-blocks/types';
import { CATEGORY_TO_GROUP } from '../builder-core';

export function useSidebarGroups(sidebarBlocks: SidebarBlockItem[], activeGroupId: string) {
  const groupedSidebar = useMemo(() => {
    const groupMap = new Map<string, SidebarGroup>();
    const blockMap = new Map<string, SidebarBlockItem[]>();

    sidebarBlocks.forEach((item) => {
      const fallbackGroup: SidebarGroup = {
        id: item.categoryId,
        label: item.categoryLabel,
        icon: 'component',
      };
      const group = CATEGORY_TO_GROUP[item.categoryId] ?? fallbackGroup;
      groupMap.set(group.id, group);
      if (!blockMap.has(group.id)) blockMap.set(group.id, []);
      blockMap.get(group.id)?.push(item);
    });

    const preferredOrder = ['layouts-pre-definidos', 'formas', 'componentes-ui', 'imagens', 'texto'];
    const sortedGroups = [...groupMap.values()].sort((a, b) => {
      const ia = preferredOrder.indexOf(a.id);
      const ib = preferredOrder.indexOf(b.id);
      const sa = ia === -1 ? 999 : ia;
      const sb = ib === -1 ? 999 : ib;
      return sa - sb;
    });

    return sortedGroups.map((group) => ({
      ...group,
      blocks: blockMap.get(group.id) ?? [],
    }));
  }, [sidebarBlocks]);

  const activeGroup = useMemo(
    () => groupedSidebar.find((group) => group.id === activeGroupId) ?? groupedSidebar[0],
    [groupedSidebar, activeGroupId],
  );

  return {
    groupedSidebar,
    activeGroup,
  };
}
