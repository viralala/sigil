# DATASETS AND PROOFS

Source of truth: docs/research/datasets.md (tables A-D with licence, URL and how verified; section E = training/eval plan; UNVERIFIED list at bottom).
Note: our research sandbox could not call the Hugging Face API or download files, so NOTHING was downloaded or inspected. "Proof" here = the licence and description on the dataset's own page, with URL. First task for Claude Code on a normal network: download, hash (sha256), record size/rows/licence text in `data/MANIFEST.md`, and keep raw data out of git.

## Quick pick list
| Need | Use | Licence | Ship in product? |
|---|---|---|---|
| Institution registry spine | ROR dump (Zenodo) | CC0 | Yes |
| Companies | GLEIF LEI golden copy; Wikidata | CC0 | Yes |
| University domains | Hipo university-domains-list | MIT | Yes |
| India institutions | AISHE listing; UGC/AICTE/NIRF pages | AISHE: Open Govt Licence-India; others unconfirmed | Check terms first |
| Document layout | DocLayNet | CDLA-Permissive-1.0 | Yes |
| Receipt-style extraction benchmark | CORD v2 | CC BY 4.0 | Yes |
| Occupations/skills taxonomy | O*NET 31.0 | CC BY 4.0 | Yes |
| OCR engines | PaddleOCR, docTR, Tesseract | Apache-2.0 | Yes |
| VLM extractor | Qwen2.5-VL-7B | Apache-2.0 | Yes |
| Doc understanding | Donut-base | MIT | Yes |
| Tamper benchmarks | DocTamper, AIForge-Doc v2 | non-commercial / CC BY-NC-SA, gated | Benchmark only, never ship models trained on them |
| Not usable | LayoutLMv3 (CC BY-NC-SA), Surya weights (restricted) | | No |

## Synthetic data plan (our moat for the ML part)
Generate 5k-20k certificates/marksheets from 20+ self-made templates (Faker names, fonts, seals, noise). Apply tamper operations: field swap, copy-move, inpaint, font mismatch, JPEG recompress, photo-of-screen. Split by template. Metrics: field F1, tamper AUC, FAR at 5% FRR. Always report limits: synthetic != real forgeries.
