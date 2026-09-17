# Regras — RAG (geração aumentada por recuperação)

Prefixo `RAG`. Regras confirmadas nas transcrições a 2026-09-17. Síntese de origem: [rag](../conhecimento/rag.md). Decisões pendentes: [revisão](_revisao/rag.md).

## Âmbito e pipeline

### RAG-001 — RAG para conhecimento próprio e que muda

**Regra:** Para dar ao modelo conhecimento de documentos internos ou de informação que é actualizada com frequência, usa RAG; não proponhas treino nem fine-tuning.
**Porquê:** O fine-tuning fixa o conhecimento nos pesos e obriga a re-treinar a cada actualização, com custo de GPU e de dados de treino; o RAG mantém a informação actual sem treino nenhum.
**Como verificar:** Uma spec que peça fine-tuning para "ensinar os documentos da empresa" ao modelo está errada; o plano deve descrever indexação e recuperação.
**Fonte:** [RAG Bootcamp §2, aula 5](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/005-prompt-engineering-vs-finetuning-vs-rag.md) · [nota](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/notas/02-introduction-to-rag.md)
**Cursos:** 6

### RAG-002 — Só os chunks recuperados vão no prompt

**Regra:** Envia ao LLM apenas os chunks recuperados para a pergunta, nunca o documento ou a base inteira, mesmo quando a janela de contexto parece dar para isso.
**Porquê:** Todos os modelos têm limite de contexto e o contexto irrelevante degrada a resposta e aumenta o custo.
**Como verificar:** Procura no diff chamadas que passem o texto completo de um ficheiro ao prompt em vez do resultado do retriever.
**Fonte:** [Production Agents §5, aula 43](../cursos/production-ai-agents/transcricoes/043-why-chunking-matters-and-text-splitting-deep-dive.md) · [RAG Bootcamp §5, aula 12](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/012-text-splitting-techniques.md) · [nota](../cursos/production-ai-agents/notas/05-document-loading-chunking-embeddings-loaders-splitters-vecto.md)
**Cursos:** 7

### RAG-003 — Ingestão separada da consulta

**Regra:** Mantém a ingestão (carregar, dividir, gerar embeddings, escrever no índice) num módulo próprio, separado do código que responde a perguntas, e corre-a quando as fontes mudam.
**Porquê:** A indexação faz-se uma vez e a consulta a cada pergunta; separá-las evita reindexar a cada pedido e permite reindexar sem tocar na aplicação.
**Como verificar:** Deve existir um módulo de ingestão invocável à parte; nenhum caminho da resposta ao utilizador deve carregar ficheiros nem chamar o splitter.
**Fonte:** [LangChain §16, aula 114](../cursos/langchain/transcricoes/114-code-structure.md) · [nota](../cursos/langchain/notas/16-agentic-rag.md) · [nota Eng. IA §21](../cursos/formacao-engenheiro-de-ia-generativa-ia-na-pratica/notas/21-rag-no-n8n.md)
**Cursos:** 2

## Ingestão e chunking

### RAG-004 — Tudo vira `Document` com a origem na metadata

**Regra:** Converte o que sai de qualquer loader em `Document` com `page_content` e `metadata`, e garante que a metadata de cada chunk identifica a origem (ficheiro, página, URL ou linha).
**Porquê:** A metadata é o que permite filtrar a pesquisa, citar a fonte na resposta e depurar de onde veio um trecho; o vector guarda só o significado, não a proveniência.
**Como verificar:** Depois do split, todos os chunks têm uma chave de origem preenchida; nenhum `Document` é construído com `metadata` vazia.
**Fonte:** [RAG Bootcamp §5, aula 10](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/010-document-structure-in-langchain.md) · [nota](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/notas/05-data-ingestion-and-data-parsing-techniques.md) · [nota Production Agents §5](../cursos/production-ai-agents/notas/05-document-loading-chunking-embeddings-loaders-splitters-vecto.md)
**Cursos:** 5

### RAG-005 — `chunk_overlap` maior do que zero, verificado nos chunks

