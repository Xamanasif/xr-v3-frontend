/**
 * Field, FieldError and ReadOnlyValue — markup contract, wiring and accessibility (Appendix E §3.2
 * Field; §5.1; Appendix F §6.6). Sources: board 03 "Form controls" (label, marker, hint, error)
 * and "Read-only"; B2-04 "IA-04 Student access · 1440 · after SACC-0310 · interactive" (the
 * "(required)" marker and the `-h` hint id); B2-07 "IA-10 Add student · 1440 · interactive"
 * (`xw-ferr`); B1-11 "SA-03 Request decision · REQ-0042 · 1440 · interactive" ("(required to
 * approve)"); B2-05 "IA-05 Give students access · 1440 · interactive · start here" (read-only
 * value); board 10 "Try it · keyboard and pointer" (the DL-2 reason field).
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
import { Field, FieldError, ReadOnlyValue, useFieldControl } from './field.js';
import { Select } from './select.js';
import { Textarea } from './textarea.js';
import { TextInput } from './text-input.js';

const FORM_CONTROLS: BoardSource = { board: '03', frame: 'Form controls' };
const REASON: BoardSource = {
  board: 'B2-04',
  frame: 'IA-04 Student access · 1440 · after SACC-0310 · interactive',
};
const ADD_STUDENT: BoardSource = {
  board: 'B2-07',
  frame: 'IA-10 Add student · 1440 · interactive',
};
const ACCESS_PLAN: BoardSource = {
  board: 'B2-05',
  frame: 'IA-05 Give students access · 1440 · interactive · start here',
};
const DECISION: BoardSource = {
  board: 'B1-11',
  frame: 'SA-03 Request decision · REQ-0042 · 1440 · interactive',
};
const DIALOG: BoardSource = { board: '10', frame: 'Try it · keyboard and pointer' };
const FAILED_ICON =
  '<svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5v5.5M12 16.5h.01"></path></svg>';

/**
 * Markup with every element's attributes in name order. React sets an input's `type`, `value`
 * and `name` after its other attributes whatever order the board writes them in, so an input
 * excerpt is compared attribute-order-insensitively (elements, attribute values and text exact).
 */
function canonical(html: string): string {
  const template = document.createElement('template');
  template.innerHTML = html;
  const sortAttributes = (element: Element) => {
    const attributes = [...element.attributes]
      .map((attribute) => [attribute.name, attribute.value] as const)
      .sort(([a], [b]) => a.localeCompare(b));
    for (const [name] of attributes) element.removeAttribute(name);
    for (const [name, value] of attributes) element.setAttribute(name, value);
    for (const child of element.children) sortAttributes(child);
  };
  for (const child of template.content.children) sortAttributes(child);
  return normaliseMarkup(template.innerHTML);
}

function expectDrawnUpToAttributeOrder(element: Element, source: BoardSource, excerpt: string) {
  expectBoardDraws(source, excerpt);
  expect(canonical(element.outerHTML)).toBe(canonical(excerpt));
}

