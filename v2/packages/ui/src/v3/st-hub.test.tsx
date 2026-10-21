/**
 * What the Student hub group alone draws (owner-approved export design/v3-refined-b/roles/ST-v1,
 * `project/StudentFinal.dc.html`, `project/v3-student-final.css`): the Overview's main card, its
 * sections and format rows, the aside's sections with the "Next step" tag; ST-06's reading list;
 * ST-07's format chooser; ST-10's card head; the ST-08 / ST-09 launch surface and its "About"
 * aside. Each piece is rendered with sample values and compared with the export's template filled
 * the way its script fills it (`sc-for`, `sc-if`, `{{ … }}`, the `sti-*` sprite inlined from its
 * own symbols); then the class contract, the behaviour, the identifier rule and axe. No stage
 * tracker is drawn (lead decision 1).
 *
 * Normalised on both sides, each for a recorded reason (as `st.test.tsx`): the export's runtime
 * wiring (event bindings), an attribute bound to nothing (dropped, as the runtime drops it),
 * `aria-hidden` on a decorative `svg` and the order of class tokens.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectNoInternalReferences,
  expectV3ClassesOnly,
  stExportText,
  v3Canonical,
} from '../testing/index.js';
import { ButtonLink } from './actions.js';
import { Notice } from './notices.js';
import { StAside, StOffRows, StOutcomes, StOverview, StShelfHead, StSubheading } from './st.js';
import {
  StChooser,
  StChooserCard,
  StChooserCards,
  StChooserOff,
  StHubAbout,
  StHubFormatRows,
  StHubMain,
  StHubNextTag,
  StHubProgressCard,
  StHubSection,
  StHubSideSection,
  StLaunchAbout,
  StLaunchCard,
  StLaunchDevice,
  StLaunchFoot,
  StLaunchGo,
  StLaunchPage,
  StLaunchSetup,
  StResourceCard,
  StResourceCount,
  StResourceRow,
} from './st-hub.js';

const MAIN = stExportText('StudentFinal.dc.html');
const TEMPLATE = MAIN.slice(0, MAIN.indexOf('<script type="text/x-dc"'));
const SCRIPT = MAIN.slice(MAIN.indexOf('<script type="text/x-dc"'));

/** The export's sprite (`sti-*`), by id. */
const SYMBOLS = new Map(
  [...MAIN.matchAll(/<symbol id="(sti-[\w-]+)" viewBox="0 0 24 24"><path d="([^"]+)"/g)].map(
    (match) => [match[1] ?? '', match[2] ?? ''] as const,
  ),
);

type Scope = Readonly<Record<string, unknown>>;

function lookup(scope: Scope, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    return value && typeof value === 'object' ? (value as Scope)[key] : undefined;
  }, scope);
}

/** `{{ name }}` replaced; an attribute bound to nothing or `false` dropped, `true` written bare. */
function substitute(html: string, scope: Scope): string {
  return html
    .replace(/ ([\w-]+)="\{\{ ([\w.]+) \}\}"/g, (_whole, name: string, path: string) => {
      const value = lookup(scope, path);
      if (value === undefined || value === null || value === false || value === '') return '';
      return value === true ? ` ${name}=""` : ` ${name}="${String(value)}"`;
    })
    .replace(/\{\{ ([\w.]+) \}\}/g, (_whole, path: string) => String(lookup(scope, path) ?? ''));
}

/** An excerpt of the template filled as its runtime fills it (see the file's head). */
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
    .replace(/<use href="#(sti-[\w-]+)"><\/use>/g, (whole, id: string) => {
      const path = SYMBOLS.get(id);
      return path ? `<path d="${path}"></path>` : whole;
    });
}

/** The template from `start` to the end marker `end` after it (inclusive). */
function excerpt(start: string, end: string, after = 0): string {
  const from = TEMPLATE.indexOf(start, after);
  expect(from, `the export draws ${start}`).toBeGreaterThanOrEqual(0);
  const to = TEMPLATE.indexOf(end, from + start.length);
  expect(to, `the export closes ${start} with ${end}`).toBeGreaterThan(from);
  return TEMPLATE.slice(from, to + end.length);
}

/** The template's offset of a section marker, to start an excerpt inside one screen. */
function at(marker: string): number {
  const index = TEMPLATE.indexOf(marker);
  expect(index, `the export marks ${marker}`).toBeGreaterThanOrEqual(0);
  return index;
}

