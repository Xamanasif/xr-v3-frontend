# V3 four-role integration — consolidated browser-review report (22 Oct 2026)

The owner's master instruction of 21 Oct 2026 (and the acceleration instruction that followed)
integrated the four remaining roles from their FINAL, owner-approved packages, in order:
Academic Reviewer → Institute Admin → Faculty → Student, then one platform-wide verification. **No
implementation is marked accepted** — acceptance is the owner's browser review below.

## 1. What was delivered

| Stage | Role (ids)                 | Commit        | Recovery bundle (`~/Downloads`)                              | Record                     |
| ----- | -------------------------- | ------------- | ------------------------------------------------------------ | -------------------------- |
| A     | Academic Reviewer (6)      | `aa654ab`     | `XR-frontend-v3-aa654ab-rv.bundle` · SHA-256 `37d1f428…fd5a` | `RV-INTEGRATION-RECORD.md` |
| B     | Institute Admin (19)       | `5e102ee`     | `XR-frontend-v3-5e102ee-ia.bundle` · SHA-256 `b4c0d874…676f` | `IA-INTEGRATION-RECORD.md` |
| C     | Faculty (21)               | `68efdc2`     | `XR-frontend-v3-68efdc2-fa.bundle` · SHA-256 `2ec6284d…a546` | `FA-INTEGRATION-RECORD.md` |
| D     | Student (19)               | `1d03cb8`     | `XR-frontend-v3-1d03cb8-st.bundle` · SHA-256 `832b6828…24c6` | `ST-INTEGRATION-RECORD.md` |
| —     | this report (records only) | see `git log` | the final bundle named in the session's closing message      | this file                  |

All on branch `v3/refined-b-ui` of the worktree `/Users/mymac/Desktop/AR-VR-v3-ui`; each bundle
was verified (`git bundle verify`) and restore-tested (cloned, tree identical, the role's export
checksums OK). Nothing was merged, pushed or deployed.

## 2. Coverage — the 123 designed screens

From `V3-STATUS-REGISTER.json` (147 registered, 123 designed, 24 excluded):

| Status                                                                              | Ids                                             | Count   |
| ----------------------------------------------------------------------------------- | ----------------------------------------------- | ------- |
| Accepted by the owner earlier                                                       | XS (7, XS-08 in part), SA (18), VE (10), CM (9) | 44      |
| Integrated in this run, acceptance pending this review                              | RV (6), IA (19), FA (21), ST (19)               | 65      |
| **Migrated to V3 in total**                                                         |                                                 | **109** |
| Locked V1 landing (not part of the redesign; current simplified homepage preserved) | PU-01, PU-14                                    | 2       |
| Public pages awaiting a complete-role Public export (unchanged v46 presentation)    | PU-02 … PU-10, PU-12, PU-13, PU-15              | 12      |
| **Designed total**                                                                  |                                                 | **123** |

The platform is therefore **109 / 123 migrated, not 123 / 123**: the 14 Public screens have no V3
package yet (2 are locked by the owner). Every signed-in role workspace now uses the V3 shell.

## 3. Quality — the final platform gate

`pnpm verify` on the final commit `1d03cb8`, in an isolated copy (ports 3310 / 3410 / 3520), 22 Oct
2026, 54 minutes:

| Step       | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| format     | PASS — prettier clean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| repository | PASS — 46 checks · handoff 178/178 · audit evidence 36/36 · v46 copies 27/27 · scans, deny-list, fence wiring                                                                                                                                                                                                                                                                                                                                                                                             |
| workspace  | PASS — turbo build 12/12 + typecheck / lint / test 40/40 (`--force`) · **11,602 unit tests** (ui 1,504 · web 7,754 · domain 787 · contracts 781 · config 379 · sample-platform 320 · …)                                                                                                                                                                                                                                                                                                                   |
| bundle     | PASS — 2,154 product files, no test seam or harness code; the test-hook build has the bridge (6/6)                                                                                                                                                                                                                                                                                                                                                                                                        |
| browser    | PASS — **3,414 Playwright tests at four widths** (web 2,106 · specimens 1,232 · testing 76), 0 failed; 602 skipped by design                                                                                                                                                                                                                                                                                                                                                                              |
| parity     | 77/82 tests · 770 comparisons: 446 within tolerance, 57 on the deviation register, 260 retired by name for owner-approved V3 screens, **7 unregistered = exactly the 7 known Public Landing artwork comparisons** (B1-01 f0 hero figure and formats; B1-03 f0 whole frame; B1-03 f2 experiments; B1-05 f0 preview and whole frame; B1-05 f6 poster) — the recorded legacy baseline exception, **not re-pinned and not hidden**. The Public pages' code is unchanged since the Content Manager acceptance. |

