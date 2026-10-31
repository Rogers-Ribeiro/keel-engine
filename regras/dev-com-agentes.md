# Regras — Desenvolvimento com agentes de IA

Prefixo `PROC`. ## Contexto e sessões

### PROC-001 — Uma sessão nova por funcionalidade ou spec

**Regra:** Começa cada funcionalidade, spec ou mudança de tarefa numa sessão nova, com contexto limpo, em vez de continuar a conversa anterior.
**Porquê:** Numa conversa longa, o contexto que já não interessa à tarefa é comprimido e arrastado, gasta tokens e piora o resultado, que se afasta do pedido.
**Como verificar:** No plano de execução ou no registo da spec, cada spec é executada numa sessão ou num subagente próprio; nenhuma instrução manda continuar várias specs na mesma conversa.
**Cursos:** 4

### PROC-002 — Restrições explícitas no pedido

**Regra:** Escreve na spec, ou nas instruções de execução, o que o agente não pode fazer: instalar software, alterar interfaces já definidas, mudar regras de negócio já prontas ou mexer em pastas fora do âmbito.
**Porquê:** Sem essas restrições o agente procura alternativas por conta própria (instala bibliotecas, adapta o negócio à interface) e toma decisões que ninguém pediu.
**Como verificar:** A spec tem uma secção de restrições ou de "não fazer"; o diff não traz dependências novas, nem alterações a interfaces ou regras de negócio que a spec não pedia.
**Cursos:** 3

### PROC-003 — CLAUDE.md curto, concreto e sem segredos

**Regra:** Mantém o CLAUDE.md específico (comandos, convenções, regras críticas), actualizado, com menos de 200 linhas e sem senhas, tokens ou chaves.
**Porquê:** É o que sobrevive entre sessões; um ficheiro vago, gigante ou desactualizado confunde o agente, e um segredo nele fica exposto a todas as sessões e ao repositório.
**Como verificar:** O CLAUDE.md tem menos de 200 linhas, não contém valores de credenciais e os comandos que lista existem no projecto.
**Fonte:** [referência](../docs/claude-code-formatos.md)
**Cursos:** 2

### PROC-039 — Normas da equipa no CLAUDE.md do projecto, nunca no pessoal

**Regra:** Escreve as convenções, os requisitos de testes e as regras de arquitectura que a equipa partilha no CLAUDE.md do repositório (ou em `.claude/rules/`), versionado; o `~/.claude/CLAUDE.md` e o `CLAUDE.local.md` ficam só para preferências pessoais.
**Porquê:** O ficheiro do utilizador não vai para o repositório, por isso uma norma escrita lá só vale para quem a escreveu e falha em silêncio para os colegas; mandar cópias do ficheiro pessoal faz as versões divergirem.
**Como verificar:** O CLAUDE.md da raiz está no Git e contém as normas de equipa; o `CLAUDE.local.md` está no `.gitignore` e não tem regras que a equipa precise de seguir.
**Fonte:** [referência](../docs/claude-code-formatos.md)
**Cursos:** 2

### PROC-042 — Convenção de um tipo de ficheiro numa regra com `paths`

**Regra:** Escreve a convenção que segue um tipo de ficheiro espalhado pela árvore (os testes ao lado do código, os ficheiros de infraestrutura) num ficheiro de `.claude/rules/`, um assunto por ficheiro, com `paths` no frontmatter a listar os globs que o apanham; a convenção que pertence só a uma pasta vai para um CLAUDE.md dessa pasta. Não a ponhas no CLAUDE.md da raiz nem em cópias por várias pastas.
**Porquê:** Com `paths`, a regra só entra quando o Claude lê um ficheiro que corresponde, por isso não gasta contexto nem se mistura com trabalho que não é dela; as cópias por pasta divergem com o tempo e cada pasta nova precisa da sua, enquanto um glob com `**` apanha os ficheiros novos sem ninguém mexer na regra.
**Como verificar:** As convenções por tipo de ficheiro estão em `.claude/rules/<assunto>.md` com `paths`; o CLAUDE.md da raiz não tem secções dessas, e o mesmo bloco não se repete em CLAUDE.md de várias pastas.
**Fonte:** [referência](../docs/claude-code-formatos.md)
**Cursos:** 2

## Skills e subagentes

### PROC-004 — Skills por engenharia reversa de código validado

**Regra:** Cria cada skill de codificação só depois de o padrão estar implementado e validado no projecto, gerando-a a partir desse código e com exemplos reais dele.
**Porquê:** Uma skill escrita do zero traz exemplos que podem nem compilar e não reflecte a forma como o projecto aplica o padrão.
**Como verificar:** Cada skill nova referencia ficheiros existentes e validados do projecto como exemplo; não há skills para padrões que ainda não existem no código.
**Cursos:** 3

