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
**Fonte:** [referência](https://github.com/Rogers-Ribeiro/keel-engine/blob/v0.23.3/docs/langchain-formatos.md)
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
**Fonte:** [referência](https://github.com/Rogers-Ribeiro/keel-engine/blob/v0.23.3/docs/langchain-formatos.md)
**Cursos:** 2

### TST-009 — LLM juiz com saída estruturada

**Regra:** avalia as respostas abertas com uma chamada separada a um LLM juiz, que recebe a pergunta, a resposta e, quando existe, a referência, e devolve uma saída estruturada (com `with_structured_output` no chat model); não avalies à mão nem aceites texto livre do juiz.
**Porquê:** as respostas abertas não têm palavras-chave a verificar e o LLM é bom neste tipo de juízo; forçar um formato fixo torna o resultado agregável. A escala (booleano ou 1 a 10) está em [revisão](_revisao/testes.md).
**Como verificar:** o evaluator usa um modelo configurado com saída estruturada e um schema definido; o prompt do juiz inclui a pergunta, a resposta e a referência.
**Fonte:** [referência](https://github.com/Rogers-Ribeiro/keel-engine/blob/v0.23.3/docs/langchain-formatos.md)
**Cursos:** 2

### TST-010 — RAG avaliado na recuperação e na fundamentação

**Regra:** a avaliação de um RAG não se fica pela resposta final: mede também a relevância dos documentos recuperados face à pergunta e se a resposta está fundamentada nesses documentos.
**Porquê:** avaliar só a resposta final deixa passar alucinações e esconde problemas do retriever mesmo quando a resposta parece boa.
**Como verificar:** o conjunto de evaluators do RAG inclui um que compara os documentos recuperados com a pergunta e outro que compara a resposta com esses documentos; a função avaliada devolve os documentos recuperados.
**Cursos:** 1

## Da prática de um projecto

Estas duas regras não saem de curso nenhum: nasceram da prática de um projecto real, onde a falta delas custou caro, e subiram para aqui por isso. O caso que as acompanha vem de uma prova por mutação a um repositório real, em 2026-09.

### TST-011 — Correcção em caminho crítico prova-se por mutação

**Regra:** quando o que se corrige toca isolamento de dados (entre utilizadores, contas ou clientes), autenticação, autorização, dinheiro ou durabilidade de dados, não basta o teste passar: reintroduz-se o defeito numa cópia, corre-se o teste, confirma-se que **falha**, e restaura-se. O resultado dessa prova fica registado no commit ou na spec. A mutação em voo nunca é deixada na árvore. **A mutação tem de ter a forma da falha que se teme, e a falha do teste tem de ser na asserção.** Uma mutação que faz o sistema rebentar — tabela inexistente, ligação perdida — mede que o teste toca no mecanismo, não que verifica a propriedade: a fuga real não rebenta, devolve as linhas do vizinho em silêncio. Logo o defeito injectado produz uma **resposta errada e povoada**, e só conta como prova o teste que fica vermelho no seu próprio `assert`; o que rebenta antes de afirmar fica indeterminado e lê-se à mão.
**Porquê:** um teste que passa prova que o teste passa. A pergunta que importa é se ele falharia caso o defeito voltasse, e a resposta é surpreendentemente vezes «não». Num repositório real, com o mecanismo de isolamento de dados partido de propósito e a suíte corrida contra uma base de dados a sério, **mais de metade dos testes que o deviam verificar continuou verde**, e boa parte dos que falharam rebentou antes de afirmar, sem provar nada. Pior do que o número: os testes cujo **nome** promete isolamento passaram todos, e quem apanhou a mutação tinha sido escrito para outra coisa. São os testes mais importantes do produto e não provavam nada — e ninguém podia saber quais provavam sem correr isto. Nos caminhos onde a falha é silenciosa, a mutação é a única verificação que discrimina.
**Como verificar:** o commit ou a spec da correcção nomeia o que foi mutado, onde, e que o teste falhou com a mutação aplicada **na asserção, e não por excepção**; a mutação produziu dados errados e não uma avaria; a árvore não contém nenhuma mutação por reverter — uma mutação esquecida é indistinguível de uma regressão para quem apanhar a worktree a seguir.
**Fonte:** [pratica-de-projectos](https://github.com/Rogers-Ribeiro/keel-engine/blob/v0.23.3/docs/pratica-de-projectos.md#a-prova-por-mutação-e-a-suíte-que-não-corre)
**Cursos:** 0

### TST-012 — Os testes de isolamento, dinheiro e concorrência correm em todos os PR, e um teste prova-o

**Regra:** os ficheiros de teste que provam isolamento de dados (entre utilizadores, contas ou clientes), dinheiro e concorrência com um só vencedor levam uma marca própria, e um teste de governação enumera-os e falha se algum não estiver no caminho de um job que corre em todos os pedidos de integração, ou se esse job puder saltar em silêncio — por variável de ambiente que nada define, por *skip* condicionado à infra-estrutura, ou por pasta que o CI não visita. O job com base de dados falha se a base não responder; nunca salta. Enquanto o repositório não tiver protecção de ramo (PROC-050), este teste **corre como aviso e não bloqueia**; a regra di-lo para que ninguém a leia como um portão que não existe.
**Porquê:** o defeito encontrado não foi faltarem testes de isolamento. Foi metade dos que discriminavam nunca correr, e a suíte obrigatória ter corrido zero testes durante semanas sem que nada o dissesse; um mecanismo de *skip* morto — um ficheiro que salta sempre em verde por depender de uma variável que nada define — é indistinguível de cobertura. A pasta onde um teste vive não pode decidir se ele corre.
**Como verificar:** o teste de governação existe, lê a marca e a configuração do CI, e falha ao retirar um ficheiro marcado do job de PR ou ao introduzir um *skip* condicional; o job com base de dados falha, e não salta, quando a base não responde.
**Fonte:** [pratica-de-projectos](https://github.com/Rogers-Ribeiro/keel-engine/blob/v0.23.3/docs/pratica-de-projectos.md#a-prova-por-mutação-e-a-suíte-que-não-corre)
**Cursos:** 0
