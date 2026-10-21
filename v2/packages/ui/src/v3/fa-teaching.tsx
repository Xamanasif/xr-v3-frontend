'use client';

import type { ReactNode } from 'react';

import { joinClasses } from '../internal/classes.js';
import { useLinkComponent } from '../link.js';
import { ButtonLink } from './actions.js';
import { FaUnits, type FaUnitState } from './fa.js';
import { Glyph, type V3IconName } from './icons.js';

/**
 * What only the Faculty teaching screens draw (owner-approved export design/v3-refined-b/roles/FA-v1,
 * `project/Main.dc.html` FA-01 Overview, FA-02 My courses, FA-03 Course, FA-04 Experiments and FA-05
 * Experiment): the overview's priority band, get-ready steps, panes, deadlines and teaching list;
 * the course ledger; the course's experiment panels; the experiments table's columns; the
 * experiment's about grid and the assessment facts the FA-03 and FA-05 panels share. Every word,
 * figure and destination comes from the caller (the application's records); what more than one
 * Faculty screen group draws — the identity band, figures, unit meters, format badges, the
 * assessment panel, message cards, the refined table and toolbar — is in `fa.tsx`, composed into
 * these pieces' slots.
 */

/** A destination drawn as a button, with the accessible name the action needs. */
export interface FaTeachingAction {
  readonly href: string;
  readonly label: ReactNode;
  /** The full name where the visible words need their object ("Mark now: Rahul Verma, …"). */
  readonly accessibleName?: string;
  /** The gold primary (`rb-btn--primary`): one per view. */
  readonly primary?: boolean;
}

// ── FA-01 Overview ───────────────────────────────────────────────────────────────────────────

export interface FaOverviewPriorityItem {
  readonly key: string;
  /** The big figure (`span.rb-pi-big`) and its line (`span.rb-pi-rel`); `calm` is the quiet tone. */
  readonly when: { readonly big: ReactNode; readonly relative: ReactNode; readonly calm?: boolean };
  /** The kind of work with its glyph (`p.rb-pi-kind`): "Written answers to mark". */
  readonly kind: { readonly icon: V3IconName; readonly label: ReactNode };
  readonly title: ReactNode;
  readonly description?: ReactNode;
  /** The people or records behind the count (`ul.fa-pi-list`), with what follows them. */
  readonly list?: {
    readonly label: string;
    readonly rows: readonly {
      readonly key: string;
      readonly name: ReactNode;
      readonly detail?: ReactNode;
    }[];
    /** "and 2 more in Marking" (`li.fa-pi-more`). */
    readonly more?: ReactNode;
  };
  readonly action: FaTeachingAction;
}

export interface FaOverviewPriorityProps {
  /** "Needs your attention". */
  readonly title: ReactNode;
  readonly titleId: string;
  /** The ordering rule (`p.rb-note`): "Marking first · oldest first in each". */
  readonly note?: ReactNode;
  readonly items: readonly FaOverviewPriorityItem[];
}

/**
 * The priority band sized to its items (`section.rb-prio.fa-prio--1|2`, three items fill the kit's
 * three columns): for each, the count and its line, the kind of work, what it is about, the people
 * or records behind it and one action.
 */
