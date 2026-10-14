# Permission coverage — the 347 candidate rows (WP-0.16)

Source: `docs/v46/permission-matrix.json` (audit evidence, SHA-256 pinned by the repository scan:
`34826fec…b3fa`). Coverage in code: `packages/domain/src/policy/matrix.test.ts` reads this file and
checks every row against the policy (`may` / `availableActions` / `canRead`, `OPEN_CAPABILITIES`,
system writers). **These are candidate permissions.** A row's status is the audit's: CONFIRMED
(drawn or owner-stated), PROVISIONAL (an engineering reading pending the owner) or UNRESOLVED. Phase 0
implements the rows as stated and approves none of them; no PROVISIONAL or UNRESOLVED row became
approved because its interim behaviour passes a test.

## Counts

| Kind | Rows | CONFIRMED | PROVISIONAL | UNRESOLVED |
|---|---|---|---|---|
| ALLOW | 103 | 76 | 27 | 0 |
| DENY | 156 | 68 | 78 | 10 |
| READ | 62 | 30 | 20 | 12 |
| OPEN | 15 | 0 | 0 | 15 |
| SYSTEM | 11 | 2 | 5 | 4 |
| **Total** | **347** | **176** | **130** | **41** |

Rows carrying a stakeholder ↔ v46 conflict flag: 22 (built per v46 and flagged; the conflict stays open until the owner decides it, and the build changes no row's status).

## The 15 OPEN rows — never offered by the build (policy answers `policy-open`)

| Row | Entity | Action | Roles | Decision ids | Decided in (Appendix G §D.10) |
|---|---|---|---|---|---|
| REQ-19 | REQ | Narrow a multi-experiment request (per experiment / per format) | Super Admin | — | P1-07 |
| REQ-22 | REQ | Resolve a request stuck in 'Payment not confirmed' | Super Admin | R06, T-05 | P1-06 |
| INST-06 | INST | Replace or remove an existing Institute Admin | Super Admin | — | P1-09 |
| SACC-08 | SACC | Withdraw or change a group grant | Institute Admin | OD-B2-01 | P2-05 |
| PER-07 | PER | Deactivate / reactivate a faculty member | Institute Admin | — | P2-08 |
| PER-08 | PER | Edit a person's details | Institute Admin | ND-04 | P2-08 |
| CC-06 | CCODE | Edit platform codes when the CM's ROLE scope is limited to a course or experiment | Content Manager | — | P5-06 |
| ASMT-17 | ASMT | Co-teaching Faculty edit settings or questions, or confirm marks, on a shared assessment | Faculty | OD-B4-17 | P4-03 |
| Q-11 | Q | Choose which experiment a new or imported question belongs to when teaching several | Faculty | — | P4-03 |
| ATT-17 | ATT | Confirm marks per written answer or per attempt when an attempt has several written questions | Faculty | — | P4-04 |
| DTR-09 | DTR | Resolve a request at an institution with no Institute Admin | Super Admin, Institute Admin | OD-B3-05 | P3-03 |
| SUB-35 | SUB | Override to other targets (e.g. stuck with the Content Manager, other stuck causes) | Super Admin | OD-B7-09 | SC-03 |
| ROLE-11 | ROLE | Effect of an 'All experiments' or 'one experiment' scope on a Vendor's workspace (course list for Create experiment; what the Vendor may start or edit) | Vendor | — | P5-03 |
| SUP-04 | SUP | Reopen own resolved report | Student, Faculty, Institute Admin, Vendor, Academic Reviewer, Content Manager, Super Admin | — | P0-30 |
| SES-09 | SESSION | Sign in while the account is inactive (Faculty) | Faculty | — | P2-08 |

## The 11 SYSTEM rows — written only by system writers (stand-in ports / handlers), never by a person

| Row | Entity | Action | Status | Decision ids |
|---|---|---|---|---|
| ACC-02 | ACC | Activate access after payment is confirmed — external route | PROVISIONAL | T-05, R06 |
| ACC-06 | ACC | Move a plan to Ending soon (≤15 days) / 'Reminder due' / Access ended at term | PROVISIONAL | T-31 |
| GRP-05 | GRP | Effect of removing a member on group-given access and history | UNRESOLVED | — |
| RUN-08 | RUN | Report runtime activity (started, sessions, last saved) | PROVISIONAL | T-12, OD-B3-07 |
| CMP-01 | CMP | Set 'Completed {date}' for a format (simulation / headset completion event) | CONFIRMED | T-12, A-06, R12 |
| ATT-07 | ATT | Mark choice / true-false answers automatically ('Marked automatically') | UNRESOLVED | — |
| ATT-13 | ATT | Release a result at the time set on the assessment (immediately after marking · after the deadline · on a date) | PROVISIONAL | OD-B4-04, T-19 |
| SUB-10 | SUB | Route a resubmission | PROVISIONAL | OD-B5-05, REG-VE-08-NEXT-GATE |
| UPD-21 | UPD | Effects of a Hold beyond the live version (does it block later corrections?) | UNRESOLVED | OD-B7-04, T-28 |
| ROLE-09 | ROLE | Effect of a scope withdrawal on in-flight work (SUB under review or published; UPD in review; reviewer queue items) | UNRESOLVED | OD-B5-01, OD-B7-15, OD-B6-01 |
| XC-03 | XC | Record a reason with every DL-2 action and show it to the person affected | CONFIRMED | — |

## The 41 UNRESOLVED rows and where each is decided

| Row | Kind | Entity | Action | Decision ids | Decided in |
|---|---|---|---|---|---|
| SEL-05 | DENY | SEL | See 'Your institution already has this' / 'Request additional licences' on public pages | T-01, R01, D26 | SC-13 |
| REQ-05 | READ | REQ | Return to the status page later (cold visit, other device) and be identified as the requester | T-01, R01 | P1-02 |
| REQ-06 | DENY | REQ | Reply to 'Information requested' | T-03, PU-11, OD-B3-10 | P1-05 |
| REQ-18 | DENY | REQ | Decide a request after 'Information requested' | T-03 | P1-05 |
| REQ-19 | OPEN | REQ | Narrow a multi-experiment request (per experiment / per format) | — | P1-07 |
| REQ-22 | OPEN | REQ | Resolve a request stuck in 'Payment not confirmed' | R06, T-05 | P1-06 |
| INST-05 | DENY | INST | Assign Institute Admin before access is active (Approved — payment required) | OD-B7-11, T-11 | P1-08 |
| INST-06 | OPEN | INST | Replace or remove an existing Institute Admin | — | P1-09 |
| INST-10 | DENY | INST | Terminate / delete an institution | — | SC-11 |
| INST-13 | DENY | INST | Change People (add, import, deactivate/reactivate), Groups, Faculty courses or Requests to BITS while paused | — | P2-07 |
| ACC-07 | DENY | ACC | Send the 15-day expiry reminder | T-31, ND-16, T-34 | SC-01 |
| ACC-09 | READ | ACC | Read 'Waiting for a licence' on a grant (seeded state, never computed) | T-06, D7 | P2-01 |
| SACC-08 | OPEN | SACC | Withdraw or change a group grant | OD-B2-01 | P2-05 |
| SACC-11 | DENY | SACC | Withdraw a grant after the plan has ended | — | P2-06 |
| SACC-14 | READ | SACC | Read earlier work after the only grant is withdrawn or access has ended | — | P2-06 |
| SACC-15 | READ | SACC | Open an experiment through a remaining group grant after the individual grant is withdrawn (overlap) | OD-B2-01, OD-B2-03 | P2-02 |
| SACC-16 | READ | SACC | Receive a group's experiments when added to the group after the grant | OD-B2-02 | P2-03 |
| GRP-05 | SYSTEM | GRP | Effect of removing a member on group-given access and history | — | P2-04 |
| PER-07 | OPEN | PER | Deactivate / reactivate a faculty member | — | P2-08 |
| PER-08 | OPEN | PER | Edit a person's details | ND-04 | P2-08 |
| CC-06 | OPEN | CCODE | Edit platform codes when the CM's ROLE scope is limited to a course or experiment | — | P5-06 |
| RUN-15 | DENY | RUN | See time spent / durations / technology used per attempt | OD-B3-07, OD-B3-08 | SC-10 |
| ASMT-17 | OPEN | ASMT | Co-teaching Faculty edit settings or questions, or confirm marks, on a shared assessment | OD-B4-17 | P4-03 |
| ASMT-15 | READ | ASMT | See / start an assessment that has no questions | T-18, OD-B4-02 | P4-02 |
| Q-10 | READ | Q | Own the question bank: per Faculty member or shared per experiment / institution | OD-B4-17 | P4-03 |
| Q-11 | OPEN | Q | Choose which experiment a new or imported question belongs to when teaching several | — | P4-03 |
| ATT-07 | SYSTEM | ATT | Mark choice / true-false answers automatically ('Marked automatically') | — | P4-01 |
| ATT-14 | DENY | ATT | Release a result manually (a Release control on FA-12) | OD-B4-04 | HB-01 |
| ATT-17 | OPEN | ATT | Confirm marks per written answer or per attempt when an attempt has several written questions | — | P4-04 |
| DTR-09 | OPEN | DTR | Resolve a request at an institution with no Institute Admin | OD-B3-05 | P3-03 |
| SUB-15 | READ | SUB | See other users' submissions in the same Vendor organisation | — | P5-02 |
| SUB-35 | OPEN | SUB | Override to other targets (e.g. stuck with the Content Manager, other stuck causes) | OD-B7-09 | SC-03 |
| SUB-38 | READ | SUB | See who returned it and why after an SA override | OD-B7-09 | P6-04 |
| UPD-17 | READ | UPD | See the Content Manager's withdraw reason | OD-B6-06 | P6-03 |
| UPD-21 | SYSTEM | UPD | Effects of a Hold beyond the live version (does it block later corrections?) | OD-B7-04, T-28 | P6-01 |
| ROLE-08 | READ | ROLE | Hold the Vendor course scope on the person vs the Vendor organisation | T-29, OD-B5-01 | P5-02 |
| ROLE-09 | SYSTEM | ROLE | Effect of a scope withdrawal on in-flight work (SUB under review or published; UPD in review; reviewer queue items) | OD-B5-01, OD-B7-15, OD-B6-01 | P5-04 |
| ROLE-11 | OPEN | ROLE | Effect of an 'All experiments' or 'one experiment' scope on a Vendor's workspace (course list for Create experiment; what the Vendor may sta | — | P5-03 |
| SUP-04 | OPEN | SUP | Reopen own resolved report | — | P0-30 |
| SUP-07 | READ | SUP | See problem reports raised by other people at the institution | — | P2-11 |
| SES-09 | OPEN | SESSION | Sign in while the account is inactive (Faculty) | — | P2-08 |

## By entity

| Entity | Rows | ALLOW | DENY | READ | OPEN | SYSTEM |
|---|---|---|---|---|---|---|
| SEL | 6 | 1 | 5 | 0 | 0 | 0 |
| REQ | 30 | 9 | 15 | 4 | 2 | 0 |
| INST | 16 | 4 | 8 | 3 | 1 | 0 |
| ACC | 11 | 1 | 3 | 5 | 0 | 2 |
| SACC | 20 | 3 | 10 | 6 | 1 | 0 |
| GRP | 8 | 4 | 2 | 1 | 0 | 1 |
| PER | 18 | 6 | 7 | 3 | 2 | 0 |
| FCM | 6 | 2 | 2 | 2 | 0 | 0 |
| CCODE | 9 | 3 | 4 | 1 | 1 | 0 |
| RUN | 16 | 4 | 7 | 4 | 0 | 1 |
| CMP | 5 | 0 | 4 | 0 | 0 | 1 |
| FB | 6 | 2 | 3 | 1 | 0 | 0 |
| ASMT | 17 | 5 | 7 | 4 | 1 | 0 |
| Q | 11 | 6 | 3 | 1 | 1 | 0 |
| ATT | 23 | 7 | 10 | 3 | 1 | 2 |
| DTR | 15 | 3 | 10 | 1 | 1 | 0 |
| SUB | 40 | 14 | 16 | 8 | 1 | 1 |
| LO | 6 | 1 | 4 | 1 | 0 | 0 |
| EXP | 12 | 0 | 8 | 4 | 0 | 0 |
| UPD | 26 | 11 | 11 | 3 | 0 | 1 |
| AREA/CRS | 9 | 5 | 3 | 1 | 0 | 0 |
| ROLE | 14 | 5 | 4 | 3 | 1 | 1 |
| SUP | 9 | 3 | 2 | 3 | 1 | 0 |
| SESSION | 10 | 4 | 5 | 0 | 1 | 0 |
| XC | 4 | 0 | 3 | 0 | 0 | 1 |