function sortedClasses(html: string): string {
  return html.replace(/ class="([^"]*)"/g, (_whole, value: string) => {
    return ` class="${value.split(/\s+/).filter(Boolean).sort().join(' ')}"`;
  });
}

/** Text between tags without the template's indentation (the runtime renders it as one line). */
function withoutLayout(html: string): string {
  return html.replace(/>\s+</g, '><').trim();
}

function comparable(html: string): string {
  return sortedClasses(v3Canonical(withoutLayout(html)));
}

function expectSameMarkup(element: Element, expected: string) {
  expect(comparable(element.outerHTML)).toBe(comparable(expected));
}

/** Rendered inside a V3 root, as the shell renders the pages. */
function inRoot(ui: ReactNode) {
  return render(<div className="xr rb">{ui}</div>);
}

/** Student words never carry an internal record reference (lead decision 3, the identifier rule). */
const STUDENT_REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|ATT|ASMT)-\d+/;

function expectNoStudentReferences(root: Element) {
  expectNoInternalReferences(root);
  expect(root.textContent ?? '').not.toMatch(STUDENT_REFERENCE);
  for (const element of [root, ...root.querySelectorAll('*')]) {
    for (const name of ['aria-label', 'title', 'alt']) {
      expect(element.getAttribute(name) ?? '').not.toMatch(STUDENT_REFERENCE);
    }
  }
}

const CHIP_ON = { fmtCls: 'xr-fmt sv-fmt sv-fmt--on', hasGlyph: true, glyph: 'sti-check' };

