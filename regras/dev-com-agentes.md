# Regras — Desenvolvimento com agentes de IA

Prefixo `PROC`. Regras confirmadas nas transcrições a 2026-09-17. Síntese de origem: [dev-com-agentes](../conhecimento/dev-com-agentes.md). Decisões pendentes: [revisão](_revisao/dev-com-agentes.md).

## Contexto e sessões

### PROC-001 — Uma sessão nova por funcionalidade ou spec

**Regra:** Começa cada funcionalidade, spec ou mudança de tarefa numa sessão nova, com contexto limpo, em vez de continuar a conversa anterior.
**Porquê:** Numa conversa longa, o contexto que já não interessa à tarefa é comprimido e arrastado, gasta tokens e piora o resultado, que se afasta do pedido.
**Como verificar:** No plano de execução ou no registo da spec, cada spec é executada numa sessão ou num subagente próprio; nenhuma instrução manda continuar várias specs na mesma conversa.
**Fonte:** [Eng. Agêntica §1, aula 3](../cursos/ai-driven-development/engenharia-agentica/transcricoes/03-modo-agente.md) · [nota](../cursos/ai-driven-development/engenharia-agentica/notas/01-introducao.md) · [Formação CC §12, aula 101](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/transcricoes/101-comandos-e-atalhos.md) · [nota](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/notas/12-topicos-contextuais-do-claude-code.md)
**Cursos:** 4

### PROC-002 — Restrições explícitas no pedido

**Regra:** Escreve na spec, ou nas instruções de execução, o que o agente não pode fazer: instalar software, alterar interfaces já definidas, mudar regras de negócio já prontas ou mexer em pastas fora do âmbito.
**Porquê:** Sem essas restrições o agente procura alternativas por conta própria (instala bibliotecas, adapta o negócio à interface) e toma decisões que ninguém pediu.
**Como verificar:** A spec tem uma secção de restrições ou de "não fazer"; o diff não traz dependências novas, nem alterações a interfaces ou regras de negócio que a spec não pedia.
**Fonte:** [Instagram §2, aula 5](../cursos/ai-driven-development/projeto-instagram-ia/transcricoes/05-o-que-e-mcp.md) · [nota](../cursos/ai-driven-development/projeto-instagram-ia/notas/02-projeto.md) · [Eng. Agêntica §2, aula 13](../cursos/ai-driven-development/engenharia-agentica/transcricoes/13-spec-002-registrar-usuario-01.md) · [nota](../cursos/ai-driven-development/engenharia-agentica/notas/02-spec-driven-development.md)
**Cursos:** 3

### PROC-003 — CLAUDE.md curto, concreto e sem segredos

**Regra:** Mantém o CLAUDE.md específico (comandos, convenções, regras críticas), actualizado, com menos de 200 linhas e sem senhas, tokens ou chaves.
**Porquê:** É o que sobrevive entre sessões; um ficheiro vago, gigante ou desactualizado confunde o agente, e um segredo nele fica exposto a todas as sessões e ao repositório.
**Como verificar:** O CLAUDE.md tem menos de 200 linhas, não contém valores de credenciais e os comandos que lista existem no projecto.
**Fonte:** [Formação CC §12, aula 103](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/transcricoes/103-contexto-memoria-e-claude-md.md) · [nota](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/notas/12-topicos-contextuais-do-claude-code.md) · [referência](../docs/claude-code-formatos.md)
**Cursos:** 2

## Skills e subagentes

### PROC-004 — Skills por engenharia reversa de código validado

**Regra:** Cria cada skill de codificação só depois de o padrão estar implementado e validado no projecto, gerando-a a partir desse código e com exemplos reais dele.
**Porquê:** Uma skill escrita do zero traz exemplos que podem nem compilar e não reflecte a forma como o projecto aplica o padrão.
**Como verificar:** Cada skill nova referencia ficheiros existentes e validados do projecto como exemplo; não há skills para padrões que ainda não existem no código.
**Fonte:** [Eng. Contexto §1, aula 5](../cursos/ai-driven-development/agents-skills-eng-ctx/transcricoes/05-conceito-de-skills.md) · [nota](../cursos/ai-driven-development/agents-skills-eng-ctx/notas/01-introducao.md) · [Arq. com IA §4, aula 38](../cursos/ai-driven-development/arquitetura-com-ia/transcricoes/38-modulo-shared-v05.md) · [nota](../cursos/ai-driven-development/arquitetura-com-ia/notas/04-modulo-shared.md)
**Cursos:** 3

