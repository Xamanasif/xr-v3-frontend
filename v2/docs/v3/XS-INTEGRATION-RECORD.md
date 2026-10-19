# XS integration record — Entry & shared on foundation XR-V3-RB-1.0

The first owner-approved V3 role export, Entry & shared (XS), integrated into the normal product
on `v3/refined-b-ui`, on top of the committed foundation `ada331c` (ADR-0010,
`V3-FOUNDATION-RECORD.md`). Seven ids: XS-01, XS-03, XS-04, XS-05, XS-06, XS-07 and XS-08. XS-02
(choose workspace) stays excluded. The Super Admin intake waits for this commit; no other role
(Student, Institute Admin or any other) was imported.

## 1. Base and safety

- Worktree `/Users/mymac/Desktop/AR-VR-v3-ui`, branch `v3/refined-b-ui`, HEAD `ada331c`
  (foundation XR-V3-RB-1.0, all of it committed), clean tree before the work, no other session
  writing to it.
- The protected original checkout `/Users/mymac/Desktop/AR-VR` was only read.
- The V1 Public Landing and its interactive experiences (PU-01, PU-14), the root layout and
  `app/(public)/page.tsx` were not modified, and never load the V3 layer (checked by
  `v3-reference.scan.test.ts`).
- `design/handoff-v46/` (178 OK) and `design/v3-refined-b/pack` (46 OK) were not modified.

## 2. Source and approval

| Item        | Value                                                                                                                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source      | `XR-V3-XS-Entry-Shared-Source.zip` (also supplied as `…_1.zip`, byte-identical), 196,830 bytes, SHA-256 `1da3c72b8b931ffb5bd9bcf30548ad4556dafa96b1c16dfb51e69ce6efdc9d20`                                      |
| Screenshots | `XR-V3-XS-Entry-Shared-Screenshots.zip`, 9,098,404 bytes, SHA-256 `3c1c4d0fa8fe5b2afe240b8a1cce2a09227334040cec2dcc97ba714cf64d5cdc`, 121 renders (kept by the owner, not copied)                               |
| Revision    | canvas Version 6, shared contract 1.0.0, package date 18 Oct 2026                                                                                                                                               |
| Foundation  | `XR-V3-RB-1.0`: `FOUNDATION-LOCK.json` names it; the export's `core.css`, `rb.css` and `rb-kit.css` match the foundation lock byte for byte; its one local addition (`xs-shared.css`) matches its recorded hash |
| Integrity   | 126 files copied byte for byte to `design/v3-refined-b/roles/XS-v6/`; `shasum -a 256 -c SHA256SUMS.txt` → 125 OK                                                                                                |
| Approval    | The owner, in the integration conversation of 19 Oct 2026. The export's own files still read "OWNER APPROVAL PENDING": they were written before the owner accepted the design                                   |

Read before any code: `START-HERE.md`, `HANDOFF.md`, `SHARED-CONTRACT.json`, `ROLE-STATUS.json`,
`LINK-MAP.json`, `SCENARIOS.json`, `COMPONENT-EXTENSIONS.md`, `CHECKS.md` and the `project/`
sources. The `.dc.html` sample records, preview state machines and preview-only classes
(`xs-slot*`, `xs-pub*`, `xs-spec`, `xs-kit*`) are not product UI and were not copied into it.

## 3. What was integrated

