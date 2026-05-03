export type SemanticComponentType =
    | 'page'
    | 'navbar'
    | 'hero'
    | 'section'
    | 'cardGrid'
    | 'card'
    | 'form'
    | 'field'
    | 'button'
    | 'image'
    | 'text'
    | 'footer'
    | 'decorativeShape';

export interface SemanticComponent {
    id: string;
    type: SemanticComponentType;
    label: string;
    confidence: number;
    props: {
        title?: string;
        subtitle?: string;
        text?: string;
        brand?: string;
        links?: string[];
        cta?: string;
        placeholder?: string;
        src?: string;
        alt?: string;
    };
    style: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        backgroundColor?: string;
        color?: string;
        accentColor?: string;
        textAlign?: string;
    };
    children: SemanticComponent[];
}

export interface SemanticPage {
    pageType: 'landing' | 'login' | 'register' | 'dashboard' | 'portfolio' | 'generic';
    layoutIntent: string;
    theme: {
        name: string;
        backgroundColor: string;
        textColor: string;
        accentColor: string;
        surfaceColor: string;
    };
    components: SemanticComponent[];
}

export interface GeneratedCodeBundle {
    html: string;
    css: string;
    js: string;
    react: string;
}

export type RecognizedShapeKind =
    | 'rectangle'
    | 'circle'
    | 'line'
    | 'triangle'
    | 'freehand'
    | 'text'
    | 'button'
    | 'input'
    | 'image'
    | 'container';

export interface RecognizedShape {
    id: string;
    sourceElementId: string;
    sourceType: string;
    kind: RecognizedShapeKind;
    label: string;
    htmlTag: 'div' | 'button' | 'input' | 'img' | 'p';
    confidence: number;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    text: string;
    borderRadius: number;
    rotation: number;
    opacity: number;
    zIndex: number;
}

export interface AIGenerationMetrics {
    recognizedShapes: number;
    averageConfidence: number;
    processingTimeMs: number;
    freehandCount: number;
    lineCount: number;
    highConfidenceCount: number;
    mediumConfidenceCount: number;
    lowConfidenceCount: number;
}

export interface PreviewBundle {
    html: string;
    css: string;
    js: string;
}

export interface AIGenerationResult {
    summary: string;
    interpretedSketch: string;
    preview: PreviewBundle;
    faithfulPreview?: PreviewBundle;
    code: GeneratedCodeBundle;
    recognizedShapes: RecognizedShape[];
    metrics: AIGenerationMetrics;
    recommendations: string[];
    semanticPage?: SemanticPage;
    generation: {
        mode: 'openai' | 'deterministic';
        model?: string;
        usedFallback: boolean;
        notes: string[];
    };
    source?: {
        wrapperElementCount: number;
        wrapperSize: {
            width: number;
            height: number;
        };
        originalHtmlLength: number;
    };
}
