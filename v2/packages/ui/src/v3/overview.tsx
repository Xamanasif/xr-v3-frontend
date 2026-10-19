'use client';

import { Fragment, type ReactNode, type Ref } from 'react';

import { joinClasses } from '../internal/classes.js';
import { useLinkComponent } from '../link.js';
import { ButtonLink, type ButtonVariant } from './actions.js';
import { Glyph, type V3IconName } from './icons.js';

/** A link drawn as a button, with the accessible name the row needs. */
export interface ActionLink {
  readonly href: string;
  readonly label: ReactNode;
  /** The full name where the visible words need their object ("Open the renewal request from …"). */
  readonly accessibleName?: string;
}

// ── Super Admin overview (SA-01) ─────────────────────────────────────────────────────────────

export interface Figure {
  /** The figure, from the application's records (never a constant). */
  readonly value: ReactNode;
  /** What it counts (`dt.rb-fig-t`): "Active institutions". */
  readonly title: ReactNode;
  /** Its scope in words (`dd.rb-fig-s`): one line, or several (each on its own line). */
  readonly details?: readonly ReactNode[];
}

export interface OverviewHeadProps {
  readonly title: ReactNode;
  readonly titleId?: string;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** The date on phones (`p.rb-eyebrow-date`), from the application's clock. */
  readonly date?: ReactNode;
  /** The figures beside the title (`dl.rb-figs`), named by `figuresLabel`. */
  readonly figures?: readonly Figure[];
  readonly figuresLabel?: string;
}

/** The overview head (`header.rb-head`): the title and, on its right, the figures. */
export function OverviewHead({
  title,
  titleId,
  titleRef,
  date,
  figures = [],
  figuresLabel,
}: OverviewHeadProps) {
  return (
    <header className="rb-head">
      <div>
        {date ? <p className="rb-eyebrow-date">{date}</p> : null}
        <h1 className="rb-h1" id={titleId} ref={titleRef} tabIndex={titleRef ? -1 : undefined}>
          {title}
        </h1>
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
                    <Fragment key={detailIndex}>
                      {detailIndex > 0 ? ' ' : null}
                      <span>{detail}</span>
                    </Fragment>
                  ))}
                </dd>
              ) : null}
            </div>
          ))}
        </dl>
      ) : null}
    </header>
  );
}

export interface CategoryOption<Key extends string> {
  readonly key: Key;
  readonly label: ReactNode;
  readonly count: number;
}

export interface CategorySwitchProps<Key extends string> {
  /** The group's name: "Show what is waiting". */
  readonly label: string;
  readonly options: readonly CategoryOption<Key>[];
  readonly value: Key;
  readonly onChange: (key: Key) => void;
  /**
   * The change in a few words, announced politely ("Requests, 3 items"). The board makes the whole
   * queue a live region, which reads every row aloud on each switch (ADR-0010).
   */
  readonly announcement?: string;
}

/** The category switch (`div.rb-switch[role=group]` > `button[aria-pressed]` with its count). */
export function CategorySwitch<Key extends string>({
  label,
  options,
  value,
  onChange,
  announcement,
}: CategorySwitchProps<Key>) {
  return (
    <div className="rb-switchbar">
      <div className="rb-switch" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={option.key === value}
            onClick={() => onChange(option.key)}
          >
            {option.label}
            {/* A space the flex layout does not draw: the name reads "Requests 3", not "Requests3". */}{' '}
            <b>{option.count}</b>
          </button>
        ))}
      </div>
      <p className="xr-sr" role="status">
        {announcement}
      </p>
    </div>
  );
}

export interface PriorityItem {
  readonly key: string;
  /** The big date or wait ("31 Oct", "57 days") and its relative line ("In 8 days"). */
  readonly when: { readonly big: ReactNode; readonly relative: ReactNode; readonly calm?: boolean };
  /** The kind of work, with its icon: "Access ending", "Correction waiting for release". */
  readonly kind: { readonly icon: V3IconName; readonly label: ReactNode };
  readonly title: ReactNode;
  readonly description: ReactNode;
  readonly action: ActionLink & { readonly variant?: ButtonVariant };
}

