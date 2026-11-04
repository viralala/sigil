"""Build the CESAC certificate fingerprint index (SHA-256 of each genuine PDF/PNG).

Output has no names and no paths: [{sha256, code, kind}].
Usage: python fingerprint_index.py [CESAC_ROOT] [OUT_JSON]
"""
import hashlib, json, os, re, sys

ROOT = sys.argv[1] if len(sys.argv) > 1 else r"D:\Study SY\CESAC"
OUT = sys.argv[2] if len(sys.argv) > 2 else r"D:\Study FY\sigil-private\out\cesac-cert-index.json"
KINDS = {
    "AOT-2026-Participation-Certificates": "participation",
    "AOT-2026-Participation-Extra": "participation",
    "AOT-2026-winner-certificates": "winner",
    "AOT-2026-certificates-final": "winner",
    "organiser-certificates": "organiser",
}
CODE = re.compile(r"CESAC-2026-\d{5}")

by_hash = {}
for folder, kind in KINDS.items():
    for r, _, fs in os.walk(os.path.join(ROOT, folder)):
        for f in fs:
            if os.path.splitext(f)[1].lower() not in (".pdf", ".png"):
                continue
            h = hashlib.sha256()
            with open(os.path.join(r, f), "rb") as fh:
                for chunk in iter(lambda: fh.read(1 << 20), b""):
                    h.update(chunk)
            m = CODE.search(f)
            code = m.group(0) if m else None
            cur = by_hash.get(h.hexdigest())
            if cur is None or (cur["code"] is None and code):
                by_hash[h.hexdigest()] = {"sha256": h.hexdigest(), "code": code, "kind": kind}
out = sorted(by_hash.values(), key=lambda e: e["sha256"])
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w") as fh:
    json.dump(out, fh, indent=1)
from collections import Counter
print("entries", len(out), dict(Counter(e["kind"] for e in out)), "with code", sum(1 for e in out if e["code"]))
