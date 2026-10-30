#!/usr/bin/env node
// O que torna segura a consolidação da memória persistente do Claude: cópia de segurança antes, e
// verificação mecânica de que nada se perdeu depois. A fusão dos ficheiros é de um agente; isto é o
// que o impede de «arrumar» a memória apagando lições.
//
//   node memoria.mjs backup   <pasta-memoria> [--destino <pasta>]
//   node memoria.mjs verificar --antes <pasta-backup> --depois <pasta-memoria> [--mapa <ficheiro>] [--minimo 0.97]
//   node memoria.mjs indice   <pasta-memoria>
//   node memoria.mjs segredos <pasta-memoria>
//
// Porque existe: um agente que funde vinte ficheiros em oito descreve o resultado como «sem perdas»
// com a mesma confiança com que descreveria uma perda. A verificação não lhe pergunta: mede. Pega
// em cada original, tira o que a fusão reescreve de propósito (frontmatter, ligações `[[...]]`,
// sufixos `(§ ...)`, identificadores entre crases) e conta que fracção das sequências de 6 palavras
// seguidas continua a existir em algum ficheiro de depois. Uma frase apagada deixa de existir lá.
//
// Sai com 0 se tudo estiver bem e com 1 se algo falhar (ou se a chamada for inválida), dizendo o
// quê no stderr. O `segredos` diz só o ficheiro e a linha, nunca o valor: a saída acaba em registos.
// O `backup` nunca apaga nada.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LIMITE_GLOBAL = 0.95;
export const MINIMO_POR_FICHEIRO = 0.97;
export const LINHAS_INDICE = 200;
const TAMANHO_SEQUENCIA = 6;
const INDICE = 'MEMORY.md';

const eMd = (nome) => nome.toLowerCase().endsWith('.md');

// Só os `.md` directos da pasta, por ordem: a memória é plana, uma lição por ficheiro.
export function listarMd(pasta) {
  return fs
    .readdirSync(pasta, { withFileTypes: true })
    .filter((e) => e.isFile() && eMd(e.name))
    .map((e) => e.name)
    .sort();
}

const falha = (...erros) => ({ codigo: 1, linhas: [], erros });

const doisDigitos = (n) => String(n).padStart(2, '0');
const dataLocal = (d) => `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;

// ---------------------------------------------------------------------------------------------
// backup
// ---------------------------------------------------------------------------------------------

export function backup(pasta, { destino, hoje = new Date() } = {}) {
  if (!pasta || !fs.existsSync(pasta) || !fs.statSync(pasta).isDirectory()) {
    return falha(`a pasta de memória não existe: ${pasta ?? '(em falta)'}`);
  }
  const origem = path.resolve(pasta);
  const alvo = path.resolve(destino ?? `${origem.replace(/[\\/]+$/, '')}-backup-${dataLocal(hoje)}`);
  // Recusar em vez de juntar: uma cópia a meio de outra não é cópia de nada.
  if (fs.existsSync(alvo)) return falha(`o destino já existe, não o toco: ${alvo}`);

  const ficheiros = listarMd(origem);
  if (ficheiros.length === 0) return falha(`não há ficheiros .md em ${origem}`);

  fs.mkdirSync(alvo, { recursive: true });
  let bytes = 0;
  for (const nome of ficheiros) {
    fs.copyFileSync(path.join(origem, nome), path.join(alvo, nome));
    bytes += fs.statSync(path.join(origem, nome)).size;
  }

  // Confirma na cópia, e não no que se acabou de fazer.
  const copiados = listarMd(alvo);
  const bytesCopiados = copiados.reduce((soma, nome) => soma + fs.statSync(path.join(alvo, nome)).size, 0);
  if (copiados.length !== ficheiros.length || bytesCopiados !== bytes) {
    return falha(
      `a cópia não bate com o original: ${copiados.length}/${ficheiros.length} ficheiros, ${bytesCopiados}/${bytes} bytes (em ${alvo})`,
    );
  }
  return { codigo: 0, linhas: [`cópia feita: ${alvo} (${ficheiros.length} ficheiros, ${bytes} bytes)`], erros: [] };
}

// ---------------------------------------------------------------------------------------------
// verificar
// ---------------------------------------------------------------------------------------------

const FRONTMATTER = /^﻿?---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/;

// O que a fusão reescreve de propósito não conta como perda: ligações, sufixos de origem e
// identificadores (nomes de ficheiro, hashes) entre crases.
export function normalizar(texto) {
  const corpo = texto
    .replace(FRONTMATTER, '')
    .replace(/\[\[[^\]]*\]\]/g, ' ')
    .replace(/\(§[^)]*\)/g, ' ')
    .replace(/`[a-z0-9-]{12,}`/gi, ' ');
  return corpo.toLowerCase().match(/[\p{L}\p{N}_]+/gu) ?? [];
}

export function sequencias(palavras, n = TAMANHO_SEQUENCIA) {
  const lista = [];
  for (let i = 0; i + n <= palavras.length; i++) lista.push(palavras.slice(i, i + n).join(' '));
  return lista;
}

const NOME_MD = /[^\s`"'()[\]|,;*<>]+\.md/g;
const SETA = /->|→|=>/;

