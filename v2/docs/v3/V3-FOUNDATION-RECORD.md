# V3 foundation record — XR-V3-RB-1.0 (Refined Direction B)

|                  |                                                                                                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scope**        | Foundation only (controller prompt `design/v3-refined-b/pack/10-…`, §3 and §9). No role imported.                                                                                |
| **Status**       | Foundation delivered on `v3/refined-b-ui`; normal routes unchanged; gate passes except a v46 parity drift that the unchanged Phase 7 build shows too (§8); awaiting owner review |
| **Decision**     | `../decisions/ADR-0010-v3-presentation-layer.md`                                                                                                                                 |
| **Register**     | `V3-STATUS-REGISTER.json` / `.md` (147 ids), `V3-COMPARISON-MAP.json`                                                                                                            |
| **Components**   | `../../packages/ui/src/v3/COMPONENT-EXTENSIONS.md`                                                                                                                               |
| **Next session** | `ROLE-INTAKE-REQUIREMENTS.md` with pack prompt 11, once an owner-approved complete role is supplied                                                                              |

## 1. Base, worktree and safety evidence

| Item                     | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source checkout          | `/Users/mymac/Desktop/AR-VR-frontend-v46`, branch `v2/frontend-v46`, HEAD `a55ace94bb87f46b1be385477e2c6996552775c6` (Phase 7), clean. Not stashed, committed to, reset or switched by this work.                                                                                                                                                                                                                                                                                              |
| Pre-change safety bundle | `~/Downloads/XR-frontend-v46-a55ace9-v3-foundation-pre.bundle`, 56,138,767 bytes, SHA-256 `2a50fd1c1ee5aba61fcbc0ea68c4f9eca59b9ade213949aede00b59d5cd7705e` (`.sha256` beside it). `git bundle verify`: complete history, one ref `refs/heads/v2/frontend-v46` → `a55ace9`. Restore test: a clone from the bundle has 66 commits and tree `c77a82d931e4e1401bccaca41da72bdaedef4fbe`, equal to the source tree. A bundle carries commits only: uncommitted and untracked files are not in it. |
| Worktree                 | `/Users/mymac/Desktop/AR-VR-v3-ui`, branch `v3/refined-b-ui`, created from `a55ace9` with `git worktree add -b`. No remote, push, deployment, merge, reset, force checkout or `git clean`.                                                                                                                                                                                                                                                                                                     |
| Protected original       | `/Users/mymac/Desktop/AR-VR` at `1b090c9` with its 98 uncommitted paths, equal to the external backup record `~/Downloads/XR-AR-VR-Uncommitted-Backup-2026-10-12/` (manifest 98/98 SHA-256; backup `SHA256SUMS` 6/6) before the work and after it (§8). Never written by this work.                                                                                                                                                                                                            |
| Frozen v46 handoff       | `design/handoff-v46`: 178/178 checksums before and after; git sees no change.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Design prototype         | `~/Downloads/XR-Platform-Design-Prototype`: 57 files hashed before the work, identical after it.                                                                                                                                                                                                                                                                                                                                                                                               |
| Observation (not ours)   | At preflight a Codex CLI sandbox process from the ChatGPT app was running with **write** permission on `/Users/mymac/Desktop/AR-VR`. This work never touched that folder; the protected-original comparison above is the evidence of its state at each check, not a guarantee between checks.                                                                                                                                                                                                  |

## 2. Foundation source and hashes

`design/v3-refined-b/` holds the owner's pack byte for byte (46 files; `SHA256SUMS.txt`, 46 OK;
cross-checked against the pack's `PACK-MANIFEST.json`). Source archive
`XR-V3-Claude-Code-Integration-Pack.zip`, 3,323,185 bytes, SHA-256
`2550811119489c43573c94fdb485584731d974eb8d999d21f990c2a7a883d252`. `FOUNDATION-LOCK.json`:
foundation `XR-V3-RB-1.0`, "selected visual reference; complete source subset, not the full 51-board
export"; locked landing ids PU-01, PU-14. The ten locked files (all match):

