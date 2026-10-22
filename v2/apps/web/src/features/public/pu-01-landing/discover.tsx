'use client';

import { Link } from '@xr/ui';
import { type KeyboardEvent, type ReactNode, useRef } from 'react';

import {
  AREA_BLURBS,
  areaBrowseWords,
  areaCountWords,
  areaSelectLabel,
  featuredArtAlt,
  featuredOpenLabel,
  LANDING_V1,
  seeAllWords,
} from '@/copy/landing-v1';

import { type AreaPanel, type FeaturedCard, LANDING_HREF } from './bind';
import { Arrow, classes, FormatChips } from './parts';

/** The featured cards' artwork: the drawing and its crop (frozen `THUMB`, 1063–1072). */
const CARD_ART: Readonly<Record<string, { readonly art: string; readonly crop: string }>> = {
  machining: { art: '#pl1-artMachining', crop: '0 0 320 200' },
  thermal: { art: '#pl1-artThermal', crop: '60 40 880 480' },
  motor: { art: '#pl1-artMotor', crop: '230 60 680 480' },
  process: { art: '#pl1-artProcess', crop: '300 0 640 560' },
};

/** The explorer's full-bleed close-ups (1684–1685 `expFam`, `expCrop`). */
const AREA_ART = {
  thermal: { art: '#pl1-artThermal', crop: '260 205 480 280' },
  motor: { art: '#pl1-artMotor', crop: '310 90 420 420' },
  process: { art: '#pl1-artProcess', crop: '370 70 280 440' },
} as const;

/**
 * Featured experiments (frozen 493–527; 1655–1676): four cards in the design's order with a
 * hover lift and art scale. “View in catalogue” opens the catalogue searched for the experiment
 * (1674; plan D-6), the drawing too, as the frozen art does; the durations are hidden (D-7).
 */
export function Featured({
  cards,
  total,
  hover,
  reduce,
  onHover,
  onOpen,
  status,
}: {
  readonly cards: readonly FeaturedCard[];
  readonly total: number | null;
  readonly hover: number;
  readonly reduce: boolean;
  readonly onHover: (index: number, on: boolean) => void;
  readonly onOpen: (href: string) => void;
  /** Loading or failed: the section's own status block, in place of the cards. */
  readonly status: ReactNode;
}) {
  const words = LANDING_V1.featured;
  return (
    <section id="featured" aria-labelledby="pl1-feat-h" className="pl1-feat">
      <div data-reveal="1" className="pl1-feat-head">
        <div className="pl1-feat-headtext">
          <span className="pl1-eyebrow">{words.eyebrow}</span>
          <h2 id="pl1-feat-h" className="pl1-h2">
            {words.title}
          </h2>
          <p className="pl1-feat-lead">{words.lead}</p>
        </div>
        {total !== null ? (
          <Link className="pl1-seeall" href={LANDING_HREF.catalogue}>
            {seeAllWords(total)}
            <Arrow />
          </Link>
        ) : null}
      </div>
      <div data-reveal="1" className="pl1-feat-grid">
        {status ??
          cards.map((card, index) => {
            const on = hover === index && !reduce;
            const art = CARD_ART[card.art] ?? CARD_ART.thermal!;
            const href = LANDING_HREF.search(card.search);
            return (
              <article
                key={card.experimentId}
                className={classes('pl1-fc', on && 'is-hov')}
                onPointerEnter={() => onHover(index, true)}
                onPointerLeave={() => onHover(index, false)}
              >
                {/* The drawing opens the catalogue too (1505 `onClick`); the link below is the
                    keyboard and screen-reader way. */}
                <div
                  className={`pl1-fc-media pl1-atm-${atmosphereOf(card.art)}`}
                  onClick={() => onOpen(href)}
                >
                  <svg
                    viewBox={art.crop}
                    preserveAspectRatio="xMidYMid slice"
                    role="img"
                    aria-label={featuredArtAlt(card.artDescription)}
                    className="pl1-fill pl1-fc-art"
                  >
                    <use href={art.art} />
                  </svg>
                  <span aria-hidden="true" className="pl1-fc-shade" />
                  {card.area ? <span className="pl1-fc-badge">{card.area}</span> : null}
                </div>
                <div className="pl1-fc-body">
                  <span className="pl1-fc-course">
                    <span className="pl1-not-phone">{card.course}</span>
                    <span className="pl1-phone-only">{card.courseShort}</span>
                  </span>
                  <h3 className="pl1-fc-title">{card.name}</h3>
                  <p className="pl1-fc-desc">{card.descriptor}</p>
                  <div className="pl1-fc-meta">
                    {/* The duration's place (515): hidden — there is no duration data (D-7). */}
                    <span className="pl1-fc-mins" />
                    <FormatChips offered={card.formats} dark={false} size="card" />
                  </div>
                  <Link
                    className="pl1-fc-cta"
                    href={href}
                    aria-label={featuredOpenLabel(card.name)}
                    onFocus={() => onHover(index, true)}
                    onBlur={() => onHover(index, false)}
                  >
                    {words.view}
                    <Arrow />
                  </Link>
                </div>
              </article>
            );
          })}
      </div>
    </section>
  );
}

