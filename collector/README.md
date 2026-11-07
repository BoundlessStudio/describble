# Word-report collector

A tiny Cloudflare Worker that counts the words Describble did not understand, so maintainers know which words to add to the lexicon. It is optional: without it, the app sends nothing.

## What it stores

The collector counts individual lowercase words under the English language code, for example `en:kippah → 12`. The app skips capitalised words and honours Global Privacy Control and the report setting.

## Deploy

Counts live in a D1 database (the free plan allows 100,000 writes a day; KV would allow only 1,000).

1. Create the database: `npx wrangler d1 create describble-words`.
2. Copy `wrangler.toml.example` to `wrangler.toml` (git-ignored) and paste the database id.
3. Create the table: `npx wrangler d1 execute describble-words --remote --file=schema.sql`.
4. Set the export secret: `npx wrangler secret put EXPORT_TOKEN --config wrangler.toml`.
5. Deploy: `npx wrangler deploy --config wrangler.toml`. Always pass `--config` from this folder: the repository root has the website's own `wrangler.jsonc`.
6. Build the site with the collector address: `DESCRIBBLE_REPORT_ENDPOINT=https://words.describble.com/`. On Cloudflare Workers Builds this is a build variable. The site's Content Security Policy then allows that address and no other.

Only `ALLOWED_ORIGIN` may report words; requests from any other page get a 403.

## Read the counts

```bash
curl -H "Authorization: Bearer $EXPORT_TOKEN" https://words.describble.com/export
```

Or turn them straight into a to-do list, with the words the current lexicon already handles set apart:

```bash
cd app && EXPORT_TOKEN=… node scripts/triage.mjs https://words.describble.com/export --min=3
```

Add the frequent words to `app/src/lexicon.js`, with a regression test, and the next visitors will be understood.
