# Decisões — Grupo 3: processo com agentes, specs e segurança

> Fontes consultadas a 2026-09-17.

## D-PR01 — Que modo de permissão usam os agentes no dia-a-dia?

**Temas:** dev-com-agentes · **Regras afectadas:** nenhuma (PROC-023 aplica-se em qualquer modo)

**Decisão:** Usa o modo `auto` no dia-a-dia, com o `deny` e o hook de guarda da PROC-023 sempre activos, e reserva `bypassPermissions` para ambientes isolados.

**Porquê:** A documentação actual do Claude Code já arranca em `auto` por omissão nos planos Pro, Max e Team, com um classificador que revê cada acção antes de correr. É o que reduz mais os pedidos de aprovação sem perder barreira automática, porque `deny` e hooks continuam a valer em `auto` e em `bypassPermissions`. O `acceptEdits` das aulas só cobre edições de ficheiros e comandos comuns do sistema de ficheiros; não revê comandos de shell nem chamadas de rede.


**Contra:** O `auto` exige Sonnet 5, Opus 4.7 ou modelo posterior, e nos planos Enterprise o arranque continua a ser manual. Um projecto que prefira controlo total, ou que corra sem supervisão em CI, deve ficar em `default`/`acceptEdits` ou passar a `dontAsk`.

**Confiança:** alta

## D-PR02 — Que formato de spec usa o projecto: convenção própria, OpenSpec ou só fases e tarefas?

**Temas:** dev-com-agentes (destacada pelo dono do projecto) · **Regras afectadas:** PROC-012, PROC-013

**Decisão:** Mantém a convenção própria em Markdown, com as secções da PROC-012 e a evidência por tarefa da PROC-013; não adopta o OpenSpec como dependência do fluxo.

**Porquê:** O OpenSpec não é um projecto abandonado: tem lançamentos recentes, licença MIT e liga-se ao Claude Code por slash commands próprios. Mas corre em Node.js, o que junta um segundo motor de execução a um projecto só em Python com `uv`, e o fluxo `explore → propose → apply → archive` não cobre nada que a PROC-012/013 já não cubra para um só programador.


**Contra:** Se o projecto passar a usar mais do que um assistente de IA a par (Cursor, Copilot), o OpenSpec dá-lhes um formato de spec comum, o que a convenção própria não dá. Reconsiderar nesse cenário ou se a equipa deixar de ser de uma pessoa.

**Confiança:** média

## D-PR03 — Uma spec por funcionalidade ou várias por camada, e com quanto detalhe técnico?

**Temas:** dev-com-agentes · **Regras afectadas:** PROC-015

**Decisão:** Mantém uma spec por funcionalidade, com tarefas por camada em subagentes separados (PROC-015), e mais detalhe técnico enquanto não houver skills maduras para essa camada.

**Porquê:** É decisão de processo interno; a literatura sobre specs para agentes não fixa um número de specs por funcionalidade. O que confirma é o critério para o detalhe: ajustar ao risco da tarefa, não ao tamanho do ficheiro.


**Contra:** Um projecto com mais programadores, ou onde front-end e back-end mudam a ritmos diferentes, ganha com specs encadeadas por camada (a opção do curso Arq. com IA). Reconsiderar se o projecto ganhar essa divisão de responsabilidades.

**Confiança:** média

## D-PR04 — A partir de que tamanho se escreve um PRD ou uma spec?

**Temas:** dev-com-agentes, arquitetura · **Regras afectadas:** PROC-011

**Decisão:** Mantém o critério já fixado na PROC-011 ("mais de uma sessão"); correcções pequenas e tarefas de uma sessão não levam spec, nem uma versão mínima dela.

**Porquê:** A mesma fonte que decide a D-PR03 dá aqui o critério que faltava: não sobre-especificar uma tarefa trivial. Uma spec para uma correcção pequena custa mais do que preveni-la.


