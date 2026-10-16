/**
 * Read visibility — the candidate matrix's READ rows (Appendix F §5.1 "READ → read-model
 * visibility"; principle P7 scope model). Pure: who may see which record, given the actor resolved
 * from records. Undecided visibility returns `policy-open` and shows nothing.
 *
 * P7: Student — self only (own grants, runtime, feedback, attempts, transfers, reports).
 * Faculty — Faculty courses ∩ experiments held; reach = students given the experiment.
 * Institute Admin — own institution. Platform roles — their ROLE scope. Super Admin — platform-wide
 * (never Vendor drafts, never Student feedback). Public — published content and own request only.
 */
import type { Refusal } from '../kernel/decision.js';
import type { OpenGate } from '../access/model.js';
import { type AccessFacts, experimentGate } from '../access/gate.js';
import type { ExperimentId, InstitutionId, PersonId } from '../kernel/ids.js';
import type { Assessment, Question } from '../assessment/model.js';
import { assessmentReadiness } from '../assessment/assessment.js';
import type { Experiment } from '../catalogue/model.js';
import type { CorrectionUpdate } from '../correction/correction.js';
import type { DeviceTransfer } from '../device/device.js';
import type { FormatFeedback } from '../feedback/feedback.js';
import type { AccessRequest } from '../request/model.js';
import type { Submission } from '../submission/model.js';
import type { SupportReport } from '../support/support.js';
import { type PlatformRoleHolder, scopeCovers } from '../platform-roles/platform-roles.js';
import type { PolicyContext } from './context.js';

export type ReadTarget =
  | { readonly kind: 'request'; readonly request: AccessRequest }
  | { readonly kind: 'institution'; readonly institutionId: InstitutionId }
  | { readonly kind: 'access-plan'; readonly institutionId: InstitutionId }
  | { readonly kind: 'student-access-list'; readonly institutionId: InstitutionId }
  | { readonly kind: 'groups'; readonly institutionId: InstitutionId }
  | { readonly kind: 'people'; readonly institutionId: InstitutionId }
  | { readonly kind: 'usage'; readonly institutionId: InstitutionId }
  | { readonly kind: 'access-ending' }
  | {
      /** One Student's learning on one experiment; the policy computes the open gate itself. */
      readonly kind: 'student-learning';
      readonly experiment: Experiment;
      readonly access: AccessFacts;
    }
  | { readonly kind: 'feedback'; readonly feedback: FormatFeedback }
  | { readonly kind: 'assessment'; readonly assessment: Assessment }
  | { readonly kind: 'question'; readonly question: Question }
  | {
      readonly kind: 'attempt';
      readonly studentId: PersonId;
      readonly assessment: Assessment;
    }
  | { readonly kind: 'device-transfer'; readonly transfer: DeviceTransfer }
  | {
      readonly kind: 'submission';
      readonly submission: Submission;
      readonly sameOrganisation?: boolean;
    }
  | { readonly kind: 'update'; readonly update: CorrectionUpdate; readonly experiment: Experiment }
  | { readonly kind: 'published-experiment'; readonly experiment: Experiment | null }
  | { readonly kind: 'support-report'; readonly report: SupportReport }
  | { readonly kind: 'scope-line'; readonly holder: PlatformRoleHolder };

export type ReadVerdict =
  { readonly visible: true } | { readonly visible: false; readonly refusal: Refusal };

const SEE: ReadVerdict = { visible: true };
const wrong: ReadVerdict = {
  visible: false,
  refusal: { kind: 'not-permitted', why: 'wrong-workspace' },
};
const outside: ReadVerdict = {
  visible: false,
  refusal: { kind: 'not-permitted', why: 'out-of-scope' },
};
const notOwn: ReadVerdict = {
  visible: false,
  refusal: { kind: 'not-permitted', why: 'not-own-record' },
};
const open = (decision: string): ReadVerdict => ({
  visible: false,
  refusal: { kind: 'policy-open', decision },
});
const gone: ReadVerdict = {
  visible: false,
  refusal: { kind: 'invalid-state', current: 'not-visible-in-this-state' },
};

