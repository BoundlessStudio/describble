import { test } from 'node:test';
import assert from 'node:assert/strict';
import { siteCopy, sitePages, pageCopy, siteGallery } from '../src/site.js';
import { applyMessage, initialState, missesIn, sceneFor } from '../src/dialogue.js';
import { catalog } from '../src/pieces.js';

// Each search page has complete copy and a distinct title.
test('search pages have their own complete copy', () => {
  const titles = new Set([siteCopy.title]);
  for (const [id, page] of Object.entries(sitePages)) {
    assert.match(page.path, /^\/[a-z0-9/-]+\/$/, id);
    for (const key of ['title', 'description', 'kicker', 'headline', 'lede', 'pageTitle', 'faqQ1', 'faqA1']) assert.ok(page[key], `${id}: ${key}`);
    assert.ok(page.pageText.length >= 2, `${id}: pageText`);
    assert.ok(page.description.length <= 170, `${id}: description is ${page.description.length} characters`);
    assert.ok(!titles.has(page.title), `${id}: title is not unique`);
    titles.add(page.title);
    assert.equal(pageCopy(id).download, siteCopy.download);
  }
});

test('each gallery idea draws a distinct portrait using recognised words', () => {
  assert.equal(siteGallery.length, 36);
  assert.equal(new Set(siteGallery).size, siteGallery.length);
  const portraits = new Set();
  for (const [index, sentence] of siteGallery.entries()) {
    const seed = 1000 + index * 7;
    const { state, action } = applyMessage({ ...initialState(), seed }, sentence);
    assert.ok(state.started, sentence);
    assert.equal(action, null, sentence);
    assert.deepEqual(missesIn(sentence), [], sentence);
    const scene = sceneFor({ ...state, confirmed: true });
    for (const [slot, { variant }] of Object.entries(scene.slots)) {
      assert.ok(catalog[slot]?.[variant], `${sentence}: ${slot}/${variant}`);
    }
    const portrait = JSON.stringify(scene);
    assert.ok(!portraits.has(portrait), `Duplicate portrait: ${sentence}`);
    portraits.add(portrait);
  }
});