**Contra:** Nenhuma fonte forte defende o oposto (spec sempre, mesmo para o trivial); só a Formação CC recomenda planear tudo, sem distinguir tamanho. Sem motivo para mudar.

**Confiança:** média

## D-PR05 — Quando se cria a memória do projecto?

**Temas:** dev-com-agentes · **Regras afectadas:** PROC-003

**Decisão:** Começa a memória do projecto (CLAUDE.md e o que vier a substituir a pasta `memory/`) desde a primeira sessão e acrescenta-lhe conteúdo por regra, não por marco; não espera por um módulo inteiro validado.

**Porquê:** A documentação actual do Claude Code contraria as duas opções das aulas: não manda esperar por "produto real" nem trata a memória como pasta à parte, opcional. Manda escrever no CLAUDE.md assim que Claude erra da mesma forma duas vezes, ou assim que se repete uma correcção já dada numa sessão anterior.


**Contra:** Para regras de negócio (o que a divergência original tinha em mente, não preferências de sessão), escrevê-las só depois de o código estar validado evita documentar uma decisão que ainda muda. Se o domínio for muito instável nas primeiras semanas, adiar para o primeiro módulo estável continua defensável.

**Confiança:** média

## D-PR06 — De onde podem vir os servidores MCP de terceiros?

**Temas:** dev-com-agentes · **Regras afectadas:** PROC-025

**Decisão:** Só de fontes verificadas (catálogo oficial do fornecedor, Docker MCP Catalog, modelcontextprotocol.io); um servidor de outro catálogo passa por leitura do código antes de ligar.

**Porquê:** A documentação oficial do protocolo trata um servidor MCP local como código que corre com os privilégios do cliente, capaz de ler `~/.ssh` ou executar `rm -rf` a partir de um comando de arranque malicioso. A popularidade num catálogo não é sinal de segurança.


**Contra:** Nenhuma fonte reconhecida recomenda catálogos sem curadoria; a única razão para os usar é conveniência, que a demonstração do LangChain §27 já mostrou custar caro.

**Confiança:** alta

## D-PR07 — Onde ficam os segredos em desenvolvimento: `.env` local ou gestor de segredos?

**Temas:** seguranca · **Regras afectadas:** SEG-009, SEG-010, SEG-011, PROC-024

**Decisão:** Mantém o `.env` como mecanismo de carregamento em desenvolvimento, bloqueia a sua leitura pelo agente com o hook da SEG-008 e só passa a gestor de segredos quando houver chaves ligadas a facturação real.

**Porquê:** O OWASP não trata o `.env` como excepção proibida; pede é que os segredos de desenvolvimento nunca sejam os de produção e que o acesso a eles siga o princípio do menor privilégio. Isso cobre-se bloqueando a leitura ao agente, não trocando de mecanismo.


**Contra:** Um gestor de segredos com injecção em runtime tira o `.env` de cima da mesa por completo, incluindo do disco; é a opção mais forte se algum dia houver chaves de produção na mesma máquina de desenvolvimento.

**Confiança:** média

## D-PR08 — Que ferramentas tem um hook de bloqueio de cobrir para ser considerado suficiente?

**Temas:** seguranca · **Regras afectadas:** SEG-008, PROC-023

**Decisão:** O `matcher` do hook `PreToolUse` cobre `Bash|PowerShell|Write|Edit`, não só a shell.

**Porquê:** O `matcher` de um hook aceita vários nomes de ferramenta separados por `|`; nada obriga a escolher entre shell e edição. Um hook só de shell deixa passar exactamente o ataque que o curso de Cursor mostrou: apagar um ficheiro pela ferramenta de edição.


**Contra:** Nenhum. Cobrir mais ferramentas no `matcher` não tem custo de desempenho nem de falsos positivos que justifique deixar alguma de fora.

**Confiança:** alta

## D-PR09 — Que mecanismo de configuração por ambiente usar?

**Temas:** seguranca · **Regras afectadas:** SEG-012

