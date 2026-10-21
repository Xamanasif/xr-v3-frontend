/**
 * What only the Faculty teaching screens draw (owner-approved export design/v3-refined-b/roles/FA-v1,
 * `project/Main.dc.html` FA-01 … FA-05): markup against the export's classes, structure and ARIA
 * (excerpts of its template), the class contract, the accessibility checks and no internal
 * reference anywhere a piece draws.
 */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  assertNoAxeViolations,
  expectNoInternalReferences,
  expectV3ClassesOnly,
  faExportText,
} from '../testing/index.js';
import { FaFigure, FaFigures, FaFormatBadges, FaProgress, FaWaitLine } from './fa.js';
import {
  FaCourseCard,
  FaCourseCount,
  FaCourseExperiment,
  FaCourseExperimentActions,
  FaCourseExperiments,
  FaCourseFoot,
  FaCourseLedger,
  FaCourseRow,
  FaExperimentAbout,
  FaExperimentAboutGrid,
  FaExperimentHint,
  FaExperimentSection,
  FaExperimentsFormats,
  FaOverviewCalm,
  FaOverviewCourse,
  FaOverviewDeadlines,
  FaOverviewExperiment,
  FaOverviewGetReady,
  FaOverviewGrid,
  FaOverviewNoDeadlines,
  FaOverviewPane,
  FaOverviewPriority,
  type FaOverviewPriorityItem,
  FaTeachingActivityFoot,
} from './fa-teaching.js';
import { V3_ICON_PATHS } from './icons.js';
import { StatusPill } from './status.js';

const ROOT = faExportText('Main.dc.html');
const TEMPLATE = ROOT.slice(0, ROOT.indexOf('<script type="text/x-dc"'));
const section = (from: string, to: string) =>
  TEMPLATE.slice(TEMPLATE.indexOf(from), TEMPLATE.indexOf(to));
const FA01 = section('<!-- ═══ FA-01 Overview', '<!-- ═══ FA-02 My courses');
const FA02 = section('<!-- ═══ FA-02 My courses', '<!-- ═══ FA-03 Course');
const FA03 = section('<!-- ═══ FA-03 Course', '<!-- ═══ FA-05 Experiment');
const FA05 = section('<!-- ═══ FA-05 Experiment', '<!-- ═══ FA-06 Assessments');

/** The Faculty role's internal references too (the owner's identifier rule, 21 Oct 2026). */
const FACULTY_REFERENCE = /\b(?:ASMT|ATT|Q|D)-\d+/;

function expectClean(container: HTMLElement) {
  expectV3ClassesOnly(container);
  expectNoInternalReferences(container);
  expect(container.textContent).not.toMatch(FACULTY_REFERENCE);
  for (const element of container.querySelectorAll('[aria-label]')) {
    expect(element.getAttribute('aria-label')).not.toMatch(FACULTY_REFERENCE);
  }
}

const pathOf = (element: Element | null) => element?.querySelector('path')?.getAttribute('d');

const WRITTEN: FaOverviewPriorityItem = {
  key: 'written',
  when: { big: '2', relative: 'Oldest waiting 2 days' },
  kind: { icon: 'pen', label: 'Written answers to mark' },
  title: 'Heat Exchanger — post-lab',
  description: 'Choice questions are marked automatically.',
  list: {
    label: 'Waiting for marking, oldest first',
    rows: [
      { key: 'a', name: 'Rahul Verma', detail: '5 Nov, 18:52' },
      { key: 'b', name: 'Priya Natarajan', detail: '6 Nov, 20:10' },
    ],
  },
  action: {
    href: '/faculty/marking/oldest',
    label: 'Mark now',
    accessibleName: 'Mark now: Rahul Verma, Heat Exchanger — post-lab',
    primary: true,
  },
};
const INACTIVE: FaOverviewPriorityItem = {
  key: 'inactive',
  when: { big: '2', relative: 'Inactive 14 days or more', calm: true },
  kind: { icon: 'people', label: 'Students to follow up' },
  title: 'Shell-and-Tube Heat Exchanger',
  list: {
    label: 'Students inactive for 14 days or more, longest first',
    rows: [
      { key: 'k', name: 'Karthik Rao', detail: 'No activity since access, 12 Oct' },
      { key: 'i', name: 'Imran Shaikh', detail: 'Last active 19 Oct' },
    ],
    more: 'and 1 more in Students',
  },
  action: {
    href: '/faculty/students?experimentId=x',
    label: 'View students',
    accessibleName: 'View students inactive for 14 days or more',
  },
};

