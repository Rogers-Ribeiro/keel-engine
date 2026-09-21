# Regras — Salesforce: automação e processos

Prefixo `SFA`. Regras confirmadas nas transcrições a 2026-09-21. Síntese de origem: [salesforce-automacao](https://github.com/Rogers-Ribeiro/keel/blob/main/conhecimento/salesforce-automacao.md). Decisões pendentes: [revisão](_revisao/salesforce-automacao.md).

## Escolher a ferramenta de automação

### SFA-001 — Declarativo antes de Apex

**Regra:** só escreve Apex para automatizar um requisito depois de mostrar que nenhuma das quatro ferramentas declarativas (workflow rule, Process Builder, approval process, flow) o resolve.
**Porquê:** o declarativo não exige código, é mantido por administradores e não consome governor limits; o Apex dá mais flexibilidade mas é muito mais caro de manter e precisa de developers.
**Como verificar:** na spec de cada automação nova em Apex tem de estar escrito que ferramenta declarativa foi considerada e porque não chega; um trigger novo sem essa justificação é rejeitado.
**Fonte:** [PD1 §4, aula 26](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/complete-salesforce-certified-platform-developer-i-course/transcricoes/26-3-2-when-to-use-declarative-process-automation-features-vs-apex.md) · [App Builder §12, aula 158](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-platform-app-builder/transcricoes/158-workflows-vs-flows-vs-process-builder-what-to-use-when.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/complete-salesforce-certified-platform-developer-i-course/notas/04-process-automation-and-logic-38.parte-1.md)
**Cursos:** 2

### SFA-002 — Aprovar um registo é sempre approval process

**Regra:** quando o requisito é um registo ser aprovado por uma ou mais pessoas, implementa um approval process; não reconstruas a aprovação com workflow rules, processos ou flows.
**Porquê:** é a única ferramenta da plataforma que automatiza a aprovação de registos, com o aprovador de cada passo, o bloqueio do registo e as acções de aprovação e rejeição.
**Como verificar:** procura, em automações que mudam um campo de "estado de aprovação" à mão, a ausência de um approval process; o pedido de aprovação deve partir de um botão, de uma acção "submit for approval" num flow ou de Apex.
**Fonte:** [PD1 §4, aula 26](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/complete-salesforce-certified-platform-developer-i-course/transcricoes/26-3-2-when-to-use-declarative-process-automation-features-vs-apex.md) · [Admin §17, aula 523](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-administrator/transcricoes/523-approval-processes.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-administrator/notas/17-workflow-process-automation-without-chatgpt-version.md)
**Cursos:** 2

### SFA-003 — Mais do que um if/then no mesmo objecto é Process Builder (API a confirmar)

**Regra:** quando a automação sobre um objecto tem de avaliar mais do que uma condição if/then, constrói um único Process Builder com vários critérios em vez de várias workflow rules.
**Porquê:** uma workflow rule só avalia uma condição, o que obriga a uma regra por critério e espalha o processo por várias peças; o Process Builder avalia os critérios em sequência num só sítio.
**Como verificar:** duas ou mais workflow rules activas no mesmo objecto, disparadas pelo mesmo evento e com critérios diferentes, são sinal de que o processo devia ser um só.
**Fonte:** [App Builder §12, aula 158](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-platform-app-builder/transcricoes/158-workflows-vs-flows-vs-process-builder-what-to-use-when.md) · [Admin §17, aula 526](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-administrator/transcricoes/526-introduction-to-processes-and-the-process-builder.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-platform-app-builder/notas/12-business-logic-and-process-automation.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-administrator/notas/17-workflow-process-automation-without-chatgpt-version.md)
**Cursos:** 2

### SFA-004 — Apagar registos ou pedir input ao utilizador obriga a flow

**Regra:** usa um flow sempre que o processo tiver de apagar registos ou recolher informação do utilizador em ecrãs; não tentes essas duas coisas com workflow rules ou com o Process Builder.
**Porquê:** o flow é a única das quatro ferramentas que apaga registos e a única que suporta interacção com o utilizador, com ecrãs, variáveis e ciclos.
**Como verificar:** numa spec que fale em apagar registos ou em guiar o utilizador por um wizard, a ferramenta escolhida tem de ser um flow; qualquer outra escolha está errada.
**Fonte:** [PD1 §4, aula 26](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/complete-salesforce-certified-platform-developer-i-course/transcricoes/26-3-2-when-to-use-declarative-process-automation-features-vs-apex.md) · [App Builder §12, aula 158](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-platform-app-builder/transcricoes/158-workflows-vs-flows-vs-process-builder-what-to-use-when.md) · [Admin §17, aula 527](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-administrator/transcricoes/527-creating-flows-with-the-flow-builder.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/complete-salesforce-certified-platform-developer-i-course/notas/04-process-automation-and-logic-38.parte-1.md)
**Cursos:** 3

## Automação declarativa em produção

### SFA-005 — Clonar uma versão nova antes de mexer numa automação activa

**Regra:** para corrigir um Process Builder ou um flow já activo, clona-o para uma versão nova, altera essa versão e só a activa depois de confirmar a correcção.
**Porquê:** a versão activa fica em modo só-leitura e activar a versão nova desactiva automaticamente a anterior, o que mantém sempre uma versão boa a correr e permite voltar atrás.
**Como verificar:** no histórico de versões, cada correcção corresponde a uma versão nova activada; uma automação que muda sem versão nova indica edição directa.
**Fonte:** [Admin §17, aula 526](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-administrator/transcricoes/526-introduction-to-processes-and-the-process-builder.md) · [App Builder §4, aula 35](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-platform-app-builder/transcricoes/035-advanced-flows.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-administrator/notas/17-workflow-process-automation-without-chatgpt-version.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-platform-app-builder/notas/04-business-logic-and-process-automation.md)
**Cursos:** 2

### SFA-006 — Verificar a reavaliação antes de activar um field update (API a confirmar)

**Regra:** antes de activar uma workflow rule com field update, verifica a opção "reevaluate workflow rules after field changes" e confirma que nenhuma outra regra do objecto devolve o campo ao valor anterior.
**Porquê:** com essa opção marcada, o field update reavalia todas as regras do objecto; duas regras que se contrariam (uma põe "cold", outra põe "warm") dão um efeito ping-pong ou um ciclo infinito.
**Como verificar:** para cada field update, lista as regras activas do mesmo objecto cujos critérios usem o campo actualizado; se alguma o escrever no sentido inverso, a reavaliação não pode ficar ligada.
**Fonte:** [App Builder §12, aula 159](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-platform-app-builder/transcricoes/159-ramifications-of-field-updates-and-potential-for-recursion.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-platform-app-builder/notas/12-business-logic-and-process-automation.md)
**Cursos:** 1

### SFA-007 — Record-triggered flow que actua sobre outros registos é after-save

**Regra:** num record-triggered flow que actualize outros registos, crie registos ou dispare acções como enviar e-mail, escolhe o disparo after-save; reserva o before-save para alterar campos do próprio registo antes de ele ser gravado.
**Porquê:** é o modo de disparo optimizado para acções sobre registos relacionados; o before-save existe para mudar o registo que despoletou o flow.
**Como verificar:** abre cada record-triggered flow e compara o momento do disparo com os elementos que contém — Create Records, Update Records sobre outro objecto ou acções são incompatíveis com before-save.
**Fonte:** [App Builder §4, aula 35](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-platform-app-builder/transcricoes/035-advanced-flows.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-platform-app-builder/notas/04-business-logic-and-process-automation.md)
**Cursos:** 1

## Apex: triggers e bulkificação

### SFA-008 — Um trigger por objecto, com a lógica numa handler class

**Regra:** escreve um único trigger por objecto e não deixes lógica no corpo dele: o trigger só chama métodos de uma handler class, um método por contexto (before insert, after insert, …).
**Porquê:** com vários triggers no mesmo objecto perde-se o controlo da ordem por que correm, e um trigger é difícil de testar — a lógica numa classe é testável e reutilizável.
**Como verificar:** no diff, um trigger novo num objecto que já tem trigger é motivo de rejeição; dentro do trigger só devem aparecer `if` de contexto e chamadas a métodos da handler class.
**Fonte:** [PD1 §4, aula 45](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/complete-salesforce-certified-platform-developer-i-course/transcricoes/45-3-9-apex-triggers-pattern-for-efficient-data-processing.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/complete-salesforce-certified-platform-developer-i-course/notas/04-process-automation-and-logic-38.parte-2.md)
**Cursos:** 1

### SFA-009 — Nem SOQL nem DML dentro de um for loop

**Regra:** não ponhas consultas SOQL nem instruções DML dentro de um for loop; faz a consulta fora do loop e guarda o resultado numa lista, e acumula os registos a gravar numa lista para uma única operação no fim.
**Porquê:** o trigger pode receber 200 registos de uma vez, por exemplo vindos do Data Loader, e os governor limits contam por transacção — um DML por iteração passa facilmente o limite de 150 instruções.
**Como verificar:** procura `[SELECT`, `insert`, `update`, `delete` ou `upsert` dentro do corpo de um `for` em triggers e handler classes; qualquer ocorrência é um erro.
**Fonte:** [PD1 §4, aula 45](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/complete-salesforce-certified-platform-developer-i-course/transcricoes/45-3-9-apex-triggers-pattern-for-efficient-data-processing.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/complete-salesforce-certified-platform-developer-i-course/notas/04-process-automation-and-logic-38.parte-2.md)
**Cursos:** 1

### SFA-010 — before para o próprio registo, after para registos ligados

**Regra:** usa eventos before para validar ou alterar campos do registo que despoletou o trigger, e eventos after para criar ou ligar outros registos a esse registo.
**Porquê:** num trigger before o registo ainda não foi gravado e não tem Id, mas altera-se sem instrução DML; num trigger after o Id já existe, e é ele que permite ligar os registos novos ao que despoletou o trigger.
**Como verificar:** qualquer leitura do Id do registo em contexto before insert é um erro; alterações a campos do próprio registo feitas num contexto after (e gravadas com DML) devem passar para before.
**Fonte:** [PD1 §4, aula 43](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/complete-salesforce-certified-platform-developer-i-course/transcricoes/43-3-8-apex-triggers.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/complete-salesforce-certified-platform-developer-i-course/notas/04-process-automation-and-logic-38.parte-1.md)
**Cursos:** 1

### SFA-011 — Sucesso parcial com os métodos da classe Database

**Regra:** quando o processamento de uma lista deve continuar apesar de um registo falhar, usa `Database.insert`, `Database.update` ou `Database.delete` com o parâmetro all-or-none a `false`, e trata o resultado devolvido em vez de ignorar as falhas.
**Porquê:** a instrução DML isolada é tudo-ou-nada — um registo sem um campo obrigatório reverte o lote inteiro; os métodos da classe `Database` deixam passar os registos válidos e devolvem o erro de cada um.
**Como verificar:** cada chamada com all-or-none a `false` tem de ter tratamento do resultado (`isSuccess()`, `getErrors()`); e uma instrução DML isolada sobre uma lista carregada de fora do sistema é sinal de que devia ser um método `Database`.
**Fonte:** [PD1 §4, aula 41](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/complete-salesforce-certified-platform-developer-i-course/transcricoes/41-3-7-soql-sosl-and-dml-part-4-dml.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/complete-salesforce-certified-platform-developer-i-course/notas/04-process-automation-and-logic-38.parte-1.md)
**Cursos:** 1

## Segurança do Apex

### SFA-012 — Classes Apex com with sharing por omissão

**Regra:** declara as classes Apex com `with sharing` e usa `without sharing` só com um motivo escrito; nunca contes com `with sharing` para proteger acesso a objectos ou a campos.
**Porquê:** sem palavra-chave, a classe é `without sharing` e corre em system mode — uma query chamada por um utilizador sem acesso devolve e altera registos de toda a org. O `with sharing` impõe a partilha de registos, mas não o CRUD nem a field-level security.
**Como verificar:** no diff, toda a classe nova sem `with sharing` na declaração é rejeitada; onde houver `without sharing`, tem de existir comentário ou spec a justificar.
**Fonte:** [PD1 §4, aula 52](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/complete-salesforce-certified-platform-developer-i-course/transcricoes/52-3-13-security-in-apex.md) · [PD1 §4, aula 54](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/complete-salesforce-certified-platform-developer-i-course/transcricoes/54-3-15-programmatic-techniques-to-prevent-security-vulnerabilities.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/complete-salesforce-certified-platform-developer-i-course/notas/04-process-automation-and-logic-38.parte-2.md)
**Cursos:** 1

### SFA-013 — SOQL estático com bind variables, nunca concatenação

**Regra:** constrói as consultas como SOQL estático com o valor passado por bind variable; se a query tiver mesmo de ser dinâmica, passa cada valor vindo do utilizador por `String.escapeSingleQuotes` antes de o concatenar.
**Porquê:** uma query dinâmica montada por concatenação deixa o utilizador fechar a cláusula `WHERE` com uma aspa e um parêntesis e trocar a lógica da consulta, devolvendo registos que não devia ver.
**Como verificar:** procura `Database.query` e strings de query com `+` ou `&` sobre variáveis de input; sem `escapeSingleQuotes`, é falha de segurança.
**Fonte:** [PD1 §4, aula 54](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/complete-salesforce-certified-platform-developer-i-course/transcricoes/54-3-15-programmatic-techniques-to-prevent-security-vulnerabilities.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/complete-salesforce-certified-platform-developer-i-course/notas/04-process-automation-and-logic-38.parte-2.md)
**Cursos:** 1

## Apex ao serviço do declarativo

### SFA-014 — Expor Apex a processos e flows com @InvocableMethod

**Regra:** expõe os métodos Apex chamados por processos e flows com a anotação `@InvocableMethod`; só recorre à interface `Process.Plugin` quando precisares de um tipo que a anotação não suporta.
**Porquê:** as duas opções fazem o mesmo, mas a Salesforce recomenda a anotação e a classe que implementa `Process.Plugin` é muito mais extensa.
**Como verificar:** no diff, uma classe nova com `implements Process.Plugin` tem de justificar o tipo que obriga a isso; caso contrário, converte-se em `@InvocableMethod`.
**Fonte:** [PD1 §4, aula 55](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/complete-salesforce-certified-platform-developer-i-course/transcricoes/55-3-16-using-declarative-functionality-and-apex-together.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/complete-salesforce-certified-platform-developer-i-course/notas/04-process-automation-and-logic-38.parte-2.md)
**Cursos:** 1
