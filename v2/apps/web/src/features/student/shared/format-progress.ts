/**
 * The Student's formats as the V3 design shows them in more than one screen group — the chip and
 * its access words (the export's `fmtChip` / `avail`), the "Not available to you" rows
 * (`offFormats`), and one format's own progress: its pill (`runWord`), its dated facts and its one
 * action (`progExp`, shared by ST-10 in the hub and ST-15 Progress; the hub's ST-05 / ST-07 read
 * the same pieces). Pure presentation over the existing reads — the Student's experiment row
 * (`getExperimentHub` / `getMyCourse` / `listMyCourses` rows: availability and the closure), the
 * per-format progress view (`getSimulationChooser`, `getMyProgress`) and the session's closure
 * (XS-08 banner facts). Nothing here decides access: entitlement, the institution's access,
 * runtime activity and completion stay the services' separate answers (BC3). No stage is read or
 * drawn (lead decision 1): the runtime holds first opened, last saved, last session reported and
 * the completion only.
 *
 * Words: `copy/st-shared.ts` (the export's own). The kinds and glyph names are those of the kit's
 * `StFormatChip` (`@xr/ui/v3` `st.tsx`).
 */
import type { ExperimentClosure, MyExperimentRow } from '@xr/contracts/draft';
import type { FormatCode, FormatProgressView, Technology } from '@xr/domain';

import { stateWords } from '@/copy/state-copy';
import {
  NO_LICENCE_TELL_MORE,
  notRightNowWords,
  ST_ACCESS_WORDS,
  ST_ACTION_WORDS,
  ST_FACT_WORDS,
  ST_FORMAT_NAMES,
  ST_HOLD_WORDS,
  ST_OFF_WORDS,
  ST_PROGRESS_WORDS,
} from '@/copy/st-shared';
import { formatCode } from '@/copy/student';

import { type Closure, isGiven, policyOpenOf } from './student-view';

type Availability = MyExperimentRow['formats'][number]['availability'];

/** The chip's states (the kit's `StFormatKind`). */
export type ChipKind = 'on' | 'pub' | 'none' | 'held' | 'ended';

/** Why a given format is held (the export's held glyph names it). */
export type HeldReason = 'paused' | 'inactive' | 'waiting' | 'not-right-now' | 'undecided';

/** The glyph the chip draws (the kit's `V3IconName`s the export's `sti-*` symbols map to). */
export type ChipGlyph = 'check' | 'dash' | 'pauseBars' | 'clock' | 'alertCircle' | 'user';

export interface FormatChipView {
  readonly code: FormatCode;
  readonly kind: ChipKind;
  /** `undefined`: the kit's default for the kind (`on` the tick, `ended` the dash). */
  readonly glyph?: ChipGlyph;
  /** The access in words beside the chip: "Available to you", "Paused", "Waiting for a licence". */
  readonly access: string;
  readonly held: HeldReason | null;
}

const HELD_GLYPH: Readonly<Record<HeldReason, ChipGlyph>> = {
  paused: 'pauseBars',
  inactive: 'user',
  waiting: 'clock',
  'not-right-now': 'alertCircle',
  undecided: 'alertCircle',
};

function heldReasonOf(
  availability: Availability,
  closure: ExperimentClosure | null,
  session: Closure,
): HeldReason | null {
  if (policyOpenOf(availability) !== null) return 'undecided';
  if (session === 'inactive' || closure?.kind === 'student-inactive') return 'inactive';
  if (session === 'paused' || closure?.kind === 'institution-paused') return 'paused';
  if (closure?.kind === 'waiting-for-a-licence') return 'waiting';
  if (availability === 'not-available-right-now') return 'not-right-now';
  return null;
}

function heldWords(held: HeldReason): string {
  switch (held) {
    case 'paused':
      return ST_ACCESS_WORDS.paused;
    case 'waiting':
      return ST_ACCESS_WORDS.waiting;
    case 'not-right-now':
      return ST_ACCESS_WORDS.notRightNow;
    // Undrawn in the export (an inactive account reads XS-08; an undecided rule is PC-26): the
    // register's existing words.
    case 'inactive':
      return stateWords('ST-05.inactive-format');
    case 'undecided':
      return stateWords('ST-05.format-policy-open');
  }
}

