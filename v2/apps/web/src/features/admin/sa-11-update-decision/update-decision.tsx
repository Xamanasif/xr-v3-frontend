'use client';

import type { InstitutionStatus } from '@xr/domain';
import {
  Breadcrumbs,
  Button,
  ButtonLink,
  ChoiceGroup,
  ConfirmDialog,
  DecisionOutcome,
  DecisionPanel,
  DetailLayout,
  ErrorSummary,
  FactStrip,
  Field,
  GoButton,
  Hint,
  MetaSeparator,
  Notice,
  PageHead,
  PendingHint,
  Quote,
  ReadOnlyTable,
  RecordLine,
  SaMessage,
  SectionNote,
  StatusPill,
  SurfaceSection,
  Textarea,
  Timeline,
} from '@xr/ui/v3';
import { Fragment, type RefObject, useEffect, useMemo, useRef, useState } from 'react';

import { COMPARISON, comparisonFieldLabel } from '@/copy/corrections';
import { liftedLine } from '@/copy/release';
import {
  approvedMeta,
  CONTENT_HEAD,
  correctionPlace,
  DIALOG_GROUPS,
  heldFlash,
  heldMeta,
  HOLD_CONFIRM,
  holdChoiceLine,
  holdConfirmDescription,
  holdConfirmTitle,
  LIFT_CONFIRM,
  LIFTED_FLASH,
  liftConfirmTitle,
  liveNowColumn,
  proposedColumn,
  RELEASE_CONFIRM,
  releaseChoiceLine,
  releaseConfirmNow,
  releaseConfirmTitle,
  releasedColumn,
  releasedFlash,
  releasedMeta,
  reviewLine,
  UPDATE_DECISION,
  versionsLine,
  versionWords,
  whyBy,
} from '@/copy/sa-content';
import { stateWords } from '@/copy/state-copy';
import {
  CONTENT_TITLE,
  CONTENT_UPDATES_ADDRESS,
  updateDecisionPlacement,
} from '@/nav/admin-content';
import { useContentRecord } from '@/queries/admin-content';
import type { UpdateDecisionView } from '@/queries/correction-view';
import { useUpdateDecision } from '@/queries/corrections';
import { useInstitutionTab } from '@/queries/institutions';
import { checkHoldReason, holdReasonErrorOf } from '@/queries/release-forms';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { SaRecordGuard } from '../shared/sa-record-guard';
import { useHeadingFocusOnArrival, useTodayLine } from '../sa-10-updates/content-head';
import {
  type DecisionFacts,
  decisionFacts,
  formatWords,
  type InstitutionUsingRow,
  institutionRows,
} from './decision-view';

/** The decision column's id (the export's `up-panel`): "Go to decision" leads to it. */
const PANEL_ID = 'update-decision';
const PANEL_TITLE_ID = 'update-decision-h';
/** The decided part of the panel (the export's `up-done`). */
const DECIDED_ID = 'update-decided';
/** The flash after a decision (the export's `sa-flash`), which takes focus. */
const FLASH_ID = 'update-flash';
/** The refusal in the panel (the export's `sa-refusal`), which takes focus. */
const REFUSAL_ID = 'update-refusal';
const CHOICE_ID = 'update-choice';
const REASON_ID = 'update-hold-reason';

