'use client';

import type { Technology } from '@xr/domain';
import type { FormatCode } from '@xr/ui';
import {
  Button,
  FaCellName,
  FaCellSub,
  FaExperimentsFormats,
  type FaFilterChip,
  FaFilters,
  FaFormatBadges,
  FaMessageCard,
  FaProgress,
  FaQuiet,
  FaRowLink,
  FaSearchField,
  FaSelectField,
  FaStatusLine,
  FaTable,
  FaToolbar,
  HiddenHeading,
  ListState,
  LoadingRows,
  StatusPill,
  Surface,
} from '@xr/ui/v3';
import { useState } from 'react';

import {
  type ActivityFilter,
  EXPERIMENTS_TAB,
  experimentCountWords,
  removeFilterLabel,
} from '@/copy/faculty-courses';
import { formatsHeldLabel, PROGRESS_WORDS } from '@/copy/faculty-overview';
import { useSession } from '@/queries/session';

import { type TaughtRead, useTaughtExperiments } from './taught-experiments';
import {
  experimentRowView,
  filterChips,
  type Filters,
  heldFormats,
  matches,
  NO_FILTERS,
} from './experiments-view';

const SECTION_ID = 'fa-exps-h';
const SEARCH_ID = 'fa-x-q';
const FORMAT_ID = 'fa-x-fm';
const ACTIVITY_ID = 'fa-x-act';

/** Where focus goes when a chip goes: the field it filtered (the export's `focusLater`). */
const CHIP_FOCUS: Readonly<Record<keyof Filters, string>> = {
  search: SEARCH_ID,
  format: FORMAT_ID,
  activity: ACTIVITY_ID,
};

/**
 * FA-04 My courses › Experiments — the V3 Refined B design (the owner-approved export
 * design/v3-refined-b/roles/FA-v1, `Main.dc.html` FA-04 and the Experiments half of `vmCourses`),
 * the My courses page's `?tab=experiments`.
 *
 * - **Reads** (`useTaughtExperiments`): the taught experiments (`getCreateOptions`), each one's
 *   teaching facts (`getTeachingExperiment`: the formats the institution's plans hold, per-format
 *   counts, the formats its Students used, the instant they were read) and the assessments
 *   (`listAssessments`: readiness, name, deadline, who created it). A Faculty course assigned or
 *   removed, an assessment created or a runtime report in the same tab refreshes them.
 * - **As the export draws it**: "Experiments you teach" (for screen readers) with Search
 *   ("Experiment or course"), Format (the formats the institution holds) and Student activity,
 *   the count, one chip per filter and "Clear filters"; the refined table — the experiment with
 *   its course and formats, one unit meter per format with the Students reached "as of" the read,
 *   and the assessment's status, name and deadline. Each row opens FA-05. Below 760 px of table
 *   the rows become labelled blocks.
 * - **States**: no match (Clear filters), loading, couldn't load (Try again, focus back to the
 *   search) and no experiments (the message card).
 */
export function FacultyExperiments() {
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const { read, probes } = useTaughtExperiments();
  return (
    <>
      {probes}
      <ExperimentsSection read={read} filters={filters} onFilters={setFilters} />
    </>
  );
}

