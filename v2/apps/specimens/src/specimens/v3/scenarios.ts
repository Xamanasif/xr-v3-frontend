/**
 * Specimen scenarios for the V3 foundation (XR-V3-RB-1.0; ADR-0010). The words and figures are the
 * illustrative sample records the frozen V3 boards draw (design/v3-refined-b: SA01, SA02, IA01,
 * IA02), each named by the board's own scenario and "as of" date. They are harness fixtures for
 * rendering and behaviour checks of the shared V3 components only — never application data, a
 * service contract or a decision rule. The product binds its own read models and commands.
 */
import type { FormatCode } from '@xr/ui';
import type { FormatState, StatusTone, V3IconName } from '@xr/ui/v3';

export interface SpecimenRequestRow {
  readonly key: string;
  readonly institution: string;
  readonly contact: string;
  /** One experiment's title, or "3 experiments". */
  readonly experiments: string;
  readonly formats: readonly FormatCode[];
  readonly type: 'New access' | 'Additional licences' | 'Renewal';
  readonly route: 'Internal' | 'External' | 'Not set yet';
  readonly received: string;
  /** Sortable day (ISO), the board's `iso`. */
  readonly day: string;
  readonly status: 'review' | 'info' | 'pay' | 'pend' | 'active';
  readonly href: string;
}

export const REQUEST_STATUS: Readonly<
  Record<SpecimenRequestRow['status'], { readonly words: string; readonly tone: StatusTone }>
> = {
  review: { words: 'Under review', tone: 'info' },
  info: { words: 'Information requested', tone: 'err' },
  pay: { words: 'Approved — payment required', tone: 'warn' },
  pend: { words: 'Payment not confirmed', tone: 'warn' },
  active: { words: 'Access active', tone: 'ok' },
};

/** SA02 scenario `oct23` ("Friday 23 October 2026"): the eight requests of the list. */
export const SA02_OCT23 = {
  scenarioId: 'SA02-oct23',
  asOf: 'Friday 23 October 2026',
  rows: [
    {
      key: 'g58',
      institution: 'Godavari Institute of Technology',
      contact: 'Meera Iyer',
      experiments: 'Shell-and-Tube Heat Exchanger',
      formats: ['WEB', 'VR'],
      type: 'Additional licences',
      route: 'External',
      received: '21 Oct 2026',
      day: '2026-10-21',
      status: 'review',
      href: '#',
    },
    {
      key: 'gdv',
      institution: 'Godavari Institute of Technology',
      contact: 'Meera Iyer',
      experiments: 'Shell-and-Tube Heat Exchanger',
      formats: ['WEB', 'VR'],
      type: 'New access',
      route: 'External',
      received: '2 Oct 2026',
      day: '2026-10-02',
      status: 'active',
      href: '/v3-sa-03',
    },
    {
      key: 'kri',
      institution: 'Krishna College of Engineering',
      contact: 'S. Pillai',
      experiments: '3 experiments',
      formats: [],
      type: 'New access',
      route: 'Not set yet',
      received: '30 Sep 2026',
      day: '2026-09-30',
      status: 'info',
      href: '#',
    },
    {
      key: 'kon',
      institution: 'Konark Polytechnic',
      contact: 'R. Bhatt',
      experiments: 'Buck Converter Ripple',
      formats: ['WEB', 'AR'],
      type: 'Additional licences',
      route: 'External',
      received: '29 Sep 2026',
      day: '2026-09-29',
      status: 'review',
      href: '/v3-sa-03-paused',
    },
    {
      key: 'bhn',
      institution: 'BITS Pilani — Hyderabad Campus',
      contact: 'A. Menon',
      experiments: '2 experiments',
      formats: [],
      type: 'New access',
      route: 'Internal',
      received: '26 Sep 2026',
      day: '2026-09-26',
      status: 'active',
      href: '#',
    },
    {
      key: 'ren',
      institution: 'BITS Pilani — Hyderabad Campus',
      contact: 'A. Menon',
      experiments: '3 experiments',
      formats: [],
      type: 'Renewal',
      route: 'Internal',
      received: '24 Sep 2026',
      day: '2026-09-24',
      status: 'review',
      href: '/v3-sa-03-renewal',
    },
    {
      key: 'viz',
      institution: 'Vizag Polytechnic',
      contact: 'K. Rao',
      experiments: 'Distillation Column',
      formats: ['WEB', 'VR'],
      type: 'New access',
      route: 'External',
      received: '22 Sep 2026',
      day: '2026-09-22',
      status: 'pay',
      href: '/v3-sa-03-decided',
    },
    {
      key: 'sah',
      institution: 'Sahyadri Institute of Engineering',
      contact: 'N. Joshi',
      experiments: 'CNC Turning Centre',
      formats: ['MR'],
      type: 'Additional licences',
      route: 'External',
      received: '18 Sep 2026',
      day: '2026-09-18',
      status: 'pend',
      href: '#',
    },
  ] satisfies readonly SpecimenRequestRow[],
} as const;

