/**
 * What only the Content Manager's correction group draws (owner-approved export
 * design/v3-refined-b/roles/CM-v1, `project/Main.dc.html` "CM-08 Updates list" and "CM-08
 * Correction detail"): the Updates head, the correction tracker and its loading, the returned
 * reason, the correction form, the change comparison, the panel's state notice and save failure —
 * composed with the shared Content Manager pieces (`cm.tsx`) as the export draws them. Markup
 * against the export's classes and ARIA, the class contract and the accessibility checks.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { assertNoAxeViolations, cmExportText, expectV3ClassesOnly } from '../testing/index.js';
import { ButtonLink } from './actions.js';
import { CmQuote, CmStageTrack, CmVersionChange } from './cm.js';
import {
  CmComparison,
  CmCorrectionField,
  CmForm,
  CmFormGrid,
  CmFormSection,
  CmReturnedReason,
  CmSaveFailed,
  CmStateNotice,
  CmTrackerCount,
  CmTrackerFoot,
  CmTrackerItem,
  CmTrackerLoading,
  CmTrackerSection,
  CmUpdatesHead,
} from './cm-correction.js';
import { V3_ICON_PATHS } from './icons.js';
import { StatusPill } from './status.js';

const MAIN = cmExportText('Main.dc.html');
/** The Updates list's markup in the export. */
const LIST_VIEW = MAIN.slice(
  MAIN.indexOf('<!-- CM-08 Updates list -->'),
  MAIN.indexOf('<!-- CM-08 Correction detail'),
);
/** The correction detail's markup in the export. */
const DETAIL_VIEW = MAIN.slice(
  MAIN.indexOf('<!-- CM-08 Correction detail'),
  MAIN.indexOf('<!-- CM-09 Platform course codes -->'),
);

const STATE_WORDS = {
  done: 'Done: ',
  you: 'Your step, now: ',
  now: 'Now: ',
  back: 'Returned: ',
  held: 'On hold: ',
  off: 'Closed: ',
  next: 'Next: ',
} as const;

