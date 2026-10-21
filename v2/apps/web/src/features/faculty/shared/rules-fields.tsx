'use client';

import type { ServiceError, ValidationFailed } from '@xr/contracts/draft';
import type { Assessment, ReleaseOption } from '@xr/domain';
import {
  FA_RELEASE_DATE_FIELD,
  FaChoiceGroup,
  FaCreateRuleFields,
  FaFormSection,
  Field,
  Hint,
  Textarea,
  TextInput,
} from '@xr/ui/v3';

import { instantToTyped, RELEASE_OPTIONS, typedDateTimeToInstant } from '@/copy/assessment-words';
import { RULES_WORDS } from '@/copy/assessments';
import { facultySummaryTitle, type FormFieldError, type RulesField } from '@/queries/faculty-forms';

/**
 * The assessment's name, introduction and rules as one form, shared by FA-07 step 2 "Set the
 * rules" and FA-10 Settings: Assessment name · Introduction (optional) · Pass mark (%) · Attempts
 * allowed · Deadline · When students see their result and answers (three cards, none chosen for
 * you — T-19) · Release date (only for "On a date"). Every value is the assessment's own and starts
 * empty for a new one — nothing is pre-filled (BC6); no timer and no time limit exist (T-22). The
 * values are sent as typed; the service checks them and answers the drawn words (`FA-07.*` message
 * keys).
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

/** The section headings' ids (`<prefix>-g1` "Name and introduction", `<prefix>-g2` "Rules"). */
function sectionIds(prefix: string) {
  return { names: `${prefix}-g1`, rules: `${prefix}-g2` };
}

/**
 * The rules form's sections in the V3 Refined B design (FA-v1 `Main.dc.html` FA-07 step 2 and
 * FA-10): "Name and introduction" (the name, the optional introduction), "Rules" (pass mark,
 * attempts allowed and deadline side by side, `div.fa-fields3`), then "When students see their
 * result and answers" (three cards, none chosen for you — T-19) with the release date for "On a
 * date". FA-07 closes with the "no time limit" line; FA-10 says it in its head. The values are
 * sent as typed; the service checks them and answers the words each field shows.
 */
export function RulesFields({
  idPrefix,
  draft,
  onChange,
  errors,
  variant,
}: {
  /** The id prefix (`Cc` on FA-07, `Es` on FA-10). */
  readonly idPrefix: string;
  readonly draft: RulesDraft;
  readonly onChange: (field: RulesField, value: string) => void;
  readonly errors: readonly FormFieldError<RulesField>[];
  /** FA-07 (`h2` section titles, the "no time limit" line) or FA-10 (`h3`, under the tab's H2). */
  readonly variant: 'create' | 'settings';
}) {
  const ids = rulesFieldIds(idPrefix);
  const groups = sectionIds(idPrefix);
  const level = variant === 'create' ? 2 : 3;
  const errorOf = (field: RulesField) => errors.find((error) => error.field === field)?.message;
  return (
    <>
      <FaFormSection
        group
        title={RULES_WORDS.nameSection}
        titleId={groups.names}
        headingLevel={level}
      >
        <Field id={ids.name} label={RULES_WORDS.name} error={errorOf('name')}>
          <TextInput
            autoComplete="off"
            value={draft.name}
            onChange={(event) => onChange('name', event.target.value)}
          />
        </Field>
        <Field
          id={ids.introduction}
          label={RULES_WORDS.introduction}
          hint={RULES_WORDS.introductionHint}
          error={errorOf('introduction')}
        >
          <Textarea
            value={draft.introduction}
            onChange={(event) => onChange('introduction', event.target.value)}
          />
        </Field>
      </FaFormSection>
      <FaFormSection
        group
        title={RULES_WORDS.rulesSection}
        titleId={groups.rules}
        headingLevel={level}
      >
        <FaCreateRuleFields>
          <Field
            id={ids.passMark}
            label={RULES_WORDS.passMark}
            hint={RULES_WORDS.passMarkHint}
            error={errorOf('passMark')}
          >
            <TextInput
              inputMode="numeric"
              autoComplete="off"
              value={draft.passMark}
              onChange={(event) => onChange('passMark', event.target.value)}
            />
          </Field>
          <Field
            id={ids.attempts}
            label={RULES_WORDS.attempts}
            hint={RULES_WORDS.attemptsHint}
            error={errorOf('attempts')}
          >
            <TextInput
              inputMode="numeric"
              autoComplete="off"
              value={draft.attempts}
              onChange={(event) => onChange('attempts', event.target.value)}
            />
          </Field>
          <Field
            id={ids.deadline}
            label={RULES_WORDS.deadline}
            hint={RULES_WORDS.deadlineHint}
            error={errorOf('deadline')}
          >
            <TextInput
              autoComplete="off"
              value={draft.deadline}
              onChange={(event) => onChange('deadline', event.target.value)}
            />
          </Field>
        </FaCreateRuleFields>
      </FaFormSection>
      <FaFormSection>
        <FaChoiceGroup<ReleaseOption>
          id={ids.releaseOption}
          name={ids.releaseOption}
          legend={RULES_WORDS.release}
          legendHint={RULES_WORDS.releaseHint}
          options={RELEASE_OPTIONS.map((entry) => ({
            value: entry.option,
            title: entry.title,
            description: entry.sub,
          }))}
          value={draft.releaseOption}
          onChange={(value) => onChange('releaseOption', value)}
          error={errorOf('releaseOption')}
        />
        {draft.releaseOption === 'on-date' ? (
          <Field
            id={ids.releaseDate}
            className={FA_RELEASE_DATE_FIELD}
            label={RULES_WORDS.releaseDate}
            hint={RULES_WORDS.releaseDateHint}
            error={errorOf('releaseDate')}
          >
            <TextInput
              autoComplete="off"
              value={draft.releaseDate}
              onChange={(event) => onChange('releaseDate', event.target.value)}
            />
          </Field>
        ) : null}
        {variant === 'create' ? <Hint>{RULES_WORDS.noTimer}</Hint> : null}
      </FaFormSection>
    </>
  );
}
