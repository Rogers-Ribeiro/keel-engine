# Using Keel

Keel gives a project a **contract**: a small set of rules that Claude Code loads every session, plus
a larger set it loads only when it touches the code they apply to. The rules are not opinions — each
one carries the reason, a way to check it mechanically, and the course lecture it was distilled from.

This page is for someone who just installed the plugin. It is in English; the rules and the skill
bodies are in Portuguese.

## Install

```
/plugin marketplace add Rogers-Ribeiro/keel-engine
/plugin install keel@keel-engine
```

Then **start a new session**. Plugins are loaded at startup, so a session that is already running
will not see the new commands.

## The six commands

| Command | Use it when |
|---|---|
| `/keel-init` | A project needs the contract written into it. New projects. |
| `/keel-audit` | A project already has code and you want to know what it violates, before adopting anything. |
| `/keel-design` | A process or a whole vertical needs designing before there is a spec. |
| `/keel-upgrade` | The engine moved on and the project's contract is behind. |
| `/keel-lesson` | Claude made a mistake worth remembering, or the same one twice. |
| `/keel-base` | You want to read the lecture a rule came from, or search the courses themselves. |

## Start here

**If the repository already has code**, run `/keel-audit` first, not `/keel-init`. It maps the
project, picks the rule themes that match the stack, and dispatches one reader per dimension. What
comes back is a report with, per finding, the rule ID and the `file:line` — not an opinion about
style. Decide what to adopt, then run `/keel-init`.

**If the repository is new or nearly empty**, run `/keel-init` straight away.

**If what you have is not code yet but a process** — "issue a VIP card", "onboard a client" — run
`/keel-design` before either. It is the cheapest place to find out the premise was wrong.

## What `/keel-init` writes

```
<project>/
├── CLAUDE.md                 imports the core of each chosen domain
├── .agents/
│   ├── keel.yaml             engine version, domains, themes, answers, date
│   └── nucleo-<domain>.md    one per chosen domain, always in context
├── .claude/rules/<theme>.md  the theme rules, with `paths:` in the frontmatter
├── .keel/                    cache: the knowledge base, git-ignored
└── .claude/settings.json     the SessionStart hooks
```

Two things matter about this layout, and they are the whole design:

**The core is small on purpose.** It is capped at 60 lines and only references rule IDs. It is in
context every single session, so every line costs attention on every turn.

**The theme files are not.** A Salesforce project carries 143 rules and about 17 000 words of them.
Putting that in context every session is the surest way to have none of it read — what sits in the
middle of a long context gets ignored. So they live in `.claude/rules/` with a `paths:` frontmatter,
and Claude Code loads each one **when it reads a file that matches**:

```markdown
---
paths:
  - "force-app/**/classes/**"
  - "**/*.cls"
---
```

## Domains: a project takes only what applies

There are four domains, and a project can carry more than one:

| Domain | Themes | What it covers |
|---|---|---|
| `python-agentes` | 20 | Python, architecture, clean code, tests, LLMs, agents, RAG, Docker, UX |
| `salesforce` | 8 | Platform, automation, Apex, LWC, data, sharing, integration, Agentforce |
| `mulesoft` | 2 | Mule development and integration architecture |
| `comercio-digital` | 1 | B2C Commerce (SFCC) and B2B Commerce |

A B2B Commerce store takes `salesforce` **and** `comercio-digital`, because the store is platform
configuration. A MuleSoft integration that talks to an org takes `mulesoft` **and** `salesforce`. A
pure SFCC storefront takes `comercio-digital` alone.

`/keel-init` works this out from the files it finds — `sfdx-project.json`, `mule-artifact.json`,
`cartridges/`, `pyproject.toml` — and tells you what it picked so you can correct it.

## What a rule looks like

```markdown
### APX-004 — Nunca SOQL nem DML dentro de um for loop

**Regra:** ...
**Porquê:** ...
**Como verificar:** ...
**Fonte:** [PD1 §4, aula 45](...)
**Cursos:** 3
```

`Como verificar` is what makes the audit possible: either the code violates it or it does not.
`Cursos` is how many courses taught it — `0` means it was written by hand from official
documentation, because no course covered it, and the rule says so.

## Updating

`/plugin update` updates the **engine** on your machine: the skills and the rules it ships.

It does **not** touch the contract already written into a project. That is deliberate: the contract
is versioned with your code, and an update must never change the rules of a project in production
without someone deciding it. `.agents/keel.yaml` records the engine version the contract was written
from.

**`/keel-upgrade` is how the contract catches up.** A contract that has been in use is not a copy of
the engine any more: rules get edited for the project, new ones are born there, and sections grow
prose that only makes sense locally. So the merge is **rule by rule**, keyed on the rule ID, against
three versions — the engine the contract came from, the engine now, and your files.

| Your rule | What happens |
|---|---|
| Untouched since you installed | takes the new version, silently |
| You edited it | **yours is kept**; the engine does not touch it |
| Born in this project | kept, and flagged as a candidate to promote |
| Born here and since promoted upstream | yours is kept, and **you are asked** |
| New in the engine | inserted after the rule numbered just below it |
| Gone from the engine | kept anyway, and reported |

Nothing is ever deleted, and nothing is committed — you review a `git diff`. Run it without
`--aplicar` first to see the report and write nothing.

## Where the rules come from

They are distilled from course transcripts, in layers: transcript → note per section → synthesis per
theme → rule. The synthesis is per *theme*, across courses, so where courses disagree the
disagreement is written down instead of one of them winning silently.

Two other paths exist, and both are marked `Cursos: 0`:

- **Confirmed documentation**, for things no course teaches. Postgres row-level security is the
  example — the pipeline would never produce those rules, because it only sees what courses teach.
- **Lessons from use**, via `/keel-lesson`. When Claude makes the same mistake a third time, it can
  be promoted to a rule. This is the only path that goes *upward*; everything else descends from
  courses to projects.

## Troubleshooting

**The commands do not appear.** The plugin loads at startup. Restart the session.

**A rule fires that should not, or one that should does not fire.** Check the `paths:` frontmatter of
that theme's file in `.claude/rules/`. On the platform domains the patterns are canonical; in
`python-agentes` they are conventions, and `/keel-init` adapts them to your layout — a pattern that
matches nothing is a rule that never loads, and nothing tells you.

**A rule's source link does not open.** The base repository is private. Run `/keel-base` to clone it
locally; the links are rewritten to local paths.