describe('Field markup contract (board 03 "Form controls")', () => {
  it('label, hint and textarea render exactly as drawn ("What happened?")', () => {
    const { container } = render(
      <Field id="c-ta" label="What happened?" hint="Say what you were doing and what you saw.">
        <Textarea defaultValue="The VR simulation stopped loading at the second step." />
      </Field>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      FORM_CONTROLS,
      '<div class="xr-field"><label class="xr-label" for="c-ta">What happened?</label><span class="xr-hint" id="c-ta-h">Say what you were doing and what you saw.</span><textarea id="c-ta" class="xr-textarea" aria-describedby="c-ta-h">The VR simulation stopped loading at the second step.</textarea></div>',
    );
  });

  it('a select field renders exactly as drawn ("Course")', () => {
    const { container } = render(
      <Field id="c-sel" label="Course">
        <Select
          options={[
            { label: 'ME ZG523 — Thermodynamics & Heat Transfer' },
            { label: 'ME ZG524 — Fluid Mechanics (sample)' },
          ]}
        />
      </Field>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      FORM_CONTROLS,
      '<div class="xr-field"><label class="xr-label" for="c-sel">Course</label><div class="xr-select-wrap"><select id="c-sel" class="xr-select"><option>ME ZG523 — Thermodynamics &amp; Heat Transfer</option><option>ME ZG524 — Fluid Mechanics (sample)</option></select><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6"></path></svg></div></div>',
    );
  });

  it('the error in words under the field, aria-invalid and aria-describedby ("Institution e-mail")', () => {
    const { container } = render(
      <Field
        id="c-in3"
        label="Institution e-mail"
        error="Enter a full e-mail address, like name@institution.edu"
      >
        <TextInput type="email" defaultValue="rahul.verma@godavari" />
      </Field>,
    );
    expectDrawnUpToAttributeOrder(
      container.firstElementChild!,
      FORM_CONTROLS,
      `<div class="xr-field"><label class="xr-label" for="c-in3">Institution e-mail</label><input id="c-in3" class="xr-input" type="email" value="rahul.verma@godavari" aria-invalid="true" aria-describedby="c-in3-e"><span id="c-in3-e" class="xr-error">${FAILED_ICON}Enter a full e-mail address, like name@institution.edu</span></div>`,
    );
  });

  it('the marker is rendered verbatim, and a render function wires any control ("Screenshot")', () => {
    const { container } = render(
      <Field id="c-file" label="Screenshot" marker="(optional)">
        {(control) => <input {...control} className="xr-file" type="file" accept="image/*" />}
      </Field>,
    );
    expectDrawnUpToAttributeOrder(
      container.firstElementChild!,
      FORM_CONTROLS,
      '<div class="xr-field"><label class="xr-label" for="c-file">Screenshot <span class="xr-opt">(optional)</span></label><input id="c-file" class="xr-file" type="file" accept="image/*"></div>',
    );
  });

  it('"(required)" and the hint id as B2-04 draws them (DL-2 reason)', () => {
    render(
      <Field
        id="Sa-reason"
        label="Reason"
        marker="(required)"
        hint="Kept in the access history, which your institution’s administrators can see."
      >
        <Textarea />
      </Field>,
    );
    const textarea = screen.getByRole('textbox', { name: 'Reason (required)' });
    expectRenderedAsDrawn(
      textarea.closest('.xr-field')!.querySelector('label')!,
      REASON,
      '<label class="xr-label" for="Sa-reason">Reason <span class="xr-opt">(required)</span></label>',
    );
    expectRenderedAsDrawn(
      textarea.closest('.xr-field')!.querySelector('.xr-hint')!,
      REASON,
      '<span class="xr-hint" id="Sa-reason-h">Kept in the access history, which your institution’s administrators can see.</span>',
    );
    expect(textarea).toHaveAttribute('aria-describedby', 'Sa-reason-h');
  });

  it.each([
    ['(optional)', FORM_CONTROLS],
    ['(required)', REASON],
    ['(required to approve)', DECISION],
    ['(from your plan)', REASON],
  ] as const)('renders the marker %s exactly as given', (marker, source) => {
    expectBoardDraws(source, `<span class="xr-opt">${marker}</span>`);
    const { container } = render(
      <Field label="Group" marker={marker}>
        <TextInput />
      </Field>,
    );
    expect(container.querySelector('.xr-opt')!.outerHTML).toBe(
      `<span class="xr-opt">${marker}</span>`,
    );
  });

  it('the workspace boards\' error class `xw-ferr` (B2-07 "Full name")', () => {
    expectBoardDraws(
      ADD_STUDENT,
      `<span id="Aa-name-e" class="xw-ferr">${FAILED_ICON}{{ a.name.err }}</span>`,
      "'Enter the full name'",
    );
    const { container } = render(
      <Field id="Aa-name" label="Full name" error="Enter the full name" errorClass="xw-ferr">
        <TextInput />
      </Field>,
    );
    expect(canonical(container.querySelector('#Aa-name-e')!.outerHTML)).toBe(
      canonical(`<span id="Aa-name-e" class="xw-ferr">${FAILED_ICON}Enter the full name</span>`),
    );
  });

  it('a DL-2 reason field: the error id joins aria-describedby only while it shows (board 10)', () => {
    expectBoardDraws(
      DIALOG,
      '<span id="d2-err" class="xr-error">',
      'aria-invalid="{{ reasonInvalid }}" aria-describedby="d2-err"',
    );
    const { rerender } = render(
      <Field id="d2-r" label="Reason the vendor will see">
        <Textarea />
      </Field>,
    );
    const reason = screen.getByRole('textbox', { name: 'Reason the vendor will see' });
    expect(reason).not.toHaveAttribute('aria-invalid');
    expect(reason).not.toHaveAttribute('aria-describedby');
    rerender(
      <Field
        id="d2-r"
        label="Reason the vendor will see"
        error="Add a reason so the vendor knows what to change"
      >
        <Textarea />
      </Field>,
    );
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    expect(reason).toHaveAttribute('aria-describedby', 'd2-r-e');
    expect(reason).toHaveAccessibleDescription('Add a reason so the vendor knows what to change');
  });
});

