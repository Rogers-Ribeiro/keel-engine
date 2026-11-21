#!/usr/bin/env node
// Os achados de uma revisão, guardados como estado e não como texto, para que nenhum fique esquecido.
//
//   node .keel/revisao.mjs abrir   --dimensao <d> --severidade <s> --onde <ficheiro:linha> --o-que "<…>" [--portao] [--ramo <r>]
//   node .keel/revisao.mjs rever   --dimensao <d> [--mantem R-001,R-004] [--ramo <r>]
//   node .keel/revisao.mjs recusar --id R-001 --porque "<…>"
//   node .keel/revisao.mjs estado  [--ramo <r>]          sai com 1 se houver bloqueantes abertos
//   node .keel/revisao.mjs backlog [--ramo <r>]          os reparos por tratar, para o despacho do fim da frente
//   node .keel/revisao.mjs parar                         hook Stop: lê do stdin; sai com 2 só por bloqueantes de portão
//
// Existe porque a falha mais repetida de agentes em tarefas longas é encontrar o problema na revisão
// e entregar sem o corrigir (arXiv:2608.14905). Escrever "fecha cada achado" num "Quando acabas" é uma
// regra só em texto (PROC-023, PROC-035); isto é o controlo.
//
// **Rigor no merge, liberdade no ramo.** Um commit num ramo desfaz-se; um commit no `main` não. Por
// isso o guarda deixa fazer commit à vontade num ramo de trabalho, e recusa só o commit no ramo
// principal e a fusão para ele (`git merge <ramo>`) enquanto esse ramo tiver bloqueantes abertos. O
// hook `Stop` avisa dos bloqueantes e deixa acabar; só não deixa quando algum é de um portão
// (`--portao`: tenants, segredos e autenticação, migrações, escrita em sistemas externos), que são os
// erros que não se desfazem depois de entrarem. E mesmo esses prendem uma vez por lista: se a sessão
// já foi presa pela mesma lista de bloqueantes (guardada na pasta temporária do sistema, para não
// sujar o `git status`), ou se o Stop já está a
// continuar por causa de um hook (`stop_hook_active`), avisa e deixa acabar. Prender a cada fim de
// turno por um bloqueante que a pessoa decidiu tratar depois levou dois projectos a remendar isto à mão.
//
// Os estados e quem os muda:
// - **aberto** — um bloqueante, quando o revisor o abre (`abrir`). É o único estado que prende.
// - **backlog** — um reparo, quando o revisor o abre. Não prende o commit nem o fim da tarefa, não
//   abre ronda nova, e junta-se aos outros num só despacho no fim da frente (`backlog`). Prender por
//   reparos custou, num projecto, cerca de 100 mil tokens por seis linhas de comentário, e noutro
//   centenas de `recusar` à mão só para a sessão poder parar.
// - **corrigido** — só por uma nova ronda do revisor na mesma dimensão (`rever`): o que ele não
//   voltar a apontar fica corrigido. Quem implementou não marca o seu próprio trabalho como feito.
// - **não corrigido** — quem implementou recusa-o com o motivo (`recusar`). É uma saída legítima, e
//   é o que impede o hook de prender a sessão quando a correcção é decisão da pessoa.
//
// **Cada achado é do seu ramo.** O registo é um só por projecto (os IDs não se repetem), mas cada
// achado leva o ramo onde foi aberto, e o guarda e o hook `Stop` só contam os do ramo em que se está.
// Com frentes em paralelo, um registo sem ramo deixava o achado de uma frente bloquear os commits de
// todas as outras. Os achados antigos, sem ramo, contam em todos os ramos, como antes.
//
// Isto protege contra o esquecimento, não contra a má-fé: quem corre `rever` à mão consegue fechar
// achados. O guarda recusa a edição directa do JSON, e o resto fica no histórico de cada achado.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const FICHEIRO = path.join('.keel', 'revisao.json');
const TRAVA = path.join('.keel', 'revisao.lock');
const SEVERIDADES = ['bloqueante', 'reparo'];
// O tecto de rondas por dimensão e por ramo (lição `revisao-sem-regra-de-paragem`). Passá-lo não é
// proibido — quem decide pode pedir mais —, mas o registo avisa, para a 3.ª ronda nunca ser automática.
export const TECTO_RONDAS = 2;

export const pastaProjecto = () => process.env.CLAUDE_PROJECT_DIR || process.cwd();

