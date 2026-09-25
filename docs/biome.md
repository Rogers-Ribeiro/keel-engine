# Biome — referência confirmada

Confirmado na documentação oficial do **Biome** e no registo do npm (`@biomejs/biome` 2.5.14) a 2026-09-25.
Serve o mesmo papel que `postgres-multitenancy.md`: é a referência contra a qual as regras se escrevem.

Fontes: [Getting started](https://biomejs.dev/guides/getting-started/) ·
[`@biomejs/biome` no npm](https://www.npmjs.com/package/@biomejs/biome)

## O que é

Uma ferramenta só no lugar de duas: **formatador e linter**, a substituir Prettier e ESLint. Nenhum curso da base
o ensina — o que a base tem sobre esta função é ESLint e Prettier —, e a regra escreve-se com `**Cursos:** 0`.

## Instalar

```
npm i -D -E @biomejs/biome
```

O **`-E`** não é decoração: fixa a versão exacta. Um formatador que muda de versão sozinho reformata ficheiros que
ninguém tocou, e o diff seguinte fica ilegível. É por isso que a documentação oficial o traz no comando.

Equivalentes: `pnpm add -D -E`, `yarn add -D -E`, `bun add -D -E`.

## Configurar

```
npx @biomejs/biome init
```

Escreve um `biome.json`. As secções principais:

| Chave | O que controla |
|---|---|
| `formatter` | formatação |
| `linter` | regras e severidades |
| `assist` | acções de código, como organizar importações |
| `files` | que ficheiros entram e quais ficam de fora |
| `vcs` | integração com o controlo de versões |

## Comandos

| Comando | O que faz |
|---|---|
| `biome check --write` | formata, corrige o lint e organiza as importações — é o comando do dia-a-dia |
| `biome format --write` | só formata |
| `biome lint --write` | só lint, aplicando as correcções seguras |
| `biome ci` | a versão para integração contínua |

Dois sinalizadores contam:

- **`--write`** aplica as alterações. Sem ele, o comando só diz o que faria.
- **`--unsafe`** aplica também as correcções que o Biome classifica como inseguras — as que podem mudar
  comportamento. Não entra num hook automático nem em CI; corre-se à mão e lê-se o diff.

## Na integração contínua

`biome ci` é o comando próprio para isso, e é o que se põe no pipeline — não `check --write`. A diferença é a que
interessa: em CI não se corrigem ficheiros, verifica-se que já estão certos, e falha-se se não estiverem. Um
pipeline que escreve no código é um pipeline que esconde o problema em vez de o mostrar.

## Migrar

O Biome traz migração assistida a partir das duas ferramentas que substitui — `biome migrate eslint` e
`biome migrate prettier`, documentados no guia próprio de migração. **A forma exacta dos comandos não foi lida na
fonte**, e não se escreve regra sobre eles até ser.
