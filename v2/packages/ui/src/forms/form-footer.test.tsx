/**
 * FormFooter / FlowFooter — markup contract, behaviour and accessibility (Appendix E §3.2
 * FormFooter / FlowFooter). Sources: board 03 "Button order" (quiet action, Save, primary last),
 * B2-05 "IA-05 Give students access · 1440 · interactive · start here" (Cancel link + Continue),
 * B2-05 "Step 3 · review" (Back + busy primary "Giving access…"), B4-04 "Step 2 · rules start
 * empty" (Back + "Save as draft" + Continue), B2-07 "Step 2 · errors block the import · interim
 * commit mode" (a primary with its icon), B5-03 "VE-03 Create experiment · step 1 · 1440 ·
 * interactive · 10 Aug 2026" (Cancel + Save draft + Continue) and B6-09 "Correction draft (AR-8) · just opened
 * from Edit catalogue details · 1440" (destructive text action `xg-del` on the left). The public
 * `xp-formfoot` is Phase 1.
 */
import { fireEvent, render, screen } from '@testing-library/react';
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
import { FormFooter } from './form-footer.js';

const BUTTON_ORDER: BoardSource = { board: '03', frame: 'Button order' };
const GIVE_ACCESS: BoardSource = {
  board: 'B2-05',
  frame: 'IA-05 Give students access · 1440 · interactive · start here',
};
const REVIEW_STEP: BoardSource = { board: 'B2-05', frame: 'Step 3 · review' };
const RULES_STEP: BoardSource = { board: 'B4-04', frame: 'Step 2 · rules start empty' };
const IMPORT_ERRORS: BoardSource = {
  board: 'B2-07',
  frame: 'Step 2 · errors block the import · interim commit mode',
};
const CREATE_EXPERIMENT: BoardSource = {
  board: 'B5-03',
  frame: 'VE-03 Create experiment · step 1 · 1440 · interactive · 10 Aug 2026',
};
const CORRECTION_DRAFT: BoardSource = {
  board: 'B6-09',
  frame: 'Correction draft (AR-8) · just opened from Edit catalogue details · 1440',
};

/**
 * A board excerpt as React renders it: without the canvas event bindings (`onClick="{{ … }}"`,
 * never an attribute in React) and the template wrappers (`<sc-if …>`, not markup), and, where
 * the test passes no id, without the board's ids.
 */
function asRendered(excerpt: string, { ids = true } = {}): string {
  const bound = excerpt
    .replace(/ on[A-Z]\w*="\{\{[^}]*\}\}"/g, '')
    .replace(/<\/?sc-(?:if|for)\b[^>]*>/g, '');
  return ids ? bound : bound.replace(/ id="[^"]*"/g, '');
}

function expectFooterAsDrawn(container: HTMLElement, excerpt: string, options?: { ids: boolean }) {
  expect(normaliseMarkup(container.firstElementChild!.outerHTML)).toBe(
    normaliseMarkup(asRendered(excerpt, options)),
  );
}

