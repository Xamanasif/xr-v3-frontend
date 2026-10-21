'use client';

import { Fragment, type FormEvent, type ReactNode, type Ref } from 'react';

import { joinClasses } from '../internal/classes.js';
import { FaGuide, FaQuestionMarks, FaQuestionMeta, FaSheetQuestionHead } from './fa.js';
import { Glyph } from './icons.js';

/*
 * What only the Faculty's Assessments screens draw — FA-06 Assessments, FA-07 Create assessment and
 * the assessment record FA-08 Summary, FA-09 Questions, FA-10 Settings, FA-11 Preview and FA-12
 * Submissions with its FA-22 export (`fa-` classes; the owner-approved Faculty export,
 * design/v3-refined-b/roles/FA-v1, `project/Main.dc.html` "FA-06 Assessments", "FA-07 Create
 * assessment", "FA-08…FA-12 Assessment record" and `project/fa.css`): step 1's experiment cards,
 * step 3's question picker, "This assessment", the rules as set and the introduction, the ordered
 * questions with their move and remove actions, FA-09's ways to add and its bank panel, FA-08's
 * record sections and waiting list, FA-10's form and side lines, and FA-11's preview sheet. What
 * more than one Faculty group draws (the record band, tabs, table, toolbar, segments, export band,
 * messages, steps, form sections, checklist …) is `fa.tsx`'s. Every word, figure, state and
 * destination comes from the caller; no piece prints an assessment's, an attempt's or a question's
 * internal reference (the owner's identifier rule, WHAT-CHANGED P10): the caller names each by
 * content.
 *
 * The export's inline sizes on these screens are not drawn here (the consolidation patches them
 * centrally); where the central patch already has the very value as a product class, it is
 * emitted: a group error's `margin-top: 10px` is `rk-x-ferr-above` (V3P-13).
 */

type Node = ReactNode;

// ---- FA-06 Assessments -------------------------------------------------------------------------------

/** The days left under a deadline in FA-06's table (`span.fa-left`): "7 days left", "Due today". */
export function FaAssessmentsDaysLeft({ children }: { readonly children: Node }) {
  return <span className="fa-left">{children}</span>;
}

// ---- FA-07 Create assessment: step 1's experiments --------------------------------------------

export interface FaCreateExperiment {
  readonly value: string;
  readonly title: Node;
  /** "ME ZG523 · Thermodynamics & Heat Transfer · No assessment yet". */
  readonly line: Node;
  /**
   * The formats the institution holds (`FaFormatBadges`) and "5 students with access"
   * (`span.fa-expchoice-m`); left out until known.
   */
  readonly meta?: Node;
}

export interface FaCreateExperimentsProps {
  /** The fieldset's id (an error-summary target); options are `<id>-<value>`, the error `<id>-e`. */
  readonly id: string;
  readonly name: string;
  readonly legend: Node;
  readonly legendHint?: Node;
  readonly options: readonly FaCreateExperiment[];
  readonly value: string | null;
  readonly onChange: (value: string) => void;
  readonly error?: Node;
}

/** A group's error under its options (`p.rk-ferr`, 10 px above: `rk-x-ferr-above`, V3P-13). */
function GroupError({ id, children }: { readonly id: string; readonly children: Node }) {
  return (
    <p className="rk-ferr rk-x-ferr-above" id={id}>
      <Glyph name="alertCircle" />
      {children}
    </p>
  );
}

/**
 * Step 1's experiments (`fieldset.rk-fieldset` > `div.rk-choices` > `label.rk-choice.fa-expchoice`):
 * the experiment, its course line, and the formats the institution holds with the students who
 * have it (`span.fa-expchoice-m`). Each radio is named by its title and described by its lines;
 * the error is the fieldset's description.
 */
