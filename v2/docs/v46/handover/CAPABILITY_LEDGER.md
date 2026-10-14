# Phase-0 capability ledger — the 147 screen ids (WP-0.16)

Snapshot at the WP-0.16 handover of branch `v2/frontend-v46` (14 Oct 2026). One row per id of the frozen
screen register (`design/handoff-v46/canvas-v46/project/handoff/screens.json`), reconciled with the
route register (`docs/v46/routes.json`, Appendix A), the build-phase map in code
(`packages/contracts/src/draft/ledger/screens.ts`: `SCREEN_PHASE`, `NOT_DESIGNED_SCREENS`, held by
`ledger.test.ts`) and the Phase-0 route manifest (`apps/web/src/nav/routes.ts`, held equal to the page
files by the route-manifest test). **Implemented** means a product screen built in this branch and
reachable in the product app; specimen-harness pages (`apps/specimens`), test-hook seams and the
canvas boards are never counted. No screen is invented: every id below is in the frozen register.

## Counts

| | Count | Ids |
|---|---|---|
| Register ids | 147 | screens.json |
| Designed | 123 | `designed: true` |
| Implemented in Phase 0 | 5 | PU-15, XS-05, XS-06, XS-07, XS-08 |
| Designed, scheduled for Phases 1–6 | 118 | B8-06 build order (`SCREEN_PHASE`) |
| Excluded — not designed by decision | 24 | PU-11, PU-16, XS-02, ST-20, FA-13, FA-23, FA-24, IA-12, IA-21, IA-22, VE-10, VE-11, VE-12, VE-14, VE-15, RV-07, CM-10, SA-04, SA-05, SA-08, SA-09, SA-23, SA-24, SA-25 |

| Phase | Designed screens first built | Ids |
|---|---|---|
| Phase 0 | 5 | PU-15, XS-05, XS-06, XS-07, XS-08 |
| Phase 1 | 21 | PU-01, PU-02, PU-03, PU-04, PU-05, PU-06, PU-07, PU-08, PU-09, PU-10, PU-12, PU-13, PU-14, XS-01, XS-03, XS-04, SA-01, SA-02, SA-03, SA-06, SA-07 |
| Phase 2 | 21 | ST-01, ST-02, ST-03, ST-04, ST-05, ST-19, IA-01, IA-02, IA-03, IA-04, IA-05, IA-06, IA-07, IA-08, IA-09, IA-10, IA-11, IA-13, IA-14, IA-15, IA-16 |
| Phase 3 | 15 | ST-06, ST-07, ST-08, ST-09, ST-10, ST-15, ST-16, ST-17, ST-18, IA-17, IA-18, IA-19, IA-20, SA-18, SA-19 |
| Phase 4 | 25 | ST-11, ST-12, ST-13, ST-14, FA-01, FA-02, FA-03, FA-04, FA-05, FA-06, FA-07, FA-08, FA-09, FA-10, FA-11, FA-12, FA-14, FA-15, FA-16, FA-17, FA-18, FA-19, FA-20, FA-21, FA-22 |
| Phase 5 | 21 | VE-01, VE-02, VE-03, VE-04, VE-05, VE-06, VE-07, VE-08, VE-09, VE-13, RV-01, RV-02, RV-03, RV-05, RV-06, CM-01, CM-02, CM-03, CM-04, CM-05, CM-09 |
| Phase 6 | 15 | RV-04, CM-06, CM-07, CM-08, SA-10, SA-11, SA-12, SA-13, SA-14, SA-15, SA-16, SA-17, SA-20, SA-21, SA-22 |

Built in two phases (listed at the first): SA-01 (Phase 1 requests group, Phase 6 full overview) and
CM-05 (Phase 5, detail completed in Phase 6). Phase 7 (consolidation) builds no new screen.

| Surface | Register ids | Designed | Implemented in Phase 0 | Excluded |
|---|---|---|---|---|
| Public | 16 | 14 | 1 | 2 |
| Entry & shared | 8 | 7 | 4 | 1 |
| Student | 20 | 19 | 0 | 1 |
| Faculty | 24 | 21 | 0 | 3 |
| Institute Admin | 22 | 19 | 0 | 3 |
| Vendor | 15 | 10 | 0 | 5 |
| Academic Reviewer | 7 | 6 | 0 | 1 |
| Content Manager | 10 | 9 | 0 | 1 |
| Super Admin | 25 | 18 | 0 | 7 |
| **Total** | **147** | **123** | **5** | **24** |

