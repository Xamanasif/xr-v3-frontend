'use client';

import type { ChangeEvent, MouseEvent, ReactNode, Ref } from 'react';

import { joinClasses } from '../internal/classes.js';
import {
  FaAside,
  FaDetail,
  FaGuide,
  FaKey,
  FaProgress,
  type FaProgressRow,
  type FaProgressWords,
  FaResultMark,
  FaSheetQuestionHead,
} from './fa.js';
import { Hint } from './fields.js';
import { Glyph, Icon } from './icons.js';

/*
 * What only the Faculty's marking screens draw — FA-18 Marking queue, FA-19 Mark a submission,
 * FA-20 Students (with its FA-22 export) and FA-21 Student detail (`fa-` classes; the
 * owner-approved Faculty export, design/v3-refined-b/roles/FA-v1, `project/fa.css` and
 * COMPONENT-EXTENSIONS.md): the queue's count and oldest wait; the marking page's head, its reading
 * sheet (the automatic-marks strip, the written question, the answer, the guidance) and its marks
 * panel (the score, the feedback, the live total, Save mark, Confirm marks and the confirmed,
 * read-only summary); the Students roster's per-format cells, last activity and per-format summary;
 * a Student's per-format list, resources and page layout. Markup as the export's `Main.dc.html`
 * draws it; the families more than one Faculty screen group draws are `fa.tsx`'s. Every word,
 * figure, id and destination comes from the caller; no piece prints a record's internal reference.
 */

// ---- FA-18 Marking queue ------------------------------------------------------------------------

/**
 * The queue's count and its oldest wait (`p.fa-mqcount`): the count is a polite status (`span.rk-count`),
 * the oldest wait (`span.fa-oldest`, the clock glyph) is shown while any answer waits.
 */
export function FaQueueCount({
  count,
  oldest,
}: {
  /** “2 written answers waiting”, “Nothing waiting”. */
  readonly count: ReactNode;
  /** “Oldest waiting 2 days”; none while nothing waits. */
  readonly oldest?: ReactNode;
}) {
  return (
    <p className="fa-mqcount">
      <span className="rk-count" role="status">
        {count}
      </span>
      {oldest ? (
        <span className="fa-oldest">
          <Glyph name="clock" />
          {oldest}
        </span>
      ) : null}
    </p>
  );
}

/**
 * The co-teacher's note (`p.rk-locked` with the lock): a colleague's written answers are not
 * listed. `inState`: under FA-18's “Nothing is waiting for you”, at most 34em wide, 10 px under it
 * and left-aligned (`rk-x-locked-note`, V3P-17: the export's inline `max-width`, `margin-top` and
 * `text-align`); FA-21 draws it plain.
 */
export function FaQueueLockedNote({
  inState,
  children,
}: {
  readonly inState?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <p className={joinClasses('rk-locked', inState && 'rk-x-locked-note')}>
      <Icon name="lock" size={18} />
      <span>{children}</span>
    </p>
  );
}

// ---- FA-19 Mark a submission: the head and the layout --------------------------------------------

export interface FaMarkHeadProps {
  /** The breadcrumb trail (`Breadcrumbs`): “Marking › Rahul Verma”. */
  readonly breadcrumbs: ReactNode;
  /** `p.rk-eyebrow`: “Heat Exchanger — post-lab · Shell-and-Tube Heat Exchanger”. */
  readonly eyebrow?: ReactNode;
  /** The Student — the page's one H1 (`h1.rk-title`, a focus target). */
  readonly title: ReactNode;
  readonly titleId?: string;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** `div.rk-meta`: the status pill, the separator, “Submitted … · attempt 1 of 2”. */
  readonly meta?: ReactNode;
  /** `p.fa-qpos` while it waits: “1 of 2 waiting · oldest first”. */
  readonly position?: ReactNode;
}

/**
 * The marking page's head (`div.rk-head`): a person page keeps the plain head — eyebrow, the
 * Student as the title, the status and the submitted line — with the queue position at its end.
 */
