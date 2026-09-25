# Regras — Salesforce: partilha, visibilidade e identidade

Prefixo `SFS`. ## Camadas de acesso e modelo declarativo de partilha

### SFS-001 — Fecha o OWD e abre por excepção

**Regra:** Define o org-wide default de cada objecto no nível mais restritivo que o negócio permita e concede o acesso que falta com hierarquia de papéis, sharing rules, teams ou partilha manual.
**Porquê:** O OWD é o único mecanismo que baixa o acesso base a registos; todas as outras camadas só o alargam, por isso um OWD demasiado aberto não se corrige mais acima.
**Como verificar:** Na configuração de sharing settings, cada objecto com dados sensíveis está em private ou controlled by parent; a spec justifica caso a caso qualquer public read/write e diz que mecanismo abre o acesso a quem precisa.
**Cursos:** 2

### SFS-002 — Permissões extra em permission sets, não em perfis novos

**Regra:** Quando um subconjunto de utilizadores precisa de permissões adicionais, cria um permission set ou um permission set group; não clones nem multipliques perfis para isso.
**Porquê:** O perfil é 1:1 com o utilizador, o que faz crescer o número de perfis até um por pessoa e torna a manutenção impossível; um utilizador pode receber vários permission sets.
**Como verificar:** O diff de metadata não acrescenta perfis quase iguais a um já existente; as excepções de permissões aparecem como permission sets com nome ligado à tarefa que habilitam.
**Cursos:** 2

### SFS-003 — Esconde campos com field-level security, nunca com a page layout

**Regra:** Para negar acesso a um campo sensível, retira-lhe a leitura na field-level security do perfil ou permission set; tirar o campo da page layout ou marcá-lo read only serve só para simplificar o ecrã.
**Porquê:** A FLS aplica-se a tudo no sistema; a page layout só àquela página, e o mesmo valor continua acessível por list view, relatório ou API.
**Como verificar:** Para cada campo classificado como sensível, o metadata mostra a FLS fechada nos perfis que não o podem ver; nenhum requisito de confidencialidade está implementado apenas por alteração de layout.
**Cursos:** 2

### SFS-004 — Diagnostica acesso pela tabela de partilha e por login as user

**Regra:** Antes de explicar porque é que alguém vê ou não vê um registo, consulta a tabela de partilha do objecto (identificador do registo, nível de acesso, causa da linha e utilizador ou grupo) e reproduz o caso com login as user.
**Porquê:** A causa da linha diz qual das camadas concedeu o acesso — posse, partilha manual, sharing rule, hierarquia — em vez de se adivinhar qual delas está a agir.
**Como verificar:** Um relato de incidente de visibilidade traz a consulta à tabela de partilha e o que o utilizador viu na sessão de login as user, não só a conclusão.
**Cursos:** 1

## Escala do modelo de partilha

### SFS-005 — Nenhum utilizador dono de mais de 10.000 registos de um objecto

**Regra:** Distribui a posse dos registos por vários utilizadores de modo a que nenhum passe os 10.000 registos do mesmo objecto; se for mesmo preciso ultrapassar, tira o papel a esse utilizador ou coloca-o num papel isolado no topo da hierarquia e fora dos grupos públicos usados como origem de sharing rules.
**Porquê:** É o ownership data skew: movê-lo na hierarquia ou dentro ou fora de um grupo obriga a um recálculo de partilha muito demorado.
**Como verificar:** Na spec de carga ou de atribuição, o critério de distribuição de posse está escrito; a contagem de registos por dono para cada objecto grande fica abaixo do limite.
**Cursos:** 1

### SFS-006 — Cargas em massa em série ou ordenadas pelo registo-pai

**Regra:** Ao actualizar em massa registos que apontam para um pai comum, reduz o tamanho do lote, processa em série ou ordena os registos pelo registo-pai antes de submeter.
**Porquê:** Com processamento paralelo, dois lotes que toquem no mesmo pai tentam bloqueá-lo ao mesmo tempo e a operação falha com erro de bloqueio de linha.
**Como verificar:** O script ou a configuração da carga fixa o modo série, ou ordena explicitamente pelo campo do pai; um job paralelo sobre objectos filho sem ordenação é um defeito.
**Cursos:** 1

