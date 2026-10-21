/**
 * What only the Institute Admin's plan screens draw (owner-approved export
 * design/v3-refined-b/roles/IA-v1, `project/Main.dc.html` IA-01, IA-02, IA-16, IA-03 and IA-20):
 * markup against the export's classes, structure and ARIA (excerpts of its template), the
 * behaviour (the term bar's data-driven positions, the view switch, the missing-only toggle), the
 * class contract, the accessibility checks and no internal reference anywhere a piece draws.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectNoInternalReferences,
  expectV3ClassesOnly,
  iaExportText,
} from '../testing/index.js';
import { Button } from './actions.js';
import { IaFormatList, IaLines, IaViewSwitch } from './ia.js';
import {
  IaAttention,
  IaAttentionCalm,
  IaAttentionLead,
  IaAttentionList,
  IaCourseCodeItem,
  IaCourseCodeList,
  IaCourseCodes,
  IaCourseCodeSave,
  IaCourseCodesHead,
  IaCourseCodesHelp,
  IaCourseCodeValue,
  IaExperimentsMeta,
  IaExperimentsTable,
  IaFormatKey,
  IaOptional,
  IaOverviewGrid,
  IaOverviewHead,
  IaPlanCard,
  IaPlanCardExperiment,
  IaPlanFacts,
  IaPlanStrip,
  IaPlanStripAsk,
  IaPlanStripFoot,
  IaPlanStripId,
  IaPlanStripNote,
  IaPlanStripRow,
  IaPlanStripView,
  IaTermBar,
  type IaTermBarProps,
  IaUsageFormat,
} from './ia-plan.js';
import { V3_ICON_PATHS } from './icons.js';
import { StatusPill } from './status.js';

const ROOT = iaExportText('Main.dc.html');
const TEMPLATE = ROOT.slice(0, ROOT.indexOf('<script type="text/x-dc"'));
const section = (from: string, to: string) =>
  TEMPLATE.slice(TEMPLATE.indexOf(from), TEMPLATE.indexOf(to));
const IA01 = section('{{ R.rIA01 }}', '{{ R.rIA02 }}');
const IA02 = section('{{ R.rIA02 }}', '{{ R.rIA16 }}');
const IA16 = section('{{ R.rIA16 }}', '{{ R.rIA03 }}');
const IA03 = section('{{ R.rIA03 }}', '{{ R.rIA04 }}');
const IA20 = section('{{ R.rIA20 }}', '<!-- XS-07');

const pathOf = (element: Element | null) => element?.querySelector('path')?.getAttribute('d');

/** The grant, faculty-course and group references the role also never shows. */
const OTHER_REFERENCE = /\b(?:SACC|FMAP|GRP)-\d+/;

function expectClean(container: HTMLElement) {
  expectV3ClassesOnly(container);
  expectNoInternalReferences(container);
  expect(container.textContent).not.toMatch(OTHER_REFERENCE);
}

const LIVE: IaTermBarProps = {
  label: 'Yearly term',
  left: '350 days left',
  start: '8 Oct 2026',
  end: '7 Oct 2027',
  elapsed: 14 / 364,
  state: 'live',
  description:
    'Access term from 8 October 2026 to 7 October 2027. 14 of 364 days have passed; 350 days are left.',
  place: 'card',
};

describe('the yearly term bar', () => {
  it('is drawn as the export draws it: the label, the days left, the track and the ends', () => {
    for (const piece of [
      '<div class="ia-plan-term" role="img" aria-label="{{ V.T2.aria }}">',
      '<div class="ia-plan-term-top"><span class="ia-plan-lab">Yearly term</span><span class="{{ V.T2.leftCls }}">{{ V.T2.left }}</span></div>',
      '<div class="{{ V.T2.trackCls }}"><span class="ia-tt-fill" style="width: {{ V.T2.fill }}"></span>',
      '<span class="ia-tt-rest" style="width: {{ V.T2.rest }}"></span>',
      '<span class="ia-tt-today" style="left: {{ V.T2.fill }}"></span>',
      '<div class="ia-plan-term-ends"><span>{{ V.T2.start }}</span><span>{{ V.T2.end }}</span></div>',
    ]) {
      expect(IA01).toContain(piece);
    }
    expect(IA02).toContain('<div class="ia-cp-term" role="img" aria-label="{{ V.T2.aria }}">');
    expect(IA02).toContain('<div class="ia-cp-term-top">');
    expect(ROOT).toContain(
      "trackCls: 'ia-tt' + (x.pst === 'paused' ? ' is-paused' : x.pst === 'ended' ? ' is-full' : ''), leftCls: 'ia-plan-left' + (x.pst === 'ending' ? ' is-warn' : '')",
    );

    const { container } = render(<IaTermBar {...LIVE} />);
    const bar = screen.getByRole('img', { name: LIVE.description });
    expect(bar).toHaveClass('ia-plan-term');
    expect(bar.querySelector('.ia-plan-term-top')!.textContent).toBe('Yearly term350 days left');
    expect(bar.querySelector('.ia-plan-left')).not.toHaveClass('is-warn');
    const track = bar.querySelector('.ia-tt')!;
    expect(track.className).toBe('ia-tt');
    // The export's own rounding: 14 / 364 = 3.85%.
    expect(track.querySelector<HTMLElement>('.ia-tt-fill')!.style.width).toBe('3.85%');
    expect(track.querySelector<HTMLElement>('.ia-tt-today')!.style.left).toBe('3.85%');
    expect(track.querySelector('.ia-tt-rest')).toBeNull();
    expect(
      [...bar.querySelectorAll('.ia-plan-term-ends span')].map((node) => node.textContent),
    ).toEqual(['8 Oct 2026', '7 Oct 2027']);
    expectClean(container);
  });

  it('ending soon: the gold remainder and the warn days; in a strip, the strip’s classes', () => {
    render(
      <IaTermBar {...LIVE} state="ending" left="15 days left" elapsed={349 / 364} place="strip" />,
    );
    const bar = screen.getByRole('img');
    expect(bar).toHaveClass('ia-cp-term');
    expect(bar.querySelector('.ia-cp-term-top .ia-plan-left')).toHaveClass('is-warn');
    expect(bar.querySelector<HTMLElement>('.ia-tt-fill')!.style.width).toBe('95.88%');
    expect(bar.querySelector<HTMLElement>('.ia-tt-rest')!.style.width).toBe('4.12%');
    expect(bar.querySelector<HTMLElement>('.ia-tt-today')!.style.left).toBe('95.88%');
  });

  it('paused: striped, no fill, no marker; ended: the full track, no marker', () => {
    const { rerender } = render(
      <IaTermBar {...LIVE} state="paused" left="Paused by BITS on 2 Mar 2027" />,
    );
    let track = screen.getByRole('img').querySelector('.ia-tt')!;
    expect(track).toHaveClass('ia-tt', 'is-paused');
    expect(track.querySelector<HTMLElement>('.ia-tt-fill')!.style.width).toBe('0%');
    expect(track.querySelector('.ia-tt-today, .ia-tt-rest')).toBeNull();
    rerender(<IaTermBar {...LIVE} state="ended" left="Ended on 7 Oct 2027" />);
    track = screen.getByRole('img').querySelector('.ia-tt')!;
    expect(track).toHaveClass('ia-tt', 'is-full');
    expect(track.querySelector<HTMLElement>('.ia-tt-fill')!.style.width).toBe('100%');
    expect(track.querySelector('.ia-tt-today, .ia-tt-rest')).toBeNull();
  });
});

