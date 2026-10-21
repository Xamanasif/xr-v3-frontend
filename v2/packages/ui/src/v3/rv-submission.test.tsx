/**
 * What only the Academic Reviewer's submission review draws (owner-approved export
 * design/v3-refined-b/roles/RV-v1, `project/RV.dc.html` item view: RV-03, RV-06): the outcome
 * block and editor, the grouped return references, the description and file cards, the formats
 * line and the delivery cards. Markup against the export's classes and ARIA, the class contract,
 * the accessibility checks and the behaviour the page relies on.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { assertNoAxeViolations, expectV3ClassesOnly, rvExportText } from '../testing/index.js';
import {
  RvChangedTag,
  RvChangeSet,
  RvDeliveryCard,
  RvDeliveryCards,
  RvExternalLink,
  RvFileCards,
  RvFormatLine,
  RvOutcomesBlock,
  RvOutcomesEditor,
  type RvOutcomeWords,
  RvProse,
  RvReferenceGroups,
  RvRequirement,
} from './rv-submission.js';

const ROOT = rvExportText('RV.dc.html');
/** The item view's template (RV-03, RV-04, RV-06), up to the refusal card. */
const ITEM = ROOT.slice(
  ROOT.indexOf('<sc-if value="{{ isItem }}"'),
  ROOT.indexOf('{{ isRefusal }}'),
);
const SCRIPT = ROOT.slice(ROOT.indexOf('<script type="text/x-dc"'));

const WORDS: RvOutcomeWords = {
  listLabel: 'Learning outcomes',
  outcome: (n) => `Outcome ${n}`,
  up: (n) => `Move outcome ${n} up`,
  down: (n) => `Move outcome ${n} down`,
  editLabel: (n) => `Edit outcome ${n}`,
  deleteLabel: (n) => `Delete outcome ${n}`,
  edit: 'Edit',
  delete: 'Delete',
  save: 'Save outcome',
  cancel: 'Cancel',
  undo: 'Undo',
  noneTitle: 'No learning outcomes yet',
  noneLine:
    'Approve needs at least one. Add what a learner can do after this experiment; the same list applies to every format.',
  addLabel: 'Add a learning outcome',
  addHint: 'What a learner can do after the experiment. Start with a verb.',
  add: 'Add outcome',
};

const OUTCOMES = [
  'Explain conduction through layers in series using thermal resistance.',
  'Predict interface temperatures from layer properties.',
  'Compare measured and predicted heat flux and explain the difference.',
];

function editor(overrides: Partial<Parameters<typeof RvOutcomesEditor>[0]> = {}) {
  const handlers = {
    onMove: vi.fn(),
    onEdit: vi.fn(),
    onEditText: vi.fn(),
    onSave: vi.fn(),
    onCancel: vi.fn(),
    onDelete: vi.fn(),
    onUndo: vi.fn(),
    onNewText: vi.fn(),
    onAdd: vi.fn(),
  };
  const view = render(
    <RvOutcomesBlock
      title="Learning outcomes"
      titleId="rv-s-lo"
      sub="You set one list for the Experiment, used in every format."
      requirement={<RvRequirement state="ok">Requirement met</RvRequirement>}
      invalid={overrides.setError != null}
    >
      <RvOutcomesEditor
        words={WORDS}
        outcomes={OUTCOMES}
        editing={null}
        message={null}
        canUndo={false}
        editError={null}
        newText=""
        addError={null}
        setError={null}
        {...handlers}
        {...overrides}
      />
    </RvOutcomesBlock>,
  );
  return { ...view, handlers };
}