**Regra:** Configura sempre `chunk_overlap` maior do que zero e confirma o efeito imprimindo o fim de um chunk e o início do seguinte sobre texto real.
**Porquê:** Sem sobreposição, uma frase cortada na fronteira deixa de ser recuperável; e com separadores que cortam "limpo" o overlap configurado pode não produzir sobreposição nenhuma sem ninguém dar por isso.
**Como verificar:** O splitter tem `chunk_overlap > 0` e existe uma verificação (teste ou saída de inspecção) que mostra texto repetido entre chunks consecutivos.
**Fonte:** [Production Agents §5, aula 46](../cursos/production-ai-agents/transcricoes/046-hands-on-overlap-importance-in-code.md) · [RAG Bootcamp §5, aula 12](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/012-text-splitting-techniques.md) · [nota](../cursos/production-ai-agents/notas/05-document-loading-chunking-embeddings-loaders-splitters-vecto.md)
**Cursos:** 5

### RAG-006 — Splitter escolhido pelo tipo de conteúdo (API a confirmar)

**Regra:** Usa `RecursiveCharacterTextSplitter` por omissão para texto e `RecursiveCharacterTextSplitter.from_language(Language.PYTHON)` para código; não dividas código com um splitter genérico.
**Porquê:** O recursivo tenta parágrafo, linha, espaço e carácter por esta ordem, em vez de cortar num único separador; a variante por linguagem conhece a sintaxe e mantém funções e classes inteiras, que é o que torna o chunk recuperado utilizável.
**Como verificar:** Nenhum `CharacterTextSplitter` sobre texto corrido; qualquer ingestão de ficheiros de código passa por `from_language`.
**Fonte:** [Production Agents §5, aula 48](../cursos/production-ai-agents/transcricoes/048-hands-on-code-splitter.md) · [RAG Bootcamp §5, aula 12](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/012-text-splitting-techniques.md) · [nota](../cursos/production-ai-agents/notas/05-document-loading-chunking-embeddings-loaders-splitters-vecto.md)
**Cursos:** 3

## Embeddings e índice

### RAG-007 — O mesmo modelo de embeddings na indexação e na query

**Regra:** Usa o mesmo modelo de embeddings para indexar e para embeber a pergunta, e cria o índice com a dimensão desse modelo.
**Porquê:** Vectores de modelos diferentes não são comparáveis e, se as dimensões não coincidirem, a escrita no índice falha (1536 contra 512, num dos cursos).
**Como verificar:** Há um só sítio onde o modelo de embeddings é instanciado, partilhado pela ingestão e pela consulta; a dimensão declarada na criação do índice é a do modelo.
**Fonte:** [LangChain §10, aula 62](../cursos/langchain/transcricoes/062-retrieval-agent-implementation.md) · [Eng. IA §21, aula 189](../cursos/formacao-engenheiro-de-ia-generativa-ia-na-pratica/transcricoes/189-enviando-arquivos-para-o-pinecone.md) · [RAG Bootcamp §7, aula 36](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/036-working-with-pinecone-vectorstore-db.md) · [nota](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/notas/06-vector-embedding-and-vector-databases.md)
**Cursos:** 3

### RAG-008 — Modelo de embeddings escolhido explicitamente

**Regra:** Declara o modelo de embeddings no código em vez de confiar no valor por omissão: `text-embedding-3-small` para uso geral e `text-embedding-3-large` quando a precisão é crítica; não uses `text-embedding-ada-002`.
**Porquê:** O `ada-002` é a geração anterior, mantida só para aplicações antigas; deixar o modelo implícito faz com que uma mudança de omissão no pacote invalide o índice já construído.
**Como verificar:** A instanciação do modelo de embeddings tem o nome do modelo escrito; nenhuma ocorrência de `ada-002`.
**Fonte:** [RAG Bootcamp §6, aula 22](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/022-getting-started-with-openai-embeddings.md) · [nota](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/notas/06-vector-embedding-and-vector-databases.md) · [nota Production Agents §5](../cursos/production-ai-agents/notas/05-document-loading-chunking-embeddings-loaders-splitters-vecto.md)
**Cursos:** 2

### RAG-009 — Índice persistido e embeddings em cache (API a confirmar)

