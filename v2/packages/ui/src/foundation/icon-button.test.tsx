/**
 * IconButton — markup contract, behaviour and accessibility (Appendix E §3.1 IconButton).
 * Sources: board 10 "Keyboard path and phone layout" (dialog Close) and B4-05 "FA-09 Questions · 1440 · interactive" (move up,
 * `aria-disabled` on the first row).
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
} from '../testing/index.js';
import { IconButton } from './icon-button.js';

describe('IconButton markup contract', () => {
  it('the dialog Close button, as board 10 draws it', () => {
    const { container } = render(<IconButton label="Close" icon="close" />);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: '10', frame: 'Keyboard path and phone layout' },
      '<button type="button" class="xr-icon-btn" aria-label="Close"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg></button>',
    );
  });

  it('unavailable: aria-disabled, still named and focusable (B4-05 move up)', () => {
    expectBoardDraws(
      { board: 'B4-05', frame: 'FA-09 Questions · 1440 · interactive' },
      'class="xr-icon-btn" aria-label="{{ r.upAria }}" aria-disabled="true"',
    );
    render(<IconButton label="Move question 1 up" icon="chevronUp" disabled />);
    const button = screen.getByRole('button', { name: 'Move question 1 up' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
  });

  it('emits only stylesheet classes', () => {
    const { container } = render(<IconButton label="Collapse menu" icon="collapseMenu" />);
    expectStylesheetClassesOnly(container.firstElementChild!);
  });
});

describe('IconButton behaviour and accessibility', () => {
  it('ignores presses while unavailable', () => {
    const onClick = vi.fn();
    const { rerender } = render(<IconButton label="Move up" icon="chevronUp" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    rerender(<IconButton label="Move up" icon="chevronUp" onClick={onClick} disabled />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])('axe (unavailable: %s)', async (disabled) => {
    const { container } = render(<IconButton label="Close" icon="close" disabled={disabled} />);
    await assertNoAxeViolations(container);
  });
});
