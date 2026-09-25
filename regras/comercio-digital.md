# Regras — Comércio digital: B2C e B2B

Prefixo `COM`. ## Ambientes e promoção de alterações

### COM-001 — Código e configuração sobem por staging

**Regra:** leva o código e a configuração primeiro a staging, valida-os aí com dados reais e só depois os replica para produção e para desenvolvimento; não empurres alterações directamente para produção.
**Porquê:** os dois cursos apresentam esta como a via recomendada porque staging é o único ambiente com dados equivalentes aos de produção e com processo de replicação, e é onde o negócio dá o aval antes de o cliente final ser afectado.
**Como verificar:** o plano de release nomeia staging como origem da promoção e indica quem valida lá; um passo que escreva em produção sem passagem por staging vem justificado como excepção.
**Cursos:** 2

### COM-002 — Valores que mudam por ambiente declaram-se por ambiente de destino

**Regra:** quando uma chave ou um endereço difere entre ambientes, define em staging um valor por ambiente de destino e deixa a replicação entregar cada valor ao ambiente certo; não guardes um único valor partilhado nem edites o valor à mão depois de cada promoção.
**Porquê:** o professor mostra o caso de um serviço com ambientes separados de desenvolvimento e de produção: a replicação respeita a marcação de destino e leva as chaves de produção só para produção, o que impede que credenciais de produção acabem num sandbox.
**Como verificar:** na configuração, cada valor sensível ao ambiente tem destino declarado; se a spec disser "mudar o valor depois do deployment", a regra não está cumprida.
**Cursos:** 1

### COM-003 — Credencial de API própria por ambiente

**Regra:** cria um client ID próprio, com os papéis mínimos, para cada instância de desenvolvimento, staging e produção; o client ID genérico do sandbox fica confinado ao sandbox.
**Porquê:** o professor interrompe a demonstração para o dizer como regra de segurança: o identificador partilhado que a plataforma dá ao sandbox serve para aprender, e reutilizá-lo num ambiente primário expõe as mesmas credenciais a quem tiver acesso a qualquer sandbox.
**Como verificar:** a configuração de cada ambiente aponta para um client ID distinto; nenhum ficheiro de ambiente primário repete o identificador usado localmente.
**Cursos:** 1

## Integrações e pagamentos

### COM-004 — Chamada a serviço externo leva timeout, circuit breaker e rate limit

**Regra:** define, para cada serviço externo, um timeout ligeiramente acima do tempo normal de resposta, um circuit breaker com número máximo de falhas e intervalo em milissegundos, e um limite de chamadas; e trata explicitamente o erro que o timeout provoca.
**Porquê:** o professor percorre o caso de um serviço de encomendas que deixa de responder: sem timeout a aplicação fica à espera, e sem circuit breaker continua a chamar um fornecedor que já se sabe em falha, cliente após cliente; o rate limit protege o próprio serviço de picos de tráfego.
**Como verificar:** cada cliente de serviço externo tem os três parâmetros configurados e um caminho de erro definido; um cliente sem timeout, ou com timeout mas sem tratamento do erro, não passa a revisão.
**Cursos:** 1

### COM-005 — Operações administrativas não se expõem ao lado do comprador

**Regra:** separa a API de comprador da API administrativa: o que o storefront ou um cliente público consome fica em leitura (GET), e as operações de escrita e de administração só existem em canais servidor-a-servidor com autenticação própria.
**Porquê:** na demonstração, a família de APIs de shopper só oferece GET, enquanto a de dados oferece POST, PUT, PATCH e DELETE, precisamente porque é de nível administrativo; misturar as duas dá a um visitante verbos que só um administrador devia ter.
**Como verificar:** na spec da API, cada endpoint diz de que lado está; nenhum endpoint exposto ao cliente final declara verbos de escrita sem autenticação de servidor.
**Cursos:** 1

### COM-006 — Autorizar no checkout, capturar depois do envio

