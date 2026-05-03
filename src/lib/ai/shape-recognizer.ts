import type { AIGenerateRequest, WrapperElementSnapshot } from './preview-generator';
import type { AIGenerationMetrics, RecognizedShape, RecognizedShapeKind } from './types';

const DEFAULT_COLOR = '#8b5cf6';
const LINE_COLOR = '#f472b6';

const slug = (value: string) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'shape';

const cleanText = (value: string) => value.replace(/\s+/g, ' ').trim();

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const isTransparent = (value?: string) => {
    const normalized = value?.trim().toLowerCase();
    return !normalized ||
        normalized === 'transparent' ||
        normalized === 'none' ||
        normalized === 'rgba(0, 0, 0, 0)' ||
        normalized === 'rgb(0, 0, 0, 0)';
};

const parseNumber = (value?: string, fallback = 0) => {
    if (!value) return fallback;
    const parsed = Number.parseFloat(value.replace('px', '').trim());
    return Number.isFinite(parsed) ? parsed : fallback;
};

const parseRotation = (value?: string) => {
    if (!value) return 0;
    const match = value.match(/rotate\(([-\d.]+)deg\)/);
    return match ? Number.parseFloat(match[1] ?? '0') : 0;
};

const colorFromMarkup = (html: string) => {
    const match = html.match(/(?:fill|stroke|stop-color)=["'](#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))["']/);
    return match?.[1];
};

const parseSvgLineGeometry = (html: string) => {
    const lineMatch = html.match(/<line\b[^>]*>/i);
    const lineTag = lineMatch?.[0];
    if (!lineTag) return null;

    const attr = (name: string) => {
        const match = lineTag.match(new RegExp(`${name}=["']([-\\d.]+)["']`, 'i'));
        const value = match?.[1] ? Number.parseFloat(match[1]) : Number.NaN;
        return Number.isFinite(value) ? value : null;
    };
    const x1 = attr('x1');
    const y1 = attr('y1');
    const x2 = attr('x2');
    const y2 = attr('y2');
    if (x1 == null || y1 == null || x2 == null || y2 == null) return null;

    const width = Math.max(4, Math.hypot(x2 - x1, y2 - y1));
    const rotation = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

    return { x1, y1, width, rotation };
};

const flattenElements = (elements: WrapperElementSnapshot[]) => {
    const output: WrapperElementSnapshot[] = [];
    const stack = [...elements];

    while (stack.length > 0) {
        const current = stack.shift();
        if (!current) continue;
        output.push(current);
        stack.push(...(current.children as WrapperElementSnapshot[]));
    }

    return output;
};

const elementText = (element: WrapperElementSnapshot) => (
    cleanText(element.text) || stripHtml(element.html)
);

const hasVisibleSize = (element: WrapperElementSnapshot) => (
    element.size.width >= 2 &&
    element.size.height >= 2
);

const isTextElement = (element: WrapperElementSnapshot) => (
    ['h1', 'h2', 'h3', 'h4', 'p', 'span'].includes(element.tagName) ||
    element.type.includes('title') ||
    element.type.includes('paragraph') ||
    element.type.includes('text')
);

const inferKind = (element: WrapperElementSnapshot): {
    kind: RecognizedShapeKind;
    confidence: number;
    label: string;
} => {
    const type = element.type.toLowerCase();
    const html = element.html.toLowerCase();
    const radius = parseNumber(element.style.borderRadius);
    const minSide = Math.min(element.size.width, element.size.height);
    const ratio = element.size.height > 0 ? element.size.width / element.size.height : 1;
    const text = elementText(element);

    if (type.includes('shape-line') || html.includes('<line')) {
        return { kind: 'line', confidence: 0.96, label: 'Linha' };
    }

    if (type.includes('freehand') || html.includes('<path')) {
        return { kind: ratio >= 3 ? 'line' : 'freehand', confidence: 0.82, label: 'Risco livre' };
    }

    if (type.includes('shape-circle') || (radius >= minSide * 0.45 && ratio >= 0.72 && ratio <= 1.38)) {
        return { kind: 'circle', confidence: type.includes('shape-circle') ? 0.97 : 0.78, label: 'Circulo' };
    }

    if (type.includes('shape-triangle') || html.includes('<polygon')) {
        return { kind: 'triangle', confidence: 0.93, label: 'Triangulo' };
    }

    if (type.includes('shape-rectangle') || type.includes('square')) {
        return { kind: 'rectangle', confidence: 0.97, label: 'Retangulo' };
    }

    if (element.tagName === 'button' || type.includes('button')) {
        return { kind: 'button', confidence: 0.94, label: text || 'Botao' };
    }

    if (element.tagName === 'input' || element.tagName === 'textarea' || type.includes('input')) {
        return { kind: 'input', confidence: 0.94, label: element.attributes.placeholder || 'Input' };
    }

    if (element.tagName === 'img' || type.includes('image') || element.attributes.src) {
        return { kind: 'image', confidence: 0.9, label: element.attributes.alt || 'Imagem' };
    }

    if (isTextElement(element) && text.length > 0) {
        return { kind: 'text', confidence: 0.88, label: text.slice(0, 42) };
    }

    if (type.includes('container') || type.includes('section') || type.includes('card') || type.includes('layout')) {
        return { kind: 'container', confidence: 0.74, label: 'Container' };
    }

    if (element.size.height <= 12 && element.size.width >= element.size.height * 4) {
        return { kind: 'line', confidence: 0.68, label: 'Linha inferida' };
    }

    return { kind: 'rectangle', confidence: 0.64, label: 'Retangulo inferido' };
};

const htmlTagForKind = (kind: RecognizedShapeKind): RecognizedShape['htmlTag'] => {
    if (kind === 'button') return 'button';
    if (kind === 'input') return 'input';
    if (kind === 'image') return 'img';
    if (kind === 'text') return 'p';
    return 'div';
};

const colorForElement = (element: WrapperElementSnapshot, kind: RecognizedShapeKind) => {
    if (kind === 'text' && !isTransparent(element.style.color)) return element.style.color;
    if (!isTransparent(element.style.backgroundColor)) return element.style.backgroundColor;
    if (!isTransparent(element.style.borderColor)) return element.style.borderColor;

    const markupColor = colorFromMarkup(element.html);
    if (markupColor) return markupColor;

    if (kind === 'line' || kind === 'freehand' || kind === 'triangle') return LINE_COLOR;
    if (kind === 'input') return '#ffffff';
    if (kind === 'text') return element.style.color || '#111827';
    return DEFAULT_COLOR;
};

const borderRadiusForKind = (element: WrapperElementSnapshot, kind: RecognizedShapeKind) => {
    if (kind === 'circle') return 999;
    if (kind === 'line') return 999;
    if (kind === 'triangle') return 0;
    const parsed = parseNumber(element.style.borderRadius);
    if (parsed > 0) return parsed;
    if (kind === 'button') return 999;
    if (kind === 'container') return 14;
    return 10;
};

export function recognizeShapesFromPayload(payload: AIGenerateRequest): RecognizedShape[] {
    return flattenElements(payload.wrapperElements)
        .filter(hasVisibleSize)
        .map((element, index) => {
            const inferred = inferKind(element);
            const kind = inferred.kind;
            const lineGeometry = kind === 'line' ? parseSvgLineGeometry(element.html) : null;
            const width = lineGeometry
                ? Math.round(lineGeometry.width)
                : Math.max(1, Math.round(element.size.width));
            const height = kind === 'line'
                ? Math.max(4, Math.min(10, Math.round(element.size.height || 4)))
                : Math.max(1, Math.round(element.size.height));
            const text = elementText(element);

            return {
                id: `shape-${index + 1}-${slug(element.id || element.type || kind)}`,
                sourceElementId: element.id || `element-${index + 1}`,
                sourceType: element.type || element.tagName,
                kind,
                label: inferred.label,
                htmlTag: htmlTagForKind(kind),
                confidence: Number(inferred.confidence.toFixed(2)),
                x: Math.round(element.position.x + (lineGeometry?.x1 ?? 0)),
                y: Math.round(element.position.y + (lineGeometry ? lineGeometry.y1 - height / 2 : 0)),
                width,
                height,
                color: colorForElement(element, kind),
                text: text.slice(0, 180),
                borderRadius: borderRadiusForKind(element, kind),
                rotation: lineGeometry ? Number(lineGeometry.rotation.toFixed(2)) : parseRotation(element.style.transform),
                opacity: parseNumber(element.style.opacity, 1),
                zIndex: parseNumber(element.style.zIndex, index + 1),
            };
        });
}

export function buildShapeMetrics(shapes: RecognizedShape[], processingTimeMs: number): AIGenerationMetrics {
    const averageConfidence = shapes.length > 0
        ? shapes.reduce((total, shape) => total + shape.confidence, 0) / shapes.length
        : 0;

    return {
        recognizedShapes: shapes.length,
        averageConfidence: Number(averageConfidence.toFixed(2)),
        processingTimeMs,
        freehandCount: shapes.filter((shape) => shape.kind === 'freehand').length,
        lineCount: shapes.filter((shape) => shape.kind === 'line').length,
        highConfidenceCount: shapes.filter((shape) => shape.confidence >= 0.8).length,
        mediumConfidenceCount: shapes.filter((shape) => shape.confidence >= 0.6 && shape.confidence < 0.8).length,
        lowConfidenceCount: shapes.filter((shape) => shape.confidence < 0.6).length,
    };
}
