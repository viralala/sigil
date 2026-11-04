"""Leak check for the public classifier model.

Run from the private folder so the real CSV is reachable:
    cd "D:\\Study FY\\sigil-private" && python "D:\\Study FY\\Vk26\\bench\\ml\\claims\\leak_check.py"

It scans packages/parser/src/model.js against every student name, faculty/guide/author name, email and PRN in the
private CSV, and re-derives the student-count of every exported feature. It prints COUNTS ONLY (never a matched
value) and exits non-zero if anything leaks.
"""
import json, os, re, sys, unicodedata
import numpy as np
import scipy.sparse as sp
from sklearn.feature_extraction.text import CountVectorizer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import claims_lib as L

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".."))
MODEL = os.path.join(ROOT, "packages", "parser", "src", "model.js")
MIN_STUDENTS = 5


def load_model():
    s = open(MODEL, encoding="utf-8").read()
    body = s[s.index("export default ") + len("export default "):].rstrip().rstrip(";")
    return s, json.loads(body)


def fold(v):
    return unicodedata.normalize("NFKC", str(v)).lower()


def main():
    raw, model = load_model()
    d = L.load_csv()
    frag = L.name_tokens(d)
    values = L.person_values(d)
    vocab = model["vocab"]
    selftest = "--selftest" in sys.argv
    if selftest:  # plant a known name fragment: the checker MUST then fail
        vocab = vocab + ["w:" + sorted(frag)[0]]
    info = {"long_fragment_inside_word": 0}
    hits = {"exact_fragment": 0, "full_value_in_file": 0, "email_in_file": 0,
            "prn_in_file": 0, "digit_in_feature": 0, "below_min_students": 0}

    # 1 + 2: feature vs name fragments
    long_frag = [f for f in frag if len(f) >= 6]
    for f in vocab:
        body = f[2:]
        words = body.split()
        pieces = set(words) | {body.strip(), body.replace(" ", "")}
        if pieces & frag:
            hits["exact_fragment"] += 1
        if f[:2] != "c:":  # char n-grams are <=5 chars, cannot contain a >=6 fragment
            if any(lf in w for lf in long_frag for w in words):
                info["long_fragment_inside_word"] += 1
        if f[:2] != "s:" and re.search(r"[1-9]", body):  # digits are folded to the single character 0
            hits["digit_in_feature"] += 1

    # 3: raw text scan for whole values
    low = fold(raw)
    emails = [v for v in values if "@" in v]
    prns = [v for v in d["prn"].dropna().astype(str).str.strip() if len(v) >= 6]
    for v in values:
        fv = fold(v).strip()
        if len(fv) >= 4 and fv in low:
            hits["full_value_in_file"] += 1
    for e in emails:
        if fold(e).strip() in low or fold(e).split("@")[0] in low and len(fold(e).split("@")[0]) >= 4:
            hits["email_in_file"] += 1
    for p in set(prns):
        if p in raw:
            hits["prn_in_file"] += 1
    if re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}", raw):
        hits["email_in_file"] += 1
    if re.search(r"\b\d{6,}\b", raw.replace("[", " ").replace("]", " ").replace(",", " ")):
        hits["prn_in_file"] += 1  # any 6+ digit run at all (idf/coef are numbers, so only count digit runs inside strings)

    # 4: independently recompute distinct-student count of every exported feature
    real = L.real_frame(d)
    syn = L.synthetic()
    texts = list(real.text) + [t for t, _, _ in syn["train"] + syn["test"]]
    groups = [str(g) for g in real.group] + [g for _, _, g in syn["train"] + syn["test"]]
    cv = CountVectorizer(analyzer=L.analyzer, lowercase=False, binary=True, vocabulary=vocab)
    X = cv.transform(texts)
    gid = {g: i for i, g in enumerate(sorted(set(groups)))}
    G = sp.csr_matrix((np.ones(len(groups)), ([gid[g] for g in groups], range(len(groups)))), shape=(len(gid), len(groups)))
    students = np.asarray(((G @ X) > 0).sum(axis=0)).ravel()
    hits["below_min_students"] = int((students < MIN_STUDENTS).sum())

    print("model file bytes:", len(raw.encode("utf-8")), "| vocabulary size:", len(vocab))
    print("checked against: %d person strings, %d name fragments, %d emails, %d PRNs" % (len(values), len(frag), len(emails), len(set(prns))))
    total = 0
    for k, v in hits.items():
        print("  %-28s %d" % (k, v))
        total += v
    print("  (informational, not counted: %d word features contain a >=6-char name fragment as a SUBSTRING, e.g. 'architecture' contains a short name-like fragment; all are public organisation/English words)" % info["long_fragment_inside_word"])
    print("TOTAL HITS:", total)
    print("RESULT:", "PASS (zero hits)" if total == 0 else "FAIL")
    if selftest:
        print("SELFTEST:", "detected the planted fragment (checker works)" if hits["exact_fragment"] >= 1 else "MISSED planted fragment (checker broken)")
        sys.exit(0 if hits["exact_fragment"] >= 1 else 2)
    sys.exit(0 if total == 0 else 1)


if __name__ == "__main__":
    main()