### SFS-007 — Partilha por Apex dirigida a grupos, não a utilizadores

**Regra:** Quando partilhas registos por código, aponta a linha de partilha a um grupo público, não a um utilizador individual.
**Porquê:** Partilhar com utilizadores multiplica as linhas de partilha e o custo de as recalcular; o grupo absorve as mudanças de pessoas sem mexer nas linhas.
**Como verificar:** No código que cria registos de partilha, o campo de utilizador ou grupo recebe o identificador de um grupo; um identificador de utilizador só passa com justificação escrita.
**Cursos:** 1

## Segurança em código Apex

### SFS-008 — `with sharing` nas classes que acedem a registos

**Regra:** Declara `with sharing` em qualquer classe Apex que leia ou escreva registos em nome de um utilizador, e não contes com essa palavra-chave para impor CRUD ou FLS.
**Porquê:** Por omissão o Apex corre em modo sistema e ignora permissões, FLS e partilha; `with sharing` repõe apenas o acesso a registos.
**Como verificar:** Toda a classe com SOQL ou DML sobre dados de negócio tem `with sharing` na definição; onde faltar, o diff traz a razão.
**Cursos:** 1

### SFS-009 — Verifica CRUD e FLS com as classes Describe antes de tocar nos dados

**Regra:** Antes de uma SOQL ou de uma DML em código que corra em modo sistema, chama `isAccessible`, `isCreatable`, `isUpdatable` e `isDeletable` de `Schema.DescribeSObjectResult` no objecto, e os equivalentes de `Schema.DescribeFieldResult` nos campos em causa.
**Porquê:** `with sharing` não cobre nem permissões de objecto nem field-level security; sem estas verificações o código devolve campos e registos que o utilizador não pode ver.
**Como verificar:** Cada operação sobre dados numa classe em modo sistema é precedida da verificação correspondente à operação (leitura, criação, edição ou eliminação).
**Cursos:** 1

### SFS-010 — `WITH SECURITY_ENFORCED` nas queries, sem o tomar por completo

**Regra:** Acrescenta `WITH SECURITY_ENFORCED` às queries SOQL que devolvem dados ao utilizador e lembra-te de que a verificação só cobre o `SELECT` e o `FROM`, incluindo subqueries, e não o `WHERE` nem o `ORDER BY`.
**Porquê:** A cláusula lança excepção quando falta permissão a um campo ou objecto devolvido, mas um campo usado só para filtrar ou ordenar continua a ser lido sem verificação.
**Como verificar:** As queries de leitura levam a cláusula; onde o filtro usa um campo sensível que não vai no `SELECT`, há uma verificação explícita com `Schema.DescribeFieldResult`.
**Cursos:** 1

### SFS-011 — SOQL estático com bind variables, nunca concatenação de input

**Regra:** Constrói as queries de forma estática, passando o valor do utilizador como bind variable; só se a query tiver mesmo de ser dinâmica é que se sanitiza o input com `escapeSingleQuotes`.
**Porquê:** Numa query montada por concatenação, o utilizador fecha a condição com uma plica e acrescenta um `OR` que devolve tudo, incluindo registos apagados.
**Como verificar:** Procura no diff por queries montadas com concatenação de strings ou por chamadas a execução dinâmica de SOQL; cada uma tem de ser reescrita ou justificada e sanitizada.
**Cursos:** 1

### SFS-012 — Testes com asserções sobre o resultado e com `System.runAs`

**Regra:** Os testes de partilha verificam o resultado esperado com `System.assertEquals` e usam `System.runAs` para confirmar o que cada utilizador vê; os 75% de cobertura exigidos para o deploy são um mínimo da plataforma, não o critério de qualidade.
**Porquê:** Cobertura sem asserções não detecta erro nenhum; e `System.runAs` é o único modo de testar acesso a registos por utilizador, embora não imponha permissões nem FLS.
**Como verificar:** Cada método de teste de partilha tem pelo menos uma asserção sobre o número de registos ou sobre o nível de acesso, e corre como o dono, como quem recebeu a partilha e como quem não devia ver nada.
**Cursos:** 1

### SFS-013 — Todos os callouts antes de qualquer DML na mesma transacção

