import { generateCodeFromSemanticPage } from './code-generator';
import { buildDeterministicSemanticPage } from './semantic-analyzer';
import {
    semanticPageJsonSchema,
    semanticPageSchema,
} from './semantic-schema';
import { generateCodeFromRecognizedShapes } from './shape-code-generator';
import { buildShapeMetrics, recognizeShapesFromPayload } from './shape-recognizer';
import {
    buildFaithfulGenerationResult,
    type AIGenerateRequest,
    type WrapperElementSnapshot,
} from './preview-generator';
import type { AIGenerationResult, SemanticPage } from './types';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-5.2';

const trimString = (value: string, maxLength: number) => (
    value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
);

const flattenPromptElements = (elements: WrapperElementSnapshot[]) => {
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

const uniqueTokens = (values: string[]) => Array.from(new Set(
    values.map((value) => value.trim()).filter(Boolean),
)).slice(0, 24);

const buildStyleInventory = (elements: WrapperElementSnapshot[]) => {
    const flattened = flattenPromptElements(elements);
    return {
        colors: uniqueTokens(flattened.flatMap((element) => [
            element.style.backgroundColor,
            element.style.color,
            element.style.borderColor,
        ])),
        backgrounds: uniqueTokens(flattened.map((element) => element.style.backgroundImage)),
        fonts: uniqueTokens(flattened.map((element) => element.style.fontFamily)),
        shadows: uniqueTokens(flattened.map((element) => element.style.boxShadow)),
        radii: uniqueTokens(flattened.map((element) => element.style.borderRadius)),
    };
};

const trimElementForPrompt = (element: WrapperElementSnapshot, depth = 0): Record<string, unknown> => ({
    id: element.id,
    tagName: element.tagName,
    type: element.type,
    text: trimString(element.text, 360),
    html: trimString(element.html, depth === 0 ? 1200 : 520),
    position: element.position,
    size: element.size,
    style: {
        display: element.style.display,
        position: element.style.position,
        backgroundColor: element.style.backgroundColor,
        backgroundImage: element.style.backgroundImage,
        color: element.style.color,
        fontFamily: element.style.fontFamily,
        fontSize: element.style.fontSize,
        fontWeight: element.style.fontWeight,
        lineHeight: element.style.lineHeight,
        letterSpacing: element.style.letterSpacing,
        textAlign: element.style.textAlign,
        padding: element.style.padding,
        margin: element.style.margin,
        border: element.style.border,
        borderRadius: element.style.borderRadius,
        borderWidth: element.style.borderWidth,
        borderColor: element.style.borderColor,
        borderStyle: element.style.borderStyle,
        boxShadow: element.style.boxShadow,
        transform: element.style.transform,
        opacity: element.style.opacity,
        zIndex: element.style.zIndex,
    },
    attributes: {
        src: element.attributes.src,
        alt: element.attributes.alt,
        placeholder: element.attributes.placeholder,
        href: element.attributes.href,
        class: element.attributes.class,
        dataDcType: element.attributes['data-dc-type'],
    },
    children: depth < 2
        ? (element.children as WrapperElementSnapshot[])
            .slice(0, 14)
            .map((child) => trimElementForPrompt(child, depth + 1))
        : [],
});

const trimSnapshotForPrompt = (payload: AIGenerateRequest) => ({
    projectName: payload.projectName,
    wrapperBounds: payload.wrapperBounds,
    sketchHints: payload.sketchHints,
    sourceCss: trimString(payload.css, 8000),
    sourceHtml: trimString(payload.html, 5000),
    wrapperHtml: trimString(payload.wrapperHtml, 7000),
    styleInventory: buildStyleInventory(payload.wrapperElements as WrapperElementSnapshot[]),
    elements: payload.wrapperElements.map((element) => (
        trimElementForPrompt(element as WrapperElementSnapshot)
    )).slice(0, 80),
});

const buildSystemPrompt = () => `
Voce e o DrawCode AI Agent, um agente especializado em transformar layouts visuais em uma arvore semantica de componentes React.

Objetivo:
- Interpretar o canvas visual como uma pagina real.
- Converter blocos, textos, formas, inputs, imagens e desenhos livres em componentes semanticos.
- Priorizar saida React + CSS limpos, acessiveis e responsivos.

Regras:
- Responda somente no JSON Schema solicitado.
- Preencha campos nao usados com string vazia, arrays vazios ou 0 quando necessario.
- Nao gere HTML cru neste passo.
- Preserve a intencao visual do usuario.
- Preserve geometria e hierarquia: posicoes x/y, largura, altura, alinhamento, ordem visual, sobreposicoes e z-index devem continuar reconheciveis.
- Preserve identidade visual: cores exatas, gradientes, sombras, bordas, border-radius, fontes, pesos, line-height, espacamentos, opacidade e imagens nao devem virar um tema generico.
- Nao simplifique cards, botoes, inputs, textos ou containers para blocos HTML basicos se o snapshot trouxer CSS especifico.
- Para rabiscos/desenhos livres, leia o SVG/path no campo html e mantenha a energia do traco: linhas tortas, riscos, setas, contornos e regioes desenhadas devem influenciar o componente final.
- Quando um elemento existente ja estiver bem estilizado, trate-o como fonte de verdade e apenas torne a estrutura mais semantica.
- Use componentes como navbar, hero, cardGrid, card, form, field, button, image, footer e section.
- Se houver rabiscos/desenhos livres, interprete-os como sugestoes de estrutura quando estiverem perto de textos, botoes ou inputs.
- Gere somente componentes visuais, sem rotas, APIs ou logica server-side.
- Use confidence entre 0 e 1.
- Mantenha textos em portugues quando a entrada estiver em portugues.
`.trim();

const buildUserPrompt = (payload: AIGenerateRequest) => `
Analise este snapshot do canvas branco do DrawCode e devolva a arvore semantica de componentes.

Prioridade maxima: fidelidade visual. Use sourceCss, wrapperHtml, styleInventory e elements como referencia para manter o resultado parecido com o canvas, nao como um template novo.

Snapshot:
${JSON.stringify(trimSnapshotForPrompt(payload), null, 2)}
`.trim();

const extractOutputText = (data: unknown) => {
    const maybe = data as {
        output_text?: unknown;
        output?: Array<{
            content?: Array<{
                type?: string;
                text?: string;
            }>;
        }>;
    };

    if (typeof maybe.output_text === 'string') return maybe.output_text;

    return maybe.output
        ?.flatMap((item) => item.content ?? [])
        .map((content) => content.text)
        .filter((text): text is string => typeof text === 'string')
        .join('\n')
        .trim() ?? '';
};

async function requestSemanticPageFromOpenAI(payload: AIGenerateRequest): Promise<{
    page: SemanticPage;
    model: string;
}> {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY nao configurada.');
    }

    const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
    const response = await fetch(OPENAI_RESPONSES_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            input: [
                {
                    role: 'system',
                    content: buildSystemPrompt(),
                },
                {
                    role: 'user',
                    content: buildUserPrompt(payload),
                },
            ],
            text: {
                format: {
                    type: 'json_schema',
                    name: 'drawcode_semantic_page',
                    schema: semanticPageJsonSchema,
                    strict: true,
                },
            },
        }),
    });

    const data = await response.json();
    if (!response.ok) {
        const message = typeof data?.error?.message === 'string'
            ? data.error.message
            : `OpenAI respondeu com status ${response.status}.`;
        throw new Error(message);
    }

    const outputText = extractOutputText(data);
    if (!outputText) {
        throw new Error('OpenAI nao retornou texto estruturado.');
    }

    const parsedJson = JSON.parse(outputText) as unknown;
    const parsedPage = semanticPageSchema.safeParse(parsedJson);
    if (!parsedPage.success) {
        throw new Error('A arvore semantica retornada pela OpenAI nao passou na validacao.');
    }

    return {
        page: parsedPage.data,
        model,
    };
}

