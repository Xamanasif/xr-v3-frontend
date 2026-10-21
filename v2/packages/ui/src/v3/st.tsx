'use client';

import { type MouseEvent, useLayoutEffect, useRef, type ReactNode, type Ref } from 'react';

import type { FormatCode } from '../icons/registry.js';
import { joinClasses } from '../internal/classes.js';
import { useLinkComponent } from '../link.js';
import { Glyph, type V3IconName } from './icons.js';
import { StatusPill, type StatusTone } from './status.js';
import { scrollCurrentIntoView } from './tabs.js';

/*
 * What more than one Student screen group draws (`sv-` / `st-` classes; the owner-approved Student
 * export, design/v3-refined-b/roles/ST-v1, `project/StudentFinal.dc.html`,
 * `project/v3-student-final.css` and its COMPONENT-EXTENSIONS.md; ST-ANALYSIS §5): the format chip,
 * the surfaces and their headings, the list rows, the compact message, the in-surface state row,
 * the loading block, the hold note, the compact refusal (`sv-refuse`), the record head with its
 * code eyebrow (`st-eyecode`), the section tabs (`sv-tabs`), the "Not available to you" rows, the
 * per-format progress table (`progExp`: ST-10 and ST-15), the how-to steps and the small text
 * pieces. Markup as the export's template draws it; every word, date, figure and destination
 * comes from the caller. No stage tracker is drawn here (lead decision 1: the sample activity's
 * stages are illustrative, not product data). What one screen group alone draws is in
 * `st-home.tsx`, `st-hub.tsx`, `st-progress.tsx` and `st-assess.tsx`.
 */

// ---- Format chip ------------------------------------------------------------------------------

/**
 * The compact format chip's states (the export's `fmtChip`): `on` available to you (solid navy,
 * gold tick), `pub` published but not in the institution's access (dashed), `none` not published
 * (flat grey), `held` given but held — paused, a licence wait, not right now (outlined, a glyph),
 * `ended` access ended (grey outline, a dash). Words always go beside it.
 */
export type StFormatKind = 'on' | 'pub' | 'none' | 'held' | 'ended';

const CHIP_CLASS: Readonly<Record<StFormatKind, string>> = {
  on: 'xr-fmt sv-fmt sv-fmt--on',
  pub: 'xr-fmt sv-fmt xr-fmt--pub',
  none: 'xr-fmt sv-fmt xr-fmt--none',
  held: 'xr-fmt sv-fmt sv-fmt--held',
  ended: 'xr-fmt sv-fmt sv-fmt--ended',
};

/** The glyph a state draws unless the caller names one (`held` names its own: why it is held). */
const CHIP_GLYPH: Readonly<Record<StFormatKind, V3IconName | null>> = {
  on: 'check',
  pub: null,
  none: null,
  held: null,
  ended: 'dash',
};

export interface StFormatChipProps {
  readonly code: FormatCode;
  readonly kind: StFormatKind;
  /**
   * The glyph after the code. Default: `on` the tick, `ended` the dash, none otherwise. A held
   * chip names why: `pauseBars` (paused), `clock` (a licence wait), `alertCircle` (not right now).
   * `null` draws none (the "Not available to you" rows draw the bare code).
   */
  readonly glyph?: V3IconName | null;
  /**
   * The chip is decorative beside its words (`aria-hidden`, the default). `false` where its box is
   * already hidden (`span.sv-frow-b`, `span.sv-xrow-b`, the step badge).
   */
  readonly hidden?: boolean;
}

/** The 56 × 24 format chip (`span.xr-fmt.sv-fmt`; ST-01 … ST-18). */
export function StFormatChip({ code, kind, glyph, hidden = true }: StFormatChipProps) {
  const drawn = glyph === undefined ? CHIP_GLYPH[kind] : glyph;
  return (
    <span className={CHIP_CLASS[kind]} aria-hidden={hidden ? 'true' : undefined}>
      {code}
      {drawn ? <Glyph name={drawn} /> : null}
    </span>
  );
}

// ---- Surfaces, headings and small text pieces --------------------------------------------------

export interface StCardProps {
  readonly as?: 'section' | 'div' | 'aside' | 'article';
  readonly labelledBy?: string;
  readonly label?: string;
  readonly children: ReactNode;
}

