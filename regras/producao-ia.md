# Regras — IA em produção

Prefixo `IAP`. ## Escolher a abordagem

### IAP-001 — Workflow antes de agente

**Regra:** Antes de construir um agente, escreve a sequência de passos em código determinístico. Só usa um agente quando os passos não se conhecem de antemão.
**Porquê:** Se o caminho pode ser escrito em código, o agente só acrescenta custo, latência e erro; cada passo é uma chamada sequencial ao LLM e o erro compõe-se ao longo da cadeia.
**Como verificar:** Na spec de cada componente com LLM, procura a justificação para ser agente. Se a lista de passos está fixa no código ou na spec, é um workflow e deve ser implementado como tal.
**Cursos:** 2

### IAP-002 — O modelo mais barato que cumpre a tarefa

**Regra:** Escolhe, para cada chamada, o modelo mais barato que cumpre a tarefa; reserva os modelos caros para o trabalho crítico ou aberto.
**Porquê:** A diferença de preço entre modelos da mesma família chega a uma ordem de grandeza, e o modelo mais capaz não é o mais adequado a classificações e tarefas simples.
**Como verificar:** Cada ponto onde se instancia um modelo indica qual e para que tarefa. Um modelo caro em classificação, extracção ou routing é um erro a assinalar.
**Cursos:** 3

## Composição com LangChain

### IAP-003 — LCEL e templates, nunca chains legadas

**Regra:** Compõe as cadeias com o operador `|` (LCEL) e com prompt templates. Não uses `LLMChain`, `SequentialChain` nem `TransformChain`.
**Porquê:** As chains monolíticas estão descontinuadas e o professor desaconselha-as explicitamente; o LCEL é a forma actual e dá a mesma interface (`invoke`, `batch`, `stream`) a prompts, modelos e parsers.
**Como verificar:** No diff, qualquer import de `langchain_classic.chains` ou de uma classe `*Chain` legada é motivo de rejeição; os prompts vêm de `ChatPromptTemplate`, não de f-strings.
**Fonte:** [referência](../docs/langchain-formatos.md)
**Cursos:** 1

### IAP-004 — Limites explícitos em cada modelo

**Regra:** Define `max_tokens`, `timeout` e `max_retries` sempre que instancias um modelo de chat.
**Porquê:** Os tokens de saída são os mais caros e sem limite a resposta cresce sem controlo; o timeout evita pedidos pendurados e o limite de tentativas evita que o cliente repita indefinidamente uma chamada que falha.
**Como verificar:** Toda a instanciação de modelo (`init_chat_model` ou classe do fornecedor) tem os três parâmetros. Um modelo sem `max_tokens` é um erro a assinalar.
**Cursos:** 1

### IAP-005 — Temperatura baixa fora da escrita criativa

**Regra:** Nos modelos que aceitam o parâmetro, usa temperatura entre 0 e 0,3 em routing, classificação, análise, extracção e código, e só passa a valores altos na escrita criativa. Nos modelos que não o aceitam, não o declares (ver LLM-011).
**Porquê:** Valores baixos dão respostas factuais e repetíveis, que é o que uma decisão ou uma extracção precisa; valores altos servem para variedade, não para correcção. Nos modelos da Anthropic lançados depois do Claude Opus 4.6 o parâmetro deixou de ser aceite: só 1,0 passa, e qualquer outro valor devolve erro 400.
**Como verificar:** Cada modelo com temperatura acima de 0,3 tem de estar num nó de escrita; nos nós de decisão, a temperatura é 0 nos modelos que a aceitam e está ausente nos que não a aceitam.
**Fonte:** [decisão D-AV04](../docs/decisoes/g6-avaliacao-e-prompts.md)
**Cursos:** 2

### IAP-006 — Saída estruturada validada, nunca parsing de texto

**Regra:** Obtém do LLM qualquer dado que o código vá usar através de um schema Pydantic — `with_structured_output(Schema)` fora de agentes, `response_format=Schema` no `create_agent` (a aula diz: `PydanticOutputParser` com instruções de formato no prompt; desactualizado). Não extraias campos de texto livre com regex.
**Porquê:** O parsing de texto parte-se com um único token mal formado, enquanto a chamada de função devolve JSON organizado e validado; mesmo uma resposta correcta no formato errado rebenta o que vem a jusante.
**Como verificar:** Nenhuma resposta de LLM é lida com `re`, `split` ou `json.loads` sobre texto livre. Cada ponto de consumo tem uma classe Pydantic associada.
**Fonte:** [referência](../docs/langchain-formatos.md)
**Cursos:** 2

## Grafos e agentes com LangGraph

### IAP-007 — LangGraph só quando o fluxo precisa dele

**Regra:** Usa LangGraph quando o fluxo tiver estado entre passos, routing condicional, ciclos de auto-correcção, recuperação de falhas ou aprovação humana. Para perguntas de um só passo e pipelines RAG simples, fica pela cadeia LCEL.
**Porquê:** Uma cadeia linear não guarda estado, não decide caminhos nem recupera de uma falha; um grafo para um fluxo de um passo só acrescenta estrutura sem benefício.
**Como verificar:** Cada `StateGraph` do projecto corresponde a pelo menos um dos critérios acima, declarado na spec. Um grafo de um nó em linha recta é um erro a assinalar.
**Cursos:** 1

