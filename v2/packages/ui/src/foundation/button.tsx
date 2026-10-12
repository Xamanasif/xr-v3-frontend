'use client';

import type { ButtonHTMLAttributes, MouseEvent, ReactNode, Ref } from 'react';

import type { IconName } from '../icons/registry.js';
import { joinClasses } from '../internal/classes.js';
import { Icon, type IconSize } from './icon.js';

export type ButtonVariant =
  'primary' | 'secondary' | 'text' | 'danger' | 'danger-quiet' | 'on-dark';

export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'children' | 'aria-disabled' | 'aria-busy'
> {
  /**
   * primary (gold, one per screen) · secondary (navy outline) · text · danger (only where
   * authorised, always confirms) · danger-quiet (opens a confirm) · on-dark (board 03 "Actions").
   */
  readonly variant: ButtonVariant;
  /** The label: verb + object ("Give access"). */
  readonly children: ReactNode;
  /** `xr-btn--sm` (36 px). */
  readonly size?: 'sm';
  /** `xr-btn--block` (full width). */
  readonly block?: boolean;
  readonly type?: 'button' | 'submit';
  /**
   * Busy, as the product boards draw it (590 instances, e.g. B2-05): `is-busy`,
   * `aria-disabled="true"`, a spinner and `busyLabel` saying what is happening
   * ("Giving access…"). Presses are ignored while busy, including form submission.
   */
  readonly busy?: boolean;
  readonly busyLabel?: ReactNode;
  readonly icon?: IconName;
  /** The boards draw the icon before the label, except "Review request ›"-style buttons. */
  readonly iconPosition?: 'start' | 'end';
  readonly iconSize?: IconSize;
  /** Board context classes (`xg-del`, `xp-cta`, …) or apps/web composition utilities. */
  readonly className?: string;
  readonly ref?: Ref<HTMLButtonElement>;
}

/** The v46 button (`xr-btn`; boards 03 and 10). */
export function Button({
  variant,
  children,
  size,
  block = false,
  type = 'button',
  busy = false,
  busyLabel,
  icon,
  iconPosition = 'start',
  iconSize,
  className,
  onClick,
  ref,
  ...rest
}: ButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (busy) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  const glyph = icon ? <Icon name={icon} size={iconSize} /> : null;
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      className={joinClasses(
        'xr-btn',
        `xr-btn--${variant}`,
        size === 'sm' && 'xr-btn--sm',
        block && 'xr-btn--block',
        className,
        busy && 'is-busy',
      )}
      aria-disabled={busy ? true : undefined}
      onClick={handleClick}
    >
      {busy ? (
        <>
          <span className="xr-spin" aria-hidden="true" />
          {busyLabel ?? children}
        </>
      ) : (
        <>
          {iconPosition === 'start' && glyph}
          {children}
          {iconPosition === 'end' && glyph}
        </>
      )}
    </button>
  );
}
