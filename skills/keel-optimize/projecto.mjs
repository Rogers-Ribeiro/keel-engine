#!/usr/bin/env node
// As alavancas do `keel-optimize` que mexem em ficheiros: plugins por projecto e arquivo de contexto.
//
//   node projecto.mjs plugins  [--projecto .] [--json]
//   node projecto.mjs desligar <id>... [--projecto .]
//   node projecto.mjs ligar    <id>... [--projecto .]
//   node projecto.mjs arquivar <ficheiro> --para <destino> [--titulo "<t>"] [--data AAAA-MM-DD]
//
// Porque existe: cada plugin activo põe na lista de **todas** as sessões o nome e a descrição de cada
// um dos seus skills, quer a tarefa os use quer não. Num projecto que só precisa de dois plugins, os
// outros dez são peso morto em cada pedido. Desligar um plugin **num projecto** resolve isso sem o
// desinstalar: o `enabledPlugins` do `<projecto>/.claude/settings.json` sobrepõe o do utilizador.
//
// O que isto nunca faz: tocar no `~/.claude/settings.json`. O ficheiro do utilizador é dele e vale
// para todos os projectos; aqui só se lê. `desligar` e `ligar` escrevem só no do projecto, só mexem
// no `enabledPlugins`, e conservam o resto do ficheiro como estava (chaves, ordem, indentação, fim de
// linha, BOM). O `arquivar` guarda o texto integral de um ficheiro antes de ele ser condensado, para
// o porquê e as datas não se perderem com o corte.
//
// Só módulos do Node. As funções por trás de cada subcomando estão exportadas para os testes, e
// recebem a pasta pessoal (`casa`) por parâmetro: os testes nunca tocam no `~/.claude` real.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------- JSON e estilo do ficheiro

const SEM_BOM = (texto) => (texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto);

// Lê um JSON tolerando BOM (o Windows e alguns editores acrescentam-no). Ficheiro em falta dá `{}`;
// ficheiro que não é JSON levanta, porque escrever por cima de um ficheiro que não percebemos
// destruía o que lá estava.
export function lerJson(ficheiro) {
  if (!fs.existsSync(ficheiro)) return {};
  const texto = SEM_BOM(fs.readFileSync(ficheiro, 'utf8'));
  try {
    const valor = JSON.parse(texto);
    if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) throw new Error('não é um objecto');
    return valor;
  } catch (erro) {
    throw new Error(`${ficheiro.replaceAll('\\', '/')} não é JSON válido (${erro.message}); não lhe toquei.`);
  }
}

// Reescreve o objecto na forma do ficheiro de onde veio: indentação (a da primeira linha indentada,
// por omissão 2 espaços), fim de linha (CRLF ou LF), BOM e linha final. Um ficheiro novo sai com
// 2 espaços, LF e linha final.
export function serializar(objecto, original = null) {
  const texto = original === null ? null : SEM_BOM(original);
  const eol = texto?.includes('\r\n') ? '\r\n' : '\n';
  const indentacao = texto?.match(/^([ \t]+)\S/m)?.[1] ?? '  ';
  const linhaFinal = texto === null ? true : /\n$/.test(texto);
  const bom = original?.charCodeAt(0) === 0xfeff ? '﻿' : '';
  const corpo = JSON.stringify(objecto, null, indentacao).replace(/\n/g, eol);
  return bom + corpo + (linhaFinal ? eol : '');
}

const settingsDoProjecto = (projecto) => path.join(projecto, '.claude', 'settings.json');
const settingsDoUtilizador = (casa) => path.join(casa, '.claude', 'settings.json');

// ---------------------------------------------------------------- plugins: o que está activo

// `enabledPlugins` do utilizador sobreposto pelo do projecto. O do projecto manda, e `false` desliga.
export function pluginsActivos({ projecto = '.', casa = os.homedir() } = {}) {
  const doUtilizador = lerJson(settingsDoUtilizador(casa)).enabledPlugins ?? {};
  const doProjecto = lerJson(settingsDoProjecto(projecto)).enabledPlugins ?? {};
  const origem = new Map();
  const estado = new Map();
  for (const [fonte, mapa] of [['utilizador', doUtilizador], ['projecto', doProjecto]]) {
    for (const [id, valor] of Object.entries(mapa)) {
      estado.set(id, Boolean(valor));
      origem.set(id, fonte);
    }
  }
  return [...estado].filter(([, activo]) => activo).map(([id]) => ({ id, origem: origem.get(id) }));
}

