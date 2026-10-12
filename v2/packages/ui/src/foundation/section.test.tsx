/**
 * Section / Stack — markup contract, behaviour and accessibility (Appendix E §3.1 Section /
 * Stack; Appendix F WP-0.6 acceptance 2–4). Sources: board 05 "GL-01 Workspace Shell" (the Help
 * page's "My reports" section, drawn statically), board 07 "State 3 · Report detail · resolved
 * with note · Faculty" (head + `xr-section-body`), 09a "Record detail — “What is this, and where
 * is it now?”" (`xr-stack`) and "List / queue — “Which one do I open next?”" (plain surface),
 * B1-11 "SA-03 Request decision · REQ-0042 · 1440 · interactive" (`aria-label="Summary"`),
 * B4-08 "FA-16 Draft with assistance · 1440 · interactive" (H2 focus target), B6-03
 * "RV-03 Review a submission · SUB-0077 · resubmitted · revision 2 · 1440" (`xg-changed`), B4-07
 * "FA-14 Question bank · 1440 · interactive · 7 Nov 2026" (live count `span.xr-meta[role=status]`),
 * B3-07 "ST-18 My device · 1440 · interactive · 22 Oct 2026" (`span.xr-meta.xr-id`) and B4-04
 * "FA-07 Create assessment · 1440 · interactive · 26 Oct 2026" (surface focus target
 * `div.xr-section#…[tabindex="-1"]`).
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
import { RowLink, Rows } from './rows.js';
import { Section, SectionBody, Stack } from './section.js';

const SHELL: BoardSource = { board: '05', frame: 'GL-01 Workspace Shell' };
const REPORT_DETAIL: BoardSource = {
  board: '07',
  frame: 'State 3 · Report detail · resolved with note · Faculty',
};
const RECORD_DETAIL: BoardSource = {
  board: '09a',
  frame: 'Record detail — “What is this, and where is it now?”',
};

/** The board-05 "My reports" section, built from the components. */
function MyReports() {
  return (
    <Section title="My reports" headingId="sh-rep" meta="2 reports">
      <Rows>
        <RowLink
          href="#r1"
          title="VR simulation stopped loading at step 2"
          sub={
            <>
              <span className="xr-id">SUP-0213</span> · sent 3 Oct · Shell-and-Tube Heat Exchanger ·
              VR
            </>
          }
          end={
            <span className="xr-status xr-status--info">
              <Icon name="withAnotherRole" />
              Open
            </span>
          }
        />
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
      </Rows>
    </Section>
  );
}

