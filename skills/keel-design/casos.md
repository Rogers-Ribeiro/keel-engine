# casos.md — os casos que fizeram esta skill

Ficheiro de apoio da skill `keel-design`. Não é preciso para correr os passos; serve para quando o
utilizador perguntar porquê, ou quando estiveres tentado a saltar um passo por parecer burocracia.
Os nomes dos projectos e dos clientes foram tirados.

## Caso 1 — a pergunta que não foi a quem decidia (passos 1, 2 e 4)

Num cartão VIP de um cliente, três requisitos escritos contradiziam-se: um tornava o produto
**obrigatório** na configuração de regras, outro tornava-o **opcional** no cartão, e um terceiro
exigia que as validações corressem **também** no VIP. Três textos, cada um coerente consigo próprio,
e juntos deixavam um cartão VIP sem origem documentada para as suas regras.

A pergunta — *o cartão VIP tem produto?* — chegou a ser formulada, e com **três saídas escritas**:
(a) configuração por segmento, (b) um produto interno de cortesia, (c) cartão sem regras de âmbito.
Não faltava análise. **O que faltou foi a pergunta ir ao cliente.** Foi respondida por inferência,
pela (b).

Três dias depois o cliente respondeu numa sessão de revisão — *«não faz sentido no VIP termos o
campo product»*, que é a (c) — e desfez-se um registo `Product2` na sandbox, um script de Apex e
todo o trabalho à volta.

O que cada passo teria feito:

- **Passo 1.** A premissa perguntada a quem não tinha lido nada teria trazido a dúvida ao de cima.
- **Passo 2.** Num quadro de processo, «emitir um cartão VIP» teria uma faixa para o cliente. A
  pergunta *quem carrega neste botão* tê-la-ia posto lá, **vazia, à vista**, três dias antes. E a
  pergunta do produto decidia-se na primeira fase: desenhada sozinha, mostrava a faixa vazia antes
  de existir mais alguma coisa.
- **Passo 4.** A pergunta estava formulada e as três saídas estavam escritas, mas não havia linha
  nenhuma a dizer *«isto pergunta-se ao cliente»*. Uma pergunta em aberto sem destinatário
  responde-se sozinha, por inferência.

## Caso 2 — o estado de falha que só o código conhecia (passo 2)

No aprovisionamento de uma plataforma multi-tenant, o terceiro ecrã — *a organização já é de outro
cliente, e apagá-la derrubava um cliente vivo* — era um caso que o código já tratava e que nenhum
ecrã desenhava. Foi ele que obrigou a decidir o que a spec não tinha decidido.

## Caso 3 — a lição que estava noutro domínio (pesquisa sem filtro)

A lição que explicou duas reversões seguidas nesse mesmo projecto estava no tema `ux.md`, que o
projecto **não tinha instalado** — só se alcançou por pesquisa sem filtro de domínio.
