/**
 * CheckboxGroup, Checkbox, RadioGroup, Radio, ChoiceCard and ChoiceList — markup contract,
 * controlled state and accessibility (Appendix E §3.2 "Checkbox / Radio groups, ChoiceCard").
 * Sources: board 03 "Checkbox · radio · search", "Decision panel and editable table" and "Long
 * values · at 375 and 768"; 09b "AR-8 · used by add person, question editor, correction draft,
 * Help report" (Role); B1-07 "PU-08 Request institutional access · 1440 · interactive" (hint and
 * error in the fieldset's description); B1-11 "SA-03 Request decision · REQ-0042 · 1440 ·
 * interactive" (hidden legend, marker, unavailable choice); B6-07 "CM-03 Publication decision ·
 * SUB-0077 · approved 27 Aug 2026 · 1440" (`is-off`; "Send it to": `legend.xr-label`, the error
 * under the options); B5-04 "VE-04 Formats and delivery · step 2 · 1440 · interactive · 11 Aug
 * 2026" (focusable fieldset, `legend.xr-label`, the error before the options, `-e` error id).
 * Arrow-key movement between native radios is proven in the browser (components-forms-a.spec.ts).
 */
import { createRef, useState } from 'react';
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
import { Checkbox, CheckboxGroup, ChoiceCard, ChoiceList, Radio, RadioGroup } from './choice.js';

const CHECKS: BoardSource = { board: '03', frame: 'Checkbox · radio · search' };
const DECISION_PANEL: BoardSource = { board: '03', frame: 'Decision panel and editable table' };
const LONG_VALUES: BoardSource = { board: '03', frame: 'Long values · at 375 and 768' };
const ROLE: BoardSource = {
  board: '09b',
  frame: 'AR-8 · used by add person, question editor, correction draft, Help report',
};
const ACCESS_TERM: BoardSource = {
  board: 'B1-07',
  frame: 'PU-08 Request institutional access · 1440 · interactive',
};
const REQUEST_DECISION: BoardSource = {
  board: 'B1-11',
  frame: 'SA-03 Request decision · REQ-0042 · 1440 · interactive',
};
const PUBLICATION: BoardSource = {
  board: 'B6-07',
  frame: 'CM-03 Publication decision · SUB-0077 · approved 27 Aug 2026 · 1440',
};
const FORMATS: BoardSource = {
  board: 'B5-04',
  frame: 'VE-04 Formats and delivery · step 2 · 1440 · interactive · 11 Aug 2026',
};
const FORMATS_HINT =
  'Choose every format you are delivering. Each one appears in the catalogue only after it passes review and publication.';
const FAILED_ICON =
  '<svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5v5.5M12 16.5h.01"></path></svg>';

/**
 * The board writes a checked option with a canvas binding (`checked="{{ true }}"`); React renders
 * the boolean attribute (`checked=""`) and sets an input's `type`, `checked` and `name` after its
 * other attributes. The rendered markup equals the excerpt with the binding resolved, compared
 * attribute-order-insensitively (elements, attribute values and text exact).
 */
function expectDrawnWithState(element: Element, source: BoardSource, excerpt: string) {
  expectBoardDraws(source, excerpt);
  expect(canonical(element.outerHTML)).toBe(
    canonical(excerpt.replaceAll('checked="{{ true }}"', 'checked=""')),
  );
}

/** Attribute order is React's for inputs (`type`, `name` last); compare sorted. */
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

