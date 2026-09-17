# Decisões — Grupo 8: Dados, ML, NLP e UX

> Fontes consultadas a 2026-09-17.

## D-DAT01 — Que critério usar por omissão para marcar outliers?

**Temas:** dados-e-ml · **Regras afectadas:** nenhuma

**Decisão:** Adopta o IQR (limites em Q1 − 1,5×IQR e Q3 + 1,5×IQR) como critério por omissão para marcar outliers.

**Porquê:** O IQR não pressupõe distribuição normal, ao contrário do z-score simples. É o critério documentado como "inner fence" nas referências de estatística aplicada, com um limiar mais largo (×3) para os casos extremos.

**Fonte:** NIST/SEMATECH, "e-Handbook of Statistical Methods", secção 7.1.6, https://www.itl.nist.gov/div898/handbook/prc/section1/prc16.htm, consultado 2026-09-17. Define a "inner fence" em Q1 − 1,5×IQR e Q3 + 1,5×IQR, a "outer fence" em ×3×IQR, e reserva o Grubbs' Test, que exige normalidade, como alternativa paramétrica.

**Contra:** O z-score modificado (mediana e MAD) resiste melhor quando os próprios outliers distorcem Q1 e Q3, em amostras pequenas ou com cauda muito pesada; nesse caso vale a pena reconsiderar.

**Confiança:** alta

## D-DAT02 — Com que medida imputar os ausentes numéricos?

**Temas:** dados-e-ml · **Regras afectadas:** nenhuma (relacionada com DML-011, DML-012)

**Decisão:** Usa a mediana como imputação por omissão para ausentes numéricos, com o desvio justificado por coluna.

**Porquê:** A mediana resiste a outliers, a média não: um único valor muito distante desloca a média mas quase não move a mediana. A escolha nunca se aplica a colunas onde o zero é um valor legítimo.

**Fonte:** NIST/SEMATECH, "e-Handbook of Statistical Methods" (Mean Plot), https://www.itl.nist.gov/div898/handbook/eda/section3/meanplot.htm, consultado 2026-09-17. Diz que se usa a mediana em vez da média quando há outliers significativos, por ser uma medida de localização mais robusta. scikit-learn, "SimpleImputer", https://scikit-learn.org/stable/modules/generated/sklearn.impute.SimpleImputer.html, versão 1.9.1, documenta as estratégias "mean" e "median" sem comparar a robustez de uma e de outra.

**Contra:** A média mantém-se aceitável em colunas sem outliers relevantes e é mais simples de justificar a quem lê o código; se a coluna for conhecida e limpa, pode preferir-se.

**Confiança:** alta

## D-DAT03 — Onde acaba o `inplace=True` e começa o DataFrame derivado?

**Temas:** dados-e-ml · **Regras afectadas:** nenhuma (relacionada com UX-013)

**Decisão:** A limpeza produz um DataFrame canónico por reatribuição explícita; cada análise ou gráfico deriva o seu próprio DataFrame a partir desse. Não uses `inplace=True`.

**Porquê:** Os mantenedores do pandas decidiram remover progressivamente o parâmetro `inplace`. Com o Copy-on-Write, que passa a ser o único comportamento a partir do pandas 3.0, os métodos `inplace` deixam de alterar o objecto original em vários casos.

**Fonte:** pandas, "PDEP-8: In-place methods in pandas" (estado: Accepted), https://pandas.pydata.org/pdeps/0008-inplace-methods-in-pandas.html, consultado 2026-09-17. Decide remover `inplace` de métodos como `drop`, `dropna`, `rename` e `reset_index`, com aviso de depreciação a partir da 2.2/3.0 e remoção completa na 4.0.

**Contra:** Nenhuma fonte reconhecida defende manter `inplace=True` como prática central; é a própria pandas quem descontinua o parâmetro.

**Confiança:** alta

## D-DAT04 — O `LabelEncoder` pode ser aplicado a atributos nominais?

**Temas:** dados-e-ml · **Regras afectadas:** nenhuma

**Decisão:** Não. Usa o `LabelEncoder` só na variável-alvo (y); usa `OrdinalEncoder` nos atributos com ordem natural e `OneHotEncoder` (com uma coluna removida) nos restantes.

**Porquê:** A própria documentação diz para que serve o `LabelEncoder`, e não é para atributos de entrada. Aplicá-lo a uma coluna nominal introduz uma ordem que não existe e distorce modelos sensíveis à magnitude do valor.

