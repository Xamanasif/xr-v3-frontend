'use client';

import type { MouseEvent, ReactNode, Ref } from 'react';

import type { FormatCode } from '../icons/registry.js';
import { joinClasses } from '../internal/classes.js';
import { CourseCode } from './codes.js';
import { StandList, type StandItem } from './detail.js';
import { FORMAT_ORDER } from './formats.js';
import { Glyph, V3_ICON_PATHS, type V3IconName } from './icons.js';
import type { StatusTone } from './status.js';

/*
 * What more than one Academic Reviewer screen group draws (`rv-` classes; the owner-approved
 * Academic Reviewer export, design/v3-refined-b/roles/RV-v1, `project/rv.css` and its
 * COMPONENT-EXTENSIONS.md): the review type tag, a course with its name, the status pills, the
 * format badges, the identity card with its page map, the item page's layout and blocks, the quote,
 * the comparison, the read-only outcomes, the decision panel's parts (Before you decide, What
 * happens next, the refusal, the decided outcome) and the history. Markup as the export's live root
 * `RV.dc.html` draws them on RV-01, RV-02, RV-05 (the lists) and RV-03, RV-04, RV-06 (the item
 * page). What one screen group alone draws is in `rv-lists.tsx`, `rv-submission.tsx` and
 * `rv-update.tsx`. Every word, figure, date and destination comes from the caller; no record ID is
 * ever needed (HANDOFF "Internal technical identifiers").
 */

// ---- Moving to a section ------------------------------------------------------------------------

/**
 * A page-map or readiness link (the export's `goAnchor` / `focusId`): scroll the target into view
 * and move focus to it. `section` scrolls a section heading to the top; `field` brings a field
 * into view without jumping (the readiness list's "Add an outcome").
 */
function goTo(event: MouseEvent<HTMLAnchorElement>, targetId: string, mode: 'section' | 'field') {
  const target = event.currentTarget.ownerDocument.getElementById(targetId);
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ block: mode === 'section' ? 'start' : 'nearest' });
  if (
    !target.hasAttribute('tabindex') &&
    !/^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName)
  )
    target.tabIndex = -1;
  target.focus({ preventScroll: true });
}

// ---- Review type tag ----------------------------------------------------------------------------

/**
 * The four kinds of review work (`rv-kind--new`, `--resub`, `--recheck`, `--update`): a new
 * submission, a resubmission (its revision beside it), a re-check sent back by the Content Manager
 * and an update to a published experiment (`1.2 → 1.3` beside it).
 */
export type RvKind = 'new' | 'resub' | 'recheck' | 'update';

/** Each kind's glyph (the export's sprite `rvi-new`, `rvi-resub`, `rvi-recheck`, `rvi-update`). */
export const RV_KIND_ICON: Readonly<Record<RvKind, V3IconName>> = {
  new: 'kindNew',
  resub: 'kindResubmission',
  recheck: 'kindRecheck',
  update: 'kindUpdate',
};

export interface RvKindTagProps {
  readonly kind: RvKind;
  /** The type in words (`span.rv-kind-t`): "New submission", "Resubmitted", "Re-check", "Update". */
  readonly label: ReactNode;
  /** Beside it (`span.rv-kind-d`): "revision 2", "1.2 → 1.3", "to version 2.1"; none when null. */
  readonly detail?: ReactNode;
}

/**
 * The review type tag (`span.rv-kind.rv-kind--<kind>`): the kind's icon on its tinted tile, the
 * type and its detail. The export draws all four icons and lets `rv-kind--<kind>` show one; this
 * draws the one it shows (the same path, from the kit's icon set).
 */
export function RvKindTag({ kind, label, detail }: RvKindTagProps) {
  return (
    <span className={`rv-kind rv-kind--${kind}`}>
      <span className="rv-kind-ico" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d={V3_ICON_PATHS[RV_KIND_ICON[kind]]} />
        </svg>
      </span>
      <span className="rv-kind-t">{label}</span>
      {detail != null && detail !== '' ? <span className="rv-kind-d">{detail}</span> : null}
    </span>
  );
}

// ---- Course with its name -----------------------------------------------------------------------

