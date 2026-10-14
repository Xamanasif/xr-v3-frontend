'use client';

import {
  AccountMenu,
  AttentionItem,
  AttentionList,
  BackLink,
  Button,
  Checkbox,
  CheckboxGroup,
  ChoiceCard,
  ChoiceList,
  DataTable,
  DecisionPanel,
  EmptyState,
  FailedState,
  Field,
  FileInput,
  FormatSet,
  IdChip,
  Link,
  ListToolbar,
  Notice,
  PageHeader,
  Radio,
  RadioGroup,
  ReadOnlyValue,
  RecordHubTabs,
  SectionTabs,
  SegmentedControl,
  Select,
  StatusPill,
  Stepper,
  Textarea,
  TextInput,
  Timeline,
  VisuallyHidden,
  type DataTableColumn,
  type DataTablePrimaryColumn,
} from '@xr/ui';
import type { ReactNode } from 'react';

import { ParityItem, ParityPage } from './stage';

/**
 * Board 03 "Core component language" (WP-0.15 parity): the drawn specimens rebuilt from the
 * product components with the board's words, one per parity item. Nothing here restyles a
 * component; where the board draws a static state (focus) the parity suite produces it in the
 * browser. Frame boxes (`.xr-content` with the board frame's width, padding and background) are
 * the canvas frame mirrored as harness furniture.
 */

const noop = () => undefined;

const COURSE_OPTIONS = [
  { label: 'ME ZG523 — Thermodynamics & Heat Transfer' },
  { label: 'ME ZG524 — Fluid Mechanics (sample)' },
];

/** Board 03 "Long values · at 375 and 768": the two frames' width and padding. */
const LONG_VALUE_FRAMES = [
  { id: 'lv-375', w: 375, pad: 16 },
  { id: 'lv-768', w: 768, pad: 24 },
] as const;

/** Board 03 "List toolbar · one shared component at three widths". */
export const TOOLBAR_FRAMES = [
  { id: 'tb-1112', w: 1160, pad: 24 },
  { id: 'tb-720', w: 768, pad: 24 },
  { id: 'tb-343', w: 375, pad: 16 },
] as const;

interface Student {
  readonly name: string;
  readonly id: string;
}

const STUDENTS: readonly Student[] = [
  { name: 'Priya Natarajan', id: 'GIT-2026-0431' },
  { name: 'Kiran Rao', id: 'GIT-2026-0440' },
];

const STUDENT_PRIMARY: DataTablePrimaryColumn<Student> = {
  key: 'student',
  header: 'Student',
  href: () => '#h-find',
  title: (row) => row.name,
  sub: (row) => row.id,
};

const STUDENT_COLUMNS: readonly DataTableColumn<Student>[] = [
  { key: 'course', header: 'Course', cell: () => 'ME ZG523' },
  {
    key: 'status',
    header: 'Status',
    cell: () => <StatusPill tone="neutral">No access yet</StatusPill>,
  },
];

function Toolbar({ id }: { readonly id: string }) {
  return (
    <>
      <ListToolbar
        search={{
          id: `${id}-s`,
          label: 'Search',
          placeholder: 'Name, e-mail or student ID',
          value: '',
          onChange: noop,
        }}
        filters={[
          {
            id: `${id}-f1`,
            label: 'Status',
            options: [
              { label: 'No access yet' },
              { label: 'All statuses' },
              { label: 'Access active' },
              { label: 'Inactive' },
            ],
            value: 'No access yet',
            onChange: noop,
          },
          {
            id: `${id}-f2`,
            label: 'Course',
            options: [
              { label: 'All courses' },
              { label: 'ME ZG523 — Thermodynamics & Heat Transfer' },
            ],
            value: 'All courses',
            onChange: noop,
          },
        ]}
        moreFilters={{ open: false, onOpenChange: noop }}
        status="12 of 214 students"
        chips={[{ key: 'status', label: 'Status: No access yet', onRemove: noop }]}
        onClearFilters={noop}
      />
      <DataTable
        caption="Students"
        primary={STUDENT_PRIMARY}
        columns={STUDENT_COLUMNS}
        rows={STUDENTS}
        rowKey={(row) => row.id}
        loadingLabel="Loading students"
        empty={{ icon: 'studentsPeople', title: 'No students yet' }}
      />
    </>
  );
}

interface PersonRow {
  readonly name: string;
  readonly email: string;
  readonly given: ReactNode;
  readonly status: ReactNode;
}

