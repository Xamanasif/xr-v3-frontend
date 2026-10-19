'use client';

import type { getStructureAreaOutput, Out } from '@xr/contracts/draft';
import {
  Breadcrumbs,
  Button,
  CourseCode,
  Footnote,
  MissingTag,
  PageHead,
  RecordLine,
  RecordList,
  Surface,
  SurfaceSection,
} from '@xr/ui/v3';
import { useState } from 'react';

import { SA_UNAVAILABLE } from '@/copy/sa-shared';
import { stateWords } from '@/copy/state-copy';
import { AREA_PAGE, STRUCTURE_SHARED } from '@/copy/structure';
import {
  STRUCTURE_ADDRESS,
  STRUCTURE_TITLE,
  structureCourseAddress,
  structureRecordPlacement,
} from '@/nav/structure';
import { useAcademicStructure, useStructureArea } from '@/queries/structure';

import { SaRecordGuard } from '../shared/sa-record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { useStructureAdds } from '../sa-14-structure/add-dialogs';
import {
  type FlashWords,
  StructureFlash,
  useStructureFocus,
  useTodayWords,
} from '../sa-14-structure/structure-parts';
import { EditButtons, RecordHistory, useRecordEdits } from './record-parts';
import { historyLines } from './structure-view';

/** `AcademicStructureService.getArea`: the area and its courses, in the structure’s order. */
type AreaView = Out<typeof getStructureAreaOutput>;

/**
 * SA-15 Area record, at `/admin/structure/areas/[areaId]` — the owner-approved Super Admin export
 * (V3 Refined B, SA-v1 `sa-views-c.js` `V.area`).
 *
 * - **Read**: `AcademicStructureService.getArea` — the area and its courses; the structure’s
 *   areas for Add course’s choices. An address that names no area shows the GL-04 “This page
 *   isn’t available” in place (`SaRecordGuard`).
 * - **As the export draws it**: the crumb back to Academic structure, the head (date on phones,
 *   “Engineering area”, the name, its description, Rename and Edit description); one surface with
 *   the courses — each row opens its record, with its platform code (read-only, M-2) or “No
 *   platform code yet” — and Add course, then the history; the foot note on artwork and retiring.
 * - **Act**: Rename and Edit description (`record-parts.tsx`), each with the revision the page
 *   showed when its dialog opened; Add course with this area chosen (`add-dialogs.tsx`).
 * - **Not here**: no artwork and no Retire (D3), no Module level.
 */
export function AreaRecord({ areaId }: { readonly areaId: string }) {
  const read = useStructureArea(areaId);
  const name = read.data?.ok ? read.data.value.area.name : null;
  const refused = read.data !== undefined && !read.data.ok;
  useShellPage(
    refused
      ? { ...structureRecordPlacement(null), title: SA_UNAVAILABLE.documentTitle }
      : structureRecordPlacement(name),
  );
  return (
    <SaRecordGuard
      read={read}
      loadingLabel={stateWords('SA-15.loading')}
      failedTitle={stateWords('SA-15.failed')}
    >
      {(view) => <AreaContent view={view} refetch={() => void read.refetch()} />}
    </SaRecordGuard>
  );
}

function AreaContent({ view, refetch }: { readonly view: AreaView; readonly refetch: () => void }) {
  const { area, courses } = view;
  const structure = useAcademicStructure();
  const today = useTodayWords();
  const focus = useStructureFocus();
  const [flash, setFlash] = useState<FlashWords | null>(null);
  const done = (words: FlashWords) => {
    setFlash(words);
    focus.focus('flash');
  };
  const edits = useRecordEdits({
    target: {
      kind: 'area',
      id: area.id,
      name: area.name,
      description: area.description,
      rev: area.rev,
    },
    focus,
    refetch,
    onOpen: () => setFlash(null),
    onDone: done,
  });
  const adds = useStructureAdds({
    areas: structure.data?.ok
      ? structure.data.value.map((group) => ({ id: group.area.id, name: group.area.name }))
      : [{ id: area.id, name: area.name }],
    focus,
    onOpen: () => setFlash(null),
    onAdded: done,
    refetch,
  });

  return (
    <>
      <PageHead
        breadcrumbs={
          <Breadcrumbs
            levels={[{ label: STRUCTURE_TITLE, href: STRUCTURE_ADDRESS }]}
            current={area.name}
          />
        }
        variant="record"
        title={area.name}
        titleId="page-h1"
        titleFocusTarget
        titleRef={focus.titleRef}
        date={today}
        eyebrow={AREA_PAGE.eyebrow}
        lead={area.description ?? STRUCTURE_SHARED.noDescription}
        actions={
          <EditButtons
            edits={edits}
            rename={AREA_PAGE.rename}
            editDescription={AREA_PAGE.editDescription}
          />
        }
      />
      <StructureFlash words={flash} flashRef={focus.flashRef} />
      <Surface>
        <SurfaceSection
          title={AREA_PAGE.courses}
          titleId="structure-area-courses"
          aside={
            <Button
              variant="ghost"
              id="structure-area-add-course"
              icon="add"
              onClick={() => adds.openCourse(area.id)}
            >
              {AREA_PAGE.addCourse}
            </Button>
          }
        >
          {courses.length > 0 ? (
            <RecordList
              rows={courses.map((course) => ({
                key: course.id,
                href: structureCourseAddress(course.id),
                title: course.name,
                details: course.platformCode ? (
                  <CourseCode code={course.platformCode} />
                ) : (
                  <MissingTag icon={null}>{STRUCTURE_SHARED.noCode}</MissingTag>
                ),
              }))}
            />
          ) : (
            <RecordLine>{STRUCTURE_SHARED.noCourses}</RecordLine>
          )}
        </SurfaceSection>
        <RecordHistory titleId="structure-area-history" lines={historyLines(area.history, null)} />
      </Surface>
      <Footnote>{AREA_PAGE.footnote}</Footnote>
      {edits.dialogs}
      {adds.dialogs}
    </>
  );
}
