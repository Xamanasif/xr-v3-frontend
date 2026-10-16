'use client';

import type { AccessEndingRow } from '@xr/domain';
import {
  BackLink,
  Button,
  ChoiceCard,
  ChoiceList,
  ConfirmDialog,
  DecisionLayout,
  EmptyState,
  Field,
  Icon,
  JumpLink,
  Link,
  Notice,
  PageContent,
  PageHeader,
  RadioGroup,
  ReasonDialog,
  Section,
  SectionBody,
  StatusPill,
  Textarea,
  Timeline,
} from '@xr/ui';
import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';

import { COMPARISON } from '@/copy/corrections';
import {
  DECISION_PAGE,
  decisionOverline,
  HOLD_DIALOG,
  HOLD_OPEN,
  holdEffect,
  holdLine,
  holdTitle,
  LIFT_DIALOG,
  liftedLine,
  liftTitle,
  quoted,
  RELEASE_DIALOG,
  releasedLine,
  releasedNext,
  releaseEffect,
  releaseTitle,
} from '@/copy/release';
import { stateWords } from '@/copy/state-copy';
import { CorrectionComparison } from '@/features/shared/correction-comparison/correction-comparison';
import { CONTENT_UPDATES_ADDRESS, updateDecisionPlacement } from '@/nav/admin-content';
import type { UpdateDecisionView } from '@/queries/correction-view';
import { useUpdateDecision } from '@/queries/corrections';
import { useInstitutionTab } from '@/queries/institutions';
import { useAccessEnding } from '@/queries/operations-admin';
import { checkHoldReason, holdReasonErrorOf } from '@/queries/release-forms';
import { useCommand } from '@/queries/use-command';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  type DecisionFacts,
  decisionFacts,
  type InstitutionUsingRow,
  institutionRows,
} from './decision-view';

/** The board's ids, with the product prefix (`Wm-decision`, `Wm-sdec`, `Wm-sgo`; B7-05). */
const PANEL_ID = 'update-decision';
const DECIDED_ID = 'update-decided';

/**
 * SA-11 Release or hold an update — boards B7-05 f1 (waiting), f5 (on hold), f6 (released), f7
 * (hold lifted), f8 (Release · DL-1), f9 (Hold · reason required), f10 (nothing to decide yet),
 * f11 (375); B7-10 f0 … f4; B7-11 f1; B7-12 f0 … f3 — at `/admin/content/updates/[updateId]`.
 *
 * - **Read**: `CorrectionService.getUpdateDecision` — the update, its changed fields beside the
 *   live ones, the live version (“Live now: version 1.2 · since …”) and the institutions whose
 *   current access plan includes the experiment, named from `listInstitutions` and noted from
 *   Access ending (state-copy `SA-11.institution-note`). An update the Super Admin may not see yet
 *   (the service answers `invalid-state`: still with the Content Manager or the Academic Reviewer)
 *   is the calm “Nothing to decide” page (f10), never not found (state-copy `SA-11.not-yet`).
 * - **As B7-05 draws it** (AR-4, ~74 / 26 from 860 px of content, the static panel under the
 *   content below it with “Go to decision” first): the back link, “UPD-0005 · Correction to
 *   published content”, “Distillation Column · 1.2 → 1.3”, the status chip and the live line;
 *   “Hold lifted” after a lift (f7); What changes (the shared comparison, CM-08 and RV-04's;
 *   “Live before · Released” once released), Why — from the Content Manager, Academic review,
 *   Institutions using it (“Nothing here changes any institution's access”) and the history.
 * - **Decide** (the service decides who may and when): waiting — Release update (DL-1, which says
 *   exactly what goes live and for whom; never “Publish”) or Hold (DL-2, a reason the Content
 *   Manager sees; “Version 1.2 stays live”); on hold — Lift hold only (DL-1, no reason; it never
 *   releases), Release is not offered (B7-10 f2); released — read-only. Each command carries the
 *   revision from when its confirmation opened (`SA-11.decision-rev`); a stale or moved-on
 *   decision is refused by the service, said calmly and the update read again (`SA-11.stale.*`,
 *   `SA-11.moved-on`). Focus moves to the result (`SA-11.focus`). Nothing changes any
 *   institution's or Student's access (BC9).
 */
