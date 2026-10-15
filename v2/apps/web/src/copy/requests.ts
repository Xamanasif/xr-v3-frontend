/**
 * The words of the Super Admin's request screens — SA-02 Requests (B1-10) and SA-03 Request
 * decision (B1-11) — written from the canonical facts the ports answer (`@xr/contracts/draft`
 * `requestRow`, `decisionPage`, `decisionOutcome`): read models carry no words. Each entry names
 * the board that draws it; what no board words is a provisional entry of the state-copy register
 * (`state-copy.ts`, VD-12), never an invented rule. Status words come from the role-relative
 * table (`flow-state-words.ts` `requestWords`).
 */
import type {
  AccessPlan,
  ActorRef,
  AccessRequest,
  HistoryEntry,
  InstitutionKind,
  RequestEvent,
  RequestedTerm,
  RequestType,
  Technology,
} from '@xr/domain';
import { inDisplayOrder } from '@xr/domain';

import { calendarDay, dateTime } from './dates';
import { formatName } from './flow-state-words';

// ---- shared (B1-10 columns, B1-11 summary) ----

/** B1-10 "Type" column and filter; B1-11 page header and "What they’re asking for". */
export const REQUEST_TYPE_WORDS: Readonly<Record<RequestType, string>> = {
  'new-access': 'New access',
  'additional-licences': 'Additional licences',
  renewal: 'Renewal',
};

/**
 * "Internal or external" (B1-10 Type column sub-line and filter; B1-11 summary): an existing
 * institution's route, or "Not set yet" until the first approval of a new institution (T-04).
 */
export function routeWords(route: InstitutionKind | null): string {
  if (route === 'internal') return 'Internal';
  if (route === 'external') return 'External';
  return 'Not set yet';
}

/** Formats as the boards list them: "WEB, VR", in the display order WEB · AR · VR · MR. */
export function formatList(formats: readonly Technology[]): string {
  return inDisplayOrder(formats).map(formatName).join(', ');
}

/**
 * The access term asked for (B1-11 "Yearly"; REQ-0040 "Current term"). B1-07's "Until a fixed
 * date" has no SA wording (P1-10): the date is written as words, PROVISIONAL (state-copy
 * `SA-03.term-until`).
 */
export function termWords(term: RequestedTerm): string {
  switch (term.kind) {
    case 'monthly':
      return 'Monthly';
    case 'quarterly':
      return 'Quarterly';
    case 'yearly':
      return 'Yearly';
    case 'current-plan':
      return 'Current term';
    case 'until-date':
      return `Until ${calendarDay(term.endsOn)}`;
  }
}

/** "Licences requested" (B1-11: "120"; a more-licences request, REQ-0040: "60 more"). */
export function licencesRequestedWords(type: RequestType, licences: number): string {
  return type === 'additional-licences' ? `${licences} more` : String(licences);
}

/** An experiment as the catalogue names it, for the request screens. */
export interface ExperimentName {
  readonly name: string;
  /** "ME ZG523 · Thermodynamics & Heat Transfer" (B1-11): code and course, or the course alone. */
  readonly course: string;
}

/** The course line under an experiment's title (B1-11 "What they’re asking for"). */
export function courseLine(platformCode: string | null, courseName: string): string {
  return platformCode ? `${platformCode} · ${courseName}` : courseName;
}

/**
 * An experiment no published catalogue entry names (unpublished since it was requested): its
 * reference stands in, PROVISIONAL (state-copy `SA-02.unnamed-experiment`).
 */
export function unnamedExperiment(experimentId: string): ExperimentName {
  return { name: experimentId, course: '' };
}

// ---- SA-02 Requests (B1-10) ----

/** B1-10 "Experiments": the first title with its formats, or a count of experiments. */
export function experimentsCell(
  firstItem: { readonly name: string; readonly formats: readonly Technology[] } | null,
  itemCount: number,
): { readonly line: string; readonly sub: string | null } {
  if (itemCount === 1 && firstItem) {
    return { line: firstItem.name, sub: formatList(firstItem.formats) };
  }
  return { line: `${itemCount} experiments`, sub: null };
}

/** B1-10 count: "7 requests"; "2 of 7 requests" while a filter or search is applied. */
export function requestCountWords(shown: number, total: number, filtered: boolean): string {
  return filtered ? `${shown} of ${total} requests` : `${total} requests`;
}

