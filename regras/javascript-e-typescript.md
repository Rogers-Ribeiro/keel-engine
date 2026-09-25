# Regras — javascript-e-typescript

Prefixo `JS`. As secções a partir de «Biome» são a excepção: não saem de curso nenhum — nenhum ensina esta parte do stack — e saem das referências confirmadas em `../docs/`.

## Módulos e estrutura do projecto

### JS-001 — Declarar o sistema de módulos no `package.json`

**Regra:** declara `"type"` no `package.json` (`"module"` ou `"commonjs"`) e usa um só estilo de módulos em todo o projecto; não deixes o Node inferir o estilo pelo conteúdo dos ficheiros.
**Porquê:** sem o campo declarado, o Node lê o texto de cada ficheiro para descobrir se é ESM, e avisa que isso tem custo de desempenho; misturar os dois estilos no mesmo projecto dá erro em runtime (`import` num ficheiro declarado como CommonJS).
**Como verificar:** o `package.json` tem o campo `"type"`; nenhum ficheiro `.js` do projecto mistura `import`/`export` com `require`/`module.exports`.
**Cursos:** 2

### JS-002 — ES Modules em código novo

**Regra:** escreve código novo com `import`/`export` (ES Modules); não uses namespaces do TypeScript nem `require` em ficheiros novos.
**Porquê:** é o standard de JavaScript e o que o Node empurra no código moderno; com namespaces o compilador não acusa uma dependência em falta e a aplicação só quebra em runtime.
**Como verificar:** não há `namespace` nem `/// <reference path=...>` em ficheiros novos; ficheiros novos de Node não usam `require`.
**Cursos:** 2

### JS-003 — Cada ficheiro importa o que usa

**Regra:** importa em cada ficheiro tudo o que esse ficheiro usa directamente, mesmo que o símbolo já esteja disponível porque outro ficheiro carregado antes o importou.
**Porquê:** depender de uma importação feita noutro ficheiro faz a aplicação quebrar quando essa importação for removida — uma alteração aparentemente não relacionada parte código noutro sítio.
**Como verificar:** cada identificador externo usado num ficheiro aparece na lista de `import` desse mesmo ficheiro; nenhum ficheiro serve de "sítio onde se importa tudo" para os outros.
**Cursos:** 1

### JS-004 — `.js` nos imports relativos de um projecto Node ESM

**Regra:** num projecto Node em ESM, termina os caminhos relativos dos `import` em `.js`, mesmo quando o ficheiro de origem é `.ts`.
**Porquê:** a extensão é exigida pelo Node, e o que corre é o JavaScript compilado; escrever `.ts` compila sem erro mas falha ao executar.
**Como verificar:** nenhum `import` relativo fica sem extensão ou com `.ts` num projecto Node ESM.
**Cursos:** 1

## Compilador, dependências e build

### JS-005 — `strict: true` no `tsconfig.json`

**Regra:** liga `strict: true` no `tsconfig.json` de qualquer projecto TypeScript e não desligues verificações individuais para calar erros.
**Porquê:** é o que activa, entre outras, `noImplicitAny` (obriga a anotar o que não pode ser inferido) e `strictNullChecks` (obriga a tratar `null`); sem isso perde-se a maior parte da vantagem de usar TypeScript.
**Como verificar:** o `tsconfig.json` tem `strict` a `true` e não tem verificações do bloco de type checking desligadas sem justificação escrita.
**Cursos:** 1

### JS-006 — TypeScript como dependência do próprio projecto

**Regra:** instala o TypeScript como dependência de desenvolvimento do projecto (`--save-dev`) e invoca o compilador por um script do `package.json`, mesmo que também o tenhas instalado globalmente.
**Porquê:** fixa a versão usada nesse projecto — projectos diferentes podem precisar de versões diferentes — e permite construir o projecto numa máquina que não tenha o compilador instalado globalmente.
**Como verificar:** `typescript` aparece em `devDependencies`; os scripts de compilação chamam `tsc` sem depender de uma instalação global.
**Cursos:** 1

### JS-007 — Tipos de bibliotecas: verificar primeiro, instalar `@types` depois

**Regra:** antes de instalar tipos para uma biblioteca, importa-a e vê se já traz os seus (há autocompletar e nenhum erro); só se não trouxer é que instalas `@types/<nome>` como dependência de desenvolvimento.
**Porquê:** bibliotecas escritas em TypeScript já incluem as definições e não precisam de pacote extra; as que são só JavaScript falham com erro de declarações em falta e resolvem-se com o pacote do DefinitelyTyped.
**Como verificar:** cada `@types/...` em `devDependencies` corresponde a uma biblioteca que não traz tipos próprios; nenhum `@types/...` está em `dependencies`.
**Cursos:** 1

