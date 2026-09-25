# Regras — Salesforce: Agentforce e Einstein

Prefixo `SFAI`. ## Segurança do prompt e da resposta

### SFAI-001 — Recuperar os dados no contexto de quem pergunta

**Regra:** executa a recuperação de dados que alimenta o prompt com as permissões do utilizador que fez a pergunta, nunca com as de um utilizador de sistema.
**Porquê:** assim só entra no prompt informação a que esse utilizador já tem acesso, e as regras de acesso a registos e a campos que já existem aplicam-se sem lógica adicional.
**Como verificar:** a função de recuperação recebe a identidade do utilizador e filtra por ela; nenhum caminho de leitura usa credenciais de serviço ou ignora o filtro quando a identidade falta.
**Cursos:** 1

### SFAI-002 — Mascarar os dados sensíveis antes de sair para o modelo

**Regra:** substitui a informação sensível por marcadores antes de enviar o prompt ao modelo, guarda a correspondência entre o valor original e o marcador e repõe os valores originais na resposta que chega.
**Porquê:** o modelo é um sistema externo; o que não precisa de sair não sai, e a correspondência guardada permite devolver a resposta completa ao utilizador.
**Como verificar:** há um passo de mascaramento entre a montagem do prompt e a chamada ao modelo, e um passo simétrico de reposição na resposta; a tabela de correspondência é temporária e não é registada em claro.
**Cursos:** 1

### SFAI-003 — Fechar o prompt com uma instrução de defesa

**Regra:** quando o prompt incorpora texto de utilizadores ou de outros sistemas, acrescenta no fim uma instrução que mande ignorar qualquer instrução vinda desse texto e limitar a resposta ao pedido original.
**Porquê:** a injecção de prompt é texto que entra nos dados a pedir ao modelo outra coisa; a instrução final é o que mantém o resultado dentro do que se pediu.
**Como verificar:** o template termina com a instrução de defesa depois da secção de dados, e não antes dela; um teste envia uma instrução hostil no campo de texto livre e confirma que a resposta não muda de comportamento.
**Cursos:** 1

### SFAI-004 — Tratar a retenção zero como acordo, não como propriedade do modelo

**Regra:** antes de enviar dados de clientes a um fornecedor de modelos, confirma que existe acordo escrito de que o prompt e a resposta são apagados depois de a resposta ser devolvida; sem esse acordo, não envies esses dados.
**Porquê:** a garantia de não retenção vem do contrato com o fornecedor, não da tecnologia: quem não o assinou pode guardar o que recebe, inclusive para treino.
**Como verificar:** cada fornecedor configurado no projecto tem o acordo identificado na documentação de segurança; os fornecedores sem acordo só recebem prompts sem dados de clientes.
**Cursos:** 1

### SFAI-005 — Pontuar a toxicidade antes de mostrar a resposta

**Regra:** passa a resposta do modelo por uma deteção de toxicidade que devolva uma pontuação, e usa essa pontuação na decisão de mostrar, assinalar ou reter a resposta.
**Porquê:** a resposta chega antes de ser vista por alguém; a pontuação é o que permite travar conteúdo nocivo sem depender de o utilizador reparar.
**Como verificar:** o caminho da resposta tem um passo de deteção com pontuação registada, e existe um limiar tratado em código; nenhuma resposta é devolvida sem passar por esse passo.
**Cursos:** 1

### SFAI-006 — Registar cada chamada ao modelo com prazo de retenção definido

**Regra:** guarda, por cada chamada ao modelo, o prompt original, o prompt mascarado, a pontuação de toxicidade, a resposta final e o feedback do utilizador, com um prazo de retenção explícito.
**Porquê:** sem esse registo não se investiga uma resposta errada nem se mede a qualidade e a adopção; o prazo evita que o registo se torne ele próprio um depósito de dados sensíveis.
**Como verificar:** existe um destino de auditoria com estes campos, ligado antes de o agente ser usado, e uma política de expurgo com prazo declarado (30 dias por omissão no Trust Layer).
**Cursos:** 1