describe('IA-01 the compact head, Needs your attention and the plan card', () => {
  it('the head: date, the name with its hidden prefix, the access status and the actions', async () => {
    for (const piece of [
      '<div class="ia-ov-head">',
      '<div class="ia-ov-id">',
      '<p class="rb-eyebrow-date">{{ S.dateLong }}</p>',
      '<h1 class="rb-h1" id="ia-h1" tabindex="-1"><span class="xr-sr">Overview, </span>{{ S.inst }}</h1>',
      '<p class="ia-ov-status"><span class="{{ V.stCls }}"><i></i>{{ V.stLabel }}</span><span>{{ V.stLine }}</span></p>',
      '<div class="rk-head-act">',
    ]) {
      expect(IA01).toContain(piece);
    }
    const { container } = render(
      <main>
        <IaOverviewHead
          title="Godavari Institute of Technology"
          titlePrefix="Overview,"
          titleId="ia-h1"
          date="Thursday 22 October 2026"
          status={<StatusPill tone="ok">Access active</StatusPill>}
          statusLine="Your access plan ends on 7 October 2027."
          actions={<Button variant="primary">Give students access</Button>}
        />
      </main>,
    );
    // The hidden prefix reads first: "Overview, Godavari Institute of Technology".
    const h1 = screen.getByRole('heading', {
      level: 1,
      name: 'Overview, Godavari Institute of Technology',
    });
    expect(h1.textContent).toBe('Overview, Godavari Institute of Technology');
    expect(h1).toHaveAttribute('tabindex', '-1');
    expect(h1.querySelector('.xr-sr')).toHaveTextContent('Overview,');
    expect(container.querySelector('.ia-ov-status')!.textContent).toBe(
      'Access activeYour access plan ends on 7 October 2027.',
    );
    expect(container.querySelector('.rk-head-act .rb-btn--primary')).toBeInTheDocument();
    expectClean(container);
    await assertNoAxeViolations(container);
  });

  it('the attention panel: count, lead band with its one navy action, counted items', async () => {
    for (const piece of [
      '<section class="rb-panel ia-att" aria-labelledby="rb-att-h">',
      '<div class="ia-att-head"><h2 class="rb-h2" id="rb-att-h">Needs your attention</h2>',
      '<p class="rb-note">{{ V.count }}</p>',
      '<span class="rb-lead-ico" aria-hidden="true">',
      '<p class="rb-lead-t">{{ V.lead.t }}</p>',
      '<p class="rb-lead-d">{{ V.lead.d }}</p>',
      '<div class="rb-lead-act"><a class="rb-btn rb-btn--navy rb-btn--lg"',
      '<ul class="ia-att-list">',
      '<li class="ia-att-item"><span class="ia-att-n" aria-hidden="true">{{ it.n }}</span><p class="ia-att-t"><span class="xr-sr">{{ it.n }} </span>{{ it.t }}</p><p class="ia-att-d">{{ it.d }}</p><a class="ia-att-go"',
    ]) {
      expect(IA01).toContain(piece);
    }
    const { container } = render(
      <IaOverviewGrid>
        <IaAttention title="Needs your attention" titleId="ia-att-h" note="2 items">
          <IaAttentionLead
            tone="due"
            title="Request a renewal"
            line="Your plan ends on 7 October. The reminder is due; nothing is sent automatically."
            action={{ label: 'Request renewal', href: '/institute/requests' }}
          />
          <IaAttentionList
            items={[
              {
                key: 'wait',
                count: 2,
                title: 'students are waiting for a licence',
                line: 'Shell-and-Tube Heat Exchanger',
                action: { label: 'View students', href: '/institute/student-access' },
              },
            ]}
          />
        </IaAttention>
      </IaOverviewGrid>,
    );
    expect(container.firstElementChild).toHaveClass('ia-ov-grid');
    const panel = screen.getByRole('region', { name: 'Needs your attention' });
    expect(panel).toHaveClass('rb-panel', 'ia-att');
    expect(panel.querySelector('.rb-note')).toHaveTextContent('2 items');
    const lead = panel.querySelector('.rb-lead')!;
    expect(lead.className).toBe('rb-lead');
    expect(pathOf(lead.querySelector('.rb-lead-ico'))).toBe(V3_ICON_PATHS.calendar);
    expect(within(lead as HTMLElement).getByRole('link', { name: 'Request renewal' })).toHaveClass(
      'rb-btn',
      'rb-btn--navy',
      'rb-btn--lg',
    );
    const item = panel.querySelector('li.ia-att-item')!;
    expect(item.querySelector('.ia-att-n')).toHaveAttribute('aria-hidden', 'true');
    expect(item.querySelector('.ia-att-t')!.textContent).toBe(
      '2 students are waiting for a licence',
    );
    const go = within(item as HTMLElement).getByRole('link', { name: 'View students' });
    expect(go).toHaveClass('ia-att-go');
    expect(go).toHaveAttribute('href', '/institute/student-access');
    expect(pathOf(go)).toBe(V3_ICON_PATHS.chevronRight);
    expectClean(container);
    await assertNoAxeViolations(container);
  });

  it('the paused and ended lead bands take the kit’s tints; the calm state is a status', () => {
    for (const piece of [
      "cls: 'rb-lead ia-lead--paused'",
      "cls: 'rb-lead ia-lead--off'",
      '<div class="rb-calm" role="status">',
      '<p class="rb-calm-t">Nothing needs your attention right now.</p>',
      '<p class="rb-calm-d">New items appear here as they come in.</p>',
    ]) {
      expect(ROOT).toContain(piece);
    }
    const { container } = render(
      <>
        <IaAttentionLead tone="paused" title="Paused" line="Read-only." />
        <IaAttentionLead tone="off" title="Ended" line="Ended 7 Oct 2027." />
        <IaAttentionCalm title="Nothing needs your attention right now.">
          New items appear here as they come in.
        </IaAttentionCalm>
      </>,
    );
    const [paused, ended] = [...container.querySelectorAll('.rb-lead')];
    expect(paused).toHaveClass('ia-lead--paused');
    expect(pathOf(paused!.querySelector('.rb-lead-ico'))).toBe(V3_ICON_PATHS.pauseCircle);
    expect(paused!.querySelector('.rb-lead-act')).toBeNull();
    expect(ended).toHaveClass('ia-lead--off');
    expect(pathOf(ended!.querySelector('.rb-lead-ico'))).toBe(V3_ICON_PATHS.ended);
    expect(screen.getByRole('status')).toHaveClass('rb-calm');
    expectClean(container);
  });

  it('the plan card on the plan tint: term, facts, each experiment with its badges in words', async () => {
    for (const piece of [
      '<section class="ia-plan" aria-labelledby="ia-plan-h">',
      '<div class="ia-plan-head">',
      '<h2 class="rb-h2" id="ia-plan-h">Access plan</h2>',
      '<dl class="ia-plan-facts">',
      '<div><dt>Licences</dt><dd>{{ V.Pn.lic }}<span class="ia-plan-dd-sub">as approved by BITS</span></dd></div>',
      '<div><dt>Term</dt><dd>{{ V.Pn.term }}</dd></div>',
      '<div class="ia-plan-exp">',
      '<p class="ia-plan-exp-t">{{ e.t }}</p>',
      '<p class="ia-plan-exp-c">{{ e.code }} · {{ e.course }}</p>',
      '<p class="ia-plan-code">Your course code <span class="rb-code">{{ e.own }}</span></p>',
      '<span class="rk-tag-warn"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#rki-alert"></use></svg>Your course code: not added</span>',
      '<ul class="xr-fmts ia-plan-fmts" aria-label="{{ e.fmAria }}">',
      '<p class="ia-fmt-key">{{ e.F.key }}</p>',
      '<p class="ia-plan-note">Students open only the experiments you give them on Student access, in the formats your plan includes.</p>',
      '<div class="ia-plan-links"><a class="rb-link"',
    ]) {
      expect(IA01).toContain(piece);
    }
    const { container } = render(
      <IaPlanCard
        title="Access plan"
        titleId="ia-plan-h"
        status={<StatusPill tone="ok">Active</StatusPill>}
        term={<IaTermBar {...LIVE} />}
        facts={[
          { term: 'Licences', value: 120, sub: 'as approved by BITS' },
          { term: 'Term', value: 'Yearly' },
        ]}
        note="Students open only the experiments you give them on Student access, in the formats your plan includes."
        links={[
          { label: 'View plan', href: '/institute/content-access/plans/x' },
          { label: 'Open Content access', href: '/institute/content-access' },
        ]}
      >
        <IaPlanCardExperiment
          name="Shell-and-Tube Heat Exchanger"
          course="ME ZG523 · Thermodynamics & Heat Transfer"
          ownCode={{ label: 'Your course code', code: 'MEC-523' }}
          formats={
            <IaFormatList
              variant="plan"
              label="Formats of Shell-and-Tube Heat Exchanger"
              cells={[
                { format: 'WEB', state: 'on', words: 'WEB, Browser: In your plan' },
                { format: 'AR', state: 'pub', words: 'AR, Augmented reality: Published' },
                { format: 'VR', state: 'on', words: 'VR, Virtual reality: In your plan' },
                { format: 'MR', state: 'none', words: 'MR, Mixed reality: Not published' },
              ]}
            />
          }
          formatKey="WEB and VR in your plan · AR published, not in your plan · MR not published"
        />
        <IaPlanCardExperiment
          name="Fin-Tube Bundle"
          course="ME ZG523 · Thermodynamics & Heat Transfer"
          ownCode={{ missing: 'Your course code: not added' }}
          formats={null}
          formatKey="WEB in your plan"
        />
      </IaPlanCard>,
    );
    const planBox = screen.getByRole('region', { name: 'Access plan' });
    expect(planBox).toHaveClass('ia-plan');
    expect(planBox.querySelector('.ia-plan-head .ia-plan-id .xr-st--ok')).toHaveTextContent(
      'Active',
    );
    expect(planBox.querySelector('.ia-plan-term')).toBeInTheDocument();
    expect(
      [...planBox.querySelectorAll('.ia-plan-facts dt')].map((node) => node.textContent),
    ).toEqual(['Licences', 'Term']);
    expect(planBox.querySelector('.ia-plan-dd-sub')).toHaveTextContent('as approved by BITS');
    const [own, missing] = [...planBox.querySelectorAll('.ia-plan-code')];
    expect(own!.textContent).toBe('Your course code MEC-523');
    expect(own!.querySelector('.rb-code')).toHaveTextContent('MEC-523');
    expect(missing!.querySelector('.rk-tag-warn')).toHaveTextContent('Your course code: not added');
    expect(pathOf(missing!.querySelector('.rk-tag-warn'))).toBe(V3_ICON_PATHS.alertTriangle);
    expect(
      within(planBox).getByRole('list', { name: 'Formats of Shell-and-Tube Heat Exchanger' }),
    ).toHaveClass('xr-fmts', 'ia-plan-fmts');
    expect(planBox.querySelector('.ia-fmt-key')).toHaveTextContent('WEB and VR in your plan');
    expect(
      within(planBox.querySelector('.ia-plan-links') as HTMLElement)
        .getAllByRole('link')
        .map((link) => [link.textContent, link.className]),
    ).toEqual([
      ['View plan', 'rb-link'],
      ['Open Content access', 'rb-link'],
    ]);
    expectClean(container);
    await assertNoAxeViolations(container);
  });
});

