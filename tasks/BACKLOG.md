# BACKLOG (tick as you go; one task at a time; log below)

Legend: [ ] todo, [x] done. Owner suggestions in brackets. Dates are relative (D0 = kickoff); adjust to the hackathon deadline.

## P0 Setup (D0-D1)
- [x] pnpm + Turborepo monorepo; `apps/web` (Next.js, TS, Tailwind, shadcn); ESLint, Prettier, Vitest, Playwright, axe wired [Nayan]
- [x] Move `spikes/crypto-core` into `packages/core` keeping 12 tests green [Viral] (all 20 contract tests green + 20 sample-pack tests)
- [x] Supabase project `sigil` (see CLAUDE.md note on free-tier slots) + `.env.example` + RLS-on-by-default migration [Shreenath] (ref kaabtrcfacsyjzxgiedm, ap-south-1, $0)
- [ ] Vercel project `sigil`, preview deploys, CI (typecheck, lint, test, e2e) [Nayan] (PARTIAL: GitHub repo and Vercel project exist; latest CI stopped at `pnpm test` because the forensics model version was stale. Fixed locally; database/runtime secrets are now wired to CI. Re-run CI on the updated branch and confirm preview deployment.)
- [ ] Tokens + fonts (Antonio, Inter) + `Button`, `Card`, `StatusBadge`, `BigTile` components with stories [Nayan] (PARTIAL: tokens + fonts now from the shipped CESAC theme (Big Shoulders/Figtree/Space Mono, see design/CESAC_REFERENCE.md); all four components built with unit tests; stories NOT done, no Storybook yet)

## P1 Website first (D1-D4): public site that already works
- [x] Landing: three giant tiles (Get verified / Check someone / Sign for my students) + 20-second explainer animation [Nayan]
- [x] `/check`: paste link or scan QR (camera) -> calls verify API -> traffic-light result with plain sentence + "Why?" + "Details for nerds" [Nayan + Viral]
- [x] Sample data pack: 3 sample colleges, 3 sample employers, 10 sample credentials, clearly labelled Sample [Tanaya] (packages/core/src/sample.js; plus 1 fake-listed and 1 unlisted college as attackers)
- [x] i18n scaffold (EN/HI/MR) + voice read-out button [Nayan] (HI/MR are Claude drafts: need a native speaker review)
- [x] PWA manifest + offline shell; Lighthouse >= 90 [Nayan] (97/100/100 on all 4 pages, bench/lighthouse/)

## P2 Trust engine (D2-D6)
- [ ] ES256 keys (WebCrypto/node) replacing Ed25519; same tests [Viral]
- [ ] SD-JWT VC issue/present/verify using a maintained library; key-binding JWT with nonce+aud+exp [Viral]
- [ ] Bitstring Status List (gzip+multibase), signed wrapper, staple + max-age policy [Shreenath]
- [ ] Trust list v1: t-of-n signed JSON at `/.well-known/sigil-trust.json`; did:web issuer docs [Viral]
- [ ] Verify API `/api/verify` returns `{verdict, claims[], reasons[], plainText}`; reason-code catalogue with plain-language strings [Viral + Tanaya]
- [ ] Property-based tests (fast-check) for Merkle/disclosure; fuzz the verifier inputs [Shreenath]

## P3 Issuer experience (D5-D8)
- [ ] Registry seed import from public datasets (ROR, AISHE/UGC, Hipo domains; see docs/DATASETS.md): status `listed` [Shreenath]
- [ ] Claim organisation via domain email (magic link) [Nayan]
- [ ] One-click confirm email flow (Resend or Supabase SMTP): token, expiry, anti-abuse [Nayan + Viral]
- [ ] Bulk CSV issue with preview, one batch signature, delivery links [Viral]
- [ ] Revoke/suspend with reason + holder notification + dispute inbox [Shreenath]

