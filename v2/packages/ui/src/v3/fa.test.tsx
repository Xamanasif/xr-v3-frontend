/**
 * What more than one Faculty screen group draws (owner-approved export
 * design/v3-refined-b/roles/FA-v1, `project/Main.dc.html`, `project/fa.css`; FA-ANALYSIS §5.3):
 * each piece is rendered with sample values and compared with the export's template filled the
 * way its script fills it (`sc-for`, `sc-if`, `{{ … }}`, the `fai-*` sprite inlined from its own
 * symbols); then the class contract, the behaviour and the accessibility checks.
 *
 * Normalised on both sides, each for a recorded reason: the explicit table roles the kit adds to
 * tables that reflow on phones (ADR-0010, as `RecordTable`); the `role="img"` the kit gives the
 * named format badges (a name on a `span` needs a role, as the Academic Reviewer's badges); the
 * export's inline `style` values, which the kit does not draw (the consolidation patches them
 * centrally, as V3P-14 / V3P-16 did); the script's `fa-u` on a grey unit, a class no sheet defines;
 * a select's `value` and its option's `selected` (one state written two ways); the radio cards'
 * name and description wiring the kit adds (`aria-labelledby`, `aria-describedby` and the ids they
 * point at, as the kit's `ChoiceGroup`); and the order of class tokens.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectNoInternalReferences,
  expectV3ClassesOnly,
  faExportText,
  faPatchedMarkup,
  v3Canonical,
} from '../testing/index.js';
import { Button, ButtonLink, TextLink } from './actions.js';
import { ErrorSummary, Field, Hint, PendingHint, Textarea, TextInput } from './fields.js';
import {
  FA_DENSE_UNITS_ABOVE,
  FaActions,
  FaAside,
  FaAssessmentDue,
  FaAssessmentId,
  FaAssessmentName,
  FaAssessmentNote,
  FaAssessmentSubmissions,
  FaAssessmentWait,
  FaAuthor,
  FaCellActions,
  FaCellLine,
  FaCellMeter,
  FaCellName,
  FaCellSub,
  FaChecklist,
  FaChoiceGroup,
  FaCount,
  FaDetail,
  FaExportBand,
  FaFigure,
  FaFigures,
  FaFilters,
  FaFormatBadges,
  FaFormColumn,
  FaFormFoot,
  FaFormMessages,
  FaFormSection,
  FaGuide,
  FaId,
  FaIdentityBand,
  FaInlineMessage,
  FaKey,
  FaMainSheet,
  FaMessageCard,
  FaPanel,
  FaPanelActions,
  FaPickCount,
  FaProgress,
  FaQuestionHead,
  FaQuestionMarks,
  FaQuestionMeta,
  FaQuestionText,
  FaQuiet,
  FaRecordMetaText,
  FaRecordTabs,
  FaRecordWaitLink,
  FaResourceList,
  FaResult,
  FaResultMark,
  FaResultText,
  FaRowLink,
  FaSearchField,
  FaSegmented,
  FaSelectField,
  FaSheetQuestionHead,
  FaSide,
  FaSideSection,
  FaStatusLine,
  FaSteps,
  FaTable,
  FaTableBar,
  FaTag,
  FaToolbar,
  FaUnits,
  FaWaitLine,
  type FaFilterChip,
  type FaUnitState,
} from './fa.js';
import { ListState } from './list.js';
import { Notice } from './notices.js';
import { StatusPill } from './status.js';

const MAIN = faExportText('Main.dc.html');
const TEMPLATE = MAIN.slice(0, MAIN.indexOf('<script type="text/x-dc"'));

/** The export's sprite (`fai-*`), by id. */
const SYMBOLS = new Map(
  [...MAIN.matchAll(/<symbol id="(fai-[\w-]+)" viewBox="0 0 24 24"><path d="([^"]+)"/g)].map(
    (match) => [match[1] ?? '', match[2] ?? ''] as const,
  ),
);

type Scope = Readonly<Record<string, unknown>>;

function lookup(scope: Scope, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    return value && typeof value === 'object' ? (value as Scope)[key] : undefined;
  }, scope);
}

/**
 * `{{ name }}` replaced; an attribute bound to nothing or to `false` (`aria-current="{{ x.cur }}"`,
 * `checked="{{ o.checked }}"`) dropped, one bound to `true` written bare.
 */
function substitute(html: string, scope: Scope): string {
  return html
    .replace(/ ([\w-]+)="\{\{ ([\w.]+) \}\}"/g, (_whole, name: string, path: string) => {
      const value = lookup(scope, path);
      if (value === undefined || value === null || value === false) return '';
      return value === true ? ` ${name}=""` : ` ${name}="${String(value)}"`;
    })
    .replace(/\{\{ ([\w.]+) \}\}/g, (_whole, path: string) => String(lookup(scope, path) ?? ''));
}

/**
 * An excerpt of the export's template filled as its runtime fills it: each `sc-for` repeated over
 * its list and each `sc-if` kept or dropped (nested ones too), each `{{ name }}` replaced; the
 * preview's wiring (event bindings) and empty `class=""` dropped; sprites inlined; the inline
 * styles and the undefined `fa-u` dropped (see the file's head).
 */
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
  return faPatchedMarkup(out)
    .replace(/ on[A-Z][A-Za-z]*="[^"]*"/g, '')
    .replace(/ style="[^"]*"/g, '')
    .replace(/ class="fa-u"/g, '')
    .replace(/ class=""/g, '')
    .replace(/<use href="#(fai-[\w-]+)"><\/use>/g, (whole, id: string) => {
      const path = SYMBOLS.get(id);
      return path ? `<path d="${path}"></path>` : whole;
    });
}

/** The template from `start` to the end marker `end` after it (inclusive). */
function excerpt(start: string, end: string, after = 0): string {
  const from = TEMPLATE.indexOf(start, after);
  expect(from, `the export draws ${start}`).toBeGreaterThanOrEqual(0);
  const to = TEMPLATE.indexOf(end, from);
  expect(to, `the export closes ${start} with ${end}`).toBeGreaterThan(from);
  return TEMPLATE.slice(from, to + end.length);
}

/** The template's offset of a section marker, to start an excerpt inside one screen. */
function at(marker: string): number {
  const index = TEMPLATE.indexOf(marker);
  expect(index, `the export marks ${marker}`).toBeGreaterThanOrEqual(0);
  return index;
}

/** Class tokens in name order: the export writes a cell's place and its column in either order. */
function sortedClasses(html: string): string {
  return html.replace(/ class="([^"]*)"/g, (_whole, value: string) => {
    return ` class="${value.split(/\s+/).filter(Boolean).sort().join(' ')}"`;
  });
}

/** The recorded normalisations (see the file's head). */
function comparable(html: string): string {
  return sortedClasses(v3Canonical(html))
    .replace(/ role="(?:table|rowgroup|row|columnheader|cell|img)"/g, '')
    .replace(/ selected=""/g, '')
    .replace(/(<select[^>]*?) value="[^"]*"/g, '$1')
    .replace(/ aria-(?:labelledby|describedby)="fa-t-[^"]*"/g, '')
    .replace(/(<span class="rk-choice-[td]") id="[^"]*"/g, '$1');
}

function expectSameMarkup(element: Element, expected: string) {
  expect(comparable(element.outerHTML)).toBe(comparable(expected));
}

/** Rendered inside a V3 root, as the shell renders the pages. */
function inRoot(ui: ReactNode) {
  return render(<div className="xr rb">{ui}</div>);
}

const WORDS = { completed: 'completed', inProgress: 'in progress', notStarted: 'not started' };

/** The export's `unitsOf`: its class per unit. */
function unitClasses(units: readonly FaUnitState[]): string[] {
  return units.map((unit) =>
    unit === 'done'
      ? 'is-done'
      : unit === 'progress'
        ? 'is-prog'
        : unit === 'submitted'
          ? 'is-sub'
          : 'fa-u',
  );
}

