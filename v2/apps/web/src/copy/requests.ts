/**
 * The words of the Super Admin's request screens — SA-02 Requests and SA-03 Request decision — in
 * the owner-approved V3 Refined B design (the Super Admin export, design/v3-refined-b/roles/SA-v1
 * `sa-views-a.js` `V.requests`, `V.decision`, `SA.DLG.approveReq`), written from the canonical
 * facts the ports answer (`@xr/contracts/draft` `requestRow`, `decisionPage`, `decisionOutcome`):
 * read models carry no words. What the export does not draw is a provisional entry of the
 * state-copy register (`state-copy.ts`, VD-12), never an invented rule. Status words come from the
 * role-relative table (`flow-state-words.ts` `requestWords`). Internal references (REQ-, ACC-)
 * never appear in these words or in accessible names: requests are named by their institution.
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

import { calendarDay, dateTime, dayMonthYear } from './dates';
import { formatName } from './flow-state-words';

// ---- shared (SA-02 columns, SA-03 facts; also read by IA-03 and PU-07) ----

/** SA-02 "Type" column and filter; SA-03 page head. */
export const REQUEST_TYPE_WORDS: Readonly<Record<RequestType, string>> = {
  'new-access': 'New access',
  'additional-licences': 'Additional licences',
  renewal: 'Renewal',
};

/** The type as a row's accessible name writes it: "additional licences". */
export const REQUEST_TYPE_LOWER: Readonly<Record<RequestType, string>> = {
  'new-access': 'new access',
  'additional-licences': 'additional licences',
  renewal: 'renewal',
};

/**
 * "Internal or external" (SA-02 Type column sub-line and filter; SA-03 fact): an existing
 * institution's route, or "Not set yet" until the first approval of a new institution (T-04).
 */
export function routeWords(route: InstitutionKind | null): string {
  if (route === 'internal') return 'Internal';
  if (route === 'external') return 'External';
  return 'Not set yet';
}

/** The route as the decided panel and the history write it: "internal", "external". */
function routeLower(route: InstitutionKind): string {
  return route;
}

/** Formats as the boards list them: "WEB, VR", in the display order WEB · AR · VR · MR. */
export function formatList(formats: readonly Technology[]): string {
  return inDisplayOrder(formats).map(formatName).join(', ');
}

/**
 * The access term asked for ("Yearly"; more licences: "Current term"). "Until a fixed date" has no
 * SA wording (P1-10): the date is written as words, PROVISIONAL (state-copy `SA-03.term-until`).
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

/** "Licences requested" ("120"; a more-licences request: "60 more"). */
export function licencesRequestedWords(type: RequestType, licences: number): string {
  return type === 'additional-licences' ? `${licences} more` : String(licences);
}

/** An experiment as the catalogue names it, for the request screens. */
export interface ExperimentName {
  readonly name: string;
  /** The platform course code ("ME ZG523"), when the course has one. */
  readonly code: string | null;
  /** The course's name ("Thermodynamics & Heat Transfer"). */
  readonly course: string;
}

/**
 * An experiment no published catalogue entry names (unpublished since it was requested): its
 * reference stands in, PROVISIONAL (state-copy `SA-02.unnamed-experiment`).
 */
export function unnamedExperiment(experimentId: string): ExperimentName {
  return { name: experimentId, code: null, course: '' };
}

// ---- SA-02 Requests (`V.requests`) ----

export const REQUESTS_PAGE = {
  title: 'Requests',
  summary: 'Institutional access requests sent from the public site. Open one to decide it.',
  /** The list surface's name and the table's caption. */
  caption: 'Institutional access requests',
  filterLabel: 'Filter requests',
  searchLabel: 'Search',
  searchPlaceholder: 'Institution or contact person',
  statusLabel: 'Status',
  allStatuses: 'All statuses',
  typeLabel: 'Type',
  allTypes: 'All types',
  moreFilters: 'More filters',
  routeLabel: 'Internal or external',
  allRoutes: 'All',
  headers: {
    who: 'Institution and contact person',
    what: 'Experiments',
    kind: 'Type',
    when: 'Received',
    status: 'Status',
  },
  receivedHeader: 'Received',
  sortWords: { desc: 'newest first', asc: 'oldest first' },
  loading: 'Loading requests…',
  failedTitle: 'We couldn’t load the requests',
  failedLine: 'Nothing has changed. Try again.',
  retry: 'Try again',
  emptyTitle: 'No requests yet',
  emptyLine: 'Requests that institutions send from the public site appear here.',
  noMatchTitle: 'No requests match these filters',
  noMatchLine: 'Try fewer filters or a different spelling of the institution or contact person.',
  clearFilters: 'Clear filters',
} as const;

