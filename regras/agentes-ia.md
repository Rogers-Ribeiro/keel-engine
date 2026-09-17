# Regras — Agentes de IA

Prefixo `AGT`. Regras confirmadas nas transcrições a 2026-09-17. Síntese de origem: [agentes-ia](https://github.com/Rogers-Ribeiro/keel/blob/main/conhecimento/agentes-ia.md). Decisões pendentes: [revisão](_revisao/agentes-ia.md).

## Quando usar um agente

### AGT-001 — Código determinístico antes de agente

**Regra:** antes de criar um agente, escreve por extenso os passos do problema; se eles se conhecem à partida, resolve-o com código ou com um workflow fixo e não com um agente.
**Porquê:** o LLM erra a cada passo e o erro compõe-se — com 90% de acerto por passo, seis passos dão cerca de 59%; o curso dá vários casos de empresas que resolveriam o problema com código Python determinístico.
**Como verificar:** a spec ou o ADR diz que passos não se conhecem à partida e por que razão o LLM tem de decidir a sequência; se a sequência está fixa no código, não há agente.
**Fonte:** [LangChain §12, aula 76](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/transcricoes/076-llm-applications-in-production.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/notas/27-agent-security-foundations.md)
**Cursos:** 3

### AGT-002 — LangGraph para estado, ciclos e pausas

**Regra:** usa LangGraph quando o fluxo precisa de estado entre passos, ciclos, recuperação de falhas ou pausa para revisão humana; usa cadeias LCEL só para pipelines lineares e protótipos.
**Porquê:** uma cadeia não tem memória entre passos, não volta atrás e perde o progresso quando algo falha; o LangGraph traz estado durável, persistência e interrupção/retoma.
**Como verificar:** um fluxo com ciclo, retoma ou aprovação implementado como cadeia linear é motivo de rejeição; um fluxo de um só passo não precisa de grafo.
**Fonte:** [PAA §7, aula 89](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/089-langgraph-and-its-pillars-overview.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/07-langgraph-a-full-deep-dive.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 4

### AGT-003 — Todo o ciclo tem contador e limite

**Regra:** qualquer ciclo (auto-correcção, reflexão, recuperação iterativa, quality gate) guarda no estado um contador e um máximo, e a função de routing verifica esse máximo antes de decidir continuar.
**Porquê:** sem contador e limite o ciclo pode nunca convergir e gasta tokens sem fim; nos exemplos dos cursos o limite fica em 2 ou 3 iterações e funciona como circuit breaker.
**Como verificar:** procura no estado os campos de iteração e máximo e confirma que a função de routing os lê; um ciclo cuja única condição de saída é o sucesso do LLM está errado.
**Fonte:** [PAA §7, aula 100](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/100-hands-on-cycles-and-loops-self-correcting-code-writer.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/07-langgraph-a-full-deep-dive.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/08-multi-agent-systems-with-langgraph-and-langchain.md)
**Cursos:** 4

## Tools e saída estruturada

### AGT-004 — Tool com nome, docstring e type hints

**Regra:** toda a função exposta como tool tem nome distinto, type hints em todos os argumentos e uma docstring que diz o que faz, o que recebe e o que devolve, escrita de forma explícita e sem ambiguidade.
**Porquê:** é essa descrição, e não o código, que o LLM lê para decidir se e como chama a tool; com descrição vaga escolhe a tool errada ou nenhuma.
**Como verificar:** no diff, cada `@tool` tem docstring e anotações de tipo; uma docstring que repete o nome da função sem dizer quando usar a tool não passa.
**Fonte:** [LangChain §3, aula 19](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/transcricoes/019-creating-your-first-langchain-agent-tools-and-llms.md) · [RAG Bootcamp §13, aula 61](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/061-tools-in-langchain.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/notas/03-the-gist-of-ai-agents.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 8

### AGT-005 — Integração oficial antes de tool própria

**Regra:** antes de escrever uma tool que embrulha o SDK de um serviço, procura o pacote de integração mantido pelo fornecedor (por exemplo `langchain-tavily`) e usa-o.
**Porquê:** quem mantém o serviço escreve melhores descrições e melhores argumentos do que quem não domina os detalhes do SDK, e é isso que o LLM usa para decidir.
**Como verificar:** uma tool nova que chama um SDK de terceiros tem de vir com a justificação de não existir integração oficial equivalente.
**Fonte:** [LangChain §3, aula 21](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/transcricoes/021-integrating-real-world-search-with-tavily-and-langchain-tools.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/notas/03-the-gist-of-ai-agents.md)
**Cursos:** 5

### AGT-006 — Saída estruturada para tudo o que o código consome

**Regra:** quando a saída do modelo é lida por código (routing, condições, campos de resposta, extracção), pede-a com `response_format` no `create_agent` — ou `with_structured_output` fora de agentes — e um schema Pydantic; para escolhas fechadas, um campo `Literal` com os valores válidos. Nunca faças parsing de texto livre.
**Porquê:** o parsing de texto parte-se com um token mal formado, e o `Literal` impede o modelo de inventar um destino que não existe, o que torna o routing determinístico; só o Pydantic valida os tipos em runtime.
**Como verificar:** procura `json.loads`, regex ou `split` sobre respostas do modelo — é motivo de rejeição; confirma que o schema é `BaseModel` e não `TypedDict` quando é preciso validar.
**Fonte:** [LangChain §3, aula 22](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/transcricoes/022-structured-output-with-langchain-agents-using-pydantic.md) · [PAA §8, aula 111](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/111-hands-on-the-supervisor-agent.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/notas/13-updated-langchain-hands-on-with-version-v1.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 7

### AGT-007 — A tool devolve o erro como texto

**Regra:** uma tool trata o erro dentro dela e devolve uma string que o explica; não levanta excepções para fora.
**Porquê:** a tool é a fronteira com o mundo exterior — uma excepção derruba o grafo inteiro, enquanto uma string de erro deixa o modelo perceber a falha e explicá-la ao utilizador.
**Como verificar:** cada tool que toca em rede, ficheiros ou base de dados tem `try/except` e devolve texto em todos os caminhos; lógica de erro transversal vai para middleware e não repetida em cada tool.
**Fonte:** [PAA §8, aula 110](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/110-custom-tool-with-error-handling.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/08-multi-agent-systems-with-langgraph-and-langchain.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 5

## Grafo e estado

### AGT-008 — `add_messages` nas mensagens, reducer nos campos acumulados

**Regra:** declara o campo de mensagens como `Annotated[list[...], add_messages]` e põe um reducer em qualquer campo do estado escrito por mais do que um nó; nunca uses `operator.add` nas mensagens.
**Porquê:** sem reducer cada escrita apaga a anterior, e `operator.add` não faz merge por ID — com tools, o total de mensagens fica preso em 1; o `add_messages` concatena e actualiza pelo ID.
**Como verificar:** lê a definição do estado: campos sem reducer só podem ser escritos por um nó, e o campo de mensagens tem de usar `add_messages` ou `MessagesState`.
**Fonte:** [PAA §8, aula 114](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/114-how-agents-communicate-reducers-deep-dive.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/07-langgraph-a-full-deep-dive.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/08-multi-agent-systems-with-langgraph-and-langchain.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 3

### AGT-009 — Aresta condicional com `Literal` e mapa de rotas

**Regra:** em `add_conditional_edges`, a função de routing devolve um `Literal` com as rotas possíveis e passa-se sempre o dicionário que mapeia cada valor ao nó de destino.
**Porquê:** o `Literal` fixa as rotas válidas e o mapa liga-as aos nós; sem o mapa, a execução até corre, mas o desenho do grafo sai errado e deixa de servir para depurar.
**Como verificar:** procura chamadas a `add_conditional_edges` com dois argumentos apenas, ou funções de routing que devolvem `str`.
**Fonte:** [PAA §7, aula 96](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/096-edges-and-conditional-edges-deep-dive.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/07-langgraph-a-full-deep-dive.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 2

## Memória e persistência

### AGT-010 — Checkpointer persistente e um `thread_id` por conversa

**Regra:** compila o grafo com um checkpointer e passa em `configurable.thread_id` um identificador por conversa, nunca partilhado entre utilizadores; em produção o checkpointer é persistente (SQLite ou Postgres), e a memória em RAM fica para testes.
**Porquê:** sem checkpointer cada invocação é sem estado — não há memória, uma falha perde o progresso e não é possível pausar para revisão humana; o saver em RAM perde tudo ao reiniciar o processo.
**Como verificar:** procura `compile(checkpointer=...)` e a origem do `thread_id`; um `InMemorySaver` no caminho de produção, ou um `thread_id` fixo no código, é motivo de rejeição.
**Fonte:** [PAA §7, aula 105](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/105-hands-on-checkpointing-deep-dive.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/07-langgraph-a-full-deep-dive.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/notas/13-updated-langchain-hands-on-with-version-v1.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 7

### AGT-011 — Histórico limitado em conversas longas (API a confirmar)

**Regra:** em qualquer conversa que possa crescer, corta o histórico por orçamento de tokens preservando as mensagens de sistema, ou resume-o automaticamente ao atingir um limite de mensagens ou de tokens.
**Porquê:** a lista de mensagens cresce a cada troca — o custo sobe e acaba por rebentar a janela de contexto.
**Como verificar:** no código do agente ou do nó de chat há um passo de corte ou de resumo com limite explícito; um buffer que só acumula não passa.
**Fonte:** [PAA §6, aula 79](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/079-hands-on-message-trimming.md) · [RAG Bootcamp §13, aula 66](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/066-middleware-summarization-with-langchain.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/06-rag-and-memory-a-comprehensive-dive.md)
**Cursos:** 3

## RAG

### AGT-012 — Responder só com o contexto e admitir «não sei»

**Regra:** todo o prompt de RAG manda responder apenas a partir do contexto fornecido e dizer explicitamente que não tem essa informação quando a resposta não está lá; o grafo tem uma rota para quando nenhuma fonte serve.
**Porquê:** sem essa instrução o modelo inventa uma resposta plausível, porque tende a não admitir que não sabe.
**Como verificar:** lê o template do prompt: tem de conter a restrição ao contexto e a instrução de «não sei»; confirma com uma pergunta fora da base que a resposta é a de falta de informação.
**Fonte:** [PAA §6, aula 67](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/067-hands-on-rag-with-fallback.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/06-rag-and-memory-a-comprehensive-dive.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/notas/16-agentic-rag.md)
**Cursos:** 7

### AGT-013 — Fonte na metadata e citada na resposta

**Regra:** guarda a origem (ficheiro ou URL) na metadata de cada chunk, inclui-a no contexto que vai para o prompt e devolve as fontes junto da resposta.
**Porquê:** poder seguir a resposta até ao documento original é o que dá confiança ao utilizador e permite verificação, e é crítico em contextos regulados; o texto também tem de ser guardado à parte, porque o embedding não é invertível.
**Como verificar:** confirma que a função que formata os documentos inclui a fonte e que o schema da resposta tem um campo de fontes; documentos indexados sem `source` na metadata não passam.
**Fonte:** [PAA §6, aula 66](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/066-hands-on-rag-with-resources.md) · [LangChain §10, aula 60](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/transcricoes/060-chunking-text-splitting.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/06-rag-and-memory-a-comprehensive-dive.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/notas/10-building-a-documentation-assistant-embeddings-vectordbs-retr.md)
**Cursos:** 3

### AGT-014 — Dividir em chunks antes de indexar

**Regra:** divide os documentos em chunks antes de gerar embeddings e indexar, e nunca mandes o documento inteiro para o prompt; o tamanho do chunk é escolhido pelo orçamento de tokens do prompt e ajustado pelos resultados da recuperação.
**Porquê:** recuperar só o trecho relevante é mais barato e mais preciso do que enviar o documento inteiro, que dilui o que interessa; não há um valor de chunk universal.
**Como verificar:** o pipeline de ingestão tem um splitter antes do embedding, e o valor de `chunk_size` está justificado e não copiado de um exemplo.
**Fonte:** [LangChain §10, aula 60](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/transcricoes/060-chunking-text-splitting.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/notas/10-building-a-documentation-assistant-embeddings-vectordbs-retr.md)
**Cursos:** 4

### AGT-015 — Avaliar a relevância antes de gerar

**Regra:** num fluxo de RAG agêntico, um nó avalia com saída estruturada (`yes`/`no`) se os documentos recuperados respondem à pergunta; se não respondem, reescreve a pergunta e volta ao agente em vez de gerar a resposta.
**Porquê:** gerar a partir de contexto fraco produz uma resposta errada com aparência de fundamentada; a reescrita só vale se realimentar o ciclo de decisão.
**Como verificar:** o grafo tem um nó de avaliação entre a recuperação e a geração, com um schema Pydantic de campo binário, e a rota de reescrita liga de volta ao agente.
**Fonte:** [RAG Bootcamp §16, aula 95](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/095-detailed-agentic-rag-implementation-part-2.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/notas/16-agentic-rag.md)
**Cursos:** 2

## Sistemas multi-agente

### AGT-016 — Cada especialista com um só propósito

**Regra:** dá a cada agente ou subagente um objectivo único e só as tools do seu domínio.
**Porquê:** um agente com muitas tools perde precisão na escolha; os especialistas do curso fazem uma coisa e uma só, e é isso que os torna compostáveis.
**Como verificar:** lista as tools de cada agente e confirma que pertencem todas ao mesmo domínio; um agente com tools de domínios distintos divide-se.
**Fonte:** [PAA §8, aula 111](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/111-hands-on-the-supervisor-agent.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/08-multi-agent-systems-with-langgraph-and-langchain.md)
**Cursos:** 3

### AGT-017 — Supervisor com poucos especialistas

**Regra:** um supervisor não gere mais do que cerca de cinco especialistas; acima disso, agrupa-os em departamentos, cada um como subgrafo compilado com o seu próprio routing.
**Porquê:** com uma dezena de especialistas no mesmo prompt a precisão do routing cai, a latência sobe e acrescentar mais um obriga a reescrever o prompt do supervisor; a hierarquia deixa acrescentar um departamento sem tocar nos outros.
**Como verificar:** conta os destinos do `Literal` do supervisor; acima de cinco, exige a divisão em subgrafos.
**Fonte:** [PAA §8, aula 118](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/118-hierarchical-architecture-deep-dive.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/08-multi-agent-systems-with-langgraph-and-langchain.md)
**Cursos:** 3

### AGT-018 — Testar cada peça isoladamente antes de compor

**Regra:** cada tool, subgrafo, agente ou skill é corrido e verificado sozinho antes de entrar no sistema maior.
**Porquê:** cada peça tem de funcionar como entidade própria para poder ser composta; testar só o sistema inteiro esconde qual das peças falhou.
**Como verificar:** existe um teste ou um script de execução por subgrafo ou por tool; uma peça nova que só aparece testada através do grafo completo não passa.
**Fonte:** [PAA §8, aula 119](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/119-hands-on-single-department-in-isolation.md) · [FormClaude §15, aula 137](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/transcricoes/137-por-que-usar-skill.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/08-multi-agent-systems-with-langgraph-and-langchain.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/notas/15-agent-skills-compreenda-como-usar-e-criar-skills.md)
**Cursos:** 4

## Segurança e supervisão

### AGT-019 — Aprovação humana antes de acções críticas

**Regra:** toda a tool que executa uma acção crítica ou irreversível (enviar mensagens, transacções, escrita em base de dados, publicação) pára à espera de aprovação humana, com as decisões de aprovar, editar ou rejeitar; a retoma faz-se com `Command`.
**Porquê:** o agente é autónomo e engana-se — num domínio como o financeiro um erro custa dinheiro real e não há como desfazê-lo.
**Como verificar:** cruza a lista de tools com efeitos externos contra as tools cobertas pela interrupção; qualquer uma de fora é motivo de rejeição. A interrupção precisa de checkpointer (ver AGT-010).
**Fonte:** [RAG Bootcamp §13, aula 67](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/067-human-in-the-loop-middleware-with-langchain.md) · [PAA §7, aula 104](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/104-full-human-in-the-loop-workflow.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/notas/13-updated-langchain-hands-on-with-version-v1.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 7

### AGT-020 — Menor privilégio nas tools e nas credenciais

**Regra:** dá a cada tool e a cada credencial que o agente usa as permissões mínimas para a tarefa — leitura quando não precisa de escrever, acesso só às tabelas ou pastas necessárias.
**Porquê:** o agente tem as permissões das suas tools; com prompt injection ou uma chave comprometida, o atacante herda-as.
**Como verificar:** para cada tool, confirma que a credencial usada não tem mais alcance do que a operação exige; chaves partilhadas entre tools com âmbitos diferentes não passam.
**Fonte:** [LangChain §12, aula 76](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/transcricoes/076-llm-applications-in-production.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/notas/27-agent-security-foundations.md)
**Cursos:** 2

### AGT-021 — Skills e servidores MCP de terceiros são código não confiável

**Regra:** antes de ligar uma skill ou um servidor MCP de terceiros, lê o conteúdo dos scripts e da descrição; usa só fontes verificadas e não aceites estrelas, popularidade ou o rótulo «oficial» como garantia.
**Porquê:** uma skill ou um MCP é código de terceiros que corre na máquina e fica ligado ao agente, podendo ser accionado repetidamente — prova social não é segurança.
**Como verificar:** cada skill ou MCP novo entra com o registo de quem reviu o conteúdo; uma autorização genérica no `CLAUDE.md` que permita correr qualquer skill é motivo de rejeição.
**Fonte:** [LangChain §27, aula 179](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/transcricoes/179-skill-mcp-security-introduction.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/notas/27-agent-security-foundations.md)
**Cursos:** 2

### AGT-022 — Segredos fora do código e fora do contexto

**Regra:** as chaves de API e outros segredos ficam em variáveis de ambiente carregadas de um `.env` fora do controlo de versões, ou num gestor de segredos; nunca no código, em prompts, em specs ou em ficheiros que os agentes lêem.
**Porquê:** o que entra no contexto de um agente vai parar a registos e traços de terceiros sem controlo sobre onde fica guardado; numa demonstração do curso, uma skill leu o `.env` e enviou as chaves para fora.
**Como verificar:** procura literais de chave no diff e confirma que o `.env` está no `.gitignore`; segredos citados em ficheiros de instruções são motivo de rejeição.
**Fonte:** [LangChain §3, aula 18](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/transcricoes/018-setting-up-the-environment-for-a-langchain-search-agent.md) · [LangChain §27, aula 179](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/transcricoes/179-skill-mcp-security-introduction.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/notas/27-agent-security-foundations.md)
**Cursos:** 8

## Observabilidade

### AGT-023 — Tracing activado em tudo o que não é um exemplo isolado

**Regra:** activa o tracing do LangSmith por variáveis de ambiente (`LANGSMITH_TRACING`, `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT`) com um nome de projecto próprio, e consulta o traço antes de atribuir uma falha ao modelo (a aula diz: `LANGCHAIN_TRACING_V2`, `LANGCHAIN_API_KEY` e `LANGCHAIN_PROJECT`; desactualizado).
**Porquê:** o traço mostra o prompt, a decisão de chamar cada tool, os argumentos e os documentos recuperados — é a única forma de ver o que aconteceu dentro do agente.
**Como verificar:** as variáveis estão no `.env.example` e o projecto tem nome próprio; ao investigar um bug, exige-se o link do traço.
**Fonte:** [LangChain §1, aula 13](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/transcricoes/013-integrating-langsmith-for-langchain-application-tracing.md) · [LangChain §10, aula 63](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/transcricoes/063-run-debug-trace-rag-agent.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/notas/10-building-a-documentation-assistant-embeddings-vectordbs-retr.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 7

## Claude Code

### AGT-024 — Skill curta, com gatilho específico e condições de paragem

**Regra:** cada skill trata de um só fluxo, com um gatilho que diz exactamente quando é accionada, os passos em lista numerada e condições de paragem explícitas («se X acontecer, pára e pergunta»).
**Porquê:** skills longas e genéricas aumentam o custo em tokens e diluem o foco; listas numeradas são mais fiáveis do que parágrafos, e sem condições de paragem o agente decide sozinho onde não devia.
**Como verificar:** abre o `SKILL.md`: um ficheiro com vários fluxos, sem passos numerados ou sem condições de paragem é devolvido.
**Fonte:** [FormClaude §15, aula 137](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/transcricoes/137-por-que-usar-skill.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/notas/15-agent-skills-compreenda-como-usar-e-criar-skills.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/ferramentas-agenticas/notas/04-conceitos-essenciais.md)
**Cursos:** 2

### AGT-025 — Tarefa complexa entra numa especificação com checkboxes

**Regra:** divide uma tarefa complexa numa especificação em Markdown com passos em sequência e checkboxes `- [ ]`, cada passo a nomear a skill ou o MCP que usa, em vez de um único prompt grande; o agente marca os passos feitos.
**Porquê:** o agente segue a sequência até ao fim e verifica cada passo, e as checkboxes deixam ver o que já foi feito e retomar o trabalho.
**Como verificar:** a spec tem passos com checkbox e cada um nomeia a skill ou o MCP; um pedido grande sem spec não avança.
**Fonte:** [AIDD-Ferramentas §4, aula 16](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/ferramentas-agenticas/transcricoes/16-especificacao-simples.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/ferramentas-agenticas/notas/04-conceitos-essenciais.md)
**Cursos:** 2