export interface SpecimenQueueRow {
  readonly key: string;
  readonly title: string;
  readonly description: string;
  readonly big: string;
  readonly small: string;
  readonly due?: boolean;
  readonly action: string;
  readonly accessibleName?: string;
  readonly href?: string;
}

export interface SpecimenQueueGroup {
  readonly key: string;
  readonly name: string;
  readonly link: string;
  readonly href: string;
  readonly icon: V3IconName;
  readonly rows: readonly SpecimenQueueRow[];
}

/** SA01 (`asOf` "Friday 23 October 2026"): the groups of the waiting queue, as the board lists them. */
export const SA01_GROUPS: Readonly<Record<string, SpecimenQueueGroup>> = {
  req: {
    key: 'req',
    name: 'Requests',
    link: 'Open Requests',
    href: '/v3-sa-02',
    icon: 'inbox',
    rows: [
      {
        key: 'ren',
        title: 'BITS Pilani — Hyderabad Campus asks to renew its access',
        description:
          'Same 3 experiments and 860 licences for the next academic year. Access ends on 31 October.',
        big: '29 days',
        small: 'since 24 Sep',
        action: 'Open request',
        accessibleName: 'Open the renewal request from BITS Pilani — Hyderabad Campus',
        href: '/v3-sa-03-renewal',
      },
      {
        key: 'kon',
        title: 'Konark Polytechnic asks for 60 more licences',
        description: 'Additional licences for Buck Converter Ripple.',
        big: '24 days',
        small: 'since 29 Sep',
        action: 'Open request',
        accessibleName: 'Open the additional licences request from Konark Polytechnic',
        href: '/v3-sa-03-paused',
      },
      {
        key: 'g58',
        title: 'Godavari Institute of Technology asks for 60 more licences',
        description: 'Its access has been active since 8 October.',
        big: '2 days',
        small: 'since 21 Oct',
        action: 'Open request',
        accessibleName:
          'Open the additional licences request from Godavari Institute of Technology',
      },
    ],
  },
  upd: {
    key: 'upd',
    name: 'Corrections waiting for your release decision',
    link: 'Open Updates',
    href: '#',
    icon: 'edit',
    rows: [
      {
        key: 'dc',
        title: 'Distillation Column correction, version 1.2 to 1.3',
        description: 'Approved by the Academic Reviewer on 27 August. Version 1.2 is still live.',
        big: '57 days',
        small: 'since 27 Aug',
        action: 'Review correction',
        accessibleName: 'Review the Distillation Column correction',
      },
    ],
  },
  dtr: {
    key: 'dtr',
    name: 'Device transfers',
    link: 'Open Device transfers',
    href: '#',
    icon: 'headset',
    rows: [
      {
        key: 'neha',
        title: 'VR device transfer for Neha Kulkarni',
        description: 'BITS Pilani — Hyderabad Campus. Forwarded by its Institute Admin.',
        big: '2 days',
        small: 'since 21 Oct',
        action: 'Review transfer',
        accessibleName: 'Review the VR device transfer for Neha Kulkarni',
      },
      {
        key: 'rahul',
        title: 'VR device transfer for Rahul Verma',
        description: 'Godavari Institute of Technology. Forwarded by its Institute Admin.',
        big: 'Today',
        small: '23 Oct',
        action: 'Review transfer',
        accessibleName: 'Review the VR device transfer for Rahul Verma',
      },
    ],
  },
  sup: {
    key: 'sup',
    name: 'Support reports',
    link: 'Open Support',
    href: '#',
    icon: 'lifebuoy',
    rows: [
      {
        key: 'usage',
        title: 'Usage page took a long time to load',
        description: 'Meera Iyer, Institute Admin',
        big: '23 days',
        small: 'sent 30 Sep',
        action: 'Open report',
        accessibleName: 'Open the report: Usage page took a long time to load',
      },
      {
        key: 'vr',
        title: 'VR simulation stopped loading at step 2',
        description: 'Rahul Verma, Student',
        big: '20 days',
        small: 'sent 3 Oct',
        action: 'Open report',
        accessibleName: 'Open the report: VR simulation stopped loading at step 2',
      },
      {
        key: 'frame',
        title: 'Delivery link preview showed an empty frame',
        description: 'Kavya Nair, Content Manager',
        big: '17 days',
        small: 'reopened 6 Oct',
        action: 'Open report',
        accessibleName: 'Open the report: Delivery link preview showed an empty frame',
      },
      {
        key: 'import',
        title: 'Student import stopped part-way',
        description: 'Meera Iyer, Institute Admin',
        big: '17 days',
        small: 'reopened 6 Oct',
        action: 'Open report',
        accessibleName: 'Open the report: Student import stopped part-way',
      },
    ],
  },
  end: {
    key: 'end',
    name: 'Access ending within 15 days',
    link: 'Open Access ending',
    href: '#',
    icon: 'calendar',
    rows: [
      {
        key: 'bits',
        title: 'BITS Pilani — Hyderabad Campus',
        description: 'Access ends on 31 October. Renewal in progress.',
        big: 'In 8 days',
        small: '31 Oct',
        due: true,
        action: 'Open renewal request',
        accessibleName: 'Open the renewal request from BITS Pilani — Hyderabad Campus',
        href: '/v3-sa-03-renewal',
      },
      {
        key: 'konark',
        title: 'Konark Polytechnic',
        description: 'Access ends on 2 November. Reminder due; nothing is sent from here.',
        big: 'In 10 days',
        small: '2 Nov',
        due: true,
        action: 'View access ending',
        accessibleName: 'View access ending for Konark Polytechnic',
      },
    ],
  },
  noia: {
    key: 'noia',
    name: 'Institutions without an Institute Admin',
    link: 'Open Institutions',
    href: '#',
    icon: 'userMinus',
    rows: [
      {
        key: 'sahyadri',
        title: 'Sahyadri Institute of Engineering has no Institute Admin',
        description: 'Access active since 30 September. Nobody there can give students access.',
        big: '23 days',
        small: 'since 30 Sep',
        action: 'Assign Institute Admin',
        accessibleName: 'Assign an Institute Admin to Sahyadri Institute of Engineering',
      },
    ],
  },
  stuck: {
    key: 'stuck',
    name: 'Stuck content',
    link: 'Open All content',
    href: '#',
    icon: 'hourglass',
    rows: [
      {
        key: 'dcm',
        title: 'DC Motor Speed Control is stuck in review',
        description:
          'EEE ZC341. With the Academic Reviewer since 2 October; no reviewer has this course in scope.',
        big: '21 days',
        small: 'since 2 Oct',
        action: 'Open in All content',
        accessibleName: 'Open DC Motor Speed Control in All content',
      },
    ],
  },
  scope: {
    key: 'scope',
    name: 'Role holders without scope',
    link: 'Open Platform roles',
    href: '#',
    icon: 'userQuestion',
    rows: [
      {
        key: 'iyer',
        title: 'Dr K. Iyer has no scope yet',
        description: 'Academic Reviewer, registered 20 October. Can’t act on anything yet.',
        big: '3 days',
        small: 'since 20 Oct',
        action: 'Assign scope',
        accessibleName: 'Assign scope to Dr K. Iyer',
      },
    ],
  },
};

