'use client';

import type { FormatProgressView } from '@xr/domain';
import type { StatusTone } from '@xr/ui';

import { formatProgressWords, wordsOf } from '@/copy/flow-state-words';
import { lastSavedWords, lastSessionWords, SIMULATION_PAGE } from '@/copy/learning-hub';

/**
 * One format's progress as the hub's tabs show it (ST-07 B3-02, ST-10 B3-01 f8 … f12), from the
 * service's progress view alone: Completed only with the completion record the system wrote,
 * In progress only from runtime activity (T-12, BC3) — never from a launch, a visit or feedback.
 */

/** The progress chip: Not started (off) · In progress (wait) · Completed <date> (ok). */
export function progressStatus(progress: FormatProgressView): {
  readonly tone: StatusTone;
  readonly words: string;
} {
  const words = wordsOf(formatProgressWords(progress)) ?? '';
  switch (progress.status) {
    case 'not-started':
      return { tone: 'off', words };
    case 'in-progress':
      return { tone: 'wait', words };
    case 'completed':
      return { tone: 'ok', words };
  }
}

/** In progress: "Last saved <date, time>" (B3-02 f0; B3-01 f9), else the headset's last session (B3-04 f0). */
export function activityWords(progress: FormatProgressView): string | null {
  if (progress.status !== 'in-progress') return null;
  const activity = progress.activity;
  if (activity?.lastSavedAt) return lastSavedWords(activity.lastSavedAt);
  if (activity?.lastSessionReportedAt) return lastSessionWords(activity.lastSessionReportedAt);
  return null;
}

/**
 * ST-07's one line under the code (`ST-07.meta`): not started — WEB "Opens in your browser", VR
 * "Needs a VR headset" (B3-02 f1); in progress — the activity line (f0); completed — nothing (f2).
 */
export function chooserMeta(progress: FormatProgressView): string | null {
  if (progress.status === 'completed') return null;
  if (progress.status === 'in-progress') return activityWords(progress);
  if (progress.format === 'web') return SIMULATION_PAGE.webNotStarted;
  if (progress.format === 'vr') return SIMULATION_PAGE.vrNotStarted;
  return null;
}
