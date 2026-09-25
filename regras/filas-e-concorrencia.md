# Regras — filas-e-concorrencia

Prefixo `FIL`. ## Trabalho fora do caminho do pedido

### FIL-001 — Efeito secundário lento fora do caminho do pedido

**Regra:** Não aguardes, dentro do handler de um pedido, por um efeito secundário lento de que a resposta não depende (email, SMS, notificação, escrita de log, chamada a uma API externa); agenda-o numa tarefa de fundo, numa tarefa de worker ou numa mensagem de fila e responde de imediato.
**Porquê:** O tempo real da operação soma-se ao tempo de resposta — o curso de FastAPI mediu cerca de 3,5 segundos extra por pedido ao enviar o email dentro do handler; o curso de Redis descreve o mesmo problema com uma API de email de terceiros a deixar o pedido pendurado vários segundos.
**Como verificar:** Nos handlers, procura `await` sobre funções de envio/integração externa cujo resultado não entra na resposta; devem aparecer em `background_tasks.add_task(...)`, numa tarefa enfileirada ou numa escrita na stream.
**Cursos:** 2

### FIL-002 — Enfileirar a tarefa, nunca chamar a função directamente

**Regra:** Para correr trabalho num worker Celery, invoca a tarefa com `.delay(...)` (ou `apply_async`); nunca chames a função decorada com `@app.task` como função normal quando o objectivo é execução no worker.
**Porquê:** Chamar a função directamente executa-a no processo do servidor, como qualquer outra chamada: a fila e o worker ficam por usar e o tempo volta ao caminho do pedido.
**Como verificar:** No diff, cada chamada a uma função decorada com `@app.task` feita a partir do código da API tem de terminar em `.delay(...)` ou `.apply_async(...)`.
**Cursos:** 1

### FIL-003 — Só código síncrono dentro de uma tarefa Celery

**Regra:** Dentro de uma tarefa Celery não uses `async def` nem `await`; para reutilizar uma corrotina existente, converte-a com `asgiref.sync.async_to_sync` antes de a chamar.
**Porquê:** O curso é explícito: dentro de uma tarefa Celery só é suportado código síncrono, e as bibliotecas de I/O usadas na API (como o envio de mail) expõem corrotinas.
**Como verificar:** Nos módulos de tarefas, nenhuma função decorada com `@app.task` é `async def` nem contém `await`; as chamadas a corrotinas aparecem envolvidas em `async_to_sync(...)`.
**Cursos:** 1

## Escrita concorrente sobre estado partilhado

### FIL-004 — Comando atómico em vez de ler, calcular e escrever

**Regra:** Sempre que a operação caiba num único comando atómico do Redis (`INCR`, `DECR`, `INCRBY`, `DECRBY`, `INCRBYFLOAT`, `HINCRBY`, `HSETNX`), usa-o em vez de `GET`, calcular no cliente e `SET`.
**Porquê:** O Redis processa os comandos um de cada vez, pela ordem de chegada, o que torna estes comandos atómicos; a versão em duas viagens abre uma condição de corrida real — dois pedidos simultâneos leem o mesmo valor e perde-se uma actualização.
**Como verificar:** Procura pares `get`/`set` (ou `hget`/`hset`) sobre a mesma chave separados por aritmética no código Python; cada par é um candidato a comando atómico.
**Cursos:** 1

### FIL-005 — Lock distribuído com token aleatório, `NX`, expiração e `try/finally`

**Regra:** Ao proteger estado partilhado com um lock em Redis, adquire-o com `SET lock:<chave> <token> NX` usando um token aleatório único por tentativa, dá sempre expiração à chave do lock (`EX`/`PX`), limita as tentativas de aquisição (atraso entre tentativas e número máximo) e liberta o lock num `try/finally`.
**Porquê:** Sem expiração, um processo que rebente ou perca energia antes do `DELETE` deixa a chave bloqueada para sempre; o `try/finally` cobre o erro dentro do bloco protegido e a expiração cobre a falha total do processo. O token aleatório é o que torna possível saber, mais tarde, quem é o dono do lock.
**Como verificar:** Todo o `SET` de uma chave `lock:*` traz `NX` e um argumento de expiração, o valor gravado é gerado aleatoriamente a cada aquisição, e a libertação está num `finally`; um ciclo de aquisição sem limite de tentativas é rejeitado.
**Cursos:** 1

