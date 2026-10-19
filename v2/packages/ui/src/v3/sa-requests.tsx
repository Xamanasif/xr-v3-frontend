'use client';

/*
 * Super Admin V3 components for SA-01 Overview (the owner-approved Super Admin export,
 * design/v3-refined-b/roles/SA-v1, `project/sa-views-a.js` `V.overview`): the queue surface while it
 * loads, has failed or holds nothing. Markup as the export's view emits it; every word comes from
 * the caller. The queue itself is the kit's `QueueGroups` (with its quiet line), SA-03's panel
 * parts are the kit's `ErrorSummary`, `TextInput`, `Select` and `sa.tsx`'s `GoButton`.
 */
import type { ReactNode } from 'react';

import { CalmState } from './overview.js';

export interface QueueFrameProps {
  /** While what is waiting loads (`aria-busy`). */
  readonly busy?: boolean;
  /** The id of the heading that names the queue (the calm state's title). */
  readonly labelledBy?: string;
  readonly children: ReactNode;
}

/**
 * The overview's queue surface as a section (`section.rb-queue`; the export's `V.overview` while
 * loading, failed or calm): one white surface holding a list state.
 */
export function QueueFrame({ busy, labelledBy, children }: QueueFrameProps) {
  return (
    <section className="rb-queue" aria-busy={busy || undefined} aria-labelledby={labelledBy}>
      {children}
    </section>
  );
}

/**
 * "Loading what is waiting…" over three skeleton rows inside the queue (`section.rb-queue
 * [aria-busy]` > `p.rk-loading-msg[role=status]` + `div.rk-skel-row` ×3), as the export's
 * `V.overview` draws its loading state: two lines, one line, two empty cells, one line. The queue
 * pads itself, so the line and the rows drop their own side padding (`rk-x-queue-flush`, V3P-12:
 * the export's inline `padding-left:0` and `padding-left:0;padding-right:0`).
 */
export function QueueLoading({ message }: { readonly message: ReactNode }) {
  return (
    <QueueFrame busy>
      <p className="rk-loading-msg rk-x-queue-flush" role="status">
        {message}
      </p>
      {[0, 1, 2].map((row) => (
        <div key={row} className="rk-skel-row rk-x-queue-flush" aria-hidden="true">
          <div>
            <span className="rk-skel" />
            <span className="rk-skel" />
          </div>
          <div>
            <span className="rk-skel" />
          </div>
          <div />
          <div />
          <div>
            <span className="rk-skel" />
          </div>
        </div>
      ))}
    </QueueFrame>
  );
}

export interface QueueCalmProps {
  /** "Nothing is waiting" — the queue's name (`p.rb-calm-t`, referenced by the section). */
  readonly title: ReactNode;
  readonly titleId: string;
  /** What appears here when it needs the reader (`p.rb-calm-d`). */
  readonly children?: ReactNode;
}

/**
 * Nothing is waiting at all (`section.rb-queue` > the kit's `CalmState`, `div.rb-calm`; the
 * export's quiet scenario): the section is named by the calm title.
 */
export function QueueCalm({ title, titleId, children }: QueueCalmProps) {
  return (
    <QueueFrame labelledBy={titleId}>
      <CalmState title={title} titleId={titleId}>
        {children}
      </CalmState>
    </QueueFrame>
  );
}
