# Academic Reviewer · Design V3 Refined B · FINAL — OWNER APPROVED

Foundation `XR-V3-RB-1.0` · role `RV` (Academic Reviewer) · **owned designed IDs: 6, all designed and refined** (RV-01 to RV-06) · RV-07 excluded and not designed (existing decision).
Sample world: Thursday 27 August 2026 · Prof. A. Menon, Academic Reviewer · scope ME ZG523 · MEL ZG512 · CHE ZG513.

**Status: FINAL — OWNER APPROVED, 21 October 2026.** This package and the screenshot archive beside it are the approved export.

## Status

| Level | State | What it means here |
| --- | --- | --- |
| DESIGN COMPLETE | **Yes** | All 6 owned IDs and every state in one design: 42 subviews, 30 REDESIGNED and 12 REVIEWED AND UNCHANGED, none pending (`COVERAGE.md`). |
| CONNECTED PREVIEW COMPLETE | **Yes, inside the role** | One live root (`project/RV.dc.html`) holds every view. A decision taken there persists while you move between Overview, Review queue, Reviewed by me and the detail pages. |
| OWNER VISUAL ACCEPTANCE | **ACCEPTED 21 Oct 2026** | Recorded in `ROLE-STATUS.md` / `ROLE-STATUS.json` with the owner's own words. |
| ASSEMBLY PENDING | **Shared Surfaces, and the React app** | Account menu, Help & support, report a problem, sign-out/sign-in and the refusal wording are *borrowed* renderings of the shared (XS) contract. React integration is Claude Code's later job and has not been started. |

## Correction applied after acceptance

Internal record IDs (SUB-…, UPD-… and any REQ-/ACC-style identifier) no longer appear in reviewer-facing labels on any of the six screens — not in the queue rows, Reviewed by me rows, the identity card, the breadcrumb (which now names the experiment), dialogs or browser titles. They remain in the records, the route proposals, the search index and the audit trail, so navigation and search by ID still work. Experiment names, course codes and names, vendor and sender names, revisions, versions and format labels are unchanged.

Flagged exceptions, each outside the six reviewer screens or not an internal platform ID: the `Main` and `Coverage` boards name records because they are integration documentation; Help & support shows a support reference (SUP-0214) the reviewer needs in order to follow up; a VR delivery card shows the vendor's build name (NSS-CW-VR-1.0). Say the word and the support reference can go too.

## This design supersedes

