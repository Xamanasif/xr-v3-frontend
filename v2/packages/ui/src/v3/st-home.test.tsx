/**
 * What the Student's home group alone draws (ST-01 Home, ST-02 My courses, ST-03 Course, ST-04 All
 * experiments; owner-approved export design/v3-refined-b/roles/ST-v1, `project/StudentFinal.dc.html`):
 * each piece rendered with sample values and compared with the export's template filled the way
 * its script fills it (`sc-for`, `sc-if`, `{{ … }}`, the `sti-*` sprite inlined from its own
 * symbols); then the class contract, the behaviour, the identifier rule, the absence of a stage
 * tracker (lead decision 1) and the accessibility checks.
 *
 * Normalised on both sides, each for a recorded reason (as `st.test.tsx`): the design runtime's
 * event bindings, an attribute bound to nothing (dropped, as the runtime drops it), `aria-hidden`
 * on a decorative `svg` (`v3Canonical`), the order of class tokens; for the toolbar also the
 * select's `value` attribute (React selects the option instead).
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectNoInternalReferences,
  expectV3ClassesOnly,
  stExportText,
  v3Canonical,
} from '../testing/index.js';
import { StList, StListRow, StOutcomes, StRowText, StRowTitle } from './st.js';
import {
  StCourseList,
  StCourseSection,
  StExperimentListFormats,
  StExperimentListKicker,
  StExperimentListPanel,
  StExperimentListToolbar,
  StHomeCover,
  StHomeHow,
  StHomeItems,
  StHomeLayout,
  StHomeLearn,
  StHomeStep,
  type StHomeItem,
} from './st-home.js';
import { StatusPill } from './status.js';

const MAIN = stExportText('StudentFinal.dc.html');
const TEMPLATE = MAIN.slice(0, MAIN.indexOf('<script type="text/x-dc"'));

/** The export's sprite (`sti-*`), by id. */
const SYMBOLS = new Map(
  [...MAIN.matchAll(/<symbol id="(sti-[\w-]+)" viewBox="0 0 24 24"><path d="([^"]+)"/g)].map(
    (match) => [match[1] ?? '', match[2] ?? ''] as const,
  ),
);

type Scope = Readonly<Record<string, unknown>>;

function lookup(scope: Scope, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    return value && typeof value === 'object' ? (value as Scope)[key] : undefined;
  }, scope);
}

/** `{{ name }}` replaced; an attribute bound to nothing or `false` dropped, `true` written bare. */
function substitute(html: string, scope: Scope): string {
  return html
    .replace(/ ([\w-]+)="\{\{ ([\w.]+) \}\}"/g, (_whole, name: string, path: string) => {
      const value = lookup(scope, path);
      if (value === undefined || value === null || value === false || value === '') return '';
      return value === true ? ` ${name}=""` : ` ${name}="${String(value)}"`;
    })
    .replace(/\{\{ ([\w.]+) \}\}/g, (_whole, path: string) => String(lookup(scope, path) ?? ''));
}

/** An excerpt of the template filled as its runtime fills it. */
function fill(html: string, scope: Scope): string {
  const open = /<sc-(for|if) ([^>]*)>/g;
  let out = '';
  let from = 0;
  for (;;) {
    open.lastIndex = from;
    const start = open.exec(html);
    if (!start) {
      out += substitute(html.slice(from), scope);
      break;
    }
    out += substitute(html.slice(from, start.index), scope);
    const tag = start[1] ?? '';
    const attributes = start[2] ?? '';
    const tags = new RegExp(`<sc-${tag} [^>]*>|</sc-${tag}>`, 'g');
    tags.lastIndex = start.index + start[0].length;
    let depth = 1;
    let close: RegExpExecArray | null = null;
    while (depth > 0) {
      close = tags.exec(html);
      if (!close) throw new Error(`unclosed sc-${tag}`);
      depth += close[0].startsWith('</') ? -1 : 1;
    }
    const inner = html.slice(start.index + start[0].length, close!.index);
    if (tag === 'for') {
      const list = /list="\{\{ ([\w.]+) \}\}"/.exec(attributes)?.[1] ?? '';
      const as = /as="(\w+)"/.exec(attributes)?.[1] ?? '';
      out += ((lookup(scope, list) as readonly unknown[] | undefined) ?? [])
        .map((item) => fill(inner, { ...scope, [as]: item }))
        .join('');
    } else {
      const name = /value="\{\{ ([\w.]+) \}\}"/.exec(attributes)?.[1] ?? '';
      if (lookup(scope, name)) out += fill(inner, scope);
    }
    from = close!.index + close![0].length;
  }
  return out
    .replace(/ on[A-Z][A-Za-z]*="[^"]*"/g, '')
    .replace(/ class=""/g, '')
    .replace(/<use href="#(sti-[\w-]+)"><\/use>/g, (whole, id: string) => {
      const path = SYMBOLS.get(id);
      return path ? `<path d="${path}"></path>` : whole;
    });
}

