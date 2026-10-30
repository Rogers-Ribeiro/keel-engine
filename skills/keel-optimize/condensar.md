# Condensar o CLAUDE.md e o núcleo sem perder uma decisão

O que entra em todas as sessões (`CLAUDE.md`, núcleos importados e regras sem `paths:`) tem de somar menos de 200 linhas (**PROC-037**). Esta página diz como se corta **sem mudar o que o projecto decidiu**.

## 1. Arquivar primeiro, integral

Antes de tocar em nada:

```
node ${CLAUDE_PLUGIN_ROOT}/skills/keel-optimize/projecto.mjs arquivar CLAUDE.md \
  --para docs/processo/claude-md-com-historico.md --titulo "CLAUDE.md com a história das decisões"
node ${CLAUDE_PLUGIN_ROOT}/skills/keel-optimize/projecto.mjs arquivar .agents/nucleo.md \
  --para docs/processo/nucleo-com-historico.md --titulo "Núcleo com a história das decisões"
```

O script recusa se o destino já existir, e confirma que o conteúdo ficou idêntico. Sem arquivo, não se condensa.

## 2. O que fica e o que sai

**Fica:** cada regra, com o seu ID; os comandos que não se adivinham pelo código; o que contraria o padrão da linguagem ou da plataforma; as fronteiras (quem decide o quê); as remissões que outros ficheiros fazem por título.

**Sai para o arquivo:** a história de cada regra («medido a…», «aconteceu a…»), as datas e os incidentes, as listas de ficheiros que o agente descobre a ler o código, a descrição da arquitectura em prosa e as partes duplicadas entre o `CLAUDE.md` e o núcleo.

Uma pergunta decide cada parágrafo: **o agente acertaria isto sem ler aqui?** Se sim, sai.

## 3. Cuidados

- **Antes de mudar um título, procura quem o cita** (`grep -rn "«título»"`, scripts e mensagens de erro incluídos). Títulos referidos mantêm-se.
- **Não mudes o sentido.** Encurtar é reescrever a mesma regra com menos palavras; se uma regra só se salva mudando, não é para condensar: é para perguntar.
- **Uma decisão do utilizador não se condensa em silêncio.** Se a história tem uma decisão datada («decidido por…»), a decisão fica, curta, e a data vai para o arquivo.
- Onde o `CLAUDE.md` cita o arquivo, diz-o numa linha no topo: «a história está em `docs/processo/…`».

## 4. Verificar

```
node ${CLAUDE_PLUGIN_ROOT}/skills/keel-init/contexto.mjs
```

Tem de dar «Dentro do limite». Depois conta os IDs: todos os que estavam no original estão no condensado ou no arquivo; `git grep` por cada um que tenha desaparecido do condensado.

## 5. Quando a medição de sessões se mexe pouco

Se a conclusão que trouxe aqui foi só «contexto fixo acima do limite», o ganho por chamada é pequeno (o fixo é uma fracção do que se lê). Diz ao utilizador, e propõe primeiro as conclusões de sessões.
