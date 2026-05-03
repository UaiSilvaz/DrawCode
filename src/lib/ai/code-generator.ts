import type { GeneratedCodeBundle, PreviewBundle, SemanticComponent, SemanticPage } from './types';

const escapeHtml = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const escapeJsString = (value: string) => JSON.stringify(value);

const slug = (value: string) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'component';

const text = (value: string | undefined, fallback: string) => {
    const next = value?.trim();
    return next && next.length > 0 ? next : fallback;
};

const componentClass = (component: SemanticComponent) => `dc-${slug(component.type)} dc-${slug(component.label)}`;

const renderHtmlComponent = (component: SemanticComponent): string => {
    if (component.type === 'navbar') {
        const brand = escapeHtml(text(component.props.brand, 'DrawCode'));
        const links = component.props.links?.length ? component.props.links : ['Inicio', 'Recursos', 'Contato'];
        return `
<nav class="dc-navbar" aria-label="Navegacao principal">
  <a class="dc-navbar__brand" href="#">${brand}</a>
  <div class="dc-navbar__links">
    ${links.map((link) => `<a href="#${slug(link)}">${escapeHtml(link)}</a>`).join('\n    ')}
  </div>
</nav>`.trim();
    }

    if (component.type === 'hero') {
        return `
<section class="dc-hero">
  <div class="dc-hero__content">
    <p class="dc-eyebrow">Gerado pelo DrawCode</p>
    <h1>${escapeHtml(text(component.props.title, 'Crie seu site visualmente'))}</h1>
    <p>${escapeHtml(text(component.props.subtitle, 'Transforme desenho, blocos e ideias em uma interface pronta.'))}</p>
    <a class="dc-button dc-button--primary" href="#contato">${escapeHtml(text(component.props.cta, 'Comecar agora'))}</a>
  </div>
</section>`.trim();
    }

    if (component.type === 'cardGrid') {
        const cards = component.children.length > 0 ? component.children : [
            {
                id: 'fallback-card',
                type: 'card',
                label: 'Card',
                confidence: 0.5,
                props: { title: 'Recurso', text: 'Descricao do recurso.' },
                style: {},
                children: [],
            } satisfies SemanticComponent,
        ];

        return `
<section class="dc-section" id="${slug(component.props.title || 'recursos')}">
  <div class="dc-section__head">
    <h2>${escapeHtml(text(component.props.title, 'Recursos principais'))}</h2>
    <p>${escapeHtml(text(component.props.subtitle, 'Blocos interpretados a partir do canvas.'))}</p>
  </div>
  <div class="dc-card-grid">
    ${cards.map(renderHtmlComponent).join('\n    ')}
  </div>
</section>`.trim();
    }

    if (component.type === 'card') {
        return `
<article class="dc-card">
  <h3>${escapeHtml(text(component.props.title, component.label))}</h3>
  <p>${escapeHtml(text(component.props.text, 'Conteudo interpretado a partir do layout visual.'))}</p>
</article>`.trim();
    }

    if (component.type === 'form') {
        const fields = component.children.filter((child) => child.type === 'field');
        return `
<section class="dc-section" id="contato">
  <form class="dc-form">
    <h2>${escapeHtml(text(component.props.title, 'Formulario'))}</h2>
    ${fields.map(renderHtmlComponent).join('\n    ')}
    <button class="dc-button dc-button--primary" type="submit">${escapeHtml(text(component.props.cta, 'Enviar'))}</button>
  </form>
</section>`.trim();
    }

    if (component.type === 'field') {
        const placeholder = text(component.props.placeholder, component.label);
        return `
<label class="dc-field">
  <span>${escapeHtml(placeholder)}</span>
  <input type="text" placeholder="${escapeHtml(placeholder)}" />
</label>`.trim();
    }

    if (component.type === 'image') {
        return `<img class="dc-image" src="${escapeHtml(text(component.props.src, 'https://placehold.co/960x540?text=DrawCode'))}" alt="${escapeHtml(text(component.props.alt, 'Imagem do site'))}" />`;
    }

    if (component.type === 'footer') {
        return `<footer class="dc-footer"><p>${escapeHtml(text(component.props.text, 'DrawCode. Todos os direitos reservados.'))}</p></footer>`;
    }

    if (component.type === 'decorativeShape') {
        return '<div class="dc-shape" aria-hidden="true"></div>';
    }

    return `
<section class="${componentClass(component)}">
  <p>${escapeHtml(text(component.props.text || component.props.title, component.label))}</p>
</section>`.trim();
};

