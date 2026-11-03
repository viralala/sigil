# UX spec: "a 5-year-old can use it, and every button works"

Design rule zero: one screen = one question = one big button. No jargon on screen. Words we use: **Seal** (a verified proof), **Share**, **Check**, **Hide**. Words we never show: hash, Merkle, credential, DID, nonce, JWT (they live in an "Details for nerds" drawer).

Theme: CESAC Fantastic 4 (see design/tokens.json and design/CESAC_REFERENCE.md): cream paper, navy outlines, hard shadows, royal/flame/ember accents, Big Shoulders headings, rounded-rectangle buttons (never pills). Status is always colour + icon + word.

## Three roles, three front doors (landing page has three giant tiles)
1. **I want to get verified** (student / candidate = holder)
2. **I want to check someone** (employer / HR / verifier)
3. **I want to sign for my students / staff** (college / company = issuer)

## Holder (verifiee) flows
H1 Get started: phone/email magic link -> name -> done (3 taps). Passkey created silently (Face/Touch ID). No passwords, no seed phrases.
H2 Build my Verified Resume: "Upload your resume" (drag, camera, or paste). We read it and show **cards**, one per claim (Degree, Internship, Certificate, Skill). Each card has ONE button:
   - If a college/employer is in the registry: **"Ask VIT Pune to confirm"** (sends them a one-click link).
   - If it is a paper certificate: **"Take a photo"** (OCR + tamper check) -> yellow "Looks genuine, waiting for college" or green.
   - Otherwise: **"It is just my word"** (self-declared, grey).
   Cards flip to green with a tick, a chime and a tiny confetti (respect reduced motion).
H3 Share: **"Share my resume"** shows a QR + link + "Send on WhatsApp". Before sending, a plain screen: "They will see: ✔ Degree ✔ Year. Hidden: Grade, Birth date" with toggles. Expiry chip "Link works for 7 days" (changeable). One tap **"Stop sharing"** anytime.
H4 My activity: who looked, when, what they saw (consent receipts). Delete/revoke buttons.
H5 Lost phone: "Recover with my college email" (issuer-assisted re-binding) + optional printed recovery code.
H6 Language switcher (EN, हिन्दी, मराठी first), voice read-out button (Web Speech API) on every result screen.

## Verifier (employer) flows
V1 Scan or paste (no account needed for first 3 checks): big camera button, or paste link. Result in < 2 seconds.
V2 Result screen = traffic light: giant ✔ GREEN "Real" / ⚠ YELLOW "Check this" / ✖ RED "Not real", then a plain sentence ("Asha Verma finished B.Tech at VIT Pune in 2026. Checked just now.") and a list of claims with their own lights. "Why?" opens reasons in plain words. "Details for nerds" shows signatures, issuer, list age.
V3 Policy (account): sliders "How strict?" (Relaxed / Normal / Strict) mapping to tier + max status age. Advanced rules hidden.
V4 Bulk: drop a folder or CSV of resumes -> progress bar -> table with filters (Real / Check / Not real) -> export CSV/PDF report -> ATS webhook.
V5 Audit: every check is logged (who, what, result) for compliance.

## Issuer (college / employer) flows
I1 Claim my organisation: pick from the pre-filled registry (UGC/AISHE/ROR seed) or add; prove ownership via domain email (+ DNS TXT optional). 2 minutes.
I2 One-click confirm: HR/registrar gets an email "Asha Verma says she interned with you (Jun–Aug 2025). Confirm?" [Yes, that is right] [No]. Yes = a signed Seal is created. No key handling (Sigil custodies keys in KMS until the org upgrades to self-custody).
I3 Bulk issue: upload CSV (roll no, name, degree, year, email) -> preview -> **Issue all** -> students get email/WhatsApp link. One signature per batch.
I4 Revoke / suspend with reason code, notify holder, dispute inbox.

## Content design rules
- Sentences <= 12 words. Reading age 8. Every error says what happened AND the next action ("The photo is blurry. Try again in brighter light.").
- Icons carry meaning (✔ ⚠ ✖ 🔒 👁) but never alone.
- Empty states always offer a button, never a blank page.
- Loading states show what is happening ("Checking VIT Pune's signature...") never a bare spinner.

## Accessibility and robustness (non-negotiable)
WCAG 2.2 AA, 56px tap targets, focus rings, screen-reader labels on every control, keyboard path for every flow, reduced-motion support, works at 320px width and on 3G, installable PWA, offline verify of already-cached trust list, i18n-ready strings (no hard-coded text).

## "Everything works" rule
No dead buttons. Every control has: a handler, a loading state, an error state, a success state, and a Playwright test. If a feature is not built, the control is not shown (no "coming soon" in the demo path).
