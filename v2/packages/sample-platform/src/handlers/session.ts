/**
 * §3.1 SessionService (XS-01, XS-03 … XS-08; M26; ADR-0003). The session keeps only the signed-in
 * person's id; role, institution and banners are re-read from the records on every call. No method
 * lists people or switches identity.
 *
 * Sign-in rule — PROVISIONAL (register P1-01; ADR-0003 §4): the audit interim, a typed sample
 * e-mail plus any non-empty password; an unknown e-mail is "Wrong details" (B1-09 f3). Single
 * sign-on is drawn as a button only (T-10 → `policy-open`); an inactive Faculty member is SES-09.
 */
import {
  type SessionService,
  signInInput,
  type Workspace,
  workspaceInput,
} from '@xr/contracts/draft';
import { type MockSession, type Role, shellBanner, type ShellBanner } from '@xr/domain';

import type { Call, SessionState } from '../platform/core.js';
import { personIdByEmail, type ResolvedPerson, resolvePerson } from '../pipeline/actor.js';
import { type Op, read, refuse, sessionCommand } from '../pipeline/runner.js';

/** ADR-0005 §1: one static base per workspace (`navigation.json` `baseRoute`). */
export const WORKSPACE_BASE: Readonly<Record<Role, string>> = {
  student: '/student',
  faculty: '/faculty',
  tenant_admin: '/institute',
  vendor: '/vendor',
  academic_reviewer: '/reviewer',
  content_manager: '/content-manager',
  super_admin: '/admin',
};

const WORKSPACE_ROLE: Readonly<Record<Workspace, Role>> = {
  student: 'student',
  faculty: 'faculty',
  institute: 'tenant_admin',
  vendor: 'vendor',
  reviewer: 'academic_reviewer',
  'content-manager': 'content_manager',
  admin: 'super_admin',
};

export function mockSessionOf(person: ResolvedPerson, session: SessionState): MockSession {
  return {
    sessionKey: `person:${person.personId}#${session.nonce}`,
    personId: person.personId,
    role: person.role,
    displayName: person.displayName,
    institutionId: person.institutionId,
    organisation: person.organisation,
    signedInAt: session.signedInAt,
    returnTo: session.returnTo,
  };
}

/** XS-08: the banner facts, derived on every read (`shellBanner`). */
export function bannersOf(op: Op, person: ResolvedPerson): readonly ShellBanner[] {
  const institution = person.institutionId
    ? (op.records.institutions[person.institutionId] ?? null)
    : null;
  const banner = shellBanner({
    role: person.role,
    institution,
    accountStatus: person.record?.accountStatus ?? null,
  });
  return banner ? [banner] : [];
}

export function sessionPort(call: Call): SessionService {
  return {
    signIn: (input) =>
      sessionCommand(call, 'SessionService.signIn', (op) => {
        const accepted = op.parse(signInInput, input);
        if (accepted.method === 'sso') refuse({ kind: 'policy-open', decision: 'T-10' });
        const personId = personIdByEmail(op.records, op.world.identities, accepted.email);
        const person = personId ? resolvePerson(op.records, op.world.identities, personId) : null;
        if (!person) refuse({ kind: 'refused', code: 'wrong-details' });
        const institution = person.institutionId
          ? (op.records.institutions[person.institutionId] ?? null)
          : null;
        op.allow(person, 'session.sign-in', {
          kind: 'session',
          accountStatus: person.record?.accountStatus ?? null,
          institution,
        });
        const session: SessionState = {
          personId: person.personId,
          nonce: call.core.nonces.next('session'),
          signedInAt: op.now,
          returnTo: null,
        };
        return {
          value: { session: mockSessionOf(person, session), landing: WORKSPACE_BASE[person.role] },
          decision: 'signIn',
          actor: person.ref,
          after: () => {
            call.context.session = session;
          },
        };
      }),

    getSession: () =>
      read(call, 'SessionService.getSession', (op) => {
        const session = op.liveSession();
        const person = op.sessionPerson();
        if (!session || !person) return null;
        return { session: mockSessionOf(person, session), banners: bannersOf(op, person) };
      }),

    signOut: () =>
      sessionCommand(call, 'SessionService.signOut', (op) => {
        const person = op.sessionPerson();
        if (!person) refuse({ kind: 'not-signed-in' });
        op.allow(person, 'session.sign-out', {
          kind: 'session',
          accountStatus: person.record?.accountStatus ?? null,
          institution: null,
        });
        return {
          value: { signedOut: true as const },
          decision: 'signOut',
          actor: person.ref,
          after: () => {
            call.context.session = null;
          },
        };
      }),

    checkWorkspace: (workspace) =>
      read(call, 'SessionService.checkWorkspace', (op) => {
        const person = op.person();
        const wanted = op.parse(workspaceInput, workspace);
        if (WORKSPACE_ROLE[wanted] !== person.role) {
          refuse({ kind: 'not-permitted', why: 'wrong-workspace' });
        }
        return 'allowed' as const;
      }),
  };
}
