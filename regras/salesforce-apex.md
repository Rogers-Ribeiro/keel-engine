# Regras — Salesforce: Apex

Prefixo `APX`. ## Antes de escrever Apex

### APX-001 — Declarativo antes de código

**Regra:** antes de escrever uma classe ou um trigger, verifica se o requisito é resolúvel por workflow rule, approval process, process ou flow; só quando nenhuma das quatro ferramentas declarativas chega é que se escreve Apex.
**Porquê:** o curso apresenta a solução declarativa como primeira opção sempre disponível, por custar menos a construir e a manter e por não consumir governor limits.
**Como verificar:** na spec de qualquer automação nova, procura a justificação de por que razão nenhuma ferramenta declarativa serve; sem ela, o Apex não passa.
**Cursos:** 1

## Triggers e bulkificação

### APX-002 — Um trigger por objecto

**Regra:** cria no máximo um trigger por objecto, com todos os eventos declarados nesse trigger.
**Porquê:** com vários triggers no mesmo objecto a ordem por que correm não é controlável, e o comportamento passa a depender de qual disparou primeiro.
**Como verificar:** conta os ficheiros de trigger por objecto; mais do que um é rejeitado, mesmo que cubram eventos diferentes.
**Cursos:** 1

### APX-003 — O trigger não tem lógica: delega para uma handler class

**Regra:** o corpo do trigger só contém condições sobre as variáveis de contexto e chamadas a métodos de uma handler class; essa classe tem um método por contexto (before insert, after insert, …).
**Porquê:** um trigger é difícil de testar e de reutilizar; com a lógica numa classe, cada contexto fica isolado num método com nome próprio.
**Como verificar:** no ficheiro do trigger não pode haver queries, DML, loops nem regras de negócio — só `if` sobre o contexto e chamadas de método.
**Cursos:** 1

### APX-004 — Nunca SOQL nem DML dentro de um for loop

**Regra:** dentro de um ciclo `for`, acumula os registos numa lista; a query e a instrução DML correm uma só vez, fora do ciclo.
**Porquê:** cada iteração consome uma query ou uma instrução do orçamento da transacção — 100 queries e 150 instruções — e com um lote grande a execução falha antes de terminar.
**Como verificar:** procura `[SELECT`, `insert`, `update`, `delete` e `upsert` entre as chavetas de um `for`; qualquer ocorrência é um defeito.
**Cursos:** 1

### APX-005 — Desenha para um lote, não para um registo

**Regra:** cada método de handler recebe uma lista ou um map de registos e trata-os todos; nunca assumas que a invocação traz um registo só.
**Porquê:** pela interface entra normalmente um registo, mas por Data Loader podem entrar até 200 de uma vez, e o código escrito para um registo falha aí.
**Como verificar:** as assinaturas dos métodos de handler recebem `List<...>` ou `Map<Id, ...>`; um método que receba um único sObject ou um `Id` isolado é um defeito.
**Cursos:** 1

## DML e excepções

### APX-006 — Sucesso parcial pede `Database.insert` com all-or-none a `false`

**Regra:** quando o falhanço de um registo não deve impedir os restantes, usa `Database.insert`, `Database.update` ou `Database.delete` com o parâmetro *all or none* a `false` e trata o `Database.SaveResult` devolvido; a instrução DML directa fica para quando o lote tem mesmo de ser tudo ou nada.
**Porquê:** a instrução directa faz falhar o lote inteiro por causa de um registo incompleto; o método da classe `Database` deixa passar os válidos e devolve o erro de cada um que falhou.
**Como verificar:** num caminho que processa lotes vindos de fora, confirma que o resultado devolvido é percorrido e que os erros são registados — não basta trocar a instrução pelo método.
**Cursos:** 1

### APX-007 — Só se lançam excepções personalizadas

**Regra:** cria uma classe de excepção que estenda `Exception` e cujo nome termine em "Exception", e lança-a com `throw`; nunca lances uma excepção de sistema.
**Porquê:** a plataforma recusa o `throw` de excepções de sistema, e o sufixo no nome é o que faz a classe herdar os construtores de `Exception` sem escrever código.
**Como verificar:** cada `throw` no diff aponta para uma classe do projecto cujo nome termina em `Exception`; um `throw new DmlException(...)` ou equivalente é um defeito.
**Cursos:** 1

