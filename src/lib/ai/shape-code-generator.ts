import type { GeneratedCodeBundle, PreviewBundle, RecognizedShape, RecognizedShapeKind } from './types';

type ShapeBounds = {
    width: number;
    height: number;
};

const escapeHtml = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const escapeAttribute = (value: string) => escapeHtml(value).replace(/`/g, '&#96;');

const safeClass = (value: string) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'shape';

const labelForKind = (kind: RecognizedShapeKind) => {
    const labels: Record<RecognizedShapeKind, string> = {
        rectangle: 'Retangulo',
        circle: 'Circulo',
        line: 'Linha',
        triangle: 'Triangulo',
        freehand: 'Risco livre',
        text: 'Texto',
        button: 'Botao',
        input: 'Input',
        image: 'Imagem',
        container: 'Container',
    };

    return labels[kind];
};

const solidColor = (shape: RecognizedShape) => {
    if (shape.kind === 'text') return shape.color || '#111827';
    if (shape.kind === 'input') return shape.color || '#ffffff';
    return shape.color || '#8b5cf6';
};

const buildShapeClass = (shape: RecognizedShape, index: number) => (
    `dc-ai-shape dc-ai-shape--${safeClass(shape.kind)} dc-ai-shape-${index + 1}`
);

const inlineStyleEntries = (shape: RecognizedShape) => {
    const height = shape.kind === 'line' ? Math.max(4, Math.min(shape.height, 10)) : shape.height;
    const entries: Array<[string, string | number]> = [
        ['left', `${shape.x}px`],
        ['top', `${shape.y}px`],
        ['width', `${shape.width}px`],
        ['height', `${height}px`],
        ['background-color', shape.kind === 'text' || shape.kind === 'image' ? 'transparent' : solidColor(shape)],
        ['color', shape.kind === 'text' ? solidColor(shape) : shape.kind === 'input' ? '#111827' : '#ffffff'],
        ['border-radius', `${shape.borderRadius}px`],
        ['opacity', Math.max(0.1, Math.min(1, shape.opacity || 1))],
        ['z-index', Math.round(shape.zIndex || 1)],
    ];

    if (shape.rotation !== 0) {
        entries.push(['transform', `rotate(${shape.rotation}deg)`]);
    }

    return entries;
};

const buildInlineStyle = (shape: RecognizedShape) => (
    inlineStyleEntries(shape)
        .map(([key, value]) => `${key}:${value};`)
        .join('')
);

const renderShapeHtml = (shape: RecognizedShape, index: number) => {
    const className = buildShapeClass(shape, index);
    const style = buildInlineStyle(shape);
    const dataAttrs = `data-shape-id="${escapeAttribute(shape.id)}" data-shape-kind="${shape.kind}"`;
    const label = escapeHtml(shape.text || shape.label || labelForKind(shape.kind));

    if (shape.kind === 'button') {
        return `<button class="${className}" ${dataAttrs} style="${escapeAttribute(style)}" type="button">${label || 'Botao'}</button>`;
    }

    if (shape.kind === 'input') {
        return `<input class="${className}" ${dataAttrs} style="${escapeAttribute(style)}" placeholder="${escapeAttribute(shape.text || shape.label || 'Digite aqui')}" />`;
    }

    if (shape.kind === 'image') {
        return `<img class="${className}" ${dataAttrs} style="${escapeAttribute(style)}" src="https://placehold.co/${Math.max(80, shape.width)}x${Math.max(80, shape.height)}?text=Imagem" alt="${escapeAttribute(shape.label || 'Imagem')}" />`;
    }

    if (shape.kind === 'text') {
        return `<p class="${className}" ${dataAttrs} style="${escapeAttribute(style)}">${label || 'Texto'}</p>`;
    }

    return `<div class="${className}" ${dataAttrs} style="${escapeAttribute(style)}">${shape.kind === 'container' && label ? `<span>${label}</span>` : ''}</div>`;
};

const buildHtml = (shapes: RecognizedShape[]) => `
<main class="dc-ai-generated-stage" aria-label="Pagina gerada pelo DrawCode">
  ${shapes.map(renderShapeHtml).join('\n  ')}
</main>
`.trim();

const buildCss = (bounds: ShapeBounds) => `
:root {
  --dc-ai-bg: #ffffff;
  --dc-ai-selection: #22d3ee;
  --dc-ai-text: #111827;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: #eef2ff;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  padding: 24px;
}

.dc-ai-generated-stage {
  position: relative;
  width: ${Math.max(320, Math.round(bounds.width))}px;
  height: ${Math.max(320, Math.round(bounds.height))}px;
  margin: 0 auto;
  overflow: hidden;
  background: var(--dc-ai-bg);
  color: var(--dc-ai-text);
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.12);
}

.dc-ai-shape {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1px;
  min-height: 1px;
  border: 0;
  transform-origin: left center;
  transition: box-shadow 200ms ease, outline-color 200ms ease, transform 200ms ease;
}

