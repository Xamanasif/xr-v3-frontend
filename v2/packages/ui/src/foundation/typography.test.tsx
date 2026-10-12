/**
 * Typography — markup contract and accessibility (Appendix E §3.1 Typography: the workspace
 * `xr-display/h1/h2/h3/lead/body/small/meta/caption/overline/num/sr` classes; the public `xp-*`
 * scale is Phase 1 under G-8). Sources: board 02 "Type scale" (every style drawn on a span),
 * "Hierarchy in use" and "Links and focus" (`xr-sr`), 09a "Overview / Home — “What needs my
 * attention?”" (`xr-num`), board 13 "Changes · B2 → Batch-0 decision → reason" (`xr-num xr-meta`
 * order), B1-10 "SA-02 Requests · 1440 · interactive" (`h2.xr-h3`), B1-11 "SA-03 Request
 * decision · REQ-0042 · 1440 · interactive" (`dt.xr-overline`) and B2-12 "ST-05 Experiment hub ·
 * Overview · 1440 · Rahul, 9 Oct 2026" (`h2.xr-sr`). The phone scale below 600 px of app width
 * is the sheet's: proven in the browser.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
  type BoardSource,
} from '../testing/index.js';
import { Num, Text, VisuallyHidden, type TypeStyle } from './typography.js';

const TYPE_SCALE: BoardSource = { board: '02', frame: 'Type scale' };

describe('Typography markup contract', () => {
  it.each([
    ['display', 'Engineering, made visible'],
    ['h1', 'Give students access'],
    ['h2', 'Needs your attention'],
    ['h3', 'Learning outcomes'],
    ['lead', 'Choose the experiments to give, then the students.'],
    ['body', 'Your institution’s access to this experiment includes WEB and VR.'],
    ['small', 'Sent 3 Oct · reference SUP-0213'],
    ['meta', 'Last changed by Kavya Nair · 2 Oct'],
    ['overline', 'Institute Admin'],
    ['caption', 'Illustration'],
  ] as const satisfies readonly (readonly [TypeStyle, string])[])(
    '%s renders exactly as the board-02 type scale draws it',
    (variant, words) => {
      const { container } = render(
        <Text variant={variant} as="span">
          {words}
        </Text>,
      );
      expectRenderedAsDrawn(
        container.firstElementChild!,
        TYPE_SCALE,
        `<span class="xr-${variant}">${words}</span>`,
      );
    },
  );

  it.each([
    ['h1', '<h1 class="xr-h1">Overview</h1>'],
    ['h2', '<h2 class="xr-h2">Overview</h2>'],
    ['h3', '<h3 class="xr-h3">Overview</h3>'],
    ['lead', '<p class="xr-lead">Overview</p>'],
    ['body', '<p class="xr-body">Overview</p>'],
    ['small', '<p class="xr-small">Overview</p>'],
    ['meta', '<span class="xr-meta">Overview</span>'],
    ['caption', '<p class="xr-caption">Overview</p>'],
    ['overline', '<span class="xr-overline">Overview</span>'],
    ['display', '<p class="xr-display">Overview</p>'],
  ] as const satisfies readonly (readonly [TypeStyle, string])[])(
    '%s defaults to the element the boards use most',
    (variant, html) => {
      const { container } = render(<Text variant={variant}>Overview</Text>);
      expect(container.innerHTML).toBe(html);
    },
  );

  it('the look never sets the outline level (board 02 "Hierarchy in use"; B1-10 `h2.xr-h3`)', () => {
    const { container } = render(
      <Text variant="h2" as="h4">
        Experiments in this plan
      </Text>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: '02', frame: 'Hierarchy in use' },
      '<h4 class="xr-h2">Experiments in this plan</h4>',
    );
    const { container: empty } = render(
      <Text variant="h3" as="h2">
        No requests match these filters
      </Text>,
    );
    expectRenderedAsDrawn(
      empty.firstElementChild!,
      { board: 'B1-10', frame: 'SA-02 Requests · 1440 · interactive' },
      '<h2 class="xr-h3">No requests match these filters</h2>',
    );
  });

  it('an overline term in a list (B1-11 `dt.xr-overline`)', () => {
    const { container } = render(
      <dl>
        <Text variant="overline" as="dt">
          Experiments
        </Text>
      </dl>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!.firstElementChild!,
      { board: 'B1-11', frame: 'SA-03 Request decision · REQ-0042 · 1440 · interactive' },
      '<dt class="xr-overline">Experiments</dt>',
    );
  });

  it('tabular figures: `span.xr-num` (09a AR-1) and `xr-num` before the scale class (board 13)', () => {
    const { container } = render(<Num>Licences 1,284 of 1,650 · plan ends 30 Jun 2027</Num>);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: '09a', frame: 'Overview / Home — “What needs my attention?”' },
      '<span class="xr-num">Licences 1,284 of 1,650 · plan ends 30 Jun 2027</span>',
    );
    expectBoardDraws(
      { board: '13', frame: 'Changes · B2 → Batch-0 decision → reason' },
      '<td class="xr-num xr-meta">{{ c.n }}</td>',
    );
    const { container: meta } = render(
      <Text variant="meta" tabular>
        12
      </Text>,
    );
    expect(meta.innerHTML).toBe('<span class="xr-num xr-meta">12</span>');
  });

  it('visually hidden words (board 02 "Links and focus"; B2-12 `h2.xr-sr`)', () => {
    const { container } = render(<VisuallyHidden>(opens in a new tab)</VisuallyHidden>);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: '02', frame: 'Links and focus' },
      '<span class="xr-sr">(opens in a new tab)</span>',
    );
    expectBoardDraws(
      { board: 'B2-12', frame: 'ST-05 Experiment hub · Overview · 1440 · Rahul, 9 Oct 2026' },
      '<h2 id="Ufirst-ns" class="xr-sr">Your next steps</h2>',
    );
    const { container: heading } = render(
      <VisuallyHidden as="h2" id="Ufirst-ns">
        Your next steps
      </VisuallyHidden>,
    );
    expect(heading.innerHTML).toBe('<h2 id="Ufirst-ns" class="xr-sr">Your next steps</h2>');
    expect(screen.getByRole('heading', { name: 'Your next steps' })).toBeInTheDocument();
  });

  it('a heading as a focus target and a context class after the scale class', () => {
    const { container } = render(
      <Text variant="meta" className="xw-nowrap" id="m1">
        2 Oct
      </Text>,
    );
    expect(container.innerHTML).toBe('<span class="xr-meta xw-nowrap" id="m1">2 Oct</span>');
    render(
      <Text variant="h2" tabIndex={-1}>
        Drafts to review
      </Text>,
    );
    expect(screen.getByRole('heading', { name: 'Drafts to review' })).toHaveAttribute(
      'tabindex',
      '-1',
    );
  });

  it('emits only stylesheet classes', () => {
    const { container } = render(
      <div>
        {(
          [
            'display',
            'h1',
            'h2',
            'h3',
            'lead',
            'body',
            'small',
            'meta',
            'caption',
            'overline',
          ] as const
        ).map((variant) => (
          <Text key={variant} variant={variant} as="span" tabular>
            {variant}
          </Text>
        ))}
        <Num>1,284</Num>
        <VisuallyHidden>, 12 written answers to mark</VisuallyHidden>
      </div>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });

  it('axe (WCAG 2.2 AA): a page outline in the workspace scale', async () => {
    const { container } = render(
      <main>
        <Text variant="overline">Godavari Institute of Technology</Text>
        <Text variant="h1">Overview</Text>
        <Text variant="lead">Choose the experiments to give, then the students.</Text>
        <Text variant="h2">Needs your attention</Text>
        <Text variant="body">
          <Num>Licences 1,284 of 1,650</Num>
          <VisuallyHidden>(opens in a new tab)</VisuallyHidden>
        </Text>
        <Text variant="h3">Learning outcomes</Text>
        <Text variant="small">Sent 3 Oct · reference SUP-0213</Text>
        <Text variant="meta">Last changed by Kavya Nair · 2 Oct</Text>
        <Text variant="caption">Illustration</Text>
      </main>,
    );
    await assertNoAxeViolations(container);
  });
});
