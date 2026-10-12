/**
 * FileInput — markup contract, behaviour and accessibility (Appendix E §3.2 FileInput · CsvImport ·
 * ImportReport, Phase-0 part: the native input with label and hint). Sources: board 03 "Textarea ·
 * select · file" (Screenshot (optional)) and board 07 "State 1 · Report a problem · Student" (the
 * same field with its hint "A picture of the screen can help.", described-by). The label, marker
 * and hint are the Field's (forms/field.tsx); FileInput is the `input.xr-file` inside it, as
 * TextInput, Select and Textarea are. CsvImport / ImportReport are Phase 2.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectStylesheetClassesOnly,
  normaliseMarkup,
  type BoardSource,
} from '../testing/index.js';
import { Field } from './field.js';
import { FileInput } from './file-input.js';

const FORM_CONTROLS: BoardSource = { board: '03', frame: 'Textarea · select · file' };
const REPORT_A_PROBLEM: BoardSource = {
  board: '07',
  frame: 'State 1 · Report a problem · Student',
};

/** Board 03 draws the field statically. */
const BOARD_03_FIELD =
  '<div class="xr-field"><label class="xr-label" for="c-file">Screenshot <span class="xr-opt">(optional)</span></label><input id="c-file" class="xr-file" type="file" accept="image/*"></div>';

/**
 * Board 07 draws the field once, in the template every frame of the board renders; `{{ f.id }}` is
 * the frame id, "s1" for "State 1 · Report a problem · Student" (`fr('s1', …)` in its script).
 */
const BOARD_07_FIELD = `<div class="xr-field">
<label class="xr-label" for="{{ f.id }}-shot">Screenshot <span class="xr-opt">(optional)</span></label>
<span class="xr-hint" id="{{ f.id }}-shot-h">A picture of the screen can help.</span>
<input id="{{ f.id }}-shot" class="xr-file" type="file" accept="image/*" aria-describedby="{{ f.id }}-shot-h">
</div>`;

/**
 * The markup with every element's attributes in name order. React DOM writes an input's `type`
 * after its other attributes, so `<input id class type accept>` (board order) renders as
 * `<input accept id class type>`; attribute order carries no meaning in HTML.
 */
function inAttributeOrder(html: string): string {
  const template = document.createElement('template');
  template.innerHTML = normaliseMarkup(html);
  for (const element of template.content.querySelectorAll('*')) {
    const attributes = [...element.attributes]
      .map(({ name, value }) => [name, value] as const)
      .sort(([a], [b]) => a.localeCompare(b));
    for (const [name] of attributes) element.removeAttribute(name);
    for (const [name, value] of attributes) element.setAttribute(name, value);
  }
  return template.innerHTML;
}

/** The board draws `excerpt`, and `element` renders it (attribute order aside). */
function expectRenderedAsDrawnInAnyAttributeOrder(
  element: Element,
  source: BoardSource,
  excerpt: string,
  rendered = excerpt,
): void {
  expectBoardDraws(source, excerpt);
  // Guards the comparison itself: the re-serialised markup still holds the input as drawn.
  expect(inAttributeOrder(rendered)).toContain('<input accept="image/*"');
  expect(inAttributeOrder(element.outerHTML)).toBe(inAttributeOrder(rendered));
}

