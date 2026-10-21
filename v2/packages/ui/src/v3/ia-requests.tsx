'use client';

import type { FormEvent, MouseEvent, ReactNode, Ref } from 'react';

import { joinClasses } from '../internal/classes.js';
import { useLinkComponent } from '../link.js';
import { Button, ButtonLink } from './actions.js';
import { StandList, type StandItem } from './detail.js';
import { IaCellText, IaListTable, IaRowLink } from './ia.js';
import { Glyph } from './icons.js';

/*
 * What only the Institute Admin's Requests screens draw — IA-17 Requests to BITS (the list, the
 * form and a request's detail), IA-18 Device requests and IA-19 Device request (`ia-` classes; the
 * owner-approved Institute Admin export, design/v3-refined-b/roles/IA-v1, `project/Main.dc.html`
 * "Requests head and tabs", "IA-17", "IA-18", "IA-19" and `project/ia-role.css`): the two list
 * tables (`ia-lt--rq`, `ia-lt--dv`, on the shared `IaListTable`), the in-place crumbs, the request
 * form's frame, sections and choice cards, the requester's message, "Where it stands", the device
 * request's action panel, its one action and its format line. The shared families (management
 * surface, record grid, section bodies, badges, action bar, busy button, message card) are
 * `ia.tsx`'s. Every word, figure and destination comes from the caller; no piece prints a
 * record's internal reference.
 *
 * The export's inline sizes are the central patch's product classes (V3P-16): the form's section
 * headings' `margin-bottom: 12px` ("What you need", "The plan you’re renewing": `rk-x-h3-above`),
 * the group errors' `margin-top: 8px` (`rk-x-ferr-group`), the message label's `margin-bottom:
 * 8px` (`rk-x-label-above`) and the format line's `gap: 6px 10px` (`rk-x-row-snug`).
 */

// ---- IA-17 Requests to BITS ------------------------------------------------------------------

export interface IaRqRow {
  readonly key: string;
  /** The row's link words, its kind ("More licences"); the whole row follows the link. */
  readonly name: ReactNode;
  /** The request detail's address. */
  readonly href: string;
  /** The link's name, by content: "More licences, sent 21 Oct 2026, Under review. Open the request". */
  readonly accessibleName: string;
  /** The line under the link ("Sent 21 Oct 2026"); none while it is not known. */
  readonly sub?: ReactNode;
  /** "What you asked for". */
  readonly what: ReactNode;
  /** The status pill (`StatusPill`); none while it is not known. */
  readonly status?: ReactNode;
  /** "Last change", its date and time. */
  readonly lastChange: ReactNode;
}

export interface IaRqTableProps {
  /** The table's name (a visually hidden caption): "Requests to BITS, newest first". */
  readonly caption: string;
  readonly headers: {
    readonly request: string;
    readonly what: string;
    readonly status: string;
    /** Also the inline label of the phone rows (`span.ia-lt-lab`). */
    readonly lastChange: string;
  };
  readonly rows: readonly IaRqRow[];
}

/**
 * Requests to BITS (`table.ia-lt.ia-lt--rq`): Request · What you asked for · Status · Last change,
 * the whole row opening the request; below 640 px each row is a short block (the request, its
 * status, what was asked for, the last change with its label).
 */
export function IaRqTable({ caption, headers, rows }: IaRqTableProps) {
  return (
    <IaListTable
      variant="rq"
      caption={caption}
      columns={[
        { key: 'request', header: headers.request },
        { key: 'what', header: headers.what },
        { key: 'status', header: headers.status },
        { key: 'when', header: headers.lastChange },
      ]}
      rows={rows.map((row) => ({
        key: row.key,
        link: true,
        cells: [
          {
            key: 'request',
            role: 'main',
            className: 'ia-rq-id',
            children: (
              <>
                <IaRowLink href={row.href} label={row.accessibleName}>
                  {row.name}
                </IaRowLink>
                {row.sub ? <IaCellText kind="sub">{row.sub}</IaCellText> : null}
              </>
            ),
          },
          { key: 'what', children: <IaCellText kind="text">{row.what}</IaCellText> },
          { key: 'status', role: 'pri', children: row.status },
          {
            key: 'when',
            className: 'ia-rq-when',
            label: headers.lastChange,
            children: (
              <IaCellText kind="text" inline>
                {row.lastChange}
              </IaCellText>
            ),
          },
        ],
      }))}
    />
  );
}

