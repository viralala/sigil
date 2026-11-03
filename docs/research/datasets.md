# Sigil: public datasets and models, verified evidence pack (2026-11-03)

Method: each row below was opened with WebFetch (landing page, repo, dataset card or paper abstract) on 2026-11-03. "Verified how" says what was opened. Licence text is quoted as the page states it. "not stated" means the page I opened did not state it. Direct HF API/curl calls were blocked by the proxy (403), so nothing was downloaded; no sample files were inspected. Risk: LOW = permissive and commercial-OK, MED = unclear or attribution/share-alike/mixed, HIGH = non-commercial or gated.

## A. Forgery / tamper detection

| Name | What | Size (as stated) | Licence (as stated) | URL | Verified how | Use in Sigil | Risk |
|---|---|---|---|---|---|---|---|
| DocTamper (CVPR 2023) | Tampered document images + pixel masks (LMDB) | not stated on page | "only available for non-commercial use"; licensed to universities/research institutions; application form and edu email needed | https://github.com/qcf-568/DocTamper | GitHub README | Offline benchmark only for a research demo; do not ship models trained on it | HIGH (NC, gated) |
| Find it again! (ICDAR 2023, Tornes et al.) | SROIE-based receipts, real manual forgeries with bbox annotations | 988 images, 163 forged | not stated on page | https://l3i-share.univ-lr.fr/2023Finditagain/index.html | Dataset page | Realistic forgery eval set for text-level tamper; ask authors for terms | MED/HIGH (unclear; SROIE source is research-only) |
| SIDTD | Synthetic ID/travel document forgeries (MIDV-2020 based) | counts not on abstract page | CC BY-SA 4.0 (read from licence icon only, not in text) | https://arxiv.org/abs/2401.01858 | arXiv abstract page | Template-based forgery recipe reference; share-alike if reused | MED (SA; source MIDV licence unconfirmed) |
| AIForge-Doc v2 (Scam.AI) | AI-generated (GPT-Image-2) forged receipts/forms + masks | 3,066 forged + 3,066 authentic pairs, 3.35 GB, 9 languages | "CC BY-NC-SA 4.0"; gated; source sets keep own licences (CORD CC BY 4.0, WildReceipt Apache 2.0, SROIE research use, XFUND CC BY 4.0) | https://huggingface.co/datasets/Scam-AI/AIForge-Doc-v2 | HF dataset card | Evaluates generative-AI forgeries (the modern threat) | HIGH (NC, gated) |
| grogu KYC 10k (IEEE DataPort) | Synthetic PDF payslips, bills, bank statements, income certificates; genuine vs font/pixel vs metadata tampered | 10,000 PDFs, 296.4 MB (+2.77 MB metadata.csv) | "Creative Commons Attribution (CC BY 4.0)" but needs paid IEEE DataPort subscription | https://ieee-dataport.org/documents/grogu-kyc-10000-sample-multimodal-forensic-pdf-benchmark-digital-identity-document | DataPort page | Closest in kind to PDF certificate and metadata tampering; useful only if a team member has a subscription | MED (paywalled) |
| MIDV-2020 | 1000 mock ID docs: video, scan, photo, annotations | 72,409 annotated images | not stated on arXiv page (terms live on download sites) | https://arxiv.org/abs/2107.00396 | arXiv abstract | Layout/field-recognition test for document-ID flows; not tamper | MED (unconfirmed) |

Not found as a public set: no public "diploma/certificate forgery" dataset surfaced. Roboflow Universe has small community sets (e.g. universe.roboflow.com/bnm/certificate-forgery-detection) that appeared in search only; not opened, so UNVERIFIED. Conclusion: a synthetic pipeline (section E) is justified, not optional.

## B. OCR / document understanding: datasets

