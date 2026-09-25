# Formatos do Claude Code (confirmados a 2026-09-16)

Referência para escrever os agentes, as skills, as rules, os hooks e as permissões da base e do modelo de projecto. Confirmada na documentação oficial, e não nas aulas, várias das quais estão desactualizadas:

- [sub-agents](https://code.claude.com/docs/en/sub-agents)
- [skills](https://code.claude.com/docs/en/skills)
- [memory](https://code.claude.com/docs/en/memory)
- [hooks](https://code.claude.com/docs/en/hooks)
- [permissions](https://code.claude.com/docs/en/permissions)

**Versões nesta máquina.** A extensão do VS Code e o `claude` do terminal (npm, usado pela destilação nocturna) estão ambos na 2.1.273; o do terminal foi actualizado a 2026-09-16, a partir da 2.1.138. Funcionalidades marcadas com "≥ 2.1.x" exigem essa versão ou superior.

## Subagentes (`.claude/agents/<nome>.md`)

- **Precedência:** managed > `--agents` > `.claude/agents/` (projecto, vai para o git) > `~/.claude/agents/` > plugin.
- **Frontmatter:**

  | Campo | Notas |
  |---|---|
  | `name` | Obrigatório. Minúsculas e hífenes. |
  | `description` | Obrigatório. Diz quando delegar; "use proactively" incentiva a delegação automática. A soma das descrições deve ficar abaixo de 15 mil tokens. |
  | `tools` | Lista branca. Aceita nomes exactos, incluindo MCP (`mcp__servidor__ferramenta`), ou o servidor inteiro (`mcp__servidor`, `mcp__servidor__*`). `Agent(a, b)` limita os subagentes que este pode lançar. |
  | `disallowedTools` | Lista negra, aplicada antes de `tools`. |
  | `model` | `sonnet`, `opus`, `haiku`, `fable`, um ID completo ou `inherit`. |
  | `permissionMode` | É ignorado se a sessão principal estiver em `acceptEdits`, `auto` ou `bypassPermissions`. |
  | `skills` | Skills pré-carregadas: o conteúdo inteiro entra no contexto ao arrancar. Não funciona com skills que tenham `disable-model-invocation: true`. |
  | `mcpServers` | Só é preciso para servidores que a sessão principal não tem. O `cursos` tem âmbito de utilizador, por isso não precisa. |
  | `hooks` | Só `PreToolUse`, `PostToolUse` e `Stop`, activos enquanto o agente corre. Exigem confiança na pasta e não correm em `-p`. |
  | `memory` | `user`, `project` (`.claude/agent-memory/`) ou `local`: memória própria do agente entre sessões. |
  | `maxTurns` | ≥ 2.1.246. |
  | `omitClaudeMd` | ≥ 2.1.271. |
  | `effort` | `low` a `max`. |
  | `isolation` | `worktree`: o agente trabalha numa cópia isolada. |
  | `background` | |
  | `color` | |
  | `initialPrompt` | |

- **O que o subagente recebe ao arrancar:**
  - o corpo do ficheiro, como system prompt;
  - a mensagem de delegação;
  - **todos os CLAUDE.md e `.claude/rules/`** que a sessão principal carrega;
  - o git status;
  - as skills pré-carregadas.

  Não vê a conversa nem os ficheiros que a sessão principal já leu.
- **Subagentes podem lançar subagentes**, até 3 níveis por omissão (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`) e até 20 em simultâneo.
- **Invocação:** automática, pela `description`, ou garantida com `@agent-<nome>`. `claude --agent <nome>` usa o agente como sessão principal.

## Skills (`.claude/skills/<nome>/SKILL.md`)

- **Locais e comando:** pessoal (`~/.claude/skills/`), projecto, pastas aninhadas (carregam quando se trabalha lá), `--add-dir` e plugins. O nome da pasta é o comando `/nome`. As pastas por link simbólico são suportadas; as *junctions* do Windows não foram testadas.
- **Os comandos (`.claude/commands/`) foram fundidos nas skills.** Continuam a funcionar, mas o que é novo vai para skills.
- **Frontmatter (tudo opcional):**
  - `description` e `when_to_use`: juntos têm no máximo 1 536 caracteres na listagem.
  - `disable-model-invocation: true`: só o utilizador a invoca, e deixa de poder ser pré-carregada.
  - `user-invocable: false`: só o Claude a invoca; serve para conhecimento de fundo.
  - `allowed-tools` e `disallowed-tools`: valem só no turno em que a skill é invocada.
  - `model` e `effort`.
  - `context: fork` com `agent: <tipo>`: a skill corre num subagente.
  - `paths`: globs que limitam a invocação automática.
  - `hooks` e `shell` (`bash` ou `powershell`).
  - `arguments` e `argument-hint`.
- **Corpo:**
  - substituições `$ARGUMENTS`, `$0`, `$nome`, `${CLAUDE_SKILL_DIR}` e `${CLAUDE_PROJECT_DIR}`;
  - `` !`comando` `` injecta a saída antes de o Claude ler, e um código de saída diferente de 0 aborta a skill;
  - o `SKILL.md` deve ter menos de 500 linhas; os ficheiros de apoio só são lidos quando referenciados.
- **O conteúdo invocado fica na conversa.** Depois de uma compactação, só são repostos os primeiros 5 mil tokens de cada skill, até 25 mil no total.

## CLAUDE.md e `.claude/rules/`

- **Onde e como carregam:**
  - `./CLAUDE.md` ou `./.claude/CLAUDE.md` (projecto), `~/.claude/CLAUDE.md` (utilizador) e `CLAUDE.local.md` (pessoal, fora do git).
  - As pastas acima do directório de trabalho carregam no arranque; as de baixo, quando se lê lá um ficheiro.
  - Deve ter **menos de 200 linhas**. Os comentários HTML são removidos antes de entrar no contexto.
  - É contexto, não imposição: o que tem de acontecer sempre vai para hooks ou permissões.
- **`@caminho` importa ficheiros:**
  - relativo ao ficheiro que importa, até 4 níveis;
  - não conta dentro de código entre crases;
  - **um import para fora do projecto pede aprovação** na primeira vez;
  - os ficheiros importados carregam todos no arranque.
- **`.claude/rules/*.md`** (recursivo):
  - **sem** `paths`, carrega sempre, como o CLAUDE.md;
  - **com** `paths: ["src/**/*.py"]`, carrega quando o Claude lê um ficheiro que corresponde;
  - também entra nos subagentes;
  - `~/.claude/rules/` vale para todos os projectos;
  - um link simbólico para fora do projecto exige a mesma aprovação dos imports.
- **`/init`** gera um CLAUDE.md. Com `CLAUDE_CODE_NEW_INIT=1`, também propõe skills e hooks.
- **Compactação:** o CLAUDE.md da raiz é relido do disco depois de uma compactação.

## Hooks (`settings.json` → `hooks`)

- **Forma:** `{"PreToolUse": [{"matcher": "Bash|PowerShell", "hooks": [{"type": "command", "command": "...", "args": [...], "timeout": 60, "if": "Bash(rm *)"}]}]}`.
  - Tipos: `command`, `http`, `mcp_tool`, `prompt` e `agent`.
- **Windows:**
  - Onde a ferramenta PowerShell está activa, é a shell principal. **Hooks sobre comandos usam `Bash|PowerShell`**; um hook só para `Bash` pode nunca disparar.
  - Com `args`, o hook corre sem shell e o `command` tem de ser um `.exe` verdadeiro (`node`, `python`, `uv`), não um `.cmd`.
  - Sem `args`, corre no Git Bash, ou no PowerShell se o Git Bash não existir.
  - `${CLAUDE_PROJECT_DIR}` é substituído nos `args`.
- **Entrada (stdin, JSON):**
  - campos comuns (`cwd`, `hook_event_name`, `agent_type`, …) mais `tool_name`, `tool_input` e `tool_use_id`;
  - Bash e PowerShell: `tool_input.command`;
  - Write: `file_path` e `content`;
  - Edit: `file_path`, `old_string`, `new_string` e `replace_all`;
  - `file_path` é sempre absoluto.
- **Códigos de saída:**
  - `0`: sucesso; o stdout é lido como JSON se começar por `{` e acabar em `}`.
  - `2`: bloqueia (em `PreToolUse` impede a chamada) e o stderr vai para o Claude. Em `PostToolUse` não bloqueia, porque a ferramenta já correu, mas o Claude vê o stderr.
  - Outro código, sem JSON válido: erro não bloqueante e **a acção continua**. Para impor uma política, usa-se `exit 2`.
- **JSON do PreToolUse:** `{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "allow|deny|ask|defer", "permissionDecisionReason": "...", "updatedInput": {...}, "additionalContext": "..."}}`.
  - Os campos `decision` e `reason` no nível de topo estão obsoletos neste evento.
- **JSON do PostToolUse:** `decision: "block"` e `reason` no nível de topo; o motivo aparece junto ao resultado. `hookSpecificOutput.additionalContext` acrescenta contexto e `updatedToolOutput` substitui a saída.
- **Timeout:** um hook que expira no `PreToolUse` **não bloqueia**; a chamada segue o fluxo normal de permissões.

## Permissões (`settings.json` → `permissions`)

- **Ordem:** `deny` → `ask` → `allow`, e ganha a primeira que corresponder. Um `allow` não abre excepções num `deny`. Um `deny` com o nome simples da ferramenta (`Bash`) retira-a por completo.
- **Bash e PowerShell:**
  - `Bash(git push *)`, com o `*` depois do subcomando;
  - os comandos compostos (`&&`, `|`, `;`) são avaliados por partes;
  - `PowerShell(Remove-Item *)` também apanha os aliases;
  - **as regras vêem só o texto**: `Bash(git push *)` não apanha `git -C . push`. O que tem de ser à prova disso vai para um hook PreToolUse ou para o sandbox.
- **Read e Edit (sintaxe gitignore):**
  - `//` é absoluto, `~/` é a pasta do utilizador, `/` é relativo à origem do settings e `./` é relativo ao directório actual. No Windows, `C:\x` passa a `/c/x`.
  - `Edit(...)` cobre todas as ferramentas de edição; regras `Write(path)` são ignoradas.
  - `Read(.env)` bloqueia também Edit e Write nesse caminho, além de `cat`, `head`, redirecções e afins no Bash. Não bloqueia um script Python que abra o ficheiro; para isso é preciso o sandbox.
- **MCP e subagentes:** `mcp__servidor`, `mcp__servidor__*` e `mcp__servidor__ferramenta`; `Agent(Nome)` para subagentes.
- **Modos:**
  - `default` (Manual), `acceptEdits`, `plan`, `auto` e `bypassPermissions`;
  - `dontAsk` recusa tudo o que pediria confirmação, e é útil em `-p`;
  - `disableBypassPermissionsMode: "disable"` impede o `bypassPermissions`.
- **Comandos só de leitura** (por exemplo `echo` e `ls`) correm sem pedir. Em `-p`, para tirar ferramentas por completo, usa-se `--tools "Read,Write"`.

## Consequências para o desenho

1. **Regras sempre presentes em cada papel.** Cada tema de regras (`regras-arquitetura`, `regras-codigo-limpo`, …) é empacotado como skill de conhecimento, com `user-invocable: false`, e **pré-carregado** no frontmatter dos agentes que o usam. Por exemplo, o `arquiteto` e o `revisor` levam arquitectura e código limpo. Assim há uma só fonte para vários agentes e as regras entram sempre ao arrancar. O `` na lista `tools` fica para o detalhe.
2. **O núcleo vai para `.claude/rules/nucleo.md`, sem `paths`.** Carrega sempre, na sessão principal e em todos os subagentes, e por isso tem de continuar curto (no máximo 60 linhas). As regras de código Python vão para `.claude/rules/python.md` com `paths: ["**/*.py"]`.
3. **Nada de `@C:/.../formacao-dev/...` no projecto.** Um import para fora do projecto pede aprovação e prende o projecto a esta máquina. O `instalar.mjs` **copia** as regras, as skills e os agentes para o repositório novo, que os versiona; para actualizar, corre-se outra vez.
4. **A frase do desenho "um subagente não lança subagentes" está desactualizada.** A orquestração continua na sessão principal (skill `executar-spec`), porque é lá que o utilizador acompanha, mas por escolha e não por limitação.
5. **Hooks do modelo de projecto:**
   - guarda em `PreToolUse` com `Bash|PowerShell`, a sair com `exit 2`;
   - formatação em `PostToolUse` com `Write|Edit`, a correr `ruff format` e `ruff check --fix`, e a sair com `exit 2` e os erros que sobrarem, para o Claude os corrigir;
   - ambos em forma exec (`args`), com um executável verdadeiro.
6. **Permissões do modelo de projecto:**
   - `deny`: `Read(./.env)`, `Read(./.env.*)`, `Bash(git push *)`, `PowerShell(git push *)`, `Bash(rm -rf *)` e `PowerShell(Remove-Item *)`;
   - o hook de guarda cobre as variantes que as regras não apanham.
7. **Opcionais a avaliar:**
   - `memory: project` no `revisor` e no `arquiteto`, para aprenderem com as revisões;
   - `isolation: worktree` para implementadores em paralelo;
   - `effort` por papel.
