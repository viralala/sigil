"""Synthetic dataset for the Sigil tamper classifier.

Writes images + manifest.csv to PRIV (outside the repo, because the real
certificate renders contain real names). This script itself holds no names:
fictional names are assembled from invented syllables.

Genuine and tampered images go through the SAME degradation sampler
(JPEG, screenshot, re-photo, blur, rotation, glare) so that "looks degraded"
is not a cue for "fake".

Splits (decided per TEMPLATE, never per image):
  train      30 fictional templates + real CESAC participation family
  val        10 fictional templates (model selection + calibration)
  test_tpl   10 fictional templates + real CESAC winner family (unseen templates)
  test_fam   'dark' fictional family (8 templates) + real CESAC organiser family
             (whole families never seen in training or validation)

Usage: python gen_dataset.py [--quick]
"""
import csv, hashlib, io, json, math, os, sys, time
from multiprocessing import Pool

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

PRIV = os.environ.get("SIGIL_PRIV", r"D:\Study FY\sigil-private\ml-tamper")
FD = r"C:\Windows\Fonts"
CERTS_PER_TEMPLATE = 12
QUICK = "--quick" in sys.argv

SERIF = ["georgia.ttf", "georgiab.ttf", "times.ttf", "timesbd.ttf", "pala.ttf", "palab.ttf", "BOOKOS.TTF",
         "BKANT.TTF", "GARA.TTF", "BASKVILL.TTF", "CENTURY.TTF", "constan.ttf", "sylfaen.ttf", "PER_____.TTF",
         "GOUDOS.TTF", "cambriaz.ttf", "SCHLBKB.TTF", "ANTQUAB.TTF"]
SANS = ["arial.ttf", "arialbd.ttf", "calibri.ttf", "calibrib.ttf", "segoeui.ttf", "segoeuib.ttf", "tahoma.ttf",
        "verdana.ttf", "trebuc.ttf", "corbel.ttf", "Candara.ttf", "GIL_____.TTF", "bahnschrift.ttf", "FRAHV.TTF",
        "ERASMD.TTF", "GOTHIC.TTF", "LSANS.TTF", "comic.ttf"]
SCRIPT = ["FREESCPT.TTF", "FRSCRIPT.TTF", "MTCORSVA.TTF", "PALSCRI.TTF", "SCRIPTBL.TTF", "LCALLIG.TTF",
          "ITCEDSCR.TTF", "Gabriola.ttf", "segoesc.ttf", "VIVALDII.TTF", "MATURASC.TTF", "PRISTINA.TTF"]
DISPLAY = ["ALGER.TTF", "OLDENGL.TTF", "COPRGTB.TTF", "FELIXTI.TTF", "BERNHC.TTF", "ROCKB.TTF", "CASTELAR.TTF",
           "ITCBLKAD.TTF", "TCB_____.TTF", "impact.ttf", "BAUHS93.TTF", "ERASBD.TTF"]
ALLF = SERIF + SANS + SCRIPT + DISPLAY
FONT_CLASS = {f: c for c, l in (("serif", SERIF), ("sans", SANS), ("script", SCRIPT), ("display", DISPLAY)) for f in l}

_fc = {}
def font(name, size):
    k = (name, int(size))
    if k not in _fc:
        _fc[k] = ImageFont.truetype(os.path.join(FD, name), int(size))
    return _fc[k]

# ---------------------------------------------------------------- invented content
S1 = ["Ar", "Be", "Cha", "Di", "Ei", "Fa", "Gau", "Ha", "Ish", "Ja", "Ka", "La", "Ma", "Na", "Om", "Pri", "Ra", "Sa",
      "Ta", "Uma", "Va", "Wi", "Ya", "Zo", "Dev", "Mi", "Ro", "Su", "Len", "Tov"]
S2 = ["ran", "vin", "ya", "ta", "ni", "ka", "dra", "la", "mit", "rav", "sha", "net", "ria", "sen", "ol", "bir", "dan"]
SUR = ["Vale", "Merrin", "Kordan", "Trelle", "Belcourt", "Ostrum", "Halden", "Quill", "Rothen", "Lundqvist", "Pellam",
       "Arden", "Fennick", "Moorwood", "Wickham", "Tamsin", "Olver", "Dunmore"]
COURSES = ["Applied Data Analysis", "Introduction to Robotics", "Advanced Fluid Mechanics", "Digital Marketing",
           "Organic Chemistry II", "Embedded Systems Lab", "Creative Writing Workshop", "Financial Accounting",
           "Network Security Basics", "Urban Design Studio", "Machine Vision", "Environmental Science"]
GRADES = ["A+", "A", "B+", "B", "C", "O", "Distinction", "First Class", "Merit", "Pass", "92%", "88%", "76%", "64%", "9.1 CGPA"]
ISSUERS = ["Northfield Institute of Sample Studies", "Brindle Academy (Sample)", "Kestrel Learning Hub", "Aurelian College of Arts",
           "Meridian Technical University", "Lakeside Skills Council", "Orion Open Institute", "Fernhill School of Design"]
SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Computing", "English", "Statistics", "Economics", "Design", "Ethics", "Biology"]

def fake_name(rng):
    n = S1[rng.integers(len(S1))] + S2[rng.integers(len(S2))]
    if rng.random() < .3:
        n += S2[rng.integers(len(S2))]
    return n.capitalize() + " " + SUR[rng.integers(len(SUR))]

def fake_date(rng):
    return f"{int(rng.integers(1, 28)):02d} {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][int(rng.integers(12))]} {int(rng.integers(2018, 2027))}"

def fake_id(rng):
    return f"SMP-{int(rng.integers(2018, 2027))}-{int(rng.integers(10000, 99999))}"

