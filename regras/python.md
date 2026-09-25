# Regras — Python

Prefixo `PY`. ## Ambiente, dependências e segredos

### PY-001 — Um ambiente virtual por projecto

**Regra:** Instala as dependências do projecto só dentro de um ambiente virtual dedicado e nunca no Python global.
**Porquê:** Por omissão, o `pip` instala de forma global, e isso mistura versões entre projectos. O ambiente virtual permite ter versões diferentes da mesma biblioteca em projectos diferentes.
**Como verificar:** O README e os scripts criam ou activam o ambiente do projecto (`.venv`); não há instruções de `pip install` fora dele nem instalações com `sudo` ou `--user`.
**Cursos:** 3

### PY-002 — A pasta do ambiente virtual fica fora do git

**Regra:** Põe a pasta do ambiente virtual (`.venv`) no `.gitignore` e nunca a versiones.
**Porquê:** A pasta só tem bibliotecas instaladas, e quem clona o projecto recria-a a partir do ficheiro de dependências.
**Como verificar:** O `.gitignore` inclui a pasta do ambiente; o diff não traz ficheiros de `.venv/` nem de `site-packages/`.
**Cursos:** 3

### PY-003 — Dependências com versão registada

**Regra:** Regista cada dependência no ficheiro de dependências do projecto com a versão fixada, e nunca só com o nome.
**Porquê:** O projecto CrewAI do Agentes IA deixou de funcionar porque o `requirements.txt` não fixava versões e as bibliotecas foram actualizadas depois da gravação.
**Como verificar:** Nenhuma dependência aparece sem versão; um diff que acrescenta um import de terceiros acrescenta também a dependência com versão. A forma de fixar (exacta ou por faixa, com ou sem lockfile) está em [revisão](_revisao/python.md).
**Cursos:** 3

### PY-004 — Chaves de API num `.env` que o git ignora

**Regra:** Lê as chaves de API de variáveis de ambiente carregadas de um `.env` e garante que o `.env` está no `.gitignore` antes do primeiro commit; nunca escrevas uma chave no código.
**Porquê:** Chaves publicadas num repositório público são recolhidas automaticamente por bots; o `.gitignore` serve precisamente para deixar de fora chaves e ficheiros internos.
**Como verificar:** Nenhum literal de chave no código nem nos notebooks; o `.gitignore` inclui `.env`; o diff não adiciona `.env`.
**Cursos:** 5

## Idiomas da linguagem

### PY-005 — Sem valores por omissão mutáveis

**Regra:** Não uses listas, dicionários ou outros mutáveis como valor por omissão de um parâmetro: usa `None` e cria o objecto dentro da função (numa dataclass, `field(default_factory=...)`).
**Porquê:** O valor por omissão é criado uma só vez, quando a função é definida, e fica partilhado por todas as chamadas; as dataclasses nem sequer o permitem.
**Como verificar:** Nenhuma assinatura com `=[]`, `={}` ou `=set()`; nas dataclasses, os campos mutáveis usam `default_factory`.
**Cursos:** 1

### PY-006 — Excepções específicas, nunca silenciosas

**Regra:** Apanha só as excepções que sabes tratar, indicando a classe em cada `except`; não escrevas `except:` nem `except Exception:` que só ignorem o erro.
**Porquê:** Um `except` genérico esconde erros reais, como um `NameError` causado por um nome mal escrito.
**Como verificar:** Nenhum `except` sem classe; nenhum `except` cujo corpo seja só `pass`; cada bloco trata, regista ou relança.
**Cursos:** 2

### PY-007 — Erros das APIs externas tratados

**Regra:** Envolve cada chamada a uma API externa (LLM ou HTTP) num `try/except` que trata a falha, e valida o JSON devolvido antes de o usar.
**Porquê:** O IA Prática inclui o tratamento dos erros da API e a validação do JSON nas boas práticas de integração com fornecedores de LLM.
**Como verificar:** As funções que chamam o cliente do LLM ou `requests` tratam as excepções da biblioteca; o JSON recebido passa por validação ou parser antes de ser usado.
**Cursos:** 1

