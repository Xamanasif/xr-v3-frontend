# Coverage register · Institute Admin · final complete-role design

Status: **FINAL — OWNER APPROVED (21 Oct 2026).** Every owned screen and its important subviews (nested pages, tabs, forms, dialogs, tables, states and phone layouts), with what the final consolidation did to it. The same register is the second board on the canvas page **Final · start here**.

| Owned screens | Subviews listed | Redesigned | Reviewed and unchanged | Pending or incomplete |
|---|---|---|---|---|
| 19 | 76 | 59 | 17 | 0 |

Words used: **REDESIGNED** = the subview now uses the final design language (the “when” column says whether that happened in refinement R1, R2 or this final pass). **REVIEWED AND UNCHANGED** = checked against the final design language at 1440, 1024, 768 and 375 and kept as delivered, because it already matched.

Excluded by the role scope and not designed: IA-12 Invitations / account activation (open, R02), IA-21 Reports (deferred, R15), IA-22 Institution settings (deferred, A-01). They have no entry or link anywhere.

## IA-01 Overview · REDESIGNED

Passes: R1 + final

| Subview or state | Status | When |
|---|---|---|
| Identity head: institution, access status, Add students, Give students access | REDESIGNED | R1 |
| Needs your attention: items with counts and one quiet action each | REDESIGNED | R1 |
| Attention lead: renewal due, renewal requested, paused, ended | REDESIGNED | R1 |
| Calm state (nothing needs attention) | REDESIGNED | R1 |
| Access-plan card: term bar, licences, experiment with format badges, links | REDESIGNED | R1 · final: plan tint |
| Approved — payment required (no plan): No content yet | REDESIGNED | R1 |

## IA-02 Content access › Experiments · REDESIGNED

Passes: R2 + final

| Subview or state | Status | When |
|---|---|---|
| Access-plan strip: plan, licences, yearly term, View plan | REDESIGNED | R2 · final: plan tint |
| Ending soon, ended and paused notes in the strip | REDESIGNED | R2 |
| Search, status filter, chips and Clear filters | REDESIGNED | R2 |
| Format key and grouped experiments table with 28 px badges | REDESIGNED | R2 |
| No match, loading, couldn’t load, no plan yet | REDESIGNED | R2 |

## IA-03 Access plan · REDESIGNED

Passes: final

| Subview or state | Status | When |
|---|---|---|
| Header: status, plan ID, request link, active since, Give students access | REDESIGNED | final |
| Plan strip: licences, yearly term, one way to ask BITS (or the renewal note) | REDESIGNED | final |
| What BITS gave your institution: course group, your code and semester, format badges | REDESIGNED | final |
| Students you’ve given access: grouped by experiment, read-only | REDESIGNED | final |
| History beside the students (below on narrow screens) | REDESIGNED | final |
| States: just activated, ending, paused, ended, no plan yet | REDESIGNED | final |

## IA-04 Student access · REDESIGNED

Passes: R1 + final

| Subview or state | Status | When |
|---|---|---|
| Toolbar: search, how given; status switch with counts; chips | REDESIGNED | R1 |
| Grouped grant table: one group per experiment, one row per student | REDESIGNED | R1 |
| Withdraw an individual grant (DL-2) and the result notice | REDESIGNED | R1 |
| Paused and ended notices; empty, no plan, loading, couldn’t load | REDESIGNED | R1 |
| Waiting note shown only while the row reads Waiting for a licence | REDESIGNED | final fix |

## IA-05 Give students access (guided) · REDESIGNED

Passes: final

| Subview or state | Status | When |
|---|---|---|
| Step indicator: every step numbered; on phones only the current step keeps its words | REDESIGNED | final |
| Step 1 experiments (formats read-only, published-not-held listed) | REVIEWED AND UNCHANGED | — |
| Step 2 students or a group, with reasons a row can’t be chosen | REVIEWED AND UNCHANGED | — |
| Your selection: plan and course once; folds into one line on narrow pages | REDESIGNED | final |
| Step 3 review and step 4 result: no repeated summary beside them | REDESIGNED | final |
| Refused while paused, after the plan ended, or before a plan exists | REVIEWED AND UNCHANGED | — |
| Validation and “access wasn’t given” failure | REVIEWED AND UNCHANGED | — |

## IA-06 People › Students · REDESIGNED

Passes: R1

| Subview or state | Status | When |
|---|---|---|
| Tabs with counts (2 × 2 on phones) | REDESIGNED | R1 |
| Toolbar, status switch, roster rows that open the record, Give access shortcut | REDESIGNED | R1 |
| Filtered, no match, no students yet, loading, couldn’t load, paused | REDESIGNED | R1 |

## IA-07 Student record · REDESIGNED

Passes: final

| Subview or state | Status | When |
|---|---|---|
| Header: ID, status, e-mail; Give this student access or Reactivate | REVIEWED AND UNCHANGED | — |
| Experiments given: compact list with formats, how given and status | REDESIGNED | final |
| About: course, group, programme, added (the separate Details panel is gone) | REDESIGNED | final |
| Account: deactivate (DL-2) and reactivate (DL-1), in the summary column | REVIEWED AND UNCHANGED | — |
| History below the experiments; summary column first on phones | REDESIGNED | final |
| States: no experiments yet, inactive, overlapping grants | REDESIGNED | final |

## IA-08 People › Faculty · REDESIGNED

Passes: final

| Subview or state | Status | When |
|---|---|---|
| Search with count, chips and Clear filters in one toolbar | REDESIGNED | final |
| Faculty list: name and e-mail, courses taught, status; row opens the record | REDESIGNED | final |
| No match and no faculty members yet | REDESIGNED | final |

