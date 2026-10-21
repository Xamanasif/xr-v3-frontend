/**
 * What only the Faculty's Assessments screens draw (owner-approved export
 * design/v3-refined-b/roles/FA-v1, `project/Main.dc.html` "FA-06 Assessments" … "FA-12 Submissions",
 * `project/fa.css`): FA-06's days left; FA-07's experiment cards, question picker, "This
 * assessment", result line, rule fields and side note; the rules as set and the introduction; the
 * questions in order with their move and remove actions; FA-09's ways to add, foot line and bank
 * panel; FA-08's sections, waiting list and panel lead; FA-10's form, head and version line;
 * FA-11's surface, bar and sheet; FA-12's release line. Each is rendered with sample values and
 * compared with the export's template filled the way its script fills it (`sc-for`, `sc-if`,
 * `{{ … }}`, the sprite inlined from its own symbols); then the class contract, the behaviour, the
 * reference rule and the accessibility checks.
 *
 * Normalised, each for a recorded reason: the radio and checkbox cards' name and description
 * wiring the kit adds (`aria-labelledby`, `aria-describedby`, the ids they point at and the
 * fieldset's id, an error-summary target, as the kit's `ChoiceGroup`); the named format badges'
 * `role="img"` (a name on a `span` needs a role, as `FaFormatBadges`); the export's inline sizes
 * (the group error's `margin-top: 10px` is the central patch's `rk-x-ferr-above`, V3P-13); the
 * preview's wiring (event bindings); a bound `checked` written as the attribute the browser keeps;
 * FA-10's `fa-fform`, a class no sheet defines (as the script's `fa-u` in `fa.test.tsx`); and the
 * order of class tokens.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
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
import { FaAside, FaFormatBadges, FaMainSheet, FaPanel, FaSegmented } from './fa.js';
import {
  FA_RELEASE_DATE_FIELD,
  FaAssessmentsDaysLeft,
  FaBankAvailable,
  FaCreateExperiments,
  FaCreatePicker,
  FaCreateResultStatus,
  FaCreateRuleFields,
  FaCreateSideNote,
  FaCreateSideTitle,
  FaCreateSummary,
  FaPreviewBar,
  FaPreviewSheet,
  FaPreviewStage,
  FaPreviewSurface,
  FaRecordAdd,
  FaRecordColumns,
  FaRecordIntro,
  FaRecordLine,
  FaRecordOrder,
  FaRecordPanelLead,
  FaRecordQuestions,
  FaRecordQuestionsFoot,
  FaRecordReleaseSub,
  FaRecordRules,
  FaRecordSection,
  FaRecordWaitList,
  FaSettingsForm,
  FaSettingsHead,
  FaSettingsVersion,
} from './fa-assessments.js';
import { Field, TextInput } from './fields.js';
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

/** `{{ name }}` replaced; an attribute bound to nothing dropped. */
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
 * its list and each `sc-if` kept or dropped, each `{{ name }}` replaced; the preview's wiring
 * (event bindings), its inline sizes and empty `class=""` dropped; sprites inlined.
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
    .replace(/ class=""/g, '')
    .replace(/<use href="#(fai-[\w-]+)"><\/use>/g, (whole, id: string) => {
      const path = SYMBOLS.get(id);
      return path ? `<path d="${path}"></path>` : whole;
    });
}

/** The template from `start` to the end of the first `end` after it. */
function excerpt(start: string, end: string, after = 0): string {
  const from = TEMPLATE.indexOf(start, after);
  expect(from, `the export draws ${start}`).toBeGreaterThanOrEqual(0);
  const to = TEMPLATE.indexOf(end, from);
  expect(to, `the export closes ${start} with ${end}`).toBeGreaterThan(from);
  return TEMPLATE.slice(from, to + end.length);
}

/** Class tokens in name order. */
function sortedClasses(html: string): string {
  return html.replace(/ class="([^"]*)"/g, (_whole, value: string) => {
    return ` class="${value.split(/\s+/).filter(Boolean).sort().join(' ')}"`;
  });
}

/** The recorded normalisations (see the file's head). */
function comparable(html: string): string {
  return sortedClasses(v3Canonical(html)).replace(
    / role="(?:table|rowgroup|row|columnheader|rowheader|cell)"/g,
    '',
  );
}

function expectSameMarkup(element: Element, expected: string) {
  expect(comparable(element.outerHTML)).toBe(comparable(expected));
}

/** The kit's wiring of a card group's names and descriptions (see the file's head). */
function withoutWiring(html: string): string {
  return html
    .replace(/ aria-(?:labelledby|describedby)="[^"]*"/g, '')
    .replace(/ id="[\w-]+-(?:t|d|m)"/g, '')
    .replace(/ role="img"/g, '');
}

/** A bound `checked`: present (empty) when true, absent when false, as the browser keeps it. */
function boundChecked(html: string): string {
  return html.replace(/ checked="true"/g, ' checked=""').replace(/ checked="false"/g, '');
}

/** Rendered inside a V3 root, as the shell renders the pages. */
function inRoot(ui: React.ReactNode) {
  return render(<div className="xr rb">{ui}</div>);
}

const NAME = 'Heat Exchanger — post-lab';
const SHELL = 'Shell-and-Tube Heat Exchanger';
const Q1 = 'What does the effectiveness (ε) of a heat exchanger compare?';
const Q2 = 'How is the number of transfer units (NTU) defined?';
const Q6 =
  'Explain how fouling changes the exchanger’s performance, using what you observed in the simulation.';

