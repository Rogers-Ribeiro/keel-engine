# Regras — observabilidade

Prefixo `OBS`. Regras confirmadas nas transcrições a 2026-09-17. Síntese de origem: [observabilidade](https://github.com/Rogers-Ribeiro/keel/blob/main/conhecimento/observabilidade.md). Decisões pendentes: [revisão](_revisao/observabilidade.md).

## Logging da aplicação

### OBS-001 — Logger nomeado e configurado, nunca `print`

**Regra:** cria um logger com `getLogger("<nome-do-projecto>")` num módulo central, define-lhe explicitamente o nível (`info` ou `debug`) e usa-o em todos os módulos; nenhum diagnóstico sai por `print`.
**Porquê:** quando a aplicação corre num container ou noutra máquina, a saída que ia para o terminal deixa de ser vista, e o nível por omissão do `logging` é `warning`, o que faz desaparecer as mensagens de `debug` e `info`.
**Como verificar:** existe um módulo com o logger do projecto; os restantes ficheiros importam-no em vez de chamarem o logger raiz; o nível é definido no código; não há `print` usado como diagnóstico.
**Fonte:** [fastapi §36, aula 185](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/fastapi-guide/transcricoes/185-logging.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/fastapi-guide/notas/36-tips-tricks.md)
**Cursos:** 1

### OBS-002 — Formatação `%` nas mensagens de log

**Regra:** passa os valores variáveis de uma mensagem de log como argumentos posicionais com `%s`/`%d`, não com *f-strings* nem `.format()`.
**Porquê:** é a sintaxe recomendada para mensagens de log, porque a interpolação fica a cargo do módulo `logging` e só acontece se a mensagem for mesmo emitida.
**Como verificar:** nas chamadas a `logger.info`, `logger.error` e afins, a mensagem é uma literal com marcadores `%` e os valores vêm depois, separados por vírgula.
**Fonte:** [fastapi §36, aula 185](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/fastapi-guide/transcricoes/185-logging.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/fastapi-guide/notas/36-tips-tricks.md)
**Cursos:** 1

### OBS-003 — Registo dos pedidos num middleware único

**Regra:** registra cada pedido HTTP (método, caminho, código de estado e duração) num único middleware registado com `app.middleware("http")`, não nos handlers dos endpoints.
**Porquê:** todos os pedidos e todas as respostas passam pelo middleware, pelo que é o único ponto onde o registo fica garantido e não se repete código.
**Como verificar:** há um só middleware de logging na aplicação, que chama o logger central; os handlers não têm chamadas de log de pedido/resposta.
**Fonte:** [fastapi §27, aula 135](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/fastapi-guide/transcricoes/135-add-middleware.md) · [fastapi §36, aula 185](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/fastapi-guide/transcricoes/185-logging.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/fastapi-guide/notas/27-api-middleware.md)
**Cursos:** 1

## Custo da instrumentação

### OBS-004 — Medir o custo antes de o declarar irrelevante

**Regra:** mede o custo de cada peça que entra no caminho do pedido antes de assumir que é barata — `time.perf_counter()` antes e depois de `call_next` no middleware, `FT.PROFILE` para comparar variantes de uma query de pesquisa.
**Porquê:** tudo o que o middleware faz soma-se ao tempo de resposta visto pelo cliente, e variações de sintaxe de uma query (por exemplo acrescentar *fuzzy search*) mudam o tempo de execução de forma que só a medição revela.
**Como verificar:** o diff que acrescenta trabalho ao caminho do pedido ou muda uma query traz uma medição antes/depois, e não apenas a afirmação de que o custo é desprezável.
**Fonte:** [fastapi §27, aula 135](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/fastapi-guide/transcricoes/135-add-middleware.md) · [redis §20, aula 169](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/redis-the-complete-developers-guide-p/transcricoes/169-query-performance-with-profile.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/fastapi-guide/notas/27-api-middleware.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/redis-the-complete-developers-guide-p/notas/20-search-in-action.md)
**Cursos:** 2

### OBS-005 — I/O de observabilidade fora do caminho da resposta

**Regra:** o trabalho de observabilidade que não precisa de bloquear a resposta (escrever ficheiros de log, enviar registos para fora) é entregue a um worker em background com `.delay(...)`, em vez de correr de forma síncrona dentro do middleware.
**Porquê:** o trabalho feito no middleware entra no tempo de resposta; passá-lo para a fila devolve esse tempo ao cliente sem perder o registo.
**Como verificar:** o middleware limita-se a montar a mensagem e a enfileirar a tarefa; a escrita ou o envio acontecem no worker.
**Fonte:** [fastapi §27, aula 135](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/fastapi-guide/transcricoes/135-add-middleware.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/fastapi-guide/notas/27-api-middleware.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/fastapi-guide/notas/24-celery.md)
**Cursos:** 1

## Métricas

### OBS-006 — RED no serviço, USE na infra-estrutura, saturação incluída

**Regra:** define as métricas de cada camada pelo método correspondente — Rate, Errors e Duration na camada de serviço; Utilization, Saturation e Errors na infra-estrutura — em vez de recolher métricas ad-hoc, e não deixes a saturação de fora.
**Porquê:** recolher e guardar informação ao acaso não serve para monitorizar; os métodos dizem exactamente que métricas cobrem cada camada, e a saturação (recursos a 100% com fila à espera) é o sinal que falta a quem só olha para utilização e erros.
**Como verificar:** a spec de observabilidade lista, por camada, as métricas dos métodos RED e USE, com a saturação entre elas; métricas fora dessa lista têm justificação explícita.
**Fonte:** [grafana §2, aula 4](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/transcricoes/004-methods-of-monitoring.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/notas/02-foundations-of-observability.md)
**Cursos:** 1

## Logs agregados

### OBS-007 — Toda a dimensão de filtragem é uma label

**Regra:** declara como label do Loki cada dimensão pela qual se vai filtrar logs (componente, ambiente, nível) — estática na configuração do agente ou extraída na ingestão com os stages `logfmt` + `labels` — e não deixes a filtragem depender de pesquisa de texto livre.
**Porquê:** o Loki indexa automaticamente só o timestamp, pelo que qualquer outra dimensão tem de ser exposta como label; a pesquisa de texto é muito pesada em CPU e só se recomenda quando não há alternativa ou o volume é pequeno.
**Como verificar:** cada filtro usado nos dashboards e nos alertas corresponde a uma label declarada na configuração do agente; as queries não se apoiam em correspondência de texto na linha.
**Fonte:** [grafana §7, aula 63](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/transcricoes/063-ingesting-log-entries-into-loki-using-promtail.md) · [grafana §7, aula 64](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/transcricoes/064-creating-and-attaching-static-labels.md) · [grafana §7, aula 65](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/transcricoes/065-dynamic-labels-extracting-labels-from-unstructured-logs.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/notas/07-grafana-loki.md)
**Cursos:** 1

## Dashboards

### OBS-008 — Mesma janela de intervalo nas queries de um painel

**Regra:** quando um painel compara ou combina várias séries, usa a mesma janela na função de intervalo (`rate(...[1m])`, `count_over_time`) em todas as queries envolvidas.
**Porquê:** séries convertidas em vector com janelas diferentes (uma a 1 minuto e outra a 24 horas) não são comparáveis nem somáveis — os valores e as séries temporais resultantes são de escalas diferentes.
**Como verificar:** no JSON ou no editor do painel, todas as queries que entram na mesma comparação ou soma têm janelas idênticas.
**Fonte:** [grafana §5, aula 42](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/transcricoes/042-multiple-and-accumulative-queries.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/notas/05-using-grafana.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/notas/07-grafana-loki.md)
**Cursos:** 1

## Alertas

### OBS-009 — Período de espera em cada regra de alerta

**Regra:** dá a cada regra de alerta um "pending period" (por exemplo 1 minuto) durante o qual a condição tem de se manter violada antes de o alerta disparar.
**Porquê:** sem esse período, um pico isolado no sistema levanta logo um alerta, e o objectivo é não gerar falsos alarmes.
**Como verificar:** nenhuma regra de alerta tem o período de espera a zero; o valor consta da definição da regra.
**Fonte:** [grafana §6, aula 55](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/transcricoes/055-working-with-alert-rules.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/notas/06-working-with-alerts-notifications-and-annotations-in-grafana.md)
**Cursos:** 1

### OBS-010 — Encaminhamento por labels da regra, em políticas aninhadas

**Regra:** dá a cada regra de alerta labels próprias (equipa responsável, ambiente, âmbito) e encaminha as notificações em políticas aninhadas que filtram por essas labels; não alteres a política de notificação por omissão nem encaminhes pelo nome da métrica.
**Porquê:** o encaminhamento pelo nome da métrica manda a notificação a muita gente para quem ela é irrelevante; as labels criadas de propósito para a regra dizem exactamente a quem interessa. A política por omissão nunca se muda, cria-se uma aninhada.
**Como verificar:** todas as regras têm labels de encaminhamento; as políticas de notificação são aninhadas e filtram por essas labels; a política por omissão continua intacta.
**Fonte:** [grafana §6, aula 56](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/transcricoes/056-notification-policies-and-contact-points.md) · [grafana §6, aula 55](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/transcricoes/055-working-with-alert-rules.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/notas/06-working-with-alerts-notifications-and-annotations-in-grafana.md)
**Cursos:** 1

## Tracing distribuído

### OBS-011 — Um só `TracerProvider` por serviço (API a confirmar)

**Regra:** cria um único `TracerProvider` por serviço, inicializado no arranque e vivo durante todo o ciclo de vida do processo; os spans são criados a partir do tracer que ele dá.
**Porquê:** o provider tem de existir enquanto o serviço existir — nasce quando o serviço nasce e morre quando o serviço morre —, por isso não se instancia por pedido nem por módulo.
**Como verificar:** há uma só instância do provider, criada no arranque da aplicação; nenhum handler ou função de negócio o volta a construir.
**Fonte:** [grafana §9, aula 82](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/transcricoes/082-sending-traces-from-a-microservice-to-grafana-tempo-with-opentelemetry.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/notas/09-grafana-tempo-tracing-in-distributed-systems.md)
**Cursos:** 1

### OBS-012 — Estado e excepção em cada span (API a confirmar)

**Regra:** define o estado de todos os spans — `ok` quando a operação corre bem, `error` quando falha — e anexa a excepção ao span quando ela ocorre.
**Porquê:** o estado tem de ser definido em cada span, e é o registo da excepção no span que faz a falha aparecer no backend de traces em vez de se perder.
**Como verificar:** os blocos que criam spans fecham sempre com o estado definido; os `except` registam a excepção no span antes de a propagar.
**Fonte:** [grafana §9, aula 82](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/transcricoes/082-sending-traces-from-a-microservice-to-grafana-tempo-with-opentelemetry.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/notas/09-grafana-tempo-tracing-in-distributed-systems.md)
**Cursos:** 1

### OBS-013 — Propagação do contexto em cada chamada entre serviços (API a confirmar)

**Regra:** antes de chamar outro serviço, injecta o trace ID e o span ID pai nos cabeçalhos do pedido com a API `inject` de um propagador; do lado que recebe, reconstrói o contexto com `extract` a partir desses cabeçalhos antes de abrir o span.
**Porquê:** a API `inject` existe em todos os SDKs e é obrigatória para o contexto viajar; sem ela cada serviço gera um trace independente e perde-se a visão ponta a ponta do pedido.
**Como verificar:** todos os clientes HTTP internos passam pelo `inject`; todos os pontos de entrada chamam `extract` sobre os cabeçalhos recebidos; nenhum serviço abre um span de raiz para um pedido que vem de outro serviço.
**Fonte:** [grafana §9, aula 83](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/transcricoes/083-propagating-spans-in-a-distributed-systems-service-graphs-in-tempo.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/notas/09-grafana-tempo-tracing-in-distributed-systems.md)
**Cursos:** 1

### OBS-014 — Tipo de span `client` ou `server` nas chamadas entre serviços (API a confirmar)

**Regra:** ao criar o span de uma chamada entre serviços, marca-o explicitamente como `client` no lado que chama e como `server` no lado que atende.
**Porquê:** é essa distinção que é usada para desenhar o grafo de serviços; sem ela o grafo não se constrói.
**Como verificar:** os spans dos clientes HTTP internos declaram o tipo `client`; os spans dos pontos de entrada declaram `server`.
**Fonte:** [grafana §9, aula 83](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/transcricoes/083-propagating-spans-in-a-distributed-systems-service-graphs-in-tempo.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/notas/09-grafana-tempo-tracing-in-distributed-systems.md)
**Cursos:** 1
