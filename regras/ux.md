# Regras — UX e design de produto

Prefixo `UX`. Regras confirmadas nas transcrições a 2026-09-17. Síntese de origem: [ux](https://github.com/Rogers-Ribeiro/keel/blob/main/conhecimento/ux.md). Decisões pendentes: [revisão](_revisao/ux.md).

## Pesquisa e testes com utilizadores

### UX-001 — Plano de teste antes de recrutar

**Regra:** Escreve um plano de teste — escopo, objectivo, horário e local, sessões, equipamento, participantes e cenários — antes de recrutar participantes ou correr a primeira sessão.
**Porquê:** O plano é o que fixa o que vai ser testado, que métricas se recolhem e quantos participantes são precisos; sem ele, a equipa entra no teste sem acordo sobre as perguntas a responder.
**Como verificar:** Existe um documento de plano, datado antes das sessões, com as sete rubricas preenchidas, e os cenários do plano correspondem às tarefas realmente pedidas.
**Fonte:** [UX A-Z §11, aula 121](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/uxdesign-online/transcricoes/121-planejamento.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/uxdesign-online/notas/11-fase-9-da-ux-testes-com-usuarios.md)
**Cursos:** 1

### UX-002 — Participantes do perfil real, equipa interna só no piloto

**Regra:** Recruta participantes com o mesmo perfil dos utilizadores reais do produto; usa a equipa interna apenas no teste piloto, e só se não teve envolvimento no desenho, e não contes os dados do piloto nos resultados.
**Porquê:** Quem desenhou o produto não representa o utilizador, e no piloto o que se testa é o material e o equipamento, não a interface.
**Como verificar:** O plano indica os critérios de triagem dos participantes; o relatório separa o piloto das sessões reais e não usa os dados do piloto nas métricas.
**Fonte:** [UX A-Z §11, aula 123](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/uxdesign-online/transcricoes/123-recrutamento-de-participantes.md) · [UX A-Z §11, aula 120](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/uxdesign-online/transcricoes/120-o-que-e-um-teste-com-usuario.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/uxdesign-online/notas/11-fase-9-da-ux-testes-com-usuarios.md)
**Cursos:** 1

### UX-003 — Priorizar por gravidade e alcance, e registar o que funciona

**Regra:** Classifica cada problema encontrado por gravidade (alta, média, baixa) e por alcance (quantos ecrãs afecta), corrige primeiro os mais graves e mais globais, e regista no relatório também o que já funciona bem e deve ser mantido.
**Porquê:** Raramente se implementam todas as recomendações, por isso a prioridade tem de sair dos dados; um relatório só negativo desmotiva a equipa e esconde o que não se deve mexer.
**Como verificar:** Cada constatação do relatório tem gravidade e alcance atribuídos e está ligada ao que foi observado; existe uma secção com os pontos que funcionam.
**Fonte:** [UX A-Z §11, aula 127](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/uxdesign-online/transcricoes/127-como-fazer-o-relatorio-de-resultados-dos-testes.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/uxdesign-online/notas/11-fase-9-da-ux-testes-com-usuarios.md)
**Cursos:** 1

## Protótipos

### UX-004 — A fidelidade sai da suposição a testar

**Regra:** Escreve primeiro qual é a suposição a testar e só depois escolhe a fidelidade e a ferramenta do protótipo; começa em baixa fidelidade e sobe à medida que as suposições se confirmam.
**Porquê:** Com fidelidade alta demais, o utilizador acredita que o produto está pronto e só comenta polimento; com fidelidade baixa demais, não percebe o contexto e perde-se em generalidades.
**Como verificar:** A spec do protótipo nomeia a suposição a testar e justifica a fidelidade escolhida a partir dela, e não a partir do avanço do projecto.
**Fonte:** [UX A-Z §10, aula 108](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/uxdesign-online/transcricoes/108-niveis-de-fidelidade-de-um-prototipo.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/uxdesign-online/notas/10-fase-8-da-ux-prototipos.md)
**Cursos:** 1

### UX-005 — Conteúdo real em vez de texto de marcação

**Regra:** Põe conteúdo real (rótulos, textos de menu e dados verdadeiros) em qualquer protótipo que vá a teste, incluindo os de baixa fidelidade e os de papel.
**Porquê:** Sem conteúdo real falta contexto ao participante e o teste devolve feedback falso.
**Como verificar:** Nenhum ecrã do protótipo tem texto de marcação (lorem ipsum) nem rótulos de exemplo genéricos.
**Fonte:** [UX A-Z §10, aula 113](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/uxdesign-online/transcricoes/113-prototipos-de-papel.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/uxdesign-online/notas/10-fase-8-da-ux-prototipos.md)
**Cursos:** 1

## Interacção e acessibilidade

### UX-006 — Feedback visível depois de cada acção

**Regra:** Todas as acções do utilizador devolvem um retorno visível — estado de progresso, mensagem ou mudança de estado — enquanto a tarefa não termina.
**Porquê:** Sem retorno, o utilizador não sabe se o comando foi executado e volta a carregar no mesmo botão.
**Como verificar:** No diff, cada acção que dispara trabalho demorado tem um indicador de progresso ou uma mensagem associada, e não fica silenciosa até ao resultado.
**Fonte:** [UX A-Z §9, aula 99](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/uxdesign-online/transcricoes/099-os-6-principios-de-design.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/uxdesign-online/notas/09-fase-7-da-ux-design-de-interacao.md)
**Cursos:** 1

### UX-007 — Desactivar as opções inválidas em vez de deixar errar

**Regra:** Desactiva as opções que não são válidas no momento, em vez de as deixar seleccionáveis e mostrar o erro depois.
**Porquê:** A restrição impede a escolha errada à partida e reduz a hipótese de o utilizador cometer o erro.
**Como verificar:** Nos componentes com estados dependentes do contexto, as opções fora de contexto aparecem desactivadas; não há validações que existam só depois da submissão.
**Fonte:** [UX A-Z §9, aula 99](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/uxdesign-online/transcricoes/099-os-6-principios-de-design.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/uxdesign-online/notas/09-fase-7-da-ux-design-de-interacao.md)
**Cursos:** 1

### UX-008 — Nunca transmitir informação só pela cor

**Regra:** Não uses a cor como único sinal de estado, categoria ou diferença: acrescenta texto, forma, posição ou padrão, e verifica a paleta numa simulação de daltonismo antes de a fixar.
**Porquê:** O daltonismo é comum e afecta directamente o uso da cor para destacar ou distinguir elementos; quem não distingue duas cores perde a informação inteira.
**Como verificar:** Cada elemento colorido da interface ou do gráfico tem um segundo sinal (rótulo, ícone, traço); há registo da verificação da paleta contra uma simulação.
**Fonte:** [UX A-Z §9, aula 101](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/uxdesign-online/transcricoes/101-design-de-interacao-e-acessibilidade.md) · [Cientista §11, aula 70](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/cientista-de-dados/transcricoes/070-consideracoes-sobre-daltonismo.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/uxdesign-online/notas/09-fase-7-da-ux-design-de-interacao.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/cientista-de-dados/notas/11-graficos-visualizacao-e-dashboards.md)
**Cursos:** 2

## Visualização de dados e dashboards

### UX-009 — Posição numa escala comum quando a comparação tem de ser precisa

**Regra:** Quando a comparação entre valores tem de ser precisa, usa gráficos de posição numa escala comum (barras) e não ângulo, área ou volume; guarda o gráfico de sectores para parte de um todo em que a precisão não conta.
**Porquê:** A percepção do cérebro é melhor com posição numa escala comum do que com ângulo ou área — na aula, os mesmos dados que eram impossíveis de ordenar em pizza ficaram imediatos em barras.
**Como verificar:** Nenhum gráfico de sectores ou 3D é usado onde a spec pede ordenação ou comparação de valores.
**Fonte:** [Cientista §11, aula 71](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/cientista-de-dados/transcricoes/071-capacidade-de-percepcao-do-cerebro-humano.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/cientista-de-dados/notas/11-graficos-visualizacao-e-dashboards.md)
**Cursos:** 1

### UX-010 — Um assunto, até 7 a 9 elementos, um ecrã

**Regra:** Cada dashboard trata de um só assunto, tem no máximo 7 a 9 elementos gráficos e cabe num ecrã sem barra de deslocamento; assuntos diferentes vão para dashboards diferentes.
**Porquê:** O cérebro retém poucas informações visuais de uma vez, e misturar assuntos ou obrigar a rolar o ecrã tira ao painel a leitura de conjunto.
**Como verificar:** Contar os elementos gráficos do painel e confirmar que todos pertencem ao assunto anunciado no título; abrir o painel na resolução alvo e confirmar que não há deslocamento.
**Fonte:** [Cientista §11, aula 73](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/cientista-de-dados/transcricoes/073-checklist.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/cientista-de-dados/notas/11-graficos-visualizacao-e-dashboards.md)
**Cursos:** 1

## Interfaces Python para protótipos

### UX-011 — `st.set_page_config` na primeira linha (API a confirmar)

**Regra:** Em Streamlit, chama `st.set_page_config` como primeira instrução do script, antes de qualquer título ou outro elemento de interface.
**Porquê:** Chamada depois de outro elemento, a aplicação devolve erro; na aula, o erro só desapareceu quando a chamada subiu para a primeira linha de código.
**Como verificar:** No diff do ficheiro principal, `st.set_page_config` aparece antes de qualquer outra chamada a `st.`.
**Fonte:** [Eng. IA §58, aula 598](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/formacao-engenheiro-de-ia-generativa-ia-na-pratica/transcricoes/598-estruturando-o-dashboard.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/formacao-engenheiro-de-ia-generativa-ia-na-pratica/notas/58-streamlit-desenvolvendo-um-dashboard-completo.md)
**Cursos:** 1

### UX-012 — Dados, utilitários e gráficos fora do ficheiro da interface

**Regra:** Põe a leitura e a preparação dos dados, as funções utilitárias e a construção de cada gráfico em módulos próprios, e deixa no ficheiro da aplicação apenas a montagem da interface.
**Porquê:** É assim que o projecto se mantém modular à medida que o painel cresce; com tudo no mesmo ficheiro, a manutenção degrada-se.
**Como verificar:** O ficheiro principal só importa e compõe; não contém leitura de ficheiros, transformações nem definições de gráficos.
**Fonte:** [Eng. IA §58, aula 597](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/formacao-engenheiro-de-ia-generativa-ia-na-pratica/transcricoes/597-importando-o-dataset.md) · [Eng. IA §58, aula 600](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/formacao-engenheiro-de-ia-generativa-ia-na-pratica/transcricoes/600-construindo-a-tabela-de-receitas-por-estado.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/formacao-engenheiro-de-ia-generativa-ia-na-pratica/notas/58-streamlit-desenvolvendo-um-dashboard-completo.md)
**Cursos:** 1

### UX-013 — Um DataFrame derivado por gráfico

**Regra:** Para cada gráfico ou métrica, cria um DataFrame derivado com a agregação de que precisa e não alteres o DataFrame original.
**Porquê:** Cada visualização precisa de colunas diferentes; mexer no original quebra os outros insights que dependem das colunas que foram removidas ou agrupadas.
**Como verificar:** No diff, as transformações devolvem novos objectos (`groupby`, `merge`, selecção de colunas) e não há atribuições que substituam o DataFrame carregado.
**Fonte:** [Eng. IA §58, aula 600](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/formacao-engenheiro-de-ia-generativa-ia-na-pratica/transcricoes/600-construindo-a-tabela-de-receitas-por-estado.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/formacao-engenheiro-de-ia-generativa-ia-na-pratica/notas/58-streamlit-desenvolvendo-um-dashboard-completo.md)
**Cursos:** 1

### UX-014 — A exportação reflecte os filtros aplicados (API a confirmar)

**Regra:** Quando a interface oferece descarregar dados, exporta exactamente as linhas e as colunas que o utilizador filtrou no ecrã, e não o conjunto completo.
**Porquê:** O utilizador filtrou para obter aquele recorte; receber o dataset inteiro contraria o que a interface mostra.
**Como verificar:** O argumento de dados do botão de descarga vem do DataFrame já filtrado; um teste manual com filtros activos devolve o ficheiro reduzido.
**Fonte:** [Eng. IA §58, aula 612](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/formacao-engenheiro-de-ia-generativa-ia-na-pratica/transcricoes/612-download-do-arquivo.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/formacao-engenheiro-de-ia-generativa-ia-na-pratica/notas/58-streamlit-desenvolvendo-um-dashboard-completo.md)
**Cursos:** 1

### UX-015 — O output do `gr.Interface` cobre todos os retornos (API a confirmar)

**Regra:** Em `gr.Interface`, escolhe um tipo de output que aceite todos os valores que a função pode devolver; se a função também devolve mensagens de erro, o output é texto e não número.
**Porquê:** Com um output de número, o retorno de texto da mensagem de erro faz a interface falhar.
**Como verificar:** Para cada `gr.Interface` do diff, percorrer os `return` da função e confirmar que todos cabem no tipo declarado.
**Fonte:** [Agentes IA §41, aula 306](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/transcricoes/306-criando-as-primeiras-aplicacoes.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/desenvolvimento-de-agentes-de-ia-do-zero-ao-avancado/notas/41-aplicacoes-interface-grafica-com-gradio.md)
**Cursos:** 1

## Ferramentas que geram interfaces

### UX-016 — Testar o que a ferramenta geradora diz ter implementado

**Regra:** Testa na aplicação a correr cada funcionalidade interactiva que uma ferramenta geradora declara ter implementado, antes de a dar por feita; quando falhar, descreve num novo pedido o comportamento observado e o esperado.
**Porquê:** Na aula, o arrastar e largar de um quadro Kanban foi anunciado como pronto, deixava arrastar mas não mudava o estado do cartão — uma falha que não havia como prever sem experimentar.
**Como verificar:** Antes de aceitar o resultado, existe registo do teste manual (ou de um teste automático) de cada interacção anunciada, e não apenas a leitura do resumo da ferramenta.
**Fonte:** [Claude Code §24, aula 196](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/transcricoes/196-adicionando-interatividade.md) · [nota](https://github.com/Rogers-Ribeiro/keel/blob/main/cursos/formacao-desenvolvedor-ia-com-agentes-claude-code-e-codex/notas/24-introducao-ao-lovable.md)
**Cursos:** 1
