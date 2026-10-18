import { Fragment, type ReactNode, type Ref } from 'react';

export interface DetailLayoutProps {
  /** The record's sheet (`div.rk-surface.rk-mainsheet`): facts and sections. */
  readonly main: ReactNode;
  /** The decision column (`aside.rk-aside`): sticky and bounded on wide screens. */
  readonly aside: ReactNode;
  /** The aside's id — the target of "Go to decision" under 860 px. */
  readonly asideId: string;
  /** The aside's name: the decision panel's heading id. */
  readonly asideLabelledBy: string;
}

/**
 * The detail page (`div.rk-detailwrap` > `div.rk-detail`; rb-kit.css DetailLayout): the record on
 * the left, the decision panel on the right, sticky and bounded to the viewport on wide screens;
 * one column under 860 px of page width, the panel after the details.
 */
export function DetailLayout({ main, aside, asideId, asideLabelledBy }: DetailLayoutProps) {
  return (
    <div className="rk-detailwrap">
      <div className="rk-detail">
        <div className="rk-surface rk-mainsheet">{main}</div>
        <aside className="rk-aside" id={asideId} aria-labelledby={asideLabelledBy}>
          {aside}
        </aside>
      </div>
    </div>
  );
}

export interface Fact {
  readonly term: ReactNode;
  readonly value: ReactNode;
  /** A value that says it is not known or not set yet (`dd.is-quiet`). */
  readonly quiet?: boolean;
}

/**
 * The fact strip at the top of a record (`dl.rk-factstrip`): only known values — nothing is
 * padded with placeholders (rb-kit.css FactStrip).
 */
