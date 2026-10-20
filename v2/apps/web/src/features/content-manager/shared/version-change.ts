import type { CorrectionUpdate } from '@xr/domain';
import type { CmVersionChangeProps } from '@xr/ui/v3';

import { liveVersion, NO_VERSION_LABEL, proposedVersion, withdrawnVersion } from '@/copy/cm-shared';

/**
 * A correction's version change, for the kit's `CmVersionChange` (CM-v1 COMPONENT-EXTENSIONS D;
 * the script's `ver` in `updListVM` / `updVM`, `trkVa` / `trkVb` in `pubVM`, `live` / `next` in
 * `ovVM`): while open, "1.2 live" → "1.3 proposed" (or "No version label yet"); released, the
 * version it replaced (struck through) → "1.3 live"; withdrawn, "1.2 live" → "1.3 withdrawn"
 * (struck through). `liveLabel`: the experiment's live version; by default the one the update
 * started from (`baseVersionLabel`), which stays live while it is open — a page that reads the
 * experiment passes its live label.
 */
export function correctionVersionChange(
  update: Pick<CorrectionUpdate, 'state' | 'baseVersionLabel' | 'versionLabel'>,
  liveLabel: string = update.baseVersionLabel,
): Required<CmVersionChangeProps> {
  const label = update.versionLabel?.trim() || null;
  if (update.state === 'released') {
    return {
      from: { text: update.baseVersionLabel, kind: 'old' },
      to: { text: liveVersion(label ?? ''), kind: 'live' },
    };
  }
  if (update.state === 'withdrawn') {
    return {
      from: { text: liveVersion(liveLabel), kind: 'live' },
      to: { text: withdrawnVersion(label), kind: 'old' },
    };
  }
  return {
    from: { text: liveVersion(liveLabel), kind: 'live' },
    to: { text: label ? proposedVersion(label) : NO_VERSION_LABEL, kind: 'new' },
  };
}

/** The published record's own version on its status line: "1.2 live" alone (CM-05). */
export function liveVersionOnly(liveLabel: string): CmVersionChangeProps {
  return { from: { text: liveVersion(liveLabel), kind: 'live' } };
}