// ---- FA-06 ---------------------------------------------------------------------------------------

describe('FA-06 — the days left under a deadline', () => {
  it('is the export’s `span.fa-left`', () => {
    const { container } = inRoot(<FaAssessmentsDaysLeft>7 days left</FaAssessmentsDaysLeft>);
    expectSameMarkup(
      container.querySelector('.fa-left')!,
      fill(excerpt('<span class="fa-left">', '</span>'), { r: { left: '7 days left' } }),
    );
    expectV3ClassesOnly(container);
  });
});

// ---- FA-07 ---------------------------------------------------------------------------------------

describe('FA-07 — step 1’s experiments', () => {
  const LEGEND_HINT =
    'Assessments are set per experiment, not per format. Students get the formats their institution holds.';

  function Experiments({ error, onChange }: { error?: string; onChange?: (v: string) => void }) {
    const [value, setValue] = useState<string | null>('e1');
    return (
      <FaCreateExperiments
        id="fa-cw"
        name="fa-cw-exp"
        legend="Experiment"
        legendHint={LEGEND_HINT}
        options={[
          {
            value: 'e1',
            title: SHELL,
            line: 'ME ZG523 · Thermodynamics & Heat Transfer · No assessment yet',
            meta: (
              <>
                <FaFormatBadges
                  formats={['VR', 'AR']}
                  label="Formats your institution holds: AR, VR"
                />
                <span>5 students with access</span>
              </>
            ),
          },
        ]}
        value={value}
        onChange={(next) => {
          setValue(next);
          onChange?.(next);
        }}
        error={error}
      />
    );
  }

  it('the fieldset, its legend and each card are the export’s (the kit’s wiring aside)', () => {
    const { container } = inRoot(<Experiments />);
    const drawn = fill(excerpt('<fieldset class="{{ CW.expFs }}">', '</fieldset>'), {
      CW: {
        expFs: 'rk-fieldset',
        exps: [
          {
            id: 'fa-cw-e1',
            checked: true,
            t: SHELL,
            d: 'ME ZG523 · Thermodynamics & Heat Transfer · No assessment yet',
            fmAria: 'Formats your institution holds: AR, VR',
            fm: ['AR', 'VR'],
            reach: '5 students with access',
          },
        ],
      },
    });
    const fieldset = container.querySelector('fieldset')!;
    expect(comparable(withoutWiring(fieldset.outerHTML)).replace(' id="fa-cw"', '')).toBe(
      comparable(boundChecked(drawn)),
    );
    // Each radio is named by its title and described by its lines.
    const radio = screen.getByRole('radio', { name: SHELL });
    expect(radio).toBeChecked();
    // Described by its course line and its meta: the named formats and the students who have it.
    expect(radio).toHaveAttribute('aria-describedby', 'fa-cw-e1-d fa-cw-e1-m');
    expect(container.querySelector('#fa-cw-e1-d')).toHaveTextContent(
      'ME ZG523 · Thermodynamics & Heat Transfer · No assessment yet',
    );
    const meta = container.querySelector('#fa-cw-e1-m')!;
    expect(
      within(meta as HTMLElement).getByRole('img', {
        name: 'Formats your institution holds: AR, VR',
      }),
    ).toBeVisible();
    expect(meta).toHaveTextContent('5 students with access');
    expectV3ClassesOnly(container);
  });

  it('an error: the fieldset is invalid and described by it, 10 px above (`rk-x-ferr-above`)', () => {
    const { container } = inRoot(<Experiments error="Choose an experiment" />);
    const fieldset = container.querySelector('fieldset')!;
    expect(fieldset).toHaveClass('rk-fieldset', 'is-invalid');
    expect(fieldset).toHaveAttribute('aria-describedby', 'fa-cw-e');
    const error = container.querySelector('#fa-cw-e')!;
    expect(error).toHaveClass('rk-ferr', 'rk-x-ferr-above');
    expect(error).toHaveTextContent('Choose an experiment');
    expect(TEMPLATE).toContain(
      '<p class="rk-ferr" style="margin-top: 10px"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#fai-alert"></use></svg>{{ CW.e.exp }}</p>',
    );
    expectV3ClassesOnly(container);
  });

  it('choosing a card reports its value', () => {
    const onChange = vi.fn();
    inRoot(
      <FaCreateExperiments
        id="fa-cw"
        name="fa-cw-exp"
        legend="Experiment"
        options={[
          { value: 'e1', title: SHELL, line: 'ME ZG523' },
          { value: 'e2', title: 'Double-Pipe Heat Exchanger', line: 'ME ZG523' },
        ]}
        value="e1"
        onChange={onChange}
      />,
    );
    // The card's label reaches its radio.
    fireEvent.click(screen.getByText('Double-Pipe Heat Exchanger'));
    expect(onChange).toHaveBeenCalledWith('e2');
  });
});