export interface RvCourseProps {
  /** The platform course code chip (`span.rk-code`); none when the course has no code. */
  readonly code?: string | null;
  /** The course's name as the catalogue lists it; none when it is not known. */
  readonly name?: ReactNode;
  /**
   * Where it sits: `card` (`span.rv-meta-course`, the name as text: the identity card), `next`
   * (`span.rv-meta-course`, the name in a `span`: RV-01's next in line), `row` (the name in
   * `span.rv-wl-cname`: RV-01's rest of the queue) or `cell` (`span.rv-cell-course`, the name as
   * text: RV-02 and RV-05 table rows).
   */
  readonly placement: 'card' | 'next' | 'row' | 'cell';
}

/** A course code with its name, as every reviewer screen names a course. */
export function RvCourse({ code, name, placement }: RvCourseProps) {
  const hasName = name != null && name !== '';
  const named =
    placement === 'next' ? (
      hasName ? (
        <span>{name}</span>
      ) : null
    ) : placement === 'row' ? (
      hasName ? (
        <span className="rv-wl-cname">{name}</span>
      ) : null
    ) : (
      name
    );
  return (
    <span className={placement === 'cell' ? 'rv-cell-course' : 'rv-meta-course'}>
      {code ? <CourseCode code={code} /> : null}
      {named}
    </span>
  );
}

// ---- Status -------------------------------------------------------------------------------------

export interface RvStatusProps {
  readonly tone: StatusTone;
  readonly children: ReactNode;
  /**
   * `lg` (`rk-st-lg rv-st-wrap`: the identity card and the decided outcome), `sm` (`rv-st-sm`:
   * RV-01's Recently decided) or the default (`rv-st-wrap`: a table cell that may wrap at 320 px).
   */
  readonly size?: 'lg' | 'sm';
}

/** A status pill in the reviewer's wrapping variants (`span.xr-st`, the kit's tones). */
export function RvStatus({ tone, children, size }: RvStatusProps) {
  const toneClass = tone === 'ended' ? 'rk-st-ended' : tone === 'neutral' ? null : `xr-st--${tone}`;
  // The export's class order: `xr-st xr-st--ok rk-st-lg rv-st-wrap` (the card and the outcome),
  // `xr-st rv-st-sm xr-st--ok` (Recently decided), `xr-st rv-st-wrap xr-st--ok` (a table cell).
  return (
    <span
      className={joinClasses(
        'xr-st',
        size === 'lg'
          ? joinClasses(toneClass, 'rk-st-lg rv-st-wrap')
          : joinClasses(size === 'sm' ? 'rv-st-sm' : 'rv-st-wrap', toneClass),
      )}
    >
      <i />
      {children}
    </span>
  );
}

// ---- Format badges ------------------------------------------------------------------------------

export interface RvFormatBadgesProps {
  /** The formats, drawn in the foundation's order (WEB, AR, VR, MR). */
  readonly formats: readonly FormatCode[];
  /** What the badges say, as the image's name: "Formats: WEB, VR", "In this submission: WEB and VR". */
  readonly label: string;
}

/**
 * The format badges as one image (`span.rk-fmts[role=img][aria-label]`, each `span.xr-fmt` hidden
 * from assistive technology): RV-01's next in line, RV-02's rows and RV-03's formats line.
 */
export function RvFormatBadges({ formats, label }: RvFormatBadgesProps) {
  const ordered = [...new Set(formats)].sort(
    (left, right) => FORMAT_ORDER.indexOf(left) - FORMAT_ORDER.indexOf(right),
  );
  return (
    <span className="rk-fmts" role="img" aria-label={label}>
      {ordered.map((format) => (
        <span key={format} className="xr-fmt" aria-hidden="true">
          {format}
        </span>
      ))}
    </span>
  );
}

// ---- Identity card ------------------------------------------------------------------------------

export interface RvFact {
  readonly key?: string;
  /** "Waiting", "Revision", "Version", "Formats", "Live version", "Decided". */
  readonly term: ReactNode;
  readonly value: ReactNode;
}

