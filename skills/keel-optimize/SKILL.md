---
name: keel-optimize
description: Use quando o utilizador quer saber porque gasta tantos tokens com o Claude Code, ou reduzir o contexto de um projecto — sessões longas, CLAUDE.md grande, memória inchada, plugins a mais, regras que carregam todas de uma vez. Mede primeiro, só a ler, e só depois arruma, uma coisa de cada vez e sempre a perguntar o que não é «como». Use também quando disser «optimiza o contexto», «porque é que gasto tanto» ou «/keel-optimize».
---

# keel-optimize — medir o contexto e o consumo, e arrumar o que a medição apontar

Cada chamada ao modelo relê a conversa inteira. O que custa não é o que se escreve: é o **tamanho do contexto vezes o número de chamadas**. Por isso, antes de mexer em ficheiros de instruções, mede-se — num projecto onde isto foi medido, o contexto fixo (`CLAUDE.md`, núcleo, memória) era uns 2% do que cada chamada lia, e o resto era a conversa, o prefixo do sistema e uma sessão de vigia a correr em contexto grande.

Esta skill **mede sempre, e só aplica com o sim do utilizador**. Nunca faz commit: o `git diff` é a revisão.

## Passos

### 1. Medir (só leitura, sem perguntar)

```
node ${CLAUDE_PLUGIN_ROOT}/skills/keel-optimize/medir.mjs --projecto .
```

Lê as últimas sessões do projecto (por omissão 10; `--sessoes N`), o contexto fixo, as regras, a memória, os plugins e os agentes. Nunca imprime texto de mensagens. Se algum ficheiro de sessão não se conseguir ler, di-lo: não finjas que mediste.

Mostra ao utilizador as **Conclusões**, que são só as que se verificam, cada uma com o número que a prova e o tipo:

- **como** — arruma-se aqui, sem decisão de produto;
- **decide** — muda uma definição dele ou o fluxo da equipa; pergunta-se.

### 2. Propor, pela ordem do que mais pesa

Ordena por efeito medido, e não pela facilidade. As que mexem em sessões e ciclos pesam quase sempre mais do que as que mexem em ficheiros. Cada pergunta **leva a recomendação antes das opções, o que muda para quem usa e o que custa reverter**.

### 3. Aplicar, uma de cada vez

Faz tudo numa worktree ou ramo próprio, e diz o que mudou a seguir a cada passo.

| Conclusão | O que se faz | Detalhe |
|---|---|---|
| Contexto fixo acima do limite | arquivar o original, condensar, medir outra vez | [`condensar.md`](condensar.md) |
| Regras sem `paths:` | dar `paths:` aos temas que só valem para certos ficheiros | `contexto.mjs` mostra quais |
| Plugins a mais | `projecto.mjs plugins` mostra o peso de cada um; **pergunta quais** desligar, e `projecto.mjs desligar` só mexe no projecto | — |
| Memória inchada | cópia de segurança, fusão por tema, verificação mecânica | [`memoria.md`](memoria.md) |
| Revisor ou agentes antigos, controlos em falta | **não se refaz aqui**: corre `/keel-upgrade`, que já os traz | `keel-upgrade` |
| Ciclo ou vigia em sessão de contexto grande | passa a correr numa sessão limpa, e a esperar por aviso em vez de perguntar em ciclo | [`ciclos.md`](ciclos.md) |

### 4. Medir outra vez, numa sessão nova

O prefixo de uma sessão só muda ao abrir outra. Pede ao utilizador que abra uma, e volta a correr o `medir.mjs`: compara a **abertura** e o **contexto fixo** com os de antes. Se o ganho for pequeno, di-lo, em vez de o vender.

## O que esta skill não faz

- **Não desliga conectores** (são da conta: `/mcp`) **nem muda o esforço ou o modelo por omissão** (são do utilizador). Diz onde se muda, e o que se calcula que se ganha.
- **Não apaga a memória nem o histórico sem cópia de segurança.** Sem a cópia, pára.
- **Não analisa os prompts do utilizador.** A medição só conta tokens.
- **Não decide o que o guarda bloqueia** no fluxo da equipa: isso é do `keel-upgrade` e de quem decide.

## Regras

- **Um passo, uma pergunta.** Várias perguntas juntas misturam decisões e respostas.
- **Nada do projecto vai para o relatório que se partilha.** Os números sim; o conteúdo não.
- **O que se arquiva arquiva-se integral.** O condensado manda e o arquivo explica, mas o arquivo tem de existir antes de se condensar (**PROC-037**).
- **Sessões curtas valem mais do que ficheiros curtos** (**PROC-001**): uma sessão nova por bloco, e compactar cedo.
