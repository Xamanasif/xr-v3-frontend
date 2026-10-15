'use client';

import { Button, Link, PageContent, PageHeader, SectionTabs } from '@xr/ui';
import { useEffect, useState } from 'react';

import { GROUPS_TAB } from '@/copy/groups';
import { PEOPLE_PAGE } from '@/copy/institute-people';
import {
  addPersonAddress,
  destinationPlacement,
  FACULTY_ADDRESS,
  FACULTY_COURSES_ADDRESS,
  GROUPS_ADDRESS,
  IMPORT_STUDENTS_ADDRESS,
  PEOPLE_ADDRESS,
  PEOPLE_TITLE,
  tabPlacement,
} from '@/nav/institute';
import { useAppNavigation } from '@/nav/navigation';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { FacultyTab } from '../ia-08-faculty/faculty';
import { CREATE_GROUP_ID, GroupsTab } from '../ia-13-groups/groups';
import { FacultyCoursesTab } from '../ia-15-faculty-courses/faculty-courses';
import { PausedNotice, useInstitutionPaused } from './paused';
import { StudentsTab } from './students';

type PeopleTab = 'students' | 'faculty' | 'groups' | 'faculty-courses';

const TABS: readonly PeopleTab[] = ['students', 'faculty', 'groups', 'faculty-courses'];

/**
 * People — board B2-06 ("Students and faculty at your institution"), one page with four tabs
 * (`nav.xr-tabs` "People", ordinary links; Appendix A rule T2):
 *
 * - **Students** (IA-06, `/institute/people`), **Faculty** (IA-08, `?tab=faculty`), **Groups**
 *   (IA-13, `?tab=groups`, B2-08) and **Faculty courses** (IA-15, `?tab=faculty-courses`, B2-09).
 *   Any other `tab` shows Students and the address becomes the bare `/institute/people`
 *   (`navigation.replace`; state-copy `IA-06.tab-address`).
 * - **Header actions as drawn per tab**: "Import students" (IA-11) and "Add student" (IA-10) on
 *   Students (B2-06 f0), "Add faculty member" on Faculty (f14), "Create group" on Groups (B2-08 f0,
 *   opening DL-3 on the tab); none on Faculty courses (B2-09 f0). Adding or importing a person
 *   creates a record only; nothing is sent (T-11).
 * - **Paused institution**: read-only. The writes are not offered and the paused notice shows; the
 *   service refuses every write `institution-paused` all the same (B2-01 f5).
 * - The top bar: "People" on Students; a tab with an id of its own reads the tab, crumbed under
 *   People — "People / Faculty", "People / Groups", "People / Faculty courses".
 */
export function People() {
  const navigation = useAppNavigation();
  const tabParam = new URLSearchParams(navigation.search).get('tab');
  const tab: PeopleTab = TABS.includes(tabParam as PeopleTab)
    ? (tabParam as PeopleTab)
    : 'students';
  const normalise = tabParam !== null && tab === 'students';
  useEffect(() => {
    if (normalise) navigation.replace(PEOPLE_ADDRESS);
  }, [normalise, navigation]);
  useShellPage(
    tab === 'faculty'
      ? tabPlacement('IA-08', PEOPLE_PAGE.tabs.faculty)
      : tab === 'groups'
        ? tabPlacement('IA-13', PEOPLE_PAGE.tabs.groups)
        : tab === 'faculty-courses'
          ? tabPlacement('IA-15', PEOPLE_PAGE.tabs.facultyCourses)
          : destinationPlacement('IA-06'),
  );
  const paused = useInstitutionPaused();
  const [creating, setCreating] = useState(false);
  // DL-3 belongs to the Groups tab: leaving the tab closes it (state adjusted while rendering).
  const [shownTab, setShownTab] = useState(tab);
  if (shownTab !== tab) {
    setShownTab(tab);
    setCreating(false);
  }

  const action = paused ? null : tab === 'faculty' ? (
    <Link className="xr-btn xr-btn--primary" href={addPersonAddress('faculty')}>
      {PEOPLE_PAGE.addFaculty}
    </Link>
  ) : tab === 'groups' ? (
    <Button id={CREATE_GROUP_ID} variant="primary" onClick={() => setCreating(true)}>
      {GROUPS_TAB.createGroup}
    </Button>
  ) : tab === 'faculty-courses' ? null : (
    <>
      <Link className="xr-btn xr-btn--secondary" href={IMPORT_STUDENTS_ADDRESS}>
        {PEOPLE_PAGE.importStudents}
      </Link>
      <Link className="xr-btn xr-btn--primary" href={addPersonAddress('student')}>
        {PEOPLE_PAGE.addStudent}
      </Link>
    </>
  );

  return (
    <PageContent wrap="wide">
      <PageHeader className="mb-4" title={PEOPLE_TITLE} meta={PEOPLE_PAGE.meta} actions={action} />
      {paused ? <PausedNotice className="mb-4" /> : null}
      <SectionTabs
        label={PEOPLE_PAGE.tabsLabel}
        tabs={[
          {
            href: PEOPLE_ADDRESS,
            label: PEOPLE_PAGE.tabs.students,
            current: tab === 'students',
          },
          { href: FACULTY_ADDRESS, label: PEOPLE_PAGE.tabs.faculty, current: tab === 'faculty' },
          { href: GROUPS_ADDRESS, label: PEOPLE_PAGE.tabs.groups, current: tab === 'groups' },
          {
            href: FACULTY_COURSES_ADDRESS,
            label: PEOPLE_PAGE.tabs.facultyCourses,
            current: tab === 'faculty-courses',
          },
        ]}
      />
      <div className="h-5" />
      {tab === 'faculty' ? (
        <FacultyTab />
      ) : tab === 'groups' ? (
        <GroupsTab paused={paused} creating={creating} onCreatingChange={setCreating} />
      ) : tab === 'faculty-courses' ? (
        <FacultyCoursesTab paused={paused} />
      ) : (
        <StudentsTab paused={paused} />
      )}
    </PageContent>
  );
}
