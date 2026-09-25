# Regras — Processamento de linguagem natural

Prefixo `NLP`. ## Prompts e APIs de LLM

### NLP-001 — Resultado esperado no fim do prompt

**Regra:** põe no fim do prompt o que esperas receber: formato de saída, estrutura e critérios de aceitação.
**Porquê:** o modelo gera o token seguinte a partir da sequência inteira, e as partes finais da entrada pesam estatisticamente mais do que as iniciais na escolha do próximo token.
**Como verificar:** no ficheiro de prompt ou na string do prompt, o último bloco descreve a saída pedida (por exemplo, o esquema JSON), e não o contexto ou os dados de entrada.
**Cursos:** 1

### NLP-002 — Papéis explícitos nas mensagens de chat (API a confirmar)

**Regra:** monta as mensagens de uma chamada de chat como uma lista de objectos com `role` e `content`: `system` para o comportamento do assistente, `user` para o pedido e `assistant` para as respostas anteriores que fazem parte do contexto.
**Porquê:** é através dos papéis que a API distingue quem disse o quê numa conversa; sem reenviar as respostas anteriores como `assistant`, a chamada seguinte não tem o contexto do que já foi dito.
**Como verificar:** a lista `messages` tem sempre as duas chaves `role` e `content`; as instruções de comportamento estão numa mensagem `system` e não coladas ao pedido do utilizador; o histórico reenviado usa o papel `assistant`.
**Cursos:** 1

### NLP-003 — Memória num agente conversacional

**Regra:** dá memória de conversa a qualquer agente em que a resposta dependa das mensagens anteriores, com uma janela de interações definida.
**Porquê:** sem memória, o agente trata cada pergunta isoladamente e falha nas perguntas que só fazem sentido no seguimento da anterior (pronomes, referências implícitas).
**Como verificar:** o agente tem um componente de memória ligado com um tamanho de janela explícito; há um teste ou um exemplo com duas perguntas encadeadas, a segunda referindo-se à primeira.
**Cursos:** 2

## Embeddings

### NLP-004 — Embeddings ao nível de frase ou chunk

**Regra:** gera embeddings de frases ou chunks com um modelo de sentence-transformers (ou equivalente), e não um vector por palavra isolada.
**Porquê:** estes modelos foram treinados para representar a frase inteira num único vector, e é nessa forma — frases e parágrafos — que os dados chegam a um pipeline de RAG.
**Como verificar:** o texto é dividido em chunks antes de embeber, e o modelo escolhido é de representação de frases; não há código a embeber palavra a palavra e a fazer médias à mão.
**Cursos:** 1

### NLP-005 — Escolha justificada do modelo de embeddings

**Regra:** antes de fixar um modelo de embeddings, confirma a dimensão do vector que produz, o custo por token e o caso de uso recomendado (velocidade, qualidade, suporte multilingue), e regista a escolha.
**Porquê:** a dimensão é definida no treino do modelo e não se escolhe; os modelos disponíveis diferem muito em dimensão, velocidade, qualidade e preço, e a escolha condiciona toda a colecção de vectores.
**Como verificar:** a spec ou o README indicam o modelo, a dimensão e o motivo da escolha; a configuração aponta para um só modelo de embeddings por colecção.
**Cursos:** 1

### NLP-006 — Sem modelos de embeddings legados

**Regra:** não uses em código novo um modelo de embeddings que o fornecedor marque como geração anterior ou legado; à data do curso, é o caso do `text-embedding-ada-002`.
**Porquê:** existem modelos mais recentes do mesmo fornecedor com melhor relação entre qualidade e custo, e o professor desaconselha expressamente o modelo antigo.
**Como verificar:** o nome do modelo na configuração não consta da lista de legados da documentação do fornecedor.
**Cursos:** 1

### NLP-007 — Dividir o texto antes do limite de tokens do modelo

**Regra:** divide os documentos em frases ou chunks antes de os dar a um modelo com limite de tokens de entrada (512 nos modelos usados pelo BERTopic).
**Porquê:** o que passa do limite é cortado em silêncio, sem erro nem aviso, e o resultado passa a cobrir só o início de cada documento.
**Como verificar:** existe um passo de divisão em frases ou chunks antes da chamada ao modelo, e o tamanho máximo do chunk é conhecido e menor do que o limite do modelo.
**Cursos:** 1

## Recuperação num RAG