export function FaMarkHead({
  breadcrumbs,
  eyebrow,
  title,
  titleId,
  titleRef,
  meta,
  position,
}: FaMarkHeadProps) {
  return (
    <>
      {breadcrumbs}
      <div className="rk-head">
        <div className="rk-head-text">
          {eyebrow ? <p className="rk-eyebrow">{eyebrow}</p> : null}
          <h1 ref={titleRef} id={titleId} className="rk-title" tabIndex={-1}>
            {title}
          </h1>
          {meta ? <div className="rk-meta">{meta}</div> : null}
        </div>
        {position ? <p className="fa-qpos">{position}</p> : null}
      </div>
    </>
  );
}

export interface FaMarkLayoutProps {
  /** “Go to the marks” (`p.fa-gomark`, shown below 860 px): moves focus to the panel. */
  readonly goToLabel: string;
  /** The reading sheet's sections (`div.rk-surface.rk-mainsheet.fa-sheet`). */
  readonly sheet: ReactNode;
  /** The marks panel (`FaMarksPanel`). */
  readonly panel: ReactNode;
  /** The panel's id, the jump link's target. */
  readonly panelId: string;
  /** The panel heading's id, the aside's name. */
  readonly panelTitleId: string;
}

/** Move focus to the marks panel (the export's `goPanel`: `focusLater('fa-mk-panel', true)`). */
function goToPanel(event: MouseEvent<HTMLAnchorElement>, panelId: string) {
  const panel = event.currentTarget.ownerDocument.getElementById(panelId);
  if (!panel) return;
  event.preventDefault();
  panel.scrollIntoView({ block: 'start' });
  panel.focus({ preventScroll: true });
}

/**
 * The reading sheet beside its marks panel (`div.rk-detailwrap` > `div.rk-detail`; one column
 * below 860 px, where “Go to the marks” shows above the sheet).
 */
export function FaMarkLayout({
  goToLabel,
  sheet,
  panel,
  panelId,
  panelTitleId,
}: FaMarkLayoutProps) {
  return (
    <FaDetail
      before={
        <p className="fa-gomark">
          <a
            className="rb-link"
            href={`#${panelId}`}
            onClick={(event) => goToPanel(event, panelId)}
          >
            {goToLabel}
          </a>
        </p>
      }
    >
      <div className="rk-surface rk-mainsheet fa-sheet">{sheet}</div>
      <FaAside labelledBy={panelTitleId}>{panel}</FaAside>
    </FaDetail>
  );
}

// ---- FA-19 the reading sheet ----------------------------------------------------------------------

export interface FaAutoMark {
  readonly key: string;
  /** “Question 1 · Multiple choice”. */
  readonly label: ReactNode;
  /** “2 of 2”; “Not marked yet” while the stand-in has given no mark. */
  readonly mark: ReactNode;
  /** `ok` (full marks, the tick), `no` (the cross) or `waiting` (no mark yet, the clock). */
  readonly result: 'ok' | 'no' | 'waiting';
}

/**
 * The automatic-marks strip (`section.fa-autos`): its heading and figure, one card per choice
 * question (right: the tick; wrong: the cross; no mark yet: the clock), or the quiet line when the
 * version has none, 6 px under the head (`rk-x-quiet-snug`, V3P-17: the export's inline
 * `margin-top`).
 */
