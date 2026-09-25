# Keel

**Rules your coding agent actually reads.**

Claude Code will happily follow a style guide you paste into `CLAUDE.md` — for about three turns.
Then the context grows, the guide sinks into the middle of it, and it stops mattering. Anything in
the middle of a long context gets ignored, and nothing tells you when that happens.

Keel splits the difference. Each domain has a **core** of at most 60 lines that is always in
context, and it holds nothing but rule IDs. The rules themselves — 35 files of them — sit in
`.claude/rules/` with a `paths:` frontmatter, and Claude Code loads each one **only when it opens a
file that rule applies to**. You pay attention for the Apex rules when you are writing Apex, and not
otherwise.

Every rule carries three things beyond the rule itself: **why** it holds, **how to check it
mechanically**, and how many independent sources confirmed it. The middle one is what makes
`/keel-audit` possible — either the code violates the rule or it does not, and that is not a matter
of taste.

Version 0.13.0. This repository is **generated**; it is not edited here.

## Install

```
/plugin marketplace add Rogers-Ribeiro/keel-engine
/plugin install keel@keel-engine
```

Then start a new session — plugins load at startup.

**If the repository already has code**, run `/keel-audit` before anything else. It reports what the
code violates, with the rule ID and the `file:line`, and you decide what to adopt. Only then
`/keel-init`.

## Commands

- `/keel-audit` — auditar código que já existe
- `/keel-design` — desenhar antes de haver spec
- `/keel-init` — escrever o contrato num projecto
- `/keel-lesson` — que o mesmo erro não se aprenda duas vezes
- `/keel-upgrade` — actualizar o contrato sem perder o que lá está

Full guide: [docs/using-keel.md](docs/using-keel.md).

## What a rule looks like

```markdown
### APX-004 — Nunca SOQL nem DML dentro de um for loop

**Regra:** dentro de um ciclo `for`, acumula os registos numa lista; a query e a
instrução DML correm uma só vez, fora do ciclo.
**Porquê:** cada iteração consome uma query do orçamento da transacção — 100 queries
e 150 instruções — e com um lote grande a execução falha antes de terminar.
**Como verificar:** procura `[SELECT`, `insert`, `update`, `delete` e `upsert` entre
as chavetas de um `for`; qualquer ocorrência é um defeito.
**Cursos:** 1
```

`Cursos: 0` means the rule was written by hand from confirmed official documentation, because the
distillation would never produce it — Postgres row-level security is the example. Those rules carry
a **Fonte** line that links to the documentation and opens.

## Domains

A project takes only the domains that apply to it, and can take several: `comercio-digital`, `javascript`, `mobile-react-native`, `mulesoft`, `python-agentes`, `salesforce`, `web-react`.
A B2B Commerce store takes commerce **and** Salesforce, because the store is platform configuration.
A pure integration project takes MuleSoft alone.

## A note on language

The README and [the guide](docs/using-keel.md) are in English. **The rules and the skill bodies are
in Portuguese** — that is where they were written, and translating 600 rules is not something to do
carelessly. The rule IDs, the code, and the `Como verificar` commands are language-neutral, and the
audit reports rule IDs with file and line.

## What travels here

- `agents/` — 2 file(s)
- `regras/` — 42 file(s)
- `docs/` — 19 file(s)
- `caminhos.json/` — 1 file(s)
- `skills/` — 8 file(s)

## Como ler uma regra

```markdown
### APX-004 — Nunca SOQL nem DML dentro de um for loop

**Regra:** ...
**Porquê:** ...
**Como verificar:** ...
**Cursos:** 3
```

O **Como verificar** é o que torna a auditoria possível: ou o código viola a regra ou não viola.
O número no fim diz por quantas fontes independentes a regra foi confirmada — `0` significa que
foi escrita à mão a partir de documentação oficial, e aí a **Fonte** aponta para ela e abre.