export function FaOverviewPriority({ title, titleId, note, items }: FaOverviewPriorityProps) {
  const sized = items.length === 1 || items.length === 2 ? `fa-prio--${items.length}` : undefined;
  return (
    <section className={joinClasses('rb-prio', sized)} aria-labelledby={titleId}>
      <div className="rb-sec-head">
        <h2 className="rb-h2" id={titleId}>
          {title}
        </h2>
        {note ? <p className="rb-note">{note}</p> : null}
      </div>
      <ol className="rb-prio-list">
        {items.map((item) => (
          <li key={item.key} className="rb-pi">
            <p className="rb-pi-when">
              <span className="rb-pi-big">{item.when.big}</span>
              <span className={joinClasses('rb-pi-rel', item.when.calm && 'rb-pi-rel--calm')}>
                {item.when.relative}
              </span>
            </p>
            <p className="rb-pi-kind">
              <Glyph name={item.kind.icon} />
              {item.kind.label}
            </p>
            <h3 className="rb-pi-title">{item.title}</h3>
            {item.description ? <p className="rb-pi-d">{item.description}</p> : null}
            {item.list ? (
              <ul className="fa-pi-list" aria-label={item.list.label}>
                {item.list.rows.map((row) => (
                  <li key={row.key}>
                    <b>{row.name}</b>
                    {row.detail ? <span>{row.detail}</span> : null}
                  </li>
                ))}
                {item.list.more ? <li className="fa-pi-more">{item.list.more}</li> : null}
              </ul>
            ) : null}
            <div className="rb-pi-act">
              <ButtonLink
                href={item.action.href}
                variant={item.action.primary ? 'primary' : 'default'}
                size="lg"
                aria-label={item.action.accessibleName}
              >
                {item.action.label}
              </ButtonLink>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Nothing needs the Faculty member (`div.rb-calm.fa-calm[role=status]`): the tick and the words. */
export function FaOverviewCalm({
  title,
  children,
}: {
  readonly title: ReactNode;
  readonly children?: ReactNode;
}) {
  return (
    <div className="rb-calm fa-calm" role="status">
      <span className="rb-calm-ico" aria-hidden="true">
        <Glyph name="check" />
      </span>
      <p className="rb-calm-t">{title}</p>
      {children ? <p className="rb-calm-d">{children}</p> : null}
    </div>
  );
}

export interface FaOverviewStep {
  readonly key: string;
  /** The step's number (`b`, hidden from screen readers: the list is ordered). */
  readonly number: ReactNode;
  /** Where the step happens: "Question bank". */
  readonly kind: ReactNode;
  readonly title: ReactNode;
  readonly description: ReactNode;
  readonly action: FaTeachingAction;
}

/**
 * "Get your course ready" for a new teacher (`section.fa-ready`): three numbered steps, each with
 * one real entry action.
 */
export function FaOverviewGetReady({
  title,
  titleId,
  note,
  steps,
}: {
  readonly title: ReactNode;
  readonly titleId: string;
  /** "For Shell-and-Tube Heat Exchanger" (`p.rb-note`). */
  readonly note?: ReactNode;
  readonly steps: readonly FaOverviewStep[];
}) {
  return (
    <section className="fa-ready" aria-labelledby={titleId}>
      <div className="rb-sec-head">
        <h2 className="rb-h2" id={titleId}>
          {title}
        </h2>
        {note ? <p className="rb-note">{note}</p> : null}
      </div>
      <ol className="fa-ready-list">
        {steps.map((step) => (
          <li key={step.key} className="fa-ready-i">
            <p className="fa-ready-n">
              <b aria-hidden="true">{step.number}</b>
              <span>{step.kind}</span>
            </p>
            <h3 className="fa-ready-t">{step.title}</h3>
            <p className="fa-ready-d">{step.description}</p>
            <div className="fa-ready-act">
              <ButtonLink
                href={step.action.href}
                variant={step.action.primary ? 'primary' : 'default'}
                size="lg"
                aria-label={step.action.accessibleName}
              >
                {step.action.label}
              </ButtonLink>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** "Coming up" beside "Your teaching" (`div.fa-ovgrid`; one column below 1020 px of page). */
export function FaOverviewGrid({ children }: { readonly children: ReactNode }) {
  return <div className="fa-ovgrid">{children}</div>;
}

/** A pane of the overview (`section.rb-panel.fa-pane` > `div.fa-pane-head`): title and note. */
export function FaOverviewPane({
  title,
  titleId,
  note,
  children,
}: {
  readonly title: ReactNode;
  readonly titleId: string;
  /** "Next 30 days", "As of 7 Nov 2026" (`p.rb-note`). */
  readonly note?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <section className="rb-panel fa-pane" aria-labelledby={titleId}>
      <div className="fa-pane-head">
        <h2 className="rb-h2" id={titleId}>
          {title}
        </h2>
        {note ? <p className="rb-note">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

export interface FaOverviewDeadline {
  readonly key: string;
  /** The date tile (`span.fa-date`, hidden: the link names the deadline): "14" and "Nov". */
  readonly day: ReactNode;
  readonly month: ReactNode;
  readonly title: ReactNode;
  readonly href: string;
  /** "Open Heat Exchanger — post-lab, due 14 Nov 2026, 23:59". */
  readonly accessibleName: string;
  /** "Due 14 Nov 2026, 23:59". */
  readonly due: ReactNode;
  /** "7 days left" (`b`, in the warn colour). */
  readonly left: ReactNode;
  /**
   * The Faculty member's own assessment: the submissions meter (one unit per Student reached, the
   * submitted first) and "2 of 5 students submitted"; a colleague's: "Created by …" instead.
   */
  readonly submissions?: { readonly units: readonly FaUnitState[]; readonly line: ReactNode };
  readonly createdBy?: ReactNode;
  /** When students see their result (`p.fa-upi-rel`, with the clock). */
  readonly release?: ReactNode;
}

/** Deadlines in the next 30 days (`ul.fa-uplist` > `li.fa-upi`): date tile, days left, release. */
export function FaOverviewDeadlines({ items }: { readonly items: readonly FaOverviewDeadline[] }) {
  const Link = useLinkComponent();
  return (
    <ul className="fa-uplist">
      {items.map((item) => (
        <li key={item.key} className="fa-upi">
          <span className="fa-date" aria-hidden="true">
            <b>{item.day}</b>
            <span>{item.month}</span>
          </span>
          <p className="fa-upi-t">
            <Link href={item.href} aria-label={item.accessibleName}>
              {item.title}
            </Link>
          </p>
          <p className="fa-upi-d">
            {item.due} · <b>{item.left}</b>
          </p>
          {item.submissions ? (
            <div className="fa-upi-meter">
              <FaUnits units={item.submissions.units} />
              <p>{item.submissions.line}</p>
            </div>
          ) : null}
          {item.createdBy ? <p className="fa-upi-d">{item.createdBy}</p> : null}
          {item.release ? (
            <p className="fa-upi-rel">
              <Glyph name="clock" />
              <span>{item.release}</span>
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/** No deadline coming up (`p.fa-upi-none`). */
export function FaOverviewNoDeadlines({ children }: { readonly children: ReactNode }) {
  return <p className="fa-upi-none">{children}</p>;
}

/** One course of "Your teaching" (`div.fa-tc` > `div.fa-tc-h`): code, name, "Open course". */
export function FaOverviewCourse({
  code,
  title,
  open,
  children,
}: {
  /** The course code (`span.rb-code`); a course without one shows its name alone. */
  readonly code?: ReactNode;
  readonly title: ReactNode;
  readonly open: {
    readonly href: string;
    readonly label: ReactNode;
    readonly accessibleName?: string;
  };
  /** Its experiments (`FaOverviewExperiment`). */
  readonly children: ReactNode;
}) {
  const Link = useLinkComponent();
  return (
    <div className="fa-tc">
      <div className="fa-tc-h">
        {code ? <span className="rb-code">{code}</span> : null}
        <h3 className="fa-tc-t">{title}</h3>
        <Link className="rb-link" href={open.href} aria-label={open.accessibleName}>
          {open.label}
        </Link>
      </div>
      {children}
    </div>
  );
}

/**
 * One taught experiment of "Your teaching" (`div.fa-te`): its name (FA-05), the formats the
 * institution has, who has it, one unit meter per format (or the quiet line) and its assessment.
 */
export function FaOverviewExperiment({
  title,
  href,
  formats,
  reach,
  activity,
  status,
  assessment,
}: {
  readonly title: ReactNode;
  readonly href: string;
  /** The format badges (`span.rk-fmts`, from `fa.tsx`). */
  readonly formats: ReactNode;
  /** "5 students with access" (`span.fa-te-n`). */
  readonly reach: ReactNode;
  /** The unit meters (`ul.fa-prog`, from `fa.tsx`) or the quiet line (`p.fa-quiet`). */
  readonly activity: ReactNode;
  /** The assessment's status pill (`span.xr-st`). */
  readonly status: ReactNode;
  /** Its name ("· created by …" for a colleague's). */
  readonly assessment?: ReactNode;
}) {
  const Link = useLinkComponent();
  return (
    <div className="fa-te">
      <div className="fa-te-h">
        <Link className="fa-exp-link fa-te-t" href={href}>
          {title}
        </Link>
        {formats}
        <span className="fa-te-n">{reach}</span>
      </div>
      {activity}
      <p className="fa-te-asm">
        {status}
        {assessment ? <span>{assessment}</span> : null}
      </p>
    </div>
  );
}

// ── FA-02 My courses: the course ledger ──────────────────────────────────────────────────────

/** "1 course · 1 experiment" (`p.rk-count.fa-listcount[role=status]`). */
export function FaCourseCount({ children }: { readonly children: ReactNode }) {
  return (
    <p className="rk-count fa-listcount" role="status">
      {children}
    </p>
  );
}

/** The course ledger (`div.fa-courses`): one card per course, 22 px apart. */
export function FaCourseLedger({ children }: { readonly children: ReactNode }) {
  return <div className="fa-courses">{children}</div>;
}

export interface FaCourseCardProps {
  readonly code?: ReactNode;
  readonly title: ReactNode;
  readonly titleId: string;
  /** "Assigned to you by your Institute Admin" (`p.fa-course-src`). */
  readonly source: ReactNode;
  /** The course's figures (`dl.fa-figs`, from `fa.tsx`). */
  readonly figures: ReactNode;
  readonly open: {
    readonly href: string;
    readonly label: ReactNode;
    readonly accessibleName?: string;
  };
  /** The three column heads, drawn for sighted readers only (`div.fa-xhead[aria-hidden]`). */
  readonly columns: readonly [ReactNode, ReactNode, ReactNode];
  /** The experiment list's name: "Experiments in ME ZG523". */
  readonly listLabel: string;
  /** Its experiments (`FaCourseRow`). */
  readonly children: ReactNode;
}

/**
 * One course of the ledger (`section.fa-course`): the tinted head with its code, name, source,
 * figures and "Open course", then its experiments in aligned rows.
 */
export function FaCourseCard({
  code,
  title,
  titleId,
  source,
  figures,
  open,
  columns,
  listLabel,
  children,
}: FaCourseCardProps) {
  return (
    <section className="fa-course" aria-labelledby={titleId}>
      <div className="fa-course-h">
        <div className="fa-course-id">
          {code ? <span className="rb-code">{code}</span> : null}
          <h3 className="fa-course-t" id={titleId}>
            {title}
          </h3>
          <p className="fa-course-src">{source}</p>
        </div>
        {figures}
        <div className="fa-course-act">
          <ButtonLink href={open.href} aria-label={open.accessibleName}>
            {open.label}
          </ButtonLink>
        </div>
      </div>
      <div className="fa-course-body">
        <div className="fa-xcols fa-xhead" aria-hidden="true">
          <span>{columns[0]}</span>
          <span>{columns[1]}</span>
          <span>{columns[2]}</span>
        </div>
        <ul className="fa-xrows" aria-label={listLabel}>
          {children}
        </ul>
      </div>
    </section>
  );
}

export interface FaCourseRowProps {
  readonly title: ReactNode;
  readonly href: string;
  /** The format badges (`span.rk-fmts`, from `fa.tsx`). */
  readonly formats: ReactNode;
  /** The columns' names for narrow widths (`span.fa-k.fa-hidden-lbl`): Students, Assessment. */
  readonly labels: { readonly students: ReactNode; readonly assessment: ReactNode };
  /** "5 with access", "None yet". */
  readonly students: ReactNode;
  readonly status: ReactNode;
  /** The assessment's name (`span.fa-xasm-n`), when there is one. */
  readonly assessment?: ReactNode;
  /** "Due 14 Nov 2026, 23:59", or "Create one from the experiment page." (`span.fa-xasm-d`). */
  readonly detail: ReactNode;
  /** "2 written answers waiting for marking" (`FaWaitLine`, `span.fa-xwait`, from `fa.tsx`). */
  readonly waiting?: ReactNode;
}

/** One experiment of a course (`li.fa-xcols.fa-xrow`): name and formats, students, assessment. */
export function FaCourseRow({
  title,
  href,
  formats,
  labels,
  students,
  status,
  assessment,
  detail,
  waiting,
}: FaCourseRowProps) {
  const Link = useLinkComponent();
  return (
    <li className="fa-xcols fa-xrow">
      <div className="fa-xcell fa-xname">
        <Link className="fa-exp-link fa-xt" href={href}>
          {title}
        </Link>
        {formats}
      </div>
      <div className="fa-xcell">
        <span className="fa-k fa-hidden-lbl">{labels.students}</span>
        {students}
      </div>
      <div className="fa-xcell fa-xasm fa-xasm-c">
        <span className="fa-k fa-hidden-lbl">{labels.assessment}</span>
        {status}
        {assessment ? <span className="fa-xasm-n">{assessment}</span> : null}
        <span className="fa-xasm-d">{detail}</span>
        {waiting}
      </div>
    </li>
  );
}

/** The ledger's quiet foot line (`p.fa-foot`). */
export function FaCourseFoot({ children }: { readonly children: ReactNode }) {
  return <p className="fa-foot">{children}</p>;
}

// ── FA-03 Course: one panel per experiment ───────────────────────────────────────────────────

/**
 * The course's experiments (`section` > `div.rb-sec-head` + `div.fa-xps`). The export lays the
 * section out as a 16 px column with an inline style: the product class `rk-x-sec-stack` (V3P-17).
 */
export function FaCourseExperiments({
  title,
  titleId,
  note,
  children,
}: {
  readonly title: ReactNode;
  readonly titleId: string;
  /** "Only experiments your institution holds" (`p.rb-note`). */
  readonly note?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <section className="rk-x-sec-stack" aria-labelledby={titleId}>
      <div className="rb-sec-head">
        <h2 className="rb-h2" id={titleId}>
          {title}
        </h2>
        {note ? <p className="rb-note">{note}</p> : null}
      </div>
      <div className="fa-xps">{children}</div>
    </section>
  );
}

/** A column of an experiment panel (`section.fa-xp-col` > `div.fa-xp-colh` with its `h4`). */
interface FaCourseColumn {
  readonly title: ReactNode;
  readonly titleId: string;
  /** Beside the heading: the "As of" hint (`p.rk-hint`) or the status pill. */
  readonly aside?: ReactNode;
  readonly children: ReactNode;
}

function CourseColumn({ title, titleId, aside, children }: FaCourseColumn) {
  return (
    <section className="fa-xp-col" aria-labelledby={titleId}>
      <div className="fa-xp-colh">
        <h4 className="rk-h3" id={titleId}>
          {title}
        </h4>
        {aside}
      </div>
      {children}
    </section>
  );
}

export interface FaCourseExperimentProps {
  readonly title: ReactNode;
  readonly titleId: string;
  /** The experiment's description (`p.fa-xp-about`); none when it has none. */
  readonly about?: ReactNode;
  /** "Formats your institution has" (`span.fa-k`) and the badges (`span.rk-fmts`, `fa.tsx`). */
  readonly formats: { readonly label: ReactNode; readonly badges: ReactNode };
  readonly open: {
    readonly href: string;
    readonly label: ReactNode;
    readonly accessibleName?: string;
  };
  /** "Student activity, by format" with its "As of" hint and the meters or the quiet line. */
  readonly activity: Omit<FaCourseColumn, 'aside'> & { readonly hint?: ReactNode };
  /** "Assessment" with its status pill and the assessment's facts and actions. */
  readonly assessment: Omit<FaCourseColumn, 'aside'> & { readonly status: ReactNode };
}

/**
 * One experiment of the course (`article.rk-surface.fa-xp`): its name, description, formats and
 * "Open experiment", then Student activity and Assessment side by side (stacked below 760 px).
 */
export function FaCourseExperiment({
  title,
  titleId,
  about,
  formats,
  open,
  activity,
  assessment,
}: FaCourseExperimentProps) {
  return (
    <article className="rk-surface fa-xp" aria-labelledby={titleId}>
      <div className="fa-xp-head">
        <div className="fa-xp-id">
          <h3 className="fa-xp-t" id={titleId}>
            {title}
          </h3>
          {about ? <p className="fa-xp-about">{about}</p> : null}
          <p className="fa-xp-fm">
            <span className="fa-k">{formats.label}</span>
            {formats.badges}
          </p>
        </div>
        <ButtonLink href={open.href} aria-label={open.accessibleName}>
          {open.label}
        </ButtonLink>
      </div>
      <div className="fa-xp-body">
        <CourseColumn
          title={activity.title}
          titleId={activity.titleId}
          aside={activity.hint ? <p className="rk-hint">{activity.hint}</p> : undefined}
        >
          {activity.children}
        </CourseColumn>
        <CourseColumn
          title={assessment.title}
          titleId={assessment.titleId}
          aside={assessment.status}
        >
          {assessment.children}
        </CourseColumn>
      </div>
    </article>
  );
}

/** The line under the meters (`p.fa-xp-foot`): who has it, and "Students on this experiment". */
export function FaTeachingActivityFoot({
  children,
  link,
}: {
  readonly children: ReactNode;
  readonly link: { readonly href: string; readonly label: ReactNode };
}) {
  const Link = useLinkComponent();
  return (
    <p className="fa-xp-foot">
      <span>{children}</span>
      <Link className="rb-link" href={link.href}>
        {link.label}
      </Link>
    </p>
  );
}

/** An experiment panel's actions (`div.fa-xp-acts`): "Mark …" first, then the assessment. */
export function FaCourseExperimentActions({ children }: { readonly children: ReactNode }) {
  return <div className="fa-xp-acts">{children}</div>;
}

// ── FA-04 Experiments: the formats line in the experiment cell ───────────────────────────────

/** "Formats your institution has" and the badges under the experiment's name (`span.fa-cellfm`). */
export function FaExperimentsFormats({
  label,
  badges,
}: {
  readonly label: ReactNode;
  /** The format badges (`span.rk-fmts`, from `fa.tsx`). */
  readonly badges: ReactNode;
}) {
  return (
    <span className="fa-cellfm">
      <span className="fa-k">{label}</span>
      {badges}
    </span>
  );
}

// ── FA-05 Experiment ─────────────────────────────────────────────────────────────────────────

/**
 * A section of the experiment's sheet (`section.rk-sec`): with a hint, its head row
 * (`div.rk-sec-h` > `h2.rb-h2` + `p.rk-hint`, "Student activity, by format · As of 7 Nov 2026");
 * without, the heading alone ("About this experiment").
 */
export function FaExperimentSection({
  title,
  titleId,
  hint,
  children,
}: {
  readonly title: ReactNode;
  readonly titleId: string;
  readonly hint?: ReactNode;
  readonly children: ReactNode;
}) {
  const heading = (
    <h2 className="rb-h2" id={titleId}>
      {title}
    </h2>
  );
  return (
    <section className="rk-sec" aria-labelledby={titleId}>
      {hint ? (
        <div className="rk-sec-h">
          {heading}
          <p className="rk-hint">{hint}</p>
        </div>
      ) : (
        heading
      )}
      {children}
    </section>
  );
}

/**
 * The note under the learning outcomes (`p.rk-hint`): "One set of outcomes for the experiment,
 * written by the Academic Reviewer. Read-only here." The export sets `margin-top: 12px` on it with
 * an inline style: V3P-12's `rk-x-hint-list`, the note under a list.
 */
export function FaExperimentHint({ children }: { readonly children: ReactNode }) {
  return <p className="rk-hint rk-x-hint-list">{children}</p>;
}

/** The experiment's description (`p.fa-about`). */
export function FaExperimentAbout({ children }: { readonly children: ReactNode }) {
  return <p className="fa-about">{children}</p>;
}

/**
 * Learning outcomes beside the resources students see (`div.fa-aboutgrid`, one column below 600 px
 * of the sheet): each column a heading (`h3.rk-h3`) and what follows it.
 */
export function FaExperimentAboutGrid({
  columns,
}: {
  readonly columns: readonly {
    readonly key: string;
    readonly title: ReactNode;
    readonly children: ReactNode;
  }[];
}) {
  return (
    <div className="fa-aboutgrid">
      {columns.map((column) => (
        <div key={column.key}>
          <h3 className="rk-h3">{column.title}</h3>
          {column.children}
        </div>
      ))}
    </div>
  );
}