### PROC-005 — Corrigir a skill, não só o resultado

**Regra:** Quando uma skill produz um erro ou um resultado fora da convenção, corrige também a instrução dentro da skill, além do artefacto gerado.
**Porquê:** Se só o código for corrigido, a skill volta a gerar o mesmo erro nos módulos seguintes.
**Como verificar:** Um diff que corrige código gerado por uma skill traz a alteração correspondente no `SKILL.md`, ou justifica porque não a traz.
**Fonte:** [Arq. com IA §5, aula 47](../cursos/ai-driven-development/arquitetura-com-ia/transcricoes/47-modulo-auth-02.md) · [nota](../cursos/ai-driven-development/arquitetura-com-ia/notas/05-configuracao-projeto.md) · [Eng. Contexto §5, aula 40](../cursos/ai-driven-development/agents-skills-eng-ctx/transcricoes/40-schema-auth-prisma.md) · [nota](../cursos/ai-driven-development/agents-skills-eng-ctx/notas/05-modulo-de-autenticacao.md)
**Cursos:** 2

### PROC-006 — A `description` diz quando usar

**Regra:** Escreve na `description` de cada skill e de cada subagente, de forma concreta, em que situações deve ser usado.
**Porquê:** É a `description` que o agente lê para decidir, sem pedido explícito, que skill ou subagente usar.
**Como verificar:** Cada `SKILL.md` e cada `.claude/agents/<nome>.md` tem uma `description` com gatilhos concretos (tarefas, termos, ficheiros), e não apenas o nome repetido.
**Fonte:** [Ferr. Agênticas §4, aula 13](../cursos/ai-driven-development/ferramentas-agenticas/transcricoes/13-skill-basica.md) · [nota](../cursos/ai-driven-development/ferramentas-agenticas/notas/04-conceitos-essenciais.md) · [Formação CC §15, aula 137](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/transcricoes/137-por-que-usar-skill.md) · [referência](../docs/claude-code-formatos.md)
**Cursos:** 4

### PROC-007 — Invocação explícita nos passos críticos

**Regra:** Nos passos de uma spec que dependem de uma skill ou de um subagente, invoca-os pelo nome (`/nome` para a skill, `@agent-<nome>` para o subagente) em vez de confiar no disparo pela `description`.
**Porquê:** O disparo indirecto deixa margem para o agente não chamar a skill.
**Como verificar:** As tarefas da spec que precisam de uma skill ou de um subagente indicam-no pelo nome.
**Fonte:** [Ferr. Agênticas §4, aula 15](../cursos/ai-driven-development/ferramentas-agenticas/transcricoes/15-skills-no-codex.md) · [nota](../cursos/ai-driven-development/ferramentas-agenticas/notas/04-conceitos-essenciais.md) · [referência](../docs/claude-code-formatos.md)
**Cursos:** 2

### PROC-008 — Skills com passos numerados e condições de paragem

**Regra:** Escreve o corpo de cada skill como uma lista numerada de passos, com condições de paragem explícitas ("se X acontecer, pára e pergunta").
**Porquê:** Fluxos em passos são seguidos com mais fiabilidade do que parágrafos, e as condições de paragem evitam decisões perigosas.
**Como verificar:** O `SKILL.md` tem passos numerados e pelo menos uma condição de paragem para os casos de risco.
**Fonte:** [Formação CC §15, aula 137](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/transcricoes/137-por-que-usar-skill.md) · [nota](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/notas/15-agent-skills-compreenda-como-usar-e-criar-skills.md) · [nota](../cursos/langchain/notas/22-deep-agents-skills.md)
**Cursos:** 2

