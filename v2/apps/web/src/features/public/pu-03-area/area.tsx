'use client';

import { FORMAT_DISPLAY_ORDER } from '@xr/domain';
import { Icon, Link, MessagePage } from '@xr/ui';

import { AREA, AREAS, HOW_ACCESS_WORKS, browseCountWords, experimentsWords } from '@/copy/public';
import { stateWords } from '@/copy/state-copy';
import { DocumentTitle } from '@/features/shared/document-title';
import { FOR_INSTITUTIONS_HREF } from '@/nav/public-nav';
import { usePublicArea, usePublicCatalogue } from '@/queries/catalogue';

import { PublicMain } from '../shell/public-frame';
import {
  ArrowButtonLink,
  Crumbs,
  FailedBlock,
  Facts,
  FormatChips,
  MoreLink,
} from '../shared/blocks';

/**
 * PU-03 Engineering area (B1-03 "PU-03 Engineering area · Mechanical & Manufacturing · 1440"):
 * the header with counts that link and the formats the area's courses are available in, then one
 * list of the courses with published experiments, each naming its experiments (`getArea` +
 * `searchCatalogue` for the area). No mosaic, no governance line. An unknown — or hidden — area is
 * B1-03's "We can't find that area" in the public header.
 */
export function AreaPage({ areaId }: { readonly areaId: string }) {
  const area = usePublicArea(areaId);
  const catalogue = usePublicCatalogue({ text: '', areaId, featured: false, sort: 'default' });

  if (area.data && !area.data.ok && area.data.error.kind === 'not-found') {
    return (
      <>
        <DocumentTitle title={AREA.notFoundTitle} />
        <PublicMain className="xp-page">
          <div className="xp-in">
            <MessagePage
              icon="search"
              placement="public"
              title={AREA.notFoundTitle}
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

  const page = area.data?.ok ? area.data.value : null;
  const entries = catalogue.data?.ok ? catalogue.data.value.entries : null;
  const failed = area.isError || catalogue.isError;
  const browseHref = `/experiments?area=${encodeURIComponent(areaId)}`;
  const formats = page
    ? FORMAT_DISPLAY_ORDER.filter((format) =>
        page.courses.some((course) => course.formatsInCourse.includes(format)),
      )
    : [];

  return (
    <>
      <DocumentTitle title={page ? page.area.name : ''} />
      <PublicMain>
        <div className="xp-phead">
          <div className="xp-in">
            <Crumbs
              trail={[
                { label: AREAS.crumbHome, href: '/' },
                { label: AREAS.crumbAreas, href: '/areas' },
                ...(page ? [{ label: page.area.name }] : []),
              ]}
            />
            {page ? (
              <div className="xp-phead-row">
                <div className="xp-phead-main">
                  <span className="xp-eyebrow">{AREA.eyebrow}</span>
                  <h1 className="xp-h1">{page.area.name}</h1>
                  {page.area.description ? (
                    <p className="xp-lead">{page.area.description}</p>
                  ) : null}
                  <Facts
                    facts={[
                      { term: AREAS.factCourses, value: page.area.courseCount },
                      {
                        term: AREAS.factExperiments,
                        value: <Link href={browseHref}>{page.area.experimentCount}</Link>,
                      },
                      { term: AREA.factAvailableIn, value: <FormatChips formats={formats} /> },
                    ]}
                  />
                </div>
                <ArrowButtonLink href={browseHref} className="xr-btn xr-btn--primary">
                  {browseCountWords(page.area.experimentCount)}
                </ArrowButtonLink>
              </div>
            ) : null}
          </div>
        </div>
        <div className="xp-page">
          <div className="xp-in xp-in--read">
            {failed ? (
              <FailedBlock
                compact
                title={stateWords('PU-03.failed')}
                line={AREAS.failedLine}
                retryLabel={AREAS.retry}
                onRetry={() => {
                  if (area.isError) void area.refetch();
                  if (catalogue.isError) void catalogue.refetch();
                }}
                forward={{ href: '/experiments', label: AREAS.browse }}
              />
            ) : page && entries ? (
              <>
                <h2 className="xp-h3 mb-4">{AREA.coursesTitle}</h2>
                <ul className="xp-courses">
                  {page.courses.map((course) => {
                    const ofCourse = entries.filter((entry) => entry.courseId === course.id);
                    return (
                      <li className="xp-course" key={course.id}>
                        <div>
                          {course.platformCode ? (
                            <span className="xp-course-code">{course.platformCode}</span>
                          ) : null}
                          <h3 className="xp-course-name">
                            <Link href={`/courses/${encodeURIComponent(course.id)}`}>
                              {course.name}
                            </Link>
                          </h3>
                          <div className="xp-course-exps">
                            {ofCourse.map((entry) => (
                              <span key={entry.experimentId}>{entry.name}</span>
                            ))}
                          </div>
                        </div>
                        <span className="xp-course-n">
                          {experimentsWords(ofCourse.length)} <Icon name="chevronRight" size={16} />
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-7">
                  <MoreLink href={FOR_INSTITUTIONS_HREF}>{HOW_ACCESS_WORKS}</MoreLink>
                </p>
              </>
            ) : (
              <span className="xr-sr" role="status">
                {stateWords('PU-03.loading')}
              </span>
            )}
          </div>
        </div>
      </PublicMain>
    </>
  );
}
