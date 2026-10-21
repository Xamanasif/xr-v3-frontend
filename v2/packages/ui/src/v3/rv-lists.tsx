'use client';

import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';

import { joinClasses } from '../internal/classes.js';
import { useLinkComponent } from '../link.js';
import { ButtonLink } from './actions.js';
import { CourseCode, MissingTag } from './codes.js';
import { Field, SearchInput, Select, type SelectOption } from './fields.js';
import { Glyph } from './icons.js';
import { RvCourse, RvStatus } from './rv.js';

/*
 * What only the Academic Reviewer's lists draw — RV-01 Overview, RV-02 Review queue and RV-05
 * Reviewed by me (`rv-` classes; the owner-approved Academic Reviewer export,
 * design/v3-refined-b/roles/RV-v1, `project/rv.css` and COMPONENT-EXTENSIONS.md): the Overview's
 * desk (next in line, the rest oldest first, the calm state) and its side cards (In your queue,
 * Your review scope, Recently decided), the lists' type tabs with their counts, the toolbar with
 * one or two fields, the review-queue and decisions tables, and the four-column skeleton rows.
 * Markup as the export's `RV.dc.html` draws them. The review-type tag is drawn by the shared
 * `rv.tsx` and passed in (`kind`); the course, the status pills and the format badges are its
 * `RvCourse`, `RvStatus` and `RvFormatBadges`. Every word, figure, date and destination comes from the caller;
 * no piece prints a record's internal reference.
 */

// ---- shared small parts ----------------------------------------------------------------------

/** A course as a list or a desk row names it: the code chip, then the course's name. */
interface RvCourseFacts {
  /** The platform course code (`span.rk-code`); none when the course has no code. */
  readonly courseCode: string | null;
  /** The course's name; none when it is not known. */
  readonly courseName: string | null;
}

/** "3 days" over "since 24 Aug" (`p.rv-age`, or `span.rv-age` in a table cell). */
function Age({
  age,
  since,
  large = false,
  as: Element = 'p',
}: {
  readonly age: ReactNode;
  readonly since: ReactNode;
  readonly large?: boolean;
  readonly as?: 'p' | 'span';
}) {
  return (
    <Element className={joinClasses('rv-age', large && 'rv-age--lg')}>
      <b>{age}</b>
      <span>{since}</span>
    </Element>
  );
}

/** The flag of a row that needs attention first (`span.rk-tag-warn`): "No learning outcomes yet". */
function Flag({ children }: { readonly children: ReactNode }) {
  return <MissingTag icon="flag">{children}</MissingTag>;
}

/** A press anywhere on a row follows its link — not on another control, not ending a selection. */
const INTERACTIVE = 'a, button, input, select, textarea, label, summary, [tabindex]';

function useRowLink() {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const onRowClick = (event: MouseEvent<HTMLTableRowElement>) => {
    const target = event.target;
    const control = target instanceof Element ? target.closest(INTERACTIVE) : null;
    if (control && event.currentTarget.contains(control)) return;
    if (window.getSelection()?.toString()) return;
    linkRef.current?.click();
  };
  return { linkRef, onRowClick };
}

// ---- RV-01 the desk ---------------------------------------------------------------------------

/** The Overview's two columns (`div.rv-desk`): what waits, then the side cards. */
export function RvDesk({ children }: { readonly children: ReactNode }) {
  return <div className="rv-desk">{children}</div>;
}

export interface RvWaitPanelProps {
  /** "Waiting for your decision" (`h2.rb-h2`). */
  readonly title: ReactNode;
  readonly titleId: string;
  /** "Oldest first", or "Nothing waiting" (`p.rb-note`). */
  readonly note?: ReactNode;
  readonly children: ReactNode;
}

