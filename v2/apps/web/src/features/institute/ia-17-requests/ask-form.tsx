'use client';

import type { AccessPlanView, ServiceError, ValidationFailed } from '@xr/contracts/draft';
import type { AccessPlan, ExperimentId, Institution, RequestStatus } from '@xr/domain';
import { inDisplayOrder } from '@xr/domain';
import {
  Button,
  DefinitionList,
  ErrorSummary,
  Field,
  IaActions,
  IaBusyButton,
  IaField,
  IaFormatBadges,
  IaRqChoices,
  IaRqForm,
  IaRqFormPart,
  IaRqFormSection,
  IaRqNote,
  ListState,
  LoadingRows,
  PageHead,
  Surface,
  Textarea,
  TextInput,
} from '@xr/ui/v3';
import { type FormEvent, useState } from 'react';

import { requestWords, wordsOf } from '@/copy/flow-state-words';
import {
  ASK_FORM,
  askSummaryTitle,
  contactWords,
  experimentChoiceLine,
  experimentCourseWords,
  licencesWords,
  moreLicencesWords,
  needRequiredWords,
  OPEN_RENEWAL_TITLE,
  openRenewalLine,
  planFormatsLabel,
  RENEWAL_OF_YOUR_PLAN,
  renewingTermWords,
  REQUESTS_PAGE,
} from '@/copy/institute-requests';
import { stateWords } from '@/copy/state-copy';
import { useAccessPlan } from '@/queries/institute-home';
import { useInstitutionRequests } from '@/queries/institute-requests';
import { useCommand } from '@/queries/use-command';

import { formatCodes } from '../shared/format-codes';

/** What the result page says about the request just sent (IA-v1 "sent"). */
export interface SentRequest {
  readonly reference: string;
  readonly what: string;
  readonly status: string;
}

type Need = 'renew' | 'more';

/** The fields an error names, with the control each summary link focuses. */
const FIELD_IDS = {
  type: 'ask-need',
  experimentIds: 'ask-experiments',
  licences: 'ask-licences',
} as const;

type FieldName = keyof typeof FIELD_IDS;
type Errors = Partial<Record<FieldName, string>>;

const ORDER: readonly FieldName[] = ['type', 'experimentIds', 'licences'];

/** A renewal still open with BITS: sent, not yet active (IA-v1 `openRen`). */
const OPEN: readonly RequestStatus[] = [
  'under-review',
  'information-requested',
  'approved-payment-required',
];

/** The drawn words of the service's field errors on this form (IA-v1 `send`). */
function errorsOf(error: ValidationFailed): Errors {
  const found: Errors = {};
  for (const item of error.fieldErrors) {
    const field = item.field.split('.')[0] as FieldName;
    if (!(field in FIELD_IDS) || found[field] || !item.message) continue;
    found[field] = item.message;
  }
  return found;
}

/**
 * IA-17's form, in place on Requests (the owner-approved Institute Admin export, IA-v1
 * `Main.dc.html` "IA-17 form", `vm17form`: "Ask for a renewal or more licences"). Two kinds, both
 * about the plan IA-01's status line names (state-copy `IA-17.form-plan`), read with
 * `InstitutionService.getAccessPlan`, and named "your access plan" — never by its reference:
 *
 * - **Renew your access plan**: nothing to change — "The plan you’re renewing" mirrors the plan
 *   (its experiments, formats, licences as approved, term); `submitRenewalRequest`. While a
 *   renewal is still open with BITS, a note says so (`listInstitutionRequests`, the list's read).
 * - **More licences for experiments you hold**: the plan's experiments (all chosen at first) and
 *   "Licences requested" as a whole number; `submitAdditionalLicencesRequest`. No term,
 *   experiment or format can be added; nothing explains how licences are counted (D7).
 *
 * "Choose what you need" is the form's own check (no kind chosen); the service checks the rest and
 * answers in the drawn words ("Choose at least one experiment", "Enter the number of licences you
 * need", "Enter a whole number, like 60") under "Check your request", focused on every failed send.
 * A refusal because the institution is paused returns to the list (`onPaused`); any other refusal
 * says nothing was sent (state-copy `IA-17.send.refused`); a failure for now keeps the answers
 * (`IA-17.send.unavailable`). While it sends, "Send request to BITS" reads "Sending…" and is busy.
 * Cancel and the crumb return to the list and forget the answers.
 */
