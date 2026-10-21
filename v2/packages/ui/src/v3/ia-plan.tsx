'use client';

import type { ReactNode, Ref } from 'react';

import { joinClasses } from '../internal/classes.js';
import { useLinkComponent } from '../link.js';
import { ButtonLink } from './actions.js';
import { Glyph, type V3IconName } from './icons.js';

/*
 * What only the Institute Admin's plan screens draw — IA-01 Overview, IA-02 Content access ›
 * Experiments, IA-16 Course codes, IA-03 Access plan and IA-20 Usage (`ia-` classes; the
 * owner-approved Institute Admin export, design/v3-refined-b/roles/IA-v1, `project/ia-role.css` and
 * its COMPONENT-EXTENSIONS.md "Overview", "Content access plan strip", "Experiments table" and
 * "Course codes editor"): the compact identity head, "Needs your attention" with its lead band,
 * the access-plan card and strip on the plan tint, the yearly term bar, the format key, the
 * experiments table grouped by course, the course-code editor and a usage row's format (the usage
 * view switch is `ia.tsx`'s `IaViewSwitch`, which IA-05 draws too). Markup as the export's `Main.dc.html` draws them. What more than one Institute Admin
 * screen group draws (the list table, the surface sections, the record grid, the grouped table,
 * the format badges, …) is in `ia.tsx`. Every word, figure, date and destination comes from the
 * caller; no piece prints a record's internal reference.
 */

/** A destination with its words and, where the words alone are not unique, its accessible name. */
export interface IaLink {
  readonly label: ReactNode;
  readonly href: string;
  readonly accessibleName?: string;
}

// ---- the yearly term bar ---------------------------------------------------------------------

/** How the term stands: live (today marked), ending soon (the gold remainder), paused, ended. */
export type IaTermState = 'live' | 'ending' | 'paused' | 'ended';

export interface IaTermBarProps {
  /** "Yearly term" (`span.ia-plan-lab`). */
  readonly label: ReactNode;
  /** "350 days left", "Paused by BITS on 2 Mar 2027", "Ended on 7 Oct 2027" (`span.ia-plan-left`). */
  readonly left: ReactNode;
  /** The term's first and last day ("8 Oct 2026", "7 Oct 2027"). */
  readonly start: ReactNode;
  readonly end: ReactNode;
  /**
   * The share of the term that has passed, 0 to 1 — computed by the caller from the plan's dates
   * and the days the service says are left, never a constant.
   */
  readonly elapsed: number;
  readonly state: IaTermState;
  /** The term in words, the bar's accessible name ("Access term from 8 October 2026 to …"). */
  readonly description: string;
  /** In the Overview's plan card (`ia-plan-term`) or a plan strip (`ia-cp-term`). */
  readonly place: 'card' | 'strip';
}

/** "3.85%": the export's own rounding (two decimals, no trailing zeros). */
function percent(share: number): string {
  return `${Math.round(Math.min(1, Math.max(0, share)) * 10000) / 100}%`;
}

/**
 * The yearly term bar (`div.ia-plan-term[role=img]` / `div.ia-cp-term[role=img]` > `div.ia-tt`):
 * the elapsed fill, the gold remainder while the plan ends soon, today's marker while the term is
 * live, striped while paused, full once ended.
 *
 * The fill, the remainder and the marker are positioned by the share of the term that has passed,
 * which only the plan's dates decide: the export draws them as `style="width: 3.85%"` and
 * `style="left: 3.85%"` (`Main.dc.html` IA-01 line 256, IA-02 312, IA-03 527). This component is
 * the one place in the Institute Admin's V3 layer that sets such a data-driven inline style — as
 * the kit's `TermTrack` does for `rb-term-*` (the recorded `inline-style` scan exception); every
 * other part of the bar stays in the frozen stylesheet.
 */
