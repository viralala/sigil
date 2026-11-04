"""Honest evaluation of the exported tamper model on the untouched test splits.

* Reads ONLY the frozen model file (packages/forensics/src/model.json), the private
  feature table and manifest. Nothing is tuned here; thresholds come from the
  validation split (stored in the model file).
* Re-implements the model's JSON evaluation in Python, and checks it against the
  shipped JS (analyzeImage) on a sample of test images (parity).
* Writes metrics.json and report.md in this folder: aggregates only, no names, no images.

Usage: python eval.py
"""
import csv, datetime, json, os, subprocess, sys, tempfile
from collections import Counter, defaultdict
import numpy as np
from sklearn.metrics import roc_auc_score

PRIV = os.environ.get("SIGIL_PRIV", r"D:\Study FY\sigil-private\ml-tamper")
HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.path.join(HERE, "..", "..", "..", "packages", "forensics", "src", "model.json")
M = json.load(open(MODEL))
THR_SOME, THR_STRONG = M["thresholds"]["some"], M["thresholds"]["strong"]

def sig(x): return 1 / (1 + np.exp(-x))

def raw_score(Z):
    m = M["model"]
    if m["type"] == "logreg":
        return Z @ np.array(m["w"]) + m["b"]
    if m["type"] == "gb":
        s = np.full(len(Z), m["init"], dtype=float)
        for t in m["trees"]:
            f, th, l, r, v = (np.array(t[k]) for k in ("f", "t", "l", "r", "v"))
            node = np.zeros(len(Z), int)
            while True:
                leaf = l[node] == -1
                if leaf.all(): break
                nxt = np.where(Z[np.arange(len(Z)), np.maximum(f[node], 0)] <= th[node], l[node], r[node])
                node = np.where(leaf, node, nxt)
            s += m["lr"] * v[node]
        return s
    a = Z
    for i, (W, b) in enumerate(zip(m["w"], m["b"])):
        a = a @ np.array(W) + np.array(b)
        if i < len(m["w"]) - 1: a = np.maximum(a, 0)
    return a[:, 0]

def score(X):
    Z = np.clip((X - np.array(M["mean"])) / np.array(M["std"]), -M["clip"], M["clip"])
    return sig(M["calibration"]["a"] * raw_score(Z) + M["calibration"]["c"])

def load():
    man = {r["id"]: r for r in csv.DictReader(open(f"{PRIV}/manifest.csv"))}
    rows = list(csv.reader(open(f"{PRIV}/features.csv")))
    assert rows[0][1:] == M["featureNames"], "feature table does not match model"
    ids = [r[0] for r in rows[1:]]
    X = np.array([[float(v) for v in r[1:]] for r in rows[1:]])
    return ids, X, [man[i] for i in ids]

def auc_ci(y, s, base, reps=500, seed=0):
    """AUC with a 95% interval from a bootstrap over source certificates (clusters), not images."""
    if len(set(y)) < 2: return None, None, None
    a = roc_auc_score(y, s)
    rng = np.random.default_rng(seed)
    ub = sorted(set(base))
    idx = defaultdict(list)
    for i, b in enumerate(base): idx[b].append(i)
    vals = []
    for _ in range(reps):
        pick = rng.choice(len(ub), len(ub))
        ii = np.concatenate([idx[ub[p]] for p in pick])
        if len(set(y[ii])) < 2: continue
        vals.append(roc_auc_score(y[ii], s[ii]))
    return float(a), float(np.quantile(vals, .025)), float(np.quantile(vals, .975))

def op(y, s, thr):
    g, t = s[y == 0], s[y == 1]
    return {"frr": float((g >= thr).mean()) if len(g) else None, "far": float((t < thr).mean()) if len(t) else None}

def oracle_far(y, s, frr=0.05):
    g = np.sort(s[y == 0]); thr = np.quantile(g, 1 - frr)
    return float((s[y == 1] <= thr).mean())

def summarise(name, mask, y, s, base):
    yy, ss, bb = y[mask], s[mask], np.array(base)[mask]
    if mask.sum() == 0 or len(set(yy)) < 2: return {"name": name, "n": int(mask.sum())}
    a, lo, hi = auc_ci(yy, ss, list(bb))
    return {"name": name, "n_genuine": int((yy == 0).sum()), "n_tampered": int((yy == 1).sum()), "n_source_certs": len(set(bb)),
            "auc": a, "auc_ci95": [lo, hi], "at_some": op(yy, ss, THR_SOME), "at_strong": op(yy, ss, THR_STRONG),
            "far_at_5pct_frr_oracle": oracle_far(yy, ss)}