### IAP-008 — Reducer em todos os campos com várias escritas

**Regra:** Dá um reducer a cada campo do estado em que mais do que um nó escreve; nas mensagens usa sempre `add_messages` e nunca `operator.add`.
**Porquê:** Sem reducer o comportamento por omissão é substituir, e o trabalho dos nós anteriores desaparece; o `add_messages` junta por ID, que é o que as respostas de ferramentas exigem, enquanto o `operator.add` só concatena listas simples.
**Como verificar:** No `TypedDict` do estado, todo o campo escrito por dois ou mais nós está `Annotated` com um reducer. Um campo `messages` com `operator.add` é um erro a assinalar.
**Fonte:** [referência](../docs/langchain-formatos.md)
**Cursos:** 1

### IAP-009 — Contador e máximo em todos os ciclos

**Regra:** Guarda no estado um contador de iterações e um máximo, e verifica o máximo na função de routing antes de voltar a entrar no ciclo.
**Porquê:** Sem esse travão o ciclo pode correr para sempre, e um ciclo de qualidade que não converge gasta tokens e tempo sem limite.
**Como verificar:** Toda a aresta condicional que aponta para um nó anterior tem, na função de routing, uma comparação com o máximo de iterações guardado no estado.
**Cursos:** 1

### IAP-010 — Checkpointer persistente e `thread_id` por conversa

**Regra:** Compila os grafos com um checkpointer persistente (`SqliteSaver` em desenvolvimento, `PostgresSaver` em produção) e identifica cada conversa ou execução com o seu `thread_id`. O `InMemorySaver` fica para testes.
**Porquê:** Sem persistência cada invocação é sem estado: não há memória de conversa, uma falha perde todo o progresso e não é possível pausar para revisão humana; o saver em memória perde tudo ao reiniciar o processo.
**Como verificar:** Nenhum `compile()` de um grafo com conversa ou aprovação fica sem `checkpointer`, e todas as invocações passam `config={"configurable": {"thread_id": ...}}`. Um `InMemorySaver` fora dos testes é um erro a assinalar.
**Fonte:** [referência](../docs/langchain-formatos.md)
**Cursos:** 1

### IAP-011 — Aprovação humana antes de acções irreversíveis

**Regra:** Interrompe a execução e pede confirmação humana antes de qualquer acção com efeito exterior difícil de reverter (enviar mensagens, escrever em sistemas de terceiros, gastar dinheiro). No agente usa `HumanInTheLoopMiddleware`; num grafo próprio usa `interrupt()` e retoma com `Command(resume=...)` (a aula diz: `interrupt_before` na compilação do grafo, `update_state` e `invoke(None, config)`; desactualizado).
**Porquê:** Por muito capaz que o agente seja, num fluxo de produção quer-se um humano a dar o aval final antes do efeito acontecer.
**Como verificar:** Lista as acções com efeito exterior; cada uma está atrás de um ponto de interrupção. Uma tool que escreve fora do projecto sem paragem de aprovação é um erro a assinalar.
**Fonte:** [referência](../docs/langchain-formatos.md)
**Cursos:** 1

## Ferramentas

### IAP-012 — Cada tool diz o que faz e quando deve ser usada

**Regra:** Dá a cada tool uma descrição explícita do que faz e em que situação deve ser chamada, e descreve os argumentos.
**Porquê:** É pela descrição, e só por ela, que o modelo decide se chama a tool; uma descrição vaga ou ausente leva-o a escolher mal ou a responder sem a usar.
**Como verificar:** Nenhuma tool fica com descrição gerada automaticamente ou com uma linha genérica. A docstring diz a função e o critério de uso.
**Cursos:** 1

### IAP-013 — As tools devolvem o erro, não o levantam

**Regra:** Trata os erros dentro da tool e devolve uma string que os explica; não deixes a excepção propagar para o grafo.
**Porquê:** Uma excepção derruba o grafo inteiro, enquanto uma string de erro volta ao modelo, que a lê, percebe o que falhou e explica-o ao utilizador em linguagem natural. A tool é a fronteira com o mundo exterior e é aí que os erros se tratam.
**Como verificar:** Toda a função decorada com `@tool` tem `try/except` (ou validação prévia) e devolve texto em caso de falha. Um `raise` no corpo de uma tool é um erro a assinalar.
**Cursos:** 1

## RAG e memória

### IAP-014 — Responder só pelo contexto e admitir que não sabe

**Regra:** Em qualquer prompt de RAG, manda o modelo responder apenas com base no contexto fornecido e dizer explicitamente que não tem essa informação quando o contexto não a contém.
**Porquê:** Sem essa instrução o modelo inventa uma resposta plausível em vez de admitir a falta de contexto, porque tende a "ser útil" a todo o custo.
**Como verificar:** O template de RAG contém as duas instruções. Há um teste com uma pergunta fora da base de conhecimento que espera a resposta de "não sei".
**Cursos:** 1

