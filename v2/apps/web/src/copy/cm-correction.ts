/**
 * The words of the correction entry on CM-05 Published experiment (B6-08: the entries' labels and
 * “Back from the correction”) and of the correction group's V3 screens — CM-08 Updates (the list),
 * the correction at `/content-manager/updates/[updateId]` in every state and the CM-06 / CM-07
 * arrivals on it — in the owner-approved Content Manager export (design/v3-refined-b/roles/CM-v1,
 * `project/Main.dc.html`: the “CM-08 Updates list” and “CM-08 Correction detail” templates, the
 * Send for academic review and Withdraw dialogs, and the script's `updListVM`, `updVM`, `opStart`,
 * `opSend`, `hoLift`). Every phrase is the export's own, found verbatim in its markup or script
 * (`cm-correction.test.ts`); the composed lines take the script's forms with the records' values —
 * names, versions and dates are never copied from the export's sample world. Where the export names
 * an update by its reference (UPD-…), the owner's correction of 20 Oct 2026 names it by its
 * experiment instead (state-copy `CM-08.no-reference`); the reference stays in the address. The
 * status words, the stage track's words and the version change are the role's shared ones
 * (`cm-shared.ts`). What the export does not word is a provisional entry of the state-copy register
 * (`state-copy-cm-correction.ts`, VD-12). A correction is never “published”: it is sent for
 * academic review, then released or held (BC8).
 */
import type { CorrectionEntry } from '@xr/domain';

import { CORRECTION_ACTIONS } from './flow-state-words';

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

// ---- CM-05 Published experiment: the correction entry (B6-08) ----------------------------------

/** The three entries and "Open update" (B6-08 `startCorr`, `editCat`, `editDel`, `openUpd`). */
export const CORRECTION_ENTRY = {
  start: 'Start a correction',
  editCatalogue: 'Edit catalogue details',
  editDelivery: 'Edit delivery link',
  openUpdate: CORRECTION_ACTIONS.openUpdate,
} as const;

/** B6-08 f3 `showBack`: the notice after leaving the draft. */
export const BACK_FROM_CORRECTION = {
  title: 'Back from the correction',
  line: 'The live version is unchanged until the Super Admin releases the update.',
} as const;

/** An entry's label by the service's entry name. */
export function entryLabel(entry: CorrectionEntry): string {
  switch (entry) {
    case 'start-a-correction':
      return CORRECTION_ENTRY.start;
    case 'edit-catalogue-details':
      return CORRECTION_ENTRY.editCatalogue;
    case 'edit-delivery-link':
      return CORRECTION_ENTRY.editDelivery;
  }
}

// ---- CM-08 Updates: the list (`updListVM`) -----------------------------------------------------

export const UPDATES_HEAD = {
  /** `p.rk-sub` under “Updates”. */
  lead: 'Corrections you raised to published experiments. Live content changes only this way: you, then the Academic Reviewer, then the Super Admin’s release.',
  /** `dl.rb-figs[aria-label]`. */
  figuresLabel: 'Your corrections at a glance',
  needYou: 'Need you',
  needYouSome: 'Returned to you or not sent yet',
  needYouNone: 'Nothing waiting for you',
  withOthers: 'With others',
  withOthersSome: 'With the Academic Reviewer or the Super Admin',
  withOthersNone: 'Nothing in review or awaiting release',
} as const;

/** “4 corrections you raised, most recent change first” (`p.rk-count.cm-trkcount`). */
export function trackerCount(count: number): string {
  return `${plural(count, 'correction')} you raised, most recent change first`;
}

/** The three groups, by who must act (`sections`): hers, the chain's, closed. */
export const TRACKER_GROUPS = {
  you: { title: 'Need you', note: 'Change it and send it, or withdraw it' },
  others: {
    title: 'With others',
    note: 'Nothing for you to do · the live version stays until release',
  },
  closed: { title: 'Closed', note: 'Kept with their history' },
} as const;

