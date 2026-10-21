'use client';

import type {
  GiveAccessOptions,
  GrantResult,
  PlannedGrant,
  StudentDirectoryRow,
} from '@xr/contracts/draft';
import type { AccessPlanStatus } from '@xr/domain';
import {
  Button,
  ButtonLink,
  DefinitionList,
  Hint,
  IaActions,
  IaBusyButton,
  IaExperimentChoices,
  IaField,
  IaFormatBadges,
  IaFormatsWith,
  type IaGivenRow,
  IaGivenList,
  IaGroupFlow,
  type IaLineItem,
  IaLines,
  IaNotInPlanList,
  IaPickList,
  IaPickSearch,
  IaRow,
  IaSelectionFold,
  IaSelectionPanel,
  IaStack,
  IaStepPart,
  IaViewSwitch,
  ListState,
  LoadingRows,
  Notice,
  RecordLine,
  Select,
} from '@xr/ui/v3';
import type { ReactNode } from 'react';

import { calendarDay } from '@/copy/dates';
import { grantWords, planWords, wordsOf } from '@/copy/flow-state-words';
import {
  alreadyHasWords,
  courseWords,
  createdLine,
  groupChosenWords,
  groupWho,
  IA05,
  licencesLineWords,
  memberHasItWords,
  memberInactiveWords,
  membersCanOpenWords,
  membersWords,
  memberWaitingWords,
  noLicenceNote,
  notInPlanHeading,
  openStudentWords,
  planLineWords,
  seesItWords,
  selectedWords,
  selectionLine,
  selectionPlanWords,
  studentsChosenWords,
  summaryFormatsWords,
} from '@/copy/ia-access';
import { iaPlural } from '@/copy/ia-shared';
import { planTermWords } from '@/copy/institutions';
import { stateWords } from '@/copy/state-copy';
import {
  addPersonAddress,
  GROUPS_ADDRESS,
  groupAddress,
  IMPORT_STUDENTS_ADDRESS,
  STUDENT_ACCESS_ADDRESS,
  studentRecordAddress,
} from '@/nav/institute';
import type { GiveChoice, useGiveAccessPreview } from '@/queries/student-access';

import { formatCodes } from '../shared/format-codes';
import { type Chosen, type Draft, FIELD_IDS } from './give-access-view';

/** What "Give access" answered, with what the result rows name. */
export interface GivenResult {
  readonly results: readonly GrantResult[];
  /** The group when access was given to a group: its page and name. */
  readonly group: { readonly id: string; readonly name: string } | null;
  /** The students chosen (each result names its student; the link opens their record). */
  readonly students: readonly { readonly id: string; readonly name: string }[];
  readonly experiments: GiveAccessOptions['experiments'];
}

/** The course on show: the one chosen, else the first in access. */
export function courseOf(offered: GiveAccessOptions, draft: Draft) {
  return (
    offered.courses.find((course) => course.id === draft.courseId) ?? offered.courses[0] ?? null
  );
}

// ---- step 1 · Experiments ------------------------------------------------------------------------

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
    <>
      <IaStack sec>
        <DefinitionList
          items={[
            {
              term: IA05.keys.plan,
              value:
                status === null
                  ? null
                  : planLineWords(status, plan.licences, calendarDay(plan.endsOn)),
            },
          ]}
        />
        <IaField id="gv-course" width="select" label={IA05.courseLabel}>
          <Select
            options={offered.courses.map((entry) => ({
              value: entry.id,
              label: courseWords(entry.platformCode, entry.name),
            }))}
            value={course?.id ?? ''}
            onChange={(event) => update({ courseId: event.target.value, experimentIds: [] })}
          />
        </IaField>
        <IaExperimentChoices
          id={FIELD_IDS.experiments}
          legend={IA05.experimentsLegend}
          legendHint={IA05.formatsNote}
          choices={chosen.inPlan.map((entry) => ({
            key: entry.experimentId,
            inputId: `gv-e-${entry.experimentId}`,
            name: entry.name,
            checked: chosen.experiments.includes(entry),
            onChange: () => toggle(entry.experimentId),
            detail: (
              <>
                {IA05.available} <IaFormatBadges formats={formatCodes(entry.formats)} flush />
              </>
            ),
          }))}
        />
        {chosen.notInPlan.length > 0 && course ? (
          <IaNotInPlanList
            heading={notInPlanHeading(course.platformCode ?? course.name)}
            items={chosen.notInPlan.map((entry) => ({
              key: entry.experimentId,
              name: entry.name,
              detail: (
                <>
                  {IA05.notInPlan}{' '}
                  <IaFormatBadges formats={formatCodes(entry.formats)} state="pub" flush />
                </>
              ),
            }))}
          />
        ) : null}
      </IaStack>
      <IaActions>
        <ButtonLink size="lg" href={STUDENT_ACCESS_ADDRESS}>
          {IA05.cancel}
        </ButtonLink>
        <Button variant="primary" size="lg" onClick={onContinue}>
          {IA05.continue}
        </Button>
      </IaActions>
    </>
  );
}

