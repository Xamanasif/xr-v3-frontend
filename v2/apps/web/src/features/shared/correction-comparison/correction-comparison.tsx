import { COMPARISON, comparisonFieldLabel } from '@/copy/corrections';
import type { CorrectionComparisonRow } from '@/queries/correction-view';

/**
 * The shared comparison of a correction (B6-09 `div.xg-cmp`, repeated on B6-04 and B7-05): the
 * changed fields only — "Field · Live now · Proposed" — the proposed value marked; below 760 px of
 * content each row stacks with its labels (the v46 sheet). One component for CM-08, RV-04 and
 * SA-11, so the three roles read the same comparison of the one UPD record (BC14).
 *
 * The board marks only the container and the head row as table parts; here every row and cell
 * carries its role (`row`, `rowheader`, `cell`) so a screen reader reads a complete table
 * (axe `aria-required-children`). An empty comparison is the caller's to word (B6-09 f1 "Nothing
 * changed yet.").
 */
export function CorrectionComparison({
  rows,
  label = COMPARISON.label,
  columns = { before: COMPARISON.liveNow, after: COMPARISON.proposed },
}: {
  readonly rows: readonly CorrectionComparisonRow[];
  readonly label?: string;
  /** The two value columns' words: "Live now · Proposed", or once released "Live before · Released" (B7-05 f6). */
  readonly columns?: { readonly before: string; readonly after: string };
}) {
  return (
    <div className="xg-cmp" role="table" aria-label={label}>
      <div className="xg-cmp-row xg-cmp-head" role="row">
        <div role="columnheader">{COMPARISON.field}</div>
        <div role="columnheader">{columns.before}</div>
        <div role="columnheader">{columns.after}</div>
      </div>
      {rows.map((row) => (
        <div key={`${row.field}-${row.format ?? ''}`} className="xg-cmp-row" role="row">
          <div className="xg-cmp-f" role="rowheader">
            {comparisonFieldLabel(row)}
          </div>
          <div className="xg-cmp-cur" role="cell">
            <span className="xg-cmp-lab">{columns.before}</span>
            {row.liveNow ?? ''}
          </div>
          <div className="xg-cmp-pro" role="cell">
            <span className="xg-cmp-lab">{columns.after}</span>
            {row.proposed ?? ''}
          </div>
        </div>
      ))}
    </div>
  );
}
