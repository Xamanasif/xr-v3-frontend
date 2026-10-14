# Phase-1 Package 1A — Sign-in and Super Admin Request Desk (record)

|                   |                                                                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package           | Phase-1 Package 1A (owner authorisation, 14 Oct 2026): XS-01, XS-03, XS-04, SA-02, SA-03 only                                                                           |
| Branch / worktree | `v2/frontend-v46` at `/Users/mymac/Desktop/AR-VR-frontend-v46`, from `c572917` (Phase-0 CONDITIONAL PASS)                                                               |
| Design authority  | `design/handoff-v46/` (frozen, 178/178): B1-09, B1-10, B1-11                                                                                                            |
| Safety backup     | `~/Downloads/XR-frontend-v46-c572917.bundle` (branches `v2/platform-foundation`, `v2/frontend-v46`; `git bundle verify` OK; SHA-256 `7e32cb7b…2eb6`, sidecar `.sha256`) |
| Environment       | macOS (Darwin 25.5.0), Node 24.21.0, pnpm 12.3.4, Playwright Chromium only                                                                                              |

This record is kept outside `docs/v46/` (the audit evidence there must stay byte-identical,
repository scan). It states what Package 1A built, the owner decisions it relies on, the evidence,
and what stays open. Nothing of Packages 1B–1E was started.

## 1 · Screens and routes

| Screen                             | Board                 | Route                                                                         | Feature                                  |
| ---------------------------------- | --------------------- | ----------------------------------------------------------------------------- | ---------------------------------------- |
| XS-01 Sign in                      | B1-09 f0–f6, f11, f12 | `/sign-in` (`(auth)` group, AR-6 focused frame)                               | `features/shared/xs-01-sign-in/`         |
| XS-03 Signed out / session expired | B1-09 f9, f10         | `/sign-in?reason=signed-out\|expired&returnTo=`; `/signed-out` → 307 (row 21) | same card                                |
| XS-04 Forgot password              | B1-09 (disclosure)    | state of `/sign-in`                                                           | same card                                |
| SA-02 Requests                     | B1-10                 | `/admin/requests`                                                             | `features/admin/sa-02-requests/`         |
| SA-03 Request decision             | B1-11                 | `/admin/requests/[requestId]`                                                 | `features/admin/sa-03-request-decision/` |

Route manifest (`src/nav/routes.ts`): 38 page files (35 Phase-0 + 3), `(auth)/layout.tsx`, 8 static
redirects. `BUILT_SCREENS` = XS-07, SA-02, SA-03 (the Super Admin sidebar now lists Requests).

## 2 · Owner decisions applied (Package-1A authorisation)

| Decision                                     | Applied as                                                                                                                                                                                                                                                                                                      |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-01 / DV-3 sample sign-in                  | `SessionService.signIn` with a known sample e-mail and any non-empty password; unknown e-mail → `refused wrong-details` (B1-09 f3); institutional sign-in → `policy-open` T-10 → f5 → f6. Local sample rule only — no token, no credential in copy, no role chooser, no DEMO banner. Not for public deployment. |
| P0-35 interim navigation (Phase-1 extension) | Role bases still land on Help (`/admin` → `/admin/help`); only built destinations render. B1-09's "Back to experiments" (PU-01) and "Request institutional access" (PU-07) and B1-11 f14's "View institution" (SA-07) are not rendered (link-target ledger `not-rendered`).                                     |
| VD-05 decision panel                         | SA-03 uses B1-11's sticky panel (`DecisionLayout` position `sticky`).                                                                                                                                                                                                                                           |
| P1-04 / AD-14 review start                   | Seeded / test-only only; `getRequestForDecision` writes nothing (unit and browser tests assert an unchanged world version).                                                                                                                                                                                     |
| Others                                       | TE-4, TE-8, DV-5, browser persistence and the other Phase-1 questions untouched. P1-11 interim (plan effect `policy-open`, no ACC change) is the domain's existing behaviour; the confirmation keeps B1-11's internal words (state-copy `SA-03.internal-confirm-plan`, owner item).                             |

## 3 · Session and security boundary

