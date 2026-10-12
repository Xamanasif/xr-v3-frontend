import { joinClasses } from '../internal/classes.js';

export interface IdChipProps {
  /**
   * The record ID exactly as the record carries it: prefix + 4 digits ("REQ-0042", "SACC-0310",
   * "UPD-0005"; B8-03) or an institution's own number ("GIT-2026-0418", board 03). Never
   * reformatted here.
   */
  readonly children: string;
  /** Board context classes (`xr-sub` in table cells, B-boards `xr-sub xr-id`). */
  readonly className?: string;
}

/**
 * A record ID in the system monospace (`span.xr-id`; board 02 "Reference IDs": "System monospace
 * for record IDs only. No extra font download."). Static: no hooks, safe in server components.
 */
export function IdChip({ children, className }: IdChipProps) {
  return <span className={joinClasses(className, 'xr-id')}>{children}</span>;
}
