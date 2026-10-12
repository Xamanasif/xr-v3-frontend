'use client';

import type { ReactNode, Ref } from 'react';

import { JumpLink } from '../foundation/links.js';
import { joinClasses } from '../internal/classes.js';

/**
 * Where the panel sits once it is beside the content (from 860 px of content):
 * `sticky` — the foundation rule `.xr-dpanel{position:sticky;top:24px}` (boards 03, 09a, 11,
 * B1-11 … B4-09; 69 panels); `static` — `xg-static`, "the panel sits at the top of its column
 * (never floats over content)" (B6-03 … B7-12; 71 panels). Which one a screen uses is open:
 * PROVISIONAL, VD-05 / PF-10 (a prop, no CSS).
 */
export type DecisionPanelPosition = 'sticky' | 'static';

export interface DecisionPanelProps {
  /**
   * The panel's id: the target of "Go to decision" (`aside.xr-dpanel[tabindex="-1"]`, focused
   * by the jump link and outlined by `.xr-dpanel:focus`).
   */
  readonly id: string;
  /** The panel's heading (`xr-dpanel-title`): "Your decision", "Resolve", "Your mark". */
  readonly title: ReactNode;
  /** The heading's id (`aria-labelledby`); default `<id>-title`. */
  readonly titleId?: string;
  /** H2 on the product boards (B1-11 … B7-12); H3 where the panel sits under an H2 (board 03). */
  readonly headingLevel?: 2 | 3;
  /**
   * The heading is where focus goes once the decision is made (`h2 … tabIndex="-1"`, B1-11):
   * it takes `tabIndex={-1}`; focus it through `titleRef`.
   */
  readonly titleFocusTarget?: boolean;
  /** The heading element, to move focus to it once the decision is made. */
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** `sticky` (default, the foundation) or `static` (`xg-static`). PROVISIONAL, VD-05. */
  readonly position?: DecisionPanelPosition;
  /** One decision, its reason, one confirm (board 03 "Decision panel and editable table"). */
  readonly children?: ReactNode;
  /** Board context classes on the `aside`. */
  readonly className?: string;
  /** The `aside`: after a decision, focus may move to the decided panel (Appendix E §5.5). */
  readonly ref?: Ref<HTMLElement>;
}

/**
 * The decision panel (`aside.xr-dpanel`; board 03 "Decision panel and editable table", 09a, 11,
 * B1-11, B6-03, B7-05): "the only side panel a page may carry: one decision, its reason, one
 * confirm". Focusable without being a tab stop, labelled by its title.
 */
export function DecisionPanel({
  id,
  title,
  titleId,
  headingLevel = 2,
  titleFocusTarget = false,
  titleRef,
  position = 'sticky',
  children,
  className,
  ref,
}: DecisionPanelProps) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  const headingId = titleId ?? `${id}-title`;
  return (
    <aside
      ref={ref}
      className={joinClasses('xr-dpanel', position === 'static' && 'xg-static', className)}
      id={id}
      tabIndex={-1}
      aria-labelledby={headingId}
    >
      <Heading
        ref={titleRef}
        id={headingId}
        className="xr-dpanel-title"
        tabIndex={titleFocusTarget ? -1 : undefined}
      >
        {title}
      </Heading>
      {children}
    </aside>
  );
}

export interface DecisionLayoutProps {
  /** The decision panel, beside the content from 860 px of content and under it below. */
  readonly panel: DecisionPanelProps;
  /** The main column (sections, rows, history), stacked in `div.xr-stack`. */
  readonly children: ReactNode;
  /**
   * Draw "Go to decision" (`a.xr-jump`) before the layout, right after the page header, as the
   * product boards do (70 instances, B1-11 … B7-12). It shows only below 860 px of content and
   * moves focus to the panel. `false` where the page puts it itself (09a and 11 draw it as the
   * last line of the page header).
   */
  readonly jump?: boolean;
  /** Board context classes on `div.xr-decide`. */
  readonly className?: string;
}

/**
 * The decision page layout (AR-4; `div.xr-decide`; boards 09a "Decision page — “Should I approve
 * this?”", 11, B1-11 "SA-03 Request decision · REQ-0042 · 1440 · interactive"): the content and
 * the decision panel side by side (about 72 / 28) from 860 px of content, the panel under the
 * content below that with "Go to decision" at the top of the page (board 11 "Decisions").
 */
export function DecisionLayout({ panel, children, jump = true, className }: DecisionLayoutProps) {
  return (
    <>
      {jump ? <JumpLink targetId={panel.id} /> : null}
      <div className={joinClasses('xr-decide', className)}>
        <div className="xr-stack">{children}</div>
        <DecisionPanel {...panel} />
      </div>
    </>
  );
}