describe('IA-02 / IA-03 the plan strip', () => {
  it('IA-02: the plan and its status, licences, the term and View plan named by its term', async () => {
    for (const piece of [
      '<section class="ia-cp" aria-labelledby="cp-h">',
      '<div class="ia-cp-row">',
      '<h2 class="ia-cp-k" id="cp-h">Access plan</h2>',
      '<p class="ia-cp-name">',
      '<dl class="ia-cp-facts">',
      '<div><dt>Licences</dt><dd>{{ V.P.lic }}<span class="ia-cp-sub">as approved by BITS</span></dd></div>',
      '<a class="rb-link ia-cp-view"',
      'aria-label="{{ V.P.viewAria }}">View plan</a>',
      '<div class="ia-cp-note ia-cp-note--warn"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#rki-cal"></use></svg><p><b>Ends on {{ V.P.endShort }}.</b> Renewal reminder due. Ask BITS for a renewal from Requests.</p><a class="rb-btn rb-btn--navy"',
      '<div class="ia-cp-note ia-cp-note--off"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#rki-ended"></use></svg>',
      '<div class="ia-cp-note ia-cp-note--paused"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#rki-lock"></use></svg>',
    ]) {
      expect(IA02).toContain(piece);
    }
    const { container } = render(
      <IaPlanStrip titleId="cp-h">
        <IaPlanStripRow>
          <IaPlanStripId
            title="Access plan"
            titleId="cp-h"
            status={<StatusPill tone="warn">Ending soon</StatusPill>}
          />
          <IaPlanFacts
            place="strip"
            facts={[{ term: 'Licences', value: 120, sub: 'as approved by BITS' }]}
          />
          <IaTermBar {...LIVE} state="ending" place="strip" />
          <IaPlanStripView
            link={{
              label: 'View plan',
              href: '/institute/content-access/plans/x',
              accessibleName: 'View access plan, 8 Oct 2026 – 7 Oct 2027',
            }}
          />
        </IaPlanStripRow>
        <IaPlanStripNote
          tone="warn"
          title="Ends on 7 Oct 2027."
          line="Renewal reminder due. Ask BITS for a renewal from Requests."
          action={{ label: 'Request renewal', href: '/institute/requests' }}
        />
      </IaPlanStrip>,
    );
    const strip = screen.getByRole('region', { name: 'Access plan' });
    expect(strip).toHaveClass('ia-cp');
    expect(strip.querySelector('.ia-cp-row')!.className).toBe('ia-cp-row');
    expect(strip.querySelector('.ia-cp-name .xr-st--warn')).toHaveTextContent('Ending soon');
    expect(strip.querySelector('.ia-cp-facts .ia-cp-sub')).toHaveTextContent('as approved by BITS');
    const view = within(strip).getByRole('link', {
      name: 'View access plan, 8 Oct 2026 – 7 Oct 2027',
    });
    expect(view).toHaveClass('rb-link', 'ia-cp-view');
    expect(view).toHaveTextContent('View plan');
    const note = strip.querySelector('.ia-cp-note')!;
    expect(note).toHaveClass('ia-cp-note--warn');
    expect(pathOf(note)).toBe(V3_ICON_PATHS.calendar);
    expect(note.querySelector('p')!.innerHTML).toBe(
      '<b>Ends on 7 Oct 2027.</b> Renewal reminder due. Ask BITS for a renewal from Requests.',
    );
    expect(within(note as HTMLElement).getByRole('link', { name: 'Request renewal' })).toHaveClass(
      'rb-btn',
      'rb-btn--navy',
    );
    expectClean(container);
    await assertNoAxeViolations(container);
  });

  it('IA-03: named by a hidden heading, the plan row with the ask or without it, the footnote', async () => {
    for (const piece of [
      '<section class="ia-cp" aria-labelledby="pl-cp-h">',
      '<h2 class="xr-sr" id="pl-cp-h">Licences and term</h2>',
      '<p class="ia-cp-ask"><span>Need more, or a renewal?</span><a class="rb-link"',
      '>Ask BITS from Requests</a></p>',
      '<p class="ia-cp-foot">Licences and term are as BITS approved them. Giving or withdrawing access doesn’t change what is shown here.</p>',
    ]) {
      expect(IA03).toContain(piece);
    }
    expect(ROOT).toContain("rowCls: 'ia-cp-row ia-cp-row--plan' + (askStrip ? '' : ' is-noask')");
    const { container, rerender } = render(
      <IaPlanStrip titleId="pl-cp-h" hiddenTitle="Licences and term">
        <IaPlanStripRow variant="plan">
          <IaPlanStripAsk
            question="Need more, or a renewal?"
            link={{ label: 'Ask BITS from Requests', href: '/institute/requests' }}
          />
        </IaPlanStripRow>
        <IaPlanStripFoot>Licences and term are as BITS approved them.</IaPlanStripFoot>
        <IaPlanStripNote tone="paused" title="Read-only." line="Until BITS lifts the pause." />
      </IaPlanStrip>,
    );
    const strip = screen.getByRole('region', { name: 'Licences and term' });
    expect(strip.querySelector('h2.xr-sr')).toHaveAttribute('id', 'pl-cp-h');
    expect(strip.querySelector('.ia-cp-row')!.className).toBe('ia-cp-row ia-cp-row--plan');
    expect(strip.querySelector('.ia-cp-ask')!.textContent).toBe(
      'Need more, or a renewal?Ask BITS from Requests',
    );
    expect(strip.querySelector('.ia-cp-foot')).toBeInTheDocument();
    const paused = strip.querySelector('.ia-cp-note--paused')!;
    expect(pathOf(paused)).toBe(V3_ICON_PATHS.lock);
    expect(paused.querySelector('a')).toBeNull();
    expectClean(container);
    await assertNoAxeViolations(container);
    rerender(
      <IaPlanStrip titleId="pl-cp-h" hiddenTitle="Licences and term">
        <IaPlanStripRow variant="plan" noAsk>
          <span>120</span>
        </IaPlanStripRow>
      </IaPlanStrip>,
    );
    expect(container.querySelector('.ia-cp-row')!.className).toBe(
      'ia-cp-row ia-cp-row--plan is-noask',
    );
  });
});

