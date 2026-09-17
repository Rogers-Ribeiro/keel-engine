# Regras — Código limpo

Prefixo `COD`. Regras confirmadas nas transcrições a 2026-09-17. Síntese de origem: [codigo-limpo](../conhecimento/codigo-limpo.md). Decisões pendentes: [revisão](_revisao/codigo-limpo.md).

## Nomes, comentários e formatação

### COD-001 — Nomes descritivos, sem abreviaturas nem calão

**Regra:** dá a variáveis, funções e classes nomes que descrevam o dado guardado ou a tarefa feita; não uses abreviaturas pouco conhecidas, nomes de uma letra fora de convenções óbvias (como `x`/`y` numa coordenada) nem calão.
**Porquê:** um nome opaco obriga a ler a implementação para perceber o que a variável contém ou o que a função faz.
**Como verificar:** no diff, procurar nomes como `n`, `ymdt`, `build_stuff`, `my_rect` ou `data` genérico, e confirmar que cada nome se percebe sem abrir o código que o usa.
**Fonte:** [Clean Code §2, aula 24](../cursos/writing-clean-code/transcricoes/24-common-errors-pitfalls.md) · [nota](../cursos/writing-clean-code/notas/02-naming-assigning-names-to-variables-functions-classes-more.md) · [Clean Code §7, aula 91](../cursos/writing-clean-code/transcricoes/91-concepts-summary-checklist.md) · [nota](../cursos/writing-clean-code/notas/07-summary-checklist.md)
**Cursos:** 3

### COD-002 — Um só verbo por tipo de operação

**Regra:** usa sempre o mesmo verbo para a mesma categoria de operação em todo o projecto (por exemplo, `get_*` ou `fetch_*`, nunca os dois).
**Porquê:** alternar sinónimos faz o leitor suspeitar de que as operações são diferentes quando não são.
**Como verificar:** procurar no código prefixos sinónimos para a mesma acção (`get_`/`fetch_`/`retrieve_`, `create_`/`make_`) em funções equivalentes.
**Fonte:** [Clean Code §7, aula 91](../cursos/writing-clean-code/transcricoes/91-concepts-summary-checklist.md) · [nota](../cursos/writing-clean-code/notas/07-summary-checklist.md) · [Clean Code §2, aula 24](../cursos/writing-clean-code/transcricoes/24-common-errors-pitfalls.md) · [nota](../cursos/writing-clean-code/notas/02-naming-assigning-names-to-variables-functions-classes-more.md)
**Cursos:** 2

### COD-003 — Comentários só quando o código não pode dizer o mesmo

**Regra:** não escrevas comentários que repetem o que o código ou os nomes já dizem, nem divisores de blocos; os únicos comentários aceites são avisos legais, explicações que um nome não substitui (por exemplo, de uma expressão regular), avisos sobre restrições do ambiente, `TODO` e docstrings de API pública.
**Porquê:** os comentários redundantes acrescentam texto a ler, e os enganadores tornam suspeitos nomes que estavam certos; um divisor necessário sugere que o ficheiro deve ser dividido.
**Como verificar:** cada comentário novo no diff tem de caber numa das categorias aceites; um comentário que contradiz o nome da função obriga a renomear a função.
**Fonte:** [Clean Code §3, aula 30](../cursos/writing-clean-code/transcricoes/30-bad-comments.md) · [Clean Code §3, aula 31](../cursos/writing-clean-code/transcricoes/31-good-comments.md) · [nota](../cursos/writing-clean-code/notas/03-code-structure-comments-formatting.md)
**Cursos:** 2

### COD-004 — Sem código comentado nem código morto

**Regra:** apaga o código que já não é preciso em vez de o deixar comentado ou esquecido no projecto; o histórico do Git guarda-o.
**Porquê:** o código comentado permanente polui os ficheiros, e o código morto que ninguém se atreve a apagar solidifica-se (o anti-padrão "fluxo de lava").
**Como verificar:** o diff não acrescenta blocos de código comentado; funções, classes e ramos sem chamadores são removidos.
**Fonte:** [Clean Code §3, aula 30](../cursos/writing-clean-code/transcricoes/30-bad-comments.md) · [nota](../cursos/writing-clean-code/notas/03-code-structure-comments-formatting.md) · [Padrões §12, aula 91](../cursos/padroes-de-projeto-com-python/transcricoes/91-antipadroes-no-desenvolvimento-de-software.md) · [nota](../cursos/padroes-de-projeto-com-python/notas/12-antipadroes.md)
**Cursos:** 2