Per-role checks before each commit (details in each record §7): focused unit and browser specs at
1440 / 1024 / 768 / 375; the whole web suite at 1440 and the risk-based cross-role set at the other
widths (0 failed every time); cascade checks of each role layer against the foundation; every
inline `style=` of each export accounted for; V3 captures at four widths (no overflow, no clipped
text, no console error).

**Identifier rule — final sweep of every role on the final build:** every list page and the record
pages it links to, signed in as Super Admin, Vendor, Content Manager, Academic Reviewer and
Institute Admin, and booted as Faculty and Student (after Flow C / D): **no internal reference
(SUB-, UPD-, REQ-, ACC-, SACC-, DTR-, ASMT-, ATT-, Q-, GRP-, FMAP-)** in words, accessible names,
placeholders or tab titles for every role, except the allowed seeded text quoted as written
(“Correction UPD-000n.” on update pages) and support references on Help. The Vendor was brought
under the rule afterwards, on your decision (§6, item 1).

## 4. Safety

- Protected original checkout `/Users/mymac/Desktop/AR-VR`: untouched (`1b090c9`, 98 paths).
- Frozen design folders verified: handoff-v46 178 · v3-refined-b 46 · XS-v6 125 · SA-v1 29 · VE-v1 85
  · CM-v1 140 · RV-v1 120 · IA-v1 151 · FA-v1 227 · ST-v1 299 — all OK.
