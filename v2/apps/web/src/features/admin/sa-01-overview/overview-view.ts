/**
 * SA-01's pure view rules in the V3 design (the Super Admin export, `sa-views-a.js` `V.overview`,
 * `sa-core.js` `SA.work`): the overview the service answers (`getSuperAdminOverview`, PC-67) as
 * the export's queue — each group in the approved order with its rows (title, line, wait and the
 * one action that opens the page where the item is handled), the counts of the category switch, and
 * the priority band. Counts and row order are the service's (state-copy `SA-01.groups`); nothing is
 * counted, ranked or decided here beyond choosing which already-ordered rows the band shows
 * (state-copy `SA-01.priority`).
 */
import type { Out, superAdminOverviewOutput } from '@xr/contracts/draft';
import { FORMAT_META, ROLE_LABEL } from '@xr/domain';
import type { PriorityItem, V3IconName } from '@xr/ui/v3';

import { reportTitle } from '@/copy/help';
import {
  assignAdminName,
  assignScopeName,
  categoryAnnouncement,
  correctionPriorityLine,
  correctionTitle,
  endingActionName,
  endingPriorityLine,
  endingRowLine,
  endsIn,
  holderRowLine,
  holderRowTitle,
  noAdminRowLine,
  noAdminRowTitle,
  OVERVIEW_CATEGORIES,
  OVERVIEW_GROUP_ORDER,
  OVERVIEW_GROUPS,
  type OverviewCategoryKey,
  type OverviewGroupKey,
  openReportName,
  openRequestName,
  openStuckName,
  PRIORITY_KINDS,
  reportEventVerb,
  reportRowLine,
  requestRowLine,
  requestRowTitle,
  reviewCorrectionName,
  reviewTransferName,
  ROW_ACTIONS,
  stuckRowLine,
  stuckRowTitle,
  transferRowLine,
  transferRowTitle,
  updateRowLine,
  updateRowTitle,
  waitingSince,
  waitSince,
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
  readonly title: string;
  readonly description: string;
  readonly when: { readonly big: string; readonly small: string; readonly due?: boolean };
  /** The row's one action: its words, its accessible name and where it goes. */
  readonly action: {
    readonly label: string;
    readonly accessibleName: string;
    readonly href: string;
  };
}

export interface OverviewGroupView {
  readonly key: OverviewGroupKey;
  readonly name: string;
  readonly icon: V3IconName;
  /** The service's count of every item in the group (its rows are the first four). */
  readonly count: number;
  readonly link: { readonly href: string; readonly label: string };
  readonly quiet: string;
  readonly rows: readonly OverviewRowView[];
}

/** Each group's destination ("Open Requests"; the export's LINK-MAP, routes.json SA-01). */
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

/** Each group's tile glyph, as the export draws it (`rbi-inbox`, `rbi-edit`, …). */
const GROUP_ICON: Readonly<Record<OverviewGroupKey, V3IconName>> = {
  requests: 'inbox',
  updates: 'edit',
  deviceTransfers: 'headset',
  support: 'lifebuoy',
  accessEnding: 'calendar',
  institutionsWithoutAdmin: 'userMinus',
  stuckContent: 'hourglass',
  holdersWithoutScope: 'userQuestion',
};

/** A request's experiments named from the published catalogue (`null` while not named). */
export type ExperimentNamer = (experimentId: string) => string | null;

/** The wait since an instant, or "Today" when the service gives none (no plan activated yet). */
function sinceOrToday(since: string | null, today: string | null): OverviewRowView['when'] {
  const from = since ?? today;
  return from === null ? { big: '', small: '' } : waitSince(from, today);
}