// ---- step 2 · Students or a group ----------------------------------------------------------------

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
  // "Already has <experiment>" names the chosen experiments the student already holds (PC-48).
  const namesOf = (experimentIds: readonly string[]) =>
    chosen.inPlan
      .filter((entry) => experimentIds.includes(entry.experimentId))
      .map((entry) => entry.name);
  const toggle = (studentId: string) =>
    update({
      studentIds: draft.studentIds.includes(studentId)
        ? draft.studentIds.filter((id) => id !== studentId)
        : [...draft.studentIds, studentId],
    });
  let body: ReactNode;
  if (draft.who === 'students') {
    body =
      offered.students.length > 0 ? (
        <>
          <IaPickSearch
            id="gv-q"
            label={IA05.searchStudents}
            placeholder={IA05.searchPlaceholder}
            value={draft.search}
            onChange={(value) => update({ search: value })}
            count={selectedWords(chosen.students.length)}
          />
          {listed.length > 0 ? (
            <IaPickList
              label={IA05.studentsList}
              id={FIELD_IDS.students}
              items={listed.map((student) => {
                const row = known.get(student.id);
                const groups = row?.groups.map((group) => group.name) ?? [];
                return {
                  key: student.id,
                  inputId: `gv-s-${student.id}`,
                  name: student.name,
                  detail: row ? [row.student.institutionStudentId, ...groups].join(' · ') : null,
                  why:
                    student.why === 'already-has-it'
                      ? alreadyHasWords(namesOf(student.alreadyHas))
                      : student.why === 'inactive'
                        ? IA05.inactive
                        : null,
                  checked: chosen.students.includes(student),
                  disabled: !student.selectable,
                  onChange: () => toggle(student.id),
                };
              })}
            />
          ) : (
            <RecordLine>{IA05.noStudentMatch}</RecordLine>
          )}
        </>
      ) : (
        <ListState
          kind="empty"
          icon="people"
          titleAs="h2"
          title={IA05.noStudentsTitle}
          action={
            <IaRow center>
              <ButtonLink href={addPersonAddress('student')}>{IA05.addStudent}</ButtonLink>
              <ButtonLink href={IMPORT_STUDENTS_ADDRESS}>{IA05.importStudents}</ButtonLink>
            </IaRow>
          }
        >
          {IA05.noStudentsLine}
        </ListState>
      );
  } else {
    body = (
      <>
        <RecordLine>{IA05.groupNote}</RecordLine>
        {offered.groups.length > 0 ? (
          <IaPickList
            label={IA05.groupsList}
            id={FIELD_IDS.groups}
            kind="radio"
            name="gv-grp"
            items={offered.groups.map((group) => ({
              key: group.id,
              inputId: `gv-g-${group.id}`,
              name: group.name,
              detail: membersWords(group.memberCount),
              why: group.selectable ? null : IA05.groupEmpty,
              checked: chosen.group?.id === group.id,
              disabled: !group.selectable,
              onChange: () => update({ groupId: group.id }),
            }))}
          />
        ) : (
          <ListState
            kind="empty"
            icon="people"
            titleAs="h2"
            title={IA05.noGroupsTitle}
            action={<ButtonLink href={GROUPS_ADDRESS}>{IA05.openGroups}</ButtonLink>}
          >
            {IA05.noGroupsLine}
          </ListState>
        )}
      </>
    );
  }
  return (
    <>
      <IaStack sec>
        <IaViewSwitch
          label={IA05.giveTo}
          options={[
            { key: 'students', label: IA05.students },
            { key: 'group', label: IA05.aGroup },
          ]}
          value={draft.who}
          onChange={(who) => update({ who })}
        />
        {body}
      </IaStack>
      <IaActions>
        <Button size="lg" onClick={onBack}>
          {IA05.back}
        </Button>
        <Button variant="primary" size="lg" onClick={onContinue}>
          {IA05.continue}
        </Button>
      </IaActions>
    </>
  );
}

