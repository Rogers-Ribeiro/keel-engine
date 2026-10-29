# Formatos da plataforma Claude — API e Agent SDK (confirmados a 2026-10-29)

Referência actual para os destiladores dos cursos CCDV-F, CCAR-F e CCAR-P. Quando uma aula contradiz um facto aqui, a nota marca `(a aula diz: …; desactualizado)`. Tudo o que não foi confirmado na leitura da documentação está escrito como "não confirmado". Verificado a 2026-10-29.

Páginas oficiais lidas:

- https://platform.claude.com/docs/en/about-claude/models/overview
- https://platform.claude.com/docs/en/about-claude/model-deprecations
- https://platform.claude.com/docs/en/api/messages/create
- https://platform.claude.com/docs/en/api/versioning
- https://platform.claude.com/docs/en/build-with-claude/streaming
- https://platform.claude.com/docs/en/build-with-claude/thinking
- https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons
- https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools
- https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner
- https://platform.claude.com/docs/en/build-with-claude/structured-outputs
- https://platform.claude.com/docs/en/build-with-claude/prompt-caching
- https://platform.claude.com/docs/en/build-with-claude/batch-processing
- https://platform.claude.com/docs/en/build-with-claude/files
- https://platform.claude.com/docs/en/build-with-claude/pdf-support
- https://platform.claude.com/docs/en/build-with-claude/citations
- https://platform.claude.com/docs/en/build-with-claude/token-counting
- https://platform.claude.com/docs/en/agents-and-tools/mcp-connector
- https://platform.claude.com/docs/en/api/rate-limits
- https://platform.claude.com/docs/en/api/errors
- https://platform.claude.com/docs/en/managed-agents/overview
- https://code.claude.com/docs/en/agent-sdk/overview
- https://code.claude.com/docs/en/agent-sdk/python
- https://code.claude.com/docs/en/agent-sdk/typescript

## 1. Modelos

Preços por milhão de tokens (entrada / saída), da página de visão geral dos modelos. O Batch custa 50% disto.

| Modelo | ID da API | Contexto | Saída máx. (síncrona) | Preço |
|---|---|---|---|---|
| Claude Fable 5.1 | `claude-fable-5-1` | 1M | 128K | $10 / $50 |
| Claude Opus 5.5 | `claude-opus-5-5` | 1M | 128K | $4 / $20 |
| Claude Sonnet 5.5 | `claude-sonnet-5-5` | 1M | 128K | $2 / $10 |
| Claude Haiku 5.5 | `claude-haiku-5-5` | 1M | 128K | a partir de $0,10 / $0,50 |

- Outros modelos ativos ou legacy (IDs confirmados nas tabelas de deprecação e de modelos): `claude-mythos-5-1` e `claude-mythos-5` (acesso limitado), `claude-fable-5`, `claude-opus-5`, `claude-sonnet-5`, `claude-opus-4-8`, `claude-opus-4-7`, `claude-opus-4-6`, `claude-opus-4-5-20251101`, `claude-sonnet-4-6`, `claude-haiku-4-5-20251001`.
- Contexto e saída desses modelos: não confirmado nesta leitura (só os quatro da tabela foram lidos).
- Os IDs sem data (por exemplo `claude-opus-5-5`) são snapshots fixos. Desde a geração 4.6 os IDs são todos assim. Antes de 4.6, o alias aponta para um ID com data.
- Os modelos de acesso limitado (Mythos) exigem um programa de verificação.

**Descontinuados e retirados** (tabela de deprecações, 2026-10-29):

| ID | Estado | Data |
|---|---|---|
| `claude-mythos-preview` | Deprecated | 9 Jun 2026. A página de Create a Message indica fim a 30 Jun 2026. Conflito por resolver. |
| `claude-sonnet-4-5-20250929` | Deprecated | Retirada prevista 30 Nov 2026 (substituir por `claude-sonnet-5-5`) |
| `claude-opus-4-1-20250805` | Retirado | 5 Ago 2026 |
| `claude-opus-4-20250514`, `claude-sonnet-4-20250514` | Retirados | 15 Jun 2026 |
| `claude-3-7-sonnet-20250219`, `claude-3-5-haiku-20241022` | Retirados | 19 Fev 2026 |
| `claude-3-haiku-20240307` | Retirado | 20 Abr 2026 |
| `claude-3-opus-20240229` | Retirado | 5 Jan 2026 |
| `claude-3-5-sonnet-20240620`, `claude-3-5-sonnet-20241022` | Retirados | 28 Out 2025 |
| `claude-2.0`, `claude-2.1`, `claude-3-sonnet-20240229` | Retirados | 21 Jul 2025 |
| `claude-1.x`, `claude-instant-1.x` | Retirados | 6 Nov 2024 |