### PY-008 — Ficheiros de texto com `with` e `encoding="utf-8"`

**Regra:** Abre os ficheiros de texto com `with open(caminho, modo, encoding="utf-8")`.
**Porquê:** O `with` fecha o ficheiro mesmo quando há erro; sem `encoding`, o Windows usa a codificação do sistema e os acentos saem estragados.
**Como verificar:** Nenhum `open(` de texto sem `encoding=` nem fora de um `with`; o mesmo vale para `json.load`/`json.dump` sobre ficheiros.
**Cursos:** 3

### PY-009 — Sem `from modulo import *`

**Regra:** Importa o módulo (com alias, se quiseres) ou os nomes explícitos; não uses `from modulo import *`.
**Porquê:** O `*` esconde a origem das funções e deixa que funções homónimas de bibliotecas diferentes se sobreponham; o Py3 chama-lhe má prática.
**Como verificar:** Nenhum `import *` no diff.
**Cursos:** 3

## Segurança

### PY-010 — SQL só com placeholders

**Regra:** Passa os valores de uma consulta SQL pelos placeholders do driver (`?` no `sqlite3`, `%s` no PyMySQL e no `psycopg2`) e nunca por concatenação ou f-string.
**Porquê:** Com placeholders, o driver separa o comando dos valores e evita SQL injection.
**Como verificar:** Nenhuma chamada `execute(` recebe uma string montada com `+`, `%` ou f-string; os valores vão no segundo argumento.
**Cursos:** 4

### PY-011 — `UPDATE` e `DELETE` sempre com `WHERE`

**Regra:** Escreve todos os `UPDATE` e `DELETE` com um `WHERE` que identifique os registos, normalmente pela chave.
**Porquê:** Sem `WHERE`, o comando altera ou apaga a tabela inteira; os dois cursos apontam-no como um erro clássico.
**Como verificar:** Cada `UPDATE`/`DELETE` no diff tem `WHERE`; as operações sobre a tabela inteira são explícitas e justificadas.
**Cursos:** 2

### PY-012 — Sem `eval` sobre texto

**Regra:** Não uses `eval()` sobre texto que venha do utilizador, de ficheiros ou de um LLM.
**Porquê:** O `eval` executa qualquer código que a string contenha; o Py3 mostra-o só como exemplo e avisa para não o usar dessa forma.
**Como verificar:** Nenhum `eval(` nem `exec(` no diff; cálculos e despachos usam funções ou dicionários explícitos.
**Cursos:** 1

### PY-013 — `subprocess` com lista de argumentos e sem `shell=True`

**Regra:** Chama programas externos com `subprocess.run([...])`, com o comando e os argumentos numa lista, e não uses `shell=True` com dados vindos de fora.
**Porquê:** Com `shell=True`, a entrada do utilizador pode chegar ao shell do sistema e abrir brechas de segurança.
**Como verificar:** Nenhum `shell=True` em chamadas que incluam valores externos; nenhum `os.system` com strings montadas.
**Cursos:** 1

### PY-014 — Tokens e senhas com `secrets`

**Regra:** Gera senhas, tokens e outros valores de segurança com o módulo `secrets` e nunca com `random`.
**Porquê:** O `random` é pseudoaleatório e reprodutível, por isso só serve para testes e simulações; o `secrets` é o indicado para criptografia e senhas.
**Como verificar:** Nenhum `random.` na geração de identificadores secretos, senhas ou chaves.
**Cursos:** 1

## Desenho e estrutura

### PY-015 — Lógica de LLM separada da interface

