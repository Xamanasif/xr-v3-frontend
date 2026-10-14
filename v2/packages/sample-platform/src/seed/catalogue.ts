/**
 * The catalogue the spine-start world holds (B1-02, B1-04, B1-05, B3-01, B6-08, B7-06, B7-07):
 * three engineering areas, six courses (Fluid Mechanics has no code and no experiment yet) and the
 * twelve experiments published before the sample period — "Composite Wall Conduction" (WEB + AR)
 * among them as its own record (BC11). SUB-0077's experiment is not here: Flow E publishes it.
 *
 * Words are the boards' own. Where a board draws no value for a field the record must hold, the
 * fill is marked here: an experiment's description repeats its drawn summary; a web link nobody
 * drew is `https://labs.example/<slug>`; an undrawn vendor organisation, package label or install
 * note is left empty. Sample only — never a default.
 */
import {
  type Course,
  type EngineeringArea,
  type Experiment,
  type ExperimentVersion,
  type FormatDelivery,
  type IsoInstant,
  type LearningOutcome,
  type LearningResource,
  type PlatformCourseCode,
  type Technology,
  unsafeBrand,
} from '@xr/domain';

import { ARJUN, ist, meta, note, personRef, type SeedBook } from './book.js';

export const AREA = {
  mechanical: 'mechanical-manufacturing',
  electrical: 'electrical-electronics',
  chemical: 'chemical-process',
} as const;

export const COURSE = {
  thermo: 'thermodynamics-heat-transfer',
  manufacturing: 'manufacturing-processes',
  machines: 'electrical-machines',
  power: 'power-electronics',
  process: 'process-instrumentation-control',
  fluids: 'fluid-mechanics',
} as const;

export const EXPERIMENT = {
  shellAndTube: 'shell-and-tube-heat-exchanger',
  finTube: 'fin-tube-bundle',
  compositeWall: 'composite-wall-conduction',
  cnc: 'cnc-turning-centre',
  casting: 'investment-casting',
  induction: 'induction-motor-loading',
  synchronous: 'synchronous-generator',
  transformer: 'transformer-tests',
  buck: 'buck-converter-ripple',
  distillation: 'distillation-column',
  boiler: 'boiler-drum-level',
  orifice: 'orifice-plate-metering',
} as const;

/**
 * The landing's "Featured experiments" in the drawn order (B1-01: CNC Turning Centre — "one
 * experiment available in all four formats" — Shell-and-Tube Heat Exchanger, Induction Motor
 * Loading, Distillation Column). A seeded list (P1-22 interim); whether the set is curated or
 * derived stays OPEN (B1-14).
 */
export const FEATURED: readonly string[] = [
  EXPERIMENT.cnc,
  EXPERIMENT.shellAndTube,
  EXPERIMENT.induction,
  EXPERIMENT.distillation,
];

/** The Content Manager who published the catalogue (B7-06 "By the Content Manager"). */
export const KAVYA_PERSON = 'per-kavya-nair';
const KAVYA = personRef(KAVYA_PERSON, 'content_manager', 'Kavya Nair');

const LIVE_SINCE = ist('2026-06-02 10:00');

/**
 * Each area's concept artwork (B1-01 and B1-02 explorer data `artCls`/`bgCls`: thermal, motor,
 * process; B1-03 cards; "Bespoke B2 artwork where it exists (three areas)"). Package 1B: the
 * spine-start world had no artwork, so every area showed the drawn fallback.
 */
function addAreas(book: SeedBook): void {
  const areas: [string, string, string, string][] = [
    [
      AREA.mechanical,
      'Mechanical & Manufacturing',
      'Heat transfer, thermodynamics and manufacturing processes.',
      'thermal',
    ],
    [
      AREA.electrical,
      'Electrical & Electronics',
      'Electrical machines, transformers and power electronics.',
      'motor',
    ],
    [
      AREA.chemical,
      'Chemical & Process',
      'Distillation, process control and flow measurement.',
      'process',
    ],
  ];
  for (const [id, name, description, artworkKey] of areas) {
    const area: EngineeringArea = {
      ...meta(LIVE_SINCE),
      id: unsafeBrand(id),
      name,
      description,
      artworkKey,
      history: [
        book.entry({
          event: 'area-added',
          at: LIVE_SINCE,
          actor: ARJUN,
          visibleTo: ['super_admin'],
        }),
      ],
    };
    book.put(
      'areas',
      id,
      area,
      note('B7-07 areas; B1-02', `${name} — area in use since 2 Jun 2026`),
    );
  }
}

