/**
 * PU-01 Landing with PU-14 — the V1 Direction B2 landing (prompt 13) on the real composition root
 * and the sample world, signed out: the frozen section order and words, the counts and courses
 * bound to the catalogue reads, every destination an existing route, the hero's rotation and
 * Pause/Play, the explorer's keys, the story's steps, the format previews, reduced motion, and the
 * loading and failed states. Layout, motion and the browser checks are the Playwright suite's
 * (`e2e/landing-v1/landing.spec.ts`).
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { faults } from '@xr/sample-platform/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { testPlatform } from '@/test-support/platform';
import { renderInTab, testNavigation } from '@/test-support/workspace';

import { forgetLastAddress } from '../../shared/workspace-frame/route-focus';
import { Landing } from './landing';

const realMatchMedia = window.matchMedia;

beforeEach(() => {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

afterEach(() => {
  forgetLastAddress();
  window.sessionStorage.clear();
  window.matchMedia = realMatchMedia;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function show(
  options: {
    readonly fail?: 'CatalogueService.listAreas' | 'CatalogueService.searchCatalogue';
  } = {},
) {
  const platform = await testPlatform();
  if (options.fail) faults(platform.sample).failNext(options.fail);
  const navigation = testNavigation('/');
  renderInTab(<Landing />, { runtime: platform.runtime, navigation });
  return { navigation };
}

/** Reduced motion, as the browser reports it. */
function preferReducedMotion() {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('reduce'),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
}

const hrefs = (root: ParentNode) =>
  [...root.querySelectorAll('a[href]')].map((link) => link.getAttribute('href'));

describe('PU-01: the page (frozen 404–920)', () => {
  it('sections in the frozen order, inside a header, main and footer, with the skip link first', async () => {
    await show();
    const root = document.querySelector('.pl1-root')!;
    expect(root.querySelector(':scope > a')).toHaveClass('xr-skip');
    expect(screen.getByRole('banner')).toHaveClass('pl1-hdr');
    expect(document.querySelector('main#main')).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('contentinfo')).toHaveClass('pl1-foot');
    const main = screen.getByRole('main');
    expect(
      [...main.querySelectorAll(':scope > section')].map(
        (section) =>
          section.getAttribute('aria-label') ??
          document.getElementById(section.getAttribute('aria-labelledby')!)!.textContent,
      ),
    ).toEqual([
      'Introduction',
      'Start with our flagship simulations.',
      'Every experiment, by engineering area.',
      'See one experiment unfold.',
      'One experiment. Four ways to run it.',
      'Academically reviewed. Built around your courses.',
      'Anyone can browse.Institutions grant access.',
      'Open the catalogue',
    ]);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Set the conditions.See what follows.Understand why.',
    );
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    // The tricolour sits between the hero and Featured.
    expect(main.querySelector('.pl1-hero + .pl1-tri + #featured')).not.toBeNull();
  });

  it('the header: the official lockup, the product name, the in-page links, Sign in and the catalogue', async () => {
    await show();
    const header = screen.getByRole('banner');
    const logo = within(header).getByRole('img', {
      name: 'BITS Pilani Work Integrated Learning Programmes',
    });
    expect(logo).toHaveAttribute('src', '/brand/bits-wilp-lockup.png');
    expect(
      // jsdom lays nothing out, so the logo's text and the name meet without the browser's space.
      within(header).getByRole('link', {
        name: /^BITS Pilani Work Integrated Learning Programmes ?XR Learning Platform$/,
      }),
    ).toHaveAttribute('href', '/');
    const nav = within(header).getByRole('navigation', { name: 'Main' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['Featured', '#featured'],
      ['Formats', '#formats'],
      ['For institutions', '#for-institutions'],
      ['Sign in', '/sign-in'],
      ['Browse the catalogueCatalogue', '/experiments'],
    ]);
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByRole('img')).toHaveAttribute('src', '/brand/bits-wilp-lockup.png');
    expect(within(footer).getByText('XR Learning Platform')).toBeInTheDocument();
    expect(
      within(within(footer).getByRole('navigation', { name: 'Footer' }))
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['Catalogue', '/experiments'],
      ['Featured experiments', '#featured'],
      ['Formats', '#formats'],
      ['For institutions', '#for-institutions'],
    ]);
    expect(footer).toHaveTextContent(
      'Sample courses and experiments · illustrative concept artwork · no production data',
    );
  });

  it('an in-page link scrolls to its section under the header, smoothly', async () => {
    const user = userEvent.setup();
    await show();
    await user.click(within(screen.getByRole('banner')).getByRole('link', { name: 'Formats' }));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(window.location.hash).toBe('');
  });

  it('every destination is an existing route (plan §5), counted from the sample world', async () => {
    await show();
    await screen.findByRole('heading', { level: 3, name: 'CNC Turning Centre' });
    await screen.findByText('Offered in 2 of 12 experiments');
    const main = screen.getByRole('main');
    expect(hrefs(main)).toEqual([
      '/experiments',
      '#featured',
      '/experiments',
      '/experiments?q=CNC',
      '/experiments?q=Shell-and-Tube',
      '/experiments?q=Induction%20Motor',
      '/experiments?q=Distillation',
      '/experiments?area=mechanical-manufacturing',
      '/experiments?area=electrical-electronics',
      '/experiments?area=chemical-process',
      '/experiments?format=web',
      '/experiments?format=ar',
      '/experiments?format=vr',
      '/experiments?format=mr',
      '/selection',
      '/experiments',
    ]);
    expect(screen.getByRole('link', { name: /See all 12 experiments/ })).toHaveAttribute(
      'href',
      '/experiments',
    );
  });
});

