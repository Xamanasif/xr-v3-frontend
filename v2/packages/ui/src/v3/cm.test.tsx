/**
 * What more than one Content Manager screen group draws (owner-approved export
 * design/v3-refined-b/roles/CM-v1, `project/Main.dc.html`, `project/cm.css`; COMPONENT-EXTENSIONS
 * A, D, F, J, 7): the stage track (CM-03, CM-05, CM-08 list and detail), the version change (CM-01,
 * CM-05, CM-08), the identity band (CM-03, CM-05, CM-08 detail), the group head with its count
 * (CM-01, CM-08 list) and the small pieces. Each is rendered with the export's own sample values
 * and compared with the export's template filled the way its script fills it (`sc-for`, `sc-if`,
 * `{{ … }}`, the `cmi-*` sprite inlined from its own symbols); then the class contract and the
 * accessibility checks.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  cmExportText,
  expectV3ClassesOnly,
  v3Canonical,
} from '../testing/index.js';
import { ButtonLink } from './actions.js';
import {
  CmCourseName,
  CmFormatBadges,
  CmGroupHead,
  CmIdentityBand,
  CmIdentityTrack,
  CmInLabel,
  CmQuote,
  CmStageList,
  CmStageTrack,
  type CmStep,
  type CmStepStateWords,
  CmTag,
  CmVersionChange,
  CmWideButton,
  CmWideLink,
  CmYouBadge,
} from './cm.js';
import { V3_ICON_PATHS } from './icons.js';
import { StatusPill } from './status.js';

const MAIN = cmExportText('Main.dc.html');
const TEMPLATE = MAIN.slice(0, MAIN.indexOf('<script type="text/x-dc"'));

/** The export's `cmi-*` symbols, by id. */
const SYMBOLS = new Map(
  [...MAIN.matchAll(/<symbol id="(cmi-[\w-]+)" viewBox="0 0 24 24"><path d="([^"]+)"/g)].map(
    (match) => [match[1] ?? '', match[2] ?? ''] as const,
  ),
);

type Scope = Readonly<Record<string, unknown>>;

function lookup(scope: Scope, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    return value && typeof value === 'object' ? (value as Scope)[key] : undefined;
  }, scope);
}

/**
 * An excerpt of the export's template filled as its runtime fills it: each `sc-for` repeated over
 * its list, each `sc-if` kept or dropped, each `{{ name }}` replaced; the preview's wiring (event
 * bindings, `data-to`) and empty `class=""` dropped; sprite references inlined.
 */
function fill(html: string, scope: Scope): string {
  let out = html.replace(
    /<sc-for list="\{\{ ([\w.]+) \}\}" as="(\w+)" hint-placeholder-count="\d+">([\s\S]*?)<\/sc-for>/g,
    (_whole, list: string, as: string, inner: string) =>
      (lookup(scope, list) as readonly unknown[])
        .map((item) => fill(inner, { ...scope, [as]: item }))
        .join(''),
  );
  out = out.replace(
    /<sc-if value="\{\{ ([\w.]+) \}\}" hint-placeholder-val="\{\{ \w+ \}\}">([\s\S]*?)<\/sc-if>/g,
    (_whole, name: string, inner: string) => (lookup(scope, name) ? inner : ''),
  );
  out = out.replace(/\{\{ ([\w.]+) \}\}/g, (_whole, name: string) =>
    String(lookup(scope, name) ?? ''),
  );
  return out
    .replace(/ on[A-Z][A-Za-z]*="[^"]*"/g, '')
    .replace(/ data-to="[^"]*"/g, '')
    .replace(/ class=""/g, '')
    .replace(/<use href="#(cmi-[\w-]+)"><\/use>/g, (whole, id: string) => {
      const path = SYMBOLS.get(id);
      return path ? `<path d="${path}"></path>` : whole;
    });
}

/** The excerpt of the template from `start` to the end of the element it opens. */
function excerpt(start: string, end: string): string {
  const from = TEMPLATE.indexOf(start);
  expect(from, `the export draws ${start}`).toBeGreaterThanOrEqual(0);
  const to = TEMPLATE.indexOf(end, from);
  return TEMPLATE.slice(from, to + end.length);
}

