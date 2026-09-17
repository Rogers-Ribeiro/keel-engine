# Decisões — Grupo 4: APIs do LangChain e do LangGraph

> Fontes consultadas a 2026-09-17.

## D-LC01 — Como se cria um agente: `initialize_agent`, `create_react_agent` ou `create_agent`?

**Temas:** llm-e-prompts, agentes-ia, producao-ia · **Regras afectadas:** nenhuma regra tem ID próprio; a decisão é a base de AGT-002, IAP-001, PROC-031

**Decisão:** Usa `create_agent` de `langchain.agents`, com middleware. Não uses `create_react_agent` (`langgraph.prebuilt`) nem `initialize_agent` (legado) em código novo.

**Porquê:** A documentação e o guia de migração para o LangGraph v1 confirmam o `create_react_agent` como obsoleto, substituído por `create_agent`; `prompt=` passou a `system_prompt=`. O `initialize_agent` já não consta da documentação actual.

**Fonte:** LangChain, "Agents", https://docs.langchain.com/oss/python/langchain/agents, 2026 (langchain 1.x). LangChain, "Migrate to LangGraph v1", https://docs.langchain.com/oss/python/migrate/langgraph-v1, 2026.

**Contra:** o `create_react_agent` ainda funciona em código antigo e é mais simples para protótipos rápidos com só "chamar tool ou terminar"; não há motivo para o adoptar de raiz num projecto novo.

**Confiança:** alta

## D-LC02 — Que framework serve de base aos agentes, e qual a topologia multi-agente por omissão?

**Temas:** python, arquitetura · **Regras afectadas:** AGT-017, ARQ-024; nenhuma regra fixa a escolha do framework em si

**Decisão:** Mantém LangChain/LangGraph, já assumido no âmbito do projecto. Por omissão, topologia de supervisor: um nó central decide o próximo especialista e os especialistas voltam sempre a ele, num `StateGraph` com aresta condicional, sem o pacote extra `langgraph-supervisor`.

**Porquê:** Não há documentação que decida objectivamente entre LangChain/LangGraph e CrewAI/LlamaIndex/Agno; é escolha de stack, já fixada pelo próprio âmbito do projecto (LangChain/LangGraph, RAG). Dentro do LangGraph, o supervisor com handoffs é o padrão de primeira classe para multi-agente, com um pacote oficial dedicado.

**Fonte:** LangChain, referência do pacote "langgraph-supervisor" (`create_supervisor`, `create_handoff_tool`), https://reference.langchain.com/python/langgraph-supervisor, mantido por langchain-ai, 2026.

**Contra:** uma topologia descentralizada evita o gargalo de um supervisor único; vale reconsiderar se surgirem muitos especialistas independentes sem necessidade de arbitragem central.

**Confiança:** média (framework: escolha de âmbito, não de fonte externa; topologia: documentada, mas sem obrigatoriedade técnica)

## D-LC03 — Chains legadas ou composição com LCEL e LangGraph?

**Temas:** llm-e-prompts · **Regras afectadas:** PROC-031, IAP-003

**Decisão:** Usa LCEL e LangGraph em tudo o que for novo. `LLMChain`, `SequentialChain`, `ConversationChain` e `RouterChain` só ao ler ou manter código antigo, importadas de `langchain-classic`.

**Porquê:** No LangChain 1.x essas chains saíram do pacote principal para `langchain-classic`; o pacote `langchain` ficou só com agentes, mensagens, tools, chat models e embeddings.

**Fonte:** LangChain, "Migrate to LangChain v1", https://docs.langchain.com/oss/python/migrate/langchain-v1, 2026 (langchain-classic 1.0.8).

**Contra:** o `langchain-classic` continua mantido; se uma integração só existir lá (alguns retrievers avançados), usa-se pontualmente, com o motivo documentado.

**Confiança:** alta

## D-LC04 — Que mecanismo de saída estruturada usa o projecto?

**Temas:** llm-e-prompts · **Regras afectadas:** LLM-008, AGT-006, IAP-006, PY-023