// ---- step 3 · Review and give access -------------------------------------------------------------

/**
 * A planned group grant's members (`gsum`): how many can open it straight away, then each member
 * waiting (supplied), already having it individually, inactive — and, where the overlap is
 * undecided (OD-B2-01), that it is not decided (state-copy), never a can / can't.
 */
function memberLines(planned: PlannedGrant): readonly IaLineItem[] {
  const canOpen = planned.reaches.filter((reach) => reach.standing === 'can-open-it').length;
  const lines: IaLineItem[] = [
    { key: 'can-open', tone: 'ok', children: membersCanOpenWords(canOpen) },
  ];
  const each = (
    match: (reach: PlannedGrant['reaches'][number]) => boolean,
    tone: IaLineItem['tone'],
    words: (reach: PlannedGrant['reaches'][number]) => string,
  ) => {
    for (const reach of planned.reaches.filter(match)) {
      lines.push({ key: `${tone}-${reach.studentId}`, tone, children: words(reach) });
    }
  };
  each(
    (reach) => reach.standing === 'waiting-for-a-licence',
    'wait',
    (reach) => memberWaitingWords(reach.name),
  );
  each(
    (reach) => reach.standing === 'has-it-individually',
    'info',
    (reach) => memberHasItWords(reach.name),
  );
  each(
    (reach) => typeof reach.standing === 'object',
    'info',
    (reach) => `${reach.name}: ${stateWords('IA-05.member.policy-open')}`,
  );
  each(
    (reach) => reach.standing === 'inactive',
    'off',
    (reach) => memberInactiveWords(reach.name),
  );
  return lines;
}

/** "Active" or the supplied "Waiting for a licence" (never computed, T-06 / D7). */
function grantStatusWords(waiting: boolean): string {
  return wordsOf(grantWords(waiting ? 'waiting-for-a-licence' : 'active')) ?? '';
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
  const keys = IA05.keys;
  const group = choice.target.kind === 'group' ? chosen.group : null;
  const planned = preview.data?.ok ? preview.data.value : null;
  let created: ReactNode;
  if (preview.isError) {
    created = <Notice tone="warn" icon="alertCircle" title={stateWords('IA-05.review.failed')} />;
  } else if (preview.data && !preview.data.ok) {
    created = <Notice tone="warn" icon="alertCircle" title={stateWords('IA-05.give.refused')} />;
  } else if (planned === null) {
    created = <LoadingRows message={stateWords('IA-05.review.loading')} rows={1} cells={[1]} />;
  } else if (group) {
    created = planned.map((grant) => (
      <IaStack key={grant.experimentId} tight>
        <IaGroupFlow
          who={groupWho(group.name)}
          what={names.get(grant.experimentId)}
          status={grantStatusWords(false)}
        />
        <IaLines lines={memberLines(grant)} />
      </IaStack>
    ));
  } else {
    created = (
      <IaLines
        lines={planned.map((grant) => {
          const waiting = grant.reaches.some((reach) => reach.standing === 'waiting-for-a-licence');
          return {
            key: `${grant.who}-${grant.experimentId}`,
            tone: waiting ? 'wait' : 'ok',
            children: createdLine(
              grant.who,
              [names.get(grant.experimentId) ?? ''],
              grantStatusWords(waiting),
            ),
          };
        })}
      />
    );
  }
  return (
    <>
      <IaStack sec>
        <DefinitionList
          items={[
            {
              term: keys.course,
              value: course ? courseWords(course.platformCode, course.name) : null,
            },
            {
              term: keys.experiments,
              value: chosen.experiments.map((entry) => entry.name).join(', '),
            },
            {
              term: keys.formats,
              value: (
                <IaFormatsWith
                  badges={<IaFormatBadges formats={formatCodes(chosen.formats)} flush />}
                >
                  {IA05.inherited}
                </IaFormatsWith>
              ),
            },
            {
              term: group ? keys.group : keys.students,
              value: group
                ? groupChosenWords(group.name, group.memberCount)
                : studentsChosenWords(chosen.students.map((student) => student.name)),
            },
          ]}
        />
        <IaStepPart title={IA05.whatWillBeCreated}>{created}</IaStepPart>
        <Hint>
          {licencesLineWords(plan.licences, planTermWords(plan.term), calendarDay(plan.endsOn))}
        </Hint>
      </IaStack>
      <IaActions>
        <Button size="lg" onClick={onBack}>
          {IA05.back}
        </Button>
        <IaBusyButton
          id={FIELD_IDS.give}
          variant="primary"
          size="lg"
          busy={busy}
          busyLabel={IA05.giving}
          onClick={onGive}
        >
          {IA05.give}
        </IaBusyButton>
      </IaActions>
    </>
  );
}