describe('IA-02 / IA-03 the format key and the experiments table', () => {
  const formats = (
    <IaFormatList
      label="Formats of Shell-and-Tube Heat Exchanger"
      cells={[
        { format: 'WEB', state: 'on', words: 'WEB, Browser: In your plan' },
        { format: 'AR', state: 'pub', words: 'AR, Augmented reality: Published, not in your plan' },
        { format: 'VR', state: 'on', words: 'VR, Virtual reality: In your plan' },
        { format: 'MR', state: 'none', words: 'MR, Mixed reality: Not published' },
      ]}
    />
  );

  it('the key and the count under the tools', async () => {
    for (const piece of [
      '<div class="ia-xs-meta">',
      '<div class="ia-xs-key"><span class="ia-xs-key-k" aria-hidden="true">Formats</span><ul aria-label="Format key"><li><span class="rk-swatch rk-swatch--on" aria-hidden="true">',
      '</span>In your plan</li><li><span class="rk-swatch rk-swatch--pub" aria-hidden="true"></span>Published, not in your plan</li><li><span class="rk-swatch rk-swatch--none" aria-hidden="true"></span>Not published</li></ul></div>',
      '<p class="ia-xs-count" role="status">{{ V.L.count }}</p>',
    ]) {
      expect(IA02).toContain(piece);
    }
    const { container } = render(
      <IaExperimentsMeta
        formatKey={
          <IaFormatKey
            label="Formats"
            listLabel="Format key"
            inPlan="In your plan"
            published="Published, not in your plan"
            notPublished="Not published"
          />
        }
        count="1 experiment in 1 course"
      />,
    );
    const key = screen.getByRole('list', { name: 'Format key' });
    expect([...key.querySelectorAll('li')].map((item) => item.textContent)).toEqual([
      'In your plan',
      'Published, not in your plan',
      'Not published',
    ]);
    expect(
      [...key.querySelectorAll('.rk-swatch')].map((swatch) => swatch.className.split(' ')[1]),
    ).toEqual(['rk-swatch--on', 'rk-swatch--pub', 'rk-swatch--none']);
    expect(screen.getByRole('status')).toHaveClass('ia-xs-count');
    expectClean(container);
    await assertNoAxeViolations(container);
  });

  it('IA-02: one tbody per course, its head, then name and status · badges · given · Give access', async () => {
    for (const piece of [
      '<table class="ia-xt">',
      '<caption>Experiments in your access plan, grouped by course</caption>',
      '<thead><tr><th scope="col">Experiment</th><th scope="col">Formats</th><th scope="col">Students given access</th><th scope="col"><span class="xr-sr">Action</span></th></tr></thead>',
      '<tr class="ia-xt-grp"><th colspan="4" scope="rowgroup" id="{{ c.hid }}"><div class="ia-xt-gh"><span class="rb-code">{{ c.code }}</span><span class="ia-xt-gt">{{ c.course }}</span><span class="ia-xt-own">',
      '<span class="rk-own-k">Your course code</span><span class="rk-owncode">{{ c.own }}</span>',
      '<tr class="ia-xt-row">',
      '<th scope="row" class="ia-xt-name"><span class="ia-xt-nm"><span class="ia-xt-t" id="{{ e.hid }}">{{ e.t }}</span>',
      '<td class="ia-xt-fm">',
      '<td class="ia-xt-given"><span class="ia-xt-lab">Students given access</span>',
      '<span class="ia-xt-none">None yet</span>',
      '<td class="ia-xt-act">',
    ]) {
      expect(IA02).toContain(piece);
    }
    const { container } = render(
      <section className="rk-surface ia-gm" aria-label="Experiments in your access plan">
        <IaExperimentsTable
          caption="Experiments in your access plan, grouped by course"
          headers={{
            experiment: 'Experiment',
            formats: 'Formats',
            given: 'Students given access',
            action: 'Action',
          }}
          courses={[
            {
              key: 'thermo',
              headId: 'ca-c-thermo',
              code: 'ME ZG523',
              name: 'Thermodynamics & Heat Transfer',
              ownCode: { label: 'Your course code', code: 'MEC-523' },
              rows: [
                {
                  key: 'shell',
                  name: 'Shell-and-Tube Heat Exchanger',
                  status: <StatusPill tone="ok">Active</StatusPill>,
                  formats,
                  given: {
                    label: 'Students given access',
                    link: {
                      label: '7 students',
                      href: '/institute/student-access',
                      accessibleName:
                        '7 students given access to Shell-and-Tube Heat Exchanger. Open Student access',
                    },
                  },
                  action: {
                    label: 'Give access',
                    href: '/institute/student-access/give',
                    accessibleName: 'Give students access to Shell-and-Tube Heat Exchanger',
                  },
                },
              ],
            },
            {
              key: 'machines',
              code: 'EEE ZC341',
              name: 'Electrical Machines',
              ownCode: {
                missing: 'Your course code: not added',
                add: {
                  label: 'Add code',
                  href: '/institute/content-access?tab=course-codes',
                  accessibleName: 'Add your course code for EEE ZC341 Electrical Machines',
                },
              },
              rows: [
                {
                  key: 'transformer',
                  name: 'Transformer Tests',
                  status: <StatusPill tone="paused">Paused</StatusPill>,
                  formats: null,
                  given: { none: 'None yet' },
                },
              ],
            },
          ]}
        />
      </section>,
    );
    const table = screen.getByRole('table', {
      name: 'Experiments in your access plan, grouped by course',
    });
    expect(table).toHaveClass('ia-xt');
    expect([...table.querySelectorAll('thead th')].map((cell) => cell.textContent)).toEqual([
      'Experiment',
      'Formats',
      'Students given access',
      'Action',
    ]);
    expect(table.querySelectorAll('tbody')).toHaveLength(2);
    const [thermo, machines] = [...table.querySelectorAll('tbody')];
    const head = thermo!.querySelector('tr.ia-xt-grp th')!;
    expect(head).toHaveAttribute('colspan', '4');
    expect(head).toHaveAttribute('scope', 'rowgroup');
    expect(head).toHaveAttribute('id', 'ca-c-thermo');
    expect(head.querySelector('.ia-xt-own')!.textContent).toBe('Your course codeMEC-523');
    const row = thermo!.querySelector('tr.ia-xt-row')!;
    expect(row.querySelector('th.ia-xt-name .ia-xt-t')).toHaveTextContent(
      'Shell-and-Tube Heat Exchanger',
    );
    expect(row.querySelector('.ia-xt-nm .xr-st--ok')).toHaveTextContent('Active');
    expect(within(row as HTMLElement).getByRole('list', { name: /^Formats of/ })).toHaveClass(
      'xr-fmts',
    );
    const given = within(row as HTMLElement).getByRole('link', {
      name: /^7 students given access/,
    });
    expect(given).toHaveTextContent('7 students');
    expect(pathOf(given)).toBe(V3_ICON_PATHS.user);
    expect(
      within(row as HTMLElement).getByRole('link', {
        name: 'Give students access to Shell-and-Tube Heat Exchanger',
      }),
    ).toHaveClass('rb-btn');
    const missing = machines!.querySelector('.ia-xt-own')!;
    expect(missing.querySelector('.rk-tag-warn')).toHaveTextContent('Your course code: not added');
    expect(
      within(missing as HTMLElement).getByRole('link', {
        name: 'Add your course code for EEE ZC341 Electrical Machines',
      }),
    ).toHaveClass('rb-link');
    expect(machines!.querySelector('.ia-xt-none')).toHaveTextContent('None yet');
    expect(machines!.querySelector('.ia-xt-act')!.childElementCount).toBe(0);
    expectClean(container);
    await assertNoAxeViolations(container);
  });

  it('IA-03: the plan’s version, experiment and formats only, the semester beside the code', () => {
    for (const piece of [
      '<table class="ia-xt ia-xt--plan">',
      '<thead><tr><th scope="col">Experiment</th><th scope="col">Formats</th></tr></thead>',
      '<tr class="ia-xt-grp"><th colspan="2" scope="rowgroup" id="{{ c.hid }}">',
      '<sc-if value="{{ c.hasSem }}" hint-placeholder-val="{{ true }}"><span>{{ c.semText }}</span></sc-if>',
    ]) {
      expect(IA03).toContain(piece);
    }
    const { container } = render(
      <IaExperimentsTable
        plan
        caption="Experiments in your access plan, grouped by course, with the formats in your plan"
        headers={{ experiment: 'Experiment', formats: 'Formats' }}
        courses={[
          {
            key: 'thermo',
            code: 'ME ZG523',
            name: 'Thermodynamics & Heat Transfer',
            ownCode: { label: 'Your course code', code: 'MEC-523', semester: 'Sem II' },
            rows: [{ key: 'shell', name: 'Shell-and-Tube Heat Exchanger', formats }],
          },
        ]}
      />,
    );
    const table = screen.getByRole('table');
    expect(table).toHaveClass('ia-xt', 'ia-xt--plan');
    expect(table.querySelectorAll('thead th')).toHaveLength(2);
    expect(table.querySelector('.ia-xt-grp th')).toHaveAttribute('colspan', '2');
    expect(table.querySelector('.ia-xt-own')!.textContent).toBe('Your course codeMEC-523Sem II');
    expect(table.querySelector('.ia-xt-row')!.children).toHaveLength(2);
    expectClean(container);
  });
});

