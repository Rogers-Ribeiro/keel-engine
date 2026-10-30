#!/usr/bin/env node
// Mede onde se vai o contexto e os tokens de um projecto, para se decidir o que cortar com números.
//
//   node medir.mjs [--projecto <pasta>=.] [--sessoes N=10] [--pasta-sessoes <dir>] [--json]
//
// Só lê. Nunca escreve nada e nunca imprime o texto de um prompt nem de uma resposta: das sessões
// só entram contagens (`usage`), o nome do modelo e o nome do ficheiro. Sai sempre com 0, porque é
// um relatório, e quem decide o que fazer a cada conclusão é a pessoa — as que são prática ou
// escolha (sessões mais curtas, que plugins ficam) vêm marcadas `decide`.
//
// O Claude Code guarda cada sessão em `~/.claude/projects/<slug>/<id>.jsonl`, e o `<slug>` é o
// caminho absoluto do projecto com tudo o que não é [A-Za-z0-9] trocado por `-`. Os ficheiros chegam
// a centenas de MB, por isso lêem-se em streaming, linha a linha, e só se faz `JSON.parse` das
// linhas que contêm `"usage"`. O contexto de uma chamada é o que lhe entrou: input + leitura de
// cache + criação de cache. O contador do contexto fixo (CLAUDE.md, imports, regras sem `paths:`)
// é o de `skills/keel-init/contexto.mjs`, que não se reescreve aqui.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { contexto as medirContextoFixo } from '../keel-init/contexto.mjs';

// Limiares das conclusões. Cada um dispara só acima do valor (estritamente).
export const LIMITES = {
  medianaContexto: 300_000, // tokens de contexto, mediana por chamada
  memoriaBytes: 4096,
  memoriaLinhas: 100,
  memoriaTruncaLinhas: 200, // o Claude Code só carrega as primeiras 200 linhas do MEMORY.md
  regrasSemPathsBytes: 20 * 1024,
  aberturaTokens: 60_000, // contexto da primeira chamada «a sério» de uma sessão
  chamadasSessaoLonga: 3000,
};
const MINIMO_ABERTURA = 5000;
const QUEDA_COMPACTACAO = 0.5;
const SESSOES_POR_OMISSAO = 10;

// ---------------------------------------------------------------------------------------------
// Sessões

// `C:\Projects\AnnieFlow` -> `C--Projects-AnnieFlow`; `/home/x/p` -> `-home-x-p`.
export const slugDe = (caminho) => caminho.replace(/[^A-Za-z0-9]/g, '-');

// No Windows a letra da unidade pode vir em minúscula, por isso compara sem distinguir maiúsculas.
export function encontrarPastaSessoes(projecto, raizProjectos) {
  const slug = slugDe(projecto).toLowerCase();
  let nomes;
  try {
    nomes = fs.readdirSync(raizProjectos, { withFileTypes: true });
  } catch {
    return null;
  }
  const achada = nomes.find((d) => d.isDirectory() && d.name.toLowerCase() === slug);
  return achada ? path.join(raizProjectos, achada.name) : null;
}

