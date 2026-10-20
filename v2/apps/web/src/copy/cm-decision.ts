/**
 * The words of CM-03 Publication decision and CM-05 Published experiment, as the owner-approved
 * Content Manager export draws them (V3 Refined B; design/v3-refined-b/roles/CM-v1,
 * `project/Main.dc.html`: the templates of `v.decision` and `v.published`, the Publish dialog, and
 * the script's `decVM`, `checksOf`, `pubVM`). Every phrase is the export's own, found verbatim in
 * its markup or script (`cm-decision.test.ts`); the composed lines take the script's forms with the
 * records' values — names, codes, dates and counts are never copied from the export's sample world.
 * The status words, the stage track's words and the version change are the role's shared words
 * (`cm-shared.ts`); the correction entries' words are the correction group's (`cm-correction.ts`).
 * What the export does not word is a provisional entry of the state-copy register
 * (`state-copy-cm-decision.ts`, VD-12). No internal reference (SUB-, UPD- …) is part of any words:
 * the owner's visual-review correction of 20 Oct 2026 (the SA-v1 rule) names things by content —
 * the band's record kind without its submission, an open correction by its status words (the
 * library's chip words, `cm-lists.ts`), a release by what it did (state-copy `CM-03.references`,
 * `CM-05.references`).
 */
import type { ReturnReference } from '@xr/domain';

import { CONTENT_LIBRARY } from './cm-lists';
import { stateWords } from './state-copy';

/** "1 outcome", "3 outcomes" (the script's `plural`). */
function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/**
 * Formats as the export joins them in a sentence (the script's `fand`): "WEB", "WEB and VR",
 * "WEB, AR and VR".
 */
export function formatsSentence(codes: readonly string[]): string {
  if (codes.length <= 1) return codes[0] ?? '';
  return `${codes.slice(0, -1).join(', ')} and ${codes.at(-1)}`;
}

/** The formats as the band's fact lists them: "WEB · VR". */
export function formatsList(codes: readonly string[]): string {
  return codes.join(' · ');
}

/** What the format badges mean, read instead of the codes: "Formats: WEB, VR" (`fmtAria`). */
export function formatsLabel(codes: readonly string[]): string {
  return `Formats: ${codes.join(', ')}`;
}

/** A course as the export names it in full (`cLabel`): "ME ZG523 · Thermodynamics & Heat Transfer". */
export function courseLabel(code: string | null, name: string): string {
  return code ? `${code} · ${name}` : name;
}

// ---- CM-03 Publication decision ----------------------------------------------------------------

export const DECISION_PAGE = {
  /**
   * `p.rk-eyebrow` (`D.over`): the record kind, without the export's submission reference (“SUB-0077
   * · First publication”; owner correction, state-copy `CM-03.references`).
   */
  overline: 'First publication',
  /** `a.rb-btn.rk-goto` (below 860 px of page width). */
  goTo: 'Go to decision',
  /** The band's facts (`D.facts`). */
  factFormats: 'Formats',
  factOutcomes: 'Learning outcomes',
  factVersion: 'Version',
  factSubmission: 'Submission',
  /** No learning outcomes yet (`dd.is-quiet`). */
  noOutcomesFact: 'None yet',
  checkTitle: 'Publication check',
  /** `D.gateLine` while the record is not with the Content Manager. */
  checkRead: 'Read from the record',
  previewTitle: 'Catalogue preview',
  previewMeta: 'As the public will see it · only formats that passed review',
  /** `D.previewTag`. */
  previewTag: 'Preview — not public yet',
  inCatalogueTag: 'In the public catalogue',
  availableIn: 'Available in',
  outcomesTitle: 'Learning outcomes',
  noOutcomes: 'None yet. The Academic Reviewer sets them during review, one set for every format.',
  formatsTitle: 'Formats and device needs',
  columnFormat: 'Format',
  columnHow: 'How it runs',
  columnDevice: 'Device needs',
  /** A device need the vendor has not given (`devs.dev`). */
  notGivenYet: 'Not given yet',
  summaryTitle: 'Submission and review summary',
  fromVendor: 'From the vendor',
  submissions: 'Submissions',
  academicReview: 'Academic review',
  version: 'Version',
  description: 'Description',
  preview: 'Preview',
  documents: 'Documents',
  deliveryTitle: 'Delivery by format',
  columnDelivery: 'Delivery',
  columnStatus: 'Status',
  /** `deliv.how`. */
  webLink: 'Web link',
  appPackage: 'App package (provisional)',
  /** `deliv.detail` without a package. */
  notGiven: 'Not given',
  /** `deliv.state`. */
  formatPublished: 'Published',
  formatPassed: 'Passed review',
  formatInReview: 'In review',
  formatWithVendor: 'With the vendor',
  allFormats:
    'The experiment is published with all of its formats. Holding one format back isn’t possible.',
  historyTitle: 'History',
  historyMeta: 'Newest first',
  /** `reviewLine` before an approval. */
  notDecided: 'Not decided yet',
} as const;

