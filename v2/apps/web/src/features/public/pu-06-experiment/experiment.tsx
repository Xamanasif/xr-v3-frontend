'use client';

import type { CourseCard, PublicExperimentPage } from '@xr/contracts/draft';
import { FORMAT_DISPLAY_ORDER, FORMAT_META, isTechnology, type Technology } from '@xr/domain';
import { BackLink, FormatBadge, Icon, Link, MessagePage } from '@xr/ui';

import {
  ACCESS_STEPS,
  CATALOGUE,
  EXPERIMENT,
  HOW_ACCESS_WORKS,
  backToFormatWords,
  courseLine,
  courseMetaWords,
  notAvailableWords,
} from '@/copy/public';
import { stateWords } from '@/copy/state-copy';
import { DocumentTitle } from '@/features/shared/document-title';
import { useAppNavigation } from '@/nav/navigation';
import { FOR_INSTITUTIONS_HREF } from '@/nav/public-nav';
import { usePublicCourse, usePublicExperiment } from '@/queries/catalogue';

import { PublicMain } from '../shell/public-frame';
import {
  ArtFallback,
  Drawing,
  atmosphereClass,
  descriptionOf,
  fullDrawingOf,
  isKnownArt,
} from '../shared/art';
import { Crumbs, FailedBlock, FormatChips, MoreLink } from '../shared/blocks';
import { SelectionPanel } from './selection-panel';

/**
 * PU-06 Experiment (B1-05; Appendix A PU-06 `/experiments/[experimentId]` + `?format=` from a
 * filtered catalogue): hero (course, title, summary, "Available in", illustration) → learning
 * outcomes → formats and device needs → preview, with the "Get this for your institution" panel
 * and "Part of the course" / "How institutional access works" beside it. Only published formats
 * are listed (LD-2); student access is never implied. Unpublished or unknown → B1-05 "We can't
 * find that experiment". Read with `getExperiment`, and `getCourse` for the course's area and size.
 */
export function ExperimentPage({ experimentId }: { readonly experimentId: string }) {
  const navigation = useAppNavigation();
  const experiment = usePublicExperiment(experimentId);
  const page = experiment.data?.ok ? experiment.data.value : null;
  const course = usePublicCourse(page?.courseId ?? '', { enabled: page !== null });
  const coursePage = course.data?.ok ? course.data.value : null;

  // B1-05 "Arrived with a format filter": the filter is context, not a restriction.
  const requested = new URLSearchParams(navigation.search).get('format');
  const filter: Technology | null =
    page && isTechnology(requested) && page.availableIn.includes(requested) ? requested : null;

  if (experiment.data && !experiment.data.ok && experiment.data.error.kind === 'not-found') {
    return (
      <>
        <DocumentTitle title={EXPERIMENT.notFoundTitle} />
        <PublicMain className="xp-page">
          <div className="xp-in">
            <MessagePage
              icon="search"
              placement="public"
              title={EXPERIMENT.notFoundTitle}
              action={{ href: '/experiments', label: EXPERIMENT.notFoundBrowse }}
              secondary={{ href: '/', label: EXPERIMENT.notFoundHome }}
            >
              {EXPERIMENT.notFoundLine}
            </MessagePage>
          </div>
        </PublicMain>
      </>
    );
  }

  if (experiment.isError || course.isError || (course.data && !course.data.ok)) {
    return (
      <>
        <DocumentTitle title={stateWords('PU-06.failed')} />
        <PublicMain className="xp-page">
          <div className="xp-in py-6">
            <FailedBlock
              title={stateWords('PU-06.failed')}
              line={CATALOGUE.failedLine}
              retryLabel={CATALOGUE.retry}
              onRetry={() => {
                if (experiment.isError) void experiment.refetch();
                else void course.refetch();
              }}
            />
          </div>
        </PublicMain>
      </>
    );
  }

  // Every state renders the same `main` (the route-focus target keeps its focus as data arrives).
  if (!page || !coursePage) {
    return (
      <>
        <DocumentTitle title="" />
        <PublicMain>
          <span className="xr-sr" role="status">
            {stateWords('PU-06.loading')}
          </span>
        </PublicMain>
      </>
    );
  }

  return (
    <>
      <DocumentTitle title={page.name} />
      <PublicMain>
        <Hero page={page} area={coursePage.area} filter={filter} />
        <div className="xp-page">
          <div className="xp-in">
            <div className="xp-xbody">
              <div className="xp-xmain">
                <Outcomes page={page} />
                <Formats page={page} filter={filter} />
                <Preview page={page} />
              </div>
              <Aside
                page={page}
                course={coursePage.course}
                areaName={coursePage.area.name}
                size={coursePage.experiments.length}
              />
            </div>
          </div>
        </div>
      </PublicMain>
    </>
  );
}

