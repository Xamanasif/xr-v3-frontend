'use client';

import type { ReactNode } from 'react';

import { useLinkComponent } from '../link.js';
import { Glyph } from './icons.js';

export interface PlanBandProps {
  /** The kicker above the name (`p.rk-plan-k`): "Access plan". */
  readonly kicker: ReactNode;
  /** The plan's name in the band's heading (`h2`), e.g. its reference where the role shows it. */
  readonly name: ReactNode;
  readonly nameId: string;
  /** The plan's status pill beside the name. */
  readonly status: ReactNode;
  /** One line of plan facts (`p.rk-plan-line`): "120 licences, as approved by BITS". */
  readonly line?: ReactNode;
  /** A link under the facts (`a.rb-link.rk-plan-link`): "View plan". */
  readonly link?: {
    readonly href: string;
    readonly label: ReactNode;
    readonly accessibleName?: string;
  };
  /** The term timeline (`TermTrack inPlanBand`). */
  readonly term: ReactNode;
  /** One note strip when the plan needs attention (`PlanNote`). */
  readonly note?: ReactNode;
}

/**
 * The plan band (`section.rk-plan`; rb-kit.css PlanBand): identity on the left, the term on the
 * right, one note strip when the plan needs attention. Identity above the term under 760 px.
 */
export function PlanBand({ kicker, name, nameId, status, line, link, term, note }: PlanBandProps) {
  const Link = useLinkComponent();
  return (
    <section className="rk-plan" aria-labelledby={nameId}>
      <div className="rk-plan-grid">
        <div>
          <p className="rk-plan-k">{kicker}</p>
          <div className="rk-plan-name">
            <h2 id={nameId}>{name}</h2>
            {status}
          </div>
          {line ? <p className="rk-plan-line">{line}</p> : null}
          {link ? (
            <Link
              className="rb-link rk-plan-link"
              href={link.href}
              aria-label={link.accessibleName}
            >
              {link.label}
            </Link>
          ) : null}
        </div>
        {term}
      </div>
      {note}
    </section>
  );
}

export interface CourseGroupProps {
  /** The BITS course code chip (`CourseCode variant="group"`). */
  readonly code: ReactNode;
  /** The course's name (`h3.rk-course-t`). */
  readonly title: ReactNode;
  readonly titleId: string;
  /** The institution's own code, or the "not added" tag and its link (`div.rk-course-codes`). */
  readonly codes?: ReactNode;
  /** The course's experiments (`ExperimentCard`). */
  readonly children: ReactNode;
}

/** A course and its experiments (`div.rk-course[role=group]`; IA-02). */
export function CourseGroup({ code, title, titleId, codes, children }: CourseGroupProps) {
  return (
    <div className="rk-course" role="group" aria-labelledby={titleId}>
      <div className="rk-course-h">
        <div className="rk-course-id">
          {code}
          <h3 className="rk-course-t" id={titleId}>
            {title}
          </h3>
        </div>
        {codes ? <div className="rk-course-codes">{codes}</div> : null}
      </div>
      {children}
    </div>
  );
}

/** The quiet key before a code in a course head (`span.rk-own-k`): "Your course code". */
export function CodeKey({ children }: { readonly children: ReactNode }) {
  return <span className="rk-own-k">{children}</span>;
}

export interface ExperimentCardProps {
  /** The experiment's name (`h4.rk-exp-t`). */
  readonly title: ReactNode;
  readonly titleId: string;
  /** The access status pill beside the name. */
  readonly status?: ReactNode;
  /** The format cells (`FormatCells variant="experiment"`). */
  readonly formats: ReactNode;
  /**
   * "Students given access": a count that links to its list, or nothing given yet (`None yet`,
   * `is-none`). The words come from the caller.
   */
  readonly given: {
    readonly label: ReactNode;
    readonly none: ReactNode;
    readonly count?: {
      readonly text: ReactNode;
      readonly href: string;
      readonly accessibleName?: string;
    };
  };
  /** The card's action (`div.rk-exp-act`): "Give access" — absent while the plan is read-only. */
  readonly action?: ReactNode;
}

/** An experiment in an access plan (`article.rk-exp`; IA-02): name, formats, given, action. */
export function ExperimentCard({
  title,
  titleId,
  status,
  formats,
  given,
  action,
}: ExperimentCardProps) {
  const Link = useLinkComponent();
  return (
    <article className="rk-exp" aria-labelledby={titleId}>
      <div className="rk-exp-name">
        <h4 className="rk-exp-t" id={titleId}>
          {title}
        </h4>
        {status}
      </div>
      {formats}
      <div className="rk-given">
        <p className="rk-given-k">{given.label}</p>
        {given.count ? (
          <p className="rk-given-v">
            <Glyph name="user" />
            <Link href={given.count.href} aria-label={given.count.accessibleName}>
              {given.count.text}
            </Link>
          </p>
        ) : (
          <p className="rk-given-v is-none">{given.none}</p>
        )}
      </div>
      {action ? <div className="rk-exp-act">{action}</div> : null}
    </article>
  );
}

/** The content-access page's column (`div.rk-ca`): tabs, plan band and list, 20 px apart. */
export function ContentStack({ children }: { readonly children: ReactNode }) {
  return <div className="rk-ca">{children}</div>;
}

/** The key bar above a list (`div.rk-legendbar`): the format key and a quiet line. */
export function LegendBar({
  formatKey,
  note,
}: {
  readonly formatKey: ReactNode;
  readonly note?: ReactNode;
}) {
  return (
    <div className="rk-legendbar">
      {formatKey}
      {note ? <p>{note}</p> : null}
    </div>
  );
}
