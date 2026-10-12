'use client';

import {
  BackLink,
  Button,
  ChoiceCard,
  ChoiceList,
  DataTable,
  DecisionLayout,
  FormatSet,
  IdChip,
  Link,
  ListToolbar,
  PageHeader,
  RadioGroup,
  RecordHubTabs,
  Section,
  SectionBody,
  SectionTabs,
  Select,
  Field,
  StatusPill,
  StatusTabs,
  Timeline,
  type DataTableColumn,
  type DecisionPanelPosition,
  type FilterChip,
  type StatusTone,
  type TimelineEvent,
} from '@xr/ui';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Data-display specimens (Appendix E §3.3: DataTable, ListToolbar / Filters, Tabs, Timeline,
 * DecisionLayout + DecisionPanel). Words and records are board copy: B1-10 (requests), B1-11
 * (the request decision), B7-02 (institutions), B7-05 (release or hold), boards 03 and 11 (People
 * tabs and students), B2-03 and B2-12. Harness state stands in for the caller (filtering, a retry
 * that loads after a short wait); nothing here is a product screen.
 */

/**
 * Harness only: marks the specimen root once React has hydrated it, so the browser specs press
 * keys only when the handlers are attached (`[data-ready]`).
 */
function markReady(element: HTMLElement | null): void {
  element?.setAttribute('data-ready', 'true');
}

/** How long the harness "loads" after "Try again" before the rows arrive. */
const LOAD_MS = 1200;

function Page({ children }: { readonly children: ReactNode }) {
  return (
    <div className="xr-app" data-probe="app" ref={markReady}>
      <main className="xr-page">
        <div className="xr-wrap xr-content" data-probe="content">
          {children}
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* B1-10 SA-02 Requests                                                                         */
/* ------------------------------------------------------------------------------------------ */

type RequestStatus = 'review' | 'info' | 'pay' | 'pend' | 'active';

interface AccessRequest {
  readonly ref: string;
  readonly inst: string;
  readonly contact: string;
  readonly exp: string;
  readonly more: string;
  readonly type: string;
  readonly date: string;
  readonly iso: string;
  readonly st: RequestStatus;
  readonly route: string;
}

/** B1-10's seven requests (`static get RQ()`). */
const REQUESTS: readonly AccessRequest[] = [
  {
    ref: 'REQ-0042',
    inst: 'Godavari Institute of Technology',
    contact: 'Meera Iyer',
    exp: 'Shell-and-Tube Heat Exchanger',
    more: 'WEB, VR',
    type: 'New access',
    date: '2 Oct 2026',
    iso: '20261002',
    st: 'review',
    route: 'Not set yet',
  },
  {
    ref: 'REQ-0041',
    inst: 'Krishna College of Engineering',
    contact: 'S. Pillai',
    exp: '3 experiments',
    more: '',
    type: 'New access',
    date: '30 Sep 2026',
    iso: '20260930',
    st: 'info',
    route: 'Not set yet',
  },
  {
    ref: 'REQ-0040',
    inst: 'Konark Polytechnic',
    contact: 'R. Bhatt',
    exp: 'Buck Converter Ripple',
    more: 'WEB, AR',
    type: 'Additional licences',
    date: '29 Sep 2026',
    iso: '20260929',
    st: 'review',
    route: 'External',
  },
  {
    ref: 'REQ-0039',
    inst: 'BITS Pilani — Hyderabad Campus',
    contact: 'A. Menon',
    exp: '2 experiments',
    more: '',
    type: 'New access',
    date: '26 Sep 2026',
    iso: '20260926',
    st: 'active',
    route: 'Internal',
  },
  {
    ref: 'REQ-0038',
    inst: 'BITS Pilani — Hyderabad Campus',
    contact: 'A. Menon',
    exp: '3 experiments',
    more: '',
    type: 'Renewal',
    date: '24 Sep 2026',
    iso: '20260924',
    st: 'review',
    route: 'Internal',
  },
  {
    ref: 'REQ-0037',
    inst: 'Vizag Polytechnic',
    contact: 'K. Rao',
    exp: 'Distillation Column',
    more: 'WEB, VR',
    type: 'New access',
    date: '22 Sep 2026',
    iso: '20260922',
    st: 'pay',
    route: 'External',
  },
  {
    ref: 'REQ-0036',
    inst: 'Sahyadri Institute of Engineering',
    contact: 'N. Joshi',
    exp: 'CNC Turning Centre',
    more: 'MR',
    type: 'Additional licences',
    date: '18 Sep 2026',
    iso: '20260918',
    st: 'pend',
    route: 'External',
  },
];

const STATUS_WORDS: Readonly<Record<RequestStatus, string>> = {
  review: 'Under review',
  info: 'Information requested',
  pay: 'Approved — payment required',
  pend: 'Payment not confirmed',
  active: 'Access active',
};

/** B1-10's tones: review = info, info = err, payment = wait, active = ok. */
const STATUS_TONES: Readonly<Record<RequestStatus, StatusTone>> = {
  review: 'info',
  info: 'err',
  pay: 'wait',
  pend: 'wait',
  active: 'ok',
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...(Object.keys(STATUS_WORDS) as RequestStatus[]).map((value) => ({
    value,
    label: STATUS_WORDS[value],
  })),
];
const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'New access', label: 'New access' },
  { value: 'Additional licences', label: 'Additional licences' },
  { value: 'Renewal', label: 'Renewal' },
];
const ROUTE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'Internal', label: 'Internal' },
  { value: 'External', label: 'External' },
  { value: 'Not set yet', label: 'Not set yet' },
];