/**
 * One format's chip and access words (`fmtChip` / `avail`): not in the institution's access →
 * `pub`; not published → `none`; given but held (an undecided rule, an inactive account, the
 * institution's pause, a licence wait, "not right now") → `held` with its glyph; else `on`.
 */
export function formatChipOf(
  format: Technology,
  availability: Availability,
  closure: ExperimentClosure | null,
  session: Closure,
): FormatChipView {
  const code = formatCode(format);
  if (availability === 'not-included-for-your-institution') {
    return { code, kind: 'pub', access: ST_ACCESS_WORDS.notIncluded, held: null };
  }
  if (availability === 'not-available-for-this-experiment') {
    return { code, kind: 'none', access: ST_ACCESS_WORDS.notForExperiment, held: null };
  }
  const held = heldReasonOf(availability, closure, session);
  if (held !== null) {
    return { code, kind: 'held', glyph: HELD_GLYPH[held], access: heldWords(held), held };
  }
  return { code, kind: 'on', access: ST_ACCESS_WORDS.available, held: null };
}

/** The status pill's tone (the kit's `StatusTone` names) and words. */
export interface ProgressPill {
  readonly tone: 'neutral' | 'warn' | 'ok';
  readonly words: string;
}

/**
 * A format's own progress in its pill (`runWord`): Completed <day> only with the completion the
 * system recorded, In progress only from runtime activity, else Not started.
 */
export function progressPillOf(
  view: Pick<FormatProgressView, 'status' | 'completion'>,
): ProgressPill {
  if (view.status === 'completed' && view.completion) {
    return { tone: 'ok', words: ST_PROGRESS_WORDS.completed(view.completion.completedAt) };
  }
  if (view.status === 'in-progress') return { tone: 'warn', words: ST_PROGRESS_WORDS.inProgress };
  return { tone: 'neutral', words: ST_PROGRESS_WORDS.notStarted };
}

/**
 * A format's dated facts (`progExp`), in the export's order: WEB — "Not opened yet" | "First
 * opened …", "Last saved …" while in progress, "Reported by the simulation at …" when completed;
 * a headset format — "No headset session reported yet" | "First session reported …", "Last session
 * reported …" (when it differs), "Reported from the headset at …"; then "Feedback sent …"; then the
 * hold's reason when it is the format's own (`hold`, from `formatHoldWords`). The export's
 * "Recorded by the platform" is never reached: the runtime reports completion from the simulation
 * or the headset.
 */
export function formatFactsOf(view: FormatProgressView, hold: string | null = null): string[] {
  const facts: string[] = [];
  const { activity, completion } = view;
  const first = activity?.firstOpenedAt ?? null;
  if (view.format === 'web') {
    if (view.status === 'not-started') facts.push(ST_FACT_WORDS.webNotOpened);
    if (first) facts.push(ST_FACT_WORDS.firstOpened(first));
    if (view.status === 'in-progress' && activity?.lastSavedAt) {
      facts.push(ST_FACT_WORDS.lastSaved(activity.lastSavedAt));
    }
  } else {
    if (view.status === 'not-started') facts.push(ST_FACT_WORDS.noSession);
    if (first) facts.push(ST_FACT_WORDS.firstSession(first));
    const last = activity?.lastSessionReportedAt ?? null;
    if (view.status === 'in-progress' && last && last !== first) {
      facts.push(ST_FACT_WORDS.lastSession(last));
    }
  }
  if (view.status === 'completed' && completion) {
    facts.push(
      completion.reportedFrom === 'simulation'
        ? ST_FACT_WORDS.reportedBySimulation(completion.completedAt)
        : ST_FACT_WORDS.reportedFromHeadset(completion.completedAt),
    );
  }
  if (view.status === 'completed' && typeof view.feedback === 'object') {
    facts.push(ST_FACT_WORDS.feedbackSent(view.feedback.sentAt));
  }
  if (hold) facts.push(hold);
  return facts;
}

