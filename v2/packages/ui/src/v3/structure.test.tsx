/**
 * V3 structure — the workspace shell, overview patterns, plan and term, detail and decision
 * layout, notices and the confirmation dialog (foundation XR-V3-RB-1.0; ADR-0010). Static board
 * sections (SA-01's rail, head and priority band; IA-01's identity band, attention panel and plan
 * sheet; SA-02's events) are compared element for element with the frozen V3 boards. The drawer and
 * dialog behaviour run here with jsdom's stand-ins; their browser behaviour (top layer, inert page,
 * container queries) is proven in apps/specimens/e2e/v3-foundation.spec.ts.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectRenderedAsV3Element,
  expectV3ClassesOnly,
} from '../testing/index.js';
import { AccountMenu } from './account.js';
import { ButtonLink, Button, TextLink } from './actions.js';
import { CourseCode, InstitutionCode } from './codes.js';
import {
  AskRow,
  DecisionOutcome,
  DecisionPanel,
  DefinitionList,
  DetailLayout,
  EventSteps,
  FactStrip,
  Quote,
  Timeline,
} from './detail.js';
import { ConfirmDialog } from './dialog.js';
import { FormatCells } from './formats.js';
import { Banner, Notice, PlanNote } from './notices.js';
import {
  AttentionPanel,
  CategorySwitch,
  IdentityBand,
  OverviewHead,
  PlanSheet,
  PriorityBand,
  QueueGroups,
} from './overview.js';
import { Breadcrumbs, PageHead } from './page.js';
import { CodeKey, CourseGroup, ExperimentCard, PlanBand } from './plan.js';
import { WorkspaceShell, type ShellDestination } from './shell.js';
import { StatusPill } from './status.js';
import { TermTrack } from './term-track.js';

const SA_DESTINATIONS: readonly ShellDestination[] = [
  { label: 'Overview', href: '#top', icon: 'overview', current: true },
  {
    label: 'Requests',
    href: 'SA02.dc.html',
    icon: 'inbox',
    count: { value: 3, label: '3 requests under review' },
  },
  { label: 'Institutions', href: '#', icon: 'institutions' },
  { label: 'Content', href: '#', icon: 'content' },
  { label: 'Academic structure', href: '#', icon: 'academicStructure' },
  { label: 'Platform roles', href: '#', icon: 'platformRoles' },
  { label: 'Operations', href: '#', icon: 'operations' },
];

function SuperAdminShell({ children }: { readonly children?: React.ReactNode }) {
  return (
    <WorkspaceShell
      workspace="Super Admin"
      destinations={SA_DESTINATIONS}
      help={{ href: '#' }}
      topLine="Friday 23 October 2026"
      account={
        <AccountMenu
          name="Arjun Mehta"
          role="Super Admin"
          initials="AM"
          links={[{ label: 'Help & support', href: '/admin/help', icon: 'help' }]}
          signOut={{ label: 'Sign out', onSelect: () => undefined }}
        />
      }
    >
      {children}
    </WorkspaceShell>
  );
}

describe('V3 workspace shell (rb.css)', () => {
  it('the rail is SA-01’s, element for element: reserved logo slot, destinations, count, Help', () => {
    const { container } = render(<SuperAdminShell />);
    expectRenderedAsV3Element(
      container.querySelector('aside.rb-rail')!,
      'SA01.dc.html',
      'aside.rb-rail',
    );
  });

  it('is the V3 root, with the XS skip link first (XS-P1) and one main region', () => {
    const { container } = render(<SuperAdminShell>Page</SuperAdminShell>);
    const root = container.firstElementChild!;
    expect(root.className).toBe('xr rb');
    const skip = root.firstElementChild!;
    expect(skip.textContent).toBe('Skip to main content');
    expect(skip.className).toBe('xs-skip');
    expect(screen.getByRole('main').id).toBe('main');
    expect(screen.getByRole('main').className).toBe('rb-page xs-nofocus');
    fireEvent.click(skip);
    expect(document.activeElement).toBe(screen.getByRole('main'));
    expectV3ClassesOnly(root);
  });

  it('the drawer: focus to Close, Tab stays inside, Esc closes and returns focus to Menu', () => {
    const { container } = render(<SuperAdminShell>Page</SuperAdminShell>);
    const menu = screen.getByRole('button', { name: 'Menu' });
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    act(() => menu.click());
    const drawer = screen.getByRole('dialog', { name: 'Menu' });
    const close = within(drawer).getByRole('button', { name: 'Close menu' });
    expect(document.activeElement).toBe(close);
    expect(container.querySelector('.rb-main')?.hasAttribute('inert')).toBe(true);
    expect(container.querySelector('.rb-scrim')?.getAttribute('aria-hidden')).toBe('true');
    const links = within(drawer).getAllByRole('link');
    const last = links[links.length - 1]!;
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Menu' }));
    expect(container.querySelector('.rb-main')?.hasAttribute('inert')).toBe(false);
  });

  it('the account chrome: the V3 trigger opens the XS panel (XS-P3), focus on its first item', () => {
    const { container } = render(<SuperAdminShell />);
    const trigger = screen.getByRole('button', { name: 'Account menu, Arjun Mehta, Super Admin' });
    expect(trigger.className).toBe('rb-acct');
    expect(trigger.closest('.xs-acct')?.parentElement?.className).toBe('xs-acct-slot');
    act(() => trigger.click());
    const panel = document.getElementById(trigger.getAttribute('aria-controls')!)!;
    expect(panel.className).toBe('xs-menu xs-nofocus');
    expect(panel.closest('[data-xr-v46]')).toBeNull();
    const help = within(panel).getByRole('link', { name: 'Help & support' });
    expect(help.getAttribute('href')).toBe('/admin/help');
    expect(document.activeElement).toBe(help);
    expectV3ClassesOnly(container.firstElementChild!);
    fireEvent.keyDown(panel, { key: 'Escape' });
    expect(document.getElementById(trigger.getAttribute('aria-controls')!)).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('the XS-08 banner is the first thing in the page column', () => {
    render(
      <WorkspaceShell
        workspace="Institute Admin"
        institution="Godavari Institute of Technology"
        destinations={[]}
        help={{ href: '#' }}
        account={null}
        banner={<Banner action={<TextLink href="#">Help</TextLink>}>Paused</Banner>}
      >
        Page
      </WorkspaceShell>,
    );
    expect(screen.getByRole('main').firstElementChild?.className).toBe('rk-banner');
  });

  it('has no axe violations', async () => {
    const { container } = render(<SuperAdminShell>Page</SuperAdminShell>);
    await assertNoAxeViolations(container);
  });
});

describe('V3 overview patterns', () => {
  it('SA-01 head with its figures, element for element', () => {
    const { container } = render(
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
      />,
    );
    expectRenderedAsV3Element(container.firstElementChild!, 'SA01.dc.html', 'header.rb-head');
  });

  it('SA-01 priority band, element for element', () => {
    const { container } = render(
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
              href: 'SA03-renewal.dc.html',
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
      />,
    );
    expectRenderedAsV3Element(container.firstElementChild!, 'SA01.dc.html', 'section.rb-prio');
  });

  it('the category switch announces the change in a few words, not the whole queue', () => {
    function Example() {
      const [value, setValue] = useState<'all' | 'req'>('all');
      return (
        <CategorySwitch
          label="Show what is waiting"
          value={value}
          onChange={setValue}
          announcement={value === 'req' ? 'Requests, 3 items' : ''}
          options={[
            { key: 'all', label: 'All', count: 15 },
            { key: 'req', label: 'Requests', count: 3 },
          ]}
        />
      );
    }
    render(<Example />);
    const group = screen.getByRole('group', { name: 'Show what is waiting' });
    expect(within(group).getByRole('button', { name: 'All 15' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    act(() => within(group).getByRole('button', { name: 'Requests 3' }).click());
    expect(screen.getByRole('status').textContent).toBe('Requests, 3 items');
  });

  it('queue groups: one surface, each group a section named by its heading', () => {
    render(
      <QueueGroups
        idPrefix="q"
        groups={[
          {
            key: 'sup',
            name: 'Support reports',
            icon: 'lifebuoy',
            link: { href: '/admin/operations/support', label: 'Open Support' },
            rows: [
              {
                key: 'r1',
                title: 'Usage page took a long time to load',
                description: 'Meera Iyer, Institute Admin',
                when: { big: '23 days', small: 'sent 30 Sep' },
                action: {
                  href: '#',
                  label: 'Open report',
                  accessibleName: 'Open the report: Usage page took a long time to load',
                },
              },
            ],
          },
        ]}
      />,
    );
    const group = screen.getByRole('region', { name: 'Support reports' });
    expect(within(group).getByRole('link', { name: 'Open Support' }).className).toBe('rb-link');
    expect(
      within(group).getByRole('link', {
        name: 'Open the report: Usage page took a long time to load',
      }).className,
    ).toBe('rb-btn rb-btn--ghost');
  });

  const term = (
    <TermTrack
      label="Yearly term"
      remaining="15 days left"
      start="8 Oct 2026"
      end="7 Oct 2027"
      elapsed={0.9588}
      showRest
      showToday
      description="Access term from 8 October 2026 to 7 October 2027. 349 of 364 days have passed; 15 days are left."
    />
  );

  it('IA-01 identity band with its term and Go to, element for element', () => {
    const { container } = render(
      <IdentityBand
        title="Godavari Institute of Technology"
        titleId="rb-id-h"
        titlePrefix="Overview, "
        date="Wednesday 22 September 2027"
        status={
          <>
            <StatusPill tone="warn">Ending soon</StatusPill>
            <span>Access plan ACC-0107 ends on 7 October 2027.</span>
          </>
        }
        actions={
          <>
            <ButtonLink href="#" size="lg" icon="add" iconSize={20}>
              Add students
            </ButtonLink>
            <ButtonLink href="#" variant="primary" size="lg">
              Give students access
            </ButtonLink>
          </>
        }
        term={term}
        goTo={{
          label: 'Go to',
          links: [
            { href: '#', label: 'Students', icon: 'people' },
            { href: '#', label: 'Faculty', icon: 'faculty' },
            { href: 'IA02.dc.html', label: 'Content access', icon: 'contentAccess' },
            { href: '#', label: 'Requests', icon: 'requests' },
            { href: '#', label: 'Usage', icon: 'usage' },
          ],
        }}
      />,
    );
    expectRenderedAsV3Element(container.firstElementChild!, 'IA01.dc.html', 'section.rb-id');
  });

  it('IA-01 attention panel, element for element', () => {
    const { container } = render(
      <AttentionPanel
        title="Needs your attention"
        titleId="rb-att-h"
        note="5 items"
        lead={{
          icon: 'calendar',
          title: 'Request a renewal',
          description:
            'Your plan ends on 7 October. The reminder is due; nothing is sent automatically.',
          action: { href: '#', label: 'Request renewal' },
        }}
        items={[
          {
            key: 'a',
            count: 2,
            title: 'students are waiting for a licence',
            description: 'Shell-and-Tube Heat Exchanger',
            action: { href: '#', label: 'View students' },
          },
          {
            key: 'b',
            count: 1,
            title: 'device request to forward to BITS',
            description: 'From Imran Shaikh on 18 September. BITS decides after you forward it.',
            action: { href: '#', label: 'Open requests' },
          },
          {
            key: 'c',
            count: 3,
            title: 'students have no access yet',
            description: 'Added on 15 September',
            action: { href: '#', label: 'Review students' },
          },
          {
            key: 'd',
            count: 1,
            title: 'open problem report from your institution',
            description: 'SUP-0213, sent on 20 September',
            action: { href: '#', label: 'View report' },
          },
        ]}
      />,
    );
    expectRenderedAsV3Element(container.firstElementChild!, 'IA01.dc.html', 'section.rb-att');
  });

  it('IA-01 access-plan sheet, element for element', () => {
    const { container } = render(
      <PlanSheet
        title="Your access plan"
        titleId="rb-plan-h"
        link={{ href: '#', label: 'View plan ACC-0107' }}
        facts={[
          { term: 'Licences', value: '120, as approved by BITS' },
          { term: 'Term', value: 'Yearly' },
        ]}
        experiment={{
          title: 'Shell-and-Tube Heat Exchanger',
          course: 'ME ZG523 Thermodynamics & Heat Transfer',
          code: (
            <>
              Your course code <CourseCode code="MEC-523" variant="group" />
            </>
          ),
        }}
        formats={
          <FormatCells
            variant="plan"
            label="Formats of Shell-and-Tube Heat Exchanger"
            cells={[
              { format: 'WEB', state: 'on', name: 'Browser', words: 'In your plan' },
              {
                format: 'AR',
                state: 'pub',
                name: 'Augmented reality',
                words: 'Published, not in your plan',
              },
              { format: 'VR', state: 'on', name: 'Virtual reality', words: 'In your plan' },
              { format: 'MR', state: 'none', name: 'Mixed reality', words: 'Not published' },
            ]}
          />
        }
        foot={{
          text: 'Students open only the formats you give them on Student access.',
          link: { href: 'IA02.dc.html', label: 'Open Content access' },
        }}
      />,
    );
    expectRenderedAsV3Element(container.firstElementChild!, 'IA01.dc.html', 'section.rb-plan');
  });
});

describe('V3 page head “Go to …” (rk-goto)', () => {
  it('with focusId: scrolls to the panel and focuses its heading (SA-v1 goInPanel); without: a plain link', () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    render(
      <>
        <PageHead
          title="Godavari Institute of Technology"
          goTo={{ label: 'Go to actions', targetId: 'in-panel', focusId: 'in-panel-h' }}
        />
        <PageHead title="BITS" goTo={{ label: 'Go to decision', targetId: 'dc-panel' }} />
        <aside id="in-panel">
          <h2 id="in-panel-h" tabIndex={-1}>
            What you can do
          </h2>
        </aside>
      </>,
    );
    const go = screen.getByRole('link', { name: 'Go to actions' });
    expect(go).toHaveAttribute('href', '#in-panel');
    expect(fireEvent.click(go)).toBe(false);
    expect(scroll).toHaveBeenCalledWith({ block: 'start' });
    expect(screen.getByRole('heading', { name: 'What you can do' })).toHaveFocus();
    expect(fireEvent.click(screen.getByRole('link', { name: 'Go to decision' }))).toBe(true);
  });
});

describe('V3 plan band, course group and experiment card (IA-02)', () => {
  it('compose as IA-02 draws them', async () => {
    const { container } = render(
      <main>
        <PlanBand
          kicker="Access plan"
          name="ACC-0107"
          nameId="ca-plan-h"
          status={<StatusPill tone="warn">Ending soon</StatusPill>}
          line="120 licences, as approved by BITS"
          link={{ href: '#', label: 'View plan', accessibleName: 'View access plan ACC-0107' }}
          term={
            <TermTrack
              inPlanBand
              label="Yearly term"
              remaining="Paused"
              remainingTone="paused"
              start="8 Oct 2026"
              end="7 Oct 2027"
              elapsed={0.4}
              paused
              description="Access term from 8 October 2026 to 7 October 2027. Paused."
            />
          }
          note={
            <PlanNote tone="paused" title="Read-only while your institution’s access is paused">
              You can’t give or withdraw access until BITS lifts the pause.
            </PlanNote>
          }
        />
        <CourseGroup
          code={<CourseCode code="ME ZG523" variant="group" />}
          title="Thermodynamics & Heat Transfer"
          titleId="ca-c-1"
          codes={
            <>
              <CodeKey>Your course code</CodeKey>
              <InstitutionCode code="MEC-523" />
            </>
          }
        >
          <ExperimentCard
            title="Shell-and-Tube Heat Exchanger"
            titleId="ca-e-1"
            status={<StatusPill tone="ok">Active</StatusPill>}
            formats={
              <FormatCells
                variant="experiment"
                label="Formats of Shell-and-Tube Heat Exchanger"
                cells={[{ format: 'WEB', state: 'on', name: 'Browser', words: 'In your plan' }]}
              />
            }
            given={{ label: 'Students given access', none: 'None yet' }}
          />
        </CourseGroup>
      </main>,
    );
    expect(screen.getByRole('region', { name: 'ACC-0107' }).className).toBe('rk-plan');
    expect(screen.getByRole('group', { name: 'Thermodynamics & Heat Transfer' }).className).toBe(
      'rk-course',
    );
    expect(screen.getByRole('article', { name: 'Shell-and-Tube Heat Exchanger' }).className).toBe(
      'rk-exp',
    );
    expect(container.querySelector('.rk-given-v.is-none')?.textContent).toBe('None yet');
    expect(container.querySelector('.rb-term-track.rk-track-paused')).not.toBeNull();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('the term track: positions from the elapsed share, clamped, named in words', () => {
    const { container } = render(
      <TermTrack
        label="Yearly term"
        remaining="15 days left"
        start="8 Oct 2026"
        end="7 Oct 2027"
        elapsed={1.4}
        showToday
        description="Access term."
      />,
    );
    expect(screen.getByRole('img', { name: 'Access term.' })).not.toBeNull();
    expect((container.querySelector('.rb-term-fill') as HTMLElement).style.width).toBe('100%');
    expect((container.querySelector('.rb-term-today') as HTMLElement).style.left).toBe('100%');
  });
});

describe('V3 detail and decision layout (rb-kit.css)', () => {
  it('SA-02 “What happens after you decide”, element for element', () => {
    const { container } = render(
      <EventSteps
        steps={[
          {
            title: 'Institution record',
            description:
              'Created when you approve the first request from a new institution. A record is not access.',
          },
          {
            title: 'Request approval',
            description:
              'Your decision on this page. External: the request becomes Approved — payment required. Internal: approved with no payment step.',
          },
          {
            title: 'Payment confirmation',
            description:
              'External only. It happens after the requester pays and is not recorded on this page.',
          },
          {
            title: 'Institutional access activation',
            description:
              'Internal: when you approve. External: only after the payment is confirmed. Students get access only when the institution administrator gives it.',
          },
        ]}
      />,
    );
    expectRenderedAsV3Element(container.firstElementChild!, 'SA02.dc.html', 'ol.rk-events');
  });

  it('composes a record page: head, breadcrumbs, facts, sections, panel, outcome', async () => {
    const { container } = render(
      <main>
        <PageHead
          variant="record"
          title="Godavari Institute of Technology"
          titleId="dc-title"
          titleFocusTarget
          eyebrow="Institutional access request"
          date="Thursday 8 October 2026"
          breadcrumbs={
            <Breadcrumbs
              levels={[{ label: 'Requests', href: '/admin/requests' }]}
              current="Godavari Institute of Technology"
            />
          }
          meta={
            <StatusPill tone="info" size="lg">
              Under review
            </StatusPill>
          }
          goTo={{ label: 'Go to decision', targetId: 'dc-panel' }}
        />
        <DetailLayout
          asideId="dc-panel"
          asideLabelledBy="dc-panel-h"
          main={
            <>
              <FactStrip
                facts={[
                  { term: 'Experiments', value: '1' },
                  { term: 'Internal or external', value: 'Not set yet', quiet: true },
                ]}
              />
              <DefinitionList items={[{ term: 'Contact person', value: 'Meera Iyer' }]} />
              <AskRow
                title="Shell-and-Tube Heat Exchanger"
                course={<CourseCode code="ME ZG523" />}
                formats={null}
              />
              <Quote by="Meera Iyer, contact person">We would like to start this term.</Quote>
              <Timeline events={[{ what: 'Request submitted', when: '2 Oct 2026, 10:14' }]} />
            </>
          }
          aside={
            <DecisionPanel title="Your decision" titleId="dc-panel-h">
              <DecisionOutcome
                status={
                  <StatusPill tone="ok" size="lg">
                    Access active
                  </StatusPill>
                }
                stand={[{ term: 'Payment', value: 'Not needed (internal)' }]}
                next="Institutional access is active."
                action={<ButtonLink href="/admin/requests">Back to requests</ButtonLink>}
              />
            </DecisionPanel>
          }
        />
        <Notice tone="paused" title="This institution is paused" role="status">
          Requests from a paused institution can’t be decided.
        </Notice>
        <Banner action={<ButtonLink href="#">Help</ButtonLink>}>
          Your institution’s access is paused — your work is kept.
        </Banner>
      </main>,
    );
    const title = screen.getByRole('heading', {
      level: 1,
      name: 'Godavari Institute of Technology',
    });
    expect(title.className).toBe('rk-title');
    expect(title.getAttribute('tabindex')).toBe('-1');
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' }).className).toBe('rk-crumbs');
    expect(screen.getByRole('complementary', { name: 'Your decision' }).id).toBe('dc-panel');
    expect(container.querySelector('a.rb-btn.rk-goto')?.getAttribute('href')).toBe('#dc-panel');
    expect(container.querySelector('dd.is-quiet')?.textContent).toBe('Not set yet');
    expect(container.querySelector('.rk-tl > li.is-latest')).not.toBeNull();
    expect(container.querySelector('.rk-done')?.getAttribute('tabindex')).toBe('-1');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

describe('V3 confirmation dialog (rk-dialog, a native dialog)', () => {
  function Example({ onConfirm = vi.fn() }: { readonly onConfirm?: () => void }) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" className="rk-go" onClick={() => setOpen(true)}>
          Approve request
        </Button>
        <ConfirmDialog
          open={open}
          idPrefix="dlg"
          title="Approve the request from Godavari Institute of Technology?"
          description="Check what approving does now, and what happens only after later events."
          groups={[
            { kind: 'now', title: 'What happens now', items: ['Approves the request.'] },
            {
              kind: 'later',
              title: 'Only after later events',
              items: ['Students get access only when the institution administrator gives it.'],
            },
          ]}
          confirmLabel="Approve request"
          onConfirm={() => {
            onConfirm();
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </>
    );
  }

  it('opening focuses the title; Shift+Tab from it goes round to the confirm button', () => {
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Approve request' });
    trigger.focus();
    act(() => trigger.click());
    const dialog = document.querySelector('dialog.rk-dialog') as HTMLDialogElement;
    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute('aria-labelledby')).toBe('dlg-t');
    expect(dialog.getAttribute('aria-describedby')).toBe('dlg-d');
    expect(document.activeElement).toBe(document.getElementById('dlg-t'));
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    const buttons = within(dialog).getAllByRole('button', { hidden: true });
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
    expect(dialog.querySelectorAll('.rk-dlg-now li svg, .rk-dlg-later li svg')).toHaveLength(2);
  });

  it('Esc is Cancel: the dialog closes and focus returns to the decision button', () => {
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Approve request' });
    trigger.focus();
    act(() => trigger.click());
    const dialog = document.querySelector('dialog.rk-dialog') as HTMLDialogElement;
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('confirm runs the caller’s command once', () => {
    const onConfirm = vi.fn();
    render(<Example onConfirm={onConfirm} />);
    const trigger = screen.getByRole('button', { name: 'Approve request' });
    act(() => trigger.click());
    const dialog = document.querySelector('dialog.rk-dialog') as HTMLDialogElement;
    const confirm = within(dialog).getAllByRole('button', { hidden: true }).at(-1)!;
    act(() => confirm.click());
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expectV3ClassesOnly(dialog);
  });
});
