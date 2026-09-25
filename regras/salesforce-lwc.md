# Regras — Salesforce: Lightning Web Components

Prefixo `LWC`. ## Estado e reactividade

### LWC-001 — Substituir o objecto, não mutar o campo

**Regra:** Para actualizar um objecto ou um array que o template mostra, atribui uma cópia nova com o operador spread à propriedade inteira, em vez de escrever num campo interno (`this.address.city = ...`) ou de empurrar elementos para dentro do array.
**Porquê:** O motor só observa o valor atribuído directamente à propriedade; alterar um campo interno não dispara a re-renderização e a UI fica com o valor antigo. A alternativa, `@track`, obriga a importar o decorador e a vigiar a estrutura toda.
**Como verificar:** No diff, nenhuma atribuição a uma propriedade aninhada de estado (`this.x.y = ...`); as actualizações passam por `this.x = {...this.x, y: valor}` ou equivalente para arrays.
**Cursos:** 1

### LWC-002 — Copiar antes de transformar o que vem do pai

**Regra:** Num setter que recebe um objecto do componente pai, cria primeiro uma cópia com o operador spread e altera a cópia; nunca escrevas directamente no objecto recebido.
**Porquê:** O dado que chega do pai é só de leitura — mutá-lo no setter lança erro em runtime assim que a página carrega.
**Como verificar:** No corpo do setter não há atribuições a propriedades do parâmetro recebido; há uma cópia (`{...data, ...}`) antes de qualquer transformação.
**Cursos:** 1

### LWC-003 — Chave única em cada loop de template

**Regra:** Dá um atributo `key` ao primeiro elemento dentro de qualquer loop de template (for each ou iterator), com um valor único e do tipo string ou número — nunca o índice do loop nem um objecto.
**Porquê:** É por essa chave que o motor identifica que item foi acrescentado, removido ou alterado; sem ela o componente nem compila, e com o índice a identificação deixa de ser estável.
**Como verificar:** Todo o loop no HTML tem `key` no elemento imediatamente a seguir ao `template`, e o valor é um identificador do registo, não a variável de índice.
**Cursos:** 1

## Template, DOM e estilos

### LWC-004 — DOM só através de `this.template`

**Regra:** Acede a elementos do componente com `this.template.querySelector` ou `this.template.querySelectorAll`, nunca com `document.querySelector`.
**Porquê:** `this.template` aponta para o template do próprio componente; o `document` do browser alcançaria a página inteira e atravessaria a fronteira do componente.
**Como verificar:** Grep por `document.` no JavaScript do bundle: não deve haver ocorrências de acesso ao DOM; todas as queries começam em `this.template`.
**Cursos:** 1

### LWC-005 — Estilo calculado num getter, não no atributo

**Regra:** Quando um valor de estilo depende de dados (largura, percentagem, cor calculada), devolve a declaração completa a partir de um getter e liga o atributo `style` a esse getter, em vez de tentar interpolar a propriedade dentro do atributo no HTML.
**Porquê:** O template não avalia expressões no atributo `style`; o getter monta a string com interpolação em JavaScript e é reavaliado sempre que a propriedade muda.
**Como verificar:** No HTML, `style` liga-se a um nome de getter; no JS existe o getter que devolve a string com a unidade incluída. Não há concatenação de valores dentro do atributo.
**Cursos:** 1

### LWC-006 — Estilizar por classe, tag ou pseudo-classe, nunca por ID

**Regra:** No CSS de um componente usa selectores de elemento, de classe ou de pseudo-classe; não escrevas selectores por ID e reserva o estilo inline para valores que só existem em runtime.
**Porquê:** A própria Salesforce desaconselha estilizar por ID em Lightning Web Components, e o estilo inline tem a precedência mais alta e espalha-se por cada elemento, o que o torna difícil de ler e de manter.
**Como verificar:** O ficheiro `.css` do bundle não tem selectores `#...`; no HTML, atributos `style` só aparecem ligados a getters (ver LWC-005).
**Cursos:** 1

## Ciclo de vida e assincronismo

### LWC-007 — Bibliotecas de terceiros no `renderedCallback`, com guarda e `Promise.all`

