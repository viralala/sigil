"""Render the real CESAC certificates to PNG (PRIVATE output only) and find the
per-family text regions that vary between certificates (name / team / rank).

Everything written goes to PRIV (outside the repo). Output files are named by
index only. Nothing here prints or stores a name.
"""
import io, os, sys, json, hashlib
import numpy as np
import fitz
from PIL import Image

CESAC = os.environ.get("CESAC_ROOT", r"D:\Study SY\CESAC")
PRIV = os.environ.get("SIGIL_PRIV", r"D:\Study FY\sigil-private\ml-tamper")
W, H = 1600, 1067
FAM = {
    "AOT-2026-Participation-Certificates": "cesac_part",
    "AOT-2026-Participation-Extra": "cesac_part",
    "AOT-2026-winner-certificates": "cesac_win",
    "AOT-2026-certificates-final": "cesac_win",
    "organiser-certificates": "cesac_org",
}

def pdf_images(path):
    doc = fitz.open(path)
    for pg in doc:
        for im in pg.get_images():
            d = doc.extract_image(im[0])
            yield Image.open(io.BytesIO(d["image"])).convert("RGB")

def main():
    os.makedirs(f"{PRIV}/real", exist_ok=True)
    items = {f: [] for f in set(FAM.values())}
    thumbs = {f: [] for f in items}
    # PDFs first (full res), then PNGs only if not a near-duplicate
    paths = []
    for d, fam in FAM.items():
        for r, _, fs in os.walk(os.path.join(CESAC, d)):
            for x in sorted(fs):
                e = os.path.splitext(x)[1].lower()
                if e in (".pdf", ".png"):
                    paths.append((0 if e == ".pdf" else 1, fam, os.path.join(r, x)))
    paths.sort(key=lambda t: (t[0], t[2]))
    for _, fam, p in paths:
        ims = pdf_images(p) if p.lower().endswith(".pdf") else [Image.open(p).convert("RGB")]
        for im in ims:
            im = im.resize((W, H), Image.LANCZOS)
            t = np.asarray(im.resize((800, 533), Image.BILINEAR).convert("L"), dtype=np.float32)
            # distinct certificates differ in the name/team text; a PNG twin of a PDF does not
            if any((np.abs(t - u) > 40).sum() < 40 for fm in thumbs for u in thumbs[fm]):
                continue  # duplicate of something already kept (PNG twin of a PDF)
            thumbs[fam].append(t)
            items[fam].append(im)
    meta = {}
    for fam, ims in items.items():
        arr = np.stack([np.asarray(i, dtype=np.uint8) for i in ims])
        med = np.median(arr, axis=0).astype(np.uint8)
        # variable-content mask: pixels that differ from the median in many certs
        diff = np.abs(arr.astype(np.int16) - med.astype(np.int16)).max(axis=3)
        var = (diff > 40).mean(axis=0)
        mask = var > 0.15
        # connected boxes on a coarse grid
        from scipy import ndimage as ndi
        m = ndi.binary_dilation(mask, iterations=12)
        lab, n = ndi.label(m)
        boxes = []
        for sl in ndi.find_objects(lab):
            y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
            if (y1 - y0) >= 18 and (x1 - x0) >= 60:
                boxes.append([int(x0), int(y0), int(x1), int(y1)])
        Image.fromarray(med).save(f"{PRIV}/real/_median_{fam}.png")
        for i, im in enumerate(ims):
            im.save(f"{PRIV}/real/{fam}_{i:03d}.png")
        meta[fam] = {"n": len(ims), "boxes": boxes}
        print(fam, "certs", len(ims), "variable boxes", len(boxes))
    json.dump(meta, open(f"{PRIV}/real/meta.json", "w"))

if __name__ == "__main__":
    main()
