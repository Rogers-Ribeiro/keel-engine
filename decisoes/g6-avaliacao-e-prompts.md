# Decisões — Avaliação, prompts e execução em produção

> Fontes consultadas a 2026-09-17.

## D-AV01 — Quem valida o resultado de um ciclo de auto-correcção: código determinístico ou um LLM juiz?

**Temas:** agentes-ia, arquitetura, producao-ia · **Regras afectadas:** TST-009, ARQ-023 (nenhuma regra própria fixa isto ainda para o ciclo de auto-correcção)

**Decisão:** Validar sempre com verificação determinística quando existe um critério executável (compilar, correr testes, validar schema); reservar o LLM juiz para juízos sem critério mecânico, e nunca deixar o mesmo modelo aprovar a sua própria saída dentro do ciclo.

**Porquê:** um LLM a avaliar o que ele próprio gerou tende a preferir essa saída mesmo quando não é melhor; a verificação por código não tem esse enviesamento, é mais barata e dá o mesmo resultado sempre.

**Fonte:** Panickssery, Bowman e Feng, "LLM Evaluators Recognize and Favor Their Own Generations", NeurIPS 2024, https://arxiv.org/abs/2404.13076, 15 abr 2024. Mostra correlação linear entre a capacidade de um modelo se reconhecer e a força do enviesamento a favor da própria geração, mesmo quando humanos julgam as saídas equivalentes.

**Contra:** um LLM juiz é mais barato de escrever do que um verificador mecânico para juízos textuais (relevância, tom); a decisão muda quando não há nenhum critério executável possível, que é exactamente o caso que a AGT-015 já isola.

**Confiança:** alta

## D-AV02 — Que escala usa o LLM juiz: veredicto booleano ou pontuação de 1 a 10?

**Temas:** testes · **Regras afectadas:** TST-009

**Decisão:** Usar veredicto booleano (passa/falha) com explicação por critério; quando um critério for amplo de mais para um só booleano, decompor em vários booleanos em vez de subir para uma escala numérica.

**Porquê:** escalas tipo Likert dão julgamentos inconsistentes entre execuções e não dizem o que fazer com um "6"; o booleano obriga a um critério de corte explícito e agregável.

**Fonte:** Hamel Husain, "Why do you recommend binary (pass/fail) evaluations instead of 1-5 ratings (Likert scales)?", https://hamel.dev/blog/posts/evals-faq/why-do-you-recommend-binary-passfail-evaluations-instead-of-1-5-ratings-likert-scales.html, 29 mai 2025. Argumenta que os pontos intermédios de uma escala são subjectivos entre anotadores e que decompor o critério em binários preserva a medição de progresso sem essa ambiguidade.

**Contra:** uma escala permite ordenar duas versões sem fixar já um limiar de aprovação; se o objectivo for comparar versões e não aprovar/reprovar em portão automático, a pontuação continua útil.

**Confiança:** alta

## D-AV03 — Que métricas de avaliação adopta o projecto?

**Temas:** testes · **Regras afectadas:** TST-010

**Decisão:** Não fixar um conjunto de métricas genéricas de qualidade (correcção, relevância, clareza, completude); derivar as métricas de uma análise dos erros reais do projecto, cada uma com um critério binário verificável. Manter a TST-010 (recuperação e fundamentação) para RAG, por olhar directamente para o retriever.

**Porquê:** métricas genéricas de "qualidade" correlacionam mal com as falhas que o projecto realmente tem, e um resultado bom nelas não garante nada sobre o caso concreto.

**Fonte:** Hamel Husain, "Should I use 'ready-to-use' evaluation metrics?", https://hamel.dev/blog/posts/evals-faq/should-i-use-ready-to-use-evaluation-metrics.html, 6 jul 2025. Diz que avaliações genéricas "waste time and create false confidence" e recomenda substituí-las por avaliadores binários construídos a partir de análise de erros e validados contra julgamento humano.

**Contra:** um conjunto genérico funciona desde o primeiro dia, sem exigir um corpo de erros já catalogado; o próprio Husain admite usá-lo para explorar e encontrar traços a rever antes de haver dados de falhas reais.

**Confiança:** alta

## D-AV04 — Que temperatura se usa por omissão?

**Temas:** agentes-ia, producao-ia, llm-e-prompts · **Regras afectadas:** LLM-011, IAP-005

**Decisão:** Manter temperatura 0–0,3 por omissão em routing, classificação, extracção e avaliação, e reservar valores altos para a escrita criativa — mas tornar isto condicional ao modelo: confirmar, a cada troca de modelo, se o fornecedor ainda aceita o parâmetro.

**Porquê:** temperatura baixa reduz a variância em tarefas cujo resultado é lido por código ou fundamentado em documentos; mas nem todos os modelos actuais aceitam o parâmetro, e a regra tal como está escrita ("nenhuma tarefa corre com o valor por omissão do fornecedor") parte do princípio de que o parâmetro é sempre ajustável.

**Fonte:** Anthropic, referência da API Messages, https://platform.claude.com/docs/en/api/messages, consultada 2026-09-17. Diz que `temperature` está descontinuado nos modelos lançados depois do Claude Opus 4.6, que só aceitam o valor 1,0 e rejeitam qualquer outro com erro 400.

**Contra:** nada disto muda a recomendação para a OpenAI nem para os modelos Anthropic anteriores ao Opus 4.6, que continuam a aceitar o intervalo completo; a única mudança é tornar a verificação da LLM-011/IAP-005 condicional ao modelo em uso.

**Confiança:** alta (sobre o efeito da temperatura) — média (sobre a extensão da descontinuação a outros fornecedores)

## D-AV05 — Que tipo de cache se põe à frente do LLM: exacta ou semântica?

