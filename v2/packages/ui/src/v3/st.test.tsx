/**
 * What more than one Student screen group draws (owner-approved export
 * design/v3-refined-b/roles/ST-v1, `project/StudentFinal.dc.html`, `project/v3-student-final.css`;
 * ST-ANALYSIS §5): each piece is rendered with sample values and compared with the export's
 * template filled the way its script fills it (`sc-for`, `sc-if`, `{{ … }}`, the `sti-*` sprite
 * inlined from its own symbols); then the class contract, the behaviour, the identifier rule and
 * the accessibility checks.
 *
 * Normalised on both sides, each for a recorded reason: the export's design runtime wiring (event
 * bindings), an attribute bound to nothing (dropped, as the runtime drops it), `aria-hidden` on a
 * decorative `svg` (the kit hides the glyph, the export its box — both decorative; `v3Canonical`)
 * and the order of class tokens.
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
import { ButtonLink } from './actions.js';
import { InstitutionCode } from './codes.js';
import { Breadcrumbs } from './page.js';
import {
  StAside,
  StAssessmentLine,
  StCard,
  StCardHead,
  StEyebrow,
  StFormatChip,
  StHoldNote,
  StHowTo,
  StList,
  StListRow,
  StLoading,
  StMessage,
  StNote,
  StOffRows,
  StOutcomes,
  StOverview,
  StProgressBlock,
  StProgressOff,
  StProgressTable,
  StRecordHead,
  StRefuse,
  StRowKicker,
  StRowMeta,
  StRowText,
  StRowTitle,
  StSectionTitle,
  StShelfHead,
  StSideSection,
  StSideText,
  StSideTitle,
  StStateRow,
  StSubheading,
  StTabs,
  StTextLink,
  type StFormatKind,
  type StOffRow,
  type StProgressRow,
} from './st.js';
import { StatusPill } from './status.js';

const MAIN = stExportText('StudentFinal.dc.html');
const TEMPLATE = MAIN.slice(0, MAIN.indexOf('<script type="text/x-dc"'));
const SCRIPT = MAIN.slice(MAIN.indexOf('<script type="text/x-dc"'));

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

/** An excerpt of the template filled as its runtime fills it (see the file's head). */
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

/** The template's offset of a section marker, to start an excerpt inside one screen. */
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

/** Text between tags without the template's indentation (the runtime renders it as one line). */
function withoutLayout(html: string): string {
  return html.replace(/>\s+</g, '><').trim();
}

function comparable(html: string): string {
  return sortedClasses(v3Canonical(withoutLayout(html)));
}

function expectSameMarkup(element: Element, expected: string) {
  expect(comparable(element.outerHTML)).toBe(comparable(expected));
}

/** Rendered inside a V3 root, as the shell renders the pages. */
function inRoot(ui: ReactNode) {
  return render(<div className="xr rb">{ui}</div>);
}

/** Student words never carry an internal record reference (lead decision 3, the identifier rule). */
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

const SVG = (id: string) =>
  `<svg viewBox="0 0 24 24"><path d="${SYMBOLS.get(id) ?? 'missing'}"></path></svg>`;

