'use client';

import type { DecisionPage, PlanEffect, Result, ServiceError } from '@xr/contracts/draft';
import { FORMAT_META, type Technology } from '@xr/domain';
import { Link } from '@xr/ui';
import {
  AskList,
  AskRow,
  Breadcrumbs,
  ButtonLink,
  ButtonRow,
  ChangeSummary,
  CheckGroup,
  ChoiceGroup,
  ConfirmDialog,
  CourseCode,
  DecisionOutcome,
  DecisionPanel,
  DefinitionList,
  DetailLayout,
  ErrorSummary,
  type ErrorSummaryItem,
  EventSteps,
  FactStrip,
  Field,
  FieldError,
  FORMAT_ORDER,
  FormatCells,
  FormatKey,
  GoButton,
  LockedValue,
  MetaSeparator,
  Notice,
  PageHead,
  PendingHint,
  Quote,
  RecordLine,
  SectionNote,
  Select,
  SurfaceSection,
  Textarea,
  TextInput,
  Timeline,
} from '@xr/ui/v3';
import { type RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { weekdayDate } from '@/copy/dates';
import {
  CONFIRM_DIALOG,
  confirmTitle,
  contactPersonWords,
  DECISION_ACTIONS,
  DECISION_CHOICES,
  DECISION_PAGE,
  decidedBy,
  decidedMeta,
  type ExperimentName,
  FORMAT_WORDS,
  formatCellsLabel,
  FOUR_EVENTS,
  licencesRequestedWords,
  openInstitutionWords,
  PAUSED_BLOCK,
  REASON_FIELD,
  receivedWords,
  REQUEST_TYPE_WORDS,
  ROUTE_CHOICE,
  routeWords,
  SAME_NAME_BLOCK,
  SMALLER_SCOPE,
  TERM_OPTIONS,
  termWords,
  unnamedExperiment,
} from '@/copy/requests';
import { stateWords } from '@/copy/state-copy';
import { institutionAddress } from '@/nav/institutions';
import { decisionPlacement, REQUESTS_ADDRESS } from '@/nav/requests';
import { useRequestForDecision } from '@/queries/access-requests';
import { usePublishedCatalogue } from '@/queries/catalogue';
import { useSession } from '@/queries/session';
import { useCommand } from '@/queries/use-command';

import { useShellPage, useWorkspaceIdentity } from '../../shared/workspace-frame/shell-page';
import { SaRecordGuard } from '../shared/sa-record-guard';
import { RequestStatusPill } from '../shared/request-status';
import {
  type ApprovedTerm,
  confirmLines,
  createdByThisApproval,
  type DecisionChoice,
  type DecisionCommand,
  decisionCommand,
  type DecisionDraft,
  differencesOf,
  draftErrors,
  EMPTY_DRAFT,
  errorList,
  existingAccessWords,
  hasPanelErrors,
  historyLines,
  keptFormats,
  licencesValue,
  needsRoute,
  nextLine,
  panelErrorsOf,
  panelKindOf,
  type PanelErrors,
  pendingHint,
  requestedFormatsOf,
  sameNameLines,
  standRows,
  termValue,
} from './decision-view';

/** The decision column (`aside#dc-panel`) and its heading (`h2#dc-panel-h`), as the export names them. */
const PANEL_ID = 'dc-panel';
const PANEL_HEADING_ID = 'dc-panel-h';

/**
 * SA-03 Request decision — the V3 Refined B design (the owner-approved Super Admin export,
 * `sa-views-a.js` `V.decision`), at `/admin/requests/[requestId]`.
 *
 * - **Read**: `AccessRequestService.getRequestForDecision` — the request, the formats published
 *   now, the institution's existing access and where it stands — with the experiments named from
 *   the published catalogue. Opening the page changes nothing: review start stays the seeded or
 *   test-only fact (AD-14 / P1-04, owner interim).
 * - **The record**: the page head (the request's institution, its status, type and when it was
 *   received; "Go to decision" below 860 px), the facts, the organisation and contact person (the
 *   institution linked once its record exists), what they are asking for (requested against
 *   published formats), existing access (plans named by content and term, never by reference),
 *   the requester's message, the history and, until it is decided, the four separate events.
 * - **Decide**: Approve request · Approve a smaller scope (not for a renewal) · Request more
 *   information, each the port's command through `useCommand` with the request's revision from
 *   when the decision began (`expectedRev`), never a newer read. Internal or external is chosen
 *   only for a new institution, else shown locked. The panel runs its checks before a confirmation
 *   opens; the command checks again and its refusals are shown as they come: field errors in
 *   "Check your decision"; a request that moved on, a stale revision or a pause writes nothing and
 *   refetches the page, which then shows its current state, with focus on the panel's heading
 *   (state-copy `SA-03.moved-on`, the repo's existing wording: no notice). Approvals confirm first
 *   — what approving does now and what only later events do; when the approval's plan effect is
 *   open the words never claim a plan (`planEffect` policy-open) — and the confirmation sends
 *   exactly the decision it names. After a decision the panel shows where the request stands and
 *   focus moves to its heading. There is no Decline and no Mark paid.
 * - **Paused institution**: "This institution is paused" with no decision controls, and its "View
 *   institution" link.
 * - **An institution of the same name exists** (DP-09 interim safeguard, owner, 5 Nov 2026):
 *   approving would create a second record, so no decision control is offered — the warning names
 *   each existing institution with its route and an "Open <name>" link to its page (state-copy
 *   `SA-03.same-name`). The commands hold the same way (`policy-open` SEL-05).
 */
export function RequestDecision({ requestId }: { readonly requestId: string }) {
  const read = useRequestForDecision(requestId);
  const catalogue = usePublishedCatalogue();
  useShellPage(decisionPlacement(read.data?.ok ? read.data.value.request.institutionName : null));

  const names = useMemo(() => {
    const map = new Map<string, ExperimentName>();
    if (catalogue.data?.ok) {
      for (const entry of catalogue.data.value.entries) {
        map.set(entry.experimentId, {
          name: entry.name,
          code: entry.platformCode,
          course: entry.courseName,
        });
      }
    }
    return map;
  }, [catalogue.data]);
  const nameOf = (experimentId: string) =>
    names.get(experimentId) ?? unnamedExperiment(experimentId);

  return (
    <SaRecordGuard
      read={{
        data: catalogue.isPending ? undefined : read.data,
        isPending: read.isPending || catalogue.isPending,
        isError: read.isError || catalogue.isError,
        refetch: () => {
          void read.refetch();
          void catalogue.refetch();
        },
      }}
      loadingLabel={stateWords('SA-03.loading')}
      failedTitle={stateWords('SA-03.failed')}
    >
      {(page) => (
        <DecisionContent page={page} nameOf={nameOf} refetch={() => void read.refetch()} />
      )}
    </SaRecordGuard>
  );
}

function DecisionContent({
  page,
  nameOf,
  refetch,
}: {
  readonly page: DecisionPage;
  readonly nameOf: (experimentId: string) => ExperimentName;
  readonly refetch: () => void;
}) {
  const { request } = page;
  const session = useSession();
  const date = session.status === 'signed-in' ? weekdayDate(session.signedInAt) : undefined;
  const titleRef = useRef<HTMLHeadingElement>(null);
  const kind = panelKindOf(page);
  /** What the approval decided here did to the plans (the command's `planEffect`). */
  const [answered, setAnswered] = useState<PlanEffect | null>(null);
  // Once decided here, focus moves to the panel's heading. The command's dependent reads have
  // refetched before its answer arrives, so the decided panel is already on show; the heading
  // itself stays mounted whatever the panel shows.
  const focusTitle = () => {
    window.setTimeout(() => titleRef.current?.focus(), 0);
  };
  // Focus to the panel's heading when the open panel asks for it — after a refusal because the
  // request moved on, or when a change made elsewhere ends the panel while one of its controls has
  // focus. Moved in an effect: in the same commit the confirmation's own close has given focus back
  // to its trigger (a child's effect runs first), so this request wins.
  const [headingFocus, setHeadingFocus] = useState(0);
  useEffect(() => {
    if (headingFocus > 0) titleRef.current?.focus();
  }, [headingFocus]);
  const focusHeading = () => setHeadingFocus((count) => count + 1);

  // "Go to decision" (below 860 px of page width) moves focus to the panel's heading, as the
  // export's `goPanel` does — not only the view.
  useEffect(() => {
    const goPanel = (event: MouseEvent) => {
      const link =
        event.target instanceof Element ? event.target.closest(`a[href="#${PANEL_ID}"]`) : null;
      if (!link) return;
      event.preventDefault();
      document.getElementById(PANEL_ID)?.scrollIntoView({ block: 'start' });
      titleRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener('click', goPanel);
    return () => document.removeEventListener('click', goPanel);
  }, []);

  return (
    <>
      <PageHead
        variant="record"
        title={request.institutionName}
        titleFocusTarget
        date={date}
        eyebrow={DECISION_PAGE.eyebrow}
        breadcrumbs={
          <Breadcrumbs
            levels={[{ label: DECISION_PAGE.back, href: REQUESTS_ADDRESS }]}
            current={request.institutionName}
          />
        }
        meta={
          <>
            <RequestStatusPill status={request.status} size="lg" />
            <span>{REQUEST_TYPE_WORDS[request.type]}</span>
            <MetaSeparator />
            <span>{receivedWords(request.receivedAt)}</span>
          </>
        }
        goTo={{ label: DECISION_PAGE.goTo, targetId: PANEL_ID, focusId: PANEL_HEADING_ID }}
      />
      <DetailLayout
        asideId={PANEL_ID}
        asideLabelledBy={PANEL_HEADING_ID}
        main={<DecisionDetails page={page} nameOf={nameOf} />}
        aside={
          <DecisionPanel
            title={DECISION_PAGE.panelTitle}
            titleId={PANEL_HEADING_ID}
            titleRef={titleRef}
          >
            {kind === 'open' ? (
              <OpenPanel
                page={page}
                titleRef={titleRef}
                onDecided={(effect) => {
                  setAnswered(effect);
                  focusTitle();
                }}
                onReread={refetch}
                onMovedOn={() => {
                  refetch();
                  focusHeading();
                }}
                onFocusLost={focusHeading}
              />
            ) : kind === 'same-name' ? (
              <Notice
                tone="warn"
                role="status"
                title={SAME_NAME_BLOCK.title}
                actions={page.sameNameInstitutions.map((existing) => (
                  <ButtonLink
                    key={existing.institutionId}
                    href={institutionAddress(existing.institutionId)}
                  >
                    {openInstitutionWords(existing.name)}
                  </ButtonLink>
                ))}
              >
                {sameNameLines(page).join(' ')}
              </Notice>
            ) : kind === 'blocked' ? (
              <Notice
                tone="paused"
                role="status"
                title={PAUSED_BLOCK.title}
                actions={
                  request.institutionId ? (
                    <ButtonLink href={institutionAddress(request.institutionId)}>
                      {PAUSED_BLOCK.viewInstitution}
                    </ButtonLink>
                  ) : undefined
                }
              >
                {PAUSED_BLOCK.line}
              </Notice>
            ) : (
              <DecidedPanel page={page} answered={answered} />
            )}
          </DecisionPanel>
        }
      />
    </>
  );
}

// ---- the record (`rk-mainsheet`) ----

/** The format cells of one experiment: requested (on), published only (pub), not published. */
function AskedFormats({
  requested,
  published,
}: {
  readonly requested: readonly Technology[];
  readonly published: readonly Technology[];
}) {
  return (
    <FormatCells
      variant="strip"
      label={formatCellsLabel(requested, published)}
      cells={FORMAT_ORDER.map((code) => {
        const format = code.toLowerCase() as Technology;
        const state = requested.includes(format)
          ? 'on'
          : published.includes(format)
            ? 'pub'
            : 'none';
        return { format: code, state, words: FORMAT_WORDS.cell[state] };
      })}
    />
  );
}

function DecisionDetails({
  page,
  nameOf,
}: {
  readonly page: DecisionPage;
  readonly nameOf: (experimentId: string) => ExperimentName;
}) {
  const { request } = page;
  const decided = request.status !== 'under-review';
  const institutionId = request.institutionId ?? page.existingAccess?.institutionId ?? null;
  return (
    <>
      <FactStrip
        facts={[
          { term: DECISION_PAGE.facts.experiments, value: String(request.items.length) },
          {
            term: DECISION_PAGE.facts.licences,
            value: licencesRequestedWords(request.type, request.licencesRequested),
          },
          { term: DECISION_PAGE.facts.term, value: termWords(request.term) },
          {
            term: DECISION_PAGE.facts.route,
            value: routeWords(page.routeCommitted),
            quiet: page.routeCommitted === null,
          },
        ]}
      />
      <SurfaceSection title={DECISION_PAGE.organisation} titleId="dc-org">
        <DefinitionList
          items={[
            {
              term: DECISION_PAGE.institution,
              value:
                institutionId && page.whereItStands.institutionRecord === 'created' ? (
                  <Link href={institutionAddress(institutionId)}>{request.institutionName}</Link>
                ) : (
                  request.institutionName
                ),
            },
            { term: DECISION_PAGE.contactPerson, value: request.contact.person },
            { term: DECISION_PAGE.email, value: request.contact.email },
            {
              term: DECISION_PAGE.phone,
              value: request.contact.phone ?? DECISION_PAGE.phoneNotGiven,
            },
          ]}
        />
      </SurfaceSection>
      <SurfaceSection
        title={DECISION_PAGE.asking}
        titleId="dc-ask"
        aside={
          <FormatKey
            items={(['on', 'pub', 'none'] as const).map((state) => ({
              state,
              words: FORMAT_WORDS.key[state],
            }))}
          />
        }
      >
        <AskList>
          {request.items.map((item) => {
            const experiment = nameOf(item.experimentId);
            return (
              <AskRow
                key={item.experimentId}
                title={experiment.name}
                course={
                  experiment.code || experiment.course ? (
                    <>
                      {experiment.code ? <CourseCode code={experiment.code} /> : null}
                      {experiment.course ? <span>{experiment.course}</span> : null}
                    </>
                  ) : undefined
                }
                formats={
                  <AskedFormats
                    requested={item.formats}
                    published={page.publishedFormats[item.experimentId] ?? []}
                  />
                }
              />
            );
          })}
        </AskList>
      </SurfaceSection>
      <SurfaceSection title={DECISION_PAGE.existing} titleId="dc-exist">
        <RecordLine>
          {existingAccessWords(page, (experimentId) => nameOf(experimentId).name)}
        </RecordLine>
      </SurfaceSection>
      {request.message ? (
        <SurfaceSection title={DECISION_PAGE.message} titleId="dc-msg">
          <Quote by={contactPersonWords(request.contact.person)}>{request.message}</Quote>
        </SurfaceSection>
      ) : null}
      <SurfaceSection title={DECISION_PAGE.history} titleId="dc-hist">
        <Timeline
          events={historyLines(page).map((line) => ({
            what: line.what,
            when: line.when,
            ...(line.note ? { note: line.note } : {}),
          }))}
        />
      </SurfaceSection>
      {decided ? null : (
        <SurfaceSection
          title={FOUR_EVENTS.title}
          titleId="dc-events"
          aside={<SectionNote>{FOUR_EVENTS.note}</SectionNote>}
        >
          <EventSteps
            steps={FOUR_EVENTS.steps.map((step) => ({ title: step.what, description: step.line }))}
            note={FOUR_EVENTS.footnote}
          />
        </SurfaceSection>
      )}
    </>
  );
}

// ---- the open panel ----

/**
 * An open confirmation: the page and the decision as they stood when it opened, and the command
 * built from them — what the confirmation names is what it sends.
 */
interface Confirmation {
  readonly page: DecisionPage;
  readonly draft: DecisionDraft;
  readonly command: DecisionCommand;
}

/** Where each error of "Check your decision" sends focus (the controls' ids). */
const ERROR_TARGET: Readonly<Record<Exclude<keyof PanelErrors, 'undrawn'>, string>> = {
  choice: 'decision',
  route: 'decision-route',
  formats: 'decision-format',
  licences: 'decision-licences',
  term: 'decision-term',
  change: 'decision-licences',
  reason: 'decision-reason',
};

/** The summary's linked lines, in the panel's order. */
function summaryItems(errors: PanelErrors): readonly ErrorSummaryItem[] {
  return (['choice', 'route', 'formats', 'licences', 'term', 'change', 'reason'] as const).flatMap(
    (key) => {
      const message = errors[key];
      return message ? [{ fieldId: ERROR_TARGET[key], summaryText: message }] : [];
    },
  );
}

function OpenPanel({
  page,
  titleRef,
  onDecided,
  onReread,
  onMovedOn,
  onFocusLost,
}: {
  readonly page: DecisionPage;
  /** The panel's heading: where focus goes when the confirmation's trigger is gone on close. */
  readonly titleRef: RefObject<HTMLHeadingElement | null>;
  /** A decision was recorded (with what it did to the plans): the decided panel will show. */
  readonly onDecided: (effect: PlanEffect | null) => void;
  /** Read the page again, focus staying where it is (an open policy: nothing to show). */
  readonly onReread: () => void;
  /** The request moved on, or its revision is stale: read it again, focus on the heading (P1-21). */
  readonly onMovedOn: () => void;
  /** The panel is going while one of its controls has focus: focus on the heading instead. */
  readonly onFocusLost: () => void;
}) {
  const { request } = page;
  const [draft, setDraft] = useState<DecisionDraft>(EMPTY_DRAFT);
  /**
   * The request's revision when this decision began — the first change to the form, or the press
   * that sends it or opens its confirmation — kept through the confirmation and never replaced by
   * a newer read. A refusal because the request moved on releases it: the next attempt begins from
   * the request as the page then shows it.
   */
  const [basis, setBasis] = useState<number | null>(null);
  const [errors, setErrors] = useState<PanelErrors>({});
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const errorsRef = useRef<HTMLDivElement>(null);
  /** "Check your decision" takes focus once it has rendered. */
  const focusErrors = useRef(false);
  const approve = useCommand((ports) => ports.accessRequests.approveRequest);
  const smaller = useCommand((ports) => ports.accessRequests.approveSmallerScope);
  const information = useCommand((ports) => ports.accessRequests.requestMoreInformation);
  const busy = approve.busy || smaller.busy || information.busy;
  const renewal = request.type === 'renewal';

  useEffect(() => {
    if (!focusErrors.current) return;
    focusErrors.current = false;
    errorsRef.current?.focus();
  });

  // When the panel goes (a change made elsewhere ended it), its controls go with it: if one of
  // them has focus — the panel's own heading and frame excepted — the page asks for focus on the
  // heading. A layout cleanup runs before the panel's elements leave the document.
  const lost = useRef(onFocusLost);
  useLayoutEffect(() => {
    lost.current = onFocusLost;
  });
  useLayoutEffect(
    () => () => {
      const frame = document.getElementById(PANEL_ID);
      const active = document.activeElement;
      if (
        frame &&
        active &&
        active !== frame &&
        active !== titleRef.current &&
        frame.contains(active)
      )
        lost.current();
    },
    [titleRef],
  );

  const update = (patch: Partial<DecisionDraft>, clear: readonly (keyof PanelErrors)[] = []) => {
    setBasis((current) => current ?? request.rev);
    setDraft((current) => ({ ...current, ...patch }));
    if (clear.length > 0) {
      setErrors((current) => {
        const next: { -readonly [Key in keyof PanelErrors]: PanelErrors[Key] } = { ...current };
        for (const key of clear) delete next[key];
        if (next.undrawn) next.undrawn = next.undrawn.filter((place) => !clear.includes(place));
        return next;
      });
    }
  };

  const showErrors = (next: PanelErrors) => {
    setErrors(next);
    focusErrors.current = true;
  };

  /** What a refusal of a command means for the panel (refusals are values, ADR-0008). */
  const handleAnswer = (answer: Result<unknown, ServiceError>) => {
    setConfirmation(null);
    if (answer.ok) {
      const value = answer.value;
      onDecided(
        value && typeof value === 'object' && 'planEffect' in value
          ? (value as { readonly planEffect: PlanEffect }).planEffect
          : null,
      );
      return;
    }
    const error = answer.error;
    if (error.kind === 'validation-failed') {
      showErrors(panelErrorsOf(error.fieldErrors));
      return;
    }
    // A policy that is still open (T-03, REQ-19) writes nothing and has no drawn state here: the
    // page is read again and the decision stays as it is (state-copy `SA-03.policy-open`).
    if (error.kind === 'policy-open') {
      onReread();
      return;
    }
    // Moved on, stale, paused, not adjustable, not found: nothing was written; the page is read
    // again and shows the request's current state, and the decision's revision is released
    // (state-copy `SA-03.moved-on`).
    setBasis(null);
    onMovedOn();
  };

  /** Sends a command; `unavailable` (thrown) changes nothing and keeps the decision as it is. */
  const send = (command: DecisionCommand) => {
    const sent =
      command.choice === 'approve'
        ? approve.run(command.input)
        : command.choice === 'smaller'
          ? smaller.run(command.input)
          : information.run(command.input);
    sent.then(handleAnswer, () => setConfirmation(null));
  };

  const go = () => {
    const found = draftErrors(page, draft);
    if (errorList(found).length > 0) {
      showErrors(found);
      return;
    }
    setErrors({});
    const expectedRev = basis ?? request.rev;
    setBasis(expectedRev);
    const command = decisionCommand(page, draft, expectedRev);
    if (!command) return;
    // A request for information is sent as it is; an approval confirms first.
    if (command.choice === 'info') send(command);
    else setConfirmation({ page, draft, command });
  };

  const pending = pendingHint(page, draft);
  const differences = draft.choice === 'smaller' ? differencesOf(page, draft) : [];
  const labelOf = (choice: DecisionChoice | null) =>
    choice === 'info'
      ? DECISION_ACTIONS.info
      : choice === 'smaller'
        ? DECISION_ACTIONS.smaller
        : DECISION_ACTIONS.approve;
  const goLabel = labelOf(draft.choice);
  // What the dialog names: the confirmation's own page and decision while it is open (the page
  // may be read again meanwhile); closed, the panel's, as before.
  const named = confirmation ?? { page, draft };
  const lines = confirmLines(
    named.page,
    named.draft,
    named.page.routeCommitted ?? named.draft.route,
  );
  const approving = draft.choice === 'approve' || draft.choice === 'smaller';

  return (
    <>
      {hasPanelErrors(errors) ? (
        <ErrorSummary
          ref={errorsRef}
          id="dc-errs"
          title={DECISION_PAGE.checkTitle}
          items={summaryItems(errors)}
          alwaysShown
          autoFocus={false}
        />
      ) : null}
      <ChoiceGroup
        legend={DECISION_PAGE.decisionLegend}
        id="decision"
        name="dc-choice"
        value={draft.choice}
        error={errors.choice}
        onChange={(value) => {
          update({ choice: value });
          setErrors({});
        }}
        options={[
          {
            value: 'approve' as const,
            title: DECISION_CHOICES.approve.title,
            description: DECISION_CHOICES.approve.sub,
          },
          {
            value: 'smaller' as const,
            title: DECISION_CHOICES.smaller.title,
            description: renewal ? DECISION_CHOICES.smaller.renewal : DECISION_CHOICES.smaller.sub,
            unavailable: renewal,
          },
          {
            value: 'info' as const,
            title: DECISION_CHOICES.info.title,
            description: DECISION_CHOICES.info.sub,
          },
        ]}
      />
      {needsRoute(page, draft) ? (
        <ChoiceGroup
          legend={ROUTE_CHOICE.legend}
          legendHint={ROUTE_CHOICE.hint}
          id="decision-route"
          name="dc-route"
          value={draft.route}
          error={errors.route}
          onChange={(value) => update({ route: value }, ['route'])}
          options={[
            {
              value: 'internal' as const,
              title: ROUTE_CHOICE.internal.title,
              description: ROUTE_CHOICE.internal.sub,
            },
            {
              value: 'external' as const,
              title: ROUTE_CHOICE.external.title,
              description: ROUTE_CHOICE.external.sub,
            },
          ]}
        />
      ) : null}
      {approving && page.routeCommitted ? (
        <LockedValue>
          {ROUTE_CHOICE.lockedBefore}
          <b>{routeWords(page.routeCommitted)}</b>
          {ROUTE_CHOICE.lockedAfter}
        </LockedValue>
      ) : null}
      {draft.choice === 'smaller' ? (
        <SmallerScopeFields
          page={page}
          draft={draft}
          errors={errors}
          differences={differences}
          update={update}
        />
      ) : null}
      {draft.choice === 'smaller' || draft.choice === 'info' ? (
        <Field
          id="decision-reason"
          label={draft.choice === 'info' ? REASON_FIELD.info : REASON_FIELD.smaller}
          hint={REASON_FIELD.hint}
          error={errors.reason}
        >
          <Textarea
            value={draft.reason}
            onChange={(event) => update({ reason: event.target.value }, ['reason'])}
          />
        </Field>
      ) : null}
      {pending ? <PendingHint>{pending}</PendingHint> : null}
      <GoButton busy={information.busy} busyLabel={goLabel} onClick={go}>
        {goLabel}
      </GoButton>
      <ConfirmDialog
        open={confirmation !== null}
        idPrefix="dlg"
        title={confirmTitle(
          named.draft.choice === 'smaller',
          named.page.request.type === 'renewal',
          named.page.request.institutionName,
        )}
        description={CONFIRM_DIALOG.description}
        groups={[
          { kind: 'now', title: CONFIRM_DIALOG.now, items: lines.now },
          { kind: 'later', title: CONFIRM_DIALOG.later, items: lines.later },
        ]}
        confirmLabel={labelOf(named.draft.choice)}
        busy={busy}
        busyLabel={labelOf(named.draft.choice)}
        returnFocusFallback={titleRef}
        onConfirm={() => {
          if (confirmation) send(confirmation.command);
        }}
        onCancel={() => setConfirmation(null)}
      />
    </>
  );
}

/** Approve a smaller scope: formats, licences, term, and the difference. */
function SmallerScopeFields({
  page,
  draft,
  errors,
  differences,
  update,
}: {
  readonly page: DecisionPage;
  readonly draft: DecisionDraft;
  readonly errors: PanelErrors;
  readonly differences: readonly string[];
  readonly update: (patch: Partial<DecisionDraft>, clear?: readonly (keyof PanelErrors)[]) => void;
}) {
  const requested = requestedFormatsOf(page);
  const kept = keptFormats(page, draft);
  return (
    <>
      <CheckGroup
        legend={SMALLER_SCOPE.formatsLegend}
        id="decision-format"
        values={kept}
        error={errors.formats}
        onChange={(next) => update({ formats: next }, ['formats', 'change'])}
        options={requested.map((format) => ({
          value: format,
          label: FORMAT_META[format].code,
          detail: FORMAT_META[format].name,
        }))}
      />
      <Field
        id="decision-licences"
        label={
          page.request.type === 'additional-licences'
            ? SMALLER_SCOPE.additionalLicencesLabel
            : SMALLER_SCOPE.licencesLabel
        }
        error={errors.licences}
      >
        <TextInput
          inputMode="numeric"
          invalid={errors.undrawn?.includes('licences')}
          value={licencesValue(page, draft)}
          onChange={(event) => update({ licences: event.target.value }, ['licences', 'change'])}
        />
      </Field>
      <Field id="decision-term" label={SMALLER_SCOPE.termLabel} error={errors.term}>
        <Select
          options={TERM_OPTIONS}
          invalid={errors.undrawn?.includes('term')}
          value={termValue(page, draft)}
          onChange={(event) =>
            update({ term: event.target.value as ApprovedTerm }, ['term', 'change'])
          }
        />
      </Field>
      {differences.length > 0 ? (
        <ChangeSummary title={SMALLER_SCOPE.differentTitle} lines={differences} />
      ) : null}
      {errors.change ? <FieldError>{errors.change}</FieldError> : null}
    </>
  );
}

// ---- the decided panel (`doneHtml`) ----

function DecidedPanel({
  page,
  answered,
}: {
  readonly page: DecisionPage;
  readonly answered: PlanEffect | null;
}) {
  const { personId } = useWorkspaceIdentity();
  const { request } = page;
  const information = request.status === 'information-requested';
  const meta =
    information && request.informationRequest
      ? decidedMeta(
          { kind: 'information', at: request.informationRequest.at },
          decidedBy(request.informationRequest.by, personId),
        )
      : request.decision
        ? decidedMeta(
            { kind: 'approval', at: request.decision.at, route: request.decision.route },
            decidedBy(request.decision.by, personId),
          )
        : undefined;
  const institutionId = request.institutionId ?? page.existingAccess?.institutionId ?? null;
  const created = createdByThisApproval(page) && institutionId !== null;
  return (
    <DecisionOutcome
      id="dc-done"
      status={<RequestStatusPill status={request.status} size="lg" />}
      meta={meta}
      stand={standRows(page).map((row) => ({ term: row.key, value: row.value }))}
      next={nextLine(page, answered) ?? undefined}
      action={
        <ButtonRow>
          <ButtonLink href={REQUESTS_ADDRESS}>{DECISION_PAGE.backToRequests}</ButtonLink>
          {created ? (
            <ButtonLink variant="ghost" href={institutionAddress(institutionId)}>
              {DECISION_PAGE.openInstitution}
            </ButtonLink>
          ) : null}
        </ButtonRow>
      }
    />
  );
}
