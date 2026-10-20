/**
 * CM-03 Publication decision and CM-05 Published experiment in the owner-approved Content Manager
 * export's V3 Refined B design (design/v3-refined-b/roles/CM-v1, `Main.dc.html` `v.decision`,
 * `v.published`), on the real composition root and the sample world, as Kavya Nair. Publish through
 * its confirmation creates the experiment and changes no other record (BC9: no plan, licence, grant
 * or person); while it runs, the dialog's Cancel and Escape wait. A check that fails (a state
 * sample — the spine-start world has none, OD-B6-03) lists only the record's own failing checks and
 * preselects Send back; Send back checks the decision, who and why at once (the error summary
 * takes focus), sends references toward the vendor only and keeps what was typed when the record
 * changed meanwhile; still in review or with the vendor, the page is read-only. CM-05 states the
 * live version, the open update in its band and in the Corrections panel; its entries' behaviour is
 * `cm-correction.test.tsx`.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ServiceError } from '@xr/contracts/draft';
import type { Experiment, Submission } from '@xr/domain';
import { asPersonId, faults, fixtureWorld, snapshot } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
import {
  renderInTab,
  TestNotFoundBoundary,
  tabPlatform,
  testNavigation,
  worldPlatform,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { decisionFacts } from './cm-03-decision/decision-view';
import { PublicationDecision } from './cm-03-decision/publication-decision';
import { PublishedExperiment } from './cm-05-published/published-experiment';

afterEach(() => {
  forgetLastAddress();
  vi.restoreAllMocks();
});

const KAVYA = 'per-kavya-nair';
const RITU = 'per-ritu-sharma';

function inShell(ui: ReactNode) {
  return (
    <WorkspaceLayout workspace="content-manager">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{ui}</TestNotFoundBoundary>
    </WorkspaceLayout>
  );
}

function showDecision(runtime: PlatformRuntime, submissionId: string) {
  const navigation = testNavigation(`/content-manager/decisions/${submissionId}`);
  renderInTab(inShell(<PublicationDecision submissionId={submissionId} />), {
    runtime,
    navigation,
  });
  return navigation;
}

function showPublished(runtime: PlatformRuntime, experimentId: string) {
  const navigation = testNavigation(`/content-manager/published/${experimentId}`);
  renderInTab(inShell(<PublishedExperiment experimentId={experimentId} />), {
    runtime,
    navigation,
  });
  return navigation;
}

const main = () => screen.getByRole('main');
const panel = () => screen.getByRole('complementary', { name: 'Your decision' });
const corrections = () => screen.getByRole('complementary', { name: 'Corrections' });
/** An element's words, its text nodes joined by spaces (as a screen reader reads them). */
function text(element: Element | null): string {
  if (!element) return '';
  const parts: string[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    parts.push(node.textContent ?? '');
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}
const heading = (name: string) =>
  screen.findByRole('heading', { level: 1, name }, { timeout: 5000 });
/** The identity band (`section.rb-id.cm-idband`). */
const band = () => main().querySelector('section.rb-id.cm-idband')!;
/** The band's status pill (`div.rb-id-status > span.xr-st.rk-st-lg`). */
const chip = () => band().querySelector('.rb-id-status > .xr-st');
const crumbs = () => within(main()).getByRole('navigation', { name: 'Breadcrumb' });
const checkRows = () =>
  [...within(main()).getByRole('list', { name: 'Publication check' }).querySelectorAll('li')].map(
    (row) => text(row),
  );
const region = (name: string) => within(main()).getByRole('region', { name });
const historyWhat = (name = 'History') =>
  [...region(name).querySelectorAll('.rk-tl-w')].map((node) => text(node));
const railCurrent = () =>
  within(screen.getByRole('navigation', { name: 'Content Manager navigation' }))
    .getAllByRole('link')
    .find((link) => link.getAttribute('aria-current') === 'page');

/** One port's command answered with a refusal (the screen's handling of it, not the service). */
function answerWith(
  runtime: PlatformRuntime,
  method: 'publish' | 'sendBack',
  error: ServiceError,
): void {
  const real = runtime.withCommandId.bind(runtime);
  vi.spyOn(runtime, 'withCommandId').mockImplementation((commandId) => {
    const ports = real(commandId);
    return {
      ...ports,
      production: { ...ports.production, [method]: async () => ({ ok: false as const, error }) },
    } as typeof ports;
  });
}

/** One port's command held until `release()`: the busy state while it runs. */
function answerLater(runtime: PlatformRuntime, method: 'publish' | 'sendBack'): () => void {
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const real = runtime.withCommandId.bind(runtime);
  vi.spyOn(runtime, 'withCommandId').mockImplementation((commandId) => {
    const ports = real(commandId);
    const command = ports.production[method] as (input: never) => Promise<unknown>;
    return {
      ...ports,
      production: {
        ...ports.production,
        [method]: (input: never) => gate.then(() => command(input)),
      },
    } as typeof ports;
  });
  return () => release();
}

describe('CM-03 Publication decision — open (CM-v1 CM03-Decision)', () => {
  it('the breadcrumb, the band with its facts and stage track, the gate, the preview, the summary, the history, the open panel', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showDecision(runtime, 'SUB-0074');
    await heading('Transient Cooling');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('tabindex', '-1');
    expect(within(crumbs()).getByRole('link', { name: 'Ready to publish' })).toHaveAttribute(
      'href',
      '/content-manager/ready',
    );
    expect(crumbs().querySelector('[aria-current="page"]')).toHaveTextContent('Transient Cooling');
    expect(railCurrent()).toHaveAttribute('href', '/content-manager/ready');
    expect(text(band().querySelector('.rk-eyebrow'))).toBe('SUB-0074 · First publication');
    expect(text(chip())).toBe('Ready to publish');
    expect(chip()).toHaveClass('xr-st', 'xr-st--info', 'rk-st-lg');
    expect(text(band().querySelector('.rb-id-status'))).toBe(
      'Ready to publish From Northline Simulation Studio ME ZG523 Thermodynamics & Heat Transfer',
    );
    expect([...band().querySelectorAll('dl.cm-idfacts > div')].map((fact) => text(fact))).toEqual([
      'Formats WEB',
      'Learning outcomes 2',
      'Version 1.0',
      'Submission Revision 1',
    ]);
    const track = within(band() as HTMLElement).getByRole('list', {
      name: 'Where this submission is',
    });
    expect([...track.querySelectorAll('li')].map((step) => text(step))).toEqual([
      'Done: Vendor Submitted 6 Aug',
      'Done: Academic Reviewer Approved Prof. A. Menon · 14 Aug',
      'Your step, now: You Publication decision Waiting since 14 Aug Your step',
      // The stage's number is decorative (`span.cm-step-dot[aria-hidden]`).
      '4 Next: Public catalogue Listed After you publish',
    ]);
    expect(track.querySelectorAll('li')[2]).toHaveAttribute('aria-current', 'step');
    expect(
      within(band() as HTMLElement).getByRole('link', { name: 'Go to decision' }),
    ).toHaveAttribute('href', '#cm-panel');
    // The gate at the top of the sheet.
    const check = region('Publication check');
    expect(text(check.querySelector('.cm-gateline'))).toBe('All 4 met · ready to publish');
    expect(check.querySelector('.cm-gateline')).toHaveClass('is-ok');
    expect(checkRows()).toEqual([
      'Met: Approved by the Academic Reviewer Prof. A. Menon · 14 Aug 2026',
      'Met: Learning outcomes 2 outcomes · one set for every format',
      'Met: Catalogue details Name, course, summary, description, version',
      'Met: Delivery details for each format WEB — complete',
    ]);
    const preview = within(region('Catalogue preview')).getByRole('article', {
      name: 'Transient Cooling',
    });
    expect(text(preview.querySelector('.cm-cat-top > .xr-st'))).toBe('Preview — not public yet');
    expect(text(preview.querySelector('.cm-cat-course'))).toBe(
      'ME ZG523 Thermodynamics & Heat Transfer',
    );
    expect([...preview.querySelectorAll('ol.cm-ol li')].map((item) => text(item))).toEqual([
      'Decide when the lumped-capacitance model applies, using the Biot number.',
      'Estimate a heat transfer coefficient from a measured cooling curve.',
    ]);
    const summary = region('Submission and review summary');
    expect(text(summary.querySelector('dl.rk-dl'))).toContain(
      'From the vendor Northline Simulation Studio · Anil Shetty Submissions Submitted 6 Aug 2026 Academic review Approved by Prof. A. Menon on 14 Aug 2026 Version 1.0',
    );
    expect(text(summary.querySelector('ul.cm-devs li.cm-dev:not(.cm-dev--head)'))).toBe(
      'WEB Browser Delivery Web link https://labs.northline.example/transient-cooling Status Passed review',
    );
    expect(historyWhat()).toEqual(['Approved by Prof. A. Menon', 'Submitted for academic review']);
    // The draft save is the Vendor's only (not listed).
    expect(text(region('History'))).not.toMatch(/draft/i);
    // No choice yet: Publish or Send back.
    expect(within(panel()).getByRole('radio', { name: 'Publish' })).not.toBeChecked();
    expect(within(panel()).getByRole('radio', { name: 'Send back' })).not.toBeChecked();
    expect(text(panel().querySelector('.rk-pending'))).toBe('Choose Publish or Send back.');
    expect(within(panel()).getByRole('button', { name: 'Publish' })).toHaveAttribute(
      'id',
      'cm-d-go',
    );
  });

  it('no choice made: the error summary takes focus with “Choose a decision”', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    showDecision(runtime, 'SUB-0074');
    await heading('Transient Cooling');
    const before = snapshot(sample);
    await user.click(within(panel()).getByRole('button', { name: 'Publish' }));
    const summary = await within(panel()).findByRole('alert');
    expect(text(summary)).toBe('Check your decision Choose a decision');
    await waitFor(() => expect(summary).toHaveFocus());
    expect(panel().querySelector('fieldset#cm-d-choice')).toHaveClass('is-invalid');
    expect(screen.queryByRole('dialog')).toBeNull();
    // The summary's link focuses the choices.
    await user.click(within(summary).getByRole('link', { name: 'Choose a decision' }));
    expect(within(panel()).getByRole('radio', { name: 'Publish' })).toHaveFocus();
    expect(snapshot(sample)).toEqual(before);
  });
});

