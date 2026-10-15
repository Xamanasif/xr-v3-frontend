import type { LedgerEntry } from '../link-targets';

/**
 * Phase 4A link targets: the Faculty sidebar (board 06 Faculty `raw[]`; B4-01 … B4-07). Overview,
 * My courses, Assessments and Question bank are built; Marking (FA-18) and Students (FA-20) are
 * Phase 4B and are not rendered until then (DEV-21), so the Faculty sidebar shows four
 * destinations and Help. The assessment record's Submissions tab (FA-12) likewise.
 */
const sidebar = (
  action: string,
  target: string,
  outcome: 'built' | 'not-rendered',
  note: string,
): LedgerEntry => ({
  screen: 'Shell',
  where: 'Sidebar destination (Faculty only)',
  action,
  role: 'secondary',
  on: '/faculty/*',
  target,
  outcome,
  board: '06 (Faculty raw[]); B4-01 f0 (`aria-current="page"` on Overview)',
  note,
});

export const P4_FACULTY_SHELL_LINK_TARGETS: readonly LedgerEntry[] = [
  sidebar('Overview', '/faculty', 'built', 'FA-01 (Phase 4A): the Faculty home.'),
  sidebar('My courses', '/faculty/courses', 'built', 'FA-02 (Phase 4A).'),
  sidebar('Assessments', '/faculty/assessments', 'built', 'FA-06 (Phase 4A).'),
  sidebar('Question bank', '/faculty/question-bank', 'built', 'FA-14 (Phase 4A).'),
  sidebar(
    'Marking',
    '/faculty/marking',
    'not-rendered',
    'FA-18 Marking is not built (Phase 4B): the destination appears with it (DEV-21).',
  ),
  sidebar(
    'Students',
    '/faculty/students',
    'not-rendered',
    'FA-20 Students is not built (Phase 4B): the destination appears with it (DEV-21).',
  ),
];
