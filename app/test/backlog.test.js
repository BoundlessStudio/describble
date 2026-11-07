import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { missesIn } from '../src/dialogue.js';

const backlog = JSON.parse(readFileSync(new URL('../lexicon-backlog.json', import.meta.url), 'utf8'));

// The backlog only lists words that are still not understood, so it never goes stale.
test('every backlog word is still unknown; remove it from lexicon-backlog.json once it is taught', () => {
  for (const { word, status } of backlog.words) {
    assert.ok(['todo', 'skip'].includes(status), `${word}: status must be todo or skip`);
    assert.ok(missesIn(word).length > 0, `"${word}" is understood now: remove it from lexicon-backlog.json`);
  }
});

import { check } from '../scripts/dictionary.mjs';

test('the dictionary files are valid', () => {
  assert.deepEqual(check(), []);
});
