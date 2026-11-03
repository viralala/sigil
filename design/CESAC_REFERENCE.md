# CESAC reference: what Sigil took, from where, and what it left behind

Source folder (read only): `D:\Study SY\CESAC`. Studied on 2026-11-04 before any Sigil UI was written.

## What we studied

| Source | What it gave us |
|---|---|
| `cesac-app/src/themes/fantastic-four.css` | **Primary source.** The shipped site theme: cream/ink/royal/navy tokens, hard outline + offset shadows (`--sh-1/2/3`), radii 12/14/18/26/36, halftone grounds, "never pill shaped" rule, components-layer arrangement. |
| `cesac-app/src/components/f4/f4.css` | Home-page look: `.btn` (rounded rect, 2px navy, 4px shadow, hover lift + -1deg tilt, press sink), power `.card` (3px outline, 6px shadow), `.eyebrow` (mono caps between two flame stars), `.spark` (four-point star + twinkle), `.tag`, motion curves. |
| `cesac-app/src/components/f4/bits.tsx`, `powers.tsx` | The four powers and their colours (flame, stretch, shield, rock). We kept the colours and the card pattern; we did **not** port the captions that name Marvel characters. |
| `cesac-app/src/app/layout.tsx` | Font families via next/font: Big Shoulders (display, opsz), Figtree (body), Space Mono (labels), Shrikhand (script). |
| `cesac-web/src` (app, components, lib) | Same structure as cesac-app (cesac-app is the newer copy). Conventions reused: tokens not raw colours in pages, `.label` / `.d-wide` style classes, no PII in logs, security headers in `next.config`. |
| `design-options/f4-home.src.html`, `f4-hero.src.html`, `fantastic-four.src.html`, `cesac-directions.html`, `build_f4_hero.py` | The four explored directions (Observatory, Beam, Quarters, Title Card). The cream "Title Card" direction matched our placeholders, but its hero draws a circled 4, so we took only its framed-panel idea (used in the explainer). |
| `instagram/cesac-fantastic-4-story.png` | Confirms the print palette: royal ground with halftone dots, cream, ember with navy outline, flame rule, navy panel. |
| `New inspo/` (`Fantastic 4.webp`, `logo.jpeg`, others) | Mood only. `Fantastic 4.webp` is Marvel-branded lettering, so nothing from it is copied. |
| `cesac_stats_card.png` | CESAC's own measured numbers. Not reused: they are not Sigil's numbers (truth rule). |
| `CESAC_PRD_for_Claude_Code.pdf` | Conventions carried over: no pill buttons, no emoji icons (SVG line icons), no em dashes in copy, no fake metrics/reviews/counters, validate every route and form before calling it done. Its dark Space Grotesk palette is the *older* direction, superseded by Fantastic 4. |

## Where our placeholders differed (and what we changed)

| Placeholder (before) | CESAC shipped value (now) |
|---|---|
| Antonio + Inter | Big Shoulders + Figtree + Space Mono (+ Shrikhand for flourishes) |
| cream `#F0ECE4`, navy `#0C1F3F`, cobalt `#2F6FD6` | cream `#FFF5E3`, ink `#0A1A33`, navy `#0B2350`, royal `#1F6FD1` |
| flame `#E8622F`, gold `#F5A524` | flame `#FF6A2B`, ember `#FFB23A` |
| pill buttons (`border-radius: 999px`) | rounded rectangles (14px); pills are banned in CESAC |
| one shadow `4px 4px 0` | three steps `2/4/6px`, plus hover lift and press sink |
| dotted bg 36px | halftone 18px dots |

Status colours (ok/warn/bad) are Sigil additions; CESAC has no traffic light. Each is paired with an icon and a word.

## Copied into `apps/web/public/cesac/`

| File | From | Why |
|---|---|---|
| `cesac-mark.png` | `cesac-app/public/cesac-mark.png` (identical to cesac-web's) | Team branding in the footer, recoloured by CSS mask. |
| `cesac-logo.png` | `cesac-app/public/cesac-logo.png` | Team branding (about/credits, pitch). Not used as Sigil's logo. |
| `award-fonts/*.woff` + `OFL.txt` | `cesac-app/public/award-fonts/` | Cormorant Garamond, Great Vibes, Playfair Display, Inter (all OFL). Kept for the Sigil Seal PDF/certificate export (P5). Not loaded by any page yet. |

## Deliberately not copied

- `audio/attack-on-token.mp3`: its own README says the licence needs checking before public use.
- `aot/`, `people/`: CESAC event art and real people's photos; not Sigil content.
- Anything with a circled 4, Marvel names, logos or characters.

## Sigil's own artwork

`SigilLogo` (`apps/web/src/components/site/sigil-logo.tsx`, `public/icon.svg`) is original: a rounded-square stamp with a dashed inner border, an ember four-point spark and a tick. It is not the CESAC mark and not a circled 4.

## Ported components

| Sigil | Ported from |
|---|---|
| `Button` (`components/ui/button.tsx`, `.btn`) | f4.css `.btn` + theme `.pill` (radius 14px, sh-2, hover/press) |
| `Card` (`.card`) | theme `.card` |
| `BigTile` (`.big-tile`) | f4 power cards (`.card` 3px/6px, k-flame / k-stretch / k-rock colourways) |
| `StatusBadge` | CESAC `.tag` shape, Sigil traffic-light colours |
| `.eyebrow`, `.spark`, `.halftone*`, `.label`, `.cesac-mark` | f4.css / theme, unchanged in spirit |
| Explainer frames | f4-home Title Card `.t-frame` idea, without characters |
