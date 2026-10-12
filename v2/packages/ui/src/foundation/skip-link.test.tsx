/**
 * SkipLink — markup contract, behaviour and accessibility (Appendix E §3.1 SkipLink, §7.4;
 * WCAG 2.4.1). Sources: board 05 "GL-01 Workspace Shell" (`a.xr-skip` → `#main`, first in
 * `div.xr-app`, drawn statically) and board 12 "Shell tab order" ("Skip to main content — first
 * stop, visible when focused"). jsdom has no Tab order or layout: the first tab stop, the visible
 * focus and focus landing in `main` are proven in the browser
 * (apps/specimens e2e/components-foundation-structure.spec.ts).
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LinkProvider, type LinkRenderProps } from '../link.js';
import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
} from '../testing/index.js';
import { SkipLink } from './skip-link.js';

function Shell({ focusableMain = true }: { readonly focusableMain?: boolean }) {
  return (
    <div className="xr-app">
      <SkipLink />
      <header className="xr-top">
        <button type="button" className="xr-menu-btn">
          Menu
        </button>
      </header>
      <main className="xr-page" id="main" tabIndex={focusableMain ? -1 : undefined}>
        <h1 className="xr-h1">Help &amp; support</h1>
      </main>
    </div>
  );
}

describe('SkipLink markup contract', () => {
  it('renders exactly as board 05 draws it, first inside `div.xr-app`', () => {
    const { container } = render(<Shell />);
    const app = container.firstElementChild!;
    expectRenderedAsDrawn(
      app.firstElementChild!,
      { board: '05', frame: 'GL-01 Workspace Shell' },
      '<a class="xr-skip" href="#main">Skip to main content</a>',
    );
    expectBoardDraws(
      { board: '05', frame: 'GL-01 Workspace Shell' },
      '<div class="xr-app" ref="{{ rootRef }}" style="min-height: 100vh; font-family: \'Public Sans\', system-ui, sans-serif"> <a class="xr-skip" href="#main">Skip to main content</a>',
      '<main class="xr-page" id="main">',
    );
  });

  it('board 12 names it as the first stop of the shell tab order', () => {
    expectBoardDraws(
      { board: '12', frame: 'Shell tab order' },
      '<li><strong>Skip to main content</strong> — first stop, visible when focused (2.4.1).</li>',
    );
  });

  it('targets another id when the shell names one', () => {
    const { container } = render(<SkipLink targetId="task" />);
    expect(container.innerHTML).toBe('<a class="xr-skip" href="#task">Skip to main content</a>');
  });

  it('emits only stylesheet classes (never the canvas `is-shown` / `is-focus`)', () => {
    const { container } = render(<Shell />);
    expectStylesheetClassesOnly(container.firstElementChild!);
    expect(screen.getByRole('link')).toHaveClass('xr-skip', { exact: true });
  });
});

describe('SkipLink behaviour', () => {
  it('activating it moves focus into main', () => {
    render(<Shell />);
    const skip = screen.getByRole('link', { name: 'Skip to main content' });
    skip.focus();
    const notPrevented = fireEvent.click(skip);
    expect(notPrevented).toBe(false);
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('leaves fragment navigation to the browser when main cannot take focus', () => {
    render(<Shell focusableMain={false} />);
    const skip = screen.getByRole('link', { name: 'Skip to main content' });
    skip.focus();
    expect(fireEvent.click(skip)).toBe(true);
    expect(skip).toHaveFocus();
  });

  it('is rendered through the injected link component', () => {
    const seen: string[] = [];
    function RouterLink({ href, ...rest }: LinkRenderProps) {
      seen.push(href);
      return <a data-router="" href={href} {...rest} />;
    }
    render(
      <LinkProvider component={RouterLink}>
        <Shell />
      </LinkProvider>,
    );
    expect(seen).toEqual(['#main']);
    const skip = screen.getByRole('link', { name: 'Skip to main content' });
    expect(skip).toHaveAttribute('data-router');
    fireEvent.click(skip);
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('is the first focusable element of the shell', () => {
    const { container } = render(<Shell />);
    const first = container.querySelector('a[href], button, input, select, textarea');
    expect(first).toBe(screen.getByRole('link', { name: 'Skip to main content' }));
  });

  it('axe (WCAG 2.2 AA)', async () => {
    const { container } = render(<Shell />);
    await assertNoAxeViolations(container);
  });
});
