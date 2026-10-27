# Vendor experiment classification — correction B closure (27 Oct 2026)

Follow-up to correction B (`25e9738`) after the owner's review (“functionally acceptable — final
sign-off pending”). Two closure tasks: the Create experiment course hint follows the Vendor's
actual permission, and the handling of an unavailable course is confirmed. A separate commit on
`v3/vendor-ownership`; `156fb46`, `360c757` and `25e9738` are kept as they are. The frontend is
not stakeholder-approved and not frozen. No backend, no seed change, no merge, push or deployment.

## 1. The course hint follows the Vendor's permission

VE-v1 draws “Only the courses assigned to <studio> are listed.” for every Vendor. That implied a
studio-level list even for a Vendor with Any course, and the scope is held by the person, not the
studio (ROLE-08). Step 1 now shows, under Course:

| Vendor's permission                                | Hint                                                             |
| -------------------------------------------------- | ---------------------------------------------------------------- |
| Any course (an active “All experiments” scope)     | “Choose an existing course in the selected Engineering area.”    |
| Course-restricted (one or more course scopes only) | “Only the courses the platform team assigned to you are listed.” |
| No scope                                           | unchanged: the no-course state of correction A (no form)         |

- **Contract**: `editorOutput.anyCourse` (boolean), provisional entry **PC-77**
  (owner-approved-interim). The service reads it from the Vendor's grant as it is
  (`vendorCourseGrant`); it widens nothing and changes no scope.
- **State copy** (VD-12, provisional): `VE-03.course-hint.any-course`,
  `VE-03.course-hint.assigned`. The drawn hint function (`courseHint`) is retired; the drawn words
  stay checked against the export as the basis.
- **Unchanged**: scope semantics and the stored kind (`all`), ownership (correction A), the
  Reviewer and Content Manager words (“All experiments”), the stale-course line inside the hint.
- **Deviation from the frozen design** (for sign-off): the B5-03 hint is replaced by the two
  permission-based hints above.

## 2. Unavailable-course handling — verdict: no defect

A course cannot be deleted, archived or hidden in this product: the structure offers rename and
move only, and the policy matrix asserts that no delete-course or delete-area command exists. An
“unavailable” course is therefore one that is **no longer granted** to the Vendor (a course scope
withdrawn, or Any course withdrawn) or one that has **moved** to another area.

| Case                                                  | Behaviour (read from the code, confirmed by tests)                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Draft whose course is no longer granted               | `getEditor` answers `readOnly` (`courseNoLongerAssigned`, OD-B5-01): “<code> is no longer assigned to you”, “What you entered”, no form. `saveDraft` and submit are refused `course-not-assigned`. The record keeps its `courseId`; nothing is rewritten.                                                                                                                                                                                                                                  |
| Returned experiment whose course is no longer granted | Revise opens; the Course select shows only courses still granted, with nothing chosen, and the hint names the saved course (“You chose <course>, which was withdrawn from your courses…”). The draft keeps the saved `courseId`; changing the area does not clear it. Save changes and Resubmit are refused with “<code> is no longer one of your assigned courses. Choose one of your courses.” — the Vendor must choose a course explicitly. The record (course and `rev`) is unchanged. |
| Course withdrawn while editing                        | The same stale line and the same refusal (existing test).                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Course moved to another area                          | Still granted: the draft reopens under the course's new area with its course kept (correction B).                                                                                                                                                                                                                                                                                                                                                                                          |

The experiment is never silently reassigned to another course: no code path writes a course the
Vendor did not choose. New tests: `vendor-editor.test.tsx` “a returned experiment whose course is
no longer granted …” and “a draft whose course is no longer granted …”.

Known wording outside this closure's scope (not changed): the read-only notice line says the course
“was withdrawn from <studio>” (B5-06/B5-07 drawn copy), and the stale line says “while you were
editing” also when the course was withdrawn before the page was opened.

## 3. Changed files

- `packages/contracts/src/draft/ports/production.ts` — `editorOutput.anyCourse`.
- `packages/contracts/src/draft/provisional.ts`, `provisional.test.ts` — PC-77 (77 entries).
- `packages/sample-platform/src/handlers/production.ts` — `getEditor` returns `anyCourse`.
- `packages/sample-platform/src/handlers/vendor-ownership.test.ts` — `anyCourse` for Any course,
  Anil and Ritu.