| SHA-256                                                            | File (under `pack/references/v3/`) |
| ------------------------------------------------------------------ | ---------------------------------- |
| `3598572e00da8148a47f5abda743eb868c3020d8405ac8f4530581f8e49cae67` | `HANDOFF-original.md`              |
| `98b94673f7363b4bf64f7e9dde24fd29ecde9eb0cc3889e230caf4c497b1d5a3` | `design-tokens.json`               |
| `2131cfa9fcd0fb2a1889ed30ec943ada2c31638cca9f13cb17a91447233ff030` | `project/canvas.json`              |
| `6b2be461041569e2ee4c083f6e5b29f73313363ef2568f7a0a4775400011a42b` | `project/core.css`                 |
| `d2390e1e7bf2db081ec09d9b0b744832391a553f9346d7891eab31e30e5abaf2` | `project/rb.css`                   |
| `812daa6c8f4a02b505a417fe0b4f54206f513051f8a5caed06d3d05d080cd704` | `project/rb-kit.css`               |
| `3cdd6a194b3441d628b335d254782009bc8cecea92dda48667474ccf258e91fc` | `project/SA01.dc.html`             |
| `4d88600e819c3b89b14efdfaf37914e23c57414e23fb947f1386ff5cda1d0496` | `project/SA02.dc.html`             |
| `f06c6e3e2fd8900a2a9f34360e11363f6ab506fb1d5676e4d4e0b0265a524b92` | `project/IA01.dc.html`             |
| `71280219faa1f3910cff66ed65b9b2a7ee3664afc97398dc630bb5614c98a54f` | `project/IA02.dc.html`             |

The code carries the same hashes (`packages/ui/src/v3/provenance.ts`, `FOUNDATION_SOURCES`), the
generated stylesheet names its three source hashes in its header, and three checks fail on drift:
`v3-provenance.test.ts` (unit), the uncached `v3-reference.scan.test.ts` (verify) and the generator
itself (it stops when a source does not match the lock).

## 3. What the foundation adds

| Layer                    | Files                                                                                                                                                                                                                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scoped CSS derivative    | `packages/ui/scripts/generate-v3-scoped-css.mjs` → `packages/ui/src/styles/v3/rb-scoped.css` (generated, selector-only change, prettier-ignored)                                                                                                                                        |
| Cascade entry            | `packages/ui/src/styles/v3/index.css` — `xr.v3.rb`, `xr.v3.patch`, sublayers of `xr` after `xr.product`; exported as `@xr/ui/styles-v3.css`                                                                                                                                             |
| Central patches          | `packages/ui/src/styles/v3/patch.css` — V3P-01 … V3P-08 (accessibility fixes and isolation from v46 global rules; no aesthetic change)                                                                                                                                                  |
| Components               | `packages/ui/src/v3/` (entry `@xr/ui/v3`): shell, account trigger, page and section heads, actions, fields, choices, error summary, lists, filters, sort, tables, states, details, decision, dialog, notices, plan, formats, codes, tabs, overview bands, term track, icons, v46 island |
| Shared behaviour         | `useModalDialog` (new, extracted from the v46 `DialogFrame`), `useDrawer({ persistentNavigation })`, `useAccountMenu` + `AccountMenuPanel`, `focusField`                                                                                                                                |
| Lint and scans           | `xr/v3-class-names`; `rk-x-*` allow-list (`V3_PRODUCT_CLASS_ALLOW_LIST`); one recorded inline-style exception (`v3/term-track.tsx`)                                                                                                                                                     |
| Test support             | `packages/ui/src/testing/v3.ts` (`expectV3ClassesOnly`, exact board-element comparison, no internal references)                                                                                                                                                                         |
| Specimens (harness only) | `apps/specimens/src/specimens/v3/` — 21 pages: `/v3-sa-01`; `/v3-sa-02` + no match, loading, failed, empty; `/v3-sa-03` + renewal, paused, decided; `/v3-ia-01`; `/v3-ia-02` + 5 plan scenarios + no match, loading, failed; `/v3-scope`                                                |
| Browser suite            | `apps/specimens/e2e/v3-foundation.spec.ts`                                                                                                                                                                                                                                              |
| Board comparison         | `tools/v3-reference/compare.mjs` (local tooling, not in verify)                                                                                                                                                                                                                         |
| Test ports per worktree  | `XR_E2E_WEB_PORT`, `XR_E2E_SPECIMENS_PORT`, `XR_E2E_TEST_HOOKS_PORT` (defaults 3000/3100/3200) in `@xr/testing`, every Playwright config and `verify`                                                                                                                                   |
| Records                  | ADR-0010, this record, the status register, the comparison map, `ROLE-INTAKE-REQUIREMENTS.md`, `design/v3-refined-b/README.md`                                                                                                                                                          |