describe('FA-07 — step 3’s question picker', () => {
  function Picker({ error }: { error?: string }) {
    const [chosen, setChosen] = useState<readonly string[]>(['q1']);
    return (
      <FaCreatePicker
        id="fa-cw-qs"
        legend="Questions for this assessment"
        options={[
          { value: 'q1', title: Q1, line: 'Multiple choice · 2 marks' },
          { value: 'q2', title: Q2, line: 'Multiple choice · 2 marks' },
        ]}
        chosen={chosen}
        onToggle={(value) =>
          setChosen((list) =>
            list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
          )
        }
        error={error}
      />
    );
  }

  it('is the export’s fieldset (the kit’s wiring aside); ticking toggles', () => {
    const { container } = inRoot(<Picker />);
    const drawn = fill(excerpt('<fieldset class="{{ CW.qsFs }}">', '</fieldset>'), {
      CW: {
        qsFs: 'rk-fieldset',
        bank: [
          { id: 'fa-cw-qs-q1', checked: true, t: Q1, sub: 'Multiple choice · 2 marks' },
          { id: 'fa-cw-qs-q2', checked: false, t: Q2, sub: 'Multiple choice · 2 marks' },
        ],
      },
    });
    const fieldset = container.querySelector('fieldset')!;
    expect(comparable(withoutWiring(fieldset.outerHTML)).replace(' id="fa-cw-qs"', '')).toBe(
      comparable(boundChecked(drawn)),
    );
    expect(screen.getByRole('group', { name: 'Questions for this assessment' })).toBe(fieldset);
    const second = screen.getByRole('checkbox', { name: Q2 });
    expect(second).not.toBeChecked();
    expect(second).toHaveAccessibleDescription('Multiple choice · 2 marks');
    fireEvent.click(second);
    expect(second).toBeChecked();
    fireEvent.click(screen.getByRole('checkbox', { name: Q1 }));
    expect(screen.getByRole('checkbox', { name: Q1 })).not.toBeChecked();
    expectV3ClassesOnly(container);
  });

  it('an error describes the fieldset', () => {
    const { container } = inRoot(<Picker error="Choose at least one question" />);
    expect(container.querySelector('fieldset')).toHaveAttribute('aria-describedby', 'fa-cw-qs-e');
    expect(container.querySelector('#fa-cw-qs-e')).toHaveClass('rk-ferr', 'rk-x-ferr-above');
  });
});

describe('FA-07 — “This assessment”, the side note, the result line and the rule fields', () => {
  it('“This assessment” is the export’s list, each part ticked once done', () => {
    const { container } = inRoot(
      <>
        <FaCreateSideTitle id="fa-cw-sum">This assessment</FaCreateSideTitle>
        <FaCreateSummary
          items={[
            { key: 'e', label: 'Experiment', state: ' (done)', value: SHELL, done: true },
            {
              key: 'n',
              label: 'Name',
              state: ' (not done yet)',
              value: 'Not named yet',
              done: false,
            },
          ]}
        />
        <FaCreateSideNote>You can change the rules later in Settings.</FaCreateSideNote>
      </>,
    );
    expectSameMarkup(
      container.querySelector('ul.fa-sumlist')!,
      fill(excerpt('<ul class="fa-sumlist">', '</ul>'), {
        CW: {
          sumList: [
            { cls: 'fa-sum-i is-done', ok: true, k: 'Experiment', sr: ' (done)', v: SHELL },
            { cls: 'fa-sum-i', ok: false, k: 'Name', sr: ' (not done yet)', v: 'Not named yet' },
          ],
        },
      }),
    );
    expectSameMarkup(
      container.querySelector('.fa-side-note')!,
      fill(excerpt('<p class="rk-hint fa-side-note">', '</p>'), {
        CW: { sum: { note: 'You can change the rules later in Settings.' } },
      }),
    );
    expect(screen.getByRole('heading', { level: 2, name: 'This assessment' })).toHaveClass('rb-h2');
    expectV3ClassesOnly(container);
  });

  it('the result line is the export’s `p.fa-row` with the large pill', () => {
    const { container } = inRoot(
      <FaCreateResultStatus>
        <StatusPill tone="ok" size="lg">
          Ready
        </StatusPill>
      </FaCreateResultStatus>,
    );
    expectSameMarkup(
      container.querySelector('.fa-row')!,
      fill(excerpt('<p class="fa-row">', '</p>'), {
        CW: { doneCls: 'xr-st xr-st--ok rk-st-lg', doneLabel: 'Ready' },
      }),
    );
    expectV3ClassesOnly(container);
  });

  it('the three rules side by side (`div.fa-fields3`) and the release date’s field class', () => {
    const { container } = inRoot(
      <FaCreateRuleFields>
        <Field id="fa-cw-pass" label="Pass mark (%)" hint="A whole number from 0 to 100.">
          <TextInput inputMode="numeric" value="50" onChange={() => undefined} />
        </Field>
      </FaCreateRuleFields>,
    );
    expect(container.querySelector('div.fa-fields3 > .rk-field')).not.toBeNull();
    expect(screen.getByRole('textbox', { name: 'Pass mark (%)' })).toHaveAccessibleDescription(
      'A whole number from 0 to 100.',
    );
    expect(FA_RELEASE_DATE_FIELD).toBe('fa-reldate');
    expect(faExportText('fa.css')).toContain('.fa-reldate');
    expectV3ClassesOnly(container);
  });
});

// ---- the rules, the introduction and the questions (FA-07 step 4, FA-08, FA-09) ----------------

