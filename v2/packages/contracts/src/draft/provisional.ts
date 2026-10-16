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
      'Pre-rendered words in later-phase read models (attention rows, queue sub-line, scope line, library tags, who can act, release line, institution note); the SA-06 plan summary was replaced by facts in Phase-1 Package 1D (PC-36), SA-16’s “can act on” and SA-01’s attention rows in Phase 6 (PC-70, PC-67)',
    status: 'provisional-engineering',
    source: 'Appendix C [P] shapes; they conflict with §1.5 ("never pre-rendered words")',
    decisions: [],
    trace: [
      { kind: 'schema-field', schema: 'attentionRow', path: 'text' },
      { kind: 'schema-field', schema: 'reviewQueueItem', path: 'subLine' },
      { kind: 'schema-field', schema: 'reviewerOverviewOutput', path: 'scopeLine' },
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
  {
    id: 'PC-29',
    subject:
      'The session names the institution of a Student, Faculty member or Institute Admin (`institutionName`), for the account-menu and sidebar line',
    status: 'provisional-engineering',
    source:
      'Board 06 "Account menu" ("Rahul Verma · Student · Godavari Institute of Technology"); Appendix C M26 gives `organisation` to the Vendor only and no Phase-0 read gives a Student or Faculty member their institution’s name; added in WP-0.13, read from the INST record on every call (display only)',
    decisions: [],
    trace: [{ kind: 'schema-field', schema: 'mockSession', path: 'institutionName' }],
    irreversible: WHILE_DRAFT,
    reversal:
      'Drop the field and read the name from an own-institution read model once one exists; the shell takes the line from there.',
  },
  {
    id: 'PC-30',
    subject:
      'The public course read names the course’s area (`getCourse` → `area: { id, name }`), for PU-05’s eyebrow, breadcrumb and “Back to …” link',
    status: 'provisional-engineering',
    source:
      'B1-03 "PU-05 Course": eyebrow "Course · Mechanical & Manufacturing", crumbs Home / Areas / <area> / <course> and "Back to Mechanical & Manufacturing"; Appendix C §3.2 `getCourse` returns the course card and its experiments only, and the course card carries no area. Added in Phase-1 Package 1B, when the method was built',
    decisions: [],
    trace: [{ kind: 'schema-field', schema: 'getCourseOutput', path: 'area.name' }],
    irreversible: WHILE_DRAFT,
    reversal:
      'Drop the field and add `areaId` to the course card, or let the page read the area through `getArea`.',
  },
  {
    id: 'PC-31',
    subject:
      'An experiment carries a concept-artwork key (`Experiment.artworkKey`, catalogue entry `artworkKey`), seeded from the boards; `null` shows the drawn fallback',
    status: 'provisional-engineering',
    source:
      'B1-04 row "Thumbnail (concept artwork, decorative)" and its 12 rows’ `art`; B1-01 featured cards; B1-05 hero illustration; assets.json "Area and format artwork (19 files) — Approved B2 illustrations, concept only". Appendix C gives artwork to the area only (M06 `artworkKey`). No upload is designed (D3), so an experiment published in the sample period has none. Added in Phase-1 Package 1B',
    decisions: [],
    trace: [
      { kind: 'schema-field', schema: 'catalogueEntry', path: 'artworkKey' },
      { kind: 'schema-field', schema: 'experiment', path: 'artworkKey' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Drop the field; the public pages then show the drawn artwork fallback for every experiment.',
  },
  {
    id: 'PC-32',
    subject:
      'The catalogue search can keep the landing’s featured experiments only (`catalogueQuery.featured`), a seeded list in its drawn order',
    status: 'provisional-reading',
    source:
      'B1-01 "Featured experiments · Start with these experiments" (four experiments); B1-01 change table: "curated vs derived is OPEN"; Appendix G P1-22 (provisional): "Featured experiments are a seeded list". Appendix C §3.2 has no featured read. Added in Phase-1 Package 1B',
    decisions: [],
    trace: [{ kind: 'schema-field', schema: 'catalogueQuery', path: 'featured' }],
    irreversible: WHILE_DRAFT,
    reversal:
      'Drop the parameter once the owner decides P1-22: a curated list gets its own read, a derived one a rule in the catalogue service.',
  },
  {
    id: 'PC-33',
    subject:
      'A request has an opaque public address (`AccessRequest.routeId`) — `/requests/[requestId]` and its payment step — distinct from the reference and from the ticket',
    status: 'owner-approved-interim',
    source:
      'Owner decision DV-5 / O-05 (Package-1C authorisation, 14 Oct 2026): "`/requests/[requestId]` … The request reference alone must never grant access." Appendix A §3.3 "requestId (opaque, never the REQ reference)"; B1-07 / B1-08 "the reference … does not open the page on its own"; Appendix D V-17 / AD-13 "no URL may work as a bearer link" — so the address is not the ticket either. Appendix C gave the status page only the ticket (`statusToken`) as its key. Added in Phase-1 Package 1C (ADR-0009)',
    decisions: ['DV-5', 'O-05', 'T-01', 'R01'],
    trace: [
      { kind: 'schema-field', schema: 'accessRequest', path: 'routeId' },
      { kind: 'schema-field', schema: 'requesterRequestView', path: 'routeId' },
      { kind: 'schema-field', schema: 'submitPublicRequestOutput', path: 'routeId' },
    ],
    irreversible:
      'Once an API publishes `/requests/{routeId}`, links already handed out keep that form; the id itself stays opaque.',
    reversal:
      'If the owner chooses AD-13’s capability-free `/requests/status` instead, drop the field and resolve the request from the session’s ticket alone; the screens keep their markup.',
  },
  {
    id: 'PC-34',
    subject:
      'The ticket never crosses a port: `submitPublicRequest` no longer answers `statusToken`; `getRequestStatus` and `startPayment` name the request by its address and the adapter resolves the caller — the sending browser session by the ticket it holds for the user session that sent the request (ADR-0009), or the requesting institution’s signed-in Institute Admin — and anyone else is `not-found`; the Super Admin’s decision page and receipts carry the request without it (`requestForDecision`)',
    status: 'owner-approved-interim',
    source:
      'Owner decision DV-5 / O-05 (14 Oct 2026): "The submitting browser session, using its authorized session-held ticket; or The authenticated Institute Admin authorized for that institution … enforced by existing service/session rules"; matrix REQ-04 (session), REQ-28 (Institute Admin), REQ-05 (anyone else: the owner’s not-found treatment); B3-08 f6 "Open the payment page" → B1-08. Appendix C took the token as the input of both methods and gave the Institute Admin a second payment input by reference. Changed in Phase-1 Package 1C (ADR-0009)',
    decisions: ['DV-5', 'O-05', 'T-01', 'R01'],
    trace: [
      { kind: 'schema-field', schema: 'startPaymentInput', path: 'request' },
      { kind: 'schema-field', schema: 'decisionPage', path: 'request.routeId' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Put the token back as the input (a bearer key, V-17) only if the owner decides a reference or ticket link may open the page (T-01 / R01).',
  },
  {
    id: 'PC-35',
    subject:
      'The selection remembers where a removed experiment was (`Selection.lastRemovedAt`), so Undo puts it back there; a format change ends the undo',
    status: 'provisional-engineering',
    source:
      'B1-06 script: Remove keeps `undo: { item, index }`, Undo runs `splice(index, 0, item)`, a format change sets `undo: null`. Appendix C M04 keeps `lastRemoved` only, and WP-0.9 put the item back last. Added in Phase-1 Package 1C',
    decisions: [],
    trace: [{ kind: 'schema-field', schema: 'selection', path: 'lastRemovedAt' }],
    irreversible: WHILE_DRAFT,
    reversal:
      'Drop the field; Undo then puts the item back last (a stored selection without it already does).',
  },
  {
    id: 'PC-36',
    subject:
      'The SA-06 row carries facts, not words: its plans (`plans[]` — reference, course and experiment counts), the experiments its first request asked for (`requestedExperimentCount`) and the “Needs one” flag (`needsInstituteAdmin`); `accessEndsOn` is the last end date of its plans; rows come newest institution first; the `access-active` tab also holds the institutions ending soon',
    status: 'provisional-engineering',
    source:
      'B7-02 rows ("ACC-0107 · 1 course · 1 experiment"; "No access plan yet · 1 experiment requested"; "Needs one"; "Ends 7 Oct 2027" / "Ended 15 Oct 2026") and its script (`match`: the "Access active" tab holds active and ending; `noIA`: no Institute Admin while active, ending or paused = matrix INST-04). Appendix C gave the row a pre-rendered `planSummary` (PC-13) and no flag; the board draws no sort control, so the order is an engineering choice (the record created last first). Built in Phase-1 Package 1D',
    decisions: [],
    trace: [
      { kind: 'schema-field', schema: 'institutionRow', path: 'plans.(array).courseCount' },
      { kind: 'schema-field', schema: 'institutionRow', path: 'requestedExperimentCount' },
      { kind: 'schema-field', schema: 'institutionRow', path: 'needsInstituteAdmin' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Put `planSummary` words back (and drop the facts), or let the screen derive the flag from the `no-institute-admin` tab; a sort control, once designed, replaces the fixed order.',
  },
  {
    id: 'PC-37',
    subject:
      'Each student SA-07 lists carries its record revision (`studentList[].rev`), the `expectedRev` “Change status” sends to `overrideStudentStatus`',
    status: 'provisional-engineering',
    source:
      'WP-0.14 / Phase-0 handover owner item "SA-07 student list lacks `rev` for overrideStudentStatus"; owner authorisation of Package 1D §5: "the minimal additive DTO/read-model revision field required by the existing command contract … Take the revision from the actual record". Appendix C’s `InstitutionDetail.people.studentList` names id, name, Student ID and status only. Added in Phase-1 Package 1D',
    decisions: [],
    trace: [
      {
        kind: 'schema-field',
        schema: 'institutionDetail',
        path: 'people.studentList.(array).rev',
      },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Drop the field; an override then needs another read that answers the student record’s revision.',
  },
  {
    id: 'PC-38',
    subject:
      'IA-01 “Needs your attention” carries facts, not words: one item per drawn row kind (`institution-paused`, `plan-ending-soon`, `plan-ended`, `students-waiting-for-a-licence`, `experiment-not-given`, `students-without-access`, `course-without-code`); the status line’s plan is the newest live plan, else the newest; while paused, or once every plan has ended, that item is the only one; device requests and problem reports are not items',
    status: 'provisional-engineering',
    source:
      'B2-01 f0, f3, f4, f5, f7 (“every row opens its page”; at most six rows, BR-138). Appendix C gave `myOverview.attention` the pre-rendered `attentionRow` (PC-13). Device requests wait on DEV-17 (what the Institute Admin’s Requests count names) and problem reports on P2-11 (does an Institute Admin see the institution’s reports); f4 / f5 draw one item. Built in Phase-2 Package 2A',
    decisions: ['P2-11'],
    trace: [
      { kind: 'schema-field', schema: 'myOverview', path: 'attention.(array).(union)' },
      { kind: 'schema-field', schema: 'instituteAttention', path: '(union)' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Put `attentionRow` back (words from the adapter), or add the device-request and problem-report items once DEV-17 and P2-11 are decided.',
  },
  {
    id: 'PC-39',
    subject:
      'The IA-06 row carries the student’s current groups (`groups[]`) and the experiments active grants give them now (`given[]`, formats inherited from the plan item); the list filter gains `notInGroup` for B2-06’s “Not in a group”; the search matches name, student ID or e-mail, ignoring case',
    status: 'provisional-engineering',
    source:
      'B2-06 f0 table (“Course and group”, “Experiments given” with format badges, “Status”) and its filters (Search “Name, student ID or e-mail”, Status, Group with “All groups” / a group / “Not in a group”). Appendix C’s row names the student and the directory status only. Built in Phase-2 Package 2A',
    decisions: [],
    trace: [
      { kind: 'schema-field', schema: 'studentDirectoryRow', path: 'groups' },
      { kind: 'schema-field', schema: 'studentDirectoryRow', path: 'given' },
      { kind: 'schema-field', schema: 'listStudentsInput', path: 'notInGroup' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Drop the fields; the screen then reads each student’s record (`getStudent`) for its groups and grants, and filters “Not in a group” itself.',
  },
  {
    id: 'PC-40',
    subject:
      'People names its courses and IA-07 reads each grant as IA-04 does: `peopleCourse` {id, name, platformCode} on the IA-06 row (`studentDirectoryRow.courses`, the courses the student is filed against), on the IA-08 row (`listFacultyOutput.(array).courses`, the courses taught) and on the record (`getStudentOutput.courses`); `getStudentOutput.grantRows` — every grant that reaches the student (their individual grants in any state, the grants of the groups they are in now) as a `grantRow` (experiment name, course code, formats inherited from the plan item, the grant word, the active group grant it is “Also in”, a supplied wait), with no can / can’t-open statement (OD-B2-01)',
    status: 'provisional-engineering',
    source:
      'B2-06 f0 “Course and group”, f8 “Courses and groups”, f9–f11 and f17 “Experiments given”, f14 “Courses taught”. Appendix C’s `getStudent` answers raw grants only and `listFaculty` course ids only. Built in Phase-2 Package 2A',
    decisions: [],
    trace: [
      { kind: 'schema-field', schema: 'studentDirectoryRow', path: 'courses' },
      { kind: 'schema-field', schema: 'getStudentOutput', path: 'courses' },
      { kind: 'schema-field', schema: 'getStudentOutput', path: 'grantRows' },
      { kind: 'schema-field', schema: 'listFacultyOutput', path: '(array).courses' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Drop the fields; the screens then read the catalogue for course names (published courses only) and `listGrants` filtered to the student.',
  },
  {
    id: 'PC-41',
    subject:
      'The days left in a plan’s term are a read fact on the sample clock (`myOverview.planDaysLeft`, `planStanding.daysLeft`, `accessPlanView.daysLeft`); null once the term has ended',
    status: 'provisional-engineering',
    source:
      'B2-01 f3, B2-02 f3, B2-03 f2 (“15 days left”); the screens have no clock of their own (the sample “today” is the platform’s). Built in Phase-2 Package 2A',
    decisions: [],
    trace: [
      { kind: 'schema-field', schema: 'myOverview', path: 'planDaysLeft' },
      { kind: 'schema-field', schema: 'planStanding', path: 'daysLeft' },
      { kind: 'schema-field', schema: 'accessPlanView', path: 'daysLeft' },
    ],
    irreversible: WHILE_DRAFT,
    reversal: 'Drop the fields and give the screens the platform clock’s today.',
  },
  {
    id: 'PC-42',
    subject:
      'The IA-02 row carries its plans (`plans[]`, each with its status and days left) and one entry per plan item (`experiments[]`: plan, formats, the published formats left out of the plan for that experiment, and the students an active grant of that plan reaches — people, never licences)',
    status: 'provisional-engineering',
    source:
      'B2-02 f0–f5 (one section per plan, a row per experiment with its own “AR is published but not in your plan” and “N students”). Appendix C’s row merges the items and names the left-out formats per course. Built in Phase-2 Package 2A',
    decisions: [],
    trace: [
      { kind: 'schema-field', schema: 'contentAccessRow', path: 'plans' },
      { kind: 'schema-field', schema: 'contentAccessRow', path: 'experiments' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Drop the fields; the screen then reads each plan (`getAccessPlan`) for its standing.',
  },
  {
    id: 'PC-43',
    subject:
      'The IA-03 view carries the institution’s name, the plan’s experiments with their course and per-experiment left-out formats, `givenTo` (each active grant × each student it reaches, with the plan page’s display status) and `grants` (every grant of the plan in any state, naming its target) for the history',
    status: 'provisional-engineering',
    source:
      'B2-03 f0–f4 (“What BITS gave your institution”, “Students you’ve given access”, History). Appendix C’s `AccessPlanView` names the plan, its status and a student count only. Built in Phase-2 Package 2A',
    decisions: [],
    trace: [
      { kind: 'schema-field', schema: 'accessPlanView', path: 'institutionName' },
      { kind: 'schema-field', schema: 'accessPlanView', path: 'experiments' },
      { kind: 'schema-field', schema: 'accessPlanView', path: 'givenTo' },
      { kind: 'schema-field', schema: 'accessPlanView', path: 'grants' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Drop the fields; the screen then reads Student access (`listGrants`) and the catalogue for the same facts.',
  },
  {
    id: 'PC-44',
    subject:
      'IA-05’s preview answers whom each planned grant reaches and how each stands (`plannedGrant.reaches`: the domain’s group-member standing for the grant about to be given; a wait only where one is supplied, never counted; the undecided overlap as `policy-open` OD-B2-01)',
    status: 'provisional-engineering',
    source:
      'B2-05 f2, f5, f11 (step 3 review: each student or group member with “Active”, “Already has it”, “Inactive”, “Waiting for a licence”). Appendix C’s `plannedGrant` names who, the experiment and the formats only. Built in Phase-2 Package 2A',
    decisions: ['D7', 'T-06', 'OD-B2-01'],
    trace: [{ kind: 'schema-field', schema: 'plannedGrant', path: 'reaches' }],
    irreversible: WHILE_DRAFT,
    reversal: 'Drop the field; the review then lists the planned grants without member standings.',
  },
  {
    id: 'PC-45',
    subject:
      'The Student’s experiment row names the gate’s own read-only closure (`myExperimentRow.closure`: the institution’s pause, an inactive account, or a supplied licence wait with its plan), because its formats read with the closure lifted; IA-01’s “not given” item names the experiment’s course (`courseId`) so “Give access” opens IA-05 on it',
    status: 'provisional-engineering',
    source:
      'B3-02 (Arun Kumar, later sample): the hub header “Available to you” beside “No licence is available for you on ACC-0107 right now.” — Phase-0 rows lifted the closures with no word (sample-platform README contract gap); independent review of Package 2A. B2-01 f0 “Give access” → B2-05 on the experiment',
    decisions: ['D7', 'T-06'],
    trace: [
      { kind: 'schema-field', schema: 'myExperimentRow', path: 'closure' },
      { kind: 'schema-field', schema: 'experimentClosure', path: '(union)' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Drop the field; the screens then read the closure from the session banners (pause, inactive) and cannot name a licence wait.',
  },
  {
    id: 'PC-46',
    subject:
      'Groups and the Faculty record name what they show: the IA-13 row carries the experiments the group’s active grants give it now (`listGroupsOutput.(array).given`, formats inherited from the plan item); IA-14 carries each group grant as the page names it (`getGroupOutput.grantRows`: experiment, course code, formats, the grant’s own state on its plan’s term) and member standings only for active grants on live plans while the institution is not paused (no “Can open it” where access is not live); IA-09 names the courses its mappings name (`getFacultyOutput.courses`)',
    status: 'provisional-engineering',
    source:
      'B2-08 f0, f2 (“Experiments given to the group” / “None yet”), f3, f4 (“Experiments given to this group”: Experiment, Formats “From access plan ACC-0107”, Given, Status; member words “Can open it”, “Waiting for a licence”, “Has it individually · SACC-0310”, “Added after the group grant”, “Inactive”); B2-06 f15 (“ME ZG523 · Thermodynamics & Heat Transfer”). Appendix C’s `getGroup` answers raw grants and `getFaculty` course ids only. Built in Phase-2 Package 2B',
    decisions: ['OD-B2-01', 'OD-B2-02', 'GRP-05'],
    trace: [
      { kind: 'schema-field', schema: 'listGroupsOutput', path: '(array).given' },
      { kind: 'schema-field', schema: 'getGroupOutput', path: 'grantRows' },
      { kind: 'schema-field', schema: 'groupGrantRow', path: 'status' },
      { kind: 'schema-field', schema: 'getFacultyOutput', path: 'courses' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Drop the fields; the screens then read Student access (`listGrants`) for the group’s grants and the catalogue for course names, and compute no standing beside a paused or ended plan.',
  },
  {
    id: 'PC-47',
    subject:
      'IA-11 parses the CSV in the service: the first line must name the six template columns (any order, case and spaces ignored; RFC 4180 quoting; a leading BOM dropped), otherwise `IA-11.file.columns`; a file with no student rows is `IA-11.file.no-rows`. Each report problem names the row’s student as the file gives them (`who`) and the values its words need (`params`); the commit answers who was added (`students`). All-or-nothing stays the T-24 interim',
    status: 'provisional-engineering',
    source:
      'B2-07 f5–f10 (template “student_id, full_name, email, programme, course, course_code”; “Rows that need attention”: Row, Student “Imran S. · GIT-2026-0409”, What to fix; result “Added: Rahul Verma, … and Ananya Das.”); Appendix A “product needs a real CSV file input”. T-24 (all-or-nothing vs valid rows only) stays open. Built in Phase-2 Package 2B',
    decisions: ['T-24'],
    trace: [
      { kind: 'schema-field', schema: 'studentImportReport', path: 'problems.(array).who' },
      { kind: 'schema-field', schema: 'studentImportReport', path: 'problems.(array).params' },
      { kind: 'schema-field', schema: 'commitStudentImportOutput', path: 'students' },
      { kind: 'message-key', key: 'IA-11.file.columns' },
      { kind: 'message-key', key: 'IA-11.file.no-rows' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Drop the fields and keys; the screen then parses the file itself for the row names and keeps the file’s names for the result, and an unreadable header becomes one problem per row.',
  },
  {
    id: 'PC-48',
    subject:
      'IA-05’s options answer “Already has it” per chosen experiment: the input names the experiments chosen in step 1 (`giveAccessOptionsInput.experimentIds`) and each student lists the chosen experiments an active individual grant already gives them (`alreadyHas`); `why` is `already-has-it` exactly when that list is not empty — the same experiment-level rule `giveAccess` refuses `already-given` by. The overlap of individual and group grants stays OD-B2-01',
    status: 'provisional-engineering',
    source:
      'B2-05 f1 (“Already has it” beside Rahul for Shell-and-Tube); Package 2A independent review (the course-level check: holding one experiment of a course hid or offered students for another). Built in Phase-2 Package 2B',
    decisions: ['OD-B2-01'],
    trace: [
      { kind: 'schema-field', schema: 'giveAccessOptionsInput', path: 'experimentIds' },
      { kind: 'schema-field', schema: 'giveAccessOptions', path: 'students.(array).alreadyHas' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Drop the field and the input; the screen then reads Student access (`listGrants`) and decides per chosen experiment itself.',
  },
  {
    id: 'PC-49',
    subject:
      'Sample-mode identity safeguard: adding a student or faculty member, importing students and assigning an Institute Admin refuse an e-mail another sample identity already signs in with (a person of any institution, an Institute Admin, a platform-role holder, a Super Admin) or that two import rows share — a field error with no drawn words, never a merge or a silent replacement',
    status: 'unresolved',
    source:
      'Owner authorisation of Phase 2B §5 (Phase 1E and 2A: an e-mail an existing sample identity holds shadowed that sign-in); ADR-0003 sample identity; the sign-in resolver reads People first. Not the final invitation or identity policy (T-11, P1-01). Built in Phase-2 Package 2B',
    decisions: ['T-11', 'P1-01'],
    trace: [
      { kind: 'message-key', key: 'IA-10.institutionEmail.identity-taken' },
      { kind: 'message-key', key: 'IA-11.row.email.identity-taken' },
      { kind: 'message-key', key: 'IA-11.row.email.duplicate-in-file' },
      { kind: 'message-key', key: 'SA-07.workEmail.identity-taken' },
    ],
    irreversible: null,
    reversal:
      'Remove the adapter check and the keys once T-11 decides how one person holds several roles or institutions (invitation, account linking or a shared identity).',
  },
  {
    id: 'PC-50',
    subject:
      'The requester’s view of a request carries the requester’s own message as sent (`requesterRequestView.message`, `null` when none) — IA-17’s request detail shows it as “Message to BITS”',
    status: 'provisional-engineering',
    source:
      'B3-08 f4 “What you asked for” (“Message to BITS · “Sem II has a larger batch than planned.””); Appendix C’s requester view has no message. Built in Phase 3',
    decisions: [],
    trace: [{ kind: 'schema-field', schema: 'requesterRequestView', path: 'message' }],
    irreversible: WHILE_DRAFT,
    reversal: 'Drop the field; IA-17’s detail then shows no “Message to BITS” row.',
  },
  {
    id: 'PC-51',
    subject:
      'FA-01 “Needs your attention” carries facts, not words: `written-answers-to-mark` (per assessment: the waiting submissions and the oldest one), `students-inactive` (per experiment: the Students inactive for 14 days or more — no activity counts, as FA-20’s filter reads OD-B4-10’s sample rule, PC-22) and `access-ended` (per taught experiment no live plan holds); “Coming up” rows carry the assessment’s name; B4-01’s “draft questions need your review” has no item (drafts exist only once FA-16 requests them, T-23)',
    status: 'provisional-engineering',
    source:
      'B4-01 f0, f1, f3 (attention rows with their actions; “Coming up · at most 3”, “No deadlines in the next 30 days”). Appendix C gave `facultyOverviewOutput.attention` the pre-rendered `attentionRow` (PC-13), as IA-01’s before PC-38. Built in Phase 4A',
    decisions: ['OD-B4-10', 'T-23'],
    trace: [
      { kind: 'schema-field', schema: 'facultyOverviewOutput', path: 'attention.(array).(union)' },
      { kind: 'schema-field', schema: 'facultyAttention', path: '(union)' },
      { kind: 'schema-field', schema: 'facultyOverviewOutput', path: 'comingUp.(array).name' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Put `attentionRow` back (words from the adapter) and drop `comingUp.name` (the screen then reads each assessment for its name); add a drafts item once FA-16 and T-23 are decided.',
  },
  {
    id: 'PC-52',
    subject:
      'The Faculty teaching view of an experiment carries the titles of the resources its Students see (`teachingExperimentOutput.resources`), read-only, and the instant its counts were read (`teachingExperimentOutput.asOf`, “Student activity · as of 7 Nov 2026”)',
    status: 'provisional-engineering',
    source:
      'B4-03 f0 “About this experiment · Resources students see: Lab brief — Shell-and-Tube Heat Exchanger · Pre-lab reading — … · Readings sheet” and “Student activity · as of 7 Nov 2026”. Appendix C’s teaching view has the published page only, which carries no resources and no reading instant (the screens have no clock of their own, PC-41). Built in Phase 4A',
    decisions: [],
    trace: [
      { kind: 'schema-field', schema: 'teachingExperimentOutput', path: 'resources' },
      { kind: 'schema-field', schema: 'teachingExperimentOutput', path: 'asOf' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Drop the fields; FA-05 then shows no “Resources students see” line and no “as of” date.',
  },
  {
    id: 'PC-53',
    subject:
      'The assessment read counts the Students with a submission on its current version (`getAssessmentOutput.submittedOnCurrentVersion`): FA-10 warns “This makes a new version” and FA-08 says a change makes one exactly while it is above zero',
    status: 'provisional-engineering',
    source:
      'B4-05 f0 (“1 student has submitted. If you change questions or rules now, that makes a new version”) and B4-06 f1. The domain makes a new version only while the current version has submissions (`changeAssessment` `hasSubmissions`); a count over every version would warn when nothing is versioned. Phase 4A review',
    decisions: [],
    trace: [
      { kind: 'schema-field', schema: 'getAssessmentOutput', path: 'submittedOnCurrentVersion' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Drop the field; the screens then read the attempts (FA-12, Phase 4B) for the current version’s submissions.',
  },
  {
    id: 'PC-54',
    subject:
      'An attempt’s release terms are read from the version it pins (`pinnedRelease`: the option and its date — the deadline, the release date, or none for “immediately after marking”), on the Student’s rows, the result, the submissions list, the marking page and the Student detail',
    status: 'provisional-engineering',
    source:
      'B4-11 f3 “Released after the deadline: 14 Nov 2026, 23:59”, B4-12 f4, B4-13 f1 / f2, B4-06 f7 “Not yet — after the deadline”, B4-09 f2, B4-10 f4. The domain releases a result by the attempt’s own version (`resultView`; P4-06 unresolved). Built in Phase 4B',
    decisions: ['P4-06', 'OD-B4-04'],
    trace: [
      { kind: 'schema-field', schema: 'pinnedRelease', path: 'option' },
      { kind: 'schema-field', schema: 'pinnedRelease', path: 'on' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Drop `pinnedRelease` from the outputs; the screens then word the release rule without its date (and from the current version once P4-06 is answered that way).',
  },
  {
    id: 'PC-55',
    subject:
      'The Student’s assessment reads carry their own attempts and the attempt in progress: `assessmentIntroOutput` gains the experiment, the course code, the question mix, `attempts` (figure-free `resultView` per attempt) and `sheet` (the pinned questions WITHOUT correct answers, explanations or marking guidance, with the saved answers); `getResultOutput` gains the pinned name, attempt number, attempts allowed, submission instant and release terms, and each released `answerReview` the question’s number, type, words, options and the marker’s name',
    status: 'provisional-engineering',
    source:
      'B4-11 f11 … f16 (six key facts, “Attempt 1 in progress · Two of four questions answered”, “You submitted on …”, “Not passed on attempt 1 · 1 attempt left”), B4-12 f0 (the attempt page needs the questions; no Appendix C method returns them to a Student without the key) and B4-13 f0 (“Your answer … Correct answer … Feedback from Dr S. Ranganathan”). Adding a method would change the 183-method contract (ADR-0008); the facts are added to the existing reads instead. Built in Phase 4B',
    decisions: ['OD-B4-08', 'OD-B4-09'],
    trace: [
      { kind: 'schema-field', schema: 'assessmentIntroOutput', path: 'attempts' },
      { kind: 'schema-field', schema: 'assessmentIntroOutput', path: 'sheet' },
      { kind: 'schema-field', schema: 'assessmentIntroOutput', path: 'questionTypes' },
      { kind: 'schema-field', schema: 'sheetQuestion', path: 'options' },
      { kind: 'schema-field', schema: 'getResultOutput', path: 'release' },
      { kind: 'schema-field', schema: 'answerReview', path: 'feedbackBy' },
      { kind: 'schema-field', schema: 'studentAttemptFacts', path: 'pinned' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Drop the fields and add a Student attempt read (`getMyAttempt`) to Appendix C §3.10 — a contract change the owner approves (ADR-0008).',
  },
  {
    id: 'PC-56',
    subject:
      'The Student’s assessment rows carry the course code Students see, the current version’s question count and total marks, and the latest attempt’s facts (`listMyAssessmentsOutput.courseCode` / `questionCount` / `totalMarks` / `latest`)',
    status: 'provisional-engineering',
    source:
      'B4-11 f0 … f4 (“Shell-and-Tube Heat Exchanger · ME ZG523 · Due 14 Nov 2026, 23:59 · 4 questions · no time limit”, “Submitted 5 Nov 2026, 18:52”), f7 / f9 (the hub tab: “4 questions · 16 marks”), f10 (Home “Up next”). Built in Phase 4B',
    decisions: [],
    trace: [
      { kind: 'schema-field', schema: 'listMyAssessmentsOutput', path: '(array).courseCode' },
      { kind: 'schema-field', schema: 'listMyAssessmentsOutput', path: '(array).latest' },
    ],
    irreversible: WHILE_DRAFT,
    reversal: 'Drop the fields; ST-11 then reads each assessment’s intro for them.',
  },
  {
    id: 'PC-57',
    subject:
      'A submissions row carries the attempt’s total marks and pinned release terms (`listSubmissionsOutput.outOf` / `release`) — “11 of 16”, “Not yet — after the deadline”; the CSV export (FA-22) holds the same list with its cells escaped and formula-safe',
    status: 'provisional-engineering',
    source: 'B4-06 f7 … f10. Built in Phase 4B',
    decisions: [],
    trace: [
      { kind: 'schema-field', schema: 'listSubmissionsOutput', path: '(array).outOf' },
      { kind: 'schema-field', schema: 'listSubmissionsOutput', path: '(array).release' },
    ],
    irreversible: WHILE_DRAFT,
    reversal: 'Drop the fields; FA-12 then shows the release rule without its date.',
  },
  {
    id: 'PC-58',
    subject:
      'The marking reads carry the attempt’s pinned numbering (`pinnedNumbering`), the Student, the assessment and experiment names, the attempts allowed and the pinned release terms (`attemptForMarkingOutput`), and per queue row the experiment and the written questions’ numbers (`listQueueOutput`); the written questions are returned as the attempt’s version pins them, not the bank’s newer version',
    status: 'provisional-engineering',
    source:
      'B4-09 f0 (“Question 4 · written answer”, the assessment filter “Heat Exchanger — post-lab · Shell-and-Tube Heat Exchanger”), f1 (“Rahul Verma · ATT-0450 · Submitted … · attempt 1 of 2”, “Marked automatically · Question 1 · 2 of 2”), f2 (“Rahul sees the result after the deadline: 14 Nov 2026, 23:59”). `releaseLine` stays `null` (PC-13 words are the screen’s). Built in Phase 4B',
    decisions: [],
    trace: [
      { kind: 'schema-field', schema: 'attemptForMarkingOutput', path: 'numbering' },
      { kind: 'schema-field', schema: 'attemptForMarkingOutput', path: 'student' },
      { kind: 'schema-field', schema: 'listQueueOutput', path: '(array).writtenNumbers' },
    ],
    irreversible: WHILE_DRAFT,
    reversal: 'Drop the fields; FA-18 / FA-19 then read the assessment and the people for them.',
  },
  {
    id: 'PC-59',
    subject:
      'FA-20 / FA-21: a Student row carries the name and the instant the experiment was first given (`facultyStudentRow.name` / `accessGivenAt`); the list and its CSV take the Progress filter (`listTeachingStudentsInput.progress`, provisional reading of B4-10’s four values); the detail carries the experiment, course code, the assessment and per attempt its confirmed score, total and pinned release terms. A co-teaching colleague’s assessment answers `policy-open` OD-B4-17 in the row and leaves the detail’s attempts empty (narrow protective refusal: ATT-18 “own assessments”, ASMT-17 open)',
    status: 'provisional-reading',
    source:
      'B4-10 f0 (Progress: All · Not started · In progress in a format · Completed a format · Waiting for marking; “None since access was given (12 Oct 2026)”), f3 … f5. Phase 4B authorisation §6 (co-teacher confidentiality). Built in Phase 4B',
    decisions: ['OD-B4-10', 'OD-B4-17'],
    trace: [
      { kind: 'schema-field', schema: 'facultyStudentRow', path: 'name' },
      { kind: 'schema-field', schema: 'facultyStudentRow', path: 'accessGivenAt' },
      { kind: 'schema-field', schema: 'listTeachingStudentsInput', path: 'progress' },
      { kind: 'schema-field', schema: 'studentDetailOutput', path: 'attemptFacts' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Drop the fields and the filter (FA-20 then filters on the screen and its export holds the unfiltered list); remove the `policy-open` row variant once OD-B4-17 is decided.',
  },
  {
    id: 'PC-60',
    subject:
      'Choice-question marks in a local prototype build: on submit, the `system:objective-marks` stand-in of the sample platform awards each single-choice and true-or-false question its full marks when the answer equals the pinned version’s key and 0 otherwise, through `applyObjectiveMarks` (the domain still has no scoring function). Other builds and the tests keep the DV-2 fixture-supplied marks; a choice-only attempt (M22) and several written questions (ATT-17) stay `policy-open`',
    status: 'owner-approved-interim',
    source:
      'Owner answer, 16 Oct 2026 (Phase 4B): “Answer-key stand-in” for P4-01 / DV-2 / AD-38 — B4-09 “choice questions are marked automatically”; Appendix G P4-01 recommendation. Built in Phase 4B',
    decisions: ['P4-01', 'ATT-07', 'M22', 'ATT-17'],
    trace: [{ kind: 'system-actor', value: 'system:objective-marks' }],
    irreversible: null,
    reversal:
      'Set the composition root’s `objectiveMarks` to `supplied-only`: Confirm marks then answers `policy-open` ATT-07 again for attempts with choice questions.',
  },
  {
    id: 'PC-61',
    subject:
      'A question-import report row’s `problem` is the domain’s rule with the cells its drawn words name as URL parameters (`type?value=multi-select`, `correct?value=E&options=A–D`); the screen words it from `FA-17.row.*`. Two file-level keys are added for a file without the template columns or without rows (`FA-17.file.columns`, `FA-17.file.no-rows`, undrawn)',
    status: 'provisional-engineering',
    source:
      'B4-08 f6 (“correct is “E”, but the question has options A–D only.”, “type “multi-select” isn’t available …”); the M21 report row carries the rule only. Built in Phase 4B',
    decisions: ['OD-B4-11', 'T-24'],
    trace: [
      { kind: 'message-key', key: 'FA-17.row.correct' },
      { kind: 'message-key', key: 'FA-17.file.columns' },
      { kind: 'message-key', key: 'FA-17.file.no-rows' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Give the report row a `params` record (Appendix C M21) and keep `problem` the rule alone.',
  },
  {
    id: 'PC-62',
    subject:
      'VE-01 “Needs your action” carries facts, not words: each returned experiment with who returned it, when and the reason, then each draft with its last save; `hasExperiments` tells the first visit (B5-01 f2) from “Nothing needs you” (f1)',
    status: 'provisional-engineering',
    source:
      'B5-01 f0 … f2 (“Returned: Forced Convection” · “Academic Reviewer · 24 Aug 2026 · “…”” · “Revise …”; “Draft to finish: …” · “Last saved … · only you can see it”). Appendix C gave `vendorOverviewOutput.attention` the pre-rendered `attentionRow` (PC-13). Built in Phase 5',
    decisions: ['OD-B5-12'],
    trace: [
      { kind: 'schema-field', schema: 'vendorAttention', path: '(union)' },
      { kind: 'schema-field', schema: 'vendorOverviewOutput', path: 'hasExperiments' },
    ],
    irreversible: WHILE_DRAFT,
    reversal: 'Put `attentionRow` back (words from the adapter) and drop `hasExperiments`.',
  },
  {
    id: 'PC-63',
    subject:
      'RV-01: the scope line is the scope’s course codes (an experiment scope its experiment’s name), `scopeAll` for an everything scope; “Waiting for your decision” is the review queue’s own items, oldest first, each re-check with the Content Manager’s reason',
    status: 'provisional-engineering',
    source:
      'B6-01 f0 (“You review: ME ZG523 · MEL ZG512 · CHE ZG513”; “Re-check: Venturi Meter Calibration” · “Content Manager · 25 Aug 2026 · “…””); OD-B6-01 sample scope. Built in Phase 5',
    decisions: ['OD-B6-01'],
    trace: [
      { kind: 'schema-field', schema: 'reviewerOverviewOutput', path: 'scopeAll' },
      { kind: 'schema-field', schema: 'reviewerOverviewOutput', path: 'waiting.(array).reason' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Give the overview pre-rendered `attentionRow` rows and words for the scope line again.',
  },
  {
    id: 'PC-64',
    subject:
      'CM-01 carries facts, not words: “Needs your decision” — each experiment ready to publish (oldest approval first) and each correction returned to the Content Manager; “With others” — a re-check she sent to the Academic Reviewer, a correction in academic review, awaiting the release decision or on hold',
    status: 'provisional-engineering',
    source:
      'B6-05 f0, f1 (“Ready to publish: Transient Cooling” · “SUB-0074 · ME ZG523 · approved 14 Aug 2026 · oldest of 2”; “Update returned: …”; “With others · For information — nothing to do”). “Awaiting release decision” is not drawn on CM-01 (B6-11 f10 draws the state). Built in Phase 5',
    decisions: ['OD-B6-14'],
    trace: [
      { kind: 'schema-field', schema: 'contentManagerAttention', path: '(union)' },
      { kind: 'schema-field', schema: 'contentManagerWithOthers', path: '(union)' },
    ],
    irreversible: WHILE_DRAFT,
    reversal: 'Put `attentionRow` back (words from the adapter) for both lists.',
  },
  {
    id: 'PC-65',
    subject:
      'CM-04 Content library carries facts, not words: the four tabs’ counts and the chosen tab’s rows — a submission with its record (and the approval a Ready row names) or a published experiment with its course code and its open correction’s state where the reader may see it; the screen words “Where it is”',
    status: 'provisional-engineering',
    source:
      'B6-06 f1, f4 (tabs “Ready 3 · In review 2 · With vendor 1 · Published 12”; “Approved 14 Aug 2026”; “Version 1.0 · live since 2 Jun 2026 · Update returned to you”). Appendix C gave `libraryOutput` pre-rendered `where` and `tag` (PC-13). Built in Phase 5',
    decisions: ['OD-B6-14'],
    trace: [
      { kind: 'schema-field', schema: 'libraryOutput', path: 'counts' },
      { kind: 'schema-field', schema: 'libraryRow', path: '(union)' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Answer the rows with pre-rendered `where` and `tag` again and read each tab’s count separately.',
  },
  {
    id: 'PC-66',
    subject:
      'Resubmission routing in a local prototype build: right after a Vendor resubmits, the `system:workflow-routing` stand-in of the sample platform routes the record by the only drawn route — back to the Academic Reviewer as revision n (`routeResubmission` with the drawn-default routing policy). The Vendor still reads “Submitted” (B5-06 f4) and no copy names the next gate; nothing ever skips the Academic Reviewer. Other builds and the tests keep the M-3 interim (the test-only seam routes it)',
    status: 'owner-approved-interim',
    source:
      'Owner answer, 16 Oct 2026 (Phase 5): “Drawn-default stand-in” for P5-01 / M-3 / OD-B5-05 — B5-08 (“Routed by the approved workflow rule”; on the canvas a control routes it); Appendix C §3.18 (the routing port can only return the drawn default). Built in Phase 5',
    decisions: ['M-3', 'OD-B5-05'],
    trace: [{ kind: 'system-actor', value: 'system:workflow-routing' }],
    irreversible: null,
    reversal:
      'Set the composition root’s `resubmissionRouting` to `seam-only`: a resubmission then waits “Submitted” until the test-only seam routes it.',
  },
  {
    id: 'PC-67',
    subject:
      'SA-01 Overview carries facts, not words: the two figures (active or ending-soon institutions, with the paused and awaiting-payment counts of their line; published experiments) and the eight drawn groups — requests under review, corrections awaiting the release decision, device transfers forwarded to BITS, open and reopened support reports, access ending within 15 days, institutions without an Institute Admin, stuck content, role holders with no active scope — each with its count and first four rows, read from the same records and rules as the list it opens',
    status: 'provisional-engineering',
    source:
      'B7-01 f0 (“15 items waiting across 8 groups”; “4 Active institutions · Access active or ending soon · 1 paused · 1 awaiting payment”; “13 Published experiments”; eight groups, at most four rows each, every row opens where it is handled), f1 (“A group with nothing in it is left out”). Appendix C gave six groups of pre-rendered `attentionRow` rows (PC-13). Built in Phase 6',
    decisions: [],
    trace: [
      { kind: 'schema-field', schema: 'superAdminOverviewOutput', path: 'figures.paused' },
      { kind: 'schema-field', schema: 'superAdminOverviewOutput', path: 'stuckContent.rows' },
      {
        kind: 'schema-field',
        schema: 'superAdminOverviewOutput',
        path: 'holdersWithoutScope.rows',
      },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Answer the groups with pre-rendered `attentionRow` rows again (words from the adapter) and drop the stuck-content and holder groups, or read each list separately on the page.',
  },
  {
    id: 'PC-68',
    subject:
      'SA-22 rows carry the institution’s name and kind beside the domain’s access-ending row (“ACC-0098 · Internal”); soonest end first, ended plans after',
    status: 'provisional-engineering',
    source:
      'B7-09 f4 (“BITS Pilani — Hyderabad Campus · ACC-0098 · Internal”; “As of 23 Oct 2026 · soonest first”). Built in Phase 6',
    decisions: [],
    trace: [
      { kind: 'schema-field', schema: 'accessEndingView', path: 'institutionName' },
      { kind: 'schema-field', schema: 'accessEndingView', path: 'institutionKind' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Answer bare `AccessEndingRow`s; the page then reads the institutions for their names.',
  },
  {
    id: 'PC-69',
    subject:
      'SA-15 “What uses this course” names what the counts count: the institutions whose plans hold its experiments (an ended plan marked ended; the institution’s own code for the course), the Vendors whose scope covers it and the Faculty mapped to it by institution; the course read also carries its area’s name',
    status: 'provisional-engineering',
    source:
      'B7-07 f1, f3 (“BITS Pilani — Hyderabad Campus · Malnad College of Engineering (ended)”; “Godavari Institute of Technology (MEC-523)”; “Meridian Virtual Labs”; “4 Faculty members — BITS Pilani — Hyderabad Campus”; “Dr S. Ranganathan — Godavari”). Built in Phase 6',
    decisions: [],
    trace: [
      { kind: 'schema-field', schema: 'courseUsageDetail', path: 'institutions' },
      { kind: 'schema-field', schema: 'getStructureCourseOutput', path: 'areaName' },
    ],
    irreversible: WHILE_DRAFT,
    reversal: 'Drop `detail` and `areaName`; the page then shows the counts of `courseUsage` only.',
  },
  {
    id: 'PC-70',
    subject:
      'SA-16 / SA-17 “Can act on” is facts: each scope with its status and what it names (a course’s platform code and name, an experiment’s live name, nothing for all experiments); `getHolder` answers the holder with the same scope facts',
    status: 'provisional-engineering',
    source:
      'B7-08 f0, f1, f3, f7, f8 (“ME ZG523, MEL ZG512, CHE ZG513 · 1 scope withdrawn”; “Nothing — no scope yet”; “All experiments”). Appendix C gave the list a pre-rendered `canActOn` (PC-13) and `getHolder` the bare holder. Built in Phase 6',
    decisions: ['ROLE-11'],
    trace: [
      { kind: 'schema-field', schema: 'scopeView', path: 'courseCode' },
      { kind: 'schema-field', schema: 'holderView', path: 'scopes' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Answer `canActOn` words again (and the bare holder from `getHolder`); the page then reads the courses and experiments for the names.',
  },
  {
    id: 'PC-71',
    subject:
      'SA-12 rows carry a published record’s live version and live-since day and its visible open correction’s state; SA-13 carries who can act, the course’s code and name, the visible open correction and, for a stuck record, the withdrawn reviewer scopes over its course',
    status: 'provisional-engineering',
    source:
      'B7-06 f0 (“Published · version 1.2 · live since 3 Jul 2026”; “Update UPD-0005 · approved — waiting for your release decision”), f1 (“Prof. A. Menon’s EEE ZC341 scope was withdrawn on 1 Oct 2026”), f2, f6. Built in Phase 6',
    decisions: [],
    trace: [
      { kind: 'schema-field', schema: 'allContentOutput', path: '(array).openUpdateState' },
      { kind: 'schema-field', schema: 'contentRecordOutput', path: 'withdrawnReviewerScopes' },
    ],
    irreversible: WHILE_DRAFT,
    reversal:
      'Drop the added fields; the pages then read each record’s update and the holders separately.',
  },
  {
    id: 'PC-72',
    subject:
      'A correction comparison row names the package format it compares (“VR · package reference”); null for the other fields',
    status: 'provisional-engineering',
    source:
      'B6-09 / B6-04 / B7-05 script `FIELDS` (“WEB · web link”, “VR · package reference”); a correction may change one package reference per format (UPD-07). Appendix C’s row named the field only. Built in Phase 6',
    decisions: [],
    trace: [{ kind: 'schema-field', schema: 'correctionComparisonRow', path: 'format' }],
    irreversible: WHILE_DRAFT,
    reversal: 'Drop `format`; a page then labels every package row by the field alone.',
  },
];
