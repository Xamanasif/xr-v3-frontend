/**
 * SegmentedControl — markup contract, behaviour and accessibility (Appendix E §3.2
 * SegmentedControl). Sources: board 03 "Segmented control" (the static specimen and its rule
 * "Switches one list's view. Never navigation.") and B2-05 "Step 2 · students" ("Give access to",
 * the product use).
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
  normaliseMarkup,
  type BoardSource,
} from '../testing/index.js';
import { SegmentedControl } from './segmented-control.js';

const SEGMENTED: BoardSource = { board: '03', frame: 'Segmented control' };
const STUDENTS_STEP: BoardSource = { board: 'B2-05', frame: 'Step 2 · students' };

const REPORTS = [
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'all', label: 'All' },
] as const;

describe('SegmentedControl markup contract', () => {
  it('renders exactly as board 03 draws it', () => {
    const { container } = render(<SegmentedControl label="Show reports" options={REPORTS} />);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      SEGMENTED,
      '<div class="xr-seg" role="group" aria-label="Show reports"><button type="button" aria-pressed="true">Open</button><button type="button" aria-pressed="false">Resolved</button><button type="button" aria-pressed="false">All</button></div>',
    );
    expectBoardDraws(SEGMENTED, "Switches one list's view. Never navigation.");
  });

  it('the B2-05 product use: a named group of pressed-state buttons, no links', () => {
    // The frame's own binding (`g2`); its canvas onClick bindings are not markup.
    const excerpt =
      '<div class="xr-seg" role="group" aria-label="Give access to"><button type="button" aria-pressed="{{ g2.stuPressed }}" onClick="{{ g2.setStu }}">Students</button><button type="button" aria-pressed="{{ g2.grpPressed }}" onClick="{{ g2.setGrp }}">A group</button></div>';
    expectBoardDraws(STUDENTS_STEP, excerpt);
    const { container } = render(
      <SegmentedControl
        label="Give access to"
        options={[
          { value: 'students', label: 'Students' },
          { value: 'group', label: 'A group' },
        ]}
        value="group"
      />,
    );
    expect(normaliseMarkup(container.innerHTML)).toBe(
      normaliseMarkup(
        excerpt
          .replace(/ onClick="\{\{[^}]*\}\}"/g, '')
          .replace('{{ g2.stuPressed }}', 'false')
          .replace('{{ g2.grpPressed }}', 'true'),
      ),
    );
    expect(container.querySelector('a')).toBeNull();
  });

  it('emits only stylesheet classes', () => {
    const { container } = render(<SegmentedControl label="Show reports" options={REPORTS} />);
    expectStylesheetClassesOnly(container.firstElementChild!);
  });
});

describe('SegmentedControl behaviour', () => {
  it('uncontrolled: pressing a segment presses it and releases the others', () => {
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        label="Show reports"
        options={REPORTS}
        defaultValue="resolved"
        onValueChange={onValueChange}
      />,
    );
    expect(screen.getByRole('button', { name: 'Resolved' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(onValueChange).toHaveBeenCalledWith('all');
    expect(pressedNames()).toEqual(['All']);
  });

  it('pressing the pressed segment again changes nothing', () => {
    const onValueChange = vi.fn();
    render(
      <SegmentedControl label="Show reports" options={REPORTS} onValueChange={onValueChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(pressedNames()).toEqual(['Open']);
  });

  it('controlled: the pressed segment follows `value`', () => {
    function Controlled() {
      const [view, setView] = useState<'open' | 'resolved' | 'all'>('open');
      return (
        <>
          <SegmentedControl
            label="Show reports"
            options={REPORTS}
            value={view}
            onValueChange={setView}
          />
          <p role="status">{view}</p>
        </>
      );
    }
    render(<Controlled />);
    fireEvent.click(screen.getByRole('button', { name: 'Resolved' }));
    expect(pressedNames()).toEqual(['Resolved']);
    expect(screen.getByRole('status')).toHaveTextContent('resolved');
  });

  it('a controlled value the caller does not change stays pressed', () => {
    render(<SegmentedControl label="Show reports" options={REPORTS} value="open" />);
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(pressedNames()).toEqual(['Open']);
  });

  it('every segment is a native button inside a named group', () => {
    render(<SegmentedControl label="Show reports" options={REPORTS} />);
    const group = screen.getByRole('group', { name: 'Show reports' });
    expect(group.querySelectorAll('button[type="button"]')).toHaveLength(3);
  });
});

describe('SegmentedControl accessibility (axe, WCAG 2.2 AA)', () => {
  it.each(['open', 'resolved', 'all'] as const)('pressed: %s', async (value) => {
    const { container } = render(
      <SegmentedControl label="Show reports" options={REPORTS} value={value} />,
    );
    await assertNoAxeViolations(container);
  });
});

function pressedNames(): string[] {
  return screen.getAllByRole('button', { pressed: true }).map((button) => button.textContent ?? '');
}
