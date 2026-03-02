import type { ContextMenuState } from './types';

interface BuilderContextMenuProps {
    contextMenu: ContextMenuState;
    onUndo: () => void;
    onRedo: () => void;
    onDuplicate: () => void;
    onGroup: () => void;
    onMoveFront: () => void;
    onMoveBack: () => void;
    onDelete: () => void;
    onClose: () => void;
}

export default function BuilderContextMenu({
    contextMenu,
    onUndo,
    onRedo,
    onDuplicate,
    onGroup,
    onMoveFront,
    onMoveBack,
    onDelete,
    onClose,
}: BuilderContextMenuProps) {
    if (!contextMenu.open) return null;

    return (
        <div
            className="draw-context-menu"
            style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
            onContextMenu={(event) => event.preventDefault()}
        >
            <button className="draw-context-item" onClick={() => { onUndo(); onClose(); }}>Desfazer</button>
            <button className="draw-context-item" onClick={() => { onRedo(); onClose(); }}>Refazer</button>
            <div className="draw-context-separator" />
            <button className="draw-context-item" onClick={() => { onDuplicate(); onClose(); }}>Duplicar</button>
            <button className="draw-context-item" onClick={() => { onGroup(); onClose(); }}>Agrupar</button>
            <div className="draw-context-separator" />
            <button className="draw-context-item" onClick={() => { onMoveFront(); onClose(); }}>Mover para frente</button>
            <button className="draw-context-item" onClick={() => { onMoveBack(); onClose(); }}>Mover para tras</button>
            <div className="draw-context-separator" />
            <button className="draw-context-item draw-context-item-danger" onClick={() => { onDelete(); onClose(); }}>
                Excluir
            </button>
        </div>
    );
}
