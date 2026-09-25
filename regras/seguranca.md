# Regras — Segurança

Prefixo `SEG`. ## Defesa em profundidade nas chamadas ao LLM

### SEG-001 — Sanitizar a entrada antes de ela chegar ao LLM

**Regra:** filtra toda a entrada externa por padrões conhecidos de injecção de prompt (instruções do tipo "ignora as instruções anteriores", delimitadores falsos como `---` ou `===`) antes de a passar ao modelo, e devolve sempre o motivo do bloqueio.
**Porquê:** é a camada mais rápida e barata, corre antes de qualquer chamada paga e apanha os ataques já conhecidos antes de o modelo ver o texto; o motivo do bloqueio é o que depois permite auditar o pedido.
**Como verificar:** no caminho de entrada de cada endpoint ou nó que chama o LLM existe um passo de sanitização anterior à chamada, e o resultado inclui o motivo, não só um booleano.
**Cursos:** 1

### SEG-002 — Mascarar a PII à entrada e à saída

**Regra:** detecta e substitui por marcas de redacção os dados pessoais (email, telefone, número de identificação, cartão) antes da chamada ao LLM e outra vez na resposta, e usa sempre a versão mascarada a jusante.
**Porquê:** o que entra no modelo acaba em traces, caches e logs; mascarar antes da chamada faz com que a PII nunca entre no sistema, e a segunda passagem apanha dados que o modelo regurgite do treino ou do contexto. É um problema legal (GDPR, HIPAA, CCPA) e não só técnico.
**Como verificar:** o detector de PII é chamado nos dois sentidos; nenhum caminho usa o texto original depois de existir a versão mascarada; nada é enviado para tracing antes da máscara.
**Cursos:** 1

### SEG-003 — Usar um LLM separado como portão, com saída JSON binária

**Regra:** quando o pedido passar a sanitização, classifica-o com uma chamada a um LLM dedicado que só devolve JSON com um campo booleano de seguro/inseguro e o motivo; esse modelo nunca responde à pergunta do utilizador.
**Porquê:** a regex não apanha ataques novos, mas um portão de segurança tem de dar uma decisão binária. Deixar o guarda responder em texto livre introduz ambiguidade ("provavelmente é aceitável") num ponto que precisa de ser um sim ou um não.
**Como verificar:** o prompt do guarda impõe formato JSON; o código lê o campo booleano e trata a falha de parsing; a cadeia do guarda é separada da cadeia que responde ao utilizador.
**Cursos:** 1

### SEG-004 — Validar a saída do LLM antes de a entregar

**Regra:** antes de devolver ou de usar a resposta do modelo, verifica-a quanto a fuga de PII e a conteúdo nocivo (instruções de ataque, algo com aspecto de password ou de chave de API) e devolve sempre a versão limpa, nunca a original.
**Porquê:** a saída é a segunda porta aberta da aplicação: mesmo com a entrada limpa, o modelo pode devolver dados pessoais ou conteúdo nocivo. Uma resposta com o conteúdo certo mas no formato errado também parte o que estiver a jusante.
**Como verificar:** existe um validador de saída entre a chamada ao modelo e a resposta; quem chama usa o campo limpo, mesmo quando a validação dá "válido".
**Cursos:** 2

## Ferramentas e ambiente dos agentes

### SEG-005 — Dar a cada agente e ferramenta as permissões mínimas (API a confirmar)

**Regra:** define para cada agente, subagente e ferramenta a lista fechada do que pode usar, restringindo até ao comando concreto (por exemplo, permitir `Bash` só com `grep`) e deixando em só-leitura quem não precisa de escrever.
**Porquê:** o agente tem acesso a bases de dados, APIs e terceiros; quem conseguir sequestrar o prompt ou a chave de API passa a ter acesso às mesmas ferramentas. Menos permissões é menos raio de acção depois de um compromisso.
**Como verificar:** cada definição de subagente tem lista explícita de ferramentas; nenhum agente tem acesso a shell irrestrita ou a escrita sem o justificar pela tarefa; o orquestrador não escreve ficheiros.
**Cursos:** 2

### SEG-006 — Inspeccionar skills e servidores MCP de terceiros antes de os activar

**Regra:** antes de activar uma skill ou um servidor MCP que não foi escrito no projecto, lê a descrição e todos os scripts que ele executa, e decide com base nesse conteúdo, não no número de estrelas, no rótulo "official" nem no aspecto do site.
**Porquê:** uma skill ou um MCP é código de terceiros que corre na máquina e, ao contrário de um executável, fica ligado ao agente e pode ser accionado vezes sem conta. Prova social não é segurança.
**Como verificar:** cada skill ou MCP de terceiros tem registo de quem inspeccionou o conteúdo e quando; nenhuma foi activada só por ser popular ou por estar num agregador.
**Cursos:** 1