export const TRACKER = {
  /** A card's action: hers to continue (draft, returned), else Open. */
  continue: 'Continue',
  open: 'Open',
  foot: 'Start a correction from a published experiment in the Content library. Each experiment has at most one open update.',
  /** The list surface's name (`section.rk-surface[aria-label]`) when empty or loading. */
  surface: 'Corrections you raised',
  emptyTitle: 'You haven’t raised any corrections',
  emptyLine: 'Start one from a published experiment in the Content library.',
  openLibrary: 'Open the Content library',
  loading: 'Loading your corrections…',
  failedTitle: 'We couldn’t load your corrections',
  failedLine: 'Nothing has changed. Try again.',
  tryAgain: 'Try again',
} as const;

/**
 * A card's meta (`meta`): “EEE ZC341 · Electrical Machines · last change 26 Aug”; the course is
 * left out while it is not known. The export leads with the update's reference; the owner's
 * correction (state-copy `CM-08.no-reference`) leaves it out.
 */
export function trackerMeta(course: string | null, lastChange: string): string {
  return [course, `last change ${lastChange}`].filter(Boolean).join(' · ');
}

/** “the update to Induction Motor Loading”: an update named by its experiment, never its reference. */
export function theUpdateTo(name: string): string {
  return `the update to ${name}`;
}

/**
 * A card action's name (`aria`): “Continue the update to Induction Motor Loading, version 1.1,
 * returned”, “Open the update to Distillation Column, version 1.2, released” — the version (the
 * proposed or released label) whenever the update has one, so two updates to one experiment never
 * share a name (state-copy `CM-08.no-reference`; the export names it by its reference).
 */
export function trackerActionLabel(
  yours: boolean,
  name: string,
  version: string | null,
  status: string,
): string {
  const label = version?.trim();
  return `${yours ? TRACKER.continue : TRACKER.open} ${theUpdateTo(name)}${label ? `, version ${label}` : ''}, ${status.toLowerCase()}`;
}

/** Whose reason a card quotes (`noteBy`): “Prof. A. Menon, Academic Reviewer · 26 Aug”. */
export function returnedNoteBy(by: string, day: string): string {
  return `${by}, Academic Reviewer · ${day}`;
}

/** “Arjun Mehta, Super Admin · 20 Aug”. */
export function heldNoteBy(by: string, day: string): string {
  return `${by}, Super Admin · ${day}`;
}

/** “Your reason · 27 Aug”. */
export function withdrawnNoteBy(day: string): string {
  return `Your reason · ${day}`;
}

/** A reason as the cards, the panel and the history quote it: “…” in typographic quotes. */
export function quotedReason(reason: string): string {
  return `“${reason}”`;
}

/** A released card's outcome (`res`). */
export function releasedOutcome(by: string, day: string, version: string): string {
  return `Released by ${by}, Super Admin, on ${day}. Version ${version} is live for everyone.`;
}

/** A withdrawn card's outcome (`res`). */
export function withdrawnOutcome(day: string): string {
  return `Withdrawn on ${day}. Nothing changed in the live version.`;
}

// ---- CM-08 the correction: the identity band (`updVM`) -------------------------------------------

/** The stable H1: “Update to Induction Motor Loading” — also the crumb and the browser tab's words. */
export function updateTitle(name: string): string {
  return `Update to ${name}`;
}

export const UPDATE_BAND = {
  /**
   * `p.rk-eyebrow`: the export's “UPD-0006 · Correction to a published experiment” without the
   * reference (state-copy `CM-08.no-reference`).
   */
  eyebrow: 'Correction to a published experiment',
  backToPublished: 'Back to the published experiment',
  /** `a.rb-btn.rk-goto[href=#cm-u-panel]`, shown under 860 px. */
  goToActions: 'Go to actions',
} as const;

/** The band's facts (`dl.cm-idfacts`): their terms and their empty values. */
export const UPDATE_FACTS = {
  liveVersion: 'Live version',
  proposed: 'Proposed',
  fieldsChanged: 'Fields changed',
  started: 'Started',
  sent: 'Sent',
  liveBefore: 'Live before',
  releasedVersion: 'Released version',
  released: 'Released',
  withdrawn: 'Withdrawn',
  /** A label not set while it can still be (draft, returned). */
  notSetYet: 'Not set yet',
  /** A withdrawn update that never had one. */
  notSet: 'Not set',
  noneYet: 'None yet',
} as const;

/** “1.0, unchanged until released” (open). */
export function liveUntilReleased(live: string): string {
  return `${live}, unchanged until released`;
}

