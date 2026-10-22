'use client';

import type { KeyboardEvent, RefObject } from 'react';

import { LANDING_V1, STORY_CHIPS, STORY_STEPS, storyStepLabel } from '@/copy/landing-v1';

import { STORY_FLOW_SVG, STORY_PLOT_SVG, STORY_RESPONSE_SVG, STORY_TRACE_SVG } from './art';
import { classes } from './parts';

/** The step each annotation chip belongs to (1775–1780, the chip's fourth value). */
const CHIP_STEP = [0, 0, 0, 1, 2] as const;

/**
 * “Inside a simulation” (frozen 562–671; 1733–1802): one illustrative stage — a moving camera over
 * the exchanger, its flows, the station rings, a flow-rate plate and the interpretation plot — and
 * four text plates, driven by the story engine (`story-engine.ts`). Every value on the stage is
 * illustrative and labelled so (“Illustrative session”, “Illustrative · no measured values”); none
 * is computed or measured.
 *
 * The CSS custom properties the engine writes carry, as fallbacks, the selected step's look, so
 * the stage reads correctly before the engine's first frame.
 */
export function Story({
  selected,
  trackRef,
  stageRef,
  onChoose,
}: {
  readonly selected: number;
  readonly trackRef: RefObject<HTMLDivElement | null>;
  readonly stageRef: RefObject<HTMLDivElement | null>;
  readonly onChoose: (index: number) => void;
}) {
  const words = LANDING_V1.story;
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = (index + (event.key === 'ArrowRight' ? 1 : 3)) % 4;
    const group = event.currentTarget.parentNode as HTMLElement | null;
    const button = group?.querySelectorAll('button')[next];
    onChoose(next);
    button?.focus({ preventScroll: true });
  };
  return (
    <section aria-labelledby="pl1-story-h" className="pl1-story">
      <div data-reveal="1" className="pl1-head pl1-story-head">
        <div className="pl1-minw0">
          <span className="pl1-eyebrow pl1-eyebrow--gold">{words.eyebrow}</span>
          <h2 id="pl1-story-h" className="pl1-h2 pl1-h2--white">
            {words.title}
          </h2>
        </div>
        <div className="pl1-minw0">
          <p className="pl1-story-lead">{words.lead}</p>
          <span className="pl1-story-ctx-intro">{words.contextIntro}</span>
        </div>
      </div>
      <div ref={trackRef} className="pl1-track">
        <div ref={stageRef} role="region" aria-label={words.region} className="pl1-stage">
          <div className="pl1-stage-grid">
            <div className="pl1-media">
              <div aria-hidden="true" className="pl1-m-lattice" />
              <div aria-hidden="true" className="pl1-m-warm" />
              <div aria-hidden="true" className="pl1-m-cold" />
              <div aria-hidden="true" className="pl1-m-focus" />
              <div className="pl1-cam">
                <svg
                  viewBox="0 0 1000 600"
                  preserveAspectRatio="xMidYMid slice"
                  role="img"
                  aria-label={words.mediaAlt}
                  className="pl1-fill"
                >
                  <use href="#pl1-artThermal" />
                </svg>
                <svg
                  viewBox="0 0 1000 600"
                  preserveAspectRatio="xMidYMid slice"
                  aria-hidden="true"
                  className="pl1-fill pl1-sflow"
                  dangerouslySetInnerHTML={{ __html: STORY_FLOW_SVG }}
                />
                <svg
                  viewBox="0 0 1000 600"
                  preserveAspectRatio="xMidYMid slice"
                  aria-hidden="true"
                  className="pl1-fill pl1-sresp"
                  dangerouslySetInnerHTML={{ __html: STORY_RESPONSE_SVG }}
                />
                <svg
                  viewBox="0 0 1000 600"
                  preserveAspectRatio="xMidYMid slice"
                  aria-hidden="true"
                  className="pl1-fill"
                  dangerouslySetInnerHTML={{ __html: STORY_TRACE_SVG }}
                />
              </div>
              <div aria-hidden="true" className="pl1-vignette" />
              {STORY_CHIPS.map((chip, index) => (
                <span
                  key={chip}
                  className={classes(
                    'pl1-schip',
                    `pl1-schip--${index}`,
                    CHIP_STEP[index] === selected && 'is-sel',
                  )}
                >
                  <span className="pl1-schip-dot" />
                  {chip}
                </span>
              ))}
              <div aria-hidden="true" className="pl1-ctrl">
                <span aria-hidden="true" className="pl1-ctrl-ring" />
                <span className="pl1-ctrl-k">{words.flowRates}</span>
                <span className="pl1-ctrl-row">
                  <span className="pl1-ctrl-lab">{words.hotFlow}</span>
                  <span className="pl1-ctrl-track">
                    <span className="pl1-ctrl-fill pl1-ctrl-fill--hot" />
                    <span className="pl1-ctrl-knob pl1-ctrl-knob--hot" />
                  </span>
                </span>
                <span className="pl1-ctrl-row pl1-ctrl-row--cold">
                  <span className="pl1-ctrl-lab">{words.coldFlow}</span>
                  <span className="pl1-ctrl-track">
                    <span className="pl1-ctrl-fill pl1-ctrl-fill--cold" />
                    <span className="pl1-ctrl-knob pl1-ctrl-knob--cold" />
                  </span>
                </span>
              </div>
              <div aria-hidden="true" className="pl1-plot-shadow" />
              <div aria-hidden="true" className="pl1-plot-plate" />
              <div aria-hidden="true" className="pl1-plot">
                <span className="pl1-plot-leg">
                  <span className="pl1-leg-item">
                    <span className="pl1-leg-dot" />
                    {words.readings}
                  </span>
                  <span className="pl1-leg-item">
                    <span className="pl1-leg-line" />
                    {words.fitted}
                  </span>
                </span>
                <svg
                  viewBox="0 0 420 290"
                  preserveAspectRatio="xMidYMid meet"
                  className="pl1-plot-svg"
                  dangerouslySetInnerHTML={{ __html: STORY_PLOT_SVG }}
                />
                <span className="pl1-plot-cap">{words.plotCaption}</span>
              </div>
              <div className="pl1-ctx">
                <span className="pl1-ctx-k">{words.contextKicker}</span>
                <span className="pl1-ctx-t">{words.contextTitle}</span>
                <span className="pl1-ctx-c">{words.contextCourse}</span>
              </div>
              <span className="pl1-media-illus">
                <span className="pl1-not-phone">{words.illustration}</span>
                <span className="pl1-phone-only">{words.illustrationShort}</span>
              </span>
            </div>
            <div className="pl1-plates">
              <div className="pl1-plates-grid">
                {STORY_STEPS.map((step, index) => (
                  <div
                    key={step.n}
                    data-sq={index}
                    aria-hidden={index === selected ? 'false' : 'true'}
                    className={classes(
                      'pl1-sq',
                      `pl1-sq--${index}`,
                      index === selected && 'is-sel',
                    )}
                  >
                    <span className="pl1-sq-head">
                      <span className="pl1-sq-n">{step.n}</span>
                      <span className="pl1-sq-label">{step.label}</span>
                    </span>
                    <h3 className="pl1-sq-title">{step.title}</h3>
                    <p className="pl1-sq-body">{step.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div role="group" aria-label={words.steps} className="pl1-idx">
            <span aria-hidden="true" className="pl1-idx-rail" />
            <span aria-hidden="true" className="pl1-idx-bar" />
            {STORY_STEPS.map((step, index) => (
              <button
                key={step.n}
                type="button"
                data-sx={index}
                aria-pressed={index === selected}
                aria-label={storyStepLabel(step.n, step.label)}
                className={classes('pl1-ix', `pl1-ix--${index}`, index === selected && 'is-sel')}
                onClick={() => onChoose(index)}
                onKeyDown={(event) => onKeyDown(event, index)}
              >
                <span aria-hidden="true" className="pl1-ix-top" />
                <span className="pl1-ix-n">{step.n}</span>
                <span className="pl1-ix-label">{step.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