### NLP-008 — Pesquisa híbrida em domínios com termos raros (API a confirmar)

**Regra:** combina pesquisa densa com pesquisa esparsa (BM25) quando o domínio tem termos técnicos, nomes próprios ou palavras raras, com pesos explícitos para cada retriever.
**Porquê:** a pesquisa esparsa apanha a correspondência exacta e dá peso aos termos raros que a densa dilui; a densa lida com sinónimos, reformulações e erros de escrita. Juntas aumentam o recall e evitam contexto irrelevante.
**Como verificar:** o retriever do pipeline combina os dois, os pesos estão no código ou na configuração (e não por omissão), e a escolha dos pesos foi validada com alguém que conhece o domínio.
**Cursos:** 1

### NLP-009 — Reranking entre a recuperação e a geração

**Regra:** quando a ordem dos documentos recuperados importa mais do que a latência, acrescenta uma fase de reranking do top-k (LLM ou cross-encoder) entre o retriever e o passo de geração.
**Porquê:** o retriever rápido traz os documentos certos mas não necessariamente na melhor ordem; um modelo mais lento e preciso reordena-os, e os documentos mais relevantes ficam no topo do contexto entregue ao LLM.
**Como verificar:** o pipeline tem as três fases separadas — recuperação, reranking, geração — e o passo de reranking devolve a lista reordenada antes de montar o prompt.
**Cursos:** 1

### NLP-010 — MMR para contexto redundante (API a confirmar)

**Regra:** usa MMR no retriever quando ele devolve muitos resultados semelhantes entre si; não o uses quando a janela de contexto é curta, quando só interessa a precisão ou quando os documentos já são diversos.
**Porquê:** o MMR troca parte da relevância por diversidade; isso evita encher o contexto com chunks quase repetidos, mas prejudica quando só há espaço para os documentos mais relevantes.
**Como verificar:** o tipo de pesquisa do retriever está escolhido de propósito e justificado; num pipeline com poucos chunks no contexto, o MMR está desligado.
**Cursos:** 1

### NLP-011 — Não acumular MMR com reranking por LLM

**Regra:** não apliques MMR no mesmo pipeline em que já fazes reranking com um LLM.
**Porquê:** o reranking já trata a redundância ao reordenar o top-k; juntar as duas técnicas acrescenta um passo e chamadas ao modelo sem ganho relevante.
**Como verificar:** no diff ou na spec do pipeline de recuperação aparece uma das duas técnicas, não as duas.
**Cursos:** 1

## Pré-processamento de texto

### NLP-012 — Modelo linguístico do idioma e da variante do corpus

**Regra:** carrega o modelo linguístico do idioma do corpus e, quando existir, da variante regional e do domínio (por exemplo, português do Brasil em vez de português de Portugal).
**Porquê:** um modelo é uma base de regras linguísticas específica de um idioma; com o modelo errado, a anotação (classes gramaticais, flexões, dependências) sai errada e contamina tudo o que vem a seguir.
**Como verificar:** o nome do modelo carregado no código corresponde ao idioma dos dados; num corpus multilingue, há um modelo por idioma ou um modelo multilingue assumido.
**Cursos:** 2

### NLP-013 — Limpar o texto antes de contar palavras ou medir similaridade

**Regra:** antes de calcular frequências de palavras ou de usar a similaridade baseada em média de vectores de palavras, retira a pontuação e as stop words do idioma.
**Porquê:** as palavras vazias e a pontuação são as mais frequentes de qualquer texto e dominam as contagens; na similaridade por média de vectores, puxam a métrica para baixo e escondem a diferença real entre as frases.
**Como verificar:** entre a tokenização e a contagem (ou a comparação) há um filtro que usa a lista de stop words do idioma e descarta os tokens não alfanuméricos.
**Cursos:** 2

## Chaves e segredos

### NLP-014 — Chaves de API num ficheiro `.env`

**Regra:** guarda as chaves de API num ficheiro `.env` e carrega-as para as variáveis de ambiente antes de instanciar o cliente do modelo; nunca escrevas a chave no código nem num notebook.
**Porquê:** o professor apresenta-o como a forma de tratar qualquer variável secreta, e o cliente falha a inicializar se a chave não estiver no ambiente no momento da criação.
**Como verificar:** não há literais de chave no diff; o `.env` está fora do controlo de versões; o carregamento acontece antes da criação do cliente e há uma verificação de que a variável existe.
**Cursos:** 1