**Regra:** no checkout, autoriza o pagamento (reserva do valor) e só desencadeia a captura depois da confirmação de que a encomenda foi expedida; nunca no momento em que a encomenda é colocada.
**Porquê:** o professor descreve o fluxo ponta a ponta: o banco reserva o valor, a encomenda é colocada e enviada, e é o sistema de gestão de encomendas que, ao confirmar a expedição, pede a liquidação — cobrar antes de enviar cria reembolsos evitáveis.
**Como verificar:** no desenho do fluxo de encomenda, autorização e captura são dois passos com gatilhos diferentes, e o gatilho da captura é o evento de expedição.
**Cursos:** 1

## Extensão por código

### COM-007 — Um controller não chama outro controller

**Regra:** não invoques um controller a partir de outro controller; se dois fluxos precisam de se encadear, passa pelo template que os liga ou reestrutura o fluxo.
**Porquê:** o professor dá isto como primeira das boas práticas de controllers, para evitar dependências cíclicas; nota que o código de origem da plataforma também não o faz, e que o encadeamento legítimo (a reposição de senha, por exemplo) passa sempre por um template.
**Como verificar:** no diff, nenhum controller importa ou invoca outro controller; procura chamadas directas entre ficheiros da pasta de controllers.
**Cursos:** 1

### COM-008 — Estende rotas com `replace` sempre que o requisito o permita

**Regra:** ao estender uma rota existente, usa `replace` em vez de `append` ou `prepend` quando o requisito o permita, e obrigatoriamente quando a rota chama um serviço de terceiros.
**Porquê:** com `append`, a plataforma corre primeiro a rota original e só depois a extensão, o que executa os middlewares duas vezes e pode duplicar a chamada à integração; o professor repete-o na aula teórica e na demonstração de integração, onde diz que esta é a recomendação da Salesforce.
**Como verificar:** no diff, cada extensão de rota justifica o `append`; uma rota com chamada externa estendida por `append` é um erro a corrigir.
**Cursos:** 1

### COM-009 — `require` em vez de `import`, no âmbito mais restrito

**Regra:** nos cartridges, importa módulos com `require` e não com `import`, e coloca a chamada dentro da função ou do bloco que a usa, não no topo do ficheiro.
**Porquê:** o código dos controllers segue CommonJS, e `import` e `require` não funcionam da mesma maneira; o professor pede explicitamente o âmbito mais estreito possível, em vez do bloco de importações no topo típico de outras linguagens.
**Como verificar:** no diff, nenhum ficheiro de cartridge usa `import`, e as chamadas a `require` estão dentro do bloco que consome o módulo.
**Cursos:** 1

### COM-010 — O ficheiro de hooks declara-se no `package.json` do cartridge

**Regra:** ao criar um hook, declara o ficheiro de definição de hooks (`hooks.json`) no `package.json` do mesmo cartridge antes de escrever a lógica; sem essa declaração o ponto de extensão não é encontrado.
**Porquê:** na resolução do exercício, o código do hook está escrito e correcto e mesmo assim não corre, porque falta dizer à plataforma onde está o ficheiro de definição; o professor sublinha que é a pergunta que mais sai na certificação.
**Como verificar:** todo o cartridge que traz hooks tem a entrada correspondente no `package.json`, e o caminho declarado existe.
**Cursos:** 1

### COM-011 — Nenhuma escrita fora de uma transacção

**Regra:** envolve toda a persistência numa transacção: a função `wrap`, que delimita o bloco, ou `begin` e `commit` explícitos com o `rollback` tratado no `catch`.
**Porquê:** não há acesso directo à base de dados nem ligações abertas à mão, e a plataforma só confirma o que está dentro dos limites da transacção; fora deles, a escrita não fica garantida e uma excepção a meio deixa o registo inconsistente.
**Como verificar:** no diff, cada atribuição que altera um objecto persistido está dentro de `wrap` ou entre `begin` e `commit`; um bloco explícito sem tratamento de excepção não passa.
**Cursos:** 1

## Processamento em massa e cache

### COM-012 — Volumes grandes processam-se em blocos, não numa operação única

**Regra:** quando um trabalho altera muitos registos, parte-o em blocos de tamanho definido (chunk) em vez de o correr como operação única; reserva a operação única para volumes pequenos e focados numa só tarefa.
**Porquê:** o professor usa o caso de milhões de clientes a actualizar: numa operação única, uma falha a meio deixa-te sem saber quantos registos foram afectados e sem forma de reverter; em blocos, cada bloco é gravado ou revertido por inteiro e o ponto de falha é conhecido.
**Como verificar:** o trabalho declara o tamanho do bloco e o que acontece a um bloco que falha; um processo sobre volumes grandes sem essa divisão é um risco a levantar na revisão.
**Cursos:** 1

