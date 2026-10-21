/**
 * What more than one Academic Reviewer screen group draws (owner-approved export
 * design/v3-refined-b/roles/RV-v1, live root `project/RV.dc.html`, `project/rv.css`;
 * COMPONENT-EXTENSIONS "Role extensions"): the review type tag, a course with its name, the status
 * pills, the format badges (RV-01, RV-02, RV-05), the identity card, the item layout, the blocks and
 * their heads, the quote, the comparison, the read-only outcomes, the decision panel's parts and the
 * history (RV-03, RV-04, RV-06). Each is rendered with the export's own sample values and compared
 * with the export's template filled the way its script fills it (`sc-for`, `sc-if`, `{{ … }}`, the
 * `rvi-*` sprite inlined from its own symbols); then the class contract and the accessibility
 * checks. The export draws every kind (and readiness) icon and lets a class show one; the
 * components draw the one it shows, so the filled template keeps that one for the comparison.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectNoInternalReferences,
  expectV3ClassesOnly,
  rvExportText,
  v3Canonical,
} from '../testing/index.js';
import { ButtonLink } from './actions.js';
import { Timeline } from './detail.js';
import { V3_ICON_PATHS, type V3IconName } from './icons.js';
import { Breadcrumbs } from './page.js';
import {
  RV_KIND_ICON,
  RvBandHead,
  RvBlock,
  RvBlockHead,
  RvComparison,
  RvCourse,
  RvDecisionOutcome,
  RvDetail,
  RvFootnote,
  RvFormatBadges,
  RvHistory,
  RvIdCard,
  type RvKind,
  RvKindTag,
  RvOutcomesReadOnly,
  RvPath,
  RvQuote,
  RvReadyList,
  RvRefusal,
  RvStatus,
} from './rv.js';

const RV = rvExportText('RV.dc.html');
const TEMPLATE = RV.slice(0, RV.indexOf('<script type="text/x-dc"'));

/** The export's `rvi-*` symbols, by id. */
const SYMBOLS = new Map(
  [...RV.matchAll(/<symbol id="(rvi-[\w-]+)" viewBox="0 0 24 24"><path d="([^"]+)"/g)].map(
    (match) => [match[1] ?? '', match[2] ?? ''] as const,
  ),
);

type Scope = Readonly<Record<string, unknown>>;

function lookup(scope: Scope, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    return value && typeof value === 'object' ? (value as Scope)[key] : undefined;
  }, scope);
}

const OPEN =
  /<sc-(for|if) (?:list|value)="\{\{ ([\w.]+) \}\}"(?: as="(\w+)")? hint-placeholder-(?:count|val)="[^"]*">/g;

/**
 * An excerpt of the export's template filled as its runtime fills it: each `sc-for` repeated over
 * its list (nested loops see the outer item), each `sc-if` kept or dropped, each `{{ name }}`
 * replaced; the preview's wiring (event bindings) and empty `class=""` dropped.
 */
function fill(html: string, scope: Scope): string {
  let out = '';
  let at = 0;
  for (;;) {
    OPEN.lastIndex = at;
    const open = OPEN.exec(html);
    if (!open) {
      out += html.slice(at);
      break;
    }
    out += html.slice(at, open.index);
    const [whole, tag, name, as] = open as unknown as [string, 'for' | 'if', string, string?];
    const tags = new RegExp(`<sc-${tag}\\b|</sc-${tag}>`, 'g');
    tags.lastIndex = open.index + whole.length;
    let depth = 1;
    let close: RegExpExecArray | null = null;
    while (depth > 0) {
      close = tags.exec(html);
      if (!close) throw new Error(`unclosed sc-${tag} ${name}`);
      depth += close[0].startsWith('</') ? -1 : 1;
    }
    const inner = html.slice(open.index + whole.length, close!.index);
    if (tag === 'for') {
      out += (lookup(scope, name) as readonly unknown[])
        .map((item) => fill(inner, { ...scope, [as ?? 'x']: item }))
        .join('');
    } else if (lookup(scope, name)) {
      out += fill(inner, scope);
    }
    at = close!.index + close![0].length;
  }
  return out
    .replace(/\{\{ ([\w.]+) \}\}/g, (_whole, name: string) => String(lookup(scope, name) ?? ''))
    .replace(/ on[A-Z][A-Za-z]*="[^"]*"/g, '')
    .replace(/ class=""/g, '')
    .replace(/ style="margin-top: 12px"/g, '');
}

/**
 * The filled markup as elements: in each icon slot the export fills with every `rv-u-*` icon, the
 * one its class shows (`rv-kind--<key>`, `rv-ready-ico is-<key>`) is kept; every sprite reference
 * is inlined from the export's own symbols.
 */
