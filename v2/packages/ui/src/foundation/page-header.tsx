'use client';

import type { ReactNode, Ref } from 'react';

import { joinClasses } from '../internal/classes.js';
import { IdChip } from './id-chip.js';

/** A slot draws only when it holds something: `undefined`, `null`, `false` and `''` draw nothing. */
function filled(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false && node !== '';
}

export interface PageHeaderProps {
  /**
   * The back link to the list this page belongs to, naming its destination ("Students", never
   * "Back"). Drawn before `div.xr-phead` (boards 03, 07, 11; B1-11, B2-05).
   */
  readonly back?: ReactNode;
  /** `span.xr-overline` above the title: workspace, institution or record kind (05, 09a, B2-06). */
  readonly overline?: ReactNode;
  /** The record ID drawn above the title as `span.xr-id` (09a AR-3 "SUB-0077", 11 "REQ-0042"). */
  readonly recordId?: string;
  /** The one H1 of the page (`h1.xr-h1`). */
  readonly title: ReactNode;
  readonly titleId?: string;
  /**
   * The H1 is where focus goes after an action (`h1.xr-h1[tabindex="-1"]`, B5-03 … B5-09;
   * `understand/surface-reviewer-cm.json` SC1): it takes `tabIndex={-1}`; focus it via `titleRef`.
   */
  readonly titleFocusTarget?: boolean;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** One intro line under the H1 (`p.xr-lead`; board 05 "Help & support"). */
  readonly lead?: ReactNode;
  /** The page's question or purpose in meta type (`p.xr-meta`; board 05, board 11 "People"). */
  readonly summary?: ReactNode;
  /**
   * `div.xr-phead-meta`: the status in words (a StatusPill), then plain facts and IDs
   * (board 03 "Account active · Student · Godavari Institute of Technology · GIT-2026-0418").
   */
  readonly meta?: ReactNode;
  /**
   * `div.xr-phead-actions`: at most one primary action, drawn last (board 03 "Button order").
   * Below 600 px of app width the sheet makes the actions full width.
   */
  readonly actions?: ReactNode;
  /** Composition (the boards set per-screen margins on `xr-phead`). */
  readonly className?: string;
}

/**
 * The page header (`div.xr-phead` > `div.xr-phead-main` + `div.xr-phead-actions`; boards 03
 * "Breadcrumbs, back link and page header", 05, 09a): the one title, its status in words and at
 * most one primary action. The words, the status and the actions come from the caller.
 */
export function PageHeader({
  back,
  overline,
  recordId,
  title,
  titleId,
  titleFocusTarget = false,
  titleRef,
  lead,
  summary,
  meta,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <>
      {back}
      <div className={joinClasses('xr-phead', className)}>
        <div className="xr-phead-main">
          {filled(overline) ? <span className="xr-overline">{overline}</span> : null}
          {recordId ? <IdChip>{recordId}</IdChip> : null}
          <h1
            ref={titleRef}
            className="xr-h1"
            id={titleId}
            tabIndex={titleFocusTarget ? -1 : undefined}
          >
            {title}
          </h1>
          {filled(lead) ? <p className="xr-lead">{lead}</p> : null}
          {filled(summary) ? <p className="xr-meta">{summary}</p> : null}
          {filled(meta) ? <div className="xr-phead-meta">{meta}</div> : null}
        </div>
        {filled(actions) ? <div className="xr-phead-actions">{actions}</div> : null}
      </div>
    </>
  );
}
