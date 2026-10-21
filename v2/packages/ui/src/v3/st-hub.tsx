'use client';

import type { ReactNode, Ref } from 'react';

import { joinClasses } from '../internal/classes.js';
import { useLinkComponent } from '../link.js';
import { Button } from './actions.js';
import { Glyph, Icon, type V3IconName } from './icons.js';
import { StatusPill, type StatusTone } from './status.js';
import {
  StFormatChip,
  type StFormatChipProps,
  StHowTo,
  type StHowToStep,
  StListRow,
} from './st.js';

/*
 * What the Student hub group alone draws (owner-approved export design/v3-refined-b/roles/ST-v1,
 * `project/StudentFinal.dc.html` — the hub head's tabs and the Overview, ST-06 Resources, ST-07
 * Simulation, ST-10 Progress, ST-08 / ST-09 format pages — and `project/v3-student-final.css`):
 * the Overview's main card, its sections and format rows, the aside's sections with the "Next
 * step" tag; the resource list's row, status and held line; the format chooser's cards; the
 * Progress tab's card; the launch surface (its error notice, its actions, the authorised
 * headset, the setup disclosure, the help foot) and the "About" aside. Markup as the export's
 * template draws it; every word, date, figure and destination comes from the caller. No stage
 * tracker is drawn (lead decision 1: the sample activity's stages are illustrative, not product
 * data). What more than one Student group draws is `st.tsx`.
 */

// ---- Small pieces --------------------------------------------------------------------------------

/** The "Next step" tag (`span.sv-tag`) beside the item whose action is the experiment's next step. */
export function StHubNextTag({ children }: { readonly children: ReactNode }) {
  return <span className="sv-tag">{children}</span>;
}

/** An action drawn as a button (`a.rb-btn`, `rb-btn--primary` for the view's one next action). */
export interface StHubAction {
  readonly href: string;
  readonly label: ReactNode;
  /** The fuller name: "Continue WEB, Shell-and-Tube Heat Exchanger". */
  readonly ariaLabel?: string;
  readonly primary?: boolean;
}

function ActionLink({
  action,
  className,
}: {
  readonly action: StHubAction;
  readonly className?: string;
}) {
  const Link = useLinkComponent();
  return (
    <Link
      className={joinClasses('rb-btn', action.primary && 'rb-btn--primary', className)}
      href={action.href}
      aria-label={action.ariaLabel}
    >
      {action.label}
    </Link>
  );
}

// ---- ST-05 Overview ------------------------------------------------------------------------------

/** The Overview's main surface (`div.sv-card.sv-ov-main`): about, what you learn, formats. */
export function StHubMain({ children }: { readonly children: ReactNode }) {
  return <div className="sv-card sv-ov-main">{children}</div>;
}

export interface StHubAboutProps {
  /** The section's name for screen readers (`h2.xr-sr`): "About this experiment". */
  readonly title: ReactNode;
  readonly titleId: string;
  /** The experiment's description (`p.sv-lead`). */
  readonly description: ReactNode;
  /** The engineering area (`p.sv-meta`, first). */
  readonly area?: ReactNode;
  /** The BITS course code with its label ("BITS course code", `span.rb-code`). */
  readonly code?: { readonly label: ReactNode; readonly value: ReactNode };
}

/** "About this experiment" (`section.sv-sec`): the description, then the area and the BITS code. */
export function StHubAbout({ title, titleId, description, area, code }: StHubAboutProps) {
  return (
    <section className="sv-sec" aria-labelledby={titleId}>
      <h2 className="xr-sr" id={titleId}>
        {title}
      </h2>
      <p className="sv-lead">{description}</p>
      {area === undefined && code === undefined ? null : (
        <p className="sv-meta">
          {area === undefined ? null : <span>{area}</span>}
          {area !== undefined && code !== undefined ? (
            <span className="sv-meta-sep" aria-hidden="true" />
          ) : null}
          {code === undefined ? null : (
            <>
              <span>{code.label}</span>
              <span className="rb-code">{code.value}</span>
            </>
          )}
        </p>
      )}
    </section>
  );
}

/** A section of the Overview's main card (`section.sv-sec`, head `div.sv-sec-h`: `h2.sv-h2` + note). */
export function StHubSection({
  title,
  titleId,
  note,
  children,
}: {
  readonly title: ReactNode;
  readonly titleId: string;
  readonly note?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <section className="sv-sec" aria-labelledby={titleId}>
      <div className="sv-sec-h">
        <h2 className="sv-h2" id={titleId}>
          {title}
        </h2>
        {note === undefined ? null : <p className="sv-sh-note">{note}</p>}
      </div>
      {children}
    </section>
  );
}