// ---- IA-18 Device requests -------------------------------------------------------------------

export interface IaRqDeviceRow {
  readonly key: string;
  /** The student's name, opening their record. */
  readonly student: { readonly name: ReactNode; readonly href: string };
  /** The institution's own student ID under the name ("GIT-2026-0418"); none when not known. */
  readonly studentId?: ReactNode;
  /** "VR device transfer", opening the request, named by content. */
  readonly request: {
    readonly label: ReactNode;
    readonly href: string;
    readonly accessibleName: string;
  };
  /** The line under the request: when it was asked ("22 Oct 2026"). */
  readonly date: ReactNode;
  /** The status pill (`StatusPill`). */
  readonly status: ReactNode;
  /** "Review" (`a.rb-btn`), only on a request waiting on the Institute Admin. */
  readonly review?: {
    readonly label: ReactNode;
    readonly href: string;
    readonly accessibleName: string;
  } | null;
}

export interface IaRqDeviceTableProps {
  /** The table's name (a visually hidden caption): "Device requests from your students". */
  readonly caption: string;
  readonly headers: {
    readonly student: string;
    readonly request: string;
    readonly status: string;
    /** The last column's name, for screen readers only: "Action". */
    readonly action: string;
  };
  readonly rows: readonly IaRqDeviceRow[];
}

/** The request's link in its cell (a plain `a`, named by content). */
function RequestLink({ request }: { readonly request: IaRqDeviceRow['request'] }) {
  const Link = useLinkComponent();
  return (
    <Link href={request.href} aria-label={request.accessibleName}>
      {request.label}
    </Link>
  );
}

/**
 * Device requests (`table.ia-lt.ia-lt--dv`): Student · Request · Status · the row's "Review"; below
 * 640 px each row is a short block (the student with "Review" beside, the status, the request).
 */
export function IaRqDeviceTable({ caption, headers, rows }: IaRqDeviceTableProps) {
  return (
    <IaListTable
      variant="dv"
      caption={caption}
      columns={[
        { key: 'student', header: headers.student },
        { key: 'request', header: headers.request },
        { key: 'status', header: headers.status },
        { key: 'action', header: headers.action, hidden: true },
      ]}
      rows={rows.map((row) => ({
        key: row.key,
        cells: [
          {
            key: 'student',
            role: 'main',
            className: 'ia-dv-who',
            children: (
              <>
                <IaRowLink href={row.student.href}>{row.student.name}</IaRowLink>
                {row.studentId ? (
                  <IaCellText kind="sub" nowrap>
                    {row.studentId}
                  </IaCellText>
                ) : null}
              </>
            ),
          },
          {
            key: 'request',
            className: 'ia-dv-req',
            children: (
              <>
                <IaCellText kind="text">
                  <RequestLink request={row.request} />
                </IaCellText>
                <IaCellText kind="sub">{row.date}</IaCellText>
              </>
            ),
          },
          { key: 'status', role: 'pri', children: row.status },
          {
            key: 'action',
            role: 'act',
            children: row.review ? (
              <ButtonLink href={row.review.href} aria-label={row.review.accessibleName}>
                {row.review.label}
              </ButtonLink>
            ) : null,
          },
        ],
      }))}
    />
  );
}

// ---- In-place crumbs (the form and its result) -----------------------------------------------

export interface IaRqCrumbsProps {
  /** The level above ("Requests"): a link to its address that, pressed, returns in place. */
  readonly back: {
    readonly label: string;
    readonly href: string;
    readonly onFollow: () => void;
  };
  /** This view (`span[aria-current=page]`): "Ask BITS", "Request sent". */
  readonly current: ReactNode;
}

/**
 * The crumbs of a view Requests shows in place (`nav.rk-crumbs`: "Requests › Ask BITS"): the
 * level above is a real link to its address, and a plain press returns to it without leaving the
 * page (`onFollow`), as the export's `V.back.go` does; a press that opens a new tab or window
 * follows the address.
 */