/** "Experiments": the one experiment's title (its formats as badges), or "3 experiments". */
export function experimentsCell(
  firstItem: { readonly name: string; readonly formats: readonly Technology[] } | null,
  itemCount: number,
): { readonly line: string; readonly formats: readonly Technology[] } {
  if (itemCount === 1 && firstItem) return { line: firstItem.name, formats: firstItem.formats };
  return { line: `${itemCount} experiments`, formats: [] };
}

/** The badges' meaning, read instead of the codes: "Formats requested: WEB, VR". */
export function formatsRequestedLabel(formats: readonly Technology[]): string {
  return `Formats requested: ${formatList(formats)}`;
}

/** The count: "8 requests"; "2 of 8 requests" while a filter or search is applied. */
export function requestCountWords(shown: number, total: number, filtered: boolean): string {
  return filtered ? `${shown} of ${total} requests` : `${total} requests`;
}

/**
 * A row link's name — the row in words and what it does: "Konark Polytechnic, additional licences,
 * received 29 Sep 2026, Under review. Open the request".
 */
export function requestRowLinkLabel(
  institution: string,
  type: RequestType,
  receivedAt: string,
  status: string,
): string {
  return `${institution}, ${REQUEST_TYPE_LOWER[type]}, received ${dayMonthYear(receivedAt)}, ${status}. Open the request`;
}

/** A chip's words: "Search: “konark”", "Status: Under review", "Internal or external: External". */
export function filterChipWords(label: string, value: string): string {
  return `${label}: ${value}`;
}

/** The search chip: "Search: “konark”". */
export function searchChipWords(search: string): string {
  return `Search: “${search}”`;
}

// ---- SA-03 Request decision (`V.decision`) ----

export const DECISION_PAGE = {
  back: 'Requests',
  eyebrow: 'Institutional access request',
  goTo: 'Go to decision',
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
  existing: 'Existing access',
  message: 'Message from the requester',
  history: 'History',
  panelTitle: 'Your decision',
  decisionLegend: 'Decision',
  checkTitle: 'Check your decision',
  backToRequests: 'Back to requests',
  openInstitution: 'Open institution',
} as const;

/** "Received 2 Oct 2026, 10:14" (the page head). */
export function receivedWords(receivedAt: string): string {
  return `Received ${dateTime(receivedAt)}`;
}

/** "Meera Iyer, contact person" (the message's author line). */
export function contactPersonWords(contact: string): string {
  return `${contact}, contact person`;
}

/** "What they’re asking for": the key and each format cell's words. */
export const FORMAT_WORDS = {
  key: {
    on: 'Requested',
    pub: 'Published, not requested',
    none: 'Not published',
  },
  cell: {
    on: 'Requested',
    pub: 'Not requested',
    none: 'Not published',
  },
} as const;

/** The format cells' name: "Formats requested: WEB, VR. Published: WEB, AR, VR." */
export function formatCellsLabel(
  requested: readonly Technology[],
  published: readonly Technology[],
): string {
  return `Formats requested: ${formatList(requested)}. Published: ${formatList(published)}.`;
}

/** "What happens after you decide" — four separate events (shown until the request is decided). */
export const FOUR_EVENTS = {
  title: 'What happens after you decide',
  note: 'Four separate events',
  steps: [
    {
      what: 'Institution record',
      line: 'Created when you approve the first request from a new institution. A record is not access.',
    },
    {
      what: 'Request approval',
      line: 'Your decision on this page. External: the request becomes Approved — payment required. Internal: approved with no payment step.',
    },
    {
      what: 'Payment confirmation',
      line: 'External only. It happens after the requester pays and is not recorded on this page.',
    },
    {
      what: 'Institutional access activation',
      line: 'Internal: when you approve. External: only after the payment is confirmed. Students get access only when the institution administrator gives it.',
    },
  ],
  footnote:
    'Request more information keeps the request open; none of the four events happen until it is approved.',
} as const;

/** The three decisions. */
export const DECISION_CHOICES = {
  approve: { title: 'Approve request', sub: 'Approve what they asked for.' },
  smaller: {
    title: 'Approve a smaller scope',
    sub: 'Fewer formats, fewer licences or a shorter term, with a reason.',
    // A renewal's smaller scope (refusal `renewal-scope-not-adjustable`; T-07, D8).
    renewal: 'Not available for a renewal. The term continues the current plan.',
  },
  info: {
    title: 'Request more information',
    sub: 'The request stays open. Your question is shown to the requester.',
  },
} as const;

