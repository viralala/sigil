# Sigil: standards and libraries check (as of 2026-11-03)

Method: every status below comes from opening the primary page with WebFetch. "Analysis" marks my own engineering reasoning, not a spec quote. Anything I could not open is under UNVERIFIED.

## 1. W3C stack
- **VC Data Model 2.0**: W3C Recommendation, 15 May 2025. Its Security Considerations list names replay, cloning, key management, device theft (section 9; only topic names were visible to me).
- **Bitstring Status List v1.0**: W3C Recommendation, 15 May 2025.
  - Minimum list: 131,072 entries (16 KB uncompressed).
  - Encoding: GZIP, then multibase base64url (no padding), in `encodedList`. Index 0 is the leftmost bit.
  - `statusPurpose`: refresh, revocation, suspension, message.
  - Privacy guidance: assign indexes randomly; avoid one-to-one credential-to-list mapping; use caching, CDNs or Oblivious HTTP; be careful with `message` status.
  - No min or max validity period is set.
- **VC Data Integrity**: Recommendation, 15 May 2025. **ecdsa-sd-2023** is in the VC-DI-ECDSA Recommendation of 15 May 2025.
- **bbs-2023** (vc-di-bbs): only a **Candidate Recommendation Draft, 10 Sep 2026**. Optional features (holder binding, pseudonyms) are "at risk" and tied to unfinished CFRG drafts.
- **Digital Credentials API**: only a **Working Draft, 29 Oct 2026** (Federated Identity WG).
  - Shape: `navigator.credentials.get({digital:{requests:[{protocol,data}]}})`.
  - Protocols: `openid4vp-v1-unsigned|signed|multisigned`, `org-iso-mdoc`; issuance `openid4vci-v1`.
  - Needs transient user activation.
  - Browser support (secondary source, Corbado blog dated 2026-10-18, not a vendor page): Chrome 141 shipped (30 Sep 2025), issuance in Chrome 155; Safari 26 shipped, mdoc only; Firefox not shipped (behind a flag, Mozilla position negative); Edge 141. Treat as indicative; verify on caniuse or vendor notes before claiming.
- **DID Core 1.0**: Recommendation, 19 Jul 2022.
- **did:web**: the CCG page shows no status, date or version. It is a community draft, not a standard.
  - Security section: DNS spoofing risk (recommends DoH and DNSSEC), TLS per NIST SP 800-52r2.
  - No key-rotation procedure is defined; it just says update `did.json`.
  - It does not define how writes to `did.json` are authorized.

## 2. IETF, OpenID, ISO, EU, India
- **SD-JWT = RFC 9901**, Proposed Standard, November 2025. Key Binding JWT: `typ: kb+jwt`, `alg` not none, required `iat`, `aud` (single string), `nonce`, `sd_hash`. Verifier checks the signature against `cnf` key. Issuer JWT must not use `none`. Salt: 128 bits suggested; `sha-256` mandatory. The RFC sets no freshness window for `iat`; that is verifier policy.
- **SD-JWT VC**: NOT an RFC. draft-ietf-oauth-sd-jwt-vc-23 (31 Oct 2026), IESG Evaluation, on the 2026-11-05 telechat agenda, intended Proposed Standard. Cite it as "draft, imminent".
- **Token Status List** (draft-ietf-oauth-status-list-21): "RFC Ed Queue", no RFC number yet (datatracker updated 2026-08-13). This is the SD-JWT-native alternative to W3C Bitstring Status List.
- **OpenID4VCI 1.0**: Final, 16 Sep 2025. **OpenID4VP 1.0**: Final, 9 Jul 2025.
- **HAIP 1.0**: Final, 24 Dec 2025. A profile must support at least one of SD-JWT VC or ISO mdoc, not both.
- **ISO/IEC 18013-5:2021** (mDL): published Sep 2021, marked "to be revised" (DIS in progress). I did not open -7. mdoc matters only because wallets, Safari and EU ecosystems use it; Sigil can skip it.
- **IETF BBS** (draft-irtf-cfrg-bbs-signatures-14): CFRG Internet-Draft, 29 Oct 2026, "no formal standing", intended Informational, no RFC.
- **WebAuthn Level 3**: W3C Recommendation, 25 Aug 2026.
- **EU EUDI**: the European Commission page says Member States must provide wallets by "the end of 2026" under Regulation (EU) 2024/1183. ARF v3.0.0 listed as latest on eudi.dev (21 Jul 2026). No exact day given.
- **India**:
  - DigiLocker FAQ (digilocker.gov.in PDF): requesters register on API Setu and need a valid GSTN and Entity Locker registration. Issuers must submit a detailed use case and get approval from the relevant team; issuer onboarding is department-gated. No timelines or document checklist are given. Contact: partners@digitalindia.gov.in.
  - Implication: a student startup can plausibly become a requester (needs a GST-registered entity); issuer status is not realistic soon. I found no India-specific VC standard (see UNVERIFIED).

