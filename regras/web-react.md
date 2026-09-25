# Regras — web-react

Prefixo `RCT`. As secções a partir de «Tailwind 4» são a excepção: não saem de curso nenhum — nenhum ensina esta parte do stack — e saem das referências confirmadas em `../docs/`.

## Fronteira entre cliente e servidor

### RCT-001 — Nada de base de dados nem credenciais em código do browser

**Regra:** não abras ligação a uma base de dados nem coloques credenciais de acesso a dados em código que corre no browser; o cliente fala com o servidor por endpoints declarados, e é o código de servidor que toca na base de dados.
**Porquê:** todo o código que corre no browser é visível para quem visita o site, por isso credenciais embutidas nele ficam expostas e a base de dados pode ser comprometida; o servidor também é o único sítio onde existe acesso ao sistema de ficheiros partilhado.
**Como verificar:** nenhum ficheiro de cliente importa um driver ou cliente de base de dados nem lê uma variável de ambiente com credenciais; a spec diz por que endpoint o cliente obtém cada dado.
**Cursos:** 2

### RCT-002 — `"use client"` no ficheiro mais fundo que precisa dele

**Regra:** deixa os componentes como Server Components e põe `"use client"` apenas no ficheiro mais pequeno e mais fundo da árvore que precise mesmo de estado, efeitos, event handlers ou hooks de cliente; se só um detalhe precisa disso, extrai-o para um componente próprio em vez de converter o pai inteiro.
**Porquê:** um Server Component não é descarregado para o browser; converter um componente grande por causa de um detalhe envia JavaScript desnecessário e perde as vantagens do servidor no resto da marcação.
**Como verificar:** cada ficheiro com `"use client"` justifica-se por uma funcionalidade de cliente usada nele; num componente com muita marcação estática, a parte interactiva está num ficheiro à parte.
**Cursos:** 1

### RCT-003 — Server Actions num ficheiro próprio com `"use server"` no topo

**Regra:** define as Server Actions num ficheiro dedicado com um único `"use server"` na primeira linha e exporta-as de lá; nunca declares uma Server Action num ficheiro marcado com `"use client"`.
**Porquê:** o build não consegue separar de forma limpa código de servidor e de cliente no mesmo ficheiro, o que pode fazer código de servidor chegar ao cliente e criar problemas de segurança; com a acção num ficheiro próprio, qualquer componente — incluindo um Client Component — a pode importar.
**Como verificar:** as acções vivem numa pasta ou ficheiro próprio; nenhum ficheiro tem ao mesmo tempo `"use client"` no topo e uma função marcada como acção de servidor.
**Cursos:** 2

### RCT-004 — Leitura de dados no corpo de um componente de servidor `async`

**Regra:** num componente que corre no servidor, marca a função como `async` e lê os dados com `await` no corpo; não introduzas estado nem efeito para carregar dados que o servidor já consegue obter antes de renderizar.
**Porquê:** o componente só executa no servidor, por isso pode esperar pelos dados e devolver marcação já preenchida — dispensa o par estado/efeito e a biblioteca de gestão de dados que seriam precisos no cliente.
**Como verificar:** o componente de página não tem estado nem efeito só para carregar dados; o carregamento é uma chamada `await` no corpo da função.
**Cursos:** 2

### RCT-005 — Sem servidor intermédio quando a aplicação é dona dos dados

**Regra:** quando a fonte de dados pertence ao mesmo projecto, acede-lhe directamente a partir do código de servidor; não montes um serviço HTTP separado cuja única função é reencaminhar o pedido para essa fonte.
**Porquê:** o professor pergunta explicitamente por que razão se dividiria a aplicação em dois servidores quando se é dono dos dois: o serviço intermédio só acrescenta uma volta pela rede, e o acesso directo é seguro porque esse código nunca corre no cliente.
**Como verificar:** o desenho justifica cada serviço intermédio com um consumidor que não é esta aplicação; não há chamadas de rede do projecto para si próprio.
**Cursos:** 1

## Navegação e rotas

### RCT-006 — Navegação interna pelo componente `Link`

**Regra:** para ligar a uma página do próprio site, usa o componente `Link` (de `next/link`, ou o do router do lado do cliente) e não um `<a>`; o `<a>` fica para endereços externos.
**Porquê:** um `<a>` força o browser a descarregar uma página nova e tira a aplicação do modo de página única; o `Link` mantém a navegação do lado do cliente e continua a aceitar `href`, `className` e as restantes props.
**Como verificar:** procura `<a href="/` no diff — qualquer ocorrência com um caminho interno é um erro.
**Cursos:** 2

### RCT-007 — Registo inexistente chama `notFound()`

