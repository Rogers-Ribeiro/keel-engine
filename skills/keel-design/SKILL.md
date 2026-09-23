---
name: keel-design
description: Use quando um processo ou uma vertical precisa de ser desenhado antes de haver spec — quem faz o quê, por que ordem, e o que cada pessoa vê. Use antes do brainstorming e da spec, e não para alterações pontuais. Use também quando o utilizador disser "vamos desenhar isto", "faz um quadro disto" ou "/keel-design".
---

# keel-design — desenhar antes de haver spec

Entregas três coisas: um **canvas** em baixa fidelidade, onde o utilizador marca por cima com
caneta e setas; uma **página durável** no git, com a premissa acordada, as fases e as decisões; e
**decisões com o custo de reversão medido**, incluindo as que ficam em aberto e o nome de quem as
fecha.

Isto vem **antes** do `brainstorming` e da spec, para lhes entregar trabalho feito em vez de uma
interpretação. É o degrau barato: aqui risca-se um quadro e perde-se um minuto; na spec desfaz-se
uma manhã, e no código uma migração.

## Quando isto se usa, e quando não

O gatilho é uma pergunta, e faz-se antes de qualquer outra coisa:

> **Consegues nomear quem faz cada passo?**

Se sim, é um processo e o quadro serve: emitir um cartão VIP, aprovisionar um cliente, ligar um
sistema externo, o ciclo de vida de um cartão. Se a resposta for «o sistema», provavelmente não é
processo nenhum — e o caminho é o `brainstorming`.

**Fica de fora**, e diz-se que fica: alterações pontuais, correcções, e **desenho técnico**.
Fronteiras de módulos, contratos entre componentes e fluxo de dados continuam a ser texto — não há
prova de que o canvas ganhe aí, e há o risco de se desenhar bonito o que se percebe mal.

Se estiveres em dúvida, faz a pergunta ao utilizador em voz alta e deixa-o responder. Uma skill
usada para tudo deixa de valer para alguma coisa.

## Passo 1 — a premissa, antes de haver desenho

**Antes de existir um único quadro**, escreves uma frase e perguntas se é essa:

> **o que é isto, para quem, e quem carrega no botão.**

É a primeira coisa que fazes na sessão. Não se junta a um quadro já feito, não se infere do que já
leste, não se deduz do código — pergunta-se, **e a quem não leu nada**. A pergunta feita a quem
partilha a mesma interpretação errada devolve a interpretação errada, e é a única peça deste método
que é uma pessoa e não um mecanismo.

A frase vai para o topo do canvas **como nota, em primeiro lugar, e antes de haver quadros** —
precisamente para se poder riscar. Quem vê um desenho pronto já não questiona a premissa dele.

A razão está escrita, e é a **UX-004**: com fidelidade alta demais, quem lê acredita que o produto
está pronto e só comenta polimento. **Uma spec de novecentas linhas é um protótipo de alta
fidelidade**, e convida a rever o acabamento; a pergunta grossa fica de fora.

### O que custa não fazer isto

No cartão VIP da ANA, o `DT:249` torna o produto **obrigatório** na configuração de regras, o
`DT:165` torna-o **opcional** no cartão, e o `AF:1507` exige que as validações corram **também** no
VIP. Três textos, cada um coerente consigo próprio, e juntos deixam um cartão VIP sem origem
documentada para as suas regras.

A pergunta — *o cartão VIP tem produto?* — chegou a ser formulada, e com **três saídas escritas**:
(a) configuração por segmento, (b) um produto interno de cortesia, (c) cartão sem regras de âmbito.
Não faltava análise. **O que faltou foi a pergunta ir à ANA.** Foi respondida por inferência, pela
(b).

Três dias depois a ANA respondeu numa sessão de revisão — *«não faz sentido no VIP termos o campo
product»*, que é a (c) — e desfez um registo `Product2` na sandbox, um script de Apex e todo o
trabalho à volta.

Num quadro de processo, «emitir um cartão VIP» teria uma faixa para a ANA. A pergunta *quem carrega
neste botão* tê-la-ia posto lá, **vazia, à vista**, três dias antes.

## Passo 2 — os quadros

Dois tipos, e escolhe-se pelo que se quer descobrir:

