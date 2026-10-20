'use client';

import { useLayoutEffect, useRef, type MouseEvent, type ReactNode, type Ref } from 'react';

import { joinClasses } from '../internal/classes.js';
import { useLinkComponent } from '../link.js';
import { Button, ButtonLink } from './actions.js';
import { CmInLabel, CmTag, CmYouBadge } from './cm.js';
import { CourseCode } from './codes.js';
import { FieldError, Hint } from './fields.js';
import { Glyph, type V3IconName } from './icons.js';
import type { RecordTableHeaders } from './list.js';
import { CalmState, type Figure } from './overview.js';
import { StatusPill, type StatusTone } from './status.js';

/*
 * What only the Content Manager's lists draw — CM-01 Overview, CM-02 Ready to publish, CM-04
 * Content library and CM-09 Platform course codes (`cm-` classes; the owner-approved Content
 * Manager export, design/v3-refined-b/roles/CM-v1, `project/cm.css` and its COMPONENT-EXTENSIONS.md
 * B, C, G, H, I, L, M and 6): the page head with its lead and figures, the publishing pipeline, the
 * decision desk, the side columns and their cards, the decision cards, the library's view switch,
 * stage line and course-grouped table, and the course-code table by engineering area. Markup as
 * the export's `Main.dc.html` draws them. What more than one Content Manager screen group draws
 * (the course name, the Changed tag, the quote, the version change, the group head) is in
 * `cm.tsx`. Every word, figure, date and destination comes from the caller.
 *
 * Two classes the export writes have no rule in `cm.css` and are left out here (they draw
 * nothing): `cm-lane` on each pipeline lane and `cm-utag` on a published row's correction chip.
 */

// ---- page head ---------------------------------------------------------------------------------

export interface CmPageHeadProps {
  /** The page's H1 (`h1.rb-h1`, `tabindex=-1`: it takes focus with the route and after Try again). */
  readonly title: ReactNode;
  readonly titleId?: string;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** Today's date on phones (`p.rb-eyebrow-date`), from the application's clock. */
  readonly date?: ReactNode;
  /** The line under the title (`p.rk-sub`). */
  readonly lead?: ReactNode;
  /** The figures beside the title (`dl.rb-figs`); none while the list loads or has failed. */
  readonly figures?: readonly Figure[];
  readonly figuresLabel?: string;
  /** `header` (CM-01) or `div` (CM-02, CM-04, CM-09), as the export draws each. */
  readonly as?: 'header' | 'div';
}

/** A list page's head (`.rb-head`): date, title, lead, and the figures on its right. */
export function CmPageHead({
  title,
  titleId,
  titleRef,
  date,
  lead,
  figures = [],
  figuresLabel,
  as: Head = 'div',
}: CmPageHeadProps) {
  return (
    <Head className="rb-head">
      <div>
        {date ? <p className="rb-eyebrow-date">{date}</p> : null}
        <h1 className="rb-h1" id={titleId} ref={titleRef} tabIndex={-1}>
          {title}
        </h1>
        {lead ? <p className="rk-sub">{lead}</p> : null}
      </div>
      {figures.length > 0 ? (
        <dl className="rb-figs" aria-label={figuresLabel}>
          {figures.map((figure, index) => (
            <div key={index} className="rb-fig">
              <dt className="rb-fig-t">{figure.title}</dt>
              <dd className="rb-fig-n">{figure.value}</dd>
              {figure.details?.length === 1 ? (
                <dd className="rb-fig-s">{figure.details[0]}</dd>
              ) : figure.details?.length ? (
                <dd className="rb-fig-s">
                  {figure.details.map((detail, detailIndex) => (
                    <span key={detailIndex}>
                      {detailIndex > 0 ? ' ' : null}
                      {detail}
                    </span>
                  ))}
                </dd>
              ) : null}
            </div>
          ))}
        </dl>
      ) : null}
    </Head>
  );
}

// ---- B. Publishing pipeline (CM-01) ------------------------------------------------------------

export interface CmPipelineTile {
  readonly key: string;
  /** How many items are at this stage, counted from the records. */
  readonly count: number;
  /** What the stage is (`span.cm-tile-t`): "Ready to publish". */
  readonly title: ReactNode;
  /** Who holds it, or the oldest wait (`span.cm-tile-d`): "Oldest approved 14 Aug". */
  readonly detail: ReactNode;
  /** The Content Manager's own stage, in gold with "Your step" (`is-you`). */
  readonly you?: boolean;
  /** The list that holds the stage's items. */
  readonly href: string;
  /** "3 Ready to publish. Oldest approved 14 Aug. Your step. Open Ready to publish". */
  readonly accessibleName: string;
}

export interface CmPipelineLane {
  readonly key: string;
  /** "First publication", "Corrections to live experiments" (`h3.cm-lane-t`). */
  readonly title: ReactNode;
  readonly icon: V3IconName;
  readonly tiles: readonly CmPipelineTile[];
}

export interface CmPipelineProps {
  /** "Publishing pipeline". */
  readonly title: ReactNode;
  readonly titleId: string;
  /** "Where every submission and correction is today. Gold marks your step." */
  readonly note?: ReactNode;
  readonly lanes: readonly CmPipelineLane[];
  /** "Your step" under the Content Manager's stages. */
  readonly youLabel: ReactNode;
}

/**
 * Both lifecycles counted from the records (`section.cm-pipe`, container `cmpipe`): a lane per
 * lifecycle, its stages as tiles in order; each tile a link to the list that holds its items, an
 * empty stage quiet (`is-quiet`).
 */