/**
 * SA-11 Release or hold an update — the owner-approved Super Admin export's `V.update`
 * (design/v3-refined-b/roles/SA-v1, renders `<width>_content_updates_distillation-1-3.png` and the
 * states `sa11-on-hold`, `sa11-released`, `sa11-not-approved`), at
 * `/admin/content/updates/[updateId]`.
 *
 * - **Read**: `CorrectionService.getUpdateDecision` — the correction, its changed fields beside
 *   the live ones, the live version and the institutions whose current access plan includes the
 *   experiment, named and given their status from `listInstitutions`; the experiment's course
 *   code and formats from `ProductionService.getContentRecord` (SA-13's read). A correction the
 *   Super Admin may not see yet (the service answers `invalid-state`: still with the Content
 *   Manager or the Academic Reviewer) is the calm "Nothing to decide" message, never "not
 *   available" (state-copy `SA-11.not-yet`).
 * - **As the export draws it**: the crumbs Content › Updates › the experiment; "Correction to a
 *   published experiment", the experiment's name, the status, the versions and who approved it;
 *   the facts (Live now · Proposed or Released · Course · Formats), What changes (the live and
 *   proposed fields, "Live before · Released" once released), Why, from the Content Manager,
 *   Academic review, Institutions using it ("Nothing here changes any institution's access") and
 *   the history; the decision panel beside it, under it below 860 px with "Go to decision".
 * - **Decide** (the service decides who may and when): waiting — choose Release update or Hold
 *   (a reason the Content Manager sees, required), then confirm (never "Publish"); on hold —
 *   Release isn't available, Lift hold only (confirmed, no reason; it never releases); released —
 *   read-only. Each command carries the revision from when its confirmation opened
 *   (`SA-11.decision-rev`); a stale or moved-on decision is refused by the service, said in the
 *   panel in the repo's words and the correction read again (`SA-11.stale.*`, `SA-11.moved-on`).
 *   The result is said in a flash that takes focus (`SA-11.focus`). Nothing changes any
 *   institution's or Student's access (BC9). What a hold blocks is open (T-28): said so.
 */
export function UpdateDecision({ updateId }: { readonly updateId: string }) {
  const read = useUpdateDecision(updateId);
  const institutions = useInstitutionTab('all');
  const answer = read.data;
  const view = answer?.ok ? answer.value : null;
  const record = useContentRecord(view ? { kind: 'EXP', id: view.update.experimentId } : null);
  const notYet = answer !== undefined && !answer.ok && answer.error.kind === 'invalid-state';
  const experiment = view ? decisionFacts(view).experiment : null;
  useShellPage(
    updateDecisionPlacement(
      experiment !== null
        ? correctionPlace(experiment)
        : notYet
          ? UPDATE_DECISION.nothingTitle
          : null,
    ),
  );

  const named = useMemo(() => {
    const map = new Map<string, { readonly name: string; readonly status: InstitutionStatus }>();
    if (institutions.data?.ok) {
      for (const row of institutions.data.value) map.set(row.id, row);
    }
    return map;
  }, [institutions.data]);

  // The institutions and the experiment's course are read beside the record: the page waits for
  // both reads.
  const waiting = view !== null && (institutions.data === undefined || record.data === undefined);
  const besideFailed = view !== null && (institutions.isError || record.isError);
  const course = record.data?.ok ? record.data.value : null;

  return (
    <SaRecordGuard
      read={{
        data: waiting ? undefined : answer,
        isPending: read.isPending || waiting,
        isError: read.isError || besideFailed,
        refetch: () => {
          void read.refetch();
          if (institutions.isError) void institutions.refetch();
          if (record.isError) void record.refetch();
        },
      }}
      loadingLabel={stateWords('SA-11.loading')}
      failedTitle={stateWords('SA-11.failed')}
      refusals={{ 'invalid-state': <NothingToDecide /> }}
    >
      {(page) => (
        <Decision
          key={page.update.id}
          view={page}
          courseCode={course?.courseCode ?? null}
          formats={
            course?.experiment
              ? formatWords(course.experiment.live.formats.map((entry) => entry.format))
              : []
          }
          institutions={institutionRows(page, named)}
          onReread={() => read.refetch()}
        />
      )}
    </SaRecordGuard>
  );
}

/** The crumbs above the page: Content › Updates › this correction. */
function Crumbs({ current }: { readonly current: string }) {
  return (
    <Breadcrumbs
      levels={[
        { label: CONTENT_TITLE, href: CONTENT_UPDATES_ADDRESS },
        { label: CONTENT_HEAD.tabs.updates, href: CONTENT_UPDATES_ADDRESS },
      ]}
      current={current}
    />
  );
}

/** Not approved yet: the correction is still with the Content Manager or the Academic Reviewer. */
function NothingToDecide() {
  return (
    <>
      <Crumbs current={UPDATE_DECISION.nothingTitle} />
      <SaMessage
        title={UPDATE_DECISION.nothingTitle}
        actions={
          <ButtonLink variant="primary" href={CONTENT_UPDATES_ADDRESS}>
            {UPDATE_DECISION.backToUpdates}
          </ButtonLink>
        }
      >
        {UPDATE_DECISION.nothingLine}
      </SaMessage>
    </>
  );
}

