# Zustand — referência confirmada

Confirmado na documentação oficial do **Zustand** a 2026-09-25.
Serve o mesmo papel que `postgres-multitenancy.md`: é a referência contra a qual as regras se escrevem.

Fontes: [README oficial](https://github.com/pmndrs/zustand) ·
[Documentação](https://zustand.docs.pmnd.rs/) ·
[useShallow](https://zustand.docs.pmnd.rs/reference/hooks/use-shallow) ·
[Slices pattern](https://zustand.docs.pmnd.rs/learn/guides/slices-pattern.html)

## Porque é que esta referência existe

Nenhum curso da base ensina Zustand. O que a base tem sobre estado partilhado é Redux e Redux Toolkit, que é outro
modelo. Qualquer regra sobre Zustand escreve-se contra este ficheiro, com `**Cursos:** 0`.

## A loja

```ts
import { create } from 'zustand'

const useBearStore = create((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}))
```

Não há provider. O que `create` devolve é um hook, e usa-se em qualquer componente.

Duas coisas sobre o `set`, e ambas contam:

- **o estado actualiza-se de forma imutável** — devolve-se um objecto novo, não se muda o que lá está;
- **o `set` funde superficialmente**. O primeiro nível é fundido por ti; um nível abaixo, não. Estado aninhado
  espalha-se à mão, ou usa-se o middleware `immer`.

O `get` lê o estado corrente de dentro de uma acção:

```ts
const useSoundStore = create((set, get) => ({
  sound: 'grunt',
  action: () => {
    const sound = get().sound
  },
}))
```

Acções assíncronas não precisam de nada: *"zustand doesn't care if your actions are async or not."*

```ts
fetch: async (pond) => {
  const response = await fetch(pond)
  set({ fishies: await response.json() })
}
```

## Seleccionar estreito — é aqui que se ganha ou perde

```ts
const bears = useBearStore((state) => state.bears)
const increasePopulation = useBearStore((state) => state.increasePopulation)
```

O componente só volta a renderizar quando **o valor seleccionado** muda, por igualdade estrita. Um componente que
faça `useBearStore()` sem selector subscreve a loja inteira e renderiza a cada alteração de qualquer campo.

E há uma armadilha com nome próprio: **seleccionar um objecto construído no selector**.

```ts
// ERRADO: o objecto é novo a cada render, a igualdade estrita nunca dá true
const { nuts, honey } = useBearStore((state) => ({ nuts: state.nuts, honey: state.honey }))
```

Isto renderiza sem parar, e pode entrar em ciclo infinito de actualização. A solução oficial é o `useShallow`:

```ts
import { useShallow } from 'zustand/react/shallow'

const { nuts, honey } = useBearStore(
  useShallow((state) => ({ nuts: state.nuts, honey: state.honey })),
)
```

`useShallow` devolve uma versão memoizada do selector, comparada por igualdade superficial. A alternativa, quando
são poucos campos, é uma chamada por campo — e essa não precisa de nada.

## Dividir a loja em fatias

Uma loja que cresce parte-se em fatias e junta-se com o operador de espalhamento. **Os middlewares aplicam-se à
loja combinada, não a cada fatia** — aplicá-los dentro de uma fatia dá problemas.

## Middlewares

```ts
import { persist, createJSONStorage, devtools, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
```

**`persist`** grava e repõe o estado:

```ts
const useFishStore = create(
  persist(
    (set, get) => ({ fishes: 0, addAFish: () => set({ fishes: get().fishes + 1 }) }),
    { name: 'food-storage', storage: createJSONStorage(() => sessionStorage) },
  ),
)
```

**`devtools`** liga ao Redux DevTools. Vale a pena dar nome a cada acção, no terceiro argumento do `set`, senão o
histórico não se lê:

```ts
eatFish: () => set((prev) => ({ fishes: Math.max(0, prev.fishes - 1) }), undefined, 'bear/eatFish')
```

**`immer`** deixa escrever a mutação e trata da imutabilidade — é a resposta certa para estado aninhado:

```ts
addBees: (by) => set((state) => { state.bees += by })
```

**`subscribeWithSelector`** permite subscrever uma parte só: `useDogStore.subscribe((s) => s.paw, console.log)`.

## Fora do React

```ts
const paw = useDogStore.getState().paw     // leitura não reactiva
useDogStore.setState({ paw: false })       // escrita
const unsub = useDogStore.subscribe(console.log)
unsub()
```

É o que permite usar a loja em código que não é componente. Uma leitura com `getState()` dentro de um componente
**não** o volta a renderizar — é precisamente para isso que serve, e é um erro usá-la à espera do contrário.

## TypeScript

A forma é `create<T>()(...)` — com os parênteses vazios no meio, que é o que permite a inferência funcionar com
middlewares empilhados:

```ts
interface BearState {
  bears: number
  increase: (by: number) => void
}

const useBearStore = create<BearState>()(
  devtools(
    persist(
      (set) => ({ bears: 0, increase: (by) => set((state) => ({ bears: state.bears + by })) }),
      { name: 'bear-storage' },
    ),
  ),
)
```

`create<BearState>(...)` sem os parênteses extra compila, mas perde a inferência assim que entra um middleware.
