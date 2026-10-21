/**
 * The Student's shared format model on the records the sample world answers — Rahul's
 * Shell-and-Tube Heat Exchanger (after Flow B: nothing opened; WEB opened and saved by the
 * simulation; after Flow C: WEB and VR completed, feedback sent) and Fatima Begum's licence wait
 * (later sample) — against the export's own rules (`avail`, `fmtChip`, `runWord`, `progExp`,
 * `offFormats`). No stage is read or drawn; no word names a record by its internal reference.
 */
import type { ExperimentId } from '@xr/domain';
import { ist, standinsOf } from '@xr/sample-platform/testing';
import { describe, expect, it } from 'vitest';

import { NO_LICENCE_TELL_MORE } from '@/copy/st-shared';
import { stExport } from '@/test-support/boards';
import { tabPlatform } from '@/test-support/workspace';

import {
  closureHoldWords,
  formatActionOf,
  formatChipOf,
  formatFactsOf,
  formatHoldWords,
  offFormatRowsOf,
  primaryActionIndex,
  progressPillOf,
  sharedHoldOf,
} from './format-progress';

/**
 * Text as it reads: the export's no-break spaces that keep a date on one line (`nbd`) read as
 * spaces (in a string, or in each string of a row).
 */
function plain<T>(value: T): T {
  if (typeof value === 'string') return value.replace(/\u00a0/g, ' ') as T;
  if (Array.isArray(value)) return value.map((item: unknown) => plain(item)) as T;
  return value;
}

const MAIN = stExport('StudentFinal.dc.html');
const SCRIPT = MAIN.slice(MAIN.indexOf('<script type="text/x-dc"'));
const RAHUL = 'per-0002';
const MEERA = 'per-0001';
const SHELL = 'shell-and-tube-heat-exchanger' as ExperimentId;
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|ATT|ASMT)-\d+/;

type Tab = Awaited<ReturnType<typeof tabPlatform>>;

async function value<T>(answer: Promise<{ ok: true; value: T } | { ok: false; error: unknown }>) {
  const result = await answer;
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value;
}

/** The runtime's report, as the walk's C2 steps send it (CI-only stand-in). */
function report(tab: Tab, format: 'web' | 'vr', kind: 'opened' | 'saved', at: string) {
  const answer = standinsOf(tab.sample).runtimeReport.reportActivity({
    studentId: RAHUL as never,
    experimentId: SHELL as never,
    format,
    at: ist(at),
    kind,
  });
  if (!answer.ok) throw new Error(`runtime report refused: ${answer.error.kind}`);
}

async function readsOf(tab: Tab, experimentId: ExperimentId = SHELL) {
  const hub = await value(tab.runtime.ports.studentAccess.getExperimentHub(experimentId));
  const chooser = await value(tab.runtime.ports.learning.getSimulationChooser(experimentId));
  return { hub, chooser };
}

function wordsOf(values: readonly (string | null)[]): string {
  return values.filter(Boolean).join(' | ');
}

