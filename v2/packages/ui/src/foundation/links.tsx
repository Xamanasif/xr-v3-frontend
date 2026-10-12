'use client';

import type { AnchorHTMLAttributes, MouseEvent, ReactNode, Ref } from 'react';

import { joinClasses } from '../internal/classes.js';
import { useLinkComponent } from '../link.js';
import { Icon } from './icon.js';

type AnchorProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href' | 'children' | 'target' | 'rel' | 'className'
>;

export interface LinkProps extends AnchorProps {
  readonly href: string;
  readonly children: ReactNode;
  /**
   * Opens in a new tab (`target="_blank"`, `rel="noopener noreferrer"`) and says so to screen
   * readers, as board 02 "Link treatment" draws it: the 16 px External link icon, then
   * `span.xr-sr` " (opens in a new tab)". The leading space is the product boards' (B1-05
   * "Open preview", B6-03 "Open web link"), so the name reads "… link (opens in a new tab)".
   */
  readonly external?: boolean;
  /** Board context classes (`xr-row-link`, …) or apps/web composition utilities. */
  readonly className?: string;
  readonly ref?: Ref<HTMLAnchorElement>;
}

/**
 * An inline link (board 02 "Links and focus": `a` #1F4FD8, underline offset 3, navy on hover —
 * all from `xr-foundation.css`), rendered by the injected link component (Appendix E §2.6).
 */
export function Link({ href, children, external = false, className, ref, ...rest }: LinkProps) {
  const LinkComponent = useLinkComponent();
  return (
    <LinkComponent
      {...rest}
      ref={ref}
      className={className}
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
    >
      {children}
      {external && (
        <>
          <Icon name="externalLink" size={16} />
          <span className="xr-sr"> (opens in a new tab)</span>
        </>
      )}
    </LinkComponent>
  );
}

export interface BackLinkProps extends AnchorProps {
  readonly href: string;
  /**
   * The destination's name — "Students", "Review queue", "Requests" — never "Back" (board 03
   * "Back link": "Back link names the destination, not “Back”").
   */
  readonly children: ReactNode;
  readonly className?: string;
  readonly ref?: Ref<HTMLAnchorElement>;
}

/**
 * The back link to a detail page's list (`a.xr-back`; boards 02, 03 "Back link", 09a, 11 and
 * 433 product-board instances): the board-02 Back icon (`M14.5 6 8.5 12l6 6`), then the
 * destination.
 */
export function BackLink({ href, children, className, ref, ...rest }: BackLinkProps) {
  const LinkComponent = useLinkComponent();
  return (
    <LinkComponent {...rest} ref={ref} className={joinClasses('xr-back', className)} href={href}>
      <Icon name="back" />
      {children}
    </LinkComponent>
  );
}

export interface JumpLinkProps extends Omit<AnchorProps, 'onClick'> {
  /**
   * The id of the decision panel focus moves to. The target must be focusable without being a
   * tab stop: `aside.xr-dpanel` with `tabindex="-1"`, as boards 09a, 11 and B1-11 draw it.
   */
  readonly targetId: string;
  /** The boards draw "Go to decision" on every instance (09a, 11, B1-11 … B7-12). */
  readonly children?: ReactNode;
  readonly onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  readonly className?: string;
  readonly ref?: Ref<HTMLAnchorElement>;
}

/**
 * The "Go to decision" jump link (`a.xr-jump`): shown only while the decision panel sits below
 * the content (`@container xr-content (min-width:860px){ .xr-jump{display:none} }`), and moves
 * focus to the panel (board 13 "Mobile decision shortcut"; Appendix E §5.4), not only the
 * scroll position. A modified click (new tab or window) keeps the browser's own behaviour.
 */
export function JumpLink({
  targetId,
  children = 'Go to decision',
  className,
  onClick,
  ref,
  ...rest
}: JumpLinkProps) {
  const LinkComponent = useLinkComponent();
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const target = event.currentTarget.ownerDocument.getElementById(targetId);
    if (!target) return;
    event.preventDefault();
    target.focus();
  };
  return (
    <LinkComponent
      {...rest}
      ref={ref}
      className={joinClasses('xr-jump', className)}
      href={`#${targetId}`}
      onClick={handleClick}
    >
      {children}
      <Icon name="chevronDown" />
    </LinkComponent>
  );
}
