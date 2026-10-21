'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';

import { focusField } from '../forms/error-summary.js';
import { joinClasses } from '../internal/classes.js';
import { useLinkComponent } from '../link.js';
import { Field, Textarea } from './fields.js';
import { Glyph } from './icons.js';
import { StFormatChip, type StFormatChipProps } from './st.js';
import { StatusPill, type StatusTone } from './status.js';

/*
 * What the Student progress group alone draws (owner-approved export design/v3-refined-b/roles/
 * ST-v1, `project/StudentFinal.dc.html` regions `progress` (ST-15), `feedback` (ST-16 / ST-17) and
 * `device` (ST-18); `project/v3-student-final.css`): the progress panel with its filters, chips and
 * course groups; the rating sheet, its error summary, its failure notice and the sent answers on
 * the same scale; the device card — the authorised headset, the request form, the request as three
 * dated steps, its facts and the aside's closing line. Markup as the export's template draws it;
 * every word, date, figure and destination comes from the caller. The shared pieces (format chip,
 * progress table, refusal card, how-to steps …) are `st.tsx`'s.
 */

// ---- ST-15 Progress -------------------------------------------------------------------------------

/**
 * The one progress surface (`section.sv-card.sv-prog`), named by a heading read by screen readers
 * only ("Your progress by course"): the filters, then a state row or the course groups.
 */
