# Verification harness (local, design-time only)

These files produced the evidence in `../CHECKS.md`. They are not product code and are not part of the canvas.

| Path | What |
|---|---|
| `run.mjs` | Playwright runner. Loads a `.dc.html` from `http://127.0.0.1:8765/`, runs the steps of a spec (click, keyboard, fill, upload), reads focus, text, attributes, runs axe-core, checks overflow, text under 14 px, font loading and console, and saves screenshots. |
| `sweep.mjs` | Signs in as each of the eight sample people in `Main.dc.html`, visits every rail destination and Help & support, reads the account menu and signs out. |
| `specs/*.json` | The specs used for the final run (names match `CHECKS.md` §3). |
| `fixtures/fx-*.dc.html` | Thin local wrappers that start `Main` (or a component) in a given state with long or specific data. Never published to the canvas. |
| `mkfix.py` | Generates Main-wrapper fixtures from a JSON map. |
| `mklinkmap.py`, `mkrolestatus.py` | Write `LINK-MAP.json` and `ROLE-STATUS.json`. |
| `sync.sh`, `final-run*.sh` | Copy the project files to the served folder and run the specs in order. |
| `logs/` | Output of the final run (after the last source change). |

## To reproduce

1. Serve one folder on `127.0.0.1:8765` containing: everything in `../project/`, the files in `fixtures/`, and `support.js` (the design host's runtime for `.dc.html` files; it is served by the canvas and not shipped here).
2. Provide Public Sans: `run.mjs` answers the Google Fonts request with `@font-face` rules pointing at `__fonts/public-sans-latin-wght-normal.woff2` and `__fonts/public-sans-latin-ext-wght-normal.woff2` on the same server (from the OFL package `@fontsource-variable/public-sans`; not shipped here). Without them the pages render in the fallback stack.
3. `npm install` (installs `axe-core` and the font package), with Playwright and Chromium available (the script looks for Playwright under `/opt/npm-tools` and Chromium under `/opt/pw-browsers`; change both paths for another machine).
4. `node run.mjs specs/t-verify.json out/` and so on for each spec; `node sweep.mjs`.

The shell scripts were written for the original sandbox: they expect the specs beside `run.mjs` and contain that sandbox's absolute path. Adjust both before reusing them. `axname.mjs FILE SELECTOR WIDTH` prints Chromium's computed role and accessible name for the matching elements.

Timings in the specs (waits of 300–1500 ms) match the preview's simulated delays (sign-in 900 ms, sending 900 ms, reload 700 ms).
