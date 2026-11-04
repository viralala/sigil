"""Shared helpers for the claim-kind classifier (train / leak check / profile).

Contains NO real data. The real CSV lives in D:\\Study FY\\sigil-private\\data and is read from there.
The feature analyzer here is mirrored line-for-line by packages/parser/src/features.js.
"""
import os, re, random, unicodedata
import pandas as pd

PRIVATE = os.environ.get("SIGIL_PRIVATE", r"D:\Study FY\sigil-private")
CSV = os.path.join(PRIVATE, "data", "cesac-student-records-2026-10-26.csv")
WORK = os.path.join(PRIVATE, "ml-claims")

# kind column (12 values) -> product claim kind
KIND_MAP = {
    "certification": "certificate",
    "event": "event", "workshop": "event", "competition": "event",
    "internship": "job",
    "patent": "patent",
    "journal": "publication", "conference": "publication", "book": "publication", "book_chapter": "publication",
    "extracurricular": "other", "industry_project": "other",
}
CLASSES = ["education", "job", "certificate", "skill", "publication", "patent", "award", "event", "other"]
REAL_CLASSES = ["job", "certificate", "publication", "patent", "event", "other"]

# ---------------- feature analyzer (mirror of features.js) ----------------
_URL = re.compile(r"(?:https?://|www\.)\S+")
_EMAIL = re.compile(r"[a-z0-9._%+\-]+@[a-z0-9.\-]+")
_DIG = re.compile(r"[0-9]+")
_TOK = re.compile(r"[a-z0\u0900-\u097f]+")
MAX_CHARS = 400
MAX_TOK = 40


def normalise(text: str) -> str:
    t = unicodedata.normalize("NFKC", text[:MAX_CHARS]).lower()
    t = _URL.sub(" ", t)
    t = _EMAIL.sub(" ", t)
    return _DIG.sub("0", t)


def tokens(text: str):
    return [t[:MAX_TOK] for t in _TOK.findall(normalise(text)) if len(t) >= 2 or t == "0"]


_SEP = re.compile(r"[,;|/•·]")


def shape(text: str, n_tokens: int):
    """Structure cues that the bag of words loses (skill lists, very short titles)."""
    f = []
    if len(_SEP.findall(normalise(text))) >= 2:
        f.append("s:list")
    f.append("s:n1" if n_tokens <= 1 else "s:n2" if n_tokens == 2 else "s:n5" if n_tokens <= 5 else "s:n6")
    return f


def analyzer(text: str):
    toks = tokens(text)
    feats = shape(text, len(toks))
    for t in toks:
        feats.append("w:" + t)
    for a, b in zip(toks, toks[1:]):
        feats.append("b:" + a + " " + b)
    for t in toks:
        p = " " + t + " "
        for n in (3, 4, 5):
            for i in range(len(p) - n + 1):
                feats.append("c:" + p[i:i + n])
    return feats


# ---------------- data ----------------
def load_csv():
    return pd.read_csv(CSV, encoding="utf-8", encoding_errors="replace", dtype=str)


def student_groups(d):
    """Union-find over student name, prn and email so no person spans two groups."""
    parent = {}

    def find(x):
        while parent.setdefault(x, x) != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    for i, r in enumerate(d[["student", "prn", "email"]].itertuples(index=False)):
        key = "row%d" % i
        for tag, v in zip(("n", "p", "e"), r):
            if isinstance(v, str) and v.strip():
                union(key, tag + ":" + v.strip().lower())
    roots = {}
    out = []
    for i in range(len(d)):
        out.append(roots.setdefault(find("row%d" % i), len(roots)))
    return out


def real_frame(d):
    org = d["journal_or_conference"].fillna("")
    text = (d["title"].fillna("") + " " + org).str.strip()
    return pd.DataFrame({
        "text": text, "label": d["kind"].map(KIND_MAP), "kind": d["kind"],
        "group": student_groups(d), "state": d["state"],
    })


PERSON_COLS = ["student", "email", "prn", "verified_by", "entered_by", "guide_name",
               "primary_author", "secondary_authors"]


def person_values(d):
    """Raw strings that identify people: used ONLY by train.py (to strip) and leak_check.py (to verify)."""
    vals = set()
    for c in PERSON_COLS:
        if c in d:
            for v in d[c].dropna().unique():
                v = str(v).strip()
                if v:
                    vals.add(v)
    return vals