describe('Checkbox / Radio groups markup contract', () => {
  it('a checkbox group as board 03 draws "Experiments to give"', () => {
    const { container } = render(
      <CheckboxGroup legend="Experiments to give">
        <Checkbox checked onChange={() => {}}>
          Shell-and-Tube Heat Exchanger
        </Checkbox>
        <Checkbox checked={false} onChange={() => {}}>
          Conduction Through a Composite Wall
        </Checkbox>
      </CheckboxGroup>,
    );
    expectDrawnWithState(
      container.firstElementChild!,
      CHECKS,
      '<fieldset class="xr-fieldset"><legend class="xr-legend">Experiments to give</legend><label class="xr-check"><input type="checkbox" checked="{{ true }}">Shell-and-Tube Heat Exchanger</label><label class="xr-check"><input type="checkbox">Conduction Through a Composite Wall</label></fieldset>',
    );
    expect(screen.getByRole('checkbox', { name: 'Shell-and-Tube Heat Exchanger' })).toBeChecked();
  });

  it('an unchecked check row renders exactly as drawn', () => {
    const { container } = render(<Checkbox>Conduction Through a Composite Wall</Checkbox>);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      CHECKS,
      '<label class="xr-check"><input type="checkbox">Conduction Through a Composite Wall</label>',
    );
  });

  it('a radio group as board 03 draws "Group"', () => {
    const { container } = render(
      <RadioGroup legend="Group" name="c-grp" defaultValue="a">
        <Radio value="a">ME ZG523 · Sem II · Section A</Radio>
        <Radio value="b">ME ZG523 · Sem II · Section B</Radio>
      </RadioGroup>,
    );
    expectDrawnWithState(
      container.firstElementChild!,
      CHECKS,
      '<fieldset class="xr-fieldset"><legend class="xr-legend">Group</legend><label class="xr-check"><input type="radio" name="c-grp" checked="{{ true }}">ME ZG523 · Sem II · Section A</label><label class="xr-check"><input type="radio" name="c-grp">ME ZG523 · Sem II · Section B</label></fieldset>',
    );
    expect(screen.getByRole('radio', { name: 'ME ZG523 · Sem II · Section A' })).toBeChecked();
    expect(screen.getByRole('group', { name: 'Group' })).toBeInTheDocument();
  });

  it('an unchecked radio row renders exactly as drawn (09b AR-8 "Role")', () => {
    render(
      <RadioGroup legend="Role" name="ar8-r" defaultValue="student">
        <Radio value="student">Student</Radio>
        <Radio value="faculty">Faculty</Radio>
      </RadioGroup>,
    );
    expectRenderedAsDrawn(
      screen.getByRole('radio', { name: 'Faculty' }).closest('label')!,
      ROLE,
      '<label class="xr-check"><input type="radio" name="ar8-r">Faculty</label>',
    );
  });

  it('hint after the legend, error under the options, both in the fieldset description (B1-07)', () => {
    expectBoardDraws(
      ACCESS_TERM,
      '<fieldset class="xr-fieldset" aria-describedby="Rr-term-hint"><legend class="xr-legend">Access term</legend><span class="xr-hint" id="Rr-term-hint"',
      'BITS confirms the term when it decides the request.</span><div class="xr-choice-list">',
      `</div><sc-if value="{{ r.termHasErr }}" hint-placeholder-val="{{ false }}"><span class="xr-error"`,
      "'Choose how long you need access'",
    );
    const { container } = render(
      <RadioGroup
        id="Rr-term"
        legend="Access term"
        hint="BITS confirms the term when it decides the request."
        error="Choose how long you need access"
      >
        <ChoiceList>
          <ChoiceCard value="Monthly" title="Monthly" sub="Recurring term" />
          <ChoiceCard
            value="Until a fixed date"
            title="Until a fixed date"
            sub="Access ends on a date you choose"
          />
        </ChoiceList>
      </RadioGroup>,
    );
    const fieldset = container.firstElementChild!;
    expect([...fieldset.children].map((child) => child.className)).toEqual([
      'xr-legend',
      'xr-hint',
      'xr-choice-list',
      'xr-error',
    ]);
    expect(fieldset).toHaveAttribute('aria-describedby', 'Rr-term-h Rr-term-e');
    expect(screen.getByRole('group', { name: 'Access term' })).toHaveAccessibleDescription(
      'BITS confirms the term when it decides the request. Choose how long you need access',
    );
    expect(normaliseMarkup(fieldset.lastElementChild!.outerHTML)).toBe(
      normaliseMarkup(
        `<span class="xr-error" id="Rr-term-e">${FAILED_ICON}Choose how long you need access</span>`,
      ),
    );
  });

  it('B5-04: a focusable fieldset (error-summary target), legend.xr-label, the error before the options', () => {
    const hint = FORMATS_HINT;
    expectBoardDraws(
      FORMATS,
      '<fieldset class="xr-fieldset" id="Dm-fmts" tabindex="-1"',
      '<legend class="xr-label" style="margin-bottom:4px">Formats it supports</legend>',
      `${hint}</span><sc-if value="{{ m.h_fmts }}" hint-placeholder-val="{{ false }}"><span class="xr-error" id="Dm-fmts-e">${FAILED_ICON}{{ m.e_fmts }}</span></sc-if><div class="xv-fmtchecks"><label class="xr-check" for="Dm-fWEB"><input type="checkbox" id="Dm-fWEB"`,
      "'Choose at least one format'",
    );
    render(
      <CheckboxGroup
        id="Dm-fmts"
        tabIndex={-1}
        legend="Formats it supports"
        legendClass="xr-label"
        hint={hint}
        error="Choose at least one format"
        errorPlacement="before-options"
      >
        <Checkbox id="Dm-fWEB">Browser (WEB)</Checkbox>
        <Checkbox id="Dm-fVR">Virtual reality (VR)</Checkbox>
      </CheckboxGroup>,
    );
    const group = screen.getByRole('group', { name: 'Formats it supports' });
    expect(group).toHaveAttribute('id', 'Dm-fmts');
    expect(group).toHaveAttribute('tabindex', '-1');
    expect(group).toHaveAttribute('aria-describedby', 'Dm-fmts-h Dm-fmts-e');
    expect(group).toHaveAccessibleDescription(`${hint} Choose at least one format`);
    expect([...group.children].map((child) => child.className)).toEqual([
      'xr-label',
      'xr-hint',
      'xr-error',
      'xr-check',
      'xr-check',
    ]);
    expect(group.querySelector('legend')!.outerHTML).toBe(
      '<legend class="xr-label">Formats it supports</legend>',
    );
    expect(canonical(group.querySelector('.xr-error')!.outerHTML)).toBe(
      canonical(
        `<span class="xr-error" id="Dm-fmts-e">${FAILED_ICON}Choose at least one format</span>`,
      ),
    );
    // The row as drawn up to its words (B5-04 puts a format badge before them).
    const web = screen.getByRole('checkbox', { name: 'Browser (WEB)' });
    expect(web.closest('label')).toHaveAttribute('class', 'xr-check');
    expect(web.closest('label')).toHaveAttribute('for', 'Dm-fWEB');
    expect(web).toHaveAttribute('id', 'Dm-fWEB');
  });

  it('B6-07 "Send it to": legend.xr-label, cards with ids, the error under the options', () => {
    const reviewer =
      '<label class="xr-choice" for="Dm-to-rv"><input type="radio" name="Dm-to" id="Dm-to-rv" checked="{{ m.toRv }}" onChange="{{ m.pickRv }}"><span><span class="xr-choice-title">Academic Reviewer</span><span class="xr-choice-sub">For a re-check of the academic content</span></span></label>';
    expectBoardDraws(
      PUBLICATION,
      '<fieldset class="xr-fieldset" id="Dm-to"',
      '<legend class="xr-label" style="margin-bottom:6px">Send it to</legend><div class="xr-choice-list">',
      reviewer,
      `</div><sc-if value="{{ m.cHasErrTo }}" hint-placeholder-val="{{ false }}"><span class="xr-error" id="Dm-to-e">${FAILED_ICON}{{ m.cErrTo }}</span></sc-if></fieldset>`,
      "'Choose who it goes back to'",
    );
    render(
      <RadioGroup
        id="Dm-to"
        name="Dm-to"
        legend="Send it to"
        legendClass="xr-label"
        error="Choose who it goes back to"
        value={null}
        onValueChange={() => {}}
      >
        <ChoiceList>
          <ChoiceCard
            id="Dm-to-rv"
            value="reviewer"
            title="Academic Reviewer"
            sub="For a re-check of the academic content"
          />
          <ChoiceCard
            id="Dm-to-ven"
            value="vendor"
            title="Vendor"
            sub="Meridian Virtual Labs — to revise and resubmit"
          />
        </ChoiceList>
      </RadioGroup>,
    );
    const group = screen.getByRole('group', { name: 'Send it to' });
    expect([...group.children].map((child) => child.className)).toEqual([
      'xr-label',
      'xr-choice-list',
      'xr-error',
    ]);
    expect(group).toHaveAttribute('aria-describedby', 'Dm-to-e');
    expect(
      canonical(
        screen.getByRole('radio', { name: /^Academic Reviewer/ }).closest('label')!.outerHTML,
      ),
    ).toBe(canonical(reviewer.replace(' checked="{{ m.toRv }}" onChange="{{ m.pickRv }}"', '')));
  });

  it('a marker after the legend, verbatim (B1-11 "(required to approve)")', () => {
    expectBoardDraws(
      REQUEST_DECISION,
      '<legend class="xr-legend">Internal or external <span class="xr-opt">(required to approve)</span></legend>',
    );
    const { container } = render(
      <RadioGroup legend="Internal or external" marker="(required to approve)">
        <Radio value="Internal">Internal — BITS campus or programme</Radio>
      </RadioGroup>,
    );
    expect(normaliseMarkup(container.querySelector('legend')!.outerHTML)).toBe(
      '<legend class="xr-legend">Internal or external <span class="xr-opt">(required to approve)</span></legend>',
    );
  });
});