/** "Internal or external" for a new institution (only at its first approval, REQ-12). */
export const ROUTE_CHOICE = {
  legend: 'Internal or external',
  hint: 'Required to approve. You set this; the requester never chooses it.',
  internal: {
    title: 'Internal: BITS campus or programme',
    sub: 'No payment step. Institutional access is activated when you approve.',
  },
  external: {
    title: 'External institution',
    sub: 'Approval, then payment. Institutional access is activated only after the payment is confirmed.',
  },
  /** A classified institution's route, read-only: "Internal or external: External. Set when …". */
  lockedBefore: 'Internal or external: ',
  lockedAfter: '. Set when this institution was first approved.',
} as const;

/** Approve a smaller scope. */
export const SMALLER_SCOPE = {
  formatsLegend: 'Formats to approve',
  licencesLabel: 'Licences to approve',
  /** A more-licences request (`r.more`). */
  additionalLicencesLabel: 'Additional licences to approve',
  termLabel: 'Access term',
  differentTitle: 'Different from the request',
} as const;

export const TERM_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
] as const;

/** One line of "Different from the request": "Licences: 60 more → 40 more". */
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

/** The reason field. */
export const REASON_FIELD = {
  smaller: 'Reason for the change (required)',
  info: 'What do you need from the requester? (required)',
  hint: 'Shown to the requester on their request status.',
} as const;

/** The panel's button and the confirmation's. */
export const DECISION_ACTIONS = {
  approve: 'Approve request',
  smaller: 'Approve smaller scope',
  info: 'Send request for information',
} as const;

/** What the panel still needs before its button works. */
export const PENDING_HINTS = {
  route: 'Choose internal or external before approving.',
  smaller: 'Change at least one thing and give a reason before approving.',
  info: 'Add your question before sending.',
} as const;

/** No decision controls while the institution is paused. */
export const PAUSED_BLOCK = {
  title: 'This institution is paused',
  line: 'Requests from a paused institution can’t be decided. You can decide this one once the pause ends.',
  viewInstitution: 'View institution',
} as const;

/**
 * DP-09 interim safeguard (owner decision and provisional wording, 5 Nov 2026; state-copy
 * `SA-03.same-name`): the request names an institution that already exists, so approving it would
 * create a second record; the decision waits until requests can be matched to an existing
 * institution.
 */
export const SAME_NAME_BLOCK = {
  title: 'An institution with this name already exists',
} as const;

/** One existing institution of the same name, with its route. */
export function sameNameLine(name: string, kind: InstitutionKind): string {
  return `${name} is already on the platform (${routeWords(kind)}). This request can’t be decided until requests can be matched to an existing institution.`;
}

/** The link to that institution's page (SA-07). */
export function openInstitutionWords(name: string): string {
  return `Open ${name}`;
}

/** The confirmation's question (`SA.DLG.approveReq`). */
export function confirmTitle(smaller: boolean, renewal: boolean, institution: string): string {
  if (smaller) return `Approve a smaller scope for ${institution}?`;
  return renewal
    ? `Approve the renewal from ${institution}?`
    : `Approve the request from ${institution}?`;
}

export const CONFIRM_DIALOG = {
  description: 'Check what approving does now, and what happens only after later events.',
  now: 'What happens now',
  later: 'Only after later events, or not from here',
} as const;

/** "Creates the institution record for Godavari Institute of Technology, classified external." */
export function confirmCreatesRecord(institution: string, route: InstitutionKind | null): string {
  return `Creates the institution record for ${institution}, classified ${route === 'internal' ? 'internal' : 'external'}.`;
}

/** "This page does not change the current plan. Its term still shows as ending on 31 Oct 2026." */
export function planUnchangedLine(endsOn: string | null): string {
  return endsOn === null
    ? 'This page does not change the current plan.'
    : `This page does not change the current plan. Its term still shows as ending on ${calendarDay(endsOn)}.`;
}