## 2. Messages API

- Endpoint: `POST /v1/messages`. Contagem de tokens: `POST /v1/messages/count_tokens`. A contagem é gratuita e tem limite de pedidos próprio, separado da criação.
- Obrigatórios: `model`, `max_tokens`, `messages`.
- `max_tokens` aceita 0 (só aquece a cache). Não funciona dentro de um batch.
- Opcionais principais: `system` (string ou blocos de texto), `stop_sequences`, `stream`, `tools`, `tool_choice`, `thinking`, `output_config` (`effort` e `format`), `metadata.user_id`, `service_tier`, `speed`, `cache_control` (no nível de topo), `container`.
- `messages`: roles `user` e `assistant`, alternados. Máximo de 100.000 mensagens. `content` é string ou array de blocos.
- Blocos de pedido confirmados: `text`, `image`, `document` (com `source` de tipo `file`, `base64` ou `text`), `container_upload`, `tool_result`, `thinking` e `redacted_thinking`.
- Prefill (última mensagem `assistant`) é rejeitado com 400 nos modelos 4.6 e posteriores e em Mythos Preview.
- `document` dentro de uma mensagem `assistant` devolve 400 (versão de API 2026-10-21).
- Versão de API: enviar `anthropic-version`. A versão mais recente documentada é `2026-10-21`. Muitos exemplos ainda usam `2023-06-01`, que continua válida.
- Resposta: `id`, `type: "message"`, `role: "assistant"`, `model`, `content`, `stop_reason`, `stop_sequence`, `usage`. Pode trazer também `container`, `stop_details` e `diagnostics`.
- `stop_reason`: `end_turn`, `max_tokens`, `stop_sequence`, `tool_use`, `pause_turn` (ciclo de server tools; devolver o conteúdo tal como está), `refusal` (chega com HTTP 200) e `model_context_window_exceeded`. Em streaming é `null` em `message_start`.
- Blocos de resposta: `text` (com `citations` opcionais), `thinking` (com `signature`), `redacted_thinking`, `tool_use` (`id`, `name`, `input`), `server_tool_use` e blocos de resultado das server tools (`web_search_tool_result`, `web_fetch_tool_result`, `code_execution_tool_result`, e outros).
- `usage`: `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`, `cache_creation` (`ephemeral_5m_input_tokens`, `ephemeral_1h_input_tokens`), `service_tier`, `speed`, `output_tokens_details.thinking_tokens`. Total de entrada = `input_tokens` + `cache_creation_input_tokens` + `cache_read_input_tokens`.

**Streaming** (`"stream": true`, server-sent events):

1. `message_start` (com `content` vazio).
2. Para cada bloco: `content_block_start`, uma ou mais `content_block_delta`, `content_block_stop`.
3. `message_delta` (com `stop_reason` e `usage` cumulativo).
4. `message_stop`.

- `ping` pode aparecer em qualquer ponto. `error` pode aparecer depois de um 200 (por exemplo `overloaded_error`).
- Tipos de delta: `text_delta` (`text`), `input_json_delta` (`partial_json`, a acumular até `content_block_stop`), `thinking_delta` (`thinking`), `signature_delta` (`signature`, logo antes de `content_block_stop`) e `citations_delta`.
- Tipos de evento novos podem aparecer. O código deve ignorar os desconhecidos.
- O SDK Python tem `client.messages.stream(...)` com `get_final_message()`. O TypeScript tem `client.messages.stream(...)` com `finalMessage()`.

## 3. Tool use

