// Scores a sample of dataset images through the PUBLIC API (analyzeImage) so eval.py can
// check that the shipped JS path agrees with the Python evaluation of the same model file.
// Usage: node parity.mjs <ids.txt>   (ids.txt: one "id.ext" per line). Prints JSON {id: {score, level, signals}}.
import fs from 'node:fs';
import { analyzeImage } from '../../../packages/forensics/src/index.js';

const PRIV = process.env.SIGIL_PRIV || 'D:/Study FY/sigil-private/ml-tamper';
const files = fs.readFileSync(process.argv[2], 'utf8').trim().split(/\r?\n/);
const out = {};
for (const f of files) {
  const r = await analyzeImage(fs.readFileSync(`${PRIV}/images/${f}`));
  out[f.replace(/\.[a-z]+$/, '')] = { score: r.score, level: r.level, signals: r.signals.map((s) => s.id) };
}
console.log(JSON.stringify(out));