### PROC-005 — Corrigir a skill, não só o resultado

**Regra:** Quando uma skill produz um erro ou um resultado fora da convenção, corrige também a instrução dentro da skill, além do artefacto gerado.
**Porquê:** Se só o código for corrigido, a skill volta a gerar o mesmo erro nos módulos seguintes.
**Como verificar:** Um diff que corrige código gerado por uma skill traz a alteração correspondente no `SKILL.md`, ou justifica porque não a traz.
**Cursos:** 2

### PROC-006 — A `description` diz quando usar

**Regra:** Escreve na `description` de cada skill e de cada subagente, de forma concreta, em que situações deve ser usado.
**Porquê:** É a `description` que o agente lê para decidir, sem pedido explícito, que skill ou subagente usar.
**Como verificar:** Cada `SKILL.md` e cada `.claude/agents/<nome>.md` tem uma `description` com gatilhos concretos (tarefas, termos, ficheiros), e não apenas o nome repetido.
**Fonte:** [referência](../docs/claude-code-formatos.md)
**Cursos:** 4

### PROC-007 — Invocação explícita nos passos críticos

**Regra:** Nos passos de uma spec que dependem de uma skill ou de um subagente, invoca-os pelo nome (`/nome` para a skill, `@agent-<nome>` para o subagente) em vez de confiar no disparo pela `description`.
**Porquê:** O disparo indirecto deixa margem para o agente não chamar a skill.
**Como verificar:** As tarefas da spec que precisam de uma skill ou de um subagente indicam-no pelo nome.
**Fonte:** [referência](../docs/claude-code-formatos.md)
**Cursos:** 2

### PROC-008 — Skills com passos numerados e condições de paragem

**Regra:** Escreve o corpo de cada skill como uma lista numerada de passos, com condições de paragem explícitas ("se X acontecer, pára e pergunta").
**Porquê:** Fluxos em passos são seguidos com mais fiabilidade do que parágrafos, e as condições de paragem evitam decisões perigosas.
**Como verificar:** O `SKILL.md` tem passos numerados e pelo menos uma condição de paragem para os casos de risco.
**Cursos:** 2

### PROC-009 — Subagentes só com as ferramentas do seu papel

**Regra:** Declara no campo `tools` de cada subagente só as ferramentas de que o seu papel precisa; um subagente que só lê e analisa não recebe ferramentas de escrita.
**Porquê:** O campo `tools` é uma lista branca: o que não está listado fica bloqueado, o que limita os danos de um subagente que se engane.
**Como verificar:** Cada `.claude/agents/<nome>.md` tem `tools` explícito; revisores e auditores não têm `Write` nem `Edit`.
**Fonte:** [referência](../docs/claude-code-formatos.md)
**Cursos:** 1

### PROC-010 — Times de agentes pequenos e sem sobreposição

**Regra:** Num time de agentes em paralelo, dá a cada agente um âmbito que não se sobreponha aos outros, não deixes dois agentes escrever no mesmo ficheiro, define por escrito o formato da síntese e não passes de 5 agentes.
**Porquê:** Âmbitos sobrepostos e ficheiros partilhados geram conflitos, uma síntese sem formato não se consegue juntar, e times grandes disparam o custo em tokens.
**Como verificar:** A orquestração lista os agentes (no máximo 5), o âmbito e os ficheiros de cada um, e o formato esperado do resultado.
**Cursos:** 2

### PROC-043 — O pedido a um subagente de pesquisa diz a pergunta, o âmbito, a forma da resposta e quando parar

**Regra:** Quando delegas uma investigação num subagente, escreve no pedido uma pergunta concreta (e não uma tarefa aberta como "explica como funciona"), o âmbito (que pastas ou tipos de ficheiro ver e quais ignorar), a forma exacta da resposta com um tamanho máximo (por exemplo caminho, linha e um resumo curto) e a condição de paragem.
**Porquê:** Um pedido vago devolve uma narrativa que volta a encher o contexto que a delegação devia proteger; sem limite de tamanho o subagente não sabe quanto devolver, e sem condição de paragem insiste numa pesquisa difícil e regressa tarde com mais do que se precisava.
**Como verificar:** Cada prompt de delegação de pesquisa (no código, numa skill ou na definição de um agente) tem a pergunta, o âmbito, o formato de retorno com limite e a condição de paragem.
**Cursos:** 1

### PROC-048 — Um agente novo justifica-se pelo que precisa de diferente, não pelo papel

