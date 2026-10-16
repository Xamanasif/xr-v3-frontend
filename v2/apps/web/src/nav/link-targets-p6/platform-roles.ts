import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const ROLES = '/admin/roles';
/** SA-17, by holder id: the sample's Prof. A. Menon stands for any holder. */
const HOLDER = '/admin/roles/role-a-menon';

/**
 * Phase 6 link targets: SA-16 Platform roles and SA-17 Role holder (B7-08, B7-10 f10 · f11, B7-12).
 * SA-16 draws no primary on the page: “Register a <role>” in the section head is secondary and
 * opens DL-3, whose “Register” is the one primary (a command; the new holder then opens on SA-17,
 * state-copy `SA-16.register-result`). SA-17's one primary is “Assign scope” (the header's button
 * and the DL-3 confirm it opens, a command). Withdraw and Restore are inline (DL-2's reason rule for
 * Withdraw; no reason for Restore, OD-B7-10). Nothing on either page sends an invitation (T-11).
 */
export const P6_PLATFORM_ROLES_LINK_TARGETS: readonly LedgerEntry[] = [
  // SA-16 Platform roles (B7-08 f0, f3, f6).
  ...pageRows('SA-16', ROLES, [
    [
      'Tabs',
      'Vendors · Reviewers · Content Managers',
      'secondary',
      null,
      'in-page',
      'B7-08 f0, f3 `div.xr-tabs[role="tablist"] > button.xr-tab` (rule T3; mirrored in `?tab=`, state-copy `SA-16.tab-address`)',
    ],
    [
      'Section head',
      'Register a Vendor · Register a Reviewer · Register a Content Manager',
      'secondary',
      null,
      'in-page',
      'B7-08 f0, f3 `button.xr-btn--secondary.xr-btn--sm` (`Rl-reg`; opens DL-3)',
    ],
    [
      'Register dialog (DL-3)',
      'Register',
      'primary',
      null,
      'in-page',
      'B7-08 f6 `button.xr-btn--primary` (`Rl-rgo`; a command — success opens the holder on SA-17)',
    ],
    [
      'Register dialog (DL-3)',
      'Cancel · Close',
      'secondary',
      null,
      'in-page',
      'B7-08 f6 `div.xr-dialog-foot`, `button.xr-icon-btn` (nothing is registered)',
    ],
    [
      'Each row',
      'Open',
      'secondary',
      HOLDER,
      'built',
      'B7-08 f0, f3 `a.xr-btn--secondary.xr-btn--sm` (named “Open <name>”; SA-17)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `SA-16.failed`'],
  ]),
  // SA-17 Role holder (B7-08 f1, f2, f4, f5, f7, f8; B7-10 f10, f11; B7-12 f24 … f27).
  ...pageRows('SA-17', HOLDER, [
    ['Back link', 'Platform roles', 'secondary', ROLES, 'built', 'B7-08 f1 … f8 `a.xr-back`'],
    [
      'Top-bar crumb (from 1024 px)',
      'Platform roles',
      'secondary',
      ROLES,
      'built',
      'B7-08 f1, f4 … f8 `ol.xr-crumbs a`',
    ],
    [
      'Page actions',
      'Assign scope',
      'primary',
      null,
      'in-page',
      'B7-08 f1 … f8 `button.xr-btn--primary` (`Rh-asg`) → DL-3 “Assign scope to <name>” (f5), whose `Rh-sgo` confirms (a command)',
    ],
    [
      'Assign scope dialog (DL-3)',
      'Cancel · Close',
      'secondary',
      null,
      'in-page',
      'B7-08 f5 `div.xr-dialog-foot`, `button.xr-icon-btn` (nothing is assigned)',
    ],
    [
      'Can act on — each active scope',
      'Withdraw · Withdraw scope · Cancel',
      'secondary',
      null,
      'in-page',
      'B7-08 f4, f7, f8; B7-10 f11 `button.xr-btn--text.xg-del` → `div.xw-inline-panel` (`button.xr-btn--danger.xr-btn--sm`, a command with a reason)',
    ],
    [
      'Withdrawn — each scope',
      'Restore · Restore scope · Cancel',
      'secondary',
      null,
      'in-page',
      'B7-08 f4, f8 `button.xr-btn--text` → `div.xw-inline-panel` (`button.xr-btn--primary.xr-btn--sm` `Rh-rgo`, a command; no reason, OD-B7-10)',
      'The inline confirmation’s “Restore scope” is drawn `xr-btn--primary`: it is the panel’s own confirm, not a page action (as SA-07’s inline “Change to …”).',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `SA-17.failed`'],
  ]),
];
