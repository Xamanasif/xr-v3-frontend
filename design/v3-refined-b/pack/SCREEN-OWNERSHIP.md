# V3 complete-role screen ownership

Mechanically derived from the supplied v46 screens.json: 147 registered IDs, 123 designed and 24 excluded. Designed includes 73 pages, 22 tabs, 19 steps, 7 states, 1 menu and 1 action. These are not 123 independent dashboard pages.

PU-01 and PU-14 are preserved original-landing content. Five other IDs have V3 source in hand. The remaining 116 IDs need V3 design work; current functional implementation is a separate, reported baseline.

Route strings below are v46 proposals. Keep the actual current application routes in Claude Code.

## Super Admin - 18 designed IDs

| ID | Registered screen | Type | v46 proposed route | V3 design state |
| --- | --- | --- | --- | --- |
| SA-01 | Overview | page | /admin | v3-seed-source-received |
| SA-02 | Requests | page | /admin/requests | v3-seed-source-received |
| SA-03 | Request decision | page | /admin/requests/[requestId] | v3-seed-source-received |
| SA-06 | Institutions | page | /admin/institutions | v3-design-pending |
| SA-07 | Institution detail | page | /admin/institutions/[institutionId] | v3-design-pending |
| SA-10 | Content updates (awaiting release) | tab | /admin/content/updates | v3-design-pending |
| SA-11 | Release or hold an update | page | /admin/content/updates/[updateId] | v3-design-pending |
| SA-12 | All content & stuck items | tab | /admin/content/all | v3-design-pending |
| SA-13 | Content record (read-only for published content; status override for stuck, non-published records — M-1) | page | /admin/content/records/[recordId] | v3-design-pending |
| SA-14 | Academic structure (areas → courses) | page | /admin/structure | v3-design-pending |
| SA-15 | Area / course record | page | /admin/structure/areas/[areaId] · /courses/[courseId] | v3-design-pending |
| SA-16 | Platform roles (Vendors · Reviewers · Content Managers) | page | /admin/roles?tab=vendors\|reviewers\|content-managers | v3-design-pending |
| SA-17 | Role holder (assign / withdraw scope) | page | /admin/roles/[holderId] | v3-design-pending |
| SA-18 | Device transfers | tab | /admin/operations/device-transfers | v3-design-pending |
| SA-19 | Device transfer decision | page | /admin/operations/device-transfers/[transferId] | v3-design-pending |
| SA-20 | Support reports | tab | /admin/operations/support | v3-design-pending |
| SA-21 | Support report | page | /admin/operations/support/[reportId] | v3-design-pending |
| SA-22 | Access ending & renewals | tab | /admin/operations/access-ending | v3-design-pending |

Excluded: SA-04 (Decline a request), SA-05 (Record payment / activate manually), SA-08 (Create an institution directly), SA-09 (Content allocation page), SA-23 (Platform reports), SA-24 (Platform settings), SA-25 (Student feedback views / analytics).

## Institute Admin - 19 designed IDs

