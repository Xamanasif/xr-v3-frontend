# Phase 2 — end-to-end functional corrections (24 Oct 2026)

Correction phase after the V3 integration and the owner's acceptance of the premium Public Landing
(`b98814d`, record `2762031`). **The complete frontend is not stakeholder-approved and not frozen.**
No merge, push, deployment or backend work.

## 1. Baseline and evidence

- Branch `v3/refined-b-ui`, baseline `2762031`, clean at the start; protected original
  `/Users/mymac/Desktop/AR-VR` untouched (`1b090c9`, 98 paths).
- Evidence reused: the end-to-end connections audit
  (`~/Downloads/XR-V3-E2E-Connections-Audit-2026-10-22/`, CB-1 … CB-5, F-01 … F-13). The
  “clean-world capability audit” report named in the instruction was **not found on this machine**
  (no file in `~/Downloads` or on the Desktop, and no local session transcript holds it); its role —
  a step-by-step clean-world plan — was rebuilt from the audit's §10 walkthrough and verified in the
  running build (see `HANDS-ON-TEST-GUIDE.md`).
- Both P0 defects were reproduced on the baseline before any change.

## 2. Owner decisions (24 Oct 2026, answered in the session)

| Item                                       | Decision                                                                                                                                                                                                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Payment recovery scope                     | **Same browser.** The requester's own ticket is kept in this browser (beside, never inside, the saved world; cleared by Reset). Reload, navigating away and closing/reopening the tab recover; a line on Your selection leads back. Another browser or device cannot (needs real accounts). |
| Choice-only assessments (M22 open item)    | **Faculty confirms** the automatic marks; release follows the assessment's own setting. No automatic confirmation authority.                                                                                                                                                                |
| Several written questions (ATT-17 / P4-04) | **Confirmed once per attempt**, after every written answer has a saved mark (one mark block per written question).                                                                                                                                                                          |

## 3. Corrections

### 3.1 `536547a` — payment request recovery (CB-1)

- **Defect:** after an External approval (or even while Submitted), a reload, navigating away or
  closing the requester's tab made the status page answer “We can't find that page”; nobody could
  pay, the Institute Admin could not be assigned, the institution was stranded.
- **Cause:** the status ticket lived in the tab's `sessionStorage` bound to a per-page-load world
  instance, and the saved world withholds every status token.
- **Correction:** the visitor's own ticket is kept in this browser's `localStorage`
  (`xr.request-tickets.kept`) beside the saved world, bound to the world lineage; on restore the
  token is re-attached to exactly that request (reference, routeId, createdAt) where it holds the
  withheld placeholder. Your selection (PU-07) shows “You have a request in progress for
  <institution>” with “Check request status”, served by one new read
  `AccessRequestService.listRequestsInProgress` (only this browser's own tickets; contract addition
  PC-73). ADR-0009 amendment; ADR-0004 note.
