/**
 * Avatar · CountBadge — markup contract and accessibility (Appendix E §3.1 Avatar · CountBadge:
 * `xr-avatar`, `xr-count`, `xr-tab-count`; `xp-sel-n` and `xd-gn` belong to later phases).
 * Sources: board 06 "Drawer · Student · 375 px" (avatar inside the named account button), B1-10
 * "SA-02 Requests · 1440 · interactive" (sidebar count with words), board 03 "Section tabs ·
 * sub-navigation inside “People”" (tab count) and B4-05 "Summary · draft" (a zero tab count).
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  assertNoAxeViolations,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
  type BoardSource,
} from '../testing/index.js';
import { Avatar, CountBadge, TabCount } from './avatar.js';
import { Icon } from './icon.js';

const DRAWER: BoardSource = { board: '06', frame: 'Drawer · Student · 375 px' };
const REQUESTS: BoardSource = { board: 'B1-10', frame: 'SA-02 Requests · 1440 · interactive' };
const SECTION_TABS: BoardSource = {
  board: '03',
  frame: 'Section tabs · sub-navigation inside “People”',
};

function AccountButton() {
  return (
    <button type="button" className="xr-acct-btn" aria-label="Account menu: Rahul Verma, Student">
      <Avatar initials="RV" />
    </button>
  );
}

function RequestsDestination() {
  return (
    <li>
      <a href="B1-10-SA-Requests.dc.html" aria-current="page">
        <Icon name="requests" />
        <span className="xr-nav-text">Requests</span>
        <span className="xr-tip">Requests</span>
        <CountBadge count={3} label="3 requests under review" />
      </a>
    </li>
  );
}

describe('Avatar · CountBadge markup contract', () => {
  it('the avatar inside the named account button, exactly as board 06 draws it', () => {
    const { container } = render(<AccountButton />);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      DRAWER,
      '<button type="button" class="xr-acct-btn" aria-label="Account menu: Rahul Verma, Student"><span class="xr-avatar" aria-hidden="true">RV</span></button>',
    );
  });

  it('the sidebar count with its words, exactly as B1-10 draws the Requests destination', () => {
    const { container } = render(
      <ul>
        <RequestsDestination />
      </ul>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!.firstElementChild!,
      REQUESTS,
      '<li><a href="B1-10-SA-Requests.dc.html" aria-current="page"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13.5 6.5 5h11l2.5 8.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 13.5h4.5l1.5 2.5h4l1.5-2.5H20"></path></svg><span class="xr-nav-text">Requests</span><span class="xr-tip">Requests</span><span class="xr-count"><span aria-hidden="true">3</span><span class="xr-sr">, 3 requests under review</span></span></a></li>',
    );
  });

  it('the tab count, exactly as board 03 draws "Students 214"', () => {
    const { container } = render(
      <a className="xr-tab" href="#h-find" aria-current="page">
        Students <TabCount count={214} />
      </a>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      SECTION_TABS,
      '<a class="xr-tab" href="#h-find" aria-current="page">Students <span class="xr-tab-count">214</span></a>',
    );
  });

  it('zero is drawn as 0 in a tab (B4-05 "Questions 0")', () => {
    const { container } = render(
      <a className="xr-tab" href="B4-05-Assessment-Summary-and-Questions.dc.html">
        Questions
        <TabCount count={0} />
      </a>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: 'B4-05', frame: 'Summary · draft' },
      '<a class="xr-tab" href="B4-05-Assessment-Summary-and-Questions.dc.html">Questions<span class="xr-tab-count">0</span></a>',
    );
  });

  it('emits only stylesheet classes', () => {
    const { container } = render(
      <div>
        <AccountButton />
        <ul>
          <RequestsDestination />
        </ul>
        <TabCount count={9} />
      </div>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });
});

describe('Avatar · CountBadge accessibility', () => {
  it('the avatar is hidden; the button is named by its label', () => {
    render(<AccountButton />);
    expect(screen.getByRole('button')).toHaveAccessibleName('Account menu: Rahul Verma, Student');
    expect(screen.getByText('RV')).toHaveAttribute('aria-hidden', 'true');
  });

  it('a counted destination is read with the count in words, not the bare figure', () => {
    render(
      <ul>
        <li>
          <a href="#marking">
            <Icon name="marking" />
            <span className="xr-nav-text">Marking</span>
            <CountBadge count={12} label="12 written answers to mark" />
          </a>
        </li>
      </ul>,
    );
    expect(screen.getByRole('link')).toHaveAccessibleName('Marking, 12 written answers to mark');
    expect(screen.getByText('12')).toHaveAttribute('aria-hidden', 'true');
  });

  it.each([
    ['avatar in a named button', <AccountButton key="a" />],
    [
      'count in a destination',
      <ul key="c">
        <RequestsDestination />
      </ul>,
    ],
    [
      'tab count in section tabs',
      <nav key="t" className="xr-tabs" aria-label="People sections">
        <a className="xr-tab" href="#students" aria-current="page">
          Students <TabCount count={214} />
        </a>
        <a className="xr-tab" href="#faculty">
          Faculty <TabCount count={9} />
        </a>
      </nav>,
    ],
  ])('axe: %s', async (_state, element) => {
    const { container } = render(element);
    await assertNoAxeViolations(container);
  });
});
