/**
 * The Super Admin's request screens (owner-approved export design/v3-refined-b/roles/SA-v1,
 * `project/sa-views-a.js` `V.overview`, `groupHtml`, `formHtml`): SA-01's queue (the kit's
 * `QueueGroups` with its quiet line) and its loading, failed and calm surfaces (this group's
 * `QueueLoading`, `QueueFrame`, `QueueCalm`); SA-03's "Check your decision" with and without lines
 * (the kit's `ErrorSummary` `alwaysShown`) and the fields a refusal can mark without words
 * (`TextInput` / `Select` `invalid`). Markup against the export's classes and ARIA, the class
 * contract and the accessibility checks. The panel's button is `GoButton` (`sa.test.tsx`).
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectNoInternalReferences,
  expectV3ClassesOnly,
  saExportText,
} from '../testing/index.js';
import { Button } from './actions.js';
import { ErrorSummary, Field, Select, TextInput } from './fields.js';
import { ListState } from './list.js';
import { QueueGroups } from './overview.js';
import { QueueCalm, QueueFrame, QueueLoading } from './sa-requests.js';

const VIEWS = saExportText('sa-views-a.js');

const ROW = {
  key: 'konark',
  title: 'Konark Polytechnic asks for additional licences',
  description: 'Additional licences for Buck Converter Ripple.',
  when: { big: '24 days', small: 'since 29 Sep' },
  action: {
    href: '/admin/requests/konark',
    label: 'Open request',
    accessibleName: 'Open the additional licences request from Konark Polytechnic',
  },
};

describe('the overview queue (`div.rb-queue`; SA-01)', () => {
  it('draws each group as the export’s `groupHtml`: tile, name, destination, rows', async () => {
    for (const piece of [
      '<section class="rb-g" aria-label="',
      '<div class="rb-g-head"><span class="rb-ico-tile" aria-hidden="true">',
      '<h3 class="rb-g-name">',
      '<a class="rb-link" href="',
      '<ul class="rb-rows">',
      '<li class="rb-row"><div class="rb-row-main"><p class="rb-row-t">',
      '<p class="rb-row-d">',
      "<p class=\"rb-row-when' + (r.due ? ' rb-row-when--due' : '') + '\"><b>",
      '<div class="rb-row-act"><a class="rb-btn rb-btn--ghost" href="',
    ]) {
      expect(VIEWS).toContain(piece);
    }
    const { container } = render(
      <QueueGroups
        idPrefix="ov-g"
        groups={[
          {
            key: 'requests',
            name: 'Requests',
            icon: 'inbox',
            link: { href: '/admin/requests', label: 'Open Requests' },
            rows: [ROW],
            quiet: 'No request is waiting for your decision.',
          },
          {
            key: 'accessEnding',
            name: 'Access ending within 15 days',
            icon: 'calendar',
            link: { href: '/admin/operations/access-ending', label: 'Open Access ending' },
            rows: [
              {
                ...ROW,
                key: 'end',
                title: 'Konark Polytechnic',
                when: { big: 'In 10 days', small: '2 Nov', due: true },
              },
            ],
          },
        ]}
      />,
    );
    const queue = container.firstElementChild!;
    expect(queue.className).toBe('rb-queue');
    const group = screen.getByRole('region', { name: 'Requests' });
    expect(group.className).toBe('rb-g');
    expect(group.querySelector('.rb-g-head > .rb-ico-tile')).toHaveAttribute('aria-hidden', 'true');
    expect(within(group).getByRole('heading', { level: 3, name: 'Requests' })).toHaveClass(
      'rb-g-name',
    );
    expect(within(group).getByRole('link', { name: 'Open Requests' })).toHaveClass('rb-link');
    const row = group.querySelector('li.rb-row')!;
    expect(row.querySelector('.rb-row-t')).toHaveTextContent(ROW.title);
    expect(row.querySelector('.rb-row-d')).toHaveTextContent(ROW.description);
    expect(row.querySelector('.rb-row-when')!.className).toBe('rb-row-when');
    expect(row.querySelector('.rb-row-when b')).toHaveTextContent('24 days');
    expect(row.querySelector('.rb-row-when span')).toHaveTextContent('since 29 Sep');
    const open = within(row as HTMLElement).getByRole('link', {
      name: 'Open the additional licences request from Konark Polytechnic',
    });
    expect(open.className).toBe('rb-btn rb-btn--ghost');
    expect(open).toHaveAttribute('href', '/admin/requests/konark');
    expect(open).toHaveTextContent('Open request');
    expect(
      screen
        .getByRole('region', { name: 'Access ending within 15 days' })
        .querySelector('.rb-row-when')!.className,
    ).toBe('rb-row-when rb-row-when--due');
    expectV3ClassesOnly(container);
    expectNoInternalReferences(container);
    await assertNoAxeViolations(container);
  });

  it('a group with nothing in it says so in its quiet line (`p.sa-quietrow`)', async () => {
    expect(VIEWS).toContain(
      "'<p class=\"sa-quietrow\">' + SA.ico('rki-check', '') + '<span>' + esc(g.quiet) + '</span></p>'",
    );
    const { container } = render(
      <QueueGroups
        idPrefix="ov-g"
        groups={[
          {
            key: 'stuck',
            name: 'Stuck content',
            icon: 'hourglass',
            link: { href: '/admin/content/all', label: 'Open All content' },
            rows: [],
            quiet: 'Nothing is stuck in the content workflow.',
          },
        ]}
      />,
    );
    const group = screen.getByRole('region', { name: 'Stuck content' });
    expect(group.querySelector('ul')).toBeNull();
    const quiet = group.querySelector('p.sa-quietrow')!;
    expect(quiet.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(quiet.querySelector('span')).toHaveTextContent(
      'Nothing is stuck in the content workflow.',
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('loading: the line over three skeleton rows inside a busy queue section', async () => {
    expect(VIEWS).toContain(
      '<section class="rb-queue" aria-busy="true"><p class="rk-loading-msg" role="status"',
    );
    const { container } = render(<QueueLoading message="Loading what is waiting…" />);
    const section = container.firstElementChild!;
    expect(section.tagName).toBe('SECTION');
    expect(section.className).toBe('rb-queue');
    expect(section).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Loading what is waiting…');
    expect(screen.getByRole('status').className).toBe('rk-loading-msg rk-x-queue-flush');
    // The export's inline `padding-left:0` / `padding-left:0;padding-right:0` (V3P-12).
    expect(VIEWS).toContain(
      '<p class="rk-loading-msg" role="status" style="padding-left:0">Loading what is waiting…</p>',
    );
    expect(VIEWS).toContain(
      '<div class="rk-skel-row" aria-hidden="true" style="padding-left:0;padding-right:0">',
    );
    const rows = section.querySelectorAll('.rk-skel-row');
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.className).toBe('rk-skel-row rk-x-queue-flush');
      expect(row).toHaveAttribute('aria-hidden', 'true');
      expect([...row.children].map((cell) => cell.querySelectorAll('.rk-skel').length)).toEqual([
        2, 1, 0, 0, 1,
      ]);
    }
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('failed: the kit’s failed state in the queue section, its Try again the caller’s', async () => {
    expect(VIEWS).toContain(
      "'<section class=\"rb-queue\">' + SA.listState('failed', { failed: 'We couldn’t load what is waiting' })",
    );
    const retry = vi.fn();
    const { container } = render(
      <QueueFrame>
        <ListState
          kind="failed"
          title="We couldn’t load what is waiting"
          action={<Button onClick={retry}>Try again</Button>}
        >
          Nothing has changed. Try again.
        </ListState>
      </QueueFrame>,
    );
    expect(container.firstElementChild!.outerHTML.startsWith('<section class="rb-queue">')).toBe(
      true,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('We couldn’t load what is waiting');
    act(() => screen.getByRole('button', { name: 'Try again' }).click());
    expect(retry).toHaveBeenCalledTimes(1);
    expectV3ClassesOnly(container);
  });

  it('nothing waiting: the calm block names the queue section', async () => {
    expect(VIEWS).toContain(
      '<section class="rb-queue" aria-labelledby="ov-calm-t"><div class="rb-calm"><span class="rb-calm-ico" aria-hidden="true">',
    );
    const { container } = render(
      <QueueCalm title="Nothing is waiting" titleId="ov-calm-t">
        Requests, corrections to release … appear here when they need you.
      </QueueCalm>,
    );
    const section = screen.getByRole('region', { name: 'Nothing is waiting' });
    expect(section.className).toBe('rb-queue');
    expect(section.querySelector('.rb-calm > .rb-calm-ico')).toHaveAttribute('aria-hidden', 'true');
    expect(section.querySelector('p.rb-calm-t')).toHaveAttribute('id', 'ov-calm-t');
    expect(section.querySelector('p.rb-calm-d')).toHaveTextContent(
      'Requests, corrections to release … appear here when they need you.',
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

describe('the decision panel’s checks (SA-03 `formHtml`)', () => {
  it('“Check your decision”: an alert that takes focus, each line a link to its field', async () => {
    expect(VIEWS).toContain(
      '<div class="rk-errsum" id="dc-errs" tabindex="-1" role="alert"><p class="rk-errsum-t">Check your decision</p><ul>',
    );
    const { container } = render(
      <>
        <ErrorSummary
          id="dc-errs"
          title="Check your decision"
          alwaysShown
          autoFocus={false}
          items={[
            { fieldId: 'decision-route', summaryText: 'Choose internal or external' },
            { fieldId: 'decision-reason', summaryText: 'Enter the reason for the change' },
          ]}
        />
        <fieldset id="decision-route">
          <legend>Internal or external</legend>
          <label>
            <input type="radio" name="route" /> Internal
          </label>
        </fieldset>
        <Field label="Reason for the change (required)" id="decision-reason">
          <TextInput />
        </Field>
      </>,
    );
    const summary = screen.getByRole('alert');
    expect(summary.className).toBe('rk-errsum');
    expect(summary).toHaveAttribute('tabindex', '-1');
    expect(summary.querySelector('p.rk-errsum-t')).toHaveTextContent('Check your decision');
    const links = within(summary).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '#decision-route',
      '#decision-reason',
    ]);
    fireEvent.click(links[1]!);
    expect(screen.getByLabelText('Reason for the change (required)')).toHaveFocus();
    fireEvent.click(links[0]!);
    expect(screen.getByRole('radio', { name: 'Internal' })).toHaveFocus();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('a refusal with no words: the title alone, still an alert and focusable', () => {
    const { container } = render(
      <ErrorSummary title="Check your decision" items={[]} alwaysShown autoFocus={false} />,
    );
    const summary = screen.getByRole('alert');
    expect(summary.querySelector('ul')).toBeNull();
    expect(summary).toHaveTextContent('Check your decision');
    act(() => summary.focus());
    expect(summary).toHaveFocus();
    expectV3ClassesOnly(container);
  });

  it('a field marked without words, or by its Field’s error; otherwise valid', async () => {
    const { container, rerender } = render(
      <>
        <Field label="Licences to approve" id="decision-licences">
          <TextInput inputMode="numeric" invalid defaultValue="80" />
        </Field>
        <Field label="Access term" id="decision-term">
          <Select
            invalid={false}
            defaultValue="monthly"
            options={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
            ]}
          />
        </Field>
      </>,
    );
    const licences = screen.getByLabelText('Licences to approve');
    expect(licences.className).toBe('rk-input');
    expect(licences).toHaveAttribute('aria-invalid', 'true');
    expect(licences).not.toHaveAttribute('aria-describedby');
    const term = screen.getByLabelText('Access term');
    expect(term.className).toBe('rk-select');
    expect(term.parentElement!.className).toBe('rk-selwrap');
    expect(term).not.toHaveAttribute('aria-invalid');
    rerender(
      <>
        <Field label="Licences to approve" id="decision-licences">
          <TextInput inputMode="numeric" defaultValue="80" />
        </Field>
        <Field label="Access term" id="decision-term" error="Choose a term">
          <Select
            defaultValue="monthly"
            options={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
            ]}
          />
        </Field>
      </>,
    );
    expect(screen.getByLabelText('Licences to approve')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByLabelText('Access term')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Access term')).toHaveAttribute(
      'aria-describedby',
      'decision-term-e',
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});
