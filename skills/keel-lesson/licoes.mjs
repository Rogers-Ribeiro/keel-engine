#!/usr/bin/env node
// O registo de ocorrências e lições do Keel: o que o agente errou, quantas vezes, e em que projectos.
//
//   node .keel/licoes.mjs sugerir     modo hook: põe as lições em contexto e diz o que já reincide
//   node .keel/licoes.mjs registar --chave <c> --o-que "<…>" --prova "<…>"
//   node .keel/licoes.mjs licao --chave <c> --titulo "<…>" --regra "<…>" --porque "<…>" --verificar "<…>"
//   node .keel/licoes.mjs promover --chave <c> --id <PROC-035>   virou regra na base: sai daqui
//   node .keel/licoes.mjs descartar --chave <c> --porque "<…>"   não se confirmou: sai daqui
//   node .keel/licoes.mjs estado      o que há, contado, para uma pessoa ler
//
// Duas camadas, e é a separação entre elas que faz isto durar:
//   - ocorrências (`~/.keel/ocorrencias.jsonl`): baratas e muitas, uma linha por vez que aconteceu;
//   - lições (`~/.keel/licoes.md`): poucas, escritas só quando a mesma chave reincide **e** a pessoa diz que sim.
//
// Sem essa separação isto vira o ficheiro de 145 lições que ninguém lê. A reincidência é o que
// distingue um acidente de um padrão, e é por isso que a sugestão conta antes de propor.
//
// O registo é partilhado por todos os projectos da máquina, ao lado da base em `~/.keel/base`. É isso
// que o torna transversal: o que se aprendeu num projecto está no contexto do seguinte sem publicar
// nada. A promoção a regra com ID, na base, é o passo lento e curado que vem a seguir.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// À terceira o padrão é inegável. Dois ainda apanha distracção — e o que este registo não pode
// fazer é encher-se de propostas que não valem nada, porque é assim que deixa de ser lido. Mais
// alto do que isto e atura-se o mesmo erro três vezes de graça antes de alguém perguntar porquê.
export const MINIMO = 3;

// Quantas lições cabem no arranque de uma sessão antes de o custo passar a doer. Não é um corte:
// passar o tecto avisa, porque uma lição que não é impressa é uma lição que não é aplicada.
export const MAX_LICOES = 12;

const CABECALHO = `# Lições — o que já correu mal e ficou decidido

Escritas pela skill \`keel-lesson\` quando o mesmo erro reincide. Entram no contexto de cada sessão,
em qualquer projecto desta máquina. Quando uma se confirma, promove-se a regra com ID na base do
Keel e sai daqui: este ficheiro é uma sala de espera, não uma casa.
`;

export function pastaKeel(env = process.env, casa = os.homedir()) {
  return env.KEEL_CASA || path.join(casa, '.keel');
}

export const ficheiroOcorrencias = (pasta) => path.join(pasta, 'ocorrencias.jsonl');
export const ficheiroLicoes = (pasta) => path.join(pasta, 'licoes.md');

