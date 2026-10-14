# Phase-1 Package 1C — Connected Selection, Institutional Request, Payment Stand-In and Activation (record)

|                   |                                                                                                                                                                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package           | Phase-1 Package 1C (owner authorisation, 14 Oct 2026; "Authorize Package 1C ONLY"): PU-07, PU-08, PU-09, PU-10, PU-12, PU-13 only                                                                                                      |
| Branch / worktree | `v2/frontend-v46` at `/Users/mymac/Desktop/AR-VR-frontend-v46`, from `b1479d8` (Package 1B, functionally accepted)                                                                                                                     |
| Design authority  | `design/handoff-v46/` (frozen, 178/178): B1-06, B1-07, B1-08; B1-13 (continuity); B8-06 (Phase-1 sequence, components); B1-01 / B1-05 / B1-09 for the ways in                                                                          |
| Safety backup     | `~/Downloads/XR-frontend-v46-b1479d8.bundle` (branch `v2/frontend-v46` at `b1479d8`, complete history; `git bundle verify` OK and a restore test; SHA-256 `84f0e8f6…1999`, sidecar `.sha256`), made and verified before implementation |
| Environment       | macOS (Darwin 25.5.0), Node 24.21.0, pnpm 12.3.4, Playwright Chromium only                                                                                                                                                             |

Like the 1A and 1B records, this one is kept outside `docs/v46/` (the audit evidence there stays
byte-identical). It states what Package 1C built, the two owner decisions it implements, the
evidence and what stays open. Nothing of Packages 1D–1E was started.

## 1 · Screens and routes

| Screen                             | Board                      | Route                                                   | Feature                                   |
| ---------------------------------- | -------------------------- | ------------------------------------------------------- | ----------------------------------------- |
| PU-07 Your selection               | B1-06                      | `/selection`                                            | `features/public/pu-07-selection/`        |
| PU-08 Request institutional access | B1-07 (steps 2–3)          | `/request-access?step=details` · `?step=review`         | `features/public/pu-08-request-access/`   |
| PU-09 Request sent                 | B1-07 f2, f8 (step 4)      | `/request-access/sent`                                  | `features/public/pu-09-request-sent/`     |
| PU-10 Request status               | B1-08 f0 … f4, f6, f7, f10 | `/requests/[requestId]` (the opaque route id, ADR-0009) | `features/public/pu-10-request-status/`   |
| PU-13 Access active                | B1-08 f8, f9               | a state of PU-10                                        | `pu-10-request-status/request-status.tsx` |
| PU-12 Payment                      | B1-08 f5                   | `/requests/[requestId]/payment`                         | `features/public/pu-12-payment/`          |

Guards and redirects (P1-03; S4): an empty selection sends `/request-access` to `/selection`; a review
step with details missing to `?step=details`; a cold `/request-access/sent` (nothing sent in this tab)
to `/selection`; a payment page with no payment step now to the request's status — each with
`replace` (no Back loop; Back from PU-09 shows the emptied selection, never a review that could send
again). An address that names no request, or one the visitor may not open, shows the public
not-found page. Route manifest: 49 page files (44 + 5 `(public)` pages).

Ways in, now rendered (link-target ledger `built`): the header's "Selection (n)" (named "Selection,
empty" / "Selection, 1 experiment") and "Request access"; the menu sheet's Selection row and Request
access button; the landing's hero "Institutions · Request institutional access" and the For
institutions button; PU-06's "Go to selection"; the sign-in card's "Need access for your
institution? Request institutional access" (B1-09; all lead to PU-07, HB-02). PU-09's "Check request
status" is the one link to a request's pages.

## 2 · The owner decisions

### TE-4 — the payment stand-in (approved for Package 1C)

- The stand-in lives in the sample adapter (`PaymentStandIn`, `@xr/sample-platform`
  `platform/core.ts`). The sample data source's composition root asks for `confirm-on-start` only
  in a local prototype build (`NEXT_PUBLIC_APP_ENV=development`, the default); a staging or
  production build leaves a started payment unconfirmed; the API data source has none.
  "Continue to payment" calls `startPayment`; after it commits, the
  provider's report is a system command of its own (`PaymentOutcomePort.report`, actor
  `system:payment-provider`, provenance `sample-standin`): approval, payment start, payment
  confirmation and activation stay separate events (B1-08 "Three separate facts"; BR-036).
