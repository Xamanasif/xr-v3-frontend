# Handoff · Institute Admin · final complete-role design · V3 Refined B

For the Claude Code integration owner. This is a presentation migration: bind these screens to the application's existing routes, services, commands, validation, revisions and outcome flags. Keep the app's shared world and its facts; never paste the preview's sample worlds over application data (common/01 §7, common/03).

**One design.** Every owned screen in this package uses its final layout. The earlier looks (the complete role as delivered on 18 Oct 2026, refinement R1 and IA-02 R2) no longer exist as alternatives in the source: there is no look switch, no `ia-role-r1.css` or `ia-role-r2.css`, and no reference boards on the canvas. Build only what is here.

**Status: FINAL — OWNER APPROVED (21 Oct 2026).** This is the design to integrate. The owner kept the plan tint and asked for one change, carried out before approval was recorded: internal record ids no longer appear in ordinary labels (§ 10).

## 1. Sources and authority

| Question | Source used |
|---|---|
| Screen identity, states, behaviour | v46 boards B2-01 … B2-09, B3-08, B3-09, B3-10 and their handoff (B8-07, B8-08) |
| Visual and interaction baseline | V3 Refined B: core.css, rb.css, rb-kit.css, IA01.dc.html, IA02.dc.html, HANDOFF-original.md |
| Later interims that override v46 | common/03 (identity-collision protection, device transfer as authorisation, local persistence) |
| Scope | ROLE-SCOPE.json: 19 owned IDs; IA-12, IA-21, IA-22 excluded |
| Visual refinement decisions | Owner feedback on the delivered role; refinement R1 (IA-01, IA-04, IA-06, IA-16); the IA-02 correction (R2); the final complete-role brief (one consistent language for all 19 screens). R1 and R2 were reviewed checkpoints, not approvals of the whole role. |

Proposed v46 routes are kept as hash identifiers on links (for example `#/institute/people/students/GIT-2026-0418`). They identify screens; they are not route instructions.

## 2. Shell, navigation and shared surfaces

- Same V3 shell as the seeds: 248px navy rail (Overview, Content access, Student access, People, Requests, Usage; Help & support at the rail foot), top bar with date and account button, drawer below 1024px with focus trapped, Escape to close and focus returned to Menu.
- No count badge on Requests (v46 DEV-17). Excluded IA-12/21/22 have no entry anywhere.
- Shared, **borrowed** (owner XS; replace with the delivered XS components at assembly): account menu XS-05 (name, role, institution, Help & support, Sign out), Help & support XS-07 (My reports, Report a problem with validation, Report sent, report detail), Signed out XS-03, paused notice XS-08 (banner "Your institution's access is paused — your work is kept." with Help on every page while paused). The borrowed Help list uses the role's list table so it doesn't look foreign until XS delivers; its content is unchanged.
- Every workspace page has a title, at most one primary (gold) action, flash messages with `role="status"` after a change, and moves focus to the result (flash, heading or dialog field).

## 3. Screen behaviour and final layout

Layout notes say what the final design puts where. Behaviour is the delivered behaviour unless a note says otherwise; no rule, permission, record or state was added or removed in the redesign.

### IA-01 Overview
- **Layout:** compact identity head (institution, access status, plan line, actions Add students and Give students access); "Needs your attention" list (count tile, the item in words, one quiet action); access-plan card on the **plan tint** with the yearly term bar, licences, term, the experiment with compact WEB · AR · VR · MR badges and a key in words, and links. One column below 860px of page width, the plan card after the attention list.
- "Needs your attention" items are computed from the same records the linked pages show, each counted once: students waiting for a licence → Student access filtered to Waiting; device requests to forward → Device requests; students with no access yet → People filtered to No access yet; experiments not given to anyone → Give access with the experiment chosen; courses without an institution code → Course codes; written answers with no faculty marker → Faculty courses; open problem reports → report detail.
- Lead band: ending soon → "Request a renewal" (reminder due, nothing sent); ended → "Access plan … has ended" with Request renewal; renewal already requested → "Renewal requested" with View request; paused → "BITS has paused your institution's access" with Help, and no other items.
- Calm state when nothing needs attention. Awaiting payment: "No content yet" with View request status. Give students access is hidden when paused, ended or awaiting.

