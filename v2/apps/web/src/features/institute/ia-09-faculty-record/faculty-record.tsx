'use client';

import type { FacultyRecordView } from '@xr/contracts/draft';
import {
  BackLink,
  EmptyState,
  Link,
  PageContent,
  PageHeader,
  Section,
  SectionBody,
  StatusPill,
} from '@xr/ui';
import type { ReactNode } from 'react';

import { coursesSetLine, FACULTY_RECORD, noCoursesLine, removeCourseLabel } from '@/copy/faculty';
import { FACULTY_TAB, PEOPLE_PAGE } from '@/copy/institute-people';
import { stateWords } from '@/copy/state-copy';
import {
  FACULTY_ADDRESS,
  FACULTY_COURSES_ADDRESS,
  facultyCoursesAddress,
  INSTITUTE_HELP_ADDRESS,
  underPlacement,
} from '@/nav/institute';
import { useFacultyRecord } from '@/queries/institute-records';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { PausedNotice, useInstitutionPaused } from '../ia-06-people/paused';
import { type CourseTaughtLine, coursesTaughtLines, facultyAddedLine } from './faculty-record-view';

/**
 * IA-09 Faculty record — board B2-06 f15 ("IA-09 Faculty record · Dr S. Ranganathan") and f16
 * ("no courses yet"), at `/institute/people/faculty/[facultyId]`.
 *
 * - **Read**: `PeopleService.getFaculty` — the faculty member, their Faculty course mappings
 *   (current and removed) and the courses those name. An address naming no faculty member of the
 *   admin's institution — unknown, a student, another institution's — is the in-shell not-found
 *   page (state-copy `IA-09.not-found`).
 * - **As drawn**: back to Faculty; "Faculty" overline, the name, the status and the e-mail; "Courses
 *   taught" (Course "<code> · <name>" · Assigned "<date> · <who> · <FMAP>" · "Remove…"; "Open
 *   Faculty courses"; "These courses set what <name> sees in the Faculty workspace.") or "No courses
 *   yet" (B2-06 f16); "Details" (Institution e-mail, Added). Only current mappings are listed
 *   (state-copy `IA-09.courses`).
 * - **Act**: nothing is written here. "Assign a course" and "Remove…" open IA-15 Faculty courses
 *   with this person chosen (`&faculty=`), where the course is assigned or the removal confirmed;
 *   "Open Faculty courses" opens IA-15 (state-copy `IA-09.actions`). A course mapping sets what the
 *   person sees in their Faculty workspace only; it gives students nothing. An inactive faculty
 *   member is offered no "Assign a course". Faculty deactivation and editing details are not
 *   designed (PER-07, PER-08): neither is offered.
 * - **Paused institution**: read-only — no "Assign a course", no "Remove…", the paused notice.
 */
export function FacultyRecord({ facultyId }: { readonly facultyId: string }) {
  const read = useFacultyRecord(facultyId);
  useShellPage(
    underPlacement('IA-09', read.data?.ok ? read.data.value.faculty.fullName : null, [
      { label: PEOPLE_PAGE.tabs.faculty, href: FACULTY_ADDRESS },
    ]),
  );
  return (
    <PageContent wrap="read">
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
    </PageContent>
  );
}

