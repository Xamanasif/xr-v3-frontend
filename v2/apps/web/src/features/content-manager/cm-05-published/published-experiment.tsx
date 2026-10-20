'use client';

import {
  type CorrectionEntry,
  FORMAT_META,
  type FormatDelivery,
  inDisplayOrder,
  type Technology,
} from '@xr/domain';
import {
  Breadcrumbs,
  ButtonLink,
  CmCatalogueEntry,
  type CmDeliveryCard,
  CmDeliveryCards,
  CmFormatRows,
  CmGoLink,
  CmIdentityBand,
  CmIdentityTrack,
  CmLiveFacts,
  CmSheetSection,
  CmStageTrack,
  CmVersionChange,
  CmWideButton,
  DecisionPanel,
  DetailLayout,
  GoButton,
  Hint,
  Notice,
  RecordLine,
  StatusPill,
  Timeline,
  type TimelineEvent,
  V46Island,
} from '@xr/ui/v3';
import { type ReactNode, useEffect, useState } from 'react';

import {
  CORRECTIONS_PANEL,
  correctionsReleased,
  courseLabel,
  firstPublishedWhat,
  formatsLabel,
  formatsList,
  fromVendor,
  liveVersionLine,
  type OpenUpdateState,
  openUpdateStatus,
  PUBLISHED_PAGE,
  publishedOverline,
  releasedLine,
  releasedTitle,
  updateHeldNote,
  updateHeldWhat,
  updateProgressLine,
  updateStartedNote,
  updateStartedWhat,
  versionAfterFormats,
  versionReleasedNote,
  versionReleasedWhat,
} from '@/copy/cm-decision';
import { BACK_FROM_CORRECTION, CORRECTION_ENTRY } from '@/copy/cm-correction';
import { CM_SUBMISSION_STATUS, CM_UPDATE_STATUS, STAGE_TRACK_LABEL } from '@/copy/cm-shared';
import { dayMonthYear } from '@/copy/dates';
import { stateWords } from '@/copy/state-copy';
import {
  CONTENT_LIBRARY_ADDRESS,
  CONTENT_LIBRARY_TITLE,
  type CorrectionFocus,
  correctionAddress,
  publishedExperimentPlacement,
} from '@/nav/content-manager';
import { useAppNavigation } from '@/nav/navigation';
import { usePlatformCourseCodes, usePublishedExperiment } from '@/queries/production';
import type { PublishedExperimentView } from '@/queries/production-cm-decision';
import { useSession } from '@/queries/session';
import { useCommand } from '@/queries/use-command';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { noteRouteFocus } from '../../shared/workspace-frame/route-focus';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  backFromCorrectionFor,
  forgetBackFromCorrection,
  noteCorrectionArrival,
  useCorrectionSessionKey,
} from '../cm-08-updates/correction-draft';
import { correctionFocusTarget } from '../cm-08-updates/correction-view';
import { CM_STAGE_STATE_WORDS, correctionStages } from '../shared/stages';
import { cmUpdatePill } from '../shared/status';
import { useCmTodayLine } from '../shared/today-line';
import { correctionVersionChange, liveVersionOnly } from '../shared/version-change';

/** The open update states CM-05 names (CM-v1 `pubVM` `openUpd`: draft, returned, review, awaiting, hold). */
const OPEN_STATES = [
  'draft',
  'returned',
  'in-academic-review',
  'awaiting-release-decision',
  'on-hold',
] as const satisfies readonly OpenUpdateState[];
type OpenState = (typeof OPEN_STATES)[number];

function isOpenState(state: string): state is OpenState {
  return (OPEN_STATES as readonly string[]).includes(state);
}

/** The export's ids (CM-v1 `Main.dc.html` CM-05). */
const TITLE_ID = 'cm-h-published';
const PANEL_ID = 'cm-pub-panel';
const PANEL_TITLE_ID = 'cm-p-panel-h';
const PUBLIC_EXPERIMENT = (experimentId: string) =>
  `/experiments/${encodeURIComponent(experimentId)}`;