function rowsOf(
  group: OverviewGroupKey,
  overview: SuperAdminOverview,
  today: string | null,
  nameOf: ExperimentNamer,
): OverviewRowView[] {
  switch (group) {
    case 'requests':
      return overview.requests.rows.map(({ request, accessEndsOn }) => ({
        key: request.id,
        title: requestRowTitle(request.institutionName, request.type),
        description: requestRowLine(
          request.type,
          {
            count: request.itemCount,
            firstName: request.firstItem ? nameOf(request.firstItem.experimentId) : null,
          },
          accessEndsOn,
        ),
        when: waitSince(request.receivedAt, today),
        action: {
          label: ROW_ACTIONS.request,
          accessibleName: openRequestName(request.type, request.institutionName),
          href: requestAddress(request.id),
        },
      }));
    case 'updates':
      return overview.updates.rows.map(({ update, experimentName, liveLabel, approvedAt }) => ({
        key: update.id,
        title: updateRowTitle(experimentName, update.baseVersionLabel, update.versionLabel),
        description: updateRowLine(approvedAt, liveLabel),
        when: waitSince(approvedAt ?? update.updatedAt, today),
        action: {
          label: ROW_ACTIONS.update,
          accessibleName: reviewCorrectionName(experimentName),
          href: updateDecisionAddress(update.id),
        },
      }));
    case 'deviceTransfers':
      return overview.deviceTransfers.rows.map(({ transfer, studentName, institutionName }) => {
        const code = FORMAT_META[transfer.format].code;
        return {
          key: transfer.id,
          title: transferRowTitle(code, studentName),
          description: transferRowLine(institutionName),
          when: waitSince(transfer.forwarded?.at ?? transfer.requestedAt, today),
          action: {
            label: ROW_ACTIONS.transfer,
            accessibleName: reviewTransferName(code, studentName),
            href: deviceTransferAddress(transfer.id),
          },
        };
      });
    case 'support':
      return overview.support.rows.map((report) => {
        const title = reportTitle(report.whatHappened);
        const reopened = [...report.reopenings].sort((a, b) => (a.at < b.at ? -1 : 1)).at(-1);
        const last = report.state === 'reopened' && reopened ? reopened.at : report.sentAt;
        return {
          key: report.id,
          title,
          description: reportRowLine(report.reporter.displayName, ROLE_LABEL[report.reporter.role]),
          when: waitSince(last, today, reportEventVerb(last !== report.sentAt)),
          action: {
            label: ROW_ACTIONS.report,
            accessibleName: openReportName(title),
            href: supportReportAddress(report.id),
          },
        };
      });
    case 'accessEnding':
      return overview.accessEnding.rows.map(({ row, institutionName }) => {
        const renewal = row.standing.kind === 'renewal-in-progress';
        return {
          key: row.planId,
          title: institutionName,
          description: endingRowLine(row.endsOn, renewal),
          when: { ...endsIn(row.endsOn, row.daysLeft), due: true },
          action: {
            label: renewal ? ROW_ACTIONS.renewal : ROW_ACTIONS.ending,
            accessibleName: endingActionName(institutionName, renewal),
            href:
              row.standing.kind === 'renewal-in-progress'
                ? requestAddress(row.standing.requestId)
                : ACCESS_ENDING_ADDRESS,
          },
        };
      });
    case 'institutionsWithoutAdmin':
      return overview.institutionsWithoutAdmin.rows.map((institution) => ({
        key: institution.institutionId,
        title: noAdminRowTitle(institution.name),
        description: noAdminRowLine(
          institution.status === 'access-paused',
          institution.accessSince,
        ),
        when: sinceOrToday(institution.accessSince, today),
        action: {
          label: ROW_ACTIONS.assignAdmin,
          accessibleName: assignAdminName(institution.name),
          href: institutionAddress(institution.institutionId),
        },
      }));
    case 'stuckContent':
      return overview.stuckContent.rows.map((stuck) => ({
        key: stuck.submissionId,
        title: stuckRowTitle(stuck.name),
        description: stuckRowLine(stuck.courseCode, stuck.since),
        when: waitSince(stuck.since, today),
        action: {
          label: ROW_ACTIONS.stuck,
          accessibleName: openStuckName(stuck.name),
          href: contentRecordAddress(stuck.submissionId),
        },
      }));
    case 'holdersWithoutScope':
      return overview.holdersWithoutScope.rows.map(({ holder }) => ({
        key: holder.id,
        title: holderRowTitle(holder.name),
        description: holderRowLine(ROLE_LABEL[holder.role], holder.registeredAt),
        when: waitSince(holder.registeredAt, today),
        action: {
          label: ROW_ACTIONS.scope,
          accessibleName: assignScopeName(holder.name),
          href: holderAddress(holder.id),
        },
      }));
  }
}

/** Every group, in the approved order, with its count and its rows (none left out here). */
export function overviewGroups(
  overview: SuperAdminOverview,
  today: string | null,
  nameOf: ExperimentNamer = () => null,
): OverviewGroupView[] {
  return OVERVIEW_GROUP_ORDER.map((key) => {
    const words = OVERVIEW_GROUPS[key];
    return {
      key,
      name: words.title,
      icon: GROUP_ICON[key],
      count: overview[key].count,
      link: { href: LIST_ADDRESS[key], label: words.open },
      quiet: words.quiet,
      rows: rowsOf(key, overview, today, nameOf),
    };
  });
}