### SEG-007 — Não conceder ao agente aprovação prévia genérica para executar código (API a confirmar)

**Regra:** não escrevas no CLAUDE.md nem nos settings autorizações do tipo "podes correr skills à vontade", e não deixes ligado por omissão o modo que executa tudo sem confirmação; se for mesmo preciso auto-aprovação total, corre o agente numa máquina isolada ou remota.
**Porquê:** na demonstração do curso foi exactamente uma autorização genérica no CLAUDE.md que deixou correr sozinha a skill que exfiltrou o `.env`; o aviso do agente só chegou depois. Sem confirmação, o agente também toma atalhos perigosos, como apagar os testes que falham em vez de os corrigir.
**Como verificar:** o CLAUDE.md e os ficheiros de settings não têm autorizações abrangentes de execução; o modo sem confirmação não está activo por omissão, ou o trabalho corre numa máquina dedicada.
**Cursos:** 2

### SEG-008 — Bloquear os comandos destrutivos antes de correrem (API a confirmar)

**Regra:** configura um hook de pré-uso de ferramenta que inspeccione o comando ou o ficheiro alvo e o rejeite (no Claude Code, saindo com o código 2) quando corresponder a uma operação destrutiva ou a um caminho protegido; a auditoria posterior não substitui este bloqueio.
**Porquê:** o hook é automação determinística — garante que algo nunca acontece, ao contrário de uma instrução que o modelo pode ignorar. Um hook de pós-uso só regista o que já correu.
**Como verificar:** existe um hook de pré-uso com a lista de comandos e de caminhos bloqueados, e um teste que confirma que a operação destrutiva é recusada. O bloqueio da shell não cobre a edição nem a eliminação directa de ficheiros; que ferramentas o matcher tem de abranger está por decidir em [revisão](_revisao/seguranca.md).
**Cursos:** 2

### SEG-009 — Não dar segredos aos agentes

**Regra:** não escrevas chaves de API, passwords nem dados pessoais em prompts, e não os deixes em ficheiros que o agente lê; quando o agente precisar mesmo de uma chave, o script que ele escreve vai buscá-la em runtime a um gestor de segredos, em vez de a ter em texto.
**Porquê:** não se sabe para onde vai esse texto, onde fica registado nem onde é tracejado, e a tendência é partilhar de mais com o agente só por confiança por omissão. Foi assim que a skill da demonstração apanhou as chaves AWS, a password da base de dados e o token do GitHub.
**Como verificar:** nenhum prompt, ficheiro de contexto ou documento do projecto contém valores reais de segredos; o código lê as chaves em runtime e não as escreve em nenhum ficheiro do repositório.
**Cursos:** 1

## Segredos e configuração

### SEG-010 — Ler as credenciais de variáveis de ambiente, nunca do código

**Regra:** utilizadores, passwords, chaves de API e segredos de assinatura lêem-se de variáveis de ambiente; não aparecem escritos no código nem em ficheiros de configuração que vão para o repositório.
**Porquê:** uma credencial publicada num repositório é encontrada — pelo GitHub, que avisa, ou por quem a for usar para entrar no servidor. Variáveis de ambiente também permitem valores diferentes por ambiente sem tocar no código.
**Como verificar:** uma busca no repositório por chaves e passwords não devolve valores reais; toda a leitura de credenciais passa por variáveis de ambiente ou pelo objecto de configuração.
**Cursos:** 2

### SEG-011 — Manter o `.env` fora do git e versionar um `.env.example`

**Regra:** o `.env` com valores reais entra no `.gitignore` e nunca é submetido; em vez dele versiona-se um `.env.example` com as mesmas chaves e valores de exemplo.
**Porquê:** o ficheiro de exemplo documenta à equipa que variáveis são precisas sem expor nenhuma; o real fica só na máquina ou na plataforma de deploy.
**Como verificar:** o `.gitignore` inclui o `.env`; existe um `.env.example` com todas as chaves usadas pela aplicação e sem valores reais; `git log` não mostra o `.env`.
**Cursos:** 2

### SEG-012 — Validar a configuração no arranque e falhar de imediato

