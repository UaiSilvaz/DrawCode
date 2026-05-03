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
} from './preview-generator';
import type { AIGenerationResult, SemanticPage } from './types';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-5.2';

const trimSnapshotForPrompt = (payload: AIGenerateRequest) => ({
    projectName: payload.projectName,
    wrapperBounds: payload.wrapperBounds,
    sketchHints: payload.sketchHints,
    elements: payload.wrapperElements.map((element) => ({
        id: element.id,
        tagName: element.tagName,
        type: element.type,
        text: element.text.slice(0, 280),
        position: element.position,
        size: element.size,
        style: {
            backgroundColor: element.style.backgroundColor,
            color: element.style.color,
            fontSize: element.style.fontSize,
            fontWeight: element.style.fontWeight,
            borderRadius: element.style.borderRadius,
        },
        attributes: {
            src: element.attributes.src,
            alt: element.attributes.alt,
            placeholder: element.attributes.placeholder,
            href: element.attributes.href,
        },
        childrenCount: element.children.length,
    })).slice(0, 80),
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
- Use componentes como navbar, hero, cardGrid, card, form, field, button, image, footer e section.
- Se houver rabiscos/desenhos livres, interprete-os como sugestoes de estrutura quando estiverem perto de textos, botoes ou inputs.
- Gere somente componentes visuais, sem rotas, APIs ou logica server-side.
- Use confidence entre 0 e 1.
- Mantenha textos em portugues quando a entrada estiver em portugues.
`.trim();

const buildUserPrompt = (payload: AIGenerateRequest) => `
Analise este snapshot do canvas branco do DrawCode e devolva a arvore semantica de componentes.

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

const buildShapeSummary = (
    shapeCount: number,
    averageConfidence: number,
    mode: 'openai' | 'deterministic',
) => {
    const source = mode === 'openai' ? 'IA + reconhecedor visual' : 'reconhecedor visual local';
    const confidence = Math.round(averageConfidence * 100);
    return `${source}: ${shapeCount} forma(s) convertida(s) em elementos individuais React/HTML com confianca media de ${confidence}%.`;
};

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

    return {
        summary: recognizedShapes.length > 0
            ? buildShapeSummary(recognizedShapes.length, metrics.averageConfidence, mode)
            : buildSummary(semanticPage, mode),
        interpretedSketch: buildSketchSummary(payload, mode),
        preview: recognizedShapes.length > 0 ? shapeGenerated.preview : generated.preview,
        faithfulPreview: faithful.preview,
        code: recognizedShapes.length > 0 ? shapeGenerated.code : generated.code,
        recognizedShapes,
        metrics,
        semanticPage,
        recommendations: [
            'Cada forma reconhecida foi transformada em um elemento individual editavel.',
            'Saida principal gerada em React + CSS, com HTML/CSS/JS como export secundario.',
            'Use o painel de treinamento para aceitar, rejeitar ou corrigir reconhecimentos.',
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
