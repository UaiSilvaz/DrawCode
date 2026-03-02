import Image from 'next/image';
import type { ChangeEvent } from 'react';

interface BuilderToolbarProps {
    projectName: string;
    saving: boolean;
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
}

export default function BuilderToolbar({
    projectName,
    saving,
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
            </div>
            <div className="draw-toolbar-right">
                <span className="draw-shortcut-tip">Clique direito no elemento para acoes</span>
                {saveMsg && <span className="draw-status">{saveMsg}</span>}
                {!hasUser && <span className="draw-warning">Modo anonimo: salvamento desativado</span>}
            </div>
        </header>
    );
}