**Regra:** depois de procurar um registo por identificador, verifica se ele existe e chama `notFound()` (de `next/navigation`) quando não existe; não deixes o código seguir e rebentar ao ler uma propriedade de um valor indefinido.
**Porquê:** não encontrar um registo não é um erro técnico, e a página de erro genérica dá ao utilizador uma mensagem enganadora; `notFound()` interrompe o componente e mostra a página de "não encontrado" mais próxima.
**Como verificar:** cada leitura por identificador é seguida de uma verificação de existência; a mensagem mostrada refere o recurso concreto que faltou.
**Cursos:** 2

## Formulários, acções e validação

### RCT-008 — Validação do lado do servidor mesmo com validação de cliente

**Regra:** valida no servidor todos os campos recebidos de um formulário, mesmo quando o formulário já tem `required` ou outra validação de browser.
**Porquê:** o professor demonstra a remover o atributo `required` pelas DevTools e a submeter na mesma: a validação do cliente é conveniência para o utilizador e não impede um pedido com dados inválidos.
**Como verificar:** para cada campo com validação no formulário existe a verificação correspondente no código que recebe os dados; um campo validado só no cliente é uma falha.
**Cursos:** 1

### RCT-009 — A acção de um formulário devolve estado, não lança

**Regra:** numa acção ligada a um formulário, apanha as falhas esperadas — validação, restrições da base de dados, ligação em baixo — e devolve um objecto com exactamente a mesma forma do estado inicial passado a `useActionState`; não deixes a acção lançar um erro para sinalizar uma falha esperada.
**Porquê:** um erro lançado sobe para a página de erro, substitui a página inteira e apaga o que o utilizador já tinha escrito; devolver um valor deixa-o na página, com o formulário preenchido e a mensagem ao lado.
**Como verificar:** o tipo do estado inicial, o do primeiro parâmetro da acção e o do valor devolvido são o mesmo; nenhum caminho de falha esperada termina em `throw`.
**Fonte:** [referência](../docs/react-19.md)
**Cursos:** 2

### RCT-010 — Validação por schema, com os erros agrupados por campo

**Regra:** descreve as regras de cada campo num schema (`z.object` do Zod, nos cursos), valida com `safeParse` e, quando falha, converte os erros com `error.flatten().fieldErrors` para os mapear ao campo que os originou.
**Porquê:** a lista crua de erros de validação é difícil de percorrer para decidir o que mostrar em cada campo; a forma achatada dá um objecto com uma chave por campo e um array de mensagens, e os campos válidos nem aparecem.
**Como verificar:** o schema está fora da acção e é reutilizado; a acção testa o resultado antes de ler os dados validados, e a resposta de erro tem uma chave por campo.
**Cursos:** 1

### RCT-011 — `useFormStatus` só num componente filho do formulário

**Regra:** lê o estado de submissão com `useFormStatus` num componente extraído à parte, renderizado dentro do `<form>` — tipicamente o botão de submissão — e nunca no componente que declara o formulário.
**Porquê:** o hook só vê o formulário que está acima dele na árvore, por isso no componente do próprio formulário devolve sempre vazio; extrair o botão também evita converter a página inteira em componente de cliente.
**Como verificar:** o ficheiro que chama `useFormStatus` não contém o elemento `<form>`; o botão usa `pending` para o texto e para desactivar a submissão.
**Cursos:** 2

### RCT-012 — `redirect()` sempre fora de um `try/catch`

**Regra:** chama `redirect()` depois de fechado o bloco `try/catch`, nunca lá dentro.
**Porquê:** `redirect()` funciona a lançar um erro especial que a framework reconhece como navegação; dentro de um `try`, o `catch` intercepta-o, trata-o como falha e a navegação nunca acontece.
**Como verificar:** no diff, nenhuma chamada a `redirect()` está indentada dentro de um `try`; o redireccionamento é a última instrução do caminho de sucesso.
**Cursos:** 1

## Cache e frescura

### RCT-013 — Revalidar o caminho afectado na mesma acção que altera os dados

**Regra:** dentro da acção que cria, altera ou apaga um registo, chama `revalidatePath` (de `next/cache`) para cada rota cujo conteúdo deixou de estar correcto; não desligues a cache da página para resolver dados desactualizados.
**Porquê:** desligar a cache faz a página voltar à base de dados em todos os pedidos e perde a vantagem de servir conteúdo pré-renderizado; revalidar sob pedido mantém a página rápida e obriga a re-renderizar só depois da alteração que a invalida.
**Como verificar:** cada acção de escrita enumera os caminhos que revalida, e a spec diz por que razão cada um deles mostra os dados alterados; uma acção de escrita sem revalidação vem justificada.
**Cursos:** 1

