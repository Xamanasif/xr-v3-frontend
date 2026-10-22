import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const OVERVIEW = '/vendor';
const LIST = '/vendor/experiments';
const LIST_CHANGED_RECENTLY = '/vendor/experiments?changed=last-7-days';
const CREATE = '/vendor/experiments/new';
/** The sample's records stand for any: SUB-0081 returned, SUB-0079 a draft. */
const REVISE = '/vendor/experiments/SUB-0081/revise';
const EDIT_DRAFT = '/vendor/experiments/SUB-0079/edit';
const RETURNED_RECORD = '/vendor/experiments/SUB-0081';

/**
 * Link targets of VE-01 Overview and VE-02 My experiments in the owner-approved Vendor export
 * (V3 Refined B, design/v3-refined-b/roles/VE-v1 `LINK-MAP.json` L10 … L25). VE-01's primary is the
 * returned lead's gold “Revise “<name>”” (with nothing returned, the first draft's “Finish draft”)
 * or, on the first visit, the surface's “Create experiment”; the band's “Create experiment” is the
 * white button. VE-02's primary is the head's gold “Create experiment” (the empty state's when
 * there is no experiment); the rows' Revise and Edit draft are white.
 */
export const P5_VENDOR_HOME_LINK_TARGETS: readonly LedgerEntry[] = [
  // VE-01 Overview.
  ...pageRows('VE-01', OVERVIEW, [
    [
      'Studio band',
      'Create experiment',
      'secondary',
      CREATE,
      'built',
      'VE-v1 LINK-MAP L10 (`div.rb-id-act > a.rb-btn.rb-btn--lg`, with the add glyph)',
    ],
    [
      'Needs your action (the returned lead)',
      'Revise “<name>”',
      'primary',
      REVISE,
      'built',
      'VE-v1 LINK-MAP L11 (`div.rb-lead-act > a.rb-btn.rb-btn--primary.rb-btn--lg`, named “Revise <name>, returned by the <role>”; state-copy `VE-01.attention`)',
    ],
    [
      'Needs your action (further returned items)',
      'Revise “<name>”',
      'secondary',
      REVISE,
      'built',
      'VE-v1 LINK-MAP L13 (`li.rb-ai.vr-ai > div.rb-ai-act > a.rb-btn`)',
    ],
    [
      'Needs your action (drafts to finish)',
      'Finish draft',
      'secondary',
      EDIT_DRAFT,
      'built',
      'VE-v1 LINK-MAP L12 (`div.rb-ai-act > a.rb-btn`, named “Finish the draft of <name>”; gold when nothing is returned; at the step the draft last reached, state-copy `VE-01.finish-draft`)',
    ],
    [
      'Recent activity (each row)',
      '<experiment name>',
      'secondary',
      RETURNED_RECORD,
      'built',
      'VE-v1 LINK-MAP L14 (`a.vr-rowlink`, named “<what>, <name>, <when>. Open the experiment record”; state-copy `VE-01.recent-activity`)',
    ],
    [
      'Recent activity (foot)',
      'Changed in the last 7 days',
      'secondary',
      LIST_CHANGED_RECENTLY,
      'built',
      'VE-v1 LINK-MAP L17 (`div.vr-act-foot > a.rb-link`; the list with its 7-day filter ticked, state-copy `VE-02.changed-recently`)',
    ],
    [
      'Recent activity (foot)',
      'See all your experiments',
      'secondary',
      LIST,
      'built',
      'VE-v1 LINK-MAP L15 (`div.vr-act-foot > a.rb-link`)',
    ],
    [
      'First visit (no experiments yet)',
      'Create experiment',
      'primary',
      CREATE,
      'built',
      'VE-v1 LINK-MAP L10 (`section.rk-surface > div.rk-state.rk-state--roomy > a.rb-btn.rb-btn--primary.rb-btn--lg`)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `VE-01.failed`'],
  ]),
  // VE-02 My experiments.
  ...pageRows('VE-02', LIST, [
    [
      'Head',
      'Create experiment',
      'primary',
      CREATE,
      'built',
      'VE-v1 LINK-MAP L20 (`div.rk-head-act > a.rb-btn.rb-btn--primary.rb-btn--lg`, with the add glyph)',
    ],
    [
      'Status tabs',
      'All · Returned · Draft · Submitted · With Academic Reviewer · With Content Manager · Published',
      'secondary',
      null,
      'in-page',
      'VE-v1 LINK-MAP L25 (`div.rb-switch[role=group] > button[aria-pressed]`, named “<status>, <n> experiments”; the address mirrors `?status=`, state-copy `VE-02.status-tabs`)',
    ],
    [
      'Tool row',
      'Search by name or course / Changed in the last 7 days',
      'secondary',
      null,
      'in-page',
      'VE-v1 LINK-MAP L25 (`div.vr-tools[role=search]`: `input#ve-q` named “Search by name or course”, state-copy `VE-02.search`; `label.vr-toggle`; the address mirrors `?changed=last-7-days`, state-copy `VE-02.changed-recently`)',
    ],
    [
      'Tool row',
      'Clear filters',
      'secondary',
      null,
      'in-page',
      'VE-v1 LINK-MAP L25 (`button.rk-clear`, while a filter is applied; focus returns to the search)',
    ],
    [
      'Table head and tool row',
      'Last change · Sort: newest first',
      'secondary',
      null,
      'in-page',
      'VE-v1 LINK-MAP L25 (`th.vr-c-date > button.rk-sortbtn`; below 760 px `div.rk-sortbar.vr-sortnarrow`; state-copy `VE-02.sort`)',
    ],
    [
      'Experiment row',
      '<experiment name>',
      'secondary',
      RETURNED_RECORD,
      'built',
      'VE-v1 LINK-MAP L22 (`a.rk-rowlink.vr-name`, named “<name>, <status>, last change <date>. Open the experiment record” — never the reference, state-copy `VE-02.no-reference`; a press anywhere on the row; state-copy `VE-02.row-action`)',
    ],
    [
      'Experiment row (returned)',
      'Revise',
      'secondary',
      REVISE,
      'built',
      'VE-v1 LINK-MAP L23 (`a.rb-btn.vr-rowbtn`, named “Revise <name>”)',
    ],
    [
      'Experiment row (draft)',
      'Edit draft',
      'secondary',
      EDIT_DRAFT,
      'built',
      'VE-v1 LINK-MAP L24 (`a.rb-btn.vr-rowbtn`, named “Edit the draft of <name>”; at the step it last reached)',
    ],
    [
      'No match',
      'Clear filters',
      'secondary',
      null,
      'in-page',
      'VE-v1 LINK-MAP L25 (`div.rk-state > button.rb-btn`)',
    ],
    [
      'Empty (no experiments yet)',
      'Create experiment',
      'primary',
      CREATE,
      'built',
      'VE-v1 LINK-MAP L20 (`div.rk-state.rk-state--roomy > a.rb-btn.rb-btn--primary.rb-btn--lg`)',
    ],
    [
      'Failed state',
      'Try again',
      'secondary',
      null,
      'in-page',
      'VE-v1 LINK-MAP L25 (`div.rk-state[role=alert] > button.rb-btn`; state-copy `VE-02.failed`)',
    ],
  ]),
];
