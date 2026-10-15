'use client';

import { Notice } from '@xr/ui';

import { stateWords } from '@/copy/state-copy';
import { useCurrentSession } from '@/queries/session';

/**
 * Whether the Institute Admin's institution is paused, as the session reads it now (the XS-08
 * banner fact the service derives on every read). People is then read-only (B2-01 f5 "no actions
 * while paused"; state-copy `IA-06.paused.actions`): the screens hide their writes — the service
 * refuses every one of them `institution-paused` all the same.
 */
export function useInstitutionPaused(): boolean {
  const session = useCurrentSession();
  if (!session.data?.ok) return false;
  return session.data.value?.banners.includes('institution-paused') === true;
}

/** The read-only notice while paused (B2-04's paused notice: warn tone, the Read-only lock). */
export function PausedNotice({ className }: { readonly className?: string }) {
  return (
    <div className={className}>
      <Notice tone="warn" icon="readOnly" title={stateWords('IA-06.paused.title')}>
        {stateWords('IA-06.paused.line')}
      </Notice>
    </div>
  );
}
