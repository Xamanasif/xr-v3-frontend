'use client';

import type { ReactNode, Ref } from 'react';
import { useLayoutEffect, useRef } from 'react';

import type { FormatCode } from '../icons/registry.js';
import { joinClasses } from '../internal/classes.js';
import { followRowLink } from '../internal/row-link.js';
import { useLinkComponent } from '../link.js';
import { Button, type ButtonProps } from './actions.js';
import { CourseCode } from './codes.js';
import { Field, type FieldProps } from './fields.js';
import { FORMAT_ORDER, type FormatState } from './formats.js';
import { Glyph, type V3IconName } from './icons.js';
import { scrollCurrentIntoView } from './tabs.js';

/*
 * What more than one Institute Admin screen group draws (`ia-` classes; the owner-approved
 * Institute Admin export, design/v3-refined-b/roles/IA-v1, `project/ia-role.css` and its
 * COMPONENT-EXTENSIONS.md "Role patterns"): the export's format badges (`xr-fmts`), the list table
 * (`ia-lt`) and its cell parts (`ia-cell-*`), the grouped grants table (`ia-gt`) with the "How given"
 * and status cells, the surface sections (`ia-shead`, `ia-sbody`, `ia-sfoot`, `ia-empty-t`), the
 * record grid (`ia-rec`), the management surface with its counted segments (`ia-gm`), the step
 * indicator (`ia-steps`), the form column and action bar (`ia-form`, `ia-fgrid`, `ia-actions`, the
 * busy button, the fields the export sizes), the view switch and the small helpers (`ia-stack`,
 * `ia-row`, `ia-sum`, `ia-lines`, `ia-nowrap`, `ia-block`, `ia-wrap`). Markup as the export's
 * `Main.dc.html` draws them — its inline sizes as the central patch's product classes (V3P-16,
 * `rk-x-*`); every word, figure, date and
 * destination comes from the caller. What one screen group alone draws is in `ia-plan.tsx`,
 * `ia-access.tsx`, `ia-people.tsx` and `ia-requests.tsx`.
 */

// ---- Format badges --------------------------------------------------------------------------------

function inFormatOrder<Item extends { readonly format: FormatCode }>(
  items: readonly Item[],
): Item[] {
  const seen = new Set<FormatCode>();
  for (const { format } of items) {
    if (seen.has(format)) throw new Error(`Format ${format} is listed twice.`);
    seen.add(format);
  }
  return [...items].sort(
    (left, right) => FORMAT_ORDER.indexOf(left.format) - FORMAT_ORDER.indexOf(right.format),
  );
}

const FORMAT_STATE_CLASS: Readonly<Record<FormatState, string | null>> = {
  on: null,
  pub: 'xr-fmt--pub',
  none: 'xr-fmt--none',
};

export interface IaFormatCell {
  readonly format: FormatCode;
  /** `on` solid navy with a tick (in your plan), `pub` dashed (published, not in your plan), `none` grey. */
  readonly state: FormatState;
  /** The cell in words for screen readers (the script's `sr`): "WEB, Browser: In your plan". */
  readonly words: string;
}

export interface IaFormatListProps {
  /** The list's name (`ul[aria-label]`): "Formats of Shell-and-Tube Heat Exchanger". */
  readonly label: string;
  /** All four formats, each with its state (the script's `fmBadges`). */
  readonly cells: readonly IaFormatCell[];
  /**
   * `table` (IA-02, IA-03 experiment rows: each badge titled with its words) or `plan` (the IA-01
   * plan card, `ul.ia-plan-fmts`, untitled).
   */
  readonly variant?: 'table' | 'plan';
}

/**
 * Every format of an experiment with its state (`ul.xr-fmts` > `li.xr-fmt(--pub|--none)`: the
 * tick on a format in the plan, the code hidden from screen readers, the state in words).
 */
export function IaFormatList({ label, cells, variant = 'table' }: IaFormatListProps) {
  return (
    <ul className={joinClasses('xr-fmts', variant === 'plan' && 'ia-plan-fmts')} aria-label={label}>
      {inFormatOrder(cells).map((cell) => (
        <li
          key={cell.format}
          className={joinClasses('xr-fmt', FORMAT_STATE_CLASS[cell.state])}
          title={variant === 'table' ? cell.words : undefined}
        >
          {cell.state === 'on' ? <Glyph name="check" /> : null}
          <span aria-hidden="true">{cell.format}</span>
          <span className="xr-sr">{cell.words}</span>
        </li>
      ))}
    </ul>
  );
}

export interface IaFormatBadgesProps {
  readonly formats: readonly FormatCode[];
  /**
   * What the badges mean, read instead of the codes ("Formats from your plan: WEB, VR"): the group
   * becomes an image with this name and the codes are hidden. Without it the codes are read as
   * they stand (IA-05's choices: "Available to your institution: WEB VR").
   */
  readonly label?: string;
  /** `head`: a grouped table's group head (`span.xr-fmts`); `row` (default): `span.rk-fmts`. */
  readonly variant?: 'row' | 'head';
  /** `pub`: dashed, published but not in the plan (`xr-fmt--pub`); solid by default. */
  readonly state?: 'on' | 'pub';
  /**
   * No space above the badges where they share a line with words (`rk-x-fmts-flush`, V3P-14's
   * class, reused by V3P-16): the export's inline `margin-top: 0` on IA-05's choices and review and
   * IA-17's plan and request facts. Off by default.
   */
  readonly flush?: boolean;
}