### RCT-014 — Comportamento de cache testa-se com o build de produção

**Regra:** testa qualquer funcionalidade que dependa de cache com `npm run build` seguido de `npm run start`, e não no servidor de desenvolvimento.
**Porquê:** o servidor de desenvolvimento volta a executar tudo a cada pedido, por isso não mostra a cache de rota; o professor demonstra um registo criado que desaparece ao recarregar assim que a aplicação corre em modo de produção.
**Como verificar:** a descrição do teste diz explicitamente que correu sobre o build de produção; um relato de "funciona em dev" não conta como verificação de cache.
**Cursos:** 1

### RCT-015 — Leituras repetidas no mesmo pedido deduplicam-se com `cache`

**Regra:** envolve com `cache`, importado de `react`, qualquer função de leitura que vários componentes possam chamar com os mesmos argumentos durante o mesmo pedido; não passes a lista inteira por props em todos os níveis só para evitar a consulta repetida.
**Porquê:** com a função memoizada, chamadas idênticas dentro do mesmo pedido executam a consulta uma só vez e partilham o resultado, o que remove as consultas duplicadas sem acoplar os componentes intermédios aos dados de que não precisam.
**Como verificar:** as funções de consulta partilhadas estão declaradas envolvidas em `cache`; o registo de consultas de um pedido não mostra a mesma consulta repetida.
**Cursos:** 1

## Carregamento progressivo

### RCT-016 — `Suspense` à volta da subárvore lenta, não da página

**Regra:** extrai para um componente próprio a parte que espera por dados lentos e envolve-a em `<Suspense fallback={...}>`; não faças a página inteira esperar por ela nem confies só no ficheiro de carregamento da rota.
**Porquê:** com a fronteira granular, tudo o resto é enviado de imediato e só a região lenta mostra o seu substituto; fronteiras independentes não esperam umas pelas outras, e o carregamento da rota inteira nem chega a aparecer quando a página já está no ecrã e só muda um filtro.
**Como verificar:** cada `Suspense` envolve um componente que faz uma leitura de dados e tem um `fallback` próprio; uma página com várias regiões lentas tem várias fronteiras.
**Cursos:** 2

## Autenticação e segurança

### RCT-017 — Sessão verificada no servidor em cada rota ou acção protegida

**Regra:** em cada rota ou acção que execute uma operação restrita, obtém a sessão no servidor e interrompe antes de qualquer outro trabalho quando ela não existe; esconder ou desactivar elementos da interface não conta como protecção.
**Porquê:** o pedido pode chegar sem passar pela interface, e o professor demonstra-o a apagar o cookie de sessão pelas DevTools; a verificação tem de ser a primeira coisa que corre, antes de ler dados ou renderizar a página.
**Como verificar:** a verificação da sessão é a primeira instrução da rota ou da acção; a identidade usada a seguir vem do objecto de sessão e nunca de um campo enviado no pedido.
**Cursos:** 2

### RCT-018 — Palavras-passe guardam-se só em forma de hash

**Regra:** aplica uma função de hash à palavra-passe antes de a guardar e, no início de sessão, compara o que o utilizador escreveu com o valor guardado através da função de comparação da mesma biblioteca; nunca guardes a palavra-passe em texto simples nem a tentes reconstruir.
**Porquê:** o hash não é reversível, por isso um acesso indevido à base de dados não devolve as palavras-passe; a verificação faz-se a voltar a aplicar o hash ao valor introduzido e a comparar os dois.
**Como verificar:** no código de registo, o valor escrito na base de dados é o resultado da função de hash; não existe nenhuma comparação directa entre a palavra-passe recebida e o campo guardado.
**Cursos:** 1

## Estado

### RCT-019 — Estado que depende do anterior actualiza-se com a forma funcional

**Regra:** quando o novo valor depende do valor actual, passa uma função ao setter (`setX(prev => …)`) em vez de ler a variável de estado directamente.
**Porquê:** as actualizações são agendadas, não imediatas: duas chamadas seguidas no mesmo manipulador partem ambas do valor antigo e a segunda anula a primeira. A forma funcional garante que cada actualização recebe o valor mais recente no momento em que é executada.
**Como verificar:** procura no diff setters cujo argumento leia a própria variável de estado — é sempre um erro; a forma funcional aplica-se também dentro de objectos com várias chaves.
**Cursos:** 1

### RCT-020 — Objectos e arrays em estado actualizam-se por cópia