**Regra:** Persiste o índice em disco e volta a carregá-lo no arranque; põe os embeddings já calculados em cache em vez de os pedir outra vez à API.
**Porquê:** Recalcular embeddings a cada execução é lento e paga-se por chamada; uma vez gerado, o índice carrega-se em vez de se reconstruir.
**Como verificar:** O código de arranque carrega o índice existente e só indexa o que falta; não há chamadas ao modelo de embeddings no caminho de arranque quando o índice já existe.
**Fonte:** [Production Agents §5, aula 61](../cursos/production-ai-agents/transcricoes/061-hands-on-chroma-db-persistence.md) · [Production Agents §5, aula 55](../cursos/production-ai-agents/transcricoes/055-hands-on-embedding-caching.md) · [Agentes do Zero §14, aula 104](../cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/transcricoes/104-gerenciando-embeddings-e-engine-de-busca.md) · [nota](../cursos/production-ai-agents/notas/05-document-loading-chunking-embeddings-loaders-splitters-vecto.md)
**Cursos:** 4

## Recuperação

### RAG-010 — MMR só quando os resultados são redundantes (API a confirmar)

**Regra:** Activa o MMR (`as_retriever(search_type="mmr")`) quando os trechos recuperados tendem a repetir-se; não o uses quando a janela de contexto é curta, quando só interessa precisão ou quando os documentos já são diversos.
**Porquê:** O MMR troca parte da relevância por diversidade e é um passo de cálculo a mais; com poucos chunks ou documentos já variados, só tira relevância ao topo.
**Como verificar:** Cada uso de `search_type="mmr"` tem justificação na spec; com `k` pequeno e objectivo de precisão, o retriever é de similaridade.
**Fonte:** [RAG Bootcamp §9, aula 48](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/048-when-to-and-when-not-to-use-mmr.md) · [nota](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/notas/09-hybrid-search-strategies.md) · [nota Production Agents §5](../cursos/production-ai-agents/notas/05-document-loading-chunking-embeddings-loaders-splitters-vecto.md)
**Cursos:** 4

### RAG-011 — Pesquisa híbrida quando há termos exactos e raros (API a confirmar)

