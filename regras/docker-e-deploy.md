# Regras — Docker e deploy

Prefixo `OPS`. Regras confirmadas nas transcrições a 2026-09-17. Síntese de origem: [docker-e-deploy](https://github.com/Rogers-Ribeiro/keel/blob/main/conhecimento/docker-e-deploy.md). Decisões pendentes: [revisão](_revisao/docker-e-deploy.md).

## Segredos e repositório

### OPS-001 — Segredos fora do repositório

**Regra:** Guarda as chaves de API e as passwords num `.env` que não entra no git, versiona só um ficheiro de exemplo com os nomes das variáveis e configura os valores reais na plataforma de deploy.
**Porquê:** Os valores reais ficariam expostos a quem vê o repositório. As plataformas de deploy (CrewAI Enterprise, Streamlit Cloud) têm uma área própria para os segredos.
**Como verificar:** No diff não aparece nenhum `.env` nem nenhuma chave escrita no código. Há um `.env-example` com valores fictícios, e a spec de deploy diz onde se configuram os segredos.
**Fonte:** [Python 3 §12, aula 520](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/python-3-do-zero-ao-avancado/transcricoes/520-configurando-variaveis-de-ambiente-com-env-e-o-settings-py-do-projeto-django.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/python-3-do-zero-ao-avancado/notas/12-django-com-python-projeto-blog.parte-1.md) · [Agentes IA §37, aula 256](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/transcricoes/256-deploy-com-streamlit-cloud.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/notas/37-explorando-modelo-llm-da-deepseek.md)
**Cursos:** 2

### OPS-002 — `.gitignore` desde o início e `.dockerignore` no contexto de build

**Regra:** Cria o `.gitignore` antes do primeiro commit, com o `.env`, o ambiente virtual e as pastas temporárias, e cria um `.dockerignore` para que esses ficheiros não entrem na imagem.
**Porquê:** Sem o `.gitignore` vão para o GitHub ficheiros desnecessários ou sensíveis. O `.dockerignore` evita copiar para o container o que ele não precisa e poupa espaço.
**Como verificar:** O `.gitignore` existe no primeiro commit e cobre `.env` e `.venv`. Se houver um Dockerfile, há um `.dockerignore` ao lado dele.
**Fonte:** [Python 3 §12, aula 516](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/python-3-do-zero-ao-avancado/transcricoes/516-iniciando-o-projeto-e-configurando-git-github-e-gitignore.md) · [Python 3 §12, aula 519](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/python-3-do-zero-ao-avancado/transcricoes/519-criando-arquivos-requirements-txt-e-dockerignore.md) · [Agentes IA §10, aula 77](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/transcricoes/077-versionando-o-projeto.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/python-3-do-zero-ao-avancado/notas/12-django-com-python-projeto-blog.parte-1.md)
**Cursos:** 2

### OPS-003 — Token de acesso nos secrets do CI

**Regra:** No CI, autentica-te no registo de imagens com um token de acesso guardado nos secrets do repositório, e nunca com a password da conta nem com credenciais escritas no workflow.
**Porquê:** Os valores escritos no workflow ficam à vista de outras pessoas, e o Docker Hub deixou de aceitar a password neste login.
**Como verificar:** No workflow, o passo de login lê o utilizador e o token de `secrets.*` e não tem nenhum valor literal.
**Fonte:** [Docker §14, aula 125](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/transcricoes/125-1514-configurando-o-github-actions-para-acessar-o-docker-hub.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/notas/14-extra-2-dockerizando-uma-api-restful-desenvolvida-em-asp-net.md)
**Cursos:** 1

## Imagens e Dockerfile

### OPS-004 — Versão fixa da imagem base

**Regra:** Indica sempre a versão da imagem no `FROM` e nunca deixes a tag por omissão (`latest`).
**Porquê:** Sem versão, o Docker vai buscar a mais recente, que pode não servir o projecto.
**Como verificar:** Nenhum `FROM` no Dockerfile nem nenhum `image:` no compose aparece sem tag ou com `:latest`.
**Fonte:** [Docker §7, aula 39](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/transcricoes/039-0703-criando-o-nosso-primeiro-dockerfile.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/notas/07-conhecendo-o-dockerfile.md)
**Cursos:** 1

### OPS-005 — Só imagens oficiais ou verificadas

**Regra:** Usa como base ou como serviço só imagens marcadas no Docker Hub como "Docker Official Image" ou de um editor verificado.
**Porquê:** Qualquer pessoa pode publicar uma imagem com código malicioso, e as imagens que não são verificadas põem a stack em risco.
**Como verificar:** Cada imagem referida no Dockerfile e no compose é oficial (sem prefixo de utilizador) ou pertence a um editor verificado.
**Fonte:** [Docker §8, aula 43](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/transcricoes/043-0802-o-que-e-o-docker-hub-e-como-criar-uma-conta.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/notas/08-trabalhando-com-docker-registries.md) · [Docker §4, aula 17](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/transcricoes/017-0403-uma-visao-de-alto-nivel-do-ecossistema-docker.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/notas/04-os-principais-componentes-do-ecossistema-docker.md)
**Cursos:** 1

### OPS-006 — Comandos relacionados num só `RUN`

**Regra:** Junta numa só instrução `RUN`, com `&&`, os comandos que andam juntos (por exemplo, a actualização de pacotes e as instalações).
**Porquê:** Cada `RUN` cria uma camada. Muitas camadas tornam o build mais lento e a imagem maior.
**Como verificar:** O Dockerfile não tem `RUN` seguidos que pudessem ser um só, sobretudo na instalação de pacotes.
**Fonte:** [Docker §9, aula 57](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/transcricoes/057-0906-reduzindo-o-numero-de-camadas-em-uma-imagem.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/notas/09-conhecendo-o-dockerfile-em-detalhes.md) · [Python 3 §12, aula 521](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/python-3-do-zero-ao-avancado/transcricoes/521-configurando-o-dockerfile-para-gerar-nossa-imagem-docker-django.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/python-3-do-zero-ao-avancado/notas/12-django-com-python-projeto-blog.parte-1.md)
**Cursos:** 2

### OPS-007 — Utilizador dedicado em vez de root

**Regra:** Cria na imagem um utilizador próprio, sem password nem login, e corre a aplicação com ele e não como root.
**Porquê:** O curso apresenta o utilizador próprio como boa prática, em vez de usar o root dentro da imagem.
**Como verificar:** O Dockerfile cria um utilizador (`adduser`/`useradd`) e tem uma instrução `USER` com esse utilizador antes do arranque da aplicação.
**Fonte:** [Python 3 §12, aula 521](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/python-3-do-zero-ao-avancado/transcricoes/521-configurando-o-dockerfile-para-gerar-nossa-imagem-docker-django.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/python-3-do-zero-ao-avancado/notas/12-django-com-python-projeto-blog.parte-1.md)
**Cursos:** 1

### OPS-008 — Um processo por container

**Regra:** Põe um só processo principal em cada container e separa os outros serviços em containers próprios.
**Porquê:** Com um processo, cada container tem uma só preocupação e fica mais simples. O curso desaconselha correr vários processos em produção.
**Como verificar:** Nenhum Dockerfile arranca vários serviços (por exemplo, com supervisores ou imagens multi-processo); a base de dados, a app e os workers são serviços diferentes no compose.
**Fonte:** [Docker §5, aula 28](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/transcricoes/028-0507-um-processo-por-conteiner.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/notas/05-conhecendo-imagens-e-conteineres.md) · [Docker §6, aula 32](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/transcricoes/032-0603-pid-1-e-conteineres.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/notas/06-gerenciamento-de-conteineres.md)
**Cursos:** 1

## Compose, dados e arranque

### OPS-009 — Volumes para os dados persistentes

**Regra:** Monta um volume em todos os caminhos onde um container guarda dados que têm de sobreviver, em especial as bases de dados.
**Porquê:** Com o volume, os dados não se perdem quando o container pára ou cai e ficam disponíveis quando ele volta. Para uma base de dados de produção, o curso manda definir os volumes.
**Como verificar:** No compose, cada serviço com estado (base de dados, índice vectorial, ficheiros carregados) tem uma entrada em `volumes`.
**Fonte:** [Docker §12, aula 81](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/transcricoes/081-1204-volumes-e-variaveis-de-ambiente-no-docker-compose.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/notas/12-conhecendo-o-docker-compose.md) · [Docker §21, aula 200](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/transcricoes/200-2006-iniciando-um-conteiner-oracle.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/notas/21-extra-7-precisa-instalar-um-sgbd-que-tal-subir-um-conteiner.md)
**Cursos:** 1

### OPS-010 — Container arrancado não é serviço pronto

**Regra:** Antes das migrações ou dos testes de integração, confirma que a base de dados já aceita ligações, e não assumas que ela está pronta só porque o container arrancou ou porque existe `depends_on`.
**Porquê:** Se a migração corre antes de a base de dados estar de pé, falha. Por isso, os cursos usam um script ou um ciclo de espera, também no CI.
**Como verificar:** O arranque ou o workflow de CI tem um passo que espera pela base de dados antes de a usar. Não há migrações que dependam só da ordem do compose.
**Fonte:** [Docker §15, aula 139](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/transcricoes/139-1604-dockerizando-o-back-end.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/notas/15-extra-3-dockerizando-uma-aplicacao-com-node-e-react-js.md) · [Docker §14, aula 128](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/transcricoes/128-1517-inicializando-um-conteiner-com-o-sql-server-2022-no-githubactions.md) · [Python 3 §12, aula 521](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/python-3-do-zero-ao-avancado/transcricoes/521-configurando-o-dockerfile-para-gerar-nossa-imagem-docker-django.md)
**Cursos:** 2

## Deploy e operação

### OPS-011 — Não alterar código no servidor

**Regra:** Faz as alterações ao código localmente, faz commit e push, e actualiza o servidor só a partir do repositório. A configuração local do servidor, que não está no git, é a única excepção.
**Porquê:** O servidor está em produção e uma edição pode derrubá-lo. Além disso, as alterações feitas lá geram conflitos no git com o repositório.
**Como verificar:** O procedimento de deploy não inclui editar ficheiros versionados no servidor; o servidor não tem alterações por commitar.
**Fonte:** [Python 3 §11, aula 510](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/python-3-do-zero-ao-avancado/transcricoes/510-como-faco-alteracoes-no-site-usando-o-git-gunicorn-e-nginx.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/python-3-do-zero-ao-avancado/notas/11-django-com-python-primeiro-deploy-linux.md)
**Cursos:** 1

### OPS-012 — Entrar nos containers com `docker exec`, não por SSH

**Regra:** Para investigar um container, usa `docker exec`. Não instales nem configures um servidor SSH dentro da imagem.
**Porquê:** O curso diz que o acesso por SSH a um container não é boa prática e que a maioria dos containers nem o tem. O `exec` abre um processo à parte para depurar.
**Como verificar:** Nenhum Dockerfile instala `openssh-server` nem expõe a porta 22. A documentação de operação indica `docker exec`.
**Fonte:** [Docker §6, aula 36](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/transcricoes/036-0607-acessando-o-shell-de-um-conteiner.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/notas/06-gerenciamento-de-conteineres.md)
**Cursos:** 1

### OPS-013 — Estratégia de deployment justificada

**Regra:** Antes de escolher a estratégia de deployment, responde na spec às perguntas sobre a arquitectura, a tolerância a downtime (SLA), a velocidade de rollback, os indicadores a vigiar e a coexistência de duas versões. Não adoptes blue-green, canário ou shadow sem essa necessidade.
**Porquê:** O curso avisa que uma estratégia sem necessidade real é over-engineering: dá muito trabalho e pode não responder ao problema.
**Como verificar:** A spec de deploy tem as respostas a essas perguntas, e a estratégia escolhida decorre delas.
**Fonte:** [Arquitectura §8, aula 68](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/arquitetura-de-software-design-de-sistemas-modernos/transcricoes/68-como-definir-sua-estrategia-de-deployment.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/arquitetura-de-software-design-de-sistemas-modernos/notas/08-padroes-de-deployment.md)
**Cursos:** 1

## Resiliência e LLMs

### OPS-014 — Retry limitado e só em operações idempotentes

**Regra:** Limita o número de tentativas de cada retry, trata os timeouts e fecha as ligações antes de tentar outra vez. Só repete escritas se a operação for idempotente.
**Porquê:** Se várias camadas repetem sem controlo, os pedidos multiplicam-se (retry storm) e o sistema inteiro pode cair. Uma escrita repetida pode ficar duplicada.
**Como verificar:** Cada retry tem um máximo de tentativas e um intervalo. As escritas repetidas têm uma chave de idempotência ou verificam se já existem. Não há retries encadeados sem controlo entre camadas.
**Fonte:** [Arquitectura §6, aula 58](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/arquitetura-de-software-design-de-sistemas-modernos/transcricoes/58-retry-pattern-e-dlq.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/arquitetura-de-software-design-de-sistemas-modernos/notas/06-padroes-de-resiliencia-escalabilidade-e-infraestrutura.md)
**Cursos:** 1

### OPS-015 — Fornecedor de LLM trocável por configuração (API a confirmar)

**Regra:** Lê o endereço base (base URL) e o modelo do LLM da configuração, para que passar de um modelo local para um fornecedor em nuvem não mexa no resto do código.
**Porquê:** Os servidores locais seguem o formato da API da OpenAI. Assim, basta trocar o endereço base entre desenvolvimento e produção, e o resto do código fica igual quando se muda de backend.
**Como verificar:** O endereço e o nome do modelo não estão fixos no código; a criação do cliente LLM está num só sítio.
**Fonte:** [Docker §19, aula 186](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/transcricoes/186-2205-interagindo-com-o-modelo-via-api-openai-compatible.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/docker-do-zero-a-maestria-conteinerizacao-desmistificada/notas/19-docker-model-runner-inteligencia-artificial-on-premise-priva.md) · [Agentes IA §37, aula 255](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/transcricoes/255-desenvolvendo-um-chat-completo.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/notas/37-explorando-modelo-llm-da-deepseek.md)
**Cursos:** 2
