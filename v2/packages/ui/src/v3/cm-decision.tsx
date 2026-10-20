'use client';

import { Fragment, type ReactNode } from 'react';

import type { FormatCode } from '../icons/registry.js';
import { joinClasses } from '../internal/classes.js';
import { ButtonLink, type ButtonLinkProps } from './actions.js';
import { CmFormatBadges, CmInLabel } from './cm.js';
import { CourseCode } from './codes.js';
import { Glyph } from './icons.js';
import { StatusPill } from './status.js';

/*
 * What only the Content Manager's decision group draws — CM-03 Publication decision and CM-05
 * Published experiment (the owner-approved Content Manager export, design/v3-refined-b/roles/CM-v1,
 * `project/Main.dc.html` `v.decision`, `v.published`; `cm.css` and COMPONENT-EXTENSIONS.md K, N, 1,
 * 2, 3 and 7): a main-sheet section with its note or the gate's verdict, the publication check as a
 * gate, the catalogue entry with its formats and device needs, the blockers in the decision panel,
 * the live facts and the delivery cards of a published record, and the primary link of its
 * Corrections panel. The shared pieces (identity band, stage track, version change, in-cell label,
 * full-width actions) are in `cm.tsx`. Every word, figure, date and destination comes from the
 * caller.
 */

// ---- A main-sheet section ------------------------------------------------------------------------

export interface CmSheetSectionProps {
  readonly title: ReactNode;
  readonly titleId: string;
  /** The quiet line beside the title (`p.rb-note`): "Newest first". */
  readonly note?: ReactNode;
  /**
   * The publication gate's verdict beside the title instead (`p.cm-gateline`): `ok` green ("All 4
   * met · ready to publish"), `no` red ("1 check not met · publishing is blocked") or `plain`
   * grey ("Read from the record").
   */
  readonly verdict?: { readonly words: ReactNode; readonly tone: 'ok' | 'no' | 'plain' };
  readonly children: ReactNode;
}

