# SIGIL MASTER PLAN (v1, 2026-11-03)

One line: **Sigil turns a resume into a bundle of signed claims that anyone can verify in two seconds, without phoning anyone, and reveals only what the verifier needs.**

## 1. Why this can be a company, not a project
Evidence (all in docs/research/market.md with URLs; predictions are labelled):
- Employment is the most-faked item: 11.15% discrepancy; education 4.49% (AuthBridge H1 FY26, India, 16 Feb 2026).
- Forgery is industrial: Kanpur police seized 141 university stamps, 80 hologram strips, 830 blank marksheets (ThePrint/PTI, 9 Jun 2026).
- Checking is slow and per-check priced: education 1-15 days, employment 3-7 days (blog source); US list prices $12.50 education, $12.50-$50 employment (Checkr).
- Regulation pushes minimal data: India DPDP main obligations from 13 May 2027, penalties up to Rs 250 crore; EU wallets due Dec 2026.
- Fraud tailwind (prediction, not measurement): Gartner expects 1 in 4 candidate profiles fake by 2028.
- Big outcomes exist in adjacent markets (Checkr $4.6B round 2021, Persona $2B 2025, First Advantage-Sterling $2.2B 2024), but an India-only BGV player (IDfy) is at ~$256M, so the story must be global-from-India.
Honest framing for judges: we have not proven demand. Our plan includes customer-discovery milestones (section 8).

## 2. The wedge (what nobody combines)
BGV vendors look up the issuer (slow, costly). Badge platforms serve issuers. IDV firms verify the person, not the claims. DigiLocker/NAD cover government-issued academic documents. Sigil = **claim-level, whole-resume, holder-carried, verify-offline**, plus a **paper-legacy bridge** so value exists before issuers adopt. (The "uncovered by DigiLocker" gap is our inference; validate with 10 HR/BGV interviews.)

## 2b. The Witness Model (our core principle; full table in docs/PROBLEMS_AND_SOLUTIONS.md)
Every claim names who vouched, how and when (issuer-signed / government record with consent / registrar one-tap / document-checked / self-declared). No witness = "Not verified", never "fake". Closed colleges, old paper degrees and missing issuers are handled by changing the witness, not by pretending.

## 3. Product: the "wow" set (ordered by demo impact per build hour)
1. **Verified Resume + Sigil Seal.** Upload any resume; it becomes claim cards. Each claim gets ONE button (Ask to confirm / Take photo / Just my word). Export a PDF carrying a QR + short link + visible seal. Anyone scanning gets a green/amber/red answer in 2 s. The seal is the viral loop: every shared resume advertises Sigil.
2. **Zero-key issuer.** A registrar gets an email: "Did Asha Rao graduate with B.Tech 2026? [Yes, that is right]". One tap signs it (Sigil custodies keys in KMS until the org self-custodies). Removes the cold-start blocker.
3. **Privacy by design.** Share only chosen fields (salted Merkle selective disclosure), consent screen in plain words, consent receipts, "Stop sharing" button.
4. **Attack-proof checks** (each demoed live): relay (audience-bound), replay (one-time nonce), borrowed credential (holder binding), revoked, stale list, fake university (not in trust list), edited PDF.
5. **Trust Report for recruiters**: per-claim reasons in plain language, evidence tiers A/B/C, timeline-consistency engine, policy slider (Relaxed/Normal/Strict), bulk upload, API + webhooks.
6. **Paper bridge**: OCR + tamper signals + record match; capped at Tier B; never accuses on low confidence.
7. **Works for everyone**: EN/HI/MR, voice read-out, offline PWA, huge buttons, WCAG AA.
8. **Legacy Desk + Closure-proof registry.** Old paper degrees become attested digital twins; colleges that close, merge, rename or lose recognition keep their credentials verifiable (closing manifest, frozen status list, custodian).
9. **Sigil survives Sigil.** Open spec, static files, mirrors, escrow; verification never needs our API.
10. **Public registry pre-seeded** from open data (ROR, AISHE, Hipo domains); listed vs verified vs claimed states.

