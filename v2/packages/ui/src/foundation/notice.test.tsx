/**
 * Notice — markup contract, roles and accessibility (Appendix E §3.1 Notice, §5.5 live regions).
 * Sources: board 03 "Notices, empty, error, loading and read-only" (info, success, warning with an
 * action, error); board 04 "Refused with reason" (an error notice with `role="status"` and an
 * action); product-board defaults from B1-09 "GL-02 Sign in · 1440 · interactive" (success,
 * quiet) and B2-09 "IA-15 People › Faculty courses · 1440 · interactive" (warning); a focusable
 * error notice on B6-14 "Academic Reviewer · Review a submission (interactive)".
 */
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
  type BoardSource,
} from '../testing/index.js';
import { Link } from './links.js';
import { Notice, type NoticeTone } from './notice.js';

const NOTICES: BoardSource = {
  board: '03',
  frame: 'Notices, empty, error, loading and read-only',
};
const svg = (d: string) =>
  `<svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"></path></svg>`;
const INFO = 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.5h.01';
const FAILED = 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5v5.5M12 16.5h.01';

describe('Notice markup contract (board 03)', () => {
  it('info: role status, Info icon, title and body, exactly as drawn', () => {
    const { container } = render(
      <Notice title="A new version of this experiment is live">
        Open the experiment to see what changed.
      </Notice>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      NOTICES,
      `<div class="xr-notice" role="status">${svg(INFO)}<div class="xr-notice-body"><span class="xr-notice-title">A new version of this experiment is live</span><span>Open the experiment to see what changed.</span></div></div>`,
    );
  });

  it('success with the board-03 circle tick', () => {
    const { container } = render(
      <Notice tone="ok" icon="reviewedByMe" title="Access given">
        Rahul Verma can now open Shell-and-Tube Heat Exchanger.
      </Notice>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      NOTICES,
      `<div class="xr-notice xr-notice--ok" role="status">${svg('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12.5l2.7 2.7L16 9.8')}<div class="xr-notice-body"><span class="xr-notice-title">Access given</span><span>Rahul Verma can now open Shell-and-Tube Heat Exchanger.</span></div></div>`,
    );
  });

  it('a static warning (role note) with an action link', () => {
    const { container } = render(
      <Notice
        tone="warn"
        role="note"
        icon="attention"
        title="Access plan ends on 30 Jun 2027"
        actions={<Link href="#h-fb">View plan</Link>}
      >
        Renewing mirrors the current plan.
      </Notice>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      NOTICES,
      `<div class="xr-notice xr-notice--warn" role="note">${svg('M12 4 2.8 19.5h18.4zM12 10v4M12 17h.01')}<div class="xr-notice-body"><span class="xr-notice-title">Access plan ends on 30 Jun 2027</span><span>Renewing mirrors the current plan.</span><div class="xr-notice-actions"><a href="#h-fb">View plan</a></div></div></div>`,
    );
  });

  it('an error defaults to role alert', () => {
    expectBoardDraws(NOTICES, `<div class="xr-notice xr-notice--err" role="alert">${svg(FAILED)}`);
    render(<Notice tone="err" title="The simulation didn’t open. Nothing was lost." />);
    expect(screen.getByRole('alert')).toHaveClass('xr-notice xr-notice--err');
  });

  it('an error that informs rather than interrupts takes role status (board 04)', () => {
    const { container } = render(
      <Notice
        tone="err"
        role="status"
        title="Returned to you"
        actions={
          <Link className="xr-btn xr-btn--secondary xr-btn--sm" href="#h-gram">
            Revise and resubmit
          </Link>
        }
      >
        Prof. A. Menon · 19 Aug: “Please clarify the VR device requirements.”
      </Notice>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: '04', frame: 'Refused with reason' },
      `<div class="xr-notice xr-notice--err" role="status">${svg(FAILED)}<div class="xr-notice-body"><span class="xr-notice-title">Returned to you</span><span>Prof. A. Menon · 19 Aug: “Please clarify the VR device requirements.”</span><div class="xr-notice-actions"><a class="xr-btn xr-btn--secondary xr-btn--sm" href="#h-gram">Revise and resubmit</a></div></div></div>`,
    );
  });
});

