import type { LedgerEntry } from '../link-targets';

/**
 * Phase 4A link targets: the Faculty sidebar (board 06 Faculty `raw[]`; B4-01 … B4-07). Overview,
 * My courses, Assessments and Question bank are built; Marking (FA-18) and Students (FA-20) since
 * Phase 4B, so the Faculty sidebar shows all six destinations and Help (board 06).
 */
const sidebar = (action: string, target: string, note: string): LedgerEntry => ({
  screen: 'Shell',
  where: 'Sidebar destination (Faculty only)',
  action,
  role: 'secondary',
  on: '/faculty/*',
  target,
  outcome: 'built',
  board: '06 (Faculty raw[]); B4-01 f0 (`aria-current="page"` on Overview)',
  note,
});

export const P4_FACULTY_SHELL_LINK_TARGETS: readonly LedgerEntry[] = [
  sidebar('Overview', '/faculty', 'FA-01 (Phase 4A): the Faculty home.'),
  sidebar('My courses', '/faculty/courses', 'FA-02 (Phase 4A).'),
  sidebar('Assessments', '/faculty/assessments', 'FA-06 (Phase 4A).'),
  sidebar('Question bank', '/faculty/question-bank', 'FA-14 (Phase 4A).'),
  sidebar(
    'Marking',
    '/faculty/marking',
    'FA-18 (Phase 4B), with the count of written answers waiting (B4-09 f0 “Marking 2”).',
  ),
  sidebar('Students', '/faculty/students', 'FA-20 (Phase 4B).'),
];