// O ramo em que está a pasta `cwd` — a worktree de uma frente, ou o repositório principal. Fora de um
// repositório git, ou com o HEAD solto, não há ramo, e os achados ficam sem ramo (contam em todos).
export function ramoActual(cwd = process.cwd()) {
  try {
    // `branch --show-current` dá o ramo mesmo antes do primeiro commit, e vazio com o HEAD solto.
    const ramo = execFileSync('git', ['branch', '--show-current'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return ramo || null;
  } catch {
    return null;
  }
}

export function ler(projecto) {
  try {
    const dados = JSON.parse(fs.readFileSync(path.join(projecto, FICHEIRO), 'utf8'));
    return { ...dados, achados: Array.isArray(dados.achados) ? dados.achados : [] };
  } catch {
    return { achados: [] };
  }
}

function escrever(projecto, dados) {
  const destino = path.join(projecto, FICHEIRO);
  const temporario = `${destino}.${process.pid}.tmp`;
  fs.writeFileSync(temporario, JSON.stringify(dados, null, 2) + '\n');
  fs.renameSync(temporario, destino);
}

// Ler, mudar e escrever sob uma trava: duas frentes a abrir achados ao mesmo tempo liam o mesmo
// máximo e davam o mesmo ID. A trava é uma pasta (criar uma pasta é atómico em todos os sistemas); uma
// trava com mais de 10 s é de um processo que morreu, e tira-se.
function comTrava(projecto, mudar) {
  fs.mkdirSync(path.join(projecto, '.keel'), { recursive: true });
  const trava = path.join(projecto, TRAVA);
  const espera = new Int32Array(new SharedArrayBuffer(4));
  for (let tentativa = 0; ; tentativa++) {
    try {
      fs.mkdirSync(trava);
      break;
    } catch (erro) {
      if (erro.code !== 'EEXIST') throw erro;
      try {
        if (Date.now() - fs.statSync(trava).mtimeMs > 10_000) fs.rmdirSync(trava);
      } catch {}
      if (tentativa > 200) throw new Error(`o registo está travado: apaga ${TRAVA} se nenhum processo o estiver a usar`);
      Atomics.wait(espera, 0, 0, 25);
    }
  }
  try {
    const dados = ler(projecto);
    const resultado = mudar(dados);
    escrever(projecto, dados);
    return resultado;
  } finally {
    try {
      fs.rmdirSync(trava);
    } catch {}
  }
}

// Um achado sem ramo (dos registos antigos) é de todos; sem ramo pedido, contam todos.
const doRamo = (a, ramo) => !ramo || !a.ramo || a.ramo === ramo;

export const abertos = (projecto, { ramo } = {}) =>
  ler(projecto).achados.filter((a) => a.estado === 'aberto' && a.severidade === 'bloqueante' && doRamo(a, ramo));

export const backlog = (projecto, { ramo } = {}) =>
  ler(projecto).achados.filter(
    (a) => (a.estado === 'backlog' || (a.estado === 'aberto' && a.severidade === 'reparo')) && doRamo(a, ramo),
  );

const agora = () => new Date().toISOString();
const proximoId = (achados) =>
  `R-${String(achados.reduce((max, a) => Math.max(max, Number(a.id.slice(2)) || 0), 0) + 1).padStart(3, '0')}`;

export function abrir(projecto, { dimensao, severidade, onde, oQue, ramo, portao }) {
  if (!dimensao || !onde || !oQue) throw new Error('abrir precisa de --dimensao, --onde e --o-que');
  if (!SEVERIDADES.includes(severidade)) throw new Error(`--severidade é ${SEVERIDADES.join(' ou ')}`);
  return comTrava(projecto, (dados) => {
    const achado = {
      id: proximoId(dados.achados),
      dimensao,
      severidade,
      onde,
      oQue,
      ...(ramo ? { ramo } : {}),
      ...(portao && portao !== 'nao' ? { portao: true } : {}),
      estado: severidade === 'bloqueante' ? 'aberto' : 'backlog',
      aberto: agora(),
    };
    dados.achados.push(achado);
    return achado;
  });
}

// Uma nova ronda do revisor numa dimensão: o que ele voltou a apontar fica como estava, o resto
// corrigido — os bloqueantes abertos e os reparos do backlog. Devolve também o número da ronda.
export function rever(projecto, { dimensao, mantem = [], ramo }) {
  if (!dimensao) throw new Error('rever precisa de --dimensao');
  return comTrava(projecto, (dados) => {
    const corrigidos = [];
    for (const a of dados.achados) {
      if (!['aberto', 'backlog'].includes(a.estado) || a.dimensao !== dimensao || mantem.includes(a.id)) continue;
      if (!doRamo(a, ramo)) continue;
      Object.assign(a, { estado: 'corrigido', fechado: agora() });
      corrigidos.push(a.id);
    }
    const chave = `${ramo ?? '-'}|${dimensao}`;
    dados.rondas = { ...(dados.rondas ?? {}), [chave]: ((dados.rondas ?? {})[chave] ?? 0) + 1 };
    return { corrigidos, ronda: dados.rondas[chave] };
  });
}

export function recusar(projecto, { id, porque }) {
  if (!porque) throw new Error('recusar precisa de --porque: um achado não corrigido diz porquê');
  return comTrava(projecto, (dados) => {
    const achado = dados.achados.find((a) => a.id === id);
    if (!achado) throw new Error(`não há achado ${id}`);
    if (!['aberto', 'backlog'].includes(achado.estado)) throw new Error(`${id} já está ${achado.estado}`);
    Object.assign(achado, { estado: 'nao-corrigido', motivo: porque, fechado: agora() });
    return achado;
  });
}

const linha = (a) =>
  `- ${a.id} [${a.severidade}${a.portao ? ' de portão' : ''}, ${a.dimensao}${a.ramo ? `, ${a.ramo}` : ''}] ${a.onde} — ${a.oQue}`;

export function mensagemAbertos(lista) {
  return (
    `Há ${lista.length} bloqueante(s) de revisão por fechar:\n` +
    lista.map(linha).join('\n') +
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

async function lerStdin() {
  if (process.stdin.isTTY) return {};
  let texto = '';
  for await (const pedaco of process.stdin) texto += pedaco;
  try {
    return JSON.parse(texto);
  } catch {
    return {};
  }
}

async function main(argv) {
  const comando = argv.find((a) => !a.startsWith('--')) ?? 'estado';
  const flags = lerFlags(argv);
  const projecto = flags.projecto ? path.resolve(flags.projecto) : pastaProjecto();

  if (comando === 'parar') {
    // O hook Stop nunca falha por erro próprio: uma excepção aqui prenderia a sessão por nada.
    try {
      const entrada = await lerStdin();
      const lista = abertos(projecto, { ramo: ramoActual(entrada.cwd || process.cwd()) });
      if (lista.length === 0) return 0;
      const chave = createHash('sha1').update(path.resolve(projecto).toLowerCase()).digest('hex').slice(0, 16);
      const ultimo = path.join(os.tmpdir(), `keel-stop-${chave}.json`);
      const impressao = lista.map((a) => a.id).sort().join(',');
      let jaMostrada = false;
      try {
        jaMostrada = JSON.parse(fs.readFileSync(ultimo, 'utf8')).ids === impressao;
      } catch {}
      if (lista.some((a) => a.portao) && !entrada.stop_hook_active && !jaMostrada) {
        try {
          fs.writeFileSync(ultimo, `${JSON.stringify({ ids: impressao })}\n`);
        } catch {}
        process.stderr.write(mensagemAbertos(lista));
        return 2;
      }
      // Fora dos portões, avisa e deixa acabar: o guarda trava-os à entrada do `main`.
      const aviso =
        `${lista.length} bloqueante(s) de revisão abertos neste ramo (${lista.map((a) => a.id).join(', ')}): ` +
        'não entram no main enquanto não forem fechados.';
      process.stdout.write(`${JSON.stringify({ systemMessage: aviso })}\n`);
      return 0;
    } catch {
      return 0;
    }
  }

  const ramo = flags.ramo && flags.ramo !== 'sim' ? flags.ramo : ramoActual();
  try {
    if (comando === 'abrir') {
      const a = abrir(projecto, { ...flags, ramo });
      process.stdout.write(
        a.estado === 'aberto'
          ? `${a.id} aberto (bloqueante${a.portao ? ' de portão' : ''}, ${a.dimensao}).\n`
          : `${a.id} no backlog (reparo, ${a.dimensao}): não abre ronda; vai no despacho do fim da frente.\n`,
      );
    } else if (comando === 'rever') {
      const mantem = flags.mantem && flags.mantem !== 'sim' ? flags.mantem.split(',').map((s) => s.trim()) : [];
      const { corrigidos, ronda: n } = rever(projecto, { dimensao: flags.dimensao, mantem, ramo });
      process.stdout.write(corrigidos.length ? `Corrigidos: ${corrigidos.join(', ')}.\n` : 'Nenhum achado fechado nesta ronda.\n');
      if (n > TECTO_RONDAS) {
        process.stdout.write(
          `Atenção: ronda ${n} de ${flags.dimensao} neste ramo, acima do tecto de ${TECTO_RONDAS}. ` +
            'Só continua por um bloqueante de dinheiro, dados de outro tenant, segredos ou escrita indevida; o resto vai para o backlog.\n',
        );
      }
    } else if (comando === 'recusar') {
      const a = recusar(projecto, flags);
      process.stdout.write(`${a.id} fechado como não corrigido.\n`);
    } else if (comando === 'estado') {
      const lista = abertos(projecto, { ramo });
      const reparos = backlog(projecto, { ramo }).length;
      process.stdout.write(lista.length ? mensagemAbertos(lista) : 'Nenhum bloqueante aberto.\n');
      if (reparos) process.stdout.write(`${reparos} reparo(s) no backlog (\`node .keel/revisao.mjs backlog\`).\n`);
      return lista.length ? 1 : 0;
    } else if (comando === 'backlog') {
      const lista = backlog(projecto, { ramo });
      process.stdout.write(lista.length ? `${lista.map(linha).join('\n')}\n` : 'Backlog vazio.\n');
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
