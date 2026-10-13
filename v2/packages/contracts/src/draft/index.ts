/**
 * `@xr/contracts/draft` — the DRAFT service contracts of the v46 frontend (Appendix F §3.6;
 * ADR-0008): the 22 product ports and their DTO schemas, the `Result` / `ServiceError` model, the
 * copy catalogue keys, the refusal registry, the future ProblemDetails mapping (a definition only),
 * the method ledger and the provisional register.
 *
 * Draft means: not in `WIRE_CONTRACTS`, not published as OpenAPI, served by no endpoint. Input
 * schemas are ACCEPTED forms (they trim and parse); a representable wire twin is made when an API
 * serves them (ADR-0008 removal trigger). The contract suite (`./draft/contract-suite`) and the
 * stand-in ports (`./draft/standins`) are separate subpaths and are never re-exported from here.
 */
export * from './kernel/typed.js';
export * from './kernel/primitives.js';

export * from './records/institution.js';
export * from './records/request.js';
export * from './records/catalogue.js';
export * from './records/people.js';
export * from './records/access.js';
export * from './records/learning.js';
export * from './records/submission.js';
export * from './records/assessment.js';
export * from './records/operations.js';

export * from './errors/service-error.js';
export * from './errors/messages.js';
export * from './errors/refusals.js';
export * from './errors/field-errors.js';
export * from './errors/domain-issues.js';
export * from './errors/problem.js';

export * from './ports/index.js';
export * from './ledger/index.js';
export * from './provisional.js';

/**
 * Domain types the port signatures name, re-exported so a screen imports its contract from one
 * place (screens may import only types from `./draft`, Appendix F §3.8).
 */
export type {
  AccessPlan,
  AccessRequest,
  Assessment,
  Attempt,
  AttemptResult,
  AuthorisedDevice,
  Course,
  CorrectionUpdate,
  DeviceTransfer,
  EngineeringArea,
  Experiment,
  FacultyCourseMapping,
  FacultyPerson,
  FormatCompletion,
  FormatFeedback,
  FormatProgressView,
  Group,
  Institution,
  InstitutionCourseCode,
  MockSession,
  OpenGate,
  OpenRefusal,
  PlanEffect,
  PlatformRoleHolder,
  Question,
  QuestionDraft,
  RecordRef,
  RefusalCode,
  Selection,
  StudentAccessGrant,
  StudentPerson,
  Submission,
  SupportReport,
} from '@xr/domain';