// A chave é o que faz duas ocorrências contarem como a mesma. Normaliza-se para o agente poder
// escrevê-la à mão sem acertar no formato: "UNIQUE sem tenant_id" e "unique-sem-tenant-id" são uma.
export function normalizarChave(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

const hoje = () => new Date().toISOString().slice(0, 10);

// "a, b e c" em vez de "a e b e c": isto é lido por uma pessoa em cada arranque de sessão.
const enumerar = (itens) =>
  itens.length < 2 ? (itens[0] ?? '') : `${itens.slice(0, -1).join(', ')} e ${itens.at(-1)}`;

const nomeDoProjecto = (env = process.env) =>
  path.basename(env.CLAUDE_PROJECT_DIR || process.cwd()) || 'desconhecido';

// A prova é obrigatória e é validada aqui, não só pedida no texto da skill. Sem o ficheiro, o
// comando ou o erro que demonstram o caso, o que fica escrito é a teoria do próprio agente sobre
// por que falhou — e essa é exactamente a classe de defeito que um registo destes devia apanhar.
export function registar(pasta, ocorrencia) {
  const chave = normalizarChave(ocorrencia.chave);
  const oQue = String(ocorrencia.oQue ?? '').trim();
  const prova = String(ocorrencia.prova ?? '').trim();
  if (!chave) throw new Error('falta --chave (o que identifica este erro entre ocorrências)');
  if (!oQue) throw new Error('falta --o-que (uma linha a dizer o que correu mal)');
  if (!prova) throw new Error('falta --prova (ficheiro:linha, comando ou erro que o demonstre)');

  const linha = {
    chave,
    oQue,
    prova,
    projecto: ocorrencia.projecto || nomeDoProjecto(),
    quando: ocorrencia.quando || hoje(),
  };
  fs.mkdirSync(pasta, { recursive: true });
  fs.appendFileSync(ficheiroOcorrencias(pasta), `${JSON.stringify(linha)}\n`, 'utf8');
  return linha;
}

// Uma linha corrompida não pode rebentar o arranque de uma sessão: salta-se e segue-se.
function lerLinhas(pasta) {
  const ficheiro = ficheiroOcorrencias(pasta);
  if (!fs.existsSync(ficheiro)) return [];
  const encontradas = [];
  for (const linha of fs.readFileSync(ficheiro, 'utf8').split(/\r?\n/)) {
    if (!linha.trim()) continue;
    try {
      const o = JSON.parse(linha);
      if (o && o.chave) encontradas.push(o);
    } catch {
      /* linha ilegível: não vale parar por causa dela */
    }
  }
  return encontradas;
}

export function ler(pasta) {
  return lerLinhas(pasta).filter((o) => o.oQue && !o.arquivada);
}

// Chaves já resolvidas — viraram regra na base, ou foram descartadas. Sem este registo, promover
// uma lição fá-la voltar a ser proposta no arranque seguinte: as ocorrências continuam lá e o
// ficheiro de lições já não a tem. O ensaio ponta a ponta apanhou isso; os testes de unidade não.
export function arquivadas(pasta) {
  return new Map(lerLinhas(pasta).filter((o) => o.arquivada).map((o) => [o.chave, o.arquivada]));
}

export function contar(ocorrencias) {
  const porChave = new Map();
  for (const o of ocorrencias) {
    const actual = porChave.get(o.chave) ?? { chave: o.chave, n: 0, projectos: new Set(), provas: [] };
    actual.n += 1;
    actual.oQue = o.oQue; // a descrição mais recente ganha: costuma ser a mais afinada
    actual.projectos.add(o.projecto || 'desconhecido');
    actual.provas.push(o.prova);
    actual.ultima = actual.ultima && actual.ultima > o.quando ? actual.ultima : o.quando;
    porChave.set(o.chave, actual);
  }
  return [...porChave.values()]
    .map((c) => ({ ...c, projectos: [...c.projectos].sort() }))
    .sort((a, b) => b.n - a.n || String(b.ultima).localeCompare(String(a.ultima)));
}

export function licoesEscritas(pasta) {
  const ficheiro = ficheiroLicoes(pasta);
  if (!fs.existsSync(ficheiro)) return new Set();
  const texto = fs.readFileSync(ficheiro, 'utf8');
  return new Set([...texto.matchAll(/^### ([a-z0-9-]+)/gm)].map((m) => m[1]));
}

export function porPromover(pasta, { minimo = MINIMO } = {}) {
  const jaEscritas = licoesEscritas(pasta);
  const jaResolvidas = arquivadas(pasta);
  return contar(ler(pasta)).filter(
    (c) => c.n >= minimo && !jaEscritas.has(c.chave) && !jaResolvidas.has(c.chave),
  );
}

// A lição tem a forma de uma regra sem ID. Promovê-la à base é acrescentar-lhe o ID, a `**Fonte:**`
// e `**Cursos:** 0` — o mesmo formato que as regras escritas à mão já usam.
export function escreverLicao(pasta, licao) {
  const chave = normalizarChave(licao.chave);
  if (!chave) throw new Error('falta --chave');
  if (licoesEscritas(pasta).has(chave)) return 'ja-existe';
  for (const campo of ['titulo', 'regra', 'porque', 'verificar']) {
    if (!String(licao[campo] ?? '').trim()) throw new Error(`falta --${campo}`);
  }

  const contagem = contar(ler(pasta)).find((c) => c.chave === chave);
  const visto = contagem
    ? `${contagem.projectos.join(', ')} · ${contagem.n} vez(es) · última ${contagem.ultima}`
    : 'registada à mão';
  const prova = String(licao.prova ?? '').trim() || contagem?.provas.at(-1) || '—';

  const bloco = [
    `### ${chave} — ${licao.titulo.trim()}`,
    '',
    `**Regra:** ${licao.regra.trim()}`,
    `**Porquê:** ${licao.porque.trim()}`,
    `**Como verificar:** ${licao.verificar.trim()}`,
    `**Visto em:** ${visto}`,
    `**Prova:** ${prova}`,
    '',
  ].join('\n');

  const ficheiro = ficheiroLicoes(pasta);
  fs.mkdirSync(pasta, { recursive: true });
  if (!fs.existsSync(ficheiro)) fs.writeFileSync(ficheiro, `${CABECALHO}\n`, 'utf8');
  fs.appendFileSync(ficheiro, bloco, 'utf8');
  return 'escrita';
}

// Fecha o ciclo de uma chave: tira a lição do registo **e** deixa a marca que impede a chave de
// voltar a ser proposta. As duas coisas juntas, porque fazer só a primeira reabre a proposta e
// fazer só a segunda deixa a lição a custar contexto para sempre.
//
// Serve os dois fins de vida: virou regra com ID na base, ou não se confirmou e descarta-se.
export function arquivar(pasta, chave, motivo) {
  const alvo = normalizarChave(chave);
  if (!alvo) throw new Error('falta --chave');
  if (!String(motivo ?? '').trim()) throw new Error('falta o motivo (--regra <ID> ou --porque "<…>")');
  if (arquivadas(pasta).has(alvo)) return 'ja-arquivada';

  const ficheiro = ficheiroLicoes(pasta);
  if (fs.existsSync(ficheiro)) {
    const blocos = fs.readFileSync(ficheiro, 'utf8').split(/^(?=### )/m);
    const ficam = blocos.filter((b) => normalizarChave((b.match(/^### ([a-z0-9-]+)/) ?? [])[1] ?? '') !== alvo);
    if (ficam.length !== blocos.length) fs.writeFileSync(ficheiro, ficam.join(''), 'utf8');
  }

  fs.mkdirSync(pasta, { recursive: true });
  const marca = { chave: alvo, arquivada: String(motivo).trim(), quando: hoje() };
  fs.appendFileSync(ficheiroOcorrencias(pasta), `${JSON.stringify(marca)}\n`, 'utf8');
  return 'arquivada';
}

// O que o hook do arranque põe em contexto. Vazio quando não há nada — uma sessão não deve pagar
// contexto para lhe dizerem que está tudo bem.
export function textoParaContexto(pasta, { minimo = MINIMO, maxLicoes = MAX_LICOES } = {}) {
  const partes = [];

  const ficheiro = ficheiroLicoes(pasta);
  if (fs.existsSync(ficheiro)) {
    const corpo = fs.readFileSync(ficheiro, 'utf8').split(/^(?=### )/m).slice(1);
    if (corpo.length) {
      partes.push('## Lições do Keel — decididas por reincidência, valem em todos os projectos\n');
      partes.push(corpo.join('').trimEnd());
      if (corpo.length > maxLicoes) {
        partes.push(
          `\n**${corpo.length} lições no registo (tecto: ${maxLicoes}).** Promove-as a regras com ID na ` +
            'base do Keel: em texto de sessão custam contexto todos os dias, em regra custam uma vez.',
        );
      }
    }
  }

  const pendentes = porPromover(pasta, { minimo });
  if (pendentes.length) {
    partes.push('\n## Erros que já reincidiram e ainda não deram lição\n');
    for (const p of pendentes) {
      partes.push(`- \`${p.chave}\` — ${p.oQue} (${p.n}×, em ${enumerar(p.projectos)}; última ${p.ultima})`);
    }
    partes.push('\nSe algum se repetir outra vez nesta sessão, propõe uma lição com a skill `keel-lesson`.');
  }

  return partes.length ? `${partes.join('\n')}\n` : '';
}

function lerFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const nome = argv[i].slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const valor = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'sim';
    flags[nome] = valor;
  }
  return flags;
}

function main(argv) {
  const comando = argv.find((a) => !a.startsWith('--')) ?? 'estado';
  const flags = lerFlags(argv);
  const pasta = flags.onde ? path.resolve(flags.onde) : pastaKeel();

  // O `sugerir` corre num hook de arranque: não estraga uma sessão por nada que aconteça aqui.
  if (comando === 'sugerir') {
    try {
      const texto = textoParaContexto(pasta, { minimo: Number(flags.minimo) || MINIMO });
      if (texto) process.stdout.write(texto);
    } catch {
      /* um registo ilegível não vale uma sessão */
    }
    return 0;
  }

  try {
    if (comando === 'registar') {
      const linha = registar(pasta, { chave: flags.chave, oQue: flags.oQue, prova: flags.prova });
      const c = contar(ler(pasta)).find((x) => x.chave === linha.chave);
      console.log(`Registada \`${linha.chave}\` (${c.n}× em ${c.projectos.join(', ')}).`);
      const arquivo = arquivadas(pasta).get(linha.chave);
      if (arquivo) {
        // Reincidir depois de arquivada é o sinal mais útil que este registo dá: a regra existe e
        // não está a apanhar o caso. O problema passa a ser a regra, não o engano.
        console.log(`Atenção: esta chave já tinha sido resolvida (${arquivo}) e voltou a acontecer.`);
        console.log('Diz isso ao utilizador: o que precisa de mudar é a regra ou a verificação, não a lição.');
      } else if (c.n >= MINIMO && !licoesEscritas(pasta).has(linha.chave)) {
        console.log(`Já reincidiu ${c.n} vezes — pergunta ao utilizador se quer transformar isto numa lição.`);
      }
      return 0;
    }

    if (comando === 'licao') {
      const r = escreverLicao(pasta, {
        chave: flags.chave, titulo: flags.titulo, regra: flags.regra,
        porque: flags.porque, verificar: flags.verificar, prova: flags.prova,
      });
      console.log(r === 'escrita' ? `Lição escrita em ${ficheiroLicoes(pasta)}.` : 'Já existia uma lição com essa chave.');
      return 0;
    }

    if (comando === 'promover' || comando === 'descartar') {
      const motivo = comando === 'promover' ? (flags.id ? `regra ${flags.id}` : '') : flags.porque;
      const r = arquivar(pasta, flags.chave, motivo);
      console.log(r === 'arquivada' ? 'Fora do registo e fora das propostas.' : 'Já estava arquivada.');
      return 0;
    }

    if (comando === 'estado') {
      const contagens = contar(ler(pasta));
      const escritas = licoesEscritas(pasta);
      const resolvidas = arquivadas(pasta);
      console.log(
        `${pasta}\n${contagens.length} chave(s) com ocorrências · ${escritas.size} lição(ões) escrita(s) · ` +
          `${resolvidas.size} arquivada(s)\n`,
      );
      for (const c of contagens) {
        const marca = resolvidas.get(c.chave) ?? (escritas.has(c.chave) ? 'lição' : c.n >= MINIMO ? 'a propor' : '—');
        console.log(`  ${String(c.n).padStart(3)}×  [${marca}] ${c.chave}: ${c.oQue}`);
        console.log(`        ${c.projectos.join(', ')} · última ${c.ultima}`);
      }
      return 0;
    }

    console.error(
      `Comando desconhecido: ${comando}. Usa sugerir, registar, licao, promover, descartar ou estado.`,
    );
    return 2;
  } catch (erro) {
    console.error(erro.message);
    return 1;
  }
}

// No Windows a letra da unidade pode vir em minúsculas, por isso compara sem distinguir maiúsculas.
const executadoDirectamente =
  process.argv[1] &&
  path.resolve(fileURLToPath(import.meta.url)).toLowerCase() === path.resolve(process.argv[1]).toLowerCase();
if (executadoDirectamente) process.exitCode = main(process.argv.slice(2));
