# Estrutura do Projeto DrawCode

Este documento descreve a organizacao atual sem mudar as rotas publicas do Next.js.

## Pastas Principais

| Pasta | Responsabilidade |
| --- | --- |
| `src/app` | Rotas do Next.js, paginas e API routes. As URLs do sistema ficam aqui. |
| `src/app/api` | Backend da aplicacao em API Routes/server functions. |
| `src/components` | Componentes reutilizaveis e componentes globais de layout/UI. |
| `src/context` | Contextos React compartilhados. |
| `src/lib` | Infraestrutura e servicos internos do app. |
| `src/screens` | Telas e experiencias maiores: landing, login, cadastro e editor. |
| `src/__tests__` | Testes automatizados. |
| `prisma` | Schema, migrations e seeds do banco. |
| `public` | Imagens e arquivos estaticos servidos pela aplicacao. |
| `docs` | Documentacao tecnica e requisitos. |

## Organizacao de `src/lib`

| Pasta/arquivo | Responsabilidade |
| --- | --- |
| `src/lib/auth` | Configuracao NextAuth e helpers de senha/usuario. |
| `src/lib/db` | Cliente Prisma e acesso ao banco. |
| `src/lib/ai` | Tipos e geracao de preview/codigo. Esta e a area preparada para a IA real. |
| `src/lib/utils.ts` | Utilitarios gerais de UI/classes. |
| `src/lib/auth-helpers.ts` | Reexport de compatibilidade para imports antigos. |
| `src/lib/prisma.ts` | Reexport de compatibilidade para imports antigos. |

## Backend

O backend nao fica em uma pasta separada chamada `backend`. Ele esta em `src/app/api`:

- `src/app/api/auth/register/route.ts`: cadastro.
- `src/app/api/auth/[...nextauth]/route.ts`: NextAuth.
- `src/app/api/users/me/route.ts`: usuario autenticado.
- `src/app/api/grape/save/route.ts`: salvar/listar projetos.
- `src/app/api/ai/generate/route.ts`: endpoint de preview/codigo.

## Preparacao Para IA

A rota `/api/ai/generate` agora fica fina e delega a logica para:

- `src/lib/ai/agent.ts`
- `src/lib/ai/preview-generator.ts`
- `src/lib/ai/semantic-analyzer.ts`
- `src/lib/ai/code-generator.ts`
- `src/lib/ai/types.ts`

Isso deixa o caminho pronto para uma segunda etapa de IA sem misturar controller HTTP com regra de geracao. A documentacao especifica do agente fica em `docs/AI_AGENT.md`.
