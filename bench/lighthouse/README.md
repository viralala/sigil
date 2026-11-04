# Lighthouse runs (local production build)

Measured 2026-11-04 on Viral's Windows laptop, `next build && next start -p 3200`, Lighthouse 12 default
mobile emulation with simulated throttling, Microsoft Edge headless. Raw reports: `home.json`, `check.json`,
`get-verified.json`, `sign.json` in this folder.

| Page | Performance | Accessibility | Best practices | LCP | TBT | CLS |
|---|---|---|---|---|---|---|
| `/` | 97 | 100 | 100 | 2.4 s | 80 ms | 0 |
| `/check` | 97 | 100 | 100 | 2.5 s | 50 ms | 0 |
| `/get-verified` | 97 | 100 | 100 | 2.5 s | 60 ms | 0 |
| `/sign` | 97 | 100 | 100 | 2.5 s | 50 ms | 0.004 |

First run scored 76 to 84 on performance. Fixes that got it to 97: hero heading no longer fades in from opacity 0;
display font switched to fixed 800/900 weights with `display: "optional"` (no swap, no shift); QR decoder loaded
only when the camera opens; footer mark served as a 96px PNG (4.6 KB) instead of the 113 KB original.

These are lab numbers on one machine, not field data. Re-run before quoting them anywhere:

```bash
pnpm --filter web build && pnpm --filter web start -p 3200
CHROME_PATH="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" npx lighthouse@12 http://localhost:3200/check --chrome-flags="--headless=new" --only-categories=performance,accessibility,best-practices --output=json --output-path=bench/lighthouse/check.json
```

## Fresh production run

Measured 2026-11-04 after the local font and contrast updates. Lighthouse 13.6.0,
headless Chrome 156, default mobile emulation and throttling, production build on port 3102.
Raw reports: `current-home.json` and `current-check.json`.

| Page | Performance | Accessibility | Best practices | LCP | CLS |
|---|---:|---:|---:|---:|---:|
| `/` | 91 | 100 | 100 | 1.03 s | 0 |
| `/check` | 100 | 100 | 100 | 0.91 s | 0.0002 |

The first fresh run found low contrast in the scrolling home-page words and witness list.
Their resting opacity was too low before a visitor scrolled. We raised it and reran both pages.
These remain lab measurements from one machine, not field performance data.
