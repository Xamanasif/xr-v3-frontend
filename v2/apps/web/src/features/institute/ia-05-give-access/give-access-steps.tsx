'use client';

import type {
  GiveAccessOptions,
  GrantResult,
  PlannedGrant,
  StudentDirectoryRow,
} from '@xr/contracts/draft';
import { type AccessPlanStatus, FORMAT_META, inDisplayOrder, type Technology } from '@xr/domain';
import {
  Button,
  EmptyState,
  Field,
  FormatSet,
  Icon,
  type IconName,
  Link,
  LoadingState,
  Notice,
  ReadOnlyValue,
  SegmentedControl,
  Select,
  StatusPill,
  TextInput,
} from '@xr/ui';
import type { ReactNode } from 'react';

import { grantWords, planWords, wordsOf } from '@/copy/flow-state-words';
import { planTermWords } from '@/copy/institutions';
import { stateWords } from '@/copy/state-copy';
import {
  alreadyHasWords,
  courseOptionWords,
  courseSummaryWords,
  GIVE_ACCESS,
  groupChosenWords,
  groupWho,
  inheritedFromWords,
  licencesLineWords,
  memberCountWords,
  memberHasItWords,
  memberInactiveWords,
  membersCanOpenWords,
  memberWaitingWords,
  noLicenceWords,
  notInPlanHeading,
  planStandingWords,
  seesItWords,
  selectedCountWords,
  studentsChosenWords,
  summaryFormatsWords,
} from '@/copy/student-access';
import { addPersonAddress, STUDENT_ACCESS_ADDRESS } from '@/nav/institute';
import type { GiveChoice, useGiveAccessPreview } from '@/queries/student-access';

import { type Chosen, type Draft, FIELD_IDS } from './give-access-view';

type OptionExperiment = GiveAccessOptions['experiments'][number];

/** What "Give access" answered, with what the result lines name (B2-05 f3, f11). */
export interface GivenResult {
  readonly results: readonly GrantResult[];
  readonly planId: string;
  /** The group's name when access was given to a group. */
  readonly group: string | null;
  readonly experiments: readonly OptionExperiment[];
}

function formatCodes(formats: readonly Technology[]) {
  return inDisplayOrder(formats).map((format) => FORMAT_META[format].code);
}

/** The course on show: the one chosen, else the first in access. */
function courseOf(offered: GiveAccessOptions, draft: Draft) {
  return (
    offered.courses.find((course) => course.id === draft.courseId) ?? offered.courses[0] ?? null
  );
}

/** The step's footer (`xw-flow-foot`): the way back first, the step's action last. */
function FlowFoot({
  start,
  children,
}: {
  readonly start: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className="xw-flow-foot">
      {start}
      <div className="xw-actions">{children}</div>
    </div>
  );
}

// ---- step 1 · Experiments (B2-05 f0, f6, f10) ----

