/**
 * The words of PU-01 Landing with PU-14 (the V1 Direction B2 landing, prompt 13): every string is
 * the frozen source's own — `21 · FROZEN · Premium Direction B2 - BITS Immersive Experience.dc.html`
 * (SHA-256 3dbe9412…4d07c), line numbers beside each — except the owner's four decisions of
 * 22 Oct 2026 (PUBLIC-LANDING-INTEGRATION-PLAN §8): the product name (D-4), “Sign in” (D-3), the one
 * “Request institutional access” button under PU-14 (D-5) and the hidden durations (D-7).
 * `copy/landing-v1.test.ts` reads the frozen file and proves each frozen string is in it.
 *
 * Counts, course lines and format availability are the sample world's (the catalogue reads),
 * never typed here; the illustrative story, the academic panel and the access steps are fixed
 * design content, labelled illustrative where the design says so.
 */
import { FORMAT_META, type Technology } from '@xr/domain';

import { PRODUCT_NAME } from './product';

/** The four formats in the frozen order (1015 `TECHS`) and their names (1016 `TECHNAME`). */
export const LANDING_FORMATS: readonly Technology[] = ['web', 'ar', 'vr', 'mr'];

export const LANDING_FORMAT_NAME: Readonly<Record<Technology, string>> = {
  web: 'Browser',
  ar: 'Augmented reality',
  vr: 'Virtual reality',
  mr: 'Mixed reality',
};

/** A format chip's name (1594): published, or not offered, for this experiment. */
export function formatChipLabel(format: Technology, offered: boolean): string {
  const code = FORMAT_META[format].code;
  return offered
    ? `${code} — ${LANDING_FORMAT_NAME[format]}, published for this experiment`
    : `${code} — ${LANDING_FORMAT_NAME[format]}, not offered for this experiment`;
}