/**
 * CM-05 Published experiment — the owner-approved Content Manager export (V3 Refined B,
 * design/v3-refined-b/roles/CM-v1, `Main.dc.html` `v.published`; boards CM05-Published,
 * C14-PubAwaiting, C15-PubOnHold, C16-PubReleased), at `/content-manager/published/[experimentId]`.
 *
 * - **Read**: `CorrectionService.getPublishedExperiment` — the live experiment (its live version,
 *   versions, outcomes) and its one open correction, if any; the course's code and name from the
 *   platform course codes (`PlatformCourseCodeService.list`, CM-09's read). Loading and a failed
 *   read are the application's existing page states (CM-v1 HANDOFF §4).
 * - **As the export draws it**: the breadcrumb "Content library", the identity band (the course,
 *   the name, Published with the live version and the vendor; course, live since, formats,
 *   corrections; while a correction is open, its status, version change and four stages) with
 *   "View the public page" (PU-06); the live catalogue entry, read-only (summary, formats, the
 *   Academic Reviewer's learning outcomes, formats and device needs, description, live version);
 *   delivery, one card per format; the versions-and-updates history, newest first.
 * - **The Corrections panel** (state-copy `CM-05.correction-entry`): with no update open, "Start a
 *   correction" (the primary), "Edit catalogue details" (CM-06) and "Edit delivery link" (CM-07)
 *   ask the service to open the one correction draft — or to join it — and open the update's page
 *   with the field they name focused. While the update is a draft or returned the entries join it
 *   and "Continue the update" opens it; while it is with the Academic Reviewer or the Super Admin
 *   only "Open update" is offered. Never a second update: the service decides.
 * - **Notices**: "Back from the correction" once, after "Back to the published experiment" on an
 *   open update (memory only); the live version released today (state-copy `CM-05.released-today`).
 */
export function PublishedExperiment({ experimentId }: { readonly experimentId: string }) {
  const read = usePublishedExperiment(experimentId);
  const codes = usePlatformCourseCodes();
  const view = read.data?.ok ? read.data.value : null;
  useShellPage({
    ...publishedExperimentPlacement(view ? view.experiment.live.catalogue.name : null),
    title: CONTENT_LIBRARY_TITLE,
  });
  const courses = codes.data?.ok ? codes.data.value : null;
  const guard = (
    <RecordGuard
      read={{
        data: codes.isPending ? undefined : read.data,
        isPending: read.isPending || codes.isPending,
        isError: read.isError || codes.isError,
        refetch: () => {
          void read.refetch();
          void codes.refetch();
        },
      }}
      loadingLabel={stateWords('CM-05.loading')}
      failed={{ title: stateWords('CM-05.failed'), line: stateWords('CM-05.failed.line') }}
    >
      {(page) => {
        const course = courses?.find((row) => row.course.id === page.experiment.courseId);
        return (
          <Published
            key={page.experiment.id}
            view={page}
            courseCode={course?.course.platformCode ?? null}
            courseName={course?.course.name ?? ''}
            onReread={() => void read.refetch()}
          />
        );
      }}
    </RecordGuard>
  );
  // The application's existing loading and failed states keep their v46 look (CM-v1 HANDOFF §4).
  return view && !codes.isPending ? guard : <V46Island>{guard}</V46Island>;
}

/** A live value, or the register's "—" where the record leaves it blank (`CM-05.empty-value`). */
function valueOf(text: string | null | undefined): string {
  return text && text.trim() !== '' ? text : stateWords('CM-05.empty-value');
}

/** The versions-and-updates history, newest first (state-copy `CM-05.history`). */
function historyOf(view: PublishedExperimentView, open: OpenUpdate | null): TimelineEvent[] {
  const { experiment, openUpdate } = view;
  const events: TimelineEvent[] = [];
  if (openUpdate && open) {
    events.push(
      open.state === 'on-hold' && openUpdate.hold
        ? {
            what: updateHeldWhat(),
            when: dayMonthYear(openUpdate.hold.at),
            note: updateHeldNote(experiment.live.label, openUpdate.hold.reason),
          }
        : {
            what: updateStartedWhat(CM_UPDATE_STATUS[open.state]),
            when: dayMonthYear(openUpdate.startedAt),
            note: updateStartedNote(openUpdate.versionLabel),
          },
    );
  }
  for (const version of [...experiment.versions].reverse()) {
    events.push(
      version.source.kind === 'correction-release'
        ? {
            what: versionReleasedWhat(version.label),
            when: dayMonthYear(version.liveFrom),
            note: versionReleasedNote(version.label === experiment.live.label),
          }
        : {
            what: firstPublishedWhat(version.label),
            when: dayMonthYear(version.liveFrom),
            note: PUBLISHED_PAGE.firstPublicationNote,
          },
    );
  }
  return events;
}

