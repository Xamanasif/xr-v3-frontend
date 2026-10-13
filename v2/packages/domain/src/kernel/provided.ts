/**
 * Figures and facts the service supplies as data — never derived by `@xr/domain` or a screen
 * (Appendix C §1.7): licences "as approved by BITS" (T-06 / D7), "Last saved …" / "Last session
 * reported …" times (OD-B3-07), runtime session counts.
 *
 * No function in this package computes remaining, used, free or "in use" licences (Appendix F
 * WP-0.9 acceptance 6). A `Provided` value is passed through unchanged.
 */
declare const providedMark: unique symbol;

export type Provided<T> = T & { readonly [providedMark]: true };

/** Marks a value as supplied data. The value is returned unchanged. */
export function provided<T>(value: T): Provided<T> {
  return value as Provided<T>;
}