/** B1-10 row link name: "Open request REQ-0042, Godavari Institute of Technology". */
export function openRequestLabel(reference: string, institution: string): string {
  return `Open request ${reference}, ${institution}`;
}

export const REQUESTS_PAGE = {
  overline: 'Super Admin',
  title: 'Requests',
  summary: 'Institutional access requests sent from the public site. Open one to decide it.',
  caption: 'Institutional access requests',
  searchLabel: 'Search',
  searchPlaceholder: 'Reference, institution or contact',
  statusLabel: 'Status',
  typeLabel: 'Type',
  routeLabel: 'Internal or external',
  loading: 'Loading requests',
  failedTitle: 'We couldn’t load the requests',
  failedLine: 'Nothing has changed. Try again.',
  emptyTitle: 'No requests yet',
  emptyLine: 'Requests that institutions send from the public site appear here.',
  noMatchTitle: 'No requests match these filters',
  sortWords: { descending: 'newest first', ascending: 'oldest first' },
  receivedHeader: 'Received',
} as const;

// ---- SA-03 Request decision (B1-11) ----

export const DECISION_PAGE = {
  back: 'Requests',
  overline: 'Institutional access request',
  summaryLabel: 'Summary',
  facts: {
    experiments: 'Experiments',
    licences: 'Licences requested',
    term: 'Access term',
    route: 'Internal or external',
  },
  organisation: 'Organisation and contact person',
  institution: 'Institution',
  contactPerson: 'Contact person',
  email: 'E-mail',
  phone: 'Phone',
  phoneNotGiven: 'Not given',
  asking: 'What they’re asking for',
  experimentColumn: 'Experiment',
  requestedColumn: 'Formats requested',
  publishedColumn: 'Published formats',
  existing: 'Existing access',
  message: 'Message from the requester',
  history: 'History',
  panelTitle: 'Your decision',
  decisionLegend: 'Decision',
  checkTitle: 'Check your decision',
  backToRequests: 'Back to requests',
} as const;

/** "Received 2 Oct 2026, 10:14" (B1-11 page header). */
export function receivedWords(receivedAt: string): string {
  return `Received ${dateTime(receivedAt)}`;
}

/** "What happens after you decide — four separate events" (B1-11, the help that replaced B2's chain). */
export const FOUR_EVENTS = {
  summary: 'What happens after you decide — four separate events',
  steps: [
    {
      what: 'Institution record',
      line: 'Created when you approve the first request from a new institution. A record is not access.',
    },
    {
      what: 'Request approval — your decision on this page',
      // Words with <strong> around the status are composed by the screen.
      line: null,
    },
    {
      what: 'Payment confirmation — external only',
      line: 'Happens after the requester pays. It is not recorded on this page.',
    },
    {
      what: 'Institutional access activation',
      line: 'Internal: when you approve. External: only after the payment is confirmed. Activation creates the access plan the institution administrator sees. Students get access only when that administrator gives it.',
    },
  ],
  approvalBefore: 'External: the request becomes ',
  approvalStatus: 'Approved — payment required',
  approvalAfter:
    '. Internal: approved with no payment step. Smaller scope: the requester sees the difference and your reason.',
  footnote:
    'Request more information keeps the request open; none of the four events happen until it is approved.',
} as const;

/** The three decisions (B1-11 `choices`). */
export const DECISION_CHOICES = {
  approve: { title: 'Approve request', sub: 'Approve what they asked for.' },
  smaller: {
    title: 'Approve a smaller scope',
    sub: 'Fewer formats, fewer licences or a shorter term, with a reason.',
    // B1-11 f13 (REQ-0038): the renewal's drawn reason; refusal `renewal-scope-not-adjustable`.
    renewal: 'Not available for a renewal — the term continues the current plan.',
  },
  info: {
    title: 'Request more information',
    sub: 'The request stays open. Your question is shown to the requester.',
  },
} as const;

