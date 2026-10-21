'use client';

import type { ReactNode, Ref } from 'react';

import type { FormatCode } from '../icons/registry.js';
import { useLinkComponent } from '../link.js';
import { Glyph, V3_ICON_PATHS, type V3IconName } from './icons.js';
import { StFormatChip, type StFormatKind } from './st.js';

/*
 * What the Student's home group alone draws (ST-01 Home, ST-02 My courses, ST-03 Course, ST-04 All
 * experiments; the owner-approved Student export design/v3-refined-b/roles/ST-v1,
 * `project/StudentFinal.dc.html`, `project/v3-student-final.css`): the Home's cover with its one
 * next step, its "Also in this experiment" items and its how-it-works steps; a course as a section
 * with its experiments; an experiment row's formats; the All experiments panel and its toolbar.
 * Markup as the export's template draws it; every word, figure and destination comes from the
 * caller. No stage tracker (lead decision 1: the sample activity's stages are illustrative).
 */

/** A format chip as the home group draws it beside its words. */
export interface StHomeChip {
  readonly code: FormatCode;
  readonly kind: StFormatKind;
  /** The held chip's reason glyph (`pauseBars`, `clock`, `alertCircle`); default per kind. */
  readonly glyph?: V3IconName | null;
}

/** The bare chevron with its own class (`svg.sv-item-go`), as the export draws it. */
function ItemGo() {
  return (
    <svg className="sv-item-go" viewBox="0 0 24 24" aria-hidden="true">
      <path d={V3_ICON_PATHS.chevronRight} />
    </svg>
  );
}

// ---- ST-01 Home: how it works ----------------------------------------------------------------------

/** The new student's numbered steps inside the Home's message (`ol.sv-how`). */
export function StHomeHow({
  label,
  steps,
}: {
  /** "How it works". */
  readonly label: string;
  readonly steps: readonly string[];
}) {
  return (
    <ol className="sv-how" aria-label={label}>
      {steps.map((step, index) => (
        <li key={`${index} ${step}`}>
          <span className="sv-how-n" aria-hidden="true">
            {index + 1}
          </span>
          <span className="sv-how-t">{step}</span>
        </li>
      ))}
    </ol>
  );
}

// ---- ST-01 Home: the cover --------------------------------------------------------------------------

/** The Home's columns (`div.sv-home`): the cover, the experiment's other parts, what it teaches. */
export function StHomeLayout({ children }: { readonly children: ReactNode }) {
  return <div className="sv-home">{children}</div>;
}

export interface StHomeStepProps {
  /**
   * `next` (`is-next`: a step to take), `held` (`sv-step--held`: paused, a licence wait),
   * `off` (`sv-step--off`: no longer given, ended) or `plain` (nothing waiting).
   */
  readonly tone: 'next' | 'held' | 'off' | 'plain';
  /** The badge: a format chip, or an icon in its box (`span.sv-step-ico`). */
  readonly badge: { readonly chip: StHomeChip } | { readonly icon: V3IconName };
  /** "Your next step" (`p.sv-step-k`), only on a step to take. */
  readonly kicker?: ReactNode;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  /** The step's one action (`a.rb-btn`; `primary` the large gold button). */
  readonly action?: {
    readonly href: string;
    readonly label: ReactNode;
    readonly ariaLabel?: string;
    readonly primary?: boolean;
  };
  /** "Open experiment" as a button below 600 px (`a.rb-btn.sv-narrow`). */
  readonly open?: { readonly href: string; readonly label: ReactNode; readonly ariaLabel?: string };
}

const STEP_CLASS: Readonly<Record<StHomeStepProps['tone'], string>> = {
  next: 'sv-step is-next',
  held: 'sv-step sv-step--held',
  off: 'sv-step sv-step--off',
  plain: 'sv-step',
};

