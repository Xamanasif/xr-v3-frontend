/**
 * What only the Institute Admin's Requests screens draw (owner-approved export
 * design/v3-refined-b/roles/IA-v1, `project/Main.dc.html` "IA-17", "IA-18", "IA-19",
 * `project/ia-role.css`): the two list tables, the in-place crumbs, the request form's frame,
 * sections and choice cards, the open-renewal note, the requester's message, "Where it stands",
 * the device request's action panel with its one action, and the format line. Each is rendered
 * with sample values and compared with the export's template filled the way its script fills it
 * (`sc-for`, `sc-if`, `{{ … }}`, the sprite inlined from its own symbols); then the class contract,
 * the behaviour, the reference rule and the accessibility checks.
 *
 * Normalised on both sides, each for a recorded reason: the explicit table roles the shared list
 * table adds (ADR-0010); the export's inline sizes, written as the central patch's classes the
 * kit emits in their place (V3P-16, `iaPatchedMarkup`); the order of class tokens; and the export's internal
 * references, which no Institute Admin page shows (the owner's identifier rule): the request link's
 * `ia-nowrap` (it kept "REQ-0058" from breaking at its hyphen; the link now reads the request's
 * kind) and the device request's "DTR-0018 · " before its date are left out.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectV3ClassesOnly,
  iaExportText,
  iaPatchedMarkup,
  v3Canonical,
} from '../testing/index.js';
import { Button } from './actions.js';
import { DefinitionList, RecordLine } from './detail.js';
import { Field, TextInput } from './fields.js';
import { IaActions, IaBusyButton } from './ia.js';
import {
  IaRqActionPanel,
  IaRqChoices,
  IaRqCrumbs,
  IaRqDeviceTable,
  IaRqForm,
  IaRqFormatFor,
  IaRqFormPart,
  IaRqFormSection,
  IaRqForwardButton,
  IaRqMessage,
  IaRqNote,
  IaRqStands,
  IaRqTable,
} from './ia-requests.js';
import { StatusPill } from './status.js';

const MAIN = iaExportText('Main.dc.html');
const TEMPLATE = MAIN.slice(0, MAIN.indexOf('<script type="text/x-dc"'));

/** The export's sprite (`rki-*`, `rbi-*`), by id. */
const SYMBOLS = new Map(
  [
    ...MAIN.matchAll(/<symbol id="((?:rki|rbi)-[\w-]+)" viewBox="0 0 24 24"><path d="([^"]+)"/g),
  ].map((match) => [match[1] ?? '', match[2] ?? ''] as const),
);

/** An internal reference no Institute Admin page shows (the owner's identifier rule). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

type Scope = Readonly<Record<string, unknown>>;

function lookup(scope: Scope, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    return value && typeof value === 'object' ? (value as Scope)[key] : undefined;
  }, scope);
}

/** `{{ name }}` replaced; an attribute bound to nothing dropped. */
function substitute(html: string, scope: Scope): string {
  return html
    .replace(/ ([\w-]+)="\{\{ ([\w.]+) \}\}"/g, (whole, name: string, path: string) => {
      const value = lookup(scope, path);
      return value === undefined || value === null ? '' : ` ${name}="${String(value)}"`;
    })
    .replace(/\{\{ ([\w.]+) \}\}/g, (_whole, path: string) => String(lookup(scope, path) ?? ''));
}

/**
 * An excerpt of the export's template filled as its runtime fills it: each `sc-for` repeated over
 * its list and each `sc-if` kept or dropped, each `{{ name }}` replaced; the preview's wiring
 * (event bindings) and empty `class=""` dropped; sprites inlined.
 */