// ---------------------------------------------------------------- plugins: o peso dos skills

// O valor de `description:` no frontmatter, em qualquer das formas de YAML que os skills usam: numa
// linha, entre aspas, ou em bloco (`>`, `|`) e continuação indentada.
export function descricaoDoSkill(texto) {
  const linhas = SEM_BOM(texto).split(/\r?\n/);
  if (linhas[0]?.trim() !== '---') return '';
  const fim = linhas.indexOf('---', 1);
  const cabeca = linhas.slice(1, fim === -1 ? linhas.length : fim);
  const i = cabeca.findIndex((l) => /^description:/.test(l));
  if (i === -1) return '';
  const partes = [cabeca[i].replace(/^description:\s*/, '')];
  for (let j = i + 1; j < cabeca.length && /^\s+\S/.test(cabeca[j]); j++) partes.push(cabeca[j].trim());
  let valor = partes.join(' ').trim();
  if (/^[>|][+-]?\s*/.test(valor) && partes[0].match(/^[>|][+-]?$/)) valor = partes.slice(1).join(' ').trim();
  return valor.replace(/^(["'])([\s\S]*)\1$/, '$2');
}

const partesDaVersao = (v) => v.split(/[.+-]/).map((p) => (/^\d+$/.test(p) ? Number(p) : -1));

// A versão mais recente de uma pasta de cache: a maior por números (1.10.0 > 1.9.0); as que não são
// números de versão (um hash, por exemplo) ordenam-se pela data da pasta e ficam abaixo das numéricas.
export function versaoMaisRecente(pasta) {
  const versoes = fs.readdirSync(pasta, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  const eNumerica = (v) => /^\d+(\.\d+)*/.test(v);
  versoes.sort((a, b) => {
    if (eNumerica(a) && eNumerica(b)) {
      const [pa, pb] = [partesDaVersao(a), partesDaVersao(b)];
      for (let k = 0; k < Math.max(pa.length, pb.length); k++) {
        const d = (pb[k] ?? 0) - (pa[k] ?? 0);
        if (d !== 0) return d;
      }
      return 0;
    }
    if (eNumerica(a) !== eNumerica(b)) return eNumerica(a) ? -1 : 1;
    return fs.statSync(path.join(pasta, b)).mtimeMs - fs.statSync(path.join(pasta, a)).mtimeMs;
  });
  return versoes[0] ?? null;
}

// O peso que um plugin põe na lista de cada sessão: quantos skills tem e quantos bytes de
// `description:` somam. `null` quando o plugin não está na cache (nunca falha por isso).
export function pesoDoPlugin(id, { casa = os.homedir() } = {}) {
  const corte = id.lastIndexOf('@');
  if (corte <= 0) return null;
  const pasta = path.join(casa, '.claude', 'plugins', 'cache', id.slice(corte + 1), id.slice(0, corte));
  if (!fs.existsSync(pasta)) return null;
  const versao = versaoMaisRecente(pasta);
  if (!versao) return null;
  const skills = path.join(pasta, versao, 'skills');
  let bytes = 0;
  let n = 0;
  if (fs.existsSync(skills)) {
    for (const e of fs.readdirSync(skills, { withFileTypes: true })) {
      const ficheiro = path.join(skills, e.name, 'SKILL.md');
      if (!e.isDirectory() || !fs.existsSync(ficheiro)) continue;
      n++;
      bytes += Buffer.byteLength(descricaoDoSkill(fs.readFileSync(ficheiro, 'utf8')), 'utf8');
    }
  }
  return { versao, skills: n, bytes };
}

export function listarPlugins(opcoes = {}) {
  return pluginsActivos(opcoes)
    .map((p) => ({ ...p, peso: pesoDoPlugin(p.id, opcoes) }))
    .sort((a, b) => (b.peso?.bytes ?? -1) - (a.peso?.bytes ?? -1) || a.id.localeCompare(b.id));
}

export function relatorioDePlugins(plugins) {
  if (!plugins.length) return 'Nenhum plugin activo.';
  const l = ['| Plugin | Origem | Skills | Bytes de description |', '|---|---|---:|---:|'];
  for (const p of plugins) {
    l.push(`| ${p.id} | ${p.origem} | ${p.peso ? p.peso.skills : '—'} | ${p.peso ? p.peso.bytes : 'sem cache'} |`);
  }
  const com = plugins.filter((p) => p.peso);
  l.push('', `${plugins.length} plugins activos; ${com.reduce((s, p) => s + p.peso.skills, 0)} skills e ` +
    `${com.reduce((s, p) => s + p.peso.bytes, 0)} bytes de description em cada sessão` +
    `${com.length < plugins.length ? ` (sem contar os ${plugins.length - com.length} sem cache)` : ''}.`);
  return l.join('\n');
}

// ---------------------------------------------------------------- desligar e ligar

function lerSettingsDoProjecto(projecto) {
  const ficheiro = settingsDoProjecto(projecto);
  const original = fs.existsSync(ficheiro) ? fs.readFileSync(ficheiro, 'utf8') : null;
  const settings = lerJson(ficheiro);
  if (settings.enabledPlugins !== undefined && (typeof settings.enabledPlugins !== 'object' || settings.enabledPlugins === null || Array.isArray(settings.enabledPlugins))) {
    throw new Error(`\`enabledPlugins\` em ${ficheiro.replaceAll('\\', '/')} não é um objecto; não lhe toquei.`);
  }
  return { ficheiro, original, settings };
}

const escrever = (ficheiro, settings, original) => {
  fs.mkdirSync(path.dirname(ficheiro), { recursive: true });
  fs.writeFileSync(ficheiro, serializar(settings, original));
};

// Acrescenta `"<id>": false` ao `enabledPlugins` do projecto. Nunca escreve no do utilizador: a função
// nem sabe onde ele está.
export function desligar(ids, { projecto = '.' } = {}) {
  const { ficheiro, original, settings } = lerSettingsDoProjecto(projecto);
  const resultados = [];
  let mudou = false;
  for (const id of ids) {
    if (settings.enabledPlugins?.[id] === false) {
      resultados.push({ id, estado: 'ja-desligado' });
      continue;
    }
    settings.enabledPlugins ??= {};
    settings.enabledPlugins[id] = false;
    resultados.push({ id, estado: 'desligado' });
    mudou = true;
  }
  if (mudou) escrever(ficheiro, settings, original);
  return { ficheiro, resultados, escreveu: mudou };
}

// Remove o id do `enabledPlugins` do projecto: volta a valer o do utilizador. Se o objecto ficar
// vazio, sai a chave.
export function ligar(ids, { projecto = '.' } = {}) {
  const { ficheiro, original, settings } = lerSettingsDoProjecto(projecto);
  const resultados = [];
  let mudou = false;
  for (const id of ids) {
    if (!settings.enabledPlugins || !(id in settings.enabledPlugins)) {
      resultados.push({ id, estado: 'nao-estava' });
      continue;
    }
    delete settings.enabledPlugins[id];
    resultados.push({ id, estado: 'religado' });
    mudou = true;
  }
  if (settings.enabledPlugins && Object.keys(settings.enabledPlugins).length === 0) {
    delete settings.enabledPlugins;
    mudou = true;
  }
  if (mudou) escrever(ficheiro, settings, original);
  return { ficheiro, resultados, escreveu: mudou };
}

export function relatorioDeLigacao(accao, { ficheiro, resultados, escreveu }) {
  const frases = {
    desligado: (id) => `- ${id}: desligado neste projecto.`,
    'ja-desligado': (id) => `- ${id}: já estava desligado (\`false\`); nada a escrever.`,
    religado: (id) => `- ${id}: voltou a valer o do utilizador.`,
    'nao-estava': (id) => `- ${id}: não estava no \`enabledPlugins\` do projecto; nada a escrever.`,
  };
  const l = resultados.map((r) => frases[r.estado](r.id));
  l.push('', escreveu ? `Escrito: ${ficheiro.replaceAll('\\', '/')}.` : 'Não escrevi nada.');
  if (accao === 'desligar' && escreveu) {
    l.push('O plugin continua instalado e só deixa de carregar neste projecto; as outras sessões e projectos não mudam. A sessão aberta só o larga ao reiniciar.');
  }
  return l.join('\n');
}

// ---------------------------------------------------------------- arquivar

const hoje = () => {
  const d = new Date();
  const dois = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
};

export function cabecalhoDeArquivo(ficheiro, titulo, data) {
  return [
    `# ${titulo} (arquivo)`,
    '',
    `Cópia integral de \`${ficheiro.replaceAll('\\', '/')}\` em ${data}, guardada antes de o condensar para caber no contexto fixo.`,
    'O original e o núcleo mandam; isto guarda o porquê e as datas.',
    '',
    '---',
    '',
    '',
  ].join('\n');
}

// Copia o ficheiro, byte a byte, para `destino`, precedido do cabeçalho. Recusa um destino que exista
// (um arquivo não se sobrepõe: é a memória do que havia) e confirma, depois de escrever, que o que vem
// a seguir ao cabeçalho é idêntico ao original.
export function arquivar(ficheiro, destino, { titulo, data } = {}) {
  if (data !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(data)) throw new Error(`--data tem de ser AAAA-MM-DD, e veio \`${data}\`.`);
  if (!fs.existsSync(ficheiro)) throw new Error(`Não encontrei ${ficheiro}.`);
  if (fs.existsSync(destino)) throw new Error(`${destino.replaceAll('\\', '/')} já existe; não o sobrescrevo. Escolhe outro destino.`);

  const original = fs.readFileSync(ficheiro);
  const cabecalho = Buffer.from(cabecalhoDeArquivo(ficheiro, titulo ?? path.basename(ficheiro), data ?? hoje()), 'utf8');
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, Buffer.concat([cabecalho, original]), { flag: 'wx' });

  const copia = fs.readFileSync(destino);
  if (!copia.subarray(cabecalho.length).equals(original)) {
    throw new Error(`A cópia em ${destino.replaceAll('\\', '/')} não é idêntica ao original a seguir ao cabeçalho. Confere-a antes de condensar.`);
  }
  return { destino, bytes: original.length, cabecalho: cabecalho.length };
}

// ---------------------------------------------------------------- linha de comandos

const COM_VALOR = new Set(['projecto', 'para', 'titulo', 'data']);

export function lerArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) {
      args._.push(argv[i]);
      continue;
    }
    const nome = argv[i].slice(2);
    if (!COM_VALOR.has(nome)) {
      args[nome] = true;
      continue;
    }
    if (argv[i + 1] === undefined) throw new Error(`--${nome} pede um valor.`);
    args[nome] = argv[++i];
  }
  return args;
}