- "Payment not confirmed" and "Payment failed" come only from fixtures and the CI seams
  (`planPayment`, `reportPayment`); "Check again" re-reads, "Try payment again" starts a new payment,
  no "pay again" while a confirmation is pending (REQ-08); an internal approval never shows a
  payment step (REQ-09). A stale or repeated start is refused and writes nothing.
- PU-12 shows what will be activated — institution, experiments and formats, licences, term,
  request — and nothing else: no amount, price, method, provider, card or refund field or word, no
  "mark paid" (copy tests and browser tests). Only the sample world's records change; no money moves.
- This is the local prototype only. It is not a payment system and is not to be deployed as one
  (ADR-0007 amendment; `OPEN_DECISIONS.md` Part E).

### DV-5 / O-05 — who may open a request's pages (approved; ADR-0009)

- `/requests/[requestId]` takes an opaque route id (`rq-0011`), never the reference (`REQ-0042`) and
  never the ticket. `submitPublicRequest` answers the reference and the route id; the ticket goes
  straight into the sending browser session (PC-33, PC-34).
- `getRequestStatus` and `startPayment` answer the browser session holding the ticket for the user
  session that sent it, or the signed-in Institute Admin of the requesting institution; anyone else
  is answered by the service exactly as an unknown address — `not-found` — and learns not even
  that the request exists; the pages show the public not-found page, with nothing of the request.
  The Super Admin's decision page and receipts carry the request without its ticket (PC-34).
- Tickets are kept in `sessionStorage` (`xr.request-tickets.v2`, one of the two board-drawn items
  ADR-0004 already allows), each bound to the world that issued it (a reload drops it) and to the
  user session that sent the request (another person signing in to the tab holds none). No other
  storage was added: `localStorage`, IndexedDB and cookies stay unused.
- Two readings are for the owner's acknowledgement (ADR-0009): the user-session binding, and HTTP
  200 with a client-drawn not-found page for `/requests/…` (below).

### TE-8 mechanism on the Package-1C pages — for acknowledgement

TE-8 was approved for the Package-1B pages. The Package-1C pages read the same browser-only sample
world in the same way (client components behind route files that only pass `params`); their server
HTML holds nothing of any request. This is **not** the production SSR architecture, and it is
reported here for the owner's acknowledgement rather than assumed approved.

## 3 · Services, contracts and domain

- **Reused, unchanged in contract:** `SelectionService.get / add / setFormats / remove / undoRemove`,
  `AccessRequestService.submitPublicRequest / getRequestStatus / startPayment` (Phase-0 ledger
  entries; no new delivery), the Super Admin's `getRequestForDecision / approveRequest /