describe('ChoiceCard markup contract', () => {
  function DecisionPanel({ value }: { readonly value: string }) {
    return (
      <RadioGroup
        legend="Decision"
        legendClass="xr-sr"
        name="c-dec"
        value={value}
        onValueChange={() => {}}
      >
        <ChoiceCard
          value="approve"
          title="Approve"
          sub="Moves to the Content Manager. Approving does not publish."
        />
        <ChoiceCard value="return" title="Return to vendor" sub="The vendor sees your reason." />
      </RadioGroup>
    );
  }

  it('an unchecked card renders exactly as drawn (board 03 decision panel)', () => {
    render(<DecisionPanel value="return" />);
    expectRenderedAsDrawn(
      screen.getByRole('radio', { name: /^Approve/ }).closest('label')!,
      DECISION_PANEL,
      '<label class="xr-choice"><input type="radio" name="c-dec"><span><span class="xr-choice-title">Approve</span><span class="xr-choice-sub">Moves to the Content Manager. Approving does not publish.</span></span></label>',
    );
  });

  it('the checked card adds is-checked, as board 03 draws it', () => {
    render(<DecisionPanel value="return" />);
    const radio = screen.getByRole('radio', { name: /^Return to vendor/ });
    expectDrawnWithState(
      radio.closest('label')!,
      DECISION_PANEL,
      '<label class="xr-choice is-checked"><input type="radio" name="c-dec" checked="{{ true }}"><span><span class="xr-choice-title">Return to vendor</span><span class="xr-choice-sub">The vendor sees your reason.</span></span></label>',
    );
    expect(radio).toBeChecked();
  });

  it('the hidden legend of a decision panel (board 03, B1-11)', () => {
    expectBoardDraws(DECISION_PANEL, '<legend class="xr-sr">Decision</legend>');
    expectBoardDraws(
      REQUEST_DECISION,
      '<legend class="xr-sr">Decision</legend><div class="xr-choice-list">',
    );
    const { container } = render(<DecisionPanel value="approve" />);
    expect(container.querySelector('legend')!.outerHTML).toBe(
      '<legend class="xr-sr">Decision</legend>',
    );
    expect(screen.getByRole('group', { name: 'Decision' })).toBeInTheDocument();
  });

  it('unavailable: is-off, a disabled radio and the reason in the sub line (B6-07)', () => {
    const { container } = render(
      <RadioGroup legend="Decision" legendClass="xr-sr" name="Dm-cdec">
        <ChoiceCard
          id="Dm-cpx"
          value="publish"
          title="Publish"
          sub="Possible once nothing is missing."
          unavailable
        />
      </RadioGroup>,
    );
    const excerpt =
      '<label class="xr-choice is-off" for="Dm-cpx"><input type="radio" name="Dm-cdec" id="Dm-cpx" disabled="{{ true }}"><span><span class="xr-choice-title">Publish</span><span class="xr-choice-sub">Possible once nothing is missing.</span></span></label>';
    expectBoardDraws(PUBLICATION, excerpt);
    expect(canonical(container.querySelector('label')!.outerHTML)).toBe(
      canonical(excerpt.replace('disabled="{{ true }}"', 'disabled=""')),
    );
    expect(screen.getByRole('radio', { name: /^Publish/ })).toBeDisabled();
  });

  it('cards stack in a ChoiceList (board 03 "Long values")', () => {
    expectBoardDraws(
      LONG_VALUES,
      '<div class="xr-choice-list"><label class="xr-choice"><input type="radio" name="{{ lv.id }}-r" checked="{{ true }}">',
    );
    const { container } = render(
      <ChoiceList>
        <span>cards</span>
      </ChoiceList>,
    );
    expect(container.innerHTML).toBe('<div class="xr-choice-list"><span>cards</span></div>');
  });

  it('an unavailable card must say why (types)', () => {
    // @ts-expect-error — `sub` (the reason) is required when `unavailable`.
    const element = <ChoiceCard value="smaller" title="Approve a smaller scope" unavailable />;
    expect(element.props.unavailable).toBe(true);
  });
});