/** The template from `start` to the end marker `end` after it (inclusive). */
function excerpt(start: string, end: string, after = 0): string {
  const from = TEMPLATE.indexOf(start, after);
  expect(from, `the export draws ${start}`).toBeGreaterThanOrEqual(0);
  const to = TEMPLATE.indexOf(end, from + start.length);
  expect(to, `the export closes ${start} with ${end}`).toBeGreaterThan(from);
  return TEMPLATE.slice(from, to + end.length);
}

function at(marker: string): number {
  const index = TEMPLATE.indexOf(marker);
  expect(index, `the export marks ${marker}`).toBeGreaterThanOrEqual(0);
  return index;
}

function sortedClasses(html: string): string {
  return html.replace(/ class="([^"]*)"/g, (_whole, value: string) => {
    return ` class="${value.split(/\s+/).filter(Boolean).sort().join(' ')}"`;
  });
}

function withoutLayout(html: string): string {
  return html.replace(/>\s+</g, '><').trim();
}

function comparable(html: string): string {
  return sortedClasses(v3Canonical(withoutLayout(html)));
}

function expectSameMarkup(element: Element, expected: string) {
  expect(comparable(element.outerHTML)).toBe(comparable(expected));
}

function inRoot(ui: ReactNode) {
  return render(<div className="xr rb">{ui}</div>);
}

/** Student words never carry an internal record reference (lead decision 3). */
const STUDENT_REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|ATT|ASMT)-\d+/;

function expectNoStudentReferences(root: Element) {
  expectNoInternalReferences(root);
  expect(root.textContent ?? '').not.toMatch(STUDENT_REFERENCE);
  for (const element of [root, ...root.querySelectorAll('*')]) {
    for (const name of ['aria-label', 'title', 'alt']) {
      expect(element.getAttribute(name) ?? '').not.toMatch(STUDENT_REFERENCE);
    }
  }
}

const SHELL = 'Shell-and-Tube Heat Exchanger';
const THERMO = 'Thermodynamics & Heat Transfer';
/** As the runtime writes it into the markup (`&` escaped). */
const THERMO_HTML = 'Thermodynamics &amp; Heat Transfer';
const HUB = '/student/experiments/shell-and-tube-heat-exchanger';
const COURSE = '/student/courses/thermodynamics-heat-transfer';
const DESC =
  'Vary flow rates and inlet temperatures across a two-pass exchanger, then derive the effectiveness–NTU relationship from your own readings.';
const HOW = [
  'Your institution gives you an experiment, with the formats you can use.',
  'Read its resources, then run a simulation. Nothing is locked.',
  'Answer the assessment when your faculty sets one.',
];

describe('ST-01 Home: before access', () => {
  it('“How it works” is the export’s `ol.sv-how`', () => {
    const drawn = excerpt(
      '<ol class="sv-how" aria-label="How it works">',
      '</ol>',
      at('ST-01 Home'),
    );
    const { container } = inRoot(<StHomeHow label="How it works" steps={HOW} />);
    expectSameMarkup(
      container.querySelector('ol.sv-how')!,
      fill(drawn, { H: { msg: { steps: HOW.map((t, index) => ({ n: index + 1, t })) } } }),
    );
    expectV3ClassesOnly(container);
  });
});

