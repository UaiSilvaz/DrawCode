import { useMemo, useState } from 'react';
import { Check, RotateCcw, Save, SlidersHorizontal, X, XCircle } from 'lucide-react';
import { generateCodeFromRecognizedShapes } from '@/lib/ai/shape-code-generator';
import type {
    AIGenerationResult,
    AITrainingFeedbackRecord,
    RecognizedShape,
    RecognizedShapeKind,
} from '@/lib/ai/types';

const TRAINING_STORAGE_KEY = 'drawcode-ai-training-examples';

const SHAPE_KIND_OPTIONS: Array<{ value: RecognizedShapeKind; label: string }> = [
    { value: 'rectangle', label: 'Retangulo' },
    { value: 'circle', label: 'Circulo' },
    { value: 'line', label: 'Linha' },
    { value: 'triangle', label: 'Triangulo' },
    { value: 'freehand', label: 'Risco livre' },
    { value: 'container', label: 'Container' },
    { value: 'button', label: 'Botao' },
    { value: 'input', label: 'Input' },
    { value: 'text', label: 'Texto' },
    { value: 'image', label: 'Imagem' },
];

type PreviewTab = 'preview' | 'editor' | 'training' | 'react' | 'css' | 'html' | 'js' | 'semantic' | 'faithful';

const buildPreviewSrcDoc = (bundle: { html: string; css: string; js: string }) => `
    <!DOCTYPE html>
    <html lang="pt-BR">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>
                html, body { margin: 0; padding: 0; min-height: 100%; background: #ffffff; }
                ${bundle.css}
            </style>
        </head>
        <body>
            ${bundle.html}
            <script>
                ${bundle.js}
            </script>
        </body>
    </html>
`.trim();

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const formatSeconds = (ms: number) => `${(ms / 1000).toFixed(ms >= 1000 ? 1 : 2)}s`;

const confidenceClass = (confidence: number) => {
    if (confidence >= 0.8) return 'is-high';
    if (confidence >= 0.6) return 'is-medium';
    return 'is-low';
};

const colorInputValue = (value: string) => (
    /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? value.trim() : '#8b5cf6'
);

const htmlTagForKind = (kind: RecognizedShapeKind): RecognizedShape['htmlTag'] => {
    if (kind === 'button') return 'button';
    if (kind === 'input') return 'input';
    if (kind === 'image') return 'img';
    if (kind === 'text') return 'p';
    return 'div';
};

const radiusForKind = (kind: RecognizedShapeKind, currentRadius: number) => {
    if (kind === 'circle' || kind === 'line' || kind === 'button') return 999;
    if (kind === 'triangle') return 0;
    if (kind === 'container') return Math.max(currentRadius, 14);
    return Math.min(currentRadius || 10, 32);
};

const labelForKind = (kind: RecognizedShapeKind) => (
    SHAPE_KIND_OPTIONS.find((option) => option.value === kind)?.label ?? 'Elemento'
);

const sanitizeRecords = (value: unknown): AITrainingFeedbackRecord[] => (
    Array.isArray(value)
        ? value.filter((item): item is AITrainingFeedbackRecord => (
            item &&
            typeof item === 'object' &&
            typeof (item as AITrainingFeedbackRecord).id === 'string' &&
            typeof (item as AITrainingFeedbackRecord).shapeId === 'string'
        ))
        : []
);

const buildTrainingJsonl = (records: AITrainingFeedbackRecord[]) => records
    .map((record) => JSON.stringify({
        messages: [
            {
                role: 'system',
                content: 'Classifique a forma desenhada no DrawCode e responda somente com JSON valido.',
            },
            {
                role: 'user',
                content: JSON.stringify({
                    shape: {
                        kind: record.detectedKind,
                        x: record.shape.x,
                        y: record.shape.y,
                        width: record.shape.width,
                        height: record.shape.height,
                        color: record.shape.color,
                        sourceType: record.shape.sourceType,
                    },
                }),
            },
            {
                role: 'assistant',
                content: JSON.stringify({
                    type: record.correctedKind,
                    accepted: record.action === 'accepted',
                }),
            },
        ],
    }))
    .join('\n');