## Segurança

### APX-008 — `with sharing` declarado, sempre

**Regra:** declara `with sharing` em toda a classe Apex que faça queries ou DML; usa `without sharing` apenas com motivo escrito no código.
**Porquê:** sem palavra-chave a classe fica `without sharing` e corre em modo de sistema, pelo que uma query dispara sobre registos que o utilizador autenticado não pode ver — e o curso mostra isso a acontecer numa demo.
**Como verificar:** toda a declaração `class` no diff tem `with sharing` ou `without sharing`; a omissão é um defeito, e o `without sharing` exige justificação.
**Cursos:** 1

### APX-009 — Input do utilizador entra por bind variable, nunca por concatenação

**Regra:** escreve a query em SOQL estático e liga o valor vindo do utilizador com `:variavel`; se o SOQL dinâmico for inevitável, passa cada valor por `escapeSingleQuotes` antes de o concatenar.
**Porquê:** o curso demonstra uma pesquisa em que o utilizador fecha a cláusula `WHERE` com uma plica e acrescenta uma condição própria, devolvendo todos os registos do objecto.
**Como verificar:** procura `Database.query` e strings de query montadas com `+`; cada valor externo tem de chegar por bind variable ou estar escapado.
**Cursos:** 1

## Callouts e credenciais

### APX-010 — Callouts primeiro, DML depois

**Regra:** numa transacção que faz callout e grava registos, todos os callouts correm antes de qualquer DML; o método de callout devolve os valores e a persistência acontece depois, fora dele.
**Porquê:** um callout depois de uma DML não confirmada falha com "uncommitted work pending" — o curso mostra o erro a aparecer ao actualizar a conta antes de criar as pastas no destino, e a ordem invertida a resolvê-lo.
**Como verificar:** segue a ordem das chamadas no método: nenhum `insert`/`update` pode preceder um `send` de `HttpRequest` na mesma transacção.
**Cursos:** 1

### APX-011 — Callout disparado por trigger vai para um método `@future(callout=true)`

**Regra:** um trigger nunca faz o callout directamente; chama um método estático anotado com `@future` e o atributo `callout=true`.
**Porquê:** a plataforma recusa callouts a partir de triggers ("callout from triggers are not currently supported"), e um método `@future` sem o atributo também não os faz.
**Como verificar:** no caminho trigger → handler, o método que prepara o `HttpRequest` tem de estar anotado com `@future(callout=true)`; a anotação sem o atributo é um defeito.
**Cursos:** 1

### APX-012 — Batch, Queueable e Scheduled que chamem HTTP implementam `Database.AllowsCallouts`

**Regra:** qualquer classe de Batch, Queueable ou Scheduled Apex que faça um callout declara também a interface `Database.AllowsCallouts`.
**Porquê:** sem a interface o callout falha com erro de demasiados callouts, mesmo quando é o primeiro da execução.
**Como verificar:** cruza as classes que implementam `Database.Batchable`, `Queueable` ou `Schedulable` com as que preparam um `HttpRequest`; todas as que estiverem nos dois conjuntos têm de declarar a interface.
**Cursos:** 1

### APX-013 — Chaves de API vivem no principal da External Credential, não no código nem no cabeçalho

**Regra:** guarda a chave como parâmetro de autenticação do principal da External Credential e referencia-a no cabeçalho por fórmula, `{!$Credential.<ExternalCredential>.<Parametro>}`; na Named Credential, desliga "Generate Authorization Header" e liga "Allow Formulas in HTTP Header".
**Porquê:** assim o valor da chave deixa de ser legível por quem abre a configuração ou o código, e o cabeçalho passa a ser montado pela plataforma; sem a opção de fórmulas ligada, a referência é enviada como texto e a chamada falha.
**Como verificar:** procura chaves e tokens literais em classes Apex e no campo de valor dos cabeçalhos; o valor tem de ser a fórmula, e o nome no meio dela é `Credential`, no singular.
**Cursos:** 1

### APX-014 — A External Credential exige acesso explícito num permission set

