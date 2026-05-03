import type { AIGenerateRequest, WrapperElementSnapshot } from './preview-generator';
import type { SemanticComponent, SemanticPage } from './types';

type ElementWithScore = WrapperElementSnapshot & {
    area: number;
};

const DEFAULT_THEME = {
    name: 'DrawCode clean',
    backgroundColor: '#f8fafc',
    textColor: '#111827',
    accentColor: '#7c3aed',
    surfaceColor: '#ffffff',
};

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const cleanText = (value?: string) => (value ?? '').replace(/\s+/g, ' ').trim();

const elementText = (element: WrapperElementSnapshot) => (
    cleanText(element.text) || stripHtml(element.html)
);

const flattenElements = (elements: WrapperElementSnapshot[]): WrapperElementSnapshot[] => {
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

const withArea = (elements: WrapperElementSnapshot[]): ElementWithScore[] => elements.map((element) => ({
    ...element,
    area: element.size.width * element.size.height,
}));

const isButton = (element: WrapperElementSnapshot) => (
    element.tagName === 'button' ||
    element.type.includes('button') ||
    element.attributes.role === 'button'
);

const isInput = (element: WrapperElementSnapshot) => (
    element.tagName === 'input' ||
    element.tagName === 'textarea' ||
    element.type.includes('input') ||
    element.type.includes('checkbox')
);

const isImage = (element: WrapperElementSnapshot) => (
    element.tagName === 'img' ||
    element.type.includes('image') ||
    Boolean(element.attributes.src)
);

const isTitle = (element: WrapperElementSnapshot) => (
    ['h1', 'h2', 'h3'].includes(element.tagName) ||
    element.type.includes('title') ||
    Number.parseFloat(element.style.fontSize || '0') >= 28
);

const isCardLike = (element: WrapperElementSnapshot) => (
    element.tagName === 'article' ||
    element.type.includes('card') ||
    (
        element.size.width >= 180 &&
        element.size.height >= 120 &&
        element.size.width <= 420 &&
        element.size.height <= 340 &&
        element.style.backgroundColor &&
        element.style.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
        element.style.backgroundColor !== 'transparent'
    )
);

const isNavbarLike = (element: WrapperElementSnapshot, pageWidth: number) => (
    element.tagName === 'nav' ||
    element.type.includes('navbar') ||
    (
        element.position.y <= 120 &&
        element.size.width >= pageWidth * 0.55 &&
        element.size.height <= 120 &&
        elementText(element).length > 0
    )
);

const isFooterLike = (element: WrapperElementSnapshot, pageHeight: number, pageWidth: number) => (
    element.tagName === 'footer' ||
    element.type.includes('footer') ||
    (
        element.position.y >= pageHeight * 0.72 &&
        element.size.width >= pageWidth * 0.45 &&
        element.size.height <= 160 &&
        elementText(element).length > 0
    )
);

const nearby = (
    origin: WrapperElementSnapshot,
    elements: WrapperElementSnapshot[],
    options: { xPad: number; yPad: number },
) => elements.filter((element) => (
    element !== origin &&
    element.position.x >= origin.position.x - options.xPad &&
    element.position.x <= origin.position.x + origin.size.width + options.xPad &&
    element.position.y >= origin.position.y - options.yPad &&
    element.position.y <= origin.position.y + origin.size.height + options.yPad
));

const makeComponent = (
    component: Omit<SemanticComponent, 'children'> & { children?: SemanticComponent[] },
): SemanticComponent => ({
    ...component,
    children: component.children ?? [],
});

const firstText = (elements: WrapperElementSnapshot[], fallback: string) => {
    const found = elements.map(elementText).find((text) => text.length > 0);
    return found ?? fallback;
};

const inferPageType = (elements: WrapperElementSnapshot[]): SemanticPage['pageType'] => {
    const joined = elements.map(elementText).join(' ').toLowerCase();
    const inputCount = elements.filter(isInput).length;

    if (joined.includes('senha') && joined.includes('entrar')) return 'login';
    if (joined.includes('cadastro') || joined.includes('crie sua conta')) return 'register';
    if (joined.includes('dashboard') || joined.includes('projeto')) return 'dashboard';
    if (joined.includes('portfolio') || joined.includes('portfólio')) return 'portfolio';
    if (inputCount >= 2 && joined.includes('email')) return 'login';
    return 'landing';
};

const inferTheme = (elements: WrapperElementSnapshot[]): SemanticPage['theme'] => {
    const colored = elements.find((element) => {
        const background = element.style.backgroundColor;
        return background && background !== 'rgba(0, 0, 0, 0)' && background !== 'transparent';
    });

    const textColor = elements.find((element) => element.style.color)?.style.color;

    return {
        ...DEFAULT_THEME,
        backgroundColor: '#f8fafc',
        surfaceColor: colored?.style.backgroundColor || DEFAULT_THEME.surfaceColor,
        textColor: textColor || DEFAULT_THEME.textColor,
    };
};

const createNavbar = (elements: WrapperElementSnapshot[], pageWidth: number): SemanticComponent | null => {
    const nav = elements.find((element) => isNavbarLike(element, pageWidth));
    if (!nav) return null;

    const text = elementText(nav);
    const tokens = text
        .split(/\s{2,}|\||•|-/)
        .map((item) => item.trim())
        .filter(Boolean);

    return makeComponent({
        id: nav.id || 'semantic-navbar',
        type: 'navbar',
        label: 'Navigation bar',
        confidence: nav.tagName === 'nav' ? 0.95 : 0.72,
        props: {
            brand: tokens[0] || 'DrawCode',
            links: tokens.slice(1, 5).length > 0 ? tokens.slice(1, 5) : ['Inicio', 'Recursos', 'Contato'],
        },
        style: {
            x: nav.position.x,
            y: nav.position.y,
            width: nav.size.width,
            height: nav.size.height,
            backgroundColor: nav.style.backgroundColor,
            color: nav.style.color,
        },
    });
};

const createHero = (elements: WrapperElementSnapshot[], pageWidth: number): SemanticComponent | null => {
    const titleCandidates = elements
        .filter((element) => isTitle(element) && element.position.y <= 420)
        .sort((a, b) => b.size.width * b.size.height - a.size.width * a.size.height);
    const title = titleCandidates[0];

    const largeTopRegion = withArea(elements)
        .filter((element) => (
            element.position.y <= 260 &&
            element.size.width >= pageWidth * 0.35 &&
            element.size.height >= 160
        ))
        .sort((a, b) => b.area - a.area)[0];

    if (!title && !largeTopRegion) return null;

    const region = largeTopRegion ?? title;
    if (!region) return null;

    const related = nearby(region, elements, { xPad: 120, yPad: 180 });
    const subtitle = related.find((element) => element.tagName === 'p' || element.type.includes('paragraph'));
    const button = related.find(isButton) ?? elements.find((element) => isButton(element) && element.position.y <= 520);

    return makeComponent({
        id: region.id || 'semantic-hero',
        type: 'hero',
        label: 'Hero section',
        confidence: title ? 0.86 : 0.66,
        props: {
            title: title ? elementText(title) : firstText(related, 'Crie paginas profissionais visualmente'),
            subtitle: subtitle ? elementText(subtitle) : 'Transforme sua ideia visual em uma interface pronta para producao.',
            cta: button ? elementText(button) || 'Comecar agora' : 'Comecar agora',
        },
        style: {
            x: region.position.x,
            y: region.position.y,
            width: region.size.width,
            height: Math.max(region.size.height, 260),
            backgroundColor: region.style.backgroundColor,
            color: region.style.color,
            accentColor: DEFAULT_THEME.accentColor,
        },
    });
};

const createForm = (elements: WrapperElementSnapshot[]): SemanticComponent | null => {
    const inputs = elements.filter(isInput);
    if (inputs.length === 0) return null;

    const sortedInputs = [...inputs].sort((a, b) => a.position.y - b.position.y);
    const buttons = elements.filter(isButton);
    const fields = sortedInputs.map((input, index) => makeComponent({
        id: input.id || `semantic-field-${index + 1}`,
        type: 'field',
        label: input.attributes.placeholder || `Campo ${index + 1}`,
        confidence: 0.88,
        props: {
            placeholder: input.attributes.placeholder || elementText(input) || `Campo ${index + 1}`,
        },
        style: {
            x: input.position.x,
            y: input.position.y,
            width: input.size.width,
            height: input.size.height,
        },
    }));

    return makeComponent({
        id: 'semantic-form',
        type: 'form',
        label: 'Form',
        confidence: inputs.length >= 2 ? 0.9 : 0.72,
        props: {
            title: 'Formulario',
            cta: buttons[0] ? elementText(buttons[0]) || 'Enviar' : 'Enviar',
        },
        style: {
            x: Math.min(...sortedInputs.map((input) => input.position.x)),
            y: Math.min(...sortedInputs.map((input) => input.position.y)),
            width: Math.max(...sortedInputs.map((input) => input.size.width)),
            height: sortedInputs.reduce((total, input) => total + input.size.height, 0),
        },
        children: fields,
    });
};

const createCardGrid = (elements: WrapperElementSnapshot[]): SemanticComponent | null => {
    const cards = elements.filter(isCardLike);
    if (cards.length < 2) return null;

    const semanticCards = cards.slice(0, 6).map((card, index) => {
        const related = nearby(card, elements, { xPad: 24, yPad: 24 });
        const title = related.find(isTitle);
        const paragraph = related.find((element) => element.tagName === 'p' || element.type.includes('paragraph'));

        return makeComponent({
            id: card.id || `semantic-card-${index + 1}`,
            type: 'card',
            label: `Card ${index + 1}`,
            confidence: card.type.includes('card') ? 0.9 : 0.68,
            props: {
                title: title ? elementText(title) : elementText(card) || `Recurso ${index + 1}`,
                text: paragraph ? elementText(paragraph) : 'Descricao objetiva do recurso ou bloco visual.',
            },
            style: {
                x: card.position.x,
                y: card.position.y,
                width: card.size.width,
                height: card.size.height,
                backgroundColor: card.style.backgroundColor,
                color: card.style.color,
            },
        });
    });

    return makeComponent({
        id: 'semantic-card-grid',
        type: 'cardGrid',
        label: 'Card grid',
        confidence: 0.82,
        props: {
            title: 'Recursos principais',
            subtitle: 'Componentes organizados a partir do layout desenhado.',
        },
        style: {},
        children: semanticCards,
    });
};

const createFooter = (elements: WrapperElementSnapshot[], pageHeight: number, pageWidth: number): SemanticComponent | null => {
    const footer = elements.find((element) => isFooterLike(element, pageHeight, pageWidth));
    if (!footer) return null;

    return makeComponent({
        id: footer.id || 'semantic-footer',
        type: 'footer',
        label: 'Footer',
        confidence: footer.tagName === 'footer' ? 0.94 : 0.7,
        props: {
            text: elementText(footer) || 'DrawCode. Todos os direitos reservados.',
        },
        style: {
            x: footer.position.x,
            y: footer.position.y,
            width: footer.size.width,
            height: footer.size.height,
            backgroundColor: footer.style.backgroundColor,
            color: footer.style.color,
        },
    });
};

const createRemainingSections = (
    elements: WrapperElementSnapshot[],
    usedIds: Set<string>,
): SemanticComponent[] => elements
    .filter((element) => !usedIds.has(element.id) && elementText(element).length > 0)
    .filter((element) => !isButton(element) && !isInput(element))
    .slice(0, 4)
    .map((element, index) => makeComponent({
        id: element.id || `semantic-text-${index + 1}`,
        type: isImage(element) ? 'image' : 'text',
        label: isImage(element) ? 'Image' : 'Text block',
        confidence: isImage(element) ? 0.86 : 0.62,
        props: isImage(element)
            ? {
                src: element.attributes.src,
                alt: element.attributes.alt || 'Imagem do layout',
            }
            : {
                text: elementText(element),
            },
        style: {
            x: element.position.x,
            y: element.position.y,
            width: element.size.width,
            height: element.size.height,
            color: element.style.color,
        },
    }));

export function buildDeterministicSemanticPage(payload: AIGenerateRequest): SemanticPage {
    const elements = flattenElements(payload.wrapperElements);
    const pageWidth = payload.wrapperBounds.width;
    const pageHeight = payload.wrapperBounds.height;
    const components: SemanticComponent[] = [];

    const navbar = createNavbar(elements, pageWidth);
    const hero = createHero(elements, pageWidth);
    const form = createForm(elements);
    const cardGrid = createCardGrid(elements);
    const footer = createFooter(elements, pageHeight, pageWidth);

    [navbar, hero, form, cardGrid, footer].forEach((component) => {
        if (component) components.push(component);
    });

    const usedIds = new Set(
        components.flatMap((component) => [
            component.id,
            ...component.children.map((child) => child.id),
        ]),
    );
    components.push(...createRemainingSections(elements, usedIds));

    if (components.length === 0) {
        components.push(makeComponent({
            id: 'semantic-empty-section',
            type: 'section',
            label: 'Empty section',
            confidence: 0.5,
            props: {
                title: payload.projectName || 'Novo site',
                text: 'Adicione elementos ao canvas para gerar uma pagina mais completa.',
            },
            style: {},
        }));
    }

    return {
        pageType: inferPageType(elements),
        layoutIntent: payload.sketchHints.freehandCount > 0
            ? 'Interface criada a partir de blocos e desenhos livres no canvas.'
            : 'Interface criada a partir dos blocos posicionados no canvas.',
        theme: inferTheme(elements),
        components,
    };
}
