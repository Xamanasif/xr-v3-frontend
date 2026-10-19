'use client';

import type { FormEventHandler, ReactNode, Ref } from 'react';

import { useLinkComponent } from '../link.js';
import { useFieldControl, type TextInputProps } from './fields.js';
import { Glyph } from './icons.js';
import { StatusPill, type StatusTone } from './status.js';

/**
 * XS-07 Help & support, as the owner-approved Entry & shared export draws it
 * (design/v3-refined-b/roles/XS-v6, `XsHelp`): My reports, Report a problem, Report sent and a
 * report's detail, in a 920 px reading column. The pieces the kit does not have; the page heads,
 * fields, error summary, list states, notices, definition list and timeline are the shared V3
 * components. The application owns the records and the commands; the Super Admin variant shows
 * no reference anywhere (owner decision 6).
 */

/** The reading column every Help view sits in (`div.xs-read`, 920 px). */
export function HelpColumn({ children }: { readonly children: ReactNode }) {
  return <div className="xs-read">{children}</div>;
}

export interface ReportListSurfaceProps {
  /** "My reports" (`h2.rb-h2`, a focus target after "Try again"). */
  readonly title: ReactNode;
  readonly titleId: string;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** Beside it (`p.rb-note`): "3 reports · newest first"; none while loading or empty. */
  readonly note?: ReactNode;
  /** While the list loads (`aria-busy`). */
  readonly busy?: boolean;
  /** The rows, or the empty, loading or failed state. */
  readonly children: ReactNode;
}

/** The My reports surface (`section.rk-surface` > `div.xs-sec-h`). */
export function ReportListSurface({
  title,
  titleId,
  titleRef,
  note,
  busy,
  children,
}: ReportListSurfaceProps) {
  return (
    <section className="rk-surface" aria-labelledby={titleId} aria-busy={busy || undefined}>
      <div className="xs-sec-h">
        <h2 ref={titleRef} className="rb-h2" id={titleId} tabIndex={-1}>
          {title}
        </h2>
        {note ? <p className="rb-note">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

export interface ReportRow {
  /** The report's own address. */
  readonly href: string;
  /** The title (`span.xs-report-t`). */
  readonly title: ReactNode;
  /** "SUP-0211 · Sent 1 Oct 2026 · Reopened 6 Oct 2026" — no reference for a Super Admin. */
  readonly meta: ReactNode;
  readonly status: { readonly tone: Extract<StatusTone, 'info' | 'ok'>; readonly label: string };
}

/** The person's own reports, newest first (`ul.xs-reports` > `a.xs-report`). */
export function ReportRows({ rows }: { readonly rows: readonly ReportRow[] }) {
  const Link = useLinkComponent();
  return (
    <ul className="xs-reports">
      {rows.map((row) => (
        <li key={row.href}>
          <Link className="xs-report" href={row.href}>
            <span className="xs-report-main">
              <span className="xs-report-t">{row.title}</span>
              <span className="xs-report-m">{row.meta}</span>
            </span>
            <StatusPill tone={row.status.tone}>{row.status.label}</StatusPill>
            <Glyph name="chevronRight" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Report a problem (`form.rk-surface.xs-form-surface`), validated by the application's service. */
export function ReportFormSurface({
  labelledBy,
  onSubmit,
  children,
}: {
  /** The page's H1. */
  readonly labelledBy: string;
  readonly onSubmit: FormEventHandler<HTMLFormElement>;
  readonly children: ReactNode;
}) {
  return (
    <form
      className="rk-surface xs-form-surface"
      noValidate
      aria-labelledby={labelledBy}
      onSubmit={onSubmit}
    >
      {children}
    </form>
  );
}

/** "(optional)" after a label (`span.xs-opt`). */
export function OptionalMark({ children }: { readonly children: ReactNode }) {
  return <span className="xs-opt">{children}</span>;
}

/** The screenshot control (`input.xs-file[type=file]`), wired by its V3 Field. */
export function FileInput({ ref, ...rest }: Omit<TextInputProps, 'type' | 'value'>) {
  const control = useFieldControl();
  if (!control) throw new Error('FileInput goes inside a V3 Field.');
  return <input {...rest} {...control} ref={ref} type="file" className="xs-file" />;
}

/** The form's buttons (`div.xs-form-act`): Send report, then Cancel. */
export function FormActions({ children }: { readonly children: ReactNode }) {
  return <div className="xs-form-act">{children}</div>;
}

/** A section of the report's sheet (`div.rk-sec` > `div.rk-sec-h` > `h2.rk-h3` + note). */
export function ReportSection({
  title,
  note,
  children,
}: {
  readonly title: ReactNode;
  /** "Newest first". */
  readonly note?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className="rk-sec">
      <div className="rk-sec-h">
        <h2 className="rk-h3">{title}</h2>
        {note ? <p className="rb-note">{note}</p> : null}
      </div>
      {children}
    </div>
  );
}

/** The line under a report (`p.xs-help-foot`): "Something else isn’t working? Report a problem". */
export function HelpFoot({ children }: { readonly children: ReactNode }) {
  return <p className="xs-help-foot">{children}</p>;
}