**Regra:** Põe loaders, split, embeddings, chains e agentes em módulos próprios, que a interface (Streamlit, API, CLI) apenas chama.
**Porquê:** Nos projectos de chatbot com PDF, o backend LangChain ficou num módulo à parte para não deixar tudo num só ficheiro.
**Como verificar:** Os ficheiros de interface não criam loaders, splitters, vector stores nem modelos; importam funções de um módulo de backend.
**Cursos:** 3

### PY-016 — Composição antes de herança

**Regra:** Usa herança só quando «X é um tipo de Y»; nos outros casos usa composição e evita hierarquias profundas.
**Porquê:** Cadeias de herança profundas, sobretudo com herança múltipla, tornam o código muito difícil de depurar; o Py3 repete que, sempre que possível, a composição é melhor.
**Como verificar:** Cada nova subclasse representa uma relação «é um»; não há hierarquias com mais de dois ou três níveis nem subclasses criadas só para reutilizar código.
**Cursos:** 3

### PY-017 — Contratos com `ABC` e `@abstractmethod`

**Regra:** Define as interfaces entre componentes com uma classe `abc.ABC` e métodos `@abstractmethod`, e não com métodos que lançam `NotImplementedError`.
**Porquê:** O Python não tem interfaces nativas; a classe abstracta é o contrato que obriga cada implementação a ter os métodos esperados.
**Como verificar:** As abstracções (por exemplo, fornecedor, repositório, retriever próprio) herdam de `ABC`; `@abstractmethod` é o decorator mais interno.
**Cursos:** 2

### PY-018 — Sobreposições mantêm a assinatura

**Regra:** Ao sobrepor um método, mantém o nome, os parâmetros, os tipos e o tipo de retorno do método original.
**Porquê:** É o que o princípio de substituição de Liskov exige; um retorno ou parâmetro diferente parte os clientes sem erro visível.
**Como verificar:** Nas subclasses, os métodos sobrepostos têm a mesma assinatura e as mesmas anotações de tipo que a classe base.
**Cursos:** 2

## Modelos e prompts

### PY-019 — Modelo criado num único ponto (API a confirmar)

**Regra:** Cria o chat model num único módulo ou função, de forma que trocar de fornecedor mude só esse ponto (a classe ou a string `fornecedor:modelo`) e a autenticação.
**Porquê:** A abstracção de chat models do LangChain permite trocar de fornecedor mudando só a string; o professor avisa que isso sozinho não chega para produção.
**Como verificar:** Nenhum `ChatOpenAI(`, `ChatGroq(` ou `init_chat_model(` espalhado pelo código fora do ponto de criação.
**Cursos:** 3

### PY-020 — Prompts com templates, não com f-strings (API a confirmar)

**Regra:** Constrói os prompts com `PromptTemplate`/`ChatPromptTemplate` parametrizados, e não com f-strings nem concatenação.
**Porquê:** O template obriga a fornecer exactamente as variáveis esperadas e dá um erro claro se faltar ou estiver mal escrita alguma; além disso, pode ser reutilizado.
**Como verificar:** Os prompts enviados ao modelo vêm de templates; não há f-strings a montar o texto de um prompt.
**Cursos:** 3

### PY-021 — Comportamento na mensagem de sistema

**Regra:** Define o papel, o tom e o comportamento do modelo na mensagem de sistema e deixa a tarefa concreta para a mensagem do utilizador.
**Porquê:** Nos dois cursos, o papel `system` é o que define o comportamento do modelo; o `user` traz o pedido.
**Como verificar:** Cada chamada tem uma mensagem de sistema com as instruções de comportamento; as instruções permanentes não aparecem misturadas na mensagem do utilizador.
**Cursos:** 2

### PY-022 — Temperatura baixa em tarefas factuais

