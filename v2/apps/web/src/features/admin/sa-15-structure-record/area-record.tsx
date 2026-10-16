'use client';

import type { getStructureAreaOutput, Out } from '@xr/contracts/draft';
import { PageContent, Section, SectionBody } from '@xr/ui';
import { useState } from 'react';

import { stateWords } from '@/copy/state-copy';
import { areaCourseLine, RECORD_PAGE, STRIPPED_STRUCTURE, STRUCTURE_PAGE } from '@/copy/structure';
import { structureRecordPlacement } from '@/nav/structure';
import { useStructureArea } from '@/queries/structure';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  EditButtons,
  Flash,
  RecordHeader,
  RecordHistory,
  useRecordEdits,
  useRecordFocus,
} from './record-parts';
import { historyLines } from './structure-view';

/** `AcademicStructureService.getArea`: the area and its courses, in the structure’s order. */
type AreaView = Out<typeof getStructureAreaOutput>;

/**
 * SA-15 Area record — board B7-07 f5 (“Engineering area — Chemical & Process”), at
 * `/admin/structure/areas/[areaId]`.
 *
 * - **Read**: `AcademicStructureService.getArea` — the area and its courses. An address that names
 *   no area shows the in-shell not-found page.
 * - **Act**: Rename and Edit description only (DL-3 small edits, `record-parts.tsx`), each with
 *   the revision the page showed when its dialog opened; renaming says where the name shows.
 * - **Not here**: no artwork and no Retire (D3; the note says so without the decision id, P1-14),
 *   no Module level. The courses are listed with their platform codes, read-only (M-2).
 */
export function AreaRecord({ areaId }: { readonly areaId: string }) {
  const read = useStructureArea(areaId);
  useShellPage(structureRecordPlacement(read.data?.ok ? read.data.value.area.name : null));
  return (
    <PageContent wrap="read">
      <RecordGuard
        read={read}
        loadingLabel={stateWords('SA-15.loading')}
        failed={{ title: stateWords('SA-15.failed'), line: stateWords('SA-15.failed.line') }}
      >
        {(view) => <AreaContent view={view} refetch={() => void read.refetch()} />}
      </RecordGuard>
    </PageContent>
  );
}

function AreaContent({ view, refetch }: { readonly view: AreaView; readonly refetch: () => void }) {
  const { area, courses } = view;
  const focus = useRecordFocus();
  const [flash, setFlash] = useState<string | null>(null);
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
    onDone: (words, then) => {
      setFlash(words);
      focus.focus(then);
    },
  });

  return (
    <>
      <RecordHeader overline={RECORD_PAGE.areaOverline} name={area.name} titleRef={focus.titleRef}>
        <EditButtons edits={edits} />
      </RecordHeader>
      <Flash words={flash} flashRef={focus.flashRef} />
      <div className="flex flex-col gap-5">
        <Section title={RECORD_PAGE.areaSection}>
          <SectionBody>
            <dl className="xl-kv xv-kv">
              <dt>{RECORD_PAGE.descriptionKey}</dt>
              <dd>{area.description ?? STRUCTURE_PAGE.noDescription}</dd>
              <dt>{RECORD_PAGE.coursesKey}</dt>
              <dd>
                {courses.length > 0 ? (
                  <ul className="xv-los">
                    {courses.map((course) => (
                      <li key={course.id}>{areaCourseLine(course.name, course.platformCode)}</li>
                    ))}
                  </ul>
                ) : (
                  RECORD_PAGE.noCourses
                )}
              </dd>
            </dl>
            <p className="xl-meta mt-3 mb-0">{STRIPPED_STRUCTURE.areaNote.words}</p>
          </SectionBody>
        </Section>
        <RecordHistory lines={historyLines(area.history, null)} />
      </div>
      {edits.dialogs}
    </>
  );
}
