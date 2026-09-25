# Keel — engine

Versão 0.12.0. **Gerado** a partir da base de conhecimento por `ferramentas/engine.mjs`; não se edita aqui.

## Instalar

```
/plugin marketplace add Rogers-Ribeiro/keel-engine
/plugin install keel@keel-engine
```

## Comecar

Le [docs/using-keel.md](docs/using-keel.md) — o que cada comando faz, por onde se comeca
conforme o projecto ja tenha codigo ou nao, e o que o /keel-init escreve.

## As skills

- `/keel-audit` — auditar código que já existe
- `/keel-design` — desenhar antes de haver spec
- `/keel-init` — escrever o contrato num projecto
- `/keel-lesson` — que o mesmo erro não se aprenda duas vezes
- `/keel-upgrade` — actualizar o contrato sem perder o que lá está

## O que traz

- `agents/` — 2 ficheiro(s)
- `regras/` — 35 ficheiro(s)
- `docs/` — 13 ficheiro(s)
- `caminhos.json/` — 1 ficheiro(s)
- `skills/` — 8 ficheiro(s)

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
