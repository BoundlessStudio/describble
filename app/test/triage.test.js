import { test } from 'node:test';
import assert from 'node:assert/strict';
import { triage, toMarkdown } from '../scripts/triage.mjs';

test('triage splits collector counts into words to add and words already understood', () => {
  const { todo, fixed } = triage({ 'en:lighthouse': 14, 'en:bald': 30, 'en:astronaut': 3, 'en:footballer': 1 }, { min: 2 });
  assert.deepEqual(todo.map((row) => row.word), ['lighthouse']);
  assert.deepEqual(fixed.map((row) => row.word), ['bald', 'astronaut']);
  assert.match(toMarkdown({ todo, fixed }), /\| 14 \| en \| lighthouse \|/);
  assert.deepEqual(triage(null), { todo: [], filed: [], fixed: [] });
  const split = triage({ 'en:lighthouse': 5, 'en:fishhook': 2 }, { backlog: [{ word: 'fishhook' }] });
  assert.deepEqual(split.todo.map((row) => row.word), ['lighthouse']);
  assert.deepEqual(split.filed.map((row) => row.word), ['fishhook']);
});
