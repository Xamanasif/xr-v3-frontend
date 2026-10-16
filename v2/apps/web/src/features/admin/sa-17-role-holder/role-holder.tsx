'use client';

import type { Result, ServiceError } from '@xr/contracts/draft';
import {
  BackLink,
  Button,
  ChoiceCard,
  ChoiceList,
  EditDialog,
  Field,
  Icon,
  Notice,
  PageContent,
  PageHeader,
  RadioGroup,
  Section,
  SectionBody,
  Select,
  type SelectOption,
  Textarea,
  Timeline,
} from '@xr/ui';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import { dayMonthYear } from '@/copy/dates';
import {
  ALL_EXPERIMENTS,
  ASSIGN_DIALOG,
  assignedFlash,
  assignHelp,
  assignTitle,
  courseScopeWords,
  experimentOption,
  HOLDER_PAGE,
  holderOverline,
  reasonLabel,
  registeredByWords,
  restoredFlash,
  restoreLabel,
  restoreQuestion,
  ROLE_WORDS,
  sinceWords,
  withdrawLabel,
  withdrawnFlash,
  withdrawnWords,
} from '@/copy/platform-roles';
import { stateWords } from '@/copy/state-copy';
import { holderPlacement, ROLES_ADDRESS } from '@/nav/platform-roles';
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
import { useAcademicStructure } from '@/queries/structure';
import { useCommand } from '@/queries/use-command';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { arrivalFor, forgetArrival, HOLDER_TITLE_ID } from './arrival';
import {
  activeScopes,
  actorName,
  effectWords,
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

/**
 * SA-17 Role holder — boards B7-08 f1 (no scope), f2 (375), f4 (Withdraw · reason required), f5
 * (Assign scope · validation), f7 (Content Manager · all experiments), f8 (Restore); B7-10 f10,
 * f11; B7-12 “Role holder” at four widths — at `/admin/roles/[holderId]`.
 *
 * - **Read**: `PlatformRoleService.getHolder` (`useRoleHolder`) — the record and its current
 *   scopes with their status, course code and name (PC-70) — with the Academic structure's courses
 *   and the published catalogue's experiments for Assign scope (`useAcademicStructure`,
 *   `usePublishedCatalogue`). An address that names no holder is the in-shell not-found page.
 * - **As B7-08 draws it**: back to Platform roles, “<Role> · <organisation>” and the name, Assign
 *   scope (the one primary), the flash, the “No scope — can’t act on anything yet” notice, “Can act
 *   on” — the role's line (B7-08 `eff`), each active scope with “Since …” and Withdraw, then the
 *   withdrawn scopes with “Withdrawn … · “reason”” and Restore — the holder's facts with the
 *   sign-in note (without “(T-11)”, P1-14) and the history, newest first.
 * - **Act**: Assign scope (DL-3: all experiments, a course or one experiment, then the course or
 *   experiment), Withdraw (inline beside the scope, a reason required — DL-2's rule, kept in the
 *   history) and Restore (inline, no reason asked — OD-B7-10) send `assignScope`, `withdrawScope`
 *   and `restoreScope` with the holder's revision from when the dialog or panel opened
 *   (`expectedRev`). Errors show on their fields, checked first with the contract's rules; the
 *   service's “<X> is already in scope” the same way. Each result is said in the flash, which
 *   takes focus; the holder's queue, library or course list follows at once (the `ROLE` receipt).
 *   A change refused because the holder moved on writes nothing: the dialog or panel closes, the
 *   holder is read again and the stale notice takes focus (state-copy `SA-17.stale.*`).
 * - Opened straight after Register (SA-16): the registration flash, focus on the name.
 * - Nothing is sent from here; how a holder first signs in is open (T-11). What a non-course
 *   scope means for a Vendor is open (ROLE-11): the scope is shown as held, never as a right.
 */
export function RoleHolder({ holderId }: { readonly holderId: string }) {
  const read = useRoleHolder(holderId);
  const structure = useAcademicStructure();
  const catalogue = usePublishedCatalogue();
  // The address is untrusted text: the crumbs name the holder only once it is read.
  useShellPage(holderPlacement(read.data?.ok ? read.data.value.holder.name : null));
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
    <PageContent wrap="read">
      <RecordGuard
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
        failed={{ title: stateWords('SA-17.failed'), line: stateWords('SA-17.failed.line') }}
      >
        {(view) => (
          <HolderContent
            view={view}
            choices={choices}
            arrival={arrival.holderId === view.holder.id ? arrival.words : null}
            refetch={() => void read.refetch()}
          />
        )}
      </RecordGuard>
    </PageContent>
  );
}