/** “1.0, unchanged” (withdrawn). */
export function liveUnchanged(live: string): string {
  return `${live}, unchanged`;
}

/** “2 fields” (the band's “Fields changed”). */
export function fieldsWords(count: number): string {
  return plural(count, 'field');
}

/** Where the correction started from (`opStart` `from`), as the band's “Started” fact says it. */
export function startedFromWords(entry: CorrectionEntry): string {
  if (entry === 'edit-catalogue-details') return CORRECTION_ENTRY.editCatalogue;
  if (entry === 'edit-delivery-link') return CORRECTION_ENTRY.editDelivery;
  return 'the published experiment';
}

/** “24 Aug 2026 · from Edit catalogue details”. */
export function startedFact(day: string, entry: CorrectionEntry): string {
  return `${day} · from ${startedFromWords(entry)}`;
}

/** “5 Aug 2026 · Arjun Mehta”. */
export function releasedFact(day: string, by: string): string {
  return by ? `${day} · ${by}` : day;
}

// ---- CM-08 the correction: the arrival from CM-05 (CM-06, CM-07) ---------------------------------

/** How the entry names itself in the arrival notice (`entFrom`). */
function arrivalFrom(entry: CorrectionEntry): string {
  if (entry === 'edit-catalogue-details') return CORRECTION_ENTRY.editCatalogue;
  if (entry === 'edit-delivery-link') return 'Edit a delivery link';
  return CORRECTION_ENTRY.start;
}

/** “New correction draft, from Edit catalogue details”. */
export function arrivalNewTitle(entry: CorrectionEntry): string {
  return `New correction draft, from ${arrivalFrom(entry)}`;
}

/** What the new draft holds (`entB`). */
export function arrivalNewBody(entry: CorrectionEntry, live: string): string {
  return entry === 'edit-delivery-link'
    ? `The delivery details are pre-filled with live version ${live}. Change the link and say why. The live link keeps working until the Super Admin releases the update.`
    : `Every field is pre-filled with live version ${live}. Change only what needs correcting and say why. Nothing changes in the catalogue until the Super Admin releases it.`;
}

/**
 * The joined arrival's title: the export's “Your edit joins UPD-0006” names the open update by its
 * reference; the owner's correction names it by what it is (state-copy `CM-08.no-reference`).
 */
export const ARRIVAL_JOIN_TITLE = 'Your edit joins the open update';

/** Why the edit joined the open correction (`entB`, joined). */
export function arrivalJoinBody(entry: CorrectionEntry): string {
  const what =
    entry === 'edit-delivery-link'
      ? 'delivery change goes'
      : entry === 'edit-catalogue-details'
        ? 'catalogue changes go'
        : 'changes go';
  return `This experiment already has an open correction, so your ${what} into it. One correction at a time per experiment.`;
}

/** The arrival notice's button (`entryGo`): back to the field the entry names. */
export const ARRIVAL_GO = {
  webLink: 'Go to the web link',
  catalogue: 'Go to the catalogue details',
} as const;

// ---- CM-08 the correction: the sheet -------------------------------------------------------------

export const UPDATE_SHEET = {
  returnedTitle: 'Returned by the Academic Reviewer',
  returnedHint: 'Change what’s needed below, then send it for academic review again.',
  aboutTitle: 'About this correction',
  aboutNote: 'Both are needed to send it',
  whyLabel: 'Reason for the change (required to send)',
  whyHint:
    'The Academic Reviewer reads this first. The Super Admin sees it when deciding on the release.',
  versionLabel: 'New version label (required to send)',
  catalogueTitle: 'Catalogue details',
  catalogueNote: 'Pre-filled with the live version · change only what needs correcting',
  name: 'Name',
  summary: 'Summary',
  summaryHint: 'One sentence. The first thing people read in the catalogue.',
  description: 'Description',
  deliveryTitle: 'Delivery',
  deliveryNote: 'Pre-filled with the live version',
  webLink: 'WEB · web link',
  webHint: 'Starts with https://',
  /** `span.cm-tag` beside a field that differs from the live version. */
  changed: 'Changed',
  /** Read-only: the reason, quoted. */
  whyTitle: 'What changes and why',
  comparisonTitle: 'Current and proposed',
  comparisonNote: 'Changed fields only',
  releasedComparisonTitle: 'What changed',
  releasedComparisonNote: 'Live before and released · changed fields only',
  field: 'Field',
  liveNow: 'Live now',
  proposed: 'Proposed',
  liveBefore: 'Live before',
  releasedColumn: 'Released',
  nothingChanged: 'Nothing changed yet.',
  historyTitle: 'Update history',
  historyNote: 'Newest first',
} as const;

