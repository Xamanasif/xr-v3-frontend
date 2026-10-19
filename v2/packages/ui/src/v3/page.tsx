'use client';

import { Fragment, type ReactNode, type Ref } from 'react';

import { joinClasses } from '../internal/classes.js';
import { useLinkComponent } from '../link.js';
import { Glyph } from './icons.js';

export interface BreadcrumbLevel {
  readonly label: string;
  readonly href: string;
}

export interface BreadcrumbsProps {
  /** The levels above this page, top first: [{ label: 'Requests', href: '/admin/requests' }]. */
  readonly levels: readonly BreadcrumbLevel[];
  /** This page (`span[aria-current=page]`): the record's name. */
  readonly current: ReactNode;
  /**
   * 12 px above what follows instead of the column gap (`rk-x-crumbs-tight`, V3P-11): the XS
   * "Report sent" confirmation, which the export draws with an inline negative margin.
   */
  readonly tight?: boolean;
}

/** The breadcrumb trail of a record page (`nav.rk-crumbs`; SA-03). */
export function Breadcrumbs({ levels, current, tight = false }: BreadcrumbsProps) {
  const Link = useLinkComponent();
  return (
    <nav className={joinClasses('rk-crumbs', tight && 'rk-x-crumbs-tight')} aria-label="Breadcrumb">
      {levels.map((level) => (
        <Fragment key={level.href}>
          <Link href={level.href}>{level.label}</Link>
          <Glyph name="chevronRight" />
        </Fragment>
      ))}
      <span aria-current="page">{current}</span>
    </nav>
  );
}

export interface PageHeadProps {
  /** The one H1 of the page. */
  readonly title: ReactNode;
  readonly titleId?: string;
  /**
   * `page` (`h1.rb-h1`, 40/46 — a list or workspace page) or `record` (`h1.rk-title`, 38/44 — a
   * record or decision page; SA-03).
   */
  readonly variant?: 'page' | 'record';
  /** The H1 takes focus after a navigation or an action: `tabIndex={-1}`; focus it via `titleRef`. */
  readonly titleFocusTarget?: boolean;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /**
   * The focus ring hugs the title instead of the whole row (`xs-fit`, the Entry & shared export's
   * headings that take focus after a navigation).
   */
  readonly titleFit?: boolean;
  /**
   * The date on phones (`p.rb-eyebrow-date`; the top bar shows it on wider screens). From the
   * application's clock, never a constant.
   */
  readonly date?: ReactNode;
  /** The record kind above a record title (`p.rk-eyebrow`): "Institutional access request". */
  readonly eyebrow?: ReactNode;
  /** One line under the title (`p.rk-sub`). */
  readonly lead?: ReactNode;
  /** `div.rk-meta`: the status pill, then plain facts; separate groups with `MetaSeparator`. */
  readonly meta?: ReactNode;
  /** `div.rk-head-act`: at most one primary action, drawn last. */
  readonly actions?: ReactNode;
  /** Before the head: the breadcrumb trail of a record page. */
  readonly breadcrumbs?: ReactNode;
  /**
   * "Go to decision" (`a.rb-btn.rk-goto`): shown under 860 px of page width, where the decision
   * panel moves below the details. Its target is the panel's id.
   */
  readonly goTo?: { readonly label: string; readonly targetId: string };
}

/** The thin rule between meta groups (`span.rk-meta-sep`, decorative). */
export function MetaSeparator() {
  return <span className="rk-meta-sep" aria-hidden="true" />;
}