**Regra:** Carrega bibliotecas externas com `loadScript`/`loadStyle` dentro do `renderedCallback`, protege a chamada com uma propriedade booleana que marca o que já foi carregado, e espera por várias com `Promise.all` antes de usar a biblioteca.
**Porquê:** O `renderedCallback` é o único ponto que garante que o HTML do componente já está renderizado, mas volta a correr a cada alteração do componente — sem a guarda, a biblioteca seria carregada outra vez a cada render.
**Como verificar:** No `renderedCallback` a primeira instrução é o teste à flag; a flag passa a verdadeira dentro do `then`; quando há mais do que um ficheiro, as promises vão todas num `Promise.all`.
**Cursos:** 1

### LWC-008 — Debounce nos handlers que disparam serviço

**Regra:** Num handler de digitação, de slider ou de caixa de selecção que dispare uma chamada ao servidor ou uma publicação de mensagem, guarda o identificador de `window.setTimeout` numa propriedade, cancela o temporizador anterior a cada chamada e só dispara no fim do atraso — no projecto do curso, 400 milissegundos.
**Porquê:** Sem debounce, seis teclas dão seis chamadas ao serviço e arrastar um slider dá uma por passo; o atraso junta a rajada numa chamada só.
**Como verificar:** O handler cancela o temporizador guardado antes de criar o novo, e a lógica de chamada está toda dentro da função passada ao temporizador.
**Cursos:** 1

## Comunicação entre componentes

### LWC-009 — `@api` para o que o pai usa, kebab-case no atributo

**Regra:** Decora com `@api` (importado de `lwc`) toda a propriedade que o pai preencha, e escreve o atributo correspondente no HTML do pai em kebab-case, convertendo cada maiúscula do nome camelCase num hífen com a letra minúscula.
**Porquê:** Sem o decorador a propriedade é local e o pai não lhe chega; os atributos HTML não distinguem maiúsculas, por isso `cardHeading` só é alcançável como `card-heading`.
**Como verificar:** Cada atributo passado ao filho no HTML corresponde a uma propriedade `@api` do filho, com o nome convertido; não há atributos em camelCase no markup.
**Cursos:** 1

### LWC-010 — Nome de evento em minúsculas, sem espaços e sem `on`

**Regra:** Nomeia os eventos customizados com uma string só em minúsculas, sem espaços e sem o prefixo `on` (`close`, não `onClose` nem `on close`).
**Porquê:** O nome com maiúsculas ou espaços não é aceite; o `on` pertence ao atributo que escuta o evento no markup do pai, não ao nome do evento.
**Como verificar:** Cada `new CustomEvent('...')` tem o nome em minúsculas e sem prefixo; no HTML do pai o mesmo nome aparece precedido de `on`.
**Cursos:** 1

### LWC-011 — Dados do evento só em `detail`

**Regra:** Transporta os dados de um evento customizado na propriedade `detail` do objecto de opções, e lê-os no pai por `event.detail`; não inventes outros nomes de propriedade para a carga.
**Porquê:** `detail` é a propriedade padrão do `CustomEvent` e a única que chega ao handler do pai; qualquer outro nome é ignorado.
**Como verificar:** Os `new CustomEvent` passam a carga dentro de `{ detail: ... }`; os handlers no pai lêem `event.detail` (ou um campo dele), e não outras propriedades do evento.
**Cursos:** 1

### LWC-012 — Subscrição de canal guardada e desfeita

**Regra:** Subscreve o canal do Lightning Message Service no `connectedCallback`, com o scope ao nível da aplicação, guarda o valor devolvido pela subscrição numa propriedade do componente e usa essa referência para desfazer a subscrição quando o componente sai do ecrã.
**Porquê:** A subscrição só se desfaz com a referência que o `subscribe` devolveu; deixá-la viva depois de o componente ser removido do DOM é uma das origens de fugas de memória que o `disconnectedCallback` existe para evitar.
**Como verificar:** Existe uma propriedade que guarda a subscrição, a chamada a `subscribe` está no `connectedCallback` com o scope de aplicação, e há um `unsubscribe` com essa propriedade no fim do ciclo de vida.
**Cursos:** 1