describe('FA-01 Overview pieces', () => {
  it('the priority band is drawn as the export draws it, sized to its items', async () => {
    for (const piece of [
      '<section class="{{ OV.prioCls }}" aria-labelledby="fa-att-h">',
      '<div class="rb-sec-head">',
      '<h2 class="rb-h2" id="fa-att-h">Needs your attention</h2>',
      '<ol class="rb-prio-list">',
      '<li class="rb-pi">',
      '<p class="rb-pi-when"><span class="rb-pi-big">{{ a.big }}</span><span class="{{ a.relCls }}">{{ a.rel }}</span></p>',
      '<h3 class="rb-pi-title">{{ a.title }}</h3>',
      '<p class="rb-pi-d">{{ a.d }}</p>',
      '<ul class="fa-pi-list" aria-label="{{ a.listAria }}">',
      '<li><b>{{ p.n }}</b><span>{{ p.w }}</span></li>',
      '<li class="fa-pi-more">{{ a.more }}</li>',
      '<div class="rb-pi-act"><a class="{{ a.btnCls }}" href="{{ a.href }}" onClick="{{ a.go }}" aria-label="{{ a.aria }}">{{ a.act }}</a></div>',
    ]) {
      expect(FA01).toContain(piece);
    }
    expect(ROOT).toContain("prioCls: 'rb-prio fa-prio fa-prio--' + att.length");

    const { container, rerender } = render(
      <FaOverviewPriority
        title="Needs your attention"
        titleId="fa-att-h"
        note="Marking first · oldest first in each"
        items={[WRITTEN, INACTIVE]}
      />,
    );
    const band = screen.getByRole('region', { name: 'Needs your attention' });
    // `fa-prio` alone is defined by no sheet: the band is `rb-prio` with its size modifier.
    expect(band.className).toBe('rb-prio fa-prio--2');
    expect(band.querySelector('.rb-sec-head .rb-note')).toHaveTextContent(
      'Marking first · oldest first in each',
    );
    const [written, inactive] = [...band.querySelectorAll('li.rb-pi')] as HTMLElement[];
    expect(written!.querySelector('.rb-pi-rel')!.className).toBe('rb-pi-rel');
    expect(inactive!.querySelector('.rb-pi-rel')).toHaveClass('rb-pi-rel', 'rb-pi-rel--calm');
    expect(pathOf(written!.querySelector('.rb-pi-kind'))).toBe(V3_ICON_PATHS.pen);
    expect(pathOf(inactive!.querySelector('.rb-pi-kind'))).toBe(V3_ICON_PATHS.people);
    expect(written!.querySelector('.rb-pi-kind svg')).toHaveAttribute('aria-hidden', 'true');
    const list = within(written!).getByRole('list', { name: 'Waiting for marking, oldest first' });
    expect(list).toHaveClass('fa-pi-list');
    expect(list.querySelector('li')!.innerHTML).toBe('<b>Rahul Verma</b><span>5 Nov, 18:52</span>');
    expect(inactive!.querySelector('li.fa-pi-more')).toHaveTextContent('and 1 more in Students');
    expect(inactive!.querySelector('.rb-pi-d')).toBeNull();
    const mark = within(written!).getByRole('link', {
      name: 'Mark now: Rahul Verma, Heat Exchanger — post-lab',
    });
    expect(mark.className).toBe('rb-btn rb-btn--primary rb-btn--lg');
    expect(mark).toHaveAttribute('href', '/faculty/marking/oldest');
    expect(
      within(inactive!).getByRole('link', { name: 'View students inactive for 14 days or more' })
        .className,
    ).toBe('rb-btn rb-btn--lg');
    expectClean(container);
    await assertNoAxeViolations(container);

    rerender(
      <FaOverviewPriority title="Needs your attention" titleId="fa-att-h" items={[INACTIVE]} />,
    );
    expect(screen.getByRole('region').className).toBe('rb-prio fa-prio--1');
    expect(screen.getByRole('region').querySelector('.rb-note')).toBeNull();
    rerender(
      <FaOverviewPriority
        title="Needs your attention"
        titleId="fa-att-h"
        items={[WRITTEN, INACTIVE, { ...INACTIVE, key: 'third' }]}
      />,
    );
    expect(screen.getByRole('region').className).toBe('rb-prio');
  });

  it('the calm state and “Get your course ready”', async () => {
    expect(FA01).toContain(
      '<div class="rb-calm fa-calm" role="status"><span class="rb-calm-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#fai-check"></use></svg></span><p class="rb-calm-t">Nothing needs you right now</p><p class="rb-calm-d">Written answers to mark, drafts to review and inactive students appear here.</p></div>',
    );
    for (const piece of [
      '<section class="fa-ready" aria-labelledby="fa-ready-h">',
      '<ol class="fa-ready-list">',
      '<li class="fa-ready-i">',
      '<p class="fa-ready-n"><b aria-hidden="true">{{ g.n }}</b><span>{{ g.kind }}</span></p>',
      '<h3 class="fa-ready-t">{{ g.t }}</h3>',
      '<p class="fa-ready-d">{{ g.d }}</p>',
      '<div class="fa-ready-act"><a class="{{ g.btnCls }}" href="{{ g.href }}" onClick="{{ g.go }}">{{ g.act }}</a></div>',
    ]) {
      expect(FA01).toContain(piece);
    }
    const { container } = render(
      <>
        <FaOverviewCalm title="Nothing needs you right now">
          Written answers to mark, drafts to review and inactive students appear here.
        </FaOverviewCalm>
        <FaOverviewGetReady
          title="Get your course ready"
          titleId="fa-ready-h"
          note="For Shell-and-Tube Heat Exchanger"
          steps={[
            {
              key: 'bank',
              number: '1',
              kind: 'Question bank',
              title: 'Write questions',
              description: 'Your question bank is empty.',
              action: {
                href: '/faculty/question-bank/new',
                label: 'Add a question',
                primary: true,
              },
            },
            {
              key: 'experiment',
              number: '2',
              kind: 'Experiment',
              title: 'Look at the experiment',
              description: 'See the formats your institution has.',
              action: { href: '/faculty/experiments/x', label: 'Open experiment' },
            },
          ]}
        />
      </>,
    );
    const calm = screen.getByRole('status');
    expect(calm.className).toBe('rb-calm fa-calm');
    expect(calm.querySelector('.rb-calm-ico')).toHaveAttribute('aria-hidden', 'true');
    expect(pathOf(calm.querySelector('.rb-calm-ico'))).toBe(V3_ICON_PATHS.check);
    expect(calm.querySelector('.rb-calm-t')).toHaveTextContent('Nothing needs you right now');
    const ready = screen.getByRole('region', { name: 'Get your course ready' });
    expect(ready.className).toBe('fa-ready');
    expect(ready.querySelector('.rb-note')).toHaveTextContent('For Shell-and-Tube Heat Exchanger');
    const steps = [...ready.querySelectorAll('ol.fa-ready-list > li.fa-ready-i')];
    expect(steps).toHaveLength(2);
    expect(steps[0]!.querySelector('.fa-ready-n')!.innerHTML).toBe(
      '<b aria-hidden="true">1</b><span>Question bank</span>',
    );
    expect(within(ready).getByRole('link', { name: 'Add a question' }).className).toBe(
      'rb-btn rb-btn--primary rb-btn--lg',
    );
    expect(within(ready).getByRole('link', { name: 'Open experiment' }).className).toBe(
      'rb-btn rb-btn--lg',
    );
    expectClean(container);
    await assertNoAxeViolations(container);
  });

  it('Coming up: the date tile, days left, the submissions meter or who created it, the release rule', async () => {
    for (const piece of [
      '<div class="fa-ovgrid">',
      '<section class="rb-panel fa-pane" aria-labelledby="fa-up-h">',
      '<div class="fa-pane-head"><h2 class="rb-h2" id="fa-up-h">Coming up</h2><p class="rb-note">Next 30 days</p></div>',
      '<ul class="fa-uplist">',
      '<li class="fa-upi">',
      '<span class="fa-date" aria-hidden="true"><b>{{ u.dd }}</b><span>{{ u.mon }}</span></span>',
      '<p class="fa-upi-t"><a href="#FA-08" onClick="{{ u.go }}" aria-label="{{ u.aria }}">{{ u.t }}</a></p>',
      '<p class="fa-upi-d">{{ u.d1 }} · <b>{{ u.left }}</b></p>',
      '<div class="fa-upi-meter">',
      '<p>{{ u.subs }}</p>',
      '<p class="fa-upi-d">{{ u.by }}</p>',
      '<p class="fa-upi-rel"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#fai-clock"></use></svg><span>{{ u.rel }}</span></p>',
      '<p class="fa-upi-none">{{ OV.noUpText }}</p>',
    ]) {
      expect(FA01).toContain(piece);
    }
    const { container } = render(
      <FaOverviewGrid>
        <FaOverviewPane title="Coming up" titleId="fa-up-h" note="Next 30 days">
          <FaOverviewDeadlines
            items={[
              {
                key: 'a',
                day: '14',
                month: 'Nov',
                title: 'Heat Exchanger — post-lab',
                href: '/faculty/assessments/a',
                accessibleName: 'Open Heat Exchanger — post-lab, due 14 Nov 2026, 23:59',
                due: 'Due 14 Nov 2026, 23:59',
                left: '7 days left',
                submissions: {
                  units: ['submitted', 'submitted', 'none', 'none', 'none'],
                  line: '2 of 5 students submitted',
                },
                release: 'Students see results after the deadline',
              },
              {
                key: 'b',
                day: '20',
                month: 'Nov',
                title: 'Venturi Meter — quiz',
                href: '/faculty/assessments/b',
                accessibleName: 'Open Venturi Meter — quiz, due 20 Nov 2026, 23:59',
                due: 'Due 20 Nov 2026, 23:59',
                left: '13 days left',
                createdBy: 'Created by Dr Anita Desai',
              },
            ]}
          />
        </FaOverviewPane>
        <FaOverviewPane title="Your teaching" titleId="fa-teach-h">
          <FaOverviewNoDeadlines>No deadlines in the next 30 days.</FaOverviewNoDeadlines>
        </FaOverviewPane>
      </FaOverviewGrid>,
    );
    expect(container.firstElementChild!.className).toBe('fa-ovgrid');
    const pane = screen.getByRole('region', { name: 'Coming up' });
    expect(pane.className).toBe('rb-panel fa-pane');
    const [own, colleague] = [...pane.querySelectorAll('li.fa-upi')];
    expect(own!.querySelector('.fa-date')!.outerHTML).toBe(
      '<span class="fa-date" aria-hidden="true"><b>14</b><span>Nov</span></span>',
    );
    expect(own!.querySelector('.fa-upi-d')!.innerHTML).toBe(
      'Due 14 Nov 2026, 23:59 · <b>7 days left</b>',
    );
    expect(own!.querySelectorAll('.fa-upi-meter .fa-units > i.is-sub')).toHaveLength(2);
    expect(own!.querySelectorAll('.fa-upi-meter .fa-units > i')).toHaveLength(5);
    expect(own!.querySelector('.fa-upi-meter p')).toHaveTextContent('2 of 5 students submitted');
    expect(pathOf(own!.querySelector('.fa-upi-rel'))).toBe(V3_ICON_PATHS.clock);
    expect(colleague!.querySelector('.fa-upi-meter')).toBeNull();
    expect([...colleague!.querySelectorAll('p.fa-upi-d')][1]).toHaveTextContent(
      'Created by Dr Anita Desai',
    );
    expect(colleague!.querySelector('.fa-upi-rel')).toBeNull();
    expect(
      within(pane).getByRole('link', {
        name: 'Open Heat Exchanger — post-lab, due 14 Nov 2026, 23:59',
      }),
    ).toHaveAttribute('href', '/faculty/assessments/a');
    expect(container.querySelector('p.fa-upi-none')).toHaveTextContent(
      'No deadlines in the next 30 days.',
    );
    expectClean(container);
    await assertNoAxeViolations(container);
  });

  it('Your teaching: the course head and each experiment with formats, reach, meters and assessment', async () => {
    for (const piece of [
      '<div class="fa-tc">',
      '<div class="fa-tc-h"><span class="rb-code">{{ c.code }}</span><h3 class="fa-tc-t">{{ c.t }}</h3><a class="rb-link" href="#FA-03" onClick="{{ c.go }}" aria-label="{{ c.aria }}">Open course</a></div>',
      '<div class="fa-te">',
      '<div class="fa-te-h"><a class="fa-exp-link fa-te-t" href="#FA-05" onClick="{{ e.go }}">{{ e.t }}</a><span class="rk-fmts" aria-label="{{ e.fmAria }}">',
      '<span class="fa-te-n">{{ e.reach }}</span></div>',
      '<p class="fa-quiet">No students yet. They appear when your Institute Admin gives them access.</p>',
      '<p class="fa-te-asm"><span class="{{ e.stCls }}"><i></i>{{ e.stLabel }}</span><sc-if value="{{ e.hasAsmName }}" hint-placeholder-val="{{ true }}"><span>{{ e.asmName }}</span></sc-if></p>',
    ]) {
      expect(FA01).toContain(piece);
    }
    const { container } = render(
      <FaOverviewCourse
        code="ME ZG523"
        title="Thermodynamics & Heat Transfer"
        open={{
          href: '/faculty/courses/thermo',
          label: 'Open course',
          accessibleName: 'Open course ME ZG523 Thermodynamics & Heat Transfer',
        }}
      >
        <FaOverviewExperiment
          title="Shell-and-Tube Heat Exchanger"
          href="/faculty/experiments/shell"
          formats={
            <FaFormatBadges formats={['WEB', 'VR']} label="Formats your institution has: WEB, VR" />
          }
          reach="5 students with access"
          activity={
            <FaProgress
              label="Student activity by format for Shell-and-Tube Heat Exchanger, as of 7 Nov 2026"
              rows={[
                {
                  format: 'WEB',
                  completed: 2,
                  inProgress: 2,
                  notStarted: 1,
                  units: ['done', 'done', 'progress', 'progress', 'none'],
                },
              ]}
              words={{
                completed: 'completed',
                inProgress: 'in progress',
                notStarted: 'not started',
              }}
            />
          }
          status={<StatusPill tone="ok">Assessment ready</StatusPill>}
          assessment="Heat Exchanger — post-lab"
        />
      </FaOverviewCourse>,
    );
    const course = container.querySelector('.fa-tc')!;
    expect(course.querySelector('.fa-tc-h .rb-code')).toHaveTextContent('ME ZG523');
    expect(
      screen.getByRole('link', { name: 'Open course ME ZG523 Thermodynamics & Heat Transfer' })
        .className,
    ).toBe('rb-link');
    const experiment = course.querySelector('.fa-te')!;
    expect(screen.getByRole('link', { name: 'Shell-and-Tube Heat Exchanger' }).className).toBe(
      'fa-exp-link fa-te-t',
    );
    expect(experiment.querySelector('.fa-te-h .fa-te-n')).toHaveTextContent(
      '5 students with access',
    );
    expect(experiment.querySelector('ul.fa-prog')).not.toBeNull();
    expect(experiment.querySelector('p.fa-te-asm')!.innerHTML).toBe(
      '<span class="xr-st xr-st--ok"><i></i>Assessment ready</span><span>Heat Exchanger — post-lab</span>',
    );
    expectClean(container);
    await assertNoAxeViolations(container);
  });
});

