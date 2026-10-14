'use client';

import type { CatalogueEntry } from '@xr/contracts/draft';
import { FORMAT_META } from '@xr/domain';
import { Link } from '@xr/ui';
import { useMemo } from 'react';

import {
  ACCESS_STEPS,
  AREAS,
  CATALOGUE,
  FORMAT_CARDS,
  LANDING,
  areaCountsWords,
  availableInWords,
  browseAllWords,
  browseFormatWords,
  courseLine,
  stepWords,
} from '@/copy/public';
import { DocumentTitle } from '@/features/shared/document-title';
import { FOR_INSTITUTIONS_ID } from '@/nav/public-nav';
import { usePublicAreas, usePublicCatalogue, usePublicStructure } from '@/queries/catalogue';

import { PublicMain } from '../shell/public-frame';
import { Drawing, atmosphereClass, descriptionOf, fullDrawingOf, isKnownArt } from '../shared/art';
import { ArrowButtonLink, FailedBlock, FormatChips, MoreLink } from '../shared/blocks';
import { AreaExplorer } from './explorer';

/** The hero's one static scene: its drawing (B1-01 `art/thermal.svg`, "One static scene"). */
const HERO_DRAWING = 'thermal';

/**
 * PU-01 Landing with PU-14 "How institutional access works" (B1-01, B1-02): header → hero →
 * explorer → featured → formats → for institutions → closing band → footer. One gold primary in
 * the hero (Browse experiments); students and faculty sign in; institutions request access — that
 * way in (PU-07) renders with Package 1C. Every number is the sample world's (B1-01 "Counts").
 */
export function Landing() {
  const areas = usePublicAreas();
  const structure = usePublicStructure();
  const all = usePublicCatalogue({ text: '', areaId: null, featured: false, sort: 'default' });
  const featured = usePublicCatalogue({ text: '', areaId: null, featured: true, sort: 'default' });
  const entries = all.data?.ok ? all.data.value.entries : null;
  const total = all.data?.ok ? all.data.value.total : null;

  /** The area of each course, for the featured cards' tags (state-copy `PU-01.featured-tag`). */
  const areaOfCourse = useMemo(() => {
    const map = new Map<string, string>();
    if (structure.data?.ok)
      for (const { area, courses } of structure.data.value)
        for (const course of courses) map.set(course.id, area.name);
    return map;
  }, [structure.data]);

  // State-copy `PU-01.hero-caption`: the published experiment the hero drawing depicts.
  const heroEntry =
    entries?.find(
      (entry) => isKnownArt(entry.artworkKey) && fullDrawingOf(entry.artworkKey) === HERO_DRAWING,
    ) ?? null;

  return (
    <>
      <DocumentTitle title="" />
      <PublicMain>
        <Hero entry={heroEntry} />
        <div className="xp-ribbon" aria-hidden="true" />
        <section className="xp-sec" aria-labelledby="landing-explore">
          <div className="xp-in">
            <SectionHead
              id="landing-explore"
              eyebrow={LANDING.explorer.eyebrow}
              title={LANDING.explorer.title}
              lead={LANDING.explorer.lead}
            />
            {/* B1-01 "Areas loading (or art failed) → plain list": the explorer when the areas'
                courses are known, the readable plain list while they load or if that read fails,
                the failed block only when the areas themselves cannot be read. */}
            {areas.isError ? (
              <FailedBlock
                compact
                title={AREAS.failedTitle}
                line={AREAS.failedLine}
                retryLabel={AREAS.retry}
                onRetry={() => {
                  void areas.refetch();
                  void structure.refetch();
                }}
                forward={{ href: '/experiments', label: AREAS.browse }}
              />
            ) : structure.data?.ok && structure.data.value.length > 0 ? (
              <AreaExplorer areas={structure.data.value} />
            ) : areas.data?.ok ? (
              <PlainAreaList areas={areas.data.value} />
            ) : (
              <span className="xr-sr" role="status">
                {AREAS.loading}
              </span>
            )}
          </div>
        </section>
        <section className="xp-sec xp-sec--tint" aria-labelledby="landing-featured">
          <div className="xp-in">
            <SectionHead
              id="landing-featured"
              eyebrow={LANDING.featured.eyebrow}
              title={LANDING.featured.title}
              lead={LANDING.featured.lead}
              more={total === null ? null : { href: '/experiments', label: browseAllWords(total) }}
            />
            {featured.isError ? (
              <FailedBlock
                title={CATALOGUE.failedTitle}
                line={CATALOGUE.failedLine}
                retryLabel={CATALOGUE.retry}
                onRetry={() => void featured.refetch()}
              />
            ) : featured.data?.ok && (structure.data !== undefined || structure.isError) ? (
              // The cards wait for the structure read for their area tags; if that read fails the
              // cards still show, without tags (state-copy `PU-01.featured-tag`).
              <div className="xp-grid xp-grid--4">
                {featured.data.value.entries.map((entry) => (
                  <FeaturedCard
                    key={entry.experimentId}
                    entry={entry}
                    areaName={areaOfCourse.get(entry.courseId) ?? null}
                  />
                ))}
              </div>
            ) : (
              <span className="xr-sr" role="status">
                {CATALOGUE.loading}
              </span>
            )}
          </div>
        </section>
        <section className="xp-sec xp-sec--lilac" aria-labelledby="landing-formats">
          <div className="xp-in">
            <SectionHead
              id="landing-formats"
              eyebrow={LANDING.formats.eyebrow}
              title={LANDING.formats.title}
              lead={LANDING.formats.lead}
            />
            <FormatCards entries={entries} total={total} />
          </div>
        </section>
        <ForInstitutions />
        <section className="xp-band" aria-label={LANDING.band.label}>
          <div className="xp-in xp-band-row">
            <p className="xp-band-h">{LANDING.band.title}</p>
            <ArrowButtonLink href="/experiments" className="xr-btn xp-btn-navy xp-cta">
              {LANDING.band.action}
            </ArrowButtonLink>
          </div>
        </section>
      </PublicMain>
    </>
  );
}