export const CONFIRM_LINES = {
  externalApproves: 'Approves the request. Its status becomes Approved — payment required.',
  externalNotActive:
    'Institutional access is not activated now. It is activated only after the payment is confirmed.',
  /** An existing institution's external approval: the plan effect is open (OD-B3-09). */
  externalExisting:
    'Payment is confirmed outside this page. Current access continues unchanged, and the plan isn’t changed from here.',
  internalApproves: 'Approves the request. There is no payment step.',
  renewalApproves: 'Approves the renewal. There is no payment step.',
  internalActive: 'Institutional access is activated now and the access plan is created.',
  smaller: 'The requester sees what changed and your reason.',
  students: 'Students get access only when the institution’s administrator gives it.',
} as const;

// ---- after a decision (`doneHtml`) ----

/** Who decided: the signed-in Super Admin ("you"), another person by name, else BITS. */
export function decidedBy(actor: ActorRef, personId: string): string | null {
  if (actor.kind === 'person' && actor.personId === personId) return null;
  return actor.kind === 'person' ? actor.displayName : 'BITS';
}

/**
 * The decided panel's line: "Decided by you on 8 Oct 2026, 10:05, external", "Sent by you on …";
 * another Super Admin by name, PROVISIONAL (state-copy `SA-03.decided-by-another`): "Decided on
 * 8 Oct 2026, 10:05 by Arjun Mehta, external".
 */
export function decidedMeta(
  decided:
    | { readonly kind: 'information'; readonly at: string }
    | { readonly kind: 'approval'; readonly at: string; readonly route: InstitutionKind },
  other: string | null,
): string {
  const at = dateTime(decided.at);
  if (decided.kind === 'information') {
    return other === null ? `Sent by you on ${at}` : `Sent on ${at} by ${other}`;
  }
  const route = routeLower(decided.route);
  return other === null
    ? `Decided by you on ${at}, ${route}`
    : `Decided on ${at} by ${other}, ${route}`;
}

/** "Where this request stands" (`dl.rk-stand`). */
export const STAND = {
  institutionRecord: 'Institution record',
  request: 'Request',
  payment: 'Payment',
  access: 'Institutional access',
  notCreated: 'Not created',
  exists: 'Exists',
  /** "Created 8 Oct 2026, 10:05" — the record this approval created. */
  created: (at: string) => `Created ${dateTime(at)}`,
  informationRequested: 'Information requested',
  /** "Approved (external)". */
  approved: (route: InstitutionKind) => `Approved (${routeLower(route)})`,
  paymentNotStarted: 'Not started',
  paymentNotNeeded: 'Not needed (internal)',
  paymentWaiting: 'Waiting, not confirmed',
  paymentNotConfirmed: 'Not confirmed',
  /** "Confirmed 8 Oct 2026, 15:05". */
  paymentConfirmed: (at: string | null) => (at ? `Confirmed ${dateTime(at)}` : 'Confirmed'),
  /** B1-08 f7's words for a failed payment (no SA state draws it). */
  paymentFailed: 'Payment failed',
  accessNotActive: 'Not active',
  accessUnchanged: 'Active, unchanged',
  /** "Active since 8 Oct 2026, 10:05". */
  accessActiveSince: (at: string | null) => (at ? `Active since ${dateTime(at)}` : 'Active'),
} as const;

/** The decided panel's next line. */
export const NEXT_LINES = {
  paymentNew:
    'The requester now sees Continue to payment on their request status. Institutional access is not active until the payment is confirmed.',
  /** An existing institution: the plan effect is open (`planEffect` policy-open, OD-B3-09). */
  paymentExisting:
    'The requester now sees Continue to payment on their request status. Current access continues unchanged; the plan isn’t changed from this page.',
  activeNew:
    'Institutional access is active. The institution administrator can now give students access.',
  active: 'Institutional access is active.',
  /** An approval whose plan effect is open (`planEffect` policy-open): the plan is not claimed. */
  activePlanUnchanged:
    'Institutional access is active. The current plan isn’t changed from this page.',
  information: 'The request stays open. Your question is on the requester’s request status.',
} as const;

/** A renewal approved with no plan written (`planEffect` policy-open): its term is unchanged. */
export function renewalApprovedLine(endsOn: string | null): string {
  return endsOn === null
    ? 'The renewal is approved. The current plan isn’t changed from this page.'
    : `The renewal is approved. The current plan isn’t changed from this page; its term still shows as ending on ${calendarDay(endsOn)}.`;
}

// ---- Existing access ----

/** A new institution: "None. There is no institution record for … yet." (and, before a decision, what approving does). */
export function noInstitutionYet(institution: string, underReview: boolean): string {
  const none = `None. There is no institution record for ${institution} yet.`;
  return underReview
    ? `${none} Approving this request creates the record; it does not activate access.`
    : none;
}