// O mapa é texto livre. Cada linha com um nome antigo diz, à direita da seta, os novos; sem seta, são
// os `.md` que vêm depois do primeiro.
function lerMapa(texto, antigos) {
  const porAntigo = new Map();
  const alvos = new Set();
  for (const linha of texto.split(/\r?\n/)) {
    const nomes = linha.match(NOME_MD) ?? [];
    if (!nomes.some((n) => antigos.has(n))) continue;
    const [esquerda, ...resto] = linha.split(SETA);
    const temSeta = resto.length > 0;
    const origens = temSeta ? (esquerda.match(NOME_MD) ?? []) : nomes.slice(0, 1);
    const destinos = temSeta ? (resto.join(' ').match(NOME_MD) ?? []) : nomes.slice(1);
    for (const nome of origens) if (antigos.has(nome)) porAntigo.set(nome, destinos);
    for (const d of destinos) if (d !== INDICE) alvos.add(d);
  }
  return { porAntigo, alvos };
}

const percentagem = (fraccao) => `${(fraccao * 100).toFixed(1)}%`;

export function verificar({ antes, depois, mapa, minimo = MINIMO_POR_FICHEIRO } = {}) {
  for (const [rotulo, pasta] of [['--antes', antes], ['--depois', depois]]) {
    if (!pasta || !fs.existsSync(pasta) || !fs.statSync(pasta).isDirectory()) {
      return falha(`${rotulo} tem de ser uma pasta que existe: ${pasta ?? '(em falta)'}`);
    }
  }
  if (!(minimo >= 0 && minimo <= 1)) return falha('--minimo tem de ser um número entre 0 e 1');

  const originais = listarMd(antes).filter((n) => n !== INDICE);
  const nomesDepois = new Set(listarMd(depois));
  const existentes = new Set();
  for (const nome of nomesDepois) {
    const palavras = normalizar(fs.readFileSync(path.join(depois, nome), 'utf8'));
    for (const s of sequencias(palavras)) existentes.add(s);
  }

  const linhas = [];
  const erros = [];
  let total = 0;
  let encontradas = 0;
  for (const nome of originais) {
    const seqs = sequencias(normalizar(fs.readFileSync(path.join(antes, nome), 'utf8')));
    const presentes = seqs.filter((s) => existentes.has(s)).length;
    total += seqs.length;
    encontradas += presentes;
    // Um original com menos de 6 palavras não tem nada que se meça: não pode falhar.
    const fraccao = seqs.length === 0 ? 1 : presentes / seqs.length;
    linhas.push(`${nome}: ${percentagem(fraccao)} (${presentes}/${seqs.length})`);
    if (fraccao < minimo) erros.push(`${nome}: cobertura ${percentagem(fraccao)}, abaixo do mínimo ${percentagem(minimo)}`);
  }

  const global = total === 0 ? 1 : encontradas / total;
  linhas.push(`global: ${percentagem(global)} (${encontradas}/${total})`);
  if (global < LIMITE_GLOBAL) erros.push(`cobertura global ${percentagem(global)}, abaixo de ${percentagem(LIMITE_GLOBAL)}`);

  if (mapa !== undefined) {
    if (!fs.existsSync(mapa) || !fs.statSync(mapa).isFile()) {
      erros.push(`o mapa não existe: ${mapa}`);
    } else {
      const { porAntigo, alvos } = lerMapa(fs.readFileSync(mapa, 'utf8'), new Set(originais));
      for (const nome of originais) {
        if (!porAntigo.has(nome)) erros.push(`${nome}: sem linha no mapa`);
      }
      for (const alvo of [...alvos].sort()) {
        if (!nomesDepois.has(alvo)) erros.push(`o mapa cita ${alvo}, que não existe em ${depois}`);
      }
    }
  }
  return { codigo: erros.length > 0 ? 1 : 0, linhas, erros };
}

