/**
 * ErrorSummary — markup contract, behaviour and accessibility (Appendix E §3.2 ErrorSummary,
 * §5.1; Appendix F §6.6). Sources: B4-04 "Step 2 · validation" (`xw-errsum`, linked items,
 * "Check this step", focus on every failed submit), B3-06 "Missing ratings" (the title given per
 * screen), board 12 "Patterns" ("Summary links move focus to the field"), B2-05 "Validation ·
 * step 1" (the plain-text variance normalised to links, VD-21) and board 03 "Form controls" (the
 * Batch-0 `xr-notice--err` drawing that VD-22 keeps open). Every excerpt uses the cited frame's
 * own binding and ids (`Cc2e-…` on B4-04, `Bfe-…` on B3-06, `g1e` on B2-05). The B5 missing-items
 * summary is Phase 5.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { LinkProvider, type LinkRenderProps } from '../link.js';
import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectStylesheetClassesOnly,
  normaliseMarkup,
  type BoardSource,
} from '../testing/index.js';
import { ChoiceCard, ChoiceList, RadioGroup } from './choice.js';
import { ErrorSummary, type ErrorSummaryItem } from './error-summary.js';

const RULES_VALIDATION: BoardSource = { board: 'B4-04', frame: 'Step 2 · validation' };
const MISSING_RATINGS: BoardSource = { board: 'B3-06', frame: 'Missing ratings' };
const PATTERNS: BoardSource = { board: '12', frame: 'Patterns' };
const STEP_1_VALIDATION: BoardSource = { board: 'B2-05', frame: 'Validation · step 1' };
const FORM_CONTROLS: BoardSource = { board: '03', frame: 'Form controls' };
const PUBLICATION: BoardSource = {
  board: 'B6-07',
  frame: 'CM-03 Publication decision · SUB-0077 · approved 27 Aug 2026 · 1440',
};

/** B4-04 "Step 2 · validation" draws the summary once; `sc-for` repeats the item per error. */
const B4_04_SUMMARY =
  '<div class="xw-errsum" role="alert" id="Cc2e-err" tabindex="-1"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5v5.5M12 16.5h.01"></path></svg><div><strong>Check this step</strong><ul><sc-for list="{{ c2e.errList }}" as="e" hint-placeholder-count="1"><li><a href="{{ e.href }}">{{ e.t }}</a></li></sc-for></ul></div></div>';

/** The B4-04 rule errors for two fields (copy from its script, ids from that frame). */
const RULE_ERRORS: readonly ErrorSummaryItem[] = [
  { fieldId: 'Cc2e-name', summaryText: 'Enter a name for the assessment' },
  { fieldId: 'Cc2e-dl', summaryText: 'Enter the deadline' },
];

/** The board excerpt with the `sc-for` template expanded for `items`. */
function filled(excerpt: string, items: readonly ErrorSummaryItem[]): string {
  return excerpt.replace(/<sc-for[^>]*>(.*)<\/sc-for>/, (_all, item: string) =>
    items
      .map((entry) =>
        item.replace('{{ e.href }}', `#${entry.fieldId}`).replace('{{ e.t }}', entry.summaryText),
      )
      .join(''),
  );
}

/** The two fields the summary links to, as the B4-04 frame labels them. */
function Fields() {
  return (
    <>
      <label htmlFor="Cc2e-name">Assessment name</label>
      <input id="Cc2e-name" />
      <label htmlFor="Cc2e-dl">Deadline</label>
      <input id="Cc2e-dl" />
    </>
  );
}

