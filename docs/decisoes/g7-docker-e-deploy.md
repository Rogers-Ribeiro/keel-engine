# Decisões — Grupo 7: Docker e deploy

> Fontes consultadas a 2026-09-17.

## D-OPS01 — Sem service mesh, o retry e o circuit breaker ficam na aplicação ou num proxy?

**Temas:** docker-e-deploy · **Regras afectadas:** OPS-014

**Decisão:** O retry e o circuit breaker ficam na aplicação, num único componente reutilizável, nunca espalhados pela lógica de negócio.

**Porquê:** Sem service mesh, sidecar ou proxy dedicado, não há onde pôr essa lógica fora do código. Um componente único evita o anti-padrão de `if`s de retry espalhados pelos casos de uso.


**Contra:** Um proxy ou sidecar tira esta responsabilidade do código de negócio e muda a política sem novo deploy; pesaria se o projecto ganhasse mais serviços e alguém para os operar.

**Confiança:** média

## D-OPS02 — Que imagem base Python se usa: Alpine ou slim?

**Temas:** docker-e-deploy · **Regras afectadas:** OPS-004

**Decisão:** Usa a variante `slim` da versão de Python decidida (Grupo 1), com a tag sempre fixa.

**Porquê:** A Alpine obriga a compilar do código-fonte os pacotes sem wheel `musllinux`, o que atrasa o build sem compensar depois em tamanho final, quando já estão instaladas as dependências.


**Contra:** A Alpine parte de uma base mais pequena (cerca de 5 MB) e pode compensar se todas as dependências tiverem wheels `musllinux`; mudaria a decisão se o projecto deixasse de depender de pacotes com extensões C.

**Confiança:** alta

## D-OPS03 — Pastas do host montadas no container: só em desenvolvimento ou também em produção?

**Temas:** docker-e-deploy · **Regras afectadas:** OPS-009

**Decisão:** Bind mounts do host só em desenvolvimento, para o código e o recarregamento automático; em produção, volumes nomeados para os dados persistentes.

**Porquê:** Um bind mount depende da estrutura de pastas da máquina anfitriã e não é portátil; um volume é gerido pelo Docker e não fica preso a um caminho local.


**Contra:** Um bind mount facilita montar certificados ou configuração que já existem, e mudam, fora da imagem; pesaria num deploy que precisasse disso mesmo em produção.

**Confiança:** alta

## D-OPS04 — Como se espera que a base de dados esteja pronta?

**Temas:** docker-e-deploy · **Regras afectadas:** OPS-010

**Decisão:** No Compose, usa `depends_on` com `condition: service_healthy` e um `healthcheck` no serviço da base de dados, em vez de um script de espera externo.

**Porquê:** O Compose só espera o container arrancar, não o serviço ficar pronto para aceitar ligações; a condição de healthcheck confirma isso antes de arrancar o serviço dependente.


**Contra:** Um script de espera (`wait-for`, `netcat`) funciona sem exigir healthcheck e serve fora do Compose, por exemplo no CI; mantém-se necessário nesses casos.

**Confiança:** alta

## D-OPS05 — Em que plataforma se faz o deploy?

**Temas:** docker-e-deploy · **Regras afectadas:** OPS-013

**Decisão:** Um único VPS ou VM com Docker Compose, sem orquestrador, enquanto o projecto for de um só programador.

**Porquê:** Não há equipa, SRE nem orçamento de infra para operar um orquestrador; a OPS-013 já exige justificar qualquer estratégia de deployment antes de a adoptar.


**Contra:** Um PaaS gerido poupa a gestão do sistema operativo; um orquestrador compensaria se o projecto ganhasse mais serviços ou exigências de disponibilidade.

**Confiança:** média

## D-OPS06 — Que motor se usa para LLMs locais?

**Temas:** docker-e-deploy · **Regras afectadas:** OPS-015

**Decisão:** Ollama como motor por omissão para LLMs locais; a OPS-015 já garante trocar de motor só por configuração.

**Porquê:** É o mais maduro dos dois e o ponto de entrada mais comum para LLMs locais; o Docker Model Runner é mais recente e a sua API ainda está em fase alpha/beta.


**Contra:** O Docker Model Runner integra-se melhor num fluxo já assente em Docker Compose e evita instalar mais uma ferramenta; pesaria se a API saísse de beta e o projecto preferisse ficar só no ecossistema Docker.

**Confiança:** baixa

## D-OPS07 — O `docker-compose.yml` declara a propriedade `version`?

**Temas:** docker-e-deploy · **Regras afectadas:** nenhuma

**Decisão:** Não declares a propriedade `version` no `docker-compose.yml`.

**Porquê:** É só informativa: o Compose ignora-a ao escolher o schema e usa sempre o mais recente disponível.


**Contra:** Nenhum. Não há vantagem técnica documentada em declará-la.

**Confiança:** alta