function fill(html: string, scope: Scope): string {
  const open = /<sc-(for|if) ([^>]*)>/g;
  let out = '';
  let from = 0;
  for (;;) {
    open.lastIndex = from;
    const start = open.exec(html);
    if (!start) {
      out += substitute(html.slice(from), scope);
      break;
    }
    out += substitute(html.slice(from, start.index), scope);
    const tag = start[1] ?? '';
    const attributes = start[2] ?? '';
    const tags = new RegExp(`<sc-${tag} [^>]*>|</sc-${tag}>`, 'g');
    tags.lastIndex = start.index + start[0].length;
    let depth = 1;
    let close: RegExpExecArray | null = null;
    while (depth > 0) {
      close = tags.exec(html);
      if (!close) throw new Error(`unclosed sc-${tag}`);
      depth += close[0].startsWith('</') ? -1 : 1;
    }
    const inner = html.slice(start.index + start[0].length, close!.index);
    if (tag === 'for') {
      const list = /list="\{\{ ([\w.]+) \}\}"/.exec(attributes)?.[1] ?? '';
      const as = /as="(\w+)"/.exec(attributes)?.[1] ?? '';
      out += ((lookup(scope, list) as readonly unknown[] | undefined) ?? [])
        .map((item) => fill(inner, { ...scope, [as]: item }))
        .join('');
    } else {
      const name = /value="\{\{ ([\w.]+) \}\}"/.exec(attributes)?.[1] ?? '';
      if (lookup(scope, name)) out += fill(inner, scope);
    }
    from = close!.index + close![0].length;
  }
  return out
    .replace(/ on[A-Z][A-Za-z]*="[^"]*"/g, '')
    .replace(/ class=""/g, '')
    .replace(/<use href="#((?:rki|rbi)-[\w-]+)"><\/use>/g, (whole, id: string) => {
      const path = SYMBOLS.get(id);
      return path ? `<path d="${path}"></path>` : whole;
    });
}

/** The template from `start` to the end of the element it opens (the first `end` after it). */
function excerpt(start: string, end: string): string {
  const from = TEMPLATE.indexOf(start);
  expect(from, `the export draws ${start}`).toBeGreaterThanOrEqual(0);
  const to = TEMPLATE.indexOf(end, from);
  expect(to, `the export closes ${start} with ${end}`).toBeGreaterThan(from);
  return TEMPLATE.slice(from, to + end.length);
}

/** Class tokens in name order. */
function sortedClasses(html: string): string {
  return html.replace(/ class="([^"]*)"/g, (_whole, value: string) => {
    return ` class="${value.split(/\s+/).filter(Boolean).sort().join(' ')}"`;
  });
}

/** The recorded normalisations (see the file's head). */
function comparable(html: string): string {
  return sortedClasses(v3Canonical(iaPatchedMarkup(html))).replace(
    / role="(?:table|rowgroup|row|columnheader|rowheader|cell)"/g,
    '',
  );
}

function expectSameMarkup(element: Element, expected: string) {
  expect(comparable(element.outerHTML)).toBe(comparable(expected));
}

/** Rendered inside a V3 root, as the shell renders the pages. */
function inRoot(ui: React.ReactNode) {
  return render(<div className="xr rb">{ui}</div>);
}

/** No internal reference in the words, the names, the titles or the placeholders drawn. */
function expectNoReference(container: Element): void {
  expect(container.textContent ?? '').not.toMatch(REFERENCE);
  for (const element of container.querySelectorAll('[aria-label], [title], [placeholder]')) {
    for (const name of ['aria-label', 'title', 'placeholder']) {
      expect(element.getAttribute(name) ?? '').not.toMatch(REFERENCE);
    }
  }
}

const RQ_HEADERS = {
  request: 'Request',
  what: 'What you asked for',
  status: 'Status',
  lastChange: 'Last change',
} as const;

const RQ_ROWS = [
  {
    key: 'REQ-0058',
    name: 'More licences',
    href: '/institute/requests/REQ-0058',
    accessibleName: 'More licences, sent 21 Oct 2026, Under review. Open the request',
    sub: 'Sent 21 Oct 2026',
    what: '60 more licences · Shell-and-Tube Heat Exchanger',
    st: 'Under review',
    stCls: 'xr-st xr-st--info',
    tone: 'info',
    when: '21 Oct 2026, 16:05',
  },
  {
    key: 'REQ-0042',
    name: 'New access',
    href: '/institute/requests/REQ-0042',
    accessibleName: 'New access, sent 2 Oct 2026, Access active. Open the request',
    sub: 'Sent 2 Oct 2026',
    what: 'Shell-and-Tube Heat Exchanger · WEB and VR · 120 licences · Yearly',
    st: 'Access active',
    stCls: 'xr-st xr-st--ok',
    tone: 'ok',
    when: '8 Oct 2026, 15:05',
  },
] as const;

