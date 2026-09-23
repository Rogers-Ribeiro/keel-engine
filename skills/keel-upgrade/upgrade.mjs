#!/usr/bin/env node
// keel-upgrade — leva o contrato de um projecto a um engine novo sem perder o que lá está.
//
// Um contrato não é uma cópia do engine. As regras são editadas para o projecto, nascem regras
// próprias, e as secções ganham texto que só faz sentido ali — dezenas de linhas de contexto antes
// da primeira regra de uma secção. Por isso o esqueleto do merge é o ficheiro do projecto, nunca o
// do engine: só os corpos das regras que o projecto nunca tocou é que são refrescados, as regras
// novas são inseridas, e **nada é apagado**.
//
// Uso:
//   node upgrade.mjs [--projecto .] [--novo <engine>] [--base <engine antigo>]
//                    [--aplicar] [--migrar-layout]
//
// Sem `--aplicar` não escreve ficheiro nenhum: diz o que faria e mostra o relatório.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------- leitura do contrato

export function versaoDoContrato(yaml) {
  const m = yaml.match(/^\s*engine:\s*([0-9]+\.[0-9]+\.[0-9]+)\s*$/m);
  return m ? m[1] : null;
}

export function actualizarVersao(yaml, nova) {
  return yaml.replace(/^(\s*engine:\s*)[0-9]+\.[0-9]+\.[0-9]+\s*$/m, `$1${nova}`);
}

// ---------------------------------------------------------------- fatiar em regras
//
// Um bloco de regra vai do seu `### ID` até ao próximo `##` ou `###`, ou ao fim do ficheiro. Tudo o
// resto — o preâmbulo, os títulos de subtema, o texto entre secções — não é tocado por ninguém.

const RE_INICIO = /^### ([A-Z]+-\d+)\b/;

