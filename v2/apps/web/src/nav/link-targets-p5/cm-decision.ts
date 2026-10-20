import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const READY = '/content-manager/ready';
const LIBRARY = '/content-manager/library';
/** CM-03, by submission id: the sample's SUB-0074 (with the Content Manager) stands for any. */
const DECISION = '/content-manager/decisions/SUB-0074';
/** CM-03 read-only: SUB-0086 in academic review, SUB-0081 with the vendor. */
const DECISION_IN_REVIEW = '/content-manager/decisions/SUB-0086';
const DECISION_WITH_VENDOR = '/content-manager/decisions/SUB-0081';
/** CM-05, by experiment id: Distillation Column stands for any published experiment. */
const PUBLISHED = '/content-manager/published/distillation-column';
/** CM-05 with an open update: Induction Motor Loading (UPD-0006 returned), Boiler Drum Level (on hold). */
const PUBLISHED_RETURNED = '/content-manager/published/induction-motor-loading';
const PUBLISHED_ON_HOLD = '/content-manager/published/boiler-drum-level';
/** CM-05 after SUB-0074 is published (transient-cooling). */
const PUBLISHED_NEW = '/content-manager/published/transient-cooling';
/** PU-06, the public page of an experiment. */
const PUBLIC_NEW = '/experiments/transient-cooling';
const PUBLIC_EXPERIMENT = '/experiments/distillation-column';
/** CM-08 an update: the draft CM-06 / CM-07 open, by update id — UPD-0005 stands for any. */
const UPDATE = '/content-manager/updates/UPD-0005';
const UPDATE_RETURNED = '/content-manager/updates/UPD-0006';
const UPDATE_ON_HOLD = '/content-manager/updates/UPD-0004';

/**
 * CM-03 Publication decision and CM-05 Published experiment, as the owner-approved Content Manager
 * export links them (V3 Refined B, design/v3-refined-b/roles/CM-v1, LINK-MAP.json “CM-03 Decision
 * …” and “CM-05 Published …”; commands). CM-03's one primary is the panel's “Publish” / “Send
 * back” (a command: Publish through its confirmation, Send back at once); the published result
 * links to the published experiment, the public page (PU-06) and Ready to publish; read-only, the
 * panel goes back to the Content library on the view that lists the record (state-copy
 * `CM-03.crumb`). CM-05's Corrections panel — “Start a correction” (its primary), “Edit catalogue
 * details” (CM-06) and “Edit delivery link” (CM-07) — opens or joins the one correction draft (a
 * command) and lands on its update page (CM-08) with the named field focused; “Continue the
 * update” (a draft or returned update) and “Open update” (in review, awaiting, on hold) only open
 * it (state-copy `CM-05.correction-entry`).
 */
