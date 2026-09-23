# Isolamento entre tenants no PostgreSQL — referência confirmada

Confirmado na documentação oficial do **PostgreSQL 16** a 2026-09-17.
Serve o mesmo papel que `claude-code-formatos.md` e `langchain-formatos.md`: é a referência contra a qual as notas e
as regras se escrevem, e contra a qual se marca o que um curso ensinar de outra maneira.

Fontes: [Row Security Policies](https://www.postgresql.org/docs/16/ddl-rowsecurity.html) ·
[System Administration Functions](https://www.postgresql.org/docs/16/functions-admin.html)

## O mecanismo

```sql
ALTER TABLE contas ENABLE ROW LEVEL SECURITY;
CREATE POLICY por_tenant ON contas
  USING      (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
```

- **`USING`** decide que linhas são visíveis em `SELECT`, `UPDATE` e `DELETE`.
- **`WITH CHECK`** decide que linhas podem ser escritas por `INSERT` e `UPDATE`.
- Com só `USING`, a expressão vale para os dois. **Escrever ambas é mais seguro**: sem `WITH CHECK`, um `INSERT`
  pode criar uma linha de outro tenant, que depois nem se consegue ler.
- Com RLS activa e **nenhuma** política, a omissão é negar: nenhuma linha é visível nem modificável.

## A armadilha que anula tudo

> *"Superusers and roles with the `BYPASSRLS` attribute always bypass the row security system when accessing a table.
> Table owners normally bypass row security as well"*

Se a aplicação se liga com o **dono das tabelas** — que é o caso por omissão quando as migrações e a aplicação usam
o mesmo utilizador — **a RLS não faz absolutamente nada** e ninguém dá por isso. Os testes passam, as consultas
devolvem tudo, e o isolamento é uma ilusão.

Duas defesas, e são precisas as duas:

1. **`ALTER TABLE ... FORCE ROW LEVEL SECURITY`**, que sujeita o próprio dono às políticas:
   > *"though a table owner can choose to be subject to row security with `ALTER TABLE ... FORCE ROW LEVEL SECURITY`"*
2. **Utilizador de aplicação separado do dono**, sem `BYPASSRLS` e sem ser superutilizador. As migrações correm com o
   dono; a aplicação, nunca.

## Onde vive o tenant da sessão

`set_config('app.tenant_id', '<uuid>', true)` no início de cada transacção, e `current_setting('app.tenant_id')` na
política.

O terceiro argumento é o que importa:

> *"If `is_local` is `true`, the new value will only apply during the current transaction. If you want the new value
> to apply for the rest of the current session, use `false` instead."*

**Com pool de ligações, tem de ser `true`.** Com `false`, o valor sobrevive à devolução da ligação ao pool e o pedido
seguinte — de outro tenant — herda-o. É a forma mais directa de trocar dados entre clientes. Havendo um pooler à
frente do Postgres (PgBouncer, pgcat) ou a pool do próprio cliente, isto deixa de ser preferência e passa a
obrigação.

## O que a RLS não cobre

A documentação é explícita, e cada uma destas é um canal de fuga:

- **Integridade referencial passa por cima.** Chaves estrangeiras, únicas e primárias ignoram a RLS. Uma violação de
  chave única revela que existe uma linha noutro tenant, mesmo sem a conseguir ler.
- **`TRUNCATE` e `REFERENCES` não estão sujeitos** a políticas.
- **Sub-consultas em políticas abrem condições de corrida** entre transacções concorrentes, com leituras que a
  política pretendia impedir.
- **Custo de desempenho** quando as políticas bloqueiam linhas (por exemplo `SELECT ... FOR SHARE`) em tabelas
  muito escritas.

## Particionar por tenant: porque não uma partição por tenant

Confirmado na documentação oficial a 2026-09-23, em
[Table Partitioning](https://www.postgresql.org/docs/16/ddl-partitioning.html).

O planeador aguenta **«up to a few thousand partitions fairly well»**, e só quando a poda deixa poucas de pé:
*«planning times become longer and memory consumption becomes higher when more partitions remain after the
planner performs partition pruning»*. Numa plataforma com dezenas de milhares de tenants, uma partição por
tenant passa esse número por uma ordem de grandeza.

O argumento decisivo, porém, não é o do planeamento — é o da **memória por sessão**:

> *«the server's memory consumption may grow significantly over time, especially if many sessions touch large
> numbers of partitions. That's because each partition requires its metadata to be loaded into the local memory
> of each session that touches it.»*

É o mesmo tecto que faz cair o schema-por-tenant, encontrado noutro sítio: o custo não está nos dados, está no
catálogo que cada sessão tem de carregar.

**A alternativa é o hash com módulo fixo.** O Postgres define cada partição por um módulo e um resto — *«the
hash value of the partition key divided by the specified modulus will produce the specified remainder»* —, e o
número de partições deixa de ser função do número de clientes. A chave de partição inclui o `tenant_id`, para
que a RLS e os índices continuem a poder podar.

**Os índices não se criam à mão por partição.** Um índice criado na tabela particionada *«automatically creates
a matching index on each partition, and any partitions you create or attach later will also have such an
index»* — o que vale também para um índice vectorial sobre uma coluna `pgvector`.

## O que isto implica para as regras

| Regra a escrever | Como se verifica |
|---|---|
| Toda a tabela com dono tem RLS activa **e** `FORCE` | consulta a `pg_class.relrowsecurity` e `relforcerowsecurity` |
| A aplicação liga com um utilizador que não é dono nem tem `BYPASSRLS` | consulta a `pg_roles` para o utilizador da aplicação |
| O tenant é posto com `is_local = true`, uma vez por transacção | procurar `set_config` com terceiro argumento `false` |
| Cada política tem `USING` **e** `WITH CHECK` | consulta a `pg_policies` |
| Unicidade que revele existência é por `(tenant_id, ...)` | revisão do esquema e das migrações |

Todas verificáveis por consulta ao catálogo, ou seja, por teste automático — que é o que a KEEL-000 exige de uma
regra para ela existir.
