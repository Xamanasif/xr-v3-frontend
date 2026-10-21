'use client';

import type { ChangeEvent, FormEvent, ReactNode, Ref } from 'react';

import { joinClasses } from '../internal/classes.js';
import { Button } from './actions.js';
import { FaTable } from './fa.js';
import { Field, Textarea } from './fields.js';
import { Glyph, Icon } from './icons.js';
import { StatusPill } from './status.js';

/*
 * What only the Faculty's Question bank screens draw — FA-14 Question bank (Questions · Drafts to
 * review), FA-15 Add / edit question, FA-16 Draft questions with assistance and FA-17 Import
 * questions (`fa-` classes; the owner-approved Faculty export, design/v3-refined-b/roles/FA-v1,
 * `project/Main.dc.html` "FA-14" … "FA-17" and `project/fa.css`): the bank's deleted box and its
 * phone line, the draft review cards, the "how it works" steps, the side panels' headings, the
 * editor's form, fieldsets, option rows, true-or-false choice, side facts and "What students see",
 * the drafting form's surface, numbered steps, source and type cards, count choice, foot, busy
 * state, list surface and side figures, and the import's file field, destination, file row,
 * figures, row check, template and columns. The shared families (the refined table, the toolbar,
 * the record tabs, the authoring layout and form sections, the stepper, the message card, the
 * question meta, the checklist, the result) are `fa.tsx`'s. Every word, figure and destination
 * comes from the caller; no piece prints a record's internal reference.
 *
 * The export's inline sizes are the central patch's product classes (V3P-17), each on the element
 * the export styles: the group errors' `margin-top: 10px` (`rk-x-ferr-above`, V3P-13's), the
 * drafting form's `padding-bottom: 0` sections (`rk-x-sec-flush`), the list line's
 * `margin-top: -6px` (`rk-x-next-pull`), the template hint's `margin-top: 6px` (`rk-x-hint-head`)
 * and the download line's `margin-top: 12px` (`rk-x-dl-line`) here; the "From a draft you reviewed"
 * line's `margin-top: 8px` (`FaCellLine` `apart`), the confirm checklist's `margin-top: 0`
 * (`FaChecklist` `flush`), the marks field's `max-width: 240px` (`TextInput` `short`) and the list
 * notice's `margin-top: 16px` (`Notice` `space="above"`) through the shared pieces.
 */

// ---- FA-14 Question bank --------------------------------------------------------------------------

/** A value phones show in a bank row's meta line only (`span.fa-mob`): "added 20 Oct 2026". */
export function FaBankPhoneOnly({ children }: { readonly children: ReactNode }) {
  return <span className="fa-mob">{children}</span>;
}

export interface FaBankDeletedProps {
  readonly titleId: string;
  /** "Deleted". */
  readonly title: ReactNode;
  /** One line per question deleted on this visit: "<question> — deleted 7 Nov 2026 · history kept". */
  readonly items: readonly { readonly key: string; readonly text: ReactNode }[];
}

