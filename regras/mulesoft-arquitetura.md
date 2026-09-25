# Regras — MuleSoft: arquitectura de integração

Prefixo `MULA`. ## Camadas e responsabilidades

### MULA-001 — Process API só quando há mais do que uma System API a combinar

**Regra:** Só cria uma Process API quando o processo precisa de combinar respostas de mais do que uma System API; se há uma única System API a consumir, expõe-a directamente ao consumidor.
**Porquê:** Uma camada intermédia que só reencaminha uma chamada acrescenta um salto HTTP, tempo e custo de manutenção sem acrescentar comportamento.
**Como verificar:** Para cada Process API, contar as System APIs que orquestra no fluxo; se for uma só e não houver transformação entre sistemas, a camada não se justifica.
**Cursos:** 2

### MULA-002 — Experience API só quando há mais do que uma audiência com resposta diferente

**Regra:** Só cria uma Experience API quando existe mais do que uma audiência a precisar de resposta diferente (formato, campos, protocolo ou URL); se todas aceitam a mesma resposta, expõe a Process API directamente.
**Porquê:** Sem diferença de resposta entre audiências, a camada de experiência duplica a interface sem a adaptar a ninguém.
**Como verificar:** Para cada Experience API, listar as audiências e as diferenças concretas entre as respostas que lhes são devolvidas; sem diferenças, a camada sobra.
**Cursos:** 2

### MULA-003 — A System API devolve os dados como os lê, sem transformar nem enriquecer

**Regra:** Mantém cada System API limitada a ligar-se ao sistema e a devolver os dados tal como vêm; faz a transformação e o enriquecimento que combinam sistemas na Process API, e as adaptações por audiência na Experience API.
**Porquê:** É o que torna a System API reutilizável por qualquer processo: assim que ela adopta o formato de um consumidor, deixa de servir os outros.
**Como verificar:** Procurar transformações que juntem campos de sistemas diferentes ou que renomeiem campos para o vocabulário de um consumidor dentro de uma System API.
**Cursos:** 2

### MULA-004 — A interface tecnológica só varia na camada de experiência

**Regra:** Fixa a mesma interface tecnológica (por exemplo, sempre JSON) entre a camada de sistema e a de processo, e absorve na camada de sistema as particularidades de protocolo dos sistemas legados; deixa só a camada de experiência variar por consumidor.
**Porquê:** Assim o legado fica contido num ponto e o resto da organização trabalha sempre sobre o mesmo formato, mesmo quando o consumidor exige SOAP, REST ou ficheiro.
**Como verificar:** Procurar nas especificações de processo e de sistema formatos ou protocolos que existam só porque um consumidor externo os pediu.
**Cursos:** 1

## Contrato, versão e modelo de dados

### MULA-005 — Especificação, simulação e feedback antes de qualquer implementação

**Regra:** Antes de escrever a implementação, fecha a especificação da API, simula a interacção sobre ela, recolhe o feedback dos futuros consumidores e publica a documentação; só depois arranca o código.
**Porquê:** O contrato é o que os consumidores usam para trabalhar em paralelo; fechá-lo depois do código transforma cada correcção de interface numa alteração de implementação já feita.
**Como verificar:** No histórico, a especificação publicada tem de anteceder o primeiro commit de implementação; numa spec nova, exigir a prova de que houve simulação e feedback.
**Cursos:** 1

### MULA-006 — Tudo o que se repete entre especificações sai para um fragmento publicado

**Regra:** Extrai para fragmentos reutilizáveis e publica-os no Exchange tudo o que se repete entre recursos ou entre APIs — schemas de pedido e de resposta, exemplos, traits para cabeçalhos obrigatórios e esquemas de segurança —, em vez de escrever um ficheiro de especificação único e volumoso ou de o copiar.
**Porquê:** O mesmo schema serve várias APIs, e um trait impõe os cabeçalhos comuns (identificador de transacção, credenciais de cliente) sem os repetir em cada recurso.
**Como verificar:** Numa spec nova, procurar blocos de schema, exemplo ou cabeçalho idênticos a outros já publicados; devem ser importados, não copiados.
**Cursos:** 4

### MULA-007 — Versionamento semântico com só a versão major visível ao cliente

**Regra:** Versiona cada API com major.minor.patch desde a primeira entrega e expõe ao cliente apenas a major (no URL, na definição e nas entradas do manager); guarda a versão completa para o registo do activo.
**Porquê:** Só a major obriga o cliente a mudar código; mostrar-lhe a minor e a patch faz cada correcção sem impacto parecer uma mudança que o pode partir.
**Como verificar:** No URL e na definição não pode aparecer mais do que o número major; e uma alteração que quebre compatibilidade tem de subir a major, não a minor.
**Cursos:** 1

