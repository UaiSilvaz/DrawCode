import { useState, useRef } from 'react';
import type { ContextMenuState, DrawToolId, LeftPanelMode, SidebarBlockItem } from '../../builder-blocks/types';
import type { CanvasPage, EditorInstance, CanvasElementNode } from '../builder-core';

export function useEditorState(initialProjectId?: string, initialProjectName?: string) {
  const [editor, setEditor] = useState<EditorInstance | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [currentProjectId, setCurrentProjectId] = useState(initialProjectId ?? '');
  const [projectName, setProjectName] = useState(initialProjectName ?? 'Sem titulo');
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [canvasStructure, setCanvasStructure] = useState<CanvasElementNode[]>([]);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(true);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ open: false, x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeGroupId, setActiveGroupId] = useState<string>('layouts-pre-definidos');
  const [leftPanelMode, setLeftPanelMode] = useState<LeftPanelMode>('elements');
  const [activeDrawTool, setActiveDrawTool] = useState<DrawToolId>('select');
  const [sidebarBlocks, setSidebarBlocks] = useState<SidebarBlockItem[]>([]);
  const [aiOutput, setAiOutput] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [pages, setPages] = useState<CanvasPage[]>([
    {
      id: 'page-1',
      name: 'Pagina 1',
      components: [],
      styles: [],
      schema: [],
    },
  ]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isPanning, setIsPanning] = useState(false);

  // Refs for tracking state through event listeners
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const canvasShellRef = useRef<HTMLDivElement | null>(null);
  const snapRef = useRef(snapEnabled);
  const pagesRef = useRef(pages);
  const activePageIndexRef = useRef(activePageIndex);
  const zoomRef = useRef(zoomLevel);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const spacePressedRef = useRef(false);
  const draggedBlockIdRef = useRef<string | null>(null);
  const draggedBlockRef = useRef<SidebarBlockItem | null>(null);

  return {
    // State
    editor,
    saving,
    saveMsg,
    currentProjectId,
    projectName,
    snapEnabled,
    canvasStructure,
    leftSidebarCollapsed,
    contextMenu,
    zoomLevel,
    activeGroupId,
    leftPanelMode,
    activeDrawTool,
    sidebarBlocks,
    aiOutput,
    aiGenerating,
    pages,
    activePageIndex,
    isPanning,

    // State setters
    setEditor,
    setSaving,
    setSaveMsg,
    setCurrentProjectId,
    setProjectName,
    setSnapEnabled,
    setCanvasStructure,
    setLeftSidebarCollapsed,
    setContextMenu,
    setZoomLevel,
    setActiveGroupId,
    setLeftPanelMode,
    setActiveDrawTool,
    setSidebarBlocks,
    setAiOutput,
    setAiGenerating,
    setPages,
    setActivePageIndex,
    setIsPanning,

    // Refs
    fileInputRef,
    imageInputRef,
    canvasShellRef,
    snapRef,
    pagesRef,
    activePageIndexRef,
    zoomRef,
    panStartRef,
    spacePressedRef,
    draggedBlockIdRef,
    draggedBlockRef,
  };
}