const PEOPLE: readonly PersonRow[] = [
  {
    name: 'Rahul Verma',
    email: 'rahul.verma@godavari.edu.in',
    given: (
      <>
        Shell-and-Tube Heat Exchanger <FormatSet formats={['WEB', 'VR']} compact glyph={false} />
      </>
    ),
    status: <StatusPill tone="ok">Access active</StatusPill>,
  },
  {
    name: 'Priya Natarajan',
    email: 'priya.n@godavari.edu.in',
    given: <span className="xr-meta">None yet</span>,
    status: <StatusPill tone="neutral">No access yet</StatusPill>,
  },
  {
    name: 'Arun Kumar',
    email: 'arun.k@godavari.edu.in',
    given: (
      <>
        Forced Convection <FormatSet formats={['WEB']} compact glyph={false} />
      </>
    ),
    status: <StatusPill tone="wait">Waiting for a licence</StatusPill>,
  },
];

const PEOPLE_COLUMNS: readonly DataTableColumn<PersonRow>[] = [
  { key: 'course', header: 'Course', cell: () => 'ME ZG523' },
  { key: 'given', header: 'Experiments given', cell: (row) => row.given },
  { key: 'status', header: 'Status', cell: (row) => row.status },
  {
    key: 'open',
    header: <VisuallyHidden>Action</VisuallyHidden>,
    label: null,
    cell: () => <Link href="#h-list">Open</Link>,
  },
];

