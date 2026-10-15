'use client';

import type { ServiceError } from '@xr/contracts/draft';
import type { GroupId } from '@xr/domain';
import {
  BackLink,
  Button,
  ErrorSummary,
  Field,
  Link,
  Notice,
  PageContent,
  PageHeader,
  Section,
  Select,
  StatusPill,
  TextInput,
} from '@xr/ui';
import { type FormEvent, useEffect, useRef, useState } from 'react';

import { ADD_PERSON, ADDED_FACULTY_LINE, ADDED_STUDENT_LINE } from '@/copy/institute-people';
import {
  FACULTY_ADDRESS,
  facultyCoursesAddress,
  giveAccessAddress,
  PEOPLE_ADDRESS,
  underPlacement,
} from '@/nav/institute';
import { useAppNavigation } from '@/nav/navigation';
import {
  type PersonField,
  type PersonFieldError,
  personFieldErrors,
  personSummaryTitle,
  useGroupList,
} from '@/queries/people';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { PausedNotice, useInstitutionPaused } from '../ia-06-people/paused';

type PersonType = 'student' | 'faculty';

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

/**
 * IA-10 Add a student / Add a faculty member — board B2-07 f0 … f4, at `/institute/people/add`
 * (`?type=faculty` for a faculty member).
 *
 * - **The form as drawn**: "Who they are" (Full name, Institution e-mail) and, for a student,
 *   "Student details" (Student ID, Programme and Group — both optional; the groups are
 *   `GroupService.listGroups`'), with the quiet notice saying what adding does not do.
 * - **Checked by the service**: `PeopleService.addStudent` / `addFaculty` answer the drawn words —
 *   required fields, a full e-mail address, an e-mail or student ID already in People ("is already
 *   used by Rahul Verma") — shown on the fields and in the error summary, which takes focus. Typing
 *   in a field clears its error. The service checks the formats before uniqueness (state-copy
 *   `IA-10.check-order`). Uniqueness is People's own rule only; whether an e-mail a platform user
 *   or another institution's admin already holds may be used is open (T-11 / P1-01).
 * - **Sent once**; "Adding…" while busy. Adding creates the record only: no invitation or e-mail
 *   (T-11). A failure for now keeps every answer (state-copy `IA-10.unavailable`).
 * - **The result in place** (f2), which takes focus: "Give this student access" (IA-05 with the new
 *   student chosen), "Add another student", "Back to People". A faculty member's result offers
 *   "Assign a course" (IA-15 with them chosen, Package 2B) and "Add another faculty member".
 * - **Paused institution**: read-only — the paused notice instead of the form.
 */
export function AddPerson() {
  const navigation = useAppNavigation();
  const type: PersonType =
    new URLSearchParams(navigation.search).get('type') === 'faculty' ? 'faculty' : 'student';
  const words = type === 'faculty' ? ADD_PERSON.faculty : ADD_PERSON.student;
  useShellPage(underPlacement('IA-10', words.title));
  const sessionPaused = useInstitutionPaused();
  const [refusedPaused, setRefusedPaused] = useState(false);
  const paused = sessionPaused || refusedPaused;
  const titleRef = useRef<HTMLHeadingElement>(null);

  return (
    <PageContent wrap="form">
      <PageHeader
        className="mt-2 mb-5"
        back={
          <BackLink href={type === 'faculty' ? FACULTY_ADDRESS : PEOPLE_ADDRESS}>
            {words.back}
          </BackLink>
        }
        overline={ADD_PERSON.overline}
        title={words.title}
        titleFocusTarget
        titleRef={titleRef}
      />
      {paused ? (
        <PausedNotice />
      ) : (
        <AddPersonForm
          key={type}
          type={type}
          onPaused={() => {
            setRefusedPaused(true);
            titleRef.current?.focus();
          }}
        />
      )}
    </PageContent>
  );
}

