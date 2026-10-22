'use client';

import { Link } from '@xr/ui';
import type { PointerEvent, RefObject } from 'react';

import { HERO_SCENES, LANDING_V1 } from '@/copy/landing-v1';

import { LANDING_HREF, type SceneChips } from './bind';
import { SectionLink, type LandingSection } from './header';
import { motionOn, rotates, type HeroState } from './hero-state';
import { Arrow, classes, FormatChips } from './parts';

/** Each scene's drawing and ambient flow (frozen `HERO` 1077–1098). */
const SCENE_ART = {
  thermal: { art: '#pl1-artThermal', flow: '#pl1-flowThermal' },
  motor: { art: '#pl1-artMotor', flow: '#pl1-flowMotor' },
  process: { art: '#pl1-artProcess', flow: '#pl1-flowProcess' },
} as const;

/** The selector thumbnails' crops (1629). */
const PICK_CROP = {
  thermal: '150 130 700 380',
  motor: '260 60 560 480',
  process: '340 20 560 520',
} as const;

export interface HeroProps {
  readonly state: HeroState;
  readonly reduce: boolean;
  readonly hover: number;
  readonly chips: readonly (SceneChips | null)[];
  readonly heroRef: RefObject<HTMLDivElement | null>;
  /** Each scene's parallax layer (frozen `pxRef`), for the pointer parallax. */
  readonly parallaxLayer: (index: number, node: HTMLDivElement | null) => void;
  readonly onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  readonly onPointerLeave: () => void;
  readonly onSelect: (index: number) => void;
  readonly onHover: (index: number, on: boolean) => void;
  readonly onTogglePlay: () => void;
  readonly goSection: (section: LandingSection) => void;
}

/**
 * The hero (frozen 426–489; values 1601–1653, 1984–2017): three stacked scenes that rotate every
 * 7.6 s, each revealed left to right with one light sweep; the copy with its intro stagger; the
 * scene selector with the active card's progress edge, and Pause/Play — shown at every width
 * (D-8, WCAG 2.2.2: the frozen file hid it below 560 px while the scenes kept moving).
 */