describe('the rules as set and the introduction', () => {
  it('step 4’s rules are the export’s `dl.fa-rules`', () => {
    const values = {
      name: NAME,
      totalText: '4 questions · 16 marks',
      passText: '50% · 8 of 16 marks',
      att: '2',
      dl: '14 Nov 2026, 23:59',
      relText: 'After the deadline',
    };
    const { container } = inRoot(
      <FaRecordRules
        items={[
          { key: 'n', term: 'Name', value: values.name },
          { key: 'q', term: 'Questions', value: values.totalText },
          { key: 'p', term: 'Pass mark', value: values.passText },
          { key: 'a', term: 'Attempts allowed', value: values.att },
          { key: 'd', term: 'Deadline', value: values.dl },
          { key: 'r', term: 'Result and answers', value: values.relText },
          { key: 't', term: 'Time limit', value: 'None' },
        ]}
      />,
    );
    expectSameMarkup(
      container.querySelector('dl.fa-rules')!,
      fill(excerpt('<dl class="fa-rules">', '</dl>'), { CW: values }),
    );
    expectV3ClassesOnly(container);
  });

  it('FA-08’s rules: a value not set yet is quiet (`dd.is-quiet`)', () => {
    const { container } = inRoot(
      <FaRecordRules
        items={[
          { key: 'p', term: 'Pass mark', value: '50% · 8 of 16 marks' },
          { key: 'd', term: 'Deadline', value: 'Not set yet', quiet: true },
        ]}
      />,
    );
    const second = TEMPLATE.indexOf(
      '<dl class="fa-rules">',
      TEMPLATE.indexOf('<dl class="fa-rules">') + 1,
    );
    expectSameMarkup(
      container.querySelector('dl.fa-rules')!,
      fill(excerpt('<dl class="fa-rules">', '</dl>', second), {
        AS: {
          rules2: [
            { k: 'Pass mark', v: '50% · 8 of 16 marks', cls: '' },
            { k: 'Deadline', v: 'Not set yet', cls: 'is-quiet' },
          ],
        },
      }),
    );
  });

  it('the introduction; “None” is quiet', () => {
    const { container } = inRoot(
      <>
        <FaRecordIntro label="Introduction">Read the brief first.</FaRecordIntro>
        <FaRecordIntro label="Introduction students read first" quiet>
          None
        </FaRecordIntro>
      </>,
    );
    const [given, none] = container.querySelectorAll('.fa-introbox');
    const drawn = excerpt('<div class="fa-introbox">', '</div>');
    expectSameMarkup(
      given!,
      fill(drawn, { CW: { introCls: 'fa-introtext', introText: 'Read the brief first.' } }),
    );
    expectSameMarkup(
      none!,
      fill(drawn, { CW: { introCls: 'fa-introtext is-quiet', introText: 'None' } }).replace(
        '>Introduction<',
        '>Introduction students read first<',
      ),
    );
    expect(TEMPLATE).toContain('<p class="fa-k">Introduction students read first</p>');
    expectV3ClassesOnly(container);
  });
});

