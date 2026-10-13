/**
 * HelpSupport template — markup contract, behaviour and accessibility (Appendix E §3.5
 * "HelpSupport template (GL-03, XS-07)", §5.1, §5.5, §8; Appendix F WP-0.6 acceptance 2–4).
 * Sources: board 07 "State 1 · Report a problem · Student", "State 1a · Validation", "State 1b ·
 * Sending", "State 1c · Sent · reference", "State 2 · My reports · open / reopened / resolved ·
 * Institute Admin", "State 2a · My reports · empty · Vendor", "State 3 · Report detail · resolved
 * with note · Faculty", "State 3a · Report detail · reopened · Content Manager" and "Rules for
 * GL-03"; board 05 "05 · GL-01 Workspace Shell" (the Help page drawn statically inside the
 * shell); board 11 "375 · AR-8 form".
 *
 * Board 07 renders one template into every frame, so its excerpts are templates: they are proven
 * drawn on the board, then filled with the frame's values (canvas wiring and inline styles
 * removed) and compared with the rendered markup. Board variances are named where they apply.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  canonicalMarkup,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
  normaliseMarkup,
  withoutProductClasses,
  type BoardSource,
} from '../testing/index.js';
import {
  HelpReportDetail,
  HelpReportForm,
  HelpReportSent,
  HelpSupportHome,
  type HelpReportDetailProps,
  type HelpReportFormProps,
  type HelpReportSummary,
} from './help-support.js';

const FORM: BoardSource = { board: '07', frame: 'State 1 · Report a problem · Student' };
const VALIDATION: BoardSource = { board: '07', frame: 'State 1a · Validation' };
const SENDING: BoardSource = { board: '07', frame: 'State 1b · Sending' };
const SENT: BoardSource = { board: '07', frame: 'State 1c · Sent · reference' };
const LIST: BoardSource = {
  board: '07',
  frame: 'State 2 · My reports · open / reopened / resolved · Institute Admin',
};
const EMPTY: BoardSource = { board: '07', frame: 'State 2a · My reports · empty · Vendor' };
const RESOLVED: BoardSource = {
  board: '07',
  frame: 'State 3 · Report detail · resolved with note · Faculty',
};
const REOPENED: BoardSource = {
  board: '07',
  frame: 'State 3a · Report detail · reopened · Content Manager',
};
const RULES: BoardSource = { board: '07', frame: 'Rules for GL-03' };
const SHELL: BoardSource = { board: '05', frame: '05 · GL-01 Workspace Shell' };
const PHONE_FORM: BoardSource = { board: '11', frame: '375 · AR-8 form' };

/**
 * A board template excerpt, proven drawn on the board, with its canvas wiring and inline styles
 * removed and its values filled in: an attribute whose whole value is an unset template is dropped;
 * `sc-if` keeps its content only when shown.
 */
function fromTemplate(
  source: BoardSource,
  template: string,
  values: Readonly<Record<string, string | undefined>> = {},
  shown: Readonly<Record<string, boolean>> = {},
): string {
  expectBoardDraws(source, template);
  return normaliseMarkup(template)
    .replace(/ (?:ref|onClick|onKeyDown|style)="[^"]*"/g, '')
    .replace(
      /<sc-if value="\{\{ ([^}]+) \}\}"[^>]*>(.*?)<\/sc-if>/g,
      (_m, key: string, body: string) => (shown[key.trim()] ? body : ''),
    )
    .replace(/ ([\w-]+)="\{\{ ([^}]+) \}\}"/g, (_m, name: string, key: string) => {
      const value = values[key.trim()];
      return value === undefined ? '' : ` ${name}="${value}"`;
    })
    .replace(/\{\{ ([^}]+) \}\}/g, (_m, key: string) => values[key.trim()] ?? `<missing ${key}>`);
}

const markup = (element: Element) => normaliseMarkup(element.outerHTML);
/** The board markup an element reproduces, its PF-14 / PF-15 product classes set aside. */
const drawnPart = (element: Element) => withoutProductClasses(markup(element));

/* --------------------------------------------------------------------------------------------- */

