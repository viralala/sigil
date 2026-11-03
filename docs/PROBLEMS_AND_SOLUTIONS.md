# PROBLEMS AND SOLUTIONS (red-team of our own idea, 2026-11-03)

How to read: each problem has Severity (S1 can kill the product, S2 serious, S3 manageable), the fix, what we build/test, and the residual risk we admit to judges. IDs are used in tasks/BACKLOG.md (P10) and tests.

## 0. The one idea that answers most of them: the WITNESS MODEL
Sigil never says "verified" without naming a witness. Every claim card shows: **who vouched, how, and when.**

| Witness ladder | Who vouches | How | Tier | Works if issuer never joins? |
|---|---|---|---|---|
| W1 Issuer-signed | The issuer's own key (in our signed trust list) | Signature, offline | A | No (issuer must sign) |
| W2 Official-registry delivered | Government depository (NAD/DigiLocker) | Holder consents to share the record | A | Yes, but needs a partnership; ROADMAP, we do not claim it |
| W3 Issuer-confirmed (zero-key) | Registrar confirms by tap from a domain-verified official email; the email's DKIM signature is stored as proof | Sigil signs under a recorded mandate | B+ (shows "confirmed by registrar@..., on date") | Yes: issuer needs only an inbox |
| W4 Document-checked | Our OCR + forensic + record-match | Machine evidence | B (never above) | Yes |
| W5 Peer/self | Manager/referee attestation, or the holder alone | Signed statement | C | Yes |
Closed issuer: W1 credentials issued before closure stay Tier A with a "closed on <date>, records held by <custodian>" banner. Everything else on a closed issuer's behalf is W4/W5 or a custodian-confirmed W3.
If no witness exists, the claim says **"Not verified: no one has vouched for this yet"**. It is not "fake". Policies decide what to do. We do not fake certainty.

## 1. University closes (S1)
Scenarios: (a) orderly closure, (b) sudden shutdown, (c) merger or rename, (d) de-recognition by a regulator (degrees may remain valid, new ones are not), (e) listed as fake, (f) domain/website disappears, (g) issuer key lost.
Core fix: **a signature does not need the signer to be alive.** A W1 credential verifies from three static files: the credential, the trust list, the status list. So closure of the issuer does not break verification. What does need handling:
1. Registry lifecycle states: `active | suspended | merged(into) | renamed(from,to) | closed(date, custodian) | derecognised(since) | fake`. Shown in plain words on the result screen.
2. **Closing manifest + final status list.** At closure (or when we learn of it) the entry pins the set of genuine credential ids and a final signed status list. Verifier then: accepts only credentials in the manifest (blocks back-dated forgeries made later with a leaked key), uses the frozen status list (no "stale" failure), shows the banner and custodian. Implemented and tested in `spikes/crypto-core` (tests 13-17).
3. **Successor/custodian record.** The entry names who answers for the records afterwards (affiliating university, state body, or the merged institution). Custodian can issue W3 confirmations for old records. Who legally holds records in India after a closure varies; we did not find a single authoritative rule, so this is a LEGAL TO-DO (ask a registrar + a lawyer), and the product supports any custodian a regulator names.
4. **Escrow while healthy.** While an issuer is active we keep (with its consent) a signed archive of its public keys, key history and status-list history in the registry, mirrored publicly (see S1 "Sigil dies").
5. **Early-warning:** quarterly check of issuer health (domain alive, registrar reachable, still on AISHE/UGC lists); mark "at risk" and nudge holders to export credentials.
6. De-recognition ≠ closure: degrees before the date verify with a warning; after the date fail (test 18). Fake-listed institutions always fail (test 19).
Residual risk: a sudden shutdown with no manifest. Then credentials fall back to W3 via custodian or W5, and we label the gap honestly.

## 2. "How do we verify if there is no way to verify?" (S1: cold start)
We cannot manufacture truth; we can make the cheapest honest evidence available and say what it is.
Ordered plan:
1. **Zero-key issuer (W3):** one email, one tap. Needs only a working official inbox. Anti-abuse: the sender domain must match the registry's official domain (from ROR/AISHE/UGC lists, cross-checked with the college website), role-based addresses preferred (registrar@, coe@), confirmation token single-use and expiring, two-person approval for bulk, rate limits, email stored with DKIM result. DKIM proves the message came from that domain's mail system, not that the person is honest.
2. **Employers:** same pattern: HR reply from a company domain (verified against GLEIF/MCA/website), plus manager peer-attestation (W5) for startups with no HR.
3. **Government rails (W2):** ask the student to share their NAD/DigiLocker record with consent; NAD states that verification by employers etc. needs the student's prior consent and that DigiLocker serves machine-readable awards (nad.gov.in/about.html). Integration requires onboarding with the platform; ROADMAP, not claimed.
4. **Placement-cell pilot:** VIT Pune's placement cell is our first W1 issuer: real signed credentials for a real cohort, with the registrar's consent.
5. **BGV partners:** they already contact issuers; they can submit confirmations into Sigil, which turns their work into reusable signed claims.
6. Verifier UX when evidence is thin: yellow "Partly checked", with the single best next action ("Ask the college to confirm" button). Employers set policy; default is review, never auto-reject.
Residual risk: W3 is only as good as the inbox security. We say so and record it.

