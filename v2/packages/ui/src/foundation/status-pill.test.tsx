/**
 * StatusPill — markup contract and accessibility (Appendix E §3.1 StatusPill). Source: board 04
 * "Status chips · tone, icon, words" (seven tones, each with its own icon shape, and the note on
 * the navy "Live" chip); board 03 "Comparison block · current vs proposed" (a chip without an
 * icon). The component takes tone + words and carries no status vocabulary.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
  type BoardSource,
} from '../testing/index.js';
import { STATUS_TONE_ICONS, StatusPill, type StatusTone } from './status-pill.js';

const CHIPS: BoardSource = { board: '04', frame: 'Status chips · tone, icon, words' };
const svg = (d: string) =>
  `<svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"></path></svg>`;

describe('StatusPill markup contract (board 04 "Status chips · tone, icon, words")', () => {
  it.each([
    ['neutral', '', 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12h8', 'Not started'],
    ['info', ' xr-status--info', 'M7 7h11l-3-3M17 17H6l3 3', 'Under review'],
    [
      'wait',
      ' xr-status--wait',
      'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3 2',
      'Waiting for a licence',
    ],
    ['ok', ' xr-status--ok', 'M5 12.5l4.5 4.5L19 7.5', 'Access active'],
    [
      'err',
      ' xr-status--err',
      'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5v5.5M12 16.5h.01',
      'Payment failed',
    ],
    [
      'paused',
      ' xr-status--paused',
      'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM10 9v6M14 9v6',
      'On hold',
    ],
    ['off', ' xr-status--off', 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12h8', 'Withdrawn'],
  ] as const)('%s: its tone icon, then the words', (tone, modifier, d, words) => {
    const { container } = render(<StatusPill tone={tone}>{words}</StatusPill>);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      CHIPS,
      `<span class="xr-status${modifier}">${svg(d)}${words}</span>`,
    );
  });

  it('read-only: a paused chip with the lock, as drawn', () => {
    const { container } = render(
      <StatusPill tone="paused" icon="readOnly">
        Read-only
      </StatusPill>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      CHIPS,
      `<span class="xr-status xr-status--paused">${svg('M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3')}Read-only</span>`,
    );
  });

  it('no icon where the board draws none (board 03 comparison "Changed")', () => {
    const { container } = render(
      <StatusPill tone="wait" icon={null}>
        Changed
      </StatusPill>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: '03', frame: 'Comparison block · current vs proposed' },
      '<span class="xr-status xr-status--wait">Changed</span>',
    );
  });

  it('live: the navy chip for the current published version, with no icon drawn', () => {
    expectBoardDraws(CHIPS, 'A “Live” navy chip marks the current published version only.');
    const { container } = render(<StatusPill tone="live">Live</StatusPill>);
    expect(container.innerHTML).toBe('<span class="xr-status xr-status--live">Live</span>');
    expect(STATUS_TONE_ICONS.live).toBeNull();
  });

  it('the words are always the caller’s; the tone icons follow board 04', () => {
    render(<StatusPill tone="ok">Released</StatusPill>);
    expect(screen.getByText('Released')).toHaveClass('xr-status', 'xr-status--ok');
    // Five tones carry five different shapes (arrows, clock, tick, alert, pause).
    const shapes = (['info', 'wait', 'ok', 'err', 'paused'] as const).map(
      (tone) => STATUS_TONE_ICONS[tone],
    );
    expect(new Set(shapes).size).toBe(shapes.length);
    // Neutral and not available share the minus, as board 04 draws them ("grey · minus",
    // "dashed · minus"); the dashed outline of `xr-status--off` tells them apart.
    expectBoardDraws(
      CHIPS,
      '<strong>Neutral</strong><span class="xr-sub">grey · minus</span>',
      '<strong>Not available</strong><span class="xr-sub">dashed · minus</span>',
    );
    expect(STATUS_TONE_ICONS.neutral).toBe('notAvailable');
    expect(STATUS_TONE_ICONS.off).toBe('notAvailable');
    expect(shapes).not.toContain('notAvailable');
  });
});

describe('StatusPill: stylesheet classes and accessibility', () => {
  const TONES: readonly StatusTone[] = [
    'neutral',
    'info',
    'ok',
    'wait',
    'err',
    'paused',
    'off',
    'live',
  ];

  it('emits only stylesheet classes', () => {
    const { container } = render(
      <div>
        {TONES.map((tone) => (
          <StatusPill key={tone} tone={tone}>
            {tone}
          </StatusPill>
        ))}
      </div>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });

  it.each(TONES)('%s', async (tone) => {
    const { container } = render(<StatusPill tone={tone}>Under review</StatusPill>);
    await assertNoAxeViolations(container);
  });

  it.each([
    [
      'read-only lock',
      <StatusPill tone="paused" icon="readOnly">
        Read-only
      </StatusPill>,
    ],
    [
      'no icon',
      <StatusPill tone="wait" icon={null}>
        Changed
      </StatusPill>,
    ],
  ])('%s', async (_state, element) => {
    const { container } = render(element);
    await assertNoAxeViolations(container);
  });
});
