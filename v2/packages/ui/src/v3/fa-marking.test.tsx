/**
 * What only the Faculty's marking screens draw (owner-approved export design/v3-refined-b/roles/
 * FA-v1, `project/Main.dc.html` FA-18, FA-19, FA-20, FA-21; `project/fa.css`): the queue's count and
 * co-teacher note, the marking page's head, its reading sheet and marks panel (editable and
 * confirmed), the release note, the Students roster's per-format cell, last activity and summary,
 * and a Student's per-format list and sections. Each is rendered with sample values and compared
 * with the export's template filled the way its script fills it (`sc-for`, `sc-if`, `{{ … }}`, the
 * `fai-*` sprite inlined); then the behaviour (Go to the marks, the score's error wiring), the
 * class contract, the accessibility checks and no internal reference anywhere a piece draws.
 *
 * Normalised on both sides, each for a recorded reason: a control's `value` (the same state as a
 * property); an `aria-invalid="false"`, which is no state; the space the kit adds between the score
 * label and its sub-line (so the field's name reads “Your mark Question 4 …” in every engine); the
 * export's inline sizes, which the kit leaves to the central patch (`margin-top: 12px` on a note is
 * its `rk-x-hint-list`; the others are not drawn); and the order of class tokens.
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
import { Breadcrumbs, MetaSeparator } from './page.js';
import {
  FaAutoMarks,
  FaDoneTotal,
  FaLiveTotal,
  FaMarkConfirm,
  FaMarkFeedback,
  FaMarkHead,
  FaMarkLayout,
  FaMarkSave,
  FaMarkSection,
  FaMarksDone,
  FaMarksPanel,
  FaQueueCount,
  FaQueueLockedNote,
  FaReleaseNote,
  FaScoreField,
  FaSheetQuestion,
  FaStudentFormatList,
  FaStudentSection,
  FaStudentsFormatCell,
  FaStudentsLastActivity,
  FaStudentsSummary,
} from './fa-marking.js';
import { FaResourceList } from './fa.js';
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

/** `{{ name }}` replaced; an attribute bound to nothing (`aria-current="{{ t.cur }}"`) dropped. */
function substitute(html: string, scope: Scope): string {
  return html
    .replace(/ ([\w-]+)="\{\{ ([\w.]+) \}\}"/g, (_whole, name: string, path: string) => {
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
    .replace(/<use href="#(fai-[\w-]+)"><\/use>/g, (whole, id: string) => {
      const path = SYMBOLS.get(id);
      return path ? `<path d="${path}"></path>` : whole;
    });
}

/** The template from the first `start` after `from` to the end of the element it opens. */
function excerpt(start: string, end: string, from = 0): string {
  const at = TEMPLATE.indexOf(start, from);
  expect(at, `the export draws ${start}`).toBeGreaterThanOrEqual(0);
  const to = TEMPLATE.indexOf(end, at);
  expect(to, `the export closes ${start} with ${end}`).toBeGreaterThan(at);
  return TEMPLATE.slice(at, to + end.length);
}

/** Where a screen's section of the template starts. */
const section = (id: string) => TEMPLATE.indexOf(`<!-- ═══ ${id}`);

/** Class tokens in name order: the export writes a cell's place and its column in either order. */
function sortedClasses(html: string): string {
  return html.replace(/ class="([^"]*)"/g, (_whole, value: string) => {
    return ` class="${value.split(/\s+/).filter(Boolean).sort().join(' ')}"`;
  });
}