### Existing components adapted (v46 side)

- **`DialogFrame`** now uses `useModalDialog`; markup and behaviour are unchanged. The hook adds
  `initialFocus: 'title'` (V3 only) and treats focus on an element before the first Tab stop as
  inside the Tab cycle; v46 dialogs never focus such an element.
- **`useDrawer(options?)`**: optional `persistentNavigation` (V3 passes its rail); without it the
  v46 sidebar (`.xr-side`) is found as before. `DrawerOptions` is exported from `@xr/ui`.
- **`AccountMenu`** is composed from the exported `useAccountMenu` and `AccountMenuPanel`; same
  markup. The V3 account trigger opens this same v46 panel inside a `V46Island` until XS is
  delivered.
- **`ErrorSummary`** exports its `focusField` for the V3 summary.
- **`@xr/ui` exports** gain `./v3` and `./styles-v3.css`; the root export is unchanged apart from
  the `DrawerOptions` type.

### Scope boundaries

- The product's layer statement (`@layer properties, theme, xr.v46, xr.product, utilities;`),
  `index.css`, `product.css`, the v46 copies and `apps/web/src/app/globals.css` are unchanged.
- No `apps/web` source imports `@xr/ui/v3` or `@xr/ui/styles-v3.css` (scan
  `v3-reference.scan.test.ts`). Every V3 selector needs a `.xr` root and skips `[data-xr-v46]`.
- The specimen harness loads the V3 entry on every page, so its v46 suites and parity references
  run with V3 present (§6).
- Specimen fixtures are labelled harness data in `apps/specimens`; components hold no sample record,
  count, date or business rule. No local state machine of a board was copied.

## 4. Additive variants, patches and source defects

All listed with consumers in `COMPONENT-EXTENSIONS.md`: V3P-01 native modal dialog; V3P-02 one sort
control at the table's own measured breakpoint; V3P-03 drawer and scrim end at 1024 px; V3P-04 link
hover thickness; V3P-05 v46 island container and text; V3P-06 skip link; V3P-07 account anchor;
V3P-08 v46 `.xr-avatar` letter-spacing isolation. Fifteen source defects are fixed rather than
copied (dialog and drawer focus, live-region misuse, accessible names, error association, sort
visibility, chip-removal focus, table semantics in narrow layouts, skip link).

## 5. Issues found while building (all fixed)

1. **Sort control missing at some widths.** At a 1193 px frame neither the table's sortable heads
   nor the narrow sort bar showed: the table measured itself after paint. It now measures in a
   layout effect before paint (V3P-02); the browser suite sweeps 1180–1280 px.
2. **v46 rule leaking into V3.** The v46 `.xr-avatar` `letter-spacing: .02em` reached the V3
   account trigger (found by the board comparison) → V3P-08 and a leak test over every shared class.
3. **Missing type declaration** for the new lint rule (`eslint/rules/index.d.mts`) — caught by the
   config typecheck before the gate.
4. **Port collision.** The owner's demo server holds port 3000; the suites could not run beside it →
   configurable ports per worktree (ADR-0010 §9).
5. **A race in the Phase 7 walkthrough test.** The second full gate run failed one case: the 1440 px
   walkthrough timed out on "Sign out" in step D1 — the open menu's button kept moving, then was
   removed. The step clicked the assessment's Settings tab and then checked for "Ready", which the
   record header shows on every tab, so the check could pass and the menu open before the Settings
   navigation had landed. The helper now waits until the chosen tab is the current page
   (`aria-current="page"`). The account menu's markup and behaviour are unchanged by the
   refactor, and nothing under `apps/web/src` changed.

