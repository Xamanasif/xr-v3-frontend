/**
 * Link / BackLink / JumpLink — markup contract, behaviour and accessibility (Appendix E §3.1
 * "Link / BackLink / JumpLink"; Appendix F WP-0.6 acceptance 2–4). Sources: board 02 "Links and
 * focus" (inline and external links), B1-05 "PU-06 Experiment · 1440 · interactive" (the
 * screen-reader text after the 16 px external icon), board 03 "Back link", board 09a
 * "Decision page — “Should I approve this?”" (the "Go to decision" jump link and its
 * `tabIndex="-1"` panel) and board 13 "Batch-0 review corrections · 8 Oct 2026" (its "Mobile
 * decision shortcut" row: the link moves focus to the panel).
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LinkProvider, type LinkRenderProps } from '../link.js';
import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
  normaliseMarkup,
  type BoardSource,
} from '../testing/index.js';
import { BackLink, JumpLink, Link } from './links.js';

const LINKS: BoardSource = { board: '02', frame: 'Links and focus' };
const EXTERNAL_ICON =
  '<svg class="xr-ico xr-ico--16" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"></path></svg>';
const DECISION: BoardSource = { board: '09a', frame: 'Decision page — “Should I approve this?”' };

describe('Link markup contract (board 02 "Links and focus")', () => {
  it('an inline link renders exactly as drawn', () => {
    const { container } = render(<Link href="#h-link">lab brief</Link>);
    expectRenderedAsDrawn(container.firstElementChild!, LINKS, '<a href="#h-link">lab brief</a>');
  });

  it('an external link: 16 px External link icon, then the new-tab words for screen readers', () => {
    // Board 02 draws the icon and `span.xr-sr` "(opens in a new tab)" (its inline-flex style is
    // canvas glue); the product boards put a space before the words so the name reads cleanly.
    expectBoardDraws(
      LINKS,
      `Open delivery link${EXTERNAL_ICON}<span class="xr-sr">(opens in a new tab)</span></a>`,
    );
    expectBoardDraws(
      { board: 'B1-05', frame: 'PU-06 Experiment · 1440 · interactive' },
      `Open preview${EXTERNAL_ICON}<span class="xr-sr"> (opens in a new tab)</span></a>`,
    );
    const { container } = render(
      <Link href="#h-link" external>
        Open delivery link
      </Link>,
    );
    expect(normaliseMarkup(container.innerHTML)).toBe(
      normaliseMarkup(
        `<a href="#h-link" target="_blank" rel="noopener noreferrer">Open delivery link${EXTERNAL_ICON}<span class="xr-sr"> (opens in a new tab)</span></a>`,
      ),
    );
    // jsdom's name computation trims the inline span's leading space; the browser spec asserts
    // the exact name "Open delivery link (opens in a new tab)".
    expect(
      screen.getByRole('link', { name: /^Open delivery link ?\(opens in a new tab\)$/ }),
    ).toHaveAttribute('target', '_blank');
  });

  it('keeps board context classes (a row link)', () => {
    render(
      <Link href="#h-list" className="xr-row-link">
        Rahul Verma
      </Link>,
    );
    expect(screen.getByRole('link', { name: 'Rahul Verma' }).className).toBe('xr-row-link');
  });
});

describe('BackLink markup contract (board 03 "Back link")', () => {
  it('names its destination after the board-02 Back icon, exactly as drawn', () => {
    const { container } = render(<BackLink href="#h-nav">Students</BackLink>);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: '03', frame: 'Back link' },
      '<a class="xr-back" href="#h-nav"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6 8.5 12l6 6"></path></svg>Students</a>',
    );
    expectBoardDraws(
      { board: '03', frame: 'Back link' },
      'Back link names the destination, not “Back”.',
    );
    expect(screen.getByRole('link')).toHaveAccessibleName('Students');
  });
});

describe('JumpLink markup contract and behaviour', () => {
  it('"Go to decision" with the chevron, exactly as drawn, pointing at the panel', () => {
    const { container } = render(<JumpLink targetId="ar4-decision" />);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      DECISION,
      '<a class="xr-jump" href="#ar4-decision">Go to decision<svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6"></path></svg></a>',
    );
    expectBoardDraws(
      DECISION,
      '<aside class="xr-dpanel" id="ar4-decision" tabIndex="-1" aria-labelledby="ar4-dp">',
    );
  });

  it('moves focus to the decision panel (board 13 correction "Mobile decision shortcut")', () => {
    expectBoardDraws(
      { board: '13', frame: 'Batch-0 review corrections · 8 Oct 2026' },
      "what: 'Mobile decision shortcut'",
      '“Go to decision” appears under the status when the decision panel sits below the content (under 860 px of content); it moves focus to the panel.',
    );
    render(
      <>
        <JumpLink targetId="za-decision" />
        <aside className="xr-dpanel" id="za-decision" tabIndex={-1} aria-label="Your decision" />
      </>,
    );
    const link = screen.getByRole('link', { name: 'Go to decision' });
    // fireEvent returns false when the default (fragment navigation) was prevented.
    expect(fireEvent.click(link)).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole('complementary'));
  });

  it('leaves modified clicks, a missing target and a caller-handled click to the browser', () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    const { rerender } = render(
      <>
        <JumpLink targetId="p-decision" />
        <aside id="p-decision" tabIndex={-1} aria-label="Your decision" />
      </>,
    );
    const link = () => screen.getByRole('link', { name: 'Go to decision' });
    expect(fireEvent.click(link(), { ctrlKey: true })).toBe(true);
    expect(document.activeElement).toBe(document.body);
    rerender(<JumpLink targetId="nowhere" />);
    expect(fireEvent.click(link())).toBe(true);
    rerender(
      <>
        <JumpLink targetId="p-decision" onClick={onClick} />
        <aside id="p-decision" tabIndex={-1} aria-label="Your decision" />
      </>,
    );
    fireEvent.click(link());
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(document.body);
  });
});

describe('Links go through the injected link component (Appendix E §2.6)', () => {
  it('Link, BackLink and JumpLink render the provided component', () => {
    const rendered: LinkRenderProps[] = [];
    function Injected({ ref, ...props }: LinkRenderProps) {
      rendered.push(props);
      return <a ref={ref} {...props} />;
    }
    render(
      <LinkProvider component={Injected}>
        <Link href="/help">Help</Link>
        <BackLink href="/requests">Requests</BackLink>
        <JumpLink targetId="d" />
      </LinkProvider>,
    );
    expect(rendered.map((props) => props.href)).toEqual(['/help', '/requests', '#d']);
  });
});

describe('Links: stylesheet classes and accessibility (axe, WCAG 2.2 AA)', () => {
  it('emit only stylesheet classes', () => {
    const { container } = render(
      <div>
        <Link href="#a" external>
          Open web link
        </Link>
        <BackLink href="#b">Review queue</BackLink>
        <JumpLink targetId="c" />
      </div>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });

  it.each([
    ['inline', <Link href="#h-link">lab brief</Link>],
    [
      'external',
      <Link href="#h-link" external>
        Open delivery link
      </Link>,
    ],
    ['back', <BackLink href="#h-nav">Students</BackLink>],
    [
      'jump',
      <>
        <JumpLink targetId="j-decision" />
        <aside id="j-decision" tabIndex={-1} aria-label="Your decision" />
      </>,
    ],
  ])('%s', async (_kind, element) => {
    const { container } = render(element);
    await assertNoAxeViolations(container);
  });
});
