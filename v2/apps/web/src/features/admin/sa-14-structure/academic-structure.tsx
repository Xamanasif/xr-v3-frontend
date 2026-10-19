'use client';

import type { Out, structureOutput } from '@xr/contracts/draft';
import {
  Button,
  CourseCode,
  ListFoot,
  ListState,
  LoadingRows,
  MissingTag,
  PageHead,
  RecordLine,
  RecordList,
  StructureAreaGroup,
  Surface,
} from '@xr/ui/v3';
import { useState } from 'react';

import { SA_FAILED } from '@/copy/sa-shared';
import { stateWords } from '@/copy/state-copy';
import { openAreaLabel, publishedWords, STRUCTURE_PAGE, STRUCTURE_SHARED } from '@/copy/structure';
import { structureAreaAddress, structureCourseAddress, structurePlacement } from '@/nav/structure';
import { useAcademicStructure } from '@/queries/structure';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { useStructureAdds } from './add-dialogs';
import {
  type FlashWords,
  StructureFlash,
  useStructureFocus,
  useTodayWords,
} from './structure-parts';

/** `AcademicStructureService.getStructure`: the areas in order, each with its courses. */
type Structure = Out<typeof structureOutput>;

/**
 * SA-14 Academic structure, at `/admin/structure` — the owner-approved Super Admin export (V3
 * Refined B, SA-v1 `sa-views-c.js` `V.structure`): “Which engineering areas and courses exist?”
 *
 * - **Read**: `AcademicStructureService.getStructure` — the areas in the structure’s order, each
 *   with its courses and their published experiments. Engineering area groups courses; there is
 *   no Programme or Module level (BC2).
 * - **As the export draws it**: the page head (date on phones, title, the line on codes, Add area
 *   and Add course in navy); one surface with a section per area — its name, description and
 *   “Open area” (SA-15) — and a row per course (`RecordList`) that opens its record (SA-15): the
 *   platform code (read-only, the Content Manager’s, M-2) or “No platform code yet”, and its
 *   published experiments; an area with no courses says so; the foot on modules and retiring.
 *   The list states: loading rows, failed with Try again, empty.
 * - **Add area / Add course**: the export’s dialogs (`add-dialogs.tsx`). Added, the flash names it
 *   and takes focus. No Retire, no artwork upload, no Module layer (D3).
 */
export function AcademicStructure() {
  useShellPage(structurePlacement());
  const read = useAcademicStructure();
  const structure = read.data?.ok ? read.data.value : null;
  const failed = read.isError || (read.data !== undefined && !read.data.ok);
  const today = useTodayWords();
  const focus = useStructureFocus();
  const [flash, setFlash] = useState<FlashWords | null>(null);
  const adds = useStructureAdds({
    areas: (structure ?? []).map((group) => ({ id: group.area.id, name: group.area.name })),
    focus,
    onOpen: () => setFlash(null),
    onAdded: (words) => {
      setFlash(words);
      focus.focus('flash');
    },
    refetch: () => void read.refetch(),
  });

  return (
    <>
      <PageHead
        title={STRUCTURE_PAGE.title}
        titleId="page-h1"
        titleFocusTarget
        titleRef={focus.titleRef}
        date={today}
        lead={STRUCTURE_PAGE.lead}
        actions={
          <>
            <Button id="structure-add-area" icon="add" onClick={adds.openArea}>
              {STRUCTURE_PAGE.addArea}
            </Button>
            <Button
              variant="navy"
              id="structure-add-course"
              icon="add"
              onClick={() => adds.openCourse()}
            >
              {STRUCTURE_PAGE.addCourse}
            </Button>
          </>
        }
      />
      <StructureFlash words={flash} flashRef={focus.flashRef} />
      <Surface label={STRUCTURE_PAGE.surfaceLabel}>
        {failed ? (
          <ListState
            kind="failed"
            title={stateWords('SA-14.failed')}
            action={<Button onClick={() => void read.refetch()}>{SA_FAILED.retry}</Button>}
          >
            {stateWords('SA-14.failed.line')}
          </ListState>
        ) : structure === null ? (
          <LoadingRows message={stateWords('SA-14.loading')} />
        ) : structure.length === 0 ? (
          <ListState kind="empty" icon="layers" title={stateWords('SA-14.empty')}>
            {stateWords('SA-14.empty.line')}
          </ListState>
        ) : (
          structure.map((group) => <AreaGroup key={group.area.id} group={group} />)
        )}
        <ListFoot>{STRUCTURE_PAGE.foot}</ListFoot>
      </Surface>
      {adds.dialogs}
    </>
  );
}

/** One engineering area: its head and a row per course that opens the course’s record. */
function AreaGroup({ group }: { readonly group: Structure[number] }) {
  const { area, courses } = group;
  return (
    <StructureAreaGroup
      title={area.name}
      titleId={`structure-area-${area.id}`}
      description={area.description ?? STRUCTURE_SHARED.noDescription}
      open={{
        href: structureAreaAddress(area.id),
        label: STRUCTURE_PAGE.openArea,
        accessibleName: openAreaLabel(area.name),
      }}
    >
      {courses.length > 0 ? (
        <RecordList
          rows={courses.map(({ course, publishedExperiments }) => ({
            key: course.id,
            href: structureCourseAddress(course.id),
            title: course.name,
            details: (
              <>
                {course.platformCode ? (
                  <CourseCode code={course.platformCode} />
                ) : (
                  <MissingTag icon={null}>{STRUCTURE_SHARED.noCode}</MissingTag>
                )}
                <span>{publishedWords(publishedExperiments)}</span>
              </>
            ),
          }))}
        />
      ) : (
        <RecordLine>{STRUCTURE_SHARED.noCourses}</RecordLine>
      )}
    </StructureAreaGroup>
  );
}
