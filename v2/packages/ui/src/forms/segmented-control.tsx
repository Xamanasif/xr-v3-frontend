'use client';

import { useState, type ReactNode, type Ref } from 'react';

import { joinClasses } from '../internal/classes.js';

/** One segment: the value it selects and its visible words ("Open", "Resolved", "All"). */
export interface SegmentedOption<Value extends string = string> {
  readonly value: Value;
  readonly label: ReactNode;
}

export interface SegmentedControlProps<Value extends string = string> {
  /**
   * The group's accessible name (`role="group"` + `aria-label`), as the boards draw it:
   * "Show reports" (board 03 "Segmented control"), "Give access to" (B2-05 "Step 2 · students").
   */
  readonly label: string;
  /** The segments, in board order. */
  readonly options: readonly SegmentedOption<Value>[];
  /** The pressed segment (controlled). Exactly one segment is pressed, as every board draws it. */
  readonly value?: Value;
  /** The pressed segment when uncontrolled; defaults to the first option. */
  readonly defaultValue?: Value;
  /** Called with the newly pressed value; pressing the pressed segment again does nothing. */
  readonly onValueChange?: (value: Value) => void;
  /** Board context classes or apps/web composition utilities (no board adds one to `xr-seg`). */
  readonly className?: string;
  readonly ref?: Ref<HTMLDivElement>;
}

/**
 * The v46 segmented control (`div.xr-seg[role=group]` of `button[aria-pressed]`; board 03
 * "Segmented control"). It switches one list's view and is never navigation (board 03: "Switches
 * one list's view. Never navigation."). The segmented-link variant (`xl-seg`, B3-11, B7-09) is
 * Phase 3 and is not built here.
 */
export function SegmentedControl<Value extends string = string>({
  label,
  options,
  value,
  defaultValue,
  onValueChange,
  className,
  ref,
}: SegmentedControlProps<Value>) {
  const [ownValue, setOwnValue] = useState<Value | undefined>(defaultValue ?? options[0]?.value);
  const pressed = value ?? ownValue;
  const press = (next: Value) => {
    if (next === pressed) return;
    if (value === undefined) setOwnValue(next);
    onValueChange?.(next);
  };
  return (
    <div ref={ref} className={joinClasses('xr-seg', className)} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === pressed}
          onClick={() => press(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