**Regra:** antes de usar uma Named Credential em Apex, cria (ou actualiza) um permission set com acesso à External Credential e ao seu principal, e atribui-o aos utilizadores que fazem o callout.
**Porquê:** sem essa atribuição o callout falha com erros que parecem de configuração da integração, quando o que falta é permissão — o curso trata o permission set como o primeiro passo, anterior à criação da própria Named Credential.
**Como verificar:** a cada External Credential nova corresponde uma entrada num permission set atribuído; o passo tem de aparecer na spec da integração, não só no código.
**Cursos:** 1

### APX-015 — Callout com endpoint literal obriga a Remote Site Settings

**Regra:** quando o callout usa um endpoint literal em vez de uma Named Credential, regista o domínio de destino em Remote Site Settings antes de o código correr.
**Porquê:** sem o registo, a chamada falha com "unauthorized endpoint" mesmo com um token de acesso válido — o curso mostra exactamente esse caso entre duas orgs Salesforce.
**Como verificar:** cada URL literal passada a `setEndpoint` tem de ter o domínio correspondente na lista de Remote Site Settings do ambiente de destino.
**Cursos:** 1

## Testes

### APX-016 — Cobertura sem asserção não conta

**Regra:** cada método de teste termina com pelo menos uma asserção que compare o valor esperado com o obtido (`System.assertEquals` ou `Assert.areEqual`), depois de `Test.stopTest()`.
**Porquê:** executar as linhas dá cobertura mas não diz nada sobre o resultado; os dois cursos insistem que a asserção é a única coisa que prova que o comportamento é o esperado, e uma asserção falhada bloqueia o deployment.
**Como verificar:** procura métodos `@isTest` sem nenhuma chamada de asserção; um teste que só invoca o método sob teste é rejeitado.
**Cursos:** 2

### APX-017 — A operação sob teste fica entre `Test.startTest()` e `Test.stopTest()`

**Regra:** prepara os dados antes de `Test.startTest()`, chama a operação sob teste entre os dois, e faz as asserções depois de `Test.stopTest()`; chama cada um exactamente uma vez por método de teste.
**Porquê:** o bloco entre as duas chamadas recebe um conjunto novo de governor limits, que é o que permite medir a operação sem contar a preparação dos dados; a plataforma só admite uma chamada de cada por método.
**Como verificar:** conta as ocorrências de `Test.startTest` e `Test.stopTest` por método (uma de cada) e confirma que a criação de dados fica antes da primeira.
**Cursos:** 2

### APX-018 — Código que depende de um callout testa-se com mock, incluindo o ramo de erro

**Regra:** cria uma classe que implemente `HttpCalloutMock` com o método `respond`, regista-a com `Test.setMock(HttpCalloutMock.class, new ...())` antes da operação que dispara o callout, e cria uma segunda mock com código de estado de erro para cobrir o ramo alternativo.
**Porquê:** um teste não pode fazer chamadas reais, pelo que sem mock o código que depende da resposta nunca é executado; com uma única mock de sucesso, o tratamento de erro fica por cobrir.
**Como verificar:** cada classe que faz callout tem uma mock de sucesso e uma de erro, e o `Test.setMock` aparece antes da DML ou da chamada que dispara a integração.
**Cursos:** 1

## Apex ao serviço do LWC

### APX-019 — Método exposto a LWC: `static` e `@AuraEnabled`, com `cacheable=true` só na leitura

**Regra:** todo o método Apex consumido por um LWC é `public` ou `global`, `static` e anotado `@AuraEnabled`; acrescenta `cacheable=true` apenas aos métodos que só lêem dados, e chama-os por `@wire`. Métodos que inserem, actualizam ou apagam ficam sem `cacheable` e chamam-se imperativamente.
**Porquê:** sem `static` e sem a anotação o método não é importável pelo componente; e um método `cacheable` não pode fazer DML, pelo que a escrita obriga sempre à chamada imperativa.
**Como verificar:** cruza cada `@AuraEnabled(cacheable=true)` com o corpo do método — qualquer DML lá dentro é um defeito; e confirma que os métodos de escrita são chamados imperativamente, não por `@wire`.
**Cursos:** 1