**Regra:** Só cries um subagente quando ele precisa de algo que o agente principal não tem: contexto limpo (não ver a conversa de quem fez o trabalho), outras ferramentas ou permissões, outro modelo, ou trabalho paralelo e independente (AGT-032). Um papel (PO, UX, backend, arquitecto sénior) não justifica um agente: o conhecimento dessa área entra pelas regras com `paths:` e pelas skills, no mesmo agente.
**Porquê:** Uma persona no system prompt não melhora o desempenho em tarefas objectivas e o seu efeito é em grande parte aleatório; o que o agente sabe de uma área vem do contexto que recebe, não do nome que lhe dão. Cada agente a mais acrescenta coordenação, que é onde caem duas das três categorias de falha dos sistemas multiagente (desenho do sistema e desalinhamento entre agentes), e custa várias vezes mais tokens.
**Como verificar:** Cada ficheiro em `.claude/agents/` (ou definição de subagente no código) difere do agente principal em pelo menos um de: `tools`, `model`, contexto recebido (por exemplo só o diff e a spec), ou execução em paralelo com âmbito próprio (PROC-010). Um agente cujo único traço próprio é o papel e o tom no prompt é achado.
**Fonte:** [Contexto e qualidade §5](../docs/contexto-e-qualidade.md)
**Cursos:** 1

## Especificações e execução

### PROC-011 — PRD ou spec antes de trabalho longo

**Regra:** Antes de implementar trabalho que ocupe mais de uma sessão, gera em modo de planeamento um PRD ou uma spec, revê-o e só depois pede código.
**Porquê:** Sem esse documento o agente trabalha às cegas e preenche as lacunas com decisões próprias; corrigir um erro sai mais caro a cada fase que passa.
**Como verificar:** Existe um PRD ou uma spec revista antes do primeiro commit da funcionalidade.
**Cursos:** 3

### PROC-012 — Spec com critérios de aceite mensuráveis

**Regra:** Inclui em cada spec o objectivo, os requisitos funcionais e não funcionais, o âmbito e o que fica fora dele, as restrições técnicas e critérios de aceite verificáveis, com números no lugar de adjectivos (por exemplo, "responde em menos de 300 ms com 10 mil registos").
**Porquê:** Uma spec sem estes elementos parece uma especificação mas não permite verificar nada, e o incremento tende a crescer sozinho.
**Como verificar:** A spec tem todas estas secções, e cada critério de aceite pode ser confirmado por um teste ou por uma medição.
**Cursos:** 1

### PROC-013 — Tarefas marcadas com evidência

**Regra:** Faz o agente marcar cada tarefa da spec como concluída e registar por baixo uma evidência (data, hora, o que foi feito e os desvios); a spec só está concluída quando todas as tarefas têm evidência.
**Porquê:** A evidência dá rastreabilidade: sem ela não há como confirmar que o agente fez exactamente o que foi pedido.
**Como verificar:** Na spec concluída, todas as caixas estão marcadas e cada tarefa tem uma evidência com data e hora.
**Cursos:** 3

### PROC-014 — Regra de negócio nova volta à spec

**Regra:** Se durante a implementação surgir uma regra de negócio que a spec não previa, pára, regista a decisão na spec e só depois continua.
**Porquê:** A spec é a fonte da verdade; uma decisão tomada só no código fica escondida e perde-se.
**Como verificar:** Os comportamentos de negócio presentes no diff estão todos descritos na spec, incluindo os acrescentados durante a implementação.
**Cursos:** 1

### PROC-015 — Cada parte num subagente com contexto limpo

**Regra:** Executa cada passo ou camada da spec (negócio, back-end, front-end) num subagente separado, com contexto limpo, e em sequência quando uma parte depende da anterior.
**Porquê:** Cada subagente começa sem o contexto das tarefas anteriores, o que poupa tokens e evita arrastar informação irrelevante.
**Como verificar:** A spec ou o prompt de execução indica um subagente por parte e a ordem em que correm.
**Cursos:** 4

### PROC-016 — Verificações concretas dentro da spec

**Regra:** Inclui na própria spec os passos de verificação: correr os testes, exigir uma cobertura mínima, testes de integração e o resultado esperado de cada parte.
**Porquê:** As verificações embutidas no harness não bastam; os passos de verificação escritos na spec obrigam o agente a confirmar o que fez e a corrigir o que falta.
**Como verificar:** A spec tem tarefas de verificação com comandos e limiares concretos, e as evidências mostram que correram.
**Cursos:** 4

### PROC-017 — Testar cada fase antes da seguinte

**Regra:** Testa cada fase ou funcionalidade que o agente dá como concluída e só depois passa à fase seguinte; o que faltar entra na fase seguinte do plano.
**Porquê:** O agente pode dar como feito algo que falha ou está incompleto, e os erros acumulados entre fases são mais difíceis de isolar.
**Como verificar:** O plano de fases regista, para cada fase, o teste feito e o resultado antes do início da seguinte.
**Cursos:** 3

