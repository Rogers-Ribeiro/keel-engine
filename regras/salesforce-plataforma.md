# Regras — Salesforce: plataforma e configuração

Prefixo `SFP`. ## Segurança e modelo de partilha

### SFP-001 — Parte do acesso mais restrito e abre por camadas

**Regra:** define o acesso a partir da base do modelo de partilha (perfil, permission set e org-wide default) no nível mais restrito que serve o caso, e abre depois com hierarquia de papéis, sharing rules e partilha manual; não contes com restringir mais tarde acrescentando camadas por cima.
**Porquê:** os dois cursos descrevem o modelo como uma pirâmide invertida que é mais precisa e mais restritiva na base e só alarga acesso à medida que se sobe; nenhuma camada acima retira o que uma anterior concedeu.
**Como verificar:** na spec de segurança, cada objecto tem um org-wide default declarado (Private, Public Read Only ou Public Read/Write) e as excepções aparecem como sharing rules ou partilha manual, não como tentativas de fechar acesso em camadas superiores.
**Cursos:** 2

### SFP-002 — Atribui perfis personalizados, não perfis standard

**Regra:** clona o perfil standard mais próximo e atribui o clone; o único perfil standard que se atribui a utilizadores é o System Administrator.
**Porquê:** os perfis standard têm limitações e a maior parte das permissões não é editável neles, pelo que servem de modelo e não de destino; o System Administrator é a excepção explícita dos dois cursos.
**Como verificar:** na lista de perfis, todos os perfis com utilizadores atribuídos estão marcados como custom, salvo o System Administrator.
**Cursos:** 2

### SFP-003 — Acesso extra por permission set, não por perfil novo

**Regra:** quando um subconjunto de utilizadores precisa de permissões a mais, cria um permission set e atribui-o; não dupliques um perfil só por causa dessa diferença.
**Porquê:** um utilizador tem um único perfil mas vários permission sets, e multiplicar perfis quase iguais produz orgs com dezenas ou centenas de perfis impossíveis de manter; o permission set também serve acessos temporários, que se retiram tirando a atribuição.
**Como verificar:** no pedido de alteração, a permissão extra aparece como permission set novo ou já existente; um perfil novo tem de vir justificado por definições que só existem ao nível do perfil.
**Cursos:** 2

### SFP-004 — Esconde dados com field-level security, não com o page layout

**Regra:** para impedir que um utilizador veja o valor de um campo, tira-lhe a visibilidade em field-level security; remover o campo do page layout só serve para simplificar o ecrã.
**Porquê:** o campo fora do layout continua acessível por list view, por related list e por relatório a quem tem FLS sobre ele; o professor mostra os três caminhos em cima do mesmo campo.
**Como verificar:** todo o requisito de "esconder" um campo traz uma alteração de FLS por perfil; se o diff só mexe no page layout, a confidencialidade não ficou garantida.
**Cursos:** 1

### SFP-005 — Espera a propagação antes de dar a alteração de acesso por falhada

**Regra:** depois de mudar um org-wide default ou uma sharing rule, espera o email de conclusão do recálculo; depois de mudar field-level security, conta até cerca de 15 minutos antes de concluir que não resultou — e não faças outra alteração entretanto.
**Porquê:** o recálculo de partilha é assíncrono e avisa por email no fim, e o Lightning mantém a visibilidade de campos em cache com prioridade baixa para não degradar o desempenho da org; quem não espera faz alterações a mais a tentar resolver um problema que não existe.
**Como verificar:** o plano de validação de permissões prevê a espera; nos registos de alterações não há duas mudanças seguidas sobre o mesmo acesso em poucos minutos.
**Cursos:** 2

## Modelo de dados e relações

### SFP-006 — Escolhe master-detail só quando o filho depende mesmo do pai

**Regra:** usa master-detail quando o registo filho não pode existir sem o pai e deve herdar a partilha do pai; se a associação é opcional ou a partilha tem de ser independente, usa lookup.
**Porquê:** a master-detail torna o campo obrigatório em todos os registos de detalhe e faz o acesso ao filho depender do registo mestre, com um nível mínimo de acesso ao pai para criar, editar ou apagar filhos; além disso, um objecto personalizado só admite duas master-detail.
**Como verificar:** no desenho do modelo, cada master-detail traz escrito porque é que o filho não existe sem o pai; relações opcionais aparecem como lookup.
**Cursos:** 2

