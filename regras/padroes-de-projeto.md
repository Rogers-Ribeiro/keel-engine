# Regras — Padrões de projeto

Prefixo `PAD`. Regras confirmadas nas transcrições a 2026-09-17. Síntese de origem: [padroes-de-projeto](../conhecimento/padroes-de-projeto.md). Decisões pendentes: [revisão](_revisao/padroes-de-projeto.md).

## Dependências e fronteiras

### PAD-001 — Dependências injectadas por abstracção

**Regra:** Uma classe de alto nível (caso de uso, orquestrador, agente) recebe as dependências pelo construtor, tipadas por uma abstracção (`ABC` ou `Protocol`), e nunca instancia dentro de si a implementação concreta.
**Porquê:** Instanciar a classe concreta cria acoplamento forte e torna o código frágil às mudanças do módulo de baixo nível; injectar a abstracção permite trocar a implementação e testar a classe isoladamente.
**Como verificar:** No diff, procurar construções de classes concretas (clientes, repositórios, fornecedores) dentro de métodos ou do `__init__` de classes de alto nível; os parâmetros do construtor devem estar anotados com a abstracção e não com a classe concreta.
**Fonte:** [SOLID §7, aula 36](../cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/transcricoes/36-entendendo-o-dependency-inversion-principle.md) · [nota](../cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/notas/07-dip-dependency-inversion-principle-principio-da-inversao-de.md) · [Arq. Limpa §2, aula 29](../cursos/arquitetura-limpa-e-hexagonal/transcricoes/29-criptografar-senha-1.md) · [nota](../cursos/arquitetura-limpa-e-hexagonal/notas/02-arquitetura-hexagonal.md)
**Cursos:** 4

### PAD-002 — Uma porta por dependência externa

**Regra:** Cada necessidade externa de um caso de uso (persistência, criptografia, modelo de linguagem, serviço de terceiros) é exprimida por uma interface (porta) definida no núcleo; a implementação concreta (adaptador) vive fora do núcleo.
**Porquê:** A porta representa uma necessidade de negócio sem tecnologia associada; o caso de uso chega à infraestrutura só de forma indirecta, e trocar o adaptador (memória por base de dados real, por exemplo) não mexe no caso de uso.
**Como verificar:** Os imports dos módulos do núcleo não apontam para pastas de adaptadores nem para bibliotecas de infraestrutura; cada adaptador implementa uma porta declarada no núcleo; trocar de adaptador só altera o ponto de composição.
**Fonte:** [Arq. Limpa §2, aula 29](../cursos/arquitetura-limpa-e-hexagonal/transcricoes/29-criptografar-senha-1.md) · [nota](../cursos/arquitetura-limpa-e-hexagonal/notas/02-arquitetura-hexagonal.md) · [Arq. com IA §3, aula 17](../cursos/ai-driven-development/arquitetura-com-ia/transcricoes/17-casos-de-uso.md) · [nota](../cursos/ai-driven-development/arquitetura-com-ia/notas/03-tatico.md)
**Cursos:** 3

### PAD-003 — Núcleo sem ORM nem frameworks

**Regra:** O núcleo (entidades, casos de uso e portas) não importa ORM, frameworks de persistência nem decoradores de mapeamento; qualquer outra biblioteca no núcleo tem de ser mínima e justificada pelo seu impacto arquitectural.
**Porquê:** As dependências do núcleo devem tender para zero; o mapeamento objecto-relacional no modelo prende as regras de negócio ao mecanismo de armazenamento.
**Como verificar:** Nenhum import de ORM ou de framework nos módulos do núcleo; entidades sem decoradores ou classes-base de persistência; uma dependência nova no núcleo vem acompanhada da justificação.
**Fonte:** [Arq. Limpa §2, aula 33](../cursos/arquitetura-limpa-e-hexagonal/transcricoes/33-gerando-id-com-uuid.md) · [nota](../cursos/arquitetura-limpa-e-hexagonal/notas/02-arquitetura-hexagonal.md)
**Cursos:** 1

