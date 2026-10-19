/**
 * V3 primitives — icons, actions, status, formats, codes, the v46 island (foundation
 * XR-V3-RB-1.0; ADR-0010). Markup contracts against the static excerpts of the frozen V3 boards
 * (design/v3-refined-b), the class contract and the accessibility checks.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ICON_PATHS } from '../icons/registry.js';
import {
  assertNoAxeViolations,
  expectRenderedAsV3Drawn,
  expectV3ClassesOnly,
  v3BoardText,
  xsExportText,
} from '../testing/index.js';
import { Button, ButtonLink, TextLink } from './actions.js';
import { CourseCode, InstitutionCode, MissingTag } from './codes.js';
import { FORMAT_ORDER, FormatBadges, FormatCells, FormatKey } from './formats.js';
import { Icon, V3_ICON_PATHS } from './icons.js';
import { V46Island } from './island.js';
import { StatusPill, toV3Tone } from './status.js';

const BOARDS = ['SA01.dc.html', 'SA02.dc.html', 'IA01.dc.html', 'IA02.dc.html'];
/** The XS export's component files and live root (design/v3-refined-b/roles/XS-v6). */
const XS_FILES = [
  'XsSignIn.dc.html',
  'XsAccountMenu.dc.html',
  'XsHelp.dc.html',
  'XsMessage.dc.html',
  'XsAccessNotice.dc.html',
  'Main.dc.html',
];

