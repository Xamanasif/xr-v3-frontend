/**
 * What an action is asked about: the records a policy check reads, already loaded by the caller
 * (`@xr/domain` loads nothing). One subject kind per screen-level record.
 */
import type { Technology } from '../technology.js';
import type {
  CourseId,
  ExperimentId,
  InstitutionId,
  QuestionDraftId,
  ScopeId,
} from '../kernel/ids.js';
import type { StudentAccessGrant } from '../access/model.js';
import type { AccessFacts } from '../access/gate.js';
import type { Assessment, Attempt, Question, QuestionDraft } from '../assessment/model.js';
import type {
  Course,
  EngineeringArea,
  Experiment,
  InstitutionCourseCode,
} from '../catalogue/model.js';
import type { FormatCompletion } from '../completion/record.js';
import type { CorrectionUpdate } from '../correction/correction.js';
import type { AuthorisedDevice, DeviceTransfer } from '../device/device.js';
import type { FormatFeedback } from '../feedback/feedback.js';
import type { AccessPlan, Institution } from '../institution/model.js';
import type { FacultyCourseMapping, Group, Person, StudentPerson } from '../people/model.js';
import type { PlatformRoleHolder } from '../platform-roles/platform-roles.js';
import type { AccessRequest, Selection } from '../request/model.js';
import type { RuntimeActivity } from '../runtime/activity.js';
import type { Submission } from '../submission/model.js';
import type { SupportReport } from '../support/support.js';

export type Subject =
  | { readonly kind: 'selection'; readonly selection: Selection }
  | {
      readonly kind: 'request';
      readonly request: AccessRequest;
      readonly institution: Institution | null;
    }
  | { readonly kind: 'plan'; readonly plan: AccessPlan; readonly institution: Institution }
  | {
      readonly kind: 'institution';
      readonly institution: Institution;
      readonly plans: readonly AccessPlan[];
      readonly people: readonly Person[];
      readonly groups: readonly Group[];
      readonly mappings: readonly FacultyCourseMapping[];
      readonly coursesInAccess: readonly CourseId[];
    }
  | {
      readonly kind: 'grant';
      readonly grant: StudentAccessGrant;
      readonly institution: Institution;
      readonly plan: AccessPlan;
      readonly student: StudentPerson | null;
    }
  | { readonly kind: 'person'; readonly person: Person; readonly institution: Institution }
  | { readonly kind: 'group'; readonly group: Group; readonly institution: Institution }
  | {
      readonly kind: 'faculty-course';
      readonly mapping: FacultyCourseMapping;
      readonly institution: Institution;
    }
  | {
      readonly kind: 'course-code';
      readonly institution: Institution;
      readonly courseId: CourseId;
      readonly coursesInAccess: readonly CourseId[];
      readonly existing: InstitutionCourseCode | null;
    }
  | {
      readonly kind: 'structure';
      readonly areas: readonly EngineeringArea[];
      readonly courses: readonly Course[];
      /** The course a rename / move / code change is about, with the people filed against it. */
      readonly course: Course | null;
      readonly filed: { readonly students: number; readonly faculty: number };
    }
  | {
      readonly kind: 'experiment';
      readonly experiment: Experiment;
      readonly openUpdate: CorrectionUpdate | null;
    }
  /** A Student's experiment: the policy computes the open gate from `access` itself. */
  | {
      readonly kind: 'learning';
      readonly experiment: Experiment;
      readonly access: AccessFacts;
      readonly webActivity: RuntimeActivity | null;
    }
  | {
      readonly kind: 'feedback';
      readonly experiment: Experiment;
      readonly format: Technology;
      readonly completion: FormatCompletion | null;
      readonly feedback: FormatFeedback | null;
      readonly access: AccessFacts;
    }
  | {
      readonly kind: 'assessment';
      readonly assessment: Assessment | null;
      readonly experimentId: ExperimentId;
      readonly institutionId: InstitutionId;
      readonly hasSubmissions: boolean;
    }
  | {
      readonly kind: 'question-bank';
      readonly experimentId: ExperimentId;
      readonly institutionId: InstitutionId;
      readonly question: Question | null;
      readonly draft: QuestionDraft | null;
      readonly draftId?: QuestionDraftId;
    }
  | {
      readonly kind: 'attempt';
      readonly assessment: Assessment;
      readonly questions: readonly Question[];
      /** The Student's attempts at this assessment. */
      readonly attempts: readonly Attempt[];
      readonly attempt: Attempt | null;
      /** The assessment's experiment, and the Student's access (Student actions only). */
      readonly experiment: Experiment | null;
      readonly access: AccessFacts | null;
    }
  | {
      readonly kind: 'device-transfer';
      readonly institution: Institution;
      readonly transfer: DeviceTransfer | null;
      readonly devices: readonly AuthorisedDevice[];
      readonly openTransfers: readonly DeviceTransfer[];
    }
  | {
      readonly kind: 'submission';
      readonly submission: Submission | null;
      readonly holders: readonly PlatformRoleHolder[];
    }
  | { readonly kind: 'update'; readonly update: CorrectionUpdate; readonly experiment: Experiment }
  | {
      readonly kind: 'role-holder';
      readonly holder: PlatformRoleHolder | null;
      readonly holders: readonly PlatformRoleHolder[];
      readonly scopeId: ScopeId | null;
    }
  | { readonly kind: 'support-report'; readonly report: SupportReport | null }
  | {
      readonly kind: 'session';
      readonly accountStatus: 'active' | 'inactive' | null;
      readonly institution: Institution | null;
    }
  | { readonly kind: 'faculty-students' };

export type SubjectKind = Subject['kind'];
export type SubjectOf<K extends SubjectKind> = Extract<Subject, { kind: K }>;
