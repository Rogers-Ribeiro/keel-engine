# Ciclos, vigias e esperas: fora das sessões de contexto grande

**O custo de cada volta de um ciclo é o tamanho do contexto da sessão que o corre.** Uma vigia que dispara todos os quarto de hora numa sessão com 470 mil tokens de contexto relê 470 mil tokens em cada volta, para fazer duas chamadas. Num projecto onde isto foi medido, uma só sessão com um ciclo destes pesava mais de metade dos tokens lidos de todas as sessões recentes.

O `medir.mjs` assinala-o como «ciclo ou espera numa sessão de contexto grande» (mais de 3000 chamadas e mediana acima de 300 mil).

## O que fazer

1. **Corre o ciclo numa sessão limpa**, aberta só para isso, e num modelo mais barato com esforço baixo: um ciclo que só lê estado e manda uma linha não precisa do modelo mais forte (roteamento: a orquestração difícil fica no forte, o trabalho repetitivo desce).
2. **Põe o estado num ficheiro, e não no prompt.** Um prompt com nomes de sessões, ramos ou frentes envelhece (as sessões reabrem com nomes novos); o ciclo lê o ficheiro em cada volta.
3. **Não perguntes em ciclo: subscreve.** O `SendMessage` tem `notify_when_idle`, que avisa uma vez quando a outra sessão fica ociosa, sem custar nada a essa sessão. O `ListAgents` diz, na própria descrição, para não o chamar em ciclo.
4. **Põe um limite numérico, e não um adjectivo.** «Barata em tokens» não é um limite; «no máximo 5 chamadas de ferramenta por volta» é.
5. **Só acordes uma sessão ociosa se há razão no estado**, e nunca a mesma duas vezes seguidas sem resposta: cada mensagem a uma sessão ociosa faz essa sessão reler o seu contexto inteiro.

## Modelo de comando (`.claude/commands/vigia.md`)

```
---
description: Uma volta da vigia, curta e sem polling. Corre numa sessão limpa.
model: sonnet
---
Limites: no máximo 5 chamadas de ferramenta por volta; não leias ficheiros além dos indicados; se nada mudou, não escrevas a ninguém.
1. Lê <ficheiro de estado> e retém só <os campos>.
2. Corre ListAgents uma vez.
3. Sessão ocupada: não escrevas; subscreve com notify_when_idle.
   Sessão ociosa sem razão para estar parada: uma linha, e regista a hora no ficheiro de estado; não a avises outra vez antes de <N> horas.
   Sessão que não aparece: diz-o ao utilizador numa linha; não adivinhes o nome novo.
```

O esforço (`/effort low`) define-se na sessão: é do utilizador, e a skill só o recomenda.
