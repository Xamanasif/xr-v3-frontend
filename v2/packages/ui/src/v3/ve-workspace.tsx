'use client';

/*
 * The Vendor role's own patterns for VE-01 Overview and VE-02 My experiments (`ve-` and `vr-` classes;
 * the owner-approved Vendor export, design/v3-refined-b/roles/VE-v1, `project/v3-vendor.css` and
 * its COMPONENT-EXTENSIONS.md). Markup as the export's `Main.dc.html` draws it. Every word, figure,
 * date and destination comes from the caller.
 */

import {
  useLayoutEffect,
  useRef,
  type ChangeEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';

import type { FormatCode } from '../icons/registry.js';
import { useLinkComponent } from '../link.js';
import { ButtonLink } from './actions.js';
import { FormatBadges } from './formats.js';
import { Glyph, V3_ICON_PATHS, type V3IconName } from './icons.js';
import { CalmState } from './overview.js';
import { StatusPill, type StatusTone } from './status.js';
import { scrollCurrentIntoView } from './tabs.js';

/** A link drawn as a button, with the accessible name its row needs. */
export interface VendorAction {
  readonly href: string;
  readonly label: ReactNode;
  /** The full name where the visible words need their object ("Finish the draft of …"). */
  readonly accessibleName?: string;
}

// ── VE-01 Overview ───────────────────────────────────────────────────────────────────────────

/**
 * The overview's column (`div.vr-ov`): the studio band, then the work split or the first-visit
 * surface. Below 760 px the band's counts move after the attention panel (the export's container
 * rules), so Revise is on the first screen of a phone.
 */
export function VendorOverviewColumn({ children }: { readonly children: ReactNode }) {
  return <div className="vr-ov">{children}</div>;
}

export interface VendorFigure {
  /** The count, from the application's records (never a constant). */
  readonly value: ReactNode;
  /** What it counts (`dt.rb-fig-t`): "With you". */
  readonly title: ReactNode;
  /** Its line (`dd.rb-fig-s`): "1 returned · 1 draft". */
  readonly detail: ReactNode;
}

export interface VendorStudioBandProps {
  /** The studio's name, the page's H1 (`h1.rb-id-name`). */
  readonly title: ReactNode;
  readonly titleId: string;
  /** Takes focus with the route and after Try again (`tabIndex={-1}`). */
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** Visually hidden words before the name, so the H1 says the page: "Overview, ". */
  readonly titlePrefix?: string;
  /** Today in words (`p.rb-eyebrow-date`; shown on phones, where the top line hides it). */
  readonly date?: ReactNode;
  /** The course line (`p.rb-id-status > span`): "Your course: ME ZG523 · Thermodynamics …". */
  readonly status?: ReactNode;
  /** "Create experiment" (`div.rb-id-act > a.rb-btn.rb-btn--lg` with the add glyph). */
  readonly action?: VendorAction;
  /** The four counts (`dl.rb-figs.vr-figs`), named by `figuresLabel`; none before any record. */
  readonly figures?: readonly VendorFigure[];
  readonly figuresLabel?: string;
}

/**
 * The studio band (`div.vr-herocard` > `section.rb-id.vr-hero` + `dl.rb-figs.vr-figs`): the
 * studio's name, its course line, Create experiment and the counts under a rule.
 */
export function VendorStudioBand({
  title,
  titleId,
  titleRef,
  titlePrefix,
  date,
  status,
  action,
  figures = [],
  figuresLabel,
}: VendorStudioBandProps) {
  return (
    <div className="vr-herocard">
      <section className="rb-id vr-hero" aria-labelledby={titleId}>
        <div className="rb-id-top">
          <div className="rb-id-text">
            {date ? <p className="rb-eyebrow-date">{date}</p> : null}
            <h1 className="rb-id-name" id={titleId} ref={titleRef} tabIndex={-1}>
              {titlePrefix ? <span className="xr-sr">{titlePrefix}</span> : null}
              {title}
            </h1>
            {status ? (
              <p className="rb-id-status">
                <span>{status}</span>
              </p>
            ) : null}
          </div>
          {action ? (
            <div className="rb-id-act">
              <ButtonLink
                href={action.href}
                size="lg"
                icon="add"
                aria-label={action.accessibleName}
              >
                {action.label}
              </ButtonLink>
            </div>
          ) : null}
        </div>
      </section>
      {figures.length > 0 ? (
        <dl className="rb-figs vr-figs" aria-label={figuresLabel}>
          {figures.map((figure, index) => (
            <div key={index} className="rb-fig">
              <dt className="rb-fig-t">{figure.title}</dt>
              <dd className="rb-fig-n">{figure.value}</dd>
              <dd className="rb-fig-s">{figure.detail}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

/** The two panels side by side on wide pages (`div.rb-split.vr-split`), one column below 940 px. */
export function VendorWorkSplit({ children }: { readonly children: ReactNode }) {
  return <div className="rb-split vr-split">{children}</div>;
}

export interface VendorLeadItem {
  /** The kind in gold (`p.vr-kind`): "Returned to you". */
  readonly kind: ReactNode;
  /** The experiment's name (`p.rb-lead-t`). */
  readonly title: ReactNode;
  /** Who and when (`p.vr-lead-meta`): "Academic Reviewer · Prof. A. Menon · 24 Aug 2026". */
  readonly meta: ReactNode;
  /** The reason in their words, in full (`blockquote.vr-lead-q`). */
  readonly reason: ReactNode;
  /** What it refers to (`ul.vr-reflist > li.vr-ref`), with its label ("Refers to"). */
  readonly references?: { readonly label: ReactNode; readonly items: readonly string[] };
  /** "Your changes are saved, not resubmitted. …" (`p.vr-lead-pend`, with the lock glyph). */
  readonly pending?: ReactNode;
  /** "Revise “Forced Convection”": the page's one gold action. */
  readonly action: VendorAction;
}

export interface VendorAttentionRow {
  readonly key: string;
  /** The tile's glyph: `returned` for a further returned item, `edit` for a draft. */
  readonly icon: Extract<V3IconName, 'returned' | 'edit'>;
  /** "Returned to you", "Draft to finish" (`span.vr-kind`). */
  readonly kind: ReactNode;
  readonly title: ReactNode;
  /** "Saved at step 2 of 4 · 25 Aug 2026 · only you can see it" (`p.rb-ai-d`). */
  readonly detail: ReactNode;
  /** The row's action; `primary` (gold) only when nothing leads. */
  readonly action: VendorAction & { readonly primary?: boolean };
}

export interface VendorAttentionProps {
  /** "Needs your action". */
  readonly title: ReactNode;
  readonly titleId: string;
  /** "2 items", "Nothing waiting" (`p.rb-note`). */
  readonly note?: ReactNode;
  /** The returned item that leads, in ivory (`div.rb-lead.vr-lead`). */
  readonly lead?: VendorLeadItem;
  /** Further returned items and the drafts to finish (`ul.vr-ai-list > li.rb-ai.vr-ai`). */
  readonly rows?: readonly VendorAttentionRow[];
  /** Nothing needs the Vendor: the calm block (`div.rb-calm`), its title and line. */
  readonly calm?: { readonly title: ReactNode; readonly line: ReactNode };
}

/** "Needs your action" (`section.rb-panel.rb-att`): the lead, the further items, or calm. */
export function VendorAttention({
  title,
  titleId,
  note,
  lead,
  rows = [],
  calm,
}: VendorAttentionProps) {
  return (
    <section className="rb-panel rb-att" aria-labelledby={titleId}>
      <div className="rb-att-head">
        <h2 className="rb-h2" id={titleId}>
          {title}
        </h2>
        {note ? <p className="rb-note">{note}</p> : null}
      </div>
      {lead ? <LeadItem lead={lead} /> : null}
      {rows.length > 0 ? (
        <ul className="vr-ai-list">
          {rows.map((row) => (
            <li key={row.key} className="rb-ai vr-ai">
              <span className="rb-ai-n" aria-hidden="true">
                <span className="rb-ico-tile">
                  <Glyph name={row.icon} />
                </span>
              </span>
              <p className="rb-ai-t">
                <span className="vr-kind">{row.kind}</span>
                {row.title}
              </p>
              <p className="rb-ai-d">{row.detail}</p>
              <div className="rb-ai-act">
                <ButtonLink
                  href={row.action.href}
                  variant={row.action.primary ? 'primary' : 'default'}
                  aria-label={row.action.accessibleName}
                >
                  {row.action.label}
                </ButtonLink>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {calm ? <CalmState title={calm.title}>{calm.line}</CalmState> : null}
    </section>
  );
}

function LeadItem({ lead }: { readonly lead: VendorLeadItem }) {
  const references = lead.references;
  return (
    <div className="rb-lead vr-lead">
      <span className="rb-lead-ico" aria-hidden="true">
        <Glyph name="returned" />
      </span>
      <div className="vr-lead-main">
        <p className="vr-kind">{lead.kind}</p>
        <p className="rb-lead-t">{lead.title}</p>
        <p className="vr-lead-meta">{lead.meta}</p>
        <blockquote className="vr-lead-q">{lead.reason}</blockquote>
        {references && references.items.length > 0 ? (
          <div className="vr-lead-refs">
            <span className="vr-lead-refs-k">{references.label}</span>
            <ul className="vr-reflist">
              {references.items.map((item, index) => (
                <li key={index} className="vr-ref">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {lead.pending ? (
          <p className="vr-lead-pend">
            <Glyph name="lock" />
            {lead.pending}
          </p>
        ) : null}
      </div>
      <div className="rb-lead-act">
        <ButtonLink
          href={lead.action.href}
          variant="primary"
          size="lg"
          aria-label={lead.action.accessibleName}
        >
          {lead.action.label}
        </ButtonLink>
      </div>
    </div>
  );
}

export interface VendorActivityRow {
  readonly key: string;
  /** What happened, in the history's words: "Submitted · revision 2". */
  readonly what: ReactNode;
  /** The experiment's name, a link to its record (`a.vr-rowlink`). */
  readonly name: ReactNode;
  readonly href: string;
  /** "Draft saved, Pin Fin Efficiency, 25 Aug 2026, 17:20. Open the experiment record". */
  readonly accessibleName: string;
  /** "26 Aug" or "Today", and the time "11:30" (`p.rb-row-when`). */
  readonly day: ReactNode;
  readonly time?: ReactNode;
}

export interface VendorRecentActivityProps {
  /** "Recent activity". */
  readonly title: ReactNode;
  readonly titleId: string;
  /** "Newest first": the order the caller applied. */
  readonly note?: ReactNode;
  readonly rows: readonly VendorActivityRow[];
  /** The foot's links (`div.vr-act-foot > a.rb-link`): "Changed in the last 7 days", "See all …". */
  readonly links?: readonly { readonly href: string; readonly label: ReactNode }[];
}

/** Recent activity (`section.rb-panel.vr-act`): the newest history entries, each opening its record. */
export function VendorRecentActivity({
  title,
  titleId,
  note,
  rows,
  links = [],
}: VendorRecentActivityProps) {
  const Link = useLinkComponent();
  return (
    <section className="rb-panel vr-act" aria-labelledby={titleId}>
      <div className="vr-act-head">
        <h2 className="rb-h2" id={titleId}>
          {title}
        </h2>
        {note ? <p className="rb-note">{note}</p> : null}
      </div>
      {rows.length > 0 ? (
        <ul className="rb-rows vr-rows">
          {rows.map((row) => (
            <li key={row.key} className="rb-row">
              <div className="rb-row-main">
                <p className="rb-row-t">{row.what}</p>
                <p className="rb-row-d">
                  <Link className="vr-rowlink" href={row.href} aria-label={row.accessibleName}>
                    {row.name}
                  </Link>
                </p>
              </div>
              <p className="rb-row-when">
                <b>{row.day}</b>
                {row.time ? <span>{row.time}</span> : null}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
      {links.length > 0 ? (
        <div className="vr-act-foot">
          {links.map((link, index) => (
            <Link key={index} className="rb-link" href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

// ── VE-02 My experiments ─────────────────────────────────────────────────────────────────────

export interface VendorStatusTab<Key extends string> {
  readonly key: Key;
  readonly label: string;
  /** The experiments it holds under the search and the 7-day filter (`b`, hidden from the name). */
  readonly count: number;
  /** The button's name: "Returned, 1 experiment". */
  readonly accessibleName: string;
}

export interface VendorStatusTabsProps<Key extends string> {
  /** "Show experiments by status". */
  readonly label: string;
  readonly tabs: readonly VendorStatusTab<Key>[];
  readonly value: Key;
  readonly onChange: (key: Key) => void;
}

/**
 * The status tabs with counts (`div.rb-switchbar.vr-switchbar` > `div.rb-switch[role=group]` >
 * `button[aria-pressed]`). Where the row scrolls sideways (narrow widths), the pressed tab is
 * scrolled into sight, 16 px from the start, as the kit's other switches do.
 */
export function VendorStatusTabs<Key extends string>({
  label,
  tabs,
  value,
  onChange,
}: VendorStatusTabsProps<Key>) {
  const groupRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    scrollCurrentIntoView(groupRef.current, '[aria-pressed="true"]');
  }, [value]);
  return (
    <div className="rb-switchbar vr-switchbar">
      <div ref={groupRef} className="rb-switch" role="group" aria-label={label}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            aria-pressed={tab.key === value}
            aria-label={tab.accessibleName}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
            <b aria-hidden="true">{tab.count}</b>
          </button>
        ))}
      </div>
    </div>
  );
}

/** The list's surface (`section.rk-surface.vr-list`), the container its rows' layout follows. */
export function VendorListSurface({
  label,
  busy,
  children,
}: {
  /** "Your experiments". */
  readonly label: string;
  readonly busy?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <section className="rk-surface vr-list" aria-label={label} aria-busy={busy || undefined}>
      {children}
    </section>
  );
}

export type VendorSortDirection = 'asc' | 'desc';

export interface VendorSort {
  readonly direction: VendorSortDirection;
  /** The order in words, per direction: { desc: 'newest first', asc: 'oldest first' }. */
  readonly words: Readonly<Record<VendorSortDirection, string>>;
  /** "Sort: " before the order on the narrow sort button. */
  readonly prefix: string;
  /** ". Change order", read after the order. */
  readonly changeOrder: string;
  readonly onToggle: () => void;
}

function SortArrow({ direction }: { readonly direction: VendorSortDirection }) {
  return <Glyph name={direction === 'desc' ? 'arrowDown' : 'arrowUp'} />;
}

export interface VendorListToolsProps {
  /** The search landmark's name: "Search your experiments". */
  readonly label: string;
  readonly search: {
    readonly id: string;
    /** Read by assistive technology only (`label.xr-sr`): "Search by name or course". */
    readonly label: string;
    readonly placeholder?: string;
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly ref?: Ref<HTMLInputElement>;
  };
  /** "Changed in the last 7 days" (`label.vr-toggle` with its checkbox). */
  readonly toggle: {
    readonly id: string;
    readonly label: string;
    readonly checked: boolean;
    readonly onChange: (checked: boolean) => void;
  };
  /** "6 experiments", "1 of 6 experiments" — announced; left out while the list loads. */
  readonly count?: ReactNode;
  /** "Clear filters" (`button.rk-clear`), while a filter is applied. */
  readonly clear?: { readonly label: string; readonly onClick: () => void };
  /**
   * The narrow-width sort button (`div.rk-sortbar.vr-sortnarrow`), shown below 760 px. Both sort
   * buttons are named whole (“Sort: newest first. Change order”), as the kit's `RecordTable` names
   * its own: the export's hidden words after the arrow read with a stray space in Chromium.
   */
  readonly sort?: VendorSort;
}

/**
 * One tool row (`div.vr-tools[role=search]`): the search, the 7-day filter, then on the right the
 * count, Clear filters and, below 760 px, the sort button.
 */
export function VendorListTools({
  label,
  search,
  toggle,
  count,
  clear,
  sort,
}: VendorListToolsProps) {
  return (
    <div className="vr-tools" role="search" aria-label={label}>
      <div className="vr-search">
        <label className="xr-sr" htmlFor={search.id}>
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
            onChange={(event: ChangeEvent<HTMLInputElement>) => search.onChange(event.target.value)}
          />
        </div>
      </div>
      <label className="vr-toggle" htmlFor={toggle.id}>
        <input
          type="checkbox"
          id={toggle.id}
          checked={toggle.checked}
          onChange={(event) => toggle.onChange(event.target.checked)}
        />
        <span>{toggle.label}</span>
      </label>
      <div className="vr-tools-r">
        {count !== undefined ? (
          <p className="rk-count" role="status">
            {count}
          </p>
        ) : null}
        {clear ? (
          <button type="button" className="rk-clear" onClick={clear.onClick}>
            {clear.label}
          </button>
        ) : null}
        {sort ? (
          <div className="rk-sortbar vr-sortnarrow">
            <button
              type="button"
              className="rk-sortbtn"
              aria-label={`${sort.prefix}${sort.words[sort.direction]}${sort.changeOrder}`}
              onClick={sort.onToggle}
            >
              <span>
                {sort.prefix}
                {sort.words[sort.direction]}
              </span>
              <SortArrow direction={sort.direction} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export interface VendorExperimentRow {
  readonly key: string;
  /** The record: the name's link, and a press anywhere on the row, go there. */
  readonly href: string;
  readonly name: ReactNode;
  /** "Forced Convection, Returned, last change 24 Aug 2026. Open the experiment record". */
  readonly accessibleName: string;
  /**
   * Under the name (`span.vr-meta`): an identifier, then " · " and the course when known. Optional:
   * without it the line is the course alone, and without either it is left out (a page that never
   * shows an internal reference passes the course only).
   */
  readonly id?: ReactNode;
  readonly course?: ReactNode;
  readonly formats: readonly FormatCode[];
  /** "Formats: WEB, AR". */
  readonly formatsLabel: string;
  readonly status: { readonly tone: StatusTone; readonly label: ReactNode };
  /** The one plain line under the pill (`span.vr-stsub`): "By the Academic Reviewer on 24 Aug". */
  readonly statusLine?: ReactNode;
  /** "Changes saved, not resubmitted" (`span.vr-pending`, with the lock glyph). */
  readonly pending?: ReactNode;
  /** The last change, "24 Aug 2026" (`span.vr-dated`). */
  readonly lastChange: ReactNode;
  /** Revise or Edit draft (`a.rb-btn.vr-rowbtn`); without one the row shows its chevron. */
  readonly action?: VendorAction;
}

export interface VendorExperimentTableProps {
  /** "Your experiments": the order is added to it (visually hidden caption). */
  readonly caption: string;
  readonly headers: {
    readonly experiment: string;
    readonly formats: string;
    readonly status: string;
    readonly lastChange: string;
    readonly action: string;
  };
  /** The last change's order: its head button (wide) — the tool row holds the narrow one. */
  readonly sort: VendorSort;
  /** The last change's label in the three-line rows below 760 px: "Last change". */
  readonly lastChangeLabel: string;
  readonly rows: readonly VendorExperimentRow[];
}

const INTERACTIVE = 'a, button, input, select, textarea, label, summary, [tabindex]';

/**
 * The experiment table (`table.vr-table`): Experiment · Formats · Status · Last change (sortable)
 * · one action column; three-line rows below 760 px of list width with a labelled last change.
 * Explicit table roles keep the table's semantics when the narrow layout changes the cells'
 * display (as the kit's `RecordTable`, ADR-0010); a press anywhere on a row opens its record.
 */
export function VendorExperimentTable({
  caption,
  headers,
  sort,
  lastChangeLabel,
  rows,
}: VendorExperimentTableProps) {
  const words = sort.words[sort.direction];
  return (
    <div>
      <table className="vr-table" role="table">
        <caption className="xr-sr">{`${caption}, ${headers.lastChange.toLowerCase()}, ${words}`}</caption>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader" className="vr-c-exp">
              {headers.experiment}
            </th>
            <th scope="col" role="columnheader" className="vr-c-fmt">
              {headers.formats}
            </th>
            <th scope="col" role="columnheader" className="vr-c-st">
              {headers.status}
            </th>
            <th
              scope="col"
              role="columnheader"
              className="vr-c-date"
              aria-sort={sort.direction === 'desc' ? 'descending' : 'ascending'}
            >
              <button
                type="button"
                className="rk-sortbtn"
                aria-label={`${headers.lastChange}, ${words}${sort.changeOrder}`}
                onClick={sort.onToggle}
              >
                {headers.lastChange}
                <SortArrow direction={sort.direction} />
              </button>
            </th>
            <th scope="col" role="columnheader" className="vr-c-act">
              <span className="xr-sr">{headers.action}</span>
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((row) => (
            <ExperimentRow key={row.key} row={row} lastChangeLabel={lastChangeLabel} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExperimentRow({
  row,
  lastChangeLabel,
}: {
  readonly row: VendorExperimentRow;
  readonly lastChangeLabel: string;
}) {
  const Link = useLinkComponent();
  const linkRef = useRef<HTMLAnchorElement>(null);
  // A press anywhere on the row follows its link — not on another control of the row, and not
  // when the press ended a text selection.
  const onRowClick = (event: MouseEvent<HTMLTableRowElement>) => {
    const target = event.target;
    const control = target instanceof Element ? target.closest(INTERACTIVE) : null;
    if (control && event.currentTarget.contains(control)) return;
    if (window.getSelection()?.toString()) return;
    linkRef.current?.click();
  };
  return (
    <tr role="row" onClick={onRowClick}>
      <td role="cell" className="vr-c-exp">
        <Link
          ref={linkRef}
          className="rk-rowlink vr-name"
          href={row.href}
          aria-label={row.accessibleName}
        >
          {row.name}
        </Link>
        {row.id ? (
          <span className="vr-meta">
            <span>{row.id}</span>
            {row.course ? <> · {row.course}</> : null}
          </span>
        ) : row.course ? (
          <span className="vr-meta">{row.course}</span>
        ) : null}
      </td>
      <td role="cell" className="vr-c-fmt">
        <FormatBadges formats={row.formats} label={row.formatsLabel} />
      </td>
      <td role="cell" className="vr-c-st">
        <StatusPill tone={row.status.tone}>{row.status.label}</StatusPill>
        {row.statusLine ? <span className="vr-stsub">{row.statusLine}</span> : null}
        {row.pending ? (
          <span className="vr-pending">
            <Glyph name="lock" />
            {row.pending}
          </span>
        ) : null}
      </td>
      <td role="cell" className="vr-c-date">
        <span className="vr-datek">{`${lastChangeLabel} `}</span>
        <span className="vr-dated">{row.lastChange}</span>
      </td>
      <td role="cell" className="vr-c-act">
        {row.action ? (
          <ButtonLink
            href={row.action.href}
            className="vr-rowbtn"
            aria-label={row.action.accessibleName}
          >
            {row.action.label}
          </ButtonLink>
        ) : (
          <svg className="vr-chev" viewBox="0 0 24 24" aria-hidden="true">
            <path d={V3_ICON_PATHS.chevronRight} />
          </svg>
        )}
      </td>
    </tr>
  );
}
