'use client';

import {
  AccountMenu,
  HelpReportDetail,
  HelpReportForm,
  HelpReportSent,
  HelpSupportHome,
  PageHeader,
  ShellBanner,
  Sidebar,
  TopBar,
  WorkspaceShell,
  type AccountMenuItem,
  type BreadcrumbLevel,
  type HelpReportDetailProps,
  type HelpReportSummary,
  type NavDestination,
  type PageWrap,
} from '@xr/ui';
import { useEffect, useState, type ReactNode } from 'react';

/**
 * Shell specimens (Appendix E §3.5: WorkspaceShell, Sidebar + NavItem, TopBar, HelpSupport
 * template). Each workspace frame is composed as boards 05, 06 and 07 draw it, with the boards'
 * sample people, destinations and reports; harness state stands in for the caller (WP-0.8 owns
 * the real role configuration, routes and data). `data-probe` attributes are harness read-outs,
 * not product copy. Nothing here is a product screen.
 */

/**
 * Harness only: marks the specimen once React has hydrated it, so the browser specs press keys
 * only when the handlers are attached (`[data-ready]`).
 */
function markReady(element: HTMLElement | null): void {
  element?.setAttribute('data-ready', 'true');
}

const GIT = 'Godavari Institute of Technology';

type Who = 'st' | 'fa' | 'ia' | 've' | 'cm';

interface Workspace {
  readonly workspace: string;
  readonly institution?: string;
  readonly person: string;
  readonly initials: string;
  readonly device?: boolean;
  readonly destinations: readonly NavDestination[];
}

/** Boards 05, 06 and 07: label, person, destinations (in board-06 order) and sample counts. */
const WORKSPACES: Readonly<Record<Who, Workspace>> = {
  st: {
    workspace: 'Student',
    institution: GIT,
    person: 'Rahul Verma',
    initials: 'RV',
    device: true,
    destinations: [
      { label: 'Home', href: '#home', icon: 'home' },
      { label: 'My courses', href: '#my-courses', icon: 'myCourses' },
      { label: 'Assessments', href: '#assessments', icon: 'assessments' },
      { label: 'Progress', href: '#progress', icon: 'progress' },
    ],
  },
  fa: {
    workspace: 'Faculty',
    institution: GIT,
    person: 'Dr S. Ranganathan',
    initials: 'SR',
    destinations: [
      { label: 'Overview', href: '#overview', icon: 'overview' },
      { label: 'My courses', href: '#my-courses', icon: 'myCourses' },
      { label: 'Assessments', href: '#assessments', icon: 'assessments' },
      { label: 'Question bank', href: '#question-bank', icon: 'questionBank' },
      {
        label: 'Marking',
        href: '#marking',
        icon: 'marking',
        count: { value: 12, label: '12 written answers to mark' },
      },
      { label: 'Students', href: '#students', icon: 'studentsPeople' },
    ],
  },
  ia: {
    workspace: 'Institute Admin',
    institution: GIT,
    person: 'Meera Iyer',
    initials: 'MI',
    destinations: [
      { label: 'Overview', href: '#overview', icon: 'overview' },
      { label: 'Content access', href: '#content-access', icon: 'contentAccess' },
      { label: 'Student access', href: '#student-access', icon: 'studentAccess' },
      { label: 'People', href: '#people', icon: 'studentsPeople' },
      {
        label: 'Requests',
        href: '#requests',
        icon: 'requests',
        count: { value: 2, label: '2 device requests to forward' },
      },
      { label: 'Usage', href: '#usage', icon: 'usage' },
    ],
  },
  ve: {
    workspace: 'Vendor',
    institution: 'Northline Simulation Studio',
    person: 'Anil Shetty',
    initials: 'AS',
    destinations: [
      { label: 'Overview', href: '#overview', icon: 'overview' },
      { label: 'My experiments', href: '#my-experiments', icon: 'myExperiments' },
    ],
  },
  cm: {
    workspace: 'Content Manager',
    person: 'Kavya Nair',
    initials: 'KN',
    destinations: [
      { label: 'Overview', href: '#overview', icon: 'overview' },
      {
        label: 'Ready to publish',
        href: '#ready-to-publish',
        icon: 'readyToPublish',
        count: { value: 2, label: '2 ready to publish' },
      },
      { label: 'Content library', href: '#content-library', icon: 'contentLibrary' },
      { label: 'Updates', href: '#updates', icon: 'updates' },
      { label: 'Course codes', href: '#course-codes', icon: 'courseCodes' },
    ],
  },
};