describe('the questions in order', () => {
  it('step 4’s list is the export’s (number, words, type, marks)', () => {
    const { container } = inRoot(
      <FaRecordQuestions
        items={[
          { key: '1', number: 1, text: Q1, type: 'Multiple choice', marks: '2 marks' },
          {
            key: '6',
            number: 2,
            text: Q6,
            type: 'Written answer',
            written: true,
            marks: '8 marks',
          },
        ]}
      />,
    );
    expectSameMarkup(
      container.querySelector('ol.fa-qlist')!,
      fill(excerpt('<ol class="fa-qlist fa-qlist--spaced">', '</ol>'), {
        CW: {
          preview: [
            { n: 1, t: Q1, typeCls: 'fa-qtype', type: 'Multiple choice', marks: '2 marks' },
            {
              n: 2,
              t: Q6,
              typeCls: 'fa-qtype fa-qtype--w',
              type: 'Written answer',
              marks: '8 marks',
            },
          ],
        },
      }),
    );
    expectV3ClassesOnly(container);
  });

  it('FA-09’s rows: the lead, the notes, the order and Remove are the export’s', () => {
    const onUp = vi.fn();
    const onDown = vi.fn();
    const { container } = inRoot(
      <FaRecordQuestions
        items={[
          {
            key: '2',
            id: 'fa-aq-r2',
            number: 2,
            lead: 'Question 2: ',
            text: Q2,
            type: 'Multiple choice',
            marks: '2 marks',
            notes: [
              {
                key: 'newer',
                text: 'A newer version is in your question bank.',
                action: (
                  <Button aria-label="Use the updated version of question 2">
                    Use updated version
                  </Button>
                ),
              },
            ],
            actions: (
              <>
                <FaRecordOrder
                  label="Order of question 2"
                  up={{ label: 'Move question 2 up', disabled: false, onClick: onUp }}
                  down={{ label: 'Move question 2 down', disabled: true, onClick: onDown }}
                />
                <Button variant="ghost" aria-label="Remove question 2 from this assessment">
                  Remove
                </Button>
              </>
            ),
          },
        ]}
      />,
    );
    const secondList = TEMPLATE.indexOf(
      '<ol class="fa-qlist fa-qlist--spaced">',
      TEMPLATE.indexOf('<ol class="fa-qlist fa-qlist--spaced">') + 1,
    );
    const drawn = fill(excerpt('<ol class="fa-qlist fa-qlist--spaced">', '</ol>', secondList), {
      AQ: {
        rows: [
          {
            rid: 'fa-aq-r2',
            n: 2,
            t: Q2,
            typeCls: 'fa-qtype',
            type: 'Multiple choice',
            marks: '2 marks',
            isUpd: true,
            canAct: true,
            updAria: 'Use the updated version of question 2',
            isDel: false,
            orderAria: 'Order of question 2',
            noUp: false,
            upAria: 'Move question 2 up',
            noDown: true,
            downAria: 'Move question 2 down',
            rmAria: 'Remove question 2 from this assessment',
          },
        ],
      },
    })
      // A bound boolean attribute is present only when true.
      .replace(/ disabled="false"/g, '')
      .replace(/ disabled="true"/g, ' disabled=""');
    // The note's glyph: the kit's information disc for the export's `fai-info`.
    const glyph = (html: string) =>
      html.replace(/<svg[^>]*>(?:(?!<\/svg>).)*<\/svg>/gs, '<svg></svg>');
    expect(glyph(comparable(container.querySelector('ol.fa-qlist')!.outerHTML))).toBe(
      glyph(comparable(drawn)),
    );
    // The number is decorative: "Question 2: " is read before the words.
    const row = container.querySelector('li.fa-q')!;
    expect(row).toHaveAttribute('tabindex', '-1');
    expect(row.querySelector('.fa-qn')).toHaveAttribute('aria-hidden', 'true');
    expect(row.querySelector('.fa-qt')).toHaveTextContent(`Question 2: ${Q2}`);
    // Move: the group is named; a disabled direction cannot be pressed.
    const order = screen.getByRole('group', { name: 'Order of question 2' });
    fireEvent.click(within(order).getByRole('button', { name: 'Move question 2 up' }));
    expect(onUp).toHaveBeenCalledTimes(1);
    expect(within(order).getByRole('button', { name: 'Move question 2 down' })).toBeDisabled();
    fireEvent.click(within(order).getByRole('button', { name: 'Move question 2 down' }));
    expect(onDown).not.toHaveBeenCalled();
    expectV3ClassesOnly(container);
  });

  it('FA-09’s ways to add and its foot line are the export’s', () => {
    const { container } = inRoot(
      <>
        <FaRecordAdd
          buttons={
            <>
              <Button id="fa-aq-open" icon="stack" iconSize={20}>
                Add from question bank
              </Button>
              <ButtonLink href="#FA-15" icon="add" iconSize={20}>
                New question
              </ButtonLink>
            </>
          }
          or="Or"
          links={[
            <TextLink key="d" href="#FA-16">
              Draft with assistance
            </TextLink>,
            <TextLink key="i" href="#FA-17">
              Import
            </TextLink>,
          ]}
        />
        <FaRecordQuestionsFoot>
          Removing takes a question off this assessment. It stays in your question bank — removing
          is not deleting.
        </FaRecordQuestionsFoot>
      </>,
    );
    expectSameMarkup(
      container.querySelector('.fa-qadd')!,
      fill(excerpt('<div class="fa-qadd">', '</div>'), { AQ: { noPanel: true } }),
    );
    expectSameMarkup(
      container.querySelector('.fa-qfoot')!,
      excerpt('<p class="rk-hint fa-qfoot">', '</p>'),
    );
    expectV3ClassesOnly(container);
  });
});

// ---- FA-08 ---------------------------------------------------------------------------------------

describe('FA-08 — the sections, the waiting list and the panel lead', () => {
  it('a titled section is the export’s `section.rk-sec` with its head and link', () => {
    const { container } = inRoot(
      <FaRecordSection
        titleId="fa-as-rules"
        title="Rules as set for this assessment"
        link={<TextLink href="#FA-10">Change settings</TextLink>}
      >
        <FaRecordLine>Students who have {SHELL} can see and start it.</FaRecordLine>
      </FaRecordSection>,
    );
    const section = container.querySelector('section.rk-sec')!;
    expectSameMarkup(
      section.querySelector('.rk-sec-h')!,
      fill(excerpt('<div class="rk-sec-h"><h2 class="rb-h2" id="fa-as-rules">', '</div>'), {
        AR: { own: true },
      }),
    );
    expect(screen.getByRole('region', { name: 'Rules as set for this assessment' })).toBe(section);
    expect(section.querySelector('p.rk-next')).toHaveTextContent(`Students who have ${SHELL}`);
    expectV3ClassesOnly(container);
  });

  it('the tab’s heading takes focus (`tabindex=-1`); untitled, the plain body', () => {
    const { container } = inRoot(
      <>
        <FaRecordSection titleId="fa-tabh" title="Ready to use" titleFocus>
          <p>…</p>
        </FaRecordSection>
        <FaRecordSection>
          <p>…</p>
        </FaRecordSection>
      </>,
    );
    expect(container.querySelector('#fa-tabh')).toHaveAttribute('tabindex', '-1');
    expect(TEMPLATE).toContain('<h2 class="rb-h2" id="fa-tabh" tabindex="-1">{{ AS.readyH }}</h2>');
    expect(container.querySelector('div.rk-sec')).not.toBeNull();
  });

  it('the waiting list and the panel lead are the export’s', () => {
    const { container } = inRoot(
      <>
        <FaRecordWaitList
          label="Waiting for marking, oldest first"
          items={[{ key: 'a', name: 'Rahul Verma', when: 'submitted 12 Nov 2026, 18:42' }]}
        />
        <FaRecordPanelLead>Nothing is waiting for marking.</FaRecordPanelLead>
      </>,
    );
    expectSameMarkup(
      container.querySelector('ul.fa-waitlist')!,
      fill(excerpt('<ul class="fa-waitlist"', '</ul>'), {
        AS: { waitList: [{ n: 'Rahul Verma', w: 'submitted 12 Nov 2026, 18:42' }] },
      }),
    );
    expectSameMarkup(
      container.querySelector('.fa-panel-lead')!,
      fill(excerpt('<p class="fa-panel-lead">', '</p>'), {
        AS: { noWaitT: 'Nothing is waiting for marking.' },
      }),
    );
    expect(screen.getByRole('list', { name: 'Waiting for marking, oldest first' })).toBeVisible();
    expectV3ClassesOnly(container);
  });
});