### PAD-004 — Interfaces pequenas e específicas

**Regra:** Divide as interfaces por comportamento coeso, de modo a que nenhuma implementação seja obrigada a ter métodos que não usa ou que ficam vazios.
**Porquê:** Uma interface geral força as classes a implementar métodos desnecessários (por exemplo, `connect` numa base de dados em memória); várias interfaces pequenas evitam isso.
**Como verificar:** Procurar métodos de implementação vazios, que só fazem `pass` ou que levantam erro por não se aplicarem; uma classe que precisa só de parte de um contrato indica que a interface deve ser dividida.
**Fonte:** [Clean Code §6, aula 88](../cursos/writing-clean-code/transcricoes/88-the-interface-segregation-principle.md) · [nota](../cursos/writing-clean-code/notas/06-objects-classes-data-containers-structures.md) · [Padrões Python §2, aula 6](../cursos/padroes-de-projeto-com-python/transcricoes/06-principios-do-design-de-software-orientado-a-objetos.md) · [nota](../cursos/padroes-de-projeto-com-python/notas/02-introducao-aos-padroes-de-projeto.md)
**Cursos:** 3

### PAD-005 — Módulos sem dependências cíclicas

**Regra:** O mapa de contexto entre módulos não tem ciclos: se o módulo A depende de B, B não depende de A.
**Porquê:** O curso apresenta a ausência de dependências cíclicas entre módulos como condição do mapa de contexto.
**Como verificar:** Nos imports entre módulos (ou num grafo de dependências), não há caminhos que voltem ao módulo de partida.
**Fonte:** [Arq. com IA §3, aula 18](../cursos/ai-driven-development/arquitetura-com-ia/transcricoes/18-padroes-de-modelagem.md) · [nota](../cursos/ai-driven-development/arquitetura-com-ia/notas/03-tatico.md) · [nota](../cursos/ai-driven-development/arquitetura-com-ia/notas/02-estrategico.md)
**Cursos:** 1

### PAD-006 — Anti-corruption layer para sistemas externos

**Regra:** A tradução de formatos e protocolos de sistemas legados ou de terceiros fica isolada numa camada própria (fachada mais adaptador), e a aplicação só trabalha com o seu formato.
**Porquê:** Sem essa camada, o ruído do sistema externo espalha-se pela aplicação; com ela, vários fornecedores diferentes chegam padronizados e a camada pode ser desligada mudando só o apontamento.
**Como verificar:** Os formatos de resposta de terceiros não aparecem fora da camada de tradução; o resto do código recebe objectos no formato da aplicação.
**Fonte:** [Arq. Sistemas §7, aula 66](../cursos/arquitetura-de-software-design-de-sistemas-modernos/transcricoes/66-anti-corruption-layer-acl.md) · [nota](../cursos/arquitetura-de-software-design-de-sistemas-modernos/notas/07-padroes-de-design-e-evolucao-de-aplicacoes.md)
**Cursos:** 2

## Extensão, herança e colaboração entre objectos

### PAD-007 — Variantes novas por extensão

**Regra:** Suportar uma variante nova (formato, canal, fornecedor, tipo) faz-se criando uma implementação nova do contrato comum, sem acrescentar métodos ou ramos à classe já existente.
**Porquê:** Uma classe que tem de ser editada a cada funcionalidade nova não está fechada a modificação, cresce sem limite e acumula duplicação; a extensão mantém as classes pequenas.
**Como verificar:** No diff de uma variante nova, a classe existente não ganha métodos nem ramos `if/elif` por tipo; aparece uma classe ou função nova que cumpre o contrato.
**Fonte:** [SOLID §4, aula 20](../cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/transcricoes/20-entendendo-o-open-closed-principle-ocp.md) · [nota](../cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/notas/04-ocp-open-closed-principle-principio-aberto-fechado.md) · [Clean Code §6, aula 86](../cursos/writing-clean-code/transcricoes/86-the-open-closed-principle-ocp-why-it-matters.md) · [nota](../cursos/writing-clean-code/notas/06-objects-classes-data-containers-structures.md)
**Cursos:** 4