describe('the format badges and the unit meters (P4)', () => {
  it('the format badges are the export’s `span.rk-fmts` (FA-02), drawn WEB, AR, VR, MR', () => {
    const drawn = excerpt('<span class="rk-fmts" aria-label="{{ e.fmAria }}">', '</sc-for></span>');
    const { container } = inRoot(
      <FaFormatBadges formats={['VR', 'WEB']} label="Formats your institution has: WEB, VR" />,
    );
    expectSameMarkup(
      container.querySelector('.rk-fmts')!,
      fill(drawn, { e: { fmAria: 'Formats your institution has: WEB, VR', fm: ['WEB', 'VR'] } }),
    );
    expect(screen.getByRole('img', { name: 'Formats your institution has: WEB, VR' })).toBe(
      container.querySelector('.rk-fmts'),
    );
  });

  it('FA-05’s per-format progress: the code, the unit meter and the three counts in words', () => {
    const drawn = excerpt('<ul class="fa-prog" aria-label="{{ E1.progAria }}">', '</ul>');
    const web: FaUnitState[] = ['done', 'done', 'progress', 'none'];
    const vr: FaUnitState[] = ['progress', 'none', 'none', 'none'];
    const { container } = inRoot(
      <FaProgress
        label="Student activity by format for Venturi Meter, as of 7 Nov 2026"
        words={WORDS}
        rows={[
          { format: 'WEB', completed: 2, inProgress: 1, notStarted: 1, units: web },
          { format: 'VR', completed: 0, inProgress: 1, notStarted: 3, units: vr },
        ]}
      />,
    );
    expectSameMarkup(
      container.querySelector('ul')!,
      fill(drawn, {
        E1: {
          progAria: 'Student activity by format for Venturi Meter, as of 7 Nov 2026',
          prog: [
            {
              code: 'WEB',
              done: '2',
              prog: '1',
              none: '1',
              units: unitClasses(web),
              unitsCls: 'fa-units',
            },
            {
              code: 'VR',
              done: '0',
              prog: '1',
              none: '3',
              units: unitClasses(vr),
              unitsCls: 'fa-units',
            },
          ],
        },
      }),
    );
    expect(screen.getByRole('list', { name: /Student activity by format/ }).textContent).toContain(
      'WEB2 completed1 in progress1 not started',
    );
  });

  it('FA-04’s table cell (`fa-prog--cell`) and FA-20’s summary (`fa-prog--sum`)', () => {
    const cell = excerpt(
      '<ul class="fa-prog fa-prog--cell" aria-label="{{ r.progAria }}">',
      '</ul>',
    );
    const sum = excerpt('<ul class="fa-prog fa-prog--sum" aria-label="{{ SL.sumAria }}">', '</ul>');
    const units: FaUnitState[] = ['done', 'none'];
    const row = { format: 'WEB' as const, completed: 1, inProgress: 0, notStarted: 1, units };
    const prog = [
      {
        code: 'WEB',
        done: '1',
        prog: '0',
        none: '1',
        units: unitClasses(units),
        unitsCls: 'fa-units',
      },
    ];
    const { container } = inRoot(
      <>
        <FaProgress variant="cell" label="Activity" words={WORDS} rows={[row]} />
        <FaProgress variant="sum" label="Summary" words={WORDS} rows={[row]} />
      </>,
    );
    const [cellList, sumList] = container.querySelectorAll('ul');
    expectSameMarkup(cellList!, fill(cell, { r: { progAria: 'Activity', prog } }));
    expectSameMarkup(sumList!, fill(sum, { SL: { sumAria: 'Summary', sum: prog } }));
  });

  it('a meter of more than 24 units is dense; units are decorative', () => {
    const { container } = inRoot(
      <>
        <FaUnits units={Array.from({ length: FA_DENSE_UNITS_ABOVE }, () => 'submitted' as const)} />
        <FaUnits units={Array.from({ length: FA_DENSE_UNITS_ABOVE + 1 }, () => 'none' as const)} />
      </>,
    );
    const [even, dense] = container.querySelectorAll('.fa-units');
    expect(even!.className).toBe('fa-units');
    expect(dense!.className).toBe('fa-units fa-units--dense');
    expect(dense).toHaveAttribute('aria-hidden', 'true');
    expect(even!.querySelectorAll('i.is-sub')).toHaveLength(24);
    expect(dense!.querySelectorAll('i[class]')).toHaveLength(0);
  });
});

describe('the identity and record bands (P2)', () => {
  it('FA-03’s identity band: date, code and kicker, the H1, the source, three figures', () => {
    const drawn = excerpt('<header class="fa-cid">', '</header>', at('FA-03 Course'));
    const { container } = inRoot(
      <FaIdentityBand
        date="Saturday 7 November 2026"
        code="ME ZG523"
        kicker="Course you teach"
        title="Thermodynamics and Heat Transfer"
        titleId="fa-h1"
        source="Assigned by your Institute Admin in Faculty courses"
        figures={
          <FaFigures>
            <FaFigure term="Experiments" value="2" />
            <FaFigure term="Students with access" value="5" />
            <FaFigure term="Assessments" value="1" />
          </FaFigures>
        }
      />,
    );
    expectSameMarkup(
      container.querySelector('header')!,
      fill(drawn, {
        sh: { date: 'Saturday 7 November 2026' },
        C1: {
          code: 'ME ZG523',
          t: 'Thermodynamics and Heat Transfer',
          src: 'Assigned by your Institute Admin in Faculty courses',
          f1l: 'Experiments',
          f1: '2',
          f2l: 'Students with access',
          f2: '5',
          f3l: 'Assessments',
          f3: '1',
        },
      }),
    );
    const h1 = screen.getByRole('heading', { level: 1, name: 'Thermodynamics and Heat Transfer' });
    expect(h1).toHaveAttribute('tabindex', '-1');
  });

  it('FA-05’s band: the formats figures (`fa-fig--fm`), a quiet “None yet”', () => {
    const drawn = excerpt('<header class="fa-cid">', '</header>', at('FA-05 Experiment'));
    const { container } = inRoot(
      <FaIdentityBand
        date="Saturday 7 November 2026"
        code="ME ZG523"
        kicker="Experiment you teach · Thermodynamics and Heat Transfer"
        title="Venturi Meter"
        titleId="fa-h1"
        figures={
          <FaFigures>
            <FaFigure
              formats
              term="Formats your institution has"
              value={
                <FaFormatBadges
                  formats={['WEB', 'VR']}
                  label="Formats your institution has: WEB, VR"
                />
              }
            />
            <FaFigure formats quiet term="Formats your students have used" value="None yet" />
            <FaFigure term="Students with access" value="None yet" />
          </FaFigures>
        }
      />,
    );
    expectSameMarkup(
      container.querySelector('header')!,
      fill(drawn, {
        sh: { date: 'Saturday 7 November 2026' },
        E1: {
          code: 'ME ZG523',
          kicker: 'Experiment you teach · Thermodynamics and Heat Transfer',
          t: 'Venturi Meter',
          fmAria: 'Formats your institution has: WEB, VR',
          fm: ['WEB', 'VR'],
          usedCls: 'is-quiet',
          hasUsed: false,
          noUsed: true,
          reach: 'None yet',
        },
      }),
    );
  });

  it('the record band (FA-08 … FA-12): the meta line with separators, figures with a meter and tones', () => {
    const drawn = excerpt('<header class="fa-cid fa-rec">', '</header>');
    const units: FaUnitState[] = ['submitted', 'submitted', 'none', 'none', 'none'];
    const { container } = inRoot(
      <FaIdentityBand
        date="Saturday 7 November 2026"
        code="ME ZG523"
        kicker="Shell-and-Tube Heat Exchanger"
        title="Heat Exchanger — post-lab"
        titleId="fa-h1"
        meta={[
          <StatusPill key="st" tone="ok">
            Ready
          </StatusPill>,
          <FaRecordMetaText key="ver">Version 2 since 2 Nov 2026</FaRecordMetaText>,
          <FaRecordWaitLink key="wait" href="/faculty/marking">
            2 waiting for marking
          </FaRecordWaitLink>,
        ]}
        figures={
          <FaFigures>
            <FaFigure term="Due 14 Nov 2026, 23:59" value="7 days left" tone="warn" />
            <FaFigure term="Students submitted" value="2 of 5" tone="plain" units={units} />
            <FaFigure term="Questions · 16 marks" value="4" tone="plain" />
          </FaFigures>
        }
      />,
    );
    expectSameMarkup(
      container.querySelector('header')!,
      fill(drawn, {
        sh: { date: 'Saturday 7 November 2026' },
        AR: {
          code: 'ME ZG523',
          expT: 'Shell-and-Tube Heat Exchanger',
          h1: 'Heat Exchanger — post-lab',
          stCls: 'xr-st xr-st--ok',
          st: 'Ready',
          hasVerShort: true,
          verShort: 'Version 2 since 2 Nov 2026',
          notOwn: false,
          hasWait: true,
          waitText: '2 waiting for marking',
          figs: [
            { k: 'Due 14 Nov 2026, 23:59', v: '7 days left', vCls: 'fa-fig-v is-warn' },
            {
              k: 'Students submitted',
              v: '2 of 5',
              vCls: 'fa-fig-v',
              hasUnits: true,
              units: unitClasses(units),
              unitsCls: 'fa-units',
            },
            { k: 'Questions · 16 marks', v: '4', vCls: 'fa-fig-v' },
          ],
        },
      }).replace(' href="#FA-18"', ' href="/faculty/marking"'),
    );
  });
});