/**
 * Small solid format badges (`span.rk-fmts[role=img][aria-label]` > `span.xr-fmt[aria-hidden]`),
 * as the export draws them — the kit `FormatBadges` names them with hidden text instead, which
 * the export does not draw.
 */
export function IaFormatBadges({
  formats,
  label,
  variant = 'row',
  state = 'on',
  flush = false,
}: IaFormatBadgesProps) {
  const ordered = inFormatOrder(formats.map((format) => ({ format })));
  return (
    <span
      className={
        variant === 'head' ? 'xr-fmts' : joinClasses('rk-fmts', flush && 'rk-x-fmts-flush')
      }
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {ordered.map(({ format }) => (
        <span
          key={format}
          className={joinClasses('xr-fmt', state === 'pub' && 'xr-fmt--pub')}
          aria-hidden={label ? 'true' : undefined}
        >
          {format}
        </span>
      ))}
    </span>
  );
}

// ---- Cell parts -----------------------------------------------------------------------------------

/** A list cell's text part (COMPONENT-EXTENSIONS "Cell parts"). */
export type IaCellKind =
  /** `span.ia-cell-sub`: the grey line under a name ("GIT-2026-0418", "9 Oct 2026"). */
  | 'sub'
  /** `span.ia-cell-t`: a value ("Individually", "ME ZG523 — Sem II"). */
  | 'text'
  /** `span.ia-cell-title`: a strong title (an experiment's name in a student's list). */
  | 'title'
  /** `span.ia-cell-note`: the reason under a status ("Withdrawn 12 Oct 2026 · Left the course"). */
  | 'note'
  /** `span.ia-cell-also`: the tinted "Also in …" note. */
  | 'also'
  /** `span.ia-cell-muted`: "None yet", "No courses yet". */
  | 'muted'
  /** `span.ia-lt-numv`: a figure in a numbers column. */
  | 'number';

const CELL_CLASS: Readonly<Record<IaCellKind, string>> = {
  sub: 'ia-cell-sub',
  text: 'ia-cell-t',
  title: 'ia-cell-title',
  note: 'ia-cell-note',
  also: 'ia-cell-also',
  muted: 'ia-cell-muted',
  number: 'ia-lt-numv',
};

export interface IaCellTextProps {
  readonly kind: IaCellKind;
  readonly children: ReactNode;
  /** `ia-nowrap`: an ID that never breaks at its hyphens. */
  readonly nowrap?: boolean;
  /** `ia-inline`: a value that runs on after its inline label on phones ("Last change 12 Oct"). */
  readonly inline?: boolean;
  /** The full text as a tooltip where the cell may cut it short (an e-mail). */
  readonly title?: string;
}

/** A text part of a list cell (`span.ia-cell-*`). */
export function IaCellText({ kind, children, nowrap, inline, title }: IaCellTextProps) {
  return (
    <span
      className={joinClasses(CELL_CLASS[kind], nowrap && 'ia-nowrap', inline && 'ia-inline')}
      title={title}
    >
      {children}
    </span>
  );
}

export interface IaCellLineProps {
  readonly children: ReactNode;
  /** `courses` (`ia-cell-courses`: code chips) or `exp` (`ia-cell-exp`: experiment and badges). */
  readonly kind?: 'courses' | 'exp';
  /** `ia-gap-xs`: 6 px under the title above it. */
  readonly gap?: boolean;
}

/** A line of chips or badges in a cell (`span.ia-cell-line`). */
export function IaCellLine({ children, kind, gap }: IaCellLineProps) {
  return (
    <span
      className={joinClasses(
        'ia-cell-line',
        kind === 'courses' && 'ia-cell-courses',
        kind === 'exp' && 'ia-cell-exp',
        gap && 'ia-gap-xs',
      )}
    >
      {children}
    </span>
  );
}

export interface IaRowLinkProps {
  readonly href: string;
  /** The link's words: the person's or the record's name. */
  readonly children: ReactNode;
  /** The accessible name where the words alone are not enough ("Open student record: Rahul Verma"). */
  readonly label?: string;
}

/**
 * A row's name link (`a.rk-rowlink.ia-cell-name`). In a list table row marked `link`, a press
 * anywhere on the row follows it.
 */
export function IaRowLink({ href, children, label }: IaRowLinkProps) {
  const Link = useLinkComponent();
  return (
    <Link className="rk-rowlink ia-cell-name" href={href} aria-label={label}>
      {children}
    </Link>
  );
}

// ---- List table -----------------------------------------------------------------------------------

/**
 * The list's kind (`ia-lt--…`): the column widths the role sheet sets for it, and `stats` for
 * figures three across on phones.
 */
export type IaListVariant =
  'fac' | 'fc' | 'grp' | 'gm' | 'sr' | 'fr' | 'rq' | 'dv' | 'imp' | 'hp' | 'stats';

export interface IaListColumn {
  readonly key: string;
  /** The column's head ("Faculty member"); a hidden one ("Action") is read only. */
  readonly header: ReactNode;
  readonly hidden?: boolean;
  /** `ia-lt-num`: a numbers column (its head right-aligned too). */
  readonly numeric?: boolean;
}