const OPEN = { tone: 'info', label: 'Open' } as const;
const REOPENED_STATUS = { tone: 'info', label: 'Reopened', icon: 'retry' } as const;
const RESOLVED_STATUS = { tone: 'ok', label: 'Resolved' } as const;

const BOARD_05_REPORTS: readonly HelpReportSummary[] = [
  {
    reference: 'SUP-0213',
    title: 'VR simulation stopped loading at step 2',
    sub: 'sent 3 Oct · Shell-and-Tube Heat Exchanger · VR',
    href: '#r1',
    status: OPEN,
  },
  {
    reference: 'SUP-0198',
    title: 'Lab brief link opened a blank page',
    sub: 'sent 21 Sep · resolved 23 Sep',
    href: '#r2',
    status: RESOLVED_STATUS,
  },
];

const BOARD_07_REPORTS: readonly HelpReportSummary[] = [
  {
    reference: 'SUP-0211',
    title: 'Student import stopped part-way',
    sub: 'sent 1 Oct · reopened 6 Oct',
    href: '#help',
    status: REOPENED_STATUS,
  },
  {
    reference: 'SUP-0209',
    title: 'Usage page took a long time to load',
    sub: 'sent 30 Sep',
    href: '#help',
    status: OPEN,
  },
  {
    reference: 'SUP-0189',
    title: 'Group name didn’t save',
    sub: 'sent 15 Sep · resolved 18 Sep',
    href: '#help',
    status: RESOLVED_STATUS,
  },
];

