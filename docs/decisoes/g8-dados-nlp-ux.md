# Decisões — Grupo 8: Dados, ML, NLP e UX

> Fontes consultadas a 2026-09-17.

## D-DAT01 — Que critério usar por omissão para marcar outliers?

**Temas:** dados-e-ml · **Regras afectadas:** nenhuma

**Decisão:** Adopta o IQR (limites em Q1 − 1,5×IQR e Q3 + 1,5×IQR) como critério por omissão para marcar outliers.

**Porquê:** O IQR não pressupõe distribuição normal, ao contrário do z-score simples. É o critério documentado como "inner fence" nas referências de estatística aplicada, com um limiar mais largo (×3) para os casos extremos.


**Contra:** O z-score modificado (mediana e MAD) resiste melhor quando os próprios outliers distorcem Q1 e Q3, em amostras pequenas ou com cauda muito pesada; nesse caso vale a pena reconsiderar.

**Confiança:** alta

## D-DAT02 — Com que medida imputar os ausentes numéricos?

**Temas:** dados-e-ml · **Regras afectadas:** nenhuma (relacionada com DML-011, DML-012)

**Decisão:** Usa a mediana como imputação por omissão para ausentes numéricos, com o desvio justificado por coluna.

**Porquê:** A mediana resiste a outliers, a média não: um único valor muito distante desloca a média mas quase não move a mediana. A escolha nunca se aplica a colunas onde o zero é um valor legítimo.


**Contra:** A média mantém-se aceitável em colunas sem outliers relevantes e é mais simples de justificar a quem lê o código; se a coluna for conhecida e limpa, pode preferir-se.

**Confiança:** alta

## D-DAT03 — Onde acaba o `inplace=True` e começa o DataFrame derivado?

**Temas:** dados-e-ml · **Regras afectadas:** nenhuma (relacionada com UX-013)

**Decisão:** A limpeza produz um DataFrame canónico por reatribuição explícita; cada análise ou gráfico deriva o seu próprio DataFrame a partir desse. Não uses `inplace=True`.

**Porquê:** Os mantenedores do pandas decidiram remover progressivamente o parâmetro `inplace`. Com o Copy-on-Write, que passa a ser o único comportamento a partir do pandas 3.0, os métodos `inplace` deixam de alterar o objecto original em vários casos.


**Contra:** Nenhuma fonte reconhecida defende manter `inplace=True` como prática central; é a própria pandas quem descontinua o parâmetro.

**Confiança:** alta

## D-DAT04 — O `LabelEncoder` pode ser aplicado a atributos nominais?

**Temas:** dados-e-ml · **Regras afectadas:** nenhuma

**Decisão:** Não. Usa o `LabelEncoder` só na variável-alvo (y); usa `OrdinalEncoder` nos atributos com ordem natural e `OneHotEncoder` (com uma coluna removida) nos restantes.

**Porquê:** A própria documentação diz para que serve o `LabelEncoder`, e não é para atributos de entrada. Aplicá-lo a uma coluna nominal introduz uma ordem que não existe e distorce modelos sensíveis à magnitude do valor.


**Contra:** Nenhum; codificar todas as colunas categóricas com `LabelEncoder` é um atalho de código, não uma alternativa defendida pela documentação.

**Confiança:** alta

## D-DAT05 — O `fit` dos transformadores faz-se antes ou depois da divisão treino/teste?

**Temas:** dados-e-ml · **Regras afectadas:** nenhuma (relacionada com DML-013)

**Decisão:** Ajusta (`fit`) qualquer transformador só nos dados de treino; aos dados de teste e a registos novos aplica-se só `transform`.

**Porquê:** A fuga de dados (data leakage) acontece quando a preparação já viu os dados de teste antes da avaliação, o que infla artificialmente o resultado.


**Contra:** Nenhuma fonte reconhecida defende ajustar sobre o conjunto inteiro; a prática do exemplo em Spark não é enunciada como regra pelo próprio curso.

**Confiança:** alta

## D-DAT06 — O conjunto de teste pode servir de validação durante o treino?

**Temas:** dados-e-ml · **Regras afectadas:** DML-014

**Decisão:** Não. Usa três conjuntos quando há escolhas guiadas pelo resultado (early stopping, afinação de hiperparâmetros): treino, validação e teste, e reserva o teste para a avaliação final.

**Porquê:** Usar o teste como validação deixa "vazar" conhecimento sobre ele para as escolhas do modelo, feitas através do ajuste de hiperparâmetros; a métrica final deixa de medir generalização.


**Contra:** Um terceiro conjunto reduz os dados disponíveis para treino; a validação cruzada mitiga isso sem abdicar do princípio.

**Confiança:** alta