describe('FA-02 My courses: the course ledger', () => {
  it('is drawn as the export draws it: the count, the card head with figures, the aligned rows', async () => {
    for (const piece of [
      '<p class="rk-count fa-listcount" role="status">{{ CR.count }}</p>',
      '<div class="fa-courses">',
      '<section class="fa-course" aria-labelledby="{{ c.hid }}">',
      '<div class="fa-course-h">',
      '<div class="fa-course-id">',
      '<span class="rb-code">{{ c.code }}</span>',
      '<h3 class="fa-course-t" id="{{ c.hid }}">{{ c.t }}</h3>',
      '<p class="fa-course-src">{{ c.src }}</p>',
      '<div class="fa-course-act"><a class="rb-btn" href="#FA-03" onClick="{{ c.go }}" aria-label="{{ c.aria }}">Open course</a></div>',
      '<div class="fa-course-body">',
      '<div class="fa-xcols fa-xhead" aria-hidden="true"><span>Experiment and formats your institution has</span><span>Students</span><span>Assessment</span></div>',
      '<ul class="fa-xrows" aria-label="{{ c.listAria }}">',
      '<li class="fa-xcols fa-xrow">',
      '<div class="fa-xcell fa-xname"><a class="fa-exp-link fa-xt" href="#FA-05" onClick="{{ e.go }}">{{ e.t }}</a>',
      '<div class="fa-xcell"><span class="fa-k fa-hidden-lbl">Students</span>{{ e.reach }}</div>',
      '<div class="fa-xcell fa-xasm fa-xasm-c"><span class="fa-k fa-hidden-lbl">Assessment</span>',
      '<span class="fa-xasm-n">{{ e.asmName }}</span><span class="fa-xasm-d">{{ e.asmD }}</span>',
      '<p class="fa-foot">Courses come from Faculty courses, set by your Institute Admin. Only experiments your institution holds are listed.</p>',
    ]) {
      expect(FA02).toContain(piece);
    }
    const { container } = render(
      <>
        <FaCourseCount>1 course · 1 experiment</FaCourseCount>
        <FaCourseLedger>
          <FaCourseCard
            code="ME ZG523"
            title="Thermodynamics & Heat Transfer"
            titleId="fa-c-thermo"
            source="Assigned to you by your Institute Admin"
            figures={
              <FaFigures>
                <FaFigure term="Experiments" value={1} />
                <FaFigure term="Students with access" value={5} />
                <FaFigure term="Assessments" value={1} />
              </FaFigures>
            }
            open={{
              href: '/faculty/courses/thermo',
              label: 'Open course',
              accessibleName: 'Open course ME ZG523 Thermodynamics & Heat Transfer',
            }}
            columns={['Experiment and formats your institution has', 'Students', 'Assessment']}
            listLabel="Experiments in ME ZG523"
          >
            <FaCourseRow
              title="Shell-and-Tube Heat Exchanger"
              href="/faculty/experiments/shell"
              formats={
                <FaFormatBadges
                  formats={['WEB', 'VR']}
                  label="Formats your institution has: WEB, VR"
                />
              }
              labels={{ students: 'Students', assessment: 'Assessment' }}
              students="5 with access"
              status={<StatusPill tone="ok">Assessment ready</StatusPill>}
              assessment="Heat Exchanger — post-lab"
              detail="Due 14 Nov 2026, 23:59"
              waiting={<FaWaitLine>2 written answers waiting for marking</FaWaitLine>}
            />
            <FaCourseRow
              title="Venturi Meter"
              href="/faculty/experiments/venturi"
              formats={
                <FaFormatBadges formats={['WEB']} label="Formats your institution has: WEB" />
              }
              labels={{ students: 'Students', assessment: 'Assessment' }}
              students="None yet"
              status={<StatusPill tone="neutral">No assessment yet</StatusPill>}
              detail="Create one from the experiment page."
            />
          </FaCourseCard>
        </FaCourseLedger>
        <FaCourseFoot>Courses come from Faculty courses.</FaCourseFoot>
      </>,
    );
    expect(container.querySelector('p.fa-listcount')).toHaveAttribute('role', 'status');
    const courseCard = screen.getByRole('region', { name: 'Thermodynamics & Heat Transfer' });
    expect(courseCard.className).toBe('fa-course');
    expect(courseCard.parentElement!.className).toBe('fa-courses');
    expect(courseCard.querySelector('.fa-course-h > dl.fa-figs')).not.toBeNull();
    expect(
      within(courseCard).getByRole('link', {
        name: 'Open course ME ZG523 Thermodynamics & Heat Transfer',
      }).className,
    ).toBe('rb-btn');
    expect(courseCard.querySelector('.fa-xhead')).toHaveAttribute('aria-hidden', 'true');
    const rows = within(courseCard).getByRole('list', { name: 'Experiments in ME ZG523' });
    const [first, second] = [...rows.querySelectorAll('li.fa-xcols.fa-xrow')];
    expect(first!.querySelector('.fa-xname a')!.className).toBe('fa-exp-link fa-xt');
    expect(first!.querySelector('.fa-xasm')!.className).toBe('fa-xcell fa-xasm fa-xasm-c');
    expect(first!.querySelector('.fa-xasm .fa-xwait')).toHaveTextContent(
      '2 written answers waiting for marking',
    );
    expect(second!.querySelector('.fa-xasm-n')).toBeNull();
    expect(second!.querySelector('.fa-xasm-d')).toHaveTextContent(
      'Create one from the experiment page.',
    );
    expect(container.querySelector('p.fa-foot')).toHaveTextContent(
      'Courses come from Faculty courses.',
    );
    expectClean(container);
    await assertNoAxeViolations(container);
  });
});

