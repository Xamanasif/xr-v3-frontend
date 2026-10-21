/**
 * What only the Institute Admin's People screens draw (owner-approved export
 * design/v3-refined-b/roles/IA-v1, `project/Main.dc.html` IA-06, IA-08, IA-09, IA-10, IA-11,
 * IA-13, IA-15; `project/ia-role.css`): the People tabs, the students' roster, the People list
 * tables, a course a person teaches, the assign panel, the fieldset and the import's pieces. Each
 * is rendered with sample values and compared with the export's template filled the way its script
 * fills it (`sc-for`, `sc-if`, `{{ … }}`, the sprite inlined from its own symbols); then the
 * behaviour (whole-row links, the chooser), the class contract, the accessibility checks and no
 * internal reference anywhere a piece draws.
 *
 * Normalised on both sides, each for a recorded reason: the explicit table roles the kit adds to
 * tables that reflow on phones (ADR-0010); a select's `value` and its option's `selected`, the
 * same state written two ways; an `aria-invalid="false"`, which is no state; the export's inline
 * sizes, written as the central patch's classes the kit emits in their place (V3P-16,
 * `iaPatchedMarkup`); and the order of class tokens.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectNoInternalReferences,
  expectV3ClassesOnly,
  iaExportText,
  iaPatchedMarkup,
  v3Canonical,
} from '../testing/index.js';
import { Button } from './actions.js';
import { IaCellLine, IaCellText, IaFormatBadges } from './ia.js';
import {
  IaAssignPanel,
  IaCourseLine,
  IaCoursesTaughtTable,
  IaFacultyCoursesTable,
  IaFacultyTable,
  IaFieldset,
  IaFileChooser,
  IaGroupsTable,
  IaImportAdded,
  IaImportLead,
  IaImportChecked,
  IaImportFailed,
  IaImportProblems,
  IaImportSurface,
  IaImportTemplate,
  IaPeopleTabs,
  IaRoster,
} from './ia-people.js';
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

/** `{{ name }}` replaced; an attribute bound to nothing (`aria-current="{{ t.cur }}"`) dropped. */
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
 * preview's wiring (event bindings) and empty `class=""` dropped; sprites inlined.
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
    .replace(/ class=""/g, '')
    .replace(/<use href="#((?:rki|rbi)-[\w-]+)"><\/use>/g, (whole, id: string) => {
      const path = SYMBOLS.get(id);
      return path ? `<path d="${path}"></path>` : whole;
    });
}

/** The template from the line that starts with `start` to the end of the element it opens. */
function excerpt(start: string, end: string, from = 0): string {
  const at = TEMPLATE.indexOf(start, from);
  expect(at, `the export draws ${start}`).toBeGreaterThanOrEqual(0);
  const to = TEMPLATE.indexOf(end, at);
  expect(to, `the export closes ${start} with ${end}`).toBeGreaterThan(at);
  return TEMPLATE.slice(at, to + end.length);
}

/** Where a screen's section of the template starts (its route flag). */
const section = (flag: string) => TEMPLATE.indexOf(`<sc-if value="{{ R.${flag} }}"`);

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
    .replace(/ aria-invalid="false"/g, '')
    .replace(/(<select[^>]*?) value="[^"]*"/g, '$1');
}

function expectSameMarkup(element: Element, expected: string) {
  expect(comparable(element.outerHTML)).toBe(comparable(expected));
}

/** Rendered inside a V3 root, as the shell renders the pages. */
function inRoot(ui: React.ReactNode) {
  return render(<div className="xr rb">{ui}</div>);
}

// ---- the People tabs ------------------------------------------------------------------------

