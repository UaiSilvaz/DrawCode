# Modelagem de Requisitos do Sistema - DrawCode

Data do levantamento: 2026-05-03  
Base analisada: codigo-fonte, schema Prisma, rotas Next.js, telas, hooks do editor, testes e documentacao existente do repositorio.

## 1. Visao Geral

O DrawCode e uma aplicacao web para criar paginas de front-end de forma visual. O sistema combina uma landing page publica, autenticacao de usuarios, dashboard de projetos e um editor visual baseado em GrapesJS. No editor, o usuario pode inserir blocos, desenhar formas, organizar paginas, salvar projetos, importar/exportar JSON e gerar um preview com codigo React, CSS, HTML e JS.

O objetivo principal do produto e tornar o aprendizado e a criacao de front-end mais simples, visual e acessivel para usuarios iniciantes ou criadores que desejam montar interfaces sem escrever codigo desde o inicio.

## 2. Escopo do Sistema

### 2.1 Dentro do Escopo Atual

- Apresentar o produto em uma landing page publica.
- Permitir cadastro de usuario com email e senha.
- Permitir login com credenciais e, opcionalmente, provedores sociais.
- Manter sessao autenticada com NextAuth.
- Proteger rotas de dashboard, editor e area administrativa.
- Exibir dashboard com projetos recentes e modelos visuais.
- Criar novo projeto visual.
- Editar layout em canvas fixo com GrapesJS.
- Inserir blocos de layout, formas, componentes, imagens e textos.
- Desenhar no canvas com lapis, linha, formas e titulo.
- Salvar projetos GrapesJS no banco de dados.
- Listar projetos salvos do usuario.
- Exportar e importar estrutura do projeto em JSON.
- Fazer upload de imagem para um elemento de imagem selecionado.
- Gerar preview e codigo a partir do conteudo do canvas.
- Reconhecer formas desenhadas e converter cada forma em elemento React/HTML individual.
- Aplicar o layout gerado diretamente no canvas do editor.
- Manter modelo de dados de usuarios, contas, sessoes e projetos.

### 2.2 Fora do Escopo Atual ou Parcialmente Implementado

- Fine-tuning real de modelo com base exportada.
- Publicacao automatica do site gerado.
- Publicacao/hospedagem do site criado pelo usuario.
- Compartilhamento ou colaboracao em tempo real.
- Exclusao, duplicacao persistida ou abertura por ID de projetos no dashboard.
- Recuperacao de senha.
- Confirmacao de email.
- Envio real do formulario de contato da landing page.
- Tela administrativa completa, apesar de existir protecao de rota para `/admin`.
- Pagamentos, planos e assinatura.

## 3. Stakeholders

- Visitante: pessoa que acessa a landing page para conhecer o DrawCode.
- Usuario autenticado: pessoa que cria, edita, salva e exporta projetos.
- Administrador: usuario com papel `ADMIN`, previsto para acessar areas administrativas.
- Equipe do produto: responsavel por manter conteudo, templates e evolucao do editor.
- Provedor OAuth: Google, Facebook ou Twitter/X, quando configurados por variaveis de ambiente.
- Banco de dados: PostgreSQL usado por Prisma para persistencia.
- Servico de geracao: rota interna responsavel por transformar o canvas em preview/codigo.

## 4. Atores do Sistema

| Ator | Descricao | Permissoes principais |
| --- | --- | --- |
| Visitante | Usuario nao autenticado | Ver landing page, abrir login/cadastro, iniciar cadastro ou login |
| Usuario | Usuario autenticado com role `USER` | Acessar dashboard, criar projeto, usar editor, salvar/listar projetos proprios, exportar/importar JSON |
| Administrador | Usuario autenticado com role `ADMIN` | Acessar rotas administrativas futuras e tambem funcionalidades de usuario |
| Provedor social | Sistema externo de autenticacao | Autenticar usuario quando variaveis OAuth estiverem configuradas |

## 5. Requisitos Funcionais

### 5.1 Landing Page e Navegacao Publica

| ID | Requisito | Status | Prioridade |
| --- | --- | --- | --- |
| RF-001 | O sistema deve exibir uma landing page publica com cabecalho, hero, caracteristicas, fundadores, depoimentos, clientes, contato e rodape. | Implementado | Alta |
| RF-002 | O cabecalho deve permitir navegacao suave para secoes internas da landing page. | Implementado | Media |
| RF-003 | A landing page deve exibir chamadas para login e cadastro. | Implementado | Alta |
| RF-004 | O sistema deve abrir modais globais de login ou cadastro a partir da landing page. | Implementado | Alta |
| RF-005 | Ao acessar `/login`, o sistema deve abrir a experiencia de login. | Implementado | Alta |
| RF-006 | Ao acessar `/register`, o sistema deve abrir a experiencia de cadastro. | Implementado | Alta |
| RF-007 | O formulario de contato deve coletar nome, email e mensagem na interface. | Parcial | Baixa |

