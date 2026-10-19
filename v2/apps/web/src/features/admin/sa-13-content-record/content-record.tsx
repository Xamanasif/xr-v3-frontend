'use client';

import { FORMAT_META, inDisplayOrder } from '@xr/domain';
import {
  Breadcrumbs,
  Bullets,
  Button,
  ButtonLink,
  ConfirmDialog,
  CourseCode,
  DecisionPanel,
  DefinitionList,
  DetailLayout,
  Field,
  FormatBadges,
  GoButton,
  Hint,
  Notice,
  PageHead,
  Quote,
  SectionNote,
  StandList,
  StatusPill,
  SurfaceSection,
  Textarea,
  Timeline,
} from '@xr/ui/v3';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { CONTENT_RECORD } from '@/copy/content-oversight';
import { dayMonthYear } from '@/copy/dates';
import { fieldWords } from '@/copy/field-words';
import {
  ALL_CONTENT_LIST,
  CONTENT_HEAD,
  CONTENT_RECORD_V3,
  DIALOG_GROUPS,
  formatsLabel,
  inWorkflowLine,
  liveVersionLine,
  overrideConfirmNow,
  overrideConfirmTitle,
  stuckLine,
} from '@/copy/sa-content';
import { stateWords } from '@/copy/state-copy';
import {
  ALL_CONTENT_ADDRESS,
  CONTENT_TITLE,
  CONTENT_UPDATES_ADDRESS,
  contentRecordPlacement,
  recordRefOf,
  updateDecisionAddress,
} from '@/nav/admin-content';
import { rolesAddress } from '@/nav/platform-roles';
import { useContentRecord } from '@/queries/admin-content';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { SaRecordGuard } from '../shared/sa-record-guard';
import { useHeadingFocusOnArrival, useTodayLine } from '../sa-10-updates/content-head';
import { type ContentRecordView, type RecordFacts, recordFacts } from './record-view';

/** The override panel's id (the export's `rc-panel`): "Go to override" leads to it. */
const PANEL_ID = 'content-record-panel';
const PANEL_TITLE_ID = 'content-record-panel-h';
/** The reason field (the export's `rc-reason`): focus goes to it after its error. */
const REASON_ID = 'content-record-reason';
/** The flash after the move (the export's `sa-flash`), which takes focus. */
const FLASH_ID = 'content-record-flash';
/** A refused move (the export's `sa-refusal`), which takes focus. */
const REFUSAL_ID = 'content-record-refusal';

/**
 * SA-13 Content record — the owner-approved Super Admin export's `V.record`
 * (design/v3-refined-b/roles/SA-v1, renders `<width>_content_records_dc-motor.png` and the state
 * `sa13-published`), at `/admin/content/records/[recordId]` (a submission's id, or the id of an
 * experiment published without one: `recordRefOf`).
 *
 * - **Read**: `ProductionService.getContentRecord` — the submission and/or the experiment,
 *   whether the service finds it stuck, who can act (its words), its course, its open correction
 *   where she may see it (UPD-18) and, for a stuck record, the reviewer scopes over its course
 *   that were withdrawn (PC-71). An address that names no record is the GL-04 "This page isn’t
 *   available" message.
 * - **As the export draws it**: the crumbs Content › All content › the record; "Submission" or
 *   "Experiment", the name, the status, the course code and name; one notice — stuck (why nobody
 *   can act, "Open Platform roles"), published · read-only (with its open correction: "Open the
 *   release decision" or "Open the held correction", SA-11), or in the workflow (who can act;
 *   nothing is needed from her); the catalogue details (read-only), the learning outcomes and the
 *   governance history, newest first (`record-view`). Published records are always read-only: no
 *   edit, no catalogue form, no override. No reference is shown.
 * - **Move status (override)**: only on a stuck, non-published record, in the decision panel
 *   beside it ("Go to override" below 860 px); the one move is back to the vendor (OD-B7-09) and
 *   Published is never a target; the reason is required (checked before the confirmation opens;
 *   the service checks it again) and kept in the history with her name.
 *   `ProductionService.overrideStatus` with the revision the page showed when the confirmation
 *   opened decides (`override-not-stuck`, stale revisions): a refusal closes the confirmation,
 *   reads the record again and says why in the repo's words (state-copy `SA-13.stale.*`,
 *   `SA-13.moved-on`); a failure for now keeps it open (`SA-13.unavailable`). The result is said
 *   in the flash, which takes focus.
 */
