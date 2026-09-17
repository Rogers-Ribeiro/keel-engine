# Regras — Arquitetura de software

Prefixo `ARQ`. Regras confirmadas nas transcrições a 2026-09-17. Síntese de origem: [arquitetura](https://github.com/Rogers-Ribeiro/keel/blob/main/conhecimento/arquitetura.md). Decisões pendentes: [revisão](_revisao/arquitetura.md).

## Estrutura e módulos

### ARQ-001 — Arquitectura definida antes de pedir código a um agente

**Regra:** antes de pedir a um agente de codificação que implemente uma funcionalidade, deixa escritos os módulos, as camadas e os padrões que ele deve seguir; o agente não escolhe a estrutura.
**Porquê:** sem padrões indicados, o agente gerou ficheiros de 2000 a 3000 linhas com funções repetidas; os cursos insistem em que a pessoa decide a estrutura e não delega tudo à IA.
**Como verificar:** o pedido, a spec ou as instruções partilhadas indicam o módulo, a camada e o padrão de cada peça; não há ficheiros gigantes nem lógica duplicada no diff.
**Fonte:** [Intro IA §4, aula 10](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/dev-ai-introducao/transcricoes/10-palavras-finais.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/dev-ai-introducao/notas/04-conclusao.md) · [Banco Ideias §1, aula 1](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/projeto-banco-ideias/transcricoes/01-boas-vindas.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/projeto-banco-ideias/notas/01-introducao.md)
**Cursos:** 4

### ARQ-002 — Módulos sem dependências cíclicas nem acesso ao código interno de outro

**Regra:** um módulo não importa classes, entidades ou regras internas de outro módulo; depende só dos dados que o outro publica (consultas, objectos de retorno, IDs), e o grafo de dependências entre módulos não tem ciclos.
**Porquê:** A depender de B é aceitável, mas A e B a dependerem um do outro é um problema; numa modularização real a dependência é de dados e não de código, o que evita a "bola de lama".
**Como verificar:** procurar imports entre pacotes de módulos diferentes que não passem pela interface publicada; confirmar que nenhum par de módulos se importa mutuamente.
**Fonte:** [Arq. IA §2, aula 9](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/arquitetura-com-ia/transcricoes/09-mapa-de-contexto-01.md) · [Arq. IA §2, aula 10](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/arquitetura-com-ia/transcricoes/10-mapa-de-contexto-02.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/arquitetura-com-ia/notas/02-estrategico.md)
**Cursos:** 4

### ARQ-003 — Código importável em pacotes dentro de `src/`

**Regra:** o código importável fica em `src/`, dividido em sub-pacotes por responsabilidade (por exemplo, ingestão de documentos, vector store, estado, nós, grafo, configuração), e cada pasta importada por outro módulo tem `__init__.py`.
**Porquê:** o curso define a estrutura antes de escrever o pipeline e diz que qualquer pasta que venha a ser importada precisa de `__init__.py` para ser tratada como pacote.
**Como verificar:** pastas importadas sem `__init__.py`, ou código de componentes fora de `src/` (a app de interface e os dados ficam fora).
**Fonte:** [RAG §29, aula 136](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/136-defining-project-structure.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/notas/29-end-to-end-rag-document-search-project.md)
**Cursos:** 1

### ARQ-004 — Configuração dos modelos LLM num só módulo

**Regra:** os fornecedores e as configurações dos modelos (nome, fornecedor, temperatura) estão num único módulo de configuração, com uma função que cria o modelo e falha com erro explícito quando o fornecedor não é conhecido; os nós e os agentes não instanciam modelos com parâmetros próprios.
**Porquê:** os dois cursos centralizam os modelos usados ao longo dos workflows num ficheiro próprio (`models.py`, `config.py`), e o Agentes IA valida o fornecedor contra o mapa de fornecedores.
**Como verificar:** procurar construtores de clientes de chat fora do módulo de configuração; confirmar que um fornecedor desconhecido levanta erro em vez de devolver `None`.
**Fonte:** [Agentes IA §25, aula 174](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/transcricoes/174-configuracao-dos-modelos.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/notas/25-langgraph-explorando-workflows.md) · [RAG §29, aula 141](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/141-building-streamlit-app-with-react-agent-rag.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/notas/29-end-to-end-rag-document-search-project.md)
**Cursos:** 2

## Dependências e núcleo

### ARQ-005 — Dependências injectadas pelo construtor e tipadas por abstracção

**Regra:** uma classe recebe as dependências (repositório, retriever, LLM, criptografia) pelo construtor, tipadas por uma abstracção (porta ou ABC), e não instancia a implementação concreta nem verifica o tipo dela.
**Porquê:** o alto e o baixo nível devem depender de abstracções; injectar a dependência elimina o acoplamento forte, permite trocar a implementação sem mexer no caso de uso e facilita os testes unitários.
**Como verificar:** construções de classes concretas de infra-estrutura dentro de casos de uso ou nós; parâmetros do construtor tipados com classes concretas; `isinstance` sobre dependências.
**Fonte:** [Limpa/Hex §2, aula 32](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/arquitetura-limpa-e-hexagonal/transcricoes/32-repositorio-de-usuario.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/arquitetura-limpa-e-hexagonal/notas/02-arquitetura-hexagonal.md) · [SOLID §7, aula 36](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/transcricoes/36-entendendo-o-dependency-inversion-principle.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/notas/07-dip-dependency-inversion-principle-principio-da-inversao-de.md)
**Cursos:** 10

### ARQ-006 — Núcleo sem ORM, frameworks nem SDKs de fornecedores de IA

**Regra:** as entidades e os casos de uso não importam ORM, frameworks web nem SDKs de fornecedores de IA; o acesso a estes serviços passa por uma porta (por exemplo, um "AI provider") definida no núcleo e implementada fora dele.
**Porquê:** o núcleo deve ter o mínimo de dependências para as regras de negócio poderem ser usadas em qualquer lado; no Banco Ideias, o caso de uso chama uma interface de provedor de IA e a implementação OpenAI vive no backend.
**Como verificar:** imports de ORM, framework ou SDK de LLM nos pacotes de domínio e de casos de uso; ausência de uma interface para o fornecedor de IA.
**Fonte:** [Limpa/Hex §2, aula 33](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/arquitetura-limpa-e-hexagonal/transcricoes/33-gerando-id-com-uuid.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/arquitetura-limpa-e-hexagonal/notas/02-arquitetura-hexagonal.md) · [Banco Ideias §2, aula 20](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/projeto-banco-ideias/transcricoes/20-processamento-da-ideia-01.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/projeto-banco-ideias/notas/02-projeto.md)
**Cursos:** 3

### ARQ-007 — Sem prints nem logs dentro de um caso de uso

**Regra:** não ponhas `print`, chamadas de logging nem I/O directo dentro de um caso de uso; o registo faz-se fora dele.
**Porquê:** o curso remove os logs do caso de uso para o deixar sem essa dependência e diz que o log se pode fazer fora dele.
**Como verificar:** `print(`, `logging.` ou escrita em ficheiros no código dos casos de uso.
**Fonte:** [Limpa/Hex §2, aula 35](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/arquitetura-limpa-e-hexagonal/transcricoes/35-usando-postgres.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/arquitetura-limpa-e-hexagonal/notas/02-arquitetura-hexagonal.md)
**Cursos:** 1

## Domínio e casos de uso

### ARQ-008 — Um ficheiro por caso de uso, com a mesma interface

**Regra:** cada fluxo da aplicação é um caso de uso num ficheiro próprio, e todos implementam a mesma interface com um único método de execução.
**Porquê:** em vez de uma classe com todas as funcionalidades de um conceito, cada fluxo tem um ficheiro exclusivo e todos seguem o mesmo padrão de comportamento.
**Como verificar:** classes "Service" com vários fluxos; casos de uso com mais de um método público ou que não implementam a interface comum.
**Fonte:** [Arq. IA §3, aula 17](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/arquitetura-com-ia/transcricoes/17-casos-de-uso.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/arquitetura-com-ia/notas/03-tatico.md) · [Limpa/Hex §1, aula 12](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/arquitetura-limpa-e-hexagonal/transcricoes/12-arquitetura-limpa-casos-de-uso.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/arquitetura-limpa-e-hexagonal/notas/01-introducao-e-fundamentos.md)
**Cursos:** 3

### ARQ-009 — O caso de uso orquestra; as regras vivem no domínio

**Regra:** as regras de negócio ficam nas entidades, nos objectos de valor ou nos serviços de domínio; o caso de uso só as chama e liga a infra-estrutura, e as entidades não são meros contentores de atributos (modelo anémico).
**Porquê:** o caso de uso é o maior cliente das entidades e orquestra o fluxo; um modelo anémico deixa o lugar das regras vazio e espalha-as pelo resto da aplicação.
**Como verificar:** condições de negócio (limites, formatos, estados permitidos) escritas no caso de uso, no controller ou num validador genérico; entidades só com atributos.
**Fonte:** [Limpa/Hex §1, aula 12](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/arquitetura-limpa-e-hexagonal/transcricoes/12-arquitetura-limpa-casos-de-uso.md) · [Limpa/Hex §1, aula 11](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/arquitetura-limpa-e-hexagonal/transcricoes/11-arquitetura-limpa-entidades.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/arquitetura-limpa-e-hexagonal/notas/01-introducao-e-fundamentos.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/arquitetura-com-ia/notas/03-tatico.md)
**Cursos:** 4

### ARQ-010 — Onde pôr cada regra de domínio

**Regra:** põe a regra num objecto de valor quando diz respeito a um só valor; na entidade quando precisa de vários atributos dela; e num serviço de domínio só quando envolve várias entidades ou um conjunto delas.
**Porquê:** o objecto de valor guarda a regra num único sítio reutilizável; o serviço de domínio serve as regras que não cabem nem num valor nem numa só entidade.
**Como verificar:** validações de um valor (e-mail, CPF, nome) repetidas em entidades ou casos de uso; serviços de domínio com regras que só usam uma entidade.
**Fonte:** [Arq. IA §3, aula 23](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/arquitetura-com-ia/transcricoes/23-servico-de-dominio.md) · [Arq. IA §3, aula 20](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/arquitetura-com-ia/transcricoes/20-objeto-de-valor.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/arquitetura-com-ia/notas/03-tatico.md)
**Cursos:** 2

### ARQ-011 — Agregado só quando tudo muda na mesma transacção

**Regra:** duas entidades só formam um agregado se forem sempre inseridas, alteradas e apagadas juntas, na mesma transacção; há um repositório por agregado, acedido pela raiz, e as entidades-filhas não têm repositório próprio.
**Porquê:** estar relacionado não chega: o utilizador e a senha mudam em momentos diferentes, por isso não são um agregado; o curso e as suas aulas são, e gravam-se pelo mesmo repositório.
**Como verificar:** repositórios para entidades que não são raiz; agregados que juntam entidades alteradas em separado.
**Fonte:** [Arq. IA §3, aula 22](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/arquitetura-com-ia/transcricoes/22-agregado.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/arquitetura-com-ia/notas/03-tatico.md)
**Cursos:** 5

### ARQ-012 — Escritas por caso de uso, leituras por interface de consulta

**Regra:** as escritas passam por um caso de uso e por um repositório; as consultas passam por uma interface de consulta própria que devolve DTOs, e não pela entidade de escrita.
**Porquê:** os dois projectos aplicam CQRS: as consultas usam interfaces específicas e devolvem um DTO com o que o consumidor precisa.
**Como verificar:** métodos de listagem ou pesquisa nos repositórios de escrita; consultas que devolvem entidades de domínio em vez de DTOs.
**Fonte:** [Arq. IA §6, aula 63](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/arquitetura-com-ia/transcricoes/63-controller-de-contas.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/arquitetura-com-ia/notas/06-modulo-contas.md) · [Finanças §5, aula 35](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/projeto-financeiro-ai/transcricoes/35-cadastro-conta-prompt-02.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/projeto-financeiro-ai/notas/05-modulo-de-contas.md)
**Cursos:** 3

### ARQ-013 — A validação devolve todos os erros de uma vez

**Regra:** ao validar um objecto, percorre todos os campos e junta todos os erros antes de falhar, em vez de parar no primeiro.
**Porquê:** os dois cursos acumulam os erros (numa excepção de validação ou num resultado de falha com uma lista) para o cliente os receber todos numa só execução.
**Como verificar:** validadores que levantam erro ao primeiro campo inválido; um teste com vários campos inválidos que só vê um erro.
**Fonte:** [Skills §4, aula 28](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/agents-skills-eng-ctx/transcricoes/28-validacoes-03.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/agents-skills-eng-ctx/notas/04-modulo-shared.md) · [Arq. IA §4, aula 31](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/arquitetura-com-ia/transcricoes/31-padrao-resultado.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/arquitetura-com-ia/notas/04-modulo-shared.md)
**Cursos:** 4

### ARQ-014 — Casos de uso testados com implementações em memória

**Regra:** testa cada caso de uso com implementações em memória das suas portas, guardadas numa pasta partilhada de testes para serem reutilizadas.
**Porquê:** com as portas definidas, o caso de uso funciona com um repositório em memória; o curso de skills extrai essas implementações para as usar noutros testes.
**Como verificar:** testes de casos de uso que dependem de base de dados ou de API real; duplicados definidos dentro de cada teste.
**Fonte:** [Skills §5, aula 38](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/agents-skills-eng-ctx/transcricoes/38-registrar-usuario.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/agents-skills-eng-ctx/notas/05-modulo-de-autenticacao.md) · [Limpa/Hex §2, aula 32](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/arquitetura-limpa-e-hexagonal/transcricoes/32-repositorio-de-usuario.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/arquitetura-limpa-e-hexagonal/notas/02-arquitetura-hexagonal.md)
**Cursos:** 2

### ARQ-015 — Snapshot dos dados de entrada de um processamento

**Regra:** quando um processamento (por exemplo, uma geração por LLM) tem de continuar válido depois de a origem mudar, grava uma cópia dos dados de entrada com o resultado, em vez de uma referência ao registo vivo.
**Porquê:** o processamento congela a ideia como estava no momento, para que os resultados antigos não mudem quando a ideia é editada e se possa processar a mesma versão várias vezes.
**Como verificar:** resultados de processamento que só guardam o ID da origem e se recalculam a partir do estado actual dela.
**Fonte:** [Banco Ideias §1, aula 3](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/projeto-banco-ideias/transcricoes/03-modelagem.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/projeto-banco-ideias/notas/01-introducao.md)
**Cursos:** 2

## Classes e SOLID

### ARQ-016 — Uma classe, um motivo para mudar

**Regra:** divide uma classe que tenha mais de um motivo para mudar, ou seja, mais de uma responsabilidade de negócio ou técnica.
**Porquê:** o SRP diz que uma classe deve ter uma só responsabilidade; a classe «faz-tudo» faz com que um erro numa responsabilidade afecte as outras.
**Como verificar:** classes que misturam, por exemplo, regras de negócio, persistência e envio de notificações; alterações a uma funcionalidade que obrigam a mexer numa classe de outra área.
**Fonte:** [SOLID §2, aula 7](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/transcricoes/07-entendendo-o-single-responsibility-principle-srp.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/notas/02-srp-single-responsibility-principle-principio-da-responsabil.md)
**Cursos:** 4

### ARQ-017 — Variantes novas por extensão, não por modificação

**Regra:** uma variante nova (formato, fornecedor, tipo) entra como uma nova classe que cumpre a abstracção existente, sem alterar as classes que já existem nem acrescentar ramos condicionais sobre o tipo.
**Porquê:** o OCP pede que a aplicação cresça sem modificar as classes existentes; no exemplo do curso, ler TXT obrigou a mexer nas classes de leitura, que é o que o princípio evita.
**Como verificar:** diffs que acrescentam um `if`/`elif` por tipo numa classe existente para suportar uma variante nova.
**Fonte:** [SOLID §4, aula 20](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/transcricoes/20-entendendo-o-open-closed-principle-ocp.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/notas/04-ocp-open-closed-principle-principio-aberto-fechado.md)
**Cursos:** 4

### ARQ-018 — Subclasses substituem a base sem mudar o comportamento

**Regra:** só herdes quando a subclasse pode substituir a classe base em qualquer uso sem mudar o comportamento esperado; se não puder, usa composição ou corrige a hierarquia.
**Porquê:** o LSP obriga a modelar os dados correctamente: o pinguim que herda um `fly` de `Bird` quebra a substituição e precisa de uma classe intermédia.
**Como verificar:** subclasses que sobrepõem métodos para levantar `NotImplementedError` ou não fazer nada; testes da base que falham com a subclasse.
**Fonte:** [SOLID §5, aula 26](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/transcricoes/26-entendendo-o-liskov-substituion-principal.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/notas/05-lsp-liskov-substitution-principle-principio-de-substituicao.md) · [Clean Code §6, aula 87](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/writing-clean-code/transcricoes/87-the-liskov-substitution-principle.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/writing-clean-code/notas/06-objects-classes-data-containers-structures.md)
**Cursos:** 7

### ARQ-019 — Interfaces pequenas e específicas

**Regra:** uma interface ou ABC só declara métodos que todas as implementações usam; quando uma implementação teria de implementar métodos que não usa, divide a interface.
**Porquê:** o ISP evita que as classes sejam forçadas a implementar métodos que nunca utilizam; o curso separa a interface geral em interfaces específicas.
**Como verificar:** implementações com métodos vazios, `pass` ou `NotImplementedError` para cumprir uma interface.
**Fonte:** [SOLID §6, aula 31](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/transcricoes/31-entendendo-o-interface-segregation-principle.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/solid-os-5-principios-para-as-boas-praticas-da-poo/notas/06-isp-interface-segregation-principle-principio-da-segregacao.md)
**Cursos:** 6

### ARQ-020 — Padrões só para um problema concreto

**Regra:** só introduzas um padrão de projecto ou de sistema quando houver um problema concreto que ele resolva, e escreve qual é; para problemas simples, usa a solução simples.
**Porquê:** os padrões trazem complexidade e otimizações prematuras, e mal usados atrapalham; na arquitectura de sistemas, começa-se pelo problema que se quer resolver e prova-se a mudança antes de migrar.
**Como verificar:** fábricas, singletons ou camadas extra sem uma necessidade descrita na spec ou no PR.
**Fonte:** [Python 3 §17, aula 605](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/python-3-do-zero-ao-avancado/transcricoes/605-padroes-de-projeto-design-patterns-parte-2.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/python-3-do-zero-ao-avancado/notas/17-design-patterns-padroes-de-projeto-gof-poo-avancado-mini-cur.parte-1.md) · [Sist. Modernos §2, aula 7](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/arquitetura-de-software-design-de-sistemas-modernos/transcricoes/07-qual-o-problema-voce-quer-resolver-planejamento-alinhados-ao-negocio.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/arquitetura-de-software-design-de-sistemas-modernos/notas/02-vamos-aquecer-opcional.md)
**Cursos:** 3

## LangGraph e agentes

### ARQ-021 — LangGraph para fluxos com estado, ciclos ou aprovação humana

**Regra:** usa LangGraph quando o fluxo precisa de estado entre passos, ciclos, routing condicional, recuperação de falhas ou intervenção humana; uma chain linear só serve pipelines de sentido único.
**Porquê:** as chains simples são lineares, não voltam atrás e perdem o progresso numa falha; o curso indica LangGraph para workflows com estado, loops de auto-correcção e human-in-the-loop.
**Como verificar:** ciclos ou retries feitos à mão em volta de chains; fluxos com aprovação humana sem grafo nem checkpoint.
**Fonte:** [Prod. Agents §7, aula 89](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/089-langgraph-and-its-pillars-overview.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/07-langgraph-a-full-deep-dive.md)
**Cursos:** 3

### ARQ-022 — Reducer em todos os campos com várias escritas (API a confirmar)

**Regra:** no estado do grafo, as mensagens usam `Annotated[list[BaseMessage], add_messages]` e todos os campos escritos por vários nós (por exemplo, em paralelo) têm um reducer explícito; os campos escritos por um só nó ficam com a substituição por omissão.
**Porquê:** sem reducer, a última escrita substitui as anteriores e perdem-se os resultados dos outros nós; `add_messages` junta as mensagens e elimina duplicados por ID.
**Como verificar:** campos do estado actualizados por mais de um nó sem `Annotated[..., reducer]`; mensagens declaradas com `operator.add`.
**Fonte:** [Prod. Agents §8, aula 122](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/122-hands-on-state-schema-and-send-api-overview.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/08-multi-agent-systems-with-langgraph-and-langchain.md) · [LangChain §14, aula 101](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/transcricoes/101-defining-our-langgraph-graph.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/notas/14-reflection-agent.md)
**Cursos:** 3

### ARQ-023 — Todos os ciclos têm um máximo de iterações

**Regra:** cada ciclo do grafo (reflexão, auto-correcção, avaliador) guarda um contador e um máximo de iterações no estado, e a função de routing termina o ciclo quando o máximo é atingido.
**Porquê:** o contador e o máximo são a válvula de segurança; sem eles o ciclo pode correr para sempre.
**Como verificar:** arestas condicionais que voltam a um nó anterior sem uma condição de paragem por contador.
**Fonte:** [Prod. Agents §7, aula 100](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/100-hands-on-cycles-and-loops-self-correcting-code-writer.md) · [Prod. Agents §7, aula 107](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/107-langgraph-summary-and-key-takeaways.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/07-langgraph-a-full-deep-dive.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/langchain/notas/14-reflection-agent.md)
**Cursos:** 3

### ARQ-024 — Decisões de routing com saída estruturada (API a confirmar)

**Regra:** um supervisor ou nó de triagem decide o passo seguinte com saída estruturada (um modelo Pydantic com um campo `Literal` das opções válidas), e não com texto livre.
**Porquê:** o curso chama-lhe crítico: a saída estruturada garante que o supervisor devolve uma das opções previstas e torna o routing determinístico.
**Como verificar:** funções de routing que interpretam texto livre do LLM; ausência de um esquema com as opções de destino.
**Fonte:** [Prod. Agents §8, aula 111](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/111-hands-on-the-supervisor-agent.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/08-multi-agent-systems-with-langgraph-and-langchain.md)
**Cursos:** 1

### ARQ-025 — Um erro numa tool ou num nó não derruba o grafo

**Regra:** um erro previsível numa tool ou num nó é convertido em informação (uma mensagem de erro para o LLM, ou um campo de erro no estado encaminhado para um nó de tratamento), e não numa excepção que termina a execução.
**Porquê:** uma tool que levanta excepção faz cair o grafo inteiro; devolvendo o erro, o agente continua vivo e o LLM pode raciocinar sobre ele. O Agentes IA encaminha o erro do estado para um nó próprio.
**Como verificar:** tools que levantam excepções para falhas esperadas (entrada inválida, serviço indisponível); nós sem caminho para tratamento de erro.
**Fonte:** [Prod. Agents §8, aula 110](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/110-custom-tool-with-error-handling.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/08-multi-agent-systems-with-langgraph-and-langchain.md) · [Agentes IA §26, aula 185](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/transcricoes/185-criando-sistemas-multi-agentes-para-equacoes-matematicas-ii.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/notas/26-langgraph-sistemas-multi-agentes.md)
**Cursos:** 2

### ARQ-026 — Checkpointer persistente em produção (API a confirmar)

**Regra:** um grafo com pausas para intervenção humana ou que tem de retomar depois de uma falha usa um checkpointer e um `thread_id` por execução; em produção, o checkpointer é persistente (SQLite ou Postgres) e não `MemorySaver`.
**Porquê:** as pausas humanas precisam do checkpointer para guardar o estado; com o saver em SQLite, uma nova sessão com o mesmo `thread_id` recupera a conversa depois de um reinício, o que o saver em memória não faz.
**Como verificar:** `interrupt` sem checkpointer; `MemorySaver` em código de produção; execuções sem `thread_id` na configuração.
**Fonte:** [Prod. Agents §7, aula 105](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/105-hands-on-checkpointing-deep-dive.md) · [Prod. Agents §7, aula 103](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/transcricoes/103-hands-on-human-input-interrupt-for-approval.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/production-ai-agents/notas/07-langgraph-a-full-deep-dive.md)
**Cursos:** 3

## Processo com agentes de codificação

### ARQ-027 — PRD e especificação antes do código

**Regra:** cada funcionalidade tem um PRD e uma especificação com tarefas antes de ser implementada; o agente executa a spec numa sessão nova, marca cada tarefa com uma evidência de execução e não acrescenta nada fora do PRD.
**Porquê:** as tarefas com evidência e verificação garantem que cada passo foi feito; o PRD é o contrato a seguir à risca, e só projectos muito simples dispensam PRD e planeamento.
**Como verificar:** alterações sem spec associada; specs com tarefas por marcar ou sem evidência; funcionalidades no diff que não estão no PRD.
**Fonte:** [Eng. Agêntica §2, aula 5](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/engenharia-agentica/transcricoes/05-introducao-a-sdd.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/engenharia-agentica/notas/02-spec-driven-development.md) · [Claude Code §14, aula 135](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/transcricoes/135-resolvendo-bugs.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/notas/14-desenvolvimento-com-claude-code-projeto-do-zero.md)
**Cursos:** 5

### ARQ-028 — Skills extraídas de código já validado

**Regra:** cria uma skill de construção só por engenharia reversa de código do projecto que já funciona e foi validado, e não a partir de uma descrição genérica.
**Porquê:** o curso gera as skills a partir do que foi feito, está a funcionar e foi validado no próprio projecto.
**Como verificar:** skills novas sem código de referência no repositório.
**Fonte:** [Skills §6, aula 47](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/agents-skills-eng-ctx/transcricoes/47-skill-modulo-shared.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/ai-driven-development/agents-skills-eng-ctx/notas/06-skills-finais.md)
**Cursos:** 3
