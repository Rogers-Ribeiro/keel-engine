# Regras — persistencia

Prefixo `DB`. Regras confirmadas nas transcrições a 2026-09-17. Síntese de origem: [persistencia](../conhecimento/persistencia.md). Decisões pendentes: [revisão](_revisao/persistencia.md). A secção «Isolamento entre tenants» é a excepção: não sai de curso nenhum, sai da referência [postgres-multitenancy](../docs/postgres-multitenancy.md).

## Consultas e escrita

### DB-001 — Valores do exterior só como parâmetros

**Regra:** nunca insiras um valor vindo do cliente numa string SQL por f-string ou concatenação; passa-o como parâmetro posicional (`?`) ou nomeado (`:nome`) no `execute`, por `text(...).params(...)`, ou pelos `values()`/comparações do ORM.
**Porquê:** um valor de texto pode conter uma condição SQL (por exemplo `... OR true`) que altera a consulta e afecta linhas que não deviam ser tocadas.
**Como verificar:** procura no diff f-strings, `%` ou `+` dentro de strings SQL e de `text(...)`; qualquer valor variável tem de aparecer como marcador com os dados passados à parte.
**Fonte:** [FastAPI §7, aula 35](../cursos/fastapi-guide/transcricoes/035-sql-query-parameters.md) · [nota](../cursos/fastapi-guide/notas/07-sql-database.md) · [nota SQLAlchemy §4](../cursos/sqlalchemy-alembic-bootcamp/notas/04-querying-with-sqlalchemy-orm.md)
**Cursos:** 2

### DB-002 — Commit depois de cada escrita

**Regra:** chama `commit()` na ligação ou na sessão depois de cada `insert`, `update` ou `delete`, na mesma unidade de trabalho que fez a alteração.
**Porquê:** sem o commit a alteração fica só na transação em curso e desaparece quando a sessão ou a ligação termina.
**Como verificar:** cada método que executa uma instrução de escrita tem um `commit()` (ou delega-o explicitamente em quem o chama, documentando-o); em código assíncrono, com `await`.
**Fonte:** [FastAPI §7, aula 34](../cursos/fastapi-guide/transcricoes/034-update-row.md) · [SQLAlchemy §4, aula 18](../cursos/sqlalchemy-alembic-bootcamp/transcricoes/18-insert-queries-using-the-orm.md) · [nota](../cursos/sqlalchemy-alembic-bootcamp/notas/05-modifying-data-with-orm.md)
**Cursos:** 2

### DB-003 — Acesso à base de dados concentrado numa classe com a sessão

**Regra:** põe as consultas e escritas numa classe (repositório ou serviço) que recebe a sessão no construtor e expõe métodos de domínio; quem trata pedidos ou orquestra agentes chama esses métodos e não vê `session.add`/`commit`/`refresh` nem SQL.
**Porquê:** junta as queries num só sítio e mantém os detalhes da base de dados fora do código que responde a pedidos.
**Como verificar:** nenhum handler, tarefa ou nó de grafo contém instruções `select`/`insert` nem chamadas directas à sessão; a classe recebe a sessão como argumento em vez de a criar.
**Fonte:** [FastAPI §10, aula 56](../cursos/fastapi-guide/transcricoes/056-service-layer.md) · [SQLAlchemy §4, aula 18](../cursos/sqlalchemy-alembic-bootcamp/transcricoes/18-insert-queries-using-the-orm.md) · [nota](../cursos/fastapi-guide/notas/10-postgresql.md) · [nota](../cursos/sqlalchemy-alembic-bootcamp/notas/04-querying-with-sqlalchemy-orm.md)
**Cursos:** 2

### DB-004 — Dados relacionados em massa por `join`, nunca em ciclo

**Regra:** para carregar dados relacionados de vários registos, usa um `select` com `join` explícito (ou carregamento imediato da relação); não percorras um atributo de relação dentro de um ciclo.
**Porquê:** cada acesso ao atributo de relação dispara uma consulta adicional, o que é muito ineficiente quando há muitos registos.
**Como verificar:** procura ciclos `for` que acedem a atributos de relação; o log do engine (`echo=True`) mostra uma consulta por iteração quando o problema existe.
**Fonte:** [SQLAlchemy §4, aula 24](../cursos/sqlalchemy-alembic-bootcamp/transcricoes/24-advanced-select-queries-with-joins-with-sqlalchemy-orm.md) · [nota](../cursos/sqlalchemy-alembic-bootcamp/notas/04-querying-with-sqlalchemy-orm.md)
**Cursos:** 1