export function IaTermBar({
  label,
  left,
  start,
  end,
  elapsed,
  state,
  description,
  place,
}: IaTermBarProps) {
  const fill = state === 'paused' ? '0%' : state === 'ended' ? '100%' : percent(elapsed);
  const rest = percent(1 - elapsed);
  return (
    <div
      className={place === 'card' ? 'ia-plan-term' : 'ia-cp-term'}
      role="img"
      aria-label={description}
    >
      <div className={place === 'card' ? 'ia-plan-term-top' : 'ia-cp-term-top'}>
        <span className="ia-plan-lab">{label}</span>
        <span className={joinClasses('ia-plan-left', state === 'ending' && 'is-warn')}>{left}</span>
      </div>
      <div
        className={joinClasses(
          'ia-tt',
          state === 'paused' && 'is-paused',
          state === 'ended' && 'is-full',
        )}
      >
        <span className="ia-tt-fill" style={{ width: fill }} />
        {state === 'ending' ? <span className="ia-tt-rest" style={{ width: rest }} /> : null}
        {state === 'live' || state === 'ending' ? (
          <span className="ia-tt-today" style={{ left: fill }} />
        ) : null}
      </div>
      <div className="ia-plan-term-ends">
        <span>{start}</span>
        <span>{end}</span>
      </div>
    </div>
  );
}

// ---- IA-01 the compact identity head ---------------------------------------------------------

export interface IaOverviewHeadProps {
  /** The institution's name, the page's H1 (`h1.rb-h1`, `tabindex=-1`). */
  readonly title: ReactNode;
  /**
   * Read before the name by screen readers only ("Overview,"); the space after it stays outside
   * the hidden words so that every accessibility engine reads the two apart.
   */
  readonly titlePrefix: string;
  readonly titleId: string;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** Today in words (`p.rb-eyebrow-date`), from the application's clock. */
  readonly date?: ReactNode;
  /** The institution's access status (`StatusPill`). */
  readonly status: ReactNode;
  /** The plan line beside it: "Your access plan ends on 7 October 2027." */
  readonly statusLine: ReactNode;
  /** `div.rk-head-act`: "Add students", then the one primary "Give students access". */
  readonly actions?: ReactNode;
}

/** The Overview's compact head (`div.ia-ov-head`): date, name, access status, actions. */
export function IaOverviewHead({
  title,
  titlePrefix,
  titleId,
  titleRef,
  date,
  status,
  statusLine,
  actions,
}: IaOverviewHeadProps) {
  return (
    <div className="ia-ov-head">
      <div className="ia-ov-id">
        {date ? <p className="rb-eyebrow-date">{date}</p> : null}
        <h1 ref={titleRef} className="rb-h1" id={titleId} tabIndex={-1}>
          <span className="xr-sr">{titlePrefix}</span> {title}
        </h1>
        <p className="ia-ov-status">
          {status}
          <span>{statusLine}</span>
        </p>
      </div>
      {actions ? <div className="rk-head-act">{actions}</div> : null}
    </div>
  );
}

/** The Overview's two columns (`div.ia-ov-grid`): attention, then the plan card. */
export function IaOverviewGrid({ children }: { readonly children: ReactNode }) {
  return <div className="ia-ov-grid">{children}</div>;
}

// ---- IA-01 Needs your attention --------------------------------------------------------------

export interface IaAttentionProps {
  /** "Needs your attention" (`h2.rb-h2`). */
  readonly title: ReactNode;
  readonly titleId: string;
  /** "3 items" (`p.rb-note`); none in the calm state. */
  readonly note?: ReactNode;
  /** The calm state, the lead band and the items, in that order. */
  readonly children: ReactNode;
}

