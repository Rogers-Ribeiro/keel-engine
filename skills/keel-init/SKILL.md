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
3. Se o repositório tiver código a sério e nenhum contrato, este não é o caminho certo: diz-lhe que o `keel-init` é para projectos novos e que adoptar um repositório existente pede um levantamento primeiro.

## As perguntas — no máximo quatro

Um gerador que interroga vinte vezes é usado uma vez. Pergunta só isto, e propõe um valor por omissão para cada:

1. **Nome do projecto e uma frase sobre o que faz.**
2. **Temas de regras** que se aplicam. Por omissão, para um projecto Python com agentes: `python`, `codigo-limpo`, `arquitetura`, `testes`, `seguranca`, `agentes-ia`. Mostra a lista completa e deixa acrescentar ou tirar.
3. **O projecto tem fronteiras internas** (módulos que não se importam uns aos outros)? Decide se entram as regras de arquitectura modular.
4. **Nível de exigência:** só revisão humana, ou também verificações automáticas (lint, testes, hooks) desde o início.

## O que escreves

```
<projecto>/
├── CLAUDE.md              importa @.agents/nucleo.md e diz como trabalhar aqui
├── .agents/
│   ├── keel.yaml          versão do engine, temas escolhidos, respostas e data
│   ├── nucleo.md          as regras que valem em qualquer tarefa
│   └── regras/<tema>.md   só os temas escolhidos
└── .claude/settings.json  permissões e hooks, se o nível de exigência os pedir
```

Regras de escrita:
- **Copia** o `nucleo.md` e os `regras/<tema>.md` do plugin (`${CLAUDE_PLUGIN_ROOT}/regras/`) para dentro do projecto. Não uses imports por caminho absoluto: partem noutra máquina e não versionam com o código.
- Se o projecto já tiver `CLAUDE.md`, **acrescenta** a secção no fim e não toques no resto.
- O `keel.yaml` regista a versão do engine e as escolhas, para se saber depois o que foi gerado e com que base.

## O último passo não é um detalhe

Antes de dares o trabalho por feito, **corre o que acabaste de instalar**: os testes, o lint, os hooks. O projecto tem de ficar a passar nas verificações que lhe puseste. Um gerador que entrega uma CI vermelha no primeiro commit destrói a própria credibilidade, e a pessoa desliga tudo antes de perceber o que aquilo era.

## Quando acabas

Diz, em cinco linhas: os ficheiros escritos, os temas incluídos e quantas regras trazem, o que ficou por verificar automaticamente, e o comando para confirmar (`/agents` e `/memory`).

Se o utilizador quiser confirmar uma regra na aula que a originou, a skill `keel-base` traz a base de conhecimento completa.