function drawn(html: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html;
  for (const svg of template.content.querySelectorAll('svg')) {
    const slots = [...svg.querySelectorAll('use[class^="rv-u-"]')];
    if (slots.length === 0) continue;
    const owner = svg.closest('[class*="rv-kind--"], .rv-ready-ico')!;
    const key =
      /rv-kind--(\w+)/.exec(owner.className)?.[1] ?? /\bis-(\w+)/.exec(owner.className)?.[1];
    for (const use of slots) {
      if (use.getAttribute('class') === `rv-u-${key}`) use.removeAttribute('class');
      else use.remove();
    }
  }
  for (const use of template.content.querySelectorAll('use')) {
    const id = (use.getAttribute('href') ?? '').slice(1);
    const path = SYMBOLS.get(id);
    if (!path) throw new Error(`no symbol ${id}`);
    const element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    element.setAttribute('d', path);
    use.replaceWith(element);
  }
  return template.content;
}

/** The template from `start` to the end of the first `end` after it, as the export draws it. */
function excerpt(start: string, end: string): string {
  const from = TEMPLATE.indexOf(start);
  expect(from, `the export draws ${start}`).toBeGreaterThanOrEqual(0);
  const to = TEMPLATE.indexOf(end, from);
  expect(to, `the export closes ${start} with ${end}`).toBeGreaterThan(from);
  return TEMPLATE.slice(from, to + end.length);
}

/** The first element matching `selector` in the filled excerpt. */
function drawnElement(html: string, scope: Scope, selector: string): Element {
  const element = drawn(fill(html, scope)).querySelector(selector);
  if (!element) throw new Error(`the filled excerpt has no ${selector}`);
  return element;
}

function expectSame(rendered: Element, expected: Element | string) {
  const markup = typeof expected === 'string' ? expected : expected.outerHTML;
  expect(v3Canonical(rendered.outerHTML)).toBe(v3Canonical(markup));
}

/** The export's `kindVals`. */
function kindVals(key: RvKind, t: string, d = '') {
  return { kindCls: `rv-kind rv-kind--${key}`, kindT: t, kindD: d, hasKindD: d !== '' };
}

describe('the sprite the export draws with is the kit’s', () => {
  it.each([
    ['rvi-new', RV_KIND_ICON.new],
    ['rvi-resub', RV_KIND_ICON.resub],
    ['rvi-recheck', RV_KIND_ICON.recheck],
    ['rvi-update', RV_KIND_ICON.update],
    ['rvi-check', 'check'],
    ['rvi-alert', 'alertCircle'],
    ['rvi-layers', 'layersStack'],
    ['rvi-live', 'live'],
    ['rvi-msg', 'message'],
    ['rvi-right', 'chevronRight'],
  ] as const)('%s = %s', (symbol, icon: V3IconName) => {
    expect(SYMBOLS.get(symbol)).toBe(V3_ICON_PATHS[icon]);
  });
});

describe('RvKindTag — the review type tag (`span.rv-kind`)', () => {
  const cell = excerpt('<td class="rv-c-kind"><span class="{{ r.kindCls }}">', '</td>');

  it.each([
    ['new', 'New submission', ''],
    ['resub', 'Resubmitted', 'revision 2'],
    ['recheck', 'Re-check', ''],
    ['update', 'Update', '1.2 → 1.3'],
  ] as const)('%s: “%s %s”, as RV-02’s row draws it', (kind, label, detail) => {
    const expected = drawnElement(
      `<table><tbody><tr>${cell}</tr></tbody></table>`,
      { r: { ...kindVals(kind, label, detail), from: 'From Kavya Nair, Content Manager' } },
      '.rv-kind',
    );
    const { container } = render(<RvKindTag kind={kind} label={label} detail={detail || null} />);
    expectSame(container.firstElementChild!, expected);
    expectV3ClassesOnly(container);
  });

  it('the item page’s eyebrow and the reviewed table draw the same tag', () => {
    expect(TEMPLATE).toContain(
      '<p class="rv-id-eyebrow"><span class="{{ I.kindCls }}"><span class="rv-kind-ico" aria-hidden="true">',
    );
    expect(TEMPLATE).toContain(
      '<td class="rv-c-kind"><span class="{{ r.kindCls }}"><span class="rv-kind-ico" aria-hidden="true">',
    );
  });
});

