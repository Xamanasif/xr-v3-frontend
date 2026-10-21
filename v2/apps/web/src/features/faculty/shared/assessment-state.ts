import type { AssessmentReadiness } from '@xr/domain';
import type { StatusTone } from '@xr/ui/v3';

import { READINESS_WORDS } from '@/copy/assessment-words';
import { FA_ASSESSMENT_STATE_WORDS } from '@/copy/fa-shared';

/** A status pill's tone and words. */
export interface StatusView {
  readonly tone: StatusTone;
  readonly words: string;
}

/**
 * An assessment's state as the V3 pages draw it (the export's `asmState`: FA-01 … FA-06, FA-08 …
 * FA-12): Ready is the ok tick; a draft and no assessment are the neutral dot. The words are the
 * shared readiness labels ("Ready", "Draft — not ready") and "No assessment yet"; `null` is an
 * experiment with no assessment.
 */
export function assessmentStateView(readiness: AssessmentReadiness | null): StatusView {
  if (readiness === null) return { tone: 'neutral', words: FA_ASSESSMENT_STATE_WORDS.none };
  return readiness === 'ready'
    ? { tone: 'ok', words: READINESS_WORDS.ready.label }
    : { tone: 'neutral', words: READINESS_WORDS['draft-not-ready'].label };
}

/**
 * The teaching pages' longer state words (the export's `stLabelOf`: FA-01's teaching list, FA-02's
 * ledger, FA-03's assessment column): "Assessment ready", "Assessment in draft", "No assessment
 * yet", with the same tones.
 */
export function assessmentStateLongView(readiness: AssessmentReadiness | null): StatusView {
  const view = assessmentStateView(readiness);
  if (readiness === null) return view;
  return {
    tone: view.tone,
    words:
      readiness === 'ready'
        ? FA_ASSESSMENT_STATE_WORDS.readyLong
        : FA_ASSESSMENT_STATE_WORDS.draftLong,
  };
}