**Regra:** centraliza a configuração num objecto que declara as chaves obrigatórias e carrega-o no arranque, para a aplicação falhar logo com um erro claro quando faltar uma chave, em vez de falhar a meio de um pedido.
**Porquê:** descobrir a meio do pedido de um utilizador que falta a chave da API é o pior momento para falhar; a validação no arranque transforma isso num erro explícito, com o nome do campo em falta.
**Como verificar:** existe um único ponto de configuração com os campos obrigatórios declarados; arrancar sem uma chave obrigatória dá erro imediato e nomeia o campo.
**Cursos:** 1

### SEG-013 — Gerar passwords, tokens e chaves com `secrets.SystemRandom`

**Regra:** tudo o que for password, token, chave ou identificador que não possa ser adivinhado gera-se com o módulo `secrets` (`secrets.SystemRandom`); o módulo `random` fica reservado para testes e simulações.
**Porquê:** o `random` é determinístico a partir da seed e usa o tempo, o que abre a porta a reproduzir os valores gerados; o `secrets` usa a aleatoriedade do sistema operativo e ignora a seed.
**Como verificar:** nenhuma geração de credencial ou token importa `random`; as que existem usam `secrets`.
**Cursos:** 1

## Entradas e dados

### SEG-014 — Passar os valores por placeholders em todos os comandos SQL

**Regra:** nos comandos SQL, os valores vão sempre por placeholders (`?` no `sqlite3`, `%s` e `%(chave)s` no PyMySQL, parâmetros nomeados no ORM) e passam-se à parte; nunca se concatenam nem se formatam na string do comando.
**Porquê:** um comando SQL montado por concatenação deixa quem escreve o valor escrever também comando — é assim que se apaga uma tabela por engano ou de propósito. Com placeholders, o motor separa o que é comando do que é valor.
**Como verificar:** não há f-strings, `%` nem `+` a montar comandos SQL com dados externos; os valores aparecem sempre como segundo argumento do `execute`.
**Cursos:** 1

### SEG-015 — Não passar entrada externa a `eval()` nem a `subprocess` com `shell=True`

**Regra:** não avalies com `eval()` texto vindo do utilizador, de um ficheiro ou de um modelo, e não montes comandos de shell com esse texto; usa a função concreta que faz o trabalho (`math.pow` em vez de avaliar uma potência) e passa os argumentos de `subprocess` numa lista, sem `shell=True`.
**Porquê:** o `eval()` executa qualquer código que lhe chegue — na calculadora do curso, escrever `print(1234)` no visor bastou para o executar. O `shell=True` dá ao texto externo acesso ao shell do sistema.
**Como verificar:** o projecto não usa `eval()` sobre dados que não controla; as chamadas a `subprocess` passam listas de argumentos e não usam `shell=True` com entrada externa.
**Cursos:** 1

### SEG-016 — Filtrar pelo utilizador autenticado em todas as consultas a dados de utilizadores

**Regra:** quando um registo pertence a um utilizador, todas as consultas de leitura, actualização e eliminação incluem o dono vindo da sessão autenticada, e o dono atribui-se a partir dessa sessão, nunca dos dados que chegam no pedido.
**Porquê:** sem o filtro, basta adivinhar um identificador no URL para ver ou apagar dados de outra pessoa; esconder o botão na interface não impede nada. Com o filtro, quem não é dono recebe "não encontrado" e nem sabe que o registo existe.
**Como verificar:** cada consulta a um recurso com dono tem a condição do utilizador autenticado, incluindo nas vistas de detalhe, de actualização e de eliminação; testar com duas contas distintas.
**Cursos:** 1

## Infraestrutura e API

### SEG-017 — Correr os containers com um utilizador dedicado, não como root

**Regra:** o Dockerfile cria um utilizador próprio, dá-lhe a posse das pastas de que a aplicação precisa e muda para ele antes do comando de arranque; nenhum container de produção corre como root.
**Porquê:** um processo comprometido dentro do container herda as permissões com que corre; com root, isso é o container inteiro.
**Como verificar:** o Dockerfile tem a criação do utilizador e a instrução que muda para ele antes do comando final; nenhuma imagem de produção fica a correr como root.
**Cursos:** 2

### SEG-018 — Aplicar rate limiting por IP e expor um health check na API do agente

**Regra:** qualquer API que sirva um agente tem limite de pedidos por IP e um endpoint de estado que o orquestrador de containers possa consultar.
**Porquê:** o pipeline de validação e guarda é um ponto de partida, não uma solução completa: sem limite de pedidos, o custo por inferência transforma um cliente abusivo num problema de facturação. O health check é o que permite ao Docker marcar o container como não saudável.
**Como verificar:** existe o limitador configurado nos endpoints que chamam o modelo e um endpoint de estado ligado ao healthcheck do container.
**Cursos:** 1
