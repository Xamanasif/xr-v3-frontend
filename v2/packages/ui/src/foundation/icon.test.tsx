/**
 * Icon and FormatGlyph — markup contract and accessibility (Appendix E §3.1 Icon). Sources:
 * board 02 "Icon sizing and working icon set" (the three sizes, drawn with the clock path of the
 * board-02 "Waiting" icon) and board 04 "1 · Normal · offered by the experiment" (format glyph).
 */
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  assertNoAxeViolations,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
} from '../testing/index.js';
import { FormatGlyph, Icon } from './icon.js';

const SIZES = { board: '02', frame: 'Icon sizing and working icon set' } as const;
const PATH = 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3 2';

describe('Icon markup contract (board 02 "Icon sizing and working icon set")', () => {
  it.each([
    [16, 'xr-ico xr-ico--16'],
    [20, 'xr-ico'],
    [24, 'xr-ico xr-ico--24'],
  ] as const)('size %i renders exactly as drawn', (size, classes) => {
    const { container } = render(<Icon name="waiting" size={size} />);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      SIZES,
      `<svg class="${classes}" viewBox="0 0 24 24" aria-hidden="true"><path d="${PATH}"></path></svg>`,
    );
  });

  it('keeps a board context class after the size classes (xr-acct-chev on the account menu)', () => {
    const { container } = render(<Icon name="chevronDown" className="xr-acct-chev" />);
    expect(container.firstElementChild!.getAttribute('class')).toBe('xr-ico xr-acct-chev');
    expectStylesheetClassesOnly(container.firstElementChild!);
  });

  it('is decorative: hidden from assistive technology', async () => {
    const { container } = render(
      <button type="button" aria-label="Close">
        <Icon name="close" />
      </button>,
    );
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await assertNoAxeViolations(container);
  });
});

describe('FormatGlyph markup contract (board 04)', () => {
  it('the WEB glyph, as drawn inside span.xr-fmt', () => {
    const { container } = render(<FormatGlyph format="WEB" />);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: '04', frame: '1 · Normal · offered by the experiment' },
      '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3.5h12v9H2zM2 6.5h12"></path></svg>',
    );
  });
});