export interface RvPageLink {
  /** The section heading's id (`rv-s-lo`): the link scrolls it to the top and focuses it. */
  readonly targetId: string;
  /** "Learning outcomes". */
  readonly label: ReactNode;
  /** A count beside it (`span.rv-onpage-n`): "3"; none when null. */
  readonly count?: ReactNode;
}

export interface RvIdCardProps {
  /** Today's date on phones (`p.rb-eyebrow-date`), from the application's clock. */
  readonly date?: ReactNode;
  /** The breadcrumb trail (`Breadcrumbs`), its current page the experiment's name. */
  readonly breadcrumbs: ReactNode;
  /** The review type (`RvKindTag`) above the title (`p.rv-id-eyebrow`). */
  readonly kind: ReactNode;
  /** The page's H1 (`h1.rk-title`, `tabindex=-1`): the experiment's name. */
  readonly title: ReactNode;
  readonly titleId: string;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** The summary under the title (`p.rv-id-lead`); none when null. */
  readonly lead?: ReactNode;
  /** The large status (`RvStatus size="lg"`), first in the meta line (`span.rv-meta-main`). */
  readonly status: ReactNode;
  /** The course (`RvCourse placement="card"`) beside the status. */
  readonly course: ReactNode;
  /** Who sent it (`span.rv-meta-who`): "From Meridian Virtual Labs". */
  readonly who: ReactNode;
  /**
   * "Go to decision" (`a.rb-btn.rk-goto`, shown while the panel sits below the content). With
   * `focusId` (the panel heading's id) it scrolls to the panel and focuses that heading.
   */
  readonly goTo: {
    readonly label: ReactNode;
    readonly targetId: string;
    readonly focusId?: string;
  };
  /** The facts (`dl.rv-id-facts`). */
  readonly facts: readonly RvFact[];
  /** The page map's name (`nav[aria-label]`) and its visible key: "On this page". */
  readonly pageMapLabel: string;
  readonly pageMap: readonly RvPageLink[];
}

/**
 * The item page's identity card (`header.rv-idcard`; RV-03, RV-04, RV-06), after the date and the
 * breadcrumb: the type tag, the title, the summary, the status with the course and the sender,
 * "Go to decision", the facts and the page map (*On this page*) whose links scroll each section's
 * heading to the top and focus it.
 */
