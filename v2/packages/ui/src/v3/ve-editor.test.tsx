/**
 * What only the Vendor editor draws (owner-approved export design/v3-refined-b/roles/VE-v1,
 * `project/Main.dc.html`, the editor of VE-03 … VE-06, VE-08 and VE-09): the frame (top stepper,
 * form surface, aside outline with parts), the field grid, the fields with their tag, hint, stale
 * line and error, the format selector, the package guidance, the editable delivery blocks, the
 * sample files and the dashed empty line, the check step's lead, missing items, review sections and
 * note, the sticky actions with the saved status, the outcome card, the refusal and the read-only
 * sheet — composed with the shared Vendor patterns (`ve.tsx`, tested in `ve.test.tsx`) where the
 * editor draws them. Markup against the export's classes and ARIA, the class contract and the
 * accessibility checks.
 */
import { act, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { assertNoAxeViolations, expectV3ClassesOnly, veExportText } from '../testing/index.js';
import { Button } from './actions.js';
import { V3_ICON_PATHS } from './icons.js';
import {
  VendorDeliveryList,
  VendorDeliveryView,
  VendorFormatChips,
  VendorLearningOutcomes,
  VendorSection,
} from './ve.js';
import {
  VendorEditorActions,
  VendorEditorCheckLead,
  VendorEditorDeliveryBlock,
  VendorEditorEmpty,
  VendorEditorEntered,
  VendorEditorErrors,
  VendorEditorField,
  VendorEditorFile,
  VendorEditorFiles,
  VendorEditorFormats,
  VendorEditorGrid,
  VendorEditorInput,
  VendorEditorLayout,
  VendorEditorLinkButton,
  VendorEditorMissing,
  VendorEditorOutcome,
  VendorEditorPackageGuide,
  VendorEditorRefusal,
  VendorEditorReview,
  VendorEditorSelect,
  type VendorEditorStep,
  VendorEditorSubmitNote,
  VendorEditorTextarea,
} from './ve-editor.js';

/** An internal reference (the owner's identifier rule for the Vendor, 22 Oct 2026; SA-v1 rule). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

/** No internal reference in the words, the names, the titles or the placeholders drawn. */
function expectNoReference(container: Element): void {
  expect(container.textContent ?? '').not.toMatch(REFERENCE);
  for (const element of container.querySelectorAll('[aria-label], [title], [placeholder]')) {
    for (const name of ['aria-label', 'title', 'placeholder']) {
      expect(element.getAttribute(name) ?? '').not.toMatch(REFERENCE);
    }
  }
}

const MAIN = veExportText('Main.dc.html');

/** The export's template only (the markup before its logic script). */
const TEMPLATE = MAIN.slice(0, MAIN.indexOf('<script type="text/x-dc"'));

function steps(onSelect = vi.fn()): VendorEditorStep[] {
  return [
    {
      key: 'course',
      number: 1,
      short: 'Course',
      title: 'Course and description',
      state: 'Complete',
      done: true,
      current: false,
      label: 'Step 1 of 4, Course and description, complete',
      onSelect,
    },
    {
      key: 'formats',
      number: 2,
      short: 'Formats',
      title: 'Formats and delivery',
      state: 'In progress',
      done: false,
      current: true,
      label: 'Step 2 of 4, Formats and delivery, in progress',
      onSelect,
      partsLabel: 'Parts of Formats and delivery',
      parts: [
        {
          key: 'web',
          label: 'WEB · Browser',
          status: { tone: 'ok', words: 'Complete' },
          onSelect,
        },
        {
          key: 'ar',
          label: 'AR · Augmented reality',
          status: { tone: 'neutral', words: '2 still needed' },
          onSelect,
        },
      ],
    },
  ];
}

describe('VendorEditorLayout (`div.rk-detailwrap`: `nav.ve-steps`, the form, `aside.ve-edaside`)', () => {
  it('draws the top stepper, the named form surface and the outline with its parts', async () => {
    for (const piece of [
      '<nav class="ve-steps ve-steps--top" aria-label="Steps">',
      'class="rk-surface ve-form vr-form" aria-labelledby="ve-h1"',
      '<aside class="rk-aside ve-edaside" aria-labelledby="ve-prog-k">',
      '<div class="rk-surface ve-prog">',
      '<ol class="ve-stepnav">',
      '<ul class="vr-sub" aria-label="{{ x.subAria }}">',
      'class="vr-sub-b"',
      '<div class="ve-prog-meta"><span><b>{{ E.progSaved }}</b></span><span>{{ E.progVis }}</span></div>',
    ]) {
      expect(TEMPLATE).toContain(piece);
    }
    const onSelect = vi.fn();
    const { container } = render(
      <div className="xr rb">
        <h1 id="t">Formats and delivery</h1>
        <VendorEditorLayout
          stepsLabel="Steps"
          steps={steps(onSelect)}
          formLabelledBy="t"
          outline={{
            kicker: 'Draft',
            kickerId: 'k',
            name: 'Natural Convection',
            saved: 'Last saved 27 Aug 2026, 10:40',
            visibility: 'Only you can see a draft.',
          }}
        >
          <p>The form</p>
        </VendorEditorLayout>
      </div>,
    );
    const wrap = container.querySelector('.rk-detailwrap')!;
    expect([...wrap.children].map((child) => `${child.tagName} ${child.className}`)).toEqual([
      'NAV ve-steps ve-steps--top',
      'DIV rk-detail',
    ]);
    const top = within(wrap.firstElementChild as HTMLElement).getAllByRole('button');
    expect(top.map((button) => button.className)).toEqual(['ve-step is-done', 've-step']);
    expect(top[0]!.querySelector('.ve-step-n path')).toHaveAttribute('d', V3_ICON_PATHS.check);
    expect(top[1]).toHaveAttribute('aria-current', 'step');
    expect(top[1]).toHaveAccessibleName('Step 2 of 4, Formats and delivery, in progress');
    expect(top[1]!.textContent).toBe('2Formats');
    const form = screen.getByRole('region', { name: 'Formats and delivery' });
    expect(form.parentElement).toHaveClass('rk-mainsheet');
    const aside = screen.getByRole('complementary', { name: 'Draft' });
    expect(aside).toHaveClass('rk-aside', 've-edaside');
    const nav = within(aside).getByRole('navigation', { name: 'Steps' });
    const outlineSteps = within(nav).getAllByRole('button');
    expect(outlineSteps[0]).toHaveClass('is-done');
    expect(outlineSteps[1]!.textContent).toBe('2Formats and deliveryIn progress');
    const parts = within(aside).getByRole('list', { name: 'Parts of Formats and delivery' });
    expect(parts).toHaveClass('vr-sub');
    expect([...parts.querySelectorAll('.xr-st')].map((pill) => pill.className)).toEqual([
      'xr-st xr-st--ok vr-st-sm',
      'xr-st vr-st-sm',
    ]);
    act(() =>
      within(parts)
        .getByRole('button', { name: /AR · Augmented reality/ })
        .click(),
    );
    act(() => top[0]!.click());
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(aside.querySelector('.ve-prog-meta')!.innerHTML).toBe(
      '<span><b>Last saved 27 Aug 2026, 10:40</b></span><span>Only you can see a draft.</span>',
    );
    expectNoReference(container);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('without a saved line the outline keeps only who can see it', () => {
    const { container } = render(
      <VendorEditorLayout
        stepsLabel="Steps"
        steps={steps()}
        formLabelledBy="t"
        outline={{ kicker: 'K', kickerId: 'k', name: 'N', visibility: 'V' }}
      >
        <p>Form</p>
      </VendorEditorLayout>,
    );
    expect(container.querySelector('.ve-prog-meta')!.innerHTML).toBe('<span>V</span>');
  });
});

describe('sections, the grid and the fields (`vr-sec`, `vr-grid`, `rk-field.vr-w*`)', () => {
  it('a step’s titled group holds the six-column grid (`VendorSection` > `vr-grid`)', async () => {
    expect(TEMPLATE).toContain(
      '<div class="vr-sec-h"><h2 class="vr-sec-t" id="s1-a-h" tabindex="-1">Course and name</h2></div>\n                  <div class="vr-grid">',
    );
    const { container } = render(
      <div className="xr rb">
        <VendorSection titleId="a" title="Course and name" titleFocusTarget>
          <VendorEditorGrid>
            <p>Fields</p>
          </VendorEditorGrid>
        </VendorSection>
      </div>,
    );
    const group = screen.getByRole('group', { name: 'Course and name' });
    expect(group.querySelector(':scope > div.vr-grid')!.innerHTML).toBe('<p>Fields</p>');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('a field: label, the return’s tag, the hint with its stale line, the control, the error', async () => {
    for (const piece of [
      '<div class="rk-field vr-w4">',
      '<span class="rk-tag-warn ve-reftag"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#vei-return"></use></svg>Referred to in the return</span>',
      '<span class="ve-hint-stale">{{ E.staleHint }}</span>',
      '<div class="rk-selwrap"><select id="f-course" class="rk-select"',
      '<p class="rk-ferr" id="f-course-e"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#vei-alert"></use></svg>',
      '<textarea id="f-summary" class="rk-textarea vr-ta2" rows="2"',
      '<input id="f-version" class="rk-input" type="text" autocomplete="off"',
      '<span class="ve-opt">(optional)</span>',
    ]) {
      expect(TEMPLATE).toContain(piece);
    }
    const { container } = render(
      <div className="xr rb">
        <div className="ve-form vr-form">
          <VendorEditorGrid>
            <VendorEditorField
              id="course"
              label="Course"
              width={4}
              hint="Only the assigned courses are listed."
              staleHint="You chose MEL ZG512, which was withdrawn."
              referred="Referred to in the return"
              error="Choose a course"
            >
              <VendorEditorSelect
                value=""
                onChange={() => {}}
                options={[{ value: '', label: 'Choose a course' }]}
              />
            </VendorEditorField>
            <VendorEditorField id="summary" label="Summary" hint="One sentence.">
              <VendorEditorTextarea rows={2} defaultValue="" />
            </VendorEditorField>
            <VendorEditorField id="notes" label="Notes for WEB" optional="(optional)">
              <VendorEditorTextarea rows={1} defaultValue="" />
            </VendorEditorField>
            <VendorEditorField
              id="ref"
              label="Package reference"
              width={3}
              describedBy="guide-ref"
              labelAction={
                <VendorEditorLinkButton label="Attach the AR package file" onClick={() => {}}>
                  Attach file
                </VendorEditorLinkButton>
              }
              after={
                <VendorEditorFile
                  as="div"
                  name="forced-convection-ar-1.0.zip"
                  removeLabel="Remove"
                  removeName="Remove the AR package file"
                  onRemove={() => {}}
                />
              }
            >
              <VendorEditorInput defaultValue="" />
            </VendorEditorField>
          </VendorEditorGrid>
          <p id="guide-ref">Your build or store reference.</p>
        </div>
      </div>,
    );
    const course = screen.getByRole('combobox', { name: 'Course' });
    const field = course.closest('.rk-field')!;
    expect(field.className).toBe('rk-field vr-w4');
    expect([...field.children].map((child) => `${child.tagName} ${child.className}`)).toEqual([
      'LABEL rk-label',
      'SPAN rk-tag-warn ve-reftag',
      'P rk-hint',
      'DIV rk-selwrap',
      'P rk-ferr',
    ]);
    expect(field.querySelector('.ve-reftag path')).toHaveAttribute('d', V3_ICON_PATHS.returned);
    expect(field.querySelector('.rk-hint > .ve-hint-stale')).toHaveTextContent(
      'You chose MEL ZG512, which was withdrawn.',
    );
    expect(course).toHaveAttribute('aria-invalid', 'true');
    expect(course).toHaveAttribute('aria-describedby', 'course-h course-e');
    expect(course.className).toBe('rk-select');
    const summary = screen.getByRole('textbox', { name: 'Summary' });
    expect(summary.className).toBe('rk-textarea vr-ta2');
    expect(summary).toHaveAttribute('rows', '2');
    expect(summary).not.toHaveAttribute('aria-invalid');
    expect(summary.closest('.rk-field')!.className).toBe('rk-field');
    expect(screen.getByRole('textbox', { name: 'Notes for WEB (optional)' }).className).toBe(
      'rk-textarea vr-ta1',
    );
    const reference = screen.getByRole('textbox', { name: 'Package reference' });
    expect(reference).toHaveAttribute('autocomplete', 'off');
    expect(reference).toHaveAccessibleDescription('Your build or store reference.');
    const row = reference.closest('.rk-field')!.querySelector('.vr-labelrow')!;
    expect(row.querySelector('button.vr-linkbtn')).toHaveAccessibleName(
      'Attach the AR package file',
    );
    expect(row.querySelector('button.vr-linkbtn path')).toHaveAttribute('d', V3_ICON_PATHS.add);
    expect(reference.closest('.rk-field')!.lastElementChild!.className).toBe('ve-file vr-file');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('a control outside a field is refused', () => {
    expect(() => render(<VendorEditorInput />)).toThrow('VendorEditorInput goes inside');
  });
});

describe('step 2: VendorEditorFormats, VendorEditorPackageGuide, the delivery blocks', () => {
  it('the selector tiles carry the chip grammar; its error is in the fieldset’s description', async () => {
    for (const piece of [
      '<fieldset class="rk-fieldset vr-fmtsel" id="f-fmts" tabindex="-1"',
      '<legend class="vr-legend"><span class="vr-sec-t">Formats it supports</span><span class="vr-sec-d">',
      '<div class="vr-fmtsel-grid">',
      '<label class="vr-fmtopt" for="{{ o.id }}"><input type="checkbox"',
      '<span class="vr-fmtopt-name">{{ o.name }}</span><span class="vr-fmtopt-kind">{{ o.kindShort }}</span>',
    ]) {
      expect(TEMPLATE).toContain(piece);
    }
    expect(MAIN).toContain("x.chipCls = x.on ? 'xr-fmt' : 'xr-fmt xr-fmt--none'");
    const onToggle = vi.fn();
    const { container } = render(
      <div className="xr rb">
        <VendorEditorFormats
          id="fmts"
          legend="Formats it supports"
          description="Choose every format you are delivering."
          error="Choose at least one format"
          options={[
            { id: 'fWEB', code: 'WEB', name: 'Browser', kind: 'Web link', checked: true, onToggle },
            {
              id: 'fAR',
              code: 'AR',
              name: 'Augmented reality',
              kind: 'App package',
              checked: false,
              onToggle,
            },
          ]}
        />
      </div>,
    );
    const group = screen.getByRole('group', { name: /^Formats it supports/ });
    expect(group.parentElement).toHaveClass('vr-sec');
    expect(group).toHaveAttribute('tabindex', '-1');
    expect(group).toHaveAccessibleDescription('Choose at least one format');
    // 10 px under the tiles: the export's inline `margin-top: 10px` (V3P-13).
    expect(TEMPLATE).toContain(
      '<p class="rk-ferr" id="f-fmts-e" style="margin-top: 10px"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#vei-alert"></use></svg>{{ E.fmtsErr }}</p>',
    );
    const error = group.querySelector(':scope > p.rk-ferr')!;
    expect(error.className).toBe('rk-ferr rk-x-ferr-above');
    expect(error).toHaveAttribute('id', 'fmts-e');
    expect(error.querySelector('path')).toHaveAttribute('d', V3_ICON_PATHS.alertCircle);
    expect(
      [...group.querySelectorAll('.vr-fmtopt > span:first-of-type')].map((chip) => chip.className),
    ).toEqual(['xr-fmt', 'xr-fmt xr-fmt--none']);
    act(() => screen.getByRole('checkbox', { name: /Augmented reality/ }).click());
    expect(onToggle).toHaveBeenCalledTimes(1);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('the guidance once, an editable block with its status and a read-only block', async () => {
    for (const piece of [
      '<div class="vr-guide">',
      '<p class="vr-guide-t">What each app package needs</p>',
      '<dl class="vr-guide-dl">',
      '<p class="vr-guide-note">',
      '<section class="vr-dlv" aria-labelledby="p-WEB-t">',
      '<div class="vr-dlv-h"><span class="xr-fmt">WEB</span><h3 class="vr-dlv-t" id="p-WEB-t" tabindex="-1">Browser<span class="vr-dlv-k"> · Web link</span></h3><span class="{{ E.webSt.cls }} vr-dlv-st">',
      '<div class="vr-grid vr-dlv-b">',
      '<p class="vr-dlv-t">{{ d.name }} <span class="vr-dlv-k">· {{ d.kind }}</span></p></div><dl class="rk-dl vr-dlv-b">',
    ]) {
      expect(TEMPLATE).toContain(piece);
    }
    const { container } = render(
      <div className="xr rb">
        <VendorEditorPackageGuide
          title="What each app package needs"
          note="Package fields are provisional."
          items={[{ id: 'g-label', term: 'Package label', description: 'The name people see.' }]}
        />
        <VendorDeliveryList>
          <VendorEditorDeliveryBlock
            code="WEB"
            name="Browser"
            kind="Web link"
            titleId="WEB-t"
            status={{ tone: 'err', words: '1 to fix' }}
          >
            <p>Fields</p>
          </VendorEditorDeliveryBlock>
          <VendorDeliveryView
            code="VR"
            name="Virtual reality"
            kind="App package"
            rows={[{ term: 'Package label', value: 'Composite Wall VR' }]}
          />
        </VendorDeliveryList>
      </div>,
    );
    const guide = container.querySelector('.vr-guide')!;
    expect(guide.querySelector('dd#g-label')).toHaveTextContent('The name people see.');
    expect(guide.querySelector('.vr-guide-note path')).toHaveAttribute('d', V3_ICON_PATHS.infoNote);
    const blockHead = screen
      .getByRole('region', { name: /^Browser ?· Web link$/ })
      .querySelector('.vr-dlv-h')!;
    expect(blockHead.innerHTML).toBe(
      '<span class="xr-fmt">WEB</span><h3 class="vr-dlv-t" id="WEB-t" tabindex="-1">Browser<span class="vr-dlv-k"> · Web link</span></h3><span class="xr-st xr-st--err vr-st-sm vr-dlv-st"><i></i>1 to fix</span>',
    );
    const view = container.querySelector('.vr-dlvs > div.vr-dlv')!;
    expect(view.innerHTML).toBe(
      '<div class="vr-dlv-h"><span class="xr-fmt">VR</span><p class="vr-dlv-t">Virtual reality <span class="vr-dlv-k">· App package</span></p></div><dl class="rk-dl vr-dlv-b"><dt>Package label</dt><dd>Composite Wall VR</dd></dl>',
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

describe('files and the empty line (`ve-files`, `ve-file`, `vr-empty`)', () => {
  it('a document row with Remove; the dashed line when there is none; no sample label', async () => {
    expect(TEMPLATE).toContain('<ul class="ve-files"><sc-for list="{{ E.docs }}" as="d"');
    expect(TEMPLATE).toContain(
      '<p class="vr-empty"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#vei-file"></use></svg>No documents added.</p>',
    );
    const onRemove = vi.fn();
    const { container } = render(
      <div className="xr rb">
        <VendorEditorFiles>
          <VendorEditorFile
            name="Safety notes.pdf"
            removeLabel="Remove"
            removeName="Remove Safety notes.pdf"
            onRemove={onRemove}
          />
        </VendorEditorFiles>
        <VendorEditorEmpty>No documents added.</VendorEditorEmpty>
        <VendorEditorEmpty icon="contentAccess">None chosen yet</VendorEditorEmpty>
      </div>,
    );
    const row = container.querySelector('ul.ve-files > li.ve-file')!;
    expect(row.querySelector('path')).toHaveAttribute('d', V3_ICON_PATHS.document);
    expect(row.querySelector('.ve-file-n')!.textContent).toBe('Safety notes.pdf');
    expect(row).not.toHaveTextContent(/sample/i);
    act(() => screen.getByRole('button', { name: 'Remove Safety notes.pdf' }).click());
    expect(onRemove).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Remove Safety notes.pdf' })).toHaveClass(
      'rb-btn',
      'rb-btn--ghost',
    );
    const empties = container.querySelectorAll('p.vr-empty');
    expect(empties[1]!.querySelector('path')).toHaveAttribute('d', V3_ICON_PATHS.contentAccess);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

describe('step 4: the lead, the missing items, the review sections, the outcomes, the note', () => {
  it('draws the export’s check step', async () => {
    for (const piece of [
      '<div class="vr-sec vr-sec--lead">',
      '<div id="ve-miss" tabindex="-1">',
      '<span class="ve-errline"><span>{{ m.t }}</span><a href="{{ m.href }}"',
      '<div class="vr-rev-h"><h2 class="vr-sec-t" id="s4-1-h">Course and description</h2><span class="{{ E.rv1.cls }}"><i></i>{{ E.rv1.state }}</span><button type="button" class="rb-btn rb-btn--ghost vr-chg"',
      '<ol class="ve-los">',
      '<div class="vr-sec vr-sec--note"><p class="ve-submitnote">',
    ]) {
      expect(TEMPLATE).toContain(piece);
    }
    const onSelect = vi.fn();
    const onChange = vi.fn();
    const { container } = render(
      <div className="xr rb">
        <VendorEditorCheckLead id="miss">
          <VendorEditorMissing
            title="1 thing to finish before you can submit"
            items={[
              {
                key: 'plink',
                text: 'Add a preview link',
                linkLabel: 'Go to preview and documents',
                href: '#plink',
                onSelect,
              },
            ]}
          />
        </VendorEditorCheckLead>
        <VendorEditorReview
          titleId="r1"
          title="Preview and documents"
          optional="(optional)"
          status={{ tone: 'warn', words: 'Preview link missing' }}
          changeLabel="Change"
          changeName="Change preview and documents"
          onChange={onChange}
        >
          <p>Values</p>
        </VendorEditorReview>
        <VendorLearningOutcomes
          titleId="lo"
          title="Learning outcomes"
          by="Added by the Academic Reviewer · read-only"
          line="One set for every format."
          empty="None yet."
          outcomes={[{ key: '1', text: 'Relate the coefficient to air speed.' }]}
        />
        <VendorEditorSubmitNote>It does not publish anything.</VendorEditorSubmitNote>
      </div>,
    );
    const lead = container.querySelector('.vr-sec--lead > #miss')!;
    expect(lead).toHaveAttribute('tabindex', '-1');
    expect(lead.querySelector('.rk-errsum')).toHaveAttribute('role', 'alert');
    act(() => screen.getByRole('link', { name: 'Go to preview and documents' }).click());
    expect(onSelect).toHaveBeenCalled();
    const review = screen.getByRole('region', { name: 'Preview and documents (optional)' });
    expect(review.querySelector('.vr-rev-h > .xr-st')!.className).toBe(
      'xr-st xr-st--warn vr-st-sm',
    );
    const change = within(review).getByRole('button', { name: 'Change preview and documents' });
    expect(change.className).toBe('rb-btn rb-btn--ghost vr-chg');
    act(() => change.click());
    expect(onChange).toHaveBeenCalled();
    const outcomes = screen.getByRole('region', { name: 'Learning outcomes' });
    expect([...outcomes.children].map((child) => `${child.tagName} ${child.className}`)).toEqual([
      'DIV vr-sec-h vr-sec-h--row',
      'P ve-intro rk-x-intro-below',
      'OL ve-los',
    ]);
    expect(container.querySelector('.ve-submitnote path')).toHaveAttribute(
      'd',
      V3_ICON_PATHS.infoNote,
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('the sticky actions: Back, the saved status (a focus target), Save and Continue', async () => {
    expect(TEMPLATE).toContain(
      '<p class="ve-saved vr-saved" id="ve-saved" tabindex="-1" role="status"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#vei-check"></use></svg>{{ E.saved }}</p>',
    );
    const { container } = render(
      <div className="xr rb">
        <VendorEditorErrors>
          <p>Summary</p>
        </VendorEditorErrors>
        <VendorEditorActions
          savedId="saved"
          saved="Draft saved · 27 Aug 2026, 10:40"
          start={<Button variant="ghost">Back</Button>}
          end={<Button variant="primary">Continue</Button>}
        />
      </div>,
    );
    expect(container.querySelector('.vr-errwrap')).toHaveTextContent('Summary');
    const bar = container.querySelector('.vr-actions')!;
    expect([...bar.children].map((child) => `${child.tagName} ${child.className}`)).toEqual([
      'DIV vr-actions-l',
      'P ve-saved vr-saved',
      'DIV vr-actions-r',
    ]);
    const saved = screen.getByRole('status');
    expect(saved).toHaveAttribute('id', 'saved');
    expect(saved).toHaveAttribute('tabindex', '-1');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

describe('the outcome card, the refusal and the read-only sheet', () => {
  it('VendorEditorOutcome (`section.vr-outcome`): the result as H1, the facts, the next step, the actions', async () => {
    for (const piece of [
      '<section class="rk-surface vr-outcome" aria-labelledby="ve-h1">',
      '<span class="vr-outcome-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#vei-check"></use></svg></span>',
      '<dl class="vr-facts">',
      '<p class="rk-next">{{ E.doneNext }}</p>',
      '<div class="ve-done-actions vr-outcome-act">',
    ]) {
      expect(TEMPLATE).toContain(piece);
    }
    const { container } = render(
      <div className="xr rb">
        <VendorEditorOutcome
          id="done"
          titleId="h"
          date="Thursday 27 August 2026"
          eyebrow="Natural Convection"
          title="Submitted for academic review"
          text="It is with the Academic Reviewer."
          statusTerm="Status"
          status={{ tone: 'info', words: 'With Academic Reviewer' }}
          facts={[{ term: 'Submitted', value: '27 Aug 2026, 10:42' }]}
          formatsTerm="Formats"
          formats={['WEB', 'VR']}
          formatsLabel="Formats: WEB, VR"
          next="Nothing is published."
          actions={<Button variant="primary">Open the experiment record</Button>}
        />
      </div>,
    );
    const outcome = screen.getByRole('region', { name: 'Submitted for academic review' });
    expect(outcome.className).toBe('rk-surface vr-outcome');
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('tabindex', '-1');
    expect([...outcome.querySelectorAll('.vr-facts dt')].map((term) => term.textContent)).toEqual([
      'Status',
      'Submitted',
      'Formats',
    ]);
    expect(outcome.querySelector('.vr-facts .xr-st')!.className).toBe('xr-st xr-st--info rk-st-lg');
    expectNoReference(container);
    const chips = outcome.querySelector('.ve-chips')!;
    expect(chips.querySelector('.xr-sr')).toHaveTextContent('Formats: WEB, VR');
    expect(
      [...chips.querySelectorAll('.xr-fmt')].map((chip) => chip.getAttribute('aria-hidden')),
    ).toEqual(['true', 'true']);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('VendorEditorRefusal (`div.rk-state--roomy`, the lock) and VendorEditorEntered (`vr-sheet`)', async () => {
    for (const piece of [
      '<span class="rk-state-ico ve-ico-lock" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#vei-lock"></use></svg></span>',
      '<h1 class="rk-state-t" id="ve-h1" tabindex="-1">{{ E.refTitle }}</h1>',
      '<section class="rk-surface vr-sheet" aria-labelledby="ve-ro-h">',
      '<div class="vr-dlvs vr-dlvs--after">',
      '<span class="ve-chips"><sc-for list="{{ E.chosen }}" as="f" hint-placeholder-count="1"><span class="xr-fmt">{{ f }}</span>',
    ]) {
      expect(TEMPLATE).toContain(piece);
    }
    const { container } = render(
      <div className="xr rb">
        <VendorEditorRefusal
          titleId="h"
          eyebrow="Forced Convection"
          title="This experiment was already submitted"
          text="It was submitted on 27 Aug 2026."
          actions={<Button variant="primary">Open the experiment record</Button>}
        />
        <VendorEditorEntered
          titleId="ro"
          title="What you entered"
          items={[
            { term: 'Course', value: 'MEL ZG512 · Manufacturing Processes' },
            { term: 'Formats', value: <VendorFormatChips formats={['WEB']} /> },
          ]}
          delivery={
            <VendorDeliveryView
              code="WEB"
              name="Browser"
              kind="Web link"
              rows={[{ term: 'Web link', value: 'https://labs.example/x' }]}
            />
          }
        />
      </div>,
    );
    const refusal = screen.getByRole('region', { name: 'This experiment was already submitted' });
    expect(
      refusal.querySelector('.rk-state.rk-state--roomy > .rk-state-ico.ve-ico-lock path'),
    ).toHaveAttribute('d', V3_ICON_PATHS.lock);
    // The eyebrow without its margin: the export's inline `margin: 0` (V3P-13).
    expect(TEMPLATE).toContain('<p class="rk-eyebrow" style="margin: 0">{{ E.refEyebrow }}</p>');
    expect(refusal.querySelector('.rk-state > p.rk-eyebrow')!.className).toBe(
      'rk-eyebrow rk-x-eyebrow-flush',
    );
    expect(refusal.querySelector('.ve-done-actions')).toHaveTextContent(
      'Open the experiment record',
    );
    const sheet = screen.getByRole('region', { name: 'What you entered' });
    expect(sheet.className).toBe('rk-surface vr-sheet');
    expect(sheet.querySelector('.vr-sec > .vr-dlvs.vr-dlvs--after > .vr-dlv')).not.toBeNull();
    expect(sheet.querySelector('.ve-chips .xr-fmt')).not.toHaveAttribute('aria-hidden');
    expectNoReference(container);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});
