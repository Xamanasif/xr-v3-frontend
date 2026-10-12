'use client';

import type { ButtonHTMLAttributes, MouseEvent, Ref } from 'react';

import type { IconName } from '../icons/registry.js';
import { joinClasses } from '../internal/classes.js';
import { Icon } from './icon.js';

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'children' | 'aria-label' | 'aria-disabled' | 'disabled'
> {
  /** The accessible name — always given: "Close", "Open menu", "Move question 2 up" (board 12). */
  readonly label: string;
  readonly icon: IconName;
  /**
   * Unavailable but still focusable and named, as B4-05 draws it: `aria-disabled="true"`;
   * presses are ignored.
   */
  readonly disabled?: boolean;
  /** Board context classes (`xr-top-collapse`, …). */
  readonly className?: string;
  readonly ref?: Ref<HTMLButtonElement>;
}

/** The v46 icon-only button (`xr-icon-btn`, 44 × 44; boards 03, 10, 12, B4-05). */
export function IconButton({
  label,
  icon,
  disabled = false,
  className,
  onClick,
  ref,
  ...rest
}: IconButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      className={joinClasses('xr-icon-btn', className)}
      aria-label={label}
      aria-disabled={disabled ? true : undefined}
      onClick={handleClick}
    >
      <Icon name={icon} />
    </button>
  );
}
