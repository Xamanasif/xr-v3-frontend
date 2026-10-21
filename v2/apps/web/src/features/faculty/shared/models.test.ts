/**
 * The shared Faculty presentation models on the records the sample world answers (after Flow D:
 * Dr S. Ranganathan's Shell-and-Tube Heat Exchanger, its Ready assessment with Rahul's confirmed
 * marks, the experiment's per-format counts, the submissions file), against the export's own
 * formulas (`fmProg`, `unitsOf`, `asmState`, `stLabelOf`, `left`, the FA-22 preview). No word they
 * produce names a record by its internal reference.
 */
import type { ExperimentId } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { faExport } from '@/test-support/boards';
import { PERSON_OF_ROLE, tabPlatform } from '@/test-support/workspace';

import { assessmentStateLongView, assessmentStateView } from './assessment-state';
import { csvTable } from './csv-preview';
import { deadlineView, deadlineWords } from './deadline-model';
import { formatProgressRows, progressUnits, submittedUnits } from './progress-model';

const MAIN = faExport('Main.dc.html');
const SCRIPT = MAIN.slice(MAIN.indexOf('<script type="text/x-dc"'));
const TEMPLATE = MAIN.slice(0, MAIN.indexOf('<script type="text/x-dc"'));
const INTERNAL_REFERENCE = /\b(?:ASMT|ATT|Q|D|SUB|UPD|REQ|ACC)-\d+/;
const SHELL = 'shell-and-tube-heat-exchanger' as ExperimentId;

async function value<T>(answer: Promise<{ ok: true; value: T } | { ok: false; error: unknown }>) {
  const result = await answer;
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value;
}

async function afterFlowD() {
  const { runtime } = await tabPlatform(PERSON_OF_ROLE.faculty, 'after-flow-d');
  const session = runtime.session.getSnapshot();
  const now = session.status === 'signed-in' ? session.signedInAt : '';
  const teaching = await value(runtime.ports.teaching.getTeachingExperiment(SHELL));
  const assessments = await value(runtime.ports.assessments.listAssessments());
  const own = assessments.find((row) => row.assessment.experimentId === SHELL)!;
  const file = await value(runtime.ports.assessments.exportSubmissionsCsv(own.assessment.id));
  return { now, teaching, assessments, own, file };
}

describe('the unit meters and per-format progress (the export’s `fmProg`, `unitsOf`)', () => {
  it('one unit per student, completed first, then in progress, then not started', () => {
    expect(progressUnits({ completed: 2, inProgress: 1, notStarted: 2 })).toEqual([
      'done',
      'done',
      'progress',
      'none',
      'none',
    ]);
    expect(SCRIPT).toContain('rank = { done: 0, prog: 1, none: 2 }');
    expect(SCRIPT).toContain('.sort((x, y) => (y ? 1 : 0) - (x ? 1 : 0))');
    // Submitted first; never more submitted units than students with access.
    expect(submittedUnits(2, 5)).toEqual(['submitted', 'submitted', 'none', 'none', 'none']);
    expect(submittedUnits(7, 3)).toEqual(['submitted', 'submitted', 'submitted']);
    expect(submittedUnits(0, 0)).toEqual([]);
  });

  it('the teaching read’s counts, every format the institution has, in WEB · AR · VR · MR order', async () => {
    const { teaching } = await afterFlowD();
    const rows = formatProgressRows(teaching.perFormatCounts);
    expect(rows.map((row) => row.format)).toEqual(
      ['WEB', 'AR', 'VR', 'MR'].filter((code) => rows.some((row) => row.format === code)),
    );
    expect(rows).toHaveLength(teaching.perFormatCounts.length);
    for (const row of rows) {
      const counts = teaching.perFormatCounts.find(
        (count) => count.format === row.format.toLowerCase(),
      )!;
      expect([row.completed, row.inProgress, row.notStarted]).toEqual([
        counts.completed,
        counts.inProgress,
        counts.notStarted,
      ]);
      expect(row.units).toHaveLength(counts.completed + counts.inProgress + counts.notStarted);
      expect(row.units.filter((unit) => unit === 'done')).toHaveLength(counts.completed);
    }
    // The sample world's Students are counted per format: some activity is held.
    expect(rows.some((row) => row.completed + row.inProgress > 0)).toBe(true);
  });
});

