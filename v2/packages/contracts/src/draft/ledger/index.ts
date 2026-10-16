/**
 * The method ledger (Appendix F WP-0.10; ADR-0008 decision 1): every product method of the 22
 * ports, with the phase the sample world implements it in, the screens that call it (and so the
 * phase that builds them), its error kinds and refusal codes, the undecided rules it may reach,
 * and the domain checks the adapter runs. Each entry is checked against its port signature at
 * compile time; `ledger.test.ts` checks the counts and the cross-references.
 */
import type { MethodId, PortInterfaces, PortName } from '../ports/index.js';
import { PORT_KEYS } from '../ports/index.js';
import type { BuildPhase, ImplementationPhase, LedgerEntry } from './entry.js';
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

/**
 * Owner-approved departures from the Appendix F §4.1 phase schedule. Appendix F is frozen audit
 * evidence and is never edited; the ledger records each departure here, and `ledger.test.ts`
 * checks the ledger against Appendix F §4.1 plus these entries — nothing else may move.
 */
export interface PhaseScheduleException {
  readonly method: string;
  readonly from: ImplementationPhase;
  readonly to: ImplementationPhase;
  readonly decision: string;
  readonly scope: string;
}

export const PHASE_SCHEDULE_EXCEPTIONS: readonly PhaseScheduleException[] = [
  {
    method: 'ProductionService.listAllContent',
    from: 'P6',
    to: 'WP-0.11',
    decision:
      'Owner decision E-alt3 (WP-0.11 authorisation §2, 13 Oct 2026): implement listAllContent during WP-0.11 solely so the Super Admin stuck-submission workflow (E-alt3) can reach the seeded stuck record; discharges obligation WP-0.10/E-alt3-reach.',
    scope:
      'The existing WP-0.10 signature, the current domain policy (canRead SUB-37 for submissions, EXP-03 for published experiments, UPD-18 / UPD-26 for the open correction it names) and the Super Admin read-only permission; no new permission, no Phase-6 screen, no other deferred Phase-6 method.',
  },
];

/**
 * Later-phase methods an owner-authorised Phase-1 package has built ahead of the rest of their
 * phase. Their ledger row keeps its phase (`mock`), so the Appendix F §4.1 schedule and its counts
 * stay as they are; an adapter that implements them says so (contract subject `delivered`), and
 * the sample platform answers them instead of rejecting. Each package lists exactly the methods
 * its authorisation names — nothing else of the phase moves.
 */
export interface PackageDelivery {
  readonly method: MethodId;
  readonly phase: ImplementationPhase;
  readonly package: string;
  readonly authorisation: string;
}