describe('Field wiring', () => {
  it('hint then error in aria-describedby; the description reads both', () => {
    render(
      <Field
        id="Aa-sid"
        label="Student ID"
        hint="Your institution’s ID for this student, for example GIT-2026-0418."
        error="Enter the student ID"
      >
        <TextInput />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Student ID' });
    expect(input).toHaveAttribute('aria-describedby', 'Aa-sid-h Aa-sid-e');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(
      'Your institution’s ID for this student, for example GIT-2026-0418. Enter the student ID',
    );
  });

  it('generates the id when none is given, and the label still names the control', () => {
    render(
      <Field label="Course">
        <Select options={[{ label: 'ME ZG523 — Thermodynamics & Heat Transfer' }]} />
      </Field>,
    );
    const select = screen.getByRole('combobox', { name: 'Course' });
    expect(select.id).not.toBe('');
  });

  it('explicit control props win over the Field', () => {
    render(
      <Field id="outer" label="Full name" error="Enter the full name">
        <TextInput id="inner" aria-describedby="elsewhere" invalid={false} />
      </Field>,
    );
    const input = screen.getByRole('textbox');
    expect(input.id).toBe('inner');
    expect(input).toHaveAttribute('aria-describedby', 'elsewhere');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('useFieldControl gives a custom control the wiring, and null outside a Field', () => {
    let outside: unknown = 'unset';
    function Probe() {
      const control = useFieldControl();
      return <output>{JSON.stringify(control)}</output>;
    }
    function Outside() {
      outside = useFieldControl();
      return null;
    }
    render(
      <>
        <Field id="p" label="Probe" hint="Hint" error="Error">
          <Probe />
        </Field>
        <Outside />
      </>,
    );
    expect(JSON.parse(screen.getByRole('status').textContent ?? '')).toEqual({
      id: 'p',
      'aria-describedby': 'p-h p-e',
      'aria-invalid': true,
    });
    expect(outside).toBeNull();
  });

  it('FieldError on its own renders the drawn error line (B1-11 decision group)', () => {
    expectBoardDraws(
      DECISION,
      `<span class="xr-error">${FAILED_ICON}{{ a.e.choice }}</span>`,
      "'Choose a decision'",
    );
    const { container } = render(<FieldError>Choose a decision</FieldError>);
    expect(normaliseMarkup(container.innerHTML)).toBe(
      normaliseMarkup(`<span class="xr-error">${FAILED_ICON}Choose a decision</span>`),
    );
  });
});

describe('ReadOnlyValue (xr-ro)', () => {
  it('renders exactly as the product boards draw it (B2-05 "Licences")', () => {
    const { container } = render(
      <ReadOnlyValue label="Licences">
        Access plan ACC-0107 · 120 licences · Yearly, ends 7 Oct 2027
      </ReadOnlyValue>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      ACCESS_PLAN,
      '<div class="xr-ro"><span class="xr-label">Licences</span><span class="xr-ro-val">Access plan ACC-0107 · 120 licences · Yearly, ends 7 Oct 2027</span></div>',
    );
  });

  it('a note says who has it and when it can change (board 03 "Read-only")', () => {
    const { container } = render(
      <ReadOnlyValue label="Submission" note="You can edit again if it is returned to you.">
        With Academic Reviewer since 2 Oct.
      </ReadOnlyValue>,
    );
    const tail =
      '<span class="xr-ro-val">With Academic Reviewer since 2 Oct.</span><span class="xr-meta">You can edit again if it is returned to you.</span>';
    expectBoardDraws({ board: '03', frame: 'Read-only' }, tail);
    expect(normaliseMarkup(container.firstElementChild!.innerHTML)).toBe(
      normaliseMarkup(`<span class="xr-label">Submission</span>${tail}`),
    );
    expectBoardDraws(FORM_CONTROLS, 'Read-only · set at import');
  });
});

describe('Field emits only stylesheet classes and passes axe', () => {
  it('stylesheet classes only', () => {
    const { container } = render(
      <div>
        <Field className="xr-toolbar-search" label="Search" hint="Hint" error="Error">
          <TextInput type="search" />
        </Field>
        <Field label="Full name" error="Enter the full name" errorClass="xw-ferr">
          <TextInput />
        </Field>
        <ReadOnlyValue label="Student ID" note="Read-only · set at import">
          GIT-2026-0418
        </ReadOnlyValue>
      </div>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });

  it.each([
    [
      'default',
      <Field label="Full name">
        <TextInput placeholder="For example, Rahul Verma" />
      </Field>,
    ],
    [
      'marker + hint',
      <Field label="Reason" marker="(required)" hint="Kept in the access history.">
        <Textarea />
      </Field>,
    ],
    [
      'invalid',
      <Field
        label="Institution e-mail"
        error="Enter a full e-mail address, like name@institution.edu"
      >
        <TextInput type="email" defaultValue="rahul.verma@godavari" />
      </Field>,
    ],
    [
      'xw-ferr',
      <Field label="Full name" error="Enter the full name" errorClass="xw-ferr">
        <TextInput />
      </Field>,
    ],
    [
      'read-only value',
      <ReadOnlyValue label="Student ID" note="Read-only · set at import">
        GIT-2026-0418
      </ReadOnlyValue>,
    ],
  ])('axe: %s', async (_state, element) => {
    const { container } = render(element);
    await assertNoAxeViolations(container);
  });
});