## 6. Tests and results

| Check                                     | Result                                                                                                                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V3 browser suite (specimens, 4 widths)    | 161 passed, 39 skipped (width-gated cases run at their own widths only), 0 failed — before the gate; again inside the gate below                                           |
| Board comparison (`tools/v3-reference`)   | 44/44 board states at the board's exact page size; 36 pixel-identical; 8 differ by 42 or 82 pixels (≤ 0.006 %), two glyph pairs in one text run — `V3-COMPARISON-MAP.json` |
| Full `pnpm verify` (ports 3300/3400/3500) | see §8                                                                                                                                                                     |

The browser suite covers rendering, fonts, overflow and axe on every V3 specimen; the rail and the
drawer (focus entry, Tab cycle, Escape, inert page, closing past 1024 px); the skip link; the
account menu; one sort control at every width; table semantics; filters, chips and Clear; error
summary links; the confirmation dialog (focus, Tab cycle, Escape, outcome focus); no internal
references on Super Admin pages; computed styles inside a v46 island equal those outside V3; and
reduced motion. "Rendered" here means the harness specimens of the normal `next build`, not a
product route: no product route renders V3 yet.

## 7. What did not change

- **Normal routes and user data:** `apps/web/src`, `apps/web/public`, `apps/web/next.config.ts`
  and the domain, contracts, validation and sample-platform packages are byte-identical to
  `a55ace9` (`git diff a55ace9` is empty for them). Changes in `apps/web` are tests and test
  configuration only (ports, `PRODUCT_URL`, the walkthrough race fix of §5). Storage keys, sessions, persistence and every service are untouched;
  nothing persists credentials, sessions or request tickets.
- **Locked landing:** PU-01 / PU-14 source, its global CSS and the V1 assets are unchanged; the
  landing-fidelity task stays HOLD (prompt 13 not authorised; V1 fidelity is not restored).
- **Frozen references and protected originals:** §1 and §8.

## 8. Final gate and end checks