describe('RvCourse — a course code with its name', () => {
  const COURSE = { course: 'CHE ZG513', courseName: 'Process Instrumentation & Control' };

  it('cell: RV-02 and RV-05 rows (`span.rv-cell-course`, the name as text)', () => {
    const expected = drawnElement(
      excerpt('<span class="rv-cell-course">', '</span>{{ r.courseName }}</span>'),
      { r: COURSE },
      '.rv-cell-course',
    );
    const { container } = render(
      <RvCourse placement="cell" code="CHE ZG513" name="Process Instrumentation & Control" />,
    );
    expectSame(container.firstElementChild!, expected);
  });

  it('next: RV-01’s next in line (the name in a span)', () => {
    const expected = drawnElement(
      excerpt(
        '<span class="rv-meta-course"><span class="rk-code">{{ OV.next.course }}</span>',
        '</span></span>',
      ),
      { OV: { next: COURSE } },
      '.rv-meta-course',
    );
    const { container } = render(
      <RvCourse placement="next" code="CHE ZG513" name="Process Instrumentation & Control" />,
    );
    expectSame(container.firstElementChild!, expected);
  });

  it('row: RV-01’s rest of the queue (`span.rv-wl-cname`)', () => {
    const expected = drawnElement(
      excerpt(
        '<span class="rv-meta-course"><span class="rk-code">{{ r.course }}</span>',
        '</span></span>',
      ),
      { r: COURSE },
      '.rv-meta-course',
    );
    const { container } = render(
      <RvCourse placement="row" code="CHE ZG513" name="Process Instrumentation & Control" />,
    );
    expectSame(container.firstElementChild!, expected);
  });

  it('card: the identity card (the name as text); a code alone when the name is not known', () => {
    const expected = drawnElement(
      excerpt(
        '<span class="rv-meta-course"><span class="rk-code">{{ I.course }}</span>',
        '</span>',
      ),
      { I: COURSE },
      '.rv-meta-course',
    );
    const { container, rerender } = render(
      <RvCourse placement="card" code="CHE ZG513" name="Process Instrumentation & Control" />,
    );
    // The excerpt ends at the code's close; the card's name follows it as text.
    expect(v3Canonical(container.firstElementChild!.outerHTML)).toBe(
      v3Canonical(
        `${expected.outerHTML.replace(/<\/span>$/, '')}Process Instrumentation &amp; Control</span>`,
      ),
    );
    rerender(<RvCourse placement="card" code="CHE ZG513" name={null} />);
    expect(container.innerHTML).toBe(
      '<span class="rv-meta-course"><span class="rk-code">CHE ZG513</span></span>',
    );
  });
});

describe('RvStatus — the reviewer’s status pills', () => {
  it('lg: the identity card (`… rk-st-lg rv-st-wrap`)', () => {
    const expected = drawnElement(
      excerpt('<span class="{{ I.stClsLg }}">', '</span>'),
      {
        I: {
          stClsLg: 'xr-st xr-st--info rk-st-lg rv-st-wrap',
          stLabel: 'Waiting for your decision',
        },
      },
      'span',
    );
    const { container } = render(
      <RvStatus tone="info" size="lg">
        Waiting for your decision
      </RvStatus>,
    );
    expectSame(container.firstElementChild!, expected);
  });

  it('sm: RV-01’s Recently decided; the default: RV-05’s decision cell', () => {
    const sm = drawnElement(
      excerpt('<span class="{{ h.stCls }}">', '</span>'),
      { h: { stCls: 'xr-st rv-st-sm xr-st--ok', dec: 'Approved' } },
      'span',
    );
    const { container, rerender } = render(
      <RvStatus tone="ok" size="sm">
        Approved
      </RvStatus>,
    );
    expectSame(container.firstElementChild!, sm);
    const wrap = drawnElement(
      excerpt('<td class="rv-c-dec"><span class="{{ r.stCls }}">', '</span>'),
      { r: { stCls: 'xr-st rv-st-wrap xr-st--err', dec: 'Returned to vendor' } },
      'span',
    );
    rerender(<RvStatus tone="err">Returned to vendor</RvStatus>);
    expectSame(container.firstElementChild!, wrap);
    // The script's `standing` for a withdrawn update: `xr-st rk-st-ended`.
    rerender(
      <RvStatus tone="ended" size="lg">
        Withdrawn by the Content Manager
      </RvStatus>,
    );
    expect(container.firstElementChild!.className).toBe('xr-st rk-st-ended rk-st-lg rv-st-wrap');
    expectV3ClassesOnly(container);
  });
});

describe('RvFormatBadges — the formats as one image', () => {
  it('RV-02’s row: `span.rk-fmts[role=img]`, in the foundation’s order', () => {
    const expected = drawnElement(
      excerpt('<span class="rk-fmts" role="img" aria-label="{{ r.fmtAria }}">', '</sc-for></span>'),
      { r: { fmtAria: 'Formats: WEB, VR', fmts: ['WEB', 'VR'] } },
      '.rk-fmts',
    );
    const { container } = render(
      <RvFormatBadges formats={['VR', 'WEB']} label="Formats: WEB, VR" />,
    );
    expectSame(container.firstElementChild!, expected);
    expect(screen.getByRole('img', { name: 'Formats: WEB, VR' })).toBeInTheDocument();
  });
});

