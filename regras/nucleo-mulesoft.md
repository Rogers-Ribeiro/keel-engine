# Núcleo MuleSoft — o que vale em qualquer tarefa

Este é o núcleo de um projecto de MuleSoft, e não substitui os outros núcleos de `regras/`: um projecto carrega os que lhe servem, e um projecto que seja só de integração não carrega os de Salesforce nem os de Python. O resto está em `regras/<tema>.md` e carrega-se conforme o trabalho.

## Nunca

- Valores vindos do pedido interpolados dentro da string da query: **MULD-021**.
- Segredos em claro no repositório ou no ficheiro de configuração, nem credenciais da organização inteira na automação: **MULA-024**, **MULD-019**, **MULD-020**.
- Editar ficheiros do projecto para mudar de ambiente: hosts, portas e credenciais entram por propriedade ao arrancar: **MULD-018**.
- O caso genérico de erro antes dos específicos: **MULA-012**, **MULD-011**.
- Repetir automaticamente uma escrita sem identificador de pedido único gerado pelo cliente: **MULA-017**, **MULD-013**.

## Antes de escrever código

- A especificação fecha-se, simula-se e recolhe feedback antes da primeira linha de implementação; cada ronda de comentários corrige a especificação, não o código: **MULD-001**, **MULA-005**.
- As validações estruturais declaram-se no contrato e não se repetem dentro do fluxo: **MULA-010**, **MULD-002**.
- O que se repete entre APIs sai para um fragmento versionado e publicado, nunca copiado: **MULD-003**, **MULA-006**.
- A premissa pergunta-se primeiro, numa frase — o que é isto, para quem, e quem carrega no botão — e a quem não leu nada.
- Cada camada justifica-se — Process API só para combinar System APIs, Experience API só para audiências diferentes, System API sem transformar —, cada API é um bounded context e quem chama é que se adapta: **MULA-001**, **MULA-002**, **MULA-003**, **MULA-008**, **MULA-009**.

## Estrutura do projecto

- Um ficheiro de implementação por recurso, cada sistema externo isolado em sub-flow próprio e a configuração partilhada num só sítio: **MULD-006**, **MULA-022**.
- Liveness com resposta estática e readiness a verificar as dependências, em endpoints separados: **MULA-023**, **MULD-008**.

## Erros e resiliência

- Os erros comuns vivem num handler global partilhado, que devolve sempre a mesma estrutura; a resposta diz o que corrigir e traz o identificador da transacção: **MULA-011**, **MULD-009**, **MULD-010**.
- Falha de regra de negócio levanta um erro com tipo e namespace próprios, nunca um tipo já fornecido pela plataforma: **MULD-012**, **MULA-013**.
- Timeout explícito em cada chamada, tirado do SLA repartido pelas camadas, e só depois retry, circuit breaker e fallback, por esta ordem: **MULA-014**, **MULD-016**, **MULA-015**.
- Repete-se só o transitório; as tentativas de cada camada de reintento multiplicam-se, somam-se os intervalos e compara-se o total com o SLA: **MULA-016**, **MULD-014**, **MULD-015**.

## Mensagens, estado e rastreio

- Confirmar a mensagem no fim do processamento, nunca à subscrição, e mandar para dead letter queue a que esgota as reentregas: **MULA-018**, **MULA-019**.
- Correlation ID aceite ou gerado, propagado em cada chamada e em cada linha de log, e reaplicado explicitamente do outro lado do broker: **MULD-017**, **MULA-020**.
- Watermark e estado partilhado em armazenamento persistente, sobre chave única e com validade definida: **MULA-021**, **MULD-022**, **MULD-024**.

## Testes

- Nenhum teste toca numa base de dados nem num serviço real, e o pipeline falha o build abaixo dos 80% de cobertura: **MULD-025**, **MULD-026**.

## Os temas

`mulesoft-desenvolvimento` · `mulesoft-arquitetura`