export function AskForm({
  plan,
  institution,
  titleId,
  date,
  onCancel,
  onPaused,
  onSent,
}: {
  readonly plan: AccessPlan;
  readonly institution: Institution | null;
  readonly titleId: string;
  /** Today's date line (`p.rb-eyebrow-date`). */
  readonly date: string | undefined;
  readonly onCancel: () => void;
  readonly onPaused: () => void;
  readonly onSent: (request: SentRequest) => void;
}) {
  const read = useAccessPlan(plan.id);
  const view = read.data?.ok ? read.data.value : null;

  let body;
  if (read.isError || (read.data && !read.data.ok)) {
    body = (
      <Surface>
        <ListState
          kind="failed"
          titleAs="h2"
          title={stateWords('IA-17.failed')}
          action={
            <Button
              onClick={() => {
                void read.refetch();
              }}
            >
              {REQUESTS_PAGE.tryAgain}
            </Button>
          }
        >
          {REQUESTS_PAGE.failedLine}
        </ListState>
      </Surface>
    );
  } else if (view === null) {
    body = (
      <Surface busy>
        <LoadingRows message={stateWords('IA-17.form.loading')} cells={[2, 1]} rows={2} />
      </Surface>
    );
  } else {
    body = (
      <FormBody
        view={view}
        titleId={titleId}
        institution={institution}
        onCancel={onCancel}
        onPaused={onPaused}
        onSent={onSent}
      />
    );
  }

  return (
    <>
      <PageHead
        date={date}
        eyebrow={ASK_FORM.overline}
        title={ASK_FORM.title}
        titleId={titleId}
        titleFocusTarget
      />
      {body}
    </>
  );
}