def fake_content(rng):
    return {"name": fake_name(rng), "course": COURSES[rng.integers(len(COURSES))], "grade": GRADES[rng.integers(len(GRADES))],
            "date": fake_date(rng), "id": fake_id(rng), "marks": [int(rng.integers(35, 99)) for _ in range(8)]}

# ---------------------------------------------------------------- text + shapes
def text_mask(text, fname, size, aa):
    f = font(fname, round(size * aa))
    l, t, r, b = f.getbbox(text, anchor="ls")
    pad = 4 * aa
    w, h = int(r - l + 2 * pad), int(b - t + 2 * pad)
    m = Image.new("L", (max(w, 1), max(h, 1)), 0)
    ImageDraw.Draw(m).text((-l + pad, -t + pad), text, font=f, fill=255, anchor="ls")
    adv = f.getlength(text) / aa
    off = ((l - pad) / aa, (t - pad) / aa)
    if aa > 1:
        m = m.resize((max(1, round(w / aa)), max(1, round(h / aa))), Image.LANCZOS)
    return m, off, adv

def put_text(img, text, x, y, fname, size, color, align="c", aa=1, jitter=(0, 0)):
    m, off, adv = text_mask(text, fname, size, aa)
    x0 = x - adv * {"l": 0, "c": .5, "r": 1}[align] + jitter[0]
    px, py = int(round(x0 + off[0])), int(round(y + off[1] + jitter[1]))
    img.paste(Image.new("RGB", m.size, tuple(int(c) for c in color)), (px, py), m)
    bb = m.getbbox() or (0, 0, 1, 1)
    return [px + bb[0] - 3, py + bb[1] - 3, px + bb[2] + 3, py + bb[3] + 3]

def draw_seal(img, cx, cy, r, color, rng, alpha=1.0):
    ov = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    c = tuple(int(v) for v in color) + (int(255 * alpha),)
    n = int(rng.integers(14, 28))
    pts = [(cx + (r * (1 if i % 2 == 0 else .9)) * math.cos(2 * math.pi * i / (2 * n)),
            cy + (r * (1 if i % 2 == 0 else .9)) * math.sin(2 * math.pi * i / (2 * n))) for i in range(2 * n)]
    d.polygon(pts, fill=c)
    d.ellipse([cx - r * .78, cy - r * .78, cx + r * .78, cy + r * .78], outline=(255, 255, 255, 200), width=max(2, int(r * .04)))
    d.ellipse([cx - r * .55, cy - r * .55, cx + r * .55, cy + r * .55], outline=(255, 255, 255, 160), width=max(1, int(r * .03)))
    k = int(rng.integers(5, 9))
    star = [(cx + (r * .42 if i % 2 == 0 else r * .18) * math.cos(math.pi * i / k - math.pi / 2),
             cy + (r * .42 if i % 2 == 0 else r * .18) * math.sin(math.pi * i / k - math.pi / 2)) for i in range(2 * k)]
    d.polygon(star, fill=(255, 255, 255, 220))
    out = Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB")
    img.paste(out)

def draw_signature(img, x, y, w, color, rng):
    s = 3
    ov = Image.new("L", (int(w * s), int(w * .35 * s)), 0)
    d = ImageDraw.Draw(ov)
    pts = []
    n = int(rng.integers(6, 11))
    for i in range(n):
        pts.append((i / (n - 1) * ov.size[0] * .9 + ov.size[0] * .05, ov.size[1] * (.5 + (rng.random() - .5) * .8)))
    for i in range(len(pts) - 1):
        for t in np.linspace(0, 1, 18):
            a, b = pts[i], pts[i + 1]
            px = a[0] + (b[0] - a[0]) * t
            py = a[1] + (b[1] - a[1]) * t + math.sin(t * math.pi) * ov.size[1] * .15 * (1 if i % 2 else -1)
            rr = s * (1.2 + .8 * math.sin(t * 3 + i))
            d.ellipse([px - rr, py - rr, px + rr, py + rr], fill=255)
    ov = ov.resize((int(w), int(w * .35)), Image.LANCZOS)
    img.paste(Image.new("RGB", ov.size, tuple(int(c) for c in color)), (int(x), int(y)), ov)

