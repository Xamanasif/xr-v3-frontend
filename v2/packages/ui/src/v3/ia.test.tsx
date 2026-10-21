/**
 * What more than one Institute Admin screen group draws (owner-approved export
 * design/v3-refined-b/roles/IA-v1, `project/Main.dc.html`, `project/ia-role.css`;
 * COMPONENT-EXTENSIONS "Role patterns"): the format badges, the list table and its cell parts, the
 * grouped grants table, the surface sections, the record grid, the management surface, the step
 * indicator, the form column and the helpers. Each is rendered with sample values and compared with
 * the export's template filled the way its script fills it (`sc-for`, `sc-if`, `{{ … }}`, the
 * sprite inlined from its own symbols); then the class contract and the accessibility checks.
 *
 * Normalised on both sides, each for a recorded reason: the explicit table roles the kit adds to
 * tables that reflow on phones (ADR-0010, as `RecordTable`); the space the kit puts before a
 * segment's count so its name reads "Current 12" (as `CategorySwitch`); a select's `value` and its
 * option's `selected`, which are the same state written two ways; the export's inline sizes,
 * written as the central patch's classes the kit emits in their place (V3P-16, `iaPatchedMarkup`);
 * and the order of class tokens (the export writes a cell's place and its column class in either order).
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectV3ClassesOnly,
  iaExportText,
  iaPatchedMarkup,
  v3Canonical,
} from '../testing/index.js';
import { Button, ButtonLink, TextLink } from './actions.js';
import { CourseCode } from './codes.js';
import { Select, TextInput } from './fields.js';
import {
  IaActions,
  IaBlock,
  IaBusyButton,
  IaCellLine,
  IaCellText,
  IaEmptyTitle,
  IaField,
  IaFieldGrid,
  type IaFilterChip,
  IaFormatBadges,
  IaFormatList,
  IaFormSurface,
  IaGrantHow,
  IaGroupedTable,
  IaLines,
  IaListTable,
  IaLiveLine,
  IaManageCount,
  IaManageFilters,
  IaManageFoot,
  IaManageSearch,
  IaManageSelect,
  IaManageStatus,
  IaManageSurface,
  IaManageTools,
  IaMessageCard,
  IaNoWrap,
  IaRecordGrid,
  IaRow,
  IaRowLink,
  IaSectionBody,
  IaSectionCount,
  IaSectionFoot,
  IaSectionHead,
  IaSegments,
  IaStack,
  IaStatusNotes,
  IaSteps,
  IaSummary,
  IaWrapLink,
} from './ia.js';
import { StatusPill } from './status.js';

const MAIN = iaExportText('Main.dc.html');
const TEMPLATE = MAIN.slice(0, MAIN.indexOf('<script type="text/x-dc"'));

/** The export's sprite (`rki-*`, `rbi-*`), by id. */
const SYMBOLS = new Map(
  [
    ...MAIN.matchAll(/<symbol id="((?:rki|rbi)-[\w-]+)" viewBox="0 0 24 24"><path d="([^"]+)"/g),
  ].map((match) => [match[1] ?? '', match[2] ?? ''] as const),
);

type Scope = Readonly<Record<string, unknown>>;

function lookup(scope: Scope, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    return value && typeof value === 'object' ? (value as Scope)[key] : undefined;
  }, scope);
}

/** `{{ name }}` replaced; an attribute bound to nothing (`aria-current="{{ st.cur }}"`) dropped. */
function substitute(html: string, scope: Scope): string {
  return html
    .replace(/ ([\w-]+)="\{\{ ([\w.]+) \}\}"/g, (whole, name: string, path: string) => {
      const value = lookup(scope, path);
      return value === undefined || value === null ? '' : ` ${name}="${String(value)}"`;
    })
    .replace(/\{\{ ([\w.]+) \}\}/g, (_whole, path: string) => String(lookup(scope, path) ?? ''));
}

/**
 * An excerpt of the export's template filled as its runtime fills it: each `sc-for` repeated over
 * its list and each `sc-if` kept or dropped (nested ones too), each `{{ name }}` replaced; the
 * preview's wiring (event bindings, `data-to`) and empty `class=""` dropped; sprites inlined.
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
  return out
    .replace(/ on[A-Z][A-Za-z]*="[^"]*"/g, '')
    .replace(/ data-to="[^"]*"/g, '')
    .replace(/ class=""/g, '')
    .replace(/<use href="#((?:rki|rbi)-[\w-]+)"><\/use>/g, (whole, id: string) => {
      const path = SYMBOLS.get(id);
      return path ? `<path d="${path}"></path>` : whole;
    });
}

/** The template from the line that starts with `start` to the end of the element it opens. */
function excerpt(start: string, end: string): string {
  const from = TEMPLATE.indexOf(start);
  expect(from, `the export draws ${start}`).toBeGreaterThanOrEqual(0);
  const to = TEMPLATE.indexOf(end, from);
  expect(to, `the export closes ${start} with ${end}`).toBeGreaterThan(from);
  return TEMPLATE.slice(from, to + end.length);
}

/** Class tokens in name order: the export writes a cell's place and its column in either order. */
function sortedClasses(html: string): string {
  return html.replace(/ class="([^"]*)"/g, (_whole, value: string) => {
    return ` class="${value.split(/\s+/).filter(Boolean).sort().join(' ')}"`;
  });
}

/** The recorded normalisations (see the file's head). */
function comparable(html: string): string {
  return sortedClasses(v3Canonical(iaPatchedMarkup(html)))
    .replace(/ role="(?:table|rowgroup|row|columnheader|rowheader|cell)"/g, '')
    .replace(/ selected=""/g, '')
    .replace(/(<select[^>]*?) value="[^"]*"/g, '$1')
    .replace(/\s+<b>/g, '<b>');
}

function expectSameMarkup(element: Element, expected: string) {
  expect(comparable(element.outerHTML)).toBe(comparable(expected));
}

/** Rendered inside a V3 root, as the shell renders the pages. */
function inRoot(ui: React.ReactNode) {
  return render(<div className="xr rb">{ui}</div>);
}

const STATE_WORDS = { done: ', done', current: ', current step' } as const;