### COD-005 — PEP 8 e formatação automática

**Regra:** segue o guia de estilo PEP 8 e usa formatação automática e linter, em complemento das restantes regras de código limpo.
**Porquê:** o guia da linguagem e as ferramentas do editor ajudam a manter o código legível, mas não substituem as regras gerais.
**Como verificar:** o formatador e o linter do projecto passam sem erros no diff.
**Fonte:** [Clean Code §7, aula 91](../cursos/writing-clean-code/transcricoes/91-concepts-summary-checklist.md) · [nota](../cursos/writing-clean-code/notas/07-summary-checklist.md) · [Python 3 §5, aula 262](../cursos/python-3-do-zero-ao-avancado/transcricoes/262-dica-extra-tipagem-linters-e-settings-json-do-vs-code.md) · [nota](../cursos/python-3-do-zero-ao-avancado/notas/05-introducao-a-programacao-orientada-a-objetos-em-python-poo-c.parte-3.md)
**Cursos:** 2

## Funções

### COD-006 — Um só nível de abstracção por função

**Regra:** cada função faz uma coisa: o corpo fica um nível de abstracção abaixo do que o nome promete e não mistura operações de alto e de baixo nível.
**Porquê:** um salto grande entre o nome e o código, ou níveis misturados, obriga a interpretar cada linha.
**Como verificar:** numa função como `save_user`, não aparecem verificações de baixo nível (por exemplo, `"@" in email`) ao lado de chamadas de alto nível; essas verificações estão extraídas para funções com nome.
**Fonte:** [Clean Code §4, aula 48](../cursos/writing-clean-code/transcricoes/48-functions-should-be-small-do-one-thing.md) · [nota](../cursos/writing-clean-code/notas/04-functions-methods.md) · [Clean Code §7, aula 91](../cursos/writing-clean-code/transcricoes/91-concepts-summary-checklist.md) · [nota](../cursos/writing-clean-code/notas/07-summary-checklist.md)
**Cursos:** 2

### COD-007 — Poucos parâmetros

**Regra:** mantém curta a lista de parâmetros; quando uma função precisa de vários valores sem ordem óbvia, agrupa-os num objecto ou dicionário.
**Porquê:** muitos parâmetros tornam a função difícil de chamar e a chamada difícil de ler.
**Como verificar:** assinaturas novas com três ou mais parâmetros posicionais sem ordem intuitiva são sinal para agrupar.
**Fonte:** [Clean Code §4, aula 41](../cursos/writing-clean-code/transcricoes/41-keep-the-number-of-parameters-low.md) · [nota](../cursos/writing-clean-code/notas/04-functions-methods.md) · [Clean Code §7, aula 91](../cursos/writing-clean-code/transcricoes/91-concepts-summary-checklist.md) · [nota](../cursos/writing-clean-code/notas/07-summary-checklist.md)
**Cursos:** 1

### COD-008 — Não repetir lógica (DRY)

**Regra:** não dupliques lógica; extrai o código repetido para uma função ou módulo partilhado.
**Porquê:** com lógica duplicada, cada alteração ou correcção tem de ser feita em vários sítios.
**Como verificar:** o diff não introduz blocos iguais ou quase iguais a código já existente; antes de escrever, procura-se o que já existe.
**Fonte:** [Clean Code §4, aula 52](../cursos/writing-clean-code/transcricoes/52-stay-dry-don-t-repeat-yourself.md) · [nota](../cursos/writing-clean-code/notas/04-functions-methods.md) · [Clean Code §7, aula 91](../cursos/writing-clean-code/transcricoes/91-concepts-summary-checklist.md) · [nota](../cursos/writing-clean-code/notas/07-summary-checklist.md)
**Cursos:** 4

### COD-009 — O nome anuncia os efeitos secundários

