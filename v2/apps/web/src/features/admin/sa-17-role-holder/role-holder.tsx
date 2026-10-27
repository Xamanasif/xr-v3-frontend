'use client';

import type { Result, ServiceError } from '@xr/contracts/draft';
import type { PlatformRole } from '@xr/domain';
import {
  Breadcrumbs,
  Button,
  ButtonRow,
  ChoiceGroup,
  ConfirmDialog,
  DecisionPanel,
  DefinitionList,
  DetailLayout,
  ErrorSummary,
  type ErrorSummaryItem,
  Field,
  GoButton,
  Hint,
  InlineForm,
  MetaSeparator,
  Notice,
  PageHead,
  RecordLine,
  ScopeItem,
  ScopeList,
  SectionNote,
  Select,
  type SelectOption,
  StatusPill,
  SurfaceSection,
  Textarea,
  Timeline,
} from '@xr/ui/v3';
import { useEffect, useMemo, useRef, useState } from 'react';

import { dayMonthYear, weekdayDate } from '@/copy/dates';
import {
  ALL_EXPERIMENTS,
  ASSIGN_PANEL,
  assignedFlash,
  assignedWords,
  courseScopeWords,
  experimentOption,
  type FlashWords,
  HOLDER_PAGE,
  reasonLabel,
  registeredOn,
  RESTORE_DIALOG,
  restoredFlash,
  restoreLabel,
  restoreQuestion,
  ROLE_TAB_WORDS,
  ROLE_WORDS,
  ROLES_PAGE,
  withdrawLabel,
  withdrawnFlash,
  withdrawnWords,
} from '@/copy/platform-roles';
import { SA_UNAVAILABLE } from '@/copy/sa-shared';
import { stateWords } from '@/copy/state-copy';
import { holderPlacement, ROLE_TABS, type RoleTab, ROLES_ADDRESS } from '@/nav/platform-roles';
import { usePublishedCatalogue } from '@/queries/catalogue';
import { useRoleHolder } from '@/queries/platform-roles';
import {
  type AssignDraft,
  type AssignErrors,
  assignErrorsOf,
  assignInput,
  checkAssign,
  checkWithdrawReason,
  type HolderView,
  type ScopeKind,
  type ScopeView,
  withdrawErrorOf,
} from '@/queries/platform-roles-forms';
import { useSession } from '@/queries/session';
import { useAcademicStructure } from '@/queries/structure';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { SaRecordGuard } from '../shared/sa-record-guard';
import { arrivalFor, forgetArrival, HOLDER_TITLE_ID } from './arrival';
import {
  activeScopes,
  effectiveScopes,
  effectWords,
  grantsNothing,
  historyLines,
  type ScopeNaming,
  scopeNamings,
  type TargetLookup,
  withdrawnScopes,
} from './holder-view';

/** What Assign scope can choose from (state-copy `SA-17.choices`), and how a history scope is named. */
interface Choices {
  readonly lookup: TargetLookup;
  readonly courses: readonly SelectOption[];
  readonly experiments: readonly SelectOption[];
}

/** The kinds Assign scope offers: never “One experiment” for a Vendor (owner decision PD-4). */
function scopeKindsFor(role: PlatformRole): readonly ScopeKind[] {
  return role === 'vendor' ? ['all', 'course'] : ['all', 'course', 'experiment'];
}

/** The SA-16 tab a role is listed on. */
function tabOf(role: PlatformRole): RoleTab {
  return ROLE_TABS.find((tab) => ROLE_TAB_WORDS[tab].role === role) ?? 'vendors';
}

