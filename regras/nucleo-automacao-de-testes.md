# Núcleo de automação de testes — o que vale em qualquer tarefa

Este é o núcleo de uma suite de testes ponta a ponta com Playwright, e não substitui os outros núcleos de `regras/`: um projecto carrega-o ao lado do núcleo da aplicação que testa — o de React, o de JavaScript, o de Python. O resto está em `regras/automacao-de-testes.md` e carrega-se conforme o trabalho.

## Nunca

- Uma espera de tempo fixo; sincroniza-se com a resposta real ou com o `expect` do localizador: **AUT-010**, **AUT-009**.
- XPath copiado do navegador num teste que vai ser mantido: **AUT-006**.
- Um selector escrito dentro do teste; os localizadores vivem na classe da página: **AUT-008**.
- Um teste que depende do estado deixado por outro, ou dados criados que ficam por limpar: **AUT-003**, **AUT-004**.
- Um teste gerado por IA no repositório sem revisão, a começar pelos localizadores: **AUT-016**.

## Antes de escrever um teste

- A premissa pergunta-se primeiro, numa frase — o que este teste prova, e a quem falha se ele partir — e a quem não leu nada.
- O primeiro localizador é o papel acessível, e um localizador usado numa acção resolve um só elemento: **AUT-005**, **AUT-007**.
- Um estado difícil de reproduzir simula-se na rede, não se prepara na aplicação: **AUT-011**.

## Fixtures e isolamento

- Contexto, página e ligação à base são fixtures do `conftest.py`, com o fecho logo a seguir ao `yield`: **AUT-001**.
- O que guarda estado fica no escopo `function`: **AUT-002**.
- Um fluxo de escrita confirma-se na base, não só no ecrã: **AUT-012**.

## Na integração contínua

- O pipeline instala dependências e navegadores antes de correr: **AUT-013**.
- Cada execução publica um relatório HTML autocontido e arquiva o trace e os vídeos: **AUT-014**, **AUT-015**.
