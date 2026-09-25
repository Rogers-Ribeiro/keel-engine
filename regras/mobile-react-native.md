# Regras — mobile-react-native

Prefixo `RN`. ## Estilos e layout

### RN-001 — Estilos em objectos criados com `StyleSheet.create`

**Regra:** define os estilos em objectos de um `StyleSheet.create` importado de `react-native` e refere-os pelo nome na prop `style`; não repitas o mesmo objecto inline em vários sítios.
**Porquê:** o mesmo estilo repetido obriga a alterar vários sítios quando muda; com um objecto nomeado a alteração é num só. O curso acrescenta que `StyleSheet.create` dá autocompletar das propriedades no editor, ao contrário de um objecto simples.
**Como verificar:** procura objectos de estilo literais repetidos no JSX e estilos definidos fora de um `StyleSheet.create`.
**Cursos:** 1

### RN-002 — Componente reutilizável aceita `style` e combina-o em array

**Regra:** num componente de interface reutilizável, aceita uma prop `style` e passa ao componente nativo um array com o estilo por omissão primeiro e o estilo recebido depois.
**Porquê:** não há cascata nem herança de estilos, e é assim que se reconstrói esse comportamento: os itens do array são avaliados da esquerda para a direita, pelo que o estilo recebido de fora sobrepõe-se ao interno sem obrigar a alterar os outros usos do componente.
**Como verificar:** um componente reutilizável que ignore a prop `style`, ou que a ponha antes do estilo por omissão sem ser de propósito, está errado.
**Cursos:** 1

### RN-003 — `SafeAreaView` a envolver o conteúdo do ecrã

**Regra:** envolve o conteúdo principal dos ecrãs num `SafeAreaView` importado de `react-native`, deixando de fora só os fundos que devem passar por baixo do notch.
**Porquê:** sem ele o conteúdo fica escondido pelo notch e pela barra de estado; o curso trata isto como técnica de uso corrente, não como detalhe de um ecrã.
**Como verificar:** no componente de topo da app ou de cada ecrã, confirma que existe um `SafeAreaView` entre o fundo e o conteúdo.
**Cursos:** 1

## Componentes tocáveis

### RN-004 — `Pressable` para captar toques

**Regra:** envolve com `Pressable` qualquer elemento que deva reagir a toques e liga a acção ao `onPress`; não uses `TouchableHighlight`, `TouchableOpacity` nem `TouchableNativeFeedback` em código novo.
**Porquê:** os componentes `Touchable*` são a via antiga do React Native e devem ser substituídos por `Pressable`. Também não existe `onClick`: sem um componente destes, um elemento não é tocável.
**Como verificar:** procura importações de `Touchable*` e props `onClick` no JSX.
**Cursos:** 1

### RN-005 — Botão próprio com contentor exterior e `Pressable` interior

**Regra:** constrói botões com aparência própria como um `View` exterior que leva o `borderRadius` e `overflow: 'hidden'`, e um `Pressable` interior que leva `backgroundColor`, `padding` e `elevation`; não tentes estilizar o `Button` de `react-native`.
**Porquê:** o `Button` não tem prop `style` e não suporta estilização. E com o `Pressable` por fora, o `android_ripple` transborda para fora do botão; o `overflow: 'hidden'` no contentor exterior recorta-o.
**Como verificar:** procura `style` passado a `Button`; e num botão próprio, confirma que o `borderRadius` e o `overflow` estão no `View` exterior e não no `Pressable`.
**Cursos:** 1

## Plataforma e dimensões

### RN-006 — `useWindowDimensions` quando o layout reage à rotação

**Regra:** usa o hook `useWindowDimensions()` dentro da função do componente sempre que uma medida dependa do tamanho do ecrã e o ecrã possa rodar; só usa `Dimensions.get()` fora do componente para valores que ficam fixos durante toda a vida da app.
**Porquê:** o código fora da função do componente corre uma única vez, quando o ficheiro é interpretado; se a orientação mudar depois disso, esse valor não é recalculado e o layout fica com a medida errada. O hook devolve valores actualizados e provoca novo render.
**Como verificar:** procura chamadas a `Dimensions.get` no topo de ficheiros cujos estilos dependam da orientação.
**Cursos:** 1

### RN-007 — Diferenças de plataforma por `Platform` ou por ficheiro

**Regra:** resolve diferenças pontuais entre plataformas com `Platform.OS` ou `Platform.select({ ios, android })`, e diferenças que abrangem um módulo inteiro com ficheiros `.ios.js` e `.android.js`, importados sempre sem o sufixo.
**Porquê:** a plataforma não muda durante a execução, pelo que não é preciso reagir a alterações como nas dimensões; e o React Native escolhe sozinho o ficheiro certo, o que evita condicionais espalhados. Funciona para qualquer módulo, não só para componentes.
**Como verificar:** confirma que nenhuma importação inclui `.ios` ou `.android`; e procura condicionais de plataforma repetidos que já justificavam ficheiros separados.
**Cursos:** 1

