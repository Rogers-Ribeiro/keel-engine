# Regras — node-servidor

Prefixo `NOD`. ## Execução assíncrona

### NOD-001 — Nada de operações síncronas no código que atende pedidos

**Regra:** num processo que atende pedidos, usa sempre a variante assíncrona de qualquer operação de ficheiro, de rede ou de base de dados; reserva as variantes síncronas para o arranque, antes de o servidor começar a aceitar tráfego.
**Porquê:** a variante síncrona bloqueia a única linha de execução até terminar, e enquanto isso os pedidos dos outros utilizadores não são atendidos — o efeito é invisível com ficheiros pequenos em desenvolvimento e derruba o servidor com ficheiros grandes ou muitos utilizadores em produção.
**Como verificar:** procura no diff chamadas com sufixo ou modo síncrono dentro de um handler, de um resolver ou de um nó de grafo; só são aceitáveis em código de arranque, fora do caminho do pedido.
**Cursos:** 2

### NOD-002 — Promises em vez de callbacks aninhados

**Regra:** em código novo usa a API de promises das bibliotecas, com `async`/`await`, em vez de encadear callbacks uns dentro dos outros.
**Porquê:** a API de callbacks é a legada e não muda o comportamento assíncrono; com várias operações dependentes, os callbacks aninhados tornam o código difícil de ler, manter e depurar.
**Como verificar:** no diff, cada operação assíncrona dependente da anterior aparece como `await` ou como passo de uma cadeia plana, não como função passada ao resultado da operação anterior.
**Cursos:** 1

## Estrutura do servidor

### NOD-003 — Um middleware ou responde ou passa adiante

**Regra:** cada middleware tem exactamente uma saída: chama `next` para deixar o pedido continuar, ou envia a resposta. Nunca as duas coisas, nunca nenhuma delas.
**Porquê:** sem `next` e sem resposta o pedido morre ali e fica pendurado, porque a framework não envia resposta por omissão; com as duas, tenta escrever-se duas vezes no mesmo pedido.
**Como verificar:** em cada middleware, todos os caminhos de execução acabam ou num `next` ou no envio da resposta; depois de enviar a resposta há um `return` que impede o código seguinte de correr.
**Cursos:** 1

### NOD-004 — Rotas divididas por domínio em módulos próprios

**Regra:** agrupa as rotas por domínio em ficheiros próprios, cada um a exportar o seu router, e monta-os no ficheiro de arranque com o prefixo correspondente; o ficheiro de arranque não regista rotas directamente.
**Porquê:** numa aplicação real o número de endpoints cresce depressa, e um único ficheiro com tudo deixa de ser gerível; montar o router com prefixo faz com que os caminhos dentro do ficheiro sejam relativos a esse prefixo.
**Como verificar:** o ficheiro de arranque só tem configuração e montagem de routers; cada grupo de rotas vive num ficheiro do seu domínio.
**Cursos:** 2

### NOD-005 — Rota fixa registada antes da rota com segmento dinâmico

**Regra:** quando duas rotas partilham o prefixo e uma tem um segmento dinâmico, regista primeiro a mais específica; a dinâmica vem depois.
**Porquê:** as rotas são percorridas de cima para baixo e o segmento dinâmico casa com qualquer valor — registada primeiro, a dinâmica apanha o pedido e a rota específica fica inalcançável.
**Como verificar:** no ficheiro de rotas, qualquer caminho fixo com o mesmo prefixo aparece acima do caminho com o segmento dinâmico.
**Cursos:** 1

## Configuração e ambiente

### NOD-006 — Credenciais e chaves só em variáveis de ambiente

**Regra:** não escrevas no código a string de ligação à base de dados, a password, nem qualquer chave de serviço externo; lê-as do ambiente e mantém o ficheiro que as define fora do controlo de versões.
**Porquê:** um valor fixo no código obriga a alterar e voltar a implantar para o mudar, e fica exposto a toda a gente que veja o repositório — o que não se resolve trocando a password a cada partilha de código.
**Como verificar:** procura no diff strings de ligação, passwords e chaves literais; qualquer uma tem de vir de uma leitura do ambiente.
**Cursos:** 2

### NOD-007 — Porta lida do ambiente, com valor por omissão só para desenvolvimento

