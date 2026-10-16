'use client';

import type { AssessmentView } from '@xr/contracts/draft';
import type { ActorRef, AssessmentRules } from '@xr/domain';
import { Icon, Link, Notice, Section, SectionBody, StatusPill } from '@xr/ui';

import {
  CREATED_BY_YOU,
  createdLine,
  draftLine,
  type MissingRule,
  passMarkWords,
  reachWords,
  readyLine,
  rulesMissingWords,
  submittedNotice,
  submittedWords,
  SUMMARY_WORDS,
  type VersionChange,
  versionLine,
  versionTitle,
  waitingWords,
} from '@/copy/assessment-record';
import {
  deadlineWords,
  questionsAndMarks,
  READINESS_WORDS,
  releaseValueWords,
  rulesChecklistLine,
} from '@/copy/assessment-words';
import { stateWords } from '@/copy/state-copy';
import { SUMMARY_ACTIONS } from '@/copy/submissions';
import { assessmentAddress, markingQueueAddress, markSubmissionAddress } from '@/nav/faculty';
import { useMarkingQueue } from '@/queries/faculty-assessment-work';
import { useSession } from '@/queries/session';

import {
  AssessmentFallback,
  AssessmentFrame,
  type AssessmentFrameView,
  useAssessmentPage,
} from '../shared/assessment-frame';

/**
 * FA-08 Assessment · Summary — board B4-05 f0, f3, f4 (f5 at 375), at
 * `/faculty/assessments/[assessmentId]`, inside the record frame (header and tabs).
 *
 * - **Ready to use**: the readiness and what it means for Students — Ready is visible to every
 *   Student who has the experiment; there is no availability lifecycle and no "Make available"
 *   (T-18). The checklist: the name (the introduction is optional), every rule
 *   (`rulesChecklistLine`, or the rules not set yet) and the questions with their marks, or "At
 *   least one question — none yet" with "Add questions" (the Questions tab).
 * - **Submissions** only once a Student has submitted: "<n> of <reach> submitted" and the
 *   waiting-for-marking chip; the quiet notice that a change makes a new version, or — once one
 *   has — "Version <n> since <date>" with what changed. Since Phase 4B: "Mark next" (FA-19, the
 *   oldest submission of this assessment waiting, while one waits — `FA-08.mark-next`,
 *   `FA-12.mark-next-target`) and "See submissions" (the Submissions tab, FA-12).
 * - **Who it reaches**: the reach the service counts from Student access; formats never change it.
 * - **Rules as set for this assessment**: each rule exactly as set, "Not set yet" for none — no
 *   default anywhere (BC6); no time limit (T-22); who created it and since when it is Ready, with
 *   "Change settings" (the Settings tab).
 */
export function AssessmentSummary({ assessmentId }: { readonly assessmentId: string }) {
  const state = useAssessmentPage(assessmentId, 'summary');
  if (state.kind !== 'ready') return <AssessmentFallback state={state} />;
  return (
    <AssessmentFrame view={state.view} tab="summary">
      <SummaryBody view={state.view} />
    </AssessmentFrame>
  );
}

/** The rules not set yet, in the order "Rules as set" lists them. */
function missingRules(rules: AssessmentRules): MissingRule[] {
  return [
    ...(rules.passMarkPercent === null ? (['passMark'] as const) : []),
    ...(rules.attemptsAllowed === null ? (['attempts'] as const) : []),
    ...(rules.deadline === null ? (['deadline'] as const) : []),
    ...(rules.release === null ? (['release'] as const) : []),
    ...(rules.release?.option === 'on-date' && rules.release.releaseDate === null
      ? (['releaseDate'] as const)
      : []),
  ];
}

/** "You", or the person's name (`FA-08.version-actor`, `FA-08.created-by-other`). */
function actorWords(actor: ActorRef, viewer: string | null): string | null {
  switch (actor.kind) {
    case 'person':
      return actor.personId === viewer ? null : actor.displayName;
    case 'requester':
      return actor.name;
    case 'system':
      return null;
  }
}