### RN-008 — Sombra com `elevation` no Android e `shadow*` no iOS

**Regra:** define sombras com `elevation` para Android e com `shadowColor`, `shadowOffset`, `shadowOpacity` e `shadowRadius` para iOS, no mesmo estilo; não uses `boxShadow`.
**Porquê:** `boxShadow` não existe no React Native, e `elevation` não tem efeito nenhum em iOS. Sem o segundo conjunto de propriedades, a sombra aparece só numa das plataformas.
**Como verificar:** procura `boxShadow`; e em estilos com `elevation`, confirma que existem também as quatro propriedades `shadow*`.
**Cursos:** 1

## Listas

### RN-009 — `FlatList` para listas dinâmicas

**Regra:** mostra listas de dados dinâmicos com `FlatList`, passando `data`, `renderItem` e um `keyExtractor` que devolva um identificador único; reserva o `ScrollView` para conteúdo de dimensão limitada e conhecida.
**Porquê:** o `ScrollView` renderiza todos os filhos de uma vez, o que degrada o desempenho em listas que podem crescer; o `FlatList` só renderiza os itens perto da zona visível e carrega os restantes à medida que se percorre a lista.
**Como verificar:** procura `ScrollView` a envolver uma lista gerada a partir de dados; e `FlatList` sem `keyExtractor` quando os itens não trazem uma propriedade `key`.
**Cursos:** 1

## Navegação

### RN-010 — `createNativeStackNavigator` como navegador de pilha

**Regra:** usa `createNativeStackNavigator` de `@react-navigation/native-stack` para navegação em pilha; só recorre a `createStackNavigator` se o primeiro der problemas concretos.
**Porquê:** o native stack usa elementos e animações nativos da plataforma, enquanto o outro os emula, pelo que pode ser mais rápido. O curso apresenta-o como a escolha por omissão.
**Como verificar:** procura importações de `@react-navigation/stack` sem justificação registada.
**Cursos:** 1

### RN-011 — `useNavigation` e `useRoute` fora dos ecrãs

**Regra:** usa as props `navigation` e `route` só em componentes registados como `Screen`; em qualquer outro componente usa os hooks `useNavigation()` e `useRoute()` de `@react-navigation/native`.
**Porquê:** só os componentes registados como ecrã recebem essas props automaticamente. Reencaminhá-las por props até um componente aninhado funciona, mas os hooks evitam essa cadeia.
**Como verificar:** procura componentes que não são ecrãs a esperar `navigation` ou `route` nas props, e props de navegação passadas de pai para filho só para chegar a um componente aninhado.
**Cursos:** 1

### RN-012 — Parâmetros de rota lidos com encadeamento opcional

**Regra:** passa dados entre ecrãs no segundo argumento de `navigation.navigate` e lê-os em `route.params`; quando o ecrã também pode abrir sem parâmetros, acede ao campo através do operador de encadeamento opcional.
**Porquê:** se o ecrã for aberto sem parâmetros, `params` é `undefined` e aceder directamente a um campo lança erro; com o encadeamento opcional o resultado é `undefined`, o que serve para distinguir os dois modos (por exemplo, criar ou editar).
**Como verificar:** procura acessos a campos de `route.params` sem encadeamento opcional em ecrãs que sejam alcançáveis sem parâmetros.
**Cursos:** 1

### RN-013 — `navigation.setOptions` dentro de `useLayoutEffect`

**Regra:** quando as opções de um ecrã dependem do seu estado ou dos seus parâmetros, chama `navigation.setOptions` dentro de um `useLayoutEffect`, com as variáveis usadas no array de dependências.
**Porquê:** chamar `setOptions` directamente no corpo do componente dá aviso, porque é um efeito colateral; em `useEffect` o efeito corre depois do primeiro render e o título salta já com o ecrã visível. O `useLayoutEffect` corre antes disso e a transição fica suave.
**Como verificar:** procura `setOptions` no corpo de um componente ou dentro de `useEffect`.
**Cursos:** 1

### RN-014 — `headerShown: false` ao aninhar navegadores

**Regra:** ao registar um navegador como `component` de um `Screen`, desliga o cabeçalho do navegador exterior nesse ecrã com `headerShown: false`, e dá nomes de ecrã únicos em toda a árvore de navegadores.
**Porquê:** cada navegador traz o seu próprio cabeçalho, pelo que aninhar sem desligar um deles deixa dois cabeçalhos empilhados. Nomes repetidos dão aviso, porque são os identificadores usados na navegação.
**Como verificar:** em cada `Screen` que aponte para um navegador, confirma o `headerShown: false`; e procura nomes de ecrã repetidos entre navegadores.
**Cursos:** 1

