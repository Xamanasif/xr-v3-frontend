'use client';

import type { FacultyRecordView } from '@xr/contracts/draft';
import {
  Breadcrumbs,
  ButtonLink,
  IaCoursesTaughtTable,
  IaSectionFoot,
  IaSectionHead,
  ListState,
  MetaSeparator,
  Notice,
  PageHead,
  StatusPill,
  Surface,
  TextLink,
  V46Island,
} from '@xr/ui/v3';

import { FACULTY_RECORD, noCoursesLine, removeCourseLabel } from '@/copy/faculty';
import {
  addedLine,
  coursesSetFoot,
  coursesTaughtCaption,
  FACULTY_RECORD_V3,
  ownCourseCodeLine,
} from '@/copy/ia-people';
import { FACULTY_TAB, PEOPLE_PAGE } from '@/copy/institute-people';
import { stateWords } from '@/copy/state-copy';
import {
  FACULTY_ADDRESS,
  FACULTY_COURSES_ADDRESS,
  facultyCoursesAddress,
  INSTITUTE_HELP_ADDRESS,
  underPlacement,
} from '@/nav/institute';
import { useCourseCodeList, useFacultyRecord } from '@/queries/institute-records';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { PeoplePausedNotice } from '../ia-06-people/people-parts';
import { useInstitutionPaused } from '../shared/paused';
import { coursesTaughtLines, facultyAddedLine } from './faculty-record-view';

const TITLE_ID = 'ia-h1';
const SECTION_ID = 'fr-c-h';

/**
 * IA-09 Faculty record — the V3 export's faculty record (IA-v1 `Main.dc.html` IA-09), at
 * `/institute/people/faculty/[facultyId]`.
 *
 * - **Read**: `PeopleService.getFaculty` — the faculty member, their Faculty course mappings
 *   (current and removed) and the courses those name; the institution's own course codes
 *   (`InstitutionCourseCodeService.list`, read once for the page) add "Your course code …" under a
 *   course. An address naming no faculty member of the admin's institution — unknown, a student,
 *   another institution's — is the in-shell not-found page (state-copy `IA-09.not-found`); the
 *   loading and failed states keep the application's existing look.
 * - **As drawn**: the crumb back to Faculty; "Faculty", the name, the status, the e-mail and "Added
 *   <date> · <who>" once in the head; "Assign a course" (primary). One surface "Courses taught"
 *   ("Open Faculty courses"): Course (code and name, the institution's code) · Assigned "<date> ·
 *   <who>" · "Remove…", or "No courses yet"; the foot line says what courses set and that they
 *   never give students access. Only current mappings are listed (state-copy `IA-09.courses`); a
 *   mapping is never named by its internal reference.
 * - **Act**: nothing is written here. "Assign a course" and "Remove…" open IA-15 Faculty courses
 *   with this person chosen (`&faculty=`), where the course is assigned or the removal confirmed;
 *   "Open Faculty courses" opens IA-15 (state-copy `IA-09.actions`). An inactive faculty member
 *   is offered no "Assign a course" and the record says why. Faculty deactivation and editing
 *   details are not designed (PER-07, PER-08): neither is offered.
 * - **Paused institution**: read-only — no "Assign a course", no "Remove…", the paused notice.
 */
export function FacultyRecord({ facultyId }: { readonly facultyId: string }) {
  const read = useFacultyRecord(facultyId);
  useShellPage(
    underPlacement('IA-09', read.data?.ok ? read.data.value.faculty.fullName : null, [
      { label: PEOPLE_PAGE.tabs.faculty, href: FACULTY_ADDRESS },
    ]),
  );
  const guard = (
    <RecordGuard
      read={read}
      loadingLabel={stateWords('IA-09.loading')}
      failed={{
        title: stateWords('IA-09.failed'),
        line: stateWords('IA-09.failed.line'),
        reportHref: `${INSTITUTE_HELP_ADDRESS}/report`,
      }}
    >
      {(record) => <RecordContent record={record} />}
    </RecordGuard>
  );
  // The application's existing loading and failed states keep their v46 look.
  return read.data?.ok ? guard : <V46Island>{guard}</V46Island>;
}

