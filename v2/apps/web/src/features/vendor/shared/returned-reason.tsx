'use client';

import type {
  AcademicReviewDecision,
  ContentManagerDecision,
  ReturnReference,
  Submission,
} from '@xr/domain';
import { VendorReturnedReason } from '@xr/ui/v3';
import type { Ref } from 'react';

import { dateTime } from '@/copy/dates';
import { returnedByHeading, wordsOf } from '@/copy/flow-state-words';
import { stateWords } from '@/copy/state-copy';
import { referenceWords, returnedWhenWords } from '@/copy/vendor-editor';

/** The last return of a record (`ProductionService.getRecord`'s `lastReturn`). */
export type LastReturn = AcademicReviewDecision | ContentManagerDecision | null;

/** Who returned it, when, the reason in their words and what it refers to. */
export interface ReturnFacts {
  readonly by: 'academic-reviewer' | 'content-manager' | 'super-admin-override';
  readonly at: string;
  readonly who: string;
  readonly reason: string;
  readonly references: readonly ReturnReference[];
}

function nameOf(actor: AcademicReviewDecision['decidedBy']): string {
  if (actor.kind === 'person') return actor.displayName;
  if (actor.kind === 'requester') return actor.name;
  return '';
}

/**
 * The return a record shows (`ProductionService.getRecord`'s `lastReturn`): who returned it, when,
 * the reason and its references — or `null` when there is no return to show (an override). The
 * record (VE-07: the panel, "Where it stands") and the editor in revise mode (VE-08: the panel, the
 * fields it tags) read the same facts.
 */
export function returnFactsOf(lastReturn: LastReturn, submission: Submission): ReturnFacts | null {
  if (lastReturn === null) return null;
  const byNow = submission.status.state === 'returned' ? submission.status.by : null;
  if ('decision' in lastReturn) {
    if (lastReturn.decision !== 'return-to-vendor') return null;
    return {
      by: byNow ?? 'academic-reviewer',
      at: lastReturn.decidedAt,
      who: nameOf(lastReturn.decidedBy),
      reason: lastReturn.reason ?? '',
      references: lastReturn.references,
    };
  }
  if (lastReturn.kind !== 'send-back-to-vendor') return null;
  return {
    by: byNow ?? 'content-manager',
    at: lastReturn.at,
    who: nameOf(lastReturn.by),
    reason: lastReturn.reason,
    references: lastReturn.references,
  };
}

export interface ReturnedReasonPanelProps {
  /** The return (`returnFactsOf`). */
  readonly facts: ReturnFacts;
  /** The panel's id: a focus target (the export's `ve-reason`); its title `<id>-t`. */
  readonly id: string;
  /**
   * "What it refers to" as chips, each named for where it goes and opening its field in the editor
   * (the record: `startRevise(id, field)`; the editor: the step and the field). Without it the
   * references are not drawn (a record that can't be revised).
   */
  readonly references?: {
    readonly label: string;
    readonly nameOf: (reference: ReturnReference) => string;
    readonly onSelect: (reference: ReturnReference) => void;
  };
  /** The changes saved and not resubmitted (the record): their title and line. */
  readonly saved?: { readonly title: string; readonly line: string };
  readonly ref?: Ref<HTMLElement>;
}

/**
 * The returned-reason panel (VE-v1 `section.vr-ret`; VE-07 the record, VE-08 above the editor):
 * who returned it and when, the reason in their words, "What it refers to" as chips and, on the
 * record, the changes saved and not resubmitted (state-copy `VE-07.saved-changes`; without the
 * changed fields, which the read does not hold).
 */
export function ReturnedReasonPanel({
  facts,
  id,
  references,
  saved,
  ref,
}: ReturnedReasonPanelProps) {
  return (
    <VendorReturnedReason
      id={id}
      ref={ref}
      titleId={`${id}-t`}
      title={wordsOf(returnedByHeading(facts.by)) ?? stateWords('VE-08.returned-by-override')}
      meta={returnedWhenWords(dateTime(facts.at), facts.who)}
      reason={facts.reason}
      references={
        references
          ? {
              label: references.label,
              labelId: `${id}-rk`,
              items: facts.references.map((reference) => ({
                key: `${reference.step}:${reference.format ?? ''}:${reference.field}`,
                label: referenceWords(reference),
                accessibleName: references.nameOf(reference),
                onSelect: () => references.onSelect(reference),
              })),
            }
          : undefined
      }
      saved={saved}
    />
  );
}