describe('ST-05 Overview (`HB.isOverview`, `overviewVM`)', () => {
  it('about: the description, the area and the BITS course code', () => {
    const drawn = excerpt('<section class="sv-sec" aria-labelledby="sv-about-h">', '</section>');
    const { container } = inRoot(
      <StHubAbout
        title="About this experiment"
        titleId="sv-about-h"
        description="Vary flow rates and inlet temperatures."
        area="Mechanical & Manufacturing"
        code={{ label: 'BITS course code', value: 'ME ZG523' }}
      />,
    );
    expectSameMarkup(
      container.querySelector('section')!,
      fill(drawn, {
        HB: {
          desc: 'Vary flow rates and inlet temperatures.',
          area: 'Mechanical &amp; Manufacturing',
          bits: 'ME ZG523',
        },
      }),
    );
    expect(screen.getByRole('region', { name: 'About this experiment' })).toBeTruthy();
    expectV3ClassesOnly(container);
  });

  it('what you learn: a section head (`sv-sec-h`, `sv-h2`, note) over the flat outcomes', () => {
    const drawn = excerpt('<section class="sv-sec" aria-labelledby="sv-lo-h">', '</section>');
    const outcomes = ['Determine log mean temperature difference', 'Compare arrangements'];
    const { container } = inRoot(
      <StHubSection title="What you’ll learn" titleId="sv-lo-h" note="The same in every format">
        <StOutcomes flat items={outcomes} />
      </StHubSection>,
    );
    expectSameMarkup(container.querySelector('section')!, fill(drawn, { HB: { outcomes } }));
    expectV3ClassesOnly(container);
  });

  it('formats and your progress: the rows with the next step, then those not available', () => {
    const drawn = excerpt('<section class="sv-sec" aria-labelledby="sv-fm-h">', '</section>');
    const { container } = inRoot(
      <StHubSection
        title="Formats and your progress"
        titleId="sv-fm-h"
        note="Each format has its own progress"
      >
        <StSubheading id="sv-fm-mine">Your formats</StSubheading>
        <StHubFormatRows
          labelledBy="sv-fm-mine"
          rows={[
            {
              key: 'web',
              chip: { code: 'WEB', kind: 'on' },
              name: 'Browser',
              access: 'Available to you',
              next: 'Next step',
              status: { tone: 'warn', words: 'In progress' },
              facts: 'Last saved 12 Oct 2026, 11:20',
              action: {
                href: '/web',
                label: 'Continue WEB',
                ariaLabel: 'Continue WEB, Shell-and-Tube Heat Exchanger',
                primary: true,
              },
            },
            {
              key: 'vr',
              chip: { code: 'VR', kind: 'held', glyph: 'pauseBars' },
              name: 'Virtual reality',
              access: 'Paused',
              status: { tone: 'neutral', words: 'Not started' },
            },
          ]}
        />
        <StSubheading id="sv-fm-off">Not available to you</StSubheading>
        <StOffRows
          labelledBy="sv-fm-off"
          rows={[
            {
              code: 'AR',
              kind: 'pub',
              name: 'Augmented reality',
              reason: 'Published for this experiment, not included in your institution’s access',
            },
          ]}
        />
      </StHubSection>,
    );
    expectSameMarkup(
      container.querySelector('section')!,
      fill(drawn, {
        HO: {
          mine: [
            {
              ...CHIP_ON,
              cls: 'sv-frow is-next',
              code: 'WEB',
              name: 'Browser',
              access: 'Available to you',
              isNext: true,
              pillCls: 'xr-st xr-st--warn',
              pill: 'In progress',
              hasFacts: true,
              facts: 'Last saved 12 Oct 2026, 11:20',
              hasAct: true,
              act: {
                cls: 'rb-btn rb-btn--primary',
                href: '/web',
                aria: 'Continue WEB, Shell-and-Tube Heat Exchanger',
                label: 'Continue WEB',
              },
            },
            {
              fmtCls: 'xr-fmt sv-fmt sv-fmt--held',
              hasGlyph: true,
              glyph: 'sti-bars2',
              cls: 'sv-frow',
              code: 'VR',
              name: 'Virtual reality',
              access: 'Paused',
              pillCls: 'xr-st',
              pill: 'Not started',
            },
          ],
          off: [
            {
              fmtCls: 'xr-fmt sv-fmt xr-fmt--pub',
              code: 'AR',
              name: 'Augmented reality',
              reason: 'Published for this experiment, not included in your institution’s access',
            },
          ],
        },
      }),
    );
    // One list per sub-heading, named by it; the row's fuller action name.
    const mine = screen.getByRole('list', { name: 'Your formats' });
    expect(within(mine).getByRole('link')).toHaveAccessibleName(
      'Continue WEB, Shell-and-Tube Heat Exchanger',
    );
    expect(mine.querySelectorAll('.sv-tag')).toHaveLength(1);
    expectV3ClassesOnly(container);
  });

  it('the aside’s sections: the "Next step" tag, one sentence, the action (`sv-side-btn`)', () => {
    const resources = excerpt('<section class="{{ HO.res.cls }}"', '</section>');
    const assessment = excerpt('<section class="{{ HO.as.cls }}"', '</section>');
    const { container } = inRoot(
      <StAside as="div">
        <StHubSideSection
          title="Learning resources"
          titleId="sv-res-h"
          next="Next step"
          description="None opened yet."
          action={{
            href: '/resources',
            label: 'Open resources',
            ariaLabel: 'Open resources, Shell-and-Tube Heat Exchanger',
            primary: true,
          }}
        />
        <StHubSideSection
          title="Assessment"
          titleId="sv-as-h"
          description="Your faculty hasn’t set an assessment for this experiment yet."
        />
      </StAside>,
    );
    expect(
      container
        .querySelector('.sv-ov-side')!
        .outerHTML.startsWith('<div class="sv-card sv-ov-side">'),
    ).toBe(true);
    const [first, second] = container.querySelectorAll('section');
    // The per-resource rows (`ul.sv-rlist`) are left out: no read holds them on the Overview.
    expectSameMarkup(
      first!,
      fill(resources, {
        HO: {
          res: {
            cls: 'sv-sec sv-side-sec is-next',
            isNext: true,
            d: 'None opened yet.',
            items: [],
            hasAct: true,
            act: {
              cls: 'rb-btn rb-btn--primary sv-side-btn',
              href: '/resources',
              aria: 'Open resources, Shell-and-Tube Heat Exchanger',
              label: 'Open resources',
            },
          },
        },
      }).replace(/<ul class="sv-rlist">\s*<\/ul>/, ''),
    );
    expectSameMarkup(
      second!,
      fill(assessment, {
        HO: {
          as: {
            cls: 'sv-sec sv-side-sec',
            d: 'Your faculty hasn’t set an assessment for this experiment yet.',
          },
        },
      }),
    );
    expectV3ClassesOnly(container);
  });

  it('the main card and the layout (`sv-ov`, `sv-ov-main`); the tag alone', () => {
    const { container } = inRoot(
      <StOverview>
        <StHubMain>
          <p>main</p>
        </StHubMain>
        <StAside as="div">
          <StHubNextTag>Next step</StHubNextTag>
        </StAside>
      </StOverview>,
    );
    expect(TEMPLATE).toContain('<div class="sv-ov">\n        <div class="sv-card sv-ov-main">');
    expect(
      container.querySelector('.sv-ov > .sv-card.sv-ov-main + .sv-card.sv-ov-side'),
    ).toBeTruthy();
    expect(container.querySelector('span.sv-tag')).toHaveTextContent('Next step');
    expectV3ClassesOnly(container);
  });
});

