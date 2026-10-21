'use client';

import type { ServiceError } from '@xr/contracts/draft';
import type { GroupId } from '@xr/domain';
import {
  Breadcrumbs,
  Button,
  ButtonLink,
  DefinitionList,
  ErrorSummary,
  Field,
  IaActions,
  IaBusyButton,
  IaFieldGrid,
  IaFieldset,
  IaFormSurface,
  IaMessageCard,
  IaNoWrap,
  Notice,
  PageHead,
  Select,
  TextInput,
  TextLink,
} from '@xr/ui/v3';
import { type FormEvent, useEffect, useRef, useState } from 'react';

import { ADD_PERSON_V3, backToWords } from '@/copy/ia-people';
import { ADD_PERSON, ADDED_FACULTY_LINE, ADDED_STUDENT_LINE } from '@/copy/institute-people';
import {
  FACULTY_ADDRESS,
  facultyCoursesAddress,
  giveAccessAddress,
  INSTITUTE_HELP_ADDRESS,
  PEOPLE_ADDRESS,
  underPlacement,
} from '@/nav/institute';
import { useAppNavigation } from '@/nav/navigation';
import {
  type PersonField,
  type PersonFieldError,
  personFieldErrors,
  personSummaryTitle,
  useAllStudents,
  useGroupList,
} from '@/queries/people';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { useInstitutionPaused } from '../shared/paused';
import { useInstituteTodayLine } from '../shared/use-today-line';

type PersonType = 'student' | 'faculty';

/** The page's H1 (the head's, or the paused refusal's): where focus lands. */
const TITLE_ID = 'ia-h1';
const DONE_TITLE_ID = 'person-added-t';

/** The control each field error and its summary link point to. */
const FIELD_IDS: Readonly<Record<PersonField, string>> = {
  fullName: 'person-name',
  institutionEmail: 'person-email',
  institutionStudentId: 'person-student-id',
};

interface Draft {
  readonly fullName: string;
  readonly institutionEmail: string;
  readonly institutionStudentId: string;
  readonly programme: string;
  readonly group: string;
}

const EMPTY: Draft = {
  fullName: '',
  institutionEmail: '',
  institutionStudentId: '',
  programme: '',
  group: '',
};

/** Who was added, as the result names them (the command's answer and the group chosen). */
interface Added {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly studentId: string | null;
  readonly group: string;
}

/**
 * IA-10 Add student / Add faculty member — the V3 export's add page (IA-v1 `Main.dc.html` IA-10,
 * reviewed and unchanged), at `/institute/people/add` (`?type=faculty` for a faculty member).
 *
 * - **The form as drawn**, in the form column: the info notice saying what adding does not do,
 *   "Who they are" (Full name, Institution e-mail — two per row from 640 px) and, for a student,
 *   "Student details" (Student ID with the first student's ID as the example, Programme and Group —
 *   both optional; the groups are `GroupService.listGroups`'), then Cancel and the primary.
 * - **Checked by the service**: `PeopleService.addStudent` / `addFaculty` answer the drawn words —
 *   required fields, a full e-mail address, an e-mail or student ID already in People, an e-mail
 *   another account signs in with — shown on the fields and in the error summary, which takes
 *   focus. Typing in a field clears its error. The service checks the formats before uniqueness
 *   (state-copy `IA-10.check-order`); nothing is overwritten.
 * - **Sent once**; "Adding…" while busy. Adding creates the record only: no invitation or e-mail
 *   (T-11). A failure for now keeps every answer (state-copy `IA-10.unavailable`).
 * - **The result in place**, which takes focus: "Added", who and what was recorded, then "Give this
 *   student access" (IA-05 with the new student chosen) or "Assign a course" (IA-15 with them
 *   chosen), "Add another …" and "Back to Students / Faculty".
 * - **Paused institution**: the refusal instead of the page ("You can’t add people while your
 *   institution’s access is paused"), with the way back and Help; a write refused
 *   `institution-paused` meanwhile turns the page into it, its heading focused.
 */
