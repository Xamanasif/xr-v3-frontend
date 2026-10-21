/**
 * What only the Student's assessment screens draw (owner-approved export design/v3-refined-b/roles/
 * ST-v1, `project/StudentFinal.dc.html`: the hub's Assessment tab, ST-11, ST-12, ST-13 with its
 * submit dialog, ST-14; `project/v3-student-final.css`): each piece rendered with sample values and
 * checked against the export's template excerpt it stands for (the classes, the structure and the
 * ARIA), then its behaviour (the tab choice kept on the page, the jump links that move focus, the
 * save state's live region), the class contract, the accessibility checks and no internal
 * reference (no assessment, attempt or record id) anywhere a piece draws.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectNoInternalReferences,
  expectV3ClassesOnly,
  stExportText,
} from '../testing/index.js';
import { Button, ButtonLink } from './actions.js';
import { V3_ICON_PATHS } from './icons.js';
import {
  StAssessFacts,
  StAssessListCard,
  StAssessmentCard,
  StAssessWhen,
  StAttemptAllAnswered,
  StAttemptChoices,
  StAttemptDone,
  StAttemptFrame,
  StAttemptHead,
  StAttemptLayout,
  StAttemptPending,
  StAttemptQuestion,
  StAttemptSave,
  StAttemptStrip,
  StAttemptSubmit,
  StAttemptWritten,
  StIntroCard,
  StIntroExperimentLink,
  StResultAnswer,
  StResultReview,
  StScoreCard,
} from './st-assess.js';
import { StTabs } from './st.js';

const MAIN = stExportText('StudentFinal.dc.html');
const TEMPLATE = MAIN.slice(0, MAIN.indexOf('<script type="text/x-dc"'));
const section = (from: string, to: string) =>
  TEMPLATE.slice(TEMPLATE.indexOf(from), TEMPLATE.indexOf(to, TEMPLATE.indexOf(from)));
const TAB = section('<!-- Hub · Assessment tab', '<!-- ══════════ ST-08 WEB');
const LIST = section('<!-- ══════════ ST-11 Assessments', '<!-- ══════════ ST-12');
const INTRO = section('<!-- ══════════ ST-12', '<!-- ══════════ ST-14');
const RESULT = section('<!-- ══════════ ST-14', '<!-- ══════════ ST-18');
const ATTEMPT = section('<!-- ══════════ Focused task layouts', '<!-- ══════════ ST-08a');
const DIALOG = section('<!-- ══════════ Dialog: submit answers', '<!-- ══════════ Menu drawer');

/** The export's sprite (`sti-*`), by id. */
const SYMBOLS = new Map(
  [...MAIN.matchAll(/<symbol id="(sti-[\w-]+)" viewBox="0 0 24 24"><path d="([^"]+)"/g)].map(
    (match) => [match[1] ?? '', match[2] ?? ''] as const,
  ),
);
const pathOf = (element: Element | null) => element?.querySelector('path')?.getAttribute('d');
/** Every record reference the Student rule keeps out, the assessment's and attempt's too. */
const STUDENT_REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|ATT|ASMT|Q)-\d+/;

function expectClean(container: Element) {
  expectV3ClassesOnly(container);
  expectNoInternalReferences(container);
  expect(container.textContent ?? '').not.toMatch(STUDENT_REFERENCE);
  for (const element of container.querySelectorAll('[aria-label]'))
    expect(element.getAttribute('aria-label') ?? '').not.toMatch(STUDENT_REFERENCE);
}

const WHEN = { day: '14 Nov', time: '23:59 · in 9 days' } as const;