/** One main surface (`.sv-card`): no card inside a card; sections inside are split by hairlines. */
export function StCard({ as: Tag = 'section', labelledBy, label, children }: StCardProps) {
  return (
    <Tag className="sv-card" aria-labelledby={labelledBy} aria-label={label}>
      {children}
    </Tag>
  );
}

/** A card's head row (`div.sv-card-h`; `--stack` puts the note under the title). */
export function StCardHead({
  stack = false,
  children,
}: {
  readonly stack?: boolean;
  readonly children: ReactNode;
}) {
  return <div className={joinClasses('sv-card-h', stack && 'sv-card-h--stack')}>{children}</div>;
}

export interface StSectionTitleProps {
  readonly id?: string;
  readonly level?: 2 | 3;
  /** Takes focus after an action or a retry (`tabindex="-1"`; ST-06 "Resources", ST-08). */
  readonly focusable?: boolean;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  readonly children: ReactNode;
}

/** A section title inside a surface (`.sv-sec-t`, 20/28). */
export function StSectionTitle({
  id,
  level = 2,
  focusable = false,
  titleRef,
  children,
}: StSectionTitleProps) {
  const Tag = level === 3 ? 'h3' : 'h2';
  return (
    <Tag ref={titleRef} id={id} className="sv-sec-t" tabIndex={focusable ? -1 : undefined}>
      {children}
    </Tag>
  );
}

/** The quiet note beside a title (`p.sv-sh-note`): "Only experiments given to you are listed". */
export function StNote({ children }: { readonly children: ReactNode }) {
  return <p className="sv-sh-note">{children}</p>;
}

/**
 * A heading above a surface (`h2.sv-sh`; Home "Continue where you left off", ST-07 "Choose a
 * format"), with its note in one row (`div.sv-sh-row`) when there is one.
 */
export function StShelfHead({
  title,
  titleId,
  note,
}: {
  readonly title: ReactNode;
  readonly titleId?: string;
  readonly note?: ReactNode;
}) {
  const heading = (
    <h2 className="sv-sh" id={titleId}>
      {title}
    </h2>
  );
  if (note === undefined || note === null) return heading;
  return (
    <div className="sv-sh-row">
      {heading}
      <p className="sv-sh-note">{note}</p>
    </div>
  );
}

/** A small grey sub-heading (`.sv-subk`): "Your formats", "Not available to you". */
export function StSubheading({
  id,
  level = 3,
  children,
}: {
  readonly id?: string;
  readonly level?: 2 | 3 | 4 | 5;
  readonly children: ReactNode;
}) {
  const Tag = `h${level}` as 'h2' | 'h3' | 'h4' | 'h5';
  return (
    <Tag className="sv-subk" id={id}>
      {children}
    </Tag>
  );
}

/** A small title (`.sv-h3`, 17/24): the aside's sections ("About VR", "How a transfer works"). */
export function StSideTitle({
  id,
  level = 2,
  children,
}: {
  readonly id?: string;
  readonly level?: 2 | 3;
  readonly children: ReactNode;
}) {
  const Tag = level === 3 ? 'h3' : 'h2';
  return (
    <Tag className="sv-h3" id={id}>
      {children}
    </Tag>
  );
}

/**
 * An aside's sentence (`p.sv-side-d`). `className`: the export's own modifier beside it (My
 * device's closing rule, `sv-devnote`).
 */
