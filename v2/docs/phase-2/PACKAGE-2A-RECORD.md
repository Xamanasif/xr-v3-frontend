# Phase 2 — Package 2A record (campus distribution, first batch)

|                   |                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Authorisation     | Owner, 15 Oct 2026 — "Phase 2A Authorization, Accelerated Functional Frontend Implementation" (8–12 ids, one coherent batch)          |
| Base              | `a647a80` (Package 1E) on `v2/frontend-v46`; safety bundle `~/Downloads/XR-frontend-v46-a647a80.bundle` (+ `.sha256`, restore-tested) |
| Design authority  | `design/handoff-v46/` (frozen, 178/178), boards B2-01 … B2-07, B2-10 … B2-13                                                          |
| Verdict (summary) | CONDITIONAL PASS (§8)                                                                                                                 |

## 1 · Screens — 14 of the 21 Phase-2 ids

The batch is the Institute Admin's distribution chain and the Student's view of it. IA-08 is in
because IA-10's "Add faculty member" needs a place to start and return to; ST-19 is the hub's
refusal state.

| Id    | Screen                         | Route                                                                       | Board(s)              |
| ----- | ------------------------------ | --------------------------------------------------------------------------- | --------------------- |
| IA-01 | Overview                       | `/institute` (the base's own page)                                          | B2-01                 |
| IA-02 | Content access                 | `/institute/content-access`                                                 | B2-02                 |
| IA-03 | Access plan                    | `/institute/content-access/plans/[planId]`                                  | B2-03 f0–f5           |
| IA-04 | Student access                 | `/institute/student-access`                                                 | B2-04                 |
| IA-05 | Give students access (guided)  | `/institute/student-access/give?step=…&student=&group=&course=&experiment=` | B2-05                 |
| IA-06 | Students                       | `/institute/people`                                                         | B2-06 f0–f7           |
| IA-07 | Student record                 | `/institute/people/students/[studentId]`                                    | B2-06 f8–f13, f17     |
| IA-08 | Faculty                        | `/institute/people?tab=faculty`                                             | B2-06 f14             |
| IA-10 | Add a student / faculty member | `/institute/people/add` (`?type=faculty`)                                   | B2-07 f0–f4           |
| ST-01 | Home                           | `/student` (the base's own page)                                            | B2-10                 |
| ST-02 | My courses                     | `/student/courses`                                                          | B2-11                 |
| ST-03 | Course (student view)          | `/student/courses/[courseId]`                                               | B2-11 f1, f6, f14     |
| ST-05 | Experiment hub (Overview)      | `/student/experiments/[experimentId]`                                       | B2-12                 |
| ST-19 | Experiment not available       | a state of the hub (no route)                                               | B2-11 f12, B2-12 f4/6 |

Remaining Phase-2 ids (Package 2B): IA-09 Faculty record, IA-11 Import students, IA-13 Groups,
IA-14 Group, IA-15 Faculty courses, IA-16 Course codes, ST-04 All experiments.

## 2 · Services and contracts

- **Delivered ahead of the rest of Phase 2** (`PACKAGE_DELIVERIES`): `InstitutionService.getMyOverview`,
  `PeopleService.listStudents`, `PeopleService.listFaculty`, `GroupService.listGroups`
  (`sample-platform/src/handlers/institute-reads.ts`). 183 methods = **147 implemented** + 36
  deferred (P2 5: previewStudentImport, getFaculty, getGroup, FacultyCourseService.list,
  InstitutionCourseCodeService.list).
- **Additive read-model facts** (provisional register **PC-38 … PC-44**): IA-01 attention items as
  facts (replacing Appendix C's pre-rendered `attentionRow` for IA-01); IA-06 rows with groups,
  courses and experiments given (+ `notInGroup` filter); IA-07 `getStudent` with courses and grant
  rows; days left on the plan's term; IA-02 rows per plan and per experiment; IA-03 view with
  experiments, `givenTo` and the grants for its history; IA-05 preview `reaches` (each member's
  standing). Ledger: `getInstitutionRequest` now also names IA-03; `listGroups` names IA-06.
- **Contract suite: 82 cases** (+3 `institute:*`), all passing on the sample adapter.
- No domain or policy change: every rule is the existing one (`policy/` and the 347-row matrix
  untouched).

## 3 · Cross-role workflow (product build, one tab, 1440 / 1024 / 768 / 375)

`e2e/package-2a/demonstration.spec.ts`, normal product UI throughout:

1. public request → Super Admin approves (SA-03) → TE-4 payment stand-in → access active;
2. Super Admin assigns Meera Iyer (SA-07);
3. Meera signs in → **IA-01** (Access active, ACC-0107, "… hasn't been given to any student");
4. **IA-02** → **IA-03** (licences as approved by BITS);
5. **IA-06** empty → **IA-10** Add student (drawn checks, then Rahul Verma);
6. "Give this student access" → **IA-05** (pre-filled) → three steps → SACC-nnnn Active;
7. **IA-04** lists the grant; IA-01 drops the item;
8. Rahul signs in with the e-mail Meera entered → **ST-01** shows the experiment;
9. **ST-05** (WEB, VR available; AR not included) → **ST-02** → **ST-03** → hub;
10. Meera withdraws the grant with a reason (IA-04 DL-2);
11. Rahul: nothing given; the experiment answers **ST-19** "This experiment is no longer given to
    you" (reached by TEST NAVIGATION through the app router — a typed address resets the world,
    TE-6).

Every step is a port command or read on the one world; nothing is faked in the UI.

## 4 · Policy handling

| Open decision                            | What the build does                                                                                                                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OD-B2-01 overlapping grants              | Withdrawing an individual grant beside a group grant writes (existing domain rule, as B2-04 f4 draws); no can/can't-open words anywhere; the Student's gate answers `policy-open` and ST-19 shows a provisional "not settled" message |
| SACC-14 visibility after withdrawal/end  | The hub maps it to the drawn "no longer given to you"; Home/My courses show no earlier-work claim                                                                                                                                     |
| T-06 / D7 licence counting               | Licences shown as provided; "Waiting for a licence" only where supplied                                                                                                                                                               |
| T-11 / P1-01 identity collision          | IA-10 uses the drawn People uniqueness only; adding a person whose e-mail a platform user holds would shadow that sign-in (as Assign in Phase 1) — **owner decision required before a hosted demo**                                   |
| DEV-17 IA request-count semantics, P2-11 | No Requests destination, no device-request or problem-report attention items                                                                                                                                                          |
| PER-07 / PER-08                          | No faculty deactivation, no edit-details control                                                                                                                                                                                      |
| DEV-16 amber paused icon                 | ST-19 keeps the boards' neutral tint                                                                                                                                                                                                  |

## 5 · Visual parity

Each screen was captured beside its board frame (1440 and 375) and reviewed: structure, words,
classes and spacing match. Differences are fixture data (MEC-523 set in setup; Sneha inactive) and
the recorded interims: links, buttons, tabs and sidebar items of unbuilt screens are not rendered
(DEV-21), single-tab strips (IA-02 "Experiments", People "Students · Faculty"), ST-02/ST-05 without
tab strips, ST-05 without its Phase-3 actions. No new parity comparisons were pinned in 2A
(accelerated process). The eight existing comparisons that capture the Student's and the Institute
Admin's sidebar (board 05 shells, board 07 f0/f1/f3) are now measured under `-package-2a` names
and DEV-21, as Package 1A did for the Super Admin; their Phase-0 pins stay unchanged as the record
(8 pins added, none changed; `tools/board-capture/src/pinned.json` 150).

## 6 · Tests

See §8 for the final `pnpm verify` totals. Added: web unit/feature 611 (2,120 total), copy tests per
group verified against the boards, sample-platform handler tests (+29), contracts register tests;
browser `e2e/package-2a/` (demonstration ×4 widths, 16 state tests ×4 widths). Phase-0/1 specs
updated where they assumed the IA/Student homes were interim landings or used `/student/courses`
and `/institute/people` as unbuilt addresses.

## 7 · Owner decisions outstanding (new or newly reached)

T-11 (IA-10 e-mail collision); SACC-14 wording of earlier work; OD-B2-01 Student-side message;
"Waiting for a licence" on the Student's rows (contract gap); IA-03 "Plan ended" history line
derived from the end date (`IA-03.history-ended`); 103 provisional state-copy entries (of 104) of the 2A
screens (`copy/state-copy-*.ts`); PC-38 … PC-44.

## 8 · Verification and verdict

`pnpm verify`, 15 Oct 2026, run `2026-10-15T14-10-22-172Z-verify`: **VERIFY PASSED** in 1,160 s.

| Step       | Result                                                                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| format     | prettier clean                                                                                                                                        |
| repository | 32 checks · handoff 178/178 · audit evidence 36/36 · v46 copies 27/27 · scans (new code fixed at source: no inline styles, no Slice-1 "campus" names) |
| workspace  | build 12/12, typecheck/lint/test 40/40 · **5,127 unit tests** (Phase 1: 4,478): web 2,120, contracts 740, sample-platform 218                         |
| bundle     | 1,026 product files, 0 test-seam sentinels                                                                                                            |
| browser    | **2,190 passed** (Phase 1: 2,122), 0 failed, 650 skipped (width-gated and the 36 deferred flow skeletons); Chromium only                              |
| parity     | 95/95 tests · 764 comparisons: 623 within, 141 registered, **0 unregistered**, 0 masked                                                               |

Earlier runs in the same session: the first verify stopped at the repository scan (inline styles,
an "email" spelling, a `CAMPUS_CASES` name — fixed in the code); the second had one browser
failure in a Phase-1 journey (`revealSidebar` read the menu button before the shell had drawn it
after a sign-in — the helper now decides by the viewport width and waits; 115/115 across every
spec using it).

Independent review (one bounded pass): no security leak; 2 real defects fixed with tests (a
waiting Student shown "Available to you" with no reason → PC-45 closure and B3-02's sentence; the
IA-01 waiting count included students IA-04 does not read as waiting); 2 latent defects fixed
(cleared course code; IA-01 "Give access" now carries the course); IA-04 re-reads after a refused
withdrawal. Left for 2B (latent, unreachable with the one-experiment sample plan): IA-05's
"Already has it" computed per course rather than per chosen experiment.

**Verdict: CONDITIONAL PASS** — 14 Phase-2 ids built and connected on the one world, every suite
green; conditional on the owner decisions of §4 and §7 (T-11 before any hosted demo), the
provisional copy and contract entries, Chromium-only and same-machine parity.

Progress: **40 of 123 designed ids** built (Phase 0: 5, Phase 1: 21, Phase 2A: 14).