const REQUEST_COLUMNS: readonly DataTableColumn<AccessRequest>[] = [
  {
    key: 'inst',
    header: 'Institution and contact person',
    cell: (row) => (
      <>
        {row.inst}
        <span className="xr-sub">{row.contact}</span>
      </>
    ),
  },
  {
    key: 'exp',
    header: 'Experiments',
    cell: (row) => (
      <>
        {row.exp}
        {row.more ? <span className="xr-sub">{row.more}</span> : null}
      </>
    ),
  },
  {
    key: 'type',
    header: 'Type',
    cell: (row) => (
      <>
        {row.type}
        <span className="xr-sub">{row.route}</span>
      </>
    ),
  },
  { key: 'date', header: 'Received', className: 'xr-num', cell: (row) => row.date },
  {
    key: 'status',
    header: 'Status',
    cell: (row) => <StatusPill tone={STATUS_TONES[row.st]}>{STATUS_WORDS[row.st]}</StatusPill>,
  },
];

const REQUEST_PRIMARY = {
  key: 'ref',
  header: 'Reference',
  href: (row: AccessRequest) => `#${row.ref.toLowerCase()}`,
  title: (row: AccessRequest) => row.ref,
  linkLabel: (row: AccessRequest) => `Open request ${row.ref}, ${row.inst}`,
  linkClassName: 'xr-id',
};

const REQUESTS_EMPTY = {
  icon: 'requests',
  title: 'No requests yet',
  children: 'Requests that institutions send from the public site appear here.',
} as const;

interface RequestFilters {
  readonly q: string;
  readonly st: string;
  readonly type: string;
  readonly route: string;
}

const NO_FILTERS: RequestFilters = { q: '', st: 'all', type: 'all', route: 'all' };