describe('ErrorSummary markup contract', () => {
  it('renders the B4-04 summary with its template filled', () => {
    expectBoardDraws(
      RULES_VALIDATION,
      B4_04_SUMMARY,
      '<label class="xr-label" for="Cc2e-name">Assessment name</label>',
      'id="Cc2e-dl"',
      "e.name = 'Enter a name for the assessment'",
      "e.dl = 'Enter the deadline'",
      "href: '#' + pid + '-' + k",
    );
    const { container } = render(
      <ErrorSummary id="Cc2e-err" title="Check this step" items={RULE_ERRORS} />,
    );
    const expected = normaliseMarkup(filled(B4_04_SUMMARY, RULE_ERRORS));
    // Guards the expansion itself: two linked items, no template left.
    expect(expected).toContain('<li><a href="#Cc2e-dl">Enter the deadline</a></li>');
    expect(expected).not.toContain('{{');
    expect(normaliseMarkup(container.firstElementChild!.outerHTML)).toBe(expected);
  });

  it('the title is the caller’s, per screen (B3-06 "{{ fe.errTitle }}")', () => {
    expectBoardDraws(
      MISSING_RATINGS,
      '<div class="xw-errsum" role="alert" id="Bfe-errsum" tabindex="-1">',
      '<div><strong>{{ fe.errTitle }}</strong><ul><sc-for list="{{ fe.errList }}" as="e" hint-placeholder-count="1"><li><a href="{{ e.href }}">{{ e.t }}</a></li></sc-for></ul></div>',
      "errTitle: errList.length === 1 ? 'One rating is missing'",
      "t: 'Choose a rating for statement ' + n, href: '#' + pid + '-q' + n",
    );
    render(
      <ErrorSummary
        id="Bfe-errsum"
        title="One rating is missing"
        items={[{ fieldId: 'Bfe-q2', summaryText: 'Choose a rating for statement 2' }]}
      />,
    );
    const summary = screen.getByRole('alert');
    expect(summary).toHaveAttribute('id', 'Bfe-errsum');
    expect(summary.querySelector('strong')).toHaveTextContent('One rating is missing');
    expect(screen.getByRole('link', { name: 'Choose a rating for statement 2' })).toHaveAttribute(
      'href',
      '#Bfe-q2',
    );
  });

  it('always linked: the plain-text items B2-05 draws become links (VD-21)', () => {
    expectBoardDraws(
      STEP_1_VALIDATION,
      '<div class="xw-errsum" role="alert" id="Gg1e-err" tabindex="-1">',
      '<ul><sc-for list="{{ g1e.errs }}" as="e" hint-placeholder-count="1"><li>{{ e.t }}</li></sc-for></ul>',
    );
    render(<ErrorSummary title="Check this step" items={RULE_ERRORS} />);
    const items = screen.getAllByRole('listitem');
    expect(items.map((item) => item.firstElementChild?.tagName)).toEqual(['A', 'A']);
    expect(screen.getByRole('link', { name: 'Enter the deadline' })).toHaveAttribute(
      'href',
      '#Cc2e-dl',
    );
  });

  it('emits xw-errsum, not the Batch-0 xr-notice--err drawing (VD-22, open)', () => {
    expectBoardDraws(
      FORM_CONTROLS,
      '<div class="xr-notice xr-notice--err" role="alert"',
      '<span class="xr-notice-title">Two things need fixing before you can continue</span>',
    );
    const { container } = render(
      <ErrorSummary title="Two things need fixing before you can continue" items={RULE_ERRORS} />,
    );
    expect(container.firstElementChild!.className).toBe('xw-errsum');
    expect(container.querySelector('.xr-notice')).toBeNull();
  });

  it('renders nothing while there is nothing to fix (the boards’ sc-if hasErr)', () => {
    expectBoardDraws(
      RULES_VALIDATION,
      '<sc-if value="{{ c2e.hasErr }}" hint-placeholder-val="{{ false }}"><div class="xw-errsum"',
    );
    const { container } = render(<ErrorSummary title="Check this step" items={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('emits only stylesheet classes', () => {
    const { container } = render(<ErrorSummary title="Check this step" items={RULE_ERRORS} />);
    expectStylesheetClassesOnly(container.firstElementChild!);
  });
});

describe('ErrorSummary behaviour', () => {
  it('a summary link moves focus to its field and does not navigate (board 12)', () => {
    expectBoardDraws(PATTERNS, 'Summary links move focus to the field');
    render(
      <>
        <ErrorSummary title="Check this step" items={RULE_ERRORS} />
        <Fields />
      </>,
    );
    const before = window.location.href;
    const link = screen.getByRole('link', { name: 'Enter the deadline' });
    const notCancelled = fireEvent.click(link);
    expect(notCancelled).toBe(false);
    expect(screen.getByLabelText('Deadline')).toHaveFocus();
    expect(window.location.href).toBe(before);
  });

  it.each([
    ['the group itself when it takes focus (B4-04 fieldset tabindex=-1)', true],
    ['the first control of a group that does not take focus', false],
  ])('a link to a group focuses %s', (_case, focusable) => {
    expectBoardDraws(
      RULES_VALIDATION,
      '<fieldset class="xr-fieldset" id="Cc2e-rel" tabindex="-1"',
      '>When students see their result and answers</legend>',
      "e.rel = 'Choose when students see their result'",
    );
    render(
      <>
        <ErrorSummary
          title="Check this step"
          items={[{ fieldId: 'Cc2e-rel', summaryText: 'Choose when students see their result' }]}
        />
        <fieldset id="Cc2e-rel" tabIndex={focusable ? -1 : undefined}>
          <legend>When students see their result and answers</legend>
          <label>
            <input type="radio" name="Cc2e-rel" /> Immediately after marking
          </label>
          <label>
            <input type="radio" name="Cc2e-rel" /> After the deadline
          </label>
        </fieldset>
      </>,
    );
    fireEvent.click(screen.getByRole('link'));
    expect(
      focusable
        ? screen.getByRole('group', { name: 'When students see their result and answers' })
        : screen.getByRole('radio', { name: 'Immediately after marking' }),
    ).toHaveFocus();
  });

  it('a link to a group that does not take focus skips an unavailable first option', () => {
    // Hardens the documented fallback through the public API (RadioGroup with an id and no
    // tabIndex). The cards are drawn on B6-07, whose decision group is never a summary target: no
    // board reports a group whose first option is unavailable.
    expectBoardDraws(
      PUBLICATION,
      '<label class="xr-choice is-off" for="Dm-cpx"><input type="radio" name="Dm-cdec" id="Dm-cpx" disabled="{{ true }}"><span><span class="xr-choice-title">Publish</span><span class="xr-choice-sub">Possible once nothing is missing.</span></span></label>',
      '<span class="xr-choice-title">Send back</span><span class="xr-choice-sub">To the Academic Reviewer or the vendor, with a reason.',
    );
    render(
      <>
        <ErrorSummary
          title="Check this step"
          items={[{ fieldId: 'Dm-cdec', summaryText: 'Choose a decision' }]}
        />
        <RadioGroup id="Dm-cdec" legend="Decision">
          <ChoiceList>
            <ChoiceCard
              value="publish"
              id="Dm-cpx"
              title="Publish"
              unavailable
              sub="Possible once nothing is missing."
            />
            <ChoiceCard
              value="send"
              id="Dm-cs"
              title="Send back"
              sub="To the Academic Reviewer or the vendor, with a reason."
            />
          </ChoiceList>
        </RadioGroup>
      </>,
    );
    expect(screen.getByRole('radio', { name: /^Publish/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('link', { name: 'Choose a decision' }));
    expect(screen.getByRole('radio', { name: /^Send back/ })).toHaveFocus();
  });

  it('a link to a group that does not take focus focuses its chosen option, as Tab would', () => {
    render(
      <>
        <ErrorSummary
          title="Check this step"
          items={[{ fieldId: 'Cc2e-rel', summaryText: 'Choose when students see their result' }]}
        />
        <fieldset id="Cc2e-rel">
          <legend>When students see their result and answers</legend>
          <label>
            <input type="radio" name="Cc2e-rel" /> Immediately after marking
          </label>
          <label>
            <input type="radio" name="Cc2e-rel" defaultChecked /> After the deadline
          </label>
        </fieldset>
      </>,
    );
    fireEvent.click(screen.getByRole('link'));
    expect(screen.getByRole('radio', { name: 'After the deadline' })).toHaveFocus();
  });

  it('a link whose field is missing does nothing', () => {
    render(<ErrorSummary title="Check this step" items={RULE_ERRORS} autoFocus={false} />);
    const link = screen.getByRole('link', { name: 'Enter the deadline' });
    expect(() => fireEvent.click(link)).not.toThrow();
    expect(document.body).toHaveFocus();
  });

  it('takes focus when it appears, and again when it reappears (B4-04 focus on fail)', () => {
    expectBoardDraws(
      RULES_VALIDATION,
      "fail = (e, first) => { this.crSet(key, { errs: e }); focus(pid + '-err'); }",
    );
    const { rerender } = render(<ErrorSummary title="Check this step" items={RULE_ERRORS} />);
    expect(screen.getByRole('alert')).toHaveFocus();
    rerender(<ErrorSummary title="Check this step" items={[]} />);
    expect(screen.queryByRole('alert')).toBeNull();
    rerender(<ErrorSummary title="Check this step" items={RULE_ERRORS.slice(1)} />);
    expect(screen.getByRole('alert')).toHaveFocus();
  });

  it('autoFocus={false} leaves focus where it is (the caller moves it)', () => {
    render(<ErrorSummary title="Check this step" items={RULE_ERRORS} autoFocus={false} />);
    expect(document.body).toHaveFocus();
  });

  it('ref gives the summary, so a later failed submit can focus it again', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <>
        <ErrorSummary ref={ref} title="Check this step" items={RULE_ERRORS} />
        <Fields />
      </>,
    );
    expect(ref.current).toBe(screen.getByRole('alert'));
    screen.getByLabelText('Assessment name').focus();
    expect(screen.getByLabelText('Assessment name')).toHaveFocus();
    act(() => ref.current!.focus());
    expect(screen.getByRole('alert')).toHaveFocus();
    expect(screen.getByRole('alert')).toHaveAttribute('tabindex', '-1');
  });

  it('a callback ref that returns a cleanup gets its cleanup, not null, when the summary goes', () => {
    const calls: (HTMLDivElement | null)[] = [];
    const cleanup = vi.fn();
    const ref = (element: HTMLDivElement | null) => {
      calls.push(element);
      return cleanup;
    };
    const { rerender } = render(
      <ErrorSummary ref={ref} title="Check this step" items={RULE_ERRORS} />,
    );
    const summary = screen.getByRole('alert');
    expect(calls).toEqual([summary]);
    expect(cleanup).not.toHaveBeenCalled();
    rerender(<ErrorSummary ref={ref} title="Check this step" items={[]} />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(calls).toEqual([summary]);
  });

  it('a new callback ref replaces the old one through the old one’s cleanup', () => {
    const calls: [string, HTMLDivElement | null][] = [];
    const cleanups = { first: vi.fn(), second: vi.fn() };
    const refFor = (which: 'first' | 'second') => (element: HTMLDivElement | null) => {
      calls.push([which, element]);
      return cleanups[which];
    };
    const { rerender, unmount } = render(
      <ErrorSummary ref={refFor('first')} title="Check this step" items={RULE_ERRORS} />,
    );
    const summary = screen.getByRole('alert');
    rerender(<ErrorSummary ref={refFor('second')} title="Check this step" items={RULE_ERRORS} />);
    expect(cleanups.first).toHaveBeenCalledTimes(1);
    expect(cleanups.second).not.toHaveBeenCalled();
    unmount();
    expect(cleanups.second).toHaveBeenCalledTimes(1);
    expect(calls).toEqual([
      ['first', summary],
      ['second', summary],
    ]);
  });

  it('a callback ref without a cleanup, or a ref object, is cleared when the summary goes', () => {
    const calls: (HTMLDivElement | null)[] = [];
    const object = createRef<HTMLDivElement>();
    const callback = (element: HTMLDivElement | null) => {
      calls.push(element);
    };
    const { rerender } = render(
      <>
        <ErrorSummary ref={callback} title="Check this step" items={RULE_ERRORS} />
        <ErrorSummary ref={object} title="Check this step" items={RULE_ERRORS} autoFocus={false} />
      </>,
    );
    const [first, second] = screen.getAllByRole('alert');
    expect(calls).toEqual([first]);
    expect(object.current).toBe(second);
    rerender(
      <>
        <ErrorSummary ref={callback} title="Check this step" items={[]} />
        <ErrorSummary ref={object} title="Check this step" items={[]} autoFocus={false} />
      </>,
    );
    expect(calls).toEqual([first, null]);
    expect(object.current).toBeNull();
  });

  it('renders its links through the injected link component', () => {
    const seen: string[] = [];
    function RouterLink({ ref, ...props }: LinkRenderProps) {
      seen.push(props.href);
      return <a ref={ref} {...props} />;
    }
    render(
      <LinkProvider component={RouterLink}>
        <ErrorSummary title="Check this step" items={RULE_ERRORS} />
        <Fields />
      </LinkProvider>,
    );
    expect(seen).toEqual(['#Cc2e-name', '#Cc2e-dl']);
    fireEvent.click(screen.getByRole('link', { name: 'Enter a name for the assessment' }));
    expect(screen.getByLabelText('Assessment name')).toHaveFocus();
  });
});

describe('ErrorSummary accessibility (axe, WCAG 2.2 AA)', () => {
  it.each([
    ['one error', RULE_ERRORS.slice(0, 1)],
    ['several errors', RULE_ERRORS],
  ])('%s', async (_state, items) => {
    const { container } = render(
      <>
        <ErrorSummary id="Cc2e-err" title="Check this step" items={items} />
        <Fields />
      </>,
    );
    await assertNoAxeViolations(container);
  });
});