function RequestsTable() {
  return (
    <IaRqTable
      caption="Requests to BITS, newest first"
      headers={RQ_HEADERS}
      rows={RQ_ROWS.map((row) => ({
        key: row.key,
        name: row.name,
        href: row.href,
        accessibleName: row.accessibleName,
        sub: row.sub,
        what: row.what,
        status: <StatusPill tone={row.tone}>{row.st}</StatusPill>,
        lastChange: row.when,
      }))}
    />
  );
}

describe('IA-17 Requests to BITS (`table.ia-lt.ia-lt--rq`)', () => {
  it('draws the export’s table, the request named by its kind and when it was sent', () => {
    const drawn = excerpt('<table class="ia-lt ia-lt--rq">', '</table>')
      // The reference is not drawn: the link reads the kind (no hyphenated ID to keep whole).
      .replace('class="rk-rowlink ia-cell-name ia-nowrap"', 'class="rk-rowlink ia-cell-name"');
    const { container } = inRoot(<RequestsTable />);
    expectSameMarkup(
      container.querySelector('table')!,
      fill(drawn, {
        V: {
          rows: RQ_ROWS.map((row) => ({
            href: row.href,
            aria: row.accessibleName,
            id: row.name,
            kind: row.sub,
            what: row.what,
            st: row.st,
            stCls: row.stCls,
            when: row.when,
          })),
        },
      }),
    );
    expect(container.querySelector('.ia-ltwrap > table.ia-lt--rq')).not.toBeNull();
    expectV3ClassesOnly(container);
    expectNoReference(container);
  });

  it('a press anywhere on a row follows its link; the link is named by content', () => {
    inRoot(<RequestsTable />);
    const table = screen.getByRole('table', { name: 'Requests to BITS, newest first' });
    const link = within(table).getByRole('link', {
      name: 'More licences, sent 21 Oct 2026, Under review. Open the request',
    });
    expect(link).toHaveAttribute('href', '/institute/requests/REQ-0058');
    const followed = vi.fn((event: Event) => event.preventDefault());
    link.addEventListener('click', followed);
    fireEvent.click(within(table).getByText('60 more licences · Shell-and-Tube Heat Exchanger'));
    expect(followed).toHaveBeenCalledTimes(1);
    // The phone rows' inline label before the last change.
    expect(link.closest('tr')!.querySelector('.ia-rq-when .ia-lt-lab')).toHaveTextContent(
      'Last change',
    );
  });
});

const DV_ROWS = [
  {
    key: 'DTR-0018',
    n: 'Rahul Verma',
    sid: 'GIT-2026-0418',
    stuHref: '/institute/people/students/per-0002',
    what: 'VR device transfer',
    openHref: '/institute/requests/devices/DTR-0018',
    openAria: 'VR device transfer from Rahul Verma, 22 Oct 2026',
    date: '22 Oct 2026',
    st: 'Waiting on you',
    stCls: 'xr-st xr-st--warn',
    tone: 'warn',
    canReview: true,
    reviewAria: 'Review Rahul Verma’s request',
  },
  {
    key: 'DTR-0015',
    n: 'Karthik Rao',
    sid: 'GIT-2026-0415',
    stuHref: '/institute/people/students/per-0004',
    what: 'VR device transfer',
    openHref: '/institute/requests/devices/DTR-0015',
    openAria: 'VR device transfer from Karthik Rao, 13 Oct 2026',
    date: '13 Oct 2026',
    st: 'Decided · approved by BITS',
    stCls: 'xr-st xr-st--ok',
    tone: 'ok',
    canReview: false,
    reviewAria: '',
  },
] as const;