export function FaCreateExperiments({
  id,
  name,
  legend,
  legendHint,
  options,
  value,
  onChange,
  error,
}: FaCreateExperimentsProps) {
  const errorId = error ? `${id}-e` : undefined;
  return (
    <fieldset
      className={joinClasses('rk-fieldset', error ? 'is-invalid' : undefined)}
      id={id}
      aria-describedby={errorId}
    >
      <legend>
        {legend}
        {legendHint ? <span>{legendHint}</span> : null}
      </legend>
      <div className="rk-choices">
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          const hasMeta = option.meta !== undefined && option.meta !== null;
          return (
            <label key={option.value} className="rk-choice fa-expchoice" htmlFor={optionId}>
              <input
                type="radio"
                id={optionId}
                name={name}
                checked={value === option.value}
                aria-labelledby={`${optionId}-t`}
                aria-describedby={hasMeta ? `${optionId}-d ${optionId}-m` : `${optionId}-d`}
                onChange={() => onChange(option.value)}
              />
              <span className="rk-choice-t" id={`${optionId}-t`}>
                {option.title}
              </span>
              <span className="rk-choice-d" id={`${optionId}-d`}>
                {option.line}
              </span>
              {hasMeta ? (
                <span className="fa-expchoice-m" id={`${optionId}-m`}>
                  {option.meta}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
      {error && errorId ? <GroupError id={errorId}>{error}</GroupError> : null}
    </fieldset>
  );
}

/** The result's readiness line (`p.fa-row`): the large status pill. */
export function FaCreateResultStatus({ children }: { readonly children: Node }) {
  return <p className="fa-row">{children}</p>;
}

// ---- FA-07 step 3's questions --------------------------------------------------------------------

export interface FaCreatePickerProps {
  /** The fieldset's id (an error-summary target); boxes are `<id>-<value>`, the error `<id>-e`. */
  readonly id: string;
  /** The visually hidden legend: "Questions for this assessment". */
  readonly legend: string;
  readonly options: readonly {
    readonly value: string;
    /** The question's words. */
    readonly title: Node;
    /** "Multiple choice · 2 marks". */
    readonly line: Node;
  }[];
  readonly chosen: readonly string[];
  readonly onToggle: (value: string) => void;
  readonly error?: Node;
}

/** Step 3's questions (`fieldset.rk-fieldset` > `div.rk-choices.fa-pick` > `label.rk-choice` checkbox). */
export function FaCreatePicker({
  id,
  legend,
  options,
  chosen,
  onToggle,
  error,
}: FaCreatePickerProps) {
  const errorId = error ? `${id}-e` : undefined;
  return (
    <fieldset
      className={joinClasses('rk-fieldset', error ? 'is-invalid' : undefined)}
      id={id}
      aria-describedby={errorId}
    >
      <legend className="xr-sr">{legend}</legend>
      <div className="rk-choices fa-pick">
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          return (
            <label key={option.value} className="rk-choice" htmlFor={optionId}>
              <input
                type="checkbox"
                id={optionId}
                checked={chosen.includes(option.value)}
                aria-labelledby={`${optionId}-t`}
                aria-describedby={`${optionId}-d`}
                onChange={() => onToggle(option.value)}
              />
              <span className="rk-choice-t" id={`${optionId}-t`}>
                {option.title}
              </span>
              <span className="rk-choice-d" id={`${optionId}-d`}>
                {option.line}
              </span>
            </label>
          );
        })}
      </div>
      {error && errorId ? <GroupError id={errorId}>{error}</GroupError> : null}
    </fieldset>
  );
}

// ---- FA-07 "This assessment" -----------------------------------------------------------------------

export interface FaCreateSummaryItem {
  readonly key: string;
  /** "Experiment", "Name", "Rules", "Questions". */
  readonly label: Node;
  /** " (done)" / " (not done yet)", read after the label. */
  readonly state: string;
  readonly value: Node;
  readonly done: boolean;
}