### PROC-018 — Arquivar só depois de verificar, com commit

**Regra:** Arquiva cada spec só depois de confirmar que todas as tarefas têm evidência e que as verificações passaram, faz commit desse incremento e só então começa a spec seguinte.
**Porquê:** Deixar mudanças implementadas por arquivar ou por fazer commit mistura incrementos e perde o ponto seguro para onde voltar.
**Como verificar:** Não há specs implementadas fora do arquivo; cada spec arquivada corresponde a um commit.
**Cursos:** 6

### PROC-044 — A spec cobre os casos de erro e de borda

**Regra:** Antes de entregar uma spec ao agente, escreve nela o comportamento esperado nos casos de erro e de borda — entrada inválida, recurso inexistente, serviço externo em baixo, limites — e não só o caminho feliz, com critérios de aceite para cada um.
**Porquê:** Esquecer estes casos é uma das armadilhas comuns de uma spec: o que ela não diz, o agente adivinha, e uma spec que falha no começo dá código errado, ambiguidades por resolver e retrabalho.
**Como verificar:** A spec tem cenários ou critérios de aceite para entrada inválida, recurso inexistente e falha das dependências externas da funcionalidade, e os testes do incremento cobrem-nos.
**Cursos:** 2

### PROC-045 — Bug reproduzido num teste que falha antes da correcção

**Regra:** Antes de mudar código para corrigir um bug, reprodu-lo num teste que falha; a correcção vai à causa, e só está feita quando esse teste passa e os restantes continuam a passar.
**Porquê:** O teste que falha prende o sintoma a algo concreto e dá ao agente um ciclo curto de mudar, correr e ler o resultado; quando passa, é prova de que a correcção resultou. Calar o sintoma (apanhar o erro, acrescentar uma repetição, cortar a saída) deixa a causa no sítio, e ela volta por outro caminho.
**Como verificar:** Um diff que corrige um bug traz um teste novo que reproduz o caso e que falharia sem a correcção, e não se limita a envolver o erro num `try`/`except` ou a acrescentar repetições.
**Cursos:** 1

## Arquitectura e revisão humana

### PROC-019 — Arquitectura definida antes do código

**Regra:** Define os módulos, as camadas e os padrões do projecto antes de pedir implementação ao agente; as decisões estruturais ficam com a pessoa.
**Porquê:** Sem padrões indicados, o agente reproduz código mediano: num caso relatado gerou ficheiros de 2000 a 3000 linhas e duplicou funções.
**Como verificar:** Existe documentação de arquitectura (módulos, camadas, padrões) anterior às specs, e o código novo fica nos lugares que ela define.
**Cursos:** 5

### PROC-020 — Interface própria para o fornecedor de IA

**Regra:** Faz os casos de uso dependerem de uma interface do próprio projecto para cada serviço externo, incluindo o fornecedor de IA; a implementação concreta (SDK, biblioteca) fica fora da camada de negócio.
**Porquê:** Assim o negócio não fica preso ao SDK e a implementação troca-se sem mexer nos casos de uso.
**Como verificar:** Os módulos de negócio não importam SDKs de modelos nem bibliotecas de infraestrutura; recebem uma interface, e a classe concreta vive numa camada exterior.
**Cursos:** 3

### PROC-021 — Revisão humana do que a IA gera

**Regra:** Revê o código, as dependências, a modelagem e a documentação que a IA gera antes de os aceitar, e não aceites o que não compreendes; a modelagem de um domínio real valida-se com quem conhece o negócio.
**Porquê:** Quem não olha para o código fica refém da IA e inseguro sobre o próprio projecto, e a modelagem sugerida por IA falha nos requisitos específicos de um cliente.
**Como verificar:** Cada diff gerado por IA tem revisão humana registada; as decisões de modelagem têm validação de quem conhece o negócio.
**Cursos:** 7

## Segurança e ambiente

### PROC-022 — Git antes de executar specs; worktrees em paralelo

**Regra:** Inicializa o repositório Git e faz um commit antes de o agente executar specs, e dá a cada agente em paralelo a sua branch ou worktree.
**Porquê:** O Git permite voltar a um estado anterior se o agente fizer asneira, e as worktrees deixam trabalhar em várias branches ao mesmo tempo sem conflitos.
**Como verificar:** O projecto tem histórico Git anterior à primeira spec; agentes em paralelo não partilham a mesma pasta de trabalho.
**Cursos:** 4

### PROC-023 — `deny` e hooks para o que nunca pode acontecer

