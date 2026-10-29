# controlos.md — o `settings.json` que o keel-init escreve

Ficheiro de apoio da skill `keel-init`, lido quando se escreve o `.claude/settings.json` e os scripts de `.keel/`. Tem os blocos exactos a juntar e os cuidados de cada um. O `keel-upgrade` instala os mesmos blocos, e um teste confere que são iguais.

## O bloqueio que vai sempre

Os temas instalados trazem regras de segurança em texto — não publicar sem revisão, não apagar em massa, não tocar em segredos. Em texto, quem as cumpre é o modelo, e ninguém fica a saber quando não cumpre: num estudo de 481 CLAUDE.md públicos, só 4% a 16% das regras de segurança tinham um controlo por trás ([regras-vs-controlos](${CLAUDE_PLUGIN_ROOT}/docs/regras-vs-controlos.md)). Instalar as regras sem o controlo seria reproduzir exactamente isso. Por isso esta parte **não depende do nível de exigência** (PROC-023, PROC-035).

Copia `${CLAUDE_PLUGIN_ROOT}/skills/keel-init/guarda.mjs` para `.keel/guarda.mjs`, e junta ao `.claude/settings.json`:

```json
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Bash(git push *)",
      "PowerShell(git push *)",
      "Bash(rm -rf *)",
      "PowerShell(Remove-Item *)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|PowerShell|Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node",
            "args": ["${CLAUDE_PROJECT_DIR}/.keel/guarda.mjs"],
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

Os dois fazem trabalhos diferentes, e um não dispensa o outro:
- O **`deny`** é a primeira barreira e é imposto pelo cliente, mas vê só o texto: `Bash(git push *)` não apanha `git -C . push`, e nenhuma regra `Bash(...)` apanha um `.env` alterado pela ferramenta de edição.
- O **guarda** cobre essas variantes e sai com `exit 2`. O `matcher` inclui `Write|Edit` (D-PR08). Recusa pouco de propósito — publicar, apagar recursivamente e tocar no `.env` —, porque um guarda que recusa trabalho normal é desligado na primeira semana. O que o projecto quiser acrescentar vai para o `deny` dele.

Cuidados:
- Se o `settings.json` já tiver `permissions.deny` ou `hooks.PreToolUse`, **junta** às listas que lá estão. Não substituas nada, e não tires entradas do projecto.
- Se o projecto precisar mesmo de uma das entradas fora (por exemplo, um pipeline que faz `git push` a partir da sessão), não a tires em silêncio: pergunta, e regista a excepção no `keel.yaml` com o porquê.
- Testa antes de acabar: dá ao guarda um `git push` pelo stdin e confirma o `exit 2`.

## O hook que fecha a revisão

O `reviewer` regista cada achado em `.keel/revisao.json`, pelo `.keel/revisao.mjs`, e cada um fica **aberto** até ser fechado de uma de duas maneiras: **corrigido**, só por uma nova ronda do revisor nessa dimensão, ou **não corrigido**, com o motivo, por quem implementou. Escrever "fecha cada achado" num texto seria mais uma regra sem controlo (PROC-036, PROC-035). O controlo são duas peças:

- o guarda recusa `git commit` enquanto houver achados abertos, e recusa a edição à mão do `revisao.json`;
- o hook `Stop` não deixa a tarefa acabar enquanto houver achados abertos.

Copia `${CLAUDE_PLUGIN_ROOT}/skills/keel-init/revisao.mjs` para `.keel/revisao.mjs`, junta `.keel/revisao.json` ao `.gitignore` (é estado de trabalho, não código), e junta ao `.claude/settings.json`:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node",
            "args": ["${CLAUDE_PROJECT_DIR}/.keel/revisao.mjs", "parar"],
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

Sem `revisao.json`, ou sem achados abertos, os dois deixam passar: uma tarefa que não passou pelo revisor não fica presa. O hook nunca prende a sessão sem saída, porque quem implementou pode sempre fechar um achado como não corrigido — desde que diga porquê, e o motivo fica gravado.

## O hook que traz as lições de outros projectos

As regras trazem consigo o porquê e o como verificar; é isso que as sustenta, e não é preciso ir
buscar nada a lado nenhum para as usar.

O que vale a pena automatizar é outra coisa: pôr em contexto, ao arrancar a sessão, o que já se
aprendeu **noutros** projectos desta máquina.

### O hook

Em `.claude/settings.json`, dentro de `hooks`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          {
            "type": "command",
            "command": "node",
            "args": ["${CLAUDE_PROJECT_DIR}/.keel/licoes.mjs", "sugerir"],
            "timeout": 15,
            "statusMessage": "A ler as lições do Keel…"
          }
        ]
      }
    ]
  }
}
```

Quem clonar o repositório e abrir o Claude Code recebe as lições sem correr nada, nem sequer saber que existe. O hook sai em silêncio quando não há nada a dizer, e **nunca falha a sessão**.

Três cuidados ao escrever isto:
- Se já houver `.claude/settings.json`, **junta** a chave `SessionStart` ao que lá está. Não reescrevas o ficheiro.
- `command` é `node` com `args` — em exec form, sem shell. No Windows, um hook com `args` precisa de um executável a sério, e um `.cmd` não serve.
- `${CLAUDE_PROJECT_DIR}` é substituído nos `args`, e é por isso que o caminho funciona seja qual for a pasta de onde a sessão arrancou.

### O que ele põe em contexto

Copia `${CLAUDE_PLUGIN_ROOT}/skills/keel-lesson/licoes.mjs` para `.keel/licoes.mjs`. É o que
põe em contexto as lições — não deste projecto, de **todos** os projectos desta máquina. Um projecto
novo arranca já com o que os outros aprenderam, que é o contrário do que costuma acontecer.

O registo em si fica em `~/.keel/`, ao lado da base, e não no repositório: é estado local, muda a
cada sessão e não tem nada que produzir diffs. Quando não há lições nenhumas o hook não escreve
nada — uma sessão não deve pagar contexto para lhe dizerem que está tudo bem. O resto está na skill
`keel-lesson`.
