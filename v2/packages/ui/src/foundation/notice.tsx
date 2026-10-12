'use client';

import type { HTMLAttributes, ReactNode, Ref } from 'react';

import type { IconName } from '../icons/registry.js';
import { joinClasses } from '../internal/classes.js';
import { Icon } from './icon.js';
import { NOTICE_TONE_ICONS, type NoticeTone } from './notice-tones.js';

// The tones and their icons are plain data, so they live in notice-tones.ts (no 'use client').
export type { NoticeTone } from './notice-tones.js';

export interface NoticeProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'title' | 'role' | 'children' | 'className'
> {
  readonly tone?: NoticeTone;
  /** What happened (`span.xr-notice-title`). */
  readonly title?: ReactNode;
  /** What you can do next, in plain words (the body `span`). */
  readonly children?: ReactNode;
  /** One or two next steps (`div.xr-notice-actions`): a link or a small button. */
  readonly actions?: ReactNode;
  /** Another board icon for the tone (e.g. Paused on a warn notice, Person on a quiet one). */
  readonly icon?: IconName;
  /**
   * The live-region role. Default as Appendix E §5.5 and the boards: `alert` for err (failed
   * loads, save failures; 396 on the boards), `status` for every other tone (1,883). Boards 03
   * and 04 also draw `note` (static advice) and err notices with `status` (refused with reason,
   * Phase 5).
   */
  readonly role?: 'status' | 'alert' | 'note';
  /** Board context classes. */
  readonly className?: string;
  /** For a notice that is a focus target after an action (`tabIndex={-1}`, the flash pattern). */
  readonly ref?: Ref<HTMLDivElement>;
}

function present(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false && node !== '';
}

/**
 * A notice in place (`div.xr-notice`): tone icon, title, body, actions. Success is a notice in
 * place, never a toast (board 04 "Never"). For live announcements keep the notice mounted and
 * change its words (Appendix E §5.5).
 */
export function Notice({
  tone = 'info',
  title,
  children,
  actions,
  icon,
  role,
  className,
  ref,
  ...rest
}: NoticeProps) {
  return (
    <div
      className={joinClasses('xr-notice', tone !== 'info' && `xr-notice--${tone}`, className)}
      role={role ?? (tone === 'err' ? 'alert' : 'status')}
      {...rest}
      ref={ref}
    >
      <Icon name={icon ?? NOTICE_TONE_ICONS[tone]} />
      <div className="xr-notice-body">
        {present(title) && <span className="xr-notice-title">{title}</span>}
        {present(children) && <span>{children}</span>}
        {present(actions) && <div className="xr-notice-actions">{actions}</div>}
      </div>
    </div>
  );
}
