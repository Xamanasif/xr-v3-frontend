'use client';

import type { AssessmentView, SubmissionRow } from '@xr/contracts/draft';
import type { AssessmentRules } from '@xr/domain';
import {
  ButtonLink,
  FaActions,
  FaAside,
  FaChecklist,
  FaDetail,
  FaMainSheet,
  FaPanel,
  FaRecordIntro,
  FaRecordLine,
  FaRecordPanelLead,
  FaRecordRules,
  FaRecordSection,
  FaRecordWaitList,
  Hint,
  Notice,
  PendingHint,
  TextLink,
} from '@xr/ui/v3';

import {
  CREATED_BY_YOU,
  createdLine,
  draftLine,
  type EarlierSubmission,
  keepWords,
  passMarkWords,
  reachWords,
  readyLine,
  releaseRuleWords,
  SUMMARY_WORDS,
  type VersionChange,
  versionLead,
  versionTitle,
  waitedSinceWords,
  writtenWaitingWords,
} from '@/copy/assessment-record';
import { deadlineWords, questionsAndMarks } from '@/copy/assessment-words';
import { dateTime } from '@/copy/dates';
import { stateWords } from '@/copy/state-copy';
import { SUMMARY_ACTIONS } from '@/copy/submissions';
import { assessmentAddress, markingQueueAddress, markSubmissionAddress } from '@/nav/faculty';
import { useMarkingQueue, useSubmissions } from '@/queries/faculty-assessment-work';
import { useSession } from '@/queries/session';

import {
  AssessmentFallback,
  AssessmentFrame,
  type AssessmentFrameView,
  otherActor,
  TAB_HEADING_ID,
  useAssessmentPage,
} from '../shared/assessment-frame';

const VERSIONS_ID = 'summary-versions';
const RULES_ID = 'summary-rules';
const REACH_ID = 'summary-reach';
const SUBMISSIONS_ID = 'summary-submissions';

/**
 * FA-08 Assessment · Summary in the V3 Refined B design (FA-v1 `Main.dc.html` "FA-08 Summary",
 * `vmRecord` `AS`), at `/faculty/assessments/[assessmentId]`, inside the record frame (crumbs,
 * record band, tabs).
 *
 * - **Ready to use** / **Draft — not ready**: what the readiness means for Students — Ready is
 *   visible to every Student who has the experiment; there is no availability lifecycle and no
 *   "Make available" (T-18). The checklist: the name and introduction, the rules ("Rules set for
 *   this assessment" or "Rules — not finished") and the questions with their marks, or "At least
 *   one question — none yet" with "Add questions" (the Questions tab).
 * - **Versions** once a change made a new version: "Version 2 since …" and what the change touched,
 *   with whose submissions keep which version (`listSubmissions`, read only then; until it answers,
 *   `FA-08.version-keeps`).
 * - **Rules as set for this assessment**: each rule exactly as set, "Not set yet" for none — no
 *   default anywhere (BC6); no time limit (T-22); the introduction students read first; who created
 *   it and since when it is Ready; "Change settings" (the Settings tab).
 * - **Who it reaches**: the reach the service counts from Student access; formats never change it.
 * - **Submissions** (the side panel): while written answers wait, who and since when, oldest first
 *   (MarkingService `listQueue`), with "Mark next" (FA-19 of the oldest; until the queue answers,
 *   Marking for this assessment — `FA-08.mark-next`); otherwise "Nothing is waiting for marking." or
 *   "No submissions yet."; what a change would do now; "See submissions" (the Submissions tab).
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

/** Every rule is set (the export's `rulesOk`): what makes the checklist's rules line done. */
function rulesSet(rules: AssessmentRules): boolean {
  return (
    rules.passMarkPercent !== null &&
    rules.attemptsAllowed !== null &&
    rules.deadline !== null &&
    rules.release !== null &&
    (rules.release.option !== 'on-date' || rules.release.releaseDate !== null)
  );
}

/** What the change that made the current version touched, and who made it. */
export function versionChange(
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
    who: otherActor(made.actor, viewer),
  };
}

