# Núcleo React Native — o que vale em qualquer tarefa

Este é o núcleo de uma aplicação móvel em React Native, e não substitui os outros núcleos de `regras/`: um projecto carrega os que lhe servem, e este anda com o `regras/nucleo-javascript.md`, que traz a linguagem. O resto está em `regras/mobile-react-native.md` e carrega-se conforme o trabalho.

## Nunca

- Valores dinâmicos concatenados numa instrução SQL; entram por marcadores: **RN-027**.
- A função passada a `useEffect` declarada `async`: **RN-018**.
- Um identificador gerado no cliente quando quem manda é o backend: **RN-022**.
- Contar que esconder um ecrã protege alguma coisa: só protege o que o backend exigir: **RN-025**.
- O conteúdo do ficheiro guardado na base de dados em vez do caminho: **RN-028**.

## Antes de escrever código

- A premissa pergunta-se primeiro, numa frase — o que é isto, para quem, e quem carrega no botão — e a quem não leu nada.
- O conteúdo do ecrã vai dentro de `SafeAreaView`, senão fica por baixo do entalhe e da barra: **RN-003**.
- Os estilos vivem em objectos criados com `StyleSheet.create`, e um componente reutilizável aceita `style` e combina-o: **RN-001**, **RN-002**.

## Ecrãs e navegação

- `Pressable` para captar toques, com o contentor por fora e o `Pressable` por dentro quando há recorte: **RN-004**, **RN-005**.
- Listas dinâmicas em `FlatList`, nunca um ciclo dentro de um scroll: **RN-009**.
- As opções do cabeçalho mudam-se dentro de `useLayoutEffect`, e ao aninhar navegadores esconde-se o cabeçalho de fora: **RN-013**, **RN-014**.
- Fora de um ecrã, a navegação e a rota lêem-se por `useNavigation` e `useRoute`: **RN-011**.
- Os parâmetros de rota lêem-se com encadeamento opcional, porque podem não vir: **RN-012**.
- Um ecrã que fica na pilha e precisa de saber que voltou usa `useIsFocused`: **RN-015**.

## Plataforma

- O layout que reage à rotação lê `useWindowDimensions` em vez de medir uma vez: **RN-006**.
- As diferenças entre iOS e Android resolvem-se por `Platform` ou por ficheiro, e a sombra precisa das duas formas: **RN-007**, **RN-008**.
- A permissão verifica-se antes de ser pedida: **RN-026**.

## Estado e dados

- Estado que depende do anterior usa a forma funcional do setter, e o novo estado faz-se por cópia — excepto dentro de um reducer do Redux Toolkit: **RN-016**, **RN-017**.
- Cada pedido tem o seu `try`/`catch` com o erro em estado, e a sua própria bandeira de carregamento: **RN-020**, **RN-021**.
- A resposta externa transforma-se antes de chegar à interface: **RN-019**.
- O token guarda-se no dispositivo, lê-se no arranque e remove-se ao sair; os ecrãs protegem-se trocando de navegador: **RN-023**, **RN-024**.
