'use client';

import type { ServiceError } from '@xr/contracts/draft';
import type { Assessment } from '@xr/domain';
import { Button, ErrorSummary, Notice } from '@xr/ui';
import { type FormEvent, useEffect, useRef, useState } from 'react';

import {
  newVersionWarning,
  releaseWarning,
  savedWords,
  SETTINGS_PAGE,
} from '@/copy/assessment-settings';
import { releaseSummary, typedDateTimeToInstant } from '@/copy/assessment-words';
import { ASSESSMENT_TAB_TITLES } from '@/copy/faculty-assessment-frame';
import { stateWords } from '@/copy/state-copy';
import { useAppNavigation } from '@/nav/navigation';
import { useAssessmentRecord } from '@/queries/teaching';
import { useCommand } from '@/queries/use-command';

import {
  AssessmentFallback,
  AssessmentFrame,
  type AssessmentFrameView,
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

/** The board's id prefix (`Es-name`, `Es-err`, `Es-saved` …; B4-06 f0). */
const PREFIX = 'Es';
const FIELD_IDS = rulesFieldIds(PREFIX);

/**
 * FA-10 Assessment · Settings — board B4-06 f0 … f4, at `/faculty/assessments/[assessmentId]/settings`.
 *
 * - **Reads**: the assessment record's frame (`useAssessmentPage`: the record, the experiment and
 *   the list row whose `submitted` count drives the warnings). Loading, failed and not-found are
 *   the frame's own states.
 * - **The form as drawn** (f0, f4): the shared rules form (`RulesFields`, prefix `Es`) filled with
 *   the record's own values — a draft's empty rules stay empty, no result option is chosen for
 *   you (f3; BC6, T-19) — then Cancel (puts the record's values back, `FA-10.cancel`) and the one
 *   primary "Save settings". No timer, no release control, no "Make available" (T-18, T-22, D4).
 * - **Before saving**: while someone has submitted, a changed pass mark, attempts or deadline shows
 *   f1 "This makes a new version"; a changed result option or release date shows f2 "This changes
 *   when a submitted student sees their result" (both without a name: `FA-10.*-warning`).
 * - **Save** sends `AssessmentService.updateSettings` once with the revision the page read. The
 *   service checks the values: its drawn words show on the fields and in "Check these settings",
 *   which takes focus; typing in a field clears its error. Saved: "Settings saved." (or the new
 *   version's words) in `#Es-saved`, which takes focus. Stale: the record is read again, the
 *   values stay (`FA-10.stale.*`). Policy-open, unchanged, unavailable: their own words, values
 *   kept. Not found or not permitted: the in-shell not-found.
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
  | { readonly kind: 'saved'; readonly words: string }
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
  // Each refused save shows the summary anew, and it takes focus (B4-06 `focus(pid + '-err')`).
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [answered, setAnswered] = useState(0);
  const [gone, setGone] = useState(false);
  const answerRef = useRef<HTMLDivElement>(null);

  // The answer takes focus when it shows (B4-06 `focus(pid + '-saved')`).
  useEffect(() => {
    if (answered > 0) answerRef.current?.focus();
  }, [answered]);

  if (gone) return navigation.notFound();

  // The submissions on the CURRENT version (PC-53): a change makes a new version exactly while
  // there are any — the result release included, which the domain versions like any rule.
  const submitted = record.data?.ok
    ? record.data.value.submittedOnCurrentVersion
    : view.record.submittedOnCurrentVersion;
  const baseDraft = rulesDraftOf(base);
  const showWarnings = submitted > 0 && outcome?.kind !== 'saved';
  const warnRelease = showWarnings && releaseChanged(draft, baseDraft);
  const warnRule = showWarnings && (ruleChanged(draft, baseDraft) || warnRelease);

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

  const save = (event: FormEvent) => {
    event.preventDefault();
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
        answer({
          kind: 'saved',
          words: savedWords({
            newVersion: result.value.newVersion,
            version: saved.version,
            release: result.value.releaseChanged ? releaseSummary(saved.rules.release) : null,
          }),
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

  return (
    <div className="max-w-[820px]">
      <form
        className="xr-section flex flex-col gap-5 p-6"
        noValidate
        aria-label={ASSESSMENT_TAB_TITLES.settings}
        onSubmit={save}
      >
        {errors.length > 0 ? (
          <ErrorSummary
            key={attempt}
            id={`${PREFIX}-err`}
            title={SETTINGS_PAGE.summaryTitle}
            items={errors.map((error) => ({
              fieldId: FIELD_IDS[error.field],
              summaryText: error.summaryText,
            }))}
          />
        ) : null}
        <div id={`${PREFIX}-saved`} tabIndex={-1} ref={answerRef}>
          {outcome ? <OutcomeNotice outcome={outcome} /> : null}
        </div>
        <RulesFields
          idPrefix={PREFIX}
          draft={draft}
          errors={errors}
          onChange={change}
          variant="settings"
          // f1, f2: the drawn notices sit after the result choice, before "No time limit".
          notices={
            <>
              {warnRule ? (
                <Notice tone="warn" title={SETTINGS_PAGE.newVersionTitle}>
                  {newVersionWarning(submitted)}
                </Notice>
              ) : null}
              {warnRelease ? (
                <Notice tone="warn" title={SETTINGS_PAGE.releaseTitle}>
                  {releaseWarning(submitted)}
                </Notice>
              ) : null}
            </>
          }
        />
        <div className="xw-flow-foot">
          <Button variant="text" onClick={cancel}>
            {SETTINGS_PAGE.cancel}
          </Button>
          <div className="xw-actions">
            <Button
              variant="primary"
              type="submit"
              busy={update.busy}
              busyLabel={SETTINGS_PAGE.saving}
            >
              {SETTINGS_PAGE.save}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

/** The save's answer in `#Es-saved` (B4-06 `xr-notice--ok` "Settings saved."; the rest undrawn). */
function OutcomeNotice({ outcome }: { readonly outcome: Outcome }) {
  switch (outcome.kind) {
    case 'saved':
      return <Notice tone="ok" title={outcome.words} />;
    case 'unchanged':
      return <Notice tone="info" title={stateWords('FA-10.unchanged')} />;
    case 'stale':
      return (
        <Notice tone="warn" title={stateWords('FA-10.stale.title')}>
          {stateWords('FA-10.stale.line')}
        </Notice>
      );
    case 'policy-open':
      return (
        <Notice tone="warn" title={stateWords('FA-10.policy-open.title')}>
          {stateWords('FA-10.policy-open.line')}
        </Notice>
      );
    case 'unavailable':
      return (
        <Notice tone="err" title={stateWords('FA-10.unavailable.title')}>
          {stateWords('FA-10.unavailable.line')}
        </Notice>
      );
  }
}