/** The page head (`div.rk-head`; rb-kit.css PageHead): eyebrow, title, line, meta and actions. */
export function PageHead({
  title,
  titleId,
  variant = 'page',
  titleFocusTarget = false,
  titleRef,
  titleFit = false,
  date,
  eyebrow,
  lead,
  meta,
  actions,
  breadcrumbs,
  goTo,
}: PageHeadProps) {
  return (
    <>
      {breadcrumbs}
      <div className="rk-head">
        <div className="rk-head-text">
          {date ? <p className="rb-eyebrow-date">{date}</p> : null}
          {eyebrow ? <p className="rk-eyebrow">{eyebrow}</p> : null}
          <h1
            ref={titleRef}
            id={titleId}
            className={joinClasses(
              variant === 'record' ? 'rk-title' : 'rb-h1',
              titleFit && 'xs-fit',
            )}
            tabIndex={titleFocusTarget ? -1 : undefined}
          >
            {title}
          </h1>
          {lead ? <p className="rk-sub">{lead}</p> : null}
          {meta ? <div className="rk-meta">{meta}</div> : null}
        </div>
        {actions ? <div className="rk-head-act">{actions}</div> : null}
        {goTo ? (
          <a className="rb-btn rk-goto" href={`#${goTo.targetId}`}>
            {goTo.label}
          </a>
        ) : null}
      </div>
    </>
  );
}

export interface SectionHeadProps {
  readonly title: ReactNode;
  readonly titleId?: string;
  /** The quiet line beside the title (`p.rb-note`): "Oldest first in each group". */
  readonly note?: ReactNode;
  /** A link at the end of the head (e.g. "View plan ACC-0107"). */
  readonly link?: ReactNode;
}

/** A section head on the page canvas (`div.rb-sec-head` > `h2.rb-h2` + `p.rb-note`). */
export function SectionHead({ title, titleId, note, link }: SectionHeadProps) {
  return (
    <div className="rb-sec-head">
      <h2 className="rb-h2" id={titleId}>
        {title}
      </h2>
      {note ? <p className="rb-note">{note}</p> : null}
      {link}
    </div>
  );
}

export interface SurfaceProps {
  readonly children: ReactNode;
  /** `section` with a name (a list surface), or a plain `div`. */
  readonly label?: string;
  readonly labelledBy?: string;
  /** A Refined B context class (`rk-mainsheet`, `rk-listsurface`). */
  readonly className?: string;
  /** While a list loads (`aria-busy`). */
  readonly busy?: boolean;
}

/** The white surface (`.rk-surface`): one bordered sheet, never a grid of cards. */
export function Surface({ children, label, labelledBy, className, busy }: SurfaceProps) {
  const classes = joinClasses('rk-surface', className);
  if (label || labelledBy) {
    return (
      <section
        className={classes}
        aria-label={label}
        aria-labelledby={labelledBy}
        aria-busy={busy || undefined}
      >
        {children}
      </section>
    );
  }
  return (
    <div className={classes} aria-busy={busy || undefined}>
      {children}
    </div>
  );
}

export interface SurfaceSectionProps {
  readonly title: ReactNode;
  readonly titleId: string;
  /** Beside the heading (`div.rk-sec-h`): a key, a note, a link. */
  readonly aside?: ReactNode;
  readonly children: ReactNode;
}

/** A section of a surface (`section.rk-sec` > `div.rk-sec-h` > `h2.rb-h2`). */
export function SurfaceSection({ title, titleId, aside, children }: SurfaceSectionProps) {
  return (
    <section className="rk-sec" aria-labelledby={titleId}>
      <div className="rk-sec-h">
        <h2 className="rb-h2" id={titleId}>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Two columns on wide pages (`div.rb-split`), one column when `calm` or under 940 px. */
export function Split({
  calm = false,
  children,
}: {
  readonly calm?: boolean;
  readonly children: ReactNode;
}) {
  return <div className={joinClasses('rb-split', calm && 'rb-split--calm')}>{children}</div>;
}

/** Words only assistive technology reads (`span.xr-sr`): "Access plan " before a plan's name. */
export function VisuallyHidden({ children }: { readonly children: ReactNode }) {
  return <span className="xr-sr">{children}</span>;
}

/**
 * A heading only assistive technology reads (`h2.xr-sr`): names a list whose visible title is the
 * page's ("Experiments in your access plan"; SA-01's chosen category).
 */
export function HiddenHeading({
  id,
  level = 2,
  children,
}: {
  readonly id?: string;
  readonly level?: 2 | 3;
  readonly children: ReactNode;
}) {
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <Heading className="xr-sr" id={id}>
      {children}
    </Heading>
  );
}
