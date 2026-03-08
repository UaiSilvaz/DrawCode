# Relatorio da Ferramenta "Gerar com IA"

## Objetivo atual

O botao `Gerar com IA` tenta transformar o que existe no painel branco de edicao do builder em um preview funcional de site, bloqueando temporariamente a edicao e exibindo uma tela de carregamento.

O comportamento esperado pelo usuario e:

- Ler apenas o que esta dentro do wrapper branco do GrapesJS.
- Preservar com fidelidade a posicao, tamanho, cor e estilo dos elementos.
- Mostrar um preview funcional do site no proprio canvas.
- Exibir tambem o codigo gerado em abas como `HTML`, `CSS`, `JS`, `React` e `Backend`.
- No futuro, interpretar desenhos de lapis como sugestoes de componentes melhores.

## Estado real da implementacao hoje

Hoje a funcionalidade nao esta mais usando um modelo de IA para reconstruir o layout principal.

Motivo:

- Quando a geracao dependia do modelo, o resultado era inconsistente para casos que exigiam fidelidade 1:1.
- Para corrigir isso, a rota foi alterada para reconstruir o preview diretamente a partir dos elementos capturados do wrapper branco.

Em outras palavras:

- O nome da funcao e da UI ainda fala em IA.
- Mas a reconstrucao visual atual e deterministica.
- A "IA" de verdade ainda nao esta sendo usada para reinterpretar desenhos livres nem para gerar uma versao mais inteligente do layout.

Isso precisa ficar claro para qualquer outra IA que for continuar a implementacao.

## Fluxo atual ponta a ponta

### 1. Clique no botao

Arquivo:

- `src/screens/Grape/web-builder/WebBuilderScreen.tsx`

Ponto principal:

- `handleGenerateAi()` por volta da linha 693

O clique faz o seguinte:

- Seta `aiGenerating = true`
- Limpa `aiPreview`
- Mostra mensagem de status
- Captura um snapshot do canvas
- Envia um `POST` para `/api/ai/generate`
- Recebe um objeto `output`
- Salva esse objeto em `aiPreview`
- Abre o painel de preview sobre o canvas

### 2. Captura do painel branco

Arquivo:

- `src/screens/Grape/web-builder/WebBuilderScreen.tsx`

Ponto principal:

- `captureCanvasSnapshot()` por volta da linha 568

O que essa rotina faz:

- Acessa o `document` do iframe do GrapesJS
- Procura o wrapper branco via seletor:
  - `[data-gjs-type="wrapper"]`
- Calcula `wrapperBounds`
  - `width`
  - `height`
- Serializa cada filho direto do wrapper em `wrapperElements`

Cada elemento serializado inclui:

- `id`
- `tagName`
- `type`
- `text`
- `html`
- `position.x`
- `position.y`
- `size.width`
- `size.height`
- `style.display`
- `style.position`
- `style.backgroundColor`
- `style.color`
- `style.fontSize`
- `style.fontWeight`
- `style.borderRadius`
- `style.borderWidth`
- `style.borderColor`
- `style.borderStyle`
- `style.opacity`
- `style.boxShadow`
- `style.transform`
- `style.zIndex`
- `attributes`
- `children`

Importante:

- Antes havia um erro aqui.
- A posicao estava sendo calculada em relacao ao `body` do iframe.
- Isso foi corrigido para usar o retangulo do wrapper branco como referencia.
- Portanto, hoje `x/y` representam a posicao relativa ao painel branco, nao ao body inteiro.

### 3. Chamada da rota

Arquivo:

- `src/screens/Grape/web-builder/WebBuilderScreen.tsx`

Payload enviado hoje:

- `projectName`
- `html`
- `css`
- `canvasDocumentHtml`
- `canvasBodyHtml`
- `wrapperHtml`
- `wrapperBounds`
- `wrapperElements`
- `canvasStructure`
- `pages`
- `sketchHints`

Observacao:

- Nem todos esses campos sao usados pela rota atual.
- Os campos realmente importantes hoje sao `wrapperBounds`, `wrapperElements`, `wrapperHtml`, `css` e `projectName`.

### 4. Rota de geracao

Arquivo:

- `src/app/api/ai/generate/route.ts`

Pontos principais:

- `requestSchema` por volta da linha 64
- `buildPreviewHtml()` por volta da linha 224
- `buildPreviewCss()` por volta da linha 226
- `buildReactCode()` por volta da linha 269
- `buildBackendCode()` por volta da linha 293
- `POST()` por volta da linha 303

