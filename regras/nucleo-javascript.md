# Núcleo JavaScript e Node — o que vale em qualquer tarefa

Este é o núcleo de um projecto em JavaScript ou TypeScript, e não substitui os outros núcleos de `regras/`: um projecto carrega os que lhe servem — com React no browser leva também o `regras/nucleo-web-react.md`, e numa aplicação móvel o `regras/nucleo-mobile-react-native.md`. O resto está em `regras/<tema>.md` e carrega-se conforme o trabalho.

## Nunca

- Segredos, chaves ou credenciais no código ou no repositório: **JS-022**, **NOD-006**.
- Valores vindos do exterior concatenados numa query; entram como marcadores: **NOD-008**.
- `any` para calar o compilador: **JS-009**.
- Operação síncrona no caminho que atende pedidos: **NOD-001**, **JS-020**.
- Confiar na validação do cliente: a que conta é a do servidor: **NOD-013**.
- A base de dados de produção em testes: **NOD-034**.

## Antes de escrever código

- A premissa pergunta-se primeiro, numa frase — o que é isto, para quem, e quem carrega no botão — e a quem não leu nada.
- `strict: true` no `tsconfig.json` desde o primeiro dia: **JS-005**.
- O sistema de módulos declara-se, e é ESM em código novo: **JS-001**, **JS-002**.
- O TypeScript é dependência do projecto, não da máquina de quem o escreve: **JS-006**.

## Tipos

- Anota-se o que a inferência não dá, e só isso: **JS-010**.
- Tudo o que vem de fora valida-se em runtime, e o tipo sai do esquema em vez de ser escrito à mão: **JS-016**, **JS-017**, **JS-018**.
- União discriminada em vez de campos opcionais que se excluem; um type guard repetido vira função: **JS-012**, **JS-013**.
- Os tipos derivam-se do que já existe, em vez de se repetirem: **JS-011**, **JS-015**.

## No servidor

- Um middleware ou responde ou passa adiante; as rotas dividem-se por domínio: **NOD-003**, **NOD-004**.
- Rota fixa registada antes da rota com segmento dinâmico: **NOD-005**.
- O erro de código assíncrono vai por `next` para um único tratador central, no fim: **NOD-024**, **NOD-025**.
- O código de estado escolhe-se pela intenção, e a validação falhada devolve o que foi introduzido: **NOD-026**, **NOD-014**.
- Sessão em store persistente, cookie `secure` e `http only`, e terminar sessão destrói a sessão no servidor: **NOD-016**, **NOD-017**, **NOD-018**.
- Password guardada com hash e factor de custo; token validado por verificação de assinatura, nunca por descodificação: **NOD-015**, **NOD-021**.
- A posse do recurso verifica-se em cada acção que o altera: **NOD-020**.
- Ficheiros por streaming, e na base de dados fica o caminho, não o conteúdo: **NOD-030**, **NOD-031**, **JS-021**.

## Ferramentas

- Uma ferramenta só formata, com a versão fixa; em integração contínua verifica-se, não se corrige, e o `--unsafe` nunca entra em automatismo: **JS-028**, **JS-025**, **JS-026**, **JS-027**.
