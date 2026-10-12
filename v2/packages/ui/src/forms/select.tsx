'use client';

import type { Ref, SelectHTMLAttributes } from 'react';

import { Icon } from '../foundation/icon.js';
import { joinClasses } from '../internal/classes.js';
import { useFieldControl } from './field.js';

/** One option, in the caller's order and words ("ME ZG523 — Thermodynamics & Heat Transfer"). */
export interface SelectOption {
  /** The visible text. Put the code first so a clipped value stays recognisable (board 03). */
  readonly label: string;
  /**
   * The submitted value. Omitted, the option has no `value` attribute and its value is its
   * text, as board 03 draws the options.
   */
  readonly value?: string;
  readonly disabled?: boolean;
}

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'children' | 'multiple' | 'aria-invalid' | 'className'
> {
  readonly options: readonly SelectOption[];
  /** Shows the invalid state. Inside a Field it follows the Field's `error`. */
  readonly invalid?: boolean;
  /** Board context classes on the `select` (v46 classes only). */
  readonly className?: string;
  readonly ref?: Ref<HTMLSelectElement>;
}

/**
 * The v46 select (board 03 "Form controls"): a native `select.xr-select` (`appearance:none`, a
 * clipped value ends with an ellipsis) inside `div.xr-select-wrap` with the drawn Chevron down.
 * Inside a Field it takes the Field's id, `aria-describedby` and `aria-invalid`. For a short set
 * of long names use a radio list instead (board 03 "Long values · at 375 and 768").
 */
export function Select({
  options,
  invalid,
  id,
  className,
  ref,
  'aria-describedby': describedBy,
  ...rest
}: SelectProps) {
  const field = useFieldControl();
  const isInvalid = invalid ?? field?.['aria-invalid'] === true;
  return (
    <div className="xr-select-wrap">
      <select
        {...rest}
        ref={ref}
        id={id ?? field?.id}
        className={joinClasses('xr-select', className)}
        aria-invalid={isInvalid ? true : undefined}
        aria-describedby={describedBy ?? field?.['aria-describedby']}
      >
        {options.map((option, index) => (
          <option
            key={`${index}:${option.value ?? option.label}`}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      <Icon name="chevronDown" />
    </div>
  );
}