const buildSummary = (page: SemanticPage, mode: 'openai' | 'deterministic') => {
    const source = mode === 'openai' ? 'IA' : 'analisador local';
    const componentCount = page.components.length;
    return `Preview aprimorado gerado pelo ${source}: ${componentCount} componente(s) semantico(s) organizados em React + CSS.`;
};

const buildShapeSummary = (mode: 'openai' | 'deterministic') => (
    mode === 'openai'
        ? 'Layout atualizado pela IA em componentes editaveis.'
        : 'Layout atualizado pelo reconhecedor visual local.'
);

const buildSketchSummary = (payload: AIGenerateRequest, mode: 'openai' | 'deterministic') => {
    if (payload.sketchHints.freehandCount === 0) {
        return mode === 'openai'
            ? 'Nao havia desenhos livres; a IA interpretou blocos, textos, imagens e formas posicionadas.'
            : 'Nao havia desenhos livres; o analisador local interpretou blocos, textos, imagens e formas posicionadas.';
    }

    return mode === 'openai'
        ? `A IA avaliou ${payload.sketchHints.freehandCount} desenho(s) livre(s) como pistas de composicao.`
        : `O analisador local preservou ${payload.sketchHints.freehandCount} desenho(s) livre(s) e usou regioes como pistas basicas.`;
};

