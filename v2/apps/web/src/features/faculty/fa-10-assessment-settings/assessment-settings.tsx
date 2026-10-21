'use client';

import type { ServiceError } from '@xr/contracts/draft';
import type { Assessment } from '@xr/domain';
import {
  Button,
  ErrorSummary,
  FaAuthor,
  FaCreateSideTitle,
  FaFormFoot,
  FaFormMessages,
  FaFormSection,
  FaRecordLine,
  FaSettingsForm,
  FaSettingsHead,
  FaSettingsVersion,
  FaSide,
  FaSideSection,
  Hint,
  Notice,
} from '@xr/ui/v3';
import { type FormEvent, type Ref, useEffect, useRef, useState } from 'react';

import { keepWords, releaseRuleWords, SUMMARY_WORDS } from '@/copy/assessment-record';
import {
  newVersionWarning,
  releaseChangedWords,
  releaseWarning,
  savedAsVersionWords,
  SETTINGS_PAGE,
  sideLine,
  sideVersionWords,
} from '@/copy/assessment-settings';
import { releaseSummary, typedDateTimeToInstant } from '@/copy/assessment-words';
import { dateTime } from '@/copy/dates';
import { stateWords } from '@/copy/state-copy';
import { useAppNavigation } from '@/nav/navigation';
import { useSubmissions } from '@/queries/faculty-assessment-work';
import { useAssessmentRecord } from '@/queries/teaching';
import { useCommand } from '@/queries/use-command';

import { earlierSubmissions } from '../fa-08-assessment-summary/assessment-summary';
import {
  AssessmentFallback,
  AssessmentFrame,
  type AssessmentFrameView,
  TAB_HEADING_ID,
  useAssessmentPage,
} from '../shared/assessment-frame';
import {
  type FormFieldError,
  type RulesDraft,
  rulesDraftOf,
  type RulesField,
  rulesFieldErrors,
  rulesFieldIds,
  RulesFields,
  rulesInputOf,
} from '../shared/rules-fields';

/** The id prefix (`Es-name`, `Es-err`, `Es-saved` …). */
const PREFIX = 'Es';
const FIELD_IDS = rulesFieldIds(PREFIX);

/**
 * FA-10 Assessment · Settings in the V3 Refined B design (FA-v1 `Main.dc.html` "FA-10 Settings",
 * `vmSettings`), at `/faculty/assessments/[assessmentId]/settings`, inside the record frame.
 *
 * - **Reads**: the assessment record's frame (`useAssessmentPage`: the record, the experiment and
 *   the list row), and — while Students have submitted — `listSubmissions` (one aggregate read) to
 *   name who submitted in the warnings and the side panel ("Rahul Verma has submitted"); until it
 *   answers, the counts' words (`FA-10.submitted-*`).
 * - **The form as drawn**: "Settings" with its line, then the shared rules form (`RulesFields`,
 *   prefix `Es`) filled with the record's own values — a draft's empty rules stay empty, no result
 *   option is chosen for you (BC6, T-19) — then "Cancel changes" (puts the record's values back,
 *   `FA-10.cancel`) and the one primary "Save settings"; beside it, "How changes apply" with the
 *   version and since when. No timer, no release control, no "Make available" (T-18, T-22).
 * - **Before saving**: while someone has submitted the current version, a changed pass mark,
 *   attempts or deadline shows "This makes a new version"; a changed result option or release date
 *   shows it too (the domain versions it like any rule) with "This changes when results are shown
 *   for new attempts": submitted attempts keep the result terms of the version they answered (P4-06).
 * - **Save** sends `AssessmentService.updateSettings` once with the revision the page read. The
 *   service checks the values: its words show on the fields and in "Check these settings", which
 *   takes focus; typing in a field clears its error. Saved: "Settings saved." or "Settings saved as
 *   version 2." with whose submissions keep which version, in `#Es-saved`, which takes focus.
 *   Nothing changed: "Nothing to save — these are the settings already set." Stale: the record is
 *   read again, the values stay (`FA-10.stale.*`). Policy-open, unavailable: their own words,
 *   values kept. Not found or not permitted: the in-shell not-found.
 */
export function AssessmentSettings({ assessmentId }: { readonly assessmentId: string }) {
  const state = useAssessmentPage(assessmentId, 'settings');
  if (state.kind !== 'ready') return <AssessmentFallback state={state} />;
  return (
    <AssessmentFrame view={state.view} tab="settings">
      <SettingsForm key={state.view.record.assessment.id} view={state.view} />
    </AssessmentFrame>
  );
}

type Outcome =
  | {
      readonly kind: 'saved';
      readonly words: string;
      /** The change made this version: its line names whose submissions keep which. */
      readonly madeVersion?: number;
      /** "New attempts release their result after the deadline." */
      readonly release?: string;
    }
  | { readonly kind: 'unchanged' }
  | { readonly kind: 'stale' }
  | { readonly kind: 'policy-open' }
  | { readonly kind: 'unavailable' };

