import type { Specimen } from '../types';
import { B02TypeIcons } from './b02-type-icons';
import { B03Actions } from './b03-actions';
import { B03Components } from './b03-components';
import { B04StatusFormat } from './b04-status-format';
import { B06NestedTabs, B11PeopleTabs } from './b06-nested-tabs';
import {
  B07FacultyDetail,
  B07InstituteAdminReports,
  B07Sending,
  B08InContext,
  B08MessageFamily,
  B404ErrorSummary,
} from './b07-b08-messages';
import { B10Dialog, type DialogState } from './b10-dialogs';
import { B12SkipLink } from './b12-skip-link';
import { ParityShell } from './shells';
import { ROLE_FIXTURES, type RoleSlug } from '../components/role-shell-fixtures';

const DIALOG_STATES: readonly DialogState[] = [
  'dl1-default',
  'dl1-destructive',
  'dl2-validation',
  'dl2-busy',
  'dl3-default',
  'dl3-validation',
  'phone',
];

/** `p-10-<state>`: one open dialog per page (board 10 "States" and "Keyboard path and phone layout"). */
const DIALOG_SPECIMENS: Record<string, Specimen> = Object.fromEntries(
  DIALOG_STATES.map((state) => [
    `p-10-${state}`,
    {
      title: `Parity: board 10 dialog, ${state}`,
      source: '10 "States · focus, validation, busy"; "Keyboard path and phone layout"',
      render: () => (
        <div className="xr-app">
          <B10Dialog state={state} />
        </div>
      ),
    },
  ]),
);

const SLUGS = Object.keys(ROLE_FIXTURES) as RoleSlug[];
const BANNERS = [null, 'paused', 'inactive'] as const;

/** `p-shell-<role>-<none|paused|inactive>` (boards 05, 06, 11) and `p-shell-<role>-help` (board 05). */
const SHELL_SPECIMENS: Record<string, Specimen> = Object.fromEntries([
  ...SLUGS.flatMap((slug) =>
    BANNERS.map((banner) => [
      `p-shell-${slug}-${banner ?? 'none'}`,
      {
        title: `Parity: ${ROLE_FIXTURES[slug].workspace} shell, banner ${banner ?? 'none'}`,
        source: '05 (canvas props role × banner); 06 "The seven sidebars"; 11',
        render: () => (
          <ParityShell slug={slug} banner={banner} page="destination" device={slug === 'student'} />
        ),
      },
    ]),
  ),
  ...SLUGS.map((slug) => [
    `p-shell-${slug}-help`,
    {
      title: `Parity: ${ROLE_FIXTURES[slug].workspace} shell on Help (board 05 Help state)`,
      source: '05 (Help in the sidebar)',
      render: () => <ParityShell slug={slug} banner={null} page="help" />,
    },
  ]),
  /* Board 11 "Responsive proof": the frames' shells (the page areas are later-phase screens). */
  [
    'p-11-institute-admin-people-students',
    {
      title: 'Parity: board 11 Institute Admin › People › Students shell',
      source: '11 "1440 · Institute Admin · People › Students"; "768 · …"; "375 · AR-2 list"',
      render: () => (
        <ParityShell
          slug="institute-admin"
          banner={null}
          page="destination"
          current={3}
          title="People"
          trail={['People']}
          crumb="Students"
        />
      ),
    },
  ],
  [
    'p-11-institute-admin-people',
    {
      title: 'Parity: board 11 Institute Admin › People shell (no crumbs)',
      source: '11 "768 · Institute Admin · People › Students"; "375 · AR-2 list"',
      render: () => (
        <ParityShell
          slug="institute-admin"
          banner={null}
          page="destination"
          current={3}
          title="People"
          crumb=""
        />
      ),
    },
  ],
  [
    'p-11-super-admin-req-0042',
    {
      title: 'Parity: board 11 Super Admin › Requests › REQ-0042 shell',
      source: '11 "1024 · Super Admin · Request decision"; "375 · AR-4 decision"',
      render: () => (
        <ParityShell
          slug="super-admin"
          banner={null}
          page="destination"
          current={1}
          title="REQ-0042"
          trail={['Requests']}
          crumb="REQ-0042"
        />
      ),
    },
  ],
  [
    'p-11-super-admin-req-0042-mobile',
    {
      title: 'Parity: board 11 Super Admin › REQ-0042 shell at 375 (no parent crumb)',
      source: '11 "375 · AR-4 decision"',
      render: () => (
        <ParityShell
          slug="super-admin"
          banner={null}
          page="destination"
          current={1}
          title="REQ-0042"
          crumb=""
        />
      ),
    },
  ],
  [
    'p-11-student-home',
    {
      title: 'Parity: board 11 Student › Home shell (My device)',
      source: '11 "375 · Drawer open"; "375 · Account menu"',
      render: () => (
        <ParityShell
          slug="student"
          banner={null}
          page="destination"
          current={0}
          title="Home"
          crumb="Home"
          device
        />
      ),
    },
  ],
  [
    'p-shell-institute-admin-people',
    {
      title: 'Parity: Institute Admin shell, People current (board 06 rail)',
      source: '06 "Rail · Institute Admin · tooltip on hover and focus"',
      render: () => (
        <ParityShell slug="institute-admin" banner={null} page="destination" current={3} />
      ),
    },
  ],
]);