- Accepted roles: no Super Admin, Vendor, Content Manager or Public feature file changed since the
  CM acceptance (`984efe3`); shared changes were additive (kit options, patch entries, the role
  shell's role set) and are listed in each record §6.
- Port 3300 was not running and was not started; port 3330 (the Content Manager review build from
  the morning) was left running. Builds ran only in isolated copies, never in the worktree.
- No service contract, permission, workflow or business rule changed; no data, feature or rule was
  invented; the Vendor's “Request Course Access” stayed on hold.

## 5. How to review — the browser

**Review build: http://localhost:3360** — a production build (`next start`) of the final commit
`1d03cb8`, served from an isolated copy in the session scratchpad (it ends when the computer
restarts; to rebuild: clone the ST bundle, `pnpm install`, `pnpm --dir v2/apps/web build`,
`pnpm --dir v2/apps/web exec next start -p <free port>`, never 3300/3330 unless you choose to
replace them).

Sign-in: the sample e-mail and **any non-empty password**. The sample world stays in your browser;
a reload signs the tab out; `http://localhost:3360/prototype/reset` starts the world again.

| Role              | Person                                      | Sample e-mail                   | Available            |
| ----------------- | ------------------------------------------- | ------------------------------- | -------------------- |
| Academic Reviewer | Prof. A. Menon                              | `a.menon@wilp.example`          | at once              |
| Institute Admin   | V. Hegde, Malnad (active plan, ending soon) | `v.hegde@malnad.example`        | at once              |
| Institute Admin   | S. Kulkarni, Deccan (paused by BITS)        | `s.kulkarni@deccan.example`     | at once              |
| Institute Admin   | R. Bhatt, Konark (no course code)           | `r.bhatt@konarkpoly.edu.in`     | at once              |
| Super Admin       | Arjun Mehta                                 | `arjun.mehta@wilp.example`      | at once              |
| Vendor            | Anil Shetty                                 | `anil.shetty@northline.example` | at once              |
| Content Manager   | Kavya Nair                                  | `kavya.nair@wilp.example`       | at once              |
| Institute Admin   | Meera Iyer, Godavari                        | `meera.iyer@godavari.edu.in`    | after Flow A + B     |
| Student           | Rahul Verma                                 | `rahul.verma@godavari.edu.in`   | after Flow B         |
| Faculty           | Dr S. Ranganathan                           | `s.ranganathan@godavari.edu.in` | after Meera adds him |

**Reaching the Faculty and the Student** (they exist only after the sample journey, as in the
Phase-7 walkthrough `docs/phase-7/MANAGER-WALKTHROUGH.md`): Public window → Browse experiments →
Shell-and-Tube → Browser + Virtual reality → selection → request (Godavari Institute of Technology,
Meera Iyer, `meera.iyer@godavari.edu.in`, 120 licences, yearly) → Arjun approves (External) →
continue to payment (sample stand-in) → Arjun → Institutions → Godavari → Assign Institute Admin
Meera Iyer → sign in as Meera → People → Add student Rahul Verma (GIT-2026-0418) → give access to
Shell-and-Tube → People → add faculty Dr S. Ranganathan and assign the course (who teaches what) →
sign in as Ranganathan or Rahul.

### Checklists

- **Academic Reviewer** — Overview (the desk, Start review) → Review queue (type tabs, course
  filter) → Flash Distillation (add learning outcomes, Approve with its confirmation; or Return to
  vendor inline) → re-check (Venturi Meter Calibration) → Reviewed by me → Packed Bed Pressure Drop
  (three outcomes; the owner's SUB-0070 item) and Boiler Drum Level (with the Super Admin). The
  owner's UPD-0006 item: hidden from Reviewed by me because the reviewer's EEE ZC341 scope was
  withdrawn in the sample world (the domain shows an update only while a scope covers its course).
- **Institute Admin** — Overview (attention, plan card and term bar) → Content access → Student
  access (grants, withdraw) → Give students access (steps) → People (students, faculty, groups, who
  teaches what; add, import) → Requests (to BITS; device requests) → Usage. Try Deccan (paused) and
  Konark (no course code).
- **Faculty** — Overview (priority band, Mark now, coming up, your teaching) → My courses → an
  experiment → Assessments → Create an assessment (steps) → the record's Summary, Questions,
  Settings, Preview, Submissions (Export CSV) → Question bank (add, edit, draft with assistance,
  import a CSV) → Marking (queue, mark a submission, confirm) → Students (Export CSV; a student).
- **Student** — Home (continue learning, the next step) → My courses → the experiment (Overview,
  Resources, Simulation → WEB opens the sample activity in a new tab, Progress, Assessment) →
  Assessments (before you start, the attempt, the result — once the Faculty has set one) →
  Progress → Feedback → account menu › My device (request a transfer).
- **Everywhere** — 1440, 1024, 768 and 375 px (the rail becomes Menu below 1024); keyboard focus;
  no internal reference in words or names.

## 6. Decisions and items for the owner

1. **Vendor identifier rule — done on your decision (22 Oct 2026).** The Vendor (accepted on 20 Oct,
   before the rule covered every role) showed SUB- references on its Experiments list, record and
   editor pages. On your instruction they were replaced by words in a separate Vendor-only commit
   (`VE-INTEGRATION-RECORD.md` §10); every role is now free of internal references.
2. **Simulation stages — product dependency.** The Student export's illustrative stages are not
   product data and were left out. Needed to show them: the real activity's stage names and count,
   and a per-student stage fact in the runtime data.
3. **Parity register.** The 7 Public Landing artwork comparisons stay the recorded baseline
   exception; 7 deviation-register entries still await you (DEV-23, DEV-24, DEV-28, DEV-30, DEV-31,
   DEV-32, DEV-33 — none blocking). With every role on the V3 shell, the v46 shell comparisons are
   retired by name for the V3 screens (`V3-COMPARISON-MAP.json`).
4. **Kept product behaviour where the export differs (check you agree):** refusals keep “not found”
   (existence not revealed) for Reviewer and Institute Admin records; the inactive Student keeps
   readable pages with a held chip (the export routes to the XS-08 page); “Multiple choice” instead
   of “Single choice” (the domain's CSV rule and the Student's shared words); FA-15 saves every edit
   as a new version; the XS banner link reads “Help” (the delivered XS design) where the Student
   export writes “Help & support”.
5. **Export behaviour adopted (check you agree):** the Student's Home and hub share the export's one
   next-step rule (Home says “Choose a format” when nothing is started); ST-18 shows “My device isn't
   available to you” instead of not-found when the device page is not offered; the FA-12 export words
   say the file holds every submission (the service exports every row, whatever the filter); the V3
   shell has no 72 px collapsed rail (the v46 rail tests now check the V3 boundaries).
6. **Facts no read holds were left out** (each record §5 lists them): e.g. FA-01 drafts row, FA-14
   “None now · earlier versions keep it”, IA “Removed from the group”, the Student's ended dates,
   withdrawal causes and earlier-work rows, the BITS code and area on Student course cards.
7. **Small open items recorded by the consolidations:** Faculty `FaMarksPanel` not merged into
   `FaPanel`; four Faculty no-match states are not live regions; the error-summary spacing and
   target fixes are opted into by Faculty and Student only (other roles may need them).
8. **Review servers.** 3360 = this review build. 3330 still serves the morning's Content Manager
   build (now superseded by 3360); stop it whenever you like.
