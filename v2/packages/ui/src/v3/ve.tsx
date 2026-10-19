'use client';

/*
 * The Vendor role's shared patterns (`ve-` and `vr-` classes; the owner-approved Vendor export,
 * design/v3-refined-b/roles/VE-v1, `project/v3-vendor.css` and its COMPONENT-EXTENSIONS.md): what
 * more than one Vendor screen group draws — the returned-reason panel (the record and the editor in
 * revise mode), the read-only delivery blocks (the record, the check step, a read-only draft), the
 * compact format chips (the record's "Where it stands", the outcome card, a read-only draft), the
 * titled sections and the learning outcomes (the record and the check step). One component per
 * pattern; a screen group's module (`ve-workspace.tsx`, `ve-editor.tsx`, `ve-record.tsx`) keeps only
 * what that group alone draws. Markup as the export's `Main.dc.html` draws it; every word, figure,
 * date and action comes from the caller.
 *
 * Where the export differs from what ships: its sprite `<use href="#vei-…">` is the kit's path
 * (`Glyph`, the same drawings); `vr-dlv--ro`, which no sheet styles, is not emitted; the format chips
 * the export names with an `aria-label` on a plain `span` carry visually hidden words instead, as
 * the kit's `FormatBadges` does (ADR-0010); the export's inline `margin-bottom: 10px` on the
 * outcomes' line is the product class `rk-x-intro-below` (V3P-13).
 */
import { Fragment, type ReactNode, type Ref } from 'react';

import { joinClasses } from '../internal/classes.js';
import { Glyph } from './icons.js';

// ---- the returned-reason panel ------------------------------------------------------------------

/** A "What it refers to" chip (`button.ve-ref`). */
export interface VendorReference {
  readonly key: string;
  /** The reference in words: "Formats & delivery · AR · Device need". */
  readonly label: ReactNode;
  /** The chip's name: "Revise: go to Formats & delivery · AR · Device need". */
  readonly accessibleName: string;
  /** Opens the field in the editor (the export's `startRevise(id, field)` and `jumpRef`). */
  readonly onSelect: () => void;
}

export interface VendorReturnedReasonProps {
  /** The panel's id: a focus target (`tabindex=-1`), the export's `ve-reason`. */
  readonly id: string;
  readonly titleId: string;
  /** "Returned by the Academic Reviewer". */
  readonly title: ReactNode;
  /** When and who: "24 Aug 2026, 09:30 · Prof. A. Menon". */
  readonly meta: ReactNode;
  /** The reason in their words. */
  readonly reason: ReactNode;
  /** "What it refers to" (its label and the label's id) and the chips; none drawn when empty. */
  readonly references?: {
    readonly label: ReactNode;
    readonly labelId: string;
    readonly items: readonly VendorReference[];
  };
  /**
   * Changes saved but not resubmitted (`div.vr-ret-pend[role=status]`, the record): its title and
   * line. The export also lists the changed fields ("Changed since revision N"); that list is drawn
   * only by a read that holds it.
   */
  readonly saved?: { readonly title: ReactNode; readonly line: ReactNode };
  readonly ref?: Ref<HTMLElement>;
}

/**
 * The returned-reason panel (`section.vr-ret`; VE-07 the record, VE-08 above the editor): the
 * return icon, who returned it and when, the reason in their words, "What it refers to" as chips
 * (`button.ve-ref`) and, inside it, the changes saved and not resubmitted.
 */
