/**
 * Stepper — markup contract and accessibility (Appendix E §3.2 Stepper). Sources: board 03
 * "Stepper · guided flows (AR-5)" (done / current / upcoming, "Step 1 · Done", "Step 2 of 3"),
 * 09a "Guided flow — “What do I do in this step?”" (step 1 current, the count in the page header),
 * and B2-05 "IA-05 Give students access · 1440 · interactive · start here" (the product binding:
 * `aria-current="step"` only on the current step; the stepper is removed once the flow is done,
 * `sc-if notDone`). The phone rule (only the current step's words show below 600 px of content)
 * is a container query, checked in the browser spec.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
  normaliseMarkup,
  type BoardSource,
} from '../testing/index.js';
import { stepCountText, Stepper } from './stepper.js';

const STEPPER: BoardSource = { board: '03', frame: 'Stepper · guided flows (AR-5)' };
const GUIDED_FLOW: BoardSource = {
  board: '09a',
  frame: 'Guided flow — “What do I do in this step?”',
};
const GIVE_ACCESS: BoardSource = {
  board: 'B2-05',
  frame: 'IA-05 Give students access · 1440 · interactive · start here',
};

const STEPS = ['Experiments', 'Students', 'Review and give access'];

describe('Stepper markup contract', () => {
  it('renders exactly as board 03 draws it: done, current, upcoming', () => {
    const { container } = render(
      <Stepper label="Give students access" steps={STEPS} current={2} />,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      STEPPER,
      `<ol class="xr-steps" aria-label="Give students access">
            <li class="xr-step is-done"><span class="xr-step-n">Step 1 · Done</span><span class="xr-step-label">Experiments</span></li>
            <li class="xr-step is-current" aria-current="step"><span class="xr-step-n">Step 2</span><span class="xr-step-label">Students</span></li>
            <li class="xr-step"><span class="xr-step-n">Step 3</span><span class="xr-step-label">Review and give access</span></li>
          </ol>`,
    );
    expectBoardDraws(STEPPER, 'Done = navy bar + the word “Done”.');
  });

  it('step 1 of 3 renders the steps 09a draws', () => {
    const steps = [
      '<li class="xr-step is-current" aria-current="step"><span class="xr-step-n">Step 1</span><span class="xr-step-label">Experiments</span></li>',
      '<li class="xr-step"><span class="xr-step-n">Step 2</span><span class="xr-step-label">Students</span></li>',
      '<li class="xr-step"><span class="xr-step-n">Step 3</span><span class="xr-step-label">Review and give access</span></li>',
    ];
    // 09a also sets an inline margin on the list (a canvas style, never emitted).
    expectBoardDraws(
      GUIDED_FLOW,
      '<ol class="xr-steps" aria-label="Give students access"',
      ...steps,
    );
    const { container } = render(
      <Stepper label="Give students access" steps={STEPS} current={1} />,
    );
    const list = container.firstElementChild!;
    expect(list.getAttribute('class')).toBe('xr-steps');
    expect(list.getAttribute('aria-label')).toBe('Give students access');
    expect(normaliseMarkup(list.innerHTML)).toBe(normaliseMarkup(steps.join('')));
  });

  it('aria-current="step" marks the current step only, as the B2-05 binding sets it', () => {
    expectBoardDraws(
      GIVE_ACCESS,
      '<li class="{{ x.cls }}" aria-current="{{ x.cur }}"><span class="xr-step-n">{{ x.n }}</span><span class="xr-step-label">{{ x.label }}</span></li>',
      "cur: s.step === i ? 'step' : undefined",
      // Once the flow is done the stepper is removed, so no "every step done" list is drawn.
      '<sc-if value="{{ g.notDone }}" hint-placeholder-val="{{ true }}"><ol class="xr-steps" aria-label="Give students access"',
      'notDone: s.step < 4',
    );
    render(<Stepper label="Give students access" steps={STEPS} current={3} />);
    const items = screen.getAllByRole('listitem');
    expect(items.map((item) => item.getAttribute('aria-current'))).toEqual([null, null, 'step']);
    expect(items.map((item) => item.className)).toEqual([
      'xr-step is-done',
      'xr-step is-done',
      'xr-step is-current',
    ]);
  });

  it('showCount draws "Step n of N" above the list, as board 03 does', () => {
    // Board 03 colours the overline inline (a canvas style, never emitted).
    expectBoardDraws(STEPPER, '<p class="xr-overline"', '>Step 2 of 3</p>');
    const { container } = render(
      <Stepper label="Give students access" steps={STEPS} current={2} showCount />,
    );
    const [count, list] = [...container.children];
    expect(normaliseMarkup(count!.outerHTML)).toBe('<p class="xr-overline">Step 2 of 3</p>');
    expect(list!.tagName).toBe('OL');
  });

  it('stepCountText gives the page-header overline words (09a, B2-05)', () => {
    expectBoardDraws(GUIDED_FLOW, '>Step 1 of 3</span><h3 class="xr-h1">Choose experiments</h3>');
    expectBoardDraws(GIVE_ACCESS, "over: s.step < 4 ? 'Step ' + s.step + ' of 3'");
    expect(stepCountText(1, 3)).toBe('Step 1 of 3');
    expect(stepCountText(2, 3)).toBe('Step 2 of 3');
  });

  it('emits only stylesheet classes', () => {
    const { container } = render(
      <div>
        <Stepper label="Give students access" steps={STEPS} current={2} showCount />
      </div>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });
});

describe('Stepper accessibility (axe, WCAG 2.2 AA)', () => {
  it.each([
    ['first step current', 1, false],
    ['middle step current', 2, true],
    ['last step current', 3, true],
  ] as const)('%s', async (_state, current, showCount) => {
    const { container } = render(
      <Stepper
        label="Give students access"
        steps={STEPS}
        current={current}
        showCount={showCount}
      />,
    );
    await assertNoAxeViolations(container);
  });

  it('the list is named by the flow, and every step stays in the accessibility tree', () => {
    render(<Stepper label="Give students access" steps={STEPS} current={2} />);
    expect(screen.getByRole('list', { name: 'Give students access' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
});
