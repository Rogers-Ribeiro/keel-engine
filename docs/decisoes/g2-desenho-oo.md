# Decisões — Grupo 2: Desenho orientado a objectos, erros e padrões

> Fontes consultadas a 2026-09-17.

## D-OO01 — As falhas de negócio previsíveis são excepções ou um valor Result?

**Temas:** arquitetura, padroes-de-projeto · **Regras afectadas:** ARQ-013 (mecanismo)

**Decisão:** As falhas de negócio previsíveis lançam-se como excepções (uma excepção de validação, agregando erros quando fizer sentido — ver D-OO02); não se adopta um tipo Result.

**Porquê:** Python idiomatiza EAFP (tentar e apanhar a excepção) em vez de verificar condições antes; o tipo Result é próprio de linguagens com tipos soma e é a opção dos cursos em TypeScript, sem equivalente nativo em Python.


**Contra:** Um Result torna o erro parte da assinatura da função e obriga o chamador a tratá-lo; mudaria a decisão se o projecto adoptar bibliotecas de tipos soma (por exemplo `returns`) e checagem estática exaustiva de erros.

**Confiança:** alta.

## D-OO02 — Falhar no primeiro erro ou juntar todos os erros antes de lançar?

**Temas:** codigo-limpo · **Regras afectadas:** ARQ-013

**Decisão:** Agregar todos os erros só ao validar entrada externa (formulário, DTO, objecto de valor construído a partir de dados de fora); falhar no primeiro erro em todo o resto do código, incluindo invariantes internas e pré-condições entre agregados.

**Porquê:** o padrão Notification, de Fowler, junta erros precisamente porque uma falha de validação é um resultado esperado, não uma excepção verdadeira; fora da validação de entrada, continuar depois do primeiro erro arrisca operar sobre estado já inconsistente.


**Contra:** juntar erros exige construir e manter um objecto agregador; nalguns fluxos simples de um só campo, falhar logo é mais directo e já chega.

**Confiança:** alta.

## D-OO03 — A validação corre ao construir o objecto ou num método explícito?

**Temas:** arquitetura, codigo-limpo · **Regras afectadas:** nenhuma

**Decisão:** entidades e objectos de valor validam-se sempre no construtor (ou numa fábrica); nunca existe um estado interno inválido depois de criados. Validação diferida só num objecto de aplicação fora da entidade (por exemplo, um DTO de um formulário em vários passos), nunca dentro dela.

**Porquê:** o modelo "sempre válido" evita testes repetidos de invariantes espalhados pelo código; permitir uma entidade temporariamente inválida obriga quem a usa depois a lembrar-se de a validar, e mais cedo ou mais tarde alguém esquece.


**Contra:** operações em vários passos com estado intermédio genuinamente inválido precisam de um objecto próprio (builder, DTO) antes de chegarem à entidade; a excepção de Vernon aplica-se a esses casos específicos, não à generalidade das entidades.

**Confiança:** alta.

## D-OO04 — A responsabilidade única organiza-se por área ou por fluxo?

**Temas:** codigo-limpo, arquitetura, padroes-de-projeto · **Regras afectadas:** ARQ-008, ARQ-016, COD-018, PAD-014

**Decisão:** mantém-se "um caso de uso por fluxo" na camada de aplicação (ARQ-008, COD-018, PAD-014); "por área" só se aplica dentro do domínio, a entidades e serviços de domínio (PAD-012), nunca aos casos de uso.

**Porquê:** a reformulação do SRP por Robert Martin liga a responsabilidade a quem pede a mudança (o "actor"), não ao substantivo que descreve o assunto; registo, login e troca de papel podem ter o mesmo nome de área ("autenticação") e ainda assim pedidos de mudança independentes.


**Contra:** num projecto de uma só pessoa não há vários interessados a puxar em direcções diferentes, o que esvazia o argumento do "actor"; e levar o SRP à letra tende a produzir classes minúsculas e pouco coesas, o que é a crítica mais comum ao princípio — por isso a regra fica limitada à camada de aplicação, e o domínio continua agrupado por conceito.

**Confiança:** alta.

## D-OO05 — Como se escolhe a implementação para cada tipo (despacho polimórfico)?

**Temas:** codigo-limpo, padroes-de-projeto · **Regras afectadas:** COD-016, PAD-007

**Decisão:** um único ponto de variação resolve-se com um dicionário/registo de estratégias; polimorfismo com subclasses só quando várias operações relacionadas variam juntas pelo mesmo tipo. Nunca `if/elif` nem resolver a classe pelo nome por convenção.

**Porquê:** a refactorização de Fowler para polimorfismo destina-se a lógica de tipo repetida em vários métodos; com um só ponto de decisão, criar uma hierarquia de classes só para isso é peso a mais.


**Contra:** resolver a classe pelo nome por convenção é frágil (parte com um erro de ortografia) e não dá para verificar num diff, por isso fica sempre rejeitado, mesmo com poucas variantes.

**Confiança:** alta.

## D-OO06 — Como se corrige uma violação de substituição (PAD-009)?

**Temas:** padroes-de-projeto · **Regras afectadas:** PAD-008, PAD-009, ARQ-018, COD-021

**Decisão:** por omissão, elimina-se a herança e passa-se a composição/delegação; uma classe intermédia só se a relação "é-um" continuar válida para o subconjunto de comportamento partilhado por várias subclasses futuras.