**Regra:** para alterar um objecto ou array guardado em estado, cria primeiro uma cópia (spread, `map`, `filter`) e altera a cópia; não escrevas no valor original, e nas estruturas aninhadas copia também cada nível que vais tocar.
**Porquê:** objectos e arrays são referências: escrever no original altera o valor em memória antes de a actualização agendada correr, o que produz bugs difíceis de reproduzir quando há mais do que um sítio a agendar actualizações do mesmo estado.
**Como verificar:** nenhuma atribuição a um índice ou propriedade do valor devolvido pelo estado; as estruturas aninhadas são copiadas nível a nível antes da alteração.
**Cursos:** 1

### RCT-021 — Valor que se pode derivar não vira estado

**Regra:** antes de criar um estado novo, verifica se o valor pode ser calculado a partir de estado já existente; se puder, calcula-o a cada render numa função auxiliar definida fora do componente e não guardes uma segunda cópia.
**Porquê:** o professor formula-o como objectivo geral — gerir o mínimo de estado possível e derivar o resto — porque duas cópias da mesma informação têm de ser sincronizadas à mão e acabam por divergir; o estado que já existe é suficiente para desencadear a actualização do ecrã.
**Como verificar:** para cada `useState` no diff, a spec ou o comentário diz por que razão o valor não é derivável; dois estados que mudam sempre juntos são um sinal de duplicação.
**Cursos:** 1

### RCT-022 — Estado partilhado sobe ao ancestral comum mais próximo

**Regra:** quando dois componentes precisam da mesma informação, coloca o estado no ancestral comum mais próximo dos dois, passa-o para baixo por props e recebe as alterações por uma função passada também como prop; não tentes ler o estado de um componente irmão.
**Porquê:** o ancestral comum é o único ponto que alcança ambos os ramos por props, e é a partir dele que a mesma informação chega coerente aos dois; subir mais do que isso espalha props por componentes que não as usam.
**Como verificar:** o estado está no componente mais baixo que contém todos os consumidores; se só um ramo o usa, desce.
**Cursos:** 1

### RCT-023 — `key` de lista vem dos dados, não do índice

**Regra:** dá a cada item de uma lista dinâmica uma `key` vinda de um identificador dos próprios dados; não uses o índice quando a lista recebe inserções, remoções ou reordenações, e nunca uses um valor repetido só para calar o aviso.
**Porquê:** o estado interno de um item é associado ao tipo do componente e à sua posição; com o índice como `key`, inserir um item no início faz o estado ficar agarrado à posição e saltar para o item errado. Uma `key` ligada ao registo mantém o estado com o item.
**Como verificar:** procura `key={index}` no diff; se os dados não trouxerem identificador, ele é gerado no momento em que o item é criado, não a cada render.
**Cursos:** 1

### RCT-024 — Reiniciar estado interno mudando a `key`

**Regra:** para reiniciar o estado interno de um componente quando o contexto muda, muda o valor da `key` desse componente em vez de escrever um efeito que sincronize o estado com a prop nova.
**Porquê:** ao mudar a `key`, o React destrói a instância antiga e cria uma nova, o que reinicia estado, temporizadores e intervalos de uma vez; o efeito de sincronização faz o mesmo com mais código e mais caminhos por onde falhar.
**Como verificar:** um efeito cuja única função é repor estado quando uma prop muda é candidato a ser substituído por uma `key`; a `key` aponta para o valor que identifica o contexto (por exemplo, o índice do item activo).
**Cursos:** 1

## Efeitos e desempenho

### RCT-025 — As dependências de um efeito são as props e o estado que ele usa

**Regra:** dá sempre um array de dependências ao efeito e lista lá todas as props e todos os valores de estado usados dentro dele; refs e APIs globais do browser não entram.
**Porquê:** a dependência existe para o efeito voltar a correr quando algo que ele lê muda; uma prop em falta no array deixa o efeito preso ao valor do primeiro render e a funcionalidade simplesmente não reage. Só entram valores que fazem a função do componente executar outra vez.
**Como verificar:** compara a lista de dependências com os identificadores usados dentro do efeito — cada prop ou estado lá dentro tem de aparecer no array.
**Cursos:** 1

### RCT-026 — Efeito que cria temporizador devolve função de limpeza

**Regra:** um efeito que arranca um temporizador, um intervalo ou uma subscrição devolve uma função que o cancela.
**Porquê:** a função de limpeza corre antes de o efeito repetir e quando o componente sai do ecrã; sem ela, cada execução deixa o temporizador anterior a correr e eles acumulam-se — o professor mostra a barra de progresso a esvaziar-se ao dobro da velocidade porque havia dois intervalos activos.
**Como verificar:** cada efeito que chama um agendador tem `return` com o cancelamento correspondente; o modo estrito em desenvolvimento expõe o problema ao executar o efeito duas vezes.
**Cursos:** 1

### RCT-027 — Pedidos nunca no corpo da função do componente

