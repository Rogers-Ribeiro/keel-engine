# Regras — Testes

Prefixo `TST`. ## Testes automatizados

### TST-001 — Testes guardados no repositório

**Regra:** cada funcionalidade nova ou alterada leva testes automatizados num módulo de testes próprio (por exemplo, `test_<modulo>.py` para `<modulo>.py`); uma verificação manual no terminal não conta como teste.
**Porquê:** os testes feitos à mão perdem-se, e só os que ficam guardados no código apanham as regressões quando o programa cresce e mostram a quem chega depois o que o código deve fazer.
**Como verificar:** o diff que muda comportamento traz também testes novos ou alterados; não há testes apagados nem comentados sem justificação.
**Cursos:** 2

### TST-002 — Casos inválidos e excepções testados

**Regra:** além do caminho feliz, testa as entradas que o código deve rejeitar e as excepções que deve levantar, afirmando o tipo da excepção (por exemplo, `assertRaises` como gestor de contexto).
**Porquê:** os cursos testam explicitamente o lado negativo das validações (um item inválido tem de dar falso, um argumento de tipo errado tem de levantar a excepção certa), porque os erros nesse lado passam despercebidos.
**Como verificar:** cada validação ou ramo de erro novo tem pelo menos um teste que o exercita e que falharia se a excepção fosse outra ou não fosse levantada.
**Cursos:** 2

### TST-003 — Casos que só mudam nos dados são parametrizados

**Regra:** quando o mesmo teste corre com várias combinações de entrada e saída, usa o mecanismo de parametrização da framework (`subTest` no `unittest`) em vez de duplicar métodos ou de percorrer um ciclo sem identificar o caso.
**Porquê:** com parametrização, a falha diz que valores a causaram; num ciclo simples só se sabe que um dos casos falhou, e os métodos duplicados só mudam o valor de entrada.
**Como verificar:** não há métodos de teste quase iguais que só diferem nos literais, nem ciclos de asserções sem `subTest` ou equivalente.
**Cursos:** 2

## Isolamento e desenho testável

### TST-004 — Serviços externos isolados nos testes unitários

**Regra:** nos testes unitários, substitui as dependências externas (HTTP, base de dados, LLM) por mocks ou falsos em memória; o teste unitário não abre ligações de rede nem precisa de chaves de API.
**Porquê:** um teste unitário não deve falhar porque um servidor externo está em baixo, e com as dependências substituídas o caso de uso testa-se sem base de dados nem framework. A técnica (mock por `patch` ou falso injectado) está em [revisão](_revisao/testes.md).
**Como verificar:** os testes unitários correm sem rede, sem base de dados e sem variáveis de ambiente de fornecedores; os falsos reutilizáveis ficam numa pasta comum.
**Cursos:** 3

### TST-005 — Função difícil de testar é dividida

**Regra:** quando testar uma parte de uma função obriga a correr também outras responsabilidades dela (por exemplo, escrever na base de dados só para verificar a geração de um ID), divide a função antes de escrever mais testes.
**Porquê:** a dificuldade em testar isoladamente é o sinal de que a função faz demasiadas coisas; funções pequenas, com uma só responsabilidade, são mais fáceis de testar.
**Como verificar:** os testes não precisam de efeitos secundários alheios ao que verificam; várias baterias de testes sobre a mesma função, cada uma a testar uma coisa diferente, indicam que ela deve ser dividida.
**Cursos:** 2

## Testes de sistemas com LLM

### TST-006 — LLM falso a cada commit, LLM real fora desse ciclo

**Regra:** os testes que correm a cada commit usam um modelo falso (a forma documentada é `GenericFakeChatModel(messages=iter([...]))`, de `langchain_core.language_models.fake_chat_models`); os testes que chamam o LLM real ficam numa suite separada, que corre antes do deploy, depois de mudanças de modelo ou de forma agendada.
**Porquê:** os testes com o modelo falso são gratuitos e deterministas e verificam se o código está correcto; os que chamam o LLM real são lentos e custam dinheiro, por isso não correm a cada commit.
**Como verificar:** a suite do commit não precisa de chaves de API; os testes com o LLM real estão marcados ou separados e o pipeline não os corre em cada commit.
**Fonte:** [referência](../docs/langchain-formatos.md)
**Cursos:** 1

### TST-007 — Saídas do LLM não se comparam por igualdade exacta

**Regra:** nos testes com o LLM real, não afirmes que a resposta é igual a um texto; verifica se contém as palavras-chave esperadas ou avalia-a com um LLM juiz (TST-009).
**Porquê:** o LLM não é determinista, e respostas correctas vêm com redacções diferentes; uma asserção de igualdade exacta falha mesmo quando a resposta está certa.
**Como verificar:** não há `assertEqual`/`==` sobre o texto devolvido pelo LLM real; os casos de teste definem as palavras-chave esperadas.
**Cursos:** 1

## Avaliação de LLM e RAG

### TST-008 — Modelos e prompts comparados no mesmo dataset

**Regra:** antes de trocar de modelo ou de versão de prompt, corre a mesma avaliação (o mesmo dataset do LangSmith, com perguntas e respostas de referência, e os mesmos evaluators) para cada candidato, com `evaluate()` do `langsmith`, e compara os experimentos.
**Porquê:** a escolha deixa de ser um palpite: mede-se em cada caso de teste onde a nova versão melhorou ou piorou, em vez de decidir só pelo custo.
**Como verificar:** a mudança de modelo ou de prompt vem acompanhada dos experimentos comparados; o dataset tem respostas de referência e os evaluators não mudaram entre candidatos.
**Fonte:** [referência](../docs/langchain-formatos.md)
**Cursos:** 2

### TST-009 — LLM juiz com saída estruturada

**Regra:** avalia as respostas abertas com uma chamada separada a um LLM juiz, que recebe a pergunta, a resposta e, quando existe, a referência, e devolve uma saída estruturada (com `with_structured_output` no chat model); não avalies à mão nem aceites texto livre do juiz.
**Porquê:** as respostas abertas não têm palavras-chave a verificar e o LLM é bom neste tipo de juízo; forçar um formato fixo torna o resultado agregável. A escala (booleano ou 1 a 10) está em [revisão](_revisao/testes.md).
**Como verificar:** o evaluator usa um modelo configurado com saída estruturada e um schema definido; o prompt do juiz inclui a pergunta, a resposta e a referência.
**Fonte:** [referência](../docs/langchain-formatos.md)
**Cursos:** 2

### TST-010 — RAG avaliado na recuperação e na fundamentação

**Regra:** a avaliação de um RAG não se fica pela resposta final: mede também a relevância dos documentos recuperados face à pergunta e se a resposta está fundamentada nesses documentos.
**Porquê:** avaliar só a resposta final deixa passar alucinações e esconde problemas do retriever mesmo quando a resposta parece boa.
**Como verificar:** o conjunto de evaluators do RAG inclui um que compara os documentos recuperados com a pergunta e outro que compara a resposta com esses documentos; a função avaliada devolve os documentos recuperados.
**Cursos:** 1
