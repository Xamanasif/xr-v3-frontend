'use client';

import { useLayoutEffect, useRef, type ReactNode, type Ref } from 'react';

import { joinClasses } from '../internal/classes.js';
import { useLinkComponent } from '../link.js';
import { Button, type ButtonProps } from './actions.js';
import { Icon, type V3IconName } from './icons.js';
import { scrollCurrentIntoView } from './tabs.js';

/*
 * The Super Admin role's own patterns (`sa-` classes; the owner-approved Super Admin export,
 * design/v3-refined-b/roles/SA-v1, `project/sa-role.css` and its COMPONENT-EXTENSIONS.md "New
 * role-level patterns") and the Super Admin markup more than one screen group draws, each once:
 * the screen groups' own modules (`sa-requests.tsx`, `sa-institutions.tsx`, `sa-structure.tsx`,
 * `sa-roles.tsx`, `sa-operations.tsx`) keep only what one group draws. Markup as the export's
 * views emit it. Every word, figure, date and destination comes from the caller.
 */

export interface SaMessageProps {
  /** The disc's glyph (the export's `rki-info` by default). */
  readonly icon?: V3IconName;
  /** The page's H1 ("This page isn’t available"). */
  readonly title: string;
  readonly titleId?: string;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** The sentence under it. */
  readonly children: ReactNode;
  /** The ways on (`div.sa-btnrow`): a primary button link, then text links. */
  readonly actions: ReactNode;
}

/**
 * The GL-04 message template (`div.sa-msg`; the export's `V.message`): a refusal or "not available"
 * page inside the Super Admin shell — the disc, the H1 that takes focus, one sentence, the ways on.
 */
export function SaMessage({
  icon = 'infoDisc',
  title,
  titleId = 'page-h1',
  titleRef,
  children,
  actions,
}: SaMessageProps) {
  return (
    <div className="sa-msg">
      <span className="sa-msg-ico" aria-hidden="true">
        <Icon name={icon} />
      </span>
      <h1 ref={titleRef} className="rk-title" id={titleId} tabIndex={-1}>
        {title}
      </h1>
      <p className="rk-sub">{children}</p>
      <div className="sa-btnrow">{actions}</div>
    </div>
  );
}

/** A row of buttons and links that wraps (`div.sa-btnrow`). */
export function ButtonRow({ children }: { readonly children: ReactNode }) {
  return <div className="sa-btnrow">{children}</div>;
}

export interface ActionGroupProps {
  /** The group's name (`p.sa-act-k`: "Institute Admin", "Access", "Move to another area"). */
  readonly label?: string;
  readonly children: ReactNode;
}

/**
 * One group of permitted actions inside a DecisionPanel that is not one decision (`div.sa-act`;
 * SA-07 "What you can do", SA-15 "Change this course"): its name, what stands, the actions.
 */
export function ActionGroup({ label, children }: ActionGroupProps) {
  return (
    <div className="sa-act">
      {label ? <p className="sa-act-k">{label}</p> : null}
      {children}
    </div>
  );
}

/** The value an action group shows (`p.sa-act-v`), with an optional second line. */
export function ActionValue({
  children,
  detail,
}: {
  readonly children: ReactNode;
  readonly detail?: ReactNode;
}) {
  return (
    <p className="sa-act-v">
      {children}
      {detail ? <span>{detail}</span> : null}
    </p>
  );
}

export interface WaitingItem {
  /** What waits ("A renewal request is under review"). */
  readonly text: string;
  readonly href: string;
  /** The link's words ("Open the request"). */
  readonly label: string;
}