describe('FA-03 Course: the experiment panels', () => {
  it('is drawn as the export draws it: identity, Student activity beside Assessment', async () => {
    for (const piece of [
      '<div class="rb-sec-head"><h2 class="rb-h2" id="fa-c1-h">Experiments</h2><p class="rb-note">Only experiments your institution holds</p></div>',
      '<div class="fa-xps">',
      '<article class="rk-surface fa-xp" aria-labelledby="{{ e.hid }}">',
      '<div class="fa-xp-head">',
      '<div class="fa-xp-id">',
      '<h3 class="fa-xp-t" id="{{ e.hid }}">{{ e.t }}</h3>',
      '<p class="fa-xp-about">{{ e.about }}</p>',
      '<p class="fa-xp-fm"><span class="fa-k">Formats your institution has</span>',
      '<a class="rb-btn" href="#FA-05" onClick="{{ e.go }}" aria-label="{{ e.openAria }}">Open experiment</a>',
      '<div class="fa-xp-body">',
      '<section class="fa-xp-col" aria-labelledby="{{ e.actH }}">',
      '<div class="fa-xp-colh"><h4 class="rk-h3" id="{{ e.actH }}">Student activity, by format</h4><p class="rk-hint">{{ e.asOf }}</p></div>',
      '<p class="fa-xp-foot"><span>{{ e.reach }}</span><a class="rb-link" href="#FA-20" onClick="{{ e.goStu }}">Students on this experiment</a></p>',
      '<div class="fa-xp-colh"><h4 class="rk-h3" id="{{ e.asmH }}">Assessment</h4><span class="{{ e.stCls }}"><i></i>{{ e.stLabel }}</span></div>',
      '<div class="fa-xp-acts">',
    ]) {
      expect(FA03).toContain(piece);
    }
    // The export lays the section out with an inline style, which is not drawn (central patch).
    expect(FA03).toContain(
      '<section aria-labelledby="fa-c1-h" style="display: flex; flex-direction: column; gap: 16px">',
    );
    const { container } = render(
      <FaCourseExperiments
        title="Experiments"
        titleId="fa-c1-h"
        note="Only experiments your institution holds"
      >
        <FaCourseExperiment
          title="Shell-and-Tube Heat Exchanger"
          titleId="fa-c1-shell"
          about="Vary flow rates and inlet temperatures."
          formats={{
            label: 'Formats your institution has',
            badges: (
              <FaFormatBadges
                formats={['WEB', 'VR']}
                label="Formats your institution has: WEB, VR"
              />
            ),
          }}
          open={{
            href: '/faculty/experiments/shell',
            label: 'Open experiment',
            accessibleName: 'Open experiment Shell-and-Tube Heat Exchanger',
          }}
          activity={{
            title: 'Student activity, by format',
            titleId: 'fa-c1-act-shell',
            hint: 'As of 7 Nov 2026',
            children: (
              <FaTeachingActivityFoot
                link={{
                  href: '/faculty/students?experimentId=shell',
                  label: 'Students on this experiment',
                }}
              >
                5 students with access
              </FaTeachingActivityFoot>
            ),
          }}
          assessment={{
            title: 'Assessment',
            titleId: 'fa-c1-asm-shell',
            status: <StatusPill tone="ok">Ready</StatusPill>,
            children: (
              <FaCourseExperimentActions>
                <a className="rb-btn" href="/faculty/assessments/a">
                  Open assessment
                </a>
              </FaCourseExperimentActions>
            ),
          }}
        />
      </FaCourseExperiments>,
    );
    const section = screen.getByRole('region', { name: 'Experiments' });
    expect(section.getAttribute('style')).toBeNull();
    expect(section.querySelector(':scope > .rb-sec-head .rb-note')).toHaveTextContent(
      'Only experiments your institution holds',
    );
    const panel = within(section).getByRole('article', { name: 'Shell-and-Tube Heat Exchanger' });
    expect(panel.className).toBe('rk-surface fa-xp');
    expect(panel.parentElement!.className).toBe('fa-xps');
    expect(panel.querySelector('.fa-xp-id .fa-xp-about')).toHaveTextContent(
      'Vary flow rates and inlet temperatures.',
    );
    expect(panel.querySelector('.fa-xp-fm .fa-k')).toHaveTextContent(
      'Formats your institution has',
    );
    expect(
      within(panel).getByRole('link', { name: 'Open experiment Shell-and-Tube Heat Exchanger' })
        .className,
    ).toBe('rb-btn');
    const activity = within(panel).getByRole('region', { name: 'Student activity, by format' });
    expect(activity.className).toBe('fa-xp-col');
    expect(activity.querySelector('.fa-xp-colh h4.rk-h3')).not.toBeNull();
    expect(activity.querySelector('.fa-xp-colh .rk-hint')).toHaveTextContent('As of 7 Nov 2026');
    expect(activity.querySelector('p.fa-xp-foot')!.innerHTML).toBe(
      '<span>5 students with access</span><a class="rb-link" href="/faculty/students?experimentId=shell">Students on this experiment</a>',
    );
    const assessment = within(panel).getByRole('region', { name: 'Assessment' });
    expect(assessment.querySelector('.fa-xp-colh > .xr-st')).toHaveTextContent('Ready');
    expect(assessment.querySelector('.fa-xp-acts > a')).toHaveTextContent('Open assessment');
    expectClean(container);
    await assertNoAxeViolations(container);
  });
});