/** The status line's vendor: "From Northline Simulation Studio". */
export function fromVendor(organisation: string): string {
  return `From ${organisation}`;
}

/** The band's "Submission" fact: "Revision 2". */
export function revisionFact(revision: number): string {
  return `Revision ${revision}`;
}

/** The gate's verdict (`D.gateLine`), with the Content Manager or once published. */
export function gateVerdict(kind: 'open' | 'published', checks: number, notMet: number): string {
  if (kind === 'published') return `All ${checks} were met when it was published`;
  return notMet > 0
    ? `${plural(notMet, 'check')} not met · publishing is blocked`
    : `All ${checks} met · ready to publish`;
}

/** The state in words before each check, for screen readers (`c.sr`). */
export const CHECK_STATE = { met: 'Met: ', notMet: 'Not met: ' } as const;

/**
 * `revLine`: "Submitted 12 Aug 2026 · resubmitted 26 Aug 2026 (revision 2)", or "Submitted 12 Aug
 * 2026" for a first revision.
 */
export function submissionsLine(
  submitted: string,
  resubmitted: string | null,
  revision: number,
): string {
  return revision > 1 && resubmitted
    ? `Submitted ${submitted} · resubmitted ${resubmitted} (revision ${revision})`
    : `Submitted ${submitted}`;
}

/**
 * `reviewLine`: "Approved by Prof. A. Menon on 27 Aug 2026 — after 1 return with a reason". More
 * than one return is undrawn (state-copy `CM-03.returns`).
 */
export function reviewLine(by: string, on: string, returns: number): string {
  const approved = `Approved by ${by} on ${on}`;
  if (returns === 0) return approved;
  if (returns === 1) return `${approved} — after 1 return with a reason`;
  return `${approved}${stateWords('CM-03.returns').replace('{n}', String(returns))}`;
}

/** `reviewLine` for a re-check she asked for. */
export function recheckReviewLine(by: string, approvedOn: string, sentOn: string): string {
  return `Approved by ${by} on ${approvedOn}; you sent it back for a re-check on ${sentOn}`;
}

/** `reviewLine` for a submission the Academic Reviewer returned to its vendor. */
export function returnedReviewLine(by: string, on: string): string {
  return `Returned to the vendor by ${by} on ${on}`;
}

export type PublicationCheckKind =
  'approved-by-reviewer' | 'learning-outcomes' | 'catalogue-details' | 'delivery-per-format';

/** The publication check's rows (`checksOf` `t`). */
export const CHECK_TITLES: Readonly<Record<PublicationCheckKind, string>> = {
  'approved-by-reviewer': 'Approved by the Academic Reviewer',
  'learning-outcomes': 'Learning outcomes',
  'catalogue-details': 'Catalogue details',
  'delivery-per-format': 'Delivery details for each format',
};

/** The rows' second lines (`checksOf` `d`) where they are fixed words. */
export const CHECK_LINES = {
  notApproved: 'Not approved yet',
  noOutcomes: 'None',
  catalogueComplete: 'Name, course, summary, description, version',
  catalogueIncomplete: 'Incomplete',
} as const;

/** What to do about a failing row (`checksOf` `fix`); approval has none. */
export const CHECK_FIXES: Readonly<Record<PublicationCheckKind, string | null>> = {
  'approved-by-reviewer': null,
  'learning-outcomes': 'Send it back to the Academic Reviewer to add them.',
  'catalogue-details': 'Send it back to the vendor.',
  'delivery-per-format': 'Send it back to the vendor.',
};

/** "Prof. A. Menon · 27 Aug 2026" (the approval row). */
export function approvedCheckLine(by: string, on: string): string {
  return `${by} · ${on}`;
}

