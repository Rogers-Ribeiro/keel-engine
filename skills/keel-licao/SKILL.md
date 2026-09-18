---
name: keel-licao
description: Use quando o utilizador corrigir um erro teu, quando uma revisão ou um teste apanhar algo que devias saber, e quando o arranque da sessão disser que um erro já reincidiu. Regista a ocorrência, e quando a mesma coisa acontece outra vez propõe transformá-la numa lição que passa a valer em todos os projectos. Use também quando o utilizador disser "isto já erraste antes", "regista esta lição" ou "/keel-licao".
---

# keel-licao — que o mesmo erro não se aprenda duas vezes

O contrato do Keel desce: cursos → regras → projectos. Não há caminho de volta. Um erro apanhado
num projecto fica nesse projecto, e o projecto seguinte começa sem ele.

Esta skill é o caminho de volta. Tem duas camadas, e **a separação entre elas é o que a faz durar**:

| | O que é | Quantas | Quem decide |
|---|---|---|---|
| **Ocorrência** | uma linha: aconteceu isto, aqui está a prova | muitas, baratas | tu, à medida que acontece |
| **Lição** | uma regra sem ID, em contexto em todos os projectos | poucas | **sempre o utilizador** |

Uma ocorrência isolada é um acidente e duas ainda podem ser distracção. **À terceira o padrão é
inegável** — e é por isso que só aí se propõe uma lição. Sem esse filtro o registo enche-se de
propostas que não valem nada e deixa de ser lido, que é o destino de qualquer ficheiro de lições
que aceite tudo o que lhe dão.

## A triagem — antes de escrever o que quer que seja

Três destinos, e escolher mal é o que estraga isto. Pergunta por esta ordem:

**1. Uma máquina apanha isto?** Se um linter, um teste, um hook, um `.editorconfig` ou um esquema
o apanham, **não é lição nenhuma** — é uma verificação que falta. Escreve a verificação e pára aqui.
Uma regra em texto compete por atenção com tudo o resto no contexto, a cada sessão, para sempre;
uma verificação corre sozinha e não falha por distracção. É o raciocínio da **PROC-023**, aplicado ao
contrário: o que se pode garantir não se pede.

**2. É só deste projecto?** *"Aqui os testes correm com `uv run pytest`"*, *"este módulo não pode
importar aquele"*. Vai para `.agents/licoes.md`, dentro do repositório, versiona com o código e
nunca sai. Se o projecto tiver `CLAUDE.md`, acrescenta-lhe um ponteiro.

**3. Vale em qualquer projecto?** Então é ocorrência, e segue os passos abaixo.

## O que conta como ocorrência

Conta: **erro teu, que era evitável, e que a seguir alguém teve de corrigir.** O utilizador
corrigiu-te, a revisão apanhou, o teste falhou por algo que estava escrito e não leste.

Não conta, e escrever isto é o que enche o registo de ruído:

- o utilizador mudou de ideias — não erraste, o alvo mexeu-se;
- um bug de código, que se corrige no código;
- uma coisa que ninguém podia saber sem experimentar — a menos que agora já se saiba, e aí o que
  se regista é o que se descobriu, não o engano;
- a tua própria teoria sobre por que falhaste, sem nada que a sustente.

## Passo 1 — registar a ocorrência

O script está em `.keel/licoes.mjs` (nos projectos iniciados pelo `keel-init`) ou em
`${CLAUDE_PLUGIN_ROOT}/skills/keel-licao/licoes.mjs`. Tanto faz qual corres: **o registo é um só por
máquina**, em `~/.keel/`, ao lado da base. É isso que torna a coisa transversal.

```
node .keel/licoes.mjs registar --chave "<slug>" --o-que "<uma linha>" --prova "<ficheiro:linha, comando ou erro>"
```

- **A chave é o que faz duas ocorrências contarem como a mesma.** Antes de inventar uma, corre
  `node .keel/licoes.mjs estado` e vê se já lá está: reutilizar a chave certa é o trabalho todo.
  Chaves diferentes para o mesmo erro fazem-no parecer dois acidentes em vez de um padrão.
- **A prova é obrigatória e o script recusa sem ela.** Sem o ficheiro, o comando ou a mensagem que o
  demonstram, o que fica escrito é a tua versão do que aconteceu.
