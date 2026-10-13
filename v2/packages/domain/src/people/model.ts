/**
 * M12 Person (Student, Faculty), M13 Group + membership, M14 Faculty course mapping (Appendix C §2).
 * Boards: B2-06 … B2-09, B7-03 f8, B1-09 f7, B2-10, B4-10.
 *
 * Programme is free text on the Student record only — never a navigation level, a catalogue
 * grouping or a filter (BC2; CRS-07). Adding a person creates a record only: no invitation,
 * activation or provisioning (T-11; PER-10). Nothing is hard-deleted (PER-09, BR-126).
 */
import type { ActorRef } from '../roles.js';
import type { HistoryEntry } from '../kernel/history.js';
import type {
  CourseId,
  FacultyCourseMappingId,
  GroupId,
  InstitutionId,
  PersonId,
} from '../kernel/ids.js';
import type { TransitionTable } from '../kernel/machine.js';
import type { RecordMeta } from '../kernel/record.js';
import type { IsoInstant } from '../kernel/time.js';

export const ACCOUNT_STATUSES = ['active', 'inactive'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export type PersonEvent =
  | 'added'
  | 'imported'
  | 'deactivated'
  | 'reactivated'
  | 'status-overridden'
  | 'group-joined'
  | 'group-left'
  | 'access-given'
  | 'access-withdrawn'
  | 'course-assigned'
  | 'course-removed';

interface PersonBase extends RecordMeta {
  readonly id: PersonId;
  readonly institutionId: InstitutionId;
  readonly fullName: string;
  /** Unique within People. */
  readonly institutionEmail: string;
  readonly accountStatus: AccountStatus;
  readonly added: {
    readonly at: IsoInstant;
    readonly by: ActorRef;
    readonly how: 'form' | 'import';
    readonly importFileName: string | null;
  };
  readonly history: readonly HistoryEntry<PersonEvent>[];
}

/** 'Students filed against a course' (B7-07 move rule) — from the CSV `course` + `course_code`. */
export interface StudentCourseFiling {
  readonly courseId: CourseId;
  /** As given in the file: 'ME ZG523' or 'MEC-523'. */
  readonly codeAsGiven: string;
  readonly filedAt: IsoInstant;
  readonly source: 'import';
}

export interface StudentPerson extends PersonBase {
  readonly kind: 'student';
  /** 'GIT-2026-0418' — the institution's own ID, data not a key; unique per institution (upper-case). */
  readonly institutionStudentId: string;
  /** Free text on the record only (BC2). */
  readonly programme: string | null;
  readonly courseFilings: readonly StudentCourseFiling[];
  readonly deactivation: {
    readonly at: IsoInstant;
    readonly by: ActorRef;
    readonly reason: string;
  } | null;
}

export interface FacultyPerson extends PersonBase {
  readonly kind: 'faculty';
}

export type Person = StudentPerson | FacultyPerson;

/** IA-06 directory status (B2-06 `LBL`) — derived from grants and the account. */
export const STUDENT_DIRECTORY_STATUSES = ['access-active', 'no-access-yet', 'inactive'] as const;
export type StudentDirectoryStatus = (typeof STUDENT_DIRECTORY_STATUSES)[number];

export type PersonCommand =
  | 'addStudent'
  | 'importStudents'
  | 'addFaculty'
  | 'deactivateStudent'
  | 'reactivateStudent'
  | 'overrideStudentStatus';

/** Appendix C M12. Faculty deactivate / reactivate is not designed (PER-07 OPEN). */
export const PERSON_TRANSITIONS: TransitionTable<AccountStatus, PersonCommand> = [
  { from: null, to: 'active', command: 'addStudent', actors: ['tenant_admin'] },
  { from: null, to: 'active', command: 'importStudents', actors: ['tenant_admin'] },
  { from: null, to: 'active', command: 'addFaculty', actors: ['tenant_admin'] },
  { from: 'active', to: 'inactive', command: 'deactivateStudent', actors: ['tenant_admin'] },
  { from: 'inactive', to: 'active', command: 'reactivateStudent', actors: ['tenant_admin'] },
  { from: 'active', to: 'inactive', command: 'overrideStudentStatus', actors: ['super_admin'] },
  { from: 'inactive', to: 'active', command: 'overrideStudentStatus', actors: ['super_admin'] },
];

export type GroupEvent = 'created' | 'renamed' | 'member-added' | 'member-removed' | 'access-given';

/** Current and past memberships: the record stays when a member is removed. */
export interface GroupMembership {
  readonly studentId: PersonId;
  readonly addedAt: IsoInstant;
  readonly addedBy: ActorRef;
  readonly removedAt: IsoInstant | null;
  readonly removedBy: ActorRef | null;
}

export interface Group extends RecordMeta {
  readonly id: GroupId;
  readonly institutionId: InstitutionId;
  /** 'ME ZG523 — Sem II'. */
  readonly name: string;
  readonly createdAt: IsoInstant;
  readonly createdBy: ActorRef;
  readonly memberships: readonly GroupMembership[];
  readonly history: readonly HistoryEntry<GroupEvent>[];
}

/** IA-14 member words (B2-08 `stText`), derived per member × group grant. */
export const GROUP_MEMBER_STANDINGS = [
  'can-open-it',
  'has-it-individually',
  'waiting-for-a-licence',
  'inactive',
  'added-after-the-group-grant',
] as const;
export type GroupMemberStanding = (typeof GROUP_MEMBER_STANDINGS)[number];

/** FMAP-0021: sets the Faculty workspace scope; gives students nothing (B2-09). */
export interface FacultyCourseMapping extends RecordMeta {
  readonly id: FacultyCourseMappingId;
  readonly institutionId: InstitutionId;
  readonly facultyId: PersonId;
  readonly courseId: CourseId;
  readonly assignedAt: IsoInstant;
  readonly assignedBy: ActorRef;
  readonly removedAt: IsoInstant | null;
  readonly removedBy: ActorRef | null;
}
