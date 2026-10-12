/**
 * Joins class names, skipping the empty ones: `joinClasses('xr-btn', busy && 'is-busy')`.
 * Components pass only v46 board classes, `is-*` state classes and the `xr-x-*` allow-list
 * (ADR-0001 §5; `xr/v46-class-names`).
 */
export function joinClasses(...parts: readonly (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
