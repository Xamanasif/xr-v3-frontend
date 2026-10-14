'use client';

import { Button, FormatBadge, Icon, type IconName, Link } from '@xr/ui';
import { FORMAT_META, type Technology } from '@xr/domain';
import type { ReactNode } from 'react';

/**
 * Pieces every public page draws the same way (B1-01 … B1-05; `xr-public.css`): the format chips
 * with "Available in", the inner-page header with its breadcrumb and facts, and the empty and
 * failed blocks. The boards' inline styles become composition utilities on the 4 px scale and
 * token colours (ADR-0001 §4); nothing here holds data.
 */

/** `span.xp-fmts` — "Available in" + compact chips (B1-03 / B1-04 rows), or on navy (B1-05 hero). */
export function FormatChips({
  formats,
  label,
  variant = 'compact',
}: {
  readonly formats: readonly Technology[];
  /** "Available in" before the chips, where the board draws it. */
  readonly label?: string;
  readonly variant?: 'compact' | 'on-dark';
}) {
  return (
    <span className="xp-fmts">
      {label ? <span className="xp-fmts-label">{label}</span> : null}
      {formats.map((format) =>
        variant === 'on-dark' ? (
          <FormatBadge key={format} format={FORMAT_META[format].code} variant="on-dark" />
        ) : (
          <FormatBadge key={format} format={FORMAT_META[format].code} compact />
        ),
      )}
    </span>
  );
}

export interface Crumb {
  readonly label: string;
  /** The level's page; the last level (the page itself) has none. */
  readonly href?: string;
}

/** `nav aria-label="Breadcrumb" > ol.xp-crumbs` (B1-03, B1-04, B1-05). */
export function Crumbs({ trail }: { readonly trail: readonly Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="xp-crumbs">
        {trail.map((crumb, index) =>
          crumb.href && index < trail.length - 1 ? (
            <li key={`${index}-${crumb.label}`}>
              <Link href={crumb.href}>{crumb.label}</Link>
              <span className="xp-crumb-sep" aria-hidden="true">
                /
              </span>
            </li>
          ) : (
            <li key={`${index}-${crumb.label}`}>
              <span aria-current="page">{crumb.label}</span>
            </li>
          ),
        )}
      </ol>
    </nav>
  );
}

export interface Fact {
  readonly term: string;
  readonly value: ReactNode;
}

/** `dl.xp-facts` (B1-03 headers: "Areas 3 · Courses 5 · Experiments 12"). */
export function Facts({ facts }: { readonly facts: readonly Fact[] }) {
  return (
    <dl className="xp-facts">
      {facts.map((fact) => (
        <div className="xp-fact" key={fact.term}>
          <dt>{fact.term}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The drawn failed block (B1-03 "All areas · failed + retry", B1-04 "Failed + retry"): the error
 * icon on its tint, the heading, the sentence, Try again — and the way forward the board adds.
 */
export function FailedBlock({
  title,
  line,
  onRetry,
  retryLabel,
  forward,
  compact = false,
}: {
  readonly title: string;
  readonly line: string;
  readonly onRetry: () => void;
  readonly retryLabel: string;
  /** B1-03 "A way forward even when this list fails": a link beside Try again. */
  readonly forward?: { readonly href: string; readonly label: string };
  /** B1-03's padded variant (`xr-section` 32 px, `xr-empty` flush) with the actions in a row. */
  readonly compact?: boolean;
}) {
  const retry = (
    <Button variant="primary" icon="tryAgain" onClick={onRetry}>
      {retryLabel}
    </Button>
  );
  return (
    <div className={compact ? 'xr-section p-8' : 'xr-section'}>
      <div className={compact ? 'xr-empty p-0' : 'xr-empty'}>
        <span className="xr-empty-icon bg-err-bg text-err">
          <Icon name="failed" />
        </span>
        <h2 className="xp-h3">{title}</h2>
        <p className="xr-body">{line}</p>
        {forward ? (
          <div className="xr-msg-actions mt-0">
            {retry}
            <Link href={forward.href}>{forward.label}</Link>
          </div>
        ) : (
          retry
        )}
      </div>
    </div>
  );
}

/** The drawn empty block (B1-04 "No results", B1-03 "Course · nothing published yet"). */
export function EmptyBlock({
  icon,
  title,
  line,
  action,
}: {
  readonly icon: IconName;
  readonly title: string;
  readonly line: string;
  /** A secondary button (a command) or a secondary link button (a page). */
  readonly action:
    | { readonly kind: 'button'; readonly label: string; readonly onClick: () => void }
    | { readonly kind: 'link'; readonly label: string; readonly href: string };
}) {
  return (
    <div className="xr-section">
      <div className="xr-empty">
        <span className="xr-empty-icon">
          <Icon name={icon} />
        </span>
        <h2 className="xp-h3">{title}</h2>
        <p className="xr-body">{line}</p>
        {action.kind === 'button' ? (
          <Button variant="secondary" onClick={action.onClick}>
            {action.label}
          </Button>
        ) : (
          <Link className="xr-btn xr-btn--secondary" href={action.href}>
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}

/** A link styled as the boards' arrow link (`a.xp-more` + the next arrow). */
export function MoreLink({
  href,
  children,
  arrow = true,
  className,
}: {
  readonly href: string;
  readonly children: ReactNode;
  readonly arrow?: boolean;
  readonly className?: string;
}) {
  return (
    <Link className={className ? `xp-more ${className}` : 'xp-more'} href={href}>
      {children}
      {arrow ? (
        <>
          {' '}
          <Icon name="next" />
        </>
      ) : null}
    </Link>
  );
}

/** A primary call to action with the trailing arrow (`a.xr-btn.xr-btn--primary` … `→`). */
export function ArrowButtonLink({
  href,
  children,
  className,
}: {
  readonly href: string;
  readonly children: ReactNode;
  readonly className: string;
}) {
  return (
    <Link className={className} href={href}>
      {children} <Icon name="next" />
    </Link>
  );
}
