'use client';

import type { MouseEvent } from 'react';

import { useLinkComponent } from '../link.js';

export interface SkipLinkProps {
  /**
   * The id of the page's `main` (`main.xr-page#main`, board 05). The target carries
   * `tabIndex={-1}` so focus can move to it (Appendix E §3.1 SkipLink, PROVISIONAL).
   */
  readonly targetId?: string;
}

/**
 * "Skip to main content" (`a.xr-skip`; boards 05 and 12 "Shell tab order": the first stop,
 * visible when focused, WCAG 2.4.1). Placed first inside `div.xr-app`, which positions it; the
 * sheet keeps it above the frame (`top:-80px`) until it has focus (`top:12px`).
 *
 * Activation moves focus into the target itself, so the next Tab continues from the main content
 * whatever the injected link component does with an in-page address. A target without a
 * `tabindex` cannot take focus, so then the browser's own fragment navigation is left to run.
 */
export function SkipLink({ targetId = 'main' }: SkipLinkProps) {
  const Link = useLinkComponent();
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = event.currentTarget.ownerDocument.getElementById(targetId);
    if (!target?.hasAttribute('tabindex')) return;
    event.preventDefault();
    target.focus();
  };
  return (
    <Link className="xr-skip" href={`#${targetId}`} onClick={handleClick}>
      Skip to main content
    </Link>
  );
}
