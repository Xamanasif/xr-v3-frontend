'use client';

/*
 * Super Admin V3 components for SA-06 Institutions and SA-07 Institution detail (the
 * owner-approved Super Admin export, design/v3-refined-b/roles/SA-v1, `project/sa-views-b.js`
 * `V.institutions`, `V.institution`). Markup as the export's views emit it; every word, figure,
 * date and destination comes from the caller. What other screens draw too is shared: the "Needs
 * one" tag is the kit's `MissingTag`, the quiet cell line `QuietLine`, the inline form
 * `InlineForm`, the page `DetailLayout` (`stacked`), the dialogs `ConfirmDialog`.
 *
 * One of the export's wrappers carries a class no stylesheet defines (`div.sa-plan-exp-t`): it is
 * drawn as a plain element here, which renders the same and keeps every emitted class a defined
 * one.
 */
import type { ReactNode } from 'react';

// ── SA-06 Institutions: the table's cells ───────────────────────────────────────────────────

/**
 * A value with the label it carries in the table's narrow layouts (`span.rk-inlabel`, hidden while
 * the table shows its head): "Access ends 31 Oct 2026", "Access ends: not set yet".
 */
export function InstitutionInlineLabel({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <>
      <span className="rk-inlabel">{label} </span>
      {children}
    </>
  );
}

// ── SA-07 Institution detail ────────────────────────────────────────────────────────────────

export interface InstitutionPlanExperiment {
  readonly key: string;
  /** The experiment's name (`p.rk-askrow-t`). */
  readonly title: ReactNode;
  /** The course line (`p.rk-askrow-c`): a CourseCode chip and the course's name in a `span`. */
  readonly course?: ReactNode;
  /** Its formats in the plan: `FormatCells variant="strip"` ("In the plan", …). */
  readonly formats: ReactNode;
}

/**
 * A plan's experiments inside its PlanBand, each with the shared format strip
 * (`div.sa-plan-exps` > `div.sa-plan-exp`; stacked under 760 / 480 px of band width).
 */
export function InstitutionPlanExperiments({
  experiments,
}: {
  readonly experiments: readonly InstitutionPlanExperiment[];
}) {
  return (
    <div className="sa-plan-exps">
      {experiments.map((experiment) => (
        <div key={experiment.key} className="sa-plan-exp">
          <div>
            <p className="rk-askrow-t">{experiment.title}</p>
            {experiment.course ? <p className="rk-askrow-c">{experiment.course}</p> : null}
          </div>
          {experiment.formats}
        </div>
      ))}
    </div>
  );
}

export interface InstitutionFormatActivityItem {
  /** The format's code as drawn ("WEB"); the caller lists them in WEB/AR/VR/MR order. */
  readonly format: string;
  /** "4 started · 2 completed". */
  readonly words: ReactNode;
}

/**
 * Activity per format in one table cell (`ul.sa-byfmt`): the format badge and its own figures —
 * never added up into one figure.
 */
export function InstitutionFormatActivity({
  items,
}: {
  readonly items: readonly InstitutionFormatActivityItem[];
}) {
  return (
    <ul className="sa-byfmt">
      {items.map((item) => (
        <li key={item.format}>
          <span className="xr-fmt">{item.format}</span> {item.words}
        </li>
      ))}
    </ul>
  );
}

/** The institution's students (`ul.sa-people`), one `InstitutionPerson` each. */
export function InstitutionPeople({ children }: { readonly children: ReactNode }) {
  return <ul className="sa-people">{children}</ul>;
}

export interface InstitutionPersonProps {
  /** The person's name (`p.sa-people-n`). */
  readonly name: ReactNode;
  /** The line under it (`p.rk-small`): the institution's student number. */
  readonly detail?: ReactNode;
  /** Their status pill. */
  readonly status: ReactNode;
  /** "Change status" (a ghost button) — absent while its inline form is open. */
  readonly action?: ReactNode;
  /** The inline reason form beside the person it changes (`InlineForm`). */
  readonly children?: ReactNode;
}

/** One person (`li` > `div.sa-people-row`), with the inline form under the row when open. */
export function InstitutionPerson({
  name,
  detail,
  status,
  action,
  children,
}: InstitutionPersonProps) {
  return (
    <li>
      <div className="sa-people-row">
        <div>
          <p className="sa-people-n">{name}</p>
          {detail ? <p className="rk-small">{detail}</p> : null}
        </div>
        {status}
        {action}
      </div>
      {children}
    </li>
  );
}
