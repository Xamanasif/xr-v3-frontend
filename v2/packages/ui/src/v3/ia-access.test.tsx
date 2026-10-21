/**
 * What only the Institute Admin's access screens draw (owner-approved export
 * design/v3-refined-b/roles/IA-v1, `project/Main.dc.html` IA-04, IA-05, IA-07 and IA-14): the pick
 * list, the pick search, step 1's experiments and the ones not in the plan, the selection (folded
 * and beside the steps), Give students access's frame, the group review line, the result list,
 * a group's grant items and the add panel. Each is rendered with sample values and
 * compared with the export's template filled the way its script fills it; then the behaviour, the
 * class contract, the accessibility checks and no internal reference anywhere a piece draws.
 *
 * Normalised on both sides, each for a recorded reason: the export's inline sizes, written as the
 * central patch's classes the kit emits in their place (V3P-16, `iaPatchedMarkup`); the order of
 * class tokens; an id the product gives a fieldset or a list as an error summary's link target;
 * and the `tabindex="-1"` the add panel's heading carries as the focus target when the panel
 * opens.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
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
import { IaActions, IaFormatBadges } from './ia.js';
import {
  IaAddPanel,
  IaExperimentChoices,
  IaFormatsWith,
  IaGiveLayout,
  IaGivenList,
  IaGrantItems,
  IaGroupFlow,
  type IaPickItem,
  IaPickList,
  IaPickSearch,
  IaSelectionFold,
  IaSelectionPanel,
  IaNotInPlanList,
  IaStepPart,
} from './ia-access.js';
import { V3_ICON_PATHS } from './icons.js';

const MAIN = iaExportText('Main.dc.html');
const TEMPLATE = MAIN.slice(0, MAIN.indexOf('<script type="text/x-dc"'));

/** The export's sprite (`rki-*`), by id. */
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

/** `{{ name }}` replaced; an attribute bound to nothing (`checked="{{ p.checked }}"`) dropped. */
function substitute(html: string, scope: Scope): string {
  return html
    .replace(/ ([\w-]+)="\{\{ ([\w.]+) \}\}"/g, (whole, name: string, path: string) => {
      const value = lookup(scope, path);
      return value === undefined || value === null ? '' : ` ${name}="${String(value)}"`;
    })
    .replace(/\{\{ ([\w.]+) \}\}/g, (_whole, path: string) => String(lookup(scope, path) ?? ''));
}

/** An excerpt of the template filled as its runtime fills it (`sc-for`, `sc-if`, `{{ … }}`). */
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

/** The template from `start` to the end of the element it opens (`end`, after `start`). */
function excerpt(start: string, end: string, after = 0): string {
  const from = TEMPLATE.indexOf(start, after);
  expect(from, `the export draws ${start}`).toBeGreaterThanOrEqual(0);
  const to = TEMPLATE.indexOf(end, from);
  expect(to, `the export closes ${start} with ${end}`).toBeGreaterThan(from);
  return TEMPLATE.slice(from, to + end.length);
}

/** Where a screen's section starts in the template (`R.rIA05`, …). */
const at = (route: string) => TEMPLATE.indexOf(`{{ R.${route} }}`);

/** The recorded normalisations (see the file's head). */
function comparable(html: string): string {
  return v3Canonical(iaPatchedMarkup(html)).replace(
    / class="([^"]*)"/g,
    (_whole, value: string) => {
      return ` class="${value.split(/\s+/).filter(Boolean).sort().join(' ')}"`;
    },
  );
}

function expectSameMarkup(element: Element, expected: string) {
  expect(comparable(element.outerHTML)).toBe(comparable(expected));
}

/** Rendered inside a V3 root, as the shell renders the pages. */
function inRoot(ui: ReactNode) {
  return render(<div className="xr rb">{ui}</div>);
}

/** Every internal record reference this role keeps out of its words (identifier rule). */
const IA_REFERENCE = /\b(?:REQ|ACC|SACC|GRP|FMAP|UPD|DTR|SUP|SUB)-\d+/;

function expectNoIaReferences(root: Element) {
  expectNoInternalReferences(root);
  const named = [root, ...root.querySelectorAll('*')].flatMap((element) =>
    ['aria-label', 'title', 'placeholder', 'value'].map((name) => element.getAttribute(name) ?? ''),
  );
  expect([root.textContent ?? '', ...named].filter((text) => IA_REFERENCE.test(text))).toEqual([]);
}

