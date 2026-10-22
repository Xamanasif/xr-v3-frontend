// @vitest-environment node
/**
 * The landing's words (PU-01 V1, prompt 13) are the frozen source's own. The frozen file is kept
 * byte-identical in the repository (`design/v1-landing/`, or `XR_V1_LANDING_SOURCE`): its SHA-256
 * is checked and every frozen string is found in it — the test fails, never skips, without it.
 * The owner's additions (22 Oct 2026) are listed apart and must not be in it.
 */
import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  ACCESS_STEPS_V1,
  AREA_BLURBS,
  areaBrowseWords,
  areaCountWords,
  areaSelectLabel,
  browseFormatLabel,
  FEATURED_PICKS,
  featuredArtAlt,
  featuredOpenLabel,
  FORMAT_ALT,
  FORMAT_TEXT,
  formatChipLabel,
  HERO_SCENES,
  LANDING_FORMAT_NAME,
  LANDING_V1,
  offeredInWords,
  seeAllWords,
  STORY_CHIPS,
  STORY_STEPS,
  storyStepLabel,
  TRUST_POINTS,
} from './landing-v1';
import { readV1Landing, V1_LANDING_SHA256 } from '@/test-support/v1-landing';

import { PRODUCT_NAME } from './product';

/** The owner's decisions (PUBLIC-LANDING-INTEGRATION-PLAN §8) and the adapter's landmark names. */
const NOT_FROZEN = new Set<string>([
  LANDING_V1.header.productName, // D-4
  LANDING_V1.header.signIn, // D-3
  LANDING_V1.access.request, // D-5
  LANDING_V1.header.mainNav, // D-10 landmarks
  LANDING_V1.footer.nav,
]);

function frozenWords(): string[] {
  const strings: string[] = [];
  const walk = (value: unknown) => {
    if (typeof value === 'string') strings.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk(LANDING_V1);
  for (const scene of HERO_SCENES) strings.push(scene.title, scene.alt, scene.kicker.slice(5));
  for (const pick of FEATURED_PICKS)
    strings.push(pick.descriptor, pick.artDescription, `'${pick.search}'`);
  walk(AREA_BLURBS);
  walk(STORY_STEPS);
  walk(STORY_CHIPS);
  walk(FORMAT_ALT);
  walk(FORMAT_TEXT);
  walk(LANDING_FORMAT_NAME);
  walk(TRUST_POINTS);
  walk(ACCESS_STEPS_V1);
  return strings.filter((text) => !NOT_FROZEN.has(text) && !/^(web|ar|vr|mr)$/.test(text));
}

describe('the landing’s words', () => {
  it('the owner’s decisions: the product name, Sign in, one request button', () => {
    expect(LANDING_V1.header.productName).toBe(PRODUCT_NAME);
    expect(PRODUCT_NAME).toBe('XR Learning Platform');
    expect(LANDING_V1.header.signIn).toBe('Sign in');
    expect(LANDING_V1.access.request).toBe('Request institutional access');
  });

  it('composes the counted and named phrases as the frozen formulas do', () => {
    expect(seeAllWords(12)).toBe('See all 12 experiments');
    expect(areaCountWords(5, 2)).toBe('5 experiments · 2 courses');
    expect(areaCountWords(1, 1)).toBe('1 experiment · 1 course');
    expect(areaBrowseWords(4)).toBe('Browse 4 experiments');
    expect(areaSelectLabel('Chemical & Process', 3, false)).toBe(
      'Show Chemical & Process, 3 experiments',
    );
    expect(areaSelectLabel('Chemical & Process', 3, true)).toBe(
      'Selected: Chemical & Process, 3 experiments',
    );
    expect(offeredInWords(7, 12)).toBe('Offered in 7 of 12 experiments');
    expect(browseFormatLabel('vr', false)).toBe('Browse VR experiments');
    expect(browseFormatLabel('vr', true)).toBe('Browse VR');
    expect(featuredOpenLabel('Distillation Column')).toBe(
      'View Distillation Column in the catalogue',
    );
    expect(featuredArtAlt('a turning-centre chuck')).toBe(
      'Illustration: a turning-centre chuck. Original concept artwork, not a simulation capture.',
    );
    expect(storyStepLabel('02', 'Observe')).toBe('Step 02: Observe');
    expect(formatChipLabel('mr', false)).toBe(
      'MR — Mixed reality, not offered for this experiment',
    );
    expect(formatChipLabel('web', true)).toBe('WEB — Browser, published for this experiment');
  });

  it('every frozen string is in the frozen source (design/v1-landing)', () => {
    const raw = readV1Landing();
    expect(createHash('sha256').update(raw).digest('hex')).toBe(V1_LANDING_SHA256);
    const text = raw
      .toString('utf8')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ');
    const missing = frozenWords().filter((words) => !text.includes(words));
    expect(missing).toEqual([]);
    for (const added of NOT_FROZEN) {
      if (added !== 'Main' && added !== 'Footer') expect(text.includes(`>${added}<`)).toBe(false);
    }
  });
});
