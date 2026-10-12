'use client';

import { useId, useLayoutEffect, useRef, type ReactNode } from 'react';

import { Button } from '../foundation/button.js';
import { Icon } from '../foundation/icon.js';
import { Field } from '../forms/field.js';
import { Select, type SelectOption } from '../forms/select.js';
import { TextInput } from '../forms/text-input.js';
import { joinClasses } from '../internal/classes.js';

/** The toolbar's search box (`div.xr-field.xr-toolbar-search` with `input[type=search]`). */
export interface ListToolbarSearch {
  /** The input's id; generated when omitted. */
  readonly id?: string;
  /** The visible label ("Search", "Search institutions"). */
  readonly label: ReactNode;
  /** What can be searched for ("Reference, institution or contact"). */
  readonly placeholder?: string;
  /** The search text (controlled). */
  readonly value: string;
  /** Called with the new text on every change; the caller filters. */
  readonly onChange: (value: string) => void;
}

/** One visible filter: a native select in a field (`div.xr-field` > `xr-select-wrap`). */
export interface ListToolbarFilter {
  /** The select's id; generated when omitted. */
  readonly id?: string;
  /** "Status", "Type", "Course". */
  readonly label: ReactNode;
  /** The caller's options in the caller's words, the "All …" option first (B1-10). */
  readonly options: readonly SelectOption[];
  /** The chosen option's value (controlled). */
  readonly value: string;
  /** Called with the chosen option's value; the caller filters. */
  readonly onChange: (value: string) => void;
}

/** The "More filters" disclosure and its panel (`div.xp-morefilters`, B1-10). */
export interface ListToolbarMoreFilters {
  /** Whether the panel is shown (`aria-expanded`; controlled). */
  readonly open: boolean;
  /** Called with the new state when the button is pressed. */
  readonly onOpenChange: (open: boolean) => void;
  /**
   * How many applied filters live in the panel: the button then reads "More filters (n)"
   * (B1-10 "More filters open · Internal or external = External": "the button counts it").
   */
  readonly activeCount?: number;
  /** The panel's id (the button's `aria-controls`); generated when omitted. */
  readonly id?: string;
  /** The further filters: Fields with a Select each ("Internal or external"). */
  readonly children?: ReactNode;
}

/** An applied filter, drawn as a chip with a 28 × 28 remove button (`span.xr-fchip`). */
export interface FilterChip {
  /** Stable key (the filter it stands for). */
  readonly key: string;
  /** What is applied, in words: "Status: Under review", "Search: “Narmada”". */
  readonly label: string;
  /**
   * The remove button's name. Default "Remove <label>", as the product boards build it (17
   * list engines, B1-10 … B4-15); boards 03 and 12 draw "Remove filter <label>".
   */
  readonly removeLabel?: string;
  /** Removes this filter (the caller's state); focus then moves to a neighbouring chip. */
  readonly onRemove: () => void;
}

interface ListToolbarBaseProps {
  /** The search box, first in the row. */
  readonly search?: ListToolbarSearch;
  /**
   * The result count in words, from the caller ("5 of 214 students", "4 requests · oldest
   * first"), in `span.xr-meta[role="status"]`: it stays mounted and only its words change, so
   * every change is announced politely (Appendix E §5.5).
   */
  readonly status: ReactNode;
  /** Applied filters, in the caller's order. */
  readonly chips?: readonly FilterChip[];
  /**
   * Clears every filter. The button is drawn while this is given: pass it while something is
   * applied (B1-10: while there are chips; B7-02: while a search is applied).
   */
  readonly onClearFilters?: () => void;
  /** The clear button's words: "Clear filters" (default), "Clear search" (B6-06). */
  readonly clearLabel?: string;
  /**
   * The table's `DataTableSortBar`, drawn in the status row after the count (PF-01, Appendix E
   * §7.1; VD-04 PROVISIONAL placement): the visible sort control above the first row below
   * 760 px of content. Pass it while the table lists rows. This component draws nothing of its
   * own here.
   */
  readonly sortBar?: ReactNode;
  /** Board context classes on `div.xr-toolbar`. */
  readonly className?: string;
}

/**
 * At most two visible filters (board 03 "List toolbar · one shared component at three widths").
 * The second one (`xr-filter-2`) moves inside "More filters" below 600 px of content, so a
 * second filter needs the More filters disclosure.
 */