/** Board 06 "Account menu · same pattern in every workspace": My device* · Help · Sign out. */
function accountItems(device: boolean): readonly AccountMenuItem[] {
  return [
    ...(device
      ? [{ kind: 'link', label: 'My device', href: '#my-device', icon: 'myDevice' } as const]
      : []),
    { kind: 'link', label: 'Help', href: '#help', icon: 'help' },
    { kind: 'separator' },
    { kind: 'button', label: 'Sign out', icon: 'signOut', onSelect: () => undefined },
  ];
}

interface FrameProps {
  readonly who: Who;
  /** The current destination's label, or `help` on the Help pages. */
  readonly current: string;
  readonly title: string;
  readonly trail?: readonly BreadcrumbLevel[];
  readonly wrap: PageWrap;
  readonly banner?: ReactNode;
  readonly children?: ReactNode;
}

/** One workspace frame of boards 05 / 07: the shell, its sidebar, top bar and account menu. */
function WorkspaceFrame({ who, current, title, trail, wrap, banner, children }: FrameProps) {
  const role = WORKSPACES[who];
  return (
    <div data-probe="root" ref={markReady}>
      <WorkspaceShell
        wrap={wrap}
        banner={banner}
        sidebar={
          <Sidebar
            workspace={role.workspace}
            institution={role.institution}
            destinations={role.destinations.map((item) => ({
              ...item,
              current: item.label === current,
            }))}
            help={{ href: '#help', current: current === 'help' }}
          />
        }
        topBar={
          <TopBar
            title={title}
            trail={trail}
            account={
              <AccountMenu
                name={role.person}
                role={role.workspace}
                organisation={role.institution}
                initials={role.initials}
                items={accountItems(role.device ?? false)}
              />
            }
          />
        }
      >
        {children}
      </WorkspaceShell>
    </div>
  );
}

/** Board 05 "05 · GL-01 Workspace Shell", default role (Institute Admin) on its first destination. */
export function WorkspaceShellSpecimen() {
  return (
    <WorkspaceFrame who="ia" current="Overview" title="Overview" wrap="read">
      <PageHeader overline="Institute Admin" title="Overview" summary="What needs my attention?" />
      <a href="#main" data-probe="page-link">
        A link on the page
      </a>
      <div className="specimen-spacer" aria-hidden="true" />
    </WorkspaceFrame>
  );
}

/** Board 05 with the banner "Institution paused" (XS-08), in the Faculty workspace. */
export function WorkspaceShellBannerSpecimen() {
  return (
    <WorkspaceFrame
      who="fa"
      current="Overview"
      title="Overview"
      wrap="read"
      banner={<ShellBanner kind="paused" helpHref="#help" />}
    >
      <PageHeader overline="Faculty" title="Overview" summary="What needs my attention?" />
      <a href="#main" data-probe="page-link">
        A link on the page
      </a>
    </WorkspaceFrame>
  );
}

/**
 * Board 06 "The seven sidebars · full width (≥ 1280 px)" (Student; Super Admin with a count) and
 * "Rail · Institute Admin · tooltip on hover and focus": standalone sidebars, outside a shell.
 */