O que a rota faz hoje:

- Valida o payload com `zod`
- Recebe `wrapperElements`
- Monta um HTML novo com cada elemento posicionado de forma absoluta
- Monta um CSS base para o preview
- Empacota isso como:
  - `preview.html`
  - `preview.css`
  - `preview.js`
  - `code.html`
  - `code.css`
  - `code.js`
  - `code.react`
  - `code.backend`

Resumo tecnico importante:

- A rota atual nao chama OpenAI.
- A rota atual nao usa AI SDK.
- A rota atual gera uma reconstrucao deterministicamente.

### 5. Exibicao no canvas

Arquivo:

- `src/screens/Grape/builder-blocks/BuilderCanvasArea.tsx`

Pontos principais:

- `previewSrcDoc` por volta da linha 103
- overlay `draw-ai-stage` por volta da linha 171

Comportamento:

- Enquanto `aiGenerating` e `true`, aparece um overlay de carregamento
- O usuario fica impedido de editar o canvas branco
- Quando `aiPreview` chega, o canvas mostra um painel com abas:
  - `Preview`
  - `HTML`
  - `CSS`
  - `JS`
  - `React`
  - `Backend`
- O preview e renderizado em um `iframe` com `srcDoc`

## Estado do armazenamento da feature

Arquivo:

- `src/screens/Grape/web-builder/hooks/useEditorState.ts`

Estados principais:

- `aiOutput`
- `aiGenerating`
- `aiPreview`

Tipo de retorno esperado:

Arquivo:

- `src/screens/Grape/builder-blocks/types.ts`

Tipo:

- `AIGenerationResult`

## Problemas ja encontrados e corrigidos

### 1. Coordenadas erradas

Problema:

- A captura dos elementos usava o `body` como base de calculo.

Impacto:

- Os elementos ficavam deslocados quando eram recriados.

Correcao:

- O calculo passou a ser relativo ao wrapper branco.

### 2. Dependencia excessiva do modelo para layout exato

Problema:

- O modelo inventava secoes, mudava escala ou perdia fidelidade visual.

Impacto:

- O preview nao representava fielmente o canvas branco.

Correcao:

- A rota passou a reconstruir diretamente os elementos do wrapper.

### 3. Preview tentando abrir CSS como rota

Sintoma observado nos logs:

- Varias entradas como `GET /* { box-sizing ... } 404`

Impacto:

- Indicio de montagem incorreta do preview em algum estado anterior da implementacao.

Estado atual:

- Esse sintoma deixou de ser o caminho principal apos a reestruturacao da rota e do `srcDoc`.

## Limitacoes atuais

Estas sao as limitacoes mais importantes da ferramenta hoje:

### 1. Nao ha IA real na reconstrucao principal

Apesar do nome do botao e do fluxo, a parte principal hoje nao usa modelo.

### 2. Desenhos com lapis nao sao reinterpretados de forma inteligente

Hoje o sistema:

- preserva o desenho como parte visual
- informa algo em `interpretedSketch`

Mas ele ainda nao:

- converte rabisco em componente semanticamente melhor
- detecta que um rabisco parece um `card`, `hero`, `button`, `navbar`, etc.

### 3. A serializacao ainda e superficial para alguns tipos complexos

Exemplos de risco:

- elementos com pseudo-elementos
- layouts dependentes de CSS externo complexo
- componentes do GrapesJS com comportamento customizado
- elementos que dependem de eventos ou scripts

### 4. O HTML de filhos nao e recomposto semanticamente

Hoje a rota usa muito `innerHTML` e estilo inline.

Isso ajuda a fidelidade visual, mas piora:

- semanticidade
- manutenibilidade
- exportacao limpa para projeto real

### 5. O backend gerado e apenas placeholder

`code.backend` hoje e so um stub simples.

Nao ha inferencia real de requisitos backend.

## O que outra IA precisa saber para melhorar isso

Se outra IA for continuar o trabalho, ela precisa partir destes fatos:

### 1. Separar fidelidade visual de interpretacao inteligente

Hoje existe uma necessidade dupla:

- modo `reconstrucao fiel`
- modo `aprimoramento inteligente`

Esses dois objetivos nao devem ficar misturados na mesma chamada.

Arquitetura sugerida:

1. Etapa 1: reconstruir fielmente o wrapper
2. Etapa 2: opcionalmente pedir a uma IA melhorias semanticas sobre essa base

### 2. Usar o wrapper branco como unica fonte de verdade visual

A IA nao deve:

- inferir layout a partir da pagina toda
- usar elementos fora do wrapper
- inventar secoes sem lastro no wrapper

### 3. Usar IA apenas onde ela agrega valor

Melhores usos para IA nesse projeto:

- interpretar rabiscos de lapis
- sugerir composicoes melhores
- converter blocos visuais em componentes React semanticos
- sugerir backend so quando existir evidencia no layout ou no prompt do usuario

Nao usar IA para:

- copiar `x/y/width/height/color` de um retangulo simples

### 4. Criar um schema intermediario mais rico

Hoje `wrapperElements` ja ajuda bastante, mas outra IA pode melhorar isso incluindo:

- `textAlign`
- `padding`
- `margin`
- `fontFamily`
- `lineHeight`
- `letterSpacing`
- `backgroundImage`
- `src` normalizado para imagens
- `href` normalizado para links
- `children` usados de fato na renderizacao
- classificacao semantica por elemento

### 5. Criar dois outputs distintos

Hoje tudo sai no mesmo pacote.

O ideal seria separar:

- `faithfulPreview`
- `enhancedPreview`
- `semanticTree`
- `exportCode`

## Proposta tecnica para proxima versao

### Etapa A. Manter o preview fiel deterministico

Objetivo:

- Garantir que o usuario sempre veja um preview 1:1 do que desenhou no painel branco

Isso ja esta parcialmente resolvido.

### Etapa B. Adicionar IA de verdade em uma segunda rota

Nova rota sugerida:

- `/api/ai/enhance-layout`

Entrada:

- `wrapperElements`
- `wrapperBounds`
- `wrapperHtml`
- `sketchHints`
- opcionalmente screenshot do wrapper

Saida sugerida:

- descricao estruturada dos componentes detectados
- proposta de layout semantico
- codigo React refatorado
- sugestoes de UX/UI

### Etapa C. Tratar desenho livre como visao computacional leve + LLM

Fluxo sugerido:

1. Detectar bounding boxes de `freehand-path`
2. Gerar uma descricao textual da regiao
3. Enviar isso para o modelo junto com os elementos proximos
4. Pedir inferencia do tipo de componente

Exemplos:

- rabisco retangular com titulo e linhas dentro pode virar `card`
- rabisco grande no topo pode virar `hero`
- serie de linhas horizontais pode virar `navbar`

### Etapa D. Melhorar o export de codigo

Hoje o HTML usa estilo inline para fidelidade.

Melhorias sugeridas:

- extrair estilos repetidos para classes
- separar componentes React por arquivo
- gerar estrutura JSX real em vez de `dangerouslySetInnerHTML`
- gerar backend apenas se o layout indicar formulario, autenticacao, dashboard, CRUD ou dados dinamicos

## Resumo executivo para outra IA

Use este resumo se quiser colar algo menor:

> Existe um builder visual com canvas branco baseado em GrapesJS. O botao "Gerar com IA" captura o wrapper branco via `[data-gjs-type="wrapper"]`, serializa seus filhos em `wrapperElements` com posicao, tamanho e estilos computados, e envia isso para `/api/ai/generate`. No estado atual, essa rota nao usa modelo de IA; ela reconstrui deterministicamente um preview 1:1 em HTML/CSS absoluto para preservar fidelidade visual. O objetivo futuro e manter essa reconstrucao fiel como etapa base e adicionar uma segunda etapa realmente inteligente para interpretar desenhos de lapis, sugerir componentes semanticos, gerar React mais limpo e inferir backend quando fizer sentido. O principal problema ja corrigido foi o calculo errado de coordenadas em relacao ao `body` em vez do wrapper branco. As proximas melhorias devem separar claramente "preview fiel" de "aprimoramento por IA".

## Arquivos principais

- `src/screens/Grape/web-builder/WebBuilderScreen.tsx`
- `src/screens/Grape/builder-blocks/BuilderCanvasArea.tsx`
- `src/app/api/ai/generate/route.ts`
- `src/screens/Grape/web-builder/hooks/useEditorState.ts`
- `src/screens/Grape/builder-blocks/types.ts`
- `src/screens/Grape/web-builder/builder-core.ts`