describe('controlled state', () => {
  it('RadioGroup: value + onValueChange, and the parent decides', () => {
    function Controlled() {
      const [value, setValue] = useState<string | null>(null);
      return (
        <>
          <RadioGroup legend="Group" value={value} onValueChange={setValue}>
            <Radio value="a">ME ZG523 · Sem II · Section A</Radio>
            <Radio value="b">ME ZG523 · Sem II · Section B</Radio>
          </RadioGroup>
          <output>{value ?? 'none'}</output>
        </>
      );
    }
    render(<Controlled />);
    const a = screen.getByRole('radio', { name: 'ME ZG523 · Sem II · Section A' });
    const b = screen.getByRole('radio', { name: 'ME ZG523 · Sem II · Section B' });
    expect(a).not.toBeChecked();
    expect(b).not.toBeChecked();
    fireEvent.click(b);
    expect(b).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('b');
    fireEvent.click(a);
    expect(a).toBeChecked();
    expect(b).not.toBeChecked();
  });

  it('a controlled RadioGroup whose parent refuses keeps the old choice', () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup legend="Group" value="a" onValueChange={onValueChange}>
        <Radio value="a">Section A</Radio>
        <Radio value="b">Section B</Radio>
      </RadioGroup>,
    );
    fireEvent.click(screen.getByRole('radio', { name: 'Section B' }));
    expect(onValueChange).toHaveBeenCalledWith('b');
    expect(screen.getByRole('radio', { name: 'Section A' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Section B' })).not.toBeChecked();
  });

  it('an uncontrolled RadioGroup keeps its own choice; ChoiceCard follows with is-checked', () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup
        legend="Decision"
        legendClass="xr-sr"
        defaultValue="approve"
        onValueChange={onValueChange}
      >
        <ChoiceCard value="approve" title="Approve" sub="Moves to the Content Manager." />
        <ChoiceCard value="return" title="Return to vendor" sub="The vendor sees your reason." />
      </RadioGroup>,
    );
    const approve = screen.getByRole('radio', { name: /^Approve/ });
    const back = screen.getByRole('radio', { name: /^Return to vendor/ });
    expect(approve.closest('label')).toHaveClass('is-checked');
    fireEvent.click(back.closest('label')!.querySelector('.xr-choice-title')!);
    expect(back).toBeChecked();
    expect(back.closest('label')).toHaveClass('xr-choice is-checked');
    expect(approve.closest('label')!.className).toBe('xr-choice');
    expect(onValueChange).toHaveBeenCalledWith('return');
  });

  it('an unavailable card cannot be chosen', () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup legend="Decision" onValueChange={onValueChange}>
        <ChoiceCard
          value="smaller"
          title="Approve a smaller scope"
          sub="Not available for a renewal — the term continues the current plan."
          unavailable
        />
      </RadioGroup>,
    );
    fireEvent.click(screen.getByText('Approve a smaller scope'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('Checkbox: checked + onChange; the whole label toggles it', () => {
    function Controlled() {
      const [checked, setChecked] = useState(false);
      return (
        <Checkbox checked={checked} onChange={(event) => setChecked(event.target.checked)}>
          Conduction Through a Composite Wall
        </Checkbox>
      );
    }
    render(<Controlled />);
    const box = screen.getByRole('checkbox', { name: 'Conduction Through a Composite Wall' });
    fireEvent.click(screen.getByText('Conduction Through a Composite Wall'));
    expect(box).toBeChecked();
    fireEvent.click(box);
    expect(box).not.toBeChecked();
  });

  it('ids: the label points at the input with for, as the product boards draw it', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <RadioGroup legend="Access term" name="Rr-term">
        <Radio id="Rr-term-0" value="Monthly" ref={ref}>
          Monthly
        </Radio>
      </RadioGroup>,
    );
    const radio = screen.getByRole('radio', { name: 'Monthly' });
    expect(ref.current).toBe(radio);
    expect(radio.closest('label')).toHaveAttribute('for', 'Rr-term-0');
  });

  it('a Radio outside a RadioGroup is a programming error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Radio value="a">Section A</Radio>)).toThrow(
      'Radio must be inside a RadioGroup.',
    );
    vi.restoreAllMocks();
  });

  it('radios of one group share a generated name when none is given', () => {
    render(
      <RadioGroup legend="Group">
        <Radio value="a">Section A</Radio>
        <Radio value="b">Section B</Radio>
      </RadioGroup>,
    );
    const [a, b] = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(a!.name).not.toBe('');
    expect(a!.name).toBe(b!.name);
  });
});