/** SA01's categories: which groups each shows. */
export const SA01_CATEGORIES = [
  { key: 'all', label: 'All', groups: ['req', 'dtr', 'sup', 'noia', 'stuck', 'scope'] },
  { key: 'req', label: 'Requests', groups: ['req'] },
  { key: 'upd', label: 'Corrections', groups: ['upd'] },
  { key: 'dtr', label: 'Device transfers', groups: ['dtr'] },
  { key: 'sup', label: 'Support', groups: ['sup'] },
  { key: 'end', label: 'Access ending', groups: ['end'] },
  { key: 'setup', label: 'Set-up gaps', groups: ['noia', 'stuck', 'scope'] },
] as const;

export interface SpecimenFormatCell {
  readonly format: FormatCode;
  readonly state: FormatState;
}

/** IA02 scenarios (`scenario` prop): date, plan status, term and the given count. */
export const IA02_SCENARIOS = {
  ending: {
    asOf: 'Wednesday 22 September 2027',
    plan: 'ending',
    given: 1,
    own: 'MEC-523',
    term: {
      elapsed: 0.9588,
      remaining: '15 days left',
      tone: 'due',
      rest: true,
      today: true,
      description:
        'Access term from 8 October 2026 to 7 October 2027. 349 of 364 days have passed; 15 days are left.',
    },
  },
  active: {
    asOf: 'Monday 15 February 2027',
    plan: 'active',
    given: 1,
    own: 'MEC-523',
    term: {
      elapsed: 0.3571,
      remaining: '234 days left',
      tone: 'calm',
      rest: false,
      today: true,
      description:
        'Access term from 8 October 2026 to 7 October 2027. 130 of 364 days have passed; 234 days are left.',
    },
  },
  activated: {
    asOf: 'Thursday 8 October 2026',
    plan: 'active',
    given: 0,
    own: '',
    term: {
      elapsed: 0,
      remaining: '364 days left',
      tone: 'calm',
      rest: false,
      today: true,
      description:
        'Access term from 8 October 2026 to 7 October 2027. The term starts today; 364 days are left.',
    },
  },
  paused: {
    asOf: 'Tuesday 2 March 2027',
    plan: 'paused',
    given: 1,
    own: 'MEC-523',
    term: {
      elapsed: 0,
      remaining: 'Paused by BITS on 2 Mar 2027',
      tone: 'paused',
      rest: false,
      today: false,
      description:
        'Access term from 8 October 2026 to 7 October 2027. Paused by BITS on 2 March 2027.',
    },
  },
  ended: {
    asOf: 'Friday 8 October 2027',
    plan: 'ended',
    given: 1,
    own: 'MEC-523',
    term: {
      elapsed: 1,
      remaining: 'Ended on 7 Oct 2027',
      tone: 'calm',
      rest: false,
      today: false,
      description:
        'Access term from 8 October 2026 to 7 October 2027. The term ended on 7 October 2027.',
    },
  },
} as const;