Observacao sobre RF-007: o formulario existe visualmente, mas nao ha rota/API para envio ou persistencia.

### 5.2 Cadastro e Autenticacao

| ID | Requisito | Status | Prioridade |
| --- | --- | --- | --- |
| RF-008 | O sistema deve permitir cadastro com nome, email, senha e confirmacao de senha. | Implementado | Alta |
| RF-009 | O cadastro deve validar nome com no minimo 2 caracteres. | Implementado | Alta |
| RF-010 | O cadastro deve validar email em formato valido. | Implementado | Alta |
| RF-011 | O cadastro deve validar senha com no minimo 8 caracteres, pelo menos uma letra maiuscula e pelo menos um numero. | Implementado | Alta |
| RF-012 | O cadastro deve rejeitar senhas diferentes no campo de confirmacao. | Implementado | Alta |
| RF-013 | O sistema deve impedir cadastro com email ja existente. | Implementado | Alta |
| RF-014 | O sistema deve armazenar senha usando hash bcrypt. | Implementado | Alta |
| RF-015 | O sistema deve fazer login automatico apos cadastro bem-sucedido. | Implementado | Media |
| RF-016 | O sistema deve permitir login com email e senha. | Implementado | Alta |
| RF-017 | O sistema deve rejeitar login com email inexistente ou senha incorreta. | Implementado | Alta |
| RF-018 | O sistema deve exibir mensagem de erro quando login ou cadastro falhar. | Implementado | Alta |
| RF-019 | O sistema deve permitir login social com Google, Facebook e Twitter/X quando as credenciais estiverem configuradas. | Implementado condicional | Media |
| RF-020 | O sistema deve manter sessao do usuario com JWT e incluir `id` e `role` na sessao. | Implementado | Alta |
| RF-021 | O sistema deve permitir logout a partir do dashboard. | Implementado | Alta |
| RF-022 | O sistema deve aplicar limite simples de tentativas de cadastro por IP. | Implementado | Media |

### 5.3 Autorizacao e Protecao de Rotas

| ID | Requisito | Status | Prioridade |
| --- | --- | --- | --- |
| RF-023 | O sistema deve proteger `/dashboard` e redirecionar usuarios nao autenticados para `/login`. | Implementado | Alta |
| RF-024 | O sistema deve proteger `/grape` e redirecionar usuarios nao autenticados para `/login`. | Implementado | Alta |
| RF-025 | O sistema deve proteger rotas `/admin` para usuarios com role `ADMIN`. | Implementado no middleware | Media |
| RF-026 | O sistema deve redirecionar usuario nao administrador para `/dashboard` quando tentar acessar `/admin`. | Implementado no middleware | Media |
| RF-027 | O sistema deve preservar `callbackUrl` ao redirecionar para login. | Implementado | Media |

### 5.4 Dashboard

| ID | Requisito | Status | Prioridade |
| --- | --- | --- | --- |
| RF-028 | O sistema deve exibir dashboard apenas para usuario autenticado. | Implementado | Alta |
| RF-029 | O dashboard deve exibir informacoes basicas do usuario autenticado. | Implementado | Media |
| RF-030 | O dashboard deve listar projetos do usuario, ordenados por ultima atualizacao. | Implementado | Alta |
| RF-031 | O dashboard deve permitir busca textual nos projetos. | Implementado | Media |
| RF-032 | O dashboard deve exibir estado de carregamento enquanto busca projetos. | Implementado | Media |
| RF-033 | O dashboard deve exibir estado vazio quando nao houver projetos ou resultados. | Implementado | Media |
| RF-034 | O dashboard deve exibir aba de modelos editaveis. | Implementado | Media |
| RF-035 | O dashboard deve permitir busca textual nos modelos. | Implementado | Media |
| RF-036 | O dashboard deve permitir criar novo projeto navegando para `/grape`. | Implementado | Alta |
| RF-037 | O dashboard deve permitir iniciar editor a partir de um modelo via query `template`. | Parcial | Media |
| RF-038 | O dashboard deve permitir abrir menu de perfil e executar logout. | Implementado | Media |

Observacao sobre RF-037: a navegacao com `template` existe, mas nao foi localizada logica completa de aplicacao automatica do template no editor.

### 5.5 Editor Visual DrawCode/Grape

