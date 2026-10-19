# tools/v3-reference — V3 board comparison (ADR-0010)

Local developer tooling that renders the **V3 reference boards** next to the **React V3
specimens** of the built harness (`apps/specimens`) in one Chromium and counts the pixels that
differ. It produced the foundation evidence in `docs/v3/V3-COMPARISON-MAP.json`
(`foundationEvidence`) and is the starting point for the comparisons of a migrated role.

**Boundaries.** Not part of `pnpm verify`, not a workspace package, never imported by product
code, never deployed. The boards are read from `design/v3-refined-b/pack/` and copied to a
temporary folder before they are served; the pack itself is only read (46/46 checksums stay OK).
The canvas runtime runs only inside the comparison browser. Run artefacts (`.runs/`) are git- and
prettier-ignored and are **not** baselines.

**Runtime.** The V3 canvas runtime was not supplied (`pack/common/05-SOURCE-COMPLETENESS.md`).
By default the boards run on the **historical** v46 runtime
(`design/handoff-v46/runtime/support.js`); its compatibility with V3 is not established, which is
why the results are evidence, not baselines. React 18.3.1, ReactDOM and Babel 7.29.0 are served
from `tools/board-capture/vendor/` after a checksum check (a mismatch stops the run). Public Sans
loads from the Google Fonts link that the boards and the V3 specimens name — the vendored v46 font
files stop at weight 700 and Refined B uses 650 and 800 — so a run needs the network. A role export
that ships its own runtime is passed with `--runtime`.

## Run

```sh
pnpm --filter @xr/specimens build
pnpm --dir apps/specimens exec next start -p 3310   # any free port; keep it in this worktree
node tools/v3-reference/compare.mjs --harness http://localhost:3310
node tools/v3-reference/compare.mjs --only sa01,ia02 --widths 1440,375
```

Each case is rendered at 1440, 1024, 768 and 375 px (900 px tall viewport, full page, device scale
1, reduced motion). A pixel counts as different when a colour channel differs by more than 24. The
run prints one line per case and width and writes `<case>-<width>-board.png`,
`<case>-<width>-react.png` and `results.json` (page sizes, different pixels, share, board page
errors) to `.runs/<stamp>/`.

## Cases

| Case          | Board          | Board props                                    | Specimen            |
| ------------- | -------------- | ---------------------------------------------- | ------------------- |
| `sa01`        | `SA01.dc.html` | —                                              | `/v3-sa-01`         |
| `sa02`        | `SA02.dc.html` | —                                              | `/v3-sa-02`         |
| `sa03-gdv`    | `SA02.dc.html` | `view: decision`, `record: gdv`, `asOf: oct08` | `/v3-sa-03`         |
| `sa03-ren`    | `SA02.dc.html` | `view: decision`, `record: ren`                | `/v3-sa-03-renewal` |
| `sa03-kon`    | `SA02.dc.html` | `view: decision`, `record: kon`                | `/v3-sa-03-paused`  |
| `sa03-viz`    | `SA02.dc.html` | `view: decision`, `record: viz`                | `/v3-sa-03-decided` |
| `ia01`        | `IA01.dc.html` | —                                              | `/v3-ia-01`         |
| `ia02`        | `IA02.dc.html` | —                                              | `/v3-ia-02`         |
| `ia02-paused` | `IA02.dc.html` | `scenario: paused`                             | `/v3-ia-02-paused`  |
| `ia02-ended`  | `IA02.dc.html` | `scenario: ended`                              | `/v3-ia-02-ended`   |
| `ia02-none`   | `IA02.dc.html` | `scenario: none`                               | `/v3-ia-02-none`    |

## Reading a result

The same page size at every width and zero differing pixels is an exact match. The remaining
differences seen so far are text rasterisation only: the canvas runtime splits interpolated text
into separate spans and loads font faces in a different order, so a few glyph runs anti-alias
differently, and the counts vary between runs. Anything else — a different page size, a moved
block, a colour — is a defect to fix in the component or a central patch, never a tolerance to
raise.

For a migrated product screen the comparison moves to `docs/v3/V3-COMPARISON-MAP.json`
(`productScreens`), against the owner-approved role export and on the normal product build.

## Product captures of a migrated role (`capture-product.mjs`)

A migrated screen sits inside the product's own shell on the sample world, so it is not
pixel-compared with the export's canvas. `capture-product.mjs` drives the **normal product build**
through the real UI (the sign-in form, links, the account menu; a state the fresh world lacks is
made through the UI first, for example the Super Admin pausing an institution) and captures each
case full page at 1440, 1024, 768 and 375 px. Every capture is measured: page width (horizontal
overflow), clipped text, the Public Sans weights 400–800, console errors. The captures are reviewed
side by side with the export's renders and recorded in `docs/v3/V3-COMPARISON-MAP.json`; like
every run artefact here they are evidence, never baselines.

```sh
pnpm --filter @xr/web build
pnpm --dir apps/web exec next start -p 3300   # the normal build, not the test-hook one
node tools/v3-reference/capture-product.mjs --product http://localhost:3300
node tools/v3-reference/capture-product.mjs --only xs01-sign-in,xs06-not-your-workspace --widths 375
```

Cases today: the Entry & shared surfaces (XS-01, XS-03, XS-04, XS-05, XS-06, XS-07, XS-08 banner).
