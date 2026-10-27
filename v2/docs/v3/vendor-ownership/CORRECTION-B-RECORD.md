# Vendor experiment classification — correction B (27 Oct 2026)

Correction B of the Vendor ownership audit: owner decision PD-5 — Create experiment step 1 chooses
the **Engineering area, then the Course** from the platform's academic structure (Engineering area →
Course → Experiment). Authorised by the owner on 27 Oct 2026 after correction A (`156fb46`) was
accepted (acceptance record `360c757`). The frontend is not stakeholder-approved and not frozen. No
backend, no seed change, no snapshot-format change, no merge, push or deployment.

## 1. Base and safety

- Branch `v3/vendor-ownership` in its worktree `/Users/mymac/Desktop/AR-VR-v3-vendor`, on top of
  `360c757` (correction A `156fb46` + its acceptance record). `v3/refined-b-ui` stays at `fa0ce78`.
- Not touched: browser-local saved worlds, the servers on 3360–3363 and 3369, earlier recovery
  bundles, the source handoff ZIP, the frozen design folders, the protected original checkout.
  Checks ran on ports 3310 / 3410 / 3520.

## 2. What the product now does

- **Step 1 (VE-03, VE-08, VE-09)**: “Engineering area”, then “Course”, side by side on the field grid
  (three columns each), then the name (four) and the version (two).
  - The areas are those of the platform's academic structure that hold a course the Vendor may
    choose, in the structure's order. An area with no eligible course is not offered.
  - Any course: every area and every course. Course-restricted: only the areas and courses the
    scopes cover. No scope: the no-course state of correction A (no form).
  - One eligible area: chosen already. Several: the Vendor chooses one (“Choose an Engineering
    area”); until then Course offers only “Choose an Engineering area first”, and Continue answers
    “Choose a course” as before.
  - Course lists only the chosen area's courses; choosing another area clears a course of the first.
  - A saved draft, a returned experiment (Revise) and an edited draft open with the area of their
    saved course as the structure has it now — a moved course follows its new area.
  - A course no longer granted keeps the existing handling: a draft opens read-only (OD-B5-01) with
    the course named from the catalogue; nothing in the draft is rewritten.
