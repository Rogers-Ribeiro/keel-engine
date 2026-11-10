# Keel

**Rules your coding agent actually reads.**

Keel is a Claude Code plugin that gives a software project a contract: a small set of rules that is
always in context, a larger set that loads only when it applies, and agents and commands that work
against both.

Version 0.23.2. This repository is generated from a private source; changes made here are
overwritten by the next release.

## The problem

A style guide pasted into `CLAUDE.md` works for the first few turns. As the session grows, the guide
ends up in the middle of a long context, where models pay the least attention to it — and nothing
tells you when that happens.

## How Keel works

- **A short core per domain.** At most 60 lines, always in context, made of rule IDs and the few
  rules that apply everywhere.
- **Topic rules that load on demand.** 849 rules in 36 topic files live in `.claude/rules/`.
  Each file declares a `paths:` pattern, and Claude Code loads it only when it opens a file that
  matches. The Apex rules are in context while you write Apex, and not otherwise.
- **Rules that can be checked.** Every rule states the rule, why it holds, and how to verify it
  mechanically. The last part is what makes an audit possible: the code either violates the rule or
  it does not.

## Installation

```
/plugin marketplace add Rogers-Ribeiro/keel-engine
/plugin install keel@keel-engine
```

Start a new session afterwards: plugins are loaded at startup.

For a repository that already has code, run `/keel-audit` first. It reports each violation with
the rule ID and `file:line`, and you decide what to adopt before running `/keel-init`.

## Commands

| Command | What it does |
|---|---|
| `/keel-audit` | Audit an existing repository: each violation with its rule ID and `file:line`, the architectural gaps, and what is missing to reach a stated target. |
| `/keel-design` | Design a process or a vertical before there is a spec — who does what, in what order, and what each person sees. |
| `/keel-init` | Write the contract into a project: `CLAUDE.md`, the cores of the chosen domains, the topic rules with their `paths:`, and `keel.yaml`. |
| `/keel-lesson` | Record a mistake when it happens; when the same one recurs, propose a rule that applies to every project. |
| `/keel-optimize` | Measure what each session spends on context, then fix what the measurement points at, one change at a time. |
| `/keel-upgrade` | Bring a project's contract to a new engine version without losing the rules that were edited or written there. |

## Agents

| Agent | Role |
|---|---|
| `architect` | Designs modules, boundaries, layers and agent graphs before anything is implemented. |
| `orchestrator` | Runs as the main session in projects that work with several subagents: dispatches steps, sends them to review, integrates. |
| `refuter` | Runs after the reviewer on critical changes and tries to break each verdict it passed, preferably with a failing test. |
| `reviewer` | Reviews the diff against the spec, the rules and security. It has no write tools. |
| `troubleshoot` | Diagnoses a broken production or UAT environment with read-only access, and hands the fix over as a command for a person to run. |

## Domains

A project adopts only the domains that apply to it, and can combine several — a B2B storefront takes
digital commerce **and** Salesforce, because the store is platform configuration.

| Domain | Covers |
|---|---|
| `automacao-de-testes` | End-to-end test automation |
| `comercio-digital` | Digital commerce storefronts |
| `javascript` | JavaScript and TypeScript |
| `mobile-react-native` | React Native mobile apps |
| `mulesoft` | MuleSoft integrations |
| `python-agentes` | Python services and LLM agents |
| `salesforce` | Salesforce (Apex, LWC, metadata) |
| `web-react` | React web applications |

## Anatomy of a rule

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

| Field | Meaning |
|---|---|
| `ID — title` | A stable identifier, cited by the core, the reviewer and the audit. |
| **Regra** | The rule itself. |
| **Porquê** | Why it holds — the failure it prevents. |
| **Como verificar** | How to check it mechanically, usually a search or a command. |
| **Fonte** | Where present, a link to the official documentation the rule is based on. |
| **Cursos** | How many independent sources confirm the rule. `0` means it was written from official documentation alone. |

## Language

This README and the [user guide](docs/using-keel.md) are in English. The rules, the agents and the
skill instructions are in Portuguese. Rule IDs, code and verification commands read the same in any
language, and audit findings are reported by rule ID and location.

## Repository layout

| Path | Contents |
|---|---|
| `agents/` | Agent definitions |
| `regras/` | Domain cores and topic rules |
| `skills/` | The commands above |
| `docs/` | The user guide, reference notes cited by the rules, and recorded decisions |
| `caminhos.json` | The `paths:` patterns `/keel-init` writes for each topic |

## Licence

See [LICENSE](LICENSE).
