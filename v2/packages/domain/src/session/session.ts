/**
 * M26 Mock session and identity (Appendix C §2; ADR-0003; matrix SES-*). The session stores the
 * person id only; role, institution and organisation are re-resolved from records on every call.
 * One role per person, no switcher, no "Viewing as", no sample-account chooser — in the product or
 * any developer surface (SES-04, SES-10, ROLE-13). Real authentication is out of scope (BC10).
 */
import type { Role } from '../roles.js';
import type { InstitutionId, PersonId } from '../kernel/ids.js';
import type { IsoInstant } from '../kernel/time.js';
import type { Institution } from '../institution/model.js';

export interface MockSession {
  /** Query-cache partition. */
  readonly sessionKey: string;
  /** The only thing the session stores. */
  readonly personId: PersonId;
  readonly role: Role;
  readonly displayName: string;
  readonly institutionId: InstitutionId | null;
  /**
   * The institution's name as its INST record carries it now (tenant roles), for the line under
   * the role in the account menu and the sidebar (board 06 "Account menu": "Godavari Institute of
   * Technology"). Display only; never a permission. Added in WP-0.13 (no other Phase-0 read gives
   * a Student or a Faculty member their institution's name).
   */
  readonly institutionName: string | null;
  readonly organisation: string | null;
  readonly signedInAt: IsoInstant;
  /** 'Sign in again to go back to where you were …'. */
  readonly returnTo: string | null;
}

/** XS-08 — derived on every read (board 05; Appendix C M26). */
export const SHELL_BANNERS = ['institution-paused', 'account-inactive'] as const;
export type ShellBanner = (typeof SHELL_BANNERS)[number];

/**
 * The shell banner facts (`banner facts`, WP-0.9): "Your institution’s access is paused — your
 * work is kept" for a paused institution's Institute Admin, Faculty and Students (INST-11;
 * Faculty see the banner only, OD-B7-07); "Your account is inactive …" for an inactive Student
 * (PER-13). Platform roles have no institution banner.
 */
export function shellBanner(input: {
  readonly role: Role;
  readonly institution: Institution | null;
  readonly accountStatus: 'active' | 'inactive' | null;
}): ShellBanner | null {
  if (input.role === 'student' && input.accountStatus === 'inactive') return 'account-inactive';
  const tenant =
    input.role === 'student' || input.role === 'faculty' || input.role === 'tenant_admin';
  return tenant && input.institution?.pause ? 'institution-paused' : null;
}

/**
 * Who may sign in (SES-01, SES-07, SES-08): everyone lands on their own role home; a Student,
 * Faculty member or Institute Admin of a paused institution signs in with the banner; an inactive
 * Student signs in and nothing opens. An inactive Faculty member is not drawn (SES-09 OPEN).
 */
export function signInOutcome(input: {
  readonly role: Role;
  readonly accountStatus: 'active' | 'inactive' | null;
  readonly institution: Institution | null;
}):
  | { readonly kind: 'signed-in'; readonly banner: ShellBanner | null }
  | { readonly kind: 'policy-open'; readonly decision: 'SES-09' } {
  if (input.role === 'faculty' && input.accountStatus === 'inactive')
    return { kind: 'policy-open', decision: 'SES-09' };
  return { kind: 'signed-in', banner: shellBanner(input) };
}
