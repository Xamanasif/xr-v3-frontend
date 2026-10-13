/**
 * M03 Access request (REQ) + payment attempt, M04 Selection (Appendix C §2).
 * Boards: B1-06, B1-07, B1-08, B1-10, B1-11, B1-13, B3-08, B7-01, B7-09; flows.json A1–A4.
 *
 * One canonical status; the requester reads "Submitted" until the review-started fact is set,
 * then "Under review" (B1-08, B1-13). That fact comes only from the seed or a test — opening the
 * Super Admin's decision page never sets it (owner decision AD-14 / P1-04, 12 Oct 2026; this
 * supersedes the older Appendix F WP-0.9 (8) interim "on the first SA-03 read").
 * There is no Declined state and no decline command (T-02; REQ-10, REQ-20). No transition leaves
 * "Information requested" (T-03; REQ-06, REQ-18).
 */
import type { ActorRef } from '../roles.js';
import type { Technology } from '../technology.js';
import type { HistoryEntry } from '../kernel/history.js';
import type {
  AccessPlanId,
  ExperimentId,
  InstitutionId,
  PaymentAttemptId,
  RequestId,
  RequestStatusToken,
} from '../kernel/ids.js';
import type { TransitionTable } from '../kernel/machine.js';
import type { RecordMeta } from '../kernel/record.js';
import type { CalendarDate, IsoInstant } from '../kernel/time.js';
import type { InstitutionKind } from '../institution/model.js';

export type RequestType = 'new-access' | 'additional-licences' | 'renewal';
export type RequestOrigin = 'public' | 'institute-admin';

export type RequestedTerm =
  | { readonly kind: 'monthly' }
  | { readonly kind: 'quarterly' }
  | { readonly kind: 'yearly' }
  /** B1-07 'Until a fixed date' (stakeholder term set conflict [U], BR-040). */
  | { readonly kind: 'until-date'; readonly endsOn: CalendarDate }
  /** Additional licences only: 'Current term' (B1-11 REQ-0040). */
  | { readonly kind: 'current-plan' };

/** An experiment with ≥ 1 chosen format. */
export interface RequestedItem {
  readonly experimentId: ExperimentId;
  readonly formats: readonly Technology[];
}