## P4 Holder wallet (D6-D10)
- [ ] Magic-link sign in + passkey creation; holder key non-extractable [Nayan]
- [ ] Wallet storage: client-side encrypted blob sync [Viral]
- [ ] Consent screen (what is shown / hidden), share link + QR + WhatsApp, expiry, "Stop sharing" [Nayan]
- [ ] Activity log + consent receipts [Shreenath]
- [ ] Lost-phone recovery via issuer-assisted re-binding [Viral]

## P5 Verified Resume (D8-D13): the wow feature
- [ ] Resume upload (PDF/DOCX/photo) -> text -> structured claims (LLM structured output + rules) with confidence [Tanaya]
- [ ] Claim cards UI with ONE button each (Ask to confirm / Take photo / Just my word) [Nayan + Tanaya]
- [ ] Evidence routing + tiers A/B/C; timeline consistency engine (sweep-line) [Tanaya]
- [ ] **Sigil Seal export**: resume PDF with QR + short URL + visible seal; public verified profile page [Nayan]
- [ ] Trust report (plain language + per-claim reasons) [Tanaya]

## P6 Paper bridge + ML (D10-D15)
- [ ] `services/ocr` FastAPI: preprocess, OCR (PaddleOCR or Tesseract), field extraction (regex + layout), confidence [Shreenath]
- [ ] Synthetic tamper generator + eval harness (field F1, tamper AUC, FAR/FRR) per docs/DATASETS.md section E [Shreenath + Tanaya]
- [ ] Forensic signals (ELA, font/metadata mismatch, copy-move) -> tamper score; always Tier B max [Shreenath]
- [ ] Record-commitment match against institution Merkle commitment (optional upload by issuer) [Viral]

## P7 Verifier pro (D12-D16)
- [ ] Verifier org account, policy slider (Relaxed/Normal/Strict) [Nayan]
- [ ] Bulk resume check (folder/CSV) with progress, filters, CSV/PDF report [Tanaya]
- [ ] Public REST API + API keys + webhooks + OpenAPI docs page [Viral]
- [ ] Hash-chained audit log + export [Shreenath]

## P8 Hardening and proof (D15-D18)
- [ ] Threat-model tests: replay, relay, borrowed, stale list, fake issuer, alg confusion, tampered disclosure (all automated) [Shreenath]
- [ ] Benchmarks in `bench/`: verify latency (p50/p95), proof size vs fields, status list size vs N, OCR field F1 [Viral]
- [ ] Accessibility audit with a real non-technical tester + a child; fix findings [Nayan]
- [ ] DPDP checklist doc (consent, minimisation, erasure, breach runbook) [Shreenath]

## P9 Demo and pitch (D18-D21)
- [ ] docs/DEMO_SCRIPT.md rehearsed 5 times; offline fallback video; deployed URL stable [All]
- [ ] Update PPT with real screenshots + measured numbers only [All]
- [ ] Judge Q&A drill from docs/PITCH.md [All]

## P10 Resilience: the hard problems (see docs/PROBLEMS_AND_SOLUTIONS.md)
- [ ] Port lifecycle logic (closed/derecognised/fake/retired, closing manifest, final status list) from spikes into packages/core; keep tests 13-20 green [Viral]
- [ ] Registry model: states, custodian, key history, closing manifest, final status list; admin UI for trustees (2-of-3 approval, public diff) [Shreenath]
- [ ] Result screen copy for every state/warning in plain language (EN/HI/MR) [Nayan + Tanaya]
- [ ] Witness model in data + UI: each claim card shows who vouched, how, when (W1-W5) [Tanaya + Nayan]
- [ ] W3 one-tap issuer confirm: official-domain check, single-use token, DKIM result stored, two-person bulk approval, rate limits [Nayan + Viral]
- [ ] Legacy Desk (holder path): scan -> OCR -> registry match -> registrar review card -> digital twin credential with source=paper-legacy [Tanaya + Shreenath]
- [ ] Legacy Desk (institution path): bulk scan upload -> review queue -> batch sign [Shreenath]
- [ ] Early-warning job: issuer health (domain alive, still on AISHE/UGC/ROR) + holder export nudge [Shreenath]
- [ ] Sigil-survives-Sigil: static export of trust list + status lists + verifier lib published; `bench/offline-verify` passes with network disabled; registry mirror + escrow plan [Viral]
- [ ] Seal check: "drop the PDF you received" compares document hash/claims, red if edited [Nayan]
- [ ] Name matching + name-link claims + transliteration tests [Tanaya]
- [ ] Prompt-injection corpus (>=30 cases) + schema-locked extraction [Tanaya]
- [ ] Wallet recovery: client-encrypted backup + issuer-assisted re-binding [Viral]
- [ ] Legal to-dos (non-code): ask registrar/lawyer who holds records after closure; IT-Act status of signatures; terms of service wording [All]
- [ ] Demo toggle "VIT closes" showing closed-college verification still works [Nayan]

