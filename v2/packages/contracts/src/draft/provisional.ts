/**
 * The provisional register of the draft contracts: every field, code or rule the contracts carry
 * that is NOT an owner-approved business requirement — WP-0.9 interim readings, Appendix C
 * proposals adjusted here, and engineering choices of WP-0.10 — each with its status, where it
 * lives in the contract (checked by `provisional.test.ts`), what would be hard to undo, and how to
 * reverse it. Carrying an item here never approves it (WP-0.10 authorisation §5).
 */
import type { RefusalCode, SystemActor } from '@xr/domain';

import type { MessageKey } from './errors/messages.js';
import type { MethodId } from './ports/index.js';

export type ProvisionalStatus =
  /** An interim the owner chose for Phase 0; the underlying question stays open. */
  | 'owner-approved-interim'
  /** A WP-0.9 reading of a rule the boards do not state; reported to the owner, not approved. */
  | 'provisional-reading'
  /** An engineering shape or convention of the contracts; safe to change without design input. */
  | 'provisional-engineering'
  /** An open owner decision the contract represents without deciding. */
  | 'unresolved';

export type Trace =
  | { readonly kind: 'refusal-code'; readonly code: RefusalCode }
  | {
      readonly kind: 'event';
      readonly vocabulary: 'INSTITUTION_EVENTS' | 'ACCESS_PLAN_EVENTS';
      readonly value: string;
    }
  | { readonly kind: 'system-actor'; readonly value: SystemActor }
  | { readonly kind: 'message-key'; readonly key: MessageKey }
  | { readonly kind: 'open-decision'; readonly method: MethodId; readonly decision: string }
  | { readonly kind: 'refusal-of'; readonly method: MethodId; readonly code: RefusalCode }
  | { readonly kind: 'schema-field'; readonly schema: string; readonly path: string };

export interface ProvisionalItem {
  readonly id: string;
  readonly subject: string;
  readonly status: ProvisionalStatus;
  readonly source: string;
  /** Open decisions it touches. */
  readonly decisions: readonly string[];
  readonly trace: readonly Trace[];
  /** A contract assumption that would be hard to undo once an API publishes it; null if none. */
  readonly irreversible: string | null;
  readonly reversal: string;
}

const WHILE_DRAFT =
  'None while the contracts are draft; once an API publishes the contract, removing it is a breaking change.';

