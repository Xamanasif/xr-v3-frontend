/**
 * The method ledger (Appendix F WP-0.10; ADR-0008 decision 1): every product method of the 22
 * ports, with the phase the sample world implements it in, the screens that call it (and so the
 * phase that builds them), its error kinds and refusal codes, the undecided rules it may reach,
 * and the domain checks the adapter runs. Each entry is checked against its port signature at
 * compile time; `ledger.test.ts` checks the counts and the cross-references.
 */
import type { PortInterfaces, PortName } from '../ports/index.js';
import { PORT_KEYS } from '../ports/index.js';
import type { BuildPhase, LedgerEntry } from './entry.js';
import {
  ACCESS_REQUEST_LEDGER,
  CATALOGUE_LEDGER,
  FACULTY_COURSE_LEDGER,
  FEEDBACK_LEDGER,
  GROUP_LEDGER,
  INSTITUTION_COURSE_CODE_LEDGER,
  INSTITUTION_LEDGER,
  LEARNING_LEDGER,
  PEOPLE_LEDGER,
  SELECTION_LEDGER,
  SESSION_LEDGER,
  STUDENT_ACCESS_LEDGER,
} from './methods-a.js';
import {
  ACADEMIC_STRUCTURE_LEDGER,
  ASSESSMENT_LEDGER,
  CORRECTION_LEDGER,
  MARKING_LEDGER,
  OPERATIONS_LEDGER,
  PLATFORM_COURSE_CODE_LEDGER,
  PLATFORM_ROLE_LEDGER,
  PRODUCTION_LEDGER,
  QUESTION_BANK_LEDGER,
  TEACHING_LEDGER,
} from './methods-b.js';
import { firstPhaseOf } from './screens.js';

export const METHOD_LEDGER = {
  SessionService: SESSION_LEDGER,
  CatalogueService: CATALOGUE_LEDGER,
  SelectionService: SELECTION_LEDGER,
  AccessRequestService: ACCESS_REQUEST_LEDGER,
  InstitutionService: INSTITUTION_LEDGER,
  PeopleService: PEOPLE_LEDGER,
  GroupService: GROUP_LEDGER,
  FacultyCourseService: FACULTY_COURSE_LEDGER,
  InstitutionCourseCodeService: INSTITUTION_COURSE_CODE_LEDGER,
  StudentAccessService: STUDENT_ACCESS_LEDGER,
  LearningService: LEARNING_LEDGER,
  FeedbackService: FEEDBACK_LEDGER,
  AssessmentService: ASSESSMENT_LEDGER,
  QuestionBankService: QUESTION_BANK_LEDGER,
  MarkingService: MARKING_LEDGER,
  TeachingService: TEACHING_LEDGER,
  ProductionService: PRODUCTION_LEDGER,
  CorrectionService: CORRECTION_LEDGER,
  AcademicStructureService: ACADEMIC_STRUCTURE_LEDGER,
  PlatformCourseCodeService: PLATFORM_COURSE_CODE_LEDGER,
  PlatformRoleService: PLATFORM_ROLE_LEDGER,
  OperationsService: OPERATIONS_LEDGER,
} as const satisfies {
  readonly [P in PortName]: { readonly [M in keyof PortInterfaces[P]]: LedgerEntry };
};

/** One ledger row, flattened. */
export interface LedgerRow extends LedgerEntry {
  readonly port: PortName;
  readonly portKey: (typeof PORT_KEYS)[PortName];
  readonly method: string;
  /** `Port.method`. */
  readonly id: string;
  /** The phase that builds the first screen calling it (B8-06). */
  readonly screenPhase: BuildPhase;
}

/** Every product method, in Appendix C order. */
export function ledgerRows(): readonly LedgerRow[] {
  return (Object.keys(METHOD_LEDGER) as PortName[]).flatMap((port) =>
    Object.entries(METHOD_LEDGER[port] as Readonly<Record<string, LedgerEntry>>).map(
      ([method, entry]) => ({
        ...entry,
        port,
        portKey: PORT_KEYS[port],
        method,
        id: `${port}.${method}`,
        screenPhase: firstPhaseOf(entry.screens),
      }),
    ),
  );
}

export * from './entry.js';
export * from './screens.js';
