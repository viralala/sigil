"""Train + compare three small models on the forensic feature table, calibrate the
winner, and export it as plain JSON (packages/forensics/src/model.json).

Uses ONLY the train and val splits. The test splits are never read here
(they are touched once, by eval.py, after the model file is frozen).

Usage: python train.py [features.csv] [manifest.csv]
"""
import csv, hashlib, json, os, sys, time, datetime
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, log_loss
from sklearn.neural_network import MLPClassifier

PRIV = os.environ.get("SIGIL_PRIV", r"D:\Study FY\sigil-private\ml-tamper")
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_MODEL = os.path.join(HERE, "..", "..", "..", "packages", "forensics", "src", "model.json")
FEATS = sys.argv[1] if len(sys.argv) > 1 else f"{PRIV}/features.csv"
MAN = sys.argv[2] if len(sys.argv) > 2 else f"{PRIV}/manifest.csv"
CLIP = 6.0

GROUPS = [
    ("ela", "uneven_saving", "Some parts of the picture look saved differently from the rest."),
    ("noise", "uneven_grain", "The graininess of the picture is uneven in places."),
    ("sharp", "uneven_sharpness", "Some areas are sharper or blurrier than the areas around them."),
    ("blk", "saved_twice", "Parts of the picture seem to have been saved more than once."),
    ("color", "colour_patch", "A patch of the page has slightly different colours than its surroundings."),
    ("cm", "copied_area", "Two spots in the picture look like copies of each other."),
]

def load():
    man = {r["id"]: r for r in csv.DictReader(open(MAN))}
    rows = list(csv.reader(open(FEATS)))
    names, data = rows[0][1:], rows[1:]
    ids = [r[0] for r in data]
    X = np.array([[float(v) for v in r[1:]] for r in data], dtype=np.float64)
    y = np.array([int(man[i]["label"]) for i in ids])
    split = np.array([man[i]["split"] for i in ids])
    return names, ids, X, y, split, man

def far_at_frr(y, s, frr=0.05):
    """FAR: tampered scored below the threshold that flags 5% of genuine documents."""
    g = np.sort(s[y == 0])
    thr = np.quantile(g, 1 - frr)
    return float((s[y == 1] <= thr).mean()), float(thr)

def sig(x):
    return 1 / (1 + np.exp(-x))

def tree_arrays(est):
    t = est.tree_
    return {"f": t.feature.tolist(), "t": [float(v) for v in t.threshold], "l": t.children_left.tolist(),
            "r": t.children_right.tolist(), "v": [float(v) for v in t.value[:, 0, 0]]}