### MULA-008 — Uma API, um bounded context

**Regra:** Quando a organização não tem um modelo de dados empresarial já estabelecido e a funcionar, define os tipos por bounded context e trata cada API como um contexto próprio, com os seus tipos não partilhados com outras APIs.
**Porquê:** O modelo empresarial exige coordenação entre equipas na modelação, em cada alteração e em cada rollout, e é essa coordenação que costuma inviabilizá-lo nas organizações grandes.
**Como verificar:** Ver se os tipos de uma API são importados de outra API de contexto diferente; se sim, ou há modelo empresarial estabelecido, ou o limite do contexto foi violado.
**Cursos:** 1

### MULA-009 — O anti-corruption layer fica do lado de quem chama

**Regra:** Quando uma API chama outra de um bounded context diferente, é quem chama que converte o seu modelo para o formato esperado no pedido e converte a resposta de volta para o seu próprio modelo; quem é chamado não se adapta ao chamador.
**Porquê:** Quem precisa da informação é que coopera; se cada chamado se adaptasse a cada chamador, o contrato deixava de ser único.
**Como verificar:** Procurar na API chamada campos ou variantes que só existem para servir um chamador específico — essa tradução pertence ao chamador.
**Cursos:** 1

### MULA-010 — As validações estruturais declaram-se no contrato, não se repetem no fluxo

**Regra:** Declara no contrato os campos obrigatórios e os limites de comprimento de cada campo e deixa o APIkit router rejeitar o pedido inválido antes de qualquer processador correr; não repitas essas mesmas validações dentro do fluxo.
**Porquê:** O router valida contra a especificação e devolve um erro de bad request antes de a implementação arrancar; a validação duplicada no fluxo só acrescenta um sítio onde as duas versões podem divergir.
**Como verificar:** Para cada validação estrutural feita no fluxo, procurar a declaração equivalente no contrato; se existir, a do fluxo é redundante.
**Cursos:** 2

## Tratamento de erros

### MULA-011 — Um error handler global que devolve sempre a mesma estrutura de resposta

**Regra:** Concentra o tratamento de erros num error handler global que, por tipo de erro, define o código HTTP, a mensagem e a descrição em variáveis e chama um sub-flow comum para montar a resposta (código, mensagem, descrição, data/hora e identificador de transacção); não copies este tratamento fluxo a fluxo.
**Porquê:** O tratamento por omissão do router devolve respostas que não seguem o formato acordado com o consumidor, e um handler comum mantém todas as APIs a responder da mesma maneira e permite reutilizá-lo entre aplicações.
**Como verificar:** Provocar erros de tipos diferentes e comparar as respostas: os campos e o formato têm de ser os mesmos, com o código HTTP a variar. No diff, tratamento de erro copiado em vários fluxos é sinal de falha.
**Cursos:** 3

### MULA-012 — O bloco `any` é sempre o último

**Regra:** Trata primeiro cada tipo de erro específico e deixa o bloco `any` no fim da cadeia, como rede para o que não foi previsto.
**Porquê:** A precedência é pela ordem em que os blocos aparecem, e os tipos específicos são subconjuntos de `any`: um `any` colocado à cabeça intercepta tudo e os blocos seguintes nunca chegam a correr.
**Como verificar:** Ler a ordem dos blocos na configuração: nenhum tipo específico pode estar depois do `any`.
**Cursos:** 2

### MULA-013 — Falhas de regra de negócio levantam um erro com namespace próprio

**Regra:** Quando uma regra de negócio falha e não corresponde a nenhum erro nativo (por exemplo, um registo procurado que não existe), levanta um erro com o namespace `custom` e um identificador próprio, e trata-o no error handler; nunca reutilizes um tipo de erro já fornecido pela plataforma.
**Porquê:** Reutilizar um tipo nativo confunde a falha de negócio com a falha técnica e impede o handler de lhes dar códigos e mensagens diferentes.
**Como verificar:** Ver se os erros levantados no código usam namespace próprio e se cada um tem um bloco correspondente no error handler.
**Cursos:** 2

## Resiliência

### MULA-014 — O timeout de cada chamada sai do orçamento de SLA repartido pelas camadas

