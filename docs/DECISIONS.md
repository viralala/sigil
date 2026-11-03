# DECISIONS (ADR log; add a line when you change anything here)

| # | Decision | Why | Revisit if |
|---|---|---|---|
| 1 | Signatures: ES256 (P-256) in production; Ed25519 in spike only | Broad WebCrypto/browser/KMS support | A required library mandates otherwise |
| 2 | Credential format: SD-JWT VC aligned (RFC 9901 final; SD-JWT VC still draft), KB-JWT with nonce/aud/sd_hash/iat | Standards path, smaller custom crypto surface | SD-JWT VC changes `typ` or claims at IESG |
| 3 | Library: jose + @noble/curves; SD-JWT hand-rolled or pinned @sd-jwt/sd-jwt-vc | Upstream sd-jwt-js archived Sep 2026 | Maintained successor stabilises |
| 4 | Status: W3C Bitstring Status List encoding, signed wrapper + staple, max-age policy | Final spec, herd privacy (>=131,072 entries) | Token Status List becomes RFC |
| 5 | Trust: signed JSON trust list at /.well-known, 2-of-3 threshold, tiers A/B/C, did:web | Simple, cacheable | Need transparency log |
| 6 | Holder binding: wallet key (non-extractable WebCrypto) for KB-JWT; passkeys roadmap | Passkeys cannot produce standard KB-JWT | WebAuthn-based binding spec matures |
| 7 | Stack: Next.js+TS+Tailwind+shadcn PWA, Supabase, Vercel, FastAPI OCR | Team speed, connectors available | Hitting free-tier limits |
| 8 | ML: pretrained OCR/VLM + rules; light fine-tune on synthetic data only | Licences, no real forgery data | Real labelled data obtained legally |
| 9 | No claims of DigiLocker/EUDI interoperability | Not verified / not built | Actually integrated |
| 10 | Deployment URL, hackathon deadline | TO FILL: ask organisers | |
| 11 | Witness model: every claim names who vouched, how, when (W1-W5) | Honest answer to cold start, closure, legacy | Never |
| 12 | Registry lifecycle states: active/suspended/merged/renamed/closed/derecognised/fake + key history | Closure and rotation must not break old credentials | Regulator rules change |
| 13 | Closed issuer: closing manifest + final status list + custodian | Blocks back-dated forgeries, avoids false "stale" | Large manifests: move to Merkle root + inclusion proof carried in credential |
| 14 | Zero-key issuer uses recorded mandate + DKIM-stored confirmation, Tier B+ until issuer self-signs | Needs no issuer setup | Security review finds inbox risk too high |
| 15 | Credentials must outlive Sigil: open spec, static verification, mirrors, escrow | Trust and judge question | Never |
| 16 | No scoring/ranking of people; no face matching built in-house | Bias, law, privacy | Counsel advice |
| 17 | AI proposes, humans confirm, rules/signatures decide | Hallucination and injection risk | Never |
| 18 | Legal custody of records after closure in India | UNKNOWN; ask registrar + lawyer | Before pilot |
| 19 | Look = shipped CESAC Fantastic 4 theme (cesac-app/src/themes/fantastic-four.css): Big Shoulders/Figtree/Space Mono, cream #FFF5E3, royal #1F6FD1, navy #0B2350, rounded-rect buttons (never pills). Replaces the Antonio/Inter placeholders | That theme is what CESAC actually shipped; placeholders were guesses | Team picks a different CESAC direction |
| 20 | Display font uses `display: "optional"` | Swap caused layout shift (CLS 0.12) and slow LCP; optional gave CLS 0 and perf 97 | First-visit headings in the fallback face look wrong on slow networks |
| 21 | Spike command is `node --test spikes/crypto-core/sigil.test.js` | On Node 24, `node --test <folder>` runs the folder as a script and fails | Never |
| 22 | Demo sample world: fresh keys per server start, kept in memory, holder wallet simulated server side; everything labelled Sample | Real issue->present->verify path with no database yet | Before deployed demos: persist in Supabase |