**Regra:** Sequencia a transacção de modo a fazer todos os callouts HTTP primeiro e só depois as operações DML.
**Porquê:** Um callout depois de uma DML na mesma transacção falha com "uncommitted work pending"; vários callouts seguidos antes da DML funcionam.
**Como verificar:** No método, a última chamada externa aparece antes do primeiro `insert`, `update` ou `upsert`; se a ordem não puder ser essa, o trabalho é partido em duas transacções.
**Cursos:** 1

## Identidade, OAuth e tokens

### SFS-014 — Não uses o username-password flow em produção

**Regra:** Não construas integrações sobre o OAuth 2.0 username-password flow; escolhe web server flow, client credentials ou JWT bearer conforme o caso.
**Porquê:** O fluxo faz circular a password em cada pedido, não suporta scopes nem refresh token, vem bloqueado por omissão numa org nova, e um dos cursos di-lo depreciado.
**Como verificar:** Nenhuma configuração ou script usa `grant_type` de password; a definição de org não tem os fluxos de username-password permitidos.
**Cursos:** 2

### SFS-015 — Web server flow com PKCE em vez do user agent flow

**Regra:** Quando o cliente não consegue guardar o client secret com segurança — aplicação de página única ou aplicação móvel —, usa o web server flow com PKCE em vez do user agent (implicit) flow, desde que o sistema alvo o suporte.
**Porquê:** O `code_challenge` enviado no pedido de autorização e o `code_verifier` enviado no pedido de token garantem que quem termina o fluxo é quem o começou; ambos os cursos apresentam o PKCE como o caminho recomendado.
**Como verificar:** O pedido de autorização leva `code_challenge` e o pedido de token leva `code_verifier`; o `code_challenge` é o SHA-256 do verifier codificado em base64 URL-safe.
**Cursos:** 2

### SFS-016 — Envia e confere o parâmetro `state`

**Regra:** Inclui um valor de `state` no pedido de autorização e compara-o com o valor devolvido antes de continuar o fluxo.
**Porquê:** Se o valor recebido não for igual ao enviado, o pedido foi alterado ou interceptado pelo caminho.
**Como verificar:** No código do fluxo, o `state` é gerado, guardado na sessão e comparado à chegada; um `state` enviado mas nunca verificado é um defeito.
**Cursos:** 1

### SFS-017 — Connected App com utilizadores aprovados pelo administrador

**Regra:** Põe "Permitted Users" da Connected App em "Admin approved users are pre-authorized" e autoriza o acesso por perfil ou por permission set; nunca deixes "All users may self-authorize".
**Porquê:** Com auto-autorização, qualquer utilizador da org obtém token pela aplicação sem controlo do administrador; com a aprovação prévia, quem não estiver autorizado recebe erro ao pedir o token.
**Como verificar:** Nas políticas de cada Connected App, o campo está em aprovação prévia e a lista de perfis ou permission sets autorizados está preenchida e é a mínima necessária.
**Cursos:** 1

### SFS-018 — No JWT bearer para Salesforce, só três scopes

**Regra:** Numa Connected App usada para JWT bearer com o Salesforce como alvo, selecciona apenas os scopes `api`, `web` e `refresh_token, offline_access`.
**Porquê:** Qualquer scope adicional parte o fluxo: o pedido de token com a assertion deixa de funcionar.
**Como verificar:** A lista de scopes seleccionados da aplicação tem exactamente esses e nada mais; um scope extra acrescentado num diff é motivo de rejeição.
**Cursos:** 1

### SFS-019 — Client credentials flow com utilizador de integração dedicado

**Regra:** Antes de activar o client credentials flow, cria um utilizador próprio com licença Salesforce Integration e perfil API-only de acesso mínimo, e indica-o no campo "Run As" da Connected App.
**Porquê:** O fluxo não tem utilizador interactivo: tudo o que a integração faz corre com as permissões do utilizador do "Run As", e um utilizador de pessoa daria à integração tudo o que essa pessoa pode fazer.
**Como verificar:** O "Run As" aponta para um utilizador de integração; esse utilizador tem licença de integração, perfil de acesso mínimo e nenhum papel atribuído.
**Cursos:** 1

### SFS-020 — Trata o refresh token como uma password

