# RESEARCH SUMMARY (as of 2026-11-03). Full cited reports: docs/research/market.md, standards.md, datasets.md

## Spot-checked by the lead (re-fetched and matched)
- RFC 9901 = "Selective Disclosure for JSON Web Tokens" (Proposed Standard; Fett, Yasuda, Campbell).
- Kanpur racket: 4 arrested; 141 stamps, 80 holograms, 830 blank marksheets (ThePrint, 9 Jun 2026).
- AuthBridge H1 FY26 (16 Feb 2026): employment 11.15%, education 4.49% (white-collar). The page's intro text contradicts its body on overall rates; we cite only the check-level numbers.

## Rules for using the numbers
1. Cite the URL from the report tables. 2. Predictions (Gartner 2028) and vendor market sizes are labelled estimates. 3. Never state a figure from the UNVERIFIED lists. 4. Re-open the source before showing a number on a slide if it is older than 30 days.

## Standards status (details in standards.md)
Final: W3C VC Data Model 2.0, Bitstring Status List v1.0, Data Integrity/ecdsa-sd-2023 (15 May 2025); OpenID4VCI 1.0 (16 Sep 2025); OpenID4VP 1.0 (9 Jul 2025); HAIP 1.0 (24 Dec 2025); SD-JWT RFC 9901 (2025).
Draft/in progress: SD-JWT VC (draft-23, IESG evaluation), Token Status List (RFC Editor queue), bbs-2023 (W3C CR Draft), IETF BBS (CFRG draft), W3C Digital Credentials API (Working Draft). Use "aligned with" wording for these.
Libraries: jose (MIT), @noble/curves (MIT), @sd-jwt/sd-jwt-vc (Apache-2.0, pin; upstream repo archived Sep 2026 and moved), avoid mattrglobal/bbs-signatures (deprecated), Veramo/Sphereon (legacy).
Feasible in 2-3 weeks: SD-JWT VC issue/present + KB-JWT (nonce, aud, sd_hash, iat); status list + signed staple; did:web/JWKS + signed trust registry; resume as several credentials; OCR bridge. Stretch: OpenID4VCI/VP subset. Roadmap only: BBS, ZK range proofs, transparency log, passkey-bound credentials (passkeys cannot produce a standard KB-JWT).
India: DigiLocker requester onboarding needs API Setu registration, GSTN, Entity Locker. Do not claim integration. EU: wallets due end-2026 (Reg. 2024/1183), ARF v3.0.0. Do not claim EUDI interoperability.

## Wording to use / avoid
Use: "issuer-signed derived claim", "aligned with SD-JWT (RFC 9901)", "verification needs no per-check call to the issuer; freshness is bounded by a signed status staple we display", "paper path is a lower-assurance bridge".
Avoid: "zero-knowledge" (for bands), "unhackable", "blockchain-grade", "EUDI-compatible", "integrated with DigiLocker", "100% accurate OCR".

## Datasets and models (details in datasets.md)
No public diploma-forgery dataset found; forgery sets (DocTamper, AIForge-Doc) are non-commercial/gated: benchmark only. Safe: PaddleOCR, docTR, Tesseract (Apache-2.0), Qwen2.5-VL-7B (Apache-2.0), Donut-base (MIT), DocLayNet (CDLA-Permissive), CORD v2 (CC BY 4.0), O*NET (CC BY 4.0). Do not ship LayoutLMv3 (CC BY-NC-SA) or Surya weights without checking terms. Registry data: ROR (CC0), GLEIF (CC0), Wikidata (CC0), Hipo university-domains (MIT); India sources (UGC, AISHE "Open Government Licence India", AICTE, NIRF) need manual terms check; UGC pages showed access errors for our fetcher.
Recommendation: do not train much. Pretrained OCR + VLM -> JSON -> rules/signatures/registry. Optional light fine-tune on synthetic data.

## Open research tasks for Claude Code (tick in BACKLOG)
- Re-fetch each dataset page from a normal network (our proxy blocked HF API) and record exact license text, size, sample count.
- Verify UNVERIFIED items listed at the bottom of each report.
- Get INR pricing of BGV checks from 3 vendor quotes.

## Added 2026-11-03 (closure, legacy, verification rails)
- NAD (nad.gov.in/about.html, fetched): verifying entities (banks, employers, government, institutions) can check an award only with the student's prior consent; DigiLocker delivers machine-readable awards; retrieving old paper records is called "cumbersome" and paper is vulnerable to spoilage and forgery; no legacy migration is described.
- UGC order (Free Press Journal, 9 Jun 2026): HEIs must upload Examination Year 2025 marksheets/grade sheets/credit data to NAD-ABC by 30 Jun 2026; earlier years not mentioned. Implication: legacy gap likely, size unknown.
- Records custody after institution closure in India: we found only generic guides and a robots-blocked page; NO authoritative rule verified. Treat as a legal to-do (BACKLOG P10).

