/**
 * MessagePage (AR-10, GL-04) — markup contract and accessibility (Appendix E §3.1 MessagePage).
 * Sources: board 08 "In context · Student workspace · 1312 px" (not available, inside the
 * shell), "At 375 px" (not your workspace) and "Anatomy" (icon, one H1, one sentence, one
 * primary action named by its destination, quiet Help); board 09b "Message page — “What
 * happened, and where now?”" (a confirmation with a reference and a second destination); B4-12
 * "ST-13 Assessment attempt · 1440 · interactive · 5 Nov 2026" (a confirmation shown in place,
 * as the product boards draw it: a focus target with a 20 px icon, an `xr-lead` sentence and a
 * text-button secondary link).
 *
 * Not emitted (inline styles, Appendix E §2.5–§2.6): the boards' `margin` / `align-items` /
 * `text-align` on `div.xr-msg`, the 40476B grey or `margin:0` of the sentence and the tone
 * tints of the icon circle.
 */
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
  normaliseMarkup,
  type BoardSource,
} from '../testing/index.js';
import { MessagePage } from './message-page.js';

const IN_SHELL: BoardSource = { board: '08', frame: 'In context · Student workspace · 1312 px' };
const icon24 = (d: string) =>
  `<svg class="xr-ico xr-ico--24" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"></path></svg>`;
const icon20 = (d: string) =>
  `<svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"></path></svg>`;

function notAvailable() {
  return render(
    <MessagePage
      icon="notAvailable"
      title="This experiment isn’t available to you"
      action={{ href: '#h-inshell', label: 'Back to My courses' }}
      secondary={{ href: '#h-inshell', label: 'Help' }}
    >
      Your institution hasn’t given you access to Forced Convection. Experiments you can open are in
      My courses.
    </MessagePage>,
  );
}