- Regista e diz numa linha que registaste. Não peças autorização para isto — é uma contagem, é
  reversível, e interromper o trabalho a cada engano custa mais do que vale.

## Passo 2 — propor a lição

O script diz-te quando a chave chega às três ocorrências. O arranque de cada sessão também o diz,
em qualquer projecto desta máquina. Quando chegar:

**Pergunta. Não escrevas.** Assim:

> Erraste nisto 3 vezes — em `<projectos>`, a última a `<data>`: *«<o que é>»*.
> Queres que fique como lição? Passa a estar no contexto de todos os projectos.

Se o utilizador disser que sim, escreve **a regra, não o relato**. A diferença decide se a lição
serve para alguma coisa: *"esqueci-me do tenant_id no índice"* é um relato; *"põe `tenant_id` como
primeira coluna de cada `UNIQUE`"* é uma regra.

```
node .keel/licoes.mjs licao --chave "<a mesma>" --titulo "<curto>" \
  --regra "<o que fazer, no imperativo>" \
  --porque "<a consequência de não fazer, não a regra outra vez>" \
  --verificar "<como se vê num diff ou no código que foi cumprida>"
```

O `--verificar` não é enfeite: é o campo que permite a esta lição ser promovida a regra e ser
auditada por quem não estava lá. Se não o souberes escrever, a lição ainda não está madura.

## Passo 3 — promover a regra, na base

Uma lição em `~/.keel/licoes.md` custa contexto **em todas as sessões, todos os dias**. Uma regra
com ID na base custa uma vez e chega a todo o lado pelo plugin. Por isso o registo é uma sala de
espera, e o arranque avisa quando ela enche.

Este passo corre **na base do Keel**, não num projecto. Para cada lição madura:

1. Escolhe o tema em `regras/` a que pertence, e o ID seguinte desse prefixo.
2. Escreve a referência em `docs/licoes/<chave>.md`: o que aconteceu, em que projectos, e a prova.
   É ela que a **Fonte** vai citar — uma regra sem fonte que abra não é auditável por ninguém.
3. Escreve a regra no formato normal, com `**Cursos:** 0`, tal como as **DB-018** a **DB-024**, que
   também não saem de curso nenhum.
4. `node ferramentas/validar.mjs`, e reindexa: `cd ferramentas/pesquisa && uv run indexar --camadas L3`.
5. Fecha o ciclo: `node .keel/licoes.mjs promover --chave "<chave>" --id "<ID da regra>"`. **Este passo
   não é opcional** — sem ele a lição custa duas vezes, como regra e como texto de sessão, e o
   arranque seguinte volta a propor o que já é regra.

Uma lição que não se confirmou sai pelo outro lado:
`node .keel/licoes.mjs descartar --chave "<chave>" --porque "<o que se percebeu entretanto>"`.
Estar errado é um fim de vida legítimo; ficar a ocupar contexto para sempre não é.

**Se uma chave arquivada voltar a acontecer**, o script avisa-te. É o sinal mais útil que este
registo dá: a regra existe e não está a apanhar o caso. Aí o que se corrige é a regra ou a
verificação — escrever outra lição sobre o mesmo não resolve nada.

## Regras do trabalho

- **Nunca escreves uma lição sem o utilizador dizer que sim.** Registar a contagem é teu; decidir o
  que passa a valer em todos os projectos é dele.
- **Nada entra sem prova.** É a mesma exigência que se faz às regras da base, e pela mesma razão.
- **Uma lição diz o que fazer, não o que correu mal.** Quem a lê daqui a três meses não estava lá.
- **Não registes o mesmo engano duas vezes na mesma sessão.** Uma ocorrência é uma vez que
  aconteceu, não uma vez que falaste dela.
- **Se a triagem der "uma máquina apanha isto", escreve a verificação e não escrevas a lição.** Duas
  não é mais seguro: é uma regra que vai ser ignorada ao lado de um teste que não vai.

## Quando acabas

Uma linha por cada coisa que fizeste: a ocorrência registada e a contagem em que ficou, a lição
escrita, ou a verificação que puseste no lugar dela. Se ficou alguma lição madura por promover a
regra, diz quantas e onde — é a única dívida que esta skill acumula.
