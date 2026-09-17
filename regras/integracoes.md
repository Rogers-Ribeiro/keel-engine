# Regras — integracoes

Prefixo `INT`. Regras confirmadas nas transcrições a 2026-09-17. Síntese de origem: [integracoes](https://github.com/Rogers-Ribeiro/keel/blob/main/conhecimento/integracoes.md). Decisões pendentes: [revisão](_revisao/integracoes.md).

## Autorização delegada com OAuth 2.0

### INT-001 — Authorization Code com PKCE em qualquer client

**Regra:** Quando a aplicação pede autorização a um utilizador, usa o grant Authorization Code com a extensão PKCE (`code_verifier` aleatório, `code_challenge` com SHA-256 + base64url e `code_challenge_method=S256`), mesmo que o client seja confidencial, sempre que o Authorization Server suporte PKCE.
**Porquê:** O código de autorização volta num redirect e pode ser interceptado; sem o `code_verifier`, um código roubado não serve para nada. O curso é explícito: se o Authorization Server suportar PKCE, usa-se em todo o lado, no servidor ou em client público, porque não há desvantagem.
**Como verificar:** No pedido de autorização tem de aparecer `code_challenge` e `code_challenge_method=S256`, e no pedido ao token endpoint o `code_verifier` correspondente; o verifier é gerado por pedido, com um gerador criptográfico (por exemplo `secrets`), e nunca é fixo nem reaproveitado.
**Fonte:** [OAuth §4, aula 35](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/enterprise-oauth-for-developers/transcricoes/035-deep-dive-pkce-extension.md) · [OAuth §3, aula 25](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/enterprise-oauth-for-developers/transcricoes/025-oauth-grant-types-summary.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/enterprise-oauth-for-developers/notas/04-grants-deep-dive-using-google-authorization-server.md)
**Cursos:** 1

### INT-002 — Nunca o grant Implicit

**Regra:** Não uses o grant Implicit (`response_type=token`) em nenhum client novo; onde ele aparecer, substitui-o por Authorization Code com PKCE.
**Porquê:** No Implicit o access token vem no próprio redirect e fica visível na barra de endereços, no histórico do browser e para scripts da página. O curso resume os grants dizendo que os únicos a usar são o Authorization Code (com ou sem PKCE) e o Client Credentials.
**Como verificar:** Procura `response_type=token` nos pedidos de autorização e access tokens lidos do fragmento ou da query string do redirect; ambos são sinal de Implicit.
**Fonte:** [OAuth §3, aula 25](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/enterprise-oauth-for-developers/transcricoes/025-oauth-grant-types-summary.md) · [OAuth §4, aula 35](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/enterprise-oauth-for-developers/transcricoes/035-deep-dive-pkce-extension.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/enterprise-oauth-for-developers/notas/03-oauth-2-0-fundamentals.md)
**Cursos:** 1

### INT-003 — Client público sem client secret

**Regra:** Uma aplicação que corra na máquina do utilizador — desktop, linha de comandos, agente local, app móvel ou código no browser — identifica-se só com o `client_id` e não leva client secret; se for preciso um client confidencial, esse regista-se à parte, com credenciais próprias.
**Porquê:** Nesses ambientes não há forma de guardar o secret em segurança: qualquer secret empacotado com a aplicação é extraível. O curso diz que o client id e o secret nunca devem ser empacotados numa app móvel ou numa aplicação em browser, e no desenho de uma aplicação desktop dá-se só client id, porque se espera PKCE.
**Como verificar:** No código do cliente local e na configuração que o acompanha não pode existir `client_secret` nem chamada ao token endpoint que o envie; o `client_id` pode ficar em configuração à vista.
**Fonte:** [OAuth §4, aula 29](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/enterprise-oauth-for-developers/transcricoes/029-google-authorization-server-client-registration.md) · [OAuth §9, aula 85](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/enterprise-oauth-for-developers/transcricoes/085-using-oauth-in-desktop-applications.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/enterprise-oauth-for-developers/notas/09-protecting-native-applications-desktop-mobile.md)
**Cursos:** 1

### INT-004 — Endpoints e capacidades tirados do discovery document

**Regra:** Lê os endpoints de um Authorization Server compatível com OpenID Connect em `.well-known/openid-configuration` em vez de os fixares no código, e confirma nesse mesmo documento que o grant e os scopes que vais usar estão na lista de suportados antes de implementar o fluxo.
**Porquê:** O documento devolve num só pedido o authorization endpoint, o token endpoint, o userinfo, o `jwks_uri` e as capacidades suportadas; endpoints copiados à mão ficam desactualizados sem aviso. O curso mostra também que o suporte varia entre servidores — o Google expõe `device_authorization_endpoint` e o grant `device_code`, o Okta não.
**Como verificar:** Nas settings deve estar o issuer ou o URL do documento de descoberta, não URLs de `/authorize`, `/token` ou `/jwks` escritos um a um; e a escolha do grant tem de estar justificada pelo `grant_types_supported` do servidor em causa.
**Fonte:** [OAuth §4, aula 30](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/enterprise-oauth-for-developers/transcricoes/030-finding-google-endpoints.md) · [OAuth §10, aula 89](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/enterprise-oauth-for-developers/transcricoes/089-device-code-grant-type.md) · [nota §4](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/enterprise-oauth-for-developers/notas/04-grants-deep-dive-using-google-authorization-server.md) · [nota §10](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/enterprise-oauth-for-developers/notas/10-protecting-applications-on-other-devices-tv-watches-etc.md)
**Cursos:** 1

### INT-005 — `state` gerado por pedido e validado na resposta

**Regra:** Gera um valor aleatório novo para o parâmetro `state` em cada pedido de autorização, guarda-o do lado do client e compara-o com o `state` devolvido no redirect; se não coincidir, rejeita o código sem o trocar por token.
**Porquê:** É assim que o client garante que a resposta que recebe corresponde a um pedido que ele próprio iniciou, e não a um pedido forjado por terceiros. O curso usa um `state` fixo apenas na demonstração e avisa que o client deve gerar um bom valor dinamicamente e confirmá-lo no regresso.
**Como verificar:** Procura `state` com valor constante ou ausente no pedido de autorização, e confirma que existe uma comparação explícita entre o valor guardado e o recebido antes da troca pelo token.
**Fonte:** [OAuth §4, aula 32](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/enterprise-oauth-for-developers/transcricoes/032-deep-dive-authorization-code-grant-type.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/enterprise-oauth-for-developers/notas/04-grants-deep-dive-using-google-authorization-server.md)
**Cursos:** 1

## Credenciais e sessão

### INT-006 — Credenciais de integração fora do código

**Regra:** Client id, client secret, utilizador, password, security token, servidor e porta de qualquer integração ficam em gestor de segredos, em variáveis de ambiente lidas por settings ou num ficheiro de configuração à parte, nunca escritos no código-fonte.
**Porquê:** São as credenciais da aplicação e têm de ser guardadas em local seguro — o curso de OAuth manda usar um sistema de gestão de segredos, o de FastAPI carrega tudo de `.env` para as settings e o de Salesforce isola-as num ficheiro próprio.
**Como verificar:** No diff não pode entrar nenhum valor de credencial literal; as chamadas a serviços externos vão buscar os valores a um objecto de settings ou ao gestor de segredos, e o ficheiro de configuração local está ignorado pelo git.
**Fonte:** [OAuth §3, aula 16](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/enterprise-oauth-for-developers/transcricoes/016-oauth-client-registration.md) · [FastAPI §18, aula 100](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/fastapi-guide/transcricoes/100-mail-client-setup.md) · [Salesforce §4, aula 34](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-integration-with-external-systems/transcricoes/34-host-external-application-on-your-local-machine-and-update-credentials-json-file.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/enterprise-oauth-for-developers/notas/03-oauth-2-0-fundamentals.md)
**Cursos:** 3

### INT-007 — Autenticar uma vez e reutilizar o token

**Regra:** Obtém o token ou a sessão uma vez e reutiliza-o em todos os pedidos seguintes ao mesmo serviço; só renova quando a API responder com erro de autorização ou de sessão expirada, e nunca autentiques outra vez a cada chamada.
**Porquê:** Depois do pedido de autenticação, o access token vai no cabeçalho `Authorization` dos pedidos seguintes e dispensa nova autenticação; repetir o login em cada chamada gasta uma ida ao servidor por pedido. É também o que o curso de OAuth resolve com o refresh token: o utilizador não volta a autenticar-se só porque o access token expirou.
**Como verificar:** No cliente do serviço externo, o token ou a sessão são estado do objecto (ou vêm de uma cache), não uma chamada de login dentro de cada método; a renovação aparece ligada ao tratamento do erro de autorização.
**Fonte:** [Salesforce §3, aula 25](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-integration-with-external-systems/transcricoes/25-authenticating-rest-api-users.md) · [OAuth §3, aula 23](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/enterprise-oauth-for-developers/transcricoes/023-oauth-grant-types-refresh-tokens-and-token-revocation.md) · [nota Salesforce](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-integration-with-external-systems/notas/03-creating-lightweight-integrations-with-the-force-com-rest-ap.md) · [nota OAuth](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/enterprise-oauth-for-developers/notas/03-oauth-2-0-fundamentals.md)
**Cursos:** 2

### INT-008 — Credencial só de leitura quando a integração só lê

**Regra:** Uma ferramenta que apenas consulta uma base de dados ou um serviço cloud liga-se com uma credencial dedicada que só tem permissão de leitura (`SELECT` na base de dados, `CloudWatchReadOnlyAccess` na AWS, "Monitoring Viewer" no GCP).
**Porquê:** A ferramenta que corre as queries não valida se uma query é destrutiva; a única barreira é a permissão da credencial. O curso cria um utilizador de leitura de propósito e diz que mais nada é preciso para visualizar os dados.
**Como verificar:** No script de criação do utilizador ou na política associada só pode haver leitura; a credencial de leitura é distinta da que a aplicação usa para escrever.
**Fonte:** [Grafana §12, aula 100](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/transcricoes/100-integration-of-grafana-with-mysql.md) · [Grafana §12, aula 102](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/transcricoes/102-integration-of-grafana-with-aws-cloudwatch.md) · [Grafana §12, aula 103](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/transcricoes/103-monitoring-google-cloud-platform-with-out-of-the-box-dashboards.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/grafana-prometheus-loki-alloy-tempo/notas/12-integration-with-other-datasources.md)
**Cursos:** 1

## Camada de integração

### INT-009 — Cada serviço externo atrás de um módulo dedicado

**Regra:** A ligação, a autenticação e as chamadas a um serviço externo ficam numa classe ou módulo próprio desse serviço; o código que serve pedidos ou reage a eventos recolhe os dados e delega, sem conhecer detalhes da ligação.
**Porquê:** É apresentado como a boa prática do lado do Salesforce — o trigger só vê que registos mudaram e toda a lógica de autenticação e de invocação fica na classe auxiliar, para se poder testar e reaproveitar. No curso de FastAPI o mesmo aparece como `NotificationService`: o resto da aplicação não sabe como é feita a ligação SMTP.
**Como verificar:** Nos handlers e nos observadores de eventos não pode haver construção de pedidos HTTP, cabeçalhos de autenticação nem credenciais; procura chamadas a um objecto de serviço em vez disso.
**Fonte:** [Salesforce §8, aula 63](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-integration-with-external-systems/transcricoes/63-create-trigger-on-the-parent-salesforce-system.md) · [FastAPI §18, aula 101](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/fastapi-guide/transcricoes/101-event-updates.md) · [nota Salesforce](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-integration-with-external-systems/notas/08-integrating-one-salesforce-org-to-another-salesforce-org-usi.md) · [nota FastAPI](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/fastapi-guide/notas/18-send-mail.md)
**Cursos:** 2

### INT-010 — Estado da resposta primeiro, objecto próprio depois

**Regra:** Antes de tocar no corpo de uma resposta externa, verifica o código de estado e trata o caso de erro; se for bem-sucedida, converte o corpo num objecto próprio da aplicação, campo a campo e só com os campos que usas, em vez de fazer circular a estrutura crua devolvida pelo serviço.
**Porquê:** O curso trata separadamente o `200` de qualquer outro estado, com `try/catch` à volta do pedido, e só depois desserializa o corpo; e monta um objecto com os campos de que a interface precisa, para a apresentação não depender do formato do fornecedor.
**Como verificar:** No cliente do serviço, procura desserialização do corpo antes de qualquer verificação de estado, e respostas devolvidas tal como vieram (dicionários genéricos a atravessar várias camadas) em vez de um modelo da aplicação.
**Fonte:** [Salesforce §10, aula 79](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-integration-with-external-systems/transcricoes/79-rest-api-callout-from-server-side-controller.md) · [Salesforce §10, aula 77](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-integration-with-external-systems/transcricoes/77-parse-web-service-response-on-the-ui.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/salesforce-integration-with-external-systems/notas/10-rest-api-callout-from-lwc-lightning-web-component.md)
**Cursos:** 1

### INT-011 — Tipos normalizados na fronteira, antes de comparar

**Regra:** Antes de comparar ou de usar um valor vindo de um sistema externo, garante que o tipo é o esperado: configura o cliente para descodificar as respostas e declara o mesmo tipo no modelo que recebe o valor; não compares o que a biblioteca devolveu com o que veio do pedido sem essa normalização.
**Porquê:** O curso de FastAPI perde tempo com um código de verificação que nunca coincide porque o valor vem do Redis em bytes e o do pedido em string, e resolve-o pondo o cliente a descodificar e o schema a usar string. O curso de Redis mostra o outro lado do mesmo problema: a biblioteca cliente converte os valores por sua conta, em silêncio, e o erro que aparece é do runtime da linguagem, não do servidor.
**Como verificar:** Na criação do cliente externo tem de estar a opção de descodificação (ou uma conversão explícita no ponto de leitura), e os campos correspondentes do schema e do valor guardado têm de declarar o mesmo tipo.
**Fonte:** [FastAPI §22, aula 117](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/fastapi-guide/transcricoes/117-verification-code.md) · [Redis §6, aula 38](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/redis-the-complete-developers-guide-p/transcricoes/038-issues-with-hset.md) · [nota FastAPI](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/fastapi-guide/notas/22-sms.md) · [nota Redis](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/redis-the-complete-developers-guide-p/notas/06-redis-has-gotcha-s.md)
**Cursos:** 2