/** The live delivery of one format, as its card lists it (`deliv`). */
function deliveryCard(format: Technology, delivery: FormatDelivery): CmDeliveryCard {
  const code = FORMAT_META[format].code;
  if (delivery.format === 'web') {
    return {
      key: format,
      code,
      title: PUBLISHED_PAGE.webTitle,
      rows: [
        { term: PUBLISHED_PAGE.webLink, value: valueOf(delivery.webLink) },
        { term: PUBLISHED_PAGE.browser, value: valueOf(delivery.browserAndComputer) },
      ],
    };
  }
  return {
    key: format,
    code,
    title: PUBLISHED_PAGE.packageTitle,
    rows: [
      { term: PUBLISHED_PAGE.package, value: valueOf(delivery.packageLabel) },
      {
        term: PUBLISHED_PAGE.packageReference,
        value: valueOf(delivery.packageReference ?? delivery.packageFileName),
      },
      { term: PUBLISHED_PAGE.deviceNeeded, value: valueOf(delivery.deviceNeeded) },
      { term: PUBLISHED_PAGE.installNotes, value: valueOf(delivery.installNotes) },
    ],
  };
}

interface OpenUpdate {
  readonly id: string;
  readonly state: OpenState;
}

/** A refused or failed entry, as the panel says it (state-copy `CM-05.entry-*`). */
type EntryNotice = 'refused' | 'unavailable';

