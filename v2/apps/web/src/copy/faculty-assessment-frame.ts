/**
 * The assessment record frame's words in the V3 Refined B design (the owner-approved export
 * design/v3-refined-b/roles/FA-v1, `project/Main.dc.html` "FA-08…FA-12 Assessment record" and the
 * script's `vmRecord`): the tab names, the record band's meta ("Version 2", "2 waiting for
 * marking") and figures ("7 days left · Due 14 Nov 2026, 23:59", "2 of 5 · Students submitted",
 * "4 · Questions · 16 marks"). The assessment is named by its name (`assessmentName`), never by its
 * internal reference.
 */
import { waitingForMarkingWords } from './fa-shared';

export const ASSESSMENT_TAB_TITLES = {
  summary: 'Summary',
  questions: 'Questions',
  settings: 'Settings',
  preview: 'Preview',
} as const;

/** "Heat Exchanger — post-lab sections" (`nav.rk-tabs.fa-tabs[aria-label]`). */
export function recordTabsLabel(name: string): string {
  return `${name} sections`;
}

/** "Version 2" (the band's meta). */
export function versionWords(version: number): string {
  return `Version ${version}`;
}

/** "Created by Dr Anita Desai" (a co-teaching colleague's assessment). */
export function createdByWords(name: string): string {
  return `Created by ${name}`;
}

/** "2 waiting for marking" (the band's link to Marking). */
export function waitingWords(count: number): string {
  return waitingForMarkingWords(count);
}

export const RECORD_FIGURES = {
  deadline: 'Deadline',
  notSetYet: 'Not set yet',
  deadlinePassed: 'Deadline passed',
  studentsSubmitted: 'Students submitted',
  studentsWithAccess: 'Students with access',
  noneYet: 'None yet',
  questions: 'Questions',
} as const;

/** "Due 14 Nov 2026, 23:59". */
export function dueWords(deadline: string): string {
  return `Due ${deadline}`;
}

/** "2 of 5" (students submitted of the students it reaches). */
export function submittedOfWords(submitted: number, reach: number): string {
  return `${submitted} of ${reach}`;
}

/** "Questions · 16 marks". */
export function questionsMarksKey(marks: number): string {
  return `${RECORD_FIGURES.questions} · ${marks} ${marks === 1 ? 'mark' : 'marks'}`;
}
