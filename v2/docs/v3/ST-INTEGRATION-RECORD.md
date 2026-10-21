# ST integration record — Student on foundation XR-V3-RB-1.0

Stage D of the owner's master integration instruction of 21 Oct 2026 (Academic Reviewer →
Institute Admin → Faculty → Student), on `v3/refined-b-ui` after FA (`68efdc2`). The 19 owned ids:
ST-01 … ST-19. The excluded id ST-20 stays excluded.

## 1. Base and safety

- Worktree `/Users/mymac/Desktop/AR-VR-v3-ui`, HEAD `68efdc2`. Following the owner's acceleration
  instruction of 21 Oct 2026, the Student was built in an isolated clone of the worktree (its own
  git baseline, development server 3511) while the Faculty verification finished, then applied to
  the worktree as one diff (only the Student's files differed; the result was checked file by
  file against the clone).
- No build ran in this worktree; product and test-hook builds ran in an isolated verification copy
  (ports 3310 / 3520); the worktree's test-hook development server used 3510. Port 3330 (the
  Content Manager review build) was left running; port 3300 was not running.
- The protected original checkout was only read (`1b090c9`, 98 paths). The V1 Public Landing, the
  public pages and the XS, SA, VE, CM, RV, IA and FA screens were not modified, except additive
  shared pieces listed in §6.

## 2. Source and approval

| Item        | Value                                                                                                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source      | `XR-V3-Student-FINAL-Source.zip`, 606,639 bytes, SHA-256 `029b9dfb56734f929f82ee46cdb063dc558c051ed188f7a52ee554a21048c268`: “FINAL — OWNER APPROVED 21 Oct 2026”                                                         |
| Screenshots | `XR-V3-Student-FINAL-Screenshots.zip`, 81,394,476 bytes, SHA-256 `e5a23f57…0d5f60` (817 renders + `INDEX.md`; kept by the owner)                                                                                          |
| Coverage    | 19 of 19 owned ids designed (`ROLE-STATUS.json`, `COVERAGE-REGISTER`)                                                                                                                                                     |
| Foundation  | `XR-V3-RB-1.0`; `FOUNDATION-LOCK.json` (an eighth lock layout: `baseFiles.*.finalSha256`, `final.roleStylesheet`) names the base hashes; base sheets byte-identical; one role sheet `v3-student-final.css` (`st-`, `sv-`) |
| Integrity   | 299 files copied byte for byte to `design/v3-refined-b/roles/ST-v1/`; checksum list beside it: 299 OK                                                                                                                     |
| Approval    | The export's own status and the owner's master instruction of 21 Oct 2026 naming this package. Implementation acceptance pending the owner's browser review                                                               |

## 3. How it sits in the product

- **Shell.** `V3_SHELL_ROLES` adds `student` (every role now uses the V3 shell): rail Home, My
  courses, Assessments, Progress; the date in the top line; the XS-08 paused and inactive banners;
  **My device** in the V3 account menu while the product offers it (the existing rule,
  `useMyDeviceEntry`); the attempt (ST-13) keeps its focused layout without the rail.
- **Stylesheet.** `st-scoped.css` from `v3-student-final.css` in layer `xr.v3.st` (after
  `xr.v3.fa`); left out: the preview-only `st-root`, `st-review*`, `st-skip` and their container
  rules, the borrowed XS families (`xsb-*`) and the XS-07 Help form classes (`st-form`,
  `st-formstack`, `st-file`, `st-actions`, `st-sec-note`).
- **Components.** `st.tsx` (shared: format chip, cards, list rows, states, refusal page, record
  head and tabs, per-format progress, how-to steps) and one module per group: `st-home`, `st-hub`,
  `st-progress`, `st-assess`. Cross-group helpers in `features/student/shared/` with frozen APIs.

## 4. What was integrated