export function FaAutoMarks({
  title,
  titleId,
  figure,
  marks,
  none,
}: {
  /** “Marked automatically”. */
  readonly title: ReactNode;
  readonly titleId: string;
  /** “4 of 6 marks”. */
  readonly figure: ReactNode;
  readonly marks: readonly FaAutoMark[];
  /** “This assessment has no choice questions.” — shown when `marks` is empty. */
  readonly none: ReactNode;
}) {
  return (
    <section className="fa-autos" aria-labelledby={titleId}>
      <p className="fa-autos-h">
        <span id={titleId}>{title}</span>
        <b>{figure}</b>
      </p>
      {marks.length > 0 ? (
        <ul className="fa-autolist">
          {marks.map((mark) => (
            <li key={mark.key}>
              <span className="fa-auto-q">{mark.label}</span>
              <FaResultMark
                outcome={mark.result === 'ok' ? 'ok' : 'no'}
                icon={mark.result === 'ok' ? 'check' : mark.result === 'no' ? 'close' : 'clock'}
              >
                {mark.mark}
              </FaResultMark>
            </li>
          ))}
        </ul>
      ) : (
        <p className="fa-quiet rk-x-quiet-snug">{none}</p>
      )}
    </section>
  );
}

export interface FaSheetQuestionProps {
  readonly titleId: string;
  /** `h2.fa-sheetq-k`: “Question 4 of 4 · Written answer”. */
  readonly title: ReactNode;
  /** `p.fa-sheetq-m`: “10 marks”. */
  readonly marks: ReactNode;
  /** The question's text (`p.fa-sheetq-t`). */
  readonly text: ReactNode;
  /** `h3.fa-ans-h`: “Rahul Verma’s answer”. */
  readonly answerTitle: ReactNode;
  /** The answer at reading width (`div.fa-answer`, white space kept). */
  readonly answer: ReactNode;
  /** The marking guidance (Faculty only); none when the question has none. */
  readonly guidance?: { readonly title: ReactNode; readonly text: ReactNode } | null;
}

/** A written question with the Student's answer and its guidance (`section.fa-sheetq`). */
export function FaSheetQuestion({
  titleId,
  title,
  marks,
  text,
  answerTitle,
  answer,
  guidance,
}: FaSheetQuestionProps) {
  return (
    <section className="fa-sheetq" aria-labelledby={titleId}>
      <FaSheetQuestionHead head={title} marks={marks} headingId={titleId} />
      <p className="fa-sheetq-t">{text}</p>
      <h3 className="fa-ans-h">{answerTitle}</h3>
      <div className="fa-answer">{answer}</div>
      {guidance ? <FaGuide label={guidance.title}>{guidance.text}</FaGuide> : null}
    </section>
  );
}

// ---- FA-19 the marks panel ------------------------------------------------------------------------

export interface FaMarksPanelProps {
  /** The panel's id (“Go to the marks” moves focus here: `tabIndex={-1}`). */
  readonly id: string;
  readonly titleId: string;
  /** “Marks”. */
  readonly title: ReactNode;
  /** `span.fa-ph-note`: “16 marks in total”. */
  readonly note?: ReactNode;
  readonly children: ReactNode;
}

/** The navy marks panel (`div.rk-panel.fa-mpanel` > head + `div.rk-panel-body.fa-mbody`). */
export function FaMarksPanel({ id, titleId, title, note, children }: FaMarksPanelProps) {
  return (
    <div className="rk-panel fa-mpanel" id={id} tabIndex={-1}>
      <div className="rk-panel-head rk-x-panel-head-quiet">
        <h2 id={titleId}>{title}</h2>
        {note ? <span className="fa-ph-note">{note}</span> : null}
      </div>
      <div className="rk-panel-body fa-mbody">{children}</div>
    </div>
  );
}

/** The panel's form section (`div.fa-msec`): the score and the feedback, 12 px apart. */
export function FaMarkSection({ children }: { readonly children: ReactNode }) {
  return <div className="fa-msec">{children}</div>;
}

export interface FaScoreFieldProps {
  /** The input's id; the hint is `<id>-h`, the error `<id>-e`. */
  readonly id: string;
  /** `label.fa-score-lbl`: “Your mark”. */
  readonly label: ReactNode;
  /** `span.fa-score-q`: “Question 4 · written answer, out of 10”. */
  readonly sub: ReactNode;
  readonly value: string;
  readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  /** `span.fa-scoreof` (hidden from screen readers; the hint says it): “/ 10”. */
  readonly outOf: ReactNode;
  /** `p.rk-hint`: “A whole number from 0 to 10.”. */
  readonly hint: ReactNode;
  /** The service's words under it (`p.rk-ferr`): the field is then invalid. */
  readonly error?: ReactNode;
  readonly inputRef?: Ref<HTMLInputElement>;
}