export function fatiarRegras(texto) {
  const linhas = texto.split('\n');
  const blocos = [];
  for (let i = 0; i < linhas.length; i++) {
    const m = RE_INICIO.exec(linhas[i]);
    if (!m) continue;
    let j = i + 1;
    while (j < linhas.length && !/^#{2,3} /.test(linhas[j])) j++;
    blocos.push({ id: m[1], inicio: i, fim: j });
    i = j - 1;
  }
  return blocos;
}

export function corposPorId(texto) {
  const normalizado = texto.replace(/\r\n/g, '\n');
  const linhas = normalizado.split('\n');
  const mapa = new Map();
  for (const b of fatiarRegras(normalizado)) {
    mapa.set(b.id, linhas.slice(b.inicio, b.fim).join('\n').trimEnd());
  }
  return mapa;
}

export function numeroDoId(id) {
  const m = /^([A-Z]+)-(\d+)$/.exec(id);
  return m ? { prefixo: m[1], numero: Number(m[2]) } : { prefixo: id, numero: 0 };
}

// ---------------------------------------------------------------- fontes
//
// O `retrieve.mjs` troca os URLs das fontes por caminhos locais em todas as regras do contrato.
// Comparar sem desfazer isso dá 100% de falsos positivos: num contrato real deu 348 regras
// "editadas", e nenhuma o era. Normaliza-se dos dois lados, só para comparar.

const RE_URL_BASE = /https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/blob\/[^/]+\//g;
const RE_LOCAL_BASE = /(?:\.\.\/)+\.keel\/base\//g;

export function normalizarFontes(texto) {
  return texto.replace(/\r\n/g, '\n').replace(RE_URL_BASE, 'FONTE/').replace(RE_LOCAL_BASE, 'FONTE/');
}

// Um corpo que entra do engine tem de falar a língua do ficheiro onde vai cair: se o projecto já
// corre com fontes locais, o corpo novo passa a local também, senão fica a destoar no meio.
export function estiloDasFontes(textoDoProjecto) {
  const m = textoDoProjecto.match(/((?:\.\.\/)+\.keel\/base\/)/);
  return m ? m[1] : null;
}

export function adaptarFontes(corpo, estilo) {
  return estilo ? corpo.replace(RE_URL_BASE, estilo) : corpo;
}

// ---------------------------------------------------------------- classificação

export const ESTADOS = {
  INTACTA: 'intacta', // igual à base: aceita a versão nova
  EDITADA: 'editada', // mexeste-lhe: fica como está
  SO_PROJECTO: 'so-projecto', // nasceu aqui e nunca subiu: fica, e é candidata a promoção
  AMBOS: 'ambos', // nasceu aqui e entretanto subiu à base, escrita de outra maneira
  NOVA: 'nova', // veio no engine novo: entra
  REMOVIDA: 'removida', // saiu do engine: fica na mesma, mas dizemos
};

export function classificar(base, projecto, novo) {
  const ler = (mapa, id) => (mapa.has(id) ? normalizarFontes(mapa.get(id)) : null);
  const estados = new Map();
  for (const id of new Set([...base.keys(), ...projecto.keys(), ...novo.keys()])) {
    const b = ler(base, id);
    const p = ler(projecto, id);
    const v = ler(novo, id);
    if (p === null) {
      // já não está no contrato. Se nunca esteve e o engine a traz agora, é nova; se o projecto a
      // tirou de propósito, não é connosco repô-la.
      if (v !== null && b === null) estados.set(id, ESTADOS.NOVA);
      continue;
    }
    if (b === null) estados.set(id, v === null ? ESTADOS.SO_PROJECTO : v === p ? ESTADOS.INTACTA : ESTADOS.AMBOS);
    else if (v === null) estados.set(id, ESTADOS.REMOVIDA);
    else if (p === b) estados.set(id, ESTADOS.INTACTA);
    else estados.set(id, ESTADOS.EDITADA);
  }
  return estados;
}

// ---------------------------------------------------------------- merge
//
// Só duas escritas: refrescar o corpo de uma regra intacta que mudou no engine, e inserir uma regra
// nova a seguir à de número imediatamente abaixo do mesmo prefixo. Uma regra nova sem vizinha vai
// para o fim do ficheiro. Nenhum caminho apaga nada.

export function fundir(textoProjecto, base, novo) {
  const texto = textoProjecto.replace(/\r\n/g, '\n');
  const estados = classificar(base, corposPorId(texto), novo);
  const linhas = texto.split('\n');
  const blocos = fatiarRegras(texto);
  const estilo = estiloDasFontes(texto);
  const accoes = [];
  const edicoes = [];

  for (const b of blocos) {
    const estado = estados.get(b.id);
    if (estado !== ESTADOS.INTACTA) {
      if (estado) accoes.push({ id: b.id, estado, feito: 'mantida' });
      continue;
    }
    const antes = linhas.slice(b.inicio, b.fim).join('\n').trimEnd();
    const depois = adaptarFontes(novo.get(b.id), estilo);
    if (normalizarFontes(antes) === normalizarFontes(depois)) {
      accoes.push({ id: b.id, estado, feito: 'igual' });
      continue;
    }
    edicoes.push({ inicio: b.inicio, fim: b.fim, texto: depois });
    accoes.push({ id: b.id, estado, feito: 'actualizada' });
  }

  for (const [id, estado] of estados) {
    if (estado !== ESTADOS.NOVA) continue;
    const { prefixo, numero } = numeroDoId(id);
    const anterior = blocos
      .filter((b) => numeroDoId(b.id).prefixo === prefixo && numeroDoId(b.id).numero < numero)
      .sort((a, c) => numeroDoId(c.id).numero - numeroDoId(a.id).numero)[0];
    const em = anterior ? anterior.fim : linhas.length;
    edicoes.push({ inicio: em, fim: em, texto: adaptarFontes(novo.get(id), estilo), insercao: true });
    accoes.push({ id, estado, feito: 'inserida' });
  }

  // de trás para a frente, para os índices das edições seguintes continuarem válidos
  edicoes.sort((a, b) => b.inicio - a.inicio);
  for (const e of edicoes) {
    const corpo = e.texto.split('\n');
    if (e.insercao) linhas.splice(e.inicio, 0, ...corpo, '');
    else linhas.splice(e.inicio, e.fim - e.inicio, ...corpo, '');
  }
  return { texto: linhas.join('\n'), accoes };
}

// ---------------------------------------------------------------- layout

export function frontmatterPaths(padroes) {
  return ['---', 'paths:', ...padroes.map((p) => `  - ${JSON.stringify(p)}`), '---', ''].join('\n');
}

// ---------------------------------------------------------------- relatório

export function relatorio(porTema, deVersao, paraVersao, avisos = []) {
  const todas = porTema.flatMap((t) => t.accoes);
  const conta = (estado) => todas.filter((a) => a.estado === estado).length;
  const l = [`# Actualização do contrato — ${deVersao} → ${paraVersao}`, ''];
  l.push('| Estado | Regras | O que aconteceu |', '|---|---|---|');
  l.push(`| Intactas desde o ${deVersao} | ${conta(ESTADOS.INTACTA)} | passaram à versão nova |`);
  l.push(`| Editadas neste projecto | ${conta(ESTADOS.EDITADA)} | **mantidas como estão** |`);
  l.push(`| Só neste projecto | ${conta(ESTADOS.SO_PROJECTO)} | mantidas; candidatas a promoção |`);
  l.push(`| Nasceram aqui e já subiram | ${conta(ESTADOS.AMBOS)} | **a tua ficou; decide tu** |`);
  l.push(`| Novas no engine | ${conta(ESTADOS.NOVA)} | inseridas |`);
  l.push(`| Saíram do engine | ${conta(ESTADOS.REMOVIDA)} | mantidas na mesma |`, '');

  const seccoes = [
    [
      ESTADOS.AMBOS,
      'A decidir: nasceram aqui e entretanto subiram à base',
      'A tua versão ficou. A da base está escrita de outra maneira — lê as duas e fica com uma.',
    ],
    [
      ESTADOS.SO_PROJECTO,
      'Órfãs: só existem neste projecto',
      'Não estão em engine nenhum. Enquanto não subirem, morrem com o projecto.',
    ],
    [ESTADOS.EDITADA, 'Editadas aqui, não tocadas', 'O engine não lhes mexeu.'],
    [ESTADOS.REMOVIDA, 'Saíram do engine', 'Continuam no contrato. Confirma se ainda fazem sentido.'],
  ];
  for (const [estado, titulo, nota] of seccoes) {
    const itens = porTema.flatMap((t) =>
      t.accoes.filter((a) => a.estado === estado).map((a) => `${t.tema} · ${a.id}`),
    );
    if (!itens.length) continue;
    l.push(`## ${titulo}`, '', nota, '', ...itens.map((i) => `- ${i}`), '');
  }
  if (avisos.length) l.push('## Avisos', '', ...avisos.map((a) => `- ${a}`), '');
  return l.join('\n');
}

// ---------------------------------------------------------------- execução

export function pastaDaCache(versao, casa = os.homedir()) {
  return path.join(casa, '.claude', 'plugins', 'cache', 'keel-engine', 'keel', versao);
}

export function lerArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const nome = argv[i].slice(2);
    args[nome] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return args;
}

