/**
 * TextInput — markup contract, states and accessibility (Appendix E §3.2 TextInput). Sources:
 * board 03 "Form controls" ("Text input", "Checkbox · radio · search"), 09a "AR-2 · used by
 * catalogue, queues, people, content lists" (toolbar search) and B1-07 "PU-08 Request
 * institutional access · 1440 · interactive" (native date, tel). The password reveal (`xp-pw`,
 * B1-09) is Phase 1 under owner decision G-8 and is not built.
 */
import { createRef } from 'react';
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
import { TextInput } from './text-input.js';

const TEXT_INPUT: BoardSource = { board: '03', frame: 'Text input' };
const SEARCH: BoardSource = { board: '03', frame: 'Checkbox · radio · search' };
const TOOLBAR: BoardSource = {
  board: '09a',
  frame: 'AR-2 · used by catalogue, queues, people, content lists',
};
const REQUEST: BoardSource = {
  board: 'B1-07',
  frame: 'PU-08 Request institutional access · 1440 · interactive',
};
const SEARCH_ICON =
  '<svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4"></path></svg>';

/**
 * Markup with every element's attributes in name order. React sets an input's `type` and
 * `value` after its other attributes whatever order the board writes them in, so input excerpts
 * are compared attribute-order-insensitively (elements, attribute values and text exact).
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

describe('TextInput markup contract', () => {
  it('text with a placeholder, under its label (board 03 "Full name")', () => {
    const { container } = render(
      <Field id="c-in1" label="Full name">
        <TextInput placeholder="For example, Rahul Verma" />
      </Field>,
    );
    expectDrawnUpToAttributeOrder(
      container.firstElementChild!,
      TEXT_INPUT,
      '<div class="xr-field"><label class="xr-label" for="c-in1">Full name</label><input id="c-in1" class="xr-input" type="text" placeholder="For example, Rahul Verma"></div>',
    );
  });

  it('search: the drawn search box with the leading Search icon (board 03 "Search people")', () => {
    const { container } = render(
      <Field id="c-srch" label="Search people">
        <TextInput type="search" placeholder="Name or e-mail" />
      </Field>,
    );
    expectDrawnUpToAttributeOrder(
      container.firstElementChild!,
      SEARCH,
      `<div class="xr-field"><label class="xr-label" for="c-srch">Search people</label><div class="xr-search">${SEARCH_ICON}<input id="c-srch" class="xr-input" type="search" placeholder="Name or e-mail"></div></div>`,
    );
  });

  it('toolbar search: the board context class on the field (09a AR-2)', () => {
    const { container } = render(
      <Field id="ar2-s" label="Search" className="xr-toolbar-search">
        <TextInput type="search" placeholder="Reference or institution" />
      </Field>,
    );
    expectDrawnUpToAttributeOrder(
      container.firstElementChild!,
      TOOLBAR,
      `<div class="xr-field xr-toolbar-search"><label class="xr-label" for="ar2-s">Search</label><div class="xr-search">${SEARCH_ICON}<input id="ar2-s" class="xr-input" type="search" placeholder="Reference or institution"></div></div>`,
    );
  });

  it('native date and tel, as B1-07 draws them', () => {
    expectBoardDraws(
      REQUEST,
      'class="xr-input" type="date" value="{{ r.until.val }}" aria-invalid="{{ r.until.invalid }}"',
      'class="xr-input" type="tel" autocomplete="tel"',
    );
    render(
      <>
        <Field id="Rr-until" label="End date">
          <TextInput type="date" defaultValue="2027-10-07" />
        </Field>
        <Field id="Rr-phone" label="Phone" marker="(optional)">
          <TextInput type="tel" autoComplete="tel" />
        </Field>
      </>,
    );
    const date = screen.getByLabelText('End date');
    expect(date).toHaveAttribute('type', 'date');
    expect(date).toHaveClass('xr-input', { exact: true });
    expect(date).toHaveValue('2027-10-07');
    const phone = screen.getByRole('textbox', { name: 'Phone (optional)' });
    expect(normaliseMarkup(phone.outerHTML)).toBe(
      '<input autocomplete="tel" id="Rr-phone" class="xr-input" type="tel">',
    );
  });

  it('invalid on its own: aria-invalid="true" (board 03 "Institution e-mail")', () => {
    expectBoardDraws(
      TEXT_INPUT,
      'class="xr-input" type="email" value="rahul.verma@godavari" aria-invalid="true"',
    );
    render(<TextInput type="email" aria-label="Institution e-mail" invalid />);
    expect(screen.getByRole('textbox', { name: 'Institution e-mail' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('read-only is the native attribute; no read-only input is drawn', () => {
    render(<TextInput aria-label="Student ID" readOnly value="GIT-2026-0418" />);
    const input = screen.getByRole('textbox', { name: 'Student ID' });
    expect(input).toHaveAttribute('readonly');
    expect(input).toHaveValue('GIT-2026-0418');
  });

  it('offers no password type (G-8: the reveal is Phase 1)', () => {
    // @ts-expect-error — 'password' is not a TextInputType.
    const element = <TextInput type="password" aria-label="Password" />;
    expect(element.props.type).toBe('password');
  });
});

describe('TextInput behaviour', () => {
  it('is controlled the React way: value + onChange', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TextInput aria-label="Full name" value="Rahul Ver" onChange={onChange} />,
    );
    const input = screen.getByRole('textbox', { name: 'Full name' });
    fireEvent.change(input, { target: { value: 'Rahul Verma' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('Rahul Ver');
    rerender(<TextInput aria-label="Full name" value="Rahul Verma" onChange={onChange} />);
    expect(input).toHaveValue('Rahul Verma');
  });

  it('forwards the ref to the input, also inside the search box', () => {
    const ref = createRef<HTMLInputElement>();
    render(<TextInput type="search" aria-label="Search people" ref={ref} />);
    expect(ref.current).toBe(screen.getByRole('searchbox', { name: 'Search people' }));
    expect(ref.current?.parentElement).toHaveClass('xr-search');
  });

  it('the search icon is decorative; the label names the search box', () => {
    render(
      <Field label="Search people">
        <TextInput type="search" placeholder="Name or e-mail" />
      </Field>,
    );
    const search = screen.getByRole('searchbox', { name: 'Search people' });
    expect(search.previousElementSibling).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('TextInput classes and accessibility', () => {
  it('emits only stylesheet classes', () => {
    const { container } = render(
      <div>
        <TextInput aria-label="Full name" />
        <TextInput type="search" aria-label="Search" invalid />
      </div>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });

  it.each([
    ['text', <TextInput aria-label="Full name" placeholder="For example, Rahul Verma" />],
    ['email', <TextInput type="email" aria-label="Institution e-mail" />],
    ['search', <TextInput type="search" aria-label="Search people" />],
    ['date', <TextInput type="date" aria-label="End date" />],
    ['tel', <TextInput type="tel" aria-label="Phone" autoComplete="tel" />],
    ['invalid', <TextInput type="email" aria-label="Institution e-mail" invalid />],
    ['read-only', <TextInput aria-label="Student ID" readOnly value="GIT-2026-0418" />],
  ])('axe: %s', async (_state, element) => {
    const { container } = render(element);
    await assertNoAxeViolations(container);
  });
});