**Regra:** não dispares um pedido de rede — nem qualquer código que actualize estado a partir da resposta — directamente no corpo da função de um componente de cliente; coloca-o num efeito com dependências, ou num manipulador de evento.
**Porquê:** o corpo do componente corre a cada render: o pedido actualiza o estado, o estado provoca novo render, o novo render dispara outro pedido, e fica em ciclo infinito.
**Como verificar:** no diff, qualquer chamada de rede fora de um efeito, de um manipulador ou de um componente de servidor `async` é um erro; um efeito sem array de dependências que actualize estado tem o mesmo problema.
**Cursos:** 1

### RCT-028 — `memo` só onde evita execuções, e o mais acima possível

**Regra:** não envolvas componentes em `memo` por rotina; aplica-o apenas onde a comparação de props evita mesmo re-execuções, e no ponto mais alto da árvore onde isso acontece.
**Porquê:** `memo` faz o React comparar as props antes de cada execução, e essa comparação também custa; num componente cujas props mudam quase sempre, paga-se o custo para obter o mesmo resultado que sem ele. Colocado no topo do ramo, evita de uma vez a execução de todos os componentes aninhados.
**Como verificar:** cada uso de `memo` vem acompanhado da razão pela qual as props daquele componente se mantêm estáveis; `memo` aplicado a um componente que recebe funções ou objectos criados a cada render não evita nada.
**Cursos:** 1

## Dados remotos e tipos

### RCT-029 — Pedido no cliente trata dados, carregamento e erro em todos os caminhos

**Regra:** ao ir buscar dados a partir do cliente, gere três estados separados — dados, carregamento e erro —, verifica `response.ok` e lança quando for falso, envolve tudo em `try/catch` e termina o estado de carregamento fora do `try`, para ele acabar também quando há erro.
**Porquê:** uma resposta 4xx ou 5xx não rejeita a promessa, por isso sem a verificação o código segue como se tudo tivesse corrido bem; e se o fim do carregamento ficar dentro do `try`, uma falha antes dele deixa a interface presa em "a carregar" para sempre.
**Como verificar:** o bloco de leitura tem os três estados, a verificação da resposta e o fim do carregamento fora do `try`; o caminho de erro actualiza a interface com uma mensagem.
**Cursos:** 1

### RCT-030 — Argumentos e tipo de retorno anotados em cada função TypeScript

**Regra:** anota o tipo de cada argumento e também o tipo de retorno de cada função, mesmo quando a inferência já o resolveria.
**Porquê:** os argumentos não são inferidos e ficam com tipo livre, que desliga a verificação; e é a anotação de retorno que faz o compilador ler o corpo da função e apanhar um `return` em falta ou de tipo errado — sem ela, uma função sem `return` passa despercebida porque o compilador assume que era essa a intenção.
**Como verificar:** no diff, procura funções exportadas sem anotação de retorno; cada parâmetro tem tipo declarado.
**Cursos:** 1

## Tailwind 4

Nenhum curso da base ensina o Tailwind 4; o que ensinam é o v3, e o v4 mudou o modelo de
configuração e a escala de vários utilitários. Estas regras saem da referência
[tailwind-4](../docs/tailwind-4.md).

### RCT-031 — A configuração do Tailwind vive no CSS, não num ficheiro JavaScript

**Regra:** o CSS principal começa com `@import "tailwindcss";` e o tema declara-se em `@theme`. Se ainda existir um `tailwind.config.js`, tem de ser carregado explicitamente com `@config "..."`.
**Porquê:** no v4 o ficheiro de configuração deixou de ser detectado sozinho. Um projecto migrado fica com o ficheiro lá, ninguém o lê, e as cores, tipos de letra e breakpoints personalizados desaparecem — sem erro nenhum, só com o aspecto errado.
**Como verificar:** se existir `tailwind.config.*` no repositório, procura `@config` nos ficheiros CSS; sem ele, o ficheiro é código morto. E o CSS principal tem `@import "tailwindcss"`, não `@tailwind base`.
**Fonte:** [tailwind-4](../docs/tailwind-4.md)
**Cursos:** 0

### RCT-032 — Classes que o v4 removeu ou renomeou não ficam no código

**Regra:** `bg-gradient-to-*` passa a `bg-linear-to-*`, `outline-none` a `outline-hidden`, `flex-shrink-*` e `flex-grow-*` a `shrink-*` e `grow-*`, e as classes de opacidade dão lugar ao modificador (`bg-black/50`).
**Porquê:** são renomeações e remoções, não sinónimos: a classe antiga deixa de produzir CSS e o estilo desaparece em silêncio.
**Como verificar:** procura no código de componentes por `bg-gradient-to-`, `outline-none`, `flex-shrink-`, `flex-grow-`, `bg-opacity-`, `text-opacity-`, `border-opacity-` e `overflow-ellipsis`; qualquer ocorrência é um defeito.
**Fonte:** [tailwind-4](../docs/tailwind-4.md)
**Cursos:** 0