export const PROVISIONAL_REGISTER: readonly ProvisionalItem[] = [
  {
    id: 'PC-01',
    subject: 'Six refusal codes added by WP-0.9 to the Appendix C list',
    status: 'provisional-reading',
    source: 'WP-0.9 README "Added for the mock: … the refusal codes"; each cites its board',
    decisions: [],
    trace: [
      { kind: 'refusal-code', code: 'experiment-not-in-plan' },
      { kind: 'refusal-code', code: 'already-given' },
      { kind: 'refusal-code', code: 'group-empty' },
      { kind: 'refusal-code', code: 'route-locked' },
      { kind: 'refusal-code', code: 'already-passed' },
      { kind: 'refusal-code', code: 'no-authorised-device' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Delete the code from `@xr/domain` RefusalCode, its REFUSALS entry and the ledger refusal lists.',
  },
  {
    id: 'PC-02',
    subject:
      'History events added by WP-0.9: institution "licences-requested"; plan "access-given", "access-withdrawn"',
    status: 'provisional-reading',
    source: 'WP-0.9 README "Added for the mock"; Appendix C M01 / M05 list the others',
    decisions: [],
    trace: [
      { kind: 'event', vocabulary: 'INSTITUTION_EVENTS', value: 'licences-requested' },
      { kind: 'event', vocabulary: 'ACCESS_PLAN_EVENTS', value: 'access-given' },
      { kind: 'event', vocabulary: 'ACCESS_PLAN_EVENTS', value: 'access-withdrawn' },
    ],
    irreversible: null,
    reversal:
      'Remove the event from the domain union and the vocabulary list; history words live in copy tables.',
  },
  {
    id: 'PC-03',
    subject:
      'System writers beyond Appendix C §1.3: review-start (AD-14) and objective-marks (DV-2)',
    status: 'owner-approved-interim',
    source:
      'Owner decision AD-14 / P1-04 (12 Oct 2026, ADR-0007 §4); Appendix F §10.2 DV-2 interim',
    decisions: ['P1-04', 'ATT-07'],
    trace: [
      { kind: 'system-actor', value: 'system:review-start' },
      { kind: 'system-actor', value: 'system:objective-marks' },
      { kind: 'schema-field', schema: 'requesterRequestView', path: 'reviewStarted' },
      { kind: 'open-decision', method: 'MarkingService.confirmMarks', decision: 'ATT-07' },
    ],
    irreversible: null,
    reversal:
      'When P1-04 and ATT-07 are decided, replace the seeded facts with the decided writers.',
  },
  {
    id: 'PC-04',
    subject: 'Question draft ownership fields (institutionId, requestedBy) for Q-05 "own drafts"',
    status: 'provisional-reading',
    source: 'WP-0.9 README proposed readings; Appendix C M21 names no owner field',
    decisions: ['Q-05'],
    trace: [
      { kind: 'schema-field', schema: 'questionDraft', path: 'requestedBy' },
      { kind: 'schema-field', schema: 'questionDraft', path: 'institutionId' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Drop the two fields from the domain QuestionDraft and the schema; drafts lose an owner check.',
  },
  {
    id: 'PC-05',
    subject: 'Student import: a course code that names no course is an error',
    status: 'provisional-reading',
    source:
      'WP-0.9 people/decide.ts `checkStudentImport` [PROPOSED — not drawn]; reported to the owner',
    decisions: [],
    trace: [
      { kind: 'schema-field', schema: 'studentImportReport', path: 'problems' },
      { kind: 'message-key', key: 'IA-11.row.courseCode.unknown-course' },
    ],
    irreversible: null,
    reversal:
      'Remove the `unknown-course` rule value and its undrawn key; the import report then files no such row.',
  },
  {
    id: 'PC-06',
    subject: 'A smaller-scope approval may not raise the licences',
    status: 'provisional-reading',
    source: 'WP-0.9 README proposed readings; B1-11 draws no words for it',
    decisions: ['T-07', 'T-08'],
    trace: [{ kind: 'message-key', key: 'SA-03.licences.not-smaller' }],
    irreversible: null,
    reversal: 'Remove the domain issue and its undrawn key; any licence figure is then accepted.',
  },
  {
    id: 'PC-07',
    subject:
      'Result release timing: a result releases at the later of the setting’s moment and the confirmation',
    status: 'provisional-reading',
    source: 'Appendix C M22 [P] `resultReleaseAt`; WP-0.9 README proposed readings',
    decisions: [],
    trace: [
      { kind: 'schema-field', schema: 'attemptResult', path: 'releasedAt' },
      { kind: 'schema-field', schema: 'attemptForMarkingOutput', path: 'releaseLine' },
    ],
    irreversible: null,
    reversal:
      'The contract carries only the derived instant; changing the rule changes the domain, not the contract.',
  },
  {
    id: 'PC-08',
    subject: 'Feedback also needs the open gate (eligibility after the experiment closes)',
    status: 'provisional-reading',
    source: 'WP-0.9 feedback.ts interim of AD-22 (UNRESOLVED)',
    decisions: ['AD-22'],
    trace: [
      { kind: 'refusal-of', method: 'FeedbackService.sendFeedback', code: 'access-ended' },
      { kind: 'open-decision', method: 'FeedbackService.sendFeedback', decision: 'OD-B2-01' },
    ],
    irreversible: null,
    reversal:
      'Remove the open-gate refusals and decisions from sendFeedback’s union and ledger entry.',
  },
  {
    id: 'PC-09',
    subject:
      'The overlap of a withdrawn individual grant and a group grant answers policy-open, not Appendix C’s `overlap-policy-open` refusal',
    status: 'owner-approved-interim',
    source:
      'Appendix F §10.2 DV-1 (reconciled with permissions SACC-15); WP-0.9 `UNDECIDED_OVERLAP_POLICY`',
    decisions: ['OD-B2-01', 'OD-B2-02'],
    trace: [
      { kind: 'open-decision', method: 'StudentAccessService.withdrawGrant', decision: 'OD-B2-01' },
    ],
    irreversible: null,
    reversal:
      'When OD-B2-01 is decided, the OverlapGrantPolicy answers open / closed; no contract shape changes.',
  },
  {
    id: 'PC-10',
    subject:
      'A licence wait is a supplied fact without a stored message; the oracle answers { waiting: true } | null',
    status: 'provisional-engineering',
    source: 'WP-0.9 access/model.ts (Appendix C stores one `message`)',
    decisions: ['D7', 'T-06'],
    trace: [
      { kind: 'schema-field', schema: 'providedLicenceWait', path: 'since' },
      { kind: 'schema-field', schema: 'grantResult', path: 'wait' },
    ],
    irreversible: null,
    reversal: 'Words come from copy per reader; adding a message field is additive.',
  },
  {
    id: 'PC-11',
    subject:
      'Assigning an Institute Admin where one is assigned answers policy-open INST-06 (Appendix C proposed conflict)',
    status: 'unresolved',
    source: 'WP-0.9 institution/decide.ts; matrix INST-06 OPEN',
    decisions: ['INST-06'],
    trace: [
      {
        kind: 'open-decision',
        method: 'InstitutionService.assignInstituteAdmin',
        decision: 'INST-06',
      },
    ],
    irreversible: null,
    reversal:
      'When INST-06 is decided, the method gains the decided behaviour; policy-open leaves its union.',
  },
  {
    id: 'PC-12',
    subject:
      'Plan effect of a renewal or more licences is a value `policy-open OD-B3-09`; Appendix C’s "none-until-payment" is `none` with the request status',
    status: 'unresolved',
    source: 'WP-0.9 request/decide.ts `PlanEffect`; T-07, T-08, OD-B3-09',
    decisions: ['OD-B3-09', 'T-07', 'T-08'],
    trace: [{ kind: 'schema-field', schema: 'planEffect', path: '(union)' }],
    irreversible: null,
    reversal: 'When OD-B3-09 is decided, add the decided effect to the PlanEffect union.',
  },
  {
    id: 'PC-13',
    subject:
      'Pre-rendered words in later-phase read models (attention rows, plan summary, queue sub-line, scope line, library tags, who can act, can act on, release line, institution note)',
    status: 'provisional-engineering',
    source: 'Appendix C [P] shapes; they conflict with §1.5 ("never pre-rendered words")',
    decisions: [],
    trace: [
      { kind: 'schema-field', schema: 'attentionRow', path: 'text' },
      { kind: 'schema-field', schema: 'institutionRow', path: 'planSummary' },
      { kind: 'schema-field', schema: 'reviewQueueItem', path: 'subLine' },
      { kind: 'schema-field', schema: 'reviewerOverviewOutput', path: 'scopeLine' },
      { kind: 'schema-field', schema: 'listHoldersOutput', path: '(array).canActOn' },
      { kind: 'schema-field', schema: 'attemptForMarkingOutput', path: 'releaseLine' },
    ],
    irreversible: null,
    reversal:
      'Replace each with facts plus copy-table words when its screen is built (Phases 1–6).',
  },
  {
    id: 'PC-14',
    subject: 'The public version label is always null while OD-B7-05 is open',
    status: 'unresolved',
    source: 'Appendix C §3.2 [U] OD-B7-05',
    decisions: ['OD-B7-05'],
    trace: [{ kind: 'schema-field', schema: 'publicExperimentPage', path: 'versionLabel' }],
    irreversible: null,
    reversal:
      'If the owner makes the version public, widen the field to string | null (additive for readers).',
  },
  {
    id: 'PC-15',
    subject:
      'A format "Not available right now" has no designed cause: seed-only, and the gate answers policy-open',
    status: 'unresolved',
    source: 'Appendix C M15 [U]; handoff defect §7 D-26, §8-30; B2-12',
    decisions: ['not-designed:format-temporarily-unavailable'],
    trace: [
      { kind: 'schema-field', schema: 'formatAvailability', path: '(enum)' },
      {
        kind: 'open-decision',
        method: 'StudentAccessService.getExperimentHub',
        decision: 'not-designed:format-temporarily-unavailable',
      },
    ],
    irreversible: null,
    reversal:
      'When a cause is designed, give the availability its rule and drop the policy-open answer.',
  },
  {
    id: 'PC-16',
    subject:
      'Uniform error rules: unavailable on every asynchronous method; not-signed-in where a session is needed; not-found where a method looks up a record by an id it is given (a list filter’s unknown id lists nothing; a Faculty member’s unknown experiment is out of scope; a Student’s experiment goes through the open gate, which never says whether an experiment exists)',
    status: 'provisional-engineering',
    source:
      'ADR-0008 decisions 2–3 (X-2; 503 for any port); Appendix D §7.2 read and command failure; Appendix C’s narrower per-method unions',
    decisions: [],
    trace: [],
    irreversible: null,
    reversal:
      'Narrow a method’s union and its ledger entry together (the compile-time check keeps them equal).',
  },
  {
    id: 'PC-17',
    subject:
      'Whole numbers typed as text use the documented expression /^[1-9][0-9]*$/ where some boards coerce with Number()',
    status: 'provisional-engineering',
    source:
      'Appendix C §5.1 / Appendix F §6.4 primitive; B3-08, B4-04, B4-07, B4-09 scripts use Number()',
    decisions: [],
    trace: [
      { kind: 'message-key', key: 'IA-17.licences.whole-number' },
      { kind: 'message-key', key: 'FA-15.marks.whole-number' },
    ],
    irreversible: null,
    reversal:
      'Accept the Number() forms ("60.0", "1e2") if the owner wants them; the drawn words are unchanged.',
  },
  {
    id: 'PC-18',
    subject:
      'Deadlines and release dates arrive as RFC 3339 instants with an offset; the display zone is not decided',
    status: 'provisional-engineering',
    source: 'Appendix C §1.2 [P] (sample times read as Indian local time — owner note only)',
    decisions: [],
    trace: [{ kind: 'schema-field', schema: 'assessmentRulesInput', path: 'deadline' }],
    irreversible: null,
    reversal:
      'The form converts the typed value in the configured zone; the contract shape does not change.',
  },
  {
    id: 'PC-19',
    subject:
      'ProblemDetails `type` URIs are relative to /api/v1/problems; the absolute base is not chosen',
    status: 'provisional-engineering',
    source: 'ADR-0008 decision 3 ("a typed `type` URI"); RFC 9457 §3.1.1',
    decisions: [],
    trace: [],
    irreversible: 'Once an API publishes the type URIs, clients key on them.',
    reversal: 'Choose the absolute base before an API serves the ports.',
  },
  {
    id: 'PC-20',
    subject: 'One assessment per experiment per institution (`assessment-exists`)',
    status: 'provisional-reading',
    source: 'Appendix C M20 [U] OD-B4-01; B4-04',
    decisions: ['OD-B4-01'],
    trace: [
      {
        kind: 'refusal-of',
        method: 'AssessmentService.createAssessment',
        code: 'assessment-exists',
      },
    ],
    irreversible: null,
    reversal: 'Remove the refusal from createAssessment when the owner allows several.',
  },
  {
    id: 'PC-21',
    subject:
      'Field errors instead of Appendix C’s `conflict` for drawn duplicates ("already teaches", an existing member, a duplicate experiment name)',
    status: 'provisional-engineering',
    source:
      'The boards draw these as field messages (B2-09, B2-08, B5-03); WP-0.9 answers them as issues',
    decisions: ['OD-B5-04'],
    trace: [
      { kind: 'message-key', key: 'IA-15.courseId.already-teaches' },
      { kind: 'message-key', key: 'VE-03.name.taken' },
    ],
    irreversible: null,
    reversal:
      'Answer `conflict` instead and keep the key for the form; the ledger keeps the union honest.',
  },
  {
    id: 'PC-22',
    subject: 'The Faculty follow-up "last activity" follows the sample rule of OD-B4-10',
    status: 'provisional-reading',
    source: 'Appendix C M27 FacultyStudentRow (sample, OD-B4-10)',
    decisions: ['OD-B4-10'],
    trace: [{ kind: 'schema-field', schema: 'facultyStudentRow', path: 'lastActivityAt' }],
    irreversible: null,
    reversal: 'Compute it from the decided activity once OD-B4-10 is answered.',
  },
  {
    id: 'PC-23',
    subject:
      'A Student read of earlier work after a withdrawal or the end answers policy-open SACC-14',
    status: 'unresolved',
    source: 'WP-0.9 policy/read.ts `ownLearning`; SACC-11, SACC-14 OPEN',
    decisions: ['SACC-14'],
    trace: [
      {
        kind: 'open-decision',
        method: 'StudentAccessService.getExperimentHub',
        decision: 'SACC-14',
      },
    ],
    irreversible: null,
    reversal:
      'When SACC-14 is decided, the read answers the drawn ST-19 state or the earlier work.',
  },
  {
    id: 'PC-24',
    subject:
      'The moment a resubmission is routed (M-3): the adapter may hold it "resubmitted" or route it at once',
    status: 'unresolved',
    source: 'Appendix C §3.18 [U]; OD-B5-05 / M-3',
    decisions: ['OD-B5-05', 'M-3'],
    trace: [],
    irreversible: null,
    reversal:
      'The WorkflowRoutingPolicy only returns the drawn default; the timing stays the owner’s.',
  },
  {
    id: 'PC-25',
    subject:
      'IA-20 "Students with access" leaves out a Student whose case is undecided — a count, never an access answer',
    status: 'provisional-reading',
    source:
      'WP-0.9 read-models.ts `usage` ("A student whose case is undecided (policy-open) is not counted as able to open")',
    decisions: ['OD-B2-01', 'OD-B3-08'],
    trace: [{ kind: 'schema-field', schema: 'usageRow', path: 'studentsWithAccess' }],
    irreversible: null,
    reversal:
      'When OD-B2-01 is decided the count follows the decided gate; the field is unchanged.',
  },
  {
    id: 'PC-26',
    subject:
      'Undecided gate cases appear in read models as the open decision itself (group-member standing, a format’s availability)',
    status: 'owner-approved-interim',
    source: 'ADR-0008 decision 7; Appendix F §10.2 DV-1; WP-0.9 `groupMemberStanding`',
    decisions: ['OD-B2-01', 'OD-B2-02', 'GRP-05'],
    trace: [
      { kind: 'schema-field', schema: 'memberStanding', path: '(union)' },
      { kind: 'schema-field', schema: 'formatAvailabilityOrOpen', path: '(union)' },
    ],
    irreversible: null,
    reversal:
      'When the decisions are made, the read models answer the decided standing or availability.',
  },
  {
    id: 'PC-27',
    subject:
      'The requester’s request view carries the record revision so "Pay now" can send expectedRev',
    status: 'provisional-engineering',
    source:
      'Appendix C §1.8 (every command on an existing record carries expectedRev) and §3.4 startPayment; Appendix C’s RequesterRequestView has no rev',
    decisions: [],
    trace: [{ kind: 'schema-field', schema: 'requesterRequestView', path: 'rev' }],
    irreversible: WHILE_DRAFT,
    reversal:
      'Drop the field and the expectedRev of startPayment together (a payment start then takes no version check).',
  },
  {
    id: 'PC-28',
    subject:
      'My device carries the open decision OD-B3-01 for a Student holding more than one authorised device, instead of offering the request',
    status: 'unresolved',
    source:
      'WP-0.9 device/device.ts `requestDeviceTransfer` (several devices → policy-open OD-B3-01); Appendix C §3.16 types canRequest as a plain boolean',
    decisions: ['OD-B3-01'],
    trace: [
      { kind: 'schema-field', schema: 'myDeviceOutput', path: 'canRequest' },
      {
        kind: 'open-decision',
        method: 'OperationsService.requestDeviceTransfer',
        decision: 'OD-B3-01',
      },
    ],
    irreversible: null,
    reversal:
      'When OD-B3-01 is decided, canRequest answers the decided boolean and the union narrows.',
  },
];