describe('classes and accessibility', () => {
  it('emits only stylesheet classes', () => {
    const { container } = render(
      <div>
        <CheckboxGroup legend="Experiments to give" hint="Hint" error="Error">
          <Checkbox defaultChecked>Shell-and-Tube Heat Exchanger</Checkbox>
        </CheckboxGroup>
        <CheckboxGroup
          legend="Formats it supports"
          legendClass="xr-label"
          error="Choose at least one format"
          errorPlacement="before-options"
        >
          <Checkbox>Browser (WEB)</Checkbox>
        </CheckboxGroup>
        <RadioGroup legend="Decision" legendClass="xr-sr" marker="(required)" defaultValue="a">
          <ChoiceList>
            <ChoiceCard value="a" title="Approve" sub="Moves to the Content Manager." />
            <ChoiceCard
              value="b"
              title="Publish"
              sub="Possible once nothing is missing."
              unavailable
            />
          </ChoiceList>
          <Radio value="c">Request more information</Radio>
        </RadioGroup>
      </div>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });

  it.each([
    [
      'checkbox group',
      <CheckboxGroup legend="Experiments to give">
        <Checkbox defaultChecked>Shell-and-Tube Heat Exchanger</Checkbox>
        <Checkbox>Conduction Through a Composite Wall</Checkbox>
      </CheckboxGroup>,
    ],
    [
      'radio group with hint and error',
      <RadioGroup
        legend="Access term"
        hint="BITS confirms the term when it decides the request."
        error="Choose how long you need access"
      >
        <Radio value="Monthly">Monthly</Radio>
        <Radio value="Yearly">Yearly</Radio>
      </RadioGroup>,
    ],
    [
      'checkbox group: legend.xr-label, hint, error before the options, focusable fieldset',
      <CheckboxGroup
        id="Dm-fmts"
        tabIndex={-1}
        legend="Formats it supports"
        legendClass="xr-label"
        hint={FORMATS_HINT}
        error="Choose at least one format"
        errorPlacement="before-options"
      >
        <Checkbox id="Dm-fWEB">Browser (WEB)</Checkbox>
        <Checkbox id="Dm-fVR">Virtual reality (VR)</Checkbox>
      </CheckboxGroup>,
    ],
    [
      'checkbox group with hint and error, one checked',
      <CheckboxGroup
        legend="Formats it supports"
        hint={FORMATS_HINT}
        error="Choose at least one format"
      >
        <Checkbox defaultChecked>Browser (WEB)</Checkbox>
        <Checkbox>Virtual reality (VR)</Checkbox>
      </CheckboxGroup>,
    ],
    [
      'choice cards: none chosen yet, with an error',
      <RadioGroup
        legend="Send it to"
        legendClass="xr-label"
        value={null}
        onValueChange={() => {}}
        error="Choose who it goes back to"
      >
        <ChoiceList>
          <ChoiceCard
            value="reviewer"
            title="Academic Reviewer"
            sub="For a re-check of the academic content"
          />
          <ChoiceCard
            value="vendor"
            title="Vendor"
            sub="Meridian Virtual Labs — to revise and resubmit"
          />
        </ChoiceList>
      </RadioGroup>,
    ],
    [
      'choice cards: checked, unavailable, hidden legend',
      <RadioGroup legend="Decision" legendClass="xr-sr" defaultValue="approve">
        <ChoiceList>
          <ChoiceCard value="approve" title="Approve request" sub="Approve what they asked for." />
          <ChoiceCard
            value="smaller"
            title="Approve a smaller scope"
            sub="Not available for a renewal — the term continues the current plan."
            unavailable
          />
        </ChoiceList>
      </RadioGroup>,
    ],
  ])('axe: %s', async (_state, element) => {
    const { container } = render(element);
    await assertNoAxeViolations(container);
  });
});
