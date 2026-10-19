'use client';

import { LinkTabs, PageHead } from '@xr/ui/v3';
import { useEffect, type RefObject } from 'react';

import { CONTENT_HEAD } from '@/copy/sa-content';
import { weekdayDate } from '@/copy/dates';
import { CONTENT_TABS } from '@/nav/admin-content';
import { useSession } from '@/queries/session';

import { MAIN_ID } from '../../shared/workspace-frame/route-focus';

/**
 * Today on the sample clock, in words ("Friday 23 October 2026"): the page head's date line on
 * phones (`p.rb-eyebrow-date`; the V3 top bar shows it from 768 px). The screens have no clock of
 * their own: it is the session's sign-in instant, as the shell's top line (state-copy
 * `SA-01.today`).
 */
export function useTodayLine(): string | undefined {
  const session = useSession();
  return session.status === 'signed-in' ? weekdayDate(session.signedInAt) : undefined;
}

/**
 * A record page's heading arrives with its record: if the route focus put focus on `main` while
 * the record was loading, it moves on to the heading once drawn (the export's "route change → page
 * heading").
 */
export function useHeadingFocusOnArrival(
  titleRef: RefObject<HTMLHeadingElement | null>,
  loaded: boolean,
): void {
  useEffect(() => {
    if (loaded && document.activeElement?.id === MAIN_ID) titleRef.current?.focus();
  }, [loaded, titleRef]);
}

/**
 * The Content destination's head and page tabs (the export's `contentHead` and `contentTabs`):
 * "Content" with its line, then "Updates · All content" — links, the current one marked.
 */
export function ContentHead({
  current,
  lead,
}: {
  readonly current: 'updates' | 'all';
  readonly lead: string;
}) {
  const today = useTodayLine();
  return (
    <>
      <PageHead title={CONTENT_HEAD.title} titleFocusTarget date={today} lead={lead} />
      <LinkTabs
        label={CONTENT_HEAD.tabsLabel}
        pageTabs
        tabs={CONTENT_TABS.map((tab) => ({
          href: tab.href,
          label: CONTENT_HEAD.tabs[tab.key],
          current: tab.key === current,
        }))}
      />
    </>
  );
}
