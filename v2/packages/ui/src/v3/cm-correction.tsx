'use client';

import type { ChangeEvent, ReactNode, Ref } from 'react';

import { joinClasses } from '../internal/classes.js';
import { Button } from './actions.js';
import { CmGroupHead, CmInLabel, CmTag } from './cm.js';
import { Quote } from './detail.js';
import { Glyph, type V3IconName } from './icons.js';
import type { Figure } from './overview.js';

/*
 * What only the Content Manager's correction group draws (the owner-approved Content Manager
 * export, design/v3-refined-b/roles/CM-v1, `project/Main.dc.html` "CM-08 Updates list" and "CM-08
 * Correction detail", `project/cm.css`; COMPONENT-EXTENSIONS.md E, O, 4 and 5): the Updates head
 * with its figures, the correction tracker (cards grouped by who must act), the returned reason,
 * the correction form (sections, the reason-and-label grid, fields with a Changed tag), the change
 * comparison and the panel's state notice and save failure. The stage track, version change,
 * identity band, group head and small pieces are the shared `cm.tsx`. Every word, figure, date and
 * destination comes from the caller.
 */

// ---- CM-08 Updates: the head ---------------------------------------------------------------------

export interface CmUpdatesHeadProps {
  /** The page's H1 (`h1.rb-h1`, `tabindex=-1`): "Updates". */
  readonly title: ReactNode;
  readonly titleId: string;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** Today's date on phones (`p.rb-eyebrow-date`), from the application's clock. */
  readonly date?: ReactNode;
  /** The line under the title (`p.rk-sub`). */
  readonly lead: ReactNode;
  /** The figures beside the title (`dl.rb-figs`); none while the list loads or can't load. */
  readonly figures?: readonly Figure[];
  readonly figuresLabel?: string;
}

/**
 * The Updates head (`div.rb-head`): date, title and its line, and the two figures — Need you,
 * With others — each with its scope line. The kit's `OverviewHead` draws no line under the title.
 */