/** The submissions on an earlier version than `version`, oldest first (the export's `keepText`). */
export function earlierSubmissions(
  rows: readonly SubmissionRow[] | null,
  version: number,
): EarlierSubmission[] | null {
  if (rows === null) return null;
  return rows
    .filter((row) => row.attempt.assessmentVersion < version)
    .map((row) => ({ student: row.student.fullName, version: row.attempt.assessmentVersion }));
}

function SummaryBody({ view }: { readonly view: AssessmentFrameView }) {
  const session = useSession();
  const viewer = session.status === 'signed-in' ? session.personId : null;
  const institution = session.status === 'signed-in' ? session.session.institutionName : null;
  const { record, row } = view;
  const { assessment, readiness, reach, totalMarks, passMarkMarks, submittedOnCurrentVersion } =
    record;
  const { rules } = assessment;
  const experiment = view.experiment?.experiment.name ?? stateWords('FA-08.experiment-unknown');
  const ready = readiness === 'ready';
  const questions = assessment.questions.length;
  const creator = otherActor(assessment.createdBy, viewer);
  const own = creator === null;
  const submitted = row?.submitted ?? 0;
  const waiting = row?.waitingForMarking ?? 0;
  const queue = useMarkingQueue(assessment.id, 'waiting', waiting > 0);
  const waitingRows = queue.data?.ok ? queue.data.value : [];
  // FA-19 for the oldest submission waiting; until the queue is read, the queue of this assessment.
  const oldest = waitingRows[0]?.attempt.id ?? null;
  const markNext =
    oldest === null
      ? markingQueueAddress({ assessmentId: assessment.id })
      : markSubmissionAddress(oldest);
  // Whose submissions keep an earlier version: read only once there is one.
  const submissions = useSubmissions(assessment.id, assessment.version > 1);
  const earlier = earlierSubmissions(
    submissions.data?.ok ? submissions.data.value : null,
    assessment.version,
  );
  const notSet = SUMMARY_WORDS.notSetYet;
  const hasRules = rulesSet(rules);
  const version = versionChange(assessment, viewer);

  const panelNote = waiting > 0 ? SUMMARY_WORDS.oldestFirst : undefined;
  const subNote =
    submittedOnCurrentVersion > 0
      ? SUMMARY_WORDS.pinnedNote
      : submitted > 0
        ? SUMMARY_WORDS.earlierNote
        : ready
          ? SUMMARY_WORDS.freeNote
          : SUMMARY_WORDS.draftNote;

  return (
    <FaDetail asideFirst>
      <FaMainSheet>
        <FaRecordSection
          titleId={TAB_HEADING_ID}
          title={ready ? SUMMARY_WORDS.readyTitle : SUMMARY_WORDS.draftTitle}
          titleFocus
        >
          <FaRecordLine>{ready ? readyLine(experiment) : draftLine(questions > 0)}</FaRecordLine>
          <FaChecklist
            label={SUMMARY_WORDS.checklist}
            items={[
              {
                key: 'name',
                text: SUMMARY_WORDS.nameCheck,
                done: assessment.name.trim() !== '',
              },
              {
                key: 'rules',
                text: hasRules ? SUMMARY_WORDS.rulesSet : SUMMARY_WORDS.rulesNotFinished,
                done: hasRules,
              },
              {
                key: 'questions',
                text:
                  questions > 0
                    ? questionsAndMarks(questions, totalMarks)
                    : SUMMARY_WORDS.noQuestionCheck,
                done: questions > 0,
              },
            ]}
          />
          {own && questions === 0 ? (
            <FaActions apart>
              <ButtonLink variant="primary" href={assessmentAddress(assessment.id, 'questions')}>
                {SUMMARY_WORDS.addQuestions}
              </ButtonLink>
            </FaActions>
          ) : null}
        </FaRecordSection>
        {assessment.version > 1 ? (
          <FaRecordSection titleId={VERSIONS_ID} title={SUMMARY_WORDS.versionsTitle}>
            <Notice
              tone="info"
              icon="infoDisc"
              title={versionTitle(assessment.version, assessment.versionSince)}
            >
              {`${versionLead(version.change, version.who)} ${keepWords(assessment.version, earlier)}`}
            </Notice>
          </FaRecordSection>
        ) : null}
        <FaRecordSection
          titleId={RULES_ID}
          title={SUMMARY_WORDS.rulesTitle}
          link={
            own ? (
              <TextLink href={assessmentAddress(assessment.id, 'settings')}>
                {SUMMARY_WORDS.changeSettings}
              </TextLink>
            ) : undefined
          }
        >
          <FaRecordRules
            items={[
              {
                key: 'pass',
                term: SUMMARY_WORDS.passMark,
                value:
                  rules.passMarkPercent === null
                    ? notSet
                    : passMarkWords(rules.passMarkPercent, passMarkMarks, totalMarks),
                quiet: rules.passMarkPercent === null,
              },
              {
                key: 'attempts',
                term: SUMMARY_WORDS.attempts,
                value: rules.attemptsAllowed === null ? notSet : String(rules.attemptsAllowed),
                quiet: rules.attemptsAllowed === null,
              },
              {
                key: 'deadline',
                term: SUMMARY_WORDS.deadline,
                value: rules.deadline === null ? notSet : deadlineWords(rules.deadline),
                quiet: rules.deadline === null,
              },
              {
                key: 'release',
                term: SUMMARY_WORDS.release,
                value:
                  rules.release === null
                    ? SUMMARY_WORDS.notChosenYet
                    : releaseRuleWords(
                        rules.release.option,
                        rules.release.releaseDate === null
                          ? null
                          : dateTime(rules.release.releaseDate),
                      ),
                quiet: rules.release === null,
              },
              { key: 'time', term: SUMMARY_WORDS.timeLimit, value: SUMMARY_WORDS.none },
            ]}
          />
          <FaRecordIntro label={SUMMARY_WORDS.introduction} quiet={!assessment.introduction}>
            {assessment.introduction ?? stateWords('FA-08.introduction-none')}
          </FaRecordIntro>
          <Hint under="box">
            {createdLine({
              createdAt: assessment.createdAt,
              by: creator ?? CREATED_BY_YOU,
              readySince: assessment.readySince,
              version: assessment.version,
              versionSince: assessment.versionSince,
            })}
          </Hint>
        </FaRecordSection>
        <FaRecordSection titleId={REACH_ID} title={SUMMARY_WORDS.reachTitle}>
          <FaRecordLine>{reachWords(reach, experiment, institution)}</FaRecordLine>
          <Hint under="line">{SUMMARY_WORDS.reachNote}</Hint>
        </FaRecordSection>
      </FaMainSheet>
      <FaAside labelledBy={SUBMISSIONS_ID}>
        <FaPanel title={SUMMARY_WORDS.submissionsTitle} titleId={SUBMISSIONS_ID} note={panelNote}>
          {waiting > 0 ? (
            <>
              <PendingHint>{writtenWaitingWords(waiting)}</PendingHint>
              {waitingRows.length > 0 ? (
                <FaRecordWaitList
                  label={SUMMARY_WORDS.waitListLabel}
                  items={waitingRows.map((entry) => ({
                    key: entry.attempt.id,
                    name: entry.student.fullName,
                    when: waitedSinceWords(entry.submittedAt),
                  }))}
                />
              ) : null}
              <ButtonLink variant="primary" className="rk-go" href={markNext}>
                {SUMMARY_ACTIONS.markNext}
              </ButtonLink>
            </>
          ) : submitted > 0 || ready ? (
            <FaRecordPanelLead>
              {submitted > 0 ? SUMMARY_WORDS.nothingWaiting : SUMMARY_WORDS.noSubmissions}
            </FaRecordPanelLead>
          ) : null}
          <Hint>{subNote}</Hint>
          <ButtonLink href={assessmentAddress(assessment.id, 'submissions')}>
            {SUMMARY_ACTIONS.seeSubmissions}
          </ButtonLink>
        </FaPanel>
      </FaAside>
    </FaDetail>
  );
}