export const PACKAGE_DELIVERIES: readonly PackageDelivery[] = [
  ...(
    [
      'CatalogueService.listAreas',
      'CatalogueService.getArea',
      'CatalogueService.getCourse',
    ] as const
  ).map((method) => ({
    method,
    phase: 'P1' as const,
    package: 'Phase-1 Package 1B',
    authorisation:
      'Owner authorisation of Package 1B (14 Oct 2026, §5): "Implement only the three newly required Phase-1 mock-service methods: listAreas, getArea, getCourse" — PU-01…PU-06 and PU-14 on the browser-only sample world (TE-8). InstitutionService.listInstitutions (P1, SA-06) stays deferred (Package 1D).',
  })),
  {
    method: 'InstitutionService.listInstitutions',
    phase: 'P1',
    package: 'Phase-1 Package 1D',
    authorisation:
      'Owner authorisation of Package 1D (15 Oct 2026, §4): "Implement the deferred Phase-1 method: listInstitutions" — SA-06 Institutions on the shared sample world. OperationsService.getSuperAdminOverview stays in Phase 6: SA-01 is built with its Phase-1 Requests section only (§2, SA-01 scope).',
  },
  ...(
    [
      'InstitutionService.getMyOverview',
      'PeopleService.listStudents',
      'PeopleService.listFaculty',
      'GroupService.listGroups',
    ] as const
  ).map((method) => ({
    method,
    phase: 'P2' as const,
    package: 'Phase-2 Package 2A',
    authorisation:
      'Owner authorisation of Phase 2A (15 Oct 2026, §6): "Implement only those Phase-2 deferred service methods needed by the selected screens" — IA-01 Overview (getMyOverview), IA-06 Students and its group filter (listStudents, listGroups), IA-08 Faculty (listFaculty). previewStudentImport, getFaculty, getGroup, FacultyCourseService.list and InstitutionCourseCodeService.list stay deferred with IA-09, IA-11, IA-13 … IA-16 (Phase 2B).',
  })),
  ...(
    [
      'PeopleService.previewStudentImport',
      'PeopleService.getFaculty',
      'GroupService.getGroup',
      'FacultyCourseService.list',
      'InstitutionCourseCodeService.list',
    ] as const
  ).map((method) => ({
    method,
    phase: 'P2' as const,
    package: 'Phase-2 Package 2B',
    authorisation:
      'Owner authorisation of Phase 2B (15 Oct 2026, §2–3): "Implement exactly the remaining designed Phase-2 screen IDs" — IA-11 Import students (previewStudentImport: the CSV parsed by the service), IA-09 Faculty record (getFaculty), IA-14 Group (getGroup), IA-15 Faculty courses (FacultyCourseService.list), IA-16 Course codes (InstitutionCourseCodeService.list). With them every Phase-2 method is implemented.',
  })),
  {
    method: 'LearningService.getSimulationChooser',
    phase: 'P3',
    package: 'Phase 3',
    authorisation:
      'Owner authorisation of Phase 3 (15 Oct 2026, §2 and §6): "Implement exactly the 15 designed Phase-3 screen IDs … Implement only Phase-3 service methods" — ST-07 Simulation, choose a format (getSimulationChooser: one progress view per published format). With it every Phase-3 method is implemented; nothing of Phases 4–6 moves.',
  },
  ...(
    [
      'TeachingService.getFacultyOverview',
      'TeachingService.listMyCourses',
      'TeachingService.getTeachingExperiment',
      'AssessmentService.listAssessments',
      'AssessmentService.getCreateOptions',
      'AssessmentService.previewAsStudent',
    ] as const
  ).map((method) => ({
    method,
    phase: 'P4' as const,
    package: 'Phase 4A',
    authorisation:
      'Owner authorisation of Phase 4A (16 Oct 2026, §2 and §6): "Implement only deferred Phase-4 service methods required for these 13 screens" (FA-01 … FA-11, FA-14, FA-15) — FA-01 Overview (getFacultyOverview: attention as facts, PC-51), FA-02 / FA-03 / FA-04 My courses, Course and Experiments (listMyCourses with getTeachingExperiment), FA-05 Experiment (getTeachingExperiment), FA-06 Assessments (listAssessments), FA-07 Create assessment (getCreateOptions), FA-11 Preview (previewAsStudent: the pinned question versions; creates no attempt). The FA-12, FA-16, FA-17 and FA-22 methods (exportSubmissionsCsv, requestDrafts, listDrafts, addDraftToBank, discardDraft, previewQuestionImport, commitQuestionImport, exportStudentsCsv) stay deferred: no draft exists until FA-16 requests one (T-23).',
  })),
  ...(
    [
      'AssessmentService.exportSubmissionsCsv',
      'TeachingService.exportStudentsCsv',
      'QuestionBankService.requestDrafts',
      'QuestionBankService.listDrafts',
      'QuestionBankService.addDraftToBank',
      'QuestionBankService.discardDraft',
      'QuestionBankService.previewQuestionImport',
      'QuestionBankService.commitQuestionImport',
    ] as const
  ).map((method) => ({
    method,
    phase: 'P4' as const,
    package: 'Phase 4B',
    authorisation:
      'Owner authorisation of Phase 4B (16 Oct 2026, §2 and §5): "Implement all 12 remaining designed Phase-4 screen IDs" — FA-12 / FA-20 Export CSV (FA-22: exportSubmissionsCsv, exportStudentsCsv — the list on screen only, escaped, formula-safe), FA-16 Draft with assistance (requestDrafts, listDrafts, addDraftToBank, discardDraft — a deterministic sample stand-in, no provider; drafts never enter the bank on their own), FA-17 Import questions (previewQuestionImport, commitQuestionImport — the CSV template, all or nothing, T-24 interim). With them every Phase-4 method is implemented.',
  })),
];

/** The methods `PACKAGE_DELIVERIES` names. */
export const DELIVERED_METHODS: readonly MethodId[] = PACKAGE_DELIVERIES.map(
  (delivery) => delivery.method,
);

export * from './entry.js';
export * from './screens.js';
