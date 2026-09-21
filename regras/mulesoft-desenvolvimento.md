# Regras — MuleSoft: desenvolvimento

Prefixo `MULD`. Regras confirmadas nas transcrições a 2026-09-21. Síntese de origem: [mulesoft-desenvolvimento](https://github.com/Rogers-Ribeiro/keel/blob/main/conhecimento/mulesoft-desenvolvimento.md). Decisões pendentes: [revisão](_revisao/mulesoft-desenvolvimento.md).

## Contrato antes de implementação

### MULD-001 — A especificação é aprovada antes de existir implementação

**Regra:** escreve a especificação da API, serve-a com respostas simuladas e obtém a aprovação de quem a vai consumir antes de escrever a primeira linha de implementação; cada ronda de comentários corrige a especificação, não o código.
**Porquê:** o curso equipara isto ao modelo de protótipo — com respostas estáticas o consumidor experimenta a API e traz sugestões enquanto mudar ainda é barato, e o desenvolvimento só arranca depois do aceite.
**Como verificar:** na spec de qualquer endpoint novo tem de constar a especificação e a nota de aprovação do consumidor com data anterior ao primeiro commit de implementação.
**Fonte:** [Mule 4.x §12, aula 77](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/transcricoes/077-mocking-api-specification-scenarios.md) · [MCD L2 §2, aula 18](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule4-mcd-level2/transcricoes/018-api-lifecycle.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/notas/12-anypoint-platform-design-center-design-api-s-using-raml.md)
**Cursos:** 5

### MULD-002 — As validações de entrada declaram-se na especificação, não no código

**Regra:** exprime campos obrigatórios, comprimentos mínimos e máximos e tipos no schema da especificação, e deixa a camada que valida o contrato rejeitar o pedido inválido antes de chegar à lógica; não repitas essas verificações dentro do handler.
**Porquê:** na demonstração, retirar um campo obrigatório faz o pedido falhar antes de qualquer código do programador, com um erro que já diz qual a chave em falta.
**Como verificar:** procura no handler `if` sobre presença, tipo ou comprimento de campos que já estejam declarados no schema; se existirem, a validação está duplicada.
**Fonte:** [Mule 4.x §15, aula 96](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/transcricoes/096-api-validations-using-raml.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/notas/15-api-based-project-development-and-real-time-scenarios.md)
**Cursos:** 3

### MULD-003 — O que se repete entre APIs vive num fragmento partilhado

**Regra:** cabeçalhos comuns, esquemas de erro e schemas usados por mais do que uma API extraem-se para um fragmento versionado e partilhado, referenciado por cada API; o que só uma API usa fica local a essa API.
**Porquê:** na aula, os cabeçalhos de correlação e de transacção aparecem em todas as APIs e por isso são publicados como fragmentos globais, enquanto um parâmetro usado num único recurso fica como fragmento local — é o critério que evita copiar as mesmas definições por todos os recursos.
**Como verificar:** no diff da especificação, qualquer bloco idêntico a outro já existente noutra API tem de ser uma referência ao fragmento, não uma cópia.
**Fonte:** [Mule 4.x §13, aula 84](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/transcricoes/084-fragments-traits.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/notas/13-anypoint-platform-design-center-design-fragments-based-api-s.md)
**Cursos:** 4

### MULD-004 — Recursos no plural, sem verbos, com maiúsculas e minúsculas fixadas

**Regra:** nomeia cada recurso com um substantivo concreto no plural (`patients`, não `patient` nem `services`), nunca com um verbo (`get-addresses` está errado), em minúsculas quando é uma palavra e em kebab-case quando são várias (`covid-cases`); os nomes de campos vão em camelCase.
**Porquê:** o método HTTP já diz a operação, pelo que repeti-la no recurso é redundante; substantivos abstractos que agregam recursos independentes tornam a API menos intuitiva e mais difícil de consumir.
**Como verificar:** lê a lista de rotas: qualquer segmento que seja verbo, esteja no singular ou misture convenções de capitalização é rejeitado.
**Fonte:** [MCIA §3, aula 13](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mulesoft-certified-integration-architect-course-mcia/transcricoes/013-api-design-best-practices.md) · [Mule 4.x §15, aula 97](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/transcricoes/097-mule-application-real-time-naming-standards.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mulesoft-certified-integration-architect-course-mcia/notas/03-identifying-anypoint-platform-components-and-capabilities.md)
**Cursos:** 4

### MULD-005 — O código de estado é escolhido pelo resultado, não fixado em 200

**Regra:** devolve 201 ao criar, 204 ao remover sem corpo, 400 para pedido inválido, 401 sem autenticação, 403 sem autorização, 404 quando o recurso não existe, 500 em erro do servidor e 503 quando uma dependência está indisponível.
**Porquê:** o curso fixa esta correspondência entre método, resultado e código como parte das convenções de desenho de API, para que o consumidor distinga os casos sem ler o corpo da resposta.
**Como verificar:** no diff, qualquer rota que responda 200 a uma criação, a uma remoção ou a um recurso inexistente está errada.
**Fonte:** [MCIA §3, aula 13](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mulesoft-certified-integration-architect-course-mcia/transcricoes/013-api-design-best-practices.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mulesoft-certified-integration-architect-course-mcia/notas/03-identifying-anypoint-platform-components-and-capabilities.md)
**Cursos:** 1

## Estrutura do projecto

### MULD-006 — Um ficheiro por recurso, chamadas a sistemas externos isoladas

**Regra:** cada recurso da API fica no seu próprio ficheiro de implementação, cada chamada a um sistema externo fica numa função reutilizável separada, agrupada por sistema, e a configuração partilhada fica num único ficheiro global.
**Porquê:** o instrutor mostra que implementar tudo no mesmo ficheiro o torna pesado e ilegível à medida que o projecto cresce, e trata cada chamada a sistema externo como candidata a reutilização futura mesmo quando ainda só tem um consumidor.
**Como verificar:** conta os recursos por ficheiro; mais do que um, ou uma chamada a sistema externo escrita em linha dentro do handler, é rejeitado.
**Fonte:** [MCIA §4, aula 15](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mulesoft-certified-integration-architect-course-mcia/transcricoes/015-naming-standards-and-structuring-real-time-mule-project.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mulesoft-certified-integration-architect-course-mcia/notas/04-optional-design-integration-solutions-with-mule-components-r.md)
**Cursos:** 3

### MULD-007 — O projecto novo nasce de um template com o que é comum

**Regra:** mantém um template versionado com o que todos os projectos partilham — tratamento de erros global, leitura de configuração por ambiente, leitura de segredos, endpoint de health check e estrutura de pastas — e deixa de fora o que varia (ligações a bases de dados, endpoints); cada projecto novo parte dele.
**Porquê:** na aula, o template evita que cada programador reconstrua as mesmas utilidades, e uma correcção ao tratamento de erros comum distribui-se publicando uma nova versão do template em vez de ser copiada projecto a projecto.
**Como verificar:** num projecto novo, confirma que o error handler e a leitura de configuração vieram do template e não foram reescritos; o que o projecto acrescenta tem de ser só o que lhe é específico.
**Fonte:** [MCIA §4, aula 18](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mulesoft-certified-integration-architect-course-mcia/transcricoes/018-framework-3-mule-template-project.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mulesoft-certified-integration-architect-course-mcia/notas/04-optional-design-integration-solutions-with-mule-components-r.md)
**Cursos:** 2

### MULD-008 — Health check separado em `/live` e `/ready`

**Regra:** expõe dois endpoints distintos: `/live`, que só confirma que a aplicação responde, e `/ready`, que verifica as dependências a jusante antes de a aplicação receber tráfego real. Não uses um em vez do outro.
**Porquê:** os dois respondem a perguntas diferentes: se o `/live` falha, reiniciar a aplicação pode resolver; se o `/ready` falha, reiniciar não resolve nada, porque o problema está a jusante.
**Como verificar:** confirma que o `/live` não faz chamadas a bases de dados nem a serviços externos e que o `/ready` faz; se o `/live` tocar numa dependência, a distinção perdeu-se.
**Fonte:** [MCD L2 §5, aula 106](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule4-mcd-level2/transcricoes/106-health-endpoint-liveness-readiness.md) · [MCIA §4, aula 18](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mulesoft-certified-integration-architect-course-mcia/transcricoes/018-framework-3-mule-template-project.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule4-mcd-level2/notas/05-section-4-mule-application-health-checks-and-custom-connecto.md)
**Cursos:** 3

## Tratamento de erros

### MULD-009 — Tratamento de erros comum num handler partilhado

**Regra:** os erros comuns a todas as APIs — pedido inválido, método não permitido, recurso não encontrado, dependência indisponível, erro genérico — são tratados num handler único partilhado entre projectos e referenciado por nome; o tratamento local fica reservado aos casos em que a causa exacta interessa ao consumidor.
**Porquê:** o instrutor descreve este handler como cobrindo 99% dos erros que podem ocorrer numa API e como um dos frameworks que o arquitecto identifica para fornecer a todos os projectos; o que sobrar é tratado ao nível do fluxo pelo programador.
**Como verificar:** procura blocos de tratamento de erro repetidos entre módulos; se dois tratarem o mesmo tipo de erro da mesma maneira, pertencem ao handler partilhado.
**Fonte:** [MCIA §4, aula 17](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mulesoft-certified-integration-architect-course-mcia/transcricoes/017-framework-2-global-error-handler.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mulesoft-certified-integration-architect-course-mcia/notas/04-optional-design-integration-solutions-with-mule-components-r.md)
**Cursos:** 4

### MULD-010 — A resposta de erro diz o que corrigir

**Regra:** a resposta de erro identifica a causa concreta — qual o campo obrigatório em falta, qual o cabeçalho não enviado, que dependência está em baixo e desde quando — mais o identificador da transacção; nunca a mensagem genérica por omissão nem um corpo vazio.
**Porquê:** na demonstração, sem este tratamento o consumidor recebe apenas 500 sem corpo; com ele recebe 503 a dizer que o serviço a montante está temporariamente indisponível, ou 400 a dizer exactamente que chaves faltam, o que lhe permite resolver o problema sozinho.
**Como verificar:** força um pedido sem campo obrigatório e outro com uma dependência em baixo; se o corpo da resposta não identificar o campo nem a dependência, a regra falha.
**Fonte:** [MCIA §4, aula 17](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mulesoft-certified-integration-architect-course-mcia/transcricoes/017-framework-2-global-error-handler.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mulesoft-certified-integration-architect-course-mcia/notas/04-optional-design-integration-solutions-with-mule-components-r.md)
**Cursos:** 4

### MULD-011 — O caso genérico é o último, nunca o primeiro

**Regra:** trata primeiro cada tipo de erro específico e deixa um único caso genérico no fim da cadeia, para apanhar o que não foi previsto; o genérico nunca vem antes de um tipo específico.
**Porquê:** a precedência é por ordem de declaração e o tipo genérico contém os específicos como subconjunto — o instrutor demonstra que, movido para o topo, passa a apanhar até os erros que tinham tratamento próprio.
**Como verificar:** lê a cadeia de tratamento de cima para baixo; qualquer ramo específico declarado depois do genérico é código morto.
**Fonte:** [Mule 4.x §10, aula 62](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/transcricoes/062-multiple-errors-handling-in-flow.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/notas/10-mule-error-handling.md)
**Cursos:** 2

### MULD-012 — Falha de regra de negócio é um erro próprio, com tipo próprio

**Regra:** quando uma regra de negócio falha, levanta um erro de um tipo definido pelo projecto, com descrição própria, em vez de deixar a condição cair num erro genérico ou num erro nativo de uma biblioteca; o tipo novo nunca reutiliza o nome de um tipo já existente na plataforma.
**Porquê:** é o que permite apanhar esse caso num ramo próprio e responder uma mensagem útil — na aula, um registo não encontrado vira um erro de tipo próprio que produz um 404 com descrição, em vez de um erro de sistema.
**Como verificar:** procura condições de negócio que terminem num erro genérico sem tipo; cada uma tem de ter o seu tipo e a sua descrição, e o nome não pode colidir com os da plataforma.
**Fonte:** [Mule 4.x §10, aula 65](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/transcricoes/065-error-handling-raise-error-raising-custom-errors-and-handling-custom-errors.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/notas/10-mule-error-handling.md)
**Cursos:** 2

## Reintentos e fiabilidade

### MULD-013 — Reintentos só em operações que não mudam estado

**Regra:** envolve em reintento apenas leituras e outras operações que não alterem o estado do sistema a jusante; escritas não reentrantes não são repetidas automaticamente.
**Porquê:** o instrutor diz explicitamente que o mecanismo de reintento se usa só em métodos de leitura, que não mudam o estado dos serviços de backend, e lembra que cada tentativa bloqueia a execução durante todo o tempo das repetições.
**Como verificar:** para cada bloco de reintento, confirma que a operação lá dentro é idempotente; se for uma escrita, tem de haver chave de idempotência ou o reintento sai.
**Fonte:** [MCD L2 §3, aula 70](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule4-mcd-level2/transcricoes/070-hands-on-2-11-until-successful-scope-with-transient-permanent-errors.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule4-mcd-level2/notas/03-section-2-mule-integration-api-development-error-handling-ca.md)
**Cursos:** 1

### MULD-014 — Repetir só o que é transitório

**Regra:** repete apenas erros transitórios — 429, 503, 504 — e falha de imediato nos permanentes: 401, 403, 405 e 501.
**Porquê:** os transitórios são temporários e passam depressa, o que justifica encapsular a chamada num reintento; os permanentes não se resolvem por mais que se repita, pelo que o curso manda levantar o erro logo.
**Como verificar:** lê a condição de reintento; se apanhar qualquer erro, ou se não distinguir a classe do código de estado, a regra falha.
**Fonte:** [MCD L2 §3, aula 69](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule4-mcd-level2/transcricoes/069-http-errors-and-retry-options.md) · [MCD L2 §3, aula 70](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule4-mcd-level2/transcricoes/070-hands-on-2-11-until-successful-scope-with-transient-permanent-errors.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule4-mcd-level2/notas/03-section-2-mule-integration-api-development-error-handling-ca.md)
**Cursos:** 1

### MULD-015 — Somar todas as camadas de reintento e compará-las com o SLA

**Regra:** antes de fixar tentativas e intervalos, multiplica as tentativas de cada camada de reintento pelas da camada de baixo, soma os intervalos e compara o total com o SLA acordado; em chamadas síncronas fica-te por duas tentativas com intervalos curtos.
**Porquê:** na demonstração, três tentativas com cinco segundos de intervalo por cima de três reconexões com dois segundos transformaram um SLA de 20 segundos numa resposta de 39,49 segundos — os reintentos aninhados multiplicam-se, não se somam linearmente.
**Como verificar:** no diff que mexer em tentativas ou intervalos, exige a conta do pior caso e a comparação explícita com o SLA.
**Fonte:** [MCIA §7, aula 47](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mulesoft-certified-integration-architect-course-mcia/transcricoes/047-balancing-tradeoffs-to-meet-non-functional-requirements.md) · [MCIA §7, aula 44](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mulesoft-certified-integration-architect-course-mcia/transcricoes/044-achieving-reliability-reconnection-strategies.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mulesoft-certified-integration-architect-course-mcia/notas/07-achieving-reliability-goals-with-mule-components.md)
**Cursos:** 2

### MULD-016 — Timeout explícito em cada chamada a serviço externo

**Regra:** define o timeout de resposta de cada cliente HTTP a partir de medições de desempenho do serviço chamado, e nunca deixes o valor por omissão nem escolhas um número ao acaso.
**Porquê:** na aula, o valor por omissão de 10 000 ms fez uma chamada a um servidor inacessível demorar 14 segundos a devolver erro; baixado para 4 000 ms, a mesma chamada respondeu seis segundos mais cedo — e o instrutor insiste que o valor tem de sair de testes de desempenho.
**Como verificar:** lista os clientes HTTP do projecto; qualquer um sem timeout explícito, ou com um valor sem medição que o sustente, é rejeitado.
**Fonte:** [MCD L2 §3, aula 57](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule4-mcd-level2/transcricoes/057-hands-on-2-3-non-functional-requirement-timeout.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule4-mcd-level2/notas/03-section-2-mule-integration-api-development-error-handling-ca.md)
**Cursos:** 2

## Rastreabilidade

### MULD-017 — Correlation ID propagado por toda a cadeia

**Regra:** aceita o correlation ID do chamador, gera-o quando não vier, propaga-o em todas as chamadas seguintes e inclui-o em cada linha de log; nos transportes que o não propagam sozinhos, envia-o explicitamente numa propriedade da mensagem e reaplica-o do lado do consumidor.
**Porquê:** num sistema distribuído é o que permite seguir uma transacção ponta a ponta pelos vários componentes; a aula mostra que nem todos os transportes o preservam — há quem gere sempre um novo, e a partir daí a cadeia parte-se.
**Como verificar:** faz um pedido com correlation ID conhecido e procura-o nos logs de todos os serviços que ele atravessa; se desaparecer em algum salto, falta propagação manual nesse salto.
**Fonte:** [MCD L2 §4, aula 94](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule4-mcd-level2/transcricoes/094-correlation-id.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule4-mcd-level2/notas/04-section-3-asynchronous-processing-logs-tracing-correlation-i.md)
**Cursos:** 3

## Configuração e segredos

### MULD-018 — Trocar de ambiente não toca no código

**Regra:** hosts, portas, credenciais e o próprio nome do ficheiro de configuração são lidos de propriedades fornecidas ao arrancar; mudar de ambiente faz-se mudando esse argumento, nunca editando ficheiros do projecto.
**Porquê:** o instrutor mostra que, com o nome do ficheiro fixo no ficheiro global, promover para outro ambiente obrigaria a editar o código antes de implantar — e diz expressamente que não se toca no código para implantar noutro ambiente.
**Como verificar:** procura nomes de ficheiro de ambiente, hosts ou chaves de cifra escritos à mão em ficheiros versionados; o mesmo artefacto tem de servir todos os ambientes.
**Fonte:** [Mule 4.x §16, aula 109](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/transcricoes/109-load-property-files-dynamically-by-environment.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/notas/16-mule-configure-properties-per-environment.md)
**Cursos:** 4

### MULD-019 — Valores sensíveis cifrados no ficheiro e mascarados no painel

**Regra:** passwords e segredos ficam cifrados no ficheiro de configuração, com uma chave por ambiente que nunca é a mesma nas várias fases, e são lidos por um mecanismo que os decifra em runtime; declara ainda quais as chaves a mascarar na consola de gestão, para não ficarem visíveis a quem lá entra.
**Porquê:** a chave de cifra é escolhida pela organização, não pela plataforma, e o curso usa chaves diferentes por ambiente — na demonstração, implantar com a chave do ambiente errado falha logo no arranque, o que é o comportamento desejado.
**Como verificar:** abre os ficheiros de configuração versionados: nenhum valor sensível pode estar em claro, e a lista de chaves mascaradas tem de incluir a chave de cifra e os segredos de cliente.
**Fonte:** [Mule 4.x §16, aula 108](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/transcricoes/108-mule-secure-configuration-properties-to-read-properties.md) · [MCIA §4, aula 18](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mulesoft-certified-integration-architect-course-mcia/transcricoes/018-framework-3-mule-template-project.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/notas/16-mule-configure-properties-per-environment.md)
**Cursos:** 4

### MULD-020 — Credenciais de automação são por ambiente, com o âmbito mínimo

**Regra:** tudo o que é automatizado — pipelines, registo de aplicações, acesso a serviços geridos — usa credenciais criadas para aquele ambiente concreto, nunca as credenciais da organização inteira.
**Porquê:** o curso invoca o princípio do menor privilégio: é recomendado usar o identificador e o segredo de cliente de um ambiente específico em vez dos da organização, para que o comprometimento de um pipeline não dê acesso a tudo.
**Como verificar:** para cada credencial usada em automação, confirma a que ambiente pertence; uma credencial com âmbito de organização é rejeitada.
**Fonte:** [MCD L2 §2, aula 25](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule4-mcd-level2/transcricoes/025-api-autodiscovery.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule4-mcd-level2/notas/02-section-1-project-structure-deployment-strategy-development.md)
**Cursos:** 2

## Dados e estado

### MULD-021 — Valores do pedido entram na query como parâmetros nomeados

**Regra:** escreve a query com marcadores nomeados e mapeia cada um para o valor correspondente numa secção de parâmetros de entrada separada; não interpoles valores vindos do pedido dentro da string da query.
**Porquê:** é o mecanismo que o curso apresenta para injectar valores numa query, com a query de um lado e o mapeamento dos parâmetros do outro, em vez de os valores serem colocados directamente no texto da instrução.
**Como verificar:** procura concatenação ou interpolação de variáveis dentro de literais SQL; qualquer ocorrência é rejeitada.
**Fonte:** [Mule 4.x §6, aula 32](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/transcricoes/032-mule-rest-service-to-post-json-payload-to-insert-to-database.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/notas/06-mule-rest-full-services-database-as-provider-simple-use-case.md)
**Cursos:** 1

### MULD-022 — Estado partilhado entre instâncias vai para armazenamento persistente

**Regra:** guarda em armazenamento persistente, e não em memória do processo, qualquer estado que tenha de sobreviver a um reinício ou de ser visto por mais do que uma instância; define sempre um tempo de vida para cada entrada.
**Porquê:** o armazenamento em memória pertence a cada instância — uma não alcança a memória da outra, e o valor recarrega do zero a cada reinício; o curso avisa ainda que este armazenamento chave-valor não substitui uma base de dados e não suporta acesso transaccional nem modificação concorrente da mesma entrada.
**Como verificar:** para cada estado mantido entre pedidos, pergunta o que acontece com duas instâncias a correr; se as respostas divergirem conforme a instância, o estado está no sítio errado.
**Fonte:** [MCIA §11, aula 77](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mulesoft-certified-integration-architect-course-mcia/transcricoes/077-identifying-mulesoft-object-store-behavior-in-cloudhub-1-0-2-0-runtime-plane.md) · [MCIA §11, aula 76](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mulesoft-certified-integration-architect-course-mcia/transcricoes/076-storing-mule-application-state-using-persistent-object-store.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mulesoft-certified-integration-architect-course-mcia/notas/11-designing-with-appropriate-state-preservation-and-management.md)
**Cursos:** 3

### MULD-023 — Token de acesso em cache, com validade dentro da do token

**Regra:** guarda o token de acesso obtido do fornecedor de identidade e reutiliza-o enquanto for válido, com um tempo de vida em cache igual ou inferior ao do próprio token; não peças um token novo a cada chamada.
**Porquê:** na aula, um token que dura 60 minutos é cacheado por 59 ou 60, porque repetir o pedido ao fornecedor em cada chamada não faz sentido — reduz-se o número de chamadas ao fornecedor e melhora-se o desempenho.
**Como verificar:** conta os pedidos ao fornecedor de identidade numa sequência de chamadas; mais do que um dentro da validade do token significa que não há cache.
**Fonte:** [Mule 4.x §29, aula 217](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/transcricoes/217-objectstore-and-cache-oauth-2-0-access-token-playback-speed-1-5x-recommended.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/notas/29-mule-event-processing-models-components-scopes.md)
**Cursos:** 3

### MULD-024 — Marca de progresso persistente, sobre uma chave única

**Regra:** em processamento incremental, guarda a marca do último registo processado em armazenamento persistente e usa-a na condição da consulta seguinte; a marca é a chave primária ou outra coluna sem valores repetidos, nunca uma condição fixa escrita na consulta.
**Porquê:** o instrutor mostra que sem marca cada iteração reprocessa os mesmos registos, que a coluna tem de ser chave primária porque uma coluna com valores repetidos não serve para marcar, e que em memória a marca perde-se no reinício e o processamento recomeça do princípio.
**Como verificar:** reinicia o processo a meio e confirma que retoma no ponto onde ia; se recomeçar do zero ou reprocessar registos, a marca não está persistida.
**Fonte:** [Mule 4.x §29, aula 218](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/transcricoes/218-water-marking-playback-speed-1-5x-recommended.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/notas/29-mule-event-processing-models-components-scopes.md)
**Cursos:** 2

## Testes

### MULD-025 — Nenhum teste toca num sistema real

**Regra:** todas as chamadas a bases de dados e a serviços externos são substituídas por respostas simuladas no teste; um caso de teste não abre ligações nem executa operações reais sobre sistemas a jusante.
**Porquê:** os testes correm no pipeline antes de implantar em produção — se alguma operação de escrita chegar ao sistema real, a base de dados de produção fica com dados de teste lá dentro.
**Como verificar:** corre a suite com a rede cortada; se algum teste falhar por não alcançar um sistema, falta simular essa chamada.
**Fonte:** [Mule 4.x §30, aula 223](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/transcricoes/223-munit-mocking-processors.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/notas/30-munit-playback-speed-1-5x-recommended.md)
**Cursos:** 3

### MULD-026 — Cobertura mínima de 80%, imposta pelo pipeline

**Regra:** o pipeline corre a suite de testes antes de implantar e falha o build quando a cobertura fica abaixo de 80%; o limiar é imposto pela ferramenta de build, não pelo ambiente de desenvolvimento.
**Porquê:** o curso fixa 80% como o valor abaixo do qual a implantação falha automaticamente, e avisa que estes limiares só se aplicam quando os testes correm pela ferramenta de build — a correr no ambiente de desenvolvimento, não falham nada.
**Como verificar:** baixa deliberadamente a cobertura abaixo do limiar e confirma que o pipeline falha; se só emitir aviso, a opção de falhar o build está desligada.
**Fonte:** [Mule 4.x §30, aula 219](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule-4x-indepth-beginner-to-expert-with-real-time-use-cases/transcricoes/219-munit-introduction.md) · [MCD L2 §8, aula 151](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule4-mcd-level2/transcricoes/151-munit-maven-plugin.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/mule4-mcd-level2/notas/08-section-7-munit-testing.md)
**Cursos:** 2