describe('ST-01 Home: the cover and its next step', () => {
  const coverScope = (step: Scope) => ({
    H: {
      cover: {
        k: 'Continue learning',
        code: 'MEC-523',
        canCourse: true,
        noCourse: false,
        course: { t: THERMO_HTML, href: COURSE, aria: `${THERMO_HTML}, open course` },
        canOpen: true,
        open: { href: HUB, aria: `Open experiment, ${SHELL}` },
        t: SHELL,
        d: DESC,
        step,
      },
    },
  });

  function renderCover(stepNode: ReactNode) {
    return inRoot(
      <StHomeCover
        kicker="Continue learning"
        kickerId="sv-now-h"
        code="MEC-523"
        course={{ name: THERMO, href: COURSE, ariaLabel: `${THERMO}, open course` }}
        open={{ href: HUB, label: 'Open experiment', ariaLabel: `Open experiment, ${SHELL}` }}
        title={SHELL}
        titleId="sv-now-t"
        description={DESC}
        step={stepNode}
      />,
    );
  }

  it('a step to take with a format chip (the export’s `nextStep` "fb-WEB"): same markup', () => {
    const drawn = excerpt('<section class="sv-home-now"', '</section>', at('ST-01 Home'));
    const { container } = renderCover(
      <StHomeStep
        tone="next"
        badge={{ chip: { code: 'WEB', kind: 'on' } }}
        kicker="Your next step"
        title="Feedback on WEB is open"
        description="You completed WEB."
        action={{
          href: `${HUB}/feedback/web`,
          label: 'Give feedback on WEB',
          ariaLabel: `Give feedback on WEB, ${SHELL}`,
          primary: true,
        }}
        open={{ href: HUB, label: 'Open experiment', ariaLabel: `Open experiment, ${SHELL}` }}
      />,
    );
    expectSameMarkup(
      container.querySelector('section.sv-home-now')!,
      fill(
        drawn,
        coverScope({
          cls: 'sv-step is-next',
          isFmt: true,
          isIco: false,
          fmt: 'WEB',
          fmtCls: 'xr-fmt sv-fmt sv-fmt--on',
          hasGlyph: true,
          glyph: 'sti-check',
          hasK: true,
          t: 'Feedback on WEB is open',
          hasD: true,
          d: 'You completed WEB.',
          hasStages: false,
          showAct: true,
          hasAct: true,
          act: {
            cls: 'rb-btn rb-btn--primary rb-btn--lg',
            href: `${HUB}/feedback/web`,
            aria: `Give feedback on WEB, ${SHELL}`,
            label: 'Give feedback on WEB',
          },
        }),
      ),
    );
    expectV3ClassesOnly(container);
    expectNoStudentReferences(container);
    // Lead decision 1: no stage tracker, whatever the step.
    expect(container.querySelector('.sv-steps, .sv-step-stages')).toBeNull();
  });

  it('a held step with an icon and no action (the export’s paused cover): same markup', () => {
    const drawn = excerpt('<section class="sv-home-now"', '</section>', at('ST-01 Home'));
    const { container } = renderCover(
      <StHomeStep
        tone="held"
        badge={{ icon: 'pauseCircle' }}
        title="You can’t open experiments right now"
        description="You can carry on from where you left off when the pause is lifted."
        open={{ href: HUB, label: 'Open experiment', ariaLabel: `Open experiment, ${SHELL}` }}
      />,
    );
    expectSameMarkup(
      container.querySelector('section.sv-home-now')!,
      fill(
        drawn,
        coverScope({
          cls: 'sv-step sv-step--held',
          isFmt: false,
          isIco: true,
          ico: 'sti-pause',
          hasK: false,
          t: 'You can’t open experiments right now',
          hasD: true,
          d: 'You can carry on from where you left off when the pause is lifted.',
          hasStages: false,
          showAct: true,
          hasAct: false,
          act: {},
        }),
      ),
    );
  });

  it('without a course link or a way in: the course name alone, no "Open experiment"', () => {
    const { container } = inRoot(
      <StHomeCover
        kicker="Your experiment"
        kickerId="k"
        code={null}
        course={{ name: THERMO }}
        title={SHELL}
        titleId="t"
        step={
          <StHomeStep
            tone="plain"
            badge={{ icon: 'progress' }}
            title="Nothing else is waiting for you right now"
          />
        }
      />,
    );
    expect(container.querySelector('.sv-now-course')!.outerHTML).toBe(
      `<p class="sv-now-course"><span>${THERMO.replace('&', '&amp;')}</span></p>`,
    );
    expect(screen.queryByRole('link')).toBeNull();
    expect(container.querySelector('.sv-now-d')).toBeNull();
    expect(container.querySelector('.sv-step-act')).toBeNull();
    expect(container.querySelector('.sv-step-k')).toBeNull();
    expect(screen.getByRole('region', { name: 'Your experiment' })).toBeVisible();
    expect(screen.getByRole('article', { name: SHELL })).toBeVisible();
  });
});

