'use client';

import { Link, PageContent, PageHeader, SectionTabs } from '@xr/ui';
import { useEffect } from 'react';

import { PEOPLE_PAGE } from '@/copy/institute-people';
import {
  addPersonAddress,
  destinationPlacement,
  FACULTY_ADDRESS,
  facultyTabPlacement,
  PEOPLE_ADDRESS,
  PEOPLE_TITLE,
} from '@/nav/institute';
import { useAppNavigation } from '@/nav/navigation';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { FacultyTab } from '../ia-08-faculty/faculty';
import { PausedNotice, useInstitutionPaused } from './paused';
import { StudentsTab } from './students';

type PeopleTab = 'students' | 'faculty';

/**
 * IA-06 People › Students and IA-08 People › Faculty — board B2-06 ("Students and faculty at your
 * institution"), at `/institute/people` and `/institute/people?tab=faculty`.
 *
 * - **One page, two tabs** (`nav.xr-tabs` "People", ordinary links): Students and Faculty. B2-06
 *   also draws Groups (IA-13) and Faculty courses (IA-15), which Package 2A does not build: they are
 *   not rendered (DEV-21). Any `tab` other than `faculty` shows Students and the address becomes
 *   the bare `/institute/people` (`navigation.replace`; state-copy `IA-06.tab-address`).
 * - **Header actions as drawn per tab**: "Add student" (IA-10) on Students — B2-06's "Import
 *   students" (IA-11) is not built and not rendered — and "Add faculty member" on Faculty. Adding a
 *   person creates a record only; nothing is sent (T-11).
 * - **Paused institution**: read-only. The writes are not offered and the paused notice shows; the
 *   service refuses every write `institution-paused` all the same (B2-01 f5).
 * - The top bar: "People" on Students; "Faculty", crumbed "People / Faculty", on Faculty (B2-06).
 */
export function People() {
  const navigation = useAppNavigation();
  const tabParam = new URLSearchParams(navigation.search).get('tab');
  const tab: PeopleTab = tabParam === 'faculty' ? 'faculty' : 'students';
  const normalise = tabParam !== null && tab === 'students';
  useEffect(() => {
    if (normalise) navigation.replace(PEOPLE_ADDRESS);
  }, [normalise, navigation]);
  useShellPage(
    tab === 'faculty'
      ? facultyTabPlacement(PEOPLE_PAGE.tabs.faculty)
      : destinationPlacement('IA-06'),
  );
  const paused = useInstitutionPaused();

  const action = paused ? null : tab === 'faculty' ? (
    <Link className="xr-btn xr-btn--primary" href={addPersonAddress('faculty')}>
      {PEOPLE_PAGE.addFaculty}
    </Link>
  ) : (
    <Link className="xr-btn xr-btn--primary" href={addPersonAddress('student')}>
      {PEOPLE_PAGE.addStudent}
    </Link>
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
        ]}
      />
      <div className="h-5" />
      {tab === 'faculty' ? <FacultyTab /> : <StudentsTab paused={paused} />}
    </PageContent>
  );
}