/** An open inline panel, with the holder's revision as the page showed it when it opened. */
type Panel =
  | {
      readonly kind: 'withdraw';
      readonly scopeId: string;
      readonly reason: string;
      readonly error: string | null;
      readonly expectedRev: number;
      readonly unavailable: boolean;
    }
  | {
      readonly kind: 'restore';
      readonly scopeId: string;
      readonly expectedRev: number;
      readonly unavailable: boolean;
    };

/** The open Assign scope dialog. */
interface Dialog extends AssignDraft {
  readonly errors: AssignErrors;
  readonly expectedRev: number;
  readonly unavailable: boolean;
}

/** What the flash line says: a result (B7-08's flash) or that the holder moved on. */
type Flash = { readonly kind: 'done'; readonly words: string } | { readonly kind: 'stale' };

const IDS = {
  flash: 'role-holder-flash',
  assign: 'role-holder-assign',
  kindAll: 'assign-kind-all',
  course: 'assign-course',
  experiment: 'assign-experiment',
  withdraw: (scopeId: string) => `withdraw-${scopeId}`,
  reason: (scopeId: string) => `withdraw-reason-${scopeId}`,
  restore: (scopeId: string) => `restore-${scopeId}`,
  restoreGo: (scopeId: string) => `restore-go-${scopeId}`,
} as const;

