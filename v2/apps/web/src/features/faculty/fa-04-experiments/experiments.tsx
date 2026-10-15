'use client';

import type { Technology } from '@xr/domain';
import {
  Button,
  Field,
  type FilterChip,
  FormatSet,
  type FormatCode,
  Icon,
  Link,
  Select,
  type SelectOption,
  StatusPill,
  TextInput,
} from '@xr/ui';
import { type ReactNode, useId, useLayoutEffect, useRef, useState } from 'react';

import { READINESS_WORDS } from '@/copy/assessment-words';
import {
  type ActivityFilter,
  completedHeader,
  EXPERIMENTS_TAB,
  experimentCountWords,
  formatChip,
  openExperimentLabel,
} from '@/copy/faculty-courses';
import { stateWords } from '@/copy/state-copy';
import { facultyExperimentAddress } from '@/nav/faculty';

import { FacultyFailed, FacultyLoading, useRetryFocus } from './list-states';
import { type TaughtExperiment, type TaughtRead, useTaughtExperiments } from './taught-experiments';

const SEARCH_ID = 'faculty-experiments-search';
const FORMAT_ORDER: readonly Technology[] = ['web', 'ar', 'vr', 'mr'];

const code = (format: Technology) => format.toUpperCase() as FormatCode;

/** The formats any listed experiment's plan holds, in the display order WEB · AR · VR · MR. */
function heldFormats(experiments: readonly TaughtExperiment[]): Technology[] {
  const held = new Set<Technology>();
  for (const entry of experiments) {
    for (const format of entry.teaching.formatsInstitutionHas) held.add(format);
  }
  return FORMAT_ORDER.filter((format) => held.has(format));
}

interface Filters {
  readonly search: string;
  readonly format: Technology | 'all';
  readonly activity: ActivityFilter;
}

/** Search (name, code, course; `FA-04.search`), Format and Activity (`FA-04.activity`). */
function matches(entry: TaughtExperiment, filters: Filters): boolean {
  const wanted = filters.search.trim().toLocaleLowerCase('en');
  const text = [
    entry.option.name,
    entry.option.courseCode ?? '',
    entry.teaching.experiment.courseName,
  ]
    .join(' ')
    .toLocaleLowerCase('en');
  const active = entry.teaching.formatsUsedByStudents.length > 0;
  return (
    (wanted === '' || text.includes(wanted)) &&
    (filters.format === 'all' || entry.teaching.formatsInstitutionHas.includes(filters.format)) &&
    (filters.activity === 'all' || (filters.activity === 'some' ? active : !active))
  );
}

/**
 * FA-04 My courses › Experiments — board B4-02 f2 … f5, f8, the My courses page's
 * `?tab=experiments` (Appendix A rule T2): "Which experiments do I teach, and how are students
 * doing?"
 *
 * - **Reads** (`useTaughtExperiments`): the taught experiments (`getCreateOptions`), each one's
 *   teaching facts (`getTeachingExperiment`: the formats the institution's plans hold, per-format
 *   counts, the formats its Students used) and the assessments (`listAssessments`: readiness).
 *   A Faculty course assigned or removed, an assessment created or a runtime report in the same
 *   tab refreshes them.
 * - **As drawn** (f2): "Experiments you teach" with Search ("Experiment or course"), Format (the
 *   formats the institution holds) and Activity (`xr-filter-2`, hidden below 600 px of content:
 *   `FA-04.activity-filter-narrow`), the count, a chip per applied Format / Activity filter and
 *   "Clear filters"; the table Experiment · Formats your institution has · Completed (<format>)
 *   per format, never summed · Assessment (Ready / Draft — not ready / No assessment yet) ·
 *   "Open" (FA-05). Below 760 px of content the rows become labelled blocks (f8).
 * - **States**: no match "No experiment matches. Clear filters" (f3), loading (f4), failed with
 *   "Try again" (f5), and none taught (`FA-04.none`).
 */
export function FacultyExperiments() {
  const [filters, setFilters] = useState<Filters>({ search: '', format: 'all', activity: 'all' });
  const { read, probes } = useTaughtExperiments();
  return (
    <>
      {probes}
      <ExperimentsSection read={read} filters={filters} onFilters={setFilters} />
    </>
  );
}