export function CmPipeline({ title, titleId, note, lanes, youLabel }: CmPipelineProps) {
  const Link = useLinkComponent();
  return (
    <section className="cm-pipe" aria-labelledby={titleId}>
      <div className="cm-pipe-head">
        <h2 className="rb-h2" id={titleId}>
          {title}
        </h2>
        {note ? <p className="rb-note">{note}</p> : null}
      </div>
      <div className="cm-lanes">
        {lanes.map((lane) => (
          <div key={lane.key}>
            <h3 className="cm-lane-t">
              <Glyph name={lane.icon} />
              {lane.title}
            </h3>
            <ol className="cm-tiles">
              {lane.tiles.map((tile) => (
                <li
                  key={tile.key}
                  className={joinClasses(
                    'cm-tile',
                    tile.you && 'is-you',
                    tile.count === 0 && 'is-quiet',
                  )}
                >
                  <Link className="cm-tile-a" href={tile.href} aria-label={tile.accessibleName}>
                    <span className="cm-tile-n">{tile.count}</span>
                    <span className="cm-tile-t">{tile.title}</span>
                    <span className="cm-tile-d">{tile.detail}</span>
                    {tile.you ? <CmYouBadge>{youLabel}</CmYouBadge> : null}
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---- I. Decision desk (CM-01) ------------------------------------------------------------------

export interface CmDeskAction {
  readonly href: string;
  /** "Open decision", "Continue". */
  readonly label: ReactNode;
  /** "Open the publication decision for Transient Cooling". */
  readonly accessibleName: string;
  /** The desk's one gold action: the first row of the desk. */
  readonly primary?: boolean;
}

export interface CmDeskRow {
  readonly key: string;
  /** The wait ("13 days", "Today") and its line ("approved 14 Aug"). */
  readonly when: { readonly big: ReactNode; readonly small?: ReactNode };
  /** "Publish next" over the title, on the next to publish (with `first`). */
  readonly next?: ReactNode;
  /** The ivory band of the next to publish (`is-first`). */
  readonly first?: boolean;
  readonly title: ReactNode;
  /** "SUB-0074 · ME ZG523 · Northline Simulation Studio". */
  readonly description?: ReactNode;
  /**
   * The row's facts (`p.cm-orow-x`): the checks (`CmCheckChip`) and formats (`FormatBadges`), or a
   * correction's status pill and its version change (`CmVersionChange`).
   */
  readonly facts?: ReactNode;
  /** The reviewer's words under a returned correction (`CmQuote`). */
  readonly quote?: ReactNode;
  readonly action: CmDeskAction;
}

export interface CmDeskGroup {
  readonly key: string;
  /** "Ready to publish", "Corrections that need you" (`h3.rb-g-name`). */
  readonly name: ReactNode;
  readonly icon: V3IconName;
  /** The group's list: "Open Ready to publish", "Open Updates". */
  readonly link?: { readonly href: string; readonly label: ReactNode };
  readonly rows: readonly CmDeskRow[];
}

export interface CmDecisionDeskProps {
  /** "Needs your decision". */
  readonly title: ReactNode;
  readonly titleId: string;
  /** "Oldest first". */
  readonly note?: ReactNode;
  readonly groups: readonly CmDeskGroup[];
  /** The groups' heading ids: `<idPrefix>-<group key>`. */
  readonly idPrefix: string;
}

/**
 * What needs the Content Manager's decision on CM-01 (`section.rb-queue` > `div.cm-queue-top`, kit
 * queue groups with `li.rb-row.cm-orow` rows): the wait first, then the item with its facts and
 * the reviewer's words, then its action.
 */
export function CmDecisionDesk({ title, titleId, note, groups, idPrefix }: CmDecisionDeskProps) {
  const Link = useLinkComponent();
  return (
    <section className="rb-queue" aria-labelledby={titleId}>
      <div className="cm-queue-top">
        <h2 className="rb-h2" id={titleId}>
          {title}
        </h2>
        {note ? <p className="rb-note">{note}</p> : null}
      </div>
      {groups.map((group) => {
        const headingId = `${idPrefix}-${group.key}`;
        return (
          <section key={group.key} className="rb-g" aria-labelledby={headingId}>
            <div className="rb-g-head">
              <span className="rb-ico-tile" aria-hidden="true">
                <Glyph name={group.icon} />
              </span>
              <h3 className="rb-g-name" id={headingId}>
                {group.name}
              </h3>
              {group.link ? (
                <Link className="rb-link" href={group.link.href}>
                  {group.link.label}
                </Link>
              ) : null}
            </div>
            <ul className="rb-rows">
              {group.rows.map((row) => (
                <li
                  key={row.key}
                  className={joinClasses('rb-row', 'cm-orow', row.first && 'is-first')}
                >
                  <p className="rb-row-when">
                    <b>{row.when.big}</b>
                    {row.when.small ? <span>{row.when.small}</span> : null}
                  </p>
                  <div className="rb-row-main">
                    {row.next ? <p className="cm-next">{row.next}</p> : null}
                    <p className="rb-row-t">{row.title}</p>
                    {row.description ? <p className="rb-row-d">{row.description}</p> : null}
                    {row.facts ? <p className="cm-orow-x">{row.facts}</p> : null}
                    {row.quote}
                  </div>
                  <div className="rb-row-act">
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
          </section>
        );
      })}
    </section>
  );
}

/**
 * A row's publication check in a few words (`span.cm-qcheck`): "4 of 4 checks met" with the tick,
 * or "1 thing to resolve" with the alert (`is-no`).
 */
export function CmCheckChip({
  met,
  children,
}: {
  readonly met: boolean;
  readonly children: ReactNode;
}) {
  return (
    <span className={joinClasses('cm-qcheck', !met && 'is-no')}>
      <Glyph name={met ? 'check' : 'alertCircle'} />
      {children}
    </span>
  );
}

export interface CmCalmDeskProps {
  /** "Needs your decision". */
  readonly title: ReactNode;
  /** "Nothing is waiting for your decision": names the panel. */
  readonly calmTitle: ReactNode;
  readonly calmTitleId: string;
  /** "Approved experiments and corrections returned to you appear here." */
  readonly children?: ReactNode;
  /** "Open the Content library" (`TextLink`). */
  readonly link?: ReactNode;
}

/**
 * Nothing waits for the Content Manager (`section.rb-panel.rb-att.rb-att--calm` > kit calm state,
 * then the Content library one click away). The export pads the link's line with an inline
 * `padding: 0 0 18px` (`p.rk-x-calm-foot`, V3P-14).
 */
export function CmCalmDesk({ title, calmTitle, calmTitleId, children, link }: CmCalmDeskProps) {
  return (
    <section className="rb-panel rb-att rb-att--calm" aria-labelledby={calmTitleId}>
      <div className="rb-att-head">
        <h2 className="rb-h2">{title}</h2>
      </div>
      <CalmState title={calmTitle} titleId={calmTitleId}>
        {children}
      </CalmState>
      {link ? <p className="rk-x-calm-foot">{link}</p> : null}
    </section>
  );
}

// ---- G. Main and side columns, side cards ------------------------------------------------------

/** The work beside its context (`div.cm-cols`): one column below 940 px, the side cards two-up. */
export function CmColumns({ children }: { readonly children: ReactNode }) {
  return <div className="cm-cols">{children}</div>;
}

/** Sections stacked in the main column (`div.cm-stack`, `cm-stack--lg` with the larger gap). */
export function CmStack({
  large = false,
  children,
}: {
  readonly large?: boolean;
  readonly children: ReactNode;
}) {
  return <div className={joinClasses('cm-stack', large && 'cm-stack--lg')}>{children}</div>;
}

/** The side column (`aside.cm-side[aria-label]`, or `div.cm-side` without a name: CM-01). */
export function CmSide({
  label,
  children,
}: {
  readonly label?: string;
  readonly children: ReactNode;
}) {
  return label ? (
    <aside className="cm-side" aria-label={label}>
      {children}
    </aside>
  ) : (
    <div className="cm-side">{children}</div>
  );
}

export interface CmSideCardProps {
  /** The card's heading id (the section's name). */
  readonly titleId: string;
  /** The heading (`h2.cm-sidecard-t`). */
  readonly title?: ReactNode;
  /** A head in place of the title: `CmGroupHead variant="side"` with its note ("With others"). */
  readonly head?: ReactNode;
  /** The ivory card (`cm-sidecard--ivory`): what publishing does, platform versus institution codes. */
  readonly ivory?: boolean;
  readonly children?: ReactNode;
  /** The card's last line (`p.cm-sidefoot`): "Open the Content library". */
  readonly foot?: ReactNode;
}

/** A side card (`section.cm-sidecard`): context beside the work. */
export function CmSideCard({
  titleId,
  title,
  head,
  ivory = false,
  children,
  foot,
}: CmSideCardProps) {
  return (
    <section
      className={joinClasses('cm-sidecard', ivory && 'cm-sidecard--ivory')}
      aria-labelledby={titleId}
    >
      {head ?? (
        <h2 className="cm-sidecard-t" id={titleId}>
          {title}
        </h2>
      )}
      {children}
      {foot ? <p className="cm-sidefoot">{foot}</p> : null}
    </section>
  );
}

/**
 * A plain line in a side card (`p.cm-hold-d`): "Nothing is waiting on the Academic Reviewer, …".
 * `flush`: the line straight under the card's title, as the export sets it inline with
 * `margin-top: 0` (CM-09 "Platform codes, not institution codes"; `rk-x-hold-d-flush`, V3P-14).
 */
export function CmSideText({
  flush = false,
  children,
}: {
  readonly flush?: boolean;
  readonly children: ReactNode;
}) {
  return <p className={joinClasses('cm-hold-d', flush && 'rk-x-hold-d-flush')}>{children}</p>;
}

export interface CmHoldRow {
  readonly key: string;
  /** "Boiler Drum Level 2.1" (`p.cm-hold-t`). */
  readonly title: ReactNode;
  /** "Super Admin · held 20 Aug · 2.0 stays live" (`p.cm-hold-d`). */
  readonly detail: ReactNode;
  /** Who has it now, as a status pill (`p.cm-hold-st`). */
  readonly status: ReactNode;
  readonly link: {
    readonly href: string;
    readonly label: ReactNode;
    readonly accessibleName: string;
  };
}

/** What the Content Manager sent on, with whom it is now (`ul.cm-hold`; CM-01 "With others"). */
export function CmHoldList({ rows }: { readonly rows: readonly CmHoldRow[] }) {
  const Link = useLinkComponent();
  return (
    <ul className="cm-hold">
      {rows.map((row) => (
        <li key={row.key}>
          <div>
            <p className="cm-hold-t">{row.title}</p>
            <p className="cm-hold-d">{row.detail}</p>
            <p className="cm-hold-st">{row.status}</p>
          </div>
          <Link className="rb-link" href={row.link.href} aria-label={row.link.accessibleName}>
            {row.link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** The catalogue's total (`p.cm-cattotal`): "12" and "experiments live, in 5 courses". */
export function CmCatalogueTotal({
  count,
  children,
}: {
  readonly count: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <p className="cm-cattotal">
      <b>{count}</b>
      <span>{children}</span>
    </p>
  );
}

export interface CmCatalogueCourse {
  readonly key: string;
  /** The platform code chip; none when the course has no code. */
  readonly code?: string | null;
  readonly name: ReactNode;
  readonly count: number;
  /** The library's Published view, filtered to the course. */
  readonly href: string;
  /** "Thermodynamics & Heat Transfer, 3 published experiments. Open in the Content library". */
  readonly accessibleName: string;
}

/** Live experiments by course (`ul.cm-catlist`), each opening the library filtered to it. */
export function CmCatalogueList({
  label,
  courses,
}: {
  /** "Live experiments by course". */
  readonly label: string;
  readonly courses: readonly CmCatalogueCourse[];
}) {
  const Link = useLinkComponent();
  return (
    <ul className="cm-catlist" aria-label={label}>
      {courses.map((course) => (
        <li key={course.key}>
          <Link className="cm-catlist-t" href={course.href} aria-label={course.accessibleName}>
            {course.code ? <CourseCode code={course.code} /> : null}
            <span>{course.name}</span>
          </Link>
          <span className="cm-catlist-n" aria-hidden="true">
            {course.count}
          </span>
        </li>
      ))}
    </ul>
  );
}

export interface CmSaysItem {
  readonly key: string;
  readonly icon: V3IconName;
  /** "Lists it in the public catalogue" (`b`). */
  readonly title: ReactNode;
  /** "Under its course, with every format that passed review." */
  readonly children: ReactNode;
}

/** What something does, point by point (`ul.cm-says`): an icon tile, the point, its line. */
export function CmSays({ items }: { readonly items: readonly CmSaysItem[] }) {
  return (
    <ul className="cm-says">
      {items.map((item) => (
        <li key={item.key}>
          <span className="cm-says-ico" aria-hidden="true">
            <Glyph name={item.icon} />
          </span>
          <p>
            <b>{item.title}</b>
            {item.children}
          </p>
        </li>
      ))}
    </ul>
  );
}

export interface CmFeedItem {
  readonly key: string;
  /** "Orifice Plate Metering" (`p.cm-feed-t`). */
  readonly title: ReactNode;
  /** "Version 1.1 released · 5 Aug 2026" (`p.cm-feed-d`). */
  readonly detail: ReactNode;
}

/** The latest changes (`ul.cm-feed`), or the line that says there is none (`p.cm-feed-d`). */
export function CmFeed({
  items,
  empty,
}: {
  readonly items: readonly CmFeedItem[];
  /** "Nothing is published yet." */
  readonly empty?: ReactNode;
}) {
  if (items.length === 0) return empty ? <p className="cm-feed-d">{empty}</p> : null;
  return (
    <ul className="cm-feed">
      {items.map((item) => (
        <li key={item.key}>
          <p className="cm-feed-t">{item.title}</p>
          <p className="cm-feed-d">{item.detail}</p>
        </li>
      ))}
    </ul>
  );
}

// ---- C. Decision cards (CM-02) -----------------------------------------------------------------

export interface CmQueueSort {
  /** "Sort: approved, oldest first" (wide). */
  readonly long: string;
  /** "Sort: oldest first" (narrow). */
  readonly short: string;
  readonly direction: 'asc' | 'desc';
  readonly onToggle: () => void;
}

/**
 * A list's count and order without a table (`div.rk-toolbar` > `div.rk-statusline` >
 * `p.rk-count[role=status]` + `div.rk-sortbar`): the count announced, the sort button always shown
 * (`rk-x-sort-shown`, V3P-02 — there is no table head to carry the order).
 */
export function CmQueueToolbar({
  count,
  sort,
}: {
  readonly count: ReactNode;
  readonly sort?: CmQueueSort;
}) {
  return (
    <div className="rk-toolbar">
      <div className="rk-statusline">
        <p className="rk-count" role="status">
          {count}
        </p>
        {sort ? (
          <div className="rk-sortbar rk-x-sort-shown">
            <button type="button" className="rk-sortbtn" onClick={sort.onToggle}>
              <span className="rk-sort-l">{sort.long}</span>
              <span className="rk-sort-s">{sort.short}</span>
              <Glyph name={sort.direction === 'desc' ? 'arrowDown' : 'arrowUp'} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export interface CmDecisionCardCheck {
  readonly key: string;
  /** "Approved", "Learning outcomes", "Catalogue details", "Delivery for each format". */
  readonly label: ReactNode;
  readonly met: boolean;
  /** Read before the label: "Met: " or "Not met: ". */
  readonly stateWords: string;
}

export interface CmDecisionCard {
  readonly key: string;
  /** The longest wait: marked (`is-first`) with `firstLabel` ("Waiting longest"). */
  readonly first?: boolean;
  readonly firstLabel?: ReactNode;
  /** "13" · "days waiting" · "since 14 Aug" (or "Today" · "just approved" · "at 15:20"). */
  readonly age: { readonly value: ReactNode; readonly unit: ReactNode; readonly detail: ReactNode };
  /** The experiment's name (`h2.cm-qname`). */
  readonly name: ReactNode;
  /** "SUB-0074 · Northline Simulation Studio". */
  readonly idLine: ReactNode;
  /** The course and formats (`p.cm-qmeta`): `CmCourseName` and `FormatBadges`. */
  readonly meta: ReactNode;
  /** "Approved by Prof. A. Menon · 2 learning outcomes". */
  readonly byLine: ReactNode;
  readonly checks: readonly CmDecisionCardCheck[];
  /** "All 4 checks met" or "1 thing to resolve" (`is-no`). */
  readonly summary: { readonly text: ReactNode; readonly met: boolean };
  readonly action: CmDeskAction;
}

/**
 * One approved submission per card (`div.cm-qbody` > `ul.cm-qlist`, container `cmq`): days
 * waiting, identity, the four publication checks and the next action. Below 600 px a card stacks
 * and keeps only the checks that fail.
 */
export function CmDecisionCards({
  label,
  checksLabel,
  cards,
}: {
  /** "Approved experiments, oldest first". */
  readonly label: string;
  /** "Publication check". */
  readonly checksLabel: string;
  readonly cards: readonly CmDecisionCard[];
}) {
  return (
    <div className="cm-qbody">
      <ul className="cm-qlist" aria-label={label}>
        {cards.map((entry) => (
          <li key={entry.key} className={joinClasses('cm-qcard', entry.first && 'is-first')}>
            <div className="cm-age">
              <p className="cm-age-n">{entry.age.value}</p>
              <p className="cm-age-t">{entry.age.unit}</p>
              <p className="cm-age-d">{entry.age.detail}</p>
            </div>
            <div className="cm-qmain">
              {entry.first && entry.firstLabel ? (
                <p className="cm-next">{entry.firstLabel}</p>
              ) : null}
              <h2 className="cm-qname">{entry.name}</h2>
              <p className="cm-qline">{entry.idLine}</p>
              <p className="cm-qmeta">{entry.meta}</p>
              <p className="cm-qline">{entry.byLine}</p>
            </div>
            <ul className="cm-qchecks" aria-label={checksLabel}>
              {entry.checks.map((check) => (
                <li key={check.key} className={joinClasses('cm-qcheck', !check.met && 'is-no')}>
                  <Glyph name={check.met ? 'check' : 'cross'} />
                  <span className="xr-sr">{check.stateWords}</span>
                  {check.label}
                </li>
              ))}
            </ul>
            <p className={joinClasses('cm-qsum', !entry.summary.met && 'is-no')}>
              {entry.summary.text}
            </p>
            <div className="cm-qact">
              <ButtonLink
                href={entry.action.href}
                variant={entry.action.primary ? 'primary' : 'default'}
                aria-label={entry.action.accessibleName}
              >
                {entry.action.label}
              </ButtonLink>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * "Loading the experiments ready to publish…" over card skeletons (`div[aria-busy]` >
 * `p.rk-loading-msg[role=status]` + `div.rk-skel-ca` > `div.rk-skel-card` ×3), as CM-02 draws its
 * loading state.
 */
export function CmLoadingCards({
  message,
  cards = 3,
}: {
  readonly message: ReactNode;
  readonly cards?: number;
}) {
  return (
    <div aria-busy="true">
      <p className="rk-loading-msg" role="status">
        {message}
      </p>
      <div className="rk-skel-ca" aria-hidden="true">
        {Array.from({ length: cards }, (_, index) => (
          <div key={index} className="rk-skel-card">
            <span className="rk-skel" />
            <div className="rk-skel-cells">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- L. Library: view switch, stage line, course-grouped table (CM-04) -------------------------

/** The library's frame (`div.rk-ca`): the view switch, the stage line and the list surface. */
export function CmLibraryLayout({ children }: { readonly children: ReactNode }) {
  return <div className="rk-ca">{children}</div>;
}

export interface CmViewOption<Key extends string> {
  readonly key: Key;
  /** "Ready", "In review", "With vendor", "Published". */
  readonly label: ReactNode;
  /** The view's count (`b`); none while the list loads or has failed. */
  readonly count?: number;
}

export interface CmViewSwitchProps<Key extends string> {
  /** The group's name: "Show experiments that are". */
  readonly label: string;
  readonly options: readonly CmViewOption<Key>[];
  readonly value: Key;
  readonly onChange: (key: Key) => void;
  /** The switch's id and its buttons' (`<id>-<key>`): the export's `cm-lib-switch`. */
  readonly id?: string;
}

/** The fade the switch draws at its end while it scrolls sideways (the export's `keepSwitch`). */
const SWITCH_FADE = 44;

/** Scrolls the switch sideways, where it scrolls, so `button` is wholly in sight (the export's `keepSwitch`). */
function keepInSight(group: HTMLElement, button: HTMLElement): void {
  const outer = group.getBoundingClientRect();
  const inner = button.getBoundingClientRect();
  const fade = group.scrollWidth > group.clientWidth ? SWITCH_FADE : 0;
  if (inner.left < outer.left + 6) group.scrollLeft += inner.left - outer.left - 6;
  else if (inner.right > outer.right - fade) group.scrollLeft += inner.right - (outer.right - fade);
}

/** Whether focus reached `element` from the keyboard (`:focus-visible`), not a pointer press. */
function focusedFromKeyboard(element: HTMLElement): boolean {
  try {
    return element.matches(':focus-visible');
  } catch {
    return false;
  }
}

/**
 * The library's views (`div.rb-switchbar` > `div.rb-switch[role=group]` > `button[aria-pressed]`
 * with its count). Where the switch scrolls sideways (a phone), the pressed view is kept in sight,
 * clear of the end fade, as the export does after each render — and so is a view that takes
 * focus from the keyboard (the browser leaves a view showing only its edge where it is).
 */
export function CmViewSwitch<Key extends string>({
  label,
  options,
  value,
  onChange,
  id,
}: CmViewSwitchProps<Key>) {
  const groupRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const group = groupRef.current;
    const pressed = group?.querySelector<HTMLElement>('button[aria-pressed="true"]');
    if (group && pressed) keepInSight(group, pressed);
  });
  return (
    <div className="rb-switchbar">
      <div ref={groupRef} className="rb-switch" id={id} role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.key}
            id={id ? `${id}-${option.key}` : undefined}
            type="button"
            aria-pressed={option.key === value}
            onClick={() => onChange(option.key)}
            onFocus={(event) => {
              // From the keyboard only: a pointer press must not move the button from under it.
              if (groupRef.current && focusedFromKeyboard(event.currentTarget)) {
                keepInSight(groupRef.current, event.currentTarget);
              }
            }}
          >
            {option.label}
            {option.count === undefined ? null : (
              <>
                {/* A space the flex layout does not draw: the name reads "Ready 3", not "Ready3". */}{' '}
                <b>{option.count}</b>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Who holds a view's items: `you` gold, `vendor`, `live` green, or the reviewer's plain chip. */
export type CmOwnerTone = 'you' | 'vendor' | 'live' | 'other';

/**
 * The line under the switch (`p.cm-stageline`): who holds the items in this view (`span.cm-own`)
 * and what that means for the Content Manager.
 */
export function CmStageLine({
  owner,
  tone,
  children,
}: {
  /** "With you", "With the Academic Reviewer", "With the vendors", "In the public catalogue". */
  readonly owner: ReactNode;
  readonly tone: CmOwnerTone;
  readonly children: ReactNode;
}) {
  return (
    <p className="cm-stageline">
      <span className={joinClasses('cm-own', tone !== 'other' && `is-${tone}`)}>{owner}</span>
      <span className="cm-stageline-d">{children}</span>
    </p>
  );
}

/** The `xr-st` classes of a tone (the kit's status grammar), for the correction chip of a row. */
function statusClasses(tone: StatusTone): string {
  return joinClasses(
    'xr-st',
    tone !== 'neutral' && tone !== 'ended' && `xr-st--${tone}`,
    tone === 'ended' && 'rk-st-ended',
  );
}

export interface CmStatusWords {
  readonly tone: StatusTone;
  readonly label: ReactNode;
}

/**
 * "Where it is" (`span.cm-stcell`): the record's status pill, a quiet line ("Re-check you asked
 * for"), and a published experiment's open correction as its own status chip ("Update returned to
 * you").
 */
export function CmStatusCell({
  status,
  tag,
  update,
}: {
  readonly status: CmStatusWords;
  readonly tag?: ReactNode;
  readonly update?: CmStatusWords;
}) {
  return (
    <span className="cm-stcell">
      <StatusPill tone={status.tone}>{status.label}</StatusPill>
      {tag ? <span className="rk-small">{tag}</span> : null}
      {update ? (
        <span className={statusClasses(update.tone)}>
          <i />
          {update.label}
        </span>
      ) : null}
    </span>
  );
}

export interface CmLibraryRow {
  readonly key: string;
  /** Where the row leads: its link, and a press anywhere on the row, go there. */
  readonly href: string;
  /** The experiment's name (`a.rk-rowlink`). */
  readonly title: ReactNode;
  /** "Transient Cooling, SUB-0074, ready to publish. Open the decision". */
  readonly linkLabel: string;
  /** Under the link (`span.rk-small`): "SUB-0074", "From SUB-0052". */
  readonly titleDetail?: ReactNode;
  /** The formats (`CmFormatBadges`: the export writes them with `margin-top: 0`). */
  readonly formats: ReactNode;
  /** "Prof. A. Menon" over "Academic Reviewer"; "Version 1.2" over the vendor. */
  readonly kind: { readonly strong: ReactNode; readonly small?: ReactNode };
  /** The date's label where the row stacks (`span.rk-inlabel`): "Approved", "Since", "Live since". */
  readonly whenLabel: string;
  readonly when: ReactNode;
  /** "Where it is" (`CmStatusCell`). */
  readonly status: ReactNode;
}

export interface CmCourseGroup<Row> {
  readonly key: string;
  /** The course's platform code chip; none when the course has no code. */
  readonly code?: string | null;
  readonly name: ReactNode;
  /** "2 ready to publish", "3 published" (`span.cm-grp-k`). */
  readonly count: ReactNode;
  readonly rows: readonly Row[];
}

export interface CmLibraryTableProps {
  /** "Ready — 3" (the table's hidden caption). */
  readonly caption: string;
  /** Experiment · Formats · Approved by / Vendor / Version · Approved / Since / Live since · Where it is. */
  readonly headers: RecordTableHeaders;
  readonly groups: readonly CmCourseGroup<CmLibraryRow>[];
}

const INTERACTIVE = 'a, button, input, select, textarea, label, summary, [tabindex]';

/** A row the whole of which follows its link (as the kit's record table rows). */
function LinkedRow({
  href,
  linkLabel,
  title,
  children,
}: {
  readonly href: string;
  readonly linkLabel: string;
  readonly title: ReactNode;
  readonly children: (link: ReactNode) => ReactNode;
}) {
  const Link = useLinkComponent();
  const linkRef = useRef<HTMLAnchorElement>(null);
  // A press anywhere on the row follows its link — not on another control of the row, and not
  // when the press ended a text selection (the V3 shell's `main` is an ancestor of every row).
  const onRowClick = (event: MouseEvent<HTMLTableRowElement>) => {
    const target = event.target;
    const control = target instanceof Element ? target.closest(INTERACTIVE) : null;
    if (control && event.currentTarget.contains(control)) return;
    if (window.getSelection()?.toString()) return;
    linkRef.current?.click();
  };
  return (
    <tr role="row" onClick={onRowClick}>
      {children(
        <Link ref={linkRef} className="rk-rowlink" href={href} aria-label={linkLabel}>
          {title}
        </Link>,
      )}
    </tr>
  );
}

/** A course band (`tr.cm-grp-h` > `th[scope=rowgroup]` > `div.cm-grp-row`): code, name, count. */
function GroupHeadRow({
  className,
  columns,
  code,
  name,
  count,
}: {
  readonly className: 'cm-grp-h' | 'cm-area';
  readonly columns: number;
  readonly code?: string | null;
  readonly name: ReactNode;
  readonly count: ReactNode;
}) {
  const nameSpan = <span className="cm-grp-name">{name}</span>;
  return (
    <tr className={className} role="row">
      <th colSpan={columns} scope="rowgroup" role="rowheader">
        <div className="cm-grp-row">
          {className === 'cm-grp-h' ? (
            <span className="cm-grp-c">
              {code ? <CourseCode code={code} /> : null}
              {nameSpan}
            </span>
          ) : (
            nameSpan
          )}
          <span className="cm-grp-k">{count}</span>
        </div>
      </th>
    </tr>
  );
}

/**
 * The library's table grouped by course, as the catalogue is (`div.rk-tablewrap` >
 * `table.rk-table`, one `tbody` per course with its band): the kit's table layouts by width, the
 * whole row a link. Explicit table roles keep the semantics where the narrow layouts change the
 * cells' display. The export sizes the columns with inline widths — 34 %, 17 %, 16 %, 13 %, 20 %
 * (`th.rk-x-lib-col`, V3P-14); a row's formats are `CmFormatBadges` (flush, V3P-14).
 */
export function CmLibraryTable({ caption, headers, groups }: CmLibraryTableProps) {
  return (
    <div className="rk-tablewrap">
      <table className="rk-table" role="table">
        <caption>{caption}</caption>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader" className="rk-c-inst rk-x-lib-col">
              {headers.who}
            </th>
            <th scope="col" role="columnheader" className="rk-c-exp rk-x-lib-col">
              {headers.what}
            </th>
            <th scope="col" role="columnheader" className="rk-c-type rk-x-lib-col">
              {headers.kind}
            </th>
            <th scope="col" role="columnheader" className="rk-c-date rk-x-lib-col">
              {headers.when}
            </th>
            <th scope="col" role="columnheader" className="rk-c-st rk-x-lib-col">
              {headers.status}
            </th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.key} role="rowgroup">
            <GroupHeadRow
              className="cm-grp-h"
              columns={5}
              code={group.code}
              name={group.name}
              count={group.count}
            />
            {group.rows.map((row) => (
              <LinkedRow key={row.key} href={row.href} linkLabel={row.linkLabel} title={row.title}>
                {(link) => (
                  <>
                    <td role="cell" className="rk-c-inst">
                      {link}
                      {row.titleDetail ? <span className="rk-small">{row.titleDetail}</span> : null}
                    </td>
                    <td role="cell" className="rk-c-exp">
                      {row.formats}
                    </td>
                    <td role="cell" className="rk-c-type">
                      <span className="rk-strong">{row.kind.strong}</span>
                      {row.kind.small ? <span className="rk-small">{row.kind.small}</span> : null}
                    </td>
                    <td role="cell" className="rk-c-date">
                      <span className="rk-inlabel">{row.whenLabel} </span>
                      {row.when}
                    </td>
                    <td role="cell" className="rk-c-st">
                      {row.status}
                    </td>
                  </>
                )}
              </LinkedRow>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

// ---- M, 6. Platform course codes (CM-09) -------------------------------------------------------

export interface CmCodesSurfaceProps {
  /** "Courses". */
  readonly title: ReactNode;
  readonly titleId: string;
  /** "From Academic structure, kept by the Super Admin". */
  readonly note?: ReactNode;
  /** "Each code must be unique. …" (`p.rk-next`); its id describes every code field. */
  readonly hint: ReactNode;
  readonly hintId?: string;
  /** Under the hint: the error summary, the save failure, the saved notice. */
  readonly messages?: ReactNode;
  /** The table and its foot, or the list's loading or failed state. */
  readonly children: ReactNode;
}

/**
 * The course-code surface (`section.rk-surface` > `div.rk-sec`): its head and note, the rule in
 * words and what the last save said, then the table.
 */
export function CmCodesSurface({
  title,
  titleId,
  note,
  hint,
  hintId,
  messages,
  children,
}: CmCodesSurfaceProps) {
  return (
    <section className="rk-surface" aria-labelledby={titleId}>
      <div className="rk-sec">
        <div className="rk-sec-h">
          <h2 className="rb-h2" id={titleId}>
            {title}
          </h2>
          {note ? <p className="rb-note">{note}</p> : null}
        </div>
        <div className="cm-stack">
          <p className="rk-next" id={hintId}>
            {hint}
          </p>
          {messages}
        </div>
      </div>
      {children}
    </section>
  );
}

export interface CmCodesFailedProps {
  /** "We couldn’t save the codes". */
  readonly title: ReactNode;
  /** "Nothing has changed. Your edits are still in the table. Try again." */
  readonly children: ReactNode;
  /** "Try again" (`button.rb-btn`): saves again. None where trying again cannot help. */
  readonly retry?: { readonly label: ReactNode; readonly onRetry: () => void };
  readonly id?: string;
  readonly ref?: Ref<HTMLDivElement>;
}

/**
 * A save that did not go through (`div.rk-errsum[role=alert][tabindex=-1]`): what happened, that
 * the edits are kept, and Try again. The export spaces the line (`margin-top: 4px; font: 500
 * 15px/22px`) and the button (`margin-top: 10px`) inline: `p.rk-x-errsum-line` and
 * `button.rb-btn.rk-x-errsum-retry` (V3P-14), as CM-08's `CmSaveFailed`.
 */
export function CmCodesFailed({ title, children, retry, id, ref }: CmCodesFailedProps) {
  return (
    <div ref={ref} className="rk-errsum" id={id} tabIndex={-1} role="alert">
      <p className="rk-errsum-t">{title}</p>
      <p className="rk-x-errsum-line">{children}</p>
      {retry ? (
        <Button className="rk-x-errsum-retry" onClick={retry.onRetry}>
          {retry.label}
        </Button>
      ) : null}
    </div>
  );
}

export interface CmCodeField {
  readonly id: string;
  readonly value: string;
  /** The input's name: "Platform course code for Fluid Mechanics". */
  readonly label: string;
  /** The label shown where the row stacks (`span.rk-label.cm-inlabel[aria-hidden]`). */
  readonly inlineLabel: ReactNode;
  readonly onChange: (value: string) => void;
  readonly invalid?: boolean;
  /** The hint, Changed tag, blank line and error ids, as the row shows them. */
  readonly describedBy?: string;
  readonly ref?: Ref<HTMLInputElement>;
}

export interface CmCodeRow {
  readonly key: string;
  /** The course's name (`p.cm-course-t`). */
  readonly name: ReactNode;
  /** "3 experiments live under this course" (`p.cm-course-s`). */
  readonly liveText: ReactNode;
  /** The live experiments under the code (`span.cm-livecount`, `is-zero` for none). */
  readonly live: number;
  readonly field: CmCodeField;
  /** "Changed — not saved yet" (`CmTag` with the edit glyph). */
  readonly changed?: { readonly id: string; readonly text: ReactNode };
  /** "No code yet — the catalogue shows the course name only." (`p.rk-hint`). */
  readonly blank?: { readonly id: string; readonly text: ReactNode };
  /** The duplicate's words (`p.rk-ferr`). */
  readonly error?: { readonly id: string; readonly text: ReactNode };
}

export interface CmCodesTableProps {
  /** "Platform course codes" (the table's caption). */
  readonly caption: string;
  readonly headers: { readonly course: string; readonly live: string; readonly code: string };
  readonly areas: readonly CmCourseGroup<CmCodeRow>[];
}

/**
 * One editable table of platform codes, grouped by engineering area (`div.cm-codeswrap` >
 * `table.cm-codes`, container `cmcodes`: each course a labelled block below 640 px): the course,
 * its live experiments and its code field with the Changed tag, the blank line and its error.
 */
export function CmCodesTable({ caption, headers, areas }: CmCodesTableProps) {
  return (
    <div className="cm-codeswrap">
      <table className="cm-codes" role="table">
        <caption>{caption}</caption>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader" className="cm-c-course">
              {headers.course}
            </th>
            <th scope="col" role="columnheader" className="cm-c-live">
              {headers.live}
            </th>
            <th scope="col" role="columnheader">
              {headers.code}
            </th>
          </tr>
        </thead>
        {areas.map((area) => (
          <tbody key={area.key} role="rowgroup">
            <GroupHeadRow className="cm-area" columns={3} name={area.name} count={area.count} />
            {area.rows.map((row) => (
              <tr key={row.key} role="row">
                <td role="cell">
                  <p className="cm-course-t">{row.name}</p>
                  <p className="cm-course-s">{row.liveText}</p>
                </td>
                <td role="cell" className="cm-c-live">
                  <span className={joinClasses('cm-livecount', row.live === 0 && 'is-zero')}>
                    {row.live}
                  </span>
                </td>
                <td role="cell">
                  <div className="rk-field">
                    <CmInLabel field>{row.field.inlineLabel}</CmInLabel>
                    <input
                      ref={row.field.ref}
                      id={row.field.id}
                      className="rk-input"
                      type="text"
                      value={row.field.value}
                      autoComplete="off"
                      spellCheck={false}
                      aria-label={row.field.label}
                      aria-invalid={row.field.invalid ? true : undefined}
                      aria-describedby={row.field.describedBy || undefined}
                      onChange={(event) => row.field.onChange(event.target.value)}
                    />
                    {row.changed ? (
                      <p>
                        <CmTag id={row.changed.id} icon="edit">
                          {row.changed.text}
                        </CmTag>
                      </p>
                    ) : null}
                    {row.blank ? <Hint id={row.blank.id}>{row.blank.text}</Hint> : null}
                    {row.error ? <FieldError id={row.error.id}>{row.error.text}</FieldError> : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

/**
 * The table's foot (`div.cm-codes-foot`): the unsaved-change count, announced
 * (`p.cm-codes-state[role=status]`), then Undo changes and Save codes (`div.cm-btnrow`).
 */
export function CmCodesFoot({
  state,
  children,
}: {
  /** "No unsaved changes", "1 change not saved", "Saving…". */
  readonly state: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className="cm-codes-foot">
      <p className="cm-codes-state" role="status">
        {state}
      </p>
      <div className="cm-btnrow">{children}</div>
    </div>
  );
}
