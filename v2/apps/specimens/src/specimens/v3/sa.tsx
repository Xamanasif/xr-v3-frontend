'use client';

/*
 * V3 specimens of SA-01 (Overview) and SA-02 (Requests), composed from @xr/ui/v3 with the SA01 /
 * SA02 boards' illustrative scenarios (scenarios.ts). Harness only: the filtering, sorting and
 * category switching below are the specimen's own UI state over fixed fixture rows, so the shared
 * components can be exercised in a browser. The product binds its existing queries, filters and
 * ordering (apps/web features/admin) — never copy this code into it.
 */
import {
  CategorySwitch,
  CellLines,
  FilterToolbar,
  FormatBadges,
  HiddenHeading,
  ListState,
  ListSurface,
  LoadingRows,
  OverviewHead,
  PageHead,
  PriorityBand,
  QueueGroups,
  RecordTable,
  SectionHead,
  SortBar,
  StatusPill,
  Button,
  type RecordTableRow,
  type RecordTableSort,
  type ToolbarChip,
} from '@xr/ui/v3';
import { useRef, useState } from 'react';

import {
  REQUEST_STATUS,
  SA01_CATEGORIES,
  SA01_GROUPS,
  SA02_OCT23,
  type SpecimenRequestRow,
} from './scenarios';
import { SuperAdminShell } from './shells';

type CategoryKey = (typeof SA01_CATEGORIES)[number]['key'];