| ID | Requisito | Status | Prioridade |
| --- | --- | --- | --- |
| RF-039 | O sistema deve inicializar um editor visual em tela cheia com GrapesJS. | Implementado | Alta |
| RF-040 | O canvas do editor deve usar dimensoes base de 1320 x 860 pixels. | Implementado | Alta |
| RF-041 | O editor deve usar posicionamento absoluto para elementos inseridos no canvas. | Implementado | Alta |
| RF-042 | O editor deve disponibilizar grupos de blocos: layouts, formas, componentes, imagens e texto. | Implementado | Alta |
| RF-043 | O usuario deve poder inserir blocos clicando no painel lateral. | Implementado | Alta |
| RF-044 | O usuario deve poder arrastar blocos para o canvas. | Implementado | Alta |
| RF-045 | O editor deve selecionar automaticamente o elemento inserido. | Implementado | Media |
| RF-046 | O editor deve permitir editar estilos, traits e camadas pelo painel de propriedades do GrapesJS. | Implementado | Alta |
| RF-047 | O editor deve sincronizar uma estrutura JSON interna do canvas a cada alteracao relevante. | Implementado | Alta |
| RF-048 | O editor deve permitir ativar/desativar snap em grade de 8 pixels. | Implementado | Media |
| RF-049 | O editor deve aplicar snap em movimento, insercao ou ajuste quando habilitado. | Implementado | Media |
| RF-050 | O editor deve permitir zoom entre 30% e 200%. | Implementado | Media |
| RF-051 | O editor deve permitir reset de zoom para 100%. | Implementado | Media |
| RF-052 | O editor deve permitir pan do canvas. | Implementado | Media |
| RF-053 | O editor deve permitir desfazer e refazer acoes. | Implementado | Alta |
| RF-054 | O editor deve permitir deletar elemento selecionado. | Implementado | Alta |
| RF-055 | O editor deve permitir duplicar elemento selecionado. | Implementado | Media |
| RF-056 | O editor deve permitir agrupar elemento selecionado em um container. | Implementado | Baixa |
| RF-057 | O editor deve permitir mover elemento para frente ou para tras na ordem de camadas. | Implementado | Media |
| RF-058 | O editor deve exibir menu de contexto para acoes sobre elementos. | Implementado | Media |
| RF-059 | O editor deve permitir alternar entre painel de elementos, desenho e propriedades. | Implementado | Alta |

### 5.6 Ferramentas de Desenho

| ID | Requisito | Status | Prioridade |
| --- | --- | --- | --- |
| RF-060 | O editor deve disponibilizar ferramenta de selecao. | Implementado | Alta |
| RF-061 | O editor deve disponibilizar ferramenta de lapis para desenho livre. | Implementado | Alta |
| RF-062 | O editor deve disponibilizar ferramenta de linha. | Implementado | Alta |
| RF-063 | O editor deve disponibilizar ferramenta de quadrado/retangulo. | Implementado | Alta |
| RF-064 | O editor deve disponibilizar ferramenta de circulo/elipse. | Implementado | Alta |
| RF-065 | O editor deve disponibilizar ferramenta de triangulo. | Implementado | Media |
| RF-066 | O editor deve disponibilizar ferramenta de titulo/texto. | Implementado | Alta |
| RF-067 | O editor deve exibir pre-visualizacao durante o desenho antes de inserir o componente final. | Implementado | Media |
| RF-068 | O editor deve registrar desenhos como componentes persistiveis no canvas. | Implementado | Alta |
| RF-069 | O editor deve permitir atalhos `S`, `P`, `L`, `F` e `T` para selecao, lapis, linha, formas e texto. | Implementado | Media |

### 5.7 Paginas do Projeto

| ID | Requisito | Status | Prioridade |
| --- | --- | --- | --- |
| RF-070 | O editor deve manter uma lista de paginas do projeto. | Implementado | Media |
| RF-071 | O usuario deve poder criar nova pagina. | Implementado | Media |
| RF-072 | O usuario deve poder alternar entre paginas. | Implementado | Media |
| RF-073 | Ao alternar de pagina, o sistema deve preservar snapshot da pagina atual antes de carregar outra. | Implementado | Alta |

### 5.8 Persistencia de Projetos

| ID | Requisito | Status | Prioridade |
| --- | --- | --- | --- |
| RF-074 | O usuario autenticado deve poder salvar projeto informando nome e dados do editor. | Implementado | Alta |
| RF-075 | O sistema deve criar novo projeto quando `projectId` nao for enviado. | Implementado | Alta |
| RF-076 | O sistema deve atualizar projeto existente quando `projectId` pertencer ao usuario. | Implementado | Alta |
| RF-077 | O sistema deve impedir atualizacao de projeto inexistente ou pertencente a outro usuario. | Implementado | Alta |
| RF-078 | O sistema deve retornar erro 401 para usuario nao autenticado ao salvar/listar projetos. | Implementado | Alta |
| RF-079 | O sistema deve listar apenas projetos do usuario autenticado. | Implementado | Alta |
| RF-080 | O sistema deve validar nome do projeto com tamanho entre 1 e 100 caracteres. | Implementado | Media |
| RF-081 | O sistema deve persistir dados do projeto em campo JSON. | Implementado | Alta |

### 5.9 Importacao, Exportacao e Imagens

