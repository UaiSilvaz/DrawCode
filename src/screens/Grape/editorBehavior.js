export function registerEditorBehavior(editor) {

    // Movimento livre automático
    editor.on('component:drag:start', model => {
        const style = model.getStyle();

        if (!style.position || style.position === 'static') {
            const el = model.view?.el;
            if (!el) return;

            const rect = el.getBoundingClientRect();
            const parentRect = el.parentElement.getBoundingClientRect();

            model.setStyle({
                position: 'absolute',
                top: `${rect.top - parentRect.top}px`,
                left: `${rect.left - parentRect.left}px`,
            });
        }
    });

    // Sempre permitir mover e redimensionar
    editor.on('component:selected', model => {
        model.set({
            draggable: true,
            resizable: true,
        });
    });

}
