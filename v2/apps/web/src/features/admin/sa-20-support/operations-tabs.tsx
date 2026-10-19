'use client';

import { LinkTabs, PageHead } from '@xr/ui/v3';

import { weekdayDate } from '@/copy/dates';
import { OPERATIONS_PAGE } from '@/copy/operations';
import { OPERATIONS_TABS } from '@/nav/operations';
import { useSession } from '@/queries/session';

export type OperationsTabKey = (typeof OPERATIONS_TABS)[number]['key'];

/**
 * The Operations page's head and its tabs, the same on the three lists (the Super Admin export's
 * `opsHead`, SA-v1 `sa-views-d.js`): the date line (phones; the shell's top line shows it on wider
 * screens), the H1 "Operations" that takes focus with the route, its line, then the page tabs —
 * Device transfers · Support · Access ending, links, the current one `aria-current="page"`
 * (`nav.rk-tabs.sa-tabs`).
 */
export function OperationsHead({ current }: { readonly current: OperationsTabKey }) {
  const session = useSession();
  // Today on the sample clock: the session's sign-in instant (state-copy `SA-01.today`).
  const today = session.status === 'signed-in' ? session.signedInAt : null;
  return (
    <>
      <PageHead
        title={OPERATIONS_PAGE.title}
        titleId="page-h1"
        titleFocusTarget
        date={today ? weekdayDate(today) : undefined}
        lead={OPERATIONS_PAGE.lead}
      />
      <LinkTabs
        pageTabs
        label={OPERATIONS_PAGE.tabsLabel}
        tabs={OPERATIONS_TABS.map((tab) => ({
          href: tab.href,
          label: OPERATIONS_PAGE.tabs[tab.key],
          current: tab.key === current,
        }))}
      />
    </>
  );
}
