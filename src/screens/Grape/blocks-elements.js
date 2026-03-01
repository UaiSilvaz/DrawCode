const absoluteBaseStyle = {
    position: "absolute",
    left: "48px",
    top: "48px",
    width: "220px",
    height: "120px",
    "box-sizing": "border-box",
};

const withAbsoluteStyle = (style = {}) => ({
    ...absoluteBaseStyle,
    ...style,
});

const PREVIEW_BY_TITLE = {
    Retangulo: '<div class="dc-preview-shape dc-preview-rectangle"></div>',
    Circulo: '<div class="dc-preview-shape dc-preview-circle"></div>',
    Linha: '<div class="dc-preview-shape dc-preview-line"></div>',
    Container: '<div class="dc-preview-container"></div>',
    Button: '<button class="dc-preview-button">Botao</button>',
    Input: '<div class="dc-preview-input"></div>',
    Checkbox: '<div class="dc-preview-checkbox"></div>',
    Card: '<div class="dc-preview-card"></div>',
    Navbar: '<div class="dc-preview-navbar"></div>',
    Footer: '<div class="dc-preview-footer"></div>',
    'Tela de login': '<div class="dc-preview-layout dc-preview-login"></div>',
    'Tela de cadastro': '<div class="dc-preview-layout dc-preview-register"></div>',
    'Hero section': '<div class="dc-preview-layout dc-preview-hero"></div>',
    'Secao de precos': '<div class="dc-preview-layout dc-preview-pricing"></div>',
    'Grid de cards': '<div class="dc-preview-layout dc-preview-grid"></div>',
    'Landing page base': '<div class="dc-preview-layout dc-preview-landing"></div>',
    'Upload de imagem': '<div class="dc-preview-image"></div>',
    'Placeholder de imagem': '<div class="dc-preview-image-placeholder"></div>',
    Titulo: '<div class="dc-preview-title"></div>',
    Paragrafo: '<div class="dc-preview-paragraph"></div>',
    'Texto editavel': '<div class="dc-preview-editable"></div>',
};

const buildBlockLabel = (title, category) => {
    const preview = PREVIEW_BY_TITLE[title] ?? '<div class="dc-preview-generic"></div>';
    return `
        <div class="dc-block-label">
            <div class="dc-block-preview">${preview}</div>
            <div class="dc-block-text">
                <span class="dc-block-title">${title}</span>
                <span class="dc-block-category">${category}</span>
            </div>
        </div>
    `;
};

const asBlock = (title, category, content) => ({
    label: buildBlockLabel(title, category),
    category,
    content,
});