/** A refused decision, as the panel says it (state-copy `SA-11.stale.*`, `SA-11.moved-on`). */
type PanelRefusal = 'stale' | 'moved-on';
type Decided = 'release' | 'hold' | 'lift';
interface Flash {
  readonly title: string;
  readonly line: string;
}
type FocusTarget = 'flash' | 'refusal' | 'title';

function Decision({
  view,
  courseCode,
  formats,
  institutions,
  onReread,
}: {
  readonly view: UpdateDecisionView;
  readonly courseCode: string | null;
  readonly formats: readonly string[];
  readonly institutions: readonly InstitutionUsingRow[];
  readonly onReread: () => Promise<unknown>;
}) {
  const facts = decisionFacts(view);
  const today = useTodayLine();
  const [refusal, setRefusal] = useState<PanelRefusal | null>(null);
  const [flash, setFlash] = useState<Flash | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useHeadingFocusOnArrival(titleRef, true);
  // Focus moves once the result is drawn: the flash after a decision, the refusal after a refused
  // one, the title after "Check it again" (the export's `SA.focus('sa-flash')`, `sa-refusal`,
  // `page-h1`). In an effect: in the same commit the confirmation's own close gives focus back.
  const [focusTo, setFocusTo] = useState<{ readonly target: FocusTarget; readonly n: number }>({
    target: 'title',
    n: 0,
  });
  useEffect(() => {
    if (focusTo.n === 0) return;
    const target =
      focusTo.target === 'title'
        ? titleRef.current
        : document.getElementById(focusTo.target === 'flash' ? FLASH_ID : REFUSAL_ID);
    target?.focus();
  }, [focusTo, facts.kind]);
  const focus = (target: FocusTarget) => setFocusTo((current) => ({ target, n: current.n + 1 }));

  const decided = (what: Decided) => {
    setRefusal(null);
    setFlash(
      what === 'release'
        ? releasedFlash(facts.proposedVersion)
        : what === 'hold'
          ? heldFlash(facts.liveVersion)
          : LIFTED_FLASH,
    );
    focus('flash');
  };
  const refused = (kind: PanelRefusal) => {
    setFlash(null);
    setRefusal(kind);
    void onReread();
    focus('refusal');
  };

  const released = facts.kind === 'released';
  let panel;
  if (facts.kind === 'waiting') {
    panel = (
      <OpenPanel
        view={view}
        facts={facts}
        fallback={titleRef}
        onDecided={decided}
        onRefused={refused}
      />
    );
  } else if (facts.kind === 'held' && facts.hold) {
    panel = (
      <HeldPanel
        view={view}
        facts={facts}
        hold={facts.hold}
        fallback={titleRef}
        onLifted={() => decided('lift')}
        onRefused={refused}
      />
    );
  } else if (released && facts.release) {
    panel = (
      <DecisionOutcome
        id={DECIDED_ID}
        status={
          <StatusPill tone="ok" size="lg">
            {UPDATE_DECISION.released}
          </StatusPill>
        }
        meta={releasedMeta(facts.release.on, facts.release.by)}
        stand={[
          { term: UPDATE_DECISION.stand.liveNow, value: versionWords(facts.liveVersion) },
          { term: UPDATE_DECISION.stand.liveBefore, value: versionWords(facts.baseVersion) },
          { term: UPDATE_DECISION.stand.access, value: UPDATE_DECISION.unchanged },
        ]}
        next={UPDATE_DECISION.recorded}
        action={
          <ButtonLink href={CONTENT_UPDATES_ADDRESS}>{UPDATE_DECISION.backToUpdates}</ButtonLink>
        }
      />
    );
  } else {
    panel = <RecordLine>{UPDATE_DECISION.nothingLine}</RecordLine>;
  }

  return (
    <>
      <PageHead
        variant="record"
        title={facts.experiment}
        titleRef={titleRef}
        titleFocusTarget
        date={today}
        eyebrow={UPDATE_DECISION.eyebrow}
        breadcrumbs={<Crumbs current={facts.experiment} />}
        meta={
          <>
            {facts.chip ? (
              <StatusPill tone={facts.chip.tone} size="lg">
                {facts.chip.words}
              </StatusPill>
            ) : null}
            <span>{versionsLine(facts.from, facts.to)}</span>
            {facts.approval ? (
              <>
                <MetaSeparator />
                <span>{approvedMeta(facts.approval.by, facts.approval.day)}</span>
              </>
            ) : null}
          </>
        }
        goTo={{ label: UPDATE_DECISION.goTo, targetId: PANEL_ID, focusId: PANEL_TITLE_ID }}
      />
      {flash ? (
        <Notice tone="ok" role="status" id={FLASH_ID} title={flash.title}>
          {flash.line}
        </Notice>
      ) : facts.liftedOn ? (
        <Notice tone="info" role="status" title={UPDATE_DECISION.liftedTitle}>
          {liftedLine(facts.liftedOn)}
        </Notice>
      ) : null}
      <DetailLayout
        asideId={PANEL_ID}
        asideLabelledBy={PANEL_TITLE_ID}
        main={
          <RecordSheet
            view={view}
            facts={facts}
            courseCode={courseCode}
            formats={formats}
            institutions={institutions}
          />
        }
        aside={
          <DecisionPanel title={UPDATE_DECISION.panelTitle} titleId={PANEL_TITLE_ID}>
            {refusal ? (
              <Notice
                tone="warn"
                role="alert"
                id={REFUSAL_ID}
                title={
                  refusal === 'stale'
                    ? stateWords('SA-11.stale.title')
                    : stateWords('SA-11.moved-on')
                }
                actions={
                  <Button
                    onClick={() => {
                      setRefusal(null);
                      focus('title');
                    }}
                  >
                    {UPDATE_DECISION.checkAgain}
                  </Button>
                }
              >
                {refusal === 'stale' ? stateWords('SA-11.stale.line') : undefined}
              </Notice>
            ) : null}
            {panel}
          </DecisionPanel>
        }
      />
    </>
  );
}