**Regra:** lê a porta do servidor da variável de ambiente que o fornecedor de alojamento injecta, com um valor fixo (3000 nos cursos) apenas como alternativa quando a variável não está definida.
**Porquê:** em produção é o fornecedor que abre a aplicação à rede e que decide a porta; em desenvolvimento a variável não existe e é preciso um valor local.
**Como verificar:** a chamada que põe o servidor à escuta lê o ambiente; um número literal só aparece como alternativa, nunca sozinho.
**Cursos:** 2

## Dados

### NOD-008 — Valores do exterior em marcadores, nunca concatenados na query

**Regra:** os valores que vêm do pedido entram na query como marcadores (`?`), com os valores passados à parte, num array pela mesma ordem; nunca os concatenes no texto da query.
**Porquê:** é assim que o driver escapa a entrada e remove comandos SQL escondidos nos campos do formulário — o ataque a que a aula chama SQL injection.
**Como verificar:** no diff, nenhuma string de query cresce por concatenação ou interpolação de um valor vindo do pedido.
**Cursos:** 1

### NOD-009 — Ligação à base de dados aberta uma vez, isolada num módulo

**Regra:** põe a ligação à base de dados num módulo próprio que exporta duas coisas — uma função que liga no arranque e guarda a ligação, e uma função que a devolve — e usa a segunda em todos os modelos; não abras ligação nova por pedido.
**Porquê:** o driver gere por baixo um pool que serve várias interacções simultâneas, e esse pool só existe se a ligação for feita uma vez e reutilizada.
**Como verificar:** só o módulo de ligação chama a função que liga; os modelos e os handlers obtêm a ligação pela função de acesso.
**Cursos:** 1

### NOD-010 — Paginação feita na consulta, com contagem à parte

**Regra:** pagina na própria consulta, saltando `(página - 1) × itens por página` registos e limitando ao número de itens por página, e obtém o total com uma operação de contagem separada; não leias tudo para cortar em memória.
**Porquê:** a consulta sem limite devolve todos os registos, e é a consulta que tem de controlar a quantidade de dados trazidos.
**Como verificar:** cada listagem paginada tem as operações de salto e de limite na consulta; o total vem de uma contagem, não do tamanho de uma lista já carregada.
**Cursos:** 1

### NOD-011 — Valores numéricos vindos do pedido convertidos antes de usar

**Regra:** converte explicitamente para número qualquer valor que venha de um parâmetro de query, de um formulário ou de um ficheiro antes de o usar em aritmética ou em comparações.
**Porquê:** esses valores chegam como texto; somar um a um número de página em texto dá concatenação (a aula obteve 11 em vez de 2) e as comparações com números falham sem dar erro.
**Como verificar:** todo o valor lido dos parâmetros do pedido é convertido no ponto de leitura; as comparações a seguir são entre valores do mesmo tipo.
**Cursos:** 1

### NOD-012 — Identificador do exterior convertido para o tipo da base de dados

**Regra:** antes de comparar um identificador vindo de um caminho, de um formulário ou de um token com o identificador guardado, converte-o para o tipo que a base de dados usa; faz essa conversão no modelo, não em cada controlador.
**Porquê:** o identificador guardado pode ser um tipo próprio da base de dados e não uma string — a comparação entre os dois não dá erro, simplesmente não encontra nada, o que é difícil de diagnosticar.
**Como verificar:** nenhuma comparação de identificadores aparece entre um valor lido do pedido e um valor da base de dados sem conversão explícita de um dos lados.
**Cursos:** 1

## Validação

### NOD-013 — A validação que conta é a do servidor

**Regra:** valida todos os dados que chegam num pedido logo à entrada do código do servidor, antes de qualquer escrita em base de dados ou em ficheiro, mesmo que o cliente já valide.
**Porquê:** a validação do cliente serve a experiência de utilização; quem envia o pedido pode ignorá-la por completo, e é o servidor que decide se a entrada é aceite ou rejeitada.
**Como verificar:** cada endpoint que recebe dados tem validação antes da primeira operação de escrita; nenhum campo chega ao modelo sem passar por ela.
**Cursos:** 1

### NOD-014 — Validação falhada responde 422 e devolve o que foi introduzido

**Regra:** quando a validação falha, recolhe todos os erros de uma vez, responde com o estado 422 e devolve, com a resposta, os dados que o utilizador introduziu; e faz `return` a seguir a enviar essa resposta.
**Porquê:** o 422 diz ao cliente que os dados enviados eram inválidos, e devolver a entrada evita obrigar a reescrever tudo; sem `return`, o código continua e tenta enviar uma segunda resposta ao mesmo pedido.
**Como verificar:** cada ramo de erro de validação define o código 422, inclui os campos recebidos na resposta e termina com `return`.
**Cursos:** 1