Full `pnpm verify`, run with `XR_E2E_WEB_PORT=3300 XR_E2E_SPECIMENS_PORT=3400
XR_E2E_TEST_HOOKS_PORT=3500` (the owner's demo server keeps port 3000 and was not stopped):

| Run            | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1              | FAIL at `workspace`: the V3 surface test did not list `VisuallyHidden` among the names V3 shares with the v46 root (missed when the component was added) — fixed.                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2              | FAIL at `browser`: one web case of 2,006, the walkthrough race of §5 — fixed; the walkthrough then passed on its own (1 passed, 3.4 min).                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 3 (final tree) | `format` PASS · `repository` PASS (43 checks; handoff 178/178; audit evidence 36/36; v46 copies 27/27; V3 reference 46/46; register 147 ids) · `workspace` PASS (turbo build 12/12, typecheck/lint/test 40/40; 9,431 unit tests: ui 931, web 6,156, config 379, domain 787, contracts 781, sample-platform 320, api 38, validation 20, testing 14, database 5) · `bundle` PASS (2,118 built product files, 0 sentinels; test-hook bridge 6/6) · `browser` PASS (3,306 Playwright tests at 4 viewports: web 2,006, specimens 1,232, testing 68; 598 skipped by design and not counted) · **`parity` FAIL** — see below |

**Parity (run 3):** 90 of 95 tests; 770 comparisons — 641 within tolerance, 122 on the deviation
register, **7 unregistered**. All seven are in `apps/web/e2e/parity/b1-package-1b.parity.ts`
(PU-01 landing f0, PU-02, PU-05, PU-06 f0, PU-06 f5/f6): the SVG artwork of the public pages no
longer matches the product fingerprints pinned on 14 Oct (`tools/board-capture/src/pinned.json`);
the differences sit on the edges of the illustrations — no text, layout or colour change.

These failures are not caused by this work, and they were not re-pinned or masked:

- the web builds' CSS is byte-identical to the Phase 7 builds, and `apps/web/src` is unchanged;
- the Phase 7 test-hook build (`a55ace9`, build id `C3vH9JviRvyvtlhtnFFqo`), copied read-only from
  the source checkout and served in this worktree (the id confirmed in the served page before and
  after the run), fails the same five tests with the same counts today;
- all 37 product captures of that file are byte-identical between the Phase 7 build and this one.

Phase 7's gate passed these comparisons on 17 Oct on this machine; macOS (26.5.2, June) and
Playwright's Chromium (installed September) are unchanged since. The difference is in the capture
environment's anti-aliasing of the artwork — the class of machine-specific residual that VD-18 and
DEV-05 already track. Re-pinning v46 comparisons is an owner decision (§9).

**End checks** (after the gate, before the commit; repeated after it in the handover):

| Check                                           | Result                                                                                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Protected original `/Users/mymac/Desktop/AR-VR` | HEAD `1b090c9`; 98/98 paths equal the backup manifest; `git status` 98 lines, identical to the record; backup `SHA256SUMS` 6/6 |
| Source checkout                                 | HEAD `a55ace94bb87f46b1be385477e2c6996552775c6` on `v2/frontend-v46`; `git status` empty; handoff 178/178                      |
| Worktree                                        | `v3/refined-b-ui`; handoff 178/178, no git change under it; V3 reference 46/46                                                 |
| Design prototype                                | 57 files identical to the hashes taken before the work                                                                         |
| Owner's demo server                             | still running (port 3000), never stopped                                                                                       |

## 9. Limits and items for the owner

- **No role migrated.** Five ids (SA-01, SA-02, SA-03, IA-01, IA-02) have V3 source and specimens;
  their product routes keep the v46 presentation until the complete SA and IA roles are approved
  and integrated. 116 designed ids wait for V3 design; 24 are excluded.
- **Flagged board items O-1 … O-5** (`COMPONENT-EXTENSIONS.md`): undefined `rk-note` /
  `rk-plan-id`; logo slot wording; IA01's institution-code chip; the SA-01 priority order is a
  proposal; two "Requests" icons. `CalmState` is derived from `rb.css` (IA01-calm not supplied).
- **Not provided by the foundation:** stepper, danger button, a "live" status tone, sign-in and
  public shells, Help pages, the XS account panel and banners — role and XS exports bring them.
- **Runtime:** the V3 canvas runtime was not supplied; board comparisons used the historical v46
  runtime (compatibility not established) and are evidence, not baselines.
- **First role migration also needs** (ADR-0010 consequences): the V3 entry and the 650/800 font
  link in the role's layout, `apps/web` lint support for V3 classes, the Preflight fingerprint and
  `built-css.ts` layer order extended to `xr.v3.*`, and the role's routes in
  `V3-COMPARISON-MAP.json` `productScreens` (the scope scan then names them).
- **v46 parity drift on this machine (§8):** seven B1 artwork comparisons fail on the unchanged
  Phase 7 build as well. Either the capture environment is restored (whatever changed between
  17 and 19 Oct), or the owner approves re-pinning those seven entries; until then `pnpm verify`
  fails its parity step on any tree of this repository on this machine.
- **Codex sandbox with write access:** at preflight and again at the end, a Codex CLI sandbox from
  the ChatGPT app (two processes) held write permission on `/Users/mymac/Desktop/AR-VR`. The
  protected original matched its backup at both checks.
- **Role exports present, not imported:** `~/Downloads` holds V3 role source archives (Super
  Admin, Student, Faculty, Academic Reviewer, Vendor, Institute Admin, Entry & shared) with
  screenshot archives, dated 18–19 Oct. This work did not open or import them: an import needs the
  owner's approval in the conversation and pack prompt 11 (`ROLE-INTAKE-REQUIREMENTS.md`).
- **Super Admin internal references:** owner decision 6 (no REQ/ACC/UPD/DTR/SUP/SUB identifiers
  in Super Admin tables, details, notifications, tooltips or accessible labels; academic course
  codes stay) is met by the V3 specimens (browser-checked); the product's SA screens meet it when
  the SA role migrates.