### PROC-009 — Subagentes só com as ferramentas do seu papel

**Regra:** Declara no campo `tools` de cada subagente só as ferramentas de que o seu papel precisa; um subagente que só lê e analisa não recebe ferramentas de escrita.
**Porquê:** O campo `tools` é uma lista branca: o que não está listado fica bloqueado, o que limita os danos de um subagente que se engane.
**Como verificar:** Cada `.claude/agents/<nome>.md` tem `tools` explícito; revisores e auditores não têm `Write` nem `Edit`.
**Fonte:** [Formação CC §7, aula 58](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/transcricoes/058-compreendendo-sobre-os-subagents.md) · [nota](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/notas/07-claude-code-avancado.md) · [referência](../docs/claude-code-formatos.md)
**Cursos:** 1

### PROC-010 — Times de agentes pequenos e sem sobreposição

**Regra:** Num time de agentes em paralelo, dá a cada agente um âmbito que não se sobreponha aos outros, não deixes dois agentes escrever no mesmo ficheiro, define por escrito o formato da síntese e não passes de 5 agentes.
**Porquê:** Âmbitos sobrepostos e ficheiros partilhados geram conflitos, uma síntese sem formato não se consegue juntar, e times grandes disparam o custo em tokens.
**Como verificar:** A orquestração lista os agentes (no máximo 5), o âmbito e os ficheiros de cada um, e o formato esperado do resultado.
**Fonte:** [Formação CC §7, aula 62](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/transcricoes/062-compreendendo-sobre-agent-teams.md) · [nota](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/notas/07-claude-code-avancado.md) · [nota](../cursos/ai-driven-development/fundamentos-cursor/notas/01-conteudo.md)
**Cursos:** 2

## Especificações e execução

### PROC-011 — PRD ou spec antes de trabalho longo

**Regra:** Antes de implementar trabalho que ocupe mais de uma sessão, gera em modo de planeamento um PRD ou uma spec, revê-o e só depois pede código.
**Porquê:** Sem esse documento o agente trabalha às cegas e preenche as lacunas com decisões próprias; corrigir um erro sai mais caro a cada fase que passa.
**Como verificar:** Existe um PRD ou uma spec revista antes do primeiro commit da funcionalidade.
**Fonte:** [Agentes IA §4, aula 24](../cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/transcricoes/024-claude-code-no-modo-de-planejamento.md) · [nota](../cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/notas/04-claude-code-desenvolvimento-orientado-a-agentes-de-ia.md) · [Formação CC §8, aula 64](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/transcricoes/064-por-que-existe-o-sdd.md) · [nota](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/notas/08-spec-driven-development-sdd-com-claude-code.md)
**Cursos:** 3

### PROC-012 — Spec com critérios de aceite mensuráveis

**Regra:** Inclui em cada spec o objectivo, os requisitos funcionais e não funcionais, o âmbito e o que fica fora dele, as restrições técnicas e critérios de aceite verificáveis, com números no lugar de adjectivos (por exemplo, "responde em menos de 300 ms com 10 mil registos").
**Porquê:** Uma spec sem estes elementos parece uma especificação mas não permite verificar nada, e o incremento tende a crescer sozinho.
**Como verificar:** A spec tem todas estas secções, e cada critério de aceite pode ser confirmado por um teste ou por uma medição.
**Fonte:** [Formação CC §8, aula 65](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/transcricoes/065-anatomia-de-uma-especificacao.md) · [nota](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/notas/08-spec-driven-development-sdd-com-claude-code.md)
**Cursos:** 1

### PROC-013 — Tarefas marcadas com evidência