## Autenticação e sessões

### NOD-015 — Password guardada com hash e factor de custo, verificada por comparação

**Regra:** guarda a password passada por uma função de hash com factor de custo (a aula usa 12) e nunca em texto simples; no login, entrega a password recebida e o valor guardado à função de comparação da própria biblioteca, e trata um resultado falso como password errada, não como erro.
**Porquê:** o hash não é reversível — se a base de dados for comprometida, ou se alguém da empresa lhe aceder, as passwords continuam por descobrir; e é por não ser reversível que a verificação tem de ser feita pela biblioteca.
**Como verificar:** no diff não há escrita de password sem passar pela função de hash; o login não tenta reconstruir a password e distingue o caso de erro do caso de não coincidir.
**Cursos:** 1

### NOD-016 — Sessão guardada num store persistente, nunca em memória

**Regra:** configura o middleware de sessão com um store apoiado numa base de dados; o store em memória, que é o omisso, fica reservado a desenvolvimento.
**Porquê:** em memória a sessão não escala — com dezenas de milhares de utilizadores a memória esgota-se — e é menos segura.
**Como verificar:** a inicialização da sessão passa explicitamente um store; a configuração de produção não usa o valor por omissão.
**Cursos:** 1

### NOD-017 — Cookie de sessão marcado `secure` e `http only`

**Regra:** marca o cookie que identifica a sessão como `secure`, para só viajar em HTTPS, e como `http only`, para o JavaScript do browser não o conseguir ler.
**Porquê:** `http only` é a camada que protege o cookie contra código malicioso injectado na página, e é por isso que o cookie guarda o identificador da sessão e não a informação sensível.
**Como verificar:** a configuração do cookie de sessão define as duas marcas; nenhum dado de autorização é guardado no valor do cookie.
**Cursos:** 1

### NOD-018 — Terminar sessão destrói a sessão no servidor

**Regra:** a acção de terminar sessão chama o método que destrói a sessão no servidor; apagar o cookie no cliente não chega.
**Porquê:** apagar só o cookie deixa a sessão viva no store, e vão-se acumulando sessões abandonadas que continuam válidas.
**Como verificar:** o handler de saída chama a destruição da sessão e só redirecciona dentro do callback que confirma que terminou.
**Cursos:** 1

### NOD-019 — Protecção de rotas num middleware reutilizável

**Regra:** extrai a verificação de autenticação para um middleware num ficheiro próprio e acrescenta-o à cadeia de handlers de cada rota protegida, em vez de repetir a verificação dentro de cada acção do controlador.
**Porquê:** repetir a verificação em cada acção não escala, e esconder as opções no menu não protege nada: o utilizador pode escrever o URL à mão e chegar à rota.
**Como verificar:** nenhuma acção de controlador tem a verificação de autenticação embutida; cada rota que a exige tem o middleware na sua lista de handlers.
**Cursos:** 1

### NOD-020 — Posse do recurso verificada em cada acção que o altera, com 403

**Regra:** em cada acção que edita ou apaga um recurso, compara o criador guardado no recurso com o identificador do utilizador autenticado, depois de converter ambos para o mesmo tipo, e responde 403 quando não coincidem; faz essa verificação antes de qualquer efeito colateral.
**Porquê:** estar autenticado não dá permissão sobre todos os recursos, e esconder os botões no frontend não impede um pedido directo à API.
**Como verificar:** cada acção de alteração tem a comparação antes da escrita e antes de apagar ficheiros associados; o código de recusa é 403.
**Cursos:** 1

### NOD-021 — Token de API validado com verificação de assinatura, não com descodificação

**Regra:** o token viaja no cabeçalho `authorization`, com o prefixo `bearer` seguido de espaço; no servidor, valida-o com a função que verifica a assinatura, dentro de um bloco que apanha a falha, e responde 401 quando o cabeçalho falta ou o token não é válido.
**Porquê:** a função que apenas descodifica devolve o conteúdo sem confirmar que o token foi assinado com o segredo do servidor; sem verificação, qualquer token forjado passa.
**Como verificar:** no diff não aparece descodificação sem verificação; a ausência do cabeçalho é tratada antes de se tentar partir o seu valor, e devolve 401 e não 500.
**Cursos:** 1