export function B03Components() {
  return (
    <ParityPage>
      {/* Form controls · Text input */}
      <ParityItem id="field-text-empty">
        <Field id="c-in1" label="Full name">
          <TextInput placeholder="For example, Rahul Verma" />
        </Field>
      </ParityItem>
      <ParityItem id="field-text-focused">
        <Field id="c-in2" label="Full name" marker="· focused">
          <TextInput defaultValue="Rahul Ver" />
        </Field>
      </ParityItem>
      <ParityItem id="field-text-error">
        <Field
          id="c-in3"
          label="Institution e-mail"
          error="Enter a full e-mail address, like name@institution.edu"
        >
          <TextInput type="email" defaultValue="rahul.verma@godavari" />
        </Field>
      </ParityItem>
      <ParityItem id="field-read-only">
        <ReadOnlyValue label="Student ID" note="Read-only · set at import">
          GIT-2026-0418
        </ReadOnlyValue>
      </ParityItem>
      {/* Form controls · Textarea · select · file */}
      <ParityItem id="field-textarea">
        <Field id="c-ta" label="What happened?" hint="Say what you were doing and what you saw.">
          <Textarea defaultValue="The VR simulation stopped loading at the second step." />
        </Field>
      </ParityItem>
      <ParityItem id="field-select">
        <Field id="c-sel" label="Course">
          <Select options={COURSE_OPTIONS} />
        </Field>
      </ParityItem>
      <ParityItem id="field-file">
        <Field id="c-file" label="Screenshot" marker="(optional)">
          <FileInput accept="image/*" />
        </Field>
      </ParityItem>
      {/* Form controls · Checkbox · radio · search */}
      <ParityItem id="field-checkboxes">
        <CheckboxGroup legend="Experiments to give">
          <Checkbox defaultChecked>Shell-and-Tube Heat Exchanger</Checkbox>
          <Checkbox>Conduction Through a Composite Wall</Checkbox>
        </CheckboxGroup>
      </ParityItem>
      <ParityItem id="field-radios">
        <RadioGroup legend="Group" name="c-grp" defaultValue="a">
          <Radio value="a">ME ZG523 · Sem II · Section A</Radio>
          <Radio value="b">ME ZG523 · Sem II · Section B</Radio>
        </RadioGroup>
      </ParityItem>
      <ParityItem id="field-search">
        <Field id="c-srch" label="Search people">
          <TextInput type="search" placeholder="Name or e-mail" />
        </Field>
      </ParityItem>
      {/* Form controls · Long values at 375 and 768 (the frame mirrored) */}
      {LONG_VALUE_FRAMES.map(({ id, w, pad }) => (
        <ParityItem key={id} id={id} surface="none">
          <div
            className="xr-content"
            style={{
              width: w,
              padding: pad,
              background: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              boxSizing: 'border-box',
            }}
          >
            <Field id={`${id}-c`} label="Course">
              <Select
                options={[
                  { label: 'ME ZG523 — Thermodynamics & Heat Transfer' },
                  {
                    label:
                      'ME ZG531 — Computational Fluid Dynamics and Heat Transfer Applications (sample)',
                  },
                ]}
              />
            </Field>
            <RadioGroup
              legend="Course · radio list for a short set of long names"
              name={`${id}-r`}
              defaultValue="523"
            >
              <ChoiceList>
                <ChoiceCard
                  value="523"
                  title="ME ZG523 — Thermodynamics & Heat Transfer"
                  sub="4 experiments in your plan"
                />
                <ChoiceCard
                  value="531"
                  title="ME ZG531 — Computational Fluid Dynamics and Heat Transfer Applications (sample)"
                  sub="2 experiments in your plan"
                />
              </ChoiceList>
            </RadioGroup>
          </div>
        </ParityItem>
      ))}
      {/* Search, filter, segmented and tabs · List toolbar at three widths */}
      {TOOLBAR_FRAMES.map(({ id, w, pad }) => (
        <ParityItem key={id} id={id} surface="none">
          <div
            className="xr-content"
            style={{ width: w, padding: pad, background: '#F4F5FB', boxSizing: 'border-box' }}
          >
            <Toolbar id={id} />
          </div>
        </ParityItem>
      ))}
      <ParityItem id="segmented">
        <SegmentedControl
          label="Show reports"
          options={[
            { value: 'open', label: 'Open' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'all', label: 'All' },
          ]}
          defaultValue="open"
        />
      </ParityItem>
      <ParityItem id="record-tabs">
        <RecordHubTabs
          label="Shell-and-Tube Heat Exchanger"
          tabs={['Overview', 'Resources', 'Simulation', 'Assessment', 'Progress'].map((tab) => ({
            href: '#h-find',
            label: tab,
            current: tab === 'Overview',
          }))}
        />
      </ParityItem>
      <ParityItem id="section-tabs">
        <SectionTabs
          label="People sections"
          surface="white"
          tabs={[
            { href: '#h-find', label: 'Students', count: 214, current: true },
            { href: '#h-find', label: 'Faculty', count: 9 },
            { href: '#h-find', label: 'Groups' },
            { href: '#h-find', label: 'Faculty courses' },
          ]}
        />
      </ParityItem>
      {/* Breadcrumbs, back link and page header */}
      <ParityItem id="back-link">
        <BackLink href="#h-nav">Students</BackLink>
      </ParityItem>
      <ParityItem id="page-header" surface="canvas">
        <PageHeader
          title="Rahul Verma"
          meta={
            <>
              <StatusPill tone="ok">Account active</StatusPill>
              <span>Student · Godavari Institute of Technology</span>
              <IdChip>GIT-2026-0418</IdChip>
            </>
          }
          actions={
            <>
              <Button variant="secondary">Edit details</Button>
              <Button variant="primary">Give access</Button>
            </>
          }
        />
      </ParityItem>
      {/* List rows and attention items */}
      <ParityItem id="rows-table" surface="canvas">
        <div className="xr-content">
          <DataTable
            caption="Students"
            primary={{
              key: 'student',
              header: 'Student',
              href: () => '#h-list',
              title: (row) => row.name,
              sub: (row) => row.email,
            }}
            columns={PEOPLE_COLUMNS}
            rows={PEOPLE}
            rowKey={(row) => row.name}
            loadingLabel="Loading students"
            empty={{ icon: 'studentsPeople', title: 'No students yet' }}
          />
        </div>
      </ParityItem>
      <ParityItem id="attention" surface="canvas">
        <AttentionList
          title="Needs your attention"
          meta="4 items"
          allClear="Nothing needs your attention"
        >
          <AttentionItem
            icon="attention"
            tone="wait"
            title="Shell-and-Tube Heat Exchanger hasn’t been given to any student"
            sub="ME ZG523 · in access plan ACC-0107"
            action={{ href: '#c-att', label: 'Give access' }}
          />
          <AttentionItem
            icon="studentAccess"
            title="12 students have no access yet"
            sub="Added on 4 Aug by import"
            action={{ href: '#c-att', label: 'Review students' }}
          />
          <AttentionItem
            icon="myDevice"
            tone="info"
            title="2 device requests to forward to BITS"
            sub="Oldest from 29 Sep"
            action={{ href: '#c-att', label: 'Open requests' }}
          />
          <AttentionItem
            icon="failed"
            tone="err"
            title="1 open problem report from your institution"
            sub="“VR simulation stopped loading” · 3 Oct"
            action={{ href: '#c-att', label: 'View report' }}
          />
        </AttentionList>
      </ParityItem>
      {/* Notices, empty, error, loading and read-only */}
      <ParityItem id="notice-info" surface="canvas">
        <Notice title="A new version of this experiment is live">
          Open the experiment to see what changed.
        </Notice>
      </ParityItem>
      <ParityItem id="notice-ok" surface="canvas">
        <Notice tone="ok" title="Access given">
          Rahul Verma can now open Shell-and-Tube Heat Exchanger.
        </Notice>
      </ParityItem>
      <ParityItem id="notice-warn" surface="canvas">
        <Notice
          tone="warn"
          role="note"
          title="Access plan ends on 30 Jun 2027"
          actions={<Link href="#h-fb">View plan</Link>}
        >
          Renewing mirrors the current plan.
        </Notice>
      </ParityItem>
      <ParityItem id="notice-err" surface="canvas">
        <FailedState
          title="The simulation didn’t open. Nothing was lost."
          onRetry={noop}
          reportHref="#h-fb"
        >
          Try again. If it keeps happening, report the problem.
        </FailedState>
      </ParityItem>
      <ParityItem id="empty">
        <EmptyState
          icon="assessments"
          iconSize={24}
          title="No assessments yet"
          headingLevel={3}
          line="small"
          actions={<Button variant="primary">Create assessment</Button>}
        >
          Create an assessment for an experiment you teach. You can save a draft while you add
          questions.
        </EmptyState>
      </ParityItem>
      {/* Stepper, timeline and comparison */}
      <ParityItem id="stepper">
        <Stepper
          label="Give students access"
          steps={['Experiments', 'Students', 'Review and give access']}
          current={2}
        />
      </ParityItem>
      <ParityItem id="timeline">
        <Timeline
          label="Submission and review history"
          lineElement="p"
          events={[
            {
              id: 'approved',
              what: 'Approved by Academic Reviewer',
              when: '2 Sep · Prof. A. Menon · now with Content Manager',
            },
            {
              id: 'submitted-2',
              what: 'Submitted · revision 2',
              when: '26 Aug · Northline Simulation Studio',
            },
            {
              id: 'returned',
              what: 'Returned with a reason',
              when: '19 Aug · Prof. A. Menon',
              note: '“Please clarify the VR device requirements.”',
            },
            { id: 'submitted', what: 'Submitted', when: '12 Aug · Northline Simulation Studio' },
          ]}
        />
      </ParityItem>
      {/* Decision panel */}
      <ParityItem id="decision-panel" surface="canvas">
        <DecisionPanel id="c-dp-panel" title="Your decision" titleId="c-dp" headingLevel={3}>
          <RadioGroup legend="Decision" legendClass="xr-sr" name="c-dec" defaultValue="return">
            <ChoiceList>
              <ChoiceCard
                value="approve"
                title="Approve"
                sub="Moves to the Content Manager. Approving does not publish."
              />
              <ChoiceCard
                value="return"
                title="Return to vendor"
                sub="The vendor sees your reason."
              />
            </ChoiceList>
          </RadioGroup>
          <Field
            id="c-dr"
            label="Reason for returning"
            error="Add a reason so the vendor knows what to change"
          >
            {/* Per-screen composition (Appendix E §2.5 group 2): the boards size a decision
                panel's reason box per screen (104, 120 or 140 px); board 03 draws 104. */}
            <Textarea style={{ minHeight: 104 }} />
          </Field>
          <Button variant="primary" block>
            Return to vendor
          </Button>
        </DecisionPanel>
      </ParityItem>
      {/* Account menu */}
      <ParityItem id="account-closed">
        <AccountMenu name="Meera Iyer" role="Institute Admin" initials="MI" items={[]} />
      </ParityItem>
      <ParityItem id="account-student">
        <AccountMenu
          name="Rahul Verma"
          role="Student"
          organisation="Godavari Institute of Technology"
          initials="RV"
          items={[
            { kind: 'link', label: 'My device', href: '#my-device', icon: 'myDevice' },
            { kind: 'link', label: 'Help', href: '#help', icon: 'help' },
            { kind: 'separator' },
            { kind: 'button', label: 'Sign out', icon: 'signOut', onSelect: noop },
          ]}
        />
      </ParityItem>
      <ParityItem id="account-platform">
        <AccountMenu
          name="Kavya Nair"
          role="Content Manager"
          initials="KN"
          items={[
            { kind: 'link', label: 'Help', href: '#help', icon: 'help' },
            { kind: 'separator' },
            { kind: 'button', label: 'Sign out', icon: 'signOut', onSelect: noop },
          ]}
        />
      </ParityItem>
    </ParityPage>
  );
}
