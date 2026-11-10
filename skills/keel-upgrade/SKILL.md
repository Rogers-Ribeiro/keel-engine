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

Sem `--aplicar` não escreve ficheiro nenhum. Sai um relatório com oito linhas:

| Estado | O que o script faz |
|---|---|
| **intacta** — igual à base | aceita a versão nova, em silêncio |
| **editada** — mexeste-lhe | mantém a tua; o engine não lhe toca |
| **só no projecto** — nasceu aqui | mantém, e marca como candidata a promoção |
| **nasceram aqui e já subiram** | mantém a tua, e **pede-te uma decisão** |
| **nova no engine** | insere, a seguir à de número imediatamente abaixo |
| **saiu do engine** | mantém na mesma, e diz-te |
| **renumerada** — o título de uma regra do engine sob outro ID | mantém, diz «`<ID teu>` = `<ID engine>` renumerada», não a conta como órfã e não insere a do engine outra vez |
| **colisão** — o ID é de outra regra no engine | mantém a tua, e diz-te os dois títulos em vez de a tratar como editada |

Repara no que não está na tabela: **não há linha de «apagada»**. Nenhum caminho do script apaga uma
regra. No máximo diz-te que o engine deixou de a ter.

O relatório tem ainda uma secção **Scripts e controlos**, porque as regras de segurança só valem com
o que as impõe (PROC-023, PROC-035):

- os scripts de `.keel/` (`guarda.mjs`, `licoes.mjs`, `revisao.mjs`, `estado.mjs`) seguem a mesma lógica a três que as regras:
  em falta, instalam-se; intactos desde a base, passam à versão nova; editados no projecto, ficam e
  o relatório diz-te para comparares à mão;
- ao `.claude/settings.json` **só se acrescenta** o que falta do `deny` mínimo e o hook `PreToolUse`
  do guarda, o `env` das sessões curtas (`CLAUDE_CODE_AUTO_COMPACT_WINDOW`, `CLAUDE_CODE_SUBAGENT_MODEL`) e o hook `SessionStart` do estado — as mesmas entradas que o `keel-init` escreve. Uma chave de `env` que o projecto já tenha com outro valor fica como está, e o relatório diz-o. O `"agent": "orchestrator"` **não** entra: se o projecto tem o agente e não tem `agent`, o relatório só o sugere. Nada do projecto sai nem muda de sítio.
  Um `settings.json` que não seja JSON válido não é tocado, e o relatório diz o que juntar à mão.
- **O que o projecto tirou não volta.** Uma entrada do `deny` que já fazia parte do mínimo **na versão
  base** (lida do bloco do bloqueio nos ficheiros de apoio do `keel-init` da base) e falta no projecto foi tirada de propósito: o script não a
  repõe, e o relatório diz «`deny` `<entrada>`: o projecto tirou-a depois da base; não reposta». Só
  entram as entradas novas desde a base. Se a base é anterior aos controlos e não dá para saber o
  mínimo dela, vale o comportamento de antes: junta-se tudo o que falta.
- **O `.gitignore` dos scripts.** Um script de `.keel/` que o script instala ou actualiza e o
  `.gitignore` do projecto ignora (`git check-ignore`; sem git, um padrão `.keel/` ou `.keel/*`) ganha a
  excepção `!.keel/<script>.mjs`, a seguir às excepções `!.keel/` que já existam ou à linha que ignora
  `.keel/`. Sem isto o script não chega às worktrees novas e o hook que o corre falha. O relatório diz
  o que acrescentou; se a pasta `.keel/` inteira está ignorada (`.keel/` em vez de `.keel/*`), o git
  não reabre os ficheiros lá dentro e o relatório avisa.

Se o projecto não quiser uma das entradas (um pipeline que faz `git push` da sessão, por exemplo),
tira-a ele, à vista no diff, e regista o porquê no `keel.yaml`: nos upgrades seguintes não volta. O
script não pergunta, porque acrescentar um bloqueio é reversível numa linha e esquecê-lo não é.

### 2. Se não encontrar a base

O script procura o engine antigo sozinho, por esta ordem: `--base`, se o deres; a cache dos plugins,
que guarda as versões instaladas; e o clone git do marketplace (`<pasta de config>/plugins/marketplaces/<marketplace>/`,
irmã da cache; a pasta de config deduz-se de onde o script está instalado, ou de `CLAUDE_CONFIG_DIR`).
Se esse clone tiver a tag `v<versão do keel.yaml>`, extrai-a para uma pasta temporária, usa-a como base
e remove-a no fim, mesmo que haja erro. O relatório diz de onde veio a base.

Só se não houver clone, ou se lhe faltar a tag (o script diz qual dos dois), é que a base se traz à mão,
como último recurso:

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

### 5. Depois de aplicar, quatro coisas que o script não faz

**Testar o guarda.** Se foi instalado, dá-lhe um `git push` pelo stdin e confirma o `exit 2`:

```
echo '{"tool_name":"Bash","tool_input":{"command":"git push"}}' | node .keel/guarda.mjs; echo $?
```

Se o projecto tiver hooks com caminhos absolutos no `settings.json`, diz-o: noutra máquina falham, e
`${CLAUDE_PROJECT_DIR}` resolve isso.

**Os padrões do `paths:`.** Nos domínios de plataforma são canónicos e copiam-se tal e qual. No
`python-agentes` são convenção: onde vivem os modelos, os workers ou os prompts é decisão de cada
projecto. Confirma cada padrão contra a estrutura real do repositório e corrige o que não bater — um
padrão que não casa com nada é uma regra que nunca carrega, e ninguém dá por isso.

**O núcleo.** `.agents/nucleo*.md` fica intacto, e o relatório avisa. É o ficheiro que está em
contexto em **todas** as sessões, costuma ter emendas do projecto, e não tem IDs para comparar bloco
a bloco. O relatório traz, para cada núcleo, as linhas que o engine mudou entre a base e a versão nova
(ou «sem mudanças»): é isso que há a levar. Aplica-o à mão, ao lado do núcleo do projecto. Se estiver acima das 60
linhas, diz isso ao utilizador: cada linha ali custa atenção em cada turno.

**O contexto fixo.** Corre `node ${CLAUDE_PLUGIN_ROOT}/skills/keel-init/contexto.mjs` na raiz do
projecto. Soma o `CLAUDE.md`, os núcleos importados e as regras sem `paths:` — o que entra em todas
as sessões. Acima de 200 linhas, põe a tabela no relatório e aponta o que cortar primeiro: no
`CLAUDE.md`, o que o agente acertaria sem ler (visão geral, árvore de pastas, arquitectura descrita
em prosa) (PROC-037).

## Regras

- **Nunca apagues uma regra que o utilizador editou ou escreveu.** Se houver dúvida, fica a dele e
  vai para o relatório.
- **Não faças commit.** O diff é a revisão.
- O `keel.yaml` é cirúrgico: muda o campo `engine:` e mais nada. As `decisoes`, as `respostas`, as
  `verificacoes` e os comentários com datas e ADRs são do projecto.
- Se o projecto não tiver `.agents/keel.yaml`, isto não é um upgrade: é `/keel-init`.
