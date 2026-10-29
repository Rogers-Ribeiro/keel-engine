# Contexto, skills e revisão: o que a investigação mede

Referência para as regras que não saem de nenhum curso sobre quanto texto pôr em contexto, como escrever skills e como rever o trabalho de um agente. Os cursos ensinam o CLAUDE.md, as skills e os subagentes revisores; nenhum mede o efeito de cada um. Estes quatro estudos medem.

Os abstracts foram lidos no arXiv a 2026-10-29. Os textos completos não foram lidos, e por isso cada ponto diz só o que o abstract sustenta.

## 1. Arquivos de contexto: o que não foge do padrão custa e não ajuda

Gloaguen, Mündler-Sasahara, Müller, Raychev, Vechev, *Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?*, arXiv:2602.11988 (v1 a 12/02/2026, v3 a 29/09/2026), ICLR 2026.

- Dois cenários: tarefas do SWE-bench com arquivos de contexto gerados por LLM, e um conjunto novo de issues de repositórios que já tinham arquivos escritos pelos programadores.
- Os arquivos de contexto **não melhoram, em geral, a taxa de sucesso** e sobem o custo de inferência em **mais de 20%** em média.
- Os agentes **seguem bem** as instruções. O problema não é a obediência, é o que se lhes pede: as visões gerais do repositório não ajudam.
- Onde servem é para declarar **práticas de código fora do padrão**.

**No Keel:** o CLAUDE.md que o `keel-init` escreve leva os imports dos núcleos, os comandos que não se adivinham e o que contraria o padrão — e não descreve o projecto (PROC-037).

## 2. Instruções em simultâneo: o cumprimento cai com a quantidade

Jaroslawicz, Whiting, Shah, Maamari, *How Many Instructions Can LLMs Follow at Once?*, arXiv:2507.11538 (julho de 2025), NeurIPS 2025.

- Benchmark IFScale: até 500 instruções numa tarefa de escrita, em 20 modelos de 7 fornecedores.
- Mesmo os melhores modelos ficam em **68%** de cumprimento com 500 instruções.
- Três formas de queda: por limiar (perto do perfeito até uma densidade crítica, nos modelos de raciocínio), linear e exponencial.
- **Viés a favor das instruções que vêm primeiro.**

**No Keel:** o teto de 60 linhas vale por núcleo, mas um projecto carrega vários. O `contexto.mjs` (em `skills/keel-init/`) soma tudo o que entra em todas as sessões e avisa acima de 200 linhas — o valor que a documentação do Claude Code dá para um CLAUDE.md ([claude-code-formatos](claude-code-formatos.md)). Os núcleos abrem pela secção `## Nunca`, para que o que não pode falhar fique à frente.

## 3. Skills: as curadas e focadas ajudam, as exaustivas menos

Li et al. (77 autores), *SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks*, arXiv:2602.12670 (v1 a 13/02/2026, v4 a 14/06/2026), NeurIPS 2026.

- 87 tarefas em 8 domínios, com verificadores determinísticos; 18 combinações de modelo e harness, com e sem skills.
- Skills curadas sobem a taxa média de 33,9% para **50,5%** (+16,6 pontos), com ganhos entre +4,1 e +25,7 conforme a configuração.
- **Skills focadas, com no máximo três módulos, ganham a pacotes maiores ou exaustivos.**
- Modelos mais pequenos com skills podem igualar modelos maiores sem elas.
- Resumos da v1 dizem que skills **geradas pelo próprio modelo** não trouxeram benefício médio. O abstract da v4 não o repete; fica por confirmar no texto.

**No Keel:** o `SKILL.md` diz o que fazer e em que ordem; o pormenor que só serve num passo vai para um ficheiro de apoio ao lado, lido quando esse passo chega (PROC-038). As lições do `keel-lesson` só entram com o "sim" do utilizador, o que vai no mesmo sentido do resultado sobre skills autogeradas.

## 4. Revisão: o juiz favorece o que se parece consigo, e o achado fica por corrigir

Yang, Hu, Qiu, Deng, Jiao, Zhou, *Quantifying and Mitigating Self-Preference Bias of LLM Judges*, arXiv:2604.22891 (v1 a 24/04/2026, v4 a 02/06/2026).

- O viés de auto-preferência: um modelo que julga favorece (ou desfavorece) sistematicamente as suas próprias saídas.
- Medido em 20 LLMs com pares de respostas de qualidade igual. **Ser mais capaz não reduz o viés** — às vezes até se correlaciona com mais.
- Uma avaliação **estruturada por várias dimensões**, que reparte a carga, reduz o viés em **31,5%** em média.

Fei et al., *How Do Agents Fail on AutoResearch*, arXiv:2608.14905 (v1 a 14/08/2026).

- 100 tarefas de investigação em 7 domínios, 8 combinações de harness e modelo, 800 trajectórias anotadas, 45 padrões de falha.
- Os padrões convergem numa limitação: falta aos agentes um **ciclo metacognitivo** — conferir o resultado contra o que encontraram, rever quando não bate, questionar o caminho.
- Repetem-se nas 8 combinações, incluindo nos modelos mais fortes. Os autores não testaram se a orquestração resolve.

**No Keel** (PROC-036), sem revisor de outra família — o viés não se tira, diminui-se dependendo menos do juízo do revisor:

- **Por dimensão.** O `reviewer` dá PASSA, FALHA ou SEM EVIDÊNCIA em cada dimensão, sem parecer geral.
- **Autoria escondida.** Recebe só o diff e a spec; o código é apresentado como de terceiros.
- **Ónus da prova invertido.** Cada dimensão começa em FALHA e só passa com evidência: um teste que corre, a saída do lint ou do verificador de tipos, a linha citada. As ferramentas determinísticas não têm auto-preferência.
- **Refutador nos portões críticos.** O `refuter` recebe cada PASSA de segurança, isolamento entre tenants ou migrações e tenta derrubá-lo escrevendo o teste que falharia. Outro modelo da mesma família a "rever outra vez" não serviria.
- **Achado fechado é controlo, não texto.** Os achados ficam em `.keel/revisao.json`, pelo `.keel/revisao.mjs`. Só uma nova ronda do revisor os dá como corrigidos; quem implementou só os fecha como não corrigidos, com o motivo. O guarda recusa o commit e o hook `Stop` não deixa a tarefa acabar enquanto houver um aberto.

## Os limites

- Nenhum destes estudos testou o Keel. O que se transfere é a direcção, não os números.
- O IFScale mede instruções de inclusão de palavras-chave num relatório; regras de código são outra coisa. O que se aproveita é a forma da queda e o viés de posição.
- O estudo de AGENTS.md mede taxa de sucesso em issues; não mede segurança nem consistência, que é para onde o núcleo do Keel aponta.