### IAP-015 — Fonte em cada excerto e na resposta

**Regra:** Inclui a origem de cada excerto no contexto que vai para o prompt e devolve as fontes junto com a resposta, também quando ela vem da cache.
**Porquê:** Citar a origem deixa o utilizador verificar o que foi dito e é o que torna a resposta auditável.
**Como verificar:** A função que formata os documentos escreve a fonte de cada um, e o schema da resposta tem um campo de fontes preenchido em todos os caminhos, incluindo o de cache.
**Cursos:** 2

### IAP-016 — Histórico de conversa limitado (API a confirmar)

**Regra:** Limita o histórico que vai em cada chamada, com um máximo de tokens explícito, mantendo sempre as mensagens de sistema e sem mensagens partidas a meio (`trim_messages` com `max_tokens`, `include_system=True` e `allow_partial=False`).
**Porquê:** Um buffer que cresce sem limite aumenta o custo a cada turno e acaba por ultrapassar a janela de contexto.
**Como verificar:** No caminho que monta as mensagens de uma conversa existe um passo de corte com limite numérico. Um histórico passado inteiro ao modelo é um erro a assinalar.
**Cursos:** 1

## Resiliência

### IAP-017 — Retry limitado com circuit breaker

**Regra:** Limita o número de tentativas, espaça-as com backoff exponencial e põe um circuit breaker à frente: ao fim de N falhas seguidas, falha de imediato durante um tempo de recuperação e volta a testar com um único pedido.
**Porquê:** O retry resolve erros transitórios, mas quando o serviço está mesmo em baixo só faz cada utilizador esperar vários segundos por um erro e multiplica a carga sobre um serviço já caído.
**Como verificar:** Toda a chamada externa com retry tem um máximo de tentativas e espera crescente. Um `while True` de tentativas, ou um retry sem disjuntor à volta de um serviço partilhado, é um erro a assinalar.
**Cursos:** 2

### IAP-018 — Cadeia de fallback entre modelos

**Regra:** Define uma ordem de modelos alternativos, cada um com o seu timeout, e percorre-a até um responder; só quando todos falham é que o erro sobe.
**Porquê:** Assim o sistema degrada-se em qualidade em vez de falhar quando um fornecedor está indisponível ou em rate limit.
**Como verificar:** O ponto de chamada ao LLM percorre uma lista de modelos e regista qual foi usado. Uma chamada a um único modelo sem alternativa é um erro a assinalar em caminhos críticos.
**Cursos:** 1

## Observabilidade e testes

### IAP-019 — Tracing desde a primeira chamada

**Regra:** Liga o tracing (`LANGSMITH_TRACING=true`, `LANGSMITH_API_KEY` e `LANGSMITH_PROJECT`) no início do projecto e instrumenta todas as chamadas e nós, não só depois de algo falhar.
**Porquê:** Uma resposta errada de um LLM não deixa stack trace; sem traces depura-se a adivinhar pela saída final, e não se vê onde foram os tokens nem o tempo.
**Como verificar:** As variáveis de tracing estão no `.env.example` e a documentação diz onde ver os traces. Cada função que chama o modelo ou corre um nó aparece no trace.
**Fonte:** [referência](../docs/langchain-formatos.md)
**Cursos:** 2

### IAP-020 — Testes unitários com o modelo falso e asserções por conteúdo

**Regra:** Escreve os testes unitários com um modelo falso injectado no lugar do real, sem chamadas de rede, e deixa o LLM real só para os testes de integração. Nas respostas geradas, verifica se contêm o que é esperado, em vez de comparar por igualdade.
**Porquê:** As respostas do modelo são probabilísticas: duas respostas correctas podem ter redacções diferentes, e testes com o LLM real a cada commit são lentos e caros.
**Como verificar:** O código que chama o modelo recebe-o por injecção de dependência. Nenhum teste da suite rápida precisa de chave de API, e não há asserções de igualdade sobre texto gerado.
**Fonte:** [referência](../docs/langchain-formatos.md)
**Cursos:** 1

## Segurança

### IAP-021 — Menor privilégio nas tools

**Regra:** Dá a cada tool apenas as permissões que a sua função exige: acesso de leitura quando só lê, e só aos dados de que precisa.
**Porquê:** Um agente é um alvo de prompt injection e de roubo de chaves; quem toma conta do prompt fica com tudo aquilo a que as tools têm acesso.
**Como verificar:** Cada tool tem as credenciais e o âmbito documentados. Uma tool de consulta com credenciais de escrita, ou com acesso à base de dados inteira, é um erro a assinalar.
**Cursos:** 1

### IAP-022 — Chaves fora do repositório

**Regra:** Guarda as chaves num `.env` coberto pelo `.gitignore`, versiona só um `.env.example` sem valores, e configura os valores reais na plataforma de deploy.
**Porquê:** Uma chave commitada fica exposta e não se apaga do histórico; o exemplo versionado documenta o que é preciso configurar sem revelar nada.
**Como verificar:** O `.gitignore` cobre `.env`, existe `.env.example` com todas as variáveis, e nenhum diff traz uma chave literal nem um ficheiro de configuração com segredos.
**Cursos:** 1