export default function AIPreviewPanel({
    aiPreview,
    onCloseAiPreview,
}: {
    aiPreview: AIGenerationResult;
    onCloseAiPreview: () => void;
}) {
    const [activePreviewTab, setActivePreviewTab] = useState<PreviewTab>('preview');
    const [editableShapes, setEditableShapes] = useState<RecognizedShape[]>(aiPreview.recognizedShapes);
    const [selectedShapeId, setSelectedShapeId] = useState(aiPreview.recognizedShapes[0]?.id ?? '');
    const [trainingRecords, setTrainingRecords] = useState<AITrainingFeedbackRecord[]>(() => {
        if (typeof window === 'undefined') return [];

        try {
            const raw = window.localStorage.getItem(TRAINING_STORAGE_KEY);
            return sanitizeRecords(raw ? JSON.parse(raw) : []);
        } catch {
            return [];
        }
    });
    const [localToast, setLocalToast] = useState('');

    const sourceBounds = useMemo(() => (
        aiPreview.source?.wrapperSize ?? { width: 1320, height: 860 }
    ), [aiPreview.source?.wrapperSize]);
    const liveGenerated = useMemo(() => (
        editableShapes.length > 0
            ? generateCodeFromRecognizedShapes(editableShapes, sourceBounds)
            : {
                preview: aiPreview.preview,
                code: aiPreview.code,
            }
    ), [aiPreview.code, aiPreview.preview, editableShapes, sourceBounds]);
    const previewSrcDoc = useMemo(() => buildPreviewSrcDoc(liveGenerated.preview), [liveGenerated.preview]);
    const faithfulSrcDoc = useMemo(() => {
        if (!aiPreview.faithfulPreview) return previewSrcDoc;
        return buildPreviewSrcDoc(aiPreview.faithfulPreview);
    }, [aiPreview.faithfulPreview, previewSrcDoc]);
    const semanticJson = useMemo(() => JSON.stringify(aiPreview.semanticPage ?? {}, null, 2), [aiPreview.semanticPage]);
    const trainingJsonl = useMemo(() => buildTrainingJsonl(trainingRecords), [trainingRecords]);
    const selectedShape = editableShapes.find((shape) => shape.id === selectedShapeId) ?? editableShapes[0];
    const generationLabel = aiPreview.generation.mode === 'openai'
        ? `OpenAI${aiPreview.generation.model ? ` - ${aiPreview.generation.model}` : ''}`
        : 'Fallback deterministico';

    const latestFeedbackByShape = useMemo(() => {
        const currentIds = new Set(editableShapes.map((shape) => shape.id));
        const map = new Map<string, AITrainingFeedbackRecord>();

        for (const record of trainingRecords) {
            if (currentIds.has(record.shapeId)) {
                map.set(record.shapeId, record);
            }
        }

        return map;
    }, [editableShapes, trainingRecords]);

    const trainingStats = useMemo(() => {
        const currentFeedback = Array.from(latestFeedbackByShape.values());
        const accepted = currentFeedback.filter((record) => record.action === 'accepted').length;
        const rejected = currentFeedback.filter((record) => record.action === 'rejected').length;
        const corrected = currentFeedback.filter((record) => record.action === 'corrected').length;
        const reviewed = accepted + rejected + corrected;

        return {
            accepted,
            rejected,
            corrected,
            reviewed,
            accuracy: reviewed > 0 ? accepted / reviewed : 0,
        };
    }, [latestFeedbackByShape]);

    const showToast = (message: string) => {
        setLocalToast(message);
        window.setTimeout(() => setLocalToast(''), 2200);
    };

    const persistTrainingRecords = (records: AITrainingFeedbackRecord[]) => {
        setTrainingRecords(records);
        window.localStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(records));
    };

    const updateShape = (shapeId: string, patch: Partial<RecognizedShape>) => {
        setEditableShapes((current) => current.map((shape) => (
            shape.id === shapeId ? { ...shape, ...patch } : shape
        )));
    };

    const updateSelectedNumber = (
        field: 'x' | 'y' | 'width' | 'height',
        value: string,
    ) => {
        if (!selectedShape) return;
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return;
        updateShape(selectedShape.id, {
            [field]: field === 'width' || field === 'height'
                ? Math.max(1, Math.round(parsed))
                : Math.round(parsed),
        });
    };

    const changeSelectedKind = (kind: RecognizedShapeKind) => {
        if (!selectedShape) return;
        updateShape(selectedShape.id, {
            kind,
            label: labelForKind(kind),
            htmlTag: htmlTagForKind(kind),
            borderRadius: radiusForKind(kind, selectedShape.borderRadius),
            height: kind === 'line' ? Math.max(4, Math.min(selectedShape.height, 10)) : selectedShape.height,
        });
    };

    const recordFeedback = (
        shape: RecognizedShape,
        action: AITrainingFeedbackRecord['action'],
    ) => {
        const originalShape = aiPreview.recognizedShapes.find((item) => item.id === shape.id) ?? shape;
        const record: AITrainingFeedbackRecord = {
            id: `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            shapeId: shape.id,
            detectedKind: originalShape.kind,
            correctedKind: action === 'rejected' ? originalShape.kind : shape.kind,
            action,
            confidence: originalShape.confidence,
            shape,
            createdAt: new Date().toISOString(),
            generationMode: aiPreview.generation.mode,
        };

        persistTrainingRecords([...trainingRecords, record].slice(-500));
        showToast(
            action === 'accepted'
                ? 'Reconhecimento aceito.'
                : action === 'corrected'
                    ? 'Correcao salva para treinamento.'
                    : 'Reconhecimento rejeitado.',
        );
    };

    const resetShapes = () => {
        setEditableShapes(aiPreview.recognizedShapes);
        setSelectedShapeId(aiPreview.recognizedShapes[0]?.id ?? '');
        showToast('Elementos restaurados.');
    };

    return (
        <div className="draw-ai-preview-shell">
            <div className="draw-ai-preview-head">
                <div className="draw-ai-preview-copy">
                    <strong>Site gerado com IA</strong>
                    <span>{aiPreview.summary}</span>
                    <div className="draw-ai-preview-badges">
                        <div className={`draw-ai-preview-badge ${aiPreview.generation.mode === 'openai' ? 'is-openai' : 'is-fallback'}`}>
                            {generationLabel}
                        </div>
                        <div className="draw-ai-preview-badge is-success">Convertido com sucesso</div>
                    </div>
                </div>
                <button type="button" className="draw-ai-preview-close" onClick={onCloseAiPreview}>
                    <X size={16} />
                    <span>Voltar ao editor</span>
                </button>
            </div>

            <div className="draw-ai-status-row">
                <span>Tempo {formatSeconds(aiPreview.metrics.processingTimeMs)}</span>
                <span>{aiPreview.metrics.recognizedShapes} formas</span>
                <span>Confianca {formatPercent(aiPreview.metrics.averageConfidence)}</span>
                <span>Treino {trainingRecords.length} exemplos</span>
                <span>Acuracia {trainingStats.reviewed > 0 ? formatPercent(trainingStats.accuracy) : 'sem dados'}</span>
            </div>

            <div className="draw-ai-preview-tabs">
                <button type="button" className={`draw-ai-preview-tab ${activePreviewTab === 'preview' ? 'is-active' : ''}`} onClick={() => setActivePreviewTab('preview')}>Preview IA</button>
                <button type="button" className={`draw-ai-preview-tab ${activePreviewTab === 'editor' ? 'is-active' : ''}`} onClick={() => setActivePreviewTab('editor')}>Editor</button>
                <button type="button" className={`draw-ai-preview-tab ${activePreviewTab === 'training' ? 'is-active' : ''}`} onClick={() => setActivePreviewTab('training')}>Treinamento</button>
                <button type="button" className={`draw-ai-preview-tab ${activePreviewTab === 'react' ? 'is-active' : ''}`} onClick={() => setActivePreviewTab('react')}>React</button>
                <button type="button" className={`draw-ai-preview-tab ${activePreviewTab === 'css' ? 'is-active' : ''}`} onClick={() => setActivePreviewTab('css')}>CSS</button>
                <button type="button" className={`draw-ai-preview-tab ${activePreviewTab === 'html' ? 'is-active' : ''}`} onClick={() => setActivePreviewTab('html')}>HTML</button>
                <button type="button" className={`draw-ai-preview-tab ${activePreviewTab === 'js' ? 'is-active' : ''}`} onClick={() => setActivePreviewTab('js')}>JS</button>
                <button type="button" className={`draw-ai-preview-tab ${activePreviewTab === 'semantic' ? 'is-active' : ''}`} onClick={() => setActivePreviewTab('semantic')}>Semantica</button>
                <button type="button" className={`draw-ai-preview-tab ${activePreviewTab === 'faithful' ? 'is-active' : ''}`} onClick={() => setActivePreviewTab('faithful')}>Preview fiel</button>
            </div>

            <div className="draw-ai-preview-body">
                {(activePreviewTab === 'preview' || activePreviewTab === 'faithful') && (
                    <iframe
                        title={activePreviewTab === 'preview' ? 'Preview gerado com IA' : 'Preview fiel do canvas'}
                        className="draw-ai-preview-frame"
                        srcDoc={activePreviewTab === 'preview' ? previewSrcDoc : faithfulSrcDoc}
                    />
                )}

                {activePreviewTab === 'editor' && (
                    <div className="draw-ai-editor">
                        <aside className="draw-ai-shape-list" aria-label="Formas reconhecidas">
                            <div className="draw-ai-section-head">
                                <strong>Formas reconhecidas</strong>
                                <button type="button" className="draw-ai-mini-btn" onClick={resetShapes}>
                                    <RotateCcw size={14} />
                                    Reset
                                </button>
                            </div>
                            <div className="draw-ai-shape-items">
                                {editableShapes.map((shape) => {
                                    const feedback = latestFeedbackByShape.get(shape.id);

                                    return (
                                        <button
                                            key={shape.id}
                                            type="button"
                                            className={`draw-ai-shape-item ${selectedShape?.id === shape.id ? 'is-active' : ''} ${feedback ? `is-${feedback.action}` : ''}`}
                                            onClick={() => setSelectedShapeId(shape.id)}
                                        >
                                            <span className={`draw-ai-shape-swatch draw-ai-shape-kind-${shape.kind}`} style={{ backgroundColor: shape.kind === 'text' ? 'transparent' : colorInputValue(shape.color) }} />
                                            <span>
                                                <strong>{labelForKind(shape.kind)}</strong>
                                                <small>{Math.round(shape.width)}x{Math.round(shape.height)} em x{shape.x}, y{shape.y}</small>
                                            </span>
                                            <em className={`draw-ai-confidence ${confidenceClass(shape.confidence)}`}>
                                                {formatPercent(shape.confidence)}
                                            </em>
                                        </button>
                                    );
                                })}
                            </div>
                        </aside>

                        <section className="draw-ai-shape-editor">
                            {selectedShape ? (
                                <>
                                    <div className="draw-ai-section-head">
                                        <strong>{selectedShape.label}</strong>
                                        <span className={`draw-ai-confidence ${confidenceClass(selectedShape.confidence)}`}>
                                            {formatPercent(selectedShape.confidence)}
                                        </span>
                                    </div>
                                    <div className="draw-ai-controls-grid">
                                        <label>
                                            <span>Tipo</span>
                                            <select value={selectedShape.kind} onChange={(event) => changeSelectedKind(event.target.value as RecognizedShapeKind)}>
                                                {SHAPE_KIND_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                        </label>
                                        <label>
                                            <span>Cor</span>
                                            <input
                                                type="color"
                                                value={colorInputValue(selectedShape.color)}
                                                onChange={(event) => updateShape(selectedShape.id, { color: event.target.value })}
                                            />
                                        </label>
                                        <label>
                                            <span>X</span>
                                            <input type="number" value={selectedShape.x} onChange={(event) => updateSelectedNumber('x', event.target.value)} />
                                        </label>
                                        <label>
                                            <span>Y</span>
                                            <input type="number" value={selectedShape.y} onChange={(event) => updateSelectedNumber('y', event.target.value)} />
                                        </label>
                                        <label>
                                            <span>Largura</span>
                                            <input type="number" min={1} value={selectedShape.width} onChange={(event) => updateSelectedNumber('width', event.target.value)} />
                                        </label>
                                        <label>
                                            <span>Altura</span>
                                            <input type="number" min={1} value={selectedShape.height} onChange={(event) => updateSelectedNumber('height', event.target.value)} />
                                        </label>
                                    </div>
                                    <div className="draw-ai-feedback-actions">
                                        <button type="button" className="draw-ai-feedback-btn is-accept" onClick={() => recordFeedback(selectedShape, 'accepted')}>
                                            <Check size={15} />
                                            Aceitar
                                        </button>
                                        <button type="button" className="draw-ai-feedback-btn is-reject" onClick={() => recordFeedback(selectedShape, 'rejected')}>
                                            <XCircle size={15} />
                                            Rejeitar
                                        </button>
                                        <button type="button" className="draw-ai-feedback-btn is-correct" onClick={() => recordFeedback(selectedShape, 'corrected')}>
                                            <Save size={15} />
                                            Salvar correcao
                                        </button>
                                    </div>
                                    <div className="draw-ai-sync-note">
                                        <SlidersHorizontal size={15} />
                                        <span>Preview, React, HTML, CSS e JS atualizam automaticamente.</span>
                                    </div>
                                </>
                            ) : (
                                <p className="draw-ai-empty">Nenhuma forma reconhecida neste canvas.</p>
                            )}
                        </section>
                    </div>
                )}

                {activePreviewTab === 'training' && (
                    <div className="draw-ai-training">
                        <section className="draw-ai-training-grid">
                            <article>
                                <strong>{trainingRecords.length}</strong>
                                <span>Exemplos salvos</span>
                            </article>
                            <article>
                                <strong>{trainingStats.accepted}</strong>
                                <span>Aceitos nesta tela</span>
                            </article>
                            <article>
                                <strong>{trainingStats.corrected}</strong>
                                <span>Corrigidos nesta tela</span>
                            </article>
                            <article>
                                <strong>{trainingStats.reviewed > 0 ? formatPercent(trainingStats.accuracy) : '0%'}</strong>
                                <span>Acuracia revisada</span>
                            </article>
                        </section>
                        <div className="draw-ai-training-actions">
                            <button
                                type="button"
                                className="draw-ai-feedback-btn is-reject"
                                onClick={() => {
                                    persistTrainingRecords([]);
                                    showToast('Base local de treino limpa.');
                                }}
                            >
                                Limpar exemplos
                            </button>
                        </div>
                        <pre className="draw-ai-preview-code draw-ai-training-jsonl">
                            {trainingJsonl || 'Aceite, rejeite ou corrija formas para montar a base JSONL de treinamento.'}
                        </pre>
                    </div>
                )}

                {['html', 'css', 'js', 'react', 'semantic'].includes(activePreviewTab) && (
                    <pre className="draw-ai-preview-code">
                        {activePreviewTab === 'html' && liveGenerated.code.html}
                        {activePreviewTab === 'css' && liveGenerated.code.css}
                        {activePreviewTab === 'js' && liveGenerated.code.js}
                        {activePreviewTab === 'react' && liveGenerated.code.react}
                        {activePreviewTab === 'semantic' && semanticJson}
                    </pre>
                )}
            </div>

            <div className="draw-ai-status-footer">
                <span>Idle: botao Gerar com IA ativo</span>
                <span>Loading: analisando desenho</span>
                <span>Success: convertido com sucesso</span>
                {aiPreview.generation.usedFallback && <span>Error tratado: fallback local ativo</span>}
            </div>

            {localToast && <div className="draw-ai-local-toast">{localToast}</div>}
        </div>
    );
}