**Decisão:** `with_structured_output` fora de agentes; dentro do `create_agent`, `response_format=Schema` com Pydantic, deixando o LangChain escolher entre `ProviderStrategy` (nativa do fornecedor) e `ToolStrategy` (por tool calling).

**Porquê:** É a forma que a documentação actual apresenta; o `ProviderStrategy` entra automaticamente quando o fornecedor suporta saída nativa, com maior fiabilidade. As formas antigas (`response_format=("instrução…", Schema)`, parsers com instruções de formato no prompt) foram removidas.

**Fonte:** LangChain, "Structured output", https://docs.langchain.com/oss/python/langchain/structured-output, 2026 (langchain ≥1.4).

**Contra:** forçar `tool_choice` com um parser de tools dá mais controlo quando faltam campos num esquema complexo; usa-se pontualmente se a estratégia automática falhar, não como regra geral.

**Confiança:** alta

## D-LC05 — Que implementação de memória de conversa?

**Temas:** llm-e-prompts, agentes-ia, producao-ia, rag, python · **Regras afectadas:** LLM-015, LLM-016, AGT-010, AGT-011, IAP-010, IAP-016, ARQ-026

**Decisão:** Memória de curto prazo no estado do agente, com checkpointer e `thread_id` (menos de 255 caracteres). `InMemorySaver`/`MemorySaver` só em desenvolvimento; `PostgresSaver`/`AsyncPostgresSaver` em produção. Não usar `ConversationBufferMemory`, `RunnableWithMessageHistory` nem `SQLChatMessageHistory` em código novo.

**Porquê:** A documentação do LangGraph descreve o checkpointer com `thread_id` como o mecanismo actual; os checkpointers em memória perdem tudo ao reiniciar; o limite de 255 caracteres vem da coluna do Postgres onde o `thread_id` é guardado.

**Fonte:** LangGraph, "Persistence", https://docs.langchain.com/oss/python/langgraph/persistence, 2026.

**Contra:** `RunnableWithMessageHistory` ainda funciona fora de um grafo e é mais simples para um script pontual sem estado; não compensa num projecto já em LangGraph.

**Confiança:** alta

## D-LC06 — Como se instancia o modelo: função universal, fábrica própria ou porta e adaptador?

**Temas:** llm-e-prompts, producao-ia, python · **Regras afectadas:** LLM-014, PY-019, ARQ-004

**Decisão:** `init_chat_model` dentro de um único módulo de configuração de modelos; o módulo, não a função, é a fronteira que isola o SDK do fornecedor do resto do código.

**Porquê:** `init_chat_model` inicializa qualquer fornecedor por string (`"fornecedor:modelo"`) ou por `model_provider=`, sem mapa de classes à mão. O `create_agent` não aceita um modelo com `bind_tools` já aplicado.

**Fonte:** LangChain, "Models", https://docs.langchain.com/oss/python/langchain/models, 2026.

**Contra:** uma fábrica própria com mapa fornecedor→classe dá mais controlo sobre parâmetros específicos de cada SDK; só compensa se `init_chat_model` não cobrir algum desses parâmetros.

**Confiança:** alta

## D-LC07 — Que tipo se usa para o estado do grafo: `TypedDict` ou Pydantic `BaseModel`?

**Temas:** agentes-ia, arquitetura, dev-com-agentes · **Regras afectadas:** nenhuma regra tem ID próprio; toca AGT-006, AGT-008, ARQ-022, PY-027

**Decisão:** `TypedDict` por omissão (ou `dataclass` quando há valores por omissão). Pydantic só num grafo escrito à mão, quando é mesmo preciso validar o próprio estado em runtime.

**Porquê:** A documentação do LangGraph dá o `TypedDict` como a forma principal, nota que o Pydantic é menos eficiente, e confirma que o `create_agent` de mais alto nível não suporta esquemas de estado Pydantic.

**Fonte:** LangGraph, "Graph API", https://docs.langchain.com/oss/python/langgraph/graph-api, 2026.

**Contra:** Pydantic dá validação recursiva automática a cada escrita no estado; só compensa em grafos próprios complexos, fora do `create_agent`.

