'use client';

import type { MouseEvent, ReactNode, Ref } from 'react';

import type { FormatCode } from '../icons/registry.js';
import { joinClasses } from '../internal/classes.js';
import { Button, ButtonLink, type ButtonLinkProps, type ButtonProps } from './actions.js';
import { CourseCode } from './codes.js';
import { FORMAT_ORDER } from './formats.js';
import { Glyph, V3_ICON_PATHS, type V3IconName } from './icons.js';

/*
 * What more than one Content Manager screen group draws (`cm-` classes; the owner-approved Content
 * Manager export, design/v3-refined-b/roles/CM-v1, `project/cm.css` and its
 * COMPONENT-EXTENSIONS.md A, D, F, J and 7): the stage track, the version change, the identity
 * band with its facts and track, the group head with its count, and the small pieces (the format
 * badges, course name, in-cell label, Changed tag, full-width aside actions, Your step, the quoted
 * note). Markup as the
 * export's `Main.dc.html` draws them on CM-01, CM-02, CM-03, CM-05, CM-08 and CM-09. What one
 * screen group alone draws is in `cm-lists.tsx`, `cm-decision.tsx` and `cm-correction.tsx`. Every
 * word, figure, date and destination comes from the caller.
 */

// ---- A. Stage track -----------------------------------------------------------------------------

/**
 * A stage's state (the export's `flowSteps`): `done`, `you` (the Content Manager's step, gold),
 * `now` (someone else holds it), `back` (returned), `held` (on hold), `off` (closed: a withdrawn
 * correction, dashed and muted) or `next` (not reached; its number instead of an icon).
 */
export type CmStepState = 'done' | 'you' | 'now' | 'back' | 'held' | 'off' | 'next';

/** The state in words before each stage, for screen readers ("Done: ", "Your step, now: ", …). */
export type CmStepStateWords = Readonly<Record<CmStepState, string>>;

export interface CmStep {
  readonly key: string;
  /** Who holds the stage (`p.cm-step-k`): "Academic Reviewer". */
  readonly who: ReactNode;
  /** What the stage is (`p.cm-step-t`): "Publication decision". */
  readonly what: ReactNode;
  /** When, or what it waits for (`p.cm-step-d`): "Waiting since 27 Aug"; left out when null. */
  readonly when?: ReactNode;
  readonly state: CmStepState;
  /** The dot's glyph instead of the state's own (a draft or returned correction: `edit`). */
  readonly icon?: V3IconName;
}

const STEP_CLASS: Readonly<Record<CmStepState, string | null>> = {
  done: 'is-done',
  you: 'is-you',
  now: 'is-now',
  back: 'is-back',
  held: 'is-held',
  off: 'is-off',
  next: null,
};

/** The export's `ICO` (`cmi-check`, `cmi-upload`, `cmi-clock`, `cmi-refresh`, `cmi-pause`, `cmi-ended`). */
const STEP_ICON: Readonly<Record<CmStepState, V3IconName | null>> = {
  done: 'check',
  you: 'readyToPublish',
  now: 'clock',
  back: 'updates',
  held: 'pauseCircle',
  off: 'ended',
  next: null,
};

const LIVE_STATES: readonly CmStepState[] = ['you', 'now', 'back', 'held'];

/** The current stage: the Content Manager's own, else the first one someone holds (`curAt`). */
function currentIndex(steps: readonly CmStep[]): number {
  const yours = steps.findIndex((step) => step.state === 'you');
  return yours >= 0 ? yours : steps.findIndex((step) => LIVE_STATES.includes(step.state));
}

export interface CmStageListProps {
  /** The list's name (`ol[aria-label]`): "Where this submission is". */
  readonly label: string;
  readonly steps: readonly CmStep[];
  readonly stateWords: CmStepStateWords;
  /**
   * "Your step" (`span.cm-you`) under the `you` stage — the full track only (CM-03, CM-08 detail);
   * the mini tracks draw none.
   */
  readonly youLabel?: ReactNode;
  /** `cm-flow--mini` (CM-05 band, CM-08 list): smaller dots, who · what on one line on phones. */
  readonly mini?: boolean;
}

