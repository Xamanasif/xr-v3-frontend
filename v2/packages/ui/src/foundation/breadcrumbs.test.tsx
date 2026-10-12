/**
 * Breadcrumbs — markup contract, behaviour and accessibility (Appendix E §3.1 Breadcrumbs, the
 * workspace `xr-crumbs`; `xp-crumbs` is Phase 1 under G-8). Sources: B2-05 "IA-05 Give students
 * access · 1440 · interactive · start here" (the top-bar trail, drawn statically), B2-08 "IA-14
 * Group · ME ZG523 — Sem II · 1440 · interactive" (three levels), board 03 "Top-bar breadcrumbs",
 * board 05 "GL-01 Workspace Shell" and B1-10 "SA-02 Requests · 1440 · interactive" (current page
 * only). Visibility from 1024 px of app width is the sheet's: proven in the browser.
 */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LinkProvider, type LinkRenderProps } from '../link.js';
import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
} from '../testing/index.js';
import { Breadcrumbs } from './breadcrumbs.js';

const GIVE_ACCESS = {
  board: 'B2-05',
  frame: 'IA-05 Give students access · 1440 · interactive · start here',
};

describe('Breadcrumbs markup contract', () => {
  it('one level and the current page render exactly as B2-05 draws them', () => {
    const { container } = render(
      <Breadcrumbs
        trail={[{ label: 'Student access', href: 'B2-04-Student-Access.dc.html' }]}
        current="Give students access"
      />,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      GIVE_ACCESS,
      '<ol class="xr-crumbs" aria-label="You are here"><li><a href="B2-04-Student-Access.dc.html">Student access</a><span class="xr-crumb-sep" aria-hidden="true">/</span></li><li><span aria-current="page">Give students access</span></li></ol>',
    );
  });

  it('two levels (B2-08 "People / Groups / ME ZG523 — Sem II")', () => {
    const { container } = render(
      <Breadcrumbs
        trail={[
          { label: 'People', href: 'B2-06-People.dc.html' },
          { label: 'Groups', href: 'B2-08-Groups.dc.html' },
        ]}
        current="ME ZG523 — Sem II"
      />,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: 'B2-08', frame: 'IA-14 Group · ME ZG523 — Sem II · 1440 · interactive' },
      '<ol class="xr-crumbs" aria-label="You are here"><li><a href="B2-06-People.dc.html">People</a><span class="xr-crumb-sep" aria-hidden="true">/</span></li><li><a href="B2-08-Groups.dc.html">Groups</a><span class="xr-crumb-sep" aria-hidden="true">/</span></li><li><span aria-current="page">ME ZG523 — Sem II</span></li></ol>',
    );
  });

  it('the current page alone (board 05 top bar, B1-10)', () => {
    expectBoardDraws(
      { board: '05', frame: 'GL-01 Workspace Shell' },
      '<ol class="xr-crumbs" aria-label="You are here"> <li><span aria-current="page">{{ pageTitle }}</span></li> </ol>',
    );
    const { container } = render(<Breadcrumbs trail={[]} current="Requests" />);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: 'B1-10', frame: 'SA-02 Requests · 1440 · interactive' },
      '<ol class="xr-crumbs" aria-label="You are here"><li><span aria-current="page">Requests</span></li></ol>',
    );
  });

  it('board 03 draws the same items (its doc card omits the label and sets display inline)', () => {
    expectBoardDraws(
      { board: '03', frame: 'Top-bar breadcrumbs' },
      '<li><a href="#h-nav">People</a><span class="xr-crumb-sep" aria-hidden="true">/</span></li>',
      '<li><span aria-current="page">Rahul Verma</span></li>',
    );
  });

  it('emits only stylesheet classes', () => {
    const { container } = render(
      <Breadcrumbs trail={[{ label: 'People', href: '/people' }]} current="Rahul Verma" />,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });
});

describe('Breadcrumbs behaviour', () => {
  it('is a list labelled "You are here"; ancestors are links, the current page is not', () => {
    render(
      <Breadcrumbs
        trail={[
          { label: 'People', href: '/people' },
          { label: 'Students', href: '/people/students' },
        ]}
        current="Rahul Verma"
      />,
    );
    const list = screen.getByRole('list', { name: 'You are here' });
    const links = within(list).getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['People', '/people'],
      ['Students', '/people/students'],
    ]);
    const current = within(list).getByText('Rahul Verma');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.closest('a')).toBeNull();
    // The separators are hidden from screen readers.
    for (const separator of list.querySelectorAll('.xr-crumb-sep')) {
      expect(separator).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('renders every ancestor through the injected link component', () => {
    const seen: string[] = [];
    function RouterLink({ href, ...rest }: LinkRenderProps) {
      seen.push(href);
      return <a data-router="" href={href} {...rest} />;
    }
    render(
      <LinkProvider component={RouterLink}>
        <Breadcrumbs
          trail={[
            { label: 'People', href: '/people' },
            { label: 'Groups', href: '/people/groups' },
          ]}
          current="ME ZG523 — Sem II"
        />
      </LinkProvider>,
    );
    expect(seen).toEqual(['/people', '/people/groups']);
    expect(screen.getAllByRole('link').every((link) => link.hasAttribute('data-router'))).toBe(
      true,
    );
  });
});

describe('Breadcrumbs accessibility (axe, WCAG 2.2 AA)', () => {
  it.each([
    ['current page only', <Breadcrumbs key="c" trail={[]} current="Overview" />],
    [
      'two levels',
      <Breadcrumbs
        key="t"
        trail={[
          { label: 'My courses', href: '/courses' },
          { label: 'Shell-and-Tube Heat Exchanger', href: '/courses/x' },
        ]}
        current="Resources"
      />,
    ],
  ])('%s', async (_state, element) => {
    const { container } = render(element);
    await assertNoAxeViolations(container);
  });
});