**Regra:** Põe os comandos e ficheiros proibidos em `permissions.deny` do `settings.json` e bloqueia com um hook `PreToolUse` (matcher `Bash|PowerShell`, saída com código 2) o que tem de ser impedido sempre.
**Porquê:** O `deny` tem prioridade sobre o `allow`, e o hook com código 2 bloqueia a chamada de forma determinística; o CLAUDE.md e as skills só sugerem.
**Como verificar:** O `settings.json` tem `deny` para `git push`, apagamentos recursivos e `.env`; o hook de guarda usa `Bash|PowerShell` e sai com `exit 2` quando bloqueia.
**Fonte:** [referência](../docs/claude-code-formatos.md)
**Cursos:** 2

### PROC-024 — Chaves de API só em variáveis de ambiente

**Regra:** Lê as chaves de API de variáveis de ambiente (um `.env` fora do Git), nunca as escrevas no código, no CLAUDE.md nem noutro ficheiro versionado.
**Porquê:** Uma chave no código ou no CLAUDE.md fica exposta no repositório e em todas as sessões do agente.
**Como verificar:** O diff não tem chaves nem tokens literais; o `.env` está no `.gitignore` e o código lê as chaves do ambiente.
**Cursos:** 5

### PROC-046 — `allowed_tools` aprova, não restringe

**Regra:** Não uses `allowed_tools` (Agent SDK) nem a opção equivalente do Claude Code para limitar as ferramentas de um agente: só aprovam sem perguntar. Para tirar ferramentas, usa a lista `tools` do subagente, `--tools` numa execução com `-p`, `disallowed_tools` no Agent SDK (com o nome simples, a ferramenta sai do pedido) ou `permissions.deny` (a aula diz: `allowed_tools` define as ferramentas que o agente pode usar; desactualizado).
**Porquê:** Os cursos apresentam a opção como a lista do que o agente pode usar, mas na forma actual ela não retira nenhuma ferramenta; uma configuração que conta com ela para conter um agente deixa as outras ferramentas disponíveis.
**Como verificar:** Nenhuma configuração usa `allowed_tools` com a intenção de restringir; um agente que não pode usar uma ferramenta tem-na fora por `tools`, `--tools`, `disallowed_tools` ou `deny`; nenhum combina `allowed_tools` com `bypassPermissions` a contar que a lista limite alguma coisa.
**Fonte:** [referência](../docs/claude-api-formatos.md) · [referência](../docs/claude-code-formatos.md)
**Cursos:** 3

## MCP

### PROC-025 — Servidores MCP de terceiros são código a correr na máquina

**Regra:** Antes de ligar um servidor MCP de terceiros, confirma a origem, corre-o isolado sempre que possível e dá-lhe só as credenciais e o acesso de que precisa.
**Porquê:** Um servidor MCP executa código na máquina; sem isolamento tem acesso total ao sistema, e um servidor remoto sem autenticação fica aberto a toda a gente.
**Como verificar:** Cada servidor MCP configurado tem origem identificada, credenciais próprias e de âmbito mínimo, e os remotos exigem autenticação.
**Cursos:** 4

### PROC-026 — Testar o servidor MCP no Inspector

**Regra:** Antes de ligar um servidor MCP próprio a um host ou a um agente, lista e executa as suas tools no MCP Inspector.
**Porquê:** O Inspector mostra as tools, os resources e os logs do servidor e isola os erros do servidor dos erros do cliente.
**Como verificar:** O servidor tem um procedimento de teste no Inspector (ou um teste com `tools/list`) antes da integração.
**Cursos:** 3

### PROC-027 — Transporte MCP pelo cenário

**Regra:** Usa o transporte stdio para servidores MCP locais e streamable HTTP para servidores remotos partilhados por vários clientes (a aula diz: SSE para o remoto; desactualizado).
**Porquê:** O stdio serve um processo local; um servidor remoto é o que se publica para vários clientes da organização, e a especificação MCP descontinuou o HTTP+SSE.
**Como verificar:** Servidores locais usam stdio; os remotos usam streamable HTTP e nenhum servidor novo usa SSE.
**Fonte:** [referência](../docs/langchain-formatos.md)
**Cursos:** 3

### PROC-028 — Documentação actual ligada ao agente de programação

**Regra:** Liga o agente de programação a um MCP de documentação actual (o servidor de docs da LangChain ou o Context7) e manda-o consultá-lo antes de gerar código de LangChain, LangGraph ou de outras bibliotecas que mudam depressa.
**Porquê:** Os modelos foram treinados com versões antigas e sugerem APIs obsoletas ou inventadas.
**Como verificar:** O MCP de documentação está configurado, e as skills ou os agentes que geram código LangChain mandam consultá-lo.
**Cursos:** 2

## Código de agentes em Python

### PROC-029 — Tools com type hints e docstring

