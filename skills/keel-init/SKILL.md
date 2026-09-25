---
name: keel-init
description: Use quando um projecto novo precisa de arrancar com as regras do Keel — escreve o contrato (CLAUDE.md, .agents/ com os núcleos dos domínios e os temas escolhidos, keel.yaml) dentro do repositório. Use também quando o utilizador disser "instala o keel aqui", "inicia o projecto com as regras" ou "/keel-init".
---

# keel-init — escrever o contrato num projecto

Escreves, **dentro do repositório do projecto**, as regras que ele passa a seguir. Os agentes (`arquiteto`, `revisor`) já vêm do plugin e não se copiam.

A distinção que manda em tudo o que se segue: o **engine** vive na máquina e actualiza-se com `plugin update`; o **contrato** vive no repositório, versiona com o código e **nunca é sobrescrito por uma actualização**. Sem o contrato no repositório, o agente não o lê e a CI não o verifica.

## Antes de escrever

1. Confirma que estás na raiz do repositório do projecto (há `.git`), e **não** dentro do keel nem da base de conhecimento.
2. Se já existir `.agents/keel.yaml`, o projecto já foi iniciado: não reescrevas nada. Diz o que está instalado e pára.
3. Se o repositório tiver código a sério e nenhum contrato, este não é o caminho certo: o `keel-init` é para projectos novos. Adoptar um repositório existente pede um levantamento primeiro — usa a skill `keel-audit`, que diz o que lá está medido contra as regras, e volta aqui depois de haver decisão.

## Os domínios, antes das perguntas

A base serve **quatro domínios**, e cada um tem o seu núcleo de regras. Um projecto carrega **os que lhe servem** — muitas vezes um, às vezes dois. Antes de perguntar seja o que for, olha para o repositório:

| Encontras | Domínio |
|---|---|
| `sfdx-project.json`, `force-app/`, `manifest/package.xml`, classes `.cls` ou `.trigger`, pastas `lwc/` ou `aura/` | `salesforce` |
| `mule-artifact.json`, POMs com `mule-maven-plugin`, ficheiros `.xml` de fluxos Mule, `.dwl` | `mulesoft` |
| `cartridges/`, `dw.json`, `hooks.json`, ou uma loja B2B configurada na org | `comercio-digital` |
| `pyproject.toml`, `requirements*.txt`, `langgraph.json`, código Python | `python-agentes` |

Podem valer dois ao mesmo tempo, e isso é normal: uma loja B2B é `comercio-digital` **e** `salesforce`, porque a loja é configuração de plataforma; uma integração que fala com uma org é `mulesoft` **e** `salesforce`. Uma loja de B2C Commerce, essa, é `comercio-digital` sozinha — o SFCC é outra plataforma.

Diz quais escolheste e porquê, numa linha por domínio, e deixa corrigir. Num repositório vazio, pergunta. A escolha manda no núcleo que copias e nos temas que propões, e fica registada no `keel.yaml`.

## As perguntas — no máximo quatro

Um gerador que interroga vinte vezes é usado uma vez. Pergunta só isto, e propõe um valor por omissão para cada:

1. **Nome do projecto e uma frase sobre o que faz.**
2. **Temas de regras** que se aplicam. A proposta sai dos domínios escolhidos (secção acima), e a lista completa de cada um está em `${CLAUDE_PLUGIN_ROOT}/regras/`:
   - **`python-agentes`:** `python`, `codigo-limpo`, `arquitetura`, `testes`, `seguranca`, `agentes-ia`.
   - **`salesforce`:** `salesforce-plataforma`, `salesforce-apex`, `salesforce-dados`, `salesforce-seguranca` — e `salesforce-lwc` se houver componentes, `salesforce-integracao` se houver sistemas externos, `salesforce-automacao` se houver flows, `salesforce-ia` se houver Agentforce.
   - **`mulesoft`:** `mulesoft-desenvolvimento`, e `mulesoft-arquitetura` se o projecto desenha APIs e não só as implementa.
   - **`comercio-digital`:** `comercio-digital`.

   Mostra a lista dos domínios escolhidos e deixa acrescentar ou tirar.
3. **O projecto tem fronteiras internas** (módulos que não se importam uns aos outros)? Decide se entram as regras de arquitectura modular.
4. **Nível de exigência:** só revisão humana, ou também verificações automáticas (lint, testes, hooks) desde o início.

