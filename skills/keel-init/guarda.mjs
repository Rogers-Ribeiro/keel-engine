#!/usr/bin/env node
// O hook de guarda do Keel: corre em `PreToolUse` e recusa, com `exit 2`, o que nunca pode acontecer.
//
//   node .keel/guarda.mjs        lê do stdin o JSON que o Claude Code passa ao hook
//
// Existe porque as regras de `permissions.deny` vêem só o texto do comando: `Bash(git push *)` não
// apanha `git -C . push`, e nenhuma regra `Bash(...)` apanha um `.env` apagado pela ferramenta de
// edição. O `deny` fica na mesma — é a primeira barreira e não custa nada —, e isto cobre as variantes.
//
// O que recusa é pouco de propósito: publicar (`git push`), apagar recursivamente e tocar em `.env`.
// E, quando o projecto tem o `.keel/revisao.mjs`, fazer commit com achados de revisão abertos ou
// editar à mão o ficheiro onde eles estão (PROC-036).
// Um guarda que recusa demais é desligado na primeira semana, e um guarda desligado não guarda nada.
// O que cada projecto quiser acrescentar vai para o `deny` dele, não para aqui.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// `.env`, `.env.local`, `.env.production` — mas não os modelos que se versionam de propósito.
const MODELOS_ENV = /^\.env\.(example|sample|template|dist)$/i;
const eFicheiroEnv = (nome) => /^\.env(\.[\w.-]+)?$/i.test(nome) && !MODELOS_ENV.test(nome);

// O comando parte-se nos separadores da shell para que cada parte se avalie sozinha, como o próprio
// Claude Code faz com as regras de permissão.
const partes = (comando) => comando.split(/&&|\|\||[;|\n]/).map((p) => p.trim()).filter(Boolean);

// Qualquer `git` cujo subcomando seja este, com ou sem opções antes (`git -C x push`).
const gitComSubcomando = (subcomando) =>
  new RegExp(
    String.raw`^(?:"[^"]*[\\/]|'[^']*[\\/]|\S*[\\/])?git(?:\.exe)?["']?(?:\s+(?:-C\s+\S+|-c\s+\S+|--?[\w-]+(?:=\S+)?))*\s+` +
      subcomando +
      String.raw`\b`,
    'i',
  );
const GIT_PUSH = gitComSubcomando('push');
const GIT_COMMIT = gitComSubcomando('commit');

const eRevisaoJson = (ficheiro) => /(?:^|\/)\.keel\/revisao\.json$/i.test(ficheiro.replace(/\\/g, '/'));

// O motivo de uma recusa por revisão começa por isto, para o `main` dar a instrução certa: aqui o
// agente pode resolver sozinho, e não deve passar o comando à pessoa.
export const MOTIVO_REVISAO = 'revisão por fechar';

const REGRAS_SHELL = [
  {
    testa: (p) => GIT_PUSH.test(p),
    motivo: 'publicar no remoto (`git push`) é para a pessoa fazer, depois de rever',
  },
  {
    // `rm -rf`, `rm -r`, `rm --recursive`, em qualquer ordem das opções.
    testa: (p) => /^(?:sudo\s+)?rm\b(?=.*\s(?:-[a-zA-Z]*[rR][a-zA-Z]*|--recursive)\b)/.test(p),
    motivo: 'apagar recursivamente não se desfaz',
  },
  {
    // PowerShell: `Remove-Item` e os seus aliases, com `-Recurse`; e o `rmdir /s` do cmd.
    testa: (p) =>
      /^(?:Remove-Item|ri|rm|rmdir|rd|del|erase)\b.*\s-Recurse\b/i.test(p) || /^(?:rmdir|rd)\b.*\s\/s\b/i.test(p),
    motivo: 'apagar recursivamente não se desfaz',
  },
  {
    // Um `.env` nomeado em qualquer ponto do comando: ler, copiar, apagar, redireccionar.
    testa: (p) => p.split(/[\s'"`=<>()]+/).some((tok) => eFicheiroEnv(path.basename(tok.replace(/\\/g, '/')))),
    motivo: 'o `.env` tem segredos; o agente não o lê nem o altera',
  },
];

// Devolve o motivo da recusa, ou `null` se a chamada pode seguir. `abertos` são os achados de revisão
// por fechar, que o `main` lê do `.keel/revisao.json`.
export function avaliar(entrada, { abertos = [] } = {}) {
  const ferramenta = entrada?.tool_name ?? '';
  const dados = entrada?.tool_input ?? {};

  if (ferramenta === 'Bash' || ferramenta === 'PowerShell') {
    for (const parte of partes(String(dados.command ?? ''))) {
      const regra = REGRAS_SHELL.find((r) => r.testa(parte));
      if (regra) return `${regra.motivo}: \`${parte}\``;
      if (abertos.length > 0 && GIT_COMMIT.test(parte)) {
        return `${MOTIVO_REVISAO}: ${abertos.map((a) => a.id).join(', ')} ainda abertos`;
      }
    }
    return null;
  }

  if (ferramenta === 'Write' || ferramenta === 'Edit') {
    const ficheiro = String(dados.file_path ?? '');
    if (eRevisaoJson(ficheiro)) return `${MOTIVO_REVISAO}: os achados mudam só pelo \`node .keel/revisao.mjs\`, não à mão`;
    const nome = path.basename(ficheiro.replace(/\\/g, '/'));
    if (eFicheiroEnv(nome)) return `o \`.env\` tem segredos; o agente não o lê nem o altera: \`${nome}\``;
  }

  return null;
}

async function main() {
  let texto = '';
  for await (const pedaco of process.stdin) texto += pedaco;

  let entrada;
  try {
    entrada = JSON.parse(texto);
  } catch {
    // Uma entrada ilegível não é um ataque: é o hook a ser chamado de forma que não conhece.
    // Recusar aqui bloquearia todas as ferramentas da sessão por uma mudança de formato.
    return 0;
  }

  // O `revisao.mjs` pode não existir num projecto que ainda não o recebeu. Sem ele, o guarda continua
  // a guardar o resto: um import que falhasse fora deste `try` desligava-o por inteiro.
  let abertos = [];
  try {
    const revisao = await import('./revisao.mjs');
    abertos = revisao.abertos(revisao.pastaProjecto());
  } catch {}

  const motivo = avaliar(entrada, { abertos });
  if (!motivo) return 0;
  process.stderr.write(
    `Bloqueado pelo guarda do Keel — ${motivo}.\n` +
      (motivo.startsWith(MOTIVO_REVISAO)
        ? 'Corre `node .keel/revisao.mjs estado`: corrige e pede ao reviewer uma nova ronda, ou fecha cada achado com `recusar --porque`.\n'
        : 'Não procures outra forma de fazer o mesmo. Diz à pessoa o que querias fazer e porquê, e ela corre o comando.\n'),
  );
  return 2;
}

// No Windows a letra da unidade pode vir em minúsculas, por isso compara sem distinguir maiúsculas.
const executadoDirectamente =
  process.argv[1] &&
  path.resolve(fileURLToPath(import.meta.url)).toLowerCase() === path.resolve(process.argv[1]).toLowerCase();
if (executadoDirectamente) process.exitCode = await main();
