/**
 * Select — markup contract, states and accessibility (Appendix E §3.2 Select). Sources: board 03
 * "Textarea · select · file" and "Long values · at 375 and 768"; 09a "AR-2 · used by catalogue,
 * queues, people, content lists" (toolbar filter); B2-07 "IA-10 Add student · 1440 ·
 * interactive" (options with values, "No group"); B7-08 "SA-17 Role holder · Dr K. Iyer · no
 * scope · 1440 · interactive" (invalid, with its error).
 */
import { createRef } from 'react';
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
import { Field } from './field.js';
import { Select } from './select.js';

const SELECT: BoardSource = { board: '03', frame: 'Textarea · select · file' };
const LONG_VALUES: BoardSource = { board: '03', frame: 'Long values · at 375 and 768' };
const TOOLBAR: BoardSource = {
  board: '09a',
  frame: 'AR-2 · used by catalogue, queues, people, content lists',
};
const ADD_STUDENT: BoardSource = {
  board: 'B2-07',
  frame: 'IA-10 Add student · 1440 · interactive',
};
const ROLE_HOLDER: BoardSource = {
  board: 'B7-08',
  frame: 'SA-17 Role holder · Dr K. Iyer · no scope · 1440 · interactive',
};
const CHEVRON =
  '<svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6"></path></svg>';
const COURSES = [
  { label: 'ME ZG523 — Thermodynamics & Heat Transfer' },
  { label: 'ME ZG524 — Fluid Mechanics (sample)' },
];

describe('Select markup contract', () => {
  it('the native select in its wrap with the drawn chevron (board 03 "Course")', () => {
    const { container } = render(<Select id="c-sel" options={COURSES} />);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      SELECT,
      `<div class="xr-select-wrap"><select id="c-sel" class="xr-select"><option>ME ZG523 — Thermodynamics &amp; Heat Transfer</option><option>ME ZG524 — Fluid Mechanics (sample)</option></select>${CHEVRON}</div>`,
    );
  });

  it('a toolbar filter (09a AR-2 "Status")', () => {
    const { container } = render(
      <Field id="ar2-f" label="Status">
        <Select
          options={[
            { label: 'All statuses' },
            { label: 'Under review' },
            { label: 'Information requested' },
            { label: 'Approved — payment required' },
            { label: 'Access active' },
          ]}
        />
      </Field>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      TOOLBAR,
      `<div class="xr-field"><label class="xr-label" for="ar2-f">Status</label><div class="xr-select-wrap"><select id="ar2-f" class="xr-select"><option>All statuses</option><option>Under review</option><option>Information requested</option><option>Approved — payment required</option><option>Access active</option></select>${CHEVRON}</div></div>`,
    );
  });

  it('options with values, as B2-07 draws "Group"', () => {
    const options =
      '<option value="">No group</option><option value="g1">ME ZG523 — Sem II</option><option value="g2">Lab batch B</option>';
    expectBoardDraws(ADD_STUDENT, '<select id="Aa-grp" class="xr-select"', options);
    render(
      <Field id="Aa-grp" label="Group" marker="(optional)">
        <Select
          options={[
            { value: '', label: 'No group' },
            { value: 'g1', label: 'ME ZG523 — Sem II' },
            { value: 'g2', label: 'Lab batch B' },
          ]}
        />
      </Field>,
    );
    const select = screen.getByRole('combobox', { name: 'Group (optional)' });
    expect(normaliseMarkup(select.innerHTML)).toBe(normaliseMarkup(options));
  });

  it('a long value keeps the code first (board 03 "Long values")', () => {
    expectBoardDraws(
      LONG_VALUES,
      '<option>ME ZG531 — Computational Fluid Dynamics and Heat Transfer Applications (sample)</option>',
    );
    render(
      <Select
        aria-label="Course"
        options={[
          { label: 'ME ZG523 — Thermodynamics & Heat Transfer' },
          {
            label:
              'ME ZG531 — Computational Fluid Dynamics and Heat Transfer Applications (sample)',
          },
        ]}
      />,
    );
    expect(
      screen.getByRole('option', {
        name: 'ME ZG531 — Computational Fluid Dynamics and Heat Transfer Applications (sample)',
      }),
    ).toBeInTheDocument();
  });

  it('invalid: aria-invalid and the error under it, as B7-08 draws "Course"', () => {
    expectBoardDraws(
      ROLE_HOLDER,
      '<div class="xr-select-wrap"><select id="Rh-scs" class="xr-select"',
      'aria-invalid="{{ Rh.iV }}"><option value="">Choose a course</option><option value="ME ZG523">ME ZG523 · Thermodynamics & Heat Transfer</option>',
      '<span class="xr-error" id="Rh-scs-e">',
      "'Choose a course'",
    );
    render(
      <Field id="Rh-scs" label="Course" error="Choose a course">
        <Select
          value=""
          onChange={() => {}}
          options={[
            { value: '', label: 'Choose a course' },
            { value: 'ME ZG523', label: 'ME ZG523 · Thermodynamics & Heat Transfer' },
          ]}
        />
      </Field>,
    );
    const select = screen.getByRole('combobox', { name: 'Course' });
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAttribute('aria-describedby', 'Rh-scs-e');
    expect(select).toHaveAccessibleDescription('Choose a course');
    expect(select.closest('.xr-field')!.lastElementChild).toHaveClass('xr-error');
  });
});

describe('Select behaviour', () => {
  it('is controlled: value + onChange', () => {
    const onChange = vi.fn();
    const options = [
      { value: '', label: 'No group' },
      { value: 'g1', label: 'ME ZG523 — Sem II' },
    ];
    const { rerender } = render(
      <Select aria-label="Group" value="" onChange={onChange} options={options} />,
    );
    const select = screen.getByRole('combobox', { name: 'Group' });
    fireEvent.change(select, { target: { value: 'g1' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    rerender(<Select aria-label="Group" value="g1" onChange={onChange} options={options} />);
    expect(select).toHaveValue('g1');
  });

  it('a disabled option, and the ref reaches the select', () => {
    const ref = createRef<HTMLSelectElement>();
    render(
      <Select
        aria-label="Course"
        ref={ref}
        options={[COURSES[0]!, { label: 'ME ZG524 — Fluid Mechanics (sample)', disabled: true }]}
      />,
    );
    expect(ref.current).toBe(screen.getByRole('combobox', { name: 'Course' }));
    expect(
      screen.getByRole('option', { name: 'ME ZG524 — Fluid Mechanics (sample)' }),
    ).toBeDisabled();
  });

  it('the chevron is decorative', () => {
    const { container } = render(<Select aria-label="Course" options={COURSES} />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Select classes and accessibility', () => {
  it('emits only stylesheet classes', () => {
    const { container } = render(<Select aria-label="Course" options={COURSES} invalid />);
    expectStylesheetClassesOnly(container.firstElementChild!);
  });

  it.each([
    ['default', <Select aria-label="Course" options={COURSES} />],
    ['invalid', <Select aria-label="Course" options={COURSES} invalid />],
    [
      'in a field with a hint',
      <Field label="Course" hint="Courses in your content access">
        <Select options={COURSES} />
      </Field>,
    ],
  ])('axe: %s', async (_state, element) => {
    const { container } = render(element);
    await assertNoAxeViolations(container);
  });
});
