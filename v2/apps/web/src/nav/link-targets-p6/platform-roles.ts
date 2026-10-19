import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const ROLES = '/admin/roles';
/** SA-17, by holder id: the sample's Prof. A. Menon stands for any holder. */
const HOLDER = '/admin/roles/role-a-menon';
/** The sample's Dr K. Iyer: the holder the Reviewers tab's no-scope notice opens. */
const NO_SCOPE_HOLDER = '/admin/roles/role-0001';

/**
 * SA-16 Platform roles and SA-17 Role holder in the owner-approved V3 design (SA-v1 LINK-MAP;
 * `sa-views-d.js` `V.roles`, `V.holder`). SA-16's page tabs are links (each tab is an address);
 * “Register a <role>” in the page head is navy and opens the register dialog, whose “Register” is
 * the one primary (a command; the new holder then opens on SA-17, state-copy
 * `SA-16.register-result`). SA-17's one primary is the Assign scope panel's “Assign scope” (a
 * command). Withdraw is inline with a reason; Restore is a confirmation, no reason asked. Nothing
 * on either page sends an invitation (T-11).
 */
export const P6_PLATFORM_ROLES_LINK_TARGETS: readonly LedgerEntry[] = [
  // SA-16 Platform roles (`V.roles`).
  ...pageRows('SA-16', ROLES, [
    [
      'Page tabs',
      'Vendors · Reviewers · Content Managers (with counts)',
      'secondary',
      `${ROLES}?tab=reviewers`,
      'built',
      'SA-v1 LINK-MAP SA-16 tabs “Vendors 2”, “Reviewers 2”, “Content Managers 1” (`nav.rk-tabs.sa-tabs > a.rk-tab`; Vendors is the bare address, state-copy `SA-16.tab-address`)',
    ],
    [
      'Page head',
      'Register a Vendor · Register a Reviewer · Register a Content Manager',
      'secondary',
      null,
      'in-page',
      'SA-v1 `V.roles` `button.rb-btn--navy#ro-reg` (opens `SA.DLG.register`)',
    ],
    [
      'Register dialog',
      'Register',
      'primary',
      null,
      'in-page',
      'SA-v1 `SA.DLG.register` `#dlg-ok` (a command — success opens the holder on SA-17)',
    ],
    [
      'Register dialog',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'SA-v1 `dialogHtml` `#dlg-cancel` (nothing is registered; Esc the same)',
    ],
    [
      'No-scope notice',
      'Assign scope',
      'secondary',
      NO_SCOPE_HOLDER,
      'built',
      'SA-v1 `V.roles` `div.rk-notice--warn` `a.rb-btn` (the tab’s first holder with no scope; SA-17)',
    ],
    [
      'Each row',
      '<name>, <role>. Open (the whole row)',
      'secondary',
      HOLDER,
      'built',
      'SA-v1 LINK-MAP SA-16 “Anil Shetty, Vendor. Open” (`a.rk-rowlink`; SA-17)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `SA-16.failed`'],
  ]),
  // SA-17 Role holder (`V.holder`).
  ...pageRows('SA-17', HOLDER, [
    [
      'Breadcrumb',
      'Platform roles',
      'secondary',
      ROLES,
      'built',
      'SA-v1 LINK-MAP SA-17 breadcrumb “Platform roles” (`nav.rk-crumbs`)',
      'The export sends it to the holder’s tab; here it is the bare address, so the two crumbs keep two addresses (state-copy `SA-17.top-title`).',
    ],
    [
      'Breadcrumb',
      'Reviewers (the holder’s tab)',
      'secondary',
      `${ROLES}?tab=reviewers`,
      'built',
      'SA-v1 LINK-MAP SA-17 breadcrumb “Reviewers” (`nav.rk-crumbs`)',
    ],
    [
      'Page head (under 860 px)',
      'Go to assign scope',
      'secondary',
      null,
      'in-page',
      'SA-v1 LINK-MAP SA-17 “Go to assign scope” → `#ho-panel` (`a.rb-btn.rk-goto`; an in-page jump)',
    ],
    [
      'Assign scope panel',
      'Assign scope',
      'primary',
      null,
      'in-page',
      'SA-v1 `V.holder` `button.rb-btn--primary.rk-go#ho-go` (a command; its errors in “Check the scope”)',
    ],
    [
      'Can act on — each active scope',
      'Withdraw · Withdraw scope · Cancel',
      'secondary',
      null,
      'in-page',
      'SA-v1 `V.holder` `button.rb-btn--ghost` (`wdOpen`) → `div.sa-inline` (`button.rb-btn--navy`, a command with a reason)',
    ],
    [
      'Withdrawn — each scope',
      'Restore · Restore scope · Cancel',
      'secondary',
      null,
      'in-page',
      'SA-v1 `V.holder` `button.rb-btn` (`rsOpen`) → `SA.DLG.restoreScope` (a command; no reason)',
      'The confirmation’s “Restore scope” is drawn gold, as every Refined B dialog confirm: it is the dialog’s own confirm, not a page action.',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `SA-17.failed`'],
  ]),
];