### RCT-033 — A migração do v3 corre-se com a ferramenta, não à mão

**Regra:** `npx @tailwindcss/upgrade` num ramo próprio, e lê-se o diff antes de juntar.
**Porquê:** `shadow`, `rounded`, `blur` e `drop-shadow` mudaram de escala, e o nome antigo continua a existir a significar outra coisa — `shadow-sm` do v3 é `shadow-xs` no v4. Compila, não avisa, e dá outro desenho. É a classe de erro que uma revisão humana não apanha, porque nada parece errado.
**Como verificar:** no diff da migração, cada `shadow`, `rounded`, `blur` e `drop-shadow` ou foi tocado pela ferramenta ou tem justificação escrita.
**Fonte:** [tailwind-4](../docs/tailwind-4.md)
**Cursos:** 0

### RCT-034 — Quem migra decide explicitamente sobre a cor da borda e do ring

**Regra:** no v4, `border-*`, `divide-*` e `ring` passam a `currentColor` e o `ring` passa de 3px a 1px. Ou se repõe o comportamento antigo em `@layer base` e `@theme`, ou se aceita o novo por decisão escrita.
**Porquê:** uma borda que era cinzenta passa a ter a cor do texto, num projecto inteiro de uma vez. Sem decisão, o que acontece é que ninguém repara até alguém perguntar porque é que a aplicação está diferente.
**Como verificar:** o CSS principal define `border-color` em `@layer base`, ou define `--default-ring-width` e `--default-ring-color` em `@theme`, ou existe uma decisão registada de aceitar os valores novos.
**Fonte:** [tailwind-4](../docs/tailwind-4.md)
**Cursos:** 0

### RCT-035 — `@apply` fora do CSS principal precisa de `@reference`

**Regra:** num CSS Module ou num bloco de estilo de componente, o `@apply` só funciona com `@reference "..."` a apontar ao CSS principal — ou usa-se a variável CSS directamente.
**Porquê:** esses ficheiros são compilados à parte e não vêem o tema; o `@apply` falha ou não produz nada.
**Como verificar:** cada ficheiro com `@apply` que não seja o CSS principal tem `@reference` no topo.
**Fonte:** [tailwind-4](../docs/tailwind-4.md)
**Cursos:** 0

## Estado com Zustand

Nenhum curso da base ensina Zustand; o que ensinam é Redux, que é outro modelo. Estas regras saem
da referência [zustand](../docs/zustand.md).

### RCT-036 — Um componente selecciona da loja o que usa, nunca a loja inteira

**Regra:** uma chamada por campo, com selector: `useLoja((s) => s.campo)`. Nunca o hook sem argumento.
**Porquê:** sem selector o componente subscreve a loja toda e volta a renderizar a cada alteração de qualquer campo, incluindo os que não lê. É a causa número um de uma aplicação com Zustand ficar lenta sem razão aparente.
**Como verificar:** procura chamadas ao hook da loja sem argumento nenhum; cada uma é um defeito.
**Fonte:** [zustand](../docs/zustand.md)
**Cursos:** 0

### RCT-037 — Um selector que constrói objecto ou array leva `useShallow`

**Regra:** envolve o selector em `useShallow`, importado de `zustand/react/shallow`.
**Porquê:** o objecto é novo a cada render e a comparação por igualdade estrita nunca dá verdadeiro. O componente renderiza sem parar e pode entrar em ciclo infinito de actualização.
**Como verificar:** cada selector cujo corpo abre chaveta ou parêntesis recto — isto é, que devolve objecto ou array construído ali — aparece dentro de `useShallow`.
**Fonte:** [zustand](../docs/zustand.md)
**Cursos:** 0

### RCT-038 — Estado aninhado actualiza-se por cópia explícita ou com `immer`

**Regra:** o `set` funde só o primeiro nível. Abaixo disso, espalha-se à mão ou usa-se o middleware `immer`, de `zustand/middleware/immer`.
**Porquê:** quem espera que o `set` funda em profundidade escreve um campo e apaga os irmãos dele sem dar por isso — a partir do segundo nível o objecto passado substitui o anterior.
**Como verificar:** cada `set` que devolve um objecto com outro objecto lá dentro ou espalha o nível de baixo, ou a loja usa `immer`.
**Fonte:** [zustand](../docs/zustand.md)
**Cursos:** 0

### RCT-039 — A loja tipa-se com os parênteses vazios no meio