export type ListToolbarProps = ListToolbarBaseProps &
  (
    | {
        /** Two visible filters; the second is `xr-filter-2`. */
        readonly filters: readonly [ListToolbarFilter, ListToolbarFilter];
        /** Required with two filters: the second moves into it below 600 px of content. */
        readonly moreFilters: ListToolbarMoreFilters;
      }
    | {
        /** None or one visible filter. */
        readonly filters?: readonly [] | readonly [ListToolbarFilter];
        /** "More filters" and its panel, where the list has further filters. */
        readonly moreFilters?: ListToolbarMoreFilters;
      }
  );

/**
 * The list toolbar (board 03 "Search, filter, segmented and tabs"; B1-10 "SA-02 Requests · 1440 ·
 * interactive"): `div.xr-toolbar` with the search, up to two filters and "More filters"
 * (`aria-expanded`, `aria-controls`; the row is not drawn when it would be empty), the
 * `div.xp-morefilters` panel when open, then
 * `div.xr-toolbar-status` with the count (`role="status"`), the applied-filter chips and "Clear
 * filters". All words, options and filter state come from the caller; the toolbar filters
 * nothing itself. When a chip's remove button or "Clear filters" disappears with the focus on
 * it, focus moves to the next chip, else the previous one, else the first toolbar control, also
 * when the caller removes the filter in a later commit (a transition, a busy render first)
 * (PROVISIONAL: no board draws where focus goes).
 */
export function ListToolbar({
  search,
  filters = [],
  moreFilters,
  status,
  chips = [],
  onClearFilters,
  clearLabel = 'Clear filters',
  sortBar,
  className,
}: ListToolbarProps) {
  const generated = useId();
  const panelId = moreFilters?.id ?? `${generated}-more`;
  const [first, second] = filters;
  const chipButtons = useRef(new Map<string, HTMLButtonElement>());
  const toolbar = useRef<HTMLDivElement>(null);
  /** The chip remove button or clear button last pressed, and its chip's place in the row. */
  const pending = useRef<{ readonly control: HTMLElement; readonly index: number } | null>(null);

  // Before paint, so focus is never seen resting on the page body. After every commit, not on a
  // change of `chips`: a caller may remove the filter in a later commit than the press (a
  // transition's urgent `isPending` render, or a busy render, comes first, often with a new
  // `chips` array), and a caller's `chips` may keep its identity (a constant) while only the
  // clear button goes. So the rescue waits until the pressed control itself has gone.
  useLayoutEffect(() => {
    const pressed = pending.current;
    if (pressed === null || pressed.control.isConnected) return;
    pending.current = null;
    const active = document.activeElement;
    // Only rescue focus that was lost with a removed control.
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

  const moreLabel = moreFilters?.activeCount
    ? `More filters (${moreFilters.activeCount})`
    : 'More filters';

  return (
    <>
      {search || first || moreFilters ? (
        <div ref={toolbar} className={joinClasses('xr-toolbar', className)}>
          {search ? (
            <Field id={search.id} label={search.label} className="xr-toolbar-search">
              <TextInput
                type="search"
                placeholder={search.placeholder}
                value={search.value}
                onChange={(event) => search.onChange(event.target.value)}
              />
            </Field>
          ) : null}
          {first ? <FilterField filter={first} /> : null}
          {second ? <FilterField filter={second} className="xr-filter-2" /> : null}
          {moreFilters ? (
            <Button
              variant="secondary"
              icon="filter"
              aria-expanded={moreFilters.open}
              aria-controls={panelId}
              onClick={() => moreFilters.onOpenChange(!moreFilters.open)}
            >
              {moreLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
      {moreFilters?.open ? (
        <div className="xp-morefilters" id={panelId} role="group" aria-label="More filters">
          {second ? (
            // The second filter again, shown only below 600 px of content, where the toolbar
            // hides its own copy (`xp-morefilters-type`; id `<id>2`, as B1-10 draws Qq-type2).
            <FilterField
              filter={second}
              id={second.id === undefined ? undefined : `${second.id}2`}
              className="xp-morefilters-type"
            />
          ) : null}
          {moreFilters.children}
        </div>
      ) : null}
      <div className="xr-toolbar-status">
        <span className="xr-meta" role="status">
          {status}
        </span>
        {sortBar}
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

function FilterField({
  filter,
  id = filter.id,
  className,
}: {
  readonly filter: ListToolbarFilter;
  readonly id?: string;
  readonly className?: string;
}) {
  return (
    <Field id={id} label={filter.label} className={className}>
      <Select
        options={filter.options}
        value={filter.value}
        onChange={(event) => filter.onChange(event.target.value)}
      />
    </Field>
  );
}
