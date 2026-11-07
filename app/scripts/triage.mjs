// Turns the collector's word counts into a to-do list for the lexicon.
//
//   node scripts/triage.mjs counts.json              a file saved from GET /export
//   node scripts/triage.mjs https://<worker>/export  reads EXPORT_TOKEN from the environment
//
// Words the current lexicon already understands are listed apart, so fixed words drop out, and
// words already filed in lexicon-backlog.json are listed apart too, so only new ones stand out.
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { missesIn } from '../src/dialogue.js';

// counts: { "it:frullatore": 12, ... } → { todo, filed, fixed } sorted by count, most frequent first.
export function triage(counts, { min = 1, backlog = [] } = {}) {
  const known = new Set(backlog.map((entry) => entry.word));
  const rows = Object.entries(counts ?? {})
    .map(([key, count]) => {
      const [lang, word] = key.includes(':') ? key.split(':') : ['it', key];
      return { lang, word, count: Number(count) || 0 };
    })
    .filter((row) => row.word && row.count >= min)
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
  const unknown = rows.filter((row) => missesIn(row.word).length > 0);
  const todo = unknown.filter((row) => !known.has(row.word));
  const filed = unknown.filter((row) => known.has(row.word));
  const fixed = rows.filter((row) => missesIn(row.word).length === 0);
  return { todo, filed, fixed };
}

export function toMarkdown({ todo, filed = [], fixed }) {
  const table = (rows) => ['| Count | Lang | Word |', '|---:|---|---|', ...rows.map((r) => `| ${r.count} | ${r.lang} | ${r.word} |`)].join('\n');
  return [
    `## Still not understood (${todo.length})`,
    '',
    'For each word: add a synonym to `src/lexicon.js`, draw a new piece, add it to `ignored`, or leave it out on purpose (real brands, offensive words). Add a test either way.',
    '',
    todo.length ? table(todo) : 'Nothing left.',
    '',
    `## Already in lexicon-backlog.json (${filed.length})`,
    '',
    filed.length ? table(filed) : 'None.',
    '',
    `## Already understood (${fixed.length})`,
    '',
    fixed.length ? table(fixed) : 'None.',
    '',
  ].join('\n');
}

async function load(source) {
  if (!/^https?:\/\//.test(source)) return JSON.parse(await readFile(source, 'utf8'));
  const token = process.env.EXPORT_TOKEN;
  if (!token) throw new Error('Set EXPORT_TOKEN to read from the collector.');
  const response = await fetch(source, { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`The collector answered ${response.status}.`);
  return response.json();
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [source, minFlag] = process.argv.slice(2);
  if (!source) {
    console.error('Usage: node scripts/triage.mjs <counts.json | collector export URL> [--min=N]');
    process.exit(1);
  }
  const min = Number(minFlag?.replace('--min=', '')) || 1;
  const backlog = JSON.parse(await readFile(new URL('../lexicon-backlog.json', import.meta.url), 'utf8')).words;
  load(source)
    .then((counts) => console.log(toMarkdown(triage(counts, { min, backlog }))))
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}
