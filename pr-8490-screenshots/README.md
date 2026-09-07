# Screenshots for PR #8490 — play-only mode blank scroll space

Captured against upstream `sugarlabs/musicblocks` at `e22e8e5`, with and without
the PR's two source changes (`index.html`, `css/play-only-mode.css`) applied.

## Environment

| | |
|---|---|
| OS | Linux 6.18.44 (x86_64), headless container |
| Browser | Chromium 141 (Playwright 1.56.1 bundled build), `--use-gl=swiftshader` |
| Driver | Playwright for Node, Node.js v22.22.2 |
| Server | `http-server` 14.1.1 serving the repo root over `http://127.0.0.1:3001` |
| Viewport | 760 x 590 CSS px, `deviceScaleFactor: 2` |
| Base commit | `e22e8e5` (`fix(statistics): always release the busy state doAnalytics enters (#8495)`) |

The 590px height is below the play-only breakpoint (`innerHeight < 600`), so
play-only mode turns on without needing browser zoom. Both runs load the page,
wait 15s for the stage to settle, click the auxiliary menu (`#toggleAuxBtn`),
then capture.

## Measurements

| | document height | max scroll below the fold |
|---|---|---|
| Before (master) | 1940 px | **1350 px** |
| After (with PR) | 651 px | **61 px** (the fixed play-only banner) |

## Files

- `before-after-comparison.png` — side-by-side, full-page captures at equal width
- `before-fullpage.png` / `after-fullpage.png` — raw full-page captures
- `before-scrolled-to-bottom.png` / `after-scrolled-to-bottom.png` — viewport after scrolling to the bottom
- `before-scrolled-900px.png` / `after-scrolled-900px.png` — viewport at `scrollY = 900`; before reaches 900, after clamps at 61
