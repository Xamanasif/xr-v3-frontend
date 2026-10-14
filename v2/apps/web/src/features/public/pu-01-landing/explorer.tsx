'use client';

import type { AreaCard, CourseCard } from '@xr/contracts/draft';
import { Icon, Link } from '@xr/ui';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';

import {
  LANDING,
  areaAnnouncement,
  areaCountsWords,
  browseCountWords,
  courseLine,
  pickAreaLabel,
  positionWords,
  slideLabel,
} from '@/copy/public';

import { ArtFallback, Drawing, atmosphereClass, isKnownArt } from '../shared/art';

/** One area in the explorer: its card and the courses with published experiments (B1-02 A3 data). */
export interface ExplorerArea {
  readonly area: AreaCard;
  readonly courses: readonly CourseCard[];
}

function reducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * The engineering-area explorer (B1-02; B1-01 "Explore by area"): one selected, expanded area card
 * with its neighbours in a horizontal track. Previous / Next move one area; ← → move and focus
 * follows to the new card's first link; Home / End jump; a neighbouring card selects itself and is
 * not a tab stop; below 600 px the track swipes with snap and the counter follows the swipe. A
 * polite live region announces the newly selected area. Nothing moves on its own (no timers); with
 * reduced motion changes are instant. The track scales past three areas (`xp-ex--many`).
 */