def main():
    t0 = time.time()
    names, ids, X, y, split, man = load()
    tr, va = split == "train", split == "val"
    mu, sd = X[tr].mean(0), X[tr].std(0) + 1e-9
    Z = np.clip((X - mu) / sd, -CLIP, CLIP)
    print(f"train {tr.sum()} (tampered {y[tr].mean():.2f}), val {va.sum()} (tampered {y[va].mean():.2f}), features {X.shape[1]}")

    cands = []
    for C in (0.01, 0.1, 1.0, 10.0):
        m = LogisticRegression(C=C, max_iter=3000).fit(Z[tr], y[tr])
        cands.append(("logreg", {"C": C}, m, m.decision_function(Z[va])))
    for n, d, lr in ((150, 3, .08), (300, 3, .05), (200, 4, .05), (300, 2, .08)):
        m = GradientBoostingClassifier(n_estimators=n, max_depth=d, learning_rate=lr, subsample=.8, min_samples_leaf=10, random_state=0).fit(Z[tr], y[tr])
        cands.append(("gb", {"n": n, "depth": d, "lr": lr}, m, m.decision_function(Z[va])))
    for hid in ((32,), (32, 16)):
        for a in (1e-2, 1e-1, 1.0):
            m = MLPClassifier(hid, alpha=a, max_iter=800, random_state=0, early_stopping=False).fit(Z[tr], y[tr])
            cands.append(("mlp", {"hidden": list(hid), "alpha": a}, m, m.predict_proba(Z[va])[:, 1] * 2 - 1))
    table = []
    for kind, hp, m, s in cands:
        auc = roc_auc_score(y[va], s)
        far, _ = far_at_frr(y[va], s)
        table.append({"model": kind, "hp": hp, "val_auc": round(float(auc), 4), "val_far_at_5frr": round(far, 4)})
        print(f"{kind:7s} {str(hp):42s} val AUC {auc:.4f}  FAR@5%FRR {far:.3f}")
    best_per_kind = {}
    for (kind, hp, m, s), row in zip(cands, table):
        if kind not in best_per_kind or row["val_auc"] > best_per_kind[kind][1]["val_auc"]:
            best_per_kind[kind] = ((kind, hp, m, s), row)
    win_kind = max(best_per_kind, key=lambda k: best_per_kind[k][1]["val_auc"])
    (kind, hp, model, s_val), _ = best_per_kind[win_kind]
    print("winner:", kind, hp)

    # raw logit for the winner, exported to plain JSON
    if kind == "logreg":
        exp = {"type": "logreg", "w": model.coef_[0].tolist(), "b": float(model.intercept_[0])}
        raw = lambda Zm: Zm @ model.coef_[0] + model.intercept_[0]
    elif kind == "gb":
        init = float(model._raw_predict_init(Z[:1])[0, 0])
        exp = {"type": "gb", "init": init, "lr": float(model.learning_rate), "trees": [tree_arrays(e[0]) for e in model.estimators_]}
        raw = lambda Zm: model.decision_function(Zm)
    else:
        ws = [w.tolist() for w in model.coefs_]
        bs = [b.tolist() for b in model.intercepts_]
        exp = {"type": "mlp", "w": ws, "b": bs}
        def raw(Zm):
            a = Zm
            for i, (w, b) in enumerate(zip(model.coefs_, model.intercepts_)):
                a = a @ w + b
                if i < len(model.coefs_) - 1:
                    a = np.maximum(a, 0)
            return a[:, 0]
    r_val = raw(Z[va])
    # Platt calibration on the validation split (selection used AUC, which calibration does not change)
    cal = LogisticRegression(C=1e6, max_iter=1000).fit(r_val[:, None], y[va])
    a, c = float(cal.coef_[0, 0]), float(cal.intercept_[0])
    p_val = sig(a * r_val + c)
    ll_raw = log_loss(y[va], np.clip(sig(r_val), 1e-6, 1 - 1e-6))
    ll_cal = log_loss(y[va], p_val)
    print(f"val log loss raw {ll_raw:.4f} -> calibrated {ll_cal:.4f}; Platt a={a:.3f} c={c:.3f}")
    # reliability on val (10 bins)
    bins = np.linspace(0, 1, 6)
    rel = []
    for lo, hi in zip(bins[:-1], bins[1:]):
        k = (p_val >= lo) & (p_val < hi + (1e-9 if hi == 1 else 0))
        if k.sum() >= 5:
            rel.append({"bin": [round(lo, 2), round(hi, 2)], "n": int(k.sum()), "mean_pred": round(float(p_val[k].mean()), 3), "observed": round(float(y[va][k].mean()), 3)})

    # levels, picked on validation genuine documents only
    g = np.sort(p_val[y[va] == 0])
    t_some = float(np.quantile(g, 0.95))   # about 5% of genuine documents flagged "some signs"
    t_strong = float(np.quantile(g, 0.99))  # about 1% of genuine documents flagged "strong signs"
    t_strong = max(t_strong, t_some + 1e-4)
    far_val, _ = far_at_frr(y[va], p_val)

    # signal groups: how far a feature group is from what genuine training pages look like
    gen = tr & (y == 0)
    gmu, gsd = X[gen].mean(0), X[gen].std(0) + 1e-9
    gz = np.abs((X - gmu) / gsd)
    groups = []
    for prefix, gid, plain in GROUPS:
        idx = [i for i, n in enumerate(names) if n.split("_")[0] == prefix]
        score = gz[:, idx].max(1)
        thr = float(np.quantile(score[(tr | va) & (y == 0)], 0.97))
        assert len(plain.split()) <= 12, plain
        groups.append({"id": gid, "plain": plain, "idx": idx, "thr": thr})
    model_json = {
        "family": "sigil-forensics",
        "kind": kind,
        "hyperparameters": hp,
        "featureVersion": 1,
        "trainedOn": datetime.date.today().isoformat(),
        "featureNames": names,
        "mean": mu.tolist(), "std": sd.tolist(), "clip": CLIP,
        "model": exp,
        "calibration": {"type": "platt", "a": a, "c": c},
        "thresholds": {"some": t_some, "strong": t_strong},
        "genuineMean": gmu.tolist(), "genuineStd": gsd.tolist(),
        "groups": groups,
        "note": "Synthetic-tamper training only. Machine evidence, never a verdict. See bench/ml/tamper/report.md.",
    }
    body = json.dumps(model_json, separators=(",", ":"))
    model_json["version"] = f"tamper-{kind}-{model_json['trainedOn']}-{hashlib.sha256(body.encode()).hexdigest()[:8]}"
    os.makedirs(os.path.dirname(OUT_MODEL), exist_ok=True)
    json.dump(model_json, open(OUT_MODEL, "w"), separators=(",", ":"))
    with open(OUT_MODEL.replace(".json", ".js"), "w") as fh:  # JS twin so any bundler can import it
        fh.write("// Generated by bench/ml/tamper/train.py. Do not edit.\nexport default " + json.dumps(model_json, separators=(",", ":")) + ";\n")
    log = {"date": model_json["trainedOn"], "version": model_json["version"], "winner": kind, "hyperparameters": hp,
           "n_train": int(tr.sum()), "n_val": int(va.sum()), "val_candidates": table, "val_log_loss_raw": ll_raw,
           "val_log_loss_calibrated": ll_cal, "val_reliability": rel, "val_far_at_5frr_calibrated": far_val,
           "thresholds": model_json["thresholds"], "train_seconds": round(time.time() - t0, 1),
           "model_bytes": os.path.getsize(OUT_MODEL)}
    json.dump(log, open(os.path.join(HERE, "train_log.json"), "w"), indent=1)
    print("saved", OUT_MODEL, os.path.getsize(OUT_MODEL), "bytes; trained in", round(time.time() - t0, 1), "s")

if __name__ == "__main__":
    main()