**Regra:** Faz o agente marcar cada tarefa da spec como concluída e registar por baixo uma evidência (data, hora, o que foi feito e os desvios); a spec só está concluída quando todas as tarefas têm evidência.
**Porquê:** A evidência dá rastreabilidade: sem ela não há como confirmar que o agente fez exactamente o que foi pedido.
**Como verificar:** Na spec concluída, todas as caixas estão marcadas e cada tarefa tem uma evidência com data e hora.
**Fonte:** [Eng. Agêntica §2, aula 5](../cursos/ai-driven-development/engenharia-agentica/transcricoes/05-introducao-a-sdd.md) · [nota](../cursos/ai-driven-development/engenharia-agentica/notas/02-spec-driven-development.md) · [Ferr. Agênticas §4, aula 16](../cursos/ai-driven-development/ferramentas-agenticas/transcricoes/16-especificacao-simples.md) · [nota](../cursos/ai-driven-development/ferramentas-agenticas/notas/04-conceitos-essenciais.md)
**Cursos:** 3

### PROC-014 — Regra de negócio nova volta à spec

**Regra:** Se durante a implementação surgir uma regra de negócio que a spec não previa, pára, regista a decisão na spec e só depois continua.
**Porquê:** A spec é a fonte da verdade; uma decisão tomada só no código fica escondida e perde-se.
**Como verificar:** Os comportamentos de negócio presentes no diff estão todos descritos na spec, incluindo os acrescentados durante a implementação.
**Fonte:** [Formação CC §8, aula 66](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/transcricoes/066-o-ciclo-e-as-fases-do-sdd.md) · [nota](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/notas/08-spec-driven-development-sdd-com-claude-code.md)
**Cursos:** 1

### PROC-015 — Cada parte num subagente com contexto limpo

**Regra:** Executa cada passo ou camada da spec (negócio, back-end, front-end) num subagente separado, com contexto limpo, e em sequência quando uma parte depende da anterior.
**Porquê:** Cada subagente começa sem o contexto das tarefas anteriores, o que poupa tokens e evita arrastar informação irrelevante.
**Como verificar:** A spec ou o prompt de execução indica um subagente por parte e a ordem em que correm.
**Fonte:** [Finanças §3, aula 14](../cursos/ai-driven-development/projeto-financeiro-ai/transcricoes/14-configuracao-do-projeto-prompt.md) · [nota](../cursos/ai-driven-development/projeto-financeiro-ai/notas/03-iniciando-o-projeto.md) · [Finanças §4, aula 21](../cursos/ai-driven-development/projeto-financeiro-ai/transcricoes/21-registrar-usuario-prompt.md) · [nota](../cursos/ai-driven-development/projeto-financeiro-ai/notas/04-modulo-de-autenticacao.md)
**Cursos:** 4

### PROC-016 — Verificações concretas dentro da spec

**Regra:** Inclui na própria spec os passos de verificação: correr os testes, exigir uma cobertura mínima, testes de integração e o resultado esperado de cada parte.
**Porquê:** As verificações embutidas no harness não bastam; os passos de verificação escritos na spec obrigam o agente a confirmar o que fez e a corrigir o que falta.
**Como verificar:** A spec tem tarefas de verificação com comandos e limiares concretos, e as evidências mostram que correram.
**Fonte:** [Ferr. Agênticas §4, aula 17](../cursos/ai-driven-development/ferramentas-agenticas/transcricoes/17-harness-01.md) · [nota](../cursos/ai-driven-development/ferramentas-agenticas/notas/04-conceitos-essenciais.md) · [Banco de Ideias §2, aula 4](../cursos/ai-driven-development/projeto-banco-ideias/transcricoes/04-criacao-do-projeto.md) · [nota](../cursos/ai-driven-development/projeto-banco-ideias/notas/02-projeto.md)
**Cursos:** 4

### PROC-017 — Testar cada fase antes da seguinte

**Regra:** Testa cada fase ou funcionalidade que o agente dá como concluída e só depois passa à fase seguinte; o que faltar entra na fase seguinte do plano.
**Porquê:** O agente pode dar como feito algo que falha ou está incompleto, e os erros acumulados entre fases são mais difíceis de isolar.
**Como verificar:** O plano de fases regista, para cada fase, o teste feito e o resultado antes do início da seguinte.
**Fonte:** [Formação CC §14, aula 129](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/transcricoes/129-editor-de-fotos-tags-segunda-versao.md) · [nota](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/notas/14-desenvolvimento-com-claude-code-projeto-do-zero.md) · [nota](../cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/notas/04-claude-code-desenvolvimento-orientado-a-agentes-de-ia.md)
**Cursos:** 3

