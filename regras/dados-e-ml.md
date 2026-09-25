# Regras — Dados e machine learning

Prefixo `DML`. ## Ingestão de dados para RAG

### DML-001 — Tudo o que é lido vira `Document` (API a confirmar)

**Regra:** converte o resultado de qualquer fonte (texto, PDF, Word, CSV, Excel, JSON, SQL) numa lista de `Document`, com `page_content` preenchido e `metadata` com a origem (ficheiro, página, tabela, linha).
**Porquê:** é a estrutura que o resto do pipeline espera antes de vectorizar, e a metadata é o que permite filtrar a pesquisa, rastrear a origem de uma resposta e depurar.
**Como verificar:** cada função de ingestão devolve `list[Document]`; nenhum chunk chega ao índice com `metadata` vazia.
**Cursos:** 1

### DML-002 — `RecursiveCharacterTextSplitter` por omissão (API a confirmar)

**Regra:** usa o `RecursiveCharacterTextSplitter` para fragmentar texto; só usa o `CharacterTextSplitter` quando houver um delimitador único e claro, e o `TokenTextSplitter` quando o limite do modelo for contado em tokens.
**Porquê:** o splitter recursivo tenta uma lista ordenada de separadores e é o recomendado do curso; o de carácter único é previsível mas corta a meio de frases, e o de tokens é mais lento.
**Como verificar:** no código de ingestão, o splitter por omissão é o recursivo; qualquer outro vem com o motivo explicado. Inspecciona os primeiros chunks: com separadores que já cortam em sítios limpos, o `chunk_overlap` configurado pode não ter efeito nenhum e isso passa despercebido.
**Cursos:** 1

### DML-003 — Limpar o texto dos PDFs antes de fragmentar

**Regra:** passa o texto extraído de PDFs por uma função de limpeza (colapsar os espaços em branco num só espaço, repor as ligaduras mal codificadas como "fi" e "fl") antes de o entregar ao splitter.
**Porquê:** o texto cru dos PDFs traz mudanças de linha e caracteres mal codificados que ficam gravados nos chunks e degradam a pesquisa.
**Como verificar:** entre o loader e o splitter existe uma função de limpeza; uma amostra de chunks não tem sequências de mudanças de linha nem ligaduras por converter.
**Cursos:** 1

### DML-004 — Descartar as páginas quase vazias

**Regra:** depois de limpar, descarta as páginas cujo texto fique com menos de 50 caracteres, em vez de gerar chunks a partir delas.
**Porquê:** uma página com tão pouco texto não tem informação útil e só acrescenta ruído ao índice.
**Como verificar:** o processador tem um limiar mínimo de caracteres por página, aplicado depois da limpeza e antes do `create_documents`.
**Cursos:** 1

### DML-005 — `DirectoryLoader` só com ficheiros do mesmo tipo (API a confirmar)

**Regra:** só usa o `DirectoryLoader` em pastas onde todos os ficheiros são do mesmo tipo; com tipos misturados, escolhe o loader por extensão.
**Porquê:** o `DirectoryLoader` recebe uma só `loader_class` e aplica-a a tudo o que o glob apanhar, e o tratamento de erros por ficheiro é limitado.
**Como verificar:** cada `DirectoryLoader` tem um glob de uma só extensão, coerente com a `loader_class`.
**Cursos:** 1

### DML-006 — CSV com relações entre linhas leva processamento próprio (API a confirmar)

**Regra:** usa o `CSVLoader` (um `Document` por linha) só quando as perguntas se respondem linha a linha; quando a resposta depender da relação entre registos ou entre ficheiros, percorre o DataFrame e monta os `Document` com esse contexto na `metadata`.
**Porquê:** o loader por linha perde o contexto da tabela e as respostas ficam piores; o processamento próprio preserva as relações, permite resumos e dá metadata mais rica.
**Como verificar:** para cada fonte tabular, a spec diz que perguntas tem de responder; se exigirem relações entre linhas, o código não é um `CSVLoader` directo.
**Cursos:** 1

## LLM sobre dados tabulares

### DML-007 — Configurar o LLM das integrações do LlamaIndex (API a confirmar)