describe('FormFooter markup contract', () => {
  it('Cancel link and Continue, as B2-05 draws them', () => {
    const excerpt =
      '<div class="xw-flow-foot"><a class="xr-btn xr-btn--text" href="B2-04-Student-Access.dc.html">Cancel</a><div class="xw-actions"><button type="button" class="xr-btn xr-btn--primary" onClick="{{ g.next1 }}">Continue</button></div></div>';
    expectBoardDraws(GIVE_ACCESS, excerpt);
    const { container } = render(
      <FormFooter
        start={{ kind: 'link', label: 'Cancel', href: 'B2-04-Student-Access.dc.html' }}
        primary={{ label: 'Continue' }}
      />,
    );
    expectFooterAsDrawn(container, excerpt);
  });

  it('Back, Save as draft and Continue, as B4-04 draws them', () => {
    const excerpt =
      '<div class="xw-flow-foot"><button type="button" class="xr-btn xr-btn--text" onClick="{{ c2.back }}">Back</button><div class="xw-actions"><sc-if value="{{ c2.canDraft }}" hint-placeholder-val="{{ false }}"><button type="button" class="xr-btn xr-btn--secondary" onClick="{{ c2.draft }}">Save as draft</button></sc-if><button type="button" class="xr-btn xr-btn--primary" onClick="{{ c2.next2 }}">Continue</button></div></div>';
    expectBoardDraws(RULES_STEP, excerpt);
    const { container } = render(
      <FormFooter
        start={{ kind: 'button', label: 'Back' }}
        save={{ label: 'Save as draft' }}
        primary={{ label: 'Continue' }}
      />,
    );
    expectFooterAsDrawn(container, excerpt);
  });

  it('Cancel link, Save draft and Continue, as B5-03 draws them (save label from its script)', () => {
    const excerpt =
      '<div class="xw-flow-foot"><a class="xr-btn xr-btn--text" href="B5-02-My-Experiments.dc.html">Cancel</a><div class="xw-actions"><button type="button" class="xr-btn xr-btn--secondary" onClick="{{ n.saveDraft }}">{{ n.saveLabel }}</button><button type="button" class="xr-btn xr-btn--primary" onClick="{{ n.next }}">Continue</button></div></div>';
    expectBoardDraws(
      CREATE_EXPERIMENT,
      excerpt,
      "saveLabel = isRev ? 'Save changes' : 'Save draft'",
    );
    const { container } = render(
      <FormFooter
        start={{ kind: 'link', label: 'Cancel', href: 'B5-02-My-Experiments.dc.html' }}
        save={{ label: 'Save draft' }}
        primary={{ label: 'Continue' }}
      />,
    );
    expectFooterAsDrawn(container, excerpt.replace('{{ n.saveLabel }}', 'Save draft'));
  });

  it('a destructive text action on the left (B6-09 "Withdraw update", xg-del)', () => {
    const excerpt =
      '<div class="xw-flow-foot"><button type="button" class="xr-btn xr-btn--text xg-del" id="Wd-u-wbtn" onClick="{{ d.withdraw }}">Withdraw update</button><div class="xw-actions"><button type="button" class="xr-btn xr-btn--secondary" onClick="{{ d.saveDraft }}">Save draft</button><button type="button" id="Wd-u-sbtn" class="xr-btn xr-btn--primary" onClick="{{ d.send }}">Send for academic review</button></div></div>';
    expectBoardDraws(CORRECTION_DRAFT, excerpt);
    const { container } = render(
      <FormFooter
        start={{ kind: 'destructive', label: 'Withdraw update' }}
        save={{ label: 'Save draft' }}
        primary={{ label: 'Send for academic review' }}
      />,
    );
    expectFooterAsDrawn(container, excerpt, { ids: false });
  });

  it('ids pass through to the buttons and the link (B6-09 Wd-u-wbtn, Wd-u-sbtn)', () => {
    render(
      <FormFooter
        start={{ kind: 'destructive', label: 'Withdraw update', id: 'Wd-u-wbtn' }}
        save={{ label: 'Save draft' }}
        primary={{ label: 'Send for academic review', id: 'Wd-u-sbtn' }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Withdraw update' })).toHaveAttribute(
      'id',
      'Wd-u-wbtn',
    );
    expect(screen.getByRole('button', { name: 'Send for academic review' })).toHaveAttribute(
      'id',
      'Wd-u-sbtn',
    );
  });

  it('Back and the primary, idle and busy, as B2-05 "Step 3 · review" draws them', () => {
    // One footer, two sc-if branches: "Give access" while idle, the busy button while busy.
    const idle =
      '<sc-if value="{{ g3.notBusy }}" hint-placeholder-val="{{ true }}"><button type="button" class="xr-btn xr-btn--primary" onClick="{{ g3.give }}">Give access</button></sc-if>';
    const busy =
      '<sc-if value="{{ g3.busy }}" hint-placeholder-val="{{ false }}"><button type="button" class="xr-btn xr-btn--primary is-busy" aria-disabled="true"><span class="xr-spin" aria-hidden="true"></span>Giving access…</button></sc-if>';
    const excerpt = `<div class="xw-flow-foot"><button type="button" class="xr-btn xr-btn--text" onClick="{{ g3.back }}">Back</button><div class="xw-actions">${idle}${busy}</div></div>`;
    expectBoardDraws(REVIEW_STEP, excerpt);
    const { container, rerender } = render(
      <FormFooter
        start={{ kind: 'button', label: 'Back' }}
        primary={{ label: 'Give access', busyLabel: 'Giving access…' }}
      />,
    );
    expectFooterAsDrawn(container, excerpt.replace(busy, ''));
    rerender(
      <FormFooter
        start={{ kind: 'button', label: 'Back' }}
        primary={{ label: 'Give access', busy: true, busyLabel: 'Giving access…' }}
      />,
    );
    expectFooterAsDrawn(container, excerpt.replace(idle, ''));
  });

  it('button order follows board 03: quiet action, Save, primary last', () => {
    expectBoardDraws(
      BUTTON_ORDER,
      '<button type="button" class="xr-btn xr-btn--text">Cancel</button><button type="button" class="xr-btn xr-btn--secondary">Save draft</button><button type="button" class="xr-btn xr-btn--primary">Continue</button>',
      'Primary last (right) on wide screens; stacked full-width with primary first on phones.',
    );
    const { container } = render(
      <FormFooter
        start={{ kind: 'button', label: 'Cancel' }}
        save={{ label: 'Save draft' }}
        primary={{ label: 'Continue' }}
      />,
    );
    expect(
      [...container.querySelectorAll('button')].map((button) => [
        button.className,
        button.textContent,
      ]),
    ).toEqual([
      ['xr-btn xr-btn--text', 'Cancel'],
      ['xr-btn xr-btn--secondary', 'Save draft'],
      ['xr-btn xr-btn--primary', 'Continue'],
    ]);
  });

  it('without a quiet action the actions stand alone', () => {
    const { container } = render(<FormFooter primary={{ label: 'Continue' }} />);
    expect(normaliseMarkup(container.innerHTML)).toBe(
      '<div class="xw-flow-foot"><div class="xw-actions"><button type="button" class="xr-btn xr-btn--primary">Continue</button></div></div>',
    );
  });

  it('a primary icon where the board draws one (B2-07 "Choose the corrected file")', () => {
    const button =
      '<button type="button" class="xr-btn xr-btn--primary" onClick="{{ i2.chooseFixed }}"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5"></path></svg>Choose the corrected file</button>';
    expectBoardDraws(IMPORT_ERRORS, button);
    render(<FormFooter primary={{ label: 'Choose the corrected file', icon: 'readyToPublish' }} />);
    expect(
      normaliseMarkup(screen.getByRole('button', { name: 'Choose the corrected file' }).outerHTML),
    ).toBe(normaliseMarkup(asRendered(button)));
  });

  it('emits only stylesheet classes', () => {
    const { container } = render(
      <FormFooter
        start={{ kind: 'destructive', label: 'Withdraw update' }}
        save={{ label: 'Save draft' }}
        primary={{ label: 'Send for academic review', busy: true, busyLabel: 'Sending…' }}
      />,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });
});

describe('FormFooter behaviour', () => {
  it('each button calls its own handler', () => {
    const back = vi.fn();
    const save = vi.fn();
    const next = vi.fn();
    render(
      <FormFooter
        start={{ kind: 'button', label: 'Back', onClick: back }}
        save={{ label: 'Save as draft', onClick: save }}
        primary={{ label: 'Continue', onClick: next }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save as draft' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect([back.mock.calls.length, save.mock.calls.length, next.mock.calls.length]).toEqual([
      1, 1, 1,
    ]);
  });

  it('a busy primary ignores presses (Button), the quiet action still works', () => {
    const back = vi.fn();
    const give = vi.fn();
    render(
      <FormFooter
        start={{ kind: 'button', label: 'Back', onClick: back }}
        primary={{ label: 'Give access', onClick: give, busy: true, busyLabel: 'Giving access…' }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Giving access…' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(give).not.toHaveBeenCalled();
    expect(back).toHaveBeenCalledTimes(1);
  });

  it('a submit primary submits its form once; busy, it does not', () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    const { rerender } = render(
      <form onSubmit={onSubmit}>
        <FormFooter primary={{ label: 'Continue', type: 'submit' }} />
      </form>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    rerender(
      <form onSubmit={onSubmit}>
        <FormFooter
          primary={{ label: 'Continue', type: 'submit', busy: true, busyLabel: 'Saving…' }}
        />
      </form>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Saving…' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('the Cancel link goes through the injected link component', () => {
    const seen: string[] = [];
    function RouterLink({ ref, ...props }: LinkRenderProps) {
      seen.push(props.href);
      return <a ref={ref} {...props} />;
    }
    render(
      <LinkProvider component={RouterLink}>
        <FormFooter
          start={{ kind: 'link', label: 'Cancel', href: 'B2-04-Student-Access.dc.html' }}
          primary={{ label: 'Continue' }}
        />
      </LinkProvider>,
    );
    expect(seen).toEqual(['B2-04-Student-Access.dc.html']);
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveClass('xr-btn xr-btn--text');
  });

  it('ref reaches the primary button (e.g. to return focus after a dialog)', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<FormFooter primary={{ label: 'Continue', ref }} />);
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Continue' }));
  });
});

describe('FormFooter accessibility (axe, WCAG 2.2 AA)', () => {
  it.each([
    [
      'cancel link + primary',
      <FormFooter
        start={{ kind: 'link', label: 'Cancel', href: '#start' }}
        primary={{ label: 'Continue' }}
      />,
    ],
    [
      'back + save + primary',
      <FormFooter
        start={{ kind: 'button', label: 'Back' }}
        save={{ label: 'Save as draft' }}
        primary={{ label: 'Continue' }}
      />,
    ],
    [
      'destructive + save + primary',
      <FormFooter
        start={{ kind: 'destructive', label: 'Withdraw update' }}
        save={{ label: 'Save draft' }}
        primary={{ label: 'Send for academic review' }}
      />,
    ],
    [
      'busy primary',
      <FormFooter
        start={{ kind: 'button', label: 'Back' }}
        primary={{ label: 'Give access', busy: true, busyLabel: 'Giving access…' }}
      />,
    ],
  ])('%s', async (_state, element) => {
    const { container } = render(element);
    await assertNoAxeViolations(container);
  });
});
