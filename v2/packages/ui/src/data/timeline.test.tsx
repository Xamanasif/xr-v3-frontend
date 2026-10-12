/**
 * Timeline / History — markup contract and accessibility (Appendix E §3.3 Timeline; Appendix F
 * WP-0.6 acceptance 2, 4). Sources: board 03 "Timeline · history last on a record" (labelled
 * `ol`, `p` lines, the filled latest dot, a note); B2-03 "After SACC-0310 · 9 Oct 2026" (the
 * product boards' `div` lines, the latest dot, an event without a note); B5-06 "VE-07 Experiment
 * record · SUB-0077 · 1440 · 27 Aug 2026" (a templated history drawn without a latest marker,
 * in a section named by its H2).
 *
 * Board variance, asserted below: the line element is `p` on boards 03, 07, 09a and B1 (100
 * instances) and `div` on the B2–B7 product boards (267); `lineElement` reproduces either, `div`
 * by default. Newest first is the caller's order: the component never sorts.
 */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
  normaliseMarkup,
  type BoardSource,
} from '../testing/index.js';
import { Timeline, type TimelineEvent } from './timeline.js';

const HISTORY: BoardSource = { board: '03', frame: 'Timeline · history last on a record' };
const GIVEN: BoardSource = { board: 'B2-03', frame: 'After SACC-0310 · 9 Oct 2026' };
const RECORD: BoardSource = {
  board: 'B5-06',
  frame: 'VE-07 Experiment record · SUB-0077 · 1440 · 27 Aug 2026',
};

const REVIEW: readonly TimelineEvent[] = [
  {
    id: 'approved',
    what: 'Approved by Academic Reviewer',
    when: '2 Sep · Prof. A. Menon · now with Content Manager',
  },
  { id: 'rev2', what: 'Submitted · revision 2', when: '26 Aug · Northline Simulation Studio' },
  {
    id: 'returned',
    what: 'Returned with a reason',
    when: '19 Aug · Prof. A. Menon',
    note: '“Please clarify the VR device requirements.”',
  },
  { id: 'submitted', what: 'Submitted', when: '12 Aug · Northline Simulation Studio' },
];

const ACCESS: readonly TimelineEvent[] = [
  {
    id: 'given',
    what: 'Rahul Verma given Shell-and-Tube Heat Exchanger',
    when: '9 Oct 2026, 10:20 · Meera Iyer',
    note: 'SACC-0310 · individually',
  },
  {
    id: 'activated',
    what: 'Access activated',
    when: '8 Oct 2026, 15:05',
    note: 'Payment confirmed for REQ-0042. Plan ACC-0107 created.',
  },
  {
    id: 'approved',
    what: 'Request approved · External',
    when: '8 Oct 2026, 11:20',
    note: 'Approved — payment required.',
  },
  { id: 'submitted', what: 'Request submitted', when: '2 Oct 2026, 10:14 · Meera Iyer' },
];

