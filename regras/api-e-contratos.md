# Regras — api-e-contratos

Prefixo `API`. ## Esquemas como contrato de dados

### API-001 — Validar o corpo e a resposta com modelos Pydantic

**Regra:** tipa o corpo de cada endpoint com um modelo Pydantic e declara o esquema da resposta (no tipo de retorno ou em `response_model`); nunca deixes um pedido ou uma resposta com o tipo `dict[str, Any]`.
**Porquê:** com um dicionário livre não há validação nenhuma por campo — um peso "gordo" e um conteúdo `19` são aceites sem erro — e a documentação gerada não diz que campos existem. O `response_model` também filtra da resposta os campos que não pertencem ao esquema.
**Como verificar:** nenhuma assinatura de endpoint tem `dict` ou `dict[str, Any]` como tipo do corpo ou do retorno; cada rota tem tipo de retorno tipado ou `response_model`.
**Cursos:** 1

### API-002 — Um esquema por caso de uso, com base comum

**Regra:** define esquemas distintos para leitura, criação e actualização do mesmo recurso (`XRead`, `XCreate`, `XUpdate`) e põe os campos partilhados numa classe base comum.
**Porquê:** um modelo único obriga o cliente a enviar na criação campos que são geridos pelo servidor (o estado do envio, por exemplo) e a herança evita repetir os campos comuns em cada esquema.
**Como verificar:** nenhum modelo aparece ao mesmo tempo como corpo de criação e como esquema de resposta; os campos repetidos entre esquemas do mesmo recurso estão numa base comum.
**Cursos:** 1

### API-003 — `Enum` para campos com um conjunto fechado de valores

**Regra:** quando os valores válidos de um campo são um conjunto fechado e conhecido, declara-o com um `Enum` (herdando também de `str` quando os valores são texto) em vez de o validar com `if` ou de o deixar como string livre.
**Porquê:** uma string livre aceita qualquer valor — o exemplo do curso aceita o estado "nowhere" para um envio; com o `Enum`, o pedido é rejeitado com um erro que lista os valores possíveis, e a documentação passa a mostrá-los.
**Como verificar:** nenhum campo de estado, tipo ou categoria está tipado como `str` solto; não há validações manuais de pertença a uma lista de valores dentro do handler.
**Cursos:** 1

### API-004 — Restrições de negócio no `Field`, não no handler

**Regra:** exprime os limites de um campo no próprio esquema com `Field` (`ge`, `lt`, `le`, `max_length`, `default_factory`) em vez de os verificar com código dentro do endpoint.
**Porquê:** a restrição passa a fazer parte do contrato e aparece na documentação, e o erro devolvido diz qual o campo e qual o limite violado; o curso apaga o `if` do handler assim que move a verificação para o `Field`.
**Como verificar:** no diff, cada limite numérico ou de comprimento está no esquema; o handler não tem `if` a comparar valores de campos com constantes.
**Cursos:** 1

### API-005 — Actualização parcial com campos opcionais e `exclude_none`

**Regra:** num endpoint de actualização parcial, torna todos os campos do esquema opcionais (`T | None = None`) e aplica ao recurso apenas `model_dump(exclude_none=True)`.
**Porquê:** sem isto, os campos que o cliente não enviou chegam como `None` e são gravados por cima dos dados existentes, violando restrições `not null`; exigir todos os campos, em alternativa, obriga o cliente a reenviar o que não quer alterar.
**Como verificar:** o esquema de actualização não tem campos obrigatórios; qualquer `model_dump()` usado antes de escrever leva `exclude_none=True`.
**Cursos:** 1

## Rotas, verbos e erros

### API-006 — Escolher o verbo HTTP pela intenção da operação

**Regra:** GET só lê e não altera nada no servidor, POST cria, PATCH actualiza parcialmente e DELETE remove; usa PUT apenas quando o cliente envia mesmo o recurso completo para substituir o existente.
**Porquê:** é o par (caminho, método) que identifica a rota e o verbo é o que comunica a intenção a quem consome a API; usar PUT como "actualizar" genérico obriga o cliente a reenviar todos os campos e falha com erro de validação quando ele só quer mudar um.
**Como verificar:** nenhum GET escreve no armazenamento; endpoints que aceitam campos opcionais estão em PATCH e não em PUT; o caminho pode repetir-se desde que o método seja diferente.
**Cursos:** 2

### API-007 — Registar as rotas fixas antes das rotas dinâmicas

