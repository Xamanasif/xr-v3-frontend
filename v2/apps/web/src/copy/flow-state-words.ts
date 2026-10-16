/**
 * Role-relative state words for the records the cross-role flows share (Appendix D §5.4
 * "Canonical state × viewer-role labels (copy table, not data)", AD-24; Appendix F §7.4; WP-0.14).
 *
 * The read models return canonical states only — never words (`@xr/contracts/draft`). The same
 * record reads differently by viewer: DTR-0018 `with-institute-admin` is "With your Institute
 * Admin" to the Student, "Waiting on you" to the Institute Admin and "Still with the institution"
 * to the Super Admin (B3-07 f4, B3-09 f0, B3-11 f2). Each entry names the board frame it is drawn
 * on. A state no board words for a viewer answers `null` with the open decision that leaves it
 * unwritten — words are never invented here.
 *
 * The later-phase screens (Phases 1–6) read their status words through these functions; WP-0.14
 * checks every entry the flows reach against an independent expected-words fixture taken from the
 * frozen board frames (`flow-words.fixture.ts`), on the sample world's own read models.
 */
import type {
  AccessPlanStatus,
  AttemptResult,
  DeviceTransferState,
  FormatProgressStatus,
  InstitutionStatus,
  RequestStatus,
  Role,
  SubmissionStatus,
  SupportState,
  Technology,
  UpdateState,
} from '@xr/domain';

import { dayMonthYear } from './dates';

/** Who reads the words: a signed-in role, the request's requester (PU-10) or the public. */
export type Viewer = Role | 'requester' | 'public';

/** Words drawn on a board, or `null` where none is drawn, with the decision that keeps it open. */
export type Words = string | { readonly words: null; readonly undrawn: string };

function undrawn(decision: string): Words {
  return { words: null, undrawn: decision };
}

/** The words of an entry, or `null` where the board draws none. */
export function wordsOf(entry: Words): string | null {
  return typeof entry === 'string' ? entry : null;
}

/** The format as the boards write it ("WEB", "VR"). */
export function formatName(format: Technology): string {
  return format.toUpperCase();
}

// ---- REQ — access requests (B1-08, B1-10, B1-11, B3-08) ----

/**
 * A request's status for its viewer. The requester's "Under review" waits for the review-start
 * fact (B1-08 f1 → f2; B1-13 timeline) — seeded or test-only until AD-14 / P1-04 is decided;
 * opening SA-03 never supplies it.
 */
export function requestWords(
  view: { readonly status: RequestStatus; readonly reviewStarted: boolean },
  viewer: 'requester' | 'super_admin' | 'tenant_admin',
): Words {
  switch (view.status) {
    case 'under-review':
      // B1-08 f1 "Submitted" / f2 "Under review"; B1-10 f0 and B3-08: "Under review".
      return viewer === 'requester' && !view.reviewStarted ? 'Submitted' : 'Under review';
    case 'information-requested':
      return 'Information requested'; // B1-08 f3; B1-10 f0; B1-11 f12
    case 'approved-payment-required':
      return 'Approved — payment required'; // B1-08 f0; B1-10 f0; B1-11 f9; B7-03 f3
    case 'payment-not-confirmed':
      return 'Payment not confirmed'; // B1-08 f6; B1-10 f0
    case 'payment-failed':
      return 'Payment failed'; // B1-08 f7
    case 'access-active':
      return 'Access active'; // B1-08 f8; B1-10 f0; B1-11 f10
  }
}

/** PU-10's one next action (B1-08 f0, f6, f7, f8; "Nothing to do" draws no action). */
export const REQUEST_NEXT_STEP = {
  none: null,
  'continue-to-payment': 'Continue to payment',
  'check-again': 'Check again',
  'try-payment-again': 'Try payment again',
  'sign-in': 'Sign in',
} as const satisfies Readonly<Record<string, string | null>>;

// ---- INST / ACC — institution and access plan (B7-03, B2-01, B2-02, B2-03) ----

