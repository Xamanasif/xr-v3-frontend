'use client';

import type { DecisionPage, Result, ServiceError } from '@xr/contracts/draft';
import type { Technology } from '@xr/domain';
import {
  BackLink,
  Button,
  ChoiceCard,
  ChoiceList,
  ConfirmDialog,
  DecisionLayout,
  Field,
  FieldError,
  Icon,
  JumpLink,
  Link,
  Notice,
  PageContent,
  PageHeader,
  RadioGroup,
  Section,
  SectionBody,
  Select,
  Textarea,
  TextInput,
  Timeline,
} from '@xr/ui';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import {
  CONFIRM_LINES,
  confirmTitle,
  courseLine,
  DECISION_ACTIONS,
  DECISION_CHOICES,
  DECISION_PAGE,
  decidedBy,
  decidedMeta,
  type ExperimentName,
  formatList,
  FOUR_EVENTS,
  licencesRequestedWords,
  PAUSED_BLOCK,
  REASON_FIELD,
  receivedWords,
  REQUEST_TYPE_WORDS,
  ROUTE_CHOICE,
  routeWords,
  SMALLER_SCOPE,
  STAND,
  TERM_OPTIONS,
  termWords,
  unnamedExperiment,
} from '@/copy/requests';
import { stateWords } from '@/copy/state-copy';
import { decisionPlacement, REQUESTS_ADDRESS } from '@/nav/requests';
import { useRequestForDecision } from '@/queries/access-requests';
import { usePublishedCatalogue } from '@/queries/catalogue';
import { useCommand } from '@/queries/use-command';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage, useWorkspaceIdentity } from '../../shared/workspace-frame/shell-page';
import { RequestStatusPill } from '../shared/request-status';
import {
  type ApprovedTerm,
  type DecisionChoice,
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
  smallerScopeItems,
  standRows,
  termValue,
} from './decision-view';

const PANEL_ID = 'decision';

/**
 * SA-03 Request decision — board B1-11 (AR-4 decision page), at `/admin/requests/[requestId]`.
 *
 * - **Read**: `AccessRequestService.getRequestForDecision` — the request, the formats published
 *   now, the institution's existing access and where it stands — with the experiments named from
 *   the published catalogue. Opening the page changes nothing: review start stays the seeded or
 *   test-only fact (AD-14 / P1-04, owner interim).
 * - **Decide**: Approve request · Approve a smaller scope · Request more information, each the
 *   port's command through `useCommand` with the request's revision (`expectedRev`). The panel runs
 *   B1-11's drawn checks before a confirmation opens; the command checks again and its refusals
 *   are shown as they come: field errors in "Check your decision"; a request that moved on, a
 *   stale revision or a pause refetches the page, which then shows its current drawn state (P1-21
 *   interim). Approvals confirm first (DL-1, "what approving does — and does not do"); a request
 *   for information does not (B1-11 f6 → f12). After a decision the panel shows the decided state
 *   and focus moves to its heading.
 * - **Panels** (B1-11 `open`, `blocked`, `done`): open while under review; "This institution is
 *   paused" with no decision controls while its institution is paused (f14); decided otherwise.
 *   A renewal's smaller scope is shown unavailable with its reason (f13; T-07, D8).
 * - **Layout**: details ~72 % and the sticky decision panel ~28 % from 860 px of content; below,
 *   the panel follows the details and "Go to decision" at the top moves focus to it (VD-05: B1-11
 *   draws the sticky panel, owner-approved for SA-03).
 */