/** What the change that made the current version touched, and who made it. */
function versionChange(
  assessment: AssessmentView['assessment'],
  viewer: string | null,
): { readonly change: VersionChange; readonly who: string | null } {
  const made = assessment.history.findLast((entry) => entry.event === 'new-version');
  if (!made) return { change: 'unknown', who: null };
  const together = assessment.history.filter((entry) => entry.at === made.at);
  const rules = together.some((entry) => entry.event === 'settings-saved');
  const questions = together.some((entry) => entry.event === 'questions-changed');
  return {
    change: rules && questions ? 'both' : questions ? 'questions' : rules ? 'rules' : 'unknown',
    who: actorWords(made.actor, viewer),
  };
}

function SummaryBody({ view }: { readonly view: AssessmentFrameView }) {
  const session = useSession();
  const viewer = session.status === 'signed-in' ? session.personId : null;
  const institution = session.status === 'signed-in' ? session.session.institutionName : null;
  const { record, row } = view;
  const { assessment, readiness, reach, totalMarks, passMarkMarks } = record;
  const { rules } = assessment;
  const experiment = view.experiment?.experiment.name ?? stateWords('FA-08.experiment-unknown');
  const readinessWords = READINESS_WORDS[readiness];
  const missing = missingRules(rules);
  const questions = assessment.questions.length;
  const checklistRules = missing.length === 0 ? rulesChecklistLine(rules) : null;
  const notSet = stateWords('FA-08.rule-not-set');
  const reachLine = reachWords(reach, experiment, institution);
  const creator = actorWords(assessment.createdBy, viewer) ?? CREATED_BY_YOU;
  const waiting = row?.waitingForMarking ?? 0;
  const queue = useMarkingQueue(assessment.id, 'waiting', waiting > 0);
  // FA-19 for the oldest submission waiting; until the queue is read, the queue of this assessment.
  const oldest = queue.data?.ok ? (queue.data.value[0]?.attempt.id ?? null) : null;
  const markNext =
    oldest === null
      ? markingQueueAddress({ assessmentId: assessment.id })
      : markSubmissionAddress(oldest);

  return (
    <div className="xw-stack">
      <Section title={SUMMARY_WORDS.readyTitle}>
        <SectionBody>
          <div className="mb-[14px] flex flex-wrap items-center gap-x-3 gap-y-2">
            <StatusPill tone={readinessWords.tone}>{readinessWords.label}</StatusPill>
            <span className="xl-meta">
              {readiness === 'ready'
                ? readyLine(experiment)
                : draftLine(missing.length > 0, questions === 0)}
            </span>
          </div>
          <ul className="xa-check">
            <CheckItem ok>{SUMMARY_WORDS.nameCheck}</CheckItem>
            <CheckItem ok={checklistRules !== null}>
              {checklistRules ?? rulesMissingWords(missing)}
            </CheckItem>
            <CheckItem ok={questions > 0}>
              {questions > 0
                ? questionsAndMarks(questions, totalMarks)
                : SUMMARY_WORDS.noQuestionCheck}
            </CheckItem>
          </ul>
          {questions === 0 ? (
            <div className="xw-actions mt-4">
              <Link
                className="xr-btn xr-btn--primary"
                href={assessmentAddress(assessment.id, 'questions')}
              >
                {SUMMARY_WORDS.addQuestions}
              </Link>
            </div>
          ) : null}
        </SectionBody>
      </Section>

      {row && row.submitted > 0 ? (
        <Section title={SUMMARY_WORDS.submissionsTitle}>
          <SectionBody>
            <p className="xr-body m-0 mb-3">
              {submittedWords(row.submitted, reach)}
              {row.waitingForMarking > 0 ? (
                <>
                  {' · '}
                  <StatusPill tone="wait">{waitingWords(row.waitingForMarking)}</StatusPill>
                </>
              ) : null}
            </p>
            {assessment.version > 1 ? (
              <VersionNotice assessment={assessment} viewer={viewer} />
            ) : (
              <Notice tone="quiet">{submittedNotice(row.submitted)}</Notice>
            )}
            <div className="xw-actions mt-4">
              {waiting > 0 ? (
                <Link className="xr-btn xr-btn--primary" href={markNext}>
                  {SUMMARY_ACTIONS.markNext}
                </Link>
              ) : null}
              <Link
                className="xr-btn xr-btn--secondary"
                href={assessmentAddress(assessment.id, 'submissions')}
              >
                {SUMMARY_ACTIONS.seeSubmissions}
              </Link>
            </div>
          </SectionBody>
        </Section>
      ) : null}

      <Section title={SUMMARY_WORDS.reachTitle}>
        <SectionBody>
          <p className="xr-body m-0">
            {reachLine.strong ? <strong>{reachLine.strong}</strong> : null}
            {reachLine.rest} {SUMMARY_WORDS.reachFormats}
          </p>
          <p className="xl-meta [margin:8px_0_0]">{SUMMARY_WORDS.reachNote}</p>
        </SectionBody>
      </Section>

      <Section title={SUMMARY_WORDS.rulesTitle}>
        <SectionBody>
          <dl className="xp-kv m-0 grid grid-cols-[180px_minmax(0,1fr)] gap-x-5 gap-y-[10px] text-[15px] leading-[22px]">
            <dt className="font-[700] text-ink">{SUMMARY_WORDS.introduction}</dt>
            <dd className="m-0 text-ink-2">
              {assessment.introduction ?? stateWords('FA-08.introduction-none')}
            </dd>
            <dt className="font-[700] text-ink">{SUMMARY_WORDS.passMark}</dt>
            <dd className="m-0 text-ink-2">
              {rules.passMarkPercent === null
                ? notSet
                : passMarkWords(rules.passMarkPercent, passMarkMarks, totalMarks)}
            </dd>
            <dt className="font-[700] text-ink">{SUMMARY_WORDS.attempts}</dt>
            <dd className="m-0 text-ink-2">
              {rules.attemptsAllowed === null ? notSet : String(rules.attemptsAllowed)}
            </dd>
            <dt className="font-[700] text-ink">{SUMMARY_WORDS.deadline}</dt>
            <dd className="m-0 text-ink-2">
              {rules.deadline === null ? notSet : deadlineWords(rules.deadline)}
            </dd>
            <dt className="font-[700] text-ink">{SUMMARY_WORDS.release}</dt>
            <dd className="m-0 text-ink-2">{releaseValueWords(rules.release) ?? notSet}</dd>
            <dt className="font-[700] text-ink">{SUMMARY_WORDS.timeLimit}</dt>
            <dd className="m-0 text-ink-2">{SUMMARY_WORDS.noTimeLimit}</dd>
          </dl>
          <p className="xl-meta [margin:12px_0_0]">
            {createdLine(assessment.createdAt, creator, assessment.readySince)}
            <Link href={assessmentAddress(assessment.id, 'settings')}>
              {SUMMARY_WORDS.changeSettings}
            </Link>
          </p>
        </SectionBody>
      </Section>
    </div>
  );
}

/** One checklist item: the done tick (`span.is-ok`) or the waiting clock (`span.is-no`). */
function CheckItem({ ok, children }: { readonly ok: boolean; readonly children: string }) {
  return (
    <li>
      <span className={ok ? 'is-ok' : 'is-no'}>
        <Icon name={ok ? 'done' : 'clock'} />
      </span>
      <span>{children}</span>
    </li>
  );
}

/** B4-05 f4: "Version 2 since 8 Nov 2026" and what the change touched. */
function VersionNotice({
  assessment,
  viewer,
}: {
  readonly assessment: AssessmentView['assessment'];
  readonly viewer: string | null;
}) {
  const { change, who } = versionChange(assessment, viewer);
  return (
    <Notice title={versionTitle(assessment.version, assessment.versionSince)}>
      {versionLine(change, who, assessment.version)}
    </Notice>
  );
}
