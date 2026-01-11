export default function setupPanels(editor) {
    const panels = editor.Panels;
    panels.getPanels().reset([]);

    panels.addPanel({ id: 'left', el: '#draw-left' });
    panels.addPanel({ id: 'right', el: '#draw-right' });

    panels.addPanel({
        id: 'views',
        buttons: [
            { id: 'blocks', label: 'Elementos', command: 'open-blocks', active: true },
            { id: 'style', label: 'Estilo', command: 'open-sm' },
            { id: 'traits', label: 'Propriedades', command: 'open-traits' },
            { id: 'layers', label: 'Camadas', command: 'open-layers' },
        ]
    });
}
