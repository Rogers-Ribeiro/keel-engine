# Regras — Salesforce: dados e modelação

Prefixo `SFD`. ## Modelação e relações

### SFD-001 — Lookup por omissão, master-detail só para ligação forte

**Regra:** Cria o campo de relação no objecto do lado "muitos" e faz dele um lookup, salvo quando o filho não fizer sentido sem o pai, tiver de herdar a partilha do pai ou tiver de alimentar um roll-up summary — só nesses casos master-detail.
**Porquê:** o lookup liga os dois objectos deixando-os independentes (dono, partilha e eliminação próprios); a master-detail liga-os de forma apertada: apagar o mestre apaga os detalhes e o acesso ao detalhe vem do mestre.
**Como verificar:** no modelo ou na spec, cada campo de relação está declarado no objecto do lado "muitos", e cada master-detail traz escrita a razão (cascata, herança de partilha ou roll-up).
**Cursos:** 2

### SFD-002 — Muitos-para-muitos com objecto de junção

**Regra:** Implementa uma relação muitos-para-muitos com um objecto de junção custom, filho dos dois objectos por duas master-detail.
**Porquê:** a plataforma não liga dois objectos directamente em muitos-para-muitos; com duas master-detail o primeiro mestre controla a visibilidade e a partilha da junção, e apagar qualquer um dos mestres apaga o registo de junção.
**Como verificar:** o objecto de junção existe e tem exactamente dois campos de relação, ambos master-detail, um para cada mestre; não há tentativa de relacionar os dois mestres directamente.
**Cursos:** 2

### SFD-003 — Roll-up summary sobe, fórmula cross-object desce

**Regra:** Para levar valores dos filhos ao pai usa um roll-up summary (que exige master-detail); para trazer valores do pai ao filho usa uma fórmula cross-object. Não escrevas fórmulas à espera de ler registos filhos.
**Porquê:** uma fórmula num objecto lê campos do próprio registo e dos pais, mas nunca dos filhos; agregar os filhos é trabalho exclusivo do roll-up summary.
**Como verificar:** cada campo de fórmula referencia só o próprio objecto ou objectos-pai; qualquer contagem ou soma de registos filhos está implementada como roll-up summary sobre uma master-detail.
**Cursos:** 1

### SFD-004 — Campo com dados não muda de tipo

**Regra:** Quando um campo custom que já tem dados precisa de outro tipo, cria um campo novo com o tipo certo, move os valores com o Data Loader e só depois retira o antigo; faz a operação primeiro numa sandbox.
**Porquê:** converter o tipo de um campo apaga ou trunca os valores de todos os registos (multi-select para picklist, data para data/hora, texto para número, texto longo cortado aos 255), e os campos standard nem sequer admitem mudança de tipo.
**Como verificar:** no diff de metadata não há alteração de tipo num campo com dados em produção; existe em vez disso um campo novo, um passo de migração de valores e a remoção do antigo depois da migração.
**Cursos:** 2

## Qualidade dos dados à entrada

### SFD-005 — Picklist restrita em vez de texto livre

**Regra:** Quando os valores possíveis de um campo são conhecidos e finitos, usa uma picklist com a opção "restricted"; deixa texto livre apenas para entradas longas ou valores únicos.
**Porquê:** a picklist normaliza os valores no momento da entrada e a opção restrita recusa valores fora da lista, o que evita ter de limpar os dados depois.
**Como verificar:** campos de estado, categoria ou tipo estão declarados como picklist e com a restrição activa; não há campos de texto a receber um conjunto fechado de valores.
**Cursos:** 1

### SFD-006 — Duplicados bloqueiam-se, não se alertam

**Regra:** Configura primeiro a matching rule e só depois a duplicate rule que a usa e, quando o objectivo é impedir duplicados numa carga em massa, escolhe a acção de bloqueio em vez de "permitir e alertar".
**Porquê:** a matching rule define o critério de correspondência e a duplicate rule a acção; testado em aula com uma carga de leads, o modo de alerta deixou passar parte dos duplicados, que foram inseridos com sucesso.
**Como verificar:** cada duplicate rule activa aponta para uma matching rule existente, e as regras que cobrem objectos alimentados por integração ou carga estão em modo de bloqueio.
**Cursos:** 2

## Acesso a dados