describe('PU-01: the hero (frozen 426–491)', () => {
  it('three scenes, the first on show with its course and formats; the others hidden', async () => {
    await show();
    const scenes = document.querySelectorAll('.pl1-scene');
    expect([...scenes].map((scene) => scene.getAttribute('aria-hidden'))).toEqual([
      'false',
      'true',
      'true',
    ]);
    await waitFor(() =>
      expect(scenes[0]).toHaveTextContent('ME ZG523 · Thermodynamics & Heat Transfer'),
    );
    expect(
      [...scenes[0]!.querySelectorAll('.pl1-chip')].map((chip) => chip.getAttribute('aria-label')),
    ).toEqual([
      'WEB — Browser, published for this experiment',
      'AR — Augmented reality, published for this experiment',
      'VR — Virtual reality, published for this experiment',
      'MR — Mixed reality, not offered for this experiment',
    ]);
    expect(scenes[1]).toHaveTextContent('EEE ZC341 · Electrical Machines');
    expect(scenes[2]).toHaveTextContent('CHE ZG513 · Process Instrumentation & Control');
    expect(
      screen.getByRole('img', { name: /the shell-side stream enters warm/ }),
    ).toBeInTheDocument();
  });

  it('rotates every 7.6 s; a manual pick stops rotation; Pause and Play', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    // The hero is on screen (jsdom lays nothing out).
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 76,
      bottom: 716,
      left: 0,
      right: 1440,
      width: 1440,
      height: 640,
      x: 0,
      y: 76,
      toJSON: () => ({}),
    });
    await show();
    const group = screen.getByRole('group', { name: 'Experiment scenes' });
    const pressed = () =>
      within(group)
        .getAllByRole('button')
        .slice(0, 3)
        .map((button) => button.getAttribute('aria-pressed'));
    expect(pressed()).toEqual(['true', 'false', 'false']);
    expect(group.querySelector('.pl1-pick.is-live')).not.toBeNull();
    await act(() => vi.advanceTimersByTimeAsync(7590));
    expect(pressed()).toEqual(['true', 'false', 'false']);
    await act(() => vi.advanceTimersByTimeAsync(20));
    expect(pressed()).toEqual(['false', 'true', 'false']);
    // A new scene replays the light sweep.
    expect(document.querySelector('.pl1-sweep')).not.toBeNull();
    await act(() => vi.advanceTimersByTimeAsync(7600));
    expect(pressed()).toEqual(['false', 'false', 'true']);

    // A manual pick selects and stops rotation; the ambient motion goes on (Pause is offered).
    await act(async () =>
      within(group)
        .getByRole('button', { name: /Shell-and-Tube/ })
        .click(),
    );
    expect(pressed()).toEqual(['true', 'false', 'false']);
    expect(group.querySelector('.pl1-pick.is-live')).toBeNull();
    await act(() => vi.advanceTimersByTimeAsync(20000));
    expect(pressed()).toEqual(['true', 'false', 'false']);
    const toggle = within(group).getByRole('button', { name: 'Pause motion' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    // Pause stops every ambient loop; Play starts rotation again.
    await act(async () => toggle.click());
    expect(within(group).getByRole('button', { name: 'Play motion' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(document.querySelector('.pl1-root')).toHaveAttribute('data-still', 'on');
    await act(async () => within(group).getByRole('button', { name: 'Play motion' }).click());
    expect(document.querySelector('.pl1-root')).not.toHaveAttribute('data-still');
    await act(() => vi.advanceTimersByTimeAsync(7600));
    expect(pressed()).toEqual(['false', 'true', 'false']);
  });

  it('skips a rotation while the tab is hidden, and resumes when it shows again', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true });
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 76,
      bottom: 716,
      left: 0,
      right: 1440,
      width: 1440,
      height: 640,
      x: 0,
      y: 76,
      toJSON: () => ({}),
    });
    await show();
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    await act(() => vi.advanceTimersByTimeAsync(20000));
    const first = screen.getByRole('button', { name: /Shell-and-Tube/ });
    expect(first).toHaveAttribute('aria-pressed', 'true');
    hidden.mockReturnValue(false);
    await act(async () => document.dispatchEvent(new Event('visibilitychange')));
    await act(() => vi.advanceTimersByTimeAsync(7600));
    expect(first).toHaveAttribute('aria-pressed', 'false');
  });

  it('the copy and its two calls to action; the illustration labelled', async () => {
    await show();
    const hero = screen.getByRole('region', { name: 'Introduction' });
    expect(
      within(hero).getByText('BITS Pilani · Work Integrated Learning Programmes'),
    ).toBeVisible();
    expect(
      within(hero).getByText(
        'Hands-on simulations of the lab experiments in your WILP courses, offered across WEB, AR, VR and MR.',
      ),
    ).toBeVisible();
    expect(within(hero).getByRole('link', { name: 'Browse the catalogue' })).toHaveAttribute(
      'href',
      '/experiments',
    );
    expect(within(hero).getByRole('link', { name: 'See featured experiments' })).toHaveAttribute(
      'href',
      '#featured',
    );
    expect(hero).toHaveTextContent('Illustrative concept artwork · not a simulation capture');
  });
});

