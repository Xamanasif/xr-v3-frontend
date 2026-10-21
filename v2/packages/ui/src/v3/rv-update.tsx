import type { ReactNode } from 'react';

import { RvBlock, RvBlockHead, RvFootnote, RvOutcomesReadOnly } from './rv.js';

/**
 * What only the Academic Reviewer's update group draws (owner-approved export
 * design/v3-refined-b/roles/RV-v1, `project/RV.dc.html` RV-04 "Review an update" and RV-06 for an
 * update). Everything else on the update page — the identity card, the blocks, the comparison, the
 * decision panel's parts, the history — is drawn by the shared reviewer pieces (`rv.tsx`). Every
 * word, figure and destination comes from the caller.
 */

export interface RvLiveExperimentProps {
  /** The heading's id (`rv-s-live`): the page map's target and the section's name. */
  readonly titleId: string;
  /** The kicker above the heading (`p.rv-block-k`): "Read-only context". */
  readonly kicker: ReactNode;
  /** "The live experiment". */
  readonly title: ReactNode;
  /** The note at the head's end (`p.rb-note`): "Version 1.2 · live since 3 Jul 2026". */
  readonly note?: ReactNode;
  /** "Learning outcomes in version 1.2" (`h3.rv-mini-h`). */
  readonly outcomesTitle: ReactNode;
  /** The live version's learning outcomes, in order (`ol.rv-lo-ro`); none: the list is left out. */
  readonly outcomes: readonly ReactNode[];
  /** "Learning outcomes are not part of this correction." (`p.rv-footnote`). */
  readonly footnote: ReactNode;
}

/**
 * "The live experiment" (`section.rk-surface.rv-block` `#rv-s-live`; RV.dc.html `I.hasLive`): the
 * version live now and since when, and its learning outcomes read-only — a correction does not
 * change them (OD-B6-09). The heading takes focus from the page map (`tabIndex={-1}`).
 */
export function RvLiveExperiment({
  titleId,
  kicker,
  title,
  note,
  outcomesTitle,
  outcomes,
  footnote,
}: RvLiveExperimentProps) {
  return (
    <RvBlock labelledBy={titleId}>
      <RvBlockHead titleId={titleId} title={title} kicker={kicker} note={note} />
      {outcomes.length > 0 ? (
        <>
          <h3 className="rv-mini-h">{outcomesTitle}</h3>
          <RvOutcomesReadOnly outcomes={outcomes} />
        </>
      ) : null}
      <RvFootnote>{footnote}</RvFootnote>
    </RvBlock>
  );
}