/** What else waits for this record (`ul.sa-attn`), each with the link to it. */
export function WaitingList({ items }: { readonly items: readonly WaitingItem[] }) {
  const Link = useLinkComponent();
  return (
    <ul className="sa-attn">
      {items.map((item) => (
        <li key={`${item.href} ${item.text}`}>
          <span>{item.text}</span>
          <Link className="rb-link" href={item.href}>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export interface ReadOnlyCell {
  /** The cell's column name, read out above it once the table stacks (`td[data-label]`). */
  readonly label: string;
  readonly content: ReactNode;
  /** A figure (`td.xr-num`). */
  readonly numeric?: boolean;
  /** The proposed value of a comparison (`td.sa-compare-new`). */
  readonly proposed?: boolean;
}

export interface ReadOnlyRow {
  readonly key: string;
  /** The row's name (`th[scope=row]`). */
  readonly head: ReactNode;
  readonly cells: readonly ReadOnlyCell[];
}

export interface ReadOnlyTableProps {
  /** The table's name, for assistive technology only (`caption.xr-sr`). */
  readonly caption: string;
  /** The column names, the row-name column first. */
  readonly columns: readonly ReactNode[];
  readonly rows: readonly ReadOnlyRow[];
  /** A live / proposed comparison (`table.sa-compare`; SA-11 "What changes"). */
  readonly compare?: boolean;
}

/**
 * A read-only data table, not row-clickable (`div.sa-tablewrap` > `table.sa-table.sa-table--rows`;
 * SA-07 activity, SA-11 comparison and institutions, SA-22): under 640 px of its own width each row
 * stacks into labelled lines.
 */
export function ReadOnlyTable({ caption, columns, rows, compare }: ReadOnlyTableProps) {
  return (
    <div className="sa-tablewrap">
      <table className={joinClasses('sa-table', 'sa-table--rows', compare && 'sa-compare')}>
        <caption className="xr-sr">{caption}</caption>
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
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.head}</th>
              {row.cells.map((cell, index) => (
                <td
                  key={index}
                  className={joinClasses(
                    cell.numeric && 'xr-num',
                    cell.proposed && 'sa-compare-new',
                  )}
                  data-label={cell.label}
                >
                  {cell.content}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface RecordListRow {
  readonly key: string;
  readonly href: string;
  /** The record's name (`span.sa-list-t`). */
  readonly title: ReactNode;
  /** Its facts on one wrapping line (`span.sa-list-d`): a course code, a count, … */
  readonly details?: ReactNode;
}

/** Rows that open a record (`ul.sa-list` > `a.sa-list-row`; SA-14 areas and courses, SA-15). */
export function RecordList({ rows }: { readonly rows: readonly RecordListRow[] }) {
  const Link = useLinkComponent();
  return (
    <ul className="sa-list">
      {rows.map((row) => (
        <li key={row.key}>
          <Link className="sa-list-row" href={row.href}>
            <span className="sa-list-main">
              <span className="sa-list-t">{row.title}</span>
              {row.details ? <span className="sa-list-d">{row.details}</span> : null}
            </span>
            <span className="sa-list-go" aria-hidden="true">
              <Icon name="chevronRight" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** A quiet note under a section (`p.sa-footnote`). */
export function Footnote({ children }: { readonly children: ReactNode }) {
  return <p className="sa-footnote">{children}</p>;
}

/** A bulleted list of plain sentences (`ul.sa-bullets`). */
export function Bullets({ items }: { readonly items: readonly ReactNode[] }) {
  return (
    <ul className="sa-bullets">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

// ── Shared by several Super Admin screens (one component per pattern) ────────────────────────

export interface SwitchOption<Key extends string> {
  readonly key: Key;
  /** "Waiting for your decision", "Forwarded to BITS", "Open". */
  readonly label: string;
  /** The number the view holds (`b`); left out while it is not known. */
  readonly count?: number;
}

export interface SwitchToolbarProps<Key extends string> {
  /** The switch's name: "Show corrections", "Show device transfers", "Show support reports". */
  readonly label: string;
  readonly options: readonly SwitchOption<Key>[];
  readonly value: Key;
  readonly onChange: (key: Key) => void;
  /** The quiet line after the switch (`p.rk-hint`): "Sent from Help by anyone signed in · …". */
  readonly hint?: ReactNode;
}

/**
 * A list toolbar without a search, holding the segmented view switch (`div.rk-toolbar` >
 * `div.rb-switchbar.sa-seg` > `div.rb-switch[role=group]` > `button[aria-pressed]` with its count;
 * the export's `SA.seg`: SA-10 "Show corrections", SA-18 "Show device transfers", SA-20 "Show
 * support reports" with its hint). Where the switch scrolls sideways (a phone), the pressed view
 * is scrolled into sight, 16 px from the start, as the export's runtime does after each render.
 */
export function SwitchToolbar<Key extends string>({
  label,
  options,
  value,
  onChange,
  hint,
}: SwitchToolbarProps<Key>) {
  const groupRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    scrollCurrentIntoView(groupRef.current, '[aria-pressed="true"]');
  }, [value]);
  return (
    <div className="rk-toolbar">
      <div className="rb-switchbar sa-seg">
        <div ref={groupRef} className="rb-switch" role="group" aria-label={label}>
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={option.key === value}
              onClick={() => onChange(option.key)}
            >
              {option.label}
              {option.count === undefined ? null : (
                <>
                  {/* A space the flex layout does not draw: the name reads "On hold 1", not "On hold1". */}{' '}
                  <b>{option.count}</b>
                </>
              )}
            </button>
          ))}
        </div>
      </div>
      {hint ? <p className="rk-hint">{hint}</p> : null}
    </div>
  );
}

/**
 * A decision panel's one primary action, the full width of the panel (`button.rb-btn
 * .rb-btn--primary.rk-go`; the export's `#dc-go`, `#in-assign`, `#up-go`, `#up-lift`, `#rc-go`,
 * `#ho-go`, `#tr-go`, `#sp-go`): "Approve request", "Release update", "Assign scope", …
 */
export function GoButton(props: Omit<ButtonProps, 'variant' | 'className' | 'size' | 'block'>) {
  return <Button {...props} variant="primary" className="rk-go" />;
}

/**
 * The quiet note beside a section heading (the export's `p.rk-note`: "Newest first", "Changed
 * fields only", "Read-only", "Four separate events"). No V3 sheet defines `rk-note`, so the export
 * renders it as a plain paragraph in the heading row; it is emitted without the undefined class,
 * which looks the same (COMPONENT-EXTENSIONS O-1).
 */
export function SectionNote({ children }: { readonly children: ReactNode }) {
  return <p>{children}</p>;
}

export interface QuietLineProps {
  /**
   * Alone in a table cell, without `rk-small`'s 2 px above it (`rk-x-small-flush`, V3P-12): the
   * export's `style="margin:0"` on SA-12 "Who can act", SA-16's work e-mail, SA-18 "Forwarded by"
   * and SA-20 "Where".
   */
  readonly flush?: boolean;
  readonly children: ReactNode;
}

/**
 * A quiet line (`span.rk-small`): "Assigned once access is active", "External", "Nothing is sent
 * from here" under a status, a table cell's only line.
 */
export function QuietLine({ flush = false, children }: QuietLineProps) {
  return <span className={joinClasses('rk-small', flush && 'rk-x-small-flush')}>{children}</span>;
}

/**
 * The inline form under the row it changes (`div.sa-inline`; SA-07 a student's "Change status",
 * SA-17 a scope's "Withdraw"): the reason field, then its `ButtonRow`.
 */
export function InlineForm({ children }: { readonly children: ReactNode }) {
  return <div className="sa-inline">{children}</div>;
}