/** The atmosphere behind a featured drawing (`THUMB[…][2]`: thermal, motor, process, steel). */
function atmosphereOf(art: string): string {
  return art === 'machining' ? 'steel' : art;
}

/**
 * Explore by area (frozen 529–560; 1678–1731): an accordion of the areas. At ≥ 1024 px the panels
 * share the row 54/23/23 and hover selects; below, they stack by height. Focus or click selects;
 * the arrow keys, Home and End move and focus; a closed panel's Browse button is not a Tab stop.
 */
export function Explorer({
  panels,
  selected,
  narrow,
  onSelect,
  status,
}: {
  readonly panels: readonly AreaPanel[];
  readonly selected: number;
  readonly narrow: boolean;
  readonly onSelect: (index: number) => void;
  readonly status: ReactNode;
}) {
  const words = LANDING_V1.explorer;
  const row = useRef<HTMLDivElement | null>(null);
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const count = panels.length;
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % count;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + count) % count;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = count - 1;
    onSelect(next);
    row.current?.querySelectorAll<HTMLButtonElement>('[data-sel]')[next]?.focus();
  };
  return (
    <section aria-labelledby="pl1-explorer-h" className="pl1-exp">
      <div data-reveal="1" className="pl1-head">
        <div>
          <span className="pl1-eyebrow">{words.eyebrow}</span>
          <h2 id="pl1-explorer-h" className="pl1-h2">
            {words.title}
          </h2>
        </div>
        <p className="pl1-head-lead">{words.lead}</p>
      </div>
      <div
        ref={row}
        data-explorer="1"
        data-reveal="1"
        role="group"
        aria-label={words.group}
        className="pl1-exp-row"
      >
        {status ??
          panels.map((panel, index) => {
            const on = index === selected;
            const art = AREA_ART[panel.family];
            return (
              <div
                key={panel.id}
                className={classes('pl1-xp', `pl1-atm-${panel.family}`, on && 'is-on')}
                onPointerEnter={() => {
                  if (!narrow && !on) onSelect(index);
                }}
              >
                <svg
                  viewBox={art.crop}
                  preserveAspectRatio="xMidYMid slice"
                  aria-hidden="true"
                  className="pl1-fill pl1-xp-art"
                >
                  <use href={art.art} />
                </svg>
                <div aria-hidden="true" className="pl1-xp-scrim" />
                <button
                  data-sel="1"
                  type="button"
                  aria-pressed={on}
                  aria-label={areaSelectLabel(panel.name, panel.experiments, on)}
                  className="pl1-xp-sel"
                  onClick={() => {
                    if (!on) onSelect(index);
                  }}
                  onFocus={() => {
                    if (!on) onSelect(index);
                  }}
                  onKeyDown={(event) => onKeyDown(event, index)}
                />
                <div className="pl1-xp-body">
                  <span className="pl1-xp-name">{panel.name}</span>
                  <span className="pl1-xp-count">
                    {areaCountWords(panel.experiments, panel.courseCount)}
                  </span>
                  <div aria-hidden={on ? 'false' : 'true'} className="pl1-xp-extra">
                    <p className="pl1-xp-blurb">{AREA_BLURBS[panel.family]}</p>
                    <div className="pl1-xp-courses">
                      {panel.courses.map((course) => (
                        <span key={`${course.code ?? ''}${course.name}`}>
                          {course.code ? `${course.code} · ${course.name}` : course.name}
                        </span>
                      ))}
                    </div>
                    <div className="pl1-xp-actions">
                      <Link
                        className="pl1-xp-browse"
                        href={LANDING_HREF.area(panel.id)}
                        tabIndex={on ? 0 : -1}
                      >
                        {areaBrowseWords(panel.experiments)}
                        <Arrow />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
