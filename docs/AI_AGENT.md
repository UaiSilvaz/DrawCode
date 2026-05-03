# DrawCode AI Agent

O agente de IA transforma o canvas visual do editor em componentes reais dentro do proprio canvas. HTML, CSS, JS e React continuam sendo gerados pela API como export secundario, mas a experiencia principal e atualizar a pagina visualmente.

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
6. `src/lib/ai/shape-code-generator.ts` gera React + CSS e HTML/CSS/JS como export secundario.
7. `WebBuilderScreen.tsx` aplica as formas reconhecidas diretamente no wrapper branco do GrapesJS.
8. O usuario continua editando o resultado no canvas normal, sem modal de preview.

## Camadas

| Arquivo | Responsabilidade |
| --- | --- |
| `src/lib/ai/preview-generator.ts` | Preview fiel e schema de entrada da rota. |
| `src/lib/ai/agent.ts` | Orquestra OpenAI, validacao e fallback. |
| `src/lib/ai/semantic-schema.ts` | Schemas da arvore semantica. |
| `src/lib/ai/semantic-analyzer.ts` | Interpretacao local quando nao ha API key ou quando a IA falha. |
| `src/lib/ai/code-generator.ts` | Gera React + CSS e exports secundarios. |
| `src/lib/ai/shape-recognizer.ts` | Reconhece formas desenhadas e calcula confianca/metrica. |
| `src/lib/ai/shape-code-generator.ts` | Gera codigo a partir das formas reconhecidas. |
| `src/screens/Grape/web-builder/WebBuilderScreen.tsx` | Aplica o layout gerado no canvas do editor. |
| `src/lib/ai/types.ts` | Tipos compartilhados. |

## Estrategia Para o TCC

A arquitetura separa duas ideias:

- Preview fiel: reproduz o que o usuario desenhou no canvas.
- Aplicacao no canvas: transforma rabiscos e formas em componentes reais editaveis.
- Fallback local: quando a OpenAI falha ou nao ha quota, o reconhecedor visual ainda atualiza o canvas.

Isso permite defender que o sistema evolui de um construtor visual deterministico para um agente capaz de inferir componentes semanticos como `navbar`, `hero`, `cardGrid`, `form`, `field`, `image` e `footer`.