describe('the format badges are the export’s `xr-fmts`', () => {
  const F = [
    { cls: 'xr-fmt', on: true, code: 'WEB', sr: 'WEB, Browser: In your plan' },
    {
      cls: 'xr-fmt xr-fmt--pub',
      on: false,
      code: 'AR',
      sr: 'AR, Augmented reality: Published, not in your plan',
    },
    { cls: 'xr-fmt', on: true, code: 'VR', sr: 'VR, Virtual reality: In your plan' },
    { cls: 'xr-fmt xr-fmt--none', on: false, code: 'MR', sr: 'MR, Mixed reality: Not published' },
  ];
  const cells = [
    // Given out of order: the list draws WEB, AR, VR, MR.
    { format: 'VR', state: 'on', words: F[2]!.sr },
    { format: 'WEB', state: 'on', words: F[0]!.sr },
    { format: 'MR', state: 'none', words: F[3]!.sr },
    { format: 'AR', state: 'pub', words: F[1]!.sr },
  ] as const;

  it('the experiment row’s list (IA-02, IA-03 `td.ia-xt-fm`): ticks, titles, words', () => {
    const drawn = excerpt('<ul class="xr-fmts" aria-label="{{ e.fmAria }}">', '</ul>');
    const { container } = inRoot(
      <IaFormatList label="Formats of Shell-and-Tube Heat Exchanger" cells={cells} />,
    );
    expectSameMarkup(
      container.querySelector('ul')!,
      fill(drawn, { e: { fmAria: 'Formats of Shell-and-Tube Heat Exchanger', F } }),
    );
    const list = screen.getByRole('list', { name: 'Formats of Shell-and-Tube Heat Exchanger' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(F.map((cell) => `${cell.code}${cell.sr}`));
  });

  it('the plan card’s list (IA-01 `ul.ia-plan-fmts`): no titles', () => {
    const drawn = excerpt('<ul class="xr-fmts ia-plan-fmts" aria-label="{{ e.fmAria }}">', '</ul>');
    const { container } = inRoot(
      <IaFormatList variant="plan" label="Formats of Venturi Meter" cells={cells} />,
    );
    expectSameMarkup(
      container.querySelector('ul')!,
      fill(drawn, { e: { fmAria: 'Formats of Venturi Meter', F: { list: F } } }),
    );
  });

  it('a row’s badges (`span.rk-fmts[role=img]`, IA-13 `ia-cell-exp`) and a group head’s (`span.xr-fmts`)', () => {
    const row = excerpt(
      '<span class="rk-fmts" role="img" aria-label="{{ e.fmAria }}">',
      '</sc-for></span>',
    );
    const head = excerpt(
      '<span class="xr-fmts" role="img" aria-label="{{ g.fmAria }}">',
      '</sc-for></span>',
    );
    const fmts = [{ code: 'WEB' }, { code: 'VR' }];
    const { container } = inRoot(
      <>
        <IaFormatBadges formats={['VR', 'WEB']} label="Formats from your plan: WEB, VR" />
        <IaFormatBadges
          formats={['WEB', 'VR']}
          label="Formats from your access plan: WEB, VR"
          variant="head"
        />
      </>,
    );
    const [rowBadges, headBadges] = container.querySelectorAll('.rk-fmts, .xr-fmts');
    expectSameMarkup(
      rowBadges!,
      fill(row, { e: { fmAria: 'Formats from your plan: WEB, VR', fmts } }),
    );
    expectSameMarkup(
      headBadges!,
      fill(head, { g: { fmAria: 'Formats from your access plan: WEB, VR', fmts } }),
    );
    expect(screen.getByRole('img', { name: 'Formats from your plan: WEB, VR' })).toBe(rowBadges);
  });

  it('unnamed badges are read as their codes; `pub` badges are dashed (IA-05 “published as”)', () => {
    const drawn = excerpt(
      'Not in your access plan · published as <span class="rk-fmts"',
      '</sc-for></span>',
    );
    // Flush with the words before them, as the export's inline `margin-top: 0` sets them
    // (`rk-x-fmts-flush`, V3P-14's class reused by V3P-16).
    const { container } = inRoot(<IaFormatBadges formats={['WEB', 'AR']} state="pub" flush />);
    const badges = container.querySelector('.rk-fmts')!;
    expect(badges.className).toBe('rk-fmts rk-x-fmts-flush');
    expectSameMarkup(
      badges,
      fill(drawn.slice(drawn.indexOf('<span')), { e: { fmts: [{ code: 'WEB' }, { code: 'AR' }] } }),
    );
    expect(badges).not.toHaveAttribute('role');
    expect(badges.textContent).toBe('WEBAR');
  });

  it('refuses a format listed twice', () => {
    expect(() => render(<IaFormatBadges formats={['WEB', 'WEB']} />)).toThrow(/listed twice/);
  });
});

describe('the list table (`div.ia-ltwrap` > `table.ia-lt`)', () => {
  const facultyDrawn = () =>
    excerpt('<div class="ia-ltwrap">\n              <table class="ia-lt ia-lt--fac">', '</div>');
  const faculty = [
    {
      href: '/institute/people/faculty/per-0013',
      aria: 'Open faculty record: Dr. Meera Iyer',
      n: 'Dr. Meera Iyer',
      email: 'meera.iyer@git.example',
      courses: [
        { code: 'ME ZG523', name: 'Thermodynamics and Heat Transfer' },
        { code: 'ME ZG612', name: 'Fluid Mechanics' },
      ],
      noCourses: false,
      stCls: 'xr-st xr-st--ok',
      stLabel: 'Active',
    },
    {
      href: '/institute/people/faculty/per-0014',
      aria: 'Open faculty record: Arjun Menon',
      n: 'Arjun Menon',
      email: 'arjun.menon@git.example',
      courses: [],
      noCourses: true,
      stCls: 'xr-st rk-st-ended',
      stLabel: 'Inactive',
    },
  ];

  function FacultyTable() {
    return (
      <IaListTable
        variant="fac"
        caption="Faculty at your institution and the courses they teach"
        columns={[
          { key: 'who', header: 'Faculty member' },
          { key: 'courses', header: 'Courses taught' },
          { key: 'status', header: 'Status' },
        ]}
        rows={faculty.map((row) => ({
          key: row.href,
          link: true,
          cells: [
            {
              key: 'who',
              role: 'main',
              className: 'ia-fac-who',
              children: (
                <>
                  <IaRowLink href={row.href} label={row.aria}>
                    {row.n}
                  </IaRowLink>
                  <IaCellText kind="sub">{row.email}</IaCellText>
                </>
              ),
            },
            {
              key: 'courses',
              className: 'ia-fac-courses',
              label: 'Courses taught',
              children:
                row.courses.length > 0 ? (
                  row.courses.map((course) => (
                    <IaCellLine key={course.code} kind="courses">
                      <CourseCode code={course.code} />
                      <IaCellText kind="text">{course.name}</IaCellText>
                    </IaCellLine>
                  ))
                ) : (
                  <IaCellText kind="muted">No courses yet</IaCellText>
                ),
            },
            {
              key: 'status',
              role: 'pri',
              children: (
                <StatusPill tone={row.noCourses ? 'ended' : 'ok'}>{row.stLabel}</StatusPill>
              ),
            },
          ],
        }))}
      />
    );
  }

  it('renders IA-08’s faculty table as drawn: caption, head, linked rows, inline labels, muted text', () => {
    const { container } = inRoot(<FacultyTable />);
    expectSameMarkup(
      container.querySelector('.ia-ltwrap')!,
      fill(facultyDrawn(), { V: { rows: faculty } }),
    );
  });

  it('keeps table semantics in every layout (explicit roles) and names its rows’ links', () => {
    inRoot(<FacultyTable />);
    const table = screen.getByRole('table', {
      name: 'Faculty at your institution and the courses they teach',
    });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Faculty member', 'Courses taught', 'Status']);
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Open faculty record: Arjun Menon' })).toHaveAttribute(
      'href',
      '/institute/people/faculty/per-0014',
    );
  });

  it('a press anywhere on a linked row follows its link — not on another control, not ending a selection', () => {
    const followed = vi.fn();
    inRoot(
      <IaListTable
        caption="Groups"
        columns={[
          { key: 'name', header: 'Group' },
          { key: 'act', header: 'Action', hidden: true },
        ]}
        rows={[
          {
            key: 'g',
            link: true,
            cells: [
              {
                key: 'name',
                role: 'main',
                children: (
                  <IaRowLink href="/institute/people/groups/GRP-0012">ME ZG523 — Sem II</IaRowLink>
                ),
              },
              {
                key: 'act',
                role: 'act',
                children: <Button variant="ghost">Give access</Button>,
              },
            ],
          },
        ]}
      />,
    );
    const link = screen.getByRole('link', { name: 'ME ZG523 — Sem II' });
    link.addEventListener('click', (event) => {
      event.preventDefault();
      followed();
    });
    const [row] = screen.getAllByRole('row').slice(1);
    expect(row).toHaveClass('is-link');
    fireEvent.click(within(row!).getAllByRole('cell')[0]!);
    expect(followed).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Give access' }));
    expect(followed).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('columnheader', { name: 'Action' }).innerHTML).toBe(
      '<span class="xr-sr">Action</span>',
    );
  });

  it('renders IA-07’s experiments list (`ia-lt--sr`): title, code and badges, how given, status and its notes, muted rows', () => {
    const drawn = excerpt(
      '<div class="ia-ltwrap">\n                  <table class="ia-lt ia-lt--sr">',
      '</div>',
    );
    const rows = [
      {
        rowCls: '',
        exp: 'Shell-and-Tube Heat Exchanger',
        code: 'ME ZG523',
        fmts: [{ code: 'WEB' }, { code: 'VR' }],
        fmAria: 'Formats from your plan: WEB, VR',
        isInd: true,
        hasGrpLink: false,
        date: '9 Oct 2026',
        hasAlso: true,
        alsoText: 'Also in the group ME ZG523 — Sem II',
        stCls: 'xr-st xr-st--ok',
        stLabel: 'Active',
      },
      {
        rowCls: 'is-muted',
        exp: 'Venturi Meter',
        code: 'ME ZG612',
        fmts: [{ code: 'WEB' }],
        fmAria: 'Formats from your plan: WEB',
        isInd: false,
        hasGrpLink: true,
        grpLink: { href: '/institute/people/groups/GRP-0012' },
        viaText: 'ME ZG523 — Sem II',
        date: '12 Oct 2026',
        stCls: 'xr-st rk-st-ended',
        stLabel: 'Withdrawn',
        hasWd: true,
        wdText: 'Withdrawn 14 Oct 2026',
        reason: 'Left the course',
      },
    ];
    const { container } = inRoot(
      <IaListTable
        variant="sr"
        caption="Experiments given to Rahul Verma, one row per experiment"
        columns={[
          { key: 'exp', header: 'Experiment' },
          { key: 'how', header: 'How given' },
          { key: 'st', header: 'Status' },
        ]}
        rows={rows.map((row) => ({
          key: row.exp,
          muted: row.rowCls === 'is-muted',
          cells: [
            {
              key: 'exp',
              role: 'main',
              className: 'ia-sr-exp',
              children: (
                <>
                  <IaCellText kind="title">{row.exp}</IaCellText>
                  <IaCellLine gap>
                    <CourseCode code={row.code} />
                    <IaFormatBadges
                      formats={row.fmts.map((fmt) => fmt.code as 'WEB' | 'VR')}
                      label={row.fmAria}
                    />
                  </IaCellLine>
                </>
              ),
            },
            {
              key: 'how',
              className: 'ia-sr-how',
              children: (
                <IaGrantHow
                  how={
                    row.isInd
                      ? { kind: 'individual', words: 'Individually' }
                      : { kind: 'group', words: row.viaText!, href: row.grpLink!.href }
                  }
                  date={row.date}
                  also={row.alsoText}
                />
              ),
            },
            {
              key: 'st',
              role: 'pri',
              className: 'ia-sr-st',
              children: (
                <IaStatusNotes
                  status={<StatusPill tone={row.isInd ? 'ok' : 'ended'}>{row.stLabel}</StatusPill>}
                  notes={row.hasWd ? [`${row.wdText} · ${row.reason}`] : []}
                />
              ),
            },
          ],
        }))}
      />,
    );
    expectSameMarkup(
      container.querySelector('.ia-ltwrap')!,
      fill(drawn, { V: { n: 'Rahul Verma', rows } }),
    );
  });

  it('renders IA-20’s figures (`ia-lt--stats`): numbers columns with their labels', () => {
    const drawn = excerpt(
      '<div class="ia-ltwrap">\n                  <table class="ia-lt ia-lt--stats">',
      '</div>',
    );
    const rows = [
      { code: 'WEB', name: 'Browser', started: 14, completed: 9, sessions: 31 },
      { code: 'VR', name: 'Virtual reality', started: 3, completed: 1, sessions: 4 },
    ];
    const numbers = ['Started', 'Completed', 'Sessions'] as const;
    const { container } = inRoot(
      <IaListTable
        variant="stats"
        caption="Usage by format for Shell-and-Tube Heat Exchanger"
        columns={[
          { key: 'format', header: 'Format' },
          ...numbers.map((header) => ({ key: header, header, numeric: true })),
        ]}
        rows={rows.map((row) => ({
          key: row.code,
          cells: [
            {
              key: 'format',
              role: 'main',
              children: (
                <IaCellLine>
                  <span className="xr-fmt">{row.code}</span>
                  <IaCellText kind="text">{row.name}</IaCellText>
                </IaCellLine>
              ),
            },
            ...numbers.map((header) => ({
              key: header,
              role: 'num' as const,
              label: header,
              children: (
                <IaCellText kind="number">
                  {row[header.toLowerCase() as 'started' | 'completed' | 'sessions']}
                </IaCellText>
              ),
            })),
          ],
        }))}
      />,
    );
    expectSameMarkup(
      container.querySelector('.ia-ltwrap')!,
      fill(drawn, { e: { t: 'Shell-and-Tube Heat Exchanger', rows } }),
    );
  });
});