export const LANDING_V1 = {
  /** Header (404–421; 1949, 1977) and the owner's “Sign in” (D-3). */
  header: {
    productName: PRODUCT_NAME,
    logoAlt: 'BITS Pilani Work Integrated Learning Programmes',
    mainNav: 'Main',
    featured: 'Featured',
    formats: 'Formats',
    institutions: 'For institutions',
    signIn: 'Sign in',
    catalogue: 'Browse the catalogue',
    catalogueShort: 'Catalogue',
  },
  /** Hero (426–489; 1077–1098, 1989, 2011). */
  hero: {
    label: 'Introduction',
    eyebrow: 'BITS Pilani · Work Integrated Learning Programmes',
    lines: ['Set the conditions.', 'See what follows.', 'Understand why.'],
    lead: 'Hands-on simulations of the lab experiments in your WILP courses, offered across WEB, AR, VR and MR.',
    browse: 'Browse the catalogue',
    seeFeatured: 'See featured experiments',
    illustration: 'Illustrative concept artwork · not a simulation capture',
    illustrationShort: 'Illustrative artwork · not a capture',
    scenes: 'Experiment scenes',
    pause: 'Pause motion',
    play: 'Play motion',
  },
  /** Featured (493–527; 1655–1676). */
  featured: {
    eyebrow: 'Featured experiments',
    title: 'Start with our flagship simulations.',
    lead: 'A curated selection across our engineering areas, including an experiment offered in all four formats.',
    view: 'View in catalogue',
  },
  /** Explore by area (529–560; 1678–1731). */
  explorer: {
    eyebrow: 'Explore by area',
    title: 'Every experiment, by engineering area.',
    lead: 'Pick an area to see its courses, then browse its experiments.',
    group: 'Experiment areas',
  },
  /** Inside a simulation (562–671; 1733–1802). */
  story: {
    eyebrow: 'Inside a simulation',
    title: 'See one experiment unfold.',
    lead: 'A representative look at how a learner can investigate one experiment.',
    /** 570, phone only (`ctxIntroShow`); `ME&nbsp;ZG523` keeps the code on one line. */
    contextIntro: 'Illustrative session · Shell-and-Tube Heat Exchanger · ME ZG523',
    region: 'Illustrative session: Shell-and-Tube Heat Exchanger',
    mediaAlt:
      'Illustration: a shell-and-tube heat exchanger in cutaway, shown in four editorial views. Original concept artwork, not a simulation capture.',
    flowRates: 'Flow rates',
    hotFlow: 'Hot flow',
    coldFlow: 'Cold flow',
    readings: 'Your readings',
    fitted: 'Fitted relationship',
    plotCaption: 'Illustrative · no measured values',
    contextKicker: 'Illustrative session',
    contextTitle: 'Shell-and-Tube Heat Exchanger',
    contextCourse: 'ME ZG523 · Thermodynamics & Heat Transfer',
    illustration: 'Illustrative artwork · not a simulation capture',
    illustrationShort: 'Illustrative',
    steps: 'Story steps',
  },
  /** Formats (673–699; 1804–1847). */
  formats: {
    eyebrow: 'Formats',
    title: 'One experiment. Four ways to run it.',
    lead: 'WEB, AR, VR and MR are equal options. Each experiment shows the formats it offers.',
    previewing: 'Previewing. ',
  },
  /** Academic quality (701–738; 1849–1855, 2052). */
  academic: {
    organised: 'How experiment content is organised',
    course: 'Course',
    courseValue: 'ME ZG523 · Thermodynamics & Heat Transfer',
    experiment: 'Experiment',
    experimentValue: 'Shell-and-Tube Heat Exchanger',
    reviewed: 'Reviewed',
    offered: 'Offered formats',
    /** The panel's illustrative chips (2052 `techSet(exp('e1').techs)`): WEB, AR, VR; MR not offered. */
    offeredFormats: ['web', 'ar', 'vr'] as readonly Technology[],
    eyebrow: 'Academic quality',
    title: 'Academically reviewed. Built around your courses.',
    lead: 'Published experiment content is academically reviewed and organised around the courses it supports.',
  },
  /** For institutions, PU-14 (740–764; 1856–1869) and the owner's request button (D-5). */
  access: {
    eyebrow: 'For institutions',
    titleLines: ['Anyone can browse.', 'Institutions grant access.'],
    lead: 'Running an experiment needs access arranged through your institution.',
    steps: 'How access works',
    request: 'Request institutional access',
  },
  /** Closing band (766–774). */
  closing: {
    label: 'Open the catalogue',
    title: 'Find the experiments for your course.',
    browse: 'Browse the catalogue',
  },
  /** Footer (910–920; 2036–2041). */
  footer: {
    nav: 'Footer',
    catalogue: 'Catalogue',
    featured: 'Featured experiments',
    formats: 'Formats',
    institutions: 'For institutions',
    note: 'Sample courses and experiments · illustrative concept artwork · no production data',
  },
} as const;

/** The three hero scenes (1077–1098): the design's picks, by experiment, with their artwork. */
export const HERO_SCENES = [
  {
    experimentId: 'shell-and-tube-heat-exchanger',
    kicker: '01 · Thermal & heat transfer',
    title: 'Shell-and-Tube Heat Exchanger',
    art: 'thermal',
    alt: 'Illustration: a shell-and-tube heat exchanger in cutaway — the shell-side stream enters warm at the top left, weaves around three baffles and leaves cool at the bottom right; three tube rows carry the cold stream the other way; bolted heads, saddle supports and four temperature stations T1 to T4. Original concept artwork, not validated apparatus geometry.',
  },
  {
    experimentId: 'induction-motor-loading',
    kicker: '02 · Machines & fields',
    title: 'Induction Motor Loading',
    art: 'motor',
    alt: 'Illustration: a finned three-phase motor housing seen end-on — copper stator slots around a laminated rotor, a shaft coupled to a flywheel load, a terminal box and a slowly rotating field. Original concept artwork, not a simulation capture.',
  },
  {
    experimentId: 'distillation-column',
    kicker: '03 · Process & control',
    title: 'Distillation Column',
    art: 'process',
    alt: 'Illustration: a distillation column with its trays visible through a glass section, an overhead condenser, reflux drum and reboiler, and a reflux valve driven by a temperature controller. Original concept artwork, not a simulation capture.',
  },
] as const;