- `apps/web/src/features/vendor/editor/editor-steps.tsx` — the hint by permission.
- `apps/web/src/features/vendor/editor/experiment-editor.tsx` — passes `anyCourse`; the unused
  organisation value removed.
- `apps/web/src/copy/state-copy-vendor-editor.ts` — `VE-03.course-hint.*`.
- `apps/web/src/copy/vendor-editor.ts`, `vendor-editor.test.ts` — the drawn `courseHint` retired.
- `apps/web/src/features/vendor/vendor-editor.test.tsx` — hint for Anil, Ritu and Any course; the
  two unavailable-course tests.
- `apps/web/e2e/phase-5/vendor-editor.spec.ts`, `e2e/phase-7/vendor-ownership.spec.ts` — the
  hint at four widths (restricted and Any course).
- Docs: this record; `CORRECTION-B-RECORD.md` (§4, §8 point here); `docs/decisions/README.md`
  (PD-5 row).

## 4. Verification

Machine load before the gate: load average about 2–3 (the owner's browsers idle). One full
`pnpm verify` on the final code (isolated ports 3310 / 3410 / 3520):

| Step       | Result                                                                                                                                                                                                                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| format     | PASS — prettier clean                                                                                                                                                                                                                                                               |
| repository | PASS — 46 checks, handoff 178 / 178, audit evidence 36 / 36, v46 copies 27 / 27                                                                                                                                                                                                     |
| workspace  | PASS — 11,727 unit tests in 10 packages (domain 794, contracts 788, sample-platform 353, ui 1,506, web 7,830, api 38, database 5, config 379, validation 20, testing 14); build 12 / 12, typecheck / lint / test 40 / 40                                                            |
| bundle     | PASS — 2,157 product files, no test seam or harness sentinel                                                                                                                                                                                                                        |
| browser    | PASS — **3,512 passed, 0 failed** at 1440 / 1024 / 768 / 375 (testing 76, specimens 1,232, web 2,204); 668 skipped by design (single-width tests)                                                                                                                                   |
| parity     | Baseline only — specimens 32 / 32; web 75 / 79 tests: the 4 failing tests hold **exactly the five recorded Public artwork comparisons** (B1-03 f0, B1-03 f2, B1-05 f0 preview + whole frame, B1-05 f6), 0 masked, nothing new. Verify reports this step as FAIL, as on the baseline |

An earlier attempt of the same gate stopped after 60 s in the workspace step: `@xr/database`
`src/client.test.ts` — “Cannot find module '/src/generated/prisma/client.ts'”. That package is not
touched by this change; its log shows `database:build` and `database:typecheck` each running
`prisma generate` (which rewrites the generated client) at the moment `database:test` loaded it — a
race between parallel tasks, not a product regression. The package alone: 5 / 5; in the full gate
above: 5 / 5.

Targeted before the gate: the editor component and copy tests 212 / 212; service tests 353 / 353;
contracts 788 / 788; web typecheck and lint clean.

## 5. Owner acceptance (27 Oct 2026)

After the closure review, the owner decided: **Correction B accepted** at `ae9d218` — the Engineering
area → Course classification (`25e9738`) with this closure (course hint by permission, unavailable
courses confirmed), with these recorded exceptions:

- visual parity: the five known Public artwork differences (B1-03 f0, B1-03 f2, B1-05 f0 preview and
  whole frame, B1-05 f6) remain, unchanged and documented;
- the existing intentional skips (specimens 396, web 272: single-width and conditional tests) stay as
  documented;
- non-blocking follow-ups, not changed: the read-only notice's “was withdrawn from <studio>”
  wording; the stale-course line's “while you were editing” when the course was withdrawn before the
  page was opened; an Any-course Vendor can submit to a course no Academic Reviewer covers (“Stuck”
  on SA-12, existing behaviour).

Correction B is not reopened. Next: manual hands-on QA of the corrected frontend (all seven
authenticated roles) on an isolated server and a clean browser origin.
