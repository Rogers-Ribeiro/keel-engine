#!/usr/bin/env node
// estado.mjs — hook SessionStart (`startup|compact`): põe em contexto o `.keel/estado.md`.
//
// É onde o orquestrador guarda as frentes, os ramos e as decisões pendentes, para sobreviverem ao
// `/compact` e à sessão nova. Um hook não consegue correr `/compact` nem `/clear`; consegue pôr o
// estado de volta em contexto depois deles. Sem ficheiro, ou vazio, não escreve nada; nunca falha.
//
// O limite é em caracteres, não em linhas. O Claude Code corta a saída de um hook nos 10 000
// caracteres: acima disso guarda-a num ficheiro e põe em contexto só os primeiros 2 000, e o modelo
// não é mandado ler o resto (code.claude.com/docs/en/hooks, «JSON output»). Com um limite só em
// linhas, um estado de 200 linhas longas passava dos 10 000 e chegava ao modelo com 2 KB — foi o que
// aconteceu em três projectos, com ficheiros de 40 a 85 KB. Corta-se aqui, antes, numa linha inteira,
// e diz-se o que ficou de fora.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LIMITE_LINHAS = 200;
export const LIMITE_CARACTERES = 9000;

export function resumir(texto) {
  const linhas = texto.replace(/\r\n/g, '\n').trim().split('\n');
  const cabeca = 'Estado de trabalho deste projecto (`.keel/estado.md`, ignorado pelo git):';
  const saida = [cabeca, ''];
  let tamanho = cabeca.length + 1;
  let entraram = 0;
  for (const linha of linhas) {
    if (entraram >= LIMITE_LINHAS || tamanho + linha.length + 1 > LIMITE_CARACTERES) break;
    saida.push(linha);
    tamanho += linha.length + 1;
    entraram++;
  }
  if (entraram < linhas.length) {
    saida.push(
      '',
      `[cortado: entraram ${entraram} de ${linhas.length} linhas (${texto.length} caracteres; o limite é ` +
        `${LIMITE_CARACTERES}). Arruma-o: à cabeça só o que está aberto, o histórico em .keel/estado-arquivo.md, ` +
        'e o pormenor de cada frente no seu ficheiro em .keel/frentes/.]',
    );
  }
  return `${saida.join('\n')}\n`;
}

// No Windows a letra da unidade pode vir em minúsculas, por isso compara sem distinguir maiúsculas.
const executadoDirectamente =
  process.argv[1] &&
  path.resolve(fileURLToPath(import.meta.url)).toLowerCase() === path.resolve(process.argv[1]).toLowerCase();
if (executadoDirectamente) {
  try {
    const raiz = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const texto = fs.readFileSync(path.join(raiz, '.keel', 'estado.md'), 'utf8').trim();
    if (texto) process.stdout.write(resumir(texto));
  } catch {
    // sem estado, ou ilegível: a sessão arranca na mesma
  }
}
