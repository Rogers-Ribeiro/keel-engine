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

const REGRAS_SHELL = [
  {
    // Qualquer `git` cujo subcomando seja `push`, com ou sem opções antes (`git -C x push`).
    testa: (p) => /^(?:"[^"]*[\\/]|'[^']*[\\/]|\S*[\\/])?git(?:\.exe)?["']?(?:\s+(?:-C\s+\S+|-c\s+\S+|--?[\w-]+(?:=\S+)?))*\s+push\b/i.test(p),
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

// Devolve o motivo da recusa, ou `null` se a chamada pode seguir.
export function avaliar(entrada) {
  const ferramenta = entrada?.tool_name ?? '';
  const dados = entrada?.tool_input ?? {};

  if (ferramenta === 'Bash' || ferramenta === 'PowerShell') {
    for (const parte of partes(String(dados.command ?? ''))) {
      const regra = REGRAS_SHELL.find((r) => r.testa(parte));
      if (regra) return `${regra.motivo}: \`${parte}\``;
    }
    return null;
  }

  if (ferramenta === 'Write' || ferramenta === 'Edit') {
    const nome = path.basename(String(dados.file_path ?? '').replace(/\\/g, '/'));
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

  const motivo = avaliar(entrada);
  if (!motivo) return 0;
  process.stderr.write(
    `Bloqueado pelo guarda do Keel — ${motivo}.\n` +
      'Não procures outra forma de fazer o mesmo. Diz à pessoa o que querias fazer e porquê, e ela corre o comando.\n',
  );
  return 2;
}

// No Windows a letra da unidade pode vir em minúsculas, por isso compara sem distinguir maiúsculas.
const executadoDirectamente =
  process.argv[1] &&
  path.resolve(fileURLToPath(import.meta.url)).toLowerCase() === path.resolve(process.argv[1]).toLowerCase();
if (executadoDirectamente) process.exitCode = await main();
