import type { Out, vendorOverviewOutput } from '@xr/contracts/draft';
import type { AttentionAction, IconName, RowTone } from '@xr/ui';

import { dayMonthYear } from '@/copy/dates';
import {
  draftSub,
  draftTitle,
  returnedSub,
  returnedTitle,
  reviseLabel,
  VENDOR_OVERVIEW_WORDS,
} from '@/copy/vendor-home';
import { type EditorStepSlug, editDraftAddress, reviseAddress } from '@/nav/vendor';

/**
 * VE-01's “Needs your action” rows, written from the service's facts (B5-01; PC-62 facts, never
 * words). Pure: the page draws what these return.
 */

export type VendorOverviewAnswer = Out<typeof vendorOverviewOutput>;
export type VendorAttention = VendorOverviewAnswer['attention'][number];

export interface AttentionRow {
  readonly key: string;
  readonly icon: IconName;
  readonly tone: RowTone;
  readonly title: string;
  readonly sub: string;
  readonly action: AttentionAction;
}

/**
 * The rows in the service's order — each returned experiment (oldest decision first), then each
 * draft (oldest save first). The first row's action is the page's primary, the others secondary
 * (B5-01 script `a.primary = i === 0`; state-copy `VE-01.attention`). A returned experiment's
 * “Revise “<name>”” opens the editor in revise mode (VE-08); a draft's “Finish draft” opens it at
 * the step it last reached (VE-09; state-copy `VE-01.finish-draft`), the first step while that is
 * not known.
 */
export function attentionRows(
  attention: readonly VendorAttention[],
  lastStepOf: (submissionId: string) => EditorStepSlug | undefined,
): AttentionRow[] {
  return attention.map((fact, index) => {
    const variant = index === 0 ? 'primary' : 'secondary';
    if (fact.kind === 'returned') {
      return {
        key: `returned:${fact.submissionId}`,
        icon: 'failed',
        tone: 'err',
        title: returnedTitle(fact.name),
        sub: returnedSub(fact.by, dayMonthYear(fact.at), fact.reason),
        action: { label: reviseLabel(fact.name), href: reviseAddress(fact.submissionId), variant },
      };
    }
    return {
      key: `draft:${fact.submissionId}`,
      icon: 'marking',
      tone: 'info',
      title: draftTitle(fact.name),
      sub: draftSub(dayMonthYear(fact.savedAt)),
      action: {
        label: VENDOR_OVERVIEW_WORDS.finishDraft,
        href: editDraftAddress(fact.submissionId, lastStepOf(fact.submissionId)),
        variant,
      },
    };
  });
}