**Regra:** Junta BM25 à pesquisa densa quando as perguntas trazem nomes, códigos, siglas ou termos técnicos raros.
**Porquê:** A pesquisa densa apanha o significado e tolera erros de escrita, mas falha o termo exacto; o BM25 dá peso alto a palavras raras, que é onde a pesquisa semântica se perde.
**Como verificar:** Em bases técnicas ou com identificadores, existe um retriever que combina as duas pesquisas; os pesos estão explícitos no código, não escondidos num valor por omissão.
**Fonte:** [RAG Bootcamp §9, aula 43](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/043-benefits-of-combining-dense-and-sparse-search.md) · [nota](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/notas/09-hybrid-search-strategies.md) · [nota Production Agents §6](../cursos/production-ai-agents/notas/06-rag-and-memory-a-comprehensive-dive.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 2

### RAG-012 — Pergunta de seguimento reformulada antes de pesquisar (API a confirmar)

**Regra:** Numa conversa, reformula a pergunta de seguimento numa pergunta autónoma, a partir do histórico, antes de a enviar ao retriever; o prompt de reformulação não responde, só reescreve.
**Porquê:** Perguntas como "e quais são os tipos?" não têm sentido isoladas e recuperam os chunks errados quando vão tal como vêm para a pesquisa.
**Como verificar:** O caminho conversacional tem um passo de reformulação com o histórico antes da recuperação; o prompt desse passo diz explicitamente para não responder.
**Fonte:** [RAG Bootcamp §7, aula 30](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/030-advanced-rag-techniques-conversational-memory.md) · [nota](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/notas/07-vector-stores-and-vector-databases.md)
**Cursos:** 1

## Geração

### RAG-013 — Responder só com o contexto, com rota de "não sei"

**Regra:** O prompt de geração tem de instruir o modelo a responder apenas com o contexto fornecido e a dizer que não tem essa informação quando a resposta não está lá.
**Porquê:** Sem essa instrução o modelo inventa uma resposta coerente; os utilizadores fazem perguntas fora da base e o sistema tem de o admitir em vez de alucinar.
**Como verificar:** Lê o template do prompt: tem de conter a restrição ao contexto e a frase de fallback; deve haver um teste com uma pergunta fora da base a esperar essa resposta.
**Fonte:** [Production Agents §6, aula 64](../cursos/production-ai-agents/transcricoes/064-rag-architecture-and-best-practices-overview.md) · [Production Agents §6, aula 67](../cursos/production-ai-agents/transcricoes/067-hands-on-rag-with-fallback.md) · [RAG Bootcamp §7, aula 27](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/027-building-traditional-rag-with-chromadb-vector-store-part-3.md) · [nota](../cursos/production-ai-agents/notas/06-rag-and-memory-a-comprehensive-dive.md)
**Cursos:** 6

### RAG-014 — Resposta acompanhada das fontes

**Regra:** A resposta devolvida pela aplicação tem de trazer a identificação dos documentos que a sustentam, extraída da metadata dos chunks usados.
**Porquê:** Quem lê a resposta tem de poder ir ao documento original confirmar; é isso que distingue uma resposta verificável de uma afirmação do modelo.
**Como verificar:** A função que formata o contexto preserva a origem e o objecto devolvido tem um campo de fontes; o prompt pede que as fontes sejam incluídas.
**Fonte:** [Production Agents §6, aula 66](../cursos/production-ai-agents/transcricoes/066-hands-on-rag-with-resources.md) · [nota](../cursos/production-ai-agents/notas/06-rag-and-memory-a-comprehensive-dive.md) · [nota LangChain §10](../cursos/langchain/notas/10-building-a-documentation-assistant-embeddings-vectordbs-retr.md)
**Cursos:** 3

## Fluxo com validação

### RAG-015 — Avaliar a relevância dos documentos antes de gerar

**Regra:** Entre a recuperação e a geração, avalia a relevância do que foi recuperado face à pergunta e filtra o que não serve; se não sobrar nada relevante, reescreve a query e recupera de novo (ou vai a outra fonte) em vez de gerar.
**Porquê:** A pesquisa por proximidade devolve sempre alguma coisa, relevante ou não; gerar sobre contexto fraco é a causa clássica de resposta errada no RAG tradicional.
**Como verificar:** O grafo tem um nó de avaliação entre `retrieve` e `generate` e uma aresta condicional para um nó de reescrita; o resultado da avaliação decide o caminho.
**Fonte:** [RAG Bootcamp §19, aula 106](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/106-corrective-rag-detailed-explanation.md) · [LangChain §16, aula 118](../cursos/langchain/transcricoes/118-building-a-relevance-filter-for-rag-using-langchain-s-structured-output.md) · [nota](../cursos/langchain/notas/16-agentic-rag.md) · [nota RAG Bootcamp §19](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/notas/19-corrective-rag.md)
**Cursos:** 2

### RAG-016 — Primeiro a fundamentação, depois a resposta

**Regra:** Depois de gerar, verifica primeiro se a resposta está fundamentada nos documentos e só depois se responde à pergunta; se não estiver fundamentada, regenera, e se não responder à pergunta, procura noutra fonte.
**Porquê:** São falhas diferentes com correcções diferentes: uma resposta inventada corrige-se gerando outra vez com os mesmos documentos, uma resposta fora do assunto significa que a informação não está no índice.
**Como verificar:** Existem duas verificações distintas depois do nó de geração, com destinos diferentes; uma só verificação combinada não cumpre a regra.
**Fonte:** [LangChain §16, aula 122](../cursos/langchain/transcricoes/122-self-rag-intro.md) · [RAG Bootcamp §20, aula 108](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/108-adaptive-rag-theoretical-understanding.md) · [nota](../cursos/langchain/notas/16-agentic-rag.md) · [nota RAG Bootcamp §20](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/notas/20-adaptive-rag.md)
**Cursos:** 2

### RAG-017 — Decisões do fluxo com saída estruturada

**Regra:** Toda a decisão tomada por um LLM dentro do fluxo (relevância, alucinação, escolha de rota) usa saída estruturada com um schema Pydantic de campos fechados, com descrição em cada campo, e um modelo que suporte function calling.
**Porquê:** As arestas condicionais comparam valores; texto livre do modelo não é comparável de forma fiável. A descrição do campo é o que o modelo usa para decidir, e sem function calling a saída estruturada não funciona.
**Como verificar:** Cada nó de decisão tem uma classe de schema com campos tipados e descritos, e a chain usa saída estruturada; nenhuma aresta condicional faz parsing de texto livre.
**Fonte:** [LangChain §16, aula 118](../cursos/langchain/transcricoes/118-building-a-relevance-filter-for-rag-using-langchain-s-structured-output.md) · [nota](../cursos/langchain/notas/16-agentic-rag.md) · [nota RAG Bootcamp §16](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/notas/16-agentic-rag.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 3

### RAG-018 — Limite de tentativas em qualquer ciclo

**Regra:** Todo o ciclo de regeneração, reflexão ou recuperação iterativa conta as tentativas no estado e tem uma aresta condicional que termina ao chegar ao limite.
**Porquê:** Sem contador, o critério de paragem depende do juízo do modelo e o ciclo pode não terminar; o Bootcamp fixa o limite em duas tentativas no exemplo dele.
**Como verificar:** O estado tem um campo de tentativas incrementado no nó de geração e a condição de saída testa esse campo, além do resultado da verificação.
**Fonte:** [RAG Bootcamp §17, aula 99](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/099-iterative-retrieval-with-self-reflection.md) · [RAG Bootcamp §17, aula 97](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/097-self-reflection-understanding-and-implementation.md) · [nota](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/notas/17-autonomous-rag.md)
**Cursos:** 2

### RAG-019 — Uma tool por base, com nome e descrição próprios (API a confirmar)

**Regra:** Quando o retrieval é exposto como tool, cada base ou domínio tem a sua tool, com nome e descrição que digam o que lá está; não juntes domínios distintos na mesma vector store nem na mesma tool.
**Porquê:** É pela descrição que o modelo decide qual usar; descrições vagas ou uma tool única sobre tudo fazem-no encaminhar mal a pergunta.
**Como verificar:** Cada tool de retrieval tem nome e descrição específicos do conteúdo; não há uma tool genérica de "pesquisar documentos" sobre bases de assuntos diferentes.
**Fonte:** [RAG Bootcamp §16, aula 93](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/093-tool-creation-for-rag-agents-with-langgraph.md) · [nota](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/notas/16-agentic-rag.md) · [nota Agentes do Zero §14](../cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/notas/14-llamaindex-desenvolvimento-de-agentes.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 3

## Memória e avaliação

### RAG-020 — Histórico isolado por conversa (API a confirmar)

**Regra:** Cada conversa tem o seu identificador (`thread_id` ou `session_id`), passado em todas as chamadas, e o histórico de uma conversa nunca é lido por outra.
**Porquê:** É o identificador que liga as mensagens à conversa; partilhá-lo entre utilizadores mistura os históricos e expõe o que um disse ao outro.
**Como verificar:** O identificador vem da sessão do utilizador e não é uma constante no código; num teste com dois identificadores, cada um só vê o seu histórico.
**Fonte:** [Production Agents §6, aula 78](../cursos/production-ai-agents/transcricoes/078-hands-on-multiple-sessions-memory.md) · [RAG Bootcamp §21, aula 110](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/110-rag-with-persistant-memory-with-langgraph.md) · [nota](../cursos/production-ai-agents/notas/06-rag-and-memory-a-comprehensive-dive.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 4

### RAG-021 — Avaliação com dataset de referência (API a confirmar)

**Regra:** Avalia o RAG contra um dataset de perguntas com resposta de referência, com avaliadores que devolvem um valor booleano e uma explicação; para comparar modelos, corre a mesma avaliação com cada um.
**Porquê:** Sem resposta de referência não há como medir correcção, e sem medição a escolha do modelo acaba por ser feita só pelo preço.
**Como verificar:** Existe um dataset versionado com perguntas e respostas de referência e avaliadores com schema de saída; uma mudança de modelo ou de prompt traz números da avaliação.
**Fonte:** [RAG Bootcamp §26, aula 122](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/122-rag-evaluation-build-evaluators-with-metrics.md) · [RAG Bootcamp §26, aula 119](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/119-evaluation-of-chatbots-defining-metrics-llm-as-a-judge.md) · [nota](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/notas/26-chatbot-and-rag-evaluation.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 1