/**
 * An existing plan, named by content and term, never by reference (the export's `existing`): a
 * renewal's "The current access plan holds these 3 experiments and 860 licences. Its current term
 * ends on 31 Oct 2026."; other requests' "An access plan with Buck Converter Ripple (WEB, AR) and
 * 180 licences, on a quarterly term that ends on 2 Nov 2026."
 */
export function existingPlanWords(
  plan: AccessPlan,
  options: {
    readonly renewal: boolean;
    readonly experimentName: (experimentId: string) => string;
  },
): string {
  const ends = calendarDay(plan.endsOn);
  if (options.renewal) {
    const count = plan.items.length;
    return `The current access plan holds ${count === 1 ? 'this experiment' : `these ${count} experiments`} and ${plan.licences} licences. Its current term ends on ${ends}.`;
  }
  const experiments = plan.items
    .map((item) => `${options.experimentName(item.experimentId)} (${formatList(item.formats)})`)
    .join(', ');
  const term = plan.term === 'until-date' ? 'a term' : `a ${plan.term} term`;
  return `An access plan with ${experiments} and ${plan.licences} licences, on ${term} that ends on ${ends}.`;
}

export const PAUSED_SUFFIX = ' The institution is paused.';

/** The record this approval created, payment still waiting. */
export function createdWaitingPayment(at: string): string {
  return `Institution record created by this approval on ${dateTime(at)}. No institutional access yet; it is activated only after the payment is confirmed.`;
}

/** The record this approval created, now with access. */
export function createdActive(
  createdAt: string,
  route: InstitutionKind,
  activatedAt: string,
): string {
  return route === 'external'
    ? `Institution record created on ${dateTime(createdAt)}. Institutional access active since ${dateTime(activatedAt)}, after the payment was confirmed.`
    : `Institution record created on ${dateTime(createdAt)}. Institutional access active since then (internal, no payment step).`;
}

/**
 * An institution record with no access plan yet, before this request is decided (not drawn: a
 * classified institution waiting for its first payment), PROVISIONAL (state-copy
 * `SA-03.existing-no-plan`).
 */
export const EXISTING_NO_PLAN = 'No access plan yet.';

// ---- History ----

/** A person's or the requester's name on a history line; systems are not named. */
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
 * A request's history as the export writes it for the Super Admin ("Request approved (external)",
 * "8 Oct 2026, 10:05 by Arjun Mehta"). Events the export does not draw (review start, payment
 * started or not completed) take the requester's B1-08 words, PROVISIONAL (state-copy
 * `SA-03.history-undrawn`). No plan is named by its reference.
 */
export function historyLine(
  entry: HistoryEntry<RequestEvent>,
  request: Pick<AccessRequest, 'contact' | 'decision'>,
  options: { readonly createdInstitution: boolean },
): HistoryLine {
  const at = dateTime(entry.at);
  const by = actorName(entry.actor);
  const withActor = by ? `${at} by ${by}` : at;
  switch (entry.event) {
    case 'submitted':
      return {
        id: entry.id,
        what: 'Request submitted',
        when: `${at} by ${contactPersonWords(request.contact.person)}`,
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
      const created = options.createdInstitution ? 'Institution record created. ' : '';
      const status =
        route === 'external'
          ? options.createdInstitution
            ? 'Status: Approved — payment required. Access not active until the payment is confirmed.'
            : 'Status: Approved — payment required. Current access continues unchanged.'
          : 'No payment step.';
      return {
        id: entry.id,
        what: `${smaller ? 'Request approved with a smaller scope' : 'Request approved'} (${routeLower(route)})`,
        when: withActor,
        note: `${created}${status}${reason}`,
      };
    }
    case 'payment-confirmed':
      return { id: entry.id, what: 'Payment confirmed', when: at, note: null };
    case 'access-active': {
      const planCreated = Boolean(entry.note);
      const internal = request.decision?.route === 'internal';
      return {
        id: entry.id,
        what: 'Institutional access activated',
        when: at,
        note: internal
          ? `No payment step (internal).${planCreated ? ' Access plan created.' : ''}`
          : planCreated
            ? 'Access plan created for the institution.'
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
 * The panel's checks, run before the confirmation opens. The same words are the contract
 * catalogue's (`SA-03.*`, checked in `requests.test.ts`); the service checks again on every
 * command, and its refusal is what the panel shows if it still refuses.
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
