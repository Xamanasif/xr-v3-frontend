/**
 * The correction chain's read-model types (Phase 6), for the features: they import contracts for
 * types only (Appendix F §3.8), so the shapes are named here, beside the queries that read them.
 */
import type {
  correctionComparisonRow,
  getUpdateOutput,
  listUpdatesForReleaseOutput,
  listUpdatesOutput,
  Out,
  updateDecisionOutput,
  updateForReviewOutput,
} from '@xr/contracts/draft';

/** One "Live now / Proposed" row: a changed field only (CM-08, RV-04, SA-11). */
export type CorrectionComparisonRow = Out<typeof correctionComparisonRow>;
/** CM-08 detail: the update and its comparison. */
export type CorrectionUpdateView = Out<typeof getUpdateOutput>;
/** CM-08 list rows. */
export type MyUpdateRow = Out<typeof listUpdatesOutput>[number];
/** RV-04: the update, its comparison, the live version and whether it is decided. */
export type UpdateForReviewView = Out<typeof updateForReviewOutput>;
/** SA-10 rows. */
export type ReleaseRow = Out<typeof listUpdatesForReleaseOutput>[number];
/** SA-11: the update, its comparison, the live line and the institutions using it. */
export type UpdateDecisionView = Out<typeof updateDecisionOutput>;