## 3. Old certificates with no digital imprint, and "renewal" (S1)
**Legacy Desk (holder path):** photo/scan -> OCR -> extract serial, name, programme, year -> registry match to the institution -> two exits:
- Issuer alive: registrar gets a review card with the extracted record next to the scan; one tap "matches our records" -> Sigil issues a **re-issued digital credential** that references the original serial and states `source: paper-legacy, attested by <registrar> on <date>` (W3, Tier B+).
- Issuer closed/unresponsive: custodian confirm (W3) or document-checked (W4, Tier B max) plus optional peer attestations (W5). Shown as "Paper certificate checked, not confirmed by the college".
**Legacy Desk (institution path, a revenue line):** college uploads a bulk scan folder or the old register; we OCR into a review queue; registrar signs batches; we charge per record for the service. (Note: India's NAD page itself calls retrieval of old paper records "cumbersome" and does not describe a legacy migration; the UGC order we found covers only Examination Year 2025 uploads, deadline 30 Jun 2026. So legacy is a real gap, but we have not verified how much is left.)
**Renewal clarified.** A degree does not expire. What needs renewing is *our proof of it*:
| Thing that ages | Fix |
|---|---|
| Presentation (is it fresh?) | New one-time presentation every share (nonce, 2 min expiry) |
| Status freshness | Signed status staple, max-age policy, displayed age |
| Issuer key rotation | Rotation record: key list with `validFrom/retiredAt`; old credentials verify under the old key for dates before retirement (test 20); optional silent re-signing by active issuers |
| Algorithm ageing (crypto break, post-quantum) | Crypto-agility field + periodic re-timestamping of an archived evidence record (Merkle root of the registry anchored to an independent timestamp, renewed on a schedule). Roadmap, designed in |
| Holder loses phone | Wallet backup (client-encrypted), issuer-assisted re-binding to a new holder key |
| Credential format changes | Migration tool re-wraps the same attested claim; old format stays verifiable |

## 4. Sigil itself shuts down (S1, judges will ask)
Design rule: **credentials must outlive us.** Open spec + MIT verifier library; verification needs only static files; trust list and status lists mirrored (GitHub + IPFS-style or any CDN); registry snapshot escrowed with a neutral party (e.g. the issuing universities' consortium) on a schedule; custodial keys (zero-key issuers) can be exported to the issuer on request; no verifier code path depends on our API being up. Test: `bench/offline-verify` runs the full suite with the network disabled.

## 5. Governance: who is in the trust list? (S1)
- Onboarding evidence: appears on an official list (AISHE/UGC/ROR), domain control proof, registrar identity via official email + a second channel (phone call logged), signed onboarding form.
- Tiers A/B/C and states from section 1; t-of-n (2-of-3) signing of every registry change by independent trustees (us + two external: e.g. a faculty advisor and an industry/academic partner); changes are public with a diff.
- Dispute channel + 72h takedown for fraudulent issuers; reasons logged.
- UGC publishes a fake-university list; we import it as `fake` state. We could not open the UGC pages from our environment (access errors), so import is a manual, source-cited step.
Residual: we are a new, small trustee. Mitigation: external trustees, transparency, open source.

## 6. Insider fraud and impersonation at the issuer (S1)
Registrar signs fakes for money / attacker phishes the one-tap email.
- One-tap emails go only to the registry's official addresses; links bind to a device-less single-use token; shows what is being confirmed (name, degree, year) so a phished registrar sees it.
- Issuance transparency: daily public count of credentials per issuer and batch roots; sudden spikes alert trustees; per-issuer rate limits; bulk issuance needs two approvers.
- Fast revoke by batch; holder dispute path.
Residual: a corrupt registrar can always sign lies (garbage in). We reduce blast radius and make it detectable after the fact.

## 7. Key compromise and key custody (S1)
- Per-issuer keys in a KMS/HSM; Sigil custody only while the issuer is in zero-key mode; self-custody export path; rotation record; `retiredAt` stops post-compromise issuance (test 20); closing/rotation manifest stops back-dating.
- Our own signing keys: registry trustees use hardware keys; 2-of-3.
- Liability: Terms say Sigil attests *process and evidence*, not that a degree is deserved.

## 8. Who is the person presenting? (S2)
Holder-binding proves the presenter controls the key the issuer bound the credential to. It does not prove the human is Asha. Mitigations: issuer binds the key during enrolment (student logs in with their college email); employer still checks a photo ID at joining; optional IDV partner integration later (we do not build face matching ourselves: privacy, bias, deepfake arms race).

## 9. Names, languages, and messy records (S2)
Name changes (marriage), initials, spelling, Hindi/Marathi transliteration, multiple degrees with similar names.
- Fuzzy match with explicit thresholds; mismatch shows "Name differs slightly: check" not "fake"; allow **name-link claims** (gazette notification, marriage certificate) as W4/W5; show both names to the verifier with the consent of the holder.
- Institution name normalisation via ROR ids + alias table (AI model #4 in AI_MODELS.md).

## 10. Employers: closed, tiny, or uncooperative (S2)
Startups with no HR, firms that shut. Fixes: HR reply by domain DKIM (W3), manager attestation (W5), payroll/PF evidence only as holder-supplied documents (W4); EPFO-style government records are a possible future rail, unverified today. Label every employment claim with its witness; policies like "employment at least W3 for finance roles".

## 11. The AI itself can be wrong or attacked (S2)
- Resume parsing/LLM hallucination: AI output is a *proposal*; the holder confirms every claim; AI never produces "verified".
- Prompt injection inside resumes ("ignore previous instructions..."): extraction runs in a sandboxed, tool-less call with a strict JSON schema; text from documents is data; tests with an injection corpus.
- Deepfake/AI-generated certificates: this is exactly why visual checks are capped at Tier B and signatures matter.
- Fairness: Sigil verifies facts, it never ranks or scores candidates. (Hiring AI is regulated in several jurisdictions; confirm with counsel before adding any scoring.)
- Inclusion: people with old paper degrees, closed colleges, rural institutions must not be punished. Default employer guidance: "Unverified ≠ rejected"; surface the Legacy Desk as the next step.

## 12. Fake seals, fake pages and social engineering (S2)
- Seal copied onto an edited resume: the QR points to the claim hash set. The verifier page offers "drop the PDF you received" and checks the document hash/claims match; mismatch -> red "Edited after sealing".
- Look-alike verification sites: show the issuer name and a domain banner; QR always resolves to our one domain; verifier library prints the domain it checked; HSTS, no third-party scripts.
- Screenshot of a green result: results include the verifier's name, time and a rotating code.

## 13. Privacy and law (S2)
- DPDP Act: purpose limitation, consent receipts, minimisation (no central PII by default), 90-day rights handling, 72-hour breach reporting (dates in docs/research/market.md).
- Linkability: SD-JWT presentations are correlatable through the issuer signature and holder key; we say so; BBS-style unlinkability is roadmap; mitigate with per-verifier salted share links and short expiry.
- Legal status of signatures: our issuer signatures are cryptographic assurance, not necessarily "digital signatures" with statutory weight under Indian IT law; we position Sigil as a verification aid and have counsel review before enterprise claims. (To verify: do not state legal equivalence.)
- Verifier abuse (recruiters over-collecting): purpose field, rate limits, audit log visible to holder.

## 14. Business and execution risks (S2/S3)
- Chicken-and-egg: wedge = students + placement cells + BGV partners; paper bridge and zero-key issuer give value without issuer effort.
- Government competition: DigiLocker/NAD could add resume or employer claims. Position as complement: we consume W2 where available; we own employer claims, resume UX, policy engine, verifier workflows.
- Team of 4 students: strict cut line in docs/WORKFLOW.md; demo path first; every extra is flagged ROADMAP.
- Costs: free-tier limits; status lists are tiny (131,072 bits = 16 KB per list before compression); OCR runs on CPU for pilots.
- Proof of demand: 10 interviews + waitlist + pilot (MASTER_PLAN section 8).
- Foreign degrees and cross-border: roadmap.

## Coverage map (problem -> proof we will show)
| Problem | Demo/test |
|---|---|
| Closed university | `closed` tests (13-17), demo toggle "VIT closes" |
| Fake/derecognised | tests 18-19 |
| Key retired | test 20 |
| No issuer yet | live W3 one-tap + DKIM store |
| Old paper | Legacy Desk e2e with sample scan |
| Sigil dies | offline verify with network off |
| Edited resume | PDF-drop mismatch |
| Prompt injection | injection corpus test |
