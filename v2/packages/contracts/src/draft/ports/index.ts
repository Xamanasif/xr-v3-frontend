/**
 * The 22 product ports (Appendix C §3; ADR-0008 decision 1) and their method names as data, each
 * list checked at compile time against its interface. Ports grow by addition only, each new method
 * with contract-suite cases.
 */
import type { Equals } from '../kernel/typed.js';
import type { AccessRequestService } from './access-request.js';
import type {
  AssessmentService,
  MarkingService,
  QuestionBankService,
  TeachingService,
} from './assessment.js';
import type { CatalogueService } from './catalogue.js';
import type { InstitutionService } from './institution.js';
import type { FeedbackService, LearningService } from './learning.js';
import type { OperationsService } from './operations.js';
import type {
  FacultyCourseService,
  GroupService,
  InstitutionCourseCodeService,
  PeopleService,
} from './people.js';
import type { CorrectionService, ProductionService } from './production.js';
import type { SelectionService } from './selection.js';
import type { SessionService } from './session.js';
import type { StudentAccessService } from './student-access.js';
import type {
  AcademicStructureService,
  PlatformCourseCodeService,
  PlatformRoleService,
} from './structure.js';

/** The port interfaces by their Appendix C names. */
export interface PortInterfaces {
  SessionService: SessionService;
  CatalogueService: CatalogueService;
  SelectionService: SelectionService;
  AccessRequestService: AccessRequestService;
  InstitutionService: InstitutionService;
  PeopleService: PeopleService;
  GroupService: GroupService;
  FacultyCourseService: FacultyCourseService;
  InstitutionCourseCodeService: InstitutionCourseCodeService;
  StudentAccessService: StudentAccessService;
  LearningService: LearningService;
  FeedbackService: FeedbackService;
  AssessmentService: AssessmentService;
  QuestionBankService: QuestionBankService;
  MarkingService: MarkingService;
  TeachingService: TeachingService;
  ProductionService: ProductionService;
  CorrectionService: CorrectionService;
  AcademicStructureService: AcademicStructureService;
  PlatformCourseCodeService: PlatformCourseCodeService;
  PlatformRoleService: PlatformRoleService;
  OperationsService: OperationsService;
}

export type PortName = keyof PortInterfaces;

/** How an adapter exposes the ports (`ports.session.signIn(…)`). */
export interface ProductPorts {
  readonly session: SessionService;
  readonly catalogue: CatalogueService;
  readonly selection: SelectionService;
  readonly accessRequests: AccessRequestService;
  readonly institutions: InstitutionService;
  readonly people: PeopleService;
  readonly groups: GroupService;
  readonly facultyCourses: FacultyCourseService;
  readonly institutionCourseCodes: InstitutionCourseCodeService;
  readonly studentAccess: StudentAccessService;
  readonly learning: LearningService;
  readonly feedback: FeedbackService;
  readonly assessments: AssessmentService;
  readonly questionBank: QuestionBankService;
  readonly marking: MarkingService;
  readonly teaching: TeachingService;
  readonly production: ProductionService;
  readonly corrections: CorrectionService;
  readonly academicStructure: AcademicStructureService;
  readonly platformCourseCodes: PlatformCourseCodeService;
  readonly platformRoles: PlatformRoleService;
  readonly operations: OperationsService;
}

export type PortKey = keyof ProductPorts;

/** Where each port lives on `ProductPorts`. */
export const PORT_KEYS = {
  SessionService: 'session',
  CatalogueService: 'catalogue',
  SelectionService: 'selection',
  AccessRequestService: 'accessRequests',
  InstitutionService: 'institutions',
  PeopleService: 'people',
  GroupService: 'groups',
  FacultyCourseService: 'facultyCourses',
  InstitutionCourseCodeService: 'institutionCourseCodes',
  StudentAccessService: 'studentAccess',
  LearningService: 'learning',
  FeedbackService: 'feedback',
  AssessmentService: 'assessments',
  QuestionBankService: 'questionBank',
  MarkingService: 'marking',
  TeachingService: 'teaching',
  ProductionService: 'production',
  CorrectionService: 'corrections',
  AcademicStructureService: 'academicStructure',
  PlatformCourseCodeService: 'platformCourseCodes',
  PlatformRoleService: 'platformRoles',
  OperationsService: 'operations',
} as const satisfies { readonly [P in PortName]: PortKey };

type PortKeysAreExact = Equals<(typeof PORT_KEYS)[PortName], PortKey>;
const portKeysAreExact: PortKeysAreExact = true;
void portKeysAreExact;

type SamePortAt<P extends PortName> = Equals<
  ProductPorts[(typeof PORT_KEYS)[P]],
  PortInterfaces[P]
>;
type EveryPortAtItsKey = Equals<{ [P in PortName]: SamePortAt<P> }[PortName], true>;
const everyPortAtItsKey: EveryPortAtItsKey = true;
void everyPortAtItsKey;

/** The product ports in Appendix C order (§3.1 … §3.16). */
export const PORT_NAMES = Object.keys(PORT_KEYS) as readonly PortName[];

export type MethodName<P extends PortName> = Extract<keyof PortInterfaces[P], string>;

/** A port method's stable id: `AccessRequestService.approveRequest`. */
export type MethodId = { [P in PortName]: `${P}.${MethodName<P>}` }[PortName];

export * from './access-request.js';
export * from './assessment.js';
export * from './catalogue.js';
export * from './common.js';
export * from './institution.js';
export * from './learning.js';
export * from './operations.js';
export * from './people.js';
export * from './production.js';
export * from './selection.js';
export * from './session.js';
export * from './shared.js';
export * from './student-access.js';
export * from './structure.js';