**Regra:** uma função com efeitos secundários (gravar, iniciar sessão, escrever no ecrã) tem um nome que os deixe prever; uma função cujo nome não os sugere não os tem.
**Porquê:** os efeitos secundários são necessários, mas um efeito inesperado significa que o leitor não percebeu o código.
**Como verificar:** funções como `is_valid` ou `get_*` não gravam, não imprimem nem alteram estado.
**Fonte:** [Clean Code §4, aula 55](../cursos/writing-clean-code/transcricoes/55-understanding-avoiding-unexpected-side-effects.md) · [nota](../cursos/writing-clean-code/notas/04-functions-methods.md) · [Clean Code §7, aula 91](../cursos/writing-clean-code/transcricoes/91-concepts-summary-checklist.md) · [nota](../cursos/writing-clean-code/notas/07-summary-checklist.md)
**Cursos:** 1

### COD-010 — Não alterar os argumentos recebidos

**Regra:** não modifiques os objectos recebidos como argumento (parâmetros de saída); devolve o valor novo. Se uma biblioteca o obrigar, o nome da função tem de o tornar evidente.
**Porquê:** quem chama `create_id(user)` não espera que o `user` seja alterado.
**Como verificar:** procurar atribuições a atributos ou mutações de listas e dicionários recebidos como parâmetro.
**Fonte:** [Clean Code §4, aula 47](../cursos/writing-clean-code/transcricoes/47-beware-of-output-parameters.md) · [nota](../cursos/writing-clean-code/notas/04-functions-methods.md)
**Cursos:** 1

## Controlo de fluxo e erros

### COD-011 — Guardas em vez de aninhamento

**Regra:** evita o aninhamento profundo: verifica no início as condições que impedem o trabalho e sai cedo (`return`, `continue`, excepção), ou extrai para funções as estruturas de controlo aninhadas.
**Porquê:** o código em seta é difícil de ler e de alterar.
**Como verificar:** um `if` que envolve o resto da função, ou vários níveis de indentação dentro de um ciclo, são candidatos a guarda ou a extracção.
**Fonte:** [Clean Code §5, aula 62](../cursos/writing-clean-code/transcricoes/62-guards-in-action.md) · [nota](../cursos/writing-clean-code/notas/05-control-structures-errors.md) · [Clean Code §7, aula 91](../cursos/writing-clean-code/transcricoes/91-concepts-summary-checklist.md) · [nota](../cursos/writing-clean-code/notas/07-summary-checklist.md)
**Cursos:** 1

### COD-012 — Excepções em vez de códigos de erro

**Regra:** quando algo é um erro, lança uma excepção (se preciso, de uma classe própria com os dados necessários); não devolvas objectos com código e mensagem para serem verificados com `if`.
**Porquê:** as excepções substituem os `if` inúteis e deixam as funções mais focadas; o erro sobe até quem o sabe tratar.
**Como verificar:** procurar retornos como `{"code": 422, "message": ...}` ou tuplas de sucesso/erro testadas pelo chamador.
**Fonte:** [Clean Code §5, aula 67](../cursos/writing-clean-code/transcricoes/67-embrace-errors-error-handling.md) · [nota](../cursos/writing-clean-code/notas/05-control-structures-errors.md) · [Clean Code §7, aula 91](../cursos/writing-clean-code/transcricoes/91-concepts-summary-checklist.md) · [nota](../cursos/writing-clean-code/notas/07-summary-checklist.md)
**Cursos:** 1

### COD-013 — O tratamento de erros é a "uma coisa" da função

**Regra:** uma função com `try/except` não faz mais nada além do tratamento: o trabalho dentro do `try` é delegado a outra função.
**Porquê:** tratar erros já é uma tarefa; misturá-la com validação e ciclos mistura níveis de abstracção.
**Como verificar:** funções com `try` que também validam, iteram ou calculam devem ser divididas.
**Fonte:** [Clean Code §5, aula 70](../cursos/writing-clean-code/transcricoes/70-error-handling-is-one-thing.md) · [nota](../cursos/writing-clean-code/notas/05-control-structures-errors.md)
**Cursos:** 1

### COD-014 — Não silenciar excepções

**Regra:** apanha só as excepções que sabes tratar, pelo tipo; nunca deixes um `except` que engula o erro sem o tratar, registar ou relançar.
**Porquê:** os erros não devem passar em silêncio (Zen do Python); um `except Exception` genérico esconde erros reais.
**Como verificar:** procurar `except:`, `except Exception:` e blocos `except` com só `pass`.
**Fonte:** [Python 3 §4, aula 151](../cursos/python-3-do-zero-ao-avancado/transcricoes/151-parte-1-try-e-except-para-tratar-excecoes.md) · [nota](../cursos/python-3-do-zero-ao-avancado/notas/04-python-intermediario-funcoes-dicionarios-modulos-programacao.parte-2.md)
**Cursos:** 1