// ---- the record sheet ----

function RecordSheet({
  view,
  facts,
  courseCode,
  formats,
  institutions,
}: {
  readonly view: UpdateDecisionView;
  readonly facts: DecisionFacts;
  readonly courseCode: string | null;
  readonly formats: readonly string[];
  readonly institutions: readonly InstitutionUsingRow[];
}) {
  const { update } = view;
  const released = facts.kind === 'released';
  return (
    <>
      <FactStrip
        facts={[
          { term: UPDATE_DECISION.facts.liveNow, value: versionWords(facts.liveVersion) },
          {
            term: released ? UPDATE_DECISION.facts.released : UPDATE_DECISION.facts.proposed,
            value: versionWords(facts.proposedVersion),
          },
          ...(courseCode ? [{ term: UPDATE_DECISION.facts.course, value: courseCode }] : []),
          ...(formats.length > 0
            ? [{ term: UPDATE_DECISION.facts.formats, value: formats.join(', ') }]
            : []),
        ]}
      />
      <WhatChanges view={view} facts={facts} />
      {update.whatChangesAndWhy ? (
        <SurfaceSection title={UPDATE_DECISION.whyTitle} titleId="update-why">
          <Quote by={whyBy(facts.raisedBy.name, facts.raisedBy.role)}>
            {update.whatChangesAndWhy}
          </Quote>
        </SurfaceSection>
      ) : null}
      {facts.approval ? (
        <SurfaceSection title={UPDATE_DECISION.reviewTitle} titleId="update-review">
          <RecordLine>{reviewLine(facts.approval.by, facts.approval.at)}</RecordLine>
        </SurfaceSection>
      ) : null}
      <SurfaceSection title={UPDATE_DECISION.institutionsTitle} titleId="update-institutions">
        {institutions.length > 0 ? (
          <ReadOnlyTable
            caption={UPDATE_DECISION.institutionsCaption}
            columns={[
              UPDATE_DECISION.columns.institution,
              UPDATE_DECISION.columns.access,
              UPDATE_DECISION.columns.status,
            ]}
            rows={institutions.map((row) => ({
              key: row.key,
              head: row.name,
              cells: [
                { label: UPDATE_DECISION.columns.access, content: row.access },
                { label: UPDATE_DECISION.columns.status, content: row.status },
              ],
            }))}
          />
        ) : (
          <RecordLine>{UPDATE_DECISION.noInstitutions}</RecordLine>
        )}
        <Hint under="table">{UPDATE_DECISION.institutionsNote}</Hint>
      </SurfaceSection>
      <SurfaceSection
        title={UPDATE_DECISION.historyTitle}
        titleId="update-history"
        aside={<SectionNote>{UPDATE_DECISION.historyNote}</SectionNote>}
      >
        <Timeline events={facts.history} />
      </SurfaceSection>
    </>
  );
}