export function UpdateDecision({ updateId }: { readonly updateId: string }) {
  const read = useUpdateDecision(updateId);
  const institutions = useInstitutionTab('all');
  const ending = useAccessEnding();
  const answer = read.data;
  const view = answer?.ok ? answer.value : null;
  const notYet = answer !== undefined && !answer.ok && answer.error.kind === 'invalid-state';
  // The crumbs name the update once the service has answered for it (f1, f10); while it loads,
  // “Content / Updates”.
  useShellPage(updateDecisionPlacement(view ? view.update.id : notYet ? updateId : null));

  const names = useMemo(() => {
    const map = new Map<string, string>();
    if (institutions.data?.ok) for (const row of institutions.data.value) map.set(row.id, row.name);
    return map;
  }, [institutions.data]);
  const endings = useMemo(() => {
    const map = new Map<string, AccessEndingRow>();
    if (ending.data?.ok)
      for (const entry of ending.data.value) map.set(entry.row.planId, entry.row);
    return map;
  }, [ending.data]);

  // The institutions are named and noted beside the record: the page waits for both reads.
  const waiting = view !== null && (institutions.data === undefined || ending.data === undefined);
  const besideFailed = view !== null && (institutions.isError || ending.isError);

  return (
    <PageContent wrap="wide">
      <RecordGuard
        read={{
          data: waiting ? undefined : answer,
          isPending: read.isPending || waiting,
          isError: read.isError || besideFailed,
          refetch: () => {
            void read.refetch();
            if (institutions.isError) void institutions.refetch();
            if (ending.isError) void ending.refetch();
          },
        }}
        loadingLabel={stateWords('SA-11.loading')}
        failed={{ title: stateWords('SA-11.failed'), line: stateWords('SA-11.failed.line') }}
        refusals={{ 'invalid-state': <NothingToDecide /> }}
      >
        {(page) => (
          <Decision
            key={page.update.id}
            view={page}
            institutions={institutionRows(page, names, endings)}
            onReread={() => read.refetch()}
          />
        )}
      </RecordGuard>
    </PageContent>
  );
}

/** f10 / B7-10 f4: the update is still with the Content Manager or the Academic Reviewer. */
function NothingToDecide() {
  return (
    <>
      <BackLink href={CONTENT_UPDATES_ADDRESS}>{DECISION_PAGE.back}</BackLink>
      <h1 className="xr-h1 [margin:8px_0_16px]">{DECISION_PAGE.nothingTitle}</h1>
      <div className="xr-section">
        <EmptyState
          icon="done"
          title={DECISION_PAGE.nothingHeading}
          className="[&_.xr-empty-icon]:bg-ok-bg [&_.xr-empty-icon]:text-ok [&_p]:text-ink-2"
          actions={
            <div className="flex flex-wrap gap-3">
              <Link className="xr-btn xr-btn--secondary" href={CONTENT_UPDATES_ADDRESS}>
                {DECISION_PAGE.backToUpdates}
              </Link>
            </div>
          }
        >
          {DECISION_PAGE.nothingLine}
        </EmptyState>
      </div>
    </>
  );
}

/** A refused decision, as the panel says it (state-copy `SA-11.stale.*`, `SA-11.moved-on`). */
type PanelNotice = 'stale' | 'moved-on';
type FocusTarget = 'decided' | 'title' | 'panel';

