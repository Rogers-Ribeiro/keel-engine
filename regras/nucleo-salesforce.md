# Núcleo Salesforce — o que vale em qualquer tarefa

Este é o núcleo de um projecto de Salesforce e não substitui os outros núcleos de `regras/`: MuleSoft, comércio digital e Python têm cada um o seu, e um projecto carrega os que lhe servem — um projecto só de Salesforce não carrega o de Python, e um de B2B Commerce carrega este e o `regras/nucleo-comercio-digital.md`. O resto está em `regras/<tema>.md` e carrega-se conforme o trabalho.

## Nunca

- SOQL ou DML dentro de um ciclo, nem código escrito para um registo só: **APX-004**, **APX-005**, **SFA-009**.
- Input do utilizador concatenado numa consulta SOQL: **APX-009**, **SFS-011**, **SFD-012**.
- Chaves, tokens, passwords ou endpoints no código ou no repositório: **SFX-003**, **APX-013**.
- DML antes dos callouts da mesma transacção, ou callout feito dentro do trigger: **APX-010**, **SFS-013**, **APX-011**.
- Esconder um campo pela page layout ou por record type em vez da field-level security, e atribuir perfis standard ou clonados por cada variação: **SFP-004**, **SFS-003**, **SFD-010**, **SFP-002**, **SFS-002**.
- Username-password flow, self-authorize na Connected App, scope de acesso total: **SFS-014**, **SFS-017**, **SFX-004**.

## Antes de escrever código

- O declarativo esgota-se antes de se propor Apex: **SFA-001**, **APX-001**, **SFP-017**; aprovar é approval process, apagar e pedir input ao utilizador são flow: **SFA-002**, **SFA-004**.
- A premissa pergunta-se primeiro, numa frase — o que é isto, para quem, e quem carrega no botão — e a quem não leu nada.
- Uma integração classifica-se num padrão antes de se escolher a tecnologia, e o fluxo OAuth sai de o cliente conseguir ou não guardar segredos: **SFX-020**, **SFX-001**.

## Configuração declarativa: acesso, dados e ambientes

- OWD no mais restrito que o negócio permita, acesso aberto por excepção e permissões extra em permission sets: **SFS-001**, **SFP-001**, **SFD-008**, **SFD-009**, **SFP-005**.
- Master-detail só com dependência real ou roll-up, muitos-para-muitos por objecto de junção, identificador externo em campo unique e external ID para o upsert, e um campo com dados não muda de tipo: **SFD-001**, **SFD-002**, **SFD-003**, **SFD-018**, **SFD-004**.
- Em volume, filtra por campo indexado abaixo do threshold, e nem 10.000 filhos por pai nem 10.000 registos por dono: **SFD-013**, **SFD-014**, **SFS-005**; a picklist restrita e a duplicate rule a bloquear poupam a limpeza depois: **SFD-005**, **SFD-006**.
- Antes de uma carga, exporta e desliga a automação: **SFD-016**, **SFD-019**, **SFD-015**; a estrutura ensaia-se em sandbox, o change set valida-se antes do deploy, e o deploy não acaba no deploy: **SFP-013**, **SFP-014**, **SFP-015**.
- Na loja, nada existe sem entitlement policy e entrada de price book activa, e o storefront só se valida depois da indexação de pesquisa: **SFP-018**, **SFP-019**.

## Ao escrever Apex e LWC

- Um trigger por objecto, sem lógica no corpo, a delegar numa handler class, com before para o próprio registo e after para os ligados: **APX-002**, **APX-003**, **SFA-008**, **SFA-010**.
- `with sharing` declarado, com CRUD e FLS verificados à parte: **APX-008**, **SFS-009**, **SFS-010**, **SFD-011**.
- Sucesso parcial pede `Database.*` com all-or-none a `false`, e só se lançam excepções próprias: **APX-006**, **SFA-011**, **APX-007**.
- Método consumido por LWC é `static` e `@AuraEnabled`, com `cacheable=true` só na leitura e `refreshApex` depois de gravar: **APX-019**, **LWC-015**, **LWC-016**.
- No LWC substitui-se o objecto em vez de mutar o campo, o DOM só se toca por `this.template` e cada loop leva `key`: **LWC-001**, **LWC-002**, **LWC-004**, **LWC-003**; eventos em minúsculas com a carga em `detail`, `@api` no que o pai preenche, subscrições guardadas e desfeitas: **LWC-010**, **LWC-011**, **LWC-009**, **LWC-012**.

## Testes

- A operação sob teste fica entre `Test.startTest()` e `Test.stopTest()`, cobertura sem asserção não conta, e a partilha testa-se com `System.runAs`: **APX-017**, **APX-016**, **SFS-012**.
- Callouts e sistemas externos entram por mock, com o ramo de erro também simulado: **APX-018**, **SFX-022**.

## Integrações e eventos

- Credenciais em External e Named Credential, com permission set para o principal, e o domínio registado quando não há named credential: **SFS-025**, **SFS-026**, **APX-014**, **SFX-008**, **LWC-017**.
- O acesso ao sistema externo vive numa classe própria, o callout disparado por trigger vai para assíncrono, o estado valida-se antes do corpo e a resposta mapeia-se para objecto da aplicação: **SFX-010**, **SFX-011**, **SFX-012**, **SFX-013**.
- Num webhook, a assinatura valida-se antes de se tocar no payload, com estado explícito e saída imediata ao rejeitar: **SFX-018**, **SFX-019**, **SFS-030**, **SFS-032**.
- Notificar por evento em vez de sondar, publicar depois da confirmação da transacção e auditar em registo próprio: **SFX-014**, **SFX-015**, **SFX-016**.

## Com IA generativa

- A recuperação corre com as permissões de quem pergunta e o que é sensível é mascarado antes de sair: **SFAI-001**, **SFAI-002**, **SFAI-004**.
- O prompt fecha com instrução de defesa, a resposta é pontuada antes de se mostrar, cada chamada fica registada, e os tópicos são por categoria concreta e testados fora do âmbito: **SFAI-003**, **SFAI-005**, **SFAI-006**, **SFAI-007**, **SFAI-008**.

## Os temas

`salesforce-plataforma` · `salesforce-automacao` · `salesforce-apex` · `salesforce-lwc` · `salesforce-dados` · `salesforce-seguranca` · `salesforce-integracao` · `salesforce-ia`