**Regra:** quando um caminho fixo (`/recurso/latest`) partilha o prefixo com um caminho com parâmetro (`/recurso/{id}`), regista o fixo primeiro.
**Porquê:** a rota dinâmica apanha qualquer valor no segmento, incluindo texto, e o pedido ao caminho fixo nunca chega ao handler certo — falha com erro de conversão do parâmetro em vez de dar a resposta esperada.
**Como verificar:** na leitura do módulo de rotas, nenhum caminho com `{...}` aparece antes de um caminho fixo com o mesmo prefixo.
**Cursos:** 1

### API-008 — Erros do cliente com `HTTPException` e o módulo `status`

**Regra:** quando o pedido não pode ser satisfeito, levanta `HTTPException` com o código apropriado, nomeado pelo módulo `status` (`status.HTTP_404_NOT_FOUND`), em vez de devolver um corpo a descrever o erro.
**Porquê:** sem a excepção, a resposta sai com o 200 por omissão e o cliente é obrigado a inspeccionar o corpo para perceber que falhou; os nomes simbólicos documentam a intenção e evitam enganos no número.
**Como verificar:** não há `return` de dicionários com chaves como `error` ou `detail` em caminhos de erro; os códigos aparecem como `status.HTTP_*` e não como literais numéricos.
**Cursos:** 1

### API-009 — Verificar o código de estado antes de usar o corpo da resposta

**Regra:** em qualquer chamada a uma API externa, trata o código de estado da resposta antes de desserializar ou usar o corpo, e falha explicitamente nos restantes casos.
**Porquê:** o corpo de uma resposta de erro não tem a forma esperada; o curso separa o caso `200` de todos os outros e só nesse ramo é que lê e converte o corpo, deixando o resto para o tratamento de erro.
**Como verificar:** cada chamada externa tem uma condição sobre o código de estado antes do parsing do corpo; nenhum `json()`/desserialização acontece antes dessa verificação.
**Cursos:** 1

## Estrutura da API

### API-010 — Camada de serviço injectada, sem acesso directo nos handlers

**Regra:** esconde o acesso a recursos externos (sessão de base de dados e afins) numa classe de serviço com métodos como `get`/`add`/`update`/`delete`, e injecta-a nos endpoints como dependência, em vez de a instanciar dentro do handler.
**Porquê:** os handlers ficam com a forma do contrato e não com os detalhes de `add`/`commit`/`refresh`; as dependências encadeiam-se (sessão → serviço → utilizador autenticado) e o FastAPI resolve a cadeia, o que evita repetir a mesma sequência em cada rota.
**Como verificar:** nenhum endpoint chama directamente a sessão; as instâncias de serviço chegam por `Depends` e não por construção manual dentro da função.
**Cursos:** 1

### API-011 — Credenciais e configuração fora do código-fonte

**Regra:** lê credenciais, segredos e endereços de serviços de configuração externa — variáveis de ambiente com `.env` e `pydantic-settings`, ficheiro de credenciais à parte ou gestor de segredos — e nunca os escrevas no código.
**Porquê:** o código é partilhado e a password não deve ir com ele; a mesma configuração muda por ambiente sem tocar no código. O curso de OAuth vai mais longe para o `client_id`/`client_secret`: devem ficar cifrados num gestor de segredos.
**Como verificar:** no diff não há passwords, tokens, chaves nem URLs de serviço em literais; os valores vêm de uma classe de definições ou de um ficheiro de credenciais ignorado pelo git.
**Cursos:** 3

## Tokens

### API-012 — Nada de confidencial no payload de um token

**Regra:** no payload de um JWT põe apenas um identificador estável do sujeito (o ID do utilizador) e as claims necessárias à autorização; nunca passwords, dados pessoais ou informação confidencial.
**Porquê:** o JWT é codificado, não cifrado — basta descodificar Base64URL para ler o header e o payload, sem chave nenhuma. A chave só serve para verificar a assinatura. O curso de FastAPI codifica nome e email e assinala-o como o que não se deve fazer.
**Como verificar:** o dicionário passado ao `encode` do token tem só identificador, claims de autorização e `exp`; não há email, nome nem dados pessoais.
**Cursos:** 2

### API-013 — Verificar a assinatura do token com a chave pública do emissor

