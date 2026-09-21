# Núcleo Salesforce/MuleSoft — o que vale em qualquer tarefa

Este é o núcleo de um projecto de Salesforce, MuleSoft ou comércio digital, e não substitui o `regras/nucleo.md`, que é o núcleo do domínio Python: um projecto carrega um ou outro conforme a stack, e um projecto que seja só Salesforce não carrega o de Python. O resto está em `regras/<tema>.md` e carrega-se conforme o trabalho; para o que não estiver aqui nem lá, pesquisa no MCP `cursos`.

## Nunca

- SOQL ou DML dentro de um ciclo, nem código escrito para um registo só: **APX-004**, **APX-005**, **SFA-009**.
- Input do utilizador concatenado numa consulta, em SOQL ou em SQL: **APX-009**, **SFS-011**, **SFD-012**, **MULD-021**.
- Chaves, tokens, passwords ou endpoints no código ou no repositório: **SFS-025**, **SFX-003**, **APX-013**, **MULA-024**.
- DML antes dos callouts da mesma transacção, ou callout feito dentro do trigger: **APX-010**, **SFS-013**, **APX-011**.
- Esconder um campo pela page layout ou por record type em vez da field-level security, e atribuir perfis standard ou clonados por cada variação: **SFP-004**, **SFS-003**, **SFD-010**, **SFP-002**, **SFS-002**.
- Username-password flow, self-authorize na Connected App, scope de acesso total: **SFS-014**, **SFS-017**, **SFX-004**; e nenhuma escrita fora de uma transacção: **COM-011**.

## Antes de escrever código

- O declarativo esgota-se antes de se propor Apex: **SFA-001**, **APX-001**, **SFP-017**; aprovar é approval process, apagar e pedir input ao utilizador são flow: **SFA-002**, **SFA-004**.
- Uma integração classifica-se num padrão antes de se escolher a tecnologia e o fluxo OAuth sai de o cliente conseguir ou não guardar segredos: **SFX-020**, **SFX-001**; a especificação da API é aprovada e simulada antes da implementação, e as validações vivem nela: **MULD-001**, **MULA-005**, **MULA-010**.
- Cada camada justifica-se — Process API só para combinar System APIs, Experience API só para audiências diferentes, System API sem transformar —, cada API é um bounded context e quem chama é que se adapta: **MULA-001**, **MULA-002**, **MULA-003**, **MULA-008**, **MULA-009**.

## Configuração declarativa: acesso, dados e ambientes

- OWD no mais restrito que o negócio permita, acesso aberto por excepção e permissões extra em permission sets: **SFS-001**, **SFP-001**, **SFD-008**, **SFD-009**, **SFP-005**.
- Master-detail só com dependência real ou roll-up, muitos-para-muitos por objecto de junção, identificador externo em campo unique e external ID para o upsert, e um campo com dados não muda de tipo: **SFD-001**, **SFD-002**, **SFD-003**, **SFD-018**, **SFD-004**.
- Em volume, filtra por campo indexado abaixo do threshold, e nem 10.000 filhos por pai nem 10.000 registos por dono: **SFD-013**, **SFD-014**, **SFS-005**; a picklist restrita e a duplicate rule a bloquear poupam a limpeza depois: **SFD-005**, **SFD-006**.
- Antes de uma carga, exporta e desliga a automação: **SFD-016**, **SFD-019**, **SFD-015**; a estrutura ensaia-se em sandbox, o change set valida-se antes do deploy, e o deploy não acaba no deploy: **SFP-013**, **SFP-014**, **SFP-015**, **COM-001**.
- Na loja, nada existe sem entitlement, categoria, entrada de price book activa e reindexação: **COM-018**, **COM-019**, **COM-020**, **SFP-018**.

## Ao escrever Apex e LWC