export interface PriorityBandProps {
  /** "Needs attention first". */
  readonly title: ReactNode;
  readonly titleId: string;
  /** The ordering rule in words (`p.rb-note`). It must describe the order the caller applied. */
  readonly note?: ReactNode;
  readonly items: readonly PriorityItem[];
}

/** The ivory priority band (`section.rb-prio`): the few items that need attention first. */
export function PriorityBand({ title, titleId, note, items }: PriorityBandProps) {
  return (
    <section className="rb-prio" aria-labelledby={titleId}>
      <div className="rb-sec-head">
        <h2 className="rb-h2" id={titleId}>
          {title}
        </h2>
        {note ? <p className="rb-note">{note}</p> : null}
      </div>
      <ol className="rb-prio-list">
        {items.map((item) => (
          <li key={item.key} className="rb-pi">
            <p className="rb-pi-when">
              <span className="rb-pi-big">{item.when.big}</span>
              <span className={joinClasses('rb-pi-rel', item.when.calm && 'rb-pi-rel--calm')}>
                {item.when.relative}
              </span>
            </p>
            <p className="rb-pi-kind">
              <Glyph name={item.kind.icon} />
              {item.kind.label}
            </p>
            <h3 className="rb-pi-title">{item.title}</h3>
            <p className="rb-pi-d">{item.description}</p>
            <div className="rb-pi-act">
              <ButtonLink
                href={item.action.href}
                variant={item.action.variant ?? 'default'}
                size="lg"
                aria-label={item.action.accessibleName}
              >
                {item.action.label}
              </ButtonLink>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export interface QueueRow {
  readonly key: string;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  /** The wait or date ("29 days") and its line ("since 24 Sep"); `due` draws it in warn. */
  readonly when: { readonly big: ReactNode; readonly small?: ReactNode; readonly due?: boolean };
  readonly action: ActionLink;
}

export interface QueueGroup {
  readonly key: string;
  readonly name: ReactNode;
  readonly icon: V3IconName;
  /** The group's destination ("Open Requests"). */
  readonly link?: { readonly href: string; readonly label: ReactNode };
  readonly rows: readonly QueueRow[];
  /**
   * The quiet line of a group with no rows (`p.sa-quietrow`; the Super Admin export's
   * `groupHtml`): "No request is waiting for your decision." A group with no rows and no quiet
   * line shows its head alone.
   */
  readonly quiet?: ReactNode;
}

/**
 * The rest of the queue (`div.rb-queue`): one surface, groups divided by rules, never cards. Each
 * group is a section named by its heading; a group with nothing in it says so in its quiet line
 * (SA-01 under a category).
 */
export function QueueGroups({
  groups,
  idPrefix,
}: {
  readonly groups: readonly QueueGroup[];
  readonly idPrefix: string;
}) {
  const Link = useLinkComponent();
  return (
    <div className="rb-queue">
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
            {group.rows.length > 0 ? (
              <ul className="rb-rows">
                {group.rows.map((row) => (
                  <li key={row.key} className="rb-row">
                    <div className="rb-row-main">
                      <p className="rb-row-t">{row.title}</p>
                      {row.description ? <p className="rb-row-d">{row.description}</p> : null}
                    </div>
                    <p className={joinClasses('rb-row-when', row.when.due && 'rb-row-when--due')}>
                      <b>{row.when.big}</b>
                      {row.when.small ? <span>{row.when.small}</span> : null}
                    </p>
                    <div className="rb-row-act">
                      <ButtonLink
                        href={row.action.href}
                        variant="ghost"
                        aria-label={row.action.accessibleName}
                      >
                        {row.action.label}
                      </ButtonLink>
                    </div>
                  </li>
                ))}
              </ul>
            ) : group.quiet ? (
              <p className="sa-quietrow">
                <Glyph name="check" />
                <span>{group.quiet}</span>
              </p>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

// ── Institute Admin overview (IA-01) ─────────────────────────────────────────────────────────

export interface GoToLink {
  readonly href: string;
  readonly label: ReactNode;
  readonly icon: V3IconName;
}

export interface IdentityBandProps {
  /** The institution's name, the page's H1 (`h1.rb-id-name`). */
  readonly title: ReactNode;
  readonly titleId: string;
  /** Visually hidden words before the name, so the H1 says the page: "Overview, ". */
  readonly titlePrefix?: string;
  readonly date?: ReactNode;
  /** The status pill and its line (`p.rb-id-status`). */
  readonly status: ReactNode;
  /** The band's actions (`div.rb-id-act`), at most one primary. */
  readonly actions?: ReactNode;
  /** The term timeline (`TermTrack`). */
  readonly term?: ReactNode;
  /** "Go to" and its destinations (`nav.rb-go`). */
  readonly goTo?: { readonly label: string; readonly links: readonly GoToLink[] };
}

/** The institution's identity band (`section.rb-id`, plan tint): name, status, term, go to. */
export function IdentityBand({
  title,
  titleId,
  titlePrefix,
  date,
  status,
  actions,
  term,
  goTo,
}: IdentityBandProps) {
  const Link = useLinkComponent();
  return (
    <section className="rb-id" aria-labelledby={titleId}>
      <div className="rb-id-top">
        <div className="rb-id-text">
          {date ? <p className="rb-eyebrow-date">{date}</p> : null}
          <h1 className="rb-id-name" id={titleId}>
            {titlePrefix ? <span className="xr-sr">{titlePrefix}</span> : null}
            {title}
          </h1>
          <p className="rb-id-status">{status}</p>
        </div>
        {actions ? <div className="rb-id-act">{actions}</div> : null}
      </div>
      {term}
      {goTo ? (
        <nav className="rb-go" aria-label={goTo.label}>
          <span className="rb-go-label">{goTo.label}</span>
          {goTo.links.map((link, index) => (
            <Link key={index} href={link.href}>
              <Glyph name={link.icon} />
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </section>
  );
}

export interface AttentionItem {
  readonly key: string;
  /** The count in the margin; also read before the words. */
  readonly count: number;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly action: ActionLink;
}

export interface AttentionPanelProps {
  /** "Needs your attention". */
  readonly title: ReactNode;
  readonly titleId: string;
  /** "5 items". */
  readonly note?: ReactNode;
  /** The ivory lead item (`div.rb-lead`): the most urgent task, with a navy action. */
  readonly lead?: {
    readonly icon: V3IconName;
    readonly title: ReactNode;
    readonly description: ReactNode;
    readonly action: ActionLink & { readonly variant?: ButtonVariant };
  };
  readonly items: readonly AttentionItem[];
  /** Nothing needs attention: the calm state instead of the items (`CalmState`). */
  readonly calm?: ReactNode;
}

/** The attention panel (`section.rb-panel.rb-att`): the lead item and the counted items. */
export function AttentionPanel({ title, titleId, note, lead, items, calm }: AttentionPanelProps) {
  return (
    <section
      className={joinClasses('rb-panel', 'rb-att', calm ? 'rb-att--calm' : undefined)}
      aria-labelledby={titleId}
    >
      <div className="rb-att-head">
        <h2 className="rb-h2" id={titleId}>
          {title}
        </h2>
        {note ? <p className="rb-note">{note}</p> : null}
      </div>
      {calm}
      {lead ? (
        <div className="rb-lead">
          <span className="rb-lead-ico" aria-hidden="true">
            <Glyph name={lead.icon} />
          </span>
          <p className="rb-lead-t">{lead.title}</p>
          <p className="rb-lead-d">{lead.description}</p>
          <div className="rb-lead-act">
            <ButtonLink
              href={lead.action.href}
              variant={lead.action.variant ?? 'navy'}
              size="lg"
              aria-label={lead.action.accessibleName}
            >
              {lead.action.label}
            </ButtonLink>
          </div>
        </div>
      ) : null}
      {items.length > 0 ? (
        <ul>
          {items.map((item) => (
            <li key={item.key} className="rb-ai">
              <span className="rb-ai-n" aria-hidden="true">
                {item.count}
              </span>
              <p className="rb-ai-t">
                <span className="xr-sr">{item.count} </span>
                {item.title}
              </p>
              {item.description ? <p className="rb-ai-d">{item.description}</p> : null}
              <div className="rb-ai-act">
                <ButtonLink href={item.action.href} aria-label={item.action.accessibleName}>
                  {item.action.label}
                </ButtonLink>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/**
 * Nothing needs attention (`div.rb-calm`). DERIVED from the rb.css calm rules: the IA01-calm board
 * that draws it was not in the owner's upload, so this layout is not yet checked against a board.
 */
export function CalmState({
  title,
  titleId,
  children,
}: {
  readonly title: ReactNode;
  /** The title's id, for a region it names (SA-01's queue section). */
  readonly titleId?: string;
  readonly children?: ReactNode;
}) {
  return (
    <div className="rb-calm">
      <span className="rb-calm-ico" aria-hidden="true">
        <Glyph name="check" />
      </span>
      <p className="rb-calm-t" id={titleId}>
        {title}
      </p>
      {children ? <p className="rb-calm-d">{children}</p> : null}
    </div>
  );
}

export interface PlanSheetProps {
  /** "Your access plan". */
  readonly title: ReactNode;
  readonly titleId: string;
  /** The plan's link in the head ("View plan ACC-0107"). */
  readonly link?: { readonly href: string; readonly label: ReactNode };
  /** The plan's facts (`dl.rb-facts`): "Licences", "Term". */
  readonly facts: readonly { readonly term: ReactNode; readonly value: ReactNode }[];
  /** The experiment in the plan (`div.rb-plan-exp`). */
  readonly experiment?: {
    readonly title: ReactNode;
    readonly course?: ReactNode;
    /** The institution's own code line (`p.rb-exp-code`). */
    readonly code?: ReactNode;
  };
  /** The format cells (`FormatCells variant="plan"`). */
  readonly formats?: ReactNode;
  /** The foot (`div.rb-plan-foot`): a line and a link. */
  readonly foot?: {
    readonly text: ReactNode;
    readonly link?: { readonly href: string; readonly label: ReactNode };
  };
}

/** The access-plan sheet of an overview (`section.rb-panel.rb-plan`). */
export function PlanSheet({
  title,
  titleId,
  link,
  facts,
  experiment,
  formats,
  foot,
}: PlanSheetProps) {
  const Link = useLinkComponent();
  return (
    <section className="rb-panel rb-plan" aria-labelledby={titleId}>
      <div className="rb-plan-head">
        <h2 className="rb-h2" id={titleId}>
          {title}
        </h2>
        {link ? (
          <Link className="rb-link" href={link.href}>
            {link.label}
          </Link>
        ) : null}
      </div>
      <div className="rb-plan-body">
        <dl className="rb-facts">
          {facts.map((fact, index) => (
            <div key={index}>
              <dt>{fact.term}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
        {experiment ? (
          <div className="rb-plan-exp">
            <p className="rb-exp-t">{experiment.title}</p>
            {experiment.course ? <p className="rb-exp-c">{experiment.course}</p> : null}
            {experiment.code ? <p className="rb-exp-code">{experiment.code}</p> : null}
          </div>
        ) : null}
        {formats}
      </div>
      {foot ? (
        <div className="rb-plan-foot">
          <p>{foot.text}</p>
          {foot.link ? (
            <Link className="rb-link" href={foot.link.href}>
              {foot.link.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