function Hero({
  page,
  area,
  filter,
}: {
  readonly page: PublicExperimentPage;
  readonly area: { readonly id: string; readonly name: string };
  readonly filter: Technology | null;
}) {
  const courseHref = `/courses/${encodeURIComponent(page.courseId)}`;
  const art = isKnownArt(page.artworkKey) ? fullDrawingOf(page.artworkKey) : null;
  return (
    <section className="xp-xhero xp-dark" aria-labelledby="experiment-title">
      <div className="xp-in">
        <Crumbs
          trail={[
            { label: EXPERIMENT.crumb, href: '/experiments' },
            { label: area.name, href: `/areas/${encodeURIComponent(area.id)}` },
            { label: page.platformCode ?? page.courseName, href: courseHref },
            { label: page.name },
          ]}
        />
        {filter ? (
          <BackLink href={`/experiments?format=${filter}`}>{backToFormatWords(filter)}</BackLink>
        ) : null}
        <div className="xp-xgrid">
          <div className="xp-xhead">
            <div className="xp-xtext">
              <Link className="xp-xcourse" href={courseHref}>
                {courseLine(page.platformCode, page.courseName)}
              </Link>
              <h1 id="experiment-title" className="xp-xtitle">
                {page.name}
              </h1>
              <p className="xp-xsum">{page.summary}</p>
              <FormatChips
                formats={page.availableIn}
                label={EXPERIMENT.availableIn}
                variant="on-dark"
              />
            </div>
            <figure className="xp-xart">
              {art ? (
                <div className={`xp-xart-frame ${atmosphereClass(art)}`}>
                  <Drawing artKey={art} description={descriptionOf(art)} />
                </div>
              ) : (
                <div className="xp-xart-frame">
                  <ArtFallback name={page.name} />
                </div>
              )}
              <figcaption className="xp-illus">{EXPERIMENT.illustration}</figcaption>
            </figure>
          </div>
          <SelectionPanel page={page} filter={filter} />
        </div>
      </div>
    </section>
  );
}