.dc-ai-shape--rectangle,
.dc-ai-shape--container,
.dc-ai-shape--freehand,
.dc-ai-shape--circle,
.dc-ai-shape--line,
.dc-ai-shape--triangle {
  box-shadow: 0 12px 30px rgba(76, 29, 149, 0.14);
}

.dc-ai-shape--circle {
  border-radius: 999px;
}

.dc-ai-shape--line {
  min-height: 4px;
  border-radius: 999px;
}

.dc-ai-shape--triangle {
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
}

.dc-ai-shape--button {
  cursor: pointer;
  font: inherit;
  font-weight: 800;
}

.dc-ai-shape--input {
  padding: 0 14px;
  border: 1px solid rgba(124, 58, 237, 0.28);
  color: #111827;
  font: inherit;
}

.dc-ai-shape--text {
  margin: 0;
  justify-content: flex-start;
  align-items: flex-start;
  line-height: 1.35;
  font-weight: 700;
  overflow: hidden;
}

.dc-ai-shape--image {
  object-fit: cover;
}

.dc-ai-shape.is-selected {
  outline: 3px solid var(--dc-ai-selection);
  outline-offset: 3px;
  box-shadow: 0 0 0 8px rgba(34, 211, 238, 0.14);
}

@media (max-width: 900px) {
  body {
    padding: 12px;
  }

  .dc-ai-generated-stage {
    transform: scale(0.72);
    transform-origin: top left;
  }
}
`.trim();

const buildJs = () => `
document.querySelectorAll('.dc-ai-shape').forEach((element) => {
  element.addEventListener('click', () => {
    document.querySelectorAll('.dc-ai-shape.is-selected').forEach((selected) => {
      selected.classList.remove('is-selected');
    });
    element.classList.add('is-selected');
  });
});
`.trim();

const reactShapeData = (shapes: RecognizedShape[]) => JSON.stringify(
    shapes.map((shape) => ({
        id: shape.id,
        kind: shape.kind,
        label: shape.label,
        text: shape.text,
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.kind === 'line' ? Math.max(4, Math.min(shape.height, 10)) : shape.height,
        color: solidColor(shape),
        borderRadius: shape.borderRadius,
        rotation: shape.rotation,
        opacity: shape.opacity,
        zIndex: shape.zIndex,
    })),
    null,
    2,
);

const buildReact = (shapes: RecognizedShape[], bounds: ShapeBounds, css: string) => `
import './generated-drawcode.css';

const shapes = ${reactShapeData(shapes)};

function GeneratedShape({ shape }) {
  const style = {
    left: shape.x,
    top: shape.y,
    width: shape.width,
    height: shape.height,
    backgroundColor: ['text', 'image'].includes(shape.kind) ? 'transparent' : shape.color,
    color: shape.kind === 'text' ? shape.color : shape.kind === 'input' ? '#111827' : '#ffffff',
    borderRadius: shape.borderRadius,
    opacity: shape.opacity,
    zIndex: shape.zIndex,
    transform: shape.rotation ? \`rotate(\${shape.rotation}deg)\` : undefined,
  };

  const className = \`dc-ai-shape dc-ai-shape--\${shape.kind}\`;

  if (shape.kind === 'button') {
    return <button className={className} style={style} type="button">{shape.text || shape.label}</button>;
  }

  if (shape.kind === 'input') {
    return <input className={className} style={style} placeholder={shape.text || shape.label} />;
  }

  if (shape.kind === 'image') {
    return <img className={className} style={style} src={\`https://placehold.co/\${shape.width}x\${shape.height}?text=Imagem\`} alt={shape.label} />;
  }

  if (shape.kind === 'text') {
    return <p className={className} style={style}>{shape.text || shape.label}</p>;
  }

  return <div className={className} style={style} aria-label={shape.label} />;
}

export default function GeneratedDrawCodePage() {
  return (
    <main
      className="dc-ai-generated-stage"
      style={{ width: ${Math.max(320, Math.round(bounds.width))}, height: ${Math.max(320, Math.round(bounds.height))} }}
      aria-label="Pagina gerada pelo DrawCode"
    >
      {shapes.map((shape) => (
        <GeneratedShape key={shape.id} shape={shape} />
      ))}
    </main>
  );
}

/* generated-drawcode.css */
${css}
`.trim();

export function generateCodeFromRecognizedShapes(
    shapes: RecognizedShape[],
    bounds: ShapeBounds,
): {
    preview: PreviewBundle;
    code: GeneratedCodeBundle;
} {
    const css = buildCss(bounds);
    const html = shapes.length > 0
        ? buildHtml(shapes)
        : '<main class="dc-ai-generated-stage" aria-label="Pagina gerada pelo DrawCode"></main>';
    const js = buildJs();

    return {
        preview: {
            html,
            css,
            js,
        },
        code: {
            html,
            css,
            js,
            react: buildReact(shapes, bounds, css),
        },
    };
}