**Regra:** Guarda o refresh token com a mesma protecção que darias a uma password e revoga-o quando a integração deixa de ser precisa.
**Porquê:** O refresh token vale dias, meses ou até revogação explícita, e quem o tiver pode obter novos access tokens quando quiser.
**Como verificar:** O refresh token não aparece em logs, em ficheiros de configuração versionados nem em variáveis de ambiente de desenvolvimento partilhadas; está no mesmo cofre das outras credenciais.
**Cursos:** 1

### SFS-021 — Rotação de consumer key e secret em dois passos

**Regra:** Ao rotacionar as credenciais de uma Connected App, gera primeiro o par em estado staged, actualiza o cliente com os valores novos e só depois aplica a rotação.
**Porquê:** O par gerado fica inactivo até ser aplicado; aplicar antes de o cliente estar actualizado invalida o par anterior e parte as integrações a correr.
**Como verificar:** O procedimento de rotação escrito tem os três passos por esta ordem e diz quem confirma que o cliente já usa o par novo antes de se aplicar.
**Cursos:** 1

### SFS-022 — OAuth 2.0 autoriza, não autentica

**Regra:** Não uses a posse de um access token como prova de identidade de quem está do outro lado; para autenticar, usa SAML ou OpenID Connect com ID token.
**Porquê:** O OAuth 2.0 é um framework de autorização e o access token funciona como um cartão de hotel — diz o que se pode aceder, não quem é o portador; quem, quando e como autenticou só se responde com uma assertion SAML ou um ID token.
**Como verificar:** Nenhum fluxo de login deriva a identidade do utilizador de um access token; onde há login, há ID token validado ou assertion SAML.
**Cursos:** 1

## Verificação de identidade e políticas de login

### SFS-023 — MFA em todos os logins internos, inclusive por SSO

**Regra:** Exige verificação multifactor em todos os logins de utilizadores internos, tanto nos directos como nos que passam por um fornecedor de SSO, feita pelo fornecedor de identidade ou pelo Salesforce.
**Porquê:** É requisito contratual de acesso aos produtos Salesforce, e é a defesa mais eficaz contra phishing, credential stuffing e tomada de conta.
**Como verificar:** Nas definições de verificação de identidade, nenhum perfil interno tem a MFA dispensada; quando o login é por SSO, está documentado qual dos dois lados faz a verificação.
**Cursos:** 1

### SFS-024 — Login IP Ranges para bloquear, Trusted IP Ranges para dispensar o desafio

**Regra:** Quando o requisito é impedir o login fora de um intervalo de endereços, configura Login IP Ranges no perfil; usa Trusted IP Ranges da org só para dispensar o desafio de verificação a quem já pode entrar.
**Porquê:** Fora dos Login IP Ranges o login é recusado sem alternativa; fora dos Trusted IP Ranges o utilizador continua a poder entrar, bastando-lhe passar um método de verificação.
**Como verificar:** Para cada requisito de restrição por rede, o metadata mostra a definição no nível certo; um requisito de bloqueio implementado só com Trusted IP Ranges não cumpre.
**Cursos:** 2

## Segredos e credenciais externas

### SFS-025 — Credenciais de integração em named credentials, nunca no código

**Regra:** Guarda as credenciais e o endpoint de um sistema externo num External Credential com o seu Named Credential, e faz o callout pelo named credential; não escrevas URLs, chaves, tokens nem passwords no Apex.
**Porquê:** As credenciais ficam cifradas no objecto de credencial externa do utilizador e a plataforma trata da obtenção e renovação do token, o que elimina o código que de outro modo as manipularia — e as expunha.
**Como verificar:** Nenhum literal de chave, token ou password aparece em classes Apex; os callouts referem o named credential em vez de um URL completo.
**Cursos:** 1

### SFS-026 — Permission set com acesso ao principal antes de usar o named credential

**Regra:** Ao criar um External Credential, concede no permission set de quem vai fazer o callout o acesso ao objecto de credencial externa do utilizador e ao principal desse External Credential, antes de testar a integração.
**Porquê:** Sem essas duas permissões a chamada falha com mensagens que parecem de configuração da API — que o valor do tipo de principal não existe, ou que não foi possível aceder às credenciais — e perdem-se horas a procurar no sítio errado.
**Como verificar:** O permission set atribuído ao utilizador da integração lista o principal em causa; o diagnóstico de um erro de credenciais começa por confirmar isto.
**Cursos:** 1