def main():
    ids, X, meta = load()
    s = score(X)
    y = np.array([int(m["label"]) for m in meta])
    split = np.array([m["split"] for m in meta])
    src = np.array([m["source"] for m in meta])
    att = np.array([m["attack"] for m in meta])
    deg = np.array([m["degr"] for m in meta])
    base = [m["base"] for m in meta]
    out = {"date": datetime.date.today().isoformat(), "model_version": M["version"], "model_kind": M["kind"],
           "thresholds": M["thresholds"], "sizes": {}, "sets": [], "attacks": {}, "degradation": {}}
    for sp in ("train", "val", "test_tpl", "test_fam"):
        k = split == sp
        out["sizes"][sp] = {"images": int(k.sum()), "genuine": int((y[k] == 0).sum()), "tampered": int((y[k] == 1).sum()),
                            "source_certs": len(set(np.array(base)[k])), "templates": len(set(m["template"] for m, kk in zip(meta, k) if kk)),
                            "real_images": int((k & (src == "real")).sum())}
    te = (split == "test_tpl") | (split == "test_fam")
    sets = [("train (seen in training; optimistic)", split == "train"), ("val (used to pick model/thresholds)", split == "val"),
            ("TEST unseen templates (all)", split == "test_tpl"), ("TEST unseen templates, fictional", (split == "test_tpl") & (src == "fict")),
            ("TEST unseen templates, real CESAC winner family", (split == "test_tpl") & (src == "real")),
            ("TEST held-out FAMILIES (all)", split == "test_fam"), ("TEST held-out family, fictional dark", (split == "test_fam") & (src == "fict")),
            ("TEST held-out family, real CESAC organiser", (split == "test_fam") & (src == "real")), ("TEST all", te),
            ("TEST all real CESAC", te & (src == "real"))]
    for n, k in sets:
        out["sets"].append(summarise(n, k, y, s, base))
    for label, k in (("unseen_templates", split == "test_tpl"), ("held_out_families", split == "test_fam"), ("all_test", te)):
        rows = []
        for a in sorted(set(att[k & (y == 1)])):
            kk = k & ((y == 0) | (att == a))
            r = summarise(a, kk, y, s, base)
            r["detected_at_some"] = None if "at_some" not in r else 1 - r["at_some"]["far"]
            r["detected_at_strong"] = None if "at_strong" not in r else 1 - r["at_strong"]["far"]
            rows.append(r)
        out["attacks"][label] = rows
        drows = []
        for d in sorted(set(deg[k])):
            kg = k & (deg == d) & (y == 0)
            kt = k & (deg == d) & (y == 1)
            drows.append({"degradation": d, "n_genuine": int(kg.sum()), "n_tampered": int(kt.sum()),
                          "genuine_flagged_some": float((s[kg] >= THR_SOME).mean()) if kg.any() else None,
                          "tampered_flagged_some": float((s[kt] >= THR_SOME).mean()) if kt.any() else None,
                          "auc": float(roc_auc_score(y[k & (deg == d)], s[k & (deg == d)])) if len(set(y[k & (deg == d)])) > 1 else None})
        out["degradation"][label] = drows
    # levels on the combined test set
    lv = lambda v: "strong_signs" if v >= THR_STRONG else ("some_signs" if v >= THR_SOME else "no_signs")
    out["level_counts_test"] = {lab: dict(Counter(lv(v) for v in s[te & (y == lab)])) for lab in (0, 1)}
    # signals fire sanity: share of flagged pages that get a named reason is shown by parity run
    # parity with the shipped JS
    pick = [i for i in range(len(ids)) if split[i] in ("test_tpl", "test_fam")][::max(1, int(te.sum()) // 40)][:40]
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as fh:
        fh.write("\n".join(f"{ids[i]}.{meta[i]['ext']}" for i in pick))
        lst = fh.name
    r = subprocess.run(["node", os.path.join(HERE, "parity.mjs"), lst], capture_output=True, text=True, cwd=HERE)
    if r.returncode == 0:
        js = json.loads(r.stdout)
        diffs = [abs(js[ids[i]]["score"] - s[i]) for i in pick]
        lvl_ok = sum(js[ids[i]]["level"] == lv(s[i]) for i in pick)
        out["js_parity"] = {"n": len(pick), "max_abs_score_diff": float(max(diffs)), "level_agreement": f"{lvl_ok}/{len(pick)}"}
    else:
        out["js_parity"] = {"error": r.stderr[-300:]}
    os.unlink(lst)
    json.dump(out, open(os.path.join(HERE, "metrics.json"), "w"), indent=1)
    write_report(out)
    print(json.dumps({k: out[k] for k in ("sizes", "js_parity", "level_counts_test")}, indent=1))
    for r_ in out["sets"]:
        if "auc" in r_:
            print(f"{r_['name'][:58]:58s} n={r_['n_genuine']}+{r_['n_tampered']} AUC {r_['auc']:.3f} [{r_['auc_ci95'][0]:.3f},{r_['auc_ci95'][1]:.3f}] "
                  f"FRR@some {r_['at_some']['frr']:.3f} FAR@some {r_['at_some']['far']:.3f} oracleFAR@5%FRR {r_['far_at_5pct_frr_oracle']:.3f}")

def pct(v): return "n/a" if v is None else f"{100 * v:.1f}%"

def write_report(o):
    L = []
    w = L.append
    w("# Sigil tamper model: honest evaluation (synthetic tampering)\n")
    w(f"Date: {o['date']}. Model: `{o['model_version']}` ({o['model_kind']}). Generated by `eval.py`; numbers below are produced by that script, not typed by hand.\n")
    allr = next(r for r in o["sets"] if r["name"] == "TEST all")
    held = next(r for r in o["sets"] if r["name"].startswith("TEST held-out FAMILIES (all)"))
    tpl = next(r for r in o["sets"] if r["name"] == "TEST unseen templates (all)")
    real = next(r for r in o["sets"] if r["name"] == "TEST all real CESAC")
    worst = min(allr["auc"], held["auc"], tpl["auc"])
    verdict = "WEAK" if worst < 0.70 else ("MODERATE" if worst < 0.85 else "USEFUL AS A WEAK SIGNAL")
    w(f"## Verdict: {verdict}\n")
    w(f"AUC on all test data {allr['auc']:.3f}, on unseen templates {tpl['auc']:.3f}, on whole held-out families {held['auc']:.3f}, on real CESAC certificates only {real['auc']:.3f}. "
      "This is a hint generator that sits under the Witness Model (machine checks are never stronger than 'checked'); it is not a detector anyone should rely on alone.\n")
    w("## What was measured, and what it does NOT prove\n")
    w("- Every tampered image here was made by **our own synthetic generator** (`gen_dataset.py`): text replaced (font-matched and mismatched), splice from another certificate, copy-move, seal/signature pasted, edit then re-save at another JPEG quality. Real forgers use other tools and tricks. A good score here does not mean the model catches real forgeries.")
    w("- Genuine certificates are either our own fictional templates (invented names, 6 families) or real CESAC certificates. Real genuine certificates only appear as genuine (and as the base of synthetic edits); **there is no real forgery in this evaluation at all.**")
    w("- Genuine and tampered images share the same degradation sampler (PNG, JPEG once/twice, screenshot, re-photo, blur, rotation, glare), so 'looks degraded' is not a cue. The tables below check this directly.")
    w("- The real CESAC set is small (one participation template used in training, one winner family and one organiser family held out). Those confidence intervals are wide.")
    w("- Features are statistical (error level analysis, noise, sharpness, JPEG block grid, colour, repeated blocks). A forger who edits then screenshots, prints and re-photographs removes most of this evidence. A perfect background fill plus a matching font leaves very little for any pixel statistic to find.")
    w("- Thresholds were chosen on the validation split only (about 5% of genuine pages flagged 'some signs', about 1% 'strong signs'); no test data was used to tune anything.\n")
    w("## Split sizes (split by template, never by image)\n")
    w("| split | images | genuine | tampered | source certificates | templates | real-CESAC images |\n|---|---|---|---|---|---|---|")
    for sp, v in o["sizes"].items():
        w(f"| {sp} | {v['images']} | {v['genuine']} | {v['tampered']} | {v['source_certs']} | {v['templates']} | {v['real_images']} |")
    w("\nheld-out families = the whole fictional 'dark' family and the whole real CESAC organiser family, absent from train and validation. 'Unseen templates' = other templates of families that were in training, plus the real CESAC winner family (three layouts, not in training).\n")
    w(f"## Headline numbers (operating points fixed on validation: some_signs >= {o['thresholds']['some']:.3f}, strong_signs >= {o['thresholds']['strong']:.3f})\n")
    w("FRR = genuine pages flagged (false reject). FAR = tampered pages not flagged (false accept). 'oracle FAR@5%FRR' re-picks the threshold on each set itself (the AI_MODELS.md metric; optimistic, shown for comparison).\n")
    w("| set | genuine / tampered | AUC (95% CI over source certs) | FRR @some | FAR @some | FRR @strong | FAR @strong | oracle FAR@5%FRR |\n|---|---|---|---|---|---|---|---|")
    for r in o["sets"]:
        if "auc" not in r: continue
        w(f"| {r['name']} | {r['n_genuine']} / {r['n_tampered']} | {r['auc']:.3f} ({r['auc_ci95'][0]:.3f} to {r['auc_ci95'][1]:.3f}) | {pct(r['at_some']['frr'])} | {pct(r['at_some']['far'])} | {pct(r['at_strong']['frr'])} | {pct(r['at_strong']['far'])} | {pct(r['far_at_5pct_frr_oracle'])} |")
    for label, title in (("unseen_templates", "unseen templates"), ("held_out_families", "held-out families"), ("all_test", "all test data")):
        w(f"\n## Per attack, {title}\n")
        w("AUC = that attack's images vs all genuine images in the same set. 'Detected' = share of that attack flagged at the validation-chosen thresholds.\n")
        w("| attack | tampered n | AUC | detected @some | detected @strong |\n|---|---|---|---|---|")
        for r in o["attacks"][label]:
            if "auc" not in r: continue
            w(f"| {r['name']} | {r['n_tampered']} | {r['auc']:.3f} ({r['auc_ci95'][0]:.2f} to {r['auc_ci95'][1]:.2f}) | {pct(r['detected_at_some'])} | {pct(r['detected_at_strong'])} |")
    w("\n## Does degradation alone look like fraud? (all test data)\n")
    w("If the model had learned 'degraded = fake', genuine pages in the right-hand rows would be flagged far more often than 5%.\n")
    w("| degradation (applied to both classes) | genuine n | genuine flagged @some | tampered n | tampered flagged @some | AUC |\n|---|---|---|---|---|---|")
    for r in o["degradation"]["all_test"]:
        w(f"| {r['degradation']} | {r['n_genuine']} | {pct(r['genuine_flagged_some'])} | {r['n_tampered']} | {pct(r['tampered_flagged_some'])} | {'n/a' if r['auc'] is None else format(r['auc'], '.3f')} |")
    w("\n## Levels on test data\n")
    w(f"Genuine pages: {o['level_counts_test']['0']}. Tampered pages: {o['level_counts_test']['1']}.\n" if '0' in o['level_counts_test'] else f"Genuine pages: {o['level_counts_test'][0]}. Tampered pages: {o['level_counts_test'][1]}.\n")
    w("## Shipped-code parity\n")
    p = o["js_parity"]
    if "error" in p:
        w(f"Parity check FAILED to run: {p['error']}\n")
    else:
        w(f"{p['n']} test images scored through the public `analyzeImage` in Node vs this script's Python evaluation of the same `model.json`: max absolute score difference {p['max_abs_score_diff']:.5f}, level agreement {p['level_agreement']}.\n")
    w("## Reproduce\n")
    w("```\npython gen_dataset.py        # renders + tampers into the private folder (needs the CESAC originals, kept outside the repo)\nnode extract_features.mjs    # same feature code that serves production (packages/forensics)\npython train.py              # compare logistic regression / gradient boosting / small MLP on train+val, calibrate, export JSON\npython eval.py               # this report\n```")
    w("Private data (real renders, feature tables with ids) stays in `sigil-private/ml-tamper/` outside the repo. Seeds are fixed in the scripts; `train_log.json` has the validation comparison of all candidates.\n")
    open(os.path.join(HERE, "report.md"), "w", encoding="utf-8").write("\n".join(L))

if __name__ == "__main__":
    main()