/**
 * SA-17 Role holder — the owner-approved V3 design (design/v3-refined-b/roles/SA-v1,
 * `sa-views-d.js` `V.holder`, `SA.DLG.restoreScope`) at `/admin/roles/[holderId]`.
 *
 * - **Read**: `PlatformRoleService.getHolder` (`useRoleHolder`) — the record and its current
 *   scopes with their status, course code and name (PC-70) — with the Academic structure's courses
 *   and the published catalogue's experiments for Assign scope (`useAcademicStructure`,
 *   `usePublishedCatalogue`). An address that names no holder is the GL-04 “This page isn’t
 *   available” message in place (`SaRecordGuard`).
 * - **As the export draws it**: the crumbs Platform roles › <tab> › <name>, the head (the role, the
 *   name, Has scope / No scope, the organisation and the registration date; “Go to assign scope”
 *   under 860 px), the flash, the “No scope — can’t act on anything yet” notice; the record sheet —
 *   “Can act on” (the role's line, each active scope with “Assigned …” and Withdraw), “Withdrawn”
 *   (“Withdrawn … · “reason”” and Restore), the holder's facts with the sign-in note, the history
 *   newest first — and the “Assign scope” panel beside it (below it under 860 px).
 * - **Act**: Assign scope (the panel: all experiments, a course or one experiment, then the course
 *   or experiment; its errors in the panel's summary and on their fields), Withdraw (inline below
 *   the scope, a reason required, kept in the history) and Restore (a confirmation, no reason
 *   asked) send `assignScope`, `withdrawScope` and `restoreScope` with the holder's revision
 *   (state-copy `SA-17.expected-rev`). The service's “<X> is already in scope” shows the same way
 *   as the panel's own checks. Each result is said in the flash, which takes focus; the holder's
 *   queue, library or course list follows at once (the `ROLE` receipt). A change refused because
 *   the holder moved on writes nothing: the form or dialog closes, the holder is read again and
 *   the refusal notice at the top of the panel takes focus (state-copy `SA-17.stale.*`).
 * - Opened straight after Register (SA-16): the registration flash, focus on the name.
 * - Nothing is sent from here; how a holder first signs in is open (T-11). For a Vendor (owner
 *   decisions of 27 Oct 2026): “All experiments” is any course, now and later (PD-2); the panel
 *   offers it and “A course” only — never “One experiment” (PD-4); a one-experiment scope still
 *   held gives nothing: listed and withdrawable, not counted as a scope, never restored.
 */
export function RoleHolder({ holderId }: { readonly holderId: string }) {
  const read = useRoleHolder(holderId);
  const structure = useAcademicStructure();
  const catalogue = usePublishedCatalogue();
  // The address is untrusted text: the placement names the holder only once it is read; a holder
  // the service will not show is “Not available”.
  const refused = read.data !== undefined && !read.data.ok;
  useShellPage(
    refused
      ? { screen: 'SA-17', title: SA_UNAVAILABLE.documentTitle, trail: [] }
      : holderPlacement(read.data?.ok ? read.data.value.holder.name : null),
  );
  const [arrival] = useState(() => ({ holderId, words: arrivalFor(holderId) }));
  useEffect(() => forgetArrival(holderId), [holderId]);

  const choices = useMemo((): Choices => {
    const courses = new Map<string, { readonly code: string | null; readonly name: string }>();
    const courseOptions: SelectOption[] = [];
    if (structure.data?.ok) {
      for (const area of structure.data.value) {
        for (const { course } of area.courses) {
          courses.set(course.id, { code: course.platformCode, name: course.name });
          courseOptions.push({
            value: course.id,
            label: courseScopeWords(course.platformCode, course.name),
          });
        }
      }
    }
    const experiments = new Map<string, string>();
    const experimentOptions: SelectOption[] = [];
    if (catalogue.data?.ok) {
      for (const entry of catalogue.data.value.entries) {
        experiments.set(entry.experimentId, entry.name);
        experimentOptions.push({
          value: entry.experimentId,
          label: experimentOption(entry.name, entry.platformCode),
        });
      }
    }
    return {
      lookup: { courses, experiments },
      courses: courseOptions,
      experiments: experimentOptions,
    };
  }, [structure.data, catalogue.data]);

  const waiting = structure.isPending || catalogue.isPending;
  return (
    <SaRecordGuard
      read={{
        data: waiting ? undefined : read.data,
        isPending: read.isPending || waiting,
        isError: read.isError || structure.isError || catalogue.isError,
        refetch: () => {
          void read.refetch();
          void structure.refetch();
          void catalogue.refetch();
        },
      }}
      loadingLabel={stateWords('SA-17.loading')}
      failedTitle={stateWords('SA-17.failed')}
    >
      {(view) => (
        <HolderContent
          view={view}
          choices={choices}
          arrival={arrival.holderId === view.holder.id ? arrival.words : null}
          refetch={() => void read.refetch()}
        />
      )}
    </SaRecordGuard>
  );
}