/** “Returned by the Academic Reviewer”'s meta (`retMeta`): “26 Aug 2026, 10:00 · Prof. A. Menon”. */
export function returnedMeta(at: string, by: string): string {
  return by ? `${at} · ${by}` : at;
}

/** Whose words the returned reason is (`retBy`): “Prof. A. Menon, Academic Reviewer”. */
export function returnedBy(by: string): string {
  return `${by}, Academic Reviewer`;
}

/**
 * The next minor version after the live one, the version label hint's example (`nextVer`): 1.0 →
 * 1.1, 1.2 → 1.3, 2.0 → 2.1; a label that is not "<major>.<minor>" keeps "1.3" (state-copy
 * `CM-08.version-example`).
 */
export function exampleVersionAfter(live: string): string {
  const match = /^(\d+)\.(\d+)$/.exec(live.trim());
  return match ? `${match[1]}.${Number(match[2]) + 1}` : '1.3';
}

/** “For example 1.1. The live version is 1.0.” */
export function versionHint(live: string): string {
  return `For example ${exampleVersionAfter(live)}. The live version is ${live}.`;
}

/** “VR · package reference” (`fieldsOf`; one per app format the experiment has). */
export function packageReferenceLabel(format: 'ar' | 'vr' | 'mr'): string {
  return `${format.toUpperCase()} · package reference`;
}

/**
 * The package reference's hint (`pkFields.hint`): “App package fields are provisional. The live
 * reference is IML-VR-1.0.”; without a live reference, the first sentence only.
 */
export function packageHint(liveReference: string | null): string {
  const first = 'App package fields are provisional.';
  return liveReference ? `${first} The live reference is ${liveReference}.` : first;
}

/** The read-only reason's note (`p.rb-note`): “Version 1.1”. */
export function versionNote(label: string): string {
  return `Version ${label}`;
}

/** The comparison's caption: “Current and proposed, changed fields only”. */
export function comparisonCaption(title: string): string {
  return `${title}, changed fields only`;
}

// ---- CM-08 the correction: the panel -------------------------------------------------------------

export const UPDATE_PANEL = {
  title: 'Your update',
  /** `div.rk-errsum` “Check the update” (the catalogue's `SUMMARY_TITLES['CM-08']` too). */
  checkTitle: 'Check the update',
  saveFailedTitle: 'We couldn’t save your draft',
  saveFailedLine: 'Your changes are still on this page. The live version is unchanged. Try again.',
  tryAgain: 'Try again',
  savedTitle: 'Draft saved',
  changes: 'Changes',
  lastSaved: 'Last saved',
  noneYet: 'None yet',
  notSavedYet: 'Not saved yet',
  send: 'Send for academic review',
  saveDraft: 'Save draft',
  saving: 'Saving…',
  withdraw: 'Withdraw update',
  openPublished: 'Open the published experiment',
  /** Before the hold or withdrawal reason in the state notice. */
  reason: 'Reason:',
} as const;

/** The saved notice's line (`savedText`): “27 Aug 2026, 16:05 · the live version is unchanged”. */
export function savedLine(at: string): string {
  return `${at} · the live version is unchanged`;
}

/** “2 fields changed” (`nChanged`). */
export function changesWords(count: number): string {
  return count > 0 ? `${plural(count, 'field')} changed` : UPDATE_PANEL.noneYet;
}

/** “Last saved” (`draftState`): when, and whether there are unsaved changes. */
export function lastSavedWords(at: string | null, unsaved: boolean): string {
  const saved = at ?? UPDATE_PANEL.notSavedYet;
  return unsaved ? `${saved} · you have unsaved changes` : saved;
}

