<!--cd DrawCode; npm run dev-->

# Template Figma – Draw Code (todas as telas)

Use este documento para montar o template do projeto **Draw Code** no Figma. Cada tela está descrita com seções, textos e componentes.

**Sugestão de frames:** Desktop 1440×900 px; Mobile 375×812 px.

---

## Design system (referência do código)

### Cores principais

| Uso                                    | Valor (Tailwind/hex)                            |
| -------------------------------------- | ----------------------------------------------- |
| Gradiente primário (botões, destaques) | `from-fuchsia-500 via-purple-600 to-indigo-600` |
| Fundo escuro                           | `#0f0f0f` (--color-dark)                        |
| Fundo claro                            | `#f8f9fa`                                       |
| Texto escuro                           | `gray-900`                                      |
| Texto secundário                       | `gray-600` / `gray-300` (dark)                  |
| Card/input dark                        | `gray-800`                                      |
| Footer                                 | `gray-900`                                      |
| Roxo destaque                          | `purple-500` / `purple-600`                     |

### Tipografia

- **Títulos:** bold, 4xl–5xl (Desktop), 2xl–4xl (mobile)
- **Subtítulos/body:** text-base a text-xl
- **Fontes:** Geist Sans, Geist Mono (conforme `globals.css`)

### Componentes reutilizáveis

- Botão primário: gradiente fuchsia→purple→indigo, rounded-2xl, sombra roxa
- Botão secundário: texto cinza, hover azul
- Cards: `rounded-xl`, fundo gray-50 / gray-800 (dark)
- Inputs: `rounded-lg`, border gray-300, focus ring blue-500

---

## Tela 1 – Início (Landing)

**Rota:** `/`  
**Frame sugerido:** 1440×~3500 px (uma coluna, scroll)

### 1.1 Cabeçalho (fixo no topo)

- **Logo:** ícone (IconD.png) + texto "Draw Code"
- **Nav (desktop):** Inicio | Funções | Preços | Depoimentos | Contato (âncoras)
- **Ações:** link "Cadastrar" | botão "Login" (gradiente)
- **Estilo:** fundo branco/80 + blur, borda inferior cinza

### 1.2 Hero / Topo

- **Fundo:** efeito Silk (ondas/visual)
- **Texto:** "Bem-vindo ao"
- **Logo grande:** imagem `/draw.png` (Draw Code)
- **Descrição:** "Tornar o aprendizado de Front-End simples, visual e acessível, ajudando iniciantes a criar HTML, CSS e JavaScript sem complicação."
- **CTAs:** botão "Login" (gradiente) | botão "Cadastrar" (outline ou secundário)

### 1.3 Características (Funções)

- **Título:** "Características" (ou título que estiver no código)
- **Subtítulo:** texto sobre funcionalidades
- **Grid de cards (6 itens):**
  1. **Editor Visual de Layouts** – ícone paintbrush – "Crie interfaces de forma visual, arrastando elementos e montando layouts sem escrever código."
  2. **Geração Automática de Código** – ícone monitor – "Transforme seus layouts em código HTML, CSS e JavaScript em tempo real."
  3. **Assistente com IA** – ícone robo – "Receba sugestões inteligentes para melhorar seu código e aprender boas práticas de Front-End."
  4. **Aprendizado Prático** – ícone reading-book – "Aprenda Front-End na prática, vendo o código nascer conforme você constrói o layout."
  5. **Edição e Visualização em Tempo Real** – ícone hourglass – "Edite, teste e visualize suas alterações instantaneamente, sem recarregar a página."
  6. **Exportação e Compartilhamento** – ícone globalization – "Exporte seus projetos ou compartilhe com outros usuários para estudar e evoluir."

### 1.4 Preços

- **Título:** "Preços" (ou equivalente)
- **Subtítulo:** breve descrição
- **3 cards de plano:**
  - **Inicial:** R$0/mês – IA Scanner Ilimitado, 100 Projetos Iniciais, Suporte Básico, Community Access
  - **Pro (destacado):** R$9/mês – IA Scanner Ilimitado, 10000 Projetos, Suporte 24hrs, Elementos Premium, Customizações Avançadas
  - **Mestre:** R$99/ano – IA Scanner Ilimitado, Projetos Ilimitados, Suporte 24hrs, Elementos Premium, Customizações Avançadas
- **CTA em cada card:** "Escolher plano" / "Assinar"

### 1.5 Depoimentos

- **Título:** "O que nossos usuários dizem"
- **Subtítulo:** "Junte-se a quem está transformando layouts em código real com o DRAW CODE."
- **3 cards de depoimento:**
  - **Luis Felipe Guedes** – Técnico em Informática to intern @ Etec – texto do depoimento (LF no avatar)
  - **Júlia Linda Rufato** – Técnico em Informática to intern @ ETEC – texto (JU)
  - **Emanuel da Mata Brandrão** – Desocupado @ ETEC – texto (EM)

### 1.6 Tecnologias (Clientes)

- **Título:** "Tecnologias Utilizadas"
- **Subtítulo:** "Tecnologias que possibilitaram o desenvolvimento do Draw Code"
- **Logos em loop/carrossel:** React, Next.js, TypeScript, Tailwind CSS (ícones SiReact, SiNextdotjs, SiTypescript, SiTailwindcss)

### 1.7 Contato