/** A section of the record's sheet (`section.rk-sec` > `div.rk-sec-h` > `h2.rb-h2` + note). */
export function CmSheetSection({ title, titleId, note, verdict, children }: CmSheetSectionProps) {
  return (
    <section className="rk-sec" aria-labelledby={titleId}>
      <div className="rk-sec-h">
        <h2 className="rb-h2" id={titleId}>
          {title}
        </h2>
        {verdict ? (
          <p
            className={joinClasses(
              'cm-gateline',
              verdict.tone === 'ok' && 'is-ok',
              verdict.tone === 'no' && 'is-no',
            )}
          >
            {verdict.words}
          </p>
        ) : note ? (
          <p className="rb-note">{note}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/**
 * A heading inside a section (`h3.rk-h3`): "Delivery by format". The export spaces it with an
 * inline `margin: 24px 0 10px` (`rk-x-h3-sub`, V3P-14).
 */
export function CmSubHeading({ children }: { readonly children: ReactNode }) {
  return <h3 className="rk-h3 rk-x-h3-sub">{children}</h3>;
}

// ---- K / 3. The publication check as a gate ------------------------------------------------------

export interface CmCheckItem {
  readonly key: string;
  /** "Approved by the Academic Reviewer" (`p.cm-check-t`). */
  readonly title: ReactNode;
  /** "Prof. A. Menon · 27 Aug 2026" (`p.cm-check-d`). */
  readonly detail: ReactNode;
  readonly met: boolean;
  /** What to do about a failing check (`p.cm-check-fix`): only while the decision is open. */
  readonly fix?: ReactNode;
}

export interface CmPublicationChecksProps {
  /** The list's name, for assistive technology: "Publication check". */
  readonly label: string;
  readonly items: readonly CmCheckItem[];
  /** The state in words before each title (`span.xr-sr`): "Met: " and "Not met: ". */
  readonly stateWords: { readonly met: string; readonly notMet: string };
}

/**
 * The four checks of a publication (`ul.cm-checks.cm-gate` > `li.cm-check`): a tick or a cross in
 * its disc, the check, what the record says and, while it fails, what to do. Two by two at the top
 * of the sheet; one column below 560 px. Icon and words both carry the state.
 */
export function CmPublicationChecks({ label, items, stateWords }: CmPublicationChecksProps) {
  return (
    <ul className="cm-checks cm-gate" aria-label={label}>
      {items.map((item) => (
        <li
          key={item.key}
          className={joinClasses('cm-check', item.met ? 'cm-check--ok' : 'cm-check--no')}
        >
          <span className="cm-check-ico" aria-hidden="true">
            <Glyph name={item.met ? 'check' : 'cross'} />
          </span>
          <p className="cm-check-t">
            <span className="xr-sr">{item.met ? stateWords.met : stateWords.notMet}</span>
            {item.title}
          </p>
          <p className="cm-check-d">{item.detail}</p>
          {item.fix ? <p className="cm-check-fix">{item.fix}</p> : null}
        </li>
      ))}
    </ul>
  );
}

// ---- 1. The catalogue entry ----------------------------------------------------------------------

export interface CmCatalogueEntryProps {
  /** The entry's name id (`h3.cm-cat-name`), which names the article. */
  readonly nameId: string;
  /**
   * The tag at the top (`span.xr-st`): "Preview — not public yet" (`neutral`) before publication,
   * "In the public catalogue" (`ok`) after.
   */
  readonly tag: { readonly words: ReactNode; readonly tone: 'neutral' | 'ok' };
  /** The course: its platform code chip (none without a code) and its name (`span.cm-cat-course`). */
  readonly course: { readonly code?: string | null; readonly name: ReactNode };
  readonly name: ReactNode;
  readonly summary: ReactNode;
  /** "Available in" before the format badges (`p.cm-cat-avail`). */
  readonly availableIn: ReactNode;
  readonly formats: readonly FormatCode[];
  /** What the badges mean, read instead of the codes: "Formats: WEB, VR". */
  readonly formatsLabel: string;
  /** After the badges (`span`): "· version 1.2" on the published record. */
  readonly version?: ReactNode;
  /** "Learning outcomes" (`h4.cm-cat-h`). */
  readonly outcomesTitle: ReactNode;
  /** Who sets them, after the heading (`span.cm-cat-hs`): "set by the Academic Reviewer". */
  readonly outcomesBy?: ReactNode;
  /** The numbered outcomes (`ol.cm-ol`); with none, `noOutcomes` instead. */
  readonly outcomes: readonly ReactNode[];
  /** With no outcomes (`p.rk-hint`): "None yet. The Academic Reviewer sets them during review, …". */
  readonly noOutcomes?: ReactNode;
  /** "Formats and device needs" (`h4.cm-cat-h`). */
  readonly formatsTitle: ReactNode;
  /** The formats and device needs: `CmFormatRows`. */
  readonly children: ReactNode;
}

/**
 * The entry as the public catalogue shows it (`article.cm-cat`): course code chip and name, title,
 * summary, "Available in" formats (`CmFormatBadges`: the export sets their `margin-top: 0`
 * inline), learning outcomes, formats and device needs (CM-03 preview, CM-05 live entry). Own
 * container `cmcat`: tighter below 620 px.
 */
export function CmCatalogueEntry({
  nameId,
  tag,
  course,
  name,
  summary,
  availableIn,
  formats,
  formatsLabel,
  version,
  outcomesTitle,
  outcomesBy,
  outcomes,
  noOutcomes,
  formatsTitle,
  children,
}: CmCatalogueEntryProps) {
  return (
    <article className="cm-cat" aria-labelledby={nameId}>
      <div className="cm-cat-top">
        <StatusPill tone={tag.tone}>{tag.words}</StatusPill>
        <span className="cm-cat-course">
          {course.code ? <CourseCode code={course.code} /> : null}
          {course.name}
        </span>
      </div>
      <div className="cm-cat-body">
        <div>
          <h3 className="cm-cat-name" id={nameId}>
            {name}
          </h3>
          <p className="cm-cat-sum">{summary}</p>
          <p className="cm-cat-avail">
            {availableIn} <CmFormatBadges formats={formats} label={formatsLabel} />
            {version ? <span>{version}</span> : null}
          </p>
        </div>
        <div>
          <h4 className="cm-cat-h">
            {outcomesTitle}
            {outcomesBy ? (
              <>
                {' '}
                <span className="cm-cat-hs">{outcomesBy}</span>
              </>
            ) : null}
          </h4>
          {outcomes.length > 0 ? (
            <ol className="cm-ol">
              {outcomes.map((outcome, index) => (
                <li key={index}>{outcome}</li>
              ))}
            </ol>
          ) : noOutcomes ? (
            <p className="rk-hint">{noOutcomes}</p>
          ) : null}
        </div>
        <div>
          <h4 className="cm-cat-h">{formatsTitle}</h4>
          {children}
        </div>
      </div>
    </article>
  );
}

// ---- 2. Formats and device needs (and the delivery by format) ------------------------------------

export interface CmFormatCell {
  /** The value's label: visible where the rows stack, else read only by assistive technology. */
  readonly label: ReactNode;
  /** The value, one line each (`br` between): "Web link", "https://labs…". */
  readonly lines: readonly ReactNode[];
}

export interface CmFormatRow {
  readonly key: string;
  readonly code: FormatCode;
  /** The format's name (`span.cm-sub-strong`): "Browser", "Virtual reality". */
  readonly name: ReactNode;
  /** The two values after the format: how it runs and device needs, or delivery and status. */
  readonly cells: readonly [CmFormatCell, CmFormatCell];
}

export interface CmFormatRowsProps {
  /** The header row's three words (`li.cm-dev--head`, decorative): "Format", "How it runs", …. */
  readonly head: readonly [ReactNode, ReactNode, ReactNode];
  readonly rows: readonly CmFormatRow[];
}

/**
 * One row per format (`div.cm-devswrap` > `ul.cm-devs` > `li.cm-dev`): the format badge and name,
 * then two values. Three columns with a header row; below 540 px the rows stack and each value
 * shows its label (`cm-inlabel`). The catalogue entry's "Formats and device needs" and CM-03's
 * "Delivery by format".
 */
export function CmFormatRows({ head, rows }: CmFormatRowsProps) {
  return (
    <div className="cm-devswrap">
      <ul className="cm-devs">
        <li className="cm-dev cm-dev--head" aria-hidden="true">
          <span>{head[0]}</span>
          <span>{head[1]}</span>
          <span>{head[2]}</span>
        </li>
        {rows.map((row) => (
          <li key={row.key} className="cm-dev">
            <p className="cm-fmtname">
              <span className="xr-fmt" aria-hidden="true">
                {row.code}
              </span>
              <span className="cm-sub-strong">{row.name}</span>
            </p>
            {row.cells.map((cell, index) => (
              <p key={index} className="cm-dev-d">
                <CmInLabel>{cell.label}</CmInLabel>
                {cell.lines.map((line, lineIndex) => (
                  <Fragment key={lineIndex}>
                    {lineIndex > 0 ? <br /> : null}
                    {line}
                  </Fragment>
                ))}
              </p>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---- The decision panel: what must be resolved first --------------------------------------------

export interface CmBlockersProps {
  /** "1 thing to resolve before it can be published". */
  readonly title: ReactNode;
  /** One line per failing check: "Learning outcomes: none. Send it back to …". */
  readonly items: readonly ReactNode[];
}

/**
 * The failing checks at the top of the decision panel (`div.rk-pending[role=status]` with the alert
 * icon): Publish is not offered until they are resolved. The export spaces the list inline —
 * `ul` `margin-top: 4px; padding-left: 18px; list-style: disc` (`rk-x-pending-list`), each `li`
 * `font-weight: 500` (`rk-x-pending-item`), V3P-14.
 */
export function CmBlockers({ title, items }: CmBlockersProps) {
  return (
    <div className="rk-pending" role="status">
      <Glyph name="alertCircle" />
      <div>
        <p>{title}</p>
        <ul className="rk-x-pending-list">
          {items.map((item, index) => (
            <li key={index} className="rk-x-pending-item">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---- N. The published record ---------------------------------------------------------------------

/**
 * The live description and version under the catalogue entry (`dl.rk-dl.cm-p-dl`): "Description",
 * "Live version".
 */
export function CmLiveFacts({
  items,
}: {
  readonly items: readonly { readonly term: ReactNode; readonly value: ReactNode }[];
}) {
  return (
    <dl className="rk-dl cm-p-dl">
      {items.map((item, index) => (
        <Fragment key={index}>
          <dt>{item.term}</dt>
          <dd>{item.value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

export interface CmDeliveryCard {
  readonly key: string;
  readonly code: FormatCode;
  /** "Web link", "App package (provisional)" (`span.cm-delcard-t`). */
  readonly title: ReactNode;
  /** The live values (`dl.cm-deldl`): "Web link", "Browser and computer"; "Package", …. */
  readonly rows: readonly { readonly term: ReactNode; readonly value: ReactNode }[];
}

/**
 * The live delivery, one card per format (`ul.cm-delgrid` > `li.cm-delcard`): the format badge and
 * kind, then its values in two columns (one column below 560 px of main sheet).
 */
export function CmDeliveryCards({ cards }: { readonly cards: readonly CmDeliveryCard[] }) {
  return (
    <ul className="cm-delgrid">
      {cards.map((delivery) => (
        <li key={delivery.key} className="cm-delcard">
          <p className="cm-delcard-h">
            <span className="xr-fmt" aria-hidden="true">
              {delivery.code}
            </span>
            <span className="cm-delcard-t">{delivery.title}</span>
          </p>
          <dl className="cm-deldl">
            {delivery.rows.map((row, index) => (
              <div key={index}>
                <dt>{row.term}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ul>
  );
}

/**
 * The one primary destination of a decision panel, drawn as its gold button
 * (`a.rb-btn.rb-btn--primary.rk-go`): CM-05's "Continue the update" and "Open update", which only
 * open the update's page (the export's button with a destination).
 */
export function CmGoLink(props: Omit<ButtonLinkProps, 'className' | 'variant' | 'block' | 'size'>) {
  return <ButtonLink {...props} variant="primary" className="rk-go" />;
}