## Cross-checks (all computed from the sources named above)

| Check | Result |
|---|---|
| 147 register ids | PASS (147) |
| 123 designed / 24 excluded | PASS (123/24) |
| 5 Phase-0 / 118 later | PASS (5/118) |
| route register has the same 147 ids | PASS |
| route register EXCLUDED rows = the 24 not designed | PASS |
| route register designed flags agree | PASS |
| every designed id has a build phase; no excluded id has one | PASS |
| NOT_DESIGNED_SCREENS = the 24 excluded | PASS |
| SCREEN_PHASE has exactly 123 ids | PASS (123) |
| pages exist only for Phase-0 screens | PASS (XS-07) |
| workspace navigation knows only designed ids | PASS |
| 35 Phase-0 page files | PASS (35) |
| Phase-0 implementation rows = Phase-0 ids | PASS |

## How to read the decision column

It lists every decision reference that names the screen or one of its boards in the frozen decision
sources — Appendix G §D (DV-, P`n`-, SC-, OD-, HB- rows; all PROVISIONAL or UNRESOLVED in the
register), the route register's owner decisions (O-01…O-12), and `handoff/open-decisions.json`
(batch decisions OD-B`n`-`nn`, register T-`nn`) — plus the WP-0.16 handover items written out in
words. A reference here is **not** a decision: unless `docs/decisions/README.md` records an owner
decision, it is open, and a passing interim implementation does not decide it. Phase-level gates
(Appendix F §10.3) apply to every screen of their phase and are listed in
`OWNER_DECISIONS_HANDOVER.md`, not repeated per row.

## Ledger

