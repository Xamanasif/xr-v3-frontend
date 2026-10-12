/**
 * ShellBanner (XS-08) — markup contract and accessibility (Appendix E §3.1 "ShellBanner (XS-08)").
 * Sources: B2-10 "Institution paused" and "Student inactive" (the banners exactly as drawn
 * inside the shell); board 04 "Paused · shell banner" and "Inactive · shell banner" (the state
 * grammar: "Shell banner (amber) + Help", "Shell banner (navy) + Help").
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LinkProvider, type LinkRenderProps } from '../link.js';
import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
} from '../testing/index.js';
import { ShellBanner } from './shell-banner.js';

const HELP = '07-Help-Support.dc.html';
const svg = (d: string) =>
  `<svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"></path></svg>`;

describe('ShellBanner markup contract', () => {
  it('paused: amber, Paused icon, the fixed words and Help, exactly as drawn', () => {
    const { container } = render(<ShellBanner kind="paused" helpHref={HELP} />);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: 'B2-10', frame: 'Institution paused' },
      `<div class="xr-banner xr-banner--paused" role="status"><div class="xr-banner-msg">${svg('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM10 9v6M14 9v6')}<span><strong>Your institution’s access is paused — your work is kept.</strong></span></div><a class="xr-btn xr-btn--text" href="${HELP}">Help</a></div>`,
    );
    expectBoardDraws(
      { board: '04', frame: 'Paused · shell banner' },
      '<div class="xr-banner-msg"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM10 9v6M14 9v6"></path></svg><span><strong>Your institution’s access is paused — your work is kept.</strong></span></div>',
    );
  });

  it('inactive: navy with xr-dark, Not available icon, the fixed words and Help', () => {
    const { container } = render(<ShellBanner kind="inactive" helpHref={HELP} />);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: 'B2-10', frame: 'Student inactive' },
      `<div class="xr-banner xr-banner--inactive xr-dark" role="status"><div class="xr-banner-msg">${svg('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12h8')}<span><strong>Your account is inactive.</strong> Contact your institution administrator.</span></div><a class="xr-btn xr-btn--text" href="${HELP}">Help</a></div>`,
    );
    expectBoardDraws(
      { board: '04', frame: 'Inactive · shell banner' },
      '<span><strong>Your account is inactive.</strong> Contact your institution administrator.</span>',
    );
  });

  it('is a status region with the words and a Help link through the injected link component', () => {
    const hrefs: string[] = [];
    function Injected({ ref, ...props }: LinkRenderProps) {
      hrefs.push(props.href);
      return <a ref={ref} {...props} />;
    }
    render(
      <LinkProvider component={Injected}>
        <ShellBanner kind="paused" helpHref="/student/help" />
      </LinkProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Your institution’s access is paused — your work is kept.',
    );
    expect(screen.getByRole('link', { name: 'Help' })).toHaveAttribute('href', '/student/help');
    expect(hrefs).toEqual(['/student/help']);
  });
});

describe('ShellBanner: stylesheet classes and accessibility', () => {
  it('emits only stylesheet classes', () => {
    const { container } = render(
      <div>
        <ShellBanner kind="paused" helpHref="#help" />
        <ShellBanner kind="inactive" helpHref="#help" />
      </div>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });

  it.each(['paused', 'inactive'] as const)('%s', async (kind) => {
    const { container } = render(<ShellBanner kind={kind} helpHref="#help" />);
    await assertNoAxeViolations(container);
  });
});
