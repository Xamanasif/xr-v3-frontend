'use client';

import { type ChangeEvent, type ReactNode, type Ref, useRef } from 'react';

import { joinClasses } from '../internal/classes.js';
import { followRowLink } from '../internal/row-link.js';
import { useLinkComponent } from '../link.js';
import { Button } from './actions.js';
import { Glyph, Icon } from './icons.js';
import {
  IaCellLine,
  IaCellText,
  IaListTable,
  type IaListColumn,
  type IaListRow,
  IaRowLink,
  IaSectionHead,
  IaSectionCount,
} from './ia.js';

/*
 * What only the Institute Admin's People screens draw — IA-06 Students, IA-08 Faculty, IA-09
 * Faculty record, IA-11 Import students, IA-13 Groups and IA-15 Faculty courses (`ia-` classes; the
 * owner-approved Institute Admin export, design/v3-refined-b/roles/IA-v1, `project/ia-role.css` and
 * COMPONENT-EXTENSIONS.md): the People tabs with their counts, the students' roster, the People
 * lists' tables (the shared list table with each list's own columns), a course a person teaches
 * with its quiet Remove…, the faculty courses' assign panel, and the import's template columns,
 * file chooser and rows to fix. Markup as the export's `Main.dc.html` draws them; the shared
 * families (list table, management surface, form column, steps) are `ia.tsx`'s. Every word,
 * figure and destination comes from the caller; no piece prints a record's internal reference.
 */

// ---- People tabs (IA-06, IA-08, IA-13, IA-15) --------------------------------------------------

export interface IaPeopleTab {
  /** "Students", "Faculty", "Groups", "Faculty courses". */
  readonly label: ReactNode;
  readonly href: string;
  readonly current?: boolean;
  /**
   * The count beside the label (`span.ia-tab-n`, hidden from screen readers) and its words for
   * them (`span.xr-sr`: ", 12 students"); none while the count is not known, or for a tab that
   * draws none (Faculty courses).
   */
  readonly count?: { readonly value: number; readonly words: string } | null;
}

/**
 * The People tabs (`nav.ia-tabs` > `a.ia-tab[aria-current=page]`; a 2 × 2 grid on phones): each
 * tab is an address, so they are links.
 */