**Regra:** `create<Estado>()(devtools(persist(...)))` — os parênteses vazios entre o tipo e o argumento são obrigatórios.
**Porquê:** sem eles a inferência quebra assim que entra um middleware, e o estado passa a ser tipado como aquilo que o último middleware devolve. Compila na mesma, e o tipo deixa de proteger.
**Como verificar:** cada `create` com parâmetro de tipo é seguido de `()(`, não de `(`.
**Fonte:** [zustand](../docs/zustand.md)
**Cursos:** 0

### RCT-040 — `getState()` não lê estado que o ecrã tem de reflectir

**Regra:** `getState()` é para código que não é componente. Dentro de um componente, o que o ecrã mostra lê-se pelo hook.
**Porquê:** o `getState()` não subscreve nada: o valor é lido uma vez e o componente nunca volta a renderizar quando ele muda. O ecrã fica desactualizado e não há erro em lado nenhum.
**Como verificar:** procura `getState()` dentro de corpos de componente e de hooks próprios; fora de uma acção ou de um handler de evento, é um defeito.
**Fonte:** [zustand](../docs/zustand.md)
**Cursos:** 0

## Routing com TanStack Router

Nenhum curso da base ensina TanStack Router; o que ensinam é React Router. Estas regras saem da
referência [tanstack-router](../docs/tanstack-router.md).

### RCT-041 — O caminho do `createFileRoute` não se edita à mão

**Regra:** a string passada ao `createFileRoute` é escrita e mantida pelo plugin. Mover ou renomear o ficheiro actualiza-a sozinha.
**Porquê:** editá-la cria uma divergência entre o ficheiro e a árvore gerada que a geração seguinte desfaz — e entretanto os tipos mentem sobre que rota é aquela.
**Como verificar:** depois de correr a geração, `git diff` nos ficheiros de rota vem vazio.
**Fonte:** [tanstack-router](../docs/tanstack-router.md)
**Cursos:** 0

### RCT-042 — O `routeTree.gen.ts` é versionado

**Regra:** o ficheiro é gerado, mas entra no git.
**Porquê:** faz parte do runtime da aplicação. Sem ele, quem clonar o repositório não consegue construir o projecto até correr a geração — e nada lho diz.
**Como verificar:** o ficheiro está no índice do git e não é apanhado pelo `.gitignore`.
**Fonte:** [tanstack-router](../docs/tanstack-router.md)
**Cursos:** 0

### RCT-043 — Os search params validam-se, e cada campo tem valor de recurso

**Regra:** cada rota que lê search params declara `validateSearch`, e cada campo tem um valor por omissão para quando vier inválido — em Zod, `.catch(...)`.
**Porquê:** um search param vem do URL, e o URL vem de fora: de um link antigo, de um favorito, de alguém a escrever à mão. Sem recurso, um valor inválido não degrada a página — rebenta-a.
**Como verificar:** cada `validateSearch` feito com schema tem recurso em todos os campos; feito à mão, devolve um valor para cada um.
**Fonte:** [tanstack-router](../docs/tanstack-router.md)
**Cursos:** 0

### RCT-044 — Os search params escrevem-se por actualização do anterior

**Regra:** passa-se uma função que recebe o estado anterior, não um objecto literal que substitui tudo.
**Porquê:** substituir apaga os outros parâmetros — o filtro, a ordenação, o termo de pesquisa — e o utilizador perde o ecrã ao carregar em «seguinte».
**Como verificar:** cada `search` de um `Link` e cada `navigate` recebe uma função, salvo quando a intenção escrita é mesmo limpar.
**Fonte:** [tanstack-router](../docs/tanstack-router.md)
**Cursos:** 0

### RCT-045 — O que é estado de ecrã vive nos search params

**Regra:** página, filtro, ordenação, separador aberto e termo de pesquisa vão para os search params, não para estado local.
**Porquê:** é estado que o utilizador espera poder partilhar por link, guardar nos favoritos e recuperar com o botão de voltar. Em estado local, recarregar a página perde tudo e um link partilhado abre noutro sítio.
**Como verificar:** procura estado local para página, filtro ou ordenação em componentes de rota; cada um é candidato a search param.
**Fonte:** [tanstack-router](../docs/tanstack-router.md)
**Cursos:** 0

### RCT-046 — Ficheiro que não é rota leva um hífen à frente do nome

**Regra:** um componente, um helper ou um teste ao lado das rotas chama-se com hífen à cabeça, ou vive numa pasta com hífen à cabeça.
**Porquê:** tudo o que está na pasta de rotas sem esse prefixo vira rota na árvore gerada — e passa a existir um URL que ninguém quis criar.
**Como verificar:** na árvore gerada, cada rota corresponde a um ecrã que existe de propósito.
**Fonte:** [tanstack-router](../docs/tanstack-router.md)
**Cursos:** 0