describe('FileInput markup contract', () => {
  it('inside a Field, renders the field board 03 draws (label, marker, native input)', () => {
    const { container } = render(
      <Field id="c-file" label="Screenshot" marker="(optional)">
        <FileInput accept="image/*" />
      </Field>,
    );
    expectRenderedAsDrawnInAnyAttributeOrder(
      container.firstElementChild!,
      FORM_CONTROLS,
      BOARD_03_FIELD,
    );
    // FileInput itself is the input only: `input.xr-file`, nothing around it.
    expect(container.querySelector('input')!.getAttribute('class')).toBe('xr-file');
  });

  it('with the Field hint, renders board 07 with its template filled (hint `<id>-h`, described-by)', () => {
    const { container } = render(
      <Field
        id="s1-shot"
        label="Screenshot"
        marker="(optional)"
        hint="A picture of the screen can help."
      >
        <FileInput accept="image/*" />
      </Field>,
    );
    expectRenderedAsDrawnInAnyAttributeOrder(
      container.firstElementChild!,
      REPORT_A_PROBLEM,
      BOARD_07_FIELD,
      BOARD_07_FIELD.replaceAll('{{ f.id }}', 's1'),
    );
    // Every element other than the input keeps the board's attribute order exactly.
    expect(normaliseMarkup(container.querySelector('label')!.outerHTML)).toBe(
      '<label class="xr-label" for="s1-shot">Screenshot <span class="xr-opt">(optional)</span></label>',
    );
  });

  it('a required field carries no marker and no description', () => {
    const { container } = render(
      <Field id="c-file" label="Screenshot">
        <FileInput />
      </Field>,
    );
    expect(container.querySelector('.xr-opt')).toBeNull();
    expect(container.querySelector('label')!.textContent).toBe('Screenshot');
    expect(container.querySelector('input')).not.toHaveAttribute('aria-describedby');
    expect(container.querySelector('input')).not.toHaveAttribute('aria-invalid');
  });

  it('an explicit aria-describedby wins over the Field wiring', () => {
    render(
      <>
        <Field id="s1-shot" label="Screenshot" hint="A picture of the screen can help.">
          <FileInput aria-describedby="s1-shot-h s1-shot-note" />
        </Field>
        <p id="s1-shot-note">PNG or JPG</p>
      </>,
    );
    expect(screen.getByLabelText('Screenshot')).toHaveAccessibleDescription(
      'A picture of the screen can help. PNG or JPG',
    );
  });

  it('emits only stylesheet classes', () => {
    const { container } = render(
      <Field
        id="s1-shot"
        label="Screenshot"
        marker="(optional)"
        hint="A picture of the screen can help."
      >
        <FileInput accept="image/*" />
      </Field>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });
});

describe('FileInput behaviour', () => {
  it('is a native file input named by its label and described by its hint', () => {
    render(
      <Field
        id="s1-shot"
        label="Screenshot"
        marker="(optional)"
        hint="A picture of the screen can help."
      >
        <FileInput accept="image/*" />
      </Field>,
    );
    const input = screen.getByLabelText('Screenshot (optional)');
    expect(input).toHaveAttribute('type', 'file');
    expect(input).toHaveAccessibleDescription('A picture of the screen can help.');
  });

  it('reports the chosen file through onChange; the input is reachable through ref', () => {
    const onChange = vi.fn();
    let element: HTMLInputElement | null = null;
    render(
      <Field id="c-file" label="Screenshot">
        <FileInput
          accept="image/*"
          onChange={onChange}
          ref={(node) => {
            element = node;
          }}
        />
      </Field>,
    );
    const file = new File(['png'], 'screen.png', { type: 'image/png' });
    const input = screen.getByLabelText('Screenshot');
    fireEvent.change(input, { target: { files: [file] } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(element).toBe(input);
  });

  it('passes native attributes (multiple, name, required, disabled) to the input', () => {
    render(
      <Field id="c-file" label="Screenshot">
        <FileInput name="shot" multiple required disabled />
      </Field>,
    );
    const input = screen.getByLabelText('Screenshot');
    expect(input).toHaveAttribute('name', 'shot');
    expect(input).toHaveAttribute('multiple');
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
  });
});

describe('FileInput accessibility (axe, WCAG 2.2 AA)', () => {
  it.each([
    [
      'label only',
      <Field id="c-file" label="Screenshot">
        <FileInput accept="image/*" />
      </Field>,
    ],
    [
      'marker and hint',
      <Field
        id="s1-shot"
        label="Screenshot"
        marker="(optional)"
        hint="A picture of the screen can help."
      >
        <FileInput accept="image/*" />
      </Field>,
    ],
    [
      'disabled',
      <Field id="c-file" label="Screenshot">
        <FileInput disabled />
      </Field>,
    ],
  ])('%s', async (_state, element) => {
    const { container } = render(element);
    await assertNoAxeViolations(container);
  });
});