| ID | Registered screen | Type | v46 proposed route | V3 design state |
| --- | --- | --- | --- | --- |
| IA-01 | Overview | page | /institute | v3-seed-source-received |
| IA-02 | Content access | page | /institute/content-access | v3-seed-source-received |
| IA-03 | Access plan / course detail | page | /institute/content-access/plans/[planId] | v3-design-pending |
| IA-04 | Student access | page | /institute/student-access | v3-design-pending |
| IA-05 | Give students access (guided) | step | /institute/student-access/give?step=1… | v3-design-pending |
| IA-06 | Students | tab | /institute/people?tab=students | v3-design-pending |
| IA-07 | Student record | page | /institute/people/students/[studentId] | v3-design-pending |
| IA-08 | Faculty | tab | /institute/people?tab=faculty | v3-design-pending |
| IA-09 | Faculty record (incl. courses taught) | page | /institute/people/faculty/[facultyId] | v3-design-pending |
| IA-10 | Add a student / Add a faculty member | step | /institute/people/add | v3-design-pending |
| IA-11 | Import students (CSV) | step | /institute/people/import | v3-design-pending |
| IA-13 | Groups | tab | /institute/people?tab=groups | v3-design-pending |
| IA-14 | Group (create · members · access) | page | /institute/people/groups/[groupId] · /new | v3-design-pending |
| IA-15 | Faculty courses (who teaches what) | tab | /institute/people?tab=faculty-courses | v3-design-pending |
| IA-16 | Course codes (institution code + optional semester) | tab | /institute/content-access?tab=course-codes | v3-design-pending |
| IA-17 | Requests to BITS (renewal · additional licences) | page | /institute/requests | v3-design-pending |
| IA-18 | Device requests | tab | /institute/requests?tab=devices | v3-design-pending |
| IA-19 | Device request — review & forward | page | /institute/requests/devices/[transferId] | v3-design-pending |
| IA-20 | Usage | page | /institute/usage | v3-design-pending |

Excluded: IA-12 (Invitations / account activation), IA-21 (Reports page), IA-22 (Institution settings (incl. institution sign-in / SSO)).

## Student - 19 designed IDs

| ID | Registered screen | Type | v46 proposed route | V3 design state |
| --- | --- | --- | --- | --- |
| ST-01 | Home | page | /student | v3-design-pending |
| ST-02 | My courses | page | /student/courses | v3-design-pending |
| ST-03 | Course (student view) | page | /student/courses/[courseId] | v3-design-pending |
| ST-04 | All my experiments | tab | /student/courses?tab=experiments | v3-design-pending |
| ST-05 | Experiment (hub: Overview · Resources · Simulation · Assessment · Progress) | page | /student/experiments/[experimentId] | v3-design-pending |
| ST-06 | Resources | tab | /student/experiments/[experimentId]/resources | v3-design-pending |
| ST-07 | Simulation — choose a format | tab | /student/experiments/[experimentId]/simulation | v3-design-pending |
| ST-08 | WEB simulation (launch / resume) | page | /student/experiments/[experimentId]/simulation/web | v3-design-pending |
| ST-09 | AR / VR / MR format (setup & progress) | page | /student/experiments/[experimentId]/simulation/[format] | v3-design-pending |
| ST-10 | Progress for this experiment | tab | /student/experiments/[experimentId]/progress | v3-design-pending |
| ST-11 | Assessments | page | /student/assessments | v3-design-pending |
| ST-12 | Assessment — before you start | page | /student/assessments/[assessmentId] | v3-design-pending |
| ST-13 | Assessment attempt | step | /student/assessments/[assessmentId]/attempt | v3-design-pending |
| ST-14 | Result | page | /student/assessments/[assessmentId]/result | v3-design-pending |
| ST-15 | Progress (all experiments) | page | /student/progress | v3-design-pending |
| ST-16 | Format feedback | step | /student/experiments/[experimentId]/feedback/[format] | v3-design-pending |
| ST-17 | Feedback sent (confirmation, read-only) | state | /student/experiments/[experimentId]/feedback/[format] (sent state) | v3-design-pending |
| ST-18 | My device (AR/VR/MR holders only) | page | /student/device | v3-design-pending |
| ST-19 | Experiment not available (refusal page) | state | /student/experiments/[experimentId] (not-available state) | v3-design-pending |

Excluded: ST-20 (Signed-in catalogue).

## Faculty - 21 designed IDs

