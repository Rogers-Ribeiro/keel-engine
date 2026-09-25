---
name: keel-upgrade
description: Use quando um projecto que já tem contrato do Keel precisa de o levar a uma versão nova do engine sem perder as regras que foram editadas ali, as que nasceram ali, nem o texto próprio das secções. Use quando o utilizador disser "actualiza o contrato", "o keel.yaml está atrasado", "trazer as regras novas" ou "/keel-upgrade". Não é para projectos sem contrato — esses são /keel-init.
---

# keel-upgrade — actualizar o contrato sem perder o que lá está

`/plugin update` actualiza o **engine** na máquina. Não toca no **contrato** escrito dentro de um
projecto, e isso é de propósito: o contrato versiona com o código, e uma actualização não pode mudar
as regras de um projecto em produção sem alguém decidir.

Esta skill é esse alguém a decidir.

## O que torna isto difícil, e porque é que resolve

Um contrato não é uma cópia do engine. Ao fim de uns meses tem três coisas que o engine não tem:

- **regras editadas para o projecto** — um bloco inteiro reescrito de raiz quando uma decisão de
  arquitectura mudou. Guarda o ID da regra da base e mais nada dela;
- **regras que nasceram ali** e nunca subiram, com IDs que continuam a sequência do tema;
- **texto próprio nas secções** — quarenta linhas de contexto antes da primeira regra de uma secção.

Um `/keel-init` por cima apagava as três. O que salva é o formato: cada regra tem um ID e um bloco
delimitado, por isso a comparação é **regra a regra**, não linha a linha. E as três versões existem:

| | onde está |
|---|---|
| **base** | a versão que o `.agents/keel.yaml` diz (`keel: engine:`), na cache dos plugins |
| **nova** | o engine instalado agora |
| **tua** | os ficheiros do projecto |

Com as três, quase tudo se decide sozinho. O que sobra é pouco, e é esse pouco que vale a tua
atenção.

## Passos

### 1. Simula primeiro, sempre

```
node ${CLAUDE_PLUGIN_ROOT}/skills/keel-upgrade/upgrade.mjs --projecto .
```

Sem `--aplicar` não escreve ficheiro nenhum. Sai um relatório com seis linhas:

| Estado | O que o script faz |
|---|---|
| **intacta** — igual à base | aceita a versão nova, em silêncio |
| **editada** — mexeste-lhe | mantém a tua; o engine não lhe toca |
| **só no projecto** — nasceu aqui | mantém, e marca como candidata a promoção |
| **nasceram aqui e já subiram** | mantém a tua, e **pede-te uma decisão** |
| **nova no engine** | insere, a seguir à de número imediatamente abaixo |
| **saiu do engine** | mantém na mesma, e diz-te |

Repara no que não está na tabela: **não há linha de «apagada»**. Nenhum caminho do script apaga uma
regra. No máximo diz-te que o engine deixou de a ter.

### 2. Se não encontrar a base

O script procura o engine antigo na cache dos plugins, que guarda todas as versões instaladas. Numa
máquina onde essa versão nunca esteve, não está lá. Traz-la do repositório pela tag:

```
git clone https://github.com/Rogers-Ribeiro/keel-engine /tmp/keel-antigo
cd /tmp/keel-antigo && git checkout v<versão do keel.yaml>
```

e repete com `--base /tmp/keel-antigo`.

**Sem base não há merge.** Com só duas versões não se distingue o que tu editaste do que o engine
mudou, e a escolha passa a ser um palpite. Se não a conseguires, diz isso ao utilizador e pára — não
faças o merge a dois.

### 3. Lê o relatório com o utilizador

Antes de aplicar, mostra-lhe **duas** secções, que são as únicas que precisam dele:

- **as que nasceram ali e entretanto subiram à base.** Existem dos dois lados, escritas de maneira
  diferente — a da base costuma vir reescrita da promoção, com a fonte noutro sítio. Abre as duas
  lado a lado e pergunta com qual fica. Por omissão fica a dele.
- **as órfãs.** Só existem naquele projecto. Enquanto não subirem, morrem com ele. É o momento certo
  para perguntar se quer promovê-las — e a promoção é o caminho do `keel-lesson`, não deste.

As editadas não precisam dele: não lhes tocaste e não lhes vais tocar.

### 4. Aplica

```
node ${CLAUDE_PLUGIN_ROOT}/skills/keel-upgrade/upgrade.mjs --projecto . --aplicar
```

Junta `--migrar-layout` se o projecto ainda tiver as regras em `.agents/regras/`: passam para
`.claude/rules/` com o `paths:` no frontmatter, e o Claude Code passa a carregar cada tema quando lê
um ficheiro que case, em vez de as ter todas em contexto a cada sessão.

O script **não faz commit**. Fica um `git diff` para ler, que é o que torna isto revisível.

### 5. Depois de aplicar, duas coisas que o script não faz

**Os padrões do `paths:`.** Nos domínios de plataforma são canónicos e copiam-se tal e qual. No
`python-agentes` são convenção: onde vivem os modelos, os workers ou os prompts é decisão de cada
projecto. Confirma cada padrão contra a estrutura real do repositório e corrige o que não bater — um
padrão que não casa com nada é uma regra que nunca carrega, e ninguém dá por isso.

**O núcleo.** `.agents/nucleo*.md` fica intacto, e o relatório avisa. É o ficheiro que está em
contexto em **todas** as sessões, costuma ter emendas do projecto, e não tem IDs para comparar bloco
a bloco. Abre-o ao lado do núcleo do domínio no engine e decide à mão. Se estiver acima das 60
linhas, diz isso ao utilizador: cada linha ali custa atenção em cada turno.

## Regras

- **Nunca apagues uma regra que o utilizador editou ou escreveu.** Se houver dúvida, fica a dele e
  vai para o relatório.
- **Não faças commit.** O diff é a revisão.
- O `keel.yaml` é cirúrgico: muda o campo `engine:` e mais nada. As `decisoes`, as `respostas`, as
  `verificacoes` e os comentários com datas e ADRs são do projecto.
- Se o projecto não tiver `.agents/keel.yaml`, isto não é um upgrade: é `/keel-init`.