**Fonte:** scikit-learn, "LabelEncoder", https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.LabelEncoder.html, versão 1.9.1. Diz que o transformador serve para codificar valores-alvo (y), não a entrada (X), e remete para `OrdinalEncoder` e `OneHotEncoder` quanto às features.

**Contra:** Nenhum; codificar todas as colunas categóricas com `LabelEncoder` é um atalho de código, não uma alternativa defendida pela documentação.

**Confiança:** alta

## D-DAT05 — O `fit` dos transformadores faz-se antes ou depois da divisão treino/teste?

**Temas:** dados-e-ml · **Regras afectadas:** nenhuma (relacionada com DML-013)

**Decisão:** Ajusta (`fit`) qualquer transformador só nos dados de treino; aos dados de teste e a registos novos aplica-se só `transform`.

**Porquê:** A fuga de dados (data leakage) acontece quando a preparação já viu os dados de teste antes da avaliação, o que infla artificialmente o resultado.

**Fonte:** scikit-learn, "Common pitfalls and recommended practices", https://scikit-learn.org/stable/common_pitfalls.html, versão 1.9.1. Diz para nunca incluir dados de teste em `fit` ou `fit_transform`, e recomenda `Pipeline` para garantir essa separação.

**Contra:** Nenhuma fonte reconhecida defende ajustar sobre o conjunto inteiro; a prática do exemplo em Spark não é enunciada como regra pelo próprio curso.

**Confiança:** alta

## D-DAT06 — O conjunto de teste pode servir de validação durante o treino?

**Temas:** dados-e-ml · **Regras afectadas:** DML-014

**Decisão:** Não. Usa três conjuntos quando há escolhas guiadas pelo resultado (early stopping, afinação de hiperparâmetros): treino, validação e teste, e reserva o teste para a avaliação final.

**Porquê:** Usar o teste como validação deixa "vazar" conhecimento sobre ele para as escolhas do modelo, feitas através do ajuste de hiperparâmetros; a métrica final deixa de medir generalização.

**Fonte:** scikit-learn, "Cross-validation: evaluating estimator performance", https://scikit-learn.org/stable/modules/cross_validation.html, versão 1.9.1. Explica que afinar hiperparâmetros contra o conjunto de teste gera sobreajuste a esse conjunto, e recomenda um conjunto de validação, ou validação cruzada, antes da avaliação final.

**Contra:** Um terceiro conjunto reduz os dados disponíveis para treino; a validação cruzada mitiga isso sem abdicar do princípio.

**Confiança:** alta

## D-DAT07 — Como medir similaridade semântica entre textos no projecto?

**Temas:** nlp · **Regras afectadas:** NLP-004

**Decisão:** Usa embeddings de frase (sentence-transformers ou equivalente) com similaridade de cosseno; não uses o `similarity()` do spaCy para comparar frases.

**Porquê:** O spaCy documenta que a similaridade por omissão de um `Doc` é a média dos vectores das palavras, insensível à ordem, e pede "expectativas realistas" quanto à precisão do resultado. Um pipeline de RAG já embebe os chunks por sentence-transformers, o que evita manter duas representações.

**Fonte:** spaCy, "Linguistic Features" (secção sobre vectores de palavras e similaridade), https://spacy.io/usage/linguistic-features, consultado 2026-09-17. Diz que a similaridade por omissão é a média dos vectores de tokens, "que não é necessariamente representativa da frase", e que os modelos pequenos (`sm`) nem sequer trazem vectores reais.

**Contra:** O spaCy é mais leve e dispensa um modelo de embeddings adicional; se o projecto não usar RAG nem sentence-transformers por outro motivo, o custo da nova dependência pode não compensar.

**Confiança:** alta

## D-DAT08 — Que abordagem usar para análise de sentimentos em português?

**Temas:** nlp · **Regras afectadas:** nenhuma

**Decisão:** Usa um modelo treinado directamente em português, como o `pysentimiento`, em vez de VADER com tradução prévia para inglês.

**Porquê:** O VADER foi construído e validado só para texto em inglês; traduzir antes de classificar acrescenta uma dependência externa e um erro próprio de tradução, sem que nenhuma fonte compare as duas abordagens quanto a precisão.

**Fonte:** PyPI, "vaderSentiment", https://pypi.org/project/vaderSentiment/, consultado 2026-09-17, classifica o pacote como "Natural Language :: English". Hugging Face, "pysentimiento/bertweet-pt-sentiment", https://huggingface.co/pysentimiento/bertweet-pt-sentiment, consultado 2026-09-17, descreve um modelo treinado directamente sobre tweets em português (BERTabaporu), com as classes POS/NEG/NEU.