| ID | Registered screen | Type | v46 proposed route | V3 design state |
| --- | --- | --- | --- | --- |
| FA-01 | Overview | page | /faculty | v3-design-pending |
| FA-02 | My courses | page | /faculty/courses | v3-design-pending |
| FA-03 | Course (teaching view) | page | /faculty/courses/[courseId] | v3-design-pending |
| FA-04 | Experiments | tab | /faculty/courses?tab=experiments | v3-design-pending |
| FA-05 | Experiment (teaching view) | page | /faculty/experiments/[experimentId] | v3-design-pending |
| FA-06 | Assessments | page | /faculty/assessments | v3-design-pending |
| FA-07 | Create assessment (guided) | step | /faculty/assessments/new?step=1…4 | v3-design-pending |
| FA-08 | Assessment · Summary | tab | /faculty/assessments/[assessmentId] | v3-design-pending |
| FA-09 | Assessment · Questions | tab | /faculty/assessments/[assessmentId]/questions | v3-design-pending |
| FA-10 | Assessment · Settings | tab | /faculty/assessments/[assessmentId]/settings | v3-design-pending |
| FA-11 | Assessment · Preview | tab | /faculty/assessments/[assessmentId]/preview | v3-design-pending |
| FA-12 | Assessment · Submissions | tab | /faculty/assessments/[assessmentId]/submissions | v3-design-pending |
| FA-14 | Question bank (tabs: Questions · Drafts to review) | page | /faculty/question-bank | v3-design-pending |
| FA-15 | Add / edit question | page | /faculty/question-bank/new · /faculty/question-bank/[questionId] | v3-design-pending |
| FA-16 | Draft questions with assistance | step | /faculty/question-bank/draft | v3-design-pending |
| FA-17 | Import questions (CSV / XLSX) | step | /faculty/question-bank/import | v3-design-pending |
| FA-18 | Marking queue | page | /faculty/marking | v3-design-pending |
| FA-19 | Mark a submission | page | /faculty/marking/[attemptId] | v3-design-pending |
| FA-20 | Students (progress + follow-up) | page | /faculty/students | v3-design-pending |
| FA-21 | Student detail (per experiment) | page | /faculty/students/[studentId] | v3-design-pending |
| FA-22 | Export progress (CSV) | action | (action) Export CSV on FA-20 / FA-12 | v3-design-pending |

Excluded: FA-13 (Make available to students), FA-23 (Reports page), FA-24 (Faculty settings).

## Vendor - 10 designed IDs

| ID | Registered screen | Type | v46 proposed route | V3 design state |
| --- | --- | --- | --- | --- |
| VE-01 | Overview | page | /vendor | v3-design-pending |
| VE-02 | My experiments (all, any status) | page | /vendor/experiments | v3-design-pending |
| VE-03 | Create experiment · Course & description | step | /vendor/experiments/new?step=course | v3-design-pending |
| VE-04 | Create experiment · Formats & delivery | step | /vendor/experiments/[submissionId]/edit?step=formats | v3-design-pending |
| VE-05 | Create experiment · Preview & documents | step | /vendor/experiments/[submissionId]/edit?step=preview | v3-design-pending |
| VE-06 | Check & submit | step | /vendor/experiments/[submissionId]/edit?step=submit | v3-design-pending |
| VE-07 | Experiment record (status, details, timeline) | page | /vendor/experiments/[submissionId] | v3-design-pending |
| VE-08 | Revise & resubmit (after a return) | step | /vendor/experiments/[submissionId]/revise | v3-design-pending |
| VE-09 | Edit draft | step | /vendor/experiments/[submissionId]/edit | v3-design-pending |
| VE-13 | Submission & version history | tab | /vendor/experiments/[submissionId]?tab=history | v3-design-pending |

Excluded: VE-10 (Propose an update (corrected version)), VE-11 (Updates), VE-12 (Update detail), VE-14 (Add a format to a published experiment), VE-15 (Experiment packages · Technical assets · Contributor settings).

## Academic Reviewer - 6 designed IDs

| ID | Registered screen | Type | v46 proposed route | V3 design state |
| --- | --- | --- | --- | --- |
| RV-01 | Overview | page | /reviewer | v3-design-pending |
| RV-02 | Review queue | page | /reviewer/queue | v3-design-pending |
| RV-03 | Review a submission | page | /reviewer/submissions/[submissionId] | v3-design-pending |
| RV-04 | Review an update | page | /reviewer/updates/[updateId] | v3-design-pending |
| RV-05 | Reviewed by me | page | /reviewer/reviewed | v3-design-pending |
| RV-06 | Decided item (read-only) | state | /reviewer/submissions/[submissionId] (decided, read-only) | v3-design-pending |

