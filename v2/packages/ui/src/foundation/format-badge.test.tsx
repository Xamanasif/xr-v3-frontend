/**
 * FormatBadge / FormatSet — markup contract and accessibility (Appendix E §3.1 "FormatBadge /
 * FormatSet"). Sources: board 04 "Format chips · WEB · AR · VR · MR" (frames "1 · Normal ·
 * offered by the experiment", "2 · Available to you · inherited", "3 · Unavailable", "5 ·
 * Compact · inside rows", "6 · On a navy header band"); the product-board compact chips on
 * B2-11 "ST-03 Course detail · ME ZG523" and "Course detail · paused" and B3-01 "ST-06 Resources
 * · 1440 · interactive · 12 Oct 2026".
 */
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
} from '../testing/index.js';
import { FormatBadge, FormatSet } from './format-badge.js';

const GLYPH = {
  WEB: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3.5h12v9H2zM2 6.5h12"></path></svg>',
  AR: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 5V2.5h2.5M11.5 2.5H14V5M14 11v2.5h-2.5M4.5 13.5H2V11M8 5.3l2.6 1.5v2.9L8 11.2 5.4 9.7V6.8z"></path></svg>',
  VR: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.75 5h12.5v6H10.25L8 9.1 5.75 11H1.75z"></path></svg>',
  MR: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 12.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM10 12.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z"></path></svg>',
} as const;

describe('FormatBadge markup contract (board 04 "Format chips · WEB · AR · VR · MR")', () => {
  it.each(['WEB', 'AR', 'VR', 'MR'] as const)('offered %s: code + glyph, as drawn', (format) => {
    const { container } = render(<FormatBadge format={format} />);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: '04', frame: '1 · Normal · offered by the experiment' },
      `<span class="xr-fmt">${GLYPH[format]}${format}</span>`,
    );
  });

  it.each([
    ['yours', 'VR', '2 · Available to you · inherited'],
    ['off', 'AR', '3 · Unavailable'],
    ['on-dark', 'WEB', '6 · On a navy header band'],
  ] as const)('%s', (variant, format, frame) => {
    const { container } = render(<FormatBadge format={format} variant={variant} />);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: '04', frame },
      `<span class="xr-fmt xr-fmt--${variant}">${GLYPH[format]}${format}</span>`,
    );
  });

  it('compact on the product boards keeps the glyph; variant modifier, then compact', () => {
    const { container } = render(<FormatBadge format="WEB" variant="on-dark" compact />);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: 'B3-01', frame: 'ST-06 Resources · 1440 · interactive · 12 Oct 2026' },
      `<span class="xr-fmt xr-fmt--on-dark xr-fmt--compact">${GLYPH.WEB}WEB</span>`,
    );
  });

  it('compact without the glyph, as boards 03 and 04 draw it', () => {
    const compact = { board: '04', frame: '5 · Compact · inside rows' };
    const { container, rerender } = render(<FormatBadge format="WEB" compact glyph={false} />);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      compact,
      '<span class="xr-fmt xr-fmt--compact">WEB</span>',
    );
    // Board variance: board 04 orders this one `--compact --off`; the product boards (186 off,
    // 211 yours, 71 on-dark compact chips) put the variant first. The class set is the same.
    expectBoardDraws(compact, '<span class="xr-fmt xr-fmt--compact xr-fmt--off">AR</span>');
    rerender(<FormatBadge format="AR" variant="off" compact glyph={false} />);
    const chip = container.firstElementChild!;
    expect([...chip.classList].sort()).toEqual(['xr-fmt', 'xr-fmt--compact', 'xr-fmt--off']);
    expect(chip.innerHTML).toBe('AR');
  });
});

describe('FormatSet markup contract', () => {
  it('a set of "available to you" compact chips, exactly as B2-11 draws it', () => {
    const { container } = render(<FormatSet formats={['WEB', 'VR']} variant="yours" compact />);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: 'B2-11', frame: 'ST-03 Course detail · ME ZG523' },
      `<span class="xr-fmt-set"><span class="xr-fmt xr-fmt--yours xr-fmt--compact">${GLYPH.WEB}WEB</span><span class="xr-fmt xr-fmt--yours xr-fmt--compact">${GLYPH.VR}VR</span></span>`,
    );
  });

  it('unavailable chips in a paused course (B2-11 "Course detail · paused")', () => {
    const { container } = render(<FormatSet formats={['WEB', 'VR']} variant="off" compact />);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: 'B2-11', frame: 'Course detail · paused' },
      `<span class="xr-fmt-set"><span class="xr-fmt xr-fmt--off xr-fmt--compact">${GLYPH.WEB}WEB</span><span class="xr-fmt xr-fmt--off xr-fmt--compact">${GLYPH.VR}VR</span></span>`,
    );
  });

  it('keeps the caller’s order and per-chip variants; never re-sorts', () => {
    expectBoardDraws(
      { board: '04', frame: '5 · Compact · inside rows' },
      '<span class="xr-fmt-set"><span class="xr-fmt xr-fmt--compact">WEB</span><span class="xr-fmt xr-fmt--compact">VR</span><span class="xr-fmt xr-fmt--compact xr-fmt--off">AR</span></span>',
    );
    const { container, rerender } = render(
      <FormatSet formats={['WEB', 'VR', { format: 'AR', variant: 'off' }]} compact glyph={false} />,
    );
    const chips = () => [...container.querySelectorAll('.xr-fmt')];
    expect(chips().map((chip) => chip.textContent)).toEqual(['WEB', 'VR', 'AR']);
    expect(chips()[2]).toHaveClass('xr-fmt--off');
    expect(chips()[1]).not.toHaveClass('xr-fmt--off');
    rerender(<FormatSet formats={['MR', 'WEB']} />);
    expect(chips().map((chip) => chip.textContent)).toEqual(['MR', 'WEB']);
  });

  it('the words beside the chip are the caller’s, not the chip’s (board 04 "Four things the chips must never blur")', () => {
    const { container } = render(<FormatBadge format="AR" variant="off" />);
    expect(container.textContent).toBe('AR');
    expectBoardDraws(
      { board: '04', frame: 'Four things the chips must never blur' },
      '<span class="xr-fmt xr-fmt--compact xr-fmt--off">AR</span> <span class="xr-sub">Not in your plan</span>',
    );
  });
});

describe('FormatBadge / FormatSet: stylesheet classes and accessibility', () => {
  it('emit only stylesheet classes', () => {
    const { container } = render(
      <div>
        <FormatSet formats={['WEB', 'AR', 'VR', 'MR']} />
        <FormatSet formats={['WEB', 'VR']} variant="yours" compact />
        <FormatSet formats={['AR']} variant="off" />
        <FormatBadge format="VR" variant="on-dark" compact />
      </div>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });

  it.each([
    ['offered', <FormatSet formats={['WEB', 'AR', 'VR', 'MR']} />],
    ['yours compact', <FormatSet formats={['WEB', 'VR']} variant="yours" compact />],
    ['off', <FormatBadge format="MR" variant="off" />],
    ['compact without glyph', <FormatBadge format="WEB" compact glyph={false} />],
  ])('%s', async (_variant, element) => {
    const { container } = render(element);
    await assertNoAxeViolations(container);
  });
});