/**
 * The hold said once above the formats (`progExp`'s note): a licence wait (clock). A pause is said
 * by the page's banner, so it has no note; nothing else holds every format.
 */
export function sharedHoldOf(
  closure: ExperimentClosure | null,
  session: Closure,
): { readonly icon: 'clock'; readonly words: string } | null {
  if (session === 'paused' || closure?.kind === 'institution-paused') return null;
  if (closure?.kind === 'waiting-for-a-licence')
    return { icon: 'clock', words: NO_LICENCE_TELL_MORE };
  return null;
}

/**
 * A held format's own reason in its details (`holdReason`), only when the hold is not said once
 * for every format (a pause, a licence wait): "VR can’t be used at the moment. WEB still opens."
 */
export function formatHoldWords(chip: FormatChipView, opens: FormatCode | null): string | null {
  if (chip.held === 'not-right-now') return notRightNowWords(chip.code, opens);
  return null;
}

/** The hold of every format, as `holdReason` words it: the pause or the licence wait. */
export function closureHoldWords(
  closure: ExperimentClosure | null,
  session: Closure,
): string | null {
  if (session === 'paused' || closure?.kind === 'institution-paused') return ST_HOLD_WORDS.paused;
  if (closure?.kind === 'waiting-for-a-licence') return ST_HOLD_WORDS.waiting;
  return null;
}

export type FormatActionKind = 'continue' | 'open' | 'feedback';

export interface FormatAction {
  readonly kind: FormatActionKind;
  readonly label: string;
}

/**
 * A format's one action (`progExp`): only a format available now (`on`) — in progress "Continue
 * WEB", not started "Open WEB", completed with feedback offered and not sent "Give feedback on
 * WEB"; none otherwise. The destination is the group's (`nav/student-*`).
 */
export function formatActionOf(
  chip: FormatChipView,
  view: FormatProgressView,
): FormatAction | null {
  if (chip.kind !== 'on') return null;
  if (view.status === 'in-progress') {
    return { kind: 'continue', label: ST_ACTION_WORDS.continue(chip.code) };
  }
  if (view.status === 'not-started')
    return { kind: 'open', label: ST_ACTION_WORDS.open(chip.code) };
  if (view.feedback === 'offered') {
    return { kind: 'feedback', label: ST_ACTION_WORDS.feedback(chip.code) };
  }
  return null;
}

/**
 * Gold once per view (`progExp`): the first action of the kind chosen in this order — continue,
 * then feedback, then open — is the primary one. Returns its index in `actions`, or -1.
 */
export function primaryActionIndex(actions: readonly (FormatAction | null)[]): number {
  for (const kind of ['continue', 'feedback', 'open'] as const) {
    const index = actions.findIndex((action) => action?.kind === kind);
    if (index >= 0) return index;
  }
  return -1;
}

export interface OffFormatRow {
  readonly code: FormatCode;
  readonly kind: 'pub' | 'none';
  readonly name: string;
  readonly reason: string;
}

/**
 * The formats not available to the Student (`offFormats`), in the row's display order: published
 * but not in the institution's access (`pub`), not published for the experiment (`none`).
 */
export function offFormatRowsOf(formats: MyExperimentRow['formats']): OffFormatRow[] {
  const rows: OffFormatRow[] = [];
  for (const entry of formats) {
    if (isGiven(entry.availability) || typeof entry.availability === 'object') continue;
    const code = formatCode(entry.format);
    if (entry.availability === 'not-included-for-your-institution') {
      rows.push({
        code,
        kind: 'pub',
        name: ST_FORMAT_NAMES[code],
        reason: ST_OFF_WORDS.notIncluded,
      });
    } else {
      rows.push({
        code,
        kind: 'none',
        name: ST_FORMAT_NAMES[code],
        reason: ST_OFF_WORDS.notPublished,
      });
    }
  }
  return rows;
}