- **Título:** "Entre em contato"
- **Subtítulo:** "Pronto para começar a criar? Entre em contato com nossa equipe para suporte e orientação."
- **Formulário:** Primeiro Nome (placeholder "John") | Último Nome ("Doe") | Email ("john@example.com") | Mensagem (textarea "Tell us about your project...") | botão "Enviar Mensagem"

### 1.8 Rodapé

- **Coluna 1–2:** Logo Draw Code + descrição ("Tornar o aprendizado de Front-End simples, visual e acessível...") + ícones redes (X, Instagram, Facebook)
- **Coluna 3 – Product:** Features, Pricing, Draw Code DOCS, Integrations
- **Coluna 4 – Company:** About, Blog, Careers, Contact
- **Barra inferior:** "© 2026 Draw Code. Todos direitos reservados."

---

## Tela 2 – Login

**Rota:** `/login`  
**Frame sugerido:** 1440×900 px (modal centralizado) ou 375×812 (mobile)

### Conteúdo

- **Fundo:** efeito glow
- **Badge:** 3 avatares + "Junte-se à comunidade de 1m+ criadores"
- **Título:** "Bem-vindo(a) de volta" + "Faça login na sua conta"
- **Texto:** "Acesse seu painel de controle e continue criando designs incríveis. Insira suas credenciais abaixo."
- **Card central:**
  - Botão fechar (✕) se for modal
  - "Login com" + botões: Google, X, Facebook
  - Divisor: "ou faça login com email"
  - Campo **Email** (placeholder "seu@email.com")
  - Campo **Senha** (placeholder "Digite sua senha") + ícone mostrar/ocultar senha
  - Texto: "Ao fazer login, você concorda com nossos **Termos** e **Política de Privacidade**."
  - Botão **Login**
  - "Não tem uma conta? **Cadastre-se aqui**"

---

## Tela 3 – Cadastro

**Rota:** mesma do Login, modo "signup"  
**Frame sugerido:** 1440×900 px ou 375×812 px

### Conteúdo

- **Fundo:** glow (igual Login)
- **Badge:** 3 avatares + "Junte-se a comunidade de 1m+ criadores"
- **Título:** "Crie sua conta" + "e comece a criar designs incríveis"
- **Texto:** "Preencha os dados abaixo para criar sua conta e acessar todas as ferramentas do DrawCode."
- **Card central (formulário):**
  - Botão fechar (✕) se modal
  - Campos: Nome de usuário, Email, Senha, Confirmar senha (com mostrar/ocultar)
  - Termos e política
  - Botão **Cadastrar**
  - "Já tem uma conta? **Faça login**"

---

## Tela 4 – Grape (Web Builder)

**Rota:** `/grape`  
**Frame sugerido:** 1440×900 px (layout cheio)

### Layout

- **Sidebar esquerda:** painel de **Blocos** (blocks) – área "Blocks" do editor
- **Área central:** **Canvas** de edição (GrapeJS) – área em branco onde se arrastam componentes
- **Dock inferior (opcional):** ícones Home, Archive, Profile, Settings (estilo macOS)
- **Sidebar direita:** 3 painéis empilhados – **Styles** (estilos), **Traits** (atributos), **Layers** (camadas)

### Elementos visuais

- Barra lateral esquerda: lista de blocos (elementos e layouts)
- Canvas: retângulo grande representando a página editável
- Barra direita: abas ou seções para Styles, Traits, Layers
- Cores do builder: fundo escuro/claro conforme `ui.css` do Grape

---

## Resumo – lista de frames para o Figma

| #   | Nome do frame            | Descrição              | Tamanho sugerido    |
| --- | ------------------------ | ---------------------- | ------------------- |
| 1   | Início – Cabeçalho       | Nav + logo + CTAs      | 1440×80             |
| 2   | Início – Hero            | Topo + CTAs            | 1440×700            |
| 3   | Início – Características | 6 cards                | 1440×900            |
| 4   | Início – Preços          | 3 planos               | 1440×700            |
| 5   | Início – Depoimentos     | 3 depoimentos          | 1440×600            |
| 6   | Início – Tecnologias     | Logos React/Next/etc   | 1440×400            |
| 7   | Início – Contato         | Formulário             | 1440×700            |
| 8   | Início – Rodapé          | Links + redes          | 1440×350            |
| 9   | Login                    | Modal/card login       | 1440×900 ou 600×800 |
| 10  | Cadastro                 | Modal/card cadastro    | 1440×900 ou 600×800 |
| 11  | Grape Web Builder        | Layout completo editor | 1440×900            |

---

## Como usar este brief no Figma

1. Crie um novo arquivo ou duplique um template de UI.
2. Crie uma **página** "Draw Code" e dentro dela os **frames** da tabela acima.
3. Use **Componentes** para: Botão primário, Botão secundário, Card, Input, Cabeçalho, Rodapé.
4. Cole os **textos** deste documento nos textos do Figma para manter fidelidade ao produto.
5. Aplique as **cores e tipografia** do Design system no início do documento.
6. (Opcional) Crie variantes **Desktop** e **Mobile** para as telas Login, Cadastro e Início (hero + nav).

Se quiser, depois de montar os frames você pode usar o **Figma to Code** ou o **Dev Mode** do Figma para alinhar ainda mais com o código do projeto.