const renderReactComponent = (component: SemanticComponent): string => {
    if (component.type === 'navbar') {
        const links = component.props.links?.length ? component.props.links : ['Inicio', 'Recursos', 'Contato'];
        return `
      <nav className="dc-navbar" aria-label="Navegacao principal">
        <a className="dc-navbar__brand" href="#">${text(component.props.brand, 'DrawCode')}</a>
        <div className="dc-navbar__links">
          ${links.map((link) => `<a href="#${slug(link)}">${link}</a>`).join('\n          ')}
        </div>
      </nav>`.trim();
    }

    if (component.type === 'hero') {
        return `
      <section className="dc-hero">
        <div className="dc-hero__content">
          <p className="dc-eyebrow">Gerado pelo DrawCode</p>
          <h1>${text(component.props.title, 'Crie seu site visualmente')}</h1>
          <p>${text(component.props.subtitle, 'Transforme desenho, blocos e ideias em uma interface pronta.')}</p>
          <a className="dc-button dc-button--primary" href="#contato">${text(component.props.cta, 'Comecar agora')}</a>
        </div>
      </section>`.trim();
    }

    if (component.type === 'cardGrid') {
        const cards = component.children.filter((child) => child.type === 'card');
        const cardData = cards.length > 0
            ? cards.map((card) => ({
                title: text(card.props.title, card.label),
                text: text(card.props.text, 'Conteudo interpretado a partir do layout visual.'),
            }))
            : [{ title: 'Recurso', text: 'Descricao do recurso.' }];

        return `
      <section className="dc-section" id="${slug(component.props.title || 'recursos')}">
        <div className="dc-section__head">
          <h2>${text(component.props.title, 'Recursos principais')}</h2>
          <p>${text(component.props.subtitle, 'Blocos interpretados a partir do canvas.')}</p>
        </div>
        <div className="dc-card-grid">
          {${JSON.stringify(cardData, null, 12)}.map((card) => (
            <article className="dc-card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </section>`.trim();
    }

    if (component.type === 'form') {
        const fields = component.children
            .filter((child) => child.type === 'field')
            .map((field) => text(field.props.placeholder, field.label));

        return `
      <section className="dc-section" id="contato">
        <form className="dc-form">
          <h2>${text(component.props.title, 'Formulario')}</h2>
          {${JSON.stringify(fields.length > 0 ? fields : ['Nome', 'Email'])}.map((field) => (
            <label className="dc-field" key={field}>
              <span>{field}</span>
              <input type="text" placeholder={field} />
            </label>
          ))}
          <button className="dc-button dc-button--primary" type="submit">${text(component.props.cta, 'Enviar')}</button>
        </form>
      </section>`.trim();
    }

    if (component.type === 'image') {
        return `<img className="dc-image" src=${escapeJsString(text(component.props.src, 'https://placehold.co/960x540?text=DrawCode'))} alt=${escapeJsString(text(component.props.alt, 'Imagem do site'))} />`;
    }

    if (component.type === 'footer') {
        return `<footer className="dc-footer"><p>${text(component.props.text, 'DrawCode. Todos os direitos reservados.')}</p></footer>`;
    }

    return `
      <section className="${componentClass(component)}">
        <p>${text(component.props.text || component.props.title, component.label)}</p>
      </section>`.trim();
};