- The session store adopts the adapter's own session (`getSession`) after every sign-in / sign-out;
  every identity change clears the whole query cache and publishes a new session key
  (`person:<id>#<nonce>`), so each identity reads under its own namespace (browser:
  `e2e/package-1a/session.spec.ts` — Arjun's key only, then none of his after sign-out, then
  Kavya's only; one world instance; one document).
- `returnTo`: same-origin relative path inside the signed-in role's own base, else the role home
  (`nav/return-to.ts`); unit + browser tests for `https://…`, `//…`, other workspaces.
- XS-03 "Session expired" names the return address only for built pages and only references in
  the boards' shape (`nav/place-words.ts`): a crafted `returnTo` cannot write text into the card.
- No automatic expiry; `?reason=expired` is the only way to the drawn state (P1-19 open).
- A signed-in person opening `/sign-in` is sent to their own workspace (state-copy
  `XS-01.signed-in-visit`): moving between people is sign out, then in (ADR-0003 §5).

## 4 · Evidence

Final `pnpm verify` (the last run before the commit, on the committed tree): **VERIFY PASSED**.

| Step       | Result                                                                                                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| format     | prettier clean                                                                                                                                                                                                       |
| repository | 32 checks · handoff 178/178 · audit evidence 36/36 · v46 copies 27/27 · scans, deny-list, fence wiring                                                                                                               |
| workspace  | turbo build 12/12, typecheck / lint / test 40/40 (`--force`) · **3,820 unit tests** (Phase 0: 3,580): web 916 (+238), ui 828 (+2), the other eight packages unchanged                                                |
| bundle     | 658 product files, 0 test-seam or harness sentinels; the test-hook build carries the bridge (4/4 markers)                                                                                                            |
| browser    | **1,874 passed** (Phase 0: 1,774), 0 failed; 614 skipped, not passed (Phase 0: 634 — the SA-02 route sort tests written as `fixme` in WP-0.7 now run: 8 passed, each at its own viewport); Chromium only             |
| parity     | 53/53 tests · **487 comparisons** (Phase 0: 441): 411 within tolerance, 76 on the register, **0 unregistered**, 0 masked, 136/136 board references, 0 external requests; not closed by the owner: DEV-21…DEV-25 (§5) |

Package-1A tests:

- Unit (web, 227 in the Package-1A files): XS-01 card 18 (including six `returnTo` cases), SA-02
  10, SA-03 11 + decision rules 12, return-address words 16, and `copy/requests.test.ts` — 136
  Package-1A phrases checked verbatim against B1-09 / B1-10 / B1-11; plus the route manifest,
  link-target ledger, sidebar and query-layer tests updated for the new screens. `@xr/ui`
  ConfirmDialog `effects` (+2). The Phase-0 `returnTo` rules (`nav/return-to.ts`, 24 tests) are
  unchanged.
- Browser (`e2e/package-1a/`, 67 passed): sign-in 25 (product build, no test hooks; 4 widths),
  SA-02 20 and SA-03 20 (test-hook build, spine-start world; 4 widths), session namespaces 1,
  demonstration 1; plus `e2e/a11y/datatable-sort.spec.ts` 8 (SA-02's sort on the route at 4
  widths and both sides of the 808 / 1072 px switch).
- Each drawn state in the sign-in, SA-02 and SA-03 specs passes `checkState` at all four widths:
  axe (WCAG 2.0 / 2.1 / 2.2 A and AA tags), one level-1 heading, no invisible focus target, 24 ×
  24 px minimum targets (outside an open modal), no developer surfaces, no Slice-1 markup, no
  sideways scroll. Focus after each move is asserted, and clicks go through `reachAndClick` (the
  element under the real pointer must be the target).
- `getRequestForDecision` writes nothing: the SA-03 unit test and the SA-02 browser test read the
  world version before and after opening a request (P1-04 / AD-14).

Demonstration (owner step 9): `e2e/package-1a/demonstration.spec.ts` runs the 12 steps in one tab
of the product build (no test hooks, no boot descriptor) and asserts one document throughout; the
same journey was walked by hand in the desktop app's browser pane on `next start` (port 3000).
Signed out → `/admin/requests` → `/sign-in?returnTo=%2Fadmin%2Frequests` → required fields and
the e-mail format → institution sign-in unavailable → Arjun Mehta back on Requests → search
"konark", Status filter, Received order, chip removal → REQ-0038 (smaller scope unavailable for a
renewal) and REQ-0040 (all three decisions) → "Request more information" on REQ-0040, seen on the
list and in the sidebar count → another workspace's address shows "This page isn't part of your
workspace" in Arjun's shell → sign out → Kavya Nair's Content Manager shell, where Requests is
not hers → back to Arjun, who sees the same world.

Independent review (one bounded pass, a separate agent): five findings, all addressed —

| #   | Finding                                                                                                            | Outcome                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 1   | A refusal the boards do not word (licences above the request on a smaller scope) closed the dialog with no message | Fixed: the fields are marked invalid and the errors notice shows (state-copy `SA-03.undrawn-refusal`); unit test added |
| 2   | The smaller-scope term defaults to Monthly when the request asked for "current plan" or an end date                | Kept and recorded (`SA-03.term-until`, `SA-03.term-not-offered`); owner item §6                                        |
| 3   | SA-02's live count could announce a figure for the previous filter while the new one loaded                        | Fixed: the count settles only on the new rows; unit test records every announcement                                    |
| 4   | The sidebar count reads "1 requests under review"                                                                  | Recorded (`SA-02.nav-count-singular`; the boards draw only the plural); owner item §6                                  |
| 5   | No feedback when SA-03's service is unavailable                                                                    | Recorded and worded (`SA-03.unavailable`, provisional)                                                                 |

Also from the review pass: stale comments that named an old spec folder were corrected, and the
`pnpm verify` summary no longer lists the SA-02 route sort test as deferred.

## 5 · Visual parity (new comparisons, owner review)

`e2e/parity/b1-package-1a.parity.ts`: 46 comparisons at the drawn frame widths — B1-09 f0 (1440),
f3 / f4 / f6 / f9 / f10 (640), f11 (375); B1-10 f0 (1440), f1 (1080), f4 (720), f8 (375); B1-11
f16 (1060, rail), f3 (520), f15 (375). **34 within tolerance** (32 at 0 px) and **12 on the
register**; the Phase-0 Super Admin sidebar comparison is re-measured as
`05-super-admin-help-built-sidebar-package-1a` (the sidebar now lists Requests).

The measured differences are registered, **not approved** (`tools/board-capture/DEVIATIONS.md`,
regenerated from the verify run):

| ID     | Difference                                                                                              | Status       | Comparisons |
| ------ | ------------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| DEV-21 | Unbuilt links and destinations not rendered (P0-35 extended): sign-in top row and card foot; SA sidebar | owner review | 6           |
| DEV-22 | The spine-start world's requests (B7 reading) differ from the B1 boards' sample records                 | owner review | 7           |
| DEV-23 | Back-link icon: Batch-1 chevron `M15 6l-6 6 6 6` vs board 02's Back icon `M14.5 6 8.5 12l6 6` (3 px)    | owner review | 1           |
| DEV-24 | Sign-in page fills the viewport (PF-02 / VD-23) where B1-09's frame ends at 820 px                      | provisional  | 1           |
| DEV-25 | B1-11 f16's static "Collapse menu" in the rail band vs the live shell's "Expand menu" (7 px)            | owner review | 1           |

One defect the comparisons found was fixed, not registered: SA-02's reference link was drawn grey
instead of B1-10's blue bold link (`xr-id` + weight 700 + link colour).

Phase-0 baselines: the 64 Phase-0 pins in `src/pinned.json` are byte-identical (the diff adds 13
pins and removes nothing); DEV-01…DEV-20, their statuses, masks (none) and tolerances are
unchanged. DEV-10 now measures 16 comparisons instead of 17, because the Super Admin sidebar
comparison moved to DEV-21; its old pin stays in `pinned.json` unobserved (left for the owner,
not deleted).

## 6 · Open items for the owner

1. **DEV-21, DEV-22, DEV-23, DEV-25** (owner review) and **DEV-24** (provisional, follows VD-23):
   none is approved by the harness.
2. **State copy:** 24 new provisional entries in `copy/state-copy.ts` (XS-01 / XS-03 / SA-02 /
   SA-03 states the boards do not word); notably `SA-02.nav-count-singular` ("1 requests under
   review"), `SA-03.undrawn-refusal`, `SA-03.unavailable`, `SA-03.internal-confirm-plan` (P1-11).
3. **SA-03 term default (P1-10 / P1-11):** a smaller scope starts at Monthly when the request asked
   for its current plan or an end date, as those terms are not offered.
4. **REQ-0040 paused:** the world follows the S-1 B7 variant (Konark not paused), so B1-11's
   paused/blocked panel cannot be reached in the product demonstration; it is proven in the unit
   and browser tests through a real `pauseInstitution` command.
5. **Orphaned Phase-0 pin** `05-super-admin-help-built-sidebar`: unobserved since the sidebar
   gained Requests; remove or keep with the owner's agreement.
6. **Sample sign-in (P1-01 / DV-3):** local sample rule only; it must not be deployed as public
   authentication. Real authentication, TE-4, TE-8, DV-5 and browser persistence stay open.
7. **Coverage limits:** Chromium only (P0-28; WebKit / Firefox wait for G-5); parity is a
   same-machine interim (VD-18).

Package 1B is not started and waits for the owner's authorisation.