**Porquê:** o mesmo desenho do pinguim que herda `fly()` de `Bird` aparece em qualquer classe que herda comportamento que depois tem de esconder ou restringir; a delegação torna essa fronteira explícita em vez de remendar a hierarquia.


**Contra:** uma classe intermédia bem escolhida (`FlyingBird`) evita repetir a mesma delegação quando várias subclasses partilham exactamente o comportamento reduzido; só compensa quando esse subconjunto é mesmo comum a mais do que uma subclasse.

**Confiança:** alta.

## D-OO07 — Usa-se Singleton em Python e, se sim, como se implementa?

**Temas:** padroes-de-projeto, arquitetura · **Regras afectadas:** PAD-001, PAD-011, ARQ-020

**Decisão:** a instância única cria-se uma vez no ponto de composição e injecta-se pelas portas (PAD-001); nunca uma classe Singleton com `__new__` ou metaclasse. Se for mesmo preciso um objecto acessível de qualquer lado sem injecção (por exemplo, configuração de logging), usa-se um módulo Python simples, não uma classe.

**Porquê:** duas fontes independentes apontam para o mesmo lugar: evitar estado global preferindo injecção a partir de um único ponto de composição, e, quando o global é mesmo necessário, usar o mecanismo nativo do Python (o módulo, que já só é importado uma vez) em vez de imitar o Singleton do GoF numa classe.


**Contra:** migrar código já existente que chama uma classe directamente, sem poder mudar todos os pontos de chamada, é o único caso em que a mesma fonte aceita o Singleton de classe como solução de transição.

**Confiança:** alta.

## D-OO08 — Os contratos de repositório separam-se por operação ou juntam-se por agregado?

**Temas:** padroes-de-projeto · **Regras afectadas:** PAD-004, PAD-016, ARQ-011

**Decisão:** um repositório por agregado (pela raiz), com as operações desse agregado juntas; não se segrega um contrato por operação individual.

**Porquê:** o repositório é a fronteira de persistência do agregado, não de uma operação isolada; separar por operação fragmentaria a unidade transaccional que o agregado existe para proteger.


**Contra:** dividir a interface do repositório por capacidade (leitura/escrita), sem deixar de ser um repositório por agregado, evita que uma implementação em memória para testes tenha de cumprir métodos que não usa (ISP aplicado a repositórios).

**Confiança:** alta.

## D-OO09 — Os comandos (casos de uso de escrita) devolvem dados?

**Temas:** arquitetura · **Regras afectadas:** ARQ-012, PAD-018, PAD-019

**Decisão:** comandos não devolvem os dados alterados; podem devolver o identificador criado, ou nada, nunca o objecto completo "para o caso de precisar".

**Porquê:** o CQS separa comandos (mudam estado, sem retorno) de consultas (devolvem dados, sem efeitos); o CQRS reforça a mesma fronteira, empurrando as leituras para um modelo de consulta próprio em vez de sobrecarregar o caminho de escrita.


**Contra:** o próprio Fowler aceita excepções pragmáticas ao CQS (dá o exemplo do `pop` de uma pilha); devolver o ID criado poupa uma consulta imediatamente a seguir à escrita e é essa a excepção que se mantém.

**Confiança:** alta.

## D-OO10 — Entre agregados, as entidades referenciam-se por ID ou por objecto?

**Temas:** arquitetura · **Regras afectadas:** PAD-017, ARQ-011

**Decisão:** sempre por ID.

**Porquê:** referenciar por objecto alargaria, na prática, a fronteira de consistência de um agregado para dentro de outro; o ID mantém cada agregado como o seu próprio limite transaccional.


**Contra:** nenhuma fonte reconhecida defende a referência por objecto entre agregados; a opção "por entidade" de um dos cursos é isolada e não tem apoio fora dele.

**Confiança:** alta.

## D-OO11 — Como se chama a pasta dos adaptadores?

**Temas:** padroes-de-projeto · **Regras afectadas:** PAD-002

**Decisão:** `adapters`, ao lado de `core`/`app`.

**Porquê:** sem fonte que imponha um nome, escolhe-se o termo do próprio padrão para os agentes reconhecerem a pasta sem ambiguidade; `external` obriga a saber de cor a correspondência entre a terminologia da Arquitectura Limpa e a Hexagonal.


**Contra:** nenhuma das duas opções tem fonte a favor; é convenção pura, e muda se o projecto vier a adoptar Arquitectura Limpa por inteiro em vez de Hexagonal.

**Confiança:** baixa — sem fonte que decida; escolha de convenção para o projecto.

## D-OO12 — Como se ligam as dependências no ponto de composição?

**Temas:** arquitetura · **Regras afectadas:** ARQ-005, PAD-001

**Decisão:** só construtor, nunca setter nem service locator; o ponto de composição é uma única função/módulo que cria e liga tudo, sem container de injecção.

**Porquê:** o Composition Root deve ficar o mais perto possível do ponto de entrada da aplicação, um só sítio, com injecção pelo construtor em todo o resto; para um projecto de uma pessoa, um container acrescenta configuração sem o benefício que dá a grafos de dependências grandes e variáveis por ambiente.


**Contra:** um container de DI compensa quando o grafo muda por ambiente ou cresce muito; nesse ponto vale a pena reconsiderar.

**Confiança:** alta.