def name_tokens(d):
    """Every alphabetic fragment of any name / email / prn value (len >= 2)."""
    toks = set()
    for v in person_values(d):
        toks.update(re.findall(r"[a-z\u0900-\u097f]+", unicodedata.normalize("NFKC", v).lower()))
    return {t for t in toks if len(t) >= 2}


# ---------------- invented synthetic data (education / skill / award / full-time job) ----------------
def _split(lst, test_mod=4):
    train = [x for i, x in enumerate(lst) if i % test_mod != test_mod - 1]
    test = [x for i, x in enumerate(lst) if i % test_mod == test_mod - 1]
    return train, test


DEGREES = ["B.Tech", "B.E.", "M.Tech", "MBA", "BSc", "MSc", "BCA", "MCA", "B.Com", "M.Com", "BBA", "B.Des", "Diploma", "Ph.D",
           "Bachelor of Technology", "Bachelor of Engineering", "Master of Science", "Master of Business Administration",
           "Bachelor of Science", "Bachelor of Computer Applications", "HSC", "SSC", "Class XII", "Class X", "12th", "10th",
           "Higher Secondary Certificate", "Secondary School Certificate", "Bachelor of Arts", "B.A.", "M.A.", "LLB", "B.Pharm",
           "Master of Technology"]
FIELDS = ["Computer Engineering", "Information Technology", "Electronics and Telecommunication", "Mechanical Engineering",
          "Civil Engineering", "Data Science", "Artificial Intelligence", "Commerce", "Science", "Physics", "Chemistry", "Mathematics",
          "Economics", "Biotechnology", "Finance", "Marketing", "Electrical Engineering", "Statistics", "Computer Science", "Arts"]
INSTS = ["Lakeview University", "Northfield Institute of Technology", "Riverbend College of Engineering", "St. Aldric's Junior College",
         "Maplewood Public School", "Greenhill Polytechnic", "Westbrook Vidyalaya", "Sunrise Academy", "Eastgate University",
         "Harborline Institute of Management", "Crestview College of Science", "Oakridge Higher Secondary School", "Pinecrest Mahavidyalaya",
         "Silverlake University", "Ridgeway Institute of Technology", "Brightfield Junior College", "Cedar Valley School",
         "Fairmount College of Commerce", "Highland University", "Stonebridge Institute", "Meadowbank College", "Ironwood School of Design"]
ROLES = ["Software Engineer", "Senior Software Engineer", "Data Analyst", "Product Manager", "Business Analyst", "Project Manager",
         "DevOps Engineer", "QA Engineer", "Backend Developer", "Frontend Developer", "Full Stack Developer", "Data Scientist",
         "Machine Learning Engineer", "Research Associate", "Associate Consultant", "Technical Lead", "Site Reliability Engineer",
         "Mechanical Design Engineer", "Marketing Executive", "Sales Manager", "HR Executive", "Graphic Designer", "UX Designer",
         "System Administrator", "Network Engineer", "Security Analyst", "Assistant Manager", "Operations Lead", "Teaching Assistant",
         "Content Writer", "Engineering Manager", "Accountant"]
COMPANIES = ["Bluepeak Technologies Pvt Ltd", "Quillon Systems", "Harbor Analytics Inc", "Northwind Labs", "Zenfold Software",
             "Corvid Solutions LLP", "Ledgerline Financial Services", "Mapleton Consulting", "Orbitwave Infotech", "Tidal Robotics",
             "Kestrel Logistics Limited", "Fernhill Health", "Paperkite Media", "Stackyard Cloud", "Brightloom Retail", "Granite Bank"]