export function IaRqCrumbs({ back, current }: IaRqCrumbsProps) {
  const Link = useLinkComponent();
  const follow = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    back.onFollow();
  };
  return (
    <nav className="rk-crumbs" aria-label="Breadcrumb">
      <Link href={back.href} onClick={follow}>
        {back.label}
      </Link>
      <Glyph name="chevronRight" />
      <span aria-current="page">{current}</span>
    </nav>
  );
}

// ---- IA-17 the request form ------------------------------------------------------------------

export interface IaRqFormProps {
  /** The form's name: the page's H1 id. */
  readonly labelledBy: string;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  /** The form's parts (`IaRqFormPart`, `IaRqFormSection`), then the action bar (`IaActions`). */
  readonly children: ReactNode;
}

/**
 * The request form's column (`form.rk-surface.ia-form`, up to 860 px; the export's
 * `section.rk-surface.ia-form` with its separate `rk-sec` sections): the product's checks run on
 * submit (`noValidate`).
 */
export function IaRqForm({ labelledBy, onSubmit, children }: IaRqFormProps) {
  return (
    <form
      className="rk-surface ia-form"
      aria-labelledby={labelledBy}
      noValidate
      onSubmit={onSubmit}
    >
      {children}
    </form>
  );
}

/** A part of the form without a heading of its own (`div.rk-sec`): the error summary. */
export function IaRqFormPart({ children }: { readonly children: ReactNode }) {
  return <div className="rk-sec">{children}</div>;
}

export interface IaRqFormSectionProps {
  /** `h2.rk-h3`: "What you need", "Experiments and licences". */
  readonly title: ReactNode;
  readonly titleId: string;
  /**
   * The gap between the section's parts: none (`rk-sec`), 20 px (`stack`: `ia-stack`,
   * "Experiments and licences") or 12 px (`tight`: `ia-stack ia-stack--tight`, "Organisation and
   * contact person").
   */
  readonly layout?: 'stack' | 'tight';
  readonly children: ReactNode;
}

/**
 * A section of the form (`section.rk-sec` > `h2.rk-h3`). Without a `layout` its heading keeps
 * 12 px over what follows (`rk-x-h3-above`), as the export sets it inline.
 */