### NOD-022 — Token de reposição gerado de forma segura e validado com a expiração

**Regra:** gera o token de reposição de password com a função de bytes aleatórios da biblioteca de criptografia (a aula usa 32 bytes), guarda-o no registo do utilizador com uma data de expiração curta (a aula usa uma hora), e procura o utilizador por token **e** expiração posterior ao momento actual na mesma consulta.
**Porquê:** um token aleatório desta forma não se adivinha, e validar só a correspondência sem a data deixaria um token antigo utilizável para sempre.
**Como verificar:** a geração usa a biblioteca de criptografia e não um valor derivado do utilizador; a consulta que valida o token tem as duas condições juntas.
**Cursos:** 1

### NOD-023 — Token anti-CSRF em tudo o que altera estado com sessão

**Regra:** numa aplicação que renderiza formulários e autentica por sessão, gera um token por página, envia-o no formulário e valida-o no servidor em todos os pedidos que não sejam de leitura; regista o middleware que o gere depois do middleware de sessão.
**Porquê:** o browser envia o cookie de sessão válido mesmo em pedidos disparados por uma página falsa; o token não é adivinhável e é gerado de novo a cada página, por isso a página falsa não o consegue incluir.
**Como verificar:** cada formulário que altera dados leva o campo do token; nenhuma rota de alteração está fora da protecção; a ordem de registo põe a sessão antes.
**Cursos:** 1

## Erros e códigos de estado

### NOD-024 — Erro em código assíncrono encaminhado com `next`

**Regra:** dentro de um `then`, de um `catch` ou de um callback, encaminha o erro chamando `next` com o objecto de erro; `throw` só chega ao tratador central quando está em código síncrono.
**Porquê:** o `throw` dentro de código assíncrono não é apanhado pela framework — a aplicação fica a carregar indefinidamente, sem resposta nenhuma.
**Como verificar:** nenhum `catch` de uma operação assíncrona lança o erro directamente; todos o passam a `next`, e nenhum se limita a registá-lo em consola.
**Cursos:** 1

### NOD-025 — Um único tratador central de erros, no fim

**Regra:** regista um só middleware de erro, com quatro argumentos e com o erro em primeiro lugar, depois de todas as rotas, e acrescenta ao objecto de erro o código de estado que a resposta deve usar; não dupliques o tratamento em cada `catch`.
**Porquê:** repetir a mesma resposta de erro em todos os blocos que falam com a base de dados duplica código por toda a parte; com o tratador central, os `catch` limitam-se a criar o erro e a encaminhá-lo.
**Como verificar:** existe exactamente um middleware com quatro argumentos, registado por último; os `catch` criam o erro com o código de estado e chamam `next`.
**Cursos:** 1

### NOD-026 — Código de estado explícito e escolhido pela intenção

**Regra:** define o código de estado de cada resposta em vez de aceitar o 200 por omissão, seguindo a intenção: 201 quando se criou um recurso, 401 quando não há autenticação, 403 quando há autenticação mas não permissão, 404 quando não se encontrou, 422 quando a entrada é inválida, 500 quando o erro é do servidor.
**Porquê:** é pelo código que um cliente que consome dados — e não páginas — percebe se a operação correu bem e que tipo de problema houve; um código diferente de 200 não significa que a aplicação falhou tecnicamente.
**Como verificar:** nas respostas de erro e de criação, o código é definido explicitamente e corresponde à categoria certa.
**Cursos:** 1

## API

### NOD-027 — Endpoints previsíveis, com formato de pedido e resposta fixo

**Regra:** desenha cada endpoint como um par método HTTP e caminho, com estruturas de pedido e de resposta claramente definidas, e usa o método pelo seu significado (obter, criar, substituir, apagar) em vez de o codificar no caminho; o que um endpoint faz não muda ao longo do tempo, e se a API for pública documenta-o.
**Porquê:** é o princípio de interface uniforme: quem consome tem de conseguir prever o que acontece só de ler o método e o caminho — um caminho que contém a acção esconde essa informação de quem lê o pedido.
**Como verificar:** nenhum caminho contém verbos de acção; cada endpoint tem uma estrutura de pedido e resposta declarada; alterações ao formato de um endpoint existente são tratadas como quebra de contrato.
**Cursos:** 2

### NOD-028 — Cada pedido a uma API é autossuficiente

