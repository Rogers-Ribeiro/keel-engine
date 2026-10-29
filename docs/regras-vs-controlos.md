# Regras escritas e controlos que as impõem

Referência para as regras que não saem de nenhum curso sobre a distância entre uma regra de segurança escrita em texto (CLAUDE.md, `.claude/rules/`) e um controlo que a impõe (`permissions.deny`, hooks, sandbox).

## A fonte

Ting Yan, *When "Do Not" Is Not Deny: Security Rules in CLAUDE.md vs Built-In Controls*, arXiv:2608.23550, submetido a 24/08/2026. Abstract lido em https://arxiv.org/abs/2608.23550 a 2026-10-29. O texto completo não foi lido.

## O que o paper diz

- Analisou **481 ficheiros CLAUDE.md públicos**. Um LLM comparou as regras de segurança extraídas com os controlos documentados do Claude Code, e dois profissionais de segurança verificaram uma amostra de forma independente.
- Conforme o rigor exigido na correspondência, **4% a 16%** das regras de segurança tinham um controlo nativo equivalente. No critério mais estrito foram **4,4%** (IC 95%: 2,6–6,7%).
- Uma instrução "não faças" é interpretada pelo modelo; o `deny` bloqueia a acção antes de o agente a executar.
- Chama ao CLAUDE.md um **canal só de escrita** (*write-only channel*): quem escreve a regra não recebe retorno sobre se alguma coisa a vai impor.

## Os limites, que contam tanto como o resultado

- A extracção apanhou **66,3%** das regras elegíveis (revisão manual). As percentagens valem para as regras apanhadas.
- Os controlos considerados são permissões, modos e sandbox. O abstract **não diz se os hooks contam**. Um hook `PreToolUse` impõe uma regra que o `deny` não exprime, por isso a cobertura real de um projecto com hooks pode ser maior.
- "Sem controlo equivalente" **não quer dizer "ignorada pelo modelo"**. Quer dizer que o cumprimento depende de o modelo obedecer, e que ninguém fica a saber quando não obedece.

## Como o Keel usa isto

- A PROC-023 já mandava pôr no `deny` e num hook o que nunca pode acontecer, e a D-PR08 decide que o hook cobre `Bash|PowerShell|Write|Edit`. O paper mede o que acontece quando isso falta.
- A PROC-035 pede que cada regra de segurança escrita diga que controlo a impõe, ou que admita que não há nenhum.
- O `keel-init` instala sempre o `deny` mínimo e o hook de guarda (`.keel/guarda.mjs`), em qualquer nível de exigência. O `keel-upgrade` leva os dois aos projectos que já tinham contrato, só acrescentando.
- O `keel-audit` tem uma dimensão que lista as regras de segurança de um repositório que só existem em texto.