export const REQUEST_STATUSES = [
  'under-review',
  'information-requested',
  'approved-payment-required',
  'payment-not-confirmed',
  'payment-failed',
  'access-active',
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export interface RequestContact {
  readonly person: string;
  readonly email: string;
  readonly phone: string | null;
}

/** The Super Admin's approval; the smaller scope carries the reason "Shown to the requester". */
export type RequestDecision =
  | {
      readonly kind: 'approved-as-requested';
      readonly at: IsoInstant;
      readonly by: ActorRef;
      readonly route: InstitutionKind;
    }
  | {
      readonly kind: 'approved-smaller-scope';
      readonly at: IsoInstant;
      readonly by: ActorRef;
      readonly route: InstitutionKind;
      readonly approvedItems: readonly RequestedItem[];
      readonly approvedLicences: number;
      readonly approvedTerm: Extract<RequestedTerm, { kind: 'monthly' | 'quarterly' | 'yearly' }>;
      readonly reason: string;
    };

/** Provider-neutral: no amount, method, provider or refund (T-05). */
export interface PaymentAttempt {
  readonly id: PaymentAttemptId;
  readonly startedAt: IsoInstant;
  readonly outcome: 'pending' | 'confirmed' | 'failed';
  readonly outcomeAt: IsoInstant | null;
}

export type RequestEvent =
  | 'submitted'
  | 'review-started'
  | 'information-requested'
  | 'approved'
  | 'approved-with-changes'
  | 'payment-started'
  | 'payment-not-completed'
  | 'payment-confirmed'
  | 'access-active';

export interface AccessRequest extends RecordMeta {
  /** 'Your reference is REQ-0042'. */
  readonly id: RequestId;
  /** The status page's key — the reference is not a key (B1-08). */
  readonly statusToken: RequestStatusToken;
  readonly type: RequestType;
  readonly origin: RequestOrigin;
  /** Null until the first approval of a new institution. */
  readonly institutionId: InstitutionId | null;
  readonly institutionName: string;
  readonly contact: RequestContact;
  readonly items: readonly RequestedItem[];
  /** Whole number ≥ 1; for additional licences, "N more". Nothing says what a licence covers (D7). */
  readonly licencesRequested: number;
  readonly term: RequestedTerm;
  readonly message: string | null;
  /** 'Renew access plan ACC-0107'. */
  readonly sourcePlanId: AccessPlanId | null;
  readonly receivedAt: IsoInstant;
  /** "BITS started reviewing" — seeded or test-supplied only (AD-14). */
  readonly reviewStartedAt: IsoInstant | null;
  readonly status: RequestStatus;
  /** 'Not set yet' until the first approval; later requests inherit the institution's kind. */
  readonly route: InstitutionKind | null;
  readonly decision: RequestDecision | null;
  readonly informationRequest: {
    readonly reason: string;
    readonly at: IsoInstant;
    readonly by: ActorRef;
  } | null;
  readonly payments: readonly PaymentAttempt[];
  readonly activatedPlanId: AccessPlanId | null;
  readonly history: readonly HistoryEntry<RequestEvent>[];
}

export type RequestCommand =
  | 'submitPublicRequest'
  | 'submitRenewalRequest'
  | 'submitAdditionalLicencesRequest'
  | 'recordReviewStarted'
  | 'requestMoreInformation'
  | 'approveRequest'
  | 'approveSmallerScope'
  | 'startPayment'
  | 'paymentConfirmed'
  | 'paymentFailed';

/** Appendix C M03 "Transitions". Nothing leaves information-requested (T-03); no decline (T-02). */
export const REQUEST_TRANSITIONS: TransitionTable<RequestStatus, RequestCommand> = [
  { from: null, to: 'under-review', command: 'submitPublicRequest', actors: ['public'] },
  { from: null, to: 'under-review', command: 'submitRenewalRequest', actors: ['tenant_admin'] },
  {
    from: null,
    to: 'under-review',
    command: 'submitAdditionalLicencesRequest',
    actors: ['tenant_admin'],
  },
  {
    from: 'under-review',
    to: 'under-review',
    command: 'recordReviewStarted',
    actors: ['system:review-start'],
  },
  {
    from: 'under-review',
    to: 'information-requested',
    command: 'requestMoreInformation',
    actors: ['super_admin'],
  },
  {
    from: 'under-review',
    to: 'approved-payment-required',
    command: 'approveRequest',
    actors: ['super_admin'],
  },
  { from: 'under-review', to: 'access-active', command: 'approveRequest', actors: ['super_admin'] },
  {
    from: 'under-review',
    to: 'approved-payment-required',
    command: 'approveSmallerScope',
    actors: ['super_admin'],
  },
  {
    from: 'under-review',
    to: 'access-active',
    command: 'approveSmallerScope',
    actors: ['super_admin'],
  },
  {
    from: 'approved-payment-required',
    to: 'payment-not-confirmed',
    command: 'startPayment',
    actors: ['public', 'tenant_admin'],
  },
  {
    from: 'payment-failed',
    to: 'payment-not-confirmed',
    command: 'startPayment',
    actors: ['public', 'tenant_admin'],
  },
  {
    from: 'payment-not-confirmed',
    to: 'access-active',
    command: 'paymentConfirmed',
    actors: ['system:payment-provider'],
  },
  {
    from: 'payment-not-confirmed',
    to: 'payment-failed',
    command: 'paymentFailed',
    actors: ['system:payment-provider'],
  },
];

/** M04: lives in the visitor's browser session until the request is sent; no account (B1-06). */
export interface Selection {
  readonly items: readonly SelectionItem[];
  /** Single-level undo, as drawn. */
  readonly lastRemoved: SelectionItem | null;
}

export interface SelectionItem {
  readonly experimentId: ExperimentId;
  /** ≥ 1, a subset of the experiment's published formats. */
  readonly formats: readonly Technology[];
  readonly addedAt: IsoInstant;
}

export const EMPTY_SELECTION: Selection = { items: [], lastRemoved: null };