### JS-008 — Ferramenta de build quando o projecto tem mais do que TypeScript

**Regra:** usa uma ferramenta de build (no curso, o Vite, criado com `npm create vite@latest`) em qualquer projecto que tenha ficheiros além de `.ts` — HTML, CSS, imagens; não tentes produzir a pasta de distribuição só com `tsc`.
**Porquê:** o `tsc` é apenas um compilador de TypeScript: gera o `.js` e não copia mais nada, pelo que a pasta `dist` fica sem o HTML e o CSS e não dá um site implantável.
**Como verificar:** o script de build do `package.json` não é só `tsc` quando existem ficheiros não-TypeScript no código-fonte; a pasta de saída contém tudo o que é preciso para implantar.
**Cursos:** 1

## Tipos: o que escrever e o que não escrever

### JS-009 — `any` só em último recurso

**Regra:** não uses `any` como atalho para "não sei o tipo": quando conheces os tipos possíveis usa uma união; quando só os conheces em runtime usa `unknown` e verifica antes de aceder (`typeof`, `in`).
**Porquê:** `any` aceita tudo e devolve-te ao JavaScript sem tipos — perde-se o autocompletar e o erro só aparece em execução; `unknown` obriga a verificar antes de usar e evita o erro em runtime.
**Como verificar:** procura `any` no diff; cada ocorrência tem de ter motivo escrito, e os valores de origem desconhecida chegam como `unknown` com verificação antes do primeiro acesso.
**Cursos:** 1

### JS-010 — Anotar o que a inferência não dá, e só isso

**Regra:** anota o tipo das declarações sem valor inicial e dos parâmetros de função que não têm valor por omissão; não anotes o que já é inferido a partir de um valor inicial.
**Porquê:** o compilador não consegue inferir o tipo de uma variável declarada vazia nem do parâmetro de uma função, mas infere-o de um valor inicial — e anotar por cima é trabalho redundante que o curso classifica como má prática.
**Como verificar:** no diff, nenhuma declaração com valor inicial leva anotação redundante; nenhum parâmetro de função fica sem tipo (com `strict`, isso é erro de compilação).
**Cursos:** 1

### JS-011 — Alias de tipo para a definição usada em mais do que um sítio

**Regra:** dá nome com `type` (ou uma interface) a qualquer definição de tipo usada em mais do que um sítio — parâmetro, retorno, variável — em vez de a repetir.
**Porquê:** copiar a definição obriga a alterar todas as cópias quando uma opção muda ou é acrescentada, e é fácil esquecer uma, o que introduz erros subtis.
**Como verificar:** no diff, nenhuma união de literais ou tipo de objecto aparece escrito por extenso em dois sítios.
**Cursos:** 1

### JS-012 — União discriminada por propriedade literal

**Regra:** numa união de tipos de objecto, distingue os membros por uma propriedade partilhada com valor literal (por exemplo `type: "file"` e `type: "db"`), em vez de testar a existência de propriedades específicas.
**Porquê:** os nomes das propriedades específicas podem mudar no futuro e partem o type guard em silêncio; a propriedade discriminante existe garantidamente em todos os membros e o compilador restringe o tipo a partir do valor dela.
**Como verificar:** cada união de objectos do projecto tem propriedade discriminante e os `if` que a tratam comparam essa propriedade, não a existência de outras.
**Cursos:** 1

### JS-013 — Type guard repetido vira função

**Regra:** quando a mesma verificação de tipo é precisa em mais do que um sítio, isola-a numa função que devolve a comparação (`isFile(source)`) e usa essa função nos `if`.
**Porquê:** o TypeScript infere no retorno um type predicate, e não apenas `boolean`, pelo que a informação de tipo se propaga a quem chama a função — a verificação deixa de ser repetida sem se perder o estreitamento.
**Como verificar:** a mesma condição de tipo não aparece escrita em dois `if` diferentes; as funções de verificação são usadas directamente na condição.
**Cursos:** 1

### JS-014 — Marcador genérico restringido, em vez de `any`

**Regra:** numa função ou tipo que trabalha com vários tipos de valor, usa um marcador genérico (`T`) em vez de `any`, e restringe-o com `extends` quando o corpo precisa de uma forma concreta (`T extends object`).
**Porquê:** com `any` a informação de tipo perde-se no retorno e quem chama fica sem autocompletar; o marcador preserva-a e é normalmente inferido a partir dos argumentos. Sem restrição, aceitam-se valores para os quais o corpo não funciona — por exemplo espalhar números com o operador spread, que devolve um objecto vazio.
**Como verificar:** nenhuma função utilitária declara parâmetros como `any`; cada marcador genérico cujo corpo acede a propriedades ou espalha o valor tem `extends`.
**Cursos:** 1