/** "3 outcomes · one set for every format". */
export function outcomesCheckLine(count: number): string {
  return `${plural(count, 'outcome')} · one set for every format`;
}

/** "WEB · VR — complete" / "WEB · AR — incomplete". */
export function deliveryCheckLine(codes: readonly string[], complete: boolean): string {
  return `${codes.join(' · ')}${complete ? ' — complete' : ' — incomplete'}`;
}

/** `blockText`: "1 thing to resolve before it can be published". */
export function blockersTitle(count: number): string {
  return `${plural(count, 'thing')} to resolve before it can be published`;
}

/** `blockList`: "Learning outcomes: none. Send it back to the Academic Reviewer to add them." */
export function blockerLine(title: string, line: string, fix: string | null): string {
  return `${title}: ${line.toLowerCase()}.${fix ? ` ${fix}` : ''}`;
}

/** A package as the delivery row names it (`deliv.detail`): "Composite Wall — VR build 1.0 · NSS-CW-VR-1.0". */
export function packageDetail(label: string, reference: string): string {
  return `${label} · ${reference}`;
}

// ---- CM-03 the decision panel -------------------------------------------------------------------

export const DECISION_PANEL = {
  title: 'Your decision',
  /** `legend` of the decision's choices. */
  legend: 'Decision',
  publish: 'Publish',
  publishSub: 'It appears in the public catalogue. It gives no one access.',
  /** The unavailable choice while something is missing (`is-off`). */
  publishOff: 'Possible once nothing is missing.',
  sendBack: 'Send back',
  sendBackSub: 'To the Academic Reviewer or the vendor, with a reason.',
  sending: 'Sending…',
  /** `div.rk-errsum` title. */
  errorsTitle: 'Check your decision',
  /** No decision chosen (`e.choice`). */
  chooseDecision: 'Choose a decision',
  /** `D.pending`. */
  pendingChoose: 'Choose Publish or Send back.',
  pendingSend: 'Choose who it goes back to and give a reason before sending it back.',
  pendingBlocked:
    'Publish is possible once nothing is missing. Choose who it goes back to and give a reason.',
  /** Send it to … */
  to: 'Send it to',
  toHint: 'The person you choose sees your reason.',
  reviewer: 'Academic Reviewer',
  reviewerSub: 'For a re-check of the academic content',
  vendor: 'Vendor',
  reasonForVendor: 'Reason the vendor will see',
  reasonForReviewer: 'Reason the Academic Reviewer will see',
  reasonForEither: 'Reason they will see',
  reasonHint: 'Say what needs to change. Nothing is published.',
  references: 'What it refers to (optional)',
  referencesHint: 'The vendor sees these as links to the fields, above their editor.',
  /** Read-only (`D.ro`). */
  nothingYet: 'Nothing to decide yet.',
  backToReady: 'Back to Ready to publish',
  backToLibrary: 'Back to the Content library',
} as const;

/** The reason's label (`reasonLabel`): "Reason the vendor will see (required)". */
export function requiredLabel(label: string): string {
  return `${label} (required)`;
}

/** `toVenSub`: "Northline Simulation Studio — to revise and resubmit". */
export function vendorChoiceSub(organisation: string): string {
  return `${organisation} — to revise and resubmit`;
}

const REFERENCE_STEPS: Readonly<Record<ReturnReference['step'], string>> = {
  'course-and-description': 'Course & description',
  'formats-and-delivery': 'Formats & delivery',
  'preview-and-documents': 'Preview & documents',
};

const REFERENCE_FIELDS: Readonly<Record<ReturnReference['field'], string>> = {
  summary: 'Summary',
  description: 'Description',
  'web-link': 'Web link',
  'browser-and-computer': 'Browser and computer',
  package: 'Package',
  'device-need': 'Device need',
  'install-notes': 'Install notes',
  'preview-link': 'Preview link',
};

/** A reference option (`REFOPTS` `t`): "Formats & delivery · VR · Device need". */
export function referenceWords(reference: ReturnReference, formatCode: string | null): string {
  const step = REFERENCE_STEPS[reference.step];
  const field = REFERENCE_FIELDS[reference.field];
  return formatCode ? `${step} · ${formatCode} · ${field}` : `${step} · ${field}`;
}

