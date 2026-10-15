import type { LedgerEntry } from '../link-targets';
import { pageRows } from './rows';

/** Phase 3 link targets: IA-20 Usage (B3-10). */
export const P3_USAGE_LINK_TARGETS: readonly LedgerEntry[] = [
  {
    screen: 'Shell',
    where: 'Sidebar destination (Institute Admin only)',
    action: 'Usage',
    role: 'secondary',
    on: '/institute/*',
    target: '/institute/usage',
    outcome: 'built',
    board: '06 (Institute Admin raw[]); B3-10 f0 (`aria-current="page"`)',
    note: 'IA-20 (Phase 3).',
  },
  // IA-20 Usage (B3-10 f0 … f4): a reading page — no primary action, no command. The view switch
  // mirrors the view into the address (`?view=course`, register PROPOSED; state-copy
  // `IA-20.view-address`) without a navigation.
  ...pageRows('IA-20', '/institute/usage', [
    [
      'View',
      'By experiment and format / By course',
      'secondary',
      null,
      'in-page',
      'B3-10 f0, f1, f3, f4 `div.xr-seg`',
    ],
    [
      'No activity yet',
      'Open Student access',
      'secondary',
      '/institute/student-access',
      'built',
      'B3-10 f2 `a.xr-btn--secondary`',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `IA-20.failed`'],
  ]),
];