describe('PU-01: Featured, Explore by area, Formats', () => {
  it('Featured: the four picks with their descriptors, area badges and formats; durations hidden', async () => {
    const { navigation } = await show();
    await screen.findByRole('heading', { level: 3, name: 'CNC Turning Centre' });
    const featured = document.getElementById('featured')!;
    const cards = featured.querySelectorAll('article');
    expect([...cards].map((card) => card.querySelector('h3')!.textContent)).toEqual([
      'CNC Turning Centre',
      'Shell-and-Tube Heat Exchanger',
      'Induction Motor Loading',
      'Distillation Column',
    ]);
    expect(
      [...featured.querySelectorAll('.pl1-fc-badge')].map((badge) => badge.textContent),
    ).toEqual(['Mechanical', 'Mechanical', 'Electrical', 'Chemical']);
    expect(cards[1]).toHaveTextContent(
      'Balance two flows and find the effectiveness–NTU relationship from your own readings.',
    );
    expect(cards[0]).toHaveTextContent('MEL ZG512 · Manufacturing Processes');
    expect(featured).not.toHaveTextContent(/\d+ min/);
    expect(
      within(cards[0] as HTMLElement).getByRole('link', {
        name: 'View CNC Turning Centre in the catalogue',
      }),
    ).toHaveAttribute('href', '/experiments?q=CNC');
    // The drawing opens the same search, as the frozen art does (1505).
    (cards[3]!.querySelector('.pl1-fc-media') as HTMLElement).click();
    expect(navigation.navigate).toHaveBeenCalledWith('/experiments?q=Distillation');
  });

  it('the explorer: focus or click selects; arrows, Home and End move and focus; closed panels’ Browse is not a stop', async () => {
    const user = userEvent.setup();
    await show();
    const group = await screen.findByRole('group', { name: 'Experiment areas' });
    await within(group).findByRole('button', { name: /Mechanical & Manufacturing/ });
    const selected = () =>
      within(group)
        .getAllByRole('button')
        .filter((button) => button.getAttribute('aria-pressed') === 'true')
        .map((button) => button.getAttribute('aria-label'));
    expect(selected()).toEqual(['Selected: Mechanical & Manufacturing, 5 experiments']);
    expect(group).toHaveTextContent('5 experiments · 2 courses');
    expect(group).toHaveTextContent('ME ZG523 · Thermodynamics & Heat Transfer');
    // A closed panel's Browse is hidden with its panel's extra content and is not a Tab stop.
    const browse = (count: number) =>
      [...group.querySelectorAll('a')].find((link) =>
        link.textContent!.startsWith(`Browse ${count} experiments`),
      )!;
    expect(browse(5)).toHaveAttribute('tabindex', '0');
    expect(browse(5)).toHaveAttribute('href', '/experiments?area=mechanical-manufacturing');
    expect(browse(4)).toHaveAttribute('tabindex', '-1');
    expect(browse(4).closest('[aria-hidden]')).toHaveAttribute('aria-hidden', 'true');
    within(group)
      .getByRole('button', { name: /Show Electrical/ })
      .focus();
    await waitFor(() =>
      expect(selected()).toEqual(['Selected: Electrical & Electronics, 4 experiments']),
    );
    await user.keyboard('{ArrowRight}');
    expect(selected()).toEqual(['Selected: Chemical & Process, 3 experiments']);
    expect(within(group).getByRole('button', { name: /Selected: Chemical/ })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(selected()).toEqual(['Selected: Mechanical & Manufacturing, 5 experiments']);
    await user.keyboard('{End}');
    expect(selected()).toEqual(['Selected: Chemical & Process, 3 experiments']);
    await user.keyboard('{Home}');
    expect(selected()).toEqual(['Selected: Mechanical & Manufacturing, 5 experiments']);
    await user.keyboard('{ArrowLeft}');
    expect(selected()).toEqual(['Selected: Chemical & Process, 3 experiments']);
    await user.click(within(group).getByRole('button', { name: /Show Electrical/ }));
    expect(selected()).toEqual(['Selected: Electrical & Electronics, 4 experiments']);
  });

  it('Formats: four peers; focus previews; Browse filters the catalogue by format', async () => {
    await show();
    const formats = document.getElementById('formats')!;
    await within(formats).findByText('Offered in 12 of 12 experiments');
    expect([...formats.querySelectorAll('.pl1-fcard-n')].map((line) => line.textContent)).toEqual([
      'Offered in 12 of 12 experiments',
      'Offered in 5 of 12 experiments',
      'Offered in 7 of 12 experiments',
      'Offered in 2 of 12 experiments',
    ]);
    const vr = within(formats).getByRole('button', { name: /virtual-reality format/ });
    expect(vr).toHaveAttribute('aria-pressed', 'false');
    await act(async () => vr.focus());
    expect(vr).toHaveAttribute('aria-pressed', 'true');
    expect(vr.getAttribute('aria-label')).toMatch(
      /^Previewing\. Illustration of the virtual-reality/,
    );
    expect(vr.closest('.pl1-fcard')).toHaveClass('is-on');
    expect(within(formats).getByRole('link', { name: /Browse VR experiments/ })).toHaveAttribute(
      'href',
      '/experiments?format=vr',
    );
  });
});

describe('PU-01: Inside a simulation (frozen 562–671)', () => {
  it('four illustrative steps; an index click selects its step; ← → wrap and move focus', async () => {
    const user = userEvent.setup();
    await show();
    const stage = screen.getByRole('region', {
      name: 'Illustrative session: Shell-and-Tube Heat Exchanger',
    });
    expect(stage).toHaveTextContent('Illustrative · no measured values');
    const steps = within(stage).getByRole('group', { name: 'Story steps' });
    const buttons = within(steps).getAllByRole('button');
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Step 01: Understand',
      'Step 02: Observe',
      'Step 03: Experiment',
      'Step 04: Interpret',
    ]);
    const shown = () =>
      [...stage.querySelectorAll('[data-sq]')].map((plate) => plate.getAttribute('aria-hidden'));
    expect(shown()).toEqual(['false', 'true', 'true', 'true']);
    // jsdom lays nothing out: the landing measures 0 px, the phone's tap mode.
    expect(document.querySelector('.pl1-root')).toHaveAttribute('data-smode', 'tap');
    await user.click(buttons[2]!);
    await waitFor(() => expect(shown()).toEqual(['true', 'true', 'false', 'true']));
    expect(buttons[2]).toHaveAttribute('aria-pressed', 'true');
    await user.keyboard('{ArrowRight}');
    expect(buttons[3]).toHaveFocus();
    await waitFor(() => expect(buttons[3]).toHaveAttribute('aria-pressed', 'true'));
    await user.keyboard('{ArrowRight}');
    expect(buttons[0]).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(buttons[3]).toHaveFocus();
  });
});