### IA-02 Content access › Experiments, and IA-16 Course codes
- **Layout:** one plan strip on the **plan tint** (plan ID and status, "120 licences, as approved by BITS", the term bar with days left, View plan); ending, ended and paused notes as slim bands inside it with Request renewal where it applies. Then one list surface: search and status filter in one row, a one-line format key, and a table grouped by course (BITS code, course name, your course code or "Your course code: not added" with Add code). One row per experiment: name and status · 28px format badges · students given access (link) · Give access (secondary). The header's Give students access is secondary here so each row's action reads as the clear one.
- Format badges: solid navy with a tick = in your plan; dashed outline = published, not in your plan; muted grey = not published. Each badge carries its full meaning as its accessible name and hover title. The student count, the plan's licences and a format's publication status stay in separate places with separate labels; no used or free licence counts (D7).
- "Students given access" = the visible Student access rows for that experiment; the link opens Student access filtered to it. Search (experiment, course, course name, your code) and Status filter with chips and Clear filters; no-match ("Show all experiments"), loading, failed with Try again; no plan yet.
- **Course codes tab (IA-16):** one block per course in the plan: the BITS course code read-only beside your institution's code and an optional semester, a live "Students and faculty see …" line, a save bar with an unsaved-changes state and Undo, an explainer beside it. Save validates "Add your course code, or clear the semester". Show missing codes only. Read-only while paused. Saving updates the Overview item and every place the code appears.