/** What is still missing before it can be sent (`pending` parts). */
export const PENDING_PARTS = {
  why: 'say what changes and why',
  version: 'add a new version label',
  change: 'change at least one field',
} as const;

/** “Before you send it: say what changes and why, add a new version label, change at least one field.” */
export function pendingLine(parts: readonly string[]): string {
  return `Before you send it: ${parts.join(', ')}.`;
}

/** The state notice's titles (`N`). */
export const STATE_NOTICE = {
  draft: 'Draft — only you can see it',
  returned: 'Returned to you',
  review: 'In academic review',
  awaiting: 'Awaiting release decision',
  hold: 'On hold',
  released: 'Released',
  withdrawn: 'Withdrawn',
} as const;

/** Draft: “Version 1.0 stays live. Send it for academic review when it’s ready.” */
export function draftLine(live: string): string {
  return `Version ${live} stays live. Send it for academic review when it’s ready.`;
}

/** Returned: “Prof. A. Menon returned it on 26 Aug 2026. Change it and send it … Version 1.0 stays live.” */
export function returnedLine(by: string | null, on: string | null, live: string): string {
  const who = by && on ? `${by} returned it on ${on}. ` : '';
  return `${who}Change it and send it for academic review again. Version ${live} stays live.`;
}

/**
 * In academic review (`N.review`): “With the Academic Reviewer since 27 Aug 2026. Read-only while it
 * is reviewed. The live version 1.0 is unchanged.” The export names the reviewer; the update
 * records no reviewer until one decides (state-copy `CM-08.reviewer-unnamed`).
 */
export function inReviewLine(since: string, live: string): string {
  return `With the Academic Reviewer since ${since}. Read-only while it is reviewed. The live version ${live} is unchanged.`;
}

/** Awaiting the release decision (`N.awaiting`). */
export function awaitingLine(by: string, on: string, live: string): string {
  return `Approved by ${by} on ${on}. The Super Admin decides whether to release it or put it on hold. Version ${live} stays live until it is released.`;
}

/** After a hold was lifted (`N.awaiting` extra). */
export function liftedLine(on: string): string {
  return `The hold was lifted on ${on}. Nothing went live; it is waiting for the Super Admin’s decision again.`;
}

/** On hold (`N.hold`): “The Super Admin put this update on hold on 20 Aug 2026. Version 2.0 stays live.” */
export function holdLine(on: string, live: string): string {
  return `The Super Admin put this update on hold on ${on}. Version ${live} stays live.`;
}

/** The hold reason (`N.hold` quote): “"…" — Arjun Mehta, Super Admin”. */
export function holdReason(reason: string, by: string): string {
  return by ? `“${reason}” — ${by}, Super Admin` : `“${reason}”`;
}

/** Released (`N.released`). */
export function releasedLine(version: string, on: string, from: string): string {
  return `Version ${version} is live for everyone since ${on}. The history keeps version ${from} and every decision.`;
}

/** Withdrawn (`N.withdrawn`). */
export function withdrawnLine(on: string): string {
  return `Withdrawn on ${on}. The live version is unchanged. You can start a new correction from the published experiment.`;
}

/** The stale notice (`E.stale`): a command refused because the update changed meanwhile. */
export const STALE_NOTICE = {
  title: 'This update changed while you were on the page',
  action: 'Show where it is now',
  nothingChanged: 'Nothing was changed by your action.',
} as const;

/**
 * Approved meanwhile (`staleText`, `rv-approved`): “The Academic Reviewer approved it at 16:20, so
 * it can’t be withdrawn or changed now. Release or hold is the Super Admin’s decision. Nothing was
 * changed by your action.”
 */
export function approvedMeanwhileLine(time: string): string {
  return `The Academic Reviewer approved it at ${time}, so it can’t be withdrawn or changed now. Release or hold is the Super Admin’s decision. ${STALE_NOTICE.nothingChanged}`;
}

// ---- the update history (`uh`; `opStart`, `opSend`, `hoApprove`, `hoReturn`, `hoHold`, …) ------

/**
 * “Correction started from Edit catalogue details”, “… from Edit delivery link”; a Start a
 * correction one “… from the published experiment”.
 */