/** The recorded normalisations (see the file's head). */
function comparable(html: string): string {
  return sortedClasses(v3Canonical(faPatchedMarkup(html).replace(/ style="[^"]*"/g, '')))
    .replace(/ aria-invalid="false"/g, '')
    .replace(/(<(?:input|textarea)[^>]*?) value="[^"]*"/g, '$1')
    .replace(/(<textarea[^>]*>)[^<]*(<\/textarea>)/g, '$1$2')
    .replace(/ <span class="fa-score-q">/g, '<span class="fa-score-q">');
}

function expectSameMarkup(element: Element, expected: string) {
  expect(comparable(element.outerHTML)).toBe(comparable(expected));
}

/** Rendered inside a V3 root, as the shell renders the pages. */
function inRoot(ui: React.ReactNode) {
  return render(<div className="xr rb">{ui}</div>);
}

/** The Faculty's internal references (ASMT-, ATT-, Q-, D-) and every other role's. */
const REFERENCE = /\b(?:ASMT|ATT|Q|D|REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

function expectNoReferences(root: Element) {
  expect(root.textContent ?? '').not.toMatch(REFERENCE);
  for (const element of [root, ...root.querySelectorAll('*')]) {
    for (const name of ['aria-label', 'title', 'placeholder']) {
      expect(element.getAttribute(name) ?? '').not.toMatch(REFERENCE);
    }
  }
}

const pill = (tone: 'ok' | 'warn' | 'info' | 'neutral', words: string) => (
  <StatusPill tone={tone}>{words}</StatusPill>
);

// ---- FA-18 ------------------------------------------------------------------------------------

describe('FA-18: the count line and the co-teacher note are the export’s', () => {
  it('the count (a polite status) and the oldest wait', async () => {
    const MQ = {
      count: '2 written answers waiting',
      hasOldest: true,
      oldest: 'Oldest waiting 2 days',
    };
    const { container } = inRoot(<FaQueueCount count={MQ.count} oldest={MQ.oldest} />);
    expectSameMarkup(
      container.querySelector('p.fa-mqcount')!,
      fill(excerpt('<p class="fa-mqcount">', '</p>', section('FA-18')), { MQ }),
    );
    expect(screen.getByRole('status')).toHaveTextContent('2 written answers waiting');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('nothing waiting: the count alone', () => {
    const MQ = { count: 'Nothing waiting', hasOldest: false };
    const { container } = inRoot(<FaQueueCount count={MQ.count} />);
    expectSameMarkup(
      container.querySelector('p.fa-mqcount')!,
      fill(excerpt('<p class="fa-mqcount">', '</p>', section('FA-18')), { MQ }),
    );
  });

  it('the co-teacher’s note (`p.rk-locked` with the lock)', async () => {
    const words =
      'Written answers for assessments another Faculty member created aren’t shown to co-teachers while sharing between co-teachers is being decided.';
    const { container } = inRoot(<FaQueueLockedNote inState>{words}</FaQueueLockedNote>);
    expectSameMarkup(
      container.querySelector('p.rk-locked')!,
      fill(excerpt('<p class="rk-locked" style=', '</p>', section('FA-18')), {}),
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

// ---- FA-19 ------------------------------------------------------------------------------------

const MK = {
  who: 'Rahul Verma',
  ctx: 'Heat Exchanger — post-lab · Shell-and-Tube Heat Exchanger',
  st: 'Waiting for marking',
  stCls: 'xr-st xr-st--warn',
  subLine: 'Submitted 5 Nov 2026, 18:52 · attempt 1 of 2',
  hasQpos: true,
  qpos: '1 of 2 waiting · oldest first',
  autoText: '4 of 6 marks',
  hasAuto: true,
  noAuto: false,
  auto: [
    { t: 'Question 1 · Multiple choice', m: '2 of 2', ok: true, no: false },
    { t: 'Question 2 · Multiple choice', m: '0 of 2', ok: false, no: true },
    { t: 'Question 3 · True or false', m: '2 of 2', ok: true, no: false },
  ],
  written: [
    {
      hid: 'fa-mk-q4',
      head: 'Question 4 of 4 · Written answer',
      marks: '10 marks',
      t: 'Explain how fouling changes the exchanger’s performance.',
      ansH: 'Rahul Verma’s answer',
      ans: 'Fouling lowers U.',
      hasGuide: true,
      guide: 'Look for: fouling adds a thermal resistance.',
    },
  ],
  ofAll: '16 marks in total',
  editable: true,
  confirmed: false,
  inputs: [
    {
      id: 'fa-mk-Q-0106',
      label: 'Your mark',
      sub: 'Question 4 · written answer, out of 10',
      val: '',
      outOf: '/ 10',
      hint: 'A whole number from 0 to 10.',
      hid: 'fa-mk-Q-0106-h',
      eid: 'fa-mk-Q-0106-e',
      hasErr: false,
      err: '',
      inv: 'false',
      desc: 'fa-mk-Q-0106-h',
    },
  ],
  fbLabel: 'Feedback for Rahul (optional)',
  fb: '',
  liveTotal: '— of 16',
  liveTotalD: '4 marked automatically + the written mark · pass mark 8',
  savedNote: false,
  notSaved: true,
  savedText: 'Mark saved — not confirmed yet',
};

describe('FA-19: the head, the reading sheet and the marks panel are the export’s', () => {
  it('the head: eyebrow, the Student as the title, the status and submitted line, the position', async () => {
    const { container } = inRoot(
      <FaMarkHead
        breadcrumbs={
          <Breadcrumbs levels={[{ label: 'Marking', href: '/faculty/marking' }]} current={MK.who} />
        }
        eyebrow={MK.ctx}
        title={MK.who}
        titleId="fa-h1"
        meta={
          <>
            {pill('warn', MK.st)}
            <MetaSeparator />
            <span>{MK.subLine}</span>
          </>
        }
        position={MK.qpos}
      />,
    );
    expectSameMarkup(
      container.querySelector('.rk-head')!,
      fill(excerpt('<div class="rk-head">', '</sc-if>\n      </div>', section('FA-19')), { MK }),
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Rahul Verma' })).toHaveAttribute(
      'tabindex',
      '-1',
    );
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent('Marking');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('the automatic marks strip, and its quiet line without choice questions', async () => {
    const marks = MK.auto.map((entry, index) => ({
      key: String(index),
      label: entry.t,
      mark: entry.m,
      result: entry.ok ? ('ok' as const) : ('no' as const),
    }));
    const { container, rerender } = inRoot(
      <FaAutoMarks
        title="Marked automatically"
        titleId="fa-mk-auto-h"
        figure={MK.autoText}
        marks={marks}
        none="This assessment has no choice questions."
      />,
    );
    const drawn = excerpt('<section class="fa-autos"', '</section>', section('FA-19'));
    expectSameMarkup(container.querySelector('section.fa-autos')!, fill(drawn, { MK }));
    expect(screen.getByRole('region', { name: 'Marked automatically' })).toBeVisible();
    await assertNoAxeViolations(container);
    rerender(
      <div className="xr rb">
        <FaAutoMarks
          title="Marked automatically"
          titleId="fa-mk-auto-h"
          figure="0 of 0 marks"
          marks={[]}
          none="This assessment has no choice questions."
        />
      </div>,
    );
    expectSameMarkup(
      container.querySelector('section.fa-autos')!,
      fill(drawn, { MK: { ...MK, autoText: '0 of 0 marks', hasAuto: false, noAuto: true } }),
    );
    expectV3ClassesOnly(container);
  });

  it('a choice question not marked yet is drawn with the clock, untoned', () => {
    const { container } = inRoot(
      <FaAutoMarks
        title="Marked automatically"
        titleId="a"
        figure="0 of 0 marks"
        marks={[
          {
            key: '1',
            label: 'Question 1 · Multiple choice',
            mark: 'Not marked yet',
            result: 'waiting',
          },
        ]}
        none="-"
      />,
    );
    const mark = container.querySelector('.fa-res')!;
    expect(mark).toHaveClass('fa-res--no');
    expect(mark).toHaveTextContent('Not marked yet');
  });

  it('a written question with the answer and the guidance', async () => {
    const w = MK.written[0]!;
    const { container } = inRoot(
      <FaSheetQuestion
        titleId={w.hid}
        title={w.head}
        marks={w.marks}
        text={w.t}
        answerTitle={w.ansH}
        answer={w.ans}
        guidance={{ title: 'Marking guidance · only you see this', text: w.guide }}
      />,
    );
    expectSameMarkup(
      container.querySelector('section.fa-sheetq')!,
      fill(excerpt('<section class="fa-sheetq"', '</section>', section('FA-19')), { w }),
    );
    expect(screen.getByRole('region', { name: 'Question 4 of 4 · Written answer' })).toBeVisible();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('the editable marks panel: the score, the feedback, the live total, Save mark, Confirm marks', async () => {
    const onChange = vi.fn();
    const x = MK.inputs[0]!;
    const { container } = inRoot(
      <FaMarksPanel id="fa-mk-panel" titleId="fa-mk-ph" title="Marks" note={MK.ofAll}>
        <FaMarkSection>
          <FaScoreField
            id={x.id}
            label={x.label}
            sub={x.sub}
            value=""
            onChange={onChange}
            outOf={x.outOf}
            hint={x.hint}
          />
          <FaMarkFeedback id="fa-mk-fb" label={MK.fbLabel} value="" onChange={onChange} />
        </FaMarkSection>
        <FaLiveTotal label="Total" total={MK.liveTotal} line={MK.liveTotalD} />
        <FaMarkSave button={<Button>Save mark</Button>} note="Saving keeps your mark editable." />
        <FaMarkConfirm
          button={
            <Button variant="primary" size="lg" id="fa-mk-confirm">
              Confirm marks
            </Button>
          }
          note="Confirmed marks can’t be changed."
        />
      </FaMarksPanel>,
    );
    const drawn = excerpt('<div class="rk-panel fa-mpanel"', '</sc-if>\n\n', section('FA-19'));
    // The editable state only (the confirmed `sc-if` follows; close the panel as the export does).
    expectSameMarkup(
      container.querySelector('.rk-panel.fa-mpanel')!,
      `${fill(drawn, { MK })}</div></div>`,
    );
    const field = screen.getByRole('textbox', { name: /^Your mark/ });
    expect(field).toHaveAccessibleName('Your mark Question 4 · written answer, out of 10');
    expect(field).toHaveAccessibleDescription('A whole number from 0 to 10.');
    fireEvent.change(field, { target: { value: '7' } });
    expect(onChange).toHaveBeenCalled();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
    expectNoReferences(container);
  });

  it('the score with the service’s error: invalid, described by the hint and the error', () => {
    const x = {
      ...MK.inputs[0]!,
      val: '12',
      hasErr: true,
      err: 'Enter a whole number from 0 to 10',
      inv: 'true',
      desc: 'fa-mk-Q-0106-h fa-mk-Q-0106-e',
    };
    const { container } = inRoot(
      <FaScoreField
        id={x.id}
        label={x.label}
        sub={x.sub}
        value="12"
        onChange={() => undefined}
        outOf={x.outOf}
        hint={x.hint}
        error={x.err}
      />,
    );
    expectSameMarkup(
      container.querySelector('.fa-score')!,
      fill(
        excerpt(
          '<div class="rk-field fa-score">',
          '</sc-if>\n                  </div>',
          section('FA-19'),
        ),
        { x },
      ),
    );
    const field = screen.getByRole('textbox');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription(
      'A whole number from 0 to 10. Enter a whole number from 0 to 10',
    );
  });

  it('Save mark once saved: the note is a polite status and a focus target', () => {
    const { container } = inRoot(
      <FaMarkSave
        button={<Button>Save mark</Button>}
        saved="Mark saved — not confirmed yet"
        savedId="fa-mk-saved"
        note="Saving keeps your mark editable."
      />,
    );
    expectSameMarkup(
      container.querySelector('.fa-save')!,
      fill(excerpt('<div class="fa-save">', '</div>', section('FA-19')), {
        MK: { ...MK, savedNote: true, notSaved: false },
      }),
    );
    expect(screen.getByRole('status')).toHaveAttribute('tabindex', '-1');
  });

  it('the confirmed, read-only panel: who and when, the total, the marks, the feedback, the release, what next', async () => {
    const DONE = {
      ...MK,
      editable: false,
      confirmed: true,
      confirmedBy: '7 Nov 2026, 10:15 · Dr S. Ranganathan',
      doneTotal: '11 of 16 marks',
      doneTotalD: 'Passed · pass mark 8',
      given: [{ k: 'Question 4', v: '7 of 10' }],
      fbCls: 'is-text',
      fbText: 'Good use of your own readings.',
      relDone: false,
      relNot: true,
      relLine:
        'Result not released to Rahul yet — after the deadline, 14 Nov 2026, 23:59, as set for this assessment.',
      hasNext: true,
      noNext: false,
    };
    const { container } = inRoot(
      <FaMarksDone
        id="fa-mk-done"
        title="Marks confirmed"
        by={DONE.confirmedBy}
        total={<FaDoneTotal total={DONE.doneTotal} outcome={DONE.doneTotalD} />}
        given={[{ key: 'q4', term: 'Question 4', value: '7 of 10' }]}
        feedback={{ term: 'Feedback', text: DONE.fbText, given: true }}
        release={<FaReleaseNote released={false}>{DONE.relLine}</FaReleaseNote>}
        actions={
          <>
            <a className="rb-btn rb-btn--primary rb-btn--lg" href="#FA-19">
              Next submission
            </a>
            <a className="rb-btn" href="#FA-12">
              See submissions
            </a>
          </>
        }
      />,
    );
    expectSameMarkup(
      container.querySelector('.fa-done')!,
      fill(
        excerpt(
          '<div class="fa-done" id="fa-mk-done"',
          '</sc-if>\n              </div>',
          section('FA-19'),
        ),
        {
          MK: DONE,
        },
      ).replace(/\n\s*<\/sc-if>$/, ''),
    );
    expect(container.querySelector('.fa-done')).toHaveAttribute('tabindex', '-1');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('several written answers: one feedback row each, in the same summary list; none without a written answer', async () => {
    const { container } = inRoot(
      <FaMarksDone
        id="fa-mk-done"
        title="Marks confirmed"
        by="7 Nov 2026, 10:15 · Dr S. Ranganathan"
        total={<FaDoneTotal total="13 of 17 marks" outcome="Passed · pass mark 8.5" />}
        given={[
          { key: 'q2', term: 'Question 2', value: '8 of 10' },
          { key: 'q3', term: 'Question 3', value: '3 of 5' },
        ]}
        feedback={[
          { key: 'f2', term: 'Feedback on question 2', text: 'Clear profile.', given: true },
          { key: 'f3', term: 'Feedback on question 3', text: 'No feedback', given: false },
        ]}
        actions={<p className="fa-quiet">Nothing else is waiting for marking.</p>}
      />,
    );
    const rows = [...container.querySelectorAll('dl.fa-sumdl > div')].map((row) => [
      row.querySelector('dt')!.textContent,
      row.querySelector('dd')!.textContent,
      row.querySelector('dd')!.className,
    ]);
    expect(rows).toEqual([
      ['Question 2', '8 of 10', ''],
      ['Question 3', '3 of 5', ''],
      ['Feedback on question 2', 'Clear profile.', 'is-text'],
      ['Feedback on question 3', 'No feedback', 'is-quiet'],
    ]);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
    const none = inRoot(
      <FaMarksDone
        id="fa-mk-done-2"
        title="Marks confirmed"
        by="7 Nov 2026, 10:15 · Dr S. Ranganathan"
        total={<FaDoneTotal total="6 of 6 marks" />}
        given={[{ key: 'auto', term: 'Marked automatically', value: '6 of 6 marks' }]}
        feedback={[]}
        actions={null}
      />,
    );
    expect(none.container.querySelectorAll('dl.fa-sumdl > div')).toHaveLength(1);
  });

  it('a released result is the tick note', () => {
    const { container } = inRoot(
      <FaReleaseNote released>
        Result released to Rahul when the deadline passed: 14 Nov 2026, 23:59.
      </FaReleaseNote>,
    );
    const MKr = {
      relDone: true,
      relNot: false,
      relLine: 'Result released to Rahul when the deadline passed: 14 Nov 2026, 23:59.',
    };
    expectSameMarkup(
      container.querySelector('p')!,
      fill(
        excerpt('<sc-if value="{{ MK.relDone }}"', '</sc-if>', section('FA-19')).replace(
          /^<sc-if[^>]*>|<\/sc-if>$/g,
          '',
        ),
        { MK: MKr },
      ),
    );
  });

  it('the layout: “Go to the marks” moves focus to the panel; the sheet beside the aside', async () => {
    const { container } = inRoot(
      <FaMarkLayout
        goToLabel="Go to the marks"
        panelId="fa-mk-panel"
        panelTitleId="fa-mk-ph"
        sheet={<p>sheet</p>}
        panel={
          <FaMarksPanel id="fa-mk-panel" titleId="fa-mk-ph" title="Marks">
            <p>body</p>
          </FaMarksPanel>
        }
      />,
    );
    const wrap = container.querySelector('.rk-detailwrap')!;
    expect(wrap.firstElementChild).toHaveClass('fa-gomark');
    const detail = wrap.querySelector('.rk-detail')!;
    expect(detail.firstElementChild).toHaveClass('rk-surface', 'rk-mainsheet', 'fa-sheet');
    expect(detail.lastElementChild).toHaveAttribute('aria-labelledby', 'fa-mk-ph');
    Element.prototype.scrollIntoView = vi.fn();
    fireEvent.click(screen.getByRole('link', { name: 'Go to the marks' }));
    expect(document.getElementById('fa-mk-panel')).toHaveFocus();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

// ---- FA-20 ------------------------------------------------------------------------------------

describe('FA-20: the roster’s pieces and the summary are the export’s', () => {
  it('a Student’s formats in a row, named in words', async () => {
    const r = {
      fmAria: 'Progress by format: WEB completed 14 Oct 2026, VR in progress',
      fm: [
        { code: 'WEB', cls: 'xr-st xr-st--ok', t: 'Completed', hasD: true, d: '14 Oct 2026' },
        { code: 'VR', cls: 'xr-st xr-st--info', t: 'In progress', hasD: false, d: '' },
      ],
    };
    const { container } = inRoot(
      <FaStudentsFormatCell
        label={r.fmAria}
        formats={[
          { key: 'web', code: 'WEB', status: pill('ok', 'Completed'), date: '14 Oct 2026' },
          { key: 'vr', code: 'VR', status: pill('info', 'In progress') },
        ]}
      />,
    );
    expectSameMarkup(
      container.querySelector('ul.fa-fmcell')!,
      fill(excerpt('<ul class="fa-fmcell"', '</ul>', section('FA-20')), { r }),
    );
    expect(screen.getByRole('list', { name: r.fmAria })).toBeVisible();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('the last activity, with the inactivity tag from 14 days', () => {
    const r = {
      last: 'None since access was given (12 Oct 2026)',
      inactive: true,
      inText: 'Inactive 26 days',
    };
    const { container } = inRoot(
      <div className="probe">
        <FaStudentsLastActivity last={r.last} inactive={r.inText} />
      </div>,
    );
    const cell = excerpt('<span class="fa-lastv">', '</sc-if>', section('FA-20'));
    expect(comparable(container.querySelector('.probe')!.innerHTML)).toBe(
      comparable(fill(cell, { r })),
    );
  });

  it('the per-format summary of every Student with access', async () => {
    const SL = {
      sumH: 'All 5 students with access, by format',
      sumAria: 'Progress by format for all students with access to Shell-and-Tube Heat Exchanger',
      sum: [
        {
          code: 'WEB',
          unitsCls: 'fa-units',
          units: ['is-done', 'is-done', 'is-prog', 'is-prog', ''],
          done: '2',
          prog: '2',
          none: '1',
        },
      ],
    };
    const { container } = inRoot(
      <FaStudentsSummary
        titleId="fa-sl-sumh"
        title={SL.sumH}
        label={SL.sumAria}
        words={{ completed: 'completed', inProgress: 'in progress', notStarted: 'not started' }}
        rows={[
          {
            format: 'WEB',
            completed: 2,
            inProgress: 2,
            notStarted: 1,
            units: ['done', 'done', 'progress', 'progress', 'none'],
          },
        ]}
      />,
    );
    expectSameMarkup(
      container.querySelector('.fa-slsum')!,
      fill(excerpt('<div class="fa-slsum"', '</ul>\n          </div>', section('FA-20')), {
        SL,
      }).replace(/<i class=""><\/i>/g, '<i></i>'),
    );
    expect(screen.getByRole('group', { name: SL.sumH })).toBeVisible();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

// ---- FA-21 ------------------------------------------------------------------------------------

describe('FA-21: a Student’s sections are the export’s', () => {
  it('progress by format, with its “as of” line and the per-format note', async () => {
    const SD = {
      asOf: 'as of 7 Nov 2026',
      fm: [
        { code: 'WEB', cls: 'xr-st xr-st--ok', t: 'Completed', hasD: true, d: '14 Oct 2026' },
        { code: 'VR', cls: 'xr-st', t: 'Not started', hasD: false, d: '' },
      ],
    };
    const { container } = inRoot(
      <FaStudentSection
        titleId="fa-sd-fm"
        title="Progress by format"
        aside={SD.asOf}
        note="Per format only — there is no overall percentage or verdict."
      >
        <FaStudentFormatList
          label="Progress by format"
          formats={[
            { key: 'web', code: 'WEB', status: pill('ok', 'Completed'), date: '14 Oct 2026' },
            { key: 'vr', code: 'VR', status: pill('neutral', 'Not started') },
          ]}
        />
      </FaStudentSection>,
    );
    expectSameMarkup(
      container.querySelector('section.rk-sec')!,
      fill(
        excerpt(
          '<section class="rk-sec" aria-labelledby="fa-sd-fm">',
          '</section>',
          section('FA-21'),
        ),
        {
          SD,
        },
      ),
    );
    expect(screen.getByRole('region', { name: 'Progress by format' })).toBeVisible();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('the resources opened or not, with the feedback note (the shared resource list)', async () => {
    const SD = {
      res: [
        {
          t: 'Lab brief — Shell-and-Tube Heat Exchanger',
          st: 'Opened 12 Oct 2026, 09:40',
          cls: 'rk-next',
        },
        { t: 'Readings sheet', st: 'Not opened', cls: 'fa-quiet' },
      ],
    };
    const { container } = inRoot(
      <FaStudentSection
        titleId="fa-sd-res"
        title="Resources"
        note="Feedback students give on a format isn’t shown to Faculty."
      >
        <FaResourceList
          resources={SD.res.map((entry, index) => ({
            key: String(index),
            title: entry.t,
            status: { words: entry.st, opened: entry.cls === 'rk-next' },
          }))}
        />
      </FaStudentSection>,
    );
    expectSameMarkup(
      container.querySelector('section.rk-sec')!,
      // The export's `span.fa-res-t` is defined by no sheet: the title is a plain `span`.
      fill(
        excerpt(
          '<section class="rk-sec" aria-labelledby="fa-sd-res">',
          '</section>',
          section('FA-21'),
        ),
        {
          SD,
        },
      ).replace(/<span class="fa-res-t">/g, '<span>'),
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
    within(container as HTMLElement).getByText('Opened 12 Oct 2026, 09:40');
  });
});
