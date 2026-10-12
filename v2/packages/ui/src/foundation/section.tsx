'use client';

import { useId, type ReactNode, type Ref } from 'react';

import { joinClasses } from '../internal/classes.js';
import { IdChip } from './id-chip.js';

/** A slot draws only when it holds something: `undefined`, `null`, `false` and `''` draw nothing. */
function filled(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false && node !== '';
}

interface SectionCommonProps {
  /** The section content: `xr-rows`, a `SectionBody`, an `xr-empty` state, a table wrap … */
  readonly children?: ReactNode;
  /** Board context classes drawn after `xr-section` (`xd-group`, `xg-changed`) or composition. */
  readonly className?: string;
  /** An id for the section itself (B4-07 draws `section.xr-section#Kb-tq` as a jump target). */
  readonly id?: string;
}

/** A titled section: `section.xr-section[aria-labelledby]` > `div.xr-section-head` > `h2.xr-h2`. */
export interface TitledSectionProps extends SectionCommonProps {
  /** The H2 (`h2.xr-h2`) that names the section: "My reports", "Needs your attention". */
  readonly title: ReactNode;
  /** The H2's id, which `aria-labelledby` points at; generated when omitted. */
  readonly headingId?: string;
  /** `span.xr-meta` after the H2 ("2 reports", "4 items"); boards 03, 05, 09a. */
  readonly meta?: ReactNode;
  /**
   * The meta is a count that changes while the page is open, announced politely:
   * `span.xr-meta[role="status"]` (35 heads on B4-05 … B7-02, e.g. B4-07 "Questions" while the
   * search narrows the list). The live region stays mounted, also while it is empty.
   */
  readonly metaLive?: boolean;
  /**
   * The record the section is about, drawn in the head as `span.xr-meta.xr-id` (B3-07 "Your
   * transfer request" · DTR-0018). Never reformatted.
   */
  readonly recordId?: string;
  /** Further head content after the meta, e.g. a small text button (B7 `a.xr-btn--text`). */
  readonly headEnd?: ReactNode;
  /**
   * The H2 is a focus target after an action (`h2 … tabindex="-1"`, 19 instances on B4-08):
   * it takes `tabIndex={-1}` and can be focused through `headingRef`.
   */
  readonly headingFocusTarget?: boolean;
  readonly headingRef?: Ref<HTMLHeadingElement>;
  readonly label?: never;
  readonly focusTarget?: never;
  readonly ref?: never;
}

/** A section named without a visible heading: `section.xr-section[aria-label]` (B1-11 "Summary"). */
export interface LabelledSectionProps extends SectionCommonProps {
  readonly label: string;
  readonly title?: never;
  readonly focusTarget?: never;
  readonly ref?: never;
}

/** A plain white surface (`div.xr-section`): a form card or an empty state, not a region. */
export interface SurfaceSectionProps extends SectionCommonProps {
  readonly title?: never;
  readonly label?: never;
  /**
   * The surface is where focus goes after an action (`div.xr-section#…[tabindex="-1"]`, 19
   * instances on B2-07, B4-04, B4-14, B4-15 — e.g. B2-07 "Added" after adding a person): it takes
   * `tabIndex={-1}`; focus it through `ref`. Give it an `id`, as the boards do.
   */
  readonly focusTarget?: boolean;
  readonly ref?: Ref<HTMLDivElement>;
}

export type SectionProps = TitledSectionProps | LabelledSectionProps | SurfaceSectionProps;

/**
 * The v46 section (`xr-section`; boards 01 "Surface hierarchy", 03, 05, 09a): one white surface
 * per section, never nested. A titled section is a region named by its H2 (`aria-labelledby`);
 * the head is drawn as `div.xr-section-head` > `h2.xr-h2` + `span.xr-meta`.
 */
export function Section(props: SectionProps) {
  const generatedId = useId();
  const { children, className, id } = props;
  const classes = joinClasses('xr-section', className);
  if (props.title !== undefined) {
    const headingId = props.headingId ?? generatedId;
    return (
      <section className={classes} id={id} aria-labelledby={headingId}>
        <div className="xr-section-head">
          <h2
            ref={props.headingRef}
            id={headingId}
            className="xr-h2"
            tabIndex={props.headingFocusTarget ? -1 : undefined}
          >
            {props.title}
          </h2>
          {props.recordId ? <IdChip className="xr-meta">{props.recordId}</IdChip> : null}
          {props.metaLive || filled(props.meta) ? (
            <span className="xr-meta" role={props.metaLive ? 'status' : undefined}>
              {props.meta}
            </span>
          ) : null}
          {props.headEnd}
        </div>
        {children}
      </section>
    );
  }
  if (props.label !== undefined) {
    return (
      <section className={classes} id={id} aria-label={props.label}>
        {children}
      </section>
    );
  }
  return (
    <div ref={props.ref} className={classes} id={id} tabIndex={props.focusTarget ? -1 : undefined}>
      {children}
    </div>
  );
}

export interface SectionBodyProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

/** The padded body of a section (`div.xr-section-body`, 0 24 24; 0 16 16 below 600 app width). */
export function SectionBody({ children, className }: SectionBodyProps) {
  return <div className={joinClasses('xr-section-body', className)}>{children}</div>;
}

export interface StackProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

/** Sections stacked with a 24 px gap (`div.xr-stack`; 09a AR-3 "Record detail"). */
export function Stack({ children, className }: StackProps) {
  return <div className={joinClasses('xr-stack', className)}>{children}</div>;
}