function addCourses(book: SeedBook): void {
  const courses: [string, string, string, string | null, string, IsoInstant][] = [
    [
      COURSE.thermo,
      AREA.mechanical,
      'Thermodynamics & Heat Transfer',
      'ME ZG523',
      'Laboratory experiments covering conduction, convection and exchanger performance. Learners take their own instrument readings under realistic operating conditions.',
      LIVE_SINCE,
    ],
    [
      COURSE.manufacturing,
      AREA.mechanical,
      'Manufacturing Processes',
      'MEL ZG512',
      'Machining and casting experiments that relate process settings to the parts they produce.',
      LIVE_SINCE,
    ],
    [
      COURSE.machines,
      AREA.electrical,
      'Electrical Machines',
      'EEE ZC341',
      'Motor, generator and transformer experiments built around readings learners take themselves.',
      LIVE_SINCE,
    ],
    [
      COURSE.power,
      AREA.electrical,
      'Power Electronics',
      'EEE ZG512',
      'Converter experiments that connect switching behaviour to measured waveforms.',
      LIVE_SINCE,
    ],
    [
      COURSE.process,
      AREA.chemical,
      'Process Instrumentation & Control',
      'CHE ZG513',
      'Column, loop and metering experiments under realistic process lag and uncertainty.',
      LIVE_SINCE,
    ],
    [
      COURSE.fluids,
      AREA.mechanical,
      'Fluid Mechanics',
      null,
      'Flow measurement and pipe-flow experiments (course added; no experiments yet).',
      ist('2026-08-24 10:00'),
    ],
  ];
  for (const [id, areaId, name, code, description, at] of courses) {
    const history = [
      book.entry({ event: 'course-added', at, actor: ARJUN, visibleTo: ['super_admin'] }),
      ...(code
        ? [
            book.entry({
              event: 'platform-code-set',
              at,
              actor: KAVYA,
              note: code,
              visibleTo: ['content_manager', 'super_admin'],
            }),
          ]
        : []),
    ];
    const course: Course = {
      ...meta(at),
      id: unsafeBrand(id),
      areaId: unsafeBrand(areaId),
      name,
      description,
      platformCode: code ? (code as PlatformCourseCode) : null,
      history,
    };
    book.put(
      'courses',
      id,
      course,
      note('B7-07 courses; B6-10', code ? `${code} · ${name}` : `${name} — no platform code yet`),
    );
  }
}

/** The B1-05 "Device needs" per format (sample wording supplied by the Vendor, VE-F3). */
const DEVICE_NEEDS: Readonly<Record<Technology, string>> = {
  web: 'Laptop or desktop with a current web browser',
  ar: 'Supported phone or tablet',
  vr: 'Supported VR headset',
  mr: 'Supported MR headset',
};

/** The drawn package values of an AR / VR / MR format (B6-09 Distillation Column VR build 1.2). */
interface PackageDraft {
  readonly packageLabel?: string;
  readonly packageReference?: string;
  readonly deviceNeeded?: string;
  readonly installNotes?: string;
}

interface ExperimentSeed {
  readonly id: string;
  readonly courseId: string;
  readonly name: string;
  readonly summary: string;
  readonly description?: string;
  readonly formats: readonly Technology[];
  /** The concept artwork of the catalogue row (B1-04 `art`; PC-31). */
  readonly artwork: string;
  readonly outcomes: readonly [string, string];
  readonly vendorOrganisation?: string;
  readonly webLink?: string;
  readonly delivery?: Partial<Record<Technology, PackageDraft>>;
  /** The versions as drawn, oldest first: label, live from, and the update that released it. */
  readonly versions: readonly {
    readonly label: string;
    readonly at: IsoInstant;
    readonly updateId?: string;
  }[];
  readonly preview?: { readonly label: string | null; readonly link: string };
  readonly resources?: readonly LearningResource[];
  readonly evidence: string;
}

