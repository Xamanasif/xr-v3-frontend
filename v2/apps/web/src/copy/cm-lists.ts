/**
 * The words of the Content Manager's lists in the V3 Refined B design (the owner-approved export
 * design/v3-refined-b/roles/CM-v1 `project/Main.dc.html`): CM-01 Overview (`ovVM`), CM-02 Ready to
 * publish (`readyVM`), CM-04 Content library (`libVM`) and CM-09 Platform course codes (`codesVM`).
 * Every phrase is the export's own, found verbatim in its markup or script (`cm-lists.test.ts`);
 * the composed lines take the script's forms with the records' values (names, codes, counts and
 * dates come from the services, never from the export's sample world). No line or name carries an
 * internal reference (SUB-, UPD-): where the script's form writes one, it is left out and the
 * record is named by content (owner visual-review correction, 20 Oct 2026; state-copy
 * `CM-lists.no-reference`). The status words of a submission and of a correction are
 * `cm-shared.ts`'s. What the export does not draw is a provisional entry of the state-copy register
 * (`state-copy-cm-lists.ts`) and is read from there.
 */
import { dateTime, dayMonth, dayMonthYear } from './dates';
import { stateWords } from './state-copy';

function plural(count: number, word: string, words = `${word}s`): string {
  return `${count} ${count === 1 ? word : words}`;
}

const DAY_MS = 86_400_000;

const IST_DAY = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
});