### PROC-018 — Arquivar só depois de verificar, com commit

**Regra:** Arquiva cada spec só depois de confirmar que todas as tarefas têm evidência e que as verificações passaram, faz commit desse incremento e só então começa a spec seguinte.
**Porquê:** Deixar mudanças implementadas por arquivar ou por fazer commit mistura incrementos e perde o ponto seguro para onde voltar.
**Como verificar:** Não há specs implementadas fora do arquivo; cada spec arquivada corresponde a um commit.
**Fonte:** [Banco de Ideias §2, aula 23](../cursos/ai-driven-development/projeto-banco-ideias/transcricoes/23-dashboard-02.md) · [nota](../cursos/ai-driven-development/projeto-banco-ideias/notas/02-projeto.md) · [Formação CC §8, aula 66](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/transcricoes/066-o-ciclo-e-as-fases-do-sdd.md) · [nota](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/notas/08-spec-driven-development-sdd-com-claude-code.md)
**Cursos:** 6

## Arquitectura e revisão humana

### PROC-019 — Arquitectura definida antes do código

**Regra:** Define os módulos, as camadas e os padrões do projecto antes de pedir implementação ao agente; as decisões estruturais ficam com a pessoa.
**Porquê:** Sem padrões indicados, o agente reproduz código mediano: num caso relatado gerou ficheiros de 2000 a 3000 linhas e duplicou funções.
**Como verificar:** Existe documentação de arquitectura (módulos, camadas, padrões) anterior às specs, e o código novo fica nos lugares que ela define.
**Fonte:** [Intro Dev IA §4, aula 10](../cursos/ai-driven-development/dev-ai-introducao/transcricoes/10-palavras-finais.md) · [nota](../cursos/ai-driven-development/dev-ai-introducao/notas/04-conclusao.md) · [nota](../cursos/ai-driven-development/agents-skills-eng-ctx/notas/01-introducao.md)
**Cursos:** 5

### PROC-020 — Interface própria para o fornecedor de IA

**Regra:** Faz os casos de uso dependerem de uma interface do próprio projecto para cada serviço externo, incluindo o fornecedor de IA; a implementação concreta (SDK, biblioteca) fica fora da camada de negócio.
**Porquê:** Assim o negócio não fica preso ao SDK e a implementação troca-se sem mexer nos casos de uso.
**Como verificar:** Os módulos de negócio não importam SDKs de modelos nem bibliotecas de infraestrutura; recebem uma interface, e a classe concreta vive numa camada exterior.
**Fonte:** [Banco de Ideias §2, aula 20](../cursos/ai-driven-development/projeto-banco-ideias/transcricoes/20-processamento-da-ideia-01.md) · [nota](../cursos/ai-driven-development/projeto-banco-ideias/notas/02-projeto.md) · [Eng. Contexto §5, aula 37](../cursos/ai-driven-development/agents-skills-eng-ctx/transcricoes/37-providers.md) · [nota](../cursos/ai-driven-development/agents-skills-eng-ctx/notas/05-modulo-de-autenticacao.md)
**Cursos:** 3

### PROC-021 — Revisão humana do que a IA gera

**Regra:** Revê o código, as dependências, a modelagem e a documentação que a IA gera antes de os aceitar, e não aceites o que não compreendes; a modelagem de um domínio real valida-se com quem conhece o negócio.
**Porquê:** Quem não olha para o código fica refém da IA e inseguro sobre o próprio projecto, e a modelagem sugerida por IA falha nos requisitos específicos de um cliente.
**Como verificar:** Cada diff gerado por IA tem revisão humana registada; as decisões de modelagem têm validação de quem conhece o negócio.
**Fonte:** [Intro Dev IA §4, aula 10](../cursos/ai-driven-development/dev-ai-introducao/transcricoes/10-palavras-finais.md) · [nota](../cursos/ai-driven-development/dev-ai-introducao/notas/04-conclusao.md) · [Finanças §2, aula 9](../cursos/ai-driven-development/projeto-financeiro-ai/transcricoes/09-proposta-de-modelagem-02.md) · [nota](../cursos/ai-driven-development/projeto-financeiro-ai/notas/02-modelagem-requisitos.md)
**Cursos:** 7

