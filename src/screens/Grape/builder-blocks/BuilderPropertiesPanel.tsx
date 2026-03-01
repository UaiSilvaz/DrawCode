interface BuilderPropertiesPanelProps {
    rightSidebarCollapsed: boolean;
    canvasElementsCount: number;
    onCollapse: () => void;
}

export default function BuilderPropertiesPanel({
    rightSidebarCollapsed,
    canvasElementsCount,
    onCollapse,
}: BuilderPropertiesPanelProps) {
    return (
        <aside className={`draw-right ${rightSidebarCollapsed ? 'is-collapsed' : ''}`}>
            <div className="draw-panel-head">
                <div className="draw-panel-title">Propriedades</div>
                {!rightSidebarCollapsed && (
                    <button className="draw-side-toggle" onClick={onCollapse}>
                        {'>'}
                    </button>
                )}
            </div>
            <section className="draw-side-section">
                <h3>Propriedades</h3>
                <div id="styles" />
            </section>
            <section className="draw-side-section">
                <h3>Traits</h3>
                <div id="traits" />
            </section>
            <section className="draw-side-section">
                <h3>Camadas</h3>
                <div id="layers" />
            </section>
            <section className="draw-side-section draw-json-preview">
                <h3>JSON da IA</h3>
                <p>{canvasElementsCount} elementos no canvas</p>
            </section>
        </aside>
    );
}