export function RvIdCard({
  date,
  breadcrumbs,
  kind,
  title,
  titleId,
  titleRef,
  lead,
  status,
  course,
  who,
  goTo: goToPanel,
  facts,
  pageMapLabel,
  pageMap,
}: RvIdCardProps) {
  return (
    <>
      <div>
        {date ? <p className="rb-eyebrow-date">{date}</p> : null}
        {breadcrumbs}
      </div>
      <header className="rv-idcard">
        <div className="rv-id-top">
          <div className="rv-id-text">
            <p className="rv-id-eyebrow">{kind}</p>
            <h1 ref={titleRef} className="rk-title" id={titleId} tabIndex={-1}>
              {title}
            </h1>
            {lead != null && lead !== '' ? <p className="rv-id-lead">{lead}</p> : null}
            <div className="rk-meta">
              <span className="rv-meta-main">
                {status}
                {course}
              </span>
              <span className="rv-meta-who">{who}</span>
            </div>
          </div>
          <a
            className="rb-btn rk-goto"
            href={`#${goToPanel.targetId}`}
            onClick={
              goToPanel.focusId
                ? (event) => goTo(event, goToPanel.focusId ?? goToPanel.targetId, 'section')
                : undefined
            }
          >
            {goToPanel.label}
          </a>
        </div>
        <dl className="rv-id-facts">
          {facts.map((fact, index) => (
            <div key={fact.key ?? index} className="rv-id-fact">
              <dt>{fact.term}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
        <nav className="rv-onpage" aria-label={pageMapLabel}>
          <span className="rv-onpage-k" aria-hidden="true">
            {pageMapLabel}
          </span>
          {pageMap.map((link) => (
            <a
              key={link.targetId}
              href={`#${link.targetId}`}
              onClick={(event) => goTo(event, link.targetId, 'section')}
            >
              {link.label}
              {link.count != null && link.count !== '' ? (
                <span className="rv-onpage-n">{link.count}</span>
              ) : null}
            </a>
          ))}
        </nav>
      </header>
    </>
  );
}

// ---- Item page layout ---------------------------------------------------------------------------

export interface RvDetailProps {
  /** The blocks (`div.rk-mainsheet.rv-main`), in the export's order. */
  readonly main: ReactNode;
  /** The decision panel (`aside.rk-aside` > `DecisionPanel`). */
  readonly panel: ReactNode;
  /** The aside's id — "Go to decision"'s target (`rv-panel`). */
  readonly panelId: string;
  /** The aside's name: the decision panel heading's id. */
  readonly panelLabelledBy: string;
  /** The history (`RvHistory`): after the content on wide screens, after the panel on one column. */
  readonly history: ReactNode;
}

/**
 * The item page (`div.rk-detailwrap` > `div.rk-detail.rv-detail`): the blocks, the decision panel
 * and the history — the panel spans the content and the history, so on one column the decision
 * comes before the history.
 */
export function RvDetail({ main, panel, panelId, panelLabelledBy, history }: RvDetailProps) {
  return (
    <div className="rk-detailwrap">
      <div className="rk-detail rv-detail">
        <div className="rk-mainsheet rv-main">{main}</div>
        <aside className="rk-aside" id={panelId} aria-labelledby={panelLabelledBy}>
          {panel}
        </aside>
        {history}
      </div>
    </div>
  );
}

export interface RvBlockProps {
  /**
   * `reference` (`rk-surface rv-block`: what the vendor sent, what changes, the live experiment),
   * `attn` (`rv-block--attn`: the re-check request) or `work` (`rv-block--work`: the learning
   * outcomes).
   */
  readonly weight?: 'reference' | 'attn' | 'work';
  /** `is-invalid` (the outcomes block while "Add at least one learning outcome" is shown). */
  readonly invalid?: boolean;
  /** The block's name: its heading's id. */
  readonly labelledBy: string;
  /** The head (`RvBandHead`, `RvBlockHead`, or the outcome block's own), then the content. */
  readonly children: ReactNode;
}

/** A block of the item page in one of its three weights (`section.rk-surface.rv-block`). */
export function RvBlock({
  weight = 'reference',
  invalid = false,
  labelledBy,
  children,
}: RvBlockProps) {
  return (
    <section
      className={joinClasses(
        'rk-surface rv-block',
        weight === 'attn' && 'rv-block--attn',
        weight === 'work' && 'rv-block--work',
        invalid && 'is-invalid',
      )}
      aria-labelledby={labelledBy}
    >
      {children}
    </section>
  );
}

export interface RvBandHeadProps {
  /** The heading's id (`h2.rb-h2`, `tabindex=-1`: the page map and readiness links focus it). */
  readonly titleId: string;
  /** The icon on the heading's tile (`span.rv-band-ico`): `kindRecheck`, `kindResubmission`, `message`. */
  readonly icon: V3IconName;
  readonly title: ReactNode;
  /** The quiet note at the right (`p.rv-band-note`): "Only what the vendor changed". */
  readonly note?: ReactNode;
}

/** The head of a block that says why the item is here (`div.rv-band`). */
export function RvBandHead({ titleId, icon, title, note }: RvBandHeadProps) {
  return (
    <div className="rv-band">
      <h2 className="rb-h2" id={titleId} tabIndex={-1}>
        <span className="rv-band-ico" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d={V3_ICON_PATHS[icon]} />
          </svg>
        </span>
        {title}
      </h2>
      {note != null && note !== '' ? <p className="rv-band-note">{note}</p> : null}
    </div>
  );
}

export interface RvBlockHeadProps {
  /** The heading's id (`h2.rb-h2`, `tabindex=-1`). */
  readonly titleId: string;
  readonly title: ReactNode;
  /** The overline above the title (`p.rv-block-k`): "From Northline Simulation Studio". */
  readonly kicker?: ReactNode;
  /** The note at the right (`p.rb-note`): "Read-only", "Newest first". */
  readonly note?: ReactNode;
}

/** A reference or history block's head (`div.rv-block-h`). */
export function RvBlockHead({ titleId, title, kicker, note }: RvBlockHeadProps) {
  const heading = (
    <h2 className="rb-h2" id={titleId} tabIndex={-1}>
      {title}
    </h2>
  );
  return (
    <div className="rv-block-h">
      {kicker != null && kicker !== '' ? (
        <div>
          <p className="rv-block-k">{kicker}</p>
          {heading}
        </div>
      ) : (
        heading
      )}
      {note != null && note !== '' ? <p className="rb-note">{note}</p> : null}
    </div>
  );
}

/** The quiet line at a block's foot (`p.rv-footnote`). */
export function RvFootnote({ children }: { readonly children: ReactNode }) {
  return <p className="rv-footnote">{children}</p>;
}

export interface RvQuoteProps {
  /** The words as the export prints them (the caller adds quotation marks where it does). */
  readonly quote: ReactNode;
  /** Who and when (`p.rk-quote-by`): "Kavya Nair, Content Manager · sent 25 Aug 2026, 16:00". */
  readonly by: ReactNode;
}

/** A reason quoted in a block (`blockquote.rk-quote.rv-quote`): the re-check, the return, the correction. */
export function RvQuote({ quote, by }: RvQuoteProps) {
  return (
    <blockquote className="rk-quote rv-quote">
      <p>{quote}</p>
      <p className="rk-quote-by">{by}</p>
    </blockquote>
  );
}

// ---- Comparison ---------------------------------------------------------------------------------

/** A run of a compared value: `marked` runs are struck (`del`, before) or highlighted (`ins`, after). */
export interface RvComparisonPart {
  readonly text: string;
  readonly marked?: boolean;
}

export interface RvComparisonRow {
  readonly key: string;
  /** The field (`span.rv-cmp-f[role=rowheader]`): "Description", "Formats & delivery · VR · Device need". */
  readonly field: ReactNode;
  readonly before: readonly RvComparisonPart[];
  readonly after: readonly RvComparisonPart[];
}

export interface RvComparisonProps {
  /** The table's name (`div.rv-cmp[role=table][aria-label]`). */
  readonly label: string;
  /** The first column's header, read by screen readers only: "Field". */
  readonly fieldHeader: ReactNode;
  /** The before column's header and in-cell label: "Was", "Live now · 1.2". */
  readonly beforeHeader: ReactNode;
  /** The after column's header and in-cell label: "Now", "Proposed · 1.3". */
  readonly afterHeader: ReactNode;
  readonly rows: readonly RvComparisonRow[];
}

/**
 * Field-by-field comparison (`div.rv-cmpwrap` > `div.rv-cmp[role=table]`): RV-03's "What changed in
 * revision N" (was / now, the old value struck) and RV-04's "What changes" (live / proposed, removed
 * runs struck and added runs highlighted). Stacks with its labels below 520 px.
 */
export function RvComparison({
  label,
  fieldHeader,
  beforeHeader,
  afterHeader,
  rows,
}: RvComparisonProps) {
  return (
    <div className="rv-cmpwrap">
      <div className="rv-cmp" role="table" aria-label={label}>
        <div className="rv-cmp-row rv-cmp-row--head" role="row">
          <span className="xr-sr" role="columnheader">
            {fieldHeader}
          </span>
          <span role="columnheader">{beforeHeader}</span>
          <span role="columnheader">{afterHeader}</span>
        </div>
        {rows.map((row) => (
          <div key={row.key} className="rv-cmp-row" role="row">
            <span className="rv-cmp-f" role="rowheader">
              {row.field}
            </span>
            <span className="rv-cmp-v rv-cmp-v--was" role="cell">
              <span className="rv-cmp-k">{beforeHeader}</span>
              {row.before.map((part, index) =>
                part.marked ? <del key={index}>{part.text}</del> : part.text,
              )}
            </span>
            <span className="rv-cmp-v" role="cell">
              <span className="rv-cmp-k">{afterHeader}</span>
              {row.after.map((part, index) =>
                part.marked ? <ins key={index}>{part.text}</ins> : part.text,
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Read-only outcomes -------------------------------------------------------------------------

export interface RvOutcomesReadOnlyProps {
  readonly outcomes: readonly ReactNode[];
  /** The list's name ("Learning outcomes" on RV-03/RV-06); the live experiment's list has none. */
  readonly label?: string;
}

/** Learning outcomes, numbered and read-only (`ol.rv-lo-ro`): RV-06 and RV-04's live experiment. */
export function RvOutcomesReadOnly({ outcomes, label }: RvOutcomesReadOnlyProps) {
  return (
    <ol className="rv-lo-ro" aria-label={label}>
      {outcomes.map((outcome, index) => (
        <li key={index}>{outcome}</li>
      ))}
    </ol>
  );
}

// ---- Decision panel parts -----------------------------------------------------------------------

/** A readiness item's icon (`span.rv-ready-ico.is-<icon>`). */
export type RvReadyIcon = 'check' | 'alert' | 'layers' | 'recheck' | 'resub' | 'live' | 'update';

const READY_ICON: Readonly<Record<RvReadyIcon, V3IconName>> = {
  check: 'check',
  alert: 'alertCircle',
  layers: 'layersStack',
  recheck: 'kindRecheck',
  resub: 'kindResubmission',
  live: 'live',
  update: 'kindUpdate',
};

export interface RvReadyItem {
  /** The item's id (`li[id]`): `rv-whole` is the decision choices' description. */
  readonly id: string;
  /** `ok` (a met rule), `need` (a rule not met yet) or `info`. */
  readonly tone: 'ok' | 'need' | 'info';
  readonly icon: RvReadyIcon;
  /** The bold part (`b`): "3 learning outcomes.", "Whole Experiment.". */
  readonly title: ReactNode;
  /** After it: "Approve needs at least one.". */
  readonly detail?: ReactNode;
  /**
   * A link after the words: "Read why" (`section`: the block's heading scrolls to the top and takes
   * focus), "Add an outcome" (`field`: the outcome field takes focus).
   */
  readonly link?: {
    readonly label: ReactNode;
    readonly targetId: string;
    readonly mode?: 'section' | 'field';
  };
}

export interface RvReadyListProps {
  /** "Before you decide" (`p.rv-ready-h`). */
  readonly title: ReactNode;
  readonly items: readonly RvReadyItem[];
}

/** The decision panel's opening (`div.rv-ready`): what is ready and the rules that apply. */
export function RvReadyList({ title, items }: RvReadyListProps) {
  return (
    <div className="rv-ready">
      <p className="rv-ready-h">{title}</p>
      <ul className="rv-ready-list">
        {items.map((item) => (
          <li key={item.id} className={`is-${item.tone}`} id={item.id}>
            <span className={`rv-ready-ico is-${item.icon}`} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d={V3_ICON_PATHS[READY_ICON[item.icon]]} />
              </svg>
            </span>
            <span>
              <b>{item.title}</b> {item.detail}
              {item.link ? (
                <>
                  {' '}
                  <a
                    href={`#${item.link.targetId}`}
                    onClick={(event) =>
                      goTo(event, item.link!.targetId, item.link!.mode ?? 'section')
                    }
                  >
                    {item.link.label}
                  </a>
                </>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface RvPathStep {
  readonly key: string;
  /** The step's number (`span.rv-path-n`, hidden from assistive technology: the list numbers it). */
  readonly number: ReactNode;
  /** "You · academic decision". */
  readonly title: ReactNode;
  /** "Approving does not publish.". */
  readonly detail: ReactNode;
  /** The reviewer's own step (`li.is-now`). */
  readonly now?: boolean;
}

export interface RvPathProps {
  /** "What happens next" (`p.rv-path-h`). */
  readonly title: ReactNode;
  readonly steps: readonly RvPathStep[];
}

/** The decision panel's close (`div.rv-path`): the chain after the reviewer's decision. */
export function RvPath({ title, steps }: RvPathProps) {
  return (
    <div className="rv-path">
      <p className="rv-path-h">{title}</p>
      <ol className="rv-path-list">
        {steps.map((step) => (
          <li key={step.key} className={step.now ? 'is-now' : undefined}>
            <span className="rv-path-n" aria-hidden="true">
              {step.number}
            </span>
            <span>
              <span className="rv-path-t">{step.title}</span>
              <span className="rv-path-d">{step.detail}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export interface RvRefusalProps {
  /** "Nothing was recorded", "Nothing new was recorded". */
  readonly title: ReactNode;
  readonly detail: ReactNode;
  /** The notice takes focus when the refusal arrives (`tabindex=-1`). */
  readonly refusalRef?: Ref<HTMLDivElement>;
  readonly id?: string;
}

/**
 * A decision the service refused (`div.rk-notice.rk-notice--warn.rv-refusal[role=alert]`): stale
 * (withdrawn after the page was opened) or already decided in another window; focusable.
 */
export function RvRefusal({ title, detail, refusalRef, id }: RvRefusalProps) {
  return (
    <div
      ref={refusalRef}
      className="rk-notice rk-notice--warn rv-refusal"
      id={id}
      tabIndex={-1}
      role="alert"
    >
      <Glyph name="alertCircle" />
      <p className="rk-notice-t">{title}</p>
      <p className="rk-notice-d">{detail}</p>
    </div>
  );
}

export interface RvDecisionOutcomeProps {
  /** The record's status after the decision (`RvStatus size="lg"`). */
  readonly status: ReactNode;
  /** "Decided by you on 27 Aug 2026, 15:20". */
  readonly meta?: ReactNode;
  /**
   * The reason of a return (`div.rv-done-q`): its label ("Your reason"), the reason (quoted here)
   * and the field references (`ul.rv-reflist`).
   */
  readonly reason?: {
    readonly label: ReactNode;
    readonly text: ReactNode;
    readonly references?: readonly ReactNode[];
  };
  /** Where the record stands (`dl.rk-stand`): Academic review, Learning outcomes, Publication, Access. */
  readonly stand: readonly StandItem[];
  /** What happens next (`p.rk-next`). */
  readonly next?: ReactNode;
  /** "Back to the review queue" (`ButtonLink`). */
  readonly action?: ReactNode;
  readonly outcomeRef?: Ref<HTMLDivElement>;
  readonly id?: string;
}

/**
 * The decided panel (`div.rk-done`, RV-03/RV-04 after deciding and RV-06): the status, when, the
 * reason and its references, where the record stands, what happens next and the way back. The
 * kit's `DecisionOutcome` puts what follows after the stand list; here the reason comes before it.
 */
export function RvDecisionOutcome({
  status,
  meta,
  reason,
  stand,
  next,
  action,
  outcomeRef,
  id,
}: RvDecisionOutcomeProps) {
  return (
    <div className="rk-done" ref={outcomeRef} id={id} tabIndex={-1}>
      <p>{status}</p>
      {meta != null && meta !== '' ? <p className="rk-done-meta">{meta}</p> : null}
      {reason ? (
        <div className="rv-done-q">
          <b>{reason.label}</b>“{reason.text}”
          {reason.references && reason.references.length > 0 ? (
            <ul className="rv-reflist">
              {reason.references.map((reference, index) => (
                <li key={index}>{reference}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <StandList items={stand} />
      {next != null && next !== '' ? <p className="rk-next">{next}</p> : null}
      {action}
    </div>
  );
}

// ---- History ------------------------------------------------------------------------------------

export interface RvHistoryProps {
  /** The heading's id (`h2.rb-h2`, `tabindex=-1`: the page map's last link). */
  readonly titleId: string;
  /** "Review history", "Update history". */
  readonly title: ReactNode;
  /** "Newest first". */
  readonly note: ReactNode;
  /**
   * `quiet` (`rv-block rv-block--quiet rv-hist`: reference under the work, while the item waits) or
   * `card` (`rk-surface rv-block rv-hist rv-hist--card`: the record, once decided).
   */
  readonly variant: 'quiet' | 'card';
  /** The events, newest first (the kit's `Timeline`, `ol.rk-tl`). */
  readonly children: ReactNode;
}

/** The item's history (`section.rv-hist`). */
export function RvHistory({ titleId, title, note, variant, children }: RvHistoryProps) {
  return (
    <section
      className={
        variant === 'card'
          ? 'rk-surface rv-block rv-hist rv-hist--card'
          : 'rv-block rv-block--quiet rv-hist'
      }
      aria-labelledby={titleId}
    >
      <RvBlockHead titleId={titleId} title={title} note={note} />
      {children}
    </section>
  );
}