export function ContentRecord({ recordId }: { readonly recordId: string }) {
  const read = useContentRecord(recordRefOf(recordId));
  const view = read.data?.ok ? read.data.value : null;
  useShellPage(contentRecordPlacement(view ? recordFacts(view).name : null));

  return (
    <SaRecordGuard
      read={read}
      loadingLabel={stateWords('SA-13.loading')}
      failedTitle={stateWords('SA-13.failed')}
    >
      {(record) => <Record view={record} refetch={() => read.refetch()} />}
    </SaRecordGuard>
  );
}

/** A refused override, as the page says it (state-copy `SA-13.stale.*`, `SA-13.moved-on`). */
type Refusal = 'stale' | 'moved-on';

function Record({
  view,
  refetch,
}: {
  readonly view: ContentRecordView;
  readonly refetch: () => Promise<unknown>;
}) {
  const facts = recordFacts(view);
  const today = useTodayLine();
  const stuck = facts.notice.kind === 'stuck';
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  /** The record's revision when the confirmation opened: a record changed meanwhile is refused. */
  const [expectedRev, setExpectedRev] = useState(facts.override?.rev ?? 0);
  const [unavailable, setUnavailable] = useState(false);
  const [flash, setFlash] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useHeadingFocusOnArrival(titleRef, true);
  const move = useCommand((ports) => ports.production.overrideStatus);

  // Focus moves after the commit that shows its target: the flash after the move, the reason field
  // after its error, the refusal after a refused move, the title after "Check it again".
  const [focusRequest, setFocusRequest] = useState<{ readonly id: string; readonly n: number }>({
    id: '',
    n: 0,
  });
  useEffect(() => {
    if (focusRequest.n === 0) return;
    const target =
      focusRequest.id === 'title' ? titleRef.current : document.getElementById(focusRequest.id);
    target?.focus();
  }, [focusRequest]);
  const focus = (id: string) => setFocusRequest((current) => ({ id, n: current.n + 1 }));
  // A refusal sits in the override panel while the record is stuck, under the head once it is not
  // (the record read again may have moved on): if it had focus when it moved, focus follows it.
  const refusalInPanel = stuck && refusal === 'stale';
  useEffect(() => {
    const active = document.activeElement;
    if (refusal !== null && (active === null || active === document.body)) {
      document.getElementById(REFUSAL_ID)?.focus();
    }
  }, [refusal, refusalInPanel]);

  const press = () => {
    if (!facts.override) return;
    if (reason.trim() === '') {
      setReasonError(stateWords('SA-13.reason.missing'));
      focus(REASON_ID);
      return;
    }
    setReasonError(null);
    setExpectedRev(facts.override.rev);
    setUnavailable(false);
    setFlash(false);
    setRefusal(null);
    setConfirming(true);
  };

  const confirm = () => {
    if (!facts.override || move.busy) return;
    setUnavailable(false);
    move.run({ id: facts.override.id as never, reason, expectedRev }).then(
      (answer) => {
        setConfirming(false);
        if (answer.ok) {
          setReason('');
          setFlash(true);
          focus(FLASH_ID);
          return;
        }
        const error = answer.error;
        if (error.kind === 'validation-failed') {
          const words = error.fieldErrors.map((item) => fieldWords(item)).find(Boolean);
          setReasonError(words ?? stateWords('SA-13.reason.missing'));
          focus(REASON_ID);
          return;
        }
        // The record moved on (stale, no longer stuck, …): nothing was moved; read it again.
        setRefusal(error.kind === 'stale-version' ? 'stale' : 'moved-on');
        void refetch();
        focus(REFUSAL_ID);
      },
      () => setUnavailable(true),
    );
  };

  const refusalNotice = refusal ? (
    <Notice
      tone="warn"
      role="alert"
      id={REFUSAL_ID}
      title={refusal === 'stale' ? stateWords('SA-13.stale.title') : stateWords('SA-13.moved-on')}
      actions={
        <Button
          onClick={() => {
            setRefusal(null);
            focus('title');
          }}
        >
          {CONTENT_RECORD_V3.checkAgain}
        </Button>
      }
    >
      {refusal === 'stale' ? stateWords('SA-13.stale.line') : undefined}
    </Notice>
  ) : null;

  const sheet = <RecordSheet facts={facts} />;
  return (
    <>
      <PageHead
        variant="record"
        title={facts.name}
        titleRef={titleRef}
        titleFocusTarget
        date={today}
        eyebrow={
          facts.kind === 'submission' ? CONTENT_RECORD_V3.submission : CONTENT_RECORD_V3.experiment
        }
        breadcrumbs={
          <Breadcrumbs
            levels={[
              { label: CONTENT_TITLE, href: CONTENT_UPDATES_ADDRESS },
              { label: CONTENT_HEAD.tabs.all, href: ALL_CONTENT_ADDRESS },
            ]}
            current={facts.name}
          />
        }
        meta={
          <>
            <StatusPill tone={facts.status.tone} size="lg">
              {facts.status.words}
            </StatusPill>
            {facts.courseCode ? <CourseCode code={facts.courseCode} /> : null}
            {facts.courseName ? <span>{facts.courseName}</span> : null}
          </>
        }
        goTo={
          stuck
            ? { label: CONTENT_RECORD_V3.goToOverride, targetId: PANEL_ID, focusId: PANEL_TITLE_ID }
            : undefined
        }
      />
      {flash ? (
        <Notice tone="ok" role="status" id={FLASH_ID} title={CONTENT_RECORD_V3.flashTitle}>
          {CONTENT_RECORD_V3.flashLine}
        </Notice>
      ) : null}
      {refusalInPanel ? null : refusalNotice}
      <RecordNotice facts={facts} />
      {stuck ? (
        <DetailLayout
          key="decide"
          asideId={PANEL_ID}
          asideLabelledBy={PANEL_TITLE_ID}
          main={sheet}
          aside={
            <DecisionPanel title={CONTENT_RECORD_V3.panelTitle} titleId={PANEL_TITLE_ID}>
              {refusalInPanel ? refusalNotice : null}
              <StandList
                items={[
                  { term: CONTENT_RECORD_V3.from, value: CONTENT_RECORD_V3.fromValue },
                  { term: CONTENT_RECORD_V3.to, value: CONTENT_RECORD_V3.toValue },
                ]}
              />
              <Hint>{CONTENT_RECORD_V3.moveHint}</Hint>
              <Field
                id={REASON_ID}
                label={CONTENT_RECORD_V3.reasonLabel}
                hint={CONTENT_RECORD_V3.reasonHint}
                error={reasonError ?? undefined}
              >
                <Textarea
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                    setReasonError(null);
                  }}
                />
              </Field>
              <GoButton id="content-record-move" onClick={press}>
                {CONTENT_RECORD_V3.move}
              </GoButton>
            </DecisionPanel>
          }
        />
      ) : (
        // Nothing is the Super Admin's to do: the sheet alone, the page's width (`sa-single`).
        <DetailLayout key="single" main={sheet} />
      )}
      <ConfirmDialog
        initialFocus="confirm"
        open={confirming}
        idPrefix="content-record-override"
        returnFocusFallback={titleRef}
        title={overrideConfirmTitle(facts.name)}
        description={CONTENT_RECORD_V3.confirmDescription}
        groups={[
          {
            kind: 'now',
            title: DIALOG_GROUPS.now,
            items: overrideConfirmNow(facts.vendorWho || CONTENT_RECORD.none),
          },
          { kind: 'later', title: DIALOG_GROUPS.later, items: CONTENT_RECORD_V3.confirmLater },
        ]}
        cancelLabel={DIALOG_GROUPS.cancel}
        confirmLabel={CONTENT_RECORD_V3.move}
        busy={move.busy}
        busyLabel={CONTENT_RECORD_V3.busy}
        onConfirm={confirm}
        onCancel={() => setConfirming(false)}
      >
        <Quote by={DIALOG_GROUPS.yourReason}>{reason.trim()}</Quote>
        {unavailable ? (
          <Notice tone="warn" role="alert" title={stateWords('SA-13.unavailable')} />
        ) : null}
      </ConfirmDialog>
    </>
  );
}

