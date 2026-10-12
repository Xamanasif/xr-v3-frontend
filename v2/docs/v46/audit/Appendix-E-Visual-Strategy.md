# Appendix E — Visual implementation strategy (frozen canvas v46)

> **Appendix E of the Phase-0 audit report** (`XR-v46-Phase0-Audit-Report.md`, Section 7). Source: `wf/final/visual.md`, final edition. An independent verifier raised 17 corrections; their outcomes are in the closing Verification log. The body below is unchanged.
>
> **Reading notes added at assembly**
> 1. **Superseded Understand-stage figures.** Use 24,319 inline `style=` attributes, not 23,140 (re-counted over the 128 boards at assembly). B1-13 does **not** repeat the B1-10 defect. Its one `thead` control sits in an inert, `aria-hidden` SA-02 thumbnail, and the same DataTable fix (PF-01) covers it.
> 2. **Phase-0 component count.** §3 lists 42 Phase-0 components. PublicShell, SignInCard and PublicMenuSheet are Phase 1 per §3.4–§3.5 and B8-06; they join Phase 0 only if the owner chooses gate G-8 (then 45).
> 3. **Interims that differ from §13 recommendations** (Appendix G D.0). VD-09 motion and VD-15 forced colours are deferred (DV-8). The VD-20 rail preference stays in memory per tab until approved (DV-7), because a browser preference conflicts with architecture R5. VD-05 is needed by the first DecisionLayout screen (SA-03, Phase 1).
> 4. **Gate placement.** VD-01 is gate G-3 (an engineering ADR the owner acknowledges), scoped to the `globals.css` / PostCSS step. VD-02, VD-17 and VD-18 downloads are gate G-5 (b)/(c).

---


Phase-0 architecture audit · deliverable "Visual implementation strategy" · 9 Oct 2026 · read-only audit (no repo or Downloads file changed) · final edited version: the verifier's 17 corrections were re-checked against the frozen boards, the sheets and `1b090c9`; each outcome is in the closing **Verification log**.

## How to read this

**Sources and citations.** The frozen handoff is cited as `design/handoff-v46/…` (its canonical repo path; it is not yet in the repo). Boards are cited by code and frame caption, for example "B1-10 frame 8 'Mobile 375'". Stylesheets are cited by file and selector. Understand-stage findings are cited as `understand/<file>#<key>`. Repo facts come from the approved foundation commit `1b090c9` (`git show 1b090c9:<path>`). The uncommitted Slice-1 UI was rejected and is not used as a reference.

**Authority.** Owner binding constraints (START-HERE BC1–BC14, FREEZE-RECORD) > v46 boards > handoff JSON > `derived/`. Where boards disagree with each other or with the JSON, this document reports it and does not resolve it silently.

**Status labels**

- **CONFIRMED**: checked directly in this audit against a board, a stylesheet, the handoff JSON, START-HERE, or the repo at `1b090c9`. Or it is a binding constraint.
- **PROVISIONAL**: a build proposal or inference that agrees with the evidence but needs engineering verification (a spike) or owner sign-off.
- **UNRESOLVED**: sources conflict, or a decision is missing. The owner must decide (see §13).

**Spot checks re-run in this audit** (python3 -I over the frozen extraction; scripts in `wf/design/tools/` and, for the final edit, `wf/final/_visual_tools/`):

- The 65 tokens in `xr-foundation.css :root` equal the 65 in `handoff/tokens.css`. Only 11 are read through `var()`. One further custom property, `--xr-tabs-bg`, is local to `.xr-tabs` and is not a token.
- The 8 stylesheets total 124,181 bytes and hold 89 `@container` blocks. The only `@media` rule is `prefers-reduced-motion`. Their SHA-256 values match `SHA256SUMS.txt`.
- B1-10: the clipped-`thead` rule exists, and the 'Received' control is listed in frames 0–3, 8 and 9.
- Interactive controls inside a `<thead>` are drawn only on B1-10 (10 tables) and B1-13 (1 table). B1-13's is a 1440-px SA-02 thumbnail scaled 0.3 inside an `aria-hidden`, `inert` wrapper (step 08), so it is neither clipped nor focusable. The defect is drawn only on B1-10 frames 3, 8 and 9.
- Error summaries: 192 `xw-errsum` instances on 25 product boards (B2-05 … B7-11). The Batch-0 boards draw none; 03 and 09b draw the summary as `xr-notice--err` instead. 115 link each item to its field and take focus. 30 take focus but list plain text (B2-05, B2-07, B2-14, B3-08). 47 on B5 boards are 'missing items' summaries that navigate by per-item buttons (`ul.xv-miss`) inside a focusable `div#…-miss tabindex=-1` wrapper.
- Board inline `style=` attributes: 24,319 (1,129 distinct values, 16 templated). The Understand-stage figure of 23,140 is superseded.
- Sidebar focus ring contrast: #1F4FD8 on #141B5E is 2.35:1, and #F7C95B on #141B5E is 9.98:1.
- Dialog Cancel style, destructive initial focus, sticky versus static decision panel, decision IDs in product copy, and `role="menu"` on B3-07 were all checked. These are new findings; see §12.

---

## 0. Recommendation in one page