| ID | Requisito | Status | Prioridade |
| --- | --- | --- | --- |
| RF-082 | O editor deve exportar projeto em arquivo JSON. | Implementado | Alta |
| RF-083 | O JSON exportado deve incluir nome do projeto, data de exportacao, schema, paginas e pagina ativa. | Implementado | Media |
| RF-084 | O editor deve importar JSON com multiplas paginas. | Implementado | Alta |
| RF-085 | O editor deve importar JSON legado baseado em `schema` ou `elements`. | Implementado | Media |
| RF-086 | O editor deve exibir erro quando o JSON importado for invalido. | Implementado | Media |
| RF-087 | O usuario deve poder fazer upload de imagem para elemento de imagem selecionado. | Implementado | Alta |
| RF-088 | O sistema deve rejeitar upload de imagem quando nenhum elemento de imagem estiver selecionado. | Implementado | Media |

### 5.10 Geracao de Preview e Codigo

| ID | Requisito | Status | Prioridade |
| --- | --- | --- | --- |
| RF-089 | O editor deve permitir acionar a funcionalidade "Gerar com IA". | Implementado | Alta |
| RF-090 | O sistema deve capturar somente o wrapper branco do canvas como fonte visual principal. | Implementado | Alta |
| RF-091 | O sistema deve serializar filhos do wrapper com tag, tipo, texto, HTML, posicao, tamanho, estilos, atributos e filhos. | Implementado | Alta |
| RF-092 | O sistema deve enviar snapshot do canvas para `/api/ai/generate`. | Implementado | Alta |
| RF-093 | A rota de geracao deve validar payload com Zod. | Implementado | Alta |
| RF-094 | A rota de geracao deve reconstruir preview fiel com elementos posicionados de forma absoluta. | Implementado | Alta |
| RF-095 | A rota de geracao deve sanitizar tags e atributos perigosos. | Implementado | Alta |
| RF-096 | A rota de geracao deve retornar resumo, interpretacao de desenho, preview, codigo e recomendacoes. | Implementado | Alta |
| RF-097 | O editor deve exibir overlay de carregamento durante a geracao. | Implementado | Media |
| RF-098 | O editor deve bloquear a edicao visual enquanto o preview gerado estiver sobre o canvas. | Implementado | Media |
| RF-099 | O editor deve aplicar o resultado da IA diretamente no canvas, sem abrir modal de preview. | Implementado | Alta |
| RF-100 | O usuario deve continuar editando o layout gerado no proprio editor. | Implementado | Alta |
| RF-101 | O sistema deve reconhecer formas como linhas, retangulos, circulos, triangulos, textos, botoes, inputs, imagens e containers. | Implementado | Alta |
| RF-102 | Cada forma reconhecida deve virar um elemento individual no codigo gerado. | Implementado | Alta |
| RF-103 | Rabiscos feitos com lapis devem ser normalizados para formas reais quando possivel. | Implementado | Alta |
| RF-104 | O usuario deve editar o resultado usando as ferramentas normais do GrapesJS. | Implementado | Alta |
| RF-105 | O sistema deve exibir carregamento simples durante a transformacao por IA. | Implementado | Media |
| RF-106 | A API deve continuar retornando HTML, CSS, JS e React para exportacao futura. | Implementado | Media |

Observacao importante: a geracao tenta usar OpenAI quando `OPENAI_API_KEY` esta configurada. Caso contrario, ou em caso de erro/quota, o sistema usa fallback deterministico e mantem reconhecimento, aplicacao no canvas e codigo funcionando.

### 5.11 Dados do Usuario e Inicializacao

| ID | Requisito | Status | Prioridade |
| --- | --- | --- | --- |
| RF-107 | O sistema deve fornecer endpoint `/api/users/me` para retornar dados do usuario autenticado. | Implementado | Media |
| RF-108 | O endpoint `/api/users/me` deve retornar 401 quando nao houver usuario autenticado. | Implementado | Alta |
| RF-109 | O sistema deve prover seed com usuario admin e usuario de teste. | Implementado | Baixa |
| RF-110 | O sistema deve expor manifest PWA basico. | Implementado | Baixa |

## 6. Requisitos Nao Funcionais

