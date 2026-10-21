import { HELP_TITLE } from './help';
import {
  CONTENT_ACCESS_TITLE,
  OVERVIEW_TITLE as INSTITUTE_OVERVIEW_TITLE,
  PEOPLE_TITLE,
  STUDENT_ACCESS_TITLE,
} from './institute';
import { INSTITUTIONS_TITLE, OVERVIEW_TITLE } from './institutions';
import { REQUESTS_TITLE } from './requests';
import { resolveAddress } from './routes';
import { INSTITUTE_REQUESTS_TITLE } from './institute-requests';
import { USAGE_TITLE } from './institute-usage';
import {
  ASSESSMENTS_TITLE,
  FACULTY_MY_COURSES_TITLE,
  FACULTY_OVERVIEW_TITLE,
  FACULTY_STUDENTS_TITLE,
  MARKING_TITLE,
  QUESTION_BANK_TITLE,
} from './faculty';
import { WORKSPACE_NAV } from './nav-config';
import { OPERATIONS_TITLE } from './operations';
import { CONTENT_TITLE } from './admin-content';
import { ROLES_TITLE } from './platform-roles';
import { STRUCTURE_TITLE } from './structure';
import { HOME_TITLE, MY_COURSES_TITLE } from './student';
import { STUDENT_ASSESSMENTS_TITLE } from './student-assessments';
import { MY_DEVICE_TITLE } from './student-device';
import { PROGRESS_TITLE } from './student-progress';
import { MY_EXPERIMENTS_TITLE, VENDOR_OVERVIEW_TITLE } from './vendor';
import { REVIEWED_BY_ME_TITLE, REVIEW_QUEUE_TITLE, REVIEWER_OVERVIEW_TITLE } from './reviewer';
import {
  CM_OVERVIEW_TITLE,
  CONTENT_LIBRARY_TITLE,
  COURSE_CODES_TITLE,
  UPDATES_TITLE,
  READY_TO_PUBLISH_TITLE,
} from './content-manager';

/**
 * The return address in words, for XS-03 "Session expired" (B1-09 f9: "Sign in again to go back
 * to where you were: My courses › Shell-and-Tube Heat Exchanger" — "Return address kept and
 * shown"). PROVISIONAL rule (state-copy `XS-03.return-place`):
 *
 * - Only an address of a built page has words: the page's crumbs and title as its top bar shows
 *   them, joined with " › " as B1-09 writes the place. Any other address has none — never the
 *   address itself (board 08 "Never show route names").
 * - The address is untrusted text (a link can carry any `returnTo`). A record's reference is shown
 *   only when it has the shape the boards give references (`REQ-0042`, `SUP-0213`); anything
 *   else names the list alone, so no sentence can be written into the sign-in card through a link.
 * - Whether the person may go back there is decided after sign-in (`return-to.ts`), not here.
 */
const REFERENCE = /^[A-Z]{2,5}-\d{4}$/;

/** IA-18's tab words, as the Requests destination names its section tabs (board 06). */
const DEVICE_REQUESTS_TITLE = WORKSPACE_NAV.tenant_admin.destinations.find(
  (destination) => destination.screen === 'IA-17',
)!.sectionTabs![1]!;

function referenceIn(path: string): string | null {
  const last =
    path
      .split('/')
      .filter((part) => part !== '')
      .at(-1) ?? '';
  let decoded: string;
  try {
    decoded = decodeURIComponent(last);
  } catch {
    return null;
  }
  return REFERENCE.test(decoded) ? decoded : null;
}