function deliveryOf(seed: ExperimentSeed, format: Technology): FormatDelivery {
  if (format === 'web') {
    return {
      format: 'web',
      webLink: seed.webLink ?? `https://labs.example/${seed.id}`,
      browserAndComputer: DEVICE_NEEDS.web,
      notes: null,
    };
  }
  const drawn = seed.delivery?.[format] ?? {};
  return {
    format,
    packageLabel: drawn.packageLabel ?? '',
    packageReference: drawn.packageReference ?? null,
    packageFileName: null,
    deviceNeeded: drawn.deviceNeeded ?? DEVICE_NEEDS[format],
    installNotes: drawn.installNotes ?? '',
    notes: null,
  };
}

function addExperiment(book: SeedBook, seed: ExperimentSeed): void {
  const outcomes: LearningOutcome[] = seed.outcomes.map((text) => ({
    id: book.ids.next('learningOutcome'),
    text,
  }));
  const formats = seed.formats.map((format) => ({ format, delivery: deliveryOf(seed, format) }));
  const versions: ExperimentVersion[] = seed.versions.map((version, index, all) => ({
    label: version.label,
    liveFrom: version.at,
    liveUntil: all[index + 1]?.at ?? null,
    source: version.updateId
      ? { kind: 'correction-release', updateId: unsafeBrand(version.updateId) }
      : { kind: 'first-publication', submissionId: null, revision: null },
    catalogue: {
      name: seed.name,
      summary: seed.summary,
      description: seed.description ?? seed.summary,
    },
    formats,
    preview: seed.preview ?? null,
    documents: [],
  }));
  const first = versions[0]!;
  const live = versions.at(-1)!;
  const experiment: Experiment = {
    ...meta(first.liveFrom, live.liveFrom, versions.length),
    id: unsafeBrand(seed.id),
    courseId: unsafeBrand(seed.courseId),
    originSubmissionId: null,
    vendorOrganisation: seed.vendorOrganisation ?? '',
    artworkKey: seed.artwork,
    live,
    versions,
    learningOutcomes: outcomes,
    resources: seed.resources ?? [],
    publishedAt: first.liveFrom,
    publishedBy: KAVYA,
    openUpdateId: null,
  };
  book.put(
    'experiments',
    seed.id,
    experiment,
    note(seed.evidence, `${seed.name} — live ${live.label}`),
  );
}

/** Shell-and-Tube's resources (B3-01): opening one marks it "Opened" and nothing else (T-13). */
const SHELL_RESOURCES: readonly LearningResource[] = [
  {
    id: unsafeBrand('res-shell-brief'),
    title: 'Lab brief — Shell-and-Tube Heat Exchanger',
    kind: 'PDF document',
    sizeLabel: '6 pages',
    href: 'https://docs.example/shell-and-tube/lab-brief.pdf',
  },
  {
    id: unsafeBrand('res-shell-reading'),
    title: 'Pre-lab reading — the effectiveness–NTU method',
    kind: 'Web page',
    sizeLabel: 'About 10 minutes',
    href: 'https://docs.example/shell-and-tube/effectiveness-ntu',
  },
  {
    id: unsafeBrand('res-shell-sheet'),
    title: 'Readings sheet',
    kind: 'Spreadsheet',
    sizeLabel: '1 sheet',
    href: 'https://docs.example/shell-and-tube/readings-sheet',
  },
];