| ID | Requisito | Categoria | Status |
| --- | --- | --- | --- |
| RNF-001 | O sistema deve usar TypeScript com configuracao strict. | Manutenibilidade | Implementado |
| RNF-002 | O sistema deve usar Next.js App Router para rotas, layouts e APIs. | Arquitetura | Implementado |
| RNF-003 | O sistema deve persistir dados relacionais em PostgreSQL via Prisma. | Persistencia | Implementado |
| RNF-004 | O sistema deve manter hash de senha com bcrypt e salt 12. | Seguranca | Implementado |
| RNF-005 | O sistema deve validar entradas de APIs com Zod. | Seguranca | Implementado |
| RNF-006 | O sistema deve impedir vazamento de senha em retornos de API. | Seguranca | Implementado |
| RNF-007 | O sistema deve proteger rotas sensiveis via middleware e validacao no servidor. | Seguranca | Implementado |
| RNF-008 | O sistema deve garantir que projetos so sejam alterados pelo proprio dono. | Seguranca | Implementado |
| RNF-009 | O sistema deve sanitizar markup gerado, removendo atributos de evento e URLs `javascript:`. | Seguranca | Implementado |
| RNF-010 | O sistema deve usar variaveis de ambiente para banco, segredo de autenticacao e credenciais OAuth. | Configuracao | Implementado |
| RNF-011 | O sistema deve funcionar com provedores sociais ausentes, mantendo login por credenciais. | Disponibilidade | Implementado |
| RNF-012 | O sistema deve usar feedback visual para carregamento, erro, sucesso e estados vazios. | Usabilidade | Implementado |
| RNF-013 | O editor deve isolar inicializacao do GrapesJS no client-side. | Compatibilidade SSR | Implementado |
| RNF-014 | Componentes pesados de interface devem ser carregados de forma adequada para reduzir conflito com SSR. | Performance | Parcial |
| RNF-015 | O sistema deve oferecer scripts para desenvolvimento, build, migracao, seed, lint e testes. | Operacao | Implementado |
| RNF-016 | O sistema deve possuir testes unitarios basicos para login e cadastro. | Qualidade | Implementado |
| RNF-017 | O sistema deve manter documentacao de inicializacao e diagramas UML. | Documentacao | Implementado |
| RNF-018 | O sistema deve usar Docker Compose para ambiente local PostgreSQL/Adminer. | Operacao | Implementado |
| RNF-019 | A interface deve ser responsiva nas paginas publicas e no dashboard. | Usabilidade | Implementado |
| RNF-020 | O sistema deve evitar salvar projetos quando o usuario nao estiver autenticado. | Seguranca | Implementado |

## 7. Regras de Negocio

| ID | Regra |
| --- | --- |
| RN-001 | Email de usuario deve ser unico. |
| RN-002 | Senha de cadastro deve ter no minimo 8 caracteres, uma letra maiuscula e um numero. |
| RN-003 | Senha nunca deve ser salva em texto puro. |
| RN-004 | Todo usuario criado pelo cadastro comum deve receber role `USER`. |
| RN-005 | Usuario admin deve possuir role `ADMIN`. |
| RN-006 | Projeto GrapesJS sempre pertence a um usuario. |
| RN-007 | Usuario so pode listar e alterar seus proprios projetos. |
| RN-008 | Projeto sem nome informado deve usar nome padrao `Sem titulo`. |
| RN-009 | A listagem de projetos deve priorizar projetos atualizados mais recentemente. |
| RN-010 | Rotas `/dashboard` e `/grape` exigem autenticacao. |
| RN-011 | Rotas `/admin` exigem autenticacao e role `ADMIN`. |
| RN-012 | Provedores sociais so devem ser ativados se `CLIENT_ID` e `CLIENT_SECRET` correspondentes existirem. |
| RN-013 | A geracao de preview deve considerar o wrapper branco como fonte principal da composicao. |
| RN-014 | A geracao atual deve preservar fidelidade visual antes de tentar melhorar semanticamente o layout. |
| RN-015 | A funcionalidade de preview deve gerar apenas codigo de interface; integracoes de dados devem ser implementadas separadamente nas rotas da aplicacao. |

## 8. Casos de Uso Textuais

### UC-01 - Cadastrar Usuario

- Ator principal: Visitante.
- Objetivo: criar conta no DrawCode.
- Pre-condicoes: visitante nao precisa estar autenticado.
- Fluxo principal:
  1. Visitante abre cadastro pela landing page ou rota `/register`.
  2. Sistema exibe formulario de cadastro.
  3. Visitante informa nome, email, senha e confirmacao.
  4. Sistema valida campos no cliente.
  5. Sistema envia dados para `/api/auth/register`.
  6. API valida campos no servidor.
  7. API verifica se email ja existe.
  8. API gera hash da senha e cria usuario.
  9. Sistema autentica o usuario automaticamente.
  10. Usuario e redirecionado ao dashboard.
- Fluxos alternativos:
  - Email invalido: sistema exibe erro.
  - Senha fraca: sistema exibe erro.
  - Email ja cadastrado: sistema retorna erro 409 e interface exibe mensagem.
  - Login automatico falha: sistema informa que a conta foi criada, mas login deve ser feito manualmente.
- Pos-condicoes: usuario criado e, se possivel, autenticado.

### UC-02 - Fazer Login

- Ator principal: Visitante.
- Objetivo: acessar conta existente.
- Pre-condicoes: usuario cadastrado.
- Fluxo principal:
  1. Visitante abre login pela landing page ou rota `/login`.
  2. Sistema exibe formulario de login.
  3. Visitante informa email e senha.
  4. Sistema envia credenciais ao NextAuth.
  5. NextAuth valida email, busca usuario e compara senha com bcrypt.
  6. Sistema cria sessao JWT.
  7. Usuario e redirecionado ao dashboard ou callback.
