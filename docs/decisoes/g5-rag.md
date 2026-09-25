# Decisões — RAG e recuperação

> Fontes consultadas a 2026-09-17.

## D-RAG01 — O retrieval é um passo fixo da chain ou uma tool que o modelo decide usar?

**Temas:** rag, dev-com-agentes, agentes-ia, producao-ia · **Regras afectadas:** nenhuma com ID próprio (enquadra RAG-015 e RAG-016)

**Decisão:** Por omissão, retrieval fixo de dois passos, com melhoria da query e validação dos documentos e da resposta. O agente com retrieval como tool só entra quando houver mais do que uma base ou fonte para escolher.

**Porquê:** A documentação oficial do LangChain dá os dois padrões como válidos, mas liga cada um a um perfil: pipeline fixo para bots de FAQ e de documentação, agente para assistentes com várias ferramentas. O projecto responde sobre uma base de conhecimento própria, que é o primeiro caso.


**Contra:** Um agente livre com o retrieval como tool cobre melhor perguntas que exigem várias pesquisas encadeadas a fontes diferentes; se o projecto ganhar uma segunda base, isso pesa a favor do agente nessa parte.

**Confiança:** alta

## D-RAG02 — Que tamanho de chunk usar por omissão?

**Temas:** rag, agentes-ia, python · **Regras afectadas:** nenhuma (parâmetro de arranque, não regra normativa)

**Decisão:** Sem fonte que decida um valor universal. Fixar a tabela por tipo de conteúdo do Production AI Agents (Q&A 500-800, documentação 1000-1500, código 1500-2000 caracteres, com overlap proporcional) como ponto de partida, e ajustar com a avaliação de RAG-021.

**Porquê:** a única indicação de tamanho que a Anthropic dá é qualitativa — "não mais do que algumas centenas de tokens" — e não a liga ao tipo de conteúdo. A unidade (tokens) também não é directamente comparável aos caracteres usados nos cursos. Não há, portanto, número externo a que agarrar.


**Contra:** O orçamento de tokens dividido pelos chunks que cabem no prompt (curso LangChain) acompanha a janela de contexto do modelo escolhido; muda se o modelo mudar, o que o valor fixo do Production AI Agents não faz.

**Confiança:** baixa

## D-RAG03 — Embeddings locais ou pagos?

**Temas:** rag · **Regras afectadas:** RAG-007, RAG-008

**Decisão:** Modelo pago (`text-embedding-3-small`) para o índice principal. Um modelo local só entra se houver requisito de não enviar o conteúdo para fora, e desde o início nesse caso.

**Porquê:** A comparação da Pinecone entre modelos pagos e um modelo aberto (E5) deu resultados que variam por pergunta, sem vencedor claro, e avisa que os números do MTEB são muitas vezes inflacionados por afinação sobre o próprio benchmark. Sem vencedor de qualidade, pesa a favor do pago não ter de gerir GPU nem infra própria num projecto de uma pessoa.


**Contra:** Um modelo local elimina o custo por chamada e mantém os dados no computador; se o projecto ganhar esse requisito de privacidade, a decisão inverte-se por completo.

**Confiança:** média

## D-RAG04 — Que vector store?

**Temas:** python · **Regras afectadas:** nenhuma em RAG (tema python; aplica-se PY-032 se escolhido)

**Decisão:** Chroma com persistência em disco para o projecto actual. Mudar para uma base gerida (Pinecone, Weaviate, Qdrant) só se o volume ou um requisito de infra o exigir.

**Porquê:** A própria integração do LangChain com o Chroma descreve o modo sem persistência como bom para experimentar e a Chroma Cloud como o caminho de escala; entre os dois fica o modo local persistido, que cobre um projecto de um só programador sem orçamento de infra.


**Contra:** O FAISS evita mesmo um processo de base de dados a correr; o RAG Bootcamp usa os dois como stores locais até cerca de um milhão de vectores, o que também cobre este projecto.

**Confiança:** média

## D-RAG05 — Que pesos dar à pesquisa híbrida?

