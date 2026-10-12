import type { ReactNode } from 'react';

import type { IconName } from '../icons/registry.js';
import { joinClasses } from '../internal/classes.js';
import { Icon } from './icon.js';

/**
 * Board 04 "Status chips · tone, icon, words": neutral (`xr-status`, grey · minus), info
 * (in progress, blue · arrows), wait (gold · clock), ok (done, green · tick), err (needs
 * action, red · alert), paused (paused · held, navy outline · pause), off (not available,
 * dashed · minus), and live (navy: "marks the current published version only").
 */
export type StatusTone = 'neutral' | 'info' | 'ok' | 'wait' | 'err' | 'paused' | 'off' | 'live';

/**
 * The tone icon each tone carries on board 04, so status never rests on colour alone. Live has
 * none: the only chip the boards draw with `xr-status--live` (Main "Primary contract") has no
 * icon.
 */
export const STATUS_TONE_ICONS: Readonly<Record<StatusTone, IconName | null>> = {
  neutral: 'notAvailable',
  info: 'withAnotherRole',
  wait: 'waiting',
  ok: 'done',
  err: 'failed',
  paused: 'paused',
  off: 'notAvailable',
  live: null,
};

export interface StatusPillProps {
  readonly tone: StatusTone;
  /**
   * The status in words — always present. The words are role-relative and come from the
   * caller (apps/web `statusLabel`, B8-03 vocabulary); this component has no status vocabulary.
   */
  readonly children: ReactNode;
  /**
   * Another board icon for the tone: board 04 and 03 draw "Read-only" as a paused chip with the
   * lock (`readOnly`). `null` draws no icon, as board 03 does for "Changed" and "Not saved" in
   * its comparison and editable-table specimens.
   */
  readonly icon?: IconName | null;
  /** Board context classes. */
  readonly className?: string;
}

/** The status chip (`span.xr-status`; boards 03, 04, 12, B8-03): tone icon + words. */
export function StatusPill({ tone, children, icon, className }: StatusPillProps) {
  const glyph = icon === undefined ? STATUS_TONE_ICONS[tone] : icon;
  return (
    <span
      className={joinClasses('xr-status', tone !== 'neutral' && `xr-status--${tone}`, className)}
    >
      {glyph && <Icon name={glyph} />}
      {children}
    </span>
  );
}
