#!/usr/bin/env node
// Conta o que entra em contexto em todas as sessões de um projecto, antes de o agente ler um ficheiro.
//
//   node contexto.mjs [<projecto>] [--limite 200] [--json]
//
// O teto de 60 linhas vale por núcleo, mas um projecto carrega vários — um Next.js com testes leva
// três —, e mais o CLAUDE.md, mais as regras de `.claude/rules/` sem `paths:`. O que pesa é a soma.
// O cumprimento cai à medida que as instruções se juntam, e as primeiras ganham às últimas
// (IFScale, arXiv:2507.11538); e um arquivo de contexto cheio de coisas desnecessárias baixa a taxa
// de sucesso e sobe o custo (arXiv:2602.11988). As referências estão em `docs/contexto-e-qualidade.md`.
//
// Conta o que o Claude Code carrega no arranque: `CLAUDE.md`, `.claude/CLAUDE.md` e `CLAUDE.local.md`,
// os `@caminho` que importam (relativos a quem importa, até 4 níveis), e as regras de `.claude/rules/`
// sem `paths:`. Os comentários HTML não contam, porque são removidos antes de entrar no contexto.
// Sai sempre com 0: é um relatório, e quem decide o que cortar é a pessoa.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// A documentação do Claude Code pede menos de 200 linhas por CLAUDE.md; aplica-se à soma, que é o
// que o modelo vê.
export const LIMITE_LINHAS = 200;
const MAX_NIVEIS_IMPORT = 4;
const RAIZES = ['CLAUDE.md', '.claude/CLAUDE.md', 'CLAUDE.local.md'];

const semComentarios = (texto) => texto.replace(/<!--[\s\S]*?-->/g, '');

// Os `@caminho` fora de blocos de código. Um `@` dentro de um exemplo não é import.
export function importsDe(texto) {
  const caminhos = [];
  let emBloco = false;
  for (const linha of texto.split(/\r?\n/)) {
    if (/^\s*```/.test(linha)) emBloco = !emBloco;
    if (emBloco) continue;
    for (const m of linha.replace(/`[^`]*`/g, '').matchAll(/(?:^|\s)@([^\s`)]+)/g)) {
      // A pontuação no fim é da frase, não do caminho.
      const caminho = m[1].replace(/[.,;:!?]+$/, '');
      if (!caminho.includes('@')) caminhos.push(caminho);
    }
  }
  return caminhos;
}

export function medir(texto) {
  const linhas = semComentarios(texto).split(/\r?\n/).filter((l) => l.trim() !== '');
  // Uma instrução é um ponto de lista; é a unidade que o IFScale conta.
  const instrucoes = linhas.filter((l) => /^\s*(?:[-*]|\d+\.)\s/.test(l)).length;
  return { linhas: linhas.length, instrucoes };
}

const temPaths = (texto) => {
  const fm = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return Boolean(fm && /^paths\s*:/m.test(fm[1]));
};

export function contexto(projecto, limite = LIMITE_LINHAS) {
  const ficheiros = [];
  const vistos = new Set();
  const avisos = [];

  const juntar = (abs, nivel) => {
    const chave = path.resolve(abs).toLowerCase();
    if (vistos.has(chave)) return;
    vistos.add(chave);
    let texto;
    try {
      texto = fs.readFileSync(abs, 'utf8');
    } catch {
      if (nivel > 0) avisos.push(`import que não abre: ${path.relative(projecto, abs).replaceAll('\\', '/')}`);
      return;
    }
    ficheiros.push({ ficheiro: path.relative(projecto, abs).replaceAll('\\', '/'), ...medir(texto) });
    if (nivel >= MAX_NIVEIS_IMPORT) return;
    for (const imp of importsDe(semComentarios(texto))) {
      const destino = imp.startsWith('~/')
        ? path.join(process.env.HOME ?? process.env.USERPROFILE ?? '', imp.slice(2))
        : path.resolve(path.dirname(abs), imp);
      juntar(destino, nivel + 1);
    }
  };

  for (const raiz of RAIZES) juntar(path.join(projecto, raiz), 0);

  const pastaRegras = path.join(projecto, '.claude', 'rules');
  if (fs.existsSync(pastaRegras)) {
    for (const nome of fs.readdirSync(pastaRegras, { recursive: true }).map(String).sort()) {
      if (!nome.endsWith('.md')) continue;
      const abs = path.join(pastaRegras, nome);
      if (!temPaths(fs.readFileSync(abs, 'utf8'))) juntar(abs, 0);
    }
  }

  const total = ficheiros.reduce((s, f) => ({ linhas: s.linhas + f.linhas, instrucoes: s.instrucoes + f.instrucoes }), {
    linhas: 0,
    instrucoes: 0,
  });
  if (total.linhas > limite) {
    avisos.unshift(`o contexto fixo tem ${total.linhas} linhas, acima de ${limite}`);
  }
  return { ficheiros, total, limite, avisos };
}

function relatorio({ ficheiros, total, limite, avisos }) {
  const linhas = ['| Ficheiro | Linhas | Instruções |', '|---|---:|---:|'];
  for (const f of ficheiros) linhas.push(`| \`${f.ficheiro}\` | ${f.linhas} | ${f.instrucoes} |`);
  linhas.push(`| **Total** | **${total.linhas}** | **${total.instrucoes}** |`, '');
  if (avisos.length === 0) linhas.push(`Dentro do limite (${limite} linhas).`);
  else linhas.push(...avisos.map((a) => `- ${a}`));
  return linhas.join('\n');
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const i = args.indexOf('--limite');
  const limite = i >= 0 ? Number(args[i + 1]) : LIMITE_LINHAS;
  const projecto = path.resolve(args.find((a, j) => !a.startsWith('--') && args[j - 1] !== '--limite') ?? '.');
  const r = contexto(projecto, limite);
  process.stdout.write((json ? JSON.stringify(r, null, 2) : relatorio(r)) + '\n');
  return 0;
}

// No Windows a letra da unidade pode vir em minúsculas, por isso compara sem distinguir maiúsculas.
const executadoDirectamente =
  process.argv[1] &&
  path.resolve(fileURLToPath(import.meta.url)).toLowerCase() === path.resolve(process.argv[1]).toLowerCase();
if (executadoDirectamente) process.exitCode = main(process.argv);