describe('ST-01 Home: the experiment’s parts and what it teaches', () => {
  const items: StHomeItem[] = [
    {
      key: 'res',
      badge: { icon: 'resources' },
      label: 'Resources',
      value: '1 of 3 opened',
      href: `${HUB}/resources`,
    },
    {
      key: 'vr',
      badge: { chip: { code: 'VR', kind: 'on' } },
      label: 'Virtual reality',
      value: 'Not started',
      href: `${HUB}/simulation/vr`,
    },
    {
      key: 'asmt',
      badge: { icon: 'assessments' },
      label: 'Assessment',
      value: 'Not set by your faculty yet',
    },
  ];

  it('"Also in this experiment": links while they open, a static row otherwise — same markup', () => {
    const drawn = excerpt('<section class="sv-home-also"', '</section>', at('ST-01 Home'));
    const { container } = inRoot(
      <StHomeItems title="Also in this experiment" titleId="sv-also-h" items={items} />,
    );
    const item = (o: Scope) => ({
      isLink: false,
      isStatic: false,
      isFmt: false,
      isIco: false,
      hasGlyph: false,
      ...o,
    });
    expectSameMarkup(
      container.querySelector('section.sv-home-also')!,
      fill(drawn, {
        H: {
          also: {
            h: 'Also in this experiment',
            items: [
              item({
                isLink: true,
                isIco: true,
                ico: 'sti-res',
                label: 'Resources',
                v: '1 of 3 opened',
                href: `${HUB}/resources`,
              }),
              item({
                isLink: true,
                isFmt: true,
                fmt: 'VR',
                fmtCls: 'xr-fmt sv-fmt sv-fmt--on',
                hasGlyph: true,
                glyph: 'sti-check',
                label: 'Virtual reality',
                v: 'Not started',
                href: `${HUB}/simulation/vr`,
              }),
              item({
                isStatic: true,
                isIco: true,
                ico: 'sti-clip',
                label: 'Assessment',
                v: 'Not set by your faculty yet',
              }),
            ],
          },
        },
      }),
    );
    expectV3ClassesOnly(container);
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('a second list (product-only "Up next" of other experiments) sits in the same column', () => {
    const { container } = inRoot(
      <StHomeItems
        title="Also in this experiment"
        titleId="a"
        items={items.slice(0, 1)}
        more={{
          title: 'Up next',
          titleId: 'b',
          items: [
            {
              key: 'fin',
              badge: { chip: { code: 'VR', kind: 'on' } },
              label: 'Fin-Tube Bundle',
              value: 'VR is waiting for you',
              href: '/student/experiments/fin-tube-bundle',
            },
          ],
        }}
      />,
    );
    const section = container.querySelector('section.sv-home-also')!;
    expect([...section.querySelectorAll('h2.sv-sh')].map((h) => h.textContent)).toEqual([
      'Also in this experiment',
      'Up next',
    ]);
    expect(section.querySelectorAll('ul.sv-card.sv-items')).toHaveLength(2);
    expect(screen.getByRole('region', { name: 'Also in this experiment' })).toBe(section);
    expectV3ClassesOnly(container);
  });

  it('"What you’re learning": the heading row and the outcomes card — same markup', () => {
    const drawn = excerpt('<section class="sv-home-learn"', '</section>', at('ST-01 Home'));
    const outcomes = [
      'Determine log mean temperature difference',
      'Compare countercurrent arrangements',
    ];
    const { container } = inRoot(
      <StHomeLearn
        title="What you’re learning"
        titleId="sv-learn-h"
        note="The same in every format"
      >
        <StOutcomes items={outcomes} />
      </StHomeLearn>,
    );
    expectSameMarkup(
      container.querySelector('section.sv-home-learn')!,
      fill(drawn, { H: { cover: { outcomes } } }),
    );
  });

  it('the layout is the export’s `div.sv-home`, and the whole Home passes axe', async () => {
    const { container } = inRoot(
      <main>
        <h1>Hello, Rahul</h1>
        <StHomeLayout>
          <StHomeCover
            kicker="Start here"
            kickerId="k"
            code="MEC-523"
            course={{ name: THERMO, href: COURSE, ariaLabel: `${THERMO}, open course` }}
            open={{ href: HUB, label: 'Open experiment', ariaLabel: `Open experiment, ${SHELL}` }}
            title={SHELL}
            titleId="t"
            description={DESC}
            step={
              <StHomeStep
                tone="next"
                badge={{ icon: 'resources' }}
                kicker="Your next step"
                title="Start with the resources"
                description="3 resources · none opened yet"
                action={{
                  href: `${HUB}/resources`,
                  label: 'Open resources',
                  ariaLabel: `Open resources, ${SHELL}`,
                  primary: true,
                }}
                open={{
                  href: HUB,
                  label: 'Open experiment',
                  ariaLabel: `Open experiment, ${SHELL}`,
                }}
              />
            }
          />
          <StHomeItems title="Also in this experiment" titleId="a" items={items} />
          <StHomeLearn title="What you’re learning" titleId="l" note="The same in every format">
            <StOutcomes items={['One', 'Two']} />
          </StHomeLearn>
        </StHomeLayout>
      </main>,
    );
    expect(
      container.querySelector(
        'div.sv-home > section.sv-home-now + section.sv-home-also + section.sv-home-learn',
      ),
    ).not.toBeNull();
    expectV3ClassesOnly(container);
    expectNoStudentReferences(container);
    await assertNoAxeViolations(container);
  });
});

describe('ST-02 My courses: a course as a section', () => {
  it('its code, area, name, facts, "Open course" and its experiments — same markup', () => {
    const drawn = excerpt(
      '<section class="sv-card sv-course"',
      '</section>',
      at('ST-02 My courses'),
    );
    const fmts = [
      {
        code: 'WEB',
        fmtCls: 'xr-fmt sv-fmt sv-fmt--held',
        hasGlyph: true,
        glyph: 'sti-bars2',
        name: 'Browser',
        text: 'Paused',
      },
    ];
    const { container } = inRoot(
      <StCourseSection
        titleId="st-c-mec-523"
        code="MEC-523"
        area="Mechanical & Manufacturing"
        name={THERMO}
        meta={
          <>
            <span>
              BITS course code <span className="rb-code">ME ZG523</span>
            </span>
            <span>1 experiment given to you</span>
            <StatusPill tone="paused">Paused</StatusPill>
          </>
        }
        open={{ href: COURSE, label: 'Open course', ariaLabel: `Open course ${THERMO}` }}
        listLabel={`Experiments given to you in ${THERMO}`}
      >
        <StListRow variant="experiment" end={undefined}>
          <StRowTitle id="st-c-ste" level={4}>
            {SHELL}
          </StRowTitle>
          <StRowText clamp>{DESC}</StRowText>
          <StExperimentListFormats
            label={`Your formats for ${SHELL}`}
            formats={[
              {
                chip: { code: 'WEB', kind: 'held', glyph: 'pauseBars' },
                name: 'Browser',
                text: 'Paused',
              },
            ]}
          />
        </StListRow>
      </StCourseSection>,
    );
    expectSameMarkup(
      container.querySelector('section.sv-course')!,
      fill(drawn, {
        c: {
          hid: 'st-c-mec-523',
          code: 'MEC-523',
          area: 'Mechanical &amp; Manufacturing',
          name: 'Thermodynamics &amp; Heat Transfer',
          bits: 'ME ZG523',
          count: '1 experiment given to you',
          hasPill: true,
          pillCls: 'xr-st xr-st--paused',
          pill: 'Paused',
          href: COURSE,
          aria: `Open course Thermodynamics &amp; Heat Transfer`,
          listAria: `Experiments given to you in Thermodynamics &amp; Heat Transfer`,
          exps: [
            {
              hid: 'st-c-ste',
              t: SHELL,
              desc: DESC,
              fAria: `Your formats for ${SHELL}`,
              fmts,
              canOpen: false,
            },
          ],
        },
      }),
    );
    expectV3ClassesOnly(container);
  });

  it('without a code or area the kicker is left out; without rows, the list too', () => {
    const { container } = inRoot(
      <StCourseList title="Your courses" titleId="h">
        <StCourseSection titleId="c" code={null} name={THERMO} listLabel="Experiments" />
      </StCourseList>,
    );
    expect(container.querySelector('h2.xr-sr')).toHaveTextContent('Your courses');
    expect(container.querySelector('.sv-course-k')).toBeNull();
    expect(container.querySelector('ul.sv-list')).toBeNull();
    expect(container.querySelector('.sv-course-open')).toBeNull();
    expect(screen.getByRole('region', { name: THERMO })).toBeVisible();
  });
});

describe('ST-04 All experiments: the row kicker, the panel and its toolbar', () => {
  it('the row kicker is the export’s (`rk-owncode sv-code-sm`, then the course)', () => {
    const { container } = inRoot(<StExperimentListKicker code="MEC-523" course={THERMO} />);
    expect(comparable(container.querySelector('p.sv-li-k')!.outerHTML)).toBe(
      comparable(
        fill(
          '<p class="sv-li-k"><span class="rk-owncode sv-code-sm">{{ e.code }}</span>{{ e.course }}</p>',
          {
            e: { code: 'MEC-523', course: 'Thermodynamics &amp; Heat Transfer' },
          },
        ),
      ),
    );
    expect(TEMPLATE).toContain(
      '<p class="sv-li-k"><span class="rk-owncode sv-code-sm">{{ e.code }}</span>{{ e.course }}</p>',
    );
  });

  it('the toolbar with a chip and "Clear filters" — same markup', () => {
    const start = TEMPLATE.indexOf('<div class="sv-toolbar">', at('ST-02 My courses'));
    const end = TEMPLATE.indexOf('<sc-if value="{{ X.has }}"', start);
    const drawn = TEMPLATE.slice(start, end);
    const { container } = inRoot(
      <StExperimentListToolbar
        label="Filter your experiments"
        search={{
          id: 'st-x-q',
          label: 'Search',
          placeholder: 'Experiment or course',
          value: 'fin',
          onChange: () => {},
        }}
        format={{
          id: 'st-x-f',
          label: 'Format',
          value: 'all',
          options: [
            { value: 'all', label: 'All formats' },
            { value: 'WEB', label: 'WEB' },
            { value: 'VR', label: 'VR' },
          ],
          onChange: () => {},
        }}
        count="0 of 1 experiment"
        chips={[
          {
            key: 'q',
            label: 'Search: “fin”',
            removeLabel: 'Remove filter Search: “fin”',
            onRemove: () => {},
          },
        ]}
        clear={{ label: 'Clear filters', onClear: () => {} }}
      />,
    );
    const filled = fill(drawn, {
      X: {
        q: 'fin',
        fopts: ['WEB', 'VR'],
        count: '0 of 1 experiment',
        chips: [{ label: 'Search: “fin”', aria: 'Remove filter Search: “fin”' }],
        hasChips: true,
      },
    });
    expect(comparable(container.querySelector('div.sv-toolbar')!.outerHTML)).toBe(
      comparable(filled),
    );
    expectV3ClassesOnly(container);
  });

  it('typing, choosing, removing a chip and clearing call back', () => {
    const onSearch = vi.fn();
    const onFormat = vi.fn();
    const onRemove = vi.fn();
    const onClear = vi.fn();
    inRoot(
      <StExperimentListToolbar
        label="Filter your experiments"
        search={{
          id: 'q',
          label: 'Search',
          placeholder: 'Experiment or course',
          value: '',
          onChange: onSearch,
        }}
        format={{
          id: 'f',
          label: 'Format',
          value: 'all',
          options: [
            { value: 'all', label: 'All formats' },
            { value: 'vr', label: 'VR' },
          ],
          onChange: onFormat,
        }}
        count="1 of 1 experiment"
        chips={[
          { key: 'f', label: 'Format: VR', removeLabel: 'Remove filter Format: VR', onRemove },
        ]}
        clear={{ label: 'Clear filters', onClear }}
      />,
    );
    const search = screen.getByRole('search', { name: 'Filter your experiments' });
    fireEvent.change(within(search).getByRole('searchbox', { name: 'Search' }), {
      target: { value: 'fin' },
    });
    expect(onSearch).toHaveBeenCalledWith('fin');
    fireEvent.change(within(search).getByRole('combobox', { name: 'Format' }), {
      target: { value: 'vr' },
    });
    expect(onFormat).toHaveBeenCalledWith('vr');
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter Format: VR' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('1 of 1 experiment');
  });

  it('the panel is named by its hidden heading, and the page passes axe', async () => {
    const { container } = inRoot(
      <main>
        <h1>My courses</h1>
        <StExperimentListPanel title="All the experiments given to you" titleId="st-x-h">
          <StExperimentListToolbar
            label="Filter your experiments"
            search={{
              id: 'q',
              label: 'Search',
              placeholder: 'Experiment or course',
              value: '',
              onChange: () => {},
            }}
            format={{
              id: 'f',
              label: 'Format',
              value: 'all',
              options: [{ value: 'all', label: 'All formats' }],
              onChange: () => {},
            }}
            count="1 experiment in 1 course"
            chips={[]}
          />
          <StList label="Experiments">
            <StListRow variant="experiment">
              <StExperimentListKicker code="MEC-523" course={THERMO} />
              <StRowTitle>{SHELL}</StRowTitle>
              <StExperimentListFormats
                label={`Your formats for ${SHELL}`}
                formats={[
                  { chip: { code: 'WEB', kind: 'on' }, name: 'Browser', text: 'In progress' },
                  {
                    chip: { code: 'VR', kind: 'held', glyph: 'clock' },
                    name: 'Virtual reality',
                    text: 'Waiting for a licence',
                  },
                ]}
              />
            </StListRow>
          </StList>
        </StExperimentListPanel>
      </main>,
    );
    const panel = screen.getByRole('region', { name: 'All the experiments given to you' });
    expect(panel).toHaveClass('sv-card', 'sv-xpanel');
    expect(panel.querySelector('h2.xr-sr')).not.toBeNull();
    expect(container.querySelector('.rk-clear')).toBeNull();
    expect([...panel.querySelectorAll('.sv-xli-ft')].map((n) => n.textContent)).toEqual([
      'Browser: In progress',
      'Virtual reality: Waiting for a licence',
    ]);
    expectV3ClassesOnly(container);
    expectNoStudentReferences(container);
    await assertNoAxeViolations(container);
  });
});