## Esquema e migrações

### DB-005 — Esquema alterado sempre por revisão Alembic

**Regra:** cria e altera tabelas por revisão Alembic versionada; não uses `metadata.create_all`/`drop_all` nem alterações manuais como forma de gerir o esquema fora de experiências descartáveis.
**Porquê:** o `create_all` só cria tabelas que ainda não existem e não altera as já criadas, e nenhuma das alternativas deixa histórico rastreável nem reversível.
**Como verificar:** cada mudança de modelo no diff traz um ficheiro novo em `versions/`; `create_all` não aparece no arranque da aplicação nem em scripts usados em ambientes com dados.
**Fonte:** [SQLAlchemy §3, aula 13](../cursos/sqlalchemy-alembic-bootcamp/transcricoes/13-using-sqlalchemy-to-create-tables-in-the-database.md) · [FastAPI §15, aula 85](../cursos/fastapi-guide/transcricoes/085-setup.md) · [nota](../cursos/sqlalchemy-alembic-bootcamp/notas/03-alembic-for-database-management.md) · [nota](../cursos/fastapi-guide/notas/15-alembic-database-migrations.md)
**Cursos:** 2

### DB-006 — Revisão gerada é revista antes de aplicada

**Regra:** lê o ficheiro produzido por `alembic revision --autogenerate` antes de correr `upgrade` e escreve à mão as renomeações (`op.alter_column(..., new_column_name=...)`) e as mudanças de tipo (`op.alter_column(..., type_=...)`), tanto no `upgrade` como no `downgrade`.
**Porquê:** o autogenerate não detecta renomeações nem mudanças de tipo: interpreta uma renomeação como apagar e criar coluna, o que apaga os dados dessa coluna.
**Como verificar:** numa revisão que acompanhe uma renomeação, o diff mostra `alter_column` e não o par `add_column`/`drop_column`; as mudanças de tipo aparecem explicitamente.
**Fonte:** [SQLAlchemy §3, aula 16](../cursos/sqlalchemy-alembic-bootcamp/transcricoes/16-modifying-the-database-structure-with-alembic.md) · [FastAPI §15, aula 87](../cursos/fastapi-guide/transcricoes/087-autogenerate-revision.md) · [nota](../cursos/sqlalchemy-alembic-bootcamp/notas/03-alembic-for-database-management.md)
**Cursos:** 2

### DB-007 — `target_metadata` com todos os modelos importados

**Regra:** no `env.py`, aponta o `target_metadata` à metadata dos modelos da aplicação e garante que todos os módulos de modelos estão importados nesse ficheiro.
**Porquê:** a metadata só conhece as classes que foram importadas; sem o import, a tabela não existe para a comparação e o autogenerate ignora-a ou propõe apagá-la.
**Como verificar:** o `env.py` importa todos os pacotes de modelos e define `target_metadata`; um modelo novo aparece no diff acompanhado do import correspondente quando este falta.
**Fonte:** [SQLAlchemy §3, aula 14](../cursos/sqlalchemy-alembic-bootcamp/transcricoes/14-getting-started-with-alembic.md) · [FastAPI §15, aula 87](../cursos/fastapi-guide/transcricoes/087-autogenerate-revision.md) · [nota](../cursos/sqlalchemy-alembic-bootcamp/notas/03-alembic-for-database-management.md) · [nota](../cursos/fastapi-guide/notas/15-alembic-database-migrations.md)
**Cursos:** 2

### DB-008 — Revisões aplicadas não se apagam

**Regra:** mantém a pasta de migrações sob controlo de versões e não apagues um ficheiro de revisão sem confirmar que nenhuma base aplicou uma revisão posterior a essa; nesse caso, faz `downgrade` primeiro.
**Porquê:** o Alembic guarda a revisão aplicada em `alembic_version`; se essa revisão deixar de existir nos ficheiros, o histórico fica inconsistente e as migrações seguintes deixam de correr.
**Como verificar:** um diff que remove ficheiros de `versions/` traz a justificação e o `downgrade` correspondente; `alembic current` na base alvo não aponta para uma revisão apagada.
**Fonte:** [SQLAlchemy §3, aula 16](../cursos/sqlalchemy-alembic-bootcamp/transcricoes/16-modifying-the-database-structure-with-alembic.md) · [nota](../cursos/sqlalchemy-alembic-bootcamp/notas/03-alembic-for-database-management.md)
**Cursos:** 1