export type IaPlanScenario = keyof typeof IA02_SCENARIOS;

export const IA_PLAN_STATUS: Readonly<
  Record<
    'active' | 'ending' | 'ended' | 'paused',
    { readonly tone: StatusTone; readonly words: string }
  >
> = {
  active: { tone: 'ok', words: 'Active' },
  ending: { tone: 'warn', words: 'Ending soon' },
  ended: { tone: 'ended', words: 'Ended' },
  paused: { tone: 'paused', words: 'Paused' },
};

/** The one experiment of plan ACC-0107 (IA02 `EXPS`). */
export const IA02_EXPERIMENT = {
  id: 'ste',
  title: 'Shell-and-Tube Heat Exchanger',
  code: 'ME ZG523',
  course: 'Thermodynamics & Heat Transfer',
  formats: [
    { format: 'WEB', state: 'on', name: 'Browser' },
    { format: 'AR', state: 'pub', name: 'Augmented reality' },
    { format: 'VR', state: 'on', name: 'Virtual reality' },
    { format: 'MR', state: 'none', name: 'Mixed reality' },
  ] satisfies readonly (SpecimenFormatCell & { readonly name: string })[],
} as const;

export const IN_PLAN_WORDS: Readonly<Record<FormatState, string>> = {
  on: 'In your plan',
  pub: 'Published, not in your plan',
  none: 'Not published',
};