/** The cover's one next step (`div.sv-step`), or why nothing can be done now. */
export function StHomeStep({
  tone,
  badge,
  kicker,
  title,
  description,
  action,
  open,
}: StHomeStepProps) {
  const Link = useLinkComponent();
  return (
    <div className={STEP_CLASS[tone]}>
      <span className="sv-step-badge" aria-hidden="true">
        {'chip' in badge ? (
          <StFormatChip
            code={badge.chip.code}
            kind={badge.chip.kind}
            glyph={badge.chip.glyph}
            hidden={false}
          />
        ) : (
          <span className="sv-step-ico">
            <Glyph name={badge.icon} />
          </span>
        )}
      </span>
      <div className="sv-step-main">
        {kicker === undefined ? null : <p className="sv-step-k">{kicker}</p>}
        <p className="sv-step-t">{title}</p>
        {description === undefined ? null : <p className="sv-step-d">{description}</p>}
      </div>
      {action || open ? (
        <div className="sv-step-act">
          {action ? (
            <Link
              className={action.primary ? 'rb-btn rb-btn--primary rb-btn--lg' : 'rb-btn'}
              href={action.href}
              aria-label={action.ariaLabel}
            >
              {action.label}
            </Link>
          ) : null}
          {open ? (
            <Link className="rb-btn sv-narrow" href={open.href} aria-label={open.ariaLabel}>
              {open.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export interface StHomeCoverProps {
  /** The shelf heading: "Start here", "Continue learning", "Your experiment". */
  readonly kicker: ReactNode;
  readonly kickerId: string;
  /** The course code shown (`span.rk-owncode`); none when the course has no code. */
  readonly code: string | null;
  /** The course: a link to it (`a.sv-now-clink`) or, when it can't be opened, its name. */
  readonly course: {
    readonly name: ReactNode;
    readonly href?: string;
    readonly ariaLabel?: string;
  };
  /** "Open experiment ›" at the card's top right (`a.sv-link.sv-wide`). */
  readonly open?: { readonly href: string; readonly label: ReactNode; readonly ariaLabel?: string };
  readonly title: ReactNode;
  readonly titleId: string;
  readonly description?: ReactNode;
  /** The `StHomeStep`. */
  readonly step: ReactNode;
}

/** The current experiment (`section.sv-home-now` > `article.sv-card.sv-now`). */
export function StHomeCover({
  kicker,
  kickerId,
  code,
  course,
  open,
  title,
  titleId,
  description,
  step,
}: StHomeCoverProps) {
  const Link = useLinkComponent();
  return (
    <section className="sv-home-now" aria-labelledby={kickerId}>
      <h2 className="sv-sh" id={kickerId}>
        {kicker}
      </h2>
      <article className="sv-card sv-now" aria-labelledby={titleId}>
        <div className="sv-now-top">
          <p className="sv-now-course">
            {code === null ? null : <span className="rk-owncode">{code}</span>}
            {course.href ? (
              <Link className="sv-now-clink" href={course.href} aria-label={course.ariaLabel}>
                {course.name}
              </Link>
            ) : (
              <span>{course.name}</span>
            )}
          </p>
          {open ? (
            <Link className="sv-link sv-wide" href={open.href} aria-label={open.ariaLabel}>
              {open.label}
              <Glyph name="chevronRight" />
            </Link>
          ) : null}
        </div>
        <h3 className="sv-now-t" id={titleId}>
          {title}
        </h3>
        {description === undefined ? null : <p className="sv-now-d">{description}</p>}
        {step}
      </article>
    </section>
  );
}

export interface StHomeItem {
  readonly key: string;
  /** The item's badge: a format chip or an icon in its box (`span.sv-item-ico`). */
  readonly badge: { readonly chip: StHomeChip } | { readonly icon: V3IconName };
  /** "Resources", "Virtual reality", "Assessment". */
  readonly label: ReactNode;
  /** "1 of 3 opened", "Not started", "Not set by your faculty yet". */
  readonly value: ReactNode;
  /** Where it opens; none while it can't be opened (a static row). */
  readonly href?: string;
  readonly ariaLabel?: string;
}

/**
 * The rest of the experiment, quietly (`section.sv-home-also` > `ul.sv-card.sv-items`): one row
 * each, a link while it can be opened.
 */
export function StHomeItems({
  title,
  titleId,
  items,
  more,
}: {
  /** "Also in this experiment", "In this experiment". */
  readonly title: ReactNode;
  readonly titleId: string;
  readonly items: readonly StHomeItem[];
  /**
   * A second list in the same column (product-only: the export draws one experiment), its own
   * heading and items: "Up next" for the Student's other experiments.
   */
  readonly more?: {
    readonly title: ReactNode;
    readonly titleId: string;
    readonly items: readonly StHomeItem[];
  };
}) {
  return (
    <section className="sv-home-also" aria-labelledby={items.length > 0 ? titleId : more?.titleId}>
      {items.length > 0 ? (
        <>
          <h2 className="sv-sh" id={titleId}>
            {title}
          </h2>
          <StHomeItemList items={items} />
        </>
      ) : null}
      {more && more.items.length > 0 ? (
        <>
          <h2 className="sv-sh" id={more.titleId}>
            {more.title}
          </h2>
          <StHomeItemList items={more.items} />
        </>
      ) : null}
    </section>
  );
}

function StHomeItemList({ items }: { readonly items: readonly StHomeItem[] }) {
  const Link = useLinkComponent();
  return (
    <ul className="sv-card sv-items">
      {items.map((item) => {
        const inner = (
          <>
            <span className="sv-item-b" aria-hidden="true">
              {'chip' in item.badge ? (
                <StFormatChip
                  code={item.badge.chip.code}
                  kind={item.badge.chip.kind}
                  glyph={item.badge.chip.glyph}
                  hidden={false}
                />
              ) : (
                <span className="sv-item-ico">
                  <Glyph name={item.badge.icon} />
                </span>
              )}
            </span>
            <span className="sv-item-text">
              <span className="sv-item-l">{item.label}</span>
              <span className="sv-item-v">{item.value}</span>
            </span>
          </>
        );
        return (
          <li key={item.key}>
            {item.href ? (
              <Link className="sv-item" href={item.href} aria-label={item.ariaLabel}>
                {inner}
                <ItemGo />
              </Link>
            ) : (
              <div className="sv-item">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** What the experiment teaches (`section.sv-home-learn`): its heading row and the outcomes card. */
export function StHomeLearn({
  title,
  titleId,
  note,
  children,
}: {
  /** "What you’re learning". */
  readonly title: ReactNode;
  readonly titleId: string;
  /** "The same in every format". */
  readonly note: ReactNode;
  /** The kit's `StOutcomes`. */
  readonly children: ReactNode;
}) {
  return (
    <section className="sv-home-learn" aria-labelledby={titleId}>
      <div className="sv-sh-row">
        <h2 className="sv-sh" id={titleId}>
          {title}
        </h2>
        <p className="sv-sh-note">{note}</p>
      </div>
      {children}
    </section>
  );
}

// ---- ST-02 My courses: a course as a section --------------------------------------------------------

/** The courses, named by a heading read by screen readers only (`h2.xr-sr` "Your courses"). */
export function StCourseList({
  title,
  titleId,
  children,
}: {
  readonly title: string;
  readonly titleId: string;
  /** The `StCourseSection`s. */
  readonly children: ReactNode;
}) {
  return (
    <>
      <h2 className="xr-sr" id={titleId}>
        {title}
      </h2>
      {children}
    </>
  );
}

export interface StCourseSectionProps {
  /** The heading's id (the section is named by it). */
  readonly titleId: string;
  /** The course code shown (`span.rk-owncode`); none when the course has no code. */
  readonly code: string | null;
  /** The engineering area after the code, when a read holds it. */
  readonly area?: ReactNode;
  readonly name: ReactNode;
  /** `p.sv-course-m`: plain facts ("1 experiment given to you"), then the status pill. */
  readonly meta?: ReactNode;
  /** "Open course" (`a.rb-btn.sv-course-open`). */
  readonly open?: { readonly href: string; readonly label: ReactNode; readonly ariaLabel?: string };
  /** The experiments given in it (`ul.sv-list`, named "Experiments given to you in …"). */
  readonly listLabel: string;
  /** `StListRow`s; none: the list is left out. */
  readonly children?: ReactNode;
  /** Takes focus after a retry. */
  readonly titleRef?: Ref<HTMLHeadingElement>;
}

/** One course (`section.sv-card.sv-course`): its code and name, its facts, then its experiments. */
export function StCourseSection({
  titleId,
  code,
  area,
  name,
  meta,
  open,
  listLabel,
  children,
  titleRef,
}: StCourseSectionProps) {
  const Link = useLinkComponent();
  return (
    <section className="sv-card sv-course" aria-labelledby={titleId}>
      <header className="sv-course-h">
        <div className="sv-course-id">
          {code === null && area === undefined ? null : (
            <p className="sv-course-k">
              {code === null ? null : <span className="rk-owncode">{code}</span>}
              {area === undefined ? null : <span>{area}</span>}
            </p>
          )}
          <h3 ref={titleRef} className="sv-course-t" id={titleId}>
            {name}
          </h3>
          {meta === undefined ? null : <p className="sv-course-m">{meta}</p>}
        </div>
        {open ? (
          <Link className="rb-btn sv-course-open" href={open.href} aria-label={open.ariaLabel}>
            {open.label}
          </Link>
        ) : null}
      </header>
      {children === undefined ? null : (
        <ul className="sv-list" aria-label={listLabel}>
          {children}
        </ul>
      )}
    </section>
  );
}

// ---- An experiment row's formats (ST-02, ST-03, ST-04) ------------------------------------------------

export interface StExperimentFormat {
  readonly chip: StHomeChip;
  /** The format's name, read before its words ("Browser: "). */
  readonly name: string;
  /** "In progress", "Paused · completed", "Waiting for a licence". */
  readonly text: ReactNode;
}

/** The row's formats (`ul.sv-xli-f`): each chip with its one line of words. */
export function StExperimentListFormats({
  label,
  formats,
}: {
  /** "Your formats for <experiment>". */
  readonly label: string;
  readonly formats: readonly StExperimentFormat[];
}) {
  return (
    <ul className="sv-xli-f" aria-label={label}>
      {formats.map((format) => (
        <li key={format.chip.code}>
          <StFormatChip code={format.chip.code} kind={format.chip.kind} glyph={format.chip.glyph} />
          <span className="sv-xli-ft">
            <span className="xr-sr">{format.name}: </span>
            {format.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** ST-04's row kicker (`p.sv-li-k`): the small code chip, then the course. */
export function StExperimentListKicker({
  code,
  course,
}: {
  readonly code: string | null;
  readonly course: ReactNode;
}) {
  return (
    <p className="sv-li-k">
      {code === null ? null : <span className="rk-owncode sv-code-sm">{code}</span>}
      {course}
    </p>
  );
}

// ---- ST-04 All experiments: the panel and its toolbar ---------------------------------------------------

/** The All experiments panel (`section.sv-card.sv-xpanel`), named by its hidden heading. */
export function StExperimentListPanel({
  title,
  titleId,
  children,
}: {
  /** "All the experiments given to you" (read by screen readers only). */
  readonly title: string;
  readonly titleId: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="sv-card sv-xpanel" aria-labelledby={titleId}>
      <h2 className="xr-sr" id={titleId}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export interface StExperimentListChip {
  readonly key: string;
  /** "Search: “fin”", "Format: WEB". */
  readonly label: string;
  /** "Remove filter Search: “fin”". */
  readonly removeLabel: string;
  readonly onRemove: () => void;
}

export interface StExperimentListToolbarProps {
  /** The search region's name: "Filter your experiments". */
  readonly label: string;
  readonly search: {
    readonly id: string;
    readonly label: string;
    readonly placeholder: string;
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly ref?: Ref<HTMLInputElement>;
  };
  readonly format: {
    readonly id: string;
    readonly label: string;
    readonly value: string;
    readonly options: readonly { readonly value: string; readonly label: string }[];
    readonly onChange: (value: string) => void;
    readonly ref?: Ref<HTMLSelectElement>;
  };
  /** "1 experiment in 1 course", "1 of 3 experiments" (a status region). */
  readonly count: ReactNode;
  readonly chips: readonly StExperimentListChip[];
  /** "Clear filters" (`button.rk-clear`), while a filter applies. */
  readonly clear?: { readonly label: string; readonly onClear: () => void };
}

/** Search and the format filter, the count, one chip per filter and "Clear filters" (`div.sv-toolbar`). */
export function StExperimentListToolbar({
  label,
  search,
  format,
  count,
  chips,
  clear,
}: StExperimentListToolbarProps) {
  return (
    <div className="sv-toolbar">
      <div className="sv-toolbar-f" role="search" aria-label={label}>
        <div className="sv-tfield sv-tfield--q">
          <label className="rk-label" htmlFor={search.id}>
            {search.label}
          </label>
          <div className="rk-inputwrap">
            <Glyph name="search" />
            <input
              ref={search.ref}
              id={search.id}
              className="rk-input"
              type="search"
              placeholder={search.placeholder}
              autoComplete="off"
              value={search.value}
              onChange={(event) => search.onChange(event.target.value)}
            />
          </div>
        </div>
        <div className="sv-tfield">
          <label className="rk-label" htmlFor={format.id}>
            {format.label}
          </label>
          <div className="rk-selwrap">
            <select
              ref={format.ref}
              id={format.id}
              className="rk-select"
              value={format.value}
              onChange={(event) => format.onChange(event.target.value)}
            >
              {format.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Glyph name="chevronDown" />
          </div>
        </div>
      </div>
      <div className="sv-toolbar-s">
        <p className="rk-count" role="status">
          {count}
        </p>
        {chips.map((chip) => (
          <span key={chip.key} className="rk-chip">
            {chip.label}
            <button type="button" aria-label={chip.removeLabel} onClick={chip.onRemove}>
              <Glyph name="close" />
            </button>
          </span>
        ))}
        {clear ? (
          <button type="button" className="rk-clear" onClick={clear.onClear}>
            {clear.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}