Excluded: RV-07 (Courses in scope · Learning outcomes · Reviewer settings).

## Content Manager - 9 designed IDs

| ID | Registered screen | Type | v46 proposed route | V3 design state |
| --- | --- | --- | --- | --- |
| CM-01 | Overview | page | /content-manager | v3-design-pending |
| CM-02 | Ready to publish | page | /content-manager/ready | v3-design-pending |
| CM-03 | Publication decision | page | /content-manager/decisions/[submissionId] | v3-design-pending |
| CM-04 | Content library (all statuses incl. published) | page | /content-manager/library | v3-design-pending |
| CM-05 | Published experiment | page | /content-manager/published/[experimentId] | v3-design-pending |
| CM-06 | Edit catalogue details → opens a correction (UPD) draft pre-filled with the live fields (M-1) | step | → /content-manager/updates/[updateId] (draft, catalogue fields) | v3-design-pending |
| CM-07 | Edit a delivery link (with reason) → opens a correction (UPD) draft pre-filled with the live delivery details (M-1) | step | → /content-manager/updates/[updateId] (draft, delivery) | v3-design-pending |
| CM-08 | Corrections / updates I raised | page | /content-manager/updates · /content-manager/updates/[updateId] | v3-design-pending |
| CM-09 | Platform course codes | page | /content-manager/course-codes | v3-design-pending |

Excluded: CM-10 (Academic groupings · Governance settings).

## Public - 14 designed IDs

| ID | Registered screen | Type | v46 proposed route | V3 design state |
| --- | --- | --- | --- | --- |
| PU-01 | Landing | page | / | locked-original-landing |
| PU-02 | All engineering areas ("View all areas") | page | /areas | v3-design-pending |
| PU-03 | Engineering area | page | /areas/[areaId] | v3-design-pending |
| PU-04 | Catalogue | page | /experiments | v3-design-pending |
| PU-05 | Course | page | /courses/[courseCode] | v3-design-pending |
| PU-06 | Experiment | page | /experiments/[experimentId] | v3-design-pending |
| PU-07 | Your selection | page | /selection | v3-design-pending |
| PU-08 | Request institutional access | step | /request-access | v3-design-pending |
| PU-09 | Request sent | step | /request-access/sent | v3-design-pending |
| PU-10 | Request status | page | /requests/[requestId] | v3-design-pending |
| PU-12 | Payment (external route only) | step | /requests/[requestId]/payment | v3-design-pending |
| PU-13 | Access activated | state | /requests/[requestId] (Access active state) | v3-design-pending |
| PU-14 | How institutional access works | state | / (#for-institutions section) | locked-original-landing |
| PU-15 | Not found | page | not-found.tsx | v3-design-pending |

Excluded: PU-11 (Reply to an information request), PU-16 (About · Contact · Privacy · Terms · Accessibility).

## Entry & shared - 7 designed IDs

| ID | Registered screen | Type | v46 proposed route | V3 design state |
| --- | --- | --- | --- | --- |
| XS-01 | Sign in | page | /sign-in | v3-design-pending |
| XS-03 | Signed out / session expired | page | /signed-out | v3-design-pending |
| XS-04 | First-time activation · Forgot password | state | /sign-in (links only — flows OPEN) | v3-design-pending |
| XS-05 | Account menu: name, role, institution, Help, Sign out | menu | (top bar) account menu | v3-design-pending |
| XS-06 | Not your workspace | page | /[workspace]/not-allowed | v3-design-pending |
| XS-07 | Help & support: report a problem + my reports | page | /[workspace]/help | v3-design-pending |
| XS-08 | Institution paused / account inactive notice | state | (shell) paused / inactive banner | v3-design-pending |

Excluded: XS-02 (Choose workspace (person with several roles)).