describe('My reports (HelpSupportHome)', () => {
  it('renders the Help page exactly as board 05 draws it inside the shell (board 05 lead)', () => {
    const drawn = `<div class="xr-phead"> <div class="xr-phead-main"> <h1 class="xr-h1">Help &amp; support</h1> <p class="xr-lead">Something isn’t working? Report it here and follow what happens to your report.</p> </div> <div class="xr-phead-actions"><a class="xr-btn xr-btn--primary" href="#report">Report a problem</a></div> </div> <section class="xr-section" aria-labelledby="sh-rep"> <div class="xr-section-head"><h2 id="sh-rep" class="xr-h2">My reports</h2><span class="xr-meta">2 reports</span></div> <ul class="xr-rows"> <li><a class="xr-row xr-row-link" href="#r1"><div class="xr-row-main"><div class="xr-row-text"><span class="xr-row-title">VR simulation stopped loading at step 2</span><span class="xr-row-sub"><span class="xr-id">SUP-0213</span> · sent 3 Oct · Shell-and-Tube Heat Exchanger · VR</span></div></div><span class="xr-status xr-status--info"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h11l-3-3M17 17H6l3 3"></path></svg>Open</span></a></li> <li><a class="xr-row xr-row-link" href="#r2"><div class="xr-row-main"><div class="xr-row-text"><span class="xr-row-title">Lab brief link opened a blank page</span><span class="xr-row-sub"><span class="xr-id">SUP-0198</span> · sent 21 Sep · resolved 23 Sep</span></div></div><span class="xr-status xr-status--ok"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>Resolved</span></a></li> </ul> </section>`;
    expectBoardDraws(SHELL, drawn);
    const { container } = render(
      <HelpSupportHome
        reportHref="#report"
        reports={BOARD_05_REPORTS}
        countText="2 reports"
        lead="Something isn’t working? Report it here and follow what happens to your report."
        headingId="sh-rep"
      />,
    );
    expect(normaliseMarkup(container.innerHTML)).toBe(normaliseMarkup(drawn));
  });

  it('board 07: the header with its own lead and "Report a problem", the head with the count', () => {
    const { container } = render(
      <HelpSupportHome
        reportHref="#help"
        reports={BOARD_07_REPORTS}
        countText="3 reports"
        headingId="s5-mr"
      />,
    );
    expect(markup(container.querySelector('.xr-phead')!)).toBe(
      fromTemplate(
        LIST,
        '<div class="xr-phead"> <div class="xr-phead-main"><h1 class="xr-h1">Help &amp; support</h1><p class="xr-lead">Something isn’t working? Report it here and follow what happens.</p></div> <sc-if value="{{ f.hasReports }}" hint-placeholder-val="{{ true }}"><div class="xr-phead-actions"><a class="xr-btn xr-btn--primary" href="#help">Report a problem</a></div></sc-if> </div>',
        {},
        { 'f.hasReports': true },
      ),
    );
    expect(markup(container.querySelector('.xr-section-head')!)).toBe(
      fromTemplate(
        LIST,
        '<div class="xr-section-head"><h2 id="{{ f.id }}-mr" class="xr-h2">My reports</h2><sc-if value="{{ f.hasReports }}" hint-placeholder-val="{{ true }}"><span class="xr-meta">{{ f.countText }}</span></sc-if></div>',
        { 'f.id': 's5', 'f.countText': '3 reports' },
        { 'f.hasReports': true },
      ),
    );
  });

  it('board 07: a reopened row (info tone, the Retry arrow) fills the row template exactly', () => {
    expectBoardDraws(
      LIST,
      "const REOPENED = { cls: 'xr-status--info', icon: 'M20 12a8 8 0 1 1-2.4-5.7M20 4v4.5h-4.5', status: 'Reopened' };",
    );
    const { container } = render(
      <HelpSupportHome reportHref="#help" reports={BOARD_07_REPORTS} countText="3 reports" />,
    );
    expect(markup(container.querySelector('.xr-rows > li')!)).toBe(
      fromTemplate(
        LIST,
        '<li><a class="xr-row xr-row-link" href="#help"><div class="xr-row-main"><div class="xr-row-text"><span class="xr-row-title">{{ r.title }}</span><span class="xr-row-sub"><span class="xr-id">{{ r.id }}</span> · {{ r.sub }}</span></div></div><span class="xr-status {{ r.cls }}"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="{{ r.icon }}"></path></svg>{{ r.status }}</span></a></li>',
        {
          'r.title': 'Student import stopped part-way',
          'r.id': 'SUP-0211',
          'r.sub': 'sent 1 Oct · reopened 6 Oct',
          'r.cls': 'xr-status--info',
          'r.icon': 'M20 12a8 8 0 1 1-2.4-5.7M20 4v4.5h-4.5',
          'r.status': 'Reopened',
        },
      ),
    );
    expect(container.querySelectorAll('.xr-rows > li')).toHaveLength(3);
  });

  it('empty: no header action and no count; the action moves into the empty state (board 07 "Rules")', () => {
    expectBoardDraws(
      RULES,
      '<li>When the list is empty, its primary action moves into the empty state.</li>',
    );
    const { container } = render(
      <HelpSupportHome reportHref="#help" reports={[]} countText="0 reports" headingId="s6-mr" />,
    );
    expect(container.querySelector('.xr-phead-actions')).toBeNull();
    expect(markup(container.querySelector('.xr-section-head')!)).toBe(
      fromTemplate(
        EMPTY,
        '<div class="xr-section-head"><h2 id="{{ f.id }}-mr" class="xr-h2">My reports</h2><sc-if value="{{ f.hasReports }}" hint-placeholder-val="{{ true }}"><span class="xr-meta">{{ f.countText }}</span></sc-if></div>',
        { 'f.id': 's6' },
        { 'f.hasReports': false },
      ),
    );
    // Board 07 draws this one line as `p.xr-small` (EmptyState `line="small"`; the product
    // boards' empty states draw `p.xr-body`). The inline top border is PF-14
    // (`xr-x-help-empty`), the line's ink-2 is PF-16 (every drawn empty-state line).
    const empty = container.querySelector('.xr-empty')!;
    expect(empty.className).toBe('xr-empty xr-x-help-empty');
    expect(drawnPart(empty)).toBe(
      fromTemplate(
        EMPTY,
        '<div class="xr-empty" style="border-top: 1px solid #E1E4F3"> <span class="xr-empty-icon"><svg class="xr-ico xr-ico--24" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.6 9.4a2.5 2.5 0 0 1 4.9.8c0 1.7-2.5 2.2-2.5 3.8M12 17h.01"></path></svg></span> <h3 class="xr-h3">No reports yet</h3> <p class="xr-small" style="color: #40476B">If something isn’t working, report it and follow it here.</p> <a class="xr-btn xr-btn--primary" href="#help">Report a problem</a> </div>',
      ),
    );
  });

  it('rows open the report and carry the status in words', () => {
    render(<HelpSupportHome reportHref="#help" reports={BOARD_07_REPORTS} />);
    const links = screen.getAllByRole('link').filter((link) => link.classList.contains('xr-row'));
    expect(links.map((link) => link.querySelector('.xr-status')!.textContent)).toEqual([
      'Reopened',
      'Open',
      'Resolved',
    ]);
  });

  it('emits only stylesheet classes; axe clean with reports and empty', async () => {
    const full = render(<HelpSupportHome reportHref="#help" reports={BOARD_07_REPORTS} />);
    expectStylesheetClassesOnly(full.container);
    await assertNoAxeViolations(full.container);
    full.unmount();
    const empty = render(<HelpSupportHome reportHref="#help" reports={[]} />);
    expectStylesheetClassesOnly(empty.container);
    await assertNoAxeViolations(empty.container);
  });
});