describe('the detail layout and the assessment panel', () => {
  it('FA-05’s aside: the panel with the assessment’s identity, meter, wait, note and actions', () => {
    const drawn = excerpt('<aside class="rk-aside" aria-labelledby="fa-e1-asm">', '</aside>');
    const units: FaUnitState[] = ['submitted', 'none'];
    const { container } = inRoot(
      <FaAside labelledBy="fa-e1-asm">
        <FaPanel title="Assessment" titleId="fa-e1-asm" assessment>
          <FaAssessmentId>
            <StatusPill tone="ok">Ready</StatusPill>
            <FaAssessmentName href="/faculty/assessments/a">
              Heat Exchanger — post-lab
            </FaAssessmentName>
            <FaAssessmentDue left="7 days left">Due 14 Nov 2026, 23:59</FaAssessmentDue>
          </FaAssessmentId>
          <FaAssessmentSubmissions units={units}>1 of 2 students submitted</FaAssessmentSubmissions>
          <FaAssessmentWait>1 written answer waiting for marking</FaAssessmentWait>
          <FaAssessmentNote>Choice questions are marked automatically.</FaAssessmentNote>
          <FaPanelActions>
            <ButtonLink
              href="/faculty/marking/x"
              variant="primary"
              size="lg"
              aria-label="Mark Rahul Verma"
            >
              Mark 1 written answer
            </ButtonLink>
            <ButtonLink href="/faculty/assessments/a" size="lg">
              Open assessment
            </ButtonLink>
          </FaPanelActions>
        </FaPanel>
      </FaAside>,
    );
    const filled = fill(drawn, {
      E1: {
        hasAsm: true,
        stCls: 'xr-st xr-st--ok',
        stLabel: 'Ready',
        asmName: 'Heat Exchanger — post-lab',
        dueLine: 'Due 14 Nov 2026, 23:59',
        hasLeft: true,
        left: '7 days left',
        showSubs: true,
        subsCls: 'fa-units',
        subsUnits: unitClasses(units),
        subsLine: '1 of 2 students submitted',
        hasWait: true,
        waitLine: '1 written answer waiting for marking',
        hasNote: true,
        note: 'Choice questions are marked automatically.',
        canMark: true,
        markAria: 'Mark Rahul Verma',
        markLabel: 'Mark 1 written answer',
        asmAct: 'Open assessment',
      },
    })
      .replace(/href="#FA-08"/g, 'href="/faculty/assessments/a"')
      .replace('href="#FA-19"', 'href="/faculty/marking/x"');
    expectSameMarkup(container.querySelector('aside')!, filled);
  });

  it('FA-21’s aside and a sheet beside it, the aside first on narrow widths', () => {
    const drawn = excerpt(
      '<div class="rk-panel-body fa-apanel">',
      '</div>\n            </div>',
      at('FA-21 Student detail'),
    );
    const { container } = inRoot(
      <FaDetail asideFirst>
        <FaMainSheet>
          <p>Progress</p>
        </FaMainSheet>
        <FaAside labelledBy="fa-sd-asm">
          <FaPanel title="Assessment" titleId="fa-sd-asm" assessment>
            <FaAssessmentId>
              <StatusPill tone="warn">Waiting for marking</StatusPill>
              <FaAssessmentName>Heat Exchanger — post-lab</FaAssessmentName>
              <FaAssessmentDue>Attempt 1 · submitted 5 Nov 2026</FaAssessmentDue>
            </FaAssessmentId>
            <FaAssessmentNote>Choice answers are marked.</FaAssessmentNote>
          </FaPanel>
        </FaAside>
      </FaDetail>,
    );
    expect(
      container.querySelector(
        '.rk-detailwrap > .rk-detail.fa-asidefirst > .rk-surface.rk-mainsheet',
      ),
    ).not.toBeNull();
    expectSameMarkup(
      container.querySelector('.fa-apanel')!,
      fill(drawn.slice(0, drawn.lastIndexOf('</div>\n            </div>')) + '</div>', {
        SD: {
          aCls: 'xr-st xr-st--warn',
          aSt: 'Waiting for marking',
          hasAsmName: true,
          asmName: 'Heat Exchanger — post-lab',
          asmSub: 'Attempt 1 · submitted 5 Nov 2026',
          hasALine: true,
          aLine: 'Choice answers are marked.',
        },
      }),
    );
    expect(screen.getByRole('complementary', { name: 'Assessment' })).toBeInTheDocument();
  });

  it('a panel head’s note (`fa-ph-note`, FA-08 “Oldest first”) and the row wait line (`fa-xwait`)', () => {
    const head = excerpt('<div class="rk-panel-head"><h2 id="fa-as-subs">', '</div>');
    const wait = excerpt('<span class="fa-xwait">', '</span>', at('FA-06 Assessments'));
    const { container } = inRoot(
      <>
        <FaPanel title="Submissions" titleId="fa-as-subs" note="Oldest first">
          <p>Body</p>
        </FaPanel>
        <FaWaitLine>2 waiting for marking</FaWaitLine>
      </>,
    );
    expectSameMarkup(
      container.querySelector('.rk-panel-head')!,
      fill(head, { AS: { hasWait: true } }),
    );
    expectSameMarkup(
      container.querySelector('.fa-xwait')!,
      fill(wait, { r: { wait: '2 waiting for marking' } }),
    );
  });
});

describe('the refined table', () => {
  it('FA-06’s assessments table: caption, column classes, a linked row and labelled cells', () => {
    const drawn = excerpt('<div class="fa-tablewrap">', '</div>', at('FA-06 Assessments'));
    const units: FaUnitState[] = ['submitted', 'none'];
    const { container } = inRoot(
      <FaTable
        kind="assessments"
        caption="Assessments for the experiments you teach"
        columns={[
          { key: 'n', header: 'Assessment', width: 'name' },
          { key: 'e', header: 'Experiment' },
          { key: 'd', header: 'Deadline' },
          { key: 's', header: 'Submissions', width: 'subs' },
          { key: 'st', header: 'State' },
        ]}
        rows={[
          {
            key: 'a',
            link: true,
            cells: [
              {
                key: 'n',
                main: true,
                children: (
                  <FaRowLink
                    href="/faculty/assessments/a"
                    label="Open Heat Exchanger — post-lab, Ready"
                  >
                    Heat Exchanger — post-lab
                  </FaRowLink>
                ),
              },
              {
                key: 'e',
                wide: true,
                noLabel: true,
                label: 'Experiment',
                children: (
                  <>
                    <FaCellName>Shell-and-Tube Heat Exchanger</FaCellName>
                    <FaCellSub>ME ZG523 · Thermodynamics and Heat Transfer</FaCellSub>
                  </>
                ),
              },
              {
                key: 'd',
                nowrap: true,
                label: 'Deadline',
                children: <FaCellName numeric>14 Nov 2026, 23:59</FaCellName>,
              },
              {
                key: 's',
                label: 'Submissions',
                children: (
                  <>
                    <FaCellMeter units={units}>1 of 2</FaCellMeter>
                    <FaWaitLine>1 waiting for marking</FaWaitLine>
                  </>
                ),
              },
              {
                key: 'st',
                status: true,
                label: 'State',
                children: <StatusPill tone="ok">Ready</StatusPill>,
              },
            ],
          },
        ]}
      />,
    );
    expectSameMarkup(
      container.querySelector('.fa-tablewrap')!,
      fill(drawn, {
        AL: {
          rows: [
            {
              aria: 'Open Heat Exchanger — post-lab, Ready',
              name: 'Heat Exchanger — post-lab',
              hasSub: false,
              exp: 'Shell-and-Tube Heat Exchanger',
              code: 'ME ZG523 · Thermodynamics and Heat Transfer',
              due: '14 Nov 2026, 23:59',
              hasLeft: false,
              hasDueNote: false,
              showSubs: true,
              subsCls: 'fa-units',
              subsUnits: unitClasses(units),
              subs: '1 of 2',
              noMeter: false,
              hasWait: true,
              wait: '1 waiting for marking',
              stCls: 'xr-st xr-st--ok',
              st: 'Ready',
            },
          ],
        },
      }).replace('href="#FA-08"', 'href="/faculty/assessments/a"'),
    );
  });

  it('FA-18’s queue: static rows with explicit actions, a hidden action head (no `fa-mtable`)', () => {
    const drawn = excerpt(
      '<div class="fa-tablewrap">',
      '</table>\n        </div>',
      at('FA-18 Marking queue'),
    );
    const { container } = inRoot(
      <FaTable
        kind="queue"
        caption="Written answers, oldest first"
        columns={[
          { key: 'w', header: 'Student' },
          { key: 'a', header: 'Assessment' },
          { key: 's', header: 'Submitted (oldest first)' },
          { key: 'st', header: 'Status' },
          { key: 'x', header: 'Action', hidden: true },
        ]}
        rows={[
          {
            key: 'r',
            static: true,
            cells: [
              {
                key: 'w',
                main: true,
                children: (
                  <>
                    <FaCellLine strong>Rahul Verma</FaCellLine>
                    <FaCellSub>Attempt 1 of 2</FaCellSub>
                  </>
                ),
              },
              {
                key: 'a',
                wide: true,
                noLabel: true,
                label: 'Assessment',
                children: (
                  <>
                    <FaCellLine>Heat Exchanger — post-lab</FaCellLine>
                    <FaCellSub>Question 4</FaCellSub>
                  </>
                ),
              },
              {
                key: 's',
                nowrap: true,
                wide: true,
                inline: true,
                label: 'Submitted',
                children: '5 Nov 2026, 14:20',
              },
              {
                key: 'st',
                status: true,
                label: 'Status',
                children: <StatusPill tone="warn">Waiting for marking</StatusPill>,
              },
              {
                key: 'x',
                nowrap: true,
                wide: true,
                children: (
                  <FaCellActions>
                    <ButtonLink href="/faculty/marking/x" aria-label="Mark Rahul Verma’s answer">
                      Mark
                    </ButtonLink>
                  </FaCellActions>
                ),
              },
            ],
          },
        ]}
      />,
    );
    expectSameMarkup(
      container.querySelector('.fa-tablewrap')!,
      fill(drawn, {
        MQ: {
          rows: [
            {
              who: 'Rahul Verma',
              sub: 'Attempt 1 of 2',
              asm: 'Heat Exchanger — post-lab',
              qs: 'Question 4',
              when: '5 Nov 2026, 14:20',
              hasAgo: false,
              stCls: 'xr-st xr-st--warn',
              st: 'Waiting for marking',
              hasNote: false,
              isWait: true,
              isDone: false,
              aria: 'Mark Rahul Verma’s answer',
            },
          ],
        },
      })
        .replace(' fa-mtable', '')
        .replace('href="#FA-19"', 'href="/faculty/marking/x"'),
    );
  });

  it('a press on a linked row follows its name link; a press on a static row does nothing', () => {
    const opened = vi.fn((event: Event) => event.preventDefault());
    const { container } = inRoot(
      <FaTable
        kind="bank"
        caption="Questions in your bank"
        columns={[
          { key: 'q', header: 'Question', width: 'q' },
          { key: 'm', header: 'Marks', desktopOnly: true },
        ]}
        rows={[
          {
            key: 'l',
            link: true,
            cells: [
              { key: 'q', main: true, children: <FaRowLink href="/x">Linked</FaRowLink> },
              { key: 'm', desktopOnly: true, nowrap: true, children: '2' },
            ],
          },
          {
            key: 's',
            static: true,
            cells: [
              { key: 'q', main: true, children: 'Static' },
              { key: 'm', children: '1' },
            ],
          },
        ]}
      />,
    );
    container.querySelector('a.rk-rowlink')!.addEventListener('click', opened);
    const [linked, still] = container.querySelectorAll('tbody tr');
    fireEvent.click(linked!.querySelectorAll('td')[1]!);
    expect(opened).toHaveBeenCalledTimes(1);
    fireEvent.click(still!.querySelectorAll('td')[1]!);
    expect(opened).toHaveBeenCalledTimes(1);
    expect(still).toHaveClass('fa-static');
    expect(container.querySelector('table')!.className).toBe(
      'rk-table fa-table fa-btable fa-ptable',
    );
    expect(container.querySelector('th')!.className).toBe('fa-c-q');
    expect(container.querySelectorAll('th')[1]!.className).toBe('fa-desk');
  });

  it('FA-17’s rows that need attention sit in a boxed wrap', () => {
    const { container } = inRoot(
      <FaTable
        kind="rows"
        caption="Rows that need attention"
        columns={[{ key: 'r', header: 'Row' }]}
        rows={[]}
      />,
    );
    expect(container.querySelector('.fa-tablewrap')!.className).toBe('fa-tablewrap fa-boxtable');
    expect(container.querySelector('table')!.className).toBe('rk-table fa-table fa-ptable');
  });
});

