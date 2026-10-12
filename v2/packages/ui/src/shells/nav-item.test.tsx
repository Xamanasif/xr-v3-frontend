/**
 * NavItem — markup contract, behaviour and accessibility (Appendix E §3.5 "Sidebar + NavItem",
 * §4.2; Appendix F WP-0.6 acceptance 2–4). Sources: B1-10 "SA-02 Requests · 1440 · interactive"
 * (a plain destination, and the current one with its count in words, drawn statically); board 05
 * "05 · GL-01 Workspace Shell" (the nav-item template: icon, text, rail tooltip, count); board 06
 * "Navigation rules" (current: gold rule, fill, bold and aria-current, never colour alone; counts
 * announced in words).
 *
 * jsdom loads no stylesheet: the tooltip's display, the gold rule and the accessible name as a
 * browser computes it (the tip is `display:none` outside the rail) are proven in the browser
 * (apps/specimens e2e/components-shells.spec.ts).
 */
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { LinkProvider, type LinkRenderProps } from '../link.js';
import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
  normaliseMarkup,
  type BoardSource,
} from '../testing/index.js';
import { NavItem, type NavDestination } from './nav-item.js';

const REQUESTS: BoardSource = { board: 'B1-10', frame: 'SA-02 Requests · 1440 · interactive' };
const SHELL: BoardSource = { board: '05', frame: '05 · GL-01 Workspace Shell' };
const RULES: BoardSource = { board: '06', frame: 'Navigation rules' };

const OVERVIEW: NavDestination = {
  label: 'Overview',
  href: 'B7-01-SA-Overview.dc.html',
  icon: 'overview',
};
const SA_REQUESTS: NavDestination = {
  label: 'Requests',
  href: 'B1-10-SA-Requests.dc.html',
  icon: 'requests',
  current: true,
  count: { value: 3, label: '3 requests under review' },
};

function InList({ children }: { readonly children: ReactNode }) {
  return <ul className="xr-nav">{children}</ul>;
}

function item(destination: NavDestination): Element {
  const { container } = render(
    <InList>
      <NavItem {...destination} />
    </InList>,
  );
  return container.querySelector('ul.xr-nav > li')!;
}

/**
 * The board 05 nav-item template with the canvas wiring (`onClick`) removed and its values filled
 * in: an unset attribute value drops the attribute; `sc-if` keeps its content only when shown.
 */
function fromTemplate(
  template: string,
  values: Readonly<Record<string, string | undefined>>,
  shown: Readonly<Record<string, boolean>>,
): string {
  expectBoardDraws(SHELL, template);
  return normaliseMarkup(template)
    .replace(/ (?:ref|onClick|onKeyDown|style)="[^"]*"/g, '')
    .replace(
      /<sc-if value="\{\{ ([^}]+) \}\}"[^>]*>(.*?)<\/sc-if>/g,
      (_m, key: string, body: string) => (shown[key.trim()] ? body : ''),
    )
    .replace(/ ([\w-]+)="\{\{ ([^}]+) \}\}"/g, (_m, name: string, key: string) => {
      const value = values[key.trim()];
      return value === undefined ? '' : ` ${name}="${value}"`;
    })
    .replace(/\{\{ ([^}]+) \}\}/g, (_m, key: string) => values[key.trim()] ?? `<missing ${key}>`);
}

const NAV_TEMPLATE =
  '<li><a href="{{ n.href }}" aria-current="{{ n.current }}" onClick="{{ n.go }}"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="{{ n.d }}"></path></svg><span class="xr-nav-text">{{ n.label }}</span><span class="xr-tip">{{ n.label }}</span><sc-if value="{{ n.hasCount }}" hint-placeholder-val="{{ false }}"><span class="xr-count"><span aria-hidden="true">{{ n.count }}</span><span class="xr-sr">, {{ n.countText }}</span></span></sc-if></a></li>';

