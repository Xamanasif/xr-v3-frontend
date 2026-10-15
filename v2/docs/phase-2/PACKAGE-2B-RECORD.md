# Phase 2 — Package 2B record (campus distribution and Student access, completed)

|                   |                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Authorisation     | Owner, 15 Oct 2026 — "Phase 2B Authorization — Complete Campus Distribution and Student Access"                                 |
| Base              | `15a23b3` (Package 2A) on `v2/frontend-v46`; safety bundle `~/Downloads/XR-frontend-v46-15a23b3.bundle` (+ `.sha256`, verified) |
| Design authority  | `design/handoff-v46/` (frozen, 178/178): B2-03 f6–f10, B2-06 f15–f16, B2-07 f5–f10, B2-08, B2-09, B2-11 f2/f4/f15               |
| Verdict (summary) | see §8                                                                                                                          |

## 1 · Screens — the seven remaining Phase-2 ids (Phase 2: 21 of 21)

| Id    | Screen                | Route (Appendix A register)                                        | Board(s)          |
| ----- | --------------------- | ------------------------------------------------------------------ | ----------------- |
| IA-09 | Faculty record        | `/institute/people/faculty/[facultyId]`                            | B2-06 f15, f16    |
| IA-11 | Import students (CSV) | `/institute/people/import` (three in-page steps + result, rule S3) | B2-07 f5–f10      |
| IA-13 | Groups                | `/institute/people?tab=groups` ("Create group" = DL-3 on the tab)  | B2-08 f0–f2       |
| IA-14 | Group                 | `/institute/people/groups/[groupId]` (no `/new`, D-06)             | B2-08 f3–f10      |
| IA-15 | Faculty courses       | `/institute/people?tab=faculty-courses` (`&faculty=` pre-selects)  | B2-09 f0–f5       |
| IA-16 | Course codes          | `/institute/content-access?tab=course-codes`                       | B2-03 f6–f10      |
| ST-04 | All experiments       | `/student/courses?tab=experiments`                                 | B2-11 f2, f4, f15 |

The Package-2A actions that waited for these screens now render (IA-01 "Add course code", IA-02 tab
and "Add code", IA-04 "Change on the group", IA-05 / IA-06 "Import students", IA-06 tabs, IA-07
group names, IA-08 faculty names, IA-10 "Assign a course", ST-02 tab strip). What stays hidden waits
for Phases 3–4 (IA-17 Requests, ST-06…ST-15).

## 2 · Services and contracts

- **Delivered** (`PACKAGE_DELIVERIES`, Package 2B): `PeopleService.previewStudentImport` (the CSV
  parsed by the service — RFC 4180, BOM, header in any order; rows staged in the adapter for the
  commit), `PeopleService.getFaculty`, `GroupService.getGroup`, `FacultyCourseService.list`,
  `InstitutionCourseCodeService.list`. Every Phase-2 method is now implemented (183 = 152 + 31
  deferred to later phases).
- **Additive contract facts** (provisional register): **PC-46** IA-13 `given`, IA-14 `grantRows`
  and standings only for live group grants (none while paused — no "Can open it" where access is not
  live), IA-09 `courses`; **PC-47** import report `who` / `params`, commit `students`, the file
  checks `IA-11.file.columns` / `no-rows`; **PC-48** IA-05 `experimentIds` / `alreadyHas`; **PC-49**
  the identity safeguard (unresolved, T-11 / P1-01).
- `@xr/ui` `ConfirmDialog` gains an optional `notice` slot (B2-09 f2 draws a warning after the
  effect sentence).
- No domain or policy rule changed (`packages/domain` untouched).

## 3 · IA-05 correction (Package 2A review item)

"Already has it" was computed per course (a student holding every in-plan experiment of the course).
It is now answered per chosen experiment from the experiment-level grant records — the same rule
`giveAccess` refuses `already-given` by. Regression fixture: ACC-0107 with Shell-and-Tube **and**
Fin-Tube (same course ME ZG523), Rahul holding Shell-and-Tube (SACC-0310):
`sample-platform/src/handlers/institute-2b.test.ts` (service: Fin-Tube selectable, Shell blocked,
both blocked, giving Fin-Tube succeeds) and `apps/web/src/features/institute/package-2b.test.tsx`
(the IA-05 UI end to end). OD-B2-01 (overlap with group grants) is unchanged.

## 4 · Sample-mode identity safeguard (PC-49 — not the T-11 policy)

Sign-in resolves an e-mail to People, then Institute Admins, platform-role holders, Super Admins.
`addStudent`, `addFaculty`, `previewStudentImport` / `commitStudentImport` and
`assignInstituteAdmin` now refuse, on the e-mail field, an e-mail another sample identity already
signs in with (any case or spacing), and an import file whose rows share an e-mail. Nothing is merged
or replaced; the earlier sign-in keeps working. Words are provisional state copy
("This e-mail is already used to sign in to the platform. Use a different e-mail."). Package 1E's
reproduction tests now assert the refusal. **Owner decision still required:** how one person may
hold several roles or institutions (T-11, P1-01) before any hosted demonstration.

## 5 · Cross-role demonstration (product build, one tab, 1440 / 1024 / 768 / 375)