export function SidebarSpecimen() {
  return (
    <div className="xr-app" data-probe="root" ref={markReady}>
      <div className="xr-stack">
        <Sidebar
          workspace="Student"
          institution={GIT}
          destinations={WORKSPACES.st.destinations.map((item, index) => ({
            ...item,
            current: index === 0,
          }))}
          help={{ href: '#help' }}
        />
        <Sidebar
          workspace="Super Admin"
          destinations={[
            { label: 'Overview', href: '#overview', icon: 'overview', current: true },
            {
              label: 'Requests',
              href: '#requests',
              icon: 'requests',
              count: { value: 3, label: '3 requests under review' },
            },
            { label: 'Institutions', href: '#institutions', icon: 'institutions' },
            { label: 'Content', href: '#content', icon: 'content' },
            { label: 'Academic structure', href: '#structure', icon: 'academicStructure' },
            { label: 'Platform roles', href: '#roles', icon: 'platformRoles' },
            { label: 'Operations', href: '#operations', icon: 'operations' },
          ]}
          help={{ href: '#help' }}
        />
        <Sidebar
          workspace="Institute Admin"
          destinations={WORKSPACES.ia.destinations.map((item) => ({
            ...item,
            current: item.label === 'People',
          }))}
          help={{ href: '#help' }}
          rail
        />
      </div>
      <main className="xr-page" id="main">
        <h1 className="xr-h1">Seven workspaces, one sidebar system</h1>
      </main>
    </div>
  );
}

const HELP_TRAIL: readonly BreadcrumbLevel[] = [{ label: 'Help & support', href: '#help' }];

const OPEN = { tone: 'info', label: 'Open' } as const;
const REOPENED = { tone: 'info', label: 'Reopened', icon: 'retry' } as const;
const RESOLVED = { tone: 'ok', label: 'Resolved' } as const;

const IA_REPORTS: readonly HelpReportSummary[] = [
  {
    reference: 'SUP-0211',
    title: 'Student import stopped part-way',
    sub: 'sent 1 Oct · reopened 6 Oct',
    href: '#sup-0211',
    status: REOPENED,
  },
  {
    reference: 'SUP-0209',
    title: 'Usage page took a long time to load',
    sub: 'sent 30 Sep',
    href: '#sup-0209',
    status: OPEN,
  },
  {
    reference: 'SUP-0189',
    title: 'Group name didn’t save',
    sub: 'sent 15 Sep · resolved 18 Sep',
    href: '#sup-0189',
    status: RESOLVED,
  },
];

/** Board 07 "State 2 · My reports · open / reopened / resolved · Institute Admin". */
export function HelpHomeSpecimen() {
  return (
    <WorkspaceFrame who="ia" current="help" title="Help & support" wrap="read">
      <HelpSupportHome reportHref="#report" reports={IA_REPORTS} countText="3 reports" />
    </WorkspaceFrame>
  );
}

/** Board 07 "State 2a · My reports · empty · Vendor". */
export function HelpEmptySpecimen() {
  return (
    <WorkspaceFrame who="ve" current="help" title="Help & support" wrap="read">
      <HelpSupportHome reportHref="#report" reports={[]} />
    </WorkspaceFrame>
  );
}

/** How long the harness stays "Sending…" before it shows the confirmation. */
const SENDING_MS = 1500;

type Step = 'form' | 'sending' | 'sent';

/**
 * Board 07 "State 1 · Report a problem · Student" → "State 1a · Validation" → "State 1b ·
 * Sending" → "State 1c · Sent · reference". The harness validates as the caller would (nothing
 * in "What happened?") and finishes sending after a short wait.
 */
export function HelpReportSpecimen() {
  const [what, setWhat] = useState('');
  const [where, setWhere] = useState('Shell-and-Tube Heat Exchanger · VR');
  const [missing, setMissing] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [screenshot, setScreenshot] = useState('');

  useEffect(() => {
    if (step !== 'sending') return undefined;
    const timer = window.setTimeout(() => setStep('sent'), SENDING_MS);
    return () => window.clearTimeout(timer);
  }, [step]);

  if (step === 'sent') {
    return (
      <WorkspaceFrame who="st" current="help" title="Report sent" trail={HELP_TRAIL} wrap="none">
        <HelpReportSent reference="SUP-0213" reportsHref="#help" homeHref="#home" id="sent" />
      </WorkspaceFrame>
    );
  }
  return (
    <WorkspaceFrame who="st" current="help" title="Report a problem" trail={HELP_TRAIL} wrap="form">
      <HelpReportForm
        helpHref="#help"
        idPrefix="s1"
        what={what}
        onWhatChange={setWhat}
        where={where}
        onWhereChange={setWhere}
        onScreenshotChange={(files) => setScreenshot(files?.[0]?.name ?? '')}
        whatMissing={missing}
        sending={step === 'sending'}
        onSend={() => {
          const empty = what.trim() === '';
          setMissing(empty);
          if (!empty) setStep('sending');
        }}
      />
      <p
        className="xr-meta"
        data-probe="screenshot"
      >{`Screenshot chosen: ${screenshot || 'none'}`}</p>
    </WorkspaceFrame>
  );
}