/** "This assessment" (`ul.fa-sumlist` > `li.fa-sum-i(.is-done)`): each part, ticked once done. */
export function FaCreateSummary({ items }: { readonly items: readonly FaCreateSummaryItem[] }) {
  return (
    <ul className="fa-sumlist">
      {items.map((item) => (
        <li key={item.key} className={joinClasses('fa-sum-i', item.done && 'is-done')}>
          <span className="fa-sum-ico" aria-hidden="true">
            {item.done ? <Glyph name="check" /> : null}
          </span>
          <div>
            <p className="fa-k">
              {item.label}
              <span className="xr-sr">{item.state}</span>
            </p>
            <p className="fa-sum-v">{item.value}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** The side panel's heading (`h2.rb-h2`): "This assessment", "How changes apply". */
export function FaCreateSideTitle({
  id,
  children,
}: {
  readonly id: string;
  readonly children: Node;
}) {
  return (
    <h2 className="rb-h2" id={id}>
      {children}
    </h2>
  );
}

/** The side panel's closing note (`p.rk-hint.fa-side-note`). */
export function FaCreateSideNote({ children }: { readonly children: Node }) {
  return <p className="rk-hint fa-side-note">{children}</p>;
}

/** The three rules side by side (`div.fa-fields3`, a subgrid: label, hint, control, error). */
export function FaCreateRuleFields({ children }: { readonly children: Node }) {
  return <div className="fa-fields3">{children}</div>;
}

/** The release date's field (`div.rk-field.fa-reldate`): the kit `Field`'s class. */
export const FA_RELEASE_DATE_FIELD = 'fa-reldate';

// ---- the rules as set, the introduction (FA-07 step 4, FA-08) -----------------------------------

/** The rules as set (`dl.fa-rules`): each rule's name and value; a value not set yet is quiet. */
export function FaRecordRules({
  items,
}: {
  readonly items: readonly {
    readonly key: string;
    readonly term: Node;
    readonly value: Node;
    readonly quiet?: boolean;
  }[];
}) {
  return (
    <dl className="fa-rules">
      {items.map((item) => (
        <div key={item.key}>
          <dt>{item.term}</dt>
          <dd className={item.quiet ? 'is-quiet' : undefined}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The introduction students read (`div.fa-introbox`); "None" is quiet (`fa-introtext.is-quiet`). */
export function FaRecordIntro({
  label,
  quiet = false,
  children,
}: {
  readonly label: Node;
  readonly quiet?: boolean;
  readonly children: Node;
}) {
  return (
    <div className="fa-introbox">
      <p className="fa-k">{label}</p>
      <p className={joinClasses('fa-introtext', quiet && 'is-quiet')}>{children}</p>
    </div>
  );
}

// ---- the questions in order (FA-07 step 4, FA-09) ------------------------------------------------

export interface FaRecordQuestion {
  readonly key: string;
  /** The row's id: a focus target after a move (`li.fa-q[tabindex=-1]`). */
  readonly id?: string;
  readonly number: number;
  /** "Question 1: " read before the words; the number itself is then decorative (FA-09). */
  readonly lead?: string;
  readonly text: Node;
  /** "Multiple choice"; a written answer is tinted (`fa-qtype--w`). */
  readonly type: Node;
  readonly written?: boolean;
  /** "2 marks". */
  readonly marks: Node;
  /** The notes under the meta (`p.fa-qnote`): a newer version in the bank, a deletion. */
  readonly notes?: readonly { readonly key: string; readonly text: Node; readonly action?: Node }[];
  /** The row's actions (`FaRecordOrder` and Remove: `div.fa-qact.fa-qact--order`). */
  readonly actions?: Node;
}

/**
 * Questions in order (`ol.fa-qlist.fa-qlist--spaced` > `li.fa-q`): the number, the words, the type
 * tag and the marks; FA-09 adds the notes and the actions.
 */
export function FaRecordQuestions({ items }: { readonly items: readonly FaRecordQuestion[] }) {
  return (
    <ol className="fa-qlist fa-qlist--spaced">
      {items.map((item) => (
        <li key={item.key} className="fa-q" id={item.id} tabIndex={item.id ? -1 : undefined}>
          <span className="fa-qn" aria-hidden={item.lead ? true : undefined}>
            {item.number}
          </span>
          <div>
            <p className="fa-qt">
              {item.lead ? <span className="xr-sr">{item.lead}</span> : null}
              {item.text}
            </p>
            <FaQuestionMeta type={item.type} written={item.written}>
              <FaQuestionMarks>{item.marks}</FaQuestionMarks>
            </FaQuestionMeta>
            {(item.notes ?? []).map((note) => (
              <p key={note.key} className="fa-qnote">
                <Glyph name="infoDisc" />
                <span>{note.text}</span>
                {note.action}
              </p>
            ))}
          </div>
          {item.actions ? <div className="fa-qact fa-qact--order">{item.actions}</div> : null}
        </li>
      ))}
    </ol>
  );
}

export interface FaRecordOrderProps {
  /** "Order of question 2". */
  readonly label: string;
  readonly up: { readonly label: string; readonly disabled: boolean; readonly onClick: () => void };
  readonly down: {
    readonly label: string;
    readonly disabled: boolean;
    readonly onClick: () => void;
  };
}

/** Move up and down (`span.fa-order[role=group]` > `button.fa-iconbtn` ×2). */
export function FaRecordOrder({ label, up, down }: FaRecordOrderProps) {
  return (
    <span className="fa-order" role="group" aria-label={label}>
      <button
        type="button"
        className="fa-iconbtn"
        disabled={up.disabled}
        aria-label={up.label}
        onClick={up.onClick}
      >
        <Glyph name="arrowUp" />
      </button>
      <button
        type="button"
        className="fa-iconbtn"
        disabled={down.disabled}
        aria-label={down.label}
        onClick={down.onClick}
      >
        <Glyph name="arrowDown" />
      </button>
    </span>
  );
}

/**
 * FA-09's ways to add a question (`div.fa-qadd`): the buttons, then "Or Draft with assistance ·
 * Import" (`p.fa-qmore`).
 */
export function FaRecordAdd({
  buttons,
  or,
  links,
}: {
  readonly buttons: Node;
  readonly or: Node;
  readonly links: readonly Node[];
}) {
  return (
    <div className="fa-qadd">
      {buttons}
      <p className="fa-qmore">
        <span>{or}</span>
        {links.map((link, index) => (
          <Fragment key={index}>
            {index > 0 ? <span aria-hidden="true">·</span> : null}
            {link}
          </Fragment>
        ))}
      </p>
    </div>
  );
}

/** FA-09's foot line (`p.rk-hint.fa-qfoot`). */
export function FaRecordQuestionsFoot({ children }: { readonly children: Node }) {
  return <p className="rk-hint fa-qfoot">{children}</p>;
}

// ---- FA-08 … FA-12 the record's sheets ------------------------------------------------------------

/**
 * A record tab's columns (`div.rk-detailwrap` > `div.fa-single`, or `div.rk-detail` while a side
 * panel is open — FA-09's bank panel): the sheet stays the same element when the panel opens or
 * closes, so focus and what the page announces stay with it.
 */
export function FaRecordColumns({
  aside,
  children,
}: {
  /** The side panel (`FaAside`), while it is open. */
  readonly aside?: Node;
  readonly children: Node;
}) {
  return (
    <div className="rk-detailwrap">
      <div className={aside ? 'rk-detail' : 'fa-single'}>
        {children}
        {aside}
      </div>
    </div>
  );
}

export interface FaRecordSectionProps {
  readonly titleId?: string;
  readonly title?: Node;
  /** The tab's heading (`h2#…[tabindex=-1]`), a focus target. */
  readonly titleFocus?: boolean;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** A link at the end of the head ("Change settings"). */
  readonly link?: Node;
  readonly children: Node;
}

/**
 * A section of the record's sheet (`section.rk-sec[aria-labelledby]` > `div.rk-sec-h` >
 * `h2.rb-h2`); without a title, the sheet's plain body (`div.rk-sec`).
 */
export function FaRecordSection({
  titleId,
  title,
  titleFocus = false,
  titleRef,
  link,
  children,
}: FaRecordSectionProps) {
  if (title === undefined || titleId === undefined) return <div className="rk-sec">{children}</div>;
  return (
    <section className="rk-sec" aria-labelledby={titleId}>
      <div className="rk-sec-h">
        <h2
          className="rb-h2"
          id={titleId}
          ref={titleRef}
          tabIndex={titleFocus || titleRef ? -1 : undefined}
        >
          {title}
        </h2>
        {link}
      </div>
      {children}
    </section>
  );
}

/** A line of the sheet or panel (`p.rk-next`). */
export function FaRecordLine({ children }: { readonly children: Node }) {
  return <p className="rk-next">{children}</p>;
}

/** "Waiting for marking, oldest first" (`ul.fa-waitlist`): who submitted and when. */
export function FaRecordWaitList({
  label,
  items,
}: {
  readonly label: string;
  readonly items: readonly { readonly key: string; readonly name: Node; readonly when: Node }[];
}) {
  return (
    <ul className="fa-waitlist" aria-label={label}>
      {items.map((item) => (
        <li key={item.key}>
          <b>{item.name}</b>
          <span>{item.when}</span>
        </li>
      ))}
    </ul>
  );
}

/** The panel's lead line (`p.fa-panel-lead`): "Nothing is waiting for marking." */
export function FaRecordPanelLead({ children }: { readonly children: Node }) {
  return <p className="fa-panel-lead">{children}</p>;
}

/** The bank panel's questions (`ul.fa-avail.fa-avail--panel`): the words, the type and marks, Add. */
export function FaBankAvailable({
  items,
}: {
  readonly items: readonly {
    readonly key: string;
    readonly text: Node;
    readonly line: Node;
    /** The Add button. */
    readonly action: Node;
  }[];
}) {
  return (
    <ul className="fa-avail fa-avail--panel">
      {items.map((item) => (
        <li key={item.key}>
          <div>
            <p className="fa-avail-t">{item.text}</p>
            <p className="fa-qm">{item.line}</p>
          </div>
          {item.action}
        </li>
      ))}
    </ul>
  );
}

// ---- FA-10 Settings ---------------------------------------------------------------------------------

export interface FaSettingsFormProps {
  /** The form's name: the id of its heading (`FaSettingsHead`). */
  readonly labelledBy: string;
  /** Enter in a field saves, as "Save settings" does. */
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly children: Node;
}

/**
 * FA-10's form column (`form.rk-surface.fa-formcol`, named by its heading). The export's `fa-fform`
 * on it is a class no sheet defines, so it is not drawn.
 */
export function FaSettingsForm({ labelledBy, onSubmit, children }: FaSettingsFormProps) {
  return (
    <form
      className="rk-surface fa-formcol"
      aria-labelledby={labelledBy}
      noValidate
      onSubmit={onSubmit}
    >
      {children}
    </form>
  );
}

/** FA-10's form head (`div.fa-fhead`): the tab's heading and its line. */
export function FaSettingsHead({
  titleId,
  title,
  line,
}: {
  readonly titleId: string;
  readonly title: Node;
  readonly line: Node;
}) {
  return (
    <div className="fa-fhead">
      <h2 className="rb-h2" id={titleId} tabIndex={-1}>
        {title}
      </h2>
      <p className="rk-next">{line}</p>
    </div>
  );
}

/** FA-10's version line in the side panel (`p.fa-side-ver`): "Version 1 · since 27 Oct 2026, 11:05". */
export function FaSettingsVersion({ children }: { readonly children: Node }) {
  return <p className="fa-side-ver">{children}</p>;
}

// ---- FA-11 Preview ---------------------------------------------------------------------------------

/** The preview's surface (`section.rk-surface.fa-pvsurf`), named by the tab's heading. */
export function FaPreviewSurface({
  labelledBy,
  children,
}: {
  readonly labelledBy: string;
  readonly children: Node;
}) {
  return (
    <section className="rk-surface fa-pvsurf" aria-labelledby={labelledBy}>
      {children}
    </section>
  );
}

/** The preview's bar (`div.fa-pvbar`): the hidden heading, the switch and "Previewing creates …". */
export function FaPreviewBar({
  headingId,
  heading,
  switcher,
  note,
}: {
  readonly headingId: string;
  readonly heading: Node;
  /** `FaSegmented` "Preview as". */
  readonly switcher: Node;
  readonly note: Node;
}) {
  return (
    <div className="fa-pvbar">
      <h2 className="xr-sr" id={headingId} tabIndex={-1}>
        {heading}
      </h2>
      {switcher}
      <p className="rk-hint">{note}</p>
    </div>
  );
}

export interface FaPreviewQuestion {
  readonly key: string;
  /** "Question 1 of 4 · Multiple choice". */
  readonly head: Node;
  /** "2 marks". */
  readonly marks: Node;
  readonly text: Node;
  /** A choice question's options; in the key, the correct one is marked with `correctWord`. */
  readonly options?: readonly {
    readonly key: string;
    readonly text: Node;
    readonly correct?: boolean;
  }[];
  readonly correctWord?: Node;
  /** A written answer's box in the student view (`div.fa-wbox`). */
  readonly writtenBox?: Node;
  /** The key: a written answer's marking guidance (`FaGuide`). */
  readonly guidance?: { readonly label: Node; readonly text: Node };
  /** The key: the explanation (`div.fa-expl`). */
  readonly explanation?: { readonly label: Node; readonly text: Node };
}

export interface FaPreviewSheetProps {
  /** The sheet's head: as students see it (the eye), or the answer key (the key). */
  readonly head: {
    readonly kind: 'student' | 'key';
    readonly label: Node;
    readonly title: Node;
    readonly line: Node;
    readonly intro?: Node;
  };
  readonly questions: readonly FaPreviewQuestion[];
}

/**
 * The preview (`div.fa-pvstage` > `div.fa-pvsheet`): the head ("As students see it" or "Answer
 * key") and the questions in order (`ol.fa-pvlist` > `li.fa-pvq`) — a picture of the student's
 * sheet: nothing in it can be answered or saved.
 */
export function FaPreviewSheet({ head, questions }: FaPreviewSheetProps) {
  return (
    <div className="fa-pvstage">
      <div className="fa-pvsheet">
        <div className={joinClasses('fa-pvhead', head.kind === 'key' && 'fa-pvhead--key')}>
          <p className="fa-pvhead-k">
            <Glyph name={head.kind === 'key' ? 'key' : 'eye'} />
            {head.label}
          </p>
          <p className="fa-pvhead-t">{head.title}</p>
          <p className="fa-pvhead-d">{head.line}</p>
          {head.intro ? <p className="fa-pvintro">{head.intro}</p> : null}
        </div>
        <ol className="fa-pvlist">
          {questions.map((question) => (
            <li key={question.key} className="fa-pvq">
              <FaSheetQuestionHead head={question.head} marks={question.marks} />
              <p className="fa-pvq-t">{question.text}</p>
              {question.options ? (
                <ul className="fa-opts fa-pvopts">
                  {question.options.map((option) => (
                    <li
                      key={option.key}
                      className={joinClasses('fa-opt', option.correct && 'is-correct')}
                    >
                      <span className="fa-opt-dot" aria-hidden="true" />
                      <span>{option.text}</span>
                      {option.correct ? (
                        <span className="fa-opt-ok">
                          <Glyph name="check" />
                          {question.correctWord}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              {question.writtenBox ? <div className="fa-wbox">{question.writtenBox}</div> : null}
              {question.guidance ? (
                <FaGuide label={question.guidance.label}>{question.guidance.text}</FaGuide>
              ) : null}
              {question.explanation ? (
                <div className="fa-expl">
                  <p className="fa-expl-k">{question.explanation.label}</p>
                  <p className="fa-expl-t">{question.explanation.text}</p>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** A state inside the preview's stage and sheet (FA-11 "Nothing to preview yet"). */
export function FaPreviewStage({ children }: { readonly children: Node }) {
  return (
    <div className="fa-pvstage">
      <div className="fa-pvsheet">{children}</div>
    </div>
  );
}

// ---- FA-12 Submissions ---------------------------------------------------------------------------

/** The rule under a release mark in FA-12's table (`span.fa-cellsub.fa-relsub`). */
export function FaRecordReleaseSub({ children }: { readonly children: Node }) {
  return <span className="fa-cellsub fa-relsub">{children}</span>;
}