export function placeWordsOf(returnTo: string | null): string | null {
  if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) return null;
  const pathname = returnTo.split(/[?#]/, 1)[0]!;
  const outcome = resolveAddress(pathname);
  switch (outcome.kind) {
    case 'screen': {
      if (outcome.view === 'reports') return HELP_TITLE;
      if (outcome.view === 'report') return `${HELP_TITLE} › Report a problem`;
      // A Super Admin sees no report reference anywhere (owner decision 6; SA-v1).
      const reference = pathname.startsWith('/admin/') ? null : referenceIn(pathname);
      return reference ? `${HELP_TITLE} › ${reference}` : HELP_TITLE;
    }
    case 'record-screen': {
      // Package 1D: the Overview, and Institutions — whose detail addresses carry an institution
      // id, not a drawn reference, so they name the list alone.
      if (outcome.screen === 'SA-01') return OVERVIEW_TITLE;
      if (outcome.screen === 'SA-06' || outcome.screen === 'SA-07') return INSTITUTIONS_TITLE;
      if (outcome.screen === 'SA-02') return REQUESTS_TITLE;
      // Package 2A: each page names its destination; an access plan its drawn reference
      // ("Content access › ACC-0107"). Students, people, courses and experiments are addressed by
      // ids, not drawn references, so they name the destination alone.
      if (outcome.screen === 'IA-01') return INSTITUTE_OVERVIEW_TITLE;
      if (outcome.screen === 'IA-02') return CONTENT_ACCESS_TITLE;
      if (outcome.screen === 'IA-03') {
        const plan = referenceIn(pathname);
        return plan ? `${CONTENT_ACCESS_TITLE} › ${plan}` : CONTENT_ACCESS_TITLE;
      }
      if (outcome.screen === 'IA-04' || outcome.screen === 'IA-05') return STUDENT_ACCESS_TITLE;
      // Package 2B: the Faculty record, Import students and a Group name People.
      if (
        outcome.screen === 'IA-06' ||
        outcome.screen === 'IA-07' ||
        outcome.screen === 'IA-09' ||
        outcome.screen === 'IA-10' ||
        outcome.screen === 'IA-11' ||
        outcome.screen === 'IA-14'
      )
        return PEOPLE_TITLE;
      if (outcome.screen === 'ST-01') return HOME_TITLE;
      // Phase 3: the hub's tabs and pages, and feedback, name My courses (experiments are
      // addressed by ids); Progress, My device and Usage name themselves; the Institute Admin's
      // requests and the Super Admin's transfers name their list (no reference: below).
      if (
        outcome.screen === 'ST-02' ||
        outcome.screen === 'ST-03' ||
        outcome.screen === 'ST-05' ||
        outcome.screen === 'ST-06' ||
        outcome.screen === 'ST-07' ||
        outcome.screen === 'ST-08' ||
        outcome.screen === 'ST-09' ||
        outcome.screen === 'ST-10' ||
        outcome.screen === 'ST-16'
      )
        return MY_COURSES_TITLE;
      if (outcome.screen === 'ST-15') return PROGRESS_TITLE;
      if (outcome.screen === 'ST-18') return MY_DEVICE_TITLE;
      if (outcome.screen === 'IA-20') return USAGE_TITLE;
      // Phase 4A: each Faculty page names its destination (courses, experiments, questions and
      // assessments are addressed by ids, not drawn references); an assessment adds its drawn
      // reference ("Assessments › ASMT-0009").
      if (outcome.screen === 'FA-01') return FACULTY_OVERVIEW_TITLE;
      if (outcome.screen === 'FA-02' || outcome.screen === 'FA-03' || outcome.screen === 'FA-05')
        return FACULTY_MY_COURSES_TITLE;
      if (
        outcome.screen === 'FA-14' ||
        outcome.screen === 'FA-15' ||
        outcome.screen === 'FA-16' ||
        outcome.screen === 'FA-17'
      )
        return QUESTION_BANK_TITLE;
      const reference = referenceIn(pathname);
      const assessment = /\/assessments\/(ASMT-\d{4})(?:\/|$)/.exec(pathname)?.[1];
      if (
        outcome.screen === 'FA-06' ||
        outcome.screen === 'FA-07' ||
        outcome.screen === 'FA-08' ||
        outcome.screen === 'FA-09' ||
        outcome.screen === 'FA-10' ||
        outcome.screen === 'FA-11' ||
        outcome.screen === 'FA-12'
      ) {
        return assessment ? `${ASSESSMENTS_TITLE} › ${assessment}` : ASSESSMENTS_TITLE;
      }
      // Phase 4B: the Student's assessment pages name Assessments and the drawn reference
      // ("Assessments › ASMT-0009"); marking a submission names its attempt ("Marking ›
      // ATT-0450"); Students are addressed by ids, so they name the destination alone.
      if (
        outcome.screen === 'ST-11' ||
        outcome.screen === 'ST-12' ||
        outcome.screen === 'ST-13' ||
        outcome.screen === 'ST-14'
      ) {
        return assessment
          ? `${STUDENT_ASSESSMENTS_TITLE} › ${assessment}`
          : STUDENT_ASSESSMENTS_TITLE;
      }
      if (outcome.screen === 'FA-18') return MARKING_TITLE;
      if (outcome.screen === 'FA-19') {
        const attempt = /\/marking\/(ATT-\d{4})(?:\/|$)/.exec(pathname)?.[1];
        return attempt ? `${MARKING_TITLE} › ${attempt}` : MARKING_TITLE;
      }
      if (outcome.screen === 'FA-20' || outcome.screen === 'FA-21') return FACULTY_STUDENTS_TITLE;
      // Phase 5: each page names its destination and a submission its drawn reference ("My
      // experiments › SUB-0077", "Ready to publish › SUB-0077"; the reviewer's names none);
      // published experiments are addressed by ids, so they name the library alone.
      if (outcome.screen === 'VE-01') return VENDOR_OVERVIEW_TITLE;
      if (
        outcome.screen === 'VE-02' ||
        outcome.screen === 'VE-03' ||
        outcome.screen === 'VE-07' ||
        outcome.screen === 'VE-08' ||
        outcome.screen === 'VE-09'
      ) {
        return reference ? `${MY_EXPERIMENTS_TITLE} › ${reference}` : MY_EXPERIMENTS_TITLE;
      }
      if (outcome.screen === 'RV-01') return REVIEWER_OVERVIEW_TITLE;
      // The Academic Reviewer's pages never show a record's reference (the owner-approved
      // reviewer export, RV-v1 HANDOFF "Internal technical identifiers"): a submission's address
      // names the Review queue alone.
      if (outcome.screen === 'RV-02' || outcome.screen === 'RV-03') return REVIEW_QUEUE_TITLE;
      if (outcome.screen === 'RV-05') return REVIEWED_BY_ME_TITLE;
      if (outcome.screen === 'CM-01') return CM_OVERVIEW_TITLE;
      if (outcome.screen === 'CM-02' || outcome.screen === 'CM-03') {
        return reference ? `${READY_TO_PUBLISH_TITLE} › ${reference}` : READY_TO_PUBLISH_TITLE;
      }
      if (outcome.screen === 'CM-04' || outcome.screen === 'CM-05') return CONTENT_LIBRARY_TITLE;
      if (outcome.screen === 'CM-09') return COURSE_CODES_TITLE;
      // The Institute Admin's pages never show a request's or a device request's reference (the
      // owner's identifier rule, state-copy `IA-17.no-reference`): a request's address names
      // Requests alone, a device request's the Device requests tab under it.
      if (outcome.screen === 'IA-17') return INSTITUTE_REQUESTS_TITLE;
      if (outcome.screen === 'IA-19') {
        return `${INSTITUTE_REQUESTS_TITLE} › ${DEVICE_REQUESTS_TITLE}`;
      }
      // The Super Admin's own records never show a reference (the owner-approved Super Admin
      // export, SA-v1 HANDOFF: "Internal references … never appear in visible text"): their
      // addresses name the destination alone.
      if (outcome.screen === 'SA-18' || outcome.screen === 'SA-19') return OPERATIONS_TITLE;
      // Phase 6: an update names its drawn reference in the Content Manager's workspace
      // ("Updates › UPD-0005"; the Academic Reviewer's names none, as above); the Super
      // Admin's Content and Operations name the destination alone (SA-v1); areas, courses,
      // holders and published experiments are addressed by ids, so they do too.
      if (outcome.screen === 'CM-08') {
        return reference ? `${UPDATES_TITLE} › ${reference}` : UPDATES_TITLE;
      }
      if (outcome.screen === 'RV-04') return REVIEW_QUEUE_TITLE;
      if (
        outcome.screen === 'SA-10' ||
        outcome.screen === 'SA-11' ||
        outcome.screen === 'SA-12' ||
        outcome.screen === 'SA-13'
      ) {
        return CONTENT_TITLE;
      }
      if (outcome.screen === 'SA-14' || outcome.screen === 'SA-15') return STRUCTURE_TITLE;
      if (outcome.screen === 'SA-16' || outcome.screen === 'SA-17') return ROLES_TITLE;
      if (outcome.screen === 'SA-20' || outcome.screen === 'SA-21' || outcome.screen === 'SA-22') {
        return OPERATIONS_TITLE;
      }
      // SA-03, the Super Admin's request decision.
      return REQUESTS_TITLE;
    }
    default:
      return null;
  }
}
