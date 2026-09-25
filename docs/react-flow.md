# React Flow — referência confirmada

Confirmado na documentação oficial do **React Flow** e no registo do npm a 2026-09-25.
Serve o mesmo papel que `postgres-multitenancy.md`: é a referência contra a qual as regras se escrevem.

Fontes: [Terms and definitions](https://reactflow.dev/learn/concepts/terms-and-definitions) ·
[`@xyflow/react` no npm](https://www.npmjs.com/package/@xyflow/react)

## O pacote mudou de nome — e é aqui que se erra primeiro

| Pacote | Versão | O que é |
|---|---|---|
| **`@xyflow/react`** | **12.12.0** | o React Flow actual |
| `reactflow` | 11.11.4 | o nome antigo, parado na v11 |

Praticamente tudo o que se encontra escrito — e a própria página de conceitos — ainda mostra
`import { ReactFlow } from 'reactflow'`. Num projecto novo isso instala a v11 e **não dá erro**: dá a versão
anterior. A importação certa é:

```ts
import { ReactFlow, ReactFlowProvider, useNodesState, useEdgesState, Handle, Position, addEdge } from '@xyflow/react'
```

Nenhum curso da base ensina React Flow, e a regra escreve-se com `**Cursos:** 0`.

## Nós e arestas

Um nó precisa de `id`, `position`, `data` e, se for de tipo próprio, `type`:

```ts
const nodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' }, type: 'default' },
]
```

Uma aresta precisa de `id`, `source` e `target`:

```ts
const edges = [{ id: 'e1-2', source: '1', target: '2' }]
```

## O componente precisa de um pai com altura

Esta é a causa número um de «não aparece nada»: o `ReactFlow` mede-se ao pai, e um pai sem altura explícita dá um
canvas de altura zero.

```tsx
<div style={{ width: '100%', height: '100vh' }}>
  <ReactFlow nodes={nodes} edges={edges} />
</div>
```

## Estado controlado

A forma recomendada é manter os nós e as arestas em estado, com os hooks que trazem o handler já feito:

```tsx
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

const onConnect = (connection) => setEdges((eds) => addEdge(connection, eds))

<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
/>
```

- **`onNodesChange`** trata de posição, selecção e dimensões.
- **`onEdgesChange`** trata de selecção e remoção.
- **`onConnect`** é chamado quando o utilizador liga dois nós — e é onde a aresta nova entra, com `addEdge`.

Sem estes handlers ligados, arrastar um nó não faz nada: o componente é controlado, e quem guarda a posição és tu.

## Nós próprios

```tsx
import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'

const CustomNode = memo(function CustomNode({ data }) {
  return (
    <div>
      <Handle type="target" position={Position.Top} />
      {data.label}
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
})

// FORA do componente: a identidade do objecto tem de ser estável
const nodeTypes = { custom: CustomNode }
```

**O `nodeTypes` define-se fora do componente, ou memoiza-se.** Declarado dentro, é um objecto novo a cada render,
o React Flow reconstrói todos os nós, e o canvas fica lento sem razão aparente. É o erro clássico desta biblioteca.

Os `Handle` são os pontos onde as arestas agarram: `type="target"` recebe, `type="source"` sai, e a `position` é
`Position.Top | Bottom | Left | Right`.

## `ReactFlowProvider`

Necessário quando se usa `useReactFlow` ou outros hooks fora do componente que rende o `ReactFlow`:

```tsx
<ReactFlowProvider>
  <YourFlowComponent />
</ReactFlowProvider>
```

## Selecção

Clique selecciona; `Ctrl`/`Cmd` + clique selecciona vários; `Shift` + arrastar faz caixa de selecção. O que está
seleccionado sobe de `zIndex` e passa a aparecer por cima.
