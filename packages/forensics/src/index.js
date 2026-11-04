// @sigil/forensics: "does this picture of a document show signs of editing?"
// Machine evidence only. The strongest thing this can say is "signs of editing";
// it never says a document is genuine, and it never decides anything (the holder
// and the issuer's signature do). The model is a small calibrated classifier
// trained on SYNTHETIC tampering: see bench/ml/tamper/report.md for what that
// does and does not prove.
import { extractFeatures, ForensicsError, FEATURE_VERSION } from './features.js';
import model from './model.js';

export { ForensicsError };
export const MAX_BYTES = 10 * 1024 * 1024;

const sigmoid = (x) => 1 / (1 + Math.exp(-x));
let checked = false;

function rawScore(m, z) {
  if (m.type === 'logreg') {
    let s = m.b;
    for (let i = 0; i < z.length; i++) s += m.w[i] * z[i];
    return s;
  }
  if (m.type === 'gb') {
    let s = m.init;
    for (const t of m.trees) {
      let n = 0;
      while (t.l[n] !== -1) n = z[t.f[n]] <= t.t[n] ? t.l[n] : t.r[n];
      s += m.lr * t.v[n];
    }
    return s;
  }
  // mlp: relu hidden layers, one logit out
  let a = z;
  for (let l = 0; l < m.w.length; l++) {
    const W = m.w[l], b = m.b[l];
    const out = new Array(b.length).fill(0);
    for (let j = 0; j < b.length; j++) {
      let s = b[j];
      for (let i = 0; i < a.length; i++) s += a[i] * W[i][j];
      out[j] = l < m.w.length - 1 ? Math.max(0, s) : s;
    }
    a = out;
  }
  return a[0];
}

/** Calibrated probability that the picture shows signs of editing, from a feature vector. */
export function scoreFeatures(values) {
  const z = values.map((v, i) => Math.max(-model.clip, Math.min(model.clip, (v - model.mean[i]) / model.std[i])));
  const raw = rawScore(model.model, z);
  return sigmoid(model.calibration.a * raw + model.calibration.c);
}

export function levelOf(score) {
  return score >= model.thresholds.strong ? 'strong_signs' : score >= model.thresholds.some ? 'some_signs' : 'no_signs';
}

/**
 * @param {Uint8Array} input image bytes (jpeg, png, webp, tiff, gif, heif, avif); at most 10 MB
 * @returns {Promise<{score:number, level:'no_signs'|'some_signs'|'strong_signs', signals:{id:string, plain:string}[], modelVersion:string}>}
 * @throws {ForensicsError} code 'not_an_image' | 'too_large' | 'too_small' | 'bad_input'
 */
export async function analyzeImage(input) {
  if (!(input instanceof Uint8Array)) throw new ForensicsError('bad_input', 'Expected image bytes.');
  if (input.length > MAX_BYTES) throw new ForensicsError('too_large', 'The file is larger than 10 MB.');
  if (input.length === 0) throw new ForensicsError('not_an_image', 'The file is empty.');
  const { names, values } = await extractFeatures(input);
  if (!checked) {
    if (FEATURE_VERSION !== model.featureVersion || names.join('|') !== model.featureNames.join('|')) {
      throw new Error('forensics: model and feature code are out of sync; retrain (bench/ml/tamper).');
    }
    checked = true;
  }
  const score = scoreFeatures(values);
  const level = levelOf(score);
  const signals = [];
  if (level !== 'no_signs') {
    const found = [];
    for (const g of model.groups) {
      let zmax = 0;
      for (const i of g.idx) zmax = Math.max(zmax, Math.abs((values[i] - model.genuineMean[i]) / model.genuineStd[i]));
      if (zmax > g.thr) found.push({ id: g.id, plain: g.plain, excess: zmax / g.thr });
    }
    found.sort((a, b) => b.excess - a.excess);
    for (const f of found.slice(0, 3)) signals.push({ id: f.id, plain: f.plain });
    if (signals.length === 0) {
      signals.push({ id: 'unusual_overall', plain: 'The picture looks unusual overall, so please check the original.' });
    }
  }
  return { score: Math.round(score * 10000) / 10000, level, signals, modelVersion: model.version };
}

export const modelInfo = {
  version: model.version,
  kind: model.kind,
  thresholds: model.thresholds,
  featureNames: model.featureNames,
};
