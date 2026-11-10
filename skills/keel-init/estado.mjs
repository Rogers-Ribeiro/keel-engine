#!/usr/bin/env node
// estado.mjs — hook SessionStart (`startup|compact`): põe em contexto o `.keel/estado.md`.
//
// É onde o orquestrador guarda as frentes, os ramos e as decisões pendentes, para sobreviverem ao
// `/compact` e à sessão nova. Um hook não consegue correr `/compact` nem `/clear`; consegue pôr o
// estado de volta em contexto depois deles. Sem ficheiro, ou vazio, não escreve nada; nunca falha.
import fs from 'node:fs';
import path from 'node:path';

const LIMITE_LINHAS = 200;

try {
  const raiz = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const texto = fs.readFileSync(path.join(raiz, '.keel', 'estado.md'), 'utf8').replace(/\r\n/g, '\n').trim();
  if (texto) {
    const linhas = texto.split('\n');
    const saida = ['Estado de trabalho deste projecto (`.keel/estado.md`, ignorado pelo git):', ''];
    saida.push(...linhas.slice(0, LIMITE_LINHAS));
    if (linhas.length > LIMITE_LINHAS) {
      saida.push('', `[cortado: o ficheiro tem ${linhas.length} linhas e só entram as primeiras ${LIMITE_LINHAS}; arruma-o]`);
    }
    process.stdout.write(`${saida.join('\n')}\n`);
  }
} catch {
  // sem estado, ou ilegível: a sessão arranca na mesma
}
process.exit(0);