**Regra:** Escreve cada tool como uma função com type hints em todos os argumentos e no retorno e com uma docstring que diga o que faz, o que recebe e o que devolve, decorada com `@tool` (de `langchain.tools`).
**Porquê:** O nome, os tipos e a docstring são o que chega ao LLM para decidir quando e como chamar a tool.
**Como verificar:** Nenhuma tool no diff tem argumentos sem tipo ou docstring vazia ou genérica.
**Fonte:** [referência](../docs/langchain-formatos.md)
**Cursos:** 3

### PROC-030 — Saída estruturada para o que o código consome

**Regra:** Quando o código usa a resposta do LLM (uma decisão binária, uma rota, dados para outro passo), define um `BaseModel` com `Field(description=...)` em cada campo e pede saída estruturada: `response_format` no `create_agent`, ou `with_structured_output` fora de agentes.
**Porquê:** Texto livre ou "responde em JSON" dá parsing frágil; o esquema e as descrições dos campos obrigam o modelo a responder no formato esperado.
**Como verificar:** Não há parsing de texto livre nem pedidos de JSON só no prompt; cada resposta consumida pelo código tem um modelo Pydantic com descrições.
**Fonte:** [referência](../docs/langchain-formatos.md)
**Cursos:** 4

### PROC-031 — Nada de chains legadas em código novo

**Regra:** Em código novo, compõe cadeias com LCEL (`prompt | modelo | parser`) e agentes com `create_agent`; não uses `LLMChain`, `SequentialChain`, `ConversationChain`, `ConversationalRetrievalChain`, `initialize_agent` nem `create_react_agent`.
**Porquê:** Essas classes foram marcadas como obsoletas e passaram para o pacote legado `langchain-classic`; os modelos continuam a sugeri-las.
**Como verificar:** O diff não importa `langchain_classic` nem as classes listadas, salvo em código antigo assinalado.
**Fonte:** [referência](../docs/langchain-formatos.md)
**Cursos:** 3

### PROC-032 — Origem nos metadados de cada chunk

**Regra:** Na ingestão para RAG, guarda em `metadata["source"]` de cada documento e chunk a origem (caminho ou URL) e devolve essas fontes com a resposta.
**Porquê:** A origem é o que permite dizer ao utilizador em que se baseou a resposta.
**Como verificar:** Os loaders e os splitters preservam `source` nos metadados, e a resposta do RAG inclui as fontes usadas.
**Cursos:** 3

### PROC-040 — Factos exactos fora do histórico resumido

**Regra:** Numa conversa que é resumida ou compactada, guarda os factos que não se podem perder (valores, datas, identificadores, estados, o que o utilizador pediu e o que foi prometido) num bloco estruturado, uma entrada por assunto, que o código mantém fora do texto resumido, junta a cada pedido numa secção própria e nunca resume; e diz no prompt ao modelo que use esse bloco.
**Porquê:** Cada resumo encurta, e os valores exactos são o primeiro a sair — um montante passa a "cerca de" e uma data a "recentemente"; pedir um resumo mais cuidadoso não resolve. Sem a instrução para o consultar, o bloco existe mas não muda as respostas.
**Como verificar:** O código que compacta o histórico tem ao lado uma estrutura de factos actualizada a partir dos resultados das tools, enviada em todos os pedidos e excluída da sumarização; o prompt refere-a.
**Cursos:** 2

### PROC-041 — Modelo fixado pelo ID exacto

**Regra:** Configura o modelo da aplicação pelo ID exacto com que ela foi testada, nunca por um alias do tipo "latest"; a mudança de modelo é uma alteração deliberada, testada antes de entrar.
**Porquê:** Com um alias o modelo muda por baixo da aplicação e o comportamento muda sem aviso; fixado, a actualização passa a ser uma decisão.
**Como verificar:** A configuração tem o ID completo do modelo (os IDs sem data das gerações recentes são snapshots fixos; nas anteriores usa-se o ID com data), e uma troca de modelo no diff vem acompanhada de nova avaliação.
**Fonte:** [referência](../docs/claude-api-formatos.md)
**Cursos:** 1

## Aprender com os erros

Estas duas regras não saem de curso nenhum. Nenhum dos cursos extraídos trata de como um agente
acumula o que aprendeu entre projectos: a PROC-005 manda corrigir a skill e não só o resultado, mas
não diz onde fica o que se corrigiu nem como chega ao projecto seguinte. Saem da referência
[licoes-do-agente](../docs/licoes-do-agente.md) e da skill `keel-lesson`, que as executa.

### PROC-033 — Erro evitável regista-se com prova; lição só à reincidência