### COM-013 — A cache de página define-se no controller, não no template

**Regra:** define o tempo de cache no controller, com a função `setExpires` da resposta, e não por tag de cache no template.
**Porquê:** o professor diz que a cache ao nível do template funciona mas não é recomendada; no controller a decisão fica junto da lógica que sabe se aquela resposta é cacheável, e não espalhada pelos ficheiros de apresentação.
**Como verificar:** no diff, as durações de cache aparecem nos controllers; uma tag de cache nova num template vem com justificação.
**Cursos:** 1

### COM-014 — Invalida cache por partição, não a página inteira

**Regra:** divide a página em partições por volatilidade — cabeçalho, informação de produto, disponibilidade de stock, preço — e invalida só a partição que mudou.
**Porquê:** as partes de uma página não mudam ao mesmo ritmo: a informação de produto é estável, o stock e o preço não; deitar fora a página inteira por causa de um valor volátil desperdiça a cache de tudo o resto e devolve tráfego ao servidor.
**Como verificar:** a estratégia de cache lista as partições e o gatilho de invalidação de cada uma; uma invalidação que apague a página toda vem justificada.
**Cursos:** 1

## Catálogo, preços e promoções

### COM-015 — Árvore de categorias até três níveis

**Regra:** limita a hierarquia de categorias a três níveis; quatro é o máximo tolerável e obriga a justificação.
**Porquê:** o professor dá o número como orientação geral de comércio electrónico: acima disso a navegação fica confusa e, quando o catálogo cresce com linhas ou colecções novas, não sobra espaço e é preciso reestruturar tudo.
**Como verificar:** conta os níveis na árvore proposta; qualquer ramo com mais de três níveis aparece na revisão com a razão pela qual não pode ser achatado.
**Cursos:** 1

### COM-016 — Acumulação de promoções decidida e declarada

**Regra:** para cada promoção, declara se acumula com outras da mesma classe e com as de classes diferentes, e com que prioridade; não deixes o comportamento por omissão decidir.
**Porquê:** os dois cursos mostram que o valor cobrado muda consoante a decisão — no exemplo do curso B2C, um cesto de 100 com duas promoções dá 40 se acumularem e 50 se forem exclusivas; o curso B2B expõe os mesmos controlos como campos de exclusividade e de prioridade.
**Como verificar:** cada promoção da spec traz a decisão de acumulação e a prioridade; um teste de checkout confirma o total esperado quando duas promoções são elegíveis ao mesmo tempo.
**Cursos:** 2

### COM-017 — Range ou Slab escolhido a partir do requisito, e schedule desactivado para editar

**Regra:** antes de criar um desconto por quantidade, confirma se o desconto do escalão atingido se aplica à quantidade toda (Range) ou progressivamente por escalão (Slab); e desactiva o schedule antes de editar os escalões.
**Porquê:** o professor calcula os dois casos com os mesmos escalões e mostra totais diferentes — em Slab, quem compra dez unidades recebe o desconto do primeiro escalão em nove delas e o do segundo só numa; e a plataforma recusa a edição enquanto o schedule estiver activo.
**Como verificar:** a spec do desconto por quantidade nomeia o método e traz o total esperado para uma quantidade de exemplo.
**Cursos:** 1

## B2B Commerce: visibilidade, preço e checkout

### COM-018 — Visibilidade de produto exige a cadeia completa até à conta

**Regra:** para um produto aparecer a um comprador, liga-o a uma entitlement policy e a uma categoria, activa a conta como buyer e só depois atribui-lhe o buyer group ligado a essa policy; não esperes visibilidade por herança nem por omissão.
**Porquê:** na demonstração, o produto existe e continua invisível até ter entitlement policy, e a atribuição do buyer group é recusada com a mensagem de que a conta ainda não é uma conta de comprador; é a cadeia inteira que decide o que cada conta vê.
**Como verificar:** para cada produto novo, confirma policy, categoria, conta activada como buyer e buyer group; a validação faz-se com o login do comprador, não na consola de administração.
**Cursos:** 1