- **Unchanged:** the snapshot (tokens withheld), no token in any address, read and payment
  policies (ticket holder or the institution's own Institute Admin), the Internal zero-price route,
  approval → payment confirmation → activation, every transition; no payment processing.
- **Files:** 39 (sample-platform persistence/session/handlers, contracts port + ledger + contract
  suite, web platform runtime/composition, PU-07, request queries and copy, tests, ADR-0009,
  ADR-0004).
- **Bundle:** `~/Downloads/XR-frontend-v3-536547a-payment-recovery.bundle` (SHA-256
  `bb2c64f9…3a5a`).

### 3.2 `4ff9b8c` — assessment shapes (CB-2)

- **Defect:** a choice-only assessment, or one with two or more written questions, was accepted as
  Ready but never produced a result (domain `confirmMarks` policy-open M22 / ATT-17; the queue left
  choice-only attempts out; FA-19 blocked; Students waited for ever).
- **Correction:** `confirmMarks` works for every shape, by a Faculty actor, once every written
  answer has a saved mark; ATT-07 (missing automatic marks) unchanged; the queue lists choice-only
  attempts and attempts with several written answers; FA-19 shows the automatic marks + Confirm
  for choice-only and one mark/feedback block per written question; FA-18, FA-01, the rail and the
  assessment lines count submissions to confirm truthfully; Student pages say the faculty confirms
  the automatic marks (new keys).
- **Unchanged:** score, pass rule, rounding, attempts, release by setting, ATT-10 read-only,
  permissions and co-teacher rules; no auto-pass; no new question type or grading formula.
- **Records:** `docs/decisions/README.md` (owner decisions of 24 Oct 2026), PC-60/PC-74, the method
  ledger, `OWNER_DECIDED_OPEN_ROWS` (ATT-17).
- **Files:** 53 (domain attempt + policy, contracts, sample-platform handlers, UI kit FA marking,
  Faculty and Student pages, nav counts, copy, tests).
- **Bundle:** `~/Downloads/XR-frontend-v3-4ff9b8c-assessment-shapes.bundle` (SHA-256
  `dac50901…58b5`).

## 4. Verification

| Check                                                          | Result                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full platform gate (`pnpm verify`) on `4ff9b8c`, isolated copy | format PASS · repository PASS · workspace PASS (**11,677 unit tests**: domain 791, contracts 783, sample-platform 341, ui 1,506, web 7,800, …) · bundle PASS · browser **3,501 passed**, 1 failed then **passed on two reruns** (a 30 s page-load timeout on `/nope` at 375 px; the same test passed at the other widths) — the first gate run had stopped on a 1 px specimen scroll flake that passed three reruns |
| Parity (specimens + web)                                       | specimens 32/32; web 43 passed, 4 failed = **exactly the five recorded Public artwork comparisons** (B1-03 f0 whole frame, B1-03 f2 experiments, B1-05 f0 preview + whole frame, B1-05 f6 poster); no new difference                                                                                                                                                                                                |
| Payment recovery, product build                                | reload while Submitted; External approval → reload → pay → Access active (one request, one institution); navigate away; tab closed and reopened → Your selection → status → pay; Internal route unchanged; another browser not found; Reset clears; nobody else's request reachable — at four widths                                                                                                                |
| Assessment shapes, product build                               | choice-only, one written, mixed and two written end to end (create → submit → mark/confirm → result per release setting); FA-19 at 375                                                                                                                                                                                                                                                                              |
| Cross-role                                                     | the whole web browser suite at four widths (incl. the full walkthrough A–F + device chain, Package-1C/1D/1E journeys, phase-4a/4b, Vendor → Reviewer → Content Manager, Institute Admin → Student)                                                                                                                                                                                                                  |
| Hands-on build (port 3363, same commit)                        | the clean-world plan re-run in full (steps 0–21) on one fresh world: every step PASS, 0 console errors; request recovery (reload while Submitted, after approval, typed address, navigate away, tab closed → Your selection); one request and one institution at the end; all four assessment shapes released as set; the landing at 1440 and 375 — `HANDS-ON-TEST-GUIDE.md` §0, §13                                |

## 5. P1 issues — decisions needed (nothing implemented)

`P1-DECISION-REGISTER.md`: A duplicate institution on a repeat request (confirmed defect; matching
rule open), B no plan amendment for a newly published experiment (open rule), C group-access timing
mismatch between views (open rule + display inconsistency), D licences shown but not counted (open
rule), E information requested / decline / withdrawal dead ends (open rules). Each has the exact
questions, options and a recommendation.

## 6. Remaining limitations

- Payment recovery is browser-local; another browser or device needs real requester accounts.
- Only the signed-out visitor's tickets are kept (a request sent while signed in keeps its ticket
  for that page load; the Institute Admin path remains).
- FA-02/FA-04/FA-08 “n written answers waiting” counts submissions (differs only for an attempt
  with several written answers); the Institute Admin's written-answers count leaves choice-only
  confirmations out.
- In builds without the answer-key stand-in (non-development), choice-only attempts are queued but
  “can't be confirmed yet” (ATT-07, unchanged).
- Minor wording seen in the hands-on run (unchanged, outside the corrected scope): the submit dialog of a one-question assessment says “All 1 questions are answered.”; pass marks are shown unrounded (“pass mark 1.5”; rounding still open, M22).
- The stand-ins remain local-build only (payment, answer-key marks, resubmission routing, sample
  WEB activity, pre-authorised device) — audit CB-3.

## 7. Recovery

Restore any milestone from its bundle: `git clone -b v3/refined-b-ui <bundle> <folder>` (bundles in
`~/Downloads`: `…-536547a-payment-recovery`, `…-4ff9b8c-assessment-shapes`, and the record commit's
bundle named in the session's final report).