**Regra:** Quando cometeres um erro evitável que alguém teve de corrigir, regista a ocorrência com a prova que a demonstra (ficheiro e linha, comando ou mensagem de erro). Só à terceira ocorrência da mesma chave é que propões transformá-la numa lição — e a lição escreve-se com a aprovação do utilizador, nunca sozinho.
**Porquê:** Uma ocorrência isolada é um acidente e duas ainda podem ser distracção; a terceira é que torna o padrão inegável. Sem esse filtro o registo aceita tudo, enche-se de entradas que não valem nada e aprende-se a ignorá-lo — e um registo ignorado não protege nem nas entradas boas. Sem a prova, o que fica escrito é a teoria do próprio agente sobre por que falhou.
**Como verificar:** Cada entrada do registo tem o campo de prova preenchido, e cada lição escrita tem pelo menos três ocorrências da mesma chave por trás.
**Fonte:** [licoes-do-agente](../docs/licoes-do-agente.md)
**Cursos:** 0

### PROC-034 — O que uma máquina apanha vira verificação, não texto

**Regra:** Antes de escrever uma lição ou uma regra nova, pergunta se um linter, um teste, um hook ou um ficheiro de configuração apanham o caso. Se apanharem, escreve a verificação e não escrevas o texto.
**Porquê:** Texto em contexto compete por atenção com tudo o resto, a cada sessão; uma verificação corre sozinha e não falha por distracção. É a PROC-023 ao contrário: se o hook garante e o texto só sugere, o que se pode garantir não se pede. Escrever as duas coisas é pior do que escrever só a verificação, porque deixa uma regra que vai ser ignorada ao lado de um teste que não vai.
**Como verificar:** Nenhuma lição ou regra do registo descreve um caso que a ferramenta de lint, os testes ou os hooks do projecto já detectam.
**Fonte:** [licoes-do-agente](../docs/licoes-do-agente.md)
**Cursos:** 0

## Regras e controlos

Esta regra não sai de curso nenhum. Os cursos ensinam o `deny` e os hooks (PROC-023), mas nenhum mede quantas das regras de segurança escritas num projecto têm, de facto, um controlo por trás. Sai da referência [regras-vs-controlos](../docs/regras-vs-controlos.md), que resume um estudo de 481 ficheiros CLAUDE.md públicos.

### PROC-035 — Cada regra de segurança escrita diz que controlo a impõe

**Regra:** Ao escrever uma regra de segurança em texto (CLAUDE.md, `.claude/rules/`, uma skill), põe ao lado o controlo que a impõe: a entrada de `permissions.deny`, o hook ou o teste. Se não houver nenhum, escreve-o primeiro (PROC-034); se não for possível, diz na própria regra que depende de o modelo obedecer.
**Porquê:** Uma instrução em texto é interpretada pelo modelo; o `deny` e o hook `PreToolUse` bloqueiam antes de a acção correr. Num estudo de 481 CLAUDE.md públicos, só 4% a 16% das regras de segurança tinham um controlo nativo equivalente, e quem as escreveu não tinha forma de o saber — o ficheiro é um canal só de escrita. Uma regra que diz que não tem controlo, pelo menos, não engana quem a lê.
**Como verificar:** Para cada regra de segurança dos ficheiros de instruções do projecto existe uma entrada correspondente no `deny` do `.claude/settings.json`, um hook `PreToolUse` que a cobre, ou a menção explícita de que não há controlo. O `keel-audit` lista as que não têm nenhuma das três.
**Fonte:** [regras-vs-controlos](../docs/regras-vs-controlos.md)
**Cursos:** 0

## Contexto, skills e revisão

Estas regras não saem de curso nenhum. Os cursos ensinam o CLAUDE.md, as skills e os revisores; nenhum mede quanto texto em contexto ajuda, nem o que um revisor deixa passar. Saem da referência [contexto-e-qualidade](../docs/contexto-e-qualidade.md), que resume quatro estudos sobre isso.

### PROC-036 — A revisão dá um veredicto por dimensão, e cada achado volta fechado

