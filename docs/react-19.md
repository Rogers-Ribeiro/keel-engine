# React 19 — referência confirmada

Confirmado no anúncio oficial do **React 19** a 2026-09-25.
Serve o mesmo papel que `claude-code-formatos.md`: é a referência contra a qual se marca o que um curso ensinar de
outra maneira.

Fonte: [React 19](https://react.dev/blog/2024/12/05/react-19)

## Porque é que esta referência existe

A base tem um curso de React da geração 19, mas com pelo menos um detalhe já desactualizado — e o padrão dos
outros é o mesmo: um nome que mudou, num curso correcto no resto. Esta página é a lista dos nomes.

## O que mudou de nome

| Antes | Agora |
|---|---|
| `ReactDOM.useFormState` | **`useActionState`** |
| `<Context.Provider>` | **`<Context>`** — o próprio contexto é o provider |
| `forwardRef` | desnecessário: **`ref` é uma prop** de qualquer componente de função |

```tsx
// React 19: sem forwardRef
function MyInput({ ref }) {
  return <input ref={ref} />
}

// React 19: o contexto é o provider
<ThemeContext value="dark">{children}</ThemeContext>
```

O `forwardRef` continua a funcionar, mas está a caminho de ser descontinuado.

## Actions

Uma função passada ao `action` de um `<form>`, ou ao `formAction` de um `<input>` ou `<button>`, passa a ser
suportada nativamente. O formulário **limpa-se sozinho** depois de uma submissão bem sucedida (e há
`requestFormReset` para o fazer à mão).

```tsx
const [error, submitAction, isPending] = useActionState(
  async (previousState, formData) => { /* … */ },
  null,
)
```

O `useActionState` dá o estado pendente e o erro sem os gerir à mão — é o que substitui o par
`useState` + `try/finally` que se escrevia antes.

**`useFormStatus`**, que vem do `react-dom`, lê o estado do `<form>` acima sem passar props:

```tsx
import { useFormStatus } from 'react-dom'
const { pending } = useFormStatus()
```

**`useOptimistic`** mostra o resultado esperado enquanto o pedido ainda vai a caminho.

## `use`

```tsx
import { use } from 'react'

const comments = use(commentsPromise)
const theme = use(ThemeContext)
```

Lê um recurso durante o render — uma promessa ou um contexto. Ao contrário dos hooks, **pode ser chamado dentro de
condições**.

## Refs com limpeza

Um callback de `ref` pode devolver uma função de limpeza:

```tsx
ref={(node) => {
  // criado
  return () => { /* limpeza */ }
}}
```

Isto substitui a chamada do `ref` com `null` no desmonte, que deixou de acontecer.

## Recursos no documento

- **`<title>`, `<meta>` e `<link>`** podem ser rendidos em qualquer componente e são içados para o `<head>`.
- **Folhas de estilo** aceitam `precedence`, que ordena a inserção:
  `<link rel="stylesheet" href="foo" precedence="default" />`.
- **`<script async>`** pode ser rendido em qualquer sítio da árvore, e é desduplicado.
- **Pré-carregamento**, a partir do `react-dom`:
  `import { prefetchDNS, preconnect, preload, preinit } from 'react-dom'`.

## Erros

Um erro passa a dar **um** registo em vez de vários duplicados. A raiz aceita `onCaughtError`, `onUncaughtError` e
`onRecoverableError`. E os erros de hidratação passam a mostrar a diferença real entre o que o servidor mandou e o
que o cliente esperava, em vez de uma mensagem genérica.

## Outros

`useDeferredValue` aceita `initialValue`. Os *custom elements* passam a ser totalmente suportados. E a hidratação
lida melhor com scripts de terceiros e extensões do browser — que era a causa de metade dos erros de hidratação
que não eram culpa de ninguém.
