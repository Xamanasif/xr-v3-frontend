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
  // IA-20 Usage (B3-10; in V3 the IA-v1 export's IA-20): a reading page — no primary action, no
  // command. The view switch mirrors the view into the address (`?view=course`, register PROPOSED;
  // state-copy `IA-20.view-address`) without a navigation.
  ...pageRows('IA-20', '/institute/usage', [
    [
      'View',
      'By experiment and format / By course',
      'secondary',
      null,
      'in-page',
      'IA-v1 IA-20 `div.rb-switch[aria-label="View usage"]`',
    ],
    [
      'An experiment with no activity yet',
      'Open Student access',
      'secondary',
      '/institute/student-access',
      'built',
      'IA-v1 IA-20 `noActivity` (`a.rb-btn`)',
    ],
    [
      '“No usage yet” (approved — payment required)',
      'View request status',
      'secondary',
      '/institute/requests/{requestId}',
      'built',
      'IA-v1 IA-20 `noPlan` (→ the request’s detail in Requests)',
      'The state itself is unreachable in the sample world (INST-04).',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `IA-20.failed`'],
  ]),
];