### COD-015 — `assert` não serve de validação

**Regra:** não uses `assert` para validar dados ou proteger operações críticas; usa excepções explícitas. `assert` fica para contratos entre programadores e para testes.
**Porquê:** as asserções são desligadas quando o Python corre com `-O`, e a protecção desaparece.
**Como verificar:** procurar `assert` fora dos testes, sobretudo antes de operações destrutivas ou sobre entradas externas.
**Fonte:** [Python 3 §14, aula 594](../cursos/python-3-do-zero-ao-avancado/transcricoes/594-assercoes-assertions.md) · [nota](../cursos/python-3-do-zero-ao-avancado/notas/14-testes-e-introducao-ao-tdd-no-python-unittest.md)
**Cursos:** 1

### COD-016 — Comportamento por tipo decidido num só sítio

**Regra:** quando o comportamento varia com o tipo, usa polimorfismo e uma função fábrica que escolhe a implementação num único sítio, em vez de cadeias de `if` por tipo repetidas pelo código.
**Porquê:** o bloco condicional central cresce a cada variante e obriga a mexer em código já testado; a fábrica evita a duplicação.
**Como verificar:** procurar `if tipo == ...`/`isinstance` repetidos para escolher comportamento em mais de um sítio.
**Fonte:** [Clean Code §5, aula 71](../cursos/writing-clean-code/transcricoes/71-using-factory-functions-polymorphism.md) · [nota](../cursos/writing-clean-code/notas/05-control-structures-errors.md) · [SOLID §4, aula 20](../cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/transcricoes/20-entendendo-o-open-closed-principle-ocp.md) · [nota](../cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/notas/04-ocp-open-closed-principle-principio-aberto-fechado.md)
**Cursos:** 3

## Classes e desenho

### COD-017 — Objecto ou contentor de dados, nunca os dois

**Regra:** cada classe é ou um objecto com comportamento, que esconde o estado atrás de métodos, ou um contentor de dados, que expõe os campos e quase não tem lógica; não mistures os dois.
**Porquê:** a mistura produz código pouco limpo e faz as mudanças internas propagarem-se a quem usa a classe.
**Como verificar:** uma classe com regras de negócio não expõe atributos públicos para serem alterados de fora; um contentor não acumula métodos de lógica.
**Fonte:** [Clean Code §6, aula 79](../cursos/writing-clean-code/transcricoes/79-why-the-differentiation-matters.md) · [nota](../cursos/writing-clean-code/notas/06-objects-classes-data-containers-structures.md) · [Clean Code §7, aula 91](../cursos/writing-clean-code/transcricoes/91-concepts-summary-checklist.md) · [nota](../cursos/writing-clean-code/notas/07-summary-checklist.md)
**Cursos:** 2

### COD-018 — Uma responsabilidade por classe (SRP)

**Regra:** cada classe tem uma só responsabilidade, isto é, um só motivo para mudar; se enumeras dois motivos, divide-a. Uma responsabilidade não significa um só método.
**Porquê:** numa classe "faz-tudo", uma mudança num assunto arrisca partir os outros; depois da divisão, cada alteração fica numa só classe.
**Como verificar:** perguntar, para cada classe nova ou alterada, que motivos a fariam mudar; dados, regras e envio de email na mesma classe violam a regra.
**Fonte:** [SOLID §2, aula 7](../cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/transcricoes/07-entendendo-o-single-responsibility-principle-srp.md) · [nota](../cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/notas/02-srp-single-responsibility-principle-principio-da-responsabil.md) · [Clean Code §7, aula 91](../cursos/writing-clean-code/transcricoes/91-concepts-summary-checklist.md) · [nota](../cursos/writing-clean-code/notas/07-summary-checklist.md)
**Cursos:** 4

### COD-019 — Lei de Demeter: não encadear acessos a outros objectos