describe('the list toolbar', () => {
  function AssessmentsToolbar({ onClear }: { readonly onClear: () => void }) {
    const [shown, setShown] = useState<readonly string[]>(['c', 's']);
    const remove = (key: string) => setShown((all) => all.filter((other) => other !== key));
    const chips: readonly FaFilterChip[] = [
      {
        key: 'c',
        label: 'Course: ME ZG523',
        onRemove: () => remove('c'),
        focusId: 'fa-al-c',
      },
      {
        key: 's',
        label: 'State: Ready',
        onRemove: () => remove('s'),
        focusId: 'fa-al-st',
      },
    ].filter((chip) => shown.includes(chip.key));
    return (
      <FaToolbar>
        <FaFilters label="Filter assessments">
          <FaSearchField
            id="fa-al-q"
            label="Search"
            placeholder="Name or experiment"
            value=""
            onChange={() => {}}
          />
          <FaSelectField
            id="fa-al-c"
            label="Course"
            value="all"
            onChange={() => {}}
            options={[
              { value: 'all', label: 'All courses' },
              { value: 'c1', label: 'ME ZG523 · Thermodynamics and Heat Transfer' },
            ]}
          />
          <FaSelectField
            id="fa-al-st"
            label="State"
            value="all"
            onChange={() => {}}
            options={[
              { value: 'all', label: 'All states' },
              { value: 'draft', label: 'Draft — not ready' },
              { value: 'ready', label: 'Ready' },
              { value: 'wait', label: 'Waiting for marking' },
            ]}
          />
        </FaFilters>
        <FaStatusLine
          count="1 of 3 assessments"
          chips={chips}
          removeLabel={(chip) => `Remove filter ${chip.label}`}
          clearLabel="Clear filters"
          onClearFilters={() => {
            onClear();
            setShown([]);
          }}
          clearFocusId="fa-al-q"
        />
      </FaToolbar>
    );
  }

  it('FA-06’s toolbar: search, two filters, the count, chips and Clear filters', () => {
    const drawn = excerpt(
      '<div class="rk-toolbar">',
      '</div>\n        </sc-if>',
      at('FA-06 Assessments'),
    );
    const { container } = inRoot(<AssessmentsToolbar onClear={() => {}} />);
    expectSameMarkup(
      container.querySelector('.rk-toolbar')!,
      fill(drawn.slice(0, drawn.lastIndexOf('\n        </sc-if>')), {
        AL: {
          q: '',
          c: 'all',
          cOpts: [{ v: 'c1', t: 'ME ZG523 · Thermodynamics and Heat Transfer' }],
          st: 'all',
          count: '1 of 3 assessments',
          chips: [
            { label: 'Course: ME ZG523', aria: 'Remove filter Course: ME ZG523' },
            { label: 'State: Ready', aria: 'Remove filter State: Ready' },
          ],
          hasChips: true,
        },
      }),
    );
  });

  it('removing a chip moves focus to the field it filtered; Clear filters to the search', () => {
    const cleared = vi.fn();
    inRoot(<AssessmentsToolbar onClear={cleared} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter State: Ready' }));
    expect(screen.queryByRole('button', { name: 'Remove filter State: Ready' })).toBeNull();
    expect(document.activeElement).toBe(screen.getByLabelText('State'));
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(cleared).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(screen.getByRole('searchbox', { name: 'Search' }));
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();
  });

  it('FA-12’s bar and segments: the heading, the count, the actions, “Waiting for marking”', () => {
    const bar = excerpt(
      '<div class="fa-tbar">',
      '</div>\n            </div>',
      at('FA-12 Submissions'),
    );
    const seg = excerpt(
      '<div class="fa-seg fa-seg--bar" role="group" aria-label="Show">',
      '</div>',
      at('FA-12 Submissions'),
    );
    const pressed = vi.fn();
    const { container } = inRoot(
      <>
        <FaTableBar
          title="Submissions"
          titleId="fa-tabh"
          focusable
          actions={
            <>
              <ButtonLink href="/faculty/marking/x" variant="primary">
                Mark next
              </ButtonLink>
              <Button icon="download" iconSize={20}>
                Export CSV
              </Button>
            </>
          }
        >
          <FaCount>2 of 5 submitted</FaCount>
        </FaTableBar>
        <FaSegmented
          label="Show"
          bar
          segments={[
            { key: 'all', label: 'All', count: 2, pressed: true, onPress: () => pressed('all') },
            {
              key: 'wait',
              label: 'Waiting',
              longLabel: ' for marking',
              count: 1,
              pressed: false,
              onPress: () => pressed('wait'),
            },
            {
              key: 'done',
              label: 'Marked',
              count: 1,
              pressed: false,
              onPress: () => pressed('done'),
            },
          ]}
        />
      </>,
    );
    expectSameMarkup(
      container.querySelector('.fa-tbar')!,
      fill(bar, { SB: { count: '2 of 5 submitted', canMarkNext: true, hasRows: true } }).replace(
        'href="#FA-19"',
        'href="/faculty/marking/x"',
      ),
    );
    expectSameMarkup(
      container.querySelector('.fa-seg')!,
      fill(seg, {
        SB: { fAll: 'true', fWait: 'false', fDone: 'false', nAll: 2, nWait: 1, nDone: 1 },
      }),
    );
    fireEvent.click(
      // The long words sit in their own span, as the export draws them (hidden on phones).
      screen.getByRole('button', { name: /^Waiting\s*for marking, 1$/ }),
    );
    expect(pressed).toHaveBeenCalledWith('wait');
    expect(screen.getByRole('button', { name: 'All, 2' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Submissions' })).toHaveAttribute('tabindex', '-1');
  });

  it('FA-11’s view switch: icons, no counts; FA-18’s filters beside it (`fa-mqtools`, `fa-mqasm`)', () => {
    const seg = excerpt('<div class="fa-seg" role="group" aria-label="Preview as">', '</div>');
    const { container } = inRoot(
      <>
        <FaSegmented
          label="Preview as"
          segments={[
            { key: 's', label: 'Student view', icon: 'eye', pressed: true, onPress: () => {} },
            { key: 'k', label: 'Answer key', icon: 'key', pressed: false, onPress: () => {} },
          ]}
        />
        <FaFilters label="Filter written answers" variant="queue">
          <FaSelectField
            id="fa-mq-asm"
            label="Assessment"
            wide
            value="all"
            onChange={() => {}}
            options={[{ value: 'all', label: 'All assessments' }]}
          />
        </FaFilters>
      </>,
    );
    expectSameMarkup(
      container.querySelector('.fa-seg')!,
      fill(seg, { PV: { pStu: 'true', pKey: 'false' } }),
    );
    const tools = excerpt('<div class="rk-tools fa-mqtools"', '</div>\n            </div>');
    expectSameMarkup(
      container.querySelector('.fa-mqtools')!,
      fill(tools, { MQ: { asm: 'all', asmOpts: [] } }) + '</div>',
    );
  });
});

describe('the record tabs and the export band', () => {
  it('FA-08 … FA-12’s tabs: links with counts, the current one `aria-current=page`, the content inside', () => {
    const drawn = excerpt('<nav class="rk-tabs fa-tabs" aria-label="{{ AR.tabsAria }}">', '</nav>');
    const tabs = [
      { key: 'sum', href: '/a', label: 'Summary', current: true },
      { key: 'qs', href: '/a/questions', label: 'Questions', count: 4 },
      { key: 'set', href: '/a/settings', label: 'Settings' },
      { key: 'pv', href: '/a/preview', label: 'Preview' },
      { key: 'sub', href: '/a/submissions', label: 'Submissions', count: 2 },
    ];
    const { container } = inRoot(
      <FaRecordTabs label="Heat Exchanger — post-lab" tabs={tabs}>
        <p>Summary content</p>
      </FaRecordTabs>,
    );
    expect(container.querySelector('.fa-recordtabs > nav + p')).not.toBeNull();
    expectSameMarkup(
      container.querySelector('nav')!,
      fill(drawn, {
        AR: {
          tabsAria: 'Heat Exchanger — post-lab',
          tc: { sum: 'page' },
          nQ: 4,
          hasSubN: true,
          nSub: 2,
        },
      })
        .replace('href="#FA-08"', 'href="/a"')
        .replace('href="#FA-09"', 'href="/a/questions"')
        .replace('href="#FA-10"', 'href="/a/settings"')
        .replace('href="#FA-11"', 'href="/a/preview"')
        .replace('href="#FA-12"', 'href="/a/submissions"'),
    );
    expect(screen.getByRole('link', { name: 'Questions, 4' })).toHaveAttribute(
      'href',
      '/a/questions',
    );
    expect(() =>
      render(
        <FaRecordTabs label="x" tabs={[{ ...tabs[0]! }, { ...tabs[1]!, current: true }]}>
          {null}
        </FaRecordTabs>,
      ),
    ).toThrow(/at most one tab is current/);
  });

  it('FA-12’s export band: the ok notice that takes focus and the scrolling preview of the file', () => {
    const drawn = excerpt(
      '<div class="fa-export">',
      '</table>\n            </div>\n          </div>',
      at('FA-12 Submissions'),
    );
    const description =
      'It contains this list only, as it was when you exported it. Columns: student, student ID, submitted, status, score, result released to student.';
    const columns = [
      'student',
      'student ID',
      'submitted',
      'status',
      'score',
      'result released to student',
    ];
    const { container } = inRoot(
      <FaExportBand
        noticeId="fa-exp"
        title="Exported submissions-heat-exchanger-post-lab.csv · 1 row"
        description={description}
        rowsLabel="Rows in the exported file"
        columns={columns}
        rows={[
          ['Rahul Verma', 'GIT-2026-0418', '5 Nov 2026, 14:20', 'Waiting for marking', '', 'No'],
        ]}
      />,
    );
    expectSameMarkup(
      container.querySelector('.fa-export')!,
      fill(drawn, {
        SB: {
          expT: 'Exported submissions-heat-exchanger-post-lab.csv · 1 row',
          expRows: [
            {
              n: 'Rahul Verma',
              id: 'GIT-2026-0418',
              when: '5 Nov 2026, 14:20',
              st: 'Waiting for marking',
              score: '',
              rel: 'No',
            },
          ],
        },
      }),
    );
    expect(screen.getByRole('region', { name: 'Rows in the exported file' })).toHaveAttribute(
      'tabindex',
      '0',
    );
  });
});

describe('the message card and the in-role inline message (P8)', () => {
  it('FA-01’s no-courses card: the icon box, the H2, the line and Help & support', () => {
    const drawn = excerpt(
      '<section class="rk-surface fa-msgcard" aria-labelledby="fa-ov-none">',
      '</section>',
    );
    const { container } = inRoot(
      <FaMessageCard
        icon="book"
        title="Your Institute Admin hasn’t assigned you courses yet"
        titleId="fa-ov-none"
        actions={<TextLink href="/faculty/help">Help &amp; support</TextLink>}
      >
        When they assign you a course in Faculty courses, its experiments, assessments and students
        appear here.
      </FaMessageCard>,
    );
    expectSameMarkup(
      container.querySelector('section')!,
      fill(drawn, {}).replace('href="#XS-07"', 'href="/faculty/help"'),
    );
    expect(
      screen.getByRole('region', { name: 'Your Institute Admin hasn’t assigned you courses yet' }),
    ).toBe(container.querySelector('section'));
  });

  it('FA-12’s co-teacher refusal: the lock, a focusable heading, two ways on', () => {
    const drawn = excerpt(
      '<div class="fa-inlinemsg">',
      '</div>\n          </div>',
      at('FA-12 Submissions'),
    );
    const { container } = inRoot(
      <FaInlineMessage
        icon="lock"
        lock
        title="Submissions aren’t available to you yet"
        titleId="fa-tabh"
        focusable
        actions={
          <>
            <ButtonLink href="/a">Back to Summary</ButtonLink>
            <TextLink href="/faculty/help">Help</TextLink>
          </>
        }
      >
        Dr Anita Desai created this assessment.
      </FaInlineMessage>,
    );
    expectSameMarkup(
      container.querySelector('.fa-inlinemsg')!,
      fill(drawn, { AR: { coRefuse: 'Dr Anita Desai created this assessment.' } })
        .replace('href="#FA-08"', 'href="/a"')
        .replace('href="#XS-07"', 'href="/faculty/help"'),
    );
  });
});

describe('the stepper, the authoring layout and the form sections (P6)', () => {
  const STEP_WORDS = { done: ', done', current: ', current step', todo: ', not done yet' } as const;

  it('FA-07’s four steps: ticks for done steps, the current one, the state in words', () => {
    const drawn = excerpt(
      '<ol class="fa-steps fa-steps--fit" aria-label="Steps to create an assessment">',
      '</ol>',
    );
    const { container } = inRoot(
      <FaSteps
        label="Steps to create an assessment"
        stateWords={STEP_WORDS}
        steps={[
          { key: '1', label: 'Experiment', state: 'done' },
          { key: '2', label: 'Rules', state: 'current' },
          { key: '3', label: 'Questions', state: 'todo' },
          { key: '4', label: 'Preview', state: 'todo' },
        ]}
      />,
    );
    const steps = ['Experiment', 'Rules', 'Questions', 'Preview'].map((label, index) => {
      const i = index + 1;
      return {
        n: String(i),
        label,
        cls: 'fa-step' + (2 > i ? ' is-done' : 2 === i ? ' is-current' : ''),
        cur: 2 === i ? 'step' : undefined,
        done: 2 > i,
        todo: 2 <= i,
        sr: 2 > i ? ', done' : 2 === i ? ', current step' : ', not done yet',
      };
    });
    expectSameMarkup(container.querySelector('ol')!, fill(drawn, { CW: { steps } }));
    expect(within(container.querySelector('ol')!).getAllByRole('listitem')[1]).toHaveAttribute(
      'aria-current',
      'step',
    );
  });

  it('FA-10’s form: a named group, the radio cards in three columns, the warn section and the foot', () => {
    const group = excerpt(
      '<div class="fa-fsec" role="group" aria-labelledby="fa-st-g1">',
      '</div>\n          </div>',
      at('FA-10 Settings'),
    );
    const choices = excerpt('<fieldset class="{{ ST.relFs }}">', '</fieldset>');
    const foot = excerpt(
      '<div class="fa-formfoot">',
      '</div>\n          </div>',
      at('FA-10 Settings'),
    );
    const rels = [
      { id: 'fa-t-rel-now', t: 'Immediately after marking', d: 'Choice answers at once.' },
      { id: 'fa-t-rel-after', t: 'After the deadline', d: 'Everyone at once.' },
      { id: 'fa-t-rel-date', t: 'On a date', d: 'You choose the day.' },
    ];
    const { container } = inRoot(
      <FaAuthor>
        <FaFormColumn labelledBy="fa-tabh">
          <FaFormSection group title="Name and introduction" titleId="fa-st-g1" headingLevel={3}>
            <Field label="Assessment name" id="fa-st-name">
              <TextInput autoComplete="off" value="Heat Exchanger — post-lab" onChange={() => {}} />
            </Field>
            <Field
              label="Introduction (optional)"
              id="fa-st-intro"
              hint="What students read before they start."
            >
              <Textarea value="" onChange={() => {}} />
            </Field>
          </FaFormSection>
          <FaChoiceGroup
            legend="When students see their result and answers"
            legendHint="Nothing is chosen for you. Written answers are always marked first."
            id="fa-t-rel"
            name="fa-st-rel"
            value="after"
            onChange={() => {}}
            options={[
              { value: 'now', title: rels[0]!.t, description: rels[0]!.d },
              { value: 'after', title: rels[1]!.t, description: rels[1]!.d },
              { value: 'date', title: rels[2]!.t, description: rels[2]!.d },
            ]}
          />
          <FaFormSection tone="warn">
            <p>Warning</p>
          </FaFormSection>
          <FaFormFoot
            start={<Button>Cancel changes</Button>}
            end={
              <Button variant="primary" size="lg">
                Save settings
              </Button>
            }
          />
        </FaFormColumn>
      </FaAuthor>,
    );
    expectSameMarkup(
      container.querySelector('.fa-fsec[role="group"]')!,
      fill(group, {
        ST: { name: 'Heat Exchanger — post-lab', i: {}, d: {}, he: {}, intro: '' },
      }).replace(' value=""></textarea>', '></textarea>'),
    );
    const filledChoices = fill(choices, {
      ST: {
        relFs: 'rk-fieldset',
        rels: rels.map((rel) => ({ ...rel, checked: rel.id === 'fa-t-rel-after' })),
        he: {},
      },
    });
    // The fieldset's id is the error summary's target (as the kit's `ChoiceGroup`); the export's has none.
    expect(container.querySelector('fieldset')!.id).toBe('fa-t-rel');
    expect(
      comparable(container.querySelector('fieldset')!.outerHTML.replace(' id="fa-t-rel"', '')),
    ).toBe(comparable(filledChoices));
    expect(container.querySelector('.fa-fsec.fa-fsec--warn')).not.toBeNull();
    expectSameMarkup(
      container.querySelector('.fa-formfoot')!,
      fill(foot, { ST: { notBusy: true } }),
    );
    expect(screen.getByRole('radio', { name: 'After the deadline' })).toBeChecked();
    expect(screen.getByRole('group', { name: 'Name and introduction' })).toBeInTheDocument();
  });

  it('the side panel, the form messages and the finished step (FA-07 created)', () => {
    const done = excerpt(
      '<div class="fa-fsec rk-done fa-result" id="fa-cw-done" tabindex="-1">',
      '</div>\n          </sc-if>',
    );
    const { container } = inRoot(
      <FaAuthor single>
        <FaFormColumn labelledBy="fa-h1">
          <FaFormMessages stack>
            <p>Note</p>
          </FaFormMessages>
          <FaResult
            id="fa-cw-done"
            actions={
              <>
                <ButtonLink href="/a" variant="primary" size="lg">
                  Open assessment
                </ButtonLink>
                <ButtonLink href="/faculty/assessments" size="lg">
                  Back to Assessments
                </ButtonLink>
              </>
            }
          >
            <p className="fa-row">
              <StatusPill tone="ok">Ready</StatusPill>
            </p>
            <FaResultText>Heat Exchanger — post-lab is ready for students.</FaResultText>
            <FaChecklist
              flush
              label="Ready checklist"
              items={[
                { key: 'n', text: 'Name and introduction', done: true },
                { key: 'q', text: 'At least one question — none yet', done: false },
              ]}
            />
          </FaResult>
        </FaFormColumn>
        <FaSide labelledBy="fa-side-h">
          <FaSideSection>
            <h2 className="rb-h2" id="fa-side-h">
              This question
            </h2>
          </FaSideSection>
        </FaSide>
      </FaAuthor>,
    );
    expect(
      container.querySelector(
        '.fa-author.fa-author--one > section.rk-surface.fa-formcol > .fa-fmsg.fa-fmsg--stack',
      ),
    ).not.toBeNull();
    expect(container.querySelector('aside.fa-side > .rk-surface > .fa-side-sec')).not.toBeNull();
    expectSameMarkup(
      container.querySelector('.fa-result')!,
      fill(done.slice(0, done.lastIndexOf('\n          </sc-if>')), {
        CW: {
          doneCls: 'xr-st xr-st--ok',
          doneLabel: 'Ready',
          doneText: 'Heat Exchanger — post-lab is ready for students.',
          checklist: [
            { cls: 'is-ok', ok: true, no: false, t: 'Name and introduction' },
            { cls: 'is-no', ok: false, no: true, t: 'At least one question — none yet' },
          ],
        },
      })
        .replace('href="#FA-08"', 'href="/a"')
        .replace('href="#FA-06"', 'href="/faculty/assessments"'),
    );
    expect(screen.getByRole('complementary', { name: 'This question' })).toBeInTheDocument();
  });

  it('a bare form column (FA-16) and a tinted section with a label (FA-07 “Other ways”)', () => {
    const { container } = inRoot(
      <FaFormColumn bare>
        <FaFormSection tone="tint">
          <FaKey>Other ways to add questions</FaKey>
          <FaActions>
            <Button>New question</Button>
          </FaActions>
        </FaFormSection>
      </FaFormColumn>,
    );
    expect(
      container.querySelector('div.fa-formcol > .fa-fsec.fa-fsec--tint > p.fa-k + .fa-actions'),
    ).not.toBeNull();
  });
});

describe('questions, results, guidance, checklists and resources', () => {
  it('FA-07’s question head with the picked count; FA-07’s preview meta; FA-14’s cell text and meta', () => {
    const head = excerpt(
      '<div class="fa-qhead">',
      '</div>\n            <sc-if',
      at('FA-07 Create assessment'),
    );
    const meta = excerpt('<p class="fa-qmeta"><span class="{{ p.typeCls }}">', '</p>');
    const { container } = inRoot(
      <>
        <FaQuestionHead
          title="From your question bank"
          aside={<FaPickCount>4 questions · 16 marks</FaPickCount>}
        >
          <p className="rk-hint">Shell-and-Tube Heat Exchanger · ME ZG523</p>
        </FaQuestionHead>
        <FaQuestionMeta type="Written answer" written>
          <FaQuestionMarks>10 marks</FaQuestionMarks>
        </FaQuestionMeta>
        <FaQuestionText inCell>
          Which arrangement can bring the cold outlet above the hot outlet?
        </FaQuestionText>
        <FaQuestionMeta type="Multiple choice" inCell>
          <FaId>Version 2</FaId>
          <FaQuestionMarks phoneOnly>2 marks</FaQuestionMarks>
        </FaQuestionMeta>
        <FaTag checked>From a draft you reviewed</FaTag>
      </>,
    );
    expectSameMarkup(
      container.querySelector('.fa-qhead')!,
      fill(head.slice(0, head.lastIndexOf('\n            <sc-if')), {
        CW: {
          expT: 'Shell-and-Tube Heat Exchanger · ME ZG523',
          totalText: '4 questions · 16 marks',
        },
      }),
    );
    expectSameMarkup(
      container.querySelector('p.fa-qmeta')!,
      fill(meta, {
        p: { typeCls: 'fa-qtype fa-qtype--w', type: 'Written answer', marks: '10 marks' },
      }),
    );
    expect(container.querySelector('span.fa-qt.fa-cellline')).not.toBeNull();
    expect(
      container.querySelector('span.fa-qmeta > .fa-qtype + .fa-id + .fa-mob.fa-qmeta-m'),
    ).not.toBeNull();
    const tag = excerpt('<span class="fa-tag"><svg', '</span>');
    expectSameMarkup(container.querySelector('.fa-tag')!, fill(tag, {}));
  });

  it('FA-12’s release marks and FA-19’s automatic marks (`fa-res`)', () => {
    const released = excerpt(
      '<span class="fa-res fa-res--ok"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#fai-check"></use></svg>{{ r.relHead }}',
      '</span>',
    );
    const notYet = excerpt(
      '<span class="fa-res fa-res--no"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#fai-clock"></use></svg>',
      '</span>',
    );
    const wrong = excerpt(
      '<span class="fa-res fa-res--no"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#fai-x"></use></svg>',
      '</span>',
    );
    const { container } = inRoot(
      <>
        <FaResultMark outcome="ok">Released 14 Nov 2026</FaResultMark>
        <FaResultMark outcome="no">Not yet</FaResultMark>
        <FaResultMark outcome="no" icon="close">
          0 of 2
        </FaResultMark>
      </>,
    );
    const [ok, no, x] = container.querySelectorAll('.fa-res');
    expectSameMarkup(ok!, fill(released, { r: { relHead: 'Released 14 Nov 2026' } }));
    expectSameMarkup(no!, fill(notYet, { r: { relHead: 'Not yet' } }));
    expectSameMarkup(x!, fill(wrong, { a: { m: '0 of 2' } }));
  });

  it('the marking guidance (FA-11, FA-19) and the sheet question head as a line and as a heading', () => {
    const guide = excerpt(
      '<div class="fa-guide"><p class="fa-guide-k">',
      '</div>',
      at('FA-19 Mark a submission'),
    );
    const line = excerpt('<p class="fa-sheetq-h">', '</p>');
    const heading = excerpt('<div class="fa-sheetq-h">', '</div>');
    const { container } = inRoot(
      <>
        <FaGuide label="Marking guidance · only you see this">Mentions fouling.</FaGuide>
        <FaSheetQuestionHead head="Question 1" marks="2 marks" />
        <FaSheetQuestionHead
          head="Question 4 · written answer"
          marks="10 marks"
          headingId="fa-mk-q4"
        />
      </>,
    );
    expectSameMarkup(
      container.querySelector('.fa-guide')!,
      fill(guide, { w: { guide: 'Mentions fouling.' } }),
    );
    expectSameMarkup(
      container.querySelector('p.fa-sheetq-h')!,
      fill(line, { q: { head: 'Question 1', marks: '2 marks' } }),
    );
    expectSameMarkup(
      container.querySelector('div.fa-sheetq-h')!,
      fill(heading, {
        w: { hid: 'fa-mk-q4', head: 'Question 4 · written answer', marks: '10 marks' },
      }),
    );
  });

  it('FA-08’s checklist, FA-07’s side checklist, FA-05’s and FA-21’s resources', () => {
    const check = excerpt('<ul class="fa-check" aria-label="Ready checklist">', '</ul>');
    const side = excerpt(
      '<ul class="fa-check fa-sidecheck" aria-label="What creating does">',
      '</ul>',
    );
    const res = excerpt('<ul class="fa-reslist" aria-label="Resources students see">', '</ul>');
    const status = excerpt('<ul class="fa-reslist fa-reslist--status">', '</ul>');
    const { container } = inRoot(
      <>
        <FaChecklist
          label="Ready checklist"
          items={[
            { key: 'a', text: 'Name and introduction', done: true },
            { key: 'b', text: 'Rules — not finished', done: false },
          ]}
        />
        <FaChecklist
          side
          label="What creating does"
          items={[{ key: 'a', text: 'Students can see it', done: true }]}
        />
        <FaResourceList
          label="Resources students see"
          resources={[{ key: 'a', title: 'Lab brief' }]}
        />
        <FaResourceList
          resources={[
            { key: 'a', title: 'Lab brief', status: { words: 'Opened 3 Nov 2026', opened: true } },
            { key: 'b', title: 'Safety sheet', status: { words: 'Not opened yet', opened: false } },
          ]}
        />
      </>,
    );
    const [ready, creating] = container.querySelectorAll('.fa-check');
    const [plain, withStatus] = container.querySelectorAll('.fa-reslist');
    expectSameMarkup(
      ready!,
      fill(check, {
        AS: {
          checklist: [
            { cls: 'is-ok', ok: true, no: false, t: 'Name and introduction' },
            { cls: 'is-no', ok: false, no: true, t: 'Rules — not finished' },
          ],
        },
      }),
    );
    expectSameMarkup(creating!, fill(side, { CW: { createList: ['Students can see it'] } }));
    expectSameMarkup(plain!, fill(res, { E1: { res: ['Lab brief'] } }));
    expectSameMarkup(
      withStatus!,
      fill(status, {
        SD: {
          res: [
            { t: 'Lab brief', cls: 'rk-next', st: 'Opened 3 Nov 2026' },
            { t: 'Safety sheet', cls: 'fa-quiet', st: 'Not opened yet' },
          ],
        },
      }).replace(/<span class="fa-res-t">/g, '<span>'),
    );
  });

  it('the small helpers: quiet words, a key label as a heading', () => {
    const { container } = inRoot(
      <>
        <FaQuiet>No students yet.</FaQuiet>
        <FaQuiet inline>No students have it yet</FaQuiet>
        <FaKey as="h3" id="fa-qb-delh">
          Deleted
        </FaKey>
        <FaCellSub first>None yet</FaCellSub>
        <FaCellSub foot>5 students</FaCellSub>
      </>,
    );
    expect(container.querySelector('p.fa-quiet')).not.toBeNull();
    expect(container.querySelector('span.fa-quiet')).not.toBeNull();
    expect(container.querySelector('h3.fa-k#fa-qb-delh')).not.toBeNull();
    expect(container.querySelector('.fa-cellsub.fa-cellsub0')).not.toBeNull();
    expect(container.querySelector('.fa-cellsub.fa-cellfoot')).not.toBeNull();
  });
});

describe('the class contract, internal references and accessibility', () => {
  it('a page composed of the shared pieces emits only V3 classes, names nothing by its id and passes axe', async () => {
    const units: FaUnitState[] = ['done', 'progress', 'none'];
    const { container } = inRoot(
      <main>
        <FaIdentityBand
          code="ME ZG523"
          kicker="Shell-and-Tube Heat Exchanger"
          title="Heat Exchanger — post-lab"
          titleId="fa-h1"
          meta={[
            <StatusPill key="s" tone="ok">
              Ready
            </StatusPill>,
            <FaRecordWaitLink key="w" href="/faculty/marking">
              1 waiting for marking
            </FaRecordWaitLink>,
          ]}
          figures={
            <FaFigures>
              <FaFigure term="Deadline" value="Not set yet" tone="quiet" />
              <FaFigure term="Students submitted" value="1 of 3" tone="plain" units={units} />
            </FaFigures>
          }
        />
        <FaRecordTabs
          label="Heat Exchanger — post-lab"
          tabs={[
            { key: 's', href: '/a', label: 'Summary', current: true },
            { key: 'q', href: '/a/q', label: 'Questions', count: 4 },
          ]}
        >
          <FaDetail asideFirst>
            <FaMainSheet labelledBy="fa-tabh">
              <h2 id="fa-tabh">Ready for students</h2>
              <FaProgress
                label="Student activity by format"
                words={WORDS}
                rows={[{ format: 'WEB', completed: 1, inProgress: 1, notStarted: 1, units }]}
              />
              <FaChecklist
                label="Ready checklist"
                items={[{ key: 'a', text: 'Name', done: true }]}
              />
              <FaResourceList
                label="Resources students see"
                resources={[{ key: 'a', title: 'Lab brief' }]}
              />
              <FaGuide label="Marking guidance · only you see this">Fouling.</FaGuide>
            </FaMainSheet>
            <FaAside labelledBy="fa-aside-h">
              <FaPanel title="Assessment" titleId="fa-aside-h" note="Oldest first" assessment>
                <FaAssessmentId>
                  <StatusPill tone="ok">Ready</StatusPill>
                  <FaAssessmentName href="/a">Heat Exchanger — post-lab</FaAssessmentName>
                  <FaAssessmentDue left="7 days left">Due 14 Nov 2026, 23:59</FaAssessmentDue>
                </FaAssessmentId>
                <FaAssessmentSubmissions units={units}>1 of 3 submitted</FaAssessmentSubmissions>
                <FaAssessmentWait>1 written answer waiting for marking</FaAssessmentWait>
              </FaPanel>
            </FaAside>
          </FaDetail>
        </FaRecordTabs>
        <section className="rk-surface" aria-labelledby="fa-list-h">
          <FaToolbar>
            <FaTableBar
              title="Submissions"
              titleId="fa-list-h"
              actions={<Button>Export CSV</Button>}
            >
              <FaCount>1 of 3</FaCount>
            </FaTableBar>
            <FaSegmented
              label="Show"
              bar
              segments={[
                { key: 'a', label: 'All', count: 1, pressed: true, onPress: () => {} },
                {
                  key: 'w',
                  label: 'Waiting',
                  longLabel: ' for marking',
                  count: 1,
                  pressed: false,
                  onPress: () => {},
                },
              ]}
            />
            <FaFilters label="Filter submissions">
              <FaSearchField id="s" label="Search" value="" onChange={() => {}} />
              <FaSelectField
                id="f"
                label="Format"
                value="all"
                onChange={() => {}}
                options={[{ value: 'all', label: 'All formats' }]}
              />
            </FaFilters>
            <FaStatusLine
              count="1 of 3"
              chips={[{ key: 'f', label: 'Format: VR', onRemove: () => {} }]}
              removeLabel={(chip) => `Remove filter ${chip.label}`}
              clearLabel="Clear filters"
              onClearFilters={() => {}}
            />
          </FaToolbar>
          <FaExportBand
            noticeId="fa-exp"
            title="Exported students-venturi-meter.csv · 1 row"
            description="It contains the filtered list only."
            rowsLabel="Rows in the exported file"
            columns={['student', 'student ID']}
            rows={[['Rahul Verma', 'GIT-2026-0418']]}
          />
          <FaTable
            kind="submissions"
            caption="Submissions for Heat Exchanger — post-lab"
            columns={[
              { key: 's', header: 'Student' },
              { key: 'r', header: 'Result released to student' },
            ]}
            rows={[
              {
                key: 'r',
                link: true,
                cells: [
                  {
                    key: 's',
                    main: true,
                    children: (
                      <>
                        <FaRowLink href="/m" label="Mark Rahul Verma">
                          Rahul Verma
                        </FaRowLink>
                        <FaCellSub>Attempt 1 of 2</FaCellSub>
                      </>
                    ),
                  },
                  {
                    key: 'r',
                    label: 'Result released to student',
                    children: <FaResultMark outcome="no">Not yet</FaResultMark>,
                  },
                ],
              },
            ]}
          />
        </section>
        <FaSteps
          label="Steps to import questions"
          stateWords={{ done: ', done', current: ', current step', todo: ', not done yet' }}
          steps={[
            { key: '1', label: 'Choose a file', state: 'done' },
            { key: '2', label: 'Check rows', state: 'current' },
          ]}
        />
        <FaAuthor>
          <FaFormColumn labelledBy="fa-form-h">
            <h2 id="fa-form-h">Add a question</h2>
            <FaFormSection group title="Question and answer" titleId="fa-fs">
              <FaQuestionHead title="Questions" aside={<FaPickCount>2 questions</FaPickCount>} />
              <FaQuestionMeta type="Written answer" written>
                <FaQuestionMarks>10 marks</FaQuestionMarks>
              </FaQuestionMeta>
            </FaFormSection>
            <FaChoiceGroup
              legend="Question type"
              id="fa-type"
              name="fa-type"
              value={null}
              onChange={() => {}}
              error="Choose the question type"
              options={[
                { value: 'mc', title: 'Multiple choice', description: 'One correct answer.' },
                { value: 'tf', title: 'True or false' },
              ]}
            />
            <FaFormFoot
              start={<Button>Cancel</Button>}
              end={<Button variant="primary">Save question</Button>}
            />
          </FaFormColumn>
          <FaSide labelledBy="fa-side">
            <FaSideSection>
              <h2 id="fa-side">This question</h2>
            </FaSideSection>
          </FaSide>
        </FaAuthor>
        <FaMessageCard icon="pen" title="Nothing to mark yet" titleId="fa-none">
          Written answers appear here once you teach a course with an assessment.
        </FaMessageCard>
        <FaInlineMessage
          icon="lock"
          lock
          title="This preview isn’t available to you yet"
          titleId="fa-ref"
        >
          Dr Anita Desai created this assessment.
        </FaInlineMessage>
        <FaWaitLine>2 waiting for marking</FaWaitLine>
        <FaFormatBadges formats={['WEB']} label="Formats your institution has: WEB" />
        <FaSheetQuestionHead head="Question 4" marks="10 marks" headingId="fa-q4" />
        <FaTag>Drafted with assistance</FaTag>
        <FaId>Version 2</FaId>
        <FaQuiet>Nothing else is waiting for marking.</FaQuiet>
      </main>,
    );
    expectV3ClassesOnly(container);
    expectNoInternalReferences(container);
    expect(container.textContent).not.toMatch(/\b(?:ASMT|ATT|Q|D)-\d+/);
    await assertNoAxeViolations(container);
  });
});

// ---- V3P-17: the patch's classes, each where the export writes the inline style -------------------

describe('V3P-17 — the Faculty export’s inline styles as the patch’s product classes', () => {
  it('each option emits its class; without it the piece is unchanged (other roles’ defaults)', () => {
    const { container } = inRoot(
      <>
        <FaChecklist flush label="Ready checklist" items={[{ key: 'a', text: 'A', done: true }]} />
        <FaChecklist label="Plain" items={[{ key: 'b', text: 'B', done: true }]} />
        <FaActions apart>
          <Button>Add questions</Button>
        </FaActions>
        <FaActions>
          <Button>Plain</Button>
        </FaActions>
        <FaCellLine apart>From a draft you reviewed</FaCellLine>
        <FaCellLine>Plain</FaCellLine>
        <Hint under="box">Created by you</Hint>
        <Hint under="line">Reach follows Student access</Hint>
        <Hint>Plain hint</Hint>
        <PendingHint space="below">Waiting</PendingHint>
        <PendingHint>Plain pending</PendingHint>
        <Notice tone="ok" title="Added" space="below" />
        <Notice tone="ok" title="Removed" space="above" />
        <Notice
          tone="ok"
          title="Saved to your question bank"
          wrapActions
          actions={<Button>Add this question to the assessment</Button>}
        />
        <Notice tone="info" title="Plain notice" />
        <Field id="marks" label="Marks">
          <TextInput short defaultValue="2" />
        </Field>
        <Field id="plain" label="Plain">
          <TextInput defaultValue="" />
        </Field>
      </>,
    );
    const lists = container.querySelectorAll('ul.fa-check');
    expect(lists[0]!.className).toBe('fa-check rk-x-check-flush');
    expect(lists[1]!.className).toBe('fa-check');
    const actions = container.querySelectorAll('div.fa-actions');
    expect(actions[0]!.className).toBe('fa-actions rk-x-actions-above');
    expect(actions[1]!.className).toBe('fa-actions');
    const lines = container.querySelectorAll('span.fa-cellline');
    expect(lines[0]!.className).toBe('fa-cellline rk-x-cellline-tight');
    expect(lines[1]!.className).toBe('fa-cellline');
    expect([...container.querySelectorAll('p.rk-hint')].map((hint) => hint.className)).toEqual([
      'rk-hint rk-x-hint-box',
      'rk-hint rk-x-hint-line',
      'rk-hint',
    ]);
    expect([...container.querySelectorAll('p.rk-pending')].map((line) => line.className)).toEqual([
      'rk-pending rk-x-pending-below',
      'rk-pending',
    ]);
    expect(
      [...container.querySelectorAll('div.rk-notice')].map((notice) => notice.className),
    ).toEqual([
      'rk-notice rk-notice--ok rk-x-notice-below',
      'rk-notice rk-notice--ok rk-x-notice-above',
      'rk-notice rk-notice--ok rk-x-notice-wrap',
      'rk-notice rk-notice--info',
    ]);
    expect(screen.getByRole('textbox', { name: 'Marks' }).className).toBe(
      'rk-input rk-x-input-short',
    );
    expect(screen.getByRole('textbox', { name: 'Plain' }).className).toBe('rk-input');
    expectV3ClassesOnly(container);
  });

  it('the panel heads carry the quiet-focus marker; the export band is wide on FA-20 only', () => {
    const { container } = inRoot(
      <>
        <FaPanel title="Assessment" titleId="p1">
          <p>Body</p>
        </FaPanel>
        <FaExportBand
          noticeId="e1"
          title="Exported"
          description="Columns"
          rowsLabel="Rows in the exported file"
          columns={['a']}
          rows={[['1']]}
          wide
        />
        <FaExportBand
          noticeId="e2"
          title="Exported"
          description="Columns"
          rowsLabel="Rows in the exported file"
          columns={['a']}
          rows={[['1']]}
        />
      </>,
    );
    expect(container.querySelector('.rk-panel-head')!.className).toBe(
      'rk-panel-head rk-x-panel-head-quiet',
    );
    expect(container.querySelector('#p1')!.hasAttribute('tabindex')).toBe(false);
    expect([...container.querySelectorAll('table')].map((table) => table.className)).toEqual([
      'rk-table rk-x-table-wide',
      'rk-table',
    ]);
    expectV3ClassesOnly(container);
  });

  it('the list state’s opt-ins: a live no-match (FA-06, FA-12), a focusable failed title (FA-11)', () => {
    const { container } = inRoot(
      <>
        <ListState kind="nomatch" live title="No assessments match" />
        <ListState kind="nomatch" title="Plain no match" />
        <ListState
          kind="failed"
          titleAs="h2"
          titleId="fa-tabh"
          titleFocusable
          title="We couldn’t load the preview"
        />
        <ListState kind="failed" title="Plain failed" />
      </>,
    );
    const states = container.querySelectorAll('div.rk-state');
    expect([...states].map((state) => state.getAttribute('role'))).toEqual([
      'status',
      null,
      'alert',
      'alert',
    ]);
    expect(screen.getByRole('heading', { name: 'We couldn’t load the preview' })).toHaveAttribute(
      'tabindex',
      '-1',
    );
    expect(screen.getByText('Plain failed')).not.toHaveAttribute('tabindex');
    expectV3ClassesOnly(container);
  });

  it('the error summary’s spaced opt-in (the Faculty forms); off by default', () => {
    const items = [
      { fieldId: 'a', summaryText: 'Choose the material to draft from' },
      { fieldId: 'b', summaryText: 'Choose at least one question type' },
    ];
    const { container } = inRoot(
      <>
        <ErrorSummary id="s1" title="Check these choices" items={items} spaced autoFocus={false} />
        <ErrorSummary id="s2" title="Plain" items={items} autoFocus={false} />
      </>,
    );
    expect(container.querySelector('#s1')!.className).toBe('rk-errsum rk-x-errsum-spaced');
    expect(container.querySelector('#s2')!.className).toBe('rk-errsum');
    expectV3ClassesOnly(container);
  });
});