const EXPERIMENTS: readonly ExperimentSeed[] = [
  {
    id: EXPERIMENT.shellAndTube,
    courseId: COURSE.thermo,
    name: 'Shell-and-Tube Heat Exchanger',
    summary:
      'Vary flow rates and inlet temperatures across a two-pass exchanger, then derive the effectiveness–NTU relationship from your own readings.',
    formats: ['web', 'ar', 'vr'],
    artwork: 'thermal-crop',
    outcomes: [
      'Determine log mean temperature difference from measured inlet and outlet conditions',
      'Compare countercurrent and cocurrent arrangements at matched duty',
    ],
    delivery: {
      vr: { installNotes: 'Open the Shell-and-Tube Heat Exchanger app on the headset.' },
    },
    versions: [{ label: '1.0', at: LIVE_SINCE }],
    resources: SHELL_RESOURCES,
    evidence: 'B1-05; B3-01; B3-04; B7-06 e1',
  },
  {
    id: EXPERIMENT.finTube,
    courseId: COURSE.thermo,
    name: 'Fin-Tube Bundle',
    summary:
      'Introduce progressive fouling on the tube side and measure its effect on the overall heat transfer coefficient.',
    formats: ['web', 'vr'],
    artwork: 'bundle',
    outcomes: [
      'Quantify the effect of fouling on the overall heat transfer coefficient',
      'Distinguish degradation from measurement drift',
    ],
    vendorOrganisation: 'Northline Simulation Studio',
    webLink: 'https://labs.northline.example/fin-tube-bundle',
    versions: [{ label: '1.0', at: ist('2026-07-30 10:00') }],
    evidence: 'B7-06 e2; B5-02 SUB-0052',
  },
  {
    id: EXPERIMENT.compositeWall,
    courseId: COURSE.thermo,
    name: 'Composite Wall Conduction',
    summary:
      'Build a layered wall, measure the temperature profile and separate the contribution of each material.',
    formats: ['web', 'ar'],
    artwork: 'materials',
    outcomes: [
      'Measure a steady-state temperature profile across layers',
      'Separate the thermal resistance of each material',
    ],
    versions: [{ label: '1.0', at: LIVE_SINCE }],
    evidence: 'B7-06 e3; Appendix C §4.1 (BC11: a separate record from SUB-0077)',
  },
  {
    id: EXPERIMENT.cnc,
    courseId: COURSE.manufacturing,
    name: 'CNC Turning Centre',
    summary:
      'Work through workholding, tool registration and offset entry, then cut a test part and inspect it against tolerance.',
    formats: ['web', 'ar', 'vr', 'mr'],
    artwork: 'machining',
    outcomes: [
      'Register tool offsets against a known datum',
      'Inspect a cut part against a dimensional tolerance',
    ],
    versions: [{ label: '1.0', at: LIVE_SINCE }],
    evidence: 'B7-06 e4',
  },
  {
    id: EXPERIMENT.casting,
    courseId: COURSE.manufacturing,
    name: 'Investment Casting',
    summary:
      'Sequence the shell build, dewax and burnout steps, and judge the effect of each on surface finish.',
    formats: ['web'],
    artwork: 'casting',
    outcomes: [
      'Sequence shell build, dewax and burnout correctly',
      'Relate each step to the resulting surface finish',
    ],
    versions: [{ label: '1.0', at: LIVE_SINCE }],
    evidence: 'B7-06 e5',
  },
  {
    id: EXPERIMENT.induction,
    courseId: COURSE.machines,
    name: 'Induction Motor Loading',
    summary:
      'Load the machine through its full range and plot torque, slip and efficiency from instrument readings you take yourself.',
    formats: ['web', 'vr', 'mr'],
    artwork: 'motor-crop',
    outcomes: [
      'Plot torque, slip and efficiency from your own readings',
      'Identify the operating point of maximum efficiency',
    ],
    versions: [{ label: '1.0', at: ist('2026-06-09 10:00') }],
    evidence: 'B7-06 e6',
  },
  {
    id: EXPERIMENT.synchronous,
    courseId: COURSE.machines,
    name: 'Synchronous Generator',
    summary:
      'Synchronise to an infinite bus, then adjust excitation and prime-mover torque to see how real and reactive power divide.',
    formats: ['web', 'vr'],
    artwork: 'syncgen',
    outcomes: [
      'Synchronise a generator to an infinite bus safely',
      'Separate the effect of excitation from prime-mover torque',
    ],
    versions: [{ label: '1.0', at: LIVE_SINCE }],
    evidence: 'B7-06 e7',
  },
  {
    id: EXPERIMENT.transformer,
    courseId: COURSE.machines,
    name: 'Transformer Tests',
    summary:
      'Run open and short circuit tests, separate core and copper losses and build the equivalent circuit from your measurements.',
    formats: ['web'],
    artwork: 'coil',
    outcomes: [
      'Separate core losses from copper losses',
      'Build an equivalent circuit from measured data',
    ],
    versions: [{ label: '1.0', at: LIVE_SINCE }],
    evidence: 'B7-06 e8',
  },
  {
    id: EXPERIMENT.buck,
    courseId: COURSE.power,
    name: 'Buck Converter Ripple',
    summary:
      'Sweep duty cycle and load, observe inductor current ripple and compare against the continuous-conduction prediction.',
    formats: ['web', 'ar'],
    artwork: 'switching',
    outcomes: [
      'Relate duty cycle to output voltage',
      'Identify the boundary of continuous conduction',
    ],
    versions: [{ label: '1.0', at: LIVE_SINCE }],
    evidence: 'B7-06 e9',
  },
  {
    id: EXPERIMENT.distillation,
    courseId: COURSE.process,
    name: 'Distillation Column',
    summary:
      'Bring a binary column from cold start to steady state, tuning reflux ratio against overhead purity under realistic lag.',
    description:
      'Learners start a binary column from cold and bring it to steady state. They then change the reflux ratio and watch the overhead purity respond with realistic lag. Lowering the reflux ratio raises the overhead purity, at the cost of more reboiler heat.',
    formats: ['web', 'vr'],
    artwork: 'process-crop',
    outcomes: [
      'Bring a column to steady state from cold start',
      'Tune reflux ratio against an overhead purity target',
    ],
    vendorOrganisation: 'Meridian Virtual Labs',
    webLink: 'https://labs.meridian.example/distillation-column',
    delivery: {
      vr: {
        packageLabel: 'Distillation Column — VR build 1.2',
        packageReference: 'MVL-DC-VR-1.2',
        deviceNeeded: 'Standalone VR headset and about 2 × 2 m of clear floor',
        installNotes: 'Install the build named above and open “Column Lab”.',
      },
    },
    versions: [
      { label: '1.0', at: LIVE_SINCE },
      { label: '1.1', at: ist('2026-06-19 10:00'), updateId: 'UPD-0001' },
      { label: '1.2', at: ist('2026-07-03 10:00'), updateId: 'UPD-0002' },
    ],
    evidence: 'B6-08; B6-09 live 1.2; B7-06 e10 history',
  },
  {
    id: EXPERIMENT.boiler,
    courseId: COURSE.process,
    name: 'Boiler Drum Level',
    summary:
      'Tune a cascade loop against shrink and swell, then test it with a step change in steam demand.',
    formats: ['web', 'vr'],
    artwork: 'drum',
    outcomes: [
      'Tune a cascade loop against shrink and swell',
      'Test loop performance with a step disturbance',
    ],
    versions: [{ label: '2.0', at: ist('2026-06-18 10:00') }],
    evidence: 'B7-06 e11',
  },
  {
    id: EXPERIMENT.orifice,
    courseId: COURSE.process,
    name: 'Orifice Plate Metering',
    summary:
      'Calibrate against a reference meter and propagate instrument uncertainty into the reported flow.',
    formats: ['web', 'ar'],
    artwork: 'orifice',
    outcomes: [
      'Calibrate against a reference meter',
      'Propagate instrument uncertainty into a reported flow',
    ],
    versions: [
      { label: '1.0', at: LIVE_SINCE },
      { label: '1.1', at: ist('2026-08-05 10:00'), updateId: 'UPD-0003' },
    ],
    evidence: 'B7-06 e12; B7-05 UPD-0003 1.0 → 1.1',
  },
];

export function addCatalogue(book: SeedBook): void {
  addAreas(book);
  addCourses(book);
  for (const seed of EXPERIMENTS) addExperiment(book, seed);
}