function RecordContent({ record }: { readonly record: FacultyRecordView }) {
  const { faculty } = record;
  const paused = useInstitutionPaused();
  const codes = useCourseCodeList();
  const inactive = faculty.accountStatus === 'inactive';
  const canAssign = !paused && !inactive;
  const canRemove = !paused;
  const lines = coursesTaughtLines(record);
  const assignAddress = facultyCoursesAddress(faculty.id);
  const ownCodes = new Map<string, string | null>(
    (codes.data?.ok ? codes.data.value : []).map((row) => [row.course.id, row.code?.code ?? null]),
  );
  const { columns } = FACULTY_RECORD;

  return (
    <>
      <PageHead
        breadcrumbs={
          <Breadcrumbs
            levels={[{ label: FACULTY_RECORD.back, href: FACULTY_ADDRESS }]}
            current={faculty.fullName}
          />
        }
        variant="record"
        eyebrow={FACULTY_RECORD.overline}
        title={faculty.fullName}
        titleId={TITLE_ID}
        titleFocusTarget
        meta={
          <>
            {inactive ? (
              <StatusPill tone="ended">{FACULTY_TAB.inactive}</StatusPill>
            ) : (
              <StatusPill tone="ok">{FACULTY_TAB.active}</StatusPill>
            )}
            <span>{faculty.institutionEmail}</span>
            <MetaSeparator />
            <span>{addedLine(facultyAddedLine(record))}</span>
          </>
        }
        actions={
          canAssign ? (
            <ButtonLink variant="primary" size="lg" href={assignAddress}>
              {FACULTY_RECORD.assignCourse}
            </ButtonLink>
          ) : null
        }
      />
      {paused ? <PeoplePausedNotice line={FACULTY_RECORD_V3.paused} /> : null}
      {inactive ? (
        <Notice tone="off" role="status" title={FACULTY_RECORD_V3.inactiveTitle}>
          {FACULTY_RECORD_V3.inactiveLine}
        </Notice>
      ) : null}
      <Surface labelledBy={SECTION_ID}>
        <IaSectionHead
          title={FACULTY_RECORD.sections.coursesTaught}
          titleId={SECTION_ID}
          aside={
            <TextLink href={FACULTY_COURSES_ADDRESS}>{FACULTY_RECORD.openFacultyCourses}</TextLink>
          }
        />
        {lines.length > 0 ? (
          <IaCoursesTaughtTable
            caption={coursesTaughtCaption(faculty.fullName)}
            headers={{ course: columns.course, assigned: columns.assigned, action: columns.action }}
            rows={lines.map((line) => {
              const own = ownCodes.get(line.courseId);
              const named = line.code ?? line.name;
              return {
                key: line.mappingId,
                code: line.code,
                name: line.name,
                own: own ? ownCourseCodeLine(own) : null,
                assigned: line.assigned,
                // Each link named for its course (the links share an address).
                action: canRemove ? (
                  <ButtonLink
                    variant="ghost"
                    href={assignAddress}
                    aria-label={removeCourseLabel(named, faculty.fullName)}
                  >
                    {FACULTY_RECORD.remove}
                  </ButtonLink>
                ) : null,
              };
            })}
          />
        ) : (
          <ListState
            kind="none"
            titleAs="h3"
            title={FACULTY_RECORD.noCoursesTitle}
            action={
              canAssign ? (
                <ButtonLink href={assignAddress}>{FACULTY_RECORD.assignCourse}</ButtonLink>
              ) : null
            }
          >
            {inactive ? FACULTY_RECORD_V3.inactiveLine : noCoursesLine(faculty.fullName)}
          </ListState>
        )}
        <IaSectionFoot>{coursesSetFoot(faculty.fullName)}</IaSectionFoot>
      </Surface>
    </>
  );
}