/** SA-07 and IA-01 write the institution's access in full; IA-02 / IA-03 write the plan short. */
export function institutionWords(status: InstitutionStatus): Words {
  switch (status) {
    case 'approved-payment-required':
      return 'Approved — payment required'; // B7-03 f3; B2-01 f1
    case 'access-active':
      return 'Access active'; // B7-03 f0; B2-01 f0
    case 'ending-soon':
      return 'Ending soon'; // B7-03 f5; B2-01 f3
    case 'access-paused':
      return 'Access paused'; // B7-03 f2; B2-01 f5; B2-13 f5
    case 'access-ended':
      return 'Access ended'; // B7-03 f4; B2-01 f4
  }
}

export function planWords(status: AccessPlanStatus): Words {
  switch (status) {
    case 'access-active':
      return 'Active'; // B2-02 f0; B2-03 f0
    case 'ending-soon':
      return 'Ending soon'; // B2-02 f3; B2-03 f2
    case 'paused':
      return 'Paused'; // B2-02 f5; B2-03 f4
    case 'access-ended':
      return 'Ended'; // B2-02 f4; B2-03 f3
  }
}

// ---- SACC — Student access, as the Institute Admin reads it (B2-04, B2-05) ----

export type GrantDisplay =
  | 'active'
  | 'waiting-for-a-licence'
  | 'student-inactive'
  | 'access-ended'
  | 'paused'
  | 'withdrawn'
  | 'individual-grant-withdrawn';

export function grantWords(display: GrantDisplay): Words {
  switch (display) {
    case 'active':
      return 'Active'; // B2-04 f0; B2-05 f3
    case 'waiting-for-a-licence':
      return 'Waiting for a licence'; // B2-04 f1; B2-05 f11 (supplied only, T-06 / D7)
    case 'student-inactive':
      return 'Student inactive'; // B2-04 f1
    case 'withdrawn':
      return 'Withdrawn'; // B2-04 f5
    case 'individual-grant-withdrawn':
      return 'Individual grant withdrawn'; // B2-04 f4
    case 'access-ended':
      return 'Access ended'; // B3-05 f6 (the Student's earlier work)
    case 'paused':
      return 'Paused'; // B2-02 f5 (the plan row while paused)
  }
}

// ---- Student formats: availability and per-format progress (B3-01 … B3-07, B3-12) ----

export type FormatAvailability =
  | 'available-to-you'
  | 'not-included-for-your-institution'
  | 'not-available-for-this-experiment'
  | 'not-available-right-now';

/** ST-07's availability words for a format that is not open to the Student (B3-07 f1; B3-12 f0). */
export function availabilityWords(availability: FormatAvailability): Words {
  switch (availability) {
    case 'not-included-for-your-institution':
      return 'Not included for your institution';
    case 'not-available-for-this-experiment':
      return 'Not available for this experiment';
    case 'available-to-you':
      // An available format shows its progress word instead (B3-12 f0 "In progress", "Not started").
      return undrawn('B3-12 f0 (progress word shown)');
    case 'not-available-right-now':
      return undrawn('D-26');
  }
}

/**
 * A format's progress for the Student (and in FA-20 / ST-10 / ST-15): "Completed" carries the
 * date the system wrote (B3-03 f3 "Completed 14 Oct 2026"); never an aggregate verdict (BC4).
 * While the institution is paused the format reads "Paused" (B3-03 f5; B3-01 f6, f11).
 */
export function formatProgressWords(progress: {
  readonly status: FormatProgressStatus;
  readonly completion: { readonly completedAt: string } | null;
  readonly paused?: boolean;
}): Words {
  if (progress.paused) return 'Paused';
  switch (progress.status) {
    case 'not-started':
      return 'Not started'; // B3-03 f1; B3-04 f1
    case 'in-progress':
      return 'In progress'; // B3-03 f0; B3-04 f0
    case 'completed':
      return progress.completion
        ? `Completed ${dayMonthYear(progress.completion.completedAt)}` // B3-03 f3; B3-04 f2
        : undrawn('BC3 (Completed is read only from the completion record)');
  }
}

/** ST-08 / ST-09 headings and actions by progress (B3-03, B3-04, B3-06). */
export const FORMAT_WORDS = {
  launch: (format: Technology) => `Launch ${formatName(format)}`, // B3-03 f1
  continue: (format: Technology) => `Continue ${formatName(format)}`, // B3-03 f2
  completed: (format: Technology) => `You’ve completed ${formatName(format)}`, // B3-03 f3; B3-04 f2
  giveFeedback: (format: Technology) => `Give feedback on ${formatName(format)}`, // B3-03 f3; B3-04 f2
  seeFeedback: 'See your feedback', // B3-03 f4
  feedbackSent: (format: Technology) => `Feedback on ${formatName(format)} sent`, // B3-06 f3, f4
  paused: 'You can’t open the simulation right now', // B3-03 f5
} as const;

