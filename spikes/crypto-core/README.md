# crypto-core spike (working, tested)

Run: `node --test` (Node 20+, zero dependencies). 20 tests pass.

What it proves (the trust model of Sigil, end to end):
- Salted Merkle selective disclosure with decoy-leaf padding (hides how many fields exist)
- Issuer signature over the credential header (root, holder key, status pointer, expiry)
- Holder-bound + audience-bound + one-time-nonce presentations (stops borrowed, relayed and replayed proofs)
- Bitstring status list with signed version + max-age policy (stale list rejected)
- 2-of-3 threshold-signed trust list with issuer tiers (A/B/C); fake issuers rejected
- Issuer lifecycle: closed (closing manifest, final status list, custodian), derecognised, fake-listed, key retirement
- Timeline engine (sweep-line) flags overlapping full-time roles

What to change for production (see docs/ARCHITECTURE.md and docs/research/standards.md):
- Use ES256 (P-256) instead of Ed25519 so WebCrypto and passkeys work in every browser
- Swap the hand-rolled disclosure format for SD-JWT VC (RFC 9901 / draft SD-JWT VC) via a maintained library, keep these tests as the behavioural contract
- Swap the status list for the W3C Bitstring Status List encoding (gzip + multibase, >= 131,072 entries for herd privacy)
- Move the trust list to did:web + a transparency log (Merkle log with consistency proofs)
