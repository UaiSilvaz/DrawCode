import { z } from 'zod';
import type { AIGenerationResult } from './types';

const wrapperElementSchema: z.ZodType<{
    id: string;
    tagName: string;
    type: string;
    text: string;
    html: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    style: {
        display: string;
        position: string;
        backgroundColor: string;
        color: string;
        fontSize: string;
        fontWeight: string;
        borderRadius: string;
        borderWidth: string;
        borderColor: string;
        borderStyle: string;
        opacity: string;
        boxShadow: string;
        transform: string;
        zIndex: string;
    };
    attributes: Record<string, string>;
    children: unknown[];
}> = z.lazy(() => z.object({
    id: z.string(),
    tagName: z.string(),
    type: z.string(),
    text: z.string(),
    html: z.string(),
    position: z.object({
        x: z.number(),
        y: z.number(),
    }),
    size: z.object({
        width: z.number(),
        height: z.number(),
    }),
    style: z.object({
        display: z.string(),
        position: z.string(),
        backgroundColor: z.string(),
        color: z.string(),
        fontSize: z.string(),
        fontWeight: z.string(),
        borderRadius: z.string(),
        borderWidth: z.string(),
        borderColor: z.string(),
        borderStyle: z.string(),
        opacity: z.string(),
        boxShadow: z.string(),
        transform: z.string(),
        zIndex: z.string(),
    }),
    attributes: z.record(z.string(), z.string()),
    children: z.array(wrapperElementSchema).default([]),
}));

export const aiGenerateRequestSchema = z.object({
    projectName: z.string().min(1).max(120).default('Sem titulo'),
    html: z.string().default(''),
    css: z.string().default(''),
    wrapperHtml: z.string().default(''),
    wrapperBounds: z.object({
        width: z.number().min(1).default(1320),
        height: z.number().min(1).default(860),
    }).default({ width: 1320, height: 860 }),
    wrapperElements: z.array(wrapperElementSchema).default([]),
    sketchHints: z.object({
        freehandCount: z.number(),
        lineCount: z.number(),
        titleCount: z.number(),
        imageCount: z.number(),
        freehandRegions: z.array(
            z.object({
                x: z.number(),
                y: z.number(),
                width: z.number(),
                height: z.number(),
            }),
        ),
    }).default({
        freehandCount: 0,
        lineCount: 0,
        titleCount: 0,
        imageCount: 0,
        freehandRegions: [],
    }),
});

export type WrapperElementSnapshot = z.infer<typeof wrapperElementSchema>;
export type AIGenerateRequest = z.infer<typeof aiGenerateRequestSchema>;

const SAFE_TAGS = new Set([
    'a',
    'article',
    'button',
    'div',
    'footer',
    'form',
    'h1',
    'h2',
    'h3',
    'h4',
    'header',
    'img',
    'input',
    'label',
    'li',
    'main',
    'nav',
    'p',
    'section',
    'span',
    'svg',
    'textarea',
    'ul',
]);

const escapeHtml = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const sanitizeTagName = (value: string) => {
    const tagName = value.trim().toLowerCase();
    return SAFE_TAGS.has(tagName) ? tagName : 'div';
};

const sanitizeClassName = (value: string) => value
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item && !item.startsWith('gjs-'))
    .join(' ');

const sanitizeAttributes = (attributes: Record<string, string>) => {
    const next: string[] = [];

    for (const [name, rawValue] of Object.entries(attributes)) {
        const attributeName = name.trim().toLowerCase();
        if (!attributeName || attributeName === 'style') continue;
        if (attributeName.startsWith('on')) continue;
        if (attributeName === 'draggable' || attributeName === 'contenteditable') continue;

        let attributeValue = rawValue.trim();
        if (!attributeValue) continue;

        if (attributeName === 'class') {
            attributeValue = sanitizeClassName(attributeValue);
            if (!attributeValue) continue;
        }

        if ((attributeName === 'href' || attributeName === 'src') && attributeValue.toLowerCase().startsWith('javascript:')) {
            continue;
        }

        next.push(`${attributeName}="${escapeHtml(attributeValue)}"`);
    }

    return next.length > 0 ? ` ${next.join(' ')}` : '';
};

const buildInlineStyle = (element: WrapperElementSnapshot) => {
    const styleEntries: Array<[string, string | number | undefined]> = [
        ['position', 'absolute'],
        ['left', `${Math.round(element.position.x)}px`],
        ['top', `${Math.round(element.position.y)}px`],
        ['width', `${Math.max(0, Math.round(element.size.width))}px`],
        ['height', `${Math.max(0, Math.round(element.size.height))}px`],
        ['display', element.style.display],
        ['background-color', element.style.backgroundColor],
        ['color', element.style.color],
        ['font-size', element.style.fontSize],
        ['font-weight', element.style.fontWeight],
        ['border-radius', element.style.borderRadius],
        ['border-width', element.style.borderWidth],
        ['border-color', element.style.borderColor],
        ['border-style', element.style.borderStyle],
        ['opacity', element.style.opacity],
        ['box-shadow', element.style.boxShadow],
        ['transform', element.style.transform],
        ['z-index', element.style.zIndex],
        ['overflow', element.type === 'freehand-path' || element.type.startsWith('shape-') ? 'visible' : undefined],
        ['box-sizing', 'border-box'],
    ];

    const serialized = styleEntries
        .filter(([, value]) => value != null && `${value}`.trim() !== '' && `${value}` !== 'normal' && `${value}` !== 'none')
        .map(([key, value]) => `${key}:${String(value)};`)
        .join('');

    return ` style="${escapeHtml(serialized)}"`;
};

