# dimensoes.md — as dimensões do levantamento e o que cada leitor devolve

Ficheiro de apoio da skill `keel-audit`, lido no passo 3. Diz que dimensões entram conforme o domínio, o que cada leitor lê, e o formato do que devolve. Cada leitor recebe também este ficheiro.

## Que tabelas entram

As dimensões dependem da stack, porque as regras também dependem. Olha para o mapa do passo 2 e escolhe as tabelas dos domínios que encontraste — podem ser mais do que uma. Um repositório com `sfdx-project.json`, `force-app/` ou `manifest/package.xml` leva a tabela de `salesforce`; um com `mule-artifact.json` ou POMs de Mule leva a de `mulesoft`; um com `cartridges/` ou `dw.json` leva a de `comercio-digital`; um repositório Python com agentes leva a de `python-agentes`; um com `package.json` e TypeScript leva a de `javascript`, mais a de `web-react` se tiver React no browser (`vite.config.*`, `next.config.*`, `tsr.config.json`, `components.json`) e a de `mobile-react-native` se tiver `app.json` de Expo, `android/` ou `ios/`. Um repositório com testes ponta a ponta (`playwright.config.*`, `e2e/`, `tests/e2e/`, `pytest-playwright` nas dependências) leva também a de `automacao-de-testes`, seja qual for a linguagem. Um repositório que caia em mais do que um domínio leva as dimensões de todas as tabelas correspondentes.

**Domínio `python-agentes`:**

| Dimensão | Regras que lê |
|---|---|
| Arquitectura e fronteiras | `arquitetura.md`, `padroes-de-projeto.md` |
| Dados e isolamento entre tenants | `persistencia.md` |
| API, contratos, segurança e integrações | `api-e-contratos.md`, `seguranca.md`, `integracoes.md` |
| Agentes, grafos e prompts | `agentes-ia.md`, `llm-e-prompts.md`, `rag.md` |
| Operação: filas, observabilidade e deploy | `filas-e-concorrencia.md`, `observabilidade.md`, `producao-ia.md`, `docker-e-deploy.md` |
| Código e testes | `codigo-limpo.md`, `python.md`, `testes.md` |

**Domínio `salesforce`:**

| Dimensão | Regras que lê |
|---|---|
| Configuração declarativa e automação | `salesforce-plataforma.md`, `salesforce-automacao.md` |
| Modelo de dados, volume e migração | `salesforce-dados.md` |
| Partilha, visibilidade e identidade | `salesforce-seguranca.md` |
| Apex e Lightning Web Components | `salesforce-apex.md`, `salesforce-lwc.md` |
| Integrações, APIs e eventos | `salesforce-integracao.md` |
| IA generativa na plataforma | `salesforce-ia.md` |

**Domínio `mulesoft`:**

| Dimensão | Regras que lê |
|---|---|
| Fluxos, DataWeave e tratamento de erros | `mulesoft-desenvolvimento.md` |
| Desenho de APIs, camadas e fiabilidade | `mulesoft-arquitetura.md` |

**Domínio `comercio-digital`:**

| Dimensão | Regras que lê |
|---|---|
| Loja: catálogo, preço, checkout e extensão por código | `comercio-digital.md` |

**Domínio `javascript`:**

| Dimensão | Regras que lê |
|---|---|
| Tipos, módulos e fronteiras do sistema | `javascript-e-typescript.md` |
| Servidor: rotas, sessões, erros e ficheiros | `node-servidor.md` |

**Domínio `web-react`:**

| Dimensão | Regras que lê |
|---|---|
| Componentes, estado e efeitos | `web-react.md` |

**Domínio `mobile-react-native`:**

| Dimensão | Regras que lê |
|---|---|
| Ecrãs, navegação, plataforma e dados locais | `mobile-react-native.md` |

**Domínio `automacao-de-testes`:**

| Dimensão | Regras que lê |
|---|---|
| Testes ponta a ponta: localizadores, esperas, isolamento, autenticação e CI | `automacao-de-testes.md` |

**Em qualquer domínio, se o repositório tiver instruções para agentes** (`CLAUDE.md`, `AGENTS.md`, `.claude/rules/`, `.cursor/rules/`, `.github/copilot-instructions.md`, skills próprias):