**Regra:** define explicitamente o LLM das integrações do LlamaIndex (`Settings.llm`) antes de instanciar o `PandasQueryEngine` ou outro motor de consulta.
**Porquê:** a integração assume a OpenAI por omissão; sem configuração explícita, o código passa a depender de um fornecedor e de uma chave que não são os do projecto.
**Como verificar:** no diff, qualquer uso do LlamaIndex é precedido da configuração do LLM; não há chamadas que corram com o fornecedor por omissão.
**Cursos:** 1

## Ambiente e dependências

### DML-008 — Gerir o ambiente com uv, sem misturar pip

**Regra:** cria e mantém o ambiente com `uv` (`uv init`, `uv venv`, `uv add`); não instales pacotes com pip no mesmo projecto.
**Porquê:** o que se instala com pip não fica registado no `pyproject.toml` que o uv gere, e o ambiente deixa de ser reproduzível a partir do ficheiro.
**Como verificar:** o diff não acrescenta comandos `pip install`; toda a dependência nova aparece no `pyproject.toml`.
**Cursos:** 1

### DML-009 — Ambiente isolado e versões registadas

**Regra:** dá a cada projecto (e a cada modelo pré-treinado com dependências próprias) um ambiente virtual só dele e regista a versão de cada biblioteca que ele precisa, não só o nome.
**Porquê:** os modelos pré-treinados exigem versões concretas das bibliotecas; sem isolamento e sem versões registadas, a instalação falha ou o comportamento muda de máquina para máquina.
**Como verificar:** o ficheiro de dependências tem versões, não só nomes; dependências incompatíveis não partilham ambiente.
**Cursos:** 1

## Preparação e limpeza de dados

### DML-010 — Confirmar os tipos das colunas depois de importar

**Regra:** depois de ler um ficheiro externo, verifica `df.dtypes` e converte as colunas numéricas, removendo antes os símbolos (moeda, separador de milhares) ou usando `pd.to_numeric(..., errors="coerce")`.
**Porquê:** uma coluna que devia ser numérica chega como `object` por causa de um cifrão ou de uma vírgula, e o `astype(float)` rebenta; sem a verificação, o erro só aparece a jusante.
**Como verificar:** o código de ingestão mostra os tipos depois da conversão; nenhuma coluna usada em cálculos fica como `object`.
**Cursos:** 1

### DML-011 — Quantificar os ausentes antes de os tratar

**Regra:** antes de decidir o que fazer com os valores em falta, conta-os por coluna (`isnull().sum()`) e compara com o total de registos; só depois escolhes entre remover a coluna, remover as linhas ou imputar.
**Porquê:** a decisão depende da proporção: remover uma coluna inteira por causa de 11 registos em 7043 é desproporcionado, e passar à modelação sem decidir deixa o problema por resolver.
**Como verificar:** o notebook ou o módulo mostra a contagem de ausentes antes da primeira alteração, e a escolha de tratamento está justificada com esse número.
**Cursos:** 1

### DML-012 — Não imputar valores em dados operacionais

**Regra:** em dados operacionais, onde cada registo vale por si, não substituas valores em falta por medidas estatísticas; a imputação só se aplica ao conjunto analítico ou de treino.
**Porquê:** no operacional o dado é individual — preencher a data de nascimento de um cliente com a mediana dos outros altera o que lhe é cobrado. No analítico o modelo é colectivo e a imputação não o enviesa da mesma maneira.
**Como verificar:** no diff, qualquer `fillna` com média, mediana ou moda está no caminho analítico; o caminho que escreve no sistema de origem não tem imputação.
**Cursos:** 1

### DML-013 — Reutilizar os transformadores já ajustados nos dados novos

**Regra:** guarda o vectorizador, o encoder e o scaler usados no treino e aplica-lhes só `transform` aos registos novos; nunca cries um objecto novo nem repitas o `fit` para prever.
**Porquê:** um `fit` novo gera outro vocabulário ou outra escala, e a entrada deixa de ser compatível com o modelo que já foi treinado.
**Como verificar:** no caminho de previsão não aparece `fit` nem `fit_transform`, só `transform` sobre objectos carregados.
**Cursos:** 1

## Avaliação de modelos

### DML-014 — Avaliar só com dados que não entraram no treino

