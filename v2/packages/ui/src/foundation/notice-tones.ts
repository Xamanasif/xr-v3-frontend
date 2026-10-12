import type { IconName } from '../icons/registry.js';

/*
 * Plain data for Notice, kept out of the 'use client' notice.tsx: in a Server Component every
 * export of a 'use client' module is a client reference, so a constant read there on the server
 * would silently be a function, not this record.
 */

/** `xr-notice` (info) and its four modifiers (boards 03, 04, 08; Appendix E §3.1 Notice). */
export type NoticeTone = 'info' | 'ok' | 'warn' | 'err' | 'quiet';

/**
 * The icon each tone carries on the product boards (counted over all 128 boards): info and
 * quiet the Info circle (325, 78), ok the Done tick (241), warn the Warning triangle (327), err
 * the Failed circle (173). Boards 03 and 04 draw ok with the Reviewed-by-me circle tick (4) and
 * board 03 warn with the Attention triangle (1); pass `icon` to reproduce them.
 */
export const NOTICE_TONE_ICONS: Readonly<Record<NoticeTone, IconName>> = {
  info: 'info',
  ok: 'done',
  warn: 'warning',
  err: 'failed',
  quiet: 'info',
};
