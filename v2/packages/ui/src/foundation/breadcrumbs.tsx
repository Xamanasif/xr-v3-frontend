'use client';

import { useLinkComponent } from '../link.js';

/** One level above the current page: its name and address. */
export interface BreadcrumbLevel {
  readonly label: string;
  readonly href: string;
}

export interface BreadcrumbsProps {
  /** The levels above the current page, outermost first ("People", "Students"). May be empty. */
  readonly trail: readonly BreadcrumbLevel[];
  /** The current page's name ("Rahul Verma"): drawn as `span[aria-current="page"]`, not a link. */
  readonly current: string;
}

/**
 * Top-bar breadcrumbs (`ol.xr-crumbs`, labelled "You are here"; boards 03 "Top-bar breadcrumbs",
 * 05, B2-05). Every ancestor is a link through the injected link component, followed by the
 * hidden separator `span.xr-crumb-sep`. The sheet shows the trail only at 1024 px of app width
 * and up (the top bar shows the page title below that); the shell decides when a page is deep
 * enough for a trail (board 03: "Breadcrumbs appear only from two levels deep"). The public
 * `xp-crumbs` is Phase 1 (G-8).
 */
export function Breadcrumbs({ trail, current }: BreadcrumbsProps) {
  const Link = useLinkComponent();
  return (
    <ol className="xr-crumbs" aria-label="You are here">
      {trail.map((level, index) => (
        <li key={`${index}-${level.href}`}>
          <Link href={level.href}>{level.label}</Link>
          <span className="xr-crumb-sep" aria-hidden="true">
            /
          </span>
        </li>
      ))}
      <li>
        <span aria-current="page">{current}</span>
      </li>
    </ol>
  );
}