describe('ST-06 Resources (`HB.isResources`, `resVM`)', () => {
  it('the card head, the held line and a row in each status', () => {
    const head = excerpt('<div class="sv-card-h"><h2 class="sv-sec-t" id="st-res-h"', '</div>');
    const held = excerpt('<p class="sv-res-held">', '</p>');
    const row = excerpt('<li class="sv-li">', '</li>', at('HB.isResources'));
    const onOpen = vi.fn();
    const { container } = inRoot(
      <StResourceCard
        title="Resources"
        titleId="st-res-h"
        note="3 resources · each opens in a new tab"
        held="They open when you have a licence."
      >
        <ul className="sv-list">
          <StResourceRow
            icon="documentText"
            title="Lab brief"
            kind="PDF document"
            size="6 pages"
            statusId="st-res-st-1"
            status={{ kind: 'opened', words: 'Opened 12 Oct 2026, 09:40' }}
            action={{
              label: 'Open',
              ariaLabel: 'Open Lab brief in a new tab',
              busy: false,
              onOpen,
            }}
          />
          <StResourceRow
            icon="globe"
            title="Pre-lab reading"
            kind="Web page"
            size="About 10 minutes"
            statusId="st-res-st-2"
            status={{ kind: 'failed', words: 'It didn’t open. Nothing was lost — try again.' }}
            action={{
              label: 'Try again',
              ariaLabel: 'Try opening Pre-lab reading in a new tab',
              busy: false,
              onOpen,
            }}
          />
          <StResourceRow
            icon="spreadsheet"
            title="Readings sheet"
            kind="Spreadsheet"
            size="1 sheet"
            statusId="st-res-st-3"
            status={{ kind: 'busy', words: 'Opening…' }}
            action={{
              label: 'Open',
              ariaLabel: 'Open Readings sheet in a new tab',
              busy: true,
              onOpen,
            }}
          />
          <StResourceRow
            icon="documentText"
            title="Held"
            kind="PDF document"
            size="2 pages"
            statusId="st-res-st-4"
            status={{ kind: 'not-opened', words: 'Not opened yet' }}
          />
        </ul>
      </StResourceCard>,
    );
    const cardNode = container.querySelector('section.sv-card.sv-res')!;
    expect(cardNode).toHaveAttribute('aria-labelledby', 'st-res-h');
    expectSameMarkup(
      cardNode.querySelector('.sv-card-h')!,
      fill(head, { RS: { note: '3 resources · each opens in a new tab' } }),
    );
    expectSameMarkup(
      cardNode.querySelector('.sv-res-held')!,
      fill(held, { RS: { heldText: 'They open when you have a licence.' } }),
    );
    const rows = cardNode.querySelectorAll('li.sv-li');
    const r = (over: Record<string, unknown>) => ({
      r: {
        isNot: false,
        isOpened: false,
        isBusy: false,
        isFailed: false,
        canOpen: true,
        ...over,
      },
    });
    expectSameMarkup(
      rows[0]!,
      fill(
        row,
        r({
          ico: 'sti-doc',
          t: 'Lab brief',
          kind: 'PDF document',
          size: '6 pages',
          stId: 'st-res-st-1',
          isOpened: true,
          openedText: 'Opened 12 Oct 2026, 09:40',
          aria: 'Open Lab brief in a new tab',
          btn: 'Open',
        }),
      ),
    );
    expectSameMarkup(
      rows[1]!,
      fill(
        row,
        r({
          ico: 'sti-web',
          t: 'Pre-lab reading',
          kind: 'Web page',
          size: 'About 10 minutes',
          stId: 'st-res-st-2',
          isFailed: true,
          aria: 'Try opening Pre-lab reading in a new tab',
          btn: 'Try again',
        }),
      ),
    );
    expectSameMarkup(
      rows[2]!,
      fill(
        row,
        r({
          ico: 'sti-sheet',
          t: 'Readings sheet',
          kind: 'Spreadsheet',
          size: '1 sheet',
          stId: 'st-res-st-3',
          isBusy: true,
          aria: 'Open Readings sheet in a new tab',
          btn: 'Open',
        }),
      ),
    );
    expectSameMarkup(
      rows[3]!,
      fill(
        row,
        r({
          ico: 'sti-doc',
          t: 'Held',
          kind: 'PDF document',
          size: '2 pages',
          stId: 'st-res-st-4',
          isNot: true,
          canOpen: false,
        }),
      ),
    );
    // Busy: the button is disabled; the status region is a focus target.
    expect(within(rows[2] as HTMLElement).getByRole('button')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Open Lab brief in a new tab' }));
    expect(onOpen).toHaveBeenCalledOnce();
    expect(rows[0]!.querySelector('.sv-res-st')).toHaveAttribute('tabindex', '-1');
    expectV3ClassesOnly(container);
  });

  it('the aside’s count (`sv-res-count`)', () => {
    expect(TEMPLATE).toContain('<p class="sv-res-count">{{ RS.openedText }}</p>');
    const { container } = inRoot(<StResourceCount>1 of 3 opened</StResourceCount>);
    expect(container.innerHTML).toBe(
      '<div class="xr rb"><p class="sv-res-count">1 of 3 opened</p></div>',
    );
  });
});

describe('ST-07 Simulation (`HB.isSim`, `simVM`)', () => {
  it('the chooser: its head, a card per format, the formats not available', () => {
    const drawn = excerpt('<section class="sv-chooser" aria-labelledby="st-fr-h">', '</section>');
    const { container } = inRoot(
      <StChooser labelledBy="st-fr-h">
        <StShelfHead
          title="Choose a format"
          titleId="st-fr-h"
          note="Formats come from your institution’s access. Each one has its own progress."
        />
        <StChooserCards label="Your formats">
          <StChooserCard
            chip={{ code: 'WEB', kind: 'on' }}
            name="Browser"
            titleId="st-fc-web"
            next="Next step"
            access="Available to you"
            need="Runs in your browser on a laptop or desktop."
            status={{ tone: 'warn', words: 'In progress' }}
            facts={['Last saved 12 Oct 2026, 11:20']}
            actions={[
              {
                key: 'continue',
                href: '/web',
                label: 'Continue WEB',
                ariaLabel: 'Continue WEB, Shell-and-Tube Heat Exchanger',
                primary: true,
              },
            ]}
          />
          <StChooserCard
            chip={{ code: 'VR', kind: 'held', glyph: 'alertCircle' }}
            name="Virtual reality"
            titleId="st-fc-vr"
            access="Not available right now"
            need="Runs on your authorised VR headset."
            device="Your headset: ME lab VR headset"
            status={{ tone: 'neutral', words: 'Not started' }}
            why="VR can’t be used at the moment. WEB still opens."
          />
        </StChooserCards>
        <StChooserOff>
          <StSubheading id="st-fr-off">Not available to you</StSubheading>
          <StOffRows
            labelledBy="st-fr-off"
            rows={[
              {
                code: 'MR',
                kind: 'none',
                name: 'Mixed reality',
                reason: 'Not published for this experiment',
              },
            ]}
          />
        </StChooserOff>
      </StChooser>,
    );
    expectSameMarkup(
      container.querySelector('section.sv-chooser')!,
      fill(drawn, {
        SM: {
          note: 'Formats come from your institution’s access. Each one has its own progress.',
          cards: [
            {
              ...CHIP_ON,
              cls: 'sv-card sv-fcard is-next',
              hid: 'st-fc-web',
              code: 'WEB',
              name: 'Browser',
              isNext: true,
              access: 'Available to you',
              need: 'Runs in your browser on a laptop or desktop.',
              pillCls: 'xr-st xr-st--warn',
              pill: 'In progress',
              hasFacts: true,
              facts: ['Last saved 12 Oct 2026, 11:20'],
              hasActs: true,
              acts: [
                {
                  cls: 'rb-btn rb-btn--primary',
                  href: '/web',
                  aria: 'Continue WEB, Shell-and-Tube Heat Exchanger',
                  label: 'Continue WEB',
                },
              ],
            },
            {
              fmtCls: 'xr-fmt sv-fmt sv-fmt--held',
              hasGlyph: true,
              glyph: 'sti-alert',
              cls: 'sv-card sv-fcard',
              hid: 'st-fc-vr',
              code: 'VR',
              name: 'Virtual reality',
              access: 'Not available right now',
              need: 'Runs on your authorised VR headset.',
              hasDevice: true,
              device: 'ME lab VR headset',
              pillCls: 'xr-st',
              pill: 'Not started',
              hasWhy: true,
              why: 'VR can’t be used at the moment. WEB still opens.',
            },
          ],
          off: [
            {
              fmtCls: 'xr-fmt sv-fmt xr-fmt--none',
              code: 'MR',
              name: 'Mixed reality',
              reason: 'Not published for this experiment',
            },
          ],
        },
      }),
    );
    // Each card is named by its title; the export draws no stage tracker on the product's cards.
    const cardNode = container.querySelector('li.sv-fcard')!;
    expect(cardNode).toHaveAttribute('aria-labelledby', 'st-fc-web');
    expect(container.querySelector('#st-fc-web')).toHaveTextContent('Browser (WEB)');
    expect(container.querySelector('.sv-steps, .sv-fcard-stages')).toBeNull();
    expectV3ClassesOnly(container);
  });
});

describe('ST-10 Progress (`HB.isPT`, `progTabVM`)', () => {
  it('the card head: the title, the intro under it, the grant line beside it', () => {
    const drawn = excerpt(
      '<div class="sv-card-h"><div><h2 class="sv-sec-t" id="st-fr-h">',
      '{{ PT.exp.given }}</p></div>',
    );
    const { container } = inRoot(
      <StHubProgressCard
        title="Your progress, format by format"
        titleId="st-fr-h"
        intro="Each format has its own progress, with no overall percentage. Opening resources isn’t counted here."
        note="Given by your institution"
      >
        <p>table</p>
      </StHubProgressCard>,
    );
    const cardNode = container.querySelector('section.sv-card.sv-ptab')!;
    expect(cardNode).toHaveAttribute('aria-labelledby', 'st-fr-h');
    expect(TEMPLATE).toContain('<section class="sv-card sv-ptab" aria-labelledby="st-fr-h">');
    expectSameMarkup(
      cardNode.querySelector('.sv-card-h')!,
      fill(drawn, { PT: { exp: { given: 'Given by your institution' } } }),
    );
    expectV3ClassesOnly(container);
  });
});

describe('ST-08 / ST-09 format pages (`is.fpage`, `fpageVM`)', () => {
  const launchDrawn = () => excerpt('<section class="sv-card sv-launch"', '</section>');
  const foot = (
    <StLaunchFoot
      lead="Something not working?"
      text="Reporting it doesn’t affect your progress."
      report={{ href: '/student/help/report', label: 'Report a problem' }}
    />
  );
  const FP = { report: { href: '/student/help/report' } };

  it('WEB not started: the title, the sentence, the error notice, the large button and its hint', () => {
    const onLaunch = vi.fn();
    const { container } = inRoot(
      <StLaunchCard
        title="Start the WEB simulation"
        titleId="st-launch-t"
        description="Runs in your browser in a new tab. This page keeps your place."
        foot={foot}
      >
        <Notice
          tone="warn"
          icon="alertCircle"
          role="alert"
          className="sv-launch-err"
          id="st-launch-err"
          title="The simulation didn’t open"
        >
          Nothing was lost. Try again, or report a problem if it keeps happening.
        </Notice>
        <StLaunchGo
          action={{ kind: 'button', id: 'st-launch-go', label: 'Try again', busy: false, onLaunch }}
          hint={{ text: 'Opens in a new tab' }}
        />
      </StLaunchCard>,
    );
    expectSameMarkup(
      container.querySelector('section.sv-launch')!,
      fill(launchDrawn(), {
        FP: {
          ...FP,
          h2: 'Start the WEB simulation',
          d: 'Runs in your browser in a new tab. This page keeps your place.',
          fail: true,
          hasGo: true,
          goIsBtn: true,
          busyAria: 'false',
          goLabel: 'Try again',
          hasHint: true,
          hint: 'Opens in a new tab',
        },
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onLaunch).toHaveBeenCalledOnce();
    expect(screen.getByRole('alert')).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('region', { name: 'Start the WEB simulation' })).toBeTruthy();
    expectV3ClassesOnly(container);
  });

  it('while launching the button is busy and disabled, with its busy words', () => {
    inRoot(
      <StLaunchGo
        action={{
          kind: 'button',
          label: 'Opening the simulation…',
          busy: true,
          onLaunch: () => undefined,
        }}
      />,
    );
    const button = screen.getByRole('button', { name: 'Opening the simulation…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(SCRIPT).toContain("V.goLabel = busy ? 'Opening the simulation…'");
  });

  it('completed: the feedback link (gold, large), or "See your feedback" (`hasSecond`)', () => {
    const { container } = inRoot(
      <>
        <StLaunchCard
          title="You’ve completed WEB"
          titleId="st-launch-t"
          description="Tell us."
          foot={foot}
        >
          <StLaunchGo action={{ kind: 'link', href: '/fb', label: 'Give feedback on WEB' }} />
        </StLaunchCard>
        <StLaunchCard
          title="You’ve completed VR"
          titleId="st-launch-v"
          description="Thank you."
          foot={foot}
        >
          <StLaunchGo
            action={{ kind: 'link', href: '/fb', label: 'See your feedback', primary: false }}
          />
        </StLaunchCard>
      </>,
    );
    const [first, second] = container.querySelectorAll('section.sv-launch');
    expectSameMarkup(
      first!,
      fill(launchDrawn(), {
        FP: {
          ...FP,
          h2: 'You’ve completed WEB',
          d: 'Tell us.',
          hasGo: true,
          goIsLink: true,
          goLabel: 'Give feedback on WEB',
          goLink: { href: '/fb' },
        },
      }),
    );
    expectSameMarkup(
      second!,
      fill(launchDrawn(), {
        FP: {
          ...FP,
          h2: 'You’ve completed VR',
          d: 'Thank you.',
          hasSecond: true,
          second: { href: '/fb', label: 'See your feedback' },
        },
      })
        .replace('id="st-launch-t"', 'id="st-launch-v"')
        .replace('aria-labelledby="st-launch-t"', 'aria-labelledby="st-launch-v"'),
    );
  });

  it('VR not started: the authorised headset, the setup steps behind their disclosure', () => {
    const onToggle = vi.fn();
    const steps = [
      {
        key: '1',
        title: 'Use your authorised VR headset.',
        detail: 'It is shown under My device.',
      },
      {
        key: '2',
        title: 'Work through the experiment on the headset.',
        detail: 'Your sessions are reported here.',
      },
    ];
    const { container } = inRoot(
      <StLaunchCard
        title="Set up VR"
        titleId="st-launch-t"
        description="Nothing has been reported from a headset yet. Follow the setup steps to start."
        sections={
          <>
            <StLaunchDevice
              label="Your authorised headset"
              device="ME lab VR headset, asset tag GIT-VR-03"
              link={{ href: '/student/device', label: 'My device' }}
            />
            <StLaunchSetup
              open
              label="Hide setup steps"
              stepsId="st-setup"
              steps={steps}
              onToggle={onToggle}
            />
          </>
        }
        foot={foot}
      />,
    );
    expectSameMarkup(
      container.querySelector('section.sv-launch')!,
      fill(launchDrawn(), {
        FP: {
          ...FP,
          h2: 'Set up VR',
          d: 'Nothing has been reported from a headset yet. Follow the setup steps to start.',
          hasDevice: true,
          device: 'ME lab VR headset, asset tag GIT-VR-03',
          devLink: { href: '/student/device' },
          hasSetup: true,
          setupExp: 'true',
          setupCtl: 'st-setup',
          setupLabel: 'Hide setup steps',
          setupOpen: true,
          setup: steps.map((step, index) => ({ n: index + 1, t: step.title, d: step.detail })),
        },
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Hide setup steps' }));
    expect(onToggle).toHaveBeenCalledOnce();
    expectV3ClassesOnly(container);
  });

  it('the disclosure closed: `aria-expanded="false"`, no `aria-controls`, no steps', () => {
    const { container } = inRoot(
      <StLaunchSetup
        open={false}
        label="View setup steps"
        stepsId="st-setup"
        steps={[]}
        onToggle={() => undefined}
      />,
    );
    const button = screen.getByRole('button', { name: 'View setup steps' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).not.toHaveAttribute('aria-controls');
    expect(container.querySelector('ol')).toBeNull();
  });

  it('the "About" aside (`sv-about-dl`) and the page layout (`sv-ov sv-fp`)', () => {
    const drawn = excerpt(
      '<aside class="sv-card sv-ov-side" aria-labelledby="st-about-h">',
      '</aside>',
    );
    const rows = [
      { key: 'needs', term: 'Needs', value: 'A laptop or desktop with a current web browser' },
      {
        key: 'completed',
        term: 'Completed means',
        value: 'The simulation reports that you finished.',
      },
    ];
    const { container } = inRoot(
      <StLaunchPage>
        <p>launch</p>
        <StLaunchAbout title="About WEB" titleId="st-about-h" rows={rows} />
      </StLaunchPage>,
    );
    expect(TEMPLATE).toContain('<div class="sv-ov sv-fp">');
    expect(container.querySelector('div.sv-ov.sv-fp > aside')).toBeTruthy();
    expectSameMarkup(
      container.querySelector('aside')!,
      fill(drawn, {
        FP: { code: 'WEB', about: rows.map((row) => ({ k: row.term, v: row.value })) },
      }),
    );
    expect(screen.getByRole('complementary', { name: 'About WEB' })).toBeTruthy();
  });
});

describe('a composed hub page passes the class contract, the identifier rule and axe', () => {
  it('the Overview, a reading list, the chooser and a launch surface', async () => {
    const { container } = inRoot(
      <main>
        <h1>Shell-and-Tube Heat Exchanger</h1>
        <StOverview>
          <StHubMain>
            <StHubAbout
              title="About this experiment"
              titleId="a"
              description="Vary flow rates."
              area="Mechanical"
            />
            <StHubSection
              title="Formats and your progress"
              titleId="f"
              note="Each format has its own progress"
            >
              <StSubheading id="m">Your formats</StSubheading>
              <StHubFormatRows
                labelledBy="m"
                rows={[
                  {
                    key: 'web',
                    chip: { code: 'WEB', kind: 'on' },
                    name: 'Browser',
                    access: 'Available to you',
                    next: 'Next step',
                    status: { tone: 'neutral', words: 'Not started' },
                    facts: 'Runs in your browser on a laptop or desktop',
                    action: {
                      href: '/web',
                      label: 'Open WEB',
                      ariaLabel: 'Open WEB, Shell',
                      primary: true,
                    },
                  },
                ]}
              />
            </StHubSection>
          </StHubMain>
          <StAside as="div">
            <StHubSideSection title="Assessment" titleId="s" description="None set yet." />
          </StAside>
        </StOverview>
        <StResourceCard title="Resources" titleId="r" note="1 resource · each opens in a new tab">
          <ul className="sv-list">
            <StResourceRow
              icon="documentText"
              title="Lab brief"
              kind="PDF document"
              size="6 pages"
              statusId="rs"
              status={{ kind: 'not-opened', words: 'Not opened yet' }}
              action={{
                label: 'Open',
                ariaLabel: 'Open Lab brief in a new tab',
                busy: false,
                onOpen: () => undefined,
              }}
            />
          </ul>
        </StResourceCard>
        <StChooser labelledBy="c">
          <StShelfHead
            title="Choose a format"
            titleId="c"
            note="Formats come from your institution’s access."
          />
          <StChooserCards label="Your formats">
            <StChooserCard
              chip={{ code: 'VR', kind: 'on' }}
              name="Virtual reality"
              titleId="cv"
              access="Available to you"
              need="Runs on your headset."
              status={{ tone: 'ok', words: 'Completed 20 Oct 2026' }}
              facts={['Reported from the headset at 11:15']}
              actions={[
                { key: 'open', href: '/vr', label: 'Open VR', ariaLabel: 'Open VR, Shell' },
              ]}
            />
          </StChooserCards>
        </StChooser>
        <StLaunchPage>
          <StLaunchCard
            title="Start the WEB simulation"
            titleId="l"
            description="Runs in your browser."
            foot={
              <StLaunchFoot
                lead="Something not working?"
                text="Reporting it doesn’t affect your progress."
                report={{ href: '/report', label: 'Report a problem' }}
              />
            }
          >
            <Notice tone="ok" role="status" id="ok" title="The simulation opened in a new tab." />
            <StLaunchGo
              action={{
                kind: 'button',
                label: 'Launch WEB',
                busy: false,
                onLaunch: () => undefined,
                describedBy: 'h',
              }}
              hint={{ id: 'h', text: 'Opens in a new tab' }}
            />
          </StLaunchCard>
          <StLaunchAbout
            title="About WEB"
            titleId="ab"
            rows={[{ key: 'n', term: 'Needs', value: 'A browser' }]}
          />
        </StLaunchPage>
        <ButtonLink href="/simulation" size="lg">
          Back to Simulation
        </ButtonLink>
      </main>,
    );
    expect(screen.getByRole('button', { name: 'Launch WEB' })).toHaveAccessibleDescription(
      'Opens in a new tab',
    );
    expectV3ClassesOnly(container);
    expectNoStudentReferences(container);
    await assertNoAxeViolations(container);
  });
});