// ---- ASMT / ATT — assessments and attempts (B4-06, B4-09, B4-11, B4-12, B4-13, B4-14) ----

export type StudentAssessmentResult =
  'to-do' | 'in-progress' | 'waiting-for-marking' | 'not-released-yet' | 'released';

/** ST-11's status of an assessment for the Student (B4-11 f0–f4). */
export function studentAssessmentWords(result: StudentAssessmentResult): Words {
  switch (result) {
    case 'to-do':
      return 'To do'; // B4-11 f0
    case 'in-progress':
      return 'Attempt in progress'; // B4-11 f1
    case 'waiting-for-marking':
      return 'Waiting for marking'; // B4-11 f2
    case 'not-released-yet':
      return 'Result not released yet'; // B4-11 f3
    case 'released':
      return 'Result ready'; // B4-11 f4
  }
}

/** ST-14's headline once released (B4-13 f0, f3). */
export function resultWords(passed: boolean): Words {
  return passed ? 'Passed' : 'Not passed';
}

/** ST-14 and the attempt's own headings (B4-12 f4; B4-13 f0–f2; B4-14 f0). */
export const ASSESSMENT_HEADINGS = {
  created: 'Assessment created', // B4-14 f0
  submitted: 'Answers submitted', // B4-12 f4
  waiting: 'Submitted — waiting for marking', // B4-13 f1
  notReleased: 'Result not released yet', // B4-13 f2
  passed: 'You passed', // B4-13 f0
} as const;

/** FA-10 / FA-12: the assessment is "Ready" once complete (B4-06 f0; BR-078 PROVISIONAL). */
export function assessmentReadinessWords(readiness: 'ready' | 'not-ready'): Words {
  return readiness === 'ready' ? 'Ready' : undrawn('BR-078');
}

/** FA-12 / FA-18 / FA-19: a submission as the Faculty marks it (B4-06 f7, f8; B4-09 f0, f2). */
export function markingWords(
  attempt: { readonly confirmed: boolean },
  place: 'queue' | 'mark',
): Words {
  if (!attempt.confirmed) return 'Waiting for marking';
  return place === 'mark' ? 'Marks confirmed' : 'Marked';
}

// ---- SUB — first publication (B5-06, B6-02, B6-03, B6-06, B6-07, B7-06) ----

/**
 * A submission's status chip for its viewer. The Vendor reads "Submitted" after a resubmit until
 * the record moves on (B5-06 f4; M-3) and "With Academic Reviewer" for a re-check (B5-06 f7, with
 * the line "Back with the Academic Reviewer for a re-check"); the reviewer reads the revision.
 */