const USO = `Uso:
  node projecto.mjs plugins  [--projecto .] [--json]
  node projecto.mjs desligar <id>... [--projecto .]
  node projecto.mjs ligar    <id>... [--projecto .]
  node projecto.mjs arquivar <ficheiro> --para <destino> [--titulo "<t>"] [--data AAAA-MM-DD]`;

export function main(argv) {
  const [sub, ...resto] = argv;
  let args;
  try {
    args = lerArgs(resto);
  } catch (erro) {
    console.error(erro.message);
    return 2;
  }
  const projecto = path.resolve(args.projecto ?? '.');
  try {
    if (sub === 'plugins') {
      const plugins = listarPlugins({ projecto });
      console.log(args.json ? JSON.stringify(plugins, null, 2) : relatorioDePlugins(plugins));
      return 0;
    }
    if (sub === 'desligar' || sub === 'ligar') {
      if (!args._.length) {
        console.error(`${sub} pede pelo menos um id (\`plugin@marketplace\`).\n${USO}`);
        return 2;
      }
      console.log(relatorioDeLigacao(sub, (sub === 'desligar' ? desligar : ligar)(args._, { projecto })));
      return 0;
    }
    if (sub === 'arquivar') {
      if (args._.length !== 1 || !args.para) {
        console.error(`arquivar pede um ficheiro e --para <destino>.\n${USO}`);
        return 2;
      }
      const r = arquivar(args._[0], path.resolve(args.para), { titulo: args.titulo, data: args.data });
      console.log(`Arquivado em ${r.destino.replaceAll('\\', '/')}: ${r.bytes} bytes do original, idênticos byte a byte depois do cabeçalho.`);
      return 0;
    }
  } catch (erro) {
    console.error(erro.message);
    return 1;
  }
  console.error(USO);
  return 2;
}

// No Windows a letra da unidade pode vir em minúsculas, por isso compara sem distinguir maiúsculas.
const executadoDirectamente =
  process.argv[1] &&
  path.resolve(fileURLToPath(import.meta.url)).toLowerCase() === path.resolve(process.argv[1]).toLowerCase();
if (executadoDirectamente) process.exitCode = main(process.argv.slice(2));
