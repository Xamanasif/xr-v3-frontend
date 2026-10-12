'use client';

import type { InputHTMLAttributes, Ref } from 'react';

import { Icon } from '../foundation/icon.js';
import { joinClasses } from '../internal/classes.js';
import { useFieldControl } from './field.js';

/**
 * The input types the boards draw on `xr-input`: text (board 03), e-mail (board 03, B2-07),
 * search (148 inputs, always inside `xr-search`), native date (B1-07) and tel (B1-07). The
 * password reveal (`xp-pw`, B1-09) is Phase 1 with sign-in (owner decision G-8) and is not built.
 */
export type TextInputType = 'text' | 'email' | 'search' | 'date' | 'tel';

export interface TextInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'children' | 'aria-invalid' | 'className'
> {
  readonly type?: TextInputType;
  /**
   * Shows the invalid state (`aria-invalid="true"`, red border). Inside a Field it follows the
   * Field's `error`; pass it only to override.
   */
  readonly invalid?: boolean;
  /** Board context classes on the `input` (v46 classes only). */
  readonly className?: string;
  readonly ref?: Ref<HTMLInputElement>;
}

/**
 * The v46 text input (`input.xr-input`; board 03 "Form controls"). Inside a Field it takes the
 * Field's id, `aria-describedby` and `aria-invalid`; explicit props win. `type="search"` renders
 * the drawn search box: `div.xr-search` with the leading Search icon (board 03 "Checkbox · radio ·
 * search", 09a toolbar). Read-only is the native `readOnly` attribute; no board draws a read-only
 * input (the drawn read-only value is ReadOnlyValue).
 */
export function TextInput({
  type = 'text',
  invalid,
  id,
  className,
  ref,
  'aria-describedby': describedBy,
  ...rest
}: TextInputProps) {
  const field = useFieldControl();
  const isInvalid = invalid ?? field?.['aria-invalid'] === true;
  const input = (
    <input
      {...rest}
      ref={ref}
      id={id ?? field?.id}
      className={joinClasses('xr-input', className)}
      type={type}
      aria-invalid={isInvalid ? true : undefined}
      aria-describedby={describedBy ?? field?.['aria-describedby']}
    />
  );
  if (type !== 'search') return input;
  return (
    <div className="xr-search">
      <Icon name="search" />
      {input}
    </div>
  );
}
