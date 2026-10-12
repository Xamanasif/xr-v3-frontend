'use client';

import { createContext, useContext, useId, type ReactNode } from 'react';

import { Icon } from '../foundation/icon.js';
import { joinClasses } from '../internal/classes.js';

/**
 * What a Field gives the control it wraps: the id its label points at, the ids of its hint and
 * error (`aria-describedby`, hint first), and `aria-invalid` while it shows an error.
 */
export interface FieldControl {
  readonly id: string;
  readonly 'aria-describedby'?: string;
  readonly 'aria-invalid'?: true;
}

const FieldContext = createContext<FieldControl | null>(null);

/**
 * The control wiring of the nearest Field, or `null` outside one. TextInput, Select and Textarea
 * read it; any other control can too (a file input, a control built later).
 */
export function useFieldControl(): FieldControl | null {
  return useContext(FieldContext);
}

/** `aria-describedby` from the ids that exist (hint first, then error), or nothing. */
export function describedByIds(...ids: readonly (string | undefined)[]): string | undefined {
  return ids.filter(Boolean).join(' ') || undefined;
}

/** Which drawn class the error line uses. */
export type FieldErrorClass = 'xr-error' | 'xw-ferr';

export interface FieldErrorProps {
  readonly id?: string;
  /**
   * `xr-error` (boards 03, 10, 09b and most product boards) or `xw-ferr` (workspace product
   * boards: B2-07 "IA-10 Add student · 1440 · interactive", B2-08, B3-07). Same look, same markup.
   */
  readonly variant?: FieldErrorClass;
  /** The error in words, from the caller — never invented here. */
  readonly children: ReactNode;
}

/**
 * The error line under a field or a group, as every board draws it: the Failed icon then the
 * words (`<span class="xr-error" id="…-e"><svg …/>Enter a full e-mail address…</span>`). It is not
 * a live region: the field's message is in its description, and the page's error summary is the
 * alert (board 12 "Errors": "the field's message is in its description").
 */
export function FieldError({ id, variant = 'xr-error', children }: FieldErrorProps) {
  return (
    <span className={variant} id={id}>
      <Icon name="failed" />
      {children}
    </span>
  );
}

export interface FieldProps {
  /** The visible label, always above the control (09b AR-8: never a placeholder-only label). */
  readonly label: ReactNode;
  /**
   * The marker after the label, rendered verbatim in `span.xr-opt`: the boards draw
   * "(optional)", "(required)", "(required to approve)" and "(from your plan)". Fields are
   * required unless marked (board 03 "Form controls").
   */
  readonly marker?: ReactNode;
  /** `span.xr-hint` between the label and the control, referenced by `aria-describedby`. */
  readonly hint?: ReactNode;
  /**
   * The error in words under the control (`aria-invalid` on the control, referenced by
   * `aria-describedby` after the hint). The caller validates on the primary action and passes
   * the drawn message; the Field never validates and never invents copy.
   */
  readonly error?: ReactNode;
  /** `xr-error` (default) or the workspace boards' `xw-ferr`. */
  readonly errorClass?: FieldErrorClass;
  /**
   * The control's id (an error-summary link points at it). The hint is `<id>-h` and the error
   * `<id>-e`, the boards' commonest suffixes. Generated when omitted.
   */
  readonly id?: string;
  /** Board context classes on `div.xr-field` (`xr-toolbar-search`, `xr-filter-2`). */
  readonly className?: string;
  /**
   * The control. TextInput, Select and Textarea pick up the Field's wiring by themselves; any
   * other control takes it from a render function (`{(control) => <input {...control} … />}`,
   * client components only) or from `useFieldControl()`.
   */
  readonly children: ReactNode | ((control: FieldControl) => ReactNode);
}

/**
 * The v46 form field (`div.xr-field`; board 03 "Form controls", B2-07, board 10): label above,
 * optional marker, hint, the control, and the error in words under it.
 */
export function Field({
  label,
  marker,
  hint,
  error,
  errorClass = 'xr-error',
  id,
  className,
  children,
}: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = hint ? `${controlId}-h` : undefined;
  const errorId = error ? `${controlId}-e` : undefined;
  const describedBy = describedByIds(hintId, errorId);
  const control: FieldControl = {
    id: controlId,
    ...(describedBy ? { 'aria-describedby': describedBy } : {}),
    ...(errorId ? { 'aria-invalid': true as const } : {}),
  };
  return (
    <div className={joinClasses('xr-field', className)}>
      <label className="xr-label" htmlFor={controlId}>
        {label}
        {marker ? (
          <>
            {' '}
            <span className="xr-opt">{marker}</span>
          </>
        ) : null}
      </label>
      {hint ? (
        <span className="xr-hint" id={hintId}>
          {hint}
        </span>
      ) : null}
      <FieldContext value={control}>
        {typeof children === 'function' ? children(control) : children}
      </FieldContext>
      {error ? (
        <FieldError id={errorId} variant={errorClass}>
          {error}
        </FieldError>
      ) : null}
    </div>
  );
}

export interface ReadOnlyValueProps {
  /** What the value is ("Licences", "Access plan", "Moving from"). */
  readonly label: ReactNode;
  /** The value itself (`span.xr-ro-val`). */
  readonly children: ReactNode;
  /**
   * Who has it or why it cannot change, in `span.xr-meta` ("Read-only · set at import"; board
   * 03: "Read-only always says who has it now and when it can change").
   */
  readonly note?: ReactNode;
}

/**
 * A value shown instead of a control (`div.xr-ro`), as the product boards draw it: label, value
 * and an optional note inside the box (B2-05 "IA-05 Give students access · 1440 · interactive ·
 * start here", B3-07 — 34 instances; the note as board 03 "Read-only"). Board 03 "Text input"
 * once draws the label outside the box with `aria-labelledby` on the `div`; that shape is not
 * emitted: ARIA 1.2 prohibits naming a role-less `div` (screen readers ignore the name), whereas
 * the label inside the box is read in order.
 */
export function ReadOnlyValue({ label, children, note }: ReadOnlyValueProps) {
  return (
    <div className="xr-ro">
      <span className="xr-label">{label}</span>
      <span className="xr-ro-val">{children}</span>
      {note ? <span className="xr-meta">{note}</span> : null}
    </div>
  );
}