export function IaRqFormSection({ title, titleId, layout, children }: IaRqFormSectionProps) {
  return (
    <section
      className={joinClasses(
        'rk-sec',
        layout && 'ia-stack',
        layout === 'tight' && 'ia-stack--tight',
      )}
      aria-labelledby={titleId}
    >
      <h2 className={joinClasses('rk-h3', !layout && 'rk-x-h3-above')} id={titleId}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export interface IaRqChoice {
  readonly value: string;
  /** `span.rk-choice-t`: the choice's name. */
  readonly title: ReactNode;
  /** `span.rk-choice-d`: its consequence line, in its description. */
  readonly description?: ReactNode;
}

export interface IaRqChoicesProps {
  /** Radios (one of them) or checkboxes (any of them). */
  readonly kind: 'radio' | 'checkbox';
  /**
   * The fieldset's id — an error-summary link target: the link hands focus to the chosen option
   * or else the first one — and the base of the option ids (`<id>-<value>`) and the error id
   * (`<id>-e`).
   */
  readonly id: string;
  /** The radios' group name. */
  readonly name?: string;
  /** The question (`legend`). */
  readonly legend: ReactNode;
  /** The legend for screen readers only (`legend.xr-sr`): the section's heading says it. */
  readonly legendHidden?: boolean;
  readonly options: readonly IaRqChoice[];
  /** The chosen values. */
  readonly values: readonly string[];
  readonly onToggle: (value: string) => void;
  /**
   * The error under the options (`p.rk-ferr`, 8 px under them: `rk-x-ferr-group`), in the
   * fieldset's description.
   */
  readonly error?: ReactNode;
}

/**
 * Choice cards (`fieldset.rk-fieldset` > `legend` + `div.rk-choices` > `label.rk-choice`): "What
 * you need" (radios, its legend hidden under the section's heading) and the experiments of a
 * more-licences request (checkboxes). Each control is named by its title and described by its
 * line (the export's label wraps both, so the line was read twice); the group's error is in the
 * fieldset's description.
 */
export function IaRqChoices({
  kind,
  id,
  name,
  legend,
  legendHidden = false,
  options,
  values,
  onToggle,
  error,
}: IaRqChoicesProps) {
  const errorId = error ? `${id}-e` : undefined;
  return (
    <fieldset className="rk-fieldset" id={id} aria-describedby={errorId}>
      <legend className={legendHidden ? 'xr-sr' : undefined}>{legend}</legend>
      <div className="rk-choices">
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          const titleId = `${optionId}-t`;
          const descriptionId = option.description ? `${optionId}-d` : undefined;
          return (
            <label key={option.value} className="rk-choice" htmlFor={optionId}>
              <input
                type={kind}
                id={optionId}
                name={kind === 'radio' ? name : undefined}
                checked={values.includes(option.value)}
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                onChange={() => onToggle(option.value)}
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
        <p className="rk-ferr rk-x-ferr-group" id={errorId}>
          <Glyph name="alertCircle" />
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/**
 * A note under the choices that is not an alert (`div.rk-notice.rk-notice--info.ia-gap-top
 * [role=note]`): "You’ve already asked for a renewal".
 */
export function IaRqNote({
  title,
  children,
}: {
  readonly title: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className="rk-notice rk-notice--info ia-gap-top" role="note">
      <Glyph name="infoNote" />
      <p className="rk-notice-t">{title}</p>
      <p className="rk-notice-d">{children}</p>
    </div>
  );
}

// ---- IA-17 the request's detail --------------------------------------------------------------

/**
 * The requester's message under the facts (`div.ia-gap-top` > `p.rk-label.rk-x-label-above` +
 * `p.rk-quote`), quoted by the caller.
 */
export function IaRqMessage({
  label,
  children,
}: {
  /** "Message to BITS". */
  readonly label: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className="ia-gap-top">
      <p className="rk-label rk-x-label-above">{label}</p>
      <p className="rk-quote">{children}</p>
    </div>
  );
}

/**
 * Where a request stands (`dl.rk-stand`: Request · Payment · Your access plan, kept apart) and the
 * line under it (`p.rk-hint.ia-gap-top-s`).
 */
export function IaRqStands({
  items,
  hint,
}: {
  readonly items: readonly StandItem[];
  readonly hint: ReactNode;
}) {
  return (
    <>
      <StandList items={items} />
      <p className="rk-hint ia-gap-top-s">{hint}</p>
    </>
  );
}

// ---- IA-19 the device request ----------------------------------------------------------------

export interface IaRqActionPanelProps {
  /** "Your action". */
  readonly title: ReactNode;
  readonly titleId: string;
  /** What the Institute Admin can do now (`p.rk-next`), the one action and where it stands. */
  readonly children: ReactNode;
}

/** The device request's action panel (`section.rk-panel` > navy `div.rk-panel-head` + body). */
export function IaRqActionPanel({ title, titleId, children }: IaRqActionPanelProps) {
  return (
    <section className="rk-panel" aria-labelledby={titleId}>
      <div className="rk-panel-head">
        <h2 id={titleId}>{title}</h2>
      </div>
      <div className="rk-panel-body">{children}</div>
    </section>
  );
}

export interface IaRqForwardButtonProps {
  readonly id?: string;
  readonly onPress: () => void;
  readonly ref?: Ref<HTMLButtonElement>;
  /** "Forward to BITS". */
  readonly children: ReactNode;
}

/** The panel's one action, its full width (`button.rb-btn.rb-btn--primary.rb-btn--lg.rk-go`). */
export function IaRqForwardButton({ id, onPress, ref, children }: IaRqForwardButtonProps) {
  return (
    <Button ref={ref} id={id} variant="primary" size="lg" className="rk-go" onClick={onPress}>
      {children}
    </Button>
  );
}

/**
 * The format a device request moves and what it is for, 6 px by 10 px apart (`span.ia-row
 * .rk-x-row-snug` > `span.xr-fmt` + `span`): "VR" · "for Shell-and-Tube Heat Exchanger".
 */
export function IaRqFormatFor({
  code,
  children,
}: {
  /** "VR". */
  readonly code: string;
  /** "for Shell-and-Tube Heat Exchanger"; none when the transfer names no experiment. */
  readonly children?: ReactNode;
}) {
  return (
    <span className="ia-row rk-x-row-snug">
      <span className="xr-fmt">{code}</span>
      {children ? <span>{children}</span> : null}
    </span>
  );
}
