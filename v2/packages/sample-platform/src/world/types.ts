/**
 * The sample world (Appendix F §3.7 `world/`; Appendix D §3.2; ADR-0004): one immutable value
 * holding every shared record (BC14), the deterministic id state, the sample runtime events with
 * their provenance, the command log and the receipts of committed commands. A command never edits
 * a world: it builds the next one (`worldVersion + 1`). A local prototype build keeps it as a
 * versioned browser snapshot (TE-6, Phase 7; `persistence/snapshot.ts`); every other build keeps it
 * in memory (ADR-0004 option A).
 */
import type {
  AccessPlan,
  AccessRequest,
  ActivityReport,
  ActorRef,
  Assessment,
  Attempt,
  AuthorisedDevice,
  CompletionReport,
  CorrectionUpdate,
  Course,
  DeviceTransfer,
  EngineeringArea,
  Experiment,
  FacultyCourseMapping,
  FormatCompletion,
  FormatFeedback,
  Group,
  Institution,
  InstitutionCourseCode,
  IsoInstant,
  Person,
  PlatformRoleHolder,
  ProvidedLicenceWait,
  Question,
  RecordKind,
  RecordRef,
  ResourceOpened,
  RuntimeActivity,
  StudentAccessGrant,
  Submission,
  SubmissionContent,
  SupportReport,
  Technology,
} from '@xr/domain';

import type { IdSourceState } from '../ids/id-source.js';

export const WORLD_SCHEMA = 'xr.sample-world';
export const WORLD_VERSION = 1;

/** Records keyed by their record key, in insertion order (ids are never integer-like). */
export type Table<T> = Readonly<Record<string, T>>;

/**
 * The shared records (Appendix F §4.2), one table per stored shape. Several tables can report
 * under one `RecordKind` (`TABLE_KIND`): supplied licence waits belong to the grants (SACC), the
 * authorised devices to the device-transfer family (DTR, Appendix C M23).
 */
export interface WorldRecords {
  readonly requests: Table<AccessRequest>;
  readonly institutions: Table<Institution>;
  readonly plans: Table<AccessPlan>;
  readonly grants: Table<StudentAccessGrant>;
  readonly waits: Table<ProvidedLicenceWait>;
  readonly people: Table<Person>;
  readonly groups: Table<Group>;
  readonly mappings: Table<FacultyCourseMapping>;
  readonly courseCodes: Table<InstitutionCourseCode>;
  readonly areas: Table<EngineeringArea>;
  readonly courses: Table<Course>;
  readonly experiments: Table<Experiment>;
  readonly submissions: Table<Submission>;
  readonly updates: Table<CorrectionUpdate>;
  readonly activities: Table<RuntimeActivity>;
  readonly completions: Table<FormatCompletion>;
  readonly feedback: Table<FormatFeedback>;
  readonly resourcesOpened: Table<ResourceOpened>;
  readonly assessments: Table<Assessment>;
  readonly attempts: Table<Attempt>;
  readonly questions: Table<Question>;
  readonly transfers: Table<DeviceTransfer>;
  readonly devices: Table<AuthorisedDevice>;
  readonly reports: Table<SupportReport>;
  readonly holders: Table<PlatformRoleHolder>;
}

export type TableName = keyof WorldRecords;

/** The record family of every table (ADR-0008 decision 5: one `RecordKind` union). */
export const TABLE_KIND = {
  requests: 'REQ',
  institutions: 'INST',
  plans: 'ACC',
  grants: 'SACC',
  waits: 'SACC',
  people: 'PER',
  groups: 'GRP',
  mappings: 'FMAP',
  courseCodes: 'CCODE',
  areas: 'AREA',
  courses: 'CRS',
  experiments: 'EXP',
  submissions: 'SUB',
  updates: 'UPD',
  activities: 'RUN',
  completions: 'COMP',
  feedback: 'FB',
  resourcesOpened: 'RES',
  assessments: 'ASMT',
  attempts: 'ATT',
  questions: 'Q',
  transfers: 'DTR',
  devices: 'DTR',
  reports: 'SUP',
  holders: 'ROLE',
} as const satisfies { readonly [T in TableName]: RecordKind };

export const TABLE_NAMES = Object.keys(TABLE_KIND) as readonly TableName[];

/** The record shape a table holds. */
export type RecordOf<T extends TableName> = WorldRecords[T] extends Table<infer R> ? R : never;

/**
 * The people who can sign in without a record of their own (Appendix C M26; AD-29): the Super
 * Admins. Everyone else signs in through a record (PER, the institution's Institute Admin
 * assignment, a platform-role holder). Sample identity only (TE-1, ADR-0003) — never listed by a
 * port or a screen.
 */
export interface SuperAdminIdentity {
  readonly personId: string;
  readonly displayName: string;
  readonly email: string;
}

export interface SampleIdentities {
  readonly superAdmins: readonly SuperAdminIdentity[];
}

/** A supplied "Waiting for a licence" answer the licence oracle gives (T-06 / D7: seeded only). */
export interface SeededLicenceWait {
  readonly planId: string;
  readonly studentId: string;
  readonly experimentId: string;
}