describe('CM-03 Publish (CM-v1 P01, P06; J1, J10)', () => {
  it('the confirmation says what publishing does; Publish creates the experiment and changes nothing else', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    showDecision(runtime, 'SUB-0074');
    await heading('Transient Cooling');
    const before = snapshot(sample);

    await user.click(within(panel()).getByRole('radio', { name: 'Publish' }));
    expect(panel().querySelector('.rk-pending')).toBeNull();
    await user.click(within(panel()).getByRole('button', { name: 'Publish' }));
    const dialog = await screen.findByRole('dialog', { name: 'Publish “Transient Cooling”?' });
    expect(dialog).toHaveAccessibleDescription(
      'Check what publishing does now, and what happens only after later events.',
    );
    expect([...dialog.querySelectorAll('.rk-dlg-group')].map((group) => text(group))).toEqual([
      'What happens now It appears in the public catalogue under ME ZG523 · Thermodynamics & Heat Transfer with WEB. The vendor and the Academic Reviewer see it as Published. Its submission becomes read-only. Any later change goes through a correction: you, then the Academic Reviewer, then the Super Admin’s release.',
      'Only after later events Institutions can use it only once BITS gives them access to it. Publishing gives no one access. Students get access only when their institution’s administrator gives it.',
    ]);
    await waitFor(() => expect(within(dialog).getByRole('heading', { level: 2 })).toHaveFocus());
    // Cancel: nothing is published.
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(snapshot(sample)).toEqual(before);

    await user.click(within(panel()).getByRole('button', { name: 'Publish' }));
    const again = await screen.findByRole('dialog', { name: 'Publish “Transient Cooling”?' });
    await user.click(within(again).getByRole('button', { name: 'Publish' }));

    const done = await waitFor(() => {
      const found = document.getElementById('cm-d-done');
      expect(found?.querySelector('.xr-st--ok')).toHaveTextContent('Published');
      return found!;
    });
    await waitFor(() => expect(done).toHaveFocus());
    expect(text(done.querySelector('.rk-done-meta'))).toMatch(
      /^Published by you on \d+ \w+ 2026, \d\d:\d\d$/,
    );
    expect([...done.querySelectorAll('dl.rk-stand > div')].map((row) => text(row))).toEqual([
      'Catalogue Listed under ME ZG523 with WEB',
      'Institution access Unchanged — no institution was given access',
      'Student access Unchanged — no student was given access',
      'Vendor and reviewer See it as Published, read-only',
    ]);
    expect(text(done.querySelector('.rk-next'))).toBe(
      'Publishing gave no one access. From now on, changes go through Updates.',
    );
    expect(
      within(done).getByRole('link', { name: 'Open the published experiment' }),
    ).toHaveAttribute('href', '/content-manager/published/transient-cooling');
    expect(within(done).getByRole('link', { name: 'View the public page' })).toHaveAttribute(
      'href',
      '/experiments/transient-cooling',
    );
    expect(within(done).getByRole('link', { name: 'Back to Ready to publish' })).toHaveAttribute(
      'href',
      '/content-manager/ready',
    );
    expect(text(chip())).toBe('Published');
    expect(text(region('Publication check').querySelector('.cm-gateline'))).toBe(
      'All 4 were met when it was published',
    );
    expect(checkRows()[0]).toBe(
      'Met: Approved by the Academic Reviewer Prof. A. Menon · 14 Aug 2026',
    );
    expect(historyWhat()[0]).toBe('Published by Kavya Nair');

    // BC9: the submission and the new experiment are the only records written.
    const after = snapshot(sample);
    const changed = Object.keys(after).filter(
      (key) => JSON.stringify(after[key]) !== JSON.stringify(before[key]),
    );
    expect(changed.sort()).toEqual(
      [...changed].filter((key) => /SUB-0074|transient-cooling/.test(key)).sort(),
    );
    expect(changed.some((key) => key.includes('transient-cooling'))).toBe(true);
    expect(Object.keys(before).filter((key) => !(key in after))).toEqual([]);
    // … and the public catalogue now has it.
    const page = await asPersonId(sample, RITU).catalogue.getExperiment(
      'transient-cooling' as never,
    );
    expect(page.ok).toBe(true);
  });

  it('publishing: “Publishing…” on the confirm button; Cancel and Escape wait for the result', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    const release = answerLater(runtime, 'publish');
    showDecision(runtime, 'SUB-0074');
    await heading('Transient Cooling');
    await user.click(within(panel()).getByRole('radio', { name: 'Publish' }));
    await user.click(within(panel()).getByRole('button', { name: 'Publish' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Publish' }));
    const busy = await within(dialog).findByRole('button', { name: 'Publishing…' });
    expect(busy).toHaveAttribute('aria-disabled', 'true');
    // Cancel is disabled and focus is held on the dialog's title (CM-v1 "Behaviour notes").
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(within(dialog).getByRole('heading', { level: 2 })).toHaveFocus();
    // A second press is ignored; Escape and Cancel wait.
    await user.click(busy);
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(dialog.contains(document.activeElement)).toBe(true);
    release();
    await waitFor(() => expect(document.getElementById('cm-d-done')).toHaveFocus());
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const record = await asPersonId(sample, KAVYA).production.getPublicationDecision(
      'SUB-0074' as never,
    );
    expect(record.ok && record.value.submission.status.state).toBe('published');
  });

  it('a stale revision: nothing is published, “This page is out of date” under the band, then “Show where it is now”', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    answerWith(runtime, 'publish', { kind: 'stale-version', currentRev: 99 });
    showDecision(runtime, 'SUB-0074');
    await heading('Transient Cooling');
    await user.click(within(panel()).getByRole('radio', { name: 'Publish' }));
    await user.click(within(panel()).getByRole('button', { name: 'Publish' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Publish' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const stale = await waitFor(() => {
      const found = document.getElementById('cm-d-stale');
      expect(found).not.toBeNull();
      return found!;
    });
    expect(stale).toHaveClass('rk-notice', 'rk-notice--warn');
    expect(stale).toHaveAttribute('role', 'alert');
    expect(text(stale)).toBe(
      'This page is out of date Transient Cooling was changed from another tab or window. Nothing was changed by your decision. Show where it is now',
    );
    await waitFor(() => expect(stale).toHaveFocus());
    // The page keeps what it showed, the choice included.
    expect(text(chip())).toBe('Ready to publish');
    expect(within(panel()).getByRole('radio', { name: 'Publish' })).toBeChecked();
    const record = await asPersonId(sample, KAVYA).production.getPublicationDecision(
      'SUB-0074' as never,
    );
    expect(record.ok && record.value.submission.status.state).toBe('with-content-manager');
    await user.click(within(stale).getByRole('button', { name: 'Show where it is now' }));
    await waitFor(() => expect(document.getElementById('cm-d-stale')).toBeNull());
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: 'Your decision' })).toHaveFocus(),
    );
  });

  it('published from another tab or window: the notice says when, and the page then shows it published', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    showDecision(runtime, 'SUB-0074');
    await heading('Transient Cooling');
    // The page was opened at revision n; another tab publishes it meanwhile.
    const read = await asPersonId(sample, KAVYA).production.getPublicationDecision(
      'SUB-0074' as never,
    );
    const rev = read.ok ? read.value.submission.rev : 0;
    const elsewhere = await asPersonId(sample, KAVYA).production.publish({
      id: 'SUB-0074' as never,
      expectedRev: rev,
    });
    expect(elsewhere.ok).toBe(true);
    await user.click(within(panel()).getByRole('radio', { name: 'Publish' }));
    await user.click(within(panel()).getByRole('button', { name: 'Publish' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Publish' }));
    const stale = await waitFor(() => {
      const found = document.getElementById('cm-d-stale');
      expect(text(found)).toMatch(
        /^This page is out of date Transient Cooling was published from another tab or window at \d\d:\d\d\. Nothing was changed by your decision\./,
      );
      return found!;
    });
    expect(text(chip())).toBe('Ready to publish');
    await user.click(within(stale).getByRole('button', { name: 'Show where it is now' }));
    await waitFor(() => expect(text(chip())).toBe('Published'));
    expect(document.getElementById('cm-d-done')).toHaveTextContent('Published');
  });

  it('a check that fails meanwhile (publication-blocked): the panel says it moved on', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    answerWith(runtime, 'publish', { kind: 'refused', code: 'publication-blocked' } as never);
    showDecision(runtime, 'SUB-0074');
    await heading('Transient Cooling');
    await user.click(within(panel()).getByRole('radio', { name: 'Publish' }));
    await user.click(within(panel()).getByRole('button', { name: 'Publish' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Publish' }),
    );
    expect(
      await within(panel()).findByText('This submission has moved on. Its current state is shown.'),
    ).toBeVisible();
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: 'Your decision' })).toHaveFocus(),
    );
  });

  it('failed for now: the confirmation stays open and says nothing was lost', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    showDecision(runtime, 'SUB-0074');
    await heading('Transient Cooling');
    faults(sample).failNext('ProductionService.publish' as never);
    await user.click(within(panel()).getByRole('radio', { name: 'Publish' }));
    await user.click(within(panel()).getByRole('button', { name: 'Publish' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Publish' }));
    expect(
      await within(dialog).findByText('It wasn’t published. Nothing was lost — try again.'),
    ).toBeVisible();
    expect(text(chip())).toBe('Ready to publish');
  });
});

