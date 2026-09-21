---
name: keel-init
description: Use quando um projecto novo precisa de arrancar com as regras do Keel — escreve o contrato (CLAUDE.md, .agents/ com o núcleo e os temas escolhidos, keel.yaml) dentro do repositório. Use também quando o utilizador disser "instala o keel aqui", "inicia o projecto com as regras" ou "/keel-init".
---

# keel-init — escrever o contrato num projecto

Escreves, **dentro do repositório do projecto**, as regras que ele passa a seguir. Os agentes (`arquiteto`, `revisor`) já vêm do plugin e não se copiam.

A distinção que manda em tudo o que se segue: o **engine** vive na máquina e actualiza-se com `plugin update`; o **contrato** vive no repositório, versiona com o código e **nunca é sobrescrito por uma actualização**. Sem o contrato no repositório, o agente não o lê e a CI não o verifica.

## Antes de escrever

1. Confirma que estás na raiz do repositório do projecto (há `.git`), e **não** dentro do keel nem da base de conhecimento.
2. Se já existir `.agents/keel.yaml`, o projecto já foi iniciado: não reescrevas nada. Diz o que está instalado e pára.
3. Se o repositório tiver código a sério e nenhum contrato, este não é o caminho certo: o `keel-init` é para projectos novos. Adoptar um repositório existente pede um levantamento primeiro — usa a skill `keel-levantamento`, que diz o que lá está medido contra as regras, e volta aqui depois de haver decisão.

## O domínio, antes das perguntas

A base serve **dois domínios**, e cada um tem o seu núcleo de regras. Antes de perguntar seja o que for, olha para o repositório e decide qual é:

- `sfdx-project.json`, `force-app/`, `manifest/package.xml`, classes `.cls`, `.trigger`, pastas `lwc/` ou `aura/`, `mule-artifact.json`, POMs com `mule-maven-plugin`, `cartridges/` ou `dw.json` → **`salesforce`**.
- `pyproject.toml`, `requirements*.txt`, `langgraph.json`, código Python → **`python-agentes`**.

Diz qual escolheste e porquê, numa linha, e deixa corrigir. Num repositório vazio, pergunta. A escolha manda no núcleo que copias e nos temas que propões, e fica registada no `keel.yaml` — é o que distingue um projecto que recebe regras de Apex de um que recebe regras de LangGraph.

## As perguntas — no máximo quatro

Um gerador que interroga vinte vezes é usado uma vez. Pergunta só isto, e propõe um valor por omissão para cada:

1. **Nome do projecto e uma frase sobre o que faz.**
2. **Temas de regras** que se aplicam. A proposta sai do domínio (ponto 0 abaixo), e a lista completa de cada um está em `${CLAUDE_PLUGIN_ROOT}/regras/`:
   - **Python com agentes:** `python`, `codigo-limpo`, `arquitetura`, `testes`, `seguranca`, `agentes-ia`.
   - **Salesforce, MuleSoft ou comércio digital:** `salesforce-plataforma`, `salesforce-apex`, `salesforce-dados`, `salesforce-seguranca` — e `salesforce-lwc` se houver componentes, `salesforce-integracao` se houver sistemas externos, `mulesoft-desenvolvimento` e `mulesoft-arquitetura` se houver Mule, `comercio-digital` se houver loja, `salesforce-ia` se houver Agentforce.

   Mostra a lista do domínio e deixa acrescentar ou tirar. Um projecto que seja mesmo os dois leva temas dos dois, mas isso é raro: o normal é ser de um.
3. **O projecto tem fronteiras internas** (módulos que não se importam uns aos outros)? Decide se entram as regras de arquitectura modular.
4. **Nível de exigência:** só revisão humana, ou também verificações automáticas (lint, testes, hooks) desde o início.

## O que escreves

```
<projecto>/
├── CLAUDE.md              importa @.agents/nucleo.md e diz como trabalhar aqui
├── .agents/
│   ├── keel.yaml          versão do engine, domínio, temas escolhidos, respostas e data
│   ├── nucleo.md          as regras que valem em qualquer tarefa (o núcleo do domínio)
│   └── regras/<tema>.md   só os temas escolhidos
├── .keel/retrieve.mjs     traz a base de conhecimento (o resto de `.keel/` é cache, fora do git)
├── .keel/licoes.mjs       põe em contexto o que já se aprendeu noutros projectos desta máquina
└── .claude/settings.json  os hooks SessionStart, mais permissões e hooks do nível escolhido
```

