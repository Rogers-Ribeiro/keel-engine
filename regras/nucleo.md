# Núcleo — o que vale em qualquer tarefa

O resto está em `regras/<tema>.md` e carrega-se conforme o trabalho. As escolhas entre cursos, com as fontes que as decidiram, estão em `docs/decisoes/`. Para o que não estiver aqui nem lá, pesquisa no MCP `cursos`.

## Nunca

- Segredos no código ou no repositório: **PY-004**, **SEG-010**, **SEG-011**; e ao agente não se dão segredos: **SEG-009**.
- `eval()` sobre texto externo, `subprocess` com `shell=True`, SQL por concatenação: **PY-012**, **PY-013**, **PY-010**, **SEG-015**.
- `UPDATE` ou `DELETE` sem `WHERE`: **PY-011**.
- Excepções silenciadas: **COD-014**, **PY-006**.
- Ler ou escrever dados de um utilizador sem filtrar pelo dono autenticado: **SEG-016**.
- Aprovação genérica para o agente executar código: **SEG-007**. O que nunca pode acontecer bloqueia-se antes: **SEG-008**, **PROC-023**.
- Chains legadas em código novo: **PROC-031**.

## Antes de escrever código

- Trabalho de mais de uma sessão leva spec, com critérios de aceite verificáveis: **PROC-011**, **PROC-012**, **PY-034**.
- A arquitectura define-se antes de se pedir código: **ARQ-001**, **PROC-019**.
- Uma sessão por funcionalidade; cada parte num subagente com contexto limpo: **PROC-001**, **PROC-015**.
- Git limpo antes de executar uma spec: **PROC-022**.
- Regra de negócio que aparece a meio volta à spec antes de virar código: **PROC-014**.

## Ao escrever código

- Nomes que dizem o que a coisa é; sem código morto nem comentado: **COD-001**, **COD-003**, **COD-004**.
- Uma responsabilidade por classe; um nível de abstracção por função: **COD-018**, **COD-006**.
- Dependências injectadas por abstracção, nunca instanciadas lá dentro: **COD-023**, **PAD-001**, **ARQ-005**.
- Composição antes de herança: **COD-024**, **PAD-008**.
- Módulos sem ciclos; o núcleo sem ORM, frameworks nem SDKs: **ARQ-002**, **ARQ-006**, **PAD-003**.
- Guardas em vez de aninhamento: **COD-011**.
- A validação de entrada externa junta todos os erros; o resto falha no primeiro (decisão D-OO02): **ARQ-013**.

## Testes

- Código novo leva testes, guardados no repositório: **COD-026**, **TST-001**.
- Serviços externos isolados com falsos injectados nas portas: **TST-004**, **COD-027**, **PY-035**.
- Casos inválidos e excepções também se testam: **TST-002**.
- Saídas de LLM não se comparam por igualdade exacta: **TST-007**; LLM falso a cada commit: **TST-006**.
- A cobertura não tem meta fixa, e 100% não é objectivo (decisão D-PY11).

## Com LLM e agentes

- O modelo cria-se num único ponto de configuração: **ARQ-004**, **PY-019**.
- O que o código consome tem esquema: **PROC-030**, **PY-023**.
- Todos os ciclos têm limite de iterações: **ARQ-023**, **PY-024**.
- Um erro numa tool não derruba o grafo: **ARQ-025**.
- Estado com checkpointer e um `thread_id` por conversa: **ARQ-026**, **AGT-010**.
- Aprovação humana antes de tools irreversíveis: **PY-028**.
- Servidores MCP de terceiros são código a correr nesta máquina: **PROC-025**, **SEG-006**.
- A temperatura só se declara nos modelos que a aceitam (decisão D-AV04): **PY-022**.

## Os temas

`arquitetura` · `codigo-limpo` · `padroes-de-projeto` · `python` · `testes` · `dev-com-agentes` · `llm-e-prompts` · `agentes-ia` · `rag` · `producao-ia` · `seguranca` · `docker-e-deploy` · `ux` · `dados-e-ml` · `nlp`