/** SA-01 Overview at "Friday 23 October 2026": figures, switch, priority band, queue. */
export function SaOverviewSpecimen() {
  const [category, setCategory] = useState<CategoryKey>('all');
  const sizeOf = (groups: readonly string[]) =>
    groups.reduce((total, key) => total + (SA01_GROUPS[key]?.rows.length ?? 0), 0);
  const every = Object.keys(SA01_GROUPS);
  const current = SA01_CATEGORIES.find((option) => option.key === category) ?? SA01_CATEGORIES[0];
  const all = current.key === 'all';
  const count = (key: CategoryKey) =>
    key === 'all'
      ? sizeOf(every)
      : sizeOf(SA01_CATEGORIES.find((option) => option.key === key)?.groups ?? []);
  const selectedCount = count(current.key);
  const announcement = all
    ? ''
    : `${current.label}, ${selectedCount} ${selectedCount === 1 ? 'item' : 'items'}`;
  return (
    <SuperAdminShell current="overview" date="Friday 23 October 2026">
      <OverviewHead
        title="Overview"
        date="Friday 23 October 2026"
        figuresLabel="Platform at a glance"
        figures={[
          {
            value: 4,
            title: 'Active institutions',
            details: ['Access active or ending soon.', '1 paused, 1 awaiting payment.'],
          },
          { value: 13, title: 'Published experiments', details: ['Live in the catalogue today'] },
        ]}
      />
      <CategorySwitch
        label="Show what is waiting"
        value={category}
        onChange={setCategory}
        announcement={announcement}
        options={SA01_CATEGORIES.map((option) => ({
          key: option.key,
          label: option.label,
          count: count(option.key),
        }))}
      />
      {all ? (
        <>
          <PriorityBand
            title="Needs attention first"
            titleId="rb-prio-h"
            note="Soonest deadline first, then the longest wait"
            items={[
              {
                key: 'renewal',
                when: { big: '31 Oct', relative: 'In 8 days' },
                kind: { icon: 'calendar', label: 'Access ending' },
                title: 'BITS Pilani — Hyderabad Campus',
                description: 'Its renewal request has been under review since 24 September.',
                action: {
                  href: '/v3-sa-03-renewal',
                  label: 'Open renewal request',
                  accessibleName: 'Open the renewal request from BITS Pilani — Hyderabad Campus',
                  variant: 'primary',
                },
              },
              {
                key: 'ending',
                when: { big: '2 Nov', relative: 'In 10 days' },
                kind: { icon: 'calendar', label: 'Access ending' },
                title: 'Konark Polytechnic',
                description: 'The reminder is due. Nothing is sent from here.',
                action: {
                  href: '#',
                  label: 'View access ending',
                  accessibleName: 'View access ending for Konark Polytechnic',
                },
              },
              {
                key: 'correction',
                when: { big: '57 days', relative: 'Waiting since 27 Aug', calm: true },
                kind: { icon: 'edit', label: 'Correction waiting for release' },
                title: 'Distillation Column correction',
                description:
                  'Version 1.3 was approved by the Academic Reviewer on 27 August. Version 1.2 is still live.',
                action: {
                  href: '#',
                  label: 'Review correction',
                  accessibleName: 'Review the Distillation Column correction',
                },
              },
            ]}
          />
          {/* SA01 pulls this head 12 px towards the queue (an inline style on the board); in the
              product that is a composition utility, here the harness's own style. */}
          <div style={{ marginBottom: -12 }}>
            <SectionHead title="Also waiting on you" note="Oldest first in each group" />
          </div>
        </>
      ) : (
        <HiddenHeading>{announcement}</HiddenHeading>
      )}
      <QueueGroups
        idPrefix="sa1-g"
        groups={current.groups.map((key) => {
          const group = SA01_GROUPS[key]!;
          return {
            key: group.key,
            name: group.name,
            icon: group.icon,
            link: { href: group.href, label: group.link },
            rows: group.rows.map((row) => ({
              key: row.key,
              title: row.title,
              description: row.description,
              when: { big: row.big, small: row.small, due: row.due },
              action: {
                href: row.href ?? '#',
                label: row.action,
                accessibleName: row.accessibleName,
              },
            })),
          };
        })}
      />
    </SuperAdminShell>
  );
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...Object.entries(REQUEST_STATUS).map(([value, status]) => ({ value, label: status.words })),
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

function tableRow(row: SpecimenRequestRow): RecordTableRow {
  const status = REQUEST_STATUS[row.status];
  return {
    key: row.key,
    href: row.href,
    title: row.institution,
    titleDetail: row.contact,
    linkLabel: `${row.institution}, ${row.type.toLowerCase()}, received ${row.received}, ${status.words}. Open the request`,
    what: (
      <>
        <CellLines strong={row.experiments} />
        {row.formats.length > 0 ? (
          <FormatBadges
            formats={row.formats}
            label={`Formats requested: ${row.formats.join(', ')}`}
          />
        ) : null}
      </>
    ),
    kind: <CellLines strong={row.type} small={row.route} />,
    when: row.received,
    status: <StatusPill tone={status.tone}>{status.words}</StatusPill>,
  };
}

export type RequestsMode = 'ok' | 'loading' | 'failed' | 'empty';

/** SA-02 Requests at "Friday 23 October 2026": filters, sort, chips and the list states. */
export function SaRequestsSpecimen({
  mode: initialMode = 'ok',
  query: initialQuery = '',
}: {
  readonly mode?: RequestsMode;
  readonly query?: string;
}) {
  const [mode, setMode] = useState<RequestsMode>(initialMode);
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [route, setRoute] = useState('all');
  const [more, setMore] = useState(false);
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
  const titleRef = useRef<HTMLHeadingElement>(null);

  const all = SA02_OCT23.rows;
  const needle = query.trim().toLowerCase();
  const rows = all
    .filter(
      (row) =>
        (!needle || `${row.institution} ${row.contact}`.toLowerCase().includes(needle)) &&
        (status === 'all' || row.status === status) &&
        (type === 'all' || row.type === type) &&
        (route === 'all' || row.route === route),
    )
    .sort((left, right) =>
      direction === 'desc' ? right.day.localeCompare(left.day) : left.day.localeCompare(right.day),
    );

  const chips: ToolbarChip[] = [
    ...(needle
      ? [{ key: 'q', label: `Search: “${query.trim()}”`, onRemove: () => setQuery('') }]
      : []),
    ...(status !== 'all'
      ? [
          {
            key: 'st',
            label: `Status: ${REQUEST_STATUS[status as SpecimenRequestRow['status']].words}`,
            onRemove: () => setStatus('all'),
          },
        ]
      : []),
    ...(type !== 'all'
      ? [{ key: 'type', label: `Type: ${type}`, onRemove: () => setType('all') }]
      : []),
    ...(route !== 'all'
      ? [{ key: 'route', label: `Internal or external: ${route}`, onRemove: () => setRoute('all') }]
      : []),
  ];

  const sort: RecordTableSort = {
    header: 'Received',
    direction,
    words: { desc: 'newest first', asc: 'oldest first' },
    onToggle: () => setDirection((current) => (current === 'desc' ? 'asc' : 'desc')),
  };
  const ok = mode === 'ok';
  const clear = () => {
    setQuery('');
    setStatus('all');
    setType('all');
    setRoute('all');
  };

  return (
    <SuperAdminShell current="requests" date="Friday 23 October 2026">
      <PageHead
        title="Requests"
        titleId="rq-title"
        titleRef={titleRef}
        titleFocusTarget
        date="Friday 23 October 2026"
        lead="Institutional access requests sent from the public site. Open one to decide it."
      />
      <ListSurface label="Institutional access requests" busy={mode === 'loading'}>
        {mode !== 'empty' ? (
          <FilterToolbar
            label="Filter requests"
            search={{
              id: 'rq-q',
              label: 'Search',
              placeholder: 'Institution or contact person',
              value: query,
              onChange: setQuery,
            }}
            filters={[
              {
                id: 'rq-st',
                label: 'Status',
                size: 'status',
                value: status,
                onChange: setStatus,
                options: STATUS_OPTIONS,
              },
              {
                id: 'rq-type',
                label: 'Type',
                size: 'type',
                value: type,
                onChange: setType,
                options: TYPE_OPTIONS,
              },
            ]}
            more={{
              id: 'rq-more',
              label: 'More filters',
              open: more,
              onToggle: () => setMore((open) => !open),
              filters: [
                {
                  id: 'rq-route',
                  label: 'Internal or external',
                  value: route,
                  onChange: setRoute,
                  options: ROUTE_OPTIONS,
                },
              ],
            }}
            count={
              ok
                ? chips.length > 0
                  ? `${rows.length} of ${all.length} requests`
                  : `${all.length} requests`
                : undefined
            }
            sortBar={<SortBar sort={sort} />}
            chips={chips}
            onClearFilters={clear}
          />
        ) : null}
        {ok && rows.length > 0 ? (
          <RecordTable
            caption="Institutional access requests"
            headers={{
              who: 'Institution and contact person',
              what: 'Experiments',
              kind: 'Type',
              when: 'Received',
              status: 'Status',
            }}
            rows={rows.map(tableRow)}
            sort={sort}
            whenLabel="Received"
          />
        ) : null}
        {ok && rows.length === 0 ? (
          <ListState
            kind="nomatch"
            title="No requests match these filters"
            action={<Button onClick={clear}>Clear filters</Button>}
          >
            Try fewer filters or a different spelling of the institution or contact person.
          </ListState>
        ) : null}
        {mode === 'empty' ? (
          <ListState kind="empty" title="No requests yet">
            Requests that institutions send from the public site appear here.
          </ListState>
        ) : null}
        {mode === 'loading' ? <LoadingRows message="Loading requests…" /> : null}
        {mode === 'failed' ? (
          <ListState
            kind="failed"
            title="We couldn’t load the requests"
            action={
              <Button
                onClick={() => {
                  setMode('ok');
                  titleRef.current?.focus();
                }}
              >
                Try again
              </Button>
            }
          >
            Nothing has changed. Try again.
          </ListState>
        ) : null}
      </ListSurface>
    </SuperAdminShell>
  );
}