describe('MessagePage markup contract (board 08)', () => {
  it('not available, inside the shell: icon, H1, sentence, primary + Help, as drawn', () => {
    const { container } = notAvailable();
    const message = container.firstElementChild!;
    expect(message.className).toBe('xr-msg');
    const [icon, title, sentence, actions] = [...message.children];
    expectRenderedAsDrawn(
      icon!,
      IN_SHELL,
      `<span class="xr-msg-icon">${icon24('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12h8')}</span>`,
    );
    expectRenderedAsDrawn(
      title!,
      IN_SHELL,
      '<h1 class="xr-msg-title">This experiment isn’t available to you</h1>',
    );
    const words =
      'Your institution hasn’t given you access to Forced Convection. Experiments you can open are in My courses.';
    expectBoardDraws(IN_SHELL, `<p class="xr-body" style="color: #40476B">${words}</p>`);
    expect(normaliseMarkup(sentence!.outerHTML)).toBe(`<p class="xr-body">${words}</p>`);
    expectRenderedAsDrawn(
      actions!,
      IN_SHELL,
      '<div class="xr-msg-actions"><a class="xr-btn xr-btn--primary" href="#h-inshell">Back to My courses</a><a href="#h-inshell">Help</a></div>',
    );
  });

  it('not your workspace (XS-06) at 375 px: the lock icon and its H1', () => {
    const frame = { board: '08', frame: 'At 375 px' };
    const { container } = render(
      <MessagePage
        icon="readOnly"
        title="This page isn’t part of your workspace"
        action={{ href: '#h-mob', label: 'Back to Home' }}
        secondary={{ href: '#h-mob', label: 'Help' }}
      >
        You’re signed in to the Student workspace. This address belongs to a different workspace.
      </MessagePage>,
    );
    const [icon, title] = [...container.firstElementChild!.children];
    expectRenderedAsDrawn(
      icon!,
      frame,
      `<span class="xr-msg-icon">${icon24('M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3')}</span>`,
    );
    expectRenderedAsDrawn(
      title!,
      frame,
      '<h1 class="xr-msg-title">This page isn’t part of your workspace</h1>',
    );
  });

  it('a confirmation with a reference and a second destination (board 09b)', () => {
    const frame = { board: '09b', frame: 'Message page — “What happened, and where now?”' };
    const { container } = render(
      <MessagePage
        icon="done"
        title="Request sent"
        action={{ href: '#h-ar10', label: 'Check request status' }}
        secondary={{ href: '#h-ar10', label: 'Browse experiments' }}
      >
        Your reference is <span className="xr-id">REQ-0042</span>. Use it to check the status of
        your request at any time.
      </MessagePage>,
    );
    const [icon, , sentence, actions] = [...container.firstElementChild!.children];
    expectRenderedAsDrawn(icon!.firstElementChild!, frame, icon24('M5 12.5l4.5 4.5L19 7.5'));
    expectBoardDraws(frame, `<p class="xr-body" style="color: #40476B">${sentence!.innerHTML}</p>`);
    expectRenderedAsDrawn(
      actions!,
      frame,
      '<div class="xr-msg-actions"><a class="xr-btn xr-btn--primary" href="#h-ar10">Check request status</a><a href="#h-ar10">Browse experiments</a></div>',
    );
  });

  it('one H1, a decorative icon and a primary action named by its destination (board 08 "Anatomy")', () => {
    expectBoardDraws(
      { board: '08', frame: 'Anatomy' },
      '<strong>Title</strong> as the page’s only H1',
      '<strong>One primary action</strong> — always a way forward, named by its destination.',
    );
    notAvailable();
    expect(screen.getAllByRole('heading')).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'This experiment isn’t available to you',
    );
    expect(screen.getByRole('link', { name: 'Back to My courses' })).toHaveClass(
      'xr-btn xr-btn--primary',
    );
    expect(screen.getByRole('link', { name: 'Help' })).not.toHaveAttribute('class');
    expect(document.querySelector('.xr-msg-icon svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('a confirmation in place: focus target, 20 px icon, lead sentence, text-button link (B4-12)', () => {
    const frame = {
      board: 'B4-12',
      frame: 'ST-13 Assessment attempt · 1440 · interactive · 5 Nov 2026',
    };
    const words =
      'Submitted 5 Nov 2026, 18:52. Your faculty marks written answers. Your result appears after the deadline: 14 Nov 2026, 23:59.';
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <MessagePage
        ref={ref}
        id="Ta-done"
        tabIndex={-1}
        icon="done"
        iconSize={20}
        lead
        title="Answers submitted"
        action={{ href: 'B2-12-Experiment-Hub.dc.html', label: 'Back to experiment' }}
        secondary={{ href: 'B4-13-Assessment-Result.dc.html', label: 'See your result page' }}
        secondaryVariant="text"
      >
        {words}
      </MessagePage>,
    );
    const message = container.firstElementChild!;
    // The board's opening tag, up to its inline placement style.
    expectBoardDraws(frame, '<div class="xr-msg" id="Ta-done" tabindex="-1" style="margin:24px 0;');
    expect(normaliseMarkup(message.outerHTML)).toMatch(
      /^<div class="xr-msg" id="Ta-done" tabindex="-1"><span class="xr-msg-icon">/,
    );
    const [icon, heading, sentence, actions] = [...message.children];
    expectRenderedAsDrawn(icon!.firstElementChild!, frame, icon20('M5 12.5l4.5 4.5L19 7.5'));
    expectRenderedAsDrawn(heading!, frame, '<h1 class="xr-msg-title">Answers submitted</h1>');
    expectBoardDraws(frame, `<p class="xr-lead" style="margin:0">${words}</p>`);
    expect(normaliseMarkup(sentence!.outerHTML)).toBe(`<p class="xr-lead">${words}</p>`);
    expectRenderedAsDrawn(
      actions!,
      frame,
      '<div class="xr-msg-actions"><a class="xr-btn xr-btn--primary" href="B2-12-Experiment-Hub.dc.html">Back to experiment</a><a class="xr-btn xr-btn--text" href="B4-13-Assessment-Result.dc.html">See your result page</a></div>',
    );
    // Focus moves to the result (Appendix E §8): reachable by script, never a tab stop.
    ref.current!.focus();
    expect(document.activeElement).toBe(message);
    expect(message).toHaveAttribute('tabindex', '-1');
  });

  it('without a secondary link only the primary action is drawn (board 08 confirmation)', () => {
    render(
      <MessagePage
        icon="done"
        title="Feedback sent"
        action={{ href: '#hub', label: 'Back to Shell-and-Tube Heat Exchanger' }}
      >
        Your feedback on VR for Shell-and-Tube Heat Exchanger is saved.
      </MessagePage>,
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
});

describe('MessagePage: stylesheet classes and accessibility', () => {
  function confirmation() {
    return render(
      <MessagePage
        id="ta-done"
        tabIndex={-1}
        icon="done"
        iconSize={20}
        lead
        title="Answers submitted"
        action={{ href: '#hub', label: 'Back to experiment' }}
        secondary={{ href: '#result', label: 'See your result page' }}
        secondaryVariant="text"
      >
        Your faculty marks written answers.
      </MessagePage>,
    );
  }

  it('emits only stylesheet classes', () => {
    const { container } = notAvailable();
    expectStylesheetClassesOnly(container.firstElementChild!);
    const { container: inPlace } = confirmation();
    expectStylesheetClassesOnly(inPlace.firstElementChild!);
  });

  it.each([
    ['not available', notAvailable],
    ['confirmation in place', confirmation],
  ])('axe: %s', async (_variant, draw) => {
    const { container } = draw();
    await assertNoAxeViolations(container);
  });
});