// ---- FA-09 the bank panel --------------------------------------------------------------------------

describe('FA-09 — the bank panel', () => {
  function Panel({ onClose }: { onClose: () => void }) {
    return (
      <FaAside labelledBy="fa-aq-ph">
        <FaPanel
          titleId="fa-aq-ph"
          title="From your question bank"
          focusable
          close={{ label: 'Close question bank', onClose }}
        >
          <p className="rk-hint">{SHELL} · not in this assessment</p>
          <FaBankAvailable
            items={[
              {
                key: 'q2',
                text: Q2,
                line: 'Multiple choice · 2 marks',
                action: (
                  <Button icon="add" iconSize={20} aria-label={`Add to this assessment: ${Q2}`}>
                    Add
                  </Button>
                ),
              },
            ]}
          />
        </FaPanel>
      </FaAside>
    );
  }

  it('is the export’s panel: the focusable heading, the close button, the questions with Add', () => {
    const { container } = inRoot(<Panel onClose={() => undefined} />);
    const start = TEMPLATE.indexOf('<aside class="rk-aside" aria-labelledby="fa-aq-ph">');
    expectSameMarkup(
      container.querySelector('.rk-panel-head')!,
      fill(excerpt('<div class="rk-panel-head"><h2 id="fa-aq-ph"', '</button></div>', start), {}),
    );
    expectSameMarkup(
      container.querySelector('ul.fa-avail')!,
      fill(excerpt('<ul class="fa-avail fa-avail--panel">', '</ul>'), {
        AQ: {
          avail: [
            { t: Q2, sub: 'Multiple choice · 2 marks', aria: `Add to this assessment: ${Q2}` },
          ],
        },
      }),
    );
    expect(screen.getByRole('complementary', { name: 'From your question bank' })).toBeVisible();
    expectV3ClassesOnly(container);
  });

  it('the close button and Escape close it', () => {
    const onClose = vi.fn();
    inRoot(<Panel onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close question bank' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(screen.getByRole('button', { name: `Add to this assessment: ${Q2}` }), {
      key: 'Escape',
    });
    expect(onClose).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(screen.getByRole('heading', { name: 'From your question bank' }), {
      key: 'Enter',
    });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('the columns keep the sheet the same element when the panel opens and closes', () => {
    const sheet = (
      <FaMainSheet labelledBy="fa-tabh">
        <h2 id="fa-tabh">Questions in order</h2>
      </FaMainSheet>
    );
    const { container, rerender } = inRoot(<FaRecordColumns>{sheet}</FaRecordColumns>);
    const before = container.querySelector('.rk-mainsheet');
    expect(container.querySelector('.rk-detailwrap > .fa-single > .rk-mainsheet')).toBe(before);
    rerender(
      <div className="xr rb">
        <FaRecordColumns aside={<Panel onClose={() => undefined} />}>{sheet}</FaRecordColumns>
      </div>,
    );
    expect(container.querySelector('.rk-detailwrap > .rk-detail > .rk-mainsheet')).toBe(before);
    expect(container.querySelector('.rk-detail > aside.rk-aside')).not.toBeNull();
    expectV3ClassesOnly(container);
  });
});

// ---- FA-10 ---------------------------------------------------------------------------------------

describe('FA-10 — the form, its head and the version line', () => {
  it('the head and the version line are the export’s; the form is named and submits', () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const { container } = inRoot(
      <FaSettingsForm labelledBy="fa-tabh" onSubmit={onSubmit}>
        <FaSettingsHead
          titleId="fa-tabh"
          title="Settings"
          line="Each value belongs to this assessment only. There is no time limit."
        />
        <Field id="es-pass" label="Pass mark (%)">
          <TextInput value="50" onChange={() => undefined} />
        </Field>
        <FaSettingsVersion>Version 1 · since 27 Oct 2026, 11:05</FaSettingsVersion>
      </FaSettingsForm>,
    );
    expectSameMarkup(
      container.querySelector('.fa-fhead')!,
      excerpt('<div class="fa-fhead">', '</div>'),
    );
    expectSameMarkup(
      container.querySelector('.fa-side-ver')!,
      fill(excerpt('<p class="fa-side-ver">', '</p>'), {
        ST: { sideVer: 'Version 1 · since 27 Oct 2026, 11:05' },
      }),
    );
    const form = screen.getByRole('form', { name: 'Settings' });
    expect(form).toHaveClass('rk-surface', 'fa-formcol');
    // The export's `fa-fform` is a class no sheet defines (see the file's head).
    expect(TEMPLATE).toContain(
      '<section class="rk-surface fa-formcol fa-fform" aria-labelledby="fa-tabh">',
    );
    expect(faExportText('fa.css')).not.toContain('.fa-fform');
    expect(form).toHaveAttribute('novalidate');
    fireEvent.submit(form);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expectV3ClassesOnly(container);
  });
});

