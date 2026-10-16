/**
 * SA-01's pure view rules (B7-01): the overview the service answers (`getSuperAdminOverview`,
 * PC-67) as the groups the board draws — in its order, each with its count, its "Open <list>"
 * link and up to four rows (icon, tone, title, line and the one action that opens the page where
 * the item is handled; routes.json SA-01). A group with nothing in it is left out. Counts are the
 * service's; nothing is counted or decided here.
 */
import type { Out, superAdminOverviewOutput } from '@xr/contracts/draft';
import { ROLE_LABEL } from '@xr/domain';
import type { IconName, RowTone } from '@xr/ui';

import {
  endingRowLine,
  endingRowTitle,
  holderRowLine,
  holderRowTitle,
  noInstituteAdminLine,
  OVERVIEW_GROUP_ORDER,
  OVERVIEW_GROUPS,
  type OverviewGroupKey,
  requestRowLine,
  requestRowTitle,
  rowActionLabel,
  stuckRowLine,
  stuckRowTitle,
  supportRowLine,
  supportRowTitle,
  transferRowLine,
  transferRowTitle,
  updateRowLine,
  updateRowTitle,
} from '@/copy/overview';
import {
  ALL_CONTENT_ADDRESS,
  contentRecordAddress,
  CONTENT_UPDATES_ADDRESS,
  updateDecisionAddress,
} from '@/nav/admin-content';
import { institutionAddress, INSTITUTIONS_ADDRESS } from '@/nav/institutions';
import {
  ACCESS_ENDING_ADDRESS,
  DEVICE_TRANSFERS_ADDRESS,
  deviceTransferAddress,
  SUPPORT_ADDRESS,
  supportReportAddress,
} from '@/nav/operations';
import { holderAddress, ROLES_ADDRESS } from '@/nav/platform-roles';
import { requestAddress, REQUESTS_ADDRESS } from '@/nav/requests';

export type SuperAdminOverview = Out<typeof superAdminOverviewOutput>;

export interface OverviewRowView {
  readonly key: string;
  readonly icon: IconName;
  readonly tone: RowTone;
  readonly title: string;
  readonly sub: string;
  /** The row's one action: B7-01's words, its accessible name ("Open: <title>") and where it goes. */
  readonly action: { readonly words: string; readonly label: string; readonly href: string };
}

export interface OverviewGroupView {
  readonly key: OverviewGroupKey;
  readonly title: string;
  /** The service's count of every item in the group (the rows are its first four). */
  readonly count: number;
  readonly open: { readonly words: string; readonly href: string };
  readonly rows: readonly OverviewRowView[];
}

/** Each group's list (the "Open <list>" link; B7-01 hrefs, routes.json SA-01). */
const LIST_ADDRESS: Readonly<Record<OverviewGroupKey, string>> = {
  requests: REQUESTS_ADDRESS,
  updates: CONTENT_UPDATES_ADDRESS,
  deviceTransfers: DEVICE_TRANSFERS_ADDRESS,
  support: SUPPORT_ADDRESS,
  accessEnding: ACCESS_ENDING_ADDRESS,
  institutionsWithoutAdmin: INSTITUTIONS_ADDRESS,
  stuckContent: ALL_CONTENT_ADDRESS,
  holdersWithoutScope: ROLES_ADDRESS,
};

/** Each group's row glyph and tone, as B7-01 draws them. */
const ROW_LOOK: Readonly<Record<OverviewGroupKey, { icon: IconName; tone: RowTone }>> = {
  requests: { icon: 'requests', tone: 'wait' },
  updates: { icon: 'updates', tone: 'wait' },
  deviceTransfers: { icon: 'myDevice', tone: 'wait' },
  support: { icon: 'question', tone: 'info' },
  accessEnding: { icon: 'clock', tone: 'wait' },
  institutionsWithoutAdmin: { icon: 'institutions', tone: 'err' },
  stuckContent: { icon: 'stopped', tone: 'err' },
  holdersWithoutScope: { icon: 'platformRoles', tone: 'wait' },
};

