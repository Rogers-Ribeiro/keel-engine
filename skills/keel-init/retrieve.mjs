#!/usr/bin/env node
// Traz a base de conhecimento do Keel para este projecto e põe as fontes das regras a apontar para ela.
//
//   node .keel/retrieve.mjs             clona ou actualiza a base e deixa as fontes locais
//   node .keel/retrieve.mjs --auto      só age se faltar; é o que o hook SessionStart corre
//   node .keel/retrieve.mjs --urls      devolve as fontes a URLs do GitHub (para partilhar o repo)
//   node .keel/retrieve.mjs --onde <p>  usa outra pasta partilhada em vez de ~/.keel/base
//
// O `--auto` é o que torna isto automático: quem clona o projecto e abre o Claude Code recebe a
// base sem correr nada. Sai em silêncio e em milissegundos quando já cá está, e nunca falha a
// sessão — sem acesso ao repositório privado, explica-se e segue.
//
// A base é clonada **uma vez por máquina** e ligada a cada projecto por junction, porque são 54 MB
// e 5 259 ficheiros. O `.keel/` não entra no repositório do projecto: é cache, não é contrato.
//
// Correr outra vez é seguro: actualiza o clone e não mexe no que já está na forma pedida.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// A marca é substituída ao gerar o plugin. Na base, onde não foi substituída, vale o valor por omissão.
const MARCA = 'https://github.com/Rogers-Ribeiro/keel';
const REPO_BASE = MARCA.startsWith('{{') ? 'https://github.com/Rogers-Ribeiro/keel' : MARCA;
export const REPO = `${REPO_BASE}.git`;
export const URL_BASE = `${REPO_BASE}/blob/main`;

// As três pastas da base a que as regras se referem. `cursos` e `conhecimento` chegam do plugin
// como URLs (não vêm lá dentro); `docs` chega em relativo, porque dentro do plugin resolve — mas
// deixa de resolver assim que as regras são copiadas para `.agents/regras/`. Daí tratar-se as três.
export const PASTAS = ['cursos', 'conhecimento', 'docs'];

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function pastaPartilhada(env = process.env, casa = os.homedir()) {
  return env.KEEL_BASE || path.join(casa, '.keel', 'base');
}

// A profundidade decide quantos `../` são precisos: `.agents/regras/x.md` está a dois níveis da raiz.
export function profundidadeDe(relativo) {
  return relativo.replace(/\\/g, '/').split('/').length - 1;
}

export function paraLocal(texto, profundidade, urlBase = URL_BASE) {
  const subir = '../'.repeat(profundidade);
  return texto
    .replace(new RegExp(`\\]\\(${escapar(urlBase)}/(${PASTAS.join('|')})/`, 'g'), `](${subir}.keel/base/$1/`)
    .replace(/\]\(\.\.\/docs\//g, `](${subir}.keel/base/docs/`);
}

export function paraUrl(texto, profundidade, urlBase = URL_BASE) {
  const subir = '../'.repeat(profundidade);
  const alvo = new RegExp(`\\]\\(${escapar(subir)}\\.keel/base/(${PASTAS.join('|')})/`, 'g');
  return texto.replace(alvo, `](${urlBase}/$1/`);
}

export function ficheirosDoContrato(projeto) {
  const raiz = path.join(projeto, '.agents');
  if (!fs.existsSync(raiz)) return [];
  const encontrados = [];
  const visitar = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const caminho = path.join(dir, e.name);
      if (e.isDirectory()) visitar(caminho);
      else if (e.name.endsWith('.md')) encontrados.push(path.relative(projeto, caminho));
    }
  };
  visitar(raiz);
  return encontrados;
}

export function converter(projeto, sentido = 'local') {
  let mexidos = 0;
  for (const relativo of ficheirosDoContrato(projeto)) {
    const absoluto = path.join(projeto, relativo);
    const antes = fs.readFileSync(absoluto, 'utf8');
    const profundidade = profundidadeDe(relativo);
    const depois = sentido === 'local' ? paraLocal(antes, profundidade) : paraUrl(antes, profundidade);
    if (depois !== antes) { fs.writeFileSync(absoluto, depois); mexidos++; }
  }
  return mexidos;
}

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

// Num clone raso não se faz `git pull`: o `--depth 1` traz um histórico disjunto do que cá está e o
// merge não avança ("Not possible to fast-forward"). O erro só aparece quando há mesmo alguma coisa
// para trazer, portanto passa despercebido até ao dia em que interessa. Busca-se e assenta-se em
// cima — que é o certo para uma cache de leitura, onde não há trabalho local a perder.
export function clonar(partilhada, { repo = REPO, log = () => {} } = {}) {
  if (fs.existsSync(path.join(partilhada, '.git'))) {
    log(`base já cá: ${partilhada} — a actualizar`);
    const ramo = git(['rev-parse', '--abbrev-ref', 'HEAD'], partilhada).trim();
    git(['fetch', '--depth', '1', 'origin', ramo], partilhada);
    git(['reset', '--hard', `origin/${ramo}`], partilhada);
    return 'actualizada';
  }
  log(`a clonar a base (~54 MB, sem histórico) para ${partilhada}`);
  fs.mkdirSync(path.dirname(partilhada), { recursive: true });
  git(['clone', '--depth', '1', repo, partilhada]);
  return 'clonada';
}

