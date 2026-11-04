"""Train + evaluate the claim-kind classifier and export it as a compact JS module.

Run:  python bench/ml/claims/train.py
Reads the private CSV (never copied). Writes:
  - packages/parser/src/model.js           (public: vocabulary + weights, leak-checked)
  - packages/parser/test/golden.json       (invented sentences + Python probabilities, for JS parity test)
  - bench/ml/claims/results.json           (aggregate metrics only)
"""
import json, os, sys, math
import numpy as np
import scipy.sparse as sp
from sklearn.feature_extraction.text import CountVectorizer, TfidfTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_recall_fscore_support, confusion_matrix
from sklearn.model_selection import GroupShuffleSplit, GroupKFold

sys.path.insert(0, os.path.dirname(__file__))
import claims_lib as L

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
MIN_STUDENTS = 5
MAX_FEATURES = 20000
SEED = 42
CLASSES = L.CLASSES


def build_vocab(texts, groups, banned):
    """Features seen in >= MIN_STUDENTS distinct students, minus anything matching a name/email/prn fragment."""
    cv = CountVectorizer(analyzer=L.analyzer, lowercase=False, binary=True)
    X = cv.fit_transform(texts).tocsc()
    names = np.array(cv.get_feature_names_out())
    gid = {g: i for i, g in enumerate(sorted(set(groups), key=str))}
    G = sp.csr_matrix((np.ones(len(groups)), ([gid[g] for g in groups], range(len(groups)))), shape=(len(gid), len(groups)))
    students = np.asarray(((G @ X) > 0).sum(axis=0)).ravel()
    keep = students >= MIN_STUDENTS
    stripped = 0
    for i in np.where(keep)[0]:
        if feature_hits_name(names[i], banned):
            keep[i] = False; stripped += 1
    idx = np.where(keep)[0]
    idx = idx[np.argsort(-students[idx], kind="stable")][:MAX_FEATURES]
    idx = np.sort(idx)
    return [str(names[i]) for i in idx], stripped, int(len(names)), int((students >= MIN_STUDENTS).sum())


def feature_hits_name(f, banned):
    """Must stay in sync with leak_check.py: a feature is rejected if any word of it, or its space-less
    form, equals a name/email/prn fragment."""
    body = f[2:]
    if f.startswith("c:"):
        parts = [body.strip(), body.replace(" ", "")]
        parts += body.split()
    else:
        parts = body.split()
    return any(p in banned for p in parts)


def featurise(texts, vocab):
    cv = CountVectorizer(analyzer=L.analyzer, lowercase=False, vocabulary=vocab)
    return cv.transform(texts)


def fit_tfidf(counts):
    tf = TfidfTransformer(sublinear_tf=True, norm="l2", smooth_idf=True)
    X = tf.fit_transform(counts)
    return tf, X


SYN_WEIGHT = 3.0  # invented rows are the only evidence for education/skill/award, so they count more


def fit_lr(X, y, C, w=None):
    return LogisticRegression(C=C, max_iter=3000, class_weight="balanced").fit(X, y, sample_weight=w)


def quantise(tf, lr, vocab):
    """Round exactly as the exported JSON does, so Python metrics == JS behaviour."""
    idf = np.round(tf.idf_, 3)
    cls = list(lr.classes_)
    order = [cls.index(c) for c in CLASSES if c in cls]
    classes = [cls[i] for i in order]
    coef = np.round(lr.coef_[order] * 100).astype(int)  # int, /100
    # binary-class edge case never happens here (9 classes)
    b = np.round(lr.intercept_[order], 3)
    return {"classes": classes, "idf": idf, "coef": coef, "b": b, "vocab": vocab}


def predict_q(q, texts):
    index = {f: i for i, f in enumerate(q["vocab"])}
    P = np.zeros((len(texts), len(q["classes"])))
    W = q["coef"] / 100.0
    for r, t in enumerate(texts):
        cnt = {}
        for f in L.analyzer(t):
            i = index.get(f)
            if i is not None:
                cnt[i] = cnt.get(i, 0) + 1
        if not cnt:
            z = q["b"].copy()
        else:
            ids = list(cnt)
            v = np.array([(1 + math.log(cnt[i])) * q["idf"][i] for i in ids])
            v /= np.linalg.norm(v)
            z = v @ W[:, ids].T + q["b"]
        z = z - z.max()
        e = np.exp(z)
        P[r] = e / e.sum()
    return P


