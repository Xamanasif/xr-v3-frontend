'use client';

import type { ReactNode } from 'react';

import { useLinkComponent } from '../link.js';
import { QuietLine, SectionNote } from './sa.js';

/*
 * Super Admin V3 components for SA-22 Access ending (the owner-approved Super Admin export,
 * design/v3-refined-b/roles/SA-v1, `project/sa-views-d.js` `V.accessEnding`). Markup as the
 * export's view emits it; every word, figure, date and destination comes from the caller. What
 * SA-18 … SA-21 share with other screens is in `sa.tsx` (`SwitchToolbar`, `QuietLine`,
 * `SectionNote`, `GoButton`) and the kit (`DecisionOutcome`, `ConfirmDialog`).
 */

export interface OperationsSectionHeadProps {
  /** "Ending within 15 days, or recently ended". */
  readonly title: ReactNode;
  readonly titleId?: string;
  /** The line beside it: "As of 23 Oct 2026 · soonest first". */
  readonly note?: ReactNode;
}

/**
 * The head of a list surface that names its list (`div.rk-sec-h.sa-pad` > `h2.rb-h2` + the note;
 * SA-22). The export writes the note as `p.rk-note`, a class no sheet defines: it is the
 * `SectionNote` it renders as.
 */
export function OperationsSectionHead({ title, titleId, note }: OperationsSectionHeadProps) {
  return (
    <div className="rk-sec-h sa-pad">
      <h2 className="rb-h2" id={titleId}>
        {title}
      </h2>
      {note ? <SectionNote>{note}</SectionNote> : null}
    </div>
  );
}

export interface OperationsRowHeadProps {
  /** The record the row names: SA-22's institution, opening its page. */
  readonly href: string;
  readonly name: ReactNode;
  /** The quiet line under it (`span.rk-small`): "External". */
  readonly detail?: ReactNode;
}

/** The name of a read-only table row as a link, with its quiet line (SA-22 "Institution"). */
export function OperationsRowHead({ href, name, detail }: OperationsRowHeadProps) {
  const Link = useLinkComponent();
  return (
    <>
      <Link href={href}>{name}</Link>
      {detail ? <QuietLine>{detail}</QuietLine> : null}
    </>
  );
}