describe('an assessment’s state (the export’s `asmState`, `stLabelOf`)', () => {
  it('Ready is the ok tick; a draft and no assessment the neutral dot', () => {
    expect(SCRIPT).toContain("if (!a) return { label: 'No assessment yet', cls: 'xr-st' };");
    expect(SCRIPT).toContain(
      "if (!this.isReady(a)) return { label: 'Draft — not ready', cls: 'xr-st' };",
    );
    expect(SCRIPT).toContain("return { label: 'Ready', cls: 'xr-st xr-st--ok' };");
    expect(assessmentStateView('ready')).toEqual({ tone: 'ok', words: 'Ready' });
    expect(assessmentStateView('draft-not-ready')).toEqual({
      tone: 'neutral',
      words: 'Draft — not ready',
    });
    expect(assessmentStateView(null)).toEqual({ tone: 'neutral', words: 'No assessment yet' });
  });

  it('the teaching pages’ longer words', () => {
    expect(SCRIPT).toContain(
      "stLabelOf(st) { return st.label === 'Ready' ? 'Assessment ready' : st.label === 'No assessment yet' ? 'No assessment yet' : 'Assessment in draft'; }",
    );
    expect(assessmentStateLongView('ready')).toEqual({ tone: 'ok', words: 'Assessment ready' });
    expect(assessmentStateLongView('draft-not-ready')).toEqual({
      tone: 'neutral',
      words: 'Assessment in draft',
    });
    expect(assessmentStateLongView(null)).toEqual({ tone: 'neutral', words: 'No assessment yet' });
  });

  it('the after-Flow-D assessment the list answers is Ready', async () => {
    const { own } = await afterFlowD();
    expect(assessmentStateView(own.readiness)).toEqual({ tone: 'ok', words: 'Ready' });
  });
});

describe('a deadline on the session’s day (the export’s `left`, `dueNote`)', () => {
  const now = '2026-11-07T04:45:00.000Z'; // Saturday 7 Nov 2026, 10:15 in Indian time.

  it('calendar days in Indian time; the same day is “Due today” or “today”; past is “Deadline passed”', () => {
    expect(deadlineView('2026-11-14T18:29:00.000Z', now)).toEqual({ days: 7, passed: false });
    expect(deadlineWords('2026-11-14T18:29:00.000Z', now)).toBe('7 days left');
    expect(deadlineWords('2026-11-08T05:00:00.000Z', now)).toBe('1 day left');
    // 23:59 on 7 Nov in Indian time is still today.
    expect(deadlineView('2026-11-07T18:29:00.000Z', now)).toEqual({ days: 0, passed: false });
    expect(deadlineWords('2026-11-07T18:29:00.000Z', now)).toBe('Due today');
    expect(deadlineWords('2026-11-07T18:29:00.000Z', now, 'short')).toBe('today');
    expect(deadlineWords('2026-11-06T18:29:00.000Z', now)).toBe('Deadline passed');
    expect(SCRIPT).toContain("left: days === 0 ? 'Due today' : this.plural(days, 'day') + ' left'");
    expect(SCRIPT).toContain("left: days === 0 ? 'today' : this.plural(days, 'day') + ' left'");
    expect(SCRIPT).toContain("dueNote: 'Deadline passed'");
  });

  it('the after-Flow-D deadline against the session’s clock', async () => {
    const { now: sessionNow, own } = await afterFlowD();
    const deadline = own.assessment.rules.deadline;
    expect(deadline).toBeTruthy();
    const words = deadlineWords(deadline!, sessionNow);
    expect(words).toMatch(/^(?:\d+ days? left|Due today|Deadline passed)$/);
    expect(words).not.toMatch(INTERNAL_REFERENCE);
  });
});

describe('the FA-22 preview of the service’s file', () => {
  it('the submissions file’s header is the export’s preview head; its rows are the list’s', async () => {
    const { file, own } = await afterFlowD();
    const table = csvTable(file.csv);
    const head = TEMPLATE.slice(
      TEMPLATE.indexOf('<caption>Rows in the exported file</caption>'),
      TEMPLATE.indexOf(
        '</thead>',
        TEMPLATE.indexOf('<caption>Rows in the exported file</caption>'),
      ),
    );
    expect(table.columns).toEqual(
      [...head.matchAll(/<th scope="col">([^<]+)<\/th>/g)].map((m) => m[1]),
    );
    expect(table.rows.length).toBe(own.submitted);
    for (const row of table.rows) expect(row).toHaveLength(table.columns.length);
    // The cells are the file's own (names and institution student IDs), never an attempt's id.
    expect(table.rows.flat().join(' ')).not.toMatch(/\bATT-\d+/);
  });

  it('reads quoted cells, doubled quotes, line breaks and a byte-order mark as RFC 4180 writes them', () => {
    expect(
      csvTable('﻿student,note\r\n"Verma, Rahul","He said ""done""\nlater"\r\nArun,\r\n'),
    ).toEqual({
      columns: ['student', 'note'],
      rows: [
        ['Verma, Rahul', 'He said "done"\nlater'],
        ['Arun', ''],
      ],
    });
    expect(csvTable('')).toEqual({ columns: [], rows: [] });
  });
});