/**
 * A device an institution's lab authorised before the Student's record exists (P3-03; owner
 * authorisation of Phase 7, 17 Oct 2026, local prototype only): it is the Student's authorised
 * device once a Student of `institutionId` holds `institutionEmail`. A seeded fact, not a
 * registration — no product action records one, and the production device policy (registration,
 * provisioning, MDM) stays open (D20b).
 */
export interface SeededAuthorisedDevice {
  readonly institutionId: string;
  readonly institutionEmail: string;
  readonly format: 'ar' | 'vr' | 'mr';
  readonly description: string;
  readonly usedFor: readonly string[];
  readonly since: IsoInstant;
}

/**
 * Facts the seed supplies that no rule may produce (Appendix C §3.18): the licence oracle's
 * answers (D7), formats "Not available right now" (D-26, no designed cause), the landing's
 * featured experiments (P1-22 interim: "Featured experiments are a seeded list"; curated vs
 * derived is OPEN, B1-01 / B1-14), in their drawn order, and — in a local prototype build's
 * starting world only — the pre-authorised devices (P3-03).
 */
export interface SeededFacts {
  readonly licenceWaits: readonly SeededLicenceWait[];
  readonly unavailableRightNow: Readonly<Record<string, readonly Technology[]>>;
  readonly featuredExperiments: readonly string[];
  readonly authorisedDevices?: readonly SeededAuthorisedDevice[];
}

/**
 * Sample provenance of a runtime report (TE-3; invariant 12): `sample-fixture` for the seed
 * walk and CI test hooks, `sample-standin` for the WEB stand-in route (Phase 3, deferred). The
 * production event vocabulary (`RUNTIME_EVENT_TYPES`, `RUNTIME_SOURCES`) is never extended.
 */
export type SampleOrigin = 'sample-fixture' | 'sample-standin';

export interface SampleRuntimeEvent {
  readonly id: string;
  readonly origin: SampleOrigin;
  readonly recordedAt: IsoInstant;
  readonly report:
    | { readonly kind: 'activity'; readonly activity: ActivityReport }
    | { readonly kind: 'completion'; readonly completion: CompletionReport };
}

/** Where a world change came from (the command log's provenance). */
export type ChangeOrigin = 'command' | 'seed' | 'sample-fixture' | 'sample-standin' | 'test-seam';

/** One committed change of the world — the world-level history and provenance. */
export interface WorldHistoryEntry {
  readonly worldVersion: number;
  readonly commandId: string;
  /** `Port.method`, a stand-in method, a test seam or a seed step. */
  readonly method: string;
  readonly origin: ChangeOrigin;
  readonly actor: ActorRef | null;
  readonly at: IsoInstant;
  readonly changed: readonly RecordRef[];
  readonly note: string | null;
}

/** The first receipt of a committed command (`commandId` idempotency; Appendix F §4.5). */
export interface CommandReceipt {
  readonly method: string;
  /** The session the command ran in (a repeated id from another session is a programming error). */
  readonly sessionKey: string;
  readonly worldVersion: number;
  readonly value: unknown;
  readonly changed: readonly RecordRef[];
}

/** "Marked as sample" (T-36) lives here and in no product chrome: the board frame a record reproduces. */
export interface SeedNote {
  readonly evidence: string;
  readonly note: string;
}

export interface World {
  readonly schema: typeof WORLD_SCHEMA;
  readonly version: typeof WORLD_VERSION;
  /** Which builder made it: `spine-start`, `after-flow-a`, `state-coverage` … */
  readonly seedId: string;
  readonly worldVersion: number;
  /** The sample "today" of this world; the sample clock starts here (TE-5, ADR-0007 §1). */
  readonly anchor: IsoInstant;
  /** The real time the sample clock was anchored at, when a real clock drives it; `null` otherwise. */
  readonly seededAtReal: number | null;
  readonly records: WorldRecords;
  readonly identities: SampleIdentities;
  readonly seeded: SeededFacts;
  readonly history: readonly WorldHistoryEntry[];
  readonly idSource: IdSourceState;
  readonly runtimeEvents: readonly SampleRuntimeEvent[];
  readonly processedCommandIds: Readonly<Record<string, CommandReceipt>>;
  readonly seedNotes: Readonly<Record<string, SeedNote>>;
  /**
   * The content each revision of a submission was sent with (index = revision − 1). The domain
   * record keeps only the current content; RV-03 "What changed in revision n" (Appendix C [C],
   * B6-03) compares the two. Storage only: no rule reads it.
   */
  readonly sentContent: Readonly<Record<string, readonly SubmissionContent[]>>;
}

/** The key of a record in the snapshot and in `changed`: `KIND:key`. */
export function refKey(ref: RecordRef): string {
  return `${ref.kind}:${ref.id}`;
}

export const EMPTY_RECORDS: WorldRecords = Object.fromEntries(
  TABLE_NAMES.map((name) => [name, {}]),
) as unknown as WorldRecords;
