/**
 * Rows / AttentionList — markup contract, behaviour and accessibility (Appendix E §3.1 Rows /
 * AttentionList: `xr-rows`, `xr-row-*`, `a.xr-row-link`, `xr-row-icon--wait/err/ok/info`).
 * Sources: board 03 "List rows and attention items" (four attention items, drawn statically),
 * 09a "Overview / Home — “What needs my attention?”" (attention item, all clear) and "Decision
 * page — “Should I approve this?”" (`xr-row-end`, a leading format chip), board 05 "GL-01
 * Workspace Shell" (`a.xr-row.xr-row-link`), board 11 "1024 · Super Admin · Request decision"
 * (a row with a format set), B6-05 "CM-01 Overview · 1440 · 27 Aug 2026" (text action) and B4-03
 * "FA-05 Experiment · teaching view · 1440 · 7 Nov 2026" (primary action). Row actions dropping
 * under the text below 600 px is the sheet's: proven in the browser.
 */
import { render, screen, within } from '@testing-library/react';
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
import { FormatGlyph, Icon } from './icon.js';
import { AttentionItem, AttentionList, Row, RowEnd, RowLink, Rows } from './rows.js';

const LIST_ROWS: BoardSource = { board: '03', frame: 'List rows and attention items' };
const OVERVIEW: BoardSource = {
  board: '09a',
  frame: 'Overview / Home — “What needs my attention?”',
};
const SHELL: BoardSource = { board: '05', frame: 'GL-01 Workspace Shell' };

/** Board 03's four attention items. */
function BoardThreeItems() {
  return (
    <>
      <AttentionItem
        icon="attention"
        tone="wait"
        title="Shell-and-Tube Heat Exchanger hasn’t been given to any student"
        sub="ME ZG523 · in access plan ACC-0107"
        action={{ href: '#c-att', label: 'Give access' }}
      />
      <AttentionItem
        icon="studentAccess"
        title="12 students have no access yet"
        sub="Added on 4 Aug by import"
        action={{ href: '#c-att', label: 'Review students' }}
      />
      <AttentionItem
        icon="myDevice"
        tone="info"
        title="2 device requests to forward to BITS"
        sub="Oldest from 29 Sep"
        action={{ href: '#c-att', label: 'Open requests' }}
      />
      <AttentionItem
        icon="failed"
        tone="err"
        title="1 open problem report from your institution"
        sub="“VR simulation stopped loading” · 3 Oct"
        action={{ href: '#c-att', label: 'View report' }}
      />
    </>
  );
}

