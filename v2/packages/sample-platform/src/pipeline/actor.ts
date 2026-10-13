/**
 * Step 2 of the pipeline (Appendix F §4.5): who acts is resolved from the records on every call —
 * the session holds only a person id (ADR-0003 §1). Role, institution, holder scopes and the
 * Faculty teaching scope come from the canonical records, so a role, a scope or an account change
 * applies to the very next call. A caller never passes a role, an institution, a permission or a
 * precomputed gate (Appendix C §3.0 rule 1).
 *
 * One role per person (P0-10): a Student or Faculty member is a PER record, an Institute Admin is
 * the institution's assignment, a Vendor, Academic Reviewer or Content Manager a platform-role
 * holder, a Super Admin a sample identity (no Super Admin record is drawn).
 */
import type {
  ExperimentId,
  InstitutionId,
  PersonActor,
  PersonActorRef,
  PersonId,
  PlatformRoleHolder,
  PublicActor,
  RequestStatusToken,
  Role,
  Person,
} from '@xr/domain';

import {
  holderByPerson,
  institutionOfInstituteAdmin,
  taughtExperiments,
} from '../world/queries.js';
import { values } from '../world/records.js';
import type { SampleIdentities, WorldRecords } from '../world/types.js';

export interface ResolvedPerson {
  readonly personId: PersonId;
  readonly role: Role;
  readonly displayName: string;
  readonly email: string;
  readonly institutionId: InstitutionId | null;
  /** A platform holder's organisation; tenant roles and the Super Admin have none. */
  readonly organisation: string | null;
  readonly holder: PlatformRoleHolder | null;
  /** The PER record of a Student or Faculty member. */
  readonly record: Person | null;
  readonly taughtExperiments: readonly ExperimentId[];
  readonly ref: PersonActorRef;
  /** The policy context's actor (`@xr/domain/policy`). */
  readonly policy: PersonActor;
}

function resolved(base: Omit<ResolvedPerson, 'ref' | 'policy'>): ResolvedPerson {
  const ref: PersonActorRef = {
    kind: 'person',
    personId: base.personId,
    role: base.role,
    displayName: base.displayName,
  };
  return {
    ...base,
    ref,
    policy: {
      kind: 'person',
      ref,
      institutionId: base.institutionId,
      holder: base.holder,
      taughtExperiments: base.taughtExperiments,
    },
  };
}

/** The signed-in person as the records say now, or `null` when the id names nobody. */
export function resolvePerson(
  records: WorldRecords,
  identities: SampleIdentities,
  personId: string,
): ResolvedPerson | null {
  const id = personId as PersonId;
  const record = records.people[personId];
  if (record) {
    return resolved({
      personId: id,
      role: record.kind === 'student' ? 'student' : 'faculty',
      displayName: record.fullName,
      email: record.institutionEmail,
      institutionId: record.institutionId,
      organisation: null,
      holder: null,
      record,
      taughtExperiments: record.kind === 'faculty' ? taughtExperiments(records, record) : [],
    });
  }
  const institution = institutionOfInstituteAdmin(records, personId);
  if (institution?.instituteAdmin) {
    return resolved({
      personId: id,
      role: 'tenant_admin',
      displayName: institution.instituteAdmin.name,
      email: institution.instituteAdmin.workEmail,
      institutionId: institution.id,
      organisation: null,
      holder: null,
      record: null,
      taughtExperiments: [],
    });
  }
  const holder = holderByPerson(records, personId);
  if (holder) {
    return resolved({
      personId: id,
      role: holder.role,
      displayName: holder.name,
      email: holder.workEmail,
      institutionId: null,
      organisation: holder.organisation,
      holder,
      record: null,
      taughtExperiments: [],
    });
  }
  const admin = identities.superAdmins.find((identity) => identity.personId === personId);
  if (admin) {
    return resolved({
      personId: id,
      role: 'super_admin',
      displayName: admin.displayName,
      email: admin.email,
      institutionId: null,
      organisation: null,
      holder: null,
      record: null,
      taughtExperiments: [],
    });
  }
  return null;
}

/** The person whose e-mail this is (sign-in, XS-01), compared trimmed and case-insensitively. */
export function personIdByEmail(
  records: WorldRecords,
  identities: SampleIdentities,
  email: string,
): string | null {
  const wanted = email.trim().toLowerCase();
  const same = (candidate: string) => candidate.trim().toLowerCase() === wanted;
  const person = values(records.people).find((candidate) => same(candidate.institutionEmail));
  if (person) return person.id;
  const institution = values(records.institutions).find(
    (candidate) => candidate.instituteAdmin !== null && same(candidate.instituteAdmin.workEmail),
  );
  if (institution?.instituteAdmin) return institution.instituteAdmin.personId;
  const holder = values(records.holders).find((candidate) => same(candidate.workEmail));
  if (holder) return holder.personId;
  return identities.superAdmins.find((identity) => same(identity.email))?.personId ?? null;
}

/** The public surface's actor: a visitor with the request-status tokens this browser session holds. */
export function publicActor(tokens: readonly RequestStatusToken[]): PublicActor {
  return { kind: 'public', requestTokens: tokens };
}
