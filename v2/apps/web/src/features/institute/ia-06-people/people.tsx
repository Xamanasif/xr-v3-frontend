'use client';

import {
  Button,
  ButtonLink,
  ContentStack,
  IaPeopleTabs,
  type IaPeopleTab,
  PageHead,
} from '@xr/ui/v3';
import { useEffect, useState } from 'react';

import { GROUPS_TAB, groupCountWords } from '@/copy/groups';
import { tabCountWords } from '@/copy/ia-people';
import { facultyCountWords, PEOPLE_PAGE, studentCountWords } from '@/copy/institute-people';
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
import { useAllStudents, useFacultyDirectory, useGroupList } from '@/queries/people';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { FacultyTab } from '../ia-08-faculty/faculty';
import { CREATE_GROUP_ID, GroupsTab } from '../ia-13-groups/groups';
import { FacultyCoursesTab } from '../ia-15-faculty-courses/faculty-courses';
import { useInstitutionPaused } from '../shared/paused';
import { useInstituteTodayLine } from '../shared/use-today-line';
import { StudentsTab } from './students';

type PeopleTab = 'students' | 'faculty' | 'groups' | 'faculty-courses';

const TABS: readonly PeopleTab[] = ['students', 'faculty', 'groups', 'faculty-courses'];

/** The page's H1: where focus lands after a navigation (V3 shell route focus). */
const TITLE_ID = 'ia-h1';

/** A read's length once it has answered, for a tab's count; none while it has not. */
function countOf(read: { readonly data?: { readonly ok: boolean; readonly value?: unknown } }) {
  const data = read.data;
  return data?.ok && Array.isArray(data.value) ? data.value.length : null;
}

/**
 * People — the owner-approved V3 export's People page (IA-v1 `Main.dc.html` "People head and
 * tabs"): the head ("People", its line, the tab's actions), then the People tabs with their counts
 * (`nav.ia-tabs` "People", ordinary links; a 2 × 2 grid on phones) and the tab:
 *
 * - **Students** (IA-06, `/institute/people`), **Faculty** (IA-08, `?tab=faculty`), **Groups**
 *   (IA-13, `?tab=groups`) and **Faculty courses** (IA-15, `?tab=faculty-courses`). Any other `tab`
 *   shows Students and the address becomes the bare `/institute/people` (`navigation.replace`;
 *   state-copy `IA-06.tab-address`).
 * - **The counts** are the reads' own answers: every student (`listStudents` unfiltered), every
 *   faculty member (`listFaculty`), every group (`listGroups`); none on Faculty courses, and none
 *   while a read has not answered.
 * - **Header actions as drawn per tab**: "Import students" and "Add student" (primary) on Students,
 *   "Add faculty member" on Faculty, "Create group" on Groups (opening DL-3 on the tab); none on
 *   Faculty courses. Adding or importing a person creates a record only; nothing is sent (T-11).
 * - **Paused institution**: read-only. The writes are not offered and each tab shows the paused
 *   notice; the service refuses every write `institution-paused` all the same (B2-01 f5).
 * - The tab title: "People" on Students; a tab with an id of its own reads the tab ("Faculty",
 *   "Groups", "Faculty courses").
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
  const today = useInstituteTodayLine();
  const paused = useInstitutionPaused();
  const [creating, setCreating] = useState(false);
  // DL-3 belongs to the Groups tab: leaving the tab closes it (state adjusted while rendering).
  const [shownTab, setShownTab] = useState(tab);
  if (shownTab !== tab) {
    setShownTab(tab);
    setCreating(false);
  }

  const students = countOf(useAllStudents());
  const faculty = countOf(useFacultyDirectory());
  const groups = countOf(useGroupList());
  const count = (value: number | null, words: (value: number) => string) =>
    value === null ? null : { value, words: tabCountWords(words(value)) };
  const tabs: IaPeopleTab[] = [
    {
      label: PEOPLE_PAGE.tabs.students,
      href: PEOPLE_ADDRESS,
      current: tab === 'students',
      count: count(students, (n) => studentCountWords(n, n, false)),
    },
    {
      label: PEOPLE_PAGE.tabs.faculty,
      href: FACULTY_ADDRESS,
      current: tab === 'faculty',
      count: count(faculty, (n) => facultyCountWords(n, n, false)),
    },
    {
      label: PEOPLE_PAGE.tabs.groups,
      href: GROUPS_ADDRESS,
      current: tab === 'groups',
      count: count(groups, groupCountWords),
    },
    {
      label: PEOPLE_PAGE.tabs.facultyCourses,
      href: FACULTY_COURSES_ADDRESS,
      current: tab === 'faculty-courses',
    },
  ];

  const actions = paused ? null : tab === 'faculty' ? (
    <ButtonLink variant="primary" size="lg" href={addPersonAddress('faculty')}>
      {PEOPLE_PAGE.addFaculty}
    </ButtonLink>
  ) : tab === 'groups' ? (
    <Button id={CREATE_GROUP_ID} variant="primary" size="lg" onClick={() => setCreating(true)}>
      {GROUPS_TAB.createGroup}
    </Button>
  ) : tab === 'faculty-courses' ? null : (
    <>
      <ButtonLink size="lg" href={IMPORT_STUDENTS_ADDRESS}>
        {PEOPLE_PAGE.importStudents}
      </ButtonLink>
      <ButtonLink variant="primary" size="lg" href={addPersonAddress('student')}>
        {PEOPLE_PAGE.addStudent}
      </ButtonLink>
    </>
  );

  return (
    <>
      <PageHead
        title={PEOPLE_TITLE}
        titleId={TITLE_ID}
        titleFocusTarget
        date={today}
        lead={PEOPLE_PAGE.meta}
        actions={actions}
      />
      <ContentStack>
        <IaPeopleTabs label={PEOPLE_PAGE.tabsLabel} tabs={tabs} />
        {tab === 'faculty' ? (
          <FacultyTab paused={paused} />
        ) : tab === 'groups' ? (
          <GroupsTab paused={paused} creating={creating} onCreatingChange={setCreating} />
        ) : tab === 'faculty-courses' ? (
          <FacultyCoursesTab paused={paused} />
        ) : (
          <StudentsTab paused={paused} />
        )}
      </ContentStack>
    </>
  );
}