describe('the chip and its access words (`avail`, `fmtChip`)', () => {
  it('Rahul after Flow B: WEB and VR given and open; AR and MR are the export’s off rows', async () => {
    const { hub } = await readsOf(await tabPlatform(RAHUL, 'after-flow-b'));
    const chips = hub.row.formats.map((entry) =>
      formatChipOf(entry.format, entry.availability, hub.row.closure, null),
    );
    const given = chips.filter((chip) => chip.kind === 'on');
    expect(given.map((chip) => chip.code).sort()).toEqual(['VR', 'WEB']);
    expect(
      given.every((chip) => chip.access === 'Available to you' && chip.glyph === undefined),
    ).toBe(true);
    const off = offFormatRowsOf(hub.row.formats);
    expect(off.map((row) => [row.code, row.kind])).toEqual(
      chips
        .filter((chip) => chip.kind === 'pub' || chip.kind === 'none')
        .map((chip) => [chip.code, chip.kind]),
    );
    for (const row of off) {
      expect(row.reason).toBe(
        row.kind === 'pub'
          ? 'Published for this experiment, not included in your institution’s access'
          : 'Not published for this experiment',
      );
    }
    expect(off.length).toBeGreaterThan(0);
  });

  it('a pause holds every given format (bars glyph, “Paused”), said by the banner — no note', async () => {
    const { hub } = await readsOf(await tabPlatform(RAHUL, 'after-flow-b'));
    const web = hub.row.formats.find((entry) => entry.format === 'web')!;
    const chip = formatChipOf('web', web.availability, null, 'paused');
    expect(chip).toEqual({
      code: 'WEB',
      kind: 'held',
      glyph: 'pauseBars',
      access: 'Paused',
      held: 'paused',
    });
    expect(SCRIPT).toContain(
      "if (w.inst === 'paused') return { kind: 'held', label: 'Paused', glyph: 'sti-bars2' };",
    );
    expect(sharedHoldOf(null, 'paused')).toBeNull();
    expect(closureHoldWords(null, 'paused')).toBe(
      'Your institution’s access is paused. Your progress is kept.',
    );
    expect(
      formatActionOf(chip, (await readsOf(await tabPlatform(RAHUL, 'after-flow-b'))).chooser[0]!),
    ).toBeNull();
  });

  it('Fatima’s licence wait: held with the clock, said once above the formats, never the plan', async () => {
    const meera = await tabPlatform(MEERA, 'later-sample');
    const rows = await value(meera.runtime.ports.people.listStudents({ search: 'Fatima Begum' }));
    const fatima = await tabPlatform(rows[0]!.student.id, 'later-sample');
    const courses = await value(fatima.runtime.ports.studentAccess.listMyCourses());
    const course = await value(
      fatima.runtime.ports.studentAccess.getMyCourse(courses[0]!.courseId),
    );
    const row = course.experiments.find(
      (entry) => entry.closure?.kind === 'waiting-for-a-licence',
    )!;
    expect(row).toBeTruthy();
    const given = row.formats.filter(
      (entry) =>
        entry.availability === 'available-to-you' ||
        entry.availability === 'not-available-right-now',
    );
    for (const entry of given) {
      const chip = formatChipOf(entry.format, entry.availability, row.closure, null);
      expect([chip.kind, chip.glyph, chip.access]).toEqual([
        'held',
        'clock',
        'Waiting for a licence',
      ]);
      expect(formatHoldWords(chip, null)).toBeNull();
    }
    expect(sharedHoldOf(row.closure, null)).toEqual({ icon: 'clock', words: NO_LICENCE_TELL_MORE });
    expect(NO_LICENCE_TELL_MORE).not.toMatch(REFERENCE);
    expect(SCRIPT).toContain(
      "w.grant === 'waiting' ? { show: true, ico: 'sti-clock', d: 'No licence is available for you right now. Your institution can tell you more.' }",
    );
  });

  it('“not right now” and an undecided rule are held, each with its own words', () => {
    expect(formatChipOf('vr', 'not-available-right-now', null, null)).toEqual({
      code: 'VR',
      kind: 'held',
      glyph: 'alertCircle',
      access: 'Not available right now',
      held: 'not-right-now',
    });
    const chip = formatChipOf('vr', 'not-available-right-now', null, null);
    expect(formatHoldWords(chip, 'WEB')).toBe('VR can’t be used at the moment. WEB still opens.');
    const open = formatChipOf('web', { policyOpen: 'OD-B2-01' }, null, null);
    expect([open.kind, open.held]).toEqual(['held', 'undecided']);
    expect(open.access).not.toMatch(/\b(?:OD|PC|GRP)-/);
  });
});