## Ligação, sessões e configuração

### DB-009 — Credenciais de ligação em variáveis de ambiente

**Regra:** lê utilizador, password, host, porta e nome da base de variáveis de ambiente (ficheiro `.env` fora do repositório); não escrevas credenciais nem connection strings no código nem no `alembic.ini`.
**Porquê:** quem tiver acesso ao projecto passa a ver a password da base de dados; com variáveis de ambiente, partilhar o código não partilha as credenciais e cada ambiente usa as suas.
**Como verificar:** procura passwords e URLs completas em literais de código, em `alembic.ini` e em ficheiros de configuração versionados; o `.env` está no `.gitignore`.
**Fonte:** [FastAPI §10, aula 53](../cursos/fastapi-guide/transcricoes/053-environment-variable.md) · [SQLAlchemy §3, aula 14](../cursos/sqlalchemy-alembic-bootcamp/transcricoes/14-getting-started-with-alembic.md) · [nota](../cursos/fastapi-guide/notas/10-postgresql.md) · [nota](../cursos/sqlalchemy-alembic-bootcamp/notas/03-alembic-for-database-management.md)
**Cursos:** 2

### DB-010 — Engine e sessões assíncronos numa aplicação assíncrona

**Regra:** numa aplicação assíncrona, usa `create_async_engine` com um driver assíncrono (`postgresql+asyncpg://...`) e cria as sessões a partir de um `async_sessionmaker`, em vez de instanciar `AsyncSession` directamente; `await` em cada operação que vai à base de dados.
**Porquê:** o driver assíncrono é obrigatório para o engine assíncrono, uma chamada síncrona bloqueia o ciclo de eventos, e a fábrica de sessões traz a pool de ligações e segurança entre threads.
**Como verificar:** a URL leva `+asyncpg`, não há `create_engine`/`Session` síncronos no caminho dos pedidos, e as sessões saem sempre do sessionmaker.
**Fonte:** [FastAPI §10, aula 54](../cursos/fastapi-guide/transcricoes/054-async-session.md) · [SQLAlchemy §6, aula 30](../cursos/sqlalchemy-alembic-bootcamp/transcricoes/30-migrating-to-asynchronous-mode.md) · [nota](../cursos/fastapi-guide/notas/10-postgresql.md) · [nota](../cursos/sqlalchemy-alembic-bootcamp/notas/06-advanced-topics.md)
**Cursos:** 2

### DB-011 — Uma sessão por unidade de trabalho, dentro de um gestor de contexto

**Regra:** obtém uma sessão nova por pedido ou por unidade de trabalho, sempre dentro de um gestor de contexto (`with`/`async with`) ou de uma dependência geradora que faz `yield` dentro dele; não guardes uma sessão em variável global partilhada nem chames `.close()` à mão.
**Porquê:** o gestor de contexto devolve a ligação à pool mesmo quando há excepção, e uma sessão nova por pedido mantém o isolamento entre trabalhos concorrentes.
**Como verificar:** não há sessão criada no âmbito do módulo nem passada como singleton; cada entrada no código abre e fecha a sua sessão num bloco.
**Fonte:** [FastAPI §8, aula 43](../cursos/fastapi-guide/transcricoes/043-dependency-injection.md) · [SQLAlchemy §1, aula 5](../cursos/sqlalchemy-alembic-bootcamp/transcricoes/05-establishing-database-connection.md) · [nota](../cursos/fastapi-guide/notas/08-sqlmodel.md) · [nota](../cursos/sqlalchemy-alembic-bootcamp/notas/01-introduction-and-setup.md)
**Cursos:** 2

## Dados sensíveis

### DB-012 — Passwords guardadas em hash e comparadas por `verify`