describe('Rows markup contract', () => {
  it('attention items render exactly as board 03 draws them (every tone)', () => {
    const { container } = render(
      <Rows>
        <BoardThreeItems />
      </Rows>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      LIST_ROWS,
      `<ul class="xr-rows">
        <li class="xr-row"><div class="xr-row-main"><span class="xr-row-icon xr-row-icon--wait"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 2.8 19.5h18.4zM12 10v4M12 17h.01"></path></svg></span><div class="xr-row-text"><span class="xr-row-title">Shell-and-Tube Heat Exchanger hasn’t been given to any student</span><span class="xr-row-sub">ME ZG523 · in access plan ACC-0107</span></div></div><a class="xr-btn xr-btn--secondary xr-btn--sm" href="#c-att">Give access</a></li>
        <li class="xr-row"><div class="xr-row-main"><span class="xr-row-icon"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3.5 20a6.5 6.5 0 0 1 10-5.5M18 14v6M15 17h6"></path></svg></span><div class="xr-row-text"><span class="xr-row-title">12 students have no access yet</span><span class="xr-row-sub">Added on 4 Aug by import</span></div></div><a class="xr-btn xr-btn--secondary xr-btn--sm" href="#c-att">Review students</a></li>
        <li class="xr-row"><div class="xr-row-main"><span class="xr-row-icon xr-row-icon--info"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2"></path></svg></span><div class="xr-row-text"><span class="xr-row-title">2 device requests to forward to BITS</span><span class="xr-row-sub">Oldest from 29 Sep</span></div></div><a class="xr-btn xr-btn--secondary xr-btn--sm" href="#c-att">Open requests</a></li>
        <li class="xr-row"><div class="xr-row-main"><span class="xr-row-icon xr-row-icon--err"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5v5.5M12 16.5h.01"></path></svg></span><div class="xr-row-text"><span class="xr-row-title">1 open problem report from your institution</span><span class="xr-row-sub">“VR simulation stopped loading” · 3 Oct</span></div></div><a class="xr-btn xr-btn--secondary xr-btn--sm" href="#c-att">View report</a></li>
      </ul>`,
    );
  });

  it('the waiting item of 09a AR-1 ("3 students are waiting for a licence")', () => {
    const { container } = render(
      <ul>
        <AttentionItem
          icon="waiting"
          tone="wait"
          title="3 students are waiting for a licence"
          sub="Forced Convection"
          action={{ href: '#h-ar1', label: 'View' }}
        />
      </ul>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!.firstElementChild!,
      OVERVIEW,
      '<li class="xr-row"><div class="xr-row-main"><span class="xr-row-icon xr-row-icon--wait"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3 2"></path></svg></span><div class="xr-row-text"><span class="xr-row-title">3 students are waiting for a licence</span><span class="xr-row-sub">Forced Convection</span></div></div><a class="xr-btn xr-btn--secondary xr-btn--sm" href="#h-ar1">View</a></li>',
    );
  });

  it('the ok tone and the text and primary action variants (B6-05, B4-03)', () => {
    expectBoardDraws(
      { board: 'B6-05', frame: 'CM-01 Overview · 1440 · 27 Aug 2026' },
      '</div></div><a class="xr-btn xr-btn--text xr-btn--sm" href="{{ a.href }}">Open</a></li>',
    );
    expectBoardDraws(
      { board: 'B4-03', frame: 'FA-05 Experiment · teaching view · 1440 · 7 Nov 2026' },
      '<span class="xr-row-icon xr-row-icon--ok">',
      '<a class="xr-btn xr-btn--primary xr-btn--sm" href="B4-05-Assessment-Summary-and-Questions.dc.html">Open assessment</a>',
    );
    const { container } = render(
      <ul>
        <AttentionItem
          icon="clock"
          tone="ok"
          title="Heat Exchanger — post-lab"
          action={{ href: '/assessments/9', label: 'Open', variant: 'text' }}
        />
        <AttentionItem
          icon="assessments"
          title="Heat Exchanger — post-lab"
          action={{ href: '/assessments/9', label: 'Open assessment', variant: 'primary' }}
        />
      </ul>,
    );
    const [text, primary] = container.querySelectorAll('a');
    expect(container.querySelector('.xr-row-icon')!.className).toBe('xr-row-icon xr-row-icon--ok');
    expect(text!.className).toBe('xr-btn xr-btn--text xr-btn--sm');
    expect(primary!.className).toBe('xr-btn xr-btn--primary xr-btn--sm');
  });

  it('a row that is one link renders exactly as board 05 draws "My reports"', () => {
    const { container } = render(
      <ul>
        <RowLink
          href="#r2"
          title="Lab brief link opened a blank page"
          sub={
            <>
              <span className="xr-id">SUP-0198</span> · sent 21 Sep · resolved 23 Sep
            </>
          }
          end={
            <span className="xr-status xr-status--ok">
              <Icon name="done" />
              Resolved
            </span>
          }
        />
      </ul>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!.firstElementChild!,
      SHELL,
      '<li><a class="xr-row xr-row-link" href="#r2"><div class="xr-row-main"><div class="xr-row-text"><span class="xr-row-title">Lab brief link opened a blank page</span><span class="xr-row-sub"><span class="xr-id">SUP-0198</span> · sent 21 Sep · resolved 23 Sep</span></div></div><span class="xr-status xr-status--ok"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>Resolved</span></a></li>',
    );
  });

  it('a plain row with end content (board 11 "What they asked for")', () => {
    const { container } = render(
      <ul>
        <Row title="Forced Convection" sub="ME ZG523 · 120 licences · 1 year">
          <span className="xr-fmt-set">
            <span className="xr-fmt">WEB</span>
          </span>
        </Row>
      </ul>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!.firstElementChild!,
      { board: '11', frame: '1024 · Super Admin · Request decision' },
      '<li class="xr-row"><div class="xr-row-main"><div class="xr-row-text"><span class="xr-row-title">Forced Convection</span><span class="xr-row-sub">ME ZG523 · 120 licences · 1 year</span></div></div><span class="xr-fmt-set"><span class="xr-fmt">WEB</span></span></li>',
    );
  });

  it('a leading chip and `xr-row-end` with status and link (09a AR-4)', () => {
    const { container } = render(
      <ul>
        <Row
          lead={
            <span className="xr-fmt">
              <FormatGlyph format="VR" />
              VR
            </span>
          }
          title="App package"
          sub="Device requirements clarified in revision 2"
        >
          <RowEnd>
            <span className="xr-status xr-status--wait">Changed</span>
            <a href="#h-ar4">View details</a>
          </RowEnd>
        </Row>
      </ul>,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!.firstElementChild!,
      { board: '09a', frame: 'Decision page — “Should I approve this?”' },
      '<li class="xr-row"><div class="xr-row-main"><span class="xr-fmt"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.75 5h12.5v6H10.25L8 9.1 5.75 11H1.75z"></path></svg>VR</span><div class="xr-row-text"><span class="xr-row-title">App package</span><span class="xr-row-sub">Device requirements clarified in revision 2</span></div></div><div class="xr-row-end"><span class="xr-status xr-status--wait">Changed</span><a href="#h-ar4">View details</a></div></li>',
    );
  });

  it('AttentionList: a titled section holding the rows (09a AR-1)', () => {
    expectBoardDraws(
      OVERVIEW,
      '<section class="xr-section" aria-labelledby="ar1-att"> <div class="xr-section-head"><h4 id="ar1-att" class="xr-h2">Needs your attention</h4><span class="xr-meta">5 items</span></div> <ul class="xr-rows">',
    );
    const { container } = render(
      <AttentionList
        title="Needs your attention"
        headingId="ar1-att"
        meta="4 items"
        allClear="Nothing needs you right now"
      >
        <BoardThreeItems />
      </AttentionList>,
    );
    // 09a demotes the H2 to h4 inside its documentation frame; the product draws h2 (board 05).
    expect(
      normaliseMarkup(container.innerHTML).startsWith(
        '<section class="xr-section" aria-labelledby="ar1-att"><div class="xr-section-head"><h2 id="ar1-att" class="xr-h2">Needs your attention</h2><span class="xr-meta">4 items</span></div><ul class="xr-rows"><li class="xr-row">',
      ),
    ).toBe(true);
    expect(container.querySelectorAll('li.xr-row')).toHaveLength(4);
  });

  it('AttentionList all clear: the caller’s words in the 09a empty state, no count', () => {
    expectBoardDraws(
      OVERVIEW,
      '<section class="xr-section" aria-labelledby="ar1-clear"> <div class="xr-section-head"><h4 id="ar1-clear" class="xr-h2">Needs your attention</h4></div> <div class="xr-empty" style="border-top: 1px solid #E1E4F3; padding: 24px"><span class="xr-empty-icon" style="background: #E8F4EC; color: #1D6B45"><svg class="xr-ico xr-ico--24" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span><p class="xr-h3">Nothing needs you right now</p><p class="xr-small" style="color: #40476B">New items appear here as they come in.</p></div>',
    );
    const { container } = render(
      <AttentionList
        title="Needs your attention"
        headingId="ar1-clear"
        meta="0 items"
        allClear="Nothing needs you right now"
        allClearNote="New items appear here as they come in."
      />,
    );
    // The board's inline tint, hairline and padding are not emitted (Appendix E §2.5): the
    // all-clear icon keeps the neutral `xr-empty-icon` colours (open issue, see the ledger).
    expect(normaliseMarkup(container.innerHTML)).toBe(
      normaliseMarkup(
        `<section class="xr-section" aria-labelledby="ar1-clear"><div class="xr-section-head"><h2 id="ar1-clear" class="xr-h2">Needs your attention</h2></div>
        <div class="xr-empty"><span class="xr-empty-icon"><svg class="xr-ico xr-ico--24" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span><p class="xr-h3">Nothing needs you right now</p><p class="xr-small">New items appear here as they come in.</p></div></section>`,
      ),
    );
  });

  it('a missing sub line and all-clear note draw nothing (null, false or "")', () => {
    const { container } = render(
      <>
        <Rows>
          <Row title="Forced Convection" sub={null} />
          <RowLink href="#r2" title="Lab brief link opened a blank page" sub="" />
        </Rows>
        <AttentionList
          title="Needs your attention"
          allClear="Nothing needs you right now"
          allClearNote={false}
        />
      </>,
    );
    expect(container.querySelectorAll('.xr-row-sub')).toHaveLength(0);
    expect(container.querySelector('.xr-empty')!.innerHTML).toBe(
      '<span class="xr-empty-icon"><svg class="xr-ico xr-ico--24" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span><p class="xr-h3">Nothing needs you right now</p>',
    );
  });

  it('emits only stylesheet classes', () => {
    const { container } = render(
      <div>
        <AttentionList title="Needs your attention" meta="4 items" allClear="Nothing needs you">
          <BoardThreeItems />
          <AttentionItem
            icon="done"
            tone="ok"
            title="Access given"
            action={{ href: '#', label: 'Open', variant: 'text' }}
          />
        </AttentionList>
        <AttentionList title="Needs your attention" allClear="Nothing needs you right now" />
        <Rows className="xw-actions">
          <RowLink href="#r1" title="VR simulation stopped loading at step 2" end={<span />} />
          <Row title="Forced Convection">
            <RowEnd />
          </Row>
        </Rows>
      </div>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });
});

describe('Rows behaviour', () => {
  it('every attention item opens something with exactly one action', () => {
    render(
      <Rows>
        <BoardThreeItems />
      </Rows>,
    );
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(items.map((item) => within(item).getAllByRole('link').length)).toEqual([1, 1, 1, 1]);
    expect(within(items[0]!).getByRole('link')).toHaveAccessibleName('Give access');
  });

  it('a row link is one link named by what the row says', () => {
    render(
      <Rows>
        <RowLink
          href="#r1"
          title="VR simulation stopped loading at step 2"
          sub="sent 3 Oct"
          end={<span className="xr-status xr-status--info">Open</span>}
        />
      </Rows>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '#r1');
    expect(link).toHaveAccessibleName(
      /^VR simulation stopped loading at step 2\s*sent 3 Oct\s*Open$/,
    );
  });

  it('actions and row links go through the injected link component', () => {
    const hrefs: string[] = [];
    function RouterLink({ href, ...rest }: LinkRenderProps) {
      hrefs.push(href);
      return <a data-router="" href={href} {...rest} />;
    }
    render(
      <LinkProvider component={RouterLink}>
        <Rows>
          <AttentionItem
            title="12 students have no access yet"
            action={{ href: '/students', label: 'Review students' }}
          />
          <RowLink href="/help/reports/SUP-0213" title="VR simulation stopped loading at step 2" />
        </Rows>
      </LinkProvider>,
    );
    expect(hrefs).toEqual(['/students', '/help/reports/SUP-0213']);
    expect(screen.getAllByRole('link').every((link) => link.hasAttribute('data-router'))).toBe(
      true,
    );
  });

  it('the row icon is decorative', () => {
    const { container } = render(
      <Rows>
        <AttentionItem
          icon="failed"
          tone="err"
          title="1 open problem report from your institution"
          action={{ href: '#', label: 'View report' }}
        />
      </Rows>,
    );
    expect(container.querySelector('.xr-row-icon svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('AttentionList switches between rows and the all-clear state, keeping its region', () => {
    const { rerender } = render(
      <AttentionList
        title="Needs your attention"
        meta="1 item"
        allClear="Nothing needs you right now"
      >
        <AttentionItem
          title="2 device requests to forward to BITS"
          action={{ href: '#', label: 'Open requests' }}
        />
      </AttentionList>,
    );
    const region = screen.getByRole('region', { name: 'Needs your attention' });
    expect(within(region).getByText('1 item')).toBeInTheDocument();
    rerender(
      <AttentionList
        title="Needs your attention"
        meta="1 item"
        allClear="Nothing needs you right now"
      >
        {[]}
        {false}
      </AttentionList>,
    );
    expect(screen.getByRole('region', { name: 'Needs your attention' })).toBe(region);
    expect(within(region).queryByRole('list')).toBeNull();
    expect(within(region).queryByText('1 item')).toBeNull();
    expect(within(region).getByText('Nothing needs you right now')).toHaveClass('xr-h3');
  });
});

describe('Rows accessibility (axe, WCAG 2.2 AA)', () => {
  it.each([
    [
      'attention list',
      <AttentionList
        key="a"
        title="Needs your attention"
        meta="4 items"
        allClear="Nothing needs you right now"
      >
        <BoardThreeItems />
      </AttentionList>,
    ],
    [
      'all clear',
      <AttentionList
        key="c"
        title="Needs your attention"
        allClear="Nothing needs you right now"
        allClearNote="New items appear here as they come in."
      />,
    ],
    [
      'row links',
      <Rows key="l">
        <RowLink
          href="#r1"
          title="VR simulation stopped loading at step 2"
          sub="sent 3 Oct"
          end={<span className="xr-status xr-status--info">Open</span>}
        />
        <RowLink href="#r2" title="Lab brief link opened a blank page" />
      </Rows>,
    ],
    [
      'plain rows with an end',
      <Rows key="p">
        <Row title="Forced Convection" sub="ME ZG523 · 120 licences · 1 year">
          <RowEnd>
            <span className="xr-status xr-status--wait">Changed</span>
            <a href="#h-ar4">View details</a>
          </RowEnd>
        </Row>
      </Rows>,
    ],
  ])('%s', async (_state, element) => {
    const { container } = render(element);
    await assertNoAxeViolations(container);
  });
});
