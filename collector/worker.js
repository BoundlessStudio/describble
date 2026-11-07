// Word-report collector: a Cloudflare Worker that counts the words Describble did not understand.
// It stores only "language + word → count". No IP addresses, no sentences, no identifiers.
//
// POST /            body {"words": ["kippah"], "lang": "en"}  → counts each word
// GET  /export      header "Authorization: Bearer <EXPORT_TOKEN>"  → all counts as JSON
//
// Bindings (see wrangler.toml.example): D1 database DB (schema.sql), secret EXPORT_TOKEN,
// and ALLOWED_ORIGIN, the site allowed to report (requests from other pages are refused).

const WORD = /^\p{Ll}{3,24}$/u;
const MAX_WORDS = 8;

function headers(env) {
  return {
    'content-type': 'application/json',
    'access-control-allow-origin': env.ALLOWED_ORIGIN || '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
  };
}

function json(env, data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: headers(env) });
}

async function record(request, env) {
  // Browsers always send Origin with a beacon or fetch; anything else is not the site.
  if (env.ALLOWED_ORIGIN && request.headers.get('origin') !== env.ALLOWED_ORIGIN) {
    return json(env, { error: 'forbidden' }, 403);
  }
  let payload;
  try {
    payload = JSON.parse(await request.text());
  } catch {
    return json(env, { error: 'invalid json' }, 400);
  }
  if (payload?.lang && payload.lang !== 'en') return json(env, { error: 'English reports only' }, 400);
  const words = [...new Set(Array.isArray(payload?.words) ? payload.words : [])]
    .filter((word) => typeof word === 'string' && WORD.test(word))
    .slice(0, MAX_WORDS);
  if (words.length) {
    // One atomic upsert per word, so simultaneous reports never lose a count.
    const upsert = env.DB.prepare('INSERT INTO words (lang, word, count) VALUES (?1, ?2, 1) ON CONFLICT (lang, word) DO UPDATE SET count = count + 1');
    await env.DB.batch(words.map((word) => upsert.bind('en', word)));
  }
  return json(env, { ok: true, counted: words.length });
}

async function exportCounts(request, env) {
  if (!env.EXPORT_TOKEN || request.headers.get('authorization') !== `Bearer ${env.EXPORT_TOKEN}`) {
    return json(env, { error: 'unauthorized' }, 401);
  }
  const { results } = await env.DB.prepare('SELECT lang, word, count FROM words ORDER BY count DESC').all();
  return json(env, Object.fromEntries(results.map((row) => [`${row.lang}:${row.word}`, row.count])));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: headers(env) });
    if (request.method === 'POST' && url.pathname === '/') return record(request, env);
    if (request.method === 'GET' && url.pathname === '/export') return exportCounts(request, env);
    return json(env, { error: 'not found' }, 404);
  },
};
