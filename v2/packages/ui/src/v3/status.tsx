import type { ReactNode } from 'react';

import type { StatusTone as V46StatusTone } from '../foundation/status-pill.js';
import { joinClasses } from '../internal/classes.js';

/**
 * The Refined B status grammar (core.css `xr-st`; rb-kit.css `rk-st-ended`): colour and shape
 * together, the words always present. `info` ring, `ok` tick, `warn` half disc, `err` diamond,
 * `paused` outlined navy bars, `ended` outlined grey dash, `neutral` grey dot.
 */
export type StatusTone = 'neutral' | 'info' | 'ok' | 'warn' | 'err' | 'paused' | 'ended';

/**
 * The v46 tone a screen already chooses, in the Refined B grammar: `wait` (gold, waiting) is the
 * half-disc `warn`, `off` (not available) the outlined `ended`. `live` has no Refined B drawing
 * yet, so it is not mapped: a role export that needs it adds it centrally.
 */
export function toV3Tone(tone: Exclude<V46StatusTone, 'live'>): StatusTone {
  if (tone === 'wait') return 'warn';
  if (tone === 'off') return 'ended';
  return tone;
}

export interface StatusPillProps {
  readonly tone: StatusTone;
  /** The status in words — always present, role-relative, from the caller. */
  readonly children: ReactNode;
  /** `rk-st-lg`: the larger pill of a record head and a decision outcome. */
  readonly size?: 'lg';
}

/** The status pill (`span.xr-st`): the shape marker (`i`) and the words. */
export function StatusPill({ tone, children, size }: StatusPillProps) {
  return (
    <span
      className={joinClasses(
        'xr-st',
        tone !== 'neutral' && tone !== 'ended' && `xr-st--${tone}`,
        tone === 'ended' && 'rk-st-ended',
        size === 'lg' && 'rk-st-lg',
      )}
    >
      <i />
      {children}
    </span>
  );
}