/**
 * "What changes · Changed fields only": the changed fields, live and proposed; once released,
 * "Live before · Released" with its note, or the register's line while the service gives no rows
 * (`SA-11.released.no-comparison`).
 */
function WhatChanges({
  view,
  facts,
}: {
  readonly view: UpdateDecisionView;
  readonly facts: DecisionFacts;
}) {
  const rows = view.comparison;
  const released = facts.kind === 'released';
  const before = released ? UPDATE_DECISION.liveBefore : liveNowColumn(facts.liveVersion);
  const after = released
    ? releasedColumn(facts.proposedVersion)
    : proposedColumn(facts.proposedVersion);
  return (
    <SurfaceSection
      title={UPDATE_DECISION.whatChanges}
      titleId="update-changes"
      aside={rows.length > 0 ? <SectionNote>{UPDATE_DECISION.changedOnly}</SectionNote> : undefined}
    >
      {rows.length > 0 ? (
        <>
          <ReadOnlyTable
            compare
            caption={UPDATE_DECISION.compareCaption}
            columns={[COMPARISON.field, before, after]}
            rows={rows.map((row) => ({
              key: `${row.field}-${row.format ?? ''}`,
              head: comparisonFieldLabel(row),
              cells: [
                { label: before, content: <Breakable text={row.liveNow ?? ''} /> },
                { label: after, content: <Breakable text={row.proposed ?? ''} />, proposed: true },
              ],
            }))}
          />
          {released ? <Hint under="table">{UPDATE_DECISION.liveBeforeNote}</Hint> : null}
        </>
      ) : released ? (
        <RecordLine>
          {stateWords('SA-11.released.no-comparison').replace('{version}', facts.baseVersion)}
        </RecordLine>
      ) : (
        <RecordLine>{COMPARISON.nothingChanged}</RecordLine>
      )}
    </SurfaceSection>
  );
}

/**
 * A field's value with a line-break opportunity after each `/`, `.`, `-`, `_`, `?`, `&` and `=`: a
 * web link or a package reference is one long word that would otherwise push the comparison wider
 * than the sheet (the table would scroll sideways inside it).
 */
function Breakable({ text }: { readonly text: string }) {
  const parts = text.split(/(?<=[/.\-_?&=])/);
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 ? <wbr /> : null}
          {part}
        </Fragment>
      ))}
    </>
  );
}

// ---- the decision panel ----

type Choice = 'release' | 'hold';

/**
 * Waiting for your decision: Release update or Hold (with the reason the Content Manager sees),
 * checked before anything opens, then its confirmation.
 */