describe('the format chip (the export’s `fmtChip`)', () => {
  /** The script's class and glyph per state: `{ on: ['xr-fmt sv-fmt sv-fmt--on', 'sti-check'], … }`. */
  const MAP =
    /fmtChip\(w, f\) \{[\s\S]*?const m = (\{[^\n]*?\})\[av\.kind\]/.exec(SCRIPT)?.[1] ?? '';
  const drawn = new Map(
    [...MAP.matchAll(/(\w+): \['([^']*)', (?:av\.glyph \|\| )?'([^']*)'\]/g)].map(
      (match) => [match[1] ?? '', { cls: match[2] ?? '', glyph: match[3] ?? '' }] as const,
    ),
  );

  it('each state takes the script’s classes and glyph', () => {
    expect([...drawn.keys()].sort()).toEqual(['ended', 'held', 'none', 'on', 'pub']);
    const glyphs: Record<StFormatKind, string> = {
      on: 'sti-check',
      pub: '',
      none: '',
      held: 'sti-clock',
      ended: 'sti-dash',
    };
    for (const kind of ['on', 'pub', 'none', 'held', 'ended'] as const) {
      const { container } = inRoot(
        <StFormatChip code="WEB" kind={kind} glyph={kind === 'held' ? 'clock' : undefined} />,
      );
      const glyph = glyphs[kind] || drawn.get(kind)!.glyph;
      expectSameMarkup(
        container.querySelector('.xr-fmt')!,
        `<span class="${drawn.get(kind)!.cls}" aria-hidden="true">WEB${glyph ? SVG(glyph) : ''}</span>`,
      );
      expectV3ClassesOnly(container);
    }
  });

  it('a held chip names why with the export’s glyphs (`avail`): paused, a licence wait, not right now', () => {
    expect(SCRIPT).toContain("label: 'Paused', glyph: 'sti-bars2'");
    expect(SCRIPT).toContain("label: 'Waiting for a licence', glyph: 'sti-clock'");
    expect(SCRIPT).toContain("label: 'Not available right now', glyph: 'sti-alert'");
    const { container } = inRoot(
      <>
        <StFormatChip code="WEB" kind="held" glyph="pauseBars" />
        <StFormatChip code="VR" kind="held" glyph="alertCircle" />
      </>,
    );
    const paths = [...container.querySelectorAll('path')].map((path) => path.getAttribute('d'));
    expect(paths).toEqual([SYMBOLS.get('sti-bars2'), SYMBOLS.get('sti-alert')]);
  });
});

describe('the compact message, the state row and loading', () => {
  it('the failed card is ST-02’s (`sv-msg` + `sv-msg-ico--err`, role alert, “Try again”)', () => {
    const drawn = excerpt(
      '<section class="sv-card sv-msg" aria-labelledby="st-c-fail" role="alert">',
      '</section>',
    );
    const onRetry = vi.fn();
    const { container } = inRoot(
      <StMessage
        icon="cloudAlert"
        tone="err"
        alert
        title="We couldn’t load your courses"
        titleId="st-c-fail"
        description="Nothing has changed. Try again."
        retry={{ label: 'Try again', onRetry }}
      />,
    );
    expectSameMarkup(
      container.querySelector('.sv-msg')!,
      fill(drawn, { C: { failText: 'We couldn’t load your courses' } }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.getByRole('alert')).toBe(container.querySelector('.sv-msg'));
    expectV3ClassesOnly(container);
  });

  it('the empty card with Help is ST-02’s “not given yet” (`rb-link sv-msg-link`)', () => {
    const drawn = excerpt(
      '<section class="sv-card sv-msg" aria-labelledby="st-c-none">',
      '</section>',
    );
    const { container } = inRoot(
      <StMessage
        icon="myCourses"
        title="Your institution hasn’t given you access yet"
        titleId="st-c-none"
        description="Courses appear here when your institution gives you an experiment."
        link={{ href: '/student/help', label: 'Help & support' }}
      />,
    );
    expectSameMarkup(
      container.querySelector('.sv-msg')!,
      fill(drawn, {
        C: { noneText: 'Courses appear here when your institution gives you an experiment.' },
        S: { help: { href: '/student/help' } },
      }).replace('Help &amp; support', 'Help &amp; support'),
    );
    expect(screen.getByRole('region', { name: 'Your institution hasn’t given you access yet' }));
  });

  it('the inactive account’s message takes the paused tone (`sv-msg-ico--paused`, `homeVM`)', () => {
    expect(SCRIPT).toContain("icoCls: 'sv-msg-ico sv-msg-ico--paused'");
    const { container } = inRoot(
      <StMessage icon="user" tone="paused" title="t" titleId="m" description="d" />,
    );
    expect(container.querySelector('.sv-msg-ico')!.className).toBe('sv-msg-ico sv-msg-ico--paused');
  });

  it('the state rows are ST-04’s no match (status) and ST-06’s failure (alert)', () => {
    const noMatch = `${excerpt('<div class="sv-pstate sv-pstate--row" role="status">', '</button>', at('X.nomatch'))}</div>`;
    const onClear = vi.fn();
    const first = inRoot(
      <StStateRow
        icon="search"
        title="No experiments match"
        titleAs="p"
        description="Only experiments your institution has given you are listed. Try fewer filters or a different spelling."
        action={{ label: 'Clear filters', onClick: onClear }}
      />,
    );
    expectSameMarkup(first.container.querySelector('.sv-pstate')!, fill(noMatch, {}));
    fireEvent.click(within(first.container).getByRole('button', { name: 'Clear filters' }));
    expect(onClear).toHaveBeenCalledOnce();
    first.unmount();

    const failed = `${excerpt('<div class="sv-pstate sv-pstate--row" role="alert">', '</button>', at('RS.failed'))}</div>`;
    const second = inRoot(
      <StStateRow
        icon="cloudAlert"
        tone="err"
        alert
        title="We couldn’t load the resources"
        description="Nothing has changed. Try again."
        action={{ label: 'Try again', onClick: () => undefined }}
      />,
    );
    expectSameMarkup(second.container.querySelector('.sv-pstate')!, fill(failed, {}));
    expectV3ClassesOnly(second.container);
  });

  it('loading is drawn three ways: ST-02’s card, ST-06’s inline block, ST-15’s panel', () => {
    const cardNode = excerpt('<section class="sv-card sv-loading"', '</section>');
    const one = inRoot(
      <StLoading variant="card" name="My courses" label="Loading your courses…" />,
    );
    expectSameMarkup(
      one.container.querySelector('.sv-loading')!,
      fill(cardNode, { C: { loadingText: 'Loading your courses…' } }),
    );
    expect(within(one.container).getByRole('status').textContent).toBe('Loading your courses…');
    one.unmount();

    const inline = excerpt(
      '<div class="sv-loading" aria-busy="true">',
      '</div></div>',
      at('RS.loading'),
    );
    const two = inRoot(<StLoading label="Loading resources…" />);
    expectSameMarkup(two.container.querySelector('.sv-loading')!, fill(inline, {}));
    two.unmount();

    const panel = excerpt(
      '<div class="sv-pstate" aria-busy="true">',
      '</div></div>',
      at('P.loading'),
    );
    const three = inRoot(<StLoading variant="panel" label="Loading your progress…" />);
    expectSameMarkup(three.container.querySelector('.sv-pstate')!, fill(panel, {}));
    expectV3ClassesOnly(three.container);
  });

  it('the hold note is ST-10’s (`sv-holdnote sv-ptab-note`, said once above the table)', () => {
    const drawn = excerpt('<p class="sv-holdnote sv-ptab-note">', '</p>');
    const { container } = inRoot(
      <StHoldNote icon="clock" inTab>
        No licence is available for you right now. Your institution can tell you more.
      </StHoldNote>,
    );
    expectSameMarkup(
      container.querySelector('.sv-holdnote')!,
      fill(drawn, {
        PT: {
          exp: {
            note: {
              ico: 'sti-clock',
              d: 'No licence is available for you right now. Your institution can tell you more.',
            },
          },
        },
      }),
    );
  });
});

describe('the compact refusal (`sv-refuse`)', () => {
  const drawn = excerpt(
    '<section class="sv-card sv-refuse" aria-labelledby="st-h1">',
    '</section>',
  );

  it('ST-09 AR: the kicker, the H1, the formats the Student can still use, Back to Simulation', () => {
    const scope = {
      M: {
        icoCls: 'sv-refuse-ico',
        ico: 'sti-box',
        hasK: true,
        k: 'Shell-and-Tube Heat Exchanger · Simulation',
        t: 'AR isn’t included for your institution',
        d: 'AR is published for this experiment, but your institution’s access includes WEB and VR only.',
        hasAlt: true,
        altH: 'Formats you can use',
        alt: [
          {
            hasChip: true,
            fmtCls: 'xr-fmt sv-fmt sv-fmt--on',
            code: 'WEB',
            hasGlyph: true,
            glyph: 'sti-check',
            t: 'Web simulation',
            sr: ' (WEB)',
            m: 'In progress · saved 12 Oct 2026',
            hasLink: true,
            link: {
              href: '/student/experiments/exp-1/simulation/web',
              aria: 'Continue WEB, Shell-and-Tube Heat Exchanger',
              label: 'Continue WEB',
            },
          },
        ],
        acts: [
          {
            cls: 'rb-btn rb-btn--lg',
            href: '/student/experiments/exp-1/simulation',
            label: 'Back to Simulation',
          },
        ],
        help: false,
      },
    };
    const { container } = inRoot(
      <StRefuse
        icon="contentAccess"
        kicker="Shell-and-Tube Heat Exchanger · Simulation"
        title="AR isn’t included for your institution"
        titleId="st-h1"
        description="AR is published for this experiment, but your institution’s access includes WEB and VR only."
        alt={{
          title: 'Formats you can use',
          titleId: 'st-refuse-alt',
          items: [
            {
              key: 'web',
              chip: { code: 'WEB', kind: 'on' },
              title: 'Web simulation',
              srTitle: ' (WEB)',
              meta: 'In progress · saved 12 Oct 2026',
              link: {
                href: '/student/experiments/exp-1/simulation/web',
                label: 'Continue WEB',
                ariaLabel: 'Continue WEB, Shell-and-Tube Heat Exchanger',
              },
            },
          ],
        }}
        actions={
          <ButtonLink size="lg" href="/student/experiments/exp-1/simulation">
            Back to Simulation
          </ButtonLink>
        }
      />,
    );
    expectSameMarkup(container.querySelector('.sv-refuse')!, fill(drawn, scope));
    expect(screen.getByRole('heading', { level: 1 }).tabIndex).toBe(-1);
    expect(screen.getByRole('region', { name: 'AR isn’t included for your institution' }));
    expect(
      screen.getByRole('list', { name: 'Formats you can use' }).querySelectorAll('li'),
    ).toHaveLength(1);
    expectV3ClassesOnly(container);
    expectNoStudentReferences(container);
  });

  it('ST-19 not given: the greyed icon, the date line before it, the one way back and Help', () => {
    const scope = {
      M: {
        icoCls: 'sv-refuse-ico sv-refuse-ico--off',
        ico: 'sti-block',
        hasK: true,
        k: 'Fin-Tube Heat Exchanger',
        t: 'This experiment isn’t available to you',
        d: 'Your institution hasn’t given you Fin-Tube Heat Exchanger. Experiments you can open are in My courses.',
        hasAlt: false,
        alt: [],
        acts: [
          {
            cls: 'rb-btn rb-btn--primary rb-btn--lg',
            href: '/student/courses',
            label: 'Back to My courses',
          },
        ],
        help: true,
      },
      S: { help: { href: '/student/help' } },
    };
    const { container } = inRoot(
      <StRefuse
        date="Monday 12 October 2026"
        icon="unavailable"
        off
        kicker="Fin-Tube Heat Exchanger"
        title="This experiment isn’t available to you"
        titleId="st-h1"
        description="Your institution hasn’t given you Fin-Tube Heat Exchanger. Experiments you can open are in My courses."
        actions={
          <ButtonLink variant="primary" size="lg" href="/student/courses">
            Back to My courses
          </ButtonLink>
        }
        help={{ href: '/student/help', label: 'Help & support' }}
      />,
    );
    expectSameMarkup(container.querySelector('.sv-refuse')!, fill(drawn, scope));
    // The date line is the export's `p.rb-eyebrow-date` right before the card.
    expect(container.querySelector('.sv-refuse')!.previousElementSibling!.outerHTML).toBe(
      '<p class="rb-eyebrow-date">Monday 12 October 2026</p>',
    );
    expect(
      TEMPLATE.slice(at('M.st }}'), at('M.st }}') + 200).includes(
        '<p class="rb-eyebrow-date">{{ S.dateLong }}</p>',
      ),
    ).toBe(true);
    expect(container.querySelector('.sv-refuse-alt')).toBeNull();
  });

  it('the withheld result (ST-14) is the same card with one action', () => {
    const withheld = excerpt(
      '<section class="sv-card sv-refuse" aria-labelledby="st-h1">',
      '</section>',
      at('AR.withheld'),
    );
    const { container } = inRoot(
      <StRefuse
        icon="clock"
        kicker="Heat exchanger check · result"
        title="Your result isn’t released yet"
        titleId="st-h1"
        description="It appears after the deadline."
        actions={
          <ButtonLink size="lg" href="/student/assessments/a-1">
            Back to the assessment
          </ButtonLink>
        }
      />,
    );
    expectSameMarkup(
      container.querySelector('.sv-refuse')!,
      fill(withheld, {
        AR: {
          icoCls: 'sv-refuse-ico',
          ico: 'sti-clock',
          name: 'Heat exchanger check',
          h1: 'Your result isn’t released yet',
          d: 'It appears after the deadline.',
          back: { href: '/student/assessments/a-1', label: 'Back to the assessment' },
        },
      }),
    );
  });
});

describe('the record head and the section tabs', () => {
  it('the hub’s head: the code eyebrow (`st-eyecode`), the record title, the licence wait', () => {
    const drawn = excerpt(
      '<div class="rk-head">',
      '</div>\n      </div>',
      at('ST-05 Experiment hub'),
    );
    const { container } = inRoot(
      <StRecordHead
        date="Monday 12 October 2026"
        lead={<InstitutionCode code="MEC-523" />}
        context="Heat Transfer"
        title="Shell-and-Tube Heat Exchanger"
        titleId="st-h1"
        meta={
          <>
            <StatusPill tone="warn">Waiting for a licence</StatusPill>
            <span>Your institution can tell you more.</span>
          </>
        }
      />,
    );
    expectSameMarkup(
      container.querySelector('.rk-head')!,
      fill(drawn, {
        S: { dateLong: 'Monday 12 October 2026' },
        HB: {
          code: 'MEC-523',
          course: 'Heat Transfer',
          t: 'Shell-and-Tube Heat Exchanger',
          hasPill: true,
          pillCls: 'xr-st xr-st--warn',
          pill: 'Waiting for a licence',
          pillText: 'Your institution can tell you more.',
        },
      }),
    );
    expectV3ClassesOnly(container);
  });

  it('ST-03’s head: the crumbs, the course eyebrow and the wide meta row (`sv-head-meta`)', () => {
    const drawn = excerpt('<nav class="rk-crumbs"', '</div>\n      </div>', at('ST-03 Course'));
    const { container } = inRoot(
      <StRecordHead
        breadcrumbs={
          <Breadcrumbs
            levels={[{ href: '/student/courses', label: 'My courses' }]}
            current="Heat Transfer"
          />
        }
        date="Monday 12 October 2026"
        lead={<InstitutionCode code="MEC-523" />}
        context="Course · Mechanical Engineering"
        title="Heat Transfer"
        titleId="st-h1"
        wideMeta
        meta={
          <>
            <span>
              BITS course code <span className="rb-code">ME ZG523</span>
            </span>
            <span>1 experiment given to you</span>
          </>
        }
      />,
    );
    const rendered = [...container.firstElementChild!.children]
      .map((element) => element.outerHTML)
      .join('');
    expect(comparable(rendered)).toBe(
      comparable(
        fill(drawn, {
          S: { dateLong: 'Monday 12 October 2026' },
          CO: {
            back: { href: '/student/courses' },
            name: 'Heat Transfer',
            code: 'MEC-523',
            area: 'Mechanical Engineering',
            hasPill: false,
            bits: 'ME ZG523',
            meta: '1 experiment given to you',
          },
        }),
      ),
    );
  });

  it('ST-11’s tabs carry their counts (`st-tabn`, read as “, 2”); the hub’s wrap as chips', () => {
    const drawn = excerpt('<nav class="rk-tabs sv-tabs" aria-label="Assessments">', '</nav>');
    const { container } = inRoot(
      <StTabs
        label="Assessments"
        tabs={[
          { href: '/student/assessments', label: 'To do', current: true, count: 2 },
          { href: '/student/assessments?tab=submitted', label: 'Submitted', count: 0 },
          { href: '/student/assessments?tab=results', label: 'Results', count: 1 },
        ]}
      />,
    );
    expectSameMarkup(
      container.querySelector('nav')!,
      fill(drawn, {
        AL: {
          tabs: [
            { href: '/student/assessments', cur: 'page', t: 'To do', hasN: true, n: 2 },
            { href: '/student/assessments?tab=submitted', t: 'Submitted', hasN: true, n: '0' },
            { href: '/student/assessments?tab=results', t: 'Results', hasN: true, n: 1 },
          ],
        },
      }),
    );
    expect(screen.getByRole('link', { name: 'To do, 2' }).getAttribute('aria-current')).toBe(
      'page',
    );

    const hub = excerpt('<nav class="rk-tabs sv-tabs sv-tabs--chips"', '</nav>');
    const tabs = ['Overview', 'Resources', 'Simulation', 'Assessment', 'Progress'];
    const second = inRoot(
      <StTabs
        chips
        label="Shell-and-Tube Heat Exchanger"
        tabs={tabs.map((label, index) => ({ href: `/h/${index}`, label, current: index === 0 }))}
      />,
    );
    expectSameMarkup(
      second.container.querySelector('nav')!,
      fill(hub, {
        HB: {
          tabsAria: 'Shell-and-Tube Heat Exchanger',
          tabs: tabs.map((t, index) => ({
            href: `/h/${index}`,
            t,
            cur: index === 0 ? 'page' : false,
          })),
        },
      }),
    );
    expectV3ClassesOnly(second.container);
  });

  it('at most one tab is current', () => {
    expect(() =>
      render(
        <StTabs
          label="x"
          tabs={[
            { href: '/a', label: 'A', current: true },
            { href: '/b', label: 'B', current: true },
          ]}
        />,
      ),
    ).toThrow('at most one tab is current');
  });
});

describe('formats not available, and the per-format progress (`progExp`)', () => {
  const off: StOffRow[] = [
    {
      code: 'AR',
      kind: 'pub',
      name: 'Augmented reality',
      reason: 'Published for this experiment, not included in your institution’s access',
    },
    {
      code: 'MR',
      kind: 'none',
      name: 'Mixed reality',
      reason: 'Not published for this experiment',
    },
  ];
  const offScope = off.map((row) => ({
    fmtCls: `xr-fmt sv-fmt ${row.kind === 'pub' ? 'xr-fmt--pub' : 'xr-fmt--none'}`,
    code: row.code,
    name: row.name,
    reason: row.reason,
  }));

  it('the “Not available to you” rows are the Overview’s (bare chip, name, reason)', () => {
    const drawn = excerpt('<ul class="sv-xrows" aria-labelledby="sv-fm-off">', '</ul>');
    const { container } = inRoot(<StOffRows labelledBy="sv-fm-off" rows={off} />);
    expectSameMarkup(container.querySelector('.sv-xrows')!, fill(drawn, { HO: { off: offScope } }));
    expect(SCRIPT).toContain(
      "reason: f === 'AR' ? 'Published for this experiment, not included in your institution’s access' : 'Not published for this experiment'",
    );
  });

  it('ST-10’s flat block: the table, the formats not available, the assessment line', () => {
    const drawn = excerpt(
      '<div class="sv-pexp sv-pexp--flat">',
      '</a></sc-if></p>\n        </div>',
    );
    const rows: StProgressRow[] = [
      {
        key: 'web',
        chip: { code: 'WEB', kind: 'on' },
        name: 'Web simulation',
        access: 'Available to you',
        status: { tone: 'warn', words: 'In progress' },
        facts: ['First opened 12 Oct 2026, 10:04', 'Last saved 12 Oct 2026, 10:31'],
        actions: (
          <ButtonLink
            variant="primary"
            href="/student/experiments/exp-1/simulation/web"
            aria-label="Continue WEB, Shell-and-Tube Heat Exchanger"
          >
            Continue WEB
          </ButtonLink>
        ),
      },
      {
        key: 'vr',
        chip: { code: 'VR', kind: 'held', glyph: 'alertCircle' },
        name: 'Virtual reality',
        access: 'Not available right now',
        status: { tone: 'neutral', words: 'Not available right now' },
        facts: [],
      },
    ];
    const { container } = inRoot(
      <StProgressBlock flat>
        <StProgressTable
          caption="Your formats for Shell-and-Tube Heat Exchanger"
          columns={{
            format: 'Your format',
            progress: 'Progress',
            details: 'Details',
            action: 'Action',
          }}
          rows={rows}
        />
        <StProgressOff title="Not available to you" titleId="st-pt-off" rows={off} />
        <StAssessmentLine
          label="Assessment"
          link={{ href: '/student/assessments/a-1', label: 'Open assessment' }}
        >
          To do, due 14 Nov 2026
        </StAssessmentLine>
      </StProgressBlock>,
    );
    expectSameMarkup(
      container.querySelector('.sv-pexp')!,
      fill(drawn, {
        PT: {
          exp: {
            capt: 'Your formats for Shell-and-Tube Heat Exchanger',
            mine: [
              {
                fmtCls: 'xr-fmt sv-fmt sv-fmt--on',
                code: 'WEB',
                hasGlyph: true,
                glyph: 'sti-check',
                name: 'Web simulation',
                access: 'Available to you',
                pillCls: 'xr-st xr-st--warn',
                pill: 'In progress',
                facts: ['First opened 12 Oct 2026, 10:04', 'Last saved 12 Oct 2026, 10:31'],
                acts: [
                  {
                    cls: 'rb-btn rb-btn--primary',
                    href: '/student/experiments/exp-1/simulation/web',
                    aria: 'Continue WEB, Shell-and-Tube Heat Exchanger',
                    label: 'Continue WEB',
                  },
                ],
              },
              {
                fmtCls: 'xr-fmt sv-fmt sv-fmt--held',
                code: 'VR',
                hasGlyph: true,
                glyph: 'sti-alert',
                name: 'Virtual reality',
                access: 'Not available right now',
                pillCls: 'xr-st',
                pill: 'Not available right now',
                facts: [],
                acts: [],
              },
            ],
            hasOff: true,
            offId: 'st-pt-off',
            off: offScope,
            asmt: 'To do, due 14 Nov 2026',
            hasAsmtLink: true,
            asmtLink: { href: '/student/assessments/a-1', label: 'Open assessment' },
          },
        },
      }),
    );
    expect(
      screen.getByRole('table', { name: 'Your formats for Shell-and-Tube Heat Exchanger' }),
    ).toBeTruthy();
    expect(container.querySelector('th[scope="row"]')!.textContent).toBe(
      'WEBWeb simulation (WEB)Available to you',
    );
    expectV3ClassesOnly(container);
  });

  it('ST-15’s block is an article named by its head; its “Not available” heading is an h5', () => {
    const { container } = inRoot(
      <StProgressBlock labelledBy="st-pe-1">
        <h4 id="st-pe-1">Shell-and-Tube Heat Exchanger</h4>
        <StProgressOff title="Not available to you" titleId="st-pe-1-off" level={5} rows={off} />
      </StProgressBlock>,
    );
    expect(screen.getByRole('article', { name: 'Shell-and-Tube Heat Exchanger' })).toBe(
      container.querySelector('article.sv-pexp'),
    );
    expect(container.querySelector('h5.sv-subk')!.id).toBe('st-pe-1-off');
    expect(excerpt('<div class="sv-poff">', '</div>', at('ST-15 Progress'))).toContain(
      '<h5 class="sv-subk" id="{{ e.offId }}">',
    );
  });
});

describe('surfaces, headings, rows and the small pieces', () => {
  it('ST-03’s card head (`sv-card-h`: `sv-sec-t` + `sv-sh-note`)', () => {
    const drawn = excerpt('<div class="sv-card-h"><h2 class="sv-sec-t" id="st-co-h">', '</div>');
    const { container } = inRoot(
      <StCardHead>
        <StSectionTitle id="st-co-h">Experiments given to you</StSectionTitle>
        <StNote>Only experiments given to you are listed</StNote>
      </StCardHead>,
    );
    expectSameMarkup(container.querySelector('.sv-card-h')!, fill(drawn, {}));
  });

  it('the Home’s shelf heads (`sv-sh`, with its note in `sv-sh-row`) and outcomes card', () => {
    const row = excerpt('<div class="sv-sh-row"><h2 class="sv-sh" id="sv-learn-h">', '</div>');
    const one = inRoot(
      <StShelfHead
        title="What you’re learning"
        titleId="sv-learn-h"
        note="The same in every format"
      />,
    );
    expectSameMarkup(one.container.querySelector('.sv-sh-row')!, fill(row, {}));
    one.unmount();
    const plain = excerpt('<h2 class="sv-sh" id="sv-also-h">', '</h2>');
    const two = inRoot(<StShelfHead title="Also in this experiment" titleId="sv-also-h" />);
    expectSameMarkup(
      two.container.querySelector('.sv-sh')!,
      fill(plain, { H: { also: { h: 'Also in this experiment' } } }),
    );
    two.unmount();
    const outcomes = excerpt('<ol class="sv-card sv-outcomes">', '</ol>');
    const items = ['Read a heat balance', 'Compare flow arrangements'];
    const three = inRoot(<StOutcomes items={items} />);
    expectSameMarkup(
      three.container.querySelector('ol')!,
      fill(outcomes, { H: { cover: { outcomes: items } } }),
    );
    three.unmount();
    const flat = excerpt('<ol class="sv-outcomes sv-outcomes--flat">', '</ol>');
    const four = inRoot(<StOutcomes flat items={items} />);
    expectSameMarkup(four.container.querySelector('ol')!, fill(flat, { HB: { outcomes: items } }));
  });

  it('ST-06’s aside (`sv-ov-side`, `sv-side-sec`, `sv-h3`, `sv-side-d`) inside the overview layout', () => {
    const drawn = excerpt(
      '<aside class="sv-card sv-ov-side" aria-label="How resources fit in">',
      '</aside>',
    );
    const { container } = inRoot(
      <StOverview>
        <StAside label="How resources fit in">
          <StSideSection labelledBy="st-res-a1">
            <StSideTitle id="st-res-a1">Before you run a simulation</StSideTitle>
            <StSideText>
              Read these first if you can. Nothing is locked: every format you have opens at any
              time.
            </StSideText>
          </StSideSection>
          <StSideSection labelledBy="st-res-a2">
            <StSideTitle id="st-res-a2">Opened isn’t progress</StSideTitle>
            <StSideText>
              Opening a resource is recorded with the time. Your progress is counted per format, in
              the Progress tab.
            </StSideText>
            <p className="sv-res-count">1 of 3 opened</p>
          </StSideSection>
        </StAside>
      </StOverview>,
    );
    expectSameMarkup(
      container.querySelector('aside')!,
      fill(drawn, { RS: { openedText: '1 of 3 opened' } }),
    );
    expect(container.querySelector('.sv-ov > aside')).toBeTruthy();
  });

  it('ST-11’s row (`sv-li sv-ali`: the date lead, kicker, title, clamp, meta, the action)', () => {
    const drawn = excerpt('<li class="sv-li sv-ali">', '</li>');
    const { container } = inRoot(
      <StList>
        <StListRow
          variant="assessment"
          lead={
            <>
              <StEyebrow>Due</StEyebrow>
              <div className="sv-when">
                <p className="sv-when-d">14 Nov</p>
                <p className="sv-when-t">23:59 · in 13 days</p>
              </div>
            </>
          }
          end={
            <ButtonLink
              variant="primary"
              href="/student/assessments/a-1"
              aria-label="Open assessment Heat exchanger check"
            >
              Open
            </ButtonLink>
          }
        >
          <StRowKicker>Shell-and-Tube Heat Exchanger</StRowKicker>
          <StRowTitle>Heat exchanger check</StRowTitle>
          <StRowText clamp>Four questions on the heat balance.</StRowText>
          <StRowMeta>
            <StatusPill tone="neutral">To do</StatusPill>
            <span>4 questions · 16 marks</span>
          </StRowMeta>
        </StListRow>
      </StList>,
    );
    expectSameMarkup(
      container.querySelector('li')!,
      fill(drawn, {
        r: {
          whenK: 'Due',
          when: { cls: 'sv-when', d: '14 Nov', t: '23:59 · in 13 days' },
          kicker: 'Shell-and-Tube Heat Exchanger',
          name: 'Heat exchanger check',
          desc: 'Four questions on the heat balance.',
          pillCls: 'xr-st',
          pill: 'To do',
          sub: '4 questions · 16 marks',
          btnCls: 'rb-btn rb-btn--primary',
          href: '/student/assessments/a-1',
          aria: 'Open assessment Heat exchanger check',
          act: 'Open',
        },
      }),
    );
    expect(container.querySelector('ul.sv-list')).toBeTruthy();
  });

  it('ST-03’s experiment row (`sv-li sv-xli`, no lead) and the text link (`sv-link` ›)', () => {
    const { container } = inRoot(
      <StList>
        <StListRow
          variant="experiment"
          end={
            <ButtonLink href="/student/experiments/exp-1" aria-label="Open experiment X">
              Open experiment
            </ButtonLink>
          }
        >
          <StRowTitle id="st-co-e1">X</StRowTitle>
          <StRowText>About X.</StRowText>
        </StListRow>
      </StList>,
    );
    const row = container.querySelector('li')!;
    expect(row.className).toBe('sv-li sv-xli');
    expect([...row.children].map((child) => child.className)).toEqual(['sv-li-main', 'sv-li-end']);

    const link = excerpt('<a class="sv-link" href="{{ e.href }}"', '</a>', at('ST-15 Progress'));
    const second = inRoot(
      <StTextLink href="/student/experiments/exp-1" ariaLabel="Open experiment X">
        Open experiment
      </StTextLink>,
    );
    expectSameMarkup(
      second.container.querySelector('a')!,
      fill(link, { e: { href: '/student/experiments/exp-1', aria: 'Open experiment X' } }),
    );
  });

  it('the how-to steps are ST-18’s “How a transfer works” and ST-09’s set-up', () => {
    const device = excerpt('<ol class="sv-howto sv-devhow">', '</ol>');
    const steps = [
      {
        key: '1',
        title: 'You ask for the transfer',
        detail: 'Name the new device and add a note if it helps.',
      },
      { key: '2', title: 'Your Institute Admin forwards it', detail: 'The request goes to BITS.' },
      { key: '3', title: 'BITS approves it', detail: 'Your authorised device changes here.' },
    ];
    const one = inRoot(<StHowTo device steps={steps} />);
    expectSameMarkup(one.container.querySelector('ol')!, fill(device, {}));
    one.unmount();
    const setup = excerpt('<ol class="sv-howto" id="st-setup">', '</ol>');
    const two = inRoot(<StHowTo id="st-setup" steps={steps.slice(0, 2)} />);
    expectSameMarkup(
      two.container.querySelector('ol')!,
      fill(setup, {
        FP: {
          setup: steps
            .slice(0, 2)
            .map((step, index) => ({ n: index + 1, t: step.title, d: step.detail })),
        },
      }),
    );
  });

  it('the sub-heading, the eyebrow and the card are the export’s small pieces', () => {
    const { container } = inRoot(
      <StCard labelledBy="h">
        <StSubheading id="h">Your formats</StSubheading>
        <StEyebrow>Deadline</StEyebrow>
      </StCard>,
    );
    expect(container.querySelector('section')!.outerHTML).toBe(
      '<section class="sv-card" aria-labelledby="h"><h3 class="sv-subk" id="h">Your formats</h3><p class="sv-eyebrow">Deadline</p></section>',
    );
    expect(TEMPLATE).toContain('<h3 class="sv-subk" id="sv-fm-mine">Your formats</h3>');
    expect(TEMPLATE).toContain('<p class="sv-eyebrow">Deadline</p>');
  });
});

describe('a composed page passes the class contract, the identifier rule and axe', () => {
  it('a hub tab with every shared piece', async () => {
    const { container } = inRoot(
      <main>
        <StRecordHead
          breadcrumbs={
            <Breadcrumbs
              levels={[{ href: '/student/courses', label: 'My courses' }]}
              current="Shell-and-Tube"
            />
          }
          lead={<StFormatChip code="WEB" kind="on" />}
          context="Shell-and-Tube Heat Exchanger"
          title="Web simulation"
          titleId="st-h1"
          meta={<StatusPill tone="ok">Completed 14 Oct 2026</StatusPill>}
        />
        <StTabs
          chips
          label="Shell-and-Tube Heat Exchanger"
          tabs={[
            { href: '/a', label: 'Overview' },
            { href: '/b', label: 'Progress', current: true },
          ]}
        />
        <StCard labelledBy="st-fr-h">
          <StCardHead>
            <StSectionTitle id="st-fr-h">Your progress, format by format</StSectionTitle>
            <StNote>1 format given to you</StNote>
          </StCardHead>
          <StHoldNote icon="pauseBars" inTab>
            Your institution’s access is paused. Your progress is kept.
          </StHoldNote>
          <StProgressBlock flat>
            <StProgressTable
              caption="Your formats"
              columns={{
                format: 'Your format',
                progress: 'Progress',
                details: 'Details',
                action: 'Action',
              }}
              rows={[
                {
                  key: 'web',
                  chip: { code: 'WEB', kind: 'held', glyph: 'pauseBars' },
                  name: 'Web simulation',
                  access: 'Paused',
                  status: { tone: 'paused', words: 'Paused' },
                  facts: ['First opened 12 Oct 2026, 10:04'],
                },
              ]}
            />
            <StProgressOff
              title="Not available to you"
              titleId="off"
              rows={[
                {
                  code: 'MR',
                  kind: 'none',
                  name: 'Mixed reality',
                  reason: 'Not published for this experiment',
                },
              ]}
            />
            <StAssessmentLine label="Assessment">None set yet</StAssessmentLine>
          </StProgressBlock>
        </StCard>
        <StMessage
          icon="cloudAlert"
          tone="err"
          alert
          title="We couldn’t load"
          titleId="m1"
          description="Nothing has changed. Try again."
          retry={{ label: 'Try again', onRetry: () => undefined }}
        />
        <StLoading label="Loading resources…" />
        <StStateRow
          icon="search"
          titleAs="p"
          title="No experiments match"
          description="Try fewer filters."
        />
      </main>,
    );
    expectV3ClassesOnly(container);
    expectNoStudentReferences(container);
    await assertNoAxeViolations(container);
  });

  it('a refusal page', async () => {
    const { container } = inRoot(
      <main>
        <StRefuse
          date="Monday 12 October 2026"
          icon="headset"
          off
          kicker="My device"
          title="My device isn’t available to you"
          titleId="st-h1"
          description="It’s for students who use AR, VR or MR formats."
          actions={
            <ButtonLink variant="primary" size="lg" href="/student">
              Back to Home
            </ButtonLink>
          }
          help={{ href: '/student/help', label: 'Help & support' }}
        />
      </main>,
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});