/**
 * The four featured cards in the frozen order (1656–1660): the experiment, the catalogue search
 * “View in catalogue” opens (1674 `q`), the one-line descriptor and the artwork's description
 * (1063–1072 `THUMB`).
 */
export const FEATURED_PICKS = [
  {
    experimentId: 'cnc-turning-centre',
    search: 'CNC',
    descriptor: 'Set up workholding and tool offsets, then cut and inspect a test part.',
    art: 'machining',
    artDescription: 'a turning-centre chuck holding a workpiece against a cutting tool',
  },
  {
    experimentId: 'shell-and-tube-heat-exchanger',
    search: 'Shell-and-Tube',
    descriptor:
      'Balance two flows and find the effectiveness–NTU relationship from your own readings.',
    art: 'thermal',
    artDescription: 'a countercurrent shell-and-tube exchanger with four measurement stations',
  },
  {
    experimentId: 'induction-motor-loading',
    search: 'Induction Motor',
    descriptor: 'Load the motor in steps and read torque, slip and efficiency yourself.',
    art: 'motor',
    artDescription: 'a three-phase stator with copper slots around a rotor',
  },
  {
    experimentId: 'distillation-column',
    search: 'Distillation',
    descriptor: 'Take a column from cold start to steady state and tune reflux for purity.',
    art: 'process',
    artDescription: 'a distillation column with condenser, reflux drum and reboiler',
  },
] as const;

/** A featured card's artwork description (1667). */
export function featuredArtAlt(description: string): string {
  return `Illustration: ${description}. Original concept artwork, not a simulation capture.`;
}

/** A featured card's link name (1668). */
export function featuredOpenLabel(name: string): string {
  return `View ${name} in the catalogue`;
}

/** “See all 12 experiments” (499): the published total. */
export function seeAllWords(total: number): string {
  return total === 1 ? 'See all 1 experiment' : `See all ${total} experiments`;
}

/** The area blurbs (1679–1683), by the area's artwork family (B2 `GROUPS[].family`). */
export const AREA_BLURBS: Readonly<Record<string, string>> = {
  thermal: 'Heat transfer, thermodynamics and manufacturing processes.',
  motor: 'Electrical machines, transformers and power electronics.',
  process: 'Distillation, process control and flow measurement.',
};

/** “5 experiments · 2 courses” (1696). */
export function areaCountWords(experiments: number, courses: number): string {
  return `${experiments}${experiments === 1 ? ' experiment · ' : ' experiments · '}${courses}${courses === 1 ? ' course' : ' courses'}`;
}

/** “Browse 5 experiments” (1698). */
export function areaBrowseWords(experiments: number): string {
  return `Browse ${experiments}${experiments === 1 ? ' experiment' : ' experiments'}`;
}

/** An area panel's selector name (1700): “Selected: …” or “Show …”, with its count. */
export function areaSelectLabel(name: string, experiments: number, selected: boolean): string {
  return `${selected ? 'Selected: ' : 'Show '}${name}, ${experiments}${experiments === 1 ? ' experiment' : ' experiments'}`;
}

/** The four story steps (1750–1755): number, label, title, body. */
export const STORY_STEPS = [
  {
    n: '01',
    label: 'Understand',
    title: 'Two streams, one exchange.',
    body: 'A hot stream and a cold stream flow in opposite directions, and heat passes between them through the tube walls.',
  },
  {
    n: '02',
    label: 'Observe',
    title: 'Set it up and look closely.',
    body: 'Set the flow rates and inlet temperatures, then observe the temperatures across the exchanger.',
  },
  {
    n: '03',
    label: 'Experiment',
    title: 'Change a condition. See the response.',
    body: 'Vary a flow rate or an inlet temperature and compare how the outlet temperatures respond.',
  },
  {
    n: '04',
    label: 'Interpret',
    title: 'Find the relationship in your readings.',
    body: 'Use your own readings to derive the exchanger’s effectiveness–NTU relationship.',
  },
] as const;