**Regra:** Nos modelos que aceitam o parâmetro, usa temperatura entre 0 e 0,3 em sumarização, respostas factuais, código e saídas lidas por código, e reserva temperaturas altas para tarefas criativas. Nos modelos que não o aceitam, não o declares (ver LLM-011).
**Porquê:** Valores baixos tornam a resposta determinística e factual, e valores altos tornam-na criativa; o IA Prática resume: baixa para dados, alta para criatividade. O parâmetro deixou de ser universal — nos modelos da Anthropic lançados depois do Claude Opus 4.6, um valor diferente de 1,0 devolve erro 400.
**Como verificar:** Os modelos usados em extracção, classificação, RAG ou saída estruturada têm `temperature` explícita e baixa quando o modelo a aceita, e não a declaram quando não a aceita.
**Fonte:** [decisão D-AV04](../docs/decisoes/g6-avaliacao-e-prompts.md)
**Cursos:** 3

### PY-023 — Saída lida por código com esquema Pydantic (API a confirmar)

**Regra:** Quando o código consome a saída do LLM, define o esquema num `BaseModel` com `Field(description=...)` e aplica-o com saída estruturada ou com um parser que põe as instruções de formato no prompt; não uses `TypedDict` nem `dataclass` quando precisas de validação.
**Porquê:** Só o Pydantic valida os campos em execução; `TypedDict` e `dataclass` descrevem o esquema mas não validam.
**Como verificar:** Nenhum `json.loads` sobre texto livre do modelo; cada saída estruturada tem um `BaseModel` associado.
**Cursos:** 3

## Agentes e tools

### PY-024 — Ciclo de agente com limite de iterações

**Regra:** Limita todo o ciclo de agente escrito à mão com um número máximo de iterações e termina de forma explícita quando o limite é atingido.
**Porquê:** O limite impede que o agente corra indefinidamente; o valor (10 no curso) é uma heurística.
**Como verificar:** Cada ciclo de agente tem uma constante como `MAX_ITERATIONS` e um ramo para quando o limite é atingido.
**Cursos:** 1

### PY-025 — Cada tool com docstring clara (API a confirmar)

**Regra:** Escreve em cada função exposta como tool uma docstring que diga o que faz e que valores aceita, com os argumentos tipados.
**Porquê:** O modelo decide que tool usar a partir do nome, dos argumentos e da docstring que o `@tool` lhe passa.
**Como verificar:** Nenhuma função com `@tool` (ou registada como tool) sem docstring; os valores válidos dos argumentos estão descritos.
**Cursos:** 2

### PY-026 — Regras defensivas no prompt de agentes com modelos pequenos

**Regra:** Com modelos pequenos ou open-weight, põe no system prompt do agente regras estritas: não adivinhar valores que vêm de tools, chamar a tool que os fornece e respeitar a ordem das chamadas.
**Porquê:** No exemplo com um modelo pequeno, as regras defensivas levaram o modelo a obter o preço pela tool em vez de o inventar.
**Como verificar:** O system prompt de um agente servido por um modelo pequeno proíbe explicitamente inventar os dados fornecidos pelas tools.
**Cursos:** 1

### PY-027 — Mensagens do estado LangGraph com reducer (API a confirmar)

**Regra:** Declara a lista de mensagens do estado LangGraph com o reducer `add_messages` (`Annotated[list[AnyMessage], add_messages]`).
**Porquê:** Sem reducer, cada nó substitui o valor; com `add_messages`, as mensagens acumulam-se e só são substituídas quando têm o mesmo id.
**Como verificar:** O campo `messages` do estado tem o reducer; nenhum nó devolve o histórico inteiro para o reconstruir à mão.
**Cursos:** 1

### PY-028 — Aprovação humana antes de tools críticas (API a confirmar)

**Regra:** Faz com que as tools críticas ou irreversíveis (escritas em bases de dados, envio de emails, transacções) parem para aprovação humana antes de correr, com o estado guardado num checkpointer e num `thread_id`.
**Porquê:** Um agente ou um LLM pode enganar-se, e nas operações de alto risco a execução só deve continuar depois de uma pessoa aprovar, editar ou rejeitar a chamada.
**Como verificar:** As tools com efeitos externos estão configuradas para interromper (por exemplo, com `HumanInTheLoopMiddleware`); o agente tem checkpointer e as chamadas levam `thread_id`.
**Cursos:** 1