**Temas:** rag · **Regras afectadas:** RAG-011

**Decisão:** **Sem fonte que decida.** Definir sempre o peso de forma explícita no código, nunca o deixar por omissão; partir de 75/25 a favor da pesquisa vectorial (`alpha=0.75`) e recalibrar com a avaliação de RAG-021.

**Porquê:** nenhum fabricante publica um valor de omissão defensável. A parte com fonte é outra, e é a que entra na regra: se o peso não for definido, o resultado muda consoante o cliente usado, o que torna a recuperação irreprodutível. O 75/25 é ponto de partida escolhido para este projecto, cujas perguntas são sobretudo em linguagem natural; não é um número recomendado por ninguém.


**Contra:** Se as perguntas do projecto trouxerem muitos termos exactos, siglas ou identificadores (o caso que RAG-011 cobre), um peso mais baixo a favor do BM25 tende a servir melhor do que 75/25.

**Confiança:** baixa — quanto ao número. Alta quanto a definir o peso explicitamente.

**Nota de revisão (2026-09-17):** a versão inicial desta entrada afirmava que o Weaviate documenta `alpha=0.75` como omissão do servidor. A página não diz isso; diz que o peso efectivo depende do cliente. Corrigido depois de abrir a fonte.

## D-RAG06 — O grading avalia cada documento ou o contexto todo de uma vez?

**Temas:** rag · **Regras afectadas:** RAG-015

**Decisão:** Documento a documento, filtrando os irrelevantes antes de gerar.

**Porquê:** O artigo que deu origem à técnica de Corrective RAG vai mais longe do que por documento: segmenta cada documento em fragmentos ("knowledge strips") e pontua cada um, descartando os irrelevantes antes de recompor o contexto. O tutorial mais simples da documentação do LangChain avalia o contexto todo concatenado numa só chamada, mas é um exemplo introdutório, não a técnica de Corrective RAG em si.


**Contra:** O tutorial oficial de agente RAG do LangChain avalia o contexto concatenado numa só chamada, mais barato; serve quando há poucos documentos por pergunta e o custo pesa mais do que a precisão do filtro.

**Confiança:** média

## D-RAG07 — Combinar MMR com reranking por LLM?

**Temas:** rag · **Regras afectadas:** RAG-010

**Decisão:** Sem fonte que decida. Não combinar por omissão; activar os dois só se a avaliação de RAG-021 mostrar redundância depois do reranking.

**Porquê:** Não há estudo nem documentação de fabricante com números sobre empilhar os dois. O MMR e um reranker por LLM resolvem problemas diferentes (diversidade contra relevância) e compõem-se tecnicamente, mas a única fonte dos cursos que toca no assunto contradiz-se dentro da mesma aula.


**Contra:** Num chatbot de FAQ com poucas variantes de resposta, combinar os dois pode reduzir respostas repetidas sem perder relevância; medir antes de manter a decisão contrária.

**Confiança:** baixa

## D-RAG08 — Como se organiza o código de um RAG em grafo?

**Temas:** rag · **Regras afectadas:** RAG-003

**Decisão:** Pacote com `state.py`, `nodes.py` (ou um subpacote `nodes/` quando crescer), `tools.py` e `graph.py`, com a ingestão num módulo à parte, como já exige RAG-003. Dividir `nodes.py` num ficheiro por nó quando o grafo tiver avaliação e reescrita, como no curso LangChain.

**Porquê:** O exemplo de referência da documentação do LangGraph para estruturar uma aplicação usa exactamente esta separação plana (`tools.py`, `nodes.py`, `state.py`) dentro de um pacote próprio. É um exemplo para agentes simples; para um grafo de RAG com mais nós, o mesmo padrão split-by-concern só precisa de um passo a mais quando o número de nós cresce.


**Contra:** A organização por classe com métodos, um por nó (RAG Bootcamp), reduz o número de ficheiros num grafo pequeno; serve melhor enquanto o grafo tiver poucos nós.

**Confiança:** média