/** "Internal or external" for a new institution (B1-11 `routes`, f1). */
export const ROUTE_CHOICE = {
  legend: 'Internal or external',
  marker: '(required to approve)',
  hint: 'You set this; the requester never chooses it. Approval can’t be completed while it is not set.',
  internal: {
    title: 'Internal — BITS campus or programme',
    sub: 'No payment step. Institutional access is activated when you approve.',
  },
  external: {
    title: 'External institution',
    sub: 'Approval, then payment. Institutional access is activated only after the payment is confirmed.',
  },
  /** B1-11 f13 / f16: a classified institution's route, read-only (`routeLocked`). */
  lockedBefore: 'Internal or external: ',
  lockedAfter: ' — set when this institution was first approved.',
} as const;

/** Approve a smaller scope (B1-11 f5). */
export const SMALLER_SCOPE = {
  formatsLegend: 'Formats to approve',
  licencesLabel: 'Licences to approve',
  termLabel: 'Access term',
  differentTitle: 'Different from the request',
} as const;

export const TERM_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
] as const;

/** One line of "Different from the request" (B1-11 `diffs`). */
export function differenceLines(change: {
  readonly formats: { readonly asked: string; readonly kept: string } | null;
  readonly licences: { readonly asked: string; readonly kept: string } | null;
  readonly term: { readonly asked: string; readonly kept: string } | null;
}): readonly string[] {
  const lines: string[] = [];
  if (change.formats)
    lines.push(`Formats: ${change.formats.asked} → ${change.formats.kept || 'none'}`);
  if (change.licences) lines.push(`Licences: ${change.licences.asked} → ${change.licences.kept}`);
  if (change.term) lines.push(`Term: ${change.term.asked} → ${change.term.kept}`);
  return lines;
}

/** The reason field (B1-11 `reasonLabel`, `reasonHint`). */
export const REASON_FIELD = {
  smaller: 'Reason for the change (required)',
  info: 'What do you need from the requester? (required)',
  hint: 'Shown to the requester on their request status.',
} as const;

/** The panel's confirm button (B1-11 `goLabel`). */
export const DECISION_ACTIONS = {
  approve: 'Approve request',
  smaller: 'Approve smaller scope',
  info: 'Send request for information',
} as const;

/** "Before clicking, the panel says what is still needed" (B1-11 f4 `pending`). */
export const PENDING_HINTS = {
  route: 'Choose internal or external before approving.',
  smaller: 'Change at least one thing and give a reason before approving.',
  info: 'Add your question before sending.',
} as const;

/** B1-11 f14 (REQ-0040): no decision controls while the institution is paused. */
export const PAUSED_BLOCK = {
  title: 'This institution is paused',
  line: 'Requests from a paused institution can’t be decided. You can decide this one once the pause ends.',
  /** B1-11 f14 `xr-notice-actions` → B7-03 (SA-07, rendered since Package 1D built it). */
  viewInstitution: 'View institution',
} as const;

/** The confirmation of an approval (B1-11 f2 external, f3 internal; `confirmTitle`, `cf*`). */
export function confirmTitle(smaller: boolean, reference: string): string {
  return smaller ? `Approve a smaller scope for ${reference}?` : `Approve ${reference}?`;
}

export const CONFIRM_LINES = {
  /** `cfNew`: "Creates the institution record for {name}, classified <strong>{route}</strong>." */
  newBefore: 'Creates the institution record for ',
  newMiddle: ', classified ',
  newAfter: '.',
  externalApproves: [
    'Approves the request. Its status becomes ',
    'Approved — payment required',
    '.',
  ],
  externalNotActive: [
    'Institutional access is ',
    'not activated now',
    '. It is activated only after the payment is confirmed.',
  ],
  internalApproves: ['Approves the request. There is ', 'no payment step', '.'],
  /**
   * B1-11 f3 for every internal approval. For a renewal or more licences the plan effect is open
   * (OD-B3-09 / P1-11: the mock writes no plan): the board's words are kept as drawn and the gap
   * is an open owner item (`surface-super-admin.json#inconsistencies[26]`).
   */
  internalActive: ['Institutional access is ', 'activated now', ' and the access plan is created.'],
  smaller: 'The requester sees what changed and your reason.',
  students: 'Students get access only when the institution’s administrator gives it.',
} as const;

// ---- after a decision (B1-11 f9 … f12) ----

/** The decided panel's meta line (B1-11 `doneMeta`). */
export function decidedMeta(
  decided:
    | { readonly kind: 'information'; readonly at: string }
    | {
        readonly kind: 'approval';
        readonly at: string;
        readonly route: InstitutionKind;
      },
  by: string,
): string {
  if (decided.kind === 'information') return `Sent ${by} · ${dateTime(decided.at)}`;
  return `Decided ${by} · ${dateTime(decided.at)} · ${routeWords(decided.route)}`;
}