function AddPersonForm({
  type,
  onPaused,
}: {
  readonly type: PersonType;
  readonly onPaused: () => void;
}) {
  const words = type === 'faculty' ? ADD_PERSON.faculty : ADD_PERSON.student;
  const student = type === 'student';
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<readonly PersonFieldError[]>([]);
  // Each failed "Add" shows the summary anew, and it takes focus (B2-07 `focus(pid + '-errsum')`).
  const [attempt, setAttempt] = useState(0);
  const [added, setAdded] = useState<{ readonly id: string; readonly name: string } | null>(null);
  const [focusName, setFocusName] = useState(0);
  const doneRef = useRef<HTMLDivElement>(null);
  const groups = useGroupList(student);
  const addStudent = useCommand((ports) => ports.people.addStudent);
  const addFaculty = useCommand((ports) => ports.people.addFaculty);
  const busy = addStudent.busy || addFaculty.busy;

  // The result takes focus when it appears (B2-07 `focus(pid + '-done')`); "Add another …" puts it
  // on the first field.
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
          setAdded({ id: answer.value.id, name: answer.value.fullName });
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
    return (
      <Section focusTarget ref={doneRef} id="person-added" className="flex flex-col gap-4 p-7">
        <StatusPill tone="ok">{ADD_PERSON.added}</StatusPill>
        <p className="xr-body m-0">
          <strong>{added.name}</strong>
          {student ? ADDED_STUDENT_LINE : ADDED_FACULTY_LINE}
        </p>
        <div className="xw-actions">
          {student ? (
            <Link
              className="xr-btn xr-btn--primary"
              href={giveAccessAddress({ student: added.id })}
            >
              {ADD_PERSON.giveAccess}
            </Link>
          ) : null}
          {student ? null : (
            // B2-07 f3: "Assign a course" opens Faculty courses with them chosen (IA-15, Package 2B).
            <Link className="xr-btn xr-btn--primary" href={facultyCoursesAddress(added.id)}>
              {ADD_PERSON.assignCourse}
            </Link>
          )}
          <Button variant="secondary" onClick={again}>
            {words.again}
          </Button>
          {student ? (
            <Link className="xr-btn xr-btn--text" href={PEOPLE_ADDRESS}>
              {ADD_PERSON.backToPeople}
            </Link>
          ) : null}
        </div>
      </Section>
    );
  }

  const groupOptions = groups.data?.ok ? groups.data.value : [];
  return (
    <div className="xw-stack">
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
      <Notice tone="quiet">{words.notice}</Notice>
      <form
        className="xr-section flex flex-col gap-7 p-6"
        noValidate
        aria-label={words.title}
        onSubmit={submit}
      >
        <fieldset className="xr-fieldset m-0 flex min-w-0 flex-col gap-[18px] border-0 p-0">
          <legend className="xr-h3 mb-2">{ADD_PERSON.whoTheyAre}</legend>
          <Field
            id={FIELD_IDS.fullName}
            label={ADD_PERSON.fullName}
            errorClass="xw-ferr"
            error={errorOf('fullName')}
          >
            <TextInput
              autoComplete="off"
              value={draft.fullName}
              onChange={(event) => set('fullName')(event.target.value)}
            />
          </Field>
          <Field
            id={FIELD_IDS.institutionEmail}
            label={ADD_PERSON.email}
            errorClass="xw-ferr"
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
        </fieldset>
        {student ? (
          <fieldset className="xr-fieldset m-0 flex min-w-0 flex-col gap-[18px] border-0 p-0">
            <legend className="xr-h3 mb-2">{ADD_PERSON.studentDetails}</legend>
            <Field
              id={FIELD_IDS.institutionStudentId}
              label={ADD_PERSON.studentId}
              hint={ADD_PERSON.studentIdHint}
              errorClass="xw-ferr"
              error={errorOf('institutionStudentId')}
            >
              <TextInput
                autoComplete="off"
                value={draft.institutionStudentId}
                onChange={(event) => set('institutionStudentId')(event.target.value)}
              />
            </Field>
            <Field id="person-programme" label={ADD_PERSON.programme} marker={ADD_PERSON.optional}>
              <TextInput
                value={draft.programme}
                onChange={(event) => set('programme')(event.target.value)}
              />
            </Field>
            <Field id="person-group" label={ADD_PERSON.group} marker={ADD_PERSON.optional}>
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
          </fieldset>
        ) : null}
        <div className="xw-flow-foot">
          <Link className="xr-btn xr-btn--text" href={student ? PEOPLE_ADDRESS : FACULTY_ADDRESS}>
            {ADD_PERSON.cancel}
          </Link>
          <div className="xw-actions">
            <Button variant="primary" type="submit" busy={busy} busyLabel={ADD_PERSON.busy}>
              {words.submit}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