describe('IA-16 the course-code editor', () => {
  it('draws the editor beside its explainer, as the export draws it', async () => {
    for (const piece of [
      '<div class="ia-cc">',
      '<section class="rk-surface ia-cc-main" aria-labelledby="cc-h">',
      '<div class="ia-cc-head">',
      '<div><h2 class="rb-h2" id="cc-h">Course codes</h2><p class="ia-cc-sub" role="status">{{ V.countText }}</p></div>',
      '<label class="rk-check" for="cc-missing"><input id="cc-missing" type="checkbox"',
      '<li class="ia-cc-item">',
      '<div class="ia-cc-title"><h3 class="ia-cc-name">{{ r.name }}</h3>',
      '<div class="ia-cc-map">',
      '<div class="ia-cc-bits">',
      '<span class="ia-cc-lab">BITS course code</span>',
      '<span class="ia-cc-lock"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#rki-lock"></use></svg>{{ r.code }}</span>',
      '<span class="ia-cc-note">Set by BITS · read-only</span>',
      '<span class="ia-cc-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#rki-arrow"></use></svg></span>',
      '<label class="rk-label" for="{{ r.cid }}">Your course code</label>',
      '<label class="rk-label" for="{{ r.sid }}">Semester <span class="ia-cc-opt">(optional)</span></label>',
      '<span class="ia-cc-lab">Your course code</span><span class="ia-cc-ro">{{ r.roOwn }}</span>',
      '<p class="ia-cc-prev"><sc-if value="{{ r.hasPrev }}" hint-placeholder-val="{{ true }}"><span>Students and faculty see</span><span class="rk-owncode">{{ r.prev }}</span><b>{{ r.name }}</b></sc-if>',
      '<span>Add your code to show it to students and faculty with the course name.</span>',
      '<div class="ia-cc-save">',
      '<p class="{{ V.stateCls }}">{{ V.stateText }}</p>',
      '<aside aria-labelledby="cc-how-h">',
      '<section class="rk-surface ia-cc-help">',
      '<h2 class="ia-cc-help-h" id="cc-how-h">How course codes work</h2>',
    ]) {
      expect(IA16).toContain(piece);
    }
    expect(ROOT).toContain("stateCls: 'ia-cc-state' + (V.dirty ? ' is-dirty' : '')");
    const onToggle = vi.fn();
    const { container } = render(
      <IaCourseCodes
        titleId="cc-h"
        helpTitleId="cc-how-h"
        help={
          <IaCourseCodesHelp title="How course codes work" titleId="cc-how-h">
            <IaLines
              lines={[
                { key: 'bits', tone: 'off', icon: 'lock', children: 'The BITS course code …' },
              ]}
            />
          </IaCourseCodesHelp>
        }
      >
        <IaCourseCodesHead
          title="Course codes"
          titleId="cc-h"
          count="1 of 2 courses has no code from your institution"
          missingOnly={{
            id: 'cc-missing',
            label: 'Show missing codes only',
            checked: false,
            onChange: onToggle,
          }}
        />
        <IaCourseCodeList>
          <IaCourseCodeItem
            name="Thermodynamics & Heat Transfer"
            status={<StatusPill tone="ok">Added</StatusPill>}
            bits={{ label: 'BITS course code', code: 'ME ZG523', note: 'Set by BITS · read-only' }}
            code={<IaCourseCodeValue label="Your course code" value="MEC-523" />}
            semester={
              <IaCourseCodeValue
                label={
                  <>
                    Semester <IaOptional>(optional)</IaOptional>
                  </>
                }
                value="Sem II"
              />
            }
            preview={{
              lead: 'Students and faculty see',
              code: 'MEC-523',
              course: 'Thermodynamics & Heat Transfer',
            }}
          />
          <IaCourseCodeItem
            name="Electrical Machines"
            status={<StatusPill tone="warn">Missing</StatusPill>}
            bits={{ label: 'BITS course code', code: 'EEE ZC341', note: 'Set by BITS · read-only' }}
            code={<IaCourseCodeValue label="Your course code" value="Not added" />}
            semester={<IaCourseCodeValue label="Semester" value="—" />}
            preview={{
              empty: 'Add your code to show it to students and faculty with the course name.',
            }}
          />
        </IaCourseCodeList>
        <IaCourseCodeSave
          state="You have unsaved changes"
          dirty
          undo={<Button size="lg">Undo changes</Button>}
          save={
            <Button variant="primary" size="lg">
              Save course codes
            </Button>
          }
        />
      </IaCourseCodes>,
    );
    const editor = screen.getByRole('region', { name: 'Course codes' });
    expect(editor).toHaveClass('rk-surface', 'ia-cc-main');
    expect(editor.parentElement).toHaveClass('ia-cc');
    expect(editor.querySelector('.ia-cc-sub')).toHaveAttribute('role', 'status');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Show missing codes only' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
    const [added, missing] = [...editor.querySelectorAll('li.ia-cc-item')];
    expect(added!.querySelector('h3.ia-cc-name')).toHaveTextContent(
      'Thermodynamics & Heat Transfer',
    );
    expect(pathOf(added!.querySelector('.ia-cc-lock'))).toBe(V3_ICON_PATHS.lock);
    expect(pathOf(added!.querySelector('.ia-cc-arrow'))).toBe(V3_ICON_PATHS.next);
    expect(added!.querySelector('.ia-cc-prev')!.textContent).toBe(
      'Students and faculty seeMEC-523Thermodynamics & Heat Transfer',
    );
    expect(added!.querySelector('.ia-cc-opt')).toHaveTextContent('(optional)');
    expect(missing!.querySelector('.ia-cc-prev span')).toHaveTextContent(/^Add your code/);
    expect(missing!.querySelector('.ia-cc-ro')).toHaveTextContent('Not added');
    const save = editor.querySelector('.ia-cc-save')!;
    expect(save.querySelector('.ia-cc-state')).toHaveClass('is-dirty');
    expect(
      within(save as HTMLElement)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Undo changes', 'Save course codes']);
    const help = screen.getByRole('complementary', { name: 'How course codes work' });
    expect(help.querySelector('.ia-cc-help .ia-lines li.is-off')).toBeInTheDocument();
    expectClean(container);
    await assertNoAxeViolations(container);
  });

  it('the save bar without changes has no Undo; one course has no missing-only toggle', () => {
    const { container } = render(
      <>
        <IaCourseCodesHead
          title="Course codes"
          titleId="cc-h"
          count="Your institution’s code is added"
        />
        <IaCourseCodeSave
          state="No unsaved changes"
          dirty={false}
          undo={<Button>Undo changes</Button>}
          save={<Button variant="primary">Save course code</Button>}
        />
      </>,
    );
    expect(container.querySelector('.rk-check')).toBeNull();
    expect(container.querySelector('.ia-cc-state')).not.toHaveClass('is-dirty');
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Save course code',
    ]);
  });
});

