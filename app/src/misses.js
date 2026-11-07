// Words the parser did not understand, so they can be added to the lexicon.
// 1. A local log in localStorage, reviewable at chat.html?mode=misses.
// 2. Anonymous reports: single words only (never sentences), no identifiers, no capitalised words
//    (likely names). On by default, off with one click, never sent when the browser asks for
//    Global Privacy Control, and disabled entirely while REPORT_ENDPOINT is empty.
const MISS_KEY = 'describble-misses';
const MAX_MISSES = 300;
const REPORT_KEY = 'describble-report';
export const REPORT_ENDPOINT = '';
const MAX_REPORTED = 8;
const reported = new Set();

export function reportingOn() {
  if (!REPORT_ENDPOINT || navigator.globalPrivacyControl) return false;
  try {
    return localStorage.getItem(REPORT_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setReporting(on) {
  try {
    localStorage.setItem(REPORT_KEY, on ? 'on' : 'off');
  } catch {
    // without storage the choice lasts for this visit only
  }
}

// Only lowercase words made of letters, never seen before in this visit.
export function reportableWords(words, sentence) {
  const capitalised = new Set((sentence.match(/\p{Lu}\p{L}*/gu) ?? []).map((w) => w.toLowerCase()));
  return words.filter((w) => /^\p{L}{3,24}$/u.test(w) && !capitalised.has(w) && !reported.has(w)).slice(0, MAX_REPORTED);
}

function reportMisses(words, sentence) {
  if (!reportingOn()) return;
  const fresh = reportableWords(words, sentence);
  if (!fresh.length) return;
  fresh.forEach((w) => reported.add(w));
  const body = JSON.stringify({ words: fresh, lang: 'en' });
  if (!navigator.sendBeacon?.(REPORT_ENDPOINT, body)) {
    fetch(REPORT_ENDPOINT, { method: 'POST', body, keepalive: true, headers: { 'content-type': 'text/plain' } }).catch(() => {});
  }
}

export function readMisses() {
  try {
    return JSON.parse(localStorage.getItem(MISS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function recordMisses(words, sentence) {
  if (!words.length) return;
  reportMisses(words, sentence);
  try {
    const log = readMisses();
    for (const word of words) {
      const entry = log[word] ?? { count: 0, examples: [] };
      entry.count += 1;
      entry.last = new Date().toISOString().slice(0, 10);
      if (!entry.examples.includes(sentence) && entry.examples.length < 3) entry.examples.push(sentence.slice(0, 120));
      log[word] = entry;
    }
    const kept = Object.entries(log).sort((a, b) => b[1].count - a[1].count).slice(0, MAX_MISSES);
    localStorage.setItem(MISS_KEY, JSON.stringify(Object.fromEntries(kept)));
  } catch {
    // storage unavailable (private mode, blocked site data): the log is only a bonus
  }
}

export function clearMisses() {
  try {
    localStorage.removeItem(MISS_KEY);
  } catch {
    // nothing to clear
  }
}