| | Quadro de processo | Quadro de ecrã |
|---|---|---|
| Um artboard é | uma **fase**, com faixas por actor | um **estado** do mesmo ecrã |
| Obrigatório | cada faixa tem um actor nomeado | o estado de **falha**, sempre |
| A nota por baixo | o que esta fase decide | a suposição que este estado testa |
| Onde morde | passos que ninguém faz, ou que dois fazem | estados que ninguém desenhou e o código tem de tratar |

As mecânicas — criar o canvas, a forma do índice, a forma de um artboard, o que nunca se toca —
estão em `canvas.md`, ao lado deste ficheiro. **Lê-o antes de escreveres o primeiro quadro**: as
regras do formato falham em silêncio.

Três obrigações, cada uma com a sua razão:

**Cada faixa tem um actor nomeado, nunca «o sistema» sozinho.** Uma faixa sem dono é um passo que
ninguém faz — ou que dois fazem e ninguém sabe qual. O nome pode ser um papel («o suporte», «quem
administra o cliente», «a ANA»), mas é um nome. Uma faixa que só se consegue rotular com «o
sistema» fica lá **vazia e por preencher**, porque é isso que ela é.

**O estado de falha desenha-se sempre.** É onde o desenho e o código se confrontam: no caminho feliz
não há nada com que discordar, e toda a gente concorda com ele. O terceiro ecrã do aprovisionamento
do AnnieFlow — *a organização já é de outro cliente, e apagá-la derrubava um cliente vivo* — era um
caso que o código já tratava e que nenhum ecrã desenhava. Foi ele que obrigou a decidir o que a spec
não tinha decidido.

**Cada quadro leva por baixo uma nota a dizer que suposição testa.** É a `UX-004` tornada
verificável: se não consegues escrever a suposição numa frase, **o quadro não está a testar nada e
ainda não devia existir**. Apaga-o ou substitui-o por uma pergunta.

E a fidelidade fica onde está: caixas, faixas, estados, uma cor de destaque. Sem cores de marca, sem
micro-copy afinado, sem ícones bonitos. **A fidelidade sobe quando as suposições se confirmam, e não
com o avanço do projecto.**

### Na primeira volta desenha-se uma fase, e só essa

**A fase onde a premissa se decide.** Uma fase, duas ou três faixas. Mostra-se, ouve-se, e só depois
se desenham as outras. Se houver uma fase onde se vê quem carrega no botão, é essa; se não for
óbvia, **pergunta-se qual é antes de desenhar** — e a hesitação em responder já é informação.

**O número de quadros é fidelidade tanto como o acabamento**, e a `UX-004` vale igual para os dois:
descobrir que a premissa estava errada com dez quadros feitos custa dez vezes mais do que
descobri-lo com dois. Pior do que o custo, um processo inteiro desenhado convida ao mesmo que uma
spec de novecentas linhas — comentários sobre a ordem das caixas, e não sobre se aquilo é para quê.

No cartão VIP da ANA, **a pergunta do produto decidia-se na primeira fase**. Desenhada sozinha,
teria posto a faixa vazia da ANA à vista antes de existir mais alguma coisa — e o que estava em
causa eram três dias, não o resto do processo.

## Passo 3 — a volta

O utilizador responde de duas maneiras, e **só se vê uma delas se se for buscar as duas**:

- **marca por cima** — traços, setas, rectângulos, texto, que ficam no canvas;
- **comenta preso a um ponto do desenho** — e esses **não estão nos ficheiros**: lêem-se à parte,
  com a ferramenta `ArtifactComments`.

**A volta seguinte começa por ler o canvas de lá, e os comentários antes dos ficheiros** — nunca
dos ficheiros que escreveste, nunca de memória. O que está no canvas é o teu desenho **mais** o que
ele lhe fez por cima, e é a segunda parte que interessa. **Não tocas nas marcas dele**: nem para
arrumar, nem para actualizar. Um comentário que se salta perde-se calado, como uma marca apagada. O
`canvas.md` diz como se lê cada um, e porque é que estes são os erros sem desfazer.

Cada volta regista, na página durável, duas coisas:

- **o que mudou** no desenho;
- **a frase que o motivou**, entre aspas e de quem a disse.

A frase vale mais do que a alteração. *«Quem instala a AnnieSales é apenas a gente»* tem seis
palavras e desfez dois documentos; a alteração que dela saiu explica-se sozinha, mas a frase é o que
ensina onde estava o erro de premissa — e é a única coisa que se pode procurar daqui a um ano.

