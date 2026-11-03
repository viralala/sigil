# SIGIL: READ THIS FIRST (5-minute summary, v2, 2026-11-03)

## What we are building
A website and phone-friendly app where a person's resume becomes a bundle of **claims that each say who vouched for them**. A recruiter scans a QR on the resume and gets a green / yellow / red answer in about 2 seconds, with a one-line reason. The student shows only what is needed (degree yes, marks no). Checking does not need a phone call to the college.

## The honest core idea: the Witness Model
We never say "verified" without naming the **witness**: who vouched, how, when.
1. College signed it itself (strongest, works offline, even if the college later closes).
2. A government record the student shares with consent (roadmap; needs partnership, we do not claim it today).
3. The registrar confirmed with one tap from an official email (needs no setup by the college).
4. Our software checked the paper (OCR + tamper signals + record match). Never stronger than "checked".
5. Someone else or the student alone said so. Shown as "not verified".
If nobody has vouched, we say "No one has vouched for this yet", not "fake".

## Your four problems, answered
1. **University closes?** A signature does not need the signer alive, so old digital certificates still verify from static files. The registry marks the college `closed` with a date and a custodian, pins a "closing list" of genuine certificates and a frozen revocation list, so forgeries back-dated with a leaked key are rejected. Merged, renamed, de-recognised and fake-listed colleges each have their own state. Built and tested (20/20 tests pass in `spikes/crypto-core`). Open item: who legally holds records after a closure in India varies and we did not find one authoritative rule, so we need a registrar/lawyer to confirm.
2. **How do we verify if there is no way to verify?** We offer the cheapest honest evidence and label it: one-tap registrar confirmation, employer HR confirmation by email, consented government record (later), paper document checks, peer attestations. Our first real issuer is the VIT Pune placement cell. Thin evidence gives a yellow "Partly checked" with one next action.
3. **Old paper certificates and renewal?** A "Legacy Desk": scan -> OCR -> match -> registrar taps "matches our records" -> we issue a digital twin that says it came from paper and who attested. If the college is closed, a custodian confirms or it stays "paper checked". Colleges can also bulk-digitise old registers as a paid service. "Renewal": the degree never expires; we renew the proof (fresh one-time presentations, status freshness, key rotation records, crypto-agility, periodic re-timestamping, wallet recovery).
4. **Many AI models needed?** No. Only OCR, a document field extractor, and a small tamper classifier do real work; the rest is rules, signatures and registry lookups. Pretrained models plus light training on our own synthetic certificates (Colab T4 is enough). We never score people and never claim face or hologram checks. Plan in docs/AI_MODELS.md.

## Other problems we found and fixed (details in docs/PROBLEMS_AND_SOLUTIONS.md)
Sigil itself shutting down (credentials must outlive us: open spec, static files, mirrors, escrow); who is trusted in the registry (evidence, tiers, 2-of-3 trustees, takedowns); corrupt or phished registrars; key compromise and our own key custody; person-versus-key identity; name changes and languages; employers that no longer exist; AI hallucination and prompt injection; fake seals and look-alike sites; privacy law and linkability; competition from government platforms; a 4-student team's scope.

## What the product does (the wow list)
Verified Resume + Sigil Seal on every PDF (viral loop); zero-key issuer (one email, one tap); Legacy Desk; privacy sharing with consent screen and receipts; attack round demo (relay, replay, borrowed, revoked, stale, fake college, edited PDF, closed college); recruiter trust report with a "how strict?" setting, bulk upload, API; Hindi/Marathi, voice read-out, works offline; open-data pre-seeded registry.

## What we will NOT claim
Zero-knowledge (our grade bands are signed derived claims); DigiLocker or EU wallet compatibility; perfect OCR; that paper checks equal a signature; that unverified means fake; any statistic without a link.

## Evidence we have (all with links in docs/research/)
Employment discrepancies 11.15%, education 4.49% (AuthBridge, India, Feb 2026); police seized 141 stamps, 80 holograms, 830 blank marksheets (Kanpur, Jun 2026); manual checks take days and cost $7.50-$50 each in vendor lists; DPDP obligations from 13 May 2027; NAD says old paper records are "cumbersome" to retrieve and UGC's 2026 upload order covered only Exam Year 2025 (so a legacy gap exists; size unknown). Predictions and vendor market sizes are labelled estimates.

## Plan in one picture
Week 1: site + verify page + sample data + trust engine on standards (SD-JWT, ES256). Week 2: issuer one-tap, wallet, consent. Week 3: Verified Resume + Seal, Legacy Desk, OCR bridge. Week 4: recruiter tools, hardening, benchmarks, 10 interviews, demo rehearsals. Cut line if short: keep website, verify, attack round, Verified Resume; drop ML training and bulk tools.

## Decisions we need from you (team)
1. Hackathon deadline and judging format (sets the schedule). 2. Who talks to the VIT Pune registrar/placement cell (pilot). 3. OK to use a hosted LLM API for resume parsing (cost, privacy)? 4. Which two people do the 10 interviews first.

## Folder map
docs/SUMMARY.md (this) | MASTER_PLAN | PROBLEMS_AND_SOLUTIONS | AI_MODELS | UX_SPEC | ARCHITECTURE | RESEARCH + research/ | DATASETS | WORKFLOW | QA | DEMO_SCRIPT | PITCH | DECISIONS | tasks/BACKLOG | spikes/crypto-core | design | assets | FIRST_PROMPT
