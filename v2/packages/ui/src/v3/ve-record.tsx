'use client';

import type { ReactNode, Ref } from 'react';

import { Timeline, type StandItem, type TimelineEvent } from './detail.js';
import { Glyph } from './icons.js';
import { VendorSection } from './ve.js';

/*
 * What only VE-07 Experiment record and VE-13 Submission and version history draw (`vr-` classes;
 * the owner-approved Vendor export, design/v3-refined-b/roles/VE-v1, `project/v3-vendor.css` and
 * its COMPONENT-EXTENSIONS.md `vr-sheet`, `vr-intro`, `vr-ws`, `vr-hist`): the record's frame,
 * "Where it stands", the Details sheet and the history sheet. Markup as the export's
 * `Main.dc.html` draws its record view (`V.record`). The returned-reason panel, the read-only
 * delivery blocks, the format chips, the sections and the learning outcomes the record shares with
 * the editor are in `ve.tsx`. Every word, figure, date and action comes from the caller.
 */

export interface VendorRecordLayoutProps {
  /** The tab's sheet: `VendorRecordSheet` (Details) or `VendorRecordHistory`. */
  readonly main: ReactNode;
  /** "Where it stands" (`VendorRecordStand`), beside both tabs. */
  readonly aside: ReactNode;
  /** The aside's name: the "Where it stands" heading's id. */
  readonly asideLabelledBy: string;
}

/**
 * The record's frame (`div.rk-detailwrap` > `div.rk-detail`): the tab's sheet in
 * `div.rk-mainsheet`, "Where it stands" in `aside.rk-aside` — beside it on wide pages, after it
 * under 860 px of page width.
 */
export function VendorRecordLayout({ main, aside, asideLabelledBy }: VendorRecordLayoutProps) {
  return (
    <div className="rk-detailwrap">
      <div className="rk-detail">
        <div className="rk-mainsheet">{main}</div>
        <aside className="rk-aside" aria-labelledby={asideLabelledBy}>
          {aside}
        </aside>
      </div>
    </div>
  );
}

export interface VendorRecordStandProps {
  /** "Where it stands". */
  readonly title: ReactNode;
  readonly titleId: string;
  /** The first fact: "Formats" with its chips (`VendorFormatChips`). */
  readonly formats: StandItem;
  /** The revision and dates, in the export's order; the status is never repeated here. */
  readonly items: readonly StandItem[];
}

/** "Where it stands" (`div.rk-surface.vr-ws` > `h2.vr-ws-t` + `dl.rk-stand`). */
export function VendorRecordStand({ title, titleId, formats, items }: VendorRecordStandProps) {
  return (
    <div className="rk-surface vr-ws">
      <h2 className="vr-ws-t" id={titleId}>
        {title}
      </h2>
      <dl className="rk-stand">
        {[formats, ...items].map((item, index) => (
          <div key={index}>
            <dt>{item.term}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export interface VendorRecordSheetProps {
  /** Which version is shown (`p.vr-intro`, with the information mark). */
  readonly intro: ReactNode;
  /** The sections (`VendorSection`, `VendorLearningOutcomes`). */
  readonly children: ReactNode;
}

/** The Details sheet (`div.rk-surface.vr-sheet`): the version line, then its sections. */
export function VendorRecordSheet({ intro, children }: VendorRecordSheetProps) {
  return (
    <div className="rk-surface vr-sheet">
      <p className="vr-intro">
        <Glyph name="infoNote" />
        <span>{intro}</span>
      </p>
      {children}
    </div>
  );
}

export interface VendorRecordHistoryProps {
  /** "Submission and version history". */
  readonly title: ReactNode;
  readonly titleId: string;
  /** The heading takes focus when the tab opens (`tabindex=-1`). */
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** "Newest first · not an audit log". */
  readonly note: ReactNode;
  /**
   * Changes saved and not resubmitted are not part of the history (`p.vr-intro.vr-intro--inline`,
   * with the lock).
   */
  readonly privateNote?: ReactNode;
  /** Newest first; the first is the latest (`li.is-latest`). */
  readonly events: readonly TimelineEvent[];
}

/**
 * The history tab (`section.rk-surface.vr-sheet.vr-hist`): its heading and note, the private
 * changes note, and the timeline (`ol.rk-tl`) laid out as rows with the date at the right.
 */
export function VendorRecordHistory({
  title,
  titleId,
  titleRef,
  note,
  privateNote,
  events,
}: VendorRecordHistoryProps) {
  return (
    <section className="rk-surface vr-sheet vr-hist" aria-labelledby={titleId}>
      <VendorSection
        as="div"
        title={title}
        titleId={titleId}
        titleFocusTarget
        titleRef={titleRef}
        status={note}
      >
        {privateNote ? (
          <p className="vr-intro vr-intro--inline">
            <Glyph name="lock" />
            <span>{privateNote}</span>
          </p>
        ) : null}
        <Timeline events={events} />
      </VendorSection>
    </section>
  );
}