## Demo blockers
Found walking docs/DEMO_SCRIPT.md on 2026-11-04 against what P0/P1 built. Not bugs; these steps need later phases.
- 0:00 hook says "two seconds": not measured yet. Measure verify latency in `bench/` (P8) or drop the number.
- 0:10 resume photo upload is not built; pasted resume text becomes editable claim cards. Claim requests and the Sample issuer console approval work. Confirmation is not emailed.
- 1:00 consent screen + share QR (P4): built for the wallet share flow; `/get-verified` remains a fixed Sample Seal.
- 1:30 airplane-mode verify: not built. The service worker never caches /api/verify on purpose; offline verify needs the static trust/status lists (P10 Sigil-survives-Sigil).
- 2:10 (b) "same QR scanned twice": the core rejects replays (tested), but the UI simulates the wallet and makes a fresh proof each time, so it cannot be shown on stage yet. (c) live revoke: only a pre-revoked sample. (d) edited PDF: only an edited-grade sample (Seal check is P10).
- 2:40 "VIT closes" toggle: closed-college sample works, no toggle.
- Sample world lives in server memory. On Vercel, a Seal made on /sign may land on another instance and show "could not find that link". Persist it in Supabase before demoing on the deployed URL.

## Log
- 2026-11-03: scaffold created by Claude (chat). crypto-core spike 12/12 passing.
- 2026-11-03: added problem register, AI plan, witness model, lifecycle states (closed/derecognised/fake/retired) to spike; spike now 20/20 passing.
- 2026-11-04: P0+P1 by Claude. pnpm/Turborepo monorepo; packages/core (spike ported, 40/40 incl. the 20 contract tests + sample pack + one-tap confirm); apps/web Next.js 15 with CESAC Fantastic 4 tokens taken from the shipped theme (design/CESAC_REFERENCE.md); landing (3 tiles + 20s explainer), /check (paste, QR camera, 10 samples, traffic light, witness, Why?, nerds, read aloud), /get-verified (sample Seal + QR), /sign (one-tap confirm really signs); EN/HI/MR; PWA. Gate: typecheck, lint, 34 unit, 79 e2e+axe (mobile+desktop), spike 20/20, Lighthouse 97/100/100. Supabase `sigil` created with RLS-on-by-default trigger; Vercel `sigil` created + preview deploy. Open: CI never run (no git repo), Storybook stories, HI/MR review.
- 2026-11-04: Fixed the about-page film paths; added asset checks. Fixed the forensics model/feature version mismatch and evaluator dtype bug. Regenerated 3,364 private feature rows; held-out tamper AUC is 0.529 overall, so the model is experimental and weak. Updated English warning and pitch/demo scripts. Local checks: typecheck, lint, unit, 20/20 spike, 108 E2E passed with one worker; 2 desktop/mobile-project skips. Lighthouse 13.6.0: home 91/100/100 (performance/accessibility/best practices), /check 100/100/100. CI rerun pending on review branch.