describe('V3 icons', () => {
  it('every icon is a path a V3 board or the XS export draws (inline or as a symbol)', () => {
    const drawn = [...BOARDS.map((file) => v3BoardText(file)), ...XS_FILES.map(xsExportText)].join(
      '\n',
    );
    for (const [name, path] of Object.entries(V3_ICON_PATHS)) {
      expect(drawn.includes(`d="${path}"`), name).toBe(true);
    }
  });

  it('takes the shared icons from the v46 registry (one path per glyph, never two)', () => {
    const shared = Object.entries(V3_ICON_PATHS).filter(([, path]) =>
      Object.values(ICON_PATHS).includes(path as never),
    );
    expect(shared.length).toBe(26);
  });

  it('renders the core.css icon, decorative', () => {
    const { container } = render(<Icon name="search" size={18} />);
    const svg = container.firstElementChild!;
    expect(svg.getAttribute('class')).toBe('xr-ico xr-ico--18');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('V3 actions (rb.css buttons and links)', () => {
  it.each([
    ['default', 'rb-btn'],
    ['primary', 'rb-btn rb-btn--primary'],
    ['navy', 'rb-btn rb-btn--navy'],
    ['ghost', 'rb-btn rb-btn--ghost'],
  ] as const)('%s button', (variant, classes) => {
    render(<Button variant={variant}>Give access</Button>);
    expect(screen.getByRole('button', { name: 'Give access' }).getAttribute('class')).toBe(classes);
  });

  it('large, with an icon and a context class', () => {
    render(
      <Button variant="primary" size="lg" icon="add" className="rk-go">
        Approve request
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Approve request' });
    expect(button.getAttribute('class')).toBe('rb-btn rb-btn--primary rb-btn--lg rk-go');
    expect(button.querySelector('svg')?.getAttribute('class')).toBe('xr-ico xr-ico--18');
  });

  it('busy: the press is ignored, the words say what is happening', () => {
    const onClick = vi.fn();
    render(
      <Button variant="primary" busy busyLabel="Approving…" onClick={onClick}>
        Approve request
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Approving…' });
    expect(button.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('button links and text links', () => {
    render(
      <>
        <ButtonLink href="/admin/requests" variant="ghost" aria-label="Open the request">
          Open request
        </ButtonLink>
        <TextLink href="/admin/requests">Open Requests</TextLink>
      </>,
    );
    expect(screen.getByRole('link', { name: 'Open the request' }).getAttribute('class')).toBe(
      'rb-btn rb-btn--ghost',
    );
    expect(screen.getByRole('link', { name: 'Open Requests' }).getAttribute('class')).toBe(
      'rb-link',
    );
  });
});

describe('V3 status pills (core.css xr-st, rb-kit.css rk-st-ended)', () => {
  it.each([
    ['info', 'xr-st xr-st--info'],
    ['ok', 'xr-st xr-st--ok'],
    ['warn', 'xr-st xr-st--warn'],
    ['err', 'xr-st xr-st--err'],
    ['paused', 'xr-st xr-st--paused'],
    ['ended', 'xr-st rk-st-ended'],
    ['neutral', 'xr-st'],
  ] as const)('%s: the shape marker, then the words', (tone, classes) => {
    const { container } = render(<StatusPill tone={tone}>Under review</StatusPill>);
    expect(container.innerHTML).toBe(`<span class="${classes}"><i></i>Under review</span>`);
  });

  it('the large pill of a record head', () => {
    const { container } = render(
      <StatusPill tone="warn" size="lg">
        Approved — payment required
      </StatusPill>,
    );
    expect(container.firstElementChild?.getAttribute('class')).toBe('xr-st xr-st--warn rk-st-lg');
  });

  it('maps the v46 tones a screen already chooses (wait → warn, off → ended)', () => {
    expect(toV3Tone('wait')).toBe('warn');
    expect(toV3Tone('off')).toBe('ended');
    expect(toV3Tone('info')).toBe('info');
    expect(toV3Tone('paused')).toBe('paused');
  });
});

describe('V3 formats (core.css xr-fmt, rb-kit.css rk-fcell, rb.css rb-fc)', () => {
  it('keeps WEB/AR/VR/MR order whatever order it is given', () => {
    expect(FORMAT_ORDER).toEqual(['WEB', 'AR', 'VR', 'MR']);
    render(<FormatBadges formats={['VR', 'WEB']} label="Formats requested: WEB, VR" />);
    const codes = [...document.querySelectorAll('.xr-fmt')].map((badge) => badge.textContent);
    expect(codes).toEqual(['WEB', 'VR']);
  });

  it('list-row badges are named by words, not by an aria-label on a span (ADR-0010)', () => {
    const { container } = render(
      <FormatBadges formats={['WEB', 'VR']} label="Formats requested: WEB, VR" />,
    );
    const group = container.firstElementChild!;
    expect(group.getAttribute('aria-label')).toBeNull();
    expect(group.querySelector('.xr-sr')?.textContent).toBe('Formats requested: WEB, VR');
    for (const badge of group.querySelectorAll('.xr-fmt')) {
      expect(badge.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('refuses a format listed twice', () => {
    expect(() =>
      render(
        <FormatCells
          variant="strip"
          label="Formats"
          cells={[
            { format: 'WEB', state: 'on', words: 'Requested' },
            { format: 'WEB', state: 'pub', words: 'Not requested' },
          ]}
        />,
      ),
    ).toThrow('listed twice');
  });

  it('strip cells say their state in words (SA-03)', () => {
    const { container } = render(
      <FormatCells
        variant="strip"
        label="Formats requested: WEB, VR. Published: WEB, AR, VR."
        cells={[
          { format: 'MR', state: 'none', words: 'Not published' },
          { format: 'WEB', state: 'on', words: 'Requested' },
          { format: 'AR', state: 'pub', words: 'Not requested' },
          { format: 'VR', state: 'on', words: 'Requested' },
        ]}
      />,
    );
    const cells = [...container.querySelectorAll('li')];
    expect(cells.map((cell) => cell.className)).toEqual([
      'rk-fcell rk-fcell--on',
      'rk-fcell rk-fcell--pub',
      'rk-fcell rk-fcell--on',
      'rk-fcell rk-fcell--none',
    ]);
    expect(cells.map((cell) => cell.textContent)).toEqual([
      'WEBRequested',
      'ARNot requested',
      'VRRequested',
      'MRNot published',
    ]);
    expect(cells[0]?.querySelector('b svg')).not.toBeNull();
    expect(cells[1]?.querySelector('svg')).toBeNull();
    expectV3ClassesOnly(container);
  });

  it('plan cells, as IA-01 draws the access-plan sheet', () => {
    const { container } = render(
      <FormatCells
        variant="plan"
        label="Formats of Shell-and-Tube Heat Exchanger"
        cells={[
          { format: 'WEB', state: 'on', name: 'Browser', words: 'In your plan' },
          {
            format: 'AR',
            state: 'pub',
            name: 'Augmented reality',
            words: 'Published, not in your plan',
          },
          { format: 'VR', state: 'on', name: 'Virtual reality', words: 'In your plan' },
          { format: 'MR', state: 'none', name: 'Mixed reality', words: 'Not published' },
        ]}
      />,
    );
    expectRenderedAsV3Drawn(
      container.firstElementChild!,
      'IA01.dc.html',
      `<ul class="rb-fcells" aria-label="Formats of Shell-and-Tube Heat Exchanger">
        <li class="rb-fc rb-fc--on"><span class="rb-fc-code">WEB<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#rbi-tick"></use></svg></span><span class="rb-fc-name">Browser</span><span class="rb-fc-state">In your plan</span></li>
        <li class="rb-fc rb-fc--pub"><span class="rb-fc-code">AR</span><span class="rb-fc-name">Augmented reality</span><span class="rb-fc-state">Published, not in your plan</span></li>
        <li class="rb-fc rb-fc--on"><span class="rb-fc-code">VR<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#rbi-tick"></use></svg></span><span class="rb-fc-name">Virtual reality</span><span class="rb-fc-state">In your plan</span></li>
        <li class="rb-fc rb-fc--none"><span class="rb-fc-code">MR</span><span class="rb-fc-name">Mixed reality</span><span class="rb-fc-state">Not published</span></li>
      </ul>`,
    );
  });

  it('the format key: a named list on IA-02, decorative on SA-03', () => {
    const { container } = render(
      <FormatKey
        label="Format key"
        items={[
          { state: 'on', words: 'In your plan' },
          { state: 'pub', words: 'Published, not in your plan' },
          { state: 'none', words: 'Not published' },
        ]}
      />,
    );
    expectRenderedAsV3Drawn(
      container.firstElementChild!,
      'IA02.dc.html',
      `<ul class="rk-legend" aria-label="Format key">
        <li class="rk-legend-i"><span class="rk-swatch rk-swatch--on" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#rki-check"></use></svg></span>In your plan</li>
        <li class="rk-legend-i"><span class="rk-swatch rk-swatch--pub" aria-hidden="true"></span>Published, not in your plan</li>
        <li class="rk-legend-i"><span class="rk-swatch rk-swatch--none" aria-hidden="true"></span>Not published</li>
      </ul>`,
    );
    const decorative = render(<FormatKey items={[{ state: 'on', words: 'Requested' }]} />).container
      .firstElementChild!;
    expect(decorative.tagName).toBe('DIV');
    expect(decorative.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('V3 codes', () => {
  it('BITS course codes, the institution code and the missing tag', () => {
    const { container } = render(
      <>
        <CourseCode code="ME ZG523" />
        <CourseCode code="ME ZG523" variant="group" />
        <CourseCode code="ME ZG523" variant="plain" />
        <InstitutionCode code="MEC-523" />
        <MissingTag>Your course code: not added</MissingTag>
      </>,
    );
    expect([...container.children].map((element) => element.className)).toEqual([
      'rk-code',
      'rb-code',
      'rk-code rk-code--plain',
      'rk-owncode',
      'rk-tag-warn',
    ]);
    expectRenderedAsV3Drawn(
      container.lastElementChild!,
      'IA02.dc.html',
      '<span class="rk-tag-warn"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#rki-alert"></use></svg>Your course code: not added</span>',
    );
  });
});

describe('the v46 island', () => {
  it('marks its subtree for the V3 exclusion and the v46 container (V3P-05)', () => {
    const { container } = render(
      <V46Island>
        <p className="xr-body">Help</p>
      </V46Island>,
    );
    const island = container.firstElementChild!;
    expect(island.getAttribute('data-xr-v46')).toBe('');
    expectV3ClassesOnly(island);
  });
});

describe('accessibility', () => {
  it('has no axe violations', async () => {
    const { container } = render(
      <main>
        <Button variant="primary">Give access</Button>
        <StatusPill tone="info">Under review</StatusPill>
        <FormatBadges formats={['WEB']} label="Formats requested: WEB" />
        <FormatKey label="Format key" items={[{ state: 'none', words: 'Not published' }]} />
      </main>,
    );
    await assertNoAxeViolations(container);
  });
});