## 3. Libraries
| Library | Licence | Evidence | Verdict |
|---|---|---|---|
| @sd-jwt/core, @sd-jwt/sd-jwt-vc (OWF sd-jwt-js) | Apache-2.0 | npm latest of sd-jwt-vc is 0.24.2 (date not shown). **The GitHub repo is archived (22 Sep 2026)**; development moved to `identity-common-ts` (page failed to open). README claims compliance with sd-jwt-vc draft-15, and KB implemented. | Usable but pin the version and treat as frozen; or hand-roll SD-JWT with jose (about 300 lines). |
| @credo-ts/openid4vc (OWF Credo) | Apache-2.0 | npm latest 0.7.0 (date not shown). README says it supports OID4VCI, OID4VP, SIOPv2. | Heavy (agent/wallet framework). Option for roadmap, overkill for demo. |
| jose (panva) | MIT | npm latest 6.2.15 | Use. JWS, JWK, key import, algorithm allow-lists. |
| @noble/curves | MIT | npm latest 2.4.0; README mentions an audit of 2.3.0 in Aug 2026; includes bls12-381 | Use for Ed25519/P-256 where needed. |
| @noble/hashes | not opened | n/a | UNVERIFIED |
| walt.id community stack | Apache-2.0 | GitHub page has Issuer/Verifier/Wallet APIs; release not visible. Kotlin/JVM, not TS. | Reference only. |
| Veramo | Apache-2.0 | 1,943 commits on `next`; last-commit date not visible. | Skip; maintenance unclear. |
| Sphereon ssi-sdk | Apache-2.0 | README: "The Typescript SDK is a legacy SDK" in favor of IDK. | Skip. |
| @digitalbazaar/vc | BSD-3-Clause | README describes VC Data Model 1.0 and v1 context; no VC 2.0 statement. | Only for JSON-LD/Data Integrity; not needed. |
| mattrglobal/bbs-signatures | Apache-2.0 | **Deprecated, archived 24 Feb 2025**; successor `mattrglobal/pairing_crypto` (not opened). | Do not use. |
| Tessera (transparency-dev) | Apache-2.0 | Go library; GCP/AWS/POSIX backends; "production ready since Beta v0.2.0". | Go, not TS. Roadmap only. |
| C2SP tlog-tiles | spec | Editor's copy: checkpoints, 256-hash tiles, entry bundles; SHA-256 with RFC 6962 hashing. | Design reference. A minimal signed append-only Merkle log is feasible by hand. |
| Tesseract | Apache-2.0 (README; Leptonica is BSD-2) | v5 line; exact latest not shown | OK. |
| PaddleOCR | Apache-2.0 | 3.7.0 dated 2026-06-11 per README | OK, Python. |
| docTR | Apache-2.0 | PyPI badge v1.1.0 | OK, Python. |