// ---- FA-11 ---------------------------------------------------------------------------------------

describe('FA-11 — the preview', () => {
  function Bar({ keyView, onKey }: { keyView: boolean; onKey: () => void }) {
    return (
      <FaPreviewBar
        headingId="fa-tabh"
        heading="Preview"
        switcher={
          <FaSegmented
            label="Preview as"
            segments={[
              {
                key: 's',
                label: 'Student view',
                icon: 'eye',
                pressed: !keyView,
                onPress: () => undefined,
              },
              { key: 'k', label: 'Answer key', icon: 'key', pressed: keyView, onPress: onKey },
            ]}
          />
        }
        note="Previewing creates no attempt and saves nothing."
      />
    );
  }

  it('the surface and bar are the export’s; the switch reports the key', () => {
    const onKey = vi.fn();
    const { container } = inRoot(
      <FaPreviewSurface labelledBy="fa-tabh">
        <Bar keyView={false} onKey={onKey} />
      </FaPreviewSurface>,
    );
    expectSameMarkup(
      container.querySelector('.fa-pvbar')!,
      fill(excerpt('<div class="fa-pvbar">', '</p>\n          </div>'), {
        PV: { pStu: 'true', pKey: 'false' },
      }),
    );
    expect(screen.getByRole('region', { name: 'Preview' })).toHaveClass('rk-surface', 'fa-pvsurf');
    expect(TEMPLATE).toContain('<section class="rk-surface fa-pvsurf" aria-labelledby="fa-tabh">');
    fireEvent.click(screen.getByRole('button', { name: 'Answer key' }));
    expect(onKey).toHaveBeenCalledTimes(1);
    expectV3ClassesOnly(container);
  });

  it('the student view: the head and a choice and a written question are the export’s', () => {
    const { container } = inRoot(
      <FaPreviewSheet
        head={{
          kind: 'student',
          label: 'As students see it',
          title: NAME,
          line: '4 questions · 16 marks · Due 14 Nov 2026, 23:59 · Version 1',
          intro: 'Read the brief first.',
        }}
        questions={[
          {
            key: '1',
            head: 'Question 1 of 2 · Multiple choice',
            marks: '2 marks',
            text: Q1,
            options: [
              { key: 'A', text: 'Actual heat transfer to the maximum possible' },
              { key: 'B', text: 'Hot inlet to cold inlet temperature' },
            ],
          },
          {
            key: '6',
            head: 'Question 2 of 2 · Written answer',
            marks: '8 marks',
            text: Q6,
            writtenBox:
              'The student’s written answer goes here. Your faculty marks written answers.',
          },
        ]}
      />,
    );
    const start = TEMPLATE.indexOf('<div class="fa-pvstage">');
    const drawn = fill(excerpt('<div class="fa-pvstage">', '</ol>', start), {
      AR: { name: NAME },
      PV: {
        stu: true,
        key: false,
        facts: '4 questions · 16 marks · Due 14 Nov 2026, 23:59 · Version 1',
        hasIntro: true,
        intro: 'Read the brief first.',
        qs: [
          {
            head: 'Question 1 of 2 · Multiple choice',
            marks: '2 marks',
            t: Q1,
            isChoice: true,
            isW: false,
            opts: [
              { cls: 'fa-opt', t: 'Actual heat transfer to the maximum possible', mark: false },
              { cls: 'fa-opt', t: 'Hot inlet to cold inlet temperature', mark: false },
            ],
          },
          {
            head: 'Question 2 of 2 · Written answer',
            marks: '8 marks',
            t: Q6,
            isChoice: false,
            isW: true,
          },
        ],
      },
    });
    // The export's stage closes after the list; the excerpt stops at `</ol>`.
    expectSameMarkup(container.querySelector('.fa-pvstage')!, `${drawn}</div></div>`);
    expectV3ClassesOnly(container);
  });

  it('the answer key: the key head, the correct option, the guidance and the explanation', () => {
    const { container } = inRoot(
      <FaPreviewSheet
        head={{
          kind: 'key',
          label: 'Answer key',
          title: 'Only you see the answer key and the marking guidance',
          line: 'Students see correct answers and explanations only when their result is released.',
        }}
        questions={[
          {
            key: '1',
            head: 'Question 1 of 2 · Multiple choice',
            marks: '2 marks',
            text: Q1,
            options: [
              { key: 'A', text: 'Actual heat transfer to the maximum possible', correct: true },
              { key: 'B', text: 'Hot inlet to cold inlet temperature' },
            ],
            correctWord: 'Correct',
            explanation: { label: 'Explanation', text: 'ε = Q / Q max.' },
          },
          {
            key: '6',
            head: 'Question 2 of 2 · Written answer',
            marks: '8 marks',
            text: Q6,
            guidance: { label: 'Marking guidance · only you see this', text: 'Look for: U falls.' },
            explanation: { label: 'Explanation', text: 'Fouling adds a resistance.' },
          },
        ]}
      />,
    );
    const start = TEMPLATE.indexOf('<div class="fa-pvstage">');
    const drawn = fill(excerpt('<div class="fa-pvstage">', '</ol>', start), {
      AR: { name: NAME },
      PV: {
        stu: false,
        key: true,
        qs: [
          {
            head: 'Question 1 of 2 · Multiple choice',
            marks: '2 marks',
            t: Q1,
            isChoice: true,
            isW: false,
            hasGuide: false,
            expl: 'ε = Q / Q max.',
            opts: [
              {
                cls: 'fa-opt is-correct',
                t: 'Actual heat transfer to the maximum possible',
                mark: true,
              },
              { cls: 'fa-opt', t: 'Hot inlet to cold inlet temperature', mark: false },
            ],
          },
          {
            head: 'Question 2 of 2 · Written answer',
            marks: '8 marks',
            t: Q6,
            isChoice: false,
            isW: true,
            hasGuide: true,
            guide: 'Look for: U falls.',
            expl: 'Fouling adds a resistance.',
          },
        ],
      },
    });
    expectSameMarkup(container.querySelector('.fa-pvstage')!, `${drawn}</div></div>`);
    expectV3ClassesOnly(container);
  });

  it('a state inside the stage keeps the sheet', () => {
    const { container } = inRoot(
      <FaPreviewStage>
        <p>Nothing to preview yet</p>
      </FaPreviewStage>,
    );
    expect(container.querySelector('.fa-pvstage > .fa-pvsheet > p')).toHaveTextContent(
      'Nothing to preview yet',
    );
  });
});

