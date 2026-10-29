# Regras — automacao-de-testes

Prefixo `AUT`. ## Isolamento entre testes

### AUT-001 — Recursos de teste em fixtures do `conftest.py`

**Regra:** Cria os recursos partilhados pelos testes (contexto, página, ligação à base) como fixtures no `conftest.py`, com `yield` a entregar o recurso e o fecho logo a seguir ao `yield`; não abras nem feches esses recursos dentro de cada teste.
**Porquê:** o pytest trata o `conftest.py` como partilhado por todos os testes do projecto, sem importação, e só o `yield` devolve a execução à fixture para libertar o recurso — com `return` o código de limpeza nunca corre.
**Como verificar:** no diff, procura `new_context`, `new_page` ou criação de ligações dentro de funções `test_`; em cada fixture, confirma que há uma instrução de fecho depois do `yield`.
**Cursos:** 1

### AUT-002 — Escopo `function` nas fixtures que guardam estado

**Regra:** Mantém as fixtures de contexto e de página no escopo `function` (o padrão do pytest); só usa `session`, `module` ou `class` num recurso que não carregue estado de um teste para o seguinte.
**Porquê:** na demonstração com `session`, o contexto foi reutilizado, o login do primeiro teste continuou activo no segundo e o teste que esperava o botão de logout invisível falhou — estado partilhado cria dependência de ordem.
**Como verificar:** no `conftest.py`, confirma que as fixtures de contexto e página não declaram `scope`; se declararem, confirma que nenhum teste depende do estado que lá fica (sessão autenticada, carrinho, ficheiros).
**Cursos:** 1

### AUT-003 — Quem cria dados no teste limpa-os no fim

**Regra:** Um teste que insere ou altera registos repõe o estado no fim, apagando ou revertendo o que criou.
**Porquê:** é o que mantém os testes independentes uns dos outros; na aula, repetir a inserção do mesmo e-mail rebentou contra a chave única da tabela, porque o registo da execução anterior tinha ficado lá.
**Como verificar:** para cada `inserir`/`atualizar` no teste ou na fixture, procura o delete ou o update inverso correspondente depois do `yield` ou no fim do teste.
**Cursos:** 1

### AUT-004 — Paralelismo só com testes independentes

**Regra:** Só corre a suite em paralelo (`pytest -n <N>`, ou `-n auto` para usar os núcleos da máquina) quando nenhum teste depender do estado deixado por outro.
**Porquê:** o plugin divide os testes por processos isolados, cada um com o seu resultado; o ganho medido na aula (5,1 s contra 7,96 s em quatro testes) só vale se os testes forem independentes entre si.
**Como verificar:** antes de acrescentar `-n` ao comando do pipeline, confirma AUT-002 e AUT-003; no diff, desconfia de testes que dependem de um registo criado noutro ficheiro.
**Cursos:** 1

## Localizadores

### AUT-005 — O primeiro localizador é o papel acessível

**Regra:** Localiza os elementos pelo papel acessível com `get_by_role(<papel>, name=...)`; só desce aos outros localizadores (rótulo, texto-sugestão, texto, título, CSS por id) quando o papel não distinguir o elemento.
**Porquê:** o papel é como as tecnologias assistivas entendem a página, reconhece-se tanto no elemento implícito (um `a` com `href` é link) como no atributo `role` explícito, e sobrevive a mudanças de HTML; localizadores por posição, classes genéricas ou texto solto quebram com qualquer alteração de layout.
**Como verificar:** no diff de um Page Object, conta os localizadores que não são `get_by_*` e exige justificação para cada um.
**Cursos:** 1

### AUT-006 — Nada de XPath copiado do navegador

**Regra:** Não uses XPath copiado do navegador num teste que vai ser mantido; reserva o XPath aos casos em que a hierarquia é parte do que se valida.
**Porquê:** o XPath copiado é verboso e ilegível — pela expressão não se percebe de que botão se trata — e qualquer alteração de layout parte o localizador.
**Como verificar:** procura no diff cadeias com vários `div`/`form` encadeados dentro de `locator(...)`; substitui-as pelo papel ou pelo id.
**Cursos:** 1

### AUT-007 — Um localizador usado numa acção resolve um só elemento

**Regra:** Quando um localizador casa com mais do que um elemento, restringe-o antes de agir: procura dentro da região que o contém, passa `exact=True` quando o texto está contido noutro, ou escolhe a ocorrência com `.nth(i)`.
**Porquê:** o Playwright recusa agir sobre um localizador ambíguo e falha a dizer que resolveu dois elementos — foi o que aconteceu com "Valid input" e "Invalid input", em que o texto de um contém o do outro, e com um nome de botão repetido fora da barra de navegação.
**Como verificar:** no diff, qualquer `get_by_text`/`get_by_label` sem `exact` sobre um texto curto é suspeito; corre o teste e lê o erro, que lista os elementos encontrados.
**Cursos:** 1

## Page Object Model

### AUT-008 — Nenhum selector dentro do teste

**Regra:** Os localizadores vivem como atributos de uma classe por página, numa pasta dedicada; o teste só chama métodos e passa dados.
**Porquê:** sem padrão, os testes enchem-se de selectores e acções misturados e qualquer mudança na aplicação obriga a mexer em muitos sítios; com uma classe por página, a manutenção fica concentrada num lugar.
**Como verificar:** procura `get_by_`, `locator(` ou strings de selector dentro de funções `test_`; procura também o mesmo localizador repetido em duas classes, que pertence à página base.
**Cursos:** 1

## Esperas e asserções

### AUT-009 — Validar a interface com `expect` sobre o localizador