### SFS-027 — API key como authentication parameter, não no valor do cabeçalho

**Regra:** Para uma API autenticada por chave, usa o protocolo de autenticação custom, guarda a chave como authentication parameter do principal e referencia-a no cabeçalho pela expressão de credencial; nunca escrevas a chave no valor do cabeçalho.
**Porquê:** Escrita no valor do cabeçalho, a chave fica visível a quem tiver acesso ao External Credential e pode ser copiada e usada noutro lado; como parâmetro de autenticação, é um campo secreto que não se lê depois de gravado.
**Como verificar:** No External Credential, o cabeçalho custom contém a referência à credencial e não o segredo; o parâmetro correspondente existe no principal.
**Cursos:** 1

### SFS-028 — Remote Site Settings para qualquer callout fora de named credential

**Regra:** Sempre que fizeres um callout HTTP directo em Apex sem named credential, acrescenta o domínio alvo a Remote Site Settings — incluindo o endpoint de token de outra org Salesforce.
**Porquê:** Sem essa entrada o callout falha por endpoint não autorizado, mesmo entre duas orgs Salesforce; a excepção é o domínio da própria org coincidir com o instance URL.
**Como verificar:** Para cada domínio chamado directamente em código, existe a entrada correspondente; produção e sandbox precisam das suas.
**Cursos:** 1

### SFS-029 — Na AWS, credenciais de um utilizador IAM de integração, nunca do root

**Regra:** Não geres credenciais de segurança para o utilizador root da conta AWS; cria um utilizador IAM dedicado à integração e dá-lhe as credenciais.
**Porquê:** As credenciais do root dão acesso total e irrestrito à conta e não se podem limitar; um utilizador de integração recebe só a política de que precisa.
**Como verificar:** As chaves configuradas no External Credential pertencem a um utilizador IAM criado para o efeito; a conta root não tem chaves de acesso activas.
**Cursos:** 1

## Endpoints públicos e webhooks

### SFS-030 — Valida a assinatura do webhook antes de tocar no payload

**Regra:** Num endpoint que recebe webhooks, começa por recalcular a assinatura a partir do corpo e do segredo de verificação e compará-la com a do cabeçalho usando comparação sensível a maiúsculas; se falhar, devolve 401 e termina o método com um `return` explícito.
**Porquê:** Sem validação, qualquer pedido — mesmo sem cabeçalho de assinatura — recebe 200 e o endpoint aceita dados falsos; uma comparação que ignore maiúsculas aceita assinaturas que não coincidem, e sem `return` o handler continua a processar o pedido rejeitado.
**Como verificar:** No handler, a validação é a primeira coisa a acontecer, a comparação é por igualdade exacta, e o ramo de falha devolve 401 e sai; o segredo de verificação vem de custom metadata, não de um literal no código.
**Cursos:** 1

### SFS-031 — Confirma na documentação o que se assina e como se codifica

**Regra:** Antes de escrever a validação, confirma na documentação do fornecedor qual é exactamente o payload assinado e em que codificação vem a assinatura, e implementa essas duas coisas tal como estão documentadas.
**Porquê:** Varia por fornecedor: o QuickBooks assina o corpo e envia o resultado em Base64, enquanto o Stripe assina a concatenação do timestamp, um ponto e o corpo, e envia o resultado em hexadecimal dentro de um cabeçalho com três partes.
**Como verificar:** O código da validação identifica o fornecedor, o campo do cabeçalho de onde sai a assinatura e a função de codificação usada; um `base64Encode` copiado de outra integração sem essa confirmação é um defeito.
**Cursos:** 1

### SFS-032 — Endpoint público corre como guest user: dá-lhe o acesso e depura-o a ele

**Regra:** Ao expor uma classe Apex REST por um site Experience Cloud, dá acesso explícito a essa classe no perfil do guest user do site, e activa os debug logs desse guest user quando precisares de diagnosticar.
**Porquê:** O pedido externo corre com a identidade do guest user, não com a de um utilizador normal; sem o acesso à classe, o endpoint não responde, e os logs do utilizador que está a testar não mostram nada.
**Como verificar:** No perfil do guest user do site estão as classes expostas e só essas; o pedido de diagnóstico refere o guest user do site pelo nome.
**Cursos:** 1