**Confiança:** alta

## D-LC08 — Onde se tratam os erros das tools?

**Temas:** arquitetura · **Regras afectadas:** AGT-007, ARQ-025, IAP-013

**Decisão:** No agente, por middleware (`ToolErrorMiddleware`, com `wrap_tool_call`), que converte a excepção numa `ToolMessage` de erro sem derrubar o grafo. A tool só devolve a string de erro directamente em grafos próprios sem `create_agent`.

**Porquê:** No `create_agent`, o tratamento de erros passou para middleware, que corre à volta da chamada e não dentro da tool. O `ToolErrorMiddleware` é estável a partir do `langchain` 1.3.14, sem aviso de Beta.

**Fonte:** LangChain, "Built-in middleware", https://docs.langchain.com/oss/python/langchain/middleware/built-in, 2026 (langchain ≥1.3.14).

**Contra:** devolver a string de erro directamente na tool continua válido num grafo escrito à mão, fora do `create_agent`.

**Confiança:** alta

## D-LC09 — Que cliente MCP usa o código Python?

**Temas:** dev-com-agentes · **Regras afectadas:** PROC-025, PROC-027; nenhuma regra fixa ainda o cliente concreto

**Decisão:** Em código novo, `langchain.mcp` (`MCPAdapter`), com `langchain[mcp]>=1.4.0`, mesmo estando em beta. Não adoptar `langchain-mcp-adapters` (`MultiServerMCPClient`) de raiz. Transporte streamable HTTP para servidores remotos.

**Porquê:** O guia de migração recomenda `langchain.mcp` mesmo durante a transição, apesar do aviso `LangChainBetaWarning`. O transporte HTTP+SSE está descontinuado na especificação MCP.

**Fonte:** LangChain, "Migrate from langchain-mcp-adapters", https://docs.langchain.com/oss/python/migrate/langchain-mcp-adapters, 2026.

**Contra:** `langchain-mcp-adapters` é estável e sem aviso de beta; se a API do `langchain.mcp` mudar antes de sair de beta, fixar a versão e testar antes de actualizar.

**Confiança:** média — a própria API está em beta.

## D-LC10 — O código importa integrações do `langchain-community` ou dos pacotes de parceiro?

**Temas:** dev-com-agentes · **Regras afectadas:** nenhuma regra tem ID próprio

**Decisão:** Importa dos pacotes de parceiro (`langchain-openai`, `langchain-anthropic`, etc.) sempre que existirem; usa `langchain-community` só quando não há pacote de parceiro para a integração.

**Porquê:** No LangChain 1.x os re-exports de integrações saíram do pacote principal. O `langchain-community` continua a existir e a ser publicado (0.4.2), mas deixou de ser o caminho por omissão.

**Fonte:** LangChain, "Migrate to LangChain v1", https://docs.langchain.com/oss/python/migrate/langchain-v1, 2026.

**Contra:** nem toda a integração tem pacote de parceiro; para essas, o `langchain-community` continua a ser a via oficial.

**Confiança:** alta

## D-LC11 — Que API da OpenAI e que papel de sistema, ao falar directamente com o fornecedor?

**Temas:** llm-e-prompts · **Regras afectadas:** nenhuma; só actua fora do módulo isolado por LLM-014/PY-019

**Decisão:** Se for mesmo preciso falar directamente com o SDK da OpenAI, usa a API Responses, com as instruções no parâmetro `instructions`, não numa mensagem `role: system`.

**Porquê:** A OpenAI recomenda a Responses API para todo o projecto novo. A Chat Completions continua suportada, sem data de fim anunciada, mas deixou de ser o caminho por omissão.

**Fonte:** OpenAI, "Migrate to the Responses API", https://developers.openai.com/api/docs/guides/migrate-to-responses, 2026.

**Contra:** a Chat Completions é mais simples para quem já tem código nesse formato e continua suportada; só compensa migrar se o projecto quiser as primitivas agênticas nativas da Responses API.

**Confiança:** média — a decisão só se aplica ao módulo de modelos, e a divergência dos cursos entre as duas APIs já reflectia essa incerteza.
