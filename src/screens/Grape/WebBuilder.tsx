'use client';

import { useEffect, useState, useCallback } from "react";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import "./ui.css";
import Dock from "@/components/Dock";
import { VscHome, VscArchive, VscAccount, VscSettingsGear } from "react-icons/vsc";
import blocksElements from "./blocks-elements";
import blocksLayouts from "./blocks-layouts";

interface WebBuilderProps {
    userId?: string;
    projectId?: string;
    projectName?: string;
}

export default function WebBuilder({ userId, projectId: initialProjectId, projectName: initialProjectName }: WebBuilderProps) {
    const [editor, setEditor] = useState < ReturnType < typeof grapesjs.init > | null > (null);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [currentProjectId, setCurrentProjectId] = useState(initialProjectId);
    const [projectName, setProjectName] = useState(initialProjectName ?? 'Sem título');

    useEffect(() => {
        const ed = grapesjs.init({
            container: "#gjs",
            height: "100%",
            width: "100%",
            fromElement: false,
            storageManager: false,
            selectorManager: { componentFirst: true },
            panels: { defaults: [] },
            blockManager: { appendTo: "#blocks" },
            styleManager: { appendTo: "#styles" },
            layerManager: { appendTo: "#layers" },
            traitManager: { appendTo: "#traits" },
        });

        blocksElements(ed);
        blocksLayouts(ed);
        setEditor(ed);

        return () => {
            ed.destroy();
        };
    }, []);

    const handleSave = useCallback(async () => {
        if (!editor || !userId) {
            setSaveMsg('Faça login para salvar projetos.');
            return;
        }

        setSaving(true);
        setSaveMsg('');

        try {
            const data = {
                components: editor.getComponents(),
                styles: editor.getStyle(),
                html: editor.getHtml(),
                css: editor.getCss(),
            };

            const res = await fetch('/api/grape/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: currentProjectId,
                    name: projectName,
                    data,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                setSaveMsg(`Erro: ${result.error}`);
            } else {
                setCurrentProjectId(result.project.id);
                setSaveMsg('✓ Projeto salvo!');
                setTimeout(() => setSaveMsg(''), 3000);
            }
        } catch {
            setSaveMsg('Erro de conexão.');
        } finally {
            setSaving(false);
        }
    }, [editor, userId, currentProjectId, projectName]);

    const items = [
        { icon: <VscHome size={18} />, label: 'Home', onClick: () => window.location.href = '/dashboard' },
        { icon: <VscArchive size={18} />, label: 'Salvar', onClick: handleSave },
        { icon: <VscAccount size={18} />, label: 'Perfil', onClick: () => window.location.href = '/dashboard' },
        { icon: <VscSettingsGear size={18} />, label: 'Config', onClick: () => alert('Configurações em breve!') },
    ];

    return (
        <div className="draw-layout">
            {/* Barra de topo com nome + botão salvar */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '40px',
                background: 'rgba(9,9,11,0.95)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 1rem',
                gap: '0.75rem',
                zIndex: 100,
            }}>
                <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '6px',
                        color: '#fafafa',
                        padding: '0.2rem 0.6rem',
                        fontSize: '0.82rem',
                        minWidth: '160px',
                    }}
                />
                <button
                    onClick={handleSave}
                    disabled={saving || !userId}
                    style={{
                        padding: '0.2rem 0.8rem',
                        borderRadius: '6px',
                        background: saving ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg,#7c3aed,#2563eb)',
                        color: 'white',
                        border: 'none',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                    }}
                >
                    {saving ? '…' : '💾 Salvar'}
                </button>
                {saveMsg && (
                    <span style={{ fontSize: '0.78rem', color: saveMsg.startsWith('Erro') ? '#f87171' : '#4ade80' }}>
                        {saveMsg}
                    </span>
                )}
                {!userId && (
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>
                        ⚠️ Não autenticado – projetos não serão salvos
                    </span>
                )}
            </div>

            <aside className="draw-sidebar" id="blocks" style={{ marginTop: '40px' }} />

            <main className="draw-canvas-wrapper" style={{ marginTop: '40px' }}>
                <div className="draw-canvas-wrapper">
                    <div id="gjs" className="draw-canvas" />
                </div>
                <Dock items={items} panelHeight={68} baseItemSize={50} magnification={70} />
            </main>

            <aside className="draw-right" style={{ marginTop: '40px' }}>
                <div id="styles"></div>
                <div id="traits"></div>
                <div id="layers"></div>
            </aside>
        </div>
    );
}
