'use client';

import type { InputHTMLAttributes, Ref } from 'react';

import { joinClasses } from '../internal/classes.js';
import { useFieldControl } from './field.js';

export interface FileInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'children' | 'value' | 'defaultValue' | 'aria-invalid' | 'className'
> {
  /** Board context classes on the `input` (v46 classes only). */
  readonly className?: string;
  /** The native file input (the product reads the chosen files from it). */
  readonly ref?: Ref<HTMLInputElement>;
}

/**
 * The v46 native file input (`input.xr-file`, its button drawn by `::file-selector-button`;
 * board 03 "Textarea · select · file", board 07 "State 1 · Report a problem · Student"). Like
 * TextInput, Select and Textarea it is the control only: the label, the "(optional)" marker and
 * the hint come from the Field it sits in, whose id, `aria-describedby` and `aria-invalid` it takes
 * (explicit props win). States are the browser's own: empty ("No file chosen") and chosen (the
 * file name). Every other attribute (`accept`, `multiple`, `name`, `onChange`, …) goes to the
 * input. CSV import with a template and a row report (`xw-file`, `xw-counts`, `xw-cols`; B2-07,
 * B4-08) is Phase 2 and is not built here.
 */
export function FileInput({
  id,
  className,
  ref,
  'aria-describedby': describedBy,
  ...rest
}: FileInputProps) {
  const field = useFieldControl();
  return (
    <input
      {...rest}
      ref={ref}
      id={id ?? field?.id}
      className={joinClasses('xr-file', className)}
      type="file"
      aria-invalid={field?.['aria-invalid'] === true ? true : undefined}
      aria-describedby={describedBy ?? field?.['aria-describedby']}
    />
  );
}