export function VendorReturnedReason({
  id,
  titleId,
  title,
  meta,
  reason,
  references,
  saved,
  ref,
}: VendorReturnedReasonProps) {
  return (
    <section className="vr-ret" id={id} tabIndex={-1} aria-labelledby={titleId} ref={ref}>
      <span className="vr-ret-ico" aria-hidden="true">
        <Glyph name="returned" />
      </span>
      <div className="vr-ret-main">
        <h2 className="vr-ret-t" id={titleId}>
          {title}
        </h2>
        <p className="vr-ret-m">{meta}</p>
        <blockquote className="vr-ret-q">{reason}</blockquote>
        {references && references.items.length > 0 ? (
          <div className="vr-ret-refs">
            <p className="vr-ret-refs-k" id={references.labelId}>
              {references.label}
            </p>
            <ul className="vr-ret-reflist" aria-labelledby={references.labelId}>
              {references.items.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    className="ve-ref"
                    aria-label={item.accessibleName}
                    onClick={item.onSelect}
                  >
                    {item.label}
                    <Glyph name="next" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {saved ? (
          <div className="vr-ret-pend" role="status">
            <Glyph name="lock" />
            <div>
              <p className="vr-ret-pend-t">{saved.title}</p>
              <p className="vr-ret-pend-d">{saved.line}</p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

// ---- format chips -------------------------------------------------------------------------------

export interface VendorFormatChipsProps {
  /** The format codes in WEB · AR · VR · MR order. */
  readonly formats: readonly string[];
  /**
   * What the chips mean, read instead of the codes ("Formats: WEB, VR"): visually hidden words, the
   * chips hidden. Without it the chips are read as they are (a read-only draft's "Formats").
   */
  readonly label?: string;
}

/** Compact format chips (`span.ve-chips` > `span.xr-fmt`). */
export function VendorFormatChips({ formats, label }: VendorFormatChipsProps) {
  return (
    <span className="ve-chips">
      {label ? <span className="xr-sr">{label}</span> : null}
      {formats.map((format) => (
        <span key={format} className="xr-fmt" aria-hidden={label ? 'true' : undefined}>
          {format}
        </span>
      ))}
    </span>
  );
}

// ---- delivery, read-only ------------------------------------------------------------------------

/**
 * The delivery blocks (`div.vr-dlvs`): the editable blocks of step 2 and the read-only ones;
 * `after` spaces them under a definition list (a read-only draft's "What you entered").
 */
export function VendorDeliveryList({
  after = false,
  children,
}: {
  readonly after?: boolean;
  readonly children: ReactNode;
}) {
  return <div className={joinClasses('vr-dlvs', after && 'vr-dlvs--after')}>{children}</div>;
}

export interface VendorDeliveryViewProps {
  /** "WEB", "VR". */
  readonly code: string;
  /** "Browser", "Virtual reality". */
  readonly name: ReactNode;
  /** "Web link", "App package". */
  readonly kind: ReactNode;
  /** "Web link" → the link, "Package file" → the file's name, … in the record's order. */
  readonly rows: readonly { readonly term: ReactNode; readonly value: ReactNode }[];
}

/**
 * A chosen format's delivery, read-only (`div.vr-dlv` > `div.vr-dlv-h` + `dl.rk-dl.vr-dlv-b`): the
 * chip, the format's name and kind, then its rows (the record, the check step, a read-only draft).
 */
export function VendorDeliveryView({ code, name, kind, rows }: VendorDeliveryViewProps) {
  return (
    <div className="vr-dlv">
      <div className="vr-dlv-h">
        <span className="xr-fmt">{code}</span>
        <p className="vr-dlv-t">
          {name} <span className="vr-dlv-k">· {kind}</span>
        </p>
      </div>
      <dl className="rk-dl vr-dlv-b">
        {rows.map((row, index) => (
          <Fragment key={index}>
            <dt>{row.term}</dt>
            <dd>{row.value}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}

// ---- sections -----------------------------------------------------------------------------------

/**
 * A label or title with the quiet "(optional)" after it (`span.ve-opt`). Shared by the Vendor
 * modules only (the editor's field labels and review titles); not part of `@xr/ui/v3`.
 */
export function WithVendorOptional({
  children,
  optional,
}: {
  readonly children: ReactNode;
  readonly optional?: ReactNode;
}) {
  return (
    <>
      {children}
      {optional ? (
        <>
          {' '}
          <span className="ve-opt">{optional}</span>
        </>
      ) : null}
    </>
  );
}

export interface VendorSectionProps {
  readonly titleId: string;
  readonly title: ReactNode;
  /** "(optional)" after the title. */
  readonly optional?: ReactNode;
  /** The one-line description under the title (`p.vr-sec-d`). */
  readonly description?: ReactNode;
  /** A quiet line at the end of the head (`p.vr-sec-st`): "1 of 2 formats complete". */
  readonly status?: ReactNode;
  /** The status is announced as it changes (`role="status"`). */
  readonly statusLive?: boolean;
  /** An action at the end of the head ("Add document"). */
  readonly action?: ReactNode;
  /**
   * The head as a row (`vr-sec-h--row`): by default when there is a status or an action; the
   * record's "Formats and delivery" draws the row with its status line only once published.
   */
  readonly row?: boolean;
  /**
   * `group` (`div.vr-sec[role=group]`, the editing steps), `section` (`section.vr-sec`, the
   * record's and the check step's read-only sections) or `div` (a plain `div.vr-sec`: the one
   * section of a sheet the sheet's own label names — the history, "What you entered").
   */
  readonly as?: 'group' | 'section' | 'div';
  /** The title takes focus (`tabIndex={-1}`): from the outline, or when its tab opens. */
  readonly titleFocusTarget?: boolean;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** The note closing the section (`p.vr-foot`, the information glyph). */
  readonly note?: ReactNode;
  readonly children?: ReactNode;
}

/**
 * A titled section of a Vendor sheet or form (`vr-sec` > `vr-sec-h` > `h2.vr-sec-t`): the title, an
 * optional description, and at the end of the head a status or an action (`vr-sec-h--row`); then
 * its content and an optional closing note. The editor's step groups, the check step's and the
 * record's sections, and the single section of the history and "What you entered" sheets.
 */
export function VendorSection({
  titleId,
  title,
  optional,
  description,
  status,
  statusLive = false,
  action,
  row,
  as = 'group',
  titleFocusTarget = false,
  titleRef,
  note,
  children,
}: VendorSectionProps) {
  const heading = (
    <h2
      className="vr-sec-t"
      id={titleId}
      tabIndex={titleFocusTarget ? -1 : undefined}
      ref={titleRef}
    >
      <WithVendorOptional optional={optional}>{title}</WithVendorOptional>
    </h2>
  );
  const descriptionLine = description ? <p className="vr-sec-d">{description}</p> : null;
  const asRow = row ?? (status !== undefined || action !== undefined);
  const head = asRow ? (
    <div className="vr-sec-h vr-sec-h--row">
      {descriptionLine ? (
        <div>
          {heading}
          {descriptionLine}
        </div>
      ) : (
        heading
      )}
      {status !== undefined ? (
        <p className="vr-sec-st" role={statusLive ? 'status' : undefined}>
          {status}
        </p>
      ) : null}
      {action}
    </div>
  ) : (
    <div className="vr-sec-h">
      {heading}
      {descriptionLine}
    </div>
  );
  const footNote = note ? (
    <p className="vr-foot">
      <Glyph name="infoNote" />
      <span>{note}</span>
    </p>
  ) : null;
  if (as === 'section') {
    return (
      <section className="vr-sec" aria-labelledby={titleId}>
        {head}
        {children}
        {footNote}
      </section>
    );
  }
  if (as === 'div') {
    return (
      <div className="vr-sec">
        {head}
        {children}
        {footNote}
      </div>
    );
  }
  return (
    <div className="vr-sec" role="group" aria-labelledby={titleId}>
      {head}
      {children}
      {footNote}
    </div>
  );
}

// ---- learning outcomes --------------------------------------------------------------------------

export interface VendorLearningOutcomesProps {
  readonly titleId: string;
  /** "Learning outcomes". */
  readonly title: ReactNode;
  /** "Added by the Academic Reviewer · read-only". */
  readonly by: ReactNode;
  readonly outcomes: readonly { readonly key: string; readonly text: ReactNode }[];
  /** "One set for every format." over the list. */
  readonly line: ReactNode;
  /** "None yet. The Academic Reviewer adds them during review — one set for every format." */
  readonly empty: ReactNode;
}

/**
 * The learning outcomes, read-only (`section.vr-sec` > `p.ve-intro` + `ol.ve-los`, or the "None
 * yet" line): the record's Details and the check step. The line over the list is spaced 10 px from
 * it, as the export's inline style does (`rk-x-intro-below`, V3P-13).
 */
export function VendorLearningOutcomes({
  titleId,
  title,
  by,
  outcomes,
  line,
  empty,
}: VendorLearningOutcomesProps) {
  return (
    <VendorSection as="section" titleId={titleId} title={title} status={by}>
      {outcomes.length > 0 ? (
        <>
          <p className="ve-intro rk-x-intro-below">{line}</p>
          <ol className="ve-los">
            {outcomes.map((outcome) => (
              <li key={outcome.key}>{outcome.text}</li>
            ))}
          </ol>
        </>
      ) : (
        <p className="ve-intro">{empty}</p>
      )}
    </VendorSection>
  );
}