// ---------------------------------------------------------------------------------------------
// indice
// ---------------------------------------------------------------------------------------------

export function indice(pasta) {
  if (!pasta || !fs.existsSync(pasta) || !fs.statSync(pasta).isDirectory()) {
    return falha(`a pasta de memória não existe: ${pasta ?? '(em falta)'}`);
  }
  const ficheiroIndice = path.join(pasta, INDICE);
  if (!fs.existsSync(ficheiroIndice)) return falha(`falta o ${INDICE} em ${pasta}`);

  const linhas = fs.readFileSync(ficheiroIndice, 'utf8').split(/\r?\n/);
  if (linhas[linhas.length - 1] === '') linhas.pop();

  const erros = [];
  // Acima disto o Claude Code trunca o índice ao carregá-lo: o que fica depois da linha 200 não existe.
  if (linhas.length > LINHAS_INDICE) {
    erros.push(`${INDICE} tem ${linhas.length} linhas, o limite é ${LINHAS_INDICE} (acima o Claude Code trunca)`);
  }

  const contagem = new Map();
  for (const [i, linha] of linhas.entries()) {
    for (const m of linha.matchAll(/\]\(([^)\s]+)\)/g)) {
      let alvo = m[1];
      if (/^[a-z][a-z0-9+.-]*:/i.test(alvo) || !eMd(alvo)) continue;
      try {
        alvo = decodeURIComponent(alvo);
      } catch {}
      alvo = alvo.replace(/^\.[\\/]/, '');
      contagem.set(alvo, (contagem.get(alvo) ?? 0) + 1);
      if (!fs.existsSync(path.join(pasta, alvo))) erros.push(`${INDICE}:${i + 1}: a ligação aponta para ${alvo}, que não existe`);
    }
  }

  for (const nome of listarMd(pasta).filter((n) => n !== INDICE)) {
    const vezes = contagem.get(nome) ?? 0;
    if (vezes === 0) erros.push(`${nome}: não aparece no ${INDICE}`);
    else if (vezes > 1) erros.push(`${nome}: aparece ${vezes} vezes no ${INDICE}, devia ser uma`);
  }

  return { codigo: erros.length > 0 ? 1 : 0, linhas: [`${INDICE}: ${linhas.length} linhas`], erros };
}

// ---------------------------------------------------------------------------------------------
// segredos
// ---------------------------------------------------------------------------------------------