/** The open inline Withdraw form, with the holder's revision as the page showed it when it opened. */
interface WithdrawForm {
  readonly scopeId: string;
  readonly reason: string;
  readonly error: string | null;
  readonly expectedRev: number;
  readonly unavailable: boolean;
}

/** The open Restore confirmation, with the holder's revision when it opened. */
interface RestoreForm {
  readonly scopeId: string;
  readonly expectedRev: number;
  readonly unavailable: boolean;
}

/** What the Assign scope panel has chosen, and its errors. */
interface AssignForm extends AssignDraft {
  readonly errors: AssignErrors;
  readonly unavailable: boolean;
}

const EMPTY_ASSIGN: AssignForm = {
  kind: null,
  courseId: '',
  experimentId: '',
  errors: {},
  unavailable: false,
};

const IDS = {
  flash: 'role-holder-flash',
  refusal: 'role-holder-refusal',
  panel: 'assign-scope',
  panelTitle: 'assign-scope-h',
  errors: 'assign-scope-errors',
  kind: 'assign-kind',
  course: 'assign-course',
  experiment: 'assign-experiment',
  canActOn: 'holder-can-act-on',
  withdrawn: 'holder-withdrawn',
  facts: 'holder-facts',
  history: 'holder-history',
  withdraw: (scopeId: string) => `withdraw-${scopeId}`,
  reason: (scopeId: string) => `withdraw-reason-${scopeId}`,
  restore: (scopeId: string) => `restore-${scopeId}`,
} as const;