/** A typed date compared by the instant it reads as (`FA-10.changed`). */
const sameDate = (a: string, b: string) => typedDateTimeToInstant(a) === typedDateTimeToInstant(b);

/** f1's condition (with a release change, below): a pass mark, attempts or deadline differs. */
function ruleChanged(draft: RulesDraft, base: RulesDraft): boolean {
  return (
    draft.passMark.trim() !== base.passMark.trim() ||
    draft.attempts.trim() !== base.attempts.trim() ||
    !sameDate(draft.deadline, base.deadline)
  );
}

/** f2's condition: the result option or its release date differs from the record. */
function releaseChanged(draft: RulesDraft, base: RulesDraft): boolean {
  if (draft.releaseOption !== base.releaseOption) return true;
  return draft.releaseOption === 'on-date' && !sameDate(draft.releaseDate, base.releaseDate);
}

function SettingsForm({ view }: { readonly view: AssessmentFrameView }) {
  const navigation = useAppNavigation();
  const record = useAssessmentRecord(view.record.assessment.id);
  const update = useCommand((ports) => ports.assessments.updateSettings);
  // The record the form was filled from (its values are what Cancel puts back and what the
  // warnings compare with; its revision is what Save sends).
  const [base, setBase] = useState<Assessment>(view.record.assessment);
  const [draft, setDraft] = useState<RulesDraft>(() => rulesDraftOf(view.record.assessment));
  const [errors, setErrors] = useState<readonly FormFieldError<RulesField>[]>([]);
  // Each refused save shows the summary anew, and it takes focus.
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [answered, setAnswered] = useState(0);
  const [gone, setGone] = useState(false);
  const answerRef = useRef<HTMLDivElement>(null);

  // The submissions on the CURRENT version (PC-53): a change makes a new version exactly while
  // there are any — the result release included, which the domain versions like any rule.
  const submitted = record.data?.ok
    ? record.data.value.submittedOnCurrentVersion
    : view.record.submittedOnCurrentVersion;
  const submissions = useSubmissions(base.id, (view.row?.submitted ?? 0) > 0);
  const submissionRows = submissions.data?.ok ? submissions.data.value : null;
  const names =
    submissionRows === null
      ? null
      : [
          ...new Set(
            submissionRows
              .filter((row) => row.attempt.assessmentVersion === base.version)
              .map((row) => row.student.fullName),
          ),
        ];

  // The answer takes focus when it shows (the export's `focusLater('fa-msg')`).
  useEffect(() => {
    if (answered > 0) answerRef.current?.focus();
  }, [answered]);

  if (gone) return navigation.notFound();

  const baseDraft = rulesDraftOf(base);
  const showWarnings = submitted > 0 && outcome?.kind !== 'saved';
  const warnRelease = showWarnings && releaseChanged(draft, baseDraft);
  const warnRule = showWarnings && (ruleChanged(draft, baseDraft) || warnRelease);
  const currentRelease =
    base.rules.release === null
      ? SUMMARY_WORDS.notChosenYet
      : releaseRuleWords(
          base.rules.release.option,
          base.rules.release.releaseDate === null ? null : dateTime(base.rules.release.releaseDate),
        );

  const change = (field: RulesField, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setOutcome(null);
    setErrors((current) =>
      current.filter(
        (error) =>
          error.field !== field && !(field === 'releaseOption' && error.field === 'releaseDate'),
      ),
    );
  };

  const answer = (next: Outcome) => {
    setOutcome(next);
    setAnswered((current) => current + 1);
  };

  const refused = (error: ServiceError) => {
    switch (error.kind) {
      case 'validation-failed':
        setOutcome(null);
        setErrors(rulesFieldErrors(error));
        setAttempt((current) => current + 1);
        return;
      case 'not-found':
      case 'not-permitted':
        setGone(true);
        return;
      case 'policy-open':
        answer({ kind: 'policy-open' });
        return;
      case 'invalid-state':
        if (error.current === 'unchanged') {
          answer({ kind: 'unchanged' });
          return;
        }
        break;
      default:
        break;
    }
    // Stale (or moved on in another way): read the record again; every typed value stays.
    void record.refetch().then((fresh) => {
      if (fresh.data?.ok) setBase(fresh.data.value.assessment);
    });
    answer({ kind: 'stale' });
  };

  const save = (event?: FormEvent) => {
    event?.preventDefault();
    if (update.busy) return;
    update.run({ id: base.id, ...rulesInputOf(draft, base), expectedRev: base.rev }).then(
      (result) => {
        if (!result.ok) {
          refused(result.error);
          return;
        }
        const saved = result.value.assessment;
        setErrors([]);
        setBase(saved);
        setDraft(rulesDraftOf(saved));
        const release = releaseSummary(saved.rules.release);
        answer({
          kind: 'saved',
          words: result.value.newVersion ? savedAsVersionWords(saved.version) : SETTINGS_PAGE.saved,
          ...(result.value.newVersion ? { madeVersion: saved.version } : {}),
          ...(result.value.releaseChanged && release !== null
            ? { release: releaseChangedWords(release) }
            : {}),
        });
      },
      // Failed for now: nothing changed and every value stays (`FA-10.unavailable.*`).
      () => answer({ kind: 'unavailable' }),
    );
  };

  const cancel = () => {
    setDraft(baseDraft);
    setErrors([]);
    setOutcome(null);
  };

  const sideId = `${PREFIX}-side`;
  return (
    <FaAuthor>
      <FaSettingsForm labelledBy={TAB_HEADING_ID} onSubmit={save}>
        <FaSettingsHead
          titleId={TAB_HEADING_ID}
          title={SETTINGS_PAGE.title}
          line={SETTINGS_PAGE.line}
        />
        {errors.length > 0 ? (
          <FaFormMessages>
            <ErrorSummary
              spaced
              key={attempt}
              id={`${PREFIX}-err`}
              title={SETTINGS_PAGE.summaryTitle}
              items={errors.map((error) => ({
                fieldId: FIELD_IDS[error.field],
                summaryText: error.summaryText,
              }))}
            />
          </FaFormMessages>
        ) : null}
        {outcome ? (
          <FaFormMessages>
            <OutcomeNotice
              outcome={outcome}
              noticeRef={answerRef}
              keep={(version) => keepWords(version, earlierSubmissions(submissionRows, version))}
            />
          </FaFormMessages>
        ) : null}
        <RulesFields
          idPrefix={PREFIX}
          draft={draft}
          errors={errors}
          onChange={change}
          variant="settings"
        />
        {warnRule || warnRelease ? (
          <FaFormSection tone="warn">
            {warnRule ? (
              <Notice
                tone="warn"
                icon="infoDisc"
                role="status"
                title={SETTINGS_PAGE.newVersionTitle}
              >
                {newVersionWarning(names, submitted)}
              </Notice>
            ) : null}
            {warnRelease ? (
              <Notice tone="warn" icon="clock" role="status" title={SETTINGS_PAGE.releaseTitle}>
                {releaseWarning(names, submitted, currentRelease)}
              </Notice>
            ) : null}
          </FaFormSection>
        ) : null}
        <FaFormFoot
          start={<Button onClick={cancel}>{SETTINGS_PAGE.cancel}</Button>}
          end={
            <Button
              variant="primary"
              size="lg"
              type="submit"
              busy={update.busy}
              busyLabel={SETTINGS_PAGE.saving}
            >
              {SETTINGS_PAGE.save}
            </Button>
          }
        />
      </FaSettingsForm>
      <FaSide labelledBy={sideId}>
        <FaSideSection>
          <FaCreateSideTitle id={sideId}>{SETTINGS_PAGE.sideTitle}</FaCreateSideTitle>
          <FaSettingsVersion>
            {sideVersionWords(base.version, dateTime(base.versionSince))}
          </FaSettingsVersion>
          <FaRecordLine>{sideLine(base.version, names, submitted)}</FaRecordLine>
          <Hint under="list">{SETTINGS_PAGE.sideNameNote}</Hint>
        </FaSideSection>
      </FaSide>
    </FaAuthor>
  );
}

