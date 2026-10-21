/**
 * V3 fields, filter toolbar, record table, list states and tabs (foundation XR-V3-RB-1.0;
 * ADR-0010): the SA-02 / SA-03 / IA-02 markup, field–error association, focus after removing a
 * chip or clearing filters, table semantics, the sort control's single visible place and the list
 * states' live regions. Container queries and the measured breakpoint are proven in a browser
 * (apps/specimens/e2e/v3-foundation.spec.ts).
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectRenderedAsV3Drawn,
  expectV3ClassesOnly,
} from '../testing/index.js';
import {
  ChangeSummary,
  CheckGroup,
  ChoiceGroup,
  ErrorSummary,
  Field,
  LockedValue,
  PendingHint,
  SearchInput,
  Select,
  TextInput,
  Textarea,
} from './fields.js';
import {
  FilterToolbar,
  ListState,
  ListSurface,
  LoadingRows,
  RecordTable,
  SortBar,
  type RecordTableRow,
  type RecordTableSort,
} from './list.js';
import { LinkTabs, TabPanel, Tabs } from './tabs.js';

describe('V3 Field (rb-kit.css rk-field)', () => {
  it('references only the hint and the error that exist, and is invalid only with an error', () => {
    const { rerender } = render(
      <Field label="Additional licences to approve" id="dc-lic">
        <TextInput inputMode="numeric" />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Additional licences to approve' });
    expect(input.getAttribute('aria-describedby')).toBeNull();
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(input.className).toBe('rk-input');
    rerender(
      <Field
        label="Reason for the change (required)"
        id="dc-reason"
        hint="Shown to the requester on their request status."
        error="Enter the reason for the change"
      >
        <Textarea />
      </Field>,
    );
    const area = screen.getByRole('textbox', { name: 'Reason for the change (required)' });
    expect(area.getAttribute('aria-describedby')).toBe('dc-reason-h dc-reason-e');
    expect(area.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Enter the reason for the change').closest('p')?.className).toBe(
      'rk-ferr',
    );
  });

  it('search and select wrappers as SA-02 draws them', () => {
    const { container } = render(
      <>
        <Field label="Search" id="rq-q" className="rk-search">
          <SearchInput placeholder="Institution or contact person" />
        </Field>
        <Field label="Status" id="rq-st" className="rk-field--st">
          <Select options={[{ value: 'all', label: 'All statuses' }]} />
        </Field>
      </>,
    );
    expect(container.querySelector('.rk-inputwrap > svg + input.rk-input')).not.toBeNull();
    expect(container.querySelector('.rk-selwrap > select.rk-select + svg')).not.toBeNull();
    expectV3ClassesOnly(container);
  });

  it('a control outside a Field is a programming error', () => {
    expect(() => render(<TextInput />)).toThrow('inside a V3 Field');
  });
});

describe('V3 choice and check groups (rk-fieldset)', () => {
  function Decision({ error }: { readonly error?: string }) {
    const [value, setValue] = useState<'approve' | 'smaller' | 'info' | null>(null);
    return (
      <ChoiceGroup
        legend="Decision"
        id="dc-choice"
        name="dc-choice"
        value={value}
        onChange={setValue}
        error={error}
        options={[
          {
            value: 'approve',
            title: 'Approve request',
            description: 'Approve what they asked for.',
          },
          {
            value: 'smaller',
            title: 'Approve a smaller scope',
            description: 'Not available for a renewal. The term continues the current plan.',
            unavailable: true,
          },
          {
            value: 'info',
            title: 'Request more information',
            description: 'The request stays open.',
          },
        ]}
      />
    );
  }

  it('radio cards: each consequence line describes its radio; an unavailable card says why', () => {
    render(<Decision />);
    const approve = screen.getByRole('radio', { name: 'Approve request' });
    expect(approve.getAttribute('aria-describedby')).toBe('dc-choice-approve-d');
    const smaller = screen.getByRole('radio', { name: 'Approve a smaller scope' });
    expect(smaller).toBeDisabled();
    expect(smaller.closest('label')?.className).toBe('rk-choice is-off');
    fireEvent.click(approve);
    expect(approve).toBeChecked();
  });

  it('an option may also be described by another element on the page, after its consequence line (RV-v1 rv-whole)', async () => {
    render(
      <>
        <ul>
          <li id="rv-whole">
            <b>Whole Experiment.</b> You decide for every format together: WEB and VR.
          </li>
        </ul>
        <ChoiceGroup
          legend="Decision"
          id="rv-choice"
          name="rv-choice"
          value={null}
          onChange={() => undefined}
          options={[
            {
              value: 'approve',
              title: 'Approve',
              description: 'It goes to the Content Manager to publish.',
              describedBy: 'rv-whole',
            },
            { value: 'return', title: 'Return to vendor', describedBy: 'rv-whole' },
          ]}
        />
      </>,
    );
    const approve = screen.getByRole('radio', { name: 'Approve' });
    expect(approve.getAttribute('aria-describedby')).toBe('rv-choice-approve-d rv-whole');
    expect(approve).toHaveAccessibleDescription(
      'It goes to the Content Manager to publish. Whole Experiment. You decide for every format together: WEB and VR.',
    );
    expect(
      screen.getByRole('radio', { name: 'Return to vendor' }).getAttribute('aria-describedby'),
    ).toBe('rv-whole');
    await assertNoAxeViolations(document.body);
  });

  it('the group error is in the fieldset’s description, not a live region', () => {
    render(<Decision error="Choose a decision" />);
    const group = screen.getByRole('group', { name: 'Decision' });
    expect(group.className).toBe('rk-fieldset is-invalid');
    expect(group.getAttribute('aria-describedby')).toBe('dc-choice-e');
    expect(document.getElementById('dc-choice-e')?.textContent).toBe('Choose a decision');
    expect(document.getElementById('dc-choice-e')?.getAttribute('role')).toBeNull();
  });

  it('check chips keep the options’ order', () => {
    const onChange = vi.fn();
    render(
      <CheckGroup
        legend="Formats to approve"
        id="dc-fm"
        values={['VR']}
        onChange={onChange}
        options={[
          { value: 'WEB', label: 'WEB', detail: 'Browser' },
          { value: 'VR', label: 'VR', detail: 'Virtual reality' },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('checkbox', { name: 'WEB Browser' }));
    expect(onChange).toHaveBeenCalledWith(['WEB', 'VR']);
  });
});

describe('V3 error summary (rk-errsum)', () => {
  it('takes focus when it appears; a link focuses the chosen or first available radio', () => {
    render(
      <>
        <ErrorSummary
          title="Check your decision"
          items={[{ fieldId: 'dc-route', summaryText: 'Choose internal or external' }]}
        />
        <ChoiceGroup
          legend="Internal or external"
          id="dc-route"
          name="dc-route"
          value={null}
          onChange={() => undefined}
          options={[
            { value: 'Internal', title: 'Internal: BITS campus or programme' },
            { value: 'External', title: 'External institution' },
          ]}
        />
      </>,
    );
    const summary = screen.getByRole('alert');
    expect(summary.className).toBe('rk-errsum');
    expect(document.activeElement).toBe(summary);
    fireEvent.click(within(summary).getByRole('link', { name: 'Choose internal or external' }));
    expect(document.activeElement).toBe(
      screen.getByRole('radio', { name: 'Internal: BITS campus or programme' }),
    );
  });

  it('renders nothing without items', () => {
    const { container } = render(<ErrorSummary title="Check your decision" items={[]} />);
    expect(container.innerHTML).toBe('');
  });
});

describe('V3 decision helpers', () => {
  it('pending hint, change summary (not live) and locked value', () => {
    const { container } = render(
      <>
        <PendingHint>Choose internal or external before approving.</PendingHint>
        <ChangeSummary title="Different from the request" lines={['Licences: 120 → 100']} />
        <LockedValue>
          Internal or external: <b>External</b>. Set when this institution was first approved.
        </LockedValue>
      </>,
    );
    expect(container.querySelector('.rk-diff')?.getAttribute('role')).toBeNull();
    expect(container.querySelector('p.rk-pending > svg')).not.toBeNull();
    expect(container.querySelector('p.rk-locked > svg.xr-ico.xr-ico--18 + span')).not.toBeNull();
    expectV3ClassesOnly(container);
  });
});

const ROWS: readonly RecordTableRow[] = [
  {
    key: 'a',
    href: '/admin/requests/a',
    title: 'Godavari Institute of Technology',
    titleDetail: 'Meera Iyer',
    linkLabel:
      'Godavari Institute of Technology, additional licences, received 21 Oct 2026, Under review. Open the request',
    what: 'Shell-and-Tube Heat Exchanger',
    kind: 'Additional licences',
    when: '21 Oct 2026',
    status: 'Under review',
  },
];

const HEADERS = {
  who: 'Institution and contact person',
  what: 'Experiments',
  kind: 'Type',
  when: 'Received',
  status: 'Status',
};

function sortOf(direction: 'asc' | 'desc', onToggle = () => undefined): RecordTableSort {
  return {
    header: 'Received',
    direction,
    words: { desc: 'newest first', asc: 'oldest first' },
    onToggle,
  };
}

describe('V3 record table (rk-table)', () => {
  it('a real table with a hidden caption naming the order, explicit roles and aria-sort', () => {
    render(
      <ListSurface label="Institutional access requests">
        <RecordTable
          caption="Institutional access requests"
          headers={HEADERS}
          rows={ROWS}
          sort={sortOf('desc')}
          whenLabel="Received"
        />
      </ListSurface>,
    );
    const table = screen.getByRole('table', {
      name: 'Institutional access requests, received, newest first',
    });
    expect(table.className).toBe('rk-table');
    expect(within(table).getAllByRole('row')).toHaveLength(2);
    expect(within(table).getAllByRole('columnheader')).toHaveLength(5);
    const received = within(table).getByRole('columnheader', { name: /Received/ });
    expect(received.getAttribute('aria-sort')).toBe('descending');
    expect(
      within(received).getByRole('button', { name: 'Received, newest first. Change order' })
        .className,
    ).toBe('rk-sortbtn');
    expect(table.querySelector('td.rk-c-date .rk-inlabel')?.textContent).toBe('Received ');
  });

  it('a press anywhere on the row follows its link; a press on the link itself only once', () => {
    const follow = vi.fn((event: Event) => event.preventDefault());
    render(<RecordTable caption="Requests" headers={HEADERS} rows={ROWS} />);
    const link = screen.getByRole('link', { name: /Open the request/ });
    link.addEventListener('click', follow);
    fireEvent.click(screen.getByText('Shell-and-Tube Heat Exchanger'));
    expect(follow).toHaveBeenCalledTimes(1);
    fireEvent.click(link);
    expect(follow).toHaveBeenCalledTimes(2);
  });

  it('a row inside the V3 shell’s main (`tabIndex=-1`) still opens on a press anywhere', () => {
    const follow = vi.fn((event: Event) => event.preventDefault());
    render(
      <main className="rb-page" id="main" tabIndex={-1}>
        <RecordTable caption="Requests" headers={HEADERS} rows={ROWS} />
      </main>,
    );
    screen.getByRole('link', { name: /Open the request/ }).addEventListener('click', follow);
    fireEvent.click(screen.getByText('Shell-and-Tube Heat Exchanger'));
    expect(follow).toHaveBeenCalledTimes(1);
  });

  it('the sort bar shows only while a table lists rows (nothing to sort otherwise)', () => {
    render(
      <ListSurface label="Requests">
        <SortBar sort={sortOf('asc')} />
      </ListSurface>,
    );
    expect(screen.queryByRole('button', { name: /Sort:/ })).toBeNull();
  });
});

describe('V3 filter toolbar (rk-toolbar)', () => {
  function Toolbar() {
    const [query, setQuery] = useState('Godavari');
    const [status, setStatus] = useState('review');
    const [route, setRoute] = useState('External');
    const [more, setMore] = useState(false);
    const chips = [
      ...(query ? [{ key: 'q', label: `Search: “${query}”`, onRemove: () => setQuery('') }] : []),
      ...(status !== 'all'
        ? [{ key: 'st', label: 'Status: Under review', onRemove: () => setStatus('all') }]
        : []),
      ...(route !== 'all'
        ? [
            {
              key: 'route',
              label: `Internal or external: ${route}`,
              onRemove: () => setRoute('all'),
            },
          ]
        : []),
    ];
    return (
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
            options: [
              { value: 'all', label: 'All statuses' },
              { value: 'review', label: 'Under review' },
            ],
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
              options: [
                { value: 'all', label: 'All' },
                { value: 'External', label: 'External' },
              ],
            },
          ],
        }}
        count={`${chips.length} of 8 requests`}
        chips={chips}
        onClearFilters={() => {
          setQuery('');
          setStatus('all');
          setRoute('all');
        }}
      />
    );
  }

  it('a search landmark; More filters says how many filters it holds', () => {
    render(<Toolbar />);
    expect(screen.getByRole('search', { name: 'Filter requests' })).not.toBeNull();
    const toggle = screen.getByRole('button', { name: 'More filters, 1 applied' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-controls')).toBe('rq-more');
    fireEvent.click(toggle);
    expect(document.getElementById('rq-more')?.className).toBe('rk-more');
    expect(screen.getByRole('status').textContent).toBe('3 of 8 requests');
  });

  it('removing a chip moves focus to the next chip, then the previous, then the search field', () => {
    render(<Toolbar />);
    act(() => screen.getByRole('button', { name: 'Remove filter Status: Under review' }).click());
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Remove filter Internal or external: External' }),
    );
    act(() =>
      screen.getByRole('button', { name: 'Remove filter Internal or external: External' }).click(),
    );
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Remove filter Search: “Godavari”' }),
    );
    act(() => screen.getByRole('button', { name: 'Remove filter Search: “Godavari”' }).click());
    expect(document.activeElement).toBe(screen.getByRole('searchbox', { name: 'Search' }));
  });

  it('Clear filters returns focus to the search field', () => {
    render(<Toolbar />);
    act(() => screen.getByRole('button', { name: 'Clear filters' }).click());
    expect(document.activeElement).toBe(screen.getByRole('searchbox', { name: 'Search' }));
    expect(screen.queryByRole('button', { name: /Remove filter/ })).toBeNull();
  });
});

describe('V3 list states (rk-state)', () => {
  it('a failed load is an alert; no match and empty are not live regions', () => {
    const { rerender, container } = render(
      <ListState kind="failed" title="We couldn’t load the requests">
        Nothing has changed. Try again.
      </ListState>,
    );
    expect(screen.getByRole('alert').className).toBe('rk-state');
    expect(container.querySelector('.rk-state-ico--err')).not.toBeNull();
    rerender(<ListState kind="nomatch" title="No requests match these filters" />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('loading: one polite message over decorative skeleton rows', () => {
    const { container } = render(<LoadingRows message="Loading requests…" />);
    expect(screen.getByRole('status').textContent).toBe('Loading requests…');
    expect(container.querySelectorAll('.rk-skel-row[aria-hidden="true"]')).toHaveLength(3);
    expectV3ClassesOnly(container);
  });
});

describe('V3 tabs (rk-tabs)', () => {
  it('link tabs: navigation with the current page, as IA-02 draws them', () => {
    const { container } = render(
      <LinkTabs
        label="Content access"
        tabs={[
          { label: 'Experiments', href: '#top', current: true },
          { label: 'Course codes', href: '#' },
        ]}
      />,
    );
    expectRenderedAsV3Drawn(
      container.firstElementChild!,
      'IA02.dc.html',
      '<nav class="rk-tabs" aria-label="Content access"><a class="rk-tab" href="#top" aria-current="page">Experiments</a><a class="rk-tab" href="#">Course codes</a></nav>',
    );
  });

  it('in-page tabs: one Tab stop; arrows, Home and End select and focus', () => {
    function Example() {
      const [value, setValue] = useState<'questions' | 'drafts'>('questions');
      return (
        <>
          <Tabs
            label="Question bank"
            idPrefix="qb"
            value={value}
            onChange={setValue}
            tabs={[
              { value: 'questions', label: 'Questions' },
              { value: 'drafts', label: 'Drafts to review' },
            ]}
          />
          <TabPanel idPrefix="qb" value={value}>
            {value}
          </TabPanel>
        </>
      );
    }
    render(<Example />);
    const first = screen.getByRole('tab', { name: 'Questions' });
    expect(first.getAttribute('tabindex')).toBe('0');
    expect(screen.getByRole('tab', { name: 'Drafts to review' }).getAttribute('tabindex')).toBe(
      '-1',
    );
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    const second = screen.getByRole('tab', { name: 'Drafts to review' });
    expect(second.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(second);
    expect(screen.getByRole('tabpanel', { name: 'Drafts to review' }).textContent).toBe('drafts');
    fireEvent.keyDown(second, { key: 'Home' });
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Questions' }));
  });
});

describe('accessibility', () => {
  it('a list surface with toolbar and table has no axe violations', async () => {
    const { container } = render(
      <main>
        <ListSurface label="Institutional access requests">
          <FilterToolbar
            label="Filter requests"
            search={{ id: 's', label: 'Search', value: '', onChange: () => undefined }}
            count="1 request"
          />
          <RecordTable
            caption="Institutional access requests"
            headers={HEADERS}
            rows={ROWS}
            sort={sortOf('desc')}
          />
        </ListSurface>
      </main>,
    );
    await assertNoAxeViolations(container);
    expectV3ClassesOnly(container);
  });
});