describe('the grouped grants table (`table.ia-gt`)', () => {
  const groups = [
    {
      t: 'Shell-and-Tube Heat Exchanger',
      code: 'ME ZG523',
      fmts: [{ code: 'WEB' }, { code: 'VR' }],
      fmAria: 'Formats from your access plan: WEB, VR',
      n: '2 students',
      rows: [
        {
          rowClsR: 'ia-gt-row',
          stuLink: { href: '/institute/people/students/per-0002' },
          n: 'Rahul Verma',
          sid: 'GIT-2026-0418',
          isInd: true,
          date: '9 Oct 2026',
          hasAlso: true,
          alsoText: 'Also in the group ME ZG523 — Sem II',
          stCls: 'xr-st xr-st--ok',
          stLabel: 'Active',
          canWd: true,
          wdId: 'sa-wd-1',
          wdAria: 'Withdraw Shell-and-Tube Heat Exchanger from Rahul Verma',
        },
        {
          rowClsR: 'ia-gt-row is-muted',
          stuLink: { href: '/institute/people/students/per-0003' },
          n: 'Sneha Rao',
          sid: 'GIT-2026-0420',
          isInd: false,
          hasGrpLink: true,
          grpLink: { href: '/institute/people/groups/GRP-0012' },
          viaText: 'ME ZG523 — Sem II',
          date: '12 Oct 2026',
          stCls: 'xr-st rk-st-ended',
          stLabel: 'Withdrawn',
          hasWd: true,
          wdText: 'Withdrawn 14 Oct 2026',
          reason: 'Left the course',
          hasWait: false,
          canWd: false,
        },
      ],
    },
  ];

  function rowsOf(readOnly: boolean) {
    return groups.map((group) => ({
      key: group.t,
      title: group.t,
      code: group.code,
      formats: group.fmts.map((fmt) => fmt.code as 'WEB' | 'VR'),
      formatsLabel: group.fmAria,
      count: group.n,
      rows: group.rows.map((row) => ({
        key: row.sid,
        name: row.n,
        href: row.stuLink.href,
        sub: row.sid,
        muted: row.rowClsR.includes('is-muted'),
        how: (
          <IaGrantHow
            how={
              row.isInd
                ? { kind: 'individual' as const, words: 'Individually' }
                : { kind: 'group' as const, words: row.viaText!, href: row.grpLink!.href }
            }
            date={row.date}
            also={row.alsoText}
          />
        ),
        status: (
          <IaStatusNotes
            status={<StatusPill tone={row.isInd ? 'ok' : 'ended'}>{row.stLabel}</StatusPill>}
            notes={!readOnly && row.hasWd ? [`${row.wdText} · ${row.reason}`] : []}
          />
        ),
        action:
          !readOnly && row.canWd ? (
            <Button id={row.wdId} aria-label={row.wdAria}>
              Withdraw…
            </Button>
          ) : undefined,
      })),
    }));
  }

  it('renders IA-04’s table as drawn: group heads, rows, how given, status notes, actions, muted rows', () => {
    const drawn = excerpt('<table class="ia-gt">', '</table>');
    const { container } = inRoot(
      <IaGroupedTable
        caption="Student access, grouped by experiment: one row per student"
        headers={{ who: 'Student', how: 'How given', status: 'Status', action: 'Action' }}
        groups={rowsOf(false)}
      />,
    );
    expectSameMarkup(container.querySelector('table')!, fill(drawn, { V: { groups } }));
  });

  it('renders IA-03’s read-only version (`ia-gt--ro`) without the action column', () => {
    const drawn = excerpt('<table class="ia-gt ia-gt--ro">', '</table>');
    const { container } = inRoot(
      <IaGroupedTable
        readOnly
        caption="Students given access under your access plan, grouped by experiment: one row per student"
        headers={{ who: 'Student', how: 'How given', status: 'Status' }}
        groups={rowsOf(true)}
      />,
    );
    // The export's caption names the plan by its reference; the product names it by content.
    expectSameMarkup(
      container.querySelector('table')!,
      fill(drawn, { V: { groups, id: 'your access plan' } }),
    );
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
  });

  it('names each group head as a row header over its rows, and keeps the table’s semantics', () => {
    inRoot(
      <IaGroupedTable
        caption="Student access"
        headers={{ who: 'Student', how: 'How given', status: 'Status', action: 'Action' }}
        groups={rowsOf(false)}
      />,
    );
    const table = screen.getByRole('table', { name: 'Student access' });
    const head = within(table).getByRole('rowheader');
    expect(head).toHaveAttribute('scope', 'rowgroup');
    expect(head).toHaveAttribute('colspan', '4');
    expect(within(head).getByRole('img').getAttribute('aria-label')).toBe(
      'Formats from your access plan: WEB, VR',
    );
    expect(
      within(table).getByRole('img', { name: 'Formats from your access plan: WEB, VR' }),
    ).toBeTruthy();
    expect(within(table).getByRole('link', { name: 'ME ZG523 — Sem II' })).toHaveAttribute(
      'href',
      '/institute/people/groups/GRP-0012',
    );
  });
});

