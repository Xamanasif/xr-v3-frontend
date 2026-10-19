/**
 * The Vendor role's shared patterns (owner-approved export design/v3-refined-b/roles/VE-v1,
 * `project/Main.dc.html`): what the record (`V.record`) and the editor (`V.editor`: revise mode,
 * the check step, a read-only draft, the outcome card) both draw — the returned-reason panel, the
 * read-only delivery blocks, the compact format chips, the titled sections and the learning
 * outcomes. Each against the export's markup in every place it draws it, the class contract and
 * the accessibility checks.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { assertNoAxeViolations, expectV3ClassesOnly, veExportText } from '../testing/index.js';
import { Button } from './actions.js';
import { DefinitionList } from './detail.js';
import { V3_ICON_PATHS } from './icons.js';
import {
  VendorDeliveryList,
  VendorDeliveryView,
  VendorFormatChips,
  VendorLearningOutcomes,
  VendorReturnedReason,
  VendorSection,
} from './ve.js';

const MAIN = veExportText('Main.dc.html');
/** The export's template only (the markup before its logic script). */
const TEMPLATE = MAIN.slice(0, MAIN.indexOf('<script type="text/x-dc"'));
/** The editor's markup in the export (`V.editor`: the four steps, revise, outcome, read-only). */
const EDITOR_VIEW = TEMPLATE.slice(
  TEMPLATE.indexOf('<!-- ═══ Experiment editor'),
  TEMPLATE.indexOf('<!-- ═══ VE-07 Experiment record'),
);
/** The record view's markup in the export (`V.record`). */
const RECORD_VIEW = TEMPLATE.slice(
  TEMPLATE.indexOf('<!-- ═══ VE-07 Experiment record'),
  TEMPLATE.indexOf('<!-- ═══ XS-07 Help & support'),
);

const pathOf = (element: Element | null) => element?.querySelector('path')?.getAttribute('d');
const shape = (element: Element) =>
  [...element.children].map((child) => `${child.tagName} ${child.className}`);