const PADROES_SEGREDO = [
  { nome: 'chave sk-', re: /\bsk-[A-Za-z0-9_-]{20,}/ },
  { nome: 'token do GitHub', re: /\b(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/ },
  { nome: 'chave AWS', re: /\bAKIA[A-Z0-9]{16}\b/ },
  { nome: 'token do Slack', re: /\bxox[bp]-[A-Za-z0-9-]{10,}/ },
  { nome: 'chave privada', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
];
const ATRIBUICAO = /(?:password|senha|secret|token)\w*["']?\s*[=:]\s*["']?([^\s"']{8,})/gi;

// `<sua-senha>`, `${TOKEN}`, `xxxxxxxx`, `API_TOKEN`, `process.env.X`: descrevem onde o valor vive, não o valor.
function eMarcador(valor) {
  return (
    /^[<{$[*%]/.test(valor) ||
    /^(.)\1+$/.test(valor) ||
    /xxx|\.\.\.|\*\*\*/i.test(valor) ||
    /(?:^|[-_.<>])(?:your|sua|seu|example|exemplo|placeholder|changeme|redacted)(?:$|[-_.<>])/i.test(valor) ||
    /^(?:process\.env|os\.environ|env\()/i.test(valor) ||
    /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/.test(valor)
  );
}

export function segredos(pasta) {
  if (!pasta || !fs.existsSync(pasta) || !fs.statSync(pasta).isDirectory()) {
    return falha(`a pasta de memória não existe: ${pasta ?? '(em falta)'}`);
  }
  const erros = [];
  for (const nome of listarMd(pasta)) {
    const linhas = fs.readFileSync(path.join(pasta, nome), 'utf8').split(/\r?\n/);
    for (const [i, linha] of linhas.entries()) {
      const apanhado =
        PADROES_SEGREDO.find((p) => p.re.test(linha))?.nome ??
        ([...linha.matchAll(ATRIBUICAO)].some((m) => !eMarcador(m[1])) ? 'valor atribuído a password/senha/secret/token' : null);
      // Só o sítio. O valor não se repete: esta saída acaba em registos e em conversas.
      if (apanhado) erros.push(`${nome}:${i + 1}: possível segredo (${apanhado})`);
    }
  }
  return { codigo: erros.length > 0 ? 1 : 0, linhas: [], erros };
}

// ---------------------------------------------------------------------------------------------
// linha de comandos
// ---------------------------------------------------------------------------------------------

const COM_VALOR = new Set(['--destino', '--antes', '--depois', '--mapa', '--minimo']);

export function lerArgumentos(argv) {
  const posicionais = [];
  const opcoes = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) {
      posicionais.push(argv[i]);
    } else if (COM_VALOR.has(argv[i]) && i + 1 < argv.length) {
      opcoes[argv[i].slice(2)] = argv[++i];
    } else {
      return { erro: `opção desconhecida ou sem valor: ${argv[i]}` };
    }
  }
  return { posicionais, opcoes };
}

const USO = 'uso: memoria.mjs backup|indice|segredos <pasta> | verificar --antes <pasta> --depois <pasta> [--mapa <f>] [--minimo 0.97]';

export function executar(argv) {
  const [sub, ...resto] = argv;
  const { posicionais, opcoes, erro } = lerArgumentos(resto);
  if (erro) return falha(erro, USO);
  switch (sub) {
    case 'backup':
      return backup(posicionais[0], { destino: opcoes.destino });
    case 'verificar':
      return verificar({
        antes: opcoes.antes,
        depois: opcoes.depois,
        mapa: opcoes.mapa,
        minimo: opcoes.minimo === undefined ? MINIMO_POR_FICHEIRO : Number(opcoes.minimo),
      });
    case 'indice':
      return indice(posicionais[0]);
    case 'segredos':
      return segredos(posicionais[0]);
    default:
      return falha(USO);
  }
}

// No Windows a letra da unidade pode vir em minúsculas, por isso compara sem distinguir maiúsculas.
const executadoDirectamente =
  process.argv[1] &&
  path.resolve(fileURLToPath(import.meta.url)).toLowerCase() === path.resolve(process.argv[1]).toLowerCase();
if (executadoDirectamente) {
  const { codigo, linhas, erros } = executar(process.argv.slice(2));
  for (const l of linhas) process.stdout.write(`${l}\n`);
  for (const e of erros) process.stderr.write(`${e}\n`);
  process.exitCode = codigo;
}