## Desenho do agente

### SFAI-007 — Um tópico por categoria concreta de pedido

**Regra:** agrupa as acções do agente em tópicos por categoria concreta de pedido e não mantenhas um tópico genérico a cobrir tudo o resto.
**Porquê:** a escolha é feita em duas fases — primeiro o tópico, depois a acção dentro dele — e um tópico abrangente atrai pedidos que pertenciam a outro, levando o agente a escolher a acção errada.
**Como verificar:** cada tópico tem um nome que diz que pedidos trata e uma lista de acções coerente com ele; nenhum tópico existe só para apanhar o que sobra.
**Cursos:** 1

### SFAI-008 — Testar o agente com pedidos fora do âmbito antes de o publicar

**Regra:** antes de pôr um agente ao alcance de utilizadores, testa-o com pedidos que nenhum tópico cobre e confirma que responde que não sabe, ou pede esclarecimento, em vez de inventar uma resposta ou uma acção.
**Porquê:** é para isso que serve testar antes: quem vai tentar partir o agente a seguir são utilizadores reais, e o comportamento fora do âmbito é onde ele inventa.
**Como verificar:** a bateria de testes inclui pedidos fora do âmbito com a resposta de recusa esperada, e corre antes de cada publicação.
**Cursos:** 1

## Recuperação de dados

### SFAI-009 — Pesquisa híbrida quando a correspondência exacta importa

**Regra:** quando a pesquisa tem de encontrar termos exactos — códigos, nomes de produto, títulos —, combina pesquisa por palavra-chave com pesquisa vectorial em vez de usar só uma delas.
**Porquê:** a pesquisa por palavra-chave falha quando o utilizador usa outras palavras, e a vectorial devolve documentos parecidos mas pode deixar de fora o que tem a correspondência exacta; a combinação traz o exacto primeiro e os semanticamente próximos a seguir.
**Como verificar:** a configuração do retriever declara a estratégia; num caso com termo exacto, o documento que o contém aparece à cabeça dos resultados.
**Cursos:** 1

### SFAI-010 — Um retriever por fonte, combinados quando são várias

**Regra:** usa um retriever por fonte de dados e, quando a resposta tem de vir de várias fontes, combina-os num retriever que corra os individuais e ordene os resultados juntos por relevância — não encadeies pesquisas separadas.
**Porquê:** o que interessa ao modelo é o conteúdo mais relevante do conjunto; resultados ordenados dentro de cada fonte, em separado, não dizem qual é o melhor de todos.
**Como verificar:** cada fonte tem o seu retriever configurado; quando há mais do que uma, existe um único ponto de combinação com ordenação sobre a lista junta.
**Cursos:** 1

## Saída estruturada

### SFAI-011 — Declarar no prompt o formato exacto e o valor por omissão

**Regra:** num prompt que tenha de devolver JSON, escreve no próprio prompt o formato exacto esperado e o valor a usar em cada campo que possa faltar nos dados de origem.
**Porquê:** o que vai ser lido a seguir por código tem de ter forma previsível; sem o valor por omissão, um campo ausente na origem devolve uma resposta que o parsing não aceita.
**Como verificar:** o texto do prompt mostra o objecto JSON pretendido e a regra para os campos em falta; o teste com um documento incompleto devolve JSON que o parsing aceita.
**Cursos:** 1

## Teste do agente

### SFAI-012 — Medir tópico, acções e resposta em separado

**Regra:** ao correr uma bateria de casos contra um agente, mede e lê em separado a percentagem de tópicos certos, de acções certas e de respostas certas; não tomes a de tópicos como medida de qualidade.
**Porquê:** são avaliadas em separado e divergem muito — no curso, uma execução deu 100% de tópicos certos com 14% de acções e de respostas certas, por o agente escolher bem a categoria e mal o que fazer dentro dela.
**Como verificar:** cada caso de teste declara o tópico, as acções pela ordem esperada e a resposta esperada, e o relatório mostra as três percentagens separadas.
**Cursos:** 1