## IA-09 Faculty record · REDESIGNED

Passes: final

| Subview or state | Status | When |
|---|---|---|
| Header: status, e-mail, added (Details panel folded into the header) | REDESIGNED | final |
| Courses taught: course, assigned, quiet Remove… (DL-1 with marking warning) | REDESIGNED | final |
| No courses yet, inactive, paused | REDESIGNED | final |

## IA-10 Add student / Add faculty member · REVIEWED AND UNCHANGED

Passes: reviewed

| Subview or state | Status | When |
|---|---|---|
| Form with the “adding gives no experiments” notice | REVIEWED AND UNCHANGED | — |
| Validation: format, duplicate ID, e-mail already used | REVIEWED AND UNCHANGED | — |
| Added result with next steps; refused while paused | REVIEWED AND UNCHANGED | — |

## IA-11 Import students · REDESIGNED

Passes: final

| Subview or state | Status | When |
|---|---|---|
| Guided steps in the form column (same width as Add student) | REDESIGNED | final |
| Step indicator compact on phones | REDESIGNED | final |
| Row errors in the role’s list table | REDESIGNED | final |
| Template, sample-file chooser, duplicates refused, confirm, done, failure | REVIEWED AND UNCHANGED | — |

## IA-13 People › Groups · REDESIGNED

Passes: final

| Subview or state | Status | When |
|---|---|---|
| Groups list: group and ID, members, experiments given with formats | REDESIGNED | final |
| Create group (DL-3), created notice, no groups yet | REVIEWED AND UNCHANGED | — |

## IA-14 Group · REDESIGNED

Passes: final

| Subview or state | Status | When |
|---|---|---|
| Header: GRP ID, member count once, Rename (DL-3); Add students; Give this group access | REDESIGNED | final |
| Members list with statuses in words; quiet Remove… (DL-1) | REDESIGNED | final |
| Experiments given to this group beside the members (first on phones) | REDESIGNED | final |
| Add students panel; member added after the grant; group with no members | REVIEWED AND UNCHANGED | — |
| Create group page (direct link) | REVIEWED AND UNCHANGED | — |

## IA-15 People › Faculty courses · REDESIGNED

Passes: final

| Subview or state | Status | When |
|---|---|---|
| Search with count; list with course codes, quiet Remove…, Assign a course | REDESIGNED | final |
| Assign panel beside the table from 1,060 px, one compact row below it, stacked on phones (B2-09) | REDESIGNED | final |
| Assigned, already teaches (error), last-marker warning (DL-1), no faculty, paused | REVIEWED AND UNCHANGED | — |

## IA-16 Content access › Course codes · REDESIGNED

Passes: R1

| Subview or state | Status | When |
|---|---|---|
| Course code editor: BITS code read-only beside your code and semester | REDESIGNED | R1 |
| Missing-only filter, validation, saved, paused read-only, no courses | REDESIGNED | R1 |

## IA-17 Requests to BITS · REDESIGNED

Passes: final

| Subview or state | Status | When |
|---|---|---|
| Requests list: request, what you asked for, status, last change | REDESIGNED | final: status legend line removed |
| Request detail: what you asked for, where it stands beside it, history below | REDESIGNED | final |
| States: under review, information requested, payment required, access active | REDESIGNED | final |
| Ask BITS form (renew or more licences), validation, open-renewal note | REVIEWED AND UNCHANGED | — |
| Request sent; refused while paused or before a plan exists | REVIEWED AND UNCHANGED | — |

## IA-18 Requests › Device requests · REDESIGNED

Passes: final

| Subview or state | Status | When |
|---|---|---|
| Device requests list with Review for requests waiting on you | REDESIGNED | final |
| No device request yet; paused notice | REDESIGNED | final: repeated footnote removed |

## IA-19 Device request — review & forward · REDESIGNED

Passes: final

| Subview or state | Status | When |
|---|---|---|
| What the student asked for; Your action beside it; history below | REDESIGNED | final |
| History no longer repeats the two devices | REDESIGNED | final |
| Forward to BITS (DL-1), forwarded, decided, paused, not found | REVIEWED AND UNCHANGED | — |

## IA-20 Usage · REDESIGNED

Passes: final

| Subview or state | Status | When |
|---|---|---|
| By experiment and format: figures per format; three figures side by side on phones | REDESIGNED | final |
| What the figures mean beside the figures | REDESIGNED | final |
| By course; no activity yet; paused; ended; no plan | REDESIGNED | final |

## Shared surfaces used inside the role (borrowed, not owned)

| Surface | Subview | Status |
|---|---|---|
| XS-07 Help & support (borrowed) | My reports list moved onto the role’s list table; content unchanged | REDESIGNED · final |
| XS-07 Help & support (borrowed) | Report a problem, sent, report detail | REVIEWED AND UNCHANGED |
| XS-05 Account menu (borrowed) | Name, role, institution, Help, Sign out | REVIEWED AND UNCHANGED |
| XS-03 Signed out (borrowed) | Public header and one message column | REVIEWED AND UNCHANGED |
| Shell Rail, top bar, Menu drawer on narrow screens | Workspace shell from the foundation | REVIEWED AND UNCHANGED |
| DL-1 · DL-2 · DL-3 Dialogs | Confirm, confirm with reason, small edit; file chooser | REVIEWED AND UNCHANGED |

Borrowed surfaces follow the shared XS contract with V3 tokens and are replaced by the delivered XS components at assembly (ASSEMBLY PENDING XS).
