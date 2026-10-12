'use client';

import { Children, type ReactNode } from 'react';

import type { IconName } from '../icons/registry.js';
import { joinClasses } from '../internal/classes.js';
import { useLinkComponent } from '../link.js';
import { Icon } from './icon.js';
import { Section } from './section.js';

/** A slot draws only when it holds something: `undefined`, `null`, `false` and `''` draw nothing. */
function filled(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false && node !== '';
}

/** The tint of the round row icon: `xr-row-icon--wait/err/ok/info`; none = neutral navy. */
export type RowTone = 'wait' | 'err' | 'ok' | 'info';

/** What a row says (`div.xr-row-main`): an optional leading glyph, the title and one line. */
export interface RowContentProps {
  /** `span.xr-row-title`: what needs you, or what the row is. */
  readonly title: ReactNode;
  /** `span.xr-row-sub`: why, or a short fact line ("ME ZG523 · in access plan ACC-0107"). */
  readonly sub?: ReactNode;
  /** A board-02 icon in `span.xr-row-icon` (decorative; the title carries the meaning). */
  readonly icon?: IconName;
  readonly tone?: RowTone;
  /** A leading chip instead of an icon, e.g. a FormatBadge (09a AR-4, 09b). */
  readonly lead?: ReactNode;
}

function RowMain({ title, sub, icon, tone, lead }: RowContentProps) {
  return (
    <div className="xr-row-main">
      {icon !== undefined ? (
        <span className={joinClasses('xr-row-icon', tone !== undefined && `xr-row-icon--${tone}`)}>
          <Icon name={icon} />
        </span>
      ) : null}
      {lead}
      <div className="xr-row-text">
        <span className="xr-row-title">{title}</span>
        {filled(sub) ? <span className="xr-row-sub">{sub}</span> : null}
      </div>
    </div>
  );
}

export interface RowsProps {
  /** `Row`, `AttentionItem` or `RowLink` items. */
  readonly children?: ReactNode;
  readonly className?: string;
}

/** A list of rows separated by hairlines (`ul.xr-rows`; boards 03, 05, 09a). */
export function Rows({ children, className }: RowsProps) {
  return <ul className={joinClasses('xr-rows', className)}>{children}</ul>;
}

export interface RowProps extends RowContentProps {
  /**
   * What sits at the row's end: the control that opens the row's subject, alone or in a
   * `RowEnd` with its status (09a AR-4 "Changed · View details"), or a format set (board 11).
   */
  readonly children?: ReactNode;
  readonly className?: string;
}

/** One row (`li.xr-row` > `div.xr-row-main` + end content; boards 03, 09a, 11). */
export function Row({ children, className, ...content }: RowProps) {
  return (
    <li className={joinClasses('xr-row', className)}>
      <RowMain {...content} />
      {children}
    </li>
  );
}

export interface RowEndProps {
  readonly children?: ReactNode;
}

/** A row's status and action kept together (`div.xr-row-end`; 09a AR-4, 09b). */
export function RowEnd({ children }: RowEndProps) {
  return <div className="xr-row-end">{children}</div>;
}

/** The one action of an attention item: a link drawn as a small button. */
export interface AttentionAction {
  readonly href: string;
  /** Verb + object: "Give access", "Review students", "View report". */
  readonly label: ReactNode;
  /** `xr-btn--secondary` (as drawn on 03, 09a), `--primary` or `--text` (B4-03, B6-05). */
  readonly variant?: 'secondary' | 'primary' | 'text';
}

export interface AttentionItemProps extends RowContentProps {
  /** Exactly one action, a link that opens what needs you (09a AR-1 "one action each"). */
  readonly action: AttentionAction;
}

/**
 * An attention item: what needs you, why, and one action (`li.xr-row` + `a.xr-btn.xr-btn--sm`;
 * board 03 "List rows and attention items", 09a AR-1). The action goes through the injected
 * link component.
 */
export function AttentionItem({ action, ...content }: AttentionItemProps) {
  const Link = useLinkComponent();
  return (
    <Row {...content}>
      <Link
        className={joinClasses('xr-btn', `xr-btn--${action.variant ?? 'secondary'}`, 'xr-btn--sm')}
        href={action.href}
      >
        {action.label}
      </Link>
    </Row>
  );
}

export interface RowLinkProps extends RowContentProps {
  /** Where the row goes: the whole row is one link (`a.xr-row.xr-row-link`). */
  readonly href: string;
  /** The row's end, inside the link: its status in words (board 05 "Open", "Resolved"). */
  readonly end?: ReactNode;
}

/**
 * A row that is one link (`li` > `a.xr-row.xr-row-link`; boards 05 and 07 "My reports"):
 * "Rows open the report". Rendered through the injected link component.
 */
export function RowLink({ href, end, ...content }: RowLinkProps) {
  const Link = useLinkComponent();
  return (
    <li>
      <Link className="xr-row xr-row-link" href={href}>
        <RowMain {...content} />
        {end}
      </Link>
    </li>
  );
}

export interface AttentionListProps {
  /** The section's H2: "Needs your attention" (boards 03, 09a). */
  readonly title: ReactNode;
  readonly headingId?: string;
  /** `span.xr-meta` beside the H2 while there are items ("4 items"); not drawn when all clear. */
  readonly meta?: ReactNode;
  /**
   * The all-clear title, from the caller ("Nothing needs you right now", 09a AR-1): shown when
   * there are no items.
   */
  readonly allClear: ReactNode;
  /** The all-clear line under it ("New items appear here as they come in."). */
  readonly allClearNote?: ReactNode;
  /**
   * `AttentionItem` rows (budget ≤ 5–6, one action each; 09a AR-1), passed directly or as an
   * array: with none (null, false or an empty array) the all-clear state shows. A fragment counts
   * as one item even when it is empty.
   */
  readonly children?: ReactNode;
  readonly className?: string;
}

/**
 * The overview's attention section (09a AR-1 "Overview / Home — “What needs my attention?”"): a
 * titled `xr-section` holding `ul.xr-rows` of attention items, or, with none, the all-clear state
 * (`div.xr-empty` with the done icon, `p.xr-h3`, `p.xr-small`).
 */
export function AttentionList({
  title,
  headingId,
  meta,
  allClear,
  allClearNote,
  children,
  className,
}: AttentionListProps) {
  const hasItems = Children.toArray(children).length > 0;
  return (
    <Section
      title={title}
      headingId={headingId}
      meta={hasItems ? meta : undefined}
      className={className}
    >
      {hasItems ? (
        <Rows>{children}</Rows>
      ) : (
        <div className="xr-empty">
          <span className="xr-empty-icon">
            <Icon name="done" size={24} />
          </span>
          <p className="xr-h3">{allClear}</p>
          {filled(allClearNote) ? <p className="xr-small">{allClearNote}</p> : null}
        </div>
      )}
    </Section>
  );
}