/** The one notice the export draws for the record's state. */
function RecordNotice({ facts }: { readonly facts: RecordFacts }) {
  const { notice } = facts;
  if (notice.kind === 'stuck') {
    return (
      <Notice
        tone="warn"
        icon="hourglass"
        role="status"
        title={CONTENT_RECORD_V3.stuckTitle}
        actions={
          <ButtonLink href={rolesAddress('reviewers')}>
            {CONTENT_RECORD_V3.openPlatformRoles}
          </ButtonLink>
        }
      >
        {stuckLine(facts.course)}
      </Notice>
    );
  }
  if (notice.kind === 'in-workflow') {
    return (
      <Notice tone="ok" role="status" title={CONTENT_RECORD_V3.inWorkflowTitle}>
        {inWorkflowLine(facts.whoCanAct ?? CONTENT_RECORD.none)}
      </Notice>
    );
  }
  const update = notice.update;
  let action: ReactNode = null;
  if (update?.state === 'awaiting-release-decision') {
    action = (
      <ButtonLink href={updateDecisionAddress(update.id)}>
        {CONTENT_RECORD_V3.openReleaseDecision}
      </ButtonLink>
    );
  } else if (update?.state === 'on-hold') {
    action = (
      <ButtonLink href={updateDecisionAddress(update.id)}>
        {CONTENT_RECORD_V3.openHeldCorrection}
      </ButtonLink>
    );
  }
  return (
    <Notice
      tone="info"
      icon="lock"
      role="status"
      title={CONTENT_RECORD_V3.publishedTitle}
      actions={action}
    >
      {CONTENT_RECORD_V3.publishedLine}
    </Notice>
  );
}