describe('the date block and the hub’s Assessment tab', () => {
  it('the date block (`div.sv-when`, ivory when due soon)', async () => {
    for (const piece of [
      '<div class="{{ AT1.when.cls }}"><p class="sv-when-d">{{ AT1.when.d }}</p><p class="sv-when-t">{{ AT1.when.t }}</p></div>',
    ]) {
      expect(TAB).toContain(piece);
    }
    const { container } = render(
      <>
        <StAssessWhen {...WHEN} />
        <StAssessWhen day="7 Nov" time="23:59 · tomorrow" soon />
      </>,
    );
    const [plain, soon] = [...container.querySelectorAll('div')];
    expect(plain!.outerHTML).toBe(
      '<div class="sv-when"><p class="sv-when-d">14 Nov</p><p class="sv-when-t">23:59 · in 9 days</p></div>',
    );
    expect(soon).toHaveClass('sv-when', 'sv-when--soon');
    expectClean(container);
    await assertNoAxeViolations(container);
  });

  it('the card (`section.sv-card.sv-atab`): date lead, kicker, name, line, status, facts, one action', async () => {
    for (const piece of [
      '<section class="sv-card sv-atab" aria-labelledby="st-ha-h">',
      '<div class="sv-atab-when">',
      '<p class="sv-eyebrow">{{ AT1.whenK }}</p>',
      '<p class="sv-eyebrow">Assessment</p>',
      '<h2 class="sv-atab-t" id="st-ha-h">{{ AT1.name }}</h2>',
      '<p class="sv-atab-d">{{ AT1.desc }}</p>',
      '<p class="sv-li-m"><span class="{{ AT1.pillCls }}"><i></i>{{ AT1.pill }}</span><sc-if value="{{ AT1.hasState }}" hint-placeholder-val="{{ false }}"><span>{{ AT1.state }}</span></sc-if></p>',
      '<p class="sv-atab-f">{{ AT1.facts }}</p>',
      '<div class="sv-atab-act"><a class="{{ AT1.act.cls }}" href="{{ AT1.act.href }}" onClick="{{ AT1.act.go }}" aria-label="{{ AT1.act.aria }}">{{ AT1.act.label }}</a></div>',
    ]) {
      expect(TAB).toContain(piece);
    }
    const { container } = render(
      <StAssessmentCard
        titleId="st-ha-h"
        whenKicker="Due"
        when={WHEN}
        kicker="Assessment"
        name="Heat Exchanger — post-lab"
        description="Four short questions."
        status={{ tone: 'warn', words: 'Attempt in progress' }}
        state="Your answers are saved"
        facts="4 questions · 16 marks · pass mark 50% · 2 attempts · no time limit"
        action={{
          href: '/a',
          label: 'Continue attempt',
          ariaLabel: 'Continue attempt, Heat Exchanger — post-lab',
          primary: true,
        }}
      />,
    );
    const cardNode = screen.getByRole('region', { name: 'Heat Exchanger — post-lab' });
    expect(cardNode).toHaveClass('sv-card', 'sv-atab');
    expect([...cardNode.children].map((child) => child.className)).toEqual([
      'sv-atab-when',
      'sv-atab-main',
      'sv-atab-act',
    ]);
    expect(cardNode.querySelector('.sv-li-m')!.innerHTML).toBe(
      '<span class="xr-st xr-st--warn"><i></i>Attempt in progress</span><span>Your answers are saved</span>',
    );
    expect(
      within(cardNode).getByRole('link', { name: 'Continue attempt, Heat Exchanger — post-lab' }),
    ).toHaveAttribute('class', 'rb-btn rb-btn--primary');
    expectClean(container);
    await assertNoAxeViolations(container);
  });

  it('to do: no words after the status; a plain button when it is not the primary', () => {
    render(
      <StAssessmentCard
        titleId="t"
        whenKicker="Deadline"
        kicker="Assessment"
        name="Post-lab"
        status={{ tone: 'ok', words: 'Result ready' }}
        state={null}
        facts="4 questions"
        action={{ href: '/r', label: 'See result' }}
      />,
    );
    const cardNode = screen.getByRole('region', { name: 'Post-lab' });
    expect(cardNode.querySelectorAll('.sv-li-m > span')).toHaveLength(1);
    expect(cardNode.querySelector('.sv-when')).toBeNull();
    expect(cardNode.querySelector('.sv-atab-d')).toBeNull();
    expect(within(cardNode).getByRole('link', { name: 'See result' })).toHaveAttribute(
      'class',
      'rb-btn',
    );
  });
});

