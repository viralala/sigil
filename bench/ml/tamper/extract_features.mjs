// Runs the SAME feature code that serves production (packages/forensics) over the
// private dataset and writes a feature table (private; rows keyed by image id).
// Usage: node extract_features.mjs [manifest.csv] [features.csv]
import fs from 'node:fs';
import os from 'node:os';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { extractFeatures, tuneForBatch } from '../../../packages/forensics/src/features.js';

const PRIV = process.env.SIGIL_PRIV || 'D:/Study FY/sigil-private/ml-tamper';

if (isMainThread) {
  const manifest = process.argv[2] || `${PRIV}/manifest.csv`;
  const out = process.argv[3] || `${PRIV}/features.csv`;
  const lines = fs.readFileSync(manifest, 'utf8').trim().split(/\r?\n/);
  const head = lines[0].split(',');
  const rows = lines.slice(1).map((l) => Object.fromEntries(l.split(',').map((v, i) => [head[i], v])));
  const N = Math.min(os.cpus().length, 8);
  const results = new Array(rows.length);
  let names = null;
  const t0 = Date.now();
  let done = 0;
  await Promise.all(
    Array.from({ length: N }, (_, k) =>
      new Promise((resolve, reject) => {
        const w = new Worker(new URL(import.meta.url), { workerData: { rows, k, N, dir: `${PRIV}/images` } });
        w.on('message', (m) => {
          if (m.i !== undefined) {
            results[m.i] = m.values;
            names = names || m.names;
            if (++done % 200 === 0) console.log(done, '/', rows.length, Math.round((Date.now() - t0) / 1000), 's');
          }
        });
        w.on('error', reject);
        w.on('exit', resolve);
      }),
    ),
  );
  const ws = fs.createWriteStream(out);
  ws.write(['id', ...names].join(',') + '\n');
  rows.forEach((r, i) => ws.write([r.id, ...results[i].map((v) => v.toPrecision(8))].join(',') + '\n'));
  ws.end();
  console.log('features', rows.length, 'x', names.length, 'in', Math.round((Date.now() - t0) / 1000), 's');
} else {
  tuneForBatch();
  const { rows, k, N, dir } = workerData;
  for (let i = k; i < rows.length; i += N) {
    const r = rows[i];
    const buf = fs.readFileSync(`${dir}/${r.id}.${r.ext}`);
    const f = await extractFeatures(buf);
    parentPort.postMessage({ i, names: f.names, values: f.values });
  }
}