export function StSideText({
  className,
  children,
}: {
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return <p className={joinClasses('sv-side-d', className)}>{children}</p>;
}

/** A small kicker (`p.sv-eyebrow`): "Deadline", "Authorised device". */
export function StEyebrow({
  id,
  children,
}: {
  readonly id?: string;
  readonly children: ReactNode;
}) {
  return (
    <p className="sv-eyebrow" id={id}>
      {children}
    </p>
  );
}

/** The main + one aside layout (`div.sv-ov`; one column below 900 px). */
export function StOverview({ children }: { readonly children: ReactNode }) {
  return <div className="sv-ov">{children}</div>;
}

/** The one aside of a page (`.sv-card.sv-ov-side`). */
export function StAside({
  as: Tag = 'aside',
  labelledBy,
  label,
  children,
}: {
  readonly as?: 'aside' | 'div';
  readonly labelledBy?: string;
  readonly label?: string;
  readonly children: ReactNode;
}) {
  return (
    <Tag className="sv-card sv-ov-side" aria-labelledby={labelledBy} aria-label={label}>
      {children}
    </Tag>
  );
}

/** A section of the aside (`section.sv-sec.sv-side-sec`). */
export function StSideSection({
  labelledBy,
  children,
}: {
  readonly labelledBy?: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="sv-sec sv-side-sec" aria-labelledby={labelledBy}>
      {children}
    </section>
  );
}

export interface StTextLinkProps {
  readonly href: string;
  /** A fuller name when the words alone are ambiguous: "Open experiment Shell-and-Tube …". */
  readonly ariaLabel?: string;
  /** The chevron after the words (default); `false` for "Help & support" in a message's actions. */
  readonly chevron?: boolean;
  readonly children: ReactNode;
}

/** The indigo text link (`a.sv-link`): "Open experiment ›", "See your progress ›". */
export function StTextLink({ href, ariaLabel, chevron = true, children }: StTextLinkProps) {
  const Link = useLinkComponent();
  return (
    <Link className="sv-link" href={href} aria-label={ariaLabel}>
      {children}
      {chevron ? <Glyph name="chevronRight" /> : null}
    </Link>
  );
}

/**
 * What the experiment teaches (`ol.sv-outcomes`): the Home's own card (`sv-card`) or flat inside
 * the hub Overview's section (`sv-outcomes--flat`).
 */
export function StOutcomes({
  items,
  flat = false,
}: {
  readonly items: readonly string[];
  readonly flat?: boolean;
}) {
  return (
    <ol className={flat ? 'sv-outcomes sv-outcomes--flat' : 'sv-card sv-outcomes'}>
      {items.map((item, index) => (
        <li key={`${index} ${item}`}>{item}</li>
      ))}
    </ol>
  );
}

// ---- List rows ----------------------------------------------------------------------------------

/** A list inside a surface (`ul.sv-list`; rows split by hairlines). */
export function StList({
  label,
  labelledBy,
  children,
}: {
  readonly label?: string;
  readonly labelledBy?: string;
  readonly children: ReactNode;
}) {
  return (
    <ul className="sv-list" aria-label={label} aria-labelledby={labelledBy}>
      {children}
    </ul>
  );
}

export interface StListRowProps {
  /** `experiment` (`sv-xli`: ST-02, ST-03, ST-04) or `assessment` (`sv-ali`, its date lead: ST-11). */
  readonly variant?: 'experiment' | 'assessment';
  /** `div.sv-li-lead`: a resource icon (ST-06), the deadline block (ST-11). */
  readonly lead?: ReactNode;
  /** `div.sv-li-end`: the row's one action. */
  readonly end?: ReactNode;
  /** `div.sv-li-main`: kicker, title, description, meta. */
  readonly children: ReactNode;
}

/** One row (`li.sv-li`: lead · main · end; stacks below a 768 px page). */
export function StListRow({ variant, lead, end, children }: StListRowProps) {
  return (
    <li
      className={joinClasses(
        'sv-li',
        variant === 'experiment' && 'sv-xli',
        variant === 'assessment' && 'sv-ali',
      )}
    >
      {lead === undefined ? null : (
        <div className={joinClasses('sv-li-lead', variant === 'assessment' && 'sv-ali-when')}>
          {lead}
        </div>
      )}
      <div className="sv-li-main">{children}</div>
      {end === undefined ? null : <div className="sv-li-end">{end}</div>}
    </li>
  );
}

/** A row's kicker (`p.sv-li-k`): the course code and course, "Due 14 Nov". */
export function StRowKicker({ children }: { readonly children: ReactNode }) {
  return <p className="sv-li-k">{children}</p>;
}

/** A row's title (`.sv-li-t`, 17/24). */
export function StRowTitle({
  id,
  level = 3,
  children,
}: {
  readonly id?: string;
  readonly level?: 3 | 4;
  readonly children: ReactNode;
}) {
  const Tag = level === 4 ? 'h4' : 'h3';
  return (
    <Tag className="sv-li-t" id={id}>
      {children}
    </Tag>
  );
}

/** A row's description (`p.sv-li-d`; `clamp` keeps it to two lines, `sv-clamp2`). */
export function StRowText({
  clamp = false,
  children,
}: {
  readonly clamp?: boolean;
  readonly children: ReactNode;
}) {
  return <p className={joinClasses('sv-li-d', clamp && 'sv-clamp2')}>{children}</p>;
}

/** A row's meta line (`p.sv-li-m`): the status pill, then plain words. */
export function StRowMeta({ children }: { readonly children: ReactNode }) {
  return <p className="sv-li-m">{children}</p>;
}

// ---- Messages and states ------------------------------------------------------------------------

/** The message icon's tone: none (indigo), `err` (a failure), `paused` (an inactive account). */
export type StMessageTone = 'err' | 'paused';

function messageIconClass(tone: StMessageTone | undefined): string {
  return joinClasses('sv-msg-ico', tone && `sv-msg-ico--${tone}`);
}

export interface StMessageProps {
  readonly icon: V3IconName;
  readonly tone?: StMessageTone;
  readonly title: ReactNode;
  readonly titleId: string;
  /** A failure (`role="alert"`). */
  readonly alert?: boolean;
  readonly description?: ReactNode;
  /** After the description: the new student's steps (ST-01), the experiments list (ST-11). */
  readonly children?: ReactNode;
  /** `a.rb-link.sv-msg-link`: "Help & support", "See your earlier work". */
  readonly link?: { readonly href: string; readonly label: ReactNode };
  /** `button.rb-btn.sv-msg-btn`: "Try again". */
  readonly retry?: { readonly label: ReactNode; readonly onRetry: () => void };
}

/**
 * The compact message (`section.sv-card.sv-msg`): an icon, what this is, one sentence and at most
 * one way on — empty, failed and held pages (ST-01, ST-02, ST-05 Assessment tab, ST-11, ST-15).
 */
export function StMessage({
  icon,
  tone,
  title,
  titleId,
  alert = false,
  description,
  children,
  link,
  retry,
}: StMessageProps) {
  const Link = useLinkComponent();
  return (
    <section
      className="sv-card sv-msg"
      aria-labelledby={titleId}
      role={alert ? 'alert' : undefined}
    >
      <span className={messageIconClass(tone)} aria-hidden="true">
        <Glyph name={icon} />
      </span>
      <div className="sv-msg-main">
        <h2 className="sv-msg-t" id={titleId}>
          {title}
        </h2>
        {description === undefined ? null : <p className="sv-msg-d">{description}</p>}
        {children}
        {link ? (
          <Link className="rb-link sv-msg-link" href={link.href}>
            {link.label}
          </Link>
        ) : null}
        {retry ? (
          <button type="button" className="rb-btn sv-msg-btn" onClick={retry.onRetry}>
            {retry.label}
          </button>
        ) : null}
      </div>
    </section>
  );
}

export interface StStateRowProps {
  readonly icon: V3IconName;
  readonly tone?: 'err';
  readonly title: ReactNode;
  /** `h3` (a failure, nothing attached yet) or `p` (no match), as the export draws each. */
  readonly titleAs?: 'h3' | 'p';
  readonly description: ReactNode;
  /** A failure (`role="alert"`); otherwise a status (`role="status"`). */
  readonly alert?: boolean;
  /** `button.rb-btn`: "Try again", "Clear filters". */
  readonly action?: { readonly label: ReactNode; readonly onClick: () => void };
}

/**
 * A state inside a surface, in place of its rows (`div.sv-pstate.sv-pstate--row`): no match,
 * nothing attached yet, couldn't load + "Try again" (ST-04, ST-06, ST-11, ST-15).
 */
export function StStateRow({
  icon,
  tone,
  title,
  titleAs = 'h3',
  description,
  alert = false,
  action,
}: StStateRowProps) {
  const Title = titleAs;
  return (
    <div className="sv-pstate sv-pstate--row" role={alert ? 'alert' : 'status'}>
      <span className={messageIconClass(tone)} aria-hidden="true">
        <Glyph name={icon} />
      </span>
      <div>
        <Title className="sv-msg-t">{title}</Title>
        <p className="sv-msg-d">{description}</p>
      </div>
      {action ? (
        <button type="button" className="rb-btn" onClick={action.onClick}>
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

export interface StLoadingProps {
  /** What is loading, announced: "Loading your courses…". */
  readonly label: ReactNode;
  /**
   * `card` — a surface of its own (`section.sv-card.sv-loading`, named by `name`; ST-02);
   * `inline` — inside a surface (`div.sv-loading`; ST-06, ST-11); `panel` — the progress surface's
   * (`div.sv-pstate` + `sv-pskel`; ST-15).
   */
  readonly variant?: 'card' | 'inline' | 'panel';
  /** The card's name (`aria-label`): the page it stands for ("My courses"). */
  readonly name?: string;
}

/** Loading: the words in a status region and three skeleton bars, hidden from screen readers. */
export function StLoading({ label, variant = 'inline', name }: StLoadingProps) {
  const bars = (
    <div className={variant === 'panel' ? 'sv-pskel' : 'sv-skel'} aria-hidden="true">
      <span className="rk-skel" />
      <span className="rk-skel" />
      <span className="rk-skel" />
    </div>
  );
  const message = (
    <p className="rk-loading-msg" role="status">
      {label}
    </p>
  );
  if (variant === 'card') {
    return (
      <section className="sv-card sv-loading" aria-busy="true" aria-label={name}>
        {message}
        {bars}
      </section>
    );
  }
  return (
    <div className={variant === 'panel' ? 'sv-pstate' : 'sv-loading'} aria-busy="true">
      {message}
      {bars}
    </div>
  );
}

/**
 * A hold said once (`p.sv-holdnote`): a pause or a licence wait above the formats (ST-10, ST-15);
 * `inTab` is ST-10's place under the card head (`sv-ptab-note`).
 */
export function StHoldNote({
  icon,
  inTab = false,
  children,
}: {
  readonly icon: V3IconName;
  readonly inTab?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <p className={joinClasses('sv-holdnote', inTab && 'sv-ptab-note')}>
      <Glyph name={icon} />
      <span>{children}</span>
    </p>
  );
}

// ---- The compact refusal ------------------------------------------------------------------------

export interface StRefuseItem {
  readonly key: string;
  /** The format chip before the words (a format the Student can still use). */
  readonly chip?: StFormatChipProps;
  /** The bold first line: "Web simulation", the experiment's name. */
  readonly title: ReactNode;
  /** Screen-reader words after the title: " (WEB)". */
  readonly srTitle?: string;
  /** The quiet second line: "In progress · saved 12 Oct", the course. */
  readonly meta: ReactNode;
  readonly link?: { readonly href: string; readonly label: ReactNode; readonly ariaLabel?: string };
}

export interface StRefuseProps {
  /** The date line before the card (`p.rb-eyebrow-date`; the top bar shows it on wider pages). */
  readonly date?: ReactNode;
  readonly icon: V3IconName;
  /** The greyed icon (`sv-refuse-ico--off`): not given, ended, not published. */
  readonly off?: boolean;
  /** What this is about (`p.sv-refuse-k`): the experiment, "Shell-and-Tube … · Simulation". */
  readonly kicker?: ReactNode;
  /** The page's one H1 (`h1.sv-refuse-t`, focus target). */
  readonly title: ReactNode;
  readonly titleId: string;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  readonly description: ReactNode;
  /** What the Student can still do here (`div.sv-refuse-alt`): only what exists. */
  readonly alt?: {
    readonly title: ReactNode;
    readonly titleId: string;
    readonly items: readonly StRefuseItem[];
  };
  /** The ways on (`div.sv-refuse-act`): kit `ButtonLink`s, then the Help link. */
  readonly actions?: ReactNode;
  /** "Help & support" (`a.sv-link`, no chevron), last. */
  readonly help?: { readonly href: string; readonly label: ReactNode };
}

/**
 * The Student's refusal page (`section.sv-card.sv-refuse`): ST-19 not available, ST-03 course
 * none, ST-09 AR / MR, ST-16 feedback not open, ST-18 My device not available, no assessment, the
 * withheld ST-14 result. The card is named by its H1.
 */
export function StRefuse({
  date,
  icon,
  off = false,
  kicker,
  title,
  titleId,
  titleRef,
  description,
  alt,
  actions,
  help,
}: StRefuseProps) {
  const Link = useLinkComponent();
  return (
    <>
      {date === undefined ? null : <p className="rb-eyebrow-date">{date}</p>}
      <section className="sv-card sv-refuse" aria-labelledby={titleId}>
        <span
          className={joinClasses('sv-refuse-ico', off && 'sv-refuse-ico--off')}
          aria-hidden="true"
        >
          <Glyph name={icon} />
        </span>
        <div className="sv-refuse-main">
          {kicker === undefined ? null : <p className="sv-refuse-k">{kicker}</p>}
          <h1 ref={titleRef} className="sv-refuse-t" id={titleId} tabIndex={-1}>
            {title}
          </h1>
          <p className="sv-refuse-d">{description}</p>
          {alt && alt.items.length > 0 ? (
            <div className="sv-refuse-alt">
              <h2 className="sv-subk" id={alt.titleId}>
                {alt.title}
              </h2>
              <ul className="sv-refuse-list" aria-labelledby={alt.titleId}>
                {alt.items.map((item) => (
                  <li key={item.key}>
                    {item.chip ? <StFormatChip {...item.chip} /> : null}
                    <p className="sv-refuse-row">
                      <b>
                        {item.title}
                        {item.srTitle ? <span className="xr-sr">{item.srTitle}</span> : null}
                      </b>
                      <span>{item.meta}</span>
                    </p>
                    {item.link ? (
                      <StTextLink href={item.link.href} ariaLabel={item.link.ariaLabel}>
                        {item.link.label}
                      </StTextLink>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {actions === undefined && !help ? null : (
            <div className="sv-refuse-act">
              {actions}
              {help ? (
                <Link className="sv-link" href={help.href}>
                  {help.label}
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// ---- Record head and section tabs ---------------------------------------------------------------

export interface StRecordHeadProps {
  /** Before the head: the kit's `Breadcrumbs`. */
  readonly breadcrumbs?: ReactNode;
  /** `p.rb-eyebrow-date` (phones; the top bar shows it on wider pages). */
  readonly date?: ReactNode;
  /**
   * The eyebrow's lead (`p.rk-eyebrow.st-eyecode`): the course code (kit `InstitutionCode`,
   * `span.rk-owncode`; ST-03, the hub) or the format chip (ST-08, ST-09, ST-16).
   */
  readonly lead: ReactNode;
  /** The eyebrow's words after the lead: "Course · Mechanical Engineering", the experiment. */
  readonly context: ReactNode;
  /** The record's H1 (`h1.rk-title`, focus target). */
  readonly title: ReactNode;
  readonly titleId?: string;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** `p.rk-sub` under the title (ST-16 "Your feedback helps …"). */
  readonly sub?: ReactNode;
  /** `div.rk-meta`: the status pill, then plain facts. */
  readonly meta?: ReactNode;
  /** ST-03's meta row (`sv-head-meta`). */
  readonly wideMeta?: boolean;
}

/**
 * A record page's head with its code eyebrow (`div.rk-head` … `p.rk-eyebrow.st-eyecode`): ST-03
 * Course, the experiment hub, ST-08 / ST-09 format pages, ST-16 feedback.
 */
export function StRecordHead({
  breadcrumbs,
  date,
  lead,
  context,
  title,
  titleId,
  titleRef,
  sub,
  meta,
  wideMeta = false,
}: StRecordHeadProps) {
  return (
    <>
      {breadcrumbs}
      <div className="rk-head">
        <div className="rk-head-text">
          {date === undefined ? null : <p className="rb-eyebrow-date">{date}</p>}
          <p className="rk-eyebrow st-eyecode">
            {lead}
            <span>{context}</span>
          </p>
          <h1 ref={titleRef} className="rk-title" id={titleId} tabIndex={-1}>
            {title}
          </h1>
          {sub === undefined ? null : <p className="rk-sub">{sub}</p>}
          {meta === undefined ? null : (
            <div className={joinClasses('rk-meta', wideMeta && 'sv-head-meta')}>{meta}</div>
          )}
        </div>
      </div>
    </>
  );
}

export interface StTab {
  /** What `onSelect` is given (the `href` when left out); also the list key. */
  readonly key?: string;
  readonly href: string;
  readonly label: ReactNode;
  readonly current?: boolean;
  /** A count after the words (`span.st-tabn`, read as ", N"); hidden while loading or failed. */
  readonly count?: number;
}

/**
 * Section tabs (`nav.rk-tabs.sv-tabs`; links, the page's tab `aria-current="page"`): the hub's
 * five sections (`chips`: they wrap as chips below 480 px) and ST-11's To do · Submitted · Results
 * with their counts. `onSelect` (opt-in, ST-11) keeps the choice on the page — a plain click calls
 * it with the tab's `key` instead of following the link (a modified click still opens the link);
 * without it the links navigate.
 */
export function StTabs({
  label,
  tabs,
  chips = false,
  onSelect,
}: {
  readonly label: string;
  readonly tabs: readonly StTab[];
  readonly chips?: boolean;
  readonly onSelect?: (key: string) => void;
}) {
  const Link = useLinkComponent();
  const navRef = useRef<HTMLElement>(null);
  if (tabs.filter((tab) => tab.current).length > 1) {
    throw new Error('StTabs: at most one tab is current.');
  }
  const currentHref = tabs.find((tab) => tab.current)?.href;
  useLayoutEffect(() => {
    scrollCurrentIntoView(navRef.current, '[aria-current="page"]');
  }, [currentHref]);
  return (
    <nav
      ref={navRef}
      className={joinClasses('rk-tabs', 'sv-tabs', chips && 'sv-tabs--chips')}
      aria-label={label}
    >
      {tabs.map((tab) => (
        <Link
          key={tab.key ?? tab.href}
          className="rk-tab"
          href={tab.href}
          aria-current={tab.current ? 'page' : undefined}
          onClick={
            onSelect
              ? (event: MouseEvent<HTMLAnchorElement>) => {
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                  event.preventDefault();
                  onSelect(tab.key ?? tab.href);
                }
              : undefined
          }
        >
          {tab.label}
          {tab.count === undefined ? null : (
            <>
              <span className="st-tabn" aria-hidden="true">
                {tab.count}
              </span>
              <span className="xr-sr">, {tab.count}</span>
            </>
          )}
        </Link>
      ))}
    </nav>
  );
}

// ---- Formats not available to the Student --------------------------------------------------------

export interface StOffRow {
  readonly code: FormatCode;
  /** `pub` (published, not in the institution's access) or `none` (not published). */
  readonly kind: StFormatKind;
  /** "Augmented reality". */
  readonly name: string;
  /** "Published for this experiment, not included in your institution’s access". */
  readonly reason: ReactNode;
}

/**
 * "Not available to you" (`ul.sv-xrows`): each format with its bare chip, its name and the reason
 * (ST-05 Overview, ST-07, ST-10, ST-15). Named by the sub-heading before it.
 */
export function StOffRows({
  labelledBy,
  rows,
}: {
  readonly labelledBy: string;
  readonly rows: readonly StOffRow[];
}) {
  return (
    <ul className="sv-xrows" aria-labelledby={labelledBy}>
      {rows.map((row) => (
        <li key={row.code} className="sv-xrow">
          <span className="sv-xrow-b" aria-hidden="true">
            <StFormatChip code={row.code} kind={row.kind} glyph={null} hidden={false} />
          </span>
          <p className="sv-xrow-t">
            <b>{row.name}</b>
            <span className="xr-sr"> ({row.code}), </span>
            <span className="sv-frow-sep" aria-hidden="true">
              {' · '}
            </span>
            <span className="sv-xrow-r">{row.reason}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}

// ---- Per-format progress (the export's `progExp`: ST-10 and ST-15) ------------------------------

/**
 * One experiment's progress block: ST-15's `article.sv-pexp` (named by its head, which the
 * progress group draws) or ST-10's flat block in the tab's card (`div.sv-pexp.sv-pexp--flat`).
 */
export function StProgressBlock({
  flat = false,
  labelledBy,
  children,
}: {
  readonly flat?: boolean;
  readonly labelledBy?: string;
  readonly children: ReactNode;
}) {
  if (flat) return <div className="sv-pexp sv-pexp--flat">{children}</div>;
  return (
    <article className="sv-pexp" aria-labelledby={labelledBy}>
      {children}
    </article>
  );
}

export interface StProgressColumns {
  /** "Your format". */
  readonly format: string;
  /** "Progress". */
  readonly progress: string;
  /** "Details". */
  readonly details: string;
  /** "Action" (read by screen readers only). */
  readonly action: string;
}

export interface StProgressRow {
  readonly key: string;
  readonly chip: StFormatChipProps;
  /** "Web simulation". */
  readonly name: string;
  /** "Available to you", "Paused", "Waiting for a licence". */
  readonly access: ReactNode;
  readonly status: { readonly tone: StatusTone; readonly words: ReactNode };
  /** "First opened 12 Oct 2026, 10:04", "Last saved …", "Feedback sent …". */
  readonly facts: readonly string[];
  /** The row's actions (kit `ButtonLink`s): "Continue WEB", "Give feedback on WEB". */
  readonly actions?: ReactNode;
}

/**
 * The per-format table (`table.sv-ptable`): format, progress, details, action — two-column rows
 * below a 766 px container and one column below 480. Each format has its own progress; no overall
 * percentage.
 */
export function StProgressTable({
  caption,
  columns,
  rows,
}: {
  readonly caption: string;
  readonly columns: StProgressColumns;
  readonly rows: readonly StProgressRow[];
}) {
  return (
    <table className="sv-ptable">
      <caption className="xr-sr">{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{columns.format}</th>
          <th scope="col">{columns.progress}</th>
          <th scope="col">{columns.details}</th>
          <th scope="col">
            <span className="xr-sr">{columns.action}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key}>
            <th scope="row" className="sv-pc-f">
              <span className="sv-pc-fx">
                <StFormatChip {...row.chip} />
                <span className="sv-pc-name">
                  <b>{row.name}</b>
                  <span className="xr-sr"> ({row.chip.code})</span>
                  <span className="sv-pc-acc">{row.access}</span>
                </span>
              </span>
            </th>
            <td className="sv-pc-p">
              <StatusPill tone={row.status.tone}>{row.status.words}</StatusPill>
            </td>
            <td className="sv-pc-d">
              {row.facts.map((fact, index) => (
                <span key={`${index} ${fact}`} className="sv-pc-fact">
                  {fact}
                </span>
              ))}
            </td>
            <td className="sv-pc-x">{row.actions}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** The block's "Not available to you" part (`div.sv-poff`: sub-heading + rows). */
export function StProgressOff({
  title,
  titleId,
  level = 3,
  rows,
}: {
  readonly title: ReactNode;
  readonly titleId: string;
  /** ST-10 `h3`; ST-15 `h5` (under its course `h3` and experiment `h4`). */
  readonly level?: 3 | 5;
  readonly rows: readonly StOffRow[];
}) {
  return (
    <div className="sv-poff">
      <StSubheading id={titleId} level={level}>
        {title}
      </StSubheading>
      <StOffRows labelledBy={titleId} rows={rows} />
    </div>
  );
}

/** The block's assessment line (`p.sv-pas`): "Assessment · To do, due 14 Nov · Open assessment ›". */
export function StAssessmentLine({
  label,
  children,
  link,
}: {
  /** "Assessment". */
  readonly label: ReactNode;
  readonly children: ReactNode;
  readonly link?: { readonly href: string; readonly label: ReactNode };
}) {
  return (
    <p className="sv-pas">
      <span className="sv-pas-k">{label}</span>
      <span>{children}</span>
      {link ? <StTextLink href={link.href}>{link.label}</StTextLink> : null}
    </p>
  );
}

// ---- How-to steps ---------------------------------------------------------------------------------

export interface StHowToStep {
  readonly key: string;
  readonly title: ReactNode;
  readonly detail: ReactNode;
}

/**
 * Numbered steps with a line each (`ol.sv-howto`): ST-09's headset set-up (the service's steps,
 * `id` for its disclosure) and ST-18's "How a transfer works" (`device`: `sv-devhow`).
 */
export function StHowTo({
  id,
  device = false,
  steps,
}: {
  readonly id?: string;
  readonly device?: boolean;
  readonly steps: readonly StHowToStep[];
}) {
  return (
    <ol className={joinClasses('sv-howto', device && 'sv-devhow')} id={id}>
      {steps.map((step, index) => (
        <li key={step.key}>
          <span className="sv-how-n" aria-hidden="true">
            {index + 1}
          </span>
          <div>
            <p className="sv-howto-t">{step.title}</p>
            <p className="sv-howto-d">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