/** The attention panel (`section.rb-panel.ia-att`), named by its heading. */
export function IaAttention({ title, titleId, note, children }: IaAttentionProps) {
  return (
    <section className="rb-panel ia-att" aria-labelledby={titleId}>
      <div className="ia-att-head">
        <h2 className="rb-h2" id={titleId}>
          {title}
        </h2>
        {note ? <p className="rb-note">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** Nothing needs attention (`div.rb-calm[role=status]`): the tick, the words and what comes next. */
export function IaAttentionCalm({
  title,
  children,
}: {
  readonly title: ReactNode;
  readonly children?: ReactNode;
}) {
  return (
    <div className="rb-calm" role="status">
      <span className="rb-calm-ico" aria-hidden="true">
        <Glyph name="check" />
      </span>
      <p className="rb-calm-t">{title}</p>
      {children ? <p className="rb-calm-d">{children}</p> : null}
    </div>
  );
}

/**
 * The lead band's tone: `due` the ivory urgency (ending soon), `paused` and `off` (ended) the
 * kit's paused and "off" tints — not urgency, same geometry (`ia-lead--paused`, `ia-lead--off`).
 */
export type IaLeadTone = 'due' | 'paused' | 'off';

const LEAD_ICON: Readonly<Record<IaLeadTone, V3IconName>> = {
  due: 'calendar',
  paused: 'pauseCircle',
  off: 'ended',
};

export interface IaAttentionLeadProps {
  readonly tone: IaLeadTone;
  /** "Request a renewal", "BITS has paused your institution’s access" (`p.rb-lead-t`). */
  readonly title: ReactNode;
  /** What it means (`p.rb-lead-d`). */
  readonly line: ReactNode;
  /** The one navy action ("Request renewal", "Help"). */
  readonly action?: IaLink;
}

/** The lead band above the items (`div.rb-lead`): the plan's term or the pause, with one action. */
export function IaAttentionLead({ tone, title, line, action }: IaAttentionLeadProps) {
  return (
    <div
      className={joinClasses(
        'rb-lead',
        tone === 'paused' && 'ia-lead--paused',
        tone === 'off' && 'ia-lead--off',
      )}
    >
      <span className="rb-lead-ico" aria-hidden="true">
        <Glyph name={LEAD_ICON[tone]} />
      </span>
      <p className="rb-lead-t">{title}</p>
      <p className="rb-lead-d">{line}</p>
      {action ? (
        <div className="rb-lead-act">
          <ButtonLink
            href={action.href}
            variant="navy"
            size="lg"
            aria-label={action.accessibleName}
          >
            {action.label}
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}

/** One counted item: the count, what it is, where it comes from and the one quiet action. */
export interface IaAttentionItem {
  readonly key: string;
  /** The count in the tile; also read before the words ("1 student is waiting …"). */
  readonly count: number;
  /** "student is waiting for a licence" (`p.ia-att-t`). */
  readonly title: ReactNode;
  /** "Shell-and-Tube Heat Exchanger" (`p.ia-att-d`). */
  readonly line: ReactNode;
  readonly action: IaLink;
}

/** The counted items (`ul.ia-att-list` > `li.ia-att-item`). */
export function IaAttentionList({ items }: { readonly items: readonly IaAttentionItem[] }) {
  const Link = useLinkComponent();
  return (
    <ul className="ia-att-list">
      {items.map((item) => (
        <li key={item.key} className="ia-att-item">
          <span className="ia-att-n" aria-hidden="true">
            {item.count}
          </span>
          <p className="ia-att-t">
            {/* The space stays outside the hidden count, so every engine reads "1 student …". */}
            <span className="xr-sr">{item.count}</span> {item.title}
          </p>
          <p className="ia-att-d">{item.line}</p>
          <Link
            className="ia-att-go"
            href={item.action.href}
            aria-label={item.action.accessibleName}
          >
            {item.action.label}
            <Glyph name="chevronRight" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ---- IA-01 the access-plan card --------------------------------------------------------------

/** One fact of a plan ("Licences" 120 "as approved by BITS"; "Term" Yearly). */
export interface IaPlanFact {
  readonly term: ReactNode;
  readonly value: ReactNode;
  /** The quiet line under the value ("as approved by BITS"). */
  readonly sub?: ReactNode;
}

export interface IaPlanCardProps {
  /** "Access plan" (`h2.rb-h2`). */
  readonly title: ReactNode;
  readonly titleId: string;
  /** The plan's status (`StatusPill`) beside the title (`span.ia-plan-id`). */
  readonly status: ReactNode;
  /** The term bar (`IaTermBar place="card"`); none for a plan without a term. */
  readonly term?: ReactNode;
  readonly facts: readonly IaPlanFact[];
  /** The plan's experiments (`IaPlanCardExperiment`). */
  readonly children?: ReactNode;
  /** "Students open only the experiments you give them …" (`p.ia-plan-note`). */
  readonly note: ReactNode;
  /** "View plan", "Open Content access" (`div.ia-plan-links`). */
  readonly links: readonly IaLink[];
}

/** The access-plan card on the plan tint (`section.ia-plan`). */
export function IaPlanCard({
  title,
  titleId,
  status,
  term,
  facts,
  children,
  note,
  links,
}: IaPlanCardProps) {
  const Link = useLinkComponent();
  return (
    <section className="ia-plan" aria-labelledby={titleId}>
      <div className="ia-plan-head">
        <h2 className="rb-h2" id={titleId}>
          {title}
        </h2>
        <span className="ia-plan-id">{status}</span>
      </div>
      {term}
      <IaPlanFacts facts={facts} place="card" />
      {children}
      <p className="ia-plan-note">{note}</p>
      <div className="ia-plan-links">
        {links.map((link) => (
          <Link
            key={link.href}
            className="rb-link"
            href={link.href}
            aria-label={link.accessibleName}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

export interface IaPlanCardExperimentProps {
  /** The experiment's name (`p.ia-plan-exp-t`). */
  readonly name: ReactNode;
  /** "ME ZG523 · Thermodynamics & Heat Transfer" (`p.ia-plan-exp-c`). */
  readonly course: ReactNode;
  /**
   * The institution's own course code: `{ label, code }` ("Your course code" MEC-523), or
   * `{ missing }` — the ivory tag "Your course code: not added".
   */
  readonly ownCode:
    { readonly label: ReactNode; readonly code: ReactNode } | { readonly missing: ReactNode };
  /** The plan's format badges (`ul.xr-fmts.ia-plan-fmts`, the shared IA badges). */
  readonly formats: ReactNode;
  /** The badges in words: "WEB and VR in your plan · AR published, not in your plan …". */
  readonly formatKey: ReactNode;
}

/** One experiment of the plan card (`div.ia-plan-exp`). */
export function IaPlanCardExperiment({
  name,
  course,
  ownCode,
  formats,
  formatKey,
}: IaPlanCardExperimentProps) {
  return (
    <div className="ia-plan-exp">
      <p className="ia-plan-exp-t">{name}</p>
      <p className="ia-plan-exp-c">{course}</p>
      <p className="ia-plan-code">
        {'missing' in ownCode ? (
          <span className="rk-tag-warn">
            <Glyph name="alertTriangle" />
            {ownCode.missing}
          </span>
        ) : (
          <>
            {ownCode.label} <span className="rb-code">{ownCode.code}</span>
          </>
        )}
      </p>
      {formats}
      <p className="ia-fmt-key">{formatKey}</p>
    </div>
  );
}

/** A plan's facts (`dl.ia-plan-facts` in the card, `dl.ia-cp-facts` in a strip). */
export function IaPlanFacts({
  facts,
  place,
}: {
  readonly facts: readonly IaPlanFact[];
  readonly place: 'card' | 'strip';
}) {
  return (
    <dl className={place === 'card' ? 'ia-plan-facts' : 'ia-cp-facts'}>
      {facts.map((fact, index) => (
        <div key={index}>
          <dt>{fact.term}</dt>
          <dd>
            {fact.value}
            {fact.sub ? (
              <span className={place === 'card' ? 'ia-plan-dd-sub' : 'ia-cp-sub'}>{fact.sub}</span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ---- IA-02 / IA-03 the plan strip ------------------------------------------------------------

export interface IaPlanStripProps {
  /** The heading that names the strip (its id: `aria-labelledby`). */
  readonly titleId: string;
  /**
   * IA-03 names the strip with a heading only screen readers read ("Licences and term",
   * `h2.xr-sr`); IA-02's heading is the strip's own "Access plan" (`IaPlanStripId`).
   */
  readonly hiddenTitle?: ReactNode;
  readonly children: ReactNode;
}

/** The plan strip on the plan tint (`section.ia-cp`): its row, footnote and notes. */
export function IaPlanStrip({ titleId, hiddenTitle, children }: IaPlanStripProps) {
  return (
    <section className="ia-cp" aria-labelledby={titleId}>
      {hiddenTitle ? (
        <h2 className="xr-sr" id={titleId}>
          {hiddenTitle}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

/**
 * The strip's row (`div.ia-cp-row`): IA-02 has the plan, licences, term and View plan; IA-03's plan
 * version (`ia-cp-row--plan`) the licences, term and where to ask BITS — or no ask (`is-noask`).
 */
export function IaPlanStripRow({
  variant = 'content',
  noAsk = false,
  children,
}: {
  readonly variant?: 'content' | 'plan';
  readonly noAsk?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <div
      className={joinClasses(
        'ia-cp-row',
        variant === 'plan' && 'ia-cp-row--plan',
        variant === 'plan' && noAsk && 'is-noask',
      )}
    >
      {children}
    </div>
  );
}

/**
 * The strip's plan (the export's `div.ia-cp-id`; `ia-cp-id` has no rule in `ia-role.css`, so it is
 * left out): "Access plan" (`h2.ia-cp-k`) and its status.
 */
export function IaPlanStripId({
  title,
  titleId,
  status,
}: {
  readonly title: ReactNode;
  readonly titleId: string;
  readonly status: ReactNode;
}) {
  return (
    <div>
      <h2 className="ia-cp-k" id={titleId}>
        {title}
      </h2>
      <p className="ia-cp-name">{status}</p>
    </div>
  );
}

/** "View plan" at the strip's end (`a.rb-link.ia-cp-view`), named by the plan's term. */
export function IaPlanStripView({ link }: { readonly link: IaLink }) {
  const Link = useLinkComponent();
  return (
    <Link className="rb-link ia-cp-view" href={link.href} aria-label={link.accessibleName}>
      {link.label}
    </Link>
  );
}

/** "Need more, or a renewal?" with "Ask BITS from Requests" (`p.ia-cp-ask`). */
export function IaPlanStripAsk({
  question,
  link,
}: {
  readonly question: ReactNode;
  readonly link: IaLink;
}) {
  const Link = useLinkComponent();
  return (
    <p className="ia-cp-ask">
      <span>{question}</span>
      <Link className="rb-link" href={link.href} aria-label={link.accessibleName}>
        {link.label}
      </Link>
    </p>
  );
}

/** The strip's footnote (`p.ia-cp-foot`). */
export function IaPlanStripFoot({ children }: { readonly children: ReactNode }) {
  return <p className="ia-cp-foot">{children}</p>;
}

/** A strip note's tone: ending soon (`warn`), ended (`off`), paused (`paused`). */
export type IaPlanNoteTone = 'warn' | 'off' | 'paused';

const PLAN_NOTE_ICON: Readonly<Record<IaPlanNoteTone, V3IconName>> = {
  warn: 'calendar',
  off: 'ended',
  paused: 'lock',
};

export interface IaPlanStripNoteProps {
  readonly tone: IaPlanNoteTone;
  /** The note's first words, in bold: "Ends on 7 Oct 2027." */
  readonly title: ReactNode;
  /** The rest of the sentence: "Renewal reminder due. Ask BITS for a renewal from Requests." */
  readonly line: ReactNode;
  /** One navy action ("Request renewal"). */
  readonly action?: IaLink;
}

/** A slim band inside the strip when the plan needs attention (`div.ia-cp-note`). */
export function IaPlanStripNote({ tone, title, line, action }: IaPlanStripNoteProps) {
  return (
    <div className={`ia-cp-note ia-cp-note--${tone}`}>
      <Glyph name={PLAN_NOTE_ICON[tone]} />
      <p>
        <b>{title}</b> {line}
      </p>
      {action ? (
        <ButtonLink href={action.href} variant="navy" aria-label={action.accessibleName}>
          {action.label}
        </ButtonLink>
      ) : null}
    </div>
  );
}

// ---- IA-02 / IA-03 the format key and the experiments table ----------------------------------

export interface IaFormatKeyProps {
  /** "Formats" (`span.ia-xs-key-k`, read through the list's name). */
  readonly label: ReactNode;
  /** "Format key" (the list's accessible name). */
  readonly listLabel: string;
  /** "In your plan", "Published, not in your plan", "Not published". */
  readonly inPlan: ReactNode;
  readonly published: ReactNode;
  readonly notPublished: ReactNode;
}

/** The one-line format key (`div.ia-xs-key`): the three swatches in words. */
export function IaFormatKey({
  label,
  listLabel,
  inPlan,
  published,
  notPublished,
}: IaFormatKeyProps) {
  return (
    <div className="ia-xs-key">
      <span className="ia-xs-key-k" aria-hidden="true">
        {label}
      </span>
      <ul aria-label={listLabel}>
        <li>
          <span className="rk-swatch rk-swatch--on" aria-hidden="true">
            <Glyph name="check" />
          </span>
          {inPlan}
        </li>
        <li>
          <span className="rk-swatch rk-swatch--pub" aria-hidden="true" />
          {published}
        </li>
        <li>
          <span className="rk-swatch rk-swatch--none" aria-hidden="true" />
          {notPublished}
        </li>
      </ul>
    </div>
  );
}

/** The key and the count under the list's tools (`div.ia-xs-meta`; `p.ia-xs-count[role=status]`). */
export function IaExperimentsMeta({
  formatKey,
  count,
}: {
  readonly formatKey: ReactNode;
  /** "1 experiment in 1 course", "0 of 1 experiment". */
  readonly count: ReactNode;
}) {
  return (
    <div className="ia-xs-meta">
      {formatKey}
      <p className="ia-xs-count" role="status">
        {count}
      </p>
    </div>
  );
}

/** One experiment row of the table. */
export interface IaExperimentRow {
  readonly key: string;
  /** The name cell's id (`span.ia-xt-t`). */
  readonly nameId?: string;
  readonly name: ReactNode;
  /** The row's plan status (`StatusPill`), IA-02 only. */
  readonly status?: ReactNode;
  /** The format badges (`ul.xr-fmts`, the shared IA badges). */
  readonly formats: ReactNode;
  /**
   * IA-02 "Students given access": a link ("7 students", named "7 students given access to … Open
   * Student access") or the quiet "None yet".
   */
  readonly given?:
    { readonly label: ReactNode; readonly link: IaLink } | { readonly none: ReactNode };
  /** IA-02 "Give access" (secondary), named "Give students access to …"; none when not givable. */
  readonly action?: IaLink;
}

/** One course group of the table: the BITS code, the course and the institution's own code. */
export interface IaExperimentCourse {
  readonly key: string;
  /** The group heading's id (`th[scope=rowgroup]`). */
  readonly headId?: string;
  /** The BITS course code (`span.rb-code`); none for a course BITS gave no code. */
  readonly code?: ReactNode;
  readonly name: ReactNode;
  /**
   * The institution's code — "Your course code" MEC-523 (and its semester on IA-03) — or the ivory
   * "Your course code: not added" with "Add code" (named "Add your course code for …").
   */
  readonly ownCode:
    | { readonly label: ReactNode; readonly code: ReactNode; readonly semester?: ReactNode }
    | { readonly missing: ReactNode; readonly add: IaLink };
  readonly rows: readonly IaExperimentRow[];
}

export interface IaExperimentsTableProps {
  /** The table's caption (hidden by the role sheet; it names the table). */
  readonly caption: ReactNode;
  /** The column heads: "Experiment", "Formats", then IA-02's "Students given access" and "Action". */
  readonly headers: {
    readonly experiment: ReactNode;
    readonly formats: ReactNode;
    readonly given?: ReactNode;
    /** Read only by screen readers (`span.xr-sr`). */
    readonly action?: ReactNode;
  };
  readonly courses: readonly IaExperimentCourse[];
  /** IA-03's version: experiment and formats only (`ia-xt--plan`). */
  readonly plan?: boolean;
}

/**
 * The experiments table (`table.ia-xt`): one `tbody` per course, its group heading, then one row
 * per experiment — name and status, the format badges, students given access and Give access; or
 * IA-03's experiment and formats only (`ia-xt--plan`).
 */
export function IaExperimentsTable({
  caption,
  headers,
  courses,
  plan = false,
}: IaExperimentsTableProps) {
  const Link = useLinkComponent();
  const columns = plan ? 2 : 4;
  return (
    <table className={joinClasses('ia-xt', plan && 'ia-xt--plan')}>
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{headers.experiment}</th>
          <th scope="col">{headers.formats}</th>
          {plan ? null : (
            <>
              <th scope="col">{headers.given}</th>
              <th scope="col">
                <span className="xr-sr">{headers.action}</span>
              </th>
            </>
          )}
        </tr>
      </thead>
      {courses.map((course) => (
        <tbody key={course.key}>
          <tr className="ia-xt-grp">
            <th colSpan={columns} scope="rowgroup" id={course.headId}>
              <div className="ia-xt-gh">
                {course.code ? <span className="rb-code">{course.code}</span> : null}
                <span className="ia-xt-gt">{course.name}</span>
                <span className="ia-xt-own">
                  {'missing' in course.ownCode ? (
                    <>
                      <span className="rk-tag-warn">
                        <Glyph name="alertTriangle" />
                        {course.ownCode.missing}
                      </span>
                      <Link
                        className="rb-link"
                        href={course.ownCode.add.href}
                        aria-label={course.ownCode.add.accessibleName}
                      >
                        {course.ownCode.add.label}
                      </Link>
                    </>
                  ) : (
                    <>
                      <span className="rk-own-k">{course.ownCode.label}</span>
                      <span className="rk-owncode">{course.ownCode.code}</span>
                      {course.ownCode.semester ? <span>{course.ownCode.semester}</span> : null}
                    </>
                  )}
                </span>
              </div>
            </th>
          </tr>
          {course.rows.map((row) => (
            <tr key={row.key} className="ia-xt-row">
              <th scope="row" className="ia-xt-name">
                <span className="ia-xt-nm">
                  <span className="ia-xt-t" id={row.nameId}>
                    {row.name}
                  </span>
                  {row.status}
                </span>
              </th>
              <td className="ia-xt-fm">{row.formats}</td>
              {plan ? null : (
                <>
                  <td className="ia-xt-given">
                    {row.given && 'label' in row.given ? (
                      <>
                        <span className="ia-xt-lab">{row.given.label}</span>
                        <Link href={row.given.link.href} aria-label={row.given.link.accessibleName}>
                          <Glyph name="user" />
                          {row.given.link.label}
                        </Link>
                      </>
                    ) : row.given ? (
                      <>
                        <span className="ia-xt-lab">{headers.given}</span>
                        <span className="ia-xt-none">{row.given.none}</span>
                      </>
                    ) : null}
                  </td>
                  <td className="ia-xt-act">
                    {row.action ? (
                      <ButtonLink href={row.action.href} aria-label={row.action.accessibleName}>
                        {row.action.label}
                      </ButtonLink>
                    ) : null}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      ))}
    </table>
  );
}

// ---- IA-16 the course-code editor ------------------------------------------------------------

export interface IaCourseCodesProps {
  /** The editor's heading id (`h2#…` in `IaCourseCodesHead`). */
  readonly titleId: string;
  /** The explainer's heading id (`h2.ia-cc-help-h`). */
  readonly helpTitleId: string;
  /** The head, the courses and the save bar. */
  readonly children: ReactNode;
  /** The explainer beside it (`IaCourseCodesHelp`). */
  readonly help: ReactNode;
}

/** The editor beside its explainer (`div.ia-cc`): one column below 900 px of page width. */
export function IaCourseCodes({ titleId, helpTitleId, children, help }: IaCourseCodesProps) {
  return (
    <div className="ia-cc">
      <section className="rk-surface ia-cc-main" aria-labelledby={titleId}>
        {children}
      </section>
      <aside aria-labelledby={helpTitleId}>{help}</aside>
    </div>
  );
}

export interface IaCourseCodesHeadProps {
  /** "Course codes" (`h2.rb-h2`). */
  readonly title: ReactNode;
  readonly titleId: string;
  /** "Your institution’s code is added", "1 of 2 courses has no code …" (`p.ia-cc-sub[role=status]`). */
  readonly count: ReactNode;
  /** "Show missing codes only" (`label.rk-check`), drawn with more than one course. */
  readonly missingOnly?: {
    readonly id: string;
    readonly label: ReactNode;
    readonly checked: boolean;
    readonly onChange: () => void;
  };
}

/** The editor's head (`div.ia-cc-head`): title, count and the missing-only toggle. */
export function IaCourseCodesHead({ title, titleId, count, missingOnly }: IaCourseCodesHeadProps) {
  return (
    <div className="ia-cc-head">
      <div>
        <h2 className="rb-h2" id={titleId}>
          {title}
        </h2>
        <p className="ia-cc-sub" role="status">
          {count}
        </p>
      </div>
      {missingOnly ? (
        <label className="rk-check" htmlFor={missingOnly.id}>
          <input
            id={missingOnly.id}
            type="checkbox"
            checked={missingOnly.checked}
            onChange={missingOnly.onChange}
          />
          {missingOnly.label}
        </label>
      ) : null}
    </div>
  );
}

/**
 * The courses of the editor (the export's `ul.ia-cc-list`; `ia-cc-list` has no rule in
 * `ia-role.css`, so it is left out: the list draws the same without it).
 */
export function IaCourseCodeList({ children }: { readonly children: ReactNode }) {
  return <ul>{children}</ul>;
}

export interface IaCourseCodeItemProps {
  /** The course's name (`h3.ia-cc-name`). */
  readonly name: ReactNode;
  /** "Missing" / "Added" (`StatusPill`). */
  readonly status: ReactNode;
  /** The read-only BITS code: "BITS course code", "ME ZG523", "Set by BITS · read-only". */
  readonly bits: { readonly label: ReactNode; readonly code: ReactNode; readonly note: ReactNode };
  /**
   * The institution's code and the semester: the editable fields (kit `Field` + `TextInput`), or
   * the read-only values while paused (`IaCourseCodeValue`).
   */
  readonly code: ReactNode;
  readonly semester: ReactNode;
  /**
   * The live preview line (`p.ia-cc-prev`): "Students and faculty see" MEC-523 and the course, or
   * the one line asking for a code.
   */
  readonly preview:
    | { readonly lead: ReactNode; readonly code: ReactNode; readonly course: ReactNode }
    | { readonly empty: ReactNode };
}

/** One course of the editor (`li.ia-cc-item`): the BITS code beside the institution's own. */
export function IaCourseCodeItem({
  name,
  status,
  bits,
  code,
  semester,
  preview,
}: IaCourseCodeItemProps) {
  return (
    <li className="ia-cc-item">
      <div className="ia-cc-title">
        <h3 className="ia-cc-name">{name}</h3>
        {status}
      </div>
      <div className="ia-cc-map">
        <div className="ia-cc-bits">
          <span className="ia-cc-lab">{bits.label}</span>
          <span className="ia-cc-lock">
            <Glyph name="lock" />
            {bits.code}
          </span>
          <span className="ia-cc-note">{bits.note}</span>
        </div>
        <span className="ia-cc-arrow" aria-hidden="true">
          <Glyph name="next" />
        </span>
        {code}
        {semester}
      </div>
      <p className="ia-cc-prev">
        {'empty' in preview ? (
          <span>{preview.empty}</span>
        ) : (
          <>
            <span>{preview.lead}</span>
            <span className="rk-owncode">{preview.code}</span>
            <b>{preview.course}</b>
          </>
        )}
      </p>
    </li>
  );
}

/** A read-only value while the institution is paused (`div.rk-field` > `span.ia-cc-lab` + value). */
export function IaCourseCodeValue({
  label,
  value,
}: {
  readonly label: ReactNode;
  readonly value: ReactNode;
}) {
  return (
    <div className="rk-field">
      <span className="ia-cc-lab">{label}</span>
      <span className="ia-cc-ro">{value}</span>
    </div>
  );
}

/** "(optional)" after a label (`span.ia-cc-opt`). */
export function IaOptional({ children }: { readonly children: ReactNode }) {
  return <span className="ia-cc-opt">{children}</span>;
}

export interface IaCourseCodeSaveProps {
  /** "No unsaved changes" / "You have unsaved changes" (`p.ia-cc-state`, `is-dirty`). */
  readonly state: ReactNode;
  readonly dirty: boolean;
  /** "Undo changes" while anything is changed. */
  readonly undo?: ReactNode;
  /** The one primary "Save course code(s)". */
  readonly save: ReactNode;
}

/** The save bar (`div.ia-cc-save`): the unsaved-changes state, Undo, Save. */
export function IaCourseCodeSave({ state, dirty, undo, save }: IaCourseCodeSaveProps) {
  return (
    <div className="ia-cc-save">
      <p className={joinClasses('ia-cc-state', dirty && 'is-dirty')}>{state}</p>
      {dirty ? undo : null}
      {save}
    </div>
  );
}

/**
 * "How course codes work" beside the editor (`section.rk-surface.ia-cc-help`): its heading, then
 * the lines (the shared `IaLines` with the lock, people and file glyphs).
 */
export function IaCourseCodesHelp({
  title,
  titleId,
  children,
}: {
  readonly title: ReactNode;
  readonly titleId: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="rk-surface ia-cc-help">
      <h2 className="ia-cc-help-h" id={titleId}>
        {title}
      </h2>
      {children}
    </section>
  );
}

// ---- IA-20 Usage -----------------------------------------------------------------------------

/**
 * A format in a usage row (`span.ia-cell-line` > `span.xr-fmt` + `span.ia-cell-t`): "WEB Browser" —
 * the identity cell of the shared list table's figures (`IaListTable variant="stats"`).
 */
export function IaUsageFormat({
  code,
  name,
}: {
  /** "WEB". */
  readonly code: ReactNode;
  /** "Browser". */
  readonly name: ReactNode;
}) {
  return (
    <span className="ia-cell-line">
      <span className="xr-fmt">{code}</span>
      <span className="ia-cell-t">{name}</span>
    </span>
  );
}
