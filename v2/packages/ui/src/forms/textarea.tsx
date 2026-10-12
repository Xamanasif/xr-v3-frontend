'use client';

import type { Ref, TextareaHTMLAttributes } from 'react';

import { joinClasses } from '../internal/classes.js';
import { useFieldControl } from './field.js';

export interface TextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'children' | 'aria-invalid' | 'className'
> {
  /** Shows the invalid state. Inside a Field it follows the Field's `error`. */
  readonly invalid?: boolean;
  /** Board context classes on the `textarea` (v46 classes only). */
  readonly className?: string;
  readonly ref?: Ref<HTMLTextAreaElement>;
}

/**
 * The v46 textarea (`textarea.xr-textarea`, min-height 128, resizes vertically; board 03 "Form
 * controls", board 10 DL-2 reason). Inside a Field it takes the Field's id, `aria-describedby`
 * and `aria-invalid`; explicit props win. The long-answer height (`xa-q .xr-textarea`, 168) comes
 * from its assessment ancestor, not from a prop.
 */
export function Textarea({
  invalid,
  id,
  className,
  ref,
  'aria-describedby': describedBy,
  ...rest
}: TextareaProps) {
  const field = useFieldControl();
  const isInvalid = invalid ?? field?.['aria-invalid'] === true;
  return (
    <textarea
      {...rest}
      ref={ref}
      id={id ?? field?.id}
      className={joinClasses('xr-textarea', className)}
      aria-invalid={isInvalid ? true : undefined}
      aria-describedby={describedBy ?? field?.['aria-describedby']}
    />
  );
}