### RN-015 — `useIsFocused` quando o ecrã fica na pilha

**Regra:** quando um efeito tiver de correr ao regressar a um ecrã, chama `useIsFocused()` de `@react-navigation/native` e inclui o booleano nas dependências do `useEffect`.
**Porquê:** ao navegar para outro ecrã da pilha, o ecrã anterior e os seus componentes filhos não são destruídos; ao voltar, não são recriados nem reavaliados, e o efeito não volta a correr. O booleano do hook muda quando o ecrã ganha e perde o foco, o que faz o efeito correr.
**Como verificar:** procura efeitos que leiam `route.params` ou releiam dados e que dependam de o ecrã ser recriado.
**Cursos:** 1

## Estado

### RN-016 — Forma funcional do setter quando o novo estado depende do anterior

**Regra:** quando o novo valor de estado for calculado a partir do anterior, passa uma função ao setter do `useState` e deriva o valor a partir do parâmetro que ela recebe, em vez de ler a variável de estado directamente.
**Porquê:** é a forma que o curso apresenta como boa prática: o React chama essa função com o estado actual, o que garante que se parte do valor certo mesmo quando as actualizações são agendadas.
**Como verificar:** procura chamadas ao setter que leiam a variável de estado do próprio componente para construir o novo valor.
**Cursos:** 1

### RN-017 — Estado novo por cópia, excepto nos reducers do Redux Toolkit

**Regra:** num reducer de `useReducer` ou em estado gerido por `useState`, devolve sempre um array ou objecto novo (spread, `filter`, cópia com o item alterado); só dentro dos reducers de um `createSlice` do Redux Toolkit é que podes alterar o estado no sítio.
**Porquê:** o curso mantém o estado imutável em todos os casos e diz explicitamente que a excepção é o Redux Toolkit, porque a biblioteca trata da imutabilidade por baixo.
**Como verificar:** procura `push`, `splice` ou atribuições a campos do estado em reducers que não sejam de um `createSlice`.
**Cursos:** 1

## Dados remotos

### RN-018 — A função de `useEffect` nunca é `async`

**Regra:** não marques como `async` a função passada ao `useEffect`; declara dentro dela uma função auxiliar `async` e chama-a a seguir.
**Porquê:** marcar a função como `async` faz o efeito devolver uma promise, o que o curso descreve como desaconselhado pela equipa do React — a função de efeito não deve devolver uma promise.
**Como verificar:** procura `useEffect(async () => ...)`.
**Cursos:** 1

### RN-019 — Resposta externa transformada antes de chegar à interface

**Regra:** transforma a resposta do backend na forma do modelo de domínio dentro da função que faz o pedido, e devolve já essa forma a quem a chamou; não deixes os nomes e a estrutura originais chegarem aos componentes.
**Porquê:** no curso o Firebase devolve as colecções como um objecto com os identificadores por chave, e não como um array; a função de pedido percorre as chaves e constrói um array de objectos com os campos que a app usa, incluindo o identificador.
**Como verificar:** procura componentes a percorrer chaves de resposta ou a usar nomes de campo específicos do backend.
**Cursos:** 1

### RN-020 — `try`/`catch` por pedido, com o erro em estado

**Regra:** envolve cada pedido HTTP num `try`/`catch`, guarda a mensagem num estado de erro e mostra-a ao utilizador; mantém dentro do `try`, depois do pedido, as acções que só devem acontecer se ele correr bem (fechar o ecrã, alterar o estado partilhado).
**Porquê:** uma promise rejeitada por tratar deixa a app em carregamento para sempre e sem nenhum aviso. E se a alteração local ficar fora do `try`, ela acontece mesmo quando o pedido falhou, e o cliente passa a divergir do servidor.
**Como verificar:** procura chamadas a funções de pedido sem `try`/`catch`; e, dentro do `try`, confirma que a alteração local vem depois do `await`.
**Cursos:** 1

### RN-021 — Flag booleana de carregamento por acção

**Regra:** guarda num estado booleano próprio (`isFetching`, `isSubmitting`) o facto de uma acção assíncrona estar em curso, põe-no a falso quando ela termina — com ou sem erro — e usa-o para decidir se mostras o indicador de carregamento em vez do conteúdo.
**Porquê:** sem isso, o ecrã mostra por instantes o estado vazio ("não há despesas") antes de os dados chegarem. Uma flag por acção distingue ir buscar de submeter, que têm indicadores diferentes.
**Como verificar:** procura ecrãs que renderizam a partir de dados que ainda podem não ter chegado; e blocos `catch` que não repõem a flag.
**Cursos:** 1

