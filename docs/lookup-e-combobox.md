# Escolher um registo: Lookup, Combobox ou `<select>` — referência confirmada

Confirmado a 2026-11-23 no padrão combobox da W3C, na documentação do React Aria e no registo do npm.
Serve o mesmo papel que `react-flow.md`: é a referência contra a qual as regras RCT-055 a RCT-059 se escrevem.

Fontes: [ARIA APG — Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) ·
[React Aria — ComboBox](https://react-aria.adobe.com/ComboBox) ·
[`react-aria-components` no npm](https://www.npmjs.com/package/react-aria-components) (1.22.1)

## Qual dos três

| A lista | Componente | Porquê |
|---|---|---|
| Cresce e vive no servidor (clientes, produtos, transportadoras) | **Lookup**: pesquisa no servidor, «Mostrar todos os resultados» num diálogo, «+ Novo» | ninguém percorre 500 linhas; a pesquisa é a única navegação |
| Média e conhecida (tabelas de preço, países, condições de pagamento) | **Combobox**: filtra no browser, «+ Criar» opcional | cabe em memória; a pesquisa poupa o scroll |
| Até cerca de 10 opções fixas (sim/não, CIF/FOB, status) | **`<select>` nativo** | ver tudo de uma vez é mais rápido do que escrever |

O Lookup segue o modelo do Salesforce, que quem usa CRM já conhece: escrever, ver poucas sugestões com duas linhas
cada uma, abrir a pesquisa avançada quando as sugestões não chegam, criar sem sair do formulário, e ver o escolhido
como etiqueta com «×». Este comportamento não foi confirmado na página do SLDS (o endereço redirecciona para o site
v1, já descontinuado); escreve-se como padrão de mercado, e não como referência.

## O padrão combobox (W3C APG)

- O campo tem `role="combobox"`; `aria-controls` aponta para o popup (listbox, grid ou dialog); `aria-expanded`
  é `true` com o popup visível; `aria-autocomplete` é `none`, `list` ou `both`.
- O foco fica no campo; a opção activa marca-se com `aria-activedescendant`, e a escolhida com `aria-selected`.
- Teclado: ↓ entra no popup; ↑ (opcional) vai à última; Enter aceita a opção activa; Esc fecha (e pode limpar);
  Alt+↓ / Alt+↑ (opcionais) abrem e fecham sem mover o foco. Home/End são opcionais e só dentro da listbox.

Escrever isto à mão com `div`s é o caminho por omissão, e quase sempre falha numa destas peças sem dar erro.

## React Aria Components

- `ComboBox` com `items` ou `defaultItems`, `inputValue`/`onInputChange` (pesquisa controlada, para ir ao servidor),
  `value`/`onChange`, `defaultFilter(textValue, inputValue)` (filtro próprio, por exemplo sem acentos),
  `allowsCustomValue`, `allowsEmptyCollection` (mantém o popup aberto sem itens, para mostrar o estado vazio),
  `menuTrigger` (`input`, `focus` ou `manual`).
- Um item pode ter `onAction`: é assim que entram as linhas «Mostrar todos os resultados» e «+ Novo».
- Não traz estilos; o tema é do projecto (Tailwind). A virtualização não está documentada na página do ComboBox:
  a lista do popup limita-se a poucas sugestões, e as listas longas vão para o diálogo.
- Alternativa mais leve: `cmdk` com Radix (o «Combobox» do shadcn); aí o padrão APG e a pesquisa no servidor ficam
  por conta de quem escreve.