Regras de escrita:
- **Copia** o núcleo do domínio e os `regras/<tema>.md` do plugin (`${CLAUDE_PLUGIN_ROOT}/regras/`) para dentro do projecto. O núcleo é o `nucleo.md` no domínio `python-agentes` e o `nucleo-salesforce.md` no domínio `salesforce`, e **em qualquer dos casos fica gravado como `.agents/nucleo.md`**, para que o import do `CLAUDE.md` seja sempre o mesmo. Copia-se um, nunca os dois: um projecto de Salesforce não leva as regras de Python nem o contrário. Não uses imports por caminho absoluto: partem noutra máquina e não versionam com o código.
- Se o projecto já tiver `CLAUDE.md`, **acrescenta** a secção no fim e não toques no resto.
- O `keel.yaml` regista a versão do engine, o **domínio** e as escolhas, para se saber depois o que foi gerado e com que base. O domínio fica lá porque é o que decide qual dos núcleos vale, e sem ele ninguém sabe, meses depois, porque é que este projecto tem regras de Apex e o do lado tem regras de LangGraph.

## As fontes das regras

Cada regra traz a aula que a originou. No plugin essas fontes são URLs do repositório da base, que é privado: abrem no browser, mas obrigam a autenticar e não servem para o agente ler.

Por isso copias `${CLAUDE_PLUGIN_ROOT}/skills/keel-init/retrieve.mjs` para `.keel/retrieve.mjs`, **registas o hook** que o corre sozinho, e corre-lo uma vez agora:

```
node .keel/retrieve.mjs
```

O que ele faz, por esta ordem: clona a base sem histórico para `~/.keel/base` (umas dezenas de MB, uma vez por máquina, partilhada por todos os projectos), liga-a a este projecto com uma junction em `.keel/base`, acrescenta `.keel/` ao `.gitignore`, e reescreve as fontes do contrato para caminhos locais. A partir daí, abrir a fonte de uma regra é abrir um ficheiro.

### O hook, que é o que torna isto automático

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
            "args": ["${CLAUDE_PROJECT_DIR}/.keel/retrieve.mjs", "--auto"],
            "timeout": 300,
            "statusMessage": "A trazer a base de conhecimento do Keel…"
          },
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

Quem clonar o repositório e abrir o Claude Code recebe a base sem correr nada, nem sequer saber que existe. O `--auto` sai em silêncio e em milissegundos quando já cá está, e **nunca falha a sessão**: sem acesso ao repositório privado, explica-se e segue.

Três cuidados ao escrever isto:
- Se já houver `.claude/settings.json`, **junta** a chave `SessionStart` ao que lá está. Não reescrevas o ficheiro.
- `command` é `node` com `args` — em exec form, sem shell. No Windows, um hook com `args` precisa de um executável a sério, e um `.cmd` não serve.
- `${CLAUDE_PROJECT_DIR}` é substituído nos `args`, e é por isso que o caminho funciona seja qual for a pasta de onde a sessão arrancou.

### O segundo hook: o que já se aprendeu noutros projectos

Copia também `${CLAUDE_PLUGIN_ROOT}/skills/keel-licao/licoes.mjs` para `.keel/licoes.mjs`. É o que
põe em contexto as lições — não deste projecto, de **todos** os projectos desta máquina. Um projecto
novo arranca já com o que os outros aprenderam, que é o contrário do que costuma acontecer.

O registo em si fica em `~/.keel/`, ao lado da base, e não no repositório: é estado local, muda a
cada sessão e não tem nada que produzir diffs. Quando não há lições nenhumas o hook não escreve
nada — uma sessão não deve pagar contexto para lhe dizerem que está tudo bem. O resto está na skill
`keel-licao`.

### O resto que convém saber

- **Correr outra vez é seguro.** Sem `--auto`, actualiza o clone; com `--auto`, só age se faltar. Nenhum dos dois mexe no que já está na forma certa.
- **A base não entra no repositório do projecto.** São mais de 8 000 ficheiros; é cache, não é contrato. O `.gitignore` trata disso.
- **Se preferires um repositório em que as fontes são URLs**, `node .keel/retrieve.mjs --urls` faz o caminho inverso.

Se o clone falhar por falta de acesso, não é problema teu: o repositório é privado e a conta autenticada tem de lá ter entrada. Diz isso e segue — o contrato fica escrito na mesma, só com as fontes em URL.

## O último passo não é um detalhe

Antes de dares o trabalho por feito, **corre o que acabaste de instalar**: os testes, o lint, os hooks. O projecto tem de ficar a passar nas verificações que lhe puseste. Um gerador que entrega uma CI vermelha no primeiro commit destrói a própria credibilidade, e a pessoa desliga tudo antes de perceber o que aquilo era.

## Quando acabas

Diz, em cinco linhas: o domínio escolhido, os ficheiros escritos, os temas incluídos e quantas regras trazem, o que ficou por verificar automaticamente, e o comando para confirmar (`/agents` e `/memory`).

Se o utilizador quiser confirmar uma regra na aula que a originou, a skill `keel-base` traz a base de conhecimento completa.