export function RequestDecision({ requestId }: { readonly requestId: string }) {
  const read = useRequestForDecision(requestId);
  const catalogue = usePublishedCatalogue();
  const reference = read.data?.ok ? read.data.value.request.id : requestId;
  useShellPage(decisionPlacement(reference));

  const names = useMemo(() => {
    const map = new Map<string, ExperimentName>();
    if (catalogue.data?.ok) {
      for (const entry of catalogue.data.value.entries) {
        map.set(entry.experimentId, {
          name: entry.name,
          course: courseLine(entry.platformCode, entry.courseName),
        });
      }
    }
    return map;
  }, [catalogue.data]);
  const nameOf = (experimentId: string) =>
    names.get(experimentId) ?? unnamedExperiment(experimentId);

  return (
    <PageContent wrap="wide">
      <RecordGuard
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
        failed={{ title: stateWords('SA-03.failed'), line: stateWords('SA-03.failed.line') }}
      >
        {(page) => (
          <DecisionContent page={page} nameOf={nameOf} refetch={() => void read.refetch()} />
        )}
      </RecordGuard>
    </PageContent>
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
  const titleRef = useRef<HTMLHeadingElement>(null);
  const kind = panelKindOf(page);
  // Once decided here, focus moves to the panel's heading (B1-11 `focus(pid + '-dp')`). The
  // command's dependent reads have refetched before its answer arrives, so the decided panel is
  // already on show; the heading itself stays mounted whatever the panel shows.
  const focusTitle = () => {
    window.setTimeout(() => titleRef.current?.focus(), 0);
  };

  return (
    <>
      <PageHeader
        className="mt-3 mb-4"
        back={<BackLink href={REQUESTS_ADDRESS}>{DECISION_PAGE.back}</BackLink>}
        overline={
          <>
            {DECISION_PAGE.overline} · <span className="xr-id">{request.id}</span>
          </>
        }
        title={request.institutionName}
        meta={
          <>
            <RequestStatusPill status={request.status} />
            <span>{receivedWords(request.receivedAt)}</span>
            <span>{REQUEST_TYPE_WORDS[request.type]}</span>
          </>
        }
      />
      <JumpLink targetId={PANEL_ID} className="mb-4" />
      <DecisionLayout
        jump={false}
        panel={{
          id: PANEL_ID,
          title: DECISION_PAGE.panelTitle,
          titleFocusTarget: true,
          titleRef,
          position: 'sticky',
          children:
            kind === 'open' ? (
              <OpenPanel page={page} onDecided={focusTitle} onMovedOn={refetch} />
            ) : kind === 'blocked' ? (
              <Notice tone="warn" icon="paused" title={PAUSED_BLOCK.title}>
                {PAUSED_BLOCK.line}
              </Notice>
            ) : (
              <DecidedPanel page={page} />
            ),
        }}
      >
        <DecisionDetails page={page} nameOf={nameOf} />
      </DecisionLayout>
    </>
  );
}

// ---- the details (B1-11 left column) ----

/** A key–value list as B1-11 draws it (`dl.doc-kv.xp-kv`, 180 px keys; `doc-` is canvas-only). */
function KeyValues({
  rows,
}: {
  readonly rows: readonly (readonly [string, ReactNode, boolean?])[];
}) {
  return (
    <dl className="xp-kv m-0 grid grid-cols-[180px_minmax(0,1fr)] gap-x-5 gap-y-[10px] text-[15px] leading-[22px]">
      {rows.map(([key, value, wrapAnywhere]) => (
        <KeyValue key={key} name={key} wrapAnywhere={wrapAnywhere === true}>
          {value}
        </KeyValue>
      ))}
    </dl>
  );
}

function KeyValue({
  name,
  wrapAnywhere,
  children,
}: {
  readonly name: string;
  readonly wrapAnywhere: boolean;
  readonly children: ReactNode;
}) {
  return (
    <>
      <dt className="font-[700] text-ink">{name}</dt>
      <dd className={`m-0 text-ink-2${wrapAnywhere ? ' [overflow-wrap:anywhere]' : ''}`}>
        {children}
      </dd>
    </>
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
  const licences = licencesRequestedWords(request.type, request.licencesRequested);
  const term = termWords(request.term);
  const history = historyLines(page);
  return (
    <>
      <Section label={DECISION_PAGE.summaryLabel}>
        <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-x-6 gap-y-4 px-6 py-5">
          <SummaryFact
            name={DECISION_PAGE.facts.experiments}
            value={String(request.items.length)}
          />
          <SummaryFact name={DECISION_PAGE.facts.licences} value={licences} />
          <SummaryFact name={DECISION_PAGE.facts.term} value={term} />
          <SummaryFact name={DECISION_PAGE.facts.route} value={routeWords(page.routeCommitted)} />
        </dl>
      </Section>
      <Section title={DECISION_PAGE.organisation}>
        <SectionBody>
          <KeyValues
            rows={[
              [DECISION_PAGE.institution, request.institutionName],
              [DECISION_PAGE.contactPerson, request.contact.person],
              [DECISION_PAGE.email, request.contact.email, true],
              [DECISION_PAGE.phone, request.contact.phone ?? DECISION_PAGE.phoneNotGiven],
            ]}
          />
        </SectionBody>
      </Section>
      <Section title={DECISION_PAGE.asking} meta={REQUEST_TYPE_WORDS[request.type]}>
        <div className="px-6 pb-2">
          <div className="xr-table-wrap">
            <table className="xr-table">
              <thead>
                <tr>
                  <th scope="col">{DECISION_PAGE.experimentColumn}</th>
                  <th scope="col">{DECISION_PAGE.requestedColumn}</th>
                  <th scope="col">{DECISION_PAGE.publishedColumn}</th>
                </tr>
              </thead>
              <tbody>
                {request.items.map((item) => {
                  const experiment = nameOf(item.experimentId);
                  return (
                    <tr key={item.experimentId}>
                      <td className="is-primary">
                        {experiment.name}
                        {experiment.course ? (
                          <span className="xr-sub">{experiment.course}</span>
                        ) : null}
                      </td>
                      <td data-label={DECISION_PAGE.requestedColumn}>{formatList(item.formats)}</td>
                      <td data-label={DECISION_PAGE.publishedColumn}>
                        {formatList(page.publishedFormats[item.experimentId] ?? [])}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <SectionBody className="pt-3">
          <KeyValues
            rows={[
              [DECISION_PAGE.facts.licences, licences],
              [DECISION_PAGE.facts.term, term],
            ]}
          />
        </SectionBody>
      </Section>
      <Section title={DECISION_PAGE.existing}>
        <SectionBody>
          <p className="xr-body text-ink-2">
            {existingAccessWords(page, (experimentId) => nameOf(experimentId).name)}
          </p>
        </SectionBody>
      </Section>
      {request.message ? (
        <Section title={DECISION_PAGE.message}>
          <SectionBody>
            <blockquote className="m-0 rounded-r-[8px] border-l-[3px] border-indigo-200 bg-canvas px-4 py-3 text-[16px] leading-[24px] text-ink">
              “{request.message}”
            </blockquote>
          </SectionBody>
        </Section>
      ) : null}
      <Section title={DECISION_PAGE.history}>
        <SectionBody>
          <Timeline
            lineElement="p"
            events={history.map((line) => ({
              id: line.id,
              what: line.what,
              when: line.when,
              ...(line.note ? { note: line.note } : {}),
            }))}
          />
        </SectionBody>
      </Section>
      <FourEvents />
    </>
  );
}

function SummaryFact({ name, value }: { readonly name: string; readonly value: string }) {
  return (
    <div>
      <dt className="xr-overline">{name}</dt>
      <dd className="mx-0 mt-1 mb-0 text-[20px] font-[700]">{value}</dd>
    </div>
  );
}

/** "What happens after you decide — four separate events" (B1-11; replaces B2's chain diagram). */
function FourEvents() {
  return (
    <details className="xr-section" open>
      <summary className="flex min-h-14 cursor-pointer items-center gap-2 px-6 text-[17px] font-[700] text-ink">
        <Icon name="help" />
        {FOUR_EVENTS.summary}
      </summary>
      <SectionBody>
        {/* B1-11: a rule above the steps and under each one. Drawn as the list's top and bottom rules
            (the logical `border-y`) and a rule between steps — the same lines as the board's
            `border-top` + `li{border-bottom}`, without `border-top-width`, a Preflight signature
            the built-CSS check refuses (e2e/styles.spec.ts). */}
        <ol className="m-0 flex list-none flex-col border-y border-line p-0">
          {FOUR_EVENTS.steps.map((step, index) => (
            <li
              key={step.what}
              className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 border-b border-line py-[14px] last:border-b-0"
            >
              <b className="xp-step-dot">{index + 1}</b>
              <div>
                <p className="xr-tl-what">{step.what}</p>
                <p className="xr-small text-ink-2">
                  {step.line ?? (
                    <>
                      {FOUR_EVENTS.approvalBefore}
                      <strong>{FOUR_EVENTS.approvalStatus}</strong>
                      {FOUR_EVENTS.approvalAfter}
                    </>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="xr-small mt-3 text-ink-2">{FOUR_EVENTS.footnote}</p>
      </SectionBody>
    </details>
  );
}

// ---- the open panel (B1-11 f0 … f8, f13) ----

function OpenPanel({
  page,
  onDecided,
  onMovedOn,
}: {
  readonly page: DecisionPage;
  /** A decision was recorded: the decided panel will show, with focus on its heading. */
  readonly onDecided: () => void;
  /** The request moved on, or its revision is stale: read it again (P1-21 interim). */
  readonly onMovedOn: () => void;
}) {
  const { request } = page;
  const [draft, setDraft] = useState<DecisionDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<PanelErrors>({});
  const [confirming, setConfirming] = useState(false);
  const errorsRef = useRef<HTMLDivElement>(null);
  /** "Check your decision" takes focus once it has rendered (B1-11 `focus(pid + '-errs')`). */
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

  const update = (patch: Partial<DecisionDraft>, clear: readonly (keyof PanelErrors)[] = []) => {
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
    setConfirming(false);
    if (answer.ok) {
      onDecided();
      return;
    }
    const error = answer.error;
    if (error.kind === 'validation-failed') {
      showErrors(panelErrorsOf(error.fieldErrors));
      return;
    }
    // Moved on, stale, paused, not adjustable, not found: the page is read again and shows the
    // request's current drawn state (P1-21 interim; B1-11 f13, f14). A policy that is still open
    // (T-03, REQ-19) writes nothing and has no drawn state here (state-copy `SA-03.policy-open`).
    onMovedOn();
  };

  const go = () => {
    const found = draftErrors(page, draft);
    if (errorList(found).length > 0) {
      showErrors(found);
      return;
    }
    setErrors({});
    if (draft.choice === 'info') {
      information
        .run({ id: request.id, reason: draft.reason, expectedRev: request.rev })
        .then(handleAnswer, () => undefined);
      return;
    }
    setConfirming(true);
  };

  const confirm = () => {
    const route = page.routeCommitted === null ? draft.route : null;
    if (draft.choice === 'smaller') {
      smaller
        .run({
          id: request.id,
          route,
          items: smallerScopeItems(page, draft),
          licences: licencesValue(page, draft),
          term: termValue(page, draft),
          reason: draft.reason,
          expectedRev: request.rev,
        })
        .then(handleAnswer, () => setConfirming(false));
      return;
    }
    approve
      .run({ id: request.id, route, expectedRev: request.rev })
      .then(handleAnswer, () => setConfirming(false));
  };

  const listed = errorList(errors);
  const pending = pendingHint(page, draft);
  const differences = draft.choice === 'smaller' ? differencesOf(page, draft) : [];
  const route = page.routeCommitted ?? draft.route;
  const goLabel =
    draft.choice === 'info'
      ? DECISION_ACTIONS.info
      : draft.choice === 'smaller'
        ? DECISION_ACTIONS.smaller
        : DECISION_ACTIONS.approve;

  return (
    <>
      {hasPanelErrors(errors) ? (
        <div
          ref={errorsRef}
          className="xr-notice xr-notice--err"
          role="alert"
          id="decision-errors"
          tabIndex={-1}
        >
          <Icon name="failed" />
          <div className="xr-notice-body">
            <span className="xr-notice-title">{DECISION_PAGE.checkTitle}</span>
            {listed.length > 0 ? (
              <ul className="mt-[2px] mb-0 pl-[18px]">
                {listed.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
      <RadioGroup
        legend={DECISION_PAGE.decisionLegend}
        legendClass="xr-sr"
        value={draft.choice}
        onValueChange={(value) => {
          update({ choice: value as DecisionChoice });
          setErrors({});
        }}
        error={errors.choice}
      >
        <ChoiceList>
          <ChoiceCard
            value="approve"
            id="decision-approve"
            title={DECISION_CHOICES.approve.title}
            sub={DECISION_CHOICES.approve.sub}
          />
          {renewal ? (
            <ChoiceCard
              value="smaller"
              id="decision-smaller"
              title={DECISION_CHOICES.smaller.title}
              unavailable
              sub={DECISION_CHOICES.smaller.renewal}
            />
          ) : (
            <ChoiceCard
              value="smaller"
              id="decision-smaller"
              title={DECISION_CHOICES.smaller.title}
              sub={DECISION_CHOICES.smaller.sub}
            />
          )}
          <ChoiceCard
            value="info"
            id="decision-info"
            title={DECISION_CHOICES.info.title}
            sub={DECISION_CHOICES.info.sub}
          />
        </ChoiceList>
      </RadioGroup>
      {needsRoute(page, draft) ? (
        <RadioGroup
          legend={ROUTE_CHOICE.legend}
          marker={ROUTE_CHOICE.marker}
          hint={ROUTE_CHOICE.hint}
          value={draft.route}
          onValueChange={(value) =>
            update({ route: value === 'internal' ? 'internal' : 'external' }, ['route'])
          }
          error={errors.route}
        >
          <ChoiceList>
            <ChoiceCard
              value="internal"
              id="decision-route-internal"
              title={ROUTE_CHOICE.internal.title}
              sub={ROUTE_CHOICE.internal.sub}
            />
            <ChoiceCard
              value="external"
              id="decision-route-external"
              title={ROUTE_CHOICE.external.title}
              sub={ROUTE_CHOICE.external.sub}
            />
          </ChoiceList>
        </RadioGroup>
      ) : null}
      {(draft.choice === 'approve' || draft.choice === 'smaller') && page.routeCommitted ? (
        <p className="xr-hint">
          {ROUTE_CHOICE.lockedBefore}
          <strong className="text-ink">{routeWords(page.routeCommitted)}</strong>
          {ROUTE_CHOICE.lockedAfter}
        </p>
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
            className="min-h-[104px]"
            value={draft.reason}
            onChange={(event) => update({ reason: event.target.value }, ['reason'])}
          />
        </Field>
      ) : null}
      {pending ? (
        <p className="xr-hint flex items-start gap-[6px]">
          <Icon name="info" size={16} />
          <span>{pending}</span>
        </p>
      ) : null}
      <Button variant="primary" block busy={information.busy} busyLabel={goLabel} onClick={go}>
        {goLabel}
      </Button>
      <ConfirmDialog
        open={confirming}
        align="decision"
        idPrefix="decision-confirm"
        title={confirmTitle(draft.choice === 'smaller', request.id)}
        effects={confirmEffects(page, draft, route)}
        confirmLabel={goLabel}
        busy={busy}
        busyLabel={goLabel}
        onConfirm={confirm}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}

/** The confirmation's lines for the chosen route only (B1-11 f2, f3; `cfNew`, `cfExt`, …). */
function confirmEffects(
  page: DecisionPage,
  draft: DecisionDraft,
  route: DecisionPage['routeCommitted'],
): readonly ReactNode[] {
  const lines: ReactNode[] = [];
  const emphasised = ([before, strong, after]: readonly [string, string, string]) => (
    <>
      {before}
      <strong>{strong}</strong>
      {after}
    </>
  );
  if (page.whereItStands.institutionRecord === 'not-created') {
    lines.push(
      <>
        {CONFIRM_LINES.newBefore}
        {page.request.institutionName}
        {CONFIRM_LINES.newMiddle}
        <strong>{routeWords(route)}</strong>
        {CONFIRM_LINES.newAfter}
      </>,
    );
  }
  if (route === 'external') {
    lines.push(emphasised(CONFIRM_LINES.externalApproves));
    lines.push(emphasised(CONFIRM_LINES.externalNotActive));
  }
  if (route === 'internal') {
    lines.push(emphasised(CONFIRM_LINES.internalApproves));
    lines.push(emphasised(CONFIRM_LINES.internalActive));
  }
  if (draft.choice === 'smaller') lines.push(CONFIRM_LINES.smaller);
  lines.push(CONFIRM_LINES.students);
  return lines;
}

/** Approve a smaller scope (B1-11 f5, f8): formats, licences, term, and the difference. */
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
  const toggle = (format: Technology) => {
    const next = kept.includes(format)
      ? kept.filter((item) => item !== format)
      : requested.filter((item) => item === format || kept.includes(item));
    update({ formats: next }, ['formats', 'change']);
  };
  return (
    <>
      <fieldset className="xp-pills">
        <legend>{SMALLER_SCOPE.formatsLegend}</legend>
        {requested.map((format) => (
          <label key={format} className="xp-pill" htmlFor={`decision-format-${format}`}>
            <input
              type="checkbox"
              id={`decision-format-${format}`}
              checked={kept.includes(format)}
              onChange={() => toggle(format)}
            />
            {format.toUpperCase()}
          </label>
        ))}
      </fieldset>
      {errors.formats ? <FieldError>{errors.formats}</FieldError> : null}
      <Field id="decision-licences" label={SMALLER_SCOPE.licencesLabel} error={errors.licences}>
        <TextInput
          className="max-w-40"
          inputMode="numeric"
          invalid={errors.licences !== undefined || errors.undrawn?.includes('licences')}
          value={licencesValue(page, draft)}
          onChange={(event) => update({ licences: event.target.value }, ['licences', 'change'])}
        />
      </Field>
      <Field id="decision-term" label={SMALLER_SCOPE.termLabel} error={errors.term}>
        <Select
          options={TERM_OPTIONS}
          invalid={errors.term !== undefined || errors.undrawn?.includes('term')}
          value={termValue(page, draft)}
          onChange={(event) =>
            update({ term: event.target.value as ApprovedTerm }, ['term', 'change'])
          }
        />
      </Field>
      {differences.length > 0 ? (
        <div className="xr-notice xr-notice--warn" role="status">
          <Icon name="warning" />
          <div className="xr-notice-body">
            <span className="xr-notice-title">{SMALLER_SCOPE.differentTitle}</span>
            {differences.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        </div>
      ) : null}
      {errors.change ? <FieldError>{errors.change}</FieldError> : null}
    </>
  );
}

// ---- the decided panel (B1-11 f9 … f12) ----

function DecidedPanel({ page }: { readonly page: DecisionPage }) {
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
        : null;
  const next = nextLine(request.status);
  return (
    <div className="flex flex-col gap-3">
      <RequestStatusPill status={request.status} />
      {meta ? <p className="xr-small text-ink-2">{meta}</p> : null}
      <dl className="xp-stand" aria-label={STAND.label}>
        {standRows(page).map((row) => (
          <div key={row.key}>
            <dt>{row.key}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      {next ? <p className="xr-body text-ink">{next}</p> : null}
      <Link className="xr-btn xr-btn--secondary xr-btn--block" href={REQUESTS_ADDRESS}>
        {DECISION_PAGE.backToRequests}
      </Link>
    </div>
  );
}