function FormBody({
  view,
  titleId,
  institution,
  onCancel,
  onPaused,
  onSent,
}: {
  readonly view: AccessPlanView;
  readonly titleId: string;
  readonly institution: Institution | null;
  readonly onCancel: () => void;
  readonly onPaused: () => void;
  readonly onSent: (request: SentRequest) => void;
}) {
  const { plan } = view;
  const renewal = useCommand((ports) => ports.accessRequests.submitRenewalRequest);
  const more = useCommand((ports) => ports.accessRequests.submitAdditionalLicencesRequest);
  const requests = useInstitutionRequests();
  const [need, setNeed] = useState<Need | null>(null);
  const [chosen, setChosen] = useState<readonly string[]>(() =>
    view.experiments.map((experiment) => experiment.experimentId),
  );
  const [licences, setLicences] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [summaryTitle, setSummaryTitle] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [refused, setRefused] = useState(false);
  const busy = renewal.busy || more.busy;

  const clear = (field: FieldName) =>
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });

  const fail = (found: Errors, title: string | null) => {
    setErrors(found);
    setSummaryTitle(title ?? askSummaryTitle(Object.keys(found).length));
    setAttempt((current) => current + 1);
  };

  const answered = (error: ServiceError) => {
    if (error.kind === 'validation-failed') {
      fail(errorsOf(error), error.summaryTitle);
      return;
    }
    if (error.kind === 'refused' && error.code === 'institution-paused') {
      onPaused();
      return;
    }
    setErrors({});
    setRefused(true);
    setAttempt((current) => current + 1);
  };

  const status = wordsOf(
    requestWords({ status: 'under-review', reviewStarted: false }, 'tenant_admin'),
  )!;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setRefused(false);
    if (need === null) {
      fail({ type: needRequiredWords() }, null);
      return;
    }
    const note = message.trim() === '' ? null : message;
    if (need === 'renew') {
      renewal.run({ planId: plan.id, message: note }).then(
        (answer) => {
          if (answer.ok)
            onSent({ reference: answer.value.reference, what: RENEWAL_OF_YOUR_PLAN, status });
          else answered(answer.error);
        },
        // Failed for now: nothing changes, the answers stay (state-copy `IA-17.send.unavailable`).
        () => undefined,
      );
      return;
    }
    const experimentIds = view.experiments
      .map((experiment) => experiment.experimentId)
      .filter((id) => chosen.includes(id)) as ExperimentId[];
    more.run({ planId: plan.id, experimentIds, licences, message: note }).then(
      (answer) => {
        if (answer.ok) {
          const names = view.experiments
            .filter((experiment) => chosen.includes(experiment.experimentId))
            .map((experiment) => experiment.name)
            .join(', ');
          onSent({
            reference: answer.value.reference,
            what: `${moreLicencesWords(Number(licences.trim()))} · ${names}`,
            status,
          });
        } else answered(answer.error);
      },
      () => undefined,
    );
  };

  const listed = ORDER.filter((field) => errors[field]);
  const contact = institution?.instituteAdmin ?? null;
  const formats = inDisplayOrder([
    ...new Set(view.experiments.flatMap((experiment) => experiment.formats)),
  ]);
  const openRenewal = requests.data?.ok
    ? (requests.data.value.find((row) => row.type === 'renewal' && OPEN.includes(row.status)) ??
      null)
    : null;

  return (
    <IaRqForm labelledBy={titleId} onSubmit={submit}>
      {listed.length > 0 && summaryTitle ? (
        <IaRqFormPart>
          <ErrorSummary
            key={attempt}
            id="ask-errors"
            title={summaryTitle}
            items={listed.map((field) => ({
              fieldId: FIELD_IDS[field],
              summaryText: errors[field]!,
            }))}
          />
        </IaRqFormPart>
      ) : null}
      {refused ? (
        <IaRqFormPart>
          <ErrorSummary
            key={`refused-${attempt}`}
            id="ask-refused"
            alwaysShown
            title={stateWords('IA-17.send.refused')}
            items={[]}
          />
        </IaRqFormPart>
      ) : null}
      <IaRqFormSection title={ASK_FORM.need} titleId="ask-need-h">
        <IaRqChoices
          kind="radio"
          id={FIELD_IDS.type}
          name="ask-need"
          legend={ASK_FORM.need}
          legendHidden
          options={[
            { value: 'renew', title: ASK_FORM.renew, description: ASK_FORM.renewSub },
            { value: 'more', title: ASK_FORM.more, description: ASK_FORM.moreSub },
          ]}
          values={need === null ? [] : [need]}
          onToggle={(value) => {
            setNeed(value as Need);
            setErrors({});
          }}
          error={errors.type}
        />
        {openRenewal ? (
          <IaRqNote title={OPEN_RENEWAL_TITLE}>
            {openRenewalLine(
              openRenewal.receivedAt,
              wordsOf(
                requestWords({ status: openRenewal.status, reviewStarted: false }, 'tenant_admin'),
              ) ?? openRenewal.status,
            )}
          </IaRqNote>
        ) : null}
      </IaRqFormSection>
      {need === 'renew' ? (
        <IaRqFormSection title={ASK_FORM.renewing} titleId="ask-renewing-h">
          <DefinitionList
            items={[
              {
                term: ASK_FORM.keys.experiment,
                value: view.experiments
                  .map((experiment) =>
                    experimentCourseWords(experiment.name, experiment.course.platformCode),
                  )
                  .join(', '),
              },
              {
                term: ASK_FORM.keys.formats,
                value: (
                  <IaFormatBadges
                    flush
                    formats={formatCodes(formats)}
                    label={planFormatsLabel(formats)}
                  />
                ),
              },
              { term: ASK_FORM.keys.licences, value: licencesWords(plan.licences) },
              { term: ASK_FORM.keys.term, value: renewingTermWords(plan.term, plan.endsOn) },
            ]}
          />
        </IaRqFormSection>
      ) : null}
      {need === 'more' ? (
        <IaRqFormSection
          title={ASK_FORM.experimentsAndLicences}
          titleId="ask-more-h"
          layout="stack"
        >
          <IaRqChoices
            kind="checkbox"
            id={FIELD_IDS.experimentIds}
            legend={ASK_FORM.experimentsIn}
            options={view.experiments.map((experiment) => ({
              value: experiment.experimentId,
              title: experimentCourseWords(experiment.name, experiment.course.platformCode),
              description: experimentChoiceLine(experiment.formats),
            }))}
            values={chosen}
            onToggle={(value) => {
              setChosen((current) =>
                current.includes(value)
                  ? current.filter((id) => id !== value)
                  : [...current, value],
              );
              clear('experimentIds');
            }}
            error={errors.experimentIds}
          />
          <IaField
            id={FIELD_IDS.licences}
            width="count"
            label={ASK_FORM.licencesRequested}
            hint={ASK_FORM.licencesHint}
            error={errors.licences}
          >
            <TextInput
              inputMode="numeric"
              autoComplete="off"
              value={licences}
              onChange={(event) => {
                setLicences(event.target.value);
                clear('licences');
              }}
            />
          </IaField>
        </IaRqFormSection>
      ) : null}
      <IaRqFormSection title={ASK_FORM.organisation} titleId="ask-organisation-h" layout="tight">
        <DefinitionList
          items={[
            { term: ASK_FORM.institution, value: view.institutionName },
            ...(contact
              ? [
                  {
                    term: ASK_FORM.contactPerson,
                    value: contactWords(contact.name, contact.workEmail),
                  },
                ]
              : []),
          ]}
        />
        <Field id="ask-message" label={ASK_FORM.message}>
          <Textarea value={message} onChange={(event) => setMessage(event.target.value)} />
        </Field>
      </IaRqFormSection>
      <IaActions>
        <Button size="lg" onClick={onCancel}>
          {ASK_FORM.cancel}
        </Button>
        <IaBusyButton
          type="submit"
          variant="primary"
          size="lg"
          busy={busy}
          busyLabel={ASK_FORM.sending}
        >
          {ASK_FORM.send}
        </IaBusyButton>
      </IaActions>
    </IaRqForm>
  );
}
