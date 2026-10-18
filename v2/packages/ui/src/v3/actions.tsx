'use client';

import type { ButtonHTMLAttributes, MouseEvent, ReactNode, Ref } from 'react';

import { joinClasses } from '../internal/classes.js';
import { useLinkComponent, type LinkRenderProps } from '../link.js';
import { Icon, type V3IconName, type V3IconSize } from './icons.js';

/**
 * The Refined B button variants (rb.css): `default` (white, outlined), `primary` (gold — the one
 * primary action of a view), `navy` (identity actions such as "Request renewal") and `ghost`
 * (a quiet row action). Migrating a v46 screen: `secondary` → `default`, `text` → `ghost`; Refined
 * B draws no danger variant yet (a role export that needs one adds it centrally).
 */
export type ButtonVariant = 'default' | 'primary' | 'navy' | 'ghost';

interface ButtonLookProps {
  readonly variant?: ButtonVariant;
  /** `rb-btn--lg` (46 px). */
  readonly size?: 'lg';
  readonly icon?: V3IconName;
  readonly iconSize?: V3IconSize;
  readonly iconPosition?: 'start' | 'end';
  /** A Refined B context class (`rk-go`, `rk-toggle`, `rk-goto`, …). */
  readonly className?: string;
}

function buttonClasses({ variant = 'default', size, className }: ButtonLookProps): string {
  return joinClasses(
    'rb-btn',
    variant !== 'default' && `rb-btn--${variant}`,
    size === 'lg' && 'rb-btn--lg',
    className,
  );
}

function withIcon(
  children: ReactNode,
  { icon, iconSize = 18, iconPosition = 'start' }: ButtonLookProps,
): ReactNode {
  if (!icon) return children;
  const glyph = <Icon name={icon} size={iconSize} />;
  return iconPosition === 'start' ? (
    <>
      {glyph}
      {children}
    </>
  ) : (
    <>
      {children}
      {glyph}
    </>
  );
}

export interface ButtonProps
  extends
    Omit<
      ButtonHTMLAttributes<HTMLButtonElement>,
      'type' | 'children' | 'className' | 'aria-disabled' | 'aria-busy'
    >,
    ButtonLookProps {
  /** The label: verb + object ("Give access"). */
  readonly children: ReactNode;
  readonly type?: 'button' | 'submit';
  /**
   * Busy: the press is ignored and `busyLabel` says what is happening ("Approving…"); the button
   * is `aria-disabled`. Refined B draws no busy look, so only the words change (ADR-0010).
   */
  readonly busy?: boolean;
  readonly busyLabel?: ReactNode;
  readonly ref?: Ref<HTMLButtonElement>;
}

/** The Refined B button (`button.rb-btn`; rb.css). */
export function Button({
  variant,
  size,
  icon,
  iconSize,
  iconPosition,
  className,
  children,
  type = 'button',
  busy = false,
  busyLabel,
  onClick,
  ref,
  ...rest
}: ButtonProps) {
  const look = { variant, size, icon, iconSize, iconPosition, className };
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (busy) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      className={buttonClasses(look)}
      aria-disabled={busy ? true : undefined}
      onClick={handleClick}
    >
      {busy ? (busyLabel ?? children) : withIcon(children, look)}
    </button>
  );
}

export interface ButtonLinkProps extends Omit<LinkRenderProps, 'className'>, ButtonLookProps {
  readonly children: ReactNode;
}

/** A destination drawn as a button (`a.rb-btn`): "Open requests", "View plan". */
export function ButtonLink({
  variant,
  size,
  icon,
  iconSize,
  iconPosition,
  className,
  children,
  ...link
}: ButtonLinkProps) {
  const Link = useLinkComponent();
  const look = { variant, size, icon, iconSize, iconPosition, className };
  return (
    <Link {...link} className={buttonClasses(look)}>
      {withIcon(children, look)}
    </Link>
  );
}

export interface TextLinkProps extends Omit<LinkRenderProps, 'className'> {
  readonly children: ReactNode;
}

/** The Refined B text link (`a.rb-link`): "Open Requests", "View plan ACC-0107". */
export function TextLink({ children, ...link }: TextLinkProps) {
  const Link = useLinkComponent();
  return (
    <Link {...link} className="rb-link">
      {children}
    </Link>
  );
}