### COM-019 — Sem entrada de price book activa não há preço nem compra

**Regra:** dá a cada produto uma entrada activa no price book da loja, com moeda e valor; se houver preço de referência riscado, cria a entrada correspondente no price book de strikethrough.
**Porquê:** na demonstração, o produto já visível mostra "preço indisponível" e tem o botão de adicionar ao carrinho desactivado só porque lhe falta a entrada de price book; assim que a entrada activa é criada, o preço aparece e a compra fica possível.
**Como verificar:** na página de produto do storefront, preço visível e botão de compra activo; na administração, a entrada de price book está marcada como activa.
**Cursos:** 1

### COM-020 — Indexação de pesquisa antes de dar a alteração por feita

**Regra:** depois de mexer em produtos, categorias, entitlements, buyer groups ou importações, corre a indexação de pesquisa e espera que termine antes de validar no storefront.
**Porquê:** o professor mostra duas vezes o mesmo engano: a configuração está correcta e o storefront continua a não mostrar nada, porque o índice ainda não foi refeito; a indexação demora alguns minutos e é o que torna a alteração visível.
**Como verificar:** o procedimento de validação inclui o passo de indexação e a contagem de produtos indexados antes e depois; um relato de "não aparece" sem indexação feita não é um defeito.
**Cursos:** 1

### COM-021 — Taxa de imposto configurada para o país antes da primeira encomenda

**Regra:** antes de tentar fechar uma encomenda, cria o registo de taxa de imposto com o código de imposto do tratamento por omissão, o país de destino, a percentagem e a prioridade.
**Porquê:** sem esse registo, o checkout pára com a mensagem de que não há regras de imposto configuradas para aquela localização; o código de imposto do tratamento por omissão é o que liga a configuração da loja à taxa.
**Como verificar:** há um registo de taxa por país servido, e o código de imposto coincide com o do tratamento por omissão; o teste é um checkout completo com uma morada desse país.
**Cursos:** 1

### COM-022 — Perfil de portes personalizado exige zona e tarifa

**Regra:** sempre que atribuas produtos a um perfil de portes personalizado, dá-lhe pelo menos uma zona de envio com os países servidos e uma tarifa; não contes com o perfil por omissão para os produtos já atribuídos a outro.
**Porquê:** na demonstração, o produto passa a estar num perfil personalizado sem zona e o checkout falha com a mensagem de que não é possível entregar o artigo na morada escolhida; o perfil geral só cobre os produtos que não estão atribuídos a nenhum outro.
**Como verificar:** cada perfil de portes com produtos atribuídos tem zona e tarifa; o teste é um checkout com morada de cada país servido.
**Cursos:** 1

### COM-023 — Tipo de imposto fixado antes de existirem carrinhos

**Regra:** decide no arranque se o preço do produto inclui imposto (gross) ou não (net); se for mesmo preciso mudar depois, limpa os carrinhos existentes na mesma operação.
**Porquê:** o próprio ecrã de configuração avisa que mudar o tipo de imposto afecta os carrinhos já criados e recomenda limpá-los; carrinhos antigos calculados com a política anterior produzem totais errados no checkout.
**Como verificar:** a decisão está registada na configuração da loja; qualquer alteração posterior traz, no mesmo pedido, o passo de limpeza dos carrinhos.
**Cursos:** 1

### COM-024 — Comprador precisa de licença compatível e de ser membro do site

**Regra:** ao preparar um utilizador de comprador, confirma que a licença suporta o permission set que lhe vais dar, usa um perfil clonado a partir do perfil standard correspondente, e associa esse perfil aos membros do site na Experience Builder.
**Porquê:** na demonstração, o login falha e a atribuição do permission set de comprador é recusada por a licença não o suportar; passar a Customer Community Plus resolve, mas obriga a clonar o perfil e a voltar a registá-lo como membro do site, sem o que o utilizador continua sem entrar.
**Como verificar:** antes de reportar um problema de login, verifica a licença do utilizador, o perfil atribuído e a lista de membros do site; o teste é entrar na loja como esse contacto.
**Cursos:** 1
