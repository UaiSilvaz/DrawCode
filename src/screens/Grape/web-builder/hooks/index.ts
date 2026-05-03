// Centraliza o estado principal do editor, setters e refs compartilhadas.
export { useEditorState } from './useEditorState';
// Sincroniza schema/pages entre estado React e canvas do GrapesJS.
export { useCanvasSync } from './useCanvasSync';
// Controla zoom e pan do canvas.
export { useCanvasHandlers } from './useCanvasHandlers';
// Agrupa ações sobre componentes selecionados (delete, duplicate, undo/redo, layer, group).
export { useComponentHandlers } from './useComponentHandlers';
// Gerencia import/export JSON e upload de imagem.
export { useFileHandlers } from './useFileHandlers';
// Implementa inserção e drag/drop de blocos no canvas.
export { useDragDropHandlers } from './useDragDropHandlers';
// Mantém refs em sincronia com estados de páginas, zoom e snap.
export { useSyncPageRefs } from './useSyncPageRefs';
// Salva projeto pelas rotas da aplicacao e atualiza status de persistencia.
export { useSaveHandler } from './useSaveHandler';
// Registra listeners globais/canvas para interação de mouse, wheel e teclado de navegação.
export { useEditorEventListeners } from './useEditorEventListeners';
// Atalhos de teclado para ações de edição e fechamento de menu.
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
// Controla abertura/fechamento e posicionamento do menu de contexto.
export { useContextMenuHandler } from './useContextMenuHandler';
