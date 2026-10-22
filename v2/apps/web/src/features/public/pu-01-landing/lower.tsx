'use client';

import { FORMAT_META, type Technology } from '@xr/domain';
import { Link } from '@xr/ui';

import {
  ACCESS_STEPS_V1,
  browseFormatLabel,
  FORMAT_ALT,
  FORMAT_TEXT,
  LANDING_FORMAT_NAME,
  LANDING_FORMATS,
  LANDING_V1,
  offeredInWords,
  TRUST_POINTS,
} from '@/copy/landing-v1';
import { FOR_INSTITUTIONS_ID } from '@/nav/public-nav';

import { LANDING_HREF } from './bind';
import { SectionLink, type LandingSection } from './header';
import { Arrow, classes, FormatChips, LogoTile } from './parts';

/** Each format's drawing and its reveal layer (1825 `fmtSyms`). */
const FORMAT_ART: Readonly<Record<Technology, readonly [string, string]>> = {
  web: ['#pl1-artWeb', '#pl1-artWebOn'],
  ar: ['#pl1-artAr', '#pl1-artArOn'],
  vr: ['#pl1-artVr', '#pl1-artVrOn'],
  mr: ['#pl1-artMr', '#pl1-artMrOn'],
};

/**
 * Formats (frozen 673–699; 1804–1847): four peer cards. Pointer entry, focus or a click on the
 * drawing previews it — an 8 px lift, the gold edge, the reveal layer and the cyan glow; “Browse”
 * is a separate link to the catalogue filtered by the format.
 */