export function CmUpdatesHead({
  title,
  titleId,
  titleRef,
  date,
  lead,
  figures = [],
  figuresLabel,
}: CmUpdatesHeadProps) {
  return (
    <div className="rb-head">
      <div>
        {date ? <p className="rb-eyebrow-date">{date}</p> : null}
        <h1 className="rb-h1" id={titleId} ref={titleRef} tabIndex={-1}>
          {title}
        </h1>
        <p className="rk-sub">{lead}</p>
      </div>
      {figures.length > 0 ? (
        <dl className="rb-figs" aria-label={figuresLabel}>
          {figures.map((figure, index) => (
            <div key={index} className="rb-fig">
              <dt className="rb-fig-t">{figure.title}</dt>
              <dd className="rb-fig-n">{figure.value}</dd>
              {figure.details?.map((detail, detailIndex) => (
                <dd key={detailIndex} className="rb-fig-s">
                  {detail}
                </dd>
              ))}
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

// ---- E. Correction tracker -----------------------------------------------------------------------

/** "4 corrections you raised, most recent change first" (`p.rk-count.cm-trkcount`, a status). */
export function CmTrackerCount({ children }: { readonly children: ReactNode }) {
  return (
    <p className="rk-count cm-trkcount" role="status">
      {children}
    </p>
  );
}

export interface CmTrackerSectionProps {
  /** "Need you", "With others", "Closed". */
  readonly title: ReactNode;
  readonly titleId: string;
  readonly count: ReactNode;
  /** The count in gold: the group that needs the Content Manager. */
  readonly countYou?: boolean;
  /** "Change it and send it, or withdraw it". */
  readonly note?: ReactNode;
  /** The group's cards (`CmTrackerItem`). */
  readonly children: ReactNode;
}

/** One group of the tracker (`section.cm-trksec` > `div.cm-grp-head` + `ul.cm-trklist`). */
export function CmTrackerSection({
  title,
  titleId,
  count,
  countYou = false,
  note,
  children,
}: CmTrackerSectionProps) {
  return (
    <section className="cm-trksec" aria-labelledby={titleId}>
      <CmGroupHead title={title} titleId={titleId} count={count} countYou={countYou} note={note} />
      <ul className="cm-trklist">{children}</ul>
    </section>
  );
}

export interface CmTrackerOutcome {
  /** "Released by Arjun Mehta, Super Admin, on 5 Aug 2026. Version 1.1 is live for everyone." */
  readonly text: ReactNode;
  /** `released` (green tick, `is-ok`) or `withdrawn` (grey end mark). */
  readonly kind: 'released' | 'withdrawn';
}

export interface CmTrackerItemProps {
  /** The experiment's name (`h3.cm-qname`). */
  readonly name: ReactNode;
  /**
   * "EEE ZC341 · Electrical Machines · last change 26 Aug" — never the update's reference (the
   * owner's correction of 20 Oct 2026; the export leads with it).
   */
  readonly meta: ReactNode;
  /** The version change (`CmVersionChange`). */
  readonly version: ReactNode;
  /** The status pill (`StatusPill`). */
  readonly status: ReactNode;
  /** The card's one action (`ButtonLink`): "Continue" (primary) or "Open". */
  readonly action: ReactNode;
  /** The mini four-stage track (`CmStageTrack placement="tracker" mini`); none once closed. */
  readonly track?: ReactNode;
  /** A closed correction's outcome line (`p.cm-trk-res`), instead of the track. */
  readonly outcome?: CmTrackerOutcome;
  /** The return, hold or withdrawal reason (`CmQuote tracker`). */
  readonly note?: ReactNode;
  /** The Content Manager's to continue (ivory, `is-you`). */
  readonly yours?: boolean;
  /** Released or withdrawn (`is-closed`). */
  readonly closed?: boolean;
}

/**
 * One correction (`li.cm-trk`): its name, course and last change with its version change; its
 * status and action; the mini track, or the outcome once closed; the reason quoted. Below 700 px of
 * list the status leads and the action takes the full width (container `cmtrk`).
 */
export function CmTrackerItem({
  name,
  meta,
  version,
  status,
  action,
  track,
  outcome,
  note,
  yours = false,
  closed = false,
}: CmTrackerItemProps) {
  return (
    <li className={joinClasses('cm-trk', yours && 'is-you', closed && 'is-closed')}>
      <div className="cm-trk-id">
        <h3 className="cm-qname">{name}</h3>
        <p className="cm-trk-meta">
          <span>{meta}</span>
          {version}
        </p>
      </div>
      <p className="cm-trk-st">{status}</p>
      <div className="cm-trk-act">{action}</div>
      {track}
      {outcome ? (
        <p className={joinClasses('cm-trk-res', outcome.kind === 'released' && 'is-ok')}>
          <Glyph name={outcome.kind === 'released' ? 'check' : 'ended'} />
          {outcome.text}
        </p>
      ) : null}
      {note}
    </li>
  );
}

/** The line under the groups (`p.rb-note.cm-trkfoot`): where corrections start. */
export function CmTrackerFoot({ children }: { readonly children: ReactNode }) {
  return <p className="rb-note cm-trkfoot">{children}</p>;
}

export interface CmTrackerLoadingProps {
  /** "Loading your corrections…", announced. */
  readonly message: ReactNode;
  /** The surface's name: "Corrections you raised". */
  readonly label: string;
}

/**
 * The tracker while the list loads (`section.rk-surface[aria-busy]` > `p.rk-loading-msg` + the
 * skeleton band and two cards, `div.rk-skel-ca`). The kit's `LoadingCards` draws one card.
 */
export function CmTrackerLoading({ message, label }: CmTrackerLoadingProps) {
  const skeletonCard = (
    <div className="rk-skel-card">
      <span className="rk-skel" />
      <div className="rk-skel-cells">
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
  return (
    <section className="rk-surface" aria-busy="true" aria-label={label}>
      <p className="rk-loading-msg" role="status">
        {message}
      </p>
      <div className="rk-skel-ca" aria-hidden="true">
        <div className="rk-skel-band">
          <span className="rk-skel" />
          <span className="rk-skel" />
        </div>
        {skeletonCard}
        {skeletonCard}
      </div>
    </section>
  );
}

// ---- 5. Correction form --------------------------------------------------------------------------

export interface CmReturnedReasonProps {
  /** "Returned by the Academic Reviewer" (`h2.rb-h2`). */
  readonly title: ReactNode;
  readonly titleId: string;
  /** When and who (`p.cm-retbox-m`): "26 Aug 2026, 10:00 · Prof. A. Menon". */
  readonly meta: ReactNode;
  /** The reviewer's reason, quoted (`blockquote.rk-quote`). */
  readonly reason: ReactNode;
  /** Whose words (`p.rk-quote-by`): "Prof. A. Menon, Academic Reviewer". */
  readonly by?: ReactNode;
  /** What to do now (`p.rk-hint`), while the correction is editable. */
  readonly hint?: ReactNode;
}

/** The Academic Reviewer's return reason, first on the sheet (`section.rk-sec` > `div.cm-retbox`). */
export function CmReturnedReason({
  title,
  titleId,
  meta,
  reason,
  by,
  hint,
}: CmReturnedReasonProps) {
  return (
    <section className="rk-sec" aria-labelledby={titleId}>
      <div className="cm-retbox">
        <div className="cm-retbox-h">
          <h2 className="rb-h2" id={titleId}>
            {title}
          </h2>
          <p className="cm-retbox-m">{meta}</p>
        </div>
        <Quote by={by}>{reason}</Quote>
        {hint ? <p className="rk-hint">{hint}</p> : null}
      </div>
    </section>
  );
}

export interface CmFormSectionProps {
  readonly title: ReactNode;
  readonly titleId: string;
  /** The quiet line beside the title (`p.rb-note`): "Pre-filled with the live version". */
  readonly note?: ReactNode;
  readonly children: ReactNode;
}

/** A section of the correction sheet (`section.rk-sec` > `div.rk-sec-h` > `h2.rb-h2` + `p.rb-note`). */
export function CmFormSection({ title, titleId, note, children }: CmFormSectionProps) {
  return (
    <section className="rk-sec" aria-labelledby={titleId}>
      <div className="rk-sec-h">
        <h2 className="rb-h2" id={titleId}>
          {title}
        </h2>
        {note ? <p className="rb-note">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

/**
 * Fields side by side (`div.cm-formgrid`): `about` gives the reason the room and the version label
 * 200–260 px (`cm-formgrid--about`); else two equal columns (the app package references). One
 * column below 640 px of sheet.
 */
export function CmFormGrid({
  about = false,
  children,
}: {
  readonly about?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <div className={joinClasses('cm-formgrid', about && 'cm-formgrid--about')}>{children}</div>
  );
}

/** The correction's fields in a column (`div.cm-form`; each field at most 46em wide). */
export function CmForm({ children }: { readonly children: ReactNode }) {
  return <div className="cm-form">{children}</div>;
}

export interface CmCorrectionFieldProps {
  /** The control's id (an error-summary link target); the hint is `<id>-hint`. */
  readonly id: string;
  readonly label: ReactNode;
  /** "Changed" (`span.cm-tag`) beside the label while the value differs from the live one. */
  readonly changed?: ReactNode;
  /** `p.rk-hint` between the label and the control, in the control's description. */
  readonly hint?: ReactNode;
  /** `textarea.rk-textarea` (summary, description) instead of `input.rk-input`. */
  readonly multiline?: boolean;
  /**
   * The text area's height as the export sets it inline (`min-height`, V3P-14): `short` 80 px
   * (Summary, `rk-x-textarea-short`) or `long` 150 px (Description, `rk-x-textarea-long`); else
   * the kit's 104 px.
   */
  readonly height?: 'short' | 'long';
  /** The input's type: `text`, or `url` for the web link. */
  readonly type?: 'text' | 'url';
  /** No spell check (a link, a package reference). */
  readonly code?: boolean;
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** More ids for the control's description, after the hint (an error that lands on this field). */
  readonly describedBy?: string;
}

/**
 * A catalogue or delivery field of the correction (`div.rk-field` > `div.cm-label-row` with the
 * label and its Changed tag, the hint, the control). The kit's `Field` draws the label alone.
 */
export function CmCorrectionField({
  id,
  label,
  changed,
  hint,
  multiline = false,
  height,
  type = 'text',
  code = false,
  value,
  onChange,
  describedBy,
}: CmCorrectionFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const description = [hintId, describedBy].filter(Boolean).join(' ') || undefined;
  const change = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange(event.target.value);
  return (
    <div className="rk-field">
      <div className="cm-label-row">
        <label className="rk-label" htmlFor={id}>
          {label}
        </label>
        {changed ? <CmTag>{changed}</CmTag> : null}
      </div>
      {hint ? (
        <p className="rk-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {multiline ? (
        <textarea
          id={id}
          className={joinClasses('rk-textarea', height && `rk-x-textarea-${height}`)}
          value={value}
          aria-describedby={description}
          onChange={change}
        />
      ) : (
        <input
          id={id}
          className="rk-input"
          type={type}
          value={value}
          autoComplete="off"
          spellCheck={code ? false : undefined}
          aria-describedby={description}
          onChange={change}
        />
      )}
    </div>
  );
}

// ---- 4. Change comparison ------------------------------------------------------------------------

export interface CmComparisonRow {
  readonly key: string;
  /** "Description", "WEB · web link", "VR · package reference", "Version". */
  readonly field: ReactNode;
  readonly before: ReactNode;
  readonly after: ReactNode;
}

export interface CmComparisonProps {
  /** The table's name (`caption`, screen readers): "Current and proposed, changed fields only". */
  readonly caption: ReactNode;
  /** The column heads: "Field", "Live now" / "Live before", "Proposed" / "Released". */
  readonly columns: {
    readonly field: ReactNode;
    readonly before: ReactNode;
    readonly after: ReactNode;
  };
  /** The changed fields only, in order. */
  readonly rows: readonly CmComparisonRow[];
  /** With no row: "Nothing changed yet." (`p.cm-cmp-empty`). */
  readonly empty: ReactNode;
  /**
   * "Change at least one …" over the comparison (`p.rk-ferr`, 10 px above it as the export sets it
   * inline on `#cm-u-chg-err`: `rk-x-ferr-below`, V3P-14); its id describes the first field.
   */
  readonly error?: { readonly id: string; readonly text: ReactNode };
}

/**
 * The changed fields only, before against after (`div.cm-cmpwrap` > `table.cm-cmp`), the proposed
 * column tinted, the change error above it. Below 640 px each field becomes a labelled block
 * (`span.cm-inlabel`).
 */
export function CmComparison({ caption, columns, rows, empty, error }: CmComparisonProps) {
  const errorLine = error ? (
    <p className="rk-ferr rk-x-ferr-below" id={error.id}>
      <Glyph name="alertCircle" />
      {error.text}
    </p>
  ) : null;
  if (rows.length === 0) {
    return (
      <>
        {errorLine}
        <div className="cm-cmpwrap">
          <p className="cm-cmp-empty">{empty}</p>
        </div>
      </>
    );
  }
  return (
    <>
      {errorLine}
      <div className="cm-cmpwrap">
        <table className="cm-cmp">
          <caption>{caption}</caption>
          <thead>
            <tr>
              <th scope="col">{columns.field}</th>
              <th scope="col">{columns.before}</th>
              <th scope="col">{columns.after}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="cm-cmp-f">{row.field}</td>
                <td className="cm-cmp-now">
                  <CmInLabel>{columns.before}</CmInLabel>
                  {row.before}
                </td>
                <td className="cm-cmp-new">
                  <CmInLabel>{columns.after}</CmInLabel>
                  {row.after}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---- The panel: where the correction stands --------------------------------------------------------

export type CmStateNoticeTone = 'info' | 'paused' | 'ok' | 'off';

export interface CmStateNoticeProps {
  readonly tone: CmStateNoticeTone;
  readonly icon: V3IconName;
  /** "Returned to you", "On hold", … (`p.rk-notice-t`). */
  readonly title: ReactNode;
  /** What it means now (`p.rk-notice-d`). */
  readonly children: ReactNode;
  /** The hold or withdrawal reason: "Reason:" in bold, then the quoted words. */
  readonly reason?: { readonly label: ReactNode; readonly text: ReactNode };
  /** One more line: "The hold was lifted on 27 Aug 2026. …". */
  readonly extra?: ReactNode;
  /** The notice takes focus after a command (`tabindex=-1`). */
  readonly id: string;
  readonly ref?: Ref<HTMLDivElement>;
}

/**
 * Where the correction stands, first in the panel (`div.rk-notice[role=status]`): the state, what
 * it means for the live version and, on hold or withdrawn, the reason. The export places the
 * reason and the extra line in the text column, each a `p.rk-notice-d` with an inline
 * `grid-column: 2; margin-top: 6px` (`rk-x-notice-more`, V3P-14).
 */
export function CmStateNotice({
  tone,
  icon,
  title,
  children,
  reason,
  extra,
  id,
  ref,
}: CmStateNoticeProps) {
  return (
    <div ref={ref} className={`rk-notice rk-notice--${tone}`} role="status" id={id} tabIndex={-1}>
      <Glyph name={icon} />
      <p className="rk-notice-t">{title}</p>
      <p className="rk-notice-d">{children}</p>
      {reason ? (
        <p className="rk-notice-d rk-x-notice-more">
          <b>{reason.label}</b> {reason.text}
        </p>
      ) : null}
      {extra ? <p className="rk-notice-d rk-x-notice-more">{extra}</p> : null}
    </div>
  );
}

export interface CmSaveFailedProps {
  /** "We couldn’t save your draft" (`p.rk-errsum-t`). */
  readonly title: ReactNode;
  /** "Your changes are still on this page. The live version is unchanged. Try again." */
  readonly children: ReactNode;
  /** "Try again": saves again. */
  readonly retryLabel: ReactNode;
  readonly onRetry: () => void;
  /** The retry while it runs: ignored, with its working words. */
  readonly busy?: boolean;
  readonly busyLabel?: ReactNode;
  /** Takes focus when the save fails (`tabindex=-1`). */
  readonly id: string;
}

/**
 * A draft save that failed (`div.rk-errsum[role=alert]`): the edits are still on the page, the live
 * version is unchanged, and Try again saves again. The export spaces the line (`margin-top: 4px;
 * font: 500 15px/22px`) and the button (`margin-top: 10px`) inline: `p.rk-x-errsum-line` and
 * `button.rb-btn.rk-x-errsum-retry` (V3P-14), as CM-09's `CmCodesFailed`.
 */
export function CmSaveFailed({
  title,
  children,
  retryLabel,
  onRetry,
  busy = false,
  busyLabel,
  id,
}: CmSaveFailedProps) {
  return (
    <div className="rk-errsum" id={id} tabIndex={-1} role="alert">
      <p className="rk-errsum-t">{title}</p>
      <p className="rk-x-errsum-line">{children}</p>
      <Button className="rk-x-errsum-retry" busy={busy} busyLabel={busyLabel} onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  );
}
