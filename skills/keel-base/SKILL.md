---
name: keel-base
description: Use quando for preciso a base de conhecimento completa por trás das regras — as transcrições dos cursos, as notas por secção e as sínteses por tema. Traz o repositório com git clone e prepara a pesquisa semântica. Use quando o utilizador quiser confirmar a origem de uma regra, quando uma fonte não abrir, ou quando disser "traz a base", "preciso das transcrições" ou "/keel-base".
---

# keel-base — trazer a base de conhecimento

O plugin traz as regras e os agentes: algumas dezenas de ficheiros. A base de onde essas regras saíram — 25 cursos, milhares de transcrições, as notas por secção e as sínteses — fica num repositório à parte, porque tem dezenas de megabytes e não pode viajar com o plugin.

Esta skill traz essa base quando ela for mesmo precisa.

## Quando vale a pena

- Uma regra parece errada ou incompleta e queres ler a aula que a originou.
- Um link de fonte não abre.
- Queres pesquisar nos cursos com o MCP `cursos`, e não apenas ler as regras.

Para o trabalho normal não é preciso: as regras trazem a justificação e o modo de verificação.

## Passos

1. **Vê se já está cá.** Procura uma pasta com `cursos/`, `conhecimento/` e `regras/` — tipicamente `C:/Projects/Cursos/formacao-dev` ou onde o utilizador a tiver. Se existir, salta o clone.

2. **Clona**, se não existir. O repositório é privado; o acesso depende da conta autenticada:
   ```
   git clone https://github.com/Rogers-Ribeiro/keel.git <destino>
   ```
   Pergunta o destino antes de clonar. São dezenas de megabytes e milhares de ficheiros: diz isso antes, não depois.

3. **Prepara a pesquisa**, se o utilizador a quiser:
   ```
   cd <destino>/ferramentas/pesquisa
   uv run indexar --camadas L0,L1,L2
   ```
   A indexação envia o texto das aulas para a API de embeddings da OpenAI e usa a `OPENAI_API_KEY` do ambiente. **Diz o custo aproximado e confirma antes de correr** — não é uma operação gratuita.

   Duas coisas que a fazem falhar, e que deves verificar primeiro:
   - **o servidor MCP `cursos` tem de estar desligado**, ou o índice fica bloqueado e a gravação final falha;
   - a indexação é incremental e retoma de onde ficou, por isso um erro a meio não obriga a recomeçar do zero.

4. **Regista o servidor MCP**, se ainda não estiver:
   ```
   claude mcp add --scope user cursos -- <destino>/ferramentas/pesquisa/.venv/Scripts/servidor-cursos.exe
   ```
   Confirma com `claude mcp list`.

## Regras

- Nunca clones para dentro do repositório do projecto: a base é material de terceiros e não pertence ao código do utilizador.
- Nunca imprimas a `OPENAI_API_KEY` nem a escrevas em ficheiro nenhum.
- As transcrições são legendas automáticas de cursos comprados: servem para confirmar a origem de uma regra, não para redistribuir.