export function pastaDasRegras(projecto) {
  for (const rel of ['.claude/rules', '.agents/regras']) {
    const caminho = path.join(projecto, rel);
    if (fs.existsSync(caminho)) return { caminho, rel };
  }
  return null;
}

function valor(args, nome, omissao) {
  return args[nome] && args[nome] !== true ? String(args[nome]) : omissao;
}

function main(argv) {
  const args = lerArgs(argv);
  const projecto = path.resolve(valor(args, 'projecto', '.'));
  const novo = path.resolve(valor(args, 'novo', path.join(AQUI, '..', '..')));
  const aplicar = Boolean(args.aplicar);

  const ficheiroYaml = path.join(projecto, '.agents', 'keel.yaml');
  if (!fs.existsSync(ficheiroYaml)) {
    console.error(`Não encontrei ${ficheiroYaml}. Este projecto não tem contrato: é /keel-init, não /keel-upgrade.`);
    process.exit(2);
  }
  const yaml = fs.readFileSync(ficheiroYaml, 'utf8');
  const deVersao = versaoDoContrato(yaml);
  if (!deVersao) {
    console.error('O keel.yaml não diz de que engine veio (campo `keel: engine:`). Sem base não há merge seguro.');
    process.exit(2);
  }
  const paraVersao = JSON.parse(fs.readFileSync(path.join(novo, '.claude-plugin', 'plugin.json'), 'utf8')).version;
  if (deVersao === paraVersao) {
    console.log(`O contrato já está no ${paraVersao}. Nada a fazer.`);
    return;
  }

  const base = path.resolve(valor(args, 'base', pastaDaCache(deVersao)));
  if (!fs.existsSync(path.join(base, 'regras'))) {
    console.error(
      `Não encontrei o engine ${deVersao} em ${base.replaceAll('\\', '/')}.\n` +
        'É a base da comparação: sem ela não se distingue o que editaste do que o engine mudou.\n' +
        `Traz-lha com:\n` +
        `  git clone https://github.com/Rogers-Ribeiro/keel-engine <pasta>\n` +
        `  cd <pasta> && git checkout v${deVersao}\n` +
        'e volta a correr com --base <pasta>.',
    );
    process.exit(3);
  }

  const dir = pastaDasRegras(projecto);
  if (!dir) {
    console.error('Não encontrei .claude/rules nem .agents/regras neste projecto.');
    process.exit(2);
  }

  const caminhos = JSON.parse(fs.readFileSync(path.join(novo, 'caminhos.json'), 'utf8'));
  const migrar = Boolean(args['migrar-layout']) && dir.rel === '.agents/regras';
  const porTema = [];
  const avisos = [];

  for (const nome of fs.readdirSync(dir.caminho).filter((n) => n.endsWith('.md')).sort()) {
    const tema = nome.replace(/\.md$/, '');
    const fBase = path.join(base, 'regras', nome);
    const fNovo = path.join(novo, 'regras', nome);
    if (!fs.existsSync(fBase) || !fs.existsSync(fNovo)) {
      const ausente = fs.existsSync(fBase) ? paraVersao : deVersao;
      avisos.push(`\`${tema}\`: sem correspondência no engine ${ausente}; ficou intacto.`);
      continue;
    }
    const textoProjecto = fs.readFileSync(path.join(dir.caminho, nome), 'utf8');
    const { texto, accoes } = fundir(
      textoProjecto,
      corposPorId(fs.readFileSync(fBase, 'utf8')),
      corposPorId(fs.readFileSync(fNovo, 'utf8')),
    );
    porTema.push({ tema, accoes });
    if (!aplicar) continue;

    const padroes = caminhos[tema];
    if (migrar && !padroes) {
      avisos.push(`\`${tema}\`: sem padrões em caminhos.json; ficou sem \`paths:\` e carrega sempre.`);
    }
    const destino = migrar ? path.join(projecto, '.claude', 'rules', nome) : path.join(dir.caminho, nome);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, (migrar && padroes ? frontmatterPaths(padroes) : '') + texto);
    if (migrar) fs.rmSync(path.join(dir.caminho, nome));
  }

  const pastaAgents = path.join(projecto, '.agents');
  for (const n of fs.readdirSync(pastaAgents).filter((n) => n.startsWith('nucleo'))) {
    avisos.push(`\`.agents/${n}\` não foi tocado: o núcleo está sempre em contexto e é teu. Compara-o à mão.`);
  }
  if (aplicar) {
    fs.writeFileSync(ficheiroYaml, actualizarVersao(yaml, paraVersao));
    if (migrar) avisos.push('As regras passaram de `.agents/regras/` para `.claude/rules/`, com `paths:` no frontmatter.');
  }

  const md = relatorio(porTema, deVersao, paraVersao, avisos);
  console.log(md);
  if (aplicar) {
    const destino = path.join(projecto, '.keel', 'upgrade.md');
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, md);
    console.log('\nEscrito. Relatório em `.keel/upgrade.md`. Não commitei nada: lê o `git diff`.');
  } else {
    console.log('\n(simulação: não escrevi nada. Repete com --aplicar.)');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2));
}
