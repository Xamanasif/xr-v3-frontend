import type { ReactNode } from 'react';

import { joinClasses } from '../internal/classes.js';

/**
 * "Step n of N", the words the boards draw above a guided flow's stepper: board 03 "Stepper ·
 * guided flows (AR-5)" (`p.xr-overline` before the list) and 09a AR-5 / B2-05 (the page header's
 * `span.xr-overline` above the H1). For a page header, pass this as its overline.
 */
export function stepCountText(current: number, total: number): string {
  return `Step ${current} of ${total}`;
}

export interface StepperProps {
  /** The list's accessible name: the flow ("Give students access"; boards 03, 09a, B2-05). */
  readonly label: string;
  /** The step labels in order ("Experiments", "Students", "Review and give access"). */
  readonly steps: readonly ReactNode[];
  /**
   * The current step, counted from 1 (1 … `steps.length`). Steps before it are done; steps after
   * it are upcoming. Once the flow is done the boards remove the stepper altogether (B2-05,
   * B2-07, B4-04, B4-08: `sc-if notDone` around `ol.xr-steps`), so there is no "every step done"
   * state to draw.
   */
  readonly current: number;
  /**
   * Draws "Step n of N" above the list as board 03 does (`p.xr-overline`). On phones it stays
   * with the current step's label while the other steps' words are visually hidden by the v46
   * container rule (`xr-content` below 600 px). Leave it off when the page header's overline
   * already says it (09a, B2-05: use `stepCountText`).
   */
  readonly showCount?: boolean;
  /**
   * The words of a done step: "Step n · Done" as board 03 draws them (default), or "Step n" only,
   * as the Batch-1 request flow draws them (B1-06, B1-07: `span.xr-step-n` "Step 1" on an
   * `is-done` step). Done stays drawn by the navy bar and the step's place before the current one,
   * and is still said to screen readers: " · Done" in a visually hidden span (WCAG 1.3.1).
   */
  readonly doneWords?: boolean;
  /** Board context classes on the list, or apps/web composition utilities. */
  readonly className?: string;
}

/**
 * The v46 guided-flow stepper (`ol.xr-steps` of `li.xr-step`; board 03 "Stepper · guided flows
 * (AR-5)", 09a AR-5). Done = navy bar + the word "Done"; current = gold bar + bold +
 * `aria-current="step"`; upcoming = grey (board 03). The words "Step n" and "Done" are the
 * board's fixed text. The info-only `xl-steps`, `xw-steps3` and the public `xp-steps4` are later
 * phases and are not built here.
 */
export function Stepper({
  label,
  steps,
  current,
  showCount = false,
  doneWords = true,
  className,
}: StepperProps) {
  const list = (
    <ol className={joinClasses('xr-steps', className)} aria-label={label}>
      {steps.map((step, index) => {
        const number = index + 1;
        const state = number < current ? 'done' : number === current ? 'current' : 'upcoming';
        return (
          <li
            key={number}
            className={joinClasses(
              'xr-step',
              state === 'done' && 'is-done',
              state === 'current' && 'is-current',
            )}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className="xr-step-n">
              {state === 'done' && doneWords ? `Step ${number} · Done` : `Step ${number}`}
              {state === 'done' && !doneWords ? <span className="xr-sr"> · Done</span> : null}
            </span>
            <span className="xr-step-label">{step}</span>
          </li>
        );
      })}
    </ol>
  );
  if (!showCount) return list;
  return (
    <>
      <p className="xr-overline">{stepCountText(current, steps.length)}</p>
      {list}
    </>
  );
}