export function Hero({
  state,
  reduce,
  hover,
  chips,
  heroRef,
  parallaxLayer,
  onPointerMove,
  onPointerLeave,
  onSelect,
  onHover,
  onTogglePlay,
  goSection,
}: HeroProps) {
  const words = LANDING_V1.hero;
  const motion = motionOn(state, reduce);
  const live = rotates(state, reduce);
  return (
    <section aria-label={words.label} className="pl1-hero">
      <div
        ref={heroRef}
        className="pl1-canvas"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <div aria-hidden="true" className="pl1-lattice" />
        <div aria-hidden="true" className="pl1-sheen" />
        {HERO_SCENES.map((scene, index) => {
          const on = index === state.sel;
          const art = SCENE_ART[scene.art];
          const chip = chips[index] ?? null;
          return (
            <div
              key={scene.experimentId}
              aria-hidden={on ? 'false' : 'true'}
              className={classes('pl1-scene', `pl1-scene--${scene.art}`, on && 'is-on')}
            >
              <div className="pl1-atm">
                <div className="pl1-glow" />
              </div>
              <div className="pl1-subj">
                <div className="pl1-spinbox">
                  <div className="pl1-spin" />
                </div>
                <div ref={(node) => parallaxLayer(index, node)} className="pl1-px">
                  <svg
                    viewBox="0 0 1000 600"
                    preserveAspectRatio="xMidYMid slice"
                    role="img"
                    aria-label={scene.alt}
                    className="pl1-fill"
                  >
                    <use href={art.art} />
                  </svg>
                  <svg
                    viewBox="0 0 1000 600"
                    preserveAspectRatio="xMidYMid slice"
                    aria-hidden="true"
                    className="pl1-fill pl1-flow"
                  >
                    <use href={art.flow} />
                  </svg>
                </div>
              </div>
              <div className="pl1-ann">
                {chip ? (
                  <>
                    <span className="pl1-ann-course">
                      <span className="pl1-ann-dot" />
                      {chip.course}
                    </span>
                    <FormatChips offered={chip.formats} dark size="ann" />
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
        {!reduce && state.gen > 0 ? (
          <div key={`sw${state.gen}`} aria-hidden="true" className="pl1-sweep" />
        ) : null}
        <div aria-hidden="true" className="pl1-scrim" />
        <div className="pl1-copy">
          <div className="pl1-copy-in">
            <span className="pl1-hero-eyebrow pl1-intro pl1-i0">{words.eyebrow}</span>
            <h1 tabIndex={-1} className="pl1-h1">
              <span className="pl1-intro pl1-i1">{words.lines[0]}</span>
              <span className="pl1-intro pl1-i2">{words.lines[1]}</span>
              <span className="pl1-h1-gold pl1-intro pl1-i3">{words.lines[2]}</span>
            </h1>
            <p className="pl1-hero-lead pl1-intro pl1-i4">{words.lead}</p>
            <div className="pl1-hero-ctas pl1-intro pl1-i5">
              <Link className="pl1-cta-gold" href={LANDING_HREF.catalogue}>
                {words.browse}
                <Arrow className="pl1-cta-arrow" />
              </Link>
              <SectionLink section="featured" className="pl1-cta-outline" goSection={goSection}>
                {words.seeFeatured}
              </SectionLink>
            </div>
          </div>
        </div>
        <span className="pl1-illus">
          <span className="pl1-not-phone">{words.illustration}</span>
          <span className="pl1-phone-only">{words.illustrationShort}</span>
        </span>
      </div>
      <div className="pl1-picks-wrap pl1-intro pl1-i6">
        <div role="group" aria-label={words.scenes} className="pl1-picks">
          {HERO_SCENES.map((scene, index) => {
            const on = index === state.sel;
            const hov = hover === index;
            return (
              <button
                key={scene.experimentId}
                type="button"
                aria-pressed={on}
                className={classes(
                  'pl1-pick',
                  on && 'is-on',
                  !on && hov && 'is-hov',
                  on && live && 'is-live',
                )}
                onClick={() => onSelect(index)}
                onPointerEnter={() => onHover(index, true)}
                onPointerLeave={() => onHover(index, false)}
                onFocus={() => onHover(index, true)}
                onBlur={() => onHover(index, false)}
              >
                <span aria-hidden="true" className={`pl1-pick-thumb pl1-atm-${scene.art}`}>
                  <svg
                    viewBox={PICK_CROP[scene.art]}
                    preserveAspectRatio="xMidYMid slice"
                    className={classes('pl1-pick-art', (on || hov) && 'is-zoom')}
                  >
                    <use href={SCENE_ART[scene.art].art} />
                  </svg>
                </span>
                <span className="pl1-pick-text">
                  <span className="pl1-pick-kicker">{scene.kicker}</span>
                  <span className="pl1-pick-title">{scene.title}</span>
                </span>
                <span aria-hidden="true" className="pl1-pick-track" />
                <span aria-hidden="true" className="pl1-pick-prog" />
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={motion}
            aria-label={motion ? words.pause : words.play}
            title={motion ? words.pause : words.play}
            className="pl1-play"
            onClick={onTogglePlay}
          >
            {motion ? (
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <rect x="3" y="2" width="3.5" height="12" fill="currentColor" />
                <rect x="9.5" y="2" width="3.5" height="12" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path d="M4 2l10 6-10 6z" fill="currentColor" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

/** The tricolour under the hero (frozen 491): three 5 px bands that grow in on load. */
export function Tricolour() {
  return (
    <div aria-hidden="true" className="pl1-tri">
      <span className="pl1-tri-a" />
      <span className="pl1-tri-b" />
      <span className="pl1-tri-c" />
    </div>
  );
}
