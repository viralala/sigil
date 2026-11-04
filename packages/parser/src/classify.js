import model from './model.js';
import { analyzer, tokens } from './features.js';

const INDEX = new Map(model.vocab.map((f, i) => [f, i]));

/** Softmax probabilities, one per model.classes entry. */
export function probabilities(text) {
  const counts = new Map();
  for (const f of analyzer(text)) {
    const i = INDEX.get(f);
    if (i !== undefined) counts.set(i, (counts.get(i) || 0) + 1);
  }
  const k = model.classes.length;
  const z = [];
  if (counts.size === 0) {
    for (let c = 0; c < k; c++) z.push(model.bias[c]);
  } else {
    const ids = [...counts.keys()];
    const v = ids.map((i) => (1 + Math.log(counts.get(i))) * model.idf[i]);
    const norm = Math.sqrt(v.reduce((a, x) => a + x * x, 0));
    for (let c = 0; c < k; c++) {
      let acc = model.bias[c];
      const row = model.coef[c];
      for (let j = 0; j < ids.length; j++) acc += (v[j] / norm) * (row[ids[j]] / 100);
      z.push(acc);
    }
  }
  const m = Math.max(...z);
  const e = z.map((x) => Math.exp(x - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / s);
}

export const CLASSES = model.classes.slice();

/**
 * Propose a claim kind for one line of text (the first 400 characters are used).
 * A proposal only: nothing here says a claim is true, and the holder confirms every card.
 */
export function classifyClaim(text) {
  const s = typeof text === 'string' ? text : '';
  if (tokens(s).length === 0) return { kind: 'other', confidence: 0 };
  const p = probabilities(s);
  let best = 0;
  for (let i = 1; i < p.length; i++) if (p[i] > p[best]) best = i;
  return { kind: model.classes[best], confidence: Math.round(p[best] * 1e4) / 1e4 };
}