export function IaPeopleTabs({
  label,
  tabs,
}: {
  /** The navigation's name: "People". */
  readonly label: string;
  readonly tabs: readonly IaPeopleTab[];
}) {
  const Link = useLinkComponent();
  if (tabs.filter((tab) => tab.current).length > 1) {
    throw new Error('IaPeopleTabs: at most one tab is current.');
  }
  return (
    <nav className="ia-tabs" aria-label={label}>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          className="ia-tab"
          href={tab.href}
          aria-current={tab.current ? 'page' : undefined}
        >
          <span>{tab.label}</span>
          {tab.count ? (
            <>
              <span className="ia-tab-n" aria-hidden="true">
                {tab.count.value}
              </span>
              <span className="xr-sr">{tab.count.words}</span>
            </>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}

// ---- IA-06 the students' roster ----------------------------------------------------------------

export interface IaRosterRow {
  readonly key: string;
  /** The student's name (`a.rk-rowlink`), opening the record. */
  readonly name: string;
  readonly href: string;
  /** The link's accessible name: "Open student record: Rahul Verma". */
  readonly accessibleName: string;
  /** The institution's own student ID ("GIT-2026-0418"; never broken at its hyphens). */
  readonly studentId: string;
  /** The institution e-mail, after the ID (hidden on phones). */
  readonly email: string;
  /** Before the groups on phones only (`span.ia-rt-plab`): "Group: ", "Groups: "; none without one. */
  readonly groupLabel?: string;
  /** "ME ZG523 — Sem II", "No group". */
  readonly groups: ReactNode;
  /** The course line under the groups: "ME ZG523", "No course recorded". */
  readonly course: ReactNode;
  /** The access status pill (`StatusPill`). */
  readonly status: ReactNode;
  /** The experiments line under the status, with its words for screen readers; none without one. */
  readonly experiments?: { readonly srLabel: string; readonly text: ReactNode } | null;
  /** The quiet "Give access" shortcut of a "No access yet" row (`a.rb-btn.rb-btn--ghost`). */
  readonly give?: {
    readonly label: ReactNode;
    readonly href: string;
    readonly accessibleName: string;
  } | null;
}

export interface IaRosterProps {
  /** `caption` (visually hidden): "Students at your institution". */
  readonly caption: string;
  readonly headers: {
    readonly student: string;
    readonly group: string;
    readonly access: string;
    /** The last column's name, for screen readers only: "Action". */
    readonly action: string;
  };
  readonly rows: readonly IaRosterRow[];
}

/**
 * The students' roster (`table.ia-rt`): Student · Group · Access · the row's shortcut, the whole
 * row opening the record. Below 640 px each row is a short block (who, access, group), so the
 * table carries explicit table roles (ADR-0010).
 */
export function IaRoster({ caption, headers, rows }: IaRosterProps) {
  const Link = useLinkComponent();
  return (
    <table className="ia-rt" role="table">
      <caption>{caption}</caption>
      <thead role="rowgroup">
        <tr role="row">
          <th scope="col" role="columnheader">
            {headers.student}
          </th>
          <th scope="col" role="columnheader">
            {headers.group}
          </th>
          <th scope="col" role="columnheader">
            {headers.access}
          </th>
          <th scope="col" role="columnheader">
            <span className="xr-sr">{headers.action}</span>
          </th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        {rows.map((row) => (
          <tr key={row.key} className="ia-rt-row is-link" role="row" onClick={followRowLink}>
            <td className="ia-rt-who" role="cell">
              <Link
                className="rk-rowlink ia-cell-name"
                href={row.href}
                aria-label={row.accessibleName}
              >
                {row.name}
              </Link>
              <span className="ia-cell-sub ia-rt-idline" title={`${row.studentId} · ${row.email}`}>
                <span className="ia-nowrap">{row.studentId}</span>
                <span className="ia-rt-email"> · {row.email}</span>
              </span>
            </td>
            <td className="ia-rt-grp" role="cell">
              <span className="ia-cell-t">
                <span className="ia-rt-plab">{row.groupLabel ?? ''}</span>
                {row.groups}
              </span>
              <span className="ia-cell-sub">{row.course}</span>
            </td>
            <td className="ia-rt-acc" role="cell">
              {row.status}
              {row.experiments ? (
                <span className="ia-cell-sub ia-rt-exps">
                  <span className="xr-sr">{row.experiments.srLabel}</span>
                  {row.experiments.text}
                </span>
              ) : null}
            </td>
            <td className="ia-rt-act" role="cell">
              {row.give ? (
                <Link
                  className="rb-btn rb-btn--ghost"
                  href={row.give.href}
                  aria-label={row.give.accessibleName}
                >
                  {row.give.label}
                </Link>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---- A course a person teaches (IA-08, IA-15) --------------------------------------------------

/**
 * One course a person teaches (`span.ia-cell-line.ia-cell-courses`): its code chip and its name
 * (IA-08), or the code chip named by the course on hover with its quiet "Remove…" (IA-15).
 */
export function IaCourseLine({
  code,
  name,
  nameAsTitle = false,
  remove,
}: {
  /** The course code (`span.rk-code`): "ME ZG523". */
  readonly code: string;
  /** The course's name (`span.ia-cell-t`), or the chip's hover title with `nameAsTitle`. */
  readonly name?: string;
  readonly nameAsTitle?: boolean;
  /** The quiet "Remove…" beside the chip (`button.rb-btn--ghost.ia-btn--sm`, 32 px). */
  readonly remove?: {
    readonly id: string;
    readonly label: ReactNode;
    readonly accessibleName: string;
    readonly onClick: () => void;
  } | null;
}) {
  return (
    <IaCellLine kind="courses">
      <span className="rk-code" title={nameAsTitle ? name : undefined}>
        {code}
      </span>
      {name && !nameAsTitle ? <IaCellText kind="text">{name}</IaCellText> : null}
      {remove ? (
        <Button
          variant="ghost"
          className="ia-btn--sm"
          id={remove.id}
          aria-label={remove.accessibleName}
          onClick={remove.onClick}
        >
          {remove.label}
        </Button>
      ) : null}
    </IaCellLine>
  );
}

// ---- The People lists (the shared list table, with each list's own columns) --------------------

export interface IaFacultyRow {
  readonly key: string;
  readonly name: string;
  readonly href: string;
  /** "Open faculty record: Dr S. Ranganathan". */
  readonly accessibleName: string;
  readonly email: string;
  /** `IaCourseLine`s, or `IaCellText kind="muted"` "No courses yet". */
  readonly courses: ReactNode;
  /** The status pill. */
  readonly status: ReactNode;
}

/**
 * IA-08 Faculty (`table.ia-lt.ia-lt--fac`): Faculty member (opening the record, the e-mail under
 * it) · Courses taught · Status, the whole row a link.
 */
export function IaFacultyTable({
  caption,
  headers,
  rows,
}: {
  readonly caption: string;
  readonly headers: { readonly member: string; readonly courses: string; readonly status: string };
  readonly rows: readonly IaFacultyRow[];
}) {
  const columns: IaListColumn[] = [
    { key: 'member', header: headers.member },
    { key: 'courses', header: headers.courses },
    { key: 'status', header: headers.status },
  ];
  const listRows: IaListRow[] = rows.map((row) => ({
    key: row.key,
    link: true,
    cells: [
      {
        key: 'member',
        role: 'main',
        className: 'ia-fac-who',
        children: (
          <>
            <IaRowLink href={row.href} label={row.accessibleName}>
              {row.name}
            </IaRowLink>
            <IaCellText kind="sub">{row.email}</IaCellText>
          </>
        ),
      },
      // The export also marks this cell `ia-fac-courses`, a class its sheet never styles: left out
      // (the class contract admits only the classes the V3 sheets define).
      { key: 'courses', label: headers.courses, children: row.courses },
      { key: 'status', role: 'pri', children: row.status },
    ],
  }));
  return <IaListTable variant="fac" caption={caption} columns={columns} rows={listRows} />;
}

export interface IaGroupRow {
  readonly key: string;
  readonly name: string;
  readonly href: string;
  /** "Open group ME ZG523 — Sem II". */
  readonly accessibleName: string;
  /** "7 members", "No members yet". */
  readonly members: ReactNode;
  /**
   * Each experiment the group's grants give it (`IaCellLine kind="exp"`: its name and
   * `IaFormatBadges`), or `IaCellText kind="muted"` "None yet".
   */
  readonly given: ReactNode;
}

/**
 * IA-13 Groups (`table.ia-lt.ia-lt--grp`): Group (opening it) · Members · Experiments given to the
 * group, the whole row a link.
 */
export function IaGroupsTable({
  caption,
  headers,
  givenLabel,
  rows,
}: {
  readonly caption: string;
  readonly headers: { readonly group: string; readonly members: string; readonly given: string };
  /** The third column's label in the phone rows: "Experiments given". */
  readonly givenLabel: string;
  readonly rows: readonly IaGroupRow[];
}) {
  const columns: IaListColumn[] = [
    { key: 'group', header: headers.group },
    { key: 'members', header: headers.members },
    { key: 'given', header: headers.given },
  ];
  const listRows: IaListRow[] = rows.map((row) => ({
    key: row.key,
    link: true,
    cells: [
      {
        key: 'group',
        role: 'main',
        className: 'ia-grp-who',
        children: (
          <IaRowLink href={row.href} label={row.accessibleName}>
            {row.name}
          </IaRowLink>
        ),
      },
      {
        key: 'members',
        className: 'ia-grp-n',
        children: <IaCellText kind="text">{row.members}</IaCellText>,
      },
      { key: 'given', label: givenLabel, children: row.given },
    ],
  }));
  return <IaListTable variant="grp" caption={caption} columns={columns} rows={listRows} />;
}

export interface IaFacultyCoursesRow {
  readonly key: string;
  readonly name: string;
  readonly href: string;
  /** The name link's id: where focus goes after a refusal that reads the list again. */
  readonly linkId?: string;
  readonly email: string;
  /** `IaCourseLine`s with their "Remove…", or `IaCellText kind="muted"` "No courses yet". */
  readonly courses: ReactNode;
  readonly status: ReactNode;
  /** "Assign a course" (`button.rb-btn.rb-btn--ghost`); none for an inactive member or read-only. */
  readonly action?: ReactNode;
}

/**
 * IA-15 Faculty courses (`table.ia-lt.ia-lt--fc`): Faculty member (opening the record, the e-mail
 * under it) · Courses taught · Status · the row's "Assign a course". The row holds other controls,
 * so it is not a whole-row link.
 */
export function IaFacultyCoursesTable({
  caption,
  headers,
  rows,
}: {
  readonly caption: string;
  readonly headers: {
    readonly member: string;
    readonly courses: string;
    readonly status: string;
    readonly action: string;
  };
  readonly rows: readonly IaFacultyCoursesRow[];
}) {
  const Link = useLinkComponent();
  const columns: IaListColumn[] = [
    { key: 'member', header: headers.member },
    { key: 'courses', header: headers.courses },
    { key: 'status', header: headers.status },
    { key: 'action', header: headers.action, hidden: true },
  ];
  const listRows: IaListRow[] = rows.map((row) => ({
    key: row.key,
    cells: [
      {
        key: 'member',
        role: 'main',
        className: 'ia-fc-who',
        children: (
          <>
            <Link id={row.linkId} className="rk-rowlink ia-cell-name" href={row.href}>
              {row.name}
            </Link>
            <IaCellText kind="sub" title={row.email}>
              {row.email}
            </IaCellText>
          </>
        ),
      },
      { key: 'courses', className: 'ia-fc-courses', label: headers.courses, children: row.courses },
      { key: 'status', role: 'pri', children: row.status },
      { key: 'action', role: 'act', children: row.action ?? null },
    ],
  }));
  return <IaListTable variant="fc" caption={caption} columns={columns} rows={listRows} />;
}

export interface IaCourseTaughtRow {
  readonly key: string;
  /** The course code (`span.rk-code`): "ME ZG523"; none for a course without one. */
  readonly code: string | null;
  /** The course's name (`span.ia-cell-title`). */
  readonly name: string;
  /** "Your course code MEC-523" (`span.ia-cell-sub`); none without the institution's code. */
  readonly own?: ReactNode;
  /** "9 Oct 2026 · Meera Iyer". */
  readonly assigned: ReactNode;
  /** The quiet "Remove…"; none while read-only. */
  readonly action?: ReactNode;
}

/** IA-09 "Courses taught" (`table.ia-lt.ia-lt--fr`): Course · Assigned · the row's "Remove…". */
export function IaCoursesTaughtTable({
  caption,
  headers,
  rows,
}: {
  readonly caption: string;
  readonly headers: { readonly course: string; readonly assigned: string; readonly action: string };
  readonly rows: readonly IaCourseTaughtRow[];
}) {
  const columns: IaListColumn[] = [
    { key: 'course', header: headers.course },
    { key: 'assigned', header: headers.assigned },
    { key: 'action', header: headers.action, hidden: true },
  ];
  const listRows: IaListRow[] = rows.map((row) => ({
    key: row.key,
    cells: [
      {
        key: 'course',
        role: 'main',
        className: 'ia-fr-course',
        children: (
          <>
            <IaCellLine>
              {row.code ? <span className="rk-code">{row.code}</span> : null}
              <IaCellText kind="title">{row.name}</IaCellText>
            </IaCellLine>
            {row.own ? <span className="ia-cell-sub ia-gap-xs">{row.own}</span> : null}
          </>
        ),
      },
      {
        key: 'assigned',
        label: headers.assigned,
        children: (
          <IaCellText kind="text" inline>
            {row.assigned}
          </IaCellText>
        ),
      },
      { key: 'action', role: 'act', children: row.action ?? null },
    ],
  }));
  return <IaListTable variant="fr" caption={caption} columns={columns} rows={listRows} />;
}

export interface IaImportProblemRow {
  readonly key: string;
  /** "Row 4". */
  readonly row: ReactNode;
  /** The name as the file gives it. */
  readonly who: ReactNode;
  /** The student ID as the file gives it (never broken at its hyphens); none without one. */
  readonly studentId?: ReactNode;
  /** What to fix, in words. */
  readonly message: ReactNode;
  /** The type pill: "Error — blocks import". */
  readonly type: ReactNode;
}

/**
 * IA-11 step 2 "Rows that need attention" (`div.ia-shead.ia-shead--line`, then
 * `table.ia-lt.ia-lt--imp`): Row · Student · What to fix · Type.
 */
export function IaImportProblems({
  title,
  note,
  caption,
  headers,
  rows,
}: {
  /** "Rows that need attention" (`h2.rk-h3`). */
  readonly title: string;
  /** "Row numbers count from the first student row, after the header." */
  readonly note: string;
  readonly caption: string;
  readonly headers: {
    readonly row: string;
    readonly student: string;
    readonly fix: string;
    readonly type: string;
  };
  readonly rows: readonly IaImportProblemRow[];
}) {
  const columns: IaListColumn[] = [
    { key: 'row', header: headers.row },
    { key: 'student', header: headers.student },
    { key: 'fix', header: headers.fix },
    { key: 'type', header: headers.type },
  ];
  const listRows: IaListRow[] = rows.map((row) => ({
    key: row.key,
    cells: [
      {
        key: 'row',
        role: 'main',
        className: 'ia-imp-row',
        children: <span className="ia-cell-title ia-nowrap ia-num-t">{row.row}</span>,
      },
      {
        key: 'student',
        children: (
          <>
            <IaCellText kind="text">{row.who}</IaCellText>
            {row.studentId ? (
              <IaCellText kind="sub" nowrap>
                {row.studentId}
              </IaCellText>
            ) : null}
          </>
        ),
      },
      { key: 'fix', children: <IaCellText kind="text">{row.message}</IaCellText> },
      { key: 'type', role: 'act', children: row.type },
    ],
  }));
  return (
    <>
      <IaSectionHead
        title={title}
        size="minor"
        line
        aside={<IaSectionCount>{note}</IaSectionCount>}
      />
      <IaListTable variant="imp" caption={caption} columns={columns} rows={listRows} />
    </>
  );
}

// ---- IA-15 the assign panel --------------------------------------------------------------------

export interface IaAssignSelect {
  readonly id: string;
  /** "Faculty member", "Course". */
  readonly label: string;
  /** "Active faculty members only" (`p.rk-hint#<id>-h`). */
  readonly hint: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** The panel's error is about this field: `aria-invalid`, and the error in its description. */
  readonly invalid?: boolean;
  readonly ref?: Ref<HTMLSelectElement>;
}

export interface IaAssignPanelProps {
  /** "Assign a course" (`h2.rk-h3`). */
  readonly title: string;
  readonly titleId: string;
  /**
   * The form (two selects and the button), or — when nothing can be assigned — the words why
   * (`p.rk-next`): paused, no course yet, no active faculty member.
   */
  readonly form:
    | {
        readonly faculty: IaAssignSelect;
        readonly course: IaAssignSelect;
        readonly submit: {
          /** The button's id (`#fc-assign` in the export). */
          readonly id?: string;
          readonly label: ReactNode;
          readonly busy?: boolean;
          readonly busyLabel?: ReactNode;
          readonly onClick: () => void;
        };
        /** The one error under the fields (`p.rk-ferr[role=alert]`), with its id. */
        readonly error?: { readonly id: string; readonly text: ReactNode } | null;
        /** "The course appears in that person’s Faculty workspace. …" (`p.rk-hint`). */
        readonly note: ReactNode;
      }
    | { readonly unavailable: ReactNode };
}

function AssignSelect({
  select,
  errorId,
}: {
  readonly select: IaAssignSelect;
  readonly errorId: string | undefined;
}) {
  const hintId = `${select.id}-h`;
  return (
    <div className="rk-field">
      <label className="rk-label" htmlFor={select.id}>
        {select.label}
      </label>
      <p className="rk-hint" id={hintId}>
        {select.hint}
      </p>
      <div className="rk-selwrap">
        <select
          ref={select.ref}
          id={select.id}
          className="rk-select"
          value={select.value}
          aria-describedby={select.invalid && errorId ? `${hintId} ${errorId}` : hintId}
          aria-invalid={select.invalid ? true : undefined}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => select.onChange(event.target.value)}
        >
          {select.options.map((option) => (
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

/**
 * Faculty courses' assign panel (`section.rk-surface.ia-fcform`): beside the table from 1,060 px of
 * content, one compact row under it below that, stacked on phones (B2-09) — the faculty member,
 * the course and "Assign course", then the one error and the note.
 */
export function IaAssignPanel({ title, titleId, form }: IaAssignPanelProps) {
  return (
    <section className="rk-surface ia-fcform" aria-labelledby={titleId}>
      <div className="ia-sbody">
        <h2 className="rk-h3" id={titleId}>
          {title}
        </h2>
        {'unavailable' in form ? (
          <p className="rk-next">{form.unavailable}</p>
        ) : (
          <>
            <div className="ia-fc-grid">
              <AssignSelect select={form.faculty} errorId={form.error?.id} />
              <AssignSelect select={form.course} errorId={form.error?.id} />
              <Button
                id={form.submit.id}
                variant="primary"
                size="lg"
                className={joinClasses('ia-fc-go', form.submit.busy && 'ia-btn--busy')}
                busy={form.submit.busy}
                busyLabel={form.submit.busyLabel}
                onClick={form.submit.onClick}
              >
                {form.submit.label}
              </Button>
            </div>
            {form.error ? (
              <p className="rk-ferr ia-gap-top-s" id={form.error.id} role="alert">
                <Glyph name="alertCircle" />
                {form.error.text}
              </p>
            ) : null}
            <p className="rk-hint ia-gap-top-s">{form.note}</p>
          </>
        )}
      </div>
    </section>
  );
}

// ---- IA-10 a group of fields -------------------------------------------------------------------

/**
 * A named group of fields in a form column (`fieldset.rk-fieldset` > `legend`): "Who they are",
 * "Student details" — its fields usually in the shared `IaFieldGrid`.
 */
export function IaFieldset({
  legend,
  children,
}: {
  readonly legend: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <fieldset className="rk-fieldset">
      <legend>{legend}</legend>
      {children}
    </fieldset>
  );
}

// ---- IA-11 Import students ---------------------------------------------------------------------

/**
 * The import's surface in the form column (`section.rk-surface.ia-form`, named by the page's H1):
 * a step's section (`IaStack sec`), the rows to fix where there are some, and its action bar.
 */
export function IaImportSurface({
  labelledBy,
  children,
}: {
  readonly labelledBy: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="rk-surface ia-form" aria-labelledby={labelledBy}>
      {children}
    </section>
  );
}

/**
 * Step 1's template (`div.ia-stack.ia-stack--tight`): "Use the template" (`h2.rk-h3`), the line
 * naming the columns and the course-code example, the columns as chips (`ul.ia-cols`) and
 * "Download the template (CSV)" (`a.rb-link[download]` with the down arrow — a `data:` link to the
 * header-only file, as the handoff marks intentional).
 */
export function IaImportTemplate({
  title,
  line,
  columnsLabel,
  columns,
  download,
}: {
  readonly title: ReactNode;
  readonly line: ReactNode;
  /** The columns list's name: "Required columns". */
  readonly columnsLabel: string;
  readonly columns: readonly string[];
  readonly download: {
    readonly href: string;
    readonly fileName: string;
    readonly label: ReactNode;
  };
}) {
  return (
    <div className="ia-stack ia-stack--tight">
      <h2 className="rk-h3">{title}</h2>
      <p className="rk-next">{line}</p>
      <ul className="ia-cols" aria-label={columnsLabel}>
        {columns.map((column) => (
          <li key={column}>{column}</li>
        ))}
      </ul>
      <p>
        {/* The arrow nudged as the export sets it inline (`vertical-align: -4px; margin-right:
            6px`): `rk-x-ico-lead` (V3P-16). */}
        <a className="rb-link" href={download.href} download={download.fileName}>
          <Icon name="arrowDown" size={18} className="rk-x-ico-lead" />
          {download.label}
        </a>
      </p>
    </div>
  );
}

/**
 * Step 2's first line (`div.ia-row`): the file's name as a plain code chip and the check's counts
 * on one line, announced (`p.rk-count[role=status]`).
 */
export function IaImportChecked({
  fileName,
  summary,
}: {
  readonly fileName: ReactNode;
  /** "13 rows checked · 9 ready to import · 4 rows with errors". */
  readonly summary: ReactNode;
}) {
  return (
    <div className="ia-row">
      <span className="rk-code rk-code--plain">{fileName}</span>
      <p className="rk-count" role="status">
        {summary}
      </p>
    </div>
  );
}

/**
 * The import that did not finish (`div.rk-errsum[role=alert][tabindex=-1]`): the title and what it
 * means ("Nothing was added. Try again."). It takes focus when it appears.
 */
export function IaImportFailed({
  id,
  title,
  line,
  ref,
}: {
  readonly id: string;
  readonly title: ReactNode;
  readonly line: ReactNode;
  readonly ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div ref={ref} className="rk-errsum" id={id} tabIndex={-1} role="alert">
      <p className="rk-errsum-t">{title}</p>
      <ul>
        <li>{line}</li>
      </ul>
    </div>
  );
}

/**
 * Step 3's lead line (`p.rk-next.rk-x-next-lead` > `b`): who will be added, in the export's larger
 * navy type (its inline `font-size: 17px; line-height: 26px; color: #141B5E`, V3P-16).
 */
export function IaImportLead({ children }: { readonly children: ReactNode }) {
  return (
    <p className="rk-next rk-x-next-lead">
      <b>{children}</b>
    </p>
  );
}

/** The result's list of who was added (`div.ia-stack.ia-stack--tight`): "Added", the names. */
export function IaImportAdded({
  title,
  names,
}: {
  readonly title: ReactNode;
  readonly names: ReactNode;
}) {
  return (
    <div className="ia-stack ia-stack--tight">
      <h2 className="rk-h3">{title}</h2>
      <p className="rk-next">{names}</p>
    </div>
  );
}

export interface IaFileChooserProps {
  /** The group's label (`p.rk-label`): "File to import". */
  readonly label: ReactNode;
  /** The label's id (the group is named by it). */
  readonly labelId: string;
  /** The chosen file's name and what is known of it, or none ("No file chosen" is `noFile`). */
  readonly file?: { readonly name: ReactNode; readonly detail?: ReactNode } | null;
  /** "No file chosen". */
  readonly noFile: ReactNode;
  /** The id of the line that names the chosen file (or says none is): the button's description. */
  readonly statusId: string;
  readonly button: {
    readonly id: string;
    /** "Choose a CSV file", "Choose another file". */
    readonly label: ReactNode;
    readonly ref?: Ref<HTMLButtonElement>;
  };
  /**
   * The browser's own chooser the button opens (an `input[type=file]`, visually hidden and out of
   * the Tab order): the file is read where it is chosen, nothing is uploaded.
   */
  readonly input: {
    readonly id: string;
    readonly accept: string;
    readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  };
  /** The words under the chooser (`p.rk-ferr[role=alert]`), with their id; none without them. */
  readonly error?: { readonly id: string; readonly text: ReactNode } | null;
}

/**
 * The file to import (`div.ia-stack.ia-stack--tight`): its label, the chooser row
 * (`div.ia-file[role=group]`: the file glyph, the chosen file's name or "No file chosen", the
 * button that opens the browser's chooser) and the words under it.
 */
export function IaFileChooser({
  label,
  labelId,
  file,
  noFile,
  statusId,
  button,
  input,
  error,
}: IaFileChooserProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="ia-stack ia-stack--tight">
      <p className="rk-label" id={labelId}>
        {label}
      </p>
      <div className="ia-file" role="group" aria-labelledby={labelId}>
        {/* Tinted indigo as the export sets it inline (`color: #3B49B8`): `rk-x-ico-file`
            (V3P-16). */}
        <Icon name="documentText" className="rk-x-ico-file" />
        {file ? (
          <span className="ia-file-name" id={statusId}>
            {file.name}
            {file.detail ? <span className="rk-small">{file.detail}</span> : null}
          </span>
        ) : (
          <span className="ia-file-name is-none" id={statusId}>
            {noFile}
          </span>
        )}
        <Button
          ref={button.ref}
          id={button.id}
          aria-describedby={joinClasses(statusId, error?.id)}
          onClick={() => inputRef.current?.click()}
        >
          {button.label}
        </Button>
        <input
          ref={inputRef}
          id={input.id}
          className="xr-sr"
          type="file"
          accept={input.accept}
          tabIndex={-1}
          aria-hidden="true"
          aria-labelledby={button.id}
          onChange={input.onChange}
        />
      </div>
      {error ? (
        <p className="rk-ferr" id={error.id} role="alert">
          <Glyph name="alertCircle" />
          {error.text}
        </p>
      ) : null}
    </div>
  );
}