function Outcomes({ page }: { readonly page: PublicExperimentPage }) {
  return (
    <section aria-labelledby="experiment-outcomes">
      <h2 id="experiment-outcomes" className="xp-h2 xp-h2--sm mb-2">
        {EXPERIMENT.outcomesTitle}
      </h2>
      <p className="xr-meta mb-4">{EXPERIMENT.outcomesLine}</p>
      <ul className="xp-outcomes">
        {page.learningOutcomes.map((outcome) => (
          <li key={outcome}>
            <Icon name="done" />
            <span>{outcome}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Formats({
  page,
  filter,
}: {
  readonly page: PublicExperimentPage;
  readonly filter: Technology | null;
}) {
  const missing = FORMAT_DISPLAY_ORDER.filter((format) => !page.availableIn.includes(format));
  const unavailable = notAvailableWords(missing);
  return (
    <section aria-labelledby="experiment-formats">
      <h2 id="experiment-formats" className="xp-h2 xp-h2--sm mb-4">
        {EXPERIMENT.formatsTitle}
      </h2>
      <table className="xp-ftable">
        <thead>
          <tr>
            <th>{EXPERIMENT.columnFormat}</th>
            <th>{EXPERIMENT.columnHow}</th>
            <th>{EXPERIMENT.columnDevice}</th>
          </tr>
        </thead>
        <tbody>
          {page.formats.map((entry) => (
            <tr key={entry.format} className={entry.format === filter ? 'is-hl' : undefined}>
              <td data-label={EXPERIMENT.columnFormat}>
                <FormatBadge format={FORMAT_META[entry.format].code} />
                <span className="xp-fname">{FORMAT_META[entry.format].name}</span>
                {entry.format === filter ? (
                  <span className="xp-diff mt-1.5 ml-0">{EXPERIMENT.matchesFilter}</span>
                ) : null}
              </td>
              <td data-label={EXPERIMENT.columnHow}>{entry.howItRuns}</td>
              <td data-label={EXPERIMENT.columnDevice}>{entry.deviceNeeds}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {unavailable ? <p className="xp-unavail">{unavailable}</p> : null}
    </section>
  );
}

function Preview({ page }: { readonly page: PublicExperimentPage }) {
  const art = isKnownArt(page.artworkKey) ? fullDrawingOf(page.artworkKey) : null;
  return (
    <section aria-labelledby="experiment-preview">
      <h2 id="experiment-preview" className="xp-h2 xp-h2--sm mb-4">
        {EXPERIMENT.previewTitle}
      </h2>
      {page.preview ? (
        <div className="xp-preview xp-atm-steel">
          <Drawing artKey="fmt-web" description={EXPERIMENT.previewAlt} />
          <div className="xp-preview-bar">
            <span className="xp-illus">{EXPERIMENT.previewLabel}</span>
            <Link external className="xr-btn xr-btn--on-dark xr-btn--sm" href={page.preview.link}>
              <Icon name="play" />
              {EXPERIMENT.previewOpen}
            </Link>
          </div>
        </div>
      ) : (
        <div className={art ? `xp-preview ${atmosphereClass(art)}` : 'xp-preview'}>
          {art ? (
            <Drawing artKey={art} description={descriptionOf(art)} />
          ) : (
            <ArtFallback name={page.name} />
          )}
          <div className="xp-preview-bar">
            <span className="xp-illus">{EXPERIMENT.noPreview}</span>
          </div>
        </div>
      )}
    </section>
  );
}

function Aside({
  page,
  course,
  areaName,
  size,
}: {
  readonly page: PublicExperimentPage;
  readonly course: CourseCard;
  readonly areaName: string;
  readonly size: number;
}) {
  return (
    <aside className="xp-xside" aria-label={EXPERIMENT.aside}>
      <div className="xp-mini">
        <span className="xp-eyebrow">{EXPERIMENT.partOfCourse}</span>
        {course.platformCode ? (
          <span className="xp-code self-start">{course.platformCode}</span>
        ) : null}
        <h2 className="xp-h3">{course.name}</h2>
        <p className="xr-meta">{courseMetaWords(areaName, size)}</p>
        <MoreLink href={`/courses/${encodeURIComponent(page.courseId)}`}>
          {EXPERIMENT.viewCourse}
        </MoreLink>
      </div>
      <div className="xp-mini">
        <span className="xp-eyebrow">{HOW_ACCESS_WORKS}</span>
        <ol className="xp-mini-steps">
          {ACCESS_STEPS.map((step, index) => (
            <li key={step.title}>
              <b>{index + 1}</b>
              <span>{step.title}</span>
            </li>
          ))}
        </ol>
        <MoreLink href={FOR_INSTITUTIONS_HREF}>{EXPERIMENT.moreAboutAccess}</MoreLink>
      </div>
    </aside>
  );
}
