/**
 * The tenant scope of a request on the tenant plane. Every tenant-plane repository
 * method requires one; the Super Admin's cross-tenant reads use explicitly named,
 * audited operations instead (docs/ARCHITECTURE.md §7).
 */
export interface TenantContext {
  readonly tenantId: string;
  /** Why this scope was granted — the caller's own tenant, or a Super Admin governance act. */
  readonly basis: 'membership' | 'platform-governance';
}