- Definição de ferramenta de cliente: `name` (regex `^[a-zA-Z0-9_-]{1,128}$`), `description`, `input_schema` (JSON Schema). Opcionais: `input_examples`, `strict`, `cache_control`, `defer_loading`, `allowed_callers`.
- A documentação pede descrições com 3 a 4 frases ou mais. Dar prioridade à descrição antes de qualquer outro ajuste.
- `tool_choice`: `auto` (por omissão quando há `tools`), `any`, `tool` (com `name`) e `none` (por omissão quando não há `tools`). Todos aceitam `disable_parallel_tool_use`.
- Restrições de `tool_choice`:
  - Com thinking manual (`enabled`), `any` e `tool` dão erro.
  - Em Opus 5.5, Sonnet 5.5, Fable 5.1 e Mythos 5.1, `any` e `tool` dão 400. Usar `auto` com `strict: true`, ou saídas estruturadas.
  - Forçar uma ferramenta salta o bloco de thinking.
  - Mudar `tool_choice` invalida a cache das mensagens.
- Ciclo: o modelo devolve `stop_reason: "tool_use"` com blocos `tool_use`. A aplicação executa a ferramenta e envia blocos `tool_result` (com `tool_use_id`) na mensagem `user` seguinte. Os campos `content` e `is_error` do `tool_result` não foram confirmados nesta leitura.
- Vários `tool_use` no mesmo turno são paralelos por omissão. `disable_parallel_tool_use` desliga isso.
- Server tools (executadas pela Anthropic): `web_search`, `web_fetch`, `code_execution`, `bash_code_execution`, `text_editor_code_execution`, `tool_search_tool_regex` e `tool_search_tool_bm25`. Não aceitam `input_examples`. As versões são datadas. A lista completa está na Tool reference, que não foi lida.
- **Tool Runner** (SDK, beta):
  - Python: `client.beta.messages.tool_runner(...)` com o decorador `@beta_tool`.
  - TypeScript: `client.beta.messages.toolRunner(...)` com `betaZodTool` ou `betaTool`. O input não é validado em tempo de execução.
  - Também existe em C#, Go, Java, PHP e Ruby.
  - Para aprovação humana, logging personalizado ou execução condicional, a documentação manda usar o loop manual.

## 4. Saídas estruturadas

- Estado: GA. Não precisa de cabeçalho beta.
- Dois mecanismos, usáveis em separado ou juntos:
  - `output_config.format` com `{"type": "json_schema", "schema": {...}}`, para controlar a forma da resposta.
  - `strict: true` em `tools`, para validar nomes e inputs das ferramentas.
- `output_format` está deprecated. No Python SDK 1.0 ou posterior, `output_format` em `client.beta.messages.create()` lança `TypeError`.
- Limites do JSON Schema:
  - `additionalProperties` tem de ser `false` em todos os objetos.
  - Não suportados: `minimum`, `maximum`, `multipleOf`, `minLength`, `maxLength`, `minItems` diferente de 0 ou 1, schemas recursivos e `$ref` externo.
  - `enum` aceita só strings, números, booleanos ou null. A capitalização dos valores não é garantida.
  - Regex sem lookahead, lookbehind nem backreferences.
- Um schema não suportado dá 400.
- `stop_reason: "refusal"` e `"max_tokens"` podem deixar o JSON fora do schema.
- Helpers: Python `client.messages.parse(output_format=Modelo)`, com resultado em `parsed_output`. TypeScript `zodOutputFormat` ou `jsonSchemaOutputFormat`. Também em Java, C#, Go, PHP e Ruby.

## 5. Prompt caching

- Ativação automática: `cache_control: {"type": "ephemeral"}` no nível de topo do pedido. Ativação explícita: `cache_control` num bloco de `tools`, `system` ou `messages`. O único tipo é `ephemeral`.
- TTL: 5 minutos por omissão. `"ttl": "1h"` dá uma hora.
- Preço sobre o preço base de entrada:

| Operação | Multiplicador |
|---|---|
| Escrita, TTL 5 min | 1,25× |
| Escrita, TTL 1 h | 2× |
| Leitura, geral | 0,1× |
| Leitura, Opus 5.5 e Sonnet 5.5 | 0,05× |
| Leitura, Fable 5.1 e Mythos 5.1 | 0,025× |