describe('RvOutcomesBlock and RvOutcomesEditor (`div.rv-lowrap`)', () => {
  it('the block head, the numbered list and the add field as the export draws them', async () => {
    for (const piece of [
      '<section class="{{ I.loBlockCls }}" aria-labelledby="rv-s-lo">',
      '<div class="rv-lo-head">',
      '<div class="rv-lo-headtext"><h2 class="rb-h2" id="rv-s-lo" tabindex="-1">Learning outcomes</h2><p class="rv-lo-sub">{{ I.loSub }}</p></div>',
      '<ol class="rv-lo" aria-label="Learning outcomes">',
      '<span class="rv-lo-n" aria-hidden="true">{{ o.n }}</span>',
      '<p class="rv-lo-t"><span class="xr-sr">Outcome {{ o.n }}: </span>{{ o.t }}</p>',
      'class="rb-btn rb-btn--ghost rv-ibtn" id="{{ o.upId }}" aria-label="Move outcome {{ o.n }} up"',
      'class="rb-btn rb-btn--ghost rv-ibtn-t" id="{{ o.edId }}" aria-label="Edit outcome {{ o.n }}"',
      '<label class="rk-label" for="rv-lo-new">Add a learning outcome</label>',
      '<p class="rk-hint" id="rv-lo-new-hint">What a learner can do after the experiment. Start with a verb.</p>',
      '<div class="rv-lo-addrow">',
      '<input id="rv-lo-new" class="rk-input" type="text" autocomplete="off"',
      '<button type="button" class="rb-btn" onClick="{{ I.addLo }}">Add outcome</button>',
    ]) {
      expect(ITEM).toContain(piece);
    }
    expect(SCRIPT).toContain(
      "'rk-surface rv-block rv-block--work' + (d.errs.outcomes ? ' is-invalid' : '')",
    );
    const { container } = editor();
    const block = container.querySelector('section')!;
    expect(block).toHaveClass('rk-surface', 'rv-block', 'rv-block--work');
    expect(block).not.toHaveClass('is-invalid');
    expect(screen.getByRole('region', { name: 'Learning outcomes' })).toBe(block);
    expect(block.querySelector('h2')).toHaveAttribute('tabindex', '-1');
    const list = screen.getByRole('list', { name: 'Learning outcomes' });
    expect(list.tagName).toBe('OL');
    expect([...list.querySelectorAll('.rv-lo-t')].map((p) => p.textContent)).toEqual(
      OUTCOMES.map((text, index) => `Outcome ${index + 1}: ${text}`),
    );
    expect(screen.getByRole('button', { name: 'Move outcome 1 up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move outcome 3 down' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move outcome 2 up' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Edit outcome 1' })).toHaveAttribute(
      'id',
      'rv-lo-0-ed',
    );
    const add = screen.getByRole('textbox', { name: 'Add a learning outcome' });
    expect(add).toHaveAccessibleDescription(
      'What a learner can do after the experiment. Start with a verb.',
    );
    expect(add).not.toHaveAttribute('aria-invalid');
    // No polite line until something was done.
    expect(container.querySelector('.rv-lo-msg')).toBeNull();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('presses reach their handlers; Enter in the add field adds', () => {
    const { handlers } = editor({ newText: 'Plot the profile.' });
    fireEvent.click(screen.getByRole('button', { name: 'Move outcome 2 up' }));
    expect(handlers.onMove).toHaveBeenCalledWith(1, -1);
    fireEvent.click(screen.getByRole('button', { name: 'Move outcome 2 down' }));
    expect(handlers.onMove).toHaveBeenCalledWith(1, 1);
    fireEvent.click(screen.getByRole('button', { name: 'Edit outcome 3' }));
    expect(handlers.onEdit).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByRole('button', { name: 'Delete outcome 1' }));
    expect(handlers.onDelete).toHaveBeenCalledWith(0);
    fireEvent.change(screen.getByRole('textbox', { name: 'Add a learning outcome' }), {
      target: { value: 'Plot it.' },
    });
    expect(handlers.onNewText).toHaveBeenCalledWith('Plot it.');
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Add a learning outcome' }), {
      key: 'Enter',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add outcome' }));
    expect(handlers.onAdd).toHaveBeenCalledTimes(2);
  });

  it('editing one outcome: in place, its error only while shown, every other control disabled', async () => {
    expect(ITEM).toContain('<label class="rk-label" for="{{ o.taId }}">Outcome {{ o.n }}</label>');
    expect(ITEM).toContain(
      '<div class="rv-lo-editact"><button type="button" class="rb-btn rb-btn--navy" onClick="{{ o.save }}">Save outcome</button><button type="button" class="rb-btn" onClick="{{ o.cancel }}">Cancel</button></div>',
    );
    const { container, rerender, handlers } = editor({
      editing: { index: 1, text: OUTCOMES[1]! },
    });
    const field = screen.getByRole('textbox', { name: 'Outcome 2' });
    expect(field).toHaveAttribute('id', 'rv-lo-ta-1');
    expect(field).toHaveValue(OUTCOMES[1]);
    expect(field).not.toHaveAttribute('aria-describedby');
    expect(field.closest('li')).toHaveClass('rv-lo-item', 'is-editing');
    for (const name of ['Move outcome 1 down', 'Edit outcome 1', 'Delete outcome 3']) {
      expect(screen.getByRole('button', { name })).toBeDisabled();
    }
    fireEvent.click(screen.getByRole('button', { name: 'Save outcome' }));
    expect(handlers.onSave).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(handlers.onCancel).toHaveBeenCalled();
    rerender(
      <RvOutcomesEditor
        words={WORDS}
        outcomes={OUTCOMES}
        editing={{ index: 1, text: '' }}
        message={null}
        canUndo={false}
        editError="Enter the outcome text, or cancel"
        newText=""
        addError={null}
        setError={null}
        {...handlers}
      />,
    );
    const invalid = screen.getByRole('textbox', { name: 'Outcome 2' });
    expect(invalid).toHaveAttribute('aria-invalid', 'true');
    expect(invalid).toHaveAccessibleDescription('Enter the outcome text, or cancel');
    expect(container.querySelector('#rv-lo-ed-err')).toHaveClass('rk-ferr');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('the polite line with Undo; none yet; the add and decision errors at the field', async () => {
    expect(ITEM).toContain(
      '<div class="rv-lo-msg" id="rv-lo-msg" tabindex="-1" role="status"><span>{{ I.loMsg }}</span>',
    );
    expect(ITEM).toContain('<p class="rk-notice-t">No learning outcomes yet</p>');
    expect(ITEM).toContain(`<p class="rk-notice-d">${WORDS.noneLine}</p>`);
    const { container, handlers } = editor({
      outcomes: [],
      message: 'Outcome 1 deleted.',
      canUndo: true,
      addError: 'Enter the outcome text',
      setError: 'Add at least one learning outcome before you approve',
    });
    const message = container.querySelector('#rv-lo-msg')!;
    expect(message).toHaveAttribute('role', 'status');
    expect(message).toHaveAttribute('tabindex', '-1');
    expect(message.textContent).toBe('Outcome 1 deleted.Undo');
    fireEvent.click(within(message as HTMLElement).getByRole('button', { name: 'Undo' }));
    expect(handlers.onUndo).toHaveBeenCalled();
    expect(screen.queryByRole('list', { name: 'Learning outcomes' })).toBeNull();
    const none = container.querySelector('.rk-notice--warn')!;
    expect(none.textContent).toBe(`No learning outcomes yet${WORDS.noneLine}`);
    const add = screen.getByRole('textbox', { name: 'Add a learning outcome' });
    expect(add).toHaveAttribute('aria-invalid', 'true');
    expect(add).toHaveAttribute('aria-describedby', 'rv-lo-new-hint rv-lo-new-err rv-lo-err');
    expect(container.querySelector('section')).toHaveClass('is-invalid');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

describe('RvReferenceGroups (`div.rv-refgrps`)', () => {
  it('the fields of a return, grouped by the vendor editor’s sections', async () => {
    for (const piece of [
      '<fieldset class="rk-fieldset">',
      '<legend>What it refers to (optional)<span>The vendor sees these as links to the fields, above their editor.</span></legend>',
      '<div class="rv-refgrps"><sc-for list="{{ I.refGroups }}" as="g" hint-placeholder-count="3"><fieldset class="rv-refgrp"><legend class="rv-refgrp-h">{{ g.title }}</legend><div class="rv-refs"><sc-for list="{{ g.opts }}" as="o" hint-placeholder-count="2"><label class="rv-ref" for="{{ o.id }}"><input type="checkbox" id="{{ o.id }}" checked="{{ o.checked }}" onChange="{{ o.onChange }}"><span>{{ o.f }}</span></label>',
    ]) {
      expect(ITEM).toContain(piece);
    }
    const onToggle = vi.fn();
    const { container } = render(
      <RvReferenceGroups
        legend="What it refers to (optional)"
        hint="The vendor sees these as links to the fields, above their editor."
        groups={[
          {
            title: 'Course & description',
            options: [
              { id: 'rv-ref-summary', label: 'Summary', checked: false },
              { id: 'rv-ref-description', label: 'Description', checked: true },
            ],
          },
          {
            title: 'Formats & delivery · VR',
            options: [{ id: 'rv-ref-vr-device-need', label: 'Device need', checked: false }],
          },
        ]}
        onToggle={onToggle}
      />,
    );
    const outer = screen.getByRole('group', { name: /^What it refers to \(optional\)/ });
    const vr = within(outer).getByRole('group', { name: 'Formats & delivery · VR' });
    fireEvent.click(within(vr).getByRole('checkbox', { name: 'Device need' }));
    expect(onToggle).toHaveBeenCalledWith('rv-ref-vr-device-need');
    expect(screen.getByRole('checkbox', { name: 'Description' })).toBeChecked();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

describe('RvProse and RvFileCards (`div.rv-prose`, `ul.rv-files`)', () => {
  it('the description, the preview link, each document, and what was not sent', async () => {
    for (const piece of [
      '<div class="rv-prose"><h3 class="rv-mini-h">Description</h3><p>{{ I.desc }}</p></div>',
      '<div class="rv-attach">',
      '<h3 class="rv-mini-h">Preview and documents</h3>',
      '<a class="rv-filecard rv-filecard--link" href="{{ I.previewUrl }}" target="_blank" rel="noopener noreferrer">',
      '<span class="rv-file-d">Preview link · opens in a new tab</span>',
      '<li class="rv-filecard rv-filecard--none rv-filecard--wide">',
    ]) {
      expect(ITEM).toContain(piece);
    }
    const { container } = render(
      <>
        <RvProse title="Description">Learners build a wall from three layers.</RvProse>
        <RvFileCards
          title="Preview and documents"
          cards={[
            {
              kind: 'link',
              title: 'Two-minute walkthrough',
              note: 'Preview link · opens in a new tab',
              href: 'https://media.example/walkthrough',
            },
            { kind: 'document', title: 'Lab handout.pdf' },
            { kind: 'none', icon: 'document', title: 'No documents' },
            { kind: 'none', icon: 'document', title: 'No preview link or documents', wide: true },
          ]}
        />
      </>,
    );
    const link = screen.getByRole('link', {
      name: /^Two-minute walkthrough ?Preview link · opens in a new tab$/,
    });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link.querySelector('svg.rv-file-go')).not.toBeNull();
    const cards = [...container.querySelectorAll('ul.rv-files > li')];
    expect(cards.map((item) => item.textContent)).toEqual([
      'Two-minute walkthroughPreview link · opens in a new tab',
      'Lab handout.pdf',
      'No documents',
      'No preview link or documents',
    ]);
    expect(cards[3]).toHaveClass('rv-filecard--none', 'rv-filecard--wide');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

describe('RvFormatLine and RvDeliveryCard (`p.rv-fmtline`, `div.rv-deliv`)', () => {
  it('the formats line and one card per format; WEB’s link; a package’s details on demand', async () => {
    for (const piece of [
      '<p class="rv-fmtline"><span class="rv-fmtline-row"><span class="rv-fmtline-in"><span class="rv-fmtline-k">In this submission</span>',
      '<span class="rv-fmtline-out">Not included: {{ I.fmtOut }}</span>',
      '<div class="rv-dcard-h"><span class="xr-fmt" aria-hidden="true">{{ d.code }}</span><h3 class="rv-dcard-t"><span class="xr-sr">{{ d.code }}, </span>{{ d.title }}</h3><span class="rv-dcard-k">{{ d.kind }}</span></div>',
      '<a class="rb-btn rv-ext" href="{{ d.link }}" target="_blank" rel="noopener noreferrer">',
      'Open web link<span class="xr-sr"> (opens in a new tab)</span></a>',
      '<span class="rv-tag">Changed in revision {{ I.rev }}</span>',
      '<div class="rv-pkg" id="{{ d.pkgId }}"><dl class="rk-dl"><dt>Package reference</dt>',
    ]) {
      expect(ITEM).toContain(piece);
    }
    const onToggle = vi.fn();
    const draw = (open: boolean) => (
      <>
        <RvFormatLine
          label="In this submission"
          formats={['WEB', 'VR']}
          formatsLabel="In this submission: WEB and VR"
          notIncluded="Not included: AR, MR"
        />
        <RvDeliveryCards>
          <RvDeliveryCard
            code="WEB"
            title="Browser"
            kind="Web link"
            rows={[
              { term: 'Web link', value: 'https://labs.example/wall' },
              { term: 'Browser and computer', value: 'A current browser' },
            ]}
            action={
              <RvExternalLink href="https://labs.example/wall" newTab=" (opens in a new tab)">
                Open web link
              </RvExternalLink>
            }
          />
          <RvDeliveryCard
            code="VR"
            title="Virtual reality"
            kind="App package"
            rows={[
              { term: 'Package', value: 'Composite Wall — VR build 1.0' },
              {
                term: 'Device needed',
                value: (
                  <>
                    Standalone VR headset<RvChangedTag>Changed in revision 2</RvChangedTag>
                  </>
                ),
              },
            ]}
            more={{
              id: 'rv-pkg-vr',
              open,
              showLabel: 'View package details',
              hideLabel: 'Hide package details',
              rows: [
                { term: 'Package reference', value: 'NSS-CW-VR-1.0' },
                { term: 'Install notes', value: 'Install the build.' },
              ],
              onToggle,
            }}
          />
        </RvDeliveryCards>
      </>
    );
    const { container, rerender } = render(draw(false));
    expect(container.querySelector('.rv-fmtline')?.textContent).toBe(
      'In this submissionWEBVRNot included: AR, MR',
    );
    expect(screen.getByRole('img', { name: 'In this submission: WEB and VR' })).toHaveClass(
      'rk-fmts',
    );
    expect(screen.getByRole('heading', { level: 3, name: /^WEB, ?Browser$/ })).toBeVisible();
    const web = screen.getByRole('link', { name: /^Open web link ?\(opens in a new tab\)$/ });
    expect(web).toHaveAttribute('target', '_blank');
    expect(container.querySelector('.rv-tag')?.textContent).toBe('Changed in revision 2');
    const toggle = screen.getByRole('button', { name: 'View package details' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'rv-pkg-vr');
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalled();
    expect(container.querySelector('#rv-pkg-vr')).toBeNull();
    rerender(draw(true));
    expect(screen.getByRole('button', { name: 'Hide package details' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(
      [...container.querySelectorAll('#rv-pkg-vr dt')].map((dt) => [
        dt.textContent,
        dt.nextElementSibling?.textContent,
      ]),
    ).toEqual([
      ['Package reference', 'NSS-CW-VR-1.0'],
      ['Install notes', 'Install the build.'],
    ]);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

describe('RvRequirement (`span.rv-req`)', () => {
  it('the outcome rule in its three states, one icon each', () => {
    expect(ITEM).toContain('<span class="{{ I.loReqCls }}">');
    expect(SCRIPT).toContain(
      "'rv-req ' + (editable ? (lo.length ? 'rv-req--ok' : 'rv-req--need') : 'rv-req--ro')",
    );
    const { container } = render(
      <>
        <RvRequirement state="ok">Requirement met</RvRequirement>
        <RvRequirement state="need">At least one needed to approve</RvRequirement>
        <RvRequirement state="ro">Set by you · read-only</RvRequirement>
      </>,
    );
    const chips = [...container.querySelectorAll('span.rv-req')];
    expect(chips.map((chip) => chip.className)).toEqual([
      'rv-req rv-req--ok',
      'rv-req rv-req--need',
      'rv-req rv-req--ro',
    ]);
    expect(chips.map((chip) => chip.querySelectorAll('svg path').length)).toEqual([1, 1, 1]);
    expect(chips[2]?.textContent).toBe('Set by you · read-only');
    expectV3ClassesOnly(container);
  });
});

describe('RvChangeSet (`div.rv-chg`)', () => {
  it('wraps the previous reason and the comparison', () => {
    expect(ITEM).toContain('<div class="rv-chg">');
    const { container } = render(
      <RvChangeSet>
        <p>quote</p>
      </RvChangeSet>,
    );
    expect(container.firstElementChild).toHaveClass('rv-chg');
    expectV3ClassesOnly(container);
  });
});