/** The calendar day of an instant in Indian time, as a day number. */
function istDayNumber(instant: string): number {
  const parts = Object.fromEntries(
    IST_DAY.formatToParts(new Date(instant))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
  return Date.UTC(parts['year']!, parts['month']! - 1, parts['day']!) / DAY_MS;
}

/**
 * Whole calendar days from `from` to `today` in Indian time, never below 0 (the script's
 * `waitDays`): "13 days" from an approval on 14 Aug to 27 Aug.
 */
export function daysWaiting(from: string, today: string): number {
  return Math.max(0, istDayNumber(today) - istDayNumber(from));
}

/** The wait in words (the script's `ago`): "Today", "1 day", "13 days". */
export function waitWords(days: number): string {
  if (days <= 0) return 'Today';
  return plural(days, 'day');
}

/** The time of day, "15:20". */
function timeOfDay(instant: string): string {
  return dateTime(instant).split(', ')[1] ?? '';
}

/**
 * A reason as a row quotes it (the script's `clip(reason, 96)` in curly quotes): cut at the last
 * whole word within 96 characters, trailing punctuation dropped, then "…".
 */
export function quotedReason(reason: string, limit = 96): string {
  const text = reason.trim();
  if (text.length <= limit) return `“${text}”`;
  const cut = text
    .slice(0, limit)
    .replace(/\s+\S*$/, '')
    .replace(/[\s.,;:—-]+$/, '');
  return `“${cut}…”`;
}

/** "Formats: WEB, VR" — what a row's format badges mean, read instead of the codes. */
export function formatsLabel(codes: readonly string[]): string {
  return `Formats: ${codes.join(', ')}`;
}

/** "ME ZG523 · Thermodynamics & Heat Transfer", or the name alone (the script's `cLabel`). */
export function courseLabel(code: string | null, name: string): string {
  return code ? `${code} · ${name}` : name;
}

/** "Open the publication decision for Transient Cooling" (CM-01 and CM-02 rows). */
export function openDecisionLabel(name: string): string {
  return `Open the publication decision for ${name}`;
}

/** The row's "Open decision" (CM-01, CM-02). */
export const OPEN_DECISION = 'Open decision';

/** "Open the Content library" (CM-01 calm and side card, CM-02 empty and side card). */
export const OPEN_LIBRARY = 'Open the Content library';

/** A list's failed state: what to do (CM-02, CM-04, CM-09; CM-01's undrawn failed state too). */
export const LIST_FAILED = {
  line: 'Nothing has changed. Try again.',
  retry: 'Try again',
} as const;

// ---- CM-01 Overview (`ovVM`) --------------------------------------------------------------------

export const CM_OVERVIEW = {
  lead: 'What is ready for you to publish, the corrections you raised, and what is live in the catalogue.',
  pipeline: {
    title: 'Publishing pipeline',
    note: 'Where every submission and correction is today. Gold marks your step.',
    youLabel: 'Your step',
    firstLane: 'First publication',
    correctionsLane: 'Corrections to live experiments',
  },
  needs: {
    title: 'Needs your decision',
    note: 'Oldest first',
    ready: 'Ready to publish',
    openReady: 'Open Ready to publish',
    corrections: 'Corrections that need you',
    openUpdates: 'Open Updates',
    next: 'Publish next',
    continue: 'Continue',
    returned: 'Returned to you',
    draft: 'Draft · not sent yet',
  },
  calm: {
    title: 'Nothing is waiting for your decision',
    line: 'Approved experiments and corrections returned to you appear here.',
  },
  others: {
    title: 'With others',
    note: 'Nothing for you to do',
    none: 'Nothing is waiting on the Academic Reviewer, the vendors or the Super Admin.',
    open: 'Open',
  },
  catalogue: {
    title: 'In the catalogue',
    nothing: 'Nothing is published yet',
    listLabel: 'Live experiments by course',
  },
} as const;

/** A pipeline stage: what it is and who holds it (the script's `tile(…)` arguments). */
export const PIPELINE_STAGES = {
  vendor: { title: 'With the vendor', detail: 'Vendor revising' },
  review: { title: 'In academic review', detail: 'Academic Reviewer' },
  ready: { title: 'Ready to publish', detail: 'Nothing waiting' },
  catalogue: { title: 'In the catalogue', detail: 'Live today' },
  mine: { title: 'Draft or returned', detail: 'With you', none: 'Nothing open' },
  updateReview: { title: 'In academic review', detail: 'Academic Reviewer' },
  release: { title: 'Release decision', detail: 'Super Admin' },
  released: { title: 'Released', detail: 'Live for everyone' },
} as const;

/** Where each stage's link goes, in words (the end of its name). */
export const PIPELINE_DESTINATIONS = {
  vendor: 'the Content library, With vendor',
  review: 'the Content library, In review',
  ready: 'Ready to publish',
  catalogue: 'the Content library, Published',
  updates: 'Updates',
} as const;

/** "Oldest approved 14 Aug". */
export function oldestApproved(approvedAt: string): string {
  return `Oldest approved ${dayMonth(approvedAt)}`;
}

/** "Super Admin · 1 on hold". */
export function releaseDetail(onHold: number): string {
  return onHold > 0
    ? `${PIPELINE_STAGES.release.detail} · ${onHold} on hold`
    : PIPELINE_STAGES.release.detail;
}

/** "3 Ready to publish. Oldest approved 14 Aug. Your step. Open Ready to publish" (the tile's name). */
export function pipelineTileLabel(tile: {
  readonly count: number;
  readonly title: string;
  readonly detail: string;
  readonly you: boolean;
  readonly destination: string;
}): string {
  return `${tile.count} ${tile.title}. ${tile.detail}.${tile.you ? ` ${CM_OVERVIEW.pipeline.youLabel}.` : ''} Open ${tile.destination}`;
}

/** "approved 14 Aug", "returned 26 Aug", "saved 26 Aug" (under the wait). */
export function deskWhen(kind: 'approved' | 'returned' | 'saved', at: string): string {
  return `${kind} ${dayMonth(at)}`;
}

/**
 * "ME ZG523 · Northline Simulation Studio" (the code left out when there is none): the script's
 * line without the submission's reference (state-copy `CM-lists.no-reference`).
 */
export function deskReadyLine(course: string | null, vendor: string): string {
  return [course, vendor].filter(Boolean).join(' · ');
}

/** "4 of 4 checks met", or "1 thing to resolve" while a check is not met. */
export function deskCheckWords(met: number, total: number): string {
  const open = total - met;
  return open > 0 ? `${plural(open, 'thing')} to resolve` : `${met} of ${total} checks met`;
}

/** "Prof. A. Menon, Academic Reviewer · 26 Aug" (under the quoted reason). */
export function reviewerOn(name: string, at: string): string {
  return `${name ? `${name}, ` : ''}Academic Reviewer · ${dayMonth(at)}`;
}

/** "Continue the update to Induction Motor Loading" (state-copy `CM-lists.no-reference`). */
export function continueLabel(name: string): string {
  return `Continue the update to ${name}`;
}

/** "Boiler Drum Level 2.1": a correction named with its proposed version. */
export function updateTitle(name: string, versionLabel: string | null): string {
  return versionLabel ? `${name} ${versionLabel}` : name;
}

/** "Academic Reviewer · re-check you asked for on 25 Aug". */
export function recheckDetail(sentAt: string): string {
  return `Academic Reviewer · re-check you asked for on ${dayMonth(sentAt)}`;
}

/** "Northline Simulation Studio · you sent it back on 26 Aug". */
export function sentBackDetail(vendor: string, at: string): string {
  return `${vendor ? `${vendor} · ` : ''}you sent it back on ${dayMonth(at)}`;
}

/** "Academic Reviewer · sent 25 Aug · 1.2 stays live". */
export function updateInReviewDetail(sentAt: string, liveLabel: string | null): string {
  return withLive(`Academic Reviewer · sent ${dayMonth(sentAt)}`, liveLabel);
}

/** "Super Admin · approved 27 Aug · 1.2 stays live". */
export function updateAwaitingDetail(approvedAt: string, liveLabel: string | null): string {
  return withLive(`Super Admin · approved ${dayMonth(approvedAt)}`, liveLabel);
}

/** "Super Admin · held 20 Aug · 2.0 stays live". */
export function updateOnHoldDetail(heldAt: string, liveLabel: string | null): string {
  return withLive(`Super Admin · held ${dayMonth(heldAt)}`, liveLabel);
}

function withLive(line: string, liveLabel: string | null): string {
  return liveLabel ? `${line} · ${liveLabel} stays live` : line;
}

/** "Open Venturi Meter Calibration" (a submission with others). */
export function openSubmissionLabel(name: string): string {
  return `Open ${name}`;
}

/** "Open the update to Boiler Drum Level" (a correction with others; `CM-lists.no-reference`). */
export function openUpdateLabel(name: string): string {
  return `Open the update to ${name}`;
}

/** "experiments live, in 5 courses" beside the catalogue's total, or "Nothing is published yet". */
export function catalogueLine(published: number, courses: number): string {
  return published > 0
    ? `experiments live, in ${plural(courses, 'course')}`
    : CM_OVERVIEW.catalogue.nothing;
}

/** "Thermodynamics & Heat Transfer, 3 published experiments. Open in the Content library". */
export function catalogueCourseLabel(name: string, count: number): string {
  return `${name}, ${plural(count, 'published experiment')}. Open in the Content library`;
}

// ---- CM-02 Ready to publish (`readyVM`) ---------------------------------------------------------

export const READY_TO_PUBLISH = {
  lead: 'Experiments the Academic Reviewer has approved, waiting for your publication decision.',
  figuresLabel: 'The queue at a glance',
  waiting: 'Waiting for you',
  allMet: 'All checks met',
  surfaceLabel: 'Approved experiments waiting for your decision',
  firstLabel: 'Waiting longest',
  checksLabel: 'Publication check',
  /** The four checks as the cards name them, in the service's order. */
  checks: {
    'approved-by-reviewer': 'Approved',
    'learning-outcomes': 'Learning outcomes',
    'catalogue-details': 'Catalogue details',
    'delivery-per-format': 'Delivery for each format',
  },
  met: 'Met: ',
  notMet: 'Not met: ',
  emptyTitle: 'Nothing is ready to publish',
  emptyLine: 'Experiments appear here once the Academic Reviewer approves them.',
  loading: 'Loading the experiments ready to publish…',
  failed: 'We couldn’t load the experiments ready to publish',
  side: {
    label: 'Before you publish',
    does: 'What publishing does',
    says: [
      {
        key: 'lists',
        title: 'Lists it in the public catalogue',
        line: 'Under its course, with every format that passed review.',
      },
      {
        key: 'access',
        title: 'Gives no one access',
        line: 'Institutions use it only once BITS gives them access; students through their institution.',
      },
      {
        key: 'updates',
        title: 'Changes go through Updates',
        line: 'After publishing, every change is a correction you raise.',
      },
    ],
    latest: 'Latest in the catalogue',
    nothing: 'Nothing is published yet.',
  },
} as const;

export type PublicationCheckName = keyof typeof READY_TO_PUBLISH.checks;

/** "1 experiment with something to resolve", or "All checks met". */
export function waitingDetail(blocked: number): string {
  return blocked > 0
    ? `${plural(blocked, 'experiment')} with something to resolve`
    : READY_TO_PUBLISH.allMet;
}

/** "days, the longest wait" ("day, …" for one). */
export function longestWaitTitle(days: number): string {
  return days === 1 ? 'day, the longest wait' : 'days, the longest wait';
}

/** "3 experiments approved and waiting" (announced). */
export function readyCountWords(count: number): string {
  return `${plural(count, 'experiment')} approved and waiting`;
}

/** The order in words: "approved, oldest first" (wide) and "oldest first" (narrow). */
export function readySortWords(newest: boolean): { readonly long: string; readonly short: string } {
  const order = newest ? 'newest first' : 'oldest first';
  return { long: `Sort: approved, ${order}`, short: `Sort: ${order}` };
}

/** "Approved experiments, oldest first" (the list's name). */
export function readyListLabel(newest: boolean): string {
  return `Approved experiments, ${newest ? 'newest first' : 'oldest first'}`;
}

/** The card's wait: "13" · "days waiting" · "since 14 Aug", or "Today" · "just approved" · "at 15:20". */
export function cardAge(
  days: number,
  approvedAt: string,
): { readonly value: string; readonly unit: string; readonly detail: string } {
  if (days <= 0)
    return { value: 'Today', unit: 'just approved', detail: `at ${timeOfDay(approvedAt)}` };
  return {
    value: String(days),
    unit: days === 1 ? 'day waiting' : 'days waiting',
    detail: `since ${dayMonth(approvedAt)}`,
  };
}

/**
 * "Northline Simulation Studio · revision 2": the script's `idLine` without the submission's
 * reference (state-copy `CM-lists.no-reference`).
 */
export function cardVendorLine(vendor: string, revision: number): string {
  return [vendor, revision > 1 ? `revision ${revision}` : null].filter(Boolean).join(' · ');
}

/** "Approved by Prof. A. Menon · 2 learning outcomes" ("· no learning outcomes yet"). */
export function cardByLine(approvedBy: string, outcomes: number): string {
  return `Approved by ${approvedBy} · ${outcomes > 0 ? plural(outcomes, 'learning outcome') : 'no learning outcomes yet'}`;
}

/** "All 4 checks met", or "1 thing to resolve". */
export function cardSummary(open: number, total: number): string {
  return open > 0 ? `${plural(open, 'thing')} to resolve` : `All ${total} checks met`;
}

/** "Published · version 1.0 · 30 Jul 2026" or "Version 1.1 released · 5 Aug 2026". */
export function latestWords(
  label: string,
  liveFrom: string,
  source: 'first-publication' | 'correction-release',
): string {
  const what =
    source === 'correction-release' ? `Version ${label} released` : `Published · version ${label}`;
  return `${what} · ${dayMonthYear(liveFrom)}`;
}

// ---- CM-04 Content library (`libVM`) ------------------------------------------------------------

export type LibraryView = 'ready' | 'in-review' | 'with-vendor' | 'published';

export const CONTENT_LIBRARY = {
  lead: 'Every experiment you look after, from approval to the live catalogue.',
  figuresLabel: 'The library at a glance',
  inCatalogue: 'In the catalogue',
  nothingPublished: 'Nothing published yet',
  onTheWay: 'On the way',
  nothingBefore: 'Nothing before the catalogue',
  switchLabel: 'Show experiments that are',
  views: {
    ready: 'Ready',
    'in-review': 'In review',
    'with-vendor': 'With vendor',
    published: 'Published',
  },
  /** What the count, the course bands and the panel call each view's experiments. */
  nouns: {
    ready: 'ready to publish',
    'in-review': 'in academic review',
    'with-vendor': 'with the vendor',
    published: 'published',
  },
  /** Who holds each view's experiments, and what that means for her (`p.cm-stageline`). */
  stage: {
    ready: {
      owner: 'With you',
      note: 'Approved by the Academic Reviewer, waiting for your publication decision.',
    },
    'in-review': {
      owner: 'With the Academic Reviewer',
      note: 'New submissions and re-checks you asked for. Read-only for you.',
    },
    'with-vendor': {
      owner: 'With the vendors',
      note: 'Returned to their vendor to revise. They come back through academic review.',
    },
    published: {
      owner: 'In the public catalogue',
      note: 'Live under their course. Open one to see it or to start a correction.',
    },
  },
  filterLabel: 'Filter the library',
  searchLabel: 'Search',
  courseLabel: 'Course',
  allCourses: 'All courses',
  headers: {
    experiment: 'Experiment',
    formats: 'Formats',
    whereItIs: 'Where it is',
    kind: {
      ready: 'Approved by',
      'in-review': 'Vendor',
      'with-vendor': 'Vendor',
      published: 'Version',
    },
    when: {
      ready: 'Approved',
      'in-review': 'Since',
      'with-vendor': 'Since',
      published: 'Live since',
    },
  },
  reviewer: 'Academic Reviewer',
  /** A submission's line under its status in "Where it is" (the script's `x.tag`). */
  tags: {
    newSubmission: 'New submission',
    recheck: 'Re-check you asked for',
    returnedByReviewer: 'Returned by the Academic Reviewer',
    sentBack: 'You sent it back',
  },
  /** A published experiment's open correction as its own chip. */
  updateTags: {
    draft: 'Update draft in progress',
    returned: 'Update returned to you',
    'in-academic-review': 'Update in academic review',
    'awaiting-release-decision': 'Update awaiting release',
    'on-hold': 'Update on hold',
  },
  empty: {
    ready: {
      title: 'Nothing is ready to publish',
      line: 'Experiments appear here once the Academic Reviewer approves them.',
    },
    'in-review': {
      title: 'Nothing is in academic review',
      line: 'New submissions and re-checks appear here while the Academic Reviewer has them.',
    },
    'with-vendor': {
      title: 'Nothing is with the vendors',
      line: 'Submissions returned to a vendor appear here until they are resubmitted.',
    },
    published: {
      title: 'Nothing is published yet',
      line: 'Experiments appear here once you publish them.',
    },
  },
  clearFilters: 'Clear filters',
  loading: 'Loading the content library…',
  failed: 'We couldn’t load the content library',
  foot: 'Drafts stay with the vendor and aren’t listed. Published rows open the live experiment.',
  otherCourses: 'Other courses',
} as const;

/** "Across 5 courses", or "Nothing published yet". */
export function acrossCourses(published: number, courses: number): string {
  return published > 0 ? `Across ${plural(courses, 'course')}` : CONTENT_LIBRARY.nothingPublished;
}

/** "3 ready · 2 in review · 1 with a vendor", or "Nothing before the catalogue". */
export function onTheWayDetail(ready: number, review: number, vendor: number): string {
  return ready + review + vendor > 0
    ? `${ready} ready · ${review} in review · ${vendor} with a vendor`
    : CONTENT_LIBRARY.nothingBefore;
}

/** "Experiments ready to publish" (the list surface's name). */
export function libraryPanelLabel(view: LibraryView): string {
  return `Experiments ${CONTENT_LIBRARY.nouns[view]}`;
}

/** "3 ready to publish", or "1 of 3 ready to publish" while a filter is applied (announced). */
export function libraryCountWords(
  view: LibraryView,
  shown: number,
  total: number,
  filtered: boolean,
): string {
  const noun = CONTENT_LIBRARY.nouns[view];
  return filtered ? `${shown} of ${total} ${noun}` : `${total} ${noun}`;
}

/** "Ready — 3" or "Ready — 1 of 3" (the table's caption). */
export function libraryCaption(
  view: LibraryView,
  shown: number,
  total: number,
  filtered: boolean,
): string {
  return `${CONTENT_LIBRARY.views[view]} — ${filtered ? `${shown} of ${total}` : total}`;
}

/** "2 ready to publish", "3 published" (a course band's count). */
export function courseBandCount(view: LibraryView, count: number): string {
  return `${count} ${CONTENT_LIBRARY.nouns[view]}`;
}

/** "Search: “venturi”" (its chip). */
export function searchChip(search: string): string {
  return `Search: “${search}”`;
}

/** "Course: ME ZG523 · Thermodynamics & Heat Transfer" (its chip). */
export function courseChip(label: string): string {
  return `Course: ${label}`;
}

/** "Nothing in Ready matches". */
export function noMatchTitle(view: LibraryView): string {
  return `Nothing in ${CONTENT_LIBRARY.views[view]} matches`;
}

/** "Revision 2" (under the vendor). */
export function revisionWords(revision: number): string {
  return `Revision ${revision}`;
}

/** "Version 1.2". */
export function versionWords(label: string): string {
  return `Version ${label}`;
}

/** "1 to resolve" (a ready row whose publication check is not met). */
export function rowToResolve(blockers: number): string {
  return `${blockers} to resolve`;
}

/** A Super Admin's return to the vendor (undrawn; state-copy `CM-04.override`). */
export function overrideTag(): string {
  return stateWords('CM-04.override');
}

/**
 * "Transient Cooling, ready to publish. Open the decision": the script's name without the
 * submission's reference (state-copy `CM-lists.no-reference`).
 */
export function submissionRowLabel(name: string, status: string, ready: boolean): string {
  return ready
    ? `${name}, ready to publish. Open the decision`
    : `${name}, ${status.toLowerCase()}. Open`;
}

/** "Distillation Column, CHE ZG513, version 1.2, published, update awaiting release. Open the published experiment". */
export function publishedRowLabel(
  name: string,
  course: string,
  label: string,
  updateTag: string | null,
): string {
  return `${name}, ${course}, version ${label}, published${updateTag ? `, ${updateTag.toLowerCase()}` : ''}. Open the published experiment`;
}

// ---- CM-09 Platform course codes (`codesVM`) ----------------------------------------------------

export const COURSE_CODES = {
  lead: 'The official platform code of each course, shown in the public catalogue. You’re the only person who edits these codes.',
  figuresLabel: 'Course codes at a glance',
  withCode: 'Courses with a code',
  liveExperiments: 'Live experiments',
  listed: 'Listed under these codes',
  sectionTitle: 'Courses',
  sectionNote: 'From Academic structure, kept by the Super Admin',
  hint: 'Each code must be unique. Leave it blank if the course has no platform code yet.',
  caption: 'Platform course codes',
  headers: { course: 'Course', live: 'Live experiments', code: 'Platform course code' },
  inlineLabel: 'Platform course code',
  nothingLive: 'Nothing live yet',
  changed: 'Changed — not saved yet',
  blank: 'No code yet — the catalogue shows the course name only.',
  otherArea: 'Other courses',
  clean: 'No unsaved changes',
  undo: 'Undo changes',
  save: 'Save codes',
  saving: 'Saving…',
  saveFailed: 'We couldn’t save the codes',
  saveFailedLine: 'Nothing has changed. Your edits are still in the table. Try again.',
  saved: 'Codes saved',
  loading: 'Loading the course codes…',
  failed: 'We couldn’t load the course codes',
  side: {
    label: 'About platform codes',
    where: 'Where a code appears',
    says: [
      {
        key: 'catalogue',
        title: 'The public catalogue',
        line: 'Beside the course name, on the course and its experiments.',
      },
      {
        key: 'workspace',
        title: 'Your workspace',
        line: 'Content library, published experiments, Ready to publish and decisions.',
      },
      {
        key: 'blank',
        title: 'No code yet',
        line: 'Blank is allowed. The catalogue then shows the course name only.',
      },
    ],
    rules: 'Platform codes, not institution codes',
    rulesLine:
      'Institute Admins keep their own code for a course (for example MEC-523) — a separate field you don’t edit. The Super Admin sees these platform codes read-only in Academic structure.',
  },
} as const;

/** "of 6 · 1 without a code", or "of 6 · every course has one". */
export function codedDetail(total: number, blank: number): string {
  return blank > 0 ? `of ${total} · ${blank} without a code` : `of ${total} · every course has one`;
}

/** "3 courses" (an engineering area's count). */
export function areaCount(count: number): string {
  return plural(count, 'course');
}

/** "3 experiments live under this course", or "Nothing live yet". */
export function liveUnderCourse(count: number): string {
  return count > 0
    ? `${plural(count, 'experiment')} live under this course`
    : COURSE_CODES.nothingLive;
}

/** The input's name: "Platform course code for Fluid Mechanics". */
export function codeFieldLabel(course: string): string {
  return `Platform course code for ${course}`;
}

/** "1 change not saved", "6 changes not saved". */
export function changedCountWords(count: number): string {
  return `${plural(count, 'change')} not saved`;
}

/** "27 Aug 2026, 16:40 · the catalogue shows them from now on" (under "Codes saved"). */
export function codesSavedWords(at: string): string {
  return `${dateTime(at)} · the catalogue shows them from now on`;
}