### RN-022 — O identificador vem do backend, não do cliente

**Regra:** usa o identificador que o backend devolve na resposta à criação e guarda-o no estado local; não inventes um identificador no cliente nem o mantenhas depois da resposta chegar.
**Porquê:** é com esse identificador que as operações de alteração e remoção seguintes atingem o registo certo no servidor. Um identificador gerado no cliente não existe do lado de lá.
**Como verificar:** procura geração de identificadores no cliente (`Math.random`, contadores) para entidades que também vivem no backend.
**Cursos:** 1

## Autenticação

### RN-023 — Token guardado no dispositivo, lido no arranque, removido no logout

**Regra:** ao autenticar, guarda o token no armazenamento local do dispositivo além do estado em memória; lê-o no arranque da app e remove-o no logout. Adia o primeiro render visível até essa leitura terminar.
**Porquê:** guardado só em memória, o token perde-se quando a app fecha e o utilizador tem de voltar a entrar. Se não for removido no logout, o arranque seguinte volta a autenticar quem pediu para sair. E se o primeiro render não esperar pela leitura, o ecrã de login aparece por instantes a quem já está autenticado.
**Como verificar:** confirma que existem os três pontos — escrita ao autenticar, leitura no arranque, remoção no logout — e que o arranque tem um estado que segura o ecrã inicial enquanto a leitura decorre.
**Cursos:** 1

### RN-024 — Ecrãs protegidos por troca de navegador

**Regra:** protege ecrãs registando-os num navegador separado e renderizando condicionalmente esse navegador ou o de autenticação, conforme o estado de autenticação; não chames `navigate` nem `replace` depois de autenticar.
**Porquê:** se o navegador com os ecrãs protegidos não chega a ser renderizado, não há maneira de lá chegar. A troca de navegador leva sozinha ao ecrã certo, e o curso diz explicitamente que não se deve chamar `navigate` ou `replace` nesse momento.
**Como verificar:** procura `navigate` ou `replace` a seguir a um login bem sucedido, e ecrãs protegidos registados no mesmo navegador que os de login.
**Cursos:** 1

### RN-025 — O token só protege se o backend o exigir

**Regra:** anexa o token a todos os pedidos a recursos protegidos e configura o backend para o exigir; não trates o estado de autenticação do cliente como protecção.
**Porquê:** o token serve para duas coisas distintas — saber se há sessão e obter acesso —, e a segunda só existe se o recurso estiver fechado do lado do servidor. Num backend aberto, o pedido passa com ou sem token.
**Como verificar:** confirma que as regras de acesso do backend exigem utilizador autenticado, e que cada chamada a um recurso protegido leva o token.
**Cursos:** 1

## Dispositivo e dados locais

### RN-026 — Verificar o estado da permissão antes de a pedir

**Regra:** antes de usar uma funcionalidade nativa, verifica o `status` devolvido pelo hook de permissões do pacote: se estiver `undetermined`, chama `requestPermission` e decide pelo `granted` da resposta; se estiver `denied`, mostra um `Alert` e interrompe a acção.
**Porquê:** já com a permissão concedida não se deve voltar a pedir, e o pedido é assíncrono, porque abre um diálogo e espera pela resposta. Sem o ramo do `denied`, a app prossegue sem acesso e falha sem explicação.
**Como verificar:** procura chamadas a `requestPermission` sem verificação prévia do `status`, e caminhos que continuam depois de a permissão ser negada.
**Cursos:** 1

### RN-027 — Valores dinâmicos em SQL por marcadores `?`

**Regra:** nas queries SQL, põe um marcador `?` por cada valor dinâmico e passa os valores num array separado, pela mesma ordem dos marcadores; não interpoles dados na string do comando.
**Porquê:** é o que o curso apresenta como a forma recomendada de inserir dados dinâmicos numa query.
**Como verificar:** procura literais de template ou concatenações com variáveis dentro de strings SQL; e confirma que a ordem do array corresponde à das colunas.
**Cursos:** 1

### RN-028 — Na base de dados fica o caminho do ficheiro, não o ficheiro

**Regra:** guarda na base de dados o caminho do ficheiro, numa coluna de texto, e deixa o ficheiro no sistema de ficheiros.
**Porquê:** o curso enuncia isto como boa prática geral — não se guardam ficheiros em bases de dados, guardam-se caminhos para ficheiros.
**Como verificar:** procura colunas ou campos que recebam conteúdo binário ou base64 de imagens e outros ficheiros.
**Cursos:** 1
