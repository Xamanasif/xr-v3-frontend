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
  /** The full width of its column (`xs-block`; the XS sign-in card). */
  readonly block?: boolean;
  readonly icon?: V3IconName;
  readonly iconSize?: V3IconSize;
  readonly iconPosition?: 'start' | 'end';
  /** A Refined B context class (`rk-go`, `rk-toggle`, `rk-goto`, …). */
  readonly className?: string;
}

function buttonClasses({ variant = 'default', size, block, className }: ButtonLookProps): string {
  return joinClasses(
    'rb-btn',
    variant !== 'default' && `rb-btn--${variant}`,
    size === 'lg' && 'rb-btn--lg',
    block && 'xs-block',
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
   * is `aria-disabled`. The foundation boards draw no busy look, so by default only the words
   * change (ADR-0010); `spinner` adds the look the XS export draws ("Signing in…", "Sending…"):
   * the turning ring before the words and the progress cursor (`xs-spin`, `xs-busy`).
   */
  readonly busy?: boolean;
  readonly busyLabel?: ReactNode;
  readonly spinner?: boolean;
  /**
   * Opt-in: how busy is said. `aria-disabled` (the default, every role): the button stays
   * focusable and ignores the press. `disabled`: as the Student export draws its launch button
   * (`button.rb-btn[disabled][aria-busy]`, ST-08 "Opening the simulation…") — `disabled` while
   * busy and `aria-busy` always said (`true` / `false`).
   */
  readonly busyAs?: 'aria-disabled' | 'disabled';
  readonly ref?: Ref<HTMLButtonElement>;
}

/** The Refined B button (`button.rb-btn`; rb.css). */
export function Button({
  variant,
  size,
  block,
  icon,
  iconSize,
  iconPosition,
  className,
  children,
  type = 'button',
  busy = false,
  busyLabel,
  spinner = false,
  busyAs = 'aria-disabled',
  onClick,
  ref,
  ...rest
}: ButtonProps) {
  const look = {
    variant,
    size,
    block,
    icon,
    iconSize,
    iconPosition,
    className: joinClasses(className, busy && spinner && 'xs-busy'),
  };
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
      aria-disabled={busy && busyAs === 'aria-disabled' ? true : undefined}
      aria-busy={busyAs === 'disabled' ? (busy ? 'true' : 'false') : undefined}
      disabled={busyAs === 'disabled' ? busy || rest.disabled : rest.disabled}
      onClick={handleClick}
    >
      {busy && spinner ? (
        <>
          <span className="xs-spin" aria-hidden="true" />
          {busyLabel ?? children}
        </>
      ) : busy ? (
        (busyLabel ?? children)
      ) : (
        withIcon(children, look)
      )}
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
  block,
  icon,
  iconSize,
  iconPosition,
  className,
  children,
  ...link
}: ButtonLinkProps) {
  const Link = useLinkComponent();
  const look = { variant, size, block, icon, iconSize, iconPosition, className };
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
