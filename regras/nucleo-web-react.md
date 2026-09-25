# Núcleo React — o que vale em qualquer tarefa

Este é o núcleo de um projecto React no browser, e não substitui os outros núcleos de `regras/`: um projecto carrega os que lhe servem, e este anda quase sempre com o `regras/nucleo-javascript.md`, que traz a linguagem e o servidor. O resto está em `regras/web-react.md` e carrega-se conforme o trabalho.

## Nunca

- Base de dados, credenciais ou segredos em código que chega ao browser: **RCT-001**.
- Um pedido no corpo da função do componente: **RCT-027**.
- Objectos e arrays em estado alterados no sítio; actualizam-se por cópia: **RCT-020**.
- A `key` de uma lista vinda do índice: **RCT-023**.
- O hook da loja sem selector, ou um selector que constrói objecto sem `useShallow`: **RCT-036**, **RCT-037**.
- `useFormState`, `forwardRef` e `.Provider` em código novo — mudaram todos de nome: **RCT-047**, **RCT-048**, **RCT-049**.

## Antes de escrever código

- A premissa pergunta-se primeiro, numa frase — o que é isto, para quem, e quem carrega no botão — e a quem não leu nada.
- O que é estado de ecrã — página, filtro, ordenação, pesquisa — vive no URL, não em estado local: **RCT-045**.
- Um valor que se pode derivar não vira estado, e o que é partilhado sobe ao ancestral comum mais próximo: **RCT-021**, **RCT-022**.

## Estado e efeitos

- Estado que depende do anterior actualiza-se com a forma funcional: **RCT-019**.
- As dependências de um efeito são as props e o estado que ele usa; o que cria temporizador devolve a limpeza: **RCT-025**, **RCT-026**.
- `memo` só onde evita execuções, e o mais acima possível: **RCT-028**.
- Estado aninhado na loja actualiza-se por cópia ou com `immer`, e o `getState()` não lê o que o ecrã tem de reflectir: **RCT-038**, **RCT-040**.

## Fronteira com o servidor

- `"use client"` no ficheiro mais fundo que precisa dele: **RCT-002**.
- A validação que conta é a do servidor, mesmo havendo validação no cliente: **RCT-008**.
- A acção de um formulário devolve estado em vez de lançar, e o `redirect()` fica fora do `try`: **RCT-009**, **RCT-012**.
- A sessão verifica-se no servidor em cada rota ou acção protegida: **RCT-017**.
- Revalidar o caminho afectado na mesma acção que altera os dados: **RCT-013**.
- Um pedido feito no cliente trata dados, carregamento e erro em todos os caminhos: **RCT-029**.

## O stack

- A configuração do Tailwind é CSS e não um ficheiro JavaScript; as classes que o v4 renomeou não ficam, e a migração corre-se com a ferramenta porque o nome antigo compila a significar outra coisa: **RCT-031**, **RCT-032**, **RCT-033**.
- A árvore de rotas é gerada e versionada, e o caminho de uma rota não se edita à mão: **RCT-041**, **RCT-042**.
- Os search params validam-se com valor de recurso em cada campo, e escrevem-se sempre por cima do anterior: **RCT-043**, **RCT-044**.
- Um ficheiro que não é rota leva um hífen à frente do nome, senão vira URL: **RCT-046**.
- O React Flow é o pacote `@xyflow/react`, o elemento que o envolve tem altura, e os tipos de nó ficam fora do componente: **RCT-051**, **RCT-052**, **RCT-053**.