function HolderContent({
  view,
  choices,
  arrival,
  refetch,
}: {
  readonly view: HolderView;
  readonly choices: Choices;
  readonly arrival: string | null;
  readonly refetch: () => void;
}) {
  const { holder } = view;
  const named = scopeNamings(view, choices.lookup);
  const naming = (scope: ScopeView): ScopeNaming =>
    named.get(scope.scope.id) ?? { short: scope.scope.id, full: scope.scope.id };
  const active = activeScopes(view);
  const withdrawn = withdrawnScopes(view);

  const [panel, setPanel] = useState<Panel | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [flash, setFlash] = useState<Flash | null>(
    arrival ? { kind: 'done', words: arrival } : null,
  );
  const titleRef = useRef<HTMLHeadingElement>(null);
  const flashRef = useRef<HTMLParagraphElement>(null);
  const staleRef = useRef<HTMLDivElement>(null);
  const assign = useCommand((ports) => ports.platformRoles.assignScope);
  const withdraw = useCommand((ports) => ports.platformRoles.withdrawScope);
  const restore = useCommand((ports) => ports.platformRoles.restoreScope);

  // Focus moves after the commit that shows its target (B7-08 `focus(id)`): the flash after a
  // result, a field after an error, the button that opened a panel after Cancel, the stale notice
  // after a refusal. A dialog gives focus back to its trigger in the same commit (a child's effect
  // runs first), so this request wins; a target that is gone falls back to the name.
  const [focusRequest, setFocusRequest] = useState<{ readonly id: string; readonly n: number }>({
    id: arrival ? HOLDER_TITLE_ID : '',
    n: arrival ? 1 : 0,
  });
  useEffect(() => {
    if (focusRequest.n === 0) return;
    const target =
      focusRequest.id === IDS.flash
        ? (staleRef.current ?? flashRef.current)
        : (document.getElementById(focusRequest.id) ?? titleRef.current);
    target?.focus();
  }, [focusRequest]);
  const focus = (id: string) => setFocusRequest((current) => ({ id, n: current.n + 1 }));

  const done = (words: string) => {
    setPanel(null);
    setDialog(null);
    setFlash({ kind: 'done', words });
    focus(IDS.flash);
  };

  /** Refused because the holder moved on (stale, the scope no longer as shown): read it again. */
  const movedOn = () => {
    setPanel(null);
    setDialog(null);
    setFlash({ kind: 'stale' });
    refetch();
    focus(IDS.flash);
  };

  // ---- Withdraw (f4; B7-10 f11) and Restore (f8) ----

  const startWithdraw = (scope: ScopeView) => {
    setPanel({
      kind: 'withdraw',
      scopeId: scope.scope.id,
      reason: '',
      error: null,
      expectedRev: holder.rev,
      unavailable: false,
    });
    setFlash(null);
    focus(IDS.reason(scope.scope.id));
  };
  const startRestore = (scope: ScopeView) => {
    setPanel({
      kind: 'restore',
      scopeId: scope.scope.id,
      expectedRev: holder.rev,
      unavailable: false,
    });
    setFlash(null);
    focus(IDS.restoreGo(scope.scope.id));
  };
  const cancelPanel = () => {
    if (!panel) return;
    setPanel(null);
    focus(panel.kind === 'withdraw' ? IDS.withdraw(panel.scopeId) : IDS.restore(panel.scopeId));
  };

  const refusedPanel = (answer: Result<unknown, ServiceError>, scopeId: string) => {
    if (answer.ok) return;
    const error = answer.error.kind === 'validation-failed' ? withdrawErrorOf(answer.error) : null;
    if (error) {
      setPanel((current) =>
        current?.kind === 'withdraw' && current.scopeId === scopeId
          ? { ...current, error }
          : current,
      );
      focus(IDS.reason(scopeId));
      return;
    }
    movedOn();
  };

  const saveWithdraw = (scope: ScopeView) => {
    if (panel?.kind !== 'withdraw' || panel.scopeId !== scope.scope.id || withdraw.busy) return;
    const { reason, expectedRev } = panel;
    const error = checkWithdrawReason(holder.id, scope.scope.id, reason, expectedRev);
    if (error) {
      setPanel({ ...panel, error, unavailable: false });
      focus(IDS.reason(scope.scope.id));
      return;
    }
    withdraw
      .run({
        holderId: holder.id,
        scopeId: scope.scope.id,
        reason,
        expectedRev,
      })
      .then(
        (answer) => {
          if (answer.ok) done(withdrawnFlash(naming(scope).short, holder.name));
          else refusedPanel(answer, scope.scope.id);
        },
        () =>
          setPanel((current) =>
            current?.scopeId === scope.scope.id ? { ...current, unavailable: true } : current,
          ),
      );
  };

  const saveRestore = (scope: ScopeView) => {
    if (panel?.kind !== 'restore' || panel.scopeId !== scope.scope.id || restore.busy) return;
    restore
      .run({ holderId: holder.id, scopeId: scope.scope.id, expectedRev: panel.expectedRev })
      .then(
        (answer) => {
          if (answer.ok) done(restoredFlash(naming(scope).short, holder.name));
          else refusedPanel(answer, scope.scope.id);
        },
        () =>
          setPanel((current) =>
            current?.scopeId === scope.scope.id ? { ...current, unavailable: true } : current,
          ),
      );
  };

  // ---- Assign scope (f5) ----

  const openAssign = () => {
    setPanel(null);
    setFlash(null);
    setDialog({
      kind: null,
      courseId: '',
      experimentId: '',
      errors: {},
      expectedRev: holder.rev,
      unavailable: false,
    });
  };

  const focusAssignError = (draft: AssignDraft, errors: AssignErrors) => {
    if (errors.kind || (errors.target && draft.kind === 'all')) focus(IDS.kindAll);
    else if (errors.target) focus(draft.kind === 'course' ? IDS.course : IDS.experiment);
  };

  /** “EEE ZC341”, “All experiments”, “Distillation Column” (B7-08 `item.v`). */
  const assignedWords = (draft: AssignDraft): string => {
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
    if (!dialog || assign.busy) return;
    const errors = checkAssign(holder.id, dialog, dialog.expectedRev);
    if (errors) {
      setDialog({ ...dialog, errors, unavailable: false });
      focusAssignError(dialog, errors);
      return;
    }
    const draft = dialog;
    assign.run(assignInput(holder.id, draft, draft.expectedRev)).then(
      (answer) => {
        if (answer.ok) {
          done(assignedFlash(holder.name, assignedWords(draft)));
          return;
        }
        if (answer.error.kind === 'validation-failed') {
          const refused = assignErrorsOf(answer.error);
          setDialog((current) => (current ? { ...current, errors: refused } : current));
          focusAssignError(draft, refused);
          return;
        }
        movedOn();
      },
      () => setDialog((current) => (current ? { ...current, unavailable: true } : current)),
    );
  };

  const choose = (kind: ScopeKind) =>
    setDialog((current) =>
      current ? { ...current, kind, errors: {}, unavailable: false } : current,
    );

  const history = historyLines(holder, named);
  const panelBusy = withdraw.busy || restore.busy;

  return (
    <>
      <PageHeader
        className="mt-2 mb-3"
        back={<BackLink href={ROLES_ADDRESS}>{HOLDER_PAGE.back}</BackLink>}
        overline={holderOverline(holder.role, holder.organisation)}
        title={holder.name}
        titleId={HOLDER_TITLE_ID}
        titleFocusTarget
        titleRef={titleRef}
      />
      <div className="xw-actions mb-4">
        <Button variant="primary" id={IDS.assign} onClick={openAssign}>
          {HOLDER_PAGE.assign}
        </Button>
      </div>
      <p ref={flashRef} id={IDS.flash} className="xa-save is-ok mb-3" role="status" tabIndex={-1}>
        {flash?.kind === 'done' ? (
          <>
            <Icon name="done" />
            <span>{flash.words}</span>
          </>
        ) : null}
      </p>
      {flash?.kind === 'stale' ? (
        <Notice
          ref={staleRef}
          tone="warn"
          role="alert"
          tabIndex={-1}
          className="mb-4"
          title={stateWords('SA-17.stale.title')}
        >
          {stateWords('SA-17.stale.line')}
        </Notice>
      ) : null}
      {active.length === 0 ? (
        <div className="mb-4">
          <Notice tone="warn" title={HOLDER_PAGE.noScopeTitle}>
            {HOLDER_PAGE.noScopeLine}
          </Notice>
        </div>
      ) : null}
      <div className="flex flex-col gap-5">
        <Section title={HOLDER_PAGE.canActOn}>
          <SectionBody>
            <p className="xr-body mt-0 mb-3 text-ink">{effectWords(view)}</p>
            {active.length > 0 ? (
              <ul className="xg-los" aria-label={HOLDER_PAGE.scopeListLabel}>
                {active.map((scope) => {
                  const words = naming(scope).full;
                  const open = panel?.kind === 'withdraw' && panel.scopeId === scope.scope.id;
                  return (
                    <ScopeRow
                      key={scope.scope.id}
                      title={words}
                      meta={sinceWords(dayMonthYear(scope.scope.assignedAt))}
                      action={
                        open ? null : (
                          <Button
                            variant="text"
                            className="xg-del"
                            id={IDS.withdraw(scope.scope.id)}
                            aria-label={withdrawLabel(words)}
                            onClick={() => startWithdraw(scope)}
                          >
                            {HOLDER_PAGE.withdraw}
                          </Button>
                        )
                      }
                    >
                      {open ? (
                        <div className="xw-inline-panel flex-[1_1_100%]">
                          <Field
                            id={IDS.reason(scope.scope.id)}
                            label={reasonLabel(words)}
                            hint={HOLDER_PAGE.reasonHint}
                            error={panel.error ?? undefined}
                          >
                            <Textarea
                              className="min-h-[80px]"
                              value={panel.reason}
                              onChange={(event) => {
                                const reason = event.target.value;
                                setPanel((current) =>
                                  current?.kind === 'withdraw'
                                    ? { ...current, reason, error: null, unavailable: false }
                                    : current,
                                );
                              }}
                            />
                          </Field>
                          <div className="xw-actions mt-3">
                            <Button
                              variant="danger"
                              size="sm"
                              busy={panelBusy}
                              busyLabel={HOLDER_PAGE.withdrawConfirm}
                              onClick={() => saveWithdraw(scope)}
                            >
                              {HOLDER_PAGE.withdrawConfirm}
                            </Button>
                            <Button variant="text" onClick={cancelPanel}>
                              {HOLDER_PAGE.cancel}
                            </Button>
                          </div>
                          {panel.unavailable ? (
                            <Notice tone="err" className="mt-3">
                              {stateWords('SA-17.unavailable')}
                            </Notice>
                          ) : null}
                        </div>
                      ) : null}
                    </ScopeRow>
                  );
                })}
              </ul>
            ) : null}
            {withdrawn.length > 0 ? (
              <>
                <h3 className="xr-h3 mt-5 mb-2">{HOLDER_PAGE.withdrawnHeading}</h3>
                <ul className="xg-los" aria-label={HOLDER_PAGE.withdrawnListLabel}>
                  {withdrawn.map((scope) => {
                    const words = naming(scope).full;
                    const open = panel?.kind === 'restore' && panel.scopeId === scope.scope.id;
                    const withdrawal = scope.scope.withdrawal!;
                    return (
                      <ScopeRow
                        key={scope.scope.id}
                        title={words}
                        meta={withdrawnWords(dayMonthYear(withdrawal.at), withdrawal.reason)}
                        action={
                          open ? null : (
                            <Button
                              variant="text"
                              id={IDS.restore(scope.scope.id)}
                              aria-label={restoreLabel(words)}
                              onClick={() => startRestore(scope)}
                            >
                              {HOLDER_PAGE.restore}
                            </Button>
                          )
                        }
                      >
                        {open ? (
                          <div className="xw-inline-panel flex-[1_1_100%]">
                            <p className="xr-body mt-0 mb-3">{restoreQuestion(words)}</p>
                            <div className="xw-actions">
                              <Button
                                variant="primary"
                                size="sm"
                                id={IDS.restoreGo(scope.scope.id)}
                                busy={panelBusy}
                                busyLabel={HOLDER_PAGE.restoreConfirm}
                                onClick={() => saveRestore(scope)}
                              >
                                {HOLDER_PAGE.restoreConfirm}
                              </Button>
                              <Button variant="text" onClick={cancelPanel}>
                                {HOLDER_PAGE.cancel}
                              </Button>
                            </div>
                            {panel.unavailable ? (
                              <Notice tone="err" className="mt-3">
                                {stateWords('SA-17.unavailable')}
                              </Notice>
                            ) : null}
                          </div>
                        ) : null}
                      </ScopeRow>
                    );
                  })}
                </ul>
              </>
            ) : null}
          </SectionBody>
        </Section>
        <Section title={HOLDER_PAGE.holder}>
          <SectionBody>
            <dl className="xl-kv xv-kv">
              <dt>{HOLDER_PAGE.keys.role}</dt>
              <dd>{ROLE_WORDS[holder.role]}</dd>
              <dt>{HOLDER_PAGE.keys.organisation}</dt>
              <dd>{holder.organisation}</dd>
              <dt>{HOLDER_PAGE.keys.workEmail}</dt>
              <dd>{holder.workEmail}</dd>
              <dt>{HOLDER_PAGE.keys.registered}</dt>
              <dd>
                {registeredByWords(
                  dayMonthYear(holder.registeredAt),
                  actorName(holder.registeredBy),
                )}
              </dd>
            </dl>
            <p className="xl-meta mt-3 mb-0">{HOLDER_PAGE.signInNote}</p>
          </SectionBody>
        </Section>
        <Section title={HOLDER_PAGE.history} meta={HOLDER_PAGE.historyMeta}>
          <SectionBody>
            <Timeline
              markLatest={false}
              events={history.map((line) => ({
                id: line.id,
                what: line.what,
                when: line.when,
                ...(line.note ? { note: line.note } : {}),
              }))}
            />
          </SectionBody>
        </Section>
      </div>
      <EditDialog
        open={dialog !== null}
        align="start"
        idPrefix="assign-scope"
        returnFocusFallback={titleRef}
        title={assignTitle(holder.name)}
        effect={assignHelp(holder.name, holder.role)}
        confirmLabel={ASSIGN_DIALOG.confirm}
        cancelLabel={ASSIGN_DIALOG.cancel}
        busy={assign.busy}
        busyLabel={ASSIGN_DIALOG.busy}
        onConfirm={confirmAssign}
        onCancel={() => setDialog(null)}
      >
        <RadioGroup
          id="assign-kind"
          className="mt-[14px]"
          legend={ASSIGN_DIALOG.legend}
          legendClass="xr-label"
          value={dialog?.kind ?? null}
          onValueChange={(value) => choose(value as ScopeKind)}
          error={dialog?.errors.kind ?? (dialog?.kind === 'all' ? dialog.errors.target : undefined)}
        >
          <ChoiceList>
            <ChoiceCard
              value="all"
              id={IDS.kindAll}
              title={ASSIGN_DIALOG.choices.all.title}
              sub={ASSIGN_DIALOG.choices.all.sub}
            />
            <ChoiceCard
              value="course"
              id="assign-kind-course"
              title={ASSIGN_DIALOG.choices.course.title}
              sub={ASSIGN_DIALOG.choices.course.sub}
            />
            <ChoiceCard
              value="experiment"
              id="assign-kind-experiment"
              title={ASSIGN_DIALOG.choices.experiment.title}
              sub={ASSIGN_DIALOG.choices.experiment.sub}
            />
          </ChoiceList>
        </RadioGroup>
        {dialog?.kind === 'course' ? (
          <Field
            id={IDS.course}
            className="mt-[14px]"
            label={ASSIGN_DIALOG.course}
            error={dialog.errors.target}
          >
            <Select
              value={dialog.courseId}
              onChange={(event) => {
                const courseId = event.target.value;
                setDialog((current) =>
                  current ? { ...current, courseId, errors: {}, unavailable: false } : current,
                );
              }}
              options={[{ value: '', label: ASSIGN_DIALOG.chooseCourse }, ...choices.courses]}
            />
          </Field>
        ) : null}
        {dialog?.kind === 'experiment' ? (
          <Field
            id={IDS.experiment}
            className="mt-[14px]"
            label={ASSIGN_DIALOG.experiment}
            error={dialog.errors.target}
          >
            <Select
              value={dialog.experimentId}
              onChange={(event) => {
                const experimentId = event.target.value;
                setDialog((current) =>
                  current ? { ...current, experimentId, errors: {}, unavailable: false } : current,
                );
              }}
              options={[
                { value: '', label: ASSIGN_DIALOG.chooseExperiment },
                ...choices.experiments,
              ]}
            />
          </Field>
        ) : null}
        {dialog?.unavailable ? (
          <Notice tone="err" className="mt-3">
            {stateWords('SA-17.unavailable')}
          </Notice>
        ) : null}
      </EditDialog>
    </>
  );
}

/** One scope (`li.xg-lo`): what it names and since when, its action, and its inline panel. */
function ScopeRow({
  title,
  meta,
  action,
  children,
}: {
  readonly title: string;
  readonly meta: string;
  readonly action: ReactNode;
  readonly children?: ReactNode;
}) {
  return (
    <li className="xg-lo items-start">
      <div className="xg-lo-main flex-col gap-[2px]">
        <span className="font-[700] text-ink">{title}</span>
        <span className="xr-meta">{meta}</span>
      </div>
      <div className="xg-lo-acts">{action}</div>
      {children}
    </li>
  );
}