/** B1-10 "SA-02 Requests · 1440 · interactive": search, Status, Type, More filters, chips. */
export function DataTableSpecimen() {
  const [filters, setFilters] = useState(NO_FILTERS);
  const [more, setMore] = useState(false);
  const set = (patch: Partial<RequestFilters>) =>
    setFilters((current) => ({ ...current, ...patch }));
  const q = filters.q.trim().toLowerCase();
  const rows = REQUESTS.filter(
    (row) =>
      (!q || `${row.ref} ${row.inst} ${row.contact}`.toLowerCase().includes(q)) &&
      (filters.st === 'all' || row.st === filters.st) &&
      (filters.type === 'all' || row.type === filters.type) &&
      (filters.route === 'all' || row.route === filters.route),
  ).sort((a, b) => b.iso.localeCompare(a.iso));
  const chips: FilterChip[] = [];
  if (q) {
    chips.push({
      key: 'q',
      label: `Search: “${filters.q.trim()}”`,
      onRemove: () => set({ q: '' }),
    });
  }
  if (filters.st !== 'all') {
    chips.push({
      key: 'st',
      label: `Status: ${STATUS_WORDS[filters.st as RequestStatus]}`,
      onRemove: () => set({ st: 'all' }),
    });
  }
  if (filters.type !== 'all') {
    chips.push({
      key: 'type',
      label: `Type: ${filters.type}`,
      onRemove: () => set({ type: 'all' }),
    });
  }
  if (filters.route !== 'all') {
    chips.push({
      key: 'route',
      label: `Internal or external: ${filters.route}`,
      onRemove: () => set({ route: 'all' }),
    });
  }
  const clear = () => setFilters(NO_FILTERS);
  return (
    <Page>
      <PageHeader
        overline="Super Admin"
        title="Requests"
        summary="Institutional access requests sent from the public site. Open one to decide it."
      />
      <ListToolbar
        search={{
          id: 'Qq-q',
          label: 'Search',
          placeholder: 'Reference, institution or contact',
          value: filters.q,
          onChange: (value) => set({ q: value }),
        }}
        filters={[
          {
            id: 'Qq-st',
            label: 'Status',
            options: STATUS_OPTIONS,
            value: filters.st,
            onChange: (value) => set({ st: value }),
          },
          {
            id: 'Qq-type',
            label: 'Type',
            options: TYPE_OPTIONS,
            value: filters.type,
            onChange: (value) => set({ type: value }),
          },
        ]}
        moreFilters={{
          id: 'Qq-more',
          open: more,
          onOpenChange: setMore,
          activeCount: filters.route === 'all' ? 0 : 1,
          children: (
            <Field id="Qq-route" label="Internal or external">
              <Select
                options={ROUTE_OPTIONS}
                value={filters.route}
                onChange={(event) => set({ route: event.target.value })}
              />
            </Field>
          ),
        }}
        status={
          chips.length
            ? `${rows.length} of ${REQUESTS.length} requests`
            : `${REQUESTS.length} requests`
        }
        chips={chips}
        onClearFilters={chips.length ? clear : undefined}
      />
      <DataTable
        caption="Institutional access requests"
        primary={REQUEST_PRIMARY}
        columns={REQUEST_COLUMNS}
        rows={rows}
        rowKey={(row) => row.ref}
        loadingLabel="Loading requests"
        filtered={chips.length > 0}
        empty={REQUESTS_EMPTY}
        noMatch={{ title: 'No requests match these filters', onClearFilters: clear }}
      />
    </Page>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* DataTable states                                                                             */
/* ------------------------------------------------------------------------------------------ */

interface CourseCode {
  readonly course: string;
  readonly area: string;
  readonly state: 'saved' | 'unsaved' | 'error' | 'blank';
}

/** Board 03 "Editable table · platform course codes (sample)": its four rows and states. */
const COURSES: readonly CourseCode[] = [
  { course: 'Thermodynamics & Heat Transfer', area: 'Mechanical', state: 'saved' },
  { course: 'Fluid Mechanics', area: 'Mechanical', state: 'unsaved' },
  { course: 'Heat Transfer Lab', area: 'Mechanical', state: 'error' },
  { course: 'Applied Mechanics', area: 'Mechanical', state: 'blank' },
];

const COURSE_STATE: Readonly<Record<CourseCode['state'], ReactNode>> = {
  saved: <StatusPill tone="ok">Saved</StatusPill>,
  unsaved: (
    <StatusPill tone="wait" icon={null}>
      Unsaved change
    </StatusPill>
  ),
  error: (
    <StatusPill tone="err" icon={null}>
      Not saved
    </StatusPill>
  ),
  blank: <span className="xr-meta">Blank allowed</span>,
};

function StatesBlock({
  title,
  probe,
  children,
}: {
  readonly title: string;
  readonly probe: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="xr-stack" data-probe={probe}>
      <h2 className="xr-h2">{title}</h2>
      {children}
    </div>
  );
}

/**
 * B1-10 frames "Loading", "Empty · no requests yet", "No match" and "Failed + retry" (as the
 * board-04 error notice), and board 03's changed / error row tints.
 */
export function DataTableStatesSpecimen() {
  const [failedMode, setFailedMode] = useState<'failed' | 'loading' | 'loaded'>('failed');
  const [filtered, setFiltered] = useState(true);
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );
  const retry = () => {
    setFailedMode('loading');
    timer.current = window.setTimeout(() => setFailedMode('loaded'), LOAD_MS);
  };
  const common = {
    caption: 'Institutional access requests',
    primary: REQUEST_PRIMARY,
    columns: REQUEST_COLUMNS,
    rowKey: (row: AccessRequest) => row.ref,
    loadingLabel: 'Loading requests',
    empty: REQUESTS_EMPTY,
  };
  return (
    <Page>
      <div className="xr-stack">
        <h1 className="xr-h1">Requests</h1>
        <StatesBlock title="Loading" probe="loading">
          <DataTable {...common} rows={[]} loading />
        </StatesBlock>
        <StatesBlock title="Empty" probe="empty">
          <DataTable {...common} rows={[]} />
        </StatesBlock>
        <StatesBlock title="No match" probe="no-match">
          <DataTable
            {...common}
            rows={filtered ? [] : REQUESTS.slice(0, 3)}
            filtered={filtered}
            noMatch={{
              title: 'No requests match these filters',
              onClearFilters: () => setFiltered(false),
            }}
          />
        </StatesBlock>
        <StatesBlock title="Failed" probe="failed">
          <DataTable
            {...common}
            rows={failedMode === 'loaded' ? REQUESTS.slice(0, 3) : []}
            loading={failedMode === 'loading'}
            failed={
              failedMode === 'failed'
                ? {
                    title: 'We couldn’t load the requests',
                    children: 'Nothing has changed. Try again.',
                    onRetry: retry,
                    reportHref: '#report-a-problem',
                  }
                : null
            }
          />
        </StatesBlock>
        <StatesBlock title="Changed and error rows" probe="tints">
          <DataTable<CourseCode>
            caption="Platform course codes"
            primary={{
              key: 'course',
              header: 'Course',
              href: (row) => `#${row.course.toLowerCase().replaceAll(/[^a-z]+/g, '-')}`,
              title: (row) => row.course,
            }}
            columns={[
              { key: 'area', header: 'Engineering area', cell: (row) => row.area },
              { key: 'state', header: 'State', cell: (row) => COURSE_STATE[row.state] },
            ]}
            rows={COURSES}
            rowKey={(row) => row.course}
            rowState={(row) =>
              row.state === 'unsaved' ? 'changed' : row.state === 'error' ? 'error' : undefined
            }
            loadingLabel="Loading platform course codes"
            empty={{ icon: 'courseCodes', title: 'Platform course codes' }}
          />
        </StatesBlock>
      </div>
    </Page>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Flush table in a section (B2-03) and board 11's students                                     */
/* ------------------------------------------------------------------------------------------ */

interface Student {
  readonly name: string;
  readonly id: string;
  readonly course: string;
  readonly given: string;
  readonly formats: readonly ('WEB' | 'VR')[];
  readonly status: string;
  readonly tone: StatusTone;
}

/** Board 11 "1440 · Institute Admin · People › Students": four students. */
const STUDENTS: readonly Student[] = [
  {
    name: 'Rahul Verma',
    id: 'GIT-2026-0418',
    course: 'ME ZG523',
    given: 'Shell-and-Tube Heat Exchanger',
    formats: ['WEB', 'VR'],
    status: 'Access active',
    tone: 'ok',
  },
  {
    name: 'Priya Natarajan',
    id: 'GIT-2026-0431',
    course: 'ME ZG523',
    given: '',
    formats: [],
    status: 'No access yet',
    tone: 'neutral',
  },
  {
    name: 'Arun Kumar',
    id: 'GIT-2026-0377',
    course: 'ME ZG523',
    given: 'Forced Convection',
    formats: ['WEB'],
    status: 'Waiting for a licence',
    tone: 'wait',
  },
  {
    name: 'Sneha Reddy',
    id: 'GIT-2026-0352',
    course: 'ME ZG523',
    given: 'Shell-and-Tube Heat Exchanger',
    formats: ['WEB', 'VR'],
    status: 'Inactive',
    tone: 'off',
  },
];

/** B2-03 "After SACC-0310 · 9 Oct 2026": the flush table inside its section. */
export function DataTableFlushSpecimen() {
  return (
    <Page>
      <Section
        title="Students you’ve given access"
        headEnd={<Link href="#student-access">Open Student access</Link>}
      >
        <DataTable<Student>
          flush
          caption="Students given access under ACC-0107"
          primary={{
            key: 'student',
            header: 'Student',
            href: (row) => `#${row.id.toLowerCase()}`,
            title: (row) => row.name,
            sub: (row) => row.id,
          }}
          columns={[
            { key: 'course', header: 'Course', cell: (row) => row.course },
            {
              key: 'given',
              header: 'Experiments given',
              cell: (row) =>
                row.given ? (
                  <>
                    {row.given} <FormatSet formats={row.formats} compact />
                  </>
                ) : (
                  <span className="xr-meta">None yet</span>
                ),
            },
            {
              key: 'status',
              header: 'Status',
              cell: (row) => <StatusPill tone={row.tone}>{row.status}</StatusPill>,
            },
          ]}
          rows={STUDENTS}
          rowKey={(row) => row.id}
          loadingLabel="Loading students"
          empty={{ icon: 'studentAccess', title: 'No students yet' }}
        />
      </Section>
    </Page>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Tabs                                                                                         */
/* ------------------------------------------------------------------------------------------ */

const PEOPLE_TABS = ['Students', 'Faculty', 'Groups', 'Faculty courses'] as const;
const PEOPLE_COUNTS: Readonly<Partial<Record<(typeof PEOPLE_TABS)[number], number>>> = {
  Students: 214,
  Faculty: 9,
};

type InstitutionStatus = 'active' | 'ending' | 'paused' | 'payment' | 'ended';

interface Institution {
  readonly name: string;
  readonly st: InstitutionStatus;
  readonly plan: string;
  readonly ia: string;
  readonly end: string;
}

/** B7-02's institutions (name, status, plan, Institute Admin, access end). */
const INSTITUTIONS: readonly Institution[] = [
  {
    name: 'Godavari Institute of Technology',
    st: 'active',
    plan: 'ACC-0107',
    ia: 'Meera Iyer',
    end: '7 Oct 2027',
  },
  { name: 'Konark Polytechnic', st: 'ending', plan: 'ACC-0091', ia: 'R. Bhatt', end: '2 Nov 2026' },
  {
    name: 'Sahyadri Institute of Engineering',
    st: 'active',
    plan: 'ACC-0102',
    ia: '',
    end: '29 Sep 2027',
  },
  {
    name: 'Deccan Institute of Technology',
    st: 'paused',
    plan: 'ACC-0085',
    ia: 'S. Kulkarni',
    end: '13 Jul 2027',
  },
  { name: 'Vizag Polytechnic', st: 'payment', plan: '', ia: '', end: '' },
  {
    name: 'Malnad College of Engineering',
    st: 'ended',
    plan: 'ACC-0079',
    ia: 'V. Hegde',
    end: '15 Oct 2026',
  },
];

const INSTITUTION_WORDS: Readonly<Record<InstitutionStatus, string>> = {
  active: 'Access active',
  ending: 'Ending soon',
  paused: 'Access paused',
  payment: 'Approved — payment required',
  ended: 'Access ended',
};
const INSTITUTION_TONES: Readonly<Record<InstitutionStatus, StatusTone>> = {
  active: 'ok',
  ending: 'wait',
  paused: 'paused',
  payment: 'wait',
  ended: 'off',
};

/** B7-02 `const F` and its `match` rule. */
const VIEWS = [
  ['all', 'All'],
  ['active', 'Access active'],
  ['ending', 'Ending soon'],
  ['paused', 'Paused'],
  ['payment', 'Awaiting payment'],
  ['noia', 'No Institute Admin'],
] as const;
type View = (typeof VIEWS)[number][0];

function inView(row: Institution, view: View): boolean {
  const noAdmin = !row.ia && (row.st === 'active' || row.st === 'ending' || row.st === 'paused');
  return (
    view === 'all' ||
    (view === 'active' && (row.st === 'active' || row.st === 'ending')) ||
    row.st === view ||
    (view === 'noia' && noAdmin)
  );
}

/**
 * Board 03 "Section tabs · sub-navigation inside “People”" (on white, with counts), B2-12 hub tabs
 * and B7-02 status tabs filtering the institutions list (with the VD-14 tabpanel).
 */
export function TabsSpecimen() {
  const [view, setView] = useState<View>('all');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const rows = INSTITUTIONS.filter(
    (row) =>
      inView(row, view) && (!q || `${row.name} ${row.plan} ${row.ia}`.toLowerCase().includes(q)),
  );
  // B7-02: a view other than "All" or a search counts as filtered; clearing resets both.
  const filtered = Boolean(q) || view !== 'all';
  const clear = () => {
    setQuery('');
    setView('all');
  };
  return (
    <Page>
      <div className="xr-stack">
        <h1 className="xr-h1">People</h1>
        <Section label="People">
          <SectionBody>
            <SectionTabs
              label="People sections"
              surface="white"
              tabs={PEOPLE_TABS.map((tab) => ({
                href: `#people-${tab.toLowerCase().replace(' ', '-')}`,
                label: tab,
                count: PEOPLE_COUNTS[tab],
                current: tab === 'Students',
              }))}
            />
          </SectionBody>
        </Section>
        <RecordHubTabs
          label="Shell-and-Tube Heat Exchanger"
          tabs={['Overview', 'Resources', 'Simulation', 'Assessment', 'Progress'].map((tab) => ({
            href: `#hub-${tab.toLowerCase()}`,
            label: tab,
            current: tab === 'Overview',
          }))}
        />
        <Section title="Every institution" meta="Created when a request is approved">
          <StatusTabs
            label="Show"
            idPrefix="Ll"
            tabs={VIEWS.map(([key, words]) => ({
              id: key,
              label: words,
              count: INSTITUTIONS.filter((row) => inView(row, key)).length,
            }))}
            selected={view}
            onSelect={(key) => setView(key as View)}
          >
            <SectionBody>
              <ListToolbar
                search={{
                  id: 'Ll-q',
                  label: 'Search institutions',
                  placeholder: 'Institution, access plan or Institute Admin',
                  value: query,
                  onChange: setQuery,
                }}
                status={`${rows.length} of ${INSTITUTIONS.length} institutions`}
                onClearFilters={filtered ? clear : undefined}
              />
              <DataTable<Institution>
                flush
                caption="Every institution"
                primary={{
                  key: 'name',
                  header: 'Institution',
                  href: (row) => `#${row.name.toLowerCase().replaceAll(' ', '-')}`,
                  title: (row) => row.name,
                  sub: (row) => (row.plan ? <IdChip>{row.plan}</IdChip> : null),
                }}
                columns={[
                  {
                    key: 'status',
                    header: 'Status',
                    cell: (row) => (
                      <StatusPill tone={INSTITUTION_TONES[row.st]}>
                        {INSTITUTION_WORDS[row.st]}
                      </StatusPill>
                    ),
                  },
                  {
                    key: 'ia',
                    header: 'Institute Admin',
                    cell: (row) =>
                      row.ia ||
                      (row.st === 'payment' || row.st === 'ended' ? null : (
                        <span className="xw-tag xw-tag--warn">Needs one</span>
                      )),
                  },
                  {
                    key: 'end',
                    header: 'Access ends',
                    className: 'xr-num',
                    cell: (row) => row.end,
                  },
                ]}
                rows={rows}
                rowKey={(row) => row.name}
                loadingLabel="Loading institutions"
                filtered={filtered}
                noMatch={{
                  title: 'No institutions match',
                  headingLevel: 3,
                  children: 'Try another name or clear the filters.',
                  onClearFilters: clear,
                }}
                empty={{ icon: 'institutions', title: 'No institutions match', headingLevel: 3 }}
              />
            </SectionBody>
          </StatusTabs>
        </Section>
      </div>
    </Page>
  );
}

/**
 * Board 11 "Section tabs at 375 px · each People tab as the current one": the strip with the last
 * tab current, which is scrolled into view where the strip is narrower than its tabs.
 */
export function SectionTabs375Specimen() {
  return (
    <Page>
      <h1 className="xr-h1">People</h1>
      <SectionTabs
        label="People sections"
        tabs={PEOPLE_TABS.map((tab) => ({
          href: `#people-${tab.toLowerCase().replace(' ', '-')}`,
          label: tab,
          current: tab === 'Faculty courses',
        }))}
      />
    </Page>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Timeline                                                                                     */
/* ------------------------------------------------------------------------------------------ */

const REVIEW_HISTORY: readonly TimelineEvent[] = [
  {
    id: 'approved',
    what: 'Approved by Academic Reviewer',
    when: '2 Sep · Prof. A. Menon · now with Content Manager',
  },
  { id: 'rev2', what: 'Submitted · revision 2', when: '26 Aug · Northline Simulation Studio' },
  {
    id: 'returned',
    what: 'Returned with a reason',
    when: '19 Aug · Prof. A. Menon',
    note: '“Please clarify the VR device requirements.”',
  },
  { id: 'submitted', what: 'Submitted', when: '12 Aug · Northline Simulation Studio' },
];

const ACCESS_HISTORY: readonly TimelineEvent[] = [
  {
    id: 'given',
    what: 'Rahul Verma given Shell-and-Tube Heat Exchanger',
    when: '9 Oct 2026, 10:20 · Meera Iyer',
    note: 'SACC-0310 · individually',
  },
  {
    id: 'activated',
    what: 'Access activated',
    when: '8 Oct 2026, 15:05',
    note: 'Payment confirmed for REQ-0042. Plan ACC-0107 created.',
  },
  {
    id: 'approved',
    what: 'Request approved · External',
    when: '8 Oct 2026, 11:20',
    note: 'Approved — payment required.',
  },
  { id: 'submitted', what: 'Request submitted', when: '2 Oct 2026, 10:14 · Meera Iyer' },
];

/** Board 03 "Timeline · history last on a record" and B2-03's history section. */
export function TimelineSpecimen() {
  return (
    <Page>
      <div className="xr-stack">
        <h1 className="xr-h1">History</h1>
        <Section label="Submission and review history">
          <SectionBody>
            <Timeline
              events={REVIEW_HISTORY}
              label="Submission and review history"
              lineElement="p"
            />
          </SectionBody>
        </Section>
        <Section title="History" headingId="Pgiven-hist">
          <SectionBody>
            <Timeline events={ACCESS_HISTORY} />
          </SectionBody>
        </Section>
      </div>
    </Page>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* DecisionLayout + DecisionPanel                                                               */
/* ------------------------------------------------------------------------------------------ */

/**
 * B1-11 "SA-03 Request decision · REQ-0042 · 1440 · interactive" (sticky panel) and B7-05
 * "SA-11 Release or hold an update · 1440 · interactive" (static panel): the page header, "Go to
 * decision", the content and the decision panel.
 */
export function DecisionLayoutSpecimen({ position }: { readonly position: DecisionPanelPosition }) {
  const [choice, setChoice] = useState<string | null>(null);
  const release = position === 'static';
  return (
    <Page>
      <BackLink href={release ? '#updates' : '#requests'}>
        {release ? 'Updates' : 'Requests'}
      </BackLink>
      <PageHeader
        overline={
          release ? (
            'UPD-0005 · Correction to published content'
          ) : (
            <>
              Institutional access request · <IdChip>REQ-0042</IdChip>
            </>
          )
        }
        title={release ? 'Distillation Column · 1.2 → 1.3' : 'Godavari Institute of Technology'}
        meta={
          release ? (
            <>
              <StatusPill tone="wait">Waiting for your decision</StatusPill>
              <span>Live now: version 1.2 · since 3 Jul 2026</span>
            </>
          ) : (
            <>
              <StatusPill tone="info">Under review</StatusPill>
              <span>Received 2 Oct 2026, 10:14</span>
              <span>New access</span>
            </>
          )
        }
      />
      <DecisionLayout
        panel={{
          id: release ? 'Wm-decision' : 'Za-decision',
          titleId: release ? 'Wm-dp' : 'Za-dp',
          title: 'Your decision',
          position,
          children: (
            <>
              <RadioGroup
                legend="Decision"
                legendClass="xr-sr"
                name={release ? 'Wm-sdec' : 'Za-choice'}
                value={choice}
                onValueChange={setChoice}
              >
                <ChoiceList>
                  {release ? (
                    <>
                      <ChoiceCard
                        value="release"
                        title="Release update"
                        sub="The proposed version goes live for everyone."
                      />
                      <ChoiceCard
                        value="hold"
                        title="Hold"
                        sub="The live version stays. You can lift the hold later."
                      />
                    </>
                  ) : (
                    <>
                      <ChoiceCard
                        value="approve"
                        title="Approve"
                        sub="Choose the access type below."
                      />
                      <ChoiceCard
                        value="info"
                        title="Request more information"
                        sub="The requester sees your reason."
                      />
                    </>
                  )}
                </ChoiceList>
              </RadioGroup>
              <Button variant="primary" block>
                {release ? 'Release update' : 'Approve'}
              </Button>
            </>
          ),
        }}
      >
        {release ? (
          <Section title="What changes">
            <SectionBody>
              <p className="xr-body">Correction to the live version 1.2 → 1.3</p>
            </SectionBody>
          </Section>
        ) : (
          <>
            <Section title="What they asked for">
              <SectionBody>
                <p className="xr-body">
                  Shell-and-Tube Heat Exchanger · ME ZG523 · 120 licences · 1 year
                </p>
              </SectionBody>
            </Section>
            <Section title="History">
              <SectionBody>
                <Timeline events={ACCESS_HISTORY.slice(2)} />
              </SectionBody>
            </Section>
          </>
        )}
      </DecisionLayout>
    </Page>
  );
}