## Passo 4 — as decisões

Por decisão, três campos, e **nenhum é opcional**:

| | |
|---|---|
| **O que se decidiu** | numa frase, e quem decidiu |
| **O que muda para quem usa** | o efeito no processo, não na implementação |
| **O que custa reverter** | o que é preciso desfazer, em coisas concretas |

**Uma decisão sem custo de reversão medido decide-se por gosto.** «Um registo `Product2` na sandbox,
um script de Apex e o trabalho à volta» é um custo medido; «alguma refactorização» não é nada. Se
não conseguires escrever o custo, a decisão ainda não está tomada — está adiada com aparência de
tomada.

**As que ficam em aberto listam-se como abertas**, cada uma com:

- **o que falta** para a fechar;
- **a quem se pergunta**, pelo nome.

Foi a falta desse nome que custou o produto de cortesia: a pergunta estava formulada, as três saídas
estavam escritas, e não havia linha nenhuma a dizer *«isto pergunta-se à ANA»*. Uma pergunta em
aberto sem destinatário responde-se sozinha, por inferência, e é sempre assim que acaba.

## Passo 5 — o que fica

| Artefacto | Onde | Papel |
|---|---|---|
| O canvas | o link do Artifact | vivo; é aqui que se continua a marcar |
| A página | `docs/desenho/<AAAA-MM-DD>-<processo>.md` | durável: premissa, fases, decisões, abertas |
| O instantâneo | `docs/desenho/quadros/<processo>/` | os ficheiros do canvas, puxados quando o desenho assenta — abaixo |

**O canvas é a fonte viva; a página é o que sobrevive.** Um link de artefacto é privado e pode
desaparecer — se o raciocínio só lá viver, perde-se com ele. O instantâneo tira-se **quando o
desenho assenta**, e não a cada volta, senão o git enche-se de ruído.

**E «assenta» tem critério**, senão o instantâneo tira-se por cansaço:

> a volta em que **não aparecem marcas novas nem comentários novos**, e em que as decisões em aberto
> ou fecharam **ou têm dono**.

As três condições verificam-se olhando para o que já tens: o canvas da volta anterior contra o desta,
e a lista de abertas do passo 4. Uma delas que falhe é mais uma volta, não um instantâneo.

**Cada página declara à cabeça quem manda se divergir da spec.** Uma frase, no topo, antes de tudo o
resto: *«em caso de divergência com a spec 010, manda esta página»*, ou o contrário. Uma página de
desenho à frente da spec é normal e diz-se; uma spec à frente do desenho sem a página o dizer é como
se perdem manhãs — alguém implementa o que já foi corrigido.

O `docs/desenho/README.md` indexa os processos, numa tabela com **o processo, quem o faz e o
estado** («desenhado e acordado», «duas decisões medidas, oito em aberto», «por desenhar»). Se não
existir, cria-o com o primeiro processo lá dentro.

## Na fase de desenho, pesquisa-se sem filtro de domínio

A pesquisa da base aceita `--dominio`, e serve para **executar**: um projecto de Salesforce não quer
regras de LangGraph ao lado das de Apex. **Atrapalha para perceber.**

A lição que explicou o diagnóstico das duas reversões do AnnieFlow estava no tema `ux.md`, que o
projecto **não tinha instalado** — só se alcançou por pesquisa sem filtro. Um projecto de Salesforce
a desenhar um processo tem exactamente o mesmo problema: a lição sobre fidelidade de protótipos não
está nos temas de Salesforce e nunca estará.

**Nos passos 1 e 2, pesquisas sem `dominio`.** A partir do passo 4, quando já se decide dentro de
uma stack, o filtro volta a fazer sentido.

## Quando acabas

Cinco linhas, e nenhuma delas é um resumo do que fizeste:

1. **A premissa, como ficou acordada** — a frase, e quem a confirmou.
2. **Quantos quadros e de que tipo** — e o link do canvas.
3. **As decisões fechadas**, e **as abertas com o nome de quem responde a cada uma**.
4. **Onde está a página durável**, e o que ela declara sobre divergir da spec.
5. **A pergunta que o utilizador tem agora de responder.** Uma, a que desbloqueia mais coisas.

Se não houver pergunta nenhuma por fazer, diz isso com todas as letras — mas confere primeiro se não
é antes sinal de que não perguntaste a ninguém de fora.