describe('ST-11 Assessments', () => {
  it('the state tabs (`nav.rk-tabs.sv-tabs`) with their counts; a choice stays on the page', async () => {
    for (const piece of [
      '<nav class="rk-tabs sv-tabs" aria-label="Assessments">',
      '<a class="rk-tab" href="{{ t.href }}" aria-current="{{ t.cur }}" onClick="{{ t.go }}">{{ t.t }}<sc-if value="{{ t.hasN }}" hint-placeholder-val="{{ true }}"><span class="st-tabn" aria-hidden="true">{{ t.n }}</span><span class="xr-sr">, {{ t.n }}</span></sc-if></a>',
    ]) {
      expect(LIST).toContain(piece);
    }
    const onSelect = vi.fn();
    const { container, rerender } = render(
      <StTabs
        label="Assessments"
        onSelect={onSelect}
        tabs={[
          { key: 'to-do', href: '/s', label: 'To do', current: true, count: 1 },
          { key: 'submitted', href: '/s?tab=submitted', label: 'Submitted', count: 0 },
          { key: 'results', href: '/s?tab=results', label: 'Results', count: 0 },
        ]}
      />,
    );
    const nav = screen.getByRole('navigation', { name: 'Assessments' });
    expect(nav).toHaveClass('rk-tabs', 'sv-tabs');
    const first = within(nav).getByRole('link', { name: 'To do, 1' });
    expect(first.innerHTML).toBe(
      'To do<span class="st-tabn" aria-hidden="true">1</span><span class="xr-sr">, 1</span>',
    );
    expect(first).toHaveAttribute('aria-current', 'page');
    fireEvent.click(within(nav).getByRole('link', { name: 'Submitted, 0' }));
    expect(onSelect).toHaveBeenCalledWith('submitted');
    expectClean(container);
    await assertNoAxeViolations(container);
    // Loading or failed: no count.
    rerender(<StTabs label="Assessments" tabs={[{ key: 'to-do', href: '/s', label: 'To do' }]} />);
    expect(screen.getByRole('link', { name: 'To do' }).querySelector('.st-tabn')).toBeNull();
    expect(() =>
      render(
        <StTabs
          label="x"
          tabs={[
            { key: 'a', href: '/a', label: 'A', current: true },
            { key: 'b', href: '/b', label: 'B', current: true },
          ]}
        />,
      ),
    ).toThrow(/at most one tab/);
  });

  it('the card (`section.sv-card.sv-alist`) named by its tab, and the experiments fact list', async () => {
    for (const piece of [
      '<section class="sv-card sv-alist" aria-labelledby="st-al-h">',
      '<h2 class="xr-sr" id="st-al-h">{{ AL.tabTitle }}</h2>',
      '<ul class="sv-facts" aria-label="Your experiments">',
      '<li><span class="sv-facts-main"><span class="sv-facts-t">{{ e.t }}</span><span class="sv-facts-c">{{ e.c }}</span></span><span class="sv-facts-s">{{ e.s }}</span></li>',
    ]) {
      expect(LIST).toContain(piece);
    }
    const { container } = render(
      <>
        <StAssessListCard title="To do" titleId="st-al-h">
          <p>rows</p>
        </StAssessListCard>
        <StAssessFacts
          label="Your experiments"
          items={[
            {
              key: 'shell',
              title: 'Shell-and-Tube Heat Exchanger',
              course: 'MEC-523 · Thermodynamics and Heat Transfer',
              state: 'No assessment set yet',
            },
          ]}
        />
      </>,
    );
    expect(screen.getByRole('region', { name: 'To do' })).toHaveClass('sv-card', 'sv-alist');
    expect(screen.getByRole('list', { name: 'Your experiments' }).innerHTML).toBe(
      '<li><span class="sv-facts-main"><span class="sv-facts-t">Shell-and-Tube Heat Exchanger</span><span class="sv-facts-c">MEC-523 · Thermodynamics and Heat Transfer</span></span><span class="sv-facts-s">No assessment set yet</span></li>',
    );
    expectClean(container);
    await assertNoAxeViolations(container);
  });
});

describe('ST-12 Before you start', () => {
  it('the experiment in the eyebrow (`a.st-eyelink`)', () => {
    expect(INTRO).toContain(
      '<p class="rk-eyebrow"><a class="st-eyelink" href="{{ AI.expLink.href }}" onClick="{{ AI.expLink.go }}">{{ AI.exp }}</a> · assessment</p>',
    );
    const { container } = render(
      <StIntroExperimentLink href="/hub">Shell-and-Tube Heat Exchanger</StIntroExperimentLink>,
    );
    expect(container.innerHTML).toBe(
      '<a class="st-eyelink" href="/hub">Shell-and-Tube Heat Exchanger</a>',
    );
  });

  it('the card (`section.sv-card.sv-ai`): status, state, line, rules, actions, deadline and facts', async () => {
    for (const piece of [
      '<section class="sv-card sv-ai" aria-labelledby="st-ai-state">',
      '<div class="sv-ai-state">',
      '<p><span class="{{ AI.pillCls }}"><i></i>{{ AI.pill }}</span></p>',
      '<h2 class="sv-sec-t" id="st-ai-state">{{ AI.st.t }}</h2>',
      '<p class="sv-ai-d" role="status">{{ AI.st.d }}</p>',
      '<ul class="sv-rules" aria-label="How answering works">',
      '<li><span class="sv-rules-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#sti-clock"></use></svg></span><p><b>No time limit</b></p></li>',
      '<p><b>Nothing is submitted until you choose Submit</b><span>You can’t change answers after submitting.</span></p>',
      '<div class="sv-ai-act">',
      '<div class="sv-ai-facts" role="group" aria-labelledby="st-ai-facts">',
      '<h2 class="xr-sr" id="st-ai-facts">Key facts, as set for this assessment</h2>',
      '<div class="sv-ai-when"><p class="sv-eyebrow">Deadline</p><div class="{{ AI.when.cls }}"><p class="sv-when-d">{{ AI.when.d }}</p><p class="sv-when-t">{{ AI.when.t }}</p></div><p class="xr-sr">{{ AI.deadline }}</p></div>',
      '<dl class="sv-ai-dl">',
      '<div><dt>{{ f.k }}</dt><dd>{{ f.v }}<sc-if value="{{ f.hasS }}" hint-placeholder-val="{{ true }}"><small>{{ f.s }}</small></sc-if></dd></div>',
      '<div><dt>Set by</dt><dd>{{ AI.setBy }}</dd></div>',
    ]) {
      expect(INTRO).toContain(piece);
    }
    const { container } = render(
      <StIntroCard
        stateId="st-ai-state"
        status={{ tone: 'warn', words: 'Attempt in progress' }}
        stateTitle="Attempt 1 in progress"
        stateLine="Your answers are saved. 2 questions of 4 answered."
        rules={{
          label: 'How answering works',
          items: [
            { key: 'time', icon: 'clock', title: 'No time limit' },
            { key: 'saves', icon: 'check', title: 'Answers save as you go' },
            {
              key: 'submit',
              icon: 'lock',
              title: 'Nothing is submitted until you choose Submit',
              detail: 'You can’t change answers after submitting.',
            },
          ],
        }}
        actions={
          <>
            <ButtonLink variant="primary" size="lg" href="/attempt">
              Continue attempt
            </ButtonLink>
            <ButtonLink size="lg" href="/hub">
              Back to experiment
            </ButtonLink>
          </>
        }
        factsId="st-ai-facts"
        factsTitle="Key facts, as set for this assessment"
        deadline={{ kicker: 'Deadline', when: WHEN, full: '14 Nov 2026, 23:59' }}
        facts={[
          {
            key: 'q',
            term: 'Questions',
            value: 4,
            detail: '2 multiple choice · 1 true or false · 1 written answer',
          },
          { key: 'm', term: 'Total marks', value: 16 },
          { key: 's', term: 'Set by', value: 'Dr S. Ranganathan' },
        ]}
      />,
    );
    const cardNode = screen.getByRole('region', { name: 'Attempt 1 in progress' });
    expect(cardNode).toHaveClass('sv-card', 'sv-ai');
    expect(within(cardNode).getByRole('status')).toHaveTextContent(
      'Your answers are saved. 2 questions of 4 answered.',
    );
    const rules = within(cardNode).getByRole('list', { name: 'How answering works' });
    expect([...rules.querySelectorAll('.sv-rules-ico')].map(pathOf)).toEqual([
      SYMBOLS.get('sti-clock'),
      SYMBOLS.get('sti-check'),
      SYMBOLS.get('sti-lock'),
    ]);
    expect(rules.lastElementChild!.querySelector('p')!.innerHTML).toBe(
      '<b>Nothing is submitted until you choose Submit</b><span>You can’t change answers after submitting.</span>',
    );
    const facts = within(cardNode).getByRole('group', {
      name: 'Key facts, as set for this assessment',
    });
    expect(facts.querySelector('.sv-ai-when')!.innerHTML).toBe(
      '<p class="sv-eyebrow">Deadline</p><div class="sv-when"><p class="sv-when-d">14 Nov</p><p class="sv-when-t">23:59 · in 9 days</p></div><p class="xr-sr">14 Nov 2026, 23:59</p>',
    );
    expect(facts.querySelector('dl.sv-ai-dl')!.innerHTML).toBe(
      '<div><dt>Questions</dt><dd>4<small>2 multiple choice · 1 true or false · 1 written answer</small></dd></div><div><dt>Total marks</dt><dd>16</dd></div><div><dt>Set by</dt><dd>Dr S. Ranganathan</dd></div>',
    );
    expectClean(container);
    await assertNoAxeViolations(container);
  });
});

