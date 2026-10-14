'use client';

import { Link } from '@xr/ui';

import { AREAS, coursesWords, experimentsWords } from '@/copy/public';
import { DocumentTitle } from '@/features/shared/document-title';
import { usePublicAreas } from '@/queries/catalogue';

import { PublicMain } from '../shell/public-frame';
import { ArtMedia } from '../shared/art';
import { Crumbs, FailedBlock, Facts } from '../shared/blocks';

/**
 * PU-02 All engineering areas (B1-03 "PU-02 All engineering areas · 1440"; from the header
 * "Areas" or "View all areas"): the header with counts that link, then one card per area with a
 * published experiment (`listAreas`; an empty area is hidden, OD-B7-13). Loading draws skeleton
 * cards announced once; a failure keeps a way forward to the catalogue (B1-03 states).
 */
export function AllAreas() {
  const areas = usePublicAreas();
  const cards = areas.data?.ok ? areas.data.value : null;
  const totals = cards
    ? {
        areas: cards.length,
        courses: cards.reduce((sum, area) => sum + area.courseCount, 0),
        experiments: cards.reduce((sum, area) => sum + area.experimentCount, 0),
      }
    : null;

  return (
    <>
      <DocumentTitle title={AREAS.title} />
      <PublicMain>
        <div className="xp-phead">
          <div className="xp-in">
            <Crumbs trail={[{ label: AREAS.crumbHome, href: '/' }, { label: AREAS.crumbAreas }]} />
            <div className="xp-phead-main">
              <span className="xp-eyebrow">{AREAS.eyebrow}</span>
              <h1 className="xp-h1">{AREAS.title}</h1>
              <p className="xp-lead">{AREAS.lead}</p>
              {totals ? (
                <Facts
                  facts={[
                    { term: AREAS.factAreas, value: totals.areas },
                    { term: AREAS.factCourses, value: totals.courses },
                    {
                      term: AREAS.factExperiments,
                      value: <Link href="/experiments">{totals.experiments}</Link>,
                    },
                  ]}
                />
              ) : null}
            </div>
          </div>
        </div>
        <div className="xp-page">
          <div className="xp-in">
            {areas.isError ? (
              <FailedBlock
                compact
                title={AREAS.failedTitle}
                line={AREAS.failedLine}
                retryLabel={AREAS.retry}
                onRetry={() => void areas.refetch()}
                forward={{ href: '/experiments', label: AREAS.browse }}
              />
            ) : cards ? (
              <div className="xp-grid xp-grid--3">
                {cards.map((area) => (
                  <article className="xp-card xp-acard" key={area.id}>
                    <ArtMedia className="xp-card-media" artKey={area.artworkKey} name={area.name} />
                    <div className="xp-card-body">
                      <h2 className="xp-card-title">
                        <Link href={`/areas/${encodeURIComponent(area.id)}`}>{area.name}</Link>
                      </h2>
                      {area.description ? <p className="xp-card-text">{area.description}</p> : null}
                      <div className="xp-acard-counts">
                        <Link href={`/experiments?area=${encodeURIComponent(area.id)}`}>
                          {experimentsWords(area.experimentCount)}
                        </Link>
                        <span aria-hidden="true">·</span>
                        <span>{coursesWords(area.courseCount)}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="xp-grid xp-grid--3" aria-busy="true">
                <span className="xr-sr" role="status">
                  {AREAS.loading}
                </span>
                {[0, 1, 2].map((index) => (
                  <div className="xp-card" aria-hidden="true" key={index}>
                    <div className="xp-card-media" />
                    <div className="xp-card-body">
                      <span className="xr-skel h-5.5 w-7/10" />
                      <span className="xr-skel w-19/20" />
                      <span className="xr-skel w-3/5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PublicMain>
    </>
  );
}