describe('the People tabs are the export’s `ia-tabs`', () => {
  const TABS = [
    { label: 'Students', href: '/people', cur: 'page', hasN: true, n: 12, nText: '12 students' },
    { label: 'Faculty', href: '/people?tab=faculty', hasN: true, n: 3, nText: '3 faculty members' },
    { label: 'Groups', href: '/people?tab=groups', hasN: true, n: 2, nText: '2 groups' },
    { label: 'Faculty courses', href: '/people?tab=faculty-courses', hasN: false },
  ];

  it('draws the links, the current one, the counts hidden and their words read', async () => {
    const { container } = inRoot(
      <IaPeopleTabs
        label="People"
        tabs={TABS.map((tab) => ({
          label: tab.label,
          href: tab.href,
          current: tab.cur === 'page',
          count: tab.hasN ? { value: tab.n!, words: `, ${tab.nText!}` } : null,
        }))}
      />,
    );
    const nav = screen.getByRole('navigation', { name: 'People' });
    expectSameMarkup(
      nav,
      fill(excerpt('<nav class="ia-tabs" aria-label="People">', '</nav>'), {
        V: { PH: { tabs: TABS } },
      }),
    );
    expect(screen.getByRole('link', { name: 'Students, 12 students' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('refuses two current tabs', () => {
    expect(() =>
      render(
        <IaPeopleTabs
          label="People"
          tabs={[
            { label: 'Students', href: '/a', current: true },
            { label: 'Faculty', href: '/b', current: true },
          ]}
        />,
      ),
    ).toThrow('at most one tab is current');
  });
});

// ---- the students' roster -------------------------------------------------------------------

describe('the students’ roster is the export’s `ia-rt`', () => {
  const ROWS = [
    {
      n: 'Ananya Das',
      id: 'GIT-2026-0440',
      email: 'ananya.das@godavari.edu.in',
      idLine: 'GIT-2026-0440 · ananya.das@godavari.edu.in',
      href: '/people/students/per-0013',
      aria: 'Open student record: Ananya Das',
      grpLab: '',
      grpText: 'No group',
      course: 'ME ZG523',
      stCls: 'xr-st',
      stLabel: 'No access yet',
      hasExpText: false,
      canGive: true,
      give: { href: '/give?student=per-0013' },
      giveAria: 'Give Ananya Das access',
    },
    {
      n: 'Divya Menon',
      id: 'GIT-2026-0411',
      email: 'divya.menon@godavari.edu.in',
      idLine: 'GIT-2026-0411 · divya.menon@godavari.edu.in',
      href: '/people/students/per-0007',
      aria: 'Open student record: Divya Menon',
      grpLab: 'Group: ',
      grpText: 'ME ZG523 — Sem II',
      course: 'ME ZG523',
      stCls: 'xr-st xr-st--ok',
      stLabel: 'Access active',
      hasExpText: true,
      expText: 'Shell-and-Tube Heat Exchanger',
      canGive: false,
    },
  ];

  function roster() {
    return (
      <IaRoster
        caption="Students at your institution"
        headers={{ student: 'Student', group: 'Group', access: 'Access', action: 'Action' }}
        rows={ROWS.map((row) => ({
          key: row.id,
          name: row.n,
          href: row.href,
          accessibleName: row.aria,
          studentId: row.id,
          email: row.email,
          groupLabel: row.grpLab,
          groups: row.grpText,
          course: row.course,
          status: (
            <StatusPill tone={row.stCls === 'xr-st' ? 'neutral' : 'ok'}>{row.stLabel}</StatusPill>
          ),
          experiments: row.hasExpText
            ? { srLabel: 'Experiments given: ', text: row.expText }
            : null,
          give: row.canGive
            ? { label: 'Give access', href: row.give!.href, accessibleName: row.giveAria! }
            : null,
        }))}
      />
    );
  }

  it('draws the table, each row and its cells as the export does', async () => {
    const { container } = inRoot(roster());
    const table = screen.getByRole('table', { name: 'Students at your institution' });
    const drawn = excerpt('<table class="ia-rt">', '</table>', section('rIA06'));
    expectSameMarkup(table, fill(drawn, { V: { rowsR: ROWS } }));
    expectV3ClassesOnly(container);
    expectNoInternalReferences(container);
    await assertNoAxeViolations(container);
  });

  it('a press anywhere on a row follows its link, not a press on its own action', () => {
    inRoot(roster());
    const link = screen.getByRole('link', { name: 'Open student record: Ananya Das' });
    const followed = vi.fn((event: Event) => event.preventDefault());
    link.addEventListener('click', followed);
    const row = link.closest('tr')!;
    fireEvent.click(row.querySelector('.ia-rt-grp')!);
    expect(followed).toHaveBeenCalledTimes(1);
    const give = within(row).getByRole('link', { name: 'Give Ananya Das access' });
    give.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(give);
    expect(followed).toHaveBeenCalledTimes(1);
  });
});

// ---- the People list tables -----------------------------------------------------------------

describe('the People lists are the export’s list tables', () => {
  it('IA-08 Faculty (`ia-lt--fac`): the whole row opens the record', async () => {
    const F = [
      {
        n: 'Dr S. Ranganathan',
        email: 's.ranganathan@godavari.edu.in',
        href: '/people/faculty/per-0014',
        aria: 'Open faculty record: Dr S. Ranganathan',
        courses: [{ code: 'ME ZG523', name: 'Thermodynamics & Heat Transfer' }],
        noCourses: false,
        stCls: 'xr-st xr-st--ok',
        stLabel: 'Active',
      },
      {
        n: 'Prof. Ravi Shankar',
        email: 'ravi.shankar@godavari.edu.in',
        href: '/people/faculty/per-0016',
        aria: 'Open faculty record: Prof. Ravi Shankar',
        courses: [],
        noCourses: true,
        stCls: 'xr-st rk-st-ended',
        stLabel: 'Inactive',
      },
    ];
    const { container } = inRoot(
      <IaFacultyTable
        caption="Faculty at your institution and the courses they teach"
        headers={{ member: 'Faculty member', courses: 'Courses taught', status: 'Status' }}
        rows={F.map((row) => ({
          key: row.href,
          name: row.n,
          href: row.href,
          accessibleName: row.aria,
          email: row.email,
          courses: row.noCourses ? (
            <IaCellText kind="muted">No courses yet</IaCellText>
          ) : (
            row.courses.map((course) => (
              <IaCourseLine key={course.code} code={course.code} name={course.name} />
            ))
          ),
          status: <StatusPill tone={row.noCourses ? 'ended' : 'ok'}>{row.stLabel}</StatusPill>,
        }))}
      />,
    );
    const wrap = container.querySelector('.ia-ltwrap')!;
    // The export's `td.ia-fac-courses` names a class its sheet never styles: the kit leaves it out.
    expectSameMarkup(
      wrap,
      fill(excerpt('<div class="ia-ltwrap">', '</table>\n            </div>', section('rIA08')), {
        V: { rows: F },
      }).replaceAll('<td class="ia-fac-courses">', '<td>'),
    );
    const link = screen.getByRole('link', { name: 'Open faculty record: Prof. Ravi Shankar' });
    const followed = vi.fn((event: Event) => event.preventDefault());
    link.addEventListener('click', followed);
    fireEvent.click(link.closest('tr')!.querySelector('.ia-lt-pri')!);
    expect(followed).toHaveBeenCalledTimes(1);
    expectV3ClassesOnly(container);
    expectNoInternalReferences(container);
    await assertNoAxeViolations(container);
  });

  it('IA-13 Groups (`ia-lt--grp`): named by its name, the experiments with their formats', async () => {
    const G = [
      {
        name: 'ME ZG523 — Sem II',
        href: '/people/groups/x',
        aria: 'Open group ME ZG523 — Sem II',
        members: '7 members',
        exps: [
          {
            t: 'Shell-and-Tube Heat Exchanger',
            fmAria: 'Formats from your plan: WEB, VR',
            fmts: [{ code: 'WEB' }, { code: 'VR' }],
          },
        ],
        noExp: false,
      },
      {
        name: 'Lab batch B',
        href: '/people/groups/y',
        aria: 'Open group Lab batch B',
        members: 'No members yet',
        exps: [],
        noExp: true,
      },
    ];
    const { container } = inRoot(
      <IaGroupsTable
        caption="Groups at your institution"
        headers={{ group: 'Group', members: 'Members', given: 'Experiments given to the group' }}
        givenLabel="Experiments given"
        rows={G.map((row) => ({
          key: row.href,
          name: row.name,
          href: row.href,
          accessibleName: row.aria,
          members: row.members,
          given: row.noExp ? (
            <IaCellText kind="muted">None yet</IaCellText>
          ) : (
            row.exps.map((exp) => (
              <IaCellLine key={exp.t} kind="exp">
                <IaCellText kind="text">{exp.t}</IaCellText>
                <IaFormatBadges formats={['WEB', 'VR']} label={exp.fmAria} />
              </IaCellLine>
            ))
          ),
        }))}
      />,
    );
    const wrap = container.querySelector('.ia-ltwrap')!;
    expectSameMarkup(
      wrap,
      fill(excerpt('<div class="ia-ltwrap">', '</table>\n            </div>', section('rIA13')), {
        V: { rows: G },
      }),
    );
    expectV3ClassesOnly(container);
    expectNoInternalReferences(container);
    await assertNoAxeViolations(container);
  });

  it('IA-15 Faculty courses (`ia-lt--fc`): course chips with their quiet Remove…, the row’s action', async () => {
    const remove = vi.fn();
    const R = [
      {
        n: 'Dr S. Ranganathan',
        email: 's.ranganathan@godavari.edu.in',
        link: { href: '/people/faculty/per-0014' },
        courses: [
          {
            code: 'ME ZG523',
            name: 'Thermodynamics & Heat Transfer',
            canRm: true,
            rmId: 'fc-rm-1',
            rmAria: 'Remove ME ZG523 from Dr S. Ranganathan',
          },
        ],
        noCourses: false,
        stCls: 'xr-st xr-st--ok',
        stLabel: 'Active',
        canPick: true,
        pickAria: 'Assign a course to Dr S. Ranganathan',
      },
    ];
    const { container } = inRoot(
      <IaFacultyCoursesTable
        caption="Who teaches which course"
        headers={{
          member: 'Faculty member',
          courses: 'Courses taught',
          status: 'Status',
          action: 'Action',
        }}
        rows={R.map((row) => ({
          key: row.n,
          name: row.n,
          href: row.link.href,
          email: row.email,
          courses: row.courses.map((course) => (
            <IaCourseLine
              key={course.code}
              code={course.code}
              name={course.name}
              nameAsTitle
              remove={{
                id: course.rmId,
                label: 'Remove…',
                accessibleName: course.rmAria,
                onClick: remove,
              }}
            />
          )),
          status: <StatusPill tone="ok">{row.stLabel}</StatusPill>,
          action: (
            <Button variant="ghost" aria-label={row.pickAria}>
              Assign a course
            </Button>
          ),
        }))}
      />,
    );
    const wrap = container.querySelector('.ia-ltwrap')!;
    expectSameMarkup(
      wrap,
      fill(
        excerpt('<div class="ia-ltwrap">', '</table>\n                  </div>', section('rIA15')),
        {
          V: { rows: R },
        },
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove ME ZG523 from Dr S. Ranganathan' }));
    expect(remove).toHaveBeenCalledTimes(1);
    // The row holds controls of its own, so it is not a whole-row link.
    expect(container.querySelector('tbody tr')).not.toHaveClass('is-link');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('IA-09 Courses taught (`ia-lt--fr`): the course, the institution’s code, when and by whom', async () => {
    const C = [
      {
        code: 'ME ZG523',
        name: 'Thermodynamics & Heat Transfer',
        hasOwn: true,
        own: 'MEC-523',
        when: '9 Oct 2026 · Meera Iyer',
        canRm: true,
        rmId: 'fr-rm-1',
        rmAria: 'Remove ME ZG523 from Dr S. Ranganathan',
      },
    ];
    const { container } = inRoot(
      <IaCoursesTaughtTable
        caption="Courses taught by Dr S. Ranganathan"
        headers={{ course: 'Course', assigned: 'Assigned', action: 'Action' }}
        rows={C.map((row) => ({
          key: row.code,
          code: row.code,
          name: row.name,
          own: `Your course code ${row.own}`,
          assigned: row.when,
          action: (
            <Button variant="ghost" id={row.rmId} aria-label={row.rmAria}>
              Remove…
            </Button>
          ),
        }))}
      />,
    );
    const wrap = container.querySelector('.ia-ltwrap')!;
    expectSameMarkup(
      wrap,
      fill(excerpt('<div class="ia-ltwrap">', '</table>\n          </div>', section('rIA09')), {
        V: { n: 'Dr S. Ranganathan', courses: C },
      }),
    );
    expectV3ClassesOnly(container);
    expectNoInternalReferences(container);
    await assertNoAxeViolations(container);
  });
});

// ---- the assign panel -----------------------------------------------------------------------

describe('the assign panel is the export’s `ia-fcform`', () => {
  const OPTIONS_WHO = [
    { v: '', t: 'Choose a faculty member' },
    { v: 'f0', t: 'Dr S. Ranganathan' },
  ];
  const OPTIONS_COURSE = [
    { v: '', t: 'Choose a course' },
    { v: 'c0', t: 'ME ZG523 — Thermodynamics & Heat Transfer' },
  ];

  function panel(error: boolean, onAssign = vi.fn()) {
    return (
      <IaAssignPanel
        title="Assign a course"
        titleId="fc-as-h"
        form={{
          faculty: {
            id: 'fc-who',
            label: 'Faculty member',
            hint: 'Active faculty members only',
            options: OPTIONS_WHO.map((o) => ({ value: o.v, label: o.t })),
            value: '',
            invalid: error,
            onChange: () => undefined,
          },
          course: {
            id: 'fc-course',
            label: 'Course',
            hint: 'Courses in your content access',
            options: OPTIONS_COURSE.map((o) => ({ value: o.v, label: o.t })),
            value: '',
            onChange: () => undefined,
          },
          submit: { id: 'fc-assign', label: 'Assign course', onClick: onAssign },
          error: error ? { id: 'fc-err', text: 'Choose a faculty member' } : null,
          note: 'The course appears in that person’s Faculty workspace. It doesn’t give students anything.',
        }}
      />
    );
  }

  it('draws the two fields, the button, the one error and the note', async () => {
    const onAssign = vi.fn();
    const { container } = inRoot(panel(true, onAssign));
    const drawn = excerpt('<section class="rk-surface ia-fcform"', '</section>');
    expectSameMarkup(
      container.querySelector('section')!,
      fill(drawn, {
        S: { pvNotes: false },
        V: {
          canAssign: true,
          whoOpts: OPTIONS_WHO,
          courseOpts: OPTIONS_COURSE,
          whoDesc: 'fc-who-h fc-err',
          whoInv: 'true',
          courseDesc: 'fc-course-h',
          courseInv: 'false',
          hasErr: true,
          err: 'Choose a faculty member',
        },
      }),
    );
    const who = screen.getByRole('combobox', { name: 'Faculty member' });
    expect(who).toHaveAccessibleDescription('Active faculty members only Choose a faculty member');
    expect(who).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a faculty member');
    fireEvent.click(screen.getByRole('button', { name: 'Assign course' }));
    expect(onAssign).toHaveBeenCalledTimes(1);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('says why nothing can be assigned, with no field', () => {
    const { container } = inRoot(
      <IaAssignPanel
        title="Assign a course"
        titleId="fc-as-h"
        form={{
          unavailable: 'Assigning is unavailable while your institution’s access is paused.',
        }}
      />,
    );
    expect(screen.getByRole('region', { name: 'Assign a course' })).toHaveTextContent(
      'Assign a courseAssigning is unavailable while your institution’s access is paused.',
    );
    expect(container.querySelector('p.rk-next')).not.toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
    expectV3ClassesOnly(container);
  });

  it('busy: the press is ignored and the button says what is happening', () => {
    const onAssign = vi.fn();
    inRoot(
      <IaAssignPanel
        title="Assign a course"
        titleId="fc-as-h"
        form={{
          faculty: {
            id: 'fc-who',
            label: 'Faculty member',
            hint: 'h',
            options: [],
            value: '',
            onChange: () => undefined,
          },
          course: {
            id: 'fc-course',
            label: 'Course',
            hint: 'h',
            options: [],
            value: '',
            onChange: () => undefined,
          },
          submit: {
            label: 'Assign course',
            busy: true,
            busyLabel: 'Assigning…',
            onClick: onAssign,
          },
          note: 'n',
        }}
      />,
    );
    const button = screen.getByRole('button', { name: 'Assigning…' });
    expect(button).toHaveClass('ia-btn--busy');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(button);
    expect(onAssign).not.toHaveBeenCalled();
  });
});

// ---- IA-10 a fieldset -----------------------------------------------------------------------

describe('a group of fields is the kit’s `rk-fieldset`', () => {
  it('names the group by its legend', () => {
    const { container } = inRoot(
      <IaFieldset legend="Who they are">
        <span>fields</span>
      </IaFieldset>,
    );
    expect(screen.getByRole('group', { name: 'Who they are' })).toHaveClass('rk-fieldset');
    expectV3ClassesOnly(container);
  });
});

// ---- IA-11 the import -----------------------------------------------------------------------

describe('the import’s pieces are the export’s', () => {
  const COLUMNS = ['student_id', 'full_name', 'email', 'programme', 'course', 'course_code'];
  const HREF =
    'data:text/csv;charset=utf-8,student_id%2Cfull_name%2Cemail%2Cprogramme%2Ccourse%2Ccourse_code%0A';

  it('step 1’s template: the line, the columns and the download', async () => {
    const line =
      'One row per student. Every column is required: the student’s details (student_id, full_name, email), their programme, the course and its course_code — the BITS code (for example ME ZG523) or your institution’s code (MEC-523).';
    const { container } = inRoot(
      <IaImportTemplate
        title="Use the template"
        line={line}
        columnsLabel="Required columns"
        columns={COLUMNS}
        download={{
          href: HREF,
          fileName: 'students-template.csv',
          label: 'Download the template (CSV)',
        }}
      />,
    );
    const drawn = excerpt(
      '<div class="ia-stack ia-stack--tight">\n              <h2 class="rk-h3">Use the template</h2>',
      '</p>\n            </div>',
    );
    expectSameMarkup(
      container.querySelector('.ia-stack')!,
      fill(drawn, { V: { exCode: 'ME ZG523', exOwn: ' or your institution’s code (MEC-523)' } }),
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('the file chooser: its group, the chosen file, the button that opens the browser’s chooser, the words under it', async () => {
    const onChange = vi.fn();
    const { container, rerender } = inRoot(
      <IaFileChooser
        label="File to import"
        labelId="im-file-l"
        file={null}
        noFile="No file chosen"
        statusId="im-status"
        button={{ id: 'im-choose', label: 'Choose a CSV file' }}
        input={{ id: 'im-file', accept: '.csv,text/csv', onChange }}
        error={{ id: 'im-err', text: 'Choose a CSV file first' }}
      />,
    );
    const group = screen.getByRole('group', { name: 'File to import' });
    expect(group).toHaveClass('ia-file');
    expect(group.querySelector('.ia-file-name.is-none')).toHaveTextContent('No file chosen');
    const button = screen.getByRole('button', { name: 'Choose a CSV file' });
    expect(button).toHaveClass('rb-btn');
    expect(button).toHaveAccessibleDescription('No file chosen Choose a CSV file first');
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('rk-ferr');
    expect(alert).toHaveAttribute('id', 'im-err');
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input).toHaveAttribute('accept', '.csv,text/csv');
    expect(input).toHaveAttribute('tabindex', '-1');
    const opened = vi.spyOn(input, 'click').mockImplementation(() => undefined);
    fireEvent.click(button);
    expect(opened).toHaveBeenCalledTimes(1);
    // The export's own markup for the row's parts, the chosen file named.
    rerender(
      <div className="xr rb">
        <IaFileChooser
          label="File to import"
          labelId="im-file-l"
          file={{ name: 'godavari.csv', detail: '13 rows' }}
          noFile="No file chosen"
          statusId="im-status"
          button={{ id: 'im-choose', label: 'Choose another file' }}
          input={{ id: 'im-file', accept: '.csv,text/csv', onChange }}
        />
      </div>,
    );
    const chosen = screen.getByRole('group', { name: 'File to import' });
    expect(chosen.querySelector('.ia-file-name')).toHaveTextContent('godavari.csv13 rows');
    expect(chosen.querySelector('.ia-file-name .rk-small')).toHaveTextContent('13 rows');
    expect(screen.getByRole('button', { name: 'Choose another file' })).toHaveAccessibleDescription(
      'godavari.csv13 rows',
    );
    expect(screen.queryByRole('alert')).toBeNull();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('step 2: the file and the counts on one line, then the rows to fix', async () => {
    const P = [
      {
        row: 6,
        who: 'Imran S.',
        id: 'GIT-2026-0409',
        msg: 'Student ID GIT-2026-0409 is also in row 3. Each student needs a different ID.',
      },
    ];
    const { container } = inRoot(
      <IaImportSurface labelledBy="ia-h1">
        <IaImportChecked
          fileName="godavari-me-zg523.csv"
          summary="13 rows checked · 9 ready to import · 4 rows with errors"
        />
        <IaImportProblems
          title="Rows that need attention"
          note="Row numbers count from the first student row, after the header."
          caption="Rows that need attention. Row numbers count from the first student row, after the header."
          headers={{ row: 'Row', student: 'Student', fix: 'What to fix', type: 'Type' }}
          rows={P.map((p) => ({
            key: String(p.row),
            row: `Row ${p.row}`,
            who: p.who,
            studentId: p.id,
            message: p.msg,
            type: <StatusPill tone="err">Error — blocks import</StatusPill>,
          }))}
        />
      </IaImportSurface>,
    );
    const surface = container.querySelector('section.rk-surface.ia-form')!;
    expectSameMarkup(
      surface.querySelector('.ia-row')!,
      fill(excerpt('<div class="ia-row"><span class="rk-code rk-code--plain">', '</div>'), {
        V: {
          file: 'godavari-me-zg523.csv',
          sumText: '13 rows checked · 9 ready to import · 4 rows with errors',
        },
      }),
    );
    expectSameMarkup(
      surface.querySelector('.ia-shead')!,
      fill(excerpt('<div class="ia-shead ia-shead--line">', '</div>', section('rIA11')), {}),
    );
    expectSameMarkup(
      surface.querySelector('.ia-ltwrap')!,
      fill(excerpt('<div class="ia-ltwrap">', '</table>\n          </div>', section('rIA11')), {
        V: { problems: P },
      }),
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('step 3’s failure and the result’s list of who was added', async () => {
    const { container } = inRoot(
      <>
        <IaImportFailed
          id="im-fail"
          title="The import didn’t finish"
          line="Nothing was added. Try again."
        />
        <IaImportAdded title="Added" names="Rahul Verma and Priya Natarajan." />
        <IaImportLead>13 students will be added from students-oct.csv</IaImportLead>
      </>,
    );
    // Step 3's lead line in the export's larger navy type (`rk-x-next-lead`, V3P-16).
    expectSameMarkup(
      container.firstElementChild!.lastElementChild!,
      fill(excerpt('<p class="rk-next" style="font-size: 17px', '</p>'), {
        V: { willText: '13 students will be added from students-oct.csv' },
      }),
    );
    expectSameMarkup(
      container.querySelector('.rk-errsum')!,
      fill(
        excerpt('<div class="rk-errsum" id="im-fail"', '</div>').replace(
          /<sc-if value="\{\{ V\.hasFail \}\}"[^>]*>/,
          '',
        ),
        {},
      ),
    );
    const failed = screen.getByRole('alert');
    expect(failed).toHaveAttribute('tabindex', '-1');
    expectSameMarkup(
      container.querySelector('.ia-stack')!,
      fill(
        excerpt('<div class="ia-stack ia-stack--tight"><h2 class="rk-h3">Added</h2>', '</div>'),
        { V: { names: 'Rahul Verma and Priya Natarajan.' } },
      ),
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});
