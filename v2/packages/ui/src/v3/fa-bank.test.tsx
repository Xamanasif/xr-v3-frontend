/**
 * What only the Faculty's Question bank screens draw (owner-approved export
 * design/v3-refined-b/roles/FA-v1, `project/Main.dc.html` "FA-14" … "FA-17", `project/fa.css`):
 * the deleted box, the draft review cards, "How review works" / "How drafting works", the editor's
 * form, fieldsets, option rows, true-or-false choice, facts and "What students see", the drafting
 * form's surface, steps, cards, count choice, foot, busy state, list surface and figures, and the
 * import's file field, chooser, destination, figures, row check, template and columns. Each is
 * rendered with sample values and compared with the export's template filled the way its script
 * fills it (`sc-for`, `sc-if`, `{{ … }}`, the sprite inlined from its own symbols) where the
 * export draws it statically; then the class contract, the behaviour, the reference rule and the
 * accessibility checks.
 *
 * Normalised, each for a recorded reason: the explicit table roles of the shared table
 * (ADR-0010); the order of class tokens; the export's inline sizes (left to the central patch);
 * the preview-only pieces (the sample-file button, "in this preview"); the type column's "single
 * choice", which the product writes "multiple choice" (lead decision 1: the domain's CSV parser
 * reads that spelling); the stand-in note's `role="note"` and the busy section's `aria-busy`,
 * which the product adds; and the drafting form's primary, a submit in the product.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectV3ClassesOnly,
  faExportText,
  faPatchedMarkup,
  v3Canonical,
} from '../testing/index.js';
import { Button } from './actions.js';
import { FaFormColumn } from './fa.js';
import {
  FaBankAnswerHint,
  FaBankDeleted,
  FaBankFacts,
  FaBankFieldset,
  FaBankHowTo,
  FaBankOptionRows,
  FaBankPhoneOnly,
  FaBankSeeList,
  FaBankSideTitle,
  FaBankStatement,
  FaDraftAllDone,
  FaDraftBusy,
  FaDraftCard,
  FaDraftCountPick,
  FaDraftFacts,
  FaDraftFoot,
  FaDraftForm,
  FaDraftFormMessage,
  FaDraftGroup,
  FaDraftList,
  FaDraftListSurface,
  FaDraftPaste,
  FaDraftSample,
  FaDraftSideActions,
  FaDraftSourceCards,
  FaDraftStep,
  FaDraftSteps,
  FaDraftTypeCards,
  FaImportColumns,
  FaImportDest,
  FaImportFigures,
  FaImportFile,
  FaImportFileField,
  FaImportFileRow,
  FaImportRowCheck,
  FaImportTemplate,
} from './fa-bank.js';

const MAIN = faExportText('Main.dc.html');
const TEMPLATE = MAIN.slice(0, MAIN.indexOf('<script type="text/x-dc"'));

/** The export's sprite (`fai-*`), by id. */
const SYMBOLS = new Map(
  [...MAIN.matchAll(/<symbol id="(fai-[\w-]+)" viewBox="0 0 24 24"><path d="([^"]+)"/g)].map(
    (match) => [match[1] ?? '', match[2] ?? ''] as const,
  ),
);

