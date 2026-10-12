/**
 * PageHeader — markup contract, behaviour and accessibility (Appendix E §3.1 PageHeader; Appendix
 * F WP-0.6 acceptance 2–4). Sources: board 05 "GL-01 Workspace Shell" (Help & support header,
 * drawn statically), board 03 "Breadcrumbs, back link and page header" (back link, status in
 * words, ID, ≤ 1 primary), board 11 "1440 · Institute Admin · People › Students" and
 * "1024 · Super Admin · Request decision", B2-06 "IA-07 Student record · Rahul Verma · before
 * access" (overline with ID) and B5-03 "VE-03 Create experiment · step 1 · 1440 · interactive ·
 * 10 Aug 2026" (H1 focus target). Full-width actions below 600 px of app width are CSS: proven
 * in the browser (apps/specimens e2e/components-foundation-structure.spec.ts).
 */
import { act, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
  normaliseMarkup,
  type BoardSource,
} from '../testing/index.js';
import { Icon } from './icon.js';
import { IdChip } from './id-chip.js';
import { PageHeader } from './page-header.js';

const SHELL: BoardSource = { board: '05', frame: 'GL-01 Workspace Shell' };
const NAV: BoardSource = { board: '03', frame: 'Breadcrumbs, back link and page header' };
const PEOPLE: BoardSource = { board: '11', frame: '1440 · Institute Admin · People › Students' };
const DECISION: BoardSource = { board: '11', frame: '1024 · Super Admin · Request decision' };
const STUDENT: BoardSource = {
  board: 'B2-06',
  frame: 'IA-07 Student record · Rahul Verma · before access',
};

/** Board 03's record header, built from the component (status and actions are caller content). */
function RahulVerma() {
  return (
    <PageHeader
      back={
        <a className="xr-back" href="#h-nav">
          <Icon name="back" />
          Students
        </a>
      }
      title="Rahul Verma"
      meta={
        <>
          <span className="xr-status xr-status--ok">
            <Icon name="done" />
            Account active
          </span>
          <span>Student · Godavari Institute of Technology</span>
          <IdChip>GIT-2026-0418</IdChip>
        </>
      }
      actions={
        <>
          <button type="button" className="xr-btn xr-btn--secondary">
            Edit details
          </button>
          <button type="button" className="xr-btn xr-btn--primary">
            Give access
          </button>
        </>
      }
    />
  );
}