**Regra:** um método só usa os atributos e métodos do próprio objecto, dos parâmetros e dos objectos que cria; não encadeies acessos ao interior de outros objectos (`self.customer.last_purchase.date`). Em vez de perguntar, diz ao objecto o que fazer ou passa-lhe o que precisa.
**Porquê:** depender do interior de objectos alheios torna o código mais lento de ler e difícil de manter.
**Como verificar:** procurar cadeias de dois ou mais acessos a atributos de outros objectos.
**Fonte:** [Clean Code §6, aula 83](../cursos/writing-clean-code/transcricoes/83-the-law-of-demeter-and-why-you-should-tell-not-ask.md) · [nota](../cursos/writing-clean-code/notas/06-objects-classes-data-containers-structures.md) · [Clean Code §7, aula 91](../cursos/writing-clean-code/transcricoes/91-concepts-summary-checklist.md) · [nota](../cursos/writing-clean-code/notas/07-summary-checklist.md)
**Cursos:** 2

### COD-020 — Variantes novas em classes novas (OCP)

**Regra:** para suportar uma variante nova, acrescenta uma classe que cumpra o contrato comum, em vez de alterar classes já existentes e testadas.
**Porquê:** o sistema cresce sem modificar as classes que já funcionam.
**Como verificar:** um diff que acrescenta um caso a um bloco condicional numa classe existente, para suportar mais um formato ou fornecedor, viola a regra.
**Fonte:** [SOLID §4, aula 20](../cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/transcricoes/20-entendendo-o-open-closed-principle-ocp.md) · [nota](../cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/notas/04-ocp-open-closed-principle-principio-aberto-fechado.md) · [Clean Code §6, aula 86](../cursos/writing-clean-code/transcricoes/86-the-open-closed-principle-ocp-why-it-matters.md) · [nota](../cursos/writing-clean-code/notas/06-objects-classes-data-containers-structures.md)
**Cursos:** 3

### COD-021 — Subclasses substituíveis (LSP)

**Regra:** uma subclasse tem de poder substituir a classe-base sem mudar o comportamento esperado; se não pode (o pinguim que não voa), a hierarquia está mal modelada e muda-se a base ou a relação.
**Porquê:** o princípio obriga a modelar os dados correctamente; a semelhança no mundo real não garante a substituição.
**Como verificar:** métodos sobrepostos que lançam erro, ficam vazios ou mudam o resultado (o quadrado que herda do retângulo); testar a subclasse no lugar da base.
**Fonte:** [SOLID §5, aula 26](../cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/transcricoes/26-entendendo-o-liskov-substituion-principal.md) · [nota](../cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/notas/05-lsp-liskov-substitution-principle-principio-de-substituicao.md) · [Clean Code §6, aula 87](../cursos/writing-clean-code/transcricoes/87-the-liskov-substitution-principle.md) · [nota](../cursos/writing-clean-code/notas/06-objects-classes-data-containers-structures.md)
**Cursos:** 3

### COD-022 — Interfaces pequenas (ISP)

**Regra:** define várias interfaces específicas em vez de uma "gorda"; nenhuma classe é obrigada a implementar métodos de que não precisa.
**Porquê:** baixo acoplamento e alta coesão; um método vazio só para cumprir a interface é sinal de que ela tem de ser dividida.
**Como verificar:** procurar implementações com métodos vazios, `pass` ou `NotImplementedError` impostos por uma classe abstracta.
**Fonte:** [SOLID §6, aula 31](../cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/transcricoes/31-entendendo-o-interface-segregation-principle.md) · [nota](../cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/notas/06-isp-interface-segregation-principle-principio-da-segregacao.md) · [Padrões §2, aula 6](../cursos/padroes-de-projeto-com-python/transcricoes/06-principios-do-design-de-software-orientado-a-objetos.md) · [nota](../cursos/padroes-de-projeto-com-python/notas/02-introducao-aos-padroes-de-projeto.md)
**Cursos:** 4

### COD-023 — Depender de abstracções e receber as dependências (DIP)

