'use client';

import {
  type ChangeEvent,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';

import { joinClasses } from '../internal/classes.js';
import { useLinkComponent } from '../link.js';
import { Button } from './actions.js';
import { Glyph, type V3IconName } from './icons.js';
import { StatusPill, type StatusTone } from './status.js';

/*
 * What only the Student's assessment screens draw (the owner-approved Student export,
 * design/v3-refined-b/roles/ST-v1, `project/StudentFinal.dc.html`: ST-05's Assessment tab, ST-11
 * Assessments, ST-12 Before you start, ST-13 the focused attempt and its submit dialog, ST-14
 * Result; `project/v3-student-final.css`). Markup as the export's template draws it; every word,
 * date, figure and destination comes from the caller. What more than one Student screen group draws
 * (the list rows, the compact message, the refusal card, the state row, the loading block) is
 * `st.tsx`.
 */

/** A same-page jump (`#id`): move focus to the target, as the export's `focusId` does. */
function focusTarget(event: MouseEvent<HTMLAnchorElement>, id: string): void {
  const target = event.currentTarget.ownerDocument.getElementById(id);
  if (!target) return;
  event.preventDefault();
  target.focus();
  target.scrollIntoView?.({ block: 'nearest' });
}

// ---- The date block (ST-05 Assessment tab, ST-11, ST-12) -------------------------------------------

export interface StAssessWhenProps {
  /** "14 Nov". */
  readonly day: ReactNode;
  /** "23:59 · in 13 days". */
  readonly time: ReactNode;
  /** Due within two days (`sv-when--soon`, the ivory block). */
  readonly soon?: boolean;
}

/** A deadline or a release as a date block (`div.sv-when`). */
export function StAssessWhen({ day, time, soon = false }: StAssessWhenProps) {
  return (
    <div className={joinClasses('sv-when', soon && 'sv-when--soon')}>
      <p className="sv-when-d">{day}</p>
      <p className="sv-when-t">{time}</p>
    </div>
  );
}

// ---- ST-11 Assessments ---------------------------------------------------------------------------------

/** ST-11's one surface (`section.sv-card.sv-alist`), named by the current tab (`h2.xr-sr`). */
export function StAssessListCard({
  title,
  titleId,
  children,
}: {
  readonly title: ReactNode;
  readonly titleId: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="sv-card sv-alist" aria-labelledby={titleId}>
      <h2 className="xr-sr" id={titleId}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export interface StAssessFact {
  readonly key: string;
  /** The experiment. */
  readonly title: ReactNode;
  /** Its course: "MEC-523 · Thermodynamics and Heat Transfer". */
  readonly course: ReactNode;
  /** "No assessment set yet". */
  readonly state: ReactNode;
}

/**
 * The fact for each experiment the Student has (`ul.sv-facts`), inside "No assessments yet":
 * states only, no action.
 */
export function StAssessFacts({
  label,
  items,
}: {
  readonly label: string;
  readonly items: readonly StAssessFact[];
}) {
  return (
    <ul className="sv-facts" aria-label={label}>
      {items.map((item) => (
        <li key={item.key}>
          <span className="sv-facts-main">
            <span className="sv-facts-t">{item.title}</span>
            <span className="sv-facts-c">{item.course}</span>
          </span>
          <span className="sv-facts-s">{item.state}</span>
        </li>
      ))}
    </ul>
  );
}

// ---- ST-05 the hub's Assessment tab -----------------------------------------------------------------

export interface StAssessStatus {
  readonly tone: StatusTone;
  readonly words: ReactNode;
}

export interface StAssessAction {
  readonly href: string;
  readonly label: ReactNode;
  /** "Open assessment, Heat Exchanger — post-lab". */
  readonly ariaLabel?: string;
  /** The gold primary (to do, in progress). */
  readonly primary?: boolean;
}

export interface StAssessmentCardProps {
  readonly titleId: string;
  /** "Due" or "Deadline". */
  readonly whenKicker: ReactNode;
  /** The date block; left out when there is no date. */
  readonly when?: StAssessWhenProps;
  /** "Assessment". */
  readonly kicker: ReactNode;
  readonly name: ReactNode;
  readonly description?: ReactNode;
  readonly status: StAssessStatus;
  /** The words after the status: "Your answers are saved". */
  readonly state?: ReactNode;
  /** "4 questions · 16 marks · pass mark 50% · 2 attempts · no time limit". */
  readonly facts: ReactNode;
  readonly action: StAssessAction;
}

/**
 * The hub's Assessment tab (`section.sv-card.sv-atab`): the deadline as a date block, the name,
 * what it covers, its state and key facts, and one action.
 */
export function StAssessmentCard({
  titleId,
  whenKicker,
  when,
  kicker,
  name,
  description,
  status,
  state,
  facts,
  action,
}: StAssessmentCardProps) {
  const Link = useLinkComponent();
  return (
    <section className="sv-card sv-atab" aria-labelledby={titleId}>
      <div className="sv-atab-when">
        <p className="sv-eyebrow">{whenKicker}</p>
        {when ? <StAssessWhen {...when} /> : null}
      </div>
      <div className="sv-atab-main">
        <p className="sv-eyebrow">{kicker}</p>
        <h2 className="sv-atab-t" id={titleId}>
          {name}
        </h2>
        {description === undefined || description === null ? null : (
          <p className="sv-atab-d">{description}</p>
        )}
        <p className="sv-li-m">
          <StatusPill tone={status.tone}>{status.words}</StatusPill>
          {state === undefined || state === null || state === '' ? null : <span>{state}</span>}
        </p>
        <p className="sv-atab-f">{facts}</p>
      </div>
      <div className="sv-atab-act">
        <Link
          className={action.primary ? 'rb-btn rb-btn--primary' : 'rb-btn'}
          href={action.href}
          aria-label={action.ariaLabel}
        >
          {action.label}
        </Link>
      </div>
    </section>
  );
}

// ---- ST-12 Before you start ------------------------------------------------------------------------

/** The experiment in the head's eyebrow (`a.st-eyelink`), before " · assessment". */
export function StIntroExperimentLink({
  href,
  children,
}: {
  readonly href: string;
  readonly children: ReactNode;
}) {
  const Link = useLinkComponent();
  return (
    <Link className="st-eyelink" href={href}>
      {children}
    </Link>
  );
}

export interface StIntroRule {
  readonly key: string;
  readonly icon: V3IconName;
  /** "No time limit". */
  readonly title: ReactNode;
  /** "You can’t change answers after submitting." */
  readonly detail?: ReactNode;
}

export interface StIntroFact {
  readonly key: string;
  readonly term: ReactNode;
  readonly value: ReactNode;
  /** The quieter line under the value: "8 of 16 marks". */
  readonly detail?: ReactNode;
}

export interface StIntroCardProps {
  /** The state's heading id (names the card). */
  readonly stateId: string;
  readonly status: StAssessStatus;
  /** "Before you start", "Attempt 1 in progress". */
  readonly stateTitle: ReactNode;
  /** The state's line (`p.sv-ai-d`, a status region). */
  readonly stateLine?: ReactNode;
  /** The three rules while the Student can still answer (`ul.sv-rules`). */
  readonly rules?: { readonly label: string; readonly items: readonly StIntroRule[] };
  /** The state's actions (kit `Button` / `ButtonLink`, size `lg`). */
  readonly actions: ReactNode;
  readonly factsId: string;
  /** "Key facts, as set for this assessment" (read by screen readers only). */
  readonly factsTitle: ReactNode;
  /** "Deadline" and its date block, with the full date for screen readers. */
  readonly deadline?: {
    readonly kicker: ReactNode;
    readonly when: StAssessWhenProps;
    readonly full: ReactNode;
  };
  readonly facts: readonly StIntroFact[];
}

/**
 * ST-12's one card (`section.sv-card.sv-ai`): the state and its one action first, with the rules
 * while the Student can still answer, then the deadline as a date block beside the key facts.
 */
export function StIntroCard({
  stateId,
  status,
  stateTitle,
  stateLine,
  rules,
  actions,
  factsId,
  factsTitle,
  deadline,
  facts,
}: StIntroCardProps) {
  return (
    <section className="sv-card sv-ai" aria-labelledby={stateId}>
      <div className="sv-ai-state">
        <p>
          <StatusPill tone={status.tone}>{status.words}</StatusPill>
        </p>
        <h2 className="sv-sec-t" id={stateId}>
          {stateTitle}
        </h2>
        {stateLine === undefined || stateLine === null ? null : (
          <p className="sv-ai-d" role="status">
            {stateLine}
          </p>
        )}
        {rules ? (
          <ul className="sv-rules" aria-label={rules.label}>
            {rules.items.map((rule) => (
              <li key={rule.key}>
                <span className="sv-rules-ico" aria-hidden="true">
                  <Glyph name={rule.icon} />
                </span>
                <p>
                  <b>{rule.title}</b>
                  {rule.detail === undefined ? null : <span>{rule.detail}</span>}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="sv-ai-act">{actions}</div>
      </div>
      <div className="sv-ai-facts" role="group" aria-labelledby={factsId}>
        <h2 className="xr-sr" id={factsId}>
          {factsTitle}
        </h2>
        {deadline ? (
          <div className="sv-ai-when">
            <p className="sv-eyebrow">{deadline.kicker}</p>
            <StAssessWhen {...deadline.when} />
            <p className="xr-sr">{deadline.full}</p>
          </div>
        ) : null}
        <dl className="sv-ai-dl">
          {facts.map((fact) => (
            <div key={fact.key}>
              <dt>{fact.term}</dt>
              <dd>
                {fact.value}
                {fact.detail === undefined || fact.detail === null ? null : (
                  <small>{fact.detail}</small>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

// ---- ST-13 the focused attempt ----------------------------------------------------------------------

export interface StAttemptFrameProps {
  /** "Skip to main content". */
  readonly skipLabel: string;
  /** The way out (`a.st-exit.st-exit--compact`): the assessment's Before you start, by its name. */
  readonly exit?: { readonly href: string; readonly label: ReactNode };
  /** The save state (`StAttemptSave`), while the questions are on show. */
  readonly save?: ReactNode;
  /** The Student's initials (`span.xr-avatar`, decorative). */
  readonly initials: string;
  /** The page's main region id (the skip link's and route focus's target). */
  readonly mainId?: string;
  /** After the content: the submit dialog. */
  readonly overlay?: ReactNode;
  readonly children: ReactNode;
}

/**
 * The focused task (`div.st-focus`, no rail): the bar with the way out, the save state and the
 * avatar (`header.st-focusbar`), and the page (`main.st-focuspage`). It is its own V3 root
 * (`div.xr.rb`), as the workspace shell is for the other pages.
 */
export function StAttemptFrame({
  skipLabel,
  exit,
  save,
  initials,
  mainId = 'main',
  overlay,
  children,
}: StAttemptFrameProps) {
  const Link = useLinkComponent();
  const skip = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = event.currentTarget.ownerDocument.getElementById(mainId);
    if (!target) return;
    event.preventDefault();
    target.focus();
  };
  return (
    <div className="xr rb">
      <Link className="xs-skip" href={`#${mainId}`} onClick={skip}>
        {skipLabel}
      </Link>
      <div className="st-focus">
        <header className="st-focusbar">
          {exit ? (
            <Link className="st-exit st-exit--compact" href={exit.href}>
              <Glyph name="chevronLeft" />
              <span>{exit.label}</span>
            </Link>
          ) : (
            <span />
          )}
          <div className="st-focusbar-mid" />
          <div className="st-focusbar-end">
            {save}
            <span className="xr-avatar" aria-hidden="true">
              {initials}
            </span>
          </div>
        </header>
        <main className="st-focuspage st-main" id={mainId} tabIndex={-1}>
          {children}
          {overlay}
        </main>
      </div>
    </div>
  );
}

export type StAttemptSaveState = 'idle' | 'saving' | 'saved' | 'failed';

const SAVE_GLYPH: Readonly<Record<StAttemptSaveState, V3IconName>> = {
  idle: 'infoNote',
  saving: 'clock',
  saved: 'check',
  failed: 'alertCircle',
};

/**
 * The bar's save state (`p.st-save`): "Answers save automatically", "Saving…", "All answers saved",
 * "Your last answer didn’t save" with "Try again". A status region; the failure is an alert.
 */
export function StAttemptSave({
  state,
  words,
  retryLabel,
  onRetry,
}: {
  readonly state: StAttemptSaveState;
  readonly words: ReactNode;
  readonly retryLabel?: ReactNode;
  readonly onRetry?: () => void;
}) {
  return (
    <div role={state === 'failed' ? 'alert' : 'status'}>
      <p
        className={joinClasses(
          'st-save',
          state === 'saved' && 'st-save--ok',
          state === 'failed' && 'st-save--err',
        )}
      >
        <Glyph name={SAVE_GLYPH[state]} />
        {words}
        {state === 'failed' && retryLabel !== undefined ? (
          <button type="button" onClick={onRetry}>
            {retryLabel}
          </button>
        ) : null}
      </p>
    </div>
  );
}

/** The attempt's head (`div.sv-focushead`): experiment · attempt, the name (H1) and its facts. */
export function StAttemptHead({
  experiment,
  attempt,
  title,
  titleRef,
  meta,
}: {
  readonly experiment: ReactNode;
  /** "Attempt 1 of 2". */
  readonly attempt: ReactNode;
  readonly title: ReactNode;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** "4 questions · 16 marks · due 14 Nov 2026, 23:59 · no time limit". */
  readonly meta: ReactNode;
}) {
  return (
    <div className="sv-focushead">
      <p className="sv-act-k">
        <span>{experiment}</span>
        <span aria-hidden="true">·</span>
        <span>{attempt}</span>
      </p>
      <h1 ref={titleRef} className="rb-h1" tabIndex={-1}>
        {title}
      </h1>
      <p className="sv-focus-sub">{meta}</p>
    </div>
  );
}

/**
 * The questions and the side panel (`div.st-att`): the numbered sheet (`ol.sv-card.sv-qs`) and one
 * sticky panel (`div.st-att-side.sv-attside`) — below 900 px the panel splits, the answers above
 * the questions and Submit after them.
 */
export function StAttemptLayout({
  questionsLabel,
  questions,
  side,
}: {
  /** "Questions". */
  readonly questionsLabel: string;
  /** `StAttemptQuestion`s. */
  readonly questions: ReactNode;
  /** `StAttemptStrip` and `StAttemptSubmit`. */
  readonly side: ReactNode;
}) {
  return (
    <div className="st-att">
      <div className="st-att-qs">
        <ol className="sv-card sv-qs" aria-label={questionsLabel}>
          {questions}
        </ol>
      </div>
      <div className="st-att-side sv-attside">{side}</div>
    </div>
  );
}

/** One question (`section.sv-q`, focus target of the strip): its number, label, marks, answer. */
export function StAttemptQuestion({
  id,
  headingId,
  number,
  done,
  label,
  marks,
  children,
}: {
  readonly id: string;
  readonly headingId: string;
  readonly number: number;
  /** Answered: the number is filled (`is-done`). */
  readonly done: boolean;
  /** "Question 1 of 4 · Multiple choice". */
  readonly label: ReactNode;
  /** "2 marks". */
  readonly marks: ReactNode;
  /** `StAttemptChoices` or `StAttemptWritten`. */
  readonly children: ReactNode;
}) {
  return (
    <li>
      <section className="sv-q" id={id} tabIndex={-1} aria-labelledby={headingId}>
        <span className={joinClasses('sv-q-n', done && 'is-done')} aria-hidden="true">
          {number}
        </span>
        <div className="sv-q-body">
          <div className="sv-q-h">
            <h2 className="sv-q-k" id={headingId}>
              {label}
            </h2>
            <p className="sv-q-m">{marks}</p>
          </div>
          {children}
        </div>
      </section>
    </li>
  );
}

export interface StAttemptChoice {
  readonly id: string;
  readonly label: ReactNode;
  readonly checked: boolean;
}

/** A choice question (`fieldset.st-qfs` named by the question, `label.rk-choice` radios). */
export function StAttemptChoices({
  legend,
  name,
  options,
  onChoose,
}: {
  /** The question's words. */
  readonly legend: ReactNode;
  readonly name: string;
  readonly options: readonly StAttemptChoice[];
  readonly onChoose: (id: string) => void;
}) {
  return (
    <fieldset className="st-qfs sv-qfs">
      <legend>{legend}</legend>
      <div className="rk-choices">
        {options.map((option) => (
          <label key={option.id} className="rk-choice" htmlFor={option.id}>
            <input
              type="radio"
              name={name}
              id={option.id}
              checked={option.checked}
              onChange={() => onChoose(option.id)}
            />
            <span className="rk-choice-t">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** A written question (`div.st-q-w`): the question as the field's label, the hint, the field. */
export function StAttemptWritten({
  id,
  label,
  hint,
  value,
  onChange,
  onBlur,
}: {
  readonly id: string;
  readonly label: ReactNode;
  /** "Your faculty marks written answers." */
  readonly hint: ReactNode;
  readonly value: string;
  readonly onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  readonly onBlur?: (event: FocusEvent<HTMLTextAreaElement>) => void;
}) {
  const hintId = `${id}-hint`;
  return (
    <div className="st-q-w sv-q-w">
      <label htmlFor={id}>{label}</label>
      <p className="rk-hint" id={hintId}>
        {hint}
      </p>
      <textarea
        id={id}
        className="rk-textarea"
        aria-describedby={hintId}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      />
    </div>
  );
}

export interface StAttemptStripItem {
  readonly number: number;
  /** The question's id (the link's `#` target, focused on a press). */
  readonly targetId: string;
  readonly done: boolean;
  /** "Question 1, answered". */
  readonly label: string;
}

/**
 * "Your answers" (`section.st-att-panel.st-att-strip`): how many are answered, a link to each
 * question (filled when answered) and "Next unanswered".
 */
export function StAttemptStrip({
  title,
  titleId,
  count,
  items,
  next,
}: {
  readonly title: ReactNode;
  readonly titleId: string;
  /** "2 of 4 answered" (a status region). */
  readonly count: ReactNode;
  readonly items: readonly StAttemptStripItem[];
  /** "Next unanswered", while a question is unanswered. */
  readonly next?: { readonly label: ReactNode; readonly onNext: () => void };
}) {
  return (
    <section className="st-att-panel st-att-strip sv-attpanel" aria-labelledby={titleId}>
      <div className="sv-attpanel-h">
        <h2 className="sv-h3" id={titleId}>
          {title}
        </h2>
        <p className="sv-attcount" role="status">
          {count}
        </p>
      </div>
      <ol className="st-strip">
        {items.map((item) => (
          <li key={item.targetId}>
            <a
              href={`#${item.targetId}`}
              className={item.done ? 'is-done' : undefined}
              aria-label={item.label}
              onClick={(event) => focusTarget(event, item.targetId)}
            >
              {item.number}
            </a>
          </li>
        ))}
      </ol>
      {next ? (
        <button type="button" className="rb-btn sv-attnext" onClick={next.onNext}>
          {next.label}
        </button>
      ) : null}
    </section>
  );
}

/**
 * Submit (`section.st-att-panel.st-att-submit`): the failure when a submit did not go through (an
 * alert that takes focus), the note and the gold "Submit" that opens the dialog.
 */
export function StAttemptSubmit({
  titleId,
  title,
  failure,
  note,
  submitLabel,
  submitRef,
  onSubmit,
}: {
  readonly titleId: string;
  /** "Submit your answers" (read by screen readers only). */
  readonly title: ReactNode;
  readonly failure?: {
    readonly id: string;
    readonly ref?: Ref<HTMLDivElement>;
    readonly title: ReactNode;
    readonly line: ReactNode;
  };
  readonly note: ReactNode;
  readonly submitLabel: ReactNode;
  readonly submitRef?: Ref<HTMLButtonElement>;
  readonly onSubmit: () => void;
}) {
  return (
    <section className="st-att-panel st-att-submit sv-attpanel" aria-labelledby={titleId}>
      <h2 className="xr-sr" id={titleId}>
        {title}
      </h2>
      {failure ? (
        <div
          ref={failure.ref}
          className="rk-errsum sv-attsuberr"
          id={failure.id}
          tabIndex={-1}
          role="alert"
        >
          <p className="rk-errsum-t">{failure.title}</p>
          <p className="st-errsum-d">{failure.line}</p>
        </div>
      ) : null}
      <p className="sv-attnote">{note}</p>
      <Button ref={submitRef} variant="primary" size="lg" onClick={onSubmit}>
        {submitLabel}
      </Button>
    </section>
  );
}

/** The submit dialog's warning (`p.rk-pending`): "2 questions aren’t answered (3, 4). …". */
export function StAttemptPending({ children }: { readonly children: ReactNode }) {
  return (
    <p className="rk-pending">
      <Glyph name="alertCircle" />
      <span>{children}</span>
    </p>
  );
}

/** The submit dialog's line when every question is answered (`p.rk-next`). */
export function StAttemptAllAnswered({ children }: { readonly children: ReactNode }) {
  return <p className="rk-next">{children}</p>;
}

/**
 * "Answers submitted" (`section.sv-card.sv-act-card`, focus target): the status, when the result
 * appears and the ways on.
 */
export function StAttemptDone({
  id,
  titleId,
  cardRef,
  status,
  title,
  text,
  actions,
}: {
  readonly id: string;
  readonly titleId: string;
  readonly cardRef?: Ref<HTMLElement>;
  readonly status: StAssessStatus;
  readonly title: ReactNode;
  readonly text: ReactNode;
  /** Kit `ButtonLink`s, size `lg`. */
  readonly actions: ReactNode;
}) {
  return (
    <section
      ref={cardRef}
      className="sv-card sv-act-card"
      id={id}
      tabIndex={-1}
      aria-labelledby={titleId}
    >
      <p>
        <StatusPill tone={status.tone} size="lg">
          {status.words}
        </StatusPill>
      </p>
      <h2 className="sv-sec-t" id={titleId}>
        {title}
      </h2>
      <p className="sv-act-d">{text}</p>
      <div className="sv-act-go">{actions}</div>
    </section>
  );
}

// ---- ST-14 Result -------------------------------------------------------------------------------------

export interface StScoreFact {
  readonly key: string;
  readonly term: ReactNode;
  readonly value: ReactNode;
}

export interface StScoreByQuestion {
  /** The answer's id below (the jump target). */
  readonly targetId: string;
  /** "Q1". */
  readonly label: ReactNode;
  /** "2 of 2". */
  readonly mark: ReactNode;
  /** Full marks (`is-full`). */
  readonly full: boolean;
  /** "Question 1: 2 of 2 marks". */
  readonly ariaLabel: string;
}

export interface StScoreCardProps {
  /** "Your score". */
  readonly label: string;
  /** "11". */
  readonly score: ReactNode;
  /** "of 16 marks". */
  readonly outOf: ReactNode;
  readonly status: StAssessStatus;
  /** Pass mark, Attempt, Result. */
  readonly facts: readonly StScoreFact[];
  readonly byQuestion: {
    readonly title: ReactNode;
    readonly titleId: string;
    readonly items: readonly StScoreByQuestion[];
  };
  /** Not passed with an attempt left: the line and "Try again" (a kit `Button`). */
  readonly retry?: { readonly text: ReactNode; readonly action: ReactNode };
}

/**
 * The score panel (`section.sv-card.sv-score`): the score and the outcome, the pass mark, attempt
 * and release, the marks by question as a jump list, and "Try again" when it is offered.
 */
export function StScoreCard({
  label,
  score,
  outOf,
  status,
  facts,
  byQuestion,
  retry,
}: StScoreCardProps) {
  return (
    <section className="sv-card sv-score" aria-label={label}>
      <div className="sv-score-main">
        <p className="sv-score-n">
          <b>{score}</b>
          <span>{outOf}</span>
        </p>
        <p>
          <StatusPill tone={status.tone} size="lg">
            {status.words}
          </StatusPill>
        </p>
      </div>
      <dl className="sv-score-facts">
        {facts.map((fact) => (
          <div key={fact.key}>
            <dt>{fact.term}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
      <div className="sv-score-byq">
        <p className="sv-eyebrow" id={byQuestion.titleId}>
          {byQuestion.title}
        </p>
        <ol className="sv-byq" aria-labelledby={byQuestion.titleId}>
          {byQuestion.items.map((item) => (
            <li key={item.targetId}>
              <a
                className={joinClasses('sv-byq-i', item.full && 'is-full')}
                href={`#${item.targetId}`}
                aria-label={item.ariaLabel}
                onClick={(event) => focusTarget(event, item.targetId)}
              >
                <span className="sv-byq-n">{item.label}</span>
                <span className="sv-byq-m">{item.mark}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
      {retry ? (
        <div className="sv-score-retry">
          <p>{retry.text}</p>
          {retry.action}
        </div>
      ) : null}
    </section>
  );
}

/**
 * "Your answers" (`section.sv-card.sv-review`): each answer (`StResultAnswer`), then the ways on
 * (`div.sv-review-foot`: "Back to experiment", "See your progress ›").
 */
export function StResultReview({
  title,
  titleId,
  children,
  foot,
}: {
  readonly title: ReactNode;
  readonly titleId: string;
  readonly children: ReactNode;
  readonly foot: ReactNode;
}) {
  return (
    <section className="sv-card sv-review" aria-labelledby={titleId}>
      <div className="sv-card-h">
        <h2 className="sv-sec-t" id={titleId}>
          {title}
        </h2>
      </div>
      <ol className="sv-review-list">{children}</ol>
      <div className="sv-review-foot">{foot}</div>
    </section>
  );
}

export interface StResultRow {
  readonly term: ReactNode;
  readonly value: ReactNode;
}

export interface StResultAnswerProps {
  readonly id: string;
  readonly headingId: string;
  /** "Question 1 · Multiple choice". */
  readonly head: ReactNode;
  /** The mark as a status: "2 of 2 marks" (`ok` when full). */
  readonly mark: StAssessStatus;
  /** The question's words. */
  readonly question: ReactNode;
  /** "Your answer", with the verdict of a choice question ("Correct", "Not correct"). */
  readonly yours: StResultRow & {
    readonly verdict?: { readonly words: ReactNode; readonly ok: boolean };
  };
  /** The correct answer, only where it differs. */
  readonly correct?: StResultRow;
  readonly explanation?: StResultRow;
  /** "Feedback from Dr S. Ranganathan" and the quoted words. */
  readonly feedback?: StResultRow;
}

/**
 * One answer (`li.sv-ans`, a jump target): your answer marked correct or not, the correct answer
 * where it differs, the explanation and the faculty's feedback.
 */
export function StResultAnswer({
  id,
  headingId,
  head,
  mark,
  question,
  yours,
  correct,
  explanation,
  feedback,
}: StResultAnswerProps) {
  return (
    <li className="sv-ans" id={id} tabIndex={-1} aria-labelledby={headingId}>
      <div className="sv-ans-h">
        <p className="sv-ans-k" id={headingId}>
          {head}
        </p>
        <StatusPill tone={mark.tone}>{mark.words}</StatusPill>
      </div>
      <p className="sv-ans-q">{question}</p>
      <dl className="sv-ans-dl">
        <div>
          <dt>{yours.term}</dt>
          <dd>
            <span className="sv-ans-v">{yours.value}</span>
            {yours.verdict ? (
              <span className={joinClasses('sv-verdict', yours.verdict.ok && 'sv-verdict--ok')}>
                {yours.verdict.words}
              </span>
            ) : null}
          </dd>
        </div>
        {correct ? (
          <div>
            <dt>{correct.term}</dt>
            <dd>{correct.value}</dd>
          </div>
        ) : null}
        {explanation ? (
          <div>
            <dt>{explanation.term}</dt>
            <dd>{explanation.value}</dd>
          </div>
        ) : null}
        {feedback ? (
          <div>
            <dt>{feedback.term}</dt>
            <dd>
              <p className="rk-quote sv-ans-fb">{feedback.value}</p>
            </dd>
          </div>
        ) : null}
      </dl>
    </li>
  );
}