/**
 * The large score field (`div.rk-field.fa-score`): the label and what the mark is out of, the
 * whole-number input beside “/ 10”, the hint and the error.
 */
export function FaScoreField({
  id,
  label,
  sub,
  value,
  onChange,
  outOf,
  hint,
  error,
  inputRef,
}: FaScoreFieldProps) {
  const hintId = `${id}-h`;
  const errorId = `${id}-e`;
  return (
    <div className="rk-field fa-score">
      <label className="fa-score-lbl" htmlFor={id}>
        {label} <span className="fa-score-q">{sub}</span>
      </label>
      <div className="fa-scorebox">
        <input
          ref={inputRef}
          id={id}
          className="fa-scorein"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          onChange={onChange}
        />
        <span className="fa-scoreof" aria-hidden="true">
          {outOf}
        </span>
      </div>
      <p className="rk-hint" id={hintId}>
        {hint}
      </p>
      {error ? (
        <p className="rk-ferr" id={errorId}>
          <Glyph name="alertCircle" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** The optional feedback (`div.rk-field` > `label.rk-label` + `textarea.rk-textarea.fa-fb`). */
export function FaMarkFeedback({
  id,
  label,
  value,
  onChange,
}: {
  readonly id: string;
  /** “Feedback for Rahul (optional)”. */
  readonly label: ReactNode;
  readonly value: string;
  readonly onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="rk-field">
      <label className="rk-label" htmlFor={id}>
        {label}
      </label>
      <textarea id={id} className="rk-textarea fa-fb" value={value} onChange={onChange} />
    </div>
  );
}

/** The live total (`div.fa-total`): “Total”, “11 of 16” and how it is made. */
export function FaLiveTotal({
  label,
  total,
  line,
}: {
  /** “Total”. */
  readonly label: ReactNode;
  /** “— of 16”, “11 of 16”. */
  readonly total: ReactNode;
  /** “4 marked automatically + 7 written · pass mark 8”. */
  readonly line: ReactNode;
}) {
  return (
    <div className="fa-total">
      <span className="fa-total-k">{label}</span>
      <b>{total}</b>
      <span className="fa-total-d">{line}</span>
    </div>
  );
}

/**
 * Save mark and its note (`div.fa-save`): the button (the caller's `Button`), then “Mark saved —
 * not confirmed yet” (a polite status, a focus target) once saved, else “Saving keeps your mark
 * editable.”.
 */
export function FaMarkSave({
  button,
  saved,
  savedId,
  savedRef,
  note,
}: {
  readonly button: ReactNode;
  /** “Mark saved — not confirmed yet”, while the mark on show is the saved one. */
  readonly saved?: ReactNode;
  readonly savedId?: string;
  readonly savedRef?: Ref<HTMLParagraphElement>;
  /** “Saving keeps your mark editable.”, before it is saved. */
  readonly note?: ReactNode;
}) {
  return (
    <div className="fa-save">
      {button}
      {saved ? (
        <p className="fa-savednote" id={savedId} ref={savedRef} tabIndex={-1} role="status">
          <Glyph name="check" />
          <span>{saved}</span>
        </p>
      ) : null}
      {!saved && note ? <p className="fa-save-d">{note}</p> : null}
    </div>
  );
}

/** Confirm marks, last (`div.fa-confirm`): the gold button and its lock note (`p.fa-final`). */
export function FaMarkConfirm({
  button,
  note,
}: {
  readonly button: ReactNode;
  /** “Confirmed marks can’t be changed.”. */
  readonly note: ReactNode;
}) {
  return (
    <div className="fa-confirm">
      {button}
      <p className="fa-final">
        <Glyph name="lock" />
        <span>{note}</span>
      </p>
    </div>
  );
}

/** A confirmed total (`div.fa-done-total`): “11 of 16 marks” and “Passed · pass mark 8”. */
export function FaDoneTotal({
  total,
  outcome,
}: {
  readonly total: ReactNode;
  /** None while the pass mark is not known. */
  readonly outcome?: ReactNode;
}) {
  return (
    <div className="fa-done-total">
      <b>{total}</b>
      {outcome ? <span>{outcome}</span> : null}
    </div>
  );
}

/**
 * When the Student sees the result, once the marks are confirmed: released (`p.fa-savednote`, the
 * tick) or not yet (`p.rk-locked`, the clock).
 */
export function FaReleaseNote({
  released,
  children,
}: {
  readonly released: boolean;
  readonly children: ReactNode;
}) {
  return released ? (
    <p className="fa-savednote">
      <Glyph name="check" />
      <span>{children}</span>
    </p>
  ) : (
    <p className="rk-locked">
      <Icon name="clock" size={18} />
      <span>{children}</span>
    </p>
  );
}

export interface FaMarkGiven {
  readonly key: string;
  /** “Question 4”. */
  readonly term: ReactNode;
  /** “7 of 10”. */
  readonly value: ReactNode;
}

export interface FaMarksDoneProps {
  /** The panel's focus target after confirming (`tabIndex={-1}`). */
  readonly id: string;
  readonly doneRef?: Ref<HTMLDivElement>;
  /** Anything to say first (a notice the page keeps, e.g. confirmed in the meantime). */
  readonly before?: ReactNode;
  /** “Marks confirmed”. */
  readonly title: ReactNode;
  /** “7 Nov 2026, 10:15 · Dr S. Ranganathan”. */
  readonly by: ReactNode;
  /** The confirmed total (`FaDoneTotal`). */
  readonly total: ReactNode;
  readonly given: readonly FaMarkGiven[];
  /** “Feedback”, the feedback or “No feedback” (quiet). */
  readonly feedback: {
    readonly term: ReactNode;
    readonly text: ReactNode;
    readonly given: boolean;
  };
  /** The release line (`FaReleaseNote`). */
  readonly release?: ReactNode;
  /** `div.fa-done-acts`: Next submission (or the quiet line), See submissions. */
  readonly actions: ReactNode;
}

/**
 * The confirmed, read-only panel (`div.fa-done`): the ok notice with who and when, the total, the
 * marks and the feedback (`dl.fa-sumdl`), when the Student sees the result, then what next.
 */
export function FaMarksDone({
  id,
  doneRef,
  before,
  title,
  by,
  total,
  given,
  feedback,
  release,
  actions,
}: FaMarksDoneProps) {
  return (
    <div className="fa-done" id={id} ref={doneRef} tabIndex={-1}>
      {before}
      <div className="rk-notice rk-notice--ok">
        <Glyph name="check" />
        <p className="rk-notice-t">{title}</p>
        <p className="rk-notice-d">{by}</p>
      </div>
      {total}
      <dl className="fa-sumdl">
        {given.map((entry) => (
          <div key={entry.key}>
            <dt>{entry.term}</dt>
            <dd>{entry.value}</dd>
          </div>
        ))}
        <div>
          <dt>{feedback.term}</dt>
          <dd className={feedback.given ? 'is-text' : 'is-quiet'}>{feedback.text}</dd>
        </div>
      </dl>
      {release}
      <div className="fa-done-acts">{actions}</div>
    </div>
  );
}

// ---- FA-20 Students ------------------------------------------------------------------------------

export interface FaStudentsFormat {
  readonly key: string;
  /** The format's code chip (`span.xr-fmt`, hidden from screen readers: the list's name says it). */
  readonly code: string;
  /** The status pill (`StatusPill`): Completed (ok), In progress (info), Not started. */
  readonly status: ReactNode;
  /** The completion date beside a completed format; none otherwise. */
  readonly date?: ReactNode;
}

/**
 * A Student's progress by format in a roster row (`ul.fa-fmcell`): one line per format, the chip,
 * the status and its date; the list is named with the same facts in words.
 */
export function FaStudentsFormatCell({
  label,
  formats,
}: {
  /** “Progress by format: WEB completed 14 Oct 2026, VR in progress”. */
  readonly label: string;
  readonly formats: readonly FaStudentsFormat[];
}) {
  return (
    <ul className="fa-fmcell" aria-label={label}>
      {formats.map((format) => (
        <li key={format.key}>
          <span className="xr-fmt" aria-hidden="true">
            {format.code}
          </span>
          {format.status}
          {format.date ? <span className="fa-fmtcell-d">{format.date}</span> : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * A Student's last activity (`span.fa-lastv`) and, from 14 days, the inactivity tag
 * (`span.rk-tag-warn` with the clock, on its own line).
 */
export function FaStudentsLastActivity({
  last,
  inactive,
}: {
  /** “5 Nov 2026”, “None since access was given (12 Oct 2026)”. */
  readonly last: ReactNode;
  /** “Inactive 19 days”; none under 14 days. */
  readonly inactive?: ReactNode;
}) {
  return (
    <>
      <span className="fa-lastv">{last}</span>
      {inactive ? (
        <span className="fa-cellline rk-x-cellline-snug">
          <span className="rk-tag-warn">
            <Glyph name="clock" />
            {inactive}
          </span>
        </span>
      ) : null}
    </>
  );
}

/**
 * The per-format summary above the roster (`div.fa-slsum[role=group]` > `p.fa-k` + the unit
 * meters, `ul.fa-prog.fa-prog--sum`): every Student with the experiment, by format.
 */
export function FaStudentsSummary({
  titleId,
  title,
  label,
  rows,
  words,
}: {
  readonly titleId: string;
  /** “All 5 students with access, by format”. */
  readonly title: ReactNode;
  /** The meters' name: “Progress by format for all students with access to …”. */
  readonly label: string;
  readonly rows: readonly FaProgressRow[];
  readonly words: FaProgressWords;
}) {
  return (
    <div className="fa-slsum" role="group" aria-labelledby={titleId}>
      <FaKey id={titleId}>{title}</FaKey>
      <FaProgress label={label} rows={rows} words={words} variant="sum" />
    </div>
  );
}

// ---- FA-21 Student detail ------------------------------------------------------------------------

/**
 * One section of the sheet (`section.rk-sec`): its heading with a quiet line beside it (“as of 7 Nov
 * 2026”), then its content and its quiet note under it (`p.rk-hint`; the export's inline 12 px
 * above is the central patch's `rk-x-hint-list`).
 */
export function FaStudentSection({
  titleId,
  title,
  aside,
  note,
  children,
}: {
  readonly titleId: string;
  readonly title: ReactNode;
  readonly aside?: ReactNode;
  readonly note?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <section className="rk-sec" aria-labelledby={titleId}>
      <div className="rk-sec-h">
        <h2 className="rb-h2" id={titleId}>
          {title}
        </h2>
        {aside ? <p className="rk-hint">{aside}</p> : null}
      </div>
      {children}
      {note ? <Hint under="list">{note}</Hint> : null}
    </section>
  );
}

/**
 * The Student's progress by format (`ul.fa-fmlist`): one row per format the institution has — the
 * chip, the status, the completion date.
 */
export function FaStudentFormatList({
  label,
  formats,
}: {
  /** “Progress by format”. */
  readonly label: string;
  readonly formats: readonly FaStudentsFormat[];
}) {
  return (
    <ul className="fa-fmlist" aria-label={label}>
      {formats.map((format) => (
        <li key={format.key}>
          <span className="xr-fmt">{format.code}</span>
          {format.status}
          {format.date ? <span className="fa-fmlist-d">{format.date}</span> : null}
        </li>
      ))}
    </ul>
  );
}