/** An internal reference no Faculty page shows (the owner's identifier rule, 21 Oct 2026). */
const REFERENCE = /\b(?:ASMT|ATT|Q|D|REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

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

/** Rendered inside a V3 root, as the shell renders the pages. */
function inRoot(ui: React.ReactNode) {
  return render(<div className="xr rb">{ui}</div>);
}

/** No internal reference in the words, the names, the titles or the placeholders drawn. */
function expectNoReference(container: Element): void {
  expect(container.textContent ?? '').not.toMatch(REFERENCE);
  for (const element of container.querySelectorAll('[aria-label], [title], [placeholder]')) {
    for (const name of ['aria-label', 'title', 'placeholder']) {
      expect(element.getAttribute(name) ?? '').not.toMatch(REFERENCE);
    }
  }
}

const Q1 = 'What does the effectiveness (ε) of a heat exchanger compare?';

// ---- FA-14 ---------------------------------------------------------------------------------------

describe('FA-14 — the deleted box and the phone line', () => {
  it('“Deleted” as the export fills `QB.delRows`', () => {
    const { container } = inRoot(
      <FaBankDeleted
        titleId="fa-qb-delh"
        title="Deleted"
        items={[{ key: 'q', text: `${Q1} — deleted 7 Nov 2026 · history kept` }]}
      />,
    );
    const box = container.querySelector('.fa-deletedbox')!;
    expectSameMarkup(
      box,
      fill(excerpt('<div class="fa-deletedbox"', '</div>'), {
        QB: { delRows: [{ t: Q1, when: 'deleted 7 Nov 2026 · history kept' }] },
      }),
    );
    expect(screen.getByRole('region', { name: 'Deleted' })).toBe(box);
    expectV3ClassesOnly(container);
  });

  it('a phone-only value (`span.fa-mob`)', () => {
    const { container } = inRoot(<FaBankPhoneOnly>added 20 Oct 2026</FaBankPhoneOnly>);
    expect(container.querySelector('span.fa-mob')).toHaveTextContent('added 20 Oct 2026');
    expect(TEMPLATE).toContain('<span class="fa-mob">added {{ r.added }}</span>');
    expectV3ClassesOnly(container);
  });
});

describe('Drafts — review cards and how it works', () => {
  const HOW_REVIEW = [
    {
      title: 'Check it against the material',
      text: 'Each draft was made with assistance from the material you chose.',
    },
    {
      title: 'Edit what isn’t right',
      text: 'Review and edit opens the draft as a question you can change.',
    },
    { title: 'Add it or discard it', text: 'Only what you add goes into your bank.' },
  ];

  it('“How review works” is the export’s list; its side heading is the export’s', () => {
    const { container } = inRoot(
      <>
        <FaBankSideTitle id="fa-qb-side">How review works</FaBankSideTitle>
        <FaBankHowTo steps={HOW_REVIEW} />
      </>,
    );
    expectSameMarkup(
      container.querySelector('ol.fa-howto')!,
      excerpt('<ol class="fa-howto">', '</ol>'),
    );
    expectSameMarkup(
      container.querySelector('h2')!,
      '<h2 class="rb-h2" id="fa-qb-side">How review works</h2>',
    );
    expect(TEMPLATE).toContain('<h2 class="rb-h2" id="fa-qb-side">How review works</h2>');
    expectV3ClassesOnly(container);
  });

  it('a draft waiting for review: its tags, type, words, options with the key; or its answer', () => {
    const options = [
      { letter: 'A', text: 'Sizing an exchanger from Q = U·A·ΔT_lm', correct: true },
      { letter: 'B', text: 'Measuring the fouling resistance directly', correct: false },
    ];
    const { container } = inRoot(
      <FaDraftList>
        <FaDraftCard
          id="fa-qb-d-1"
          state={{
            kind: 'review',
            needsReview: 'Draft — needs your review',
            assisted: 'Drafted with assistance',
          }}
          meta="Multiple choice"
          text="What is the log mean temperature difference (LMTD) used for?"
          textId="d1-t"
          options={{
            label: 'Answer options in this draft',
            correctWord: 'Correct',
            items: options,
          }}
          actions={<Button>Review and edit</Button>}
        />
        <FaDraftCard
          state={{
            kind: 'review',
            needsReview: 'Draft — needs your review',
            assisted: 'Drafted with assistance',
          }}
          meta="True or false"
          text="Counter flow always needs a larger area than parallel flow for the same duty."
          keyLine={{ label: 'Correct answer', value: 'False' }}
        />
      </FaDraftList>,
    );
    const [first, second] = [...container.querySelectorAll('li.fa-dcard')] as [Element, Element];
    expect(first).toHaveAttribute('id', 'fa-qb-d-1');
    expect(first).toHaveAttribute('tabindex', '-1');
    expectSameMarkup(
      first.querySelector('.fa-dcard-top')!,
      `${fill(excerpt('<div class="fa-dcard-top">', '</p>'), { d: { meta: 'Multiple choice' } })}</div>`,
    );
    expectSameMarkup(
      first.querySelector('ul.fa-dopts')!,
      fill(excerpt('<ul class="fa-dopts" aria-label="Answer options in this draft">', '</ul>'), {
        d: {
          opts: options.map((option) => ({
            l: option.letter,
            t: option.text,
            key: option.correct,
            cls: option.correct ? 'fa-dopt is-key' : 'fa-dopt',
          })),
        },
      }),
    );
    expect(first.querySelector('#d1-t')).toHaveClass('fa-dcard-t');
    expect(first.querySelector('.fa-dcard-act')).toContainElement(
      screen.getByRole('button', { name: 'Review and edit' }),
    );
    expectSameMarkup(
      second.querySelector('.fa-dkey')!,
      fill(excerpt('<p class="fa-dkey"><b>Correct answer</b>', '</p>'), {
        d: { tfAns: 'False' },
      }),
    );
    expect(second).not.toHaveAttribute('tabindex');
    expect(container.querySelector('ul.fa-dlist')).toContainElement(second as HTMLElement);
    expectV3ClassesOnly(container);
    expectNoReference(container);
  });

  it('a draft added on this visit: the ok tag, no answer, no actions (`is-added`)', () => {
    const { container } = inRoot(
      <FaDraftList>
        <FaDraftCard
          state={{ kind: 'added', inBank: 'In your bank · reviewed by you' }}
          meta="In your question bank · Multiple choice"
          text="Which fluid sets C_min in the effectiveness–NTU method?"
        />
      </FaDraftList>,
    );
    const draftCard = container.querySelector('li.fa-dcard')!;
    expect(draftCard).toHaveClass('is-added');
    expect(draftCard.querySelector('.fa-dcard-tags')!.innerHTML).toBe(
      '<span class="xr-st xr-st--ok"><i></i>In your bank · reviewed by you</span>',
    );
    expect(TEMPLATE).toContain(
      '<span class="xr-st xr-st--ok"><i></i>In your bank · reviewed by you</span>',
    );
    expect(draftCard.querySelector('.fa-dcard-act, .fa-dopts, .fa-dkey')).toBeNull();
    expectV3ClassesOnly(container);
  });
});

// ---- FA-15 ---------------------------------------------------------------------------------------

describe('FA-15 — the editor’s pieces', () => {
  it('the form (the form column as a `form`, named by the H1); a draft card’s bare form', () => {
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const { container } = inRoot(
      <>
        <h1 id="h">Add a question</h1>
        <FaFormColumn as="form" labelledBy="h" onSubmit={submit}>
          <Button type="submit">Save question</Button>
        </FaFormColumn>
        <p id="d">Why?</p>
        <FaFormColumn as="form" bare labelledBy="d" onSubmit={submit}>
          <Button type="submit">Add to bank</Button>
        </FaFormColumn>
      </>,
    );
    const form = screen.getByRole('form', { name: 'Add a question' });
    expect(form).toHaveClass('rk-surface', 'fa-formcol');
    expect(form).toHaveAttribute('novalidate');
    expect(screen.getByRole('form', { name: 'Why?' }).className).toBe('fa-formcol');
    fireEvent.click(screen.getByRole('button', { name: 'Save question' }));
    expect(submit).toHaveBeenCalledTimes(1);
    expect(TEMPLATE).toContain('<section class="rk-surface fa-formcol" aria-labelledby="fa-h1">');
    expectV3ClassesOnly(container);
  });

  it('the answer options: each option and its Correct radio; errors in the group', () => {
    const onChange = vi.fn();
    const onPick = vi.fn();
    const { container } = inRoot(
      <FaBankFieldset
        id="qe-opts"
        legend="Answer options"
        legendHint="Up to four. Mark the one correct answer."
        errors={[{ id: 'qe-opts-e', text: 'Add at least two answer options' }]}
      >
        <FaBankOptionRows
          name="qe-correct-choice"
          correctWord="Correct"
          rows={['A', 'B'].map((choice, index) => ({
            id: `qe-o${index}`,
            label: `Option ${choice}`,
            value: index === 0 ? 'Counter flow' : '',
            invalid: index === 1,
            onChange,
            correctId: `qe-c${index}`,
            correctName: `Option ${choice} is the correct answer`,
            checked: index === 0,
            onPick,
          }))}
        />
      </FaBankFieldset>,
    );
    const group = screen.getByRole('group', { name: /^Answer options/ });
    expect(group).toHaveClass('rk-fieldset', 'is-invalid');
    expect(group).toHaveAttribute('tabindex', '-1');
    expect(group).toHaveAccessibleDescription('Add at least two answer options');
    expect(group.querySelector('legend')!.innerHTML).toBe(
      'Answer options<span>Up to four. Mark the one correct answer.</span>',
    );
    expect(TEMPLATE).toContain(
      '<legend>Answer options<span>Up to four. Mark the one correct answer.</span></legend>',
    );
    const rows = container.querySelectorAll('.fa-optlist > .fa-optrow');
    expect(rows).toHaveLength(2);
    expect(rows[0]!.querySelector('.rk-field > label.rk-label + input.rk-input')).not.toBeNull();
    expect(rows[0]!.querySelector('label.rk-check > input[type="radio"] + span')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(screen.getByRole('textbox', { name: 'Option B' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByRole('radio', { name: 'Option A is the correct answer' })).toBeChecked();
    fireEvent.change(screen.getByRole('textbox', { name: 'Option B' }), {
      target: { value: 'Parallel flow' },
    });
    expect(onChange).toHaveBeenCalledWith('Parallel flow');
    fireEvent.click(screen.getByRole('radio', { name: 'Option B is the correct answer' }));
    expect(onPick).toHaveBeenCalled();
    expect(group.querySelector('p.rk-ferr#qe-opts-e')).toHaveTextContent(
      'Add at least two answer options',
    );
    expectV3ClassesOnly(container);
  });

  it('“The statement is” True · False (`div.rk-checks`)', () => {
    const onChange = vi.fn();
    const { container } = inRoot(
      <FaBankFieldset id="qe-correct" legend="The statement is">
        <FaBankStatement
          name="qe-tf"
          idPrefix="qe-tf"
          options={[
            { value: 'true', label: 'True' },
            { value: 'false', label: 'False' },
          ]}
          value={null}
          onChange={onChange}
        />
      </FaBankFieldset>,
    );
    const group = screen.getByRole('group', { name: 'The statement is' });
    expect(group).not.toHaveClass('is-invalid');
    expect(
      [...group.querySelectorAll('.rk-checks > label.rk-check')].map((label) => [
        label.getAttribute('for'),
        label.textContent,
      ]),
    ).toEqual([
      ['qe-tf-true', 'True'],
      ['qe-tf-false', 'False'],
    ]);
    fireEvent.click(screen.getByRole('radio', { name: 'False' }));
    expect(onChange).toHaveBeenCalledWith('false');
    expectV3ClassesOnly(container);
  });

  it('the answer hint, “This question” and “What students see” are the export’s', () => {
    const see = [
      {
        title: 'When they take the assessment',
        text: 'The question and, for choice questions, its options.',
      },
      { title: 'When their result is released', text: 'The correct answer and your explanation.' },
      { title: 'Never', text: 'Your marking guidance — only whoever marks the answer sees it.' },
    ];
    const { container } = inRoot(
      <>
        <FaBankAnswerHint>Choose the question type to set its answer.</FaBankAnswerHint>
        <FaBankFacts
          facts={[
            { key: 'v', term: 'Version', value: 'Version 2 — earlier versions are kept' },
            { key: 'u', term: 'Used in', value: 'Not in an assessment yet', quiet: true },
          ]}
        />
        <FaBankSideTitle level={3}>What students see</FaBankSideTitle>
        <FaBankSeeList items={see} />
      </>,
    );
    expectSameMarkup(
      container.querySelector('.fa-answerhint')!,
      excerpt('<p class="fa-answerhint">', '</p>'),
    );
    expectSameMarkup(
      container.querySelector('dl.fa-sidedl')!,
      fill(excerpt('<dl class="fa-sidedl">', '</dl>'), {
        QE: {
          facts: [
            { k: 'Version', v: 'Version 2 — earlier versions are kept', cls: '' },
            { k: 'Used in', v: 'Not in an assessment yet', cls: 'is-quiet' },
          ],
        },
      }),
    );
    expectSameMarkup(container.querySelector('h3')!, '<h3 class="rk-h3">What students see</h3>');
    expectSameMarkup(
      container.querySelector('ul.fa-seelist')!,
      excerpt('<ul class="fa-seelist">', '</ul>'),
    );
    expectV3ClassesOnly(container);
  });
});

// ---- FA-16 ---------------------------------------------------------------------------------------

describe('FA-16 — the drafting form', () => {
  it('the form, the stand-in note, a message section, the numbered steps and their cards', () => {
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const onSource = vi.fn();
    const onToggle = vi.fn();
    const onCount = vi.fn();
    const { container } = inRoot(
      <FaDraftForm titleId="fa-dr-fh" title="What to draft" onSubmit={submit}>
        <FaDraftSample>
          <b>Sample assistance in this preview.</b> Drafts here come from a fixed set of sample
          questions for this experiment, whichever material you choose. No drafting service is
          connected or named.
        </FaDraftSample>
        <FaDraftFormMessage>
          <p>Check these choices</p>
        </FaDraftFormMessage>
        <FaDraftSteps>
          <FaDraftStep number={1} done>
            <FaDraftGroup
              id="dq-src"
              legend="Material to draft from"
              hint="Choose one."
              error="Choose the material to draft from"
            >
              <FaDraftSourceCards
                idPrefix="dq-s"
                name="dq-s"
                options={[
                  {
                    value: 'lab-brief',
                    title: 'The experiment’s lab brief',
                    description: 'Lab brief — Shell-and-Tube Heat Exchanger',
                    icon: 'file',
                  },
                  {
                    value: 'pasted-text',
                    title: 'Text I paste',
                    description: 'Your own notes or a passage',
                    icon: 'pencil',
                  },
                ]}
                value={null}
                onChange={onSource}
              />
            </FaDraftGroup>
            <FaDraftPaste
              id="dq-paste"
              label="Text to draft from"
              error="Paste the text to draft from"
              value=""
              onChange={() => undefined}
            />
          </FaDraftStep>
          <FaDraftStep number={2}>
            <FaDraftGroup id="dq-types" legend="Question types" hint="Choose one or more.">
              <FaDraftTypeCards
                idPrefix="dq-t"
                options={[
                  {
                    value: 'multiple-choice',
                    title: 'Multiple choice',
                    description:
                      'One correct answer from up to four options. Marked automatically.',
                  },
                  {
                    value: 'written',
                    title: 'Written answer',
                    description: 'Students write their answer and you mark it.',
                  },
                ]}
                values={['written']}
                onToggle={onToggle}
              />
            </FaDraftGroup>
          </FaDraftStep>
          <FaDraftStep number={3}>
            <FaDraftGroup
              id="dq-n"
              legend="How many drafts"
              hint="Shared across the question types you choose."
            >
              <FaDraftCountPick
                idPrefix="dq-n"
                name="dq-n"
                options={[
                  { value: '3', label: '3 drafts' },
                  { value: '5', label: '5 drafts' },
                ]}
                value="3"
                onChange={onCount}
              />
            </FaDraftGroup>
          </FaDraftStep>
        </FaDraftSteps>
        <FaDraftFoot
          cancel={<a href="/faculty/question-bank">Cancel</a>}
          note="Drafting adds nothing to your bank."
          primaryLabel="Draft questions"
        />
      </FaDraftForm>,
    );
    const form = screen.getByRole('form', { name: 'What to draft' });
    expect(form).toHaveClass('rk-surface');
    expect(form.querySelector('h2#fa-dr-fh')).toHaveClass('xr-sr');
    // The note: the export's markup, a note in the product.
    const note = screen.getByRole('note');
    expect(comparable(note.outerHTML).replace(' role="note"', '')).toBe(
      comparable(fill(excerpt('<div class="fa-sample">', '</div>'), {})),
    );
    expect(form.querySelector('.rk-sec')).toHaveTextContent('Check these choices');
    // The steps: numbered, done once answered.
    const steps = form.querySelectorAll('ol.fa-nsteps > li.fa-nstep');
    expect([...steps].map((step) => step.className)).toEqual([
      'fa-nstep is-done',
      'fa-nstep',
      'fa-nstep',
    ]);
    expect(steps[0]!.querySelector('.fa-nstep-n')).toHaveAttribute('aria-hidden', 'true');
    expect(steps[0]!.querySelector('.fa-nstep-body > fieldset.rk-fieldset')).not.toBeNull();
    // Step 1: the legend, its hint, the radio cards (named by their titles), the error.
    const source = screen.getByRole('group', { name: 'Material to draft from' });
    expect(source).toHaveClass('is-invalid');
    expect(source).toHaveAccessibleDescription('Choose the material to draft from');
    expect(source.querySelector('legend + p.fa-nstep-hint')).toHaveTextContent('Choose one.');
    const brief = screen.getByRole('radio', { name: 'The experiment’s lab brief' });
    expect(brief).toHaveAccessibleDescription('Lab brief — Shell-and-Tube Heat Exchanger');
    expect(brief.closest('label')!.querySelector('.rk-choice-t.fa-choice-t > svg')).not.toBeNull();
    expect(source.querySelector('.fa-srcgrid')!.children).toHaveLength(2);
    fireEvent.click(screen.getByRole('radio', { name: 'Text I paste' }));
    expect(onSource).toHaveBeenCalledWith('pasted-text');
    expect(
      screen.getByRole('textbox', { name: 'Text to draft from' }).closest('.rk-field'),
    ).toHaveClass('fa-paste');
    expect(screen.getByRole('textbox', { name: 'Text to draft from' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    // Step 2: checkbox cards.
    expect(screen.getByRole('checkbox', { name: 'Written answer' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Multiple choice' })).toHaveAccessibleDescription(
      'One correct answer from up to four options. Marked automatically.',
    );
    fireEvent.click(screen.getByRole('checkbox', { name: 'Multiple choice' }));
    expect(onToggle).toHaveBeenCalledWith('multiple-choice');
    expect(container.querySelector('.fa-typegrid')).not.toBeNull();
    // Step 3: "3 drafts" · "5 drafts", one switch.
    const pick = container.querySelector('.fa-segpick')!;
    expect([...pick.querySelectorAll('label')].map((label) => label.textContent)).toEqual([
      '3 drafts',
      '5 drafts',
    ]);
    expect(screen.getByRole('radio', { name: '3 drafts' })).toBeChecked();
    fireEvent.click(screen.getByRole('radio', { name: '5 drafts' }));
    expect(onCount).toHaveBeenCalledWith('5');
    // The foot: the export's, its primary a submit.
    const foot = container.querySelector('.fa-draftfoot')!;
    expect(comparable(foot.outerHTML).replace('type="submit"', 'type="button"')).toBe(
      comparable(
        fill(excerpt('<div class="fa-draftfoot">', '</div>'), {
          DR: { backHref: '/faculty/question-bank' },
        }).replace(
          '<a class="rb-btn" href="/faculty/question-bank">',
          '<a href="/faculty/question-bank">',
        ),
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Draft questions' }));
    expect(submit).toHaveBeenCalledTimes(1);
    expectV3ClassesOnly(container);
  });

  it('drafting: the busy section, as the export draws it (and busy)', () => {
    const { container } = inRoot(<FaDraftBusy id="fa-dr-busy" message="Drafting questions…" />);
    const section = container.querySelector('section')!;
    expect(section).toHaveAttribute('aria-busy', 'true');
    expect(comparable(section.outerHTML).replace(' aria-busy="true"', '')).toBe(
      comparable(
        fill(
          excerpt('<section class="rk-surface" aria-labelledby="fa-dr-busy">', '</section>'),
          {},
        ),
      ),
    );
    expect(screen.getByRole('status')).toHaveTextContent('Drafting questions…');
    expectV3ClassesOnly(container);
  });

  it('the list surface, its side figures and actions, the all-done line', () => {
    const { container } = inRoot(
      <>
        <FaDraftListSurface
          titleId="fa-dr-lh"
          title="Drafts to review"
          count="3 drafts left to review"
          before={<FaDraftSample>Sample drafts</FaDraftSample>}
          line="Read each draft against the material before adding it. Edit anything that isn’t right."
        >
          <FaDraftAllDone>
            Every draft from this request has been added or discarded.
          </FaDraftAllDone>
        </FaDraftListSurface>
        <FaDraftFacts
          facts={[
            { key: 'd', term: 'Drafted', value: '3' },
            { key: 'l', term: 'Left to review', value: '3' },
            { key: 'a', term: 'Added to your bank', value: '0' },
            { key: 'x', term: 'Discarded', value: '0' },
          ]}
        />
        <FaDraftSideActions>
          <Button>Draft more</Button>
        </FaDraftSideActions>
      </>,
    );
    const section = screen.getByRole('region', { name: 'Drafts to review' });
    expect(section).toHaveClass('rk-surface');
    expect(section.firstElementChild).toHaveClass('fa-sample');
    expect(section.querySelector('.rk-sec > .rk-sec-h > h2.rb-h2#fa-dr-lh')).toHaveAttribute(
      'tabindex',
      '-1',
    );
    expect(section.querySelector('.rk-sec-h > p.rk-count[role="status"]')).toHaveTextContent(
      '3 drafts left to review',
    );
    expect(section.querySelector('.rk-sec > p.rk-next')).toHaveTextContent(
      'Read each draft against the material',
    );
    expect(TEMPLATE).toContain(
      '<div class="rk-sec-h"><h2 class="rb-h2" id="fa-dr-lh" tabindex="-1">Drafts to review</h2><p class="rk-count" role="status">{{ DR.left }}</p></div>',
    );
    expectSameMarkup(
      container.querySelector('.fa-dl-done')!,
      fill(excerpt('<p class="fa-quiet fa-dl-done">', '</p>'), {}),
    );
    expectSameMarkup(
      container.querySelector('dl.fa-sidefacts')!,
      fill(excerpt('<dl class="fa-sidefacts">', '</dl>'), {
        DR: { nDrafted: '3', nLeft: '3', nAdded: '0', nDiscarded: '0' },
      }),
    );
    expect(container.querySelector('.fa-side-acts > button')).toHaveTextContent('Draft more');
    expectV3ClassesOnly(container);
  });
});

// ---- FA-17 ---------------------------------------------------------------------------------------

describe('FA-17 — the import', () => {
  it('the file field and chooser: the button opens the hidden input; the refusal is an alert', () => {
    const onChoose = vi.fn();
    const onChange = vi.fn();
    const { container, rerender } = inRoot(
      <FaImportFileField
        titleId="fa-im-file-l"
        title="Your CSV file"
        hint="One row per question, in the template’s columns."
        foot="CSV only."
      >
        <FaImportFile
          labelledBy="fa-im-file-l"
          fileName={null}
          noFile="No file chosen"
          statusId="s"
          button={{ id: 'fa-im-choose', label: 'Choose a CSV file', describedBy: 's' }}
          input={{ id: 'fa-im-file', accept: '.csv,text/csv', onChange }}
          onChoose={onChoose}
        />
      </FaImportFileField>,
    );
    const field = container.querySelector('.rk-field')!;
    expect(field.querySelector('h2.fa-fsec-t#fa-im-file-l + p.rk-hint')).toHaveTextContent(
      'One row per question, in the template’s columns.',
    );
    expect(field.lastElementChild).toHaveTextContent('CSV only.');
    const group = screen.getByRole('group', { name: 'Your CSV file' });
    expect(group).toHaveClass('fa-file', 'fa-file--import');
    expect(group.querySelector('svg.xr-ico')).not.toBeNull();
    expect(group.querySelector('.fa-file-name')).toHaveClass('is-none');
    expect(group.querySelector('.fa-file-name')).toHaveTextContent('No file chosen');
    const input = group.querySelector('input[type="file"]')!;
    expect(input).toHaveAttribute('accept', '.csv,text/csv');
    expect(input).toHaveAttribute('tabindex', '-1');
    expect(input).toHaveAttribute('aria-hidden', 'true');
    expect(TEMPLATE).toContain(
      '<input type="file" id="fa-im-file" accept=".csv,text/csv" tabindex="-1" aria-hidden="true"',
    );
    const button = screen.getByRole('button', { name: 'Choose a CSV file' });
    expect(button.className).toBe('rb-btn');
    expect(button).toHaveAccessibleDescription('No file chosen');
    fireEvent.click(button);
    expect(onChoose).toHaveBeenCalled();
    // No sample-file button: the export's is preview-only.
    expect(within(group).getAllByRole('button')).toHaveLength(1);
    rerender(
      <div className="xr rb">
        <FaImportFileField
          titleId="fa-im-file-l"
          title="Your CSV file"
          hint="One row per question, in the template’s columns."
          foot="CSV only."
          error={{ id: 'fa-im-err', text: 'Choose a CSV file first' }}
        >
          <FaImportFile
            labelledBy="fa-im-file-l"
            fileName="post-lab-questions.csv"
            noFile="No file chosen"
            statusId="s"
            button={{ id: 'fa-im-choose', label: 'Choose a CSV file', describedBy: 's fa-im-err' }}
            input={{ id: 'fa-im-file', accept: '.csv,text/csv', onChange }}
            onChoose={onChoose}
          />
        </FaImportFileField>
      </div>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a CSV file first');
    expect(screen.getByRole('alert')).toHaveClass('rk-ferr');
    expect(container.querySelector('.fa-file-name')).not.toHaveClass('is-none');
    expect(screen.getByRole('button', { name: 'Choose a CSV file' })).toHaveAccessibleDescription(
      'post-lab-questions.csv Choose a CSV file first',
    );
    expectV3ClassesOnly(container);
  });

  it('the destination, the file row and the figures are the export’s', () => {
    const { container } = inRoot(
      <>
        <FaImportDest>
          Questions go into your bank for Shell-and-Tube Heat Exchanger. They aren’t added to any
          assessment.
        </FaImportDest>
        <FaImportFileRow>post-lab-questions.csv</FaImportFileRow>
        <FaImportFigures
          figures={[
            { key: 'r', term: 'Rows', value: '8' },
            { key: 'o', term: 'Ready', value: '6', tone: 'ok' },
            { key: 'e', term: 'With errors', value: '2', tone: 'err' },
            { key: 'w', term: 'With warnings', value: '1', tone: 'warn' },
          ]}
        />
      </>,
    );
    expectSameMarkup(
      container.querySelector('.fa-dest')!,
      fill(excerpt('<p class="fa-dest">', '</p>'), {
        IM: {
          dest: 'Questions go into your bank for Shell-and-Tube Heat Exchanger. They aren’t added to any assessment.',
        },
      }),
    );
    const row = container.querySelector('.fa-filerow')!;
    expect(row.querySelector('svg.xr-ico + span.rk-strong')).toHaveTextContent(
      'post-lab-questions.csv',
    );
    expect(TEMPLATE).toContain('<p class="fa-filerow"><svg class="xr-ico"');
    expectSameMarkup(
      container.querySelector('dl.fa-repfigs')!,
      fill(
        excerpt('<dl class="fa-repfigs" role="status">', '</dl>').replace(' role="status"', ''),
        {
          IM: {
            nTotal: '8',
            nOk: '6',
            nErr: '2',
            nWarn: '1',
            errFigCls: 'is-err',
            warnFigCls: 'is-warn',
          },
        },
      ),
    );
    expectV3ClassesOnly(container);
  });

  it('“Rows that need attention” is the export’s table (the shared table’s roles aside)', () => {
    const rows = [
      {
        row: '3',
        q: 'What does C_min stand for?',
        msg: 'correct is “E”, but the question has options A–D only.',
        isErr: true,
        isWarn: false,
      },
      {
        row: '7',
        q: 'State the units of the overall heat transfer coefficient.',
        msg: 'explanation is empty. The question imports without one.',
        isErr: false,
        isWarn: true,
      },
    ];
    const { container } = inRoot(
      <FaImportRowCheck
        title="Rows that need attention"
        caption="Rows that need attention"
        headers={{ row: 'Row', question: 'Question', fix: 'What to fix', type: 'Type' }}
        rows={rows.map((row) => ({
          key: row.row,
          row: row.row,
          question: row.q,
          fix: row.msg,
          type: row.isErr ? 'Error — blocks import' : 'Warning',
          severity: row.isErr ? ('error' as const) : ('warning' as const),
        }))}
      />,
    );
    expectSameMarkup(
      container.querySelector('.fa-rowcheck')!,
      `${fill(excerpt('<div class="fa-rowcheck">', '</table>'), { IM: { problems: rows } })}</div></div>`,
    );
    expect(screen.getByRole('table', { name: 'Rows that need attention' })).toBeVisible();
    expectV3ClassesOnly(container);
  });

  it('the template: its line and download, and its columns (the product’s “multiple choice”)', () => {
    const href =
      'data:text/csv;charset=utf-8,type%2Cquestion%2Coption_a%2Coption_b%2Coption_c%2Coption_d%2Ccorrect%2Cmarks%2Cexplanation%2Cmarking_guidance%0D%0A';
    const columns = [
      { column: 'type', what: 'multiple choice, true or false, or written answer' },
      { column: 'question', what: 'always required' },
      { column: 'option_a – option_d', what: 'choice questions: at least two options' },
      { column: 'correct', what: 'A–D, or TRUE / FALSE' },
      { column: 'marks', what: 'always required: a whole number, 1 or more' },
      { column: 'explanation', what: 'optional' },
      { column: 'marking_guidance', what: 'optional, for written answers' },
    ];
    const { container } = inRoot(
      <div className="fa-side-sec">
        <FaBankSideTitle id="fa-im-tpl">The template</FaBankSideTitle>
        <FaImportTemplate
          line="One row per question. A file imports whole or not at all."
          download={{
            label: 'Download the template (CSV)',
            href,
            fileName: 'question-import-template.csv',
          }}
        />
        <FaImportColumns columns={columns} />
      </div>,
    );
    const section = container.querySelector('.fa-side-sec')!;
    const drawn = fill(excerpt('<h2 class="rb-h2" id="fa-im-tpl">', '</a></p>'), {});
    const expected = `<div class="fa-side-sec">${drawn}</div>`;
    const rendered = section.cloneNode(true) as Element;
    rendered.querySelector('dl')!.remove();
    expectSameMarkup(rendered, expected);
    expectSameMarkup(
      container.querySelector('dl.fa-tpl')!,
      excerpt('<dl class="fa-tpl" aria-label="Template columns">', '</dl>')
        .replace(' aria-label="Template columns"', '')
        .replace('single choice, true or false', 'multiple choice, true or false'),
    );
    expectV3ClassesOnly(container);
  });
});

// ---- Accessibility and the reference rule -----------------------------------------------------------

describe('a composed bank page’s pieces', () => {
  it('pass the accessibility checks and name nothing by its reference', async () => {
    const { container } = inRoot(
      <main>
        <h1 id="h">Draft questions with assistance</h1>
        <FaDraftForm titleId="f" title="What to draft" onSubmit={(event) => event.preventDefault()}>
          <FaDraftSample>Sample drafts: no drafting service is connected yet.</FaDraftSample>
          <FaDraftSteps>
            <FaDraftStep number={1}>
              <FaDraftGroup
                id="g"
                legend="How many drafts"
                hint="Shared across the question types you choose."
              >
                <FaDraftCountPick
                  idPrefix="n"
                  name="n"
                  options={[
                    { value: '3', label: '3 drafts' },
                    { value: '5', label: '5 drafts' },
                  ]}
                  value={null}
                  onChange={() => undefined}
                />
              </FaDraftGroup>
            </FaDraftStep>
          </FaDraftSteps>
          <FaDraftFoot
            cancel={<a href="/faculty/question-bank">Cancel</a>}
            note="Drafting adds nothing to your bank."
            primaryLabel="Draft questions"
          />
        </FaDraftForm>
        <FaDraftList>
          <FaDraftCard
            state={{
              kind: 'review',
              needsReview: 'Draft — needs your review',
              assisted: 'Drafted with assistance',
            }}
            meta="Written answer"
            text="Explain how fouling changes the exchanger’s performance."
            keyLine={{ label: 'Marking guidance', value: 'Look for: U falls.' }}
            actions={
              <Button aria-label="Discard draft: Explain how fouling changes the exchanger’s performance.">
                Discard
              </Button>
            }
          />
        </FaDraftList>
        <FaBankDeleted
          titleId="del"
          title="Deleted"
          items={[{ key: 'q', text: `${Q1} — deleted 7 Nov 2026 · history kept` }]}
        />
      </main>,
    );
    await assertNoAxeViolations(container);
    expectNoReference(container);
  });
});
