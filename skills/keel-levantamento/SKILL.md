---
name: keel-levantamento
description: Use quando for preciso auditar um repositório que já existe — o que está errado contra as regras, o que podia melhorar na arquitectura, e o que falta para chegar a um alvo (por exemplo tornar-se multi-tenant ou uma plataforma). Use antes de adoptar o Keel num projecto com código feito, antes de decidir entre continuar um sistema ou recomeçar, e quando o utilizador disser "analisa este código", "o que está mal aqui", "o que falta para isto ser X" ou "/keel-levantamento".
---

# keel-levantamento — auditar código que já existe

O `keel-init` escreve o contrato num projecto novo. Esta skill faz o passo anterior, quando já há código: **diz o que lá está, medido contra as regras**, para que a decisão seguinte — adoptar, refazer, ou recomeçar — seja tomada com factos.

Entregas um diagnóstico. **Não entregas um plano de reescrita e não mexes numa linha do código auditado.** A única coisa que escreves é o relatório.

## Três perguntas, três métodos

Não as misturas, porque respondem-se de maneiras diferentes e valem coisas diferentes:

1. **O que está errado** — mecânico. Cada regra tem um campo `**Como verificar:**` escrito exactamente para isto. Ou o código viola a regra ou não viola; não há opinião.
2. **O que podia melhorar** — juízo. Arquitectura, fronteiras, onde vive cada decisão. Sustenta-se nos princípios, não em gosto.
3. **O que falta para o alvo** — lista de lacunas contra uma capacidade que o utilizador nomeia. Só corre se houver alvo.

## Passo 0 — enquadrar

1. Pergunta **onde está o repositório** e **qual é o alvo**, se houver ("tornar-se um PaaS multi-tenant", "aguentar dez vezes o tráfego", "ser adoptável pelo Keel"). Sem alvo, corre só as perguntas 1 e 2.
2. Confirma que não estás a auditar a própria base do Keel nem o plugin.
3. Diz quanto isto custa antes de começar: são vários subagentes sobre um repositório inteiro. Se o utilizador quiser só uma dimensão, corre só essa.

## Passo 1 — ler o que o projecto já diz de si

**Antes de qualquer subagente.** Procura e lê, se existirem:

- `docs/adr/`, `docs/decisions/` — as decisões que já foram tomadas e porquê;
- ficheiros de lições, retrospectivas, `agent-lessons.md`, `POSTMORTEM*`, `TODO.md`, `NOTES.md`;
- o `README.md` e o `CLAUDE.md`/`AGENTS.md`, se houver;
- os últimos 50 commits (`git log --oneline -50`) e o que se repete neles.

É a leitura mais barata e de maior rendimento do levantamento inteiro: é o registo de quem lá esteve sobre o que correu mal. Auditar sem isto é redescobrir com trinta subagentes coisas que estavam escritas num ficheiro.

O que aprenderes aqui entra no enquadramento de **cada** subagente que lançares a seguir.

## Passo 2 — mapear, sem ler tudo

Mecânico e barato. Para o repositório:

- árvore de pastas até dois ou três níveis, e contagem de ficheiros e linhas por pasta;
- stack e versões (`pyproject.toml`, `package.json`, `requirements*.txt`, `Dockerfile`, `docker-compose*`);
- pontos de entrada (`main.py`, `app.py`, `manage.py`, rotas, `langgraph.json`, workers, tarefas agendadas);
- migrações e modelos de dados;
- o que existe de testes e de CI.

Guarda este mapa num ficheiro. É o que dás aos leitores, para nenhum ter de descobrir a estrutura sozinho.

## Passo 3 — os leitores, em paralelo

Um subagente por dimensão, **no máximo 5 ao mesmo tempo**. Cada um recebe: o mapa do passo 2, o que saiu do passo 1, os ficheiros de regras da sua dimensão, e o caminho do ficheiro onde escreve. Nenhum lê o repositório inteiro e nenhum escreve no código.

| Dimensão | Regras que lê |
|---|---|
| Arquitectura e fronteiras | `arquitetura.md`, `padroes-de-projeto.md` |
| Dados e isolamento entre tenants | `persistencia.md` |
| API, contratos, segurança e integrações | `api-e-contratos.md`, `seguranca.md`, `integracoes.md` |
| Agentes, grafos e prompts | `agentes-ia.md`, `llm-e-prompts.md`, `rag.md` |
| Operação: filas, observabilidade e deploy | `filas-e-concorrencia.md`, `observabilidade.md`, `producao-ia.md`, `docker-e-deploy.md` |
| Código e testes | `codigo-limpo.md`, `python.md`, `testes.md` |

