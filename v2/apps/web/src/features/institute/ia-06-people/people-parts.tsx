'use client';

import { Notice } from '@xr/ui/v3';
import { type ReactNode } from 'react';

import { PEOPLE_V3 } from '@/copy/ia-people';
import { stateWords } from '@/copy/state-copy';

/**
 * The People pages' read-only notice while the institution is paused (`div.rk-notice
 * .rk-notice--paused[role=status]` with the lock): "Read-only while your institution’s access is
 * paused" and what can be done again once BITS lifts the pause, in the screen's own words.
 */
export function PeoplePausedNotice({
  line,
  id,
}: {
  readonly line: ReactNode;
  readonly id?: string;
}) {
  return (
    <Notice
      tone="paused"
      icon="lock"
      role="status"
      title={stateWords('IA-06.paused.title')}
      id={id}
    >
      {line}
    </Notice>
  );
}

/**
 * The flash after a change on a People page (`div.rk-notice.rk-notice--ok#…[tabindex=-1]
 * [role=status]`): "Saved", what changed, and the way on where there is one ("Open the group").
 * It takes focus when it appears.
 */
export function PeopleFlash({
  id,
  children,
  action,
}: {
  readonly id: string;
  readonly children: ReactNode;
  readonly action?: ReactNode;
}) {
  return (
    <Notice tone="ok" role="status" id={id} title={PEOPLE_V3.saved} actions={action}>
      {children}
    </Notice>
  );
}
