'use client';

import { ROLE_LABEL, type Role } from '@xr/domain';
import { AccountMenuInV46Shell, type AccountMenuLink } from '@xr/ui/v3';

import { ACCOUNT_MENU } from '@/copy/xs';
import { BUILT_SCREENS } from '@/nav/built-screens';
import { MY_DEVICE, WORKSPACE_NAV } from '@/nav/nav-config';
import type { ScreenKey } from '@/nav/screens';

/**
 * The signed-in person as the shell shows them. Names come from the sample world through the
 * session (ADR-0003; WP-0.12), never from defaults (Appendix E §4.4).
 */
export interface ShellPerson {
  /** The person's id: the rail preference is kept per person (`@/nav/rail-preference`). */
  readonly id: string;
  /** "Meera Iyer". */
  readonly name: string;
  /** The avatar initials as the boards draw them ("MI"); decorative. */
  readonly initials: string;
  /**
   * The person's institution (Student, Faculty, Institute Admin) or organisation (Vendor). Not
   * shown for a platform role, whatever is given (board 06; XS-05 contract).
   */
  readonly organisation?: string;
}

/**
 * The line under the role in the account menu and under the workspace label in the sidebar
 * (board 06; the XS-05 contract's `org`): the institution for the institution roles, the
 * vendor's organisation for the Vendor, none for Academic Reviewer, Content Manager and Super
 * Admin. Nothing is invented when the record has none.
 */
export function organisationLine(role: Role, person: ShellPerson): string | undefined {
  return WORKSPACE_NAV[role].organisationLine === 'none' ? undefined : person.organisation;
}

export interface AccountMenuOptions {
  /**
   * The Student holds an AR, VR or MR format — given now, or an open transfer request (the
   * workspace frame reads it: `features/student/st-18-my-device/device-entry.ts`, state-copy
   * `ST-18.offered`). "My device" appears only then, and only once ST-18 is built (XS-05 contract
   * `device`: a link, never an authorisation; B3-07 f2 "Entry hidden · no AR / VR / MR formats").
   */
  readonly deviceEligible?: boolean;
  /** The built screens (default: the manifest). */
  readonly built?: ReadonlySet<ScreenKey>;
  /**
   * Sign out, injected by the caller: ending the session and clearing the query cache belong to
   * the session layer (ADR-0003 §6; WP-0.12, WP-0.13). This menu only calls it.
   */
  readonly onSignOut: () => void;
}

/**
 * The menu's links in the XS-05 contract's order — My device (a Student with AR, VR or MR access
 * only), Help & support — before Sign out in the panel's foot. No switcher, "view as", settings or
 * profile of any kind.
 */
export function accountMenuLinks(role: Role, options: AccountMenuOptions): AccountMenuLink[] {
  const built = options.built ?? BUILT_SCREENS;
  const device =
    role === 'student' && options.deviceEligible === true && built.has(MY_DEVICE.screen);
  return [
    ...(device ? [{ label: MY_DEVICE.label, href: MY_DEVICE.href, icon: 'headset' } as const] : []),
    { label: ACCOUNT_MENU.help, href: WORKSPACE_NAV[role].help.href, icon: 'help' },
  ];
}

export interface WorkspaceAccountMenuProps extends AccountMenuOptions {
  readonly role: Role;
  readonly person: ShellPerson;
}

/**
 * XS-05, the account menu of a workspace shell, in the owner-approved Entry & shared design
 * (design/v3-refined-b/roles/XS-v6, `XsAccountMenu`): "Account menu, <name>, <role>[,
 * <institution or organisation>]", then the panel — avatar, name, role, organisation line — with
 * the links and Sign out. The role's own shell keeps its v46 account button until the role moves
 * to the V3 shell; the panel is the XS one in every workspace.
 */
export function WorkspaceAccountMenu({ role, person, ...options }: WorkspaceAccountMenuProps) {
  return (
    <AccountMenuInV46Shell
      name={person.name}
      role={ROLE_LABEL[role]}
      organisation={organisationLine(role, person)}
      initials={person.initials}
      links={accountMenuLinks(role, options)}
      signOut={{ label: ACCOUNT_MENU.signOut, onSelect: options.onSignOut }}
    />
  );
}