export interface StHubFormatRow {
  readonly key: string;
  readonly chip: StFormatChipProps;
  /** "Browser", "Virtual reality". */
  readonly name: string;
  /** "Available to you", "Paused". */
  readonly access: ReactNode;
  /** The "Next step" tag's words, on the row whose action is the next step. */
  readonly next?: ReactNode;
  readonly status: { readonly tone: StatusTone; readonly words: ReactNode };
  /** One line after the status: "Last saved 12 Oct 2026, 11:20", "Feedback sent 14 Oct 2026". */
  readonly facts?: ReactNode;
  readonly action?: StHubAction;
}

/**
 * "Your formats" (`ul.sv-frows`): each given format with its chip, name, access, the "Next step"
 * tag where it applies, its own progress and at most one action (`li.sv-frow`, `is-next`).
 */
export function StHubFormatRows({
  labelledBy,
  rows,
}: {
  readonly labelledBy: string;
  readonly rows: readonly StHubFormatRow[];
}) {
  return (
    <ul className="sv-frows" aria-labelledby={labelledBy}>
      {rows.map((row) => (
        <li key={row.key} className={joinClasses('sv-frow', row.next !== undefined && 'is-next')}>
          <span className="sv-frow-b" aria-hidden="true">
            <StFormatChip {...row.chip} hidden={false} />
          </span>
          <div className="sv-frow-main">
            <p className="sv-frow-t">
              <b>{row.name}</b>
              <span className="xr-sr"> ({row.chip.code}), </span>
              <span className="sv-frow-sep" aria-hidden="true">
                {' · '}
              </span>
              <span className="sv-frow-acc">{row.access}</span>
              {row.next === undefined ? null : <StHubNextTag>{row.next}</StHubNextTag>}
            </p>
            <p className="sv-frow-s">
              <StatusPill tone={row.status.tone}>{row.status.words}</StatusPill>
              {row.facts === undefined ? null : <span className="sv-frow-f">{row.facts}</span>}
            </p>
          </div>
          {row.action ? (
            <div className="sv-frow-act">
              <ActionLink action={row.action} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * A section of the Overview's aside (`section.sv-sec.sv-side-sec`, `is-next`): the title with the
 * "Next step" tag (`div.sv-side-h`), one sentence and, where there is one, its action
 * (`a.rb-btn.sv-side-btn`).
 */
export function StHubSideSection({
  title,
  titleId,
  next,
  description,
  action,
  children,
}: {
  readonly title: ReactNode;
  readonly titleId: string;
  readonly next?: ReactNode;
  readonly description: ReactNode;
  readonly action?: StHubAction;
  /** Between the sentence and the action. */
  readonly children?: ReactNode;
}) {
  return (
    <section
      className={joinClasses('sv-sec', 'sv-side-sec', next !== undefined && 'is-next')}
      aria-labelledby={titleId}
    >
      <div className="sv-side-h">
        <h2 className="sv-h3" id={titleId}>
          {title}
        </h2>
        {next === undefined ? null : <StHubNextTag>{next}</StHubNextTag>}
      </div>
      <p className="sv-side-d">{description}</p>
      {children}
      {action ? <ActionLink action={action} className="sv-side-btn" /> : null}
    </section>
  );
}

// ---- ST-06 Resources -----------------------------------------------------------------------------

export interface StResourceCardProps {
  readonly title: ReactNode;
  readonly titleId: string;
  /** Takes focus after "Try again" (`h2.sv-sec-t`, `tabindex="-1"`). */
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** "3 resources · each opens in a new tab". */
  readonly note: ReactNode;
  /** A pause, a licence wait or an inactive account, said once above the list (`p.sv-res-held`). */
  readonly held?: ReactNode;
  readonly children: ReactNode;
}

/** The reading list's surface (`section.sv-card.sv-res`). */
export function StResourceCard({
  title,
  titleId,
  titleRef,
  note,
  held,
  children,
}: StResourceCardProps) {
  return (
    <section className="sv-card sv-res" aria-labelledby={titleId}>
      <div className="sv-card-h">
        <h2 ref={titleRef} className="sv-sec-t" id={titleId} tabIndex={-1}>
          {title}
        </h2>
        <p className="sv-sh-note">{note}</p>
      </div>
      {held === undefined || held === null ? null : (
        <p className="sv-res-held">
          <Glyph name="lock" />
          <span>{held}</span>
        </p>
      )}
      {children}
    </section>
  );
}

/** A resource's status line: not opened yet · opened (date) · opening · couldn't open. */
export type StResourceStatus =
  | { readonly kind: 'not-opened'; readonly words: ReactNode }
  | { readonly kind: 'opened'; readonly words: ReactNode }
  | { readonly kind: 'busy'; readonly words: ReactNode }
  | { readonly kind: 'failed'; readonly words: ReactNode };

export interface StResourceRowProps {
  /** The kind's glyph: `documentText` (a document), `globe` (a web page), `spreadsheet`. */
  readonly icon: V3IconName;
  readonly title: ReactNode;
  /** "PDF document", "6 pages" (`p.sv-res-m`). */
  readonly kind: ReactNode;
  readonly size: ReactNode;
  /** The status region (`div.sv-res-st`, `role="status"`): focus lands here after an opening. */
  readonly statusId: string;
  readonly status: StResourceStatus;
  /** "Open" / "Try again" with its fuller name; none while nothing can open (held). */
  readonly action?: {
    readonly label: ReactNode;
    readonly ariaLabel: string;
    readonly busy: boolean;
    readonly onOpen: () => void;
  };
}

/** One resource (`li.sv-li`): its icon, title, kind and length, the status, and Open. */
export function StResourceRow({
  icon,
  title,
  kind,
  size,
  statusId,
  status,
  action,
}: StResourceRowProps) {
  return (
    <StListRow
      lead={
        <span className="sv-res-ico" aria-hidden="true">
          <Glyph name={icon} />
        </span>
      }
      end={
        action ? (
          <button
            type="button"
            className="rb-btn"
            aria-label={action.ariaLabel}
            disabled={action.busy}
            onClick={action.onOpen}
          >
            {action.label}
            <Icon name="externalLink" size={16} />
          </button>
        ) : undefined
      }
    >
      <h3 className="sv-li-t">{title}</h3>
      <p className="sv-res-m">
        <span>{kind}</span>
        <span>{size}</span>
      </p>
      <div className="sv-res-st" id={statusId} tabIndex={-1} role="status">
        {status.kind === 'opened' ? (
          <p className="sv-res-s sv-res-s--ok">
            <Glyph name="check" />
            {status.words}
          </p>
        ) : status.kind === 'failed' ? (
          <p className="sv-res-s sv-res-s--err">
            <Glyph name="alertCircle" />
            {status.words}
          </p>
        ) : (
          <p className="sv-res-s">{status.words}</p>
        )}
      </div>
    </StListRow>
  );
}

/** The aside's count of opened resources (`p.sv-res-count`): "1 of 3 opened". */
export function StResourceCount({ children }: { readonly children: ReactNode }) {
  return <p className="sv-res-count">{children}</p>;
}

// ---- ST-07 Simulation — choose a format ----------------------------------------------------------

/** The chooser (`section.sv-chooser`, a container): its head, the cards, then the formats not yours. */
export function StChooser({
  labelledBy,
  children,
}: {
  readonly labelledBy: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="sv-chooser" aria-labelledby={labelledBy}>
      {children}
    </section>
  );
}

export interface StChooserCardProps {
  readonly chip: StFormatChipProps;
  /** "Browser". */
  readonly name: string;
  readonly titleId: string;
  readonly next?: ReactNode;
  /** "Available to you", "Paused" (`p.sv-fcard-acc`). */
  readonly access: ReactNode;
  /** What it needs and how it runs (`p.sv-fcard-need`). */
  readonly need: ReactNode;
  /** "Your headset: ME lab VR headset, asset tag GIT-VR-03" (`p.sv-fcard-dev`). */
  readonly device?: ReactNode;
  readonly status: { readonly tone: StatusTone; readonly words: ReactNode };
  /** Dated facts (`ul.sv-fcard-facts`): "Last saved …", "Feedback sent …". */
  readonly facts?: readonly ReactNode[];
  /** Why a held format can't open (`p.sv-fcard-why`). */
  readonly why?: ReactNode;
  /** Its actions (`div.sv-fcard-act`). */
  readonly actions?: readonly (StHubAction & { readonly key: string })[];
}

/** One format the Student can use (`li.sv-card.sv-fcard`, `is-next`; named by its title). */
export function StChooserCard({
  chip,
  name,
  titleId,
  next,
  access,
  need,
  device,
  status,
  facts = [],
  why,
  actions = [],
}: StChooserCardProps) {
  return (
    <li
      className={joinClasses('sv-card', 'sv-fcard', next !== undefined && 'is-next')}
      aria-labelledby={titleId}
    >
      <div className="sv-fcard-h">
        <StFormatChip {...chip} />
        <h3 className="sv-fcard-t" id={titleId}>
          {name}
          <span className="xr-sr"> ({chip.code})</span>
        </h3>
        {next === undefined ? null : <StHubNextTag>{next}</StHubNextTag>}
      </div>
      <p className="sv-fcard-acc">{access}</p>
      <p className="sv-fcard-need">{need}</p>
      {device === undefined || device === null ? null : (
        <p className="sv-fcard-dev">
          <Glyph name="headset" />
          <span>{device}</span>
        </p>
      )}
      <div className="sv-fcard-prog">
        <p>
          <StatusPill tone={status.tone}>{status.words}</StatusPill>
        </p>
        {facts.length > 0 ? (
          <ul className="sv-fcard-facts">
            {facts.map((fact, index) => (
              <li key={index}>{fact}</li>
            ))}
          </ul>
        ) : null}
        {why === undefined || why === null ? null : (
          <p className="sv-fcard-why">
            <Glyph name="infoNote" />
            <span>{why}</span>
          </p>
        )}
      </div>
      {actions.length > 0 ? (
        <div className="sv-fcard-act">
          {actions.map((action) => (
            <ActionLink key={action.key} action={action} />
          ))}
        </div>
      ) : null}
    </li>
  );
}

/** The cards (`ul.sv-fcards`, named "Your formats"). */
export function StChooserCards({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <ul className="sv-fcards" aria-label={label}>
      {children}
    </ul>
  );
}

/** The formats not available to the Student, under the cards (`div.sv-chooser-off`). */
export function StChooserOff({ children }: { readonly children: ReactNode }) {
  return <div className="sv-chooser-off">{children}</div>;
}

// ---- ST-10 Progress for this experiment ----------------------------------------------------------

/**
 * The Progress tab's surface (`section.sv-card.sv-ptab`): the head (title, the intro under it, the
 * grant line beside it), then the hold note and the flat per-format block.
 */
export function StHubProgressCard({
  title,
  titleId,
  intro,
  note,
  children,
}: {
  readonly title: ReactNode;
  readonly titleId: string;
  readonly intro: ReactNode;
  /** "Given by your institution" (`p.sv-sh-note`). */
  readonly note?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <section className="sv-card sv-ptab" aria-labelledby={titleId}>
      <div className="sv-card-h">
        <div>
          <h2 className="sv-sec-t" id={titleId}>
            {title}
          </h2>
          <p className="sv-ptab-intro">{intro}</p>
        </div>
        {note === undefined ? null : <p className="sv-sh-note">{note}</p>}
      </div>
      {children}
    </section>
  );
}

// ---- ST-08 / ST-09 format pages ------------------------------------------------------------------

/** The format page's layout (`div.sv-ov.sv-fp`): the launch surface and its "About" aside. */
export function StLaunchPage({ children }: { readonly children: ReactNode }) {
  return <div className="sv-ov sv-fp">{children}</div>;
}

export interface StLaunchCardProps {
  /** The surface's title (`h2.sv-sec-t`, focus target): "Start the WEB simulation". */
  readonly title: ReactNode;
  readonly titleId: string;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** One sentence under it (`p.sv-launch-d`). */
  readonly description?: ReactNode;
  /** In the main part, after the sentence: the notices and the actions. */
  readonly children?: ReactNode;
  /** The sections after the main part (`div.sv-launch-sec`): the headset, the setup steps. */
  readonly sections?: ReactNode;
  /** The help foot (`StLaunchFoot`). */
  readonly foot: ReactNode;
}

/** The launch surface (`section.sv-card.sv-launch`, named by its title). */
export function StLaunchCard({
  title,
  titleId,
  titleRef,
  description,
  children,
  sections,
  foot,
}: StLaunchCardProps) {
  return (
    <section className="sv-card sv-launch" aria-labelledby={titleId}>
      <div className="sv-launch-main">
        <h2 ref={titleRef} className="sv-sec-t" id={titleId} tabIndex={-1}>
          {title}
        </h2>
        {description === undefined || description === null ? null : (
          <p className="sv-launch-d">{description}</p>
        )}
        {children}
      </div>
      {sections}
      {foot}
    </section>
  );
}

export interface StLaunchGoProps {
  /** The one large action: the launch button, or a link ("Give feedback on WEB"). */
  readonly action:
    | {
        readonly kind: 'button';
        readonly id?: string;
        readonly label: ReactNode;
        readonly busy: boolean;
        readonly onLaunch: () => void;
        /** The hint's id, read as the button's description. */
        readonly describedBy?: string;
      }
    | {
        readonly kind: 'link';
        readonly href: string;
        readonly label: ReactNode;
        readonly primary?: boolean;
      };
  /** "Opens in a new tab" (`p.sv-launch-hint`). */
  readonly hint?: { readonly id?: string; readonly text: ReactNode };
}

/**
 * The action row (`div.sv-launch-go`): the large primary button or link, and its hint. The button
 * is the kit `Button` with the export's busy (`busyAs="disabled"`: `disabled` and `aria-busy`
 * while the simulation opens). The launch failure above it is the kit `Notice` with the export's
 * `sv-launch-err` (`className`).
 */
export function StLaunchGo({ action, hint }: StLaunchGoProps) {
  const Link = useLinkComponent();
  return (
    <div className="sv-launch-go">
      {action.kind === 'button' ? (
        <Button
          variant="primary"
          size="lg"
          id={action.id}
          busy={action.busy}
          busyAs="disabled"
          aria-describedby={action.describedBy}
          onClick={action.onLaunch}
        >
          {action.label}
        </Button>
      ) : (
        <Link
          className={joinClasses(
            'rb-btn',
            action.primary !== false && 'rb-btn--primary rb-btn--lg',
          )}
          href={action.href}
        >
          {action.label}
        </Link>
      )}
      {hint ? (
        <p className="sv-launch-hint" id={hint.id}>
          {hint.text}
        </p>
      ) : null}
    </div>
  );
}

/** The authorised headset (`div.sv-launch-sec.sv-launch-dev`) and the way to My device. */
export function StLaunchDevice({
  label,
  device,
  link,
}: {
  /** "Your authorised headset". */
  readonly label: ReactNode;
  readonly device: ReactNode;
  readonly link: { readonly href: string; readonly label: ReactNode };
}) {
  const Link = useLinkComponent();
  return (
    <div className="sv-launch-sec sv-launch-dev">
      <span className="sv-res-ico" aria-hidden="true">
        <Glyph name="headset" />
      </span>
      <div>
        <p className="sv-eyebrow">{label}</p>
        <p className="sv-launch-devname">{device}</p>
      </div>
      <Link className="sv-link" href={link.href}>
        {link.label}
        <Glyph name="chevronRight" />
      </Link>
    </div>
  );
}

/**
 * The setup steps behind a disclosure (`button.st-disclose.sv-disclose`, `aria-expanded`): open
 * the first time, while nothing is reported; the steps are `ol.sv-howto`.
 */
export function StLaunchSetup({
  open,
  label,
  stepsId,
  steps,
  onToggle,
}: {
  readonly open: boolean;
  /** "View setup steps" / "Hide setup steps". */
  readonly label: ReactNode;
  readonly stepsId: string;
  readonly steps: readonly StHowToStep[];
  readonly onToggle: () => void;
}) {
  return (
    <div className="sv-launch-sec">
      <button
        type="button"
        className="st-disclose sv-disclose"
        aria-expanded={open ? 'true' : 'false'}
        aria-controls={open ? stepsId : undefined}
        onClick={onToggle}
      >
        {label}
        <Glyph name="chevronDown" />
      </button>
      {open ? <StHowTo id={stepsId} steps={steps} /> : null}
    </div>
  );
}

/** "Something not working? …" and "Report a problem" (`div.sv-launch-sec.sv-launch-foot`). */
export function StLaunchFoot({
  lead,
  text,
  report,
}: {
  /** "Something not working?" (bold). */
  readonly lead: ReactNode;
  /** "Reporting it doesn’t affect your progress." */
  readonly text: ReactNode;
  readonly report: { readonly href: string; readonly label: ReactNode };
}) {
  const Link = useLinkComponent();
  return (
    <div className="sv-launch-sec sv-launch-foot">
      <p className="sv-launch-help">
        <b>{lead}</b> {text}
      </p>
      <Link className="rb-btn" href={report.href}>
        <Icon name="flag" size={16} />
        {report.label}
      </Link>
    </div>
  );
}

/** The format's facts beside the launch surface (`aside.sv-card.sv-ov-side`, `dl.sv-dl.sv-about-dl`). */
export function StLaunchAbout({
  title,
  titleId,
  rows,
}: {
  /** "About WEB". */
  readonly title: ReactNode;
  readonly titleId: string;
  readonly rows: readonly {
    readonly key: string;
    readonly term: ReactNode;
    readonly value: ReactNode;
  }[];
}) {
  return (
    <aside className="sv-card sv-ov-side" aria-labelledby={titleId}>
      <section className="sv-sec sv-side-sec">
        <h2 className="sv-h3" id={titleId}>
          {title}
        </h2>
        <dl className="sv-dl sv-about-dl">
          {rows.map((row) => (
            <div key={row.key}>
              <dt>{row.term}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </aside>
  );
}