### JS-015 — Derivar tipos do que já existe

**Regra:** deriva o tipo a partir do valor ou do tipo que já existe — `typeof` sobre um objecto de configuração, e os utilitários embutidos (`ReturnType`, `Partial`) antes de construíres um utilitário próprio — em vez de escrever a definição à mão.
**Porquê:** escrever à mão o tipo de um objecto que já existe é trabalho repetido e propenso a gralhas, e as duas definições desincronizam-se quando o valor muda; os utilitários que o TypeScript já traz fazem o que se construiria com mapped e conditional types.
**Como verificar:** no diff, nenhum tipo de objecto duplica a forma de um valor que existe no código; nenhum utilitário escrito à mão repete um embutido.
**Cursos:** 1

## Fronteiras do sistema e validação em runtime

### JS-016 — Validar em runtime tudo o que vem de fora

**Regra:** valida com um esquema de uma biblioteca TypeScript-first (no curso, o Zod: `z.object`, `z.string`, `z.array`, `z.union`, seguido de `.parse()`) todos os dados que entram de fora do sistema de tipos — ficheiros, respostas de rede, input do utilizador.
**Porquê:** os tipos do TypeScript desaparecem na compilação e não validam nada em execução; o que vem de um ficheiro ou de um pedido chega como `any` e pode não ter a forma esperada, porque é gerado pelo utilizador ou porque o formato muda com o tempo. Se o `.parse()` não lançar, o valor devolvido já vem tipado.
**Como verificar:** cada ponto de entrada de dados externos passa por `.parse()` de um esquema antes de o valor ser usado; nenhum valor lido de ficheiro ou de rede é usado directamente depois de `JSON.parse`.
**Cursos:** 1

### JS-017 — O tipo sai do esquema, não da mão

**Regra:** quando precisares do tipo dos dados validados, deriva-o do esquema com `z.infer<typeof esquema>`; não escrevas um alias de tipo paralelo ao esquema.
**Porquê:** um alias escrito à mão tem de ser alterado sempre que o esquema muda, e esquecê-lo é fácil; `z.infer` mantém os dois sincronizados por construção.
**Como verificar:** não existe nenhum `type` que repita a forma de um esquema de validação declarado no mesmo projecto.
**Cursos:** 1

### JS-018 — Tipo próprio para a resposta de uma chamada HTTP

**Regra:** define um tipo para a resposta que esperas de cada chamada HTTP, com apenas os campos que usas, e passa-o ao cliente como parâmetro genérico (`axios.get<RespostaX>(...)`).
**Porquê:** sem isso a resposta é tratada como qualquer coisa: não há autocompletar e o compilador aceita o acesso a campos que não existem, pelo que o erro só aparece em execução. O compilador não pode saber o que vem num URL.
**Como verificar:** nenhuma chamada HTTP fica sem tipo de resposta declarado; o tipo declarado cobre os campos efectivamente lidos, incluindo o campo de estado quando a resposta tem um.
**Cursos:** 1

### JS-019 — Codificar o texto do utilizador antes de o pôr num URL

**Regra:** passa qualquer texto introduzido pelo utilizador por `encodeURI` antes de o interpolar num URL de pedido.
**Porquê:** o texto pode conter espaços, vírgulas e outros caracteres que não são válidos num URL; a função converte-o numa forma compatível.
**Como verificar:** em cada URL construído com template literal, os valores vindos de input do utilizador aparecem dentro da chamada de codificação.
**Cursos:** 1

## Servidor, dados e segredos

### JS-020 — Assíncrono em código que atende pedidos

**Regra:** em código de servidor, usa sempre a variante assíncrona quando existe — `readFile` e não `readFileSync` — e, em código novo, a API de promessas do Node (`fs/promises`) com `async`/`await` em vez de callbacks.
**Porquê:** uma chamada síncrona bloqueia a execução até terminar e a aplicação fica parada para todos os utilizadores em simultâneo; com a versão assíncrona o motor continua a correr e o callback entra quando os dados chegam. A forma com `async`/`await` é mais fácil de ler, manter e depurar do que a de callbacks.
**Como verificar:** procura `Sync` no diff de código de servidor; procura callbacks com o parâmetro de erro à cabeça em módulos que já têm versão de promessas.
**Cursos:** 1

### JS-021 — Streams para dados grandes

**Regra:** processa ficheiros e respostas grandes em stream, ligando as peças com `pipe()` ou `pipeline`, em vez de carregar o conteúdo todo para memória antes de o enviar ou transformar.
**Porquê:** com streams o buffer mantém-se pequeno e cada pedaço segue à medida que chega, o que torna a aplicação mais rápida e mais responsiva; carregar o ficheiro inteiro para o enviar depois cresce com o número de utilizadores em simultâneo.
**Como verificar:** as leituras de ficheiro que alimentam uma resposta usam `createReadStream` com `pipe` para o destino; quando se lê tudo para memória, há motivo escrito.
**Cursos:** 1