**Regra:** uma classe recebe as dependências (no construtor) tipadas por uma abstracção e não verifica nem instancia a implementação concreta; quem cria a classe escolhe e prepara a implementação.
**Porquê:** verificar o tipo concreto obriga a mais `if` a cada implementação nova; com a dependência invertida, a criação fica em poucos sítios e o código é mais fácil de manter e estender.
**Como verificar:** procurar instanciações de clientes, bases de dados ou serviços dentro da lógica, e `isinstance` sobre a dependência recebida.
**Fonte:** [SOLID §7, aula 36](../cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/transcricoes/36-entendendo-o-dependency-inversion-principle.md) · [nota](../cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/notas/07-dip-dependency-inversion-principle-principio-da-inversao-de.md) · [Clean Code §6, aula 89](../cursos/writing-clean-code/transcricoes/89-the-dependency-inversion-principle.md) · [nota](../cursos/writing-clean-code/notas/06-objects-classes-data-containers-structures.md)
**Cursos:** 4

### COD-024 — Preferir composição a herança

**Regra:** prefere compor objectos a herdar; usa herança só quando a subclasse é de facto um subtipo substituível da base.
**Porquê:** as hierarquias profundas ficam difíceis de seguir, e a herança por semelhança (quadrado/retângulo) partiu o comportamento; compor resolveu o problema.
**Como verificar:** herança usada só para reaproveitar código, ou relações "tem um" modeladas como herança.
**Fonte:** [Python 3 §5, aula 230](../cursos/python-3-do-zero-ao-avancado/transcricoes/230-parte-4-eletronico-smartphone-com-mixin-e-a-uniao-de-tudo-ate-aqui.md) · [nota](../cursos/python-3-do-zero-ao-avancado/notas/05-introducao-a-programacao-orientada-a-objetos-em-python-poo-c.parte-2.md) · [SOLID §5, aula 27](../cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/transcricoes/27-refactoring-do-projeto-aplicando-o-principio-na-pratica.md) · [nota](../cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/notas/05-lsp-liskov-substitution-principle-principio-de-substituicao.md)
**Cursos:** 3

### COD-025 — Contratos com `ABC` e `@abstractmethod`

**Regra:** declara os contratos como classes que herdam de `ABC`, com os métodos obrigatórios marcados com `@abstractmethod`; quando o método tem outros decoradores (`@property`, `@classmethod`…), `@abstractmethod` é o mais interno.
**Porquê:** o Python recusa instanciar uma implementação que se esqueceu de um método abstracto, e avisa logo.
**Como verificar:** as abstracções usadas na injecção de dependências herdam de `ABC`, e `@abstractmethod` fica imediatamente acima do `def`.
**Fonte:** [Python 3 §5, aula 231](../cursos/python-3-do-zero-ao-avancado/transcricoes/231-classes-abstratas-abstract-base-class-abc-python-orientado-a-objetos.md) · [nota](../cursos/python-3-do-zero-ao-avancado/notas/05-introducao-a-programacao-orientada-a-objetos-em-python-poo-c.parte-2.md)
**Cursos:** 2

## Testes

### COD-026 — Testes automatizados para o código novo

**Regra:** cobre o código novo com testes unitários automatizados; não te fiques pela verificação manual.
**Porquê:** os testes evitam regressões e ajudam a escrever código limpo, porque uma função difícil de testar isoladamente está a fazer demasiado.
**Como verificar:** um diff com lógica nova traz os testes correspondentes, que correm sem intervenção manual.
**Fonte:** [Clean Code §4, aula 57](../cursos/writing-clean-code/transcricoes/57-why-unit-tests-matter-help-a-lot.md) · [nota](../cursos/writing-clean-code/notas/04-functions-methods.md) · [SOLID §3, aula 12](../cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/transcricoes/12-o-que-sao-os-testes-de-software.md) · [nota](../cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/notas/03-extra-implementando-testes-de-unidade-automatizados.md)
**Cursos:** 3

### COD-027 — Serviços externos simulados nos testes unitários

**Regra:** nos testes unitários, substitui as chamadas a serviços externos (HTTP, bases de dados) por mocks, por exemplo com `unittest.mock.patch`.
**Porquê:** o teste deve verificar o nosso código e não falhar porque um servidor externo está em baixo.
**Como verificar:** os testes unitários não fazem pedidos de rede reais; as respostas de sucesso e de erro (por exemplo, 404) são simuladas.
**Fonte:** [Python 3 §14, aula 598](../cursos/python-3-do-zero-ao-avancado/transcricoes/598-unittest-3-com-tdd.md) · [nota](../cursos/python-3-do-zero-ao-avancado/notas/14-testes-e-introducao-ao-tdd-no-python-unittest.md)
**Cursos:** 1
