'use client';

import { MessagePage } from '@xr/ui';

import { AREA, AREAS, COURSE, HOW_ACCESS_WORKS, backToWords, courseEyebrow } from '@/copy/public';
import { stateWords } from '@/copy/state-copy';
import { DocumentTitle } from '@/features/shared/document-title';
import { FOR_INSTITUTIONS_HREF } from '@/nav/public-nav';
import { usePublicCourse } from '@/queries/catalogue';
import { useSelection } from '@/queries/selection';

import { PublicMain } from '../shell/public-frame';
import { ExperimentRow } from '../shared/experiment-row';
import { Crumbs, EmptyBlock, FailedBlock, Facts, FormatChips, MoreLink } from '../shared/blocks';

/**
 * PU-05 Course (B1-03 "PU-05 Course · ME ZG523 · 1440"): single column, the course's published
 * experiments with their formats (`getCourse`); no course-level outcomes (LD-3). The code chip
 * shows only when the course has a platform code, and the breadcrumb then uses the name (T-17,
 * B1-03 "Course without a platform code"); a course with nothing published says so (B1-03
 * "Course · nothing published yet").
 */
export function CoursePage({ courseId }: { readonly courseId: string }) {
  const course = usePublicCourse(courseId);
  const { selection } = useSelection();
  const selected = new Set(selection.items.map((item) => item.experimentId as string));

  if (course.data && !course.data.ok && course.data.error.kind === 'not-found') {
    return (
      <>
        <DocumentTitle title={stateWords('PU-05.not-found')} />
        <PublicMain className="xp-page">
          <div className="xp-in">
            <MessagePage
              icon="search"
              placement="public"
              title={stateWords('PU-05.not-found')}
              action={{ href: '/experiments', label: AREA.notFoundBrowse }}
              secondary={{ href: '/areas', label: AREA.notFoundAllAreas }}
            >
              {AREA.notFoundLine}
            </MessagePage>
          </div>
        </PublicMain>
      </>
    );
  }

  const page = course.data?.ok ? course.data.value : null;
  const areaHref = page ? `/areas/${encodeURIComponent(page.area.id)}` : '/areas';

  return (
    <>
      <DocumentTitle title={page ? page.course.name : ''} />
      <PublicMain>
        <div className="xp-phead">
          <div className="xp-in">
            <Crumbs
              trail={[
                { label: AREAS.crumbHome, href: '/' },
                { label: AREAS.crumbAreas, href: '/areas' },
                ...(page
                  ? [
                      { label: page.area.name, href: areaHref },
                      { label: page.course.platformCode ?? page.course.name },
                    ]
                  : []),
              ]}
            />
            {page ? (
              <div className="xp-phead-main">
                <span className="flex flex-wrap items-center gap-2.5">
                  <span className="xp-eyebrow">{courseEyebrow(page.area.name)}</span>
                  {page.course.platformCode ? (
                    <span className="xp-code">{page.course.platformCode}</span>
                  ) : null}
                </span>
                <h1 className="xp-h1">{page.course.name}</h1>
                {page.course.description ? (
                  <p className="xp-lead">{page.course.description}</p>
                ) : null}
                <Facts
                  facts={[
                    { term: AREAS.factExperiments, value: page.experiments.length },
                    ...(page.experiments.length > 0
                      ? [
                          {
                            term: COURSE.factFormats,
                            value: <FormatChips formats={page.course.formatsInCourse} />,
                          },
                        ]
                      : []),
                  ]}
                />
              </div>
            ) : null}
          </div>
        </div>
        <div className="xp-page">
          {course.isError ? (
            <div className="xp-in xp-in--read">
              <FailedBlock
                compact
                title={stateWords('PU-05.failed')}
                line={AREAS.failedLine}
                retryLabel={AREAS.retry}
                onRetry={() => void course.refetch()}
                forward={{ href: '/experiments', label: AREAS.browse }}
              />
            </div>
          ) : !page ? (
            <div className="xp-in xp-in--read">
              <span className="xr-sr" role="status">
                {stateWords('PU-05.loading')}
              </span>
            </div>
          ) : page.experiments.length === 0 ? (
            <div className="xp-in xp-in--read">
              <EmptyBlock
                icon="clock"
                title={COURSE.emptyTitle}
                line={COURSE.emptyLine}
                action={{ kind: 'link', label: COURSE.emptyBrowse, href: '/experiments' }}
              />
            </div>
          ) : (
            <div className="xp-in xp-in--read xr-content">
              <h2 className="xp-h3 mb-2">{COURSE.experimentsTitle}</h2>
              <ul className="xp-erows">
                {page.experiments.map((entry) => (
                  <ExperimentRow
                    key={entry.experimentId}
                    entry={entry}
                    href={`/experiments/${encodeURIComponent(entry.experimentId)}`}
                    inSelection={selected.has(entry.experimentId)}
                    withCourse={false}
                  />
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3">
                <MoreLink href={FOR_INSTITUTIONS_HREF}>{HOW_ACCESS_WORKS}</MoreLink>
                <MoreLink href={areaHref} arrow={false}>
                  {backToWords(page.area.name)}
                </MoreLink>
              </div>
            </div>
          )}
        </div>
      </PublicMain>
    </>
  );
}