### PAD-008 — Composição antes de herança

**Regra:** Para reutilizar comportamento, prefere a composição ("tem um") à herança ("é um").
**Porquê:** A composição é mais comum e mais flexível do que a herança, embora ambas sejam formas de reutilização.
**Como verificar:** Uma subclasse nova deve justificar a relação "é um"; herança usada só para aproveitar métodos de outra classe deve ser substituída por um atributo com o objecto colaborador.
**Fonte:** [Arq. Limpa §1, aula 7](../cursos/arquitetura-limpa-e-hexagonal/transcricoes/07-porgramacao-orientada-a-objetos.md) · [nota](../cursos/arquitetura-limpa-e-hexagonal/notas/01-introducao-e-fundamentos.md) · [nota](../cursos/python-3-do-zero-ao-avancado/notas/05-introducao-a-programacao-orientada-a-objetos-em-python-poo-c.parte-2.md)
**Cursos:** 5

### PAD-009 — Subclasses substituíveis

**Regra:** Uma subclasse só é aceite se puder ocupar o lugar da superclasse em qualquer contexto sem alterar o comportamento esperado.
**Porquê:** Uma relação "é um" verdadeira no mundo real (quadrado e rectângulo, pinguim e ave) pode ser errada no código; quando a substituição falha, a hierarquia está mal modelada.
**Como verificar:** Métodos sobrepostos mantêm o comportamento e o contrato da superclasse; não há sobreposições que levantam erro ou anulam o comportamento herdado; um teste que troca a superclasse pela subclasse dá o mesmo resultado.
**Fonte:** [SOLID §5, aula 26](../cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/transcricoes/26-entendendo-o-liskov-substituion-principal.md) · [nota](../cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/notas/05-lsp-liskov-substitution-principle-principio-de-substituicao.md) · [Clean Code §6, aula 87](../cursos/writing-clean-code/transcricoes/87-the-liskov-substitution-principle.md) · [nota](../cursos/writing-clean-code/notas/06-objects-classes-data-containers-structures.md)
**Cursos:** 3

### PAD-010 — Lei de Deméter: diz, não perguntes

**Regra:** Um método usa só o próprio objecto, os seus atributos, os parâmetros e os objectos que cria; em vez de ir buscar dados a objectos de objectos, passa o objecto a quem precisa dele ou pede-lhe que faça o trabalho.
**Porquê:** Mergulhar nos detalhes internos de objectos alheios faz com que uma mudança na estrutura deles obrigue a mudar muitos sítios; reduzir as interacções diminui o acoplamento.
**Como verificar:** Procurar cadeias como `a.b.c` sobre objectos com comportamento (os contentores de dados são excepção); getters criados só para contornar a regra também contam como violação.
**Fonte:** [Clean Code §6, aula 83](../cursos/writing-clean-code/transcricoes/83-the-law-of-demeter-and-why-you-should-tell-not-ask.md) · [nota](../cursos/writing-clean-code/notas/06-objects-classes-data-containers-structures.md) · [Padrões Python §5, aula 36](../cursos/padroes-de-projeto-com-python/transcricoes/36-principio-do-conhecimento-minimo.md) · [nota](../cursos/padroes-de-projeto-com-python/notas/05-padrao-de-projeto-facade.md)
**Cursos:** 2

## Uso dos padrões GoF

### PAD-011 — Padrão só quando o problema existe

**Regra:** Escreve primeiro a solução directa; introduz um padrão de projeto só quando o problema que ele resolve está presente no código.
**Porquê:** Os padrões podem exigir muitas classes para um objectivo simples, trazem otimizações prematuras e, mal aplicados, atrapalham; cada padrão tem de ser avaliado contra o problema concreto.
**Como verificar:** Um padrão novo (fábrica, estado, comando, singleton…) vem acompanhado do problema que resolve no código actual; classes criadas "só para seguir o padrão", sem variação real, são sinal de excesso.
**Fonte:** [Python 3 §17, aula 605](../cursos/python-3-do-zero-ao-avancado/transcricoes/605-padroes-de-projeto-design-patterns-parte-2.md) · [nota](../cursos/python-3-do-zero-ao-avancado/notas/17-design-patterns-padroes-de-projeto-gof-poo-avancado-mini-cur.parte-1.md) · [Padrões Python §11, aula 87](../cursos/padroes-de-projeto-com-python/transcricoes/87-vantagens-e-desvantagens-do-padrao-state.md) · [nota](../cursos/padroes-de-projeto-com-python/notas/11-padrao-de-projeto-state.md)
**Cursos:** 2