**Regra:** Define um timeout de resposta explícito em cada chamada a sistema externo, calculado a partir do SLA de resposta da API repartido pelas camadas que o pedido atravessa; nunca deixes o valor por omissão de 10000 ms nem uses um número fixo arbitrário.
**Porquê:** O SLA vale tanto para respostas de sucesso como de erro; um timeout maior do que o orçamento total garante que a falha de um único salto o estoura. O valor final confirma-se em testes de desempenho.
**Como verificar:** Somar os timeouts ao longo do caminho mais longo e comparar com o SLA declarado; e procurar chamadas sem timeout configurado.
**Cursos:** 3

### MULA-015 — Tolerância a falhas por esta ordem: timeout, retry, circuit breaker, fallback

**Regra:** Ao proteger uma chamada, acrescenta os mecanismos por esta ordem — primeiro o timeout, depois o retry, depois o circuit breaker, depois uma API de fallback, depois o resultado em cache e, em último lugar, o resultado estático — e só avança para o seguinte quando o anterior já está em sítio.
**Porquê:** Cada mecanismo pressupõe o anterior: sem timeout não há falha detectada a tempo para repetir, e sem limite de repetições o circuit breaker nunca chega a proteger quem chama.
**Como verificar:** Numa chamada com retry ou circuit breaker, confirmar que existe timeout configurado; e que não se saltou para fallback sem ter limitado as tentativas.
**Cursos:** 1

### MULA-016 — Distinguir erro transitório de permanente antes de repetir

**Regra:** Repete apenas os erros transitórios — too many requests, service unavailable, gateway timeout e os erros de conectividade — e devolve de imediato os permanentes, como unauthorized (401), forbidden (403), method not allowed e not implemented.
**Porquê:** Um erro permanente dá o mesmo resultado em todas as tentativas: repeti-lo só gasta tempo e recursos e atrasa a resposta de erro ao cliente.
**Como verificar:** Ver se o mecanismo de repetição está restringido por tipo de erro; um retry que apanhe qualquer erro está errado.
**Cursos:** 2

### MULA-017 — Só se repete uma escrita quando o cliente manda um identificador de pedido único

**Regra:** Só faz retry automático de PUT ou DELETE quando a implementação garante idempotência através de um identificador de pedido único gerado pelo cliente, reenviado sem alterações na repetição e guardado do lado da implementação; nunca repitas POST ou PATCH sem acordo explícito com o cliente.
**Porquê:** POST e PATCH não são idempotentes por definição, e mesmo em PUT e DELETE a comparação do conteúdo do pedido engana-se quando houve alterações pelo meio — o identificador único é o que distingue a repetição do pedido genuíno.
**Como verificar:** No contrato, o identificador de pedido tem de ser um campo exigido; no código, a implementação tem de o guardar e consultar antes de processar.
**Cursos:** 1

## Mensageria assíncrona e estado

### MULA-018 — Confirmar a mensagem no fim do processamento, nunca à subscrição

**Regra:** Usa o modo de acknowledgement automático, que confirma a mensagem só quando a execução do fluxo termina, ou o modo manual quando a confirmação tem de acontecer num ponto preciso; nunca uses o modo imediato.
**Porquê:** O modo imediato confirma a mensagem no momento em que o consumidor a recebe, sem olhar ao resultado do fluxo: se o processamento falhar a seguir, a mensagem já não está na fila e perde-se.
**Como verificar:** Ler a configuração de cada listener de fila: o modo imediato só é aceitável com justificação escrita de que a perda da mensagem não tem custo.
**Cursos:** 3

### MULA-019 — A mensagem que esgota as reentregas vai para uma dead letter queue

**Regra:** Apanha o erro `MULE:REDELIVERY_EXHAUSTED` e publica essa mensagem numa dead letter queue, em vez de a deixar repetir ou desaparecer.
**Porquê:** Sem este encaminhamento, a mensagem que nunca consegue ser processada ou se repete indefinidamente ou perde-se; na dead letter queue fica disponível para alguém perceber porque falhou e reprocessá-la.
**Como verificar:** Em cada consumidor com política de reentrega, procurar o bloco que trata o erro de reentregas esgotadas e a publicação na fila de erros.
**Cursos:** 1

### MULA-020 — O correlation ID atravessa o broker por configuração explícita

**Regra:** Quando a transacção passa pelo Anypoint MQ, propaga o correlation ID explicitamente numa propriedade da mensagem e volta a aplicá-lo no subscritor; não contes com a propagação automática que os transportes HTTP, JMS e VM fazem.
**Porquê:** O conector do Anypoint MQ não propaga o correlation ID — gera sempre um novo —, e a partir daí os registos do lado do consumidor deixam de se ligar aos do produtor.
**Como verificar:** Seguir uma transacção nos registos de ponta a ponta: se o identificador muda ao atravessar a fila, falta a propagação.
**Cursos:** 2