### JS-022 — Segredos em variáveis de ambiente, nunca no código

**Regra:** guarda strings de ligação, chaves e palavras-passe em variáveis de ambiente lidas por `process.env`, num ficheiro `.env` que fica fora do controlo de versões — nunca escritas no código.
**Porquê:** centraliza o valor num sítio só, para se mudar numa única alteração, e impede que o segredo seja publicado no repositório onde qualquer pessoa o pode ler.
**Como verificar:** nenhuma string de ligação ou chave aparece em ficheiros de código; o `.env` está ignorado no controlo de versões e existe um exemplo sem valores reais.
**Cursos:** 1

### JS-023 — Tratar o erro da base de dados dentro da rota

**Regra:** trata o erro de cada chamada à base de dados dentro do handler da rota e responde com um estado HTTP adequado (500 para falha, 404 para não encontrado) e uma mensagem em JSON.
**Porquê:** sem isso o pedido fica sem resposta quando a consulta falha, e quem chamou a API não tem como distinguir uma falha de um resultado vazio; a mensagem devolvida é o que permite depurar.
**Como verificar:** nenhuma chamada à base de dados numa rota fica sem ramo de erro; cada ramo de erro devolve estado e corpo, não só um registo no log.
**Cursos:** 1

### JS-024 — Contrato de dados da API estável quando a implementação muda

**Regra:** quando trocares a persistência, mantém o formato dos dados que a API devolve e converte os nomes internos antes de responder (por exemplo, `_id` do MongoDB para `id`); não mudes o cliente para acompanhar a base de dados.
**Porquê:** o cliente fica acoplado a nomes internos e passa a ser preciso reescrevê-lo sempre que a persistência muda; transformar a resposta no servidor é uma função pequena e resolve o problema num só sítio.
**Como verificar:** o formato devolvido por cada rota é o mesmo antes e depois da mudança de persistência; a transformação está numa função única aplicada em todas as rotas que devolvem esse recurso.
**Cursos:** 1

## Biome

Nenhum curso da base ensina Biome; o que ensinam é ESLint e Prettier, que são as duas ferramentas
que ele substitui. Estas regras saem da referência [biome](../docs/biome.md).

### JS-025 — A versão do Biome é fixa

**Regra:** instala-se com `-E`, que fixa a versão exacta em vez de aceitar as seguintes.
**Porquê:** um formatador que muda de versão sozinho reformata ficheiros que ninguém tocou. O diff seguinte fica ilegível, e a revisão passa a ser sobre espaços em vez de ser sobre código. É por isso que a documentação oficial traz o `-E` no comando de instalação.
**Como verificar:** no `package.json`, a entrada do Biome é uma versão exacta, sem acento circunflexo nem til à frente.
**Fonte:** [biome](../docs/biome.md)
**Cursos:** 0

### JS-026 — Em integração contínua corre-se `biome ci`

**Regra:** o pipeline corre `biome ci`, nunca `biome check --write`.
**Porquê:** em CI não se corrigem ficheiros, verifica-se que já estão certos e falha-se quando não estão. Um pipeline que escreve no código esconde o problema em vez de o mostrar, e o programador seguinte recebe alterações que não fez.
**Como verificar:** nos ficheiros de workflow, o comando do Biome não tem `--write`.
**Fonte:** [biome](../docs/biome.md)
**Cursos:** 0

### JS-027 — O `--unsafe` não entra em nada automático

**Regra:** `--unsafe` corre-se à mão, lê-se o diff, e não entra em hooks, scripts de commit nem CI.
**Porquê:** são as correcções que o próprio Biome classifica como capazes de mudar comportamento. Aplicadas sem ninguém ver, mudam o que o código faz e o diff aparece misturado com formatação.
**Como verificar:** procura `--unsafe` em hooks, scripts do `package.json` e workflows; devolve vazio.
**Fonte:** [biome](../docs/biome.md)
**Cursos:** 0

### JS-028 — Uma ferramenta só formata

**Regra:** adoptado o Biome, saem o Prettier e as regras de formatação do ESLint. Não coexistem dois formatadores.
**Porquê:** dois formatadores com opiniões diferentes sobre o mesmo ficheiro dão um ciclo: um corre, o outro desfaz, e o ficheiro muda a cada gravação sem ninguém perceber porquê.
**Como verificar:** o `package.json` não tem Prettier ao lado do Biome, e não há `.prettierrc` nem regras de formatação activas no ESLint.
**Fonte:** [biome](../docs/biome.md)
**Cursos:** 0
