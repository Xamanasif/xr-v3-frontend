/**
 * The Super Admin markup more than one screen draws, each once (owner-approved export
 * design/v3-refined-b/roles/SA-v1, `project/sa-views-*.js`, `sa-core.js`): `sa.tsx`'s view switch
 * (`SwitchToolbar`; SA-10, SA-18, SA-20), panel button (`GoButton`), section note (`SectionNote`),
 * quiet line (`QuietLine`) and inline form (`InlineForm`), the role's own `sa-` patterns (the GL-04
 * message, action groups, waiting list, read-only table, record list, footnote, bullets), and the
 * kit's arrangements the export
 * adds — the decided panel without a "where it stands" list and with what follows (SA-11, SA-19,
 * SA-21), the stand list on its own (SA-13), the detail page stacked or without a panel (SA-07,
 * SA-13), a quote without a by-line, the inline spacings of V3P-12. Markup against the export's
 * classes and ARIA, the class contract and the accessibility checks.
 */
import { act, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectNoInternalReferences,
  expectV3ClassesOnly,
  saExportText,
} from '../testing/index.js';
import { Button } from './actions.js';
import {
  AskList,
  AskRow,
  DecisionOutcome,
  DetailLayout,
  Quote,
  RecordLine,
  StandList,
} from './detail.js';
import { Field, Hint, Textarea } from './fields.js';
import { Notice } from './notices.js';
import { SectionHead } from './page.js';
import {
  ActionGroup,
  ActionValue,
  Bullets,
  ButtonRow,
  Footnote,
  GoButton,
  InlineForm,
  QuietLine,
  ReadOnlyTable,
  RecordList,
  SaMessage,
  SectionNote,
  SwitchToolbar,
  WaitingList,
} from './sa.js';
import { StatusPill } from './status.js';
import { scrollCurrentIntoView } from './tabs.js';

const A = saExportText('sa-views-a.js');
const B = saExportText('sa-views-b.js');
const C = saExportText('sa-views-c.js');
const D = saExportText('sa-views-d.js');
const VIEWS = [A, B, C, D].join('\n');