### MULA-021 — Watermark e estado partilhado ficam em Object Store persistente

**Regra:** Guarda o watermark do último registo processado — e qualquer estado que tenha de sobreviver a reinícios — num Object Store persistente, sobre uma chave primária, e usa esse valor na condição da consulta seguinte.
**Porquê:** Sem persistência, um redeploy ou reinício faz o processamento recomeçar do zero e reprocessar tudo o que já tinha sido entregue ao sistema de destino.
**Como verificar:** Ver se o armazenamento usado está marcado como persistente e se a chave escolhida é única e crescente; uma coluna com valores repetidos não serve de marca.
**Cursos:** 3

## Estrutura do projecto e operação

### MULA-022 — Um ficheiro de implementação por recurso e a configuração global num só sítio

**Regra:** Separa a implementação de cada recurso no seu ficheiro dentro de uma pasta `implementations`, isola as chamadas a cada sistema externo em sub-flows próprios, e junta todas as configurações partilhadas num `global.xml`, deixando o ficheiro principal só com o router.
**Porquê:** Com todos os fluxos privados no ficheiro gerado a partir da especificação, o projecto fica ilegível assim que a lógica cresce; separado por recurso, percorre-se e altera-se um sem tocar nos outros.
**Como verificar:** Ver se o ficheiro gerado pela especificação ainda contém lógica de implementação e se há configurações de conector espalhadas por vários ficheiros.
**Cursos:** 3

### MULA-023 — Cada API expõe um health check de liveness com resposta estática

**Regra:** Acrescenta a cada API um recurso de health check em GET, sem entrada, que devolve uma resposta estática; não ligues **este** a sistemas nem a dados reais. Verificar as dependências a jusante é o papel do endpoint de readiness separado de [MULD-008](./mulesoft-desenvolvimento.md), que é outro recurso.
**Porquê:** Serve para confirmar que a aplicação está viva sem invocar um recurso de negócio — o que evitaria tocar em dados reais só para saber se o serviço responde.
**Como verificar:** O recurso tem de estar na especificação, fora da hierarquia dos recursos de negócio, e a sua implementação não pode conter chamadas a sistemas.
**Cursos:** 2

### MULA-024 — Propriedades sensíveis cifradas e lidas com o prefixo `secure::`

**Regra:** Cifra as propriedades sensíveis com a ferramenta de secure properties e refere-as sempre com o prefixo `secure::`; a chave de cifra entra na aplicação como argumento no momento do deployment e não fica no repositório.
**Porquê:** Separa quem conhece a chave de quem escreve o código — quem desenvolve trabalha com o valor cifrado e nunca vê o segredo.
**Como verificar:** Procurar no repositório valores de palavra-passe, client secret ou chave em claro, e referências a propriedades sensíveis sem o prefixo.
**Cursos:** 3

### MULA-025 — Auto discovery com o identificador da instância em propriedade e credenciais por ambiente

**Regra:** Liga cada aplicação ao API Manager por auto discovery, lendo o identificador da instância de API de uma propriedade em vez de o fixar na configuração, e usa o client ID e o client secret do ambiente onde a aplicação corre, não os da organização inteira.
**Porquê:** É a ligação que faz a aplicação descarregar e aplicar as políticas definidas para aquela instância, e o identificador muda de ambiente para ambiente; credenciais por ambiente mantêm o princípio do menor privilégio.
**Como verificar:** Na configuração não pode aparecer um identificador de instância escrito à mão; e o estado da instância no API Manager tem de passar a activo depois do deployment.
**Cursos:** 4

### MULA-026 — Medir onde está o tempo antes de mexer na capacidade

**Regra:** Perante um problema de desempenho, activa o registo de nível debug restringido ao pacote do conector suspeito (por exemplo, `org.mule.extension.db` ou `org.mule.extensions.jms`), mede quanto demora cada operação e só depois decides o que mudar; não escales sem essa medição, nem deixes `org.mule` em debug depois de acabar.
**Porquê:** O debug por pacote mostra o tempo de cada operação e aponta a que está fora do esperado; sem essa leitura, aumentar recursos é adivinhar. O debug sobre o pacote inteiro produz volume de registo que não se justifica manter.
**Como verificar:** Antes de aprovar um aumento de capacidade, exigir os tempos medidos por operação; e confirmar que a configuração de registo em produção não tem debug permanente.
**Cursos:** 3