export const P5_CM_DECISION_LINK_TARGETS: readonly LedgerEntry[] = [
  // CM-03 Publication decision.
  ...pageRows('CM-03', DECISION, [
    [
      'Breadcrumb',
      'Ready to publish',
      'secondary',
      READY,
      'built',
      'CM-v1 LINK-MAP “CM-03 Decision (open) · Ready to publish” (`nav.rk-crumbs`)',
    ],
    [
      'Identity band',
      'Go to decision',
      'secondary',
      null,
      'in-page',
      'CM-v1 `a.rb-btn.rk-goto` (below 860 px of page width; focus to the panel’s heading)',
    ],
    [
      'Stale notice',
      'Show where it is now',
      'secondary',
      null,
      'in-page',
      'CM-v1 LINK-MAP commands “Show where it is now (stale notice)” — re-reads the record (state-copy `CM-03.stale.changed`)',
    ],
    [
      'Your decision panel (choice)',
      'Publish / Send back · Academic Reviewer / Vendor · What it refers to',
      'secondary',
      null,
      'in-page',
      'CM-v1 `fieldset.rk-fieldset` > `label.rk-choice` (Publish unavailable while a check fails: `is-off`); `label.rk-check` toward the vendor only',
    ],
    [
      'Your decision panel',
      'Publish · Send back',
      'primary',
      null,
      'in-page',
      'CM-v1 LINK-MAP commands “Publish (decision panel) → confirmation dialog → Publish”, “Send back (to the Academic Reviewer or the vendor)” (`button.rb-btn--primary.rk-go#cm-d-go`) → the result',
    ],
    [
      'Error summary',
      'Choose a decision · Choose who it goes back to · Add a reason so they know what to change',
      'secondary',
      null,
      'in-page',
      'CM-v1 `div.rk-errsum#cm-d-errs` links (focus the field)',
    ],
    [
      'Publish confirmation',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'CM-v1 DL-1 `#cm-dlg-pub-cancel` (nothing is published; waits while publishing); its Publish (`#cm-dlg-pub-ok`, “Publishing…” while it runs) confirms the panel’s primary',
    ],
    [
      'Published result',
      'Open the published experiment',
      'secondary',
      PUBLISHED_NEW,
      'built',
      'CM-v1 LINK-MAP “CM-03 Decision (published result) · Open the published experiment” → CM-05',
    ],
    [
      'Published result',
      'View the public page',
      'secondary',
      PUBLIC_NEW,
      'built',
      'CM-v1 LINK-MAP “CM-03 Decision (published result) · View the public page” → PU-06 (the product’s public page; the export’s handoff frame is preview-only)',
    ],
    [
      'Published or sent-back result',
      'Back to Ready to publish',
      'secondary',
      READY,
      'built',
      'CM-v1 LINK-MAP “CM-03 Decision (published result) · Back to Ready to publish”',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `CM-03.failed`'],
  ]),
  ...pageRows('CM-03', DECISION_IN_REVIEW, [
    [
      'Breadcrumb (read-only: in academic review)',
      'Content library',
      'secondary',
      `${LIBRARY}?tab=in-review`,
      'built',
      'CM-v1 LINK-MAP “CM-03 Decision (read-only, from library)” breadcrumb (state-copy `CM-03.crumb`: the view that lists it)',
    ],
    [
      'Your decision panel (read-only: in academic review)',
      'Back to the Content library',
      'secondary',
      `${LIBRARY}?tab=in-review`,
      'built',
      'CM-v1 LINK-MAP “CM-03 Decision (read-only, from library) · Back to the Content library”',
    ],
  ]),
  ...pageRows('CM-03', DECISION_WITH_VENDOR, [
    [
      'Your decision panel (read-only: with the vendor)',
      'Back to the Content library',
      'secondary',
      `${LIBRARY}?tab=with-vendor`,
      'built',
      'CM-v1 LINK-MAP “CM-03 Decision (read-only, from library) · Back to the Content library”',
    ],
  ]),
  // CM-05 Published experiment.
  ...pageRows('CM-05', PUBLISHED, [
    [
      'Breadcrumb',
      'Content library',
      'secondary',
      LIBRARY,
      'built',
      'CM-v1 LINK-MAP “CM-05 Published · no open update · Content library” (`nav.rk-crumbs`)',
    ],
    [
      'Identity band',
      'View the public page',
      'secondary',
      PUBLIC_EXPERIMENT,
      'built',
      'CM-v1 LINK-MAP “CM-05 Published · no open update · View the public page” → PU-06 (`div.rb-id-act > a.rb-btn`)',
    ],
    [
      'Identity band',
      'Go to corrections',
      'secondary',
      null,
      'in-page',
      'CM-v1 `a.rb-btn.rk-goto` (below 860 px of page width; focus to the panel’s heading)',
    ],
    [
      'Corrections panel (no update open)',
      'Start a correction',
      'primary',
      UPDATE,
      'built',
      'CM-v1 LINK-MAP “CM-05 Published · no open update · Start a correction” → CM-08 (`button.rb-btn--primary.rk-go#cm-p-start`: opens the one draft — `openCorrection` — then its update page)',
    ],
    [
      'Corrections panel',
      'Edit catalogue details',
      'secondary',
      `${UPDATE}?focus=summary`,
      'built',
      'CM-v1 LINK-MAP “CM-05 Published · no open update · Edit catalogue details” → CM-06 (`button.rb-btn.cm-wide`: opens or joins the draft, the summary focused)',
    ],
    [
      'Corrections panel',
      'Edit delivery link',
      'secondary',
      `${UPDATE}?focus=web-link`,
      'built',
      'CM-v1 LINK-MAP “CM-05 Published · no open update · Edit delivery link” → CM-07 (`button.rb-btn.cm-wide`: opens or joins the draft, the web link focused)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `CM-05.failed`'],
  ]),
  ...pageRows('CM-05', PUBLISHED_RETURNED, [
    [
      'Corrections panel (a draft or returned update)',
      'Continue the update',
      'primary',
      UPDATE_RETURNED,
      'built',
      'CM-v1 LINK-MAP “CM-05 Published · open draft/returned · Continue the update” → CM-08 (a link drawn as `button.rb-btn--primary.rk-go#cm-p-open`)',
    ],
  ]),
  ...pageRows('CM-05', PUBLISHED_ON_HOLD, [
    [
      'Corrections panel (in review, awaiting or on hold)',
      'Open update',
      'primary',
      UPDATE_ON_HOLD,
      'built',
      'CM-v1 LINK-MAP “CM-05 Published · awaiting release · Open update” → CM-08 (a link drawn as `button.rb-btn--primary.rk-go#cm-p-open`)',
    ],
  ]),
];
