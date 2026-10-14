/**
 * The public surface's words are the frozen boards' (B1-01 … B1-05, Package 1B): each drawn
 * phrase is found verbatim in its board's markup or script, the count words follow the boards'
 * formulas, and what no board words comes from the state-copy register.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  ACCESS_STEPS,
  AREA,
  AREAS,
  CATALOGUE,
  COURSE,
  EXPERIMENT,
  FORMAT_CARDS,
  HOW_ACCESS_WORKS,
  LANDING,
  PUBLIC_SHELL,
  areaAnnouncement,
  areaChip,
  areaCountsWords,
  availableInWords,
  backToFormatWords,
  backToWords,
  browseAllWords,
  browseCountWords,
  browseFormatWords,
  chooseOneFormatWords,
  courseChip,
  courseEyebrow,
  courseLine,
  courseMetaWords,
  filtersButtonWords,
  formatChip,
  formatFacetWords,
  inSelectionFormats,
  notAvailableWords,
  pickAreaLabel,
  positionWords,
  resultCountWords,
  searchChip,
  showCountWords,
  slideLabel,
  stepWords,
} from './public';

/** A board's text with tags removed (entities read), then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  const text = raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');
  return `${text}\n${raw.replace(/&amp;/g, '&')}`;
}

const B1_01 = words('B1-01-Public-Landing.dc.html');
const B1_02 = words('B1-02-Area-Explorer.dc.html');
const B1_03 = words('B1-03-Areas-and-Course.dc.html');
const B1_04 = words('B1-04-Catalogue.dc.html');
const B1_05 = words('B1-05-Experiment-Detail.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('the public shell and the landing are B1-01’s (and B1-02’s explorer)', () => {
  it.each(strings(PUBLIC_SHELL).filter((text) => !['Main', 'Footer'].includes(text)))(
    '%s',
    (text) => {
      expect(B1_01).toContain(text);
    },
  );

  it('the landmarks are named as drawn', () => {
    expect(B1_01).toContain('<nav aria-label="Main">');
    expect(B1_01).toContain('<nav aria-label="Footer">');
  });

  it.each(strings(LANDING).filter((text) => !['carousel', 'slide'].includes(text)))(
    '%s',
    (text) => {
      expect(B1_01).toContain(text);
    },
  );

  it.each(strings(ACCESS_STEPS))('PU-14 step: %s', (text) => {
    expect(B1_01).toContain(text);
  });

  it('PU-14 mini steps on B1-05 are the four titles, numbered 1–4', () => {
    for (const [index, step] of ACCESS_STEPS.entries())
      expect(B1_05).toContain(`<li><b>${index + 1}</b><span>${step.title}</span></li>`);
    expect(stepWords(0)).toBe('Step 1');
    expect(B1_01).toContain('<span class="xp-step4-n">Step 4</span>');
  });

  it.each(strings(FORMAT_CARDS).filter((text) => !['web', 'ar', 'vr', 'mr'].includes(text)))(
    'format card: %s',
    (text) => {
      expect(B1_01).toContain(text);
    },
  );

  it('the count formulas are the boards’', () => {
    expect(areaCountsWords(5, 2)).toBe('5 experiments · 2 courses');
    expect(B1_01).toContain('5 experiments · 2 courses');
    expect(areaCountsWords(3, 1)).toBe('3 experiments · 1 course');
    expect(B1_01).toContain('3 experiments · 1 course');
    expect(browseCountWords(5)).toBe('Browse 5 experiments');
    expect(B1_02).toContain('Browse 5 experiments');
    expect(browseAllWords(12)).toBe('Browse all 12 experiments');
    expect(B1_01).toContain('Browse all 12 experiments');
    expect(availableInWords(5, 12)).toBe('Available in 5 of 12 experiments');
    expect(B1_01).toContain('Available in 5 of 12 experiments');
    expect(browseFormatWords('vr')).toBe('Browse VR experiments');
    expect(B1_01).toContain('Browse VR experiments');
    expect(courseLine('ME ZG523', 'Thermodynamics & Heat Transfer')).toBe(
      'ME ZG523 · Thermodynamics & Heat Transfer',
    );
    expect(B1_01).toContain('ME ZG523 · Thermodynamics & Heat Transfer');
    expect(courseLine(null, 'Fluid Mechanics')).toBe('Fluid Mechanics');
  });

  it('the explorer’s positions, slide names and announcement follow B1-02’s script', () => {
    expect(positionWords(1, 3)).toBe('2 of 3');
    expect(slideLabel(1, 3, 'Electrical & Electronics')).toBe('2 of 3: Electrical & Electronics');
    expect(B1_01).toContain('aria-label="2 of 3: Electrical & Electronics"');
    expect(pickAreaLabel('Chemical & Process')).toBe('Show Chemical & Process');
    expect(B1_01).toContain('aria-label="Show Chemical & Process"');
    expect(areaAnnouncement(0, 3, 'Mechanical & Manufacturing')).toBe(
      'Mechanical & Manufacturing, area 1 of 3',
    );
    expect(B1_02).toContain("live: list[sel].name + ', area ' + (sel + 1) + ' of ' + n");
    expect(B1_02).toContain('aria-roledescription="carousel"');
    expect(B1_02).toContain('aria-roledescription="slide"');
  });
});

describe('PU-02, PU-03 and PU-05 are B1-03’s', () => {
  it.each([...strings(AREAS), ...strings(AREA), ...strings(COURSE), HOW_ACCESS_WORKS])(
    '%s',
    (text) => {
      expect(B1_03).toContain(text);
    },
  );

  it('the course eyebrow and the way back are B1-03’s', () => {
    expect(courseEyebrow('Mechanical & Manufacturing')).toBe('Course · Mechanical & Manufacturing');
    expect(B1_03).toContain('Course · Mechanical & Manufacturing');
    expect(backToWords('Mechanical & Manufacturing')).toBe('Back to Mechanical & Manufacturing');
    expect(B1_03).toContain('Back to Mechanical & Manufacturing');
  });
});

describe('PU-04 is B1-04’s', () => {
  it.each(strings(CATALOGUE))('%s', (text) => {
    expect(B1_04).toContain(text);
  });

  it('counts, chips and buttons follow B1-04’s script', () => {
    expect(resultCountWords(12, 12, false)).toBe('12 experiments');
    expect(resultCountWords(5, 12, true)).toBe('5 of 12 experiments');
    expect(B1_04).toContain(
      "count: nf ? list.length + ' of ' + total + ' experiments' : total + ' experiments'",
    );
    expect(areaChip('Mechanical & Manufacturing')).toBe('Area: Mechanical & Manufacturing');
    expect(courseChip('ME ZG523', 'Thermodynamics & Heat Transfer')).toBe('Course: ME ZG523');
    expect(courseChip(null, 'Fluid Mechanics')).toBe('Course: Fluid Mechanics');
    expect(formatChip('vr')).toBe('Format: VR');
    expect(searchChip(' forging ')).toBe('Search: “forging”');
    expect(B1_04).toContain("label: 'Search: “' + s.q.trim() + '”'");
    expect(filtersButtonWords(0)).toBe('Filters');
    expect(filtersButtonWords(2)).toBe('Filters (2)');
    expect(showCountWords(1)).toBe('Show 1 experiment');
    expect(showCountWords(7)).toBe('Show 7 experiments');
    expect(formatFacetWords('ar')).toBe('AR · Augmented reality');
    expect(B1_04).toContain('"name": "AR · Augmented reality"');
  });
});

describe('PU-06 is B1-05’s', () => {
  it.each(strings(EXPERIMENT))('%s', (text) => {
    expect(B1_05).toContain(text.trim());
  });

  it('the panel and the formats follow B1-05', () => {
    expect(chooseOneFormatWords()).toBe('Choose at least one format to add.');
    expect(B1_05).toContain('Choose at least one format to add.');
    expect(inSelectionFormats(['web', 'vr'])).toBe('Formats: WEB · VR');
    expect(backToFormatWords('vr')).toBe('Back to VR experiments');
    expect(B1_05).toContain("filterBack: s.filter ? 'Back to ' + s.filter + ' experiments' : ''");
    expect(notAvailableWords(['mr'])).toBe('Not available in MR.');
    expect(B1_05).toContain('Not available in MR.');
    // More than one missing format: B1-05's sentence, listed (state-copy `PU-06.not-available`).
    expect(notAvailableWords(['ar', 'vr', 'mr'])).toBe('Not available in AR, VR or MR.');
    expect(notAvailableWords([])).toBeNull();
    expect(courseMetaWords('Mechanical & Manufacturing', 3)).toBe(
      'Mechanical & Manufacturing · 3 experiments',
    );
    expect(B1_05).toContain('Mechanical & Manufacturing · 3 experiments');
  });
});