/** One option of the category switch: the number of items its groups hold, each counted once. */
export function categoryCounts(
  groups: readonly OverviewGroupView[],
): Readonly<Record<OverviewCategoryKey, number>> {
  const countOf = (keys: readonly OverviewGroupKey[]) =>
    groups.filter((group) => keys.includes(group.key)).reduce((sum, group) => sum + group.count, 0);
  return Object.fromEntries(
    OVERVIEW_CATEGORIES.map((category) => [category.key, countOf(category.groups)]),
  ) as Record<OverviewCategoryKey, number>;
}

/** The chosen category's announcement ("Requests, 3 items"); none for All. */
export function categoryWords(
  key: OverviewCategoryKey,
  counts: Readonly<Record<OverviewCategoryKey, number>>,
): string {
  if (key === 'all') return '';
  const category = OVERVIEW_CATEGORIES.find((option) => option.key === key)!;
  return categoryAnnouncement(category.label, counts[key]);
}

/** At most three items in the priority band (the export's `slice(0, 3)`). */
const PRIORITY_SIZE = 3;

export interface OverviewLayout {
  /** The priority band's items: access ending, then corrections, in the service's own orders. */
  readonly priority: readonly PriorityItem[];
  /** The groups under the band, each without the rows the band shows; empty groups left out. */
  readonly rest: readonly OverviewGroupView[];
}

/**
 * "All": the priority band, then the rest of the queue (the export's `V.overview`). The band takes
 * the access-ending rows (soonest end first, the service's order), then the corrections (oldest
 * approval first, the service's order), at most three; an item the band shows leaves its group
 * below, so every item is shown once. A group with nothing left is left out (state-copy
 * `SA-01.priority`).
 */
export function overviewLayout(
  overview: SuperAdminOverview,
  groups: readonly OverviewGroupView[],
): OverviewLayout {
  const ending = overview.accessEnding.rows.slice(0, PRIORITY_SIZE);
  const corrections = overview.updates.rows.slice(0, PRIORITY_SIZE - ending.length);
  const renewalSince = (requestId: string) =>
    overview.requests.rows.find(({ request }) => request.id === requestId)?.request.receivedAt ??
    null;
  const endingGroup = groups.find((group) => group.key === 'accessEnding')!;
  const updatesGroup = groups.find((group) => group.key === 'updates')!;
  const priority: PriorityItem[] = [
    ...ending.map(({ row, institutionName }, index): PriorityItem => {
      const shown = endingGroup.rows[index]!;
      const renewal = row.standing.kind === 'renewal-in-progress';
      return {
        key: `ending-${row.planId}`,
        when: { big: shown.when.small, relative: shown.when.big },
        kind: { icon: 'calendar', label: PRIORITY_KINDS.ending },
        title: institutionName,
        description: endingPriorityLine(
          row.standing.kind === 'renewal-in-progress' ? renewalSince(row.standing.requestId) : null,
          renewal,
        ),
        action: {
          href: shown.action.href,
          label: shown.action.label,
          accessibleName: shown.action.accessibleName,
        },
      };
    }),
    ...corrections.map(({ update, experimentName, liveLabel, approvedAt }, index): PriorityItem => {
      const shown = updatesGroup.rows[index]!;
      return {
        key: `correction-${update.id}`,
        when: {
          big: shown.when.big,
          relative: waitingSince(approvedAt ?? update.updatedAt),
          calm: true,
        },
        kind: { icon: 'edit', label: PRIORITY_KINDS.correction },
        title: correctionTitle(experimentName),
        description: correctionPriorityLine(update.versionLabel, approvedAt, liveLabel),
        action: {
          href: shown.action.href,
          label: shown.action.label,
          accessibleName: shown.action.accessibleName,
        },
      };
    }),
  ].map((item, index) =>
    index === 0 ? { ...item, action: { ...item.action, variant: 'primary' as const } } : item,
  );
  const taken: Partial<Record<OverviewGroupKey, number>> = {
    accessEnding: ending.length,
    updates: corrections.length,
  };
  const rest = groups.flatMap((group) => {
    const shownAbove = taken[group.key] ?? 0;
    if (group.count - shownAbove <= 0) return [];
    return [{ ...group, rows: group.rows.slice(shownAbove) }];
  });
  return { priority, rest };
}