function row(
  group: OverviewGroupKey,
  key: string,
  title: string,
  sub: string,
  href: string,
): OverviewRowView {
  const words = OVERVIEW_GROUPS[group].action;
  return {
    key,
    ...ROW_LOOK[group],
    title,
    sub,
    action: { words, label: rowActionLabel(words, title), href },
  };
}

/** One group's rows from its facts (every row opens the page where the item is handled). */
function rowsOf(group: OverviewGroupKey, overview: SuperAdminOverview): OverviewRowView[] {
  switch (group) {
    case 'requests':
      return overview.requests.rows.map(({ request, accessEndsOn }) =>
        row(
          group,
          request.id,
          requestRowTitle(request.id, request.institutionName),
          requestRowLine(request.type, request.receivedAt, accessEndsOn),
          requestAddress(request.id),
        ),
      );
    case 'updates':
      return overview.updates.rows.map(({ update, experimentName, liveLabel, approvedAt }) =>
        row(
          group,
          update.id,
          updateRowTitle(update.id, experimentName, update.baseVersionLabel, update.versionLabel),
          updateRowLine(approvedAt, liveLabel),
          updateDecisionAddress(update.id),
        ),
      );
    case 'deviceTransfers':
      return overview.deviceTransfers.rows.map(({ transfer, studentName, institutionName }) =>
        row(
          group,
          transfer.id,
          transferRowTitle(transfer.id, studentName, transfer.format),
          transferRowLine(institutionName, transfer.forwarded?.at ?? null),
          deviceTransferAddress(transfer.id),
        ),
      );
    case 'support':
      return overview.support.rows.map((report) =>
        row(
          group,
          report.id,
          supportRowTitle(report),
          supportRowLine(report),
          supportReportAddress(report.id),
        ),
      );
    case 'accessEnding':
      // Access ending has no record page: its rows open the list (routes.json SA-01).
      return overview.accessEnding.rows.map(({ row: ending, institutionName }) =>
        row(
          group,
          ending.planId,
          endingRowTitle(institutionName, ending.endsOn),
          endingRowLine(ending.standing),
          ACCESS_ENDING_ADDRESS,
        ),
      );
    case 'institutionsWithoutAdmin':
      return overview.institutionsWithoutAdmin.rows.map((institution) =>
        row(
          group,
          institution.institutionId,
          institution.name,
          noInstituteAdminLine(institution.status === 'access-paused', institution.accessSince),
          institutionAddress(institution.institutionId),
        ),
      );
    case 'stuckContent':
      return overview.stuckContent.rows.map((stuck) =>
        row(
          group,
          stuck.submissionId,
          stuckRowTitle(stuck.submissionId, stuck.name, stuck.courseCode),
          stuckRowLine(stuck.since, stuck.courseCode),
          contentRecordAddress(stuck.submissionId),
        ),
      );
    case 'holdersWithoutScope':
      return overview.holdersWithoutScope.rows.map(({ holder }) =>
        row(
          group,
          holder.id,
          holderRowTitle(holder.name, ROLE_LABEL[holder.role]),
          holderRowLine(holder.registeredAt),
          holderAddress(holder.id),
        ),
      );
  }
}

/** The groups with something in them, in B7-01's order ("A group with nothing in it is left out"). */
export function overviewGroups(overview: SuperAdminOverview): OverviewGroupView[] {
  return OVERVIEW_GROUP_ORDER.flatMap((key) => {
    const { count } = overview[key];
    if (count === 0) return [];
    const words = OVERVIEW_GROUPS[key];
    return [
      {
        key,
        title: words.title,
        count,
        open: { words: words.open, href: LIST_ADDRESS[key] },
        rows: rowsOf(key, overview),
      },
    ];
  });
}

/** The header line's facts: every waiting item and the groups that hold them (B7-01 f0). */
export function waitingTotals(groups: readonly OverviewGroupView[]): {
  readonly items: number;
  readonly groups: number;
} {
  return { items: groups.reduce((sum, group) => sum + group.count, 0), groups: groups.length };
}
