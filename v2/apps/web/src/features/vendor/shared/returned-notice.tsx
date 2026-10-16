'use client';

import type { AcademicReviewDecision, ContentManagerDecision, ReturnReference } from '@xr/domain';
import type { Submission } from '@xr/domain';
import { Button, Icon } from '@xr/ui';
import { useId, type Ref } from 'react';

import { dateTime } from '@/copy/dates';
import { returnedByHeading, wordsOf } from '@/copy/flow-state-words';
import { stateWords } from '@/copy/state-copy';
import {
  goToReferenceLabel,
  referenceWords,
  RETURNED,
  returnedWhenWords,
} from '@/copy/vendor-editor';

/** The last return of a record (`ProductionService.getRecord`'s `lastReturn`). */
export type LastReturn = AcademicReviewDecision | ContentManagerDecision | null;

export interface ReturnedNoticeProps {
  /** The decision that returned it: the Academic Reviewer's, or the Content Manager's send-back. */
  readonly lastReturn: LastReturn;
  /** The record, for who returned it (`status.by`) when it is returned now. */
  readonly submission: Submission;
  /**
   * Makes each "What it refers to" a button that opens its step and field (VE-08, B5-07 f0 `r.go`);
   * without it they are plain lines, as the record draws them (B5-06 `li.xv-ref`).
   */
  readonly onJump?: (reference: ReturnReference) => void;
  /** The section's id (the board's `Vm-reason`, a focus target after "Revise & resubmit"). */
  readonly id?: string;
  readonly ref?: Ref<HTMLElement>;
}

interface ReturnFacts {
  readonly by: 'academic-reviewer' | 'content-manager' | 'super-admin-override';
  readonly at: string;
  readonly who: string;
  readonly reason: string;
  readonly references: readonly ReturnReference[];
}

function factsOf(lastReturn: LastReturn, submission: Submission): ReturnFacts | null {
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

function nameOf(actor: AcademicReviewDecision['decidedBy']): string {
  if (actor.kind === 'person') return actor.displayName;
  if (actor.kind === 'requester') return actor.name;
  return '';
}

/**
 * Returned by whom, when, the reason in their words and what it refers to (B5-07 f0 … f2, f7, f8;
 * B5-06 f3, f6): `section.xv-reason` with the quote icon, `h2.xr-h3`, the meta line, the reason in
 * `blockquote.xv-quote` and, when references were given, "What it refers to" — buttons that jump
 * to the step and field in revise mode (`onJump`), plain lines on the record. Nothing renders when
 * the record has no return to show.
 */
export function ReturnedNotice({ lastReturn, submission, onJump, id, ref }: ReturnedNoticeProps) {
  const headingId = useId();
  const facts = factsOf(lastReturn, submission);
  if (facts === null) return null;
  const heading = wordsOf(returnedByHeading(facts.by)) ?? stateWords('VE-08.returned-by-override');
  return (
    <section className="xv-reason" id={id} tabIndex={-1} aria-labelledby={headingId} ref={ref}>
      <div className="xv-reason-head">
        <Icon name="quote" />
        <div>
          <h2 className="xr-h3 m-0" id={headingId}>
            {heading}
          </h2>
          <span className="xr-meta">{returnedWhenWords(dateTime(facts.at), facts.who)}</span>
        </div>
      </div>
      <blockquote className="xv-quote">{facts.reason}</blockquote>
      {facts.references.length > 0 ? (
        <div className="xv-refs">
          <span className="xr-label m-0">{RETURNED.refersTo}</span>
          <ul>
            {facts.references.map((reference) =>
              onJump ? (
                <li key={referenceWords(reference)}>
                  <Button
                    variant="text"
                    icon="next"
                    className="min-h-9 pl-0"
                    aria-label={goToReferenceLabel(reference)}
                    onClick={() => onJump(reference)}
                  >
                    {referenceWords(reference)}
                  </Button>
                </li>
              ) : (
                <li key={referenceWords(reference)} className="xv-ref">
                  <Icon name="next" />
                  {referenceWords(reference)}
                </li>
              ),
            )}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