/** SUB-0077 waiting, resubmitted · revision 2 (the export's `itemVals`, board RV03). */
const ITEM = {
  fromLabel: 'Review queue',
  title: 'Conduction Through a Composite Wall',
  ...kindVals('resub', 'Resubmitted', 'revision 2'),
  hasLead: true,
  lead: 'Measure the temperature profile across a three-layer wall and compare it with the series-resistance model.',
  stClsLg: 'xr-st xr-st--info rk-st-lg rv-st-wrap',
  stLabel: 'Waiting for your decision',
  course: 'ME ZG523',
  courseName: 'Thermodynamics & Heat Transfer',
  who: 'From Northline Simulation Studio',
  facts: [
    { k: 'Waiting', v: '1 day · since 26 Aug' },
    { k: 'Revision', v: '2 · resubmitted 26 Aug' },
    { k: 'Version', v: '1.0' },
    { k: 'Formats', v: 'WEB · VR' },
  ],
  anchors: [
    { href: '#rv-s-chg', t: 'What changed', hasN: false, n: '' },
    { href: '#rv-s-lo', t: 'Learning outcomes', hasN: true, n: '3' },
    { href: '#rv-s-det', t: 'Description and documents', hasN: false, n: '' },
    { href: '#rv-s-del', t: 'Formats and delivery', hasN: true, n: '2' },
    { href: '#rv-s-hist', t: 'Review history', hasN: false, n: '' },
  ],
};

function IdCard({ goToFocus }: { readonly goToFocus?: string }) {
  return (
    <RvIdCard
      date="Thursday 27 August 2026"
      breadcrumbs={
        <Breadcrumbs levels={[{ label: ITEM.fromLabel, href: '#rv-top' }]} current={ITEM.title} />
      }
      kind={<RvKindTag kind="resub" label="Resubmitted" detail="revision 2" />}
      title={ITEM.title}
      titleId="rv-title"
      lead={ITEM.lead}
      status={
        <RvStatus tone="info" size="lg">
          {ITEM.stLabel}
        </RvStatus>
      }
      course={<RvCourse placement="card" code={ITEM.course} name={ITEM.courseName} />}
      who={ITEM.who}
      goTo={{
        label: 'Go to decision',
        targetId: 'rv-panel',
        ...(goToFocus ? { focusId: goToFocus } : {}),
      }}
      facts={ITEM.facts.map((fact) => ({ term: fact.k, value: fact.v }))}
      pageMapLabel="On this page"
      pageMap={ITEM.anchors.map((anchor) => ({
        targetId: anchor.href.slice(1),
        label: anchor.t,
        count: anchor.n || null,
      }))}
    />
  );
}

describe('RvIdCard — the identity card with its page map (RV-03, RV-04, RV-06)', () => {
  const navAt = TEMPLATE.indexOf('<nav class="rk-crumbs" aria-label="Breadcrumb">');
  const cardHtml = TEMPLATE.slice(
    TEMPLATE.lastIndexOf('<div>', navAt),
    TEMPLATE.indexOf('</header>', navAt) + '</header>'.length,
  );

  it('as RV03 draws it: date and crumbs, type, title, summary, status, course, sender, facts, page map', async () => {
    const expected = drawn(fill(cardHtml, { I: ITEM }));
    const { container } = render(<IdCard />);
    expect(v3Canonical(container.innerHTML)).toBe(
      v3Canonical([...expected.children].map((element) => element.outerHTML).join('')),
    );
    expectV3ClassesOnly(container);
    expectNoInternalReferences(container);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent(
      'Review queueConduction Through a Composite Wall',
    );
    await assertNoAxeViolations(container);
  });

  it('a page-map link scrolls its section’s heading to the top and focuses it', () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    render(
      <main>
        <IdCard goToFocus="rv-panel-h" />
        <section aria-labelledby="rv-s-lo">
          <h2 id="rv-s-lo" tabIndex={-1}>
            Learning outcomes
          </h2>
        </section>
        <aside id="rv-panel">
          <h2 id="rv-panel-h">Your decision</h2>
        </aside>
      </main>,
    );
    const map = screen.getByRole('navigation', { name: 'On this page' });
    const link = [...map.querySelectorAll('a')].find(
      (a) => a.textContent === 'Learning outcomes3',
    )!;
    expect(fireEvent.click(link)).toBe(false);
    expect(scroll).toHaveBeenCalledWith({ block: 'start' });
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Learning outcomes' }));
    // “Go to decision” with the panel heading: the heading takes focus.
    expect(fireEvent.click(screen.getByRole('link', { name: 'Go to decision' }))).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Your decision' }));
  });
});

