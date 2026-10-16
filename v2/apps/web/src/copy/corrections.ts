/**
 * Words the correction chain's three roles share (Phase 6; boards B6-04, B6-09, B7-05, B7-11): the
 * comparison of the live version with the proposed one — "Changed fields only", the same component
 * on CM-08, RV-04 and SA-11 (B6-09 `FIELDS`, repeated by B6-04 and B7-05). A correction never
 * says "Publish" (BC8): it is released or held.
 */
import type { correctionComparisonRow, Out } from '@xr/contracts/draft';

type CorrectionComparisonRow = Out<typeof correctionComparisonRow>;

export const COMPARISON = {
  /** `div.xg-cmp[aria-label]` and B6-09's section heading "Current and proposed". */
  label: 'Current and proposed',
  /** B6-04 f0 / B7-05 f1 section heading and its meta. */
  whatChanges: 'What changes',
  changedOnly: 'Changed fields only',
  field: 'Field',
  liveNow: 'Live now',
  proposed: 'Proposed',
  /** B6-09 f1: a draft with no change yet. */
  nothingChanged: 'Nothing changed yet.',
} as const;

const FIELD_LABEL = {
  name: 'Name',
  summary: 'Summary',
  description: 'Description',
  webLink: 'WEB · web link',
  version: 'Version',
} as const;

/**
 * A row's field, as the boards' `FIELDS` name it: "Description", "WEB · web link", "VR · package
 * reference" (AR and MR package references are not drawn; they follow the VR formula), "Version".
 */
export function comparisonFieldLabel(row: CorrectionComparisonRow): string {
  if (row.field === 'packageReferences')
    return `${(row.format ?? 'vr').toUpperCase()} · package reference`;
  return FIELD_LABEL[row.field];
}
