'use client';

import { SectionTabs } from '@xr/ui';

import { OPERATIONS_PAGE } from '@/copy/operations';
import { OPERATIONS_TABS } from '@/nav/operations';

export type OperationsTabKey = (typeof OPERATIONS_TABS)[number]['key'];

/**
 * The Operations tabs (rule T1: links, one page each) — Device transfers · Support · Access
 * ending, the current one `aria-current="page"` — as B7-09 draws them on all three lists (f0, f4,
 * f7): `nav.xr-tabs.xr-tabs--on-white[aria-label="Operations"]` with `margin-bottom:20px` and the
 * 20 px spacer after it (40 px to the list). SA-18 (Phase 3) now renders all three too: its
 * Support and Access ending targets are built (state-copy `SA-18.tabs`).
 */
export function OperationsTabs({ current }: { readonly current: OperationsTabKey }) {
  return (
    <SectionTabs
      className="mb-10"
      surface="white"
      label={OPERATIONS_PAGE.tabsLabel}
      tabs={OPERATIONS_TABS.map((tab) => ({
        href: tab.href,
        label: OPERATIONS_PAGE.tabs[tab.key],
        current: tab.key === current,
      }))}
    />
  );
}