| Earlier version | Date | State |
| --- | --- | --- |
| The completed role (canvas https://claude.ai/artifact/DQmYyqbQPEFJ6NKqeZUJmJ) | 18 Oct 2026 | preserved unchanged; superseded |
| Visual refinement checkpoint 1, four anchor screens (canvas https://claude.ai/artifact/GDmjHxHhFFYhdvw1n2pEKd) | 19 Oct 2026 | preserved unchanged; reviewed, not approved; superseded |

Integrate this design only. Do not mix in layouts from the earlier versions.

## Open it

- **Published canvas** (private to the owner until shared from its Share menu): https://claude.ai/artifact/UoN1uXrBjqxqNtKTXLb3rF
- **Live role entry:** the board *RV-01 Overview · 1440 · live role preview* = `project/RV.dc.html`. Press Play. Phone version: `project/RV-375.dc.html`.
- **Index:** `project/Main.dc.html` links to every board, grouped by screen ID; `project/Coverage.dc.html` is the coverage register; `project/Checks.dc.html` the evidence.
- **Loading this folder into a Claude Design canvas:** upload `project/` as is. `canvas.json` lists all 65 boards. `support.js` is supplied by the design host at runtime and is deliberately not included. Never ship it in the React app.

## Five-minute review path (covers every sidebar destination)

1. **Overview** → *Start review* on Flash Distillation, the item waiting longest. Choose *Return to vendor*, press it with no reason → the error summary takes focus. Add a reason, tick a field reference, press *Return to vendor* → outcome. *Back to the review queue* → 3 items, rail count 3.
2. **Review queue** → *Conduction Through a Composite Wall* (revision 2): what changed, your earlier reason, the outcomes, *View package details* on the VR card. *Approve* → the dialog says approving does not publish → *Approve*. **Reviewed by me** lists it first, "With the Content Manager · not published".
3. **Review queue** → *Updates* tab → *Distillation Column · 1.2 → 1.3*: why, live against proposed, the live experiment. *Approve update* → with the Super Admin, live 1.2 unchanged.
4. **Reviewed by me** → *Transient Cooling* → the read-only decided page (RV-06): your decision and where it stands, no decision controls.
5. **Account menu (AM)** → *Help & support* → *Report a problem* → *Send report* empty (error) → filled (reference SUP-0214) → *Sign out* → *Sign in*.

Refusals (outside scope, not available, stale version, already decided) and list states (loading, failed, no match, nothing waiting) have their own boards; see the canvas rows or `ROLE-STATUS.json`.

## Coverage

| ID | Screen | Type | Route proposal | In the live preview | Boards |
| --- | --- | --- | --- | --- | --- |
| RV-01 | Overview | page | `/reviewer` | rail *Overview* (start view) | RV, RV-375, RV01-1024/768/375, RV01-calm |
| RV-02 | Review queue | page | `/reviewer/queue` | rail *Review queue* | RV02, RV02-1024/768/375, -filtered, -nomatch, -loading, -failed, -empty, RV-scope-withdrawn |
| RV-03 | Review a submission | page | `/reviewer/submissions/[submissionId]` | any submission row | RV03, RV03-1024/768/375, -outcomes, -outcomes-375, -recheck, -editing-375, -return-errors, -return-filled, -confirm, -approved, -returned |
| RV-04 | Review an update | page | `/reviewer/updates/[updateId]` | the update row | RV04, RV04-1024/768/375, -return-errors, -confirm, -approved, -returned, -stale-armed, -stale |
| RV-05 | Reviewed by me | page | `/reviewer/reviewed` | rail *Reviewed by me* | RV05, RV05-1024/768/375, -updates, -nomatch, -loading, -failed, -empty |
| RV-06 | Decided item (read-only) | state | same detail route, decided | any row in Reviewed by me, or Recently decided | RV06, RV06-375, -returned, -update, -elsewhere |
| Shared (XS, borrowed) | account menu, Help & support, report, signed out, refusals | — | — | top bar, rail foot | RV-account, RV-drawer-375, RV-help, RV-report-375, RV-report-sent, RV-signedout, RV-scope, RV-scope-375, RV-unavailable |

Sidebar destinations: **Overview · Review queue (with waiting count) · Reviewed by me · Help & support**, plus the account menu (Help & support, Sign out). RV-07 (courses in scope, learning outcomes, reviewer settings) is not a destination: scope is a card on the Overview, outcomes are edited on RV-03.

## What is in this package

| Path | Contents |
| --- | --- |
| `START-HERE.md` | this page |
| `ROLE-STATUS.md`, `ROLE-STATUS.json` | status and owner acceptance, the post-acceptance ID correction, every owned ID with its boards, states, actions and evidence, open decisions and the two data discrepancies |
| `COVERAGE.md`, `COVERAGE.json` | the coverage register: every owned screen and subview, REDESIGNED or REVIEWED AND UNCHANGED |
| `project/` | the complete canvas: `canvas.json`, `Main.dc.html`, `Coverage.dc.html`, `Checks.dc.html`, the live root `RV.dc.html`, 61 state/width boards, the three shared base styles (byte-identical) and `rv.css` |
| `FOUNDATION-LOCK.json` | foundation ID, base-file hashes and their verification, every local file with its hash |
| `COMPONENT-EXTENSIONS.md` | reused kit patterns and the `rv-` extensions, marking what the refinement added |
| `LINK-MAP.json` | every control: source, destination, classification, tested status |
| `SCENARIOS.json` | fixture snapshot of the sample world (unchanged from the completed role), provenance, illustrative additions, handoff scenarios, the two discrepancies to verify |
| `HANDOFF.md` | states, allowed actions, service needs, open policies, what changed, integration notes |
| `CHECKS.md` | what was rendered, logic-tested, keyboard-tested and audited, at which widths, and what was not |
| `checks/` | the harness and the results of the re-verification run |

Screenshots of all 65 boards are in the separate archive `XR-V3-RV-Academic-Reviewer-FINAL-screenshots.zip`.

## Limits

- No backend and no real sign-in. All data is the illustrative sample world in `SCENARIOS.json`, not application data.
- Effects outside the role (the vendor sees a return, the Content Manager publishes, the Super Admin releases) are documented handoffs (`HANDOFF.md`, `SCENARIOS.json`), not live changes in other canvases.
- The official WILP logo has not been supplied; the reserved slot shows "Official WILP logo".
- Checked in headless Chromium with the design host's own runtime. Not viewed inside the claude.ai canvas by the designer (see `CHECKS.md`).