describe('CM-03 missing prerequisite (CM-v1 P02 — a state sample, OD-B6-03)', () => {
  it('learning outcomes missing: only that check fails, Publish is not offered, Send back is preselected', async () => {
    const world = await fixtureWorld('spine-start');
    const sub = world.records.submissions['SUB-0070'] as Submission;
    const { runtime } = await worldPlatform(KAVYA, {
      ...world,
      records: {
        ...world.records,
        submissions: { ...world.records.submissions, 'SUB-0070': { ...sub, learningOutcomes: [] } },
      },
    });
    showDecision(runtime, 'SUB-0070');
    await heading('Packed Bed Pressure Drop');
    expect(text(chip())).toBe('Ready to publish · 1 to resolve');
    expect(chip()).toHaveClass('xr-st--err');
    expect(text(band().querySelector('dl.cm-idfacts > div:nth-child(2) dd.is-quiet'))).toBe(
      'None yet',
    );
    expect(text(band().querySelector('li[aria-current="step"]'))).toBe(
      'Your step, now: You Publication decision 1 thing to resolve first Your step',
    );
    const check = region('Publication check');
    expect(text(check.querySelector('.cm-gateline'))).toBe(
      '1 check not met · publishing is blocked',
    );
    expect(check.querySelector('.cm-gateline')).toHaveClass('is-no');
    expect(text(region('Catalogue preview'))).toContain(
      'None yet. The Academic Reviewer sets them during review, one set for every format.',
    );
    expect(checkRows()).toEqual([
      'Met: Approved by the Academic Reviewer Prof. A. Menon · 21 Aug 2026',
      'Not met: Learning outcomes None Send it back to the Academic Reviewer to add them.',
      'Met: Catalogue details Name, course, summary, description, version',
      'Met: Delivery details for each format WEB · AR — complete',
    ]);
    const blockers = panel().querySelector('.rk-pending[role="status"]');
    expect(text(blockers)).toBe(
      '1 thing to resolve before it can be published Learning outcomes: none. Send it back to the Academic Reviewer to add them.',
    );
    const publish = within(panel()).getByRole('radio', { name: 'Publish' });
    expect(publish).toBeDisabled();
    expect(publish.closest('label')).toHaveClass('is-off');
    expect(text(publish.closest('label'))).toBe('Publish Possible once nothing is missing.');
    expect(within(panel()).getByRole('radio', { name: 'Send back' })).toBeChecked();
    expect(within(panel()).queryByRole('button', { name: 'Publish' })).toBeNull();
    expect(within(panel()).getByRole('button', { name: 'Send back' })).toBeVisible();
    expect(text(panel().querySelector('p.rk-pending'))).toBe(
      'Publish is possible once nothing is missing. Choose who it goes back to and give a reason.',
    );
  });
});

