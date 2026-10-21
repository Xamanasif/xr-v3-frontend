'use client';

import { type ReactNode, useId } from 'react';

import { joinClasses } from '../internal/classes.js';
import { useLinkComponent } from '../link.js';
import { Glyph } from './icons.js';
import { IaSummary, type IaSummaryItem } from './ia.js';
import { StatusPill, type StatusTone } from './status.js';

/*
 * What only the Institute Admin's access screens draw — IA-04 Student access, IA-05 Give students
 * access, IA-07 Student record and IA-14 Group (`ia-` classes; the owner-approved Institute Admin
 * export, design/v3-refined-b/roles/IA-v1, `project/ia-role.css` and COMPONENT-EXTENSIONS.md):
 * the pick list of students, groups and members, the "Your selection" summary beside the steps
 * (and folded under them on narrow pages), the review's group line, the result rows, a group's
 * grant items and its add panel. Markup as the export's `Main.dc.html` draws it, its inline sizes
 * as the central patch's product classes (V3P-16, `rk-x-*`). The shared families (grant cells,
 * outcome lines, badges, the view switch) are `ia.tsx`'s; the destructive confirmation is the kit
 * `ConfirmDialog` (`destructive`, `initialFocus="cancel"`, `busyLook`). Every word, date and
 * destination comes from the caller; no piece prints a record's internal reference.
 */

// ---- the pick list (`ul.ia-pick`) ------------------------------------------------------------

/** One row of a pick list: a student, a group or a candidate member. */
export interface IaPickItem {
  readonly key: string;
  /** The input's id (`gv-s-…`, `gd-c-…`): the label's `for`. */
  readonly inputId: string;
  /** The identity line (`span.ia-pick-t`): the student's or the group's name. */
  readonly name: ReactNode;
  /** The line under it (`span.ia-pick-d`): "GIT-2026-0418 · ME ZG523 — Sem II", "7 members". */
  readonly detail?: ReactNode;
  /** Why the row can't be chosen, or what choosing it means (`span.ia-pick-why`). */
  readonly why?: ReactNode;
  readonly checked: boolean;
  /** Unavailable (`is-off`): the input is disabled and the reason says why. */
  readonly disabled?: boolean;
  readonly onChange: () => void;
}

export interface IaPickListProps {
  /** The list's name: "Students", "Groups", "Students who aren’t in this group". */
  readonly label: string;
  /** The list's id (an error summary's link target). */
  readonly id?: string;
  /** Checkboxes (students, members) or radios (one group). */
  readonly kind?: 'checkbox' | 'radio';
  /** The radios' group name. */
  readonly name?: string;
  readonly items: readonly IaPickItem[];
}

/**
 * Dense rows to choose students, a group or members (`ul.ia-pick` > `li` > `label.ia-pick-row`):
 * the input, the identity line and the line under it, and — on the right — why a row can't be
 * chosen. An unavailable row is muted and its input disabled (IA-05 step 2, IA-14 Add students).
 */
export function IaPickList({ label, id, kind = 'checkbox', name, items }: IaPickListProps) {
  return (
    <ul className="ia-pick" id={id} aria-label={label}>
      {items.map((item) => (
        <li key={item.key}>
          <label
            className={joinClasses('ia-pick-row', item.disabled && 'is-off')}
            htmlFor={item.inputId}
          >
            <input
              type={kind}
              name={kind === 'radio' ? name : undefined}
              id={item.inputId}
              checked={item.checked}
              disabled={item.disabled}
              onChange={item.onChange}
            />
            <span>
              <span className="ia-pick-t">{item.name}</span>
              {item.detail ? <span className="ia-pick-d">{item.detail}</span> : null}
            </span>
            {item.why ? <span className="ia-pick-why">{item.why}</span> : null}
          </label>
        </li>
      ))}
    </ul>
  );
}

export interface IaPickSearchProps {
  /** The input's id (`gv-q`, `gd-q`). */
  readonly id: string;
  /** "Search students". */
  readonly label: string;
  /** "Name or student ID". */
  readonly placeholder: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** The count beside it, announced (`p.rk-count[role=status]`): "2 students selected". */
  readonly count?: ReactNode;
}

