'use client';

import type { CatalogueEntry } from '@xr/contracts/draft';
import { Icon, Link } from '@xr/ui';

import { CATALOGUE, courseLine } from '@/copy/public';

import { ArtMedia } from './art';
import { FormatChips } from './blocks';

/**
 * One experiment row (`li.xp-erow`; B1-04 "Row": thumbnail (concept artwork, decorative) · course
 * code + name · title (the link) · one-line summary · "Available in" formats; B1-03 PU-05 rows
 * leave out the course line). A row already in the visitor's selection carries `is-sel`, which
 * the v46 sheet marks "In your selection" (B1-04 "Selection marker").
 */
export function ExperimentRow({
  entry,
  href,
  inSelection,
  withCourse = true,
}: {
  readonly entry: CatalogueEntry;
  readonly href: string;
  readonly inSelection: boolean;
  readonly withCourse?: boolean;
}) {
  return (
    <li className={inSelection ? 'xp-erow is-sel' : 'xp-erow'}>
      <ArtMedia className="xp-erow-media" artKey={entry.artworkKey} name={entry.name} />
      <div className="xp-erow-text">
        {withCourse ? (
          <span className="xp-erow-course">{courseLine(entry.platformCode, entry.courseName)}</span>
        ) : null}
        <h3 className="xp-erow-title">
          <Link href={href}>{entry.name}</Link>
        </h3>
        <p className="xp-erow-sum">{entry.summary}</p>
        <FormatChips formats={entry.availableIn} label={CATALOGUE.availableIn} />
      </div>
      <Icon name="chevronRight" className="xp-erow-chev" />
    </li>
  );
}
