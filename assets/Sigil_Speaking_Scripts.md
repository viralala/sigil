# Sigil: Speaking Scripts (10 slides, about 5 minutes)

Order of speakers: Viral (1 to 4), Shreenath (5), Tanaya (6 and 7), Nayan (8), Shreenath (9), Nayan (10).
Each part is about 30 to 45 seconds. Say it naturally; do not read word for word.

---

## Slide 1: Title (Viral Dhoka)

Good morning, respected jury. We are team Sigil: Viral Dhoka, Tanaya Thorat, Nayan Thakare and Shreenath Utekar. Our problem statement is CBL-05: how can an employer trust a degree certificate, and a whole resume, quickly, without asking the college to share the student's full record? Our answer is Sigil, and the tagline is: verified by signature, not by phone call. We organised it into four powers: Flame to issue, Stretch for resumes, Shield for privacy, and Rock for trust.

## Slide 2: The problem (Viral Dhoka)

Four things make verification hard today. Forgery is cheap, because a scan can be edited in minutes. Verification is slow, because employers email the registrar and wait days. It over-shares, because a full marksheet is sent to prove one fact. And a central database is a single point of failure. Resumes make it worse: every line is an unverified claim. On the right is exactly what CBL-05 asks us to build, and we cover every point, plus the whole resume.

## Slide 3: Sigil at a glance (Viral Dhoka)

There are three actors. The issuer, the institution, signs each certificate. The holder keeps it in a wallet. The verifier checks it. In the middle is a signed registry that holds only public keys and a signed revocation list, with no personal data. So the verifier never phones the institution: it checks one signature and one signed list. Paper certificates take the first lane at the bottom: scan, OCR, match against records, verdict. A resume takes the second lane: every claim is checked at its source and we return one trust report.

## Slide 4: Issue, then share the minimum (Viral Dhoka, then hand over to Nayan for the four checks)

Issuing has five steps. We collect the fields, salt and hash each one, and build a Merkle tree. The issuer signs the tree's root with an RSA private key, and we package everything with a QR code. This uses three ideas from our course: hash functions, a binary tree of hashes, and modular arithmetic for the signature. If anyone edits one field, its hash changes, the root changes, and the signature fails.
(Nayan:) For privacy, if an employer needs only the degree, the student reveals just that field, in orange, plus two hashes in blue. The verifier rebuilds the root and makes four checks: signature, root, status, and holder, meaning the wallet must answer a fresh challenge, so a borrowed certificate fails. The answer is valid, revoked or invalid, in milliseconds.

## Slide 5: Revocation and paper certificates (Shreenath Utekar)

Revocation uses a signed status list. It is a bit-vector, each certificate has a random index, zero means valid and one means revoked. The issuer signs it with a version number. In our test, certificate 17 is valid. We revoke it, publish version 8, and it shows revoked. If an attacker replays the old version 7, it is rejected as stale. Other certificates are untouched.
For paper certificates there is no signature, so we check the content. We pre-process the scan, read it with OCR, extract name, roll number and serial, and match the serial in the institution's record set using salted hashes, so full records are never shared. The table shows the verdicts: no record is forged, a field difference is altered, the same serial with different names is cloned. Unreadable scans go to manual review, never to accusation.

## Slide 6: Verifying an entire resume (Tanaya Thorat)

Certificates are only part of what an employer wants to trust, so Sigil stretches the same checks to the whole resume. The resume is uploaded or shared from the wallet, claims are extracted and typed, each claim is routed to the evidence that can prove it, verified at the source, and we produce a report. The table shows the routing: a degree uses the issuer signature and status list, a job uses an employer-signed letter, a certification uses the platform's signature, and identity is bound by a fresh challenge. Evidence has three tiers: signed, scanned and matched, or self-declared. No claim is silently trusted.

## Slide 7: The trust report (Tanaya Thorat)

This is a sample report built from demo data. Every line gets a status and a reason. Three claims are verified by signature. One internship has a valid signature, but its dates overlap another internship, so our timeline engine marks it for review rather than accusing the candidate. One certificate is revoked, and the skills are labelled self-declared. We deliberately show reasons instead of one opaque score, so the employer can see why.

## Slide 8: Features beyond the brief (Nayan Thakare)

We added six features, and each closes a real attack. Holder binding stops a borrowed certificate. Threshold proofs let a student prove a grade band without showing marks. The timeline engine catches overlapping dates. Offline verification works without internet and shows how old the list is. Consent receipts and a hash-chained audit log stop history from being rewritten. And a batch API lets a recruiter check many resumes at once. Fake universities are stopped because an issuer that is not in the signed trust list stays unverified.

## Slide 9: Ledger vs signed registry (Shreenath Utekar)

The problem asks us to compare a blockchain ledger with a signed registry. Both are tamper evident. A ledger adds fees, confirmation delay and permanent public data. A signed registry verifies in milliseconds, keeps data off-chain and is cheap to run. Its weakness is availability, which mirrors solve. So for a college we choose the signed registry, and we can optionally anchor its root hash on a public ledger once a day. On the right is our stack: a React web app, a Node or FastAPI backend, standard cryptography, OpenCV with Tesseract, and static signed files for the registry. It is feasible because everything is open source and one college can start alone.

## Slide 10: Demo, team and close (Nayan Thakare)

These ten tests are our live demo. The first six cover the problem statement: valid, tampered, revoked, genuine paper, forged paper, and selective disclosure. The last four show the resume layer: a fully signed resume, an unverified internship, overlapping dates, and a borrowed certificate that fails holder binding. On the right is who built what. Next steps are an institution API, a mobile wallet, OCR for regional languages, and many issuers through a signed trust list. In one line: digital certificates are verified by mathematics, paper certificates by matching records, resumes claim by claim, and the verifier learns only what it needs. Thank you. We are happy to take questions.

---

## Likely questions from the jury

- **Why not a blockchain?** Same tamper evidence at far lower cost and delay, and no permanent public data. We can still anchor the registry root on a ledger once a day. (Shreenath)
- **What if the issuer's key leaks?** Keys are rotated and the old key is marked revoked in the signed trust list; certificates carry a key ID. (Viral)
- **What stops someone using another person's certificate?** Holder binding: the verifier sends a fresh challenge and only the holder's key can sign it. (Nayan)
- **What if OCR misreads a paper certificate?** We use a confidence score and allow small name differences; low confidence goes to manual review, never auto-rejection. (Shreenath)
- **How do you know an employer is real?** Only employers in the signed trust list count as verified; others stay unverified. (Tanaya)
- **Why no single trust score?** A score hides the reason. We show a status and a reason for each claim. (Tanaya)
