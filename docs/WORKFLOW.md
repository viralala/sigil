# WORKFLOW (how the 4 of you + Claude Code ship this)

Dates are relative: D0 = the day you start. Compress to your real deadline; if unknown, ask the organisers and write it in DECISIONS.md.

## Daily loop
1. Open Vk26 in Claude Code. Run `/start` (reads CLAUDE.md, BACKLOG, picks next task).
2. One task = one branch `feat/<area>-<slug>`. Test first, implement, run `/verify-all`, commit, PR, merge to main (Vercel preview auto-deploys).
3. End of day: tick BACKLOG, add a Log line, post a 3-line status in your group chat: done / next / blocked.
4. Every 3rd day run `/demo-check` and fix anything red before new features.

## Streams
| Person | Stream | First week |
|---|---|---|
| Viral | Crypto core, issuance, trust registry, API | port spike, ES256, SD-JWT VC, trust list, /api/verify |
| Tanaya | Resume parsing, claim routing, timeline, trust report | parser + claim cards data model, routing table, report |
| Nayan | Web app, design system, wallet, consent, demo | scaffold, landing, /check, components, PWA |
| Shreenath | Status list, OCR/tamper, audit log, security tests, DB | Supabase + RLS, status list, threat tests, OCR service |
Everyone: 1 user interview each (VALIDATION in MASTER_PLAN section 8).

## Phases
- D0-D1 Setup (P0). D1-D4 Public site that works end to end with sample data (P1). D2-D6 Trust engine (P2). D5-D8 Issuer experience (P3). D6-D10 Holder wallet (P4). D8-D13 Verified Resume + Seal (P5). D10-D15 Paper bridge + ML (P6). D12-D16 Verifier pro (P7). D15-D18 Hardening + benchmarks (P8). D18-D21 Demo + pitch rehearsals (P9).
- Cut line if time is short: keep P0-P5 + attack-round tests + measured numbers; drop P6 ML training (keep OCR bridge with pretrained model), P7 bulk, i18n beyond EN/HI.

## Using connectors from Claude Code
Add MCP servers: Supabase (project `sigil`), Vercel, Figma. Verified in the Claude app: Supabase org "viralala" (project `cesac` active; others inactive; free tier active-project cap, so pause one before creating `sigil`), Vercel account with several projects, Figma (student, Full seat). Use Supabase MCP for migrations + RLS advisors (`get_advisors`) after every schema change.

## Git hygiene
Conventional commits, small PRs, no secrets, `.env.example` updated with every new var, CI must pass before merge.

## Definition of done: docs/QA.md. Demo plan: docs/DEMO_SCRIPT.md. Pitch: docs/PITCH.md.