### SFD-007 — Esconder um campo é Field-Level Security, não page layout

**Regra:** Para impedir que um utilizador veja um campo, tira-lhe o acesso na Field-Level Security; tirar o campo do page layout serve só para simplificar o ecrã.
**Porquê:** o page layout só governa aquela página — o mesmo dado continua acessível por relatório, list view e API; a FLS actua ao nível da org, e entre as duas prevalece sempre a mais restritiva.
**Como verificar:** para cada campo sensível, o perfil ou permission set em causa não tem leitura na FLS; nenhuma spec justifica confidencialidade só com a remoção do campo do layout.
**Cursos:** 3

### SFD-008 — OWD privado nos objectos com dados pessoais

**Regra:** Define o OWD de cada objecto no nível mais restritivo que o negócio permita, e private nos objectos que guardam dados pessoais; a partir daí abre o acesso com hierarquia de papéis, sharing rules, teams ou partilha manual.
**Porquê:** o OWD é o único destes mecanismos que restringe — todos os outros só alargam —, e é o nível de acesso do utilizador mais limitado que deve haver naquele objecto.
**Como verificar:** na configuração de sharing, os objectos com dados pessoais estão a private; cada acesso mais largo está justificado por uma regra explícita e não pelo OWD.
**Cursos:** 2

### SFD-009 — Permission sets em vez de perfis quase iguais

**Regra:** Dá as permissões que variam entre utilizadores por permission sets e permission set groups, deixando no perfil apenas a base comum; não clones um perfil para cada pequena variação de acesso.
**Porquê:** cada utilizador tem um só perfil, o que não escala; permission sets acumulam-se e um grupo junta-os por função, com um muting permission set quando é preciso retirar alguma coisa ao grupo.
**Como verificar:** o número de perfis custom mantém-se pequeno e as diferenças de acesso entre utilizadores aparecem como permission sets atribuídos, não como perfis novos.
**Cursos:** 2

### SFD-010 — Record types não restringem visibilidade

**Regra:** Não uses record types para esconder registos de um utilizador; para restringir mesmo o acesso usa o OWD, a Field-Level Security ou restriction rules.
**Porquê:** a atribuição de record types por perfil só impede a criação de registos daquele tipo — quem já tem acesso ao registo continua a vê-lo.
**Como verificar:** nenhuma spec nem comentário de código apresenta a atribuição de record types como controlo de confidencialidade.
**Cursos:** 1

### SFD-011 — Em Apex, `with sharing` e verificação explícita de CRUD e FLS

**Regra:** Declara `with sharing` nas classes Apex que lêem ou escrevem registos e verifica à parte as permissões de objecto e de campo — com os métodos "is accessible", "is creatable", "is updatable" e "is deletable" do resultado do describe, ou com a cláusula "with security enforced" na query.
**Porquê:** por omissão o Apex corre em modo de sistema e ignora a partilha; `with sharing` repõe o acesso a registos do utilizador mas não impõe nem permissões de objecto nem field-level security.
**Como verificar:** cada classe que faz SOQL ou DML sobre dados de negócio declara `with sharing`, e as operações têm à frente uma verificação de permissão ou a cláusula na query.
**Cursos:** 1

### SFD-012 — SOQL estática com bind variables

**Regra:** Não construas uma query SOQL concatenando input do utilizador numa string: escreve a query estática e passa o valor por bind variable; se a query tiver mesmo de ser dinâmica, passa o input pelo método de escape de plicas.
**Porquê:** com a query montada por concatenação, um valor com plica e parêntesis fecha a cláusula `where` original e devolve registos que o utilizador não devia ver.
**Como verificar:** procura chamadas a query dinâmica no código; cada uma tem de ter o input sanitizado, e as restantes queries usam variáveis ligadas.
**Cursos:** 1

## Grandes volumes e desempenho

### SFD-013 — Filtrar por campo indexado e abaixo do threshold