export function StProgressPanel({
  title,
  titleId,
  children,
}: {
  readonly title: string;
  readonly titleId: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="sv-card sv-prog" aria-labelledby={titleId}>
      <h2 className="xr-sr" id={titleId}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export interface StProgressFilterOption {
  readonly value: string;
  readonly label: string;
}

export interface StProgressFilter {
  readonly id: string;
  /** "Status", "Course". */
  readonly label: string;
  readonly value: string;
  readonly options: readonly StProgressFilterOption[];
  readonly onChange: (value: string) => void;
}

export interface StProgressChip {
  readonly key: string;
  /** "Status: Completed". */
  readonly label: string;
  /** "Remove filter Status: Completed". */
  readonly removeLabel: string;
  readonly onRemove: () => void;
}

export interface StProgressToolsProps {
  /** The filters' search region name: "Filter your progress". */
  readonly label: string;
  readonly filters: readonly StProgressFilter[];
  /** The count, announced (`p.rk-count[role=status]`, always there): "1 experiment in 1 course". */
  readonly count: ReactNode;
  readonly chips: readonly StProgressChip[];
  /** "Clear filters" (`button.rk-clear`), shown while a chip is. */
  readonly clearLabel: string;
  readonly onClear: () => void;
}

/**
 * The filters (`div.sv-ptools`): Status and Course selects in a search region (`sv-ptools-f`), then
 * the count, the applied-filter chips and "Clear filters" (`sv-ptools-s`). When a chip's remove
 * button or "Clear filters" goes with the focus on it, focus moves to the next chip, else the
 * previous one, else the first select.
 */
export function StProgressTools({
  label,
  filters,
  count,
  chips,
  clearLabel,
  onClear,
}: StProgressToolsProps) {
  const tools = useRef<HTMLDivElement>(null);
  const pending = useRef<{ readonly control: HTMLElement; readonly index: number } | null>(null);

  useLayoutEffect(() => {
    const pressed = pending.current;
    if (pressed === null || pressed.control.isConnected) return;
    pending.current = null;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    const remaining = [
      ...(tools.current?.querySelectorAll<HTMLButtonElement>('.rk-chip button') ?? []),
    ];
    const target =
      remaining[pressed.index] ??
      remaining[pressed.index - 1] ??
      tools.current?.querySelector<HTMLElement>('select');
    target?.focus();
  });

  return (
    <div ref={tools} className="sv-ptools">
      <div className="sv-ptools-f" role="search" aria-label={label}>
        {filters.map((filter) => (
          <div key={filter.id} className="sv-pfield">
            <label className="rk-label" htmlFor={filter.id}>
              {filter.label}
            </label>
            <div className="rk-selwrap">
              <select
                id={filter.id}
                className="rk-select"
                value={filter.value}
                onChange={(event) => filter.onChange(event.target.value)}
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Glyph name="chevronDown" />
            </div>
          </div>
        ))}
      </div>
      <div className="sv-ptools-s">
        <p className="rk-count" role="status">
          {count}
        </p>
        {chips.map((chip, index) => (
          <span key={chip.key} className="rk-chip">
            {chip.label}
            <button
              type="button"
              aria-label={chip.removeLabel}
              onClick={(event) => {
                pending.current = { control: event.currentTarget, index };
                chip.onRemove();
              }}
            >
              <Glyph name="close" />
            </button>
          </span>
        ))}
        {chips.length > 0 ? (
          <button
            type="button"
            className="rk-clear"
            onClick={(event) => {
              pending.current = { control: event.currentTarget, index: 0 };
              onClear();
            }}
          >
            {clearLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export interface StProgressGroupProps {
  /** The course code shown (`span.rk-owncode`), when the course has one. */
  readonly code: string | null;
  /** The course's name (`h3.sv-pgroup-t`). */
  readonly title: ReactNode;
  readonly titleId: string;
  /** "1 experiment" (`span.sv-pgroup-d`). */
  readonly count: ReactNode;
  /** A line under the head (`p.sv-pgroup-note`). */
  readonly note?: ReactNode;
  /** The experiments (`StProgressBlock`s). */
  readonly children: ReactNode;
}

/** One course's group inside the progress surface (`div.sv-pgroup[role=group]`). */
export function StProgressGroup({
  code,
  title,
  titleId,
  count,
  note,
  children,
}: StProgressGroupProps) {
  return (
    <div className="sv-pgroup" role="group" aria-labelledby={titleId}>
      <div className="sv-pgroup-h">
        {code === null ? null : <span className="rk-owncode">{code}</span>}
        <h3 className="sv-pgroup-t" id={titleId}>
          {title}
        </h3>
        <span className="sv-pgroup-d">{count}</span>
      </div>
      {note === undefined || note === null ? null : <p className="sv-pgroup-note">{note}</p>}
      {children}
    </div>
  );
}

export interface StProgressHeadProps {
  /** The experiment's name (`h4.sv-pexp-t`; it names the block). */
  readonly title: ReactNode;
  readonly titleId: string;
  /** "Given by your institution" (`p.sv-pexp-g`). */
  readonly given: ReactNode;
  /** "Open experiment ›" to its hub, when it opens now. */
  readonly open?: { readonly href: string; readonly label: ReactNode; readonly ariaLabel: string };
}

/** An experiment's tinted head band in its progress block (`div.sv-pexp-h`). */
export function StProgressHead({ title, titleId, given, open }: StProgressHeadProps) {
  const Link = useLinkComponent();
  return (
    <div className="sv-pexp-h">
      <div className="sv-pexp-ht">
        <h4 className="sv-pexp-t" id={titleId}>
          {title}
        </h4>
        <p className="sv-pexp-g">{given}</p>
      </div>
      {open ? (
        <Link className="sv-link" href={open.href} aria-label={open.ariaLabel}>
          {open.label}
          <Glyph name="chevronRight" />
        </Link>
      ) : null}
    </div>
  );
}

// ---- ST-16 Format feedback · ST-17 Feedback sent ----------------------------------------------------

/**
 * The rating sheet (`section.sv-card.sv-fb`, named "Feedback on WEB") holding the form: the error
 * summary or the failure notice, the scale's head, the five statements, the comments and the foot.
 */
export function StFeedbackSheet({
  label,
  onSubmit,
  children,
}: {
  readonly label: string;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly children: ReactNode;
}) {
  return (
    <section className="sv-card sv-fb" aria-label={label}>
      <form noValidate onSubmit={onSubmit}>
        {children}
      </form>
    </section>
  );
}

export interface StFeedbackErrorItem {
  /** The statement's fieldset id (the link's address). */
  readonly fieldId: string;
  /** The control that takes focus: the statement's first radio, or its chosen one. */
  readonly focusId: string;
  /** "Choose a rating for statement 2". */
  readonly text: string;
}

/**
 * The error summary over the sheet (`div.rk-errsum.sv-fb-msg[role=alert][tabindex=-1]`): its title
 * and one link per missing rating, each moving focus to its statement's radio without navigating. It
 * takes focus when it appears (remount it with a `key` to focus it again on a later submit). Each
 * link is a 24 px target (`rk-x-errsum-target`, V3P-18: the export's `.st-root .rk-errsum li a`
 * rule, confined to the Student's summaries). Not the kit `ErrorSummary`: a link focuses its
 * statement's radio (`focusId`), not the statement's focusable fieldset.
 */
export function StFeedbackErrors({
  id,
  title,
  items,
}: {
  readonly id: string;
  readonly title: ReactNode;
  readonly items: readonly StFeedbackErrorItem[];
}) {
  const Link = useLinkComponent();
  const node = useRef<HTMLDivElement>(null);
  useEffect(() => {
    node.current?.focus();
  }, []);
  const follow = (event: MouseEvent<HTMLAnchorElement>, item: StFeedbackErrorItem) => {
    event.preventDefault();
    const control = document.getElementById(item.focusId);
    if (control) control.focus();
    else focusField(item.fieldId);
  };
  return (
    <div
      ref={node}
      className="rk-errsum sv-fb-msg rk-x-errsum-target"
      id={id}
      tabIndex={-1}
      role="alert"
    >
      <p className="rk-errsum-t">{title}</p>
      <ul>
        {items.map((item) => (
          <li key={item.fieldId}>
            <Link href={`#${item.fieldId}`} onClick={(event) => follow(event, item)}>
              {item.text}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface StFeedbackPoint {
  /** 1 … 5. */
  readonly value: number;
  /** "Strongly disagree" … "Strongly agree". */
  readonly label: string;
}

/**
 * The scale named once above the statements (`div.sv-lk-head`, hidden from screen readers: each
 * radio carries its own words). Hidden on a narrow sheet, where each statement shows its ends.
 */
export function StFeedbackScale({
  title,
  points,
}: {
  /** "Rate each statement". */
  readonly title: ReactNode;
  readonly points: readonly StFeedbackPoint[];
}) {
  return (
    <div className="sv-lk-head" aria-hidden="true">
      <p className="sv-lk-head-t">{title}</p>
      <ol className="sv-lk-scale">
        {points.map((point) => (
          <li key={point.value}>
            <b>{point.value}</b>
            <span>{point.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export interface StFeedbackStatementProps {
  /** The fieldset's id (the error summary's target); each radio is `<id>-<value>`. */
  readonly id: string;
  /** "1. This experience helped me understand the concept." */
  readonly legend: ReactNode;
  readonly points: readonly StFeedbackPoint[];
  readonly value: number | null;
  readonly onChange: (value: number) => void;
  /** The scale's two ends, shown on a narrow sheet: ["Strongly disagree", "Strongly agree"]. */
  readonly ends: readonly [string, string];
  /** The choice in words on a narrow sheet: "4 — Agree", or "Not rated yet". */
  readonly chosen: ReactNode;
  /** "Choose a rating for statement 2", under the row (`p.rk-ferr`, the fieldset's description). */
  readonly error?: ReactNode;
}

/**
 * One statement on the sheet (`fieldset.st-fbq.sv-lk-q[tabindex=-1]`, `is-invalid` with its
 * error): its legend and five radio cells (`label.sv-lk-o` > radio + number + its words for screen
 * readers). The radios share one name, so the arrow keys move the choice.
 */
export function StFeedbackStatement({
  id,
  legend,
  points,
  value,
  onChange,
  ends,
  chosen,
  error,
}: StFeedbackStatementProps) {
  const errorId = `${id}-e`;
  const hasError = error !== undefined && error !== null;
  return (
    <fieldset
      className={joinClasses('st-fbq', 'sv-lk-q', hasError && 'is-invalid')}
      id={id}
      tabIndex={-1}
      aria-describedby={hasError ? errorId : undefined}
    >
      <legend>{legend}</legend>
      <div className="sv-lk-opts">
        {points.map((point) => {
          const optionId = `${id}-${point.value}`;
          return (
            <label key={point.value} className="sv-lk-o" htmlFor={optionId}>
              <input
                type="radio"
                name={id}
                id={optionId}
                value={point.value}
                checked={value === point.value}
                onChange={() => onChange(point.value)}
              />
              <span className="sv-lk-n" aria-hidden="true">
                {point.value}
              </span>
              <span className="xr-sr">{point.label}</span>
            </label>
          );
        })}
      </div>
      <p className="sv-lk-ends" aria-hidden="true">
        <span>{ends[0]}</span>
        <span>{ends[1]}</span>
      </p>
      <p className={joinClasses('sv-lk-sel', value !== null && 'is-set')} aria-hidden="true">
        {chosen}
      </p>
      {hasError ? (
        <p className="rk-ferr" id={errorId}>
          <Glyph name="alertCircle" />
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/** "Additional comments (optional)" under the statements (`div.rk-field.sv-fb-c` > textarea). */
export function StFeedbackComments({
  id,
  label,
  value,
  onChange,
}: {
  readonly id: string;
  readonly label: ReactNode;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <Field id={id} label={label} className="sv-fb-c">
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

/** The sheet's foot (`div.sv-fb-foot`): Cancel, then the one primary action. */
export function StFeedbackFoot({ children }: { readonly children: ReactNode }) {
  return <div className="sv-fb-foot">{children}</div>;
}

export interface StFeedbackAnswer {
  readonly key: string;
  /** "1. This experience helped me understand the concept." */
  readonly statement: ReactNode;
  /** The chosen point (1 … 5), drawn on the same scale; `null`: none. */
  readonly value: number | null;
  /** "4 — Agree". */
  readonly words: ReactNode;
}

export interface StFeedbackSentProps {
  /** "Thank you". */
  readonly thanks: ReactNode;
  /** "Sent 14 Oct 2026, 15:42. Feedback can’t be changed after it’s sent." */
  readonly line: ReactNode;
  /** "Back to experiment" (primary), "See your progress" — kit `ButtonLink`s. */
  readonly actions: ReactNode;
  /** "Your answers · WEB" (`h2.sv-sec-t`; it names the card). */
  readonly answersTitle: ReactNode;
  readonly answersTitleId: string;
  /** "Read-only". */
  readonly note: ReactNode;
  /** The scale's points, in order (the dots of each answer). */
  readonly points: readonly number[];
  readonly answers: readonly StFeedbackAnswer[];
  /** "Additional comments" and the comment ("—" when none). */
  readonly comments: { readonly label: ReactNode; readonly text: ReactNode };
}

/**
 * ST-17: the sent feedback (`section.sv-card.sv-fbsent`): the thank-you band (a status) with the
 * sent time, the rule and the two ways on; then the answers read-only on the same five-point
 * scale (`dl.sv-fbsent-dl`: each statement, its dots and its words) and the comment.
 */
export function StFeedbackSent({
  thanks,
  line,
  actions,
  answersTitle,
  answersTitleId,
  note,
  points,
  answers,
  comments,
}: StFeedbackSentProps) {
  return (
    <section className="sv-card sv-fbsent" aria-labelledby={answersTitleId}>
      <div className="sv-fbsent-top" role="status">
        <span className="sv-fbsent-ico" aria-hidden="true">
          <Glyph name="check" />
        </span>
        <div>
          <p className="sv-fbsent-t">{thanks}</p>
          <p className="sv-fbsent-d">{line}</p>
        </div>
        <div className="sv-fbsent-act">{actions}</div>
      </div>
      <div className="sv-fbsent-ans">
        <div className="sv-fbsent-h">
          <h2 className="sv-sec-t" id={answersTitleId}>
            {answersTitle}
          </h2>
          <p className="sv-sh-note">{note}</p>
        </div>
        <dl className="sv-fbsent-dl">
          {answers.map((answer) => (
            <div key={answer.key}>
              <dt>{answer.statement}</dt>
              <dd>
                <span className="sv-lk-dots" aria-hidden="true">
                  {points.map((point) => (
                    <span
                      key={point}
                      className={joinClasses('sv-lk-dot', point === answer.value && 'is-on')}
                    >
                      {point}
                    </span>
                  ))}
                </span>
                <span className="sv-lk-v">{answer.words}</span>
              </dd>
            </div>
          ))}
          <div className="sv-fbsent-c">
            <dt>{comments.label}</dt>
            <dd>{comments.text}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

// ---- ST-18 My device ----------------------------------------------------------------------------

/** The device page's one main surface (`div.sv-card.sv-devmain`), its sections split by hairlines. */
export function StDeviceCard({ children }: { readonly children: ReactNode }) {
  return <div className="sv-card sv-devmain">{children}</div>;
}

export interface StDeviceShown {
  /** "Authorised device" (`p.sv-eyebrow`). */
  readonly eyebrow: ReactNode;
  /** The device as the institution describes it, asset tag included (`h2.sv-devname`). */
  readonly name: ReactNode;
  /** The format chip of what it is used for. */
  readonly chip: StFormatChipProps;
  /** "Used for VR: " (read by screen readers only). */
  readonly usedForLabel: string;
  /** The experiments it is used for. */
  readonly usedFor: ReactNode;
}

export interface StDeviceNowProps {
  readonly titleId: string;
  /** The authorised device; without it, `none` says so (the greyed icon). */
  readonly device?: StDeviceShown;
  readonly none?: { readonly title: ReactNode; readonly text: ReactNode };
  /** "Request a device transfer" (`div.sv-devnow-act`): a kit `Button`. */
  readonly action?: ReactNode;
  /** Why no transfer can be requested now (`p.sv-devlock`, the lock): a pause. */
  readonly lock?: ReactNode;
}

/**
 * The authorised headset (`section.sv-devsec.sv-devnow`, named by the device): its icon, kicker,
 * name, the chip and experiment it is used for, and the one action — or "No authorised device is
 * recorded for you" with the greyed icon.
 */
export function StDeviceNow({ titleId, device, none, action, lock }: StDeviceNowProps) {
  return (
    <section className="sv-devsec sv-devnow" aria-labelledby={titleId}>
      {device ? (
        <>
          <span className="sv-devico" aria-hidden="true">
            <Glyph name="headset" />
          </span>
          <div className="sv-devnow-main">
            <p className="sv-eyebrow">{device.eyebrow}</p>
            <h2 className="sv-devname" id={titleId}>
              {device.name}
            </h2>
            <p className="sv-devuse">
              <StFormatChip {...device.chip} />
              <span>
                <span className="xr-sr">{device.usedForLabel}</span>
                {device.usedFor}
              </span>
            </p>
          </div>
          {action === undefined || action === null ? null : (
            <div className="sv-devnow-act">{action}</div>
          )}
        </>
      ) : none ? (
        <>
          <span className="sv-devico sv-devico--off" aria-hidden="true">
            <Glyph name="headset" />
          </span>
          <div className="sv-devnow-main">
            <h2 className="sv-devname" id={titleId}>
              {none.title}
            </h2>
            <p className="sv-devuse">{none.text}</p>
          </div>
        </>
      ) : null}
      {lock === undefined || lock === null ? null : (
        <p className="sv-devlock">
          <Glyph name="lock" />
          <span>{lock}</span>
        </p>
      )}
    </section>
  );
}

export interface StDeviceFormProps {
  readonly titleId: string;
  /** "Request a device transfer" (`h2.sv-sec-t`; it names the form). */
  readonly title: ReactNode;
  /** "Moving from" and the device now authorised (`dl.sv-dl.sv-dl--rows.sv-devfrom`). */
  readonly from: { readonly label: ReactNode; readonly device: ReactNode };
  /** The kit `Field`s: "New device" (hint, error), the optional note. */
  readonly children: ReactNode;
  /** "Your Institute Admin forwards the request to BITS, and BITS decides." (`p.rk-hint`). */
  readonly rule: ReactNode;
  /** Cancel, then "Send request" (`div.sv-devform-act`): kit `Button`s. */
  readonly actions: ReactNode;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

/**
 * The request form in place (`form.sv-devsec.sv-devform`, named by its heading): moving from, the
 * fields, the rule and the actions. A form, so Enter in "New device" sends it.
 */
export function StDeviceForm({
  titleId,
  title,
  from,
  children,
  rule,
  actions,
  onSubmit,
}: StDeviceFormProps) {
  return (
    <form className="sv-devsec sv-devform" aria-labelledby={titleId} noValidate onSubmit={onSubmit}>
      <h2 className="sv-sec-t" id={titleId}>
        {title}
      </h2>
      <dl className="sv-dl sv-dl--rows sv-devfrom">
        <div>
          <dt>{from.label}</dt>
          <dd>{from.device}</dd>
        </div>
      </dl>
      {children}
      <p className="rk-hint">{rule}</p>
      <div className="sv-devform-act">{actions}</div>
    </form>
  );
}

export interface StDeviceRequestProps {
  readonly titleId: string;
  /** "Your transfer request", or "Transfer requests" while there is none. */
  readonly title: ReactNode;
  /** The request's state in its large pill. */
  readonly status?: { readonly tone: StatusTone; readonly words: ReactNode };
  /** "No transfer requests yet." (`p.sv-devnone`) in place of the request. */
  readonly none?: ReactNode;
  /** The steps, the notice, the facts and the earlier request. */
  readonly children?: ReactNode;
}

/** The request's section (`section.sv-devsec`): its head with the state pill, then the request. */
export function StDeviceRequest({ titleId, title, status, none, children }: StDeviceRequestProps) {
  return (
    <section className="sv-devsec" aria-labelledby={titleId}>
      <div className="sv-devreq-h">
        <h2 className="sv-sec-t" id={titleId}>
          {title}
        </h2>
        {status ? (
          <StatusPill tone={status.tone} size="lg">
            {status.words}
          </StatusPill>
        ) : null}
      </div>
      {none === undefined || none === null ? null : <p className="sv-devnone">{none}</p>}
      {children}
    </section>
  );
}

export interface StDeviceStep {
  readonly key: string;
  /** "Requested", "Forwarded to BITS", "BITS decides" / "Approved by BITS". */
  readonly title: ReactNode;
  /** Its date, who and when, or where it stands ("With BITS now", "Not yet"). */
  readonly detail: ReactNode;
  readonly state: 'done' | 'now' | 'next';
  /** The step in words for screen readers: "Forwarded to BITS, done, Meera Iyer · 23 Oct …". */
  readonly ariaLabel: string;
}

/**
 * The request as three dated steps (`div.sv-devst`, a focus target after sending: what happens
 * next, then `ol.sv-steps.sv-devsteps` — done steps navy with a tick, the current one half
 * indigo; vertical on phones). Each step is read from its own words; the drawn ones are hidden.
 */
export function StDeviceSteps({
  id,
  explain,
  label,
  steps,
}: {
  readonly id: string;
  /** "BITS decides. Nothing changes on your device yet." (`p.sv-devexp`). */
  readonly explain: ReactNode;
  /** "Steps of your transfer request". */
  readonly label: string;
  readonly steps: readonly StDeviceStep[];
}) {
  return (
    <div className="sv-devst" id={id} tabIndex={-1}>
      <p className="sv-devexp">{explain}</p>
      <ol className="sv-steps sv-devsteps" aria-label={label}>
        {steps.map((step) => (
          <li
            key={step.key}
            className={
              step.state === 'done' ? 'is-done' : step.state === 'now' ? 'is-now' : undefined
            }
            aria-label={step.ariaLabel}
          >
            <p className="sv-steps-k" aria-hidden="true">
              {step.title}
              {step.state === 'done' ? <Glyph name="check" /> : null}
            </p>
            <p className="sv-steps-s" aria-hidden="true">
              {step.detail}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export interface StDeviceFact {
  readonly key: string;
  /** "From", "To", "Your note". */
  readonly term: ReactNode;
  readonly detail: ReactNode;
}

/** The request's facts (`dl.sv-dl.sv-dl--rows.sv-devdl`): From, To, your note. */
export function StDeviceFacts({ facts }: { readonly facts: readonly StDeviceFact[] }) {
  return (
    <dl className="sv-dl sv-dl--rows sv-devdl">
      {facts.map((fact) => (
        <div key={fact.key}>
          <dt>{fact.term}</dt>
          <dd>{fact.detail}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The earlier request in one line (`p.sv-devprev`): "Earlier request · approved 24 Oct 2026". */
export function StDevicePrevious({ children }: { readonly children: ReactNode }) {
  return <p className="sv-devprev">{children}</p>;
}