describe('IA-20 the view switch and a usage row’s format', () => {
  it('switches the view with aria-pressed and no counts', async () => {
    expect(IA20).toContain(
      '<div class="rb-switchbar"><div class="rb-switch" role="group" aria-label="View usage"><button type="button" aria-pressed="{{ V.expPressed }}"',
    );
    expect(IA20).toContain(
      '<td class="ia-lt-main"><span class="ia-cell-line"><span class="xr-fmt">{{ r.code }}</span><span class="ia-cell-t">{{ r.name }}</span></span></td>',
    );
    const onChange = vi.fn();
    const { container } = render(
      <>
        <IaViewSwitch
          label="View usage"
          options={[
            { key: 'experiment', label: 'By experiment and format' },
            { key: 'course', label: 'By course' },
          ]}
          value="experiment"
          onChange={onChange}
        />
        <IaUsageFormat code="WEB" name="Browser" />
      </>,
    );
    const group = screen.getByRole('group', { name: 'View usage' });
    expect(group).toHaveClass('rb-switch');
    expect(group.parentElement).toHaveClass('rb-switchbar');
    const [byExperiment, byCourse] = within(group).getAllByRole('button');
    expect(byExperiment).toHaveAttribute('aria-pressed', 'true');
    expect(byCourse).toHaveAttribute('aria-pressed', 'false');
    expect(group.querySelector('b')).toBeNull();
    fireEvent.click(byCourse!);
    expect(onChange).toHaveBeenCalledWith('course');
    const line = container.querySelector('.ia-cell-line')!;
    expect(line.querySelector('.xr-fmt')).toHaveTextContent('WEB');
    expect(line.querySelector('.ia-cell-t')).toHaveTextContent('Browser');
    expectClean(container);
    await assertNoAxeViolations(container);
  });
});