function ExperimentsSection({
  read,
  filters,
  onFilters,
}: {
  readonly read: TaughtRead;
  readonly filters: Filters;
  readonly onFilters: (next: Filters) => void;
}) {
  const headingId = useId();
  const retried = useRetryFocus(read.kind === 'ready');
  const all = read.kind === 'ready' ? read.experiments : [];
  const formats = heldFormats(all);
  const listed = all.filter((entry) => matches(entry, filters));
  const set = (patch: Partial<Filters>) => onFilters({ ...filters, ...patch });
  const clear = () => onFilters({ search: '', format: 'all', activity: 'all' });

  // The board's chips: Format and Activity only (a search makes none; `FA-04.search`).
  const chips: FilterChip[] = [];
  if (filters.format !== 'all') {
    chips.push({
      key: 'format',
      label: formatChip(filters.format),
      onRemove: () => set({ format: 'all' }),
    });
  }
  if (filters.activity !== 'all') {
    chips.push({
      key: 'activity',
      label: EXPERIMENTS_TAB.activity[filters.activity],
      onRemove: () => set({ activity: 'all' }),
    });
  }

  // "Clear filters" in the no-match line goes with that line: focus moves to the search box
  // once it has gone, and only if focus was lost with it (as ST-04 does).
  const pressed = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const control = pressed.current;
    if (control === null || control.isConnected) return;
    pressed.current = null;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    document.getElementById(SEARCH_ID)?.focus();
  });

  let body: ReactNode;
  if (read.kind === 'failed') {
    body = (
      <FacultyFailed
        title={EXPERIMENTS_TAB.failedTitle}
        onRetry={() => {
          retried();
          read.retry();
        }}
      />
    );
  } else if (read.kind === 'loading') {
    body = (
      <FacultyLoading
        label={EXPERIMENTS_TAB.loading}
        columns="grid-cols-[1.6fr_1fr_120px_120px_140px]"
        cells={5}
      />
    );
  } else if (listed.length > 0) {
    body = <ExperimentTable rows={listed} formats={formats} />;
  } else {
    const applied = filters.search.trim() !== '' || chips.length > 0;
    body = (
      <div className="xr-section-body">
        <p className="xr-body m-0 text-ink-2">
          {applied ? (
            <>
              {EXPERIMENTS_TAB.noMatch}{' '}
              <button
                type="button"
                className="xr-btn xr-btn--text min-h-8"
                onClick={(event) => {
                  pressed.current = event.currentTarget;
                  clear();
                }}
              >
                {EXPERIMENTS_TAB.clearFilters}
              </button>
            </>
          ) : (
            stateWords('FA-04.none')
          )}
        </p>
      </div>
    );
  }

  return (
    <section className="xr-section" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <h2 id={headingId} className="xr-h2">
          {EXPERIMENTS_TAB.section}
        </h2>
      </div>
      <div className="px-6 pb-2">
        <ExperimentsToolbar
          filters={filters}
          onFilters={set}
          formats={formats}
          status={read.kind === 'ready' ? experimentCountWords(listed.length) : ''}
          chips={chips}
          onClearFilters={chips.length > 0 ? clear : undefined}
        />
      </div>
      {body}
    </section>
  );
}

/**
 * The B4-02 f2 toolbar: `div.xr-toolbar` with the search, Format and Activity (`xr-filter-2`, no
 * "More filters" — the shared ListToolbar requires one with a second filter), then
 * `div.xr-toolbar-status` with the count (`role="status"`, always mounted), the chips and "Clear
 * filters". When a chip's remove button or "Clear filters" goes with the focus on it, focus moves
 * to the next chip, else the previous one, else the search box (as ListToolbar does).
 */
