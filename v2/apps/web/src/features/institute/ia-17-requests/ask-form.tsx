'use client';

import type { AccessPlanView, ServiceError, ValidationFailed } from '@xr/contracts/draft';
import type { AccessPlan, ExperimentId, Institution, Technology } from '@xr/domain';
import { inDisplayOrder } from '@xr/domain';
import {
  Button,
  Checkbox,
  CheckboxGroup,
  ChoiceCard,
  ChoiceList,
  ErrorSummary,
  Field,
  FormatSet,
  type FormatCode,
  Icon,
  LoadingState,
  Notice,
  PageHeader,
  RadioGroup,
  Section,
  Textarea,
  TextInput,
} from '@xr/ui';
import { type FormEvent, useState } from 'react';

import { requestWords, wordsOf } from '@/copy/flow-state-words';
import {
  ASK_FORM,
  askSummaryTitle,
  contactWords,
  experimentCourseWords,
  experimentRowMeta,
  experimentsInWords,
  licencesWords,
  moreLicencesWords,
  needRequiredWords,
  renewalOfWords,
  renewChoiceWords,
  renewingTermWords,
} from '@/copy/institute-requests';
import { stateWords } from '@/copy/state-copy';
import { useAccessPlan } from '@/queries/institute-home';
import { useCommand } from '@/queries/use-command';

import { LoadFailed } from '../ia-02-content-access/institute-parts';

/** What the result page says about the request just sent (B3-08 f0 `done`). */
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

const code = (format: Technology) => format.toUpperCase() as FormatCode;

