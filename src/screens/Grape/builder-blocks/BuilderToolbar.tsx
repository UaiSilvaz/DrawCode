import Image from 'next/image';
import type { ChangeEvent } from 'react';
import { Redo2, Sparkles, Undo2 } from 'lucide-react';

interface BuilderToolbarProps {
    projectName: string;
    saving: boolean;
    aiGenerating: boolean;
    canSave: boolean;
    canUseEditorActions: boolean;
    snapEnabled: boolean;
    saveMsg: string;
    hasUser: boolean;
    onProjectNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onSave: () => void;
    onExportJson: () => void;
    onImportJson: () => void;
    onUploadImage: () => void;
    onToggleSnap: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onGenerateAi?: () => void;
}

export default function BuilderToolbar({
    projectName,
    saving,
    aiGenerating,
    canSave,
    canUseEditorActions,
    snapEnabled,
    saveMsg,
    hasUser,
    onProjectNameChange,
    onSave,
    onExportJson,
    onImportJson,
    onUploadImage,
    onToggleSnap,
    onUndo,
    onRedo,
    onGenerateAi,
}: BuilderToolbarProps) {
    return (
        <header className="draw-toolbar">
            <div className="draw-toolbar-left">
                <span className="draw-brand-logo">
                    <Image src="/draw.png" alt="DrawCode" width={124} height={32} priority />
                </span>
                <input
                    value={projectName}
                    onChange={onProjectNameChange}
                    className="draw-project-input"
                    placeholder="Nome do projeto"
                />
                <button className="draw-btn draw-btn-primary" onClick={onSave} disabled={saving || !canSave}>
                    {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button className="draw-btn" onClick={onExportJson} disabled={!canUseEditorActions}>
                    Export JSON
                </button>
                <button className="draw-btn" onClick={onImportJson}>
                    Import JSON
                </button>
                <button className="draw-btn" onClick={onUploadImage}>
                    Upload Imagem
                </button>
                <button
                    className={`draw-btn ${snapEnabled ? 'draw-btn-accent' : ''}`}
                    onClick={onToggleSnap}
                    disabled={!canUseEditorActions}
                >
                    Snap {snapEnabled ? 'ON' : 'OFF'}
                </button>
                <div className="draw-toolbar-actions">
                    <button className="draw-btn draw-btn-icon" onClick={onUndo} disabled={!canUseEditorActions} aria-label="Desfazer">
                        <Undo2 size={16} />
                    </button>
                    <button className="draw-btn draw-btn-icon" onClick={onRedo} disabled={!canUseEditorActions} aria-label="Refazer">
                        <Redo2 size={16} />
                    </button>
                    <button className="draw-btn draw-btn-ai" onClick={onGenerateAi} disabled={aiGenerating}>
                        <Sparkles size={16} />
                        <span>{aiGenerating ? 'Gerando site...' : 'Gerar com IA'}</span>
                    </button>
                </div>
            </div>
            <div className="draw-toolbar-right">
                <span className="draw-shortcut-tip">Clique direito no elemento para acoes</span>
                {saveMsg && <span className="draw-status">{saveMsg}</span>}
                {!hasUser && <span className="draw-warning">Modo anonimo: salvamento desativado</span>}
            </div>
        </header>
    );
}
