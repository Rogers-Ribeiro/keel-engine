# Tailwind CSS v4 — referência confirmada

Confirmado na documentação oficial do **Tailwind CSS v4** a 2026-09-25.
Serve o mesmo papel que `postgres-multitenancy.md`: é a referência contra a qual as regras se escrevem, e contra a
qual se marca o que um curso ensinar de outra maneira.

Fonte: [Upgrade guide](https://tailwindcss.com/docs/upgrade-guide)

## Porque é que esta referência existe

A base de conhecimento ensina **v3**, e ensina-o bem — mas o v4 mudou o modelo de configuração e renomeou
utilitários de uso diário. Uma aula que diga `bg-gradient-to-b`, `shadow-sm` ou `tailwind.config.js` não está
errada por descuido: está uma geração atrás. Qualquer regra sobre Tailwind escreve-se contra este ficheiro.

## A configuração deixou de ser JavaScript

Não há `tailwind.config.js` a ser lido sozinho. O tema declara-se em CSS, com `@theme`:

```css
@import "tailwindcss";

@theme {
  --font-display: "Satoshi", "sans-serif";
  --breakpoint-3xl: 120rem;
  --color-avocado-100: oklch(0.99 0 0);
}
```

- `@tailwind base; @tailwind components; @tailwind utilities;` **desapareceu**. É `@import "tailwindcss";`.
- Um ficheiro de configuração antigo ainda funciona, mas **já não é detectado**: tem de ser carregado à mão com
  `@config "../../tailwind.config.js";`.
- Mesmo carregado, as opções `corePlugins`, `safelist` e `separator` **não existem** no v4.
- A pasta a varrer já não vem de `content: [...]`; declara-se com `@source` no CSS.
- `resolveConfig` foi removido. Para ler um valor do tema em JavaScript, lê-se a variável CSS:
  `getComputedStyle(document.documentElement).getPropertyValue("--shadow-xl")`.
- Um utilitário próprio já não é `@layer utilities { .tab-4 { … } }`, é `@utility tab-4 { … }`.

## Os pacotes mudaram de nome

| | v3 | v4 |
|---|---|---|
| Vite | plugin de PostCSS | **`@tailwindcss/vite`**, plugin dedicado |
| PostCSS | `tailwindcss` | `@tailwindcss/postcss` |
| CLI | `tailwindcss` | `@tailwindcss/cli` |

```ts
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
});
```

## Utilitários renomeados

Esta é a parte que passa despercebida, porque o nome antigo continua a existir — a significar **outra coisa**.

| v3 | v4 |
|---|---|
| `shadow-sm` | `shadow-xs` |
| `shadow` | `shadow-sm` |
| `rounded-sm` | `rounded-xs` |
| `rounded` | `rounded-sm` |
| `blur-sm` | `blur-xs` |
| `blur` | `blur-sm` |
| `drop-shadow-sm` / `backdrop-blur-sm` | `drop-shadow-xs` / `backdrop-blur-xs` |
| `outline-none` | `outline-hidden` |
| `bg-gradient-to-*` | `bg-linear-to-*` |

Um `shadow-sm` escrito para v3 continua a compilar no v4 e dá uma sombra **diferente**. Não há erro, há um desenho
errado — e é por isso que a migração se faz com a ferramenta, não à mão.

## Utilitários removidos

`bg-opacity-*`, `text-opacity-*`, `border-opacity-*`, `divide-opacity-*`, `ring-opacity-*` e
`placeholder-opacity-*` saíram: a opacidade é um modificador, `bg-black/50`.
`flex-shrink-*` → `shrink-*`, `flex-grow-*` → `grow-*`, `overflow-ellipsis` → `text-ellipsis`,
`decoration-slice`/`decoration-clone` → `box-decoration-slice`/`box-decoration-clone`.

## Valores por omissão que mudaram

| | v3 | v4 |
|---|---|---|
| `border-*` e `divide-*` | `gray-200` | **`currentColor`** |
| cor do `ring` | `blue-500` | **`currentColor`** |
| largura do `ring` | `3px` | **`1px`** — `ring` passa a `ring-3` |
| `outline` | sem largura própria | `1px`, como `border` e `ring` — `outline outline-2` passa a `outline-2` |

Isto muda o aspecto de um projecto migrado **sem dar erro nenhum**. Para manter o comportamento do v3:

```css
@layer base {
  *, ::after, ::before, ::backdrop, ::file-selector-button {
    border-color: var(--color-gray-200, currentColor);
  }
}
@theme {
  --default-ring-width: 3px;
  --default-ring-color: var(--color-blue-500);
}
```

## Sintaxe que mudou

- **O `!` passou para o fim**: `!flex hover:!bg-red-600` escreve-se `flex! hover:bg-red-600!`.
- **As variantes empilham da esquerda para a direita**: `first:*:pt-0` passa a `*:first:pt-0`.
- **Variáveis CSS em valores arbitrários levam parênteses**: `bg-[--brand]` passa a `bg-(--brand)`.
- **Vírgulas em valores arbitrários passam a underscores**: `grid-cols-[max-content,auto]` passa a
  `grid-cols-[max-content_auto]`.
- **`theme()` usa o nome da variável**: `theme(screens.xl)` passa a `theme(--breakpoint-xl)`. Melhor ainda é usar a
  variável directamente: `var(--color-red-500)`.
- **Transformações são propriedades individuais**: `focus:transform-none` passa a `focus:scale-none`, e
  `transition-[opacity,transform]` passa a `transition-[opacity,scale]`.

## Preflight

O `placeholder` deixa de ser `gray-400` e passa a ser a cor do texto a 50%. Um `<button>` volta a
`cursor: default` — quem quiser a mãozinha põe `cursor-pointer`. O `<dialog>` deixa de vir centrado. E o atributo
`hidden` passa a ganhar às classes de `display`.

## Limites

- **Browsers**: Safari 16.4+, Chrome 111+, Firefox 128+. O v4 não suporta browsers mais antigos, e não há opção.
- **Sem pré-processadores**: Sass, Less e Stylus deixaram de ser compatíveis.
- **`@apply` fora do ficheiro principal** (CSS Modules, `<style>` de Vue ou Svelte) não vê o tema. É preciso
  `@reference "../../app.css";` no topo do bloco — ou, melhor, usar a variável CSS directamente.

## Migrar

```
npx @tailwindcss/upgrade
```

Precisa de Node 20+. Corre-se num ramo à parte e **lê-se o diff** — sobretudo as linhas de `shadow`, `rounded`,
`blur` e `ring`, que são as que mudam de aspecto sem mudar de nome.