describe('SwitchToolbar (`div.rk-toolbar` > `sa-seg`; the export’s `SA.seg`)', () => {
  type Show = 'forwarded' | 'with-institution' | 'approved';

  function Example({
    onChange = vi.fn(),
    counts = true,
    hint,
  }: {
    readonly onChange?: (key: Show) => void;
    readonly counts?: boolean;
    readonly hint?: string;
  }) {
    const [value, setValue] = useState<Show>('forwarded');
    return (
      <SwitchToolbar
        label="Show device transfers"
        value={value}
        onChange={(key) => {
          setValue(key);
          onChange(key);
        }}
        options={[
          { key: 'forwarded', label: 'Forwarded to BITS', ...(counts ? { count: 2 } : {}) },
          {
            key: 'with-institution',
            label: 'Still with an institution',
            ...(counts ? { count: 1 } : {}),
          },
          { key: 'approved', label: 'Approved', ...(counts ? { count: 1 } : {}) },
        ]}
        hint={hint}
      />
    );
  }

  it('draws the export’s toolbar and switch: a named group of pressed buttons with their counts', async () => {
    for (const piece of [
      '<div class="rb-switchbar sa-seg"><div class="rb-switch" role="group" aria-label="',
      'aria-pressed="',
      "'<b>' + x[2] + '</b></button>'",
      "<div class=\"rk-toolbar\">' + seg(tabs, tab, 'updTab', 'Show corrections') + '</div>'",
    ]) {
      expect(C).toContain(piece);
    }
    for (const piece of [
      "<div class=\"rk-toolbar\">' + SA.seg(tabs, tab, 'dtrTab', 'Show device transfers') + '</div>'",
      "<div class=\"rk-toolbar\">' + SA.seg(tabs, tab, 'supTab', 'Show support reports') + '<p class=\"rk-hint\">",
    ]) {
      expect(D).toContain(piece);
    }
    const { container } = render(<Example />);
    const toolbar = container.firstElementChild!;
    expect(toolbar.className).toBe('rk-toolbar');
    expect(toolbar.children).toHaveLength(1);
    const bar = toolbar.firstElementChild!;
    expect(bar.className).toBe('rb-switchbar sa-seg');
    const group = screen.getByRole('group', { name: 'Show device transfers' });
    expect(group.className).toBe('rb-switch');
    expect(group.parentElement).toBe(bar);
    const buttons = within(group).getAllByRole('button');
    expect(buttons.map((button) => button.getAttribute('type'))).toEqual([
      'button',
      'button',
      'button',
    ]);
    expect(buttons.map((button) => button.getAttribute('aria-pressed'))).toEqual([
      'true',
      'false',
      'false',
    ]);
    expect(buttons.map((button) => button.querySelector('b')?.textContent)).toEqual([
      '2',
      '1',
      '1',
    ]);
    // The name reads the label and the count apart: "Still with an institution 1".
    expect(screen.getByRole('button', { name: 'Still with an institution 1' })).toBe(buttons[1]);
    expectV3ClassesOnly(container);
    expectNoInternalReferences(container);
    await assertNoAxeViolations(container);
  });

  it('a press selects its view and tells the caller; the pressed state moves with it', () => {
    const onChange = vi.fn();
    render(<Example onChange={onChange} />);
    const approved = screen.getByRole('button', { name: 'Approved 1' });
    act(() => approved.click());
    expect(onChange).toHaveBeenCalledWith('approved');
    expect(approved).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Forwarded to BITS 2' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('while the counts are not known the buttons carry no figure; the hint follows the switch', () => {
    const { container } = render(
      <Example counts={false} hint="Sent from Help by anyone signed in · oldest first" />,
    );
    const group = screen.getByRole('group', { name: 'Show device transfers' });
    expect(group.querySelectorAll('b')).toHaveLength(0);
    expect(within(group).getByRole('button', { name: 'Approved' })).toBeVisible();
    const toolbar = container.firstElementChild!;
    expect([...toolbar.children].map((child) => `${child.tagName} ${child.className}`)).toEqual([
      'DIV rb-switchbar sa-seg',
      'P rk-hint',
    ]);
    expect(toolbar.lastElementChild).toHaveTextContent(
      'Sent from Help by anyone signed in · oldest first',
    );
    expectV3ClassesOnly(container);
  });

  it('a row wider than its place scrolls its current item into sight, 16 px from the start', () => {
    expect(saExportText('sa-core.js')).toContain(
      'if (box.scrollWidth > box.clientWidth) box.scrollLeft = Math.max(0, el.offsetLeft - box.offsetLeft - 16);',
    );
    const row = document.createElement('div');
    const current = document.createElement('button');
    current.setAttribute('aria-pressed', 'true');
    row.append(current);
    const measure = (element: HTMLElement, values: Record<string, number>) => {
      for (const [name, value] of Object.entries(values)) {
        Object.defineProperty(element, name, { configurable: true, value });
      }
    };
    measure(row, { scrollWidth: 600, clientWidth: 343, offsetLeft: 16 });
    measure(current, { offsetLeft: 420 });
    scrollCurrentIntoView(row, '[aria-pressed="true"]');
    expect(row.scrollLeft).toBe(388);
    // A row that fits is left alone.
    row.scrollLeft = 0;
    measure(row, { scrollWidth: 343 });
    scrollCurrentIntoView(row, '[aria-pressed="true"]');
    expect(row.scrollLeft).toBe(0);
  });
});

describe('GoButton (`button.rb-btn.rb-btn--primary.rk-go`)', () => {
  it('is the panel’s one gold decision across its width; busy says so and ignores the press', () => {
    for (const id of ['dc-go', 'up-go', 'rc-go', 'ho-go', 'tr-go', 'sp-go']) {
      expect(VIEWS).toContain(
        `<button type="button" class="rb-btn rb-btn--primary rk-go" id="${id}"`,
      );
    }
    expect(B).toContain(
      '<button type="button" class="rb-btn rb-btn--primary rk-go" id="in-assign"',
    );
    const onClick = vi.fn();
    const { container, rerender } = render(<GoButton onClick={onClick}>Assign scope</GoButton>);
    const button = screen.getByRole('button', { name: 'Assign scope' });
    expect(button.className).toBe('rb-btn rb-btn--primary rk-go');
    expect(button).toHaveAttribute('type', 'button');
    act(() => button.click());
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(
      <GoButton onClick={onClick} busy busyLabel="Assigning…">
        Assign scope
      </GoButton>,
    );
    expect(button).toHaveTextContent('Assigning…');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    act(() => button.click());
    expect(onClick).toHaveBeenCalledTimes(1);
    expectV3ClassesOnly(container);
  });
});