| Id | Screen | Surface / role | Type | Designed | Implemented | Target phase | Route status | Relevant open decisions |
|---|---|---|---|---|---|---|---|---|
| PU-01 | Landing | Public | page | Designed | Not implemented (scheduled) | Phase 1 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/` | O-09, O-10, OD-B7-13, P1-16 |
| PU-02 | All engineering areas ("View all areas") | Public | page | Designed | Not implemented (scheduled) | Phase 1 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/areas` | — |
| PU-03 | Engineering area | Public | page | Designed | Not implemented (scheduled) | Phase 1 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/areas/[areaId]` | — |
| PU-04 | Catalogue | Public | page | Designed | Not implemented (scheduled) | Phase 1 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/experiments  (+ ?area=&course=&format=&q=&sort=&view= : PROPOSED)` | P1-22 |
| PU-05 | Course | Public | page | Designed | Not implemented (scheduled) | Phase 1 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED (board-forced) `/courses/[courseId]` | — |
| PU-06 | Experiment | Public | page | Designed | Not implemented (scheduled) | Phase 1 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/experiments/[experimentId]  (+ ?format= when arriving from a filtered catalogue : PROPOSED)` | — |
| PU-07 | Your selection | Public | page | Designed | Not implemented (scheduled) | Phase 1 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/selection` | O-03 |
| PU-08 | Request institutional access | Public | step | Designed | Not implemented (scheduled) | Phase 1 | Not routed in Phase 0 (the address resolves to PU-15). Register: PROPOSED `/request-access?step=details (default) \| ?step=review` | O-03, O-08, P1-10 |
| PU-09 | Request sent | Public | step | Designed | Not implemented (scheduled) | Phase 1 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/request-access/sent` | O-08, P1-10 |
| PU-10 | Request status | Public | page | Designed | Not implemented (scheduled) | Phase 1 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/requests/[requestId]` | DV-5, O-02, O-05, P1-02 |
| PU-11 | Reply to an information request | Public | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | P1-05 |
| PU-12 | Payment (external route only) | Public | step | Designed | Not implemented (scheduled) | Phase 1 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/requests/[requestId]/payment` | DV-5, O-02, O-05, P1-02 |
| PU-13 | Access activated | Public | state | Designed | Not implemented (scheduled) | Phase 1 | Not built in Phase 0 (a state, no own route). Register: CONFIRMED `state of /requests/[requestId] (Access active) - no route` | O-05, P1-02 |
| PU-14 | How institutional access works | Public | state | Designed | Not implemented (scheduled) | Phase 1 | Not built in Phase 0 (a state, no own route). Register: CONFIRMED `/#for-institutions (section of PU-01; mini version on PU-06) - no route` | — |
| PU-15 | Not found | Public | page | Designed | Implemented (pages) | Phase 0 | Root `not-found.tsx` (public variant) + 7 workspace `not-found.tsx` + 7 `[...unmatched]` pages (in-shell variant) | O-05, P0-35 (documented dead link: Browse experiments → PU-04), P1-02 |
| PU-16 | About · Contact · Privacy · Terms · Accessibility | Public | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | — |
| XS-01 | Sign in | Entry & shared | page | Designed | Not implemented (scheduled) | Phase 1 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/sign-in` | O-06, O-11, P1-01, P1-17, P1-19 |
| XS-02 | Choose workspace (person with several roles) | Entry & shared | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | P0-10 |
| XS-03 | Signed out / session expired | Entry & shared | page | Designed | Not implemented (scheduled) | Phase 1 | Not routed in Phase 0 (the address resolves to PU-15). Register: PROPOSED `/sign-in?reason=signed-out \| /sign-in?reason=expired&returnTo=<path>  (/signed-out -> redirect)` | O-06, P1-19 |
| XS-04 | First-time activation · Forgot password | Entry & shared | state | Designed | Not implemented (scheduled) | Phase 1 | Not built in Phase 0 (a state, no own route). Register: CONFIRMED `state of /sign-in (disclosure only; no route, no flow)` | P1-19 |
| XS-05 | Account menu: name, role, institution, Help, Sign out | Entry & shared | menu | Designed | Implemented (shell part) | Phase 0 | No own route (designed as a top-bar menu); in the top bar of all 7 workspaces | P0-35 (built-screen-only account menu; ST-18 My device hidden), XS-02 (several roles per person, excluded) |
| XS-06 | Not your workspace | Entry & shared | page | Designed | Implemented (in-place page) | Phase 0 | No own route (ADR-0005): rendered in place at another workspace's address; proposed `/[workspace]/not-allowed` not used | P0-10 (one role per person), P0-35 (Back to Home lands on Help until homes exist) |
| XS-07 | Help & support: report a problem + my reports | Entry & shared | page | Designed | Implemented (pages) | Phase 0 | 21 page routes: `/<base>/help`, `/<base>/help/report`, `/<base>/help/reports/[reportId]` × 7 bases; redirect `/<base>/help/reports` → `/<base>/help` × 7 | O-12 / P2-11 (IA view of institution reports), P0-30 / SUP-04 (reporter reopen), P0-31 (report-title source), P0-34 / SC-29 (problem category) |
| XS-08 | Institution paused / account inactive notice | Entry & shared | state | Designed | Implemented (shell state) | Phase 0 | No own route (designed as a shell banner); shown in the Student, Faculty and Institute Admin shells | D-24 / §8-31 (paused and inactive wording), P1-19, P6-01, §8-33 (paused IA presentation) |
| ST-01 | Home | Student | page | Designed | Not implemented (scheduled) | Phase 2 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/student` | — |
| ST-02 | My courses | Student | page | Designed | Not implemented (scheduled) | Phase 2 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/student/courses` | O-07, P2-06 |
| ST-03 | Course (student view) | Student | page | Designed | Not implemented (scheduled) | Phase 2 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/student/courses/[courseId]` | O-07 |
| ST-04 | All my experiments | Student | tab | Designed | Not implemented (scheduled) | Phase 2 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/student/courses?tab=experiments` | O-07 |
| ST-05 | Experiment (hub: Overview · Resources · Simulation · Assessment · Progress) | Student | page | Designed | Not implemented (scheduled) | Phase 2 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/student/experiments/[experimentId]` | O-01, O-07, P0-20, P2-10 |
| ST-06 | Resources | Student | tab | Designed | Not implemented (scheduled) | Phase 3 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/student/experiments/[experimentId]/resources` | P0-20, P3-03, T-12 (learning-completion trigger) |
| ST-07 | Simulation — choose a format | Student | tab | Designed | Not implemented (scheduled) | Phase 3 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/student/experiments/[experimentId]/simulation` | O-07, P3-03, T-12 (learning-completion trigger) |
| ST-08 | WEB simulation (launch / resume) | Student | page | Designed | Not implemented (scheduled) | Phase 3 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/student/experiments/[experimentId]/simulation/web` | P3-03, T-12 (learning-completion trigger) |
| ST-09 | AR / VR / MR format (setup & progress) | Student | page | Designed | Not implemented (scheduled) | Phase 3 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/student/experiments/[experimentId]/simulation/[format]   ([format] = ar \| vr \| mr, else notFound)` | — |
| ST-10 | Progress for this experiment | Student | tab | Designed | Not implemented (scheduled) | Phase 3 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/student/experiments/[experimentId]/progress` | P0-20, P3-03 |
| ST-11 | Assessments | Student | page | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/student/assessments  (+ optional ?show=to-do\|submitted\|results)` | O-01, OD-B4-15, P4-02 |
| ST-12 | Assessment — before you start | Student | page | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/student/assessments/[assessmentId]` | O-01, OD-B4-15, P4-02 |
| ST-13 | Assessment attempt | Student | step | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/student/assessments/[assessmentId]/attempt` | P4-07 |
| ST-14 | Result | Student | page | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/student/assessments/[assessmentId]/result` | O-04, P4-06 |
| ST-15 | Progress (all experiments) | Student | page | Designed | Not implemented (scheduled) | Phase 3 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/student/progress` | O-07, P2-06, P3-03, T-12 (learning-completion trigger) |
| ST-16 | Format feedback | Student | step | Designed | Not implemented (scheduled) | Phase 3 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/student/experiments/[experimentId]/feedback/[format]   ([format] = web \| ar \| vr \| mr)` | P3-05 |
| ST-17 | Feedback sent (confirmation, read-only) | Student | state | Designed | Not implemented (scheduled) | Phase 3 | Not built in Phase 0 (a state, no own route). Register: CONFIRMED `state of /student/experiments/[experimentId]/feedback/[format] - no route` | P3-05 |
| ST-18 | My device (AR/VR/MR holders only) | Student | page | Designed | Not implemented (scheduled) | Phase 3 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/student/device` | O-08, P0-19, P3-06 |
| ST-19 | Experiment not available (refusal page) | Student | state | Designed | Not implemented (scheduled) | Phase 2 | Not built in Phase 0 (a state, no own route). Register: CONFIRMED `state rendered by the experiment record guard (layout) for the hub and every child - no route, no notFound()` | DEV-16 (amber paused-message icon, owner-deferred to this screen), O-07 (record guard for ended/withdrawn access), OD-B2-01, P0-20, P2-06, P2-10 |
| ST-20 | Signed-in catalogue | Student | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | P2-16 |
| FA-01 | Overview | Faculty | page | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/faculty` | — |
| FA-02 | My courses | Faculty | page | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/faculty/courses` | P4-02, P4-05 |
| FA-03 | Course (teaching view) | Faculty | page | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/faculty/courses/[courseId]` | P4-02, P4-05 |
| FA-04 | Experiments | Faculty | tab | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/faculty/courses?tab=experiments` | P4-02, P4-05 |
| FA-05 | Experiment (teaching view) | Faculty | page | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/faculty/experiments/[experimentId]` | — |
| FA-06 | Assessments | Faculty | page | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/faculty/assessments` | P4-05 |
| FA-07 | Create assessment (guided) | Faculty | step | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: PROPOSED `/faculty/assessments/new?step=experiment\|rules\|questions\|preview` | P4-05 |
| FA-08 | Assessment · Summary | Faculty | tab | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/faculty/assessments/[assessmentId]` | P4-02, P4-05 |
| FA-09 | Assessment · Questions | Faculty | tab | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/faculty/assessments/[assessmentId]/questions` | P4-02, P4-05 |
| FA-10 | Assessment · Settings | Faculty | tab | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/faculty/assessments/[assessmentId]/settings` | P4-06 |
| FA-11 | Assessment · Preview | Faculty | tab | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/faculty/assessments/[assessmentId]/preview  (+ optional ?view=key)` | P4-06 |
| FA-12 | Assessment · Submissions | Faculty | tab | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/faculty/assessments/[assessmentId]/submissions  (+ optional ?filter=)` | O-04, P4-06 |
| FA-13 | Make available to students | Faculty | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | — |
| FA-14 | Question bank (tabs: Questions · Drafts to review) | Faculty | page | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/faculty/question-bank  (+ ?tab=drafts : PROPOSED)` | P0-14 |
| FA-15 | Add / edit question | Faculty | page | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/faculty/question-bank/new  and  /faculty/question-bank/[questionId]` | P0-14, P4-03 |
| FA-16 | Draft questions with assistance | Faculty | step | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/faculty/question-bank/draft` | — |
| FA-17 | Import questions (CSV / XLSX) | Faculty | step | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/faculty/question-bank/import` | — |
| FA-18 | Marking queue | Faculty | page | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/faculty/marking` | OD-B4-15, P4-01, P4-04 |
| FA-19 | Mark a submission | Faculty | page | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/faculty/marking/[attemptId]` | OD-B4-15, P4-01, P4-04 |
| FA-20 | Students (progress + follow-up) | Faculty | page | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/faculty/students` | — |
| FA-21 | Student detail (per experiment) | Faculty | page | Designed | Not implemented (scheduled) | Phase 4 | Not routed in Phase 0 (the address resolves to PU-15). Register: PROPOSED `/faculty/students/[studentId]?experimentId=[experimentId]` | — |
| FA-22 | Export progress (CSV) | Faculty | action | Designed | Not implemented (scheduled) | Phase 4 | Not built in Phase 0 (an action, no own route). Register: CONFIRMED `action on FA-12 / FA-20 (client CSV of the rows on screen) - no route` | P4-06 |
| FA-23 | Reports page | Faculty | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | — |
| FA-24 | Faculty settings | Faculty | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | — |
| IA-01 | Overview | Institute Admin | page | Designed | Not implemented (scheduled) | Phase 2 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/institute` | DEV-17 (Institute Admin Requests count semantics, not decided), O-11, O-12, P1-08, P2-02, P2-07, P2-11, P2-12, P3-07, SACC-14 (withdrawn-access visibility) |
| IA-02 | Content access | Institute Admin | page | Designed | Not implemented (scheduled) | Phase 2 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/institute/content-access` | P1-08, P2-03, P2-12, P2-13 |
| IA-03 | Access plan / course detail | Institute Admin | page | Designed | Not implemented (scheduled) | Phase 2 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/institute/content-access/plans/[planId]` | P2-01, P2-09 |
| IA-04 | Student access | Institute Admin | page | Designed | Not implemented (scheduled) | Phase 2 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/institute/student-access  (+ ?q=&status=&via=&withdrawn= : PROPOSED)` | O-12, P1-08, P2-02, P2-05, P2-09, P2-11, P2-12, SACC-14 (withdrawn-access visibility) |
| IA-05 | Give students access (guided) | Institute Admin | step | Designed | Not implemented (scheduled) | Phase 2 | Not routed in Phase 0 (the address resolves to PU-15). Register: PROPOSED `/institute/student-access/give?step=experiments\|students\|review  (+ ?student= / ?group= pre-fill)` | P0-25, P1-08, P2-12 |
| IA-06 | Students | Institute Admin | tab | Designed | Not implemented (scheduled) | Phase 2 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/institute/people  (default tab; ?tab=students accepted and normalised to the bare URL)` | P2-07 |
| IA-07 | Student record | Institute Admin | page | Designed | Not implemented (scheduled) | Phase 2 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/institute/people/students/[studentId]` | O-12, P1-08, P2-02, P2-11, P2-12 |
| IA-08 | Faculty | Institute Admin | tab | Designed | Not implemented (scheduled) | Phase 2 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/institute/people?tab=faculty` | — |
| IA-09 | Faculty record (incl. courses taught) | Institute Admin | page | Designed | Not implemented (scheduled) | Phase 2 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/institute/people/faculty/[facultyId]` | — |
| IA-10 | Add a student / Add a faculty member | Institute Admin | step | Designed | Not implemented (scheduled) | Phase 2 | Not routed in Phase 0 (the address resolves to PU-15). Register: PROPOSED `/institute/people/add?type=student\|faculty` | P0-25, P2-05 |
| IA-11 | Import students (CSV) | Institute Admin | step | Designed | Not implemented (scheduled) | Phase 2 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/institute/people/import` | P0-25 |
| IA-12 | Invitations / account activation | Institute Admin | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | — |
| IA-13 | Groups | Institute Admin | tab | Designed | Not implemented (scheduled) | Phase 2 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/institute/people?tab=groups` | O-12, P0-14, P1-08, P2-02, P2-03, P2-05, P2-11, P2-12, P2-13 |
| IA-14 | Group (create · members · access) | Institute Admin | page | Designed | Not implemented (scheduled) | Phase 2 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED (board-forced) `/institute/people/groups/[groupId]` | O-12, OD-B2-02, P0-14, P1-08, P2-02, P2-03, P2-05, P2-11, P2-12, P2-13 |
| IA-15 | Faculty courses (who teaches what) | Institute Admin | tab | Designed | Not implemented (scheduled) | Phase 2 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/institute/people?tab=faculty-courses  (+ ?faculty= pre-select)` | P0-14, P2-07 |
| IA-16 | Course codes (institution code + optional semester) | Institute Admin | tab | Designed | Not implemented (scheduled) | Phase 2 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/institute/content-access?tab=course-codes` | P2-01 |
| IA-17 | Requests to BITS (renewal · additional licences) | Institute Admin | page | Designed | Not implemented (scheduled) | Phase 3 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/institute/requests  (+ request detail /institute/requests/[requestId] : PROPOSED, no screen ID)` | DV-5, O-02, O-05, O-11, OD-B3-15, P0-25, P1-02, P1-11, P2-07, P3-04, P3-07 |
| IA-18 | Device requests | Institute Admin | tab | Designed | Not implemented (scheduled) | Phase 3 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/institute/requests?tab=devices` | O-11, P1-11, P3-07 |
| IA-19 | Device request — review & forward | Institute Admin | page | Designed | Not implemented (scheduled) | Phase 3 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/institute/requests/devices/[transferId]` | P1-11 |
| IA-20 | Usage | Institute Admin | page | Designed | Not implemented (scheduled) | Phase 3 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/institute/usage  (+ ?view=course : PROPOSED)` | P1-05, P3-04 |
| IA-21 | Reports page | Institute Admin | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | — |
| IA-22 | Institution settings (incl. institution sign-in / SSO) | Institute Admin | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | — |
| VE-01 | Overview | Vendor | page | Designed | Not implemented (scheduled) | Phase 5 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/vendor` | P5-04, P5-10 |
| VE-02 | My experiments (all, any status) | Vendor | page | Designed | Not implemented (scheduled) | Phase 5 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/vendor/experiments  (+ ?q=&status=&recent=1)` | — |
| VE-03 | Create experiment · Course & description | Vendor | step | Designed | Not implemented (scheduled) | Phase 5 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED (board-forced) `/vendor/experiments/new?step=course  -> after first Save draft: router.replace to /vendor/experiments/[submiss…` | P5-02 |
| VE-04 | Create experiment · Formats & delivery | Vendor | step | Designed | Not implemented (scheduled) | Phase 5 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED (board-forced) `/vendor/experiments/[submissionId]/edit?step=formats  ·  unsaved: /vendor/experiments/new?step=formats` | — |
| VE-05 | Create experiment · Preview & documents | Vendor | step | Designed | Not implemented (scheduled) | Phase 5 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED (board-forced) `/vendor/experiments/[submissionId]/edit?step=preview  ·  unsaved: /vendor/experiments/new?step=preview` | P5-01 |
| VE-06 | Check & submit | Vendor | step | Designed | Not implemented (scheduled) | Phase 5 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED (board-forced) `/vendor/experiments/[submissionId]/edit?step=submit  ·  unsaved: /vendor/experiments/new?step=submit` | P5-01 |
| VE-07 | Experiment record (status, details, timeline) | Vendor | page | Designed | Not implemented (scheduled) | Phase 5 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/vendor/experiments/[submissionId]` | P5-01 |
| VE-08 | Revise & resubmit (after a return) | Vendor | step | Designed | Not implemented (scheduled) | Phase 5 | Not routed in Phase 0 (the address resolves to PU-15). Register: PROPOSED `/vendor/experiments/[submissionId]/revise?step=course\|formats\|preview\|submit` | P5-01 |
| VE-09 | Edit draft | Vendor | step | Designed | Not implemented (scheduled) | Phase 5 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/vendor/experiments/[submissionId]/edit  (+ ?step=course\|formats\|preview\|submit : PROPOSED query; default =…` | — |
| VE-10 | Propose an update (corrected version) | Vendor | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | — |
| VE-11 | Updates | Vendor | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | — |
| VE-12 | Update detail | Vendor | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | — |
| VE-13 | Submission & version history | Vendor | tab | Designed | Not implemented (scheduled) | Phase 5 | Not built in Phase 0 (a tab, no own route). Register: CONFIRMED (board-forced) `no tab route: section #history of /vendor/experiments/[submissionId]  +  filter /vendor/experiments?recent=1` | P5-01 |
| VE-14 | Add a format to a published experiment | Vendor | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | — |
| VE-15 | Experiment packages · Technical assets · Contributor settings | Vendor | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | — |
| RV-01 | Overview | Academic Reviewer | page | Designed | Not implemented (scheduled) | Phase 5 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/reviewer` | P5-04, P5-05 |
| RV-02 | Review queue | Academic Reviewer | page | Designed | Not implemented (scheduled) | Phase 5 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/reviewer/queue  (+ ?q=&type=new\|update\|recheck&course=)` | OD-B6-12, OD-B7-08, P1-12 |
| RV-03 | Review a submission | Academic Reviewer | page | Designed | Not implemented (scheduled) | Phase 5 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/reviewer/submissions/[submissionId]` | O-09, OD-B6-12, OD-B7-08, P1-12 |
| RV-04 | Review an update | Academic Reviewer | page | Designed | Not implemented (scheduled) | Phase 6 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/reviewer/updates/[updateId]` | P1-08, P6-03 |
| RV-05 | Reviewed by me | Academic Reviewer | page | Designed | Not implemented (scheduled) | Phase 5 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/reviewer/reviewed  (+ optional ?show=)` | — |
| RV-06 | Decided item (read-only) | Academic Reviewer | state | Designed | Not implemented (scheduled) | Phase 5 | Not built in Phase 0 (a state, no own route). Register: CONFIRMED `state of /reviewer/submissions/[submissionId] (decided, read-only) - no route` | O-09, OD-B6-12, OD-B7-08, P1-12 |
| RV-07 | Courses in scope · Learning outcomes · Reviewer settings | Academic Reviewer | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | — |
| CM-01 | Overview | Content Manager | page | Designed | Not implemented (scheduled) | Phase 5 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/content-manager` | — |
| CM-02 | Ready to publish | Content Manager | page | Designed | Not implemented (scheduled) | Phase 5 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/content-manager/ready` | O-09, OD-B6-12, OD-B7-08, P1-12, P6-03 |
| CM-03 | Publication decision | Content Manager | page | Designed | Not implemented (scheduled) | Phase 5 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/content-manager/decisions/[submissionId]` | OD-B6-12, OD-B7-08, P1-12 |
| CM-04 | Content library (all statuses incl. published) | Content Manager | page | Designed | Not implemented (scheduled) | Phase 5 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/content-manager/library  (+ ?tab=ready\|review\|vendor\|published&q= : PROPOSED)` | P6-03 |
| CM-05 | Published experiment | Content Manager | page | Designed | Not implemented (scheduled) | Phase 5 + Phase 6 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/content-manager/published/[experimentId]` | P1-08 |
| CM-06 | Edit catalogue details → opens a correction (UPD) draft pre-filled with the live fields (M-1) | Content Manager | step | Designed | Not implemented (scheduled) | Phase 6 | Not built in Phase 0 (a step, no own route). Register: CONFIRMED `entry action on CM-05 -> creates / joins the UPD -> /content-manager/updates/[updateId] (focus Summary)` | — |
| CM-07 | Edit a delivery link (with reason) → opens a correction (UPD) draft pre-filled with the live delivery details (M-1) | Content Manager | step | Designed | Not implemented (scheduled) | Phase 6 | Not built in Phase 0 (a step, no own route). Register: CONFIRMED `entry action on CM-05 -> creates / joins the UPD -> /content-manager/updates/[updateId] (focus WEB · web link)` | — |
| CM-08 | Corrections / updates I raised | Content Manager | page | Designed | Not implemented (scheduled) | Phase 6 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/content-manager/updates  and  /content-manager/updates/[updateId]` | OD-B6-14, P1-08, P1-12, P6-02 |
| CM-09 | Platform course codes | Content Manager | page | Designed | Not implemented (scheduled) | Phase 5 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/content-manager/course-codes` | P1-12, P5-07 |
| CM-10 | Academic groupings · Governance settings | Content Manager | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | — |
| SA-01 | Overview | Super Admin | page | Designed | Not implemented (scheduled) | Phase 1 + Phase 6 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/admin` | O-09 |
| SA-02 | Requests | Super Admin | page | Designed | Not implemented (scheduled) | Phase 1 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/admin/requests  (+ ?q=&status=&type=&route=&sort= : PROPOSED)` | P0-11, P1-05, P1-07, P1-10, P1-11, P1-12, P7-02 |
| SA-03 | Request decision | Super Admin | page | Designed | Not implemented (scheduled) | Phase 1 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/admin/requests/[requestId]  (#decision anchor)` | P0-11, P0-12, P1-04, P1-05, P1-07, P1-10, P1-11, P1-12, P7-02 |
| SA-04 | Decline a request | Super Admin | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | — |
| SA-05 | Record payment / activate manually | Super Admin | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | P1-06 |
| SA-06 | Institutions | Super Admin | page | Designed | Not implemented (scheduled) | Phase 1 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/admin/institutions  (+ ?status=&q= : PROPOSED)` | P1-12, P1-14, P6-05 |
| SA-07 | Institution detail | Super Admin | page | Designed | Not implemented (scheduled) | Phase 1 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/admin/institutions/[institutionId]` | P1-12, P1-14, P6-01, P6-05, SA-07 student list lacks `rev` for overrideStudentStatus (contract gap) |
| SA-08 | Create an institution directly | Super Admin | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | — |
| SA-09 | Content allocation page | Super Admin | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | P1-07 |
| SA-10 | Content updates (awaiting release) | Super Admin | tab | Designed | Not implemented (scheduled) | Phase 6 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/admin/content/updates  (+ ?show=waiting\|on-hold\|released)` | P1-08 |
| SA-11 | Release or hold an update | Super Admin | page | Designed | Not implemented (scheduled) | Phase 6 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/admin/content/updates/[updateId]` | O-09, P1-08 |
| SA-12 | All content & stuck items | Super Admin | tab | Designed | Not implemented (scheduled) | Phase 6 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/admin/content/all  (+ ?show=&q=)` | P1-12 |
| SA-13 | Content record (read-only for published content; status override for stuck, non-published records — M-1) | Super Admin | page | Designed | Not implemented (scheduled) | Phase 6 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/admin/content/records/[recordId]` | P0-30, P1-12, P6-05 |
| SA-14 | Academic structure (areas → courses) | Super Admin | page | Designed | Not implemented (scheduled) | Phase 6 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/admin/structure` | — |
| SA-15 | Area / course record | Super Admin | page | Designed | Not implemented (scheduled) | Phase 6 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/admin/structure/areas/[areaId]  and  /admin/structure/courses/[courseId]` | — |
| SA-16 | Platform roles (Vendors · Reviewers · Content Managers) | Super Admin | page | Designed | Not implemented (scheduled) | Phase 6 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/admin/roles (Vendors, default) \| ?tab=reviewers \| ?tab=content-managers  (?tab=vendors accepted and normali…` | P1-12, P5-02, P5-06 |
| SA-17 | Role holder (assign / withdraw scope) | Super Admin | page | Designed | Not implemented (scheduled) | Phase 6 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/admin/roles/[holderId]` | P1-12, P5-02, P5-06 |
| SA-18 | Device transfers | Super Admin | tab | Designed | Not implemented (scheduled) | Phase 3 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/admin/operations/device-transfers  (+ ?show=forwarded\|with-institution\|approved)` | OD-B3-15, P0-30, P6-05 |
| SA-19 | Device transfer decision | Super Admin | page | Designed | Not implemented (scheduled) | Phase 3 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/admin/operations/device-transfers/[transferId]` | OD-B3-15, P0-30, P6-05 |
| SA-20 | Support reports | Super Admin | tab | Designed | Not implemented (scheduled) | Phase 6 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/admin/operations/support  (+ ?show=open\|resolved\|all)` | P0-30, P6-05 |
| SA-21 | Support report | Super Admin | page | Designed | Not implemented (scheduled) | Phase 6 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/admin/operations/support/[reportId]` | O-12, P0-30, P6-05 |
| SA-22 | Access ending & renewals | Super Admin | tab | Designed | Not implemented (scheduled) | Phase 6 | Not routed in Phase 0 (the address resolves to PU-15). Register: CONFIRMED `/admin/operations/access-ending` | P0-30, P6-05 |
| SA-23 | Platform reports | Super Admin | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | — |
| SA-24 | Platform settings | Super Admin | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | — |
| SA-25 | Student feedback views / analytics | Super Admin | — | Not designed | Never built (excluded by decision) | — (excluded) | Never routed, linked or shown (Appendix A §2) | — |