function SectionHead({
  id,
  eyebrow,
  title,
  lead,
  more = null,
  focusable = false,
}: {
  readonly id: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly lead: string;
  readonly more?: { readonly href: string; readonly label: string } | null;
  /** PU-14: the heading takes focus when the page is opened at `#for-institutions`. */
  readonly focusable?: boolean;
}) {
  return (
    <div className="xp-sec-head">
      <div className="xp-sec-head-main">
        <span className="xp-eyebrow">{eyebrow}</span>
        <h2 id={id} className="xp-h2" tabIndex={focusable ? -1 : undefined}>
          {title}
        </h2>
      </div>
      <div className="xp-sec-head-side">
        <p className="xp-lead">{lead}</p>
        {more ? <MoreLink href={more.href}>{more.label}</MoreLink> : null}
      </div>
    </div>
  );
}

function Hero({ entry }: { readonly entry: CatalogueEntry | null }) {
  return (
    <section className="xp-hero xp-dark" aria-labelledby="landing-hero">
      <div className="xp-in xp-hero-grid">
        <div className="xp-hero-text">
          <span className="xp-eyebrow xp-eyebrow--on-dark">{LANDING.hero.eyebrow}</span>
          <h1 id="landing-hero" className="xp-hero-h">
            {LANDING.hero.lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
            <em>{LANDING.hero.emphasis}</em>
          </h1>
          <p className="xp-hero-lead">{LANDING.hero.lead}</p>
          <ArrowButtonLink href="/experiments" className="xr-btn xr-btn--primary xp-cta">
            {LANDING.hero.browse}
          </ArrowButtonLink>
          <ul className="xp-paths m-0 mt-2 p-0 pt-5">
            <li className="xp-path">
              <span className="xp-path-who">{LANDING.hero.studentsWho}</span>
              <Link href="/sign-in">{LANDING.hero.studentsLink}</Link>
            </li>
            {/* "Institutions · Request institutional access" (PU-07) renders with Package 1C (P0-35). */}
          </ul>
        </div>
        <figure className="xp-hero-fig">
          <span className="xp-illus">{LANDING.hero.illustration}</span>
          <div className="xp-hero-art">
            <Drawing artKey={HERO_DRAWING} description={descriptionOf(HERO_DRAWING)} />
          </div>
          {entry ? (
            <figcaption className="xp-hero-cap">
              <Link
                className="xp-hero-course"
                href={`/experiments/${encodeURIComponent(entry.experimentId)}`}
              >
                {courseLine(entry.platformCode, entry.name)}
              </Link>
              <FormatChips formats={entry.availableIn} variant="on-dark" />
            </figcaption>
          ) : null}
        </figure>
      </div>
    </section>
  );
}

/** B1-01 "Areas loading (or art failed) → plain list": readable at once. */
function PlainAreaList({
  areas,
}: {
  readonly areas: readonly {
    readonly id: string;
    readonly name: string;
    readonly courseCount: number;
    readonly experimentCount: number;
  }[];
}) {
  return (
    <>
      <ul className="xp-ex-list">
        {areas.map((area) => (
          <li key={area.id}>
            <Link href={`/areas/${encodeURIComponent(area.id)}`}>{area.name}</Link>
            <span className="xr-meta">
              {areaCountsWords(area.experimentCount, area.courseCount)}
            </span>
          </li>
        ))}
      </ul>
      <div className="xp-ex-ctrl">
        <MoreLink href="/areas" className="ml-0">
          {LANDING.explorer.viewAll}
        </MoreLink>
      </div>
    </>
  );
}

function FeaturedCard({
  entry,
  areaName,
}: {
  readonly entry: CatalogueEntry;
  readonly areaName: string | null;
}) {
  const art = isKnownArt(entry.artworkKey) ? entry.artworkKey : null;
  return (
    <article className="xp-card">
      <div className={art ? `xp-card-media ${atmosphereClass(art)}` : 'xp-card-media'}>
        {art ? <Drawing artKey={art} /> : null}
        {/* State-copy `PU-01.featured-tag`: the first word of the area's name. */}
        {areaName ? <span className="xp-card-tag">{areaName.split(' ')[0]}</span> : null}
      </div>
      <div className="xp-card-body">
        <span className="xp-card-course">{courseLine(entry.platformCode, entry.courseName)}</span>
        <h3 className="xp-card-title">
          <Link href={`/experiments/${encodeURIComponent(entry.experimentId)}`}>{entry.name}</Link>
        </h3>
        <p className="xp-card-text">{entry.summary}</p>
        <div className="xp-card-foot">
          <FormatChips formats={entry.availableIn} />
          <span className="xp-card-cta" aria-hidden="true">
            {LANDING.featured.cta}
          </span>
        </div>
      </div>
    </article>
  );
}

/** B1-01 Formats: "Available in N of 12 experiments", each card filtering the catalogue. */
function FormatCards({
  entries,
  total,
}: {
  readonly entries: readonly CatalogueEntry[] | null;
  readonly total: number | null;
}) {
  return (
    <div className="xp-grid xp-grid--4">
      {FORMAT_CARDS.map((card) => {
        const key = `fmt-${card.format}`;
        const count = entries?.filter((entry) => entry.availableIn.includes(card.format)).length;
        return (
          <article className="xp-card xp-fcard" key={card.format}>
            <div className={`xp-card-media ${atmosphereClass(key)}`}>
              <Drawing artKey={key} />
            </div>
            <div className="xp-card-body">
              <h3 className="xp-fcard-code">
                <strong>{FORMAT_META[card.format].code}</strong>
                <span>{card.name}</span>
              </h3>
              <p className="xp-card-text">{card.text}</p>
              {count !== undefined && total !== null ? (
                <p className="xp-fcard-n">{availableInWords(count, total)}</p>
              ) : null}
              <Link className="xp-fcard-link" href={`/experiments?format=${card.format}`}>
                {browseFormatWords(card.format)}
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/** PU-14 "How institutional access works" — the landing's `#for-institutions` section (B1-01). */
function ForInstitutions() {
  return (
    <section className="xp-sec" id={FOR_INSTITUTIONS_ID} aria-labelledby="landing-institutions">
      <div className="xp-in">
        <SectionHead
          id="landing-institutions"
          eyebrow={LANDING.institutions.eyebrow}
          title={LANDING.institutions.title}
          lead={LANDING.institutions.lead}
          focusable
        />
        <ol className="xp-steps4">
          {ACCESS_STEPS.map((step, index) => (
            <li className="xp-step4" key={step.title}>
              <span className="xp-step4-n">{stepWords(index)}</span>
              <span className="xp-step4-t">{step.title}</span>
              <span className="xp-step4-d">{step.detail}</span>
            </li>
          ))}
        </ol>
        {/* "Request institutional access" (PU-07) renders with Package 1C (P0-35). */}
      </div>
    </section>
  );
}