describe('RvDetail — the item page’s layout', () => {
  it('the blocks, the panel, then the history (`rk-detail rv-detail`)', () => {
    const wrap = excerpt('<div class="rk-detailwrap">', '<div class="rk-mainsheet rv-main">');
    expect(wrap).toMatch(
      /^<div class="rk-detailwrap">\s*<div class="rk-detail rv-detail">\s*<div class="rk-mainsheet rv-main">$/,
    );
    const aside = TEMPLATE.indexOf(
      '<aside class="rk-aside" id="rv-panel" aria-labelledby="rv-panel-h">',
    );
    const history = TEMPLATE.indexOf(
      '<section class="{{ I.histCls }}" aria-labelledby="rv-s-hist">',
    );
    expect(aside).toBeGreaterThan(TEMPLATE.indexOf(wrap));
    expect(history).toBeGreaterThan(aside);
    const { container } = render(
      <RvDetail
        main={<p>Blocks</p>}
        panel={<p>Panel</p>}
        panelId="rv-panel"
        panelLabelledBy="rv-panel-h"
        history={<p>History</p>}
      />,
    );
    expect(container.innerHTML).toBe(
      '<div class="rk-detailwrap"><div class="rk-detail rv-detail"><div class="rk-mainsheet rv-main"><p>Blocks</p></div><aside class="rk-aside" id="rv-panel" aria-labelledby="rv-panel-h"><p>Panel</p></aside><p>History</p></div></div>',
    );
    expectV3ClassesOnly(container);
  });
});

