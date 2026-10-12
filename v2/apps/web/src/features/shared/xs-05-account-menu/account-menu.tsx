'use client';

import { ROLE_LABEL, type Role } from '@xr/domain';
import { AccountMenu, type AccountMenuItem } from '@xr/ui';

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
   * shown for a platform role, whatever is given (board 06; 13 Q5 open).
   */
  readonly organisation?: string;
}

/**
 * The line under the role in the account menu and under the workspace label in the sidebar
 * (board 06 "Account menu · same pattern in every workspace"): the institution for the
 * institution roles, the vendor's organisation for the Vendor, none for Academic Reviewer,
 * Content Manager and Super Admin. Nothing is invented when the record has none.
 */
export function organisationLine(role: Role, person: ShellPerson): string | undefined {
  return WORKSPACE_NAV[role].organisationLine === 'none' ? undefined : person.organisation;
}

export interface AccountMenuOptions {
  /**
   * The Student holds an AR, VR or MR format (from the sample world). "My device" appears only
   * then, and only once ST-18 is built (board 06 "*"; B3-07 frame 2 "Entry hidden · no AR / VR /
   * MR formats").
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

/** The items in board 06's order: My device* · Help · — · Sign out. No switcher of any kind. */
export function accountMenuItems(role: Role, options: AccountMenuOptions): AccountMenuItem[] {
  const built = options.built ?? BUILT_SCREENS;
  const device =
    role === 'student' && options.deviceEligible === true && built.has(MY_DEVICE.screen);
  return [
    ...(device
      ? [
          {
            kind: 'link',
            label: MY_DEVICE.label,
            href: MY_DEVICE.href,
            icon: MY_DEVICE.icon,
          } as const,
        ]
      : []),
    { kind: 'link', label: 'Help', href: WORKSPACE_NAV[role].help.href, icon: 'help' },
    { kind: 'separator' },
    { kind: 'button', label: 'Sign out', icon: 'signOut', onSelect: options.onSignOut },
  ];
}

export interface WorkspaceAccountMenuProps extends AccountMenuOptions {
  readonly role: Role;
  readonly person: ShellPerson;
}

/**
 * XS-05, the account menu of a workspace shell (boards 05, 06, 12; Appendix E §4.4): "Account
 * menu: <name>, <role>[, <institution or organisation>]", then the person's lines and the items.
 */
export function WorkspaceAccountMenu({ role, person, ...options }: WorkspaceAccountMenuProps) {
  return (
    <AccountMenu
      name={person.name}
      role={ROLE_LABEL[role]}
      organisation={organisationLine(role, person)}
      initials={person.initials}
      items={accountMenuItems(role, options)}
    />
  );
}
