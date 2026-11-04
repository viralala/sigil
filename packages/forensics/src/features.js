// Forensic feature extraction. ONE implementation, used by both the training
// pipeline (bench/ml/tamper) and the serving path (analyzeImage).
// Pure statistics of the pixels: error level analysis, noise, sharpness, JPEG block
// grid, colour, repeated regions. No text is read and no identity is inferred.
import sharp from 'sharp';

export const FEATURE_VERSION = 2;

/** For batch jobs (training): one libvips thread per worker, no cache. Not needed when serving. */
export function tuneForBatch() {
  sharp.concurrency(1);
  sharp.cache(false);
}

export const MAX_SIDE = 1600;
const CELL = 32;
const MIN_SIDE = 96;

export class ForensicsError extends Error {
  /** @param {'not_an_image'|'too_large'|'too_small'|'bad_input'} code */
  constructor(code, message) {
    super(message);
    this.name = 'ForensicsError';
    this.code = code;
  }
}

const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp', 'tiff', 'gif', 'heif', 'avif']);

async function decode(input) {
  let out;
  try {
    // Only raster photo formats. SVG and PDF can be rendered by sharp but are not scanned documents.
    const meta = await sharp(input, { limitInputPixels: 100e6, failOn: 'error' }).metadata();
    if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) throw new Error('format');
    out = await sharp(input, { limitInputPixels: 100e6, failOn: 'error', sequentialRead: true })
      .rotate()
      .flatten({ background: '#ffffff' })
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true, kernel: 'lanczos3' })
      .toColourspace('srgb')
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
  } catch (e) {
    if (/pixel limit/i.test(String((e && e.message) || ''))) throw new ForensicsError('too_large', 'The image has too many pixels.');
    throw new ForensicsError('not_an_image', 'The file is not an image we can read.');
  }
  const { data, info } = out;
  if (info.width < MIN_SIDE || info.height < MIN_SIDE) {
    throw new ForensicsError('too_small', 'The image is too small to check.');
  }
  return { data, w: info.width, h: info.height, ch: info.channels };
}

async function jpegRoundTrip(rgb, w, h, ch, quality) {
  const buf = await sharp(rgb, { raw: { width: w, height: h, channels: ch } })
    .jpeg({ quality, chromaSubsampling: '4:4:4' })
    .toBuffer();
  const { data } = await sharp(buf).toColourspace('srgb').removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return data;
}

function blur3(src, w, h) {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const r = y * w;
    for (let x = 0; x < w; x++) {
      const a = src[r + (x > 0 ? x - 1 : 0)], b = src[r + x], c = src[r + (x < w - 1 ? x + 1 : x)];
      tmp[r + x] = (a + b + c) / 3;
    }
  }
  for (let y = 0; y < h; y++) {
    const ya = (y > 0 ? y - 1 : 0) * w, yb = y * w, yc = (y < h - 1 ? y + 1 : y) * w;
    for (let x = 0; x < w; x++) out[yb + x] = (tmp[ya + x] + tmp[yb + x] + tmp[yc + x]) / 3;
  }
  return out;
}