function OpenPanel({
  view,
  facts,
  fallback,
  onDecided,
  onRefused,
}: {
  readonly view: UpdateDecisionView;
  readonly facts: DecisionFacts;
  readonly fallback: RefObject<HTMLElement | null>;
  readonly onDecided: (what: Decided) => void;
  readonly onRefused: (refusal: PanelRefusal) => void;
}) {
  const { update } = view;
  const releaseCmd = useCommand((ports) => ports.corrections.releaseUpdate);
  const holdCmd = useCommand((ports) => ports.corrections.holdUpdate);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{ readonly choice?: string; readonly reason?: string }>({});
  const [dialog, setDialog] = useState<Choice | null>(null);
  /** The update's revision when the confirmation opened (state-copy `SA-11.decision-rev`). */
  const [decisionRev, setDecisionRev] = useState(update.rev);
  /** The newest revision a stale refusal named, until the read catches up with it. */
  const knownRev = useRef(update.rev);
  const [unavailable, setUnavailable] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const [checked, setChecked] = useState(0);
  useEffect(() => {
    if (checked > 0) summaryRef.current?.focus();
  }, [checked]);

  const press = () => {
    const found: { choice?: string; reason?: string } = {};
    if (choice === null) found.choice = UPDATE_DECISION.chooseDecision;
    if (choice === 'hold') {
      const invalid = checkHoldReason(reason);
      if (invalid) found.reason = invalid;
    }
    setErrors(found);
    if (found.choice || found.reason) {
      setChecked((n) => n + 1);
      return;
    }
    setDecisionRev(Math.max(update.rev, knownRev.current));
    setUnavailable(false);
    setDialog(choice);
  };

  const close = () => {
    setDialog(null);
    setUnavailable(false);
  };

  const doRelease = () => {
    if (releaseCmd.busy) return;
    setUnavailable(false);
    releaseCmd.run({ id: update.id, expectedRev: decisionRev }).then(
      (answer) => {
        setDialog(null);
        if (answer.ok) {
          onDecided('release');
          return;
        }
        // Stale, decided elsewhere, held meanwhile (`hold-must-be-lifted`): nothing was written.
        if (answer.error.kind === 'stale-version') knownRev.current = answer.error.currentRev;
        onRefused(answer.error.kind === 'stale-version' ? 'stale' : 'moved-on');
      },
      () => setUnavailable(true),
    );
  };

  const doHold = () => {
    if (holdCmd.busy) return;
    setUnavailable(false);
    holdCmd.run({ id: update.id, reason, expectedRev: decisionRev }).then(
      (answer) => {
        setDialog(null);
        if (answer.ok) {
          setReason('');
          setChoice(null);
          onDecided('hold');
          return;
        }
        const error = answer.error;
        if (error.kind === 'validation-failed') {
          setErrors({ reason: holdReasonErrorOf(error) ?? stateWords('SA-11.unavailable.hold') });
          setChecked((n) => n + 1);
          return;
        }
        // The typed reason stays; the update is read again and the next confirmation sends its
        // current revision (state-copy `SA-11.stale.line`).
        if (error.kind === 'stale-version') knownRev.current = error.currentRev;
        onRefused(error.kind === 'stale-version' ? 'stale' : 'moved-on');
      },
      () => setUnavailable(true),
    );
  };

  const failure = (key: 'SA-11.unavailable.release' | 'SA-11.unavailable.hold') =>
    unavailable ? <Notice tone="warn" role="alert" title={stateWords(key)} /> : null;

  return (
    <>
      <ErrorSummary
        ref={summaryRef}
        autoFocus={false}
        title={UPDATE_DECISION.errorsTitle}
        items={[
          ...(errors.choice ? [{ fieldId: CHOICE_ID, summaryText: errors.choice }] : []),
          ...(errors.reason ? [{ fieldId: REASON_ID, summaryText: errors.reason }] : []),
        ]}
      />
      <ChoiceGroup
        legend={UPDATE_DECISION.legend}
        id={CHOICE_ID}
        name={CHOICE_ID}
        value={choice}
        error={errors.choice}
        onChange={(value) => {
          setChoice(value);
          setErrors((current) => ({ ...current, choice: undefined }));
        }}
        options={[
          {
            value: 'release',
            title: UPDATE_DECISION.release,
            description: releaseChoiceLine(facts.proposedVersion),
          },
          {
            value: 'hold',
            title: UPDATE_DECISION.hold,
            description: holdChoiceLine(facts.liveVersion),
          },
        ]}
      />
      {choice === 'hold' ? (
        <Field
          id={REASON_ID}
          label={UPDATE_DECISION.reasonLabel}
          hint={UPDATE_DECISION.reasonHint}
          error={errors.reason}
        >
          <Textarea
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setErrors((current) => ({ ...current, reason: undefined }));
            }}
          />
        </Field>
      ) : null}
      {choice === 'hold' && reason.trim() === '' ? (
        <PendingHint>{UPDATE_DECISION.reasonPending}</PendingHint>
      ) : null}
      <GoButton id="update-decide" onClick={press}>
        {choice === 'hold' ? UPDATE_DECISION.holdGo : UPDATE_DECISION.releaseGo}
      </GoButton>
      <Hint>{UPDATE_DECISION.accessHint}</Hint>
      <ConfirmDialog
        initialFocus="confirm"
        open={dialog === 'release'}
        idPrefix="update-release"
        title={releaseConfirmTitle(facts.proposedVersion, facts.experiment)}
        description={RELEASE_CONFIRM.description}
        groups={[
          {
            kind: 'now',
            title: DIALOG_GROUPS.now,
            items: releaseConfirmNow(facts.proposedVersion, facts.liveVersion),
          },
          { kind: 'later', title: DIALOG_GROUPS.later, items: RELEASE_CONFIRM.later },
        ]}
        cancelLabel={DIALOG_GROUPS.cancel}
        confirmLabel={RELEASE_CONFIRM.confirm}
        busy={releaseCmd.busy}
        busyLabel={RELEASE_CONFIRM.busy}
        onConfirm={doRelease}
        onCancel={close}
        returnFocusFallback={fallback}
      >
        {failure('SA-11.unavailable.release')}
      </ConfirmDialog>
      <ConfirmDialog
        initialFocus="confirm"
        open={dialog === 'hold'}
        idPrefix="update-hold"
        title={holdConfirmTitle(facts.experiment)}
        description={holdConfirmDescription(facts.liveVersion)}
        cancelLabel={DIALOG_GROUPS.cancel}
        confirmLabel={HOLD_CONFIRM.confirm}
        busy={holdCmd.busy}
        busyLabel={HOLD_CONFIRM.busy}
        onConfirm={doHold}
        onCancel={close}
        returnFocusFallback={fallback}
      >
        <Quote by={DIALOG_GROUPS.yourReason}>{reason.trim()}</Quote>
        {failure('SA-11.unavailable.hold')}
      </ConfirmDialog>
    </>
  );
}