describe('IA-18 Device requests (`table.ia-lt.ia-lt--dv`)', () => {
  it('draws the export’s table: the student opens the record, the request opens IA-19, Review on the waiting one', () => {
    const drawn = excerpt('<table class="ia-lt ia-lt--dv">', '</table>')
      // The reference is not drawn: the line under the request is its date alone.
      .replace('{{ r.id }} · {{ r.date }}', '{{ r.date }}');
    const { container } = inRoot(
      <IaRqDeviceTable
        caption="Device requests from your students"
        headers={{ student: 'Student', request: 'Request', status: 'Status', action: 'Action' }}
        rows={DV_ROWS.map((row) => ({
          key: row.key,
          student: { name: row.n, href: row.stuHref },
          studentId: row.sid,
          request: { label: row.what, href: row.openHref, accessibleName: row.openAria },
          date: row.date,
          status: <StatusPill tone={row.tone}>{row.st}</StatusPill>,
          review: row.canReview
            ? { label: 'Review', href: row.openHref, accessibleName: row.reviewAria }
            : null,
        }))}
      />,
    );
    expectSameMarkup(
      container.querySelector('table')!,
      fill(drawn, {
        V: {
          rows: DV_ROWS.map((row) => ({
            n: row.n,
            sid: row.sid,
            stu: { href: row.stuHref },
            open: { href: row.openHref },
            openAria: row.openAria,
            what: row.what,
            date: row.date,
            st: row.st,
            stCls: row.stCls,
            canReview: row.canReview,
            reviewAria: row.reviewAria,
          })),
        },
      }),
    );
    const table = screen.getByRole('table', { name: 'Device requests from your students' });
    expect(within(table).getByRole('link', { name: 'Rahul Verma' })).toHaveAttribute(
      'href',
      '/institute/people/students/per-0002',
    );
    expect(within(table).getAllByRole('link', { name: /^Review / })).toHaveLength(1);
    expectV3ClassesOnly(container);
    expectNoReference(container);
  });
});

describe('the in-place crumbs (`nav.rk-crumbs`)', () => {
  it('draws the export’s crumbs; a plain press returns in place, a new-tab press follows the address', () => {
    const drawn = excerpt(
      '<nav class="rk-crumbs" aria-label="Breadcrumb"><a href="{{ V.back.href }}" onClick="{{ V.back.go }}">Requests</a>',
      '</nav>',
    );
    const onFollow = vi.fn();
    const { container } = inRoot(
      <IaRqCrumbs
        back={{ label: 'Requests', href: '/institute/requests', onFollow }}
        current="Ask BITS"
      />,
    );
    expectSameMarkup(
      container.querySelector('nav')!,
      fill(drawn, { V: { back: { href: '/institute/requests' }, crumb: 'Ask BITS' } }),
    );
    const link = screen.getByRole('link', { name: 'Requests' });
    expect(fireEvent.click(link)).toBe(false);
    expect(onFollow).toHaveBeenCalledTimes(1);
    const followed = vi.fn((event: Event) => event.preventDefault());
    link.addEventListener('click', followed);
    fireEvent.click(link, { ctrlKey: true });
    expect(onFollow).toHaveBeenCalledTimes(1);
    expect(followed).toHaveBeenCalledTimes(1);
    expectV3ClassesOnly(container);
  });
});