/* --------------------------------------------------------------------------------------------- */

function Form(props: Partial<HelpReportFormProps> & { readonly onSendSpy?: () => void }) {
  const [what, setWhat] = useState('');
  const [where, setWhere] = useState('Shell-and-Tube Heat Exchanger · VR');
  return (
    <HelpReportForm
      helpHref="#help"
      idPrefix="s1"
      what={what}
      onWhatChange={setWhat}
      where={where}
      onWhereChange={setWhere}
      onSend={props.onSendSpy ?? (() => undefined)}
      {...props}
    />
  );
}

/** The form with the caller's validation: Send with nothing in "What happened?" is refused. */
function ValidatingForm({ onValid }: { readonly onValid: () => void }) {
  const [what, setWhat] = useState('');
  const [missing, setMissing] = useState(false);
  return (
    <HelpReportForm
      helpHref="#help"
      idPrefix="s2"
      what={what}
      onWhatChange={setWhat}
      where="Shell-and-Tube Heat Exchanger · VR"
      onWhereChange={() => undefined}
      whatMissing={missing}
      onSend={() => {
        const empty = what.trim() === '';
        setMissing(empty);
        if (!empty) onValid();
      }}
    />
  );
}

describe('Report a problem (HelpReportForm)', () => {
  it('the back link and the header render as board 07 draws them', () => {
    const { container } = render(<Form />);
    // The drawn 8 px gap under the back link is PF-14 (`xr-x-help-back`).
    const back = container.querySelector('a.xr-back')!;
    expect(back.className).toBe('xr-back xr-x-help-back');
    expect(drawnPart(back)).toBe(
      fromTemplate(
        FORM,
        '<a class="xr-back" href="#help" style="margin-bottom: 8px"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6 8.5 12l6 6"></path></svg>Help &amp; support</a>',
      ),
    );
    expectRenderedAsDrawn(
      container.querySelector('.xr-phead')!,
      FORM,
      '<div class="xr-phead"><div class="xr-phead-main"><h1 class="xr-h1">Report a problem</h1><p class="xr-lead">Describe what went wrong. You can follow your report in My reports.</p></div></div>',
    );
  });

  it('the three fields, and nothing else, as board 07 draws them (ids, labels, hints, the pre-filled "Where")', () => {
    expectBoardDraws(
      RULES,
      '<li>Fields: what happened, where (pre-filled from the page you came from), optional screenshot. Nothing else.</li>',
    );
    const { container } = render(<Form />);
    const fields = [...container.querySelectorAll('.xr-field')];
    expect(fields).toHaveLength(3);
    const values = { 'f.id': 's1', 'f.whereVal': 'Shell-and-Tube Heat Exchanger · VR' };
    // What happened: label and hint exactly; the textarea's value is its content in React.
    expect(
      markup(fields[0]!.querySelector('label')!) + markup(fields[0]!.querySelector('.xr-hint')!),
    ).toBe(
      fromTemplate(
        FORM,
        '<label class="xr-label" for="{{ f.id }}-what">What happened?</label> <span class="xr-hint" id="{{ f.id }}-what-h">Say what you were doing and what you saw.</span>',
        values,
      ),
    );
    const textarea = fields[0]!.querySelector('textarea')!;
    expect(textarea.className).toBe('xr-textarea');
    expect(textarea).toHaveAttribute('id', 's1-what');
    expect(textarea).toHaveAttribute('aria-describedby', 's1-what-h');
    expect(textarea).not.toHaveAttribute('aria-invalid');
    expect(canonicalMarkup(fields[1]!.outerHTML)).toBe(
      canonicalMarkup(
        fromTemplate(
          FORM,
          '<div class="xr-field"> <label class="xr-label" for="{{ f.id }}-where">Where did it happen?</label> <span class="xr-hint" id="{{ f.id }}-where-h">Filled in from the page you came from. Change it if needed.</span> <input id="{{ f.id }}-where" class="xr-input" type="text" aria-describedby="{{ f.id }}-where-h" value="{{ f.whereVal }}"> </div>',
          values,
        ),
      ),
    );
    expect(canonicalMarkup(fields[2]!.outerHTML)).toBe(
      canonicalMarkup(
        fromTemplate(
          FORM,
          '<div class="xr-field"> <label class="xr-label" for="{{ f.id }}-shot">Screenshot <span class="xr-opt">(optional)</span></label> <span class="xr-hint" id="{{ f.id }}-shot-h">A picture of the screen can help.</span> <input id="{{ f.id }}-shot" class="xr-file" type="file" accept="image/*" aria-describedby="{{ f.id }}-shot-h"> </div>',
          values,
        ),
      ),
    );
  });

  it('the card and its actions: one group at the end, Cancel right before "Send report" (boards 07, 11)', () => {
    const { container } = render(<Form />);
    // The card is `div.xr-section` as drawn. Its inline glue (24 px padding, 20 px column gap) has
    // no v46 class: it is PF-14 on the product class `xr-x-help-form` (WP-0.13); `xg-form` (28 px,
    // 18/16 below 600 px) is not the drawn padding, so it is not borrowed.
    expectBoardDraws(
      FORM,
      '<div class="xr-section" style="padding: 24px; display: flex; flex-direction: column; gap: 20px"> <div class="xr-field">',
    );
    const formSection = container.querySelector('.xr-stack > div.xr-section')!;
    expect(formSection.className).toBe('xr-section xr-x-help-form');
    expect([...formSection.children].map((child) => child.className)).toEqual([
      'xr-field',
      'xr-field',
      'xr-field',
      'xw-actions xw-actions--end',
    ]);
    // The actions as board 07 draws them, the drawn inline flex-end group emitted as the v46
    // `xw-actions xw-actions--end` (flex, wrap, 12 px gap, flex-end); PF-14 restores its
    // wrap-reverse and 4 px top padding from the card's product class.
    const actions = formSection.lastElementChild!;
    expect(markup(actions)).toBe(
      fromTemplate(
        FORM,
        '<div style="display: flex; flex-wrap: wrap-reverse; gap: 12px; justify-content: flex-end; padding-top: 4px"> <a class="xr-btn xr-btn--text" href="#help">Cancel</a> <sc-if value="{{ f.isSending }}" hint-placeholder-val="{{ false }}"><button type="button" class="xr-btn xr-btn--primary is-busy" aria-busy="true"><span class="xr-spin" aria-hidden="true"></span>Sending…</button></sc-if> <sc-if value="{{ f.notSending }}" hint-placeholder-val="{{ true }}"><button type="button" class="xr-btn xr-btn--primary">Send report</button></sc-if> </div>',
        {},
        { 'f.notSending': true },
      ).replace('<div>', '<div class="xw-actions xw-actions--end">'),
    );
    // Board 11 draws the same group at 375, Cancel and Send on one row; Send's `flex: 1 1 160px`
    // (the primary filling the row) is PF-14 below 600 px of app width (computed in the browser).
    expectBoardDraws(
      PHONE_FORM,
      "'Single column; primary button fills the row'",
      '<div style="display: flex; flex-wrap: wrap-reverse; gap: 12px; justify-content: flex-end"><a class="xr-btn xr-btn--text" href="#proof">Cancel</a><button type="button" class="xr-btn xr-btn--primary" style="flex: 1 1 160px">Send report</button></div>',
    );
    expect(container.querySelector('.xw-flow-foot')).toBeNull();
  });

  it('typing and choosing a screenshot are reported to the caller', () => {
    const onScreenshotChange = vi.fn();
    render(<Form onScreenshotChange={onScreenshotChange} />);
    const what = screen.getByLabelText('What happened?');
    fireEvent.change(what, { target: { value: 'The VR simulation stopped loading.' } });
    expect(what).toHaveValue('The VR simulation stopped loading.');
    const where = screen.getByLabelText('Where did it happen?');
    expect(where).toHaveValue('Shell-and-Tube Heat Exchanger · VR');
    fireEvent.change(where, { target: { value: 'Progress' } });
    expect(where).toHaveValue('Progress');
    fireEvent.change(screen.getByLabelText(/^Screenshot/), { target: { files: [] } });
    expect(onScreenshotChange).toHaveBeenCalledTimes(1);
  });

  it('validation (State 1a): the linked summary takes focus; the field is invalid and explains the fix', () => {
    expectBoardDraws(
      VALIDATION,
      '<span class="xr-notice-title">One thing needs fixing</span><a href="#help">Say what happened</a>',
    );
    const onValid = vi.fn();
    const { container } = render(<ValidatingForm onValid={onValid} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send report' }));
    expect(onValid).not.toHaveBeenCalled();
    const summary = screen.getByRole('alert');
    expect(summary).toHaveClass('xw-errsum');
    expect(summary).toHaveFocus();
    expect(summary).toHaveTextContent('One thing needs fixing');
    const textarea = screen.getByLabelText('What happened?');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toHaveAttribute('aria-describedby', 's2-what-h s2-what-e');
    const error = container.querySelector('#s2-what-e')!;
    expect(markup(error)).toBe(
      fromTemplate(
        VALIDATION,
        '<span class="xr-error"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5v5.5M12 16.5h.01"></path></svg>Say what happened, so it can be looked into</span>',
      ).replace('<span class="xr-error">', '<span class="xr-error" id="s2-what-e">'),
    );
    // The summary link moves focus to the field (board 12 "Errors").
    fireEvent.click(screen.getByRole('link', { name: 'Say what happened' }));
    expect(textarea).toHaveFocus();
    // A second failed Send focuses the summary again.
    fireEvent.click(screen.getByRole('button', { name: 'Send report' }));
    expect(screen.getByRole('alert')).toHaveFocus();
    // Fixed: the error clears and the caller sends.
    fireEvent.change(textarea, { target: { value: 'The VR simulation stopped loading.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send report' }));
    expect(onValid).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(textarea).not.toHaveAttribute('aria-invalid');
  });

  it('sending (State 1b): "Sending…", busy, and presses are ignored', () => {
    const drawn =
      '<button type="button" class="xr-btn xr-btn--primary is-busy" aria-busy="true"><span class="xr-spin" aria-hidden="true"></span>Sending…</button>';
    expectBoardDraws(SENDING, drawn);
    const onSendSpy = vi.fn();
    const { container } = render(<Form sending onSendSpy={onSendSpy} />);
    const busy = container.querySelector('.xw-actions button')!;
    // Variance (reported): Button marks busy with aria-disabled, as 590 product-board buttons do;
    // board 07 draws aria-busy on this one.
    expect(markup(busy)).toBe(
      normaliseMarkup(drawn.replace('aria-busy="true"', 'aria-disabled="true"')),
    );
    fireEvent.click(busy);
    expect(onSendSpy).not.toHaveBeenCalled();
  });

  it('emits only stylesheet classes; axe clean (form, validation, sending)', async () => {
    for (const view of [
      <Form key="form" />,
      <Form key="invalid" whatMissing />,
      <Form key="sending" sending />,
    ]) {
      const { container, unmount } = render(view);
      expectStylesheetClassesOnly(container);
      await assertNoAxeViolations(container);
      unmount();
    }
  });
});

/* --------------------------------------------------------------------------------------------- */

describe('Sent (HelpReportSent)', () => {
  const drawn =
    '<div class="xr-msg"> <span class="xr-msg-icon" style="background: #E8F4EC; color: #1D6B45"><svg class="xr-ico xr-ico--24" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span> <h1 class="xr-msg-title">Report sent</h1> <p class="xr-body" style="color: #40476B">Your reference is <span class="xr-id">SUP-0213</span>. You can follow it in My reports.</p> <div class="xr-msg-actions"><a class="xr-btn xr-btn--primary" href="#help">View my reports</a><a href="#help">Back to Home</a></div> </div>';

  it('renders as board 07 draws it (the green tint is PF-15; focus target added)', () => {
    const { container } = render(
      <HelpReportSent reference="SUP-0213" reportsHref="#help" homeHref="#help" />,
    );
    const message = container.querySelector('.xr-msg')!;
    expect(message).toHaveAttribute('tabindex', '-1');
    expect(message.querySelector('.xr-msg-icon')!.className).toBe('xr-msg-icon xr-x-msg-icon--ok');
    const copy = message.cloneNode(true) as Element;
    copy.removeAttribute('tabindex');
    expect(drawnPart(copy)).toBe(fromTemplate(SENT, drawn));
  });

  it('focus moves to the confirmation when it appears (it replaces the form in place)', () => {
    expectBoardDraws(
      SENT,
      'An AR-10 confirmation in place: reference number and where to follow it. No promise of when or by whom.',
    );
    render(<HelpReportSent reference="SUP-0213" reportsHref="#help" homeHref="#home" id="sent" />);
    expect(document.getElementById('sent')).toHaveFocus();
  });

  it('leaves focus alone when the caller moves it', () => {
    render(
      <HelpReportSent
        reference="SUP-0213"
        reportsHref="#help"
        homeHref="#home"
        focusOnMount={false}
      />,
    );
    expect(document.body).toHaveFocus();
  });

  it('emits only stylesheet classes; axe clean', async () => {
    const { container } = render(
      <HelpReportSent reference="SUP-0213" reportsHref="#help" homeHref="#home" />,
    );
    expectStylesheetClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

/* --------------------------------------------------------------------------------------------- */

function Timeline({ children }: { readonly children: ReactNode }) {
  return <ol className="xr-timeline">{children}</ol>;
}

const RESOLVED_DETAIL: HelpReportDetailProps = {
  helpHref: '#help',
  reportHref: '#help',
  reference: 'SUP-0198',
  title: 'Lab brief link opened a blank page',
  status: RESOLVED_STATUS,
  sent: '21 Sep',
  resolution: {
    date: '23 Sep',
    note: '“The lab brief link was updated. It now opens the brief in a new tab.”',
  },
  reported: <p className="xr-body">The lab brief link on the Resources tab opened a blank page.</p>,
  history: (
    <Timeline>
      <li className="xr-tl is-latest">
        <span className="xr-tl-dot" aria-hidden="true" />
        <div>
          <p className="xr-tl-what">Resolved</p>
          <p className="xr-tl-when">23 Sep · resolution note added</p>
        </div>
      </li>
    </Timeline>
  ),
  idPrefix: 's7',
};

const REOPENED_DETAIL: HelpReportDetailProps = {
  ...RESOLVED_DETAIL,
  reference: 'SUP-0207',
  title: 'Delivery link preview showed an empty frame',
  status: REOPENED_STATUS,
  sent: '28 Sep',
  resolution: undefined,
  reopened: { date: '6 Oct' },
  idPrefix: 's8',
};

describe('Report detail (HelpReportDetail)', () => {
  it('the header: reference, title, status in words and "Sent …", as board 07 draws it', () => {
    const { container } = render(<HelpReportDetail {...RESOLVED_DETAIL} />);
    expect(markup(container.querySelector('.xr-phead')!)).toBe(
      fromTemplate(
        RESOLVED,
        '<div class="xr-phead"> <div class="xr-phead-main"> <span class="xr-id">{{ f.d.id }}</span> <h1 class="xr-h1">{{ f.d.title }}</h1> <div class="xr-phead-meta"><span class="xr-status {{ f.d.cls }}"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="{{ f.d.icon }}"></path></svg>{{ f.d.status }}</span><span>Sent {{ f.d.sent }}</span></div> </div> </div>',
        {
          'f.d.id': 'SUP-0198',
          'f.d.title': 'Lab brief link opened a blank page',
          'f.d.cls': 'xr-status--ok',
          'f.d.icon': 'M5 12.5l4.5 4.5L19 7.5',
          'f.d.status': 'Resolved',
          'f.d.sent': '21 Sep',
        },
      ),
    );
    expect(container.querySelector('a.xr-back')).toHaveTextContent('Help & support');
  });

  it('resolved: the resolution note is the first thing in the stack; history comes last', () => {
    expectBoardDraws(
      RESOLVED,
      'The resolution note is the first thing on the page. History comes last.',
    );
    const { container } = render(<HelpReportDetail {...RESOLVED_DETAIL} />);
    const stack = container.querySelector('.xr-stack')!;
    expect(markup(stack.firstElementChild!)).toBe(
      fromTemplate(
        RESOLVED,
        '<div class="xr-notice xr-notice--ok" role="status"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12.5l2.7 2.7L16 9.8"></path></svg><div class="xr-notice-body"><span class="xr-notice-title">Resolution note · {{ f.d.resolved }}</span><span>{{ f.d.note }}</span></div></div>',
        {
          'f.d.resolved': '23 Sep',
          'f.d.note': '“The lab brief link was updated. It now opens the brief in a new tab.”',
        },
      ),
    );
    const sections = [...stack.querySelectorAll('section.xr-section')];
    expect(sections.map((section) => section.querySelector('.xr-section-head')!.outerHTML)).toEqual(
      [
        fromTemplate(
          RESOLVED,
          '<div class="xr-section-head"><h2 id="{{ f.id }}-wr" class="xr-h2">What you reported</h2></div>',
          { 'f.id': 's7' },
        ),
        fromTemplate(
          RESOLVED,
          '<div class="xr-section-head"><h2 id="{{ f.id }}-hi" class="xr-h2">History</h2></div>',
          { 'f.id': 's7' },
        ),
      ],
    );
    expect(sections.map((section) => section.getAttribute('aria-labelledby'))).toEqual([
      's7-wr',
      's7-hi',
    ]);
    expect(sections[0]!.querySelector('.xr-section-body')).toHaveTextContent(
      'The lab brief link on the Resources tab opened a blank page.',
    );
    expect(sections[1]!.querySelector('.xr-section-body > ol.xr-timeline')).not.toBeNull();
    // The closing line's ink-2 is PF-14 (`xr-x-help-foot`).
    expect(stack.lastElementChild!.className).toBe('xr-small xr-x-help-foot');
    expect(drawnPart(stack.lastElementChild!)).toBe(
      fromTemplate(
        RESOLVED,
        '<p class="xr-small" style="color: #40476B">Something else isn’t working? <a href="#help">Report a problem</a></p>',
      ),
    );
  });

  it('reopened: "This report is open again" with the Retry arrow; no resolution note', () => {
    expectBoardDraws(
      REOPENED,
      'Reopened reads as open again, with the earlier resolution kept in the history.',
    );
    const { container } = render(<HelpReportDetail {...REOPENED_DETAIL} />);
    const notices = container.querySelectorAll('.xr-notice');
    expect(notices).toHaveLength(1);
    expect(markup(notices[0]!)).toBe(
      fromTemplate(
        REOPENED,
        '<div class="xr-notice" role="status"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.4-5.7M20 4v4.5h-4.5"></path></svg><div class="xr-notice-body"><span class="xr-notice-title">This report is open again</span><span>It was reopened on {{ f.d.reopened }}. You can follow it here.</span></div></div>',
        { 'f.d.reopened': '6 Oct' },
      ),
    );
    expect(container.querySelector('.xr-phead-meta .xr-status')).toHaveTextContent('Reopened');
  });

  it('the reporter has no reopen or resolve control (board 07 "Rules")', () => {
    expectBoardDraws(
      RULES,
      '<li>The reporter reads the resolution note; resolving and reopening are Super Admin actions (SA-F8).</li>',
    );
    render(<HelpReportDetail {...RESOLVED_DETAIL} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('emits only stylesheet classes; axe clean (resolved, reopened)', async () => {
    for (const props of [RESOLVED_DETAIL, REOPENED_DETAIL]) {
      const { container, unmount } = render(<HelpReportDetail {...props} />);
      expectStylesheetClassesOnly(container);
      await assertNoAxeViolations(container);
      unmount();
    }
  });
});