**Regra:** O revisor recebe só o diff e a spec, sem o plano nem a conversa de quem implementou, e avalia uma dimensão de cada vez (spec, segurança e segredos, código limpo, linguagem e testes, e o que o projecto acrescentar). Cada dimensão começa em FALHA e só passa a PASSA com evidência — saída de teste, lint ou verificador de tipos, ou a linha do diff citada; sem ela, fica SEM EVIDÊNCIA. Cada achado é gravado como estado e fica aberto até uma nova ronda do revisor o dar como corrigido, ou até quem implementou o fechar como não corrigido, com o motivo. Nos portões críticos — segurança, isolamento entre tenants, migrações —, um refutador tenta derrubar cada PASSA escrevendo o teste que falharia.
**Porquê:** Um modelo que julga favorece o que se parece com o que ele próprio escreveria, e ser mais capaz não o livra disso; repartir a avaliação por dimensões reduziu esse viés em 31,5% em média. Quem escreve e quem revê são quase sempre da mesma família, por isso o viés não se tira trocando de modelo: diminui-se dependendo menos do juízo e mais de ferramentas determinísticas, que não preferem ninguém. E a falha mais repetida de agentes em tarefas longas é encontrar o problema na revisão e entregar sem o corrigir — o que um texto a pedir para fechar os achados não impede (PROC-035).
**Como verificar:** A revisão tem uma linha por dimensão com PASSA, FALHA ou SEM EVIDÊNCIA e a evidência ao lado, e nenhum parecer geral. O `.keel/revisao.json` não tem achados abertos no commit: o guarda recusa o `git commit` e o hook `Stop` não deixa a tarefa acabar enquanto houver um (`node .keel/revisao.mjs estado`).
**Fonte:** [contexto-e-qualidade](../docs/contexto-e-qualidade.md)
**Cursos:** 0

### PROC-037 — O contexto fixo mede-se, e o CLAUDE.md diz só o que foge do padrão

**Regra:** O que entra em todas as sessões — CLAUDE.md, os núcleos importados e as regras sem `paths:` — soma menos de 200 linhas. O CLAUDE.md de um projecto leva os imports, os comandos que não se adivinham pelo código e as práticas que contrariam o padrão da linguagem ou da plataforma; não leva visão geral, árvore de pastas nem descrição da arquitectura.
**Porquê:** O cumprimento de instruções cai à medida que se acumulam, e as primeiras ganham às últimas. Arquivos de contexto com visões gerais do repositório não melhoraram a taxa de sucesso de agentes de código e subiram o custo em mais de 20%; o que ajudou foi declarar o que não é padrão. O agente descobre a estrutura lendo o código; o que não descobre sozinho é o que contraria o costume.
**Como verificar:** `node ${CLAUDE_PLUGIN_ROOT}/skills/keel-init/contexto.mjs` na raiz do projecto dá o total e avisa acima do limite. No CLAUDE.md, cada parágrafo responde a "o agente acertaria isto sem ler aqui?" com não.
**Fonte:** [contexto-e-qualidade](../docs/contexto-e-qualidade.md) · [referência](../docs/claude-code-formatos.md)
**Cursos:** 0

### PROC-038 — Uma skill diz o que fazer; o pormenor de um passo vai para um ficheiro ao lado

**Regra:** O `SKILL.md` tem o fluxo — quando se usa, os passos, as decisões e o que se entrega — e cabe numa leitura. O que só serve num passo (tabelas de dimensões, mecânicas de uma ferramenta, formatos de saída longos) vai para um ficheiro de apoio na pasta da skill, e o passo diz quando o ler.
**Porquê:** Skills curadas e focadas, com no máximo três módulos, deram mais do que pacotes exaustivos. Um `SKILL.md` que carrega o pormenor de todos os passos paga-o inteiro em cada uso, mesmo quando só um passo corre.
**Como verificar:** Cada `SKILL.md` do projecto tem menos de 200 linhas — o teto que a documentação do Claude Code dá ao CLAUDE.md, que também entra inteiro —, ou justifica o excesso; os ficheiros de apoio são referidos pelo nome no passo que os usa.
**Fonte:** [contexto-e-qualidade](../docs/contexto-e-qualidade.md) · [referência](../docs/claude-code-formatos.md)
**Cursos:** 0

## Claude Code em pipelines

### PROC-047 — Claude Code em CI corre com `-p` e devolve JSON com esquema

**Regra:** Num passo de pipeline, invoca o Claude Code sempre em modo não interactivo (`-p`), com `--bare` e `--output-format json` e, quando um script consome o resultado, com `--json-schema` a descrever a forma esperada; testa o código de saída a cada invocação e, antes de ler `structured_output`, confirma que o campo existe.
**Porquê:** Sem `-p` a sessão interactiva fica à espera de alguém e o job só pára no timeout global, a gastar minutos; texto livre muda de forma entre execuções e extraí-lo é frágil. O esquema garante a forma, não a correcção, e quando o Claude recusa o `structured_output` simplesmente não vem. Sem `--bare`, o `-p` corre os hooks e liga os MCP que estiverem no repositório, mesmo num fork que ninguém confiou.
**Como verificar:** Cada chamada a `claude` nos workflows de CI tem `-p`, `--bare` e `--output-format json` (e `--json-schema` quando o resultado é lido por código), e o script testa o código de saída e a presença de `structured_output` antes de interpretar a resposta.
**Fonte:** [Formatos do Claude Code — Modo não interactivo](../docs/claude-code-formatos.md#modo-não-interactivo-claude--p)
**Cursos:** 2
