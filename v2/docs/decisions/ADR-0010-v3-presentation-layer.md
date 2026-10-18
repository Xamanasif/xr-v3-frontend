# ADR-0010 — V3 Refined Direction B presentation layer: scoped beside v46, one integration owner

|                     |                                                                                                                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**          | Accepted (engineering) — foundation XR-V3-RB-1.0; acknowledgement requested                                                                                                               |
| **Date**            | 19 Oct 2026                                                                                                                                                                               |
| **Branch**          | `v3/refined-b-ui` (worktree `/Users/mymac/Desktop/AR-VR-v3-ui`), from `a55ace9`                                                                                                           |
| **Owner basis**     | The owner selected Refined Direction B and authorised complete-role design workstreams; the V3 integration controller prompt (`design/v3-refined-b/pack/10-…`) starts the foundation only |
| **Record**          | `../v3/V3-FOUNDATION-RECORD.md`                                                                                                                                                           |
| **Leaves in place** | ADR-0001 (v46 verbatim in `xr.v46`, product deltas in `xr.product`, Tailwind without Preflight) — unchanged for every v46 screen                                                          |

## Context

The working product is the v46 implementation (123 designed ids, Phase 7 `a55ace9`). The owner has
selected a new visual direction, Refined Direction B (V3), and will deliver it role by role as
complete, owner-approved exports. Until a role arrives, its screens keep the current v46
presentation. The V3 sources (`design/v3-refined-b/pack/references/v3/`) are three stylesheets —
`core.css` (`.xr` tokens and status/format grammar), `rb.css` (`.rb` shell), `rb-kit.css` (`rk-`
kit) — and four boards (SA-01; SA-02 with SA-03; IA-01; IA-02).

Loading those sheets as they are would restyle the product: `core.css` defines `.xr-fmt`, `.xr-sr`,
`.xr-ico`, `.xr-ico--16`, `.xr-avatar` and `.xr-num` without a parent selector, and `.xr-fmt` means
something else in v46 (indigo tint, 4 px radius) than in V3 (navy, 7 px). The v46 layer and the
product layer also contain global rules (`a{…}`, `a:not([class]):hover`, v46 `.xr-avatar`) that
would reach V3 markup. The two systems must coexist for as long as the migration lasts, one role
at a time, without either changing the other.

## Decision

1. **Immutable reference.** The owner's pack is copied byte for byte to `design/v3-refined-b/pack/`
   (46 files, `SHA256SUMS.txt`, cross-checked against `PACK-MANIFEST.json` and the ten
   `FOUNDATION-LOCK.json` hashes). Never edited.
2. **A generated, scoped derivative.** `packages/ui/scripts/generate-v3-scoped-css.mjs` writes
   `packages/ui/src/styles/v3/rb-scoped.css` from the three locked sheets. Only selector text
   changes: each selector is confined to a V3 root with `:where(.xr) ` (unless it already names
   `.xr` / `.rb`) and kept out of v46 islands with `:not(:where([data-xr-v46], [data-xr-v46] *))`.
   Both additions have zero specificity, so the V3 cascade is the sources' own. Declarations,
   at-rules, comments and rule order are byte-identical; `v3-provenance.test.ts` proves it and
   fails on drift.
3. **Its own cascade layer.** `@xr/ui/styles-v3.css` puts the derivative in `xr.v3.rb` and the
   central patches in `xr.v3.patch`. `xr.v3` is a sublayer of `xr`, so it always follows `xr.v46`
   and `xr.product` and precedes `utilities`, whichever chunk loads first; the product's global
   layer statement is not changed. The V3 entry is loaded only where V3 renders (today: the
   specimen harness); nothing V3 matches outside a V3 root.
4. **Central patches only for defects and isolation (V3P-01 … V3P-08).** `patch.css` holds
   accessibility and correctness fixes (native modal dialog, sort control at the table's own
   breakpoint, drawer closing past 1024 px, skip link) and the isolation from v46 global rules
   (link hover thickness, the v46 `.xr-avatar` letter-spacing, the island's container and text
   defaults). No aesthetic change. Product V3 classes are `rk-x-*` and allow-listed
   (`V3_PRODUCT_CLASS_ALLOW_LIST`).
5. **React components in `@xr/ui/v3`.** A separate entry point; the v46 root export is unchanged.
   Components emit the Refined B classes and ARIA, take every word, figure, date and destination
   from the caller, and hold no sample data or business rule. Where a v46 behaviour exists it is
   shared, not duplicated: the drawer (`useDrawer`, new optional `persistentNavigation`), the modal
   dialog (`useModalDialog`, extracted from the v46 `DialogFrame`), the account disclosure
   (`useAccountMenu`), the error-summary links (`focusField`). Names that match a v46 component
   (`Button`, `StatusPill`, `ConfirmDialog`, …) keep its role; a migrated screen changes its import
   to `@xr/ui/v3`.
6. **Lint and tests per layer.** `xr/v3-class-names` governs `packages/ui/src/v3/**` (Refined B
   prefixes, `rk-x-*` allow-list) and `xr/v46-class-names` everything else; rendered-class tests
   (`expectV3ClassesOnly`) prove each V3 class is defined. The one data-driven inline style (the
   term timeline's widths) is a recorded scan exception isolated in `v3/term-track.tsx`.
7. **v46 islands.** Content whose V3 design is pending (for example the shared Help and account
   panel until XS is delivered) renders inside `<V46Island>` (`div[data-xr-v46]`): V3 excludes it,
   V3P-05 gives it the `xr-app` container and v46 text defaults.
8. **One integration owner, role by role.** Normal product routes keep the v46 presentation until a
   complete, owner-approved role export is integrated through
   `design/v3-refined-b/pack/11-Claude-Code-Complete-Role-Intake.md`. Migrated screens get V3
   comparisons under new names (`../v3/V3-COMPARISON-MAP.json`); the v46 pins and baselines stay as
   history for screens not migrated.
9. **Test ports per worktree.** The browser suites take their ports from `XR_E2E_WEB_PORT`,
   `XR_E2E_SPECIMENS_PORT`, `XR_E2E_TEST_HOOKS_PORT` (defaults 3000 / 3100 / 3200), so a worktree can
   run them while another checkout's servers keep their ports; verify checks the same ports.

## Consequences

- The v46 screens and the locked public landing render exactly as before: no product route loads
  the V3 entry, the product layer statement is unchanged, and every V3 selector needs a V3 root.
  The specimen harness loads the V3 entry on every page, so its v46 suites and parity references
  run with V3 present.
- A role migration imports `@xr/ui/styles-v3.css` in its layout, wraps the role in the V3
  `WorkspaceShell`, and adds `apps/web` lint/test support for V3 classes (the web Preflight
  fingerprint test must add the V3 sheets to its source CSS, `e2e/support/built-css.ts`
  `LAYER_ORDER` must name the nested `xr.v3.*` layers on V3 chunks).
- Public Sans: Refined B uses weights 650 and 800. V3 surfaces add the range link
  (`wght@400..800`, the boards' own); weights 400–700 render from the same files as before.
- Two presentation systems coexist until the last role migrates; v46 components are retired then,
  not before.

## Removal trigger

All 123 designed ids migrated to V3 with owner acceptance (the v46 layer and components are then
removed in a separate change), or a new owner-approved foundation version (new FOUNDATION-LOCK:
regenerate the derivative, re-run the provenance and specimen suites).