**Temas:** producao-ia · **Regras afectadas:** nenhuma

**Decisão:** Sem cache até haver perguntas repetidas medidas. Quando houver, começar por cache exacta sobre a pergunta normalizada; só considerar cache semântica com um limiar validado sobre um conjunto de perguntas reais do projecto, nunca com o valor de exemplo de um curso.

**Porquê:** Sem fonte que decida um limiar universal — a taxa de falsos positivos de uma cache semântica sobe depressa exactamente na zona de limiar que dá uma boa taxa de acerto.

**Fonte:** Sem fonte que decida um número fixo. Portkey, "Semantic Caching Thresholds and Why They Matter", https://portkey.ai/blog/semantic-caching-thresholds/, 18 abr 2026 (post técnico de fornecedor, com dados atribuídos a testes da AWS). Mostra que só a partir de limiares de similaridade entre 0,90 e 0,95 a taxa de acerto sobe de forma útil, e recomenda parar de baixar o limiar quando os falsos positivos passarem de 3-5%.

**Contra:** a cache semântica recupera pedidos parecidos mas não idênticos, que a exacta perde por completo; a decisão muda se o projecto vier a ter um volume medido de perguntas repetidas e um custo de resposta errada mais baixo do que aqui se assume.

**Confiança:** média

## D-AV06 — O retry leva jitter?

**Temas:** producao-ia · **Regras afectadas:** IAP-017

**Decisão:** Sim. Usar sempre "full jitter" sobre o backoff exponencial em qualquer retry a um serviço partilhado, incluindo os lotes em paralelo do projecto.

**Porquê:** sem jitter, os retries de vários clientes ficam sincronizados e multiplicam a carga exactamente quando o serviço já está com dificuldades.

**Fonte:** Marc Brooker (AWS), "Exponential Backoff and Jitter", AWS Architecture Blog, https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/, 4 mar 2015. Mede por simulação que o backoff exponencial sem jitter é o pior dos quatro métodos testados, e que "full jitter" reduz o trabalho do cliente para menos de metade com 100 clientes em contenção.

**Contra:** nenhum a favor de omitir o jitter — o próprio curso que mostra o exemplo sem jitter trata-o como simplificação didáctica de uma demonstração, não como recomendação de produção.

**Confiança:** alta

## D-AV07 — Onde fica a tarefa e o formato dentro do prompt?

**Temas:** llm-e-prompts · **Regras afectadas:** LLM-002, LLM-003, LLM-006

**Decisão:** Em prompts com documentos ou dados extensos, pôr esses dados no início e deixar a tarefa, o formato de saída e a pergunta para o fim.

**Porquê:** modelos de contexto longo recuperam pior a informação a meio do prompt do que no início ou no fim; pôr a instrução no fim aproveita o efeito de recência sem sacrificar o que está no início.

**Fonte:** Anthropic, "Prompting best practices" (secção "Long context prompting"), https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices, consultada 2026-09-17: mede até 30% de melhoria na qualidade da resposta ao pôr a pergunta no fim de prompts com vários documentos. Liu et al., "Lost in the Middle: How Language Models Use Long Contexts", TACL 2024, https://arxiv.org/abs/2307.03172, jul 2023: mostra uma curva em U, com desempenho pior quando a informação relevante está a meio do contexto.

**Contra:** a OpenAI recomenda instruções primeiro e contexto no fim para prompts sem dados longos, porque ajuda a reaproveitar o início do prompt em cache; isso aplica-se a system prompts estáveis, não à pergunta variável sobre documentos longos, que é o caso mais comum do projecto.

**Confiança:** alta

## D-AV08 — Quantos exemplos leva um prompt few-shot?

**Temas:** llm-e-prompts · **Regras afectadas:** LLM-005

**Decisão:** Começar com 3 a 5 exemplos representativos e diversos; só descer ou subir esse número depois de uma avaliação (LLM-018) mostrar que compensa.

**Porquê:** é o intervalo que a documentação oficial dá como ponto de partida, e não contradiz os dois cursos que já apontavam para poucos exemplos representativos e para o custo de liberdade de exemplos a mais.

**Fonte:** Anthropic, "Prompting best practices" (secção "Use examples effectively"), https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices, consultada 2026-09-17. Recomenda 3-5 exemplos para a maioria das tarefas, estruturados em tags `<example>`.

**Contra:** tarefas de classificação com muitas categorias raras podem exigir mais exemplos para cobrir cada classe; nesse caso o número sobe até a avaliação mostrar retorno decrescente.

**Confiança:** média

## D-AV09 — Quanto pode o system prompt ser rígido?

**Temas:** llm-e-prompts · **Regras afectadas:** LLM-004

**Decisão:** Manter a LLM-004 (identidade, âmbito e princípios, não árvore de condições); admitir regras "nunca X" só para alucinações já observadas e registadas no tracing, nunca como primeira escolha ao escrever o prompt.

**Porquê:** Sem fonte que decida um limite exacto entre os dois estilos. A documentação oficial recomenda formular como acção positiva em vez de proibição e recua em linguagem rígida do tipo "CRITICAL... MUST", o que aponta para o mesmo lado da recomendação provisória, mas não fixa quantas regras "nunca X" um prompt pode ter.

**Fonte:** Sem fonte que decida um limite. Anthropic, "Prompting best practices" (secções "Control the format of responses" e "Migration considerations"), https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices, consultada 2026-09-17. Recomenda dizer o que fazer em vez do que não fazer, e substituir instruções agressivas ("CRITICAL: you MUST") por formulações mais normais.

**Contra:** uma alucinação concreta e repetida (por exemplo inventar um valor que devia vir de uma tool) só se corrige de facto com uma proibição explícita; um prompt só de princípios nem sempre a apanha.

**Confiança:** média