**Regra:** guarda o resultado de um hash (por exemplo `CryptContext(schemes=["bcrypt"], deprecated="auto")`) num campo com nome próprio (`password_hash`), nunca a password em texto simples; para autenticar, usa `verify(valor, hash)` e não comparação de strings.
**Porquê:** se a base de dados for comprometida, as passwords em texto simples ficam expostas e podem ser reutilizadas noutras plataformas, porque muita gente repete a mesma password.
**Como verificar:** nenhum modelo tem campo `password`; o schema de criação recebe a password em texto simples, exclui-a explicitamente ao construir o modelo, e o valor guardado passa pelo `hash`.
**Fonte:** [FastAPI §11, aula 62](../cursos/fastapi-guide/transcricoes/062-password-hash.md) · [FastAPI §11, aula 59](../cursos/fastapi-guide/transcricoes/059-overview.md) · [nota](../cursos/fastapi-guide/notas/11-register-user.md)
**Cursos:** 1

## Redis

### DB-013 — Primeiro a lista de consultas, depois as estruturas

**Regra:** antes de escolher estruturas e chaves em Redis, escreve a lista das leituras e escritas que a aplicação precisa de fazer, e desenha só para essas; não transponhas o modelo relacional para Redis à espera de decidir as consultas depois.
**Porquê:** o Redis não tem consultas flexíveis: a estrutura tem de responder directamente a cada operação, e é isso que dá a velocidade que justifica usá-lo. Desenhar para requisitos hipotéticos futuros piora o desenho actual.
**Como verificar:** a spec ou o comentário do módulo lista as operações suportadas; cada estrutura criada corresponde a pelo menos uma dessas operações.
**Fonte:** [Redis §7, aula 41](../cursos/redis-the-complete-developers-guide-p/transcricoes/041-reducing-the-design-to-queries.md) · [nota](../cursos/redis-the-complete-developers-guide-p/notas/07-powerful-design-patterns.md) · [nota](../cursos/redis-the-complete-developers-guide-p/notas/03-e-commerce-app-setup.md)
**Cursos:** 1

### DB-014 — Chaves geradas por funções dedicadas

**Regra:** dá a cada tipo de chave uma função dedicada que a constrói a partir do identificador, com um separador consistente em toda a base (`tipo:id` ou `tipo#id` — não há diferença funcional, o que não pode haver é mistura), e chama essa função em todo o código; não escrevas literais de chave nem concatenes strings de chave espalhadas pelos módulos.
**Porquê:** um erro de escrita numa chave não dá erro — a leitura devolve vazio em silêncio e o problema só aparece mais tarde.
**Como verificar:** procura literais com o separador de chave fora do módulo que gera chaves; cada acesso ao cliente Redis usa uma dessas funções.
**Fonte:** [Redis §3, aula 27](../cursos/redis-the-complete-developers-guide-p/transcricoes/027-key-naming-methodology.md) · [Redis §3, aula 29](../cursos/redis-the-complete-developers-guide-p/transcricoes/029-better-key-generation.md) · [nota](../cursos/redis-the-complete-developers-guide-p/notas/03-e-commerce-app-setup.md)
**Cursos:** 1

### DB-015 — TTL em tudo o que é cache

**Regra:** define um tempo de expiração (`EX`/`PX`) ao gravar qualquer dado cuja fonte de verdade está noutro sistema, escolhido em função da tolerância a dados desactualizados dessa funcionalidade.
**Porquê:** o Redis guarda tudo em memória; a expiração automática é o que impede a cache de crescer sem limite e garante que o pedido seguinte volta a ler a fonte de verdade.
**Como verificar:** nenhuma escrita de cache usa `SET` sem opção de expiração; o valor do TTL está junto da escrita e é justificado.
**Fonte:** [Redis §2, aula 10](../cursos/redis-the-complete-developers-guide-p/transcricoes/010-use-case-of-expiration-options.md) · [Redis §3, aula 28](../cursos/redis-the-complete-developers-guide-p/transcricoes/028-adding-page-caching.md) · [nota](../cursos/redis-the-complete-developers-guide-p/notas/02-commands-for-adding-and-querying-data.md)
**Cursos:** 1

### DB-016 — Alterações de valores em Redis por comando atómico