**Regra:** antes de confiar no conteúdo de um JWT recebido de outro emissor, verifica a assinatura com a chave pública correspondente ao `kid` do header, obtida no `jwks_uri` do authorization server.
**Porquê:** a verificação é o que garante as duas coisas de que a aplicação precisa — que o token não foi alterado no caminho e que veio mesmo do emissor esperado. Ler o payload sem verificar não prova nada, porque qualquer pessoa o consegue ler e forjar.
**Como verificar:** o código que aceita tokens externos obtém a chave pelo `kid` a partir do JWKS e passa-a à função de descodificação; não há `decode` com verificação desligada.
**Cursos:** 1

### API-014 — Expiração explícita em cada token emitido

**Regra:** todo o token emitido pela aplicação leva expiração: a claim `exp` com um timestamp em UTC nos JWT, e um prazo explícito nos tokens assinados que viajam em links.
**Porquê:** a biblioteca verifica a expiração automaticamente ao descodificar e recusa o token expirado; com um timestamp que não seja UTC a verificação não funciona como esperado.
**Como verificar:** nos JWT, a construção do payload usa `datetime.now(timezone.utc)` somado a um `timedelta`; nos tokens assinados que viajam em links, a descodificação passa `max_age` ao serializador e trata `SignatureExpired`. Nenhum caminho emite um token sem prazo.
**Cursos:** 1

## OAuth 2.0

### API-015 — Authorization code com PKCE em todos os fluxos com utilizador

**Regra:** nos fluxos de autorização com utilizador usa o grant authorization code com PKCE (`code_challenge_method=S256`), mesmo quando o client é confidencial, sempre que o authorization server o suporte.
**Porquê:** com PKCE, um código de autorização interceptado não serve para nada sem o `code_verifier`, e não há desvantagem em usá-lo também do lado do servidor. O grant implicit, que devolve o access token no próprio redirect, está deprecated precisamente por essa exposição.
**Como verificar:** o pedido de autorização leva `code_challenge` e `code_challenge_method=S256` e o pedido de token leva o `code_verifier`; não existe nenhum pedido com `response_type=token`.
**Cursos:** 1

### API-016 — `state` gerado por pedido e validado na resposta

**Regra:** gera um valor aleatório para o parâmetro `state` em cada pedido de autorização, guarda-o e compara-o com o `state` devolvido antes de aceitar o código.
**Porquê:** é o que garante que a resposta que chega ao redirect corresponde ao pedido que a aplicação fez, e não a um pedido forjado por outra pessoa.
**Como verificar:** o `state` não é uma constante no código; existe a comparação entre o valor enviado e o recebido antes da troca do código por token.
**Cursos:** 1

### API-017 — Client credentials nas chamadas sem utilizador

**Regra:** nas chamadas máquina-a-máquina, sem utilizador associado (tarefas agendadas, serviços a chamar serviços), usa o grant client credentials e não peças o scope `openid`.
**Porquê:** não há Resource Owner para autorizar nada — o cliente autentica-se a si próprio. É, com o authorization code, um dos dois únicos grants que o curso admite; o `openid` é rejeitado neste fluxo, que também não devolve id token nem refresh token.
**Como verificar:** o pedido de token leva `grant_type=client_credentials` e uma lista de scopes sem `openid`; não há credenciais de utilizador envolvidas.
**Cursos:** 1

### API-018 — Rejeitar o pedido cujo token não tem o scope exigido

**Regra:** quem serve o recurso extrai os scopes do token e rejeita com erro de autorização qualquer pedido cujo token não contenha o scope exigido por essa operação.
**Porquê:** é o que dá sentido aos scopes: um token emitido para uma API não pode servir para chamar outra. O curso é explícito — os resource servers OAuth 2.0 têm de recusar chamadas sem os scopes relevantes.
**Como verificar:** cada operação protegida declara o scope que exige e existe a verificação antes da execução; nenhuma rota se limita a confirmar que o token é válido.
**Cursos:** 1

### API-019 — Descobrir os endpoints em `.well-known/openid-configuration`

**Regra:** obtém o authorization endpoint, o token endpoint, o `jwks_uri` e as capacidades de um authorization server no documento de discovery, em vez de os fixares no código.
**Porquê:** é um URL normalizado que qualquer servidor compatível expõe e devolve num só pedido tudo o que é preciso para construir os pedidos seguintes, incluindo os grants, os scopes e os métodos de autenticação suportados; endpoints copiados à mão ficam desactualizados sem aviso.
**Como verificar:** não há URLs de endpoints de autorização em literais no código ou na configuração; existe uma leitura do documento de discovery a partir do issuer.
**Cursos:** 1
