# Decisões — Grupo 7: Docker e deploy

> Fontes consultadas a 2026-09-17.

## D-OPS01 — Sem service mesh, o retry e o circuit breaker ficam na aplicação ou num proxy?

**Temas:** docker-e-deploy · **Regras afectadas:** OPS-014

**Decisão:** O retry e o circuit breaker ficam na aplicação, num único componente reutilizável, nunca espalhados pela lógica de negócio.

**Porquê:** Sem service mesh, sidecar ou proxy dedicado, não há onde pôr essa lógica fora do código. Um componente único evita o anti-padrão de `if`s de retry espalhados pelos casos de uso.

**Fonte:** Sem fonte que decida directamente entre aplicação e proxy. Google, "Addressing Cascading Failures", SRE Book, https://sre.google/sre-book/addressing-cascading-failures/: recomenda backoff exponencial com jitter e um orçamento de retries por processo, sem se pronunciar sobre onde colocar essa lógica.

**Contra:** Um proxy ou sidecar tira esta responsabilidade do código de negócio e muda a política sem novo deploy; pesaria se o projecto ganhasse mais serviços e alguém para os operar.

**Confiança:** média

## D-OPS02 — Que imagem base Python se usa: Alpine ou slim?

**Temas:** docker-e-deploy · **Regras afectadas:** OPS-004

**Decisão:** Usa a variante `slim` da versão de Python decidida (Grupo 1), com a tag sempre fixa.

**Porquê:** A Alpine obriga a compilar do código-fonte os pacotes sem wheel `musllinux`, o que atrasa o build sem compensar depois em tamanho final, quando já estão instaladas as dependências.

**Fonte:** Itamar Turner-Trauring, "Using Alpine can make Python Docker builds 50× slower", pythonspeed.com, actualizado 30 jan. 2026: mediu 30 s e 363 MB com `python:3.8-slim` contra 25 min 57 s e 851 MB com `python:3.8-alpine`, a compilar matplotlib e pandas. Docker Hub, imagem oficial `python`: recomenda a imagem por omissão do repositório salvo restrição de espaço.

**Contra:** A Alpine parte de uma base mais pequena (cerca de 5 MB) e pode compensar se todas as dependências tiverem wheels `musllinux`; mudaria a decisão se o projecto deixasse de depender de pacotes com extensões C.

**Confiança:** alta

## D-OPS03 — Pastas do host montadas no container: só em desenvolvimento ou também em produção?

**Temas:** docker-e-deploy · **Regras afectadas:** OPS-009

**Decisão:** Bind mounts do host só em desenvolvimento, para o código e o recarregamento automático; em produção, volumes nomeados para os dados persistentes.

**Porquê:** Um bind mount depende da estrutura de pastas da máquina anfitriã e não é portátil; um volume é gerido pelo Docker e não fica preso a um caminho local.

**Fonte:** Docker Docs, "Bind mounts", https://docs.docker.com/engine/storage/bind-mounts/: recomenda bind mounts para partilhar código-fonte entre o anfitrião e um container em desenvolvimento, e avisa que ficam presos à estrutura de pastas do anfitrião.

**Contra:** Um bind mount facilita montar certificados ou configuração que já existem, e mudam, fora da imagem; pesaria num deploy que precisasse disso mesmo em produção.

**Confiança:** alta

## D-OPS04 — Como se espera que a base de dados esteja pronta?

**Temas:** docker-e-deploy · **Regras afectadas:** OPS-010

**Decisão:** No Compose, usa `depends_on` com `condition: service_healthy` e um `healthcheck` no serviço da base de dados, em vez de um script de espera externo.

**Porquê:** O Compose só espera o container arrancar, não o serviço ficar pronto para aceitar ligações; a condição de healthcheck confirma isso antes de arrancar o serviço dependente.

**Fonte:** Docker Docs, "Control startup and shutdown order in Compose", https://docs.docker.com/compose/how-tos/startup-order/: diz que o Compose "não espera até um container estar pronto, só até estar em execução", e resolve isso com `depends_on: condition: service_healthy` mais um `healthcheck`.

**Contra:** Um script de espera (`wait-for`, `netcat`) funciona sem exigir healthcheck e serve fora do Compose, por exemplo no CI; mantém-se necessário nesses casos.

**Confiança:** alta

## D-OPS05 — Em que plataforma se faz o deploy?

**Temas:** docker-e-deploy · **Regras afectadas:** OPS-013

**Decisão:** Um único VPS ou VM com Docker Compose, sem orquestrador, enquanto o projecto for de um só programador.

**Porquê:** Não há equipa, SRE nem orçamento de infra para operar um orquestrador; a OPS-013 já exige justificar qualquer estratégia de deployment antes de a adoptar.

**Fonte:** Sem fonte que decida. Nenhuma fonte reconhecida compara plataformas de deploy para este perfil de projecto; a escolha depende só dos requisitos descritos em `_comum.md` (um programador, sem SRE, sem orçamento de infra).

**Contra:** Um PaaS gerido poupa a gestão do sistema operativo; um orquestrador compensaria se o projecto ganhasse mais serviços ou exigências de disponibilidade.

**Confiança:** média

## D-OPS06 — Que motor se usa para LLMs locais?

**Temas:** docker-e-deploy · **Regras afectadas:** OPS-015

**Decisão:** Ollama como motor por omissão para LLMs locais; a OPS-015 já garante trocar de motor só por configuração.

**Porquê:** É o mais maduro dos dois e o ponto de entrada mais comum para LLMs locais; o Docker Model Runner é mais recente e a sua API ainda está em fase alpha/beta.

**Fonte:** Sem fonte com o peso exigido por este ficheiro para decidir maturidade: as comparações encontradas são conteúdo de blogs, não documentação oficial nem autor reconhecido. A documentação de cada ferramenta não compara a outra.

**Contra:** O Docker Model Runner integra-se melhor num fluxo já assente em Docker Compose e evita instalar mais uma ferramenta; pesaria se a API saísse de beta e o projecto preferisse ficar só no ecossistema Docker.

**Confiança:** baixa

## D-OPS07 — O `docker-compose.yml` declara a propriedade `version`?

**Temas:** docker-e-deploy · **Regras afectadas:** nenhuma

**Decisão:** Não declares a propriedade `version` no `docker-compose.yml`.

**Porquê:** É só informativa: o Compose ignora-a ao escolher o schema e usa sempre o mais recente disponível.

**Fonte:** Docker Docs, "Version and name top-level elements", https://docs.docker.com/reference/compose-file/version-and-name/: diz que `version` existe só para compatibilidade com versões antigas e está "obsoleta"; declará-la produz um aviso a pedir a remoção.

**Contra:** Nenhum. Não há vantagem técnica documentada em declará-la.

**Confiança:** alta