SKILLS = ["Python", "Java", "C++", "JavaScript", "TypeScript", "SQL", "React", "Node.js", "Docker", "Kubernetes", "Git", "Linux",
          "TensorFlow", "PyTorch", "Excel", "Tableau", "Power BI", "AWS", "Azure", "Figma", "MATLAB", "Go", "Rust", "HTML", "CSS",
          "MongoDB", "PostgreSQL", "Django", "Flask", "Spring Boot", "Communication", "Teamwork", "Leadership", "Public Speaking",
          "Project Management", "Photoshop", "AutoCAD", "SolidWorks", "Embedded C", "Arduino", "Scrum", "Data Analysis",
          "Machine Learning", "Kotlin", "Swift", "PHP", "Ruby", "Scala", "R", "Pandas", "NumPy", "Scikit-learn", "OpenCV", "Keras",
          "Spark", "Hadoop", "Kafka", "Redis", "MySQL", "Oracle", "GraphQL", "REST APIs", "Jenkins", "Terraform", "Ansible", "Bash",
          "Selenium", "JUnit", "Jira", "Confluence", "Canva", "Illustrator", "Blender", "Unity", "Verilog", "VHDL", "Raspberry Pi",
          "Problem Solving", "Time Management", "Negotiation", "Critical Thinking", "Technical Writing", "Hindi", "Marathi", "English",
          "Tally", "SAP", "Salesforce", "Vue", "Angular", "Next.js", "Tailwind", "Bootstrap", "Firebase", "Supabase", "Cybersecurity",
          "Wireshark", "Nmap", "Burp Suite", "Statistics", "A/B Testing", "SEO", "Copywriting", "Video Editing"]
SKILL_LABELS = ["Skills", "Technical Skills", "Languages", "Tools", "Frameworks", "Core Competencies", "Programming", "Soft Skills",
                "Key Skills"]
CONTESTS = ["Inter-College Coding Cup", "Smart Campus Hackathon", "State Robotics Challenge", "Campus Innovation Contest",
            "Open Data Datathon", "Regional Debate League", "National Quiz Series", "Green Energy Pitch Day", "Design Sprint Finals",
            "University Chess Open", "Startup Weekend", "Cyber Defence Cup", "Maths Olympiad", "Science Fair", "Inter-School Elocution"]
SUBJECTS = ["Mathematics", "Physics", "Computer Science", "Economics", "Chemistry", "Electronics", "English Literature"]
AWARD_FORMS = ["Winner, {c}", "First Prize in {c}", "Second Prize, {c}", "Third Prize - {c}", "Runner-up at {c}", "{c} - Rank 3",
               "Top 10 Finalist, {c}", "Gold Medal in {s}", "Silver Medal in {s}", "Best Paper Award at {c}", "Best Project Award, {c}",
               "Merit Scholarship", "National Merit Scholar", "Dean's List 2023", "Employee of the Month", "Best Outgoing Student",
               "Scholarship for {s}", "University Topper in {s}", "Outstanding Performer Award", "Winner of {c}"]


def synthetic(n_per_class=600, seed=7):
    """INVENTED text only. Every lexicon is split so test strings use entries unseen in train."""
    rng = random.Random(seed)
    D = _split(DEGREES); F = _split(FIELDS); I = _split(INSTS); R = _split(ROLES); C = _split(COMPANIES)
    S = _split(SKILLS); L = _split(SKILL_LABELS, 3); K = _split(CONTESTS); J = _split(SUBJECTS, 3)

    def edu(p):
        d, f, i = rng.choice(D[p]), rng.choice(F[p]), rng.choice(I[p])
        s = rng.choice(["%s in %s, %s", "%s %s - %s", "%s, %s, %s", "%s (%s), %s"]) % (d, f, i)
        return s + rng.choice(["", "", ", CGPA 8.4", " 2019 - 2023", ", 81.5%"])

    def job(p):
        r, c = rng.choice(R[p]), rng.choice(C[p])
        s = rng.choice(["%s at %s", "%s, %s", "%s - %s", "%s | %s", "Working as %s with %s", "Full-time %s, %s"]) % (r, c)
        return s + rng.choice(["", "", " Jan 2022 - Present"])

    def skill(p):
        items = [rng.choice(S[p]) for _ in range(rng.randint(1, 7))]
        return rng.choice(["", rng.choice(L[p]) + ": ", "Proficient in "]) + rng.choice([", ", " | ", " / "]).join(items)

    def award(p):
        return rng.choice(AWARD_FORMS).format(c=rng.choice(K[p]), s=rng.choice(J[p]))

    out = {"train": [], "test": []}
    for split, p, n in (("train", 0, n_per_class), ("test", 1, n_per_class // 4)):
        for label, fn in (("education", edu), ("job", job), ("skill", skill), ("award", award)):
            seen, tries = set(), 0
            while len(seen) < n and tries < n * 20:
                seen.add(fn(p)); tries += 1
            for t in sorted(seen):
                out[split].append((t, label, "syn%s-%s-%d" % (split, label, rng.randint(0, 59))))
    return out
