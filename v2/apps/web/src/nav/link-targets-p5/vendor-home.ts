import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const OVERVIEW = '/vendor';
const LIST = '/vendor/experiments';
const CREATE = '/vendor/experiments/new';
/** The sample’s records stand for any: SUB-0081 returned, SUB-0079 a draft, SUB-0074 with the CM. */
const REVISE = '/vendor/experiments/SUB-0081/revise';
const EDIT_DRAFT = '/vendor/experiments/SUB-0079/edit';
const RECORD = '/vendor/experiments/SUB-0074';
const RETURNED_RECORD = '/vendor/experiments/SUB-0081';

/**
 * Phase 5 link targets: VE-01 Overview and VE-02 My experiments (B5-01, B5-02; B5-08 f1, f3).
 * VE-01’s primary is the first “Needs your action” row’s action (B5-01 script `a.primary = i ===
 * 0`: “Revise “<name>”” while anything is returned, else the first draft’s “Finish draft”), or the
 * first-visit empty state’s “Create experiment” (f2); its header “Create experiment” is
 * secondary. VE-02’s header “Create experiment” is primary (f0 … f5), as is a returned row’s
 * “Revise” (f1) and the empty state’s “Create experiment” (f3).
 */
export const P5_VENDOR_HOME_LINK_TARGETS: readonly LedgerEntry[] = [
  // VE-01 Overview (B5-01 f0 … f3; B5-08 f1).
  ...pageRows('VE-01', OVERVIEW, [
    [
      'Header',
      'Create experiment',
      'secondary',
      CREATE,
      'built',
      'B5-01 f0 … f3 `div.xr-phead-actions > a.xr-btn--secondary` (with the add icon)',
    ],
    [
      'Needs your action (returned row)',
      'Revise “<name>”',
      'primary',
      REVISE,
      'built',
      'B5-01 f0, f3; B5-08 f1 `li.xr-row > a.xr-btn--primary.xr-btn--sm` (the first row; state-copy `VE-01.attention`)',
    ],
    [
      'Needs your action (draft row)',
      'Finish draft',
      'secondary',
      EDIT_DRAFT,
      'built',
      'B5-01 f0, f3; B5-08 f1 `li.xr-row > a.xr-btn--secondary.xr-btn--sm` (primary when it is the first row; at the step the draft last reached, state-copy `VE-01.finish-draft`)',
    ],
    [
      'Nothing needs you',
      'Create experiment',
      'secondary',
      CREATE,
      'built',
      'B5-01 f1 `div.xr-empty > div > a.xr-btn--secondary`',
    ],
    [
      'First visit (no experiments yet)',
      'Create experiment',
      'primary',
      CREATE,
      'built',
      'B5-01 f2 `div.xr-empty > div > a.xr-btn--primary` (“The primary action moves into the empty state”)',
    ],
    [
      'Under the sections',
      'See all your experiments',
      'secondary',
      LIST,
      'built',
      'B5-01 f0 … f3 `p.xl-meta > a`',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `VE-01.failed`'],
  ]),
  // VE-02 My experiments (B5-02 f0 … f5; B5-08 f3).
  ...pageRows('VE-02', LIST, [
    [
      'Header',
      'Create experiment',
      'primary',
      CREATE,
      'built',
      'B5-02 f0 … f5 `div.xr-phead-actions > a.xr-btn--primary` (with the add icon)',
    ],
    [
      'Toolbar',
      'Search your experiments / Status / Changed in the last 7 days',
      'secondary',
      null,
      'in-page',
      'B5-02 f0, f4, f5 `div.xr-toolbar` (`input#Lm-q`, `select#Lm-s`, `label.xr-check`; the address mirrors `?status=`, state-copy `VE-02.status-filter`, `VE-02.changed-recently`)',
    ],
    [
      'Toolbar status',
      'Clear filters',
      'secondary',
      null,
      'in-page',
      'B5-02 f1, f2 `div.xr-toolbar-status > button.xr-btn--text` (while a filter is applied)',
    ],
    [
      'Experiment row',
      '<experiment name>',
      'secondary',
      RETURNED_RECORD,
      'built',
      'B5-02 f0 `td.is-primary > a` (every row opens the record, VE-07; state-copy `VE-02.row-action`)',
    ],
    [
      'Experiment row (returned)',
      'Revise',
      'primary',
      REVISE,
      'built',
      'B5-02 f0, f1 `a.xr-btn--primary.xr-btn--sm` (named “Revise <name>”; f1 “Revise is the primary action”)',
    ],
    [
      'Experiment row (draft)',
      'Edit draft',
      'secondary',
      EDIT_DRAFT,
      'built',
      'B5-02 f0 `a.xr-btn--secondary.xr-btn--sm` (named “Edit draft <name>”; at the step it last reached)',
    ],
    [
      'Experiment row (any other status, a read-only draft)',
      'Open',
      'secondary',
      RECORD,
      'built',
      'B5-02 f0 `a.xr-btn--secondary.xr-btn--sm` (named “Open <name>”; SUB-0083 “Draft · read-only” opens the record)',
    ],
    [
      'No match',
      'Clear filters',
      'secondary',
      null,
      'in-page',
      'B5-02 f2 `div.xr-empty > div > button.xr-btn--secondary`',
    ],
    [
      'Empty (no experiments yet)',
      'Create experiment',
      'primary',
      CREATE,
      'built',
      'B5-02 f3 `div.xr-empty > div > a.xr-btn--primary` (with the add icon)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `VE-02.failed`'],
  ]),
];
