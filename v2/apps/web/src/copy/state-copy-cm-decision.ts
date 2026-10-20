import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of CM-03 Publication decision and CM-05 Published experiment — part of the
 * one register (`state-copy.ts`, VD-12): every state string or rule these screens show that the
 * owner-approved Content Manager export (V3 Refined B, design/v3-refined-b/roles/CM-v1) does not
 * draw word for word, with its basis and the decisions it waits on. Decision ids never appear in
 * visible copy, and no internal reference (SUB-, UPD- …) appears in any words or accessible name
 * (`CM-03.references`, `CM-05.references`).
 */
export const STATE_COPY_CM_DECISION = {
  // ---- CM-03 Publication decision ----
  'CM-03.loading': {
    screen: 'CM-03',
    state: 'The decision loading (screen readers; the skeleton in a section)',
    words: 'Loading the publication decision',
    rule: 'The application’s existing page loading inside the shell: the export designs loading for the four list reads only (CM-v1 HANDOFF §4 last row).',
    basis:
      'Board 04 “State grammar” Loading formula; CM-v1 HANDOFF §4 “Loading on the Overview and record pages”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-03.failed': {
    screen: 'CM-03',
    state: 'The decision failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load this decision',
    basis:
      'B4-02 f5 “We couldn’t load your experiments” (the workspace failed formula). CM-v1 HANDOFF §4: no record-page failed design',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-03.failed.line': {
    screen: 'CM-03',
    state: 'The failed state’s reassurance',
    words: 'Nothing has changed. Try again.',
    basis: 'B4-02 f5 failed formula; the CM-v1 list states’ “Nothing has changed. Try again.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-03.top-title': {
    screen: 'CM-03',
    state: 'The rail’s current item and the document title',
    words: null,
    rule: 'The rail marks “Ready to publish” (the screen’s owner). The breadcrumb is inside the page (`CM-03.crumb`). The document title follows the shell rule with the experiment’s name, never its submission reference: “<experiment> · Ready to publish · XR Learning Platform” (“Transient Cooling · Ready to publish · XR Learning Platform”); Help’s “where it happened” names the same.',
    basis:
      'CM-v1 `Main.dc.html` CM-03 `nav.rk-crumbs`; the V3 role shell. Owner visual-review correction, 20 Oct 2026: no internal reference (SA-v1 rule)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-03.references': {
    screen: 'CM-03',
    state: 'Internal references on the decision page',
    words: null,
    rule: 'No internal reference (REQ-, ACC-, UPD-, DTR-, SUP-, SUB-) in the page’s words or accessible names, the tab title included: the band’s record kind reads “First publication” (the export’s “SUB-0077 · First publication” without its reference) and the tab names the experiment (`CM-03.top-title`). The submission’s reference stays in the address, the commands and the state.',
    basis:
      'CM-v1 `decVM` `over`; Owner visual-review correction, 20 Oct 2026: no internal reference (SA-v1 rule)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-03.crumb': {
    screen: 'CM-03',
    state: 'Which list the breadcrumb and the read-only back button name',
    words: null,
    rule: 'The export names the list the page was opened from (`D.backTo`). The product does not carry that: while the submission is with the Content Manager, and after it was published or sent back on this page, the trail reads “Ready to publish / <name>”; read-only (in academic review, back with the Academic Reviewer, with the vendor) it reads “Content library / <name>” and the panel offers “Back to the Content library” on the view that lists it (In review, With vendor).',
    basis:
      'CM-v1 `decVM` `backTo`, `backLabel`, `backBtn`; boards P08-InReview, P09-WithVendor (from the library)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-03.choice': {
    screen: 'CM-03',
    state: 'The decision’s choices when the page opens',
    words: null,
    rule: 'No choice is made when the decision opens (“Choose Publish or Send back.”); pressing the decision button without one shows “Choose a decision” in the error summary, which takes focus. While a check is not met, Publish is not offered and Send back is preselected; the button reads Send back.',
    basis:
      'CM-v1 `decVM` `ch`, `pending`, `go`; boards CM03-Decision, P02-Prerequisite, P03-DecisionErrors',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-03'],
  },
  'CM-03.returns': {
    screen: 'CM-03',
    state: 'The academic review line after more than one return',
    words: ' — after {n} returns with a reason',
    rule: 'One return reads as the export draws it (“— after 1 return with a reason”); two or more take the plural.',
    basis: 'CM-v1 `decVM` `reviewLine` (one return drawn)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-03.vendor-person': {
    screen: 'CM-03',
    state: 'Who “From the vendor” names',
    words: null,
    rule: '“<organisation> · <person>”: the person is the one who first submitted the record (its first “submitted” history entry); with no such entry, the organisation alone.',
    basis: 'CM-v1 `decVM` `venLine` (“Northline Simulation Studio · Anil Shetty”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-03.course': {
    screen: 'CM-03',
    state: 'A course without a platform code',
    words: null,
    rule: 'Where the export writes the code and name (“ME ZG523 · Thermodynamics & Heat Transfer”: the dialog, the history), a course without a platform code is named by its name; where it writes the code alone (“Listed under ME ZG523”), by its name. The code chip is left out.',
    basis: 'CM-v1 `cLabel`, `cShort`, `hasCode`; CM-09 blank codes',
    status: 'provisional',
    decisions: ['VD-12', 'T-17'],
  },
  'CM-03.history': {
    screen: 'CM-03',
    state: 'Which history entries the Content Manager reads',
    words: null,
    rule: 'Newest first, the entries the record shows the Content Manager: submitted, returned by the Academic Reviewer (the reason quoted), resubmitted, approved (with the outcomes it sent), sent back to the Academic Reviewer (the reason quoted) or to the vendor (the reason quoted, then “Refers to: …” with the fields chosen) and published. A draft save and the routing stand-in’s routing step are not listed. A resubmission has no note: the record does not say what the vendor changed (the export’s “changed the VR device need” is sample text).',
    basis: 'CM-v1 sample `sh` entries; `opSendBack`, `opPublish`',
    status: 'provisional',
    decisions: ['VD-12', 'M-3'],
  },
  'CM-03.read-only': {
    screen: 'CM-03',
    state:
      'A submission that is not with the Content Manager: with the Academic Reviewer (first review, resubmission, re-check) or with the vendor (returned by the Academic Reviewer or by the Content Manager)',
    words: null,
    rule: 'The page opens read-only — the gate “Read from the record”, the catalogue preview, the summary and the history — with no Publish or Send back. The panel shows the export’s notice for the state (“Still in academic review”; “Back with the Academic Reviewer for a re-check” with the day and reason she sent it back; “With the vendor” with who returned it and when), “Nothing to decide yet.” and “Back to the Content library”. A draft is the Vendor’s only: not found.',
    basis: 'CM-v1 `decVM` `roMap`; boards P08-InReview, P09-WithVendor',
    status: 'provisional',
    decisions: ['VD-12', 'SUB-16'],
  },
  'CM-03.returned-override': {
    screen: 'CM-03',
    state:
      'With the vendor after a Super Admin’s status override (not returned by the Academic Reviewer or by her)',
    words:
      'It was returned with a reason. It comes back to the Academic Reviewer when the vendor resubmits.',
    rule: 'The read-only notice “With the vendor” with this line: the export words only a return by the Academic Reviewer or by the Content Manager.',
    basis: 'CM-v1 `decVM` `roMap.returned`; v46 B6-07 script `roBody` (the generic return)',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B7-09'],
  },
  'CM-03.fix-read-only': {
    screen: 'CM-03',
    state: 'A failing check while the record is not with the Content Manager',
    words: null,
    rule: 'The red “what to do” line under a failing check shows only while the decision is open (with the Content Manager): read-only, there is nothing to send back, so the row shows its state only.',
    basis: 'CM-v1 `decVM` `hasFix: !k.ok && !!k.fix && withCm`',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-03'],
  },
  'CM-03.published-check': {
    screen: 'CM-03',
    state: 'The publication check of a published record',
    words: null,
    rule: 'Once published, “Approved by the Academic Reviewer” reads met with the approval it was published on (who, when), as the export draws it (“All 4 were met when it was published”); the service’s check reports the approval only while the record waits with the Content Manager. The other rows are the service’s.',
    basis: 'CM-v1 `checksOf` (`published` counts as approved); board P06-Published',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-03'],
  },
  'CM-03.sent-back': {
    screen: 'CM-03',
    state: 'After a send back, and when it is opened again later',
    words: null,
    rule: 'Right after Send back on this page the panel shows the result (“Back with the Academic Reviewer” or “With the vendor”, “Sent back by you on …”, the reason quoted, where it stands and what happens next, “Back to Ready to publish”), focused. Opened again later, the record is read-only with the notice that keeps the reason (`CM-03.read-only`). Once approved again the decision is open.',
    basis:
      'CM-v1 `decVM` `doneMap.sent_rv`, `doneMap.sent_vendor`, `roMap`; boards P05-SentReviewer, P09-WithVendor',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-03.published-by': {
    screen: 'CM-03',
    state: 'Who published it, in the result',
    words: 'Published by {name} on {when}',
    rule: 'The export writes “Published by you on <day, time>” (single-manager scope). A record published by another Content Manager names them instead.',
    basis: 'CM-v1 `doneMap.published.meta`; CM-v1 HANDOFF §4 “Several Content Managers”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-03.decision-rev': {
    screen: 'CM-03',
    state: 'Which revision a decision is sent with',
    words: null,
    rule: 'Publish carries the record’s revision from when its confirmation opened; Send back the revision of the record on show. A record that changed meanwhile is refused (`CM-03.stale.changed`).',
    basis: 'Appendix C `expectedRev`; CM-v1 HANDOFF §3 “Every write carries an expectedVersion”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-03.stale.changed': {
    screen: 'CM-03',
    state:
      'A decision refused because the record changed meanwhile (another revision, or published or sent back from another tab or window), when the record read again does not show it published',
    words: '{name} was changed from another tab or window.',
    rule: 'Refused with the export’s notice under the band, focused: “This page is out of date”, the cause, “Nothing was changed by your decision.” and “Show where it is now”. The page keeps what it showed (the choice and reason typed are kept) until “Show where it is now”, which shows the record as read again and moves focus to the panel’s heading. When the record read again is published, the cause is the export’s: “<name> was published from another tab or window at <time>.”',
    basis:
      'CM-v1 `decVM` `staleText`, `reread`; board P07-Stale; CM-v1 CHECKS “Out-of-date pages keep their actions”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-03.stale.title': {
    screen: 'CM-03',
    state: 'Superseded on CM-03 by the export’s “This page is out of date” (`CM-03.stale.changed`)',
    words: 'This submission changed since you opened it',
    rule: 'Not shown on CM-03 since the V3 migration; kept as the conflict formula other registers cite.',
    basis: 'Board 08 “conflict” formula; FA-19 `FA-19.stale.title`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-03.stale.line': {
    screen: 'CM-03',
    state: 'Superseded on CM-03 by the export’s stale notice (`CM-03.stale.changed`)',
    words: 'It has been read again. Check it, then decide again.',
    rule: 'Not shown on CM-03 since the V3 migration; kept as the conflict formula other registers cite.',
    basis: 'Board 08 “conflict” formula',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-03.moved-on': {
    screen: 'CM-03',
    state:
      'A decision refused for another reason than a change made meanwhile (a check now fails, not permitted)',
    words: 'This submission has moved on. Its current state is shown.',
    rule: 'The confirmation closes, the record is read again and the panel shows what it is now (the blockers to resolve, or read-only) with this notice; focus moves to the panel’s heading. A record changed or decided meanwhile is `CM-03.stale.changed`. The export draws no such refusal.',
    basis: 'Board 08 “conflict” formula; SA-03 `SA-03.moved-on`',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-03'],
  },
  'CM-03.unavailable.publish': {
    screen: 'CM-03',
    state: 'Publish failed for now (service unavailable)',
    words: 'It wasn’t published. Nothing was lost — try again.',
    rule: 'Shown in the confirmation, which stays open.',
    basis: 'Board 08 “failed, try again · Nothing was lost”. The export draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-03.unavailable.send': {
    screen: 'CM-03',
    state: 'Send back failed for now (service unavailable)',
    words: 'It wasn’t sent back. Nothing was lost — try again.',
    rule: 'Shown in the decision panel, which keeps the choice and reason typed.',
    basis: 'Board 08 “failed, try again · Nothing was lost”. The export draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  // ---- CM-05 Published experiment ----
  'CM-05.loading': {
    screen: 'CM-05',
    state: 'The experiment loading (screen readers; the skeleton in a section)',
    words: 'Loading the published experiment',
    rule: 'The application’s existing page loading inside the shell (CM-v1 HANDOFF §4 last row).',
    basis: 'Board 04 “State grammar” Loading formula; CM-v1 HANDOFF §4',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-05.failed': {
    screen: 'CM-05',
    state: 'The experiment failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load this experiment',
    basis:
      'B4-02 f5 “We couldn’t load your experiments”. CM-v1 HANDOFF §4: no record-page failed design',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-05.failed.line': {
    screen: 'CM-05',
    state: 'The failed state’s reassurance',
    words: 'Nothing has changed. Try again.',
    basis: 'B4-02 f5 failed formula; the CM-v1 list states’ “Nothing has changed. Try again.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-05.top-title': {
    screen: 'CM-05',
    state: 'The rail’s current item and the document title',
    words: null,
    rule: 'The rail marks “Content library”; the breadcrumb inside the page reads “Content library / <experiment>”. The document title follows the shell rule: “<experiment> · Content library · XR Learning Platform”.',
    basis: 'CM-v1 `Main.dc.html` CM-05 `nav.rk-crumbs`; the V3 role shell',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-05.correction-entry': {
    screen: 'CM-05',
    state:
      'The Corrections panel: “Start a correction”, “Edit catalogue details”, “Edit delivery link”, “Continue the update”, “Open update”',
    words: null,
    rule: 'With no update open: “Start a correction” (the primary), “Edit catalogue details” and “Edit delivery link”, each opening the one correction draft on its update page. While an update is a draft or returned: the notice “A correction is open”, “Continue the update” (the primary, a link to the update) and the two edit entries, which join it. While it is in academic review, awaiting the release decision or on hold: the notice “An update is in progress” and only “Open update”. The service opens or joins the draft and refuses a second one.',
    basis:
      'CM-v1 `pubVM` `noOpen`, `joinable`, `locked`; boards CM05-Published, C14-PubAwaiting, C15-PubOnHold',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-07'],
  },
  'CM-05.corrections-fact': {
    screen: 'CM-05',
    state: 'The band’s “Corrections” fact',
    words: null,
    rule: 'The open correction by its status, in the Content library’s chip words (“Update on hold”, “Update returned to you”, “Update draft in progress”, “Update in academic review”, “Update awaiting release”), never its reference; with none open, the released corrections counted from the experiment’s versions (“2 corrections released”); with none, “None yet”.',
    basis:
      'CM-v1 `pubVM` `corrFact` (“UPD-0004 · On hold”), `libVM` `tag`; Owner visual-review correction, 20 Oct 2026: no internal reference (SA-v1 rule)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-05.released-today': {
    screen: 'CM-05',
    state: 'The live version was released today',
    words: null,
    rule: 'When the live version came from a correction released on today’s date (the session’s clock, in India time): the green notice “Version <label> is live” with “The Super Admin released the correction on <day>.” (the correction named by what it is, not its reference), the version it replaced and that nobody’s access changed.',
    basis:
      'CM-v1 `pubVM` `rel`, `relTitle`, `relBody`; board C16-PubReleased; Owner visual-review correction, 20 Oct 2026: no internal reference (SA-v1 rule)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-05.history': {
    screen: 'CM-05',
    state: 'The versions and updates history',
    words: null,
    rule: 'Newest first: the open update, if any (on hold: “Update on hold”, the day, “Version <live> stays live. Reason: “…”” — the hold reason quoted as the Super Admin wrote it; otherwise “Update started — <status>”, the day it started, “Version <label>. The live version below is unchanged.”); each released correction (“Version <label> released”, the day it went live, “Correction released by the Super Admin.” for the live version, “Correction.” for an earlier one — the product’s words around the version’s source, which holds only the update’s reference, so the reference and its dash are left out); the first publication (“Published · version <label>”, “First publication by the Content Manager.”). No internal reference in any entry.',
    basis:
      'CM-v1 `pubVM` `histOpen` (“UPD-0004 on hold”, “UPD-0005 started — …”), sample `hist` entries (“Correction UPD-0002 — released by the Super Admin.”, “Correction UPD-0001.”, “…, from SUB-0052.”); Owner visual-review correction, 20 Oct 2026: no internal reference (SA-v1 rule)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-05.references': {
    screen: 'CM-05',
    state: 'Internal references on the published experiment and its Corrections panel',
    words: null,
    rule: 'No internal reference (REQ-, ACC-, UPD-, DTR-, SUP-, SUB-) in the page’s words or accessible names, the tab title included: the open correction is named by its status (“Update on hold”, `CM-05.corrections-fact`) in the band’s fact, its track’s pill and the panel’s notice (“Update on hold. The Super Admin put it on hold. Version 2.0 stays live.”); the history and the released notice name corrections by what they are (`CM-05.history`, `CM-05.released-today`). “Continue the update” and “Open update” keep the update’s reference in their address only.',
    basis:
      'CM-v1 `pubVM` `corrFact`, `trkId`, `progBody`, `histOpen`, `relBody`; Owner visual-review correction, 20 Oct 2026: no internal reference (SA-v1 rule)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-05.empty-value': {
    screen: 'CM-05',
    state: 'A live delivery value the record leaves blank (a package with no label or reference)',
    words: '—',
    basis:
      'B6-03 script `deliv.ref` (“—” for a missing package reference). The export draws every value',
    status: 'provisional',
    decisions: ['VD-12', 'T-14'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