- Fluxos alternativos:
  - Email inexistente ou senha incorreta: sistema exibe erro.
  - Login social escolhido: sistema inicia fluxo OAuth se provedor estiver configurado.
- Pos-condicoes: sessao autenticada ativa.

### UC-03 - Acessar Dashboard

- Ator principal: Usuario.
- Objetivo: visualizar projetos e iniciar criacao.
- Pre-condicoes: usuario autenticado.
- Fluxo principal:
  1. Usuario acessa `/dashboard`.
  2. Sistema valida sessao no servidor.
  3. Dashboard carrega projetos via `/api/grape/save`.
  4. Sistema exibe projetos recentes e modelos.
  5. Usuario pesquisa, alterna abas ou inicia novo projeto.
- Fluxos alternativos:
  - Sem sessao: usuario e redirecionado para `/login`.
  - Sem projetos: sistema exibe estado vazio.
- Pos-condicoes: usuario escolhe projeto, modelo ou cria novo.

### UC-04 - Criar e Editar Projeto Visual

- Ator principal: Usuario.
- Objetivo: montar uma pagina visualmente.
- Pre-condicoes: usuario autenticado e editor aberto.
- Fluxo principal:
  1. Usuario acessa `/grape`.
  2. Sistema inicializa GrapesJS.
  3. Usuario escolhe bloco no painel lateral.
  4. Sistema insere bloco no canvas e seleciona o componente.
  5. Usuario move, redimensiona e altera propriedades.
  6. Sistema sincroniza schema interno do canvas.
  7. Usuario usa zoom, snap, undo/redo ou menu de contexto conforme necessario.
- Fluxos alternativos:
  - Usuario arrasta bloco: sistema insere o bloco no canvas.
  - Usuario usa ferramentas de desenho: sistema cria componentes SVG/div correspondentes.
- Pos-condicoes: canvas contem estrutura editada.

### UC-05 - Salvar Projeto

- Ator principal: Usuario.
- Objetivo: persistir projeto no banco.
- Pre-condicoes: usuario autenticado e editor inicializado.
- Fluxo principal:
  1. Usuario informa ou mantem nome do projeto.
  2. Usuario clica em salvar.
  3. Sistema captura componentes, estilos, HTML, CSS, schema, paginas e pagina ativa.
  4. Sistema envia dados para `/api/grape/save`.
  5. API valida sessao e payload.
  6. API cria novo projeto ou atualiza projeto existente do usuario.
  7. Sistema exibe mensagem de sucesso.
- Fluxos alternativos:
  - Usuario nao autenticado: sistema informa que e necessario login.
  - Projeto pertence a outro usuario ou nao existe: API retorna 404.
  - Payload invalido: API retorna 400.
- Pos-condicoes: projeto gravado em `grape_projects`.

### UC-06 - Exportar e Importar JSON

- Ator principal: Usuario.
- Objetivo: mover ou reaproveitar estrutura de projeto.
- Pre-condicoes: editor aberto.
- Fluxo principal de exportacao:
  1. Usuario clica em Export JSON.
  2. Sistema captura pagina atual e gera arquivo JSON.
  3. Navegador baixa o arquivo.
- Fluxo principal de importacao:
  1. Usuario clica em Import JSON.
  2. Usuario seleciona arquivo.
  3. Sistema le JSON e valida estrutura.
  4. Sistema carrega paginas ou schema no canvas.
  5. Sistema exibe mensagem de sucesso.
- Fluxo alternativo:
  - JSON invalido: sistema exibe mensagem de falha.
- Pos-condicoes: projeto exportado ou canvas atualizado.

### UC-07 - Gerar Preview e Codigo

- Ator principal: Usuario.
- Objetivo: transformar canvas em preview funcional e codigo.
- Pre-condicoes: editor inicializado.
- Fluxo principal:
  1. Usuario clica em "Gerar com IA".
  2. Sistema exibe estado de carregamento.
  3. Sistema captura wrapper branco e elementos filhos.
  4. Sistema envia snapshot para `/api/ai/generate`.
  5. API valida payload.
  6. API reconhece formas e gera componentes individuais.
  7. API retorna codigo, formas reconhecidas e recomendacoes.
  8. Sistema substitui os elementos do wrapper branco pelo layout gerado.
  9. Usuario edita o resultado normalmente no canvas.
- Fluxos alternativos:
  - Editor indisponivel: sistema exibe erro.
  - Payload invalido: API retorna erro 400.
  - Falha interna: API retorna erro 500.
- Pos-condicoes: o canvas passa a exibir o layout gerado pela IA.

### UC-08 - Fazer Logout

