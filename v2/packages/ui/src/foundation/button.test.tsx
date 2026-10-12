/**
 * Button — markup contract, behaviour and accessibility (Appendix E §3.1 Button; Appendix F
 * WP-0.6 acceptance 2–4). Sources: board 03 "Actions" (variants, sizes, block, icon, disabled)
 * and B2-05 "IA-05 Give students access · 1440 · interactive · start here" (busy, as on the
 * product boards).
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
  type BoardSource,
} from '../testing/index.js';
import { Button } from './button.js';

const ACTIONS: BoardSource = { board: '03', frame: 'Actions' };
const BUSY: BoardSource = {
  board: 'B2-05',
  frame: 'IA-05 Give students access · 1440 · interactive · start here',
};

describe('Button markup contract (board 03 "Actions"; B2-05)', () => {
  it.each([
    ['primary', 'Give access'],
    ['secondary', 'Save draft'],
    ['text', 'View my reports'],
    ['danger', 'Withdraw access'],
    ['danger-quiet', 'Deactivate account'],
  ] as const)('%s renders exactly as drawn', (variant, label) => {
    const { container } = render(<Button variant={variant}>{label}</Button>);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      ACTIONS,
      `<button type="button" class="xr-btn xr-btn--${variant}">${label}</button>`,
    );
  });

  it('small and block sizes', () => {
    const { container, rerender } = render(
      <Button variant="secondary" size="sm">
        Small 36
      </Button>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      ACTIONS,
      '<button type="button" class="xr-btn xr-btn--secondary xr-btn--sm">Small 36</button>',
    );
    rerender(
      <Button variant="primary" block>
        Return to vendor
      </Button>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      ACTIONS,
      '<button type="button" class="xr-btn xr-btn--primary xr-btn--block">Return to vendor</button>',
    );
  });

  it('a leading icon: "Try again" with the board-02 Retry icon', () => {
    const { container } = render(
      <Button variant="secondary" size="sm" icon="retry">
        Try again
      </Button>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: '03', frame: 'Notices, empty, error, loading and read-only' },
      '<button type="button" class="xr-btn xr-btn--secondary xr-btn--sm"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.4-5.7M20 4v4.5h-4.5"></path></svg>Try again</button>',
    );
  });

  it('busy, as the product boards draw it: is-busy, aria-disabled, spinner, busy label', () => {
    const { container } = render(
      <Button variant="primary" busy busyLabel="Giving access…">
        Give access
      </Button>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      BUSY,
      '<button type="button" class="xr-btn xr-btn--primary is-busy" aria-disabled="true"><span class="xr-spin" aria-hidden="true"></span>Giving access…</button>',
    );
  });

  it('keeps board context classes before the busy state (B1-07 xp-cta)', () => {
    const { container } = render(
      <Button variant="primary" className="xp-cta" busy busyLabel="Sending request…">
        Submit request
      </Button>,
    );
    expect(container.firstElementChild).toHaveClass('xr-btn xr-btn--primary xp-cta is-busy');
    expect(container.firstElementChild!.className).toBe('xr-btn xr-btn--primary xp-cta is-busy');
  });

  it('disabled is the native attribute board 03 draws ("Submit feedback")', () => {
    render(
      <Button variant="primary" disabled>
        Submit feedback
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Submit feedback' })).toBeDisabled();
  });

  it('emits only stylesheet classes', () => {
    const { container } = render(
      <div>
        <Button variant="on-dark">Open preview</Button>
        <Button variant="danger" busy busyLabel="Withdrawing…">
          Withdraw
        </Button>
      </div>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });
});

describe('Button behaviour', () => {
  it('ignores repeat presses while busy', () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <Button variant="primary" onClick={onClick} busyLabel="Giving access…">
        Give access
      </Button>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(
      <Button variant="primary" onClick={onClick} busy busyLabel="Giving access…">
        Give access
      </Button>,
    );
    const busy = screen.getByRole('button', { name: 'Giving access…' });
    fireEvent.click(busy);
    fireEvent.click(busy);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('a busy submit button does not submit its form again', () => {
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    render(
      <form onSubmit={(event) => onSubmit(event.nativeEvent as SubmitEvent)}>
        <Button variant="primary" type="submit" busy busyLabel="Sending request…">
          Submit request
        </Button>
      </form>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('the busy label is the accessible name, and the spinner is hidden', () => {
    render(
      <Button variant="secondary" busy busyLabel="Saving…">
        Save draft
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Saving…' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button.querySelector('.xr-spin')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Button accessibility (axe, WCAG 2.2 AA)', () => {
  it.each([
    ['default', <Button variant="primary">Give access</Button>],
    [
      'icon',
      <Button variant="secondary" icon="tryAgain">
        Try again
      </Button>,
    ],
    [
      'busy',
      <Button variant="primary" busy busyLabel="Giving access…">
        Give access
      </Button>,
    ],
    [
      'disabled',
      <Button variant="primary" disabled>
        Submit feedback
      </Button>,
    ],
  ])('%s', async (_state, element) => {
    const { container } = render(element);
    await assertNoAxeViolations(container);
  });
});
