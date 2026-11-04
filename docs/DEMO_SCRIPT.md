# Three-minute Sigil demo

## Before the judges arrive

- Open the deployed site on a phone and a laptop.
- Keep a second browser window ready for the verifier.
- Use only Sample records. Do not enter real student data.
- Sign into the Sample issuer console before the pitch if the network is slow.
- Keep `/check` open with the revoked Sample ready as a fallback.
- Do not promise offline checking, email delivery, or a two-second result.

## Run of show

### 0:00–0:15 — The problem

Say: “A resume contains claims from many places. Checking each one can mean chasing each issuer. Sigil puts the witness beside every claim, so the person can share proof without sharing everything.”

### 0:15–0:55 — Turn resume text into claims

Open **My seals**. Enter **Asha Tester** and save. Open the resume screen and paste this labelled sample:

```text
Asha Tester

Education
B.Tech Computer Engineering, Sample Deccan Institute of Technology, 2022 - 2026

Experience
Software Intern, Sample Kestrel Systems, Jun 2025 - Aug 2025

Skills
Python, TypeScript
```

Tap **Read**. Review the proposed cards, then tap **Keep these claims**.

Say: “The parser suggests claims. Asha chooses what to keep. The parser does not verify anything.”

### 0:55–1:35 — Ask an issuer and show its witness

On the education card, tap **Ask to confirm**. Choose **Sample Deccan Institute of Technology** and send the request. Open **Sign for my students**, choose the Sample demo, and approve Asha’s request. Return to the wallet and refresh.

Say: “This is a Sample registrar console. The claim now shows who confirmed it and when. This demo does not send email.”

### 1:35–2:20 — Share only what is needed

Open **Share**. Review the consent screen, create the share, and open its link in the second browser window.

Say: “The holder chooses what the recruiter sees. The verifier sees the witness and the reason. With a stricter policy, this registrar confirmation becomes ‘Partly checked’ instead of a green result.”

Select the strict policy to show that change. Return to the normal policy for the next step.

### 2:20–2:45 — Show a failed claim honestly

Open **Check someone** and choose the revoked Sample. Point to the red result and its reason.

Say: “This one was withdrawn by its Sample issuer. When nobody vouches for a claim, Sigil says ‘Not verified’; it does not call the person fake.”

### 2:45–3:00 — Close and ask

Say: “Today, the working path is claim review, Sample issuer confirmation, consented sharing, and verification. Email delivery, offline checking, and production issuer onboarding are not in this demo yet. We’re looking for a placement-cell pilot and recruiter feedback to test the workflow with real issuers.”

## If a live step fails

- If the issuer console is slow, show the prepared revoked Sample in `/check`.
- If the share link cannot open, show the already-open Sample verifier tab.
- If the network fails, switch to the 56-second film on `/about`. Say that it is a product overview, not proof that offline verification is built.
- If the demo data is missing, stop and use the film. Do not describe a simulated step as live.

## Claims to avoid

- “Verified in two seconds”: no latency benchmark is recorded.
- “Works offline”: the current service worker does not cache verification.
- “One-tap email”: confirmation happens in the Sample issuer console.
- “Paper forgery detector”: the image model is experimental and its held-out evaluation is not complete.
- “We have a pilot” or “customers”: none are recorded.
