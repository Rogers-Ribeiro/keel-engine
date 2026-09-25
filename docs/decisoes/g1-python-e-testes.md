# Decisões — Grupo 1: Python, ferramentas e testes

> Fontes consultadas a 2026-09-17.

## D-PY01 — Que gestor de ambiente e de dependências usa o projecto?

**Temas:** python, arquitetura, dev-com-agentes, dados-e-ml · **Regras afectadas:** PY-001, PY-002

**Decisão:** O projecto usa `uv` com `pyproject.toml` para o ambiente virtual, as dependências e a versão do Python.

**Porquê:** `uv` junta num só binário o que antes exigia pip, pip-tools, pyenv e um gestor de ambientes, é mais rápido, e é já o que as ferramentas deste repositório usam (`uv run`).


**Contra:** Poetry tem um fluxo de publicação de pacotes mais maduro; pesaria se o projecto vier a publicar uma biblioteca no PyPI.

**Confiança:** média — sem fonte que decida entre `uv` e Poetry; a documentação de empacotamento oficial é neutra, a escolha assenta na própria ferramenta e no uso já feito no repositório.

## D-PY02 — Como se fixam as versões das dependências (PY-003)?

**Temas:** python, docker-e-deploy · **Regras afectadas:** PY-003

**Decisão:** O `pyproject.toml` declara intervalos de compatibilidade e o `uv.lock`, versionado, fixa as versões exactas instaladas.

**Porquê:** Um manifesto de biblioteca ou aplicação deve aceitar intervalos; é o ficheiro de ambiente, à parte, que fixa versões exactas para instalações repetíveis. O `uv.lock` cumpre esse segundo papel sem tornar o manifesto rígido.


**Contra:** Fixar tudo a `==` directamente no manifesto é mais simples de ler sem abrir o lockfile; funciona em projectos pequenos sem biblioteca distribuída.

**Confiança:** alta.

## D-PY03 — Que versão mínima do Python usa o projecto?

**Temas:** python, codigo-limpo, dados-e-ml · **Regras afectadas:** nenhuma

**Decisão:** A versão mínima é o Python 3.12.

**Porquê:** Em Setembro de 2026 o 3.10 está a semanas do fim de vida e o 3.11 já só recebe correcções de segurança; 3.12 dá margem até Outubro de 2028 e já tem toda a sintaxe nativa de tipos.


**Contra:** Fixar em 3.13 dá acesso a correcções mais recentes da linguagem; troca-se por menos garantia de compatibilidade das bibliotecas já testadas.

**Confiança:** média — a documentação só descarta versões sem suporte; escolher 3.12 e não 3.13 ou 3.14 é uma opção do projecto.

## D-PY04 — Que sintaxe de tipos se usa?

**Temas:** python · **Regras afectadas:** nenhuma

**Decisão:** Usa-se `list[...]`, `dict[...]` e `X | None`; nunca `typing.List`, `typing.Dict` nem `typing.Optional`.

**Porquê:** Com o mínimo em 3.12, as duas alterações que trouxeram esta sintaxe já se aplicam por inteiro, e a forma antiga fica marcada como redundante.


**Contra:** nenhum motivo técnico da fonte para manter `typing.List`/`Optional` acima do mínimo suportado.

**Confiança:** alta.

## D-PY05 — Os type hints são obrigatórios em todo o código?

**Temas:** codigo-limpo · **Regras afectadas:** nenhuma

**Decisão:** Anotam-se sempre as assinaturas públicas (funções, métodos, atributos de classe) e corre-se um verificador de tipos no CI; scripts pontuais e código descartável ficam de fora.

**Porquê:** O projecto depende de abstracções injectadas (portas, fábricas de modelo) que um verificador de tipos ajuda a confirmar; exigir isso do código público, não de todo o código, respeita a tipagem gradual da linguagem.


**Contra:** Exigir tipos em tudo, sem excepção, dá cobertura total ao verificador; o próprio PEP 484 admite essa opção, só não a impõe.

**Confiança:** média — a fonte decide que a linguagem não obriga; quanto o projecto exige de si é escolha de contexto.

## D-PY06 — Como se marcam os atributos privados: um underscore ou dois?

**Temas:** python, codigo-limpo · **Regras afectadas:** nenhuma

**Decisão:** Um underscore (`_nome`) para atributos e métodos não públicos; o duplo (`__nome`) só quando se quer mesmo o name mangling numa hierarquia de subclasses.