`e2e/package-2b/demonstration.spec.ts`: request → Super Admin approval → payment stand-in → access
active → the Super Admin's first Institute Admin e-mail refused (safeguard) → Meera assigned →
IA-01 → IA-02 → IA-03 → IA-16 MEC-523 saved → IA-11 (errors block the file; corrected file imports
three students) → IA-13 group created → IA-14 two members → "Give this group access" (IA-05) →
Arun's own grant from IA-07 → Arun: Home, My courses (shows MEC-523), All experiments → Meera
withdraws Arun's grant (IA-04) → Arun: nothing given → Rahul (group member) still has it → IA-10
faculty member → "Assign a course" (IA-15 pre-selected) → IA-09 and IA-08 show the same course.
Every step is a port command or read on the one world; one document throughout.

## 6 · Policy handling

| Open decision           | What the build does                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| T-24 import commit mode | All-or-nothing kept as the documented interim; register `IA-11.commit-mode`; no warning state rendered   |
| T-11 / P1-01            | Sample-mode safeguard only (§4); no invitation, activation or account linking                            |
| OD-B2-01 / OD-B2-02     | IA-14 shows each member's own standing; the overlap gets words naming the open decision, never can/can't |
| GRP-05                  | Removing a member changes only the membership; the dialog says only what is certain                      |
| SACC-14                 | ST-04 lists only what is given now; earlier work stays course-level on My courses                        |
| D7 / T-06               | Waits only where supplied; no licence counted                                                            |
| PER-07 / PER-08         | No faculty deactivation or edit; inactive faculty cannot be assigned                                     |
| T-17                    | Students and faculty see the institution's code once set (IA-16 → ST-02)                                 |

Latent Package-2A defect fixed: IA-02 showed a cleared institution code as "Your code:" (blank);
it now reads "not added" with "Add code".

## 7 · Visual comparison

Each new screen's default frame and mobile frame (and IA-14 f4 after the group grant) was captured
beside its board frame at the frame's width × 900 with the board-capture harness (13 captures):
IA-09 f15 0.14 % / f16 0.00 %, IA-11 f5 0.06 %, IA-13 f0 0.27 %, IA-14 f3 0.06 % / f4 0.02 % /
f10 0.89 %, IA-15 f0 0.67 % / f5 0.79 %, IA-16 f6 0.80 % / f10 1.96 %, ST-04 f2 0.21 % / f15 0.48 %
(pixels differing visibly). Every difference reviewed is fixture data (codes, grants or courses
already set in the walk) or the registered DEV-21 (unbuilt sidebar destinations); structure, words,
classes and spacing match. Genuine, recorded differences: destructive DL-1 focus on Cancel (VD-07,
owner rule), field errors not `role=alert` (board 12), no busy words where the board draws none
(state copy), "Choose the corrected file" returns to step 1 with no file (a real file input), the
IA-16 "No course is missing a code." row spans all five columns (B2-03 draws `colspan="4"`). As in
Package 2A, no new parity pins were added (accelerated process).

## 8 · Independent review (one bounded pass)

No high-severity defect. Fixed with tests: IA-13 listed a group grant as given after its plan had
ended (now as IA-14 reads it, `access-ended`); IA-14 named an individual grant on an ended plan as
"Has it individually"; IA-16 kept a field error after the row was fixed; IA-11 could file a student
under a course outside the content access (now `unknown-course`, provisional); the identity
safeguard now also covers `registerHolder` (SA-16's own drawn words); IA-09's "Remove…" links are
named per course. Recorded, not changed: ST-04's count lists every given experiment while ST-02's
course line counts what opens now (`ST-04.count`); IA-06's "Access active" after a plan ends is the
Package-2A reading (owner wording for ended access is open).

## 9 · Verification and verdict

`pnpm verify`, 15 Oct 2026, run `2026-10-15T17-03-33-385Z-verify`: **VERIFY PASSED** in 1,375 s.

| Step       | Result                                                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| format     | prettier clean                                                                                                                   |
| repository | 32 checks · handoff 178/178 · audit evidence 36/36 · v46 copies 27/27 · scans clean                                              |
| workspace  | build 12/12, typecheck/lint/test 40/40 · **5,553 unit tests** (2A: 5,127): web 2,516, contracts 747, sample-platform 241, ui 832 |
| bundle     | 1,079 product files, 0 test-seam sentinels                                                                                       |
| browser    | **2,234 passed** (2A: 2,190), 0 failed, 650 skipped (width-gated and the 36 deferred flow skeletons); Chromium only              |
| parity     | 95/95 tests · 764 comparisons: 623 within, 141 registered, **0 unregistered**, 0 masked                                          |

Added browser specs: `e2e/package-2b/demonstration.spec.ts` (×4 widths) and `screens.spec.ts`
(10 state tests ×4 widths, each with axe, focus, target-size and dialog checks). One earlier run
failed only the built-CSS "no Tailwind Preflight" check (a `py-0` utility emitting
`padding-block:0`); fixed at source.

**Verdict: CONDITIONAL PASS** — all 21 Phase-2 ids built and connected on the one world, every
suite green; conditional on the owner decisions of §6 (T-11 before any hosted demonstration;
T-24 import commit mode), the provisional state copy and contract entries (PC-46 … PC-49),
Chromium-only and same-machine parity, and no new parity pins.

Progress: **47 of 123 designed ids** built (Phase 0: 5, Phase 1: 21, Phase 2: 21).
