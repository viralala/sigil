# PITCH NARRATIVE AND JUDGE Q&A

## Story (3 beats)
1. Pain: a degree can be faked with a rubber stamp kit (Kanpur, Jun 2026); checking it takes days and costs per check; 11% of employment claims show discrepancies (AuthBridge).
2. Insight: stop asking the issuer every time. Make the claim itself checkable: signed by the issuer, carried by the holder, revealed minimally.
3. Product + business: Verified Resume with a seal on every PDF; free for students and colleges; employers pay per verified resume; BGV firms are channel partners.

## Slide additions (update the 10-slide deck only with REAL screenshots and measured numbers)
Problem stats slide (sourced), Live product screenshots, Attack-round results table (from tests), Benchmarks (from bench/), Business model + wedge, Roadmap with honest "not yet" list, Validation (interviews done, waitlist, pilot ask).

## Judge Q&A
- Why not blockchain? Same tamper evidence without fees/delay/permanent public data; anchor optional.
- How do you avoid a central lookup? Verification needs the signed registry + status staple, both static/cacheable; no call to the issuer per check. Staleness is bounded and shown.
- Is it zero-knowledge? No. Selective disclosure hides fields; bands are issuer-signed derived claims. ZK range proofs are roadmap.
- Cold start? Zero-key issuer (one-tap email confirm) + paper bridge; registry pre-seeded from open data.
- Why will colleges sign? Saves registrar mail, protects brand, free, no new infrastructure.
- Fake issuer? Not in the signed trust list => Unverified; tiers A/B/C; t-of-n trust-list signing.
- Privacy law? DPDP: minimal disclosure, consent receipts, no central PII by default; erasure path documented.
- Competitors? BGV look up, badge platforms serve issuers, IDV verify people; we verify claims, offline.
- Is this standard? Aligned with SD-JWT (RFC 9901), W3C VC 2.0, OpenID4VC; SD-JWT VC is still a draft.
- Biggest risk? Issuer adoption and key custody. Mitigations: zero-key issuer, KMS, rotation via trust list.
- What did you measure? Show bench/ numbers; say "synthetic" where it is.