/** "What you reported" (board 07 draws a canvas `dl.doc-kv`; KeyValueList is Phase 1). */
function Reported({
  what,
  where,
  shot,
}: {
  readonly what: string;
  readonly where: string;
  readonly shot: string;
}) {
  return (
    <div className="xr-stack">
      {[
        ['What happened', what],
        ['Where', where],
        ['Screenshot', shot],
      ].map(([label, value]) => (
        <div key={label}>
          <p className="xr-meta">{label}</p>
          <p className="xr-body">{value}</p>
        </div>
      ))}
    </div>
  );
}

/** "History", newest first, in the v46 timeline markup board 07 draws. */
function History({ entries }: { readonly entries: readonly (readonly [string, string])[] }) {
  return (
    <ol className="xr-timeline">
      {entries.map(([what, when], index) => (
        <li key={`${what}-${when}`} className={index === 0 ? 'xr-tl is-latest' : 'xr-tl'}>
          <span className="xr-tl-dot" aria-hidden="true" />
          <div>
            <p className="xr-tl-what">{what}</p>
            <p className="xr-tl-when">{when}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

const RESOLVED_DETAIL: HelpReportDetailProps = {
  helpHref: '#help',
  reportHref: '#report',
  reference: 'SUP-0198',
  title: 'Lab brief link opened a blank page',
  status: RESOLVED,
  sent: '21 Sep',
  resolution: {
    date: '23 Sep',
    note: '“The lab brief link was updated. It now opens the brief in a new tab.”',
  },
  reported: (
    <Reported
      what="The lab brief link on the Resources tab opened a blank page."
      where="ME ZG523 · Shell-and-Tube Heat Exchanger · Resources"
      shot="blank-page.png"
    />
  ),
  history: (
    <History
      entries={[
        ['Resolved', '23 Sep · resolution note added'],
        ['Sent', '21 Sep'],
      ]}
    />
  ),
  idPrefix: 's7',
};

/** Board 07 "State 3 · Report detail · resolved with note · Faculty". */
export function HelpDetailSpecimen() {
  return (
    <WorkspaceFrame who="fa" current="help" title="SUP-0198" trail={HELP_TRAIL} wrap="read">
      <HelpReportDetail {...RESOLVED_DETAIL} />
    </WorkspaceFrame>
  );
}

/** Board 07 "State 3a · Report detail · reopened · Content Manager". */
export function HelpDetailReopenedSpecimen() {
  return (
    <WorkspaceFrame who="cm" current="help" title="SUP-0207" trail={HELP_TRAIL} wrap="read">
      <HelpReportDetail
        {...RESOLVED_DETAIL}
        reference="SUP-0207"
        title="Delivery link preview showed an empty frame"
        status={REOPENED}
        sent="28 Sep"
        resolution={undefined}
        reopened={{ date: '6 Oct' }}
        reported={
          <Reported
            what="The preview of the WEB delivery link showed an empty frame."
            where="Content library · Forced Convection"
            shot="No screenshot added"
          />
        }
        history={
          <History
            entries={[
              ['Reopened', '6 Oct'],
              ['Resolved', '30 Sep · “The preview now loads. Please try again.”'],
              ['Sent', '28 Sep'],
            ]}
          />
        }
        idPrefix="s8"
      />
    </WorkspaceFrame>
  );
}
