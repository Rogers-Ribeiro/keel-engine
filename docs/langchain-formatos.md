# LangChain, LangGraph e LangSmith: formas actuais (confirmadas a 2026-09-17)

Referência para as regras e os agentes. Os cursos usam APIs de várias épocas (0.x e 1.x); isto é o que a documentação oficial diz hoje.

**Fontes:**
- Documentação:
  - [migração para o LangChain v1](https://docs.langchain.com/oss/python/migrate/langchain-v1)
  - [migração para o LangGraph v1](https://docs.langchain.com/oss/python/migrate/langgraph-v1)
  - [migração do `langchain-mcp-adapters`](https://docs.langchain.com/oss/python/migrate/langchain-mcp-adapters)
  - [agentes](https://docs.langchain.com/oss/python/langchain/agents)
  - [saída estruturada](https://docs.langchain.com/oss/python/langchain/structured-output)
  - [human-in-the-loop](https://docs.langchain.com/oss/python/langchain/human-in-the-loop)
  - [interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts)
  - [persistência](https://docs.langchain.com/oss/python/langgraph/persistence)
  - [Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)
  - [testes unitários](https://docs.langchain.com/oss/python/langchain/test/unit-testing)
  - [observabilidade](https://docs.langchain.com/oss/python/langchain/observability)
  - [avaliação no LangSmith](https://docs.langchain.com/langsmith/evaluate-llm-application)
- Versões: PyPI.
- LangServe: README do repositório.

## Versões actuais (PyPI, 2026-09-17)

| Pacote | Versão | Python |
|---|---|---|
| `langchain` | 1.4.1 | ≥ 3.10 |
| `langchain-core` | 1.6.3 | ≥ 3.10 |
| `langgraph` | 1.2.11 | ≥ 3.10 |
| `langsmith` | 0.12.6 | ≥ 3.10 |
| `langchain-openai` / `langchain-anthropic` | 1.6.2 / 1.7.2 | ≥ 3.10 |
| `langgraph-checkpoint-postgres` | 3.1.2 | ≥ 3.10 |
| `langchain-classic` (legado) | 1.0.8 | ≥ 3.10 |
| `langchain-community` | 0.4.2 | ≥ 3.10 |
| `langchain-mcp-adapters` (substituído) | 0.3.2 | ≥ 3.10 |
| `langserve` (descontinuado) | 0.3.3 (2025-10) | ≥ 3.9 |

## Do que os cursos usam para o que vale hoje

| Nos cursos | Hoje | Notas |
|---|---|---|
| `from langgraph.prebuilt import create_react_agent`, `initialize_agent` | `from langchain.agents import create_agent` | `prompt=` passa a `system_prompt=`; invoca-se com `agent.invoke({"messages": [...]})`. O `create_react_agent` está obsoleto no LangGraph v1. |
| `pre_model_hook`, `post_model_hook`, `state_modifier` | Middleware do `create_agent` (`before_model`, `after_model`, `@wrap_model_call`, `@wrap_tool_call`, `@dynamic_prompt`) | O tratamento de erros das tools passa a middleware (`wrap_tool_call`). |
| `LLMChain`, `SequentialChain`, `ConversationChain`, `ConversationalRetrievalChain`, retrievers de `langchain.retrievers`, `langchain.hub`, indexing API | Pacote `langchain-classic` (`from langchain_classic.chains import …`, `from langchain_classic import hub`) | É legado. O pacote `langchain` ficou só com agentes, mensagens, tools, chat models e embeddings. |
| `ConversationBufferMemory` e afins | Memória de curto prazo: estado do agente (`messages`) com checkpointer e `thread_id`; longo prazo: stores | O `MemorySaver`/`InMemorySaver` perde tudo ao reiniciar; em produção usa-se `PostgresSaver`/`AsyncPostgresSaver` (`langgraph-checkpoint-postgres`). O `thread_id` tem de ter menos de 255 caracteres. |
| Re-exports de `langchain-community` em `langchain.*` | Importar do pacote de integração (`langchain-openai`, `langchain-anthropic`, …) ou de `langchain-community` directamente | O `langchain-community` continua a existir (0.4.2), mas os re-exports saíram do `langchain`. |
| `response_format=("instrução…", Schema)` (prompted output), `StructuredOutputParser`, `convert_to_openai_function` | `create_agent(..., response_format=Schema)`, com `ProviderStrategy` (nativo do fornecedor) ou `ToolStrategy` (via tool calling) | Um schema passado directamente usa `ProviderStrategy` quando o modelo o suporta. Um JSON Schema em dicionário tem de ir dentro de uma estratégia. Fora de agentes, o chat model continua a ter `with_structured_output`. |
| Estado Pydantic (`AgentStatePydantic`) no agente pré-feito | `langchain.agents.AgentState`, só `TypedDict` | O `create_agent` não suporta estado Pydantic. Num `StateGraph` próprio, a forma documentada é `TypedDict`, ou `dataclass` para valores por omissão. |
| `interrupt_before=[...]`, `HumanInterrupt`, `HumanInterruptConfig`, `ActionRequest` | No agente: `HumanInTheLoopMiddleware(interrupt_on={...})`, com decisões `approve`/`edit`/`reject`/`respond`; num grafo próprio: `interrupt(valor)` num nó e retoma com `Command(resume=...)` | Precisa de checkpointer. Os tipos antigos passam a `InterruptOnConfig` e `HITLRequest`. |
| `ValidationNode` | Removido: o `create_agent` valida o input das tools | |
| `MessageGraph` | `StateGraph` com uma chave `messages` (ou `MessagesState`) | |
| Reducer das mensagens `operator.add` | `add_messages`, ou `MessagesState` | O `add_messages` junta por ID e deserializa para mensagens LangChain (acesso por ponto: `msg.content`). O `operator.add` serve para listas simples, por exemplo resultados em paralelo. |
| Nome do nó nos eventos de streaming: `"agent"` | `"model"` | |
| Contexto em `config["configurable"]` | `context=` em `invoke`/`stream` e `context_schema=` no `create_agent` | Injecção de dependências em runtime. |
| `langchain-mcp-adapters` (`MultiServerMCPClient`, `convert_mcp_tool_to_langchain_tool`) | `langchain.mcp` (`MCPAdapter`, `as_langchain_tool`), com `langchain[mcp]>=1.4.0` | **Em beta** (emite `LangChainBetaWarning`). A configuração segue a forma `mcpServers`. |
| Transporte MCP remoto por SSE | Streamable HTTP | A especificação MCP descontinuou o HTTP+SSE (protocolo 2024-11-05). O stdio continua para servidores locais. |
| `LANGCHAIN_TRACING_V2`, `LANGCHAIN_API_KEY`, `LANGCHAIN_PROJECT` | `LANGSMITH_TRACING=true`, `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT` | |
| `LangChainStringEvaluator`, avaliadores pré-feitos antigos | `langsmith` `evaluate()`/`aevaluate()` (ou `Client.evaluate`); avaliadores prontos no pacote `openevals` | O `aevaluate()` é recomendado para lotes grandes. |
| LangServe | Descontinuado desde 18/11/2024; para projectos novos, o LangGraph Platform (deploy do LangGraph) | Não usar em projectos novos. |
| Modelo fixo por classe (`ChatOpenAI(...)`) | Continua a funcionar; `init_chat_model("modelo")`, `init_chat_model("fornecedor:modelo")` ou `model_provider=` inicializa qualquer fornecedor | No `create_agent`, a selecção dinâmica de modelo faz-se por middleware; modelos com tools já ligadas (`bind_tools`) não são suportados. |
| Testes com o LLM real | `GenericFakeChatModel(messages=iter([...]))` de `langchain_core.language_models.fake_chat_models`, com `InMemorySaver` | Testes unitários rápidos e deterministas; o LLM real fica para os testes de integração. |

## Mantém-se

- `StateGraph`, checkpointers, `interrupt()`, `Command`, `Send` e `MemorySaver` continuam a funcionar no LangGraph v1, que é compatível com a versão anterior fora do agente pré-feito.
- `@tool` e `BaseTool` passam a importar-se de `langchain.tools`, e as mensagens de `langchain.messages`. `message.content` continua válido; `message.content_blocks` é a forma independente do fornecedor.

## Consequências para as regras

1. **Agentes:** as regras sobre agentes usam `create_agent` com middleware. Não usam `create_react_agent`, `initialize_agent` nem chains legadas; o `langchain-classic` só entra em código antigo.
2. **Estado:** em `TypedDict`, com `add_messages` nas mensagens, checkpointer persistente em produção e `thread_id` por conversa.
3. **Aprovação humana:** com `HumanInTheLoopMiddleware` no agente, ou `interrupt()` com `Command(resume=...)` num grafo próprio.
4. **Saída estruturada:** com `response_format` e estratégias. Fora de agentes, `with_structured_output`.
5. **MCP:** a escolha entre `langchain.mcp` (beta) e `langchain-mcp-adapters` (estável, mas substituído) é uma **decisão a tomar**. Para servidores remotos, streamable HTTP.
6. **LangSmith:** variáveis `LANGSMITH_*` e avaliação com `evaluate()`/`openevals`.
7. **Deploy:** sem LangServe.
8. **Python:** 3.10 ou superior.