describe('VendorReturnedReason (`section.vr-ret`: VE-07 the record, VE-08 above the editor)', () => {
  it('draws the same panel in both places: the icon, who and when, the reason, the chips', () => {
    for (const [view, title, refs] of [
      [RECORD_VIEW, 've-rret-t', 've-rret-rk'],
      [EDITOR_VIEW, 've-ret-t', 've-ret-rk'],
    ] as const) {
      for (const piece of [
        `<section class="vr-ret" id="ve-reason" tabindex="-1" aria-labelledby="${title}">`,
        '<span class="vr-ret-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#vei-return"></use></svg></span>',
        '<div class="vr-ret-main">',
        `<h2 class="vr-ret-t" id="${title}">`,
        '<p class="vr-ret-m">',
        '<blockquote class="vr-ret-q">',
        '<div class="vr-ret-refs">',
        `<p class="vr-ret-refs-k" id="${refs}">What it refers to</p>`,
        `<ul class="vr-ret-reflist" aria-labelledby="${refs}">`,
        '<button type="button" class="ve-ref" aria-label="{{ x.aria }}" onClick="{{ x.go }}"',
        '{{ x.t }}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#vei-arrow"></use></svg></button>',
      ]) {
        expect(view, piece).toContain(piece);
      }
    }
    // Only the record draws the changes saved and not resubmitted inside the panel.
    expect(RECORD_VIEW).toContain('<div class="vr-ret-pend" role="status">');
    expect(EDITOR_VIEW).not.toContain('vr-ret-pend');
  });

  it('the record: the chips that open the field, the changes saved (without the changed fields)', async () => {
    for (const piece of [
      '<p class="vr-ret-pend-t">Your changes are saved but not resubmitted</p>',
      '<p class="vr-ret-pend-d">{{ R.pendingText }}</p>',
    ]) {
      expect(RECORD_VIEW).toContain(piece);
    }
    const onSelect = vi.fn();
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <VendorReturnedReason
        id="vr-reason"
        ref={ref}
        titleId="vr-ret-t"
        title="Returned by the Academic Reviewer"
        meta="24 Aug 2026, 09:30 · Prof. A. Menon"
        reason="The AR install notes don’t say which phones and tablets it runs on."
        references={{
          label: 'What it refers to',
          labelId: 'vr-ret-rk',
          items: [
            {
              key: 'ar.device-need',
              label: 'Formats & delivery · AR · Device need',
              accessibleName: 'Revise: go to Formats & delivery · AR · Device need',
              onSelect,
            },
            {
              key: 'ar.install-notes',
              label: 'Formats & delivery · AR · Install notes',
              accessibleName: 'Revise: go to Formats & delivery · AR · Install notes',
              onSelect: () => {},
            },
          ],
        }}
        saved={{
          title: 'Your changes are saved but not resubmitted',
          line: 'Saved 27 Aug 2026, 10:40. Only you can see them. Everyone else still sees revision 1 as it was submitted.',
        }}
      />,
    );
    const panel = screen.getByRole('region', { name: 'Returned by the Academic Reviewer' });
    expect(panel).toBe(ref.current);
    expect(panel).toHaveClass('vr-ret');
    expect(panel).toHaveAttribute('id', 'vr-reason');
    expect(panel).toHaveAttribute('tabindex', '-1');
    expect(shape(panel)).toEqual(['SPAN vr-ret-ico', 'DIV vr-ret-main']);
    const icon = panel.querySelector(':scope > span.vr-ret-ico')!;
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(pathOf(icon)).toBe(V3_ICON_PATHS.returned);
    const main = panel.querySelector(':scope > div.vr-ret-main')!;
    expect(shape(main)).toEqual([
      'H2 vr-ret-t',
      'P vr-ret-m',
      'BLOCKQUOTE vr-ret-q',
      'DIV vr-ret-refs',
      'DIV vr-ret-pend',
    ]);
    expect(main.querySelector('.vr-ret-m')).toHaveTextContent(
      '24 Aug 2026, 09:30 · Prof. A. Menon',
    );
    const list = screen.getByRole('list', { name: 'What it refers to' });
    expect(list).toHaveClass('vr-ret-reflist');
    const chip = within(list).getByRole('button', {
      name: 'Revise: go to Formats & delivery · AR · Device need',
    });
    expect(chip.className).toBe('ve-ref');
    expect(chip).toHaveAttribute('type', 'button');
    expect(chip).toHaveTextContent('Formats & delivery · AR · Device need');
    expect(pathOf(chip)).toBe(V3_ICON_PATHS.next);
    fireEvent.click(chip);
    expect(onSelect).toHaveBeenCalledTimes(1);
    const saved = within(panel).getByRole('status');
    expect(saved).toHaveClass('vr-ret-pend');
    expect(pathOf(saved)).toBe(V3_ICON_PATHS.lock);
    expect(saved.querySelector('.vr-ret-pend-t')).toHaveTextContent(
      'Your changes are saved but not resubmitted',
    );
    // The changed-field list is drawn only by a read that holds it.
    expect(saved.querySelector('.vr-ret-pend-k, .vr-ret-pend-l')).toBeNull();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('above the editor: the chips that jump to the step and field; nothing saved inside', async () => {
    const onSelect = vi.fn();
    const { container } = render(
      <div className="xr rb">
        <VendorReturnedReason
          id="reason"
          titleId="reason-t"
          title="Returned by the Academic Reviewer"
          meta="24 Aug 2026, 09:30 · Prof. A. Menon"
          reason="Add the supported devices."
          references={{
            label: 'What it refers to',
            labelId: 'reason-rk',
            items: [
              {
                key: 'd',
                label: 'Formats & delivery · AR · Device need',
                accessibleName: 'Go to Formats & delivery · AR · Device need',
                onSelect,
              },
            ],
          }}
        />
      </div>,
    );
    const panel = screen.getByRole('region', { name: 'Returned by the Academic Reviewer' });
    expect(panel.querySelector('.vr-ret-ico path')).toHaveAttribute('d', V3_ICON_PATHS.returned);
    const chips = screen.getByRole('list', { name: 'What it refers to' });
    const chip = within(chips).getByRole('button', {
      name: 'Go to Formats & delivery · AR · Device need',
    });
    expect(chip.className).toBe('ve-ref');
    expect(pathOf(chip)).toBe(V3_ICON_PATHS.next);
    fireEvent.click(chip);
    expect(onSelect).toHaveBeenCalled();
    expect(panel.querySelector('.vr-ret-pend')).toBeNull();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('without references or saved changes: the reason alone', async () => {
    const { container } = render(
      <VendorReturnedReason
        id="vr-reason"
        titleId="vr-ret-t"
        title="Returned by the Content Manager"
        meta="22 Aug 2026, 10:40 · Kavya Nair"
        reason="The summary runs to three sentences."
        references={{ label: 'What it refers to', labelId: 'rk', items: [] }}
      />,
    );
    expect(container.querySelector('.vr-ret-refs, .vr-ret-pend')).toBeNull();
    expect(container.querySelector('blockquote.vr-ret-q')).toHaveTextContent(
      'The summary runs to three sentences.',
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

describe('VendorDeliveryList and VendorDeliveryView (`div.vr-dlvs` > `div.vr-dlv`, read-only)', () => {
  const READ_ONLY_BLOCK =
    '<div class="vr-dlv vr-dlv--ro"><div class="vr-dlv-h"><span class="xr-fmt">{{ d.code }}</span><p class="vr-dlv-t">{{ d.name }} <span class="vr-dlv-k">· {{ d.kind }}</span></p></div><dl class="rk-dl vr-dlv-b">';

  it('the record, the check step and a read-only draft draw the same block', () => {
    // The record's Details, the check step's "Formats and delivery" and "What you entered".
    expect(RECORD_VIEW).toContain(`<div class="vr-dlvs"><sc-for list="{{ R.delivery }}"`);
    expect(RECORD_VIEW).toContain(READ_ONLY_BLOCK);
    expect(EDITOR_VIEW.split(READ_ONLY_BLOCK)).toHaveLength(3);
    expect(EDITOR_VIEW).toContain(`<div class="vr-dlvs"><sc-for list="{{ E.delivery }}"`);
    expect(EDITOR_VIEW).toContain(
      `<div class="vr-dlvs vr-dlvs--after"><sc-for list="{{ E.delivery }}"`,
    );
  });

  it('the chip, the name and kind, then the rows; `vr-dlv--ro` (styled by no sheet) left out', async () => {
    const { container } = render(
      <div className="xr rb">
        <VendorDeliveryList>
          <VendorDeliveryView
            code="WEB"
            name="Browser"
            kind="Web link"
            rows={[
              { term: 'Web link', value: 'https://labs.example/fin-tube' },
              { term: 'Browser and computer needed', value: 'A current browser' },
            ]}
          />
          <VendorDeliveryView
            code="VR"
            name="Virtual reality"
            kind="App package"
            rows={[{ term: 'Package label', value: 'Composite Wall VR' }]}
          />
        </VendorDeliveryList>
        <VendorDeliveryList after>
          <p>Blocks</p>
        </VendorDeliveryList>
      </div>,
    );
    const [list, after] = [...container.querySelectorAll('.vr-dlvs')];
    expect(list!.className).toBe('vr-dlvs');
    expect(after!.className).toBe('vr-dlvs vr-dlvs--after');
    const blocks = [...list!.children];
    expect(blocks.map((block) => block.className)).toEqual(['vr-dlv', 'vr-dlv']);
    expect(blocks[1]!.innerHTML).toBe(
      '<div class="vr-dlv-h"><span class="xr-fmt">VR</span><p class="vr-dlv-t">Virtual reality <span class="vr-dlv-k">· App package</span></p></div><dl class="rk-dl vr-dlv-b"><dt>Package label</dt><dd>Composite Wall VR</dd></dl>',
    );
    expect(blocks[0]!.querySelector('.vr-dlv-h')!.textContent).toBe('WEBBrowser · Web link');
    expect(blocks[0]!.querySelectorAll('dl > dt')).toHaveLength(2);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

describe('VendorFormatChips (`span.ve-chips`)', () => {
  it('named by visually hidden words where the export names them; read as they are elsewhere', async () => {
    // "Where it stands" and the outcome card name the chips (an `aria-label` on a plain span,
    // which assistive technology ignores: hidden words here); "What you entered" does not.
    expect(RECORD_VIEW).toContain(
      '<span class="ve-chips" aria-label="{{ R.fmtAria }}"><sc-for list="{{ R.fmts }}" as="f" hint-placeholder-count="2"><span class="xr-fmt" aria-hidden="true">{{ f }}</span>',
    );
    expect(EDITOR_VIEW).toContain(
      '<span class="ve-chips" aria-label="{{ E.doneFmtAria }}"><sc-for list="{{ E.doneFmts }}" as="f" hint-placeholder-count="1"><span class="xr-fmt" aria-hidden="true">{{ f }}</span>',
    );
    expect(EDITOR_VIEW).toContain(
      '<span class="ve-chips"><sc-for list="{{ E.chosen }}" as="f" hint-placeholder-count="1"><span class="xr-fmt">{{ f }}</span>',
    );
    const { container } = render(
      <div className="xr rb">
        <p>
          <VendorFormatChips formats={['WEB', 'VR']} label="Formats: WEB, VR" />
        </p>
        <p>
          <VendorFormatChips formats={['AR']} />
        </p>
      </div>,
    );
    const [named, plain] = [...container.querySelectorAll('span.ve-chips')];
    expect(named!.innerHTML).toBe(
      '<span class="xr-sr">Formats: WEB, VR</span><span class="xr-fmt" aria-hidden="true">WEB</span><span class="xr-fmt" aria-hidden="true">VR</span>',
    );
    expect(plain!.innerHTML).toBe('<span class="xr-fmt">AR</span>');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

describe('VendorSection (`vr-sec` > `vr-sec-h` > `h2.vr-sec-t`)', () => {
  it('a titled group of the editor: its description and note; a row head with a live status or an action', async () => {
    for (const piece of [
      '<div class="vr-sec" role="group" aria-labelledby="s1-a-h">',
      '<div class="vr-sec-h"><h2 class="vr-sec-t" id="s1-a-h" tabindex="-1">Course and name</h2></div>',
      '<div class="vr-sec-h vr-sec-h--row">',
      '<p class="vr-sec-st" role="status">{{ E.dlvSummary }}</p>',
      '<p class="vr-foot"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#vei-info"></use></svg><span>',
      '<h2 class="vr-sec-t" id="s3-b-h" tabindex="-1">Documents <span class="ve-opt">(optional)</span></h2>',
    ]) {
      expect(EDITOR_VIEW).toContain(piece);
    }
    const { container } = render(
      <div className="xr rb">
        <VendorSection titleId="a" title="Course and name" titleFocusTarget note="A note">
          <div className="vr-grid">
            <p>Fields</p>
          </div>
        </VendorSection>
        <VendorSection
          titleId="b"
          title="Delivery details"
          description="One panel for each format you chose."
          status="1 of 2 formats complete"
          statusLive
        />
        <VendorSection
          titleId="c"
          title="Documents"
          optional="(optional)"
          description="Handouts."
          action={<Button>Add document</Button>}
        />
      </div>,
    );
    const first = screen.getByRole('group', { name: 'Course and name' });
    expect(first.innerHTML).toBe(
      `<div class="vr-sec-h"><h2 class="vr-sec-t" id="a" tabindex="-1">Course and name</h2></div><div class="vr-grid"><p>Fields</p></div><p class="vr-foot"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${V3_ICON_PATHS.infoNote}"></path></svg><span>A note</span></p>`,
    );
    const second = screen.getByRole('group', { name: 'Delivery details' });
    expect(second.querySelector('.vr-sec-h')!.className).toBe('vr-sec-h vr-sec-h--row');
    expect(second.querySelector('.vr-sec-h > div > p.vr-sec-d')).toHaveTextContent(
      'One panel for each format you chose.',
    );
    expect(second.querySelector('p.vr-sec-st')).toHaveAttribute('role', 'status');
    const third = screen.getByRole('group', { name: 'Documents (optional)' });
    expect(third.querySelector('h2')!.innerHTML).toBe(
      'Documents <span class="ve-opt">(optional)</span>',
    );
    expect(third.querySelector('.vr-sec-h > button.rb-btn')).toHaveTextContent('Add document');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('a section of the record: the row head with or without its status line, the foot', async () => {
    for (const piece of [
      '<section class="vr-sec" aria-labelledby="r-cd">',
      '<div class="vr-sec-h"><h2 class="vr-sec-t" id="r-cd">Course and description</h2></div>',
      '<div class="vr-sec-h vr-sec-h--row"><h2 class="vr-sec-t" id="r-fd">Formats and delivery</h2><sc-if value="{{ R.isPub }}" hint-placeholder-val="{{ false }}"><p class="vr-sec-st">Formats published: {{ R.fmtText }}</p></sc-if></div>',
      '<p class="vr-foot"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#vei-info"></use></svg><span>Changes to a published experiment are not made from the Vendor workspace.</span></p>',
    ]) {
      expect(RECORD_VIEW).toContain(piece);
    }
    const { container } = render(
      <div className="rk-surface vr-sheet">
        <VendorSection as="section" titleId="vr-cd" title="Course and description">
          <DefinitionList items={[{ term: 'Course', value: 'ME ZG523 · Thermodynamics' }]} />
        </VendorSection>
        <VendorSection
          as="section"
          row
          titleId="vr-fd"
          title="Formats and delivery"
          status="Formats published: WEB · VR"
          note="Changes to a published experiment are not made from the Vendor workspace."
        >
          <p>Blocks</p>
        </VendorSection>
        <VendorSection as="section" row titleId="vr-fd2" title="Formats and delivery 2">
          <p>Blocks</p>
        </VendorSection>
      </div>,
    );
    const course = screen.getByRole('region', { name: 'Course and description' });
    expect(course.tagName).toBe('SECTION');
    expect(course).not.toHaveAttribute('role');
    expect(course.querySelector('.vr-sec-h')!.outerHTML).toBe(
      '<div class="vr-sec-h"><h2 class="vr-sec-t" id="vr-cd">Course and description</h2></div>',
    );
    const delivery = screen.getByRole('region', { name: 'Formats and delivery' });
    expect(delivery.querySelector('.vr-sec-h')!.outerHTML).toBe(
      '<div class="vr-sec-h vr-sec-h--row"><h2 class="vr-sec-t" id="vr-fd">Formats and delivery</h2><p class="vr-sec-st">Formats published: WEB · VR</p></div>',
    );
    const foot = delivery.querySelector(':scope > p.vr-foot')!;
    expect(pathOf(foot)).toBe(V3_ICON_PATHS.infoNote);
    expect(foot).toHaveTextContent(
      'Changes to a published experiment are not made from the Vendor workspace.',
    );
    // Not published: the row head without its status line, as the export draws it.
    const unpublished = screen.getByRole('region', { name: 'Formats and delivery 2' });
    expect(unpublished.querySelector('.vr-sec-h')!.outerHTML).toBe(
      '<div class="vr-sec-h vr-sec-h--row"><h2 class="vr-sec-t" id="vr-fd2">Formats and delivery 2</h2></div>',
    );
    expect(unpublished.querySelector('.vr-foot')).toBeNull();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('the one section of a sheet its label names (`as="div"`): the history, "What you entered"', async () => {
    for (const piece of [
      '<section class="rk-surface vr-sheet vr-hist" aria-labelledby="r-hh">\n                <div class="vr-sec">\n                  <div class="vr-sec-h vr-sec-h--row"><h2 class="vr-sec-t" id="r-hh" tabindex="-1">',
      '<section class="rk-surface vr-sheet" aria-labelledby="ve-ro-h">\n          <div class="vr-sec">\n            <div class="vr-sec-h"><h2 class="vr-sec-t" id="ve-ro-h">What you entered</h2></div>',
    ]) {
      expect(TEMPLATE).toContain(piece);
    }
    const titleRef = createRef<HTMLHeadingElement>();
    const { container } = render(
      <section className="rk-surface vr-sheet" aria-labelledby="h">
        <VendorSection
          as="div"
          titleId="h"
          title="Submission and version history"
          titleFocusTarget
          titleRef={titleRef}
          status="Newest first · not an audit log"
        >
          <p>Timeline</p>
        </VendorSection>
      </section>,
    );
    const sheet = screen.getByRole('region', { name: 'Submission and version history' });
    const section = sheet.firstElementChild!;
    expect(section.outerHTML).toBe(
      '<div class="vr-sec"><div class="vr-sec-h vr-sec-h--row"><h2 class="vr-sec-t" id="h" tabindex="-1">Submission and version history</h2><p class="vr-sec-st">Newest first · not an audit log</p></div><p>Timeline</p></div>',
    );
    expect(titleRef.current).toBe(section.querySelector('h2'));
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

describe('VendorLearningOutcomes (`section.vr-sec` > `p.ve-intro` + `ol.ve-los`)', () => {
  const HEAD =
    '<div class="vr-sec-h vr-sec-h--row"><h2 class="vr-sec-t" id="{id}">Learning outcomes</h2><p class="vr-sec-st">Added by the Academic Reviewer · read-only</p></div>';
  const LIST =
    '<p class="ve-intro" style="margin-bottom: 10px">One set for every format.</p><ol class="ve-los">';
  const NONE =
    '<p class="ve-intro">None yet. The Academic Reviewer adds them during review — one set for every format.</p>';

  it('the record and the check step draw the same section; the line 10 px over the list (V3P-13)', async () => {
    for (const [view, id] of [
      [RECORD_VIEW, 'r-lo'],
      [EDITOR_VIEW, 's4-4-h'],
    ] as const) {
      expect(view).toContain(`<section class="vr-sec" aria-labelledby="${id}">`);
      expect(view).toContain(HEAD.replace('{id}', id));
      expect(view).toContain(LIST);
      expect(view).toContain(NONE);
    }
    const { container } = render(
      <div className="rk-surface vr-sheet">
        <VendorLearningOutcomes
          titleId="lo"
          title="Learning outcomes"
          by="Added by the Academic Reviewer · read-only"
          line="One set for every format."
          empty="None yet."
          outcomes={[
            { key: '1', text: 'Quantify the effect of fouling' },
            { key: '2', text: 'Distinguish degradation from drift' },
          ]}
        />
      </div>,
    );
    const outcomes = screen.getByRole('region', { name: 'Learning outcomes' });
    expect(shape(outcomes)).toEqual([
      'DIV vr-sec-h vr-sec-h--row',
      'P ve-intro rk-x-intro-below',
      'OL ve-los',
    ]);
    expect(outcomes.querySelector('.vr-sec-h')!.outerHTML).toBe(HEAD.replace('{id}', 'lo'));
    expect(outcomes.querySelector('p.ve-intro')).toHaveTextContent('One set for every format.');
    expect(
      within(outcomes)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Quantify the effect of fouling', 'Distinguish degradation from drift']);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('none yet: the line alone, without the patch class', async () => {
    const { container } = render(
      <div className="rk-surface vr-sheet">
        <VendorLearningOutcomes
          titleId="lo"
          title="Learning outcomes"
          by="Added by the Academic Reviewer · read-only"
          line="One set for every format."
          empty="None yet. The Academic Reviewer adds them during review — one set for every format."
          outcomes={[]}
        />
      </div>,
    );
    expect(container.querySelector('ol')).toBeNull();
    const line = container.querySelector('p.ve-intro')!;
    expect(line.className).toBe('ve-intro');
    expect(line).toHaveTextContent(
      'None yet. The Academic Reviewer adds them during review — one set for every format.',
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});