/**
 * Who decided, as the decided panel says it: "by you" (B1-11 f9–f12) when the signed-in Super
 * Admin made the decision; another Super Admin by name, PROVISIONAL (state-copy
 * `SA-03.decided-by-another`; the sample world holds one Super Admin).
 */
export function decidedBy(actor: ActorRef, personId: string): string {
  if (actor.kind === 'person' && actor.personId === personId) return 'by you';
  return actor.kind === 'person' ? `by ${actor.displayName}` : 'by BITS';
}

/** "Where this request stands" (B1-11 `stand`, `xp-stand`). */
export const STAND = {
  label: 'Where this request stands',
  institutionRecord: 'Institution record',
  request: 'Request',
  payment: 'Payment',
  access: 'Institutional access',
  notCreated: 'Not created',
  exists: 'Exists',
  /** "Created · 8 Oct 2026, 11:20" — the record this approval created. */
  created: (at: string) => `Created · ${dateTime(at)}`,
  informationRequested: 'Information requested',
  approved: (route: InstitutionKind) => `Approved · ${routeWords(route)}`,
  paymentNone: '—',
  paymentNotNeeded: 'Not needed (internal)',
  paymentWaiting: 'Waiting — not confirmed',
  /** "Confirmed · 8 Oct 2026, 15:05". */
  paymentConfirmed: (at: string | null) => (at ? `Confirmed · ${dateTime(at)}` : 'Confirmed'),
  /** B1-08 f7 / B1-10 status words for a failed payment (no B1-11 stand line is drawn). */
  paymentFailed: 'Payment failed',
  accessNotActive: 'Not active',
  /** "Active · ACC-0107". */
  accessActive: (planId: string | null) => (planId ? `Active · ${planId}` : 'Active'),
} as const;

/** The decided panel's next line (B1-11 `next`). */
export const NEXT_LINES = {
  payment:
    'The requester now sees Continue to payment on their request status. Institutional access is not active until the payment is confirmed.',
  active:
    'Institutional access is active. The institution administrator can now give students access.',
  information: 'The request stays open. Your question is on the requester’s request status.',
} as const;

// ---- Existing access (B1-11 `existing`) ----

/** B1-11 REQ-0042 before approval: "None. There is no institution record for … yet. …". */
export function noInstitutionYet(institution: string): string {
  return `None. There is no institution record for ${institution} yet. Approving this request creates the record — it does not activate access.`;
}

/**
 * An existing plan (B1-11 REQ-0038 "Access plan ACC-0081 · these 3 experiments · 860 licences ·
 * current term ends 31 Oct 2026."; REQ-0040 "Access plan ACC-0064 · Buck Converter Ripple (WEB,
 * AR) · 180 licences · term ends 24 Sep 2027. The institution is paused."). A renewal names the
 * experiments it renews; other requests name the plan's experiments.
 */
export function existingPlanWords(
  plan: AccessPlan,
  options: {
    readonly renewal: boolean;
    readonly experimentName: (experimentId: string) => string;
  },
): string {
  const experiments = options.renewal
    ? `these ${plan.items.length} experiment${plan.items.length === 1 ? '' : 's'}`
    : plan.items
        .map((item) => `${options.experimentName(item.experimentId)} (${formatList(item.formats)})`)
        .join(', ');
  const ends = options.renewal
    ? `current term ends ${calendarDay(plan.endsOn)}`
    : `term ends ${calendarDay(plan.endsOn)}`;
  return `Access plan ${plan.id} · ${experiments} · ${plan.licences} licences · ${ends}.`;
}

export const PAUSED_SUFFIX = ' The institution is paused.';

/** B1-11 f9: the institution record this approval created, payment still waiting. */
export function createdWaitingPayment(at: string): string {
  return `Institution record created by this approval · ${dateTime(at)}. No institutional access yet — it is activated only after the payment is confirmed.`;
}

