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
  /**
   * The icon circle's tint (board 08 "The family": the circle takes the status tone). `neutral` is
   * the v46 default (`#EEF0F8` / `#141B5E`: not found, not your workspace, not available); `ok` is
   * the confirmation tint board 07 "State 1c · Sent · reference" and board 08 "Short success
   * confirmation" draw inline (`#E8F4EC` / `#1D6B45`): `span.xr-msg-icon.xr-x-msg-icon--ok`
   * (PF-15). The amber "Access paused" tint comes with its screen (ST-19, Phase 2).
   */
  readonly tone?: 'neutral' | 'ok';
  /**
   * Where the column sits. `centered` is the v46 default (`margin: 40px auto`; board 07 "State 1c ·
   * Sent · reference", board 09b). `shell` is a refusal or absence in the workspace shell (board 08
   * "In context": `margin: 24px 0 0`, `8px 0 0` at 375 px — left-aligned near the top so the sidebar
   * and account menu stay usable). `public` is the public pages' placement (B1-03, B1-05:
   * `margin: 24px 0 40px`). The two product placements are PF-15 (`xr-x-msg--shell`,
   * `xr-x-msg--public`).
   */
  readonly placement?: 'centered' | 'shell' | 'public';
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
  tone = 'neutral',
  placement = 'centered',
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
    <div
      className={joinClasses(
        'xr-msg',
        placement === 'shell' && 'xr-x-msg--shell',
        placement === 'public' && 'xr-x-msg--public',
        className,
      )}
      {...rest}
      ref={ref}
    >
      <span className={joinClasses('xr-msg-icon', tone === 'ok' && 'xr-x-msg-icon--ok')}>
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