// ---- the result ----------------------------------------------------------------------------------

export function ResultSection({
  given,
  onRestart,
}: {
  readonly given: GivenResult;
  readonly onRestart: () => void;
}) {
  const experiments = new Map(given.experiments.map((entry) => [entry.experimentId, entry]));
  const rows: IaGivenRow[] = given.results.map((result) => {
    const experiment = experiments.get(result.experimentId);
    const waiting = result.display === 'waiting-for-a-licence' && result.wait !== null;
    const student = given.students.find((entry) => entry.name === result.who) ?? null;
    return {
      key: result.grantId,
      who: given.group ? groupWho(given.group.name) : result.who,
      what: experiment?.name ?? '',
      status: { tone: waiting ? 'warn' : 'ok', words: grantStatusWords(waiting) },
      note: given.group
        ? IA05.groupResultNote
        : waiting
          ? noLicenceNote(result.who)
          : seesItWords(result.who, formatCodes(experiment?.formats ?? [])),
      ...(given.group
        ? { link: { label: IA05.openTheGroup, href: groupAddress(given.group.id) } }
        : student
          ? {
              link: {
                label: openStudentWords(student.name),
                href: studentRecordAddress(student.id),
              },
            }
          : {}),
    };
  });
  const allOk = given.results.every((result) => result.display !== 'waiting-for-a-licence');
  return (
    <>
      <IaStack sec>
        <Notice tone="ok" role="status" title={IA05.doneTitle}>
          {allOk ? IA05.resultAllOk : IA05.resultEach}
        </Notice>
        <IaGivenList label={IA05.doneTitle} rows={rows} />
      </IaStack>
      <IaActions start>
        <ButtonLink variant="primary" size="lg" href={STUDENT_ACCESS_ADDRESS}>
          {IA05.viewStudentAccess}
        </ButtonLink>
        <Button size="lg" onClick={onRestart}>
          {IA05.giveMore}
        </Button>
      </IaActions>
    </>
  );
}

// ---- "Your selection" (beside steps 1–2; folded under the steps below 860 px) ---------------------

function selectionItems(offered: GiveAccessOptions, chosen: Chosen, draft: Draft) {
  const course = courseOf(offered, draft);
  const keys = IA05.keys;
  const who =
    draft.who === 'group'
      ? chosen.group
        ? groupChosenWords(chosen.group.name, chosen.group.memberCount)
        : IA05.notChosen
      : studentsChosenWords(chosen.students.map((student) => student.name));
  return [
    { key: 'plan', term: keys.plan, children: selectionPlanWords(course?.platformCode ?? null) },
    {
      key: 'experiments',
      term: keys.experiments,
      children:
        chosen.experiments.length > 0
          ? chosen.experiments.map((entry) => entry.name).join(', ')
          : IA05.notChosen,
    },
    {
      key: 'formats',
      term: keys.formats,
      children: summaryFormatsWords(formatCodes(chosen.formats)),
    },
    { key: 'who', term: draft.who === 'group' ? keys.group : keys.students, children: who },
  ];
}

/** The selection folded into one line under the step indicator ("1 experiment · 2 students"). */
export function SelectionFold({
  offered,
  chosen,
  draft,
}: {
  readonly offered: GiveAccessOptions;
  readonly chosen: Chosen;
  readonly draft: Draft;
}) {
  const who =
    draft.who === 'group'
      ? (chosen.group?.name ?? null)
      : chosen.students.length
        ? iaPlural(chosen.students.length, 'student')
        : null;
  return (
    <IaSelectionFold
      title={IA05.selection}
      line={selectionLine(chosen.experiments.length, who)}
      items={selectionItems(offered, chosen, draft)}
    />
  );
}

/** The selection beside steps 1 and 2. */
export function SelectionPanel({
  offered,
  chosen,
  draft,
}: {
  readonly offered: GiveAccessOptions;
  readonly chosen: Chosen;
  readonly draft: Draft;
}) {
  return (
    <IaSelectionPanel
      title={IA05.selection}
      titleId="gv-sum-h"
      items={selectionItems(offered, chosen, draft)}
    />
  );
}