/** What waits for the reviewer (`section.rb-panel.rv-wait`), named by its heading. */
export function RvWaitPanel({ title, titleId, note, children }: RvWaitPanelProps) {
  return (
    <section className="rb-panel rv-wait" aria-labelledby={titleId}>
      <div className="rv-wait-h">
        <h2 className="rb-h2" id={titleId}>
          {title}
        </h2>
        {note ? <p className="rb-note">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** A desk action: its words, its destination and the name that says what it opens. */
export interface RvDeskAction {
  /** "Start review", "Review update", "Review". */
  readonly label: string;
  readonly href: string;
  /** "Start review: Flash Distillation", "Review the update to Distillation Column". */
  readonly accessibleName: string;
}

/** One item that waits, as the desk shows it. */
export interface RvWaitingItem extends RvCourseFacts {
  readonly key: string;
  /** The review-type tag (`span.rv-kind`, the shared `RvKindTag`). */
  readonly kind: ReactNode;
  readonly name: string;
  /** Who sent it (`p.rv-from`): "Revision 1 · from Meridian Virtual Labs". */
  readonly from: ReactNode;
  /** "No learning outcomes yet" (`span.rk-tag-warn` with the flag). */
  readonly flag?: ReactNode;
  /** What to look at first: the Content Manager's reason, quoted. */
  readonly focus?: ReactNode;
  /** "3 days", "1 day", "Today". */
  readonly age: ReactNode;
  /** "since 24 Aug". */
  readonly since: ReactNode;
  readonly action: RvDeskAction;
}

export interface RvNextInLineProps {
  /** "Next in line · waiting longest" (`p.rv-next-k`, with the clock). */
  readonly label: ReactNode;
  readonly item: RvWaitingItem;
  /** The formats (`span.rk-fmts`, the kit's `FormatBadges`). */
  readonly formats?: ReactNode;
}

/**
 * The item waiting longest (`div.rv-next`): its type, name, course, sender, formats and what to
 * look at, then how long it has waited and the page's one gold "Start review".
 */
export function RvNextInLine({ label, item, formats }: RvNextInLineProps) {
  return (
    <div className="rv-next">
      <p className="rv-next-k">
        <Glyph name="clock" />
        {label}
      </p>
      <div className="rv-next-body">
        <div className="rv-next-main">
          {item.kind}
          <h3 className="rv-next-t">{item.name}</h3>
          <p className="rv-next-meta">
            <RvCourse code={item.courseCode} name={item.courseName} placement="next" />
          </p>
          <p className="rv-from">{item.from}</p>
          <div className="rv-next-facts">
            {formats}
            {item.flag ? <Flag>{item.flag}</Flag> : null}
            {item.focus ? <span className="rv-focus">{item.focus}</span> : null}
          </div>
        </div>
        <div className="rv-next-side">
          <Age age={item.age} since={item.since} large />
          <ButtonLink
            variant="primary"
            size="lg"
            className="rv-btn-wrap"
            href={item.action.href}
            aria-label={item.action.accessibleName}
          >
            {item.action.label}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

export interface RvWaitListProps {
  /** "Then, oldest first" (`h3.rv-then`). */
  readonly title: ReactNode;
  readonly items: readonly RvWaitingItem[];
}

/** The rest of what waits, oldest first (`ul.rv-wl` > `li.rv-wl-row`). */
export function RvWaitList({ title, items }: RvWaitListProps) {
  return (
    <>
      <h3 className="rv-then">{title}</h3>
      <ul className="rv-wl">
        {items.map((item) => (
          <li key={item.key} className="rv-wl-row">
            <Age age={item.age} since={item.since} />
            <div className="rv-wl-main">
              {item.kind}
              <p className="rv-wl-t">{item.name}</p>
              <p className="rv-wl-meta">
                <RvCourse code={item.courseCode} name={item.courseName} placement="row" />
              </p>
              <p className="rv-from">{item.from}</p>
              {item.focus ? <p className="rv-wl-focus">{item.focus}</p> : null}
              {item.flag ? <Flag>{item.flag}</Flag> : null}
            </div>
            <div className="rv-wl-act">
              <ButtonLink href={item.action.href} aria-label={item.action.accessibleName}>
                {item.action.label}
              </ButtonLink>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export interface RvCalmProps {
  /** "Nothing is waiting for your decision" (`p.rb-calm-t`). */
  readonly title: ReactNode;
  /** The line under it (`p.rb-calm-d`). */
  readonly children?: ReactNode;
  /** "Open Reviewed by me" (`div.rv-calm-act`). */
  readonly action?: ReactNode;
}

/** Nothing waits (`div.rb-calm[role=status]` with the tick, then its one action). */
export function RvCalm({ title, children, action }: RvCalmProps) {
  return (
    <>
      <div className="rb-calm" role="status">
        <span className="rb-calm-ico" aria-hidden="true">
          <Glyph name="check" />
        </span>
        <p className="rb-calm-t">{title}</p>
        {children ? <p className="rb-calm-d">{children}</p> : null}
      </div>
      {action ? <div className="rv-calm-act">{action}</div> : null}
    </>
  );
}

// ---- RV-01 the side cards ---------------------------------------------------------------------

/** The Overview's side column (`div.rv-side`). */
export function RvSide({ children }: { readonly children: ReactNode }) {
  return <div className="rv-side">{children}</div>;
}

export interface RvSideCardProps {
  /** "In your queue", "Your review scope", "Recently decided" (`h2.rv-side-h`). */
  readonly title: ReactNode;
  readonly titleId: string;
  /** A link beside the title ("All decisions"; `div.rv-side-hrow`). */
  readonly link?: ReactNode;
  readonly children?: ReactNode;
  /** The quiet line under the list (`p.rv-side-note`). */
  readonly note?: ReactNode;
}

/** A side card (`section.rb-panel.rv-sidecard`), named by its heading. */
export function RvSideCard({ title, titleId, link, children, note }: RvSideCardProps) {
  const heading = (
    <h2 className="rv-side-h" id={titleId}>
      {title}
    </h2>
  );
  return (
    <section className="rb-panel rv-sidecard" aria-labelledby={titleId}>
      {link ? (
        <div className="rv-side-hrow">
          {heading}
          {link}
        </div>
      ) : (
        heading
      )}
      {children}
      {note ? <p className="rv-side-note">{note}</p> : null}
    </section>
  );
}

export type RvQueueKind = 'new' | 'recheck' | 'update';

/** The type's icon box (`span.rv-kind-ico`): the document, the arrows, the pencil. */
const TYPE_ICON = {
  new: { className: 'rv-kind-ico rv-kind--new', glyph: 'kindNew' },
  recheck: { className: 'rv-kind-ico rv-kind-ico--recheck rv-kind--recheck', glyph: 'kindRecheck' },
  update: { className: 'rv-kind-ico rv-kind-ico--update rv-kind--update', glyph: 'kindUpdate' },
} as const;

export interface RvQueueType {
  readonly kind: RvQueueKind;
  /** "New submissions" (`span.rv-type-t`). */
  readonly title: ReactNode;
  /** "From vendors · 1 is a resubmission" (`span.rv-type-d`). */
  readonly detail: ReactNode;
  /** The number of items (`b.rv-type-n`, hidden: the name says it). */
  readonly count: number;
  /** The review queue on this type. */
  readonly href: string;
  /** "New submissions: 2 items. Open them in the review queue". */
  readonly accessibleName: string;
}

/** "In your queue" by type (`ul.rv-types` > `a.rv-type`): each opens the queue on its tab. */
export function RvQueueTypes({ types }: { readonly types: readonly RvQueueType[] }) {
  const Link = useLinkComponent();
  return (
    <ul className="rv-types">
      {types.map((type) => (
        <li key={type.kind}>
          <Link className="rv-type" href={type.href} aria-label={type.accessibleName}>
            <span className={TYPE_ICON[type.kind].className} aria-hidden="true">
              <Glyph name={TYPE_ICON[type.kind].glyph} />
            </span>
            <span>
              <span className="rv-type-t">{type.title}</span>
              <span className="rv-type-d">{type.detail}</span>
            </span>
            <b className="rv-type-n" aria-hidden="true">
              {type.count}
            </b>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export interface RvScopeCourse {
  readonly key: string;
  readonly code: string;
  /** The course's name (`span.rv-course-t`); none when it is not known. */
  readonly name: string | null;
  /** The review queue filtered to this course. */
  readonly href: string;
  /** "CHE ZG513 Process Instrumentation & Control. Open the review queue for this course". */
  readonly accessibleName: string;
}

/** "Your review scope" (`ul.rv-courses` > `a.rv-course`): each course opens the queue on it. */
export function RvScopeCourses({ courses }: { readonly courses: readonly RvScopeCourse[] }) {
  const Link = useLinkComponent();
  return (
    <ul className="rv-courses">
      {courses.map((course) => (
        <li key={course.key}>
          <Link className="rv-course" href={course.href} aria-label={course.accessibleName}>
            <CourseCode code={course.code} />
            <span className="rv-course-t">{course.name}</span>
            <Glyph name="chevronRight" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export interface RvRecentDecision {
  readonly key: string;
  readonly name: string;
  /** "Approved", "Update approved", "Returned to vendor", "Returned". */
  readonly decision: ReactNode;
  /** An approval (the tick, ok) or a return (the diamond, err). */
  readonly approved: boolean;
  /** "24 Aug 2026". */
  readonly when: ReactNode;
  /** Where it is now: "With the vendor to revise". */
  readonly now: ReactNode;
  readonly href: string;
  /** "Forced Convection, returned to vendor on 24 Aug 2026. Now: With the vendor to revise. Open it". */
  readonly accessibleName: string;
}

/** "Recently decided" (`ul.rv-recent` > `a.rv-recent-row`): each opens the decided item. */
export function RvRecentDecisions({ items }: { readonly items: readonly RvRecentDecision[] }) {
  const Link = useLinkComponent();
  return (
    <ul className="rv-recent">
      {items.map((item) => (
        <li key={item.key}>
          <Link className="rv-recent-row" href={item.href} aria-label={item.accessibleName}>
            <span className="rv-recent-t">{item.name}</span>
            <span className="rv-recent-d">
              <RvStatus tone={item.approved ? 'ok' : 'err'} size="sm">
                {item.decision}
              </RvStatus>
              <span>{item.when}</span>
            </span>
            <span className="rv-recent-now">{item.now}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ---- RV-02, RV-05 the type tabs and the panel ------------------------------------------------

export interface RvListTab<Value extends string> {
  readonly value: Value;
  /** "All", "New submissions", "Re-checks", "Updates". */
  readonly label: ReactNode;
  /** The tab's count (`span.rv-tabn`, read ", 4"); none while the list loads or has failed. */
  readonly count?: number;
}

export interface RvListTabsProps<Value extends string> {
  /** The tab list's name: "Review type", "Show". */
  readonly label: string;
  readonly tabs: readonly RvListTab<Value>[];
  readonly value: Value;
  readonly onChange: (value: Value) => void;
  /** Prefix of the tabs' ids (`<prefix>-<value>`). */
  readonly idPrefix: string;
  /** The panel the tabs control (`RvListPanel`'s id). */
  readonly panelId: string;
  /** Three tabs (`rv-qtabs--3`: Reviewed by me), stacked words and counts on phones. */
  readonly three?: boolean;
}

/** The id of a list tab (`<prefix>-<value>`), for the panel it labels. */
export function rvListTabId(idPrefix: string, value: string): string {
  return `${idPrefix}-${value}`;
}

/**
 * A list's type tabs (`div.rv-qtabs` > `div.rk-tabs[role=tablist]` > `button.rk-tab[role=tab]`):
 * one Tab stop; the arrow keys (right and down, left and up), Home and End move between the tabs
 * and select the one they reach. Each tab controls the one list panel.
 */
export function RvListTabs<Value extends string>({
  label,
  tabs,
  value,
  onChange,
  idPrefix,
  panelId,
  three = false,
}: RvListTabsProps<Value>) {
  const listRef = useRef<HTMLDivElement>(null);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = Math.max(
      0,
      tabs.findIndex((tab) => tab.value === value),
    );
    const last = tabs.length - 1;
    const keys: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowDown: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      ArrowUp: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    const target = keys[event.key];
    const next = target === undefined ? undefined : tabs[target];
    if (target === undefined || !next) return;
    event.preventDefault();
    onChange(next.value);
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[target]?.focus();
  };
  return (
    <div className={joinClasses('rv-qtabs', three && 'rv-qtabs--3')}>
      <div
        ref={listRef}
        className="rk-tabs"
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
      >
        {tabs.map((tab) => {
          const selected = tab.value === value;
          return (
            <button
              key={tab.value}
              type="button"
              className="rk-tab"
              role="tab"
              id={rvListTabId(idPrefix, tab.value)}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.value)}
            >
              {tab.label}
              {tab.count === undefined ? null : (
                <span className="rv-tabn">
                  <span className="xr-sr">, </span>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface RvListPanelProps {
  readonly id: string;
  /** The selected tab's id; none when the list is empty (no tabs are drawn: a plain region). */
  readonly labelledBy?: string | null;
  readonly children: ReactNode;
}

/** The list panel the tabs control (`div[role=tabpanel]`, labelled by the selected tab). */
export function RvListPanel({ id, labelledBy, children }: RvListPanelProps) {
  return (
    <div
      id={id}
      role={labelledBy ? 'tabpanel' : undefined}
      aria-labelledby={labelledBy ?? undefined}
    >
      {children}
    </div>
  );
}

// ---- RV-02, RV-05 the toolbar -----------------------------------------------------------------

export interface RvToolbarChip {
  readonly key: string;
  /** "Search: “dist”", "Course: CHE ZG513"; the remove button is "Remove filter …". */
  readonly label: string;
  readonly onRemove: () => void;
}

export interface RvListToolbarProps {
  /** The search landmark's name: "Filter the review queue". */
  readonly label: string;
  readonly search: {
    readonly id: string;
    readonly label: string;
    readonly placeholder?: string;
    readonly value: string;
    readonly onChange: (value: string) => void;
  };
  /** The Course filter beside the search (`rk-field--st`); none draws the search alone. */
  readonly course?: {
    readonly id: string;
    readonly label: string;
    readonly value: string;
    readonly options: readonly SelectOption[];
    readonly onChange: (value: string) => void;
  };
  /** The count in words ("4 items · oldest first"), announced politely; none while loading. */
  readonly count?: ReactNode;
  readonly chips?: readonly RvToolbarChip[];
  /** "Clear filters" while any filter (a tab included) applies; focus returns to the search. */
  readonly clear?: { readonly label: string; readonly onClear: () => void };
  readonly searchRef?: Ref<HTMLInputElement>;
}

/**
 * The list toolbar (`div.rk-toolbar` > `div.rk-tools[role=search]` + `div.rk-statusline`): the
 * search, the Course filter or the search alone (`rv-tools--solo`), then the count, one chip per
 * filter and "Clear filters". Removing a chip moves focus to the next chip (or the previous, or
 * the search) instead of losing it; clearing returns focus to the search.
 */
export function RvListToolbar({
  label,
  search,
  course,
  count,
  chips = [],
  clear,
  searchRef,
}: RvListToolbarProps) {
  const statusRef = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement | null>(null);
  const pendingChipFocus = useRef<number | null>(null);

  useEffect(() => {
    const index = pendingChipFocus.current;
    if (index === null) return;
    pendingChipFocus.current = null;
    const buttons = statusRef.current?.querySelectorAll<HTMLButtonElement>('.rk-chip button');
    (buttons?.[index] ?? buttons?.[index - 1] ?? searchInput.current)?.focus();
  }, [chips.length]);

  const attachSearch = (element: HTMLInputElement | null) => {
    searchInput.current = element;
    if (typeof searchRef === 'function') searchRef(element);
    else if (searchRef) searchRef.current = element;
  };

  const showLine = count !== undefined || chips.length > 0 || clear !== undefined;
  return (
    <div className="rk-toolbar">
      <div
        className={joinClasses('rk-tools', !course && 'rv-tools--solo')}
        role="search"
        aria-label={label}
      >
        <Field label={search.label} id={search.id} className="rk-search">
          <SearchInput
            ref={attachSearch}
            placeholder={search.placeholder}
            autoComplete="off"
            value={search.value}
            onChange={(event) => search.onChange(event.target.value)}
          />
        </Field>
        {course ? (
          <Field label={course.label} id={course.id} className="rk-field--st">
            <Select
              value={course.value}
              options={course.options}
              onChange={(event) => course.onChange(event.target.value)}
            />
          </Field>
        ) : null}
      </div>
      {showLine ? (
        <div ref={statusRef} className="rk-statusline">
          {count !== undefined ? (
            <p className="rk-count" role="status">
              {count}
            </p>
          ) : null}
          {chips.map((chip, index) => (
            <span key={chip.key} className="rk-chip">
              {chip.label}
              <button
                type="button"
                aria-label={`Remove filter ${chip.label}`}
                onClick={() => {
                  pendingChipFocus.current = index;
                  chip.onRemove();
                }}
              >
                <Glyph name="close" />
              </button>
            </span>
          ))}
          {clear ? (
            <button
              type="button"
              className="rk-clear"
              onClick={() => {
                clear.onClear();
                searchInput.current?.focus();
              }}
            >
              {clear.label}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ---- RV-02 the review-queue table --------------------------------------------------------------

export interface RvQueueRow extends RvCourseFacts {
  readonly key: string;
  /** Where the row leads (RV-03 or RV-04): its link, and a press anywhere on the row. */
  readonly href: string;
  readonly name: string;
  /** "Flash Distillation, new submission, waiting since 24 Aug 2026. Review it". */
  readonly accessibleName: string;
  /** The formats under the course (`span.rv-cell-ref`; the kit's `FormatBadges`). */
  readonly formats?: ReactNode;
  /** The review-type tag (the shared `RvKindTag`). */
  readonly kind: ReactNode;
  /** Who sent it (`span.rk-small`). */
  readonly from: ReactNode;
  readonly flag?: ReactNode;
  readonly focus?: ReactNode;
  readonly age: ReactNode;
  readonly since: ReactNode;
}

export interface RvQueueTableProps {
  /** "Items waiting for your decision, oldest first" (visually hidden caption). */
  readonly caption: string;
  readonly headers: {
    readonly item: string;
    readonly kind: string;
    readonly focus: string;
    readonly when: string;
  };
  /** The date's inline label in the narrow layouts (`span.rk-inlabel`): "Waiting". */
  readonly whenLabel: string;
  readonly rows: readonly RvQueueRow[];
}

/** The experiment's cell: its link (`a.rk-rowlink`), then its course (`span.rv-cell-course`). */
function ItemCell({
  row,
  linkRef,
  children,
}: {
  readonly row: RvCourseFacts & {
    readonly href: string;
    readonly name: string;
    readonly accessibleName: string;
  };
  readonly linkRef: Ref<HTMLAnchorElement>;
  readonly children?: ReactNode;
}) {
  const Link = useLinkComponent();
  return (
    <td role="cell" className="rv-c-item">
      <Link ref={linkRef} className="rk-rowlink" href={row.href} aria-label={row.accessibleName}>
        {row.name}
      </Link>
      {row.courseCode || row.courseName ? (
        <RvCourse code={row.courseCode} name={row.courseName} placement="cell" />
      ) : null}
      {children}
    </td>
  );
}

function QueueRow({ row, whenLabel }: { readonly row: RvQueueRow; readonly whenLabel: string }) {
  const { linkRef, onRowClick } = useRowLink();
  return (
    <tr role="row" onClick={onRowClick}>
      <ItemCell row={row} linkRef={linkRef}>
        {row.formats ? <span className="rv-cell-ref">{row.formats}</span> : null}
      </ItemCell>
      <td role="cell" className="rv-c-kind">
        {row.kind}
        <span className="rk-small">{row.from}</span>
      </td>
      <td role="cell" className="rv-c-focus">
        {row.flag ? <Flag>{row.flag}</Flag> : null}
        {row.focus ? <span className="rv-focus-t">{row.focus}</span> : null}
      </td>
      <td role="cell" className="rv-c-when">
        <span className="rk-inlabel">{whenLabel} </span>
        <Age as="span" age={row.age} since={row.since} />
      </td>
    </tr>
  );
}

/**
 * The review queue (`div.rk-tablewrap` > `table.rk-table.rv-qtable`): Experiment · Review type ·
 * What to look at · Waiting, oldest first, each row a link to its review. A real table with a
 * hidden caption; explicit table roles keep the semantics when the narrow layouts change the
 * cells' display (ADR-0010).
 */
export function RvQueueTable({ caption, headers, whenLabel, rows }: RvQueueTableProps) {
  return (
    <div className="rk-tablewrap">
      <table className="rk-table rv-qtable" role="table">
        <caption>{caption}</caption>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader" className="rv-c-item">
              {headers.item}
            </th>
            <th scope="col" role="columnheader" className="rv-c-kind">
              {headers.kind}
            </th>
            <th scope="col" role="columnheader" className="rv-c-focus">
              {headers.focus}
            </th>
            <th scope="col" role="columnheader" className="rv-c-when" aria-sort="descending">
              {headers.when}
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((row) => (
            <QueueRow key={row.key} row={row} whenLabel={whenLabel} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- RV-05 the decisions table -----------------------------------------------------------------

export interface RvDecisionRow extends RvCourseFacts {
  readonly key: string;
  /** The decided item (RV-06 or RV-04 decided): its link, and a press anywhere on the row. */
  readonly href: string;
  readonly name: string;
  /** "Forced Convection, returned to vendor on 24 Aug 2026. Open it". */
  readonly accessibleName: string;
  /** The type of the item as decided (the shared `RvKindTag`). */
  readonly kind: ReactNode;
  /** "Approved", "Update approved", "Returned to vendor", "Returned to the Content Manager". */
  readonly decision: ReactNode;
  readonly approved: boolean;
  /** "24 Aug 2026". */
  readonly when: ReactNode;
  /** "With the vendor to revise" (`span.rv-now`). */
  readonly now: ReactNode;
}

export interface RvDecisionsTableProps {
  /** "Your decisions, newest first" (visually hidden caption). */
  readonly caption: string;
  readonly headers: {
    readonly item: string;
    readonly kind: string;
    readonly decision: string;
    readonly now: string;
  };
  /** The inline labels of the narrow layouts (`span.rk-inlabel`): "Decided", "Now:". */
  readonly decidedLabel: string;
  readonly nowLabel: string;
  readonly rows: readonly RvDecisionRow[];
}

function DecisionRow({
  row,
  decidedLabel,
  nowLabel,
}: {
  readonly row: RvDecisionRow;
  readonly decidedLabel: string;
  readonly nowLabel: string;
}) {
  const { linkRef, onRowClick } = useRowLink();
  return (
    <tr role="row" onClick={onRowClick}>
      <ItemCell row={row} linkRef={linkRef} />
      <td role="cell" className="rv-c-kind">
        {row.kind}
      </td>
      <td role="cell" className="rv-c-dec">
        <RvStatus tone={row.approved ? 'ok' : 'err'}>{row.decision}</RvStatus>
        <span className="rk-small">
          <span className="rk-inlabel">{decidedLabel} </span>
          {row.when}
        </span>
      </td>
      <td role="cell" className="rv-c-now">
        <span className="rk-inlabel">{nowLabel} </span>
        <span className="rv-now">{row.now}</span>
      </td>
    </tr>
  );
}

/**
 * The reviewer's decisions (`div.rk-tablewrap` > `table.rk-table.rv-rtable`): Experiment · Type ·
 * Your decision · Where it is now, newest first, each row a link to the decided item.
 */
export function RvDecisionsTable({
  caption,
  headers,
  decidedLabel,
  nowLabel,
  rows,
}: RvDecisionsTableProps) {
  return (
    <div className="rk-tablewrap">
      <table className="rk-table rv-rtable" role="table">
        <caption>{caption}</caption>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader" className="rv-c-item">
              {headers.item}
            </th>
            <th scope="col" role="columnheader" className="rv-c-kind">
              {headers.kind}
            </th>
            <th scope="col" role="columnheader" className="rv-c-dec" aria-sort="descending">
              {headers.decision}
            </th>
            <th scope="col" role="columnheader" className="rv-c-now">
              {headers.now}
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((row) => (
            <DecisionRow key={row.key} row={row} decidedLabel={decidedLabel} nowLabel={nowLabel} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- RV-02, RV-05 loading ----------------------------------------------------------------------

/**
 * "Loading the review queue…" over three four-column skeleton rows (`div.rk-skel-row.rv-skel4`).
 * `cells` is the lines in each cell: the queue's `[3, 2, 2, 1]` (the default), the decisions'
 * `[2, 1, 2, 1]`.
 */
export function RvLoadingRows({
  message,
  cells = [3, 2, 2, 1],
}: {
  readonly message: ReactNode;
  readonly cells?: readonly [number, number, number, number];
}) {
  return (
    <div aria-busy="true">
      <p className="rk-loading-msg" role="status">
        {message}
      </p>
      {[0, 1, 2].map((row) => (
        <div key={row} className="rk-skel-row rv-skel4" aria-hidden="true">
          {cells.map((lines, cell) => (
            <div key={cell}>
              {Array.from({ length: lines }, (_, line) => (
                <span key={line} className="rk-skel" />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