describe('ST-13 the focused attempt', () => {
  it('the frame: its own V3 root, the bar (way out, save state, avatar) and the page', async () => {
    for (const piece of [
      '<div class="st-focus">',
      '<header class="st-focusbar">',
      '<a class="st-exit st-exit--compact" href="{{ AT.exit.href }}" onClick="{{ AT.exit.go }}"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#sti-left"></use></svg><span>{{ AT.exitLabel }}</span></a>',
      '<div class="st-focusbar-mid"></div>',
      '<div class="st-focusbar-end">',
      '<span class="xr-avatar" aria-hidden="true">{{ S.ini }}</span>',
      '<main class="st-focuspage st-main" id="st-main" tabindex="-1">',
    ]) {
      expect(ATTEMPT).toContain(piece);
    }
    const { container } = render(
      <StAttemptFrame
        skipLabel="Skip to main content"
        exit={{ href: '/intro', label: 'Heat Exchanger — post-lab' }}
        save={<StAttemptSave state="idle" words="Answers save automatically" />}
        initials="RV"
      >
        <p>content</p>
      </StAttemptFrame>,
    );
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('class', 'xr rb');
    expect([...root.children].map((child) => child.className)).toEqual(['xs-skip', 'st-focus']);
    const bar = root.querySelector('header.st-focusbar')!;
    const exit = within(bar as HTMLElement).getByRole('link', {
      name: 'Heat Exchanger — post-lab',
    });
    expect(exit).toHaveAttribute('class', 'st-exit st-exit--compact');
    expect(pathOf(exit)).toBe(SYMBOLS.get('sti-left'));
    expect(bar.querySelector('.xr-avatar')).toHaveAttribute('aria-hidden', 'true');
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('class', 'st-focuspage st-main');
    expect(main).toHaveAttribute('id', 'main');
    expect(main).toHaveAttribute('tabindex', '-1');
    fireEvent.click(screen.getByRole('link', { name: 'Skip to main content' }));
    expect(main).toHaveFocus();
    expectClean(container);
    await assertNoAxeViolations(container);
  });

  it('the save state (`p.st-save`): idle, saving, saved; a failure with Try again is an alert', () => {
    for (const piece of [
      '<p class="st-save"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#sti-info"></use></svg>Answers save automatically</p>',
      '<p class="st-save st-save--ok"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#sti-check"></use></svg>All answers saved</p>',
      '<p class="st-save st-save--err"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#sti-alert"></use></svg>Your last answer didn’t save<button type="button" onClick="{{ AT.retrySave }}">Try again</button></p>',
    ]) {
      expect(ATTEMPT).toContain(piece);
    }
    const onRetry = vi.fn();
    const { rerender } = render(<StAttemptSave state="idle" words="Answers save automatically" />);
    expect(pathOf(screen.getByRole('status'))).toBe(SYMBOLS.get('sti-info'));
    rerender(<StAttemptSave state="saving" words="Saving…" />);
    expect(pathOf(screen.getByRole('status'))).toBe(SYMBOLS.get('sti-clock'));
    rerender(<StAttemptSave state="saved" words="All answers saved" />);
    expect(screen.getByRole('status').firstElementChild).toHaveAttribute(
      'class',
      'st-save st-save--ok',
    );
    rerender(
      <StAttemptSave
        state="failed"
        words="Your last answer didn’t save"
        retryLabel="Try again"
        onRetry={onRetry}
      />,
    );
    const alert = screen.getByRole('alert');
    expect(alert.firstElementChild).toHaveAttribute('class', 'st-save st-save--err');
    expect(pathOf(alert)).toBe(SYMBOLS.get('sti-alert'));
    fireEvent.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('the head, the questions (choice and written), the strip and Submit', async () => {
    for (const piece of [
      '<div class="sv-focushead">',
      '<p class="sv-act-k"><span>{{ AT.exp }}</span><span aria-hidden="true">·</span><span>{{ AT.attemptText }}</span></p>',
      '<p class="sv-focus-sub">{{ AT.meta }}</p>',
      '<div class="st-att">',
      '<div class="st-att-qs">',
      '<ol class="sv-card sv-qs" aria-label="Questions">',
      '<section class="sv-q" id="{{ q.anchor }}" tabindex="-1" aria-labelledby="{{ q.hid }}">',
      '<span class="{{ q.numCls }}" aria-hidden="true">{{ q.n }}</span>',
      '<div class="sv-q-h"><h2 class="sv-q-k" id="{{ q.hid }}">{{ q.label }}</h2><p class="sv-q-m">{{ q.marksText }}</p></div>',
      '<fieldset class="st-qfs sv-qfs"><legend>{{ q.text }}</legend>',
      '<label class="rk-choice" for="{{ o.id }}"><input type="radio" name="{{ q.name }}" id="{{ o.id }}" checked="{{ o.checked }}" onChange="{{ o.pick }}"><span class="rk-choice-t">{{ o.lab }}</span></label>',
      '<div class="st-q-w sv-q-w"><label for="{{ q.tid }}">{{ q.text }}</label><p class="rk-hint" id="{{ q.hintId }}">Your faculty marks written answers.</p><textarea id="{{ q.tid }}" class="rk-textarea" aria-describedby="{{ q.hintId }}"',
      '<div class="st-att-side sv-attside">',
      '<section class="st-att-panel st-att-strip sv-attpanel" aria-labelledby="st-strip-h">',
      '<div class="sv-attpanel-h"><h2 class="sv-h3" id="st-strip-h">Your answers</h2><p class="sv-attcount" role="status">{{ AT.countText }}</p></div>',
      '<ol class="st-strip"><sc-for list="{{ AT.strip }}" as="s" hint-placeholder-count="4"><li><a href="{{ s.href }}" class="{{ s.cls }}" aria-label="{{ s.aria }}" onClick="{{ s.go }}">{{ s.n }}</a></li></sc-for></ol>',
      '<button type="button" class="rb-btn sv-attnext" onClick="{{ AT.nextUn }}">Next unanswered</button>',
      '<section class="st-att-panel st-att-submit sv-attpanel" aria-labelledby="st-sub-h">',
      '<h2 class="xr-sr" id="st-sub-h">Submit your answers</h2>',
      '<div class="rk-errsum sv-attsuberr" id="st-suberr" tabindex="-1" role="alert"><p class="rk-errsum-t">Your answers weren’t submitted</p><p class="st-errsum-d">They’re still saved here. Try again.</p></div>',
      '<p class="sv-attnote">Nothing is submitted until you choose Submit. You can’t change answers after submitting.</p>',
      '<button type="button" class="rb-btn rb-btn--primary rb-btn--lg" id="st-submit" onClick="{{ AT.submit }}">Submit</button>',
    ]) {
      expect(ATTEMPT).toContain(piece);
    }
    const onChoose = vi.fn();
    const onNext = vi.fn();
    const onSubmit = vi.fn();
    const { container } = render(
      <main>
        <StAttemptHead
          experiment="Shell-and-Tube Heat Exchanger"
          attempt="Attempt 1 of 2"
          title="Heat Exchanger — post-lab"
          meta="4 questions · 16 marks · due 14 Nov 2026, 23:59 · no time limit"
        />
        <StAttemptLayout
          questionsLabel="Questions"
          questions={
            <>
              <StAttemptQuestion
                id="q1"
                headingId="q1-h"
                number={1}
                done
                label="Question 1 of 2 · Multiple choice"
                marks="2 marks"
              >
                <StAttemptChoices
                  legend="What does ε compare?"
                  name="q1"
                  onChoose={onChoose}
                  options={[
                    { id: 'q1-A', label: 'The actual heat transfer', checked: true },
                    { id: 'q1-B', label: 'The flow rates', checked: false },
                  ]}
                />
              </StAttemptQuestion>
              <StAttemptQuestion
                id="q2"
                headingId="q2-h"
                number={2}
                done={false}
                label="Question 2 of 2 · Written answer"
                marks="10 marks"
              >
                <StAttemptWritten
                  id="q2-t"
                  label="Explain how fouling changes the exchanger’s performance."
                  hint="Your faculty marks written answers."
                  value=""
                  onChange={() => undefined}
                />
              </StAttemptQuestion>
            </>
          }
          side={
            <>
              <StAttemptStrip
                title="Your answers"
                titleId="strip-h"
                count="1 of 2 answered"
                items={[
                  { number: 1, targetId: 'q1', done: true, label: 'Question 1, answered' },
                  { number: 2, targetId: 'q2', done: false, label: 'Question 2, not answered' },
                ]}
                next={{ label: 'Next unanswered', onNext }}
              />
              <StAttemptSubmit
                titleId="sub-h"
                title="Submit your answers"
                failure={{
                  id: 'suberr',
                  title: 'Your answers weren’t submitted',
                  line: 'They’re still saved here. Try again.',
                }}
                note="Nothing is submitted until you choose Submit. You can’t change answers after submitting."
                submitLabel="Submit"
                onSubmit={onSubmit}
              />
            </>
          }
        />
      </main>,
    );
    expect(container.querySelector('.sv-act-k')!.innerHTML).toBe(
      '<span>Shell-and-Tube Heat Exchanger</span><span aria-hidden="true">·</span><span>Attempt 1 of 2</span>',
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('class', 'rb-h1');
    expect(screen.getByRole('list', { name: 'Questions' })).toHaveClass('sv-card', 'sv-qs');
    const q1 = screen.getByRole('region', { name: 'Question 1 of 2 · Multiple choice' });
    expect(q1.querySelector('.sv-q-n')).toHaveAttribute('class', 'sv-q-n is-done');
    expect(screen.getByRole('group', { name: 'What does ε compare?' })).toHaveClass(
      'st-qfs',
      'sv-qfs',
    );
    expect(screen.getByRole('radio', { name: 'The actual heat transfer' })).toBeChecked();
    fireEvent.click(screen.getByRole('radio', { name: 'The flow rates' }));
    expect(onChoose).toHaveBeenCalledWith('q1-B');
    expect(
      screen.getByRole('textbox', { name: /Explain how fouling/ }),
    ).toHaveAccessibleDescription('Your faculty marks written answers.');
    const strip = screen.getByRole('region', { name: 'Your answers' });
    expect(within(strip).getByRole('status')).toHaveTextContent('1 of 2 answered');
    expect(within(strip).getByRole('link', { name: 'Question 1, answered' })).toHaveClass(
      'is-done',
    );
    fireEvent.click(within(strip).getByRole('link', { name: 'Question 2, not answered' }));
    expect(screen.getByRole('region', { name: 'Question 2 of 2 · Written answer' })).toHaveFocus();
    fireEvent.click(within(strip).getByRole('button', { name: 'Next unanswered' }));
    expect(onNext).toHaveBeenCalledOnce();
    const submit = screen.getByRole('region', { name: 'Submit your answers' });
    expect(within(submit).getByRole('alert')).toHaveAttribute('class', 'rk-errsum sv-attsuberr');
    const button = within(submit).getByRole('button', { name: 'Submit' });
    expect(button).toHaveAttribute('class', 'rb-btn rb-btn--primary rb-btn--lg');
    fireEvent.click(button);
    expect(onSubmit).toHaveBeenCalledOnce();
    expectClean(container);
    await assertNoAxeViolations(container);
  });

  it('the dialog’s lines (`p.rk-pending`, `p.rk-next`) and “Answers submitted” (`sv-act-card`)', async () => {
    for (const piece of [
      '<p class="rk-pending"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#sti-alert"></use></svg><span>{{ AT.missText }} You can still submit.</span></p>',
      '<p class="rk-next">All {{ AT.nq }} questions are answered.</p>',
    ]) {
      expect(DIALOG).toContain(piece);
    }
    for (const piece of [
      '<section class="sv-card sv-act-card" id="st-att-done" tabindex="-1" aria-labelledby="st-att-done-h">',
      '<p><span class="xr-st xr-st--warn rk-st-lg"><i></i>Waiting for marking</span></p>',
      '<h2 class="sv-sec-t" id="st-att-done-h">Answers submitted</h2>',
      '<p class="sv-act-d">{{ AT.doneText }}</p>',
      '<div class="sv-act-go">',
    ]) {
      expect(ATTEMPT).toContain(piece);
    }
    const { container } = render(
      <>
        <StAttemptPending>
          2 questions aren’t answered (3, 4). You can still submit.
        </StAttemptPending>
        <StAttemptAllAnswered>All 4 questions are answered.</StAttemptAllAnswered>
        <StAttemptDone
          id="done"
          titleId="done-h"
          status={{ tone: 'warn', words: 'Waiting for marking' }}
          title="Answers submitted"
          text="Submitted 5 Nov 2026, 18:52."
          actions={
            <ButtonLink variant="primary" size="lg" href="/result">
              See your result page
            </ButtonLink>
          }
        />
      </>,
    );
    expect(container.querySelector('.rk-pending')!.outerHTML).toBe(
      `<p class="rk-pending"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${SYMBOLS.get('sti-alert')}"></path></svg><span>2 questions aren’t answered (3, 4). You can still submit.</span></p>`,
    );
    expect(container.querySelector('.rk-next')!.outerHTML).toBe(
      '<p class="rk-next">All 4 questions are answered.</p>',
    );
    const done = screen.getByRole('region', { name: 'Answers submitted' });
    expect(done).toHaveAttribute('class', 'sv-card sv-act-card');
    expect(done).toHaveAttribute('tabindex', '-1');
    expect(done.querySelector('p')!.innerHTML).toBe(
      '<span class="xr-st xr-st--warn rk-st-lg"><i></i>Waiting for marking</span>',
    );
    expectClean(container);
    await assertNoAxeViolations(container);
  });
});

describe('ST-14 Result', () => {
  it('the score panel (`section.sv-card.sv-score`): score, outcome, facts, marks by question, Try again', async () => {
    for (const piece of [
      '<section class="sv-card sv-score" aria-label="Your score">',
      '<div class="sv-score-main">',
      '<p class="sv-score-n"><b>{{ AR.score }}</b><span>{{ AR.total }}</span></p>',
      '<dl class="sv-score-facts">',
      '<div><dt>Pass mark</dt><dd>{{ AR.passText }}</dd></div>',
      '<div class="sv-score-byq">',
      '<p class="sv-eyebrow" id="st-byq-h">Marks by question</p>',
      '<ol class="sv-byq" aria-labelledby="st-byq-h"><sc-for list="{{ AR.byQ }}" as="b" hint-placeholder-count="4"><li><a class="{{ b.cls }}" href="{{ b.href }}" onClick="{{ b.go }}" aria-label="{{ b.aria }}"><span class="sv-byq-n">Q{{ b.n }}</span><span class="sv-byq-m">{{ b.mark }}</span></a></li></sc-for></ol>',
      '<div class="sv-score-retry">',
    ]) {
      expect(RESULT).toContain(piece);
    }
    const { container } = render(
      <>
        <StScoreCard
          label="Your score"
          score="6"
          outOf="of 16 marks"
          status={{ tone: 'neutral', words: 'Not passed' }}
          facts={[
            { key: 'p', term: 'Pass mark', value: '50% · 8 of 16 marks' },
            { key: 'a', term: 'Attempt', value: 'Attempt 1 of 2' },
          ]}
          byQuestion={{
            title: 'Marks by question',
            titleId: 'byq',
            items: [
              {
                targetId: 'ans-1',
                label: 'Q1',
                mark: '0 of 2',
                full: false,
                ariaLabel: 'Question 1: 0 of 2 marks',
              },
              {
                targetId: 'ans-2',
                label: 'Q2',
                mark: '2 of 2',
                full: true,
                ariaLabel: 'Question 2: 2 of 2 marks',
              },
            ],
          }}
          retry={{
            text: 'You have 1 attempt left. Your first result stays here.',
            action: (
              <Button variant="primary" size="lg">
                Try again
              </Button>
            ),
          }}
        />
        <ol>
          <StResultAnswer
            id="ans-1"
            headingId="ans-1-h"
            head="Question 1 · Multiple choice"
            mark={{ tone: 'neutral', words: '0 of 2 marks' }}
            question="What does ε compare?"
            yours={{
              term: 'Your answer',
              value: 'The flow rates',
              verdict: { words: 'Not correct', ok: false },
            }}
            correct={{ term: 'Correct answer', value: 'The actual heat transfer' }}
            explanation={{ term: 'Explanation', value: 'ε = q ÷ q_max.' }}
          />
        </ol>
      </>,
    );
    const score = screen.getByRole('region', { name: 'Your score' });
    expect(score.querySelector('.sv-score-n')!.innerHTML).toBe('<b>6</b><span>of 16 marks</span>');
    expect(score.querySelector('.sv-score-main > p:last-child')!.innerHTML).toBe(
      '<span class="xr-st rk-st-lg"><i></i>Not passed</span>',
    );
    const byq = within(score).getByRole('list', { name: 'Marks by question' });
    expect(byq.firstElementChild!.innerHTML).toBe(
      '<a class="sv-byq-i" href="#ans-1" aria-label="Question 1: 0 of 2 marks"><span class="sv-byq-n">Q1</span><span class="sv-byq-m">0 of 2</span></a>',
    );
    expect(within(byq).getByRole('link', { name: 'Question 2: 2 of 2 marks' })).toHaveClass(
      'sv-byq-i',
      'is-full',
    );
    fireEvent.click(within(byq).getByRole('link', { name: 'Question 1: 0 of 2 marks' }));
    expect(container.querySelector('#ans-1')).toHaveFocus();
    expect(score.querySelector('.sv-score-retry')).toHaveTextContent(
      'You have 1 attempt left. Your first result stays here.Try again',
    );
    expectClean(container);
    await assertNoAxeViolations(container);
  });

  it('the review (`section.sv-card.sv-review`) and an answer (`li.sv-ans`)', async () => {
    for (const piece of [
      '<section class="sv-card sv-review" aria-labelledby="st-ar-ans">',
      '<div class="sv-card-h"><h2 class="sv-sec-t" id="st-ar-ans">Your answers</h2></div>',
      '<ol class="sv-review-list">',
      '<li class="sv-ans" id="{{ a.id }}" tabindex="-1" aria-labelledby="{{ a.hid }}">',
      '<div class="sv-ans-h"><p class="sv-ans-k" id="{{ a.hid }}">{{ a.head }}</p><span class="{{ a.pillCls }}"><i></i>{{ a.markText }}</span></div>',
      '<p class="sv-ans-q">{{ a.text }}</p>',
      '<dl class="sv-ans-dl">',
      '<div><dt>Your answer</dt><dd><span class="sv-ans-v">{{ a.yours }}</span><sc-if value="{{ a.isChoice }}" hint-placeholder-val="{{ true }}"><span class="{{ a.verdictCls }}">{{ a.verdict }}</span></sc-if></dd></div>',
      '<div><dt>Explanation</dt><dd>{{ a.expl }}</dd></div>',
      '<div><dt>Feedback from {{ AR.fac }}</dt><dd><p class="rk-quote sv-ans-fb">{{ a.fb }}</p></dd></div>',
      '<div class="sv-review-foot">',
    ]) {
      expect(RESULT).toContain(piece);
    }
    const { container } = render(
      <StResultReview
        title="Your answers"
        titleId="st-ar-ans"
        foot={
          <ButtonLink size="lg" href="/hub">
            Back to experiment
          </ButtonLink>
        }
      >
        <StResultAnswer
          id="ans-4"
          headingId="ans-4-h"
          head="Question 4 · Written answer"
          mark={{ tone: 'neutral', words: '7 of 10 marks' }}
          question="Explain how fouling changes the exchanger’s performance."
          yours={{ term: 'Your answer', value: 'Fouling adds a resistance.' }}
          explanation={{ term: 'Explanation', value: 'U falls.' }}
          feedback={{
            term: 'Feedback from Dr S. Ranganathan',
            value: 'Good use of your readings.',
          }}
        />
        <StResultAnswer
          id="ans-1"
          headingId="ans-1-h"
          head="Question 1 · Multiple choice"
          mark={{ tone: 'ok', words: '2 of 2 marks' }}
          question="What does ε compare?"
          yours={{
            term: 'Your answer',
            value: 'The actual heat transfer',
            verdict: { words: 'Correct', ok: true },
          }}
        />
      </StResultReview>,
    );
    const review = screen.getByRole('region', { name: 'Your answers' });
    expect(review).toHaveClass('sv-card', 'sv-review');
    const written = container.querySelector('#ans-4')!;
    expect(written).toHaveAttribute('class', 'sv-ans');
    expect(written).toHaveAttribute('tabindex', '-1');
    expect(written.querySelector('.sv-ans-h')!.innerHTML).toBe(
      '<p class="sv-ans-k" id="ans-4-h">Question 4 · Written answer</p><span class="xr-st"><i></i>7 of 10 marks</span>',
    );
    expect(written.querySelector('dl')!.innerHTML).toBe(
      '<div><dt>Your answer</dt><dd><span class="sv-ans-v">Fouling adds a resistance.</span></dd></div><div><dt>Explanation</dt><dd>U falls.</dd></div><div><dt>Feedback from Dr S. Ranganathan</dt><dd><p class="rk-quote sv-ans-fb">Good use of your readings.</p></dd></div>',
    );
    expect(container.querySelector('#ans-1 .sv-verdict')).toHaveAttribute(
      'class',
      'sv-verdict sv-verdict--ok',
    );
    expect(review.querySelector('.sv-review-foot')).toHaveTextContent('Back to experiment');
    expectClean(container);
    await assertNoAxeViolations(container);
  });

  it('every glyph the pieces draw is the export’s own', () => {
    for (const [name, symbol] of [
      ['chevronLeft', 'sti-left'],
      ['infoNote', 'sti-info'],
      ['clock', 'sti-clock'],
      ['check', 'sti-check'],
      ['alertCircle', 'sti-alert'],
      ['lock', 'sti-lock'],
    ] as const) {
      expect(V3_ICON_PATHS[name], name).toBe(SYMBOLS.get(symbol));
    }
  });
});
