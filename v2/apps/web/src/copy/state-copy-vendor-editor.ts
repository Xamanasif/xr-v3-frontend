import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of the experiment editor — VE-03 … VE-06, VE-08, VE-09 (the V3 Vendor
 * export, design/v3-refined-b/roles/VE-v1 `Main.dc.html`; first drawn on B5-03 … B5-05, B5-07) —
 * part of the one register (`state-copy.ts`, VD-12): every state string or rule these screens show
 * that the export does not draw word for word, with its basis and the decisions it waits on.
 * Decision ids never appear in visible copy.
 */
export const STATE_COPY_VENDOR_EDITOR = {
  'VE-03.loading': {
    screen: 'VE-03',
    state: 'The editor loading (the record, the assigned courses; screen readers, skeleton lines)',
    words: 'Loading the experiment',
    rule: 'The breadcrumbs stay; the loading line over skeleton rows in a surface while the head, the steps and the form wait for the read.',
    basis:
      'Board 04 “State grammar” Loading formula; B4-02 f4 “Loading your experiments”. B5-03 … B5-07 draw no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-03.area': {
    screen: 'VE-03',
    state: 'Step 1’s Engineering area, chosen before the course (owner decision PD-5, 27 Oct 2026)',
    words: 'Engineering area',
    rule: 'Before Course on the field grid, from the platform’s academic structure: the areas that hold a course the Vendor may choose, in the structure’s order — an area with none is not offered. One such area is chosen already; with several the Vendor chooses one (“Choose an Engineering area”), and Course lists only that area’s courses. Changing the area clears a course of another area. A saved draft or a returned experiment opens with the area of its course as it is now (a moved course follows its area). The area is not saved: the record keeps the course.',
    basis:
      'Owner decision PD-5; VE-v1 `Main.dc.html` draws one Course select (B5-03); contract PC-76',
    status: 'provisional',
    decisions: ['VD-12', 'PD-5'],
  },
  'VE-03.area.choose': {
    screen: 'VE-03',
    state: 'The Engineering area select’s first option',
    words: 'Choose an Engineering area',
    basis: 'The Course select’s “Choose a course” formula (VE-v1)',
    status: 'provisional',
    decisions: ['VD-12', 'PD-5'],
  },
  'VE-03.area.first': {
    screen: 'VE-03',
    state: 'The Course select while no Engineering area is chosen',
    words: 'Choose an Engineering area first',
    rule: 'The Course select’s only option until an area is chosen; Continue then answers “Choose a course” as before.',
    basis: 'The Course select’s “Choose a course” formula (VE-v1)',
    status: 'provisional',
    decisions: ['VD-12', 'PD-5'],
  },
  'VE-03.refused': {
    screen: 'VE-03',
    state:
      'An editor read refused for a reason none of the other states covers (signed out meanwhile)',
    words: 'This experiment isn’t available to you',
    rule: 'A calm notice under the breadcrumbs, nothing of the record and no form. My experiments stays one click away. Another Vendor’s record — a colleague of the same studio included — is “We can’t find that page” (owner decision PD-1); a Vendor with no course is `VE-01.no-course.*`.',
    basis: 'Board 04 calm-state formula. B5-03 … B5-07 draw no such state',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-03.failed': {
    screen: 'VE-03',
    state: 'The editor failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load this experiment',
    rule: 'The kit’s failed state in a surface under the breadcrumbs: this title, “Nothing has changed. Try again.” and “Try again”, which reads again. What was typed in this tab is kept.',
    basis: 'B4-02 f5 “We couldn’t load your experiments”. B5-03 … B5-07 draw no failed frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-03.failed-line': {
    screen: 'VE-03',
    state: 'The failed state’s line',
    words: 'Nothing has changed. Try again.',
    basis: 'B4-02 f5 (the Faculty boards’ failed line)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-03.kept': {
    screen: 'VE-03',
    state: 'What was typed and not yet saved, across in-app navigation',
    words: null,
    rule: 'Kept in memory for the tab’s life — never in browser storage — for the signed-in person and the record it was typed for (a new experiment, or the saved id). It survives the steps’ address changes (Continue, Back, the stepper, the outline, Change, Go to, a reference) and an address change the editor does not see (the browser’s Back and Forward); it is dropped by Save draft or Save changes (the saved record is then shown), by Submit or Resubmit, and by leaving through a link — Cancel, a breadcrumb, the rail, the menu or Help — once “Leave without saving” is chosen (`VE-04.leave-guard`). Another session never reads it; a reload starts again from the saved record.',
    basis:
      'VE-v1 `Main.dc.html` (one editor state, kept while the steps change; `dirty`, `go`); `fa-07-create-assessment/create-draft.ts` (the same rule for FA-07)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-03.first-save': {
    screen: 'VE-03',
    state: 'The first Save draft of a new experiment',
    words: null,
    rule: 'The receipt gives the id, which goes into the address only: the address becomes the draft’s own (`/vendor/experiments/<SUB id>/edit`, the step kept) without a history entry, and the editor reads as an edited draft: “Edit draft · Step n of 4”, “Only you can see a draft”, “Draft saved · <date, time>” next to Cancel or Back, which takes focus; no words show the id (`VE-02.no-reference`). The export keeps “Create experiment” in the eyebrow after the first save; the product names the mode of the address it is on.',
    basis:
      'VE-v1 HANDOFF §4 “submission ID on first save”; `Main.dc.html` `edSave`; OD-B5-07; Owner’s identifier rule for the Vendor, 22 Oct 2026: no internal reference (SA-v1 rule)',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-07'],
  },
  'VE-03.save-unavailable': {
    screen: 'VE-03',
    state: 'Save draft failed for now (service unavailable)',
    words: 'We couldn’t save your draft. Nothing was lost — try again.',
    basis: 'Board 04 “State grammar” Failed formula (“Nothing was lost”). No board draws it here',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-03.continue-unavailable': {
    screen: 'VE-03',
    state: 'Continue could not be checked for now (service unavailable)',
    words: 'We couldn’t check this step. Nothing was lost — try again.',
    basis: 'Board 04 “State grammar” Failed formula. No board draws it here',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-03.stale': {
    screen: 'VE-03',
    state: 'A save or submit refused because the record changed since it was read (stale version)',
    words:
      'This experiment changed since you opened it. Nothing was saved — check what you entered and try again.',
    rule: 'The record is read again; what was typed stays on the page.',
    basis:
      'Appendix F §4.6 stale-version (“refetch and render its current drawn state”). No board draws it',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-03.moved-on': {
    screen: 'VE-03',
    state: 'A save or submit refused because the record moved on (invalid state)',
    words: 'This experiment has moved on since you opened it. Nothing was saved.',
    rule: 'The record is read again and the editor shows what it can now (read-only when it is no longer a draft or returned).',
    basis: 'Appendix F §4.6 invalid-state. No board draws it',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-03.mode-address': {
    screen: 'VE-03',
    state: 'An editor address for the other mode (a returned record at /edit, a draft at /revise)',
    words: null,
    rule: 'The address is replaced by the record’s own mode (VE-08 for a returned record, VE-09 for a draft), the step kept, without a history entry.',
    basis:
      '`nav/vendor.ts` (VE-09 a saved draft, VE-08 a returned one); B5-02 actions “Edit draft” · “Revise”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-09.opens-at': {
    screen: 'VE-09',
    state: 'A saved draft opened at its address without a step',
    words: null,
    rule: 'It opens at the step where the Vendor last saved (`lastStepReached`): the address gains that step without a history entry. Revise mode always opens at step 1, under the reason.',
    basis: 'B5-07 f5 caption “opens at step 2, where Anil stopped”; B5-07 `startRevise` (step 1)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-09.withdrawn-line': {
    screen: 'VE-09',
    state:
      'The read-only notice of a draft whose course is no longer assigned (no withdrawal date in the read)',
    words:
      '{course} was withdrawn from {organisation}. This draft is kept, read-only. BITS / WILP decides which courses are yours.',
    rule: 'The export’s read-only notice line without “on <date>”: the editor’s read gives no withdrawal date (nor does the meta line). With one, the drawn line is used as it is.',
    basis:
      'VE-v1 `Main.dc.html` `o.roD` “<course> · <name> was withdrawn from <studio> on <date>. …”; B5-07 f6',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-01'],
  },
  'VE-09.refusal-kind': {
    screen: 'VE-09',
    state:
      'An editor address for a record that is not a draft or returned (a stale Edit draft or Revise link)',
    words: null,
    rule: 'The export’s refusal in place of the editor, chosen by the record’s status as the Vendor reads it: Submitted after a resubmit → “This experiment was already submitted” (with the day it was last submitted); with the Academic Reviewer → “This experiment is being reviewed” (a re-check: “… Nothing is needed from you.”); with the Content Manager → “This experiment was approved by the Academic Reviewer”; published → “This experiment is published”; anything else → “This experiment can’t be edited now”. “Open the experiment record” and “Back to My experiments” follow. Nothing of the record is shown here.',
    basis: 'VE-v1 `Main.dc.html` `edView` refusal (`o.refTitle`, `o.refText`); HANDOFF §4 refusals',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-04.sample-file': {
    screen: 'VE-04',
    state: 'Attach file on an app-package block',
    words: null,
    rule: 'Adds a sample file name under the package reference — the experiment’s name in lower case with hyphens, the format and the version, e.g. “conduction-through-a-composite-wall-vr-1.0.zip” — and counts as the reference for the block’s status. The export’s marker after the name is a canvas label and is not shown: the file name stands alone (sample labels stay on the canvas). Nothing is uploaded; Remove takes it away and Attach file comes back.',
    basis:
      'VE-v1 `Main.dc.html` `edAttach`, HANDOFF §4 “no upload”; OD-B5-11; the seed’s package names',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-11', 'T-14', 'T-36'],
  },
  'VE-04.leave-guard': {
    screen: 'VE-04',
    state: 'Leaving the editor through a link while it holds unsaved changes',
    words: null,
    rule: 'A click on any link of the page or the shell that leaves the editor — Cancel, a breadcrumb, the rail, the menu, the account menu’s Help — while what is typed differs from what was last saved opens “Leave without saving?” (the export’s words) instead. Keep editing (or Esc) closes it and keeps every value, focus back on what was clicked; Leave without saving drops what was typed and goes where the link pointed. The steps’ own moves, Save, Submit and the outcome’s links are never asked. A safeguard new in this design (v46 had none), done in the editor only: the browser’s Back and a typed address are not guarded.',
    basis:
      'VE-v1 HANDOFF §1 “Leave without saving?”; `Main.dc.html` `go`, `dlgView` leave; lead decision (VE builder brief rule 2)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-05.sample-documents': {
    screen: 'VE-05',
    state: 'Add document',
    words: null,
    rule: 'Adds the next of three sample document names (“Lab handout — Composite Wall.pdf”, “Thermocouple positions.pdf”, “Safety notes.pdf”) not already listed; the button goes once all three are listed, and the dashed “No documents added.” line shows when none are. File names only — nothing is uploaded; the export’s marker after each name is not shown: the file name stands alone (sample labels stay on the canvas).',
    basis: 'VE-v1 `Main.dc.html` `edAddDoc`, `canAddDoc`, `vr-empty`; B5-05 `D.docPool`; OD-B5-11',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-11', 'T-36'],
  },
  'VE-06.submit-unavailable': {
    screen: 'VE-06',
    state: 'Submit for academic review failed for now (service unavailable)',
    words: 'We couldn’t submit it. Nothing was sent — try again.',
    basis: 'Board 04 “State grammar” Failed formula. No board draws it here',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-08.save-unavailable': {
    screen: 'VE-08',
    state: 'Save changes failed for now (service unavailable)',
    words: 'We couldn’t save your changes. Nothing was lost — try again.',
    basis: 'Board 04 “State grammar” Failed formula. No board draws it here',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-08.resubmit-unavailable': {
    screen: 'VE-08',
    state: 'Resubmit failed for now (service unavailable)',
    words: 'We couldn’t resubmit it. Nothing was sent — try again.',
    basis: 'Board 04 “State grammar” Failed formula. No board draws it here',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-08.returned-by-override': {
    screen: 'VE-08',
    state:
      'The returned notice of a record the Super Admin moved back to the Vendor (stuck record override)',
    words: 'Returned to you',
    rule: 'The reason, the time and the Super Admin’s name follow as for any return; no references.',
    basis:
      'B7-06 (the Super Admin’s override; the Vendor-side words are not drawn); B5-07 f0 reason box',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B7-09'],
  },
  'VE-08.private-revision': {
    screen: 'VE-08',
    state: 'Save changes on a returned experiment (a private revision, not resubmitted)',
    words: null,
    rule: 'The save line reads “Changes saved · <date, time> · not resubmitted yet” next to Cancel or Back and takes focus. The outline says “Changes saved · <time> today · not resubmitted” (with the day when it was saved before today) once the returned record has changed since it was returned — the record’s last change is later than its return, as the record page reads it — else “No changes saved yet”. The Vendor read model says neither which fields changed nor whether nothing changed since the submitted revision, so the editor draws no changed-field list and no “Nothing has changed since revision N was submitted” line.',
    basis:
      'VE-v1 HANDOFF §3, §4 “save revision (private)”; `Main.dc.html` `edSave` revise, `o.progSaved`; lead decision (VE builder brief rule 2, known gaps); `features/vendor/shared/saved-changes.ts` `savedChangesAt` (the one rule the Overview, My experiments, the record and the editor read)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-08.reference-jump': {
    screen: 'VE-08',
    state: 'A “What it refers to” link',
    words: null,
    rule: 'A chip under “What it refers to” opens the step it names (the address gains its `?step=`) and moves focus to the field, which carries “Referred to in the return”; a format that is no longer chosen focuses “Formats it supports”. The returned reason takes focus first when the editor opens in revise mode — unless the address names one of the return’s references in `field=` (the record’s chips: `?step=formats&field=ar.device-need`, `?field=summary`; `<format>.<field>` for a format’s field, else the field), when that field takes focus instead.',
    basis:
      'VE-v1 `Main.dc.html` `x.go` → `edGoStep`, `f.ref`; HANDOFF §1 VE-08 “references jump to the step and field; referenced fields tagged”',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-10'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
