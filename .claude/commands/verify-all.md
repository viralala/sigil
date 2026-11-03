---
description: Run the full quality gate before any demo or deploy
---
Run, in order, and fix anything red before continuing: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `node --test spikes/crypto-core/sigil.test.js` (must stay 20/20), `pnpm e2e` (Playwright, mobile + desktop), `pnpm a11y` (axe), and a Lighthouse run on the landing page and /verify (target >= 90 performance, 100 accessibility). Then walk docs/DEMO_SCRIPT.md click by click and report any step that fails or takes more than 3 taps.
