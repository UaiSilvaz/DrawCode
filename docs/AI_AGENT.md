# DrawCode AI Agent

O agente de IA transforma o canvas visual do editor em um site gerado principalmente em React + CSS. HTML, CSS e JS continuam disponiveis como export secundario. Cada forma reconhecida vira um elemento individual editavel.

## Variaveis de Ambiente

Configure no `.env.local` ou na Vercel:

```env
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-5.2"
```

`OPENAI_API_KEY` deve ficar somente nas variaveis de ambiente do servidor. O frontend chama `/api/ai/generate`; a rota server-side chama a OpenAI sem expor a chave no navegador.

Se `OPENAI_API_KEY` nao estiver configurada, o sistema usa fallback deterministico e nao quebra.

## Fluxo

1. `WebBuilderScreen.tsx` captura o wrapper branco do canvas.
2. A rota `src/app/api/ai/generate/route.ts` valida o payload.
3. `src/lib/ai/agent.ts` tenta chamar a OpenAI Responses API.
4. A resposta precisa seguir a arvore semantica validada por Zod.
5. `src/lib/ai/shape-recognizer.ts` detecta retangulos, circulos, linhas, triangulos, textos, inputs, botoes, imagens e containers.
6. `src/lib/ai/shape-code-generator.ts` gera React + CSS como saida principal e HTML, CSS e JS como export secundario.
7. O painel do editor exibe Preview IA, Editor, Treinamento, React, CSS, HTML, JS, Semantica e Preview fiel.
8. Feedbacks de aceitar, rejeitar e corrigir sao salvos no `localStorage` como base local de treinamento.

## Camadas

| Arquivo | Responsabilidade |
| --- | --- |
| `src/lib/ai/preview-generator.ts` | Preview fiel e schema de entrada da rota. |
| `src/lib/ai/agent.ts` | Orquestra OpenAI, validacao e fallback. |
| `src/lib/ai/semantic-schema.ts` | Schemas da arvore semantica. |
| `src/lib/ai/semantic-analyzer.ts` | Interpretacao local quando nao ha API key ou quando a IA falha. |
| `src/lib/ai/code-generator.ts` | Gera React + CSS e exports secundarios. |
| `src/lib/ai/shape-recognizer.ts` | Reconhece formas desenhadas e calcula confianca/metrica. |
| `src/lib/ai/shape-code-generator.ts` | Gera codigo sincronizado a partir das formas editaveis. |
| `src/screens/Grape/builder-blocks/AIPreviewPanel.tsx` | Preview, editor em tempo real, metricas e treinamento local. |
| `src/lib/ai/types.ts` | Tipos compartilhados. |

## Estrategia Para o TCC

A arquitetura separa duas ideias:

- Preview fiel: reproduz o que o usuario desenhou no canvas.
- Preview IA: interpreta intencao visual e transforma em componentes reais.
- Editor IA: permite alterar tipo, cor, tamanho e posicao das formas reconhecidas.
- Treinamento local: coleta exemplos corrigidos pelo usuario para futura melhoria de prompt ou fine-tuning.

Isso permite defender que o sistema evolui de um construtor visual deterministico para um agente capaz de inferir componentes semanticos como `navbar`, `hero`, `cardGrid`, `form`, `field`, `image` e `footer`.