- Ator principal: Usuario.
- Objetivo: encerrar sessao.
- Pre-condicoes: usuario autenticado no dashboard.
- Fluxo principal:
  1. Usuario abre menu de perfil.
  2. Usuario aciona logout.
  3. Sistema chama `signOut`.
  4. Sistema redireciona para pagina inicial.
- Pos-condicoes: sessao encerrada.

## 9. Modelo de Dados Conceitual

### 9.1 Entidades

#### Usuario

Representa uma conta do DrawCode.

- id: identificador unico.
- name: nome opcional.
- email: email unico.
- emailVerified: data opcional de verificacao.
- image: avatar opcional.
- password: hash opcional para login por credenciais.
- role: `USER` ou `ADMIN`.
- createdAt: data de criacao.
- updatedAt: data de atualizacao.
- accounts: contas OAuth vinculadas.
- sessions: sessoes.
- grapeProjects: projetos criados pelo usuario.

#### Conta

Representa vinculo OAuth gerenciado pelo NextAuth.

- id.
- userId.
- type.
- provider.
- providerAccountId.
- expires_at.
- token_type.
- scope.
- refresh_token.
- access_token.
- id_token.
- session_state.

#### Sessao

Representa sessao persistida pelo modelo NextAuth, ainda que a configuracao atual use estrategia JWT.

- id.
- sessionToken.
- userId.
- expires.

#### Token de Verificacao

Representa token usado por fluxos do NextAuth.

- identifier.
- token.
- expires.

#### Projeto Grape

Representa um projeto visual salvo.

- id.
- userId.
- name.
- data: JSON com componentes, estilos, HTML, CSS, schema, paginas e pagina ativa.
- createdAt.
- updatedAt.

### 9.2 Relacionamentos

- Usuario 1:N Conta.
- Usuario 1:N Sessao.
- Usuario 1:N Projeto Grape.
- Conta N:1 Usuario com exclusao em cascata.
- Sessao N:1 Usuario com exclusao em cascata.
- Projeto Grape N:1 Usuario com exclusao em cascata.

## 10. Interfaces e Rotas

### 10.1 Paginas

| Rota | Descricao | Acesso |
| --- | --- | --- |
| `/` | Landing page publica | Publico |
| `/login` | Entrada de login/modal | Publico |
| `/register` | Entrada de cadastro/modal | Publico |
| `/dashboard` | Dashboard de usuario | Autenticado |
| `/grape` | Editor visual | Autenticado |
| `/admin/*` | Area administrativa futura | Admin |

### 10.2 APIs

| Metodo/Rota | Descricao | Autenticacao |
| --- | --- | --- |
| `POST /api/auth/register` | Cria usuario com email e senha | Publica com rate limit |
| `GET/POST /api/auth/[...nextauth]` | Handlers NextAuth | Conforme provedor |
| `GET /api/users/me` | Retorna dados do usuario logado | Autenticado |
| `GET /api/grape/save` | Lista projetos do usuario | Autenticado |
| `POST /api/grape/save` | Cria ou atualiza projeto | Autenticado |
| `POST /api/ai/generate` | Gera preview/codigo a partir do canvas | Interna pelo editor |

## 11. Matriz de Rastreabilidade

| Area | Requisitos principais | Arquivos relacionados |
| --- | --- | --- |
| Landing page | RF-001 a RF-007 | `src/app/page.tsx`, `src/screens/Inicio/components/*`, `src/context/ModalContext.tsx`, `src/components/GlobalModals.tsx` |
| Cadastro | RF-008 a RF-015 | `src/app/register/page.tsx`, `src/screens/Cadastro/index.tsx`, `src/app/api/auth/register/route.ts`, `src/lib/auth-helpers.ts` |
| Login e sessao | RF-016 a RF-022 | `src/app/login/page.tsx`, `src/screens/Login/index.tsx`, `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts` |
| Protecao de rotas | RF-023 a RF-027 | `src/middleware.ts`, `src/app/dashboard/page.tsx`, `src/app/grape/page.tsx` |
| Dashboard | RF-028 a RF-038 | `src/app/dashboard/page.tsx`, `src/app/dashboard/DashboardClient.tsx`, `src/app/api/grape/save/route.ts` |
| Editor visual | RF-039 a RF-059 | `src/screens/Grape/WebBuilder.tsx`, `src/screens/Grape/web-builder/WebBuilderScreen.tsx`, `src/screens/Grape/web-builder/initialization/editorInit.ts` |
| Blocos e desenho | RF-060 a RF-069 | `src/screens/Grape/blocks-elements.js`, `src/screens/Grape/builder-blocks/BuilderElementsSidebar.tsx`, `src/screens/Grape/web-builder/hooks/useKeyboardShortcuts.ts` |
| Paginas do editor | RF-070 a RF-073 | `src/screens/Grape/web-builder/WebBuilderScreen.tsx`, `src/screens/Grape/web-builder/hooks/useCanvasSync.ts` |
| Persistencia | RF-074 a RF-081 | `src/screens/Grape/web-builder/hooks/useSaveHandler.ts`, `src/app/api/grape/save/route.ts`, `prisma/schema.prisma` |
| Import/export/upload | RF-082 a RF-088 | `src/screens/Grape/web-builder/hooks/useFileHandlers.ts`, `src/screens/Grape/builder-blocks/BuilderToolbar.tsx` |
| Geracao de preview | RF-089 a RF-106 | `src/app/api/ai/generate/route.ts`, `src/screens/Grape/web-builder/WebBuilderScreen.tsx`, `src/screens/Grape/builder-blocks/BuilderCanvasArea.tsx` |
| Dados do usuario | RF-107 a RF-110 | `src/app/api/users/me/route.ts`, `prisma/seed.ts`, `public/manifest.json` |