/**
 * On hold: when and by whom, the reason; Release isn't available while held; Lift hold is the only
 * action (confirmed, no reason). What else a hold affects is open (T-28).
 */
function HeldPanel({
  view,
  facts,
  hold,
  fallback,
  onLifted,
  onRefused,
}: {
  readonly view: UpdateDecisionView;
  readonly facts: DecisionFacts;
  readonly hold: NonNullable<DecisionFacts['hold']>;
  readonly fallback: RefObject<HTMLElement | null>;
  readonly onLifted: () => void;
  readonly onRefused: (refusal: PanelRefusal) => void;
}) {
  const { update } = view;
  const liftCmd = useCommand((ports) => ports.corrections.liftHold);
  const [confirming, setConfirming] = useState(false);
  /** The update's revision when the confirmation opened (state-copy `SA-11.decision-rev`). */
  const [decisionRev, setDecisionRev] = useState(update.rev);
  const [unavailable, setUnavailable] = useState(false);

  const open = () => {
    setDecisionRev(update.rev);
    setUnavailable(false);
    setConfirming(true);
  };

  const doLift = () => {
    if (liftCmd.busy) return;
    setUnavailable(false);
    liftCmd.run({ id: update.id, expectedRev: decisionRev }).then(
      (answer) => {
        setConfirming(false);
        if (answer.ok) onLifted();
        else onRefused(answer.error.kind === 'stale-version' ? 'stale' : 'moved-on');
      },
      () => setUnavailable(true),
    );
  };

  return (
    <>
      <DecisionOutcome
        id={DECIDED_ID}
        status={
          <StatusPill tone="paused" size="lg">
            {UPDATE_DECISION.onHold}
          </StatusPill>
        }
        meta={heldMeta(hold.on, hold.by)}
      >
        {hold.reason ? <Quote>{hold.reason}</Quote> : null}
        <Notice tone="paused" icon="lock" role="status" title={UPDATE_DECISION.heldTitle}>
          {UPDATE_DECISION.heldLine}
        </Notice>
        <GoButton id="update-lift" onClick={open}>
          {UPDATE_DECISION.liftHold}
        </GoButton>
        <Hint>{UPDATE_DECISION.holdOpen}</Hint>
      </DecisionOutcome>
      <ConfirmDialog
        initialFocus="confirm"
        open={confirming}
        idPrefix="update-lift"
        title={liftConfirmTitle(facts.experiment)}
        description={LIFT_CONFIRM.description}
        cancelLabel={DIALOG_GROUPS.cancel}
        confirmLabel={LIFT_CONFIRM.confirm}
        busy={liftCmd.busy}
        busyLabel={LIFT_CONFIRM.busy}
        onConfirm={doLift}
        onCancel={() => setConfirming(false)}
        returnFocusFallback={fallback}
      >
        {unavailable ? (
          <Notice tone="warn" role="alert" title={stateWords('SA-11.unavailable.lift')} />
        ) : null}
      </ConfirmDialog>
    </>
  );
}