describe('RvBlock, its heads and the quote', () => {
  it('the re-check request (`rv-block--attn`, band head, quote); its 12 px line is a kit spacing', () => {
    const html = excerpt(
      '<section class="rk-surface rv-block rv-block--attn" aria-labelledby="rv-s-recheck">',
      '</section>',
    );
    // The one inline style a product element needs (RV.dc.html ~425): the closing `p.rk-next`
    // takes `margin-top: 12px`; the screens draw it with the kit's `RecordLine space="above"`.
    expect(html).toContain('<p class="rk-next" style="margin-top: 12px">');
    const values = {
      I: {
        recheckWhen: '25 Aug 2026, 10:42',
        recheckReason:
          'The second learning outcome mentions a Pitot tube, which this experiment does not use. Please check the outcomes.',
        recheckBy: 'Kavya Nair, Content Manager',
      },
    };
    const expected = drawnElement(html, values, 'section');
    expected.querySelector('p.rk-next')!.remove();
    const { container } = render(
      <RvBlock weight="attn" labelledBy="rv-s-recheck">
        <RvBandHead
          titleId="rv-s-recheck"
          icon="kindRecheck"
          title="Sent back for a re-check"
          note={values.I.recheckWhen}
        />
        <RvQuote quote={values.I.recheckReason} by={values.I.recheckBy} />
      </RvBlock>,
    );
    expectSame(container.firstElementChild!, expected);
    expectV3ClassesOnly(container);
  });

  it('What changed in revision 2: band head, the earlier reason, was / now (the old value struck)', () => {
    const html = excerpt(
      '<section class="rk-surface rv-block" aria-labelledby="rv-s-chg">',
      '</section>',
    );
    const values = {
      I: {
        chgTitle: 'What changed in revision 2',
        prevReason: 'Please clarify the VR device requirements.',
        prevBy: 'Your reason when you returned revision 1 · 19 Aug 2026',
        changes: [
          {
            f: 'Formats & delivery · VR · Device need',
            was: 'VR headset',
            now: 'Standalone VR headset — no PC or cable needed — and about 2 × 2 m of clear floor',
          },
        ],
      },
    };
    const expected = drawnElement(html, values, 'section');
    const change = values.I.changes[0]!;
    const { container } = render(
      <RvBlock labelledBy="rv-s-chg">
        <RvBandHead
          titleId="rv-s-chg"
          icon="kindResubmission"
          title={values.I.chgTitle}
          note="Only what the vendor changed"
        />
        <div className="rv-chg">
          <RvQuote quote={`“${values.I.prevReason}”`} by={values.I.prevBy} />
          <RvComparison
            label={values.I.chgTitle}
            fieldHeader="Field"
            beforeHeader="Was"
            afterHeader="Now"
            rows={[
              {
                key: 'vr-device',
                field: change.f,
                before: [{ text: change.was, marked: true }],
                after: [{ text: change.now }],
              },
            ]}
          />
        </div>
      </RvBlock>,
    );
    expectSame(container.firstElementChild!, expected);
    expect(screen.getByRole('table', { name: values.I.chgTitle })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });

  it('Why this correction (the message icon) and What changes (live / proposed, runs struck and highlighted)', () => {
    const why = excerpt(
      '<section class="rk-surface rv-block" aria-labelledby="rv-s-why">',
      '</section>',
    );
    const whyValues = {
      I: {
        why: 'Corrects the reflux statement in the description.',
        whyBy: 'Kavya Nair, Content Manager · sent 25 Aug 2026, 16:00',
      },
    };
    const { container, rerender } = render(
      <RvBlock labelledBy="rv-s-why">
        <RvBandHead
          titleId="rv-s-why"
          icon="message"
          title="Why this correction"
          note="From the Content Manager"
        />
        <RvQuote quote={whyValues.I.why} by={whyValues.I.whyBy} />
      </RvBlock>,
    );
    expectSame(container.firstElementChild!, drawnElement(why, whyValues, 'section'));

    const cmp = excerpt(
      '<section class="rk-surface rv-block" aria-labelledby="rv-s-cmp">',
      '</section>',
    );
    const rows = [
      {
        f: 'Description',
        live: [
          { t: 'The overhead purity responds with realistic lag. ' },
          { t: 'Lowering', m: 1 },
          { t: ' the reflux ratio raises the overhead purity.' },
        ],
        prop: [
          { t: 'The overhead purity responds with realistic lag. ' },
          { t: 'Raising', m: 1 },
          { t: ' the reflux ratio raises the overhead purity.' },
        ],
      },
      { f: 'Version', live: [{ t: '1.2', m: 1 }], prop: [{ t: '1.3', m: 1 }] },
    ];
    const cmpValues = {
      I: {
        cmpNote: '2 changed fields · everything else stays as in 1.2',
        liveVer: '1.2',
        newVer: '1.3',
        cmp: rows.map((row) => ({
          f: row.f,
          live: row.live.map((s) => ({ t: s.t, mark: !!s.m, plain: !s.m })),
          prop: row.prop.map((s) => ({ t: s.t, mark: !!s.m, plain: !s.m })),
        })),
      },
    };
    rerender(
      <RvBlock labelledBy="rv-s-cmp">
        <RvBlockHead titleId="rv-s-cmp" title="What changes" note={cmpValues.I.cmpNote} />
        <RvComparison
          label="What changes, live now against proposed"
          fieldHeader="Field"
          beforeHeader="Live now · 1.2"
          afterHeader="Proposed · 1.3"
          rows={rows.map((row) => ({
            key: row.f,
            field: row.f,
            before: row.live.map((s) => ({ text: s.t, marked: !!s.m })),
            after: row.prop.map((s) => ({ text: s.t, marked: !!s.m })),
          }))}
        />
        <RvFootnote>Removed text is struck through; added text is highlighted.</RvFootnote>
      </RvBlock>,
    );
    expectSame(container.firstElementChild!, drawnElement(cmp, cmpValues, 'section'));
    expect(container.querySelectorAll('del')).toHaveLength(2);
    expect(container.querySelectorAll('ins')).toHaveLength(2);
    expectV3ClassesOnly(container);
  });

  it('a reference block’s head with its overline (`p.rv-block-k`) and note', () => {
    const expected = drawnElement(
      excerpt(
        '<div class="rv-block-h"><div><p class="rv-block-k">{{ I.vendorK }}</p>',
        '<p class="rb-note">Read-only</p></div>',
      ),
      { I: { vendorK: 'From Northline Simulation Studio' } },
      '.rv-block-h',
    );
    const { container } = render(
      <RvBlockHead
        titleId="rv-s-det"
        kicker="From Northline Simulation Studio"
        title="Description and documents"
        note="Read-only"
      />,
    );
    expectSame(container.firstElementChild!, expected);
  });
});

describe('RvOutcomesReadOnly — learning outcomes, read-only (`ol.rv-lo-ro`)', () => {
  it('RV-06 names the list; the live experiment’s list has no name', () => {
    const decided = drawnElement(
      excerpt('<ol class="rv-lo-ro" aria-label="Learning outcomes">', '</ol>'),
      {
        I: {
          loRo: ['Explain conduction through layers in series.', 'Predict interface temperatures.'],
        },
      },
      'ol',
    );
    const { container, rerender } = render(
      <RvOutcomesReadOnly
        label="Learning outcomes"
        outcomes={[
          'Explain conduction through layers in series.',
          'Predict interface temperatures.',
        ]}
      />,
    );
    expectSame(container.firstElementChild!, decided);
    const live = drawnElement(
      excerpt('<ol class="rv-lo-ro"><sc-for list="{{ I.liveLo }}"', '</ol>'),
      { I: { liveLo: ['Bring a column to steady state from cold start'] } },
      'ol',
    );
    rerender(<RvOutcomesReadOnly outcomes={['Bring a column to steady state from cold start']} />);
    expectSame(container.firstElementChild!, live);
  });
});

describe('the decision panel’s parts', () => {
  it('RvReadyList — Before you decide: the rule met or not, the whole Experiment, the link to the change', () => {
    const html = excerpt('<div class="rv-ready">', '</ul>\n                </div>');
    const ready = [
      {
        cls: 'is-need',
        id: 'rv-ready-0',
        icoCls: 'rv-ready-ico is-alert',
        t: 'No learning outcomes yet.',
        d: 'Approve needs at least one.',
        hasLink: true,
        link: 'Add an outcome',
        href: '#rv-lo-new',
      },
      {
        cls: 'is-info',
        id: 'rv-whole',
        icoCls: 'rv-ready-ico is-layers',
        t: 'Whole Experiment.',
        d: 'You decide for every format together: WEB and VR.',
        hasLink: false,
        link: '',
        href: '#rv-panel',
      },
      {
        cls: 'is-info',
        id: 'rv-ready-2',
        icoCls: 'rv-ready-ico is-resub',
        t: '1 change since you returned it.',
        d: '',
        hasLink: true,
        link: 'See what changed',
        href: '#rv-s-chg',
      },
    ];
    const expected = drawnElement(html, { I: { ready } }, '.rv-ready');
    const focus = vi.fn();
    Element.prototype.scrollIntoView = focus;
    const { container } = render(
      <main>
        <RvReadyList
          title="Before you decide"
          items={[
            {
              id: 'rv-ready-0',
              tone: 'need',
              icon: 'alert',
              title: ready[0]!.t,
              detail: ready[0]!.d,
              link: { label: 'Add an outcome', targetId: 'rv-lo-new', mode: 'field' },
            },
            {
              id: 'rv-whole',
              tone: 'info',
              icon: 'layers',
              title: ready[1]!.t,
              detail: ready[1]!.d,
            },
            {
              id: 'rv-ready-2',
              tone: 'info',
              icon: 'resub',
              title: ready[2]!.t,
              link: { label: 'See what changed', targetId: 'rv-s-chg' },
            },
          ]}
        />
        <label htmlFor="rv-lo-new">Add a learning outcome</label>
        <input id="rv-lo-new" />
      </main>,
    );
    expectSame(container.querySelector('.rv-ready')!, expected);
    expectV3ClassesOnly(container);
    fireEvent.click(screen.getByRole('link', { name: 'Add an outcome' }));
    expect(focus).toHaveBeenCalledWith({ block: 'nearest' });
    expect(document.activeElement).toBe(screen.getByLabelText('Add a learning outcome'));
  });

  it('RvPath — What happens next, the reviewer’s step first', () => {
    const html = excerpt('<div class="rv-path">', '</ol>\n                </div>');
    const path = [
      {
        n: '1',
        t: 'You · academic decision',
        d: 'Approve it, or return it to the vendor.',
        cls: 'is-now',
      },
      { n: '2', t: 'Content Manager · publication', d: 'Approving does not publish.', cls: '' },
      { n: '3', t: 'Institutions · student access', d: 'Publishing gives no one access.', cls: '' },
    ];
    const { container } = render(
      <RvPath
        title="What happens next"
        steps={path.map((step) => ({
          key: step.n,
          number: step.n,
          title: step.t,
          detail: step.d,
          now: step.cls === 'is-now',
        }))}
      />,
    );
    expectSame(container.firstElementChild!, drawnElement(html, { I: { path } }, '.rv-path'));
    expectV3ClassesOnly(container);
  });

  it('RvRefusal — a refused decision, focusable', () => {
    const html = excerpt('<div class="rk-notice rk-notice--warn rv-refusal"', '</div>');
    const values = {
      I: {
        refusalT: 'Nothing new was recorded',
        refusalD:
          'You had already approved this in another window. The page now shows that decision.',
      },
    };
    const { container } = render(
      <RvRefusal id="rv-refusal" title={values.I.refusalT} detail={values.I.refusalD} />,
    );
    expectSame(container.firstElementChild!, drawnElement(html, values, '.rv-refusal'));
    expect(screen.getByRole('alert')).toHaveAttribute('tabindex', '-1');
    expectV3ClassesOnly(container);
  });

  it('RvDecisionOutcome — returned: status, when, the reason with its references, where it stands, next, back', async () => {
    const html = excerpt(
      '<div class="rk-done" id="rv-done" tabindex="-1">',
      '</a>\n                </div>',
    );
    const values = {
      I: {
        doneStCls: 'xr-st xr-st--err rk-st-lg rv-st-wrap',
        doneLabel: 'Returned to vendor',
        hasDoneMeta: true,
        doneMeta: 'Decided by you on 27 Aug 2026, 15:20',
        hasDoneReason: true,
        doneReason: 'Please say which standalone headsets the VR build runs on.',
        hasDoneRefs: true,
        doneRefs: [
          'Formats & delivery · VR · Device need',
          'Formats & delivery · VR · Install notes',
        ],
        stand: [
          { k: 'Academic review', v: 'Returned to the vendor' },
          { k: 'References', v: '2 fields' },
          { k: 'Publication', v: 'Not published' },
        ],
        hasNext: true,
        next: 'The vendor sees your reason above their editor and can revise and resubmit.',
        backLabel: 'Back to the review queue',
      },
    };
    const { container } = render(
      <RvDecisionOutcome
        id="rv-done"
        status={
          <RvStatus tone="err" size="lg">
            {values.I.doneLabel}
          </RvStatus>
        }
        meta={values.I.doneMeta}
        reason={{
          label: 'Your reason',
          text: values.I.doneReason,
          references: values.I.doneRefs,
        }}
        stand={values.I.stand.map((item) => ({ term: item.k, value: item.v }))}
        next={values.I.next}
        action={<ButtonLink href="#rv-top">{values.I.backLabel}</ButtonLink>}
      />,
    );
    expectSame(container.firstElementChild!, drawnElement(html, values, '.rk-done'));
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('RvDecisionOutcome — approved, from an earlier session: no reason, no references', () => {
    const { container } = render(
      <RvDecisionOutcome
        status={
          <RvStatus tone="ok" size="lg">
            Approved — with the Content Manager
          </RvStatus>
        }
        meta="Decided by you on 14 Aug 2026, 15:10"
        stand={[{ term: 'Academic review', value: 'Approved by you' }]}
      />,
    );
    expect(container.querySelector('.rv-done-q')).toBeNull();
    expect(container.querySelector('.rk-next')).toBeNull();
    expect(container.querySelector('.rk-done')).toHaveAttribute('tabindex', '-1');
  });
});

describe('RvHistory — the item’s history', () => {
  const html = excerpt(
    '<section class="{{ I.histCls }}" aria-labelledby="rv-s-hist">',
    '</section>',
  );
  const hist = [
    {
      w: 'Resubmitted · revision 2',
      t: '26 Aug 2026, 11:30',
      n: 'Northline Simulation Studio changed the VR device need.',
      hasN: true,
      cls: 'is-latest',
    },
    { w: 'Submitted for academic review', t: '12 Aug 2026, 10:52', n: '', hasN: false, cls: '' },
  ];

  it.each([
    ['quiet', 'rv-block rv-block--quiet rv-hist'],
    ['card', 'rk-surface rv-block rv-hist rv-hist--card'],
  ] as const)('%s (`%s`)', (variant, histCls) => {
    const expected = drawnElement(
      html,
      { I: { histCls, histTitle: 'Review history', hist } },
      'section',
    );
    const { container } = render(
      <RvHistory titleId="rv-s-hist" title="Review history" note="Newest first" variant={variant}>
        <Timeline events={hist.map((event) => ({ what: event.w, when: event.t, note: event.n }))} />
      </RvHistory>,
    );
    expectSame(container.firstElementChild!, expected);
    expectV3ClassesOnly(container);
  });
});

describe('an item page composed of the shared pieces', () => {
  it('passes the accessibility checks and prints no internal reference', async () => {
    const { container } = render(
      <main>
        <IdCard />
        <RvDetail
          main={
            <RvBlock weight="attn" labelledBy="rv-s-recheck">
              <RvBandHead
                titleId="rv-s-recheck"
                icon="kindRecheck"
                title="Sent back for a re-check"
              />
              <RvQuote quote="Please check the outcomes." by="Kavya Nair, Content Manager" />
            </RvBlock>
          }
          panelId="rv-panel"
          panelLabelledBy="rv-panel-h"
          panel={
            <div className="rk-panel">
              <div className="rk-panel-head">
                <h2 id="rv-panel-h">Your decision</h2>
              </div>
              <div className="rk-panel-body">
                <RvReadyList
                  title="Before you decide"
                  items={[
                    { id: 'rv-whole', tone: 'info', icon: 'layers', title: 'Whole Experiment.' },
                  ]}
                />
                <RvPath
                  title="What happens next"
                  steps={[
                    {
                      key: '1',
                      number: '1',
                      title: 'You · academic decision',
                      detail: 'Approve it.',
                      now: true,
                    },
                  ]}
                />
              </div>
            </div>
          }
          history={
            <RvHistory
              titleId="rv-s-hist"
              title="Review history"
              note="Newest first"
              variant="quiet"
            >
              <Timeline events={[{ what: 'Submitted for academic review', when: '12 Aug 2026' }]} />
            </RvHistory>
          }
        />
      </main>,
    );
    expectV3ClassesOnly(container);
    expectNoInternalReferences(container);
    await assertNoAxeViolations(container);
  });
});
