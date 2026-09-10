import type { Role } from '@xr/domain';

/**
 * The resolved caller. Identity comes from the identity provider (OIDC); roles and
 * scopes come from PLATFORM records, never from IdP claims alone
 * (docs/ARCHITECTURE.md §9–§10).
 */
export interface RoleGrant {
  readonly role: Role;
  /** `platform` roles may be scoped to a Course or an Experiment (STK31-41). */
  readonly scope: 'all' | { readonly courseId: string } | { readonly experimentId: string };
}

export interface Principal {
  /** Stable subject identifier issued by the identity provider. */
  readonly subject: string;
  readonly personId?: string;
  readonly tenantId?: string;
  readonly roles: readonly RoleGrant[];
}
