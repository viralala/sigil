// Feature extraction for the claim-kind classifier. Mirror of `analyzer` in bench/ml/claims/claims_lib.py;
// test/model.test.js checks both produce the same probabilities (golden.json).

export const MAX_CHARS = 400;
const MAX_TOK = 40;
const URL_RE = /(?:https?:\/\/|www\.)\S+/g;
const EMAIL_RE = /[a-z0-9._%+\-]+@[a-z0-9.\-]+/g;
const SEP_RE = /[,;|/\u2022\u00b7]/g;

export function normalise(text) {
  const head = Array.from(String(text).slice(0, MAX_CHARS * 4)).slice(0, MAX_CHARS).join('');
  return head.normalize('NFKC').toLowerCase().replace(URL_RE, ' ').replace(EMAIL_RE, ' ').replace(/[0-9]+/g, '0');
}

export function tokens(text) {
  const m = normalise(text).match(/[a-z0\u0900-\u097f]+/g) || [];
  const out = [];
  for (const t of m) if (t.length >= 2 || t === '0') out.push(t.slice(0, MAX_TOK));
  return out;
}

export function analyzer(text) {
  const toks = tokens(text);
  const feats = [];
  const seps = (normalise(text).match(SEP_RE) || []).length;
  if (seps >= 2) feats.push('s:list');
  const n = toks.length;
  feats.push(n <= 1 ? 's:n1' : n === 2 ? 's:n2' : n <= 5 ? 's:n5' : 's:n6');
  for (const t of toks) feats.push('w:' + t);
  for (let i = 0; i + 1 < toks.length; i++) feats.push('b:' + toks[i] + ' ' + toks[i + 1]);
  for (const t of toks) {
    const p = ' ' + t + ' ';
    for (let n2 = 3; n2 <= 5; n2++) for (let i = 0; i + n2 <= p.length; i++) feats.push('c:' + p.slice(i, i + n2));
  }
  return feats;
}