// Junction no Windows não pede privilégios elevados, ao contrário de um symlink.
// Se mesmo assim falhar, vale mais uma cópia do que um projecto sem base.
export function ligar(projeto, partilhada, { log = () => {} } = {}) {
  const ligacao = path.join(projeto, '.keel', 'base');
  fs.mkdirSync(path.dirname(ligacao), { recursive: true });
  // lstat, não exists: uma junction que aponta para o sítio errado não "existe" mas ocupa o nome.
  if (fs.lstatSync(ligacao, { throwIfNoEntry: false })) fs.rmSync(ligacao, { recursive: true, force: true });
  try {
    fs.symlinkSync(partilhada, ligacao, process.platform === 'win32' ? 'junction' : 'dir');
    log(`.keel/base → ${partilhada}`);
    return 'ligada';
  } catch (erro) {
    log(`não deu para criar a ligação (${erro.code}); a copiar em vez disso`);
    fs.cpSync(partilhada, ligacao, { recursive: true });
    return 'copiada';
  }
}

export function garantirGitignore(projeto) {
  const ficheiro = path.join(projeto, '.gitignore');
  const linha = '.keel/';
  const actual = fs.existsSync(ficheiro) ? fs.readFileSync(ficheiro, 'utf8') : '';
  if (actual.split(/\r?\n/).some((l) => l.trim() === linha)) return false;
  const texto = actual ? `${actual.trimEnd()}\n\n# Base de conhecimento do Keel (cache local, não é contrato)\n${linha}\n` : `# Base de conhecimento do Keel (cache local, não é contrato)\n${linha}\n`;
  fs.writeFileSync(ficheiro, texto);
  return true;
}

// A pergunta que o modo automático faz a cada arranque, por isso tem de ser barata: não basta a
// ligação existir, tem de haver conteúdo do outro lado. Uma junction cujo destino foi apagado
// continua a "existir" mas não resolve — e é assim que se distingue.
export function estaPronta(projeto) {
  return fs.existsSync(path.join(projeto, '.keel', 'base', 'cursos'));
}

function main(argv) {
  const projeto = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const auto = argv.includes('--auto');
  const log = (m) => console.log(`  ${m}`);

  // No arranque automático não se resmunga: um projecto sem contrato do Keel não é um erro.
  if (!fs.existsSync(path.join(projeto, '.agents'))) {
    if (auto) return 0;
    console.error('Não há `.agents/` aqui. Corre isto na raiz do projecto, depois do /keel-init.');
    return 2;
  }
  // O caminho comum: já cá está. Sai em milissegundos e sem escrever nada, porque o que este
  // hook escreve entra no contexto da sessão, e contexto gasto a dizer "está tudo bem" é desperdício.
  if (auto && estaPronta(projeto)) return 0;

  if (argv.includes('--urls')) {
    const n = converter(projeto, 'urls');
    console.log(`${n} ficheiro(s) do contrato com as fontes em URL do GitHub.`);
    return 0;
  }

  const i = argv.indexOf('--onde');
  const partilhada = i >= 0 && argv[i + 1] ? path.resolve(argv[i + 1]) : pastaPartilhada();

  try {
    clonar(partilhada, { log: auto ? () => {} : log });
  } catch (erro) {
    // Em automático nunca se trava a sessão por causa disto: diz-se o que falhou e segue.
    // O stdout de um SessionStart entra no contexto, portanto a mensagem é dirigida ao agente.
    const porque = erro.message.trim().split('\n').at(-1);
    if (auto) {
      console.log(
        `A base de conhecimento do Keel não pôde ser trazida (${porque}). As fontes das regras ficam ` +
          `a apontar para ${REPO_BASE}, que é privado. Se o utilizador precisar de as abrir, confirma ` +
          'que a conta de git desta máquina tem acesso e corre `node .keel/retrieve.mjs`.',
      );
      return 0;
    }
    console.error(`Falhou o clone da base: ${porque}`);
    console.error(`O repositório é privado — confirma que tens acesso a ${REPO_BASE}.`);
    return 1;
  }
  ligar(projeto, partilhada, { log: auto ? () => {} : log });
  if (garantirGitignore(projeto) && !auto) log('.keel/ acrescentado ao .gitignore');
  const n = converter(projeto, 'local');
  console.log(
    auto
      ? `Base de conhecimento do Keel trazida para .keel/base; as fontes de ${n} ficheiro(s) do contrato abrem localmente.`
      : `Pronto. ${n} ficheiro(s) do contrato com as fontes locais; a base está em ${partilhada}.`,
  );
  return 0;
}

// No Windows a letra da unidade pode vir em minúsculas, por isso compara sem distinguir maiúsculas.
const executadoDirectamente =
  process.argv[1] &&
  path.resolve(fileURLToPath(import.meta.url)).toLowerCase() === path.resolve(process.argv[1]).toLowerCase();
if (executadoDirectamente) process.exitCode = main(process.argv.slice(2));
