'use client';

import type { ServiceError, ValidationFailed } from '@xr/contracts/draft';
import type { Assessment, ReleaseOption } from '@xr/domain';
import { ChoiceCard, ChoiceList, Field, Icon, RadioGroup, Textarea, TextInput } from '@xr/ui';
import type { ReactNode } from 'react';

import {
  instantToTyped,
  RELEASE_OPTIONS,
  RULES_FORM,
  typedDateTimeToInstant,
} from '@/copy/assessment-words';
import { facultySummaryTitle, type FormFieldError, type RulesField } from '@/queries/faculty-forms';

/**
 * The assessment's name, introduction and rules as one form, shared by FA-07 step 2 "Set the
 * rules" (B4-04 f2, f3, f11) and FA-10 Settings (B4-06 f0 … f4): Assessment name · Introduction
 * (optional) · Pass mark (%) · Attempts allowed · Deadline · When students see their result and
 * answers (three cards, none chosen for you — T-19) · Release date (only for "On a date") · the
 * "no time limit" line. Every value is the assessment's own and starts empty for a new one —
 * nothing is pre-filled (BC6); no timer and no time limit exist (T-22). The values are sent as
 * typed; the service checks them and answers the drawn words (`FA-07.*` message keys).
 */
export interface RulesDraft {
  readonly name: string;
  readonly introduction: string;
  readonly passMark: string;
  readonly attempts: string;
  readonly deadline: string;
  readonly releaseOption: ReleaseOption | null;
  readonly releaseDate: string;
}

export type { FormFieldError, RulesField } from '@/queries/faculty-forms';
export { formFieldErrors, rulesFieldErrors } from '@/queries/faculty-forms';

/** Nothing pre-filled (BC6; B4-04 f2 "rules start empty", B4-06 f3 "New draft · nothing pre-filled"). */
export const EMPTY_RULES: RulesDraft = {
  name: '',
  introduction: '',
  passMark: '',
  attempts: '',
  deadline: '',
  releaseOption: null,
  releaseDate: '',
};

/** The record's own values, as the form shows them again (blank where a rule is not set). */
export function rulesDraftOf(assessment: Assessment): RulesDraft {
  const { rules } = assessment;
  return {
    name: assessment.name,
    introduction: assessment.introduction ?? '',
    passMark: rules.passMarkPercent === null ? '' : String(rules.passMarkPercent),
    attempts: rules.attemptsAllowed === null ? '' : String(rules.attemptsAllowed),
    deadline: instantToTyped(rules.deadline),
    releaseOption: rules.release?.option ?? null,
    releaseDate: instantToTyped(rules.release?.releaseDate ?? null),
  };
}

/**
 * The draft as the contract's `name`, `introduction` and `rules` inputs (values as typed). With the
 * record it was filled from, a date whose typed words are unchanged sends the record's own instant
 * again (the typed form shows minutes only; a stored second is never rounded away).
 */
export function rulesInputOf(draft: RulesDraft, base?: Assessment) {
  const kept = (typed: string, instant: string | null): string =>
    instant !== null && typed === instantToTyped(instant) ? instant : typedDateTimeToInstant(typed);
  return {
    name: draft.name,
    introduction: draft.introduction.trim() === '' ? null : draft.introduction,
    rules: {
      passMarkPercent: draft.passMark,
      attemptsAllowed: draft.attempts,
      deadline: kept(draft.deadline, base?.rules.deadline ?? null),
      releaseOption: draft.releaseOption,
      releaseDate:
        draft.releaseOption === 'on-date'
          ? kept(draft.releaseDate, base?.rules.release?.releaseDate ?? null)
          : null,
    },
  };
}

/** "Check this step" (B4-04 `errTitle`; the service's own summary title for FA-07). */
export function rulesSummaryTitle(count: number): string {
  return facultySummaryTitle('FA-07', count);
}

export function isValidationFailed(error: ServiceError): error is ValidationFailed {
  return error.kind === 'validation-failed';
}

/** The control ids an error-summary link points to (`<prefix>-name`, `<prefix>-pass` …). */
export function rulesFieldIds(prefix: string): Readonly<Record<RulesField, string>> {
  return {
    name: `${prefix}-name`,
    introduction: `${prefix}-intro`,
    passMark: `${prefix}-pass`,
    attempts: `${prefix}-att`,
    deadline: `${prefix}-dl`,
    releaseOption: `${prefix}-rel`,
    releaseDate: `${prefix}-reldate`,
  };
}