## Domínio e casos de uso

### PAD-012 — Onde vivem as regras de negócio

**Regra:** Cada regra de negócio vai, por esta ordem de preferência, para um objecto de valor, uma entidade ou, se não couber em nenhum, um serviço de domínio.
**Porquê:** O objecto de valor encapsula um valor e as suas regras e pode ser reutilizado em vários sítios; a entidade é o segundo lugar; o serviço de domínio fica para as regras que não encaixam nos outros dois.
**Como verificar:** Validações de um só atributo estão num objecto de valor; regras que cruzam atributos estão na entidade; um serviço de domínio novo justifica porque a regra não cabe nos anteriores.
**Fonte:** [Arq. com IA §3, aula 18](../cursos/ai-driven-development/arquitetura-com-ia/transcricoes/18-padroes-de-modelagem.md) · [nota](../cursos/ai-driven-development/arquitetura-com-ia/notas/03-tatico.md)
**Cursos:** 2

### PAD-013 — O caso de uso orquestra, não implementa regras

**Regra:** O caso de uso recebe a entrada, chama as regras e a infraestrutura pela ordem certa e devolve a saída, mas não contém a implementação das regras de negócio.
**Porquê:** O caso de uso é o maestro do fluxo e o maior utilizador das regras; pôr as regras nele espalha-as pelos fluxos e leva ao modelo anémico.
**Como verificar:** Validações e cálculos de negócio escritos directamente no corpo do caso de uso devem ser movidos para objectos de valor, entidades ou serviços de domínio (PAD-012).
**Fonte:** [Arq. com IA §3, aula 17](../cursos/ai-driven-development/arquitetura-com-ia/transcricoes/17-casos-de-uso.md) · [nota](../cursos/ai-driven-development/arquitetura-com-ia/notas/03-tatico.md)
**Cursos:** 2

### PAD-014 — Interface comum para os casos de uso

**Regra:** Todos os casos de uso implementam a mesma interface, com um único método de execução que recebe uma entrada tipada e devolve uma saída tipada.
**Porquê:** A interface padroniza os fluxos e torna explícito o que é um caso de uso; quando não há entrada ou saída, o tipo correspondente fica vazio.
**Como verificar:** Cada caso de uso novo herda ou cumpre a interface comum e expõe só o método de execução como ponto de entrada público; a entrada com vários campos é agrupada num tipo próprio.
**Fonte:** [Arq. Limpa §2, aula 24](../cursos/arquitetura-limpa-e-hexagonal/transcricoes/24-interface-casodeuso.md) · [nota](../cursos/arquitetura-limpa-e-hexagonal/notas/02-arquitetura-hexagonal.md) · [Arq. com IA §3, aula 17](../cursos/ai-driven-development/arquitetura-com-ia/transcricoes/17-casos-de-uso.md) · [nota](../cursos/ai-driven-development/arquitetura-com-ia/notas/03-tatico.md)
**Cursos:** 2

### PAD-015 — Modelar a partir do negócio, não da base de dados

**Regra:** As entidades do domínio saem do negócio e da conversa com os especialistas; a estrutura da base de dados (chaves primárias e estrangeiras, tabelas) não é trazida para o modelo.
**Porquê:** Há relação entre entidades e tabelas, mas o modelo é rico (dados e comportamento juntos) e não deve herdar o pensamento entidade-relacionamento.
**Como verificar:** Entidades sem campos ou nomes que só existem por causa do esquema relacional; relações entre entidades justificadas pelo negócio e não pela tabela.
**Fonte:** [Finanças IA §2, aula 4](../cursos/ai-driven-development/projeto-financeiro-ai/transcricoes/04-modelagem-01.md) · [nota](../cursos/ai-driven-development/projeto-financeiro-ai/notas/02-modelagem-requisitos.md)
**Cursos:** 3