1. **Port the 8 v46 stylesheets byte for byte into `@xr/ui`, all inside one shared cascade layer (`xr.v46`) in B8-07 load order.** A checksum test pins them to `design/handoff-v46/SHA256SUMS.txt`. A small additive **product layer** holds the documented production deltas (PF-01…PF-13, §2.3), for example B1-10, viewport-fixed overlays and the sidebar focus ring. Do not rewrite the CSS into CSS Modules or Tailwind. — PROVISIONAL (needs ADR VD-01)
2. **Tokens.** The 65 `--xr-*` custom properties stay where v46 defines them, in `xr-foundation.css :root`. There is no second token file. Literal hex values in the stylesheets are ported verbatim and are **not tokenised in Phase 0**. — CONFIRMED evidence / PROVISIONAL policy
3. **React components emit the board class names and ARIA exactly** (BEM-like `xr-/xp-/xw-/xl-/xa-/xv-/xg-/xd-`). Props map to modifiers, and state maps to `is-*` classes or ARIA attributes. Primitives are custom and built on native elements (`<dialog>`, `<details>`, native `<select>`, the disclosure pattern). No headless kit and no third-party design system. — PROVISIONAL (VD-01)
4. **Tailwind 4 becomes a constrained composition-utility layer without Preflight.** It replaces the board inline styles (24,319 `style=` attributes counted in this audit; the Understand stage's 23,140 is superseded) in `apps/web` only. The alternative is to drop Tailwind and use typed layout primitives. Either way this closes E-19 with an ADR. — UNRESOLVED (VD-01)
5. **Five accessibility and overlay fixes are planned from Phase 0. Their statuses differ:**
   - B1-10 visible sort control, with hidden header controls removed from the tab order — CONFIRMED (owner-mandated, BC13)
   - viewport-fixed drawer, scrim, public overlays and dialogs (native `<dialog>`) — CONFIRMED need (PF-03…PF-05)
   - a gold focus ring on the navy sidebar — PROVISIONAL (VD-11)
   - a skip link on every shell — PROVISIONAL scope (VD-16)
   - designed motion behind the reduced-motion guard — UNRESOLVED (VD-09); not built until the owner decides
6. **Visual regression against the frozen boards.** Capture is offline and reproducible. React 18.3.1, ReactDOM 18.3.1, Babel 7.29.0 and Public Sans are vendored, checked against the SRI hashes in `support.js` and served with CORS headers. The target environment is a pinned Playwright 1.63.0 Linux image. But the repo has no git remote and no CI, and this Mac has no container runtime, so the runner is an owner decision (VD-18). Until a runner exists, board and product are captured in the same run on the same machine. Product screens are compared at 1440/1024/768/375 with written tolerances and owner-approved expected deviations. — PROVISIONAL (runner UNRESOLVED)

---

## 1. Design tokens

### 1.1 Facts — CONFIRMED

- **65 tokens.** Two font, 38 colour, 11 space, 4 radius, 3 elevation, 4 motion and 3 layout tokens.
  - Source: `design/handoff-v46/canvas-v46/project/xr-foundation.css :root`.
  - `handoff/tokens.css` and `handoff/tokens.json` match it name for name and value for value.
  - B8-07 'Design tokens (xr-foundation.css :root)' lists the same values.
- **Only 11 tokens are read through `var()`:** `font-sans`, `font-mono`, `focus`, `focus-dark`, `e1`, `e2`, `e3`, `dur-1`, `dur-2`, `dur-3`, `ease`. Except for the two focus colours, every colour, space, radius and layout size is written as a literal in the stylesheets. So changing any of those tokens today changes nothing on screen. The 11 tokens read through `var()` are live swap points. Board 02 names `--xr-font-sans` as the designated one: 'Replace it by changing --xr-font-sans only.'
- **One local custom property is not a token:** `--xr-tabs-bg`. `xr-foundation.css` sets it on `.xr-tabs` (#F4F5FB) and `.xr-tabs--on-white` (#FFFFFF), and the tab-strip fade gradient reads it. Product `--xr-x-*` names (T-4) must not collide with it.
- **Several hex values map to more than one token:**
  - #1F4FD8 = link = focus = info
  - #F4F5FB = canvas = surface-2
  - #8A5A05 = gold-700 = warn
  - #FBF3E0 = gold-50 = warn-bg
  - #F7C95B = gold-400 = focus-dark

  (`understand/visual-system.json#tokens.notes`)
- **Non-token literals in the stylesheets:** #FAFBFE, #E8D3A3, #8F1C13, #8F1B12, #FFFBF0, #FFF7F6, #E6E8F3, #EEF0FA (`xr-admin .xd-gn`; the token is #EEF0F8), and the public set #D7DBF5, #AEB6EC, #EEF0FB, #173A6E, #233069 and the tricolour #F2A33A/#7CC0E8/#E5323B. `xr-public.css` header says the tricolour is 'approximated — not official brand values'. Source: `understand/visual-system.json#stylesheets[].nonTokenColours`.
- **Inline colours on the boards** (this audit): 4,112 hex uses with 36 distinct values. 32 are token values. 4 are not: #E6E8F3 ×67 (skeleton), #F3C4BF ×11, #8F1C13 ×2 and #E8D3A3 ×1.
- **Repo conflict.** `1b090c9:v2/packages/ui/src/tokens.css` is a placeholder:
  - `--xr-font-sans` uses a system stack (same name as v46, different value).
  - `--xr-color-fg/bg/muted` and `--xr-space-unit` do not exist in v46.
  - `1b090c9:v2/apps/web/src/app/globals.css` paints `body` with those placeholder tokens.

### 1.2 Recommendation

| # | Decision | Status |
|---|---|---|
| T-1 | **Single source.** The v46 `:root` block arrives inside the verbatim `xr-foundation.css`. Delete the placeholder `packages/ui/src/tokens.css` and the `globals.css` body rule, because the foundation sheet's `body` rule owns background, colour and font. Do not keep a second token file. `handoff/tokens.css` stays in `design/handoff-v46/` as documentation. | PROVISIONAL |
| T-2 | **Exposure.** CSS custom properties only (`--xr-*`). Add TS constants only where code needs a value: container thresholds for tests (600/760/860/1024/1280), proof viewports, and focus colours for contrast tests. Generate them from `handoff/tokens.json` and add a test that fails if they drift from the stylesheet. Do not hand-write a TS palette. | PROVISIONAL |
| T-3 | **Literal hex in the 8 stylesheets: port verbatim, do not tokenise in Phase 0.** Rewriting to `var()` needs a human choice per use (5 hex values map to more than one token) and would break the checksum provenance. If tokenisation is ever wanted, do it as a separate, owner-approved change. It must be proven by pixel-parity tests on every baseline (§9). | CONFIRMED evidence / PROVISIONAL policy |
| T-4 | **New code.** Raw hex is banned in TSX by a lint rule (except the icon registry and tests). Composition colours use token names (§2.4). The 4 non-token inline colours are kept as named, documented literals in the product layer: `--xr-x-skel #E6E8F3`, `--xr-x-err-line #F3C4BF`, `--xr-x-danger-hover #8F1C13` and `--xr-x-paused-line #E8D3A3`. They use an `x-` prefix so nobody mistakes them for v46 tokens. Product-added class names follow the same rule (`xr-x-*`, for example the PF-01 sort classes). | PROVISIONAL |
| T-5 | **No dark theme.** Board 01: 'Never a whole dark workspace'. `.xr-dark` marks navy bands only. | CONFIRMED |
| T-6 | **Type scale.** Workspace scale: display 44/52, H1 32/40, H2 22/30, H3 18/26, lead 18/28, body 16/24, label 15/20, small and meta 14/20, overline 13/16, chip 13 (compact 12), caption 13/18. Phone scale below 600 app width: H1 26/34, H2 20/28, display 32/40. These come from the existing classes (`.xr-h1` and the rest, plus the `@container xr-app (max-width:599.98px)` block). Real content is never below 14 px (board 02, B8-07). | CONFIRMED |

---

## 2. CSS architecture

### 2.1 Options compared

| Option | Fidelity | Parity in visual regression | Cost | Verdict |
|---|---|---|---|---|
| **A. Verbatim port of the 8 sheets into one shared cascade layer + additive product layer** | Highest. Same bytes, same class and DOM contract as the boards. | Best. Remaining differences isolate real product changes. | Low (the CSS exists) | **Recommended** |
| B. CSS Modules rewrite (~1,330 rules) | Medium. Many context selectors (`.xr-top .xr-acct-btn`, `.xr-shell.is-drawer > .xr-side`, `.xr-dpanel .xr-status`, `.xp-dark :focus-visible`) need `:global` or restructuring, and the container names stay global anyway. | Lower. Every rule can drift, and class names no longer match the boards. | High | Reject |
| C. Translate to Tailwind theme + utilities | Low to medium. Literal hex values map to several tokens. `:has()`, sibling contexts, `::file-selector-button`, scrollbar styling, sticky fades and attribute-state selectors become huge class strings. | Weak | Very high | Reject |

Source: `understand/visual-system.json#cssStrategy`. Supporting facts confirmed in this audit: 89 container queries; `:has()` in 10 rules; one `@media` rule.

### 2.2 Recommended structure (Option A) — PROVISIONAL (ADR VD-01)

```
v2/packages/ui/src/styles/
  index.css                 ← the only entry; declares the layer order, then imports
  v46/xr-foundation.css … xr-admin.css   ← byte-identical copies (8 files)
  v46/art/*.svg             ← the 19 SVGs, next to the CSS so url("art/…") resolves
  product.css               ← additive product layer (PF-01…PF-13, each with a citation comment)
  fonts/public-sans-{400,500,600,700}.woff2 + fonts.css (@font-face 'Public Sans')
```

`index.css` (sketch):

```css
@layer theme, xr.v46, xr.product, utilities;              /* repeated verbatim as the first line of globals.css */
@import url("./fonts/fonts.css");                        /* @font-face only */
@import url("./v46/xr-foundation.css") layer(xr.v46);
@import url("./v46/xr-public.css")     layer(xr.v46);
/* … workspace, learning, assess, vendor, govern, admin: same layer, B8-07 load order … */
@import url("./product.css")           layer(xr.product);
```

`apps/web/src/app/globals.css` starts with the identical `@layer theme, xr.v46, xr.product, utilities;` statement, so the layer order holds whichever CSS chunk the build emits first. It then adds only the constrained Tailwind layers (§2.4).

**Why one shared layer.** Board inline styles beat stylesheet rules of any specificity. A composition utility must do the same, and it can only win over contextual xr selectors when it sits in a later layer.

The 8 sheets must still share **one** layer. On the boards they are unlayered, so between sheets specificity decides first and load order only breaks ties. If each sheet had its own layer, a later sheet's weaker selector would beat an earlier sheet's stronger one, which never happens on the boards.

Example:
- `xr-foundation.css` `.xr-btn[disabled],.xr-btn[aria-disabled="true"]{…color:#5C6389…}` has specificity (0,2,0).
- `xr-govern.css` `.xg-del{color:#B42318}` has specificity (0,1,0).
- The boards draw `xr-btn xr-btn--text xg-del` 69 times on 11 boards (this re-check).
- Unlayered, a busy or disabled delete button turns grey. With `xr.govern` layered after `xr.foundation`, it would stay red.

One `xr.v46` layer, imported in B8-07 order, reproduces the board cascade exactly. Inside `xr.v46`, the 8 existing `!important` flags in the foundation sheet and 21 in the public sheet still beat utilities, just as they beat inline styles on the boards.

INFERRED from the CSS cascade specification. The verifier's static scan found 15 cross-sheet inversion candidates under per-sheet layers. Must be proven in a spike.

**Why load all 8 sheets on every page.** 23 boards already load all eight (Batch 7, Batch 8, Main; `understand/visual-system.json#boardConventions.stylesheetLinking`). Three global overrides then reach boards that loaded fewer sheets:
- `.xr-dpanel .xr-status` wrap rule (`xr-govern.css` / `xr-admin.css`), which now also applies on B1-11, B3-11 and B4
- `.xr-table .xr-id{white-space:nowrap}` (`xr-workspace.css`)
- `.xr-choice.is-off` (`xr-public.css`)

Accept these as expected baseline deviations (R-16). App Router does not reliably unload route-scoped global CSS, so per-surface loading would cause order-dependent rendering. — PROVISIONAL

**Packaging.** `@xr/ui/package.json` must:
- export `./styles.css`, pointing at `src/styles/index.css`
- list `src/styles/**` in `files`
- keep CSS as plain source files, because tsc does not compile CSS (today only `./tokens.css` is exported; `1b090c9:v2/packages/ui/package.json`)

`apps/web/src/app/layout.tsx` imports `@xr/ui/styles.css` once, before `globals.css`, and drops the `min-h-screen antialiased` body classes. The foundation `body` rule already sets `-webkit-font-smoothing:antialiased`, but it sets no min-height. The viewport min-height moves to the shell roots (PF-02).

**Spike checks (PROVISIONAL):**
- `@import … layer()` survives the `@tailwindcss/postcss` / Turbopack pipeline.
- Relative `url("art/*.svg")` resolves from a workspace package.
- The repeated `@layer` statement keeps `utilities` last whichever chunk loads first.
- Fallback: a build script that concatenates the verbatim files into `@layer` blocks. The checksum test then runs on the source copies, not on the generated file.

**Provenance test.** A Vitest test in `packages/ui` hashes the 8 CSS files and 19 SVGs and compares them with the matching `canvas-v46/project/…` lines of `design/handoff-v46/SHA256SUMS.txt`. Expected values:
- `xr-foundation.css` 32fb4cee…
- `xr-public.css` 28557b21…
- `xr-workspace.css` 6056f424…
- `xr-learning.css` 85fdba7e…
- `xr-assess.css` 41695cac…
- `xr-vendor.css` 2cb3e23a…
- `xr-govern.css` 87115c37…
- `xr-admin.css` 074f808f…

Any edit fails CI. Every deviation goes into `product.css`.

### 2.3 Product layer register (`xr.product`) — every entry cites its source

| ID | Delta | Why (evidence) | Status |
|---|---|---|---|
| PF-01 | **B1-10 DataTable sort fix plus a hidden-header guard** for `.xr-table`, `.xp-ftable` and `.xp-compare` (full design in §7.1). | BC13; START-HERE Known exception 1; B8-03 'Open finding — B1-10 at 375'; B8-08 limitations row | CONFIRMED need / PROVISIONAL design |
| PF-02 | `div.xr-app` **and `div.xp`** use `min-height:100dvh`. In the workspace this replaces the canvas `min-height: 900px` (1,037 inline uses). The public root has no min-height in the sheet or on the boards: 114 of 115 B1 `.xp` roots carry none. Without it, a short public page shows the grey `body` (#F4F5FB) below the white footer. Pages scroll naturally. The `.xp` part changes short public screens against their boards, so parity captures neutralise it (§9.1). | Board 05 markup `style="min-height: 100vh"`; START-HERE exception 3; `understand/visual-system.json#responsive.naturalScrolling`; `xr-foundation.css body{…}` and `xr-public.css .xp{…}` set no min-height | CONFIRMED need (`.xr-app`) / PROVISIONAL (`.xp`, VD-23) |
| PF-03 | **Drawer and scrim `position:fixed`.** Also make the background `inert` while open, and close on scrim or Esc. | `xr-foundation.css` `.xr-shell.is-drawer > .xr-side{position:absolute;…top:0;bottom:0}` and `.xr-scrim{position:absolute;inset:0}`. Positioned inside the frame, so on a scrolled page it would open off screen (R-04, INFERRED). Board 06 Behaviour. Chromium 152 check (verifier, `wf/verify/_visual/cq-fixed-test.html`): a `position:fixed` descendant of an `inline-size` container stays fixed to the viewport after scrolling. WebKit and Firefox still to verify. | CONFIRMED need |
| PF-04 | **Dialogs use native `dialog.xr-dialog`.** The rules already exist: `position:fixed;inset:0;margin:auto` and `::backdrop`. Add a bottom-sheet position below 600 app width (full width, buttons stacked, confirm on top) and an `align` variant (start, center, end) in place of the canvas classes `xw-dlg-top`, `xa-dlg-end`, `xa-dlg-auto` and `xg-dlg`. Render the dialog *inside* `.xr-app` (no portal to `body`) so `@container xr-app` rules such as `.xr-dialog-foot .xr-btn{flex:1 1 100%}` still match. Container queries still match inside a `showModal()` dialog nested in the container. The verifier confirmed this in Chromium 152; WebKit and Firefox are still to verify. | Board 10 'At 375 px the dialog sits at the bottom…'; B8-03 'Dialogs and confirmation buttons'; R-12 | CONFIRMED need / PROVISIONAL mapping (VD-08) |
| PF-05 | **Public overlays.** `.xp-scrim` becomes `position:fixed;inset:0`, replacing the canvas hack `height:2000px`. `.xp-fsheet` (catalogue filter sheet, `position:absolute;inset:0` inside `.xp`) becomes a viewport-fixed modal. | `xr-public.css` `.xp-scrim{…top:100%;height:2000px}` and `.xp-fsheet{position:absolute;inset:0…}`; `understand/surface-public-entry.json` SC20 'FilterSheet (modal dialog <1024)' | CONFIRMED need |
| PF-06 | `.xp{overflow:hidden}` becomes `overflow:clip` in `xr.product`, so `.xp-bottombar` (sticky bottom below 1024 xp) sticks to the viewport. `overflow:hidden` makes `.xp` the sticky element's scroll container, and `.xp` never scrolls itself, so on the boards the bar can only sit in flow. **Side effect (INFERRED from the CSS):** `.xp-filters` (catalogue facet panel) and `.xp-sumcard` (selection summary) are both `position:sticky;top:24px`, and they also start sticking as their rules intend. Static captures do not change, but scrolled behaviour does (VD-23). | `xr-public.css .xp{…overflow:hidden}`, `.xp-bottombar{position:sticky;bottom:0}`, `.xp-filters{position:sticky;top:24px…}`, `.xp-sumcard{position:sticky;top:24px…}`. Chromium 152 check (verifier): with `overflow:hidden` the bar stayed in flow (top 2000 px at a 768 px viewport); with `overflow:clip` it stuck at the viewport bottom (728). WebKit and Firefox still to verify. | CONFIRMED need |
| PF-07 | **Gold focus ring on navy surfaces not covered by the sheets:** `.xr-side :focus-visible{outline-color:var(--xr-focus-dark)}`. This covers the full sidebar, the rail and the drawer. Also add `summary` to the `.xr-dark` focus list. | Board 02 'Focus on navy · Ring #F7C95B · 10 : 1 against navy'. `.xr-side` background #141B5E with no override, giving 2.35:1 (computed). `.xr-dark :where(a,button,input,select,textarea,[tabindex])` omits `summary`. R-06. Not recorded on B8-03 or B8-08. | CONFIRMED defect / owner to record as a build correction (VD-11) |
| PF-08 | **Designed motion.** Drawer slides from the left in 280 ms. Dialog fades and settles (scale .98 to 1) in 280 ms. Menus and tooltips fade in 200 ms. The banner animates in 280 ms. Easing is `var(--xr-ease)`, and colour changes are linear. Wrap everything in `@media (prefers-reduced-motion: no-preference)`; the foundation's global reduce rule stays as a backstop. | Board 02 'Motion principles'; board 12 'Reduced motion' table; only `xr-spin` and `xr-shimmer` keyframes exist (R-11) | PROVISIONAL (VD-09) |
| PF-09 | `@font-face` for 'Public Sans' 400/500/600/700, self-hosted woff2 under the OFL licence, with the family name exactly `'Public Sans'` so `--xr-font-sans` stays verbatim. Do not use `next/font`, because it renames the family. | BC12; `handoff/assets.json` 'Public Sans · Working typeface · Google Fonts; swappable through --xr-font-sans'; R-19 | PROVISIONAL (VD-02) |
| PF-10 | **Decision panel sticky or static.** No CSS change. A `DecisionLayout panel="sticky|static"` prop adds `xg-static` exactly as the board does. | §6.4; R-08 | UNRESOLVED (VD-05) |
| PF-11 | Focus is never hidden under sticky bars. Set `scroll-padding-top` for the focused-task `.xa-bar` (sticky, min-height 56) and keep `.xa-q{scroll-margin-top:72px}`. | Board 12 'never hidden under the top bar or a menu'; `xr-assess.css .xa-bar{position:sticky;top:0}` | PROVISIONAL |
| PF-12 | Optional `@media (forced-colors: active)` outlines for current-item indicators. These use `box-shadow` (sidebar) and `::after` (tabs, public nav), which Windows High Contrast removes. | No forced-colors rule in any sheet (R-13). Not designed. | UNRESOLVED (VD-15) |
| PF-13 | Non-token literal names `--xr-x-*` (T-4). | Inline colour scan (§1.1) | PROVISIONAL |

Rules for the product layer:
- It may only *add* rules.
- Each rule carries a comment naming its PF-ID and evidence.
- Guard rules that must never be undone by a utility (PF-01) use `!important`. An important declaration in `xr.product` beats every normal declaration in any layer and every important declaration in `utilities`. Important declarations in `xr.v46` would beat it, but none of the 29 v46 `!important` flags touches a PF-01 selector (re-checked).
- Product-added class names use the `xr-x-` prefix (T-4) and are listed in the markup-contract allow-list (§2.6).

### 2.4 Tailwind disposition — UNRESOLVED (VD-01, closes E-19)

Current state (`1b090c9`): `apps/web/src/app/globals.css` = `@import 'tailwindcss';` (this includes Preflight) plus a body rule. `tailwindcss` and `@tailwindcss/postcss` are pinned at 4.3.3. In the installed `tailwindcss@4.3.3`, `index.css` starts `@layer theme, base, components, utilities;` and carries Preflight in `@layer base`; the package exports `./theme.css`, `./preflight.css` and `./utilities.css` separately, so Preflight can be left out. `OPEN_DECISIONS.md` E-19 reads 'Tailwind v4 + tokens in @xr/ui; primitives chosen at Design V2 start'. ARCHITECTURE §16 'Styling pipeline · Tailwind CSS v4 wired through PostCSS'.

**Preflight must go in either option — CONFIRMED conflict.**
- It strips list markers that boards rely on, such as the inline `<ul style="margin:4px 0 0;padding-left:20px">` in error notices (board 03) and `.xv-los` (padding-left only).
- It forces `svg`/`img` to `display:block`.
- It resets headings and buttons that `xr-foundation.css` styles itself.

`xr-foundation.css` already ships its own base reset (box-sizing, body margin, `h1…p{margin:0}`, `:focus-visible`).

**Option A (recommended): constrained composition utilities in `apps/web` only.**

```css
/* apps/web/src/app/globals.css */
@layer theme, xr.v46, xr.product, utilities;   /* identical to @xr/ui index.css */
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);
@theme inline {
  --color-*: initial;  --color-ink: var(--xr-ink);  --color-ink-2: var(--xr-ink-2); /* … all 38 v46 colours */
  --font-*: initial;   --font-sans: var(--xr-font-sans); --font-mono: var(--xr-font-mono);
  --radius-*: initial; --radius-xs: 4px; --radius-sm: 6px; --radius-md: 8px; --radius-lg: 12px; --radius-full: 999px;
  --shadow-*: initial; --shadow-e1: var(--xr-e1); --shadow-e2: var(--xr-e2); --shadow-e3: var(--xr-e3);
  --spacing: 4px;      /* xr 4-px scale (board 01) */
  --breakpoint-*: initial; /* no viewport breakpoints: v46 is container-query only */
}
```

- **Allowed** (screen composition that mirrors board inline styles): `flex`/`grid`/`gap`/`m*`/`p*`/`w*`/`max-w*`/`min-w*`, `whitespace`, `break-words`, `text-left`/`text-right`, token colours and radii.
  - This audit's count of the most frequent inline properties: margin 6,635; display 3,581; gap 3,474; colour 2,898; flex-direction 1,661; max-width 1,655; padding 1,648; width 1,628; grid-template-columns 1,119.
- **Not allowed:**
  - Tailwind classes inside `@xr/ui` components (they emit xr classes only, so `@xr/ui` needs no `@source` scanning)
  - arbitrary colour values
  - viewport breakpoint variants
  - Tailwind's default palette, type or shadows
  - utilities that restyle a component's own look (colour, type or border of `.xr-btn`, `.xr-status` and the like)

  Enforce this with an ESLint rule or a grep test over TSX.
- **No responsive utilities are needed** — INFERRED. Only 16 of the board inline styles are template-bound (`style="…{{ }}…"`), and all 16 are canvas frame or specimen sizes. Composition is therefore static per element, and every container-query behaviour already lives in the 8 sheets. If a screen needs width-specific composition that the sheets do not cover, it becomes a PF entry, not a utility variant.

**Option B: drop Tailwind.** Remove `tailwindcss` and `@tailwindcss/postcss`. Composition then uses 3–4 typed layout primitives (`Stack`, `Cluster`, `Grid`, `Split`) that emit a tiny product-owned class set, plus verbatim style objects for the rest. This gives the most fidelity and the fewest moving parts. It is worse to maintain, and verbatim `style=` attributes need CSP `style-src-attr`.

### 2.5 The 24,319 board inline style attributes — handling rules (CONFIRMED evidence, PROVISIONAL rules)

This audit counts 24,319 `style=` attributes on the 128 boards, with 1,129 distinct values (16 templated). The Understand stage reported 23,140; that figure is superseded. The attributes split into three groups:

1. **Canvas chrome: drop it.**
   - `min-height: 900px` on `.xr-app` and `.xr-shell`
   - `width: Npx; max-width:100%` frame wrappers
   - `overflow-y:auto; height:Npx` crops (155 Batch 1–3 frames)
   - `font-family: 'Public Sans', …` repeated on frames (985 declarations)

   Source: START-HERE exception 3; `understand/visual-system.json#canvasOnly`.
2. **Composition glue: translate.** Spacing, flex and grid, max-width and token colours become composition utilities (Option A) or layout primitives (Option B), written *per screen from that board's markup*. The board markup is the specification.
3. **Status and colour tints on components** (for example `background:#E8F4EC;color:#1D6B45`): express them through the component's own variant whenever the variant exists (`xr-status--ok`). Otherwise use token utilities.

Never copy `style=` attributes wholesale into TSX. Never copy the specimen inline style of the B1-10 sort button (`understand/surface-super-admin.json` CO17); build it from the component.

### 2.6 Class-name ownership — PROVISIONAL

- `@xr/ui` React components **own** the board class contract. Board markup is the spec, for example `<span class="xr-status xr-status--wait"><svg class="xr-ico" …/>Waiting for a licence</span>`.
- Mapping rules: variant props map to modifiers (`variant="primary"` → `xr-btn--primary`). State maps to ARIA first (`aria-current`, `aria-selected`, `aria-pressed`, `aria-invalid`, `aria-disabled`, `aria-expanded`) and to `is-*` classes only where the CSS keys on them (`is-busy`, `is-done`, `is-current`, `is-changed`, `is-error`, `is-off`, `is-drawer`, `is-expanded`, `is-rail`).
- `className` passthrough is allowed for composition utilities only.
- **Lint bans canvas classes in product code:**
  - `doc-*`, `b1-*`
  - `is-focus`, `is-shown` (static specimens)
  - `xa-boardctl`, `xl-board-btn`, `xw-live`
  - `xr-dialog-scrim`, `xw-dlg-top`, `xa-dlg-end`, `xa-dlg-auto`, `xg-dlg`

  Source: `understand/visual-system.json#cssStrategy.lintGuards`.
- **Markup-contract tests.** Render each component with fixture props and assert its class list and ARIA attributes against the cited board excerpt (board code + frame). This catches drift that pixels miss. Product-added `xr-x-*` classes (PF-01: `xr-x-table-sortbar`, `xr-x-th-sort`, `xr-x-th-text`) are the only classes that no board draws. The tests keep an explicit allow-list of them.
- **Next coupling.** `@xr/ui` may not import `next/*` (`1b090c9` boundary matrix: '@xr/ui … next and next/* forbidden — links/router must be injected'). Link-rendering components take an injected `LinkComponent` through a provider that `apps/web` supplies (`next/link`). — CONFIRMED constraint

---

## 3. Component library inventory

Phase numbers follow B8-06 'Build order': 0 Foundation (boards 01·02·03·04·05·06·07·08·10) · 1 Public + access spine · 2 Campus distribution · 3 Learning, feedback, device chain · 4 Teaching & assessment · 5 Production + first publication · 6 Corrections + governance. "P0" means the component is built and baselined in Phase 0 from its Batch-0 specimen, even if its first screen comes later.

**Placement.** Generic primitives live in `@xr/ui`. Surface-specific parts (assessment `xa-*`, vendor `xv-*`, learning `xl-*`, governance `xg-*`, public page sections `xp-*`) live as feature components in `apps/web/src/features/*`. They still emit the board classes. A part moves to `@xr/ui` once two surfaces reuse it (for example ComparisonTable is shared by RV-04, CM-08 and SA-11).

All rows are CONFIRMED as drawn unless marked otherwise.

### 3.1 Foundation

| Component | Purpose · classes | Source boards | Variants | States | Accessibility behaviour | Phase |
|---|---|---|---|---|---|---|
| **Button** | Actions · `xr-btn` + `--primary/--secondary/--text/--danger/--danger-quiet/--on-dark/--sm/--block`, `is-busy`, `xr-spin` | 03, 10 | primary gold (one per screen) · secondary navy outline · text · destructive (only where authorised, always confirms) · destructive-quiet (opens a confirm) · on-dark · sm 36 · block | default · hover (120 ms) · focus · busy ('Giving access…', spinner, `aria-disabled`, ignores repeat presses) · disabled | Label is verb + object. Unavailable actions are hidden or show the reason beside them, never a silent grey button. Order: primary last on wide screens, stacked with primary first on phones (board 03). | 0 |
| **IconButton** | `xr-icon-btn` 44 · `xa-order .xr-icon-btn` 36 · `xr-side-btn`/`xr-drawer-close` 40 · chip remove 28 | 03, 05, 12, B4-05 and B4-15 (`xa-order`), B4-07 | neutral · reorder · close · remove-filter | hover · focus · `aria-disabled` (xg-icobtn) | Always named: 'Open menu', 'Close menu', 'Collapse menu', 'Remove filter Status: No access yet' (board 12). | 0 |
| **Link / BackLink / JumpLink** | `a` (#1F4FD8, underline offset 3) · `xr-back` · `xr-jump` · `xp-more` · external | 02, 03, 09a, B1-11; B1-01, B1-02, B1-03, B1-05 (`xp-more`) | inline · back (names its destination, never 'Back') · 'Go to decision' jump (content < 860, moves focus to the panel) · external | hover (navy, 2 px underline) · focus | External links add '(opens in a new tab)' for screen readers (board 02). Router injected (§2.6). | 0 |
| **Icon** | Inline SVG `xr-ico`, `--16`, `--24`; typed registry | 02 (48 named) + 78 static paths observed + 4 format glyphs (`understand/visual-system.json#boardConventions.icons`) | 16 (stroke 2) · 20 (default, stroke 1.75) · 24 | — | Always `aria-hidden`. Icon-only controls carry their own name. Generate the registry mechanically from board paths, named from the board-02 list. | 0 |
| **FormatBadge / FormatSet** | `xr-fmt`, `--yours`, `--off`, `--compact`, `--on-dark`; `xr-fmt-set` | 04, B2-11, B3-01, B1-05 | offered (indigo tint) · available to you / inherited (navy fill) · unavailable (dashed + words saying which 'not') · compact (24 px, no glyph) · on navy band | static. The chip never changes on completion; the status word beside it does. | Code + glyph + words. 'Available in' is not entitlement (board 04, B8-03). **Fixed order WEB · AR · VR · MR**: a presentation order map in `apps/web`, never `@xr/domain`'s `web·vr·mr·ar` (`understand/repo-baseline.json#conflictsWithV46`). | 0 |
| **StatusPill** | `xr-status` + `--info/--ok/--wait/--err/--paused/--off/--live` | 04, 12, B8-03 | 6 tones + Live (7 modifiers; Live marks the current published version only) | static · wraps inside a decision panel (`xg`/`xd` rule) | Always a word. The tone icon shape differs; never colour alone. **Labels are role-relative.** The component takes `tone + words`. The words come from a `statusLabel(record, state, viewerRole)` map in `apps/web` built from the B8-03 vocabulary and the boards, not from `entities.json` (incomplete and single-perspective, a handoff defect). Examples: REQ 'Submitted' / 'Payment failed'; SACC 'No access yet' / 'Waiting for a licence' / 'Access ended' / 'Student inactive'; UPD 'Waiting for your decision'; DTR 'Waiting on you' / 'Forwarded'; SUB 'Submitted' (M-3), 'Draft · read-only'. | 0 |
| **Notice** | `xr-notice` + `--ok/--warn/--err/--quiet`, `-title`, `-body`, `-actions` · reason box `xv-reason`, `xp-reason`, `xp-statushead` | 03, 04, 08, B1-09, B5-07; B1-08 (`xp-reason`, `xp-statushead`) | info · success · warning · error + retry · quiet · refused-with-reason (quoted reason, who, when, next action) | static · focusable reason box (`xv-reason:focus-visible` 3 px) | `role=status` for success/info (1,883 on the boards) and `role=alert` for errors (396). Success is a notice in place, never a toast (board 04 'Never'). | 0 (reason variant 5) |
| **ShellBanner (XS-08)** | `xr-banner--paused` (amber) / `--inactive` (navy `xr-dark`), `xr-banner-msg` | 04, 05, 08, B7-04 | paused: 'Your institution's access is paused — your work is kept.' + Help · inactive: 'Your account is inactive. Contact your institution administrator.' + Help | shown below the top bar | `role=status`. A shell banner, never a modal (B8-07). | 0 |
| **EmptyState · LoadingState · FailedState · NoMatch** | `xr-empty`, `xr-empty-icon` · `xr-skel` + `aria-busy` + sr text · error notice + 'Try again' + 'Report a problem' · empty + 'Clear filters' | 03, 04, 08, B1-10 frames 4–7 | per board 04 'State grammar' (§8) | shimmer (static under reduced motion) | Loading is announced ('Loading your reports'). No error codes or '500'. | 0 |
| **MessagePage (AR-10, GL-04)** | `xr-msg` (600), `xr-msg-icon`, `xr-msg-title`, `xr-msg-actions` | 08, 09b | not available · not your workspace (XS-06) · not found (PU-15) · confirmation with reference · paused/ended | inside the shell with nothing current in the sidebar, or under the public header | One H1, one sentence, one primary action named by its destination, quiet Help. Decorative icon. Never shows route names or codes (board 08 'Rules'). | 0 |
| **Section / Stack** | `xr-section`, `-head`, `-body`, `xr-stack` | 01, 03 | one white surface per section, never nested | — | Sections use `aria-labelledby` pointing at their H2. | 0 |
| **PageHeader** | `xr-phead`, `-main`, `-meta`, `-actions`, `xr-overline`, `xr-h1` | 03, 09a | standard (back link, ID, title, status in words, ≤ 1 primary) | actions full width below 600 app width | One H1 per page. The H1 takes `tabindex=-1` where it is a focus target after an action (`understand/surface-reviewer-cm.json` SC1). | 0 |
| **Breadcrumbs** | `xr-crumbs` (top bar) · `xp-crumbs` (public inner header) | 03, 05, B1-03 | workspace (from two levels deep, wide screens) · public | — | `ol aria-label='You are here'`; current item `aria-current=page`. | 0 (xp: 1) |
| **LogoPlaceholder** | `xr-logo-ph` (sidebar, min-height 48) · `xp-logo` (148×48; 118×44 below 600) · `xp-auth-brand` (132×44) | 01, 05, 06; 88 boards (xr), 13 boards (xp) | 3 placements | — | Renders the exact text 'BITS Pilani / WILP logo — placeholder' (BC12; `assets.json`). §4.5 | 0 |
| **Avatar · CountBadge** | `xr-avatar` · `xr-count` (gold in the rail) · `xr-tab-count` · `xp-sel-n(.is-zero)` · `xd-gn` | 03, 05, 06; B1-01, B1-03…B1-05, B1-08 (`xp-sel-n`); B7-01, B7-12 (`xd-gn`) | — | zero | Avatar is `aria-hidden` inside a named button. Counts carry sr text in words ('Marking, 12 written answers to mark'). | 0 |
| **IdChip** | `xr-id` (monospace) | 02, B8-03 | REQ-0042 · SACC-0310 · UPD-0005 … (prefix + 4 digits) | — | Monospace for record IDs only (board 02). | 0 |
| **Typography** | `xr-display/h1/h2/h3/lead/body/small/meta/caption/overline/num/sr` · `xp-eyebrow/h1/h2/h3/lead` | 02 | workspace and public scales | phone scale below 600 | Tabular figures for aligned numbers. | 0 (xp: 1) |
| **Rows / AttentionList** | `xr-rows`, `xr-row-*`, `a.xr-row-link`, `xr-row-icon--wait/err/ok/info` | 03, 09a (`xr-rows`); 05, 07 (`a.xr-row-link`) | attention item (what, why, one action) · row link | all clear ('Nothing needs you right now') | Rows always open something. Budget ≤ 5–6 rows, one action each. | 0 |
| **SkipLink** | `xr-skip` | 05, 12 | — | hidden until focused (`top:-80px` → `12px`) | First tab stop, targets `main#main`. Give `main` `tabindex=-1` so focus actually moves (PROVISIONAL). Drawn only on boards 05 and 12; product adds it to every shell (§7.4). | 0 |

### 3.2 Forms

| Component | Purpose · classes | Source boards | Variants | States | Accessibility behaviour | Phase |
|---|---|---|---|---|---|---|
| **Field** | `xr-field`, `xr-label`, `xr-opt`, `xr-hint`, `xr-error`, `xw-ferr`, `xr-ro`, `xr-ro-val` | 03, 09b, 10, B2-07 | required (default) · **marker text rendered verbatim** as drawn: '(optional)' ×440, '(required)' ×18 (DL-2 reason labels on B2-04, B2-06, B2-13), '(required to approve)' ×23 (B1-11), '(from your plan)' ×14 · read-only value ('Read-only · set at import') | default · invalid | Label above, always visible, no placeholder-only labels (09b AR-8). Hint and error referenced by `aria-describedby` (1,175 uses on the boards). `aria-invalid`. The error is in words under the field. | 0 |
| **TextInput** | `xr-input`, `xr-search` (leading icon), `xp-pw` (Show/Hide), `xp-num` | 03, B1-07 (date), B1-09 (email, password) | text · email · search · native date · in-table (xw-edit, xg-codes) | hover · focus (blue border, offset 0) · invalid · read-only · long value ellipsis | min-height 44, 16 px text. | 0 (password reveal: 1) |
| **Select** | `xr-select-wrap`, `xr-select` (native, `appearance:none`) + chevron | 03 | toolbar filter · form | default · hover · focus · invalid · long value (ellipsis, code first) | Native `<select>`. Use a radio list for a short set of long names (board 03). | 0 |
| **Textarea** | `xr-textarea` (min 128, resize vertical), `xa-q .xr-textarea` (168) | 03, 10; B4-04, B4-06, B4-12 (`xa-q`) | reason (DL-2) · long answer | default · focus · invalid | — | 0 |
| **Checkbox / Radio groups, ChoiceCard** | `xr-fieldset`, `xr-legend`, `xr-check`, `xr-choice` (+`-title`, `-sub`, `is-checked`, `is-off`) · `xw-pick` · `xp-pill`, `xp-fpick` · `xv-fmtchecks` | 03, 09a, B2-05, B1-05, B5-04 | check row · choice card · unavailable (dashed) · pick list · public pills · format picker | checked (`:has(input:checked)`) · focus (`:has(:focus-visible)`) · disabled with a reason · invalid (`xp-fpick.is-invalid`) | The whole label is a 44 px target. Radios move with arrow keys (board 12). | 0 (pick: 2 · public: 1 · vendor: 5) |
| **SegmentedControl** | `xr-seg button[aria-pressed]` · `xl-seg a[aria-current=true]` (link variant) | 03, B3-08, B7-09 | buttons (switch one list's view) · segmented links | pressed · hover · focus (inset) | Never navigation (board 03). | 0 (links: 3) |
| **FileInput · CsvImport · ImportReport** | `xr-file::file-selector-button` · `xw-file`, `xw-counts`, `xw-cols` · `xv-file(s)` | 03, 07, B2-07, B4-08 | optional screenshot (Help) · CSV with template download and row report | empty · chosen · checking ('Checking rows…') · report (errors block import) | Native input with label and hint. The product needs a real file input and parser; board choosers are simulated (`understand/surface-faculty.json` CO4). | 0 (CSV: 2) |
| **Stepper** | `xr-steps`, `xr-step(.is-done, .is-current)`, `-n`, `-label` · info-only `xl-steps` · `xw-steps3` · `xp-steps4` | 03, 09a, B1-07, B2-05, B4-04, B5-03; B1-01 (`xp-steps4`), B2-12 (`xw-steps3`), B3-04 and B3-06 (`xl-steps`) | guided-flow stepper · numbered set-up steps · three next-stage cards · public four steps | done (navy bar + 'Done') · current (gold bar, bold, `aria-current=step`) · upcoming · phone: current label + 'Step n of N' | `aria-current` on the current step. | 0 |
| **GuidedFlowLayout + SummaryPanel (AR-5)** | `xw-flow`, `-main`, `xw-sum`, `xw-sumbar` (details), `xw-flow-foot` · public `xp-split`, `xp-sumcard`, `xp-bottombar` | 09a, B1-07, B2-05, B4-04 (`xw-flow`, `xw-sum`), B5-03; B1-06 (`xp-split`, `xp-sumcard`, `xp-bottombar`) | summary panel ~26 % from 860 content · collapsible 'Your selection' below · public sticky bottom bar below 1024 | step n of N · review | Back never loses work (09a). | 1 / 2 |
| **ErrorSummary** | Product boards: `xw-errsum` (`role=alert`, `tabindex=-1`) with a `ul` of links; 192 instances on 25 boards (B2-05 … B7-11). Batch-0 specimens draw it as `xr-notice xr-notice--err role=alert` with a list of links instead. B5 'missing items' variant: `xw-errsum` + `ul.xv-miss` with one 'Go to …' button per item, inside a focusable `div#…-miss tabindex=-1` | Drawn: 03 'Two things need fixing before you can continue' and 09b 'One thing needs fixing' (as `xr-notice--err`); B2-05, B3-06, B4-04, B5-03, B6-09 and 20 other product boards (as `xw-errsum`). Rules: 10, 12, B8-07 | page summary · one error · several · titles as drawn per screen ('Check this step', 'Check these settings', 'Check your request', 'Check your decision' …) · missing-items summary (B5) | shown after submit | Takes focus on submit, and each item moves focus to its field (board 12 'Summary links move focus to the field'). 115 of 192 instances are drawn that way. The 47 B5 missing-items summaries navigate by button and take focus through their wrapper; keep them as drawn. **Normalises one board variance:** 30 instances (B2-05 ×16, B2-07 ×5, B2-14 ×4, B3-08 ×5) take focus but list plain text with no way to reach the field (VD-21). The emitted class (`xw-errsum` versus `xr-notice--err`) and the Phase-0 baseline source are open (VD-22, V-13). | 0 |
| **RatingScale 1–5** | `xr-scale`, `xr-scale-n`, `xl-fb .xr-scale.is-invalid` | 12, 09b, B3-06 | horizontal · vertical below 520 content | unselected · selected (navy fill + tick) · focus · invalid | A real radio group in a fieldset with the statement as legend. Each point has a number and a word, and arrow keys move. Words for points 2–4 are a proposal (13 Q6). | 3 |
| **EditableTable** | `xw-edit`, `xg-codes`, `xg-changed-mark`, footer 'n unsaved changes · n needs fixing' | 03, B2-03, B6-10 | per-row input + label + error + changed marker + blank note | saved · unsaved change · not saved (error) · blank allowed | One input per stacked row below 760. | 2 |
| **FormFooter / FlowFooter** | `xw-flow-foot`, `xp-formfoot`, `xw-actions` | 03, B5-03…B5-07, B6-09; B1-07, B1-08 (`xp-formfoot`) | destructive text action left, Save + primary right | busy | Button order per board 03. | 0 |

### 3.3 Data display

| Component | Purpose · classes | Source boards | Variants | States | Accessibility behaviour | Phase |
|---|---|---|---|---|---|---|
| **DataTable** (labelled-row mode + B1-10 fix) | `xr-table-wrap`, `xr-table`, `caption.xr-sr`, `th[scope=col]`, `td[data-label]`, `td.is-primary`, `tr.is-changed`, `tr.is-error`, `xr-sub`, `xw-table-flush` + product-added `xr-x-table-sortbar`, `xr-x-th-sort`, `xr-x-th-text` (PF-01; on no board and in no sheet) | 03, 11, B1-10; B2-02, B2-03, B2-06, B2-08 (`xw-table-flush`); `xr-table` 507 times on ~80 boards | read · editable · public formats `xp-ftable` · comparison `xp-compare` · sortable column (only B1-10 today; B1-13 shows an inert thumbnail of SA-02) | loading (`aria-busy` on wrap) · empty · no match · failed + retry · hover · changed · error · labelled-row mode below 760 content (`xp-compare` below 600 xp) | Visually hidden caption. Every row opens its record. Sort is stated (09a AR-2 '4 requests · oldest first'). Optional explicit `role=table/row/cell/columnheader` in labelled-row mode (R-15; verify with VoiceOver). **No hidden header control is ever focusable** (§7.1). | 0 (sort first used: 1) |
| **ListToolbar / Filters** | `xr-toolbar`, `xr-toolbar-search`, `xr-filter-2`, `xr-toolbar-status` (`role=status` count), `xr-fchip`, `xp-morefilters` · public `xp-filters`, `xp-fgroup`, `xp-fsheet`, `xp-filter-btn` | 03 (one shared toolbar at three widths), B1-04, B1-10 | search + ≤ 2 filters + More filters · phone: search on its own row, 2nd filter moves into More filters · public facet sidebar, which becomes a sheet below 1024 xp | no filters · filtered (chips + 'Clear filters') · More filters open (`aria-expanded`, 'More filters (1)') | Count in `role=status` ('5 of 214 students'). Chip remove 28×28, 'Remove <label>'. | 0 (public: 1) |
| **Tabs** | `xr-tabs(--on-white)`, `xr-tab`, `xr-tab-count`, `xw-hubtabs` | 03, 05, 06, 11, B2-06, B2-12, B6-06, B7-02 | **SectionTabs**: `nav` of links with `aria-current=page` that change the address · **RecordHubTabs**: hub tabs drawn as links (`nav.xr-tabs.xw-hubtabs`, 67 instances on 13 boards: B2-12…B2-14, B3-01, B3-02, B3-07, B3-12, B3-13, B4-05, B4-06, B4-11, B4-14, B4-15) · **StatusTabs**: `role=tablist` + `aria-selected` buttons that filter one list (27 tablists on 9 product boards: B6-06, B6-14, B7-02, B7-05, B7-06, B7-08, B7-09, B7-11, B7-12; labels 'Show' ×18, 'Content library' ×6, 'Role' ×3). Batch-0 boards 03 and 09b draw the record tabs of one experiment as 2 further `role=tablist` specimens | current (gold 3 px + bold) · hover · focus (inset) · overflow (sideways scroll, right fade, left shade, thin track, current tab scrolled into view) | Links are reached with Tab. A `role=tablist` uses arrow keys plus a `tabpanel` with `aria-labelledby`. No board draws a tabpanel, so this is an ARIA completion and not a visual change (VD-14). | 0 (hub: 2 · status: 5/6) |
| **Timeline / History** | `xr-timeline`, `xr-tl(.is-latest)`, `-dot`, `-what`, `-when`, `-note` | 03, 09a, B5-06; 39 boards | record history, newest first (who · when · note) | latest has a filled dot | `ol`/`ul`. | 0 |
| **KeyValueList** | `xl-kv`, `xv-kv`, `xl-defs`, `xa-facts`, `xp-kv`, `xp-review`, `xp-stand`, `xw-sum dl` | 09a, B1-11, B3, B5 | label beside value · label over value below 600 | — | `dl/dt/dd`. | 1 |
| **DecisionLayout + DecisionPanel (AR-4)** | `xr-decide`, `xr-dpanel(:focus)`, `xr-dpanel-title`, `xr-jump`, `xg-static` · assign panel `xw-apanel` | 03, 09a, 11, B1-11, B3-11, B4-09, B6-03, B6-07, B7-05; B2-09 (`xw-apanel`) | ~72/28 from 860 content (`clamp(260px,28%,360px)`) · panel under content below that, with 'Go to decision' · **sticky** (foundation) or **static** (`xg-static`) | choosing · reason required · decided (focus moves to the result) | The jump link focuses the panel (`.xr-dpanel:focus` outline). Panel breakpoint follows Batch-0 AR-4 (OD-B6-10 recorded). | 0 (first use: 1) |
| **ComparisonTable** | `xp-compare(.is-diff)` (public request) · `xg-cmp`, `-row`, `-head`, `-f`, `-cur`, `-pro`, `-lab` (live vs proposed) | 03, B1-08, B6-04, B7-05 | changed fields only · stacked with labels (xg below 760 content; xp below 600 xp) | changed row tinted 'Changed' | `xg-cmp-head{display:none}` when stacked is already safe. `xp-compare thead` uses clip, so PF-01 adds a guard. | 1 / 6 |
| **RecordHubHeader (AR-7)** | `xw-hubhead xr-dark`, `xl-hubhead`, `xw-hubrow`, `xw-fav` | 09a, B2-12, B3-01 | navy band · compact | — | Gold focus on navy (`.xw-hubhead .xr-btn--primary:focus-visible`). | 2 |
| **Disclosure** | native `details/summary` · `xw-sumbar`, `xl-more`, `xa-guide` | B2-05, B3-05, B4-09; 14 boards | selection summary · more detail · marking guidance | open (icon rotates 200 ms) · closed | Native. Dark-band focus fixed by PF-07. | 2 |
| **InlinePanel** | `xw-inline-panel` | B2-08, B7-07; 14 boards (B2-08, B7-02…B7-12, plus the B8-05 and B8-07 registers) | mid-page confirm or reason beside the affected row | open · closed | B8-07 'beside the row they affect'. Focus moves into the panel and returns to the row action (PROVISIONAL). | 2 |
| **OverviewFigures** | `xd-figs`, `xd-fig*` | B7-01 only | exactly two numbers | — | B8-07 'Two numbers, no dashboard'. | 6 |
| **Meter / progress bar** | — | **NOT DRAWN.** 0 `<meter>`, 0 `role=progressbar` on 128 boards (re-checked). Licence figures are text only ('Licences 1,284 of 1,650', board 04; T-06/D7). | — | — | **Do not build.** Slice-1 `places-meter.tsx` has no v46 counterpart. | — |
| **Not drawn: do not build** | pagination, toasts, combobox/autocomplete, switch, tooltips other than the rail | 0 hits each (re-checked for toast, combobox, switch, 'Load more', 'Next page') | — | — | Board 04 lists 'Toast that vanishes before it can be read' under 'Never'. | — |

Feature-level parts (emit board classes, live in `apps/web/src/features/*`):
- Learning `xl-*`: format rows, format panel with one large action, progress per format, feedback, device card. Phase 3.
- Assessment `xa-*`: questions, answered strip, score card, marking guidance, readiness checklist. Phase 4.
- Vendor `xv-*`: editor steps, format panels, checklist, return-reason box, delivery blocks. Phase 5.
- Governance `xg-*`: scope line, what changed, learning-outcomes editor, references grid, catalogue preview, correction form. Phases 5–6.
- Public `xp-*`: hero, ribbon, area explorer (no auto-advance), cards, catalogue rows, experiment detail with format picker, selection, request form, status, payment. Phase 1.

### 3.4 Overlays

| Component | Purpose · classes | Source boards | Variants | States | Accessibility behaviour | Phase |
|---|---|---|---|---|---|---|
| **Dialog: ConfirmDialog (DL-1), ReasonDialog (DL-2), EditDialog (DL-3)** | native `dialog.xr-dialog`, `-head`, `-title`, `-body`, `-foot` (`flex-wrap:wrap-reverse`) | 10, B1-11, B2-08, B6-07, B7-03, B7-05; 474 `role=dialog` instances on 46 boards | DL-1 confirm (one sentence on the effect) · DL-1 destructive (red confirm) · DL-2 required reason (says who will see it) · DL-3 one or two fields (Enter saves) · `align` start/center/end (PF-04) · phone bottom sheet | open · validation error · busy (label changes, repeat presses ignored) · closed (focus back to trigger + success notice on the page) | `showModal()` makes the page inert. A focus-cycle guard keeps Tab inside (R-25). Esc = Cancel. Initial focus per board 10 (§5.3). `aria-labelledby` / `aria-describedby`. Never used for navigation, scrolling forms, long lists or reading a record (board 10). **Cancel style** is UNRESOLVED (VD-06). | 0 |
| **Drawer** (sidebar below 1024) | `.xr-shell.is-drawer > .xr-side`, `.xr-scrim`, `.xr-drawer-close` | 05, 06, 12 | min(320 px, 86 %) | open · closed | Focus goes to 'Close menu'. Esc or scrim closes, and focus returns to 'Menu'. Choosing a destination closes it. Background `inert` while open (PF-03). | 0 |
| **AccountMenu** | `xr-acct`, `xr-acct-btn`, `xr-avatar`, `xr-acct-text/name/role`, `xr-menu`, `-head`, `-item`, `-sep` | 03, 05, 11 (`xr-menu` drawn), 06 (account-menu table), 12 (keyboard), B3-07 | institution role · platform role (no institution line) · Vendor (organisation line) · Student with AR/VR/MR adds 'My device' · phone shows the avatar only | closed · open | **Disclosure pattern**, inferred from board 12's keyboard spec ('Enter opens · Tab moves through items · Esc closes and returns focus to the button') and board 05 markup: a button with `aria-expanded` + `aria-controls`, named 'Account menu: <name>, <role>' (board 12). Board 12 does not itself say 'not `role=menu`'. It is Tab between items that rules out the menu pattern. Variances: B3-07 frames 1 'Entry · account menu (Rahul has VR)' and 2 'Entry hidden · no AR / VR / MR formats' draw `role="menu" aria-label="Account"`. Board 03's button has `aria-haspopup="true"`. The 844 product instances on 85 boards carry `aria-expanded` only. The component keeps `aria-controls` (board 05) as a non-visual completion (VD-13). | 0 |
| **RailTooltip** | `xr-tip` | 06, 12 | — | shown on hover and `:focus-visible` (120 ms) | The accessible name is the destination name. Not `role=tooltip`. The only tooltip in the product. | 0 |
| **PublicMenuSheet** | `xp-sheet`, `xp-sheet-list`, `xp-sheet-actions`, `xp-scrim` | B1-01 (sheet drawn); Menu button `.xp-menu-btn` on B1-01, B1-03…B1-08 | below 1024 xp | open · closed | `aria-expanded` on `.xp-menu-btn`. Gold focus on navy. Fixed scrim (PF-05). | 1 |
| **FilterSheet (public)** | `xp-fsheet`, `xp-fsheet-panel` | B1-04 | below 1024 xp | open · closed | Modal: trap, Esc, return focus (PF-05). | 1 |

### 3.5 Shells

| Component | Structure (from board markup) | Source boards | Responsive | Accessibility | Phase |
|---|---|---|---|---|---|
| **WorkspaceShell (GL-01)** | `div.xr-app` (container `xr-app`) > `a.xr-skip` + `div.xr-shell(.is-drawer, .is-expanded, .is-rail)` > [`aside.xr-side` + `div.xr-scrim` + `div.xr-main` > (`header.xr-top` + optional `.xr-banner` + `main.xr-page#main` > `div.xr-wrap(--read 1040, --form 720) .xr-content` (container `xr-content`))] | 05, 06, 11, 12 | ≥ 1280 full sidebar 248 · 1024–1279 rail 72 (expandable, pushes content) · below 1024 drawer · below 600 phone scale. Padding 16/24/32/40 (board 01). | Landmarks `aside aria-label='<Role> workspace'` > `nav aria-label='<Role> navigation'`, `header`, `main#main`. Tab order: skip, sidebar + Help, Menu/Collapse, account, banner Help, main (board 12). | 0 |
| **Sidebar + NavItem** | `xr-side(--rail)`, `-head`, `-top`, `xr-logo-ph`, `xr-product` 'XR Learning Platform', `xr-ws`, `-label` (gold caps role), `xr-ws-inst`, `ul.xr-nav > li > a[aria-current]` (`xr-ico` + `xr-nav-text` + `xr-tip` + `xr-count`), `xr-side-foot` (Help) | 05, 06 | full · rail · drawer | Current: gold inset rule + fill + bold + `aria-current="page"`. Counts in words. ≤ 8 destinations + Help. Gold focus (PF-07). | 0 |
| **TopBar** | `xr-top`, `xr-menu-btn` ('Menu', named 'Open menu'), `xr-top-collapse` ('Collapse menu'/'Expand menu', `aria-expanded`), `xr-top-loc`, `xr-top-title`, `xr-crumbs`, `xr-acct` | 05, 11 | below 1024: navy, Menu + page title · ≥ 1024: white, collapse + breadcrumbs | Always keeps the title or breadcrumbs and the account menu. Gold focus on navy (`.xr-top :focus-visible`). | 0 |
| **HelpSupport template (GL-03, XS-07)** | page header 'Help & support' + 'Report a problem' · 'My reports' rows (SUP-#### Open/Resolved/Reopened) · report form (what happened, where (pre-filled), screenshot optional) · report detail with history | 07, 05 | same in all seven workspaces | Reached from the sidebar foot and the account menu (WCAG 3.2.6). | 0 |
| **PublicShell** | `div.xp` (container `xp`; `overflow:hidden` in the sheet, `overflow:clip` in the product, PF-06) > `header.xp-head` (`a.xp-brand aria-label='XR Learning Platform — home'`, `nav aria-label='Main'`, `xp-sel` 'Selection (n)', `xp-signin`, `xp-access` 'Request access', `xp-menu-btn`) + `main` + `footer.xp-foot` | B1-01…B1-09, 09b AR-9, B8-05 | below 600 · below 760 · below 1024 (Menu + sheet) · ≥ 1280 Selection label · ≥ 1360 brand name | Gold focus on navy. Selection link named 'Selection, empty' / 'Selection, 1 experiment'. | 1 |
| **SignIn (focused public)** | `xp-auth`, `-top` (`xr-back`), `-main`, `-card` (`xp-auth-brand` placeholder, notices, `h1.xp-auth-h`, institution sign-in, `xp-or`, e-mail form, `xp-auth-links`) | B1-09 | card padding 24/20 below 600 | Mock only (BC10). No account switcher (B8-03). | 1 |
| **FocusedTaskShell (AR-6)** | `div.xr-app` > `header.xa-bar` (sticky; `xr-back` way out + `xa-bar-end`: `xa-save` (`role=status`, `role=alert` on failure) + avatar) + `main.xr-page > .xr-wrap--form.xr-content`, no sidebar | B4-12, 09b | bar padding 16 below 600 | Skip link added (§7.4). Sticky bar scroll padding (PF-11). Note: 09b lists format feedback under AR-6, but B3-06 draws it inside the full shell, and the board wins (R-22). | 4 |

**Counts:** 58 inventory rows (56 to build, 2 'do not build'). 42 are built and baselined in Phase 0: 19 foundation, 10 forms, 5 data display, 4 overlays, 4 shells. 14 belong to later phases: 3 forms, 6 data display, 2 overlays, 3 shells.

---

## 4. Role-aware navigation

### 4.1 One typed nav config per role — CONFIRMED (navigation.json = B8-01 = boards 05/06, 0 differences, `understand/handoff-consistency.json` check 4)

Label, order and icon key are taken verbatim from board 06 script `raw[]`. Count text is the board-06 sample pattern, with numbers supplied by mock services. Base routes are proposals (START-HERE exception 5).

| Role (workspace label) | Base route | Destinations in order (icon key) | Count destinations (sr wording pattern) | Organisation line |
|---|---|---|---|---|
| Student | `/student` | Home (home) · My courses (courses) · Assessments (assess) · Progress (progress) · **Help (foot)** | — | Institution |
| Faculty | `/faculty` | Overview (overview) · My courses (courses) · Assessments (assess) · Question bank (qbank) · Marking (marking) · Students (people) · **Help** | Marking: 'n written answers to mark' | Institution |
| Institute Admin | `/institute` | Overview · Content access (caccess) · Student access (saccess) · People (people) · Requests (requests) · Usage (usage) · **Help** | Requests: 'n device requests to forward' | Institution |
| Vendor | `/vendor` | Overview · My experiments (exps) · **Help** | — | Vendor organisation ('Northline Simulation Studio') |
| Academic Reviewer | `/reviewer` | Overview · Review queue (queue) · Reviewed by me (reviewed) · **Help** | Review queue: 'n waiting for review' | none (platform role; 13 Q5 open) |
| Content Manager | `/content-manager` | Overview · Ready to publish (publish) · Content library (library) · Updates (updates) · Course codes (codes) · **Help** | Ready to publish: 'n ready to publish' | none |
| Super Admin | `/admin` | Overview · Requests (requests) · Institutions (inst) · Content (content; section tabs Updates · All content) · Academic structure (structure) · Platform roles (roles) · Operations (ops; section tabs Device transfers · Support · Access ending) · **Help** | Requests: 'n requests under review' | none |
| Public header (surface, not a role, BC1) | `/` | Browse experiments → PU-04 · Areas → PU-02 · For institutions → PU-01 section · Selection (n) → PU-07 · Sign in → XS-01 · Request access → **PU-07 on the boards** | Selection count | — |

Rules (board 06 'Navigation rules'; `navigation.json#rules`):
- At most 8 destinations plus Help.
- Only real destinations: no disabled placeholders, no Settings or Reports.
- The order never changes by role state.
- Detail screens, flow steps and tabs never enter the sidebar. Nested parts become section tabs.
- No demo strip, no 'Viewing as', no sample-account selector, no role switcher. Multi-role is deferred (XS-02).
- A role opening another workspace sees XS-06 'Not your workspace'.

**Handoff defect, board wins — CONFIRMED.** `navigation.json` routes 'Request access → PU-08', but the B1-01 markup links `a.xr-btn--on-dark.xp-access href="B1-06-Selection.dc.html"`, which is PU-07 (3 instances).

### 4.2 Active-state rules — CONFIRMED (board markup scan)

- `aria-current="page"` goes on the destination that owns the current screen, **including its details, flows and tabs**. Examples: B7-03 Institution detail → 'Institutions'; B2-12 Experiment hub → 'My courses'; B4-09 Marking → 'Marking'; B6-03 Review a submission → 'Review queue'.
- Help is current on the Help pages (board 05 `helpCurrent`).
- **Message pages (not available, XS-06) mark nothing as current** (board 08 'nothing in it is marked current because the page is not a destination').
- The focused task (ST-13 attempt, B4-12) has no sidebar.
- The current item is shown by the gold inset rule, fill, bold and `aria-current`; never colour alone. The CSS keys on `[aria-current="page"]`, so keep that value.
- Section tabs use `aria-current="page"` on the current tab link (board 06 'Nested destinations').

### 4.3 Below 1024 px app width: Menu button and drawer; rail at 1024–1279 — CONFIRMED (05, 06, 11, 12)

- **Below 1024:** the sidebar is hidden. The navy top bar shows `button.xr-menu-btn` (visible 'Menu', name 'Open menu') and the page title. The drawer is `min(320px, 86%)` over a scrim. Focus goes to 'Close menu'. Esc or scrim closes, and focus returns to Menu. Choosing a destination closes it. Product adds fixed positioning and an inert background (PF-03).
- **1024–1279:** a 72 px rail by default with tooltips. 'Expand menu' widens it to 248 and pushes the content (`.is-expanded`). The choice is **remembered per person** (13 Q7). With mock auth, store it as a per-mock-user UI preference in browser storage. It is not a product setting. PROVISIONAL.
- **≥ 1280:** the full sidebar, with `.is-rail` optional through the same toggle.
- Thresholds are measured on **app width** (container `xr-app`). On systems with classic scrollbars, a 1024 px window gives about 1009 px of app width and shows the drawer (R-20). INFERRED; accepted by the design wording.

### 4.4 Account menu content — CONFIRMED (board 06 table, board 03)

| Workspace | Name / role line | Institution line | Items |
|---|---|---|---|
| Student | Rahul Verma · Student | Godavari Institute of Technology | My device* · Help · — · Sign out |
| Faculty / Institute Admin | name · role | institution | Help · — · Sign out |
| Vendor | Anil Shetty · Vendor | Northline Simulation Studio (organisation) | Help · — · Sign out |
| Academic Reviewer / Content Manager / Super Admin | name · role | none (13 Q5 open) | Help · — · Sign out |

\* Only when the Student has AR, VR or MR access (B3-07 frame 2 'Entry hidden · no AR / VR / MR formats'). There is no workspace or role switcher. 'Sign out' ends the **mock** session (BC10). Names come from the sample world, never from defaults.

### 4.5 Logo placeholder and the committed branding PNG

- **Treatment — CONFIRMED (BC12; `assets.json`; B8-03 'Logo box now reads "placeholder"').** One `LogoPlaceholder` component renders the exact text 'BITS Pilani / WILP logo — placeholder' in its dashed box:
  - `.xr-logo-ph`: white, ink-2 12/16 600, `outline:1px dashed #7A82AE`
  - `.xp-logo`: 148×48
  - `.xp-auth-brand`

  The public brand link is named 'XR Learning Platform — home'. The product name 'XR Learning Platform' is plain, swappable text (13 Q2). An approved asset later changes one component, and its baselines are re-approved together.
- **Committed PNG — UNRESOLVED (VD-03).**
  - `branding/bits-pilani-wilp-logo.png` is committed at the repo root, with copies under `ui-ux/13-full-platform-design/**` and `ui-ux/18-unified-functional-platform/assets/`.
  - `1b090c9:ui-ux/00-project-context/PROJECT_CONTEXT.md` line 104 lists it under 'Protected assets', and line 125 (D-12) says 'Logo is the only confirmed brand asset'.
  - v46 BC12, `assets.json` ('The approved file was never supplied') and board 13 Q1 ('Supply the approved BITS Pilani / WILP lockup file') treat the logo as unapproved.

  Do not import the PNG into the product until the owner says whether it is the approved lockup.

---

## 5. Forms, tables, dialogs and validation behaviour

### 5.1 Validation, exactly as drawn — CONFIRMED rules / PROVISIONAL mechanics

- Validate on the **primary action** (B8-07 'Validate on the primary action'). The boards show no live, as-you-type validation. Re-validate on the next primary action and keep what was typed (BR-122). Implement with the foundation's React Hook Form + Zod (`1b090c9:v2/apps/web/src/lib/forms.test.tsx`), mode `onSubmit`, re-validate mode `onSubmit`. PROVISIONAL.
- Errors appear **in words under the field** (`xr-error` / `xw-ferr`, `aria-invalid`, `aria-describedby` = hint + error) **and in a summary at the top** (`xw-errsum role=alert tabindex=-1`), whose links move focus to the field (board 12 'Errors'; B8-07). The B5 vendor 'missing items' summaries keep their drawn per-item 'Go to …' buttons and focusable wrapper (§3.2 ErrorSummary). The emitted class is open (VD-22).
- **Focus on submit:**
  - page forms with a summary focus the summary
  - dialogs focus the first invalid field, and its message is read with it (board 10)
  - single-field forms (ST-18) focus the field
- Required unless marked; markers render exactly as drawn (§3.2 Field). Required reasons apply to return, send back, withdraw, pause, restore, hold, override and withdraw scope (B8-07 'Reasons'). The DL-2 dialog says who will see the reason (board 10).
- Only the duplicate checks that are drawn: codes, names, scopes, student IDs and e-mails (B8-06 'Validation'). Error copy is taken from the board frame for that screen; no invented messages.
- Busy: the label says what is happening ('Withdrawing…'), the button is `aria-disabled`, and repeat presses are ignored (boards 03, 10).

### 5.2 Tables

Labelled rows below 760 px of content, every row opens its record, the visually hidden caption, and the B1-10 sort control (§7.1). Editable tables keep one input per stacked row (board 11 'Toolbars and tabs').

### 5.3 Dialog focus management — CONFIRMED (board 10) with board variances

| Rule (board 10 'Keyboard path' + 'States') | Build |
|---|---|
| Enter or Space on the trigger opens; the page becomes inert | `showModal()` |
| Initial focus: first field (DL-2, DL-3) · primary button (DL-1) · **Cancel (destructive DL-1)**. Specimen 'DL-1 · Confirm · destructive · focus on Cancel' ('Remove Priya Natarajan from Section A?', note 'Cancel takes initial focus.') | `initialFocus` derived from the dialog kind; not overridable per screen |
| Tab/Shift+Tab cycle Close, field, Cancel, confirm, and never leave the dialog | focus-cycle guard (showModal alone lets Tab reach browser chrome, R-25) |
| Esc = Cancel, nothing changes; a typed reason is discarded only after Cancel | handle the `cancel` event |
| On close, focus returns to the trigger; a success notice on the page confirms | If the trigger no longer exists (for example the row was removed), focus the flash notice (`role=status tabindex=-1`), the pattern drawn as 'FlashStatus' (`understand/surface-super-admin.json` SC19) |
| Below 600 app width: at most one field; bottom sheet, buttons stacked, confirm on top | PF-04; `xr-dialog-foot{flex-wrap:wrap-reverse}` already gives confirm-on-top |

**Variances found (follow board 10; owner to acknowledge, VD-07) — CONFIRMED.** Destructive DL-1 dialogs on these boards move initial focus to the **danger** button:

- **B2-08** frame 5 'Remove member (DL-1)': `open: () => { …; focus(pid + '-rm-go'); }`, where `#…-rm-go` is the `xr-btn--danger` 'Remove from group'. 8 dialog instances.
- **B2-09** frames 2–3 'Remove · …': same code, 'Remove course'. 6 instances. Its proof board B2-14 (4 instances) shares the engine.
- **B4-07** frame 2 'Delete a used question · DL-1': `askDel: () => { …; focus(pid + '-dgo'); }` on 'Delete question'. 5 instances.

The product follows board 10 (focus on Cancel) everywhere. The component allows no per-screen override.

**Cancel style variance — UNRESOLVED (VD-06).** Board 10 renders Cancel as `xr-btn--text` (quiet), matching its text 'Cancel first (quiet)'. **Every product board** renders it as `xr-btn--secondary`: 397 'Cancel' buttons, 12 'Keep answering' and 47 `keepLabel` buttons (B5-03…B5-09) across 44 boards (B1-11 … B7-12). Only board 10 uses `--text`: 5 Cancel buttons in its 3 `<dialog>` specimens. The Dialog component needs one default. Recommendation: the product-board rendering (`--secondary`), because 44 approved screen boards and their visual baselines use it. The owner must confirm.

### 5.4 Keyboard

| Pattern | Keys | Source |
|---|---|---|
| Dialog, drawer, account menu, filter sheet, public menu sheet | Esc closes; focus returns to the opener | 10, 06, 12 |
| Section tabs, hub tabs (links) | Tab between them | 03, 06, B2-12 |
| StatusTabs (`role=tablist`) | ← → roving tabindex; Tab enters the panel | 03, 12 |
| Radio groups, 1–5 scale | ← → / ↑ ↓ | 12 |
| Error summary | Links move focus to the field | 12 |
| 'Go to decision' | Moves focus to `.xr-dpanel` (`tabindex=-1`) | 13 fix 'Mobile decision shortcut'; 11 |
| Rail | Tooltip on focus; name = destination | 06 |
| Answered-questions strip (`xa-strip`) | 44×44 jump links, `scroll-margin-top:72` | B4-12 |

### 5.5 Live regions — CONFIRMED (board 12, 04; 1,883 `role=status`, 396 `role=alert`, 120 `aria-busy` on the boards)

- Success and info notices, toolbar result counts and save state use `role=status` (polite).
- Error summaries, failed loads and save failures use `role=alert`.
- Loading regions get `aria-busy=true` plus sr text ('Loading your courses').
- After a decision, focus moves to the result: the decided panel, flash or heading (B8-07).
- **Mechanics (PROVISIONAL):** keep status containers mounted and change their text, so screen readers announce reliably. Do not mount a new `role=status` node together with its message.

---

## 6. Responsive behaviour

### 6.1 Model — CONFIRMED

Container queries, not media queries:
- B8-07 'Responsive layout — container queries'.
- Board 11 'The shell switches by its own width'.
- 89 `@container` blocks; the only `@media` rule is reduced motion.
- Named containers: `xr-app` (on `.xr-app`), `xr-content` (on `.xr-wrap* .xr-content`), `xp` (on `.xp`).

The product root must therefore render `div.xr-app` (workspace and focused shells) or `div.xp` (public), or the queries never match. Proof widths are 1440 · 1024 · 768 · 375 (B8-05); reach-test viewports are 1440×900, 1024×768, 768×1024 and 375×812 (B8-05 'Real-pointer reach').

| Container | Thresholds → behaviour |
|---|---|
| `xr-app` | below 600: phone scale, full-width actions and dialog buttons · 600–1023: Menu + drawer, padding 24 · ≥ 1024: sidebar (rail 72 by default to 1279), white top bar + breadcrumbs, padding 32 · ≥ 1280: full 248 sidebar, padding 40 · below 908: governance dialogs bottom-aligned (canvas `xg-dlg`; becomes PF-04 `align`) |
| `xr-content` | below 520: 1–5 scale vertical · below 600: toolbar wraps (search full row, 2nd filter into More filters), stepper current label only, key-value lists stack · below 760: tables become labelled rows, comparison stacks · ≥ 760: three next-stage cards · ≥ 860: decision layout + panel, flow summary panel, 'Go to decision' hidden · ≥ 1060: list + side panel · 600–1059: assign panel (`xw-apanel`, B2-09) becomes a 2-column grid under the table; 800–1059: 3 columns with the action in column 3 |
| `xp` | below 600 phone · below 760 formats table labelled rows · below 1024 Menu + sheet, filter sheet, bottom bar · below 1280: inner padding 40, hero heading 54 px, 4-up grids become 2-up, experiment detail head one column (art max 560) and body `minmax(0,1fr) 340px` · ≥ 1280 Selection label · ≥ 1360 brand name |

**Content-width arithmetic (INFERRED from CSS; it matters for B1-10 and for tests).**

Content = app width − sidebar − 2 × side padding.
- `.xr-page` side padding is 16 below 600, 24 at 600–1023, 32 at 1024–1279 and 40 from 1280.
- The sidebar is 0 below 1024, 72 as a rail and 248 expanded or full.
- `.xr-wrap` caps content at 1160, `--read` at 1040 and `--form` at 720.

So content is:
- app − 32 below 600
- app − 48 at 600–1023
- app − 136 (rail) or app − 312 (expanded) at 1024–1279
- app − 328 (full) or app − 152 (`.is-rail`) from 1280

**Labelled rows (content below 760) occur exactly when:**
- app width is below 808, or
- app width is 1024–1071 with the sidebar expanded, or
- the table is inside `.xr-wrap--form` (always).

They never occur at 1024–1279 with the rail, or from 1280.

| App width | Content width | Table mode |
|---|---|---|
| 375 | 343 | labelled rows |
| 768 | 720 | labelled rows |
| 807 | 759 | labelled rows (boundary) |
| 808 | 760 | table (boundary) |
| 1024, rail | 888 | table |
| **1024, expanded** | **712** | **labelled rows** |
| 1071, expanded | 759 | labelled rows (boundary) |
| 1072, expanded | 760 | table (boundary) |
| 1440 | 1112 | table |

Tables inside `.xr-wrap--form` (720 max) are always labelled rows.

### 6.2 Natural document scrolling — CONFIRMED

Product pages grow with their content. The fixed heights are canvas presentation only:
- Batches 1–3 frames use `overflow-y:auto; height:Npx` (155 frames, START-HERE exception 3).
- The `min-height: 900px` frame wrappers.

Shell min-height becomes the viewport (PF-02). There are no nested scroll containers except the tab strips' own sideways scroll.

### 6.3 Overlays fixed to the viewport — CONFIRMED need

Drawer and scrim (PF-03), dialogs (native top layer, PF-04), public scrim and filter sheet (PF-05).

Sticky (not fixed) elements remain. All come from the sheets; this re-check found 8 `position:sticky` rules:
- the focused-task `.xa-bar` (top 0)
- the decision panel where drawn (`.xr-dpanel`, top 24 from 860 content; §6.4)
- the flow summary panel (`.xw-sum`, top 16 from 860 content)
- the tab-strip fade (`.xr-tabs::after`)
- in the public shell: `.xp-bottombar` (bottom, below 1024), `.xp-filters` and `.xp-sumcard` (top 24), and `.xp-fsheet-foot` (bottom, inside the filter sheet)

The public ones outside the filter sheet stick to the viewport only with PF-06 (`overflow:clip`).

### 6.4 Sticky versus static decision panel — UNRESOLVED (VD-05)

- **Sticky** (foundation `.xr-dpanel{position:sticky;top:24px}` from 860 content). Drawn on boards 03, 09a, 11, B1-11 (17 panels), B2-09 (6), B3-11 (5), B4-05 (5), B4-09 (5), plus proof and flow boards and 3 panels on B7-09/B7-10: 69 sticky panels in all.
- **Static** (`xr-govern.css` `.xr-dpanel.xg-static{position:static}`, commented 'the panel sits at the top of its column (never floats over content); dialogs open beside it'). Drawn on 71 panels: B6-03 (6), B6-04 (5), B6-07 (6), B6-11 (9), B6-12 (2), B6-13 (1), B6-14 (12), B7-05 (8), B7-09 (6), B7-10 (6), B7-11 (2) and B7-12 (8).
- **B8-03** 'Visual and responsive consistency' says: 'Sticky / fixed elements — None fixed to the viewport inside frames; the decision panel is static (Batch-6 rule).'

The owner chooses between (a) per board as drawn, which gives the highest baseline parity and is the recommended default, and (b) static everywhere, following B8-03, which means re-approving the B1/B2/B3/B4 baselines.

---

## 7. Accessibility

### 7.1 B1-10 remediation (BC13; START-HERE Known exception 1) — CONFIRMED defect / PROVISIONAL design (VD-04)

**Root cause (selector).** `design/handoff-v46/canvas-v46/project/xr-foundation.css`:

```css
@container xr-content (max-width:759.98px){
  .xr-table thead{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
  .xr-table,.xr-table tbody,.xr-table tr,.xr-table td{display:block;width:100%} …
  .xr-table td[data-label]::before{content:attr(data-label);…} }
```

Clipping is a visually-hidden technique. It keeps descendants in the accessibility tree **and in the tab order**. On B1-10 the 'Received' header holds a real `<button>`:

```html
<th scope="col" aria-sort="{{ q.ariaSort }}">
  <button type="button" class="xr-btn xr-btn--text" style="min-height:32px;padding:0;…">
    Received<svg …/><span class="xr-sr">, {{ q.sortLabel }}. Change order</span>
  </button>
</th>
```

`sortLabel` is 'Received, newest first' or 'Received, oldest first'. Below 760 px of content that button is a focusable 1×1 invisible control.

**Where it happens** (`derived/frame-index.json` lists the control in frames 0–3 and 8–9; frames 4–7 render no table):
- **Drawn defective** on B1-10 frames 3 'Filtered · Under review' (720 app width, content 672), 8 'Mobile 375' and 9 'Mobile 375 · More filters open' (content 343). Frames 0–2 (1440) show the header normally.
- **Exact range** (arithmetic, §6.1). Content is below 760 when:
  - app width is below 808 (phone and drawer), or
  - app width is 1024–1071 with the sidebar expanded, or
  - the table is inside `.xr-wrap--form` (always).

  It never happens at 1024–1279 with the rail (content ≥ 888) or from 1280 (content ≥ 952).
- **B1-13 does not repeat the defect.**
  - Its only `<thead>` control (step 08) sits in a 1440-px SA-02 thumbnail scaled 0.3 inside `div[aria-hidden="true"][inert]`.
  - At 1440 app width the content is 1112, so the header is not clipped, and nothing in the subtree is focusable.
  - B1-13 is not in `frame-index.json`. START-HERE Known exception 1, B8-03 and B8-08 name only B1-10.
- A scan of all 128 boards finds controls inside `<thead>` only on B1-10 (10 tables) and that B1-13 thumbnail (1). Other clip-hidden heads have no controls today: `xr-table` 507 instances, `xp-ftable` 35, `xp-compare` 13.

**Accessible-name defect.** The visible text 'Received' plus the sr text ', Received, newest first. Change order' produces the name 'Received , Received, newest first. Change order' (as listed in `frame-index.json`). Fix:
- Header button: visible 'Received' + sr ', newest first. Change order' (or ', oldest first. Change order'). Name: 'Received, newest first. Change order'.
- The `th` keeps `aria-sort="descending|ascending"`.

**Fix: once, in DataTable (PF-01).**

```html
<!-- above the table, inside the same .xr-content, in the .xr-toolbar-status row next to the role=status count -->
<div class="xr-x-table-sortbar">
  <button type="button" class="xr-btn xr-btn--text xr-btn--sm">Received, newest first<svg class="xr-ico xr-ico--16" aria-hidden="true">…</svg><span class="xr-sr">. Change order</span></button>
</div>
<th scope="col" aria-sort="descending">
  <button type="button" class="xr-btn xr-btn--text xr-x-th-sort">Received<svg …/><span class="xr-sr">, newest first. Change order</span></button>
  <span class="xr-x-th-text">Received</span>
</th>
```

```css
/* xr.product — PF-01 (BC13; B8-03; B8-08) */
.xr-x-table-sortbar{display:none}
.xr-table .xr-x-th-text{display:none}
@container xr-content (max-width:759.98px){
  .xr-x-table-sortbar{display:flex !important;align-items:center;gap:8px}
  .xr-table .xr-x-th-sort{display:none !important}
  .xr-table .xr-x-th-text{display:inline !important}
  .xr-table thead :is(a,button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])){display:none !important}
}
@container xp (max-width:759.98px){ .xp-ftable thead :is(a,button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])){display:none !important} }
@container xp (max-width:599.98px){ .xp-compare thead :is(a,button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])){display:none !important} }
```

- **Both controls share one sort state.** Activating either one reverses the rows and flips `aria-sort`. Only one is ever rendered (`display:none` removes the other from the tab order and the accessibility tree).
- **Why CSS rather than a ResizeObserver:** the same threshold as the labelled-row rule, correct at SSR, and no hydration flash. Alternative: `inert` or not rendering, which needs a container-width hook and so two sources of truth.
- **Copy and placement** reuse board strings ('Received, newest first' / 'Received, oldest first', 'Change order'). The placement in the toolbar-status row follows the precedent of '4 requests · oldest first' (09a AR-2) and B6 queue counts. It needs owner sign-off as an expected deviation on the B1-10 baseline.
- Consider explicit `role=table/row/cell/columnheader` in labelled-row mode, because `display:block` can drop table semantics in Safari (R-15). Verify with VoiceOver.

**Automated tests (PROVISIONAL spec):**

1. **`e2e/a11y/datatable-sort.spec.ts`** against SA-02 on mock services, at 375×812, 768×1024, 1024×768 (sidebar **expanded**) and 1440×900. It also runs at the boundary app widths 807/808 (drawer) and 1071/1072 (sidebar expanded): at 807 and 1071 the sort bar must show, and at 808 and 1072 the header button must show. The spec asserts that `.xr-app` width equals the viewport width before it checks a boundary, because classic scrollbars reduce app width (R-20).
   1. Tab from the skip link to the end of `main`. For every `document.activeElement`, assert `checkVisibility({checkOpacity:true, checkVisibilityCSS:true})`, a bounding box of at least 2×2 inside the viewport, and that no ancestor clips it to zero (`clip: rect(0 0 0 0)` / `clip-path: inset(50%)` / zero-size `overflow:hidden`).
   2. Below 760 content: exactly one visible control named /Received/ above the first row. Activating it reverses the rows: the first REQ changes and `th[aria-sort]` flips.
   3. At 1440: the header button is visible, and `.xr-x-table-sortbar` is not displayed.
   4. axe has no violations on that view.
2. **Generic helper `expectNoInvisibleFocusTargets(page)`** run on every built route at the four widths. It catches this defect class anywhere (B8-05 Phase 7 consolidation).
3. **Vitest + Testing Library:** a sortable column renders `th[aria-sort] > button.xr-x-th-sort + span.xr-x-th-text` plus the `.xr-x-table-sortbar` button. Both call `onSortChange` and expose the same label. jsdom cannot evaluate container queries, so visibility is tested only in Playwright.

### 7.2 Sidebar focus-ring contrast — CONFIRMED defect (VD-11)

- Board 02 'Links and focus': 'Focus on navy · Ring #F7C95B · 10 : 1 against navy'.
- The stylesheet switches the ring to gold only for `.xr-dark`, `.xr-top`, `.xp-head`, `.xp-dark` and `.xp-foot`.
- `.xr-side` (background #141B5E) keeps #1F4FD8 at **2.35:1**, below the 3:1 the design claims for focus rings (WCAG 1.4.11 / 2.4.11 intent). The rail and the drawer have the same problem.

Fix PF-07 gives 9.98:1. Add a contrast assertion to the component tests: the computed `outline-color` of a focused nav link inside `.xr-side` is #F7C95B.

### 7.3 Reduced motion, targets, landmarks, Help

- **Reduced motion — CONFIRMED.** One global rule makes animations and transitions instant (`xr-foundation.css`). The shimmer stops and the spinner becomes a static ring while its label carries the state (board 12 table). New motion (PF-08) is gated by `prefers-reduced-motion: no-preference`. Nothing auto-advances, including the public explorer (B1-12 'Explorer transitions 280 ms, instant with reduced motion').
- **Targets — CONFIRMED** (board 12 'Target size'; B8-07):
  - 44 px: buttons, nav items, menu items, inputs, icon buttons, check and radio rows (whole label)
  - 36 px: small row and toolbar buttons
  - 40 px: `xr-btn--text` (`min-height:40`)
  - 28×28: chip remove
  - chips are not interactive

  All exceed WCAG 2.5.8 (24×24). A test asserts that every interactive element's box is at least 24×24 at all four widths.
- **Landmarks — CONFIRMED.**
  - Workspace: `aside aria-label='<Role> workspace'` > `nav aria-label='<Role> navigation'`; `header.xr-top`; `ol.xr-crumbs aria-label='You are here'`; `main.xr-page#main`; sections `aria-labelledby` their H2.
  - Public: `header.xp-head`, `nav aria-label='Main'`, `main`, `footer.xp-foot`.
  - One H1 per page (boards 05, 08, 12).
- **Consistent Help (WCAG 3.2.6) — CONFIRMED.** Help is the last sidebar item in all seven workspaces, separated by a hairline, also in the drawer and in the account menu. The Help page is the same template everywhere (boards 06, 07, 12; `navigation.json#rules`). A test checks that Help is the last `nav` item and an account-menu item in every role.
- **Other rules:** status never colour-only; icon-only controls named; counts spoken in words; external links announced; no error codes in messages (`understand/visual-system.json#a11yRules` A-STATUS-WORDS, A-NAMES, A-EXTERNAL, A-NO-CODES).

### 7.4 Skip link — CONFIRMED need / PROVISIONAL scope (VD-16)

Board 12 'Shell tab order' makes 'Skip to main content' the first stop. It is drawn only on boards 05 and 12 (2 `xr-skip` instances), and no B1–B8 product frame draws it (R-21). Add it to the WorkspaceShell, the FocusedTaskShell and the PublicShell (WCAG 2.4.1). On the public header it is invisible until focused, so it does not change visual parity. It is still an expected deviation for keyboard-path tests.

---

## 8. States catalogue

B8-07 'States every list / page needs': loading · empty · failed (retry) · no match · read-only · success (flash with `role=status`) · decided. `handoff/README.md` 'Done, for one screen' says 'every state drawn on the board exists'. Use only the drawn patterns.

| State | Drawn pattern (board 04 'State grammar' / 08) | Classes / component | Representative boards that draw it | A11y |
|---|---|---|---|---|
| Loading | Skeleton in the shape of the content; never a blank page or full-screen spinner | `xr-skel`, `aria-busy` → LoadingState | 03 'Loading your courses'; B1-10 frame 5 'Loading'; 27 boards with skeletons (`xr-skel`) | Announced politely |
| Empty | Icon, one line, one next step | `xr-empty` → EmptyState | 03 'No assessments yet'; B1-10 frame 7 'Empty · no requests yet'; B8-05 VE-01 'Nothing needs you right now' | — |
| Failed + retry | Error notice in place + 'Try again' + 'Report a problem'; 'Nothing was lost' / 'Nothing has changed. Try again.' | `xr-notice--err` → FailedState | 03 'The simulation didn't open. Nothing was lost.'; B1-10 frame 6 'Failed + retry'; B6-11, B7-10 critical-states boards | `role=alert` |
| No match | Empty pattern + 'Clear filters' | NoMatch | B1-10 frame 4 'No match' | count in `role=status` |
| Read-only | Lock chip; values as text; who has it now and when it can change | `xr-status--paused` 'Read-only' + Notice | 03 'With Academic Reviewer since 2 Oct. You can edit again if it is returned to you.'; B2-02 'Paused · read-only' | — |
| Refused with reason | Notice with quoted reason, who, when, next action | Notice reason variant (`xv-reason`, `xp-reason`) | 04 'Returned to you'; B5-07 | reason box focusable |
| Waiting on another role | In-progress or waiting chip + one line; never promise a time | StatusPill + text | 04 'Waiting for marking …' | — |
| Success / confirmation | Notice in place (flash `role=status`, focus target) or AR-10 confirmation page with reference | Notice / MessagePage | 03 'Access given'; 08 'Report sent. Reference SUP-0213.' | focus moves to the result |
| Decided | Decided panel / result block | DecisionPanel decided state | B1-11, B6-07, B7-05 | focus moves to the result |
| Paused / inactive | Shell banner (amber / navy) + Help | ShellBanner (XS-08) | 04, 05, 08, B7-04 | `role=status`, never modal |
| Not available | Dashed chip + words, or AR-10 page | FormatBadge `--off` / MessagePage | 04, 08 | — |

**Where boards do not draw a state — INFERRED (markup scan of 75 B1–B7 screen boards, excluding index, flow, proof and change-log boards; heuristic).** Scan patterns: loading = `xr-skel|aria-busy="true"|Loading`; failed = 'Try again|Retry|couldn't|didn't …'; no match = 'No match|Clear filters'.

- **Loading** is not drawn on 37 boards, including every Faculty board except B4-02 and B4-08 (B4-01, B4-03…B4-07, B4-09…B4-13), B2-01, B2-03, B2-07…B2-10, B3-02…B3-04 and B3-06…B3-11.
- **Failed** is not drawn on 52 boards. For B6/B7 screens some failures are drawn on the critical-states boards B6-11 and B7-10, so that figure overstates the gap.
- **No match** is not drawn on 57 boards. Many of these screens have no filters, so the state does not apply.

**Rule (PROVISIONAL, VD-12):**
- Every list and page renders all applicable B8-07 states through the shared components above.
- Copy comes from that screen's board when drawn.
- Otherwise use the board-04 copy formula, for example 'We couldn't load <thing>. Nothing has changed. Try again.', which `understand/surface-*.json` shows reused verbatim across surfaces.
- Record each undrawn-state string in a per-screen **state copy register** for owner sign-off.
- No new visuals.

The per-screen coverage matrix is built from boards + frame captions in each phase's screen spec.

---

## 9. Testing

### 9.1 Visual regression — PROVISIONAL (VD-18)

**Prerequisites (re-checked; owner decision inside VD-18).**
- **Runner.** No runner exists today:
  - the repo has no git remote (`git remote -v` is empty)
  - `1b090c9` has no CI configuration (no `.github/workflows` or other CI file)
  - this Mac has no container runtime (no `docker`, `podman` or `colima`)

  The owner chooses hosted CI or a local Linux container runtime. Until one exists:
  - capture the board reference and the product screen **in the same Playwright run on the same machine**, so OS text rasterisation cancels out
  - keep board captures as run artefacts, not as committed cross-OS baselines
- **Vendored inputs.** These files live in a test-only tools folder, outside every product package and outside the `files` of `@xr/ui` (for example `v2/tools/board-capture/vendor/`; PROVISIONAL):
  - `react@18.3.1/umd/react.production.min.js`
  - `react-dom@18.3.1/umd/react-dom.production.min.js`
  - `@babel/standalone@7.29.0/babel.min.js`
  - the Public Sans woff2 files

  They are fetched once, with owner approval. A check verifies the three scripts against the sha384 values `REACT_SRI`, `REACT_DOM_SRI` and `BABEL_SRI` in `runtime/support.js`.
- **`support.js`** runs only inside this harness, which is the runtime README's documented offline-preview path. It never ships (§10.1).

**Reference capture, offline and reproducible:**

1. Copy `design/handoff-v46/canvas-v46/project` and `runtime/support.js` to a scratch folder. Never edit the frozen files (runtime/README.md 'Preview a board offline').
2. Serve the folder statically.
3. `page.route()` intercepts unpkg.com and fulfils each request with:
   - the vendored bytes
   - `content-type: application/javascript`
   - **`Access-Control-Allow-Origin: *`**

   `support.js` loads these scripts with `integrity` and `crossOrigin="anonymous"` (`cdnScriptFor`, `loadScript`). A response without CORS headers fails the SRI check, and the board never renders. Alternative: set `window.__resources[url]` with `addInitScript`, which `support.js` honours. That bypasses SRI, so it relies on the hash check above.
4. Intercept Google Fonts. Serve a CSS stub plus the **same self-hosted Public Sans woff2** the product uses (R-18), also with CORS headers.
5. Wait for `document.fonts.ready` and for the DC runtime to finish: no `{{` text left, and the `.b1-frame` count equals the frame-index count.
6. Screenshot each `.b1-frame`. Name it `<board>-f<index>-<caption slug>` from `derived/frame-index.json`, which lists 966 product frames. Batch-0 specimen boards and B1-13 frames are not in the index; enumerate them directly.
7. For the cropped Batch 1–3 frames, inject harness-only `.b1-frame{height:auto!important;overflow:visible!important}` to capture full content. Keep the cropped captures for traceability.

**Environment (once a runner exists).** One Linux container: the official Playwright image matching `@playwright/test` 1.63.0 (pinned in `1b090c9:v2/apps/web/package.json`). It runs the same Chromium with the same fonts for both board and product captures. macOS and Linux rasterise text differently.

**Product capture:**
- Viewport width = frame width (1440, 1080, 1024, 768, 720, 600 or 375).
- **Viewport height is 900 for every board-parity capture.** Board `.xr-app`/`.xr-shell` frames carry the canvas `min-height: 900px` (1,037 uses), while the product `.xr-app` is `min-height:100dvh` (PF-02). At any other height, short screens give a different image height, and `toHaveScreenshot` fails on size before it compares pixels.
- Public `.xp` frames have no min-height, so the product capture neutralises PF-02's `.xp` min-height.
- The heights 768, 812 and 1024 are for the reach and keyboard suites only.
- Full-page screenshot of `div.xr-app` or `div.xp`. Dialogs are compared as element screenshots of `.xr-dialog`, because board dialogs are frame-absolute and product dialogs are top-layer.
- The state is driven through **typed mock-service seeds** in test code (one connected state, BC14). Time is fixed with Playwright's clock API, not a product demo clock (ARCHITECTURE §14 'no demo clock'; sample 'now' dates differ by batch, OD-B6-12/OD-B7-14).
- The seeding seam needs a recorded test-only exception (VD-17).

**Tolerances:**

| Target | threshold | maxDiffPixelRatio |
|---|---|---|
| Component specimens | 0.1 | 0.001 |
| Screen frames | 0.2 | 0.005–0.01, masks for dynamic text |

Also `animations:'disabled'`, `caret:'hide'`, `reducedMotion:'reduce'` (`understand/visual-system.json#visualRegression.comparison`).

**Expected deviations** (each needs an owner-approved baseline with a note citing its finding):
- B1-10 sort control (PF-01)
- skip link (§7.4)
- gold sidebar focus (PF-07)
- dialog position, bottom sheet and Cancel style (PF-04, VD-06)
- fixed drawer (PF-03)
- decision panel per VD-05
- global-override effects (R-16)
- canvas-only elements removed (§10)
- the 30 plain-text error summaries normalised to linked (VD-21), and the ErrorSummary class choice (VD-22)

**Baselines per phase** (`understand/visual-system.json#visualRegression.baselinesPerPhase`):

| Phase | Boards baselined |
|---|---|
| 0 | Batch-0 specimens 01–08, 10, 11, 12 — the component and shell specimens, including 7 roles × banner states from board 05 canvas props. The ErrorSummary specimen comes from a linked product-board `xw-errsum` instance, for example B4-04 (VD-22) |
| 1 | B1-01…B1-11, B7-02, B7-03 (≈123 frames) + B1-12 (32) |
| 2 | B2-01…B2-12 (≈140) + B2-13, B2-14 (41) |
| 3 | B3-01…B3-11, B7-09 (≈106) + B3-12, B3-13 (41) |
| 4 | B4-01…B4-13 (≈119) + B4-14, B4-15 (39) |
| 5 | B5-01…B5-07, B6-01…B6-07, B6-10 (≈88) + B5-08, B5-09, B6-11, B6-12 (54) |
| 6 | B6-04, B6-08, B6-09, B7-01…B7-09 (≈98) + B6-13, B6-14, B7-10…B7-12 (90) |
| 7 | B8-05 (8 entry screens × 4 widths = 32) + flow boards end to end on one state |

**Phase-0 specimen harness (VD-17).** Components are compared one to one before any screen exists. Options:
- (a) Vitest browser mode on Playwright Chromium, rendering specimens and taking screenshots (verify that the pinned Vitest 4.1.11 supports it)
- (b) a separate **non-deployed** specimens workspace app, which needs a boundary-matrix entry

It must never be a route inside the product app.

### 9.2 Component tests

- Vitest + Testing Library (already in the foundation: Vitest 4.1.11, RTL 16.3.3, user-event 14.6.7, jest-dom 7.0.1).
- Add axe checks with `axe-core` through `vitest-axe` or a direct `axe.run`. `axe-core` 4.13.0 is only a transitive dependency today (through `eslint-plugin-jsx-a11y`), so the direct devDependency must be pinned to the repo's exact-version and minimum-release-age policy (`1b090c9:v2/pnpm-workspace.yaml`).

Per component:
1. Markup contract: board classes + ARIA (§2.6).
2. Behaviour:
   - busy ignores repeat presses
   - dialog initial focus by kind (Cancel for destructive), trap, Esc, return focus
   - account menu disclosure (Enter, Tab, Esc)
   - drawer focus to Close and back to Menu
   - tabs: links versus `tablist` arrow keys
   - error summary link focuses the field
   - scale arrow keys
3. Axe: no violations per variant and state.

jsdom cannot evaluate container queries or layout, so all responsive and visibility assertions are Playwright.

### 9.3 Playwright functional, keyboard and reach suites — PROVISIONAL

- **Projects:** 1440×900, 1024×768, 768×1024, 375×812. Today `@xr/testing createPlaywrightConfig` defines only 'Desktop Chrome' and boots the API (`1b090c9:v2/packages/testing/src/playwright.ts`). Mock-mode e2e should not need the API server.
- **Flows A–F + device chain** across roles on one shared state (`handoff/flows.json`; B8-06 'Tests'):
  - A: public request → SA decision → status/payment → active
  - B: SA assigns IA → content access → give students access → Student sees it
  - C: resources → format → per-format progress → per-format feedback
  - D: Faculty assessment → attempt → marking → result
  - E: Vendor → Reviewer → CM publish → catalogue
  - F: CM correction → Reviewer → SA Release/Hold
  - Device: Student → IA forward → SA approve

  Each step asserts the role-relative status words (B8-03), not internal state.
- **Keyboard and focus suites:**
  - shell tab order (board 12)
  - drawer and account menu
  - every dialog kind
  - error-summary links
  - radio and scale arrows
  - 'Go to decision' focus
  - `expectNoInvisibleFocusTargets` on every route at four widths (§7.1)
  - `@axe-core/playwright` scan per route and state (new pinned devDependency)
- **Real-pointer reach test for every confirm button** (`handoff/README.md` 'What the build must add'; B8-06; B8-05 'Real-pointer reach … mouse wheel + click'; the Batch-4 lesson that programmatic scroll had hidden a clipped Submit). Helper `reachAndClick(page, locator)`:
  - start from the top of the page
  - move the mouse to the viewport centre
  - loop `page.mouse.wheel(0, Δ)` until the target's box is in the viewport
  - hit-test with `document.elementFromPoint(cx, cy)`, which must be the target or inside it
  - then `page.mouse.click(cx, cy)`
  - never use `scrollIntoView`, `locator.click()` auto-scroll or `window.scrollTo`
  - fail if the target is never hit-testable

  Targets: every DL-1/DL-2/DL-3 confirm and every flow primary ('Continue', 'Submit', 'Give access', 'Approve', 'Release update' …), enumerated by accessible role inside dialogs and flow footers. Run at all four viewports and in bottom-sheet dialog mode.

---

## 10. Canvas-only exclusions — CONFIRMED

Do not build, render or copy any of the following (START-HERE exceptions 2–4 and 6; `handoff/README.md`; `understand/visual-system.json#canvasOnly` and all seven `surface-*.json#canvasOnly`):

1. **`runtime/support.js`** and the DC template engine (`<x-dc>`, `{{ }}`, `<sc-if>`, `<sc-for>`, `<helmet>`, DCLogic scripts) and their generator artefacts (`hint-placeholder-val`, stringified `details open`). The product is Next 16 / React 19.
2. **Frame wrappers and fixed heights:** `.b1-frame`, `width:Npx;max-width:100%`, `min-height: 900px`, `overflow-y:auto;height:Npx` crops, frame `min-height` 760/1500, proof grids. The 3 proof frames that run 1–3 px over (exception 8).
3. **Board controls:** `.xa-boardctl` 'Board control — not part of the product.' and `.xl-board-btn` 'Start again …' (B4-14, B5-08, B6-12, B6-13, B7-04, B7-11). Restart and state switchers. The B4-14 'Move the sample date past the deadline' control (release follows the real clock and setting). Dual 'Open' button + link rows on B7-02/B7-06…B7-09 (product: one link per row).
4. **Captions and annotations:** `.b1-cap`, `.b1-annot`, `.b1-states`, `.b1-open` ('OPEN'), `.b1-sample` ('SAMPLE'), `.b1-link`, the `doc-*` chrome (`doc-head`, `doc-kv` 'Question / Rows / Never shown …', `doc-tag`, `doc-example-tag`), board kickers, index boards (B?-00, Main), change logs (13, B1-14 … B7-13) and register boards B8-01…B8-08.
5. **'Sample:' switches and sample labels:** 'Sample: REQ-0039 …' (B1-08), 'Sample: the published "Composite Wall Conduction" already has the name' (B5-03), 'Sample figures · up to 23 Oct 2026', '(sample file)' suffixes, 'Student names are sample data …', B1-02 'Test area 4 — placeholder … (TEST FIXTURES — NOT REAL AREAS)'. Sample values come from mock services (T-36). The labels do not ship.
6. **Canvas props and Tweaks:** board 05 `role`, `banner`, `startWithMenuOpen` ('Shell state (canvas only)'); 'Page content slot · not designed in Batch 0'; 13 change 'Harness and presenter controls … canvas Tweaks only'.
7. **Static specimen states:** `.is-focus`, `.is-shown` (boards 02, 03, 06, 10, 11, 12; B1-10 frame 2 'Selected / keyboard focus').
8. **Frame-relative dialog and overlay positioning:** `.xr-dialog-scrim`, `.xw-dlg-top`, `.xa-dlg-end`, `.xa-dlg-auto`, `.xg-dlg`, `.xp-scrim{height:2000px}`, `.xw-live` dashed walkthrough outline.
9. **Simulated behaviour:** `setTimeout` busy delays (600–1400 ms), `failOnce`/`failNext` flags, canned file names and import reports, 'Try again' that always succeeds, per-board state and in-board 'Reload the board to start the walkthrough again'. Real mock-service latency and errors drive the states.
10. **Demo copy:** board 10 '(Demo — nothing was changed.)'. The board helmet `<style>body{margin:0} a{color:#1F4FD8}…</style>`.
11. **Board-to-board links** (`*.dc.html`, `#h-seven`, `#help`): product routes come from `screens.json` / B8-01 and the board-wins defects.

**Decision IDs inside product frames — UNRESOLVED (VD-10). Flag for owner.**
- A scan of the template text inside product frames (excluding `doc-*` and `b1-*` furniture) finds **298 text instances (316 ID mentions) of 17 distinct strings on 25 boards (B5-03 … B7-12)** that carry an internal decision ID. They sit in `xl-open` info lines, `xl-meta`, `xr-hint`, a format delivery head and `xr-dialog-body`. Examples:
  - 'Package fields are provisional — how app packages are delivered is still open (T-14).' ×47
  - 'Prototype field set — the catalogue fields, and who maps an experiment to a course, are still open (T-29). …' ×47
  - 'Licence figures are shown as provided — how licences are counted is still open (T-06). A plan can't be amended … (T-08)' ×18. Each instance carries two IDs, which explains 316 = 298 + 18.
  - 'What else a hold affects, and whether it blocks later corrections, is still open (T-28).' ×36
  - 'They manage people, groups and student access for this institution. Nothing is sent from here (T-11).' ×18 (B7-02/B7-03 dialog body)
  - 'Institutions are created only by approving a request — there is no direct creation (T-09)' ×10
  - 'Areas have no artwork set here, and can't be retired (D3).' ×8
  - 'App package (provisional — T-14)' ×8
- IDs seen (mentions): T-14 ×76, T-29 ×47, T-28 ×47, T-11 ×33, T-06 ×18, T-08 ×18, T-25 ×18, T-26 ×16, T-30 ×15, D3 ×14, T-09 ×10, T-31 ×4. Flash strings in scripts carry more (for example B7-02 '… still open (T-11).').
- Boards 04 and 08 say 'Never show route names, role codes, status codes or technical causes'. The B8-03 jargon scan did not count decision IDs.
- Options: (a) ship verbatim as drawn, (b) keep the sentences and drop the '(T-nn)' suffix, (c) drop the 'still open' lines. Recommendation: (b), routed through one copy table so the decision is reversible.
- Phase 0 is unaffected: no B5–B7 screens are built.

---

## 11. Explicit "do not"

1. **No generic DEMO banner or demo strip** anywhere (binding constraint; board 06 'No demo strip, no "Viewing as"'; B8-03 'Developer / demo wording 0').
2. **No developer-only account or role selector is introduced in any build or tool** (owner binding constraint, 9 Oct 2026).
   - Role entry is only through the B1-09 sign-in (institution or e-mail), against typed mock identities from the sample world (BC10).
   - Automated tests establish sessions programmatically through the VD-17 test-only seam, never through UI.
   - B8-03's line 'The developer switcher stays outside the product (Inventory C.2 "DEV")' is superseded by the owner constraint (V-14).
3. **No unrelated SaaS design system or component kit:** no MUI, Chakra, shadcn/Radix-styled kits, Tailwind UI, default Tailwind palette or icon fonts. A headless kit is not chosen either, because its DOM and ARIA would differ from the boards (for example `role=menu` dropdowns versus the drawn disclosure account menu).
4. **No Slice-1 UI.** The working-tree `v2/packages/ui/src/{app-shell,button,card,confirm-dialog,format-legend,notice,page-header,places-meter,status-pill}.tsx` and the Slice-1 `tokens.css` edits are excluded. They use Tailwind arbitrary values, `--xr-indigo-100` with the wrong value (#c9cef2), `--xr-line-strong` #c9ceea (the light border board 13 retired), and radii 10/14 (`understand/visual-system.json#repoComparison`).
5. **No edits to the frozen files.** Product deltas go in the product layer.
6. **No `next/font`** for Public Sans (it renames the family).
7. **No Preflight.**
8. **No viewport media-query breakpoints** for layout.
9. **No toasts, pagination, meters, switches, comboboxes** or extra tooltips (not drawn).
10. **No tokenising of literal hex in Phase 0.**
11. **No official branding claims:** the logo stays a labelled placeholder, Public Sans is never called the official font, and artwork stays labelled concept art.
12. **No colour-only status**, no silent disabled buttons, no error codes in messages, no focusable invisible controls.

---

## 12. Board variances found or confirmed in this audit (board wins; report, do not fix silently)

| # | Variance | Evidence | Handling |
|---|---|---|---|
| V-1 | Destructive DL-1 initial focus is on the danger button, contrary to board 10 | B2-08 (frame 5, `focus(pid + '-rm-go')`), B2-09 (frames 2–3) + B2-14, B4-07 (frame 2, `focus(pid + '-dgo')`) | Follow board 10 (VD-07) |
| V-2 | Dialog Cancel is `xr-btn--secondary` on 44 product boards, `xr-btn--text` on board 10 | 397 'Cancel' + 12 'Keep answering' + 47 `keepLabel` buttons in `xr-dialog-foot` on 44 boards; board 10: 5 `--text` Cancel buttons in 3 `<dialog>` specimens | VD-06 |
| V-3 | Account menu drawn with `role="menu"`; account-button ARIA differs between boards | B3-07 frames 1 'Entry · account menu (Rahul has VR)' and 2 'Entry hidden · no AR / VR / MR formats' (`role="menu" aria-label="Account"`). Board 03 button: `aria-haspopup="true"`. Board 05: `aria-expanded` + `aria-controls`. 844 product instances: `aria-expanded` only. Disclosure inferred from board 12's keyboard spec | Disclosure with `aria-controls` (VD-13) |
| V-4 | Error summaries that list errors with no way to reach the field | 30 of 192 `xw-errsum` (B2-05 ×16, B2-07 ×5, B2-14 ×4, B3-08 ×5; `<li>{{ e.t }}</li>`, focusable) versus board 12 'Summary links move focus to the field' and B8-07 'summary with links'. The 47 B5 missing-items summaries navigate by button and are not a variance | Link the 30 (VD-21) |
| V-5 | Decision panel sticky (B1–B4) versus static (B6/B7) versus B8-03 'static (Batch-6 rule)' | class-token scan §6.4 (69 sticky, 71 static) | VD-05 |
| V-6 | Hub record tabs drawn as links versus board 03 'record tabs use tablist'; status tablists without tabpanel | 67 `nav.xw-hubtabs` on 13 boards (B2-12…B4-15, including the B4-05/B4-06/B4-11 assessment hubs) versus the record tabs drawn as `role=tablist` on boards 03 and 09b and board 12 'Record tabs ← → move between tabs'; 27 product status tablists, 0 tabpanels | VD-14 |
| V-7 | Header 'Request access' → PU-07 on boards versus PU-08 in `navigation.json` | B1-01 `a.xp-access href="B1-06-Selection.dc.html"` ×3 | Board wins (handoff defect) |
| V-8 | Skip link not drawn on any product frame | 2 `xr-skip` instances (boards 05, 12) | Add (VD-16) |
| V-9 | Sidebar focus ring 2.35:1 versus board 02 gold-on-navy rule | §7.2 | PF-07 (VD-11) |
| V-10 | Decision IDs in product copy | §10 (298 text instances, 316 ID mentions) | VD-10 |
| V-11 | Format feedback drawn in the full shell versus 09b AR-6 | B3-06 `header.xr-top` | Board wins (R-22) |
| V-12 | `.xd-gn` #EEF0FA versus token #EEF0F8; `.xg-del:hover` #8F1B12 versus #8F1C13 | `xr-admin.css`, `xr-govern.css` | Port verbatim (T-3) |
| V-13 | ErrorSummary drawn two ways: as `xr-notice xr-notice--err` on the Batch-0 specimens (03, 09b) and as `xw-errsum` on product boards (192 on 25 boards). B8-07 maps 'error summary (… xw-errsum)' to boards '03 · 10', which draw no `xw-errsum` | 03 'Two things need fixing before you can continue'; 09b 'One thing needs fixing'; B8-07 component table | One emitted class; baseline from a product board (VD-22) |
| V-14 | B8-03 implies a developer switcher exists outside the product | B8-03 row 'Sign in looks like a product, not a test tool': 'The developer switcher stays outside the product (Inventory C.2 "DEV")' | Superseded by the owner constraint (no developer-only account selector anywhere); owner to acknowledge |

---

## 13. Owner decisions this deliverable needs

| ID | Decision | Recommendation | Status |
|---|---|---|---|
| VD-01 | ADR closing E-19: verbatim v46 CSS in one shared cascade layer (`xr.v46`) + custom primitives emitting board classes + Tailwind 4 without Preflight as constrained composition utilities (Option A) **or** drop Tailwind for layout primitives (Option B) | Option A | UNRESOLVED |
| VD-02 | Public Sans delivery: self-host OFL woff2 via `@font-face 'Public Sans'` (also used by the board harness) versus the Google Fonts link as on the boards; approve fetching the font files | Self-host | UNRESOLVED |
| VD-03 | Is `branding/bits-pilani-wilp-logo.png` (D-12 'only confirmed brand asset') the approved lockup asked for in board 13 Q1? Until then: the placeholder | Keep the placeholder | UNRESOLVED |
| VD-04 | B1-10 fix: visible sort control in the toolbar-status row, wording 'Received, newest first / oldest first' + 'Change order', de-duplicated accessible name; approve as an expected baseline deviation on B1-10 (B1-13's inert thumbnail is unaffected) | As in §7.1 | PROVISIONAL |
| VD-05 | Decision panel: sticky per board (B1–B4) / static per board (B6/B7), or static everywhere per B8-03 | Per board as drawn | UNRESOLVED |
| VD-06 | Dialog Cancel style: `xr-btn--secondary` (397 Cancel + 12 'Keep answering' + 47 `keepLabel` on 44 product boards) versus `xr-btn--text` (board 10 'quiet', 5 buttons) | Secondary | UNRESOLVED |
| VD-07 | Destructive DL-1 initial focus on Cancel everywhere (board 10), overriding B2-08, B2-09/B2-14 and B4-07 scripts | Board 10 | PROVISIONAL |
| VD-08 | Viewport-dialog alignment mapping (start for header actions, centre by default, end at form end, bottom sheet below 600 app width), replacing the canvas `xw-dlg-top`/`xa-dlg-*`/`xg-dlg` | As in PF-04 | PROVISIONAL |
| VD-09 | Implement the designed drawer, dialog, menu and banner motion (boards 02/12) that no stylesheet contains, or ship without | Implement, gated by reduced motion | UNRESOLVED |
| VD-10 | Decision IDs in product copy (298 text instances / 316 ID mentions, 17 strings; T-06, T-08, T-09, T-11, T-14, T-25, T-26, T-28, T-29, T-30, T-31, D3; B5–B7): verbatim, strip the suffix, or drop the lines | Strip the suffix through a copy table | UNRESOLVED |
| VD-11 | Record the gold sidebar and drawer focus ring (PF-07) as a build correction (not on B8-03 or B8-08) | Approve | PROVISIONAL |
| VD-12 | Undrawn B8-07 states use board-04 grammar + a per-screen state copy register for sign-off | Approve | PROVISIONAL |
| VD-13 | Account menu = disclosure (boards 05/12) over B3-07's `role="menu"` | Disclosure | PROVISIONAL |
| VD-14 | Hub tabs stay links as drawn (B2-12/B3-01) versus board 03 tablist text; add `tabpanel` + `aria-controls` to `role=tablist` status tabs (B6-06, B7-02 …) | Links; add tabpanel | PROVISIONAL |
| VD-15 | Forced-colors (Windows High Contrast) support, not designed (PF-12) | Add a minimal outline rule | UNRESOLVED |
| VD-16 | Skip link on the public and focused-task shells (drawn only on 05/12) | Add | PROVISIONAL |
| VD-17 | Test-only seeding seam, clock control and Phase-0 specimen harness under ARCHITECTURE §14 ('no stand-in controls'); new pinned devDependencies (`@axe-core/playwright`, an axe adapter for Vitest) | Record an exception and pin | UNRESOLVED |
| VD-18 | Visual-regression runner (hosted CI or a local Linux container runtime; none exists today); approval to fetch the vendored React/ReactDOM/Babel + Public Sans files into a test-only tools folder (checked against the `support.js` SRI hashes) and to run `support.js` inside the harness; tolerances; the pinned Playwright 1.63.0 image; and the expected-deviation approval process | As in §9.1. Same-run, same-machine captures until a runner exists | UNRESOLVED |
| VD-19 | Load all 8 sheets globally and accept the global-override effects (decision-panel status wrap on B1-11, B3-11 and B4; `.xr-id` nowrap; `.xr-choice.is-off`) | Accept | PROVISIONAL |
| VD-20 | Rail expand/collapse 'remembered per person' (13 Q7) stored as a per-mock-user browser preference while there is no backend | Approve | PROVISIONAL |
| VD-21 | ErrorSummary always links and takes focus. Normalise the 30 plain-text instances (B2-05, B2-07, B2-14, B3-08). Keep the 47 B5 missing-items summaries (per-item 'Go to …' buttons, focusable wrapper) as drawn | Approve | PROVISIONAL |
| VD-22 | ErrorSummary emitted class: `xw-errsum` (192 product instances; named in B8-07) or the Batch-0 `xr-notice--err` form (03, 09b). Take the Phase-0 component baseline from a product-board instance rather than board 03 | `xw-errsum`; baseline from a linked product instance (for example B4-04) | UNRESOLVED |
| VD-23 | Public root changes: PF-06 (`.xp{overflow:clip}`) also lets `.xp-filters` and `.xp-sumcard` stick at top 24, as their CSS intends but the boards cannot show; and PF-02 gives `.xp` a viewport min-height | Accept both | PROVISIONAL |

Carried, no action needed for the visual layer (board handling already defined):
- 13 Q2: product name 'XR Learning Platform'
- 13 Q4: working icon set
- 13 Q5: organisation line for platform roles
- 13 Q6: scale words 2–4

---

### Appendix: audit scripts (scratch only)

- `wf/design/tools/b2txt.py`: board text extraction
- `wf/design/tools/decid2.py`: scan for decision IDs in product frames
- Inline `python3 -I` scans in this session:
  - danger-button dialog focus
  - Cancel style in `xr-dialog-foot`
  - `xr-dpanel` / `xg-static` tokens
  - `xw-errsum` links
  - `thead` controls
  - inline-style properties and hex values
  - state-pattern presence per board
  - token parity
  - stylesheet SHA-256
- Final edit (`wf/final/_visual_tools/`):
  - `decid_e.py`: independent decision-ID recount (text instances and ID mentions)
  - `patch_visual.py`: the exact-match patch set that produced this document from the draft. Four small follow-up edits were made by hand: the §2.6 allow-list, the §5.1 summary note, the FormFooter source and the boundary-test width assertion.
  - inline `python3 -I` re-checks:
    - B1-13 thumbnail context
    - `xw-errsum` classification, including the B5 wrappers
    - Cancel styles
    - panel, hub-tab, tablist and skeleton counts
    - account-button ARIA
    - class-to-board map
    - sticky rules and container conditions
    - `xg-del` count
    - Tailwind 4.3.3 package files

---

## Verification log

The verifier report is `wf/verify/visual.json`, with 17 corrections. The final editor re-opened the cited boards, sheets and files for every correction.

**Totals:**
- 16 corrections applied in full.
- 1 correction applied with one sub-point rejected (C2).
- 0 rejected outright.

Editor additions from the same re-checks are listed after the table. "Board" means `design/handoff-v46/canvas-v46/project/<board>.dc.html`.

| # | Severity | Correction | Outcome | Evidence re-checked by the editor |
|---|---|---|---|---|
| C1 | major | B1-13 does not repeat the B1-10 defect | **APPLIED** (spot checks, §3.3 DataTable, §7.1, §9.1 deviations, VD-04) | B1-13 offset 92,399. The only `<thead>` button sits inside step 08 `<div … aria-hidden="true" inert="true"><div style="width:1440px;transform:scale(0.3)…"><div class="xr-app" …>`. At 1440 the content is 1112, so the header is not clipped. B1-13 is not in `frame-index.json`. START-HERE item 13 and Known exception 1 name only B1-10. |
| C2 | major | ErrorSummary mis-cited and mis-characterised | **APPLIED, one sub-point REJECTED** (§3.2 row, spot checks, §5/§9.1, V-4, new V-13, VD-21, new VD-22) | Boards 03, 09b, 10 and 12 have 0 `xw-errsum`. 03 and 09b draw `xr-notice--err` with links. There are 192 `xw-errsum` on 25 boards, split 115 linked, 30 plain-text (B2-05 16, B2-07 5, B2-14 4, B3-08 5) and 47 B5 `ul.xv-miss` with buttons whose `go` calls `focus(pid + '-' + k)`. **Rejected sub-point:** the verifier said the B5 summaries lack `tabindex=-1` and focus-on-submit. They do not lack it. All 47 sit inside `<div id="…-miss" tabindex="-1">`, and Submit calls `focus(pid + '-miss')` (B5-01…B5-09 scripts). So no separate B5 focus decision was added. B8-07 maps `xw-errsum` to boards '03 · 10'; that is recorded in V-13. |
| C3 | major | Visual-regression plan cannot run as described | **APPLIED** (§0 item 6, §9.1 prerequisites and steps 3–4, VD-18 now UNRESOLVED) | `git remote -v` is empty. `git ls-tree 1b090c9` shows no CI files. `which docker podman colima` finds none. `runtime/README.md`: 'Both need internet'. `support.js` lines 1143–1150 hold `REACT_SRI`, `REACT_DOM_SRI` and `BABEL_SRI` and use `cdnScriptFor` with `window.__resources`. Lines 1185 and 1830 set `crossOrigin = "anonymous"` with `integrity`. |
| C4 | major | §11 left room for a developer switcher | **APPLIED** (§11.2 reworded, new V-14) | B8-03 text: 'no account switcher (B1-09). The developer switcher stays outside the product (Inventory C.2 "DEV")'. `1b090c9:v2/docs/ARCHITECTURE.md` §14 line 213: 'no scenario selector, no demo clock, no stand-in controls in V2'. The owner constraint outranks boards. |
| C5 | minor | Per-sheet layers invert cross-sheet specificity | **APPLIED** (§0 item 1, §2.1, §2.2 sketch and rationale, §2.4 code, VD-01) | `xr-foundation.css` `.xr-btn[disabled],.xr-btn[aria-disabled="true"]{…color:#5C6389…}` against `xr-govern.css` `.xg-del{color:#B42318}`. The editor recount is 69 `xr-btn … xg-del` buttons on 11 boards; the verifier quoted 31, and the conclusion is the same. None of the 29 v46 `!important` flags conflicts with PF-01. |
| C6 | minor | PF-06 is a confirmed need, not conditional | **APPLIED** (PF-06, §6.3, §3.5 PublicShell) | `xr-public.css .xp{…overflow:hidden}` and `.xp-bottombar{position:sticky;bottom:0…}`. The Chromium result is the verifier's (not re-run by the editor) and is consistent with CSS Positioned Layout: `overflow:hidden` creates a scroll container, `overflow:clip` does not. The editor added the side effect on `.xp-filters` and `.xp-sumcard` (VD-23). |
| C7 | minor | Decision IDs: 298 text instances, T-08 missing | **APPLIED** (§10, V-10, VD-10) | Independent recount (`decid_e.py`): 298 text instances, 17 strings, 25 boards, 316 ID mentions. T-14 76, T-29 47, T-28 47, T-11 33, T-06 18, T-08 18, T-25 18, T-26 16, T-30 15, D3 14, T-09 10, T-31 4. The T-06 string appears ×18 and also carries T-08. |
| C8 | minor | Count fixes (static panels, keepLabel, hub tabs, status tones, skeleton boards) | **APPLIED** (§3.1 StatusPill, §3.3 Tabs, §5.3, §6.4, §8, V-2, V-5, V-6, VD-06) | Static `xg-static` panels 71 (per-board split as listed); sticky 69. `keepLabel` 47 and 'Keep answering' 12. Cancel `--secondary` 397 on 44 boards; board 10 has 5 `--text` Cancel buttons in 3 `<dialog>` elements. `nav.xw-hubtabs` 67 on 13 boards. `xr-status--` has 6 tones + `live`. `xr-skel` is on 27 boards. |
| C9 | minor | §1.1 var() contradiction; `--xr-tabs-bg` | **APPLIED** (spot checks, §1.1, T-4) | `var()` targets: the 11 tokens plus `--xr-tabs-bg`, which is set on `.xr-tabs` and `.xr-tabs--on-white` in `xr-foundation.css`. The two focus colours are read through `var()`. |
| C10 | minor | Use 24,319, not 23,140 | **APPLIED** (spot checks, §0 item 4, §2.5) | `grep -o 'style='` over the 128 boards gives 24,319. `min-height: 900px` appears 1,037 times. |
| C11 | minor | AccountMenu citation and ARIA variance | **APPLIED** (§3.4 AccountMenu, V-3, VD-13) | B3-07 `role="menu"` at frames 1 'Entry · account menu (Rahul has VR)' and 2 'Entry hidden · no AR / VR / MR formats'. `xr-acct-btn` variants: board 03 `aria-haspopup="true"`, board 05 `aria-controls`, 844 instances on 85 boards with `aria-expanded` only. Board 12: 'Account menu Enter opens · Tab moves through items · Esc closes and returns focus to the button'; it has no `role=menu` statement. |
| C12 | minor | Inventory source-board slips; PF-01 class namespace | **APPLIED** (11 inventory rows; PF-01 classes renamed `xr-x-table-sortbar`, `xr-x-th-sort`, `xr-x-th-text` throughout) | A class-to-board scan confirmed each listed drawing board, for example `xa-order` on B4-05/B4-15, `a.xr-row-link` on 05/07, `xp-split`/`xp-sumcard`/`xp-bottombar` on B1-06, `xw-apanel` on B2-09/B2-14 and `xd-gn` on B7-01/B7-12. The `xr-x-` prefix was chosen over keeping `xr-`, to match T-4. |
| C13 | minor | §0 item 5 overstated as "built in" | **APPLIED** (§0 item 5 per-item statuses) | §13 statuses: VD-09 UNRESOLVED, VD-11 PROVISIONAL, VD-16 PROVISIONAL. BC13 mandates only B1-10. |
| C14 | minor | Foundation sets antialiasing only; `.xp` has no min-height | **APPLIED** (§2.2 Packaging, PF-02 extended to `div.xp`, VD-23) | `xr-foundation.css body{margin:0;background:#F4F5FB;…;-webkit-font-smoothing:antialiased}` has no min-height. `.xp{…background:#FFFFFF…}` has none either. 114 of 115 B1 `.xp` roots carry no inline min-height (the verifier said 98). |
| C15 | minor | Exact B1-10 width ranges and boundary tests | **APPLIED** (§6.1 arithmetic and 4 boundary rows, §7.1, e2e spec) | `.xr-page` padding 24/16 → 32/24 (≥ 600) → 32/32 (≥ 1024) → 40/40 (≥ 1280). Grid 72 or 248 (`.is-expanded`) at 1024–1279, and 248 or 72 (`.is-rail`) from 1280. Labelled rows when the app is below 808, or 1024–1071 expanded, or inside `--form`. |
| C16 | minor | §6.1 container table omissions | **APPLIED** (`xp` row, `xr-content` row) | 4 `@container xp (max-width:1279.98px)` blocks (`.xp-in`, `.xp-hero-h`, `.xp-grid--4`, `.xp-xhead`/`.xp-xgrid`/`.xp-xbody`). `xr-workspace.css` `(min-width:600px) and (max-width:1059.98px)` and `(min-width:800px) and (max-width:1059.98px)` for `.xw-apanel`. The total stays 89 blocks. |
| C17 | minor | Capture height mismatch with the board `min-height: 900px` | **APPLIED** (§9.1 Product capture) | 1,037 inline `min-height: 900px` on `.xr-app`/`.xr-shell`, against PF-02 `100dvh`. Height 900 is used for parity captures, and 768/812/1024 only for the reach and keyboard suites. |

**Editor additions** (found while re-checking, not in the verifier report; all CONFIRMED by board or sheet scans):
- **E1.** InlinePanel source corrected from B2-09 to B2-08. `xw-inline-panel` is not on B2-09; its 14 boards are B2-08, B7-02…B7-12, B8-05 and B8-07.
- **E2.** PublicMenuSheet: `xp-sheet` is drawn only on B1-01. The `.xp-menu-btn` is on B1-01 and B1-03…B1-08.
- **E3.** AccountMenu sources: `xr-menu` is drawn on 03, 05, 11 and B3-07. Board 06 holds the account table and board 12 the keyboard rules.
- **E4.** StatusTabs: the draft's '29 tablists on 11 boards' includes 2 Batch-0 record-tab specimens (03, 09b). There are 27 product status tablists on 9 boards.
- **E5.** §6.3 now lists all 8 `position:sticky` rules, including `.xw-sum`, `.xp-filters`, `.xp-sumcard`, `.xp-fsheet-foot` and `.xr-tabs::after`. The PF-06 side effect is recorded as VD-23.
- **E6.** VD-18 is moved from PROVISIONAL to UNRESOLVED, because no runner exists and a decision is missing.
- **E7.** The B5 focus wrapper finding (see C2) removes the need for a separate B5 focus decision.

**Not re-run by the editor:** the verifier's Chromium 152 Browser-pane tests (PF-03, PF-04, PF-06). They are cited as the verifier's results and are consistent with the CSS specifications. WebKit and Firefox remain to verify.

**Binding constraints:** none weakened. The changes tighten the no-developer-selector rule (C4) and keep the DEMO-banner, Slice-1, Preflight and no-unrelated-design-system bans unchanged.