describe('Section markup contract', () => {
  it('a titled section renders exactly as board 05 draws "My reports"', () => {
    const { container } = render(<MyReports />);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      SHELL,
      `<section class="xr-section" aria-labelledby="sh-rep">
        <div class="xr-section-head"><h2 id="sh-rep" class="xr-h2">My reports</h2><span class="xr-meta">2 reports</span></div>
        <ul class="xr-rows">
          <li><a class="xr-row xr-row-link" href="#r1"><div class="xr-row-main"><div class="xr-row-text"><span class="xr-row-title">VR simulation stopped loading at step 2</span><span class="xr-row-sub"><span class="xr-id">SUP-0213</span> · sent 3 Oct · Shell-and-Tube Heat Exchanger · VR</span></div></div><span class="xr-status xr-status--info"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h11l-3-3M17 17H6l3 3"></path></svg>Open</span></a></li>
          <li><a class="xr-row xr-row-link" href="#r2"><div class="xr-row-main"><div class="xr-row-text"><span class="xr-row-title">Lab brief link opened a blank page</span><span class="xr-row-sub"><span class="xr-id">SUP-0198</span> · sent 21 Sep · resolved 23 Sep</span></div></div><span class="xr-status xr-status--ok"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>Resolved</span></a></li>
        </ul>
      </section>`,
    );
  });

  it('head and body: `div.xr-section-head` > `h2.xr-h2`, then `div.xr-section-body` (board 07)', () => {
    const drawn =
      '<section class="xr-section" aria-labelledby="{{ f.id }}-wr"> <div class="xr-section-head"><h2 id="{{ f.id }}-wr" class="xr-h2">What you reported</h2></div> <div class="xr-section-body">';
    expectBoardDraws(REPORT_DETAIL, drawn);
    const { container } = render(
      <Section title="What you reported" headingId="s7-wr">
        <SectionBody>
          <p>The lab brief link on the Resources tab opened a blank page.</p>
        </SectionBody>
      </Section>,
    );
    expect(normaliseMarkup(container.innerHTML)).toBe(
      normaliseMarkup(
        `${drawn.replaceAll('{{ f.id }}', 's7')}<p>The lab brief link on the Resources tab opened a blank page.</p></div></section>`,
      ),
    );
  });

  it('a section without a visible heading is named by aria-label (B1-11 "Summary")', () => {
    expectBoardDraws(
      { board: 'B1-11', frame: 'SA-03 Request decision · REQ-0042 · 1440 · interactive' },
      '<section class="xr-section" aria-label="Summary"><dl ',
    );
    const { container } = render(
      <Section label="Summary">
        <dl />
      </Section>,
    );
    expect(container.innerHTML).toBe(
      '<section class="xr-section" aria-label="Summary"><dl></dl></section>',
    );
    expect(screen.getByRole('region', { name: 'Summary' })).toBe(container.firstElementChild);
  });

  it('a plain white surface is a `div.xr-section`, not a region (09a "No requests match")', () => {
    expectBoardDraws(
      { board: '09a', frame: 'List / queue — “Which one do I open next?”' },
      '<div class="xr-section"><div class="xr-empty">',
    );
    const { container } = render(
      <Section>
        <div className="xr-empty" />
      </Section>,
    );
    expect(container.innerHTML).toBe('<div class="xr-section"><div class="xr-empty"></div></div>');
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('board context classes follow `xr-section` (B6-03 `xr-section xg-changed`)', () => {
    expectBoardDraws(
      {
        board: 'B6-03',
        frame: 'RV-03 Review a submission · SUB-0077 · resubmitted · revision 2 · 1440',
      },
      '<section class="xr-section xg-changed" aria-labelledby="Rm-cg"><div class="xr-section-head"><h2 id="Rm-cg" class="xr-h2">',
    );
    const { container } = render(
      <Section title="What changed" headingId="Rm-cg" className="xg-changed" />,
    );
    expect(container.firstElementChild!.className).toBe('xr-section xg-changed');
  });

  it('the H2 as a focus target after an action, with a live count (B4-08 "Drafts to review")', () => {
    const drawn =
      '<section class="xr-section" aria-labelledby="Dd-lh"><div class="xr-section-head"><h2 id="Dd-lh" class="xr-h2" tabindex="-1">Drafts to review</h2><span class="xr-meta" role="status">{{ d.left }}</span></div>';
    expectBoardDraws(
      { board: 'B4-08', frame: 'FA-16 Draft with assistance · 1440 · interactive' },
      drawn,
    );
    const { container } = render(
      <Section
        title="Drafts to review"
        headingId="Dd-lh"
        headingFocusTarget
        meta="3 left to review"
        metaLive
      />,
    );
    expect(normaliseMarkup(container.innerHTML)).toBe(
      `${drawn.replace('{{ d.left }}', '3 left to review')}</section>`,
    );
  });

  it('a live count in the head: `span.xr-meta[role="status"]`, kept mounted (B4-07 "Questions")', () => {
    expectBoardDraws(
      { board: 'B4-07', frame: 'FA-14 Question bank · 1440 · interactive · 7 Nov 2026' },
      '<section class="xr-section" id="Kb-tq" aria-labelledby="Kb-qh"><div class="xr-section-head"><h2 id="Kb-qh" class="xr-h2">Questions</h2><span class="xr-meta" role="status">{{ b.count }}</span></div>',
    );
    const { container, rerender } = render(
      <Section id="Kb-tq" title="Questions" headingId="Kb-qh" meta="12 questions" metaLive />,
    );
    expect(container.innerHTML).toBe(
      '<section class="xr-section" id="Kb-tq" aria-labelledby="Kb-qh"><div class="xr-section-head"><h2 id="Kb-qh" class="xr-h2">Questions</h2><span class="xr-meta" role="status">12 questions</span></div></section>',
    );
    const status = screen.getByRole('status');
    rerender(
      <Section id="Kb-tq" title="Questions" headingId="Kb-qh" meta="3 questions" metaLive />,
    );
    expect(screen.getByRole('status')).toBe(status);
    expect(status).toHaveTextContent('3 questions');
    rerender(<Section id="Kb-tq" title="Questions" headingId="Kb-qh" metaLive />);
    expect(screen.getByRole('status')).toBe(status);
    expect(status).toBeEmptyDOMElement();
  });

  it('an ordinary meta is not a live region', () => {
    render(<Section title="My reports" meta="2 reports" />);
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByText('2 reports')).not.toHaveAttribute('role');
  });

  it('the record ID in the head: `span.xr-meta.xr-id` (B3-07 "Your transfer request")', () => {
    const drawn =
      '<section class="xr-section" aria-labelledby="Dd-rq"><div class="xr-section-head"><h2 id="Dd-rq" class="xr-h2">Your transfer request</h2><span class="xr-meta xr-id">DTR-0018</span></div>';
    expectBoardDraws(
      { board: 'B3-07', frame: 'ST-18 My device · 1440 · interactive · 22 Oct 2026' },
      drawn,
    );
    const { container } = render(
      <Section title="Your transfer request" headingId="Dd-rq" recordId="DTR-0018" />,
    );
    expect(container.innerHTML).toBe(`${drawn}</section>`);
  });

  it('empty slots draw nothing: no empty meta or ID (null, false, "")', () => {
    const { container } = render(
      <>
        <Section title="My reports" headingId="a" meta={null} recordId="" />
        <Section title="My reports" headingId="b" meta={false} />
        <Section title="My reports" headingId="c" meta="" />
      </>,
    );
    expect(container.querySelectorAll('.xr-meta')).toHaveLength(0);
    expect(container.querySelectorAll('.xr-section-head')[0]!.innerHTML).toBe(
      '<h2 id="a" class="xr-h2">My reports</h2>',
    );
  });

  it('a surface as a focus target after an action (B4-04 `div.xr-section#…[tabindex="-1"]`)', () => {
    expectBoardDraws(
      { board: 'B4-04', frame: 'FA-07 Create assessment · 1440 · interactive · 26 Oct 2026' },
      '<div class="xr-section" id="Cc-qs" tabindex="-1" style=',
    );
    expectBoardDraws(
      { board: 'B2-07', frame: 'IA-10 Add student · 1440 · interactive' },
      'id="Aa-done" tabindex="-1"><span class="xr-status xr-status--ok">',
    );
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <Section id="Cc-qs" focusTarget ref={ref}>
        <h2 className="xr-h3">From your question bank · Shell-and-Tube Heat Exchanger</h2>
      </Section>,
    );
    expect(container.innerHTML).toBe(
      '<div class="xr-section" id="Cc-qs" tabindex="-1"><h2 class="xr-h3">From your question bank · Shell-and-Tube Heat Exchanger</h2></div>',
    );
    act(() => ref.current!.focus());
    expect(container.firstElementChild).toHaveFocus();
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('Stack holds the sections of a record page (09a AR-3 `div.xr-stack`)', () => {
    expectBoardDraws(
      RECORD_DETAIL,
      '<div class="xr-stack"> <div class="xr-notice xr-notice--quiet" role="note">',
      '<section class="xr-section" aria-labelledby="ar3-det">',
    );
    const { container } = render(
      <Stack>
        <Section title="Submission details" headingId="ar3-det" />
        <Section title="Learning outcomes" headingId="ar3-lo" meta="One set for every format" />
      </Stack>,
    );
    const stack = container.firstElementChild!;
    expect(stack.outerHTML.startsWith('<div class="xr-stack"><section class="xr-section"')).toBe(
      true,
    );
    expect(stack.children).toHaveLength(2);
  });

  it('emits only stylesheet classes', () => {
    const { container } = render(
      <Stack className="xw-actions">
        <MyReports />
        <Section label="Summary" className="xd-group" />
        <Section title="Questions" meta="12 questions" metaLive recordId="DTR-0018" />
        <Section focusTarget>
          <SectionBody />
        </Section>
      </Stack>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });
});

describe('Section behaviour', () => {
  it('a titled section is a region named by its H2', () => {
    render(<MyReports />);
    const region = screen.getByRole('region', { name: 'My reports' });
    const heading = screen.getByRole('heading', { level: 2, name: 'My reports' });
    expect(region).toHaveAttribute('aria-labelledby', heading.id);
  });

  it('generates the heading id when none is given, unique per section', () => {
    render(
      <>
        <Section title="Needs your attention" />
        <Section title="Recent activity" />
      </>,
    );
    const [first, second] = screen.getAllByRole('region');
    expect(first).toHaveAccessibleName('Needs your attention');
    expect(second).toHaveAccessibleName('Recent activity');
    expect(first!.getAttribute('aria-labelledby')).not.toBe(
      second!.getAttribute('aria-labelledby'),
    );
  });

  it('the H2 takes focus through headingRef when it is a focus target', () => {
    const ref = createRef<HTMLHeadingElement>();
    render(<Section title="Drafts to review" headingFocusTarget headingRef={ref} />);
    act(() => ref.current!.focus());
    expect(screen.getByRole('heading', { name: 'Drafts to review' })).toHaveFocus();
  });

  it('an ordinary H2 is not focusable', () => {
    render(<Section title="My reports" />);
    expect(screen.getByRole('heading', { name: 'My reports' })).not.toHaveAttribute('tabindex');
  });
});

describe('Section accessibility (axe, WCAG 2.2 AA)', () => {
  it.each([
    ['titled with rows', <MyReports key="t" />],
    [
      'titled with body',
      <Section key="b" title="What you reported">
        <SectionBody>
          <p>Shell-and-Tube Heat Exchanger · Resources</p>
        </SectionBody>
      </Section>,
    ],
    ['labelled', <Section key="l" label="Summary" />],
    ['surface', <Section key="s" />],
    [
      'live count and record ID in the head',
      <Stack key="m">
        <Section title="Questions" meta="12 questions" metaLive />
        <Section title="Your transfer request" recordId="DTR-0018" />
      </Stack>,
    ],
    [
      'surface as a focus target',
      <Section key="f" id="Aa-done" focusTarget>
        <p className="xr-body">Rahul Verma is in People now, with no experiments yet.</p>
      </Section>,
    ],
    [
      'focus-target heading in a stack',
      <Stack key="k">
        <Section title="Drafts to review" headingFocusTarget />
      </Stack>,
    ],
  ])('%s', async (_state, element) => {
    const { container } = render(element);
    await assertNoAxeViolations(container);
  });
});