## Dados do Salesforce

### LWC-013 — `$` para as propriedades reactivas do `@wire`

**Regra:** Na configuração de um adaptador `@wire`, escreve as propriedades que devem ser reactivas como string com `$` à frente do nome, sem `this` (`'$recordId'`, nunca `'$this.recordId'`).
**Porquê:** Sem o `$`, o adaptador corre uma vez com o valor que existir no arranque — muitas vezes `undefined`, porque o valor chega de forma assíncrona — e não volta a correr quando o valor aparece.
**Como verificar:** Nas configurações de `@wire`, cada parâmetro vindo de uma propriedade do componente está entre aspas, começa por `$` e não contém `this.`.
**Cursos:** 1

### LWC-014 — Método Apex exposto: `static` e `@AuraEnabled`

**Regra:** Um método Apex chamado a partir de um LWC tem de ser `static`, `public` ou `global`, e estar anotado com `@AuraEnabled`.
**Porquê:** Sem a anotação e sem `static`, o método simplesmente não é importável pelo componente.
**Como verificar:** Cada método importado de `@salesforce/apex/...` corresponde, na classe, a um método `static` com `@AuraEnabled` imediatamente acima.
**Cursos:** 1

### LWC-015 — `cacheable=true` só em leituras; escritas por chamada imperativa

**Regra:** Marca `cacheable=true` apenas nos métodos Apex que só lêem dados, e chama imperativamente — não por `@wire` — qualquer método que insira, actualize ou apague registos, ou cuja invocação parta de uma acção do utilizador.
**Porquê:** Um método com `cacheable=true` não pode fazer DML, e o `@wire` decide sozinho quando corre; quando é preciso controlar o momento da invocação, a chamada imperativa é a via.
**Como verificar:** Nenhum método com `cacheable=true` faz DML; os handlers de botões e os métodos de escrita são chamados com a função importada e o resultado tratado com `then`/`catch`.
**Cursos:** 1

### LWC-016 — `refreshApex` com a propriedade completa do wire

**Regra:** Depois de gravar, actualiza a vista com `refreshApex` (importado de `@salesforce/apex`) passando a propriedade onde o `@wire` depositou o resultado inteiro, não os dados já extraídos dela, e limpa os valores em rascunho da tabela na mesma sequência.
**Porquê:** `refreshApex` precisa da referência devolvida pelo wire para saber que pedido repetir; pedir ao utilizador que recarregue a página para ver os dados novos é má experiência de utilização.
**Como verificar:** O argumento de `refreshApex` é a mesma propriedade decorada com `@wire` (ou a variável onde a função wire guardou o resultado completo), e não `...data`; a limpeza dos rascunhos acontece no mesmo `then`.
**Cursos:** 1

### LWC-017 — Trusted Site antes de chamar um domínio externo

**Regra:** Antes de testar um `fetch` de um LWC para um domínio externo, cria o Trusted Site desse domínio em Setup e espera cerca de um minuto até ficar activo.
**Porquê:** A content security policy da org recusa a ligação a qualquer domínio que não esteja na lista, e o erro aparece na consola mesmo com o código correcto.
**Como verificar:** Para cada domínio chamado por `fetch` no componente existe o Trusted Site correspondente registado; o erro de ligação recusada na consola indica que falta.
**Cursos:** 1

## Configuração e exposição

### LWC-018 — `isExposed` e `targets` antes de colocar o componente

**Regra:** No `js-meta.xml`, põe `isExposed` a `true` e declara pelo menos um target antes de tentar colocar o componente numa página; cada propriedade declarada em `targetConfig` tem de ter, no JavaScript, uma propriedade `@api` com exactamente o mesmo nome.
**Porquê:** `isExposed` é `false` por omissão, e nesse estado o componente nem aparece na pesquisa do App Builder; sem a propriedade `@api` correspondente, o valor configurado na página não chega ao componente.
**Como verificar:** O `js-meta.xml` tem `isExposed` verdadeiro e o bloco de targets preenchido; cada nome de propriedade da configuração existe no JS decorado com `@api`.
**Cursos:** 1