function RequestForm({
  typeError,
  experimentsError,
  onToggle = () => undefined,
  onSubmit = () => undefined,
  busy = false,
}: {
  readonly typeError?: string;
  readonly experimentsError?: string;
  readonly onToggle?: (value: string) => void;
  readonly onSubmit?: () => void;
  readonly busy?: boolean;
}) {
  return (
    <>
      <h1 id="ask-title">Ask for a renewal or more licences</h1>
      <IaRqForm
        labelledBy="ask-title"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <IaRqFormPart>
          <p>Check your request</p>
        </IaRqFormPart>
        <IaRqFormSection title="What you need" titleId="rq-need-h">
          <IaRqChoices
            kind="radio"
            id="rq-type"
            name="rq-type"
            legend="What you need"
            legendHidden
            options={[
              {
                value: 'renew',
                title: 'Renew your access plan',
                description:
                  'Asks for the same plan again: the same experiments, formats, licences and term.',
              },
              {
                value: 'more',
                title: 'More licences for experiments you hold',
                description: 'A new request. BITS reviews it like any other request.',
              },
            ]}
            values={['more']}
            onToggle={onToggle}
            error={typeError}
          />
          <IaRqNote title="You’ve already asked for a renewal">
            Renewal sent 21 Oct 2026 · Under review. You can still send another request; BITS sees
            both.
          </IaRqNote>
        </IaRqFormSection>
        <IaRqFormSection title="Experiments and licences" titleId="rq-more-h" layout="stack">
          <IaRqChoices
            kind="checkbox"
            id="rq-exp"
            legend="Experiments in your access plan"
            options={[
              {
                value: 'exp-1',
                title: 'Shell-and-Tube Heat Exchanger · ME ZG523',
                description: 'WEB and VR · in your access plan',
              },
            ]}
            values={[]}
            onToggle={onToggle}
            error={experimentsError}
          />
          <Field id="rq-lic" label="Licences requested" hint="How many more you need.">
            <TextInput inputMode="numeric" defaultValue="" />
          </Field>
        </IaRqFormSection>
        <IaRqFormSection title="Organisation and contact person" titleId="rq-org-h" layout="tight">
          <DefinitionList
            items={[{ term: 'Institution', value: 'Godavari Institute of Technology' }]}
          />
        </IaRqFormSection>
        <IaActions>
          <Button size="lg">Cancel</Button>
          <IaBusyButton type="submit" variant="primary" size="lg" busy={busy} busyLabel="Sending…">
            Send request to BITS
          </IaBusyButton>
        </IaActions>
      </IaRqForm>
    </>
  );
}