describe('CM-08 Updates: the head and the tracker (`div.cm-trk`)', () => {
  it('the head with its line and the two figures', async () => {
    for (const piece of [
      '<div class="rb-head">',
      '<h1 class="rb-h1" id="cm-h-updates" tabindex="-1">Updates</h1>',
      '<p class="rk-sub">Corrections you raised to published experiments.',
      '<dl class="rb-figs" aria-label="Your corrections at a glance">',
      '<div class="rb-fig"><dt class="rb-fig-t">Need you</dt><dd class="rb-fig-n">{{ U.nYou }}</dd><dd class="rb-fig-s">{{ U.nYouSub }}</dd></div>',
    ]) {
      expect(LIST_VIEW).toContain(piece);
    }
    const { container } = render(
      <CmUpdatesHead
        title="Updates"
        titleId="cm-h-updates"
        date="Thursday 27 August 2026"
        lead="Corrections you raised to published experiments."
        figuresLabel="Your corrections at a glance"
        figures={[
          { title: 'Need you', value: 1, details: ['Returned to you or not sent yet'] },
          {
            title: 'With others',
            value: 2,
            details: ['With the Academic Reviewer or the Super Admin'],
          },
        ]}
      />,
    );
    const head = container.querySelector('div.rb-head')!;
    expect(head.querySelector('p.rb-eyebrow-date')).toHaveTextContent('Thursday 27 August 2026');
    const h1 = screen.getByRole('heading', { level: 1, name: 'Updates' });
    expect(h1).toHaveClass('rb-h1');
    expect(h1).toHaveAttribute('tabindex', '-1');
    expect(head.querySelector('p.rk-sub')).toHaveTextContent('Corrections you raised');
    const figures = head.querySelector('dl.rb-figs')!;
    expect(figures).toHaveAttribute('aria-label', 'Your corrections at a glance');
    expect(
      [...figures.querySelectorAll('.rb-fig')].map((figure) =>
        [...figure.children].map((child) => `${child.tagName}.${child.className}`),
      ),
    ).toEqual([
      ['DT.rb-fig-t', 'DD.rb-fig-n', 'DD.rb-fig-s'],
      ['DT.rb-fig-t', 'DD.rb-fig-n', 'DD.rb-fig-s'],
    ]);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('a group of cards: count, head with its gold count, a card with its track and quoted reason', async () => {
    for (const piece of [
      '<p class="rk-count cm-trkcount" role="status">{{ U.count }}</p>',
      '<section class="cm-trksec" aria-labelledby="{{ sec.hid }}">',
      '<div class="cm-grp-head"><h2 class="rb-h2" id="{{ sec.hid }}">{{ sec.t }}<span class="{{ sec.nCls }}">{{ sec.n }}</span></h2><p class="rb-note">{{ sec.note }}</p></div>',
      '<ul class="cm-trklist">',
      '<div class="cm-trk-id">',
      '<h3 class="cm-qname">{{ r.name }}</h3>',
      '<p class="cm-trk-meta"><span>{{ r.meta }}</span><span class="cm-ver">',
      '<p class="cm-trk-st"><span class="{{ r.stCls }}"><i></i>{{ r.stLabel }}</span></p>',
      '<div class="cm-trk-act"><a class="{{ r.btnCls }}"',
      '<div class="cm-trk-flow cm-flowwrap">',
      '<ol class="cm-flow cm-flow--mini" aria-label="Where this correction is">',
      '<blockquote class="cm-orow-q cm-trk-note"><p>{{ r.note }}</p><footer>{{ r.noteBy }}</footer></blockquote>',
      '<p class="rb-note cm-trkfoot">Start a correction from a published experiment in the Content library. Each experiment has at most one open update.</p>',
    ]) {
      expect(LIST_VIEW).toContain(piece);
    }
    const { container } = render(
      <>
        <CmTrackerCount>4 corrections you raised, most recent change first</CmTrackerCount>
        <CmTrackerSection
          title="Need you"
          titleId="cm-upd-you"
          count={1}
          countYou
          note="Change it and send it, or withdraw it"
        >
          <CmTrackerItem
            yours
            name="Induction Motor Loading"
            meta="EEE ZC341 · Electrical Machines · last change 26 Aug"
            version={
              <CmVersionChange
                from={{ text: '1.0 live', kind: 'live' }}
                to={{ text: '1.1 proposed', kind: 'new' }}
              />
            }
            status={<StatusPill tone="err">Returned</StatusPill>}
            action={
              <ButtonLink
                variant="primary"
                href="/content-manager/updates/UPD-0006"
                aria-label="Continue the update to Induction Motor Loading, version 1.1, returned"
              >
                Continue
              </ButtonLink>
            }
            track={
              <CmStageTrack
                placement="tracker"
                mini
                label="Where this correction is"
                stateWords={STATE_WORDS}
                steps={[
                  {
                    key: 'you',
                    who: 'You',
                    what: 'Returned to you',
                    when: 'Change it and send it again',
                    state: 'you',
                    icon: 'edit',
                  },
                  {
                    key: 'rv',
                    who: 'Academic Reviewer',
                    what: 'Academic review',
                    when: 'Returned 26 Aug',
                    state: 'back',
                  },
                  {
                    key: 'sa',
                    who: 'Super Admin',
                    what: 'Release decision',
                    when: 'After approval',
                    state: 'next',
                  },
                  {
                    key: 'all',
                    who: 'Everyone',
                    what: 'Live',
                    when: 'When released',
                    state: 'next',
                  },
                ]}
              />
            }
            note={
              <CmQuote
                tracker
                quote="“The proposed description says slip falls as the load rises.”"
                by="Prof. A. Menon, Academic Reviewer · 26 Aug"
              />
            }
          />
        </CmTrackerSection>
        <CmTrackerFoot>Start a correction from a published experiment.</CmTrackerFoot>
      </>,
    );
    expect(container.querySelector('p.rk-count.cm-trkcount')).toHaveAttribute('role', 'status');
    const section = screen.getByRole('region', { name: /^Need you/ });
    expect(section).toHaveClass('cm-trksec');
    expect(section.querySelector('.cm-grp-n')).toHaveClass('is-you');
    const tracked = section.querySelector('ul.cm-trklist > li')!;
    expect(tracked).toHaveClass('cm-trk', 'is-you');
    expect(tracked).not.toHaveClass('is-closed');
    expect([...tracked.children].map((child) => child.className)).toEqual([
      'cm-trk-id',
      'cm-trk-st',
      'cm-trk-act',
      'cm-trk-flow cm-flowwrap',
      'cm-orow-q cm-trk-note',
    ]);
    expect(tracked.querySelector('h3.cm-qname')).toHaveTextContent('Induction Motor Loading');
    expect(tracked.querySelector('p.cm-trk-meta > span:first-child')).toHaveTextContent(
      'EEE ZC341 · Electrical Machines · last change 26 Aug',
    );
    expect(tracked.querySelector('p.cm-trk-meta > span.cm-ver')).not.toBeNull();
    expect(
      within(tracked as HTMLElement).getByRole('link', {
        name: 'Continue the update to Induction Motor Loading, version 1.1, returned',
      }),
    ).toHaveClass('rb-btn', 'rb-btn--primary');
    const track = within(tracked as HTMLElement).getByRole('list', {
      name: 'Where this correction is',
    });
    expect(track).toHaveClass('cm-flow', 'cm-flow--mini');
    expect(container.querySelector('p.rb-note.cm-trkfoot')).not.toBeNull();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('a closed card: its outcome line instead of the track', () => {
    for (const piece of [
      '<sc-if value="{{ r.closed }}" hint-placeholder-val="{{ false }}"><p class="{{ r.resCls }}"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="{{ r.resIco }}"></use></svg>{{ r.res }}</p></sc-if>',
    ]) {
      expect(LIST_VIEW).toContain(piece);
    }
    const { container } = render(
      <ul>
        <CmTrackerItem
          closed
          name="Orifice Plate Metering"
          meta="last change 5 Aug"
          version={
            <CmVersionChange
              from={{ text: '1.0', kind: 'old' }}
              to={{ text: '1.1 live', kind: 'live' }}
            />
          }
          status={<StatusPill tone="ok">Released</StatusPill>}
          action={<ButtonLink href="/content-manager/updates/UPD-0003">Open</ButtonLink>}
          outcome={{
            kind: 'released',
            text: 'Released by Arjun Mehta, Super Admin, on 5 Aug 2026.',
          }}
        />
        <CmTrackerItem
          closed
          name="Boiler Drum Level"
          meta="last change 27 Aug"
          version={<CmVersionChange from={{ text: '2.0 live', kind: 'live' }} />}
          status={<StatusPill tone="ended">Withdrawn</StatusPill>}
          action={<ButtonLink href="/content-manager/updates/UPD-0008">Open</ButtonLink>}
          outcome={{ kind: 'withdrawn', text: 'Withdrawn on 27 Aug 2026.' }}
        />
      </ul>,
    );
    const [released, withdrawn] = [...container.querySelectorAll('li.cm-trk')];
    expect(released).toHaveClass('is-closed');
    expect(released!.querySelector('.cm-flowwrap')).toBeNull();
    expect(released!.querySelector('p.cm-trk-res')).toHaveClass('is-ok');
    expect(released!.querySelector('p.cm-trk-res path')).toHaveAttribute('d', V3_ICON_PATHS.check);
    expect(withdrawn!.querySelector('p.cm-trk-res')).not.toHaveClass('is-ok');
    expect(withdrawn!.querySelector('p.cm-trk-res path')).toHaveAttribute('d', V3_ICON_PATHS.ended);
    expect(withdrawn!.querySelector('p.cm-trk-res svg')).toHaveAttribute('aria-hidden', 'true');
    expectV3ClassesOnly(container);
  });

  it('loading: the announced line over the skeleton band and two cards', async () => {
    for (const piece of [
      '<section class="rk-surface" aria-busy="true" aria-label="Corrections you raised">',
      '<p class="rk-loading-msg" role="status">Loading your corrections…</p>',
      '<div class="rk-skel-ca" aria-hidden="true">',
      '<div class="rk-skel-band"><span class="rk-skel"></span><span class="rk-skel"></span></div>',
    ]) {
      expect(LIST_VIEW).toContain(piece);
    }
    expect(LIST_VIEW.split('<div class="rk-skel-card">')).toHaveLength(3);
    const { container } = render(
      <CmTrackerLoading message="Loading your corrections…" label="Corrections you raised" />,
    );
    const surface = screen.getByRole('region', { name: 'Corrections you raised' });
    expect(surface).toHaveClass('rk-surface');
    expect(surface).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Loading your corrections…');
    expect(surface.querySelectorAll('.rk-skel-ca > .rk-skel-band')).toHaveLength(1);
    expect(surface.querySelectorAll('.rk-skel-ca > .rk-skel-card')).toHaveLength(2);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

describe('CM-08 the correction: the sheet', () => {
  it('the returned reason first (`div.cm-retbox`)', async () => {
    for (const piece of [
      '<section class="rk-sec" aria-labelledby="cm-u-ret">',
      '<div class="cm-retbox">',
      '<div class="cm-retbox-h"><h2 class="rb-h2" id="cm-u-ret">Returned by the Academic Reviewer</h2><p class="cm-retbox-m">{{ E.retMeta }}</p></div>',
      '<blockquote class="rk-quote"><p>{{ E.retReason }}</p><p class="rk-quote-by">{{ E.retBy }}</p></blockquote>',
      '<p class="rk-hint">Change what’s needed below, then send it for academic review again.</p>',
    ]) {
      expect(DETAIL_VIEW).toContain(piece);
    }
    const { container } = render(
      <CmReturnedReason
        title="Returned by the Academic Reviewer"
        titleId="cm-u-ret"
        meta="26 Aug 2026, 10:00 · Prof. A. Menon"
        reason="It rises."
        by="Prof. A. Menon, Academic Reviewer"
        hint="Change what’s needed below, then send it for academic review again."
      />,
    );
    const section = screen.getByRole('region', { name: 'Returned by the Academic Reviewer' });
    expect(section).toHaveClass('rk-sec');
    const box = section.querySelector(':scope > div.cm-retbox')!;
    expect([...box.children].map((child) => child.className)).toEqual([
      'cm-retbox-h',
      'rk-quote',
      'rk-hint',
    ]);
    expect(box.querySelector('p.cm-retbox-m')).toHaveTextContent('26 Aug 2026, 10:00');
    expect(box.querySelector('p.rk-quote-by')).toHaveTextContent('Prof. A. Menon');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('the form: a section with its note, the reason-and-label grid, fields with a Changed tag', async () => {
    for (const piece of [
      '<div class="rk-sec-h"><h2 class="rb-h2" id="cm-u-why-h">About this correction</h2><p class="rb-note">Both are needed to send it</p></div>',
      '<div class="cm-formgrid cm-formgrid--about">',
      '<div class="cm-form">',
      '<div class="cm-label-row"><label class="rk-label" for="cm-u-name">Name</label><sc-if value="{{ E.chg.name }}" hint-placeholder-val="{{ false }}"><span class="cm-tag">Changed</span></sc-if></div>',
      '<input id="cm-u-name" class="rk-input" type="text" value="{{ E.f.name }}" autocomplete="off"',
      '<p class="rk-hint" id="cm-u-summary-hint">One sentence. The first thing people read in the catalogue.</p>',
      '<input id="cm-u-web" class="rk-input" type="url" value="{{ E.f.web }}" autocomplete="off" spellcheck="false" aria-describedby="cm-u-web-hint"',
      '<div class="cm-formgrid">',
    ]) {
      expect(DETAIL_VIEW).toContain(piece);
    }
    const typed = vi.fn();
    const { container } = render(
      <CmFormSection
        title="Catalogue details"
        titleId="cm-u-cat-h"
        note="Pre-filled with the live version · change only what needs correcting"
      >
        <CmForm>
          <CmCorrectionField id="cm-u-name" label="Name" value="Fin-Tube Bundle" onChange={typed} />
          <CmCorrectionField
            id="cm-u-summary"
            label="Summary"
            hint="One sentence."
            multiline
            height="short"
            changed="Changed"
            describedBy="cm-u-chg-err"
            value="Introduce progressive fouling."
            onChange={typed}
          />
          <CmCorrectionField
            id="cm-u-web"
            label="WEB · web link"
            hint="Starts with https://"
            type="url"
            code
            value="https://labs.example/fin"
            onChange={typed}
          />
          <CmCorrectionField
            id="cm-u-desc"
            label="Description"
            multiline
            height="long"
            value="Fouling builds up."
            onChange={typed}
          />
          <CmFormGrid>
            <CmCorrectionField
              id="cm-u-pk-VR"
              label="VR · package reference"
              code
              value="A"
              onChange={typed}
            />
          </CmFormGrid>
          <CmFormGrid about>
            <span>reason</span>
          </CmFormGrid>
        </CmForm>
      </CmFormSection>,
    );
    const section = screen.getByRole('region', { name: 'Catalogue details' });
    expect(section.querySelector('.rk-sec-h > p.rb-note')).toHaveTextContent('Pre-filled');
    const name = screen.getByRole('textbox', { name: 'Name' });
    expect(name).toHaveClass('rk-input');
    expect(name).toHaveAttribute('autocomplete', 'off');
    expect(name).not.toHaveAttribute('aria-describedby');
    expect(name.closest('.rk-field')!.querySelector('.cm-tag')).toBeNull();
    const summary = screen.getByRole('textbox', { name: 'Summary' });
    expect(summary.tagName).toBe('TEXTAREA');
    // The export's inline heights (V3P-14): Summary 80 px, Description 150 px.
    expect(DETAIL_VIEW).toContain(
      '<textarea id="cm-u-summary" class="rk-textarea" style="min-height: 80px"',
    );
    expect(DETAIL_VIEW).toContain(
      '<textarea id="cm-u-desc" class="rk-textarea" style="min-height: 150px"',
    );
    expect(summary.className).toBe('rk-textarea rk-x-textarea-short');
    expect(screen.getByRole('textbox', { name: 'Description' }).className).toBe(
      'rk-textarea rk-x-textarea-long',
    );
    expect(summary).toHaveAttribute('aria-describedby', 'cm-u-summary-hint cm-u-chg-err');
    expect(
      summary.closest('.rk-field')!.querySelector('.cm-label-row > span.cm-tag'),
    ).toHaveTextContent('Changed');
    const web = screen.getByRole('textbox', { name: 'WEB · web link' });
    expect(web).toHaveAttribute('type', 'url');
    expect(web).toHaveAttribute('spellcheck', 'false');
    expect(web).toHaveAttribute('aria-describedby', 'cm-u-web-hint');
    fireEvent.change(web, { target: { value: 'https://labs.example/fin-1-1' } });
    expect(typed).toHaveBeenLastCalledWith('https://labs.example/fin-1-1');
    expect(container.querySelector('div.cm-formgrid:not(.cm-formgrid--about)')).not.toBeNull();
    expect(container.querySelector('div.cm-formgrid.cm-formgrid--about')).not.toBeNull();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('the comparison: changed fields only, each value labelled for phones; or nothing changed yet', async () => {
    for (const piece of [
      '<div class="cm-cmpwrap">',
      '<table class="cm-cmp">',
      '<caption>{{ E.cmpTitle }}, changed fields only</caption>',
      '<thead><tr><th scope="col">Field</th><th scope="col">{{ E.cmpA }}</th><th scope="col">{{ E.cmpB }}</th></tr></thead>',
      '<tr><td class="cm-cmp-f">{{ c.f }}</td><td class="cm-cmp-now"><span class="cm-inlabel">{{ E.cmpA }}</span>{{ c.cur }}</td><td class="cm-cmp-new"><span class="cm-inlabel">{{ E.cmpB }}</span>{{ c.pro }}</td></tr>',
      '<div class="cm-cmpwrap"><p class="cm-cmp-empty">Nothing changed yet.</p></div>',
    ]) {
      expect(DETAIL_VIEW).toContain(piece);
    }
    const columns = { field: 'Field', before: 'Live now', after: 'Proposed' };
    const { container } = render(
      <CmComparison
        caption="Current and proposed, changed fields only"
        columns={columns}
        empty="Nothing changed yet."
        rows={[
          { key: 'description', field: 'Description', before: 'Old.', after: 'New.' },
          { key: 'version', field: 'Version', before: '1.0', after: '1.1' },
        ]}
      />,
    );
    const table = screen.getByRole('table', { name: 'Current and proposed, changed fields only' });
    expect(table).toHaveClass('cm-cmp');
    expect(table.parentElement).toHaveClass('cm-cmpwrap');
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Field', 'Live now', 'Proposed']);
    const row = table.querySelectorAll('tbody tr')[1]!;
    expect([...row.children].map((cell) => cell.className)).toEqual([
      'cm-cmp-f',
      'cm-cmp-now',
      'cm-cmp-new',
    ]);
    expect(row.querySelector('.cm-cmp-now > span.cm-inlabel')).toHaveTextContent('Live now');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);

    const empty = render(
      <CmComparison caption="x" columns={columns} empty="Nothing changed yet." rows={[]} />,
    );
    expect(empty.container.querySelector('div.cm-cmpwrap > p.cm-cmp-empty')).toHaveTextContent(
      'Nothing changed yet.',
    );
    expect(empty.container.querySelector('table')).toBeNull();
  });

  it('the change error over the comparison (`p.rk-ferr#cm-u-chg-err`, 10 px above it)', async () => {
    expect(DETAIL_VIEW).toContain(
      '<p class="rk-ferr" id="cm-u-chg-err" style="margin-bottom: 10px"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#cmi-alert"></use></svg>{{ E.e.chg }}</p></sc-if>\n              <sc-if value="{{ E.hasCmp }}"',
    );
    const columns = { field: 'Field', before: 'Live now', after: 'Proposed' };
    const { container } = render(
      <div>
        <CmComparison
          caption="x"
          columns={columns}
          empty="Nothing changed yet."
          rows={[]}
          error={{ id: 'cm-u-chg-err', text: 'Change at least one catalogue or delivery field' }}
        />
      </div>,
    );
    const [error, wrap] = [...container.firstElementChild!.children];
    expect(error!.className).toBe('rk-ferr rk-x-ferr-below');
    expect(error).toHaveAttribute('id', 'cm-u-chg-err');
    expect(error!.querySelector('svg path')).toHaveAttribute('d', V3_ICON_PATHS.alertCircle);
    expect(error).toHaveTextContent('Change at least one catalogue or delivery field');
    expect(wrap!.className).toBe('cm-cmpwrap');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

describe('CM-08 the correction: the panel', () => {
  it('the state notice: tone, icon, the reason in bold in the text column, focusable', async () => {
    for (const piece of [
      '<div class="{{ E.nCls }}" role="status" id="cm-u-state" tabindex="-1">',
      '<p class="rk-notice-t">{{ E.nTitle }}</p>',
      '<p class="rk-notice-d">{{ E.nBody }}</p>',
      // The reason and the extra line in the text column, spaced inline: `rk-x-notice-more` (V3P-14).
      '<p class="rk-notice-d" style="grid-column: 2; margin-top: 6px"><b>Reason:</b> {{ E.nQuote }}</p>',
      '<p class="rk-notice-d" style="grid-column: 2; margin-top: 6px">{{ E.nExtra }}</p>',
    ]) {
      expect(DETAIL_VIEW).toContain(piece);
    }
    const { container, rerender } = render(
      <CmStateNotice
        tone="paused"
        icon="pauseCircle"
        id="cm-u-state"
        title="On hold"
        reason={{
          label: 'Reason:',
          text: '“Hold until the vendor fixes it.” — Arjun Mehta, Super Admin',
        }}
      >
        The Super Admin put this update on hold on 20 Aug 2026. Version 2.0 stays live.
      </CmStateNotice>,
    );
    const notice = screen.getByRole('status');
    expect(notice).toHaveClass('rk-notice', 'rk-notice--paused');
    expect(notice).toHaveAttribute('id', 'cm-u-state');
    expect(notice).toHaveAttribute('tabindex', '-1');
    expect(notice.querySelector('svg path')).toHaveAttribute('d', V3_ICON_PATHS.pauseCircle);
    // As the export: the bare glyph, the title, the line, then the reason in the text column.
    expect(
      [...notice.children].map((child) => `${child.tagName} ${child.getAttribute('class') ?? ''}`),
    ).toEqual(['svg ', 'P rk-notice-t', 'P rk-notice-d', 'P rk-notice-d rk-x-notice-more']);
    const lines = notice.querySelectorAll('p.rk-notice-d');
    expect(lines[1]!.querySelector('b')).toHaveTextContent('Reason:');
    expect(lines[1]).toHaveTextContent(
      'Reason: “Hold until the vendor fixes it.” — Arjun Mehta, Super Admin',
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
    rerender(
      <CmStateNotice
        tone="info"
        icon="clock"
        id="cm-u-state"
        title="Awaiting release decision"
        extra="The hold was lifted on 27 Aug 2026."
      >
        The Academic Reviewer approved it.
      </CmStateNotice>,
    );
    expect(
      [...screen.getByRole('status').querySelectorAll(':scope > p')].map((line) => line.className),
    ).toEqual(['rk-notice-t', 'rk-notice-d', 'rk-notice-d rk-x-notice-more']);
  });

  it('the save failure: an alert with its line and Try again', async () => {
    for (const piece of [
      '<div class="rk-errsum" id="cm-u-savefail" tabindex="-1" role="alert">',
      '<p class="rk-errsum-t">We couldn’t save your draft</p>',
    ]) {
      expect(DETAIL_VIEW).toContain(piece);
    }
    const retry = vi.fn();
    const { container, rerender } = render(
      <CmSaveFailed
        id="cm-u-savefail"
        title="We couldn’t save your draft"
        retryLabel="Try again"
        busyLabel="Saving…"
        onRetry={retry}
      >
        Your changes are still on this page. The live version is unchanged. Try again.
      </CmSaveFailed>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('rk-errsum');
    expect(alert).toHaveAttribute('tabindex', '-1');
    expect(alert.querySelector('p.rk-errsum-t')).toHaveTextContent('We couldn’t save your draft');
    // The line and Try again, spaced inline in the export: V3P-14.
    expect(DETAIL_VIEW).toContain(
      '<p style="margin-top: 4px; font: 500 15px/22px var(--sans)">Your changes are still on this page.',
    );
    expect(DETAIL_VIEW).toContain(
      '<button type="button" class="rb-btn" style="margin-top: 10px" onClick="{{ E.save }}">Try again</button>',
    );
    expect([...alert.children].map((child) => `${child.tagName} ${child.className}`)).toEqual([
      'P rk-errsum-t',
      'P rk-x-errsum-line',
      'BUTTON rb-btn rk-x-errsum-retry',
    ]);
    fireEvent.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
    rerender(
      <CmSaveFailed
        id="cm-u-savefail"
        title="We couldn’t save your draft"
        retryLabel="Try again"
        busy
        busyLabel="Saving…"
        onRetry={retry}
      >
        Your changes are still on this page.
      </CmSaveFailed>,
    );
    fireEvent.click(within(screen.getByRole('alert')).getByRole('button', { name: 'Saving…' }));
    expect(retry).toHaveBeenCalledTimes(1);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});