### PAD-016 — Um repositório por agregado

**Regra:** Cria um repositório só para a raiz de cada agregado; as entidades internas do agregado são persistidas através dela, na mesma transacção.
**Porquê:** O agregado é o conjunto persistido junto; um repositório por entidade interna quebra essa unidade.
**Como verificar:** Não existem repositórios para entidades que não são raiz de agregado; a gravação das entidades internas passa pelo repositório da raiz.
**Fonte:** [Arq. com IA §3, aula 22](../cursos/ai-driven-development/arquitetura-com-ia/transcricoes/22-agregado.md) · [nota](../cursos/ai-driven-development/arquitetura-com-ia/notas/03-tatico.md) · [Finanças IA §2, aula 6](../cursos/ai-driven-development/projeto-financeiro-ai/transcricoes/06-relacionamento-entre-entidades-01.md) · [nota](../cursos/ai-driven-development/projeto-financeiro-ai/notas/02-modelagem-requisitos.md)
**Cursos:** 2

### PAD-017 — Agregados diferentes ligam-se por ID

**Regra:** Uma entidade referencia uma entidade de outro agregado só pelo identificador, nunca pelo objecto completo.
**Porquê:** Cada agregado tem o seu próprio ponto de persistência; a ligação por ID evita que um módulo dependa do código interno de outro.
**Como verificar:** Atributos que apontam para outro agregado são IDs; objectos de outro agregado dentro de uma entidade indicam acoplamento indevido.
**Fonte:** [Finanças IA §2, aula 6](../cursos/ai-driven-development/projeto-financeiro-ai/transcricoes/06-relacionamento-entre-entidades-01.md) · [nota](../cursos/ai-driven-development/projeto-financeiro-ai/notas/02-modelagem-requisitos.md)
**Cursos:** 1

### PAD-018 — Todas as escritas passam por um caso de uso

**Regra:** Qualquer comando que altera estado, por mais simples que seja, é executado por um caso de uso.
**Porquê:** É no caso de uso que se aplicam as validações necessárias à alteração; é a metade "comandos" da separação entre comandos e consultas.
**Como verificar:** Controllers, ferramentas de agente ou handlers não chamam repositórios de escrita directamente.
**Fonte:** [Arq. com IA §6, aula 56](../cursos/ai-driven-development/arquitetura-com-ia/transcricoes/56-salvar-conta-02.md) · [nota](../cursos/ai-driven-development/arquitetura-com-ia/notas/06-modulo-contas.md)
**Cursos:** 2

### PAD-019 — Consultas simples sem caso de uso nem entidade

**Regra:** Uma consulta sem regras resolve-se através de uma interface de consulta que devolve objectos simples próprios da leitura, sem caso de uso e sem passar pelas entidades; só uma consulta com regras justifica um caso de uso.
**Porquê:** Um caso de uso que só chama uma consulta não acrescenta nada, e as entidades, com objectos de valor e regras, servem o lado da escrita e não as consultas.
**Como verificar:** Casos de uso cujo corpo é só uma chamada de leitura; consultas que reconstroem entidades completas só para mostrar dados.
**Fonte:** [Arq. com IA §6, aula 56](../cursos/ai-driven-development/arquitetura-com-ia/transcricoes/56-salvar-conta-02.md) · [nota](../cursos/ai-driven-development/arquitetura-com-ia/notas/06-modulo-contas.md) · [Finanças IA §2, aula 6](../cursos/ai-driven-development/projeto-financeiro-ai/transcricoes/06-relacionamento-entre-entidades-01.md) · [nota](../cursos/ai-driven-development/projeto-financeiro-ai/notas/02-modelagem-requisitos.md)
**Cursos:** 2