/** The read-only notice's titles (`roMap`). */
export const READ_ONLY = {
  inReviewTitle: 'Still in academic review',
  inReviewLine:
    'The Academic Reviewer hasn’t decided yet. It appears in Ready to publish once it is approved — read-only until then.',
  recheckTitle: 'Back with the Academic Reviewer for a re-check',
  vendorTitle: 'With the vendor',
} as const;

/** `roMap.recheck`: "You sent it back on 25 Aug 2026: “…” It comes back here if …". */
export function recheckLine(on: string, reason: string): string {
  return `You sent it back on ${on}: “${reason}” It comes back here if the Academic Reviewer approves it again.`;
}

/** `roMap.returned`: the Academic Reviewer returned it to its vendor. */
export function returnedByReviewerLine(on: string | null): string {
  return `The Academic Reviewer returned it with a reason${on ? ` on ${on}` : ''}. It comes back to the Academic Reviewer when the vendor resubmits.`;
}

/** `roMap.returned_cm`: she sent it back to its vendor. */
export function sentToVendorLine(on: string | null): string {
  return `You sent it back${on ? ` on ${on}` : ''}. It comes back to the Academic Reviewer when the vendor resubmits.`;
}

// ---- CM-03 the Publish dialog (DL-1) ------------------------------------------------------------

export const PUBLISH_DIALOG = {
  description: 'Check what publishing does now, and what happens only after later events.',
  now: 'What happens now',
  later: 'Only after later events',
  readOnly:
    'The vendor and the Academic Reviewer see it as Published. Its submission becomes read-only.',
  corrections:
    'Any later change goes through a correction: you, then the Academic Reviewer, then the Super Admin’s release.',
  institutions:
    'Institutions can use it only once BITS gives them access to it. Publishing gives no one access.',
  students: 'Students get access only when their institution’s administrator gives it.',
  confirm: 'Publish',
  busy: 'Publishing…',
} as const;

/** `pTitle`: "Publish “Conduction Through a Composite Wall”?". */
export function publishTitle(name: string): string {
  return `Publish “${name}”?`;
}

/** `nowList[0]`: "It appears in the public catalogue under ME ZG523 · … with WEB and VR.". */
export function publishWhere(course: string, codes: readonly string[]): string {
  return `It appears in the public catalogue under ${course} with ${formatsSentence(codes)}.`;
}

// ---- CM-03 the result (`div.rk-done`) -----------------------------------------------------------

export const DECISION_RESULT = {
  published: 'Published',
  catalogue: 'Catalogue',
  institutionAccess: 'Institution access',
  institutionUnchanged: 'Unchanged — no institution was given access',
  studentAccess: 'Student access',
  studentUnchanged: 'Unchanged — no student was given access',
  vendorAndReviewer: 'Vendor and reviewer',
  seePublished: 'See it as Published, read-only',
  publishedNext: 'Publishing gave no one access. From now on, changes go through Updates.',
  openPublished: 'Open the published experiment',
  viewPublic: 'View the public page',
  backWithReviewer: 'Back with the Academic Reviewer',
  withVendor: 'With the vendor',
  notPublished: 'Not published',
  readyToPublish: 'Ready to publish',
  removedUntilApproved: 'Removed until it is approved again',
  nowWith: 'Now with',
  sentReviewerNext:
    'Nothing is published. It comes back to Ready to publish only after it is approved again.',
  sentVendorNext:
    'Nothing is published. It goes back to the Academic Reviewer when the vendor resubmits.',
} as const;

/** `doneMeta`: "Published by you on 27 Aug 2026, 16:05". */
export function publishedByYou(when: string): string {
  return `Published by you on ${when}`;
}

/** `doneMeta` after a send back: "Sent back by you on 27 Aug 2026, 16:05". */
export function sentBackByYou(when: string): string {
  return `Sent back by you on ${when}`;
}

/** `stand` Catalogue: "Listed under ME ZG523 with WEB and VR". */
export function listedUnder(course: string, codes: readonly string[]): string {
  return `Listed under ${course} with ${formatsSentence(codes)}`;
}

/** `stand` Now with: "Prof. A. Menon, Academic Reviewer". */
export function withReviewer(name: string): string {
  return name ? `${name}, Academic Reviewer` : 'Academic Reviewer';
}

/** A reason as the result and the history quote it: “Please clarify the VR device requirements.” */
export function quoted(reason: string): string {
  return `“${reason}”`;
}