export function submissionWords(
  view: { readonly status: SubmissionStatus; readonly revision: number },
  viewer: 'vendor' | 'academic_reviewer' | 'content_manager' | 'super_admin',
  context: { readonly stuck?: boolean } = {},
): Words {
  const { status, revision } = view;
  switch (viewer) {
    case 'vendor':
      switch (status.state) {
        case 'draft':
          return 'Draft'; // B5-06 f1
        case 'with-academic-reviewer':
          return revision > 1 && status.reason === 'resubmission'
            ? 'Submitted' // B5-06 f4 (M-3: kept until the record moves on)
            : 'With Academic Reviewer'; // B5-06 f2, f7
        case 'returned':
          return status.by === 'super-admin-override'
            ? undrawn('B7-06 (Vendor-side override words not drawn)')
            : 'Returned'; // B5-06 f3, f6
        case 'resubmitted':
          return 'Submitted'; // B5-06 f4
        case 'with-content-manager':
          return 'With Content Manager'; // B5-06 f5
        case 'published':
          return 'Published'; // B5-06 f8
      }
      break;
    case 'academic_reviewer':
      switch (status.state) {
        case 'with-academic-reviewer':
          if (status.reason === 'recheck') return 'Back for a re-check'; // B6-03 f3
          return revision > 1
            ? `Resubmitted · revision ${revision}`
            : `Waiting · revision ${revision}`; // B6-03 f0, f2
        case 'with-content-manager':
          return 'Approved — with the Content Manager'; // B6-03 f4; B6-02 f1
        case 'returned':
          return `Returned to vendor · revision ${revision}`; // B6-02 f1
        case 'published':
          return 'Approved — published'; // B6-02 f1
        case 'draft':
        case 'resubmitted':
          return undrawn('SUB-16 / M-3 (not the reviewer’s to see)');
      }
      break;
    case 'content_manager':
      switch (status.state) {
        case 'with-content-manager':
          return 'Ready to publish'; // B6-07 f0 (CM-02 lists it "Ready", B6-06 f0)
        case 'with-academic-reviewer':
          // B6-07 script `cmChipWords`: a re-check she sent reads "Back with the Academic Reviewer".
          return status.reason === 'recheck'
            ? 'Back with the Academic Reviewer'
            : 'Still in academic review'; // B6-07 f3; B6-11 f5
        case 'resubmitted':
          return 'Still in academic review'; // B6-07 f3; B6-11 f5
        case 'published':
          return 'Published'; // B6-07 f4
        case 'returned':
          return 'With the vendor'; // B6-07 script `cmChipWords` (returned, returned_cm)
        case 'draft':
          return undrawn('SUB-16 (only the Vendor sees a draft)');
      }
      break;
    case 'super_admin':
      if (context.stuck) return 'Stuck — nobody can act'; // B7-06 f1
      switch (status.state) {
        case 'with-academic-reviewer':
        case 'resubmitted':
          return 'With Academic Reviewer'; // B7-06 f0, f4
        case 'with-content-manager':
          return 'With Content Manager'; // B7-06 f0
        case 'returned':
          return 'Returned to vendor'; // B7-06 f0
        case 'published':
          return 'Published'; // B7-06 f0, f3
        case 'draft':
          return undrawn('SUB-16 (only the Vendor sees a draft)');
      }
      break;
  }
  return undrawn('AD-24');
}

/**
 * RV-05 "Reviewed by me": the reviewer's own decision and where the record is now (B6-02 f1).
 * A record the reviewer approved and the Content Manager later sent back reads "Approved — later
 * sent back for a re-check" while it waits for the re-check.
 */
export function reviewedByMeWords(row: {
  readonly decision: {
    readonly decision: 'approve' | 'return-to-vendor' | 'return-to-content-manager';
    readonly revision?: number;
  };
  readonly nowState: SubmissionStatus | UpdateState;
}): Words {
  const { decision, nowState } = row;
  if (typeof nowState === 'string') {
    if (decision.decision === 'return-to-content-manager') return 'Returned to the Content Manager';
    if (nowState === 'released') return 'Update approved — released';
    if (nowState === 'awaiting-release-decision' || nowState === 'on-hold')
      return 'Update approved — with the Super Admin';
    return undrawn('B6-02 f1 (no line drawn for this update state)');
  }
  // B6-02 f1: still returned → "Returned to vendor" (SUB-0081); once it has moved on, the decision
  // names the revision it returned ("Returned to vendor · revision 1", SUB-0077).
  if (decision.decision === 'return-to-vendor')
    return nowState.state === 'returned'
      ? 'Returned to vendor'
      : `Returned to vendor · revision ${decision.revision ?? 1}`;
  if (nowState.state === 'published') return 'Approved — published';
  if (nowState.state === 'with-content-manager') return 'Approved — with the Content Manager';
  if (nowState.state === 'with-academic-reviewer' && nowState.reason === 'recheck')
    return 'Approved — later sent back for a re-check';
  return undrawn('B6-02 f1 (no line drawn for this state)');
}

/** VE-07 / VE-08's "returned" heading names who returned it (B5-06 f3, f6; B5-07 f0, f1). */
export function returnedByHeading(
  by: 'academic-reviewer' | 'content-manager' | 'super-admin-override',
): Words {
  if (by === 'academic-reviewer') return 'Returned by the Academic Reviewer';
  if (by === 'content-manager') return 'Returned by the Content Manager';
  return undrawn('B7-06 (Vendor-side override words not drawn)');
}