// ---- FA-12 ---------------------------------------------------------------------------------------

describe('FA-12 — the release under a mark', () => {
  it('is the export’s `span.fa-cellsub.fa-relsub`', () => {
    const { container } = inRoot(
      <FaRecordReleaseSub>after the deadline, 14 Nov 2026, 23:59</FaRecordReleaseSub>,
    );
    expectSameMarkup(
      container.querySelector('.fa-relsub')!,
      fill(excerpt('<span class="fa-cellsub fa-relsub">', '</span>'), {
        r: { relSub: 'after the deadline, 14 Nov 2026, 23:59' },
      }),
    );
    expectV3ClassesOnly(container);
  });
});

// ---- Accessibility and the reference rule -----------------------------------------------------------

describe('a composed assessment page’s pieces', () => {
  it('pass the accessibility checks and name nothing by its reference', async () => {
    const { container } = inRoot(
      <main>
        <h1>{NAME}</h1>
        <FaRecordColumns
          aside={
            <FaAside labelledBy="fa-aq-ph">
              <FaPanel
                titleId="fa-aq-ph"
                title="From your question bank"
                focusable
                close={{ label: 'Close question bank', onClose: () => undefined }}
              >
                <FaBankAvailable
                  items={[
                    {
                      key: 'q2',
                      text: Q2,
                      line: 'Multiple choice · 2 marks',
                      action: <Button aria-label={`Add to this assessment: ${Q2}`}>Add</Button>,
                    },
                  ]}
                />
              </FaPanel>
            </FaAside>
          }
        >
          <FaMainSheet labelledBy="fa-tabh">
            <FaRecordSection titleId="fa-tabh" title="Questions in order" titleFocus>
              <FaRecordQuestions
                items={[
                  {
                    key: '1',
                    id: 'fa-aq-r1',
                    number: 1,
                    lead: 'Question 1: ',
                    text: Q1,
                    type: 'Multiple choice',
                    marks: '2 marks',
                    actions: (
                      <FaRecordOrder
                        label="Order of question 1"
                        up={{
                          label: 'Move question 1 up',
                          disabled: true,
                          onClick: () => undefined,
                        }}
                        down={{
                          label: 'Move question 1 down',
                          disabled: false,
                          onClick: () => undefined,
                        }}
                      />
                    ),
                  },
                ]}
              />
              <FaRecordQuestionsFoot>Removing is not deleting.</FaRecordQuestionsFoot>
            </FaRecordSection>
            <FaRecordSection titleId="fa-as-rules" title="Rules as set for this assessment">
              <FaRecordRules
                items={[{ key: 'p', term: 'Pass mark', value: '50% · 8 of 16 marks' }]}
              />
              <FaRecordIntro label="Introduction students read first" quiet>
                None
              </FaRecordIntro>
            </FaRecordSection>
          </FaMainSheet>
        </FaRecordColumns>
        <FaCreatePicker
          id="fa-cw-qs"
          legend="Questions for this assessment"
          options={[{ value: 'q1', title: Q1, line: 'Multiple choice · 2 marks' }]}
          chosen={[]}
          onToggle={() => undefined}
          error="Choose at least one question"
        />
        <FaPreviewSurface labelledBy="fa-pv">
          <FaPreviewBar
            headingId="fa-pv"
            heading="Preview"
            switcher={
              <FaSegmented
                label="Preview as"
                segments={[
                  {
                    key: 's',
                    label: 'Student view',
                    icon: 'eye',
                    pressed: true,
                    onPress: () => undefined,
                  },
                ]}
              />
            }
            note="Previewing creates no attempt and saves nothing."
          />
          <FaPreviewSheet
            head={{
              kind: 'student',
              label: 'As students see it',
              title: NAME,
              line: '1 question · 2 marks',
            }}
            questions={[
              { key: '1', head: 'Question 1 of 1 · Multiple choice', marks: '2 marks', text: Q1 },
            ]}
          />
        </FaPreviewSurface>
      </main>,
    );
    await assertNoAxeViolations(container);
    expectNoInternalReferences(container);
    expect(container.textContent ?? '').not.toMatch(/\b(?:ASMT|ATT|Q|D)-\d+/);
  });
});