/** The drawn words of the service's field errors on this form (B3-08 script `submit`). */
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
 * IA-17's form, in place on Requests (board B3-08 f1, f2; "Ask for a renewal or more licences" —
 * it mirrors the public request form). Two kinds, both about the plan IA-01's status line names
 * (state-copy `IA-17.form-plan`), read with `InstitutionService.getAccessPlan`:
 *
 * - **Renew access plan ACC-0107** (f2): nothing to change — "The plan you’re renewing" mirrors
 *   the plan (its experiments, formats, licences as approved, term); `submitRenewalRequest`.
 * - **More licences for experiments you hold** (f1): the plan's experiments (all chosen at first)
 *   and "Licences requested" as a whole number; `submitAdditionalLicencesRequest`. No term,
 *   experiment or format can be added (B3-08 "Not asked"); nothing explains how licences are
 *   counted (D7).
 *
 * "Choose what you need" is the form's own check (no kind chosen); the service checks the rest and
 * answers in the drawn words ("Choose at least one experiment", "Enter the number of licences you
 * need", "Enter a whole number, like 60") under "Check your request", focused on every failed send
 * (f1). A refusal because the institution is paused returns to the list (`onPaused`); any other
 * refusal says nothing was sent (state-copy `IA-17.send.refused`); a failure for now keeps the
 * answers (`IA-17.send.unavailable`). Cancel returns to the list and forgets the answers.
 */
export function AskForm({
  plan,
  institution,
  titleId,
  onCancel,
  onPaused,
  onSent,
}: {
  readonly plan: AccessPlan;
  readonly institution: Institution | null;
  readonly titleId: string;
  readonly onCancel: () => void;
  readonly onPaused: () => void;
  readonly onSent: (request: SentRequest) => void;
}) {
  const read = useAccessPlan(plan.id);
  const view = read.data?.ok ? read.data.value : null;

  let body;
  if (read.isError || (read.data && !read.data.ok)) {
    body = (
      <LoadFailed
        title={stateWords('IA-17.failed')}
        onRetry={() => {
          void read.refetch();
        }}
      />
    );
  } else if (view === null) {
    body = <LoadingState label={stateWords('IA-17.form.loading')} surface="section" />;
  } else {
    body = (
      <FormBody
        view={view}
        institution={institution}
        onCancel={onCancel}
        onPaused={onPaused}
        onSent={onSent}
      />
    );
  }

  return (
    <>
      <button
        type="button"
        className="xr-back cursor-pointer [background:none] [border:0] [font:inherit] [padding:0]"
        onClick={onCancel}
      >
        <Icon name="back" />
        {ASK_FORM.back}
      </button>
      <PageHeader
        className="mt-2 mb-5"
        overline={ASK_FORM.overline}
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
  institution,
  onCancel,
  onPaused,
  onSent,
}: {
  readonly view: AccessPlanView;
  readonly institution: Institution | null;
  readonly onCancel: () => void;
  readonly onPaused: () => void;
  readonly onSent: (request: SentRequest) => void;
}) {
  const { plan } = view;
  const renewal = useCommand((ports) => ports.accessRequests.submitRenewalRequest);
  const more = useCommand((ports) => ports.accessRequests.submitAdditionalLicencesRequest);
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
            onSent({ reference: answer.value.reference, what: renewalOfWords(plan.id), status });
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

  return (
    <form className="xw-stack" noValidate aria-label={ASK_FORM.title} onSubmit={submit}>
      {listed.length > 0 && summaryTitle ? (
        <ErrorSummary
          key={attempt}
          id="ask-errors"
          title={summaryTitle}
          items={listed.map((field) => ({
            fieldId: FIELD_IDS[field],
            summaryText: errors[field]!,
          }))}
        />
      ) : null}
      {refused ? <Notice tone="err">{stateWords('IA-17.send.refused')}</Notice> : null}
      <Section title={ASK_FORM.need} headingId="ask-need-h">
        <div className="xr-section-body">
          <RadioGroup
            id={FIELD_IDS.type}
            tabIndex={-1}
            legend={ASK_FORM.need}
            legendClass="xr-sr"
            error={errors.type}
            errorPlacement="before-options"
            value={need}
            onValueChange={(value) => {
              setNeed(value as Need);
              setErrors({});
            }}
          >
            <ChoiceList>
              <ChoiceCard
                id="ask-need-renew"
                value="renew"
                title={renewChoiceWords(plan.id)}
                sub={ASK_FORM.renewSub}
              />
              <ChoiceCard
                id="ask-need-more"
                value="more"
                title={ASK_FORM.more}
                sub={ASK_FORM.moreSub}
              />
            </ChoiceList>
          </RadioGroup>
        </div>
      </Section>
      {need === 'renew' ? (
        <Section title={ASK_FORM.renewing} headingId="ask-renewing-h">
          <div className="xr-section-body">
            <dl className="xl-kv">
              <dt>{ASK_FORM.keys.plan}</dt>
              <dd>
                <span className="xr-id">{plan.id}</span>
              </dd>
              <dt>{ASK_FORM.keys.experiment}</dt>
              <dd>
                {view.experiments.map((experiment, index) => (
                  <span key={experiment.experimentId} className={index > 0 ? 'block' : undefined}>
                    {experimentCourseWords(experiment.name, experiment.course.platformCode)}
                  </span>
                ))}
              </dd>
              <dt>{ASK_FORM.keys.formats}</dt>
              <dd>
                <FormatSet compact formats={formats.map(code)} />
              </dd>
              <dt>{ASK_FORM.keys.licences}</dt>
              <dd>{licencesWords(plan.licences)}</dd>
              <dt>{ASK_FORM.keys.term}</dt>
              <dd>{renewingTermWords(plan.term, plan.endsOn)}</dd>
            </dl>
          </div>
        </Section>
      ) : null}
      {need === 'more' ? (
        <Section title={ASK_FORM.experimentsAndLicences} headingId="ask-more-h">
          <div className="xr-section-body flex flex-col gap-[18px]">
            <CheckboxGroup
              id={FIELD_IDS.experimentIds}
              tabIndex={-1}
              legend={experimentsInWords(plan.id)}
              error={errors.experimentIds}
              errorPlacement="before-options"
            >
              {view.experiments.map((experiment) => (
                <Checkbox
                  key={experiment.experimentId}
                  id={`ask-experiment-${experiment.experimentId}`}
                  checked={chosen.includes(experiment.experimentId)}
                  onChange={() => {
                    setChosen((current) =>
                      current.includes(experiment.experimentId)
                        ? current.filter((id) => id !== experiment.experimentId)
                        : [...current, experiment.experimentId],
                    );
                    clear('experimentIds');
                  }}
                >
                  <span>
                    {experiment.name}{' '}
                    <span className="xl-meta">
                      {experimentRowMeta(experiment.course.platformCode, experiment.formats)}
                    </span>
                  </span>
                </Checkbox>
              ))}
            </CheckboxGroup>
            <Field
              id={FIELD_IDS.licences}
              label={ASK_FORM.licencesRequested}
              hint={ASK_FORM.licencesHint}
              error={errors.licences}
            >
              <TextInput
                className="max-w-[200px]"
                inputMode="numeric"
                autoComplete="off"
                value={licences}
                onChange={(event) => {
                  setLicences(event.target.value);
                  clear('licences');
                }}
              />
            </Field>
          </div>
        </Section>
      ) : null}
      <Section title={ASK_FORM.organisation} headingId="ask-organisation-h">
        <div className="xr-section-body flex flex-col gap-[18px]">
          <dl className="xl-kv">
            <dt>{ASK_FORM.institution}</dt>
            <dd>{view.institutionName}</dd>
            {contact ? (
              <>
                <dt>{ASK_FORM.contactPerson}</dt>
                <dd>{contactWords(contact.name, contact.workEmail)}</dd>
              </>
            ) : null}
          </dl>
          <Field id="ask-message" label={ASK_FORM.message} marker={ASK_FORM.optional}>
            <Textarea
              className="min-h-[90px]"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </Field>
        </div>
      </Section>
      <div className="xw-flow-foot">
        <Button variant="text" onClick={onCancel}>
          {ASK_FORM.cancel}
        </Button>
        <div className="xw-actions">
          <Button variant="primary" type="submit" busy={busy} busyLabel={ASK_FORM.sending}>
            {ASK_FORM.send}
          </Button>
        </div>
      </div>
    </form>
  );
}