// ---- UPD — corrections (B6-04, B6-08, B6-09, B7-05, B7-11) ----

export function updateWords(
  state: UpdateState,
  viewer: 'content_manager' | 'academic_reviewer' | 'super_admin',
): Words {
  switch (viewer) {
    case 'content_manager':
      switch (state) {
        case 'draft':
          return 'Draft'; // B6-09 f1
        case 'in-academic-review':
          return 'In academic review'; // B6-09 f3
        case 'returned':
          return 'Returned'; // B6-09 f2
        case 'awaiting-release-decision':
          return 'Awaiting release decision'; // B6-09 f5; B6-11 f10
        case 'on-hold':
          return 'On hold'; // B6-09 f6
        case 'released':
          return 'Released'; // B6-09 f7
        case 'withdrawn':
          return 'Withdrawn'; // B6-09 f8
      }
      break;
    case 'academic_reviewer':
      switch (state) {
        case 'in-academic-review':
          return 'Waiting for your decision'; // B6-04 f0
        case 'returned':
          return 'Returned to the Content Manager'; // B6-04 f3
        case 'awaiting-release-decision':
        case 'on-hold':
          return 'Approved — with the Super Admin'; // B6-04 f4; B7-11 f6
        case 'released':
          return 'Update approved — released'; // B6-02 f1
        case 'withdrawn':
          return undrawn('OD-B6-06 (RV-04 "Withdrawn by the Content Manager" is script only)');
        case 'draft':
          return undrawn('B6-04 (a draft never reaches the reviewer)');
      }
      break;
    case 'super_admin':
      switch (state) {
        case 'awaiting-release-decision':
          return 'Waiting for your decision'; // B7-05 f0, f7
        case 'on-hold':
          return 'On hold'; // B7-05 f2, f5
        case 'released':
          return 'Released'; // B7-05 f3, f6
        default:
          return undrawn('B7-10 f4 (the Super Admin never sees an update before approval)');
      }
  }
  return undrawn('AD-24');
}

/** CM-08 "returned" heading (B6-09 f2). */
export const UPDATE_RETURNED_HEADING = 'Returned by the Academic Reviewer';

/** CM-05: a published experiment with an update in progress offers only "Open update" (B6-08 f1). */
export const CORRECTION_ACTIONS = { openUpdate: 'Open update' } as const;

/** CM-05 / SA-13: a published experiment's status (B6-08 f0; B7-11 f4; B7-06 f2). */
export const EXPERIMENT_STATUS = { published: 'Published' } as const;

// ---- DTR — device transfers (B3-07, B3-09, B3-11; Appendix D §5.4) ----

export function transferWords(
  state: DeviceTransferState,
  viewer: 'student' | 'tenant_admin' | 'super_admin',
): Words {
  switch (state) {
    case 'with-institute-admin':
      return viewer === 'student'
        ? 'With your Institute Admin' // B3-07 f4
        : viewer === 'tenant_admin'
          ? 'Waiting on you' // B3-09 f0
          : 'Still with the institution'; // B3-11 f2
    case 'forwarded':
      return viewer === 'super_admin' ? 'Forwarded' : 'Forwarded to BITS'; // B3-11 f0; B3-07 f5; B3-09 f2
    case 'approved':
      return viewer === 'tenant_admin' ? 'Decided · approved by BITS' : 'Approved'; // B3-09 f3; B3-07 f6; B3-11 f5
  }
}

/** The device-transfer actions (B3-09 f5 "Forward to BITS"; B3-11 f4 "Approve transfer"). */
export const TRANSFER_ACTIONS = {
  forward: 'Forward to BITS',
  approve: 'Approve transfer',
} as const;

// ---- SUP — support reports (board 07; B7-09) ----

/** "Open · Resolved · Reopened — identical to the Super Admin side" (board 07 Rules; B7-09 f7–f10). */
export function supportWords(state: SupportState): Words {
  switch (state) {
    case 'open':
      return 'Open';
    case 'resolved':
      return 'Resolved';
    case 'reopened':
      return 'Reopened';
  }
}

// ---- outcome headings the flow steps end on ----

