import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of SA-14 Academic structure and SA-15 Area / course record — part of the
 * one register (`state-copy.ts`, VD-12): every state string or rule these screens show, with its
 * basis and the decisions it waits on. The screens follow the owner-approved Super Admin export
 * (V3 Refined B, design/v3-refined-b/roles/SA-v1 `sa-views-c.js`); a state the export draws takes
 * its words (cited “SA-v1 …”), one it does not draw keeps the Phase 6 words (B7-07, B7-10).
 * Decision ids never appear in visible copy.
 */
export const STATE_COPY_STRUCTURE = {
  // ---- SA-14 Academic structure ----
  'SA-14.loading': {
    screen: 'SA-14',
    state: 'The structure loading (screen readers; the skeleton rows in the surface)',
    words: 'Loading the academic structure…',
    rule: 'The header and its two actions stay; the areas wait for the read.',
    basis: 'SA-v1 `sa-views-c.js` `V.structure` list state “loading” (`SA.listState`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-14.failed': {
    screen: 'SA-14',
    state: 'The structure failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load the academic structure',
    basis: 'SA-v1 `sa-views-c.js` `V.structure` list state “failed” (`SA.listState`, Try again)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-14.failed.line': {
    screen: 'SA-14',
    state: 'The failed state’s reassurance',
    words: 'Nothing has changed. Try again.',
    basis:
      'SA-v1 `sa-core.js` `SA.listState` “failed” (every Super Admin list; `copy/sa-shared.ts`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-14.empty': {
    screen: 'SA-14',
    state: 'The structure has no engineering area yet',
    words: 'No engineering areas yet',
    rule: 'Shown in the surface in place of the areas, with the layers icon; Add area stays in the head.',
    basis:
      'SA-v1 `sa-views-c.js` `V.structure` list state “empty” (`emptyT`, `emptyIco: rki-layers`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-14.empty.line': {
    screen: 'SA-14',
    state: 'The empty structure’s next step',
    words: 'Add an area, then add its courses.',
    basis: 'SA-v1 `sa-views-c.js` `V.structure` list state “empty” (`emptyD`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-14.open-area-name': {
    screen: 'SA-14',
    state: 'The accessible name of each area’s “Open area” link',
    words: null,
    rule: '“Open area <area name>”: the visible words first, then the area (WCAG 2.5.3 Label in Name). The export names the link “Open the area <area name>”, which does not contain its visible words.',
    basis:
      'SA-v1 `sa-views-c.js` `V.structure` (`aria-label="Open the area …"`); LINK-MAP SA-14 → SA-15',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-14.decision-ids': {
    screen: 'SA-14',
    state: 'The foot note under the areas and the area record’s note (SA-15)',
    words: null,
    rule: 'Both sentences are the export’s, which carry no decision id: “Areas group courses; there is no module layer. Retiring an area or course is not available.” and “Areas have no artwork set here, and can’t be retired.” (B7-07 wrote “(D3)” after both; never shown.)',
    basis:
      'SA-v1 `sa-views-c.js` `V.structure` `p.rk-ca-foot`, `V.area` `p.sa-footnote`; B7-07 f0, f5; P1-14 / VD-10 “Strip the suffix through a copy table and keep the sentence”',
    status: 'owner-approved',
    decisions: ['P1-14', 'VD-10'],
  },
  'SA-14.added': {
    screen: 'SA-14',
    state: 'After Add area or Add course (Academic structure, or an area record’s Add course)',
    words: null,
    rule: 'The dialog closes and the flash takes focus on the page that opened it: “<area> was added.” with “Add courses to it to start using it.”, or “<course> was added.” with “The Content Manager adds its platform course code.”. The new area shows with “No courses yet. Add one to start using this area.”, the new course in its area with “No platform code yet” and “0 published experiments”. The export also opens the new course’s record; the product stays on the page, whose row opens it.',
    basis:
      "SA-v1 `sa-views-c.js` `SA.DLG.area`, `SA.DLG.course` (`SA.setFlash`, `SA.focus('sa-flash')`); B7-07 script `doAddArea`, `doAddCourse`",
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-14.uniqueness': {
    screen: 'SA-14',
    state: 'A name already used (Add area, Add course, Rename)',
    words: null,
    rule: 'Whether a name is taken is the service’s answer, compared trimmed and without case; its drawn words (“There is already an area called …” / “… a course called …”) show under the name field, which takes focus. A blank name or no area chosen is caught before anything is sent, with the contract’s own messages.',
    basis:
      'B7-07 script `dupe`, `doAddArea`, `doAddCourse`, `doRename`; contract SA-14 / SA-15 keys',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-14.unavailable': {
    screen: 'SA-14',
    state: 'Add area or Add course failed for now (service unavailable)',
    words: 'It wasn’t added. Nothing was lost — try again.',
    rule: 'Shown in the dialog, which stays open with what was typed.',
    basis: 'Board 08 “failed, try again · Nothing was lost”. B7-07 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- SA-15 Area / course record ----
  'SA-15.loading': {
    screen: 'SA-15',
    state: 'The record loading (screen readers; the skeleton in a section)',
    words: 'Loading the record…',
    basis:
      'The Super Admin record guard’s loading line over the kit’s skeleton rows (`SaRecordGuard`); the export draws no record loading state',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-15.failed': {
    screen: 'SA-15',
    state: 'The record failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load this record',
    basis:
      'B4-02 f5 “We couldn’t load your experiments” (the workspace failed formula). B7-07 draws no failed frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-15.failed.line': {
    screen: 'SA-15',
    state: 'The failed state’s reassurance',
    words: 'Nothing has changed. Try again.',
    basis: 'B4-02 f5 failed formula; board 08 “failed, try again”. B7-07 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-15.stale.course': {
    screen: 'SA-15',
    state:
      'Rename, Edit description or Move refused because the course changed since the dialog opened',
    words: 'This course changed since you opened it',
    basis: 'Board 08 “conflict” formula; CM-03 `CM-03.stale.title`. B7-07 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-15.stale.area': {
    screen: 'SA-15',
    state: 'Rename or Edit description refused because the area changed since the dialog opened',
    words: 'This area changed since you opened it',
    basis: 'Board 08 “conflict” formula; CM-03 `CM-03.stale.title`. B7-07 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-15.stale.line': {
    screen: 'SA-15',
    state: 'The stale notice’s line (what was typed or chosen is kept)',
    words: 'It has been read again. Check it, then try again.',
    rule: 'Shown in the dialog, which stays open with what was typed or chosen; nothing was changed, the record is read again and the next press sends with its current revision.',
    basis: 'Board 08 “conflict” formula; CM-03 `CM-03.stale.line`. B7-07 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-15.unavailable': {
    screen: 'SA-15',
    state: 'Rename or Edit description failed for now (service unavailable)',
    words: 'It wasn’t saved. Nothing was lost — try again.',
    rule: 'Shown in the dialog, which stays open with what was typed.',
    basis: 'Board 08 “failed, try again · Nothing was lost”. B7-07 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-15.move-unavailable': {
    screen: 'SA-15',
    state: 'Move course failed for now (service unavailable)',
    words: 'It wasn’t moved. Nothing was lost — try again.',
    rule: 'Shown in the move dialog, which stays open with the area chosen.',
    basis: 'Board 08 “failed, try again · Nothing was lost”. B7-07 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-15.no-other-area': {
    screen: 'SA-15',
    state: 'The panel’s “Move to another area” group when the structure has no other area',
    words: 'There is no other area to move it to.',
    rule: 'Shown in place of the hint and the “Move to another area” button. The sample world always has three areas.',
    basis:
      'SA-v1 `SA.DLG.course` (move) lists every area except the course’s own; B7-07 `mvOpts`; neither draws an empty list',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-15.move-rule': {
    screen: 'SA-15',
    state: 'Whether a course can be moved (“Change this course” › “Move to another area”)',
    words: null,
    rule: 'The service answers it (`previewMoveCourse`, which writes nothing): blocked while students or Faculty are filed against the course (OD-B7-12, provisional). Blocked, the group shows the notice “This course can’t be moved” — “People are filed against it: <who>. Nothing moves.” — and no button; otherwise the hint and “Move to another area”, which opens the move dialog listing every other area. A move refused because someone was filed in the meantime closes the dialog and shows the blocked notice after the record is read again.',
    basis:
      'SA-v1 `sa-views-c.js` `V.course` (`sa-act`, `rk-notice--off`), `SA.DLG.course` (move); B7-07 f1, f3, f4; B7-10 f9',
    status: 'provisional',
    decisions: ['OD-B7-12'],
  },
  'SA-15.uses.experiments': {
    screen: 'SA-15',
    state: '“Published experiments”',
    words: null,
    rule: 'The number of the course’s published experiments, or “None yet”. The export links each experiment to its content record; the service answers the number only (`usage.publishedExperiments`), so no experiment is named here.',
    basis: 'SA-v1 `sa-views-c.js` `V.course` (`expsOf`); service `getCourse().usage` (PC-69)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-15.uses.institutions': {
    screen: 'SA-15',
    state: '“Institutions”',
    words: null,
    rule: 'Each institution whose access plan holds one of the course’s experiments, current ones first, linked to its record by its name; after the link its own code for the course in brackets (“Godavari Institute of Technology (MEC-523)”), “(ended)” when every such plan has ended, both as “(MEC-523, ended)”; joined with “, ”; “None” when there are none.',
    basis:
      'SA-v1 `sa-views-c.js` `V.course` (links to SA-07, LINK-MAP); B7-07 f1, f2, f4 (`insts`); service `getCourse().detail.institutions` (PC-69)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-15.uses.vendors': {
    screen: 'SA-15',
    state: '“Vendors in scope”',
    words: null,
    rule: 'Each Vendor holder whose scope covers the course, each once, linked to the holder’s record by the holder’s name; joined with “, ”; “None” when there are none.',
    basis:
      'SA-v1 `sa-views-c.js` `V.course` (`vendors`, links to SA-17, LINK-MAP); service `detail.vendors`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-15.uses.people': {
    screen: 'SA-15',
    state: '“People filed against it” and the blocked notice’s “<who>”',
    words: null,
    rule: 'The students filed against the course by number (“12 students”), then the Faculty mapped to it per institution — one person by name (“Dr S. Ranganathan — Godavari Institute of Technology”), more by number (“4 Faculty members — BITS Pilani — Hyderabad Campus”) — joined with “ · ”; “Nobody” when there are none. The export writes a sample sentence (“12 students and a Faculty member at …”); the product writes the record’s facts.',
    basis:
      'SA-v1 `sa-views-c.js` `V.course` (`people`); B7-07 f1, f2 (`faculty`, `blockText`); service `usage.studentsFiled`, `detail.faculty`, `previewMoveCourse().blockers`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-15.sample-label': {
    screen: 'SA-15',
    state: 'The canvas “Sample” label in the head of “What uses this course”',
    words: null,
    rule: 'Not shown: the figures are the service’s answer.',
    basis:
      'START-HERE Known exception 4 (not product features: sample-data labels); Appendix E §10 item 5 (sample labels are canvas-only); T-36',
    status: 'owner-approved',
    decisions: ['START-HERE Known exception 4', 'Appendix E §10 item 5', 'T-36'],
  },
  'SA-15.history': {
    screen: 'SA-15',
    state: 'The History section of an area or a course',
    words: null,
    rule: 'The record’s own events, newest first (the newest marked as the latest), each with its day: “Area added by <name>”, “Course added by <name>” (note “<area> · no platform code yet.” until a platform code is set — the newer entry says so — the area left out once the course has moved), “Platform code <code> set by the Content Manager”, “Renamed by <name>” (note “Was “<old name>”.”), “Description changed by <name>”, “Moved by <name>”. Entries recorded at the same moment keep the record’s order, the later first. The record holds no “from … to …” for a move, so a move has no note (B7-07 `doMove` writes “From … to ….”). Each entry shows its day, as every B7-07 frame does (the board’s live script writes a time for entries made in the session). B7-07 draws the structure’s first records as “Area in use” / “Course in use” (2 Jun 2026); the sample world records them as added by Arjun Mehta that day, and the product says so.',
    basis:
      'B7-07 `hist` and the script’s `doAddArea`, `doAddCourse`, `doRename`, `doDesc`, `doMove`; Appendix C M06, M07 events',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-15.history.code-cleared': {
    screen: 'SA-15',
    state: 'A history entry for a platform code the Content Manager cleared',
    words: 'Platform code removed by the Content Manager',
    basis:
      'B7-07 “Platform code … set by the Content Manager”; B6-10 (a blank code is allowed). No board draws it',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-15.after': {
    screen: 'SA-15',
    state: 'After Rename, Edit description or Move',
    words: null,
    rule: 'The dialog closes and the flash says what changed (“The area is now called …”, “The course is now called …”, “Description saved.”, “The course moved to …”) and takes focus, as the export’s script does. Cancel and Esc return focus to the button that opened the dialog.',
    basis:
      "SA-v1 `sa-views-c.js` `SA.DLG.area`, `SA.DLG.course` (`SA.setFlash`, `SA.focus('sa-flash')`), `sa-core.js` `SA.closeDlg`",
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