| Name | What | Size | Licence | URL | Verified how | Use in Sigil | Risk |
|---|---|---|---|---|---|---|---|
| DocLayNet | Page layout, 11 classes, COCO boxes | 80,863 pages, 6 categories | HF licence field "other"; section names "CDLA-Permissive-1.0" | https://huggingface.co/datasets/ds4sd/DocLayNet | HF card | Train/eval layout segmentation (seal, signature, title regions) | LOW |
| CORD v2 | Receipt key-info extraction | 1,000 (800/100/100), 2.31 GB | "cc-by-4.0" | https://huggingface.co/datasets/naver-clova-ix/cord-v2 | HF card | Fine-tune Donut-style field extraction as a demo; schema-to-JSON pattern | LOW |
| DocVQA (lmms-lab mirror) | Document question answering | 16.6k rows (DocVQA 10.5k, InfographicVQA 6.09k) | "apache-2.0" (mirror's tag; original DocVQA terms not opened) | https://huggingface.co/datasets/lmms-lab/DocVQA | HF card | Benchmark VLM extraction | MED (mirror) |
| FUNSD (nielsr mirror) | Noisy scanned forms, words/boxes/NER tags | 199 (149 train/50 test) | not stated on page | https://huggingface.co/datasets/nielsr/funsd | HF card | Tiny form-understanding smoke test | MED |
| IIIT-INDIC-HW-WORDS | Handwritten Indic words, 8 scripts (+Devanagari, Telugu sets) | about 872K instances, 135 writers | not stated on page | https://cvit.iiit.ac.in/research/projects/cvit-projects/iiit-indic-hw-words | IIIT CVIT page | Indic handwriting eval; check README terms before use | MED |

## B. OCR / document understanding: models

| Model | Licence (as stated) | Size/version | URL | Verified how | Note | Risk |
|---|---|---|---|---|---|---|
| PaddleOCR | "Apache 2.0" | 3.7.0 (2026-06-11); PP-OCRv5 multilingual adds Devanagari, Telugu, Tamil; PaddleOCR-VL 109-111 languages incl. Bengali | https://github.com/PaddlePaddle/PaddleOCR | GitHub README | Best Indic-capable permissive pick; Hindi not named explicitly, test it | LOW |
| docTR | "Apache 2.0" | v1.1.0; language list not stated | https://github.com/mindee/doctr | GitHub README | Clean Python OCR + KIE; Latin focus | LOW |
| Tesseract | "Apache License, Version 2.0" | v5 stable, ">100 languages" (Indic not named on page) | https://github.com/tesseract-ocr/tesseract | GitHub README | Rule-based baseline; Indic traineddata exist but not confirmed here | LOW |
| Qwen2.5-VL-7B-Instruct | "apache-2.0" | 7B (card shows 8B params); Jan 2025 | https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct | HF card | Zero-shot certificate field extraction to JSON; 3B/72B licences not confirmed (72B is known to differ, UNVERIFIED) | LOW (7B) |
| Donut-base | "mit" | arch Swin + BART; size not stated | https://huggingface.co/naver-clova-ix/donut-base | HF card | OCR-free fine-tune target | LOW |
| LayoutLMv3-base | "cc-by-nc-sa-4.0" | n/a | https://huggingface.co/microsoft/layoutlmv3-base | HF card | Do not ship; use research-only or replace with permissive alternative | HIGH (NC) |
| Surya | Code "Apache 2.0"; weights "modified AI Pubs Open Rail-M", free for research, personal, startups under $5M funding/revenue | Surya 2.5, 689M VLM; 90+ languages (Bengali 55.3% on their benchmark) | https://github.com/datalab-to/surya | GitHub README | Good layout/OCR, weights restricted | MED |
| TrOCR-base-printed | not stated on page or README header (UNVERIFIED) | 0.3B, SROIE fine-tuned | https://huggingface.co/microsoft/trocr-base-printed | HF card + README | Line-level OCR only | MED (unconfirmed) |
| Florence-2-base | not stated on page (UNVERIFIED) | 0.23B | https://huggingface.co/microsoft/Florence-2-base | HF card | Small VLM with OCR task | MED (unconfirmed) |

## C. Resume / NLP datasets

| Name | What | Size | Licence | URL | Verified how | Use in Sigil | Risk |
|---|---|---|---|---|---|---|---|
| Mehyaar/Annotated_NER_PDF_Resumes | CV text with IT-skill NER spans, JSON | 5,029 CVs, 603 MB | "MIT" | https://huggingface.co/datasets/Mehyaar/Annotated_NER_PDF_Resumes | HF card | Skill-extraction NER fine-tune; provenance of CVs not stated, so check for PII | MED (MIT tag, provenance unclear) |
| O*NET 31.0 Database | Occupations, skills, tasks | many files, e.g. 305,389 rows Work Context; RDF over 1M resources; quarterly updates | "Creative Commons Attribution 4.0"; credit O*NET and U.S. DoL | https://www.onetcenter.org/database.html | O*NET page | Skill/occupation ontology for claim-consistency checks | LOW (attribution) |
| ESCO v1.2.1 (2025-12-10) | EU skills/occupations, 28 languages; RDF/CSV/JSON-LD | counts not on page | not stated on page I opened (UNVERIFIED; reuse page failed to load) | https://esco.ec.europa.eu/en/use-esco/download | ESCO download page | Multilingual skills taxonomy | MED (confirm terms) |
| Kaggle Resume Dataset (Livecareer) | Resumes in PDF and string form | size/licence not shown to my fetch | not stated (JS page) | https://www.kaggle.com/datasets/snehaanbhawal/resume-dataset | Kaggle (partial) | Likely scraped; treat as demo only | HIGH/unknown |
| Real/Fake Job Posting (EMSCAD on Kaggle) | Labelled fake job postings | not shown | not shown | https://www.kaggle.com/datasets/shivamb/real-or-fake-fake-jobposting-prediction | Kaggle (partial) | Fraud-text classifier demo | UNVERIFIED terms |
| Named entity recognition in resumes (paper) | Authors' annotated resumes, 5 IT fields | not stated | not stated | https://arxiv.org/abs/2306.13062 | arXiv abstract | Method reference only | n/a |

No AI-generated or fraud-resume dataset was found and opened. See UNVERIFIED.

## D. Registry seed data

| Source | What | Format / size / cadence | Licence (as stated) | URL | Verified how | Bootstrap role | Risk |
|---|---|---|---|---|---|---|---|
| ROR data dump | Research orgs with IDs, domains, links, aliases | JSON (format of record) + CSV; Zenodo; release 2.0 on 2025-12-16; releases "typically at least once a month"; record count not stated | "CC0 1.0 Universal" | https://ror.readme.io/docs/data-dump (DOI 10.5281/zenodo.6347574) | ROR docs | Global university spine: ROR id, name, website, domain, country | LOW |
| GLEIF Golden Copy (LEI) | Legal-entity identity + parent relationships | CDF files (Level 1, RR, exceptions); 3 sets daily with 8h/24h/7d/31d deltas; size not stated | "provided under the CC0 licence" (Terms of Use II.3); trademark use needs permission | https://www.gleif.org/en/lei-data/gleif-golden-copy/download-the-golden-copy ; terms https://www.gleif.org/en/meta/lei-data-terms-of-use | Two GLEIF pages | Employer/issuer legal identity (global); few Indian small firms have LEIs | LOW |
| Hipo university-domains-list | University names + web domains | JSON, per-country filter script; entry count and date not stated | "MIT license" (text not seen) | https://github.com/Hipo/university-domains-list | GitHub | Quick domain to institution mapping for did:web candidates | LOW (crowd data, validate) |
| Wikidata | Universities, identifiers | dump/SPARQL | "All structured data ... CC0" | https://www.wikidata.org/wiki/Wikidata:Licensing | Licensing page | Cross-link ROR/AISHE/Wikidata ids | LOW |
| OpenAlex | Institutions (about 109,000), ROR-keyed | Snapshot JSONL ~750 GB or Parquet ~780 GB total (all entities); quarterly free; June 2026 release | data licence NOT stated on pages I opened (UNVERIFIED) | https://help.openalex.org/access/snapshot.md | OpenAlex help | Use API for institution lookups, not the full snapshot | MED (confirm CC0) |
| UGC lists (universities, fake universities) | Central/State/Deemed/Private lists, "List of Fake Universities" | HTML list pages with a "type" parameter; no counts or format stated; site showed "Access Denied" notices | not stated | https://www.ugc.gov.in/universitylist/index | UGC page | Primary Indian trust/blocklist; scrape and cite with date, keep snapshots | MED (no explicit licence; government public notice data) |
| AISHE (MoE/MoSPI) | Higher-education survey | AIKosh listing: "Open Government License, India"; format/size not stated, "Redirected" | "Open Government License, India" | https://aikosh.indiaai.gov.in/home/datasets/details/all_india_survey_oh_higher_education.html | AIKosh page | AISHE codes (C-xxxxx, U-xxxx) as institution keys | LOW/MED |
| MCA Company Master Data (data.gov.in, RoC-wise) | Indian company master | page showed no records and "API does not exist"; licence line "National Data Sharing and Accessibility Policy (NDSAP)"; data "up to 3rd November 2023" | NDSAP | https://www.data.gov.in/resource/registrars-companies-roc-wise-company-master-data | data.gov.in page | Stale and API-limited; treat as optional; scraped third-party copies (Apify) exist, restrictions unclear | HIGH for scraped copies |
| NIRF | Ranking years 2016-2025 | downloads/terms not stated on home page; site run by INFLIBNET | not stated | https://www.nirfindia.org/Home | NIRF home | Quality signal, not identity | MED |
| AICTE approved institutes | Searches returned only per-college EOA PDFs; no bulk open dataset found | n/a | n/a | n/a | search only | See UNVERIFIED | n/a |

How to turn this into the trust registry: (1) Import ROR as base `issuer` rows (ror_id, name, country, links, domains). (2) Left-join Hipo and Wikidata for extra domains/ids. (3) Add India overlay: UGC lists (type, state) and AISHE code, flag UGC "fake" entries as `status=blocked` with source URL + fetch date. (4) For each issuer derive a `did:web` candidate from its domain; mark `tier=unverified` until the institution proves control (DNS TXT or `/.well-known/did.json`), then `tier=domain-verified`. (5) Employers: GLEIF LEI where present, MCA only as optional manual check. (6) Store provenance (source, licence, retrieved_at, hash) on every row. Registry rows are a lookup, not proof of a given certificate; the signature check still decides.

## UNVERIFIED (not confirmed by opening a source this session)

- TrOCR and Florence-2 licences (HF pages did not state; both are widely reported as MIT, confirm on the repo LICENSE before claiming).
- ESCO licence (download page silent; reuse page failed).
- OpenAlex CC0 data licence (pages opened did not say).
- SROIE, RVL-CDIP, CASIA v2, Columbia, CoMoFoD/Coverage, T-SROIE, ICDAR tampered-text competitions, MIDV-500: not opened.
- IndicOCR / AI4Bharat OCR datasets: GitHub page failed; no confirmation.
- AICTE bulk open data, NAAC data, India OpenCorporates terms: not found or not opened.
- EMSCAD original (fraudjobs.org blocked by robots); Kaggle licences for Resume Dataset and fake-job set.
- Roboflow certificate-forgery sets (search result only).
- Qwen2.5-VL 3B/72B licence; Surya license beyond README text.
- Any AI-generated-resume or fraud-resume dataset.

## E. Do we need to train models? Honest recommendation

Short answer: mostly no. Ship a pipeline of pretrained parts and deterministic rules; train only two small things.

1. Use pretrained, no training: OCR (PaddleOCR, Apache-2.0, has Devanagari/Tamil/Telugu; Tesseract as fallback; docTR for Latin), layout (DocLayNet-trained open models, check their licence), and structured extraction by prompting Qwen2.5-VL-7B (Apache-2.0) to emit JSON against a certificate schema, then validate with rules (date formats, roll number regex, institution in registry, issuer domain, QR/hash). Verification truth comes from cryptographic signatures and registry lookups, not ML. ML only adds "this looks edited" evidence.
2. Light fine-tune that is justifiable: (a) a layout-aware field extractor (Donut-base MIT, or Qwen2.5-VL LoRA) on synthetic certificates rendered from templates, to cut hallucination and speed up; (b) a small tamper classifier/localizer (e.g. a ResNet/EfficientNet or SegFormer-style segmenter) trained on synthetic edits plus ELA/noise features. A resume skill-NER fine-tune on Annotated_NER_PDF_Resumes (MIT-tagged, provenance unclear) is optional.
3. Avoid shipping weights derived from NC data (DocTamper, AIForge-Doc, LayoutLMv3 weights). Use them only to report offline numbers, and say so.

Synthetic tamper pipeline from real templates:
- Collect 20-50 real or public certificate/marksheet templates (own permission, or self-designed lookalikes; no real students' data). Render clean PDFs with fake names, numbers, dates, seals via HTML/ReportLab with fonts from Google Fonts; also print-scan style augmentations (blur, noise, rotation).
- Tamper ops with auto masks: text replace (same font), font mismatch (different family/size/kerning), copy-move (duplicate a seal or marks cell), splice (paste a field from another doc), inpaint-and-retype, digit edit in marks, JPEG re-compression at two different qualities (double-compression artefacts), and metadata/producer edits for PDFs.
- Output: image, pixel mask, tamper-type label, per-field truth JSON. Split by TEMPLATE (hold out templates) not by image, to avoid leakage; this is the number judges should trust.

Metrics: field-level precision/recall/F1 (exact match after normalisation, plus character error rate); tamper detection ROC-AUC and PR-AUC at image level, IoU/F1 for localisation; false-accept rate (forgery accepted as genuine) at fixed false-reject rate, e.g. FAR at 5% FRR; report per tamper type and on held-out templates and on an out-of-domain set (Find it again! forgeries if terms allow).

Compute: Colab/Kaggle free T4 (16 GB) is enough for PaddleOCR inference, Donut-base fine-tune with fp16 and small batch on a few thousand synthetic images (hours), and a small CNN tamper classifier (under an hour). Qwen2.5-VL-7B needs 4-bit quantisation on a T4 for inference or a hosted endpoint; LoRA fine-tune is tight, use 3B or skip.

Judge demo protocol (about 10 minutes): fix 100 held-out synthetic certificates (50 genuine, 50 tampered across 5 ops) plus 10 real or lookalike hand-edited samples; run pipeline with a published seed; show a table (field F1, AUC, FAR@5%FRR) and 5 side-by-side overlays (input, mask, verdict); ablation: rules only vs OCR+VLM vs +tamper model; state limits plainly (synthetic-to-real gap, ELA fails after heavy recompression).