/** The filters with one of them cleared (a chip removed). */
function withoutFilter(key: keyof Filters): Partial<Filters> {
  if (key === 'search') return { search: NO_FILTERS.search };
  if (key === 'format') return { format: NO_FILTERS.format };
  return { activity: NO_FILTERS.activity };
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
  const session = useSession();
  const me = session.status === 'signed-in' ? session.personId : null;
  const all = read.kind === 'ready' ? read.experiments : [];
  const formats = heldFormats(all);
  const listed = all.filter((entry) => matches(entry, filters));
  const set = (patch: Partial<Filters>) => onFilters({ ...filters, ...patch });
  const clear = () => onFilters(NO_FILTERS);
  const focusSearch = () => document.getElementById(SEARCH_ID)?.focus();

  if (read.kind === 'ready' && all.length === 0) {
    return (
      <FaMessageCard icon="contentAccess" title={EXPERIMENTS_TAB.emptyTitle} titleId="fa-exps-none">
        {EXPERIMENTS_TAB.emptyLine}
      </FaMessageCard>
    );
  }

  const chipViews = filterChips(filters);
  const chips: FaFilterChip[] = chipViews.map((chip) => ({
    key: chip.key,
    label: chip.label,
    focusId: CHIP_FOCUS[chip.key],
    onRemove: () => set(withoutFilter(chip.key)),
  }));

  return (
    <Surface labelledBy={SECTION_ID}>
      <HiddenHeading id={SECTION_ID}>{EXPERIMENTS_TAB.section}</HiddenHeading>
      <FaToolbar>
        <FaFilters label={EXPERIMENTS_TAB.filtersLabel}>
          <FaSearchField
            id={SEARCH_ID}
            label={EXPERIMENTS_TAB.searchLabel}
            placeholder={EXPERIMENTS_TAB.searchPlaceholder}
            value={filters.search}
            onChange={(search) => set({ search })}
          />
          <FaSelectField
            id={FORMAT_ID}
            label={EXPERIMENTS_TAB.formatLabel}
            value={filters.format}
            options={[
              { value: 'all', label: EXPERIMENTS_TAB.allFormats },
              ...formats.map((format) => ({ value: format, label: format.toUpperCase() })),
            ]}
            onChange={(format) => set({ format: format as Technology | 'all' })}
          />
          <FaSelectField
            id={ACTIVITY_ID}
            label={EXPERIMENTS_TAB.activityLabel}
            value={filters.activity}
            options={(['all', 'some', 'none'] as const).map((value) => ({
              value,
              label: EXPERIMENTS_TAB.activity[value],
            }))}
            onChange={(activity) => set({ activity: activity as ActivityFilter })}
          />
        </FaFilters>
        <FaStatusLine
          count={
            read.kind === 'ready'
              ? experimentCountWords(listed.length, all.length, chips.length > 0)
              : undefined
          }
          chips={chips}
          removeLabel={(chip) => removeFilterLabel(chip.label)}
          clearLabel={EXPERIMENTS_TAB.clearFilters}
          onClearFilters={clear}
          clearFocusId={SEARCH_ID}
        />
      </FaToolbar>
      {read.kind === 'failed' ? (
        <ListState
          kind="failed"
          title={EXPERIMENTS_TAB.failedTitle}
          action={
            <Button
              onClick={() => {
                read.retry();
                focusSearch();
              }}
            >
              {EXPERIMENTS_TAB.tryAgain}
            </Button>
          }
        >
          {EXPERIMENTS_TAB.failedLine}
        </ListState>
      ) : read.kind === 'loading' ? (
        <LoadingRows message={EXPERIMENTS_TAB.loading} rows={2} cells={[2, 1, 2, 1, 1]} />
      ) : listed.length === 0 ? (
        <ListState
          kind="nomatch"
          title={EXPERIMENTS_TAB.noMatchTitle}
          action={
            <Button
              onClick={() => {
                clear();
                focusSearch();
              }}
            >
              {EXPERIMENTS_TAB.clearFilters}
            </Button>
          }
        >
          {EXPERIMENTS_TAB.noMatchLine}
        </ListState>
      ) : (
        <FaTable
          kind="experiments"
          caption={EXPERIMENTS_TAB.section}
          columns={[
            { key: 'experiment', header: EXPERIMENTS_TAB.columns.experiment, width: 'exp' },
            { key: 'activity', header: EXPERIMENTS_TAB.columns.activity, width: 'act' },
            { key: 'assessment', header: EXPERIMENTS_TAB.columns.assessment },
          ]}
          rows={listed.map((entry) => {
            const row = experimentRowView(entry, me);
            return {
              key: row.experimentId,
              link: true,
              cells: [
                {
                  key: 'experiment',
                  main: true,
                  children: (
                    <>
                      <FaRowLink href={row.href} label={row.accessibleName}>
                        {row.name}
                      </FaRowLink>
                      <FaCellSub>{row.course}</FaCellSub>
                      <FaExperimentsFormats
                        label={EXPERIMENTS_TAB.formatsKey}
                        badges={
                          <FaFormatBadges
                            formats={row.formats as FormatCode[]}
                            label={formatsHeldLabel(row.formats)}
                          />
                        }
                      />
                    </>
                  ),
                },
                {
                  key: 'activity',
                  label: EXPERIMENTS_TAB.columns.activity,
                  children:
                    row.students > 0 ? (
                      <>
                        <FaProgress
                          variant="cell"
                          label={row.progressLabel}
                          rows={row.progress}
                          words={PROGRESS_WORDS}
                        />
                        <FaCellSub foot>{row.reach}</FaCellSub>
                      </>
                    ) : (
                      <FaQuiet inline>{EXPERIMENTS_TAB.noStudents}</FaQuiet>
                    ),
                },
                {
                  key: 'assessment',
                  label: EXPERIMENTS_TAB.columns.assessment,
                  children: (
                    <>
                      <StatusPill tone={row.status.tone}>{row.status.words}</StatusPill>
                      {row.assessment ? <FaCellName>{row.assessment}</FaCellName> : null}
                      <FaCellSub>{row.detail}</FaCellSub>
                    </>
                  ),
                },
              ],
            };
          })}
        />
      )}
    </Surface>
  );
}