/** The save's answer in `#Es-saved`: saved (the export's ok notice), or what stopped it. */
function OutcomeNotice({
  outcome,
  noticeRef,
  keep,
}: {
  readonly outcome: Outcome;
  readonly noticeRef: Ref<HTMLDivElement>;
  /** Whose submissions keep which version, after a change that made `version`. */
  readonly keep: (version: number) => string;
}) {
  const id = `${PREFIX}-saved`;
  switch (outcome.kind) {
    case 'saved': {
      const lines = [
        ...(outcome.madeVersion === undefined ? [] : [keep(outcome.madeVersion)]),
        ...(outcome.release === undefined ? [] : [outcome.release]),
      ];
      return (
        <Notice tone="ok" role="status" id={id} ref={noticeRef} title={outcome.words}>
          {lines.length > 0 ? lines.join(' ') : undefined}
        </Notice>
      );
    }
    case 'unchanged':
      return (
        <Notice tone="ok" role="status" id={id} ref={noticeRef} title={SETTINGS_PAGE.unchanged} />
      );
    case 'stale':
      return (
        <Notice
          tone="warn"
          icon="alertCircle"
          role="alert"
          id={id}
          ref={noticeRef}
          title={stateWords('FA-10.stale.title')}
        >
          {stateWords('FA-10.stale.line')}
        </Notice>
      );
    case 'policy-open':
      return (
        <Notice
          tone="warn"
          icon="alertCircle"
          role="alert"
          id={id}
          ref={noticeRef}
          title={stateWords('FA-10.policy-open.title')}
        >
          {stateWords('FA-10.policy-open.line')}
        </Notice>
      );
    case 'unavailable':
      return (
        <Notice
          tone="warn"
          icon="alertCircle"
          role="alert"
          id={id}
          ref={noticeRef}
          title={stateWords('FA-10.unavailable.title')}
        >
          {stateWords('FA-10.unavailable.line')}
        </Notice>
      );
  }
}