/**
 * The search over a pick list (`div.rk-field.rk-search` with its label and `div.rk-inputwrap`).
 * With the selected count beside it (Give students access, step 2): `div.ia-row` aligned to the
 * field's foot (`rk-x-row-end`), the field growing from 320 px (`rk-x-search-grow`) and the count
 * 10 px over the line (`p.rk-count.rk-x-count-low[role=status]`). Alone (a group's add panel): the
 * field up to 420 px (`rk-x-search-panel`). The export's inline sizes, as V3P-16's classes.
 */
export function IaPickSearch({
  id,
  label,
  placeholder,
  value,
  onChange,
  count,
}: IaPickSearchProps) {
  const field = (
    <div
      className={joinClasses(
        'rk-field rk-search',
        count === undefined ? 'rk-x-search-panel' : 'rk-x-search-grow',
      )}
    >
      <label className="rk-label" htmlFor={id}>
        {label}
      </label>
      <div className="rk-inputwrap">
        <Glyph name="search" />
        <input
          id={id}
          className="rk-input"
          type="search"
          placeholder={placeholder}
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
  if (count === undefined) return field;
  return (
    <div className="ia-row rk-x-row-end">
      {field}
      <p className="rk-count rk-x-count-low" role="status">
        {count}
      </p>
    </div>
  );
}

// ---- Give students access, step 1 (`fieldset.rk-fieldset` > `label.rk-choice`) -------------------

/** One experiment held in the plan: a checkbox, its name and its formats from the plan. */
export interface IaExperimentChoice {
  readonly key: string;
  /** The input's id (`gv-e-…`). */
  readonly inputId: string;
  readonly name: ReactNode;
  readonly checked: boolean;
  readonly onChange: () => void;
  /**
   * "Available to your institution:" then the badges (`IaFormatBadges flush`), on one line 6 px by
   * 8 px apart (`span.rk-choice-d.ia-row.rk-x-row-tight`).
   */
  readonly detail: ReactNode;
}

/**
 * The experiments in the access plan to choose from (`fieldset.rk-fieldset` > `legend` with its
 * line + `div.rk-choices` > `label.rk-choice` with a checkbox): formats are shown, never chosen.
 */
export function IaExperimentChoices({
  id,
  legend,
  legendHint,
  choices,
}: {
  /** The fieldset's id (an error summary's link target). */
  readonly id: string;
  /** "Experiments in your access plan". */
  readonly legend: ReactNode;
  /** "Students get the formats your plan includes …". */
  readonly legendHint: ReactNode;
  readonly choices: readonly IaExperimentChoice[];
}) {
  return (
    <fieldset className="rk-fieldset" id={id}>
      <legend>
        {legend}
        <span>{legendHint}</span>
      </legend>
      <div className="rk-choices">
        {choices.map((choice) => (
          <label key={choice.key} className="rk-choice" htmlFor={choice.inputId}>
            <input
              type="checkbox"
              id={choice.inputId}
              checked={choice.checked}
              onChange={choice.onChange}
            />
            <span className="rk-choice-t">{choice.name}</span>
            <span className="rk-choice-d ia-row rk-x-row-tight">{choice.detail}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * The course's other published experiments, which can't be chosen (`div.ia-stack.ia-stack--tight`
 * > `p.rk-h3` + `ul.rk-choices` > `li.rk-choice.is-off`): each name and "Not in your access plan ·
 * published as" with its dashed badges. Each item one column, its line 6 px by 8 px apart — the
 * export's inline `grid-template-columns: minmax(0, 1fr)` and `gap` (`rk-x-choice-plain`,
 * `rk-x-row-tight`, V3P-16).
 */
export function IaNotInPlanList({
  heading,
  items,
}: {
  /** "Also published in ME ZG523 — not in your access plan". */
  readonly heading: ReactNode;
  readonly items: readonly {
    readonly key: string;
    readonly name: ReactNode;
    readonly detail: ReactNode;
  }[];
}) {
  return (
    <div className="ia-stack ia-stack--tight">
      <p className="rk-h3">{heading}</p>
      <ul className="rk-choices">
        {items.map((item) => (
          <li key={item.key} className="rk-choice is-off rk-x-choice-plain">
            <span className="rk-choice-t">{item.name}</span>
            <span className="rk-choice-d ia-row rk-x-row-tight">{item.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Badges and the words that go with them on one line, 6 px by 10 px apart (`span.ia-row
 * .rk-x-row-snug` > badges + `span`; IA-05's review "Formats").
 */
export function IaFormatsWith({
  badges,
  children,
}: {
  readonly badges: ReactNode;
  /** "Inherited from the access plan — not chosen here". */
  readonly children: ReactNode;
}) {
  return (
    <span className="ia-row rk-x-row-snug">
      {badges}
      <span>{children}</span>
    </span>
  );
}

/**
 * A titled part of a step (`div.ia-stack.ia-stack--tight` > `h2.rk-h3`): "What will be created"
 * and the lines under it.
 */
export function IaStepPart({
  title,
  children,
}: {
  readonly title: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className="ia-stack ia-stack--tight">
      <h2 className="rk-h3">{title}</h2>
      {children}
    </div>
  );
}

// ---- "Your selection" (`details.ia-selsum`, `aside.ia-gv-aside`) -------------------------------

export interface IaSelectionProps {
  /** "Your selection". */
  readonly title: string;
  /** Access plan, Experiments, Formats, Students or Group (`dl.ia-sum`). */
  readonly items: readonly IaSummaryItem[];
}

/**
 * The selection folded into one line under the step indicator (`details.ia-selsum`): shown only
 * below 860 px of page width, where the aside is hidden; it opens to the same facts.
 */
export function IaSelectionFold({
  title,
  line,
  items,
}: IaSelectionProps & {
  /** The one line: "1 experiment · 2 students", or "Nothing chosen yet". */
  readonly line: ReactNode;
}) {
  return (
    <details className="ia-selsum">
      <summary>
        <span className="ia-selsum-k">{title}</span>
        <span className="ia-selsum-v">{line}</span>
        <Glyph name="chevronDown" />
      </summary>
      <IaSummary items={items} />
    </details>
  );
}

/** The selection beside steps 1 and 2 (`section.rk-surface` > `div.ia-sbody`). */
export function IaSelectionPanel({
  title,
  items,
  titleId: givenId,
}: IaSelectionProps & {
  /** The heading's id (`gv-sum-h`): the section is named by it. */
  readonly titleId?: string;
}) {
  const generated = `${useId()}-sum`;
  const titleId = givenId ?? generated;
  return (
    <section className="rk-surface" aria-labelledby={titleId}>
      <div className="ia-sbody">
        <h2 className="rk-h3" id={titleId}>
          {title}
        </h2>
        <IaSummary items={items} />
      </div>
    </section>
  );
}

export interface IaGiveLayoutProps {
  /** The step's sheet (`div.rk-surface.rk-mainsheet`): sections and the action bar. */
  readonly children: ReactNode;
  /** The aside's name: "Your selection". */
  readonly asideLabel: string;
  /**
   * The aside's content: the selection beside steps 1 and 2; nothing beside the review and the
   * result (the aside stays, so the sheet keeps the steps' width).
   */
  readonly aside?: ReactNode;
}

/**
 * Give students access's frame (`div.rk-detailwrap` > `div.rk-detail`): the step's sheet and the
 * "Your selection" aside (`aside.rk-aside.ia-gv-aside`), hidden below 860 px of page width.
 */
export function IaGiveLayout({ children, asideLabel, aside }: IaGiveLayoutProps) {
  return (
    <div className="rk-detailwrap">
      <div className="rk-detail">
        <div className="rk-surface rk-mainsheet">{children}</div>
        <aside className="rk-aside ia-gv-aside" aria-label={asideLabel}>
          {aside}
        </aside>
      </div>
    </div>
  );
}

// ---- the review's group line and the result (`p.rk-next`, `li.rk-askrow`) ----------------------

/** A group grant about to be given (`p.rk-next`): "<b>Group …</b> → experiment → Active". */
export function IaGroupFlow({
  who,
  what,
  status,
}: {
  readonly who: ReactNode;
  readonly what: ReactNode;
  readonly status: ReactNode;
}) {
  return (
    <p className="rk-next">
      <b>{who}</b> → {what} → {status}
    </p>
  );
}

/** One given grant: who → what → its status, a note and a link. */
export interface IaGivenRow {
  readonly key: string;
  readonly who: ReactNode;
  readonly what: ReactNode;
  readonly status: { readonly tone: StatusTone; readonly words: ReactNode };
  /** "Rahul sees it in My courses with WEB and VR." */
  readonly note: ReactNode;
  /** "Open Rahul Verma", "Open the group". */
  readonly link?: { readonly label: ReactNode; readonly href: string };
}

/**
 * The result of Give access (`ul.ia-stack` > `li.rk-askrow`): each grant as "who → what →
 * status" (`p.ia-flow`), its note and a link to the student or the group.
 */
export function IaGivenList({
  rows,
  label,
}: {
  readonly rows: readonly IaGivenRow[];
  /**
   * The list's name (`aria-label`): "Access given" — the export draws the list unnamed under its
   * "Access given" notice; the product keeps the name its result list had, for screen readers.
   */
  readonly label?: string;
}) {
  const Link = useLinkComponent();
  return (
    <ul className="ia-stack ia-stack--tight" aria-label={label}>
      {rows.map((row) => (
        <li key={row.key} className="rk-askrow">
          <div className="ia-stack ia-stack--tight">
            <p className="ia-flow">
              <span className="rk-askrow-t">{row.who}</span>
              <span className="ia-arrow" aria-hidden="true">
                →
              </span>
              <span className="rk-strong">{row.what}</span>
              <span className="ia-arrow" aria-hidden="true">
                →
              </span>
              <StatusPill tone={row.status.tone}>{row.status.words}</StatusPill>
            </p>
            <p className="rk-next">{row.note}</p>
            {row.link ? (
              <p>
                <Link className="rb-link" href={row.link.href}>
                  {row.link.label}
                </Link>
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---- a group's grants (`ul.ia-items`) ---------------------------------------------------------

export interface IaGrantItem {
  readonly key: string;
  /** The experiment (`p.ia-item-t`). */
  readonly name: ReactNode;
  /** Its course code (`span.rk-code`). */
  readonly courseCode?: string | null;
  /** The formats from the plan: the badges (`span.rk-fmts[role=img]`), drawn by the caller. */
  readonly formats?: ReactNode;
  readonly status: { readonly tone: StatusTone; readonly words: ReactNode };
  /** "Given 12 Oct 2026". */
  readonly given: ReactNode;
}

/**
 * "Experiments given to this group" as items (`ul.ia-items` > `li.ia-item`): the experiment and
 * its course code, the formats, the grant's status and when it was given (IA-14).
 */
export function IaGrantItems({
  label,
  items,
}: {
  /** The list's name: "Experiments given to ME ZG523 — Sem II". */
  readonly label: string;
  readonly items: readonly IaGrantItem[];
}) {
  return (
    <ul className="ia-items" aria-label={label}>
      {items.map((item) => (
        <li key={item.key} className="ia-item">
          <p className="ia-item-t">
            {item.name}
            {item.courseCode ? <span className="rk-code">{item.courseCode}</span> : null}
          </p>
          {item.formats}
          <p className="ia-item-meta">
            <StatusPill tone={item.status.tone}>{item.status.words}</StatusPill>
            <span>{item.given}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}

// ---- a group's add panel (`section#gd-addpanel`) -----------------------------------------------

export interface IaAddPanelProps {
  /** The panel's id: the "Add students" toggle's `aria-controls`. */
  readonly id: string;
  /** The heading's id (the panel is named by it); the heading takes focus when the panel opens. */
  readonly titleId: string;
  /** "Add students to this group". */
  readonly title: ReactNode;
  /** The note, the search, the pick list and its states. */
  readonly children: ReactNode;
  /** The action bar (`IaActions`): Cancel and "Add 2 students". */
  readonly actions: ReactNode;
}

/**
 * The panel that opens under a group's head to add members (`section.rk-surface` >
 * `div.rk-sec.ia-stack.ia-stack--tight` > `h2.rb-h2`, then the action bar): the heading is a focus
 * target (`tabindex="-1"`) for when the panel opens.
 */
export function IaAddPanel({ id, titleId, title, children, actions }: IaAddPanelProps) {
  return (
    <section className="rk-surface" id={id} aria-labelledby={titleId}>
      <div className="rk-sec ia-stack ia-stack--tight">
        <h2 className="rb-h2" id={titleId} tabIndex={-1}>
          {title}
        </h2>
        {children}
      </div>
      {actions}
    </section>
  );
}