function RecordContent({ record }: { readonly record: FacultyRecordView }) {
  const { faculty } = record;
  const paused = useInstitutionPaused();
  const inactive = faculty.accountStatus === 'inactive';
  const canAssign = !paused && !inactive;
  const canRemove = !paused;
  const lines = coursesTaughtLines(record);
  const assignAddress = facultyCoursesAddress(faculty.id);

  return (
    <>
      <PageHeader
        className="mt-2 mb-6"
        back={<BackLink href={FACULTY_ADDRESS}>{FACULTY_RECORD.back}</BackLink>}
        overline={FACULTY_RECORD.overline}
        title={faculty.fullName}
        titleFocusTarget
        meta={
          <>
            {inactive ? (
              <StatusPill tone="off">{FACULTY_TAB.inactive}</StatusPill>
            ) : (
              <StatusPill tone="ok">{FACULTY_TAB.active}</StatusPill>
            )}
            <span>{faculty.institutionEmail}</span>
          </>
        }
        actions={
          canAssign ? (
            <Link className="xr-btn xr-btn--primary" href={assignAddress}>
              {FACULTY_RECORD.assignCourse}
            </Link>
          ) : null
        }
      />
      <div className="xw-stack">
        {paused ? <PausedNotice /> : null}
        <Section
          title={FACULTY_RECORD.sections.coursesTaught}
          headingId="faculty-courses-taught"
          headEnd={
            lines.length > 0 ? (
              <Link href={FACULTY_COURSES_ADDRESS}>{FACULTY_RECORD.openFacultyCourses}</Link>
            ) : null
          }
        >
          {lines.length > 0 ? (
            <>
              <CoursesTaughtTable
                lines={lines}
                fullName={faculty.fullName}
                removeHref={canRemove ? assignAddress : null}
              />
              <SectionBody className="pt-[14px]">
                <p className="xr-meta m-0">{coursesSetLine(faculty.fullName)}</p>
              </SectionBody>
            </>
          ) : (
            <EmptyState
              icon="graduation"
              headingLevel={3}
              title={FACULTY_RECORD.noCoursesTitle}
              actions={
                canAssign ? (
                  <div className="xw-actions">
                    <Link className="xr-btn xr-btn--secondary" href={assignAddress}>
                      {FACULTY_RECORD.assignCourse}
                    </Link>
                  </div>
                ) : null
              }
            >
              {canAssign ? noCoursesLine(faculty.fullName) : null}
            </EmptyState>
          )}
        </Section>
        <Section title={FACULTY_RECORD.sections.details} headingId="faculty-details">
          <SectionBody>
            <KeyValues
              rows={[
                [FACULTY_RECORD.keys.email, faculty.institutionEmail],
                [FACULTY_RECORD.keys.added, facultyAddedLine(record)],
              ]}
            />
          </SectionBody>
        </Section>
      </div>
    </>
  );
}

/**
 * B2-06 f15 "Courses taught" (`xr-table-wrap.xw-table-flush`): Course · Assigned · "Remove…",
 * which opens IA-15 for this person. Read-only, the action column is left out.
 */
function CoursesTaughtTable({
  lines,
  fullName,
  removeHref,
}: {
  readonly lines: readonly CourseTaughtLine[];
  readonly fullName: string;
  readonly removeHref: string | null;
}) {
  const { columns } = FACULTY_RECORD;
  return (
    <div className="xr-table-wrap xw-table-flush">
      <table className="xr-table">
        <caption className="xr-sr">{FACULTY_RECORD.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{columns.course}</th>
            <th scope="col">{columns.assigned}</th>
            {removeHref ? (
              <th scope="col">
                <span className="xr-sr">{columns.action}</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.mappingId}>
              <td className="is-primary font-[700]">{line.course}</td>
              <td data-label={columns.assigned}>
                {line.assigned}
                <span className="xr-id">{line.mappingId}</span>
              </td>
              {removeHref ? (
                <td>
                  {/* Each link named for its course (the links share an address). */}
                  <Link href={removeHref} aria-label={removeCourseLabel(line.course, fullName)}>
                    {FACULTY_RECORD.remove}
                  </Link>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A key–value list as B2-06 draws it (`dl.doc-kv.xp-kv`, keys 170 px; `doc-` is canvas-only). */
function KeyValues({ rows }: { readonly rows: readonly (readonly [string, ReactNode])[] }) {
  return (
    <dl className="xp-kv m-0 grid grid-cols-[170px_minmax(0,1fr)] gap-x-5 gap-y-[10px] text-[15px] leading-[22px]">
      {rows.map(([name, value]) => (
        <KeyValueRow key={name} name={name}>
          {value}
        </KeyValueRow>
      ))}
    </dl>
  );
}

function KeyValueRow({ name, children }: { readonly name: string; readonly children: ReactNode }) {
  return (
    <>
      <dt className="font-[700] text-ink">{name}</dt>
      <dd className="m-0 text-ink-2">{children}</dd>
    </>
  );
}
