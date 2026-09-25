# Regras — Salesforce: integração e APIs

Prefixo `SFX`. ## Autenticação e segredos

### SFX-001 — Escolher o fluxo OAuth pela capacidade do cliente guardar segredos

**Regra:** Escolhe o fluxo OAuth 2.0 respondendo a duas perguntas — o cliente é o dono do recurso? o cliente consegue guardar client ID e client secret em segurança? —; usa authorization code quando a aplicação corre num servidor que guarda os segredos, e PKCE quando não há servidor onde os guardar (aplicação de página única ou nativa).
**Porquê:** O curso apresenta esta árvore de decisão como o método certo de escolher o fluxo, em contraste com a prática comum de repetir o fluxo mais habitual sem pensar; um cliente sem sítio seguro para o segredo não pode usar um fluxo que o exige.
**Como verificar:** A spec ou o código nomeia o fluxo escolhido e diz onde ficam client ID e secret. Um cliente sem servidor a enviar client secret no pedido de token é uma falha.
**Cursos:** 1

### SFX-002 — Gerar o code challenge do PKCE com SHA-256, não com HMAC

**Regra:** No PKCE, gera o code verifier como string aleatória e o code challenge como digest SHA-256 desse verifier codificado em Base64 URL-safe; não uses uma função HMAC para produzir o challenge.
**Porquê:** O professor mostra que a API de HMAC só oferece variantes `hmacSHA256`, que não é o SHA-256 puro que o PKCE exige; o challenge tem de ser um digest, não um MAC com chave.
**Como verificar:** Procura no código a função que produz o challenge: tem de ser um digest SHA-256 do verifier, sem chave secreta, com o resultado em Base64 URL-safe (`/` e `+` substituídos, `=` removido).
**Cursos:** 1

### SFX-003 — Nenhum segredo de integração no código-fonte

**Regra:** Tira do código-fonte client ID, client secret, URLs de autorização e de token, e os segredos de verificação de webhooks; lê-os de configuração externa ao código.
**Porquê:** Em ambas as aulas o professor escreve primeiro o valor no código e corrige-o de seguida, dizendo que o segredo tem de ficar guardado em configuração e não no corpo da classe; no código fica visível a quem tenha acesso ao repositório.
**Como verificar:** Grep por literais de credenciais no diff (tokens, `secret`, `client_id`, chaves). Qualquer valor de segredo atribuído a uma constante no código é falha.
**Cursos:** 1

### SFX-004 — Pedir só os scopes necessários, nunca acesso total

**Regra:** Ao registar uma aplicação ligada, selecciona apenas os scopes de que a integração precisa; não peças o scope de acesso total («Full»).
**Porquê:** O professor diz explicitamente para não dar o acesso total em aplicações reais, porque passa a poder fazer tudo em nome do utilizador; o ecrã de consentimento revela ao utilizador o que foi pedido.
**Como verificar:** A spec lista os scopes pedidos e o que cada um serve. Um scope de acesso total, ou um scope sem justificação, é falha.
**Cursos:** 1

## Expor e desenhar APIs

### SFX-005 — Escolher o verbo HTTP pela intenção da operação

**Regra:** Usa GET só para ler (sem alterar nada no servidor), POST para criar, PATCH só para actualizar um recurso existente, PUT para criar ou actualizar, e DELETE para remover.
**Porquê:** A aula percorre anotação a anotação a semântica de cada verbo e insiste que PATCH não cria e que GET não altera nada — o cliente conta com essa semântica para decidir se pode repetir o pedido.
**Como verificar:** Lê o handler de cada rota: um GET que escreve, ou um PATCH que cria quando não encontra, é falha.
**Cursos:** 1

### SFX-006 — Deixar o caminho do recurso extensível desde o início

**Regra:** Declara o caminho de um endpoint de forma a aceitar segmentos adicionais (em Apex REST, terminando o `urlMapping` em asterisco), em vez de fixar o caminho exacto que a primeira versão usa.
**Porquê:** O professor apaga o asterisco em directo para mostrar que qualquer segmento a mais passa a devolver 404, e chama boa prática a deixá-lo, para poder estender o caminho mais tarde sem partir os pedidos existentes.
**Como verificar:** Procura declarações de rota que fixem o caminho completo. Se acrescentar um identificador ao fim do URL parte a rota, a regra não está cumprida.
**Cursos:** 1

### SFX-007 — Procurar o registo antes de o criar

**Regra:** Num endpoint que cria registos a partir de um pedido externo, procura primeiro um registo com o mesmo critério de identidade (o email, por exemplo) e devolve esse em vez de inserir um novo.
**Porquê:** O sistema chamador repete pedidos, e sem esta verificação cada repetição cria um duplicado; o professor constrói o método exactamente assim, devolvendo o contacto já existente quando o encontra.
**Como verificar:** No handler de criação tem de haver uma consulta pelo critério de identidade antes da escrita, e o caminho «já existe» tem de devolver o registo encontrado.
**Cursos:** 1