- Mínimo de tokens por prefixo (abaixo disto não há cache e não há erro):
  - 512: Fable 5.1, Mythos 5.1, Opus 5.5, Opus 5, Sonnet 5.5, Fable 5, Mythos 5, Haiku 5.5.
  - 1.024: Opus 4.8, Sonnet 5, Sonnet 4.6, Sonnet 4.5, Opus 4.1, Opus 4, Sonnet 4.
  - 2.048: Mythos Preview, Opus 4.7, Haiku 3.5.
  - 4.096: Opus 4.6, Opus 4.5, Haiku 4.5.
- Até 4 breakpoints explícitos por pedido. O `cache_control` automático ocupa um desses quatro.
- Ordem da hierarquia: `tools` → `system` → `messages`. Uma alteração num nível invalida esse nível e os seguintes.
- Janela de lookback: 20 blocos por breakpoint.
- Pré-aquecer a cache com `max_tokens: 0` funciona fora de batch.
- Os cache reads não contam para o ITPM dos rate limits (exceto Haiku 3.5).

## 6. Thinking

- Tipos de `thinking`:
  - `adaptive`: o modelo decide quanto pensar. Controla-se com `output_config.effort`, com os valores `low`, `medium`, `high`, `xhigh` e `max`.
  - `enabled` com `budget_tokens`: modo manual. Está deprecated em Opus 4.6 e Sonnet 4.6, e rejeitado a partir de 4.7 (400).
  - `disabled`: rejeitado em Fable 5.1, Mythos 5.1, Fable 5, Mythos 5 e Opus 5.5. Usar `between_tools` em Sonnet 5.5. Haiku 5.5 aceita `disabled`.
  - `between_tools`: só Sonnet 5.5. Com `xhigh` ou `max`, e com effort que muda a meio da conversa, dá 400.
- `budget_tokens`: mínimo 1024 e menor que `max_tokens`.
- Modelos antigos (4.5 e anteriores) rejeitam `adaptive`.
- Effort por omissão: Fable 5.1 `high`, Opus 5.5 `medium`, Sonnet 5.5 `high`, Haiku 5.5 `medium`.
- `display`: `summarized` ou `omitted`. Com `omitted` não há texto, só o bloco com `signature`.
- Com tool use, os blocos `thinking` e `redacted_thinking` voltam ao API exatamente como vieram. Editar, filtrar ou reordenar dá 400.
- `temperature`, `top_p` e `top_k` foram removidos na versão 2026-10-21. Qualquer um deles dá 400 em todos os modelos.

## 7. Batch, Files, PDF, citações e contagem

**Message Batches API** (GA):

- Desconto de 50%.
- Limites: 100.000 pedidos ou 256 MB por batch, o que vier primeiro.
- A maioria dos batches conclui em menos de 1 hora. Expiram ao fim de 24 horas.
- Resultados disponíveis durante 29 dias.
- `custom_id`: 1 a 64 caracteres, `^[a-zA-Z0-9_-]{1,64}$`.
- Não aceita `stream: true`, `speed`, `fallbacks` nem `max_tokens: 0`.
- `processing_status`: `in_progress`, `canceling`, `ended`.
- `result.type`: `succeeded`, `errored`, `canceled`, `expired`.
- Modelos: todos os ativos.

**Files API** (GA, sem cabeçalho beta):

- Upload: `POST /v1/files`. Referência numa mensagem: `{"type": "document", "source": {"type": "file", "file_id": "..."}}`. O mesmo vale para `image` e `container_upload`.
- Tamanho máximo: 500 MB por ficheiro. Total: 1 TB por organização.
- Expiração opcional: `expires_in_seconds` entre 3.600 e 7.776.000 (1 hora a 90 dias). Fixa no upload.
- Os ficheiros são partilhados por todo o workspace. Nunca aceitar `file_id` vindo de utilizadores finais. Para multi-tenant, usar um workspace por tenant.
- Download só para ficheiros criados por skills ou pela code execution (`downloadable: true`). O download de um ficheiro carregado dá 400.
- Operações gratuitas. O conteúdo usado em mensagens conta como input.
- Limite de cerca de 500 pedidos por minuto.

**PDF**:

- Máximo de 128 MB por pedido (API de primeira parte).
- Máximo de 600 páginas por pedido, ou 100 se a janela de contexto for menor que 1M tokens.
- Sem passwords nem encriptação.
- Todos os modelos ativos suportam PDF. Não há cabeçalho beta.

**Citações**:

- Ativação: `"citations": {"enabled": true}` em cada bloco `document`. Tem de estar em todos os documentos do pedido ou em nenhum.
- Tipos de localização: `char_location` (texto simples), `page_location` (PDF), `content_block_location` (documentos de conteúdo personalizado), `search_result_location` e `web_search_result_location`.
- Um bloco `text` com `citations` não vazio numa mensagem `user` dá 400 (versão 2026-10-21).
- Todos os modelos ativos suportam citações.

**Contagem de tokens**: `POST /v1/messages/count_tokens`. Resposta com `input_tokens`.

## 8. MCP

- MCP connector (beta). É o cliente MCP do lado da API. A aplicação não precisa de um cliente MCP.
- Cabeçalho beta: `anthropic-beta: mcp-client-2025-11-20` ou `mcp-client-2026-09-15`. A versão `mcp-client-2025-04-04` está deprecated.
- Pedido: `mcp_servers` com `{"type": "url", "url": "...", "name": "...", "authorization_token": "..."}`, e `tools` com `{"type": "mcp_toolset", "mcp_server_name": "..."}`.
- Limites: só chamadas de ferramentas do protocolo MCP. Só servidores HTTP (Streamable HTTP ou SSE). Servidores STDIO locais não se ligam diretamente.
- Em Managed Agents, os servidores MCP declaram-se no agente, e as credenciais vêm de um vault na sessão.
- No Agent SDK, MCP é a opção `mcp_servers` (Python) ou `mcpServers` (TypeScript). A página do SDK sobre MCP não foi lida.

## 9. Agent SDK (Python e TypeScript)

- Pacotes:
  - Python: `claude-agent-sdk` (`pip install claude-agent-sdk`).
  - TypeScript: `@anthropic-ai/claude-agent-sdk` (`npm install @anthropic-ai/claude-agent-sdk`).
- O que é: a biblioteca que corre o Claude Code, com o mesmo loop de agente, ferramentas built-in, permissões, sessões, hooks e gestão de contexto. Quem o executa é o utilizador, na sua infraestrutura. A Anthropic não o hospeda.
- Ferramentas built-in: ler, escrever e editar ficheiros, correr comandos e pesquisar na web. Nos exemplos aparecem `Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep` e `Skill`. A lista completa e `WebSearch` e `WebFetch` não foram confirmados nesta leitura.
- Função principal: `query()`. Python: `query(prompt=..., options=ClaudeAgentOptions(...))`, devolve um iterador assíncrono de mensagens. TypeScript: `query({ prompt, options })`, devolve `Query`.
- Sessões com várias trocas (Python): `ClaudeSDKClient`. Por omissão, cada `query()` cria uma sessão nova.
- Opções (Python / TypeScript):
  - `allowed_tools` / `allowedTools`: aprova sem perguntar. Não restringe as ferramentas.
  - `permission_mode` / `permissionMode`: Python `default`, `acceptEdits`, `plan`, `dontAsk`, `bypassPermissions`, `auto`. TypeScript inclui `default`, `plan`, `bypassPermissions` e `auto`.
  - `mcp_servers` / `mcpServers`, `hooks`, `agents` (subagentes), `model`, `max_turns` / `maxTurns`, `resume` (ID de sessão), `cwd`.
- Conceitos principais: subagentes, hooks, permissões, sessões (retomar ou fazer fork), MCP, skills e plugins. Skills e comandos carregam-se de `.claude/` e de `~/.claude/`.
- Versão mínima de Python ou de Node: não confirmado.
- Política: terceiros não podem oferecer login com claude.ai nem limites de utilização próprios. Usar autenticação por chave de API.
- Diferenças:
  - Agent SDK: biblioteca que corre o Claude Code, hospedada pelo utilizador.
  - Tool Runner: beta, na API, sem ferramentas built-in.
  - Managed Agents: hospedado pela Anthropic.

## 10. Managed Agents

- Serviço da Anthropic que hospeda o agente, a sandbox e as sessões. Está em beta com o cabeçalho `managed-agents-2026-04-01`. O SDK põe o cabeçalho automaticamente.
- Conceitos: `Agent` (modelo, prompt de sistema, ferramentas, MCP e skills), `Environment` (sandbox na nuvem ou própria), `Session` (instância em execução) e `Events` (mensagens por SSE).
- Não é elegível para ZDR nem para HIPAA.