function quantile(sorted, q) {
  if (sorted.length === 0) return 0;
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

/** Summary of a per-cell map (NaN = cell has no usable pixels). 6 numbers. */
function mapStats(map, gw, gh) {
  const vals = [];
  for (let i = 0; i < map.length; i++) if (!Number.isNaN(map[i])) vals.push(map[i]);
  if (vals.length < 4) return [0, 0, 0, 0, 0, 0];
  const s = Float64Array.from(vals).sort();
  const n = s.length;
  let mean = 0;
  for (const v of s) mean += v;
  mean /= n;
  let varr = 0;
  for (const v of s) varr += (v - mean) ** 2;
  const std = Math.sqrt(varr / n);
  const p50 = quantile(s, 0.5);
  const p95 = quantile(s, 0.95);
  const dev = Float64Array.from(s, (v) => Math.abs(v - p50)).sort();
  const mad = quantile(dev, 0.5) * 1.4826 + 1e-6 * (1 + Math.abs(p50));
  let out = 0;
  for (const v of s) if (Math.abs(v - p50) > 4 * mad) out++;
  // local deviation: each cell against the median of its 8 neighbours
  const ld = [];
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      const v = map[gy * gw + gx];
      if (Number.isNaN(v)) continue;
      const nb = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const x = gx + dx, y = gy + dy;
          if (x < 0 || y < 0 || x >= gw || y >= gh) continue;
          const u = map[y * gw + x];
          if (!Number.isNaN(u)) nb.push(u);
        }
      }
      if (nb.length < 3) continue;
      nb.sort((a, b) => a - b);
      ld.push(Math.abs(v - nb[nb.length >> 1]));
    }
  }
  ld.sort((a, b) => a - b);
  const ldp95 = quantile(ld, 0.95);
  const ldmax = ld.length ? ld[ld.length - 1] : 0;
  const scale = std + 1e-6 * (1 + Math.abs(mean));
  return [mean, std / (Math.abs(mean) + 1e-6 * (1 + std)), (p95 - p50) / scale, out / n, ldp95 / scale, ldmax / scale];
}

const MAP_STAT_NAMES = ['mean', 'cv', 'tail', 'outlier_frac', 'local_p95', 'local_max'];

/** Robust z-scores of a per-cell quantity against cells with similar content (same edge density). 4 numbers. */
function conditionalAnomaly(q, cls, ncls) {
  const zs = [];
  const all = [];
  for (let i = 0; i < q.length; i++) if (!Number.isNaN(q[i])) all.push(Math.abs(q[i]));
  all.sort((a, b) => a - b);
  const floor = 0.05 * quantile(all, 0.5) + 1e-3;
  for (let c = 0; c < ncls; c++) {
    const v = [];
    for (let i = 0; i < q.length; i++) if (cls[i] === c && !Number.isNaN(q[i])) v.push(q[i]);
    if (v.length < 12) continue;
    v.sort((a, b) => a - b);
    const med = quantile(v, 0.5);
    const dev = v.map((x) => Math.abs(x - med)).sort((a, b) => a - b);
    const scale = 1.4826 * quantile(dev, 0.5) + floor;
    for (const x of v) zs.push((x - med) / scale);
  }
  if (zs.length < 12) return [0, 0, 0, 0];
  let zmax = -Infinity, zmin = Infinity;
  for (const z of zs) { if (z > zmax) zmax = z; if (z < zmin) zmin = z; }
  const abs = zs.map(Math.abs).sort((a, b) => b - a);
  const top = abs.slice(0, 5);
  return [
    Math.log1p(Math.max(0, zmax)),
    Math.log1p(Math.max(0, -zmin)),
    abs.filter((v) => v > 5).length / abs.length,
    Math.log1p(top.reduce((a, b) => a + b, 0) / top.length),
  ];
}

const EDGE_CLASSES = [0.004, 0.04, 0.15];