## Chamar sistemas externos

### SFX-008 — Registar o domínio do endpoint antes de o chamar

**Regra:** Antes de escrever a chamada, regista o domínio do serviço externo na lista de destinos autorizados da plataforma — Remote Site Settings para chamadas do lado do servidor, CSP Trusted Sites para chamadas feitas do browser.
**Porquê:** O professor diz que sempre que se chama um serviço externo é preciso inscrever o URL nessa lista, senão a chamada é bloqueada; e a aula do componente mostra que a chamada do lado do cliente precisa da outra lista.
**Como verificar:** Para cada endpoint novo no diff, confirma que existe a entrada correspondente na configuração, e do lado certo (servidor ou browser).
**Cursos:** 1

### SFX-009 — Fazer todas as chamadas externas antes de gravar

**Regra:** Dentro de uma transacção, faz todas as chamadas ao sistema externo antes de qualquer escrita na base de dados; se precisares de gravar entre chamadas, devolve os dados e deixa a persistência para fora da transacção que chama.
**Porquê:** O professor enumera as sequências possíveis e mostra que qualquer chamada feita depois de uma escrita falha com «uncommitted work pending»; a única ordem segura é chamadas primeiro, escrita depois.
**Como verificar:** Segue a ordem das instruções no método: uma escrita seguida de uma chamada externa no mesmo âmbito transaccional é falha, mesmo que haja chamadas antes.
**Cursos:** 1

### SFX-010 — Isolar o acesso ao sistema externo numa classe própria

**Regra:** Põe a autenticação e a chamada ao sistema externo numa classe dedicada a esse sistema, que não dependa de quem a invoca; o código que reage ao evento e o código da interface só chamam essa classe.
**Porquê:** O professor recusa pôr o método assíncrono dentro da classe que fala com o serviço, precisamente para essa classe não ficar a servir só o gatilho e poder ser invocada de qualquer lado.
**Como verificar:** A classe de acesso ao serviço não deve ter anotações nem parâmetros que só façam sentido para um chamador. Chamadas HTTP dentro de código de gatilho ou de componente de interface são falha.
**Cursos:** 1

### SFX-011 — Chamada externa disparada por um gatilho vai para execução assíncrona

**Regra:** Não faças a chamada HTTP dentro do gatilho de alteração de dados: delega-a num método assíncrono declarado para permitir chamadas externas (em Apex, `@future(callout=true)`), e verifica antes que o gatilho não está a correr já em contexto assíncrono ou em lote.
**Porquê:** A plataforma recusa a chamada feita de dentro do gatilho («callout from triggers are not currently supported») e o método assíncrono só a autoriza com o atributo explícito; o professor acrescenta a verificação de contexto para o gatilho não disparar em processamento em lote.
**Como verificar:** Nenhuma chamada HTTP directa no corpo de um gatilho; o método assíncrono chamado tem de declarar que permite chamadas externas.
**Cursos:** 1

### SFX-012 — Validar o código de estado antes de ler o corpo da resposta

**Regra:** Depois de enviar o pedido, verifica o código de estado da resposta e só processa o corpo no caminho de sucesso; trata o resto num ramo próprio, com a chamada envolvida em tratamento de excepções.
**Porquê:** Na aula o corpo só é lido dentro do ramo em que o estado é 200, e o ramo alternativo levanta a excepção — sem isto, um erro do serviço externo é desserializado como se fosse dados.
**Como verificar:** Procura desserializações do corpo que aconteçam antes ou fora da verificação do estado.
**Cursos:** 1

### SFX-013 — Converter a resposta externa num objecto próprio

**Regra:** Mapeia a resposta do serviço externo para um objecto da aplicação, com os campos que ela realmente usa, e liga a interface a esse objecto — não à estrutura devolvida pelo fornecedor.
**Porquê:** A aula constrói o objecto do componente campo a campo a partir do JSON recebido; o que a interface consome passa a ser um contrato da aplicação e não o formato do fornecedor.
**Como verificar:** Procura no diff estruturas de resposta em bruto (mapas genéricos, JSON desserializado sem tipo) a atravessar a fronteira para a camada de apresentação ou de negócio.
**Cursos:** 1

## Eventos e operações em lote

### SFX-014 — Notificar por evento em vez de o consumidor andar a perguntar

**Regra:** Quando um sistema externo precisa de saber que os dados mudaram, publica um evento a que ele subscreve; não o ponhas a consultar a origem de X em X minutos.
**Porquê:** A aula chama má ideia ao polling, porque gasta chamadas de API desnecessárias e o consumidor fica sempre a saber tarde; com subscrição a notificação sai no momento em que o evento acontece.
**Como verificar:** Procura tarefas agendadas que consultem a origem à procura de alterações. Se houver um canal de eventos disponível, é falha.
**Cursos:** 1

### SFX-015 — Publicar o evento só depois da transacção confirmar