### FIL-006 — Libertar o lock por script que compara o token

**Regra:** Liberta o lock com um script Lua que lê o valor da chave, o compara com o token do processo actual e só depois apaga; nunca com um `DELETE` directo sobre a chave do lock.
**Porquê:** Se o comando de libertação demorar a chegar ao Redis e o lock entretanto expirar e for adquirido por outro processo, o `DELETE` directo apaga o lock alheio. O script é seguro porque o Redis não processa outros comandos enquanto corre um script.
**Como verificar:** No código de libertação não há `delete`/`unlink` directo sobre `lock:*`; há uma chamada a um script (por `EVAL`/`EVALSHA`) que recebe a chave e o token.
**Cursos:** 1

## Filas de mensagens

### FIL-007 — Grupo de consumidores quando há mais do que um worker

**Regra:** Num fluxo produtor/consumidor com mais do que um worker sobre a mesma stream Redis, consome com `XREADGROUP` dentro de um grupo criado com `XGROUP CREATE`; não uses `XREAD` simples.
**Porquê:** Uma stream simples entrega a mesma mensagem a todos os consumidores que a leiam — o curso dá o exemplo do mesmo email enviado por cada worker. Com grupo, cada mensagem vai para um só membro.
**Como verificar:** No código do consumidor procura `xread(` sobre uma stream de trabalho; só é aceitável com um único consumidor. Caso contrário, deve haver `xgroup_create` na arranque e `xreadgroup` no ciclo.
**Cursos:** 1

### FIL-008 — Confirmar com `XACK` e recuperar pendentes com `XAUTOCLAIM`

**Regra:** Confirma cada mensagem com `XACK` só depois de a processar com sucesso, e corre `XAUTOCLAIM` periodicamente para reatribuir as mensagens pendentes há mais tempo do que o limite definido.
**Porquê:** É a confirmação que distingue "entregue" de "processado": sem `XACK` a mensagem fica pendente para sempre e não se detecta a falha; o `XAUTOCLAIM` é o que passa a outro worker as mensagens de um worker que rebentou depois de as receber.
**Como verificar:** No ciclo de consumo, o `xack` aparece depois da chamada que processa a mensagem (e não logo a seguir à leitura, nem dentro de um `except` que engoliu o erro); existe uma rotina periódica com `xautoclaim` e um limite de tempo explícito.
**Cursos:** 1

## Assincronia dentro do processo

### FIL-009 — Acesso assíncrono à base de dados numa aplicação assíncrona

**Regra:** Numa aplicação assíncrona, o acesso à base de dados é assíncrono de ponta a ponta: `create_async_engine`, `async_sessionmaker`, `AsyncSession`, `await` nas chamadas que vão à base de dados e um driver assíncrono (`asyncpg`, não `psycopg2`).
**Porquê:** O curso apresenta a conversão como necessária para qualquer framework assíncrono (FastAPI, bots) — as chamadas síncronas bloqueiam o event loop e anulam a vantagem do assíncrono.
**Como verificar:** Num projecto assíncrono, `create_engine`/`sessionmaker` síncronos e URLs com driver síncrono são rejeitados; nos repositórios, `session.execute`/`session.scalars`/`session.commit` aparecem com `await` (`.first()`/`.all()` sobre o resultado continuam síncronos).
**Cursos:** 1

## Cache

### FIL-010 — TTL obrigatório nas chaves de cache

**Regra:** Dá sempre um tempo de expiração (`EX`/`PX`, ou `EXAT`/`PXAT`) às chaves que guardam cópias de dados cuja fonte de verdade está noutro sistema.
**Porquê:** O padrão de cache assenta na expiração: quando a chave expira, o pedido seguinte volta à fonte de verdade e repovoa a cache, o que mantém os dados frescos e a memória do Redis dentro do limite.
**Como verificar:** Cada `set` sobre uma chave de cache traz argumento de expiração; um `set` sem TTL sobre dados derivados de outra fonte é sinalizado.
**Cursos:** 1
