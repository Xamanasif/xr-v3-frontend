# @xr/testing

Test foundations of the workspace (`docs/v46/audit/Appendix-F-Phase0-Plan.md` §7, WP-0.4).

| Export                   | What it is                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `@xr/testing`            | `createVitestConfig` — the Vitest factory (node / jsdom)                                                   |
| `@xr/testing/playwright` | `createPlaywrightConfig` — Chromium at the four approved widths (1440×900 · 1024×768 · 768×1024 · 375×812) |
| `@xr/testing/browser`    | Playwright helpers shared by the product e2e suites and the specimen harness                               |
| `@xr/testing/axe`        | Component-test accessibility check: axe-core on a rendered container (jsdom or browser)                    |

## Browser helpers (`@xr/testing/browser`)

- `expectNoInvisibleFocusTargets(page)` — Tabs through the page from the start and fails on any
  focused element that is not visibly on screen (hidden, under 2×2, off-viewport or clipped by an
  ancestor). The B1-10 defect class (BC13).
- `reachAndClick(page, locator)` — the real-pointer reach test: mouse wheel only, hit-test, then a
  pointer click. Never `scrollIntoView`, `scrollTo` or `locator.click()`.
- `expectNoAxeViolations(page, options)` — axe-core via `@axe-core/playwright` at WCAG 2.2 AA; a
  rule is switched off only with a written reason.
- `expectNoDeveloperSurfaces(page)` — no DEMO banner, "Viewing as", account or role selector,
  workspace chooser, board control or canvas class in the rendered page (the term list is shared
  with the static scans, `@xr/config/policy-terms`).

The self-tests run on isolated fixture pages (`e2e/fixtures/`) served by route interception from a
reserved `.test` origin — no server and no product route: `pnpm --filter @xr/testing test:e2e`.

The app-specific session and world helpers (`signInAs`, `bootWorld`, `actAs`) live with the app
they drive, in `apps/web/e2e/support/`. In Phase 0, `bootWorld` installs the CI-only boot
descriptor, `actAs` calls the test-hook bridge (which arrives in WP-0.12) and fails clearly without
it, and `signInAs` refuses until the XS-01 sign-in is built in Phase 1 (owner decision G-8). No helper
chooses an identity through any UI, URL or query parameter.

## Pinned accessibility dependencies (G-5b, WP-0.4)

| Package                | Version | Why                                                                                                                       |
| ---------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| `@axe-core/playwright` | 4.13.0  | Accessibility wrapper for browser tests (published 11 Aug 2026)                                                           |
| `axe-core`             | 4.13.0  | Direct `axe.run` for component tests; the version `@axe-core/playwright` 4.13.0 pins (`~4.13.0`), already in the lockfile |