/**
 * One item's journey as numbered stages (`ol.cm-flow`): each stage's dot (its state's glyph, or
 * its number while not reached), who, what and when; the current stage `aria-current="step"`.
 */
export function CmStageList({
  label,
  steps,
  stateWords,
  youLabel,
  mini = false,
}: CmStageListProps) {
  const current = currentIndex(steps);
  return (
    <ol className={joinClasses('cm-flow', mini && 'cm-flow--mini')} aria-label={label}>
      {steps.map((step, index) => {
        const icon = step.icon ?? STEP_ICON[step.state];
        return (
          <li
            key={step.key}
            className={joinClasses('cm-step', STEP_CLASS[step.state])}
            aria-current={index === current ? 'step' : 'false'}
          >
            <span className="cm-step-dot" aria-hidden="true">
              {icon ? (
                <svg viewBox="0 0 24 24">
                  <path d={V3_ICON_PATHS[icon]} />
                </svg>
              ) : (
                String(index + 1)
              )}
            </span>
            <p className="cm-step-k">
              <span className="xr-sr">{stateWords[step.state]}</span>
              {step.who}
            </p>
            <p className="cm-step-t">{step.what}</p>
            {step.when != null && step.when !== '' ? (
              <p className="cm-step-d">{step.when}</p>
            ) : null}
            {youLabel && step.state === 'you' ? <span className="cm-you">{youLabel}</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

export interface CmStageTrackProps extends CmStageListProps {
  /**
   * Where the track sits: `band` (`div.cm-idflow.cm-flowwrap`, the identity band of CM-03 and the
   * CM-08 detail), `tracker` (`div.cm-trk-flow.cm-flowwrap`, a CM-08 list card) or `plain`
   * (`div.cm-flowwrap`, inside `CmIdentityTrack` on CM-05).
   */
  readonly placement?: 'band' | 'tracker' | 'plain';
}

/** The stage track in its container (`div.cm-flowwrap`, container `cmflow`: vertical below 560 px). */
export function CmStageTrack({ placement = 'plain', ...list }: CmStageTrackProps) {
  return (
    <div
      className={joinClasses(
        placement === 'band' && 'cm-idflow',
        placement === 'tracker' && 'cm-trk-flow',
        'cm-flowwrap',
      )}
    >
      <CmStageList {...list} />
    </div>
  );
}

// ---- D. Version change --------------------------------------------------------------------------

/** `live` (green, what is live), `new` (dashed indigo, proposed) or `old` (struck through). */
export type CmVersionKind = 'live' | 'new' | 'old';

export interface CmVersionLabel {
  /** "1.2 live", "1.3 proposed", "1.0", "1.1 withdrawn", "No version label yet". */
  readonly text: ReactNode;
  readonly kind: CmVersionKind;
}

export interface CmVersionChangeProps {
  readonly from: CmVersionLabel;
  /** What the change leads to, after the arrow; none on the published record's own status line. */
  readonly to?: CmVersionLabel;
}

const VERSION_CLASS: Readonly<Record<CmVersionKind, string>> = {
  live: 'cm-ver-live',
  new: 'cm-ver-new',
  old: 'cm-ver-old',
};

/** What is live and what is proposed, released or withdrawn (`span.cm-ver`). */
export function CmVersionChange({ from, to }: CmVersionChangeProps) {
  return (
    <span className="cm-ver">
      <span className={VERSION_CLASS[from.kind]}>{from.text}</span>
      {to ? (
        <>
          <Glyph name="chevronRight" />
          <span className={VERSION_CLASS[to.kind]}>{to.text}</span>
        </>
      ) : null}
    </span>
  );
}

// ---- J. Identity band ---------------------------------------------------------------------------

export interface CmIdentityFact {
  readonly key?: string;
  readonly term: ReactNode;
  readonly value: ReactNode;
  /** `dd.is-quiet`: a value that says there is none yet ("None yet", "Not set yet"). */
  readonly quiet?: boolean;
}

export interface CmIdentityBandProps {
  /** Before the band: the breadcrumb trail (`Breadcrumbs`). */
  readonly breadcrumbs?: ReactNode;
  /** Before the band: today's date on phones (`p.rb-eyebrow-date`), from the application's clock. */
  readonly date?: ReactNode;
  /** The record kind above the name (`p.rk-eyebrow`): "SUB-0077 · First publication". */
  readonly eyebrow: ReactNode;
  /** The page's H1 (`h1.rb-id-name`, `tabindex=-1`). */
  readonly title: ReactNode;
  readonly titleId: string;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /**
   * The status line (`div.rb-id-status`): the large status pill, then its facts — "From …"
   * (a plain span), `CmCourseName`, `CmVersionChange`.
   */
  readonly status: ReactNode;
  /**
   * `decision` (CM-03): the text column as the kit's, the facts two-up below 760 px, "Go to" beside
   * the text. `record` (CM-05, CM-08 detail): the text column grows and shrinks (`cm-idtext`) so the
   * actions stay at the top right; the first and last facts take the full width on a phone
   * (`cm-idfacts--ends`); the actions and "Go to" in `div.rb-id-act`.
   */
  readonly variant?: 'decision' | 'record';
  /** The band's actions (`ButtonLink`s), at most one primary. */
  readonly actions?: ReactNode;
  /**
   * "Go to decision" / "Go to corrections" / "Go to actions" (`a.rb-btn.rk-goto`, shown under
   * 860 px of page width). With `focusId` (the panel heading's id) it scrolls to the panel and
   * moves focus to that heading, as the kit's page head does; without it, a plain in-page link.
   */
  readonly goTo?: { readonly label: string; readonly targetId: string; readonly focusId?: string };
  /** The record's facts (`dl.cm-idfacts`), four across. */
  readonly facts: readonly CmIdentityFact[];
  /** The stage track: `CmStageTrack placement="band"`, or `CmIdentityTrack` (CM-05). */
  readonly track?: ReactNode;
}

/** "Go to …" with a heading to focus: scroll the panel into view, then focus its heading. */
function goInPanel(
  event: MouseEvent<HTMLAnchorElement>,
  goTo: { readonly targetId: string; readonly focusId?: string },
) {
  const document = event.currentTarget.ownerDocument;
  const panel = document.getElementById(goTo.targetId);
  const heading = goTo.focusId ? document.getElementById(goTo.focusId) : null;
  if (!panel || !heading) return;
  event.preventDefault();
  panel.scrollIntoView({ block: 'start' });
  if (!heading.hasAttribute('tabindex')) heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
}

/**
 * A record's identity band (`section.rb-id.cm-idband`, kit `rb-id` with the CM extension): the
 * record kind, its name (the page's H1), the status line, the actions, the facts and the stage
 * track (CM-03, CM-05, CM-08 detail).
 */
export function CmIdentityBand({
  breadcrumbs,
  date,
  eyebrow,
  title,
  titleId,
  titleRef,
  status,
  variant = 'decision',
  actions,
  goTo,
  facts,
  track,
}: CmIdentityBandProps) {
  const record = variant === 'record';
  const goToLink = goTo ? (
    <a
      className="rb-btn rk-goto"
      href={`#${goTo.targetId}`}
      onClick={goTo.focusId ? (event) => goInPanel(event, goTo) : undefined}
    >
      {goTo.label}
    </a>
  ) : null;
  return (
    <>
      {breadcrumbs}
      {date ? <p className="rb-eyebrow-date">{date}</p> : null}
      <section className="rb-id cm-idband" aria-labelledby={titleId}>
        <div className="rb-id-top">
          <div className={joinClasses('rb-id-text', record && 'cm-idtext')}>
            <p className="rk-eyebrow">{eyebrow}</p>
            <h1 ref={titleRef} className="rb-id-name" id={titleId} tabIndex={-1}>
              {title}
            </h1>
            <div className="rb-id-status">{status}</div>
          </div>
          {record ? (
            actions || goToLink ? (
              <div className="rb-id-act">
                {actions}
                {goToLink}
              </div>
            ) : null
          ) : (
            <>
              {actions ? <div className="rb-id-act">{actions}</div> : null}
              {goToLink}
            </>
          )}
        </div>
        <dl className={joinClasses('cm-idfacts', record && 'cm-idfacts--ends')}>
          {facts.map((fact, index) => (
            <div key={fact.key ?? index}>
              <dt>{fact.term}</dt>
              <dd className={fact.quiet ? 'is-quiet' : undefined}>{fact.value}</dd>
            </div>
          ))}
        </dl>
        {track}
      </section>
    </>
  );
}

export interface CmIdentityTrackProps {
  /** "Correction in progress" (`p.cm-idflow-t`). */
  readonly title: ReactNode;
  /** The correction's status pill and its version change, beside the title. */
  readonly status: ReactNode;
  /** The mini track: `CmStageTrack mini` (placement `plain`). */
  readonly children: ReactNode;
}

/** The open correction in the published record's band (`div.cm-idflow` > `div.cm-idflow-h`; CM-05). */
export function CmIdentityTrack({ title, status, children }: CmIdentityTrackProps) {
  return (
    <div className="cm-idflow">
      <div className="cm-idflow-h">
        <p className="cm-idflow-t">{title}</p>
        {status}
      </div>
      {children}
    </div>
  );
}

// ---- F. Group head with count -------------------------------------------------------------------

export interface CmGroupHeadProps {
  readonly title: ReactNode;
  readonly titleId: string;
  /** The count after the title (`span.cm-grp-n`). */
  readonly count?: ReactNode;
  /** The count in gold (`is-you`): the group that needs the Content Manager. */
  readonly countYou?: boolean;
  /** The quiet line (`p.rb-note`): "Kept with their history". */
  readonly note?: ReactNode;
  /**
   * `section` (`h2.rb-h2`, CM-08 list) or `side` (`h2.cm-sidecard-t`, the CM-01 "With others" side
   * card). The export draws the side head with inline spacing — 8 px under the head
   * (`rk-x-grp-head-side`), none under the title (`rk-x-sidecard-t-flush`), V3P-14.
   */
  readonly variant?: 'section' | 'side';
}

/** A group's head with its count and note (`div.cm-grp-head`). */
export function CmGroupHead({
  title,
  titleId,
  count,
  countYou = false,
  note,
  variant = 'section',
}: CmGroupHeadProps) {
  const side = variant === 'side';
  return (
    <div className={joinClasses('cm-grp-head', side && 'rk-x-grp-head-side')}>
      <h2 className={side ? 'cm-sidecard-t rk-x-sidecard-t-flush' : 'rb-h2'} id={titleId}>
        {title}
        {count != null ? (
          <span className={joinClasses('cm-grp-n', countYou && 'is-you')}>{count}</span>
        ) : null}
      </h2>
      {note ? <p className="rb-note">{note}</p> : null}
    </div>
  );
}

// ---- 7. Small pieces ----------------------------------------------------------------------------

export interface CmFormatBadgesProps {
  /** The formats, drawn in the foundation's order (WEB, AR, VR, MR) as compact solid badges. */
  readonly formats: readonly FormatCode[];
  /** What the badges mean, read instead of the codes: "Formats: WEB, VR" (visually hidden). */
  readonly label: string;
}

/**
 * The format badges where the export sets `margin-top: 0` inline on `span.rk-fmts`
 * (`rk-x-fmts-flush`, V3P-14): the catalogue entry's "Available in" (CM-03, CM-05) and a row of
 * the Content library (CM-04). The kit's `FormatBadges` markup otherwise (`xr-sr` words, then the
 * `xr-fmt` badges hidden from assistive technology).
 */
export function CmFormatBadges({ formats, label }: CmFormatBadgesProps) {
  const ordered = [...new Set(formats)].sort(
    (left, right) => FORMAT_ORDER.indexOf(left) - FORMAT_ORDER.indexOf(right),
  );
  return (
    <span className="rk-fmts rk-x-fmts-flush">
      <span className="xr-sr">{label}</span>
      {ordered.map((format) => (
        <span key={format} className="xr-fmt" aria-hidden="true">
          {format}
        </span>
      ))}
    </span>
  );
}

export interface CmCourseNameProps {
  /** The platform course code chip (`span.rk-code`); none when the course has no code. */
  readonly code?: string | null;
  readonly name: ReactNode;
}

/** A course as a status line or card meta names it (`span.cm-fmtname`): code chip, then name. */
export function CmCourseName({ code, name }: CmCourseNameProps) {
  return (
    <span className="cm-fmtname">
      {code ? <CourseCode code={code} /> : null}
      {name}
    </span>
  );
}

export interface CmInLabelProps {
  readonly children: ReactNode;
  /**
   * A field's visible label on phones (`span.rk-label.cm-inlabel[aria-hidden]`, CM-09 codes: the
   * input carries its own name); else a value's label (`span.cm-inlabel`), screen-reader-only on
   * wide pages and visible where its table or list stacks.
   */
  readonly field?: boolean;
}

/** The label a table cell or list value shows when its row stacks (`span.cm-inlabel`). */
export function CmInLabel({ children, field = false }: CmInLabelProps) {
  return field ? (
    <span className="rk-label cm-inlabel" aria-hidden="true">
      {children}
    </span>
  ) : (
    <span className="cm-inlabel">{children}</span>
  );
}

export interface CmTagProps {
  readonly children: ReactNode;
  readonly id?: string;
  /** A glyph before the words (CM-09 "Changed — not saved yet": `edit`). */
  readonly icon?: V3IconName;
}

/** The indigo tag of a changed field (`span.cm-tag`): "Changed". */
export function CmTag({ children, id, icon }: CmTagProps) {
  return (
    <span className="cm-tag" id={id}>
      {icon ? <Glyph name={icon} /> : null}
      {children}
    </span>
  );
}

/** A full-width action in a decision panel or aside (`button.rb-btn.cm-wide`): "Save draft". */
export function CmWideButton(props: Omit<ButtonProps, 'className' | 'block'>) {
  return <Button {...props} className="cm-wide" />;
}

/** A full-width destination in a decision panel or aside (`a.rb-btn.cm-wide`). */
export function CmWideLink(props: Omit<ButtonLinkProps, 'className' | 'block'>) {
  return <ButtonLink {...props} className="cm-wide" />;
}

/** "Your step" in gold (`span.cm-you`): a pipeline tile the Content Manager acts on (CM-01). */
export function CmYouBadge({ children }: { readonly children: ReactNode }) {
  return <span className="cm-you">{children}</span>;
}

export interface CmQuoteProps {
  /** The words, quoted: "“The proposed description says slip falls …”". */
  readonly quote: ReactNode;
  /** Who and when (`footer`): "Prof. A. Menon, Academic Reviewer · 26 Aug". */
  readonly by: ReactNode;
  /** In a CM-08 list card (`cm-trk-note`). */
  readonly tracker?: boolean;
}

/** A reviewer's, Super Admin's or own reason under a row (`blockquote.cm-orow-q`; CM-01, CM-08). */
export function CmQuote({ quote, by, tracker = false }: CmQuoteProps) {
  return (
    <blockquote className={joinClasses('cm-orow-q', tracker && 'cm-trk-note')}>
      <p>{quote}</p>
      <footer>{by}</footer>
    </blockquote>
  );
}
