# tools/board-capture — the v46 visual-parity harness (WP-0.15)

Test-only tooling that renders the **frozen v46 boards** offline and compares them, pixel by pixel,
with the **real product**: the `@xr/ui` components in the specimen harness (`apps/specimens`, port 3100) and the built Phase-0 screens of the test-hook build (`apps/web`, port 3200). Appendix F §7.5;
Appendix E §9.1; owner authorisation of WP-0.15 (gate G-5c; VD-18 **local interim**: same machine,
same browser, same run — the runner decision stays open).

**Boundaries.** Never imported by product code (repository scan), never deployed, never in a product
bundle (bundle sentinels `xr-v46-board-capture`, `__dcSetProps`, `XR_BOARD_ORIGIN`,
`XR_PARITY_RUN_DIR`, `data-parity`), not a workspace package (no dependencies; `@playwright/test`
is injected by the suites). The canvas runtime (`runtime/support.js`) and the vendored scripts run
only inside the capture browser, on a byte-checked scratch copy of the frozen project — the frozen
files are only read (`design/handoff-v46` stays 178/178). `vendor/` is prettier-ignored and
never line-ending-normalised by git (`.gitattributes`: `-text`, so the committed bytes stay the
checksummed ones); run
artefacts (`.runs/`) are git- and prettier-ignored and are **not** committed baselines.

## How a capture works

0. `src/global-setup.mjs` re-checks the frozen handoff (its `SHA256SUMS.txt`, 178 files) and
   removes scratch copies an interrupted run left behind (older than an hour).
1. `src/vendor.mjs` checks the inputs: the three scripts against the SRI strings read from the frozen
   `support.js` (a mismatch throws — there is no bypass), the fonts against pinned SHA-256
   (`PROVENANCE.md`, `vendor/SHA256SUMS.txt`).
2. `src/scratch.mjs` copies `canvas-v46/project` + `runtime/support.js` to a temporary folder and
   proves every copy byte-identical; `src/server.mjs` serves it on an ephemeral 127.0.0.1 port.
3. `src/network.mjs` routes every request of a board **and of a product page**: localhost passes;
   for a board the unpkg scripts, the Google Fonts CSS and the three Public Sans woff2 files are
   fulfilled from `vendor/` with `access-control-allow-origin: *` (the scripts load with
   `integrity` + `crossOrigin`); a product page is served the font CSS and woff2 files only;
   everything else is aborted and recorded. Board and product therefore render with the same font
   files; a board or product page that requests anything external fails its test (the board's
   ledger is read again when its page closes, after every click and prop change).
4. `src/boards.mjs` opens a board and waits until it has rendered completely: the runtime holds the
   template, nothing is streaming, `document.fonts.ready`, the DOM quiet for 300 ms. The fixture
   then fails the test on any `{{` marker in a text node or attribute, Public Sans not ready, a
   failed font face or a page error. Board 05's canvas props (role, banner, `startWithMenuOpen`)
   are set through the runtime's own `__dcSetProps`.
5. Frames: product boards are counted against `derived/frame-index.json` (B4-04: 12); the Batch-0
   specimen boards are not in that index and are enumerated directly (`.doc-frame`, `section.doc-sec`)
   with the counts pinned in `src/inventory.mjs`. Names: `<board>-f<index>-<caption>` (`-s<index>-`
   for a section).
6. `src/parity.mjs` compares one drawn element with its product counterpart: both captured with
   `animations: 'disabled'`, `caret: 'hide'`, CSS scale, 1× pixels, reduced motion, until two
   captures in a row are identical; the board capture is written as the snapshot and Playwright's
   own image comparator (`toMatchSnapshot`, the comparator of `toHaveScreenshot`) judges the product
   capture. `updateSnapshots: 'none'`, and the hash of the reference bytes is re-checked after each
   comparison: a reference is never rewritten from the product. On both sides the fonts of exactly
   the rendered Public Sans text (each weight and style) must be loaded, from the vendored woff2
   files only. The icons each side draws (every rendered `svg`: viewBox and path data) must be the
   same — a different icon fails as `ICON-MISMATCH` even inside the pixel tolerance.

## Tolerances (Appendix E §9.1)

| Target              | threshold | maxDiffPixelRatio                | Used for                                                    |
| ------------------- | --------- | -------------------------------- | ----------------------------------------------------------- |
| Component specimens | 0.1       | 0.001                            | every element comparison, including the parts of screens    |
| Screen frames       | 0.2       | 0.005 (strict end of 0.005–0.01) | whole frames only (`frame: true`; any other use is refused) |

Each comparison is also measured with `maxDiffPixels: 0` (the exact count is recorded, never used to
accept). Measured lesson: on a 1280 × 900 frame the screen ratio (5 760 px) passes a sidebar with no
destination list (≈ 800 px) and a changed lead sentence inside a page header — so every frame is
gated twice: whole, at the screen tolerance, and part by part (top bar, sidebar parts, page parts)
at the component tolerance. Nothing was loosened.

## Outcomes and the register