## Segurança e ambiente

### PROC-022 — Git antes de executar specs; worktrees em paralelo

**Regra:** Inicializa o repositório Git e faz um commit antes de o agente executar specs, e dá a cada agente em paralelo a sua branch ou worktree.
**Porquê:** O Git permite voltar a um estado anterior se o agente fizer asneira, e as worktrees deixam trabalhar em várias branches ao mesmo tempo sem conflitos.
**Como verificar:** O projecto tem histórico Git anterior à primeira spec; agentes em paralelo não partilham a mesma pasta de trabalho.
**Fonte:** [Banco de Ideias §2, aula 19](../cursos/ai-driven-development/projeto-banco-ideias/transcricoes/19-repositorio-git.md) · [nota](../cursos/ai-driven-development/projeto-banco-ideias/notas/02-projeto.md) · [Ferr. Agênticas §3, aula 10](../cursos/ai-driven-development/ferramentas-agenticas/transcricoes/10-visao-geral-do-claude-code.md) · [nota](../cursos/ai-driven-development/ferramentas-agenticas/notas/03-visao-geral-das-ferramentas.md)
**Cursos:** 4

### PROC-023 — `deny` e hooks para o que nunca pode acontecer

**Regra:** Põe os comandos e ficheiros proibidos em `permissions.deny` do `settings.json` e bloqueia com um hook `PreToolUse` (matcher `Bash|PowerShell`, saída com código 2) o que tem de ser impedido sempre.
**Porquê:** O `deny` tem prioridade sobre o `allow`, e o hook com código 2 bloqueia a chamada de forma determinística; o CLAUDE.md e as skills só sugerem.
**Como verificar:** O `settings.json` tem `deny` para `git push`, apagamentos recursivos e `.env`; o hook de guarda usa `Bash|PowerShell` e sai com `exit 2` quando bloqueia.
**Fonte:** [Formação CC §12, aula 104](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/transcricoes/104-configuracao-do-projeto-com-init.md) · [Formação CC §7, aula 56](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/transcricoes/056-compreendendo-os-hooks.md) · [nota](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/notas/07-claude-code-avancado.md) · [referência](../docs/claude-code-formatos.md)
**Cursos:** 2

### PROC-024 — Chaves de API só em variáveis de ambiente

**Regra:** Lê as chaves de API de variáveis de ambiente (um `.env` fora do Git), nunca as escrevas no código, no CLAUDE.md nem noutro ficheiro versionado.
**Porquê:** Uma chave no código ou no CLAUDE.md fica exposta no repositório e em todas as sessões do agente.
**Como verificar:** O diff não tem chaves nem tokens literais; o `.env` está no `.gitignore` e o código lê as chaves do ambiente.
**Fonte:** [Formação CC §8, aula 65](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/transcricoes/065-anatomia-de-uma-especificacao.md) · [nota](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/notas/08-spec-driven-development-sdd-com-claude-code.md) · [IA na Prática §6, aula 51](../cursos/formacao-engenheiro-de-ia-generativa-ia-na-pratica/transcricoes/051-o-que-e-kimi.md) · [nota](../cursos/formacao-engenheiro-de-ia-generativa-ia-na-pratica/notas/06-kimi-api-comparativo-com-outros-modelos-llm.md)
**Cursos:** 5

## MCP

### PROC-025 — Servidores MCP de terceiros são código a correr na máquina

