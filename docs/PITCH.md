# Sigil pitch and judge Q&A

## One-line description

Sigil lets people share checkable resume claims, with each claim showing who vouched for it.

## Three-beat story

### 1. The problem

Resume claims come from many institutions and employers. Checking them often means contacting each source or relying on paperwork. A forged document can also look convincing: the June 2026 Kanpur seizure included 141 rubber stamps, 80 hologram strips, and 830 blank marksheets. [Source and caveats](research/market.md)

### 2. The insight

Keep the evidence with the claim. The holder chooses what to share. The verifier sees who vouched, how, and when. A missing witness means **Not verified**, never “fake.” A signature can be checked from the credential and static trust and status files; a verifier need not call the issuer for each check.

### 3. What works today, and what comes next

The current demo parses pasted resume text into editable Sample claims, routes a request to a Sample issuer console, records the issuer confirmation, lets the holder choose fields to share, and lets a verifier inspect the result. The browser and end-to-end checks cover this path on mobile and desktop.

The demo does not send registrar emails, verify real institutions, work offline, or prove a two-second latency. The paper image model is experimental; its compatible held-out evaluation is still pending. We have not recorded customers, a live pilot, or user interviews.

Our next ask is a placement-cell pilot and recruiter feedback. We need to learn whether issuers will confirm claims and whether verifiers trust the witness labels.

## Suggested close

“Sigil does not ask you to trust a green badge. It shows the witness behind each claim. Help us test that with a placement cell and the people who check resumes.”

## Business model hypothesis

- Holders use the wallet and share claims for free.
- Issuers can start with no-cost confirmation; paid bulk issue, SSO, custom domains, and support are hypotheses to validate.
- Verifier usage pricing and BGV partnerships are hypotheses, not signed deals or measured demand.
- Do not give an INR price until customer interviews support one.

## Judge Q&A

**Why not blockchain?**
The trust and status data can be signed and mirrored as files. A public chain would add cost and expose permanent metadata without replacing issuer trust.

**How can this work without phoning a college?**
The issuer signs the credential once. A verifier checks the signature and the signed trust and status data. This is the product design; the demo currently uses Sample records.

**Is this zero-knowledge?**
No. The holder selects which signed claims to disclose. Some derived values are issuer-signed. Zero-knowledge range proofs are not built.

**Who confirms claims today?**
In the demo, a Sample issuer approves a request in the Sigil console. Email delivery and real issuer onboarding are not built.

**What if no issuer is available?**
We keep the claim labelled “Not verified” or route paper records for a limited document check. A paper check is weaker evidence and cannot establish truth by itself.

**What does the paper model prove?**
Nothing by itself. It emits image irregularity signals. The current validation AUC is about 0.59 and its false-accept rate is high; compatible held-out evaluation remains incomplete. Never present it as a forgery detector.

**What about privacy?**
The holder chooses fields to share and receives a consent record. Server storage and issuer confirmation are described in [the architecture](ARCHITECTURE.md). Do not claim legal compliance has been independently reviewed.

**What have you validated with customers?**
We have no recorded interviews, paying users, or pilot. That is what the next placement-cell and recruiter conversations should test.

**What does it cost?**
We have a proposed model, not validated pricing. We will set local pricing after interviews.

## Sources and evidence discipline

- The Kanpur figures and their source caveats are recorded in [market research](research/market.md).
- Do not say “verified in two seconds”; there is no latency benchmark.
- Do not say “works offline”; offline verification is not implemented in the current demo.
- Sample records must be called **Sample** during the pitch.
- Only quote additional market figures when their source and caveat are on the slide.