| Id    | Product                                                                                                                                     | Where                                                                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| XS-01 | The sign-in page: default, missing details (summary + field errors), wrong details, institution sign-in unavailable, busy                   | `/sign-in` — a full V3 entry page (`app/(auth)`)                            |
| XS-03 | The signed-out and session-ended notices, focused on arrival; the session-ended notice names the kept return address                        | `/sign-in?reason=…`                                                         |
| XS-04 | The two contact disclosures: "Forgot your password?" and "First time signing in?" (recovery and activation stay OPEN)                       | `/sign-in`                                                                  |
| XS-05 | The account panel: name, role, organisation where there is one, My device (eligible Student), Help & support, Sign out                      | every workspace page, opened from the v46 top-bar account button            |
| XS-06 | "This page isn't part of your workspace", with "Back to Home" or "Back to Overview" (the home's own name) and Help                          | an address under another workspace's base, in the person's own shell        |
| XS-07 | My reports (with reports, empty, loading, failed), Report a problem (form, errors, sending, sent), report detail (open, resolved, reopened) | `<base>/help`, `<base>/help/report`, `<base>/help/reports/{id}`             |
| XS-08 | The paused and inactive banners, first in the page, with Help                                                                               | every workspace page of a paused institution's people or an inactive person |

The behaviour is the product's own, unchanged: the session port's validation and refusals, the
return-address rules, the session gate, the report commands and their refusals, the Super Admin
operations that pause an institution or resolve and reopen a report. No service contract, role
permission or workflow changed; no backend, SSO or business rule was added.

## 4. How it sits in the product (ADR-0010)

- **Stylesheet.** `packages/ui/src/styles/v3/xs-scoped.css` is generated from the export's
  `xs-shared.css` by `scripts/generate-v3-scoped-css.mjs` (scoped like `rb-scoped.css`, after the
  generator checks the foundation lock, the local-addition hash and the export's checksums), in a
  new cascade layer `xr.v3.xs` between `xr.v3.rb` and `xr.v3.patch`. Rules whose every selector
  is preview-only are left out. `v3-provenance.test.ts` regenerates and compares it.
- **V3 regions inside the v46 shells.** The role shells are not migrated (they move with their
  roles), so an XS surface in a workspace is a V3 root of its own, `div.xr.rb.rk-x-region`
  (V3P-09), inside the v46 `main`: the Help pages, Not your workspace, and the banner (first child
  of `main`). The V3 container queries measure the app width: the v46 `.xr-app` that holds a
  region is named `rb` too.
- **Account menu.** The v46 trigger stays; it opens the XS panel (`div.xr.rb.rk-x-popover`,
  V3P-10) with the export's keyboard contract (open focuses the first item; arrows, Home and End
  wrap; Escape and the outside-click layer return focus; Tab out closes) and its accessible name
  ("Account menu, name, role[, organisation]").
- **Fonts.** Public Sans 400–800 is linked by the routes that render V3 (`app/(auth)/layout.tsx`,
  `app/_workspace/workspace-route.tsx`), never by the root layout or the landing.
- **Patches.** V3P-09, V3P-10, V3P-11 added (product classes on the allow-list:
  `rk-x-region`, `rk-x-region--banner`, `rk-x-popover`, `rk-x-crumbs-tight`). V3P-06 and V3P-07
  retired: the export's own `a.xs-skip` and `div.xs-acct-slot > div.xs-acct` replace them.
- **Components.** `packages/ui/src/v3`: `entry.tsx`, `account.tsx`, `message.tsx`, `help.tsx`,
  `region.tsx`, and additive props on existing ones (`COMPONENT-EXTENSIONS.md`). No approved
  foundation component was replaced.
- **Focus.** After a client-side move, focus goes to the region's H1 when there is one (XS-P2).

## 5. Decisions and discrepancies

1. **Back to experiments** opens the public catalogue `/experiments` (PU-04), as the XS link map
   sends it; B1-09 sent it to the Landing. **Request institutional access** opens `/request-access`
   (PU-08), which sends a visitor with nothing selected to Your selection (P1-03).
2. **SES-09 inactive refusal kept.** The service answers `policy-open` for an inactive Faculty
   member's sign-in; the product keeps showing that answer as the card's refusal. The export draws
   no such state (its sign-in never reveals account status).
3. **XS-08 refusal pages not routed.** The export's paused and inactive refusal pages have no
   approved product route (their address rule is a design proposal). Not bound.
4. **Role home notices pending.** XS-08's page-level notice on each role home is assembled with
   that role (ASSEMBLY PENDING). Only the banner is integrated.
5. **Date eyebrow omitted.** The export's date line over the page head belongs to its V3 shell;
   it is not drawn inside the v46 shells.
6. **Shell labels stay v46.** The v46 sidebar and drawer foot keep "Help" where the export's
   V3 shell says "Help & support", and the top bar keeps its v46 look; they change with each
   role's shell.
7. **Breadcrumb in the page.** On Report a problem and the report detail the breadcrumb is the
   page's own at every width; the v46 top bar no longer repeats a Help trail there.
8. **Super Admin and references.** A Super Admin sees no report reference on the XS screens (owner
   decision 6). The Super Admin's own operations screens still show SUP references in place words
   and return labels; they change with the Super Admin migration (done since: no Super Admin
   screen shows a reference — `SA-INTEGRATION-RECORD.md`).
9. **Prototype line.** The export's line under the sign-in card ("Prototype sign-in. … Sample
   accounts open with any password.") is shown; it names no account. Recorded as the scan
   exception `sample-accounts` (static and DOM), until real sign-in exists or the owner rewords it.
10. **Parity network.** The parity harness serves the V3 font request with an empty stylesheet
    (recorded in its ledger as "v3-font-range (empty)"): the v46 comparisons keep the vendored
    v46 fonts and stay offline.
11. **Superseded v46 comparisons** are retired by name (60), each listed under the V3 entry that
    replaced it in `V3-COMPARISON-MAP.json` (`productScreens[].supersedes`), reported as
    `retired-by-v3` — never counted as passed, never masked. The v46 shell comparisons of the
    same pages are kept (sidebar head, workspace and Help foot; the whole sidebar and the top
    bar wherever the XS content does not change them). Two whole-sidebar comparisons are
    retired because the v46 sidebar stretches to the page, so its height follows the XS content
    (Validation, Report detail).

## 6. What did not change

The V1 Public Landing and PU-14; every public page; every role page outside XS (Super Admin,
Institute Admin, Student, Faculty, Vendor, Academic Reviewer, Content Manager keep their v46
presentation); the v46 shells, sidebars and top bars; the domain, contracts, sample platform and
services; the baseline pins (`tools/board-capture/src/pinned.json`), `DEVIATIONS.md` and
`BASELINES.md`.

## 7. Tests and results

Every run used ports 3300 / 3400 / 3500; the owner's demo server on port 3000 was left running.

| Check                                       | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm verify` (final gate)                  | Run of 19 Oct 2026 (2,950 s): `format` PASS · `repository` PASS (46 checks; handoff 178/178; audit evidence 36/36; v46 copies 27/27) · `workspace` PASS · `bundle` PASS (2,121 built product files, 0 sentinels; test-hook bridge 6/6) · `browser` PASS · `parity` FAIL on the 7 legacy comparisons only (below). Two earlier runs stopped on defects fixed here: a test helper named `Card` (the Slice-1 identifier guard) and an outside press placed beyond the 375 px viewport in the account-menu test. |
| Unit and integration                        | turbo build 12/12, typecheck / lint / test 40/40 tasks; 9,467 unit tests in 10 packages (web 6,162, ui 961, domain 787, contracts 781, config 379, sample-platform 320, api 38, validation 20, testing 14, database 5); `v3-provenance.test.ts` regenerates `xs-scoped.css`; `v3-reference.scan.test.ts` checks the export (125 OK), the register, the map and the scope boundary (10 web sources load V3, all named, none of them the landing or the root layout).                                          |
| Browser, four widths (1440, 1024, 768, 375) | 3,314 Playwright tests passed at the four widths (web 2,014, specimens 1,232, testing 68); 598 skipped by design, not counted.                                                                                                                                                                                                                                                                                                                                                                               |
| Keyboard and focus                          | In the browser suites at every width: the account panel's keyboard contract and outside press (`account-menu.spec.ts`), the sign-in summary, refusal and notices taking focus (`package-1a/sign-in.spec.ts`), focus on the region H1 after a client-side move (`navigation.spec.ts`), axe WCAG 2.2 AA, no invisible focus target and 24 × 24 px targets on every XS state (`a11y.spec.ts`)                                                                                                                   |
| Navigation and permission                   | Every rendered link in the link-target ledger, followed client-side in one world (`navigation.spec.ts`); another workspace's address shows XS-06 in the person's own shell (`workspace-guard.spec.ts`, `cross-role.spec.ts`); the session gate and return-address rules (`session-gate.spec.ts`, `package-1a/session.spec.ts`)                                                                                                                                                                               |
| Built CSS                                   | Every chunk declares the ADR-0010 order (V3 chunks reserve `xr.v3` and name `xr.v3.rb` < `xr.v3.xs` < `xr.v3.patch`); the landing's stylesheets carry no V3 layer; a fresh-document probe shows `xr.v3` beats `xr.product` and loses to `utilities` whichever chunk loads first; no Preflight rule                                                                                                                                                                                                           |
| Visual parity (v46 harness)                 | 90 of 95 tests; 770 comparisons: 602 within tolerance, 101 on the deviation register, 60 retired by name for the XS screens, 7 unregistered (the legacy exception below); 0 masked; 0 external requests.                                                                                                                                                                                                                                                                                                     |
| V3 product captures                         | 60 captures of the normal build at four widths (plus the inactive banner on the test-hook build): no overflow, no clipped text, all Public Sans weights, no console error; reviewed against the export renders; the four full-page sign-in states pixel-compared (anti-aliasing and content only) — `V3-COMPARISON-MAP.json` `productEvidence`                                                                                                                                                               |
| Integrity                                   | `design/handoff-v46` 178 OK · `design/v3-refined-b` 46 OK · `roles/XS-v6` 125 OK · protected original checkout unchanged (`1b090c9`, 98 paths)                                                                                                                                                                                                                                                                                                                                                               |

**Legacy exception, not new:** the seven B1 artwork comparisons of the public pages
(`b1-01-f0-hero-figure`, `b1-01-f0-formats`, `b1-03-f0-whole-frame`, `b1-03-f2-experiments`,
`b1-05-f0-preview`, `b1-05-f0-whole-frame`, `b1-05-f6-poster`) still fail against their 14 Oct
pins, exactly as recorded at the foundation (`V3-FOUNDATION-RECORD.md` §8). Their product captures
are byte-identical to the foundation's own verify run of 18 Oct, and so are all 379 product
captures the two runs share (171 of them the public pages, the landing included). Not re-pinned,
not masked. Three v46 sidebar specimens (`05-academic-reviewer-none-sidebar`,
`06-academic-reviewer-sidebar-destinations`, `06-vendor-sidebar-destinations`) rasterise
differently from run to run on the same build, inside tolerance; XS does not touch them.

## 8. Limits and items for the owner

- Sign-in stays the prototype stand-in: sample accounts, any password, no SSO, no recovery or
  activation flow (T-10, T-11 / R02 open). The prototype line says so under the card.
- XS-08 is integrated in part: the banner only. The page-level notices on the role homes come with
  each role; the export's paused / inactive refusal pages have no approved route.
- The role shells, their top bars, sidebars and labels stay v46 until each role migrates; the
  account trigger is the v46 one.
- The SES-09 inactive refusal on sign-in is a kept product answer the export does not draw — the
  owner may want it designed.
- The Super Admin's own screens still show SUP references; they change with the Super Admin
  migration, which can resume from the intake record now that XS is committed. (Since done:
  `SA-INTEGRATION-RECORD.md`.)