- Um trigger por objecto, sem lógica no corpo, a delegar numa handler class, com before para o próprio registo e after para os ligados: **APX-002**, **APX-003**, **SFA-008**, **SFA-010**.
- `with sharing` declarado, com CRUD e FLS verificados à parte: **APX-008**, **SFS-009**, **SFS-010**, **SFD-011**.
- Sucesso parcial pede `Database.*` com all-or-none a `false`, e só se lançam excepções próprias: **APX-006**, **SFA-011**, **APX-007**.
- Método consumido por LWC é `static` e `@AuraEnabled`, com `cacheable=true` só na leitura e `refreshApex` depois de gravar: **APX-019**, **LWC-015**, **LWC-016**.
- No LWC substitui-se o objecto em vez de mutar o campo, o DOM só se toca por `this.template` e cada loop leva `key`: **LWC-001**, **LWC-002**, **LWC-004**, **LWC-003**; eventos em minúsculas com a carga em `detail`, `@api` no que o pai preenche, subscrições guardadas e desfeitas: **LWC-010**, **LWC-011**, **LWC-009**, **LWC-012**.

## Testes

- A operação sob teste fica entre `Test.startTest()` e `Test.stopTest()`, cobertura sem asserção não conta, e a partilha testa-se com `System.runAs`: **APX-017**, **APX-016**, **SFS-012**; no MuleSoft o pipeline falha abaixo dos 80%: **MULD-026**.
- Callouts e sistemas externos entram por mock, com o ramo de erro também simulado: **APX-018**, **SFX-022**, **MULD-025**.

## Integrações, eventos e operação

- Credenciais em External e Named Credential, com permission set para o principal, e o domínio registado quando não há named credential: **SFS-025**, **SFS-026**, **APX-014**, **SFX-008**, **LWC-017**.
- O acesso ao sistema externo vive numa classe própria, o callout disparado por trigger vai para assíncrono, o estado valida-se antes do corpo e a resposta mapeia-se para objecto da aplicação: **SFX-010**, **SFX-011**, **SFX-012**, **SFX-013**.
- Num webhook, a assinatura valida-se antes de se tocar no payload, com estado explícito e saída imediata ao rejeitar: **SFX-018**, **SFX-019**, **SFS-030**, **SFS-032**.
- Notificar por evento em vez de sondar, publicar depois da confirmação da transacção e auditar em registo próprio: **SFX-014**, **SFX-015**, **SFX-016**; a mensagem confirma-se no fim do processamento e a que esgota reentregas vai para dead letter queue: **MULA-018**, **MULA-019**.
- Timeout explícito em cada chamada e só depois retry, circuit breaker e fallback; repete-se só o transitório, somam-se as camadas de reintento e comparam-se com o SLA: **MULA-014**, **MULA-015**, **MULA-016**, **MULD-015**, **MULA-017**, **COM-004**.
- Erros num handler global com o caso genérico em último, regra de negócio com tipo próprio, resposta que diz o que corrigir, e correlation ID propagado e reaplicado: **MULA-011**, **MULA-012**, **MULD-012**, **MULD-010**, **MULD-017**, **MULA-020**.
- Watermark e estado partilhado em armazenamento persistente com validade, configuração e credenciais por ambiente, nunca editadas à mão depois da promoção: **MULA-021**, **MULD-022**, **MULD-018**, **MULD-020**, **COM-002**, **COM-003**.

## Com IA generativa

- A recuperação corre com as permissões de quem pergunta e o que é sensível é mascarado antes de sair: **SFAI-001**, **SFAI-002**, **SFAI-004**.
- O prompt fecha com instrução de defesa, a resposta é pontuada antes de se mostrar, cada chamada fica registada, e os tópicos são por categoria concreta e testados fora do âmbito: **SFAI-003**, **SFAI-005**, **SFAI-006**, **SFAI-007**, **SFAI-008**.

## Os temas

`salesforce-plataforma` · `salesforce-automacao` · `salesforce-apex` · `salesforce-lwc` · `salesforce-dados` · `salesforce-seguranca` · `salesforce-integracao` · `salesforce-ia` · `mulesoft-desenvolvimento` · `mulesoft-arquitetura` · `comercio-digital`