describe('NavItem markup contract', () => {
  it('a destination renders exactly as B1-10 draws it', () => {
    expectRenderedAsDrawn(
      item(OVERVIEW),
      REQUESTS,
      '<li><a href="B7-01-SA-Overview.dc.html"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z"></path></svg><span class="xr-nav-text">Overview</span><span class="xr-tip">Overview</span></a></li>',
    );
  });

  it('the current destination with its count in words renders exactly as B1-10 draws it', () => {
    expectRenderedAsDrawn(
      item(SA_REQUESTS),
      REQUESTS,
      '<li><a href="B1-10-SA-Requests.dc.html" aria-current="page"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13.5 6.5 5h11l2.5 8.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 13.5h4.5l1.5 2.5h4l1.5-2.5H20"></path></svg><span class="xr-nav-text">Requests</span><span class="xr-tip">Requests</span><span class="xr-count"><span aria-hidden="true">3</span><span class="xr-sr">, 3 requests under review</span></span></a></li>',
    );
  });

  it('fills the board 05 template exactly (Faculty "Marking" with its count; a destination without)', () => {
    const marking = item({
      label: 'Marking',
      href: '#marking',
      icon: 'marking',
      current: true,
      count: { value: '12', label: '12 written answers to mark' },
    });
    expect(normaliseMarkup(marking.outerHTML)).toBe(
      fromTemplate(
        NAV_TEMPLATE,
        {
          'n.href': '#marking',
          'n.current': 'page',
          'n.d': 'M14.5 5.5l4 4L8 20H4v-4zM12.5 7.5l4 4',
          'n.label': 'Marking',
          'n.count': '12',
          'n.countText': '12 written answers to mark',
        },
        { 'n.hasCount': true },
      ),
    );
  });

  it('fills the board 05 template exactly for a destination that is not current and has no count', () => {
    const usage = item({ label: 'Usage', href: '#usage', icon: 'usage' });
    expect(normaliseMarkup(usage.outerHTML)).toBe(
      fromTemplate(
        NAV_TEMPLATE,
        { 'n.href': '#usage', 'n.d': 'M3 12h4l3-7 4 14 3-7h4', 'n.label': 'Usage' },
        { 'n.hasCount': false },
      ),
    );
  });

  it('emits only stylesheet classes', () => {
    expectStylesheetClassesOnly(item(SA_REQUESTS));
    expectStylesheetClassesOnly(item(OVERVIEW));
  });
});

describe('NavItem behaviour', () => {
  it('marks the current destination with aria-current="page" only (board 06 "Navigation rules")', () => {
    expectBoardDraws(
      RULES,
      '<li>Current item: gold rule, light fill, bold, aria-current — never colour alone.</li>',
      '<li>Counts only when they open the list they count; announced in words.</li>',
    );
    render(
      <InList>
        <NavItem {...OVERVIEW} />
        <NavItem {...SA_REQUESTS} />
      </InList>,
    );
    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.getAttribute('aria-current'))).toEqual([null, 'page']);
  });

  it('the count is read in words: the figure is hidden, the words are in `xr-sr`', () => {
    const li = item(SA_REQUESTS);
    expect(li.querySelector('.xr-count > [aria-hidden="true"]')).toHaveTextContent('3');
    expect(li.querySelector('.xr-count > .xr-sr')).toHaveTextContent(', 3 requests under review');
  });

  it('the tooltip repeats the destination name (it is the name in the rail)', () => {
    const li = item(OVERVIEW);
    expect(li.querySelector('.xr-tip')).toHaveTextContent('Overview');
    expect(li.querySelector('.xr-tip')).not.toHaveAttribute('role');
    expect(li.querySelector('.xr-tip')).not.toHaveAttribute('aria-hidden');
  });

  it('is rendered through the injected link component', () => {
    const seen: string[] = [];
    function RouterLink({ href, ...rest }: LinkRenderProps) {
      seen.push(href);
      return <a data-router="" href={href} {...rest} />;
    }
    render(
      <LinkProvider component={RouterLink}>
        <InList>
          <NavItem {...SA_REQUESTS} />
        </InList>
      </LinkProvider>,
    );
    expect(seen).toEqual(['B1-10-SA-Requests.dc.html']);
    expect(screen.getByRole('link')).toHaveAttribute('data-router');
    expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'page');
  });
});

describe('NavItem accessibility (axe, WCAG 2.2 AA)', () => {
  it.each([
    ['plain', OVERVIEW],
    ['current with a count', SA_REQUESTS],
  ] as const)('%s', async (_name, destination) => {
    const { container } = render(
      <nav aria-label="Super Admin navigation">
        <InList>
          <NavItem {...destination} />
        </InList>
      </nav>,
    );
    await assertNoAxeViolations(container);
  });
});