export function AreaExplorer({ areas }: { readonly areas: readonly ExplorerArea[] }) {
  const [selected, setSelected] = useState(0);
  const track = useRef<HTMLUListElement | null>(null);
  const previous = useRef<HTMLButtonElement | null>(null);
  const next = useRef<HTMLButtonElement | null>(null);
  /** "Swipe for more areas": shown exactly when the track swipes (the CSS's own 600 px switch). */
  const swipeHint = useRef<HTMLSpanElement | null>(null);
  /** True while a move the person asked for scrolls the track (the swipe counter waits, B1-02). */
  const moving = useRef(false);
  const frame = useRef<number | null>(null);
  const count = areas.length;
  const current = Math.max(0, Math.min(selected, count - 1));
  const shown = areas[current];

  useEffect(
    () => () => {
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    },
    [],
  );

  const go = (index: number, focus: boolean) => {
    if (index < 0 || index >= count) return;
    const reduce = reducedMotion();
    moving.current = true;
    window.setTimeout(() => {
      moving.current = false;
    }, 700);
    setSelected(index);
    window.setTimeout(
      () => {
        const list = track.current;
        const card = list?.children[index] as HTMLElement | undefined;
        if (!list || !card) return;
        list.scrollTo?.({
          left: Math.max(0, card.offsetLeft - 2),
          behavior: reduce ? 'auto' : 'smooth',
        });
        if (focus) card.querySelector<HTMLElement>('.xp-ex-full a')?.focus({ preventScroll: true });
      },
      reduce ? 0 : 300,
    );
  };

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    let to: number | null = null;
    if (event.key === 'ArrowRight') to = current + 1;
    else if (event.key === 'ArrowLeft') to = current - 1;
    else if (event.key === 'Home') to = 0;
    else if (event.key === 'End') to = count - 1;
    if (to === null) return;
    event.preventDefault();
    go(Math.max(0, Math.min(count - 1, to)), true);
  };

  // Previous / Next are disabled at the ends (B1-02): the button just pressed would drop focus to
  // the page, so focus moves to the other one (WCAG 2.4.3).
  const stepBy = (by: -1 | 1) => {
    const to = current + by;
    go(to, false);
    if (to === 0 || to === count - 1)
      window.setTimeout(() => (by === 1 ? previous : next).current?.focus(), 0);
  };

  // Below 600 px of the page the track is swiped: the counter follows the card in view (B1-02
  // "Touch"). The swipe hint's display is the CSS breakpoint itself, so the two cannot disagree.
  const onScroll = () => {
    const list = track.current;
    const hint = swipeHint.current;
    if (!list || !hint || window.getComputedStyle(hint).display === 'none') return;
    if (moving.current) return;
    if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    frame.current = window.requestAnimationFrame(() => {
      const first = list.children[0] as HTMLElement | undefined;
      const second = list.children[1] as HTMLElement | undefined;
      if (!first || !second) return;
      const step = second.offsetLeft - first.offsetLeft;
      const index = Math.max(0, Math.min(count - 1, Math.round(list.scrollLeft / step)));
      if (index !== current) setSelected(index);
    });
  };

  if (!shown) return null;
  return (
    <div
      className={count > 3 ? 'xp-ex xp-ex--many' : 'xp-ex'}
      role="region"
      aria-roledescription={LANDING.explorer.carousel}
      aria-label={LANDING.explorer.region}
    >
      {/* `role="none"`: B1-02 draws the slides as `li[role=group]` in a `ul`, which leaves the
          list with children that are not list items (axe `list`, WCAG 1.3.1). The region and its
          slide groups carry the carousel's structure (APG carousel; Package-1B record §5). */}
      <ul
        className="xp-ex-track relative"
        role="none"
        ref={track}
        onKeyDown={onKeyDown}
        onScroll={onScroll}
      >
        {areas.map(({ area, courses }, index) => (
          <li
            key={area.id}
            className={index === current ? 'xp-ex-card is-selected' : 'xp-ex-card'}
            role="group"
            aria-roledescription={LANDING.explorer.slide}
            aria-label={slideLabel(index, count, area.name)}
          >
            {isKnownArt(area.artworkKey) ? (
              <div className={`xp-ex-art ${atmosphereClass(area.artworkKey)}`}>
                <Drawing artKey={area.artworkKey} />
              </div>
            ) : (
              <ArtFallback name={area.name} />
            )}
            <div className="xp-ex-shade" aria-hidden="true" />
            <div className="xp-ex-full">
              <span className="xp-ex-pos">{positionWords(index, count)}</span>
              <h3 className="xp-ex-name">{area.name}</h3>
              {area.description ? <p className="xp-ex-desc">{area.description}</p> : null}
              <ul className="xp-ex-courses">
                {courses.map((course) => (
                  <li key={course.id}>{courseLine(course.platformCode, course.name)}</li>
                ))}
              </ul>
              <p className="xp-ex-meta">
                {areaCountsWords(area.experimentCount, area.courseCount)}
              </p>
              <div className="xp-ex-actions">
                <Link
                  className="xr-btn xr-btn--primary"
                  href={`/experiments?area=${encodeURIComponent(area.id)}`}
                >
                  {browseCountWords(area.experimentCount)} <Icon name="next" />
                </Link>
                <Link href={`/areas/${encodeURIComponent(area.id)}`}>
                  {LANDING.explorer.viewArea}
                </Link>
              </div>
            </div>
            <button
              type="button"
              className="xp-ex-mini"
              tabIndex={-1}
              aria-label={pickAreaLabel(area.name)}
              onClick={() => go(index, true)}
            >
              <span className="xp-ex-name">{area.name}</span>
              <span className="xp-ex-meta">
                {areaCountsWords(area.experimentCount, area.courseCount)}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="xp-ex-ctrl">
        <span className="xp-ex-count" aria-hidden="true">
          {positionWords(current, count)}
        </span>
        <button
          ref={previous}
          type="button"
          className="xp-round"
          aria-label={LANDING.explorer.previous}
          disabled={current === 0}
          onClick={() => stepBy(-1)}
        >
          <Icon name="chevronLeft" />
        </button>
        <button
          ref={next}
          type="button"
          className="xp-round"
          aria-label={LANDING.explorer.next}
          disabled={current === count - 1}
          onClick={() => stepBy(1)}
        >
          <Icon name="chevronRight" />
        </button>
        <span className="xp-ex-swipe" ref={swipeHint}>
          {LANDING.explorer.swipe}
        </span>
        <Link className="xp-more" href="/areas">
          {LANDING.explorer.viewAll} <Icon name="next" />
        </Link>
      </div>
      <span className="xr-sr" aria-live="polite">
        {areaAnnouncement(current, count, shown.area.name)}
      </span>
    </div>
  );
}