export function FactStrip({ facts }: { readonly facts: readonly Fact[] }) {
  return (
    <dl className="rk-factstrip">
      {facts.map((fact, index) => (
        <div key={index} className="rk-fact">
          <dt>{fact.term}</dt>
          <dd className={fact.quiet ? 'is-quiet' : undefined}>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Label and value pairs (`dl.rk-dl`): "Institution", "Contact person", "E-mail". */
export function DefinitionList({
  items,
}: {
  readonly items: readonly { readonly term: ReactNode; readonly value: ReactNode }[];
}) {
  return (
    <dl className="rk-dl">
      {items.map((item, index) => (
        <Fragment key={index}>
          <dt>{item.term}</dt>
          <dd>{item.value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

export interface AskRowProps {
  /** The experiment asked for. */
  readonly title: ReactNode;
  /** The course line (`p.rk-askrow-c`): a CourseCode and the course's name. */
  readonly course?: ReactNode;
  /** The formats: FormatCells (`strip`) or FormatBadges. */
  readonly formats: ReactNode;
}

/** One experiment of a request (`div.rk-askrow`; SA-03 "What they're asking for"). */
export function AskRow({ title, course, formats }: AskRowProps) {
  return (
    <div className="rk-askrow">
      <div>
        <p className="rk-askrow-t">{title}</p>
        {course ? <p className="rk-askrow-c">{course}</p> : null}
      </div>
      {formats}
    </div>
  );
}

/** The experiments of a request (`div.rk-ask`). */
export function AskList({ children }: { readonly children: ReactNode }) {
  return <div className="rk-ask">{children}</div>;
}

/** A message in someone's words (`blockquote.rk-quote` + `p.rk-quote-by`). */
export function Quote({ children, by }: { readonly children: ReactNode; readonly by: ReactNode }) {
  return (
    <blockquote className="rk-quote">
      <p>{children}</p>
      <p className="rk-quote-by">{by}</p>
    </blockquote>
  );
}

export interface TimelineEvent {
  /** What happened ("Request submitted"). */
  readonly what: ReactNode;
  /** When and by whom ("2 Oct 2026, 10:14 by Meera Iyer, contact person"). */
  readonly when: ReactNode;
  readonly note?: ReactNode;
}

/** The history of a record, latest first (`ol.rk-tl`; the first entry is `is-latest`). */
export function Timeline({ events }: { readonly events: readonly TimelineEvent[] }) {
  return (
    <ol className="rk-tl">
      {events.map((event, index) => (
        <li key={index} className={index === 0 ? 'is-latest' : undefined}>
          <p className="rk-tl-w">{event.what}</p>
          <p className="rk-tl-t">{event.when}</p>
          {event.note ? <p className="rk-tl-n">{event.note}</p> : null}
        </li>
      ))}
    </ol>
  );
}

export interface EventStep {
  readonly title: ReactNode;
  readonly description: ReactNode;
}

/**
 * Separate events in order (`ol.rk-events` > `li.rk-event`; SA-03 "What happens after you decide":
 * institution record, request approval, payment confirmation, institutional access activation).
 */
export function EventSteps({
  steps,
  note,
}: {
  readonly steps: readonly EventStep[];
  /** The line under the steps (`p.rk-event-note`). */
  readonly note?: ReactNode;
}) {
  return (
    <>
      <ol className="rk-events">
        {steps.map((step, index) => (
          <li key={index} className="rk-event">
            <span className="rk-event-n" aria-hidden="true">
              {index + 1}
            </span>
            <p className="rk-event-t">{step.title}</p>
            <p className="rk-event-d">{step.description}</p>
          </li>
        ))}
      </ol>
      {note ? <p className="rk-event-note">{note}</p> : null}
    </>
  );
}

export interface DecisionPanelProps {
  /** "Your decision". */
  readonly title: ReactNode;
  readonly titleId: string;
  /** The heading takes focus after a refused or moved-on decision (`tabIndex={-1}`). */
  readonly titleRef?: Ref<HTMLHeadingElement>;
  readonly children: ReactNode;
}

/** The decision panel (`div.rk-panel` > navy `div.rk-panel-head` + `div.rk-panel-body`). */
export function DecisionPanel({ title, titleId, titleRef, children }: DecisionPanelProps) {
  return (
    <div className="rk-panel">
      <div className="rk-panel-head">
        <h2 id={titleId} ref={titleRef} tabIndex={titleRef ? -1 : undefined}>
          {title}
        </h2>
      </div>
      <div className="rk-panel-body">{children}</div>
    </div>
  );
}

export interface DecisionOutcomeProps {
  /** The record's status after the decision: a large StatusPill. */
  readonly status: ReactNode;
  /** Who decided, when and how ("Decided by you on 8 Oct 2026, 11:20, external"). */
  readonly meta?: ReactNode;
  /** Where each of the separate records stands now (`dl.rk-stand`). */
  readonly stand: readonly { readonly term: ReactNode; readonly value: ReactNode }[];
  /** What happens next (`p.rk-next`). */
  readonly next?: ReactNode;
  /** "Back to requests". */
  readonly action?: ReactNode;
  /** The outcome takes focus after the decision is recorded (`tabIndex={-1}`). */
  readonly outcomeRef?: Ref<HTMLDivElement>;
  readonly id?: string;
}

/** The decided panel (`div.rk-done`): the status, where it stands and what happens next. */
export function DecisionOutcome({
  status,
  meta,
  stand,
  next,
  action,
  outcomeRef,
  id,
}: DecisionOutcomeProps) {
  return (
    <div className="rk-done" ref={outcomeRef} id={id} tabIndex={-1}>
      <p>{status}</p>
      {meta ? <p className="rk-done-meta">{meta}</p> : null}
      <dl className="rk-stand">
        {stand.map((row, index) => (
          <div key={index}>
            <dt>{row.term}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      {next ? <p className="rk-next">{next}</p> : null}
      {action}
    </div>
  );
}

/** A plain line of record prose (`p.rk-next`), e.g. "3 experiments are listed on the request." */
export function RecordLine({ children }: { readonly children: ReactNode }) {
  return <p className="rk-next">{children}</p>;
}
