# AI MODELS: what we need, what we train, what we do not build

Principle: AI proposes, rules + signatures decide, humans confirm. No model ever outputs "verified". We do not score or rank people.

| # | Task | Model approach | Train? | Data | Metric | Phase |
|---|---|---|---|---|---|---|
| 1 | OCR (EN/HI/MR; certificates, marksheets) | PaddleOCR (Apache-2.0, supports Devanagari) with Tesseract fallback; docTR alternative | No (pretrained) | n/a | CER/WER on our synthetic + sample set | P6 |
| 2 | Field extraction from certificates | Rules + layout + VLM (Qwen2.5-VL-7B, Apache-2.0) with JSON schema; optional Donut (MIT) LoRA fine-tune on synthetic templates | Optional light | Synthetic certificates (our templates), DocLayNet for layout pretrain (CDLA-Permissive) | field-level F1 on held-out templates | P6 |
| 3 | Resume -> structured claims | LLM structured output (hosted API) + rule validators; holder confirms | No | Public resume sets only for tests (check provenance) | claim recall/precision on 50 hand-labelled resumes | P5 |
| 4 | Institution/employer entity resolution | String similarity + embeddings against ROR/GLEIF/Wikidata ids; fuzzy name + alias tables | No (small embedding model) | ROR (CC0), GLEIF (CC0), Hipo domains (MIT) | top-1 match accuracy on 200 labelled names | P3 |
| 5 | Tamper signals on scanned paper | Classical forensics (ELA, copy-move, font/metadata, JPEG ghosts) + small CNN/ViT classifier | Yes, small | SYNTHETIC tampers from our templates; DocTamper/AIForge-Doc for benchmark only (non-commercial) | AUC; FAR at 5% FRR; report real-world gap | P6 |
| 6 | Stamp/hologram check | Do NOT claim. Photo-based hologram verification is unreliable; use as weak signal only | No | n/a | n/a | never claimed |
| 7 | Timeline/consistency | Rules (sweep-line), no ML | No | n/a | unit tests | done in spike |
| 8 | Translation + voice read-out | Hosted TTS/translation APIs or open models; human-reviewed strings for core UI | No | n/a | native-speaker review | P1/P7 |
| 9 | Prompt-injection defence | Strict schemas, tool-less extraction call, content isolation, red-team corpus | No | Corpus we write | pass rate | P5 |
| 10 | Issuer health / anomaly detection | Statistical rules first (rate spikes), isolation-forest later | Later | Issuance logs | alerts precision | roadmap |
| 11 | Face/liveness | NOT built. Partner with an IDV vendor later | n/a | n/a | n/a | roadmap |

## Do we "need a lot of models"? No.
Two to three components do real work: OCR, a document field extractor, a small tamper classifier. Everything else is rules, signatures and registry lookups. This keeps cost, bias risk and failure modes low and the story honest.

## Training plan (only if time allows)
1. Build the synthetic generator (20+ certificate templates, Indian fonts, seals, signatures, noise, rotations, phone-photo effects).
2. Baseline: pretrained OCR + rules. Measure.
3. Fine-tune extractor on synthetic; evaluate on templates never seen in training and on 30 real-looking samples we create by photographing printed samples.
4. Tamper classifier: operations = field swap, inpaint, copy-move, font change, recompress, screen-photo. Report AUC, FAR@5%FRR, and failure cases.
5. Compute: Colab/Kaggle T4 is enough. Store configs, seeds, eval JSON in `bench/ml/`.
6. Model card per model: intended use, data, limits ("synthetic != real forgeries"), licences.

## Licence guardrails
Ship only permissive: PaddleOCR, docTR, Tesseract (Apache-2.0), Qwen2.5-VL-7B (Apache-2.0), Donut-base (MIT). Do not ship LayoutLMv3 (CC BY-NC-SA) or models trained on DocTamper/AIForge-Doc (non-commercial). Check Surya weights' terms before any use. TrOCR/Florence-2 licences unconfirmed by our research: verify first.