approveSmallerScope / requestMoreInformation` (Package 1A).
- **Changed:** `AccessRequest.routeId` and the requester view's `routeId` (PC-33); the ticket no
  longer crosses any port — both requester methods take the route id, and SA-03's decision page and
  every decision receipt carry `requestForDecision`, the record without it (PC-34); a caller who may
  not open a request is answered `not-found` by `getRequestStatus` and `startPayment` alike (the
  ledger no longer lists `policy-open` / T-01 for the read); `Selection.lastRemovedAt`,
  so Undo puts the experiment back where it was (PC-35, B1-06 script); the browser session's ticket
  store (world and user-session binding); `PaymentStandIn` and the provider's report as its own
  system command; `startPayment` no longer answers `not-signed-in` (the requester has no account).
- **Contract suite:** a new `access` group of eight adapter-independent cases (`request-access:` —
  session gate, Institute Admin, Institute Admin pays, duplicates and stale starts, internal route,
  payment failed, approved with changes, review start), each asserting that refusals write nothing;
  the 12 invariants run after every case. Sample adapter: 13 direct tests
  (`handlers/access-request.test.ts`: where the ticket lives, world and user-session binding,
  storage read back entry by entry, the Institute Admin path, the TE-4 stand-in, replayed commands).
- **Copy:** `copy/request-access.ts`, every phrase checked verbatim against B1-06 / B1-07 / B1-08
  (`copy/request-access.test.ts`, 117 checks), plus 26 state-copy entries (`copy/state-copy.ts`
  `PU-07.*` … `PU-13.*`) for what no board words: loading, failed, not payable, cold PU-09, the
  undrawn history lines, the edit label that keeps "BITS".
- **Shared components:** `@xr/ui` RadioGroup / CheckboxGroup take `hintClassName` / `errorClassName`
  and FieldError `className` — board context classes, because every board spaces a group's hint
  inline its own way (B1-07: `margin:-4px 0 8px`, error `margin-top:8px`); Stepper takes
  `doneWords={false}` (B1-06 / B1-07 write a done step without "· Done"; screen readers still hear
  "· Done" from a visually hidden span).

Not invented: no internal / external rule (the Super Admin chooses the route on SA-03, ND-07 open),
no price, licence calculation or entitlement; published ≠ institutional access ≠ student access;
the hierarchy stays Programme → Course → Experiment → WEB / AR / VR / MR.

## 4 · Evidence

Final `pnpm verify` on the code as committed: **VERIFY PASSED** in 690 s (run
`2026-10-14T19-06-53-145Z-verify`, i.e. 15 Oct 2026, 00:36 IST). Only documents changed after it —
this record's figures and `tools/board-capture/DEVIATIONS.md`, regenerated from that run — and they
were re-checked with prettier and the repository scans.

| Step       | Result                                                                                                                                                                                                                                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| format     | prettier clean                                                                                                                                                                                                                                                                                                          |
| repository | 32 checks · handoff 178/178 · audit evidence 36/36 · v46 copies 27/27 · scans, deny-list, fence wiring                                                                                                                                                                                                                  |
| workspace  | turbo build 12/12, typecheck / lint / test 40/40 (`--force`) · **4,288 unit tests** (Package 1B: 4,082): web 1,343 (+181), sample-platform 168 (+14), contracts 729 (+6), ui 831 (+2), domain 787 (+3); testing 11, config 356, validation 20, database 5, api 38 unchanged                                             |
| bundle     | 831 product files (1B: 757), 0 test-seam or harness sentinels; the test-hook build carries the bridge (5/5 markers, the request seams' `xr-web-test-request-seams` included)                                                                                                                                            |
| browser    | **2,012 passed** (1B: 1,947; web 873, was 812), 0 failed; 644 skipped, not passed (1B: 641 — width-gated tests); Chromium only                                                                                                                                                                                          |
| parity     | 83/83 tests · **658 comparisons** (1B: 566), 16 whole frames: 552 within tolerance, 106 on the register, **0 unregistered**, 0 masked, 136/136 board references, 0 external requests; open owner decisions blocking parity: none; not closed by the owner: DEV-21 … DEV-25, DEV-27 … DEV-33 (DEV-26 no longer observed) |

New Package-1C tests: web unit `features/public/request.test.tsx` (21: PU-07 … PU-12 against the
real composition root and sample world, including the refusals), `copy/request-access.test.ts` (117
verbatim checks against B1-06 … B1-08), `platform/test-hook-bridge.requests.test.ts`, the updated
composition, route, link-target, public-nav, sign-in and 1B public tests; sample platform
`handlers/access-request.test.ts` (14); contracts: the eight `request-access:` cases and the
provisional register (35 items); ui `stepper.test.tsx` and `choice.test.tsx`; testing
`e2e/reach.spec.ts` (the sticky-panel case). Browser (`e2e/package-1c/`): `request.spec.ts`,
`status.spec.ts`, `access.spec.ts`, `demonstration.spec.ts` at four widths (60 tests: 57 run, 3
width-gated), plus the updated 1A, 1B, PU-15, routes and bridge specs.

### The connected flow, in the browser

- **Product build, one tab, no hooks** (`e2e/package-1c/demonstration.spec.ts`, at 1440, 1024, 768
  and 375): Landing → catalogue → Shell-and-Tube Heat Exchanger → WEB + VR → Go to selection →
  Continue to request → details → Review → Submit → REQ-0042 → Check request status (Submitted) →
  the Super Admin signs in on the same tab through the sign-in card (while signed in, the
  requester's page shows the not-found page) → SA-02 → SA-03 → Approve request, External, confirm →
  sign out → the requester's status: Approved — payment required → PU-12 → Continue to payment (the
  TE-4 stand-in confirms) → Access active, ACC-0107, history "Access active · Payment confirmed ·
  Approved — payment needed · Request submitted" — one document throughout. The requester's address
  is opened through the app router, as a link would (no product page lists a request; a typed
  address would start a fresh world).
- The same journey was walked by hand in the desktop app's browser pane on `next start` (port 3000)
  at 1024 px, and every page was compared with the board's frame text (B1-07 review rows, B1-08 f0,
  f1, f8).
- **CI-only steps** (test-hook build, `status.spec.ts`): the AD-14 review start ("Under review"),
  SA-03 decisions through `actAs` (information requested, approved with changes, internal route),
  and the provider outcomes `pending` (Payment not confirmed, Check again) and `failed` (Payment
  failed, Try payment again).

### Refusals and who may see what (`access.spec.ts`)

The reference, the ticket and an unknown route typed as addresses; a tab opened from the sending one
(copied session storage, new world: the ticket is dropped); another tab with the stored ticket
planted, and with a forged one; the sending tab reloaded; another person signed in to the same tab
(the Content Manager, another institution's Institute Admin), and the visitor's access back after
signing out through the product's account menu; the Institute Admin of the requesting institution
(REQ-0040 Konark) and of another (REQ-0039 refused), and BITS Pilani — Hyderabad Campus's own
Institute Admin on REQ-0039 (internal route, no payment step); payments started by anyone else
refused with nothing written; the server's HTML of every `/requests/…` address holds no request.

### Screens, accessibility, responsiveness

Every drawn state of PU-07 … PU-13 passes `checkState` at 1440, 1024, 768 and 375 — axe (WCAG 2.0 /
2.1 / 2.2 A and AA), one level-1 heading, no invisible focus target, 24 × 24 px targets, no developer
surface, no Slice-1 markup, no sideways scroll — with real pointer clicks reached by the wheel
(`reachAndClick`), focus after each move (main; the "Request sent" and "Check your request"
headings; the error summary; the Undo notice and the restored title; a summary link's field; Edit's
field), and Back / Forward in one document.

### Visual parity (`e2e/parity/b1-package-1c.parity.ts`)

B1-06 (6 frames), B1-07 (7 of 9: "Submitting" and "Failed + retry" have no reachable browser state —
the sample adapter answers at once and the build has no fault seam; both are unit-tested) and B1-08
(11 frames), each at its drawn width, against the test-hook build. New register entries for the
owner's review: DEV-31 (a board frame off the pixel grid: one pixel row more, which DEV-26 had been
absorbing on two 1B whole frames), DEV-32 (B1-08 writes the review start and the information request
with a date only; the product writes the recorded time; B3-08 writes the same event with its time)
and DEV-33 (B1-08 f9 draws the B1 variant of REQ-0039; the world holds the B7 variant). DEV-12
(VD-22, owner-approved) covers B1-07's error summary; DEV-23 the back links; DEV-24 the empty
selection page filling the viewport (PF-02). DEV-26 is no longer observed (every link it named now
renders and matches) and DEV-21 no longer applies to the sign-in card. Pins: 21 added, 3 re-measured
(b1-03, b1-05, b1-09 whole frames), 12 stale removed, the other 83 byte-identical; no tolerance,
mask or unrelated pin changed. The spec-level capture steps are in `tools/board-capture/README.md`.

Two fixes came from the comparisons: PU-08's term group now spaces its hint and error as B1-07 does
(through the new board context classes), and `reachAndClick` now decides "the wheel stopped" from
the page's scroll positions as well as the target's box (a sticky panel stays put while the page
scrolls — new fixture `reach-sticky.html` and self-test; the clipped and blocked cases still fail).

### Independent review

One bounded review by a separate agent (read-only; it re-ran the 1C unit tests, ESLint on the
changed files and a probe against the built packages): no high-severity finding. Confirmed findings
and the plausible ones, all addressed:

| #   | Finding                                                                                                                                          | Outcome                                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Low–medium: the service told an unknown address (`not-found`) from someone else's request (T-01 / `not-permitted`), so route ids could be probed | Fixed: both methods answer `not-found` to anyone who may not open the request; ledger, contract cases, adapter, unit and browser tests updated                   |
| 2   | Low: SA-03's decision page and decision receipts carried the requester's ticket (contradicting PC-34)                                            | Fixed: `requestForDecision` (the record without the ticket) on the decision page and every receipt, the provider's included; contract and adapter tests          |
| 3   | Low: with `doneWords={false}` a done step's state was drawn only (navy bar)                                                                      | Fixed: a visually hidden " · Done" (the B1-07 details whole frame re-pinned: pixels unchanged, fingerprint includes the hidden words)                            |
| 4   | Plausible: `confirm-on-start` applied to every sample-mode build, hosted ones included                                                           | Fixed: only `NEXT_PUBLIC_APP_ENV=development` (the local default) confirms; staging and production leave a started payment unconfirmed; composition test         |
| 5   | Plausible: a Submit refused with field errors would focus the heading after the summary had taken focus                                          | Fixed: focus goes to the summary (`request-errors`); unreachable today (client and adapter apply one schema)                                                     |
| 6   | Latent: an Institute Admin paying an existing institution's approved request reads "Access active" while no plan changes (OD-B3-09 open)         | Not reachable in 1C (no Institute Admin link to PU-12; a typed address reloads the world): owner item 7 below, and a dependency of IA-17 "Open the payment page" |
| 7   | Matches B1-07: Edit on "Access term" focuses its first option; a removed end date leaves no field for its old error                              | Kept as drawn                                                                                                                                                    |

## 5 · Carried forward, not approved (owner items)

Unchanged from 1A / 1B: DEV-21 … DEV-30 (DEV-26 no longer observed), the 21 Package-1B provisional
wordings, PC-31 / PC-32, P1-22, the B1-05 / B8-03 wording conflict and its scan exception, OD-B7-13,
VR / MR wording and preview assets, the Monthly smaller-scope default, the Institute Admin count
semantics, SA-03's unavailable wording, browser persistence (TE-6), the visual runner (VD-18) and
non-Chromium browsers.

New with Package 1C:

1. TE-8 mechanism on the Package-1C pages (§2) — acknowledgement.
2. ADR-0009's two readings: tickets bound to the user session that sent the request; HTTP 200 with a
   client-drawn not-found page for `/requests/…`.
3. DEV-31, DEV-32, DEV-33 (owner review).
4. SA-03 (Package 1A) shows the route choice for a new institution's first request — reachable since
   1C creates one; its hint is spaced without B1-11's `margin:-4px 0 8px` (the board context class
   now exists; SA-03 was not changed in 1C).
5. SA-03 is addressed by the reference (`/admin/requests/REQ-0042`, Package 1A) — for the owner,
   unchanged. (Its decision page no longer carries the requester's ticket: fixed after the review.)
6. The requester sees the time of every event (DEV-32); whether some events are written with a date
   only is the owner's choice.
7. A confirmed payment on an existing institution's request (more licences, renewal) reads "Access
   active" on PU-10 while OD-B3-09 keeps its plan unchanged; reachable once IA-17's "Open the payment
   page" is built — the words for that case wait for OD-B3-09.

Open and untouched: ND-07, T-01 / R01, T-03, T-05 / R06, P1-04, OD-B3-09, D7.

## 6 · Dependencies for Package 1D (not started)

1D builds on: the request records and statuses PU-10 now shows (approved, payment, active); the
institution and plan the TE-4 confirmation creates for a new external institution (ACC-0107); the
Institute Admin path of ADR-0009 (an Institute Admin reads its institution's requests at their
address); SA-02 / SA-03 from 1A. Nothing of 1D's screens, routes or services was added.