## React 19

Os cursos são da geração do React 19 mas trazem nomes da anterior. Estas regras saem da referência
[react-19](../docs/react-19.md).

### RCT-047 — `useActionState` no lugar de `useFormState`

**Regra:** o hook chama-se `useActionState` e vem de `react`.
**Porquê:** o `useFormState` do `react-dom` foi renomeado. Código escrito contra o nome antigo — que é o que os cursos e os tutoriais ainda mostram — deixa de funcionar.
**Como verificar:** procura `useFormState` **importado de `react-dom`**; devolve vazio. O nome sozinho não chega: o `react-hook-form` tem um `useFormState` próprio, que existe, está certo e não é este — procurar só pelo nome acusa-o e a regra passa a ruído.
**Fonte:** [react-19](../docs/react-19.md)
**Cursos:** 0

### RCT-048 — `ref` é uma prop; `forwardRef` não entra em código novo

**Regra:** um componente de função recebe `ref` como qualquer outra prop.
**Porquê:** o `forwardRef` deixou de ser necessário e está a caminho de ser descontinuado. Mantê-lo é escrever hoje código que se sabe que vai ter de mudar.
**Como verificar:** procura `forwardRef` no código novo; devolve vazio.
**Fonte:** [react-19](../docs/react-19.md)
**Cursos:** 0

### RCT-049 — O contexto é o próprio provider

**Regra:** usa-se o contexto directamente como elemento, com a prop `value`, em vez do `.Provider`.
**Porquê:** é a forma actual, e a antiga vai desaparecer.
**Como verificar:** procura `.Provider` no código; devolve vazio.
**Fonte:** [react-19](../docs/react-19.md)
**Cursos:** 0

### RCT-050 — Um callback de `ref` que cria alguma coisa devolve a limpeza

**Regra:** se o callback subscreve, observa ou regista algo, devolve a função que o desfaz.
**Porquê:** o React 19 deixou de chamar o callback com `null` no desmonte. Quem contava com isso para limpar deixou de limpar — e a fuga não dá erro, acumula.
**Como verificar:** cada callback de `ref` com efeito devolve uma função.
**Fonte:** [react-19](../docs/react-19.md)
**Cursos:** 0

## Grafos com React Flow

Nenhum curso da base ensina React Flow. Estas regras saem da referência
[react-flow](../docs/react-flow.md).

### RCT-051 — O pacote é `@xyflow/react`

**Regra:** a importação é de `@xyflow/react`. O pacote `reactflow` é o nome antigo.
**Porquê:** o `reactflow` ficou parado na versão 11 e continua a instalar-se sem dar erro. A documentação que se encontra escrita ainda mostra o nome antigo, por isso o engano é o caminho por omissão, não a excepção.
**Como verificar:** procura importações de `reactflow`; devolve vazio. E o `package.json` tem `@xyflow/react`.
**Fonte:** [react-flow](../docs/react-flow.md)
**Cursos:** 0

### RCT-052 — O elemento que envolve o `ReactFlow` tem altura explícita

**Regra:** o pai directo declara altura, e a cadeia até um ancestral com altura conhecida está completa.
**Porquê:** o canvas mede-se ao pai. Sem altura, mede zero e não aparece nada — sem erro, sem aviso, com o componente montado e a funcionar.
**Como verificar:** no elemento que envolve o `ReactFlow`, há altura declarada e a cadeia resolve.
**Fonte:** [react-flow](../docs/react-flow.md)
**Cursos:** 0

### RCT-053 — `nodeTypes` e `edgeTypes` definem-se fora do componente

**Regra:** ao nível do módulo, ou memoizados.
**Porquê:** declarados dentro, são um objecto novo a cada render; o React Flow reconstrói todos os nós de cada vez, e o canvas fica lento à medida que o grafo cresce.
**Como verificar:** procura literais de `nodeTypes` e `edgeTypes` escritos dentro do JSX; cada um é um defeito.
**Fonte:** [react-flow](../docs/react-flow.md)
**Cursos:** 0

### RCT-054 — Os handlers de alteração estão todos ligados

**Regra:** `onNodesChange`, `onEdgesChange` e `onConnect` ligados, e o `onConnect` acrescenta a aresta com `addEdge`.
**Porquê:** o componente é controlado. Sem os handlers, arrastar um nó não faz nada e ligar dois nós não cria aresta — parece uma avaria, é a ausência de quem guarda o estado.
**Como verificar:** cada `ReactFlow` tem as três props.
**Fonte:** [react-flow](../docs/react-flow.md)
**Cursos:** 0