| Dimensão | Regras que lê |
|---|---|
| Regras escritas e controlos que as impõem | `dev-com-agentes.md` (PROC-023, PROC-034, PROC-035), `seguranca.md` (SEG-008) |
| Peso do contexto e das skills | `dev-com-agentes.md` (PROC-037, PROC-038) |

Esta dimensão não lê o código: lê o que o repositório **diz ao agente** e compara com o que **o impede**. O leitor junta as regras de segurança escritas nos ficheiros de instruções (o que não se publica, apaga, lê ou executa) e, para cada uma, procura o controlo em `.claude/settings.json` e `.claude/settings.local.json` (`permissions.deny`, hooks `PreToolUse`), no sandbox, e na CI quando a regra é sobre o que entra no repositório. Devolve, além do formato comum, uma tabela:

```
| Regra escrita (ficheiro:linha) | Controlo que a impõe | Estado |
|---|---|---|
| "nunca faças push para main" (CLAUDE.md:12) | `Bash(git push *)` no deny; nenhum hook | parcial — o deny não apanha `git -C . push` |
| "não leias o .env" (CLAUDE.md:15) | — | só texto |
```

Estados: **imposta** (há `deny` ou hook que a cobre por inteiro), **parcial** (cobre a forma óbvia mas não as variantes — um `deny` de shell sem hook, um hook só com `Bash` num projecto em Windows ou sem `Write|Edit`, D-PR08), **só texto** (nenhum controlo), e **assumida** (a própria regra diz que depende do modelo). A severidade segue o que a regra protege: só texto em segredos, publicação ou apagamento é **sério**; no resto, **reparo**.

Diz no relatório o que esta tabela não mede: uma regra só em texto **não é** uma regra ignorada — é uma regra cujo cumprimento depende do modelo e ninguém fica a saber quando falha ([regras-vs-controlos](${CLAUDE_PLUGIN_ROOT}/docs/regras-vs-controlos.md)). Sem ficheiros de instruções para agentes, a dimensão não corre e diz-se porquê.

A dimensão do peso do contexto corre `node ${CLAUDE_PLUGIN_ROOT}/skills/keel-init/contexto.mjs <repositório>` e põe a tabela que ele dá no relatório. Acima de 200 linhas é **reparo**, e o achado diz o que cortar: no CLAUDE.md, cada parágrafo que o agente acertaria sem o ler (visão geral, árvore de pastas, descrição da arquitectura) sai primeiro; um núcleo acima de 60 linhas parte-se em regras com `paths:`. Lista também as skills próprias do repositório com mais de 200 linhas no `SKILL.md`.

Um repositório pode cair em mais do que um domínio, e aí leva as dimensões de todos — uma loja B2B é `comercio-digital` e `salesforce`. A dimensão de IA generativa só entra se houver Agentforce ou Prompt Builder; sem isso, diz no relatório que ficou de fora, como fazes com as outras.

Ficam de fora, de propósito: o resto do `dev-com-agentes` (é sobre como se desenvolve, não sobre o que está escrito — só as regras de controlo e de peso do contexto acima entram, porque essas deixam rasto nos ficheiros), e `dados-e-ml`, `nlp` e `ux` (só entram se o repositório tiver essa matéria — se tiver, acrescenta a dimensão). Diz no relatório que ficaram de fora.

O que cada leitor devolve, no seu ficheiro:

```
# <dimensão>

<N> regras verificadas. <N> cumpridas, <N> violadas, <N> sem matéria no repositório.

## Achados
### [severidade] <ID da regra> — <título>
**Onde:** <ficheiro:linha>, e mais <n> sítios
**O que lá está:** <o código, curto>
**Porquê importa:** <a consequência, não a regra repetida>
**O que fazer:** <uma frase>

## Cumpridas
<lista de IDs numa linha>

## Sem matéria
<IDs de regras que este repositório não tem como violar, e porquê>
```

**Severidades**, e usa-as com rigor:

- **Bloqueante** — perde dados, expõe dados de um cliente a outro, ou torna o alvo inalcançável sem refazer.
- **Sério** — viola uma regra com consequência real em produção.
- **Reparo** — viola uma regra sem consequência imediata.
- **Nota** — observação que nenhuma regra sustenta. Só entra com a razão técnica escrita por extenso.