describe('CM-03 Send back (CM-v1 P03, P04, P05; J6, J8; OD-B6-05)', () => {
  it('who and why are both required at once; references only toward the vendor; then sent with the reference', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    showDecision(runtime, 'SUB-0070');
    await heading('Packed Bed Pressure Drop');
    await user.click(within(panel()).getByRole('radio', { name: 'Send back' }));
    expect(within(panel()).getByRole('group', { name: /^Send it to/ })).toBeVisible();
    expect(text(panel().querySelector('p.rk-pending'))).toBe(
      'Choose who it goes back to and give a reason before sending it back.',
    );
    await user.click(within(panel()).getByRole('button', { name: 'Send back' }));
    const summary = await within(panel()).findByRole('alert');
    expect(text(summary)).toBe(
      'Check your decision Choose who it goes back to Add a reason so they know what to change',
    );
    await waitFor(() => expect(summary).toHaveFocus());
    expect([...panel().querySelectorAll('.rk-ferr')].map((node) => text(node))).toEqual([
      'Choose who it goes back to',
      'Add a reason so they know what to change',
    ]);
    expect(
      within(panel()).getByRole('textbox', { name: 'Reason they will see (required)' }),
    ).toHaveAttribute('aria-invalid', 'true');
    expect(within(panel()).queryByRole('group', { name: /What it refers to/ })).toBeNull();

    // To the Academic Reviewer: no references.
    await user.click(within(panel()).getByRole('radio', { name: 'Academic Reviewer' }));
    expect(
      within(panel()).getByRole('textbox', {
        name: 'Reason the Academic Reviewer will see (required)',
      }),
    ).toBeVisible();
    expect(within(panel()).queryByRole('group', { name: /What it refers to/ })).toBeNull();
    // To the vendor: references, for the submission's formats.
    await user.click(within(panel()).getByRole('radio', { name: 'Vendor' }));
    expect(text(within(panel()).getByRole('radio', { name: 'Vendor' }).closest('label'))).toBe(
      'Vendor Meridian Virtual Labs — to revise and resubmit',
    );
    const refs = within(panel()).getByRole('group', { name: /What it refers to/ });
    expect(within(refs).getAllByRole('checkbox')).toHaveLength(8);
    expect(text(refs)).not.toContain('VR');
    await user.type(
      within(panel()).getByRole('textbox', { name: 'Reason the vendor will see (required)' }),
      'Name the supported phones and tablets for the AR build.',
    );
    await user.click(
      within(refs).getByRole('checkbox', { name: 'Formats & delivery · AR · Device need' }),
    );
    expect(panel().querySelectorAll('.rk-ferr')).toHaveLength(0);
    expect(panel().querySelector('p.rk-pending')).toBeNull();
    await user.click(within(panel()).getByRole('button', { name: 'Send back' }));

    const done = await waitFor(() => {
      const found = document.getElementById('cm-d-done');
      expect(found?.querySelector('.xr-st.rk-st-lg')).toHaveTextContent('With the vendor');
      return found!;
    });
    await waitFor(() => expect(done).toHaveFocus());
    expect(text(done.querySelector('.rk-done-meta'))).toMatch(/^Sent back by you on /);
    expect(text(done.querySelector('blockquote.rk-quote'))).toBe(
      '“Name the supported phones and tablets for the AR build.”',
    );
    expect([...done.querySelectorAll('dl.rk-stand > div')].map((row) => text(row))).toEqual([
      'Catalogue Not published',
      'Ready to publish Removed until it is approved again',
      'Now with Meridian Virtual Labs',
    ]);
    expect(text(done.querySelector('.rk-next'))).toBe(
      'Nothing is published. It goes back to the Academic Reviewer when the vendor resubmits.',
    );
    expect(text(chip())).toBe('With the vendor');
    expect(within(done).getByRole('link', { name: 'Back to Ready to publish' })).toHaveAttribute(
      'href',
      '/content-manager/ready',
    );
    expect(historyWhat()[0]).toBe('Sent back to the vendor by Kavya Nair');
    expect(text(region('History').querySelector('.rk-tl-n'))).toBe(
      '“Name the supported phones and tablets for the AR build.” Refers to: Formats & delivery · AR · Device need.',
    );
    const record = await asPersonId(sample, RITU).production.getRecord('SUB-0070' as never);
    expect(record.ok && record.value.submission.status).toMatchObject({
      state: 'returned',
      by: 'content-manager',
    });
    expect(record.ok && record.value.lastReturn).toMatchObject({
      reason: 'Name the supported phones and tablets for the AR build.',
      references: [{ step: 'formats-and-delivery', format: 'ar', field: 'device-need' }],
    });
  });

  it('to the Academic Reviewer: “Sending…” while it runs; the result names the reviewer', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    const release = answerLater(runtime, 'sendBack');
    showDecision(runtime, 'SUB-0074');
    await heading('Transient Cooling');
    await user.click(within(panel()).getByRole('radio', { name: 'Send back' }));
    await user.click(within(panel()).getByRole('radio', { name: 'Academic Reviewer' }));
    await user.type(
      within(panel()).getByRole('textbox', {
        name: 'Reason the Academic Reviewer will see (required)',
      }),
      'Please re-check the second outcome.',
    );
    await user.click(within(panel()).getByRole('button', { name: 'Send back' }));
    const busy = await within(panel()).findByRole('button', { name: 'Sending…' });
    expect(busy).toHaveAttribute('aria-disabled', 'true');
    await user.click(busy);
    release();
    const done = await waitFor(() => {
      const found = document.getElementById('cm-d-done');
      expect(found?.querySelector('.xr-st--info.rk-st-lg')).toHaveTextContent(
        'Back with the Academic Reviewer',
      );
      return found!;
    });
    await waitFor(() => expect(done).toHaveFocus());
    expect(text(done.querySelector('dl.rk-stand > div:last-child'))).toBe(
      'Now with Prof. A. Menon, Academic Reviewer',
    );
    expect(text(done.querySelector('.rk-next'))).toBe(
      'Nothing is published. It comes back to Ready to publish only after it is approved again.',
    );
    expect(text(chip())).toBe('Back with the Academic Reviewer');
    expect(historyWhat()).toEqual([
      'Sent back to the Academic Reviewer by Kavya Nair',
      'Approved by Prof. A. Menon',
      'Submitted for academic review',
    ]);
  });

  it('a stale revision keeps the choice and the reason typed, and says the page is out of date', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    answerWith(runtime, 'sendBack', { kind: 'stale-version', currentRev: 99 });
    showDecision(runtime, 'SUB-0074');
    await heading('Transient Cooling');
    await user.click(within(panel()).getByRole('radio', { name: 'Send back' }));
    await user.click(within(panel()).getByRole('radio', { name: 'Academic Reviewer' }));
    const reason = within(panel()).getByRole('textbox', {
      name: 'Reason the Academic Reviewer will see (required)',
    });
    await user.type(reason, 'Please re-check the second outcome.');
    await user.click(within(panel()).getByRole('button', { name: 'Send back' }));
    const stale = await waitFor(() => {
      const found = document.getElementById('cm-d-stale');
      expect(found).not.toBeNull();
      return found!;
    });
    expect(text(stale)).toContain('This page is out of date');
    await waitFor(() => expect(stale).toHaveFocus());
    expect(within(panel()).getByRole('radio', { name: 'Academic Reviewer' })).toBeChecked();
    expect(reason).toHaveValue('Please re-check the second outcome.');
    expect(text(chip())).toBe('Ready to publish');
    // Shown again, the typed reason stays.
    await user.click(within(stale).getByRole('button', { name: 'Show where it is now' }));
    await waitFor(() => expect(document.getElementById('cm-d-stale')).toBeNull());
    expect(
      within(panel()).getByRole('textbox', {
        name: 'Reason the Academic Reviewer will see (required)',
      }),
    ).toHaveValue('Please re-check the second outcome.');
  });

  it('the service’s own validation words show on the fields', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    answerWith(runtime, 'sendBack', {
      kind: 'validation-failed',
      summaryTitle: null,
      fieldErrors: [
        {
          field: 'reason',
          key: 'CM-03.reason.required',
          message: 'Add a reason so they know what to change',
          params: {},
        },
      ],
    } as ServiceError);
    showDecision(runtime, 'SUB-0074');
    await heading('Transient Cooling');
    await user.click(within(panel()).getByRole('radio', { name: 'Send back' }));
    await user.click(within(panel()).getByRole('radio', { name: 'Vendor' }));
    await user.type(
      within(panel()).getByRole('textbox', { name: 'Reason the vendor will see (required)' }),
      'x',
    );
    await user.click(within(panel()).getByRole('button', { name: 'Send back' }));
    const summary = await within(panel()).findByRole('alert');
    expect(text(summary)).toBe('Check your decision Add a reason so they know what to change');
    expect(text(panel().querySelector('.rk-ferr'))).toBe(
      'Add a reason so they know what to change',
    );
  });

  it('failed for now: the panel says nothing was lost and keeps what was typed', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    showDecision(runtime, 'SUB-0074');
    await heading('Transient Cooling');
    faults(sample).failNext('ProductionService.sendBack' as never);
    await user.click(within(panel()).getByRole('radio', { name: 'Send back' }));
    await user.click(within(panel()).getByRole('radio', { name: 'Vendor' }));
    const reason = within(panel()).getByRole('textbox', {
      name: 'Reason the vendor will see (required)',
    });
    await user.type(reason, 'Add the install steps.');
    await user.click(within(panel()).getByRole('button', { name: 'Send back' }));
    expect(
      await within(panel()).findByText('It wasn’t sent back. Nothing was lost — try again.'),
    ).toBeVisible();
    expect(reason).toHaveValue('Add the install steps.');
    expect(text(chip())).toBe('Ready to publish');
  });
});