**Regra:** Antes de ligar um servidor MCP de terceiros, confirma a origem, corre-o isolado sempre que possível e dá-lhe só as credenciais e o acesso de que precisa.
**Porquê:** Um servidor MCP executa código na máquina; sem isolamento tem acesso total ao sistema, e um servidor remoto sem autenticação fica aberto a toda a gente.
**Como verificar:** Cada servidor MCP configurado tem origem identificada, credenciais próprias e de âmbito mínimo, e os remotos exigem autenticação.
**Fonte:** [Docker §20, aula 189](../cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/transcricoes/189-2302-entendendo-o-que-e-mcp-model-context-protocol.md) · [Docker §20, aula 190](../cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/transcricoes/190-2303-o-que-e-o-docker-mcp-catalog-e-como-ele-se-encaixa-no-ecossistema.md) · [nota](../cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/notas/20-docker-mcp-catalog-e-mcp-toolkit-integrando-inteligencia-art.md) · [LangChain §19, aula 137](../cursos/langchain/transcricoes/137-what-are-we-mcbuilding.md)
**Cursos:** 4

### PROC-026 — Testar o servidor MCP no Inspector

**Regra:** Antes de ligar um servidor MCP próprio a um host ou a um agente, lista e executa as suas tools no MCP Inspector.
**Porquê:** O Inspector mostra as tools, os resources e os logs do servidor e isola os erros do servidor dos erros do cliente.
**Como verificar:** O servidor tem um procedimento de teste no Inspector (ou um teste com `tools/list`) antes da integração.
**Fonte:** [IA na Prática §33, aula 348](../cursos/formacao-engenheiro-de-ia-generativa-ia-na-pratica/transcricoes/348-criando-o-primeiro-servidor-mcp.md) · [nota](../cursos/formacao-engenheiro-de-ia-generativa-ia-na-pratica/notas/33-mcp-servidores-clientes-projetos.md) · [LangChain §18, aula 131](../cursos/langchain/transcricoes/131-mcp-inspector.md) · [nota](../cursos/langchain/notas/18-using-a-pre-built-server-mcpdoc-with-ai-clients-cursor-claud.md)
**Cursos:** 3

### PROC-027 — Transporte MCP pelo cenário