/** The record's sheet: catalogue details (read-only), learning outcomes, governance history. */
function RecordSheet({ facts }: { readonly facts: RecordFacts }) {
  const { keys } = CONTENT_RECORD_V3;
  const formats = inDisplayOrder(facts.formats).map((format) => FORMAT_META[format].code);
  return (
    <>
      <SurfaceSection
        title={CONTENT_RECORD_V3.catalogueTitle}
        titleId="content-record-catalogue"
        aside={<SectionNote>{CONTENT_RECORD_V3.readOnly}</SectionNote>}
      >
        <DefinitionList
          items={[
            { term: keys.summary, value: facts.summary },
            {
              term: keys.formats,
              value: <FormatBadges formats={formats} label={formatsLabel(formats)} />,
            },
            {
              term: keys.liveVersion,
              value: facts.live
                ? liveVersionLine(facts.live.label, dayMonthYear(facts.live.since))
                : CONTENT_RECORD_V3.notPublished,
            },
            { term: keys.vendor, value: facts.vendorWho || CONTENT_RECORD.none },
            {
              term: keys.whoCanAct,
              value:
                facts.whoCanAct ??
                (facts.notice.kind === 'published'
                  ? ALL_CONTENT_LIST.nobodyNeedsToAct
                  : CONTENT_RECORD.none),
            },
          ]}
        />
      </SurfaceSection>
      {facts.outcomes.length > 0 ? (
        <SurfaceSection title={CONTENT_RECORD_V3.outcomesTitle} titleId="content-record-outcomes">
          <Bullets items={facts.outcomes} />
        </SurfaceSection>
      ) : null}
      <SurfaceSection
        title={CONTENT_RECORD_V3.historyTitle}
        titleId="content-record-history"
        aside={<SectionNote>{CONTENT_RECORD_V3.historyNote}</SectionNote>}
      >
        <Timeline events={facts.history} />
      </SurfaceSection>
    </>
  );
}
