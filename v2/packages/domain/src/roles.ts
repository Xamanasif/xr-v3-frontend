/**
 * The seven formal roles — and no eighth (STK31-01, STK31-02, STK31-03; PM-07).
 *
 * - Student and Learner are ONE role in two contexts (B2B institutional · B2C individual).
 * - Institute Admin and Tenant Admin are ONE role; the product-facing label is pending (ND-01).
 * - Internal BITS / WILP content teams operate through the Vendor role.
 *
 * Source: ui-ux/17-stakeholder-correction-blueprint/04_FINAL_ROLE_AND_AUTHORITY_MODEL.md
 */
export const PLATFORM_ROLES = [
  'student',
  'faculty',
  'tenant_admin',
  'vendor',
  'academic_reviewer',
  'content_manager',
  'super_admin',
] as const;

export type Role = (typeof PLATFORM_ROLES)[number];

/** Which plane a role acts on. The Super Admin spans both (FRD 1.3.5, PM-13). */
export type RolePlane = 'tenant' | 'platform' | 'both';

export const ROLE_PLANE: Readonly<Record<Role, RolePlane>> = {
  student: 'tenant',
  faculty: 'tenant',
  tenant_admin: 'tenant',
  vendor: 'platform',
  academic_reviewer: 'platform',
  content_manager: 'platform',
  super_admin: 'both',
};

/** Planning labels. Final UI copy is a Design V2 / ND-01 matter, not a rule. */
export const ROLE_PLANNING_LABEL: Readonly<Record<Role, string>> = {
  student: 'Student / Learner',
  faculty: 'Faculty',
  tenant_admin: 'Institute Admin / Tenant Admin',
  vendor: 'Vendor',
  academic_reviewer: 'Academic Reviewer',
  content_manager: 'Content Manager',
  super_admin: 'Super Admin',
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (PLATFORM_ROLES as readonly string[]).includes(value);
}