export interface IaListCell {
  readonly key: string;
  /**
   * The cell's place in the row (`ia-lt-main` the identity, `ia-lt-pri` the status first on
   * phones, `ia-lt-act` the row's one action, `ia-lt-num` a figure, `ia-lt-stat` a figure line),
   * then the list's own column classes (`ia-fac-who`, `ia-rq-when`, …).
   */
  readonly role?: 'main' | 'pri' | 'act' | 'num' | 'stat';
  readonly className?: string;
  /** The label phones show before the value (`span.ia-lt-lab`): "Courses taught". */
  readonly label?: ReactNode;
  readonly children?: ReactNode;
}

export interface IaListRow {
  readonly key: string;
  readonly cells: readonly IaListCell[];
  /** `tr.is-link`: a press anywhere on the row follows its name link (`IaRowLink`). */
  readonly link?: boolean;
  /** `tr.is-muted`: a row that no longer counts (a withdrawn grant). */
  readonly muted?: boolean;
}

export interface IaListTableProps {
  readonly variant?: IaListVariant;
  /** The table's name (a visually hidden caption). */
  readonly caption: ReactNode;
  readonly columns: readonly IaListColumn[];
  readonly rows: readonly IaListRow[];
}

const CELL_ROLE_CLASS = {
  main: 'ia-lt-main',
  pri: 'ia-lt-pri',
  act: 'ia-lt-act',
  num: 'ia-lt-num',
  stat: 'ia-lt-stat',
} as const;

/**
 * The one table language for the role's lists that are not grouped (`div.ia-ltwrap` >
 * `table.ia-lt`; COMPONENT-EXTENSIONS "List table"): a hidden caption, the head on its tint, the
 * cells on the 22 px edge, whole-row links, muted rows. Below 640 px of table width each row is a
 * short block, so the table keeps its semantics with explicit table roles (ADR-0010).
 */
