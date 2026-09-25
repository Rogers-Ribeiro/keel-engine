# TanStack Router — referência confirmada

Confirmado na documentação oficial do **TanStack Router** a 2026-09-25.
Serve o mesmo papel que `postgres-multitenancy.md`: é a referência contra a qual as regras se escrevem.

Fontes: [Routing concepts](https://tanstack.com/router/latest/docs/routing/routing-concepts) ·
[Search params](https://tanstack.com/router/latest/docs/framework/react/guide/search-params) ·
[File-based routing API](https://tanstack.com/router/latest/docs/api/file-based-routing)

## Porque é que esta referência existe

Nenhum curso da base ensina TanStack Router. O que a base tem sobre routing é React Router, que é outro modelo — e
a diferença que interessa não é de sintaxe, é o que o router considera ser estado da aplicação.

## Os ficheiros são as rotas

As rotas vivem em `routes/`, e o nome do ficheiro é a rota:

| Ficheiro | O que é |
|---|---|
| `__root.tsx` | a rota de topo, que envolve todas as outras |
| `posts.index.tsx` | o `/posts/` exacto, quando não casa nenhum filho |
| `app.dashboard.tsx` | aninhamento por pontos: `/app/dashboard`, dentro de `app.tsx` |
| `posts.$postId.tsx` | segmento dinâmico; o `$` captura o parâmetro |
| `_layout.tsx` | layout **sem caminho**: envolve os filhos e não aparece no URL |
| `files/$.tsx` | apanha-tudo; o resto do caminho fica em `_splat` |
| `posts.{-$category}.tsx` | segmento opcional, com ou sem o parâmetro |
| `posts_.$postId.edit.tsx` | o `_` antes do ponto **desaninha** do pai |
| `-qualquercoisa.tsx` | ignorado pela geração — é assim que se põe um ficheiro que não é rota ao lado das que são |
| `(grupo)/` | agrupamento puramente organizativo, não entra no caminho |

Cada rota exporta obrigatoriamente `Route`:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutComponent,
})
```

A raiz usa `createRootRoute()` — ou `createRootRouteWithContext()` quando há contexto a injectar.

**O caminho passado ao `createFileRoute` não se escreve à mão.** É escrito e mantido pelo plugin de bundler ou
pelo CLI; mover ou renomear um ficheiro actualiza-o sozinho. Editá-lo à mão é criar uma divergência que a próxima
geração desfaz.

## O `routeTree.gen.ts`

É gerado, mas **faz parte do runtime da aplicação** e vai para o git. Sem ele, outro programador não consegue
construir o projecto. É gerado, versionado, e não editado.

## Aninhar e o `Outlet`

Um layout rende os filhos com `<Outlet />`:

```tsx
import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app')({ component: AppLayoutComponent })

function AppLayoutComponent() {
  return (
    <div>
      <h1>App Layout</h1>
      <Outlet />
    </div>
  )
}
```

Também funciona por pastas: `routes/app/route.tsx` é o layout, e `routes/app/dashboard.tsx` o filho.

Os parâmetros lêem-se com `Route.useParams()` no componente, ou pelo `params` dentro de um loader.

## Os search params são estado, não texto

É aqui que este router se separa dos outros, e é a parte que vale a pena perceber antes de escrever a primeira
rota. A documentação di-lo assim: *"Search params represent application state, so inevitably, we will expect them
to have the same DX associated with other state managers."*

Na prática: o que está a seguir ao `?` é lido como JSON, é validado, e é **tipado**.

```tsx
<Link
  to="/shop"
  search={{ pageIndex: 3, includeCategories: ['electronics', 'gifts'], sortBy: 'price', desc: true }}
/>
```

### Validar

Cada rota declara `validateSearch`, e é isso que dá o tipo:

```tsx
import { z } from 'zod'

const productSearchSchema = z.object({
  page: z.number().catch(1),
  filter: z.string().catch(''),
  sort: z.enum(['newest', 'oldest', 'price']).catch('newest'),
})

export const Route = createFileRoute('/shop/products')({
  validateSearch: productSearchSchema,
})
```

O `.catch(...)` é o que impede que um URL escrito à mão, ou um link antigo, rebente a página: um valor inválido cai
no valor por omissão em vez de estourar. Zod, Valibot, ArkType e Effect/Schema são suportados.

Uma validação escrita à mão também serve, desde que devolva o tipo:

```tsx
validateSearch: (search: Record<string, unknown>): ProductSearch => ({
  page: Number(search?.page ?? 1),
  filter: (search.filter as string) || '',
  sort: (search.sort as ProductSearchSortOptions) || 'newest',
})
```

### Ler

```tsx
const { page, filter, sort } = Route.useSearch()
```

Num componente que não é o da rota — por exemplo, um que foi separado em code-splitting — usa-se
`getRouteApi('/shop/products').useSearch()`, ou `useSearch({ from: '/shop/products' })`.

Os tipos dos pais **fundem-se** à medida que se desce a árvore: uma rota filha vê os search params do pai.

### Escrever

Sempre por actualização do anterior, nunca substituindo às cegas:

```tsx
<Link from={Route.fullPath} search={(prev) => ({ page: prev.page + 1 })}>Página seguinte</Link>
```

Num componente genérico, que vive em várias rotas, usa-se `to="."`:

```tsx
<Link to="." search={(prev) => ({ ...prev, page: prev.page + 1 })}>Página seguinte</Link>
```

Por código: `useNavigate({ from: Route.fullPath })` e depois `navigate({ search: (prev) => ({ page: prev.page + 1 }) })`.

### Middlewares de search

Transformam os search params antes de o link ser gerado e antes da navegação:

```tsx
search: {
  middlewares: [
    retainSearchParams(['retainMe']),            // preserva através das navegações
    stripSearchParams({ one: 'abc', two: 'xyz' }), // tira do URL os que estão no valor por omissão
  ],
}
```

`retainSearchParams` resolve o problema de um filtro global se perder ao navegar; `stripSearchParams` evita URLs
cheios de parâmetros que não dizem nada.

## Por confirmar

A configuração do plugin de Vite (`vite.config.ts`, nome do pacote, opções `routesDirectory`,
`generatedRouteTree`, `autoCodeSplitting`) e o `main.tsx` com `createRouter`, `RouterProvider` e o bloco
`declare module '@tanstack/react-router'` **não estão confirmados** — a página que os documenta não respondeu. Não
se escreve regra sobre isso até serem lidos na fonte.