export const FLOW_HEADINGS = {
  selection: 'Your selection', // B1-06 f0 (PU-07)
  requestSent: 'Request sent', // B1-07 f8 (PU-09)
  accessGiven: 'Access given', // B2-05 f3 (IA-05)
  submittedForReview: 'Submitted for academic review', // B5-05 f1 (VE-06)
  noLongerGiven: 'This experiment is no longer given to you', // B2-12 f4 (ST-19)
  nothingGivenNow: 'No experiments are given to you right now', // B2-11 f7, f8 (ST-02)
  earlierWork: 'Earlier work', // B2-11 f7, f8; B3-05 f6
  accountInactive: 'Your account is inactive', // B2-10 f7 (ST-01)
  experimentNotFound: 'We can’t find that experiment', // B6-12 f6 (PU-06 before publication)
} as const;

// ---- screen words from a role's own read model ----
// The decisions a screen makes from what its read returns (which heading, which action), kept
// here so the screens and the WP-0.14 copy check share them.

/** The read model of a format page (ST-08 / ST-09) as far as its words depend on it. */
export interface FormatPageRead {
  readonly progress: {
    readonly status: FormatProgressStatus;
    readonly completion: { readonly completedAt: string } | null;
    readonly feedback: 'not-offered' | 'offered' | { readonly sentAt: string };
  };
  readonly gate:
    | { readonly canOpen: true }
    | { readonly canOpen: false; readonly reason: string; readonly decision?: string };
}

const FORMAT_HEADINGS: Readonly<
  Partial<Record<Technology, Readonly<Record<FormatProgressStatus | 'paused', string>>>>
> = {
  web: {
    'not-started': 'Start the WEB simulation', // B3-03 f1
    'in-progress': 'Continue where you left off', // B3-03 f0
    completed: 'You’ve completed WEB', // B3-03 f3
    paused: 'You can’t open the simulation right now', // B3-03 f5
  },
  vr: {
    'not-started': 'Set up VR', // B3-04 f1
    'in-progress': 'Continue on your headset', // B3-04 f0
    completed: 'You’ve completed VR', // B3-04 f2
    paused: 'You can’t use VR right now', // B3-04 f5
  },
};

/** ST-08 / ST-09: the format's status word, heading and one action, from the format page read. */
export function formatPageWords(
  format: Technology,
  page: FormatPageRead,
): { readonly status: Words; readonly heading: Words; readonly action: Words | null } {
  const paused = !page.gate.canOpen && page.gate.reason === 'institution-paused';
  const status = formatProgressWords({ ...page.progress, paused });
  const headings = FORMAT_HEADINGS[format];
  const heading = headings
    ? headings[paused ? 'paused' : page.progress.status]
    : undrawn(`B3-04 (no ${formatName(format)} heading drawn for this state)`);
  let action: Words | null = null;
  if (!paused && page.progress.status === 'completed') {
    if (page.progress.feedback === 'offered')
      action = FORMAT_WORDS.giveFeedback(format); // B3-03 f3
    else if (typeof page.progress.feedback === 'object') action = FORMAT_WORDS.seeFeedback; // B3-03 f4
  } else if (!paused && page.gate.canOpen && format === 'web') {
    // WEB launches from the portal; VR, AR and MR run on their device (B3-04 f0: no launch button).
    action =
      page.progress.status === 'in-progress'
        ? FORMAT_WORDS.continue(format)
        : FORMAT_WORDS.launch(format);
  }
  return { status, heading, action };
}

/** ST-17: a sent feedback's page heading (B3-06 f3, f4). */
export function feedbackPageHeading(
  format: Technology,
  state: { readonly state: 'not-eligible' | 'eligible' | 'sent' },
): Words {
  return state.state === 'sent' ? FORMAT_WORDS.feedbackSent(format) : undrawn('B3-06 (the form)');
}

/** ST-13 after Submit (B4-12 f4). */
export function attemptPageHeading(attempt: {
  readonly state: 'in-progress' | 'submitted';
}): Words {
  return attempt.state === 'submitted'
    ? ASSESSMENT_HEADINGS.submitted
    : undrawn('B4-12 (the attempt)');
}