Passkeys for holder binding (analysis, plus WebAuthn L3 status verified above): a passkey signs `authenticatorData || SHA-256(clientDataJSON)` where `clientDataJSON` carries your challenge. It will not sign a JWS signing-input directly. So you can bind a presentation by deriving the challenge from `hash(nonce, aud, sd_hash)` and shipping the WebAuthn assertion as a custom proof, but that is not a standard KB-JWT, and standard SD-JWT verifiers will not accept it. Passkeys are P-256 (ES256), usually non-exportable, and synced passkeys defeat "device-bound" claims. For the demo: software holder key in the browser (WebCrypto non-extractable ES256) producing a real KB-JWT; show passkey binding as a roadmap item.

## 4. Feasibility for 4 people, 2 to 3 weeks
Realistic: SD-JWT VC issue and present with KB (nonce+aud); status list with stapling; did:web issuer keys + signed trust list; resume as multiple credentials; legacy-bridge OCR with record match (Tesseract or PaddleOCR; demo with 2 or 3 sample forms).
Stretch: simplified OpenID4VCI (pre-authorized code) and OpenID4VP (direct_post, request object) subset.
Roadmap only: BBS unlinkability (spec drafts, no maintained TS library found), ZK range proofs (Bulletproofs not researched), full transparency log, DC API, mdoc, passkey binding.

**Minimal architecture**
1. Next.js route handlers on Vercel, Supabase Postgres for issuer, credential-offer, status and registry tables. Keys: for the demo a signing key in env vars; say HSM/KMS is future work.
2. Issuer: SD-JWT VC `typ: dc+sd-jwt` (confirm the exact value in draft-23 before coding; not verified by me), `cnf.jwk`, `status` claim pointing at a status list, `iss` = https origin, keys at `/.well-known/did.json` or JWKS.
3. Wallet: browser web app, WebCrypto holder key, stores SD-JWTs, builds presentation with selected disclosures + KB-JWT.
4. Verifier: fetch/stored trust-list signature check, check signature allow-list (ES256/EdDSA only), check KB `aud` = own origin, `nonce` one-time from server store, `iat` within +/-60s, `sd_hash`, status bit, expiry.
5. Trust registry: JSON document signed by the Sigil root key listing issuer ids, keys, allowed credential types, validity window; version number plus `exp`.
6. Resume = several linked SD-JWTs (education, employment, certs) in one presentation request; each verified independently.

**Build order**: (1) keygen + SD-JWT issue/verify with KB; (2) nonce store and verifier policy; (3) status list issue/check with stapled signed list + `exp`; (4) did:web/JWKS + signed trust registry; (5) wallet UI + selective disclosure UI; (6) resume bundle; (7) OCR bridge; (8) OpenID4VCI/VP subset if time; (9) tamper/replay/revocation demo script.

