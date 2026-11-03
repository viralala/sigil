# CLAUDE.md: Sigil (project Vk26)

You are working with Team Sigil (Viral Dhoka, Tanaya Thorat, Nayan Thakare, Shreenath Utekar; student team, VIT Pune) on **Sigil**: the trust layer for people's claims. It verifies academic certificates AND whole resumes (education, jobs, certificates, skills) with issuer-signed proofs, no per-check lookup to the issuer, and a UX simple enough for a 5-year-old. Hackathon problem: CBL-05 (certificate verification, cybersecurity). Ambition: a venture-scale company, not a demo.

## Read first, in order
0. docs/SUMMARY.md (5-minute overview) and docs/PROBLEMS_AND_SOLUTIONS.md (the hard problems and the Witness Model: obey it)
1. docs/MASTER_PLAN.md (vision, product, scope, moat, business)
2. docs/UX_SPEC.md (the product's soul: obey it)
3. docs/ARCHITECTURE.md and docs/research/standards.md
4. tasks/BACKLOG.md (what to do next) and docs/QA.md (definition of done)
5. docs/research/market.md and docs/research/datasets.md (evidence and data; cite, never invent)

## Stack (decided; change only via docs/DECISIONS.md)
pnpm + Turborepo monorepo. `apps/web` Next.js (App Router, TypeScript, Tailwind, shadcn/ui, PWA). Supabase (Auth, Postgres+RLS, Storage). Vercel deploy. `packages/core` (crypto/trust engine; start from `spikes/crypto-core`, 20 passing tests = behavioural contract incl. closure/rotation). `packages/parser` (resume claim extraction). `services/ocr` (Python FastAPI). Tests: Vitest, Playwright, axe.

## Design system
Theme = CESAC "Fantastic 4" site look: tokens in `design/tokens.json`, CSS in `design/globals.css`. Reference assets live in `D:\Study SY\CESAC` (design-options/f4-home.src.html, instagram/cesac-fantastic-4-story.png, cesac-web/public/cesac-mark.png). Original artwork only: no Marvel characters, logos or the circled-4 emblem.

## Non-negotiable rules
- **Truth over hype.** Never fabricate statistics, customers, benchmarks, logos or quotes. Every number in UI/pitch comes from docs/research/* (with URL) or from a measurement we ran (store the script + output in `bench/`). Demo data is always labelled "Sample".
- **Witness rule.** Never show "verified" without naming who vouched, how and when. No witness = "Not verified", never "fake". AI never decides; it proposes and the holder confirms. Never score or rank people.
- **Everything functional.** No dead buttons, no "coming soon" in the demo path. Each control has handler + loading + error + success state + a test.
- **Simple UI.** One screen, one question, one big button. No jargon in the UI (see UX_SPEC.md vocabulary). Status = colour + icon + word.
- **Security.** Follow ARCHITECTURE.md security list. No secrets in the repo (use `.env.local`, `.env.example`). No PII in logs. Reject algorithm confusion. Nonces are one-time. Run `/verify-all` before every demo or deploy.
- **Privacy by default.** Server stores no credential personal fields by default; consent receipts for every share.
- **Small steps.** One task from tasks/BACKLOG.md at a time; write tests first; tick the box; add a Log line.
- Prefer maintained libraries for crypto and standards; never invent crypto.

## Commands
`pnpm dev` | `pnpm test` | `pnpm typecheck` | `pnpm lint` | `pnpm e2e` | `pnpm a11y` | `node --test spikes/crypto-core/sigil.test.js` (must stay 20/20)
Slash commands in `.claude/commands/`: `/start`, `/verify-all`, `/demo-check`.

## Connectors available in the Claude app (not in Claude Code unless configured)
Supabase org "viralala" (existing project `cesac` is ACTIVE; `patient-tap`, `taral`, `itspune`, `wattway` are INACTIVE; free tier allows 2 active projects, so pause one or upgrade before creating `sigil`). Vercel account has many projects (create `sigil`). Figma (student plan, Full seat). Configure the Supabase and Vercel MCP servers in Claude Code to use them.

## Team roles (proposed; edit freely)
Viral: crypto core, issuance, trust registry. Tanaya: resume parsing, claim routing, timeline engine, trust report. Nayan: wallet, consent, verifier UI, demo. Shreenath: status list, OCR + tamper pipeline, audit log, security tests.