export function AddPerson() {
  const navigation = useAppNavigation();
  const type: PersonType =
    new URLSearchParams(navigation.search).get('type') === 'faculty' ? 'faculty' : 'student';
  const words = type === 'faculty' ? ADD_PERSON.faculty : ADD_PERSON.student;
  useShellPage(underPlacement('IA-10', words.title));
  const today = useInstituteTodayLine();
  const sessionPaused = useInstitutionPaused();
  const [refusedPaused, setRefusedPaused] = useState(false);
  const paused = sessionPaused || refusedPaused;
  const back = type === 'faculty' ? FACULTY_ADDRESS : PEOPLE_ADDRESS;
  const crumbs = <Breadcrumbs levels={[{ label: words.back, href: back }]} current={words.title} />;

  // A write refused while paused turns the page into the refusal: its heading takes focus.
  useEffect(() => {
    if (refusedPaused) document.getElementById(TITLE_ID)?.focus();
  }, [refusedPaused]);

  if (paused) {
    return (
      <>
        {crumbs}
        <IaMessageCard
          icon="pauseCircle"
          title={ADD_PERSON_V3.pausedTitle}
          titleId={TITLE_ID}
          actions={
            <>
              <ButtonLink variant="navy" href={back}>
                {backToWords(words.back)}
              </ButtonLink>
              <TextLink href={INSTITUTE_HELP_ADDRESS}>{ADD_PERSON_V3.help}</TextLink>
            </>
          }
        >
          {ADD_PERSON_V3.pausedLine}
        </IaMessageCard>
      </>
    );
  }

  return (
    <>
      <PageHead
        breadcrumbs={crumbs}
        date={today}
        eyebrow={ADD_PERSON.overline}
        title={words.title}
        titleId={TITLE_ID}
        titleFocusTarget
      />
      <AddPersonForm key={type} type={type} back={back} onPaused={() => setRefusedPaused(true)} />
    </>
  );
}

