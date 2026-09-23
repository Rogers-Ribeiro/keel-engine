# Aprender com os erros do agente — referência de desenho

Serve o mesmo papel que `postgres-multitenancy.md`: é a referência contra a qual se escrevem regras
que nenhum curso ensina. Nenhum dos cursos extraídos trata de como um agente de programação acumula
o que aprendeu entre projectos — a **PROC-005** chega a dizer *"corrige a skill, não só o
resultado"*, mas não diz onde fica o que se corrigiu nem como chega ao projecto seguinte.

Escrita a 2026-09-18, a partir do desenho da skill `keel-lesson` e do que se observou num
repositório real com um ficheiro de lições mantido à mão.

## O problema

O contrato do Keel corre num só sentido:

```
cursos → sínteses → regras → plugin → projecto
```

Um erro apanhado num projecto morre nesse projecto. O projecto seguinte arranca sem ele, com o
mesmo modelo, e comete-o outra vez. Quem trabalha em três repositórios ensina a mesma coisa três
vezes — e volta a ensiná-la a cada sessão nova, porque o contexto não sobrevive ao `/clear`.

A ideia óbvia — um ficheiro de lições no projecto — falha de uma maneira que só se vê tarde.

## O que se observou

Num repositório com cerca de um ano de desenvolvimento assistido por agentes, o ficheiro de lições
tinha **145 entradas**. Três coisas ao mesmo tempo:

1. **Já não era lido.** 145 lições não cabem em nenhum orçamento de contexto razoável. Um ficheiro
   que não cabe não é aplicado, e um ficheiro que não é aplicado não protege de nada.
2. **Boa parte era mecânica.** Formatação, fins de linha, nomes de comandos — tudo coisas que um
   linter, um hook ou um ficheiro de configuração apanham sem falhar nunca.
3. **Boa parte não tinha prova.** Eram descrições do que o agente julgava ter corrido mal. O próprio
   repositório registava, noutra lição, que a sua classe de defeito dominante era *texto que afirma
   o que o código não faz* — e um ficheiro de lições é texto.

As três falhas têm a mesma origem: **o registo aceitava tudo o que lhe davam.**

## As três decisões

### Reincidência, não erro

Uma ocorrência isolada é um acidente; nada se conclui dela, e duas ainda podem ser distracção. Só à
**terceira vez** é que o padrão é inegável, e só aí se propõe uma lição. Isto separa o registo em
duas camadas com custos diferentes:

| | Custo | Quantidade | Quem decide |
|---|---|---|---|
| Ocorrência | uma linha num `jsonl` | muitas | o agente, à medida que acontece |
| Lição | contexto em cada sessão | poucas | o utilizador, sempre |

O limiar de três é uma escolha, e o custo de errar para cada lado não é simétrico. Baixo de mais, o
registo enche-se de propostas que não valem nada — e um registo que se aprende a ignorar deixa de
proteger de fosse o que fosse, mesmo nas entradas boas. Alto de mais, atura-se o mesmo erro várias
vezes de graça. Perante uma assimetria destas, escolhe-se o lado que preserva a confiança no
registo: é mais fácil baixar o limiar depois de ver que ele está a deixar passar coisas do que
recuperar um ficheiro que já ninguém lê.

### Prova obrigatória, validada em código

Uma ocorrência sem o ficheiro, o comando ou a mensagem que a demonstram é a teoria do agente sobre
si próprio. A exigência não pode viver só no texto da skill, porque o texto é precisamente o que
falha sob pressão de contexto: está no código que escreve o registo, que recusa a ocorrência sem
o campo preenchido.

É a mesma exigência que já se faz às regras da base — uma regra sem **Fonte** que abra não é
auditável — aplicada à camada de baixo.

### Tecto que avisa, e uma saída

O registo é uma **sala de espera**, não uma casa. Uma lição em texto de sessão custa contexto todos
os dias; a mesma lição promovida a regra com ID custa uma vez e chega a todos os projectos pelo
mecanismo que já existe. Por isso:

- o registo tem um tecto, e passá-lo **avisa em vez de cortar** — uma lição que não é impressa é uma
  lição que não é aplicada, e um corte silencioso dá a ilusão de protecção;
- promover uma lição a regra **retira-a** do registo. Sem essa remoção, passa a custar duas vezes.

## A triagem, que é o que evita as 145

Antes de escrever o que quer que seja, três destinos por esta ordem:

1. **Uma máquina apanha isto?** Linter, teste, hook, esquema, ficheiro de configuração. Se sim, não é
   lição — é uma verificação que falta. É a **PROC-023** ao contrário: se o texto só sugere e o hook
   garante, então o que se pode garantir não se pede. Escrever as duas coisas é pior do que escrever
   só a verificação: fica uma regra que vai ser ignorada ao lado de um teste que não vai.
2. **É só deste projecto?** Fica no repositório, versiona com o código, nunca sai.
3. **Vale em qualquer projecto?** Só este caso chega ao registo partilhado.

O primeiro destino é o que apanha a maioria, e é o que o registo observado não tinha.

## Onde vive

O registo é **um por máquina**, em `~/.keel/`, ao lado da base clonada por `retrieve.mjs`. Não é
por projecto: se fosse, não seria transversal, que é o problema todo. Não é no repositório da base:
é estado local, muda a cada sessão, e não deve produzir diffs.

A travessia para os outros projectos faz-se em duas velocidades:

- **imediata** — o hook `SessionStart` de cada projecto põe as lições em contexto; o que se aprendeu
  de manhã num projecto está à tarde noutro, sem publicar nada;
- **curada** — a promoção a regra com ID na base, que depois chega a todo o lado com `plugin update`
  e vale para sempre.