/** B1-11 f10 / f11: the record created by this approval, now with access. */
export function createdActive(
  createdAt: string,
  route: InstitutionKind,
  activatedAt: string,
  planId: string | null,
): string {
  const plan = planId ? ` · access plan ${planId}` : '';
  return route === 'external'
    ? `Institution record created · ${dateTime(createdAt)}. Institutional access active since ${dateTime(activatedAt)}, after the payment was confirmed${plan}.`
    : `Institution record created · ${dateTime(createdAt)}. Institutional access active since ${dateTime(activatedAt)} (internal, no payment step)${plan}.`;
}

/**
 * An institution record with no access plan yet, before this request is decided (no board draws
 * it: a classified institution waiting for its first payment), PROVISIONAL (state-copy
 * `SA-03.existing-no-plan`).
 */
export const EXISTING_NO_PLAN = 'No access plan yet.';

// ---- History (B1-11 `hist`) ----

/** A person's or the requester's name on a history line; systems are not named (B1-11 f10). */
function actorName(actor: ActorRef): string | null {
  if (actor.kind === 'person') return actor.displayName;
  if (actor.kind === 'requester') return actor.name;
  return null;
}

/** One history line for the Super Admin, newest first by the caller. */
export interface HistoryLine {
  readonly id: string;
  readonly what: string;
  readonly when: string;
  readonly note: string | null;
}

/**
 * A request's history as B1-11 writes it for the Super Admin. Undrawn events for this reader
 * (review start, payment started or not completed) take the requester's B1-08 words,
 * PROVISIONAL (state-copy `SA-03.history-undrawn`).
 */
export function historyLine(
  entry: HistoryEntry<RequestEvent>,
  request: Pick<AccessRequest, 'contact' | 'decision'>,
  options: { readonly createdInstitution: boolean },
): HistoryLine {
  const at = dateTime(entry.at);
  const by = actorName(entry.actor);
  const withActor = by ? `${at} · ${by}` : at;
  switch (entry.event) {
    case 'submitted':
      return {
        id: entry.id,
        what: 'Request submitted',
        when: `${at} · ${request.contact.person}, contact person`,
        note: null,
      };
    case 'information-requested':
      return {
        id: entry.id,
        what: 'Information requested',
        when: withActor,
        note: entry.note ? `“${entry.note}”` : null,
      };
    case 'approved':
    case 'approved-with-changes': {
      const route: InstitutionKind =
        request.decision?.route ?? (entry.note === 'internal' ? 'internal' : 'external');
      const smaller = entry.event === 'approved-with-changes';
      const reason = smaller && entry.note ? ` Reason: “${entry.note}”` : '';
      return {
        id: entry.id,
        what: `${smaller ? 'Request approved with a smaller scope' : 'Request approved'} · ${routeWords(route)}`,
        when: withActor,
        note: `${options.createdInstitution ? 'Institution record created. ' : ''}${
          route === 'external'
            ? 'Status: Approved — payment required. Access not active until the payment is confirmed.'
            : 'No payment step.'
        }${reason}`,
      };
    }
    case 'payment-confirmed':
      return { id: entry.id, what: 'Payment confirmed', when: at, note: null };
    case 'access-active': {
      const planId = entry.note;
      const internal = request.decision?.route === 'internal';
      return {
        id: entry.id,
        what: 'Institutional access activated',
        when: at,
        note: internal
          ? `No payment step (internal).${planId ? ' Access plan created.' : ''}`
          : planId
            ? `Access plan ${planId} created.`
            : null,
      };
    }
    case 'review-started':
      return { id: entry.id, what: 'BITS started reviewing', when: at, note: null };
    case 'payment-started':
      return { id: entry.id, what: 'Payment started', when: withActor, note: null };
    case 'payment-not-completed':
      return { id: entry.id, what: 'Payment not completed', when: at, note: null };
  }
}

/**
 * The panel's drawn checks (B1-11 `validate`), run before the confirmation opens — the board
 * validates there, so a confirm never opens for an incomplete decision. The same words are the
 * contract catalogue's (`SA-03.*`, checked in `requests.test.ts`); the service checks again on
 * every command, and its refusal is what the panel shows if it still refuses.
 */
export const DECISION_ERRORS = {
  choice: 'Choose a decision',
  route: 'Choose internal or external',
  formats: 'Keep at least one format',
  licences: 'Enter a whole number of licences',
  change: 'Change at least one thing, or choose Approve request',
  reason: 'Enter the reason for the change',
  question: 'Enter what you need from the requester',
} as const;
