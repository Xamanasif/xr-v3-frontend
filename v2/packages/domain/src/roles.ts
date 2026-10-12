/**
 * The seven authenticated roles — and no eighth (STK31-01, STK31-02, STK31-03; PM-07;
 * v46 owner binding constraint BC1). PUBLIC is a surface, not a role.
 *
 * - The role ids are stable internal identifiers. The id `tenant_admin` is kept; its
 *   display name is "Institute Admin" (docs/OPEN_DECISIONS.md A-20, annotated with the
 *   v46 position and not resolved).
 * - Internal BITS / WILP content teams operate through the Vendor role.
 * - One role per signed-in person (v46: choosing between several roles is not designed).
 *
 * Source: ui-ux/17-stakeholder-correction-blueprint/04_FINAL_ROLE_AND_AUTHORITY_MODEL.md;
 * display names: design/handoff-v46 board B8-03 (frozen canvas v46).
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

/**
 * Role display names as the frozen v46 boards draw them (B8-03). The only role words
 * that may reach product copy. Labels are copy: changing one never changes a role id.
 */
export const ROLE_LABEL: Readonly<Record<Role, string>> = {
  student: 'Student',
  faculty: 'Faculty',
  tenant_admin: 'Institute Admin',
  vendor: 'Vendor',
  academic_reviewer: 'Academic Reviewer',
  content_manager: 'Content Manager',
  super_admin: 'Super Admin',
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (PLATFORM_ROLES as readonly string[]).includes(value);
}