**Regra:** Faz as asserções de estado da interface com `expect(<localizador>)` e a asserção respectiva (visível, contém texto, habilitado), ajustando o `timeout` só onde a operação for mais lenta.
**Porquê:** o `expect` repete a verificação até 5 segundos por omissão, o que absorve o tempo que a aplicação demora a reagir, e a mensagem de erro mostra o que era esperado e o que foi encontrado.
**Como verificar:** no diff, procura asserções sobre valores já lidos da página; passa-as para `expect` sobre o localizador.
**Cursos:** 1

### AUT-010 — Nenhuma espera de tempo fixo

**Regra:** Não escrevas esperas de tempo fixo. Depois de uma acção que dispara uma chamada, sincroniza com a resposta real — `with page.expect_response(...) as info:` à volta da acção — e valida `info.value.status` e o corpo com `json()`.
**Porquê:** o servidor pode ser mais lento ou mais rápido do que o tempo fixo: um teste que verifica a ausência de uma mensagem de erro passa sem que o erro tivesse tido tempo de aparecer. As acções já esperam sozinhas pela accionabilidade do elemento (visível, estável, habilitado) até ao timeout, o que dispensa as esperas explícitas.
**Como verificar:** procura `wait_for_timeout` e `sleep` no diff; onde a asserção segue um clique que chama a API, exige o bloco de espera pela resposta.
**Cursos:** 1

## Rede e dados

### AUT-011 — Cenários difíceis simulam-se na rede, não na aplicação

**Regra:** Para pôr a aplicação num estado difícil de reproduzir (lista vazia, catálogo próprio, erro do servidor), intercepta a chamada com `page.route` e responde com `route.fulfill`, passando `status`, `content_type` e um `body` gerado por `json.dumps`; regista a rota antes do `page.reload` ou da navegação que dispara a chamada.
**Porquê:** sem isto, seria preciso ir à base de dados apagar os registos para testar o ecrã vazio; com o mock, o pedido nem chega ao servidor e o teste não depende do estado do ambiente.
**Como verificar:** confirma que o corpo do mock segue o formato real da chamada (visto no separador de rede do navegador: tipo de conteúdo e estrutura do JSON) e que a rota é registada antes do recarregamento.
**Cursos:** 1

### AUT-012 — Confirmar na base o que o ecrã diz ter gravado

**Regra:** Depois de validar um fluxo de escrita na interface, consulta a base de dados e confirma que o registo ficou lá com os valores certos; a ligação vem de uma fixture e passa por uma camada única (SQLAlchemy), com a string de ligação a mudar entre ambientes.
**Porquê:** uma mensagem de "cadastro realizado com sucesso" não garante que o registo entrou correcto — na demonstração, o utilizador foi gravado como inactivo e só a validação da coluna apanhou o erro. A camada única evita escrever código diferente por cada motor de base de dados.
**Como verificar:** nos testes de escrita, procura a asserção sobre a base a seguir à asserção visual; confirma que o teste recebe a ligação por fixture e não a cria lá dentro.
**Cursos:** 1

## Execução em CI

### AUT-013 — O pipeline instala dependências e navegadores antes de correr

**Regra:** O passo de execução dos testes activa o ambiente virtual, instala as dependências com `pip install -r requirements.txt` e corre `playwright install` antes de chamar o pytest.
**Porquê:** os navegadores do Playwright são descarregados por utilizador e por máquina; num ambiente de integração contínua com mais do que uma máquina, contar que já lá estejam é contar com a sorte. O ficheiro de requisitos é o que lista tudo o que o projecto precisa.
**Como verificar:** lê o passo do job: tem de ter activação do ambiente, instalação dos requisitos e instalação dos navegadores, por essa ordem, antes do pytest.
**Cursos:** 1

### AUT-014 — Relatório HTML autocontido publicado em cada execução

**Regra:** Corre o pytest com `--html=<ficheiro>.html --self-contained-html` e publica o ficheiro como resultado do job, guardando o histórico das execuções anteriores.
**Porquê:** o relatório mostra de imediato que teste falhou e porquê; com o CSS embutido no próprio HTML não há pasta de estilos a acompanhar o ficheiro, que fica arquivável e enviável tal como está.
**Como verificar:** confirma as duas opções na chamada do pytest e a acção de publicação no job, com a opção de manter os relatórios anteriores ligada.
**Cursos:** 1

### AUT-015 — Trace ligado e arquivado como artefacto

**Regra:** Liga o trace na fixture de contexto — `tracing.start` com screenshots, snapshots e sources antes de usar o contexto, `tracing.stop` com o caminho do `.zip` depois do `yield` — e arquiva o `.zip` e os vídeos como artefactos do job.
**Porquê:** uma falha em CI sem evidência não se investiga; o trace traz a linha de imagens, o HTML do ecrã inspeccionável e o código do teste que estava a correr, e abre-se no visualizador do Playwright.
**Como verificar:** confirma o par `start`/`stop` na fixture e os caminhos dos artefactos na acção de arquivo do job (o nome do vídeo é dinâmico, por isso o caminho leva curinga).
**Cursos:** 1

## Testes gerados por IA

### AUT-016 — Rever o teste gerado por IA, e os selectores primeiro

**Regra:** Nenhum teste gerado por IA vai para o repositório sem revisão humana; a primeira coisa a rever são os localizadores, e a seguir se o resultado segue o padrão do projecto.
**Porquê:** o assistente escolhe por vezes localizadores pouco robustos, e o padrão do projecto só é respeitado se vier no pedido — a IA é acelerador, não substituto do conhecimento de quem testa. Quando o resultado foge ao padrão, corrige-se o pedido em vez de se aceitar o desvio.
**Como verificar:** no diff, confronta cada localizador novo com AUT-005 a AUT-007 e confirma que o teste reutiliza os Page Objects e as fixtures que já existem em vez de criar paralelos.
**Cursos:** 1