function expectSameMarkup(element: Element, expected: string) {
  expect(v3Canonical(element.outerHTML)).toBe(v3Canonical(expected));
}

const STATE_WORDS: CmStepStateWords = {
  done: 'Done: ',
  you: 'Your step, now: ',
  now: 'Now: ',
  back: 'Returned: ',
  held: 'On hold: ',
  off: 'Closed: ',
  next: 'Next: ',
};

/** The script's `flowSteps`: what each stage's template values are, from [who, what, when, state, icon]. */
function flowOf(defs: readonly (readonly [string, string, string, CmStep['state'], string?])[]) {
  const CLS = {
    done: ' is-done',
    you: ' is-you',
    now: ' is-now',
    back: ' is-back',
    held: ' is-held',
    off: ' is-off',
    next: '',
  };
  const ICO = {
    done: '#cmi-check',
    you: '#cmi-upload',
    now: '#cmi-clock',
    back: '#cmi-refresh',
    held: '#cmi-pause',
    off: '#cmi-ended',
    next: '',
  };
  const live = ['you', 'now', 'back', 'held'];
  const yours = defs.findIndex((def) => def[3] === 'you');
  const current = yours >= 0 ? yours : defs.findIndex((def) => live.includes(def[3]));
  return defs.map(([k, t, d, state, icon], index) => {
    const ico = icon ?? ICO[state];
    return {
      k,
      t,
      d,
      i: String(index + 1),
      cls: `cm-step${CLS[state]}`,
      ico,
      hasIco: !!ico,
      noIco: !ico,
      sr: STATE_WORDS[state],
      you: state === 'you',
      cur: index === current ? 'step' : 'false',
    };
  });
}

function stepsOf(
  defs: readonly (readonly [string, string, string, CmStep['state'], CmStep['icon']?])[],
): CmStep[] {
  return defs.map(([who, what, when, state, icon], index) => ({
    key: String(index),
    who,
    what,
    when,
    state,
    ...(icon ? { icon } : {}),
  }));
}

describe('the export’s glyphs are the kit’s', () => {
  it('each stage state’s icon, the arrow and the edit mark draw the export’s symbols', () => {
    expect(SYMBOLS.get('cmi-check')).toBe(V3_ICON_PATHS.check);
    expect(SYMBOLS.get('cmi-upload')).toBe(V3_ICON_PATHS.readyToPublish);
    expect(SYMBOLS.get('cmi-clock')).toBe(V3_ICON_PATHS.clock);
    expect(SYMBOLS.get('cmi-refresh')).toBe(V3_ICON_PATHS.updates);
    expect(SYMBOLS.get('cmi-pause')).toBe(V3_ICON_PATHS.pauseCircle);
    expect(SYMBOLS.get('cmi-ended')).toBe(V3_ICON_PATHS.ended);
    expect(SYMBOLS.get('cmi-edit')).toBe(V3_ICON_PATHS.edit);
    expect(SYMBOLS.get('cmi-right')).toBe(V3_ICON_PATHS.chevronRight);
    expect(SYMBOLS.get('cmi-ext')).toBe(V3_ICON_PATHS.externalLink);
    // The script's state words and icons, as `flowSteps` writes them.
    expect(MAIN).toContain(
      "const ICO = { done: '#cmi-check', you: '#cmi-upload', now: '#cmi-clock', back: '#cmi-refresh', held: '#cmi-pause', off: '#cmi-ended' };",
    );
    expect(MAIN).toContain(
      "const SR = { done: 'Done: ', you: 'Your step, now: ', now: 'Now: ', back: 'Returned: ', held: 'On hold: ', off: 'Closed: ', next: 'Next: ' };",
    );
  });
});

