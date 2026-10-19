'use client';

import { Fragment, type ReactNode } from 'react';

import { useLinkComponent } from '../link.js';
import { CourseCode } from './codes.js';

/*
 * Super Admin V3 components for SA-14 Academic structure, SA-15 Area and course records (the
 * owner-approved Super Admin export, design/v3-refined-b/roles/SA-v1, `project/sa-views-c.js`
 * `V.structure`, `V.area`, `V.course`). Markup as the export's views emit it; every word, figure,
 * date and destination comes from the caller. "No platform code yet" is the kit's `MissingTag`
 * without an icon; the structure's dialogs are `ConfirmDialog` form dialogs.
 */

export interface StructureAreaGroupProps {
  /** The area's name (`h2.rk-course-t`). */
  readonly title: ReactNode;
  readonly titleId: string;
  /** Its description, or the words for none (`p.rk-course-codes`). */
  readonly description: ReactNode;
  /** "Open area" (`a.rb-link`) and its accessible name. */
  readonly open: {
    readonly href: string;
    readonly label: ReactNode;
    readonly accessibleName?: string;
  };
  /** The area's courses (`RecordList`), or the line that says it has none (`RecordLine`). */
  readonly children: ReactNode;
}

/**
 * One engineering area of the academic structure (`section.rk-course`; SA-14 `V.structure`): its
 * name and description, "Open area", then its courses.
 */
export function StructureAreaGroup({
  title,
  titleId,
  description,
  open,
  children,
}: StructureAreaGroupProps) {
  const Link = useLinkComponent();
  return (
    <section className="rk-course" aria-labelledby={titleId}>
      <div className="rk-course-h">
        <div className="rk-course-id">
          <h2 className="rk-course-t" id={titleId}>
            {title}
          </h2>
          <p className="rk-course-codes">{description}</p>
        </div>
        <Link className="rb-link" href={open.href} aria-label={open.accessibleName}>
          {open.label}
        </Link>
      </div>
      {children}
    </section>
  );
}

/**
 * A platform course code shown read-only (the kit's `CourseCode` chip, `span.rk-code`, + a quiet
 * `span.rk-hint`): "ME ZG523 Read-only here".
 */
export function StructureReadOnlyCode({
  code,
  note,
}: {
  readonly code: string;
  readonly note: ReactNode;
}) {
  return (
    <>
      <CourseCode code={code} /> <span className="rk-hint">{note}</span>
    </>
  );
}

export interface StructureLink {
  readonly key: string;
  readonly href: string;
  /** The link's words: the record's name. */
  readonly label: ReactNode;
  /** Plain words after the link ("(MEC-523)", "(ended)"). */
  readonly after?: ReactNode;
}

/**
 * Records named in a definition value, each a plain link (`dd > a`; SA-15 "What uses this
 * course": published experiments, institutions, Vendors in scope), separated as the caller says.
 */
export function StructureLinks({
  links,
  separator,
}: {
  readonly links: readonly StructureLink[];
  /** Between two links (the export joins them with ", "). */
  readonly separator: ReactNode;
}) {
  const Link = useLinkComponent();
  return (
    <>
      {links.map((link, index) => (
        <Fragment key={link.key}>
          {index > 0 ? separator : null}
          <Link href={link.href}>{link.label}</Link>
          {link.after}
        </Fragment>
      ))}
    </>
  );
}