export function ExperimentsStep({
  offered,
  chosen,
  draft,
  planStatus,
  update,
  onContinue,
}: {
  readonly offered: GiveAccessOptions;
  readonly chosen: Chosen;
  readonly draft: Draft;
  readonly planStatus: AccessPlanStatus | null;
  readonly update: (patch: Partial<Draft>) => void;
  readonly onContinue: () => void;
}) {
  const { plan } = offered;
  const course = courseOf(offered, draft);
  const status = planStatus === null ? null : wordsOf(planWords(planStatus));
  const toggle = (experimentId: string) =>
    update({
      experimentIds: draft.experimentIds.includes(experimentId)
        ? draft.experimentIds.filter((id) => id !== experimentId)
        : [...draft.experimentIds, experimentId],
    });
  return (
    <div className="xr-section flex flex-col gap-5 p-6">
      <ReadOnlyValue label={GIVE_ACCESS.planLabel}>
        <span className="xr-id text-ink">{plan.id}</span>
        {status !== null ? planStandingWords(status, plan.licences, plan.endsOn) : null}
      </ReadOnlyValue>
      <Field id="give-access-course" label={GIVE_ACCESS.courseLabel}>
        <Select
          options={offered.courses.map((entry) => ({
            value: entry.id,
            label: courseOptionWords(entry.platformCode, entry.name),
          }))}
          value={course?.id ?? ''}
          onChange={(event) => update({ courseId: event.target.value, experimentIds: [] })}
        />
      </Field>
      <fieldset className="xr-fieldset m-0 min-w-0 border-0 p-0" id={FIELD_IDS.experiments}>
        <legend className="xr-legend mb-1 text-[16px] font-[700] text-ink">
          {GIVE_ACCESS.experimentsLegend}
        </legend>
        <p className="xw-note mb-3">
          <Icon name="readOnly" />
          <span>{GIVE_ACCESS.formatsNote}</span>
        </p>
        <ul className="xw-pick">
          {chosen.inPlan.map((entry) => {
            const id = `give-access-experiment-${entry.experimentId}`;
            return (
              <li key={entry.experimentId}>
                <div className="xw-pick-row">
                  <label htmlFor={id}>
                    <input
                      type="checkbox"
                      id={id}
                      checked={chosen.experiments.includes(entry)}
                      onChange={() => toggle(entry.experimentId)}
                    />
                    <span className="xw-pick-name">
                      <span className="font-[600]">{entry.name}</span>
                      <span className="xw-inherit">
                        {GIVE_ACCESS.inherit}
                        <FormatSet compact formats={formatCodes(entry.formats)} />
                      </span>
                    </span>
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
        {chosen.notInPlan.length > 0 && course ? (
          <div className="mt-4">
            <p className="xr-small mb-1 font-[700] text-ink-2">
              {notInPlanHeading(course.platformCode ?? course.name)}
            </p>
            {chosen.notInPlan.map((entry) => (
              <div key={entry.experimentId} className="xw-noplan pl-1">
                <span>{entry.name}</span>
                <span className="xw-tag">
                  <Icon name="readOnly" />
                  {GIVE_ACCESS.notInPlanTag}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </fieldset>
      <FlowFoot
        start={
          <Link className="xr-btn xr-btn--text" href={STUDENT_ACCESS_ADDRESS}>
            {GIVE_ACCESS.cancel}
          </Link>
        }
      >
        <Button variant="primary" onClick={onContinue}>
          {GIVE_ACCESS.continue}
        </Button>
      </FlowFoot>
    </div>
  );
}

// ---- step 2 · Students or a group (B2-05 f1, f4, f7, f9, f14) ----

export function StudentsStep({
  offered,
  chosen,
  draft,
  directory,
  update,
  onBack,
  onContinue,
}: {
  readonly offered: GiveAccessOptions;
  readonly chosen: Chosen;
  readonly draft: Draft;
  readonly directory: readonly StudentDirectoryRow[];
  readonly update: (patch: Partial<Draft>) => void;
  readonly onBack: () => void;
  readonly onContinue: () => void;
}) {
  const known = new Map(directory.map((row) => [row.student.id, row]));
  const search = draft.search.trim().toLowerCase();
  const listed = offered.students.filter((student) => {
    if (search === '') return true;
    const studentId = known.get(student.id)?.student.institutionStudentId ?? '';
    return `${student.name} ${studentId}`.toLowerCase().includes(search);
  });
  const inPlanNames = chosen.inPlan.map((entry) => entry.name);
  const toggle = (studentId: string) =>
    update({
      studentIds: draft.studentIds.includes(studentId)
        ? draft.studentIds.filter((id) => id !== studentId)
        : [...draft.studentIds, studentId],
    });
  return (
    <div className="xr-section flex flex-col gap-[18px] p-6">
      <SegmentedControl
        label={GIVE_ACCESS.giveTo}
        options={[
          { value: 'students', label: GIVE_ACCESS.students },
          { value: 'group', label: GIVE_ACCESS.aGroup },
        ]}
        value={draft.who}
        onValueChange={(who) => update({ who })}
      />
      {draft.who === 'students' ? (
        offered.students.length > 0 ? (
          <>
            <Field id="give-access-search" label={GIVE_ACCESS.searchStudents}>
              <TextInput
                type="search"
                placeholder={GIVE_ACCESS.searchStudentsPlaceholder}
                value={draft.search}
                onChange={(event) => update({ search: event.target.value })}
              />
            </Field>
            <p className="xr-meta" role="status">
              {selectedCountWords(chosen.students.length)}
            </p>
            {listed.length > 0 ? (
              <ul className="xw-pick" aria-label={GIVE_ACCESS.studentsList} id={FIELD_IDS.students}>
                {listed.map((student) => {
                  const id = `give-access-student-${student.id}`;
                  const row = known.get(student.id);
                  const groups = row?.groups.map((group) => group.name) ?? [];
                  return (
                    <li key={student.id}>
                      <div className={student.selectable ? 'xw-pick-row' : 'xw-pick-row is-off'}>
                        <label htmlFor={id}>
                          <input
                            type="checkbox"
                            id={id}
                            checked={chosen.students.includes(student)}
                            disabled={!student.selectable}
                            onChange={() => toggle(student.id)}
                          />
                          <span className="xw-pick-name">
                            <span className="font-[600]">{student.name}</span>
                            {row ? (
                              <span className="xr-meta">
                                {[row.student.institutionStudentId, ...groups].join(' · ')}
                              </span>
                            ) : null}
                          </span>
                        </label>
                        {student.why === 'already-has-it' ? (
                          <span className="xw-pick-state">
                            <Icon name="done" />
                            {alreadyHasWords(inPlanNames)}
                          </span>
                        ) : null}
                        {student.why === 'inactive' ? (
                          <span className="xw-pick-state">
                            <Icon name="notAvailable" />
                            {GIVE_ACCESS.inactive}
                          </span>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="xr-body text-ink-2">{GIVE_ACCESS.noStudentMatch}</p>
            )}
          </>
        ) : (
          <EmptyState
            icon="studentsPeople"
            title={GIVE_ACCESS.noStudentsTitle}
            headingLevel={3}
            actions={
              <div className="flex flex-wrap gap-3">
                <Link className="xr-btn xr-btn--secondary" href={addPersonAddress('student')}>
                  {GIVE_ACCESS.addStudent}
                </Link>
              </div>
            }
          >
            {GIVE_ACCESS.noStudentsLine}
          </EmptyState>
        )
      ) : (
        <>
          <fieldset className="m-0 min-w-0 border-0 p-0" id={FIELD_IDS.groups}>
            <legend className="xr-sr">{GIVE_ACCESS.groups}</legend>
            <ul className="xw-pick">
              {offered.groups.map((group) => {
                const id = `give-access-group-${group.id}`;
                return (
                  <li key={group.id}>
                    <div className={group.selectable ? 'xw-pick-row' : 'xw-pick-row is-off'}>
                      <label htmlFor={id}>
                        <input
                          type="radio"
                          name="give-access-group"
                          id={id}
                          checked={chosen.group?.id === group.id}
                          disabled={!group.selectable}
                          onChange={() => update({ groupId: group.id })}
                        />
                        <span className="xw-pick-name">
                          <span className="font-[600]">{group.name}</span>
                          <span className="xr-meta">{memberCountWords(group.memberCount)}</span>
                        </span>
                      </label>
                      {group.selectable ? null : (
                        <span className="xw-pick-state">{GIVE_ACCESS.groupEmpty}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </fieldset>
          <p className="xr-meta">{GIVE_ACCESS.groupNote}</p>
        </>
      )}
      <FlowFoot
        start={
          <Button variant="text" onClick={onBack}>
            {GIVE_ACCESS.backStep}
          </Button>
        }
      >
        <Button variant="primary" onClick={onContinue}>
          {GIVE_ACCESS.continue}
        </Button>
      </FlowFoot>
    </div>
  );
}

// ---- step 3 · Review and give access (B2-05 f2, f5, f8, f11, f12) ----

/** "Active" or the supplied "Waiting for a licence" (never computed, T-06 / D7). */
function GrantPill({ waiting }: { readonly waiting: boolean }) {
  const display = waiting ? 'waiting-for-a-licence' : 'active';
  return <StatusPill tone={waiting ? 'wait' : 'ok'}>{wordsOf(grantWords(display))}</StatusPill>;
}

interface MemberLine {
  readonly key: string;
  readonly icon: IconName;
  readonly words: string;
}

/**
 * B2-05 `gsum` for one planned group grant: how many members can open it straight away, then each
 * member waiting (supplied), already having it individually, inactive — and, where the overlap is
 * undecided (OD-B2-01), that it is not decided (state-copy), never a can / can't.
 */
function memberLines(planned: PlannedGrant): readonly MemberLine[] {
  const canOpen = planned.reaches.filter((reach) => reach.standing === 'can-open-it').length;
  const lines: MemberLine[] = [
    {
      key: 'can-open',
      icon: 'done',
      words: canOpen === 1 ? stateWords('IA-05.members.one') : membersCanOpenWords(canOpen),
    },
  ];
  const each = (
    match: (reach: PlannedGrant['reaches'][number]) => boolean,
    icon: IconName,
    words: (reach: PlannedGrant['reaches'][number]) => string,
  ) => {
    for (const reach of planned.reaches.filter(match)) {
      lines.push({ key: `${icon}-${reach.studentId}`, icon, words: words(reach) });
    }
  };
  each(
    (reach) => reach.standing === 'waiting-for-a-licence',
    'clock',
    (reach) => memberWaitingWords(reach.name),
  );
  each(
    (reach) => reach.standing === 'has-it-individually',
    'info',
    (reach) => memberHasItWords(reach.name, reach.individualGrantId ?? ''),
  );
  each(
    (reach) => typeof reach.standing === 'object',
    'info',
    (reach) => `${reach.name}: ${stateWords('IA-05.member.policy-open')}`,
  );
  each(
    (reach) => reach.standing === 'inactive',
    'notAvailable',
    (reach) => memberInactiveWords(reach.name),
  );
  return lines;
}

export function ReviewStep({
  offered,
  chosen,
  draft,
  choice,
  preview,
  busy,
  onBack,
  onGive,
}: {
  readonly offered: GiveAccessOptions;
  readonly chosen: Chosen;
  readonly draft: Draft;
  readonly choice: GiveChoice;
  readonly preview: ReturnType<typeof useGiveAccessPreview>;
  readonly busy: boolean;
  readonly onBack: () => void;
  readonly onGive: () => void;
}) {
  const { plan } = offered;
  const course = courseOf(offered, draft);
  const names = new Map(offered.experiments.map((entry) => [entry.experimentId, entry.name]));
  const keys = GIVE_ACCESS.summaryKeys;
  const group = choice.target.kind === 'group' ? chosen.group : null;
  const planned = preview.data?.ok ? preview.data.value : null;
  return (
    <div className="xr-section flex flex-col gap-5 p-6">
      <dl className="xp-kv m-0 grid grid-cols-[150px_minmax(0,1fr)] gap-x-5 gap-y-[10px] text-[15px] leading-[22px]">
        <dt className="font-[700] text-ink">{keys.course}</dt>
        <dd className="m-0 text-ink-2">
          {course ? courseSummaryWords(course.platformCode, course.name) : null}
        </dd>
        <dt className="font-[700] text-ink">{keys.experiments}</dt>
        <dd className="m-0 text-ink-2">
          {chosen.experiments.map((entry) => entry.name).join(', ')}
        </dd>
        <dt className="font-[700] text-ink">{keys.formats}</dt>
        <dd className="m-0 text-ink-2">
          <FormatSet compact formats={formatCodes(chosen.formats)} />
          <span className="xw-sub">{inheritedFromWords(plan.id)}</span>
        </dd>
        <dt className="font-[700] text-ink">{group ? keys.group : keys.students}</dt>
        <dd className="m-0 text-ink-2">
          {group
            ? groupChosenWords(group.name, group.memberCount)
            : studentsChosenWords(chosen.students.map((student) => student.name))}
        </dd>
      </dl>
      <div>
        <h3 className="xr-h3 mb-[10px]">{GIVE_ACCESS.whatWillBeCreated}</h3>
        {preview.isError ? (
          <Notice tone="err">{stateWords('IA-05.review.failed')}</Notice>
        ) : preview.data && !preview.data.ok ? (
          <Notice tone="err">{stateWords('IA-05.give.refused')}</Notice>
        ) : planned === null ? (
          <LoadingState label={stateWords('IA-05.review.loading')} surface={null} lines={2} />
        ) : group ? (
          planned.map((grant) => (
            <div key={grant.experimentId}>
              <p className="xr-body mb-[10px]">
                <strong>{groupWho(group.name)}</strong> → {names.get(grant.experimentId)} →{' '}
                <GrantPill waiting={false} />
              </p>
              <ul className="xw-result">
                {memberLines(grant).map((line) => (
                  <li key={line.key}>
                    <Icon name={line.icon} />
                    <span className="xw-grow">{line.words}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <ul className="xw-result">
            {planned.map((grant) => (
              <li key={`${grant.who}-${grant.experimentId}`}>
                <strong>{grant.who}</strong>
                <span className="xw-arrow" aria-hidden="true">
                  →
                </span>
                <span>{names.get(grant.experimentId)}</span>
                <span className="xw-arrow" aria-hidden="true">
                  →
                </span>
                <GrantPill
                  waiting={grant.reaches.some(
                    (reach) => reach.standing === 'waiting-for-a-licence',
                  )}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      <ReadOnlyValue label={GIVE_ACCESS.licences}>
        {licencesLineWords(plan.id, plan.licences, planTermWords(plan.term), plan.endsOn)}
      </ReadOnlyValue>
      <FlowFoot
        start={
          <Button variant="text" onClick={onBack}>
            {GIVE_ACCESS.backStep}
          </Button>
        }
      >
        <Button
          id={FIELD_IDS.give}
          variant="primary"
          busy={busy}
          busyLabel={GIVE_ACCESS.giving}
          onClick={onGive}
        >
          {GIVE_ACCESS.give}
        </Button>
      </FlowFoot>
    </div>
  );
}

// ---- the result (B2-05 f3, f11) ----

export function ResultSection({
  given,
  onRestart,
}: {
  readonly given: GivenResult;
  readonly onRestart: () => void;
}) {
  const experiments = new Map(given.experiments.map((entry) => [entry.experimentId, entry]));
  return (
    <div className="xr-section flex flex-col gap-[18px] p-6">
      <ul className="xw-result" aria-label={GIVE_ACCESS.resultList}>
        {given.results.map((result) => {
          const experiment = experiments.get(result.experimentId);
          const waiting = result.display === 'waiting-for-a-licence' && result.wait !== null;
          return (
            <li key={result.grantId} className="flex-col items-start gap-1.5">
              <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <strong>{given.group !== null ? groupWho(given.group) : result.who}</strong>
                <span className="xw-arrow" aria-hidden="true">
                  →
                </span>
                <span>{experiment?.name ?? result.experimentId}</span>
                <span className="xw-arrow" aria-hidden="true">
                  →
                </span>
                <span className="xr-id text-ink">{result.grantId}</span>
                <GrantPill waiting={waiting} />
              </span>
              <span className="xr-meta">
                {given.group !== null
                  ? GIVE_ACCESS.groupResultNote
                  : waiting
                    ? noLicenceWords(result.who, given.planId)
                    : seesItWords(result.who, experiment?.formats ?? [])}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="xw-actions">
        <Link className="xr-btn xr-btn--primary" href={STUDENT_ACCESS_ADDRESS}>
          {GIVE_ACCESS.viewStudentAccess}
        </Link>
        <Button variant="secondary" onClick={onRestart}>
          {GIVE_ACCESS.giveMore}
        </Button>
      </div>
    </div>
  );
}

// ---- "Your selection" (`aside.xw-sum` from 860 px of content, `details.xw-sumbar` below) ----

export function SelectionSummary({
  offered,
  chosen,
  draft,
  variant,
}: {
  readonly offered: GiveAccessOptions;
  readonly chosen: Chosen;
  readonly draft: Draft;
  readonly variant: 'aside' | 'bar';
}) {
  const course = courseOf(offered, draft);
  const keys = GIVE_ACCESS.summaryKeys;
  const who =
    draft.who === 'group'
      ? chosen.group
        ? groupChosenWords(chosen.group.name, chosen.group.memberCount)
        : GIVE_ACCESS.notChosen
      : studentsChosenWords(chosen.students.map((student) => student.name));
  const list = (
    <dl>
      <dt>{GIVE_ACCESS.planLabel}</dt>
      <dd>
        <span className="xr-id text-ink-2">{offered.plan.id}</span>
        {course ? ` · ${course.platformCode ?? course.name}` : null}
      </dd>
      <dt>{keys.experiments}</dt>
      <dd>
        {chosen.experiments.length > 0
          ? chosen.experiments.map((entry) => entry.name).join(', ')
          : GIVE_ACCESS.notChosen}
      </dd>
      <dt>{keys.formats}</dt>
      <dd>{summaryFormatsWords(chosen.formats)}</dd>
      <dt>{draft.who === 'group' ? keys.group : keys.students}</dt>
      <dd>{who}</dd>
    </dl>
  );
  if (variant === 'bar') {
    return (
      <details className="xw-sumbar">
        <summary>
          {GIVE_ACCESS.selection}
          <Icon name="chevronDown" />
        </summary>
        {list}
      </details>
    );
  }
  return (
    <aside className="xw-sum" aria-labelledby="give-access-selection">
      <h2 id="give-access-selection" className="xw-sum-title">
        {GIVE_ACCESS.selection}
      </h2>
      {list}
    </aside>
  );
}