**Regra:** Sobre objectos com muitos registos, filtra sempre por pelo menos um campo indexado cujo filtro devolva menos registos do que o threshold — 30% do primeiro milhão mais 15% do restante num índice standard, 10% e 5% num índice custom — e não uses "not equal", "not like", "excludes", comparações de texto nem "like" com wildcard à esquerda nesse filtro.
**Porquê:** sem um filtro selectivo a consulta cai em varrimento completo da tabela; um campo indexado não chega se devolver registos acima do threshold, e num filtro composto por "or" todos os filtros simples têm de ser selectivos.
**Como verificar:** cada query sobre um objecto grande tem um filtro por Id, chave externa, data de sistema ou campo marcado como único ou External ID, e a contagem esperada desse filtro cabe no threshold.
**Cursos:** 1

### SFD-014 — Nem 10.000 filhos por pai nem 10.000 registos por dono

**Regra:** Não deixes um registo pai acumular mais de 10.000 filhos nem um utilizador ser dono de mais de 10.000 registos do mesmo objecto; distribui por vários pais ou proprietários.
**Porquê:** gravar um filho bloqueia também o pai, e com milhares de filhos no mesmo pai dois processos em paralelo colidem; um dono com dezenas de milhares de registos torna qualquer mudança de papel ou de grupo num recálculo de partilha demorado.
**Como verificar:** contar os filhos dos maiores pais e os registos dos utilizadores de integração; se algum passar os 10.000, há um plano de distribuição.
**Cursos:** 1

## Carga e migração

### SFD-015 — Data Loader acima dos 50 mil registos

**Regra:** Usa o Data Import Wizard só até 50 mil registos por operação e nos objectos que ele suporta; acima disso, noutro objecto, para apagar registos ou para agendar a operação, usa o Data Loader.
**Porquê:** o Data Import Wizard está limitado a 50 mil registos, a um conjunto curto de objectos standard mais os custom, não apaga e não tem linha de comandos; o Data Loader chega a 5 milhões de registos, cobre qualquer objecto, apaga e agenda pela linha de comandos.
**Como verificar:** no plano de carga, o volume e o objecto estão indicados e a ferramenta escolhida corresponde; operações de eliminação nunca aparecem atribuídas ao assistente.
**Cursos:** 2

### SFD-016 — Exportar antes de qualquer operação em massa

**Regra:** Exporta os registos afectados imediatamente antes de um update, upsert ou delete em massa, e usa esse ficheiro como base do ficheiro de carga.
**Porquê:** o export é a cópia de segurança a que se volta quando a operação corre mal e, por vir do próprio Salesforce, traz os IDs e os nomes de API das colunas já alinhados com os campos, o que faz o mapeamento automático acertar.
**Como verificar:** o plano da operação tem um passo de export datado antes do passo de carga, e a contagem de registos do ficheiro de carga bate certo com a do export.
**Cursos:** 1

### SFD-017 — "Insert null values" fica desmarcado

**Regra:** Mantém a opção "insert null values" do Data Loader desmarcada, e liga-a apenas quando o objectivo da operação for mesmo esvaziar um campo em massa.
**Porquê:** com a opção ligada, cada célula vazia do CSV apaga o valor que existe no registo — uma coluna em branco por distracção limpa o campo em todos os registos carregados.
**Como verificar:** na configuração usada para a carga, a opção está desmarcada; se estiver ligada, o plano diz que campos vão ser esvaziados.
**Cursos:** 2

### SFD-018 — External ID próprio para o upsert de uma integração

**Regra:** Numa integração com um sistema externo, cria no objecto um campo de texto marcado como único e External ID para guardar o identificador desse sistema, e faz upsert por esse campo em vez do Salesforce ID.
**Porquê:** o sistema de origem não conhece o Salesforce ID; com o External ID, a mesma carga actualiza os registos que já existem e insere os que ainda não existem, e o casamento é feito por um identificador que a origem controla.
**Como verificar:** o objecto tem o campo External ID único; a operação da integração é upsert e aponta para esse campo, não para o Id.
**Cursos:** 1

### SFD-019 — Automação desligada durante a janela de carga

**Regra:** Antes de uma carga grande, desliga os flows, triggers e validation rules que não sejam necessários aos registos carregados, e volta a ligá-los no fim da janela.
**Porquê:** toda a automação dispara em cada insert e cada update e multiplica o tempo da carga; as validation rules também se aplicam às cargas por API e bloqueiam os registos que não passam nelas.
**Como verificar:** o plano de migração lista o que é desactivado, quem o desactiva e o passo de reactivação; depois da janela, nenhuma regra fica desligada.
**Cursos:** 2
