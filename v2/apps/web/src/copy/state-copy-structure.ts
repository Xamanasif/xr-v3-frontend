import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 6’s SA-14 Academic structure and SA-15 Area / course record (B7-07, B7-10) — part of the one register (`state-copy.ts`, VD-12):
 * every state string or rule these screens show that their board does not draw word for word, with
 * its basis and the decisions it waits on. Decision ids never appear in visible copy.
 */
export const STATE_COPY_STRUCTURE = {
  // ---- SA-14 Academic structure ----
  'SA-14.loading': {
    screen: 'SA-14',
    state: 'The structure loading (screen readers; the skeleton in a section)',
    words: 'Loading the academic structure',
    rule: 'The header and its two actions stay; the groups wait for the read.',
    basis: 'Board 04 “State grammar” Loading formula. B7-07 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-14.failed': {
    screen: 'SA-14',
    state: 'The structure failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load the academic structure',
    basis:
      'B4-02 f5 “We couldn’t load your experiments” (the workspace failed formula). B7-07 draws no failed frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-14.failed.line': {
    screen: 'SA-14',
    state: 'The failed state’s reassurance',
    words: 'Nothing has changed. Try again.',
    basis: 'B4-02 f5 failed formula; board 08 “failed, try again”. B7-07 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-14.decision-ids': {
    screen: 'SA-14',
    state: 'The foot note under the areas and the area record’s note (SA-15)',
    words: null,
    rule: 'Both sentences are shown as B7-07 draws them without “(D3)”: “… Retiring an area or course is not available.” and “Areas have no artwork set here, and can’t be retired.” The frozen wording is kept beside them (`copy/structure.ts` `STRIPPED_STRUCTURE`).',
    basis:
      'B7-07 f0 `p.xl-open`, f5 `p.xl-meta`; P1-14 / VD-10 “Strip the suffix through a copy table and keep the sentence”',
    status: 'owner-approved',
    decisions: ['P1-14', 'VD-10'],
  },
  'SA-14.added': {
    screen: 'SA-14',
    state: 'After Add area or Add course',
    words: null,
    rule: 'The dialog closes and the flash (“Area added. Add a course to start using it.” / “Course added to <area>. It has no platform code yet — …”) takes focus on Academic structure; the new area shows as its own group (“No courses yet. Add one to start using this area.”), the new course in its area’s group (“No platform code yet · no published experiments yet”). The board’s live frame also opens the new record beside the list; in the product the record is its own page, reached by the row’s “Open”.',
    basis:
      'B7-07 script `doAddArea`, `doAddCourse` (`done(…, flash)` then `focus(pid + "-flash")`); the frame pair S / Sr',
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
    words: 'Loading the record',
    basis: 'Board 04 “State grammar” Loading formula. B7-07 draws no loading frame',
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
      'Rename, Edit description or Move refused because the course changed since the dialog or panel opened',
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
    rule: 'Shown in the dialog or the move panel, which stays open; nothing was changed, the record is read again and the next press sends with its current revision.',
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
    rule: 'Shown in the move panel, which stays open with the area chosen.',
    basis: 'Board 08 “failed, try again · Nothing was lost”. B7-07 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-15.no-other-area': {
    screen: 'SA-15',
    state: 'The move panel when the structure has no other area',
    words: 'There is no other area to move it to.',
    rule: 'Shown in place of the choices, with Cancel only. The sample world always has three areas.',
    basis: 'B7-07 `mvOpts` lists every area except the course’s own; no frame draws an empty list',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-15.move-rule': {
    screen: 'SA-15',
    state:
      'Whether a course can be moved (the move panel and the note under “What uses this course”)',
    words: null,
    rule: 'The service answers it (`previewMoveCourse`, which writes nothing): blocked while students or Faculty are filed against the course (OD-B7-12, provisional). Blocked, the panel shows “Can’t move this course” with who is filed and Close only, and the usage section adds “Because people are filed against it, this course can’t be moved.”; otherwise the panel lists every other area and what moves with it. A move refused because someone was filed in the meantime shows the blocked notice after the record is read again.',
    basis: 'B7-07 f1, f3, f4, script `blocked`, `canMove`; B7-10 f9',
    status: 'provisional',
    decisions: ['OD-B7-12'],
  },
  'SA-15.moves-with-it': {
    screen: 'SA-15',
    state: 'What moves with a course, with more than one institution or Vendor',
    words: null,
    rule: 'One institution or Vendor as B7-07 draws it (“1 institution’s access”, “1 Vendor’s course list”); more take the plural possessive (“2 institutions’ access”, “2 Vendors’ course lists”). The figures are the service’s (`movesWithIt`: published experiments, institutions with current access, Vendors whose scope covers the course).',
    basis: 'B7-07 script `depWarn` (one institution drawn, f4)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-15.uses.institutions': {
    screen: 'SA-15',
    state: '“Institutions with access”',
    words: null,
    rule: 'Each institution whose access plan holds one of the course’s experiments, current ones first: its name, its own code for the course in brackets (“Godavari Institute of Technology (MEC-523)”), “(ended)” when every such plan has ended, both as “(MEC-523, ended)”; joined with “ · ”; “None” when there are none.',
    basis: 'B7-07 f1, f2, f4 (`insts`); service `getCourse().detail.institutions` (PC-69)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-15.uses.vendors': {
    screen: 'SA-15',
    state: '“Vendors with this course in scope”',
    words: null,
    rule: 'The organisation of each Vendor whose scope covers the course, each once, joined with “ · ”; “None” when there are none.',
    basis:
      'B7-07 f1, f2 (`vendors`: “Northline Simulation Studio”, “Meridian Virtual Labs”); service `detail.vendors`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-15.uses.faculty': {
    screen: 'SA-15',
    state: '“Faculty mapped to it”',
    words: null,
    rule: 'Per institution: one person by name (“Dr S. Ranganathan — Godavari Institute of Technology”), more by number (“4 Faculty members — BITS Pilani — Hyderabad Campus”), with the institution’s full name; joined with “ · ”; “None” when there are none. B7-07 shortens one institution’s name (“— Godavari”); the product writes the name the record holds.',
    basis: 'B7-07 f1, f2 (`faculty`); service `detail.faculty`',
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
    rule: 'The record’s own events, newest first, each with its day: “Area added by <name>”, “Course added by <name>” (note “<area> · no platform code yet.” until a platform code is set — the newer entry says so — the area left out once the course has moved), “Platform code <code> set by the Content Manager”, “Renamed by <name>” (note “Was “<old name>”.”), “Description changed by <name>”, “Moved by <name>”. Entries recorded at the same moment keep the record’s order, the later first. The record holds no “from … to …” for a move, so a move has no note (B7-07 `doMove` writes “From … to ….”). Each entry shows its day, as every B7-07 frame does (the board’s live script writes a time for entries made in the session). B7-07 draws the structure’s first records as “Area in use” / “Course in use” (2 Jun 2026); the sample world records them as added by Arjun Mehta that day, and the product says so.',
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
    rule: 'The dialog or panel closes and the flash says what changed; after a rename focus goes to the page title (the new name), after a description or a move to the flash, as B7-07’s script does. Cancel, Close and Esc return focus to the control that opened it.',
    basis: 'B7-07 script `done(…, flash, fid)`, `cancel`, `closeMove`; board 10 keyboard path',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