export async function extractFeatures(input) {
  const { data, w, h, ch } = await decode(input);
  const n = w * h;
  const R = new Float32Array(n), G = new Float32Array(n), B = new Float32Array(n);
  const Y = new Float32Array(n), Cb = new Float32Array(n), Cr = new Float32Array(n);
  for (let i = 0, j = 0; i < n; i++, j += ch) {
    const r = data[j], g = ch >= 3 ? data[j + 1] : r, b = ch >= 3 ? data[j + 2] : r;
    R[i] = r; G[i] = g; B[i] = b;
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    Y[i] = y;
    Cb[i] = 128 + 0.564 * (b - y);
    Cr[i] = 128 + 0.713 * (r - y);
  }
  const rgb = ch === 3 ? data : Buffer.from(Uint8Array.from({ length: n * 3 }, (_, k) => data[Math.floor(k / 3) * ch]));
  const [j95, j90, j75, j60] = await Promise.all([95, 90, 75, 60].map((q) => jpegRoundTrip(rgb, w, h, 3, q)));

  const gw = Math.ceil(w / CELL), gh = Math.ceil(h / CELL);
  const nc = gw * gh;
  const cellOk = new Uint8Array(nc);
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      const cw = Math.min(CELL, w - gx * CELL), chh = Math.min(CELL, h - gy * CELL);
      cellOk[gy * gw + gx] = cw >= 24 && chh >= 24 ? 1 : 0;
    }
  }
  const yb = blur3(Y, w, h), cbb = blur3(Cb, w, h), crb = blur3(Cr, w, h);
  const grad = new Float32Array(n);

  const e95 = new Float64Array(nc), e90 = new Float64Array(nc), e75 = new Float64Array(nc), e60 = new Float64Array(nc), cnt = new Float64Array(nc);
  const flatN = new Float64Array(nc), flatR2 = new Float64Array(nc), flatC2 = new Float64Array(nc);
  const edgeN = new Float64Array(nc), edgeHist = new Uint16Array(nc * 64);
  const sumY = new Float64Array(nc), sumCb = new Float64Array(nc), sumCr = new Float64Array(nc);
  const blk = new Float64Array(nc * 8), blkN = new Float64Array(nc * 8);
  let gE90 = 0, gE75 = 0;

  for (let y = 1; y < h - 1; y++) {
    const gyc = (y / CELL) | 0;
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const c = gyc * gw + ((x / CELL) | 0);
      const j3 = i * 3;
      const r = R[i], g = G[i], b = B[i];
      const d95 = (Math.abs(r - j95[j3]) + Math.abs(g - j95[j3 + 1]) + Math.abs(b - j95[j3 + 2])) / 3;
      const d90 = (Math.abs(r - j90[j3]) + Math.abs(g - j90[j3 + 1]) + Math.abs(b - j90[j3 + 2])) / 3;
      const d75 = (Math.abs(r - j75[j3]) + Math.abs(g - j75[j3 + 1]) + Math.abs(b - j75[j3 + 2])) / 3;
      const d60 = (Math.abs(r - j60[j3]) + Math.abs(g - j60[j3 + 1]) + Math.abs(b - j60[j3 + 2])) / 3;
      e95[c] += d95; e90[c] += d90; e75[c] += d75; e60[c] += d60; cnt[c]++;
      gE90 += d90; gE75 += d75;
      sumY[c] += Y[i]; sumCb[c] += Cb[i]; sumCr[c] += Cr[i];
      const gradv = Math.abs(Y[i + 1] - Y[i - 1]) + Math.abs(Y[i + w] - Y[i - w]);
      grad[i] = gradv;
      if (gradv < 6) {
        const rr = Y[i] - yb[i];
        const c1 = Cb[i] - cbb[i], c2 = Cr[i] - crb[i];
        flatN[c]++; flatR2[c] += rr * rr; flatC2[c] += c1 * c1 + c2 * c2;
      } else if (gradv > 30) {
        edgeN[c]++;
        edgeHist[c * 64 + Math.min(63, (gradv / 8) | 0)]++;
      }
      // JPEG block grid: clipped neighbour differences by position modulo 8
      const dxv = Math.min(15, Math.abs(Y[i] - Y[i - 1]));
      const dyv = Math.min(15, Math.abs(Y[i] - Y[i - w]));
      blk[c * 8 + (x & 7)] += dxv; blkN[c * 8 + (x & 7)]++;
      blk[c * 8 + (y & 7)] += dyv; blkN[c * 8 + (y & 7)]++;
    }
  }

  const NaNmap = () => new Float64Array(nc).fill(NaN);
  const mEla90 = NaNmap(), mRatio = NaNmap(), mGhost = NaNmap(), mNoise = NaNmap(), mSharp = NaNmap(), mChroma = NaNmap();
  const mLum = NaNmap(), mCb = NaNmap(), mCr = NaNmap(), mBlk = NaNmap();
  const cls = new Uint8Array(nc);
  const minCnt = CELL * CELL * 0.6;
  const gProf = new Float64Array(8), gProfN = new Float64Array(8);
  for (let c = 0; c < nc; c++) {
    if (!cellOk[c] || cnt[c] < minCnt) continue;
    mEla90[c] = e90[c] / cnt[c];
    mRatio[c] = Math.log((e75[c] / cnt[c] + 0.3) / (e90[c] / cnt[c] + 0.3));
    mGhost[c] = Math.log((e60[c] / cnt[c] + 0.3) / (e95[c] / cnt[c] + 0.3));
    mLum[c] = sumY[c] / cnt[c]; mCb[c] = sumCb[c] / cnt[c]; mCr[c] = sumCr[c] / cnt[c];
    const ed = edgeN[c] / cnt[c];
    cls[c] = ed < EDGE_CLASSES[0] ? 0 : ed < EDGE_CLASSES[1] ? 1 : ed < EDGE_CLASSES[2] ? 2 : 3;
    if (flatN[c] >= 150) {
      mNoise[c] = Math.log1p(Math.sqrt(flatR2[c] / flatN[c]) * 10);
      mChroma[c] = Math.log1p(Math.sqrt(flatC2[c] / flatN[c]) * 10);
    }
    if (edgeN[c] >= 12) {
      let acc = 0, k = 0;
      const target = edgeN[c] * 0.9;
      for (; k < 64; k++) { acc += edgeHist[c * 64 + k]; if (acc >= target) break; }
      mSharp[c] = k;
    }
    for (let p = 0; p < 8; p++) { gProf[p] += blk[c * 8 + p]; gProfN[p] += blkN[c * 8 + p]; }
  }
  const gAvg = Array.from(gProf, (v, p) => v / Math.max(1, gProfN[p]));
  let phase = 0;
  for (let p = 1; p < 8; p++) if (gAvg[p] > gAvg[phase]) phase = p;
  const othersMean = (arr, skip) => { let s = 0, k = 0; for (let p = 0; p < 8; p++) if (p !== skip) { s += arr[p]; k++; } return s / k; };
  const gridStrength = gAvg[phase] / (othersMean(gAvg, phase) + 1e-6);
  let cellsTex = 0, cellsNoGrid = 0, cellsOff = 0;
  for (let c = 0; c < nc; c++) {
    if (!cellOk[c] || cnt[c] < minCnt) continue;
    const prof = [];
    for (let p = 0; p < 8; p++) prof.push(blk[c * 8 + p] / Math.max(1, blkN[c * 8 + p]));
    const mean = prof.reduce((a, b) => a + b, 0) / 8;
    if (mean < 0.15) continue;
    cellsTex++;
    const ratio = prof[phase] / (othersMean(prof, phase) + 1e-6);
    mBlk[c] = ratio;
    let am = 0;
    for (let p = 1; p < 8; p++) if (prof[p] > prof[am]) am = p;
    if (am !== phase) cellsOff++;
    if (ratio < 1.01) cellsNoGrid++;
  }

  // copy-move: translation-equivariant anchors (local maxima of edge strength), a 16x16
  // signature around each anchor, then votes for one shared offset vector between matching anchors.
  const anchors = [];
  const RAD = 3;
  for (let y = 10; y < h - 10; y++) {
    for (let x = 10; x < w - 10; x++) {
      const i = y * w + x, gv = grad[i];
      if (gv < 70) continue;
      let isMax = true;
      for (let dy = -RAD; dy <= RAD && isMax; dy++) {
        for (let dx = -RAD; dx <= RAD; dx++) {
          if (!dx && !dy) continue;
          const o = grad[i + dy * w + dx];
          if (o > gv || (o === gv && (dy < 0 || (dy === 0 && dx < 0)))) { isMax = false; break; }
        }
      }
      if (isMax) anchors.push(i);
    }
  }
  anchors.sort((a, b) => grad[b] - grad[a] || a - b);
  if (anchors.length > 7000) anchors.length = 7000;
  const buckets = new Map();
  let used = 0;
  for (const i of anchors) {
    const ax = i % w, ay = (i / w) | 0;
    const x0 = ax - 8, y0 = ay - 8;
    const q = new Array(16);
    let tot = 0;
    for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) {
      let s = 0;
      for (let yy = 0; yy < 4; yy++) { const o = (y0 + sy * 4 + yy) * w + x0 + sx * 4; s += Y[o] + Y[o + 1] + Y[o + 2] + Y[o + 3]; }
      q[sy * 4 + sx] = s / 16; tot += s / 16;
    }
    const m = tot / 16;
    let v = 0, gxe = 0, gye = 0;
    for (let k = 0; k < 16; k++) {
      v += (q[k] - m) ** 2;
      if (k % 4 < 3) gxe += Math.abs(q[k + 1] - q[k]);
      if (k < 12) gye += Math.abs(q[k + 4] - q[k]);
    }
    if (v / 16 < 150 || gxe < 40 || gye < 40) continue; // lines and flat areas repeat by nature
    used++;
    let key = Math.round(m / 48) + ':';
    for (const t of q) key += Math.max(-3, Math.min(3, Math.round((t - m) / 28))) + ',';
    const arr = buckets.get(key);
    if (arr) { if (arr.length < 5) arr.push(i); } else buckets.set(key, [i]);
  }
  const votes = new Map();
  for (const arr of buckets.values()) {
    if (arr.length < 2 || arr.length > 4) continue;
    for (let a = 0; a < arr.length; a++) for (let b = a + 1; b < arr.length; b++) {
      let dx = (arr[b] % w) - (arr[a] % w), dy = ((arr[b] / w) | 0) - ((arr[a] / w) | 0);
      if (dy < 0 || (dy === 0 && dx < 0)) { dx = -dx; dy = -dy; }
      if (dx * dx + dy * dy < 48 * 48) continue;
      const k = (dx + 2048) * 4096 + dy;
      votes.set(k, (votes.get(k) || 0) + 1);
    }
  }
  const vs = [...votes.values()].sort((a, b) => b - a);
  const topVotes = vs[0] || 0;
  const strongOffsets = vs.filter((v) => v >= 6).length;

  const names = [];
  const vals = [];
  const add = (name, v) => { names.push(name); vals.push(Number.isFinite(v) ? v : 0); };
  // absolute brightness/colour level says which template it is, not whether it was edited: skip 'mean' there
  const addMap = (prefix, map, skipMean = false) => {
    const s = mapStats(map, gw, gh);
    for (let k = skipMean ? 1 : 0; k < s.length; k++) add(`${prefix}_${MAP_STAT_NAMES[k]}`, s[k]);
  };
  const addCond = (prefix, map) => {
    const s = conditionalAnomaly(map, cls, 4);
    ['max', 'min', 'frac', 'top5'].forEach((nm, k) => add(`${prefix}_cond_${nm}`, s[k]));
  };
  const npx = (w - 2) * (h - 2);
  addMap('ela_q90', mEla90);
  addMap('blk_ratio75_90', mRatio);
  addMap('blk_ghost60_95', mGhost);
  addMap('noise_luma', mNoise);
  addMap('noise_chroma', mChroma);
  addMap('sharp_edge', mSharp);
  addMap('color_lum', mLum, true);
  addMap('color_cb', mCb, true);
  addMap('color_cr', mCr, true);
  addMap('blk_cell', mBlk);
  addCond('ela_q90', mEla90);
  addCond('blk_ratio75_90', mRatio);
  addCond('blk_ghost60_95', mGhost);
  addCond('noise_luma', mNoise);
  addCond('noise_chroma', mChroma);
  addCond('sharp_edge', mSharp);
  addCond('color_lum', mLum);
  addCond('color_cb', mCb);
  addCond('color_cr', mCr);
  add('ela_global_q90', Math.log1p(gE90 / npx));
  add('ela_global_q75', Math.log1p(gE75 / npx));
  add('ela_ratio_75_90', (gE75 / npx + 0.05) / (gE90 / npx + 0.05));
  add('blk_grid_strength', Math.log(gridStrength));
  add('blk_cells_no_grid', cellsTex ? cellsNoGrid / cellsTex : 0);
  add('blk_cells_off_phase', cellsOff / Math.max(1, cellsTex));
  add('cm_top_votes', Math.log1p(topVotes));
  add('cm_top_votes_rel', (topVotes / Math.max(1, used)) * 100);
  add('cm_strong_offsets', Math.log1p(strongOffsets));
  return { names, values: vals };
}