- **Nothing new is stored.** The record keeps `content.courseId` only; the area is derived from the
  course on every read. The Vendor never creates or changes an area or a course (the form only
  reads the structure; structure commands stay the Super Admin's).
- **Super Admin wording (Vendors only)**: a Vendor's “All experiments” scope is named **“Any course”**
  on SA-16 and SA-17 (the panel's choice, the scope lists, the table row, the flashes). The panel's
  line: “Permission to submit to any existing course, now and later — not access to every
  experiment. They see only their own experiments.” The stored kind (`all`), the business rules and
  the Reviewer and Content Manager words (“All experiments”) are unchanged.

## 3. Changes by layer

- **Contracts**: `editorOutput.areas` (area references) and `editorCourse` = `courseCard` +
  `areaId`, offered courses in the structure's order — additive, provisional entry PC-76
  (owner-approved interim).
- **Prototype services**: `getEditor` builds the offered courses area by area from the structure and
  returns the areas that hold one.
- **Web**: `editor-steps.tsx` (the dependent selectors, area derived from the course),
  `experiment-editor.tsx` (passes the areas); SA-17 `holder-view.ts` / `role-holder.tsx` (“Any
  course” for a Vendor). State copy (provisional, VD-12): `VE-03.area`, `VE-03.area.choose`,
  `VE-03.area.first`, `SA-17.vendor-any-course-name`; `SA-17.vendor-choices` and
  `SA-17.vendor-no-scope-line` reworded.
- **Domain**: unchanged.
- **Docs**: this record; the decisions README (PD-5 row); the hands-on guide (step 7 names the
  Engineering area; the Vendor scope note says “Any course”).

## 4. Deviations from the frozen design (recorded, for sign-off)

- VE-v1 draws one “Course” select on step 1 (course four columns, version two, name full width):
  the Engineering area select is added before it and the grid becomes area 3 · course 3 · name 4 ·
  version 2.
- SA-v1 names the scope “All experiments” for every role: for a Vendor it is now “Any course”, with
  the new explanatory line.
- The drawn course hint “Only the courses assigned to <studio> are listed.” is kept as drawn.

## 5. Existing records and saved worlds

No record field is added or rewritten and the seed is unchanged, so saved browser worlds load as
before. Every draft and returned experiment keeps its course; its area is read from the course.
Creator, history and ownership (correction A) are unchanged.

## 6. Tests and results

| Check                                                                                                                                          | Result                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workspace (`pnpm verify`, runs 1 and 3)                                                                                                        | PASS — 11,722 unit tests in 10 packages (domain 794, contracts 787, sample-platform 353, ui 1,506, web 7,826, …); typecheck and lint 40 / 40 tasks. Run 2 stopped here on one Faculty unit test that hit its 5 s limit under load (`question-bank.test.tsx` “adds a question of each type”); the file alone: 110 / 110                                                  |
| Format, repository, bundle (every run)                                                                                                         | PASS — prettier clean; 46 checks, handoff 178 / 178; 2,157 product files, no test seam                                                                                                                                                                                                                                                                                  |
| Targeted browser run (Vendor editor, home, record, Flow E demonstration, SA-16/SA-17, ownership + step 1, the flow walk-throughs), four widths | 122 passed, 42 skipped (single-width tests), 0 failed                                                                                                                                                                                                                                                                                                                   |
| Full gate, browser, run 1                                                                                                                      | 3,498 passed, **14 failed**: Faculty and Student assessment / question-bank / My courses / result specs, mostly at 768 — every one a timeout (elements or pages that never came in time, closed pages); the browser step took 1.5 h instead of 1 h. Those five spec files alone at four widths: **143 passed, 0 failed**                                                |
| Full gate, browser, run 3                                                                                                                      | 3,489 passed, **23 failed**: Public experiment, landing (a burst at 1024), walk-through, TE-6 saved world, request recovery, test seam, decision, ST-09 — timeouts, “Internal server error, session closed”, a fake clock asked to go backwards, an interrupted navigation. Those eight spec files alone at four widths: **254 passed, 0 failed**                       |
| Machine load                                                                                                                                   | load average 13–28 during the runs (the owner's own browser processes); no test failed in two runs; every failed test passed when run alone. No code was changed for these failures                                                                                                                                                                                     |
| Service tests (`vendor-ownership.test.ts`, 12)                                                                                                 | Any course: three areas, six courses, each with its area, in the structure's order; Anil one area, Ritu two; a moved course follows its area and the draft keeps its course, no area field written; a CHE ZG513 submission from an Any-course Vendor reaches Prof. A. Menon's queue and then Kavya Nair's Ready to publish, and stays private (correction A cases kept) |
| Component tests                                                                                                                                | step 1 grid and the one-area case; two areas with an explicit choice, Course following the area, another area clearing the course, Continue without a course; a draft reopening with its area; a moved course; Revise of a returned experiment with its area (Anil with Any course); SA-17 “Any course” choice, line, flash and list                                    |
| Browser spec `phase-7/vendor-ownership.spec.ts`                                                                                                | step 1 at 1440 / 1024 / 768 / 375 (area, course, clearing, save, reopen; axe, one h1, targets, overflow); no-course state at four widths; ownership walks at 1440 with the area chosen                                                                                                                                                                                  |

## 7. Visual parity

None of the three gate runs reached parity (the gate stops at the first failing step), so it was run
on its own on this build: specimens 32 / 32; web 43 passed, 4 failed — **exactly the five recorded
Public artwork comparisons** of the baseline (B1-03 f0 whole frame, B1-03 f2 experiments, B1-05 f0
preview and whole frame, B1-05 f6 poster). No new difference. The Vendor editor and SA-17 have no
v46 parity board (retired for the V3 screens); the new step-1 layout is covered by the browser
checks above.

## 8. Known limitations

- The course hint keeps the drawn studio wording for every Vendor, including one with Any course.
- A course cannot be deleted in this product (only renamed or moved), so “removed” is covered as a
  course no longer granted or not found: the draft keeps its course and opens read-only.
- A Vendor with Any course can submit to a course no Academic Reviewer covers (“Stuck” on SA-12,
  existing behaviour, unchanged).