describe('CM-03 read-only (CM-v1 P08, P09) and not found', () => {
  it('still in academic review: the notice, “Not approved yet” without a fix line, nothing to decide', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showDecision(runtime, 'SUB-0086');
    await heading('Flash Distillation');
    expect(text(chip())).toBe('In academic review');
    expect(chip()).toHaveClass('xr-st--info');
    expect(within(crumbs()).getByRole('link', { name: 'Content library' })).toHaveAttribute(
      'href',
      '/content-manager/library?tab=in-review',
    );
    expect(text(region('Publication check').querySelector('.cm-gateline'))).toBe(
      'Read from the record',
    );
    expect(checkRows().slice(0, 2)).toEqual([
      'Not met: Approved by the Academic Reviewer Not approved yet',
      'Not met: Learning outcomes None',
    ]);
    const notice = panel().querySelector('.rk-notice')!;
    expect(notice).toHaveClass('rk-notice--info');
    expect(notice).toHaveAttribute('role', 'status');
    expect(text(panel())).toBe(
      'Your decision Still in academic review The Academic Reviewer hasn’t decided yet. It appears in Ready to publish once it is approved — read-only until then. Nothing to decide yet. Back to the Content library',
    );
    expect(within(panel()).queryByRole('button')).toBeNull();
    expect(within(panel()).queryByRole('radio')).toBeNull();
    expect(
      within(panel()).getByRole('link', { name: 'Back to the Content library' }),
    ).toHaveAttribute('href', '/content-manager/library?tab=in-review');
    expect(text(band().querySelector('li[aria-current="step"]'))).toBe(
      'Now: Academic Reviewer In academic review Since 24 Aug',
    );
  });

  it('returned to the vendor by the Academic Reviewer: “With the vendor”, read-only', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showDecision(runtime, 'SUB-0081');
    await heading('Forced Convection');
    expect(text(chip())).toBe('With the vendor');
    expect(chip()!.className).toBe('xr-st rk-st-lg');
    const notice = panel().querySelector('.rk-notice')!;
    expect(notice).toHaveClass('rk-notice--off');
    expect(text(notice)).toBe(
      'With the vendor The Academic Reviewer returned it with a reason on 24 Aug 2026. It comes back to the Academic Reviewer when the vendor resubmits.',
    );
    expect(text(region('Submission and review summary').querySelector('dl.rk-dl'))).toContain(
      'Academic review Returned to the vendor by Prof. A. Menon on 24 Aug 2026',
    );
    expect(historyWhat()[0]).toBe('Returned to vendor by Prof. A. Menon');
    expect(text(panel())).toContain('Nothing to decide yet.');
    expect(within(panel()).queryByRole('button')).toBeNull();
  });

  it('a re-check she asked for: “Back with the Academic Reviewer” with her reason, read-only', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showDecision(runtime, 'SUB-0071');
    await heading('Venturi Meter Calibration');
    expect(text(chip())).toBe('Back with the Academic Reviewer');
    expect(document.getElementById('cm-d-done')).toBeNull();
    expect(text(panel().querySelector('.rk-notice'))).toMatch(
      /^Back with the Academic Reviewer for a re-check You sent it back on 25 Aug 2026: “The second learning outcome mentions a Pitot tube.*” It comes back here if the Academic Reviewer approves it again\.$/,
    );
    expect(text(region('Submission and review summary').querySelector('dl.rk-dl'))).toMatch(
      /Academic review Approved by Prof\. A\. Menon on .*; you sent it back for a re-check on 25 Aug 2026/,
    );
    expect(within(panel()).queryByRole('button')).toBeNull();
  });

  it('a draft is the Vendor’s only: not found', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showDecision(runtime, 'SUB-0079');
    expect(
      await screen.findByRole('heading', { level: 1, name: /can’t find/i }, { timeout: 5000 }),
    ).toBeVisible();
  });

  it('decisionFacts: the panel kinds of the spine-start records', async () => {
    const { sample } = await tabPlatform(KAVYA, 'spine-start');
    const kinds: Record<string, string> = {};
    for (const id of ['SUB-0074', 'SUB-0070', 'SUB-0086', 'SUB-0071', 'SUB-0081', 'SUB-0052']) {
      const answer = await asPersonId(sample, KAVYA).production.getPublicationDecision(id as never);
      if (answer.ok) kinds[id] = decisionFacts(answer.value).kind;
    }
    expect(kinds).toEqual({
      'SUB-0074': 'open',
      'SUB-0070': 'open',
      'SUB-0086': 'read-only',
      'SUB-0071': 'sent',
      'SUB-0081': 'read-only',
      'SUB-0052': 'published',
    });
  });
});

