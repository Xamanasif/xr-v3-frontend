# @xr/specimens — component specimen harness (VD-17)

Developer and test infrastructure only. It renders one `@xr/ui` specimen per page so Playwright can
check components in a real browser before any product screen exists: container queries at set
content widths, computed styles, keyboard order, wheel reach, axe, and later the visual baselines.

- **Never deployed and never part of the product.** It is a separate Next.js app on its own port
  (3100). `pnpm dev` does not start it. No package may depend on it (boundary matrix), and the
  product app answers 404 for its addresses (`apps/web/e2e/smoke.spec.ts`).
- **No controls of its own.** No navigation, no switchers, no identity of any kind. A specimen is
  addressed directly: `/<specimen-id>?width=<content px>` (200–2400; without `width` the frame fills
  the viewport). The frame is a `container-type: inline-size` box, so container queries resolve
  against the content width.
- **Specimens** are registered in `src/specimens/registry.tsx` with their source (board + frame).
  WP-0.4 shipped the harness's own self-check, `harness-probe`. WP-0.5 adds the `v46-*` stylesheet
  specimens (`src/specimens/v46/`): static, cited excerpts of board markup — never product
  screens — on which `e2e/v46-styles.spec.ts` checks the computed styles of `@xr/ui/styles.css`
  (body, single-layer cascade, PF-01 … PF-13, container-query behaviour, Public Sans). The harness
  imports the same stylesheet entry and font link as `apps/web`. It has no Tailwind PostCSS step,
  so Turbopack inlines the sheets itself and emits the layer statement after them: `xr.v46` still
  precedes `xr.product`, and the harness has no `theme` or `utilities` rules. The product's own
  pipeline and layer order are checked on the built app (`apps/web/e2e/styles.spec.ts`). The
  components (WP-0.6, WP-0.7) add theirs.
- **Tests** live in `e2e/` and use the shared helpers from `@xr/testing/browser`. Run
  `pnpm build` at the workspace root, then `pnpm --filter @xr/specimens test:e2e`.

## Spike record — choosing the VD-17 option (WP-0.4, 12 Oct 2026)

`Appendix-E-Visual-Strategy.md` §9.1 offers two options for the Phase-0 specimen harness; both
must stay outside the product (ADR-0007 §3, owner decision G-2).

| Criterion                                                                               | (a) Vitest browser mode on Playwright Chromium                                                                                                                                | (b) Separate non-deployed specimens app                                  |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Supported by the pinned toolchain                                                       | Yes in principle: `@vitest/browser-playwright@4.1.11` exists (peer `vitest 4.1.11`, `playwright *`)                                                                           | Yes: Next.js 16.3.4, React 19.3.0, Playwright 1.63.0, all already pinned |
| New downloads                                                                           | `@vitest/browser-playwright`, `@vitest/browser`, `@vitest/mocker`, `ws`, `sirv`, `pngjs`, `@blazediff/core`, … — none in the lockfile; not covered by the axe approval (G-5b) | None (lockfile: workspace links only, 0 downloads)                       |
| Same CSS pipeline as the product (the WP-0.5 layer spike, risk K-5, is about Turbopack) | No: Vite's CSS pipeline                                                                                                                                                       | Yes: Next.js / Turbopack, as in `apps/web`                               |
| Shares the Playwright helpers (`reachAndClick`, `expectNoInvisibleFocusTargets`, axe)   | No: tests run inside the browser in an orchestrator iframe; the real-wheel and Tab-walk helpers would need a second implementation through custom commands                    | Yes: the same `Page` helpers as the product e2e suites                   |
| Same screenshot engine as the WP-0.15 board captures (Playwright `toHaveScreenshot`)    | No: Vitest's own screenshot assertion                                                                                                                                         | Yes                                                                      |
| Cost                                                                                    | Lighter (no second app build)                                                                                                                                                 | One more small `next build` (≈ 2 s compile) and a boundary-matrix row    |

**Decision: option (b).** It renders through the product's own pipeline, shares one implementation
of every browser helper with the product suites, matches the board-capture engine, and needs no
download. Option (a) was evaluated from registry metadata only (`pnpm view`); nothing was installed
for it.