/**
 * A Student reads only what was given (SACC-12). The drawn read-only states — paused, inactive,
 * waiting for a licence — keep earlier work in view ("rows stay, nothing opens"). After the only
 * grant is withdrawn or access has ended, which pages stay readable is open (SACC-14); undecided
 * overlap and group cases follow the gate's own open decision.
 */
function ownLearning(gate: OpenGate): ReadVerdict {
  if (gate.canOpen) return SEE;
  switch (gate.reason) {
    case 'policy-open':
      return open(gate.decision);
    case 'not-given':
      return { visible: false, refusal: { kind: 'refused', code: 'not-given' } };
    case 'no-longer-given':
    case 'access-ended':
      return open('SACC-14');
    default:
      return SEE;
  }
}

/** May this actor see this record? */
export function canRead(context: PolicyContext, target: ReadTarget): ReadVerdict {
  const actor = context.actor;
  if (actor.kind === 'system') return wrong;
  if (actor.kind === 'public') {
    switch (target.kind) {
      // REQ-04: the status page from the session that sent it; REQ-05 a cold visit is open (T-01).
      case 'request':
        return actor.requestTokens.includes(target.request.statusToken) ? SEE : open('T-01');
      // EXP-01 / EXP-02 / EXP-03 / CRS-09 / LO-04: published content only; unknown → not found.
      case 'published-experiment':
        return target.experiment ? SEE : gone;
      default:
        return wrong;
    }
  }
  const role = actor.ref.role;
  const self = actor.ref.personId;
  const own = (institutionId: InstitutionId) => actor.institutionId === institutionId;
  const teaches = (experimentId: ExperimentId) => actor.taughtExperiments.includes(experimentId);
  const holderCovers = (
    courseId: Submission['content']['courseId'],
    experimentId: ExperimentId | null = null,
  ) => actor.holder !== null && scopeCovers(actor.holder, { courseId, experimentId });

  switch (target.kind) {
    case 'request':
      if (role === 'super_admin') return SEE; // REQ-11
      if (role === 'tenant_admin')
        return target.request.institutionId !== null && own(target.request.institutionId)
          ? SEE
          : outside; // REQ-28
      return wrong;
    case 'institution':
      if (role === 'super_admin') return SEE; // INST-03
      if (role === 'student' || role === 'faculty' || role === 'tenant_admin')
        return own(target.institutionId) ? SEE : outside; // INST-11
      return wrong;
    case 'access-plan':
      if (role === 'super_admin') return SEE; // INST-03
      if (role === 'tenant_admin') return own(target.institutionId) ? SEE : outside; // ACC-04
      return wrong;
    case 'student-access-list':
    case 'groups':
    case 'people':
      if (role === 'tenant_admin') return own(target.institutionId) ? SEE : outside; // SACC-19, GRP-08, PER-18
      if (role === 'super_admin' && target.kind === 'people') return SEE; // INST-03 "people"
      return wrong;
    case 'usage':
      if (role === 'tenant_admin') return own(target.institutionId) ? SEE : outside; // RUN-12
      if (role === 'super_admin') return SEE; // RUN-14 institution report (stakeholder conflict flagged)
      return wrong;
    case 'access-ending':
      return role === 'super_admin' ? SEE : wrong; // ACC-11
    case 'student-learning':
      if (role === 'student') {
        if (target.access.student.id !== self) return notOwn;
        if (!own(target.access.institution.id)) return outside;
        const gate = experimentGate({
          ...target.access,
          experiment: target.experiment,
          now: context.now,
        });
        return ownLearning(gate); // SACC-12, SACC-14, RUN-09
      }
      if (role === 'faculty')
        return own(target.access.institution.id) && teaches(target.experiment.id) ? SEE : outside; // PER-14, RUN-11, SACC-20
      if (role === 'tenant_admin')
        return { visible: false, refusal: { kind: 'not-permitted', why: 'wrong-workspace' } }; // PER-16 DENY
      return wrong;
    case 'feedback':
      // FB-05 own; FB-06 no staff view anywhere.
      return role === 'student' && target.feedback.studentId === self
        ? SEE
        : role === 'student'
          ? notOwn
          : wrong;
    case 'assessment':
      if (role === 'faculty')
        return own(target.assessment.institutionId) && teaches(target.assessment.experimentId)
          ? SEE
          : outside; // ASMT-10, ASMT-13
      if (role === 'student') {
        if (!own(target.assessment.institutionId)) return outside;
        // ASMT-14: a draft is never shown; which Ready ones are listed is `assessmentForStudent`.
        return assessmentReadiness(target.assessment) === 'ready' ? SEE : gone;
      }
      return wrong;
    case 'question':
      if (role !== 'faculty') return wrong; // Q-08, Q-09: never the Student
      if (!own(target.question.institutionId) || !teaches(target.question.experimentId))
        return outside;
      // Q-10 UNRESOLVED: per-person or shared bank on a co-taught course.
      return target.question.addedBy.kind === 'person' && target.question.addedBy.personId !== self
        ? open('OD-B4-17')
        : SEE;
    case 'attempt':
      if (role === 'student') return target.studentId === self ? SEE : notOwn; // ATT-16 (figures: `resultView`)
      if (role === 'faculty')
        return own(target.assessment.institutionId) && teaches(target.assessment.experimentId)
          ? SEE
          : outside; // ATT-18, ATT-23
      return wrong; // ATT-12: no other role marks or reads attempts
    case 'device-transfer':
      if (role === 'student') return target.transfer.studentId === self ? SEE : notOwn; // DTR-15
      if (role === 'tenant_admin') return own(target.transfer.institutionId) ? SEE : outside;
      if (role === 'super_admin') return SEE;
      return wrong;
    case 'submission': {
      const submission = target.submission;
      if (role === 'vendor') {
        if (actor.holder && submission.vendorHolderId === actor.holder.id) return SEE; // SUB-14
        return target.sameOrganisation ? open('SUB-15') : notOwn;
      }
      if (submission.status.state === 'draft') return wrong; // SUB-16: drafts are the Vendor's only
      if (role === 'super_admin') return SEE; // SUB-37
      if (role === 'academic_reviewer' || role === 'content_manager') {
        return holderCovers(submission.content.courseId) ? SEE : outside; // SUB-22, SUB-23, SUB-39, SUB-40
      }
      return wrong;
    }
    case 'update': {
      const state = target.update.state;
      if (role === 'content_manager')
        return holderCovers(target.experiment.courseId, target.experiment.id) ? SEE : outside; // UPD-11
      if (role === 'academic_reviewer') {
        // UPD-16: not before it is sent — nor once withdrawn without ever being sent.
        if (state === 'draft' || (state === 'withdrawn' && target.update.sentForReviewAt === null))
          return gone;
        return holderCovers(target.experiment.courseId, target.experiment.id) ? SEE : outside;
      }
      if (role === 'super_admin') {
        // UPD-18 / UPD-26: nothing before the Academic Reviewer approves it.
        return state === 'awaiting-release-decision' || state === 'on-hold' || state === 'released'
          ? SEE
          : gone;
      }
      return wrong;
    }
    case 'published-experiment':
      if (!target.experiment) return gone;
      if (role === 'faculty') return teaches(target.experiment.id) ? SEE : outside; // EXP-04
      if (role === 'content_manager')
        return holderCovers(target.experiment.courseId, target.experiment.id) ? SEE : outside; // EXP-10
      return SEE; // EXP-03: the live version, for every reader of published content
    case 'support-report':
      if (target.report.reporter.personId === self) return SEE; // SUP-02
      if (role === 'super_admin') return SEE; // SUP-09
      if (
        role === 'tenant_admin' &&
        target.report.reporter.institutionId !== null &&
        own(target.report.reporter.institutionId)
      ) {
        return open('SUP-07'); // IA visibility of their institution's reports is open
      }
      return notOwn;
    case 'scope-line':
      // ROLE-12: own scope line; the Super Admin sees every holder (B7-08).
      if (role === 'super_admin') return SEE;
      return actor.holder && actor.holder.id === target.holder.id ? SEE : notOwn;
  }
}

/**
 * Which course code an audience reads (CC-09; T-17 PROVISIONAL): Students see the institution's
 * code when set, else the platform code; the public and Faculty boards show the platform code
 * (blank allowed: no chip).
 */
export function courseCodeFor(
  audience: 'student' | 'faculty' | 'public',
  platformCode: string | null,
  institutionCode: string | null,
): string | null {
  return audience === 'student' ? (institutionCode ?? platformCode) : platformCode;
}