**Regra:** altera valores no Redis com o comando atómico adequado (`INCR`, `INCRBY`, `INCRBYFLOAT`, `HINCRBY`, `HSETNX`, `SET ... NX`); não leias o valor, calcules no cliente e escrevas de volta.
**Porquê:** o Redis é mono-thread e processa um comando de cada vez, o que torna estes comandos atómicos; ler e escrever em duas viagens deixa dois clientes a ler o mesmo valor antes de qualquer um escrever, e perde-se uma actualização.
**Como verificar:** procura pares de leitura seguida de escrita sobre a mesma chave no mesmo bloco; devem ser um único comando.
**Fonte:** [Redis §2, aula 16](../cursos/redis-the-complete-developers-guide-p/transcricoes/016-again-why-do-these-commands-exist.md) · [nota](../cursos/redis-the-complete-developers-guide-p/notas/02-commands-for-adding-and-querying-data.md)
**Cursos:** 1

### DB-017 — Operações não atómicas protegidas por lock com expiração e libertação verificada

**Regra:** quando a operação não se reduz a um comando atómico, protege-a com um lock: token aleatório único, `SET lock:<chave> <token> NX` com expiração, tentativas com atraso e limite, `try/finally` a libertar sempre, e libertação por script Lua que só apaga a chave se o valor ainda for esse token.
**Porquê:** sem expiração, uma falha do processo deixa a chave bloqueada para sempre; sem a comparação do token, um `DELETE` atrasado apaga o lock de outro processo que entretanto o adquiriu.
**Como verificar:** o `SET` do lock tem `NX` e expiração; a libertação passa pelo script com o token e está num `finally`, nunca num `DEL` directo.
**Fonte:** [Redis §18, aula 140](../cursos/redis-the-complete-developers-guide-p/transcricoes/140-automatically-expiring-locks.md) · [Redis §18, aula 143](../cursos/redis-the-complete-developers-guide-p/transcricoes/143-adding-an-unlock-script.md) · [nota](../cursos/redis-the-complete-developers-guide-p/notas/18-understanding-and-solving-concurrency-issues.md)
**Cursos:** 1

## Isolamento entre tenants

Estas sete regras não saem de curso nenhum. Nenhum dos 25 cursos extraídos ensina row-level security, e por isso o
pipeline síntese → regras nunca as poderia produzir. Saem da referência [postgres-multitenancy](../docs/postgres-multitenancy.md),
confirmada na documentação do PostgreSQL 16, e todas são verificáveis por consulta ao catálogo — não por leitura.

O que as une: **todas as formas de falhar aqui falham em silêncio**. Nenhuma dá erro, nenhuma aparece nos logs, e
todas passam nos testes que só usam um tenant. A DB-024 é a que apanha as outras seis.

### DB-018 — RLS activa e forçada em toda a tabela com `tenant_id`

**Regra:** toda a tabela que guarda dados de tenants leva `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` **e** `ALTER TABLE ... FORCE ROW LEVEL SECURITY`, na mesma migração que a cria.
**Porquê:** o `ENABLE` sozinho não sujeita o dono da tabela às políticas — a documentação diz que "table owners normally bypass row security as well". Quando as migrações e a aplicação partilham utilizador, que é o caso por omissão, a RLS fica activa e não faz absolutamente nada: as consultas devolvem tudo e o isolamento é uma ilusão.
**Como verificar:** `SELECT c.relname FROM pg_class c JOIN pg_attribute a ON a.attrelid = c.oid WHERE a.attname = 'tenant_id' AND NOT a.attisdropped AND c.relkind = 'r' AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity)` devolve vazio.
**Fonte:** [referência](../docs/postgres-multitenancy.md)
**Cursos:** 0

### DB-019 — A aplicação liga com um papel que não é dono nem tem `BYPASSRLS`

**Regra:** a aplicação liga-se com um papel dedicado que não é dono de nenhuma tabela, não é superutilizador e não tem `BYPASSRLS`. As migrações correm com o dono, por credenciais separadas e uma variável de ambiente distinta.
**Porquê:** superutilizadores e papéis com `BYPASSRLS` ignoram sempre a RLS; o dono ignora-a salvo `FORCE`. É a segunda defesa contra o mesmo erro da DB-018, e são precisas as duas porque qualquer uma sozinha falha sem sinal.
**Como verificar:** `SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = <utilizador da aplicação>` devolve `false, false`; esse papel não é `relowner` de nenhuma tabela em `pg_class`; a URL das migrações e a URL da aplicação são duas variáveis de ambiente diferentes.
**Fonte:** [referência](../docs/postgres-multitenancy.md)
**Cursos:** 0

### DB-020 — Cada política de escrita declara `USING` e `WITH CHECK`

