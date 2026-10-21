'use client';

import {
  useEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react';

import type { FormatCode } from '../icons/registry.js';
import { joinClasses } from '../internal/classes.js';
import { followRowLink } from '../internal/row-link.js';
import { useLinkComponent } from '../link.js';
import { Field, SearchInput, Select, type SelectOption } from './fields.js';
import { FORMAT_ORDER } from './formats.js';
import { Glyph, type V3IconName } from './icons.js';

/*
 * What more than one Faculty screen group draws (`fa-` classes; the owner-approved Faculty export,
 * design/v3-refined-b/roles/FA-v1, `project/fa.css` and its COMPONENT-EXTENSIONS.md; FA-ANALYSIS
 * §5.3): the format badges, the unit meters and per-format progress (P4), the identity / record
 * band with its figures (P2), the assessment panel and its parts, the refined table and its cells,
 * the list toolbar (table bar, filters, status line), the segmented control, the record tabs, the
 * export band (FA-22), the message card and in-role inline message (P8), the stepper, the
 * authoring layout and form sections (P6), the question head and meta, the result marks, the
 * marking guidance, the sheet question head, the checklist, the resource list and the small
 * helpers. Markup as the export's `Main.dc.html` draws them (teaching FA-01 … FA-05, assessments
 * FA-06 … FA-12, bank FA-14 … FA-17, marking FA-18 … FA-21); every word, figure, date and
 * destination comes from the caller. The export's inline `style` values are not drawn (the
 * consolidation patches them centrally). What one screen group alone draws is in
 * `fa-teaching.tsx`, `fa-assessments.tsx`, `fa-bank.tsx` and `fa-marking.tsx`.
 */

function inFormatOrder(formats: readonly FormatCode[]): FormatCode[] {
  return [...new Set(formats)].sort(
    (left, right) => FORMAT_ORDER.indexOf(left) - FORMAT_ORDER.indexOf(right),
  );
}

// ---- Format badges --------------------------------------------------------------------------------

export interface FaFormatBadgesProps {
  /** The formats, drawn in the foundation's order (WEB, AR, VR, MR). */
  readonly formats: readonly FormatCode[];
  /** What the badges say: "Formats your institution has: WEB, VR". */
  readonly label: string;
}

/**
 * The small solid format badges (`span.rk-fmts[aria-label]` > `span.xr-fmt[aria-hidden]`; FA-01,
 * FA-02, FA-03, FA-04, FA-05, FA-07). The export names the span with `aria-label`; a name needs a
 * role, so the badges are one image (`role="img"`), as the Academic Reviewer's and Institute
 * Admin's badges.
 */
export function FaFormatBadges({ formats, label }: FaFormatBadgesProps) {
  return (
    <span className="rk-fmts" role="img" aria-label={label}>
      {inFormatOrder(formats).map((format) => (
        <span key={format} className="xr-fmt" aria-hidden="true">
          {format}
        </span>
      ))}
    </span>
  );
}

// ---- Unit meters and per-format progress (P4) -----------------------------------------------------

/**
 * One student's unit (the export's `unitsOf`): `done` (completed, green), `progress` (in progress,
 * blue), `submitted` (submitted the assessment, indigo) or `none` (grey).
 */
export type FaUnitState = 'done' | 'progress' | 'submitted' | 'none';

const UNIT_CLASS: Readonly<Record<FaUnitState, string | undefined>> = {
  done: 'is-done',
  progress: 'is-prog',
  submitted: 'is-sub',
  // The export's script writes `fa-u` here, a class no sheet defines: the grey unit is a plain `i`.
  none: undefined,
};

/** Above this many units the meter is dense (`fa-units--dense`: no gaps; the export's `n > 24`). */
export const FA_DENSE_UNITS_ABOVE = 24;

/**
 * The unit meter (`span.fa-units[aria-hidden]` > `i` per student, one unit per student; dense above
 * 24): decorative — the counts beside it say the same in words. Units are drawn in the order given
 * (the export's: completed, in progress, not started; submitted first).
 */
export function FaUnits({ units }: { readonly units: readonly FaUnitState[] }) {
  return (
    <span
      className={joinClasses('fa-units', units.length > FA_DENSE_UNITS_ABOVE && 'fa-units--dense')}
      aria-hidden="true"
    >
      {units.map((state, index) => (
        <i key={index} className={UNIT_CLASS[state]} />
      ))}
    </span>
  );
}

/** The three count words after each figure (`copy/fa-shared.ts` `FA_PROGRESS_WORDS`). */
export interface FaProgressWords {
  readonly completed: string;
  readonly inProgress: string;
  readonly notStarted: string;
}

export interface FaProgressRow {
  readonly format: FormatCode;
  readonly completed: number;
  readonly inProgress: number;
  readonly notStarted: number;
  /** The row's units (the shared model `formatProgressRows` orders them). */
  readonly units: readonly FaUnitState[];
}

export interface FaProgressProps {
  /** The list's name: "Student activity by format for Venturi Meter, as of 7 Nov 2026". */
  readonly label: string;
  readonly rows: readonly FaProgressRow[];
  readonly words: FaProgressWords;
  /** `cell`: inside a table cell (FA-04 `fa-prog--cell`); `sum`: FA-20's summary (`fa-prog--sum`). */
  readonly variant?: 'cell' | 'sum';
}

/**
 * Per-format progress (`ul.fa-prog[aria-label]` > `li.fa-prog-row` > the format code, its unit
 * meter and "<b>n</b> completed · <b>n</b> in progress · <b>n</b> not started"; FA-01, FA-03,
 * FA-04, FA-05, FA-20).
 */
export function FaProgress({ label, rows, words, variant }: FaProgressProps) {
  return (
    <ul className={joinClasses('fa-prog', variant && `fa-prog--${variant}`)} aria-label={label}>
      {rows.map((row) => (
        <li key={row.format} className="fa-prog-row">
          <span className="xr-fmt">{row.format}</span>
          <FaUnits units={row.units} />
          <p className="fa-prog-t">
            <span>
              <b>{row.completed}</b> {words.completed}
            </span>
            <span>
              <b>{row.inProgress}</b> {words.inProgress}
            </span>
            <span>
              <b>{row.notStarted}</b> {words.notStarted}
            </span>
          </p>
        </li>
      ))}
    </ul>
  );
}

// ---- Identity / record band and figures (P2) -------------------------------------------------------

/** How a record band's figure value is set (`span.fa-fig-v`): plain, quiet ("None yet"), or warn. */
export type FaFigureTone = 'plain' | 'quiet' | 'warn';

export interface FaFigureProps {
  /** The figure's name (`dt`): "Students with access", "Due 14 Nov 2026, 23:59". */
  readonly term: ReactNode;
  readonly value: ReactNode;
  /** A unit meter under the name (the record band's "Students submitted"). */
  readonly units?: readonly FaUnitState[];
  /** A formats figure (`fa-fig--fm`: FA-05 "Formats your institution has"). */
  readonly formats?: boolean;
  /** The value is quiet ("None yet": `dd.is-quiet` on a formats figure). */
  readonly quiet?: boolean;
  /**
   * The record band's value (`dd > span.fa-fig-v`, FA-08 … FA-12): `plain`, `quiet` ("Not set
   * yet") or `warn` ("7 days left"). Left out on FA-02, FA-03, FA-05, where the value is the `dd`.
   */
  readonly tone?: FaFigureTone;
}

/** One figure (`div.fa-fig(.fa-fig--fm)` > `dt` + `dd`). */
export function FaFigure({ term, value, units, formats, quiet, tone }: FaFigureProps) {
  return (
    <div className={joinClasses('fa-fig', formats && 'fa-fig--fm')}>
      <dt>
        {term}
        {units ? <FaUnits units={units} /> : null}
      </dt>
      <dd className={quiet ? 'is-quiet' : undefined}>
        {tone ? (
          <span
            className={joinClasses(
              'fa-fig-v',
              tone === 'quiet' && 'is-quiet',
              tone === 'warn' && 'is-warn',
            )}
          >
            {value}
          </span>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

/** The figures (`dl.fa-figs`): FA-02's course header, the identity and record bands. */
export function FaFigures({ children }: { readonly children: ReactNode }) {
  return <dl className="fa-figs">{children}</dl>;
}

export interface FaIdentityBandProps {
  /** The date line above (`p.rb-eyebrow-date`): "Saturday 7 November 2026". */
  readonly date?: ReactNode;
  /** The course code (`span.rb-code`) and the kicker after it: "Course you teach". */
  readonly code: string;
  readonly kicker: ReactNode;
  /** The page's H1 (`h1.fa-cid-t`, `tabIndex=-1`: route focus lands on it). */
  readonly title: ReactNode;
  readonly titleId?: string;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** The quiet line under the title (`p.fa-cid-src`): where the course comes from. */
  readonly source?: ReactNode;
  /**
   * The record band (`header.fa-cid.fa-rec`, FA-08 … FA-12): its meta line (`p.fa-rec-meta`), the
   * status first, each later item after a separator (`span.fa-rec-sep`).
   */
  readonly meta?: readonly ReactNode[];
  /** `FaFigures` (`dl.fa-figs`) with its `FaFigure`s. */
  readonly figures: ReactNode;
}

/**
 * The identity band (`header.fa-cid`; FA-03 Course, FA-05 Experiment) and, with a meta line, the
 * assessment's record band (`header.fa-cid.fa-rec`; FA-08 … FA-12): the date, the code and kicker,
 * the title, the source line or the record's meta, then the figures.
 */
export function FaIdentityBand({
  date,
  code,
  kicker,
  title,
  titleId,
  titleRef,
  source,
  meta,
  figures,
}: FaIdentityBandProps) {
  const record = meta !== undefined;
  return (
    <header className={joinClasses('fa-cid', record && 'fa-rec')}>
      <div className="fa-cid-top">
        <div className="fa-cid-text">
          {date ? <p className="rb-eyebrow-date rk-x-date-flush">{date}</p> : null}
          <p className="rk-eyebrow fa-cid-eyebrow">
            <span className="rb-code">{code}</span>
            <span>{kicker}</span>
          </p>
          <h1
            className={joinClasses('fa-cid-t', record && 'fa-rec-t')}
            id={titleId}
            ref={titleRef}
            tabIndex={-1}
          >
            {title}
          </h1>
          {source ? <p className="fa-cid-src">{source}</p> : null}
          {record ? (
            <p className="fa-rec-meta">
              {meta.map((item, index) => (
                <FaRecordMetaItem key={index} first={index === 0}>
                  {item}
                </FaRecordMetaItem>
              ))}
            </p>
          ) : null}
        </div>
      </div>
      {figures}
    </header>
  );
}

function FaRecordMetaItem({
  first,
  children,
}: {
  readonly first: boolean;
  readonly children: ReactNode;
}) {
  return (
    <>
      {first ? null : <span className="fa-rec-sep" aria-hidden="true" />}
      {children}
    </>
  );
}

/** "Version 2 since 2 Nov 2026", "Created by Dr Anita Desai": a plain meta item (`span`). */
export function FaRecordMetaText({ children }: { readonly children: ReactNode }) {
  return <span>{children}</span>;
}

/** The meta line's link to waiting work (`a.rb-link.fa-rec-wait` with the clock): "2 waiting for marking". */
export function FaRecordWaitLink({
  href,
  children,
}: {
  readonly href: string;
  readonly children: ReactNode;
}) {
  const Link = useLinkComponent();
  return (
    <Link className="rb-link fa-rec-wait" href={href}>
      <Glyph name="clock" />
      {children}
    </Link>
  );
}

// ---- Detail layout, panel and the assessment panel ---------------------------------------------------

export interface FaDetailProps {
  /** On narrow widths the aside comes first (`rk-detail.fa-asidefirst`: FA-05, FA-08, FA-21). */
  readonly asideFirst?: boolean;
  /** What comes before the columns inside the wrap (FA-19's "Go to the marks"). */
  readonly before?: ReactNode;
  /** `FaMainSheet` and `FaAside`. */
  readonly children: ReactNode;
}

/** The detail page (`div.rk-detailwrap` > `div.rk-detail`): the sheet, then the aside. */
export function FaDetail({ asideFirst, before, children }: FaDetailProps) {
  return (
    <div className="rk-detailwrap">
      {before}
      <div className={joinClasses('rk-detail', asideFirst && 'fa-asidefirst')}>{children}</div>
    </div>
  );
}

/** The record's sheet (`div.rk-surface.rk-mainsheet`; a named `section` when `labelledBy` is given). */
export function FaMainSheet({
  labelledBy,
  children,
}: {
  readonly labelledBy?: string;
  readonly children: ReactNode;
}) {
  return labelledBy ? (
    <section className="rk-surface rk-mainsheet" aria-labelledby={labelledBy}>
      {children}
    </section>
  ) : (
    <div className="rk-surface rk-mainsheet">{children}</div>
  );
}

/** The side column (`aside.rk-aside[aria-labelledby]`), named by its panel's heading. */
export function FaAside({
  labelledBy,
  children,
}: {
  readonly labelledBy: string;
  readonly children: ReactNode;
}) {
  return (
    <aside className="rk-aside" aria-labelledby={labelledBy}>
      {children}
    </aside>
  );
}

export interface FaPanelProps {
  /** The navy head's heading (`h2`): "Assessment", "Submissions". */
  readonly title: ReactNode;
  readonly titleId: string;
  /** The head's quiet note (`span.fa-ph-note`): "Oldest first", "1 of 2 written". */
  readonly note?: ReactNode;
  /** The assessment panel's body (`div.rk-panel-body.fa-apanel`: FA-05, FA-21). */
  readonly assessment?: boolean;
  /** The heading takes focus when the panel opens (`tabIndex=-1`; FA-09's bank panel). */
  readonly focusable?: boolean;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /**
   * A closable panel (FA-09 "From your question bank"): the head's close button
   * (`button.fa-panel-x`, named by `label`: "Close question bank") in place of the note, and Escape
   * inside the panel closes it too.
   */
  readonly close?: { readonly label: string; readonly onClose: () => void };
  readonly children: ReactNode;
}

/**
 * The panel (`div.rk-panel` > navy `div.rk-panel-head` + `div.rk-panel-body`). The head carries
 * `rk-x-panel-head-quiet` (V3P-17): the export's no-outline rule for a panel heading that takes
 * focus (`.rk-panel-head h2:focus`), confined to the Faculty panels.
 */
export function FaPanel({
  title,
  titleId,
  note,
  assessment,
  focusable,
  titleRef,
  close,
  children,
}: FaPanelProps) {
  const onKeyDown = close
    ? (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        close.onClose();
      }
    : undefined;
  return (
    <div className="rk-panel" onKeyDown={onKeyDown}>
      <div className="rk-panel-head rk-x-panel-head-quiet">
        <h2 id={titleId} ref={titleRef} tabIndex={focusable ? -1 : undefined}>
          {title}
        </h2>
        {close ? (
          <button
            type="button"
            className="fa-panel-x"
            aria-label={close.label}
            onClick={close.onClose}
          >
            <Glyph name="close" />
          </button>
        ) : note ? (
          <span className="fa-ph-note">{note}</span>
        ) : null}
      </div>
      <div className={joinClasses('rk-panel-body', assessment && 'fa-apanel')}>{children}</div>
    </div>
  );
}

/** The assessment's identity in its panel (`div.fa-apanel-id`): the status pill, name and due line. */
export function FaAssessmentId({ children }: { readonly children: ReactNode }) {
  return <div className="fa-apanel-id">{children}</div>;
}

/** The assessment's name (`p.fa-asm-n`); with `href`, a link to it (`a.fa-exp-link`). */
export function FaAssessmentName({
  href,
  children,
}: {
  readonly href?: string;
  readonly children: ReactNode;
}) {
  const Link = useLinkComponent();
  return (
    <p className="fa-asm-n">
      {href ? (
        <Link className="fa-exp-link" href={href}>
          {children}
        </Link>
      ) : (
        children
      )}
    </p>
  );
}

/** The due line (`p.fa-asm-d`): "Due 14 Nov 2026, 23:59", then " · <b>7 days left</b>" while open. */
export function FaAssessmentDue({
  children,
  left,
}: {
  readonly children: ReactNode;
  readonly left?: ReactNode;
}) {
  return (
    <p className="fa-asm-d">
      {children}
      {left ? (
        <>
          {' · '}
          <b>{left}</b>
        </>
      ) : null}
    </p>
  );
}

/** The submissions meter (`div.fa-asm-subs` > units + "2 of 5 students submitted"). */
export function FaAssessmentSubmissions({
  units,
  children,
}: {
  readonly units: readonly FaUnitState[];
  readonly children: ReactNode;
}) {
  return (
    <div className="fa-asm-subs">
      <FaUnits units={units} />
      <p>{children}</p>
    </div>
  );
}

/** Waiting work (`p.fa-asm-wait` with the clock): "1 written answer waiting for marking". */
export function FaAssessmentWait({ children }: { readonly children: ReactNode }) {
  return (
    <p className="fa-asm-wait">
      <Glyph name="clock" />
      <span>{children}</span>
    </p>
  );
}

/** A note under the assessment (`p.fa-asm-note`). */
export function FaAssessmentNote({ children }: { readonly children: ReactNode }) {
  return <p className="fa-asm-note">{children}</p>;
}

/** The panel's actions (`div.fa-panel-acts`): the primary first. */
export function FaPanelActions({ children }: { readonly children: ReactNode }) {
  return <div className="fa-panel-acts">{children}</div>;
}

/** Waiting work in a row or card (`span.fa-xwait` with the clock): "1 waiting for marking". */
export function FaWaitLine({ children }: { readonly children: ReactNode }) {
  return (
    <span className="fa-xwait">
      <Glyph name="clock" />
      {children}
    </span>
  );
}

// ---- Refined table (`div.fa-tablewrap` > `table.rk-table.fa-table`) -------------------------------

/**
 * Which list the table is (the export's column and phone classes): `experiments` FA-04
 * (`fa-xtable`), `assessments` FA-06 (`fa-atable fa-ptable fa-ptable2`), `submissions` FA-12
 * (`fa-stable fa-ptable fa-ptable2`), `bank` FA-14 (`fa-btable fa-ptable`), `queue` FA-18
 * (`fa-ptable`; the export's `fa-mtable` is defined by no sheet), `roster` FA-20 (`fa-rtable
 * fa-ptable`), `rows` FA-17's rows that need attention (`fa-ptable` in a boxed wrap).
 */
export type FaTableKind =
  'experiments' | 'assessments' | 'submissions' | 'bank' | 'queue' | 'roster' | 'rows';

const TABLE_CLASSES: Readonly<Record<FaTableKind, readonly string[]>> = {
  experiments: ['fa-xtable'],
  assessments: ['fa-atable', 'fa-ptable', 'fa-ptable2'],
  submissions: ['fa-stable', 'fa-ptable', 'fa-ptable2'],
  bank: ['fa-btable', 'fa-ptable'],
  queue: ['fa-ptable'],
  roster: ['fa-rtable', 'fa-ptable'],
  rows: ['fa-ptable'],
};

/** A column's width class (`th.fa-c-*`), as each list sets it. */
export type FaColumnWidth = 'exp' | 'act' | 'name' | 'subs' | 'q' | 'used' | 'who' | 'fm' | 'asm';

export interface FaTableColumn {
  readonly key: string;
  readonly header: ReactNode;
  readonly width?: FaColumnWidth;
  /** Desktop only (`fa-desk`): its value moves under the name on phones. */
  readonly desktopOnly?: boolean;
  /** A head read only by screen readers ("Actions"). */
  readonly hidden?: boolean;
}

export interface FaTableCell {
  readonly key: string;
  /** `main`: the identity cell (`fa-c-main`, no label on phones). */
  readonly main?: boolean;
  /** `fa-c-wide`: the cell spans the phone row. */
  readonly wide?: boolean;
  /** `fa-c-inl`: the phone label sits inline before the value. */
  readonly inline?: boolean;
  /** `fa-c-nolbl`: the compact phone row hides the label. */
  readonly noLabel?: boolean;
  /** `fa-c-st`: the status cell. */
  readonly status?: boolean;
  /** `fa-nowrap`. */
  readonly nowrap?: boolean;
  /** `fa-desk`: desktop only. */
  readonly desktopOnly?: boolean;
  /** The label phones show before the value (`span.fa-lbl`): "Deadline". */
  readonly label?: ReactNode;
  readonly children?: ReactNode;
}

export interface FaTableRow {
  readonly key: string;
  readonly cells: readonly FaTableCell[];
  /** A press anywhere on the row follows its name link (`FaRowLink`). */
  readonly link?: boolean;
  /** A row with explicit actions only (`tr.fa-static`: no row press). */
  readonly static?: boolean;
}

export interface FaTableProps {
  readonly kind: FaTableKind;
  /** The table's name (the caption). */
  readonly caption: ReactNode;
  readonly columns: readonly FaTableColumn[];
  readonly rows: readonly FaTableRow[];
}

/**
 * The refined table (`div.fa-tablewrap` > `table.rk-table.fa-table`; COMPONENT-EXTENSIONS
 * "Responsive tables" and "Final-pass shared components"): a caption, labelled cells that become
 * a compact block per row below 760 px of table width (`fatable`), whole-row links or static rows.
 * The rows reflow, so the table keeps its semantics with explicit table roles (ADR-0010).
 */
export function FaTable({ kind, caption, columns, rows }: FaTableProps) {
  return (
    <div className={joinClasses('fa-tablewrap', kind === 'rows' && 'fa-boxtable')}>
      <table className={joinClasses('rk-table', 'fa-table', ...TABLE_CLASSES[kind])} role="table">
        <caption>{caption}</caption>
        <thead role="rowgroup">
          <tr role="row">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                role="columnheader"
                className={
                  joinClasses(
                    column.width && `fa-c-${column.width}`,
                    column.desktopOnly && 'fa-desk',
                  ) || undefined
                }
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
              className={row.static ? 'fa-static' : undefined}
              onClick={row.link ? followRowLink : undefined}
            >
              {row.cells.map((cell) => (
                <td
                  key={cell.key}
                  role="cell"
                  className={
                    joinClasses(
                      cell.nowrap && 'fa-nowrap',
                      cell.main && 'fa-c-main',
                      cell.wide && 'fa-c-wide',
                      cell.inline && 'fa-c-inl',
                      cell.noLabel && 'fa-c-nolbl',
                      cell.status && 'fa-c-st',
                      cell.desktopOnly && 'fa-desk',
                    ) || undefined
                  }
                >
                  {cell.label ? <span className="fa-lbl">{cell.label}</span> : null}
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

/** The row's name link (`a.rk-rowlink`); the row press follows it. */
export function FaRowLink({
  href,
  label,
  children,
}: {
  readonly href: string;
  /** The link's full name where the name alone is not enough: "Open Heat Exchanger — post-lab, Ready". */
  readonly label?: string;
  readonly children: ReactNode;
}) {
  const Link = useLinkComponent();
  return (
    <Link className="rk-rowlink" href={href} aria-label={label}>
      {children}
    </Link>
  );
}

/** A quiet line under a cell's value (`span.fa-cellsub`); `first`: no space above (`fa-cellsub0`). */
export function FaCellSub({
  first,
  foot,
  children,
}: {
  readonly first?: boolean;
  /** Under a meter (`fa-cellfoot`). */
  readonly foot?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <span className={joinClasses('fa-cellsub', first && 'fa-cellsub0', foot && 'fa-cellfoot')}>
      {children}
    </span>
  );
}

/** A cell's main value (`span.fa-cellname`); `numeric`: tabular figures (`fa-num`). */
export function FaCellName({
  numeric,
  children,
}: {
  readonly numeric?: boolean;
  readonly children: ReactNode;
}) {
  return <span className={joinClasses('fa-cellname', numeric && 'fa-num')}>{children}</span>;
}

/**
 * A cell's line (`span.fa-cellline`); `strong` (`rk-strong`): the queue's student name; `apart`:
 * 8 px under the line above (`rk-x-cellline-tight`, V3P-17: FA-14's "From a draft you reviewed").
 */
export function FaCellLine({
  strong,
  apart,
  children,
}: {
  readonly strong?: boolean;
  readonly apart?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <span
      className={joinClasses(strong && 'rk-strong', 'fa-cellline', apart && 'rk-x-cellline-tight')}
    >
      {children}
    </span>
  );
}

/** A row's explicit actions (`div.fa-cellacts`): "Edit", "Delete", "Mark". */
export function FaCellActions({ children }: { readonly children: ReactNode }) {
  return <div className="fa-cellacts">{children}</div>;
}

/** A meter in a cell (`span.fa-cellmeter` > units + `span.fa-cellline`): "2 of 5 submitted". */
export function FaCellMeter({
  units,
  children,
}: {
  readonly units: readonly FaUnitState[];
  readonly children: ReactNode;
}) {
  return (
    <span className="fa-cellmeter">
      <FaUnits units={units} />
      <span className="fa-cellline">{children}</span>
    </span>
  );
}

// ---- List toolbar ---------------------------------------------------------------------------------

/** The toolbar over a list (`div.rk-toolbar`): the table bar, filters, status line, segments. */
export function FaToolbar({ children }: { readonly children: ReactNode }) {
  return <div className="rk-toolbar">{children}</div>;
}

export interface FaTableBarProps {
  /** The list's heading (`h2.rb-h2`): "Submissions", "Written answers". */
  readonly title: ReactNode;
  readonly titleId: string;
  /** The heading takes focus (`tabIndex=-1`: a record tab's heading, FA-12, FA-14). */
  readonly focusable?: boolean;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** What follows the heading: the count (`FaCount`), a hint (`p.rk-hint`), FA-18's count line. */
  readonly children?: ReactNode;
  /** The bar's actions (`div.fa-actions.fa-tbar-act`): "Mark next", "Export CSV". */
  readonly actions?: ReactNode;
}

/** The list's head row (`div.fa-tbar` > `div.fa-tbar-t` + the actions; FA-12, FA-14, FA-18, FA-20). */
export function FaTableBar({
  title,
  titleId,
  focusable,
  titleRef,
  children,
  actions,
}: FaTableBarProps) {
  return (
    <div className="fa-tbar">
      <div className="fa-tbar-t">
        <h2
          className="rb-h2"
          id={titleId}
          ref={titleRef}
          tabIndex={focusable || titleRef ? -1 : undefined}
        >
          {title}
        </h2>
        {children}
      </div>
      {actions ? <div className="fa-actions fa-tbar-act">{actions}</div> : null}
    </div>
  );
}

/** A count in words, announced politely (`p.rk-count[role=status]`): "2 of 6 questions". */
export function FaCount({ children }: { readonly children: ReactNode }) {
  return (
    <p className="rk-count" role="status">
      {children}
    </p>
  );
}

export interface FaFiltersProps {
  /** The search landmark's name: "Filter experiments". */
  readonly label: string;
  /** `queue`: FA-18's filters beside its segments (`rk-tools.fa-mqtools`). */
  readonly variant?: 'queue';
  readonly children: ReactNode;
}

/** The filters (`div.rk-tools.fa-tools[role=search]`): `FaSearchField`, `FaSelectField`s. */
export function FaFilters({ label, variant, children }: FaFiltersProps) {
  return (
    <div
      className={joinClasses('rk-tools', variant === 'queue' ? 'fa-mqtools' : 'fa-tools')}
      role="search"
      aria-label={label}
    >
      {children}
    </div>
  );
}

export interface FaSearchFieldProps {
  readonly id: string;
  readonly label: ReactNode;
  readonly placeholder?: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly inputRef?: Ref<HTMLInputElement>;
}

/** The search field (`div.rk-field.rk-search` > label + `div.rk-inputwrap` > icon + input). */
export function FaSearchField({
  id,
  label,
  placeholder,
  value,
  onChange,
  inputRef,
}: FaSearchFieldProps) {
  return (
    <Field label={label} id={id} className="rk-search">
      <SearchInput
        ref={inputRef}
        placeholder={placeholder}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

export interface FaSelectFieldProps {
  readonly id: string;
  readonly label: ReactNode;
  readonly value: string;
  readonly options: readonly SelectOption[];
  readonly onChange: (value: string) => void;
  /** FA-18's assessment filter (`fa-mqasm`: wider). */
  readonly wide?: boolean;
  readonly selectRef?: Ref<HTMLSelectElement>;
}

/** A filter (`div.rk-field.fa-field-sel` > label + `div.rk-selwrap` > select + chevron). */
export function FaSelectField({
  id,
  label,
  value,
  options,
  onChange,
  wide,
  selectRef,
}: FaSelectFieldProps) {
  return (
    <Field label={label} id={id} className={joinClasses('fa-field-sel', wide && 'fa-mqasm')}>
      <Select
        ref={selectRef}
        value={value}
        options={options}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

export interface FaFilterChip {
  readonly key: string;
  /** "Format: VR", "Search: “venturi”". */
  readonly label: string;
  readonly onRemove: () => void;
  /** Where focus goes once the chip is gone: the field it filtered (the export's `focusLater`). */
  readonly focusId?: string;
}

export interface FaStatusLineProps {
  /** The count in words (`p.rk-count[role=status]`); left out while the list loads. */
  readonly count?: ReactNode;
  readonly chips?: readonly FaFilterChip[];
  /** A chip's remove button's name: "Remove filter Format: VR" (`copy/fa-shared.ts`). */
  readonly removeLabel: (chip: FaFilterChip) => string;
  /** "Clear filters": shown with a chip; clears every filter. */
  readonly clearLabel: ReactNode;
  readonly onClearFilters?: () => void;
  /** Where focus goes after "Clear filters" (the search field, or the first filter). */
  readonly clearFocusId?: string;
}

function focusById(id: string | undefined): void {
  if (id) document.getElementById(id)?.focus();
}

/**
 * The status line (`div.rk-statusline` > the count, one chip per filter, "Clear filters"):
 * removing a chip moves focus to the field it filtered, clearing to `clearFocusId` (the export's
 * `focusLater`), so focus is never lost with the chip.
 */
export function FaStatusLine({
  count,
  chips = [],
  removeLabel,
  clearLabel,
  onClearFilters,
  clearFocusId,
}: FaStatusLineProps) {
  const pendingFocus = useRef<string | null>(null);
  useEffect(() => {
    if (pendingFocus.current === null) return;
    const id = pendingFocus.current;
    pendingFocus.current = null;
    focusById(id);
  });
  if (count === undefined && chips.length === 0) return null;
  return (
    <div className="rk-statusline">
      {count !== undefined ? <FaCount>{count}</FaCount> : null}
      {chips.map((chip) => (
        <span key={chip.key} className="rk-chip">
          {chip.label}
          <button
            type="button"
            aria-label={removeLabel(chip)}
            onClick={() => {
              pendingFocus.current = chip.focusId ?? clearFocusId ?? null;
              chip.onRemove();
            }}
          >
            <Glyph name="close" />
          </button>
        </span>
      ))}
      {chips.length > 0 && onClearFilters ? (
        <button
          type="button"
          className="rk-clear"
          onClick={() => {
            pendingFocus.current = clearFocusId ?? null;
            onClearFilters();
          }}
        >
          {clearLabel}
        </button>
      ) : null}
    </div>
  );
}

// ---- Segmented control ------------------------------------------------------------------------------

export interface FaSegment {
  readonly key: string;
  /** "Waiting", "Student view". */
  readonly label: ReactNode;
  /** The words wide screens add (`span.fa-seg-long`): " for marking". */
  readonly longLabel?: ReactNode;
  /** The count (`b[aria-hidden]` + ", 2" for screen readers). */
  readonly count?: number;
  readonly icon?: V3IconName;
  readonly pressed: boolean;
  readonly onPress: () => void;
}

export interface FaSegmentedProps {
  /** The group's name: "Show", "Preview as". */
  readonly label: string;
  readonly segments: readonly FaSegment[];
  /** A list's filter bar (`fa-seg--bar`: FA-12, FA-18); FA-11's view switch without. */
  readonly bar?: boolean;
}

/** The segmented control (`div.fa-seg[role=group]` > `button[aria-pressed]`; FA-11, FA-12, FA-18). */
export function FaSegmented({ label, segments, bar }: FaSegmentedProps) {
  return (
    <div className={joinClasses('fa-seg', bar && 'fa-seg--bar')} role="group" aria-label={label}>
      {segments.map((segment) => (
        <button
          key={segment.key}
          type="button"
          aria-pressed={segment.pressed}
          onClick={segment.onPress}
        >
          {segment.icon ? <Glyph name={segment.icon} /> : null}
          {segment.longLabel ? (
            <span>
              {segment.label}
              <span className="fa-seg-long">{segment.longLabel}</span>
            </span>
          ) : (
            segment.label
          )}
          {segment.count === undefined ? null : (
            <>
              <b aria-hidden="true">{segment.count}</b>
              <span className="xr-sr">, {segment.count}</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}

// ---- Record tabs -------------------------------------------------------------------------------------

export interface FaRecordTab {
  readonly key: string;
  readonly href: string;
  readonly label: ReactNode;
  /** The tab's count (`span.fa-tabn[aria-hidden]` + ", 4" for screen readers). */
  readonly count?: number;
  readonly current?: boolean;
}

export interface FaRecordTabsProps {
  /** The tabs' name: "Heat Exchanger — post-lab", "Question bank". */
  readonly label: string;
  readonly tabs: readonly FaRecordTab[];
  /** The current tab's content, inside the frame (`div.fa-recordtabs`). */
  readonly children: ReactNode;
}

/**
 * The record's tabs with counts (`div.fa-recordtabs` > `nav.rk-tabs.fa-tabs` > `a.rk-tab`, then
 * the tab's content; FA-08 … FA-12, FA-14): each tab is an address, so they are links with
 * `aria-current="page"`, not ARIA tabs.
 */
export function FaRecordTabs({ label, tabs, children }: FaRecordTabsProps) {
  const Link = useLinkComponent();
  if (tabs.filter((tab) => tab.current).length > 1) {
    throw new Error('FaRecordTabs: at most one tab is current.');
  }
  return (
    <div className="fa-recordtabs">
      <nav className="rk-tabs fa-tabs" aria-label={label}>
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            className="rk-tab"
            href={tab.href}
            aria-current={tab.current ? 'page' : undefined}
          >
            {tab.label}
            {tab.count === undefined ? null : (
              <>
                <span className="fa-tabn" aria-hidden="true">
                  {tab.count}
                </span>
                <span className="xr-sr">, {tab.count}</span>
              </>
            )}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}

// ---- Export band (FA-22) -----------------------------------------------------------------------------

export interface FaExportBandProps {
  /** The notice's id (it takes focus after the export: `tabIndex=-1`). */
  readonly noticeId: string;
  readonly noticeRef?: Ref<HTMLDivElement>;
  /** "Exported submissions-heat-exchanger-post-lab.csv · 2 rows". */
  readonly title: ReactNode;
  /** "It contains this list only, as it was when you exported it. Columns: …". */
  readonly description: ReactNode;
  /** The preview's region name and caption: "Rows in the exported file". */
  readonly rowsLabel: string;
  /** The file's header cells, as written. */
  readonly columns: readonly string[];
  /** The file's rows, cell by cell. */
  readonly rows: readonly (readonly string[])[];
  /** The wider preview (`rk-x-table-wide`, 1000 px, V3P-17): FA-20's ten columns. */
  readonly wide?: boolean;
}

/**
 * The export confirmation above the list it exported (`div.fa-export` > the ok notice + a
 * keyboard-focusable sideways-scroll region with the file's rows; FA-12, FA-20).
 */
export function FaExportBand({
  noticeId,
  noticeRef,
  title,
  description,
  rowsLabel,
  columns,
  rows,
  wide,
}: FaExportBandProps) {
  return (
    <div className="fa-export">
      <div
        className="rk-notice rk-notice--ok"
        id={noticeId}
        ref={noticeRef}
        tabIndex={-1}
        role="status"
      >
        <Glyph name="download" />
        <p className="rk-notice-t">{title}</p>
        <p className="rk-notice-d">{description}</p>
      </div>
      <div className="fa-scrollx" role="region" aria-label={rowsLabel} tabIndex={0}>
        <table className={joinClasses('rk-table', wide && 'rk-x-table-wide')}>
          <caption>{rowsLabel}</caption>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Message card and inline message (P8) -----------------------------------------------------------

export interface FaInlineMessageProps {
  /** The glyph in the tinted box (`span.fa-msg-ico`): `book`, `clipboardCheck`, `stack`, `pen`, … */
  readonly icon: V3IconName;
  /** The refusal look (`fa-msg-ico--lock`): a co-teaching colleague's record. */
  readonly lock?: boolean;
  readonly title: ReactNode;
  readonly titleId: string;
  /** The heading takes focus (`tabIndex=-1`: an inline refusal under a record tab). */
  readonly focusable?: boolean;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** The line under the title (`p.fa-msg-d`). */
  readonly children: ReactNode;
  /** The way on (`div.fa-msg-act`): a button or a link. */
  readonly actions?: ReactNode;
}

/** The in-role message (`div.fa-inlinemsg` > icon box, `h2.rb-h2`, `p.fa-msg-d`, actions). */
export function FaInlineMessage({
  icon,
  lock,
  title,
  titleId,
  focusable,
  titleRef,
  children,
  actions,
}: FaInlineMessageProps) {
  return (
    <div className="fa-inlinemsg">
      <span className={joinClasses('fa-msg-ico', lock && 'fa-msg-ico--lock')} aria-hidden="true">
        <Glyph name={icon} />
      </span>
      <h2
        className="rb-h2"
        id={titleId}
        ref={titleRef}
        tabIndex={focusable || titleRef ? -1 : undefined}
      >
        {title}
      </h2>
      <p className="fa-msg-d">{children}</p>
      {actions ? <div className="fa-msg-act">{actions}</div> : null}
    </div>
  );
}

/**
 * The message card (`section.rk-surface.fa-msgcard[aria-labelledby]` > `FaInlineMessage`): the
 * no-course states of FA-01, FA-02, FA-04, FA-06, FA-07, FA-14, FA-16, FA-17, FA-18 and FA-20.
 */
export function FaMessageCard(props: FaInlineMessageProps) {
  return (
    <section className="rk-surface fa-msgcard" aria-labelledby={props.titleId}>
      <FaInlineMessage {...props} />
    </section>
  );
}

// ---- Stepper -----------------------------------------------------------------------------------------

export type FaStepState = 'done' | 'current' | 'todo';

export interface FaStep {
  readonly key: string;
  readonly label: ReactNode;
  readonly state: FaStepState;
}

export interface FaStepsProps {
  /** The steps' name: "Steps to create an assessment". */
  readonly label: string;
  readonly steps: readonly FaStep[];
  /** The screen-reader suffix of each state: ", done", ", current step", ", not done yet". */
  readonly stateWords: Readonly<Record<FaStepState, string>>;
}

/**
 * The guided steps (`ol.fa-steps.fa-steps--fit` > `li.fa-step(.is-done|.is-current)`; FA-07,
 * FA-17): a done step shows a tick, the others their number; the current one is
 * `aria-current="step"`; each says its state to screen readers.
 */
export function FaSteps({ label, steps, stateWords }: FaStepsProps) {
  return (
    <ol className="fa-steps fa-steps--fit" aria-label={label}>
      {steps.map((step, index) => (
        <li
          key={step.key}
          className={joinClasses(
            'fa-step',
            step.state === 'done' && 'is-done',
            step.state === 'current' && 'is-current',
          )}
          aria-current={step.state === 'current' ? 'step' : undefined}
        >
          <span className="fa-step-n" aria-hidden="true">
            {step.state === 'done' ? <Glyph name="check" /> : index + 1}
          </span>
          <span className="fa-step-l">{step.label}</span>
          <span className="xr-sr">{stateWords[step.state]}</span>
        </li>
      ))}
    </ol>
  );
}

// ---- Authoring layout and form sections (P6) ---------------------------------------------------------

/** The authoring layout (`div.fa-author`: the form column and its side panel); `single` once done. */
export function FaAuthor({
  single,
  children,
}: {
  readonly single?: boolean;
  readonly children: ReactNode;
}) {
  return <div className={joinClasses('fa-author', single && 'fa-author--one')}>{children}</div>;
}

/**
 * The form column (`section.rk-surface.fa-formcol[aria-labelledby]`); `bare` (FA-16): a plain
 * `div.fa-formcol` holding surfaces of its own. `as="form"` draws the column as the form itself
 * (`form.rk-surface.fa-formcol[aria-labelledby][novalidate]`, so Enter submits; FA-15's editor),
 * or with `bare` a draft card's review fields (`form.fa-formcol[aria-labelledby]`, no surface).
 */
export function FaFormColumn({
  labelledBy,
  bare,
  as,
  onSubmit,
  children,
}: {
  readonly labelledBy?: string;
  readonly bare?: boolean;
  readonly as?: 'form';
  readonly onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  readonly children: ReactNode;
}) {
  if (as === 'form') {
    return (
      <form
        className={joinClasses(!bare && 'rk-surface', 'fa-formcol')}
        aria-labelledby={labelledBy}
        noValidate
        onSubmit={onSubmit}
      >
        {children}
      </form>
    );
  }
  return bare ? (
    <div className="fa-formcol">{children}</div>
  ) : (
    <section className="rk-surface fa-formcol" aria-labelledby={labelledBy}>
      {children}
    </section>
  );
}

/** The messages at the form's top (`div.fa-fmsg`); `stack`: several, one under another. */
export function FaFormMessages({
  stack,
  children,
}: {
  readonly stack?: boolean;
  readonly children: ReactNode;
}) {
  return <div className={joinClasses('fa-fmsg', stack && 'fa-fmsg--stack')}>{children}</div>;
}

export interface FaFormSectionProps {
  /** The section's heading (`h2|h3.fa-fsec-t`). */
  readonly title?: ReactNode;
  readonly titleId?: string;
  readonly headingLevel?: 2 | 3;
  /** A named group of fields (`role="group"`, named by the heading). */
  readonly group?: boolean;
  /** `tint`: "Other ways to add questions"; `warn`: what saving changes. */
  readonly tone?: 'tint' | 'warn';
  readonly children: ReactNode;
}

/** A form section (`div.fa-fsec`) with its heading. */
export function FaFormSection({
  title,
  titleId,
  headingLevel = 2,
  group,
  tone,
  children,
}: FaFormSectionProps) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  return (
    <div
      className={joinClasses('fa-fsec', tone && `fa-fsec--${tone}`)}
      role={group ? 'group' : undefined}
      aria-labelledby={group ? titleId : undefined}
    >
      {title ? (
        <Heading className="fa-fsec-t" id={titleId}>
          {title}
        </Heading>
      ) : null}
      {children}
    </div>
  );
}

/** The form's foot (`div.fa-formfoot`): Cancel / Back on the left, the primary on the right. */
export function FaFormFoot({
  start,
  end,
}: {
  readonly start?: ReactNode;
  readonly end: ReactNode;
}) {
  return (
    <div className="fa-formfoot">
      <div className="fa-formfoot-l">{start}</div>
      <div className="fa-formfoot-r">{end}</div>
    </div>
  );
}

/** The side panel (`aside.fa-side[aria-labelledby]` > `div.rk-surface`): `FaSideSection`s. */
export function FaSide({
  labelledBy,
  children,
}: {
  readonly labelledBy: string;
  readonly children: ReactNode;
}) {
  return (
    <aside className="fa-side" aria-labelledby={labelledBy}>
      <div className="rk-surface">{children}</div>
    </aside>
  );
}

/** A side panel's section (`div.fa-side-sec`). */
export function FaSideSection({ children }: { readonly children: ReactNode }) {
  return <div className="fa-side-sec">{children}</div>;
}

export interface FaChoice<Value extends string> {
  readonly value: Value;
  readonly title: ReactNode;
  /** The consequence line (`span.rk-choice-d`), in the radio's description. */
  readonly description?: ReactNode;
}

export interface FaChoiceGroupProps<Value extends string> {
  /** The question (`legend`) and its quiet line (`legend > span`). */
  readonly legend: ReactNode;
  readonly legendHint?: ReactNode;
  /** The fieldset id (an error-summary target) and the base of the option ids (`<id>-<value>`). */
  readonly id: string;
  readonly name: string;
  readonly options: readonly FaChoice<Value>[];
  readonly value: Value | null;
  readonly onChange: (value: Value) => void;
  readonly error?: ReactNode;
}

/**
 * Radio cards in three columns (`fieldset.rk-fieldset` > `legend` + `div.rk-choices.fa-choices3`;
 * FA-07 and FA-10 "When students see their result and answers", FA-15 "Question type"): as the
 * kit's `ChoiceGroup`, each radio named by its title and described by its line; the error in the
 * fieldset's description, 10 px under the cards (`p.rk-ferr.rk-x-ferr-above`, V3P-13: every group
 * error the export draws carries that inline `margin-top`).
 */
export function FaChoiceGroup<Value extends string>({
  legend,
  legendHint,
  id,
  name,
  options,
  value,
  onChange,
  error,
}: FaChoiceGroupProps<Value>) {
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
      <div className="rk-choices fa-choices3">
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          const titleId = `${optionId}-t`;
          const descriptionId = option.description ? `${optionId}-d` : undefined;
          return (
            <label key={option.value} className="rk-choice" htmlFor={optionId}>
              <input
                type="radio"
                id={optionId}
                name={name}
                checked={value === option.value}
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                onChange={() => onChange(option.value)}
              />
              <span className="rk-choice-t" id={titleId}>
                {option.title}
              </span>
              {option.description ? (
                <span className="rk-choice-d" id={descriptionId}>
                  {option.description}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
      {error ? (
        <p className="rk-ferr rk-x-ferr-above" id={errorId}>
          <Glyph name="alertCircle" />
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/**
 * The finished step (`div.fa-fsec.rk-done.fa-result[tabIndex=-1]`; FA-07 created, FA-17
 * imported): it takes focus; its content, then the actions (`div.fa-actions`).
 */
export function FaResult({
  id,
  resultRef,
  children,
  actions,
}: {
  readonly id: string;
  readonly resultRef?: Ref<HTMLDivElement>;
  readonly children: ReactNode;
  readonly actions?: ReactNode;
}) {
  return (
    <div className="fa-fsec rk-done fa-result" id={id} ref={resultRef} tabIndex={-1}>
      {children}
      {actions ? <FaActions>{actions}</FaActions> : null}
    </div>
  );
}

/** The result's line (`p.fa-result-t`): "Heat Exchanger — post-lab is ready for students." */
export function FaResultText({
  id,
  textRef,
  children,
}: {
  /** FA-17's confirmation takes focus (`tabIndex=-1`). */
  readonly id?: string;
  readonly textRef?: Ref<HTMLParagraphElement>;
  readonly children: ReactNode;
}) {
  return (
    <p className="fa-result-t" id={id} ref={textRef} tabIndex={id || textRef ? -1 : undefined}>
      {children}
    </p>
  );
}

// ---- Questions ---------------------------------------------------------------------------------------

export interface FaQuestionHeadProps {
  /** "From your question bank", "Drafts to review", "Questions in order". */
  readonly title: ReactNode;
  readonly titleId?: string;
  /** The heading takes focus (`tabIndex=-1`: a record tab's heading). */
  readonly focusable?: boolean;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** What follows the heading in its column: the hint (`p.rk-hint`), FA-09's count. */
  readonly children?: ReactNode;
  /** The right side: the picked count (`FaPickCount`) or FA-09's add actions. */
  readonly aside?: ReactNode;
}

/** A question list's head (`div.fa-qhead` > `div.fa-qhead-t` + the right side; FA-07, FA-09, FA-14). */
export function FaQuestionHead({
  title,
  titleId,
  focusable,
  titleRef,
  children,
  aside,
}: FaQuestionHeadProps) {
  return (
    <div className="fa-qhead">
      <div className="fa-qhead-t">
        <h2
          className="rb-h2"
          id={titleId}
          ref={titleRef}
          tabIndex={focusable || titleRef ? -1 : undefined}
        >
          {title}
        </h2>
        {children}
      </div>
      {aside}
    </div>
  );
}

/** The picked count (`p.rk-count.fa-pickcount[role=status]`): "4 questions · 16 marks". */
export function FaPickCount({ children }: { readonly children: ReactNode }) {
  return (
    <p className="rk-count fa-pickcount" role="status">
      {children}
    </p>
  );
}

/** A question's words (`p.fa-qt`; in a table cell `span.fa-qt.fa-cellline`). */
export function FaQuestionText({
  inCell,
  children,
}: {
  readonly inCell?: boolean;
  readonly children: ReactNode;
}) {
  return inCell ? (
    <span className="fa-qt fa-cellline">{children}</span>
  ) : (
    <p className="fa-qt">{children}</p>
  );
}

export interface FaQuestionMetaProps {
  /** The type's words (`span.fa-qtype`): "Multiple choice", "Written answer". */
  readonly type: ReactNode;
  /** A written answer (`fa-qtype--w`: the marked-by-you tint). */
  readonly written?: boolean;
  /** In a table cell (`span.fa-qmeta`) rather than a paragraph (`p.fa-qmeta`). */
  readonly inCell?: boolean;
  /** After the type: `FaQuestionMarks`, `FaId`, … */
  readonly children?: ReactNode;
}

/** A question's type and marks line (`p|span.fa-qmeta` > `span.fa-qtype` + the rest). */
export function FaQuestionMeta({ type, written, inCell, children }: FaQuestionMetaProps) {
  const Element = inCell ? 'span' : 'p';
  return (
    <Element className="fa-qmeta">
      <span className={joinClasses('fa-qtype', written && 'fa-qtype--w')}>{type}</span>
      {children}
    </Element>
  );
}

/** A question's marks (`span.fa-qmeta-m`); `phoneOnly` (`fa-mob`): the bank's phone row. */
export function FaQuestionMarks({
  phoneOnly,
  children,
}: {
  readonly phoneOnly?: boolean;
  readonly children: ReactNode;
}) {
  return <span className={joinClasses(phoneOnly && 'fa-mob', 'fa-qmeta-m')}>{children}</span>;
}

/** The quiet identifier (`span.fa-id`): a version or the institution's student ID — never an internal id. */
export function FaId({ children }: { readonly children: ReactNode }) {
  return <span className="fa-id">{children}</span>;
}

/** A neutral tag (`span.fa-tag`), with the tick when `checked`: "From a draft you reviewed". */
export function FaTag({
  checked,
  children,
}: {
  readonly checked?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <span className="fa-tag">
      {checked ? <Glyph name="check" /> : null}
      {children}
    </span>
  );
}

// ---- Results, marking guidance and the sheet's question head --------------------------------------

/**
 * A result mark (`span.fa-res.fa-res--ok|--no` with its glyph): FA-12 "Released …" (tick) / "Not
 * yet …" (clock); FA-19's automatic marks: right (tick) / wrong (`close`).
 */
export function FaResultMark({
  outcome,
  icon,
  children,
}: {
  readonly outcome: 'ok' | 'no';
  /** The glyph; by default a tick when `ok`, the clock when `no`. */
  readonly icon?: V3IconName;
  readonly children: ReactNode;
}) {
  return (
    <span className={joinClasses('fa-res', outcome === 'ok' ? 'fa-res--ok' : 'fa-res--no')}>
      <Glyph name={icon ?? (outcome === 'ok' ? 'check' : 'clock')} />
      {children}
    </span>
  );
}

/** The marking guidance (`div.fa-guide` > the lock and "Marking guidance · only you see this", the words). */
export function FaGuide({
  label,
  children,
}: {
  readonly label: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className="fa-guide">
      <p className="fa-guide-k">
        <Glyph name="lock" />
        {label}
      </p>
      <p className="fa-guide-t">{children}</p>
    </div>
  );
}

/**
 * A sheet question's head: the question's place and its marks (`.fa-sheetq-h` >
 * `.fa-sheetq-k` + `.fa-sheetq-m`). FA-11's preview: a line (`p` > `span` + `span`); FA-19's
 * reading sheet, with `headingId`: the question's heading (`div` > `h2#id` + `p`).
 */
export function FaSheetQuestionHead({
  head,
  marks,
  headingId,
}: {
  readonly head: ReactNode;
  readonly marks: ReactNode;
  readonly headingId?: string;
}) {
  return headingId ? (
    <div className="fa-sheetq-h">
      <h2 className="fa-sheetq-k" id={headingId}>
        {head}
      </h2>
      <p className="fa-sheetq-m">{marks}</p>
    </div>
  ) : (
    <p className="fa-sheetq-h">
      <span className="fa-sheetq-k">{head}</span>
      <span className="fa-sheetq-m">{marks}</span>
    </p>
  );
}

// ---- Checklist and resources -------------------------------------------------------------------------

export interface FaChecklistItem {
  readonly key: string;
  readonly text: ReactNode;
  /** Done (`li.is-ok`, the tick) or to do (`li.is-no`, the clock). */
  readonly done: boolean;
  /** Another glyph (FA-17's warning line: `infoDisc`). */
  readonly icon?: V3IconName;
}

/**
 * A checklist (`ul.fa-check[aria-label]` > `li.is-ok|is-no` > glyph + words; FA-05 learning
 * outcomes, FA-07 and FA-08 "Ready checklist", FA-17 "What importing does"); `side`: in a side
 * panel (`fa-sidecheck`); `flush`: no space above, right under a result line (`rk-x-check-flush`,
 * V3P-17: FA-07's created result, FA-17's confirm step).
 */
export function FaChecklist({
  label,
  items,
  side,
  flush,
}: {
  readonly label: string;
  readonly items: readonly FaChecklistItem[];
  readonly side?: boolean;
  readonly flush?: boolean;
}) {
  return (
    <ul
      className={joinClasses('fa-check', side && 'fa-sidecheck', flush && 'rk-x-check-flush')}
      aria-label={label}
    >
      {items.map((item) => (
        <li key={item.key} className={item.done ? 'is-ok' : 'is-no'}>
          <Glyph name={item.icon ?? (item.done ? 'check' : 'clock')} />
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

export interface FaResource {
  readonly key: string;
  readonly title: ReactNode;
  /** FA-21: whether the student opened it, in words; `opened` sets its tone (`rk-next` / `fa-quiet`). */
  readonly status?: { readonly words: ReactNode; readonly opened: boolean };
}

/**
 * Resources (`ul.fa-reslist` > `li` > the file glyph + the title; FA-05 "Resources students see").
 * With statuses it is FA-21's list (`fa-reslist--status`): the title, then whether it was opened.
 * (The export's `span.fa-res-t` around FA-21's title is defined by no sheet; the title is a plain
 * `span`.)
 */
export function FaResourceList({
  label,
  resources,
}: {
  readonly label?: string;
  readonly resources: readonly FaResource[];
}) {
  const withStatus = resources.some((resource) => resource.status !== undefined);
  return (
    <ul
      className={joinClasses('fa-reslist', withStatus && 'fa-reslist--status')}
      aria-label={label}
    >
      {resources.map((resource) => (
        <li key={resource.key}>
          <Glyph name="file" />
          <span>{resource.title}</span>
          {resource.status ? (
            <span className={resource.status.opened ? 'rk-next' : 'fa-quiet'}>
              {resource.status.words}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

// ---- Helpers ----------------------------------------------------------------------------------------

/** Quiet supporting words (`p|span.fa-quiet`): "No students yet. …". */
export function FaQuiet({
  inline,
  children,
}: {
  readonly inline?: boolean;
  readonly children: ReactNode;
}) {
  return inline ? (
    <span className="fa-quiet">{children}</span>
  ) : (
    <p className="fa-quiet">{children}</p>
  );
}

/**
 * A row of actions (`div.fa-actions`); `apart`: 16 px under what is above it
 * (`rk-x-actions-above`, V3P-17: FA-08's "Add questions" under the ready checklist).
 */
export function FaActions({
  apart,
  children,
}: {
  readonly apart?: boolean;
  readonly children: ReactNode;
}) {
  return <div className={joinClasses('fa-actions', apart && 'rk-x-actions-above')}>{children}</div>;
}

/** A small label (`p.fa-k`, or `span` / `h3`): "Other ways to add questions", "Deleted". */
export function FaKey({
  as = 'p',
  id,
  children,
}: {
  readonly as?: 'p' | 'span' | 'h3';
  readonly id?: string;
  readonly children: ReactNode;
}) {
  const Element = as;
  return (
    <Element className="fa-k" id={id}>
      {children}
    </Element>
  );
}