### SFP-007 — Activa "allow reparenting" ao criar uma master-detail

**Regra:** marca a opção de reparenting ao criar a master-detail, salvo instrução explícita em contrário.
**Porquê:** sem ela, um registo filho associado ao pai errado só se corrige apagando o registo e voltando a criá-lo.
**Como verificar:** na definição do campo de master-detail, a opção de reparenting está marcada, ou o requisito diz porque é que o pai tem de ser imutável.
**Cursos:** 1

### SFP-008 — Muitos-para-muitos faz-se com um junction object

**Regra:** modela uma relação muitos-para-muitos com um objecto personalizado no meio, com uma master-detail para cada um dos dois pais, e acrescenta a related list correspondente nos page layouts dos dois mestres.
**Porquê:** são as duas master-detail no objecto do meio que produzem a relação muitos-para-muitos, e é a related list em cada mestre que torna as associações visíveis ao utilizador.
**Como verificar:** o objecto de junção tem exactamente duas master-detail e os dois objectos mestres têm a related list nos layouts.
**Cursos:** 2

### SFP-009 — Não converte o tipo de um campo que já tem dados

**Regra:** para mudar o tipo de um campo personalizado com dados, cria um campo novo do tipo pretendido, migra os valores com o Data Loader e só depois retira o campo antigo; a conversão directa reserva-se a campos vazios.
**Porquê:** a conversão apaga ou trunca valores em muitos pares de tipos — de multi-select picklist para picklist perdem-se as selecções, de texto longo para texto curto trunca-se aos 255 caracteres, e para número ou percentagem o conteúdo desaparece —, e o estrago atinge todos os registos do objecto de uma vez.
**Como verificar:** o diff não traz alterações de tipo em campos com dados; a migração aparece como campo novo mais carregamento, e há exportação feita antes.
**Cursos:** 2

### SFP-010 — O identificador de um sistema externo é um campo unique e external ID

**Regra:** guarda o identificador vindo de um sistema externo num campo de texto marcado ao mesmo tempo como unique (sem duplicados) e como external ID.
**Porquê:** o unique faz a plataforma recusar o segundo registo com o mesmo valor, e o external ID declara o campo como identificador do sistema de origem, que é o que permite ligar os dois lados da integração.
**Como verificar:** todo o campo que guarda uma chave de outro sistema tem as duas marcações; confirma também a decisão de sensibilidade a maiúsculas, porque muda o que conta como duplicado.
**Cursos:** 1

## Gestão de dados

### SFP-011 — Escolhe a ferramenta de carregamento pelo volume e pelo objecto (API a confirmar)

**Regra:** usa o Data Import Wizard só até 50 000 registos e só em account, contact, lead, solution, campaign member e objectos personalizados; acima desse volume ou noutro objecto padrão, usa o Data Loader.
**Porquê:** são os dois limites da ferramenta, e o curso apresenta-os como o critério de decisão — ultrapassá-los não dá um resultado pior, dá um carregamento que não se pode fazer.
**Como verificar:** o plano de carregamento diz o objecto e o volume estimado e escolhe a ferramenta em função dos dois.
**Cursos:** 1

### SFP-012 — Exporta os dados antes de apagar em massa ou de um deploy para produção

**Regra:** antes de um mass delete corre um relatório com os IDs dos registos afectados e guarda-o, e antes de um deploy para produção faz um Data Export com todos os dados; não marques "permanently delete" sem certeza, porque esses registos não passam pela Recycle Bin.
**Porquê:** a Recycle Bin só guarda os registos cerca de 15 dias e não recebe o que é apagado em definitivo; e depois de um deploy é frequente ser preciso actualizar registos antigos para acompanharem a metadata nova, o que se faz a partir desse export.
**Como verificar:** o procedimento da operação destrutiva ou do deploy tem um passo de exportação feito e datado antes da execução.
**Cursos:** 1

## Ambientes e deployment

### SFP-013 — Ensaia primeiro em sandbox e regista o estado anterior