describe('IA-17 the request form', () => {
  it('the form column and its sections as the export draws them (`rk-sec`, `ia-stack`, `rk-h3`)', () => {
    const { container } = inRoot(<RequestForm />);
    const form = container.querySelector('form')!;
    expect(form).toHaveClass('rk-surface', 'ia-form');
    expect(form).toHaveAttribute('aria-labelledby', 'ask-title');
    expect(form).toHaveAttribute('novalidate');
    expect(screen.getByRole('form', { name: 'Ask for a renewal or more licences' })).toBe(form);
    expect([...form.children].map((child) => `${child.tagName} ${child.className}`)).toEqual([
      'DIV rk-sec',
      'SECTION rk-sec',
      'SECTION rk-sec ia-stack',
      'SECTION rk-sec ia-stack ia-stack--tight',
      'DIV ia-actions',
    ]);
    // Each section is named by its `h2.rk-h3` (the export's `aria-labelledby`).
    for (const name of [
      'What you need',
      'Experiments and licences',
      'Organisation and contact person',
    ]) {
      const region = screen.getByRole('region', { name });
      expect(region.firstElementChild).toHaveClass('rk-h3');
      expect(region.firstElementChild!.tagName).toBe('H2');
    }
    // A section without a stack keeps 12 px under its heading, as the export sets it inline
    // (`rk-x-h3-above`, V3P-16); the stacked ones are spaced by their gap.
    expect(TEMPLATE).toContain(
      '<h2 class="rk-h3" id="rq-need-h" style="margin-bottom: 12px">What you need</h2>',
    );
    expect(TEMPLATE).toContain('<h2 class="rk-h3" id="rq-more-h">Experiments and licences</h2>');
    expect(screen.getByRole('heading', { name: 'What you need' }).className).toBe(
      'rk-h3 rk-x-h3-above',
    );
    expect(screen.getByRole('heading', { name: 'Experiments and licences' }).className).toBe(
      'rk-h3',
    );
    // The export's "What you need" fieldset: a hidden legend under the heading, the choice cards.
    const need = excerpt(
      '<fieldset class="rk-fieldset" id="rq-type" aria-describedby="{{ V.typeDesc }}">',
      '</fieldset>',
    );
    const drawnNeed = new DOMParser().parseFromString(fill(need, {}), 'text/html').body;
    const needSet = container.querySelector('#rq-type')!;
    const shape = (root: Element) =>
      [...root.querySelectorAll('*')]
        .filter((element) => element.closest('svg') === null || element.tagName === 'svg')
        .map((element) => `${element.tagName.toLowerCase()}.${[...element.classList].join('.')}`);
    expect(shape(needSet)).toEqual(shape(drawnNeed.querySelector('fieldset')!));
    expectV3ClassesOnly(container);
  });

  it('each choice is named by its title and described by its line; the group’s error describes it', () => {
    const onToggle = vi.fn();
    inRoot(<RequestForm typeError="Choose what you need" onToggle={onToggle} />);
    const more = screen.getByRole('radio', { name: 'More licences for experiments you hold' });
    expect(more).toBeChecked();
    expect(more).toHaveAccessibleDescription(
      'A new request. BITS reviews it like any other request.',
    );
    expect(more).toHaveAttribute('name', 'rq-type');
    const group = screen.getByRole('group', { name: 'What you need' });
    expect(group.querySelector('legend')).toHaveClass('xr-sr');
    expect(group).toHaveAccessibleDescription('Choose what you need');
    expect(group.querySelector('p.rk-ferr')).toHaveAttribute('id', 'rq-type-e');
    // 8 px under the choices, as the export sets it inline (`rk-x-ferr-group`, V3P-16).
    expect(TEMPLATE).toContain('<p class="rk-ferr" id="rq-type-e" style="margin-top: 8px">');
    expect(group.querySelector('p.rk-ferr')!.className).toBe('rk-ferr rk-x-ferr-group');
    fireEvent.click(screen.getByRole('radio', { name: 'Renew your access plan' }));
    expect(onToggle).toHaveBeenCalledWith('renew');
    const experiment = screen.getByRole('checkbox', {
      name: 'Shell-and-Tube Heat Exchanger · ME ZG523',
    });
    expect(experiment).toHaveAccessibleDescription('WEB and VR · in your access plan');
    expect(screen.getByRole('group', { name: 'Experiments in your access plan' })).toBeVisible();
    fireEvent.click(experiment);
    expect(onToggle).toHaveBeenCalledWith('exp-1');
  });

  it('the open-renewal note is the export’s `rk-notice--info.ia-gap-top[role=note]`', () => {
    const drawn = excerpt(
      '<div class="rk-notice rk-notice--info ia-gap-top" role="note">',
      '</div>',
    );
    const { container } = inRoot(
      <IaRqNote title="You’ve already asked for a renewal">
        Renewal sent 21 Oct 2026 · Under review.
      </IaRqNote>,
    );
    expectSameMarkup(
      container.querySelector('.rk-notice')!,
      fill(drawn, { V: { openRenewT: 'Renewal sent 21 Oct 2026 · Under review.' } }),
    );
    expectNoReference(container);
  });

  it('submits through the form; while busy the submit is `ia-btn--busy` and ignores presses', () => {
    const onSubmit = vi.fn();
    const { rerender } = inRoot(<RequestForm onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send request to BITS' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    rerender(
      <div className="xr rb">
        <RequestForm onSubmit={onSubmit} busy />
      </div>,
    );
    const sending = screen.getByRole('button', { name: 'Sending…' });
    expect(sending).toHaveClass('ia-btn--busy');
    expect(sending).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(sending);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe('IA-17 the request’s detail', () => {
  it('the message is the export’s label and quote', () => {
    const drawn = excerpt('<div class="ia-gap-top"><p class="rk-label"', '</div>');
    const { container } = inRoot(
      <IaRqMessage label="Message to BITS">“Sem II has a larger batch than planned.”</IaRqMessage>,
    );
    expectSameMarkup(
      container.querySelector('.ia-gap-top')!,
      fill(drawn, { V: { msg: 'Sem II has a larger batch than planned.' } }),
    );
  });

  it('“Where it stands” is the export’s `dl.rk-stand` and its hint', () => {
    const drawn = excerpt(
      '<dl class="rk-stand"><sc-for list="{{ V.stand }}"',
      'A request doesn’t change your plan by itself.</p>',
    );
    const stand = [
      { k: 'Request', v: 'Approved' },
      { k: 'Payment', v: 'Waiting, not confirmed' },
      { k: 'Your access plan', v: 'Unchanged' },
    ];
    const { container } = inRoot(
      <div data-testid="stands">
        <IaRqStands
          items={stand.map((item) => ({ term: item.k, value: item.v }))}
          hint="Review, payment and your access plan are separate steps. A request doesn’t change your plan by itself."
        />
      </div>,
    );
    expect(comparable(screen.getByTestId('stands').innerHTML)).toBe(
      comparable(fill(drawn, { V: { stand } })),
    );
    expectV3ClassesOnly(container);
  });
});

describe('IA-19 the device request', () => {
  it('the action panel, its one action and where it stands are the export’s `section.rk-panel`', () => {
    const drawn = excerpt('<section class="rk-panel" aria-labelledby="dr-a-h">', '</section>');
    const stand = [
      { k: 'Request', v: 'Waiting on you' },
      { k: 'Forwarded to BITS', v: 'Not yet' },
      { k: 'BITS decision', v: 'Not yet' },
    ];
    const onPress = vi.fn();
    const actText = 'Forward it to BITS. BITS decides; you can’t approve device transfers.';
    const { container } = inRoot(
      <IaRqActionPanel title="Your action" titleId="dr-a-h">
        <RecordLine>{actText}</RecordLine>
        <IaRqForwardButton id="dr-fwd" onPress={onPress}>
          Forward to BITS
        </IaRqForwardButton>
        <IaRqStands items={stand.map((item) => ({ term: item.k, value: item.v }))} hint="unused" />
      </IaRqActionPanel>,
    );
    // The panel draws "Where it stands" without the hint line.
    container.querySelector('.ia-gap-top-s')?.remove();
    expectSameMarkup(
      container.querySelector('section')!,
      fill(drawn, { V: { actText, canForward: true, stand } }),
    );
    expect(screen.getByRole('region', { name: 'Your action' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Forward to BITS' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expectV3ClassesOnly(container);
  });

  it('the format line is the export’s `span.ia-row` with the format and what it is for', () => {
    const drawn = excerpt(
      '<span class="ia-row" style="gap: 6px 10px"><span class="xr-fmt">{{ V.fmt }}',
      '</span></span>',
    );
    const { container } = inRoot(
      <IaRqFormatFor code="VR">for Shell-and-Tube Heat Exchanger</IaRqFormatFor>,
    );
    expectSameMarkup(
      container.querySelector('.ia-row')!,
      fill(drawn, { V: { fmt: 'VR', exp: 'Shell-and-Tube Heat Exchanger' } }),
    );
    const { container: alone } = inRoot(<IaRqFormatFor code="AR" />);
    expect(alone.querySelector('.ia-row')!.children).toHaveLength(1);
    expectV3ClassesOnly(container);
  });
});

describe('the Requests pieces together', () => {
  it('pass axe with no violation', async () => {
    const { container } = inRoot(
      <main>
        <IaRqCrumbs
          back={{ label: 'Requests', href: '/institute/requests', onFollow: () => undefined }}
          current="Ask BITS"
        />
        <RequestsTable />
        <RequestForm typeError="Choose what you need" />
        <IaRqMessage label="Message to BITS">“Sem II has a larger batch than planned.”</IaRqMessage>
        <IaRqActionPanel title="Your action" titleId="dr-a-h">
          <RecordLine>Forwarded. Nothing more is needed from you; BITS decides.</RecordLine>
          <IaRqStands items={[{ term: 'Request', value: 'Forwarded to BITS' }]} hint="Steps." />
        </IaRqActionPanel>
        <IaRqFormatFor code="VR">for Shell-and-Tube Heat Exchanger</IaRqFormatFor>
      </main>,
    );
    await assertNoAxeViolations(container);
    expectNoReference(container);
  });
});