## 11. Limites de taxa e erros

Códigos de erro (`error.type`):

| HTTP | Tipo | Tratamento |
|---|---|---|
| 400 | `invalid_request_error` | Corrigir o pedido. Não repetir. |
| 401 | `authentication_error` | Verificar a chave. |
| 402 | `billing_error` | Verificar faturação. |
| 403 | `permission_error` | Verificar permissões do workspace. |
| 404 | `not_found_error` | Verificar o caminho ou o ID. |
| 409 | `conflict_error` | Resolver o conflito e repetir. |
| 413 | `request_too_large` | Reduzir o pedido. |
| 429 | `rate_limit_error` | Esperar `retry-after` e repetir com backoff. |
| 500 | `api_error` | Repetir com backoff exponencial. |
| 504 | `timeout_error` | Usar streaming ou batch. |
| 529 | `overloaded_error` | Repetir com backoff. Pode aparecer também como evento `error` no streaming. |

- 429 do limite de gastos mensal (tier) não traz `retry-after`. O campo `error.details.error_code` é `enforced_spend_limit_reached`. Repetir não resolve.
- Os SDKs repetem automaticamente duas vezes por omissão, em erros de ligação, 429 e 5xx, e respeitam `retry-after`. Configura-se com `max_retries`.
- Pedidos longos (mais de 10 minutos): usar streaming ou batch.
- Limites de taxa: medidos em RPM, ITPM e OTPM, por modelo e por tier, com algoritmo de token bucket. ITPM conta `input_tokens` e `cache_creation_input_tokens`. OTPM não conta `max_tokens`.
- Exemplo do tier Start, Opus 5.5: 1.000 RPM, 2.000.000 ITPM, 400.000 OTPM. Tiers Build e Scale na página de rate limits. Limites de gastos mensais: Start $500, Build $1.000, Scale $200.000.
- Cabeçalhos de resposta: `retry-after`, `anthropic-ratelimit-requests-{limit,remaining,reset}`, `anthropic-ratelimit-input-tokens-*`, `anthropic-ratelimit-output-tokens-*`, `anthropic-ratelimit-tokens-*`.
- Tamanhos: Messages 128 MB, Batch 256 MB, Files 500 MB.

## 12. Nomes que mudaram

| Antigo (cursos de 2025 ou anteriores) | Atual |
|---|---|
| `claude-3-*`, `claude-2.*`, `claude-1.*`, `claude-instant-*` | Retirados. Ver a tabela da secção 1. |
| `claude-sonnet-4-20250514` | Retirado. Substituto indicado: `claude-sonnet-5-5`. |
| `claude-opus-4-20250514`, `claude-opus-4-1-20250805` | Retirados. Substituto indicado: `claude-opus-4-8`. |
| `claude-3-haiku-20240307` | Retirado. Substituto indicado na página: `claude-haiku-4-5-20251001`. O modelo atual da linha Haiku é `claude-haiku-5-5`. |
| `output_format` (SDK) | `output_config.format`. |
| `thinking: {"type": "enabled", "budget_tokens": N}` | `thinking: {"type": "adaptive"}` com `output_config.effort`. Em modelos 4.7 e posteriores, `enabled` dá 400. |
| `thinking: {"type": "disabled"}` em Sonnet 5.5 | `thinking: {"type": "between_tools"}`. |
| `temperature`, `top_p`, `top_k` | Removidos na versão de API 2026-10-21. Omitir. |
| Prefill da última mensagem `assistant` (4.6+) | Não suportado. Usar `output_config.format` ou instruções de sistema. |
| `anthropic-beta: files-api-2025-04-14` | Não é necessário. A API de Files é GA. |
| `anthropic-beta: structured-outputs-2025-11-13` | Não é necessário. |
| `mcp-client-2025-04-04` | Deprecated. Usar `mcp-client-2025-11-20` ou `mcp-client-2026-09-15`. |
| `computer_20251124`, `computer_20250124` (Opus 5.5, Sonnet 5.5, Haiku 5.5 na Claude API) | `computer_toolset_20260801`. |
| Pacotes `claude-code-sdk` (Python e TypeScript) | `claude-agent-sdk` e `@anthropic-ai/claude-agent-sdk`. Indicado no índice da documentação; a página de migração não foi lida. |