**Regra:** cada política que permite escrita (`FOR ALL`, `FOR INSERT`, `FOR UPDATE`) declara `USING` e `WITH CHECK` explicitamente, mesmo quando a expressão é a mesma nas duas.
**Porquê:** o `USING` decide o que se lê, actualiza e apaga; o `WITH CHECK` decide o que se pode escrever. Sem `WITH CHECK`, um `INSERT` cria uma linha com o `tenant_id` de outro tenant — uma linha que quem a criou depois nem consegue ler.
**Como verificar:** `SELECT policyname FROM pg_policies WHERE cmd IN ('ALL','INSERT','UPDATE') AND with_check IS NULL` devolve vazio.
**Fonte:** [referência](../docs/postgres-multitenancy.md)
**Cursos:** 0

### DB-021 — O tenant entra por `set_config` com `is_local` a `true`, uma vez por transacção

**Regra:** o tenant da sessão é posto com `set_config('app.tenant_id', <uuid>, true)` — terceiro argumento `true` — na abertura de cada transacção, e as políticas lêem-no com `current_setting('app.tenant_id')`. Nunca com `false`, nunca no evento de ligação da pool.
**Porquê:** com `is_local` a `false` o valor sobrevive à devolução da ligação à pool, e o pedido seguinte — de outro tenant — herda-o. É a forma mais directa de entregar os dados de um cliente a outro. Com um pooler à frente do Postgres, o `true` é obrigatório e não uma preferência.
**Como verificar:** toda a ocorrência de `set_config` sobre `app.tenant_id` tem `true` no terceiro argumento; nenhuma está num handler de `connect` ou `checkout` da pool, e nenhum `SET app.tenant_id` aparece fora de uma transacção.
**Fonte:** [referência](../docs/postgres-multitenancy.md)
**Cursos:** 0

### DB-022 — Unicidade com o `tenant_id` à cabeça

**Regra:** qualquer índice ou restrição `UNIQUE` sobre dados de tenant leva `tenant_id` como primeira coluna (`UNIQUE (tenant_id, email)`); nunca a coluna de negócio sozinha.
**Porquê:** a integridade referencial passa por cima da RLS. Uma unicidade global faz duas coisas más ao mesmo tempo: impede dois tenants de usarem o mesmo email, e a mensagem de violação revela que existe uma linha noutro tenant, sem que ela alguma vez seja legível.
**Como verificar:** em `pg_indexes`, todo o índice único sobre uma tabela com `tenant_id` tem `tenant_id` como primeira coluna do `indexdef`; nas migrações, nenhuma dessas tabelas recebe `UNIQUE` de coluna única.
**Fonte:** [referência](../docs/postgres-multitenancy.md)
**Cursos:** 0

### DB-023 — Políticas sem sub-consultas

**Regra:** a expressão de uma política compara colunas da própria linha com `current_setting`; não faz `SELECT` a outra tabela para decidir a visibilidade.
**Porquê:** a documentação avisa que sub-consultas em políticas abrem condições de corrida entre transacções concorrentes, com leituras que a política pretendia impedir. Além disso, a expressão é avaliada por cada linha analisada.
**Como verificar:** em `SELECT policyname, qual, with_check FROM pg_policies`, nenhuma das duas expressões contém `SELECT`.
**Fonte:** [referência](../docs/postgres-multitenancy.md)
**Cursos:** 0

### DB-024 — Teste de isolamento com dois tenants por cada tabela nova

**Regra:** cada tabela com `tenant_id` traz um teste que, ligado com as credenciais da aplicação, grava uma linha no tenant A, muda `app.tenant_id` para B, e prova duas coisas: que a linha de A não é visível, e que um `INSERT` com o `tenant_id` de A é recusado.
**Porquê:** as seis regras acima falham todas sem dar erro — RLS sem `FORCE`, política sem `WITH CHECK`, ligação pelo dono, `is_local` a `false`, unicidade global. Os testes de um tenant só passam. Este teste é o único que as apanha, e é o que torna as outras executáveis em vez de escritas.
**Como verificar:** existe um teste por tabela com `tenant_id`; corre com o utilizador da aplicação e não com o das migrações; e falha quando se remove o `FORCE` da tabela.
**Fonte:** [referência](../docs/postgres-multitenancy.md)
**Cursos:** 0