const buildInnerMarkup = (element: WrapperElementSnapshot) => {
    if (element.html.trim()) return element.html;
    if (element.text.trim()) return escapeHtml(element.text);
    return '';
};

const renderElement = (element: WrapperElementSnapshot): string => {
    const tagName = sanitizeTagName(element.tagName);
    const attributes = sanitizeAttributes(element.attributes);
    const style = buildInlineStyle(element);
    const innerMarkup = buildInnerMarkup(element);

    if (tagName === 'img') {
        return `<img${attributes}${style} />`;
    }

    if (tagName === 'input') {
        return `<input${attributes}${style} />`;
    }

    return `<${tagName}${attributes}${style}>${innerMarkup}</${tagName}>`;
};

const buildPreviewHtml = (elements: WrapperElementSnapshot[]) => elements.map(renderElement).join('\n');

const buildPreviewCss = (projectCss: string, width: number, height: number) => `
* { box-sizing: border-box; }
html, body {
    margin: 0;
    min-height: 100%;
    background: #eef1f6;
    font-family: Arial, sans-serif;
}
body {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 24px;
}
.dc-preview-stage {
    width: min(100%, ${width + 48}px);
}
.dc-preview-canvas {
    position: relative;
    width: ${width}px;
    height: ${height}px;
    margin: 0 auto;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 24px 80px rgba(15, 23, 42, 0.12);
}
.dc-preview-canvas > * {
    max-width: none;
}
svg {
    display: block;
}
${projectCss}
`.trim();

const buildPreviewDocument = (markup: string) => `
<main class="dc-preview-stage">
    <div class="dc-preview-canvas">
        ${markup}
    </div>
</main>
`.trim();

const buildReactCode = (html: string, css: string) => {
    const escapedHtml = JSON.stringify(html);
    const escapedCss = JSON.stringify(css);

    return [
        "import './generated-preview.css';",
        '',
        'export default function GeneratedPreview() {',
        `  const markup = ${escapedHtml};`,
        '  return (',
        '    <main className="dc-preview-stage">',
        '      <div',
        '        className="dc-preview-canvas"',
        '        dangerouslySetInnerHTML={{ __html: markup }}',
        '      />',
        '    </main>',
        '  );',
        '}',
        '',
        '// generated-preview.css',
        escapedCss,
    ].join('\n');
};

const buildBackendCode = (projectName: string) => [
    'export async function GET() {',
    '  return Response.json({',
    `    project: ${JSON.stringify(projectName)},`,
    "    status: 'preview-only',",
    "    message: 'Nenhum backend especifico foi inferido do layout atual.',",
    '  });',
    '}',
].join('\n');

export function buildFaithfulGenerationResult(payload: AIGenerateRequest): AIGenerationResult {
    const {
        projectName,
        html,
        css,
        wrapperHtml,
        wrapperBounds,
        wrapperElements,
        sketchHints,
    } = payload;

    const previewMarkup = wrapperElements.length > 0
        ? buildPreviewHtml(wrapperElements)
        : wrapperHtml;
    const previewCss = buildPreviewCss(css, wrapperBounds.width, wrapperBounds.height);
    const previewHtml = buildPreviewDocument(previewMarkup);
    const summary = wrapperElements.length > 0
        ? 'Preview reconstruido diretamente do painel branco.'
        : 'Preview montado a partir do HTML atual do wrapper.';
    const interpretedSketch = sketchHints.freehandCount > 0
        ? `Foram preservados ${sketchHints.freehandCount} desenho(s) livre(s) dentro da composicao.`
        : 'Nao ha desenhos livres para interpretar nesta composicao.';

    return {
        summary,
        interpretedSketch,
        preview: {
            html: previewHtml,
            css: previewCss,
            js: '',
        },
        faithfulPreview: {
            html: previewHtml,
            css: previewCss,
            js: '',
        },
        code: {
            html: previewHtml,
            css: previewCss,
            js: '',
            react: buildReactCode(previewMarkup, previewCss),
            backend: buildBackendCode(projectName),
        },
        recommendations: [
            'O preview foi reconstruido 1:1 a partir do wrapper branco.',
            'Use o codigo HTML e CSS gerado como base para exportacao.',
            'Se quiser interpretar desenhos livres como componentes reais, isso pode ser feito numa segunda etapa.',
        ],
        source: {
            wrapperElementCount: wrapperElements.length,
            wrapperSize: wrapperBounds,
            originalHtmlLength: html.length,
        },
        generation: {
            mode: 'deterministic',
            usedFallback: true,
            notes: [
                'A geracao usou o reconstrutor fiel local.',
                'Configure OPENAI_API_KEY para ativar a interpretacao semantica por IA.',
            ],
        },
    };
}

export const buildAIGenerationResult = buildFaithfulGenerationResult;