As regras vêm de `${CLAUDE_PLUGIN_ROOT}/regras/`, **não do contrato do projecto**: o levantamento pergunta o que falta, e o que falta costuma estar nos temas que o projecto ainda não adoptou.

Ficam de fora, de propósito: `dev-com-agentes` (é sobre como se desenvolve, não sobre o que está escrito), e `dados-e-ml`, `nlp` e `ux` (só entram se o repositório tiver essa matéria — se tiver, acrescenta a dimensão). Diz no relatório que ficaram de fora.

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

## Passo 4 — o alvo, se houver

Passo separado, depois dos leitores, porque não se responde lendo regras: responde-se comparando o que existe com uma lista de capacidades. Para cada capacidade do alvo, uma linha: **existe**, **existe a meio**, ou **não existe** — com o ficheiro que o prova, ou a constatação de que não há ficheiro nenhum.

Quando o alvo é uma **plataforma multi-tenant**, a lista é esta, e a primeira linha é a que decide se o resto interessa:

| Capacidade | Como se verifica |
|---|---|
| Isolamento por tenant no armazenamento | DB-018 a DB-024: RLS activa **e** forçada, papel da aplicação que não é dono, `USING`+`WITH CHECK`, `set_config` com `is_local` a `true`, unicidade com `tenant_id` à cabeça, teste com dois tenants |
| Ciclo de vida de tenants | criar, suspender, apagar; quotas e limites por tenant |
| Registo e versionamento do que os tenants criam | versões, publicação, retorno a uma versão anterior |
| Execução isolada e com tecto | filas, workers, limite de iterações, timeout, orçamento de tokens |
| Observabilidade por tenant | traços, custo e auditoria atribuíveis a um tenant |
| API com contratos versionados e autorização por tenant | um pedido de um tenant nunca alcança dados de outro |
| Segredos por tenant | guardados e usados sem os revelar noutro tenant |

Se o isolamento não existir, di-lo primeiro e sem rodeios: **tudo o resto é acessório enquanto os dados de dois clientes puderem cruzar-se.**

## Passo 5 — juntar

Escreves **um** relatório em `docs/levantamento/<AAAA-MM-DD>/relatorio.md`, com os ficheiros de cada dimensão ao lado. Forma:

```
# Levantamento — <repositório>

<data>. <N> ficheiros, <N> linhas. Alvo: <alvo, ou "nenhum">.

## O veredicto em cinco linhas
<o que é este sistema, o que está são, o que está podre, e o que isso implica
 para a decisão que o utilizador tem em mãos>

## Bloqueantes
<os achados que mudam a decisão, por ordem de gravidade>

## O que falta para o alvo
<a tabela do passo 4>

## Por dimensão
<duas linhas por dimensão, com link para o ficheiro>

## O que já está bem
<o que não se deve estragar ao mexer — é tão importante como o resto>

## O que não foi visto
<o que ficou de fora e porquê>
```

## Regras do trabalho

- **Não inventes achados.** Um achado sem ID de regra e sem razão técnica por extenso não é um achado. Um número sem ficheiro que o prove não se escreve.
- **Não passes a saída dos subagentes pelo teu contexto.** Cada um escreve o seu ficheiro; tu lês os ficheiros para juntar. É a diferença entre um levantamento que cabe numa sessão e um que rebenta a meio.
- **Não proponhas uma reescrita.** Foste chamado para diagnosticar. A decisão de refazer é de quem paga, e precisa deste relatório para ser tomada.
- **O que está bem conta.** Um relatório só com defeitos leva quem o lê a deitar fora código que funciona.
- **Não mexas no repositório auditado** para lá do relatório. Sem formatar, sem corrigir "só uma coisinha", sem criar ramos.

## Quando acabas

Cinco linhas: quantas regras foram verificadas, quantos bloqueantes, o estado do alvo, onde está o relatório, e **a pergunta que o utilizador tem agora de responder**.

Se o levantamento for para decidir entre continuar um sistema e recomeçar, diz qual das duas os factos apoiam e com que confiança. Não empurres a decisão para cima do utilizador sem uma recomendação.