**Decisão:** `pydantic-settings`, com `BaseSettings` a carregar de variáveis de ambiente e de `.env`.

**Porquê:** O doze factores pede configuração em variáveis de ambiente, não em ficheiros como o `local_settings.py` do Django; o `pydantic-settings` cumpre isso e acrescenta a validação que a SEG-012 exige. Um campo em falta ou de tipo errado dá um `ValidationError` na construção do objecto, antes de qualquer pedido.


**Contra:** Nenhum dos dois textos fala de validação no arranque como requisito do doze factores; é o `pydantic-settings`, não a metodologia, que garante isso. Se o projecto largasse o Pydantic, teria de repor essa validação à mão.

**Confiança:** alta

## D-PR10 — Que código de resposta devolver a um acesso não autorizado?

**Temas:** seguranca · **Regras afectadas:** SEG-016

**Decisão:** **401** quando faltam credenciais de autenticação válidas (token ausente, expirado ou inválido), com o cabeçalho `WWW-Authenticate` na resposta; **404** quando o pedido está autenticado mas o recurso pertence a outro utilizador; **403** para uma recusa que não se quer esconder e que não é questão de credenciais (por exemplo, um papel sem permissão para a operação).

**Porquê:** o RFC separa os três casos, e trocá-los tem consequência prática — um cliente que recebe 401 sabe que deve autenticar-se e repetir; um que recebe 403 não deve repetir com as mesmas credenciais. Para os dados com dono, o 404 é o que a SEG-016 já implementa: quem não é dono não descobre sequer que o registo existe.


**Contra:** Uniformizar em 404 é mais simples de implementar e evita o risco de um 403 mal colocado revelar a existência de um recurso por engano; escolher isso se o projecto preferir simplicidade a precisão semântica.

**Confiança:** alta

**Nota de revisão (2026-09-17):** a versão inicial desta entrada atribuía **403** ao caso de token ausente ou inválido. O RFC reserva esse caso ao **401**; corrigido depois de ler as secções 15.5.2 e 15.5.4 no texto do RFC.

## D-PR11 — Onde guardar o token de acesso do cliente da API?

**Temas:** seguranca · **Regras afectadas:** nenhuma

**Decisão:** Cabeçalho `Authorization: Bearer`, porque o cliente esperado de uma API de agente não é um navegador; o cookie `httpOnly` só entra se e quando existir uma aplicação web a consumir a API.

**Porquê:** A recomendação de cookie `httpOnly` do OWASP visa clientes de navegador, para tirar o token do alcance de um ataque de XSS em JavaScript. Um cliente que não corre num navegador não tem esse vector nem acesso a cookies do mesmo modo, por isso o cabeçalho é a única forma aplicável.


**Contra:** Se o projecto vier a ter uma interface web própria a consumir esta API, o cookie `httpOnly` volta à mesa para esse cliente específico, sem deixar de servir o cabeçalho a outros.

**Confiança:** alta

## D-PR12 — Como conciliar subagentes locais do projecto com uma política central?

**Temas:** seguranca · **Regras afectadas:** nenhuma (relaciona-se com SEG-005 e SEG-006)

**Decisão:** Os subagentes ficam definidos localmente e versionados em `.claude/agents/`; a lista de skills e de servidores MCP permitidos fica num ficheiro de `settings` também versionado no repositório, não em CLAUDE.md.

**Porquê:** A documentação distingue as duas camadas: `settings` (permissões, `deny`) é imposto pelo cliente independentemente do que Claude decida, mas o CLAUDE.md é só contexto que Claude tenta seguir. Autorizar código de terceiros pertence à camada que é mesmo imposta.


**Contra:** Um projecto de uma só pessoa não tem administrador a validar essa lista central, ao contrário do cenário do LangChain §27; nesse caso, o ficheiro de `settings` versionado é revisto pelo próprio dono a cada alteração, não por terceiro.

**Confiança:** média
