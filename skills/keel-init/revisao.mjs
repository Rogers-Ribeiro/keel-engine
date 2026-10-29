#!/usr/bin/env node
// Os achados de uma revisão, guardados como estado e não como texto, para que nenhum fique esquecido.
//
//   node .keel/revisao.mjs abrir   --dimensao <d> --severidade <s> --onde <ficheiro:linha> --o-que "<…>"
//   node .keel/revisao.mjs rever   --dimensao <d> [--mantem R-001,R-004]
//   node .keel/revisao.mjs recusar --id R-001 --porque "<…>"
//   node .keel/revisao.mjs estado                      sai com 1 se houver achados abertos
//   node .keel/revisao.mjs parar                       hook Stop: lê do stdin, sai com 2 se houver abertos
//
// Existe porque a falha mais repetida de agentes em tarefas longas é encontrar o problema na revisão
// e entregar sem o corrigir (arXiv:2608.14905). Escrever "fecha cada achado" num "Quando acabas" é uma
// regra só em texto (PROC-023, PROC-035); isto é o controlo: o hook `Stop` não deixa a tarefa acabar
// e o guarda não deixa fazer commit enquanto houver um achado aberto.
//
// Os estados e quem os muda:
// - **aberto** — o revisor abre-o (`abrir`).
// - **corrigido** — só por uma nova ronda do revisor na mesma dimensão (`rever`): o que ele não
//   voltar a apontar fica corrigido. Quem implementou não marca o seu próprio trabalho como feito.
// - **não corrigido** — quem implementou recusa-o com o motivo (`recusar`). É uma saída legítima, e
//   é o que impede o hook de prender a sessão quando a correcção é decisão da pessoa.
//
// Isto protege contra o esquecimento, não contra a má-fé: quem corre `rever` à mão consegue fechar
// achados. O guarda recusa a edição directa do JSON, e o resto fica no histórico de cada achado.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const FICHEIRO = path.join('.keel', 'revisao.json');
const SEVERIDADES = ['bloqueante', 'reparo'];

export const pastaProjecto = () => process.env.CLAUDE_PROJECT_DIR || process.cwd();

export function ler(projecto) {
  try {
    const dados = JSON.parse(fs.readFileSync(path.join(projecto, FICHEIRO), 'utf8'));
    return { achados: Array.isArray(dados.achados) ? dados.achados : [] };
  } catch {
    return { achados: [] };
  }
}

function escrever(projecto, dados) {
  fs.mkdirSync(path.join(projecto, '.keel'), { recursive: true });
  fs.writeFileSync(path.join(projecto, FICHEIRO), JSON.stringify(dados, null, 2) + '\n');
}

export const abertos = (projecto) => ler(projecto).achados.filter((a) => a.estado === 'aberto');

const agora = () => new Date().toISOString();
const proximoId = (achados) =>
  `R-${String(achados.reduce((max, a) => Math.max(max, Number(a.id.slice(2)) || 0), 0) + 1).padStart(3, '0')}`;

export function abrir(projecto, { dimensao, severidade, onde, oQue }) {
  if (!dimensao || !onde || !oQue) throw new Error('abrir precisa de --dimensao, --onde e --o-que');
  if (!SEVERIDADES.includes(severidade)) throw new Error(`--severidade é ${SEVERIDADES.join(' ou ')}`);
  const dados = ler(projecto);
  const achado = { id: proximoId(dados.achados), dimensao, severidade, onde, oQue, estado: 'aberto', aberto: agora() };
  dados.achados.push(achado);
  escrever(projecto, dados);
  return achado;
}

// Uma nova ronda do revisor numa dimensão: o que ele voltou a apontar fica aberto, o resto corrigido.
export function rever(projecto, { dimensao, mantem = [] }) {
  if (!dimensao) throw new Error('rever precisa de --dimensao');
  const dados = ler(projecto);
  const corrigidos = [];
  for (const a of dados.achados) {
    if (a.estado !== 'aberto' || a.dimensao !== dimensao || mantem.includes(a.id)) continue;
    Object.assign(a, { estado: 'corrigido', fechado: agora() });
    corrigidos.push(a.id);
  }
  escrever(projecto, dados);
  return corrigidos;
}

export function recusar(projecto, { id, porque }) {
  if (!porque) throw new Error('recusar precisa de --porque: um achado não corrigido diz porquê');
  const dados = ler(projecto);
  const achado = dados.achados.find((a) => a.id === id);
  if (!achado) throw new Error(`não há achado ${id}`);
  if (achado.estado !== 'aberto') throw new Error(`${id} já está ${achado.estado}`);
  Object.assign(achado, { estado: 'nao-corrigido', motivo: porque, fechado: agora() });
  escrever(projecto, dados);
  return achado;
}

export function mensagemAbertos(lista) {
  return (
    `Há ${lista.length} achado(s) de revisão por fechar:\n` +
    lista.map((a) => `- ${a.id} [${a.severidade}, ${a.dimensao}] ${a.onde} — ${a.oQue}`).join('\n') +
    '\nCorrige e pede ao reviewer uma nova ronda dessas dimensões, ou fecha cada um com ' +
    '`node .keel/revisao.mjs recusar --id <ID> --porque "<motivo>"` e diz o motivo à pessoa.\n'
  );
}

function lerFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const nome = argv[i].slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    flags[nome] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'sim';
  }
  return flags;
}

async function main(argv) {
  const comando = argv.find((a) => !a.startsWith('--')) ?? 'estado';
  const flags = lerFlags(argv);
  const projecto = flags.projecto ? path.resolve(flags.projecto) : pastaProjecto();

  if (comando === 'parar') {
    // O hook Stop nunca falha por erro próprio: uma excepção aqui prenderia a sessão por nada.
    const lista = abertos(projecto);
    if (lista.length === 0) return 0;
    process.stderr.write(mensagemAbertos(lista));
    return 2;
  }

  try {
    if (comando === 'abrir') {
      const a = abrir(projecto, flags);
      process.stdout.write(`${a.id} aberto (${a.severidade}, ${a.dimensao}).\n`);
    } else if (comando === 'rever') {
      const mantem = flags.mantem && flags.mantem !== 'sim' ? flags.mantem.split(',').map((s) => s.trim()) : [];
      const c = rever(projecto, { dimensao: flags.dimensao, mantem });
      process.stdout.write(c.length ? `Corrigidos: ${c.join(', ')}.\n` : 'Nenhum achado fechado nesta ronda.\n');
    } else if (comando === 'recusar') {
      const a = recusar(projecto, flags);
      process.stdout.write(`${a.id} fechado como não corrigido.\n`);
    } else if (comando === 'estado') {
      const lista = abertos(projecto);
      process.stdout.write(lista.length ? mensagemAbertos(lista) : 'Nenhum achado aberto.\n');
      return lista.length ? 1 : 0;
    } else {
      throw new Error(`comando desconhecido: ${comando}`);
    }
    return 0;
  } catch (erro) {
    process.stderr.write(`${erro.message}\n`);
    return 1;
  }
}

// No Windows a letra da unidade pode vir em minúsculas, por isso compara sem distinguir maiúsculas.
const executadoDirectamente =
  process.argv[1] &&
  path.resolve(fileURLToPath(import.meta.url)).toLowerCase() === path.resolve(process.argv[1]).toLowerCase();
if (executadoDirectamente) process.exitCode = await main(process.argv.slice(2));
