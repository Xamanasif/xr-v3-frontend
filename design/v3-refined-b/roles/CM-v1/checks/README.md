# checks/ — machine results and the scripts that produced them

All results here come from the final verification run on the final build (canvas version 20; `project/` as shipped in this package), after the last design change. `boards.json` was rendered again on the exact shipped files after one rule that matched nothing was removed from `cm.css` (see `CHECKS.md`). `CHECKS.md` explains what the results prove and what they don't.

## results/

| File | What it is |
| --- | --- |
| `journeys.json` | 11 scripted journeys, one row per assertion: journey, step, pass, what was read back. |
| `links.json` | Link crawl: every visible control with a declared destination, clicked from a fresh copy of each starting state, and the heading it landed on. Raw output: the refusal start state is labelled “AR-10” (the v46 message-template code); `LINK-MAP.json` calls it XS-06. |
| `boards.json` | All 85 inspection wrappers rendered at their canvas frame size: heading, content height against frame height (`fitsFrame`), page scroll width (`scrollW`) and the number of elements outside the frame horizontally (`overflowEls`), every console error or warning (`errs`, unfiltered), failed requests (`bad`). `ok` is false for the 5 overlay boards only because the page under the overlay is taller than the window-sized frame. |
| `board-heights.json` | The natural content height measured for every board (`old` → `h`), used to set each frame. |
| `sweep-1440.json` · `sweep-1024.json` · `sweep-768.json` · `sweep-375.json` | The representative states at each width, full page: horizontal overflow, clipped text, targets under 24 px, smallest text, console output, failed requests. |
| `sweep-overlays.json` · `sweep-overlays-375.json` | Publish, Send and Withdraw dialogs, the drawer and the account menu at 1440 and at 375. |
| `focus.json` | Keyboard-only captures: how many Tabs, which element, its computed focus outline. |
| `fonts.json` | Every visible text size under 13 px on the sweep states at 1440 and 375, with samples. |
| `unresolved.json` | Per state, any template value the runtime could not resolve (“never resolved — rendered as empty”) and any other console output. |
| `selectors.json` | Every selector in `cm.css` and how many elements it matched across the 85 boards. |
| `world-check.txt` | The sample world inside `Main.dc.html` compared with the version-15 world. |

## scripts/

| File | Purpose |
| --- | --- |
| `harness.mjs` | Serves the canvas files locally and fulfils the runtime's CDN and font requests from local npm copies. |
| `run-all.sh` | Runs everything below in order into one results folder. |
| `journeys.mjs` | The journeys (real clicks, typing and keys), including J10 busy states and J11 list loading / couldn't load. |
| `links.mjs` | The link crawl. |
| `verify-wrappers.mjs` | Renders each canvas wrapper at its frame size. |
| `measure-boards.mjs` | Measures each board's natural content height (frames are set from it). |
| `board-shots.mjs` | Full-height screenshots of every board (the screenshot archive). |
| `batch.mjs` + `cases-final.json`, `cases-dlg.json` | The width sweep and the overlay renders. |
| `focusshots.mjs` · `fontcensus.mjs` · `unresolved.mjs` | The keyboard focus captures, the small-text census and the unresolved-value check. |
| `selector-usage.mjs` | Counts what each `cm.css` selector matches on the boards. |
| `build.sh` | Copies the canvas files into a scratch render folder. |
| `linkmap.py` | Builds `LINK-MAP.json` from `links.json`. |
| `rolestatus.py` · `lockfinal.py` | Build `ROLE-STATUS.json/.md` and `FOUNDATION-LOCK.json/.md` from the run and the shipped files. |
| `canvasgen.py` | Re-lays out the canvas rows from the measured board heights (the canvas file itself was then edited by hand to match). |
| `dumpworld.js` | Prints the preview's sample world (used for `SCENARIOS.json` and to confirm the world is unchanged). |

To run them again you need Node 22, Playwright 1.56 with Chromium, the design runtime (`support.js`, served by the Claude Design host — not shipped), and npm copies of React 18.3.1, ReactDOM 18.3.1, @babel/standalone 7.29.0 and @fontsource-variable/public-sans 5.3.0 in `vendor/node_modules`. None of these are included. Paths at the top of each script point at the original scratch folders; change them before running.