### IA-03 Access plan
- **Layout:** breadcrumbs (Content access › Access plan); head "Your access plan" with status, plan ID, From request REQ-… (link) and Active since; Give students access (primary). A strip on the **plan tint**: licences "as approved by BITS", the yearly term bar, and one place to ask BITS ("Need more, or a renewal? Ask BITS from Requests", only while the plan is active); the footnote "Licences and term are as BITS approved them. Giving or withdrawing access doesn't change what is shown here." Ending, ended and paused notes replace the ask line (ended: "Students can't open its experiments now. Your records stay here." with Request renewal; paused: you can't give or withdraw access or ask BITS until the pause is lifted).
- "What BITS gave your institution": one table per course group (BITS code and course; your code and semester, or not added with Add code), one row per experiment with its format badges. Plan → course → experiment → formats stay distinct.
- "Students you've given access": read-only, grouped by experiment (experiment, course code, formats, count), one row per student with how given and status in words; Open Student access. History (request, approval, activation, grants, withdrawals, pause, end) beside it; below it under 860px.
- A student whose row reads Access ended never also shows a waiting-for-a-licence note (the note appears only while the row reads Waiting for a licence).

### IA-04 Student access
- **Layout:** search and How given in one row; the status as the V3 segmented switch with counts (Current, each status, Withdrawn); chips with "Showing x of y" and Clear filters; one table group per experiment (title, course code, formats once in the heading, count), one row per student × experiment. The group-grant rule is said once below the table.
- Row: student, how given (Individually, or Group: name, with the date it was given), status in words (Active · Waiting for a licence · Student inactive · Individual grant withdrawn · Removed from the group · Withdrawn · Access ended · Paused). The "No licence is available right now" note shows only on rows whose status reads Waiting for a licence.
- **Withdraw…** exists only on an individual grant (DL-2, reason required, kept in the access history). If the student also has the experiment through a group grant, the dialog names that grant and says it is not changed. Group grants are changed on the group page ("Change on the group"). No claim is made about whether the student can still open it through the other grant (OD-B2-01). The Withdrawn segment shows withdrawn grants muted, without Withdraw.
- Paused: read-only notice, no Withdraw. Ended: "Your access plan has ended" with Request renewal; rows show Access ended. New institution: empty state with Give students access. No-match: "Show all current grants".

### IA-05 Give students access (3 steps + result)
- **Layout:** numbered step indicator (done, current, later); on phones every step keeps its number and only the current step keeps its words. "Your selection" (access plan and course, experiments, formats, who) sits beside steps 1 and 2 on wide pages; below 860px it folds into one line under the step indicator ("1 experiment · 2 students") that opens to the same summary. The review and the result already say all of it, so no summary sits beside them; they keep the same column width as the steps.
1. **Experiments** held in the plan, with formats from the plan ("Inherited from the access plan — not chosen here"). Other published experiments of the same course are listed as "not in your access plan" and can't be chosen. For a group, experiments that group already has are disabled with "Already given to {group}".
2. **Students or a group** (pick list with search). Inactive students and students who already have every chosen experiment are disabled with the reason; partial overlap says "gets the rest". Groups without members, or with every chosen experiment, are disabled with the reason.
3. **Review**: what will be created, line by line (Active, or Waiting for a licence when the service says no licence is available). For a group: members who can open it straight away, members waiting, members who already have it individually or through another group ("That grant isn't changed"), inactive members.
- **Give access** → result page listing each grant id and status, links to the student or group, and View Student access / Give more access. Failure: "Access wasn't given. Nothing was changed. Try again." Busy state on the button.
- Refusals instead of the flow: no plan (awaiting payment), paused, ended. No licence arithmetic: "Waiting for a licence" is a service outcome in the sample, never computed from 120.

### People: IA-06 Students, IA-08 Faculty, IA-13 Groups, IA-15 Faculty courses (tabs)
- **Tabs** with counts (Students, Faculty, Groups, Faculty courses); a 2 × 2 grid on phones so every tab is visible.
- **IA-06 Students (layout):** search and group select in one row, status segments with counts, roster Student · Group · Access · Action where the whole row opens the record; "Give access" on No access yet rows opens Give students access with that student chosen. Status words: Access active · Waiting for a licence · No access yet · Joined a group after its grant · Individual grant withdrawn · Removed from a group · Inactive · Paused · Access ended. No-match ("Show all students"), loading, failed, empty (Add student / Import students).
- **IA-08 Faculty (layout):** one toolbar (search "name or e-mail" with a count beside it, chips and Clear filters), a list table: name (opens the record) with e-mail, courses taught (course code + name, or "No courses yet"), status. Add faculty member. No-match and empty states.
- **IA-13 Groups (layout):** list table: group name (opens the group), members, experiments given with their format badges or "None yet". Create group (DL-3 name; empty and duplicate name validation; flash links to the group). Empty state.
- **IA-15 Faculty courses (layout):** the list (search with count; who teaches what: name and e-mail, course codes each with a quiet Remove…, status, Assign a course) and an assign panel. The panel sits beside the table when the content area is at least 1,060px wide, becomes one compact row (faculty member, course, Assign course) under the table below that, and stacks on phones (B2-09). A row's Assign a course fills in that person and moves focus to the course field. Errors "Choose a faculty member", "Choose a course", "{name} already teaches {course}". Remove a course (DL-1) warns when written answers would be left without a marker. Assigning a course never gives students access.

### IA-07 Student record
- **Layout:** head "Student · {ID}", name, status and e-mail once; Give this student access (opens IA-05 with the student chosen) or Reactivate. Main column "Experiments given": a compact list (experiment with course code and formats · how given · status in words, with its reason note under the status); footnote "Formats come from access plan ACC-…; they are never chosen per student." Summary column: About (course, group(s) linked to the group page, programme, added) and Account (Deactivate…). History below the experiments. On phones: experiments, then About and Account, then History. The separate Details panel of the delivered role is folded into About and the head (nothing was dropped).
- Deactivate (DL-2 reason) and Reactivate (confirm). Inactive notice with who, when and why. Missing record: "This student isn't in People".

### IA-09 Faculty record
- **Layout:** head "Faculty", name, status, e-mail and "Added {date}" once; Assign a course (opens Faculty courses with the person chosen). One surface "Courses taught" (Open Faculty courses): course code and name with "Your course code …", Assigned date and FMAP id, quiet Remove… (DL-1 with the marking warning); footnote that these courses set what the person sees in the Faculty workspace and never give students access.
- No courses yet; inactive faculty can't be assigned courses; paused read-only; missing record.

### IA-14 Group
- **Layout:** head "Group", name, member count once, Rename (DL-3); Add students and Give this group access. The add panel (pick list) opens under the head. Members table (student, status in words, quiet Remove…) with "Experiments given to this group" beside it (experiment and course code, formats, status, "Given {date} · SACC-…", and the note on members' statuses); on phones the group's grants come first. Give this group access appears only when the group has members and the plan holds an experiment the group doesn't have yet.
- Member status words: Can open it · Waiting for a licence · Has it individually · Individual grant withdrawn · Added after the group grant · Inactive. Remove a member (DL-1 destructive; the student record stays in People). Students added after a group grant show "Added after the group grant"; whether the grant reaches them is not decided (OD-B2-02). Empty group. Create group page for `/new`.

### IA-10 Add student / Add faculty member (reviewed, unchanged)
- Student fields: full name, institution e-mail, student ID (required); programme and group optional (OD-B2-04 keeps v46 AR-8 fields). Faculty: full name and e-mail. Form column up to 860px wide, two fields per row from 640px.
- Validation on submit, error summary with links, errors on fields. E-mail must be a full address; the example is built from the institution's own domain (`name@{institution domain}`), never a fixed domain.
- **Identity collision refuses safely:** an e-mail that belongs to anyone in People, or is already used to sign in to the platform, is refused and nothing is changed; a student ID already in use is refused naming the existing student. Existing records are never overwritten.
- Adding never gives experiments or courses; no invitation or e-mail is sent (T-11). Done state with Give this student access / Assign a course, Add another, Back.

### IA-11 Import students (CSV)
- **Layout:** the same step indicator as Give students access, inside the same form column as Add student; row errors in the role's list table (row, student, what to fix, type).
1. **Choose a file**: template columns `student_id, full_name, email, programme, course, course_code`; header-only template download; sample files in the preview, or a local `.csv` (≤1 MB, first 500 rows checked; read in the browser only).
2. **Check rows**: row-level report. Errors block the whole import (T-24 interim). Checks: required values, full e-mail, duplicate IDs or e-mails inside the file, IDs or e-mails already in People or used to sign in (refused, existing records unchanged). Row numbers count from the first student row.
3. **Confirm import** → done page listing who was added (no experiments yet), Give students access, View students, Import another file.
- Course codes in the file are matched to the BITS code or your institution's code; unknown codes are not validated in the preview (open).

### IA-17 Requests to BITS, IA-18 Device requests, IA-19 Review and forward
- **Requests list (layout):** list table: request id and type (New access · Renewal · More licences), what you asked for, status (Under review · Information requested · Approved — payment required · Access active), last change; footnote "Licences are shown as requested and approved by BITS."
- **New request (reviewed, unchanged):** Renew access plan (mirrors the current plan, T-07) or More licences (experiments held + whole number of licences, T-08 amend not offered). Optional message; contact shown. Validation summary. Sent page with the new id. Not available while paused or before a plan exists.
- **Request detail (layout):** "What you asked for" (details and the message), "Where it stands" beside it (Request · Payment · Your access plan, kept apart), History below. Information requested shows the reason and "Reply outside the platform; there is no reply form here" (T-03). Approved — payment required links to the payment step (handoff); the plan stays unchanged until payment is confirmed. No Declined state (T-02).
- **Device requests (layout):** list table: student, request (link) with DTR id and date, status (Waiting on you · Forwarded to BITS · Decided · approved by BITS), Review for waiting ones; one explanation above the list.
- **IA-19 (layout):** "What the student asked for" (format, moving from, new device, note), "Your action" beside it (Forward to BITS: confirm dialog, can't be taken back), History below (it doesn't repeat the devices). The Institute Admin forwards; BITS decides; no approve or decline here (T-32). Paused: forwarding unavailable. Partial sample record (DTR-0015) shows "Not recorded in this sample".

### IA-20 Usage
- **Layout:** By experiment and format / By course switch. One surface per experiment (title, course and formats line, "N students with access") with a figures table (Format · Started · Completed · Sessions); "What the figures mean" beside it, one line per figure. By course: one table (course, experiments given, students with access, sessions by format). On phones the three figures sit side by side with their labels above. "Figures up to {date}".
- Students with access are counted from active grants while the plan is open. Empty: No activity yet. Awaiting payment: No usage yet. Paused and ended explain that nobody counts as having access now; earlier activity stays.
- Never a completion verdict, percentage, licence usage or export (OD-B3-08).

## 4. Records and commands needed

Names below are the v46 record names. The design does not know the repository's command or DTO names; bind to the existing ones and use their returned outcome flags, revisions and repeated-command protection. Unchanged by the redesign.

| Need | Inputs | Outcome the UI shows | Refusals the UI needs |
|---|---|---|---|
| Read institution, plan (ACC), courses, catalogue, formats | — | Status, term, formats in plan, BITS and institution codes | Paused, ended, no plan |
| Save institution course code (CRS own code) | course, own code, optional semester | Saved flash; Overview item clears | Paused (read-only) |
| Give access (SACC create) | experiments + students, or experiments + group | One grant per student × experiment (or per group × experiment) with status Active or Waiting for a licence | Paused, ended, no plan, already has it, inactive student, empty group; failure leaves nothing changed |
| Withdraw individual grant (SACC withdraw) | grant id (from the row, never typed by the user), reason | Withdrawn with reason; other grants unchanged | Group grants can't be withdrawn here; paused |
| Add student / faculty (PER create) | name, e-mail, student ID, programme, group | Record created, no access | E-mail in People or used to sign in; duplicate student ID; paused |
| Import students (PER bulk create) | CSV rows | Row report; all-or-nothing import | Any row error blocks; duplicates refused |
| Deactivate / reactivate student (PER status) | student, reason (deactivate) | Inactive with reason; reactivated | Paused |
| Groups (create, rename, add members, remove member) | name; members | Group and membership changes logged | Empty or duplicate name; paused |
| Faculty course (FCM assign / remove) | faculty, course | Course listed on record and tab | Already teaches; inactive faculty; paused; warning when no marker remains |
| Request to BITS (REQ create) | renew, or more licences (experiments, number), message | New REQ "Under review"; plan unchanged | No plan; paused |
| Forward device transfer (DTR forward) | transfer id | Forwarded to BITS | Paused; not waiting |
| Problem report (SUP create, XS) | what happened, where, screenshot | Report sent with id | What happened empty |
| Usage read (RUN aggregates) | — | Started, completed, sessions per format | — |

## 5. Handoffs outside this role (documented, not live)

The preview shows these as labelled handoff pages; nothing claims to update another role's canvas.

| From | Effect | Owner |
|---|---|---|
| Give access result | Student sees the experiment with the plan's formats in My courses, or "waiting for a licence" | Student (ST-01/02/05) |
| Request detail: Approved — payment required | Public request status and payment step; only a confirmed payment activates (T-05) | Public / payment (B1-08) |
| Request sent or under review | BITS decides in Super Admin › Requests; no Declined (T-02) | Super Admin (SA-02/03) |
| Forward device transfer | Student sees "Forwarded to BITS"; BITS approves in Super Admin (SA-18/19); no decline (T-32) | Student, Super Admin |
| Faculty courses | Course appears in that person's Faculty workspace | Faculty |
| Signed out → Sign in | Sign in and session pages | XS (XS-01) |
| Problem report | Resolved and reopened by Super Admin › Support | Super Admin (SA-F8) |

## 6. Open policies (not invented here)

| Ref | Question | Safe treatment in this design |
|---|---|---|
| OD-B2-01 | Overlapping individual and group grants | Each grant shown with its own state; withdrawing names the grant it ends and says the other is unchanged; no "can / can't open" claim |
| OD-B2-02 | Do late group members receive an earlier group grant? | "Added after the group grant"; no promise |
| OD-B2-03 / D7 / T-06 | Licence counting | Licences shown only as provided by BITS; Waiting for a licence is a service outcome; no used, free or available figures |
| OD-B2-04 | Should Add student ask for programme, course and code like the CSV? | Programme optional, as v46 AR-8 |
| T-24 | Import commit mode and warnings | Errors block the whole file; no partial import; no warnings tier |
| — | Unknown course codes in an import | Not validated in the preview; needs the real course lookup |
| OD-B3-09 / T-07 / T-08 | What a renewal or more-licences request changes | Renewal mirrors the plan; more licences asks the number only; the plan stays unchanged until BITS and payment |
| OD-B3-10 / T-03 / T-02 | Replying to Information requested; Declined | Reason shown, no reply form; no Declined state |
| T-05 | Payment provider and confirmation | Provider-neutral handoff; no amount; no Mark paid |
| OD-B3-08 / T-33 | Usage figure definitions, visibility, export | Four figures defined in one line each; IA only; no export |
| T-11 / IA-12 | Invitations and activation | Not designed; "No invitation or e-mail is sent" |
| — | Pause semantics for people and requests | Read-only everywhere while paused (v46 B2-01: "Pages are read-only until BITS lifts the pause"); Help stays available |
| — | Status word for a student whose only grant was withdrawn | Shown as "No access yet" in People and counted in the Overview item, as in the IA-01 seed |

## 7. Changes from v46 and from the earlier deliveries

**From v46:** rebuilt in V3 Refined B (navy rail, ivory urgency band, plan tint, Public Sans 16/24 body, V3 buttons, fields, chips and notices). Only the V3 foundation files and `ia-role.css` are loaded; no v46 stylesheet. Usage counts are the v46 B3-10 sample figures, relabelled "figures up to" the sample world's date.

**From the IA-01 / IA-02 seeds:** connected-world differences: the seed's "Added on 15 September" becomes the computed import date (8 October 2026), and the seed's "1 student" given access becomes the count from the same records as Student access (7 in the populated world, 9 in the ending-soon world). The seeds' tall identity band and four large format tiles per experiment were replaced in R1 and R2 (compact head, attention list, compact badges).

**From the complete role delivered on 18 Oct 2026 to this final design (presentation only):**

| Screen | What changed |
|---|---|
| IA-01 | R1 layout (compact head, attention list, plan card with compact badges); final: plan card on the plan tint |
| IA-02 | R2 layout (plan strip, grouped experiments table, 28px badges); final: strip on the plan tint |
| IA-03 | Final: header with request link; plan strip; What BITS gave as a grouped table; students grouped by experiment, read-only; history beside |
| IA-04 | R1 layout (grouped by experiment, status switch with counts); final: waiting note only on rows that read Waiting for a licence |
| IA-05 | Final: compact phone step indicator; selection summary folds on narrow pages; no repeated summary beside review and result |
| IA-06, IA-16 | R1 layouts, unchanged since R1 |
| IA-07, IA-09, IA-14 | Final: record grid (main list, summary column, history after); Details panels folded into the head and About; one-line footnotes |
| IA-08, IA-13, IA-15, IA-17, IA-18, IA-20 | Final: the one list-table language (header, 22px edges, whole-row links, phone rows); toolbars with counts; IA-15 assign panel beside the table; IA-17 and IA-18 drop repeated legends and footnotes; IA-20 figures with their definitions beside them |
| IA-11 | Final: step indicator and form column shared with IA-05 and IA-10; row errors in the list table |
| IA-10, IA-17 form | Reviewed, unchanged |
| Every screen (owner approval pass, 21 Oct 2026) | Internal record ids (grant, faculty-course, group) taken out of ordinary labels; see § 9 |

Nothing else changed: rules, permissions, record IDs, grants, access-plan logic, faculty assignments, mappings, validation, dialogs, focus behaviour and copy (except the short footnote and button-label edits listed in CHECKS.md).

## 8. Accessibility and responsive rules carried into code

- Status always in words plus shape, never colour alone; format badges carry their state as their accessible name and title.
- Visible 2px focus ring; whole-row focus on link rows; focus moves to the error summary on failed submit, to the dialog's first field or safe button on open, back to the trigger on close, and to the flash or heading after a change.
- Dialogs: `role="dialog"` or `alertdialog` for destructive ones, `aria-modal`, Tab trapped, Escape closes.
- Targets ≥ 44px (row buttons 36px on desktop, 32px for the quiet Remove… beside a course chip, 44–46px and full width on phones where they are the row's action).
- One primary (gold) action per page. Row actions are secondary (outlined) when they are what the list is for (Give access on Content access, Withdraw… on Student access, Review on Device requests) and quiet (ghost) for shortcuts and upkeep (Give access on People › Students, Assign a course, Remove…). Destructive confirms are red only inside the dialog.
- Container-query reflow (no viewport scaling, thresholds measured on the container named in brackets):
  - rail becomes a drawer below 1024px of window width (foundation);
  - list tables become short phone rows below 640px of table width (`ialt`): identity with its action, then status, then the other values with inline labels where needed;
  - grouped and experiments tables: two-line rows below 860px, phone rows below 640px of surface width (`iagm`);
  - record grids (IA-03, IA-07, IA-14, IA-17 detail, IA-19, IA-20) go to one column below 860px of record width (`iarec`); Faculty courses keeps its panel beside the table only from 1,060px (`iarec`);
  - plan strip: two columns below 820px, one below 480px (`iacp`);
  - Give students access: selection summary folds below 860px of page width; step words except the current step hide below 560px (`rbpage`);
  - Overview: one column below 860px; Course codes editor one column below 900px (`rbpage`);
  - forms: two fields per row from 640px of form width (`iaform`); action bars full width on phones.
- Reduced motion respected.

## 9. Identifiers shown to people

A record id appears in the interface only where the person has to quote it to someone outside this role, or match it against something outside the screen. Everything else is identified in words.

| Shown | Why |
|---|---|
| Access plan `ACC-0107` | Quoted to BITS; printed on the approval; names the plan the licences and term belong to |
| Request `REQ-0058` | Quoted to BITS and on the payment step |
| Device request `DTR-0018` | The same request exists in the student's workspace and in Super Admin; BITS decides it |
| Problem report `SUP-0213` | The reference the person follows up with ("Your reference is SUP-0213") |
| Student ID `GIT-2026-0418` | The institution's own ID, used on rolls and in the CSV import |
| BITS course code `ME ZG523` and your course code `MEC-523` | Business codes; the course-code editor exists to set the second one |

| Not shown | Identified instead by |
|---|---|
| Grant id (`SACC-…`) | Who, how and when: "Individually · 9 Oct 2026", "Group: ME ZG523 — Sem II · 12 Oct 2026". One student can hold at most one individual grant and one grant per group for an experiment, so this is unambiguous |
| Faculty-course id (`FMAP-…`) | The course and when it was assigned: "9 Oct 2026 · Meera Iyer" |
| Group id (`GRP-…`) | The group's name, which the rules already keep unique (a duplicate name is refused) |

**For integration:** the ids themselves are unchanged in the data model, in `SCENARIOS.json` and in `LINK-MAP.json`, and the commands in § 4 still take and return them. Only the labels changed. Keep the id on the record you bind to each row, because the UI still needs it to call withdraw, remove or forward, and the Student access search still matches a typed grant id. Nothing in this pass changed a rule, a permission, a record, a state transition or a status word; the full before/after of every visible line is in CHECKS.md.

## 10. Integration notes

- Map each `ia-` pattern in COMPONENT-EXTENSIONS.md to one component (record grid, surface section, list table, grouped table, step indicator, selection fold, assign panel, plan strip). The list table, record grid, surface sections, step indicator and form column are flagged as central kit candidates; keep them role-local until the kit owner decides.
- Do not port the preview chrome (`ia-pv…`: role start page, the floating Preview button, handoff notes), the sample worlds or the named states. They exist only to run the design.
- `project/ia-role.css` is the only role stylesheet. Classes not in it (for example the delivered role's `ia-table` or anything from the retired R1/R2 stylesheets) are gone and must not be recreated.
- Keep the app's existing Help, account and navigation working until the XS delivery replaces the borrowed surfaces.
- For the kit owner: the kit's error summary (`rk-errsum`) puts single-line links 22px apart, under the 24px target spacing of WCAG 2.2 (2.5.8). The role adds 4px between items inside its forms; a central fix in `rb-kit.css` would cover every role.
