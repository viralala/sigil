# QA and Definition of Done ("functional even the smallest things")

A task is DONE only if all are true:
1. Unit tests written first and passing; crypto-core contract tests still 12/12.
2. Every interactive control: handler, loading, error, success state; covered by a Playwright test on mobile (390x844) AND desktop (1440x900).
3. Axe: zero serious/critical issues. Keyboard-only path works. Screen reader labels present.
4. Copy reviewed against UX_SPEC.md (<= 12-word sentences, no jargon, next action in every error).
5. Works on a throttled connection (Fast 3G profile) and with JS-heavy features degrading gracefully.
6. No console errors, no unhandled promise rejections, no PII in logs.
7. Demo-path screens contain no placeholder text and only labelled sample data.

## Test matrix (minimum)
| Area | Cases |
|---|---|
| Verify | valid, tampered, revoked, stale list, fake issuer, low-tier issuer, expired, wrong audience, replayed nonce, borrowed credential, malformed input, huge input, wrong alg |
| Disclosure | reveal 1 / all / none; hidden fields never appear in payload; decoy padding present |
| Issuer | claim org (domain mismatch rejected), one-click confirm (expired/used token rejected), bulk CSV (bad rows reported, good rows issued), revoke |
| Holder | sign in, passkey, wallet restore on new device, share/expire/stop, consent receipt written |
| Resume | upload PDF/DOCX/photo, wrong-language, scanned, 5-page, injection text inside resume ignored, claim edit, seal export + QR scans |
| Paper | blurry, rotated, glare, cropped, tampered (synthetic), genuine; confidence thresholds route to manual review |
| Verifier | policy levels change verdicts as documented; bulk 500 resumes; webhook retries |
| Security | rate limit, CSRF, RLS (user A cannot read user B), SSRF on URL inputs, file upload abuse, prompt injection in resumes |
| Accessibility | 320px, zoom 200%, reduced motion, screen reader walk, colour-blind simulation |