// Os N `.jsonl` mais recentes directamente na pasta. As subpastas são subagentes e ficam de fora.
export function sessoesRecentes(pasta, n) {
  let entradas;
  try {
    entradas = fs.readdirSync(pasta, { withFileTypes: true });
  } catch {
    return [];
  }
  return entradas
    .filter((d) => d.isFile() && d.name.endsWith('.jsonl'))
    .map((d) => {
      const abs = path.join(pasta, d.name);
      return { abs, mtime: fs.statSync(abs).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, n)
    .map((f) => f.abs);
}

export const mediana = (ordenados) => {
  const n = ordenados.length;
  if (n === 0) return 0;
  return n % 2 ? ordenados[(n - 1) / 2] : (ordenados[n / 2 - 1] + ordenados[n / 2]) / 2;
};

// Posto mais próximo: o menor valor que cobre `p` dos casos.
export const percentil = (ordenados, p) =>
  ordenados.length === 0 ? 0 : ordenados[Math.max(0, Math.ceil(p * ordenados.length) - 1)];

const numero = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// Sobre os contextos pela ordem das chamadas. Compactação é uma queda para menos de metade.
export function estatisticas(contextos) {
  const ordenados = [...contextos].sort((a, b) => a - b);
  let compactacoes = 0;
  for (let i = 1; i < contextos.length; i++) {
    if (contextos[i] < contextos[i - 1] * QUEDA_COMPACTACAO) compactacoes++;
  }
  return {
    chamadas: contextos.length,
    mediana: mediana(ordenados),
    p90: percentil(ordenados, 0.9),
    maximo: ordenados.length ? ordenados[ordenados.length - 1] : 0,
    compactacoes,
    abertura: contextos.find((c) => c > MINIMO_ABERTURA) ?? null,
  };
}

export async function medirSessao(ficheiro) {
  const contextos = [];
  const modelos = {};
  let cacheLida = 0;
  let entrada = 0;
  let saida = 0;
  let linhasIlegiveis = 0;
  // O Claude Code escreve uma linha por bloco da mesma resposta (pensamento, texto, cada chamada de
  // ferramenta), todas com o mesmo `message.id`, e **intercala-as com outras linhas**: medido numa
  // sessão real, cerca de metade das linhas com `usage` são repetições e uma resposta chega a ter
  // 48. Por isso a junção é por `id` em toda a sessão, e não só entre linhas seguidas. Fica a última
  // de cada `id` (a que traz o `usage` completo). Uma linha sem `id` conta como uma resposta.
  // O que se guarda por `id` são quatro números, e não a linha: uma sessão de 350 MB tem uns 10 mil.
  const respostas = new Map();
  let semId = 0;

  const leitor = readline.createInterface({
    input: fs.createReadStream(ficheiro, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });
  for await (const linha of leitor) {
    if (!linha.includes('"usage"')) continue;
    let registo;
    try {
      registo = JSON.parse(linha);
    } catch {
      linhasIlegiveis++;
      continue;
    }
    const usage = registo?.type === 'assistant' ? registo.message?.usage : null;
    if (!usage || typeof usage !== 'object') continue;
    const id = registo.message?.id;
    respostas.set(typeof id === 'string' && id ? id : `sem-id-${semId++}`, {
      input: numero(usage.input_tokens),
      lida: numero(usage.cache_read_input_tokens),
      criada: numero(usage.cache_creation_input_tokens),
      saidaTokens: numero(usage.output_tokens),
      modelo: typeof registo.message?.model === 'string' ? registo.message.model : null,
    });
  }

  for (const { input, lida, criada, saidaTokens, modelo } of respostas.values()) {
    const total = input + lida + criada;
    if (total === 0) continue;
    contextos.push(total);
    entrada += total;
    cacheLida += lida;
    saida += saidaTokens;
    if (modelo) modelos[modelo] = (modelos[modelo] ?? 0) + 1;
  }

  return {
    sessao: path.basename(ficheiro, '.jsonl'),
    ...estatisticas(contextos),
    modelos,
    fraccaoCache: entrada ? cacheLida / entrada : 0,
    tokensSaida: saida,
    linhasIlegiveis,
  };
}

// ---------------------------------------------------------------------------------------------
// O que é fixo: regras, memória, plugins, agentes

const lerTexto = (abs) => {
  try {
    return fs.readFileSync(abs, 'utf8');
  } catch {
    return null;
  }
};

const frontmatter = (texto) => texto.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';

export function medirRegras(projecto) {
  const pasta = path.join(projecto, '.claude', 'rules');
  const ficheiros = [];
  if (fs.existsSync(pasta)) {
    for (const nome of fs.readdirSync(pasta, { recursive: true }).map(String).sort()) {
      if (!nome.endsWith('.md')) continue;
      const abs = path.join(pasta, nome);
      const texto = lerTexto(abs);
      if (texto === null) continue;
      ficheiros.push({
        ficheiro: nome.replaceAll('\\', '/'),
        bytes: Buffer.byteLength(texto),
        temPaths: /^paths\s*:/m.test(frontmatter(texto)),
      });
    }
  }
  const soma = (f) => ficheiros.filter(f).reduce((s, r) => s + r.bytes, 0);
  return { ficheiros, bytesComPaths: soma((r) => r.temPaths), bytesSemPaths: soma((r) => !r.temPaths) };
}

export function medirMemoria(pastaSessoes) {
  if (!pastaSessoes) return { existe: false, bytes: 0, linhas: 0, ficheiros: 0, aviso: null };
  const pasta = path.join(pastaSessoes, 'memory');
  const texto = lerTexto(path.join(pasta, 'MEMORY.md'));
  let ficheiros = 0;
  try {
    ficheiros = fs.readdirSync(pasta).filter((n) => n.endsWith('.md')).length;
  } catch {
    // sem pasta de memória: fica a zero
  }
  if (texto === null) return { existe: false, bytes: 0, linhas: 0, ficheiros, aviso: null };
  const linhas = texto.split(/\r?\n/).filter((l, i, todas) => i < todas.length - 1 || l !== '').length;
  const aviso =
    linhas > LIMITES.memoriaTruncaLinhas
      ? `o MEMORY.md tem ${linhas} linhas e o Claude Code só carrega as primeiras ${LIMITES.memoriaTruncaLinhas}`
      : null;
  return { existe: true, bytes: Buffer.byteLength(texto), linhas, ficheiros, aviso };
}

// JSON tolerando BOM; um ficheiro que falta ou não lê dá `{}` e um aviso, nunca uma excepção.
const lerJson = (abs, avisos) => {
  const texto = lerTexto(abs);
  if (texto === null) return {};
  try {
    return JSON.parse(texto.replace(/^\uFEFF/, ''));
  } catch {
    avisos.push(`não consegui ler ${abs.replaceAll('\\', '/')} como JSON`);
    return {};
  }
};

// O do projecto manda sobre o do utilizador, e `false` desliga.
export function medirPlugins(projecto, home = os.homedir()) {
  const avisos = [];
  const doUtilizador = lerJson(path.join(home, '.claude', 'settings.json'), avisos).enabledPlugins ?? {};
  const doProjecto = lerJson(path.join(projecto, '.claude', 'settings.json'), avisos).enabledPlugins ?? {};
  const efectivos = new Map();
  for (const [id, v] of Object.entries(doUtilizador)) efectivos.set(id, { id, activo: v !== false, origem: 'utilizador' });
  for (const [id, v] of Object.entries(doProjecto)) efectivos.set(id, { id, activo: v !== false, origem: 'projecto' });
  return { plugins: [...efectivos.values()], avisos };
}

export function medirAgentes(projecto) {
  const pasta = path.join(projecto, '.claude', 'agents');
  let nomes;
  try {
    nomes = fs.readdirSync(pasta).filter((n) => n.endsWith('.md')).sort();
  } catch {
    return [];
  }
  return nomes.map((ficheiro) => {
    const fm = frontmatter(lerTexto(path.join(pasta, ficheiro)) ?? '');
    const campo = (nome) => fm.match(new RegExp(`^${nome}\\s*:[ \\t]*(.*)$`, 'm'))?.[1].trim() ?? '';
    const modelo = campo('model').replace(/^["']|["']$/g, '');
    const inline = campo('tools');
    let ferramentas = 0;
    if (inline) {
      ferramentas = inline.replace(/^\[|\]$/g, '').split(',').filter((t) => t.trim()).length;
    } else {
      // lista YAML: os pontos que vêm logo a seguir a `tools:`
      const bloco = fm.match(/^tools\s*:[ \t]*\r?\n((?:[ \t]*-[^\r\n]*\r?\n?)+)/m)?.[1] ?? '';
      ferramentas = bloco.split(/\r?\n/).filter((l) => /^\s*-\s*\S/.test(l)).length;
    }
    return {
      nome: campo('name') || ficheiro.replace(/\.md$/, ''),
      modelo: modelo || 'herda',
      ferramentas,
    };
  });
}

// ---------------------------------------------------------------------------------------------
// Medir tudo, concluir, apresentar

export async function medirTudo({
  projecto,
  sessoes = SESSOES_POR_OMISSAO,
  pastaSessoes,
  home = os.homedir(),
}) {
  const pasta = pastaSessoes ?? encontrarPastaSessoes(projecto, path.join(home, '.claude', 'projects'));
  const ficheiros = pasta ? sessoesRecentes(pasta, sessoes) : [];
  const medidas = [];
  for (const f of ficheiros) medidas.push(await medirSessao(f));

  let mensagem = null;
  if (!pasta || !fs.existsSync(pasta)) mensagem = 'Não encontrei a pasta de sessões deste projecto.';
  else if (medidas.length === 0) mensagem = `Não há sessões (.jsonl) em ${pasta.replaceAll('\\', '/')}.`;

  const aberturas = medidas.map((s) => s.abertura).filter((a) => a !== null).sort((a, b) => a - b);
  const fixo = medirContextoFixo(projecto);
  return {
    projecto,
    sessoes: {
      pasta,
      mensagem,
      lista: medidas,
      resumo: {
        medianaDasMedianas: mediana(medidas.map((s) => s.mediana).sort((a, b) => a - b)),
        aberturaMediana: aberturas.length ? mediana(aberturas) : null,
        linhasIlegiveis: medidas.reduce((s, m) => s + m.linhasIlegiveis, 0),
      },
    },
    contextoFixo: { linhas: fixo.total.linhas, limite: fixo.limite, avisos: fixo.avisos },
    regras: medirRegras(projecto),
    memoria: medirMemoria(pasta),
    plugins: medirPlugins(projecto, home),
    agentes: medirAgentes(projecto),
  };
}

// Só devolve as que se verificam. `tipo`: 'como' é mecânico, 'decide' é escolha da pessoa.
export function conclusoes(m) {
  const lista = [];
  const kb = (b) => `${(b / 1024).toFixed(1)} KB`;
  const resumo = m.sessoes?.resumo;
  const sessoes = m.sessoes?.lista ?? [];

  if (resumo && resumo.medianaDasMedianas > LIMITES.medianaContexto) {
    lista.push({
      id: 'a',
      causa: 'Sessões longas: cada chamada relê um contexto muito grande',
      evidencia: `mediana do contexto por chamada ${resumo.medianaDasMedianas} tokens, acima de ${LIMITES.medianaContexto}`,
      accao: 'Abrir uma sessão nova por bloco de trabalho e usar /compact antes de o contexto crescer',
      tipo: 'decide',
    });
  }
  if (m.contextoFixo && m.contextoFixo.linhas > m.contextoFixo.limite) {
    lista.push({
      id: 'b',
      causa: 'Contexto fixo acima do limite',
      evidencia: `${m.contextoFixo.linhas} linhas de contexto fixo, acima de ${m.contextoFixo.limite}`,
      accao: 'Condensar o CLAUDE.md e arquivar a história que já não orienta o trabalho',
      tipo: 'como',
    });
  }
  const mem = m.memoria;
  if (mem?.existe && (mem.bytes > LIMITES.memoriaBytes || mem.linhas > LIMITES.memoriaLinhas)) {
    lista.push({
      id: 'c',
      causa: 'MEMORY.md grande: entra inteiro em cada sessão',
      evidencia: `${mem.bytes} bytes e ${mem.linhas} linhas (limiares ${LIMITES.memoriaBytes} bytes e ${LIMITES.memoriaLinhas} linhas)`,
      accao: 'Consolidar a memória: fundir entradas, tirar o que envelheceu, deixar no índice uma linha por ficheiro',
      tipo: 'como',
    });
  }
  const semPaths = m.regras?.bytesSemPaths ?? 0;
  if (semPaths > LIMITES.regrasSemPathsBytes) {
    lista.push({
      id: 'd',
      causa: 'Regras sem `paths:` carregam sempre',
      evidencia: `${kb(semPaths)} de regras sem \`paths:\`, acima de ${kb(LIMITES.regrasSemPathsBytes)}`,
      accao: 'Dar `paths:` no frontmatter aos temas, para só carregarem quando se toca num ficheiro que case',
      tipo: 'como',
    });
  }
  if (resumo?.aberturaMediana != null && resumo.aberturaMediana > LIMITES.aberturaTokens) {
    lista.push({
      id: 'e',
      causa: 'A sessão abre já com muito contexto',
      evidencia: `abertura mediana de ${resumo.aberturaMediana} tokens, acima de ${LIMITES.aberturaTokens}`,
      accao: 'Rever que plugins estão activos; os conectores (MCP) desligam-se em /mcp',
      tipo: 'decide',
    });
  }
  const longas = sessoes.filter((s) => s.chamadas > LIMITES.chamadasSessaoLonga && s.mediana > LIMITES.medianaContexto);
  if (longas.length) {
    lista.push({
      id: 'f',
      causa: 'Ciclo ou espera numa sessão de contexto grande',
      evidencia: longas.map((s) => `${s.sessao}: ${s.chamadas} chamadas, mediana ${s.mediana} tokens`).join('; '),
      accao: 'Ver o que fazia a sessão em tantas chamadas (ciclo sem fim, espera activa) e partir o trabalho',
      tipo: 'decide',
    });
  }
  return lista;
}

const n = (v) => Math.round(v).toLocaleString('en-US').replaceAll(',', ' ');
const pct = (v) => `${(v * 100).toFixed(0)}%`;

export function relatorio(medidas) {
  const out = [];
  const { sessoes, contextoFixo, regras, memoria, plugins, agentes } = medidas;

  out.push('## Sessões', '');
  if (sessoes.mensagem) out.push(sessoes.mensagem, '');
  if (sessoes.lista.length) {
    out.push('| Sessão | Chamadas | Mediana | P90 | Máximo | Compactações | Cache | Saída | Abertura | Ilegíveis | Modelos |');
    out.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|');
    for (const s of sessoes.lista) {
      const modelos = Object.entries(s.modelos).map(([k, v]) => `${k}×${v}`).join(', ') || '—';
      out.push(
        `| ${s.sessao} | ${s.chamadas} | ${n(s.mediana)} | ${n(s.p90)} | ${n(s.maximo)} | ${s.compactacoes} | ${pct(s.fraccaoCache)} | ${n(s.tokensSaida)} | ${s.abertura === null ? '—' : n(s.abertura)} | ${s.linhasIlegiveis} | ${modelos} |`,
      );
    }
    out.push('');
    if (sessoes.resumo.linhasIlegiveis > 0) {
      out.push(`Atenção: ${sessoes.resumo.linhasIlegiveis} linhas não se conseguiram ler como JSON e ficaram de fora das contas.`, '');
    }
  }

  out.push('## Contexto fixo', '');
  out.push(`${contextoFixo.linhas} linhas (limite ${contextoFixo.limite}).`, '');
  for (const a of contextoFixo.avisos) out.push(`- ${a}`);
  if (contextoFixo.avisos.length) out.push('');

  out.push('## Regras', '');
  if (regras.ficheiros.length) {
    out.push('| Regra | Bytes | `paths:` |', '|---|---:|---|');
    for (const r of regras.ficheiros) out.push(`| \`${r.ficheiro}\` | ${r.bytes} | ${r.temPaths ? 'sim' : 'não (carrega sempre)'} |`);
    out.push('');
  }
  out.push(`Com \`paths:\`: ${regras.bytesComPaths} bytes. Sem \`paths:\` (carregam sempre): ${regras.bytesSemPaths} bytes.`, '');

  out.push('## Memória', '');
  if (memoria.existe) out.push(`MEMORY.md: ${memoria.bytes} bytes, ${memoria.linhas} linhas; ${memoria.ficheiros} ficheiros .md na pasta.`);
  else out.push(`Sem MEMORY.md; ${memoria.ficheiros} ficheiros .md na pasta.`);
  if (memoria.aviso) out.push('', `Atenção: ${memoria.aviso}.`);
  out.push('');

  out.push('## Plugins', '');
  if (plugins.plugins.length) {
    out.push('| Plugin | Estado | Origem |', '|---|---|---|');
    for (const p of plugins.plugins) out.push(`| ${p.id} | ${p.activo ? 'activo' : 'desligado'} | ${p.origem} |`);
  } else out.push('Nenhum plugin declarado em `enabledPlugins`.');
  for (const a of plugins.avisos) out.push('', `Atenção: ${a}.`);
  out.push('');

  out.push('## Agentes', '');
  if (agentes.length) {
    out.push('| Agente | Modelo | Ferramentas |', '|---|---|---:|');
    for (const a of agentes) out.push(`| ${a.nome} | ${a.modelo} | ${a.ferramentas} |`);
  } else out.push('Nenhum agente em `.claude/agents/`.');
  out.push('');

  out.push('## Conclusões', '');
  const lista = conclusoes(medidas);
  if (lista.length) {
    out.push('| Causa | Evidência | Acção | Tipo |', '|---|---|---|---|');
    for (const c of lista) out.push(`| ${c.causa} | ${c.evidencia} | ${c.accao} | ${c.tipo === 'como' ? 'como (automática)' : 'decide a pessoa'} |`);
  } else out.push('Nenhum limiar ultrapassado.');
  return out.join('\n');
}

function lerArgumentos(args) {
  const opcoes = { projecto: '.', sessoes: SESSOES_POR_OMISSAO, pastaSessoes: undefined, json: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--json') opcoes.json = true;
    else if (a === '--projecto') opcoes.projecto = args[++i] ?? '.';
    else if (a === '--pasta-sessoes') opcoes.pastaSessoes = args[++i];
    else if (a === '--sessoes') {
      const v = Number(args[++i]);
      if (Number.isInteger(v) && v > 0) opcoes.sessoes = v;
    }
  }
  return { ...opcoes, projecto: path.resolve(opcoes.projecto) };
}

async function main(argv) {
  const opcoes = lerArgumentos(argv.slice(2));
  const medidas = await medirTudo(opcoes);
  const saida = opcoes.json ? JSON.stringify({ ...medidas, conclusoes: conclusoes(medidas) }, null, 2) : relatorio(medidas);
  process.stdout.write(saida + '\n');
  return 0;
}

// No Windows a letra da unidade pode vir em minúsculas, por isso compara sem distinguir maiúsculas.
const executadoDirectamente =
  process.argv[1] &&
  path.resolve(fileURLToPath(import.meta.url)).toLowerCase() === path.resolve(process.argv[1]).toLowerCase();
if (executadoDirectamente) process.exitCode = await main(process.argv);