**Pitfalls** (spec cites where I could verify; otherwise labelled)
- Replay: RFC 9901 requires `aud`, `nonce`, `iat`, `sd_hash` in KB-JWT. The server must make nonces single-use and short-lived; RFC 9901 sets no freshness window (verifier policy).
- Missing KB: RFC 9901 says KB use is verifier policy, so a verifier that does not require it accepts a stolen credential. Require it.
- Algorithm confusion/`none`: RFC 9901 forbids `none` for the issuer JWT and KB-JWT. Pin an algorithm allow-list per issuer key, and never let the token header choose the key type (analysis). RFC 9901 section 9.1 and 9.8 exist but I could not read their bodies.
- Key rotation: did:web defines no rotation; treat key history and `kid` selection as your job. RFC 9901 has a section 9.8 on distribution and rotation (heading only).
- Clock skew: apply a small tolerance (analysis).
- Status list privacy (Bitstring Status List): random indexes; do not give one list per holder; fetch via cache/CDN so the issuer cannot see who is checking. "Stapling" the signed list to the presentation is not in the spec I opened; it is a design choice (an SD-JWT holder can attach a recent signed status list, but then freshness equals the staple's age).
- Disclosure manipulation, salt entropy, hash choice: RFC 9901 sections 9.2-9.4 (headings only).
- Forwarding: RFC 9901 section 9.9 (heading only). Without KB, a verifier can replay the credential elsewhere.

## 5. Claims that need rewording
- "Predicate proof via issuer-signed bands is NOT zero knowledge": the issuer signs a band such as `age_over_18=true` and the holder discloses it. That is selective disclosure of a pre-computed claim, and it leaks the band. Call it "derived-claim disclosure". Real ZK range proofs would need BBS-with-predicates, BBS#, Bulletproofs or SNARKs, none of which is a ratified standard.
- Unlinkability: SD-JWT presents the same issuer signature and `cnf` key every time, so colluding verifiers can correlate holders. RFC 9901 has a Section 10.1 "Unlinkability" (heading only seen). Only BBS offers unlinkable proofs, and bbs-2023 is a CR draft built on a CFRG draft with no RFC.
- "No central lookup": offline verification is possible only if the verifier already holds the trust registry and issuer keys. Status checks and fresh registry/key rotations require network fetches unless stapled and short-lived, and revocation freshness is bounded by the staple's age. did:web depends on DNS/TLS and the web host.
- "Standards-compliant": SD-JWT (RFC 9901), VC 2.0, Bitstring Status List and OpenID4VCI/VP/HAIP are final or Recommendations. SD-JWT VC is still a draft (draft-23), Token Status List has no RFC number, did:web has no formal status, and the DC API is a Working Draft. Say "aligned with" for those.
- "EUDI compatible": EUDI is not tied to your stack by the pages I opened; do not claim interoperability. HAIP 1.0 is the realistic target and you meet it only partially (it expects specific OpenID4VP/VCI profiles and key attestation).
- "Revocation of paper-bridge certificates": OCR plus record match is probabilistic evidence, not issuer attestation. Label bridge outputs as lower assurance and keep them separate from issuer-signed credentials.
- DigiLocker: do not claim integration or issuer status; requester access requires a GST-registered entity.

## Citation table
| Item | Status/version | Date | URL | How verified |
|---|---|---|---|---|
| VC Data Model 2.0 | W3C Rec | 2025-05-15 | https://www.w3.org/TR/vc-data-model-2.0/ | WebFetch |
| Bitstring Status List v1.0 | W3C Rec | 2025-05-15 | https://www.w3.org/TR/vc-bitstring-status-list/ | WebFetch |
| VC Data Integrity | W3C Rec | 2025-05-15 | https://www.w3.org/TR/vc-data-integrity/ | WebFetch |
| VC-DI ECDSA (ecdsa-sd-2023) | W3C Rec | 2025-05-15 | https://www.w3.org/TR/vc-di-ecdsa/ | WebFetch |
| VC-DI BBS (bbs-2023) | CRD | 2026-09-10 | https://www.w3.org/TR/vc-di-bbs/ | WebFetch |
| Digital Credentials API | WD | 2026-10-29 | https://www.w3.org/TR/digital-credentials/ | WebFetch |
| DC API browser support | Chrome/Edge 141, Safari 26 (mdoc), Firefox flag | 2026-10-18 | https://www.corbado.com/blog/digital-credentials-api | WebFetch (secondary source) |
| DID Core 1.0 | W3C Rec | 2022-07-19 | https://www.w3.org/TR/did-1.0/ | WebFetch |
| did:web | no status shown | n/a | https://w3c-ccg.github.io/did-method-web/ | WebFetch |
| SD-JWT | RFC 9901, Proposed Std | 2025-11 | https://datatracker.ietf.org/doc/draft-ietf-oauth-selective-disclosure-jwt/ | WebFetch (RFC text: https://www.rfc-editor.org/rfc/rfc9901.html, headings only) |
| SD-JWT VC | draft-23, IESG eval | 2026-10-31 | https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/ | WebFetch |
| Token Status List | draft-21, RFC Ed queue | 2026-06-21 | https://datatracker.ietf.org/doc/draft-ietf-oauth-status-list/ | WebFetch |
| OpenID4VCI 1.0 | Final | 2025-09-16 | https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html | WebFetch |
| OpenID4VP 1.0 | Final | 2025-07-09 | https://openid.net/specs/openid-4-verifiable-presentations-1_0.html | WebFetch |
| HAIP 1.0 | Final | 2025-12-24 | https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-1_0.html | WebFetch |
| BBS signatures | CFRG draft-14, no RFC | 2026-10-29 | https://datatracker.ietf.org/doc/draft-irtf-cfrg-bbs-signatures/ | WebFetch |
| ISO/IEC 18013-5 | Ed.1 2021, to be revised | 2021-09 | https://www.iso.org/standard/69084.html | WebFetch |
| WebAuthn L3 | W3C Rec | 2026-08-25 | https://www.w3.org/TR/webauthn-3/ | WebFetch |
| EUDI deadline | end of 2026 | n/a | https://digital-strategy.ec.europa.eu/en/policies/eudi-regulation | WebFetch |
| EUDI ARF | v3.0.0 | 2026-07-21 | https://eudi.dev/latest/ | WebFetch |
| DigiLocker onboarding FAQ | FAQ | n/a | https://www.digilocker.gov.in/assets/FAQ%20DL%20EL_onboarding.pdf | WebFetch |
| C2SP tlog-tiles | editor's copy | n/a | https://github.com/C2SP/C2SP/blob/main/tlog-tiles.md | WebFetch |
| Tessera | Apache-2.0, beta v0.2.0+ | n/a | https://github.com/transparency-dev/tessera | WebFetch |
| sd-jwt-js | Apache-2.0, archived | 2026-09-22 | https://github.com/openwallet-foundation/sd-jwt-js | WebFetch |
| npm sd-jwt-vc / credo openid4vc / jose / noble curves | 0.24.2 / 0.7.0 / 6.2.15 / 2.4.0 | n/a | https://registry.npmjs.org/ (package paths) | WebFetch |
| Credo, walt.id, Veramo, Sphereon, jose, noble, digitalbazaar/vc, mattr bbs, Tesseract, PaddleOCR, docTR | licences as in table | n/a | github.com repo pages | WebFetch |

## UNVERIFIED
- Release dates for all libraries (GitHub releases sections were empty in fetches; npm excerpts had no timestamps).
- `identity-common-ts` repo (fetch failed), @noble/hashes, pairing_crypto, Rekor, RFC 6962 / RFC 9162 pages, Bulletproofs libraries, other BBS TS libs.
- RFC 9901 Security and Privacy section bodies (only headings seen); ISO/IEC 18013-7 status; EUDI exact date; sd-jwt-vc `typ` value (`dc+sd-jwt`) and its security considerations text.
- Whether any DigiLocker/NAD issuer API is open to startups (FAQ says approval-gated). India-specific VC standards, NAD API specifics, API Setu page for DigiLocker (apisetu.gov.in page had no DigiLocker content).
- Passkey signing behaviour beyond general knowledge (WebAuthn L3 body not read).
- Firefox/Safari/Chrome support from vendor pages (only a secondary blog).

## Recommended stack and build order
Packages: `next`, `@supabase/supabase-js`, `jose` (all JWS/JWK/KB-JWT signing), Node `crypto` (SHA-256, salts, random nonces), `@sd-jwt/core` + `@sd-jwt/sd-jwt-vc` (pinned; fallback: hand-rolled SD-JWT on jose), `@noble/curves` (optional), `pako`/Node `zlib` for status list GZIP, `tesseract.js` or a PaddleOCR Python sidecar for the bridge (not version-checked). Skip Veramo, Sphereon, Credo and walt.id for the demo.
Order: as in section 4 (steps 1 to 9). Roadmap slides: BBS via `pairing_crypto` once CFRG/W3C finalize, Tessera-based log, DC API, passkey binding, OpenID4VP/HAIP conformance.