**Porquê:** É a recomendação directa do guia de estilo oficial; o duplo underscore não dá protecção real ao dado, só evita colisões de nomes em subclasses.


**Contra:** nenhum, fora do caso de colisão em subclasses que a própria fonte aponta.

**Confiança:** alta.

## D-PY07 — Como se expõe e altera o estado de um objecto em Python?

**Temas:** codigo-limpo · **Regras afectadas:** nenhuma

**Decisão:** Atributo público simples para dados sem lógica; `@property` só quando ler exige cálculo ou protecção; nunca pares getter/setter ao estilo Java sem motivo.

**Porquê:** É a recomendação directa do guia de estilo oficial, e evita código acessor que não faz nada além de repetir o nome do atributo.


**Contra:** nenhum; o próprio PEP 8 só avisa para não usar `@property` em operações caras, o que reforça reservá-la para quando há lógica.

**Confiança:** alta.

## D-PY08 — Como se resolvem os imports com código em `src/`?

**Temas:** python · **Regras afectadas:** nenhuma

**Decisão:** Layout `src/`, imports absolutos e instalação editável do próprio pacote (`uv pip install -e .` ou equivalente); nunca manipular `sys.path` nos testes.

**Porquê:** O layout `src/` evita que o interpretador use a cópia de desenvolvimento em vez da instalada; a manipulação do `sys.path` não resolve isso, só contorna o sintoma nos testes.


**Contra:** o layout plano é mais simples para scripts que nunca se instalam; não é o caso de um projecto com pacote e testes próprios.

**Confiança:** alta.

## D-PY09 — Com que framework se escrevem os testes: `unittest` ou `pytest`?

**Temas:** python, testes · **Regras afectadas:** nenhuma

**Decisão:** `pytest`.

**Porquê:** Corre suites `unittest` sem as reescrever, tem fixtures reutilizáveis e um ecossistema de plugins que o `unittest` da biblioteca padrão não tem.


**Contra:** `unittest` não pede dependência externa; chega para suites pequenas sem fixtures partilhadas.

**Confiança:** alta.

## D-PY10 — Como se isolam as dependências nos testes unitários: `patch` ou falsos injectados?

**Temas:** testes · **Regras afectadas:** TST-004, PY-035

**Decisão:** Falsos (fakes) injectados nas portas do caso de uso; `unittest.mock.patch` só para chamadas directas a bibliotecas de terceiros que não passam por uma porta.

**Porquê:** Um teste com um falso confirma o resultado sem se prender à forma como o código chama as suas dependências; `patch` remenda a implementação e por isso quebra quando essa forma muda, mesmo sem mudar o comportamento.


**Contra:** `patch` é mais rápido quando não há porta definida; o próprio Fowler reconhece bons programadores satisfeitos com a escola dos mocks.

**Confiança:** alta.

## D-PY11 — Que meta de cobertura de testes se exige?

**Temas:** testes, arquitetura, padroes-de-projeto, dev-com-agentes · **Regras afectadas:** nenhuma

**Decisão:** Sem número fixo nem 100% obrigatório. A cobertura serve para apontar código sem testes; cada spec justifica o que decide não cobrir, em vez de perseguir um limiar.

**Porquê:** as duas fontes concordam que fixar um número desloca o objectivo de testar bem para testar tudo, incluindo ramos que não compensam; um código bem testado tende a ficar naturalmente nos 80-90%, e 100% é sinal de suspeita, não de qualidade.


**Contra:** uma meta única e alta, como pedem os cursos de AI-Driven Development, dá aos agentes um critério simples e automatizável para rejeitar specs incompletas; perde-se isso sem número.

**Confiança:** alta — a pergunta "para que serve a métrica" tem resposta clara nas duas fontes; o número é que elas recusam fixar.

## D-PY12 — Os testes de integração correm à mão ou automaticamente?

**Temas:** testes · **Regras afectadas:** nenhuma

**Decisão:** Automáticos, no mesmo ciclo que os testes unitários.

**Porquê:** um conjunto de testes só protege como rede de segurança se correr sozinho a cada alteração; um agente de IA não corre ficheiros `.http` à mão por iniciativa própria.


**Contra:** testes de integração com serviços externos caros ou lentos por vezes só correm à mão ou num pipeline à parte; TST-006 já separa o ciclo do LLM real do LLM falso por essa razão.

**Confiança:** alta.