function HolderContent({
  view,
  choices,
  arrival,
  refetch,
}: {
  readonly view: HolderView;
  readonly choices: Choices;
  readonly arrival: FlashWords | null;
  readonly refetch: () => void;
}) {
  const { holder } = view;
  const session = useSession();
  const named = scopeNamings(view, choices.lookup);
  const naming = (scope: ScopeView): ScopeNaming =>
    named.get(scope.scope.id) ?? {
      short: scope.scope.id,
      full: scope.scope.id,
      code: null,
      title: scope.scope.id,
    };
  const active = activeScopes(view);
  const withdrawn = withdrawnScopes(view);
  const tab = tabOf(holder.role);

  const [withdrawForm, setWithdrawForm] = useState<WithdrawForm | null>(null);
  const [restoreForm, setRestoreForm] = useState<RestoreForm | null>(null);
  const [assignForm, setAssignForm] = useState<AssignForm>(EMPTY_ASSIGN);
  const [flash, setFlash] = useState<FlashWords | null>(arrival);
  const [stale, setStale] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const assign = useCommand((ports) => ports.platformRoles.assignScope);
  const withdraw = useCommand((ports) => ports.platformRoles.withdrawScope);
  const restore = useCommand((ports) => ports.platformRoles.restoreScope);

  // Focus moves after the commit that shows its target (the export's `SA.focus(id)`): the flash
  // after a result, the panel's error summary or the reason after an error, the Withdraw button
  // after Cancel, the refusal notice after a refusal. A dialog gives focus back to its trigger in
  // the same commit (a child's effect runs first), so this request wins; a target that is gone
  // falls back to the name.
  const [focusRequest, setFocusRequest] = useState<{ readonly id: string; readonly n: number }>({
    id: arrival ? HOLDER_TITLE_ID : '',
    n: arrival ? 1 : 0,
  });
  useEffect(() => {
    if (focusRequest.n === 0) return;
    (document.getElementById(focusRequest.id) ?? titleRef.current)?.focus();
  }, [focusRequest]);
  const focus = (id: string) => setFocusRequest((current) => ({ id, n: current.n + 1 }));

  const done = (words: FlashWords) => {
    setWithdrawForm(null);
    setRestoreForm(null);
    setStale(false);
    setFlash(words);
    focus(IDS.flash);
  };

  /** Refused because the holder moved on (stale, the scope no longer as shown): read it again. */
  const movedOn = () => {
    setWithdrawForm(null);
    setRestoreForm(null);
    setFlash(null);
    setStale(true);
    refetch();
    focus(IDS.refusal);
  };

  // ---- Withdraw (inline, a reason required) and Restore (a confirmation) ----

  const startWithdraw = (scope: ScopeView) => {
    setWithdrawForm({
      scopeId: scope.scope.id,
      reason: '',
      error: null,
      expectedRev: holder.rev,
      unavailable: false,
    });
    setFlash(null);
    setStale(false);
    focus(IDS.reason(scope.scope.id));
  };
  const cancelWithdraw = () => {
    if (!withdrawForm) return;
    setWithdrawForm(null);
    focus(IDS.withdraw(withdrawForm.scopeId));
  };
  const startRestore = (scope: ScopeView) => {
    setWithdrawForm(null);
    setRestoreForm({ scopeId: scope.scope.id, expectedRev: holder.rev, unavailable: false });
    setFlash(null);
    setStale(false);
  };

  const refusedWithdraw = (answer: Result<unknown, ServiceError>, scopeId: string) => {
    if (answer.ok) return;
    const error = answer.error.kind === 'validation-failed' ? withdrawErrorOf(answer.error) : null;
    if (error) {
      setWithdrawForm((current) =>
        current?.scopeId === scopeId ? { ...current, error } : current,
      );
      focus(IDS.reason(scopeId));
      return;
    }
    movedOn();
  };

  const saveWithdraw = (scope: ScopeView) => {
    if (withdrawForm?.scopeId !== scope.scope.id || withdraw.busy) return;
    const { reason, expectedRev } = withdrawForm;
    const error = checkWithdrawReason(holder.id, scope.scope.id, reason, expectedRev);
    if (error) {
      setWithdrawForm({ ...withdrawForm, error, unavailable: false });
      focus(IDS.reason(scope.scope.id));
      return;
    }
    withdraw.run({ holderId: holder.id, scopeId: scope.scope.id, reason, expectedRev }).then(
      (answer) => {
        if (answer.ok) done(withdrawnFlash(naming(scope).short));
        else refusedWithdraw(answer, scope.scope.id);
      },
      () =>
        setWithdrawForm((current) =>
          current?.scopeId === scope.scope.id ? { ...current, unavailable: true } : current,
        ),
    );
  };

  const restoring = restoreForm
    ? view.scopes.find((s) => s.scope.id === restoreForm.scopeId)
    : null;
  const saveRestore = () => {
    if (!restoreForm || !restoring || restore.busy) return;
    restore
      .run({
        holderId: holder.id,
        scopeId: restoring.scope.id,
        expectedRev: restoreForm.expectedRev,
      })
      .then(
        (answer) => {
          if (answer.ok) done(restoredFlash(naming(restoring).short));
          else movedOn();
        },
        () => setRestoreForm((current) => (current ? { ...current, unavailable: true } : current)),
      );
  };

  // ---- Assign scope (the panel) ----

  /** “EEE ZC341”, “All experiments”, “Synchronous Generator” (the export's `v`). */
  const assignedName = (draft: AssignDraft): string => {
    if (draft.kind === 'course') {
      const course = choices.lookup.courses.get(draft.courseId);
      return course?.code ?? course?.name ?? draft.courseId;
    }
    if (draft.kind === 'experiment') {
      return choices.lookup.experiments.get(draft.experimentId) ?? draft.experimentId;
    }
    return ALL_EXPERIMENTS;
  };

  const confirmAssign = () => {
    if (assign.busy) return;
    const draft = assignForm;
    // The panel is always open: the change carries the revision the page shows when it is sent.
    const expectedRev = holder.rev;
    const errors = checkAssign(holder.id, draft, expectedRev);
    if (errors) {
      setAssignForm({ ...draft, errors, unavailable: false });
      focus(IDS.errors);
      return;
    }
    assign.run(assignInput(holder.id, draft, expectedRev)).then(
      (answer) => {
        if (answer.ok) {
          setAssignForm(EMPTY_ASSIGN);
          done(assignedFlash(assignedName(draft)));
          return;
        }
        if (answer.error.kind === 'validation-failed') {
          const refused = assignErrorsOf(answer.error);
          setAssignForm((current) => ({ ...current, errors: refused }));
          focus(IDS.errors);
          return;
        }
        setAssignForm((current) => ({ ...current, errors: {} }));
        movedOn();
      },
      () => setAssignForm((current) => ({ ...current, unavailable: true })),
    );
  };

  const choose = (kind: ScopeKind) => setAssignForm({ ...EMPTY_ASSIGN, kind });

  // The kind's error, or — for All experiments — the service's “… is already in scope”, under
  // the choices; the course's or experiment's under its select.
  const kindError =
    assignForm.errors.kind ?? (assignForm.kind === 'all' ? assignForm.errors.target : undefined);
  const targetError = assignForm.kind !== 'all' ? assignForm.errors.target : undefined;
  const targetId = assignForm.kind === 'experiment' ? IDS.experiment : IDS.course;
  const summary: ErrorSummaryItem[] = [
    ...(kindError ? [{ fieldId: IDS.kind, summaryText: kindError }] : []),
    ...(targetError ? [{ fieldId: targetId, summaryText: targetError }] : []),
  ];

  const history = historyLines(holder, named);
  const hasScope = effectiveScopes(view).length > 0;

  const scopeLine = (scope: ScopeView, detail: string) => {
    const words = naming(scope);
    return { code: words.code, title: words.title, detail };
  };

  return (
    <>
      <PageHead
        variant="record"
        breadcrumbs={
          <Breadcrumbs
            levels={[
              { label: ROLES_PAGE.title, href: ROLES_ADDRESS },
              // Explicit even for Vendors (normalised on arrival): two crumbs, two addresses.
              { label: ROLE_TAB_WORDS[tab].label, href: `${ROLES_ADDRESS}?tab=${tab}` },
            ]}
            current={holder.name}
          />
        }
        date={session.status === 'signed-in' ? weekdayDate(session.signedInAt) : undefined}
        eyebrow={ROLE_WORDS[holder.role]}
        title={holder.name}
        titleId={HOLDER_TITLE_ID}
        titleFocusTarget
        titleRef={titleRef}
        meta={
          <>
            <StatusPill tone={hasScope ? 'ok' : 'warn'} size="lg">
              {hasScope ? ROLES_PAGE.hasScope : ROLES_PAGE.noScope}
            </StatusPill>
            <span>{holder.organisation}</span>
            <MetaSeparator />
            <span>{registeredOn(dayMonthYear(holder.registeredAt))}</span>
          </>
        }
        goTo={{ label: HOLDER_PAGE.goTo, targetId: IDS.panel, focusId: IDS.panelTitle }}
      />
      {flash ? (
        <Notice tone="ok" icon="okDisc" role="status" id={IDS.flash} title={flash.title}>
          {flash.line}
        </Notice>
      ) : null}
      {hasScope ? null : (
        <Notice tone="warn" icon="userQuestion" title={HOLDER_PAGE.noScopeTitle}>
          {holder.role === 'vendor'
            ? stateWords('SA-17.vendor-no-scope-line')
            : HOLDER_PAGE.noScopeLine}
        </Notice>
      )}
      <DetailLayout
        asideId={IDS.panel}
        asideLabelledBy={IDS.panelTitle}
        main={
          <>
            <SurfaceSection title={HOLDER_PAGE.canActOn} titleId={IDS.canActOn}>
              <RecordLine>{effectWords(view)}</RecordLine>
              {active.length > 0 ? (
                <ScopeList>
                  {active.map((scope) => {
                    const words = naming(scope);
                    const open = withdrawForm?.scopeId === scope.scope.id ? withdrawForm : null;
                    return (
                      <ScopeItem
                        key={scope.scope.id}
                        {...scopeLine(scope, assignedWords(dayMonthYear(scope.scope.assignedAt)))}
                        action={
                          open ? null : (
                            <Button
                              variant="ghost"
                              id={IDS.withdraw(scope.scope.id)}
                              aria-label={withdrawLabel(words.full)}
                              onClick={() => startWithdraw(scope)}
                            >
                              {HOLDER_PAGE.withdraw}
                            </Button>
                          )
                        }
                      >
                        {open ? (
                          <InlineForm>
                            <Field
                              id={IDS.reason(scope.scope.id)}
                              label={reasonLabel(words.short)}
                              hint={HOLDER_PAGE.reasonHint}
                              error={open.error ?? undefined}
                            >
                              <Textarea
                                value={open.reason}
                                onChange={(event) => {
                                  const reason = event.target.value;
                                  setWithdrawForm((current) =>
                                    current
                                      ? { ...current, reason, error: null, unavailable: false }
                                      : current,
                                  );
                                }}
                              />
                            </Field>
                            <ButtonRow>
                              <Button
                                variant="navy"
                                busy={withdraw.busy}
                                busyLabel={HOLDER_PAGE.withdrawConfirm}
                                onClick={() => saveWithdraw(scope)}
                              >
                                {HOLDER_PAGE.withdrawConfirm}
                              </Button>
                              <Button onClick={cancelWithdraw}>{HOLDER_PAGE.cancel}</Button>
                            </ButtonRow>
                            {open.unavailable ? (
                              <Notice
                                tone="warn"
                                icon="alertCircle"
                                role="status"
                                title={stateWords('SA-17.unavailable')}
                              />
                            ) : null}
                          </InlineForm>
                        ) : null}
                      </ScopeItem>
                    );
                  })}
                </ScopeList>
              ) : null}
            </SurfaceSection>
            {withdrawn.length > 0 ? (
              <SurfaceSection title={HOLDER_PAGE.withdrawnHeading} titleId={IDS.withdrawn}>
                <ScopeList>
                  {withdrawn.map((scope) => {
                    const withdrawal = scope.scope.withdrawal!;
                    return (
                      <ScopeItem
                        key={scope.scope.id}
                        {...scopeLine(
                          scope,
                          withdrawnWords(dayMonthYear(withdrawal.at), withdrawal.reason),
                        )}
                        action={
                          grantsNothing(view, scope) ? null : (
                            <Button
                              id={IDS.restore(scope.scope.id)}
                              aria-label={restoreLabel(naming(scope).full)}
                              onClick={() => startRestore(scope)}
                            >
                              {HOLDER_PAGE.restore}
                            </Button>
                          )
                        }
                      />
                    );
                  })}
                </ScopeList>
              </SurfaceSection>
            ) : null}
            <SurfaceSection title={HOLDER_PAGE.holder} titleId={IDS.facts}>
              <DefinitionList
                items={[
                  { term: HOLDER_PAGE.keys.role, value: ROLE_WORDS[holder.role] },
                  { term: HOLDER_PAGE.keys.organisation, value: holder.organisation },
                  { term: HOLDER_PAGE.keys.workEmail, value: holder.workEmail },
                  { term: HOLDER_PAGE.keys.registered, value: dayMonthYear(holder.registeredAt) },
                ]}
              />
              <Hint under="list">{HOLDER_PAGE.signInNote}</Hint>
            </SurfaceSection>
            <SurfaceSection
              title={HOLDER_PAGE.history}
              titleId={IDS.history}
              aside={<SectionNote>{HOLDER_PAGE.historyMeta}</SectionNote>}
            >
              <Timeline
                events={history.map((line) => ({
                  what: line.what,
                  when: line.when,
                  ...(line.note ? { note: line.note } : {}),
                }))}
              />
            </SurfaceSection>
          </>
        }
        aside={
          <DecisionPanel title={ASSIGN_PANEL.title} titleId={IDS.panelTitle}>
            {stale ? (
              <Notice
                tone="warn"
                icon="alertCircle"
                role="alert"
                id={IDS.refusal}
                title={stateWords('SA-17.stale.title')}
              >
                {stateWords('SA-17.stale.line')}
              </Notice>
            ) : null}
            <ErrorSummary
              id={IDS.errors}
              title={ASSIGN_PANEL.errorsTitle}
              items={summary}
              autoFocus={false}
            />
            <ChoiceGroup<ScopeKind>
              id={IDS.kind}
              name={IDS.kind}
              legend={ASSIGN_PANEL.legend}
              error={kindError}
              value={assignForm.kind}
              onChange={choose}
              options={scopeKindsFor(holder.role).map((kind) => ({
                value: kind,
                title: ASSIGN_PANEL.choices[kind].title,
                description:
                  holder.role === 'vendor' && kind === 'all'
                    ? stateWords('SA-17.vendor-choices')
                    : ASSIGN_PANEL.choices[kind].sub,
              }))}
            />
            {assignForm.kind === 'course' ? (
              <Field id={IDS.course} label={ASSIGN_PANEL.course} error={targetError}>
                <Select
                  value={assignForm.courseId}
                  onChange={(event) => {
                    const courseId = event.target.value;
                    setAssignForm((current) => ({
                      ...current,
                      courseId,
                      errors: {},
                      unavailable: false,
                    }));
                  }}
                  options={[{ value: '', label: ASSIGN_PANEL.chooseCourse }, ...choices.courses]}
                />
              </Field>
            ) : null}
            {assignForm.kind === 'experiment' ? (
              <Field id={IDS.experiment} label={ASSIGN_PANEL.experiment} error={targetError}>
                <Select
                  value={assignForm.experimentId}
                  onChange={(event) => {
                    const experimentId = event.target.value;
                    setAssignForm((current) => ({
                      ...current,
                      experimentId,
                      errors: {},
                      unavailable: false,
                    }));
                  }}
                  options={[
                    { value: '', label: ASSIGN_PANEL.chooseExperiment },
                    ...choices.experiments,
                  ]}
                />
              </Field>
            ) : null}
            {assignForm.unavailable ? (
              <Notice
                tone="warn"
                icon="alertCircle"
                role="status"
                title={stateWords('SA-17.unavailable')}
              />
            ) : null}
            <GoButton busy={assign.busy} busyLabel={ASSIGN_PANEL.busy} onClick={confirmAssign}>
              {ASSIGN_PANEL.confirm}
            </GoButton>
            <Hint>{ASSIGN_PANEL.hint}</Hint>
          </DecisionPanel>
        }
      />
      <ConfirmDialog
        open={restoreForm !== null}
        initialFocus="confirm"
        submitOnEnter
        idPrefix="restore-scope"
        returnFocusFallback={titleRef}
        title={restoring ? restoreQuestion(naming(restoring).short, holder.name) : ''}
        description={RESTORE_DIALOG.description}
        confirmLabel={RESTORE_DIALOG.confirm}
        cancelLabel={RESTORE_DIALOG.cancel}
        busy={restore.busy}
        busyLabel={RESTORE_DIALOG.busy}
        onConfirm={saveRestore}
        onCancel={() => setRestoreForm(null)}
      >
        {restoreForm?.unavailable ? (
          <Notice
            tone="warn"
            icon="alertCircle"
            role="status"
            title={stateWords('SA-17.unavailable')}
          />
        ) : null}
      </ConfirmDialog>
    </>
  );
}