describe('the surface sections, record grid and helpers', () => {
  it('a heading row with a link (`div.ia-shead`; IA-03 “Students you’ve given access”)', () => {
    const drawn = excerpt('<div class="ia-shead"><h2 class="rb-h2" id="pl-stu">', '</div>');
    const { container } = inRoot(
      <IaSectionHead
        title="Students you’ve given access"
        titleId="pl-stu"
        aside={<TextLink href="/institute/student-access">Open Student access</TextLink>}
      />,
    );
    expectSameMarkup(
      container.querySelector('.ia-shead')!,
      fill(drawn, { V: { hasRows: true, sa: { href: '/institute/student-access' } } }),
    );
  });

  it('a heading row mid-surface with its note (`ia-shead--line`, `h2.rk-h3`, `p.ia-shead-n`; IA-11)', () => {
    const drawn = excerpt('<div class="ia-shead ia-shead--line">', '</div>');
    const { container } = inRoot(
      <IaSectionHead
        line
        size="minor"
        title="Rows that need attention"
        aside={
          <IaSectionCount>
            Row numbers count from the first student row, after the header.
          </IaSectionCount>
        }
      />,
    );
    expectSameMarkup(container.querySelector('.ia-shead')!, drawn);
  });

  it('a heading row with a sub line and a key figure (IA-20 per experiment)', () => {
    const drawn = excerpt(
      '<div class="ia-shead">\n                  <div><h2',
      '</p>\n                </div>',
    );
    const { container } = inRoot(
      <IaSectionHead
        title="Shell-and-Tube Heat Exchanger"
        titleId="us-e-1"
        sub="ME ZG523 · your access plan"
        aside={<IaSectionCount emphasis>12 students with access</IaSectionCount>}
      />,
    );
    expectSameMarkup(
      container.querySelector('.ia-shead')!,
      fill(drawn, {
        e: {
          hid: 'us-e-1',
          t: 'Shell-and-Tube Heat Exchanger',
          line: 'ME ZG523 · your access plan',
          withText: '12 students with access',
        },
      }),
    );
  });

  it('a summary column (IA-07 About and Account: `div.ia-sbody`, `dl.ia-sum`, `span.ia-block`)', () => {
    const drawn = excerpt(
      '<section class="rk-surface" aria-label="About {{ V.n }}">',
      '</section>',
    );
    const { container } = inRoot(
      <section className="rk-surface" aria-label="About Rahul Verma">
        <IaSectionBody title="About" titleId="sr-ab-h">
          <IaSummary
            items={[
              {
                key: 'course',
                term: 'Course',
                children: 'ME ZG523 Thermodynamics and Heat Transfer',
              },
              {
                key: 'groups',
                term: 'Groups',
                children: ['ME ZG523 — Sem II', 'Lab batch B'].map((name) => (
                  <IaBlock key={name}>
                    <a className="rb-link ia-wrap" href="/institute/people/groups/GRP-0012">
                      {name}
                    </a>
                  </IaBlock>
                )),
              },
              { key: 'prog', term: 'Programme', children: 'M.Tech Mechanical' },
              { key: 'added', term: 'Added', children: '8 Oct 2026 · imported by Meera Iyer' },
            ]}
          />
        </IaSectionBody>
        <IaSectionBody title="Account" titleId="sr-ac-h">
          <p className="rk-next">Active. Rahul can sign in and open the experiments given.</p>
          <p>
            <Button id="sr-deact">Deactivate account…</Button>
          </p>
        </IaSectionBody>
      </section>,
    );
    expectSameMarkup(
      container.querySelector('section')!,
      fill(drawn, {
        V: {
          n: 'Rahul Verma',
          course: 'ME ZG523 Thermodynamics and Heat Transfer',
          grpLabel: 'Groups',
          groups: [
            { href: '/institute/people/groups/GRP-0012', name: 'ME ZG523 — Sem II' },
            { href: '/institute/people/groups/GRP-0012', name: 'Lab batch B' },
          ],
          prog: 'M.Tech Mechanical',
          added: '8 Oct 2026 · imported by Meera Iyer',
          acctText: 'Active. Rahul can sign in and open the experiments given.',
          canDeact: true,
        },
      }),
    );
  });

  it('a definitions summary (`dl.ia-sum.ia-sum--defs`; IA-20 “What the figures mean”)', () => {
    const drawn = excerpt('<dl class="ia-sum ia-sum--defs">', '</dl>');
    const items = [...drawn.matchAll(/<div><dt>([^<]+)<\/dt><dd>([^<]+)<\/dd><\/div>/g)].map(
      (match) => ({ key: match[1]!, term: match[1]!, children: match[2]! }),
    );
    expect(items).toHaveLength(4);
    const { container } = inRoot(<IaSummary definitions items={items} />);
    expectSameMarkup(container.querySelector('dl')!, drawn);
  });

  it('a footnote, an empty body’s title (IA-14) and the record grid’s three areas', () => {
    const { container } = inRoot(
      <IaRecordGrid
        variant="sidefirst"
        main={
          <IaSectionFoot>
            Formats come from your access plan; they are never chosen per student.
          </IaSectionFoot>
        }
        side={
          <IaSectionBody>
            <IaEmptyTitle>Nothing given to this group yet</IaEmptyTitle>
          </IaSectionBody>
        }
        more={<p>History</p>}
      />,
    );
    const grid = container.querySelector('.ia-rec > .ia-rec-grid')!;
    expect(grid.className).toBe('ia-rec-grid ia-rec-grid--sidefirst');
    expect([...grid.children].map((area) => area.className)).toEqual([
      'ia-rec-main',
      'ia-rec-side',
      'ia-rec-more',
    ]);
    expect(TEMPLATE).toContain('<div class="ia-rec-grid ia-rec-grid--sidefirst">');
    expect(TEMPLATE).toContain('<div class="ia-sbody">\n                  <p class="ia-empty-t">');
    expect(container.querySelector('.ia-sfoot')!.outerHTML).toBe(
      '<p class="ia-sfoot">Formats come from your access plan; they are never chosen per student.</p>',
    );
    const { container: plain } = inRoot(<IaRecordGrid main="m" side="s" />);
    expect(
      [...plain.querySelector('.ia-rec-grid')!.children].map((area) => area.className),
    ).toEqual(['ia-rec-main', 'ia-rec-side']);
  });

  it('explainer lines with their own glyphs (`ul.ia-lines`; IA-16 “How course codes work”)', () => {
    const drawn = excerpt('<ul class="ia-lines">\n                  <li class="is-off">', '</ul>');
    const words = [...drawn.matchAll(/<span>([^<]+)<\/span>/g)].map((match) => match[1]!);
    const { container } = inRoot(
      <IaLines
        lines={[
          { key: 'bits', tone: 'off', icon: 'lock', children: words[0] },
          { key: 'see', tone: 'info', icon: 'people', children: words[1] },
          { key: 'csv', tone: 'info', icon: 'documentText', children: words[2] },
        ]}
      />,
    );
    expectSameMarkup(container.querySelector('ul')!, fill(drawn, {}));
  });

  it('outcome lines take their tone’s glyph (IA-05 “What will be created”)', () => {
    const drawn = excerpt('<ul class="ia-lines"><sc-for list="{{ V.gsum }}"', '</ul>');
    const gsum = [
      { cls: 'is-ok', isOk: true, t: '3 members can open it straight away' },
      { cls: 'is-wait', isWait: true, t: 'Sneha Rao is waiting for a licence' },
      { cls: 'is-info', isInfo: true, t: 'Kiran Das already has it individually' },
      {
        cls: 'is-off',
        isOff: true,
        t: 'Arjun Menon is inactive and can’t open experiments while inactive',
      },
    ];
    const { container } = inRoot(
      <IaLines
        lines={gsum.map((line) => ({
          key: line.t,
          tone: line.cls.slice(3) as 'ok' | 'wait' | 'info' | 'off',
          children: line.t,
        }))}
      />,
    );
    expectSameMarkup(container.querySelector('ul')!, fill(drawn, { V: { gsum } }));
  });

  it('a message page (IA-07 “isn’t in People”): the H1 takes focus, the way on in a row', () => {
    const drawn = excerpt(
      '<section class="rk-surface" aria-labelledby="ia-h1" style="max-width: 760px">\n          <div class="rk-sec ia-stack ia-stack--tight">\n            <h1 class="rb-h2" id="ia-h1" tabindex="-1">This student',
      '</section>',
    );
    const { container } = inRoot(
      <IaMessageCard
        title="This student isn’t in People"
        actions={
          <ButtonLink variant="navy" href="/institute/people">
            Back to Students
          </ButtonLink>
        }
      >
        The record may have a different ID. Search for the student in People.
      </IaMessageCard>,
    );
    expectSameMarkup(
      container.querySelector('section')!,
      fill(drawn, { V: { back: { href: '/institute/people' } } }),
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('tabindex', '-1');
  });

  it('a refusal message with its glyph (IA-10 paused)', () => {
    const drawn = excerpt(
      '<section class="rk-surface" aria-labelledby="ia-h1" style="max-width: 760px">\n          <div class="rk-sec ia-stack ia-stack--tight">\n            <span class="rk-state-ico"',
      '</section>',
    );
    const { container } = inRoot(
      <IaMessageCard
        icon="pauseCircle"
        title="You can’t add people while your institution’s access is paused"
        actions={
          <>
            <ButtonLink variant="navy" href="/institute/people">
              Back to Students
            </ButtonLink>
            <TextLink href="/institute/help">Help</TextLink>
          </>
        }
      >
        People and their work are kept. You can add people again when BITS lifts the pause.
      </IaMessageCard>,
    );
    expectSameMarkup(
      container.querySelector('section')!,
      fill(drawn, {
        V: {
          back: { href: '/institute/people' },
          backT: 'Students',
          help: { href: '/institute/help' },
        },
      }),
    );
  });

  it('stacks, rows and unbroken IDs', () => {
    const { container } = inRoot(
      <>
        <IaStack sec tight>
          <IaRow>
            <IaNoWrap>GIT-2026-0418</IaNoWrap>
          </IaRow>
        </IaStack>
        <IaStack as="section" sec labelledBy="rq-more-h">
          <h2 id="rq-more-h">More</h2>
        </IaStack>
        <IaStack as="ul" tight>
          <li>One</li>
        </IaStack>
      </>,
    );
    const [first, second, third] = container.firstElementChild!.children;
    expect(first!.outerHTML).toBe(
      '<div class="rk-sec ia-stack ia-stack--tight"><div class="ia-row"><span class="ia-nowrap">GIT-2026-0418</span></div></div>',
    );
    expect(second!.outerHTML).toBe(
      '<section class="rk-sec ia-stack" aria-labelledby="rq-more-h"><h2 id="rq-more-h">More</h2></section>',
    );
    expect(third!.outerHTML).toBe('<ul class="ia-stack ia-stack--tight"><li>One</li></ul>');
    for (const drawn of [
      '<div class="rk-sec ia-stack ia-stack--tight">',
      '<section class="rk-sec ia-stack" aria-labelledby="rq-more-h">',
      '<ul class="ia-stack ia-stack--tight">',
    ]) {
      expect(TEMPLATE).toContain(drawn);
    }
  });
});

describe('the management surface (`section.rk-surface.ia-gm`)', () => {
  const SEGS = [
    { k: 'all', label: 'All', n: 12 },
    { k: 'access', label: 'Access active', n: 7 },
    { k: 'none', label: 'No access yet', n: 4 },
    { k: 'inactive', label: 'Inactive', n: 1 },
  ];
  const GROUPS = [
    { v: 'all', t: 'All groups' },
    { v: 'GRP-0012', t: 'ME ZG523 — Sem II' },
    { v: 'none', t: 'Not in a group' },
  ];

  function Students({ onRemove = () => {}, onClear = () => {} }) {
    const [segment, setSegment] = useState('access');
    const [query, setQuery] = useState('rahul');
    const [group, setGroup] = useState('GRP-0012');
    const chips: IaFilterChip[] = [
      {
        key: 'q',
        label: 'Search: “rahul”',
        removeLabel: 'Remove filter Search: “rahul”',
        onRemove,
        focusId: 'pp-q',
      },
      {
        key: 'grp',
        label: 'Group: ME ZG523 — Sem II',
        removeLabel: 'Remove filter Group: ME ZG523 — Sem II',
        onRemove,
        focusId: 'pp-grp',
      },
    ];
    return (
      <IaManageSurface labelledBy="pp-s-h" hiddenTitle="Students">
        <IaManageTools>
          <IaManageFilters label="Filter students">
            <IaManageSearch
              id="pp-q"
              label="Search students"
              placeholder="Search name, student ID or e-mail"
              value={query}
              onChange={setQuery}
            />
            <IaManageSelect
              id="pp-grp"
              label="Group"
              value={group}
              onChange={setGroup}
              options={GROUPS.map((option) => ({ value: option.v, label: option.t }))}
            />
          </IaManageFilters>
          <IaSegments
            label="Show students by status"
            segments={SEGS.map((seg) => ({ key: seg.k, label: seg.label, count: seg.n }))}
            value={segment}
            onChange={setSegment}
          />
          <IaManageStatus
            shown="Showing 1 of 7"
            chips={chips}
            clearLabel="Clear filters"
            onClear={onClear}
            clearFocusId="pp-q"
          />
        </IaManageTools>
        <IaLiveLine>1 student shown</IaLiveLine>
      </IaManageSurface>
    );
  }

  it('renders IA-06’s tools as drawn: search, group select, counted segments, shown count, chips, Clear filters', () => {
    const drawn = excerpt(
      '<div class="ia-gm-tools">\n              <div class="ia-gm-row" role="search" aria-label="Filter students">',
      '<p class="xr-sr" role="status">{{ V.liveText }}</p>',
    );
    const { container } = inRoot(<Students />);
    const tools = container.querySelector('.ia-gm-tools')!;
    const live = container.querySelector('p.xr-sr[role=status]')!;
    const expected = fill(drawn, {
      V: {
        showTools: true,
        q: 'rahul',
        grp: 'GRP-0012',
        grpOpts: GROUPS,
        segs: SEGS.map((seg) => ({ ...seg, pressed: seg.k === 'access' ? 'true' : 'false' })),
        hasChipsR: true,
        shownText: 'Showing 1 of 7',
        chipsR: [
          { label: 'Search: “rahul”', aria: 'Remove filter Search: “rahul”' },
          { label: 'Group: ME ZG523 — Sem II', aria: 'Remove filter Group: ME ZG523 — Sem II' },
        ],
        liveText: '1 student shown',
      },
    });
    expect(comparable(`${tools.outerHTML}${live.outerHTML}`)).toBe(
      comparable(expected.replace(/<\/sc-if>\s*$/, '').replace(/\s+<\/sc-if>/g, '')),
    );
    const surface = container.querySelector('section')!;
    expect(surface.className).toBe('rk-surface ia-gm');
    expect(surface).toHaveAttribute('aria-labelledby', 'pp-s-h');
    expect(TEMPLATE).toContain(
      '<section class="rk-surface ia-gm" aria-labelledby="pp-s-h">\n            <h2 class="xr-sr" id="pp-s-h">Students</h2>',
    );
  });

  it('names its controls and announces the change; the segments’ names read the count apart', () => {
    inRoot(<Students />);
    expect(screen.getByRole('region', { name: 'Students' })).toBeTruthy();
    expect(screen.getByRole('search', { name: 'Filter students' })).toBeTruthy();
    expect(screen.getByRole('searchbox', { name: 'Search students' })).toHaveValue('rahul');
    expect(screen.getByRole('combobox', { name: 'Group' })).toHaveValue('GRP-0012');
    const group = screen.getByRole('group', { name: 'Show students by status' });
    expect(within(group).getByRole('button', { name: 'Access active 7' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    fireEvent.click(within(group).getByRole('button', { name: 'Inactive 1' }));
    expect(within(group).getByRole('button', { name: 'Inactive 1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('1 student shown')).toHaveAttribute('role', 'status');
  });

  it('removing a chip focuses the control that set it; Clear filters focuses the search', () => {
    const onRemove = vi.fn();
    const onClear = vi.fn();
    inRoot(<Students onRemove={onRemove} onClear={onClear} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter Group: ME ZG523 — Sem II' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('combobox', { name: 'Group' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('searchbox', { name: 'Search students' })).toHaveFocus();
  });

  it('the count beside the search (IA-08) and the footnote', () => {
    const drawn = excerpt(
      '<div class="ia-gm-row" role="search" aria-label="Filter faculty">',
      '</div>\n              <sc-if',
    );
    const { container } = inRoot(
      <>
        <IaManageFilters label="Filter faculty">
          <IaManageSearch
            id="pf-q"
            label="Search faculty"
            placeholder="Search name or e-mail"
            value=""
            onChange={() => {}}
          />
          <IaManageCount>3 faculty members</IaManageCount>
        </IaManageFilters>
        <IaManageFoot>
          Courses taught set what each person sees in the Faculty workspace. They never give
          students access.
        </IaManageFoot>
      </>,
    );
    expectSameMarkup(
      container.querySelector('.ia-gm-row')!,
      fill(drawn.slice(0, drawn.lastIndexOf('<sc-if')), {
        V: { q: '', count: '3 faculty members' },
      }),
    );
    expect(TEMPLATE).toContain(
      `<p class="ia-gm-foot">${container.querySelector('.ia-gm-foot')!.textContent}</p>`,
    );
  });
});

describe('the step indicator (`ol.ia-steps`)', () => {
  const drawn = () =>
    excerpt(
      '<ol class="ia-steps" aria-label="Steps">\n          <sc-for list="{{ V.steps }}"',
      '</ol>',
    );
  const labels = ['Experiments', 'Students', 'Review and give access'];

  it.each([1, 2, 3])('renders IA-05’s steps as drawn on step %i', (step) => {
    const { container } = inRoot(
      <IaSteps
        label="Steps"
        steps={labels.map((label) => ({ key: label, label }))}
        current={step}
        stateWords={STATE_WORDS}
      />,
    );
    const steps = [1, 2, 3].map((i) => ({
      n: i,
      label: labels[i - 1],
      cls: `ia-step${step > i ? ' is-done' : step === i ? ' is-current' : ''}`,
      cur: step === i ? 'step' : undefined,
      done: step > i,
      notDone: step <= i,
      sr: step > i ? ', done' : step === i ? ', current step' : '',
    }));
    expectSameMarkup(container.querySelector('ol')!, fill(drawn(), { V: { steps } }));
  });

  it('reads each step’s state and marks the current one', () => {
    inRoot(
      <IaSteps
        label="Steps"
        steps={['Choose a file', 'Check rows', 'Confirm import'].map((label) => ({
          key: label,
          label,
        }))}
        current={2}
        stateWords={STATE_WORDS}
      />,
    );
    const items = within(screen.getByRole('list', { name: 'Steps' })).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Choose a file, done',
      '2Check rows, current step',
      '3Confirm import',
    ]);
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).not.toHaveAttribute('aria-current');
  });
});

describe('the form column and action bar', () => {
  it('renders IA-10’s action bar as drawn, busy (`ia-btn--busy`, `aria-disabled`, the working words)', () => {
    const drawn = excerpt(
      '<div class="ia-actions"><a class="rb-btn rb-btn--lg" href="{{ V.back.href }}" onClick="{{ V.back.go }}">Cancel</a><button type="button" class="{{ V.subCls }}"',
      '</div>',
    );
    const pressed = vi.fn();
    const { container } = inRoot(
      <IaActions>
        <ButtonLink size="lg" href="/institute/people">
          Cancel
        </ButtonLink>
        <IaBusyButton variant="primary" size="lg" busy busyLabel="Adding…" onClick={pressed}>
          Add student
        </IaBusyButton>
      </IaActions>,
    );
    expectSameMarkup(
      container.querySelector('.ia-actions')!,
      fill(drawn, {
        V: {
          back: { href: '/institute/people' },
          subCls: 'rb-btn rb-btn--primary rb-btn--lg ia-btn--busy',
          busyAria: 'true',
          subLabel: 'Adding…',
        },
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Adding…' }));
    expect(pressed).not.toHaveBeenCalled();
  });

  it('when not busy the button is the plain primary and runs', () => {
    const pressed = vi.fn();
    inRoot(
      <IaBusyButton variant="primary" size="lg" busyLabel="Adding…" onClick={pressed}>
        Add student
      </IaBusyButton>,
    );
    const button = screen.getByRole('button', { name: 'Add student' });
    expect(button.className).toBe('rb-btn rb-btn--primary rb-btn--lg');
    expect(button).not.toHaveAttribute('aria-disabled');
    fireEvent.click(button);
    expect(pressed).toHaveBeenCalledTimes(1);
  });

  it('the form column: `section.rk-surface.ia-form` > `div.rk-sec.ia-stack` + the bar; fields two per row; the result bar at the start', () => {
    const { container } = inRoot(
      <IaFormSurface
        labelledBy="ia-h1"
        actions={
          <IaActions start>
            <ButtonLink variant="primary" size="lg" href="/institute/student-access/give">
              Give this student access
            </ButtonLink>
          </IaActions>
        }
      >
        <fieldset className="rk-fieldset">
          <legend>Who they are</legend>
          <IaFieldGrid two>
            <p>Full name</p>
          </IaFieldGrid>
        </fieldset>
        <IaFieldGrid>
          <p>Group</p>
        </IaFieldGrid>
      </IaFormSurface>,
    );
    const form = container.querySelector('section')!;
    expect(form.className).toBe('rk-surface ia-form');
    expect(form).toHaveAttribute('aria-labelledby', 'ia-h1');
    expect([...form.children].map((child) => child.className)).toEqual([
      'rk-sec ia-stack',
      'ia-actions ia-actions--start',
    ]);
    expect(form.querySelector('.ia-fgrid.ia-fgrid--2')).not.toBeNull();
    expect(form.querySelectorAll('.ia-fgrid')).toHaveLength(2);
    for (const drawn of [
      '<section class="rk-surface ia-form" aria-labelledby="ia-h1">\n          <div class="rk-sec ia-stack">',
      '<div class="ia-fgrid ia-fgrid--2">',
      '<div class="ia-actions ia-actions--start">',
    ]) {
      expect(TEMPLATE).toContain(drawn);
    }
  });
});

describe('the class contract and accessibility', () => {
  it('every piece emits only V3 classes and passes axe', async () => {
    const { container } = inRoot(
      <main>
        <h1>Student access</h1>
        <IaSteps
          label="Steps"
          steps={[
            { key: 'a', label: 'Experiments' },
            { key: 'b', label: 'Students' },
          ]}
          current={2}
          stateWords={STATE_WORDS}
        />
        <IaManageSurface labelledBy="m-h" hiddenTitle="Student access">
          <IaManageTools>
            <IaManageFilters label="Filter student access">
              <IaManageSearch
                id="m-q"
                label="Search student access"
                placeholder="Search"
                value=""
                onChange={() => {}}
              />
              <IaManageSelect
                id="m-via"
                label="How given"
                value="all"
                onChange={() => {}}
                options={[{ value: 'all', label: 'Given any way' }]}
              />
              <IaManageCount>2 rows</IaManageCount>
            </IaManageFilters>
            <IaSegments
              label="Show grants by status"
              segments={[{ key: 'current', label: 'Current', count: 2 }]}
              value="current"
              onChange={() => {}}
            />
            <IaManageStatus
              shown="Showing 2 of 2"
              chips={[]}
              clearLabel="Clear filters"
              onClear={() => {}}
              clearFocusId="m-q"
            />
          </IaManageTools>
          <IaLiveLine>2 rows shown</IaLiveLine>
          <IaGroupedTable
            caption="Student access, grouped by experiment"
            headers={{ who: 'Student', how: 'How given', status: 'Status', action: 'Action' }}
            groups={[
              {
                key: 'e',
                title: 'Venturi Meter',
                code: 'ME ZG612',
                formats: ['WEB', 'VR'],
                formatsLabel: 'Formats from your access plan: WEB, VR',
                count: '1 student',
                rows: [
                  {
                    key: 'r',
                    name: 'Rahul Verma',
                    href: '/institute/people/students/per-0002',
                    sub: <IaNoWrap>GIT-2026-0418</IaNoWrap>,
                    how: (
                      <IaGrantHow
                        how={{ kind: 'group', words: 'ME ZG523 — Sem II', href: '/g' }}
                        date="9 Oct 2026"
                        also="Also given individually"
                      />
                    ),
                    status: (
                      <IaStatusNotes
                        status={<StatusPill tone="warn">Waiting for a licence</StatusPill>}
                        notes={['Waiting for a licence on your access plan right now']}
                      />
                    ),
                    action: (
                      <Button aria-label="Withdraw Venturi Meter from Rahul Verma">
                        Withdraw…
                      </Button>
                    ),
                    muted: true,
                  },
                ],
              },
            ]}
          />
          <IaManageFoot>
            Formats come from your access plan; they are never chosen per student.
          </IaManageFoot>
        </IaManageSurface>
        <IaRecordGrid
          variant="wide"
          main={
            <section className="rk-surface" aria-labelledby="s-h">
              <IaSectionHead
                title="Experiments given"
                titleId="s-h"
                aside={<IaSectionCount>2</IaSectionCount>}
              />
              <IaListTable
                variant="sr"
                caption="Experiments given"
                columns={[
                  { key: 'e', header: 'Experiment' },
                  { key: 'n', header: 'Sessions', numeric: true },
                  { key: 'a', header: 'Action', hidden: true },
                ]}
                rows={[
                  {
                    key: 'r',
                    link: true,
                    muted: true,
                    cells: [
                      {
                        key: 'e',
                        role: 'main',
                        children: (
                          <>
                            <IaRowLink href="/x" label="Open Venturi Meter">
                              Venturi Meter
                            </IaRowLink>
                            <IaCellLine kind="exp" gap>
                              <IaCellText kind="text">Venturi Meter</IaCellText>
                              <IaFormatBadges
                                formats={['WEB']}
                                label="Formats from your plan: WEB"
                              />
                            </IaCellLine>
                            <IaCellText kind="note">Withdrawn 14 Oct 2026</IaCellText>
                            <IaCellText kind="also">Also in a group</IaCellText>
                            <IaCellText kind="muted">None yet</IaCellText>
                            <IaCellText kind="title" nowrap inline title="t">
                              Row 3
                            </IaCellText>
                          </>
                        ),
                      },
                      {
                        key: 'n',
                        role: 'num',
                        label: 'Sessions',
                        children: <IaCellText kind="number">4</IaCellText>,
                      },
                      {
                        key: 'a',
                        role: 'act',
                        children: <Button variant="ghost">Give access</Button>,
                      },
                    ],
                  },
                ]}
              />
              <IaSectionFoot>Formats come from your access plan.</IaSectionFoot>
            </section>
          }
          side={
            <section className="rk-surface" aria-labelledby="b-h">
              <IaSectionBody title="About" titleId="b-h">
                <IaSummary
                  items={[{ key: 'c', term: 'Course', children: <IaBlock>ME ZG523</IaBlock> }]}
                />
                <IaEmptyTitle>Nothing given to this group yet</IaEmptyTitle>
              </IaSectionBody>
              <IaSectionBody>
                <IaLines lines={[{ key: 'a', tone: 'ok', children: 'Active' }]} />
              </IaSectionBody>
            </section>
          }
          more={
            <IaFormatList
              label="Formats of Venturi Meter"
              cells={[
                { format: 'WEB', state: 'on', words: 'WEB, Browser: In your plan' },
                {
                  format: 'AR',
                  state: 'pub',
                  words: 'AR, Augmented reality: Published, not in your plan',
                },
                { format: 'VR', state: 'none', words: 'VR, Virtual reality: Not published' },
              ]}
            />
          }
        />
        <IaFormSurface
          labelledBy="f-h"
          actions={
            <IaActions>
              <IaBusyButton variant="primary" size="lg" busy busyLabel="Adding…">
                Add student
              </IaBusyButton>
            </IaActions>
          }
        >
          <h2 id="f-h">Add a student</h2>
          <IaFieldGrid two>
            <IaStack tight>
              <IaRow>
                <IaFormatBadges formats={['WEB']} state="pub" />
              </IaRow>
            </IaStack>
          </IaFieldGrid>
        </IaFormSurface>
      </main>,
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);

    const { container: message } = inRoot(
      <main>
        <IaMessageCard
          icon="pauseCircle"
          title="Paused"
          actions={<TextLink href="/h">Help</TextLink>}
        >
          Your work is kept.
        </IaMessageCard>
      </main>,
    );
    expectV3ClassesOnly(message);
    await assertNoAxeViolations(message);
  });
});

describe('the export’s inline sizes, as the central patch’s classes (V3P-16)', () => {
  it('a field at the width the export gives it: IA-05 “Course” 520 px, IA-17 licences 320 px', () => {
    const { container } = inRoot(
      <>
        <IaField id="gv-course" width="select" label="Course">
          <Select
            options={[{ value: 'me', label: 'ME ZG523 — Thermodynamics & Heat Transfer' }]}
            value="me"
            onChange={() => undefined}
          />
        </IaField>
        <IaField id="rq-lic" width="count" label="Licences requested" hint="As a whole number.">
          <TextInput inputMode="numeric" />
        </IaField>
      </>,
    );
    expect(TEMPLATE).toContain(
      '<div class="rk-field" style="max-width: 520px">\n                  <label class="rk-label" for="gv-course">Course</label>',
    );
    expect(TEMPLATE).toContain(
      '<div class="rk-field" style="max-width: 320px">\n              <label class="rk-label" for="rq-lic">Licences requested</label>',
    );
    const [course, licences] = container.querySelectorAll('div.rk-field');
    expect(course!.className).toBe('rk-field rk-x-field-select');
    expect(licences!.className).toBe('rk-field rk-x-field-count');
    expect(screen.getByRole('combobox', { name: 'Course' })).toHaveAttribute('id', 'gv-course');
    expect(screen.getByRole('textbox', { name: 'Licences requested' })).toHaveAccessibleDescription(
      'As a whole number.',
    );
    expectV3ClassesOnly(container);
  });

  it('a centred row of buttons (IA-05 “No students yet”), as the export draws it', () => {
    const { container } = inRoot(
      <IaRow center>
        <ButtonLink href="/institute/people/add">Add student</ButtonLink>
        <ButtonLink href="/institute/people/import">Import students</ButtonLink>
      </IaRow>,
    );
    const drawn = excerpt('<div class="ia-row" style="justify-content: center">', '</div>');
    expect(iaPatchedMarkup(drawn)).toContain('<div class="ia-row rk-x-row-center">');
    expect(container.querySelector('div.ia-row')!.className).toBe('ia-row rk-x-row-center');
    expect(inRoot(<IaRow>x</IaRow>).container.querySelector('div.ia-row')!.className).toBe(
      'ia-row',
    );
  });

  it('a group’s name that wraps in a value (IA-07 “About”: `a.rb-link.ia-wrap` in `span.ia-block`)', async () => {
    const { container } = inRoot(
      <dl className="ia-sum">
        <div>
          <dt>Group</dt>
          <dd>
            <IaBlock>
              <IaWrapLink href="/institute/people/groups/g-1">ME ZG523 — Sem II</IaWrapLink>
            </IaBlock>
          </dd>
        </div>
      </dl>,
    );
    expect(TEMPLATE).toContain(
      '<span class="ia-block"><a class="rb-link ia-wrap" href="{{ g.href }}" onClick="{{ g.go }}">{{ g.name }}</a></span>',
    );
    expectSameMarkup(
      container.querySelector('span.ia-block')!,
      '<span class="ia-block"><a class="rb-link ia-wrap" href="/institute/people/groups/g-1">ME ZG523 — Sem II</a></span>',
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});