**Regra:** Configura o evento para ser publicado depois da confirmação da transacção; só publica antes da confirmação com uma razão escrita para isso.
**Porquê:** Com publicação imediata, um erro posterior faz a transacção reverter mas o evento já saiu e não há como o desfazer — o subscritor fica a saber de dados que nunca chegaram a existir.
**Como verificar:** Confirma o comportamento de publicação na definição do evento; se for imediato, a spec tem de dizer porquê.
**Cursos:** 1

### SFX-016 — Registo próprio para auditar eventos publicados

**Regra:** Se precisares de auditar, listar ou reenviar eventos, grava tu o registo de cada publicação — identificador, resultado e conteúdo — num armazenamento consultável; não contes com o canal de eventos para isso.
**Porquê:** O professor responde à pergunta directa dizendo que não há forma de listar nem consultar os eventos publicados, e que quem quiser seguir falhas de integração tem de guardar o registo num objecto próprio.
**Como verificar:** Se a spec pede auditoria ou reenvio de eventos, tem de existir a tabela/objecto de registo e a escrita no momento da publicação.
**Cursos:** 1

### SFX-017 — Num pedido composto, avaliar o estado de cada sub-resposta

**Regra:** Num pedido que agrupa vários sub-pedidos, não tomes o código de estado global como resultado: percorre as sub-respostas e trata como sucesso apenas as que estão na gama 200–299.
**Porquê:** O professor mostra que o pedido composto devolve sempre 200, e que o resultado real de cada operação só se vê no estado dentro de cada sub-resposta.
**Como verificar:** O código que trata a resposta tem de iterar as sub-respostas; se só olhar para o estado do pedido inteiro, é falha.
**Cursos:** 1

## Webhooks

### SFX-018 — Validar a assinatura antes de processar o webhook

**Regra:** No receptor de um webhook, calcula a assinatura do corpo recebido com o segredo do fornecedor e compara-a com a do cabeçalho numa comparação sensível a maiúsculas e minúsculas, antes de tocar no conteúdo.
**Porquê:** O professor insiste em não usar comparação que ignore maiúsculas, porque a assinatura é sensível a isso; sem validação, qualquer pedido, mesmo sem cabeçalho de assinatura, é aceite.
**Como verificar:** A primeira coisa que o handler faz tem de ser a validação; procura comparações que ignorem maiúsculas e processamento do conteúdo antes da verificação.
**Cursos:** 1

### SFX-019 — Responder com estado explícito e sair ao rejeitar

**Regra:** O receptor de um webhook devolve um código de estado explícito — sucesso quando processou, 401 quando a assinatura não é válida — e termina a execução imediatamente a seguir a rejeitar o pedido.
**Porquê:** O fornecedor decide pelo código de estado se reenvia o evento; e o professor demonstra em directo que, sem a saída explícita, o resto do handler continua a correr sobre um pedido já rejeitado.
**Como verificar:** No ramo de assinatura inválida tem de haver o código 401 e a saída do método logo a seguir; nenhum caminho pode terminar sem código de estado definido.
**Cursos:** 1

## Desenhar e testar a integração

### SFX-020 — Classificar o requisito num padrão antes de escolher tecnologia

**Regra:** Antes de escolher a tecnologia, diz a que padrão de integração o requisito pertence (quem inicia, se é de entrada ou de saída, se espera resposta) e parte da melhor solução desse padrão; só desces para a solução subóptima depois de dizeres porque a de cima não serve.
**Porquê:** O professor organiza os seis padrões por melhor, boa e subóptima e define a subóptima como a que se usa quando a melhor não funciona — a escolha deixa de ser por hábito e passa a ser justificada.
**Como verificar:** A spec nomeia o padrão e a solução escolhida; se for uma solução subóptima, tem de dizer o que impede a de cima.
**Cursos:** 1

### SFX-021 — Validar a autenticação num cliente HTTP antes de escrever código

**Regra:** Faz o fluxo de autenticação e a primeira chamada ao endpoint num cliente HTTP (Postman ou equivalente) e só depois escreve o código da integração.
**Porquê:** O professor diz que, em vez de saltar logo para o código, faz a ligação primeiro no cliente HTTP porque assim se vê se a autenticação funciona antes de haver código, e a depuração fica muito mais fácil.
**Como verificar:** A tarefa de integração tem de registar a chamada validada (colecção, pedido guardado ou saída) antes do primeiro commit de código de chamada.
**Cursos:** 1

### SFX-022 — Simular também a resposta de erro nos testes da integração

**Regra:** Nos testes, substitui a chamada externa por uma resposta simulada e cria uma segunda simulação com código de estado de erro, para cobrir o ramo que trata a falha.
**Porquê:** A simulação de sucesso deixa o ramo de erro por executar; o professor cria uma segunda classe de simulação só com um código de estado diferente, precisamente para cobrir esse caminho.
**Como verificar:** Para cada integração testada tem de haver pelo menos dois casos: um com resposta de sucesso e um com estado de erro, e o segundo tem de afirmar o comportamento de falha.
**Cursos:** 1