/**
 * Parity specimens (WP-0.15): product components arranged one per item, with the words of the
 * Batch-0 board specimen they are compared with. Ids are prefixed `p-`.
 */
export const PARITY_SPECIMENS: Readonly<Record<string, Specimen>> = {
  ...SHELL_SPECIMENS,
  ...DIALOG_SPECIMENS,
  'p-07-sending': {
    title: 'Parity: board 07 "State 1b · Sending" (HelpReportForm sending)',
    source: '07 "State 1b · Sending"',
    render: () => <B07Sending />,
  },
  'p-07-institute-admin-reports': {
    title: 'Parity: board 07 "State 2 · My reports" (Institute Admin, three reports)',
    source: '07 "State 2 · My reports · open / reopened / resolved · Institute Admin"',
    render: () => <B07InstituteAdminReports />,
  },
  'p-07-faculty-detail': {
    title: 'Parity: board 07 "State 3 · Report detail · resolved with note · Faculty"',
    source: '07 "State 3 · Report detail · resolved with note · Faculty"',
    render: () => <B07FacultyDetail />,
  },
  'p-08-message-family': {
    title: 'Parity: board 08 message family (MessagePage)',
    source: '08 "The family · same template, different words"',
    render: () => <B08MessageFamily />,
  },
  'p-08-in-context': {
    title: 'Parity: board 08 "In context · Student workspace · 1312 px"',
    source: '08 "In context · Student workspace · 1312 px"',
    render: () => <B08InContext />,
  },
  'p-b4-04-error-summary': {
    title: 'Parity: B4-04 "Step 2 · validation" ErrorSummary (xw-errsum, VD-22 baseline)',
    source: 'B4-04 f3 "Step 2 · validation"',
    render: () => <B404ErrorSummary />,
  },
  'p-12-skip-link': {
    title: 'Parity: board 12 skip link on keyboard focus',
    source: '12 "Keyboard and focus · Shell tab order"',
    render: () => <B12SkipLink />,
  },
  'p-11-people-tabs': {
    title: 'Parity: board 11 People section tabs at 375, each current',
    source: '11 "Section tabs at 375 px · each People tab as the current one"',
    render: () => <B11PeopleTabs />,
  },
  'p-06-nested-tabs': {
    title: 'Parity: board 06 nested destinations (SectionTabs)',
    source: '06 "Nested destinations · section tabs, not a second sidebar level"',
    render: () => <B06NestedTabs />,
  },
  'p-02-type-icons': {
    title: 'Parity: board 02 type scale, links, navy focus, icons',
    source: '02 "Type scale", "Links and focus", "Icon sizing and working icon set"',
    render: () => <B02TypeIcons />,
  },
  'p-03-actions': {
    title: 'Parity: board 03 Actions (Button)',
    source: '03 "Actions"',
    render: () => <B03Actions />,
  },
  'p-03-components': {
    title:
      'Parity: board 03 form controls, toolbar, tabs, header, rows, notices, stepper, timeline, decision panel, account menu',
    source: '03 (every section after "Actions")',
    render: () => <B03Components />,
  },
  'p-04-status-format': {
    title: 'Parity: board 04 status chips, format chips, state grammar, shell banners',
    source: '04 (all sections)',
    render: () => <B04StatusFormat />,
  },
};