function ExperimentsToolbar({
  filters,
  onFilters,
  formats,
  status,
  chips,
  onClearFilters,
}: {
  readonly filters: Filters;
  readonly onFilters: (patch: Partial<Filters>) => void;
  readonly formats: readonly Technology[];
  readonly status: string;
  readonly chips: readonly FilterChip[];
  readonly onClearFilters?: () => void;
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
      toolbar.current?.querySelector<HTMLElement>('input');
    target?.focus();
  });

  const formatOptions: SelectOption[] = [
    { value: 'all', label: EXPERIMENTS_TAB.allFormats },
    ...formats.map((format) => ({ value: format, label: code(format) })),
  ];
  const activityOptions: SelectOption[] = (['all', 'some', 'none'] as const).map((value) => ({
    value,
    label: EXPERIMENTS_TAB.activity[value],
  }));

  return (
    <>
      <div ref={toolbar} className="xr-toolbar">
        <Field id={SEARCH_ID} label={EXPERIMENTS_TAB.searchLabel} className="xr-toolbar-search">
          <TextInput
            type="search"
            placeholder={EXPERIMENTS_TAB.searchPlaceholder}
            value={filters.search}
            onChange={(event) => onFilters({ search: event.target.value })}
          />
        </Field>
        <Field id="faculty-experiments-format" label={EXPERIMENTS_TAB.formatLabel}>
          <Select
            options={formatOptions}
            value={filters.format}
            onChange={(event) => onFilters({ format: event.target.value as Technology | 'all' })}
          />
        </Field>
        <Field
          id="faculty-experiments-activity"
          label={EXPERIMENTS_TAB.activityLabel}
          className="xr-filter-2"
        >
          <Select
            options={activityOptions}
            value={filters.activity}
            onChange={(event) => onFilters({ activity: event.target.value as ActivityFilter })}
          />
        </Field>
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
              aria-label={`Remove ${chip.label}`}
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
            {EXPERIMENTS_TAB.clearFilters}
          </Button>
        ) : null}
      </div>
    </>
  );
}

/** B4-02 f2 / f8: one row per experiment; labelled rows below 760 px of content. */
function ExperimentTable({
  rows,
  formats,
}: {
  readonly rows: readonly TaughtExperiment[];
  readonly formats: readonly Technology[];
}) {
  const { columns } = EXPERIMENTS_TAB;
  return (
    <div className="xr-table-wrap">
      <table className="xr-table">
        <caption className="xr-sr">{EXPERIMENTS_TAB.section}</caption>
        <thead>
          <tr>
            <th scope="col">{columns.experiment}</th>
            <th scope="col">{columns.formats}</th>
            {formats.map((format) => (
              <th key={format} scope="col">
                {completedHeader(format)}
              </th>
            ))}
            <th scope="col">{columns.assessment}</th>
            <th scope="col">
              <span className="xr-sr">{columns.action}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((entry) => {
            const { option, teaching } = entry;
            const address = facultyExperimentAddress(option.experimentId);
            return (
              <tr key={option.experimentId}>
                <td>
                  <Link href={address}>
                    <strong>{option.name}</strong>
                  </Link>
                  <span className="xr-meta block">
                    {option.courseCode ?? teaching.experiment.courseName}
                  </span>
                </td>
                <td data-label={columns.formats}>
                  <FormatSet
                    compact
                    variant="yours"
                    formats={FORMAT_ORDER.filter((format) =>
                      teaching.formatsInstitutionHas.includes(format),
                    ).map(code)}
                  />
                </td>
                {formats.map((format) => {
                  const counts = teaching.perFormatCounts.find((row) => row.format === format);
                  return (
                    <td key={format} data-label={completedHeader(format)} className="xl-num">
                      {counts && teaching.formatsInstitutionHas.includes(format) ? (
                        counts.completed
                      ) : (
                        <span className="text-ink-3 [font-weight:400]">
                          {stateWords('FA-04.completed-not-held')}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td data-label={columns.assessment}>
                  <AssessmentCell entry={entry} />
                </td>
                <td>
                  <Link
                    className="xr-btn xr-btn--secondary xr-btn--sm"
                    href={address}
                    aria-label={openExperimentLabel(option.name)}
                  >
                    {EXPERIMENTS_TAB.open}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** "Ready" (ok), "Draft — not ready" (wait) or "No assessment yet" (`FA-04.assessment-*`). */
function AssessmentCell({ entry }: { readonly entry: TaughtExperiment }) {
  if (entry.assessment === null) {
    return <span className="text-ink-3">{stateWords('FA-04.assessment-none')}</span>;
  }
  const readiness = READINESS_WORDS[entry.assessment.readiness];
  return <StatusPill tone={readiness.tone}>{readiness.label}</StatusPill>;
}
