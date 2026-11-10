# Regras que vêm da prática de um projecto

Referência das regras que não saem de nenhum curso e nasceram do que se observou num repositório real, em 2026-09. O caso descreve-se pelo padrão e não pelos números: o que vale aqui é o modo como a falha acontece, que se repete noutros projectos.

## O portão e o baseline

Um repositório com disciplina verdadeira — prova por mutação, baselines de governação, gates escritos com cuidado — acumulou violações de regra às dezenas, porque nada abaixo do CI bloqueava uma fusão. O baseline de supressões tinha centenas de entradas com a mesma frase de justificação, debaixo de um campo que exigia razão e âmbito; o de tamanho de módulo quase duplicou por rebaselines sucessivos, cada um declarado e nenhum questionado. Origem das regras PROC-050 e PROC-051.

## A prova por mutação e a suíte que não corre

Com o mecanismo de isolamento de dados partido de propósito, mais de metade dos testes que o deviam verificar continuou verde, e os testes cujo nome prometia isolamento passaram todos. Noutra medição, metade dos testes que distinguiam o comportamento certo do errado nunca corria em CI, por *skips* condicionados a variáveis que nada definia. Origem das regras TST-011 e TST-012.