export function Formats({
  counts,
  total,
  selected,
  onPreview,
}: {
  readonly counts: Readonly<Record<Technology, number>> | null;
  readonly total: number | null;
  readonly selected: number;
  readonly onPreview: (index: number) => void;
}) {
  const words = LANDING_V1.formats;
  return (
    <section id="formats" aria-labelledby="pl1-formats-h" className="pl1-fmt">
      <div className="pl1-head">
        <div>
          <span className="pl1-eyebrow">{words.eyebrow}</span>
          <h2 id="pl1-formats-h" className="pl1-h2">
            {words.title}
          </h2>
        </div>
        <p className="pl1-head-lead">{words.lead}</p>
      </div>
      <div data-reveal="1" className="pl1-fmt-grid">
        {LANDING_FORMATS.map((format, index) => {
          const on = selected === index;
          const [base, reveal] = FORMAT_ART[format];
          return (
            <div
              key={format}
              className={classes('pl1-fcard', `pl1-fcard--${format}`, on && 'is-on')}
              onPointerEnter={() => onPreview(index)}
            >
              <span aria-hidden="true" className="pl1-fcard-edge" />
              <button
                type="button"
                aria-pressed={on}
                aria-label={(on ? words.previewing : '') + FORMAT_ALT[format]}
                className="pl1-fcard-media"
                onClick={() => onPreview(index)}
                onFocus={() => onPreview(index)}
              >
                <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid meet" className="pl1-fill">
                  <use href={base} />
                </svg>
                <svg
                  viewBox="0 0 400 240"
                  preserveAspectRatio="xMidYMid meet"
                  className="pl1-fill pl1-fcard-reveal"
                >
                  <use href={reveal} />
                </svg>
                <span aria-hidden="true" className="pl1-fcard-lit" />
              </button>
              <div className="pl1-fcard-body">
                <span className="pl1-fcard-name">
                  <span className="pl1-fcard-code">{FORMAT_META[format].code}</span>
                  <span className="pl1-fcard-kind">{LANDING_FORMAT_NAME[format]}</span>
                </span>
                <p className="pl1-fcard-text">{FORMAT_TEXT[format]}</p>
                <span className="pl1-fcard-n">
                  {counts && total !== null ? offeredInWords(counts[format], total) : null}
                </span>
                <Link className="pl1-fcard-cta" href={LANDING_HREF.format(format)}>
                  <span className="pl1-not-phone">{browseFormatLabel(format, false)}</span>
                  <span className="pl1-phone-only">{browseFormatLabel(format, true)}</span>
                  <Arrow />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Academic quality (frozen 701–738; 1849–1855): the navy panel of three stepped plates — course,
 * experiment with its “Reviewed” seal, offered formats — joined by elbows, then the copy and the
 * four trust points. Fixed illustrative design content.
 */
export function Academic() {
  const words = LANDING_V1.academic;
  return (
    <section aria-labelledby="pl1-acad-h" className="pl1-acad">
      <div data-reveal="1" className="pl1-acad-grid">
        <div className="pl1-acad-vis">
          <div aria-hidden="true" className="pl1-acad-lattice" />
          <div aria-hidden="true" className="pl1-acad-glow" />
          <ol aria-label={words.organised} className="pl1-acad-list">
            <li className="pl1-pl pl1-pl--1">
              <span aria-hidden="true" className="pl1-pl-icon">
                <svg
                  viewBox="0 0 20 20"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 4.5h4.5A2.5 2.5 0 0 1 10 7v9a2 2 0 0 0-2-2H3zM17 4.5h-4.5A2.5 2.5 0 0 0 10 7v9a2 2 0 0 1 2-2h5z" />
                </svg>
              </span>
              <span className="pl1-minw0">
                <span className="pl1-pl-k">{words.course}</span>
                <span className="pl1-pl-v">{words.courseValue}</span>
              </span>
            </li>
            <li className="pl1-pl pl1-pl--2">
              <span data-seq="y" aria-hidden="true" className="pl1-pl-elbow" />
              <span aria-hidden="true" className="pl1-pl-thumb pl1-atm-thermal">
                <svg
                  viewBox="60 40 880 480"
                  preserveAspectRatio="xMidYMid slice"
                  className="pl1-fill"
                >
                  <use href="#pl1-artThermal" />
                </svg>
              </span>
              <span className="pl1-minw0 pl1-grow">
                <span className="pl1-pl-k">{words.experiment}</span>
                <span className="pl1-pl-v">{words.experimentValue}</span>
              </span>
              <span data-seq="m" className="pl1-seal">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 12 12"
                  width="11"
                  height="11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.5 6.3l2.3 2.2 4.7-5" />
                </svg>
                {words.reviewed}
              </span>
            </li>
            <li className="pl1-pl pl1-pl--3">
              <span data-seq="y" aria-hidden="true" className="pl1-pl-elbow" />
              <span className="pl1-pl-k">{words.offered}</span>
              <FormatChips offered={words.offeredFormats} dark size="panel" />
            </li>
          </ol>
        </div>
        <div>
          <span className="pl1-eyebrow">{words.eyebrow}</span>
          <h2 id="pl1-acad-h" className="pl1-h2 pl1-acad-h">
            {words.title}
          </h2>
          <p className="pl1-acad-lead">{words.lead}</p>
          <div className="pl1-trust">
            {TRUST_POINTS.map((point) => (
              <div key={point.head} className="pl1-trust-item">
                <span aria-hidden="true" className="pl1-trust-icon">
                  <svg
                    viewBox="0 0 20 20"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={point.icon} />
                  </svg>
                </span>
                <span className="pl1-minw0">
                  <span className="pl1-trust-h">{point.head}</span>
                  <span className="pl1-trust-b">{point.body}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * For institutions — PU-14 (frozen 740–764; 1856–1869): the six steps with their ring markers,
 * connectors and return connectors, then the owner's one “Request institutional access” button to
 * the existing selection and request flow (D-5), in the frozen navy button style. The heading takes
 * focus when the page is opened at `/#for-institutions` (route focus).
 */
export function Access() {
  const words = LANDING_V1.access;
  const last = ACCESS_STEPS_V1.length - 1;
  return (
    <section id={FOR_INSTITUTIONS_ID} aria-labelledby="pl1-access-h" className="pl1-acc">
      <div data-reveal="1" className="pl1-head">
        <div className="pl1-minw0">
          <span className="pl1-eyebrow">{words.eyebrow}</span>
          <h2 id="pl1-access-h" tabIndex={-1} className="pl1-h2 pl1-acc-h">
            <span className="pl1-block">{words.titleLines[0]}</span>
            <span className="pl1-block">{words.titleLines[1]}</span>
          </h2>
        </div>
        <div className="pl1-minw0">
          <p className="pl1-acc-lead">{words.lead}</p>
        </div>
      </div>
      <ol data-reveal="1" aria-label={words.steps} className="pl1-acc-steps">
        {ACCESS_STEPS_V1.map((step, index) => (
          <li
            key={step.n}
            className={classes(
              'pl1-st',
              // The connectors each layout draws (1867–1868): across within a row, down the
              // phone list, and back to the next row's start at a row's end.
              index % 3 !== 2 && 'pl1-st--h3',
              index % 2 === 0 && 'pl1-st--h2',
              index < last && 'pl1-st--v',
              index % 3 === 2 && index < last && 'pl1-st--r3',
              index % 2 === 1 && index < last && 'pl1-st--r2',
            )}
          >
            <span data-seq="m" aria-hidden="true" className="pl1-st-ring">
              <span className="pl1-st-dot" />
            </span>
            <span data-seq="x" aria-hidden="true" className="pl1-st-h">
              <span className="pl1-st-h-head" />
            </span>
            <span data-seq="y" aria-hidden="true" className="pl1-st-v" />
            <span data-seq="f" aria-hidden="true" className="pl1-st-ret" />
            <span data-seq="f" aria-hidden="true" className="pl1-st-ret2">
              <span className="pl1-st-ret2-head" />
            </span>
            <span className="pl1-st-n">{step.n}</span>
            <span className="pl1-st-t">{step.title}</span>
            <span className="pl1-st-x">{step.text}</span>
          </li>
        ))}
      </ol>
      <div className="pl1-acc-foot">
        <Link className="pl1-btn-navy pl1-acc-request" href={LANDING_HREF.selection}>
          {words.request}
          <Arrow />
        </Link>
      </div>
    </section>
  );
}

/** The closing gold band (frozen 766–774). */
export function Closing() {
  const words = LANDING_V1.closing;
  return (
    <section aria-label={words.label} className="pl1-band">
      <div className="pl1-band-grid">
        <h2 className="pl1-band-h">{words.title}</h2>
        <div className="pl1-band-actions">
          <Link className="pl1-btn-navy" href={LANDING_HREF.catalogue}>
            {words.browse}
            <Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** The footer (frozen 910–920): the logo tile and the product name, the links, the frozen note. */
export function LandingFooter({
  goSection,
}: {
  readonly goSection: (section: LandingSection) => void;
}) {
  const words = LANDING_V1.footer;
  return (
    <footer className="pl1-foot">
      <div className="pl1-foot-grid">
        <span className="pl1-foot-brand">
          <LogoTile place="footer" />
          <span className="pl1-foot-name">{LANDING_V1.header.productName}</span>
        </span>
        <nav aria-label={words.nav} className="pl1-foot-links">
          <Link className="pl1-foot-link" href={LANDING_HREF.catalogue}>
            {words.catalogue}
          </Link>
          <SectionLink section="featured" className="pl1-foot-link" goSection={goSection}>
            {words.featured}
          </SectionLink>
          <SectionLink section="formats" className="pl1-foot-link" goSection={goSection}>
            {words.formats}
          </SectionLink>
          <SectionLink section="for-institutions" className="pl1-foot-link" goSection={goSection}>
            {words.institutions}
          </SectionLink>
        </nav>
        <span className="pl1-foot-note">{words.note}</span>
      </div>
    </footer>
  );
}