describe('PageHeader markup contract', () => {
  it('title, lead and one primary render exactly as board 05 draws "Help & support"', () => {
    const { container } = render(
      <PageHeader
        title="Help & support"
        lead="Something isn’t working? Report it here and follow what happens to your report."
        actions={
          <a className="xr-btn xr-btn--primary" href="#report">
            Report a problem
          </a>
        }
      />,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      SHELL,
      `<div class="xr-phead">
        <div class="xr-phead-main">
          <h1 class="xr-h1">Help &amp; support</h1>
          <p class="xr-lead">Something isn’t working? Report it here and follow what happens to your report.</p>
        </div>
        <div class="xr-phead-actions"><a class="xr-btn xr-btn--primary" href="#report">Report a problem</a></div>
      </div>`,
    );
  });

  it('the page question in meta type (`p.xr-meta`; board 11 "People")', () => {
    const drawn =
      '<div class="xr-phead-main"><h1 class="xr-h1">People</h1><p class="xr-meta">Who is in our institution?</p></div><div class="xr-phead-actions"><a class="xr-btn xr-btn--primary" href="#proof">Add person</a></div>';
    expectBoardDraws(PEOPLE, drawn);
    const { container } = render(
      <PageHeader
        title="People"
        summary="Who is in our institution?"
        actions={
          <a className="xr-btn xr-btn--primary" href="#proof">
            Add person
          </a>
        }
      />,
    );
    expect(container.firstElementChild!.className).toBe('xr-phead');
    expect(normaliseMarkup(container.firstElementChild!.innerHTML)).toBe(normaliseMarkup(drawn));
  });

  it('back link before the header, status in words, ID and actions as board 03 draws them', () => {
    expectBoardDraws(
      NAV,
      '<a class="xr-back" href="#h-nav" style="margin-bottom: 8px"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6 8.5 12l6 6"></path></svg>Students</a> <div class="xr-phead" style="margin-bottom: 0">',
    );
    const meta =
      '<div class="xr-phead-meta"><span class="xr-status xr-status--ok"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>Account active</span><span>Student · Godavari Institute of Technology</span><span class="xr-id">GIT-2026-0418</span></div>';
    const actions =
      '<div class="xr-phead-actions"><button type="button" class="xr-btn xr-btn--secondary">Edit details</button><button type="button" class="xr-btn xr-btn--primary">Give access</button></div>';
    expectBoardDraws(NAV, meta, actions);
    const { container } = render(<RahulVerma />);
    const [back, header] = [...container.children];
    expect(normaliseMarkup(back!.outerHTML)).toBe(
      '<a class="xr-back" href="#h-nav"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6 8.5 12l6 6"></svg>Students</a>',
    );
    // Board 03 demotes the title to h3 inside its documentation card; the product draws one H1
    // (boards 05, 11; B2-06) — a documented board variance, the product boards win.
    expect(normaliseMarkup(header!.outerHTML)).toBe(
      normaliseMarkup(
        `<div class="xr-phead"><div class="xr-phead-main"><h1 class="xr-h1">Rahul Verma</h1>${meta}</div>${actions}</div>`,
      ),
    );
  });

  it('the record ID above the title (board 11 request decision)', () => {
    const drawn =
      '<span class="xr-id">REQ-0042</span> <h1 class="xr-h1">Godavari Institute of Technology</h1> <div class="xr-phead-meta"><span class="xr-status xr-status--info"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h11l-3-3M17 17H6l3 3"></path></svg>Under review</span><span>Submitted 2 Oct · 2 experiments</span></div>';
    expectBoardDraws(DECISION, `<div class="xr-phead"> <div class="xr-phead-main"> ${drawn}`);
    const { container } = render(
      <PageHeader
        recordId="REQ-0042"
        title="Godavari Institute of Technology"
        meta={
          <>
            <span className="xr-status xr-status--info">
              <Icon name="withAnotherRole" />
              Under review
            </span>
            <span>Submitted 2 Oct · 2 experiments</span>
          </>
        }
      />,
    );
    expect(normaliseMarkup(container.innerHTML)).toBe(
      normaliseMarkup(`<div class="xr-phead"><div class="xr-phead-main">${drawn}</div></div>`),
    );
  });

  it('an overline that holds the ID (B2-06 student record)', () => {
    const drawn =
      '<div class="xr-phead-main"><span class="xr-overline">Student · <span class="xr-id">GIT-2026-0418</span></span><h1 class="xr-h1">Rahul Verma</h1><div class="xr-phead-meta"><span class="xr-status xr-status--ok"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>Account active</span><span>rahul.verma@godavari.edu.in</span></div></div><div class="xr-phead-actions"><a class="xr-btn xr-btn--primary" href="B2-05-Give-Students-Access.dc.html">Give this student access</a></div>';
    expectBoardDraws(STUDENT, drawn);
    const { container } = render(
      <PageHeader
        overline={
          <>
            Student · <IdChip>GIT-2026-0418</IdChip>
          </>
        }
        title="Rahul Verma"
        meta={
          <>
            <span className="xr-status xr-status--ok">
              <Icon name="done" />
              Account active
            </span>
            <span>rahul.verma@godavari.edu.in</span>
          </>
        }
        actions={
          <a className="xr-btn xr-btn--primary" href="B2-05-Give-Students-Access.dc.html">
            Give this student access
          </a>
        }
      />,
    );
    expect(normaliseMarkup(container.firstElementChild!.innerHTML)).toBe(normaliseMarkup(drawn));
  });

  it('the H1 as a focus target: `h1.xr-h1#…[tabindex="-1"]` (B5-03)', () => {
    const drawn = '<h1 class="xr-h1" id="Cn-h" tabindex="-1">{{ n.title }}</h1>';
    expectBoardDraws(
      {
        board: 'B5-03',
        frame: 'VE-03 Create experiment · step 1 · 1440 · interactive · 10 Aug 2026',
      },
      drawn,
    );
    render(<PageHeader title="Create experiment" titleId="Cn-h" titleFocusTarget />);
    expect(normaliseMarkup(screen.getByRole('heading', { level: 1 }).outerHTML)).toBe(
      drawn.replace('{{ n.title }}', 'Create experiment'),
    );
  });

  it('draws no empty parts and keeps composition classes on `xr-phead`', () => {
    const { container } = render(<PageHeader title="Overview" className="xw-actions" />);
    expect(container.innerHTML).toBe(
      '<div class="xr-phead xw-actions"><div class="xr-phead-main"><h1 class="xr-h1">Overview</h1></div></div>',
    );
  });

  it('slots given as null, false or "" draw no empty wrapper (conditional caller content)', () => {
    const { container } = render(
      <PageHeader
        overline={null}
        recordId=""
        title="People"
        lead={false}
        summary=""
        meta={null}
        actions={false}
      />,
    );
    expect(container.innerHTML).toBe(
      '<div class="xr-phead"><div class="xr-phead-main"><h1 class="xr-h1">People</h1></div></div>',
    );
  });

  it('emits only stylesheet classes', () => {
    const { container } = render(
      <div>
        <RahulVerma />
        <PageHeader overline="Institute Admin" recordId="ACC-0107" title="Access plan" />
      </div>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });
});

describe('PageHeader behaviour', () => {
  it('one H1; the back link names its destination', () => {
    render(<RahulVerma />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Students' })).toHaveAttribute('href', '#h-nav');
  });

  it('focus can move to the H1 after an action through titleRef', () => {
    const ref = createRef<HTMLHeadingElement>();
    render(<PageHeader title="Check and submit" titleFocusTarget titleRef={ref} />);
    const heading = screen.getByRole('heading', { level: 1, name: 'Check and submit' });
    expect(heading).toHaveAttribute('tabindex', '-1');
    act(() => ref.current!.focus());
    expect(heading).toHaveFocus();
  });

  it('an H1 that is not a focus target is not focusable', () => {
    render(<PageHeader title="People" />);
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveAttribute('tabindex');
  });
});

describe('PageHeader accessibility (axe, WCAG 2.2 AA)', () => {
  it.each([
    ['record header with back link and actions', <RahulVerma key="r" />],
    [
      'lead and one primary',
      <PageHeader
        key="h"
        title="Help & support"
        lead="Something isn’t working? Report it here and follow what happens to your report."
        actions={
          <a className="xr-btn xr-btn--primary" href="#report">
            Report a problem
          </a>
        }
      />,
    ],
    [
      'overline, ID and focus-target H1',
      <PageHeader
        key="o"
        overline="Northline Simulation Studio"
        recordId="SUB-0077"
        title="Conduction Through a Composite Wall"
        titleFocusTarget
      />,
    ],
  ])('%s', async (_state, element) => {
    const { container } = render(element);
    await assertNoAxeViolations(container);
  });
});