function Decision({
  view,
  institutions,
  onReread,
}: {
  readonly view: UpdateDecisionView;
  readonly institutions: readonly InstitutionUsingRow[];
  readonly onReread: () => Promise<unknown>;
}) {
  const facts = decisionFacts(view);
  const { update } = view;
  const [notice, setNotice] = useState<PanelNotice | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const panelTitleRef = useRef<HTMLHeadingElement>(null);
  const decidedRef = useRef<HTMLDivElement>(null);
  // Focus moves once the decision is read back (B7-05 `focus(pid + '-sdec')` after Release and
  // Hold, `focus(pid + '-h')` after Lift hold), or to the panel's heading after a refusal. In an
  // effect: in the same commit the confirmation's own close has given focus back.
  const [focusTo, setFocusTo] = useState<{ readonly target: FocusTarget; readonly n: number }>({
    target: 'title',
    n: 0,
  });
  useEffect(() => {
    if (focusTo.n === 0) return;
    const target =
      focusTo.target === 'decided'
        ? decidedRef.current
        : focusTo.target === 'title'
          ? titleRef.current
          : panelTitleRef.current;
    target?.focus();
  }, [focusTo, facts.kind]);
  const focus = (target: FocusTarget) => setFocusTo((current) => ({ target, n: current.n + 1 }));

  const decided = (target: FocusTarget) => {
    setNotice(null);
    focus(target);
  };
  const refused = (kind: PanelNotice) => {
    setNotice(kind);
    void onReread();
    focus('panel');
  };

  let panel;
  if (facts.kind === 'waiting') {
    panel = (
      <OpenPanel
        view={view}
        facts={facts}
        decidedRef={decidedRef}
        onDecided={() => decided('decided')}
        onRefused={refused}
      />
    );
  } else if (facts.kind === 'held' && facts.hold) {
    panel = (
      <HeldPanel
        view={view}
        hold={facts.hold}
        decidedRef={decidedRef}
        onLifted={() => decided('title')}
        onRefused={refused}
      />
    );
  } else if (facts.kind === 'released' && facts.release) {
    panel = (
      <div id={DECIDED_ID} ref={decidedRef} tabIndex={-1} className="flex flex-col gap-3">
        <StatusPill tone="ok">{DECISION_PAGE.released}</StatusPill>
        <p className="xr-small m-0 text-ink-2">
          {releasedLine(facts.release.on, facts.release.by)}
        </p>
        <p className="xr-body m-0 text-ink">{releasedNext(facts.liveVersion)}</p>
      </div>
    );
  } else {
    panel = (
      <div id={DECIDED_ID} ref={decidedRef} tabIndex={-1}>
        <p className="xr-body m-0 text-ink-2">{DECISION_PAGE.nothingLine}</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        className="[margin:8px_0_16px]"
        back={<BackLink href={CONTENT_UPDATES_ADDRESS}>{DECISION_PAGE.back}</BackLink>}
        overline={decisionOverline(update.id)}
        title={facts.title}
        titleFocusTarget
        titleRef={titleRef}
        meta={
          <>
            {facts.chip ? <StatusPill tone={facts.chip.tone}>{facts.chip.words}</StatusPill> : null}
            <span>{facts.liveLine}</span>
          </>
        }
      />
      {/* B7-05 draws the jump before the “Hold lifted” notice (f7, f11). */}
      <JumpLink targetId={PANEL_ID} className="mb-4" />
      {facts.liftedOn ? (
        <div className="mb-4">
          <Notice tone="info" role="status" title={DECISION_PAGE.liftedTitle}>
            {liftedLine(facts.liftedOn)}
          </Notice>
        </div>
      ) : null}
      <DecisionLayout
        jump={false}
        panel={{
          id: PANEL_ID,
          title: DECISION_PAGE.panelTitle,
          titleFocusTarget: true,
          titleRef: panelTitleRef,
          position: 'static',
          children: (
            <>
              {notice ? <RefusedNotice notice={notice} /> : null}
              {panel}
            </>
          ),
        }}
      >
        <WhatChanges view={view} facts={facts} />
        <Section title={DECISION_PAGE.whyTitle}>
          <SectionBody>
            {update.whatChangesAndWhy ? (
              <blockquote className="xv-quote bg-surface-2">{update.whatChangesAndWhy}</blockquote>
            ) : null}
            <p className="xl-meta [margin:10px_0_0]">{facts.raised}</p>
          </SectionBody>
        </Section>
        {facts.approval ? (
          <Section title={DECISION_PAGE.reviewTitle}>
            <SectionBody>
              <p className="xr-body m-0">
                <StatusPill tone="ok">{DECISION_PAGE.approved}</StatusPill>{' '}
                <span className="ml-2">{facts.approval}</span>
              </p>
              <p className="xl-meta [margin:10px_0_0]">{DECISION_PAGE.reviewHistoryBelow}</p>
            </SectionBody>
          </Section>
        ) : null}
        <Section title={DECISION_PAGE.institutionsTitle}>
          <SectionBody>
            {institutions.length > 0 ? (
              <InstitutionsTable rows={institutions} />
            ) : (
              <p className="xr-body m-0 text-ink-2">{stateWords('SA-11.no-institutions')}</p>
            )}
            <p className="xl-meta [margin:12px_0_0]">{DECISION_PAGE.institutionsNote}</p>
          </SectionBody>
        </Section>
        <Section title={DECISION_PAGE.historyTitle} meta={DECISION_PAGE.historyMeta}>
          <SectionBody>
            <Timeline events={facts.history} markLatest={false} />
          </SectionBody>
        </Section>
      </DecisionLayout>
    </>
  );
}

function RefusedNotice({ notice }: { readonly notice: PanelNotice }) {
  if (notice === 'stale') {
    return (
      <Notice tone="warn" role="alert" title={stateWords('SA-11.stale.title')}>
        {stateWords('SA-11.stale.line')}
      </Notice>
    );
  }
  return (
    <Notice tone="warn" role="alert">
      {stateWords('SA-11.moved-on')}
    </Notice>
  );
}

// ---- the main column (B7-05 AR-4, ~74 %) ----

/**
 * “What changes · Changed fields only” (f1): the shared comparison; once released, “Live before ·
 * Released” with its note (f6), or the register's line while the service gives no rows
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
  let body;
  if (facts.kind === 'released') {
    body =
      rows.length > 0 ? (
        <>
          <CorrectionComparison
            rows={rows}
            columns={{ before: DECISION_PAGE.liveBefore, after: DECISION_PAGE.released }}
          />
          <p className="xl-meta [margin:12px_0_0]">{DECISION_PAGE.liveBeforeNote}</p>
        </>
      ) : (
        <p className="xr-body m-0 text-ink-2">
          {stateWords('SA-11.released.no-comparison').replace('{version}', facts.baseVersion)}
        </p>
      );
  } else {
    body =
      rows.length > 0 ? (
        <CorrectionComparison rows={rows} />
      ) : (
        <p className="xr-body m-0 text-ink-2">{COMPARISON.nothingChanged}</p>
      );
  }
  return (
    <Section title={COMPARISON.whatChanges} meta={COMPARISON.changedOnly}>
      <SectionBody>{body}</SectionBody>
    </Section>
  );
}

/** “Institution · Access · Students · Note” (f1); labelled blocks below 760 px of content. */
function InstitutionsTable({ rows }: { readonly rows: readonly InstitutionUsingRow[] }) {
  const { columns } = DECISION_PAGE;
  return (
    <div className="xr-table-wrap">
      <table className="xr-table">
        <thead>
          <tr>
            <th scope="col">{columns.institution}</th>
            <th scope="col">{columns.access}</th>
            <th scope="col">{columns.students}</th>
            <th scope="col">{columns.note}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td className="is-primary">
                <strong>{row.name}</strong>
              </td>
              <td data-label={columns.access}>{row.access}</td>
              <td data-label={columns.students}>{row.students}</td>
              <td data-label={columns.note}>{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- the decision panel (B7-05 AR-4, ~26 %) ----

type Choice = 'release' | 'hold';

/**
 * Waiting for your decision (f1, f7): Release update or Hold, then its confirmation — Release
 * (DL-1, f8) or Hold with the reason the Content Manager sees (DL-2, f9).
 */
function OpenPanel({
  view,
  facts,
  decidedRef,
  onDecided,
  onRefused,
}: {
  readonly view: UpdateDecisionView;
  readonly facts: DecisionFacts;
  readonly decidedRef: RefObject<HTMLDivElement | null>;
  readonly onDecided: () => void;
  readonly onRefused: (notice: PanelNotice) => void;
}) {
  const { update } = view;
  const releaseCmd = useCommand((ports) => ports.corrections.releaseUpdate);
  const holdCmd = useCommand((ports) => ports.corrections.holdUpdate);
  const [choice, setChoice] = useState<Choice>('release');
  const [dialog, setDialog] = useState<Choice | null>(null);
  /** The update's revision when the confirmation opened (state-copy `SA-11.decision-rev`). */
  const [decisionRev, setDecisionRev] = useState(update.rev);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [dialogNotice, setDialogNotice] = useState<'stale' | 'unavailable' | null>(null);

  const open = () => {
    setDecisionRev(update.rev);
    setDialogNotice(null);
    if (choice === 'hold') {
      setReason('');
      setReasonError(null);
    }
    setDialog(choice);
  };

  const close = () => {
    setDialog(null);
    setDialogNotice(null);
  };

  const doRelease = () => {
    if (releaseCmd.busy) return;
    setDialogNotice(null);
    releaseCmd.run({ id: update.id, expectedRev: decisionRev }).then(
      (answer) => {
        setDialog(null);
        if (answer.ok) {
          onDecided();
          return;
        }
        // Stale, decided elsewhere, held meanwhile (`hold-must-be-lifted`): nothing was written.
        onRefused(answer.error.kind === 'stale-version' ? 'stale' : 'moved-on');
      },
      () => setDialogNotice('unavailable'),
    );
  };

  const doHold = () => {
    if (holdCmd.busy) return;
    const invalid = checkHoldReason(reason);
    if (invalid) {
      setReasonError(invalid);
      return;
    }
    setReasonError(null);
    setDialogNotice(null);
    holdCmd.run({ id: update.id, reason, expectedRev: decisionRev }).then(
      (answer) => {
        if (answer.ok) {
          setDialog(null);
          setReason('');
          onDecided();
          return;
        }
        const error = answer.error;
        if (error.kind === 'validation-failed') {
          setReasonError(holdReasonErrorOf(error));
          return;
        }
        if (error.kind === 'stale-version') {
          // The typed reason stays; the update is read again and the next press sends its
          // current revision (state-copy `SA-11.stale.line`).
          setDecisionRev(error.currentRev);
          setDialogNotice('stale');
          onRefused('stale');
          return;
        }
        setDialog(null);
        onRefused('moved-on');
      },
      () => setDialogNotice('unavailable'),
    );
  };

  return (
    <>
      <RadioGroup
        legend={DECISION_PAGE.legend}
        legendClass="xr-sr"
        value={choice}
        onValueChange={(value) => setChoice(value as Choice)}
      >
        <ChoiceList>
          <ChoiceCard
            id="update-choice-release"
            value="release"
            title={DECISION_PAGE.release}
            sub={DECISION_PAGE.releaseSub}
          />
          <ChoiceCard
            id="update-choice-hold"
            value="hold"
            title={DECISION_PAGE.hold}
            sub={DECISION_PAGE.holdSub}
          />
        </ChoiceList>
      </RadioGroup>
      <Button id="update-decide" variant="primary" block onClick={open}>
        {choice === 'hold' ? DECISION_PAGE.hold : DECISION_PAGE.release}
      </Button>
      <ConfirmDialog
        open={dialog === 'release'}
        idPrefix="update-release"
        align="decision"
        title={releaseTitle(update.id)}
        effect={
          <strong>
            {releaseEffect(facts.proposedVersion, facts.experiment, facts.liveVersion)}
          </strong>
        }
        notice={
          dialogNotice === 'unavailable' ? (
            <Notice tone="err" role="alert" className="mt-[14px]">
              {stateWords('SA-11.unavailable.release')}
            </Notice>
          ) : undefined
        }
        cancelLabel={RELEASE_DIALOG.cancel}
        confirmLabel={RELEASE_DIALOG.confirm}
        busy={releaseCmd.busy}
        busyLabel={RELEASE_DIALOG.busy}
        onConfirm={doRelease}
        onCancel={close}
        returnFocusFallback={decidedRef}
      />
      <ReasonDialog
        open={dialog === 'hold'}
        idPrefix="update-hold"
        align="decision"
        title={holdTitle(update.id)}
        effect={<strong>{holdEffect(facts.liveVersion)}</strong>}
        cancelLabel={HOLD_DIALOG.cancel}
        confirmLabel={HOLD_DIALOG.confirm}
        busy={holdCmd.busy}
        busyLabel={HOLD_DIALOG.busy}
        onConfirm={doHold}
        onCancel={close}
        returnFocusFallback={decidedRef}
      >
        {dialogNotice === 'stale' ? (
          <Notice
            tone="warn"
            role="alert"
            title={stateWords('SA-11.stale.title')}
            className="mb-[14px]"
          >
            {stateWords('SA-11.stale.line')}
          </Notice>
        ) : dialogNotice === 'unavailable' ? (
          <Notice tone="err" role="alert" className="mb-[14px]">
            {stateWords('SA-11.unavailable.hold')}
          </Notice>
        ) : null}
        <Field id="update-hold-reason" label={HOLD_DIALOG.reasonLabel} error={reasonError}>
          <Textarea
            className="min-h-[96px]"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setReasonError(null);
            }}
          />
        </Field>
      </ReasonDialog>
    </>
  );
}

/**
 * On hold (f5; B7-10 f2): when, by whom and why; the live version stays; Lift hold is the only
 * action (DL-1, no reason) — Release is not offered while held. What else a hold affects is open.
 */
function HeldPanel({
  view,
  hold,
  decidedRef,
  onLifted,
  onRefused,
}: {
  readonly view: UpdateDecisionView;
  readonly hold: NonNullable<DecisionFacts['hold']>;
  readonly decidedRef: RefObject<HTMLDivElement | null>;
  readonly onLifted: () => void;
  readonly onRefused: (notice: PanelNotice) => void;
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
      <div id={DECIDED_ID} ref={decidedRef} tabIndex={-1} className="flex flex-col gap-3">
        <StatusPill tone="paused">{DECISION_PAGE.onHold}</StatusPill>
        <p className="xr-small m-0 text-ink-2">{holdLine(hold.on, hold.by)}</p>
        <p className="xr-body m-0">{quoted(hold.reason)}</p>
        <p className="xr-body m-0 text-ink">{DECISION_PAGE.liveStays}</p>
        <Button id="update-lift" variant="secondary" block onClick={open}>
          {DECISION_PAGE.liftHold}
        </Button>
        <p className="xl-open m-0">
          <Icon name="info" size={16} />
          <span>{HOLD_OPEN.words}</span>
        </p>
      </div>
      <ConfirmDialog
        open={confirming}
        idPrefix="update-lift"
        align="decision"
        title={liftTitle(update.id)}
        effect={<strong>{LIFT_DIALOG.effect}</strong>}
        notice={
          unavailable ? (
            <Notice tone="err" role="alert" className="mt-[14px]">
              {stateWords('SA-11.unavailable.lift')}
            </Notice>
          ) : undefined
        }
        cancelLabel={LIFT_DIALOG.cancel}
        confirmLabel={LIFT_DIALOG.confirm}
        busy={liftCmd.busy}
        busyLabel={LIFT_DIALOG.busy}
        onConfirm={doLift}
        onCancel={() => setConfirming(false)}
        returnFocusFallback={decidedRef}
      />
    </>
  );
}