const pathOf = (element: Element | null) => element?.querySelector('path')?.getAttribute('d');

describe('the pick list (`ul.ia-pick`)', () => {
  const STUDENTS = [
    { cid: 'gv-s-1', n: 'Ananya Das', sub: 'GIT-2026-0440', rowCls: 'ia-pick-row' },
    {
      cid: 'gv-s-2',
      n: 'Arun Kumar',
      sub: 'GIT-2026-0377 · ME ZG523 — Sem II',
      rowCls: 'ia-pick-row',
      hasWhy: true,
      why: 'Already has Shell-and-Tube Heat Exchanger',
    },
  ];
  const items = (onChange = () => undefined): IaPickItem[] =>
    STUDENTS.map((student) => ({
      key: student.cid,
      inputId: student.cid,
      name: student.n,
      detail: student.sub,
      why: student.why,
      checked: false,
      onChange,
    }));

  it('IA-05 step 2’s students: the export’s rows, the reason on the right', async () => {
    const { container } = inRoot(<IaPickList label="Students" items={items()} />);
    const list = container.querySelector('ul.ia-pick')!;
    expectSameMarkup(
      list,
      fill(excerpt('<ul class="ia-pick" aria-label="Students">', '</ul>', at('rIA05')), {
        V: { stus: STUDENTS },
      }),
    );
    expectV3ClassesOnly(container);
    expectNoIaReferences(container);
    await assertNoAxeViolations(container);
  });

  it('an unavailable row is muted and its input disabled; a press on a row toggles its input', () => {
    const onChange = vi.fn();
    render(
      <IaPickList
        label="Students"
        id="give-access-students"
        items={[
          { ...items(onChange)[0]!, checked: true },
          { ...items(onChange)[1]!, disabled: true },
        ]}
      />,
    );
    const list = screen.getByRole('list', { name: 'Students' });
    expect(list).toHaveAttribute('id', 'give-access-students');
    const [first, second] = within(list).getAllByRole('checkbox');
    expect(first).toBeChecked();
    expect(second).toBeDisabled();
    expect(second!.closest('label')).toHaveClass('ia-pick-row', 'is-off');
    expect(screen.getByRole('checkbox', { name: /Ananya Das/ })).toBe(first);
    fireEvent.click(first!);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('IA-05’s groups are radios of one name; IA-14’s candidates are the same rows', () => {
    const GROUPS = [
      { cid: 'gv-g-1', n: 'ME ZG523 — Sem II', sub: '7 members', rowCls: 'ia-pick-row' },
    ];
    const { container, unmount } = inRoot(
      <IaPickList
        label="Groups"
        kind="radio"
        name="gv-grp"
        items={GROUPS.map((group) => ({
          key: group.cid,
          inputId: group.cid,
          name: group.n,
          detail: group.sub,
          checked: false,
          onChange: () => undefined,
        }))}
      />,
    );
    expectSameMarkup(
      container.querySelector('ul.ia-pick')!,
      fill(excerpt('<ul class="ia-pick" aria-label="Groups">', '</ul>', at('rIA05')), {
        V: { grps: GROUPS },
      }),
    );
    unmount();
    const CANDIDATES = [
      { cid: 'gd-c-1', n: 'Vikram Joshi', sub: 'GIT-2026-0426', rowCls: 'ia-pick-row' },
      {
        cid: 'gd-c-2',
        n: 'Sneha Reddy',
        sub: 'GIT-2026-0352',
        rowCls: 'ia-pick-row',
        hasWhy: true,
        why: 'Inactive',
      },
    ];
    const second = inRoot(
      <IaPickList
        label="Students who aren’t in this group"
        items={CANDIDATES.map((student) => ({
          key: student.cid,
          inputId: student.cid,
          name: student.n,
          detail: student.sub,
          why: student.why,
          checked: false,
          onChange: () => undefined,
        }))}
      />,
    );
    expectSameMarkup(
      second.container.querySelector('ul.ia-pick')!,
      fill(
        excerpt('<ul class="ia-pick" aria-label="Students who aren’t in this group">', '</ul>'),
        { V: { cands: CANDIDATES } },
      ),
    );
  });
});

describe('the pick search (`div.rk-field.rk-search`)', () => {
  it('IA-05: the search with the count beside it, announced', async () => {
    const { container } = inRoot(
      <IaPickSearch
        id="gv-q"
        label="Search students"
        placeholder="Name or student ID"
        value=""
        onChange={() => undefined}
        count="2 students selected"
      />,
    );
    expectSameMarkup(
      container.querySelector('div.ia-row')!,
      fill(
        excerpt(
          '<div class="ia-row" style="align-items: flex-end">',
          '</p>\n                </div>',
          at('rIA05'),
        ).replace(/\n\s*/g, ''),
        {
          V: { q: '', selCount: '2 students selected' },
        },
      ),
    );
    expect(screen.getByRole('status')).toHaveTextContent('2 students selected');
    expect(pathOf(container.querySelector('.rk-inputwrap'))).toBe(V3_ICON_PATHS.search);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('IA-14: the search alone; typing reaches the caller', () => {
    const onChange = vi.fn();
    const { container } = inRoot(
      <IaPickSearch
        id="gd-q"
        label="Search students"
        placeholder="Name or student ID"
        value=""
        onChange={onChange}
      />,
    );
    expectSameMarkup(
      container.querySelector('div.rk-field')!,
      fill(
        excerpt(
          '<div class="rk-field rk-search" style="max-width: 420px">',
          '</div>\n            </div>',
          at('rIA14'),
        ).replace(/\n\s*/g, ''),
        { V: { aq: '' } },
      ),
    );
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search students' }), {
      target: { value: 'Vikram' },
    });
    expect(onChange).toHaveBeenCalledWith('Vikram');
  });
});

describe('IA-05 step 1: the experiments in the plan, and the ones not in it', () => {
  it('a checkbox per experiment, its formats from the plan shown — never chosen', async () => {
    const HELD = [
      {
        cid: 'gv-e-1',
        cls: 'rk-choice',
        t: 'Shell-and-Tube Heat Exchanger',
        fmts: [{ code: 'WEB' }, { code: 'VR' }],
      },
    ];
    const onChange = vi.fn();
    const { container } = inRoot(
      <IaExperimentChoices
        id="give-access-experiments"
        legend="Experiments in your access plan"
        legendHint="Students get the formats your plan includes for each experiment. You don’t choose formats here."
        choices={HELD.map((experiment) => ({
          key: experiment.cid,
          inputId: experiment.cid,
          name: experiment.t,
          checked: false,
          onChange,
          detail: (
            <>
              Available to your institution: <IaFormatBadges formats={['VR', 'WEB']} flush />
            </>
          ),
        }))}
      />,
    );
    const fieldset = container.querySelector('fieldset')!.cloneNode(true) as Element;
    expect(container.querySelector('fieldset')).toHaveAttribute('id', 'give-access-experiments');
    fieldset.removeAttribute('id');
    expectSameMarkup(
      fieldset,
      fill(excerpt('<fieldset class="rk-fieldset">', '</fieldset>', at('rIA05')), {
        V: { held: HELD },
      }),
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /Shell-and-Tube Heat Exchanger/ }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('checkbox', { name: /^(WEB|VR)$/ })).toBeNull();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('the course’s other published experiments: named, dashed badges, nothing to tick', async () => {
    const NOT_HELD = [{ t: 'Fin-Tube Bundle', fmts: [{ code: 'WEB' }, { code: 'VR' }] }];
    const { container } = inRoot(
      <IaNotInPlanList
        heading="Also published in ME ZG523 — not in your access plan"
        items={NOT_HELD.map((experiment) => ({
          key: experiment.t,
          name: experiment.t,
          detail: (
            <>
              Not in your access plan · published as{' '}
              <IaFormatBadges formats={['WEB', 'VR']} state="pub" flush />
            </>
          ),
        }))}
      />,
    );
    expectSameMarkup(
      container.querySelector('div.ia-stack')!,
      fill(
        excerpt(
          '<div class="ia-stack ia-stack--tight">\n                  <p class="rk-h3">',
          '</ul>\n                </div>',
          at('rIA05'),
        ),
        { V: { courseCode: 'ME ZG523', notHeld: NOT_HELD } },
      ),
    );
    // One column, as the export's inline grid sets it (`rk-x-choice-plain`, V3P-16).
    expect(container.querySelector('li.rk-choice')!.className).toBe(
      'rk-choice is-off rk-x-choice-plain',
    );
    expect(screen.queryByRole('checkbox')).toBeNull();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

describe('IA-05 “Your selection”', () => {
  const FACTS = {
    sumPlan: 'Your access plan · ME ZG523',
    sumExps: 'Shell-and-Tube Heat Exchanger',
    sumFmts: 'WEB and VR — from your access plan',
    sumWhoLabel: 'Students',
    sumWho: 'Fatima Begum, Lakshmi Prasad',
  };
  const items = [
    { key: 'plan', term: 'Access plan', children: FACTS.sumPlan },
    { key: 'exps', term: 'Experiments', children: FACTS.sumExps },
    { key: 'fmts', term: 'Formats', children: FACTS.sumFmts },
    { key: 'who', term: FACTS.sumWhoLabel, children: FACTS.sumWho },
  ];

  it('folded under the steps: the one line, opening to the same facts', async () => {
    const { container } = inRoot(
      <IaSelectionFold title="Your selection" line="1 experiment · 2 students" items={items} />,
    );
    expectSameMarkup(
      container.querySelector('details')!,
      fill(excerpt('<details class="ia-selsum">', '</details>', at('rIA05')), {
        V: { ...FACTS, selLine: '1 experiment · 2 students', showSum: true },
      }),
    );
    expect(pathOf(container.querySelector('summary'))).toBe(V3_ICON_PATHS.chevronDown);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('beside steps 1 and 2: the aside named “Your selection”, its section named by its heading', async () => {
    const { container } = inRoot(
      <IaGiveLayout
        asideLabel="Your selection"
        aside={<IaSelectionPanel title="Your selection" titleId="gv-sum-h" items={items} />}
      >
        <p>Step</p>
      </IaGiveLayout>,
    );
    expectSameMarkup(
      container.querySelector('aside')!,
      fill(
        excerpt(
          '<aside class="rk-aside ia-gv-aside" aria-label="Your selection">',
          '</aside>',
          at('rIA05'),
        ),
        {
          V: { ...FACTS, showSum: true },
        },
      ),
    );
    expect(container.querySelector('div.rk-detailwrap > div.rk-detail > div')).toHaveClass(
      'rk-surface',
      'rk-mainsheet',
    );
    expect(screen.getByRole('complementary', { name: 'Your selection' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Your selection' })).toBeVisible();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('beside the review and the result the aside stays, empty, so the sheet keeps its width', () => {
    const { container } = inRoot(
      <IaGiveLayout asideLabel="Your selection">
        <p>Review</p>
      </IaGiveLayout>,
    );
    expectSameMarkup(
      container.querySelector('aside')!,
      fill(
        excerpt(
          '<aside class="rk-aside ia-gv-aside" aria-label="Your selection">',
          '</aside>',
          at('rIA05'),
        ),
        {
          V: { showSum: false },
        },
      ),
    );
  });
});

describe('IA-05 step 3 and the result', () => {
  it('the formats inherited, and “What will be created” with the group’s line', async () => {
    const { container } = inRoot(
      <>
        <IaFormatsWith badges={<IaFormatBadges formats={['WEB', 'VR']} flush />}>
          Inherited from the access plan — not chosen here
        </IaFormatsWith>
        <IaStepPart title="What will be created">
          <IaGroupFlow
            who="Group ME ZG523 — Sem II"
            what="Shell-and-Tube Heat Exchanger"
            status="Active"
          />
        </IaStepPart>
      </>,
    );
    expectSameMarkup(
      container.querySelector('span.ia-row')!,
      fill(
        excerpt('<span class="ia-row" style="gap: 6px 10px">', 'here</span></span>', at('rIA05')),
        {
          V: { fmtBadges: [{ code: 'WEB' }, { code: 'VR' }] },
        },
      ),
    );
    expectSameMarkup(
      container.querySelector('p.rk-next')!,
      fill(excerpt('<p class="rk-next"><b>Group', '</p>', at('rIA05')), {
        V: { grpName: 'ME ZG523 — Sem II', expText: 'Shell-and-Tube Heat Exchanger' },
      }),
    );
    expect(screen.getByRole('heading', { level: 2, name: 'What will be created' })).toHaveClass(
      'rk-h3',
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('each grant given: who → what → its status, the note and a link (no grant id)', async () => {
    const RESULT = [
      {
        who: 'Lakshmi Prasad',
        what: 'Shell-and-Tube Heat Exchanger',
        stCls: 'xr-st xr-st--ok',
        st: 'Active',
        note: 'Lakshmi sees it in My courses with WEB and VR.',
        hasLink: true,
        linkT: 'Open Lakshmi Prasad',
        link: { href: '/institute/people/students/per-0010' },
      },
      {
        who: 'Fatima Begum',
        what: 'Shell-and-Tube Heat Exchanger',
        stCls: 'xr-st xr-st--warn',
        st: 'Waiting for a licence',
        note: 'No licence is available for Fatima on your access plan right now.',
        hasLink: true,
        linkT: 'Open Fatima Begum',
        link: { href: '/institute/people/students/per-0011' },
      },
    ];
    const { container } = inRoot(
      <IaGivenList
        rows={RESULT.map((row, index) => ({
          key: String(index),
          who: row.who,
          what: row.what,
          status: { tone: index === 0 ? 'ok' : 'warn', words: row.st },
          note: row.note,
          link: { label: row.linkT, href: row.link.href },
        }))}
      />,
    );
    expectSameMarkup(
      container.querySelector('ul')!,
      fill(
        excerpt(
          '<ul class="ia-stack ia-stack--tight">\n                  <sc-for list="{{ V.result }}"',
          '</ul>',
          at('rIA05'),
        ),
        { V: { result: RESULT } },
      ),
    );
    expect(screen.getByRole('link', { name: 'Open Fatima Begum' })).toHaveClass('rb-link');
    // The product keeps the result list's name (the export leaves it unnamed under its notice).
    const named = inRoot(<IaGivenList label="Access given" rows={[]} />);
    expect(named.container.querySelector('ul')).toHaveAttribute('aria-label', 'Access given');
    expectV3ClassesOnly(container);
    expectNoIaReferences(container);
    await assertNoAxeViolations(container);
  });
});

describe('IA-14 the group’s grants and the add panel', () => {
  it('“Experiments given to this group” as items: course code, formats, status, when given', async () => {
    const GRANTS = [
      {
        t: 'Shell-and-Tube Heat Exchanger',
        code: 'ME ZG523',
        fmAria: 'Formats from your plan: WEB, VR',
        fmts: [{ code: 'WEB' }, { code: 'VR' }],
        stCls: 'xr-st xr-st--ok',
        stLabel: 'Active',
        date: '12 Oct 2026',
      },
    ];
    const { container } = inRoot(
      <IaGrantItems
        label="Experiments given to ME ZG523 — Sem II"
        items={GRANTS.map((grant) => ({
          key: grant.t,
          name: grant.t,
          courseCode: grant.code,
          formats: <IaFormatBadges formats={['WEB', 'VR']} label={grant.fmAria} />,
          status: { tone: 'ok', words: grant.stLabel },
          given: `Given ${grant.date}`,
        }))}
      />,
    );
    expectSameMarkup(
      container.querySelector('ul.ia-items')!,
      fill(excerpt('<ul class="ia-items"', '</ul>', at('rIA14')), {
        V: { name: 'ME ZG523 — Sem II', grants: GRANTS },
      }),
    );
    expect(screen.getByRole('img', { name: 'Formats from your plan: WEB, VR' })).toBeVisible();
    expectV3ClassesOnly(container);
    expectNoIaReferences(container);
    await assertNoAxeViolations(container);
  });

  it('the add panel: named by its heading, which takes focus; then its action bar', async () => {
    const { container } = inRoot(
      <IaAddPanel
        id="gd-addpanel"
        titleId="gd-add-h"
        title="Add students to this group"
        actions={
          <IaActions>
            <Button size="lg">Cancel</Button>
            <Button variant="primary" size="lg">
              Add 1 student
            </Button>
          </IaActions>
        }
      >
        <p className="rk-next">Choose the students to add.</p>
      </IaAddPanel>,
    );
    expect(
      excerpt(
        '<section class="rk-surface" id="gd-addpanel" aria-labelledby="gd-add-h">',
        '</h2>',
        at('rIA14'),
      ),
    ).toContain('<h2 class="rb-h2" id="gd-add-h">Add students to this group</h2>');
    const panel = screen.getByRole('region', { name: 'Add students to this group' });
    expect(panel).toHaveAttribute('id', 'gd-addpanel');
    expect([...panel.children].map((child) => child.className)).toEqual([
      'rk-sec ia-stack ia-stack--tight',
      'ia-actions',
    ]);
    const heading = screen.getByRole('heading', { level: 2, name: 'Add students to this group' });
    expect(heading).toHaveClass('rb-h2');
    expect(heading).toHaveAttribute('tabindex', '-1');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});