All 19 ids on their normal routes (`/student/*`), bound to the existing services: home and courses
(ST-01 … ST-04, ST-19), the experiment hub and formats (ST-05 … ST-10), assessments (ST-11 …
ST-14 and the hub's Assessment tab), progress, feedback and My device (ST-15 … ST-18). The register
(`V3-STATUS-REGISTER.json`) states each id's states.

No course-access, simulation, assessment, feedback or device rule, service contract or permission
changed.

## 5. Decisions and discrepancies

1. **Illustrative simulation stages are NOT product data** (the owner's warning). The runtime
   activity holds only first opened, last saved, last reported and sessions: no stage tracker,
   stage names or “stage N of 3” on Home, ST-07, ST-08 or ST-10; what exists is bound (first
   opened, last saved, “Reported by the simulation / from the headset at …”). **Dependency:** the
   real activity's stage names and count, and a per-student stage fact in the runtime data.
2. **The sample activity stays the product's Phase-7 stand-in:** Open/Continue WEB opens
   `/prototype/web-activity` in a new tab, reporting to the launching tab; the export's in-tab
   ST-08a activity is not built.
3. **No internal reference:** no ACC-, SACC-, DTR-, SUB-, ASMT- or attempt reference in words,
   accessible names, crumbs, dialogs or tab titles (“Given by your institution”, the licence wait
   named by content, the device transfer without its reference); course codes and the device's
   asset tag stay.
4. **Facts no read holds are left out:** ended dates, withdrawal causes and earlier-work rows; the
   BITS course code and area on course cards; row descriptions and dates; the Overview's
   per-resource rows; the Home “Last saved” and feedback dates.
5. **Kept product behaviour:** the inactive Student keeps readable pages with a held chip (the
   export routes to XS-08); the offering rule for My device; the save failure as an alert; ST-11's
   tabs replace the address without a history entry.
6. **Consolidation decisions:** one “today” for Student pages (`features/student/shared/use-today.ts`,
   the session clock, as the Faculty pages and the V3 shell's top line); dates kept on one line
   with no-break spaces as the export does; one next-step rule for Home and the hub
   (`shared/next-step.ts`, the export's single rule — Home now says “Choose a format” when nothing
   is started, as the export does); Student crumbs and tab titles name assessments by content.
7. **Extra existing reads, one per page:** the experiment hub for Home's cover; the Student's
   experiments on ST-02, ST-19 (“Experiments you can open”) and ST-11's no-assessments state; the
   simulation chooser on ST-05; the device on ST-07 (only while a headset format can open); the
   assessments on ST-15. ST-07 and ST-10 dropped their per-format feedback reads. No per-row reads.
8. **V3P-18:** the export's 6 `style=` values are none on Student product elements (icon sprite,
   four on the borrowed XS-07 reports page, the drawer brand); the error-summary 24 px link target
   re-added for Student summaries only; two focus restorations from the cascade check (the focused
   attempt's main outline, the submitted card's focus radius).

## 6. What did not change

Shared code touched, additively: the role shell (role set, rail icons, `deviceEligible`), kit
options listed in `COMPONENT-EXTENSIONS.md`, patch entries, the student-only entries of shared
registers; three shared tests that used the Student as their v46-shell sample (not-found, session
gate, Help) moved to the V3 rail.

## 7. Tests and results

Builds and browser suites ran in an isolated verification copy (ports 3310 / 3520) on the final
consolidated code.

| Check                                | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit and integration                 | packages/ui 90 files, 1,504 tests; apps/web 170 files, 7,754 tests; packages/config 379 + scans 46 (ST-v1 299 OK, register 109 migrated, map, scope boundary, no stale exception); typecheck and lint clean                                                                                                                                                                                                                                                                                                                                           |
| Student browser specs                | phase-3 hub, formats, progress-feedback, device-student; phase-4b student-assessments, attempt, result: 207 passed, 9 skipped (1440-only by design) across 1440, 1024, 768, 375; the Student describes of package-2a/2b screens: 24/24 (test-hook development server)                                                                                                                                                                                                                                                                                 |
| Whole web browser suite, final build | 1440: 571 passed / 7 skipped, 0 failed. Risk-based at 1024 / 768 / 375 (the owner's acceleration instruction): flows, foundation, all 12 demonstrations, the Faculty marking and students specs, package-2a/2b screens, the Institute Admin requests, device and operations specs — 213 / 214 / 216 passed, 0 failed. Cross-role specs moved to the V3 markup with their coverage kept; a check that read a device-transfer reference from the Student's words now reads it from an address or a service read and asserts the Student page shows none |
| Visual parity (v46 harness)          | `gl-01`, `xs-07`, `xs-06-pu-15-messages`: 10/10, with the Student's v46 shell comparisons retired by name under ST-shell (19 names: the Help shell and the XS-07 / XS-08 phone top bars and sidebars measured on the Student)                                                                                                                                                                                                                                                                                                                         |
| Cascade                              | 154 page states (five worlds, every Student route, the assessment flow) × 1440 / 375 at rest / hover / focus: two focus restorations (V3P-18); otherwise no difference                                                                                                                                                                                                                                                                                                                                                                                |
| Inline styles                        | 6 `style=` in the export, none on Student product elements (recorded in the provenance test)                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| V3 captures                          | 11 cases × 4 widths: no overflow, no clipped text, all font weights, no console error, no reference (`productEvidenceST`)                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Identifier sweep                     | every list page, the hub tabs, the format and feedback pages, the assessment introduction and result, after Flow C and after Flow D: no internal reference in words, accessible names, placeholders or tab titles                                                                                                                                                                                                                                                                                                                                     |
| Integrity                            | handoff-v46 178 · v3-refined-b 46 · XS-v6 125 · SA-v1 29 · VE-v1 85 · CM-v1 140 · RV-v1 120 · IA-v1 151 · FA-v1 227 · ST-v1 299 OK · protected checkout `1b090c9`, 98 paths                                                                                                                                                                                                                                                                                                                                                                           |

## 8. Limits and items for the owner

- Implementation acceptance is pending the owner's browser review.
- The simulation-stage dependency in §5.1.
- The v46 shell's collapsed 72 px rail (and its Expand / Collapse buttons) does not exist in the V3
  shell; the foundation accessibility spec now checks the V3 shell's boundaries (Menu below 1024 px,
  the 248 px rail from 1024 px).

## 9. How to review it

The Student exists only after the sample journey: in the review build, follow the walkthrough
(Flow A and B: Meera Iyer adds **Rahul Verma — `rahul.verma@godavari.edu.in`, any password** and
gives him Shell-and-Tube). Route: Home (continue learning, the next step) → My courses (course,
all experiments) → the experiment (Overview, Resources, Simulation → WEB opens the sample activity
in a new tab; Progress) → Assessments (once the Faculty has set one: before you start, the attempt,
the result) → Progress → account menu › My device (the pre-authorised headset; request a transfer).