**Contra:** O modelo em português do `pysentimiento` foi treinado em tweets, um domínio diferente do texto do projecto; para texto muito distinto (por exemplo, jurídico), vale a pena avaliar as duas opções num conjunto anotado antes de fixar.

**Confiança:** média

## D-DAT09 — Que modelo de LLM usar nos exemplos e no código do projecto?

**Temas:** nlp · **Regras afectadas:** nenhuma

**Decisão:** Sem fonte que decida um modelo concreto. Fixa o nome do modelo num único ponto de configuração, nunca espalhado pelo código.

**Porquê:** Os nomes citados nos cursos (`gpt-3.5-turbo`, `gemma2-9b-it`) já não representam a oferta actual dos fornecedores, e nenhuma fonte externa compara modelos concretos para este projecto. A decisão estável é de arquitectura, não de modelo.

**Fonte:** Sem fonte que decida o modelo; é escolha de contexto que muda com a oferta dos fornecedores, não uma questão que a documentação oficial resolva.

**Contra:** Nomear um modelo concreto nas regras dá exemplos mais directos aos agentes; o risco é o exemplo ficar desactualizado, o que a variável de configuração evita.

**Confiança:** baixa

## D-DAT10 — Um prompt inicial completo ou fases progressivas numa ferramenta geradora?

**Temas:** ux · **Regras afectadas:** UX-016

**Decisão:** Usa fases progressivas (estrutura, depois interactividade, depois polimento), com o contexto todo dado logo no primeiro pedido.

**Porquê:** O argumento do prompt único é o custo por prompt de plataformas que cobram créditos, o que não se aplica ao projecto. A documentação do Claude Code recomenda separar exploração, planeamento e implementação, e para funcionalidades maiores fazer o agente entrevistar antes de escrever a spec completa — contexto completo à partida, execução em fases.

**Fonte:** Anthropic, "Best practices for Claude Code", https://code.claude.com/docs/en/best-practices, consultado 2026-09-17. Recomenda o ciclo explorar → planear → implementar, e para funcionalidades maiores uma entrevista que produz uma spec antes de qualquer código.

**Contra:** Um prompt inicial mais completo reduz as idas e voltas; se a ferramenta cobrar por prompt, como o curso de Eng. IA descreve, o cálculo muda a favor de um único pedido.

**Confiança:** média

## D-DAT11 — Que número usar para a prevalência do daltonismo?

**Temas:** ux · **Regras afectadas:** UX-008

**Decisão:** Mantém a prática já recomendada de não citar número nenhum nos documentos do projecto; se for mesmo preciso citar um, usa cerca de 8% dos homens e 0,4% das mulheres de origem europeia (caucasiana), nunca como valor universal.

**Porquê:** A fonte epidemiológica original mostra que a prevalência varia por população — entre 4% e 6,5% nos homens chineses e japoneses — e que a proporção entre homens e mulheres difere entre europeus e asiáticos. Um único número global é impreciso.

**Fonte:** Jennifer Birch, "Worldwide prevalence of red-green color deficiency", Journal of the Optical Society of America A, vol. 29, n.º 3, pp. 313-320, 2012, https://opg.optica.org/josaa/abstract.cfm?uri=josaa-29-3-313, consultado 2026-09-17. Revê levantamentos populacionais e conclui cerca de 8% nos homens e 0,4% nas mulheres caucasianos europeus.

**Contra:** O "1 em 10 homens, 1 em 200 mulheres" citado num curso está próximo do valor de Birch e é mais fácil de comunicar; ainda assim, não citar número nenhum evita repetir uma cifra específica de uma população que pode não ser a do produto.

**Confiança:** alta

## D-DAT12 — Que versão da WCAG seguir?

**Temas:** ux · **Regras afectadas:** nenhuma

**Decisão:** Segue a WCAG 2.2, a recomendação em vigor do W3C.

**Porquê:** A WCAG 1.0 citada num curso está descontinuada há mais de duas décadas. A WCAG 3.0 ainda não é uma recomendação: é um rascunho de trabalho, sem data de conclusão antes de 2028.

**Fonte:** W3C, "WCAG 2 Overview", https://www.w3.org/WAI/standards-guidelines/wcag/, consultado 2026-09-17. Indica a WCAG 2.2 (publicada a 5 de Outubro de 2023, actualizada a 12 de Dezembro de 2024) como a versão mais recente, e descreve a WCAG 3.0 como um rascunho inicial ainda em desenvolvimento.

**Contra:** Nenhum; nenhum curso defende a WCAG 1.0 como escolha actual, e a 3.0 ainda não é adoptável.

**Confiança:** alta