export function RulesFields({
  idPrefix,
  draft,
  onChange,
  errors,
  variant,
  notices,
}: {
  /** The board's id prefix (`Cc` on B4-04, `Es` on B4-06). */
  readonly idPrefix: string;
  readonly draft: RulesDraft;
  readonly onChange: (field: RulesField, value: string) => void;
  readonly errors: readonly FormFieldError<RulesField>[];
  /** B4-04's "No time limit and no timer…" or B4-06's "No time limit. …". */
  readonly variant: 'create' | 'settings';
  /** Notices drawn after the result choice, before the "No time limit" line (B4-06 f1, f2). */
  readonly notices?: ReactNode;
}) {
  const ids = rulesFieldIds(idPrefix);
  const errorOf = (field: RulesField) => errors.find((error) => error.field === field)?.message;
  return (
    <>
      <Field id={ids.name} label={RULES_FORM.name} error={errorOf('name')}>
        <TextInput
          className="max-w-[520px]"
          autoComplete="off"
          value={draft.name}
          onChange={(event) => onChange('name', event.target.value)}
        />
      </Field>
      <Field
        id={ids.introduction}
        label={RULES_FORM.introduction}
        marker={RULES_FORM.optional}
        hint={RULES_FORM.introductionHint}
        error={errorOf('introduction')}
      >
        <Textarea
          className="min-h-24"
          value={draft.introduction}
          onChange={(event) => onChange('introduction', event.target.value)}
        />
      </Field>
      <div className="flex flex-wrap gap-x-8 gap-y-5">
        <Field
          id={ids.passMark}
          label={RULES_FORM.passMark}
          hint={RULES_FORM.passMarkHint}
          error={errorOf('passMark')}
        >
          <TextInput
            className="max-w-[140px]"
            inputMode="numeric"
            autoComplete="off"
            value={draft.passMark}
            onChange={(event) => onChange('passMark', event.target.value)}
          />
        </Field>
        <Field
          id={ids.attempts}
          label={RULES_FORM.attempts}
          hint={RULES_FORM.attemptsHint}
          error={errorOf('attempts')}
        >
          <TextInput
            className="max-w-[140px]"
            inputMode="numeric"
            autoComplete="off"
            value={draft.attempts}
            onChange={(event) => onChange('attempts', event.target.value)}
          />
        </Field>
      </div>
      <Field
        id={ids.deadline}
        label={RULES_FORM.deadline}
        hint={RULES_FORM.deadlineHint}
        error={errorOf('deadline')}
      >
        <TextInput
          className="max-w-[320px]"
          autoComplete="off"
          value={draft.deadline}
          onChange={(event) => onChange('deadline', event.target.value)}
        />
      </Field>
      <RadioGroup
        id={ids.releaseOption}
        name={ids.releaseOption}
        className="[&>legend]:mb-1"
        legend={RULES_FORM.release}
        legendClass="xr-label"
        hint={RULES_FORM.releaseHint}
        hintClassName="block mb-2"
        errorPlacement="before-options"
        error={errorOf('releaseOption')}
        value={draft.releaseOption}
        onValueChange={(value) => onChange('releaseOption', value)}
      >
        <ChoiceList>
          {RELEASE_OPTIONS.map((entry) => (
            <ChoiceCard
              key={entry.option}
              id={`${ids.releaseOption}-${entry.option}`}
              value={entry.option}
              title={entry.title}
              sub={entry.sub}
            />
          ))}
        </ChoiceList>
      </RadioGroup>
      {draft.releaseOption === 'on-date' ? (
        <Field
          id={ids.releaseDate}
          label={RULES_FORM.releaseDate}
          hint={RULES_FORM.releaseDateHint}
          error={errorOf('releaseDate')}
        >
          <TextInput
            className="max-w-[320px]"
            autoComplete="off"
            value={draft.releaseDate}
            onChange={(event) => onChange('releaseDate', event.target.value)}
          />
        </Field>
      ) : null}
      {notices}
      <p className="xl-open m-0">
        <Icon name="info" size={16} />
        <span>{variant === 'create' ? RULES_FORM.noTimerCreate : RULES_FORM.noTimerSettings}</span>
      </p>
    </>
  );
}