function AddPersonForm({
  type,
  back,
  onPaused,
}: {
  readonly type: PersonType;
  readonly back: string;
  readonly onPaused: () => void;
}) {
  const words = type === 'faculty' ? ADD_PERSON.faculty : ADD_PERSON.student;
  const lead = type === 'faculty' ? ADD_PERSON_V3.faculty : ADD_PERSON_V3.student;
  const student = type === 'student';
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<readonly PersonFieldError[]>([]);
  // Each failed "Add" shows the summary anew, and it takes focus (B2-07 `focus(pid + '-errsum')`).
  const [attempt, setAttempt] = useState(0);
  const [added, setAdded] = useState<Added | null>(null);
  const [focusName, setFocusName] = useState(0);
  const doneRef = useRef<HTMLDivElement>(null);
  const groups = useGroupList(student);
  const students = useAllStudents();
  const addStudent = useCommand((ports) => ports.people.addStudent);
  const addFaculty = useCommand((ports) => ports.people.addFaculty);
  const busy = addStudent.busy || addFaculty.busy;

  // The result takes focus when it appears (the export's `focusLater('ad-done')`); "Add another …"
  // puts it on the first field.
  useEffect(() => {
    if (added) doneRef.current?.focus();
  }, [added]);
  useEffect(() => {
    if (focusName > 0) document.getElementById(FIELD_IDS.fullName)?.focus();
  }, [focusName]);

  const set = (name: keyof Draft) => (value: string) => {
    setDraft((current) => ({ ...current, [name]: value }));
    if (name === 'programme' || name === 'group') return;
    setErrors((current) => current.filter((error) => error.field !== name));
  };
  const errorOf = (field: PersonField) => errors.find((error) => error.field === field)?.message;
  const groupOptions = groups.data?.ok ? groups.data.value : [];
  const groupName = (id: string) =>
    groupOptions.find((entry) => entry.group.id === id)?.group.name ?? null;

  const refused = (error: ServiceError) => {
    if (error.kind === 'validation-failed') {
      setErrors(personFieldErrors(error));
      setAttempt((current) => current + 1);
    } else if (error.kind === 'refused' && error.code === 'institution-paused') {
      onPaused();
    } else if (error.kind === 'not-found') {
      // The chosen group is gone: the list is read again and the choice cleared.
      setDraft((current) => ({ ...current, group: '' }));
      void groups.refetch();
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const sent = student
      ? addStudent.run({
          fullName: draft.fullName,
          institutionEmail: draft.institutionEmail,
          institutionStudentId: draft.institutionStudentId,
          programme: draft.programme,
          groupId: draft.group === '' ? null : (draft.group as GroupId),
        })
      : addFaculty.run({ fullName: draft.fullName, institutionEmail: draft.institutionEmail });
    sent.then(
      (answer) => {
        if (answer.ok) {
          setErrors([]);
          const person = answer.value;
          setAdded({
            id: person.id,
            name: person.fullName,
            email: person.institutionEmail,
            studentId: 'institutionStudentId' in person ? person.institutionStudentId : null,
            group: draft.group,
          });
        } else refused(answer.error);
      },
      // Failed for now: nothing changes and every answer stays (state-copy `IA-10.unavailable`).
      () => undefined,
    );
  };

  const again = () => {
    setDraft(EMPTY);
    setErrors([]);
    setAdded(null);
    setFocusName((current) => current + 1);
  };

  if (added) {
    const facts = student
      ? [
          { term: ADD_PERSON_V3.facts.studentId, value: added.studentId ?? '' },
          { term: ADD_PERSON_V3.facts.email, value: added.email },
          {
            term: ADD_PERSON_V3.facts.group,
            value: (added.group && groupName(added.group)) || ADD_PERSON_V3.facts.notInGroup,
          },
        ]
      : [
          { term: ADD_PERSON_V3.facts.email, value: added.email },
          { term: ADD_PERSON_V3.facts.coursesTaught, value: ADD_PERSON_V3.facts.noneYet },
        ];
    return (
      <IaFormSurface
        labelledBy={DONE_TITLE_ID}
        actions={
          <IaActions start>
            {student ? (
              <ButtonLink
                variant="primary"
                size="lg"
                href={giveAccessAddress({ student: added.id })}
              >
                {ADD_PERSON.giveAccess}
              </ButtonLink>
            ) : (
              // "Assign a course" opens Faculty courses with them chosen (IA-15).
              <ButtonLink variant="primary" size="lg" href={facultyCoursesAddress(added.id)}>
                {ADD_PERSON.assignCourse}
              </ButtonLink>
            )}
            <Button size="lg" onClick={again}>
              {words.again}
            </Button>
            <ButtonLink variant="ghost" size="lg" href={back}>
              {backToWords(words.back)}
            </ButtonLink>
          </IaActions>
        }
      >
        <Notice
          tone="ok"
          role="status"
          id="person-added"
          ref={doneRef}
          title={<span id={DONE_TITLE_ID}>{ADD_PERSON.added}</span>}
        >
          {added.name}
          {student ? ADDED_STUDENT_LINE : ADDED_FACULTY_LINE}
        </Notice>
        <DefinitionList items={facts} />
      </IaFormSurface>
    );
  }

  const example = students.data?.ok ? students.data.value[0]?.student.institutionStudentId : null;
  return (
    <form noValidate onSubmit={submit}>
      <IaFormSurface
        labelledBy={TITLE_ID}
        actions={
          <IaActions>
            <ButtonLink size="lg" href={back}>
              {ADD_PERSON.cancel}
            </ButtonLink>
            <IaBusyButton
              type="submit"
              variant="primary"
              size="lg"
              busy={busy}
              busyLabel={ADD_PERSON.busy}
            >
              {words.submit}
            </IaBusyButton>
          </IaActions>
        }
      >
        {errors.length > 0 ? (
          <ErrorSummary
            key={attempt}
            id="person-errors"
            title={personSummaryTitle(errors.length)}
            items={errors.map((error) => ({
              fieldId: FIELD_IDS[error.field],
              summaryText: error.summaryText,
            }))}
          />
        ) : null}
        <Notice tone="info" icon="info" title={lead.leadTitle}>
          {lead.leadLine}
        </Notice>
        <IaFieldset legend={ADD_PERSON.whoTheyAre}>
          <IaFieldGrid two>
            <Field id={FIELD_IDS.fullName} label={ADD_PERSON.fullName} error={errorOf('fullName')}>
              <TextInput
                autoComplete="off"
                value={draft.fullName}
                onChange={(event) => set('fullName')(event.target.value)}
              />
            </Field>
            <Field
              id={FIELD_IDS.institutionEmail}
              label={ADD_PERSON.email}
              error={errorOf('institutionEmail')}
            >
              <TextInput
                type="email"
                autoComplete="off"
                placeholder={ADD_PERSON.emailPlaceholder}
                value={draft.institutionEmail}
                onChange={(event) => set('institutionEmail')(event.target.value)}
              />
            </Field>
          </IaFieldGrid>
        </IaFieldset>
        {student ? (
          <IaFieldset legend={ADD_PERSON.studentDetails}>
            <IaFieldGrid two>
              <Field
                id={FIELD_IDS.institutionStudentId}
                label={ADD_PERSON.studentId}
                hint={
                  example ? (
                    <>
                      {ADD_PERSON_V3.studentIdExample}
                      <IaNoWrap>{example}</IaNoWrap>.
                    </>
                  ) : (
                    ADD_PERSON_V3.studentIdNoExample
                  )
                }
                error={errorOf('institutionStudentId')}
              >
                <TextInput
                  autoComplete="off"
                  value={draft.institutionStudentId}
                  onChange={(event) => set('institutionStudentId')(event.target.value)}
                />
              </Field>
              <Field
                id="person-programme"
                label={ADD_PERSON_V3.programme}
                hint={ADD_PERSON_V3.programmeHint}
              >
                <TextInput
                  autoComplete="off"
                  value={draft.programme}
                  onChange={(event) => set('programme')(event.target.value)}
                />
              </Field>
              <Field id="person-group" label={ADD_PERSON_V3.group}>
                <Select
                  value={draft.group}
                  onChange={(event) => set('group')(event.target.value)}
                  options={[
                    { value: '', label: ADD_PERSON.noGroup },
                    ...groupOptions.map((entry) => ({
                      value: entry.group.id,
                      label: entry.group.name,
                    })),
                  ]}
                />
              </Field>
            </IaFieldGrid>
          </IaFieldset>
        ) : null}
      </IaFormSurface>
    </form>
  );
}