**Regra:** Usa o transporte stdio para servidores MCP locais e streamable HTTP para servidores remotos partilhados por vários clientes (a aula diz: SSE para o remoto; desactualizado).
**Porquê:** O stdio serve um processo local; um servidor remoto é o que se publica para vários clientes da organização, e a especificação MCP descontinuou o HTTP+SSE.
**Como verificar:** Servidores locais usam stdio; os remotos usam streamable HTTP e nenhum servidor novo usa SSE.
**Fonte:** [IA na Prática §33, aula 353](../cursos/formacao-engenheiro-de-ia-generativa-ia-na-pratica/transcricoes/353-criando-servidor-stdio-e-conectando-cliente.md) · [LangChain §19, aula 137](../cursos/langchain/transcricoes/137-what-are-we-mcbuilding.md) · [nota](../cursos/langchain/notas/19-building-mcp-servers-and-clients-with-langchain.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 3

### PROC-028 — Documentação actual ligada ao agente de programação

**Regra:** Liga o agente de programação a um MCP de documentação actual (o servidor de docs da LangChain ou o Context7) e manda-o consultá-lo antes de gerar código de LangChain, LangGraph ou de outras bibliotecas que mudam depressa.
**Porquê:** Os modelos foram treinados com versões antigas e sugerem APIs obsoletas ou inventadas.
**Como verificar:** O MCP de documentação está configurado, e as skills ou os agentes que geram código LangChain mandam consultá-lo.
**Fonte:** [LangChain §20, aula 143](../cursos/langchain/transcricoes/143-new-important-stop-writing-deprecated-code-langchain-s-official-mcp-server.md) · [nota](../cursos/langchain/notas/20-useful-tools-when-developing-llm-applications.md) · [Formação CC §6, aula 51](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/transcricoes/051-utilizando-o-context7-mcp-para-atualizacao-de-documentacao.md) · [nota](../cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/notas/06-claude-code-hands-on.md)
**Cursos:** 2

## Código de agentes em Python

### PROC-029 — Tools com type hints e docstring

**Regra:** Escreve cada tool como uma função com type hints em todos os argumentos e no retorno e com uma docstring que diga o que faz, o que recebe e o que devolve, decorada com `@tool` (de `langchain.tools`).
**Porquê:** O nome, os tipos e a docstring são o que chega ao LLM para decidir quando e como chamar a tool.
**Como verificar:** Nenhuma tool no diff tem argumentos sem tipo ou docstring vazia ou genérica.
**Fonte:** [LangChain §3, aula 19](../cursos/langchain/transcricoes/019-creating-your-first-langchain-agent-tools-and-llms.md) · [nota](../cursos/langchain/notas/03-the-gist-of-ai-agents.md) · [RAG Bootcamp §15, aula 85](../cursos/ultimate-rag-bootcamp-using-langchainlanggraph-langsmith/transcricoes/085-react-agent-architecture-implementation.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 3

### PROC-030 — Saída estruturada para o que o código consome

**Regra:** Quando o código usa a resposta do LLM (uma decisão binária, uma rota, dados para outro passo), define um `BaseModel` com `Field(description=...)` em cada campo e pede saída estruturada: `response_format` no `create_agent`, ou `with_structured_output` fora de agentes.
**Porquê:** Texto livre ou "responde em JSON" dá parsing frágil; o esquema e as descrições dos campos obrigam o modelo a responder no formato esperado.
**Como verificar:** Não há parsing de texto livre nem pedidos de JSON só no prompt; cada resposta consumida pelo código tem um modelo Pydantic com descrições.
**Fonte:** [LangChain §16, aula 118](../cursos/langchain/transcricoes/118-building-a-relevance-filter-for-rag-using-langchain-s-structured-output.md) · [nota](../cursos/langchain/notas/16-agentic-rag.md) · [LangChain §3, aula 23](../cursos/langchain/transcricoes/023-theory-predictable-agent-responses-with-langchain-structured-output.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 4

### PROC-031 — Nada de chains legadas em código novo

**Regra:** Em código novo, compõe cadeias com LCEL (`prompt | modelo | parser`) e agentes com `create_agent`; não uses `LLMChain`, `SequentialChain`, `ConversationChain`, `ConversationalRetrievalChain`, `initialize_agent` nem `create_react_agent`.
**Porquê:** Essas classes foram marcadas como obsoletas e passaram para o pacote legado `langchain-classic`; os modelos continuam a sugeri-las.
**Como verificar:** O diff não importa `langchain_classic` nem as classes listadas, salvo em código antigo assinalado.
**Fonte:** [Agentes IA §18, aula 135](../cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/transcricoes/135-utilizando-chains.md) · [nota](../cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/notas/18-langchain-atualizacao-com-gpt-5.md) · [LangChain §20, aula 143](../cursos/langchain/transcricoes/143-new-important-stop-writing-deprecated-code-langchain-s-official-mcp-server.md) · [referência](../docs/langchain-formatos.md)
**Cursos:** 3

### PROC-032 — Origem nos metadados de cada chunk

**Regra:** Na ingestão para RAG, guarda em `metadata["source"]` de cada documento e chunk a origem (caminho ou URL) e devolve essas fontes com a resposta.
**Porquê:** A origem é o que permite dizer ao utilizador em que se baseou a resposta.
**Como verificar:** Os loaders e os splitters preservam `source` nos metadados, e a resposta do RAG inclui as fontes usadas.
**Fonte:** [LangChain §10, aula 56](../cursos/langchain/transcricoes/056-tavily-crawling.md) · [nota](../cursos/langchain/notas/10-building-a-documentation-assistant-embeddings-vectordbs-retr.md) · [LangChain §9, aula 46](../cursos/langchain/transcricoes/046-medium-analyzer-ingestion-implementation.md) · [nota](../cursos/langchain/notas/09-the-gist-of-rag-embeddings-vector-databases-and-retrieval.md)
**Cursos:** 3