const buildCss = (page: SemanticPage) => `
:root {
  --dc-bg: ${page.theme.backgroundColor};
  --dc-text: ${page.theme.textColor};
  --dc-muted: #64748b;
  --dc-accent: ${page.theme.accentColor};
  --dc-surface: ${page.theme.surfaceColor};
  --dc-border: rgba(124, 58, 237, 0.18);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--dc-bg);
  color: var(--dc-text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.dc-generated-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.16), transparent 32rem),
    linear-gradient(180deg, #ffffff 0%, var(--dc-bg) 100%);
}

.dc-navbar {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  width: min(1120px, calc(100% - 40px));
  margin: 0 auto;
  padding: 18px 0;
}

.dc-navbar__brand {
  color: var(--dc-text);
  font-size: 1.1rem;
  font-weight: 800;
  text-decoration: none;
}

.dc-navbar__links {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.dc-navbar__links a {
  color: var(--dc-muted);
  font-weight: 650;
  text-decoration: none;
}

.dc-hero {
  width: min(1120px, calc(100% - 40px));
  margin: 32px auto;
  padding: clamp(48px, 8vw, 92px);
  border: 1px solid var(--dc-border);
  border-radius: 28px;
  background:
    linear-gradient(135deg, rgba(124, 58, 237, 0.92), rgba(79, 70, 229, 0.88)),
    var(--dc-accent);
  color: #ffffff;
  box-shadow: 0 28px 80px rgba(79, 70, 229, 0.28);
}

.dc-hero__content {
  max-width: 720px;
}

.dc-eyebrow {
  margin: 0 0 14px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.dc-hero h1 {
  margin: 0;
  font-size: clamp(2.5rem, 7vw, 5.25rem);
  line-height: 0.98;
  letter-spacing: 0;
}

.dc-hero p:not(.dc-eyebrow) {
  max-width: 620px;
  margin: 22px 0 0;
  color: rgba(255, 255, 255, 0.86);
  font-size: 1.1rem;
  line-height: 1.7;
}

.dc-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  margin-top: 28px;
  padding: 0 22px;
  border: 0;
  border-radius: 999px;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
}

.dc-button--primary {
  background: #ffffff;
  color: #4c1d95;
}

.dc-section {
  width: min(1120px, calc(100% - 40px));
  margin: 48px auto;
}

.dc-section__head {
  max-width: 680px;
  margin-bottom: 22px;
}

.dc-section__head h2,
.dc-form h2 {
  margin: 0 0 10px;
  color: var(--dc-text);
  font-size: clamp(2rem, 4vw, 3rem);
}

.dc-section__head p {
  margin: 0;
  color: var(--dc-muted);
  line-height: 1.7;
}

.dc-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
}

.dc-card,
.dc-form {
  border: 1px solid var(--dc-border);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
}

.dc-card {
  padding: 22px;
}

.dc-card h3 {
  margin: 0 0 10px;
  font-size: 1.2rem;
}

.dc-card p {
  margin: 0;
  color: var(--dc-muted);
  line-height: 1.65;
}

.dc-form {
  display: grid;
  gap: 14px;
  max-width: 560px;
  padding: 26px;
}

.dc-field {
  display: grid;
  gap: 8px;
  color: var(--dc-text);
  font-weight: 700;
}

.dc-field input {
  width: 100%;
  min-height: 46px;
  border: 1px solid var(--dc-border);
  border-radius: 12px;
  padding: 0 14px;
  color: var(--dc-text);
  font: inherit;
}

.dc-image {
  display: block;
  width: min(100%, 960px);
  margin: 40px auto;
  border-radius: 22px;
  object-fit: cover;
}

.dc-footer {
  width: min(1120px, calc(100% - 40px));
  margin: 64px auto 0;
  padding: 28px 0 36px;
  color: var(--dc-muted);
  border-top: 1px solid var(--dc-border);
}

@media (max-width: 720px) {
  .dc-navbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .dc-hero {
    padding: 40px 24px;
  }
}
`.trim();

const buildHtml = (page: SemanticPage) => `
<main class="dc-generated-page">
  ${page.components.map(renderHtmlComponent).join('\n  ')}
</main>
`.trim();

const buildReact = (page: SemanticPage, css: string) => `
import './generated-page.css';

export default function GeneratedPage() {
  return (
    <main className="dc-generated-page">
${page.components.map(renderReactComponent).map((item) => `      ${item}`).join('\n')}
    </main>
  );
}

/* generated-page.css */
${css}
`.trim();

const buildJs = () => `
document.addEventListener('submit', (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();
  form.querySelector('button[type="submit"]')?.setAttribute('disabled', 'true');
});
`.trim();

export function generateCodeFromSemanticPage(page: SemanticPage): {
    preview: PreviewBundle;
    code: GeneratedCodeBundle;
} {
    const css = buildCss(page);
    const html = buildHtml(page);
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
            react: buildReact(page, css),
        },
    };
}