/** The questions deleted on this visit, under the list (`div.fa-deletedbox[role=region]`). */
export function FaBankDeleted({ titleId, title, items }: FaBankDeletedProps) {
  return (
    <div className="fa-deletedbox" aria-labelledby={titleId} role="region">
      <h3 className="fa-k" id={titleId}>
        {title}
      </h3>
      <ul className="fa-deleted">
        {items.map((item) => (
          <li key={item.key}>{item.text}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A side panel's heading: `h2.rb-h2` ("How review works", "This question", "The template"),
 * `h3.rk-h3` ("What students see", "Columns"), or an `h2` drawn small (`h2.rk-h3`: FA-16's "How
 * drafting works", "This request", "Your bank for this experiment").
 */
export function FaBankSideTitle({
  id,
  level = 2,
  small = false,
  children,
}: {
  readonly id?: string;
  readonly level?: 2 | 3;
  readonly small?: boolean;
  readonly children: ReactNode;
}) {
  const Heading = level === 3 ? 'h3' : 'h2';
  return (
    <Heading className={level === 3 || small ? 'rk-h3' : 'rb-h2'} id={id}>
      {children}
    </Heading>
  );
}

// ---- Drafts: review cards and "how it works" -----------------------------------------------------

export interface FaHowStep {
  readonly title: ReactNode;
  readonly text: ReactNode;
}

/** "How review works" / "How drafting works": numbered steps (`ol.fa-howto` > `b` + `span`). */
export function FaBankHowTo({ steps }: { readonly steps: readonly FaHowStep[] }) {
  return (
    <ol className="fa-howto">
      {steps.map((step, index) => (
        <li key={index}>
          <b>{step.title}</b>
          <span>{step.text}</span>
        </li>
      ))}
    </ol>
  );
}

/** The drafts as review cards (`ul.fa-dlist`), each a `FaDraftCard`. */
export function FaDraftList({ children }: { readonly children: ReactNode }) {
  return <ul className="fa-dlist">{children}</ul>;
}

export interface FaDraftOption {
  /** "A" … "D" (hidden from screen readers: the option's words follow it). */
  readonly letter: string;
  readonly text: ReactNode;
  /** The key: tinted, with "Correct" and a tick. */
  readonly correct: boolean;
}

export interface FaDraftCardProps {
  /** The card's id: a focus target (`tabindex=-1`). */
  readonly id?: string;
  /**
   * Waiting for review — "Draft — needs your review" (warn pill) and "Drafted with assistance"
   * (tag) — or added on this visit: "In your bank · reviewed by you" (ok pill), no answer, no
   * actions (`is-added`).
   */
  readonly state:
    | {
        readonly kind: 'review';
        readonly needsReview: ReactNode;
        readonly assisted: ReactNode;
      }
    | { readonly kind: 'added'; readonly inBank: ReactNode };
  /** The quiet line beside the tags (`p.fa-dcard-m`): "Multiple choice". */
  readonly meta: ReactNode;
  /** The draft's words (`p.fa-dcard-t`); `textId` names an editor opened in the card. */
  readonly text: ReactNode;
  readonly textId?: string;
  /** A choice draft's options with its key (`ul.fa-dopts`), named "Answer options in this draft". */
  readonly options?: {
    readonly label: string;
    readonly correctWord: ReactNode;
    readonly items: readonly FaDraftOption[];
  } | null;
  /** A true-or-false draft's answer, or a written draft's guidance (`p.fa-dkey`). */
  readonly keyLine?: { readonly label: ReactNode; readonly value: ReactNode } | null;
  /** "Review and edit", "Add to bank", "Discard" (`div.fa-dcard-act`). */
  readonly actions?: ReactNode;
  /** What opens in the card after its content (the review fields). */
  readonly children?: ReactNode;
}

/**
 * A draft to review (`li.fa-dcard`): its tags and type, its words, its options with the key (or
 * the true-or-false answer, or the marking guidance) and its actions — FA-14's Drafts tab and
 * FA-16's list.
 */
export function FaDraftCard({
  id,
  state,
  meta,
  text,
  textId,
  options,
  keyLine,
  actions,
  children,
}: FaDraftCardProps) {
  return (
    <li
      className={joinClasses('fa-dcard', state.kind === 'added' && 'is-added')}
      id={id}
      tabIndex={id ? -1 : undefined}
    >
      <div className="fa-dcard-top">
        <div className="fa-dcard-tags">
          {state.kind === 'review' ? (
            <>
              <StatusPill tone="warn">{state.needsReview}</StatusPill>
              <span className="fa-tag">{state.assisted}</span>
            </>
          ) : (
            <StatusPill tone="ok">{state.inBank}</StatusPill>
          )}
        </div>
        <p className="fa-dcard-m">{meta}</p>
      </div>
      <p className="fa-dcard-t" id={textId}>
        {text}
      </p>
      {options ? (
        <ul className="fa-dopts" aria-label={options.label}>
          {options.items.map((option) => (
            <li key={option.letter} className={joinClasses('fa-dopt', option.correct && 'is-key')}>
              <b aria-hidden="true">{option.letter}</b>
              <span>{option.text}</span>
              {option.correct ? (
                <span className="fa-dopt-k">
                  <Glyph name="check" />
                  {options.correctWord}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {keyLine ? (
        <p className="fa-dkey">
          <b>{keyLine.label}</b>
          <span>{keyLine.value}</span>
        </p>
      ) : null}
      {actions ? <div className="fa-dcard-act">{actions}</div> : null}
      {children}
    </li>
  );
}

// ---- FA-15 Add / edit question --------------------------------------------------------------------

export interface FaBankFieldsetProps {
  /** The fieldset's id: an error-summary link target (focusable). */
  readonly id: string;
  /** The question (`legend`) and its quiet line (`legend > span`). */
  readonly legend: ReactNode;
  readonly legendHint?: ReactNode;
  /** Its errors under the answer (`p.rk-ferr` each), in the fieldset's description. */
  readonly errors?: readonly { readonly id: string; readonly text: ReactNode }[];
  /** More of the fieldset's description, before its errors. */
  readonly describedBy?: string;
  readonly children: ReactNode;
}

/**
 * A group of answer fields (`fieldset.rk-fieldset`, `is-invalid` with an error): "Answer options"
 * (`FaBankOptionRows`), "The statement is" (`FaBankStatement`).
 */
export function FaBankFieldset({
  id,
  legend,
  legendHint,
  errors = [],
  describedBy,
  children,
}: FaBankFieldsetProps) {
  const described = [describedBy, ...errors.map((error) => error.id)].filter(Boolean).join(' ');
  return (
    <fieldset
      className={joinClasses('rk-fieldset', errors.length > 0 && 'is-invalid')}
      id={id}
      tabIndex={-1}
      aria-describedby={described || undefined}
    >
      <legend>
        {legend}
        {legendHint ? <span>{legendHint}</span> : null}
      </legend>
      {children}
      {errors.map((error) => (
        <p key={error.id} className="rk-ferr rk-x-ferr-above" id={error.id}>
          <Glyph name="alertCircle" />
          {error.text}
        </p>
      ))}
    </fieldset>
  );
}

export interface FaBankOptionRow {
  /** The text field's id ("qe-o0") and label ("Option A"). */
  readonly id: string;
  readonly label: ReactNode;
  readonly value: string;
  /** Marked invalid (the first two while fewer than two options are given). */
  readonly invalid?: boolean;
  readonly onChange: (value: string) => void;
  /** The "Correct" radio: its id, its name in words ("Option A is the correct answer"). */
  readonly correctId: string;
  readonly correctName: string;
  readonly checked: boolean;
  readonly onPick: () => void;
}

export interface FaBankOptionRowsProps {
  /** The radios' group name. */
  readonly name: string;
  /** "Correct" (beside each radio, hidden from screen readers: the radio carries its name). */
  readonly correctWord: ReactNode;
  readonly rows: readonly FaBankOptionRow[];
}

/**
 * The answer options of a choice question (`div.fa-optlist` > `div.fa-optrow`): each option's text
 * field and its "Correct" radio, one of which is the key.
 */
export function FaBankOptionRows({ name, correctWord, rows }: FaBankOptionRowsProps) {
  return (
    <div className="fa-optlist">
      {rows.map((row) => (
        <div key={row.id} className="fa-optrow">
          <div className="rk-field">
            <label className="rk-label" htmlFor={row.id}>
              {row.label}
            </label>
            <input
              id={row.id}
              className="rk-input"
              type="text"
              autoComplete="off"
              value={row.value}
              aria-invalid={row.invalid ? true : undefined}
              onChange={(event: ChangeEvent<HTMLInputElement>) => row.onChange(event.target.value)}
            />
          </div>
          <label className="rk-check" htmlFor={row.correctId}>
            <input
              type="radio"
              name={name}
              id={row.correctId}
              checked={row.checked}
              aria-label={row.correctName}
              onChange={row.onPick}
            />
            <span aria-hidden="true">{correctWord}</span>
          </label>
        </div>
      ))}
    </div>
  );
}

/** "The statement is" True · False (`div.rk-checks` > `label.rk-check` radios). */
export function FaBankStatement<Value extends string>({
  name,
  idPrefix,
  options,
  value,
  onChange,
}: {
  readonly name: string;
  /** The radios' ids: `<idPrefix>-<value>`. */
  readonly idPrefix: string;
  readonly options: readonly { readonly value: Value; readonly label: ReactNode }[];
  readonly value: Value | null;
  readonly onChange: (value: Value) => void;
}) {
  return (
    <div className="rk-checks">
      {options.map((option) => {
        const id = `${idPrefix}-${option.value}`;
        return (
          <label key={option.value} className="rk-check" htmlFor={id}>
            <input
              type="radio"
              name={name}
              id={id}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}

/** "Choose the question type to set its answer." while no type is chosen (`p.fa-answerhint`). */
export function FaBankAnswerHint({ children }: { readonly children: ReactNode }) {
  return <p className="fa-answerhint">{children}</p>;
}

export interface FaBankFact {
  readonly key: string;
  readonly term: ReactNode;
  readonly value: ReactNode;
  /** A fact that says there is nothing yet ("Not in an assessment yet"): quiet. */
  readonly quiet?: boolean;
}

/** "This question": its version, where it is used and when it was added (`dl.fa-sidedl`). */
export function FaBankFacts({ facts }: { readonly facts: readonly FaBankFact[] }) {
  return (
    <dl className="fa-sidedl">
      {facts.map((fact) => (
        <div key={fact.key}>
          <dt>{fact.term}</dt>
          <dd className={fact.quiet ? 'is-quiet' : undefined}>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** "What students see": when they see what (`ul.fa-seelist` > `b` + `span`). */
export function FaBankSeeList({ items }: { readonly items: readonly FaHowStep[] }) {
  return (
    <ul className="fa-seelist">
      {items.map((item, index) => (
        <li key={index}>
          <b>{item.title}</b>
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

// ---- FA-16 Draft questions with assistance --------------------------------------------------------

/**
 * The stand-in note at the top of the form and the lists (`div.fa-sample`, a note): the drafts
 * come from a fixed sample set — the product's own words (the export's sentence names its preview).
 */
export function FaDraftSample({ children }: { readonly children: ReactNode }) {
  return (
    <div className="fa-sample" role="note">
      <Glyph name="infoDisc" />
      <p>{children}</p>
    </div>
  );
}

/**
 * The drafting form (`form.rk-surface[aria-labelledby]`), named by its visually hidden heading
 * (`h2.xr-sr`): "What to draft".
 */
export function FaDraftForm({
  titleId,
  title,
  onSubmit,
  children,
}: {
  readonly titleId: string;
  readonly title: ReactNode;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly children: ReactNode;
}) {
  return (
    <form className="rk-surface" aria-labelledby={titleId} noValidate onSubmit={onSubmit}>
      <h2 className="xr-sr" id={titleId}>
        {title}
      </h2>
      {children}
    </form>
  );
}

/**
 * A message at the form's top, in its own section with no space under it (`div.rk-sec`,
 * `rk-x-sec-flush`, V3P-17): the summary, the failure.
 */
export function FaDraftFormMessage({ children }: { readonly children: ReactNode }) {
  return <div className="rk-sec rk-x-sec-flush">{children}</div>;
}

/** The drafting form's numbered steps (`ol.fa-nsteps`), each a `FaDraftStep`. */
export function FaDraftSteps({ children }: { readonly children: ReactNode }) {
  return <ol className="fa-nsteps">{children}</ol>;
}

/** One numbered step (`li.fa-nstep`, `is-done` once it is answered): its number, then its body. */
export function FaDraftStep({
  number,
  done = false,
  children,
}: {
  readonly number: number;
  readonly done?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <li className={joinClasses('fa-nstep', done && 'is-done')}>
      <span className="fa-nstep-n" aria-hidden="true">
        {number}
      </span>
      <div className="fa-nstep-body">{children}</div>
    </li>
  );
}

export interface FaDraftGroupProps {
  /** The fieldset's id: an error-summary link target (focusable). */
  readonly id: string;
  readonly legend: ReactNode;
  /** The quiet line under the legend (`p.fa-nstep-hint`): "Choose one." */
  readonly hint: ReactNode;
  /** The error under the choices (`p.rk-ferr`), in the fieldset's description. */
  readonly error?: ReactNode;
  readonly children: ReactNode;
}

/** A step's question (`fieldset.rk-fieldset` > `legend` + `p.fa-nstep-hint` + choices + error). */
export function FaDraftGroup({ id, legend, hint, error, children }: FaDraftGroupProps) {
  const errorId = `${id}-e`;
  return (
    <fieldset
      className={joinClasses('rk-fieldset', error ? 'is-invalid' : undefined)}
      id={id}
      tabIndex={-1}
      aria-describedby={error ? errorId : undefined}
    >
      <legend>{legend}</legend>
      <p className="fa-nstep-hint">{hint}</p>
      {children}
      {error ? (
        <p className="rk-ferr rk-x-ferr-above" id={errorId}>
          <Glyph name="alertCircle" />
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export interface FaDraftCardChoice<Value extends string> {
  readonly value: Value;
  readonly title: ReactNode;
  /** The second line (`span.rk-choice-d`), in the input's description. */
  readonly description?: ReactNode;
  /** A glyph before the title (`span.fa-choice-t`): the lab brief's file, the pasted text's pencil. */
  readonly icon?: 'file' | 'pencil';
}

interface FaDraftCardsBase<Value extends string> {
  /** The inputs' ids: `<idPrefix>-<value>`. */
  readonly idPrefix: string;
  readonly options: readonly FaDraftCardChoice<Value>[];
}

function DraftChoiceLabel<Value extends string>({
  option,
  inputId,
  input,
}: {
  readonly option: FaDraftCardChoice<Value>;
  readonly inputId: string;
  readonly input: ReactNode;
}) {
  return (
    <label className="rk-choice" htmlFor={inputId}>
      {input}
      <span
        className={joinClasses('rk-choice-t', option.icon && 'fa-choice-t')}
        id={`${inputId}-t`}
      >
        {option.icon ? <Glyph name={option.icon} /> : null}
        {option.title}
      </span>
      {option.description ? (
        <span className="rk-choice-d" id={`${inputId}-d`}>
          {option.description}
        </span>
      ) : null}
    </label>
  );
}

/** Step 1's material (`div.fa-srcgrid`): radio cards, one chosen. */
export function FaDraftSourceCards<Value extends string>({
  idPrefix,
  name,
  options,
  value,
  onChange,
}: FaDraftCardsBase<Value> & {
  readonly name: string;
  readonly value: Value | null;
  readonly onChange: (value: Value) => void;
}) {
  return (
    <div className="fa-srcgrid">
      {options.map((option) => {
        const inputId = `${idPrefix}-${option.value}`;
        return (
          <DraftChoiceLabel
            key={option.value}
            option={option}
            inputId={inputId}
            input={
              <input
                type="radio"
                name={name}
                id={inputId}
                checked={value === option.value}
                aria-labelledby={`${inputId}-t`}
                aria-describedby={option.description ? `${inputId}-d` : undefined}
                onChange={() => onChange(option.value)}
              />
            }
          />
        );
      })}
    </div>
  );
}

/** Step 2's question types (`div.fa-typegrid`): checkbox cards, one or more chosen. */
export function FaDraftTypeCards<Value extends string>({
  idPrefix,
  options,
  values,
  onToggle,
}: FaDraftCardsBase<Value> & {
  readonly values: readonly Value[];
  readonly onToggle: (value: Value) => void;
}) {
  return (
    <div className="fa-typegrid">
      {options.map((option) => {
        const inputId = `${idPrefix}-${option.value}`;
        return (
          <DraftChoiceLabel
            key={option.value}
            option={option}
            inputId={inputId}
            input={
              <input
                type="checkbox"
                id={inputId}
                checked={values.includes(option.value)}
                aria-labelledby={`${inputId}-t`}
                aria-describedby={option.description ? `${inputId}-d` : undefined}
                onChange={() => onToggle(option.value)}
              />
            }
          />
        );
      })}
    </div>
  );
}

/** Step 3's count (`div.fa-segpick`): "3 drafts" · "5 drafts", radios drawn as one switch. */
export function FaDraftCountPick<Value extends string>({
  idPrefix,
  name,
  options,
  value,
  onChange,
}: {
  readonly idPrefix: string;
  readonly name: string;
  readonly options: readonly { readonly value: Value; readonly label: ReactNode }[];
  readonly value: Value | null;
  readonly onChange: (value: Value) => void;
}) {
  return (
    <div className="fa-segpick">
      {options.map((option) => {
        const inputId = `${idPrefix}-${option.value}`;
        return (
          <label key={option.value} htmlFor={inputId}>
            <input
              type="radio"
              name={name}
              id={inputId}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}

/**
 * The drafting form's foot (`div.fa-draftfoot`): the way out, the quiet note, then the primary
 * (`button.rb-btn--primary.rb-btn--lg.fa-draftfoot-primary`, a submit; first on phones).
 */
export function FaDraftFoot({
  cancel,
  note,
  primaryLabel,
}: {
  readonly cancel: ReactNode;
  readonly note: ReactNode;
  /** "Draft questions". */
  readonly primaryLabel: ReactNode;
}) {
  return (
    <div className="fa-draftfoot">
      {cancel}
      <p className="fa-draftfoot-note">{note}</p>
      <Button variant="primary" size="lg" type="submit" className="fa-draftfoot-primary">
        {primaryLabel}
      </Button>
    </div>
  );
}

/** "Text to draft from" under step 1's choices (`div.rk-field.fa-paste` > label + textarea). */
export function FaDraftPaste({
  id,
  label,
  error,
  value,
  onChange,
}: {
  readonly id: string;
  readonly label: ReactNode;
  readonly error?: ReactNode;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <Field id={id} className="fa-paste" label={label} error={error}>
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

/**
 * While the stand-in drafts (`section.rk-surface` > `div.rk-sec`): "Drafting questions…" (a polite
 * status that takes focus) over three skeleton cards.
 */
export function FaDraftBusy({
  id,
  message,
  ref,
}: {
  readonly id: string;
  readonly message: ReactNode;
  readonly ref?: Ref<HTMLParagraphElement>;
}) {
  return (
    <section className="rk-surface" aria-labelledby={id} aria-busy="true">
      <div className="rk-sec">
        <p
          ref={ref}
          className="rk-loading-msg"
          id={id}
          tabIndex={-1}
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
        <div className="rk-skel-ca" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <div key={index} className="rk-skel-card">
              <span className="rk-skel" />
              <span className="rk-skel" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export interface FaDraftListSurfaceProps {
  readonly titleId: string;
  /** "Drafts to review" (`h2.rb-h2`, a focus target). */
  readonly title: ReactNode;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** "3 drafts left to review" (`p.rk-count[role=status]`); none while the drafts load. */
  readonly count?: ReactNode;
  /** Before the section: the stand-in note (`FaDraftSample`). */
  readonly before?: ReactNode;
  /** The line under the head (`p.rk-next`). */
  readonly line: ReactNode;
  readonly children: ReactNode;
}

/**
 * FA-16's drafts to review (`section.rk-surface` > `div.rk-sec` > `div.rk-sec-h` with the heading
 * and the count, the line, then the cards).
 */
export function FaDraftListSurface({
  titleId,
  title,
  titleRef,
  count,
  before,
  line,
  children,
}: FaDraftListSurfaceProps) {
  return (
    <section className="rk-surface" aria-labelledby={titleId}>
      {before}
      <div className="rk-sec">
        <div className="rk-sec-h">
          <h2 className="rb-h2" id={titleId} ref={titleRef} tabIndex={-1}>
            {title}
          </h2>
          {count === undefined ? null : (
            <p className="rk-count" role="status">
              {count}
            </p>
          )}
        </div>
        <p className="rk-next rk-x-next-pull">{line}</p>
        {children}
      </div>
    </section>
  );
}

/** Figures in the side panel (`dl.fa-sidefacts`): "Drafted 3", "Questions 6". */
export function FaDraftFacts({
  facts,
}: {
  readonly facts: readonly {
    readonly key: string;
    readonly term: ReactNode;
    readonly value: ReactNode;
  }[];
}) {
  return (
    <dl className="fa-sidefacts">
      {facts.map((fact) => (
        <div key={fact.key}>
          <dt>{fact.term}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The side panel's actions (`div.fa-side-acts`): "Draft more", "Back to Question bank". */
export function FaDraftSideActions({ children }: { readonly children: ReactNode }) {
  return <div className="fa-side-acts">{children}</div>;
}

/** "Every draft from this request has been added or discarded." (`p.fa-quiet.fa-dl-done`). */
export function FaDraftAllDone({ children }: { readonly children: ReactNode }) {
  return <p className="fa-quiet fa-dl-done">{children}</p>;
}

// ---- FA-17 Import questions -----------------------------------------------------------------------

export interface FaImportFileFieldProps {
  readonly titleId: string;
  /** "Your CSV file" (`h2.fa-fsec-t`): the chooser's name. */
  readonly title: ReactNode;
  /** "One row per question, in the template’s columns." */
  readonly hint: ReactNode;
  /** The chooser (`FaImportFile`). */
  readonly children: ReactNode;
  /** The file's refusal under the chooser (`p.rk-ferr[role=alert]`). */
  readonly error?: { readonly id: string; readonly text: ReactNode } | null;
  /** The quiet line under it: "CSV only." */
  readonly foot: ReactNode;
}

/** Step 1's file field (`div.rk-field` > the title, the hint, the chooser, its error, the note). */
export function FaImportFileField({
  titleId,
  title,
  hint,
  children,
  error,
  foot,
}: FaImportFileFieldProps) {
  return (
    <div className="rk-field">
      <h2 className="fa-fsec-t" id={titleId}>
        {title}
      </h2>
      <p className="rk-hint">{hint}</p>
      {children}
      {error ? (
        <p className="rk-ferr" id={error.id} role="alert">
          <Glyph name="alertCircle" />
          {error.text}
        </p>
      ) : null}
      <p className="rk-hint">{foot}</p>
    </div>
  );
}

export interface FaImportFileProps {
  /** The group's name: the field's title id ("Your CSV file"). */
  readonly labelledBy: string;
  /** The chosen file's name, or none ("No file chosen", quiet). */
  readonly fileName: string | null;
  readonly noFile: ReactNode;
  /** The id of the line that names the file (in the button's description). */
  readonly statusId: string;
  /** "Choose a CSV file": opens the browser's own chooser (the hidden input). */
  readonly button: {
    readonly id: string;
    readonly label: ReactNode;
    readonly ref?: Ref<HTMLButtonElement>;
    readonly describedBy?: string;
  };
  readonly input: {
    readonly id: string;
    readonly accept: string;
    readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    readonly ref?: Ref<HTMLInputElement>;
  };
  readonly onChoose: () => void;
}

/**
 * The file chooser (`div.fa-file.fa-file--import[role=group]`): the file's glyph, its name (or "No
 * file chosen"), the hidden real input and "Choose a CSV file", which opens it.
 */
export function FaImportFile({
  labelledBy,
  fileName,
  noFile,
  statusId,
  button,
  input,
  onChoose,
}: FaImportFileProps) {
  return (
    <div className="fa-file fa-file--import" role="group" aria-labelledby={labelledBy}>
      <Icon name="file" />
      <span className={joinClasses('fa-file-name', fileName === null && 'is-none')} id={statusId}>
        {fileName ?? noFile}
      </span>
      <input
        ref={input.ref}
        type="file"
        id={input.id}
        accept={input.accept}
        tabIndex={-1}
        aria-hidden="true"
        onChange={input.onChange}
      />
      <button
        ref={button.ref}
        type="button"
        className="rb-btn"
        id={button.id}
        aria-describedby={button.describedBy}
        onClick={onChoose}
      >
        {button.label}
      </button>
    </div>
  );
}

/** Where the questions go (`p.fa-dest`, the stack glyph): "Questions go into your bank for …". */
export function FaImportDest({ children }: { readonly children: ReactNode }) {
  return (
    <p className="fa-dest">
      <Glyph name="stack" />
      <span>{children}</span>
    </p>
  );
}

/** The checked file's name (`p.fa-filerow` > the file glyph + `span.rk-strong`). */
export function FaImportFileRow({ children }: { readonly children: ReactNode }) {
  return (
    <p className="fa-filerow">
      <Icon name="file" />
      <span className="rk-strong">{children}</span>
    </p>
  );
}

export interface FaImportFigure {
  readonly key: string;
  readonly term: ReactNode;
  readonly value: ReactNode;
  /** The figure's colour: ready (`ok`), errors (`err`), warnings (`warn`), none of them (`none`). */
  readonly tone?: 'ok' | 'err' | 'warn' | 'none';
}

/**
 * The check's figures (`dl.fa-repfigs`): Rows · Ready · With errors · With warnings. The export
 * makes the list a live region (`role="status"`); a role on a `dl` takes its terms out of their
 * list (axe `dlitem`), and the step's heading takes focus when the check arrives, so the list
 * stays a plain description list.
 */
export function FaImportFigures({ figures }: { readonly figures: readonly FaImportFigure[] }) {
  return (
    <dl className="fa-repfigs">
      {figures.map((figure) => (
        <div key={figure.key} className={figure.tone ? `is-${figure.tone}` : undefined}>
          <dt>{figure.term}</dt>
          <dd>{figure.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export interface FaImportProblem {
  readonly key: string;
  readonly row: ReactNode;
  readonly question: ReactNode;
  readonly fix: ReactNode;
  /** "Error — blocks import" (err pill) or "Warning" (warn pill). */
  readonly type: ReactNode;
  readonly severity: 'error' | 'warning';
}

export interface FaImportRowCheckProps {
  /** "Rows that need attention": the section title and the table's caption. */
  readonly title: ReactNode;
  readonly caption: ReactNode;
  readonly headers: {
    readonly row: string;
    readonly question: string;
    readonly fix: string;
    readonly type: string;
  };
  readonly rows: readonly FaImportProblem[];
}

/**
 * "Rows that need attention" (`div.fa-rowcheck` > `h2.fa-fsec-t` + the shared table in a box):
 * Row · Question · What to fix · Type, labelled cells on phones.
 */
export function FaImportRowCheck({ title, caption, headers, rows }: FaImportRowCheckProps) {
  return (
    <div className="fa-rowcheck">
      <h2 className="fa-fsec-t">{title}</h2>
      <FaTable
        kind="rows"
        caption={caption}
        columns={[
          { key: 'row', header: headers.row },
          { key: 'question', header: headers.question },
          { key: 'fix', header: headers.fix },
          { key: 'type', header: headers.type },
        ]}
        rows={rows.map((row) => ({
          key: row.key,
          static: true,
          cells: [
            {
              key: 'row',
              nowrap: true,
              main: true,
              inline: true,
              label: headers.row,
              children: <span className="rk-strong">{row.row}</span>,
            },
            {
              key: 'question',
              wide: true,
              noLabel: true,
              label: headers.question,
              children: row.question,
            },
            { key: 'fix', wide: true, label: headers.fix, children: row.fix },
            {
              key: 'type',
              status: true,
              label: headers.type,
              children: (
                <StatusPill tone={row.severity === 'error' ? 'err' : 'warn'}>{row.type}</StatusPill>
              ),
            },
          ],
        }))}
      />
    </div>
  );
}

export interface FaImportTemplateProps {
  /** "One row per question. A file imports whole or not at all." */
  readonly line: ReactNode;
  /** "Download the template (CSV)": a `data:` link with a file name. */
  readonly download: {
    readonly label: ReactNode;
    readonly href: string;
    readonly fileName: string;
  };
}

/**
 * The template's line and its download (`p.rk-hint` + `a.rb-link.fa-dl`), 6 px and 12 px apart
 * (`rk-x-hint-head`, `rk-x-dl-line`, V3P-17).
 */
export function FaImportTemplate({ line, download }: FaImportTemplateProps) {
  return (
    <>
      <p className="rk-hint rk-x-hint-head">{line}</p>
      <p className="rk-x-dl-line">
        <a className="rb-link fa-dl" href={download.href} download={download.fileName}>
          <Icon name="download" size={18} />
          {download.label}
        </a>
      </p>
    </>
  );
}

/**
 * The template's columns (`dl.fa-tpl`): each column and what goes in it. The export names the list
 * with `aria-label` ("Template columns"); a `dl` has no role a name belongs to, so the "Columns"
 * heading above it names it instead.
 */
export function FaImportColumns({
  columns,
}: {
  readonly columns: readonly { readonly column: string; readonly what: ReactNode }[];
}) {
  return (
    <dl className="fa-tpl">
      {columns.map((entry) => (
        <div key={entry.column}>
          <dt>{entry.column}</dt>
          <dd>{entry.what}</dd>
        </div>
      ))}
    </dl>
  );
}