/** ST-14's heading from the result read (B4-13 f0–f3; B4-14 f4). */
export function resultPageHeading(result: AttemptResult): Words {
  switch (result.kind) {
    case 'in-progress':
      return 'Not submitted yet'; // B4-14 f4
    case 'waiting-for-marking':
      return ASSESSMENT_HEADINGS.waiting; // B4-13 f1
    case 'not-released-yet':
      return ASSESSMENT_HEADINGS.notReleased; // B4-13 f2
    case 'released':
      return result.passed ? ASSESSMENT_HEADINGS.passed : 'Not passed this time'; // B4-13 f0, f3
  }
}

/** ST-01: the notice in place of the Student's experiments, from their session banners (B2-10). */
export function studentHomeNotice(banners: readonly string[]): Words | null {
  if (banners.includes('account-inactive')) return FLOW_HEADINGS.accountInactive; // B2-10 f7
  if (banners.includes('institution-paused')) return 'You can’t open experiments right now'; // B2-10 f6
  return null;
}

/** ST-02's headings from the Student's course rows (B2-11 f7, f8; B2-13 f2). */
export function myCoursesHeadings(
  courses: readonly { readonly experimentsGiven: number; readonly earlierWork: boolean }[],
): readonly string[] {
  if (courses.some((course) => course.experimentsGiven > 0)) return [];
  if (courses.some((course) => course.earlierWork))
    return [FLOW_HEADINGS.nothingGivenNow, FLOW_HEADINGS.earlierWork];
  return ['Your institution hasn’t given you access yet']; // B2-13 f2
}

/** PU-06 for an experiment that is not published: the not-found heading (B1-05 f4; B6-12 f6). */
export function publicExperimentHeading(
  answer:
    | { readonly ok: true; readonly value: { readonly name: string } }
    | { readonly ok: false; readonly error: { readonly kind: string } },
): Words {
  if (answer.ok) return answer.value.name;
  return answer.error.kind === 'not-found'
    ? FLOW_HEADINGS.experimentNotFound
    : undrawn('B1-05 (only not-found is drawn)');
}

/** IA-19 / SA-19: the one action a device transfer offers its viewer (B3-09 f5; B3-11 f4). */
export function transferActionWords(
  view: { readonly state: DeviceTransferState; readonly forwardingBlocked?: string | null },
  viewer: 'student' | 'tenant_admin' | 'super_admin',
): Words | null {
  if (viewer === 'tenant_admin' && view.state === 'with-institute-admin' && !view.forwardingBlocked)
    return TRANSFER_ACTIONS.forward;
  if (viewer === 'super_admin' && view.state === 'forwarded') return TRANSFER_ACTIONS.approve;
  return null;
}

/** CM-05's correction entries (B6-08 f1, f2, f4): one update at a time, joined while it is a draft. */
export function publishedExperimentActions(page: {
  readonly openUpdate: { readonly state: UpdateState } | null;
}): readonly string[] {
  if (!page.openUpdate)
    return ['Start a correction', 'Edit catalogue details', 'Edit delivery link'];
  if (page.openUpdate.state === 'draft')
    return [CORRECTION_ACTIONS.openUpdate, 'Edit catalogue details', 'Edit delivery link'];
  return [CORRECTION_ACTIONS.openUpdate];
}

/** CM-05 / SA-13: a published experiment's status once it has a live version (B6-08 f0; B7-11 f4). */
export function experimentStatusWords(experiment: {
  readonly live: { readonly label: string } | null;
}): Words {
  return experiment.live ? EXPERIMENT_STATUS.published : undrawn('B6-08 (only published is drawn)');
}

/** IA-01's access line, read from the Institute Admin's own plan (B2-01 f0, f3, f4, f5). */
export function instituteAccessWords(planStatus: AccessPlanStatus): Words {
  switch (planStatus) {
    case 'access-active':
      return 'Access active';
    case 'ending-soon':
      return 'Ending soon';
    case 'paused':
      return 'Access paused';
    case 'access-ended':
      return 'Access ended';
  }
}

/** CM-08's heading for a returned update (B6-09 f2). */
export function updateHeadingWords(update: { readonly state: UpdateState }): Words | null {
  return update.state === 'returned' ? UPDATE_RETURNED_HEADING : null;
}

/** VE-07 / VE-08's heading for a returned record (B5-06 f3, f6). */
export function submissionHeadingWords(submission: {
  readonly status: SubmissionStatus;
}): Words | null {
  return submission.status.state === 'returned' ? returnedByHeading(submission.status.by) : null;
}