describe('PU-14: For institutions (frozen 740–764) and the closing band', () => {
  it('is the `#for-institutions` section: six steps, a focusable heading and the owner’s one request button', async () => {
    await show();
    const section = document.getElementById('for-institutions')!;
    const heading = within(section).getByRole('heading', { level: 2 });
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(heading).toHaveTextContent('Anyone can browse.Institutions grant access.');
    const steps = within(section).getByRole('list', { name: 'How access works' });
    expect(
      within(steps)
        .getAllByRole('listitem')
        .map((step) => step.querySelector('.pl1-st-t')!.textContent),
    ).toEqual([
      'Browse the catalogue',
      'Institution requests access',
      'Request is reviewed',
      'Payment where applicable',
      'Institution access is provisioned',
      'Institution grants student access',
    ]);
    expect(
      within(section)
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([['Request institutional access→', '/selection']]);
    const band = screen.getByRole('region', { name: 'Open the catalogue' });
    expect(within(band).getByRole('heading', { level: 2 })).toHaveTextContent(
      'Find the experiments for your course.',
    );
    expect(within(band).getByRole('link', { name: 'Browse the catalogue' })).toHaveAttribute(
      'href',
      '/experiments',
    );
  });
});

describe('PU-01: reduced motion (frozen 1118–1124)', () => {
  it('no rotation or motion; the intro shown at once; the story in its static mode', async () => {
    preferReducedMotion();
    await show();
    const root = document.querySelector('.pl1-root')!;
    await waitFor(() => expect(root).toHaveAttribute('data-reduce', 'on'));
    expect(root).toHaveAttribute('data-intro', 'on');
    expect(root).toHaveAttribute('data-still', 'on');
    expect(root).toHaveAttribute('data-smode', 'static');
    const toggle = screen.getByRole('button', { name: 'Play motion' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(document.querySelector('.pl1-pick.is-live')).toBeNull();
  });
});

describe('PU-01: loading and failed reads (D-14)', () => {
  it('the explorer fails on its own with a way forward; the rest of the landing stays', async () => {
    await show({ fail: 'CatalogueService.listAreas' });
    expect(
      await screen.findByRole('heading', { name: 'We couldn’t load the engineering areas' }),
    ).toBeVisible();
    expect(
      await screen.findByRole('heading', { level: 3, name: 'CNC Turning Centre' }),
    ).toBeVisible();
    // Without the areas, the featured cards show without their badges.
    expect(document.querySelectorAll('.pl1-fc-badge')).toHaveLength(0);
  });

  it('without the catalogue counts the format cards keep their words and leave the count out', async () => {
    await show({ fail: 'CatalogueService.searchCatalogue' });
    await screen.findByRole('heading', { level: 3, name: 'CNC Turning Centre' });
    const formats = document.getElementById('formats')!;
    expect(formats).toHaveTextContent('The experiment in a web browser, on a laptop or desktop.');
    expect(formats).not.toHaveTextContent(/Offered in/);
    expect(screen.queryByRole('link', { name: /See all/ })).toBeNull();
    // The hero's scenes show no chips without their experiments.
    expect(document.querySelectorAll('.pl1-scene .pl1-chip')).toHaveLength(0);
  });
});