**Regra:** mede a performance com dados separados antes do treino (holdout, validação cruzada ou, em séries temporais, os últimos períodos) e nunca com os dados usados para treinar.
**Porquê:** o algoritmo já conhece os dados de treino, por isso a avaliação com eles é enviesada: mede memorização e esconde o sobre-ajuste.
**Como verificar:** a divisão acontece antes do treino, e a previsão avaliada é feita sobre o conjunto de teste (`X_teste`), não sobre o de treino.
**Cursos:** 3

### DML-015 — Olhar a matriz de confusão e o recall, não só a acurácia

**Regra:** ao avaliar um classificador, apresenta a matriz de confusão e as métricas por classe (precisão, recall, F1), além da acurácia.
**Porquê:** com classes desiguais a acurácia pode ser alta num modelo inútil: 96% de acurácia com apenas 40% dos doentes identificados, ou 90% num modelo que empresta dinheiro a quem não paga.
**Como verificar:** o relatório de avaliação inclui a matriz de confusão e o recall da classe rara; nenhuma decisão se justifica só com a acurácia.
**Cursos:** 2

### DML-016 — Registar o custo de cada tipo de erro antes de escolher o modelo

**Regra:** antes de escolher o modelo, a métrica a optimizar ou o limiar de decisão, escreve o que custa ao negócio um falso positivo e um falso negativo.
**Porquê:** os dois erros raramente custam o mesmo: no crédito, um é perda directa de dinheiro e o outro é perda de oportunidade; no diagnóstico, o falso negativo pode atrasar um tratamento. Sem esse custo, a métrica escolhida é arbitrária.
**Como verificar:** a spec ou o ADR do modelo tem uma frase por tipo de erro, com o custo, e a métrica escolhida decorre dela.
**Cursos:** 2

### DML-017 — Fixar a semente no que tiver de se repetir

**Regra:** define a semente (`random_state`, `np.random.seed`) em todas as divisões, amostragens e treinos cujo resultado tenha de ser reproduzível, e usa a mesma semente quando comparares duas variantes.
**Porquê:** sem semente, cada execução divide os dados de outra maneira e os resultados deixam de ser comparáveis. Com a mesma semente, duas variantes recebem exactamente as mesmas linhas de treino e de teste.
**Como verificar:** nenhuma chamada a `train_test_split` ou a um estimador com aleatoriedade fica sem semente. Regista também que a semente não garante o mesmo resultado noutra versão de biblioteca, noutro processador, ou com algoritmos não determinísticos.
**Cursos:** 1

### DML-018 — Monitorizar depois de pôr em produção

**Regra:** um modelo posto em produção fica com monitorização da performance e com um plano de re-treino; não se dá por terminado na implantação.
**Porquê:** o modelo não muda, mas o mundo muda: o perfil dos casos que chegam altera-se e a performance cai com o tempo.
**Como verificar:** a spec de implantação diz que métrica é seguida, com que frequência e qual o limiar que dispara o re-treino.
**Cursos:** 2

## Armazenamento

### DML-019 — Escolher o motor de dados pelo padrão de acesso

**Regra:** antes de escolher onde guardar cada parte do domínio, levanta o padrão de acesso e escolhe o motor adequado (relacional, documentos, chave-valor, grafo, object storage); não uses um só motor por ser o que já está instalado.
**Porquê:** o ganho da persistência poliglota vem de guardar cada coisa na base certa — imagens em object storage, dados muito lidos em cache, relações a percorrer num grafo. Escolher pela ferramenta que se tem à mão complica o sistema.
**Como verificar:** a decisão de armazenamento traz o padrão de acesso que a justifica (leitura vs escrita, consultas por relação, volume, transacções).
**Cursos:** 1

### DML-020 — Nunca `UPDATE` ou `DELETE` sem `WHERE`

**Regra:** todo o `UPDATE` e todo o `DELETE` leva `WHERE`, salvo se a intenção for mesmo afectar a tabela inteira e isso estiver dito; corre antes um `SELECT` com o mesmo `WHERE` para ver que linhas apanha.
**Porquê:** sem `WHERE`, o comando actualiza ou apaga todas as linhas da tabela, e em produção isso destrói os dados sem aviso.
**Como verificar:** procura no diff por `UPDATE` e `DELETE` sem `WHERE`, incluindo o SQL montado em strings dentro do Python.
**Cursos:** 2