describe('FA-04 and FA-05 pieces', () => {
  it('FA-04: the formats line under the experiment’s name', async () => {
    expect(TEMPLATE).toContain(
      '<span class="fa-cellfm"><span class="fa-k">Formats your institution has</span><span class="rk-fmts" aria-label="{{ r.fmAria }}">',
    );
    const { container } = render(
      <FaExperimentsFormats
        label="Formats your institution has"
        badges={<FaFormatBadges formats={['WEB']} label="Formats your institution has: WEB" />}
      />,
    );
    const line = container.querySelector('span.fa-cellfm')!;
    expect(line.firstElementChild!.outerHTML).toBe(
      '<span class="fa-k">Formats your institution has</span>',
    );
    expect(
      within(line as HTMLElement).getByRole('img', { name: 'Formats your institution has: WEB' }),
    ).toHaveClass('rk-fmts');
    expectClean(container);
    await assertNoAxeViolations(container);
  });

  it('FA-05: the sheet’s sections, About and its grid, and the read-only note', async () => {
    for (const piece of [
      '<section class="rk-sec" aria-labelledby="fa-e1-act">',
      '<div class="rk-sec-h"><h2 class="rb-h2" id="fa-e1-act">Student activity, by format</h2><p class="rk-hint">{{ E1.asOf }}</p></div>',
      '<section class="rk-sec" aria-labelledby="fa-e1-about">',
      '<h2 class="rb-h2" id="fa-e1-about">About this experiment</h2>',
      '<p class="fa-about">{{ E1.about }}</p>',
      '<div class="fa-aboutgrid">',
      '<h3 class="rk-h3">Learning outcomes</h3>',
      '<h3 class="rk-h3">Resources students see</h3>',
    ]) {
      expect(FA05).toContain(piece);
    }
    // The note's inline `margin-top: 12px` is not drawn (central patch).
    expect(FA05).toContain(
      '<p class="rk-hint" style="margin-top: 12px">One set of outcomes for the experiment, written by the Academic Reviewer. Read-only here.</p>',
    );
    const { container } = render(
      <>
        <FaExperimentSection
          title="Student activity, by format"
          titleId="fa-e1-act"
          hint="As of 7 Nov 2026"
        >
          <p>meters</p>
        </FaExperimentSection>
        <FaExperimentSection title="About this experiment" titleId="fa-e1-about">
          <FaExperimentAbout>Vary flow rates.</FaExperimentAbout>
          <FaExperimentAboutGrid
            columns={[
              {
                key: 'outcomes',
                title: 'Learning outcomes',
                children: <FaExperimentHint>Read-only here.</FaExperimentHint>,
              },
              { key: 'resources', title: 'Resources students see', children: <p>Lab brief</p> },
            ]}
          />
        </FaExperimentSection>
      </>,
    );
    const activity = screen.getByRole('region', { name: 'Student activity, by format' });
    expect(activity.className).toBe('rk-sec');
    expect(activity.querySelector(':scope > .rk-sec-h')!.innerHTML).toBe(
      '<h2 class="rb-h2" id="fa-e1-act">Student activity, by format</h2><p class="rk-hint">As of 7 Nov 2026</p>',
    );
    const about = screen.getByRole('region', { name: 'About this experiment' });
    expect(about.firstElementChild!.outerHTML).toBe(
      '<h2 class="rb-h2" id="fa-e1-about">About this experiment</h2>',
    );
    expect(about.querySelector('p.fa-about')).toHaveTextContent('Vary flow rates.');
    const grid = about.querySelector('.fa-aboutgrid')!;
    expect([...grid.querySelectorAll(':scope > div > h3.rk-h3')].map((h) => h.textContent)).toEqual(
      ['Learning outcomes', 'Resources students see'],
    );
    const note = grid.querySelector('p.rk-hint')!;
    expect(note.getAttribute('style')).toBeNull();
    expect(note).toHaveTextContent('Read-only here.');
    expectClean(container);
    await assertNoAxeViolations(container);
  });
});