function Published({
  view,
  courseCode,
  courseName,
  onReread,
}: {
  readonly view: PublishedExperimentView;
  readonly courseCode: string | null;
  readonly courseName: string;
  readonly onReread: () => void;
}) {
  const { experiment, openUpdate } = view;
  const live = experiment.live;
  const openState: OpenState | null =
    openUpdate && isOpenState(openUpdate.state) ? openUpdate.state : null;
  const open: OpenUpdate | null =
    openUpdate && openState ? { id: openUpdate.id, state: openState } : null;
  const formats = inDisplayOrder(live.formats.map((entry) => entry.format));
  const codes = formats.map((format) => FORMAT_META[format].code);
  // A draft or returned update is joined by the edit entries; any other open update offers only
  // "Open update" (CM-v1 `pubVM` `joinable`, `locked`; OD-B6-07).
  const joinable = open !== null && (open.state === 'draft' || open.state === 'returned');
  const today = useCmTodayLine();
  const session = useSession();

  const navigation = useAppNavigation();
  const sessionKey = useCorrectionSessionKey();
  // Once, after "Back to the published experiment" (read while the page first renders).
  const [back] = useState(() => backFromCorrectionFor(sessionKey, experiment.id));
  useEffect(() => forgetBackFromCorrection(sessionKey, experiment.id), [sessionKey, experiment.id]);

  const openCmd = useCommand((ports) => ports.corrections.openCorrection);
  const [pending, setPending] = useState<CorrectionEntry | null>(null);
  const [entryNotice, setEntryNotice] = useState<EntryNotice | null>(null);

  /** Opens or joins the one draft, then its page — the named field focused (CM-06, CM-07). */
  const enter = (entry: CorrectionEntry, focus: CorrectionFocus | null) => {
    if (openCmd.busy) return;
    setEntryNotice(null);
    setPending(entry);
    openCmd.run({ experimentId: experiment.id, entry }).then(
      (answer) => {
        setPending(null);
        if (!answer.ok) {
          // The page is read again and shows what the experiment is now; a refused entry (an
          // update already open and no longer joinable) also says so (`CM-05.entry-refused`).
          if (answer.error.kind === 'refused') setEntryNotice('refused');
          onReread();
          return;
        }
        const id = answer.value.update.id;
        const target = correctionFocusTarget(focus, experiment);
        if (target) noteRouteFocus(correctionAddress(id), target);
        // The update's page explains the arrival once (state-copy `CM-08.arrival`).
        noteCorrectionArrival(sessionKey, id, { entry, joined: answer.value.joined });
        navigation.navigate(correctionAddress(id, focus));
      },
      () => {
        setPending(null);
        setEntryNotice('unavailable');
      },
    );
  };

  const editEntries = (
    <>
      <CmWideButton
        icon="edit"
        busy={pending === 'edit-catalogue-details'}
        busyLabel={stateWords('CM-05.entry-busy')}
        onClick={() => enter('edit-catalogue-details', 'summary')}
      >
        {CORRECTION_ENTRY.editCatalogue}
      </CmWideButton>
      <CmWideButton
        icon="edit"
        busy={pending === 'edit-delivery-link'}
        busyLabel={stateWords('CM-05.entry-busy')}
        onClick={() => enter('edit-delivery-link', 'web-link')}
      >
        {CORRECTION_ENTRY.editDelivery}
      </CmWideButton>
    </>
  );

  // The live version came from a correction released today (state-copy `CM-05.released-today`).
  const liveIndex = experiment.versions.findIndex((version) => version.label === live.label);
  const releasedToday =
    live.source.kind === 'correction-release' &&
    session.status === 'signed-in' &&
    dayMonthYear(live.liveFrom) === dayMonthYear(session.signedInAt)
      ? { from: liveIndex > 0 ? (experiment.versions[liveIndex - 1]?.label ?? '') : '' }
      : null;
  const released = experiment.versions.filter(
    (version) => version.source.kind === 'correction-release',
  ).length;
  const openPill = open ? cmUpdatePill(open.state) : null;

  let actions: ReactNode;
  if (open === null) {
    actions = (
      <>
        <RecordLine>{CORRECTIONS_PANEL.intro}</RecordLine>
        <GoButton
          id="cm-p-start"
          busy={pending === 'start-a-correction'}
          busyLabel={stateWords('CM-05.entry-busy')}
          onClick={() => enter('start-a-correction', null)}
        >
          {CORRECTION_ENTRY.start}
        </GoButton>
        {editEntries}
      </>
    );
  } else {
    const line = updateProgressLine(open.state, live.label);
    actions = joinable ? (
      <>
        <Notice tone="info" icon="edit" role="status" title={CORRECTIONS_PANEL.correctionOpen}>
          {line}
        </Notice>
        <CmGoLink href={correctionAddress(open.id)}>{CORRECTIONS_PANEL.continueUpdate}</CmGoLink>
        {editEntries}
      </>
    ) : (
      <>
        <Notice
          tone={open.state === 'on-hold' ? 'paused' : 'info'}
          icon={open.state === 'on-hold' ? 'pauseCircle' : 'clock'}
          role="status"
          title={CORRECTIONS_PANEL.updateInProgress}
        >
          {line}
        </Notice>
        <CmGoLink href={correctionAddress(open.id)}>{CORRECTION_ENTRY.openUpdate}</CmGoLink>
      </>
    );
  }

  return (
    <>
      <CmIdentityBand
        variant="record"
        breadcrumbs={
          <Breadcrumbs
            levels={[{ label: CONTENT_LIBRARY_TITLE, href: CONTENT_LIBRARY_ADDRESS }]}
            current={live.catalogue.name}
          />
        }
        date={today}
        eyebrow={publishedOverline(courseCode ?? courseName)}
        title={live.catalogue.name}
        titleId={TITLE_ID}
        status={
          <>
            <StatusPill tone="ok" size="lg">
              {CM_SUBMISSION_STATUS.published}
            </StatusPill>
            <CmVersionChange {...liveVersionOnly(live.label)} />
            {experiment.vendorOrganisation ? (
              <span>{fromVendor(experiment.vendorOrganisation)}</span>
            ) : null}
          </>
        }
        actions={
          <ButtonLink icon="externalLink" href={PUBLIC_EXPERIMENT(experiment.id)}>
            {PUBLISHED_PAGE.viewPublic}
          </ButtonLink>
        }
        goTo={{ label: PUBLISHED_PAGE.goTo, targetId: PANEL_ID, focusId: PANEL_TITLE_ID }}
        facts={[
          {
            key: 'course',
            term: PUBLISHED_PAGE.factCourse,
            value: courseLabel(courseCode, courseName),
          },
          { key: 'since', term: PUBLISHED_PAGE.factLiveSince, value: dayMonthYear(live.liveFrom) },
          { key: 'formats', term: PUBLISHED_PAGE.factFormats, value: formatsList(codes) },
          open && openPill
            ? {
                key: 'corrections',
                term: PUBLISHED_PAGE.factCorrections,
                value: openUpdateStatus(open.state),
              }
            : released > 0
              ? {
                  key: 'corrections',
                  term: PUBLISHED_PAGE.factCorrections,
                  value: correctionsReleased(released),
                }
              : {
                  key: 'corrections',
                  term: PUBLISHED_PAGE.factCorrections,
                  value: PUBLISHED_PAGE.noCorrections,
                  quiet: true,
                },
        ]}
        track={
          openUpdate && open && openPill ? (
            <CmIdentityTrack
              title={PUBLISHED_PAGE.trackTitle}
              status={
                <>
                  <StatusPill tone={openPill.tone}>{openUpdateStatus(open.state)}</StatusPill>
                  <CmVersionChange {...correctionVersionChange(openUpdate, live.label)} />
                </>
              }
            >
              <CmStageTrack
                mini
                label={STAGE_TRACK_LABEL.openCorrection}
                steps={correctionStages(openUpdate, live.label)}
                stateWords={CM_STAGE_STATE_WORDS}
              />
            </CmIdentityTrack>
          ) : null
        }
      />
      {back ? (
        <Notice tone="info" icon="lock" role="status" title={BACK_FROM_CORRECTION.title}>
          {BACK_FROM_CORRECTION.line}
        </Notice>
      ) : null}
      {releasedToday ? (
        <Notice tone="ok" icon="check" role="status" title={releasedTitle(live.label)}>
          {releasedLine(dayMonthYear(live.liveFrom), releasedToday.from)}
        </Notice>
      ) : null}
      <DetailLayout
        asideId={PANEL_ID}
        asideLabelledBy={PANEL_TITLE_ID}
        main={
          <>
            <CmSheetSection
              title={PUBLISHED_PAGE.catalogueTitle}
              titleId="cm-p-cat"
              note={PUBLISHED_PAGE.catalogueMeta}
            >
              <CmCatalogueEntry
                nameId="cm-p-cat-name"
                tag={{ words: PUBLISHED_PAGE.inCatalogueTag, tone: 'ok' }}
                course={{ code: courseCode, name: courseName }}
                name={live.catalogue.name}
                summary={live.catalogue.summary}
                availableIn={PUBLISHED_PAGE.availableIn}
                formats={codes}
                formatsLabel={formatsLabel(codes)}
                version={versionAfterFormats(live.label)}
                outcomesTitle={PUBLISHED_PAGE.outcomesTitle}
                outcomesBy={PUBLISHED_PAGE.outcomesBy}
                outcomes={experiment.learningOutcomes.map((outcome) => outcome.text)}
                formatsTitle={PUBLISHED_PAGE.formatsTitle}
              >
                <CmFormatRows
                  head={[
                    PUBLISHED_PAGE.columnFormat,
                    PUBLISHED_PAGE.columnHow,
                    PUBLISHED_PAGE.columnDevice,
                  ]}
                  rows={formats.map((format) => {
                    const delivery = live.formats.find(
                      (entry) => entry.format === format,
                    )?.delivery;
                    const device =
                      delivery?.format === 'web'
                        ? delivery.browserAndComputer
                        : delivery?.deviceNeeded;
                    return {
                      key: format,
                      code: FORMAT_META[format].code,
                      name: FORMAT_META[format].name,
                      cells: [
                        { label: PUBLISHED_PAGE.columnHow, lines: [FORMAT_META[format].howItRuns] },
                        { label: PUBLISHED_PAGE.columnDevice, lines: [valueOf(device)] },
                      ],
                    };
                  })}
                />
              </CmCatalogueEntry>
              <CmLiveFacts
                items={[
                  { term: PUBLISHED_PAGE.description, value: live.catalogue.description },
                  {
                    term: PUBLISHED_PAGE.liveVersion,
                    value: liveVersionLine(live.label, dayMonthYear(live.liveFrom)),
                  },
                ]}
              />
            </CmSheetSection>
            <CmSheetSection
              title={PUBLISHED_PAGE.deliveryTitle}
              titleId="cm-p-del"
              note={PUBLISHED_PAGE.deliveryMeta}
            >
              <CmDeliveryCards
                cards={formats.flatMap((format) => {
                  const delivery = live.formats.find((entry) => entry.format === format)?.delivery;
                  return delivery ? [deliveryCard(format, delivery)] : [];
                })}
              />
            </CmSheetSection>
            <CmSheetSection
              title={PUBLISHED_PAGE.historyTitle}
              titleId="cm-p-hist"
              note={PUBLISHED_PAGE.historyMeta}
            >
              <Timeline events={historyOf(view, open)} />
            </CmSheetSection>
          </>
        }
        aside={
          <DecisionPanel title={CORRECTIONS_PANEL.title} titleId={PANEL_TITLE_ID}>
            {entryNotice ? (
              <Notice
                tone="warn"
                icon="alertCircle"
                role="alert"
                title={stateWords(
                  entryNotice === 'refused' ? 'CM-05.entry-refused' : 'CM-05.entry-unavailable',
                )}
              />
            ) : null}
            {actions}
            <Hint>{CORRECTIONS_PANEL.foot}</Hint>
          </DecisionPanel>
        }
      />
    </>
  );
}