**Regra:** numa API, trata cada pedido como se não tivesse havido nenhum antes: não guardes sessão do cliente no servidor nem faças um endpoint depender do estado deixado por um pedido anterior; o que for preciso saber sobre quem pede viaja no próprio pedido.
**Porquê:** é o princípio de interacções sem estado — cliente e servidor ficam desacoplados e não partilham histórico, mesmo quando correm na mesma máquina.
**Como verificar:** nenhum endpoint lê estado de sessão; a autenticação vem no pedido (ver [NOD-021](#nod-021--token-de-api-validado-com-verificação-de-assinatura-não-com-descodificação)).
**Cursos:** 1

### NOD-029 — CORS resolve-se no servidor, num middleware antes das rotas

**Regra:** quando a API é consumida por um cliente noutra origem, define num middleware geral, antes das rotas, os cabeçalhos `access-control-allow-origin`, `access-control-allow-methods` e o que autoriza os cabeçalhos do cliente — este último a incluir `content-type` e `authorization` —, e chama `next` para o pedido seguir; confirma o resultado num browser.
**Porquê:** a restrição é imposta pelo browser e não se resolve com código no cliente; a porta faz parte da origem, por isso dois serviços locais em portas diferentes já são origens diferentes, e um cliente de API não sofre a restrição e pode dar a falsa impressão de que está tudo bem.
**Como verificar:** o middleware está registado antes das rotas e define os três cabeçalhos; o teste de aceitação foi feito num browser e não só num cliente de API.
**Cursos:** 1

## Ficheiros

### NOD-030 — Ficheiros servidos por streaming, não carregados para memória

**Regra:** para servir um ficheiro, abre uma stream de leitura e encaminha-a para a resposta; não leias o ficheiro inteiro para memória antes de responder.
**Porquê:** ler tudo para memória atrasa a resposta em ficheiros grandes e, com muitos pedidos simultâneos, pode esgotar a memória do servidor; com a stream, o servidor guarda no máximo um pedaço de cada vez.
**Como verificar:** nas rotas que devolvem ficheiros não há leitura completa seguida de envio; há uma stream ligada à resposta.
**Cursos:** 1

### NOD-031 — Na base de dados fica o caminho, não o conteúdo do ficheiro

**Regra:** guarda o ficheiro no sistema de ficheiros (ou no armazenamento de objectos) e grava na base de dados apenas o caminho devolvido pelo middleware de upload.
**Porquê:** ficheiros são demasiado grandes para uma coluna ou um documento e é ineficiente consultá-los a partir daí.
**Como verificar:** nenhum campo de modelo guarda conteúdo binário; o campo que representa o ficheiro é um caminho.
**Cursos:** 1

### NOD-032 — Uploads filtrados por tipo antes de serem gravados

**Regra:** declara na configuração do middleware de upload uma função de filtro que aceita ou rejeita o ficheiro pelo seu tipo declarado, e trata no controlador o caso de o ficheiro ter sido rejeitado, respondendo com erro de entrada inválida.
**Porquê:** o filtro corre antes de o ficheiro ser gravado, por isso nada indesejado chega ao disco; se o filtro rejeitar, o controlador não recebe ficheiro nenhum e tem de saber lidar com isso.
**Como verificar:** a configuração do upload tem filtro; o handler verifica se recebeu ficheiro antes de o usar.
**Cursos:** 1

## Testes

### NOD-033 — Testa o comportamento do teu código, não o da biblioteca

**Regra:** não escrevas testes que verifiquem se uma função de uma biblioteca de terceiros funciona correctamente; testa se o teu código se comporta como deve consoante o que essa função devolve ou falha.
**Porquê:** garantir que a biblioteca está correcta é trabalho de quem a mantém; o que a tua aplicação tem de provar é o que faz com o resultado.
**Como verificar:** nenhuma asserção tem por sujeito uma função importada de uma dependência; as asserções recaem sobre o estado que o teu código produziu.
**Cursos:** 1

### NOD-034 — Base de dados de testes dedicada, nunca a de produção

**Regra:** quando um teste toca mesmo na base de dados, liga-o a uma base de dados de testes dedicada e limpa no fim os dados que criou; nunca apontes os testes para a base de dados de produção.
**Porquê:** os testes escrevem e apagam dados; contra a base de produção isso estraga dados reais de utilizadores.
**Como verificar:** a string de ligação usada nos testes nomeia uma base distinta; há um passo de limpeza no fim.
**Cursos:** 1
