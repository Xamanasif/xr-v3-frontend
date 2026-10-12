import type { Specimen } from '../types';
import { ROLE_FIXTURES, type RoleSlug } from './role-shell-fixtures';
import { RoleShellSpecimen } from './role-shells';

/**
 * WP-0.8: the seven role shells (boards 05, 06, 08, 12). `c-role-<role>` is Phase 0 (only Help is
 * built; the Help page, Help current); `c-role-<role>-built` has every destination built (board
 * 06's list, the first destination current); `c-role-student-not-your-workspace` is XS-06 in the
 * Student's own shell (board 08: nothing current).
 */
export const ROLE_SHELL_SPECIMENS: Readonly<Record<string, Specimen>> = {
  ...Object.fromEntries(
    (Object.keys(ROLE_FIXTURES) as RoleSlug[]).flatMap((slug) => {
      const workspace = ROLE_FIXTURES[slug].workspace;
      return [
        [
          `c-role-${slug}`,
          {
            title: `${workspace} shell, Phase 0: only Help & support is built`,
            source: `05 "05 · GL-01 Workspace Shell"; 06 "The seven sidebars · full width (≥ 1280 px)" (${workspace}); 07 "State 2a · My reports · empty · Vendor"`,
            render: () => <RoleShellSpecimen slug={slug} built={false} page="help" />,
          },
        ],
        [
          `c-role-${slug}-built`,
          {
            title: `${workspace} shell with every destination built (board 06 order and counts)`,
            source: `06 "The seven sidebars · full width (≥ 1280 px)", "Collapsed rail and mobile drawer", "Account menu · same pattern in every workspace" (${workspace})`,
            render: () => <RoleShellSpecimen slug={slug} built page="destination" />,
          },
        ],
      ] as const;
    }),
  ),
  'c-role-student-not-your-workspace': {
    title: 'Student shell on XS-06 "Not your workspace": nothing current',
    source: '08 "At 375 px" (XS-06), "In context · Student workspace · 1312 px"',
    render: () => <RoleShellSpecimen slug="student" built page="not-your-workspace" />,
  },
};
