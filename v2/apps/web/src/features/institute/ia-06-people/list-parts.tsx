'use client';

import {
  Button,
  Field,
  type FilterChip,
  Icon,
  Select,
  type SelectOption,
  Skeleton,
  TextInput,
} from '@xr/ui';
import { type ReactNode, useLayoutEffect, useRef } from 'react';

/** One toolbar filter: a select in a field; `className` `xr-filter-2` for the second (B2-06). */
export interface PeopleFilter {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly options: readonly SelectOption[];
  readonly onChange: (value: string) => void;
  readonly className?: string;
}

/**
 * The B2-06 list toolbar (f0, f2, f6, f14): `div.xr-toolbar` with the search and up to two
 * filters, then `div.xr-toolbar-status` with the count (`role="status"`, always mounted), the
 * applied-filter chips and "Clear filters". B2-06 draws the Group filter as `xr-filter-2` with no
 * "More filters": the v46 sheet hides it below 600 px of content (state-copy
 * `IA-06.group-filter-narrow`), so the shared ListToolbar — which requires "More filters" with a
 * second filter — is not used. When a chip's remove button or "Clear filters" goes with the focus
 * on it, focus moves to the next chip, else the previous one, else the first toolbar control (as
 * ListToolbar does).
 */
export function PeopleToolbar({
  search,
  filters = [],
  status,
  chips,
  onClearFilters,
  clearLabel,
}: {
  readonly search: {
    readonly id: string;
    readonly label: string;
    readonly placeholder: string;
    readonly value: string;
    readonly onChange: (value: string) => void;
  };
  readonly filters?: readonly PeopleFilter[];
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
      toolbar.current?.querySelector<HTMLElement>('input, select, button');
    target?.focus();
  });

  return (
    <>
      <div ref={toolbar} className="xr-toolbar">
        <Field id={search.id} label={search.label} className="xr-toolbar-search">
          <TextInput
            type="search"
            placeholder={search.placeholder}
            value={search.value}
            onChange={(event) => search.onChange(event.target.value)}
          />
        </Field>
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

/**
 * B2-06 f4 "Loading": the table's surface, busy, its rows as skeletons in the table's shape, and
 * the words for screen readers.
 */
export function ListLoading({
  label,
  columns,
  cells,
}: {
  readonly label: string;
  /** The skeleton row's tracks, as Tailwind's arbitrary `grid-cols-[…]` class. */
  readonly columns: string;
  /** How many columns the table has. */
  readonly cells: number;
}) {
  return (
    <div className="xr-table-wrap" aria-busy="true">
      <span className="xr-sr" role="status">
        {label}
      </span>
      {[0, 1, 2, 3].map((row) => (
        <div
          key={row}
          className={`grid ${columns} gap-5 px-4 py-[18px] [border-block-start:1px_solid_var(--xr-line)]`}
        >
          {Array.from({ length: cells }, (_, cell) => (
            <Skeleton key={cell} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * B2-06 f5 "Failed + retry": the empty pattern in a section, the Failed icon on the error tint,
 * what did not load, "Nothing has changed. Try again." and a primary "Try again".
 */
export function ListFailed({
  title,
  line,
  retryLabel,
  onRetry,
}: {
  readonly title: string;
  readonly line: string;
  readonly retryLabel: string;
  readonly onRetry: () => void;
}) {
  return (
    <div className="xr-section">
      <div className="xr-empty">
        <span className="xr-empty-icon bg-err-bg text-err">
          <Icon name="failed" />
        </span>
        <h2 className="xr-h3 m-0">{title}</h2>
        <p className="xr-body m-0">{line}</p>
        <div className="xw-actions">
          <Button variant="primary" icon="tryAgain" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