describe('Notice defaults follow the product boards', () => {
  it('success: the Done tick, title only (B1-09)', () => {
    const { container } = render(<Notice tone="ok" title="You’re signed out" />);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: 'B1-09', frame: 'GL-02 Sign in · 1440 · interactive' },
      `<div class="xr-notice xr-notice--ok" role="status">${svg('M5 12.5l4.5 4.5L19 7.5')}<div class="xr-notice-body"><span class="xr-notice-title">You’re signed out</span></div></div>`,
    );
  });

  it('warning: the Warning triangle, role status (B2-09)', () => {
    const body =
      '1 written answer in ME ZG523 is waiting for marking, and no other faculty member teaches the course. It will wait without a marker until you assign one.';
    const { container } = render(
      <Notice tone="warn" title="Written answers would have no marker">
        {body}
      </Notice>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: 'B2-09', frame: 'IA-15 People › Faculty courses · 1440 · interactive' },
      `<div class="xr-notice xr-notice--warn" role="status">${svg('M12 3.5 2.5 20h19zM12 10v4.5M12 17.5h.01')}<div class="xr-notice-body"><span class="xr-notice-title">Written answers would have no marker</span><span>${body}</span></div></div>`,
    );
  });

  it('quiet: the Info circle, role status (B1-09)', () => {
    const { container } = render(
      <Notice tone="quiet" title="Institution sign-in isn’t available right now">
        Sign in with your e-mail and password instead.
      </Notice>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: 'B1-09', frame: 'GL-02 Sign in · 1440 · interactive' },
      `<div class="xr-notice xr-notice--quiet" role="status">${svg(INFO)}<div class="xr-notice-body"><span class="xr-notice-title">Institution sign-in isn’t available right now</span><span>Sign in with your e-mail and password instead.</span></div></div>`,
    );
  });
});

describe('Notice as a focus target', () => {
  it('takes an id, tabIndex -1 and a ref after its role, as B6-14 draws it', () => {
    expectBoardDraws(
      { board: 'B6-14', frame: 'Academic Reviewer · Review a submission (interactive)' },
      `<div class="xr-notice xr-notice--err" role="alert" id="Zrr1440-derr" tabindex="-1">${svg(FAILED)}`,
    );
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <Notice ref={ref} tone="err" id="rr-derr" tabIndex={-1} title="Choose a decision" />,
    );
    expect(
      container.innerHTML.startsWith(
        '<div class="xr-notice xr-notice--err" role="alert" id="rr-derr" tabindex="-1">',
      ),
    ).toBe(true);
    ref.current!.focus();
    expect(document.activeElement).toBe(ref.current);
  });

  it('omits the parts it is not given', () => {
    const { container } = render(<Notice tone="ok">Saved.</Notice>);
    expect(container.querySelector('.xr-notice-body')!.innerHTML).toBe('<span>Saved.</span>');
  });
});

describe('Notice: stylesheet classes and accessibility', () => {
  const TONES: readonly NoticeTone[] = ['info', 'ok', 'warn', 'err', 'quiet'];

  it('emits only stylesheet classes', () => {
    const { container } = render(
      <div>
        {TONES.map((tone) => (
          <Notice key={tone} tone={tone} title="Title" actions={<Link href="#a">Open</Link>}>
            Body
          </Notice>
        ))}
      </div>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });

  it.each(TONES)('%s', async (tone) => {
    const { container } = render(
      <Notice tone={tone} title="Access given" actions={<Link href="#a">View plan</Link>}>
        Rahul Verma can now open Shell-and-Tube Heat Exchanger.
      </Notice>,
    );
    await assertNoAxeViolations(container);
  });

  it.each([
    [
      'static note',
      <Notice tone="warn" role="note" icon="attention" title="Access plan ends on 30 Jun 2027">
        Renewing mirrors the current plan.
      </Notice>,
    ],
    [
      'error as status',
      <Notice tone="err" role="status" title="Returned to you">
        Please clarify the VR device requirements.
      </Notice>,
    ],
    ['focus target', <Notice tone="err" id="n-derr" tabIndex={-1} title="Choose a decision" />],
    ['body only', <Notice tone="ok">Saved.</Notice>],
  ])('%s', async (_state, element) => {
    const { container } = render(element);
    await assertNoAxeViolations(container);
  });
});