export function startedWhat(entry: CorrectionEntry | null): string {
  if (entry === 'edit-catalogue-details' || entry === 'edit-delivery-link') {
    return `Correction started from ${entryLabel(entry)}`;
  }
  return 'Correction started from the published experiment';
}

/** “Pre-filled with the live version 1.0.” */
export function startedNote(live: string): string {
  return `Pre-filled with the live version ${live}.`;
}

export const SENT_WHAT = 'Sent for academic review';
/** A send after the reviewer returned it (`opSend`, `again`). */
export const SENT_AGAIN_WHAT = 'Sent again for academic review';

/** “To the Academic Reviewer. The live version 1.0 is unchanged.” (state-copy `CM-08.reviewer-unnamed`). */
export function sentNote(live: string): string {
  return `To the Academic Reviewer. The live version ${live} is unchanged.`;
}

export function returnedWhat(by: string): string {
  return `Returned by ${by}`;
}

export function approvedWhat(by: string): string {
  return `Approved by ${by}`;
}

/** “With the Super Admin for a release decision. The live version stays 1.0 until then.” */
export function approvedNote(live: string): string {
  return `With the Super Admin for a release decision. The live version stays ${live} until then.`;
}

export function heldWhat(by: string): string {
  return `Put on hold by ${by}`;
}

/** “"<reason>" Version 2.0 stays live.” */
export function heldNote(reason: string, live: string): string {
  return `“${reason}” Version ${live} stays live.`;
}

export function liftedWhat(by: string): string {
  return `Hold lifted by ${by}`;
}

export const LIFTED_NOTE = 'Waiting for a release decision again. Nothing went live.';

export function releasedWhat(by: string): string {
  return `Released by ${by}`;
}

/** “Version 1.1 is live for everyone.” */
export function releasedNote(version: string): string {
  return `Version ${version} is live for everyone.`;
}

export const WITHDRAWN_WHAT = 'Withdrawn';

/** “"<reason>" Nothing changed in the live version.” */
export function withdrawnNote(reason: string): string {
  return `“${reason}” Nothing changed in the live version.`;
}

// ---- the dialogs (DL-1 Send for academic review, DL-2 Withdraw) ----------------------------------

export const SEND_DIALOG = {
  description:
    'It goes to the Academic Reviewer, then to the Super Admin, who decides when to release it.',
  now: 'What happens now',
  later: 'Only after later events',
  /** `nowList[0]` with the reviewer unnamed (state-copy `CM-08.reviewer-unnamed`). */
  reviewerCanReview:
    'The Academic Reviewer can review it. It becomes read-only for you while it is reviewed.',
  ifApproved: 'If it is approved, the Super Admin decides whether to release it or put it on hold.',
  releasing:
    'Releasing changes it for everyone who can already open it. It gives no one new access.',
  cancel: 'Cancel',
  confirm: 'Send for academic review',
  busy: 'Sending…',
} as const;

/**
 * “Send the update to Induction Motor Loading for academic review?” (the export's “Send UPD-0006 for
 * academic review?”, named by its experiment: state-copy `CM-08.no-reference`).
 */
export function sendTitle(name: string): string {
  return `Send ${theUpdateTo(name)} for academic review?`;
}

/** `nowList[1]`: “Version 1.0 stays live — nothing changes for the public or for students.” */
export function sendStaysLive(live: string): string {
  return `Version ${live} stays live — nothing changes for the public or for students.`;
}

export const WITHDRAW_DIALOG = {
  description:
    'Nothing changes in the live version. The update closes and can’t be sent again; you can start a new correction later.',
  reason: 'Reason (required)',
  reasonHint: 'Kept in this update’s history.',
  cancel: 'Cancel',
  confirm: 'Withdraw update',
  busy: 'Withdrawing…',
} as const;

/**
 * “Withdraw the update to Induction Motor Loading?” (the export's “Withdraw UPD-0006?”, named by its
 * experiment: state-copy `CM-08.no-reference`).
 */
export function withdrawTitle(name: string): string {
  return `Withdraw ${theUpdateTo(name)}?`;
}

// ---- no update (B6-13 f0; the export draws none) -----------------------------------------------

export const NO_UPDATE = {
  title: 'No update open',
  line: 'Start a correction from a published experiment.',
  action: 'Open the Content library',
} as const;