// ---- CM-03 the stale refusal (`D.stale`) ---------------------------------------------------------

export const STALE_NOTICE = {
  title: 'This page is out of date',
  action: 'Show where it is now',
} as const;

/**
 * `D.staleText` + "Nothing was changed by your decision.": "Transient Cooling was published from
 * another tab or window at 16:05. Nothing was changed by your decision." When the record read again
 * shows no publication, the cause is the register's (state-copy `CM-03.stale.changed`).
 */
export function staleLine(name: string, publishedAt: string | null): string {
  const cause = publishedAt
    ? `${name} was published from another tab or window at ${publishedAt}.`
    : stateWords('CM-03.stale.changed').replace('{name}', name);
  return `${cause} Nothing was changed by your decision.`;
}

// ---- CM-03 the history (`x.sh`) ------------------------------------------------------------------

export const HISTORY = {
  submitted: 'Submitted for academic review',
} as const;

export function submittedNote(revision: number, organisation: string): string {
  return `Revision ${revision} · from ${organisation}`;
}

export function returnedByReviewerWhat(by: string): string {
  return `Returned to vendor by ${by}`;
}

export function approvedWhat(by: string): string {
  return `Approved by ${by}`;
}

/** “Sent to the Content Manager with 3 learning outcomes. Nothing is published.” */
export function approvedNote(outcomes: number): string {
  return `Sent to the Content Manager with ${plural(outcomes, 'learning outcome')}. Nothing is published.`;
}

export function resubmittedWhat(revision: number): string {
  return `Resubmitted · revision ${revision}`;
}

export function publishedWhat(by: string): string {
  return `Published by ${by}`;
}

/** “In the public catalogue under ME ZG523 · … with WEB and VR. No one was given access.” */
export function publishedNote(course: string, codes: readonly string[]): string {
  return `In the public catalogue under ${course} with ${formatsSentence(codes)}. No one was given access.`;
}

export function sentBackToReviewerWhat(by: string): string {
  return `Sent back to the Academic Reviewer by ${by}`;
}

export function sentBackToVendorWhat(by: string): string {
  return `Sent back to the vendor by ${by}`;
}

/** A send back to the vendor: the reason quoted, then the fields it refers to. */
export function sentBackToVendorNote(reason: string, references: readonly string[]): string {
  return `${quoted(reason)}${references.length > 0 ? ` Refers to: ${references.join('; ')}.` : ''}`;
}

// ---- CM-05 Published experiment ----------------------------------------------------------------

export const PUBLISHED_PAGE = {
  /** `a.rb-btn.rk-goto`. */
  goTo: 'Go to corrections',
  viewPublic: 'View the public page',
  /** The band's facts (`P.facts`). */
  factCourse: 'Course',
  factLiveSince: 'Live since',
  factFormats: 'Formats',
  factCorrections: 'Corrections',
  noCorrections: 'None yet',
  /** `p.cm-idflow-t`. */
  trackTitle: 'Correction in progress',
  catalogueTitle: 'In the public catalogue',
  catalogueMeta: 'Live · read-only · changes go through a correction',
  inCatalogueTag: 'In the public catalogue',
  availableIn: 'Available in',
  outcomesTitle: 'Learning outcomes',
  outcomesBy: 'set by the Academic Reviewer',
  formatsTitle: 'Formats and device needs',
  columnFormat: 'Format',
  columnHow: 'How it runs',
  columnDevice: 'Device needs',
  description: 'Description',
  liveVersion: 'Live version',
  deliveryTitle: 'Delivery',
  deliveryMeta: 'Live · one per format',
  /** `deliv.title`. */
  webTitle: 'Web link',
  packageTitle: 'App package (provisional)',
  webLink: 'Web link',
  browser: 'Browser and computer',
  package: 'Package',
  packageReference: 'Package reference',
  deviceNeeded: 'Device needed',
  installNotes: 'Install notes',
  historyTitle: 'History',
  historyMeta: 'Versions and updates · newest first',
  /**
   * The first publication's note — without the export's “, from SUB-0052” (owner correction,
   * state-copy `CM-05.references`).
   */
  firstPublicationNote: 'First publication by the Content Manager.',
} as const;

/** `P.over`: "CHE ZG513 · Published experiment". */
export function publishedOverline(course: string): string {
  return `${course} · Published experiment`;
}

