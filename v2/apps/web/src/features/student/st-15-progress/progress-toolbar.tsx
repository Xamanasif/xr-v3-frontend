'use client';

import { Button, Field, type FilterChip, Icon, Select, type SelectOption } from '@xr/ui';
import { type ReactNode, useLayoutEffect, useRef } from 'react';

/** One toolbar filter: a select in a field; `xr-filter-2` for the second (B3-05 Course). */
export interface ProgressFilter {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly options: readonly SelectOption[];
  readonly onChange: (value: string) => void;
  readonly className?: string;
}

/**
 * The B3-05 toolbar (f0, f3, f9): `div.xr-toolbar` with Status and Course — the second as
 * `xr-filter-2` with no "More filters", so the v46 sheet leaves it out below 600 px of content
 * ("filters stack", f9) and the shared ListToolbar, which requires "More filters" with a second
 * filter, is not used (as IA-06 does) — then `div.xr-toolbar-status` with the count
 * (`role="status"`, always mounted), the applied-filter chips and "Clear filters". When a chip's
 * remove button or "Clear filters" goes with the focus on it, focus moves to the next chip, else
 * the previous one, else the first select (as ListToolbar does).
 */
export function ProgressToolbar({
  filters,
  status,
  chips,
  onClearFilters,
  clearLabel,
}: {
  readonly filters: readonly ProgressFilter[];
  readonly status: ReactNode;
  readonly chips: readonly FilterChip[];
  readonly onClearFilters?: () => void;
  readonly clearLabel: string;
}) {
  const toolbar = useRef<HTMLDivElement>(null);
  const chipButtons = useRef(new Map<string, HTMLButtonElement>());
  const pending = useRef<{ readonly control: HTMLElement; readonly index: number } | null>(null);

  useLayoutEffect(() => {
    const pressed = pending.current;
    if (pressed === null || pressed.control.isConnected) return;
    pending.current = null;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    const remaining = chips
      .map((chip) => chipButtons.current.get(chip.key))
      .filter((button): button is HTMLButtonElement => Boolean(button));
    const target =
      remaining[pressed.index] ??
      remaining[pressed.index - 1] ??
      toolbar.current?.querySelector<HTMLElement>('select');
    target?.focus();
  });

  return (
    <>
      <div ref={toolbar} className="xr-toolbar">
        {filters.map((filter) => (
          <Field key={filter.id} id={filter.id} label={filter.label} className={filter.className}>
            <Select
              options={filter.options}
              value={filter.value}
              onChange={(event) => filter.onChange(event.target.value)}
            />
          </Field>
        ))}
      </div>
      <div className="xr-toolbar-status">
        <span className="xr-meta" role="status">
          {status}
        </span>
        {chips.map((chip, index) => (
          <span key={chip.key} className="xr-fchip">
            {chip.label}
            <button
              ref={(element) => {
                if (element) chipButtons.current.set(chip.key, element);
                else chipButtons.current.delete(chip.key);
              }}
              type="button"
              aria-label={chip.removeLabel ?? `Remove ${chip.label}`}
              onClick={(event) => {
                pending.current = { control: event.currentTarget, index };
                chip.onRemove();
              }}
            >
              <Icon name="close" size={16} />
            </button>
          </span>
        ))}
        {onClearFilters ? (
          <Button
            variant="text"
            onClick={(event) => {
              pending.current = { control: event.currentTarget, index: 0 };
              onClearFilters();
            }}
          >
            {clearLabel}
          </Button>
        ) : null}
      </div>
    </>
  );
}
