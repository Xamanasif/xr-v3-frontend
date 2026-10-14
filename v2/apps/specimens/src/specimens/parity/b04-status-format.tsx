'use client';

import {
  FormatBadge,
  Link,
  Notice,
  ShellBanner,
  StatusPill,
  type FormatCode,
  type FormatVariant,
  type IconName,
  type StatusTone,
} from '@xr/ui';

import { ParityItem, ParityPage } from './stage';

/**
 * Board 04 "Status words, format chips and the state grammar" (WP-0.15 parity): every drawn
 * status chip, format chip, state-grammar notice and shell banner, from the product components
 * with the board's words. Ids are the parity suite's names.
 */

/** Board 04 "Status chips · tone, icon, words", row by row (tone, icon, words). */
export const STATUS_CHIPS: readonly (readonly [StatusTone, IconName, string])[] = [
  ['neutral', 'notAvailable', 'Not started'],
  ['neutral', 'notAvailable', 'Draft'],
  ['neutral', 'notAvailable', 'No access yet'],
  ['info', 'withAnotherRole', 'Under review'],
  ['info', 'withAnotherRole', 'With Academic Reviewer'],
  ['info', 'withAnotherRole', 'In progress'],
  ['wait', 'waiting', 'Waiting for marking'],
  ['wait', 'waiting', 'Waiting for a licence'],
  ['wait', 'waiting', 'Awaiting release decision'],
  ['ok', 'done', 'Access active'],
  ['ok', 'done', 'Completed'],
  ['ok', 'done', 'Published'],
  ['ok', 'done', 'Resolved'],
  ['err', 'failed', 'Returned'],
  ['err', 'failed', 'Information requested'],
  ['err', 'failed', 'Payment failed'],
  ['paused', 'paused', 'Paused'],
  ['paused', 'paused', 'On hold'],
  ['paused', 'readOnly', 'Read-only'],
  ['off', 'notAvailable', 'Inactive'],
  ['off', 'notAvailable', 'Ended'],
  ['off', 'notAvailable', 'Withdrawn'],
];

/** Board 04 "Format chips · WEB · AR · VR · MR": treatment, format, compact, surface. */
export const FORMAT_CHIPS: readonly {
  readonly id: string;
  readonly format: FormatCode;
  readonly variant: FormatVariant;
  readonly compact: boolean;
}[] = [
  { id: 'fmt-offered-web', format: 'WEB', variant: 'offered', compact: false },
  { id: 'fmt-offered-ar', format: 'AR', variant: 'offered', compact: false },
  { id: 'fmt-offered-vr', format: 'VR', variant: 'offered', compact: false },
  { id: 'fmt-offered-mr', format: 'MR', variant: 'offered', compact: false },
  { id: 'fmt-yours-web', format: 'WEB', variant: 'yours', compact: false },
  { id: 'fmt-yours-vr', format: 'VR', variant: 'yours', compact: false },
  { id: 'fmt-off-ar', format: 'AR', variant: 'off', compact: false },
  { id: 'fmt-off-mr', format: 'MR', variant: 'off', compact: false },
  { id: 'fmt-compact-web', format: 'WEB', variant: 'offered', compact: true },
  { id: 'fmt-compact-vr', format: 'VR', variant: 'offered', compact: true },
  { id: 'fmt-compact-ar-off', format: 'AR', variant: 'off', compact: true },
  { id: 'fmt-on-dark-web', format: 'WEB', variant: 'on-dark', compact: false },
  { id: 'fmt-on-dark-vr', format: 'VR', variant: 'on-dark', compact: false },
];

export function B04StatusFormat() {
  return (
    <ParityPage>
      {STATUS_CHIPS.map(([tone, icon, words], index) => (
        <ParityItem key={words} id={`status-${index}`}>
          <StatusPill tone={tone} icon={icon}>
            {words}
          </StatusPill>
        </ParityItem>
      ))}
      {FORMAT_CHIPS.map(({ id, format, variant, compact }) => (
        <ParityItem key={id} id={id} surface={variant === 'on-dark' ? 'navy' : 'card'}>
          <FormatBadge format={format} variant={variant} compact={compact} glyph={!compact} />
        </ParityItem>
      ))}
      <ParityItem id="grammar-refused">
        <Notice
          tone="err"
          role="status"
          title="Returned to you"
          actions={
            <Link className="xr-btn xr-btn--secondary xr-btn--sm" href="#h-gram">
              Revise and resubmit
            </Link>
          }
        >
          Prof. A. Menon · 19 Aug: “Please clarify the VR device requirements.”
        </Notice>
      </ParityItem>
      <ParityItem id="grammar-submitted">
        <Notice tone="ok" title="Submitted">
          Your changes have been submitted for review.
        </Notice>
      </ParityItem>
      <ParityItem id="banner-paused" surface="none">
        <ShellBanner kind="paused" helpHref="#h-gram" />
      </ParityItem>
      <ParityItem id="banner-inactive" surface="none">
        <ShellBanner kind="inactive" helpHref="#h-gram" />
      </ParityItem>
    </ParityPage>
  );
}