## O que escreves

```
<projecto>/
├── CLAUDE.md              importa cada @.agents/nucleo-<dominio>.md e diz como trabalhar aqui
├── .agents/
│   ├── keel.yaml          versão do engine, domínios, temas escolhidos, respostas e data
│   └── nucleo-<dominio>.md  um por domínio escolhido (o do python-agentes é nucleo.md), importados pelo CLAUDE.md
├── .claude/rules/<tema>.md  as regras dos temas escolhidos, com `paths:` no frontmatter
├── .keel/licoes.mjs         põe em contexto o que já se aprendeu noutros projectos desta máquina
└── .claude/settings.json  os hooks SessionStart, mais permissões e hooks do nível escolhido
```

Regras de escrita:
- **Copia o núcleo de cada domínio escolhido** para `.agents/`, e os ficheiros de tema do plugin (`${CLAUDE_PLUGIN_ROOT}/regras/`) para **`.claude/rules/`**. O núcleo do `python-agentes` é o `nucleo.md`; o de qualquer outro domínio é o `nucleo-<dominio>.md`. Cada um fica em `.agents/` com o seu nome, e o `CLAUDE.md` importa-os um por linha — não os juntes num ficheiro só, porque depois ninguém sabe de onde veio cada linha nem o que actualizar. Copiam-se só os núcleos dos domínios escolhidos: um projecto de MuleSoft não leva o de Salesforce nem o de Python. Não uses imports por caminho absoluto: partem noutra máquina e não versionam com o código.
- Se o projecto já tiver `CLAUDE.md`, **acrescenta** a secção no fim e não toques no resto.
- O `keel.yaml` regista a versão do engine, os **domínios** e as escolhas, para se saber depois o que foi gerado e com que base. Os domínios ficam lá porque são o que decide quais núcleos valem, e sem eles ninguém sabe, meses depois, porque é que este projecto tem regras de Apex e o do lado tem regras de LangGraph.

## Os `paths`: a regra chega sozinha, quando morde

O núcleo entra sempre em contexto, e é pequeno de propósito. Os ficheiros de tema são o contrário — num projecto de Salesforce são 143 regras e 17 mil palavras, e pô-las sempre em contexto é a maneira mais segura de nenhuma ser lida: o que fica no meio de um contexto longo é ignorado.

Por isso vão para `.claude/rules/`, com `paths:` no frontmatter. O Claude Code carrega a regra **quando lê um ficheiro que case com o padrão**, e não a cada sessão:

```markdown
---
paths:
  - "force-app/**/classes/**"
  - "force-app/**/triggers/**"
  - "**/*.cls"
---

# Salesforce: Apex
...
```

**Os padrões saem do `${CLAUDE_PLUGIN_ROOT}/caminhos.json`**, um por tema, e não se inventam projecto a projecto — é essa a diferença entre uma convenção e cada um a fazer o seu.

**Mas há dois tipos de padrão, e tratam-se de maneira diferente:**

- **Domínios de plataforma** (`salesforce`, `mulesoft`, `comercio-digital`): o caminho é **canónico**. Apex vive em `force-app/**/classes/**` em qualquer org, porque é a plataforma que manda. Copia-se tal e qual.
- **Domínio `python-agentes`**: o caminho é **convenção**, e varia. Onde vivem os modelos, os workers ou os prompts é decisão de cada projecto. Aqui os padrões da base são um ponto de partida: **confirma cada um contra a estrutura real** que mapeaste, e corrige o que não bater. Um padrão que não casa com nada é uma regra que nunca carrega, e ninguém dá por isso.

Diz ao utilizador, numa linha, quais é que ajustaste e porquê.

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

## O último passo não é um detalhe

Antes de dares o trabalho por feito, **corre o que acabaste de instalar**: os testes, o lint, os hooks. O projecto tem de ficar a passar nas verificações que lhe puseste. Um gerador que entrega uma CI vermelha no primeiro commit destrói a própria credibilidade, e a pessoa desliga tudo antes de perceber o que aquilo era.

## Quando acabas

Diz, em cinco linhas: os domínios escolhidos, os ficheiros escritos, os temas incluídos e quantas regras trazem, o que ficou por verificar automaticamente, e o comando para confirmar (`/agents` e `/memory`).
