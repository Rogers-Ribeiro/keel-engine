# Núcleo Comércio digital — o que vale em qualquer tarefa

Este é o núcleo de um projecto de comércio digital, e não substitui os outros núcleos de `regras/`: um projecto carrega os que lhe servem. São duas plataformas: COM-001 a COM-017 são de B2C Commerce (SFCC) — cartridges, controllers, `hooks.json` e cache —, e COM-018 a COM-024 são de B2B Commerce, que corre sobre a plataforma Salesforce; um projecto de B2B Commerce carrega também o `regras/nucleo-salesforce.md`, porque a loja é configuração de plataforma. O resto está em `regras/comercio-digital.md`; para o que não estiver aqui nem lá, pesquisa no MCP `cursos`.

## Nunca

- Escrita fora de uma transacção: **COM-011**.
- Um controller a chamar outro controller: **COM-007**.
- Operações de escrita ou de administração expostas ao lado do comprador: **COM-005**.
- Alterações empurradas directamente para produção, ou o valor por ambiente editado à mão depois da promoção: **COM-001**, **COM-002**.
- O client ID genérico do sandbox fora do sandbox: **COM-003**.

## B2C Commerce: cartridges, cache e catálogo

- Módulos por `require`, no âmbito mais restrito, e o `hooks.json` declarado no `package.json` do próprio cartridge: **COM-009**, **COM-010**.
- Rota estendida com `replace`, obrigatoriamente quando chama um serviço de terceiros: **COM-008**.
- Volumes grandes processam-se em blocos, nunca numa operação única: **COM-012**; a cache define-se no controller com `setExpires` e invalida-se por partição, não a página inteira: **COM-013**, **COM-014**.
- Chamada a serviço externo com timeout, circuit breaker e limite de chamadas, e o erro do timeout tratado: **COM-004**; autorizar o pagamento no checkout e capturar só depois do envio: **COM-006**.
- Categorias até três níveis; a acumulação e a prioridade de cada promoção declaram-se; Range ou Slab sai do requisito, com o schedule desactivado para editar os escalões: **COM-015**, **COM-016**, **COM-017**.

## B2B Commerce: visibilidade, preço e checkout

- Nada aparece sem a cadeia completa — entitlement policy, categoria, conta activa como buyer e buyer group —, e sem entrada activa no price book não há preço nem compra: **COM-018**, **COM-019**.
- Depois de mexer em produtos, categorias, entitlements, buyer groups ou importações, corre a indexação e espera que termine antes de validar: **COM-020**.
- Taxa de imposto do país e tipo de imposto (gross ou net) fixados antes de existirem carrinhos e encomendas, e o perfil de portes personalizado com zona e tarifa: **COM-021**, **COM-023**, **COM-022**.
- O comprador precisa de licença compatível com o permission set, de perfil clonado do standard e de estar nos membros do site: **COM-024**.

## Os temas

`comercio-digital`