## 4. UX principles (full spec in docs/UX_SPEC.md)
Three doors only: "Get verified", "Check someone", "Sign for my students". One screen, one question, one big button. Status = colour + icon + word. No crypto vocabulary in the UI ("Why?" reveals reasons; "Details for nerds" reveals hashes). Test with a real non-technical adult and a child before the demo.

## 5. Scope: what we build vs what is roadmap
Build now: items 1-8 above on W3C/IETF-aligned SD-JWT VC (see RESEARCH honesty list).
Roadmap (say so on slides): BBS+ unlinkability, ZK range proofs, transparency log, EUDI/OpenID4VP interop, passkey-bound credentials, DigiLocker integration (needs API Setu + entity registration; do NOT claim it).
Truth rules: predicate "bands" are issuer-signed derived claims, not zero-knowledge; "no central lookup" means no per-verification query to the issuer (cached signed registry + status staple, staleness bounded and displayed); SD-JWT presentations are linkable; OCR path is lower assurance.

## 6. Technology (decided; see docs/ARCHITECTURE.md, DECISIONS.md)
Next.js + TS + Tailwind + shadcn PWA on Vercel; Supabase (Auth, Postgres+RLS, Storage); packages/core (jose, @noble/curves; SD-JWT per RFC 9901, hand-rolled on jose or pinned @sd-jwt/sd-jwt-vc); services/ocr (FastAPI; PaddleOCR Apache-2.0 + rules; Qwen2.5-VL optional); LLM structured output for resume extraction with human confirmation.
ML plan (datasets doc): mostly pretrained. Train only (a) light field extractor and (b) small tamper classifier on SYNTHETIC certificates from our own templates; evaluate on held-out templates; report field F1, tamper AUC, FAR at fixed FRR. Non-commercial forgery datasets are benchmark-only.

## 7. Business model and path to venture scale
- Students/holders: free forever (distribution).
- Colleges/employers as issuers: free to start; paid tiers for bulk issue, SSO, custom domain, support.
- Verifiers: usage-based per verified resume, priced below manual checks (anchors: $7.50-$50 per check in USD lists; set INR pricing after interviews). Enterprise: ATS integration, policy engine, audit exports.
- Channel: sell to BGV firms as an accelerator (they own employer relationships), then displace the lookup step.
- Moat: network of issuer-signed claims + trust registry + the seal on every resume; data flywheel of issuer reliability; compliance posture (data not held centrally).
- Expansion: India -> global (EU wallets/OpenID4VP interop) -> adjacent claims (licences, KYC-lite, rental, gig-worker onboarding).
- Risks: cold start (mitigated by zero-key issuer + paper bridge), key custody liability, issuer trust governance, regulatory shifts, incumbents copying. Mitigations in DECISIONS.md.

## 8. Validation plan (do before and during the hackathon)
- 10 interviews: 4 HR/TA, 3 BGV/ops, 3 registrars. Ask: cost per check, TAT, fraud seen, would you tap-to-confirm? Log in docs/research/interviews.md.
- Landing page with waitlist (honest copy) to measure interest.
- Pilot ask: VIT Pune registrar + 2 campus-recruiting employers to run 50 real (consenting) verifications.

## 9. Metrics that matter
Time to verify (p50/p95 ms), proof size vs fields, status-list bytes per N credentials, OCR field F1, tamper AUC/FAR@FRR, task success rate of non-technical testers, Lighthouse/axe scores, issuer confirm rate and median confirm time.

## 10. Threat model (automate every row as a test)
Forged paper; edited digital file; fake university; stolen/borrowed credential; relay to another verifier; replay of presentation; stale revocation list; issuer key compromise (rotate via trust list); malicious resume (prompt injection); phishing look-alike of verifier page; DoS on registry (static cacheable files); privacy attacks (linkability, over-collection).

## 10b. Problems we found in our own idea
Full register with fixes and residual risk: docs/PROBLEMS_AND_SOLUTIONS.md. AI plan: docs/AI_MODELS.md. Read docs/SUMMARY.md first.

## 11. Hackathon strategy
Lead with one memorable live moment: the attack round (section DEMO_SCRIPT). Show real measured numbers from bench/. Put the sourced problem stats on one slide. Say plainly what is roadmap. Judges reward honesty plus working product.
