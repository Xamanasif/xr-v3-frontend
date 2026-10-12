'use client';

import type { HTMLAttributes, ReactNode, Ref } from 'react';

import type { IconName } from '../icons/registry.js';
import { joinClasses } from '../internal/classes.js';
import { Icon } from './icon.js';
import { Link } from './links.js';

/** A message-page link: where it goes, named by its destination ("Back to My courses"). */
export interface MessageAction {
  readonly href: string;
  readonly label: ReactNode;
}

export interface MessagePageProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'title' | 'children' | 'className' | 'role'
> {
  /**
   * The decorative icon in the 48 px circle; its shape matches the status tone (board 08
   * "Anatomy" 1): Not available (minus), Search (not found), Read-only (lock, not your
   * workspace), Paused, Waiting (clock, ended), Done (tick, confirmation).
   */
  readonly icon: IconName;
  /**
   * 24 (`xr-ico--24`), as boards 08 and 09b draw it, or 20 (the default icon size), as the
   * in-place confirmations of the product boards draw it (B3-06, B3-08, B4-12, B5-03).
   */
  readonly iconSize?: 20 | 24;
  /** What happened, in plain words: the page's only H1 (`h1.xr-msg-title`). */
  readonly title: ReactNode;
  /** One sentence: why, and what still holds ("your work is kept"); a reference on confirmations. */
  readonly children: ReactNode;
  /**
   * The sentence as `p.xr-lead` instead of `p.xr-body`: the product-board confirmations draw
   * it so (B2-05, B3-08, B4-12, B4-13, B5-03); boards 08 and 09b draw `xr-body`.
   */
  readonly lead?: boolean;
  /** The one primary action, always a way forward, named by its destination. */
  readonly action: MessageAction;
  /** The quiet link: "Help" where the person may need it (board 08), or a second destination (09b). */
  readonly secondary?: MessageAction;
  /**
   * How the quiet link looks: a plain link (boards 08, 09b) or a text button
   * (`xr-btn xr-btn--text`; B2-05, B4-12, B5-03).
   */
  readonly secondaryVariant?: 'link' | 'text';
  /** Board context or apps/web composition (the boards place the column with inline margins). */
  readonly className?: string;
  /**
   * A confirmation shown in place of a form is the focus target after the action: give it an
   * `id` and `tabIndex={-1}` and move focus to it, as B3-06, B3-08, B4-12 and B5-03 draw it
   * (`div.xr-msg id="Ta-done" tabindex="-1"`; Appendix E §8 "focus moves to the result").
   */
  readonly ref?: Ref<HTMLDivElement>;
}

/**
 * The message page (AR-10, GL-04; boards 08, 09b): not available, not your workspace (XS-06),
 * not found (PU-15), paused / ended, and confirmations with a reference. One icon, one H1, one
 * sentence, one primary action, quiet Help. Never route names, role codes or status codes
 * (board 08 "Rules"). Rendered inside the shell (nothing current in the sidebar) or under the
 * public header.
 */
export function MessagePage({
  icon,
  iconSize = 24,
  title,
  children,
  lead = false,
  action,
  secondary,
  secondaryVariant = 'link',
  className,
  ref,
  ...rest
}: MessagePageProps) {
  return (
    <div className={joinClasses('xr-msg', className)} {...rest} ref={ref}>
      <span className="xr-msg-icon">
        <Icon name={icon} size={iconSize} />
      </span>
      <h1 className="xr-msg-title">{title}</h1>
      <p className={lead ? 'xr-lead' : 'xr-body'}>{children}</p>
      <div className="xr-msg-actions">
        <Link className="xr-btn xr-btn--primary" href={action.href}>
          {action.label}
        </Link>
        {secondary && (
          <Link
            className={secondaryVariant === 'text' ? 'xr-btn xr-btn--text' : undefined}
            href={secondary.href}
          >
            {secondary.label}
          </Link>
        )}
      </div>
    </div>
  );
}