export async function generateDrawCodeAI(payload: AIGenerateRequest): Promise<AIGenerationResult> {
    const startedAt = Date.now();
    const faithful = buildFaithfulGenerationResult(payload);
    const notes: string[] = [];
    let semanticPage: SemanticPage;
    let mode: 'openai' | 'deterministic' = 'openai';
    let model: string | undefined;
    let usedFallback = false;

    try {
        const aiResult = await requestSemanticPageFromOpenAI(payload);
        semanticPage = aiResult.page;
        model = aiResult.model;
        notes.push('OpenAI gerou uma arvore semantica validada com Zod.');
    } catch (error) {
        mode = 'deterministic';
        usedFallback = true;
        semanticPage = buildDeterministicSemanticPage(payload);
        notes.push(error instanceof Error ? error.message : 'Falha desconhecida ao chamar OpenAI.');
        notes.push('Fallback deterministico usado para manter a geracao funcional.');
    }

    const generated = generateCodeFromSemanticPage(semanticPage);
    const recognizedShapes = recognizeShapesFromPayload(payload);
    const shapeGenerated = generateCodeFromRecognizedShapes(recognizedShapes, payload.wrapperBounds);
    const metrics = buildShapeMetrics(recognizedShapes, Date.now() - startedAt);
    const hasFaithfulSnapshot = payload.wrapperElements.length > 0 || payload.wrapperHtml.trim().length > 0;
    const primaryPreview = hasFaithfulSnapshot
        ? faithful.preview
        : recognizedShapes.length > 0 ? shapeGenerated.preview : generated.preview;
    const primaryCode = hasFaithfulSnapshot
        ? faithful.code
        : recognizedShapes.length > 0 ? shapeGenerated.code : generated.code;

    return {
        summary: hasFaithfulSnapshot
            ? 'Layout preservado com fidelidade a partir do canvas e dos estilos atuais.'
            : recognizedShapes.length > 0
            ? buildShapeSummary(mode)
            : buildSummary(semanticPage, mode),
        interpretedSketch: buildSketchSummary(payload, mode),
        preview: primaryPreview,
        faithfulPreview: faithful.preview,
        code: primaryCode,
        recognizedShapes,
        metrics,
        semanticPage,
        recommendations: [
            hasFaithfulSnapshot
                ? 'A saida principal preserva HTML, CSS, cores, bordas, sombras e tracos capturados do canvas.'
                : 'O layout foi convertido em componentes editaveis no canvas.',
            'Saida principal disponivel em React + CSS, com HTML/CSS/JS como export secundario.',
            'Revise textos e acessibilidade antes de publicar o site final.',
            mode === 'deterministic'
                ? 'Adicione OPENAI_API_KEY para ativar a interpretacao por IA real.'
                : 'A arvore semantica foi validada antes da geracao de codigo.',
        ],
        source: faithful.source,
        generation: {
            mode,
            model,
            usedFallback,
            notes,
        },
    };
}