## D-DAT07 — Como medir similaridade semântica entre textos no projecto?

**Temas:** nlp · **Regras afectadas:** NLP-004

**Decisão:** Usa embeddings de frase (sentence-transformers ou equivalente) com similaridade de cosseno; não uses o `similarity()` do spaCy para comparar frases.

**Porquê:** O spaCy documenta que a similaridade por omissão de um `Doc` é a média dos vectores das palavras, insensível à ordem, e pede "expectativas realistas" quanto à precisão do resultado. Um pipeline de RAG já embebe os chunks por sentence-transformers, o que evita manter duas representações.


**Contra:** O spaCy é mais leve e dispensa um modelo de embeddings adicional; se o projecto não usar RAG nem sentence-transformers por outro motivo, o custo da nova dependência pode não compensar.

**Confiança:** alta

## D-DAT08 — Que abordagem usar para análise de sentimentos em português?

**Temas:** nlp · **Regras afectadas:** nenhuma

**Decisão:** Usa um modelo treinado directamente em português, como o `pysentimiento`, em vez de VADER com tradução prévia para inglês.

**Porquê:** O VADER foi construído e validado só para texto em inglês; traduzir antes de classificar acrescenta uma dependência externa e um erro próprio de tradução, sem que nenhuma fonte compare as duas abordagens quanto a precisão.


**Contra:** O modelo em português do `pysentimiento` foi treinado em tweets, um domínio diferente do texto do projecto; para texto muito distinto (por exemplo, jurídico), vale a pena avaliar as duas opções num conjunto anotado antes de fixar.

**Confiança:** média

## D-DAT09 — Que modelo de LLM usar nos exemplos e no código do projecto?

**Temas:** nlp · **Regras afectadas:** nenhuma

**Decisão:** Sem fonte que decida um modelo concreto. Fixa o nome do modelo num único ponto de configuração, nunca espalhado pelo código.

**Porquê:** Os nomes citados nos cursos (`gpt-3.5-turbo`, `gemma2-9b-it`) já não representam a oferta actual dos fornecedores, e nenhuma fonte externa compara modelos concretos para este projecto. A decisão estável é de arquitectura, não de modelo.


**Contra:** Nomear um modelo concreto nas regras dá exemplos mais directos aos agentes; o risco é o exemplo ficar desactualizado, o que a variável de configuração evita.

**Confiança:** baixa

## D-DAT10 — Um prompt inicial completo ou fases progressivas numa ferramenta geradora?

**Temas:** ux · **Regras afectadas:** UX-016

**Decisão:** Usa fases progressivas (estrutura, depois interactividade, depois polimento), com o contexto todo dado logo no primeiro pedido.

**Porquê:** O argumento do prompt único é o custo por prompt de plataformas que cobram créditos, o que não se aplica ao projecto. A documentação do Claude Code recomenda separar exploração, planeamento e implementação, e para funcionalidades maiores fazer o agente entrevistar antes de escrever a spec completa — contexto completo à partida, execução em fases.


**Contra:** Um prompt inicial mais completo reduz as idas e voltas; se a ferramenta cobrar por prompt, como o curso de Eng. IA descreve, o cálculo muda a favor de um único pedido.

**Confiança:** média

## D-DAT11 — Que número usar para a prevalência do daltonismo?

**Temas:** ux · **Regras afectadas:** UX-008

**Decisão:** Mantém a prática já recomendada de não citar número nenhum nos documentos do projecto; se for mesmo preciso citar um, usa cerca de 8% dos homens e 0,4% das mulheres de origem europeia (caucasiana), nunca como valor universal.

**Porquê:** A fonte epidemiológica original mostra que a prevalência varia por população — entre 4% e 6,5% nos homens chineses e japoneses — e que a proporção entre homens e mulheres difere entre europeus e asiáticos. Um único número global é impreciso.


**Contra:** O "1 em 10 homens, 1 em 200 mulheres" citado num curso está próximo do valor de Birch e é mais fácil de comunicar; ainda assim, não citar número nenhum evita repetir uma cifra específica de uma população que pode não ser a do produto.

**Confiança:** alta

## D-DAT12 — Que versão da WCAG seguir?

**Temas:** ux · **Regras afectadas:** nenhuma

**Decisão:** Segue a WCAG 2.2, a recomendação em vigor do W3C.

**Porquê:** A WCAG 1.0 citada num curso está descontinuada há mais de duas décadas. A WCAG 3.0 ainda não é uma recomendação: é um rascunho de trabalho, sem data de conclusão antes de 2028.


**Contra:** Nenhum; nenhum curso defende a WCAG 1.0 como escolha actual, e a 3.0 ainda não é adoptável.

**Confiança:** alta