Every comparison ends as one of: **within tolerance**; **registered deviation** — outside tolerance
(or different icons) and naming an entry of `src/deviations.mjs` (`DEVIATIONS.md`) _and_ measuring
what `src/pinned.json` pinned for it (the same entries, both capture sizes, icon equality and the
product element's content fingerprint exactly, different pixels within max(20 px, 10 %)); or
**failed** — anything else, including a registered comparison with no pin, a changed measurement,
and a registered comparison that now passes (a stale entry). The fingerprint (`fingerprintOf`)
hashes the product element's DOM as drawn — every rendered element's box relative to the element,
the computed styles that paint it, its words, each text node's line boxes, icon path data — so a
registered difference cannot absorb another change even where the captures differ in size and no
pixel count exists (proved with a changed word and a changed colour on the size-mismatched public
PU-15 sentence: both fail). It is deterministic where anti-aliasing is not: 441 of 441 identical
across two runs, while 3 unregistered sidebar captures varied by 1–16 pixels. A register entry is never a mask and never an approval: its `status` says
whether an owner decision covers it (`owner-approved`, `approved-rule`) or not (`provisional`,
`owner-review`). Pins are written from a reviewed run with `node src/pin.mjs <run>/specimens
<run>/web`.

## Capture normalisations (harness side only)

None touches a component's own CSS or a frozen file; each is recorded with its comparison.

- **Sub-pixel alignment.** Text and edges rasterise against the pixel grid; the product item is
  moved by the shortest difference of the two fractional offsets (±0.5 px at most, in Chromium's
  1/64-px layout units, added to any earlier shift of the same item). Without it, identical buttons
  differed by 1–7 % at glyph edges.
- **Harness box size.** A block component fills its container, so the harness box takes the drawn
  element's width (`matchWidth`), another drawn element's width (`widthFrom`: the body of a notice
  a board grid stretches, compared apart from its icon) or the content width of its parent for
  wrapping words (`containerWidth`). Heights are never set.
- **Canvas frame heights.** Frames' presentation `min-height` (760–1060 px; Appendix E §2.5 group 1,
  §10 item 2) becomes the 900 px capture height the product's `100dvh` gives (`frameMinHeight`).
- **Static states.** Board static focus/hover classes are produced on the product by real keyboard
  focus and real pointer hover; frames that draw a state unfocused are captured unfocused.
- **Fixed elements.** Inside the `position:fixed` drawer the crop is a viewport clip; drawer and
  dialog parts are cropped 1 px inside on the left and right only (`insetX`: the board draws the
  drawer at x = 657.906 over a bordered canvas frame, the product at the viewport edge over the
  scrim).
- **Masks.** None. A mask needs a stated reason and is for genuinely dynamic values only; the one
  candidate, the SUP reference on "Report sent", is deterministic in the sample world (SUP-0214,
  as SUP-0213 is issued on the walk) and is registered (DEV-11) instead.

## Running

Build first (`pnpm build` and `pnpm --filter @xr/web build:test-hooks` at `v2/`; `pnpm verify` does
both), then:

```bash
pnpm --filter @xr/specimens exec playwright test -c playwright.parity.config.ts
pnpm --filter @xr/web exec playwright test -c playwright.parity.config.ts
node tools/board-capture/src/report.mjs tools/board-capture/.runs/<run>
node tools/board-capture/src/register.mjs <specimens run> <web run> > tools/board-capture/DEVIATIONS.md
```

After a change that alters a registered difference on purpose (and only after reviewing the run's
diff images), re-pin and format:
`node tools/board-capture/src/pin.mjs <specimens run> <web run>` then
`pnpm exec prettier --write tools/board-capture/src/pinned.json`. A pin is never written by a
suite, and never for a comparison inside tolerance.

Each run keeps `references/` (board captures used as snapshots), `product/`, `results/` (actual /
expected / diff images of every difference), `board-references/` (+ manifest with sources and
hashes), `inputs.json` (handoff and vendor checks) and `report.json`. `pnpm verify` runs both suites as its
sixth step.

## Files

| Path                                 | What                                                                                                      |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `src/paths.mjs`                      | Locations (found from the working directory; no `import.meta`, the suites load these modules as CommonJS) |
| `src/vendor.mjs`                     | SRI and checksum checks; the URL → bytes table                                                            |
| `src/scratch.mjs`, `src/server.mjs`  | Byte-checked scratch copy; 127.0.0.1 static server                                                        |
| `src/network.mjs`                    | The capture network (localhost + vendored inputs; everything else blocked)                                |
| `src/boards.mjs`                     | Opening a board, readiness checks, enumeration, canvas props                                              |
| `src/parity.mjs`                     | Fixtures, captures, the comparison and its normalisations                                                 |
| `src/inventory.mjs`                  | The Phase-0 baseline inventory and pinned counts                                                          |
| `src/deviations.mjs`                 | The expected-deviation register (data)                                                                    |
| `src/pinned.json`, `src/pin.mjs`     | The pinned measurement of every registered comparison, and the script that writes it from a reviewed run  |
| `src/report.mjs`, `src/register.mjs` | Run summary (used by `pnpm verify`); `DEVIATIONS.md`                                                      |
| `src/global-setup.mjs`               | Playwright global setup (handoff hashes, vendor checks, scratch copy, server)                             |
| `PROVENANCE.md`, `vendor/`           | The approved inputs, their hashes and licences                                                            |
| `DEVIATIONS.md`, `BASELINES.md`      | The register and the Phase-0 baseline inventory with results                                              |
