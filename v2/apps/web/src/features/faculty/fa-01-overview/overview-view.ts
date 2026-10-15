import type { FacultyAttention, FacultyOverview } from '@xr/contracts/draft';
import type { IconName, RowTone } from '@xr/ui';

import { deadlineWords, endedOnWords } from '@/copy/assessment-words';
import { dayMonthYear } from '@/copy/dates';
import {
  accessEndedSub,
  accessEndedTitle,
  comingUpSub,
  FACULTY_OVERVIEW_WORDS,
  writtenAnswersSub,
  writtenAnswersTitle,
} from '@/copy/faculty-overview';
import { assessmentAddress, FACULTY_MY_COURSES_ADDRESS } from '@/nav/faculty';

/**
 * FA-01's rows, written from the service's facts (B4-01; PC-51 facts, never words). Pure: the page
 * draws what these return.
 */

/** B4-01's attention budget ("at most five attention rows", state-copy `FA-01.attention-rows`). */
export const ATTENTION_BUDGET = 5;

export interface OverviewRow {
  readonly key: string;
  readonly icon: IconName;
  readonly tone?: RowTone;
  readonly title: string;
  readonly sub: string;
  /** `null`: the row is drawn without its action while that page is not built (DEV-21). */
  readonly action: { readonly label: string; readonly href: string } | null;
}

/**
 * One attention fact as its row (state-copy `FA-01.not-rendered`, DEV-21). The access-ended row
 * (f3) opens My courses (FA-02). The written-answers row (f0) is drawn — it is a fact the page
 * must not hide — but without "Mark now" until FA-18 Marking is built. The inactive-students row
 * ("View students", FA-20) is not drawn while FA-20 and its sample rule (OD-B4-10) are not built.
 */
export function attentionRow(fact: FacultyAttention): OverviewRow | null {
  switch (fact.kind) {
    case 'access-ended':
      return {
        key: `access-ended:${fact.experimentId}`,
        icon: 'notAvailable',
        title: accessEndedTitle(fact.experimentName, endedOnWords(fact.endedOn)),
        sub: accessEndedSub(fact.courseCode),
        action: { label: FACULTY_OVERVIEW_WORDS.myCourses, href: FACULTY_MY_COURSES_ADDRESS },
      };
    case 'written-answers-to-mark':
      return {
        key: `written:${fact.assessmentId}`,
        icon: 'marking',
        tone: 'wait',
        title: writtenAnswersTitle(fact.answers),
        sub: writtenAnswersSub(
          fact.assessmentName,
          fact.oldest.studentName,
          dayMonthYear(fact.oldest.submittedAt),
          fact.answers,
        ),
        action: null,
      };
    case 'students-inactive':
      return null;
  }
}

/** The rows "Needs your attention" draws, in the service's order, within the budget. */
export function attentionRows(attention: readonly FacultyAttention[]): readonly OverviewRow[] {
  return attention
    .map(attentionRow)
    .filter((row): row is OverviewRow => row !== null)
    .slice(0, ATTENTION_BUDGET);
}

/** "Coming up": each Ready assessment due in the next 30 days (the service's, at most 3). */
export function comingUpRows(comingUp: FacultyOverview['comingUp']): readonly OverviewRow[] {
  return comingUp.map((item) => ({
    key: item.assessmentId,
    icon: 'calendar',
    title: item.name || item.assessmentId,
    sub: comingUpSub(deadlineWords(item.deadline), item.submitted, item.reach),
    action: { label: FACULTY_OVERVIEW_WORDS.open, href: assessmentAddress(item.assessmentId) },
  }));
}