def metrics(y_true, y_pred, labels):
    p, r, f, s = precision_recall_fscore_support(y_true, y_pred, labels=labels, zero_division=0)
    present = [i for i, n in enumerate(s) if n > 0]
    return {
        "n": int(len(y_true)),
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "macro_f1_over_classes_with_support": round(float(np.mean([f[i] for i in present])), 4),
        "per_class": {labels[i]: {"precision": round(float(p[i]), 4), "recall": round(float(r[i]), 4), "f1": round(float(f[i]), 4), "support": int(s[i])} for i in range(len(labels))},
        "confusion": {"labels": labels, "rows_true_cols_pred": confusion_matrix(y_true, y_pred, labels=labels).tolist()},
    }


def main():
    d = L.load_csv()
    banned = L.name_tokens(d)
    real = L.real_frame(d); real["group"] = real.group.astype(str)
    syn = L.synthetic()
    print("real rows", len(real), "students", real.group.nunique(), "banned name fragments", len(banned))

    # ---- student-held-out split on real rows ----
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=SEED)
    tr_idx, te_idx = next(gss.split(real, real.label, real.group))
    assert not set(real.group.iloc[tr_idx]) & set(real.group.iloc[te_idx])
    rtr, rte = real.iloc[tr_idx], real.iloc[te_idx]
    str_ = [(t, l, g) for t, l, g in syn["train"]]
    ste = syn["test"]

    tr_texts = list(rtr.text) + [t for t, _, _ in str_]
    tr_y = list(rtr.label) + [l for _, l, _ in str_]
    tr_g = list(rtr.group) + [g for _, _, g in str_]

    vocab, stripped, n_all, n_df = build_vocab(tr_texts, tr_g, banned)
    print("eval model vocab", len(vocab), "stripped by name rule", stripped, "of", n_df, "passing min-students")
    counts = featurise(tr_texts, vocab)
    tf, X = fit_tfidf(counts)

    # ---- choose C by grouped CV on train ----
    best = (None, -1)
    cv_scores = {}
    for C in (1, 3, 10, 30):
        sc = []
        for a, b in GroupKFold(n_splits=5).split(X, tr_y, tr_g):
            m = fit_lr(X[a], np.array(tr_y)[a], C)
            sc.append(f1_score(np.array(tr_y)[b], m.predict(X[b]), average="macro"))
        cv_scores[C] = round(float(np.mean(sc)), 4)
        if np.mean(sc) > best[1]:
            best = (C, np.mean(sc))
    C = best[0]
    print("CV macro-F1 by C", cv_scores, "-> C =", C)

    w_tr = np.array([1.0] * len(rtr) + [SYN_WEIGHT] * len(str_))
    lr = fit_lr(X, np.array(tr_y), C, w_tr)
    q = quantise(tf, lr, vocab)

    # ---- evaluate on student-held-out real test ----
    P = predict_q(q, list(rte.text))
    pred = [q["classes"][i] for i in P.argmax(1)]
    real_m = metrics(list(rte.label), pred, CLASSES)
    # real test, but only titles never seen in training (de-duplicated)
    from claims_lib import normalise
    seen = {normalise(t) for t in rtr.text}
    unseen_mask = np.array([normalise(t) not in seen for t in rte.text])
    real_unseen = metrics(list(rte.label[unseen_mask]), [p for p, m in zip(pred, unseen_mask) if m], CLASSES)
    # raw-kind breakdown (12 original kinds) -> accuracy of mapped label
    kind_acc = {}
    for k in sorted(set(rte.kind)):
        m = (rte.kind == k).values
        if m.sum() >= 10:
            kind_acc[k] = {"n": int(m.sum()), "accuracy": round(float(np.mean(np.array(pred)[m] == rte.label.values[m])), 4)}
    # majority baseline
    maj = rtr.label.value_counts().idxmax()
    baseline = round(float(np.mean(rte.label.values == maj)), 4)
    # synthetic held-out (invented lexicon entries not seen in training)
    Ps = predict_q(q, [t for t, _, _ in ste])
    syn_m = metrics([l for _, l, _ in ste], [q["classes"][i] for i in Ps.argmax(1)], CLASSES)
    # confidence calibration summary (real test)
    conf = P.max(1)
    correct = np.array(pred) == rte.label.values
    bins = [(0, .5), (.5, .7), (.7, .9), (.9, 1.01)]
    calib = [{"conf_range": [a, min(b, 1.0)], "n": int(((conf >= a) & (conf < b)).sum()),
              "accuracy": round(float(correct[(conf >= a) & (conf < b)].mean()), 4) if ((conf >= a) & (conf < b)).any() else None}
             for a, b in bins]

    results = {
        "seed": SEED, "min_students_per_feature": MIN_STUDENTS, "max_features": MAX_FEATURES, "chosen_C": C, "cv_macro_f1_by_C": cv_scores,
        "split": {"train_real_rows": int(len(rtr)), "test_real_rows": int(len(rte)),
                  "train_students": int(rtr.group.nunique()), "test_students": int(rte.group.nunique()), "students_in_both": 0},
        "mapping": L.KIND_MAP,
        "real_test_overall": real_m,
        "real_test_unseen_titles_only": real_unseen,
        "real_test_by_original_kind": kind_acc,
        "majority_baseline_accuracy_real_test": baseline,
        "synthetic_heldout_lexicon": syn_m,
        "confidence_calibration_real_test": calib,
        "eval_model_vocab_size": len(vocab), "vocab_stripped_by_name_rule": stripped,
    }
    with open(os.path.join(os.path.dirname(__file__), "results.json"), "w") as f:
        json.dump(results, f, indent=1)
    print("real test acc", real_m["accuracy"], "macroF1", real_m["macro_f1_over_classes_with_support"],
          "| unseen-title acc", real_unseen["accuracy"], "n", real_unseen["n"], "| synthetic acc", syn_m["accuracy"])

    # ---- final model on everything (same recipe) ----
    all_texts = list(real.text) + [t for t, _, _ in syn["train"] + syn["test"]]
    all_y = list(real.label) + [l for _, l, _ in syn["train"] + syn["test"]]
    all_g = list(real.group) + [g for _, _, g in syn["train"] + syn["test"]]
    vocab2, stripped2, _, n_df2 = build_vocab(all_texts, all_g, banned)
    counts2 = featurise(all_texts, vocab2)
    tf2, X2 = fit_tfidf(counts2)
    w_all = np.array([1.0] * len(real) + [SYN_WEIGHT] * (len(all_y) - len(real)))
    lr2 = fit_lr(X2, np.array(all_y), C, w_all)
    q2 = quantise(tf2, lr2, vocab2)
    export(q2, len(all_texts))
    print("export vocab", len(vocab2), "stripped", stripped2)

    # golden parity file (invented sentences only)
    sents = [
        "Software Engineer at Bluepeak Technologies", "B.Tech in Computer Engineering, Lakeview University 2020-2024",
        "Python, Java, SQL, Docker", "Machine Learning by Andrew - Coursera", "Winner, Smart Campus Hackathon",
        "Granted patent: A device for sorting seeds", "Published in IEEE Conference on Imaging 2025",
        "Summer Intern - Data Analyst, Orbitwave Infotech", "NPTEL Python for Everybody", "Volunteer at the city library",
        "Workshop on Cloud Native Meetups | Pune", "", "!!!", "Ünïcödé टेस्ट Test 123 www.example.org a@b.co"]
    P2 = predict_q(q2, sents)
    gold = [{"text": s, "probs": [round(float(x), 8) for x in P2[i]]} for i, s in enumerate(sents)]
    with open(os.path.join(ROOT, "packages", "parser", "test", "golden.json"), "w", encoding="utf-8") as f:
        json.dump({"classes": q2["classes"], "cases": gold}, f, indent=1, ensure_ascii=False)


def export(q, n_docs):
    out = {
        "format": 1,
        "about": "Sigil claim-kind classifier: TF-IDF (word 1-2gram + char_wb 3-5gram) + logistic regression. "
                 "Vocabulary: features seen in >=5 distinct students, name/email/PRN fragments removed, digits folded to 0. "
                 "Proposes a kind only; the holder confirms.",
        "classes": q["classes"],
        "docs": int(n_docs),
        "idf": [float(x) for x in q["idf"]],
        "coef": [[int(x) for x in row] for row in q["coef"]],  # /100
        "bias": [float(x) for x in q["b"]],
        "vocab": q["vocab"],
    }
    body = json.dumps(out, separators=(",", ":"), ensure_ascii=False)
    path = os.path.join(ROOT, "packages", "parser", "src", "model.js")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write("// GENERATED by bench/ml/claims/train.py. Do not edit. Leak-checked by bench/ml/claims/leak_check.py.\n")
        f.write("export default " + body + ";\n")
    print("model.js bytes", os.path.getsize(path))


if __name__ == "__main__":
    main()