### PY-029 — Tracing do LangSmith configurado (API a confirmar)

**Regra:** Configura o tracing do LangSmith por variáveis de ambiente (activação, chave e projecto) antes de correr chains ou agentes.
**Porquê:** O LangSmith regista a entrada, a saída, o tempo, os tokens e o estado de cada passo, e é assim que o curso depura as chains.
**Como verificar:** O `.env` de exemplo tem as variáveis do LangSmith; o código não desliga o tracing nem guarda a chave no código.
**Cursos:** 1

## RAG

### PY-030 — Chunks sempre com overlap (API a confirmar)

**Regra:** Define `chunk_overlap` maior que zero em todos os text splitters.
**Porquê:** O overlap é um seguro barato: sem ele, uma resposta dividida entre dois chunks deixa de ser encontrada.
**Como verificar:** Nenhum splitter com `chunk_overlap=0` ou sem o parâmetro definido.
**Cursos:** 1

### PY-031 — Metadados de origem em cada chunk (API a confirmar)

**Regra:** Garante que cada chunk mantém os metadados de origem (ficheiro, página): divide com `split_documents` e devolve os documentos de origem com a resposta.
**Porquê:** Os metadados dizem de que documento e de que página vem cada resposta; nos projectos com PDF, a chain devolve os documentos de origem para os mostrar.
**Como verificar:** O pipeline de ingestão divide objectos `Document` e não texto solto; a resposta do RAG inclui as fontes.
**Cursos:** 4

### PY-032 — Score do Chroma é uma distância (API a confirmar)

**Regra:** Trata o score devolvido pelo Chroma como distância (menor é mais parecido) em filtros, limiares e ordenações.
**Porquê:** Por omissão, o Chroma usa a distância L2: 0 significa idêntico e valores maiores significam menos relevante, ao contrário da semelhança por cosseno.
**Como verificar:** Os limiares sobre `similarity_search_with_score` do Chroma usam `<` e não `>`; o código não chama «similaridade» a esse valor.
**Cursos:** 2

## Serviços e processo

### PY-033 — Endpoints FastAPI assíncronos para serviços externos

**Regra:** Declara com `async def` os endpoints FastAPI que chamam um LLM ou outro serviço externo, e valida o corpo do pedido com um modelo Pydantic.
**Porquê:** As funções assíncronas dão melhor desempenho à API quando ela depende de recursos externos; o FastAPI valida os corpos com `BaseModel`.
**Como verificar:** Os endpoints que chamam o modelo são `async def`; os corpos dos pedidos são classes `BaseModel`.
**Cursos:** 1

### PY-034 — Spec com critérios de aceite verificáveis antes do código

**Regra:** Antes de implementar, escreve uma spec com objectivo, requisitos funcionais e não funcionais, escopo e fora de escopo e critérios de aceite verificáveis, trocando cada adjectivo de qualidade por um número.
**Porquê:** Uma spec vaga parece razoável mas não permite verificar nada; a regra de ouro é trocar «rápido» por um valor como «menos de 300 ms com 10 mil registos».
**Como verificar:** Cada funcionalidade tem uma spec com todas as secções; os critérios de aceite são testáveis e não têm adjectivos sem número.
**Cursos:** 1

### PY-035 — Testes automáticos isolados da base de produção

**Regra:** Transforma os critérios de aceite em testes automáticos que correm sobre uma base de dados própria, isolada da de produção.
**Porquê:** No projecto FastAPI do curso, os testes blindam o comportamento da aplicação e usam uma base separada da de produção.
**Como verificar:** Cada critério de aceite tem pelo menos um teste; a configuração dos testes aponta para uma base temporária ou de teste.
**Cursos:** 1