describe('SectionNote, QuietLine, InlineForm', () => {
  it('the note beside a heading is the plain paragraph the undefined `rk-note` renders as', () => {
    for (const note of [
      'Changed fields only',
      'Read-only',
      'Newest first',
      'Four separate events',
    ]) {
      expect(VIEWS).toContain(`<p class="rk-note">${note}</p>`);
    }
    const { container } = render(<SectionNote>Newest first</SectionNote>);
    expect(container.innerHTML).toBe('<p>Newest first</p>');
  });

  it('the quiet line, and alone in a table cell without its 2 px above (`flush`, V3P-12)', () => {
    expect(B).toContain('<span class="rk-small">Assigned once access is active</span>');
    for (const cell of [
      '<td class="rk-c-type"><span class="rk-small" style="margin:0">\' + esc(SA.whoCanAct(c))',
      '<td class="rk-c-type"><span class="rk-small" style="margin:0">\' + esc(x.email)',
      '<td class="rk-c-type"><span class="rk-small" style="margin:0">\' + esc(t.fwdBy',
      '<td class="rk-c-type"><span class="rk-small" style="margin:0">\' + esc(s.where)',
    ]) {
      expect(VIEWS).toContain(cell);
    }
    const { container } = render(
      <>
        <QuietLine>Assigned once access is active</QuietLine>
        <QuietLine flush>k.iyer@wilp.example</QuietLine>
      </>,
    );
    expect(container.innerHTML).toBe(
      '<span class="rk-small">Assigned once access is active</span><span class="rk-small rk-x-small-flush">k.iyer@wilp.example</span>',
    );
    expectV3ClassesOnly(container);
  });

  it('the inline form under its row: the field, then its buttons', async () => {
    expect(B).toContain("(open ? '<div class=\"sa-inline\">' + SA.field({ id: 'stu-r-' + n");
    expect(D).toContain("(open ? '<div class=\"sa-inline\">' + SA.field({ id: 'wd-r-' + i");
    const { container } = render(
      <InlineForm>
        <Field id="wd-r-0" label="Reason for withdrawing ME ZG523">
          <Textarea />
        </Field>
        <ButtonRow>
          <Button variant="navy">Withdraw</Button>
          <Button>Cancel</Button>
        </ButtonRow>
      </InlineForm>,
    );
    const form = container.firstElementChild!;
    expect(form.className).toBe('sa-inline');
    expect([...form.children].map((child) => child.className)).toEqual(['rk-field', 'sa-btnrow']);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

describe('the decided panel without a stand list (`div.rk-done`; SA-11 on hold, SA-19, SA-21)', () => {
  it('SA-11 on hold: the status, who held it, the reason alone, the notice, Lift hold and its hint', async () => {
    for (const piece of [
      '<div class="rk-done" id="up-done" tabindex="-1"><p>',
      '<p class="rk-done-meta">Put on hold on ',
      "'<blockquote class=\"rk-quote\"><p>' + esc(u.hold.reason) + '</p></blockquote>'",
      '<div class="rk-notice rk-notice--paused" role="status">',
    ]) {
      expect(C).toContain(piece);
    }
    const { container } = render(
      <DecisionOutcome
        id="update-decided"
        status={
          <StatusPill tone="paused" size="lg">
            On hold
          </StatusPill>
        }
        meta="Put on hold on 20 Aug 2026 by Arjun Mehta"
      >
        <Quote>Wait for the lab to confirm the new build.</Quote>
        <Notice
          tone="paused"
          icon="lock"
          role="status"
          title="Release isn’t available while the update is on hold"
        >
          Lift the hold first. It goes back to waiting for your decision; nothing goes live by
          itself.
        </Notice>
        <GoButton>Lift hold</GoButton>
        <Hint>
          What else a hold affects, and whether it blocks later corrections, is still open.
        </Hint>
      </DecisionOutcome>,
    );
    const done = container.querySelector('div.rk-done#update-decided')!;
    expect(done).toHaveAttribute('tabindex', '-1');
    expect([...done.children].map((child) => `${child.tagName} ${child.className}`)).toEqual([
      'P ',
      'P rk-done-meta',
      'BLOCKQUOTE rk-quote',
      'DIV rk-notice rk-notice--paused',
      'BUTTON rb-btn rb-btn--primary rk-go',
      'P rk-hint',
    ]);
    expect(done.firstElementChild?.firstElementChild?.className).toBe(
      'xr-st xr-st--paused rk-st-lg',
    );
    // A reason in the held panel stands alone; a named quote carries its by-line.
    expect(done.querySelector('blockquote')?.children).toHaveLength(1);
    expectV3ClassesOnly(container);
    expectNoInternalReferences(container);
    await assertNoAxeViolations(container);
  });

  it('SA-19 approved: the status, who and when, then the next line; it takes focus', async () => {
    expect(D).toContain(
      '<div class="rk-done" id="tr-done" tabindex="-1"><p>\' + SA.pill(\'ok\', \'Approved\', true) + \'</p><p class="rk-done-meta">Approved on',
    );
    const { container } = render(
      <DecisionOutcome
        id="tr-done"
        status={
          <StatusPill tone="ok" size="lg">
            Approved
          </StatusPill>
        }
        meta="Approved on 24 Oct 2026, 12:30 by Arjun Mehta"
      >
        <RecordLine>
          Rahul Verma and the Institute Admin see “Approved”. This decision is read-only.
        </RecordLine>
      </DecisionOutcome>,
    );
    const done = container.firstElementChild as HTMLElement;
    expect(done.className).toBe('rk-done');
    expect(done.querySelector('dl')).toBeNull();
    expect([...done.children].map((child) => child.className)).toEqual([
      '',
      'rk-done-meta',
      'rk-next',
    ]);
    act(() => done.focus());
    expect(done).toHaveFocus();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('a quote with whose words they are, and the stand list on its own (SA-13 From · To)', () => {
    expect(C).toContain(
      '<dl class="rk-stand"><div><dt>From</dt><dd>With the Academic Reviewer</dd></div><div><dt>To</dt><dd>Returned to the vendor</dd></div></dl>',
    );
    const { container } = render(
      <>
        <Quote by="Kavya Nair, Content Manager">Corrects the reflux statement.</Quote>
        <StandList
          items={[
            { term: 'From', value: 'With the Academic Reviewer' },
            { term: 'To', value: 'Returned to the vendor' },
          ]}
        />
      </>,
    );
    expect(container.innerHTML).toBe(
      '<blockquote class="rk-quote"><p>Corrects the reflux statement.</p><p class="rk-quote-by">Kavya Nair, Content Manager</p></blockquote>' +
        '<dl class="rk-stand"><div><dt>From</dt><dd>With the Academic Reviewer</dd></div><div><dt>To</dt><dd>Returned to the vendor</dd></div></dl>',
    );
    expectV3ClassesOnly(container);
  });
});

describe('DetailLayout as the Super Admin export arranges it', () => {
  it('SA-13 with nothing to decide: the record’s sheet alone, the page’s width (`sa-single`)', async () => {
    expect(C).toContain(
      "'<div class=\"rk-detailwrap\"><div class=\"' + (stuck ? 'rk-detail' : 'sa-single') + '\"><div class=\"rk-surface rk-mainsheet\">",
    );
    const { container } = render(<DetailLayout main={<p>Catalogue details</p>} />);
    expect(container.innerHTML).toBe(
      '<div class="rk-detailwrap"><div class="sa-single"><div class="rk-surface rk-mainsheet"><p>Catalogue details</p></div></div></div>',
    );
    expect(screen.queryByRole('complementary')).toBeNull();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('SA-07: the record column a stack of the caller’s surfaces beside the panel', () => {
    expect(B).toContain(
      '<div class="rk-detailwrap"><div class="rk-detail"><div class="sa-stack"><div class="rk-surface rk-mainsheet">',
    );
    const { container } = render(
      <DetailLayout
        stacked
        asideId="in-panel"
        asideLabelledBy="in-panel-h"
        main={<p>Sheets</p>}
        aside={<h2 id="in-panel-h">What you can do</h2>}
      />,
    );
    expect(container.innerHTML).toBe(
      '<div class="rk-detailwrap"><div class="rk-detail"><div class="sa-stack"><p>Sheets</p></div><aside class="rk-aside" id="in-panel" aria-labelledby="in-panel-h"><h2 id="in-panel-h">What you can do</h2></aside></div></div>',
    );
    expectV3ClassesOnly(container);
  });
});

describe('V3P-12: the export’s inline spacings, as props of the elements they space', () => {
  it('the notes under a table or a list, the lines and list of SA-07, SA-01’s head', () => {
    for (const styled of [
      '<p class="rk-hint" style="margin-top:10px">Per format, never added up into one figure.',
      '<p class="rk-hint" style="margin-top:10px">“Live before” is the version',
      '<p class="rk-hint" style="margin-top:10px">Release changes the experiment for everyone',
      '</dl><p class="rk-hint" style="margin-top:12px">How they first sign in is still open.',
      '</blockquote><p class="rk-next" style="margin-top:12px">Its Institute Admin',
      '<p class="rk-next" style="margin-top:12px"><a class="rb-link" href="#/requests/',
      '<p class="rk-next" style="margin-bottom:12px">The Institute Admin manages people.',
      '<div class="rk-ask" style="margin-top:14px">',
      '<div class="rb-sec-head" style="margin-bottom: -12px"><h2 class="rb-h2">Also waiting on you</h2>',
    ]) {
      expect(VIEWS).toContain(styled);
    }
    const { container } = render(
      <>
        <Hint under="table">Per format, never added up into one figure.</Hint>
        <Hint under="list">How they first sign in is still open.</Hint>
        <Hint>No response-time target is set.</Hint>
        <RecordLine space="above">Its Institute Admin, Faculty and Students see …</RecordLine>
        <RecordLine space="below">The Institute Admin manages people.</RecordLine>
        <RecordLine>No access plan yet.</RecordLine>
        <AskList space="above">
          <AskRow title="Distillation Column" formats={null} />
        </AskList>
        <AskList>
          <AskRow title="Buck Converter Ripple" formats={null} />
        </AskList>
        <SectionHead title="Also waiting on you" tight />
        <SectionHead title="Needs attention first" />
      </>,
    );
    expect([...container.children].map((child) => child.className)).toEqual([
      'rk-hint rk-x-hint-table',
      'rk-hint rk-x-hint-list',
      'rk-hint',
      'rk-next rk-x-next-above',
      'rk-next rk-x-next-below',
      'rk-next',
      'rk-ask rk-x-ask-above',
      'rk-ask',
      'rb-sec-head rk-x-sec-head-tight',
      'rb-sec-head',
    ]);
    expectV3ClassesOnly(container);
  });
});

describe('the role’s own patterns (`sa-role.css`)', () => {
  it('the GL-04 message: the disc, the H1 that takes focus, one sentence, the ways on', async () => {
    expect(D).toContain(
      '<div class="sa-msg"><span class="sa-msg-ico" aria-hidden="true">\' + SA.ico(o.ico || \'rki-info\', \'\') + \'</span><h1 class="rk-title" id="page-h1" tabindex="-1">',
    );
    const { container } = render(
      <SaMessage
        title="This page isn’t available"
        actions={
          <>
            <Button variant="primary">Back to Overview</Button>
            <Button>Help &amp; support</Button>
          </>
        }
      >
        The address may be incomplete. Nothing has changed.
      </SaMessage>,
    );
    const message = container.firstElementChild!;
    expect(message.className).toBe('sa-msg');
    expect([...message.children].map((child) => `${child.tagName} ${child.className}`)).toEqual([
      'SPAN sa-msg-ico',
      'H1 rk-title',
      'P rk-sub',
      'DIV sa-btnrow',
    ]);
    const title = screen.getByRole('heading', { level: 1, name: 'This page isn’t available' });
    expect(title).toHaveAttribute('id', 'page-h1');
    expect(title).toHaveAttribute('tabindex', '-1');
    expect(message.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('a panel’s action groups: the name, what stands with its line, what else waits', async () => {
    for (const piece of [
      '<div class="sa-act"><p class="sa-act-k">Institute Admin</p>',
      "'<p class=\"sa-act-v\">' + esc(ia) + (i.iaEmail ? '<span>' + esc(i.iaEmail) + '</span>' : '') + '</p>'",
      "'<ul class=\"sa-attn\">' + att.map(a => '<li><span>' + esc(a[0]) + '</span><a class=\"rb-link\" href=\"' + a[1] + '\">'",
    ]) {
      expect(B).toContain(piece);
    }
    const { container } = render(
      <>
        <ActionGroup label="Institute Admin">
          <ActionValue detail="meera.iyer@godavari.edu.in">Meera Iyer</ActionValue>
        </ActionGroup>
        <ActionGroup label="Also waiting for this institution">
          <WaitingList
            items={[
              {
                text: 'Additional licences request under review',
                href: '/admin/requests/godavari-licences',
                label: 'Open request',
              },
            ]}
          />
        </ActionGroup>
        <ActionGroup>
          <Button>Rename</Button>
        </ActionGroup>
      </>,
    );
    const groups = container.querySelectorAll(':scope > div.sa-act');
    expect(groups).toHaveLength(3);
    expect(groups[0]!.innerHTML).toBe(
      '<p class="sa-act-k">Institute Admin</p><p class="sa-act-v">Meera Iyer<span>meera.iyer@godavari.edu.in</span></p>',
    );
    const waiting = groups[1]!.querySelector('ul.sa-attn > li')!;
    expect(waiting.firstElementChild!.outerHTML).toBe(
      '<span>Additional licences request under review</span>',
    );
    expect(within(waiting as HTMLElement).getByRole('link', { name: 'Open request' })).toHaveClass(
      'rb-link',
    );
    // A group without a name (SA-15 "Change this course": Rename, Edit description).
    expect(groups[2]!.querySelector('.sa-act-k')).toBeNull();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('a read-only table, and a comparison with its proposed column; rows that open a record', async () => {
    expect(B).toContain(
      '<div class="sa-tablewrap"><table class="sa-table sa-table--rows"><caption class="xr-sr">',
    );
    expect(C).toContain('<table class="sa-table sa-table--rows sa-compare">');
    expect(C).toContain(
      '\'<li><a class="sa-list-row" href="#/structure/courses/\' + c.id + \'"><span class="sa-list-main"><span class="sa-list-t">\'',
    );
    const { container } = render(
      <>
        <ReadOnlyTable
          compare
          caption="Changed fields, live and proposed"
          columns={['Field', 'Live now · 1.2', 'Proposed · 1.3']}
          rows={[
            {
              key: 'reflux',
              head: 'Reflux statement',
              cells: [
                { label: 'Live now · 1.2', content: 'Total reflux' },
                { label: 'Proposed · 1.3', content: 'Partial reflux', proposed: true },
              ],
            },
          ]}
        />
        <RecordList
          rows={[
            {
              key: 'me',
              href: '/admin/structure/courses/me',
              title: 'Thermodynamics & Heat Transfer',
              details: '2 published experiments',
            },
          ]}
        />
      </>,
    );
    const wrap = container.querySelector(':scope > .sa-tablewrap')!;
    expect(wrap.firstElementChild!.className).toBe('sa-table sa-table--rows sa-compare');
    expect(screen.getByRole('table', { name: 'Changed fields, live and proposed' })).toBe(
      wrap.firstElementChild,
    );
    expect(screen.getByRole('rowheader', { name: 'Reflux statement' }).getAttribute('scope')).toBe(
      'row',
    );
    const cells = [...wrap.querySelectorAll('tbody td')];
    expect(cells.map((cell) => [cell.className, cell.getAttribute('data-label')])).toEqual([
      ['', 'Live now · 1.2'],
      ['sa-compare-new', 'Proposed · 1.3'],
    ]);
    const row = screen.getByRole('link', { name: /Thermodynamics/ });
    expect(row.className).toBe('sa-list-row');
    expect(row.innerHTML).toContain(
      '<span class="sa-list-main"><span class="sa-list-t">Thermodynamics &amp; Heat Transfer</span><span class="sa-list-d">2 published experiments</span></span><span class="sa-list-go" aria-hidden="true">',
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('the footnote under the plans and a list of plain sentences', () => {
    expect(B).toContain(
      '<p class="sa-footnote">A plan can’t be amended here; changes come through a new request.</p>',
    );
    expect(C).toContain(
      "<ul class=\"sa-bullets\">' + c.outcomes.map(o => '<li>' + esc(o) + '</li>').join('') + '</ul>",
    );
    const { container } = render(
      <>
        <Footnote>A plan can’t be amended here; changes come through a new request.</Footnote>
        <Bullets items={['Size a heat exchanger.', 'Read a temperature profile.']} />
        <ButtonRow>
          <Button>Back to requests</Button>
        </ButtonRow>
      </>,
    );
    expect(container.innerHTML).toBe(
      '<p class="sa-footnote">A plan can’t be amended here; changes come through a new request.</p>' +
        '<ul class="sa-bullets"><li>Size a heat exchanger.</li><li>Read a temperature profile.</li></ul>' +
        '<div class="sa-btnrow"><button type="button" class="rb-btn">Back to requests</button></div>',
    );
    expectV3ClassesOnly(container);
  });
});