describe('A. Stage track (`ol.cm-flow`)', () => {
  const READY = [
    ['Vendor', 'Submitted', 'Revision 2 · 26 Aug', 'done'],
    ['Academic Reviewer', 'Approved', 'Prof. A. Menon · 27 Aug', 'done'],
    ['You', 'Publication decision', 'Waiting since 27 Aug', 'you'],
    ['Public catalogue', 'Listed', 'After you publish', 'next'],
  ] as const;

  it('CM-03’s band track: the stages, the gold step and “Your step”, the current stage', async () => {
    const drawn = excerpt('<div class="cm-idflow cm-flowwrap">', '</div>');
    expect(drawn).toContain('<ol class="cm-flow" aria-label="Where this submission is">');
    const { container } = render(
      <CmStageTrack
        placement="band"
        label="Where this submission is"
        steps={stepsOf(READY)}
        stateWords={STATE_WORDS}
        youLabel="Your step"
      />,
    );
    expectSameMarkup(container.firstElementChild!, fill(drawn, { D: { flow: flowOf(READY) } }));
    const list = screen.getByRole('list', { name: 'Where this submission is' });
    const current = within(list)
      .getAllByRole('listitem')
      .filter((item) => item.getAttribute('aria-current') === 'step');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent('Your step, now: YouPublication decision');
    expect(
      within(list).getAllByRole('listitem')[3]!.querySelector('.cm-step-dot'),
    ).toHaveTextContent('4');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('CM-08 detail: a returned correction — your step with the edit mark, the return in red', () => {
    const drawn = TEMPLATE.slice(
      TEMPLATE.indexOf('<div class="cm-idflow cm-flowwrap">', TEMPLATE.indexOf('cm-h-update')),
    );
    const track = drawn.slice(0, drawn.indexOf('</div>') + '</div>'.length);
    expect(track).toContain('<ol class="cm-flow" aria-label="Where this correction is">');
    const RETURNED = [
      ['You', 'Returned to you', 'Change it and send it again', 'you', '#cmi-edit'],
      ['Academic Reviewer', 'Academic review', 'Returned 26 Aug', 'back'],
      ['Super Admin', 'Release decision', 'After approval', 'next'],
      ['Everyone', 'Live', 'When released', 'next'],
    ] as const;
    const { container } = render(
      <CmStageTrack
        placement="band"
        label="Where this correction is"
        steps={stepsOf([
          ['You', 'Returned to you', 'Change it and send it again', 'you', 'edit'],
          ['Academic Reviewer', 'Academic review', 'Returned 26 Aug', 'back'],
          ['Super Admin', 'Release decision', 'After approval', 'next'],
          ['Everyone', 'Live', 'When released', 'next'],
        ])}
        stateWords={STATE_WORDS}
        youLabel="Your step"
      />,
    );
    expectSameMarkup(container.firstElementChild!, fill(track, { E: { flow: flowOf(RETURNED) } }));
    // The Content Manager's step is current even with a returned stage after it (the script's `curAt`).
    expect(container.querySelector('li[aria-current="step"]')).toHaveClass('is-you');
  });

  it('CM-08 list (mini, in a tracker card): no “Your step” badge; on hold is the current stage', () => {
    const track = excerpt('<div class="cm-trk-flow cm-flowwrap">', '</div>');
    expect(track).toContain(
      '<ol class="cm-flow cm-flow--mini" aria-label="Where this correction is">',
    );
    expect(track).not.toContain('cm-you');
    const HOLD = [
      ['You', 'Sent', '12 Aug', 'done'],
      ['Academic Reviewer', 'Approved', '14 Aug', 'done'],
      ['Super Admin', 'On hold', 'Since 20 Aug', 'held'],
      ['Everyone', 'Live', '2.0 stays live', 'next'],
    ] as const;
    const { container } = render(
      <CmStageTrack
        placement="tracker"
        mini
        label="Where this correction is"
        steps={stepsOf(HOLD)}
        stateWords={STATE_WORDS}
      />,
    );
    expectSameMarkup(container.firstElementChild!, fill(track, { r: { flow: flowOf(HOLD) } }));
    expect(container.querySelector('li[aria-current="step"]')).toHaveClass('is-held');
  });

  it('a withdrawn correction’s stages are closed; a finished one has no current stage; a stage without a date has no date line', () => {
    const { container } = render(
      <>
        <CmStageList
          label="Withdrawn"
          stateWords={STATE_WORDS}
          steps={stepsOf([
            ['You', 'Withdrawn', '', 'off'],
            ['Academic Reviewer', 'Academic review', 'Closed without a decision', 'off'],
          ])}
        />
        <CmStageList
          label="Released"
          stateWords={STATE_WORDS}
          steps={stepsOf([
            ['You', 'Sent', '28 Jul', 'done'],
            ['Everyone', 'Live', 'Version 1.1 since 5 Aug', 'done'],
          ])}
        />
      </>,
    );
    const [withdrawn, released] = screen.getAllByRole('list');
    const first = within(withdrawn!).getAllByRole('listitem')[0]!;
    expect(first.className).toBe('cm-step is-off');
    expect(first.querySelector('.cm-step-d')).toBeNull();
    expect(first.querySelector('.cm-step-dot path')?.getAttribute('d')).toBe(V3_ICON_PATHS.ended);
    expect(within(withdrawn!).queryAllByRole('listitem', { current: 'step' })).toHaveLength(0);
    expect(released!.querySelectorAll('[aria-current="step"]')).toHaveLength(0);
    expectV3ClassesOnly(container);
  });
});

describe('D. Version change (`span.cm-ver`)', () => {
  it('live → proposed (CM-01, CM-05), released (old → live), withdrawn (live → old), live alone', () => {
    const corr = excerpt(
      '<span class="cm-ver"><span class="cm-ver-live">{{ r.live }}</span>',
      '</span></span>',
    );
    const list = excerpt('<span class="cm-ver"><span class="{{ r.vaCls }}">', '</sc-if></span>');
    const alone = excerpt(
      '<span class="cm-ver"><span class="cm-ver-live">{{ P.verLive }}</span>',
      '</span></span>',
    );
    const { container } = render(
      <>
        <CmVersionChange
          from={{ text: '1.0 live', kind: 'live' }}
          to={{ text: '1.1 proposed', kind: 'new' }}
        />
        <CmVersionChange
          from={{ text: '1.0', kind: 'old' }}
          to={{ text: '1.1 live', kind: 'live' }}
        />
        <CmVersionChange
          from={{ text: '1.0 live', kind: 'live' }}
          to={{ text: '1.1 withdrawn', kind: 'old' }}
        />
        <CmVersionChange from={{ text: '1.2 live', kind: 'live' }} />
      </>,
    );
    const [proposed, released, withdrawn, live] = [...container.children];
    expectSameMarkup(proposed!, fill(corr, { r: { live: '1.0 live', next: '1.1 proposed' } }));
    expectSameMarkup(
      released!,
      fill(list, {
        r: { va: '1.0', vaCls: 'cm-ver-old', hasVb: true, vb: '1.1 live', vbCls: 'cm-ver-live' },
      }),
    );
    expectSameMarkup(
      withdrawn!,
      fill(list, {
        r: {
          va: '1.0 live',
          vaCls: 'cm-ver-live',
          hasVb: true,
          vb: '1.1 withdrawn',
          vbCls: 'cm-ver-old',
        },
      }),
    );
    expectSameMarkup(live!, fill(alone, { P: { verLive: '1.2 live' } }));
    expectV3ClassesOnly(container);
  });
});

describe('J. Identity band (`section.rb-id.cm-idband`)', () => {
  it('CM-03: eyebrow, H1, status line, “Go to decision” beside the text, four facts, the track', async () => {
    const drawn = excerpt(
      '<section class="rb-id cm-idband" aria-labelledby="cm-h-decision">',
      '</section>',
    );
    const facts = [
      { k: 'Formats', v: 'WEB · VR', cls: '' },
      { k: 'Learning outcomes', v: '3', cls: '' },
      { k: 'Version', v: '1.0', cls: '' },
      { k: 'Submission', v: 'Revision 2', cls: '' },
    ];
    const READY = [
      ['Vendor', 'Submitted', 'Revision 2 · 26 Aug', 'done'],
      ['Academic Reviewer', 'Approved', 'Prof. A. Menon · 27 Aug', 'done'],
      ['You', 'Publication decision', 'Waiting since 27 Aug', 'you'],
      ['Public catalogue', 'Listed', 'After you publish', 'next'],
    ] as const;
    const { container } = render(
      <main>
        <CmIdentityBand
          eyebrow="SUB-0077 · First publication"
          title="Conduction Through a Composite Wall"
          titleId="cm-h-decision"
          status={
            <>
              <StatusPill tone="info" size="lg">
                Ready to publish
              </StatusPill>
              <span>From Northline Simulation Studio</span>
              <CmCourseName code="ME ZG523" name="Thermodynamics & Heat Transfer" />
            </>
          }
          goTo={{ label: 'Go to decision', targetId: 'cm-panel' }}
          facts={facts.map((fact) => ({ term: fact.k, value: fact.v }))}
          track={
            <CmStageTrack
              placement="band"
              label="Where this submission is"
              steps={stepsOf(READY)}
              stateWords={STATE_WORDS}
              youLabel="Your step"
            />
          }
        />
      </main>,
    );
    const band = container.querySelector('section')!;
    expectSameMarkup(
      band,
      fill(drawn, {
        D: {
          over: 'SUB-0077 · First publication',
          name: 'Conduction Through a Composite Wall',
          stClsLg: 'xr-st xr-st--info rk-st-lg',
          stLabel: 'Ready to publish',
          vendor: 'Northline Simulation Studio',
          hasCode: true,
          code: 'ME ZG523',
          cname: 'Thermodynamics & Heat Transfer',
          facts,
          flow: flowOf(READY),
        },
      }),
    );
    expect(screen.getByRole('region', { name: 'Conduction Through a Composite Wall' })).toBe(band);
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('tabindex', '-1');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('CM-05: the record band — growing text, the actions and “Go to corrections”, the facts at the ends, the open correction above its mini track', async () => {
    const drawn = excerpt(
      '<section class="rb-id cm-idband" aria-labelledby="cm-h-published">',
      '</section>',
    );
    const facts = [
      { k: 'Course', v: 'CHE ZG513 · Process Instrumentation & Control', cls: '' },
      { k: 'Live since', v: '18 Jun 2026', cls: '' },
      { k: 'Formats', v: 'WEB · VR', cls: '' },
      { k: 'Corrections', v: 'UPD-0004 · On hold', cls: '' },
    ];
    const HOLD = [
      ['You', 'Sent', '12 Aug', 'done'],
      ['Academic Reviewer', 'Approved', '14 Aug', 'done'],
      ['Super Admin', 'On hold', 'Since 20 Aug', 'held'],
      ['Everyone', 'Live', '2.0 stays live', 'next'],
    ] as const;
    const { container } = render(
      <main>
        <CmIdentityBand
          variant="record"
          eyebrow="CHE ZG513 · Published experiment"
          title="Boiler Drum Level"
          titleId="cm-h-published"
          status={
            <>
              <StatusPill tone="ok" size="lg">
                Published
              </StatusPill>
              <CmVersionChange from={{ text: '2.0 live', kind: 'live' }} />
            </>
          }
          actions={
            <ButtonLink href="#cm-main" icon="externalLink">
              View the public page
            </ButtonLink>
          }
          goTo={{ label: 'Go to corrections', targetId: 'cm-pub-panel' }}
          facts={facts.map((fact) => ({ term: fact.k, value: fact.v }))}
          track={
            <CmIdentityTrack
              title="Correction in progress"
              status={
                <>
                  <StatusPill tone="paused">UPD-0004 · On hold</StatusPill>
                  <CmVersionChange
                    from={{ text: '2.0 live', kind: 'live' }}
                    to={{ text: '2.1 proposed', kind: 'new' }}
                  />
                </>
              }
            >
              <CmStageTrack
                mini
                label="Where the open correction is"
                steps={stepsOf(HOLD)}
                stateWords={STATE_WORDS}
              />
            </CmIdentityTrack>
          }
        />
      </main>,
    );
    expectSameMarkup(
      container.querySelector('section')!,
      fill(drawn, {
        P: {
          over: 'CHE ZG513 · Published experiment',
          name: 'Boiler Drum Level',
          verLive: '2.0 live',
          hasVendor: false,
          facts,
          hasTrack: true,
          trkStCls: 'xr-st xr-st--paused',
          trkId: 'UPD-0004',
          trkStLabel: 'On hold',
          trkVa: '2.0 live',
          trkVb: '2.1 proposed',
          flow: flowOf(HOLD),
        },
      }),
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('CM-08 detail: the date line and crumbs before the band, quiet facts, “Go to actions” focuses the panel heading', () => {
    const drawn = excerpt(
      '<section class="rb-id cm-idband" aria-labelledby="cm-h-update">',
      '<div class="rb-id-act">',
    );
    expect(drawn).toContain('<div class="rb-id-text cm-idtext">');
    expect(TEMPLATE).toContain('<dl class="cm-idfacts cm-idfacts--ends">');
    expect(TEMPLATE).toContain('<a class="rb-btn rk-goto" href="#cm-u-panel">Go to actions</a>');
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    const { container } = render(
      <main>
        <CmIdentityBand
          variant="record"
          breadcrumbs={<nav aria-label="Breadcrumb">Updates</nav>}
          date="Thursday 27 August 2026"
          eyebrow="UPD-0007 · Correction to a published experiment"
          title="Update to Induction Motor Loading"
          titleId="cm-h-update"
          status={
            <StatusPill tone="neutral" size="lg">
              Draft
            </StatusPill>
          }
          goTo={{ label: 'Go to actions', targetId: 'cm-u-panel', focusId: 'cm-u-panel-h' }}
          facts={[
            { term: 'Live version', value: '1.0, unchanged until released' },
            { term: 'Proposed', value: 'Not set yet', quiet: true },
          ]}
        />
        <aside id="cm-u-panel">
          <h2 id="cm-u-panel-h">Your update</h2>
        </aside>
      </main>,
    );
    expectV3ClassesOnly(container);
    const main = container.querySelector('main')!;
    expect([...main.children].map((child) => `${child.tagName} ${child.className}`)).toEqual([
      'NAV ',
      'P rb-eyebrow-date',
      'SECTION rb-id cm-idband',
      'ASIDE ',
    ]);
    expect(container.querySelector('.cm-idfacts')!.className).toBe('cm-idfacts cm-idfacts--ends');
    expect(container.querySelector('dd.is-quiet')).toHaveTextContent('Not set yet');
    expect(container.querySelector('.rb-id-act > a.rk-goto')).not.toBeNull();
    expect(fireEvent.click(screen.getByRole('link', { name: 'Go to actions' }))).toBe(false);
    expect(scroll).toHaveBeenCalledWith({ block: 'start' });
    expect(screen.getByRole('heading', { name: 'Your update' })).toHaveFocus();
  });
});

describe('F. Group head with count (`div.cm-grp-head`)', () => {
  it('CM-08 list sections (the count gold when it needs you); CM-01’s side card head', () => {
    const section = excerpt('<div class="cm-grp-head"><h2 class="rb-h2"', '</p></div>');
    const side = excerpt('<div class="cm-grp-head" style="margin-bottom: 8px">', '</p></div>');
    // The export spaces the side head inline: the product classes of V3P-14 in their place.
    expect(side).toContain('style="margin-bottom: 0"');
    const { container } = render(
      <>
        <CmGroupHead
          title="Need you"
          titleId="cm-upd-you"
          count="2"
          countYou
          note="Change it and send it, or withdraw it"
        />
        <CmGroupHead
          title="Closed"
          titleId="cm-upd-closed"
          count="1"
          note="Kept with their history"
        />
        <CmGroupHead
          variant="side"
          title="With others"
          titleId="cm-others-h"
          note="Nothing for you to do"
        />
      </>,
    );
    const [you, closed, others] = [...container.children];
    expectSameMarkup(
      you!,
      fill(section, {
        sec: {
          hid: 'cm-upd-you',
          t: 'Need you',
          nCls: 'cm-grp-n is-you',
          n: '2',
          note: 'Change it and send it, or withdraw it',
        },
      }),
    );
    expectSameMarkup(
      closed!,
      fill(section, {
        sec: {
          hid: 'cm-upd-closed',
          t: 'Closed',
          nCls: 'cm-grp-n',
          n: '1',
          note: 'Kept with their history',
        },
      }),
    );
    expectSameMarkup(
      others!,
      fill(side, {})
        .replace(
          '<div class="cm-grp-head" style="margin-bottom: 8px">',
          '<div class="cm-grp-head rk-x-grp-head-side">',
        )
        .replace(
          '<h2 class="cm-sidecard-t" id="cm-others-h" style="margin-bottom: 0">',
          '<h2 class="cm-sidecard-t rk-x-sidecard-t-flush" id="cm-others-h">',
        ),
    );
    expectV3ClassesOnly(container);
  });
});

describe('7. Small pieces', () => {
  it('the course name, the in-cell labels, the Changed tags, Your step and the quoted notes', async () => {
    const course = excerpt(
      '<span class="cm-fmtname"><sc-if value="{{ r.hasCode }}"',
      '{{ r.cname }}</span>',
    );
    const changed = excerpt('<span class="cm-tag">Changed</span>', '</span>');
    const unsaved = excerpt('<span class="cm-tag" id="{{ r.cid }}">', '</span>');
    const quote = excerpt('<blockquote class="cm-orow-q">', '</blockquote>');
    const note = excerpt('<blockquote class="cm-orow-q cm-trk-note">', '</blockquote>');
    expect(TEMPLATE).toContain('<span class="cm-inlabel">How it runs</span>');
    expect(TEMPLATE).toContain(
      '<span class="rk-label cm-inlabel" aria-hidden="true">Platform course code</span>',
    );
    expect(TEMPLATE).toContain('<span class="cm-you">Your step</span>');
    const { container } = render(
      <div>
        <CmCourseName code="ME ZG523" name="Thermodynamics & Heat Transfer" />
        <CmCourseName code={null} name="Fluid Mechanics" />
        <CmInLabel>How it runs</CmInLabel>
        <CmInLabel field>Platform course code</CmInLabel>
        <CmTag>Changed</CmTag>
        <CmTag id="cm-k-c-thermo" icon="edit">
          Changed — not saved yet
        </CmTag>
        <CmYouBadge>Your step</CmYouBadge>
        <CmQuote
          quote="“The proposed description says slip falls as the load rises. It rises.…”"
          by="Prof. A. Menon, Academic Reviewer · 26 Aug"
        />
        <CmQuote
          tracker
          quote="“The 2.1 web build still shows the old control diagram on its first screen.”"
          by="Arjun Mehta, Super Admin · 20 Aug"
        />
      </div>,
    );
    const [coded, plain, label, fieldLabel, tag, unsavedTag, you, rowQuote, cardNote] = [
      ...container.firstElementChild!.children,
    ];
    expectSameMarkup(
      coded!,
      fill(course, {
        r: { hasCode: true, code: 'ME ZG523', cname: 'Thermodynamics & Heat Transfer' },
      }),
    );
    expectSameMarkup(plain!, fill(course, { r: { hasCode: false, cname: 'Fluid Mechanics' } }));
    expectSameMarkup(label!, '<span class="cm-inlabel">How it runs</span>');
    expectSameMarkup(
      fieldLabel!,
      '<span class="rk-label cm-inlabel" aria-hidden="true">Platform course code</span>',
    );
    expectSameMarkup(tag!, changed);
    expectSameMarkup(unsavedTag!, fill(unsaved, { r: { cid: 'cm-k-c-thermo' } }));
    expectSameMarkup(you!, '<span class="cm-you">Your step</span>');
    expectSameMarkup(
      rowQuote!,
      fill(quote, {
        r: {
          quote: '“The proposed description says slip falls as the load rises. It rises.…”',
          who: 'Prof. A. Menon, Academic Reviewer · 26 Aug',
        },
      }),
    );
    expectSameMarkup(
      cardNote!,
      fill(note, {
        r: {
          note: '“The 2.1 web build still shows the old control diagram on its first screen.”',
          noteBy: 'Arjun Mehta, Super Admin · 20 Aug',
        },
      }),
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('the full-width aside actions on the kit button and link (`cm-wide`)', async () => {
    const navy = excerpt('<a class="rb-btn rb-btn--navy cm-wide"', '</a>');
    const publicPage = excerpt('<a class="rb-btn cm-wide" href="#cm-main" data-to="PU-06"', '</a>');
    const edit = excerpt(
      '<button type="button" class="rb-btn cm-wide" id="cm-p-editcat"',
      '</button>',
    );
    const withdraw = excerpt(
      '<button type="button" class="rb-btn rb-btn--ghost cm-wide"',
      '</button>',
    );
    const onEdit = vi.fn();
    const { container } = render(
      <div>
        <CmWideLink variant="navy" href="#cm-main">
          Open the published experiment
        </CmWideLink>
        <CmWideLink href="#cm-main" icon="externalLink">
          View the public page
        </CmWideLink>
        <CmWideButton id="cm-p-editcat" icon="edit" onClick={onEdit}>
          Edit catalogue details
        </CmWideButton>
        <CmWideButton variant="ghost" id="cm-u-wd">
          Withdraw update
        </CmWideButton>
      </div>,
    );
    const [published, page, editButton, withdrawButton] = [
      ...container.firstElementChild!.children,
    ];
    expectSameMarkup(published!, fill(navy, {}));
    expectSameMarkup(page!, fill(publicPage, {}));
    expectSameMarkup(editButton!, fill(edit, {}));
    expectSameMarkup(withdrawButton!, fill(withdraw, {}));
    fireEvent.click(screen.getByRole('button', { name: 'Edit catalogue details' }));
    expect(onEdit).toHaveBeenCalledOnce();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('the format badges the export writes with `margin-top: 0` (`rk-x-fmts-flush`, V3P-14)', async () => {
    const available = excerpt(
      '<span class="rk-fmts" style="margin-top: 0" aria-label="{{ D.fmtAria }}">',
      '</sc-for></span>',
    );
    const row = excerpt(
      '<span class="rk-fmts" style="margin-top: 0" aria-label="{{ r.fmtAria }}">',
      '</sc-for></span>',
    );
    const { container } = render(
      <div>
        <CmFormatBadges formats={['VR', 'WEB']} label="Formats: WEB, VR" />
        <CmFormatBadges formats={['MR', 'AR', 'WEB']} label="Formats: WEB, AR, MR" />
      </div>,
    );
    const [first, second] = [...container.firstElementChild!.children];
    // The export's `aria-label` on a plain `span` is visually hidden words (ADR-0010); its inline
    // `margin-top: 0` is the product class of V3P-14.
    const asProduct = (html: string, label: string) =>
      html.replace(
        / style="margin-top: 0" aria-label="[^"]*">/,
        ` class="rk-fmts rk-x-fmts-flush"><span class="xr-sr">${label}</span>`,
      );
    expectSameMarkup(
      first!,
      asProduct(fill(available, { D: { fmts: ['WEB', 'VR'] } }), 'Formats: WEB, VR').replace(
        '<span class="rk-fmts" class=',
        '<span class=',
      ),
    );
    expectSameMarkup(
      second!,
      asProduct(fill(row, { r: { fmts: ['WEB', 'AR', 'MR'] } }), 'Formats: WEB, AR, MR').replace(
        '<span class="rk-fmts" class=',
        '<span class=',
      ),
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});
