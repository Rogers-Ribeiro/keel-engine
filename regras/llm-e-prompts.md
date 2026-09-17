# Regras — LLMs e engenharia de prompts

Prefixo `LLM`. Regras confirmadas nas transcrições a 2026-09-17. Síntese de origem: [llm-e-prompts](https://github.com/Rogers-Ribeiro/keel/blob/main/conhecimento/llm-e-prompts.md). Decisões pendentes: [revisão](_revisao/llm-e-prompts.md).

## Escrita de prompts

### LLM-001 — Prompt específico, com objectivo e quantidades

**Regra:** Escreve cada prompt com o objectivo declarado e com as quantidades e os limites explícitos (quantos itens, que tamanho, que âmbito), em vez de um tema aberto.
**Porquê:** Um pedido aberto deixa o modelo escolher o que responder e devolve texto genérico; com objectivo e quantidades a resposta fica direccionada e comparável entre execuções.
**Como verificar:** Nenhum prompt do projecto começa por um tema solto ("fala sobre X"); cada um diz o que é para produzir e com que dimensão.
**Fonte:** [Agentes IA §7, aula 51](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/transcricoes/051-boas-praticas-de-promting-i.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/notas/07-engenharia-de-prompts-na-pratica-python-e-groq.md) · [IA na Prática §60, aula 622](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/formacao-engenheiro-de-ia-generativa-ia-na-pratica/transcricoes/622-caracteristicas-de-prompt.md) · [LangChain §11, aula 73](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/transcricoes/073-prompt-engineering-quick-tips.md)
**Cursos:** 3

### LLM-002 — Dados entre delimitadores

**Regra:** Passa os dados variáveis (documentos, registos, resultados de ferramentas) dentro de delimitadores explícitos, separados do bloco de instruções.
**Porquê:** Num texto único o modelo não distingue o que é instrução do que é conteúdo a tratar e mistura os dois na resposta.
**Como verificar:** Nos prompts com dados injectados, o conteúdo aparece entre marcas (tags XML ou rótulos de abertura e fecho) e as instruções ficam fora dessas marcas.
**Fonte:** [Agentes IA §7, aula 51](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/transcricoes/051-boas-praticas-de-promting-i.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/notas/07-engenharia-de-prompts-na-pratica-python-e-groq.md)
**Cursos:** 1

### LLM-003 — Formato de saída declarado no prompt

**Regra:** Declara no prompt o formato exacto da resposta: o número de itens, o modelo de cada linha e, quando é para consumo automático, o formato de ficheiro (JSON, CSV, Markdown).
**Porquê:** O modelo devolve o formato que lhe for pedido; sem essa indicação a resposta muda de execução para execução e obriga a tratamento manual.
**Como verificar:** Cada prompt tem uma secção de formato; nenhum depende do formato que o modelo escolher por si.
**Fonte:** [Agentes IA §7, aula 51](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/transcricoes/051-boas-praticas-de-promting-i.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/notas/07-engenharia-de-prompts-na-pratica-python-e-groq.md) · [IA na Prática §60, aula 622](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/formacao-engenheiro-de-ia-generativa-ia-na-pratica/transcricoes/622-caracteristicas-de-prompt.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/formacao-engenheiro-de-ia-generativa-ia-na-pratica/notas/60-introducao-a-engenharia-de-prompt.md)
**Cursos:** 2

### LLM-004 — System prompt com identidade, âmbito e princípios

**Regra:** Escreve cada mensagem de sistema com identidade concreta (papel e domínio), âmbito (o que está dentro e fora), e princípios de decisão que se apliquem a muitos casos; não a escrevas como árvore de condições "se X então Y" nem com frases genéricas como "és um assistente útil".
**Porquê:** Não é possível enumerar todos os casos, e um prompt vago deixa o modelo adivinhar o que é certo, com comportamento diferente a cada execução; a identidade e o âmbito estabelecem os limites e os princípios cobrem os casos não previstos.
**Como verificar:** Cada system prompt tem papel e domínio concretos, diz o que não trata, e as instruções são princípios reutilizáveis em vez de uma lista de condições por caso.
**Fonte:** [LangChain §11, aula 75](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/transcricoes/075-context-engineering-a-system-prompt.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/notas/11-prompt-engineering-theory.md) · [Agentes IA §7, aula 49](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/transcricoes/049-compreendendo-as-roles.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/notas/07-engenharia-de-prompts-na-pratica-python-e-groq.md)
**Cursos:** 2

### LLM-005 — Exemplos no prompt quando o zero-shot falha

**Regra:** Quando um prompt sem exemplos não devolve o formato ou a classificação certos, acrescenta um ou mais pares entrada→saída no prompt antes de mudar de modelo ou de reescrever tudo.
**Porquê:** Os exemplos mostram ao modelo o formato e o critério esperados; nos exemplos dos cursos, a mesma pergunta classificada sem exemplos saiu errada e com exemplos saiu alinhada.
**Como verificar:** Os prompts de classificação, extracção e conversão de formato do projecto trazem exemplos; uma alteração que os retire mostra a comparação com e sem exemplos.
**Fonte:** [Agentes IA §7, aula 54](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/transcricoes/054-usando-a-tecnica-few-shot.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/notas/07-engenharia-de-prompts-na-pratica-python-e-groq.md) · [IA na Prática §60, aula 623](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/formacao-engenheiro-de-ia-generativa-ia-na-pratica/transcricoes/623-tecnicas-de-prompts.md) · [LangChain §11, aula 70](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/transcricoes/070-few-shot-prompting.md)
**Cursos:** 3

### LLM-006 — Passos numerados nas tarefas de várias etapas

**Regra:** Nas tarefas que envolvem várias etapas ou cálculo, escreve no prompt os passos numerados que o modelo deve seguir e pede a resposta organizada por esses passos.
**Porquê:** Com os passos declarados o raciocínio fica visível e verificável passo a passo, e o modelo deixa de saltar directamente para uma conclusão.
**Como verificar:** Os prompts de análise, cálculo ou planeamento listam os passos; a saída correspondente vem separada por esses mesmos passos.
**Fonte:** [Agentes IA §7, aula 55](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/transcricoes/055-usando-multi-passos.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/notas/07-engenharia-de-prompts-na-pratica-python-e-groq.md) · [IA na Prática §60, aula 623](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/formacao-engenheiro-de-ia-generativa-ia-na-pratica/transcricoes/623-tecnicas-de-prompts.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/formacao-engenheiro-de-ia-generativa-ia-na-pratica/notas/60-introducao-a-engenharia-de-prompt.md)
**Cursos:** 2

### LLM-007 — Prompt template com variáveis nomeadas (API a confirmar)

**Regra:** Constrói os prompts parametrizados com um prompt template de variáveis nomeadas, definido uma vez e reutilizado, em vez de montar a string com concatenação em cada chamada.
**Porquê:** O template encapsula a estrutura do prompt num só sítio e permite executá-lo muitas vezes com valores diferentes, sem reescrever o texto em cada chamada.
**Como verificar:** Não há prompts montados por concatenação no código de negócio; cada prompt reutilizado existe uma só vez, com as variáveis nomeadas.
**Fonte:** [Production §3, aula 23](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/023-prompt-templates-and-messages-deep-dive.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/03-langchain-foundations-a-deep-dive.md) · [LangChain §2, aula 9](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/transcricoes/009-langchain-fundamentals-prompt-templates-chatmodels-and-chains.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/notas/02-the-gist-of-langchain-get-started-by-with-your-hello-world-c.md)
**Cursos:** 2

## Saída estruturada e ferramentas

### LLM-008 — Esquema validado para a saída consumida por código

**Regra:** Quando a resposta do modelo é consumida por código, pede-a como esquema Pydantic com descrição por campo, pela saída estruturada do fornecedor (`with_structured_output` fora de agentes, `response_format` no `create_agent`), e não por texto livre tratado à mão.
**Porquê:** O esquema obriga o modelo a devolver os campos esperados e valida-os à chegada; uma string que parece JSON não é iterável nem verificada, e um token a mais parte o fluxo.
**Como verificar:** Cada chamada cujo resultado alimenta código tem um esquema associado; não há `json.loads` nem expressões regulares sobre a resposta do modelo.
**Fonte:** [Production §3, aula 26](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/026-hands-on-why-output-parsers-and-structured-outputs.md) · [RAG Bootcamp §13, aula 63](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/063-llm-structured-output-with-langchain-using-pydantic.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/notas/13-updated-langchain-hands-on-with-version-v1.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 3

### LLM-009 — Decisões do modelo por function calling, não por texto

**Regra:** Faz com que as decisões do modelo sobre que ferramenta chamar cheguem ao código como chamadas de ferramenta estruturadas, e não como texto num formato combinado que o código tem de interpretar.
**Porquê:** O formato de texto do prompt ReAct não é fiável: o modelo produz saídas difíceis de interpretar e o programa falha; a chamada de ferramenta devolve nome e argumentos organizados, prontos a converter num objecto.
**Como verificar:** Não há código que extraia a acção e os argumentos do texto da resposta; o fluxo lê as chamadas de ferramenta devolvidas pelo modelo.
**Fonte:** [LangChain §8, aula 41](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/transcricoes/041-theory-understanding-function-calling-for-llms.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/notas/08-function-calling.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 1

### LLM-010 — Ferramenta com docstring e tipos

**Regra:** Dá a cada ferramenta um nome descritivo, anotações de tipo nos argumentos e uma docstring que diga o que faz e em que situação se usa.
**Porquê:** É a partir desse esquema e dessa docstring que o modelo percebe a funcionalidade da ferramenta e decide chamá-la; sem eles, escolhe mal ou ignora-a.
**Como verificar:** Nenhuma ferramenta registada no agente está sem docstring ou sem tipos nos argumentos.
**Fonte:** [RAG Bootcamp §13, aula 61](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/061-tools-in-langchain.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/notas/13-updated-langchain-hands-on-with-version-v1.md) · [LangChain §5, aula 28](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/transcricoes/028-writing-tools.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 2

## Modelo, parâmetros e custo

### LLM-011 — Temperatura baixa nas tarefas factuais

**Regra:** Nos modelos que aceitam o parâmetro, usa temperatura 0 (ou até 0,3) nas tarefas factuais, de extracção, de classificação e de avaliação, e reserva os valores altos para as tarefas em que a variedade é o objectivo. Confirma primeiro se o modelo aceita o parâmetro: há modelos que não aceitam, e nesses não o declares — a repetibilidade obtém-se pelo prompt e pela saída estruturada.
**Porquê:** A temperatura controla a aleatoriedade da geração: perto de 0 o resultado é determinista e repetível; acima disso a mesma entrada dá respostas diferentes, o que numa tarefa factual é ruído. Mas o parâmetro deixou de ser universal: nos modelos da Anthropic lançados depois do Claude Opus 4.6, só 1,0 é aceite e qualquer outro valor devolve erro 400, pelo que a instrução "declara sempre a temperatura" passaria a partir o código em vez de o melhorar.
**Como verificar:** Cada instanciação de um modelo que aceite o parâmetro declara a temperatura, e nenhuma tarefa factual ou de avaliação corre com valor alto; nos modelos que não o aceitam, o parâmetro está ausente do código.
**Fonte:** [Production §3, aula 19](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/019-model-configuration-and-cost-optimization-strategies.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/03-langchain-foundations-a-deep-dive.md) · [Agentes IA §7, aula 50](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/transcricoes/050-compreendendo-os-parametros.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/notas/07-engenharia-de-prompts-na-pratica-python-e-groq.md) · [decisão D-AV04](../docs/decisoes/g6-avaliacao-e-prompts.md)
**Cursos:** 2

### LLM-012 — Limite de tokens, timeout e tentativas em cada modelo (API a confirmar)

**Regra:** Define, em cada instanciação de modelo de chat, o limite de tokens de saída, o timeout do pedido e o número máximo de tentativas.
**Porquê:** O limite de tokens trava o tamanho e o custo da resposta, o timeout evita pedidos pendurados e o número de tentativas cobre falhas transitórias do fornecedor sem repetir indefinidamente.
**Como verificar:** Nenhuma instanciação de modelo fica só com o nome do modelo e a temperatura; os três parâmetros estão presentes ou vêm de uma configuração central.
**Fonte:** [Production §3, aula 19](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/019-model-configuration-and-cost-optimization-strategies.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/03-langchain-foundations-a-deep-dive.md) · [LangChain §24, aula 161](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/transcricoes/161-chatmodels.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/notas/24-langchain-glossary.md)
**Cursos:** 2

### LLM-013 — Modelo mais barato que cumpre a tarefa

**Regra:** Escolhe para cada tarefa o modelo mais barato que a cumpre, e justifica a subida para um modelo maior com o resultado de uma avaliação (LLM-018).
**Porquê:** A diferença de preço entre variantes da mesma família chega a ser de uma ordem de grandeza por milhão de tokens, e muitas tarefas não precisam da variante cara.
**Como verificar:** O módulo de modelos indica o modelo por tipo de tarefa; qualquer uso de um modelo mais caro tem a avaliação que o justifica registada.
**Fonte:** [Production §3, aula 19](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/019-model-configuration-and-cost-optimization-strategies.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/03-langchain-foundations-a-deep-dive.md)
**Cursos:** 1

### LLM-014 — Fornecedor isolado num só ponto

**Regra:** Instancia os modelos num só módulo, com uma função de inicialização independente do fornecedor (`init_chat_model`), e não importes SDKs de fornecedores no código de negócio.
**Porquê:** Com a instanciação isolada troca-se de modelo ou de fornecedor, e comparam-se modelos entre si, sem reescrever o resto do código; um SDK de fornecedor no código de negócio prende a aplicação a esse fornecedor.
**Como verificar:** Só o módulo de modelos importa classes de chat ou SDKs de fornecedores; trocar o modelo por omissão implica alterar um ficheiro.
**Fonte:** [Production §3, aula 20](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/020-working-with-llms-in-langchain-multi-providers-configuration.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/03-langchain-foundations-a-deep-dive.md) · [Agentes IA §19, aula 138](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/transcricoes/138-o-que-e-o-langchain.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 2

## Histórico e memória

### LLM-015 — Histórico persistido por conversa

**Regra:** Guarda o histórico de cada conversa num checkpointer, identificado por `thread_id`, e usa em produção um checkpointer persistente (`PostgresSaver`); não mantenhas o histórico numa estrutura global do processo.
**Porquê:** O modelo não guarda estado entre chamadas: o que der contexto à pergunta seguinte tem de ser reenviado e, por isso, tem de estar guardado e separado por conversa.
**Como verificar:** Cada invocação passa o identificador da conversa; o código de produção não usa um checkpointer em memória nem uma lista global de mensagens.
**Fonte:** [LangChain §24, aula 167](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/transcricoes/167-langchain-memory-theory-deepdive-langgraph.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/notas/24-langchain-glossary.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 1

### LLM-016 — Histórico antigo cortado ou sumarizado

**Regra:** Define para cada conversa longa uma estratégia explícita de redução do histórico — cortar as mensagens antigas por número de tokens ou de mensagens, ou substituí-las por um resumo e manter as últimas — em vez de reenviar tudo.
**Porquê:** Reenviar a conversa inteira gasta tokens, aumenta a latência e o custo, e leva contexto irrelevante ao modelo, que piora a resposta.
**Como verificar:** O fluxo de conversa tem um ponto onde o histórico é cortado ou resumido, com um limite declarado; não há caminho em que todas as mensagens sejam enviadas sem limite.
**Fonte:** [LangChain §24, aula 167](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/transcricoes/167-langchain-memory-theory-deepdive-langgraph.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/notas/24-langchain-glossary.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 1

## Observabilidade e avaliação

### LLM-017 — Tracing ligado

**Regra:** Liga o tracing do LangSmith no desenvolvimento, pelas variáveis `LANGSMITH_*`, e inspecciona o prompt, as chamadas de ferramenta e a resposta registados antes de concluir que um comportamento está errado.
**Porquê:** Sem tracing só se vê a resposta final; o registo mostra o prompt que foi realmente enviado, as decisões pelo caminho, o tempo e os tokens de cada execução.
**Como verificar:** O `.env.example` traz as variáveis `LANGSMITH_*` e um nome de projecto; os relatos de comportamento errado referem a execução registada.
**Fonte:** [LangChain §2, aula 13](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/transcricoes/013-integrating-langsmith-for-langchain-application-tracing.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/notas/02-the-gist-of-langchain-get-started-by-with-your-hello-world-c.md) · [RAG Bootcamp §26, aula 119](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/119-evaluation-of-chatbots-defining-metrics-llm-as-a-judge.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 2

### LLM-018 — Alterações de prompt ou de modelo avaliadas contra um dataset

**Regra:** Mantém um dataset de exemplos de referência e avaliadores automáticos, e corre-os antes de dar por boa uma troca de modelo, de prompt ou de parâmetros.
**Porquê:** Sem dataset e avaliadores, a comparação é feita sobre uma ou duas respostas escolhidas à mão; com eles, a mesma entrada é medida com o mesmo critério em todos os candidatos.
**Como verificar:** Existe um dataset versionado e um script de avaliação; cada alteração ao prompt, ao modelo ou aos parâmetros traz o resultado dessa avaliação.
**Fonte:** [RAG Bootcamp §26, aula 119](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/119-evaluation-of-chatbots-defining-metrics-llm-as-a-judge.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/notas/26-chatbot-and-rag-evaluation.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 1
