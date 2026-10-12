/**
 * EmptyState · LoadingState · FailedState · NoMatch — markup contract, behaviour and
 * accessibility (Appendix E §3.1, §5.5, §8). Sources: board 04 "State grammar · one pattern per
 * state"; board 03 "Notices, empty, error, loading and read-only" (frames "Empty", "Loading"
 * and the failed notice with "Try again" and "Report a problem"); B1-10 frames "Empty · no
 * requests yet", "No match" and "Loading" (the product pattern, in the SA-02 list); B2-05
 * "IA-05 Give students access · 1440 · interactive · start here" (a busy section).
 *
 * Inline styles the boards add to these patterns (the 40476B grey on the line under an empty or
 * message title, the red / green tints of the empty icon, the `align-self` of "Report a
 * problem") are not emitted: @xr/ui emits classes only (Appendix E §2.5–§2.6). Each test that
 * meets one says so and compares everything else exactly.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
  normaliseMarkup,
  type BoardSource,
} from '../testing/index.js';
import { Button } from './button.js';
import { EmptyState, FailedState, LoadingState, NoMatch, Skeleton } from './states.js';

const svg = (d: string, size = '') =>
  `<svg class="xr-ico${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"></path></svg>`;
const GRAMMAR: BoardSource = { board: '04', frame: 'State grammar · one pattern per state' };
const REQUESTS_ICON =
  'M4 13.5 6.5 5h11l2.5 8.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 13.5h4.5l1.5 2.5h4l1.5-2.5H20';
const SEARCH_ICON = 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4';

describe('EmptyState markup contract', () => {
  it('B1-10 "Empty · no requests yet": icon, H2, one line', () => {
    const frame = { board: 'B1-10', frame: 'Empty · no requests yet' };
    const line = 'Requests that institutions send from the public site appear here.';
    expectBoardDraws(
      frame,
      `<div class="xr-empty"><span class="xr-empty-icon">${svg(REQUESTS_ICON)}</span><h2 class="xr-h3">No requests yet</h2><p class="xr-body" style="color:#40476B">${line}</p></div>`,
    );
    const { container } = render(
      <EmptyState icon="requests" title="No requests yet">
        {line}
      </EmptyState>,
    );
    const empty = container.firstElementChild!;
    // Everything as drawn except the line's inline colour (see the header).
    expect(normaliseMarkup(empty.outerHTML)).toBe(
      normaliseMarkup(
        `<div class="xr-empty"><span class="xr-empty-icon">${svg(REQUESTS_ICON)}</span><h2 class="xr-h3">No requests yet</h2><p class="xr-body">${line}</p></div>`,
      ),
    );
  });

  it('board 03 "Empty": the 24 px icon, an H3, the small line and one next step', () => {
    const frame = { board: '03', frame: 'Empty' };
    const { container } = render(
      <EmptyState
        icon="assessments"
        iconSize={24}
        title="No assessments yet"
        headingLevel={3}
        line="small"
        actions={<Button variant="primary">Create assessment</Button>}
      >
        Create an assessment for an experiment you teach. You can save a draft while you add
        questions.
      </EmptyState>,
    );
    const [icon, heading, line, action] = [...container.firstElementChild!.children];
    expectRenderedAsDrawn(
      icon!,
      frame,
      `<span class="xr-empty-icon">${svg('M9 3.5h6v3H9zM15 5h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3M8.5 13.5l2.5 2.5 4.5-5', ' xr-ico--24')}</span>`,
    );
    expectRenderedAsDrawn(heading!, frame, '<h3 class="xr-h3">No assessments yet</h3>');
    // Boards 03 and 07 draw this line as `p.xr-small` (`line="small"`); every product board draws
    // `p.xr-body` (515), the default. Everything as drawn except the line's inline colour.
    const drawnLine =
      '<p class="xr-small" style="color: #40476B">Create an assessment for an experiment you teach. You can save a draft while you add questions.</p>';
    expectBoardDraws(frame, `<h3 class="xr-h3">No assessments yet</h3>${drawnLine}`);
    expect(line!.outerHTML).toBe(drawnLine.replace(' style="color: #40476B"', ''));
    expectRenderedAsDrawn(
      action!,
      frame,
      '<button type="button" class="xr-btn xr-btn--primary">Create assessment</button>',
    );
  });

  it('the line is `p.xr-body` by default and `p.xr-small` only when asked for', () => {
    const body = render(
      <EmptyState icon="requests" title="No requests yet">
        One line.
      </EmptyState>,
    );
    expect(body.container.querySelector('.xr-empty > p')!.outerHTML).toBe(
      '<p class="xr-body">One line.</p>',
    );
    body.unmount();
    const small = render(
      <EmptyState icon="requests" title="No requests yet" line="small">
        One line.
      </EmptyState>,
    );
    expect(small.container.querySelector('.xr-empty > p')!.outerHTML).toBe(
      '<p class="xr-small">One line.</p>',
    );
  });

  it('follows the grammar: icon, one line, one next step — never "No data"', () => {
    expectBoardDraws(GRAMMAR, 'Icon, one line, one next step', 'Illustrated hero; “No data”');
    const { container } = render(<EmptyState icon="requests" title="No requests yet" />);
    expect(container.querySelector('.xr-empty-icon svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('p')).toBeNull();
  });
});

describe('NoMatch markup contract and behaviour (B1-10 "No match")', () => {
  it('the empty pattern with the Search icon and a secondary "Clear filters"', () => {
    const drawn = `<div class="xr-empty"><span class="xr-empty-icon">${svg(SEARCH_ICON)}</span><h2 class="xr-h3">No requests match these filters</h2><button type="button" class="xr-btn xr-btn--secondary" onClick="{{ q.clear }}">Clear filters</button></div>`;
    expectBoardDraws({ board: 'B1-10', frame: 'No match' }, drawn);
    const { container } = render(
      <NoMatch title="No requests match these filters" onClearFilters={() => {}} />,
    );
    // The board's `onClick="{{ … }}"` is the canvas handler binding, not markup.
    expect(normaliseMarkup(container.innerHTML)).toBe(
      normaliseMarkup(drawn.replace(' onClick="{{ q.clear }}"', '')),
    );
  });

  it('"Clear filters" calls the caller', () => {
    const onClearFilters = vi.fn();
    render(<NoMatch title="No students match these filters" onClearFilters={onClearFilters} />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });
});

describe('FailedState markup contract and behaviour (board 03 failed notice)', () => {
  const drawn = `<div class="xr-notice xr-notice--err" role="alert">${svg('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5v5.5M12 16.5h.01')}<div class="xr-notice-body"><span class="xr-notice-title">The simulation didn’t open. Nothing was lost.</span><span>Try again. If it keeps happening, report the problem.</span><div class="xr-notice-actions"><button type="button" class="xr-btn xr-btn--secondary xr-btn--sm">${svg('M20 12a8 8 0 1 1-2.4-5.7M20 4v4.5h-4.5')}Try again</button><a href="#h-fb" style="align-self: center">Report a problem</a></div></div></div>`;

  it('an error notice in place: role alert, "Try again", "Report a problem"', () => {
    expectBoardDraws({ board: '03', frame: 'Notices, empty, error, loading and read-only' }, drawn);
    expectBoardDraws(GRAMMAR, 'Error notice in place; Try again; Report a problem');
    const { container } = render(
      <FailedState
        title="The simulation didn’t open. Nothing was lost."
        onRetry={() => {}}
        reportHref="#h-fb"
      >
        Try again. If it keeps happening, report the problem.
      </FailedState>,
    );
    expect(normaliseMarkup(container.innerHTML)).toBe(
      normaliseMarkup(drawn.replace(' style="align-self: center"', '')),
    );
  });

  it('"Try again" calls the caller; no report link unless given', () => {
    const onRetry = vi.fn();
    render(<FailedState title="We couldn’t load the requests" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert')).toHaveTextContent('We couldn’t load the requests');
    expect(screen.queryByRole('link')).toBeNull();
  });
});

describe('LoadingState markup contract and live region', () => {
  it('B1-10 "Loading": a busy table surface that names what is loading', () => {
    expectBoardDraws(
      { board: 'B1-10', frame: 'Loading' },
      '<div class="xr-table-wrap" aria-busy="true"><span class="xr-sr" role="status">Loading requests</span><div style="display:grid;',
    );
    const { container } = render(<LoadingState label="Loading requests" />);
    expect(normaliseMarkup(container.innerHTML)).toBe(
      '<div class="xr-table-wrap" aria-busy="true"><span class="xr-sr" role="status">Loading requests</span><span class="xr-skel"></span><span class="xr-skel"></span><span class="xr-skel"></span></div>',
    );
  });

  it('a busy section (B2-05) with the caller’s skeleton shape', () => {
    expectBoardDraws(
      { board: 'B2-05', frame: 'IA-05 Give students access · 1440 · interactive · start here' },
      '<div class="xr-section" aria-busy="true" style="padding:24px;display:flex;flex-direction:column;gap:16px"><span class="xr-sr" role="status">Loading your access plan</span><span class="xr-skel"',
    );
    const { container } = render(
      <LoadingState
        surface="section"
        label="Loading your access plan"
        skeleton={
          <>
            <Skeleton />
            <Skeleton />
          </>
        }
      />,
    );
    expect(normaliseMarkup(container.innerHTML)).toBe(
      '<div class="xr-section" aria-busy="true"><span class="xr-sr" role="status">Loading your access plan</span><span class="xr-skel"></span><span class="xr-skel"></span></div>',
    );
  });

  it('announced politely (board 04): the status region stays mounted and only its words change', () => {
    expectBoardDraws(GRAMMAR, 'Skeleton in the shape of the content; announced politely');
    const { container, rerender } = render(
      <LoadingState label="Loading requests">
        <p>3 requests</p>
      </LoadingState>,
    );
    const region = container.firstElementChild!;
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading requests');
    expect(screen.queryByText('3 requests')).toBeNull();
    rerender(
      <LoadingState label="Loading requests" loading={false}>
        <p>3 requests</p>
      </LoadingState>,
    );
    expect(container.firstElementChild).toBe(region);
    expect(screen.getByRole('status')).toBe(status);
    expect(status).toBeEmptyDOMElement();
    expect(region).not.toHaveAttribute('aria-busy');
    expect(region.querySelector('.xr-skel')).toBeNull();
    expect(screen.getByText('3 requests')).toBeInTheDocument();
    rerender(
      <LoadingState label="Loading requests" loading>
        <p>3 requests</p>
      </LoadingState>,
    );
    expect(screen.getByRole('status')).toBe(status);
    expect(status).toHaveTextContent('Loading requests');
    expect(region).toHaveAttribute('aria-busy', 'true');
  });

  it('a caller-owned container (surface null) keeps only the caller’s classes (B1-03)', () => {
    expectBoardDraws(
      { board: 'B1-03', frame: 'All areas · loading' },
      '<div class="xp-grid xp-grid--3" aria-busy="true"><span class="xr-sr" role="status">Loading engineering areas</span>',
    );
    const { container } = render(
      <LoadingState
        surface={null}
        className="xp-grid xp-grid--3"
        label="Loading engineering areas"
        lines={1}
      />,
    );
    expect(normaliseMarkup(container.innerHTML)).toBe(
      '<div class="xp-grid xp-grid--3" aria-busy="true"><span class="xr-sr" role="status">Loading engineering areas</span><span class="xr-skel"></span></div>',
    );
    const { container: bare } = render(
      <LoadingState surface={null} label="Loading your plan" lines={1} />,
    );
    expect(bare.firstElementChild).not.toHaveAttribute('class');
  });

  it('focusTarget: the container takes tabindex=-1 (focusable, not a Tab stop) only while asked', () => {
    let node: HTMLDivElement | null = null;
    const { container, rerender } = render(
      <LoadingState label="Loading requests" ref={(element) => void (node = element)} />,
    );
    const region = container.firstElementChild!;
    expect(region).not.toHaveAttribute('tabindex');
    rerender(
      <LoadingState
        label="Loading requests"
        focusTarget
        ref={(element) => void (node = element)}
      />,
    );
    expect(container.firstElementChild).toBe(region);
    expect(region).toHaveAttribute('tabindex', '-1');
    node!.focus();
    expect(region).toHaveFocus();
    rerender(<LoadingState label="Loading requests" ref={(element) => void (node = element)} />);
    expect(region).not.toHaveAttribute('tabindex');
  });
});

describe('States: stylesheet classes and accessibility (axe, WCAG 2.2 AA)', () => {
  it('emit only stylesheet classes', () => {
    const { container } = render(
      <div>
        <EmptyState
          icon="requests"
          title="No requests yet"
          actions={<Button variant="secondary">Open requests</Button>}
        >
          Requests appear here.
        </EmptyState>
        <NoMatch title="No requests match these filters" onClearFilters={() => {}} />
        <FailedState title="We couldn’t load the requests" onRetry={() => {}} reportHref="#r" />
        <LoadingState label="Loading requests" />
        <LoadingState surface="section" label="Loading your plan" />
      </div>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });

  it.each([
    [
      'empty',
      <EmptyState icon="requests" title="No requests yet">
        Requests that institutions send from the public site appear here.
      </EmptyState>,
    ],
    [
      'empty with a next step',
      <EmptyState
        icon="assessments"
        iconSize={24}
        title="No assessments yet"
        headingLevel={3}
        actions={<Button variant="primary">Create assessment</Button>}
      >
        Create an assessment for an experiment you teach.
      </EmptyState>,
    ],
    ['no match', <NoMatch title="No requests match these filters" onClearFilters={() => {}} />],
    ['failed without a report link', <FailedState title="We couldn’t load" onRetry={() => {}} />],
    ['loading section', <LoadingState surface="section" label="Loading your access plan" />],
    [
      'loading in a caller container',
      <LoadingState surface={null} className="xr-stack" label="Loading your courses" lines={2} />,
    ],
    [
      'failed',
      <FailedState title="We couldn’t load the requests" onRetry={() => {}} reportHref="#report">
        Nothing has changed. Try again.
      </FailedState>,
    ],
    ['loading', <LoadingState label="Loading requests" />],
    [
      'loaded',
      <LoadingState label="Loading requests" loading={false}>
        <p>3 requests</p>
      </LoadingState>,
    ],
  ])('%s', async (_state, element) => {
    const { container } = render(element);
    await assertNoAxeViolations(container);
  });
});