## 12. Requisitos de Validacao e Criterios de Aceite

| ID | Criterio de aceite |
| --- | --- |
| CA-001 | Um visitante consegue abrir a landing page em `/` e acionar login/cadastro. |
| CA-002 | Um usuario consegue se cadastrar com senha forte e e redirecionado ao dashboard. |
| CA-003 | Um cadastro com email repetido retorna erro e nao cria novo usuario. |
| CA-004 | Um login com senha incorreta nao cria sessao. |
| CA-005 | Um usuario nao autenticado e redirecionado ao tentar acessar `/dashboard` ou `/grape`. |
| CA-006 | Um usuario autenticado consegue abrir o dashboard e visualizar seus projetos. |
| CA-007 | Um usuario consegue inserir bloco no editor por clique e por drag/drop. |
| CA-008 | Um usuario consegue desenhar forma ou linha e ver o elemento persistido no canvas. |
| CA-009 | Um usuario autenticado consegue salvar projeto e ver mensagem de sucesso. |
| CA-010 | Um usuario nao consegue atualizar projeto de outro usuario. |
| CA-011 | O JSON exportado pode ser reimportado sem perda estrutural critica. |
| CA-012 | O upload de imagem so funciona quando um elemento de imagem esta selecionado. |
| CA-013 | "Gerar com IA" transforma o conteudo do canvas em componentes editaveis. |
| CA-014 | O preview gerado usa posicoes relativas ao wrapper branco e nao ao body inteiro. |
| CA-015 | A rota de geracao rejeita payload invalido com erro 400. |
| CA-016 | Um rabisco circular feito com lapis vira um circulo real no canvas quando possivel. |

## 13. Riscos, Limitacoes e Pendencias

- A chamada OpenAI depende de quota e variaveis de ambiente; sem isso, o fallback deterministico e usado.
- O rate limit de cadastro e em memoria, portanto nao e adequado para ambiente distribuido ou serverless em escala.
- `AUTH_SECRET` possui fallback inseguro no codigo e deve ser obrigatorio em producao.
- A tela administrativa esta protegida, mas nao existe modulo administrativo completo.
- A query `template` do dashboard navega para o editor, mas a aplicacao efetiva do template precisa ser confirmada/evoluida.
- O formulario de contato nao envia dados.
- Nao ha endpoint de exclusao de projeto.
- Nao ha endpoint detalhado para abrir projeto salvo por ID.
- Os testes atuais cobrem partes de autenticacao, mas nao exercitam rotas reais ponta a ponta.
- A persistencia de sessao usa JWT, enquanto o schema contem tabelas padrao de sessao do NextAuth.
- O editor usa GrapesJS, que e pesado e exige cuidado com bundle, SSR e integracao React.

## 14. Sugestoes de Evolucao dos Requisitos

1. Criar requisito de abertura de projeto por ID a partir do dashboard.
2. Criar requisito de exclusao e renomeacao de projeto no dashboard.
3. Criar requisito de aplicacao real de templates ao abrir `/grape?template=...`.
4. Criar rotina de avaliacoes para comparar prompt, fallback e futuro fine-tuning.
6. Criar requisito de publicacao/exportacao completa do site criado.
7. Criar envio real do formulario de contato.
8. Criar recuperacao de senha e verificacao de email.
9. Tornar `AUTH_SECRET` obrigatorio em producao.
10. Trocar rate limit em memoria por solucao persistente ou distribuida.

## 15. Glossario

- DrawCode: nome do sistema.
- GrapesJS: biblioteca usada para editor visual.
- Canvas: area branca onde os elementos do site sao montados.
- Wrapper branco: elemento raiz do canvas usado como fonte de verdade para geracao.
- Schema do canvas: representacao JSON simplificada dos elementos visuais.
- Projeto Grape: projeto salvo no banco com dados do editor.
- Preview fiel: reconstrucao visual baseada em posicoes, tamanhos e estilos do canvas.
- IA real: uso de modelo para interpretar desenhos, gerar componentes semanticos e melhorar codigo.