describe('one format’s own progress (`runWord`, `progExp`)', () => {
  it('after Flow B, nothing opened: Not started, the “not yet” facts, Open WEB is the primary', async () => {
    const { hub, chooser } = await readsOf(await tabPlatform(RAHUL, 'after-flow-b'));
    const lines = chooser.map((view) => {
      const entry = hub.row.formats.find((format) => format.format === view.format)!;
      const chip = formatChipOf(view.format, entry.availability, hub.row.closure, null);
      return { view, chip, action: formatActionOf(chip, view) };
    });
    const web = lines.find((line) => line.view.format === 'web')!;
    expect(progressPillOf(web.view)).toEqual({ tone: 'neutral', words: 'Not started' });
    expect(formatFactsOf(web.view)).toEqual(['Not opened yet']);
    expect(web.action).toEqual({ kind: 'open', label: 'Open WEB' });
    const vr = lines.find((line) => line.view.format === 'vr')!;
    expect(formatFactsOf(vr.view)).toEqual(['No headset session reported yet']);
    expect(primaryActionIndex(lines.map((line) => line.action))).toBe(
      lines.findIndex((line) => line.action?.kind === 'open'),
    );
  });

  it('WEB opened and saved by the simulation: In progress, first opened and last saved, Continue WEB', async () => {
    const tab = await tabPlatform(RAHUL, 'after-flow-b');
    report(tab, 'web', 'opened', '2026-10-12 10:05');
    report(tab, 'web', 'saved', '2026-10-12 11:20');
    const { hub, chooser } = await readsOf(tab);
    const view = chooser.find((entry) => entry.format === 'web')!;
    const entry = hub.row.formats.find((format) => format.format === 'web')!;
    const chip = formatChipOf('web', entry.availability, hub.row.closure, null);
    expect(progressPillOf(view)).toEqual({ tone: 'warn', words: 'In progress' });
    expect(plain(formatFactsOf(view))).toEqual([
      'First opened 12 Oct 2026, 10:05',
      'Last saved 12 Oct 2026, 11:20',
    ]);
    const actions = chooser.map((line) => {
      const own = hub.row.formats.find((format) => format.format === line.format)!;
      return formatActionOf(formatChipOf(line.format, own.availability, null, null), line);
    });
    expect(formatActionOf(chip, view)).toEqual({ kind: 'continue', label: 'Continue WEB' });
    // Continue before feedback before open: one gold action on the view.
    expect(actions[primaryActionIndex(actions)]).toEqual({
      kind: 'continue',
      label: 'Continue WEB',
    });
    expect(SCRIPT).toContain("pick = has('cont') ? 'cont' : has('fb') ? 'fb' : 'open'");
  });

  it('after Flow C: both completed as the runtime reported them, feedback sent, no action', async () => {
    const { hub, chooser } = await readsOf(await tabPlatform(RAHUL, 'after-flow-c'));
    for (const view of chooser.filter((entry) => entry.status === 'completed')) {
      const entry = hub.row.formats.find((format) => format.format === view.format)!;
      const chip = formatChipOf(view.format, entry.availability, hub.row.closure, null);
      const pill = progressPillOf(view);
      expect(pill.tone).toBe('ok');
      expect(plain(pill.words)).toMatch(/^Completed \d{1,2} [A-Z][a-z]{2} \d{4}$/);
      const facts = formatFactsOf(view);
      expect(wordsOf(facts)).toMatch(
        view.format === 'web'
          ? /Reported by the simulation at \d\d:\d\d/
          : /Reported from the headset at \d\d:\d\d/,
      );
      expect(plain(wordsOf(facts))).toMatch(/Feedback sent \d{1,2} [A-Z][a-z]{2} \d{4}/);
      expect(wordsOf(facts)).not.toMatch(/stage|Stage|Recorded by the platform/);
      expect(wordsOf(facts)).not.toMatch(REFERENCE);
      expect(formatActionOf(chip, view)).toBeNull();
    }
    expect(chooser.filter((entry) => entry.status === 'completed').length).toBeGreaterThan(0);
  });
});