def draw_qr(img, x, y, size, rng, fg=(20, 20, 20), bg=(255, 255, 255)):
    n = 25
    cell = max(2, size // n)
    d = ImageDraw.Draw(img)
    d.rectangle([x - 6, y - 6, x + cell * n + 6, y + cell * n + 6], fill=bg)
    for i in range(n):
        for j in range(n):
            finder = (i < 7 and j < 7) or (i < 7 and j >= n - 7) or (i >= n - 7 and j < 7)
            on = (i in (0, 6) or j in (0, 6) or (2 <= i <= 4 and 2 <= j <= 4)) if finder and i < 7 and j < 7 else rng.random() < .5
            if finder and not (i < 7 and j < 7):
                ii, jj = i % 7 if i < 7 else i - (n - 7), j % 7 if j < 7 else j - (n - 7)
                on = ii in (0, 6) or jj in (0, 6) or (2 <= ii <= 4 and 2 <= jj <= 4)
            if on:
                d.rectangle([x + j * cell, y + i * cell, x + (j + 1) * cell - 1, y + (i + 1) * cell - 1], fill=fg)

# ---------------------------------------------------------------- backgrounds
def noise_field(rng, h, w, scale):
    small = rng.standard_normal((max(2, h // scale), max(2, w // scale))).astype(np.float32)
    return cv2.resize(small, (w, h), interpolation=cv2.INTER_CUBIC)

def make_bg(kind, W, H, pal, seed):
    rng = np.random.default_rng(seed)
    base = np.array(pal["bg"], np.float32)
    if kind == "paper":
        a = np.tile(base, (H, W, 1))
        a += noise_field(rng, H, W, 90)[..., None] * 5 + cv2.GaussianBlur(rng.standard_normal((H, W)).astype(np.float32), (0, 0), 0.8)[..., None] * 5
        yy, xx = np.mgrid[0:H, 0:W]
        v = ((xx / W - .5) ** 2 + (yy / H - .5) ** 2)[..., None]
        a -= v * 40
    elif kind == "flat":
        a = np.tile(base, (H, W, 1)) + rng.standard_normal((H, W, 1)).astype(np.float32) * float(rng.choice([0, .8, 1.5]))
    elif kind == "gradient":
        c2 = np.array(pal["bg2"], np.float32)
        yy, xx = np.mgrid[0:H, 0:W]
        t = np.clip(np.sqrt(((xx / W - .5) * 1.2) ** 2 + ((yy / H - .45)) ** 2) * 1.6, 0, 1)[..., None]
        a = base * (1 - t) + c2 * t + rng.standard_normal((H, W, 1)).astype(np.float32) * 1.6
    elif kind == "geom":
        im = Image.new("RGBA", (W, H), tuple(int(v) for v in base) + (255,))
        d = ImageDraw.Draw(im, "RGBA")
        for _ in range(int(rng.integers(12, 26))):
            col = tuple(int(v) for v in np.clip(np.array(pal["accent"]) * rng.uniform(.6, 1.4) + rng.uniform(40, 120), 0, 255)) + (int(rng.integers(30, 90)),)
            cx, cy, r = rng.integers(0, W), rng.integers(0, H), rng.integers(40, 280)
            k = int(rng.integers(0, 3))
            if k == 0:
                d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)
            elif k == 1:
                d.polygon([(cx, cy - r), (cx - r, cy + r), (cx + r, cy + r)], fill=col)
            else:
                d.rectangle([cx - r, cy - r // 2, cx + r, cy + r // 2], fill=col)
        a = np.asarray(im.convert("RGB"), np.float32) + rng.standard_normal((H, W, 1)).astype(np.float32) * 1.0
    else:  # plasma / photo-like
        c2 = np.array(pal["bg2"], np.float32)
        f = sum(noise_field(rng, H, W, s) * w for s, w in ((300, 1.0), (120, .6), (40, .3), (12, .12)))
        f = (f - f.min()) / (f.max() - f.min() + 1e-6)
        a = base * (1 - f[..., None]) + c2 * f[..., None]
        a += cv2.GaussianBlur(rng.standard_normal((H, W)).astype(np.float32), (0, 0), 0.6)[..., None] * 3
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

# ---------------------------------------------------------------- templates
FAMILIES = ["classic", "modern", "marksheet", "geom", "photo", "dark"]
HELD_FAMILY = "dark"

def hsv(h, s, v):
    r = cv2.cvtColor(np.uint8([[[int(h * 179) % 180, int(s * 255), int(v * 255)]]]), cv2.COLOR_HSV2RGB)[0, 0]
    return tuple(int(x) for x in r)

class Template:
    def __init__(self, family, variant):
        self.family, self.variant = family, variant
        self.id = f"{family}{variant:02d}"
        r = np.random.default_rng(int(hashlib.sha1(self.id.encode()).hexdigest()[:8], 16))
        self.rng = r
        h = r.random()
        dark = family == "dark"
        if dark:
            self.pal = {"bg": hsv(h, .6, .18), "bg2": hsv(h, .5, .06), "fg": hsv(.12, .25, .95), "accent": hsv(.12, .7, .85), "muted": hsv(.12, .15, .7)}
        elif family == "photo":
            self.pal = {"bg": hsv(h, .5, .45), "bg2": hsv((h + .12) % 1, .45, .85), "fg": hsv(h, .5, .15), "accent": hsv(h, .7, .6), "muted": hsv(h, .3, .35)}
        elif family == "geom":
            self.pal = {"bg": hsv(h, .12, .97), "bg2": hsv(h, .1, .95), "fg": hsv(h, .6, .22), "accent": hsv((h + .08) % 1, .6, .75), "muted": hsv(h, .3, .4)}
        else:
            self.pal = {"bg": hsv(.1 + r.random() * .05, r.random() * .12, .93 + r.random() * .06), "bg2": hsv(h, .1, .9),
                        "fg": hsv(h, .5, .18 + r.random() * .15), "accent": hsv((h + r.random() * .3) % 1, .55 + r.random() * .35, .55 + r.random() * .25),
                        "muted": hsv(h, .2, .4)}
        self.bg_kind = {"classic": "paper", "modern": r.choice(["flat", "paper"]), "marksheet": r.choice(["flat", "paper"]),
                        "geom": "geom", "photo": "plasma", "dark": "gradient"}[family]
        W, H = [(1600, 1131), (1600, 1067), (1600, 1200), (1131, 1600), (1500, 1060)][int(r.choice([0, 1, 2, 4, 0, 1, 3 if family == "marksheet" else 0]))]
        self.W, self.H = W, H
        self.aa = int(r.choice([1, 2]))
        self.title_font = str(r.choice(SERIF + DISPLAY if family in ("classic", "dark") else SANS + SERIF))
        self.name_font = str(r.choice(SCRIPT + SERIF) if family != "modern" and family != "marksheet" else r.choice(SANS + SERIF))
        self.body_font = str(r.choice(SERIF + SANS))
        self.small_font = str(r.choice(SANS + SERIF))
        self.title = str(r.choice(["CERTIFICATE", "Certificate", "DIPLOMA", "CERTIFICATE", "Award"]))
        self.subtitle = str(r.choice(["of Achievement", "of Completion", "of Excellence", "of Participation", "OF MERIT"]))
        self.issuer = ISSUERS[int(r.integers(len(ISSUERS)))]
        self.signers = [fake_name(r), fake_name(r)]
        self.border = int(r.integers(0, 3))
        self.sig_seed = int(r.integers(1 << 30))
        self.nrows = int(r.integers(5, 9))
        self.subjects = [SUBJECTS[i] for i in r.permutation(len(SUBJECTS))[:self.nrows]]
        self.badge = bool(r.integers(0, 2))
        self.qr = bool(r.integers(0, 2))
        self.name_scale = float(r.uniform(.8, 1.15))

    def render(self, cseed, content, text=True):
        """Return (image, spans). text=False omits all variable text (exact clean background)."""
        W, H, p = self.W, self.H, self.pal
        img = make_bg(self.bg_kind, W, H, p, cseed)
        d = ImageDraw.Draw(img)
        spans = []
        aa = self.aa
        sr = np.random.default_rng(self.sig_seed)

        def T(txt, x, y, fname, size, col, align="c", kind=None):
            if kind is not None and not text:
                return
            bb = put_text(img, txt, x, y, fname, size, col, align, aa)
            if kind is not None:
                spans.append({"kind": kind, "text": txt, "fname": fname, "size": size, "color": list(col), "align": align,
                              "x": x, "y": y, "aa": aa, "bbox": bb})
        acc, fg, mu = p["accent"], p["fg"], p["muted"]
        fam = self.family
        if fam in ("classic", "geom", "photo", "dark"):
            if fam == "photo" or fam == "geom":
                ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
                pr = ImageDraw.Draw(ov)
                col = (255, 255, 255, 215) if fam == "photo" else (255, 255, 255, 170)
                pr.rounded_rectangle([W * .07, H * .08, W * .93, H * .92], radius=int(H * .03), fill=col)
                img.paste(Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB"))
                d = ImageDraw.Draw(img)
            bw = [0, 8, 14][self.border]
            if fam in ("classic", "dark") or self.border:
                m = int(W * .025)
                d.rectangle([m, m, W - m, H - m], outline=acc, width=max(2, bw))
                d.rectangle([m * 2, m * 2, W - m * 2, H - m * 2], outline=acc, width=2)
                for cx, cy in ((m * 2, m * 2), (W - m * 2, m * 2), (m * 2, H - m * 2), (W - m * 2, H - m * 2)):
                    d.rectangle([cx - 7, cy - 7, cx + 7, cy + 7], fill=acc)
            T(self.issuer.upper(), W / 2, H * .13, self.small_font, H * .021, mu)
            T(self.title, W / 2, H * .26, self.title_font, H * .09, fg if fam != "dark" else acc)
            T(self.subtitle, W / 2, H * .33, self.body_font, H * .035, mu)
            T("This is proudly presented to", W / 2, H * .41, self.small_font, H * .024, mu)
            T(content["name"], W / 2, H * .51, self.name_font, H * .08 * self.name_scale, fg, kind="name")
            d.line([W * .3, H * .535, W * .7, H * .535], fill=acc, width=2)
            T("for successfully completing", W / 2, H * .6, self.small_font, H * .024, mu)
            T(content["course"], W / 2, H * .655, self.body_font, H * .04, fg, kind="course")
            T("Grade: " + content["grade"], W / 2, H * .715, self.body_font, H * .03, fg, kind="grade")
            T(content["date"], W * .2, H * .86, self.small_font, H * .024, fg, kind="date")
            T(content["id"], W * .8, H * .93, self.small_font, H * .02, mu, kind="id")
            draw_signature(img, W * .12, H * .78, W * .16, fg, sr)
            d.line([W * .1, H * .835, W * .32, H * .835], fill=fg, width=2)
            T(self.signers[0], W * .21, H * .865 + H * .03, self.small_font, H * .019, mu)
            draw_signature(img, W * .68, H * .78, W * .16, fg, sr)
            d.line([W * .66, H * .835, W * .88, H * .835], fill=fg, width=2)
            T(self.signers[1], W * .77, H * .865 + H * .03, self.small_font, H * .019, mu)
            draw_seal(img, W * .5, H * .83, H * .075, acc, sr)
            if self.qr:
                draw_qr(img, int(W * .84), int(H * .1), int(H * .1), sr)
        elif fam == "modern":
            bw = int(W * .17)
            d.rectangle([0, 0, bw, H], fill=acc)
            d.polygon([(bw, 0), (bw + W * .05, 0), (bw, H * .3)], fill=acc)
            d.ellipse([bw * .2, H * .06, bw * .8, H * .06 + bw * .6], outline=(255, 255, 255), width=5)
            x0 = bw + W * .07
            T(self.issuer.upper(), x0, H * .1, self.small_font, H * .021, mu, "l")
            T(self.title, x0, H * .24, self.title_font, H * .085, fg, "l")
            T(self.subtitle, x0, H * .31, self.body_font, H * .035, acc, "l")
            T("Awarded to", x0, H * .43, self.small_font, H * .024, mu, "l")
            T(content["name"], x0, H * .52, self.name_font, H * .075 * self.name_scale, fg, "l", kind="name")
            d.rectangle([x0, H * .55, x0 + W * .1, H * .555], fill=acc)
            T(content["course"], x0, H * .64, self.body_font, H * .037, fg, "l", kind="course")
            T(content["date"], x0, H * .78, self.small_font, H * .025, fg, "l", kind="date")
            T(content["id"], x0, H * .84, self.small_font, H * .02, mu, "l", kind="id")
            if self.badge:
                cx, cy, r = W * .82, H * .62, H * .1
                d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=acc)
                T(content["grade"], cx, cy + r * .2, self.title_font, r * .6, (255, 255, 255), kind="grade")
            else:
                T("Grade: " + content["grade"], x0, H * .71, self.body_font, H * .03, fg, "l", kind="grade")
            draw_signature(img, W * .62, H * .8, W * .16, fg, sr)
            d.line([W * .6, H * .855, W * .82, H * .855], fill=fg, width=2)
            T(self.signers[0], W * .71, H * .9, self.small_font, H * .019, mu)
            draw_seal(img, W * .88, H * .86, H * .06, acc, sr)
        else:  # marksheet
            d.rectangle([W * .04, H * .03, W * .96, H * .97], outline=fg, width=2)
            T(self.issuer.upper(), W / 2, H * .09, self.title_font, H * .04, fg)
            T("STATEMENT OF MARKS", W / 2, H * .14, self.small_font, H * .026, acc)
            T("Name:", W * .08, H * .22, self.small_font, H * .024, mu, "l")
            T(content["name"], W * .17, H * .22, self.body_font, H * .028 * self.name_scale, fg, "l", kind="name")
            T("Roll No:", W * .62, H * .22, self.small_font, H * .024, mu, "l")
            T(content["id"], W * .72, H * .22, self.body_font, H * .024, fg, "l", kind="id")
            ty, rh = H * .29, H * (.5 / (self.nrows + 2))
            cols = [W * .08, W * .55, W * .7, W * .85]
            d.rectangle([W * .07, ty - rh * .7, W * .93, ty + rh * .35], fill=acc)
            for cx, hd in zip(cols, ("Subject", "Max", "Obtained", "Grade")):
                T(hd, cx, ty, self.small_font, H * .022, (255, 255, 255), "l")
            for i, sname in enumerate(self.subjects):
                y = ty + rh * (i + 1.4)
                d.line([W * .07, y + rh * .3, W * .93, y + rh * .3], fill=mu, width=1)
                T(sname, cols[0], y, self.body_font, H * .022, fg, "l")
                T("100", cols[1], y, self.body_font, H * .022, fg, "l")
                mk = content["marks"][i]
                T(str(mk), cols[2], y, self.body_font, H * .022, fg, "l", kind="grade")
                T("ABCDF"[0 if mk >= 80 else 1 if mk >= 65 else 2 if mk >= 50 else 3] + "", cols[3], y, self.body_font, H * .022, fg, "l", kind="grade")
            T("Issued: " + content["date"], W * .08, H * .9, self.small_font, H * .022, fg, "l", kind="date")
            draw_seal(img, W * .55, H * .89, H * .055, acc, sr)
            draw_signature(img, W * .72, H * .86, W * .16, fg, sr)
            d.line([W * .7, H * .915, W * .9, H * .915], fill=fg, width=2)
            T(self.signers[0], W * .8, H * .945, self.small_font, H * .018, mu)
        return img, spans

# ---------------------------------------------------------------- real bases
REAL_META = None
def real_meta():
    global REAL_META
    if REAL_META is None:
        REAL_META = json.load(open(f"{PRIV}/real/meta.json"))
    return REAL_META

def auto_boxes(arr):
    H, W = arr.shape[:2]
    g = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
    bl = cv2.medianBlur(g, 31)
    ink = (np.abs(g.astype(int) - bl.astype(int)) > 40).astype(np.uint8)
    ink = cv2.morphologyEx(ink, cv2.MORPH_CLOSE, np.ones((9, 41), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(ink)
    out = []
    for x, y, w, h, a in st[1:]:
        if 22 <= h <= 90 and w >= 120 and w / h >= 3 and .3 * H < y < .9 * H:
            out.append([int(x) - 6, int(y) - 6, int(x + w) + 6, int(y + h) + 6])
    return out

def load_real(fam, idx):
    img = Image.open(f"{PRIV}/real/{fam}_{idx:03d}.png").convert("RGB")
    arr = np.asarray(img)
    meta = real_meta()[fam]
    spans = []
    med = None
    if fam in ("cesac_part", "cesac_org"):
        med = Image.open(f"{PRIV}/real/_median_{fam}.png").convert("RGB")
        names = [b for b in meta["boxes"] if (b[2] - b[0]) > 1.8 * (b[3] - b[1])]
        for k, b in enumerate(names):
            spans.append({"kind": "name" if k == 0 else "name", "bbox": b, "real": True})
    else:
        for b in auto_boxes(arr):
            spans.append({"kind": "name", "bbox": b, "real": True})
    return img, spans, med

# ---------------------------------------------------------------- attacks
def jpeg_rt(img, q, sub=2):
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=int(q), subsampling=sub)
    return Image.open(io.BytesIO(buf.getvalue())).convert("RGB")

def feather_mask(w, h, edge, rng):
    m = np.zeros((h, w), np.float32)
    e = min(edge, w // 3, h // 3)
    m[e:h - e, e:w - e] = 1
    m = cv2.GaussianBlur(m, (0, 0), max(.5, e / 2))
    return Image.fromarray((np.clip(m, 0, 1) * 255).astype(np.uint8))

def interp_fill(img, box):
    a = np.asarray(img).astype(np.float32).copy()
    x0, y0, x1, y1 = [int(v) for v in box]
    H, W = a.shape[:2]
    y0, y1, x0, x1 = max(2, y0), min(H - 3, y1), max(0, x0), min(W, x1)
    top = a[y0 - 2:y0, x0:x1].mean(0)
    bot = a[y1:y1 + 2, x0:x1].mean(0)
    t = np.linspace(0, 1, y1 - y0)[:, None, None]
    a[y0:y1, x0:x1] = top[None] * (1 - t) + bot[None] * t
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

def new_text_for(kind, rng, old):
    if kind == "name":
        return fake_name(rng)
    if kind == "grade":
        pool = GRADES if not old.isdigit() else [str(int(rng.integers(35, 99)))]
        pool = [g for g in pool if g != old] or ["A"]
        return pool[int(rng.integers(len(pool)))]
    if kind == "date":
        return fake_date(rng)
    if kind == "id":
        return fake_id(rng)
    return COURSES[int(rng.integers(len(COURSES)))]

def attack_text_replace(ctx, rng, matched, fill):
    img = ctx["img"].copy()
    spans = ctx["spans"]
    if not spans:
        return None
    tgt = [s for s in spans if s["kind"] in ("name", "grade", "date", "id")] or spans
    s = tgt[int(rng.integers(len(tgt)))]
    x0, y0, x1, y1 = s["bbox"]
    pad = 3
    box = [x0 - pad, y0 - pad, x1 + pad, y1 + pad]
    if s.get("real"):
        if fill == "exact" and ctx.get("median") is not None:
            img.paste(ctx["median"].crop(box), (box[0], box[1]))
        else:
            img = interp_fill(img, box)
        arr_o = np.asarray(ctx["img"].crop(box), np.float32)
        lum = arr_o.mean(2)
        thr = np.percentile(lum, 8)
        col = arr_o[lum <= thr].mean(0) if (lum <= thr).any() else np.array([30, 30, 40])
        ink_h = (y1 - y0) - 6
        fname = ALLF[int(rng.integers(len(ALLF)))]
        size = ink_h / .78
        text = fake_name(rng)
        for _ in range(8):
            m, off, adv = text_mask(text, fname, size, 2)
            if adv <= (x1 - x0) * 1.02:
                break
            size *= .88
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        put_text(img, text, cx, cy + size * .3, fname, size, col, "c", 2, (float(rng.uniform(-1.5, 1.5)), float(rng.uniform(-1, 1))))
        return img, "text_replace_mismatched" if True else ""
    # fictional: we know the template, fonts, colours
    if fill == "exact" and ctx.get("clean") is not None:
        img.paste(ctx["clean"].crop(box), (box[0], box[1]))
    else:
        img = interp_fill(img, box)
    text = new_text_for(s["kind"], rng, s["text"].replace("Grade: ", ""))
    if s["text"].startswith("Grade: "):
        text = "Grade: " + text
    if matched:
        fname, size, col, aa = s["fname"], s["size"], np.array(s["color"]) + rng.integers(-3, 4, 3), 3 - s["aa"]
        jit = (float(rng.uniform(-1.2, 1.2)), float(rng.uniform(-1, 1)))
        tag = "text_replace_matched"
    else:
        cl = FONT_CLASS.get(s["fname"], "sans")
        pool = [f for f in ALLF if f != s["fname"] and (FONT_CLASS[f] != cl or rng.random() < .3)]
        fname = pool[int(rng.integers(len(pool)))]
        size = s["size"] * float(rng.uniform(.85, 1.15))
        col = np.array(s["color"]) + rng.integers(-18, 19, 3)
        aa, jit = int(rng.choice([1, 2])), (0, 0)
        tag = "text_replace_mismatched"
    put_text(img, text, s["x"], s["y"], fname, size, np.clip(col, 0, 255), s["align"], aa, jit)
    return img, tag

def attack_splice(ctx, rng):
    donor = ctx["donor"]
    if donor is None:
        return None
    img = ctx["img"].copy()
    tsp = [s for s in ctx["spans"] if s["kind"] in ("name", "grade", "date", "id")] or ctx["spans"]
    dsp = [s for s in donor["spans"] if s["kind"] in ("name", "grade", "date", "id")] or donor["spans"]
    if not tsp or not dsp:
        return None
    t = tsp[int(rng.integers(len(tsp)))]
    same = [s for s in dsp if s["kind"] == t["kind"]]
    d = (same or dsp)[int(rng.integers(len(same or dsp)))]
    tb, db = t["bbox"], d["bbox"]
    patch = donor["img"].crop(db)
    k = float(rng.uniform(.92, 1.08))
    tw, th = tb[2] - tb[0], tb[3] - tb[1]
    scale = min(tw / patch.size[0], th / patch.size[1]) * k if rng.random() < .6 else k
    patch = patch.resize((max(8, int(patch.size[0] * scale)), max(8, int(patch.size[1] * scale))), Image.BICUBIC)
    # blank the old text region first (cheap fill), then paste the donor patch
    img = interp_fill(img, [tb[0] - 2, tb[1] - 2, tb[2] + 2, tb[3] + 2])
    cx, cy = (tb[0] + tb[2]) // 2, (tb[1] + tb[3]) // 2
    pos = (cx - patch.size[0] // 2, cy - patch.size[1] // 2)
    edge = int(rng.choice([0, 0, 2, 4]))
    img.paste(patch, pos, feather_mask(patch.size[0], patch.size[1], edge, rng) if edge else None)
    return img, "splice"

def attack_copy_move(ctx, rng):
    img = ctx["img"].copy()
    W, H = img.size
    a = np.asarray(img.convert("L"), np.float32)
    for _ in range(40):
        w, h = int(rng.integers(90, 320)), int(rng.integers(40, 160))
        x, y = int(rng.integers(0, W - w)), int(rng.integers(0, H - h))
        if a[y:y + h, x:x + w].std() > 18:
            break
    for _ in range(40):
        x2, y2 = int(rng.integers(0, W - w)), int(rng.integers(0, H - h))
        if abs(x2 - x) > w or abs(y2 - y) > h:
            break
    patch = img.crop((x, y, x + w, y + h))
    if rng.random() < .3:
        s = float(rng.uniform(.9, 1.1))
        patch = patch.resize((max(8, int(w * s)), max(8, int(h * s))), Image.BICUBIC)
    edge = int(rng.choice([0, 3]))
    img.paste(patch, (x2, y2), feather_mask(patch.size[0], patch.size[1], edge, rng) if edge else None)
    return img, "copy_move"

def attack_seal_paste(ctx, rng):
    img = ctx["img"].copy()
    W, H = img.size
    r = float(rng.uniform(.04, .08)) * H
    x, y = float(rng.uniform(r, W - r)), float(rng.uniform(.4 * H, H - r))
    col = hsv(float(rng.random()), float(rng.uniform(.5, .9)), float(rng.uniform(.4, .8)))
    if rng.random() < .55:
        draw_seal(img, x, y, r, col, rng, float(rng.uniform(.55, 1)))
    else:
        draw_signature(img, x - r, y - r * .35, r * 2.4, (25, 30, 70), rng)
    return img, "seal_paste"

def attack_recompress(ctx, rng):
    q1 = int(rng.integers(55, 90))
    base = jpeg_rt(ctx["img"], q1, int(rng.choice([0, 2])))
    ctx2 = dict(ctx, img=base)
    r = attack_text_replace(ctx2, rng, False, "interp") if rng.random() < .6 else attack_splice(ctx2, rng)
    if r is None:
        r = attack_copy_move(ctx2, rng)
    img = r[0]
    delta = int(rng.integers(8, 25)) * (1 if rng.random() < .5 else -1)
    q2 = int(np.clip(q1 + delta, 45, 97))
    return img, "recompress_edit", q2

# ---------------------------------------------------------------- degradations (shared by both classes)
def glare(arr, rng):
    H, W = arr.shape[:2]
    cx, cy = rng.uniform(.1, .9) * W, rng.uniform(.1, .9) * H
    sx, sy = rng.uniform(.08, .35) * W, rng.uniform(.08, .35) * H
    yy, xx = np.mgrid[0:H, 0:W]
    g = np.exp(-(((xx - cx) / sx) ** 2 + ((yy - cy) / sy) ** 2))[..., None] * rng.uniform(.25, .7)
    return arr + g * (np.array([255, 252, 240], np.float32) - arr)

def rotate(arr, deg):
    H, W = arr.shape[:2]
    M = cv2.getRotationMatrix2D((W / 2, H / 2), deg, 1.0)
    return cv2.warpAffine(arr, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

def perspective(arr, mag, rng):
    H, W = arr.shape[:2]
    src = np.float32([[0, 0], [W, 0], [W, H], [0, H]])
    dst = src + rng.uniform(-mag, mag, (4, 2)).astype(np.float32) * np.float32([W, H])
    return cv2.warpPerspective(arr, cv2.getPerspectiveTransform(src, dst), (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)

def degrade(img, rng, force_jpeg_q=None):
    """Same sampler for genuine and tampered. Returns (PIL image, ext, tag, quality)."""
    kinds = ["png_clean", "jpg_once", "jpg_twice", "screenshot", "photo", "blur_rot_glare"]
    tag = kinds[int(rng.choice(len(kinds), p=[.22, .2, .08, .15, .2, .15]))]
    if force_jpeg_q is not None:
        tag = "jpg_edit_final"
    a = np.asarray(img, np.float32)
    ext, q = "png", None
    if tag in ("png_clean",):
        pass
    elif tag == "jpg_once":
        ext, q = "jpg", int(rng.integers(55, 97))
    elif tag == "jpg_twice":
        a = np.asarray(jpeg_rt(img, int(rng.integers(55, 95)), int(rng.choice([0, 2]))), np.float32)
        ext, q = "jpg", int(rng.integers(55, 97))
    elif tag == "jpg_edit_final":
        ext, q = "jpg", force_jpeg_q
    elif tag == "screenshot":
        s = float(rng.uniform(.5, .95))
        a = cv2.resize(a, None, fx=s, fy=s, interpolation=cv2.INTER_AREA if rng.random() < .6 else cv2.INTER_LINEAR)
        if rng.random() < .35:
            a = cv2.resize(a, None, fx=1 / s, fy=1 / s, interpolation=cv2.INTER_CUBIC)
        ext, q = ("png", None) if rng.random() < .5 else ("jpg", int(rng.integers(75, 96)))
    elif tag == "photo":
        a = perspective(a, float(rng.uniform(.004, .02)), rng)
        a = rotate(a, float(rng.uniform(-3, 3)))
        a = a * rng.uniform(.9, 1.08, 3).astype(np.float32)
        a = 255 * (np.clip(a, 0, 255) / 255) ** float(rng.uniform(.85, 1.2))
        H, W = a.shape[:2]
        yy, xx = np.mgrid[0:H, 0:W]
        a = a * (1 - .35 * (((xx / W - .5) ** 2 + (yy / H - .5) ** 2) * 1.5))[..., None]
        a = cv2.GaussianBlur(a, (0, 0), float(rng.uniform(.5, 1.4)))
        if rng.random() < .5:
            a = glare(a, rng)
        s = float(rng.uniform(.65, 1.0))
        a = cv2.resize(a, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
        a = a + rng.standard_normal(a.shape).astype(np.float32) * float(rng.uniform(1.5, 5))
        ext, q = "jpg", int(rng.integers(50, 88))
    else:  # blur_rot_glare
        ops = rng.permutation(3)[:int(rng.integers(1, 4))]
        for o in ops:
            if o == 0:
                a = cv2.GaussianBlur(a, (0, 0), float(rng.uniform(.5, 1.8)))
            elif o == 1:
                a = rotate(a, float(rng.uniform(-4, 4)))
            else:
                a = glare(a, rng)
        ext, q = ("png", None) if rng.random() < .5 else ("jpg", int(rng.integers(70, 96)))
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)), ext, tag, q

def save(img, path_noext, ext, q, rng):
    p = f"{path_noext}.{ext}"
    if ext == "jpg":
        img.save(p, "JPEG", quality=int(q), subsampling=int(rng.choice([0, 2])))
    else:
        img.save(p, "PNG")
    return p

# ---------------------------------------------------------------- orchestration
ATTACKS_FICT = ["text_replace_matched", "text_replace_mismatched", "splice", "copy_move", "seal_paste", "recompress_edit"]
ATTACKS_REAL = ["text_replace_mismatched", "splice", "copy_move", "seal_paste", "recompress_edit"]

def seed_of(s):
    return int(hashlib.sha1(s.encode()).hexdigest()[:8], 16)

def load_base(ref):
    if ref["source"] == "real":
        img, spans, med = load_real(ref["family"], ref["idx"])
        return {"img": img, "spans": spans, "median": med, "clean": None}
    tpl = Template(ref["family"], ref["variant"])
    cs = seed_of(ref["id"])
    rng = np.random.default_rng(cs)
    content = fake_content(rng)
    img, spans = tpl.render(cs, content, True)
    clean, _ = tpl.render(cs, content, False)
    return {"img": img, "spans": spans, "median": None, "clean": clean}

def make_images(job):
    ref, donor_ref, out_dir, ai = job
    rows = []
    ctx = load_base(ref)
    ctx["donor"] = load_base(donor_ref) if donor_ref else None
    rng = np.random.default_rng(seed_of(ref["id"] + "x"))
    atts = ATTACKS_REAL if ref["source"] == "real" else ATTACKS_FICT
    plan = [("none", 0), ("none", 1), (atts[ai % len(atts)], 2), (atts[(ai + 3) % len(atts)], 3)]
    for att, k in plan:
        iid = f"{ref['id']}_{k}"
        r2 = np.random.default_rng(seed_of(iid))
        final_q, res = None, None
        for _ in range(6):  # an attack can fail to find a target; retry with another draw
            if att == "none":
                res = (ctx["img"], "none")
            elif att == "text_replace_matched":
                res = attack_text_replace(ctx, r2, True, "exact" if r2.random() < .5 else "interp")
            elif att == "text_replace_mismatched":
                res = attack_text_replace(ctx, r2, False, "exact" if r2.random() < .5 else "interp")
            elif att == "splice":
                res = attack_splice(ctx, r2)
            elif att == "copy_move":
                res = attack_copy_move(ctx, r2)
            elif att == "seal_paste":
                res = attack_seal_paste(ctx, r2)
            else:
                res = attack_recompress(ctx, r2)
            if res is not None:
                break
            att = "copy_move"
        if len(res) == 3:
            final_q = res[2]
        img, name = res[0], res[1]
        dimg, ext, tag, q = degrade(img, r2, final_q)
        save(dimg, f"{out_dir}/{iid}", ext, q, r2)
        rows.append({"id": iid, "label": 0 if name == "none" else 1, "attack": name, "base": ref["id"], "family": ref["family"],
                     "template": ref["template"], "source": ref["source"], "split": ref["split"], "degr": tag, "ext": ext,
                     "w": dimg.size[0], "h": dimg.size[1]})
    return rows

def build_refs():
    refs = []
    seen = ["classic", "modern", "marksheet", "geom", "photo"]
    for fam in FAMILIES:
        nvar = 8 if fam == HELD_FAMILY else 10
        for v in range(nvar):
            if fam == HELD_FAMILY:
                split = "test_fam"
            else:
                split = "train" if v < 6 else ("val" if v < 8 else "test_tpl")
            tid = f"{fam}{v:02d}"
            for c in range(CERTS_PER_TEMPLATE):
                refs.append({"id": f"{tid}_c{c:02d}", "source": "fict", "family": fam, "variant": v, "template": tid, "split": split})
    meta = real_meta()
    for fam, split in (("cesac_part", "train"), ("cesac_win", "test_tpl"), ("cesac_org", "test_fam")):
        for i in range(meta[fam]["n"]):
            refs.append({"id": f"{fam}_{i:03d}", "source": "real", "family": fam, "idx": i, "template": fam, "split": split})
    return refs

def main():
    t0 = time.time()
    out = f"{PRIV}/images"
    os.makedirs(out, exist_ok=True)
    refs = build_refs()
    if QUICK:
        refs = refs[::12]
    by_split = {}
    for r in refs:
        by_split.setdefault((r["split"], r["source"], r["family"] if r["source"] == "real" else "*"), []).append(r)
    jobs = []
    rr = np.random.default_rng(7)
    for i, r in enumerate(refs):
        pool = [x for x in refs if x["split"] == r["split"] and x["id"] != r["id"] and
                (x["source"] == r["source"]) and (r["source"] == "fict" or x["family"] == r["family"])]
        d = pool[int(rr.integers(len(pool)))] if pool else None
        jobs.append((r, d, out, i))
    with Pool(8) as p:
        res = p.map(make_images, jobs, chunksize=4)
    rows = [x for r in res for x in r]
    with open(f"{PRIV}/manifest.csv", "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    from collections import Counter
    print("images", len(rows), "bases", len(refs), "secs", round(time.time() - t0))
    print(Counter((r["split"], r["label"]) for r in rows))
    print(Counter(r["attack"] for r in rows))

if __name__ == "__main__":
    main()