**Regra:** faz as alterações estruturais — tipos de campo, hierarquia de papéis, modelo de dados — primeiro numa sandbox e, antes de mexer, guarda o estado actual (por exemplo, uma cópia da hierarquia de papéis); só depois move para produção.
**Porquê:** as mesmas alterações que em ambiente livre são inofensivas apagam dados ou baralham o acesso numa org com registos e utilizadores, e uma hierarquia com muitos ramos não se reconstitui de memória depois de trocada.
**Como verificar:** o pedido de alteração identifica a sandbox onde foi ensaiado e traz o estado anterior registado.
**Cursos:** 2

### SFP-014 — Change set: upload, validar e só depois deploy

**Regra:** move metadata entre orgs por change set nesta ordem — upload a partir da org de origem, validação na org de destino, deploy — e inclui no change set as definições de perfil dos componentes que levas.
**Porquê:** a validação na org de destino é o que mostra se o conjunto funciona lá antes de o tornar activo; e sem as profile settings dos componentes fica tudo por configurar campo a campo no destino, o que em dezenas de campos personalizados é trabalho perdido.
**Como verificar:** o plano de deployment nomeia os três passos e o change set tem profiles adicionados além dos componentes.
**Cursos:** 1

### SFP-015 — Um deploy não acaba no deploy

**Regra:** depois de cada deploy, passa os objectos personalizados novos de "In Development" para "Deployed" e activa as workflow rules e os processos que vieram no change set.
**Porquê:** a plataforma traz o objecto em desenvolvimento e as automações inactivas de propósito, para nada entrar em produção antes de alguém decidir; o efeito colateral é que se esquece com facilidade e a funcionalidade fica lá sem fazer nada.
**Como verificar:** a lista de tarefas pós-deploy existe e está fechada: estado dos objectos novos e estado activo de cada workflow rule e processo incluídos.
**Cursos:** 1

## Interface e automação

### SFP-016 — Uma acção criada ainda não está visível

**Regra:** depois de criar uma acção, acrescenta-a ao layout onde tem de aparecer — publisher layout para uma global action, page layout do objecto para uma object-specific action — e, no publisher layout, faz o override das acções predefinidas de mobile e Lightning.
**Porquê:** os dois cursos mostram a acção criada a não aparecer em lado nenhum até ser arrastada para o layout, e a secção de mobile e Lightning vem herdada até ser explicitamente substituída.
**Como verificar:** cada acção nova traz no mesmo pedido a alteração do layout que a mostra; validar na interface do utilizador-alvo, não na página de setup da acção.
**Cursos:** 2

### SFP-017 — Esgota o declarativo antes de propor código

**Regra:** antes de propor Apex ou um Lightning Web Component, mostra que o requisito não se resolve com as ferramentas declarativas, e em especial com um flow.
**Porquê:** a esmagadora maioria das tarefas da plataforma faz-se por configuração, e o flow é a ferramenta declarativa de automação por omissão; o código entra quando se atinge um limite conhecido dessas ferramentas.
**Como verificar:** a proposta que traz código nomeia a limitação declarativa concreta que a obriga.
**Cursos:** 1

## B2B Commerce

### SFP-018 — Sem entitlement policy e price book entry activa não há produto na loja (API a confirmar)

**Regra:** cada produto que tem de aparecer na loja leva a sua categoria, a sua commerce entitlement policy e uma entrada activa no price book da loja; a account compradora tem de estar ligada ao buyer group que traz essa entitlement policy.
**Porquê:** a cadeia account → buyer group → entitlement policy → produto é o que decide o que cada cliente vê, e sem entrada de preço activa a página do produto abre sem preço e com o botão de compra desligado.
**Como verificar:** na página do produto, o separador de relacionados mostra categoria, entitlement policy e price book da loja, e a entrada de preço está marcada como activa.
**Cursos:** 1

### SFP-019 — Valida o storefront só depois da indexação de pesquisa (API a confirmar)

**Regra:** depois de mexer em produtos, categorias, entitlements ou de importar catálogo, corre a indexação de pesquisa nas definições da loja e espera que termine antes de concluir seja o que for a partir do storefront.
**Porquê:** o storefront serve-se do índice, não da configuração: nas duas aulas a alteração está correcta e o produto continua invisível até a indexação acabar, o que demora alguns minutos.
**Como verificar:** o procedimento de alteração de catálogo tem o passo de indexação e a validação está datada depois da conclusão dela.
**Cursos:** 1