describe('Timeline markup contract', () => {
  it('board 03: a labelled ol, newest first, the latest dot filled, p lines and a note', () => {
    const { container } = render(
      <Timeline events={REVIEW} label="Submission and review history" lineElement="p" />,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      HISTORY,
      `<ol class="xr-timeline" aria-label="Submission and review history">
            <li class="xr-tl is-latest"><span class="xr-tl-dot" aria-hidden="true"></span><div><p class="xr-tl-what">Approved by Academic Reviewer</p><p class="xr-tl-when">2 Sep · Prof. A. Menon · now with Content Manager</p></div></li>
            <li class="xr-tl"><span class="xr-tl-dot" aria-hidden="true"></span><div><p class="xr-tl-what">Submitted · revision 2</p><p class="xr-tl-when">26 Aug · Northline Simulation Studio</p></div></li>
            <li class="xr-tl"><span class="xr-tl-dot" aria-hidden="true"></span><div><p class="xr-tl-what">Returned with a reason</p><p class="xr-tl-when">19 Aug · Prof. A. Menon</p><p class="xr-tl-note">“Please clarify the VR device requirements.”</p></div></li>
            <li class="xr-tl"><span class="xr-tl-dot" aria-hidden="true"></span><div><p class="xr-tl-what">Submitted</p><p class="xr-tl-when">12 Aug · Northline Simulation Studio</p></div></li>
          </ol>`,
    );
  });

  it('B2-03: the product boards’ div lines; an event without a note draws no note line', () => {
    const { container } = render(<Timeline events={ACCESS} />);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      GIVEN,
      '<ol class="xr-timeline"><li class="xr-tl is-latest"><span class="xr-tl-dot" aria-hidden="true"></span><div><div class="xr-tl-what">Rahul Verma given Shell-and-Tube Heat Exchanger</div><div class="xr-tl-when">9 Oct 2026, 10:20 · Meera Iyer</div><div class="xr-tl-note">SACC-0310 · individually</div></div></li><li class="xr-tl"><span class="xr-tl-dot" aria-hidden="true"></span><div><div class="xr-tl-what">Access activated</div><div class="xr-tl-when">8 Oct 2026, 15:05</div><div class="xr-tl-note">Payment confirmed for REQ-0042. Plan ACC-0107 created.</div></div></li><li class="xr-tl"><span class="xr-tl-dot" aria-hidden="true"></span><div><div class="xr-tl-what">Request approved · External</div><div class="xr-tl-when">8 Oct 2026, 11:20</div><div class="xr-tl-note">Approved — payment required.</div></div></li><li class="xr-tl"><span class="xr-tl-dot" aria-hidden="true"></span><div><div class="xr-tl-what">Request submitted</div><div class="xr-tl-when">2 Oct 2026, 10:14 · Meera Iyer</div></div></li></ol>',
    );
  });

  it('B5-06: a templated history without a latest marker, named by its section’s H2', () => {
    const item =
      '<li class="xr-tl"><span class="xr-tl-dot" aria-hidden="true"></span><div><div class="xr-tl-what">{{ x.what }}</div><div class="xr-tl-when">{{ x.when }}</div><div class="xr-tl-note">{{ x.note }}</div></div></li>';
    expectBoardDraws(
      RECORD,
      `<h2 id="Rm-hh" class="xr-h2">Submission and version history</h2><span class="xr-meta">Newest first · not an audit log</span></div><div class="xr-section-body"><ol class="xr-timeline"><sc-for list="{{ m.hist }}" as="x" hint-placeholder-count="3">${item}</sc-for></ol>`,
    );
    const events = REVIEW.map((event) => ({ ...event, note: event.note ?? 'Note' }));
    const { container } = render(
      <Timeline events={events} markLatest={false} labelledBy="Rm-hh" />,
    );
    const expected = events
      .map((event) =>
        item
          .replace('{{ x.what }}', String(event.what))
          .replace('{{ x.when }}', String(event.when))
          .replace('{{ x.note }}', String(event.note)),
      )
      .join('');
    expect(normaliseMarkup(container.innerHTML)).toBe(
      normaliseMarkup(`<ol class="xr-timeline" aria-labelledby="Rm-hh">${expected}</ol>`),
    );
  });
});

describe('Timeline behaviour', () => {
  it('keeps the caller’s order, hides the dots, and is a list a screen reader can count', () => {
    render(<Timeline events={ACCESS} label="History" />);
    const list = screen.getByRole('list', { name: 'History' });
    const items = within(list).getAllByRole('listitem');
    expect(items.map((item) => item.querySelector('.xr-tl-what')?.textContent)).toEqual([
      'Rahul Verma given Shell-and-Tube Heat Exchanger',
      'Access activated',
      'Request approved · External',
      'Request submitted',
    ]);
    for (const dot of list.querySelectorAll('.xr-tl-dot')) {
      expect(dot).toHaveAttribute('aria-hidden', 'true');
    }
    expect(list.querySelectorAll('.is-latest')).toHaveLength(1);
    expect(items[0]).toHaveClass('is-latest');
  });
});

describe('Timeline: stylesheet classes and accessibility (axe, WCAG 2.2 AA)', () => {
  it('emits only stylesheet classes', () => {
    const { container } = render(
      <div>
        <Timeline events={REVIEW} label="Submission and review history" lineElement="p" />
        <Timeline events={ACCESS} markLatest={false} />
      </div>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });

  it.each([
    [
      'labelled, p lines',
      <Timeline key="p" events={REVIEW} label="Submission and review history" lineElement="p" />,
    ],
    ['div lines, latest marked', <Timeline key="d" events={ACCESS} label="History" />],
    [
      'named by a heading, no latest marker',
      <section key="s" aria-labelledby="h">
        <h2 id="h">History</h2>
        <Timeline events={ACCESS} markLatest={false} labelledBy="h" />
      </section>,
    ],
  ])('%s', async (_name, element) => {
    const { container } = render(<main>{element}</main>);
    await assertNoAxeViolations(container);
  });
});