export function IaListTable({ variant, caption, columns, rows }: IaListTableProps) {
  return (
    <div className="ia-ltwrap">
      <table className={joinClasses('ia-lt', variant && `ia-lt--${variant}`)} role="table">
        <caption>{caption}</caption>
        <thead role="rowgroup">
          <tr role="row">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                role="columnheader"
                className={column.numeric ? 'ia-lt-num' : undefined}
              >
                {column.hidden ? <span className="xr-sr">{column.header}</span> : column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((row) => (
            <tr
              key={row.key}
              role="row"
              className={joinClasses(row.link && 'is-link', row.muted && 'is-muted') || undefined}
              onClick={row.link ? followRowLink : undefined}
            >
              {row.cells.map((cell) => (
                <td
                  key={cell.key}
                  role="cell"
                  className={
                    joinClasses(cell.role && CELL_ROLE_CLASS[cell.role], cell.className) ||
                    undefined
                  }
                >
                  {cell.label ? <span className="ia-lt-lab">{cell.label}</span> : null}
                  {cell.children}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Grant cells ----------------------------------------------------------------------------------

export type IaHow =
  /** "Individually". */
  | { readonly kind: 'individual'; readonly words: ReactNode }
  /** Through a group: its name, a link to the group's page. */
  | { readonly kind: 'group'; readonly words: ReactNode; readonly href: string };

export interface IaGrantHowProps {
  readonly how: IaHow;
  /** When it was given: "9 Oct 2026". */
  readonly date: ReactNode;
  /** The tinted note when another grant also gives it ("Also in the group ME ZG523 — Sem II"). */
  readonly also?: ReactNode;
}

/**
 * A grant's "How given" cell content (IA-03, IA-04 `td.ia-gt-how`; IA-07 `td.ia-sr-how`):
 * individually or through a group (a link), the date, and the "Also in …" note.
 */
export function IaGrantHow({ how, date, also }: IaGrantHowProps) {
  const Link = useLinkComponent();
  return (
    <>
      <span className="ia-cell-t">
        {how.kind === 'group' ? <Link href={how.href}>{how.words}</Link> : how.words}
      </span>
      <span className="ia-cell-sub">{date}</span>
      {also ? <span className="ia-cell-also">{also}</span> : null}
    </>
  );
}

/** A status cell's content: the status pill, then each note under it (`span.ia-cell-note`). */
export function IaStatusNotes({
  status,
  notes = [],
}: {
  /** The status (`StatusPill`). */
  readonly status: ReactNode;
  /** The reasons in words: "Withdrawn 12 Oct 2026 · Left the course", "Waiting for a licence …". */
  readonly notes?: readonly ReactNode[];
}) {
  return (
    <>
      {status}
      {notes.map((note, index) => (
        <span key={index} className="ia-cell-note">
          {note}
        </span>
      ))}
    </>
  );
}

// ---- Grouped table --------------------------------------------------------------------------------

export interface IaGroupedRow {
  readonly key: string;
  /** The student's name, a link to their record. */
  readonly name: ReactNode;
  readonly href: string;
  /** The link's accessible name where the name alone is not enough. */
  readonly linkLabel?: string;
  /** Under the name, never broken (`span.ia-cell-sub.ia-nowrap`): the institution student ID. */
  readonly sub: ReactNode;
  /** `IaGrantHow`. */
  readonly how: ReactNode;
  /** `IaStatusNotes`. */
  readonly status: ReactNode;
  /** The row's action ("Withdraw…"); none in a read-only table. */
  readonly action?: ReactNode;
  /** `is-muted`: a withdrawn grant. */
  readonly muted?: boolean;
}

export interface IaGroupedGroup {
  readonly key: string;
  /** The experiment's name (`span.ia-gt-gt`). */
  readonly title: ReactNode;
  /** Its course code (`span.rk-code`). */
  readonly code: string;
  /** Its formats from the plan (`span.xr-fmts[role=img]`), named by `formatsLabel`. */
  readonly formats: readonly FormatCode[];
  readonly formatsLabel: string;
  /** How many rows ("6 students", `span.ia-gt-gn`). */
  readonly count: ReactNode;
  readonly rows: readonly IaGroupedRow[];
}

export interface IaGroupedHeaders {
  readonly who: ReactNode;
  readonly how: ReactNode;
  readonly status: ReactNode;
  /** The action column's hidden head ("Action"); left out of a read-only table. */
  readonly action?: ReactNode;
}

export interface IaGroupedTableProps {
  readonly caption: ReactNode;
  readonly headers: IaGroupedHeaders;
  readonly groups: readonly IaGroupedGroup[];
  /** `ia-gt--ro`: the plan's read-only version, without the action column (IA-03). */
  readonly readOnly?: boolean;
}

/**
 * Grants grouped by experiment (`table.ia-gt`; COMPONENT-EXTENSIONS "Grouped table"): one
 * `tbody` per experiment with its head row (title, course code, formats, count), one row per
 * student (who, how given, status with its reason, action). Phones stack each row (who and
 * action, status, how given), so the table carries explicit table roles (ADR-0010).
 */
export function IaGroupedTable({
  caption,
  headers,
  groups,
  readOnly = false,
}: IaGroupedTableProps) {
  const Link = useLinkComponent();
  const span = readOnly ? 3 : 4;
  return (
    <table className={joinClasses('ia-gt', readOnly && 'ia-gt--ro')} role="table">
      <caption>{caption}</caption>
      <thead role="rowgroup">
        <tr role="row">
          <th scope="col" role="columnheader">
            {headers.who}
          </th>
          <th scope="col" role="columnheader">
            {headers.how}
          </th>
          <th scope="col" role="columnheader">
            {headers.status}
          </th>
          {readOnly ? null : (
            <th scope="col" role="columnheader">
              <span className="xr-sr">{headers.action}</span>
            </th>
          )}
        </tr>
      </thead>
      {groups.map((group) => (
        <tbody key={group.key} role="rowgroup">
          <tr className="ia-gt-grp" role="row">
            <th colSpan={span} scope="rowgroup" role="rowheader">
              <div className="ia-gt-gh">
                <span className="ia-gt-gt">{group.title}</span>
                <CourseCode code={group.code} />
                <IaFormatBadges formats={group.formats} label={group.formatsLabel} variant="head" />
                <span className="ia-gt-gn">{group.count}</span>
              </div>
            </th>
          </tr>
          {group.rows.map((row) => (
            <tr
              key={row.key}
              className={joinClasses('ia-gt-row', row.muted && 'is-muted')}
              role="row"
            >
              <td className="ia-gt-who" role="cell">
                <Link
                  className="rk-rowlink ia-cell-name"
                  href={row.href}
                  aria-label={row.linkLabel}
                >
                  {row.name}
                </Link>
                <span className="ia-cell-sub ia-nowrap">{row.sub}</span>
              </td>
              <td className="ia-gt-how" role="cell">
                {row.how}
              </td>
              <td className="ia-gt-st" role="cell">
                {row.status}
              </td>
              {readOnly ? null : (
                <td className="ia-gt-act" role="cell">
                  {row.action}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      ))}
    </table>
  );
}

// ---- Surface sections -----------------------------------------------------------------------------

export interface IaSectionHeadProps {
  readonly title: ReactNode;
  readonly titleId?: string;
  /** `section` (`h2.rb-h2`, default) or `minor` (`h2.rk-h3`). */
  readonly size?: 'section' | 'minor';
  /** The line under the title (`p.ia-shead-sub`): "ME ZG523 · access plan …". */
  readonly sub?: ReactNode;
  /** `ia-shead--line`: a rule above too, where the head sits mid-surface (Import's errors). */
  readonly line?: boolean;
  /** What sits at the row's end: a count (`IaSectionCount`), a link, a key. */
  readonly aside?: ReactNode;
}

/**
 * A surface's heading row on the 22 px edge (`div.ia-shead`): the title (with its sub line), and
 * a count, a link or a key at the end.
 */
export function IaSectionHead({
  title,
  titleId,
  size = 'section',
  sub,
  line = false,
  aside,
}: IaSectionHeadProps) {
  const heading = (
    <h2 className={size === 'minor' ? 'rk-h3' : 'rb-h2'} id={titleId}>
      {title}
    </h2>
  );
  return (
    <div className={joinClasses('ia-shead', line && 'ia-shead--line')}>
      {sub ? (
        <div>
          {heading}
          <p className="ia-shead-sub">{sub}</p>
        </div>
      ) : (
        heading
      )}
      {aside}
    </div>
  );
}

/** The count or note at a heading row's end (`p.ia-shead-n`); `emphasis` for a key figure. */
export function IaSectionCount({
  children,
  emphasis = false,
}: {
  readonly children: ReactNode;
  readonly emphasis?: boolean;
}) {
  return <p className={joinClasses('ia-shead-n', emphasis && 'ia-shead-key')}>{children}</p>;
}

export interface IaSectionBodyProps {
  /** The body's heading (`h2.rk-h3`, or `h2.rb-h2` when `size="section"`). */
  readonly title?: ReactNode;
  readonly titleId?: string;
  readonly size?: 'section' | 'minor';
  readonly children: ReactNode;
}

/** A surface's body on the 22 px edge (`div.ia-sbody`), with its heading. */
export function IaSectionBody({ title, titleId, size = 'minor', children }: IaSectionBodyProps) {
  return (
    <div className="ia-sbody">
      {title ? (
        <h2 className={size === 'section' ? 'rb-h2' : 'rk-h3'} id={titleId}>
          {title}
        </h2>
      ) : null}
      {children}
    </div>
  );
}

/** A surface's footnote (`p.ia-sfoot`): "Formats come from your access plan; …". */
export function IaSectionFoot({ children }: { readonly children: ReactNode }) {
  return <p className="ia-sfoot">{children}</p>;
}

/** The title of a small empty body (`p.ia-empty-t`): "Nothing given to this group yet". */
export function IaEmptyTitle({ children }: { readonly children: ReactNode }) {
  return <p className="ia-empty-t">{children}</p>;
}

// ---- Record grid ----------------------------------------------------------------------------------

export interface IaRecordGridProps {
  /** The record's main column (`div.ia-rec-main`). */
  readonly main: ReactNode;
  /** The summary column (`div.ia-rec-side`, 340–384 px). */
  readonly side: ReactNode;
  /** What follows below the main column (`div.ia-rec-more`): the history. */
  readonly more?: ReactNode;
  /**
   * `sidefirst`: the summary before the main column on narrow pages (a group's grants); `wide`:
   * the panel beside the table only from 1,060 px of content (Faculty courses).
   */
  readonly variant?: 'sidefirst' | 'wide';
}

/**
 * A record page's grid (`div.ia-rec` > `div.ia-rec-grid`; COMPONENT-EXTENSIONS "Record grid"):
 * main, a summary column, and what follows; below 860 px of page width main → summary → more.
 */
export function IaRecordGrid({ main, side, more, variant }: IaRecordGridProps) {
  return (
    <div className="ia-rec">
      <div className={joinClasses('ia-rec-grid', variant && `ia-rec-grid--${variant}`)}>
        <div className="ia-rec-main">{main}</div>
        <div className="ia-rec-side">{side}</div>
        {more ? <div className="ia-rec-more">{more}</div> : null}
      </div>
    </div>
  );
}

// ---- Management surface ---------------------------------------------------------------------------

export interface IaManageSurfaceProps {
  /** The id of the surface's heading. */
  readonly labelledBy: string;
  /**
   * The surface's name, read only (`h2.xr-sr`): "Students", "Student access — one row per student
   * and experiment". Leave it out where a visible heading row (`IaSectionHead`) names it.
   */
  readonly hiddenTitle?: ReactNode;
  readonly children: ReactNode;
  /** While the list loads (`aria-busy`). */
  readonly busy?: boolean;
}

/**
 * A list's management surface (`section.rk-surface.ia-gm`; COMPONENT-EXTENSIONS "Management
 * surface"): its tools, the live line, the list and its states, the footnote.
 */
export function IaManageSurface({ labelledBy, hiddenTitle, children, busy }: IaManageSurfaceProps) {
  return (
    <section
      className="rk-surface ia-gm"
      aria-labelledby={labelledBy}
      aria-busy={busy || undefined}
    >
      {hiddenTitle ? (
        <h2 className="xr-sr" id={labelledBy}>
          {hiddenTitle}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

/** The tools above a list (`div.ia-gm-tools`): the filter row, the segments, the status line. */
export function IaManageTools({ children }: { readonly children: ReactNode }) {
  return <div className="ia-gm-tools">{children}</div>;
}

/** The filter row (`div.ia-gm-row[role=search]`): "Filter students". */
export function IaManageFilters({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="ia-gm-row" role="search" aria-label={label}>
      {children}
    </div>
  );
}

export interface IaManageSearchProps {
  readonly id: string;
  /** The field's name, read only (`label.xr-sr`): "Search students". */
  readonly label: string;
  readonly placeholder: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly inputRef?: Ref<HTMLInputElement>;
}

/** The list's search (`div.rk-field.ia-gm-search` > hidden label + `div.rk-inputwrap`). */
export function IaManageSearch({
  id,
  label,
  placeholder,
  value,
  onChange,
  inputRef,
}: IaManageSearchProps) {
  return (
    <div className="rk-field ia-gm-search">
      <label className="xr-sr" htmlFor={id}>
        {label}
      </label>
      <div className="rk-inputwrap">
        <Glyph name="search" />
        <input
          ref={inputRef}
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
}

export interface IaManageSelectProps {
  readonly id: string;
  /** The field's name, read only (`label.xr-sr`): "Group", "How given". */
  readonly label: string;
  readonly value: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly onChange: (value: string) => void;
}

/** The list's one supporting select (`div.rk-field.ia-gm-sel` > hidden label + `div.rk-selwrap`). */
export function IaManageSelect({ id, label, value, options, onChange }: IaManageSelectProps) {
  return (
    <div className="rk-field ia-gm-sel">
      <label className="xr-sr" htmlFor={id}>
        {label}
      </label>
      <div className="rk-selwrap">
        <select
          id={id}
          className="rk-select"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Glyph name="chevronDown" />
      </div>
    </div>
  );
}

/** The count beside the search where there is no switch (`p.ia-gm-count[role=status]`). */
export function IaManageCount({ children }: { readonly children: ReactNode }) {
  return (
    <p className="ia-gm-count" role="status">
      {children}
    </p>
  );
}

export interface IaSegment<Key extends string> {
  readonly key: Key;
  readonly label: ReactNode;
  readonly count: number;
}

export interface IaSegmentsProps<Key extends string> {
  /** The group's name: "Show students by status". */
  readonly label: string;
  readonly segments: readonly IaSegment<Key>[];
  readonly value: Key;
  readonly onChange: (key: Key) => void;
}

/**
 * The status switch with counts (`div.rb-switch.ia-gm-segs[role=group]` > `button[aria-pressed]`
 * with its count in `b`). On phones, where it scrolls sideways, the pressed status is scrolled
 * into sight, 16 px from the start.
 */
export function IaSegments<Key extends string>({
  label,
  segments,
  value,
  onChange,
}: IaSegmentsProps<Key>) {
  const groupRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    scrollCurrentIntoView(groupRef.current, '[aria-pressed="true"]');
  }, [value]);
  return (
    <div ref={groupRef} className="rb-switch ia-gm-segs" role="group" aria-label={label}>
      {segments.map((segment) => (
        <button
          key={segment.key}
          type="button"
          aria-pressed={segment.key === value}
          onClick={() => onChange(segment.key)}
        >
          {segment.label}
          {/* A space the flex layout does not draw: the name reads "Current 12", not "Current12". */}{' '}
          <b>{segment.count}</b>
        </button>
      ))}
    </div>
  );
}

export interface IaFilterChip {
  readonly key: string;
  /** "Search: “rahul”", "Group: ME ZG523 — Sem II". */
  readonly label: ReactNode;
  /** The remove button's name: "Remove filter Search: “rahul”". */
  readonly removeLabel: string;
  readonly onRemove: () => void;
  /** The control that set the filter, focused once the chip goes (the search, the select). */
  readonly focusId: string;
}

export interface IaManageStatusProps {
  /** "Showing 3 of 12" (`p.ia-gm-shown`); left out where the count is beside the search. */
  readonly shown?: ReactNode;
  readonly chips: readonly IaFilterChip[];
  /** "Clear filters" (`button.rk-clear`). */
  readonly clearLabel: string;
  readonly onClear: () => void;
  /** The control focused after "Clear filters": the search. */
  readonly clearFocusId: string;
}

/**
 * The applied filters (`div.ia-gm-status`): how many rows show, one chip per filter, and "Clear
 * filters" — drawn only while a filter applies (the export's `hasChips`). Focus never falls to the
 * page: removing a chip focuses the control that set it, clearing focuses the search, as the
 * export does.
 */
export function IaManageStatus({
  shown,
  chips,
  clearLabel,
  onClear,
  clearFocusId,
}: IaManageStatusProps) {
  const focus = (id: string) => document.getElementById(id)?.focus();
  return (
    <div className="ia-gm-status">
      {shown === undefined ? null : <p className="ia-gm-shown">{shown}</p>}
      {chips.map((chip) => (
        <span key={chip.key} className="rk-chip">
          {chip.label}
          <button
            type="button"
            aria-label={chip.removeLabel}
            onClick={() => {
              chip.onRemove();
              focus(chip.focusId);
            }}
          >
            <Glyph name="close" />
          </button>
        </span>
      ))}
      <button
        type="button"
        className="rk-clear"
        onClick={() => {
          onClear();
          focus(clearFocusId);
        }}
      >
        {clearLabel}
      </button>
    </div>
  );
}

/** The list's footnote (`p.ia-gm-foot`): "Group grants are changed on the group’s page. …". */
export function IaManageFoot({ children }: { readonly children: ReactNode }) {
  return <p className="ia-gm-foot">{children}</p>;
}

/** The change in a few words, announced (`p.xr-sr[role=status]`): "5 rows shown". */
export function IaLiveLine({ children }: { readonly children: ReactNode }) {
  return (
    <p className="xr-sr" role="status">
      {children}
    </p>
  );
}

// ---- Step indicator -------------------------------------------------------------------------------

export interface IaStepsProps {
  /** The list's name: "Steps". */
  readonly label: string;
  /** Each step's words, in order: "Experiments", "Students", "Review and give access". */
  readonly steps: readonly { readonly key: string; readonly label: ReactNode }[];
  /** The current step, from 1. */
  readonly current: number;
  /** After a done step's and the current step's words, read only: ", done", ", current step". */
  readonly stateWords: { readonly done: string; readonly current: string };
}

/**
 * Where a guided task is (`ol.ia-steps` > `li.ia-step(.is-done|.is-current)`; IA-05, IA-11): done
 * steps navy with a tick, the current one tinted, later ones neutral; number and words, never
 * colour alone. Phones keep each number and only the current step's words.
 */
export function IaSteps({ label, steps, current, stateWords }: IaStepsProps) {
  return (
    <ol className="ia-steps" aria-label={label}>
      {steps.map((step, index) => {
        const number = index + 1;
        const done = number < current;
        const now = number === current;
        return (
          <li
            key={step.key}
            className={joinClasses('ia-step', done && 'is-done', now && 'is-current')}
            aria-current={now ? 'step' : undefined}
          >
            <span className="ia-step-n" aria-hidden="true">
              {done ? <Glyph name="check" /> : number}
            </span>
            <span className="ia-step-l">
              {step.label}
              <span className="xr-sr">
                {done ? stateWords.done : now ? stateWords.current : ''}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// ---- Form column and action bar -------------------------------------------------------------------

export interface IaFormSurfaceProps {
  /** The id of what names the form: the page's H1 (`ia-h1`), or the result's title. */
  readonly labelledBy: string;
  /** The form's body (`div.rk-sec.ia-stack`): error summary, notices, fieldsets. */
  readonly children: ReactNode;
  /** The action bar under it (`IaActions`). */
  readonly actions: ReactNode;
}

/**
 * A readable form column (`section.rk-surface.ia-form`, max 860 px; COMPONENT-EXTENSIONS "Form
 * column"): the body, then the action bar.
 */
export function IaFormSurface({ labelledBy, children, actions }: IaFormSurfaceProps) {
  return (
    <section className="rk-surface ia-form" aria-labelledby={labelledBy}>
      <div className="rk-sec ia-stack">{children}</div>
      {actions}
    </section>
  );
}

/** Fields in a grid (`div.ia-fgrid`); `two`: two per row from 640 px of form (`ia-fgrid--2`). */
export function IaFieldGrid({
  two = false,
  children,
}: {
  readonly two?: boolean;
  readonly children: ReactNode;
}) {
  return <div className={joinClasses('ia-fgrid', two && 'ia-fgrid--2')}>{children}</div>;
}

/**
 * The action bar (`div.ia-actions`): Cancel / Back, then the step's one primary, at the end;
 * `start` for a result's next steps (`ia-actions--start`). Full-width 46 px buttons on phones.
 */
export function IaActions({
  start = false,
  children,
}: {
  readonly start?: boolean;
  readonly children: ReactNode;
}) {
  return <div className={joinClasses('ia-actions', start && 'ia-actions--start')}>{children}</div>;
}

/** A field the export sizes inline (V3P-16): IA-05's Course select, IA-17's licences count. */
const FIELD_WIDTH_CLASS = {
  /** `max-width: 520px` (`rk-x-field-select`): IA-05 step 1 "Course". */
  select: 'rk-x-field-select',
  /** `max-width: 320px` (`rk-x-field-count`): IA-17 "Licences requested". */
  count: 'rk-x-field-count',
} as const;

export type IaFieldProps = Omit<FieldProps, 'className'> & {
  readonly width: keyof typeof FIELD_WIDTH_CLASS;
};

/** The kit `Field` at the width the export gives it (`div.rk-field.rk-x-field-*`). */
export function IaField({ width, ...field }: IaFieldProps) {
  return <Field {...field} className={FIELD_WIDTH_CLASS[width]} />;
}

export type IaBusyButtonProps = Omit<ButtonProps, 'className' | 'spinner'>;

/**
 * A button that runs a command and shows it (`ia-btn--busy` while busy: the progress cursor and
 * the faded look, `aria-disabled`, the press ignored, the working words — "Adding…").
 */
export function IaBusyButton({ busy = false, ...rest }: IaBusyButtonProps) {
  return <Button {...rest} busy={busy} className={busy ? 'ia-btn--busy' : undefined} />;
}

// ---- View switch ----------------------------------------------------------------------------------

export interface IaViewSwitchProps<Key extends string> {
  /** The group's name: "View usage", "Give access to". */
  readonly label: string;
  readonly options: readonly { readonly key: Key; readonly label: ReactNode }[];
  readonly value: Key;
  readonly onChange: (key: Key) => void;
}

/**
 * A view switch without counts (`div.rb-switchbar` > `div.rb-switch[role=group]` >
 * `button[aria-pressed]`) — the kit's `CategorySwitch` without counts: IA-20 "By experiment and
 * format · By course", IA-05 step 2 "Students · A group".
 */
export function IaViewSwitch<Key extends string>({
  label,
  options,
  value,
  onChange,
}: IaViewSwitchProps<Key>) {
  return (
    <div className="rb-switchbar">
      <div className="rb-switch" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={option.key === value}
            onClick={() => onChange(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- Helpers --------------------------------------------------------------------------------------

export interface IaStackProps {
  readonly children: ReactNode;
  /** 12 px apart instead of 20 (`ia-stack--tight`). */
  readonly tight?: boolean;
  /** A surface section's padding too (`rk-sec`). */
  readonly sec?: boolean;
  /** `section` (named by `labelledBy`), `ul` (a list of stacked items) or `div`. */
  readonly as?: 'div' | 'section' | 'ul';
  readonly labelledBy?: string;
}

/** Things stacked with the role's gaps (`ia-stack`, `ia-stack--tight`). */
export function IaStack({
  children,
  tight = false,
  sec = false,
  as = 'div',
  labelledBy,
}: IaStackProps) {
  const className = joinClasses(sec && 'rk-sec', 'ia-stack', tight && 'ia-stack--tight');
  if (as === 'section') {
    return (
      <section className={className} aria-labelledby={labelledBy}>
        {children}
      </section>
    );
  }
  if (as === 'ul') return <ul className={className}>{children}</ul>;
  return <div className={className}>{children}</div>;
}

/**
 * Things side by side, wrapping (`div.ia-row`): a message's buttons; `center` for the buttons of
 * a centred empty state (IA-05 "No students yet": the export's inline `justify-content: center`,
 * `rk-x-row-center`, V3P-16).
 */
export function IaRow({
  children,
  center = false,
}: {
  readonly children: ReactNode;
  readonly center?: boolean;
}) {
  return <div className={joinClasses('ia-row', center && 'rk-x-row-center')}>{children}</div>;
}

export interface IaSummaryItem {
  readonly key: string;
  readonly term: ReactNode;
  readonly children: ReactNode;
}

/**
 * A short summary (`dl.ia-sum`, each pair in a `div`): "Course · Group · Programme · Added";
 * `definitions` for longer explanations in plain weight (`ia-sum--defs`).
 */
export function IaSummary({
  items,
  definitions = false,
}: {
  readonly items: readonly IaSummaryItem[];
  readonly definitions?: boolean;
}) {
  return (
    <dl className={joinClasses('ia-sum', definitions && 'ia-sum--defs')}>
      {items.map((item) => (
        <div key={item.key}>
          <dt>{item.term}</dt>
          <dd>{item.children}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A line's tone in `ia-lines`: its glyph's colour and its default glyph. */
export type IaLineTone = 'ok' | 'wait' | 'info' | 'off';

const LINE_ICON: Readonly<Record<IaLineTone, V3IconName>> = {
  ok: 'check',
  wait: 'clock',
  info: 'infoNote',
  off: 'ended',
};

export interface IaLineItem {
  readonly key: string;
  readonly tone: IaLineTone;
  readonly children: ReactNode;
  /** Another glyph than the tone's own (the course-codes explainer's lock, people, file). */
  readonly icon?: V3IconName;
}

/** Outcome or explainer lines with their glyphs (`ul.ia-lines` > `li.is-{tone}`). */
export function IaLines({ lines }: { readonly lines: readonly IaLineItem[] }) {
  return (
    <ul className="ia-lines">
      {lines.map((line) => (
        <li key={line.key} className={`is-${line.tone}`}>
          <Glyph name={line.icon ?? LINE_ICON[line.tone]} />
          <span>{line.children}</span>
        </li>
      ))}
    </ul>
  );
}

/** Words that never break at their hyphens (`span.ia-nowrap`): an ID, "GIT-2026-0418". */
export function IaNoWrap({ children }: { readonly children: ReactNode }) {
  return <span className="ia-nowrap">{children}</span>;
}

/** One item per line inside a value (`span.ia-block`): each of a student's groups. */
export function IaBlock({ children }: { readonly children: ReactNode }) {
  return <span className="ia-block">{children}</span>;
}

/**
 * A link whose words may wrap inside a value (`a.rb-link.ia-wrap`): a group's name in the student
 * record's "About" (IA-07), one per `IaBlock`.
 */
export function IaWrapLink({
  href,
  children,
}: {
  readonly href: string;
  readonly children: ReactNode;
}) {
  const Link = useLinkComponent();
  return (
    <Link className="rb-link ia-wrap" href={href}>
      {children}
    </Link>
  );
}

export interface IaMessageCardProps {
  /** The page's H1 (`h1.rb-h2#ia-h1[tabindex=-1]`): "This student isn’t in People". */
  readonly title: ReactNode;
  /** What to do now (`p.rk-next`). */
  readonly children: ReactNode;
  /** The way on (`div.ia-row`): "Back to Students", Help. */
  readonly actions: ReactNode;
  /** The state's glyph above the title (`span.rk-state-ico`): `pauseCircle` while paused. */
  readonly icon?: V3IconName;
  /** The H1's id (the surface is named by it). */
  readonly titleId?: string;
}

/**
 * A page that cannot show its record or task (`section.rk-surface` > `div.rk-sec.ia-stack
 * .ia-stack--tight`): refused while paused, the plan ended, nothing to review, a request sent. The
 * export caps the surface at 760 px and sets the glyph's margin with inline styles: the central
 * patch's `rk-x-surface-msg` and `rk-x-state-ico-flush` (V3P-16).
 */
export function IaMessageCard({
  title,
  children,
  actions,
  icon,
  titleId = 'ia-h1',
}: IaMessageCardProps) {
  return (
    <section className="rk-surface rk-x-surface-msg" aria-labelledby={titleId}>
      <div className="rk-sec ia-stack ia-stack--tight">
        {icon ? (
          <span className="rk-state-ico rk-x-state-ico-flush" aria-hidden="true">
            <Glyph name={icon} />
          </span>
        ) : null}
        <h1 className="rb-h2" id={titleId} tabIndex={-1}>
          {title}
        </h1>
        <p className="rk-next">{children}</p>
        <div className="ia-row">{actions}</div>
      </div>
    </section>
  );
}
