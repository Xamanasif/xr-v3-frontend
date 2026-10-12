# ADR-0001 — CSS architecture: v46 stylesheets verbatim, Tailwind without Preflight

|                    |                                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**         | Accepted                                                                                                                                                      |
| **Date**           | 12 Oct 2026                                                                                                                                                   |
| **Closes**         | `OPEN_DECISIONS.md` E-19 (design-system foundations)                                                                                                          |
| **Audit ids**      | VD-01, gate G-3, register A5                                                                                                                                  |
| **Implemented in** | WP-0.5 (not in WP-0.2)                                                                                                                                        |
| **Owner sign-off** | **Approved 12 Oct 2026 — G-3 Option A:** "preserve v46 styling, disable conflicting Tailwind Preflight and retain Tailwind for appropriate layout utilities." |

## Context

The frozen v46 design ships eight plain stylesheets (`design/handoff-v46/canvas-v46/project/xr-*.css`, 124,181 bytes). Their prefixes are `xr-` (foundation), `xp-` (public), `xw-` (workspace), `xl-` (learning), `xa-` (assessment), `xv-` (vendor), `xg-` (governance) and `xd-` (admin).

- Layout is driven by 89 `@container` blocks on the named containers `xr-app`, `xr-content` and `xp`. The only `@media` rule is `prefers-reduced-motion`.
- The 65 tokens in `xr-foundation.css :root` equal `handoff/tokens.css`, but only 11 are read through `var()`. Most colours are literal hex values, so a token-only port would not reproduce the boards.
- The boards also carry 24,319 inline `style` attributes, which are board composition, not product CSS.

The committed foundation conflicts with this:

- `1b090c9:v2/apps/web/src/app/globals.css` is `@import 'tailwindcss';`, which includes Preflight.
- Preflight strips the list markers the boards rely on, forces `svg`/`img` to `display:block`, and resets the headings and buttons that `xr-foundation.css` styles itself.
- `@xr/ui/tokens.css` is a placeholder.
- `OPEN_DECISIONS.md` E-19 recorded "Tailwind v4 + tokens in `@xr/ui`; primitives chosen at Design V2 start". That start is now.

## Decision

1. **Port the 8 v46 stylesheets byte for byte** into `@xr/ui`, all inside **one** shared cascade layer `xr.v46`, in the B8-07 load order. The 19 art SVGs sit next to them so relative `url()` references resolve.
   - One layer, not one per sheet. Between unlayered sheets the boards resolve by specificity first, and per-sheet layers would invert that (for example `.xr-btn[disabled]` vs `.xg-del`).
   - A provenance test hashes the copies against `design/handoff-v46/SHA256SUMS.txt`, so any edit fails.
2. **Production deltas live in a separate additive layer `xr.product`** (PF-01…PF-13). Each rule cites its evidence: the B1-10 sort control, viewport-fixed dialogs and drawers, the gold focus ring on the navy sidebar, viewport min-height, and the self-hosted Public Sans `@font-face`. The v46 copies are never edited.
3. **Layer order:** `@layer theme, xr.v46, xr.product, utilities;`. It is declared identically first in `@xr/ui`'s stylesheet entry and in `apps/web/src/app/globals.css`, so the order holds whichever CSS chunk loads first.
4. **Tailwind (Option A).** Tailwind 4 stays, **without Preflight**. `globals.css` imports only `tailwindcss/theme.css` and `tailwindcss/utilities.css`, with a `@theme inline` block mapped to the v46 tokens and no viewport breakpoints. Use is limited to composition utilities in `apps/web` (flex, grid, gap, margin, padding, widths, token colours and radii).
   - **Not allowed:** Tailwind classes inside `@xr/ui`, arbitrary colour values, viewport breakpoint variants, Tailwind's default palette, type scale or shadows, and utilities that restyle a component's own look.
5. **React components emit the board class names and ARIA exactly.** They are built on native elements, with no headless kit and no third-party design system or component library.

## Consequences

- Visual fidelity is pinned to the frozen boards by checksum. Fixes go only into `xr.product`, and each is a documented, reviewable deviation.
- All 8 sheets load on every page. Three global overrides then reach boards that loaded fewer sheets; they are accepted as expected baseline deviations (Appendix E R-16).
- Two things must be proven in a WP-0.5 spike: that `@import … layer()` survives the `@tailwindcss/postcss` / Turbopack pipeline, and that relative `url()` resolves from a workspace package. A fallback (concatenating the verbatim files into `@layer` blocks at build time) is recorded.
- Container-query behaviour cannot be tested in jsdom. Responsive checks run in Playwright at 1440, 1024, 768 and 375.
- `@xr/ui` needs a `./styles.css` export. The `tailwindcss` and `@tailwindcss/postcss` pins (4.3.3) stay.
- Board inline styles are never copied as-is. Composition uses the constrained utilities.

## Amendment — WP-0.5 implementation (owner-accepted 12 Oct 2026)

The WP-0.6 authorisation (12 Oct 2026) accepts four implementation mechanisms of WP-0.5
(`packages/ui/README.md`):

1. The layer statement is `@layer properties, theme, xr.v46, xr.product, utilities;`.
   `properties` is the slot Tailwind 4 fills with its `@property` fallback; declared first it is the
   weakest layer. The relative order of the four layers in decision 3 is unchanged.
2. PF-05: the public menu scrim is fixed to the viewport below the header (not `inset: 0`), so the
   header's Close button stays usable.
3. PF-11: focus-scoped root `scroll-padding-top`, subject to long-title and wrapped-bar
   verification in WP-0.8.
4. PF-04: the product modifier classes `xr-x-dialog--start`, `--end`, `--decision` and `--marks`,
   the only product classes besides the PF-01 sort classes. The alignment mapping itself (VD-08)
   stays provisional.

## Removal trigger

A new owner-approved canvas version that changes the stylesheets. Or evidence from the WP-0.5 spike that the layer pipeline cannot hold, in which case Option B (no Tailwind; typed layout primitives) is the recorded alternative, also under G-3.

## Evidence

- `v2/docs/v46/audit/Appendix-E-Visual-Strategy.md` §1 (tokens), §2.1–§2.6 (options, recommended structure, product layer register, Tailwind disposition, inline styles, class ownership).
- `v2/docs/v46/audit/Appendix-F-Phase0-Plan.md` WP-0.5; `v2/docs/v46/audit/Appendix-G-Owner-Decisions.md` A5.
- `v2/docs/v46/understand/visual-system.json` (stylesheet scan); `design/handoff-v46/canvas-v46/project/handoff/tokens.css`; boards 01–04, 11, 12 and B8-07.
- `1b090c9:v2/apps/web/src/app/globals.css`, `1b090c9:v2/packages/ui/src/tokens.css`.