export default function registerBlocks(editor) {
    const bm = editor.BlockManager;
    const upsert = (id, config) => {
        if (bm.get(id)) bm.remove(id);
        bm.add(id, config);
    };

    // Formas
    upsert("shape-rectangle", asBlock("Retangulo", "Formas", {
        tagName: "div",
        attributes: { "data-dc-type": "shape-rectangle" },
        style: withAbsoluteStyle({
            "background-image": "linear-gradient(135deg,#7c3aed,#4c1d95)",
            "border-radius": "14px",
            border: "1px solid #a78bfa",
        }),
    }));

    upsert("shape-circle", asBlock("Circulo", "Formas", {
        tagName: "div",
        attributes: { "data-dc-type": "shape-circle" },
        style: withAbsoluteStyle({
            width: "120px",
            height: "120px",
            "background-color": "#8b5cf6",
            border: "1px solid #a78bfa",
            "border-radius": "9999px",
        }),
    }));

    upsert("shape-line", asBlock("Linha", "Formas", {
        tagName: "div",
        attributes: { "data-dc-type": "shape-line" },
        style: withAbsoluteStyle({
            width: "260px",
            height: "3px",
            "background-color": "#6d28d9",
            "border-radius": "999px",
        }),
    }));

    upsert("shape-container", asBlock("Container", "Formas", {
        tagName: "div",
        attributes: { "data-dc-type": "container" },
        style: withAbsoluteStyle({
            width: "400px",
            height: "240px",
            padding: "20px",
            "background-color": "#fdfaff",
            border: "1px dashed #a78bfa",
            "border-radius": "16px",
            "box-shadow": "0 10px 30px rgba(76, 29, 149, 0.15)",
        }),
        components: [
            {
                type: "text",
                tagName: "p",
                content: "Container para agrupar elementos",
                attributes: { "data-dc-type": "paragraph" },
                style: {
                    margin: "0",
                    color: "#5b21b6",
                    "font-size": "14px",
                },
            },
        ],
    }));

    // Componentes UI
    upsert("ui-button", asBlock("Button", "Componentes UI", {
        tagName: "button",
        attributes: { "data-dc-type": "button", type: "button" },
        content: "Comecar agora",
        style: withAbsoluteStyle({
            width: "190px",
            height: "48px",
            border: "none",
            "border-radius": "999px",
            "background-image": "linear-gradient(135deg,#7c3aed,#4c1d95)",
            color: "#ffffff",
            "font-size": "15px",
            "font-weight": "700",
            cursor: "pointer",
            "box-shadow": "0 10px 26px rgba(76, 29, 149, 0.32)",
        }),
    }));

    upsert("ui-input", asBlock("Input", "Componentes UI", {
        tagName: "input",
        attributes: { "data-dc-type": "input", placeholder: "Digite algo..." },
        style: withAbsoluteStyle({
            width: "280px",
            height: "46px",
            padding: "10px 14px",
            border: "1px solid #c4b5fd",
            "border-radius": "12px",
            "background-color": "#ffffff",
            color: "#312e81",
            "font-size": "14px",
        }),
    }));

    upsert("ui-checkbox", asBlock("Checkbox", "Componentes UI", {
        tagName: "label",
        attributes: { "data-dc-type": "checkbox" },
        style: withAbsoluteStyle({
            width: "240px",
            height: "auto",
            display: "flex",
            gap: "10px",
            "align-items": "center",
            "font-size": "14px",
            color: "#4c1d95",
        }),
        components: [
            {
                tagName: "input",
                attributes: { type: "checkbox" },
                style: {
                    width: "16px",
                    height: "16px",
                    accentColor: "#7c3aed",
                },
            },
            {
                type: "text",
                content: "Aceito os termos",
            },
        ],
    }));

    upsert("ui-card", asBlock("Card", "Componentes UI", {
        tagName: "article",
        attributes: { "data-dc-type": "card" },
        style: withAbsoluteStyle({
            width: "320px",
            height: "220px",
            padding: "20px",
            "background-color": "#ffffff",
            border: "1px solid #ddd6fe",
            "border-radius": "18px",
            "box-shadow": "0 16px 34px rgba(76, 29, 149, 0.12)",
        }),
        components: [
            {
                type: "text",
                tagName: "h3",
                content: "Card premium",
                attributes: { "data-dc-type": "title" },
                style: {
                    margin: "0 0 10px 0",
                    color: "#312e81",
                    "font-size": "22px",
                    "font-weight": "700",
                },
            },
            {
                type: "text",
                tagName: "p",
                content: "Descricao curta para comunicar valor de forma clara.",
                attributes: { "data-dc-type": "paragraph" },
                style: {
                    margin: "0 0 14px 0",
                    color: "#6d28d9",
                    "font-size": "14px",
                    "line-height": "1.5",
                },
            },
            {
                type: "text",
                tagName: "span",
                content: "Saiba mais ->",
                style: {
                    color: "#7c3aed",
                    "font-size": "13px",
                    "font-weight": "700",
                },
            },
        ],
    }));

    upsert("ui-navbar", asBlock("Navbar", "Componentes UI", {
        tagName: "nav",
        attributes: { "data-dc-type": "navbar" },
        style: withAbsoluteStyle({
            width: "980px",
            height: "74px",
            padding: "0 26px",
            display: "flex",
            "align-items": "center",
            "justify-content": "space-between",
            "background-color": "#1e1b4b",
            color: "#f5f3ff",
            "border-radius": "16px",
            border: "1px solid #4c1d95",
        }),
        components: [
            {
                type: "text",
                tagName: "strong",
                content: "DrawCode",
                style: { "font-size": "20px", "letter-spacing": "0.03em" },
            },
            {
                type: "text",
                tagName: "span",
                content: "Inicio   Recursos   Precos   Contato",
                style: { color: "#ddd6fe", "font-size": "14px" },
            },
        ],
    }));

    upsert("ui-footer", asBlock("Footer", "Componentes UI", {
        tagName: "footer",
        attributes: { "data-dc-type": "footer" },
        style: withAbsoluteStyle({
            width: "980px",
            height: "96px",
            padding: "26px",
            display: "flex",
            "align-items": "center",
            "justify-content": "space-between",
            "background-color": "#2e1065",
            color: "#ede9fe",
            "border-radius": "16px",
            border: "1px solid #5b21b6",
        }),
        components: [
            { type: "text", content: "2026 DrawCode. Todos os direitos reservados." },
            { type: "text", content: "Privacidade | Termos | Suporte" },
        ],
    }));

    // Layouts pre-definidos
    upsert("layout-login", asBlock("Tela de login", "Layouts pre-definidos", {
        tagName: "section",
        attributes: { "data-dc-type": "layout-login" },
        style: withAbsoluteStyle({
            width: "470px",
            height: "520px",
            padding: "30px",
            "background-color": "#fdfcff",
            "border-radius": "22px",
            border: "1px solid #d8b4fe",
            "box-shadow": "0 22px 56px rgba(76, 29, 149, 0.18)",
        }),
        components: `
            <div style="display:inline-flex;align-items:center;height:26px;padding:0 10px;border-radius:999px;background:#ede9fe;color:#5b21b6;font-size:12px;font-weight:700;margin-bottom:14px;">AREA SEGURA</div>
            <h2 data-dc-type="title" style="margin:0 0 8px 0;color:#312e81;font-size:32px;font-weight:800;">Bem-vindo de volta</h2>
            <p data-dc-type="paragraph" style="margin:0 0 22px 0;color:#6d28d9;font-size:14px;">Acesse sua conta para continuar seu projeto.</p>
            <label style="display:block;margin-bottom:8px;color:#4c1d95;font-size:13px;font-weight:600;">Email</label>
            <input data-dc-type="input" type="email" placeholder="voce@empresa.com" style="width:100%;height:46px;margin-bottom:12px;padding:0 14px;border:1px solid #c4b5fd;border-radius:12px;background:#fff;color:#312e81;" />
            <label style="display:block;margin-bottom:8px;color:#4c1d95;font-size:13px;font-weight:600;">Senha</label>
            <input data-dc-type="input" type="password" placeholder="Digite sua senha" style="width:100%;height:46px;margin-bottom:12px;padding:0 14px;border:1px solid #c4b5fd;border-radius:12px;background:#fff;color:#312e81;" />
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
                <label data-dc-type="checkbox" style="display:flex;gap:8px;align-items:center;color:#6d28d9;font-size:12px;">
                    <input type="checkbox" style="accent-color:#7c3aed;" />
                    Manter conectado
                </label>
                <span style="color:#7c3aed;font-size:12px;font-weight:700;cursor:pointer;">Esqueci minha senha</span>
            </div>
            <button data-dc-type="button" type="button" style="width:100%;height:48px;border:none;border-radius:12px;background:linear-gradient(135deg,#7c3aed,#4c1d95);color:#fff;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 12px 24px rgba(76,29,149,0.3);">Entrar</button>
            <p style="margin:16px 0 0 0;color:#6d28d9;font-size:12px;text-align:center;">Nao tem conta? <span style="color:#4c1d95;font-weight:700;">Crie em segundos</span></p>
        `,
    }));

    upsert("layout-register", asBlock("Tela de cadastro", "Layouts pre-definidos", {
        tagName: "section",
        attributes: { "data-dc-type": "layout-register" },
        style: withAbsoluteStyle({
            width: "520px",
            height: "620px",
            padding: "30px",
            "background-color": "#fdfcff",
            "border-radius": "22px",
            border: "1px solid #d8b4fe",
            "box-shadow": "0 22px 56px rgba(76, 29, 149, 0.18)",
        }),
        components: `
            <div style="display:inline-flex;align-items:center;height:26px;padding:0 10px;border-radius:999px;background:#ede9fe;color:#5b21b6;font-size:12px;font-weight:700;margin-bottom:14px;">NOVA CONTA</div>
            <h2 data-dc-type="title" style="margin:0 0 8px 0;color:#312e81;font-size:32px;font-weight:800;">Crie sua conta</h2>
            <p data-dc-type="paragraph" style="margin:0 0 22px 0;color:#6d28d9;font-size:14px;">Configure seu perfil para publicar paginas com IA.</p>
            <label style="display:block;margin-bottom:8px;color:#4c1d95;font-size:13px;font-weight:600;">Nome completo</label>
            <input data-dc-type="input" placeholder="Seu nome" style="width:100%;height:46px;margin-bottom:12px;padding:0 14px;border:1px solid #c4b5fd;border-radius:12px;background:#fff;color:#312e81;" />
            <label style="display:block;margin-bottom:8px;color:#4c1d95;font-size:13px;font-weight:600;">Email</label>
            <input data-dc-type="input" type="email" placeholder="voce@empresa.com" style="width:100%;height:46px;margin-bottom:12px;padding:0 14px;border:1px solid #c4b5fd;border-radius:12px;background:#fff;color:#312e81;" />
            <label style="display:block;margin-bottom:8px;color:#4c1d95;font-size:13px;font-weight:600;">Senha</label>
            <input data-dc-type="input" type="password" placeholder="Minimo 8 caracteres" style="width:100%;height:46px;margin-bottom:12px;padding:0 14px;border:1px solid #c4b5fd;border-radius:12px;background:#fff;color:#312e81;" />
            <label style="display:block;margin-bottom:8px;color:#4c1d95;font-size:13px;font-weight:600;">Confirmar senha</label>
            <input data-dc-type="input" type="password" placeholder="Repita a senha" style="width:100%;height:46px;margin-bottom:16px;padding:0 14px;border:1px solid #c4b5fd;border-radius:12px;background:#fff;color:#312e81;" />
            <label data-dc-type="checkbox" style="display:flex;gap:8px;align-items:flex-start;color:#6d28d9;font-size:12px;margin-bottom:16px;">
                <input type="checkbox" style="margin-top:2px;accent-color:#7c3aed;" />
                Li e aceito os termos e politica de privacidade.
            </label>
            <button data-dc-type="button" type="button" style="width:100%;height:48px;border:none;border-radius:12px;background:linear-gradient(135deg,#7c3aed,#4c1d95);color:#fff;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 12px 24px rgba(76,29,149,0.3);">Criar conta</button>
        `,
    }));

    upsert("layout-hero", asBlock("Hero section", "Layouts pre-definidos", {
        tagName: "section",
        attributes: { "data-dc-type": "layout-hero" },
        style: withAbsoluteStyle({
            width: "1060px",
            height: "430px",
            padding: "48px",
            "background-image": "linear-gradient(130deg,#2e1065,#5b21b6 45%,#7c3aed)",
            color: "#ffffff",
            "border-radius": "24px",
            border: "1px solid rgba(221,214,254,0.35)",
            "box-shadow": "0 26px 56px rgba(46, 16, 101, 0.36)",
        }),
        components: `
            <div style="display:inline-flex;align-items:center;height:30px;padding:0 12px;border-radius:999px;background:rgba(255,255,255,0.16);font-size:12px;font-weight:700;letter-spacing:0.05em;margin-bottom:16px;">NOVO NO DRAWCODE</div>
            <h1 data-dc-type="title" style="font-size:62px;line-height:1.02;margin:0 0 14px 0;max-width:700px;">Crie paginas profissionais em minutos</h1>
            <p data-dc-type="paragraph" style="font-size:18px;max-width:620px;margin:0 0 26px 0;color:rgba(255,255,255,0.88);line-height:1.55;">Monte visualmente, organize componentes e deixe a IA transformar tudo em HTML, CSS e JavaScript pronto para producao.</p>
            <div style="display:flex;gap:12px;align-items:center;margin-bottom:28px;">
                <button data-dc-type="button" style="height:46px;padding:0 22px;border:none;border-radius:999px;background:#ffffff;color:#4c1d95;font-weight:800;cursor:pointer;">Comecar projeto</button>
                <button data-dc-type="button" style="height:46px;padding:0 22px;border:1px solid rgba(255,255,255,0.52);border-radius:999px;background:rgba(255,255,255,0.08);color:#ffffff;font-weight:700;cursor:pointer;">Ver demonstracao</button>
            </div>
            <div style="display:flex;gap:22px;color:rgba(255,255,255,0.88);font-size:13px;">
                <span><strong>+12k</strong> paginas criadas</span>
                <span><strong>94%</strong> produtividade media</span>
                <span><strong>Sem codigo</strong> no processo inicial</span>
            </div>
        `,
    }));

    upsert("layout-pricing", asBlock("Secao de precos", "Layouts pre-definidos", {
        tagName: "section",
        attributes: { "data-dc-type": "layout-pricing" },
        style: withAbsoluteStyle({
            width: "1060px",
            height: "470px",
            padding: "28px",
            display: "flex",
            "flex-direction": "column",
            gap: "18px",
            "background-color": "#faf5ff",
            "border-radius": "24px",
            border: "1px solid #ddd6fe",
        }),
        components: `
            <div>
                <h2 data-dc-type="title" style="margin:0 0 6px 0;color:#312e81;font-size:34px;">Planos para cada fase</h2>
                <p data-dc-type="paragraph" style="margin:0;color:#6d28d9;font-size:14px;">Comece rapido e escale com recursos avancados de colaboracao e exportacao.</p>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;">
                <article data-dc-type="card" style="background:#ffffff;border-radius:16px;padding:18px;border:1px solid #e9d5ff;">
                    <h3 style="margin:0 0 8px 0;color:#312e81;">Starter</h3>
                    <p style="margin:0 0 12px 0;color:#7c3aed;font-size:28px;font-weight:800;">R$29<span style="font-size:13px;font-weight:600;">/mes</span></p>
                    <p style="margin:0 0 14px 0;color:#6d28d9;font-size:13px;">Ideal para projetos pessoais.</p>
                    <button data-dc-type="button" style="height:40px;width:100%;border:none;border-radius:10px;background:#ede9fe;color:#4c1d95;font-weight:700;cursor:pointer;">Escolher plano</button>
                </article>
                <article data-dc-type="card" style="background:linear-gradient(165deg,#4c1d95,#312e81);color:#ffffff;border-radius:16px;padding:18px;border:1px solid #a78bfa;box-shadow:0 16px 28px rgba(76,29,149,0.28);">
                    <div style="display:inline-flex;height:24px;padding:0 10px;align-items:center;border-radius:999px;background:rgba(255,255,255,0.2);font-size:11px;font-weight:700;margin-bottom:8px;">MAIS USADO</div>
                    <h3 style="margin:0 0 8px 0;">Pro</h3>
                    <p style="margin:0 0 12px 0;color:#ddd6fe;font-size:28px;font-weight:800;">R$79<span style="font-size:13px;font-weight:600;">/mes</span></p>
                    <p style="margin:0 0 14px 0;color:#e9d5ff;font-size:13px;">Equipe e automacoes com IA.</p>
                    <button data-dc-type="button" style="height:40px;width:100%;border:none;border-radius:10px;background:#ffffff;color:#4c1d95;font-weight:800;cursor:pointer;">Assinar Pro</button>
                </article>
                <article data-dc-type="card" style="background:#ffffff;border-radius:16px;padding:18px;border:1px solid #e9d5ff;">
                    <h3 style="margin:0 0 8px 0;color:#312e81;">Business</h3>
                    <p style="margin:0 0 12px 0;color:#7c3aed;font-size:28px;font-weight:800;">Sob consulta</p>
                    <p style="margin:0 0 14px 0;color:#6d28d9;font-size:13px;">Governanca, SSO e suporte dedicado.</p>
                    <button data-dc-type="button" style="height:40px;width:100%;border:none;border-radius:10px;background:#ede9fe;color:#4c1d95;font-weight:700;cursor:pointer;">Falar com vendas</button>
                </article>
            </div>
        `,
    }));

    upsert("layout-card-grid", asBlock("Grid de cards", "Layouts pre-definidos", {
        tagName: "section",
        attributes: { "data-dc-type": "layout-cards-grid" },
        style: withAbsoluteStyle({
            width: "1080px",
            height: "360px",
            padding: "24px",
            display: "grid",
            "grid-template-columns": "repeat(3, minmax(0, 1fr))",
            gap: "16px",
            "border-radius": "22px",
            border: "1px solid #ddd6fe",
            "background-color": "#ffffff",
        }),
        components: `
            <article data-dc-type="card" style="padding:18px;border-radius:14px;background:#faf5ff;border:1px solid #ede9fe;">
                <h4 style="margin:0 0 6px 0;color:#312e81;font-size:20px;">Componente rapido</h4>
                <p style="margin:0;color:#6d28d9;line-height:1.45;">Monte secoes em segundos e reutilize em qualquer pagina.</p>
            </article>
            <article data-dc-type="card" style="padding:18px;border-radius:14px;background:#faf5ff;border:1px solid #ede9fe;">
                <h4 style="margin:0 0 6px 0;color:#312e81;font-size:20px;">Visual premium</h4>
                <p style="margin:0;color:#6d28d9;line-height:1.45;">Tema roxo com hierarquia clara e acabamento profissional.</p>
            </article>
            <article data-dc-type="card" style="padding:18px;border-radius:14px;background:#faf5ff;border:1px solid #ede9fe;">
                <h4 style="margin:0 0 6px 0;color:#312e81;font-size:20px;">Pronto para IA</h4>
                <p style="margin:0;color:#6d28d9;line-height:1.45;">Estrutura organizada para exportar JSON e gerar codigo.</p>
            </article>
        `,
    }));

    upsert("layout-landing-base", asBlock("Landing page base", "Layouts pre-definidos", {
        tagName: "section",
        attributes: { "data-dc-type": "layout-landing-base" },
        style: withAbsoluteStyle({
            width: "1140px",
            height: "840px",
            padding: "22px",
            "background-color": "#fcfaff",
            border: "1px solid #ddd6fe",
            "border-radius": "24px",
        }),
        components: `
            <nav data-dc-type="navbar" style="height:70px;padding:0 22px;border-radius:14px;background:#1e1b4b;color:#fff;display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border:1px solid #4c1d95;">
                <strong style="font-size:20px;">DrawCode</strong>
                <span style="font-size:14px;color:#ddd6fe;">Recursos | Precos | Templates | Contato</span>
            </nav>
            <section data-dc-type="layout-hero" style="height:260px;padding:28px;border-radius:16px;background:linear-gradient(135deg,#4c1d95,#7c3aed);color:#fff;margin-bottom:14px;box-shadow:0 18px 36px rgba(76,29,149,0.28);">
                <h1 style="margin:0 0 10px 0;font-size:50px;line-height:1.02;max-width:640px;">Landing pronta para conversao</h1>
                <p style="margin:0 0 16px 0;max-width:560px;color:rgba(255,255,255,0.88);">Use este layout base para campanhas, produtos ou paginas institucionais com identidade roxa.</p>
                <button data-dc-type="button" style="height:42px;padding:0 20px;border:none;border-radius:999px;background:#fff;color:#4c1d95;font-weight:800;">Criar agora</button>
            </section>
            <section data-dc-type="layout-cards-grid" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:14px;">
                <article data-dc-type="card" style="padding:14px;border-radius:12px;background:#ffffff;border:1px solid #ede9fe;"><h4 style="margin:0 0 6px 0;color:#312e81;">Setup rapido</h4><p style="margin:0;color:#6d28d9;font-size:13px;">Estrutura inicial pronta.</p></article>
                <article data-dc-type="card" style="padding:14px;border-radius:12px;background:#ffffff;border:1px solid #ede9fe;"><h4 style="margin:0 0 6px 0;color:#312e81;">SEO amigavel</h4><p style="margin:0;color:#6d28d9;font-size:13px;">Secoes e hierarquia claras.</p></article>
                <article data-dc-type="card" style="padding:14px;border-radius:12px;background:#ffffff;border:1px solid #ede9fe;"><h4 style="margin:0 0 6px 0;color:#312e81;">Conversao alta</h4><p style="margin:0;color:#6d28d9;font-size:13px;">CTA e prova social integrados.</p></article>
            </section>
            <section data-dc-type="layout-pricing" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:14px;">
                <article data-dc-type="card" style="padding:14px;border-radius:12px;background:#faf5ff;border:1px solid #ede9fe;"><h4 style="margin:0 0 6px 0;color:#312e81;">Starter</h4><p style="margin:0;color:#7c3aed;font-weight:700;">R$29/mes</p></article>
                <article data-dc-type="card" style="padding:14px;border-radius:12px;background:#4c1d95;color:#fff;border:1px solid #a78bfa;"><h4 style="margin:0 0 6px 0;">Pro</h4><p style="margin:0;color:#ddd6fe;font-weight:700;">R$79/mes</p></article>
                <article data-dc-type="card" style="padding:14px;border-radius:12px;background:#faf5ff;border:1px solid #ede9fe;"><h4 style="margin:0 0 6px 0;color:#312e81;">Business</h4><p style="margin:0;color:#7c3aed;font-weight:700;">Sob consulta</p></article>
            </section>
            <footer data-dc-type="footer" style="height:70px;padding:0 20px;border-radius:14px;background:#2e1065;color:#fff;display:flex;justify-content:space-between;align-items:center;border:1px solid #5b21b6;">
                DrawCode 2026
                <span style="color:#ddd6fe;">Termos | Privacidade | Suporte</span>
            </footer>
        `,
    }));

    // Imagens
    upsert("media-image-upload", asBlock("Upload de imagem", "Imagens", {
        type: "image",
        attributes: {
            "data-dc-type": "image",
            src: "https://placehold.co/800x450?text=Upload+Image",
            alt: "Imagem",
        },
        style: withAbsoluteStyle({
            width: "380px",
            height: "220px",
            "object-fit": "cover",
            "border-radius": "16px",
            border: "1px solid #c4b5fd",
            "box-shadow": "0 12px 28px rgba(76, 29, 149, 0.15)",
        }),
    }));

    upsert("media-image-placeholder", asBlock("Placeholder de imagem", "Imagens", {
        tagName: "div",
        attributes: { "data-dc-type": "image-placeholder" },
        style: withAbsoluteStyle({
            width: "380px",
            height: "220px",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            "border-radius": "16px",
            border: "2px dashed #a78bfa",
            "background-color": "#faf5ff",
            color: "#6d28d9",
            "font-size": "14px",
        }),
        components: [{ type: "text", content: "Image placeholder" }],
    }));

    // Texto
    upsert("text-title", asBlock("Titulo", "Texto", {
        type: "text",
        tagName: "h1",
        content: "Titulo principal",
        attributes: { "data-dc-type": "title" },
        style: withAbsoluteStyle({
            width: "520px",
            height: "auto",
            margin: "0",
            color: "#312e81",
            "font-size": "52px",
            "font-weight": "800",
            "line-height": "1.08",
        }),
    }));

    upsert("text-paragraph", asBlock("Paragrafo", "Texto", {
        type: "text",
        tagName: "p",
        content: "Paragrafo descritivo para comunicar seu produto.",
        attributes: { "data-dc-type": "paragraph" },
        style: withAbsoluteStyle({
            width: "500px",
            height: "auto",
            margin: "0",
            color: "#6d28d9",
            "font-size": "16px",
            "line-height": "1.6",
        }),
    }));

    upsert("text-editable", asBlock("Texto editavel", "Texto", {
        type: "text",
        tagName: "div",
        content: "Clique duas vezes para editar este texto.",
        attributes: { "data-dc-type": "editable-text" },
        style: withAbsoluteStyle({
            width: "340px",
            height: "auto",
            padding: "12px 14px",
            color: "#4c1d95",
            "font-size": "15px",
            "background-color": "#ffffff",
            border: "1px solid #c4b5fd",
            "border-radius": "12px",
        }),
    }));
}