describe('CM-05 Published experiment (CM-v1 CM05-Published, C14 … C16)', () => {
  it('live and read-only: the band, the live entry, delivery cards, the history; the Corrections panel', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showPublished(runtime, 'distillation-column');
    await heading('Distillation Column');
    expect(within(crumbs()).getByRole('link', { name: 'Content library' })).toHaveAttribute(
      'href',
      '/content-manager/library',
    );
    expect(railCurrent()).toHaveAttribute('href', '/content-manager/library');
    expect(text(band().querySelector('.rk-eyebrow'))).toBe('CHE ZG513 · Published experiment');
    expect(text(band().querySelector('.rb-id-status'))).toBe(
      'Published 1.2 live From Meridian Virtual Labs',
    );
    expect(band().querySelector('.rb-id-text')).toHaveClass('cm-idtext');
    expect(
      [...band().querySelectorAll('dl.cm-idfacts--ends > div')].map((fact) => text(fact)),
    ).toEqual([
      'Course CHE ZG513 · Process Instrumentation & Control',
      'Live since 3 Jul 2026',
      'Formats WEB · VR',
      'Corrections 2 corrections released',
    ]);
    expect(band().querySelector('.cm-idflow')).toBeNull();
    expect(
      within(band() as HTMLElement).getByRole('link', { name: 'View the public page' }),
    ).toHaveAttribute('href', '/experiments/distillation-column');
    const entry = within(region('In the public catalogue')).getByRole('article', {
      name: 'Distillation Column',
    });
    expect(text(entry.querySelector('.cm-cat-avail'))).toBe(
      'Available in Formats: WEB, VR WEB VR · version 1.2',
    );
    expect(text(entry.querySelector('h4.cm-cat-h'))).toBe(
      'Learning outcomes set by the Academic Reviewer',
    );
    expect([...entry.querySelectorAll('ol.cm-ol li')].map((item) => text(item))).toEqual([
      'Bring a column to steady state from cold start',
      'Tune reflux ratio against an overhead purity target',
    ]);
    expect(text(region('In the public catalogue').querySelector('dl.cm-p-dl'))).toMatch(
      /^Description Learners start a binary column .* Live version 1\.2, since 3 Jul 2026$/,
    );
    const delivery = region('Delivery');
    expect([...delivery.querySelectorAll('.cm-delcard-h')].map((head) => text(head))).toEqual([
      'WEB Web link',
      'VR App package (provisional)',
    ]);
    expect(text(delivery)).toContain('Package reference MVL-DC-VR-1.2');
    expect(historyWhat()).toEqual([
      'Version 1.2 released',
      'Version 1.1 released',
      'Published · version 1.0',
    ]);
    expect([...region('History').querySelectorAll('.rk-tl-n')].map((node) => text(node))).toEqual([
      'Correction UPD-0002 — released by the Super Admin.',
      'Correction UPD-0001.',
      'First publication by the Content Manager.',
    ]);
    // The Corrections panel: no update open — the three entries.
    expect(text(corrections().querySelector('.rk-next'))).toBe(
      'Live content is read-only here. Every change opens one correction draft, pre-filled with the live version.',
    );
    expect(
      within(corrections())
        .getAllByRole('button')
        .map((button) => [text(button), button.className]),
    ).toEqual([
      ['Start a correction', 'rb-btn rb-btn--primary rk-go'],
      ['Edit catalogue details', 'rb-btn cm-wide'],
      ['Edit delivery link', 'rb-btn cm-wide'],
    ]);
    expect(within(corrections()).queryByRole('link')).toBeNull();
    expect(main().querySelectorAll('input, textarea, select')).toHaveLength(0);
    expect(main().querySelector('.rk-notice')).toBeNull();
  });

  it('an update in progress (a draft): the band’s track, “Continue the update” and the joining entries', async () => {
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    const opened = await asPersonId(sample, KAVYA).corrections.openCorrection({
      experimentId: 'distillation-column' as never,
      entry: 'start-a-correction',
    });
    expect(opened.ok).toBe(true);
    showPublished(runtime, 'distillation-column');
    await heading('Distillation Column');
    expect(text(band().querySelector('dl.cm-idfacts > div:last-child'))).toBe(
      'Corrections UPD-0005 · Draft',
    );
    const track = band().querySelector('.cm-idflow')!;
    expect(text(track.querySelector('.cm-idflow-h'))).toBe(
      'Correction in progress UPD-0005 · Draft 1.2 live No version label yet',
    );
    const steps = within(track as HTMLElement).getByRole('list', {
      name: 'Where the open correction is',
    });
    expect(steps).toHaveClass('cm-flow', 'cm-flow--mini');
    expect(steps.querySelector('[aria-current="step"]')).toHaveTextContent('Draft');
    const notice = corrections().querySelector('.rk-notice')!;
    expect(notice).toHaveClass('rk-notice--info');
    expect(text(notice)).toBe(
      'A correction is open UPD-0005 · Draft. Edits to this experiment join that update.',
    );
    const open = within(corrections()).getByRole('link', { name: 'Continue the update' });
    expect(open).toHaveAttribute('href', '/content-manager/updates/UPD-0005');
    expect(open.className).toBe('rb-btn rb-btn--primary rk-go');
    expect(
      within(corrections())
        .queryAllByRole('button')
        .map((button) => text(button)),
    ).toEqual(['Edit catalogue details', 'Edit delivery link']);
    expect(historyWhat()[0]).toBe('UPD-0005 started — draft');
    expect(text(region('History').querySelector('.rk-tl-n'))).toBe(
      'Version not set yet. The live version below is unchanged.',
    );
  });

  it('on hold (UPD-0004): only “Open update”, the hold in the history; a blank package value reads “—”', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showPublished(runtime, 'boiler-drum-level');
    await heading('Boiler Drum Level');
    expect(text(band().querySelector('.rb-id-status'))).toBe('Published 2.0 live');
    expect(text(band().querySelector('.cm-idflow-h'))).toBe(
      'Correction in progress UPD-0004 · On hold 2.0 live 2.1 proposed',
    );
    expect(band().querySelector('.cm-idflow-h .xr-st')).toHaveClass('xr-st--paused');
    const notice = corrections().querySelector('.rk-notice')!;
    expect(notice).toHaveClass('rk-notice--paused');
    expect(text(notice)).toBe(
      'An update is in progress UPD-0004 · On hold. The Super Admin put it on hold. Version 2.0 stays live.',
    );
    expect(within(corrections()).queryAllByRole('button')).toHaveLength(0);
    expect(within(corrections()).getByRole('link', { name: 'Open update' })).toHaveAttribute(
      'href',
      '/content-manager/updates/UPD-0004',
    );
    expect(historyWhat()[0]).toBe('UPD-0004 on hold');
    expect(text(region('History').querySelector('.rk-tl-n'))).toMatch(
      /^Version 2\.0 stays live\. Reason: “.+”$/,
    );
    expect(text(region('Delivery'))).toContain('Package —');
  });

  it('returned (UPD-0006): the entries join it, the notice says it was returned', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showPublished(runtime, 'induction-motor-loading');
    await heading('Induction Motor Loading');
    expect(text(corrections().querySelector('.rk-notice'))).toBe(
      'A correction is open UPD-0006 · Returned. It was returned to you with a reason. Edits to this experiment join that update.',
    );
    expect(band().querySelector('.cm-idflow-h .xr-st')).toHaveClass('xr-st--err');
    expect(
      within(corrections()).getByRole('link', { name: 'Continue the update' }),
    ).toHaveAttribute('href', '/content-manager/updates/UPD-0006');
    expect(historyWhat()[0]).toBe('UPD-0006 started — returned');
  });

  it('released today: “Version <label> is live” with the update and the version it replaced', async () => {
    const world = await fixtureWorld('spine-start');
    const { runtime: probe } = await worldPlatform(KAVYA, world);
    const session = probe.session.getSnapshot();
    if (session.status !== 'signed-in') throw new Error('not signed in');
    const today = session.signedInAt;
    const experiment = world.records.experiments['distillation-column'] as Experiment;
    const versions = experiment.versions.map((version) =>
      version.label === experiment.live.label ? { ...version, liveFrom: today } : version,
    );
    const { runtime } = await worldPlatform(KAVYA, {
      ...world,
      records: {
        ...world.records,
        experiments: {
          ...world.records.experiments,
          'distillation-column': {
            ...experiment,
            versions,
            live: { ...experiment.live, liveFrom: today },
          },
        },
      },
    });
    showPublished(runtime, 'distillation-column');
    await heading('Distillation Column');
    const notice = main().querySelector('.rk-notice--ok')!;
    expect(notice).toHaveAttribute('role', 'status');
    expect(text(notice)).toMatch(
      /^Version 1\.2 is live The Super Admin released UPD-0002 on \d+ \w+ 2026\. The history keeps version 1\.1 and every decision\. Nobody’s access changed\.$/,
    );
  });

  it('an unknown experiment is not found', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showPublished(runtime, 'no-such-experiment');
    expect(
      await screen.findByRole('heading', { level: 1, name: /can’t find/i }, { timeout: 5000 }),
    ).toBeVisible();
  });
});
