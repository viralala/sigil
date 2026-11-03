# Architecture (v1: ship in weeks, scale later)

## Principles
1. **Zero lookup at verification time**: verifier needs only the presentation + cached trust list + cached status list (static, signed, CDN-served).
2. **No PII at rest on our servers by default**: credentials live in the holder's wallet (client-side encrypted backup). Server keeps headers, status bits and audit metadata only.
3. **Standards first**: W3C VC 2.0 data model, SD-JWT VC, OpenID4VCI/VP, Bitstring Status List, did:web (verify versions in docs/research/standards.md).
4. **Explainable results**: every verdict returns machine-readable reason codes + a plain-language sentence.

## Components
| Component | Tech | Notes |
|---|---|---|
| Web app (holder, verifier, issuer, landing) | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, PWA | Deploy on Vercel. Theme from design/tokens.json |
| Auth | Supabase Auth (email magic link, Google) + passkeys (WebAuthn) | Holder key = passkey or WebCrypto non-extractable ES256 key |
| DB | Supabase Postgres + RLS | Tables below |
| Storage | Supabase Storage (encrypted blobs, resume uploads, auto-delete 24h) | |
| Crypto core | `packages/core` (start from spikes/crypto-core) | ES256, SD-JWT VC adapter, status list, trust list |
| Resume + claim extraction | LLM extraction (structured output) + rules; holder confirms every claim | Prompt + JSON schema in `packages/parser` |
| OCR + tamper service | Python FastAPI (PaddleOCR/Tesseract/docTR + forensic checks) on Fly.io/Render/HF Space | Vercel cannot host heavy OCR; browser `tesseract.js` fallback for demo |
| Trust registry | Static signed JSON on CDN + `/.well-known` + transparency log | Seeded from public datasets (docs/DATASETS.md) |
| Bulk + webhooks | Supabase queue (pgmq) or Vercel cron + edge functions | |
| Observability | Vercel Analytics, Sentry, structured audit log (hash-chained) | |

## Data model (Postgres, sketch)
- `organizations(id, name, type[college|employer|platform], domain, country, source[ugc|aishe|ror|gleif|manual], status[listed|claimed|verified], tier[A|B|C])`
- `issuer_keys(id, org_id, kid, alg, public_jwk, kms_ref, status[active|retired|revoked], created_at)`
- `trust_list_versions(version, body_json, signatures_json, published_at)`
- `status_lists(id, org_id, version, bits_b64_gz, signature, issued_at)`
- `credential_headers(id, org_id, kind, holder_thumbprint, status_list_id, status_idx, issued_at, expires_at)`  (no personal fields)
- `profiles(user_id, display_name, locale, passkey_ids)` ; `wallet_blobs(user_id, ciphertext, nonce, updated_at)` (client-side encrypted)
- `share_links(id, user_id, audience_hint, disclosed_fields, expires_at, revoked_at)`; `consent_receipts(...)`
- `verification_events(id, verifier_org_id, result, reason_codes, at, prev_hash, hash)` (hash-chained)
- `confirm_requests(id, claim_json_hash, org_id, to_email_hash, token_hash, status, expires_at)` (one-click issuer confirmations)

## Key flows
1. **Issue**: issuer (or one-click confirm) -> `packages/core.issue()` -> credential delivered to holder wallet (OpenID4VCI-style offer link/QR).
2. **Present**: verifier creates challenge `{nonce, aud, exp}` -> holder wallet shows consent screen -> builds SD-JWT presentation with key-binding JWT -> POST to verifier endpoint (OpenID4VP-style).
3. **Verify**: check trust list (t-of-n signed) -> issuer tier policy -> credential signature -> key binding (nonce, aud, exp) -> disclosures -> status list freshness + bit -> reason codes.
4. **Paper bridge**: photo -> OCR -> field extraction -> forensic tamper score -> match against institution record commitment or request issuer confirm -> Tier B seal (never Tier A).
5. **Revoke**: flip bit, version+1, re-sign, publish, CDN purge; holders notified.

## Threat model (see Appendix in docs/MASTER_PLAN.md for the list); security non-negotiables
- Reject `alg=none`/algorithm confusion; pin allowed algs (ES256, EdDSA).
- One-time nonces stored with TTL; audience must equal verifier origin; clock-skew <= 60s.
- Constant-time compares; no secrets in client bundle; KMS-held issuer keys with rotation; rate limits on all public endpoints.
- Uploaded files scanned, size-limited, auto-deleted; EXIF stripped; no PII in logs.
- DPDP Act aligned: purpose limitation, consent receipts, erasure, breach runbook.

## Issuer lifecycle (added 2026-11-03; reference implementation in spikes/crypto-core tests 13-20)
Trust-list entry fields: id, pub (one entry per key), tier, state (active|suspended|merged|renamed|closed|derecognised|fake), since (derecognised), closedAt + custodian + manifest (header ids) + finalStatusVersion + finalStatusSigner (closed), retiredAt (key rotation). Verifier rules: fake -> fail; iat > retiredAt -> fail; derecognised and iat >= since -> fail, else warn; closed -> require iat <= closedAt AND header id in manifest, use final status list (no max-age), warn with custodian. Production: replace manifest array with a Merkle root and carry an inclusion proof in the credential; store key history in the registry; sign every registry change t-of-n.
Witness data: claim.witness = { level: W1..W5, by, method, at, evidenceRef }. Legacy twin credentials carry source=paper-legacy, originalSerial, attestedBy.