/** A story step's index name (1762): “Step 01: Understand”. */
export function storyStepLabel(n: string, label: string): string {
  return `Step ${n}: ${label}`;
}

/** The stage's annotation chips (1775–1780). */
export const STORY_CHIPS = [
  'Hot stream',
  'Cold stream',
  'Heat passes through the tube wall',
  'Temperature stations',
  'Outlet temperatures respond',
] as const;

/** The format cards' descriptions and lines (1807–1818). */
export const FORMAT_ALT: Readonly<Record<Technology, string>> = {
  web: 'Illustration of the browser format: a window holding an experiment workspace with controls, an apparatus view and a plot. It explains the format; it is not a runtime screenshot.',
  ar: 'Illustration of the augmented-reality format: a handheld device held over a bench with a digital overlay drawn on its screen. It explains the format; it is not a device capture or a tracking claim.',
  vr: 'Illustration of the virtual-reality format: a headset whose visor holds a contained learning scene. It explains the format; it is not a device capture or a hardware claim.',
  mr: 'Illustration of the mixed-reality format: a physical desk and object with a distinct digital information layer above it. It explains the format; it is not an anchoring or tracking claim.',
};

export const FORMAT_TEXT: Readonly<Record<Technology, string>> = {
  web: 'The experiment in a web browser, on a laptop or desktop.',
  ar: 'The experiment overlaid on your surroundings, on a supported phone or tablet.',
  vr: 'The experiment in a virtual lab, on a supported headset.',
  mr: 'The experiment combined with your real surroundings, on a supported device.',
};

/** “Offered in 5 of 12 experiments” (1842). */
export function offeredInWords(count: number, total: number): string {
  return `Offered in ${count} of ${total}${total === 1 ? ' experiment' : ' experiments'}`;
}

/** “Browse VR experiments”, “Browse VR” at phone width (1843). */
export function browseFormatLabel(format: Technology, short: boolean): string {
  const code = FORMAT_META[format].code;
  return short ? `Browse ${code}` : `Browse ${code} experiments`;
}

/** The four trust points (1850–1855): icon path, heading, line. */
export const TRUST_POINTS = [
  {
    icon: 'M4 10.5l4 4 8-9',
    head: 'Academically reviewed',
    body: 'Experiment content is academically reviewed before first publication.',
  },
  {
    icon: 'M3 4.5h4.5A2.5 2.5 0 0 1 10 7v9a2 2 0 0 0-2-2H3zM17 4.5h-4.5A2.5 2.5 0 0 0 10 7v9a2 2 0 0 1 2-2h5z',
    head: 'Mapped to your course',
    body: 'Each experiment belongs to a course in the platform’s academic structure.',
  },
  {
    icon: 'M10 3l7 4-7 4-7-4zM3 11l7 4 7-4',
    head: 'Consistent across offered formats',
    body: 'Each format offered for an experiment is based on the same reviewed content.',
  },
  {
    icon: 'M16 10a6 6 0 1 1-1.8-4.3M16 3.5v3.5h-3.5',
    head: 'Reviewed again when content changes',
    body: 'Academic corrections return for review before the corrected version is released.',
  },
] as const;

/** The six access steps of PU-14 (1856–1863). */
export const ACCESS_STEPS_V1 = [
  {
    n: '01',
    title: 'Browse the catalogue',
    text: 'Explore the public catalogue. Browsing does not grant access.',
  },
  {
    n: '02',
    title: 'Institution requests access',
    text: 'Your institution requests the courses, experiments and formats it needs.',
  },
  {
    n: '03',
    title: 'Request is reviewed',
    text: 'The request is checked against the published catalogue and decided.',
  },
  {
    n: '04',
    title: 'Payment where applicable',
    text: 'External paid requests complete payment before access is activated.',
  },
  {
    n: '05',
    title: 'Institution access is provisioned',
    text: 'The institution’s access is activated for the agreed content and term.',
  },
  {
    n: '06',
    title: 'Institution grants student access',
    text: 'Its administrator assigns students within the provisioned scope.',
  },
] as const;