/** "· version 1.2" after the formats of the live entry. */
export function versionAfterFormats(version: string): string {
  return `· version ${version}`;
}

/** `Live version`: "1.2, since 3 Jul 2026". */
export function liveVersionLine(version: string, since: string): string {
  return `${version}, since ${since}`;
}

/** The states of an open correction (CM-v1 `pubVM` `openUpd`: draft, returned, review, awaiting, hold). */
export type OpenUpdateState =
  'draft' | 'returned' | 'in-academic-review' | 'awaiting-release-decision' | 'on-hold';

/**
 * The open correction as its fact, its pill and the panel's notice name it: “Update on hold” — the
 * Content library's chip words, one wording for both screens (the export's “UPD-0004 · On hold”
 * without its reference; owner correction, state-copy `CM-05.references`).
 */
export function openUpdateStatus(state: OpenUpdateState): string {
  return CONTENT_LIBRARY.updateTags[state];
}

/** `corrFact` without an open correction: "2 corrections released". */
export function correctionsReleased(count: number): string {
  return `${plural(count, 'correction')} released`;
}

/** The Corrections panel (`aside#cm-pub-panel`). */
export const CORRECTIONS_PANEL = {
  title: 'Corrections',
  intro:
    'Live content is read-only here. Every change opens one correction draft, pre-filled with the live version.',
  /** The primary while a draft or returned update is open. */
  continueUpdate: 'Continue the update',
  /** `progTitle`. */
  correctionOpen: 'A correction is open',
  updateInProgress: 'An update is in progress',
  foot: 'The live experiment changes only when the Super Admin releases a correction. Publishing and releasing give no one access.',
} as const;

/** `progBody` by the open update's state: "Update on hold. The Super Admin put it on hold. …". */
export function updateProgressLine(state: OpenUpdateState, liveVersion: string): string {
  const lead = `${openUpdateStatus(state)}. `;
  switch (state) {
    case 'draft':
      return `${lead}Edits to this experiment join that update.`;
    case 'returned':
      return `${lead}It was returned to you with a reason. Edits to this experiment join that update.`;
    case 'in-academic-review':
      return `${lead}It is with the Academic Reviewer. You can start another correction once it is decided.`;
    case 'awaiting-release-decision':
      return `${lead}The Academic Reviewer approved it. The Super Admin decides when to release it. Version ${liveVersion} stays live.`;
    case 'on-hold':
      return `${lead}The Super Admin put it on hold. Version ${liveVersion} stays live.`;
  }
}

/** `relTitle`: "Version 1.1 is live". */
export function releasedTitle(version: string): string {
  return `Version ${version} is live`;
}

/**
 * `relBody`: the release made today, the version it replaced, nobody's access changed — the
 * correction named by what it is, not by its reference.
 */
export function releasedLine(day: string, from: string): string {
  return `The Super Admin released the correction on ${day}. The history keeps version ${from} and every decision. Nobody’s access changed.`;
}

/** `histOpen` for an open update: "Update started — in academic review". */
export function updateStartedWhat(status: string): string {
  return `Update started — ${status.toLowerCase()}`;
}

/** "Version 1.3. The live version below is unchanged." (`not set yet` before a label). */
export function updateStartedNote(version: string | null): string {
  return `Version ${version || 'not set yet'}. The live version below is unchanged.`;
}

/** `histOpen` on hold: "Update on hold" (the open correction's status words). */
export function updateHeldWhat(): string {
  return openUpdateStatus('on-hold');
}

/** "Version 2.0 stays live. Reason: “…”". */
export function updateHeldNote(liveVersion: string, reason: string): string {
  return `Version ${liveVersion} stays live. Reason: “${reason}”`;
}

/** "Version 1.2 released". */
export function versionReleasedWhat(version: string): string {
  return `Version ${version} released`;
}

/**
 * "Correction released by the Super Admin." for the live version, "Correction." for an earlier one
 * (the export's sample `hist`, “Correction UPD-0002 — released by the Super Admin.” / “Correction
 * UPD-0001.”, without the reference and its dash: these are the product's words around the
 * version's source, not a person's text).
 */
export function versionReleasedNote(live: boolean): string {
  return live ? 'Correction released by the Super Admin.' : 'Correction.';
}

/** "Published · version 1.0". */
export function firstPublishedWhat(version: string): string {
  return `Published · version ${version}`;
}
