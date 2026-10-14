/**
 * The public surface (Phase-1 Package 1B; B1-01 … B1-05) on the real composition root and the
 * spine-start sample world, signed out: the shell renders only built destinations (PU-07 waits
 * for Package 1C), every page reads the catalogue service and nothing else, and the selection
 * panel speaks to the browser-session selection. Browser behaviour (focus walk, axe, widths,
 * one document) is the Playwright suite's (`e2e/package-1b/`).
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
import { faults } from '@xr/sample-platform/testing';

import { testPlatform } from '@/test-support/platform';
import { renderInTab, testNavigation } from '@/test-support/workspace';

import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { AreaExplorer } from './pu-01-landing/explorer';
import { Landing } from './pu-01-landing/landing';
import { AllAreas } from './pu-02-areas/areas';
import { AreaPage } from './pu-03-area/area';
import { Catalogue } from './pu-04-catalogue/catalogue';
import { CoursePage } from './pu-05-course/course';
import { ExperimentPage } from './pu-06-experiment/experiment';
import { PublicFrame } from './shell/public-frame';

afterEach(() => {
  forgetLastAddress();
  window.sessionStorage.clear();
});

async function show(page: ReactNode, pathname: string, search = '') {
  const { runtime } = await testPlatform();
  const navigation = testNavigation(pathname, search);
  renderInTab(<PublicFrame pathname={pathname}>{page}</PublicFrame>, { runtime, navigation });
  return { runtime, navigation };
}

const hrefs = (root: ParentNode = document) =>
  [...root.querySelectorAll('a[href]')].map((link) => link.getAttribute('href'));

describe('the public shell (B1-01 header, menu sheet, footer)', () => {
  it('renders only built destinations: no Selection, no Request access (PU-07, Package 1C)', async () => {
    await show(<AllAreas />, '/areas');
    const header = screen.getByRole('banner');
    expect(
      within(header)
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['BITS Pilani / WILP logo — placeholderXR Learning Platform', '/'],
      ['Browse experiments', '/experiments'],
      ['Areas', '/areas'],
      ['For institutions', '/#for-institutions'],
      ['Sign in', '/sign-in'],
    ]);
    expect(within(header).getByRole('link', { name: 'XR Learning Platform — home' })).toBeVisible();
    expect(hrefs()).not.toContain('/selection');
    expect(screen.queryByText('Request access')).toBeNull();
    // The skip link comes first and targets the page's main.
    expect(document.querySelector('.xp > *')).toHaveClass('xr-skip');
    expect(document.querySelector('main#main')).toHaveAttribute('tabindex', '-1');
    // Footer: the four real links (PU-16 excluded).
    const footer = screen.getByRole('contentinfo');
    expect(
      within(footer)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Browse experiments', 'Areas', 'For institutions', 'Sign in']);
  });

  it.each([
    ['/experiments', 'Browse experiments'],
    ['/experiments/shell-and-tube-heat-exchanger', 'Browse experiments'],
    ['/areas', 'Areas'],
    ['/areas/mechanical-manufacturing', 'Areas'],
    ['/courses/thermodynamics-heat-transfer', 'Areas'],
  ])('%s keeps “%s” current (B1-03, B1-04, B1-05)', async (pathname, current) => {
    await show(<span />, pathname);
    const nav = screen.getAllByRole('navigation', { name: 'Main' })[0]!;
    expect(within(nav).getByRole('link', { current: 'page' })).toHaveTextContent(current);
  });

  it('the landing has no current item', async () => {
    await show(<span />, '/');
    const nav = screen.getAllByRole('navigation', { name: 'Main' })[0]!;
    expect(within(nav).queryByRole('link', { current: 'page' })).toBeNull();
  });

  it('Menu opens the sheet over an inert page; Esc closes it and returns focus to Menu', async () => {
    const user = userEvent.setup();
    await show(<main id="main" tabIndex={-1} />, '/areas');
    const menu = screen.getByRole('button', { name: 'Menu' });
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById('public-menu')).not.toBeVisible();
    await user.click(menu);
    expect(screen.getByRole('button', { name: 'Close' })).toHaveAttribute('aria-expanded', 'true');
    const sheet = document.getElementById('public-menu')!;
    expect(sheet).toBeVisible();
    expect(
      within(sheet)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Browse experiments', 'Areas', 'For institutions', 'Sign in']);
    expect(document.querySelector('main')).toHaveAttribute('inert');
    expect(document.querySelector('footer')).toHaveAttribute('inert');
    expect(document.querySelector('header')).not.toHaveAttribute('inert');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveFocus();
    expect(document.querySelector('main')).not.toHaveAttribute('inert');
    expect(document.querySelector('footer')).not.toHaveAttribute('inert');
  });
});

describe('PU-01 Landing with PU-14 (B1-01, B1-02)', () => {
  it('reads every count from the world: explorer, featured, formats (“areas 5 / 4 / 3, formats 12 / 5 / 7 / 2”)', async () => {
    await show(<Landing />, '/');
    const region = await screen.findByRole('region', { name: 'Engineering areas' });
    expect(
      within(region)
        .getAllByRole('group')
        .map((group) => group.getAttribute('aria-label')),
    ).toEqual([
      '1 of 3: Mechanical & Manufacturing',
      '2 of 3: Electrical & Electronics',
      '3 of 3: Chemical & Process',
    ]);
    expect(within(region).getByText('5 experiments · 2 courses', { selector: 'p' })).toBeVisible();
    expect(within(region).getByRole('link', { name: /Browse 5 experiments/ })).toHaveAttribute(
      'href',
      '/experiments?area=mechanical-manufacturing',
    );
    expect(within(region).getByText('ME ZG523 · Thermodynamics & Heat Transfer')).toBeVisible();
    await screen.findByRole('link', { name: 'CNC Turning Centre' });
    expect(
      [...document.querySelectorAll('.xp-grid--4 .xp-card-title a')].map(
        (link) => link.textContent,
      ),
    ).toEqual([
      'CNC Turning Centre',
      'Shell-and-Tube Heat Exchanger',
      'Induction Motor Loading',
      'Distillation Column',
    ]);
    expect([...document.querySelectorAll('.xp-card-tag')].map((tag) => tag.textContent)).toEqual([
      'Mechanical',
      'Mechanical',
      'Electrical',
      'Chemical',
    ]);
    expect(screen.getByRole('link', { name: /Browse all 12 experiments/ })).toHaveAttribute(
      'href',
      '/experiments',
    );
    expect([...document.querySelectorAll('.xp-fcard-n')].map((line) => line.textContent)).toEqual([
      'Available in 12 of 12 experiments',
      'Available in 5 of 12 experiments',
      'Available in 7 of 12 experiments',
      'Available in 2 of 12 experiments',
    ]);
    expect(screen.getByRole('link', { name: 'Browse MR experiments' })).toHaveAttribute(
      'href',
      '/experiments?format=mr',
    );
  });

  it('the hero: one primary, Sign in for students and faculty, the depicted experiment, the drawing described', async () => {
    await show(<Landing />, '/');
    const hero = screen.getByRole('heading', { level: 1 });
    expect(hero).toHaveTextContent('Set the conditions.See what follows.Understand why.');
    const caption = await screen.findByRole('link', {
      name: 'ME ZG523 · Shell-and-Tube Heat Exchanger',
    });
    expect(caption).toHaveAttribute('href', '/experiments/shell-and-tube-heat-exchanger');
    expect(
      [...caption.parentElement!.querySelectorAll('.xr-fmt--on-dark')].map(
        (chip) => chip.textContent,
      ),
    ).toEqual(['WEB', 'AR', 'VR']);
    expect(
      screen.getByRole('img', { name: /a shell-and-tube heat exchanger in cutaway/ }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Already have access? Sign in' })).toHaveAttribute(
      'href',
      '/sign-in',
    );
    expect(document.querySelectorAll('main .xr-btn--primary.xp-cta')).toHaveLength(1);
    expect(screen.queryByRole('link', { name: 'Request institutional access' })).toBeNull();
  });

  it('PU-14 is the `#for-institutions` section with four steps; its heading can take focus', async () => {
    await show(<Landing />, '/');
    const section = document.getElementById('for-institutions')!;
    expect(within(section).getByRole('heading', { level: 2 })).toHaveAttribute('tabindex', '-1');
    expect([...section.querySelectorAll('.xp-step4-t')].map((title) => title.textContent)).toEqual([
      'Browse and select',
      'Request institutional access',
      'BITS reviews — payment may be required',
      'Your administrator gives students access',
    ]);
    expect(within(section).queryByRole('link')).toBeNull();
  });

  it('the explorer: Next and ← → move the selected area; Home / End jump; the move is announced', async () => {
    const user = userEvent.setup();
    await show(<Landing />, '/');
    const region = await screen.findByRole('region', { name: 'Engineering areas' });
    const selected = () =>
      region.querySelector('.xp-ex-card.is-selected')!.getAttribute('aria-label');
    expect(within(region).getByRole('button', { name: 'Previous area' })).toBeDisabled();
    await user.click(within(region).getByRole('button', { name: 'Next area' }));
    expect(selected()).toBe('2 of 3: Electrical & Electronics');
    expect(region.querySelector('[aria-live="polite"]')).toHaveTextContent(
      'Electrical & Electronics, area 2 of 3',
    );
    within(region)
      .getByRole('link', { name: /Browse 4 experiments/ })
      .focus();
    await user.keyboard('{End}');
    expect(selected()).toBe('3 of 3: Chemical & Process');
    await waitFor(() =>
      expect(within(region).getByRole('link', { name: /Browse 3 experiments/ })).toHaveFocus(),
    );
    await user.keyboard('{ArrowLeft}');
    expect(selected()).toBe('2 of 3: Electrical & Electronics');
    await user.keyboard('{Home}');
    expect(selected()).toBe('1 of 3: Mechanical & Manufacturing');
    // A neighbouring card selects itself and is not a tab stop.
    const mini = within(region).getByRole('button', { name: 'Show Chemical & Process' });
    expect(mini).toHaveAttribute('tabindex', '-1');
    await user.click(mini);
    expect(selected()).toBe('3 of 3: Chemical & Process');
  });
});

describe('PU-02 / PU-03 / PU-05 (B1-03)', () => {
  it('PU-02: the header facts link, one card per area with its counts', async () => {
    await show(<AllAreas />, '/areas');
    await screen.findByRole('link', { name: 'Mechanical & Manufacturing' });
    expect([...document.querySelectorAll('.xp-fact')].map((fact) => fact.textContent)).toEqual([
      'Areas3',
      'Courses5',
      'Experiments12',
    ]);
    expect(screen.getByRole('link', { name: '12' })).toHaveAttribute('href', '/experiments');
    expect(screen.getByRole('link', { name: 'Electrical & Electronics' })).toHaveAttribute(
      'href',
      '/areas/electrical-electronics',
    );
    expect(screen.getByRole('link', { name: '3 experiments' })).toHaveAttribute(
      'href',
      '/experiments?area=chemical-process',
    );
    expect(document.title).toBe('Engineering areas · XR Learning Platform');
  });

  it('PU-03: the courses with published experiments, each naming its experiments', async () => {
    await show(<AreaPage areaId="mechanical-manufacturing" />, '/areas/mechanical-manufacturing');
    await screen.findByRole('heading', { level: 1, name: 'Mechanical & Manufacturing' });
    const rows = await screen
      .findAllByRole('listitem', {})
      .then(() => [...document.querySelectorAll('.xp-course')].map((row) => row.textContent));
    expect(rows).toEqual([
      'ME ZG523Thermodynamics & Heat TransferShell-and-Tube Heat ExchangerFin-Tube BundleComposite Wall Conduction3 experiments ',
      'MEL ZG512Manufacturing ProcessesCNC Turning CentreInvestment Casting2 experiments ',
    ]);
    expect(screen.getByRole('link', { name: /Browse 5 experiments/ })).toHaveAttribute(
      'href',
      '/experiments?area=mechanical-manufacturing',
    );
    expect(screen.getByRole('link', { name: 'Thermodynamics & Heat Transfer' })).toHaveAttribute(
      'href',
      '/courses/thermodynamics-heat-transfer',
    );
    expect([...document.querySelectorAll('.xp-fact dt')].map((term) => term.textContent)).toEqual([
      'Courses',
      'Experiments',
      'Available in',
    ]);
    expect(screen.getByRole('link', { name: /How institutional access works/ })).toHaveAttribute(
      'href',
      '/#for-institutions',
    );
  });

  it('PU-03: an unknown area is B1-03’s message in the public frame', async () => {
    await show(<AreaPage areaId="no-such-area" />, '/areas/no-such-area');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We can’t find that area' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'All areas' })).toHaveAttribute('href', '/areas');
  });

  it('PU-05: the course, its area and its experiments with their formats', async () => {
    await show(
      <CoursePage courseId="thermodynamics-heat-transfer" />,
      '/courses/thermodynamics-heat-transfer',
    );
    await screen.findByRole('heading', { level: 1, name: 'Thermodynamics & Heat Transfer' });
    expect(screen.getByText('Course · Mechanical & Manufacturing')).toBeVisible();
    expect(document.querySelector('.xp-code')).toHaveTextContent('ME ZG523');
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(hrefs(crumbs)).toEqual(['/', '/areas', '/areas/mechanical-manufacturing']);
    expect(within(crumbs).getByText('ME ZG523')).toHaveAttribute('aria-current', 'page');
    expect(
      [...document.querySelectorAll('.xp-erow-title a')].map((link) => link.getAttribute('href')),
    ).toEqual([
      '/experiments/shell-and-tube-heat-exchanger',
      '/experiments/fin-tube-bundle',
      '/experiments/composite-wall-conduction',
    ]);
    expect(document.querySelector('.xp-erow-course')).toBeNull();
    expect(
      screen.getByRole('link', { name: 'Back to Mechanical & Manufacturing' }),
    ).toHaveAttribute('href', '/areas/mechanical-manufacturing');
  });

  it('PU-05: a course with no platform code and nothing published (B1-03 f6, f7)', async () => {
    await show(<CoursePage courseId="fluid-mechanics" />, '/courses/fluid-mechanics');
    await screen.findByRole('heading', { level: 1, name: 'Fluid Mechanics' });
    expect(document.querySelector('.xp-code')).toBeNull();
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(crumbs).getByText('Fluid Mechanics')).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByRole('heading', { name: 'No experiments are published for this course yet' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Browse all experiments' })).toHaveAttribute(
      'href',
      '/experiments',
    );
    expect([...document.querySelectorAll('.xp-fact')].map((fact) => fact.textContent)).toEqual([
      'Experiments0',
    ]);
  });

  it('PU-05: an unknown course', async () => {
    await show(<CoursePage courseId="nope" />, '/courses/nope');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We can’t find that course' }),
    ).toBeVisible();
  });
});

describe('PU-04 Catalogue (B1-04)', () => {
  const rowsShown = async () => {
    await waitFor(() =>
      expect(document.querySelectorAll('.xp-erow-title a').length).toBeGreaterThan(0),
    );
    return [...document.querySelectorAll('.xp-erow-title a')].map((link) => link.textContent);
  };

  it('arrives with an area filter: a removable chip, “5 of 12 experiments”', async () => {
    await show(<Catalogue />, '/experiments', '?area=mechanical-manufacturing');
    expect(await rowsShown()).toHaveLength(5);
    await waitFor(() =>
      expect(document.querySelector('.xp-count')).toHaveTextContent('5 of 12 experiments'),
    );
    expect(
      screen.getByRole('button', { name: 'Remove Area: Mechanical & Manufacturing' }),
    ).toBeVisible();
    expect(screen.getByRole('checkbox', { name: /Mechanical & Manufacturing/ })).toBeChecked();
  });

  it('“We adjusted this link”: unknown values dropped, the rest applied, the address cleaned', async () => {
    const { navigation } = await show(<Catalogue />, '/experiments', '?area=retired&format=vr');
    expect(await screen.findByText('We adjusted this link')).toBeVisible();
    await waitFor(() =>
      expect(document.querySelector('.xp-count')).toHaveTextContent('7 of 12 experiments'),
    );
    await waitFor(() =>
      expect(navigation.replace).toHaveBeenLastCalledWith('/experiments?format=vr'),
    );
    await userEvent.setup().click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('We adjusted this link')).toBeNull();
  });

  it('search, a format, the order and the view write the address; Clear all filters resets', async () => {
    const user = userEvent.setup();
    const { navigation } = await show(<Catalogue />, '/experiments');
    expect(await rowsShown()).toHaveLength(12);
    await user.type(screen.getByRole('searchbox', { name: 'Search experiments' }), 'motor');
    await waitFor(() =>
      expect(navigation.replace).toHaveBeenLastCalledWith('/experiments?q=motor'),
    );
    await waitFor(() =>
      expect(document.querySelector('.xp-count')).toHaveTextContent('1 of 12 experiments'),
    );
    await user.clear(screen.getByRole('searchbox', { name: 'Search experiments' }));
    await user.click(screen.getAllByRole('checkbox', { name: /MR · Mixed reality/ })[0]!);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort by' }), 'Title A–Z');
    await user.click(screen.getByRole('button', { name: 'By area' }));
    await waitFor(() =>
      expect(navigation.replace).toHaveBeenLastCalledWith(
        '/experiments?format=mr&sort=title-a-z&view=area',
      ),
    );
    expect([...document.querySelectorAll('.xp-group-h h2')].map((h) => h.textContent)).toEqual([
      'Mechanical & Manufacturing',
      'Electrical & Electronics',
    ]);
    await user.click(screen.getAllByRole('button', { name: 'Clear all filters' })[0]!);
    await waitFor(() =>
      expect(document.querySelector('.xp-count')).toHaveTextContent('12 experiments'),
    );
  });

  it('the filter sheet: Esc and its backdrop close it, and focus goes back to Filters', async () => {
    const user = userEvent.setup();
    await show(<Catalogue />, '/experiments');
    await rowsShown();
    const button = screen.getByRole('button', { name: 'Filters' });
    await user.click(button);
    expect(screen.getByRole('button', { name: 'Close filters' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Filters' })).toBeNull();
    expect(button).toHaveFocus();
    await user.click(button);
    // A press on the sheet's own text keeps it open; one on the backdrop closes it.
    await user.click(within(screen.getByRole('dialog')).getByRole('heading', { name: 'Filters' }));
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeVisible();
    await user.click(screen.getByRole('dialog', { name: 'Filters' }));
    expect(screen.queryByRole('dialog', { name: 'Filters' })).toBeNull();
    expect(button).toHaveFocus();
  });

  it('no results: B1-04’s empty state, one press clears', async () => {
    const user = userEvent.setup();
    await show(<Catalogue />, '/experiments', '?q=forging');
    expect(
      await screen.findByRole('heading', { name: 'No experiments match these filters' }),
    ).toBeVisible();
    const clear = within(document.querySelector('.xr-empty') as HTMLElement).getByRole('button', {
      name: 'Clear all filters',
    });
    await user.click(clear);
    expect(await rowsShown()).toHaveLength(12);
  });

  it('a row in the visitor’s selection is marked (B1-04 “Selection marker”)', async () => {
    const { runtime } = await testPlatform();
    expect(
      runtime.ports.selection.add({
        experimentId: 'distillation-column' as never,
        formats: ['web'],
      }).ok,
    ).toBe(true);
    const navigation = testNavigation('/experiments');
    renderInTab(
      <PublicFrame pathname="/experiments">
        <Catalogue />
      </PublicFrame>,
      { runtime, navigation },
    );
    await rowsShown();
    expect(
      [...document.querySelectorAll('.xp-erow.is-sel .xp-erow-title')].map(
        (title) => title.textContent,
      ),
    ).toEqual(['Distillation Column']);
  });
});

describe('PU-06 Experiment (B1-05)', () => {
  async function shellAndTube(search = '') {
    const shown = await show(
      <ExperimentPage experimentId="shell-and-tube-heat-exchanger" />,
      '/experiments/shell-and-tube-heat-exchanger',
      search,
    );
    await screen.findByRole('heading', { level: 1, name: 'Shell-and-Tube Heat Exchanger' });
    return shown;
  }

  it('hero → outcomes → formats and device needs → preview, with the course beside', async () => {
    await shellAndTube();
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(hrefs(crumbs)).toEqual([
      '/experiments',
      '/areas/mechanical-manufacturing',
      '/courses/thermodynamics-heat-transfer',
    ]);
    expect(
      screen.getByRole('link', { name: 'ME ZG523 · Thermodynamics & Heat Transfer' }),
    ).toHaveAttribute('href', '/courses/thermodynamics-heat-transfer');
    expect(
      [...document.querySelectorAll('.xp-outcomes li')].map((item) => item.textContent),
    ).toEqual([
      'Determine log mean temperature difference from measured inlet and outlet conditions',
      'Compare countercurrent and cocurrent arrangements at matched duty',
    ]);
    expect(
      [...document.querySelectorAll('.xp-ftable tbody tr')].map((row) =>
        [...row.querySelectorAll('td')].map((cell) => cell.textContent),
      ),
    ).toEqual([
      [
        'WEBBrowser',
        'The experiment in a web browser, on a laptop or desktop.',
        'Laptop or desktop with a current web browser',
      ],
      [
        'ARAugmented reality',
        'The experiment overlaid on your surroundings, on a supported phone or tablet.',
        'Supported phone or tablet',
      ],
      [
        'VRVirtual reality',
        'The experiment in a virtual lab, on a supported VR headset.',
        'Supported VR headset',
      ],
    ]);
    expect(screen.getByText('Not available in MR.')).toBeVisible();
    // No seeded preview link: the poster, labelled (B1-05 "Preview · poster only").
    expect(screen.getByText('Illustration · no preview for this experiment yet')).toBeVisible();
    const aside = screen.getByRole('complementary', { name: 'About this experiment' });
    expect(within(aside).getByText('Mechanical & Manufacturing · 3 experiments')).toBeVisible();
    expect(within(aside).getByRole('link', { name: /View the course/ })).toHaveAttribute(
      'href',
      '/courses/thermodynamics-heat-transfer',
    );
    // Student access is never implied; no price, no buy, no way into the unbuilt Selection.
    expect(hrefs()).not.toContain('/selection');
    expect(document.body.textContent).not.toMatch(/price|buy|purchase|has access|active access/i);
  });

  it('arrived with a format filter: back to that catalogue, the format chosen and its row marked', async () => {
    await shellAndTube('?format=vr');
    expect(screen.getByRole('link', { name: 'Back to VR experiments' })).toHaveAttribute(
      'href',
      '/experiments?format=vr',
    );
    expect(screen.getByRole('checkbox', { name: /VR\s*Virtual reality/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /WEB\s*Browser/ })).not.toBeChecked();
    expect(document.querySelector('tr.is-hl')).toHaveTextContent('Matches your filter');
  });

  it('the panel: validation, Add, Change formats, Update, Remove — through the selection port', async () => {
    const user = userEvent.setup();
    const { runtime } = await shellAndTube();
    const panel = screen.getByRole('complementary', { name: 'Get this for your institution' });
    await user.click(within(panel).getByRole('button', { name: 'Add to selection' }));
    expect(within(panel).getByRole('alert')).toHaveTextContent(
      'Choose at least one format to add.',
    );
    await user.click(within(panel).getByRole('checkbox', { name: /WEB/ }));
    expect(within(panel).queryByRole('alert')).toBeNull();
    await user.click(within(panel).getByRole('checkbox', { name: /VR/ }));
    await user.click(within(panel).getByRole('button', { name: 'Add to selection' }));
    expect(within(panel).getByRole('status')).toHaveTextContent(
      'In your selectionFormats: WEB · VR',
    );
    expect(selectionOf(runtime)).toEqual([['shell-and-tube-heat-exchanger', ['web', 'vr']]]);
    await waitFor(() =>
      expect(
        within(panel).getByRole('heading', { name: 'Get this for your institution' }),
      ).toHaveFocus(),
    );
    await user.click(within(panel).getByRole('button', { name: 'Change formats' }));
    expect(within(panel).getByRole('checkbox', { name: /WEB/ })).toBeChecked();
    await user.click(within(panel).getByRole('checkbox', { name: /AR/ }));
    await user.click(within(panel).getByRole('button', { name: 'Update selection' }));
    expect(selectionOf(runtime)).toEqual([['shell-and-tube-heat-exchanger', ['web', 'ar', 'vr']]]);
    await user.click(within(panel).getByRole('button', { name: 'Remove from selection' }));
    expect(selectionOf(runtime)).toEqual([]);
    expect(within(panel).getByRole('button', { name: 'Add to selection' })).toBeVisible();
  });

  it('an experiment in all four formats states no missing format; an unknown one is not found', async () => {
    await show(
      <ExperimentPage experimentId="cnc-turning-centre" />,
      '/experiments/cnc-turning-centre',
    );
    await screen.findByRole('heading', { level: 1, name: 'CNC Turning Centre' });
    expect(document.querySelector('.xp-unavail')).toBeNull();
  });

  it('unknown or unpublished: B1-05 “We can’t find that experiment”', async () => {
    await show(<ExperimentPage experimentId="sub-0077" />, '/experiments/sub-0077');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We can’t find that experiment' }),
    ).toBeVisible();
    expect(hrefs(document.querySelector('main')!)).toEqual(['/experiments', '/']);
  });
});

function selectionOf(runtime: PlatformRuntime) {
  return runtime.ports.selection.get().items.map((item) => [item.experimentId, [...item.formats]]);
}

describe('loading and failed states (B1-03 “All areas · loading / failed + retry”, B1-04 “Loading / Failed + retry”)', () => {
  async function failing(method: Parameters<ReturnType<typeof faults>['failNext']>[0]) {
    const platform = await testPlatform();
    faults(platform.sample).failNext(method);
    return platform;
  }

  function render(runtime: PlatformRuntime, page: ReactNode, pathname: string) {
    renderInTab(<PublicFrame pathname={pathname}>{page}</PublicFrame>, {
      runtime,
      navigation: testNavigation(pathname),
    });
  }

  it('PU-02: skeleton cards announced once, then the failure with a way forward; Try again reads again', async () => {
    const user = userEvent.setup();
    const { runtime } = await failing('CatalogueService.listAreas');
    render(runtime, <AllAreas />, '/areas');
    expect(screen.getByRole('status')).toHaveTextContent('Loading engineering areas');
    expect(document.querySelectorAll('.xp-card[aria-hidden="true"]')).toHaveLength(3);
    expect(
      await screen.findByRole('heading', { name: 'We couldn’t load the engineering areas' }),
    ).toBeVisible();
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: 'Browse experiments' }),
    ).toHaveAttribute('href', '/experiments');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('link', { name: 'Chemical & Process' })).toBeVisible();
  });

  it('PU-04: skeleton rows, then B1-04’s failure; the toolbar stays usable; Try again reads again', async () => {
    const user = userEvent.setup();
    const { runtime } = await failing('CatalogueService.searchCatalogue');
    render(runtime, <Catalogue />, '/experiments');
    expect(screen.getByText('Loading experiments')).toHaveAttribute('role', 'status');
    expect(
      await screen.findByRole('heading', { name: 'We couldn’t load the experiments' }),
    ).toBeVisible();
    expect(screen.getByRole('searchbox', { name: 'Search experiments' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(document.querySelectorAll('.xp-erow-title a')).toHaveLength(12));
  });

  it('PU-06: its own failure words (state-copy `PU-06.failed`), then the page on Try again', async () => {
    const user = userEvent.setup();
    const { runtime } = await failing('CatalogueService.getExperiment');
    render(
      runtime,
      <ExperimentPage experimentId="fin-tube-bundle" />,
      '/experiments/fin-tube-bundle',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading experiment');
    expect(
      await screen.findByRole('heading', { name: 'We couldn’t load this experiment' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Fin-Tube Bundle' })).toBeVisible();
  });

  it('PU-01: the explorer section fails on its own, the rest of the landing stays', async () => {
    const { runtime } = await failing('CatalogueService.listAreas');
    render(runtime, <Landing />, '/');
    expect(
      await screen.findByRole('heading', { name: 'We couldn’t load the engineering areas' }),
    ).toBeVisible();
    expect(await screen.findByRole('link', { name: 'CNC Turning Centre' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 1 })).toBeVisible();
  });

  it('PU-01: B1-01 “Areas loading (or art failed) → plain list” when the areas’ courses cannot be read', async () => {
    const platform = await testPlatform();
    faults(platform.sample).failNext('CatalogueService.getArea');
    render(platform.runtime, <Landing />, '/');
    const list = await screen.findByRole('link', { name: 'Electrical & Electronics' });
    expect(list.closest('ul')).toHaveClass('xp-ex-list');
    expect(list.nextElementSibling).toHaveTextContent('4 experiments · 2 courses');
    // The featured cards still show, without their area tags (state-copy `PU-01.featured-tag`).
    expect(await screen.findByRole('link', { name: 'CNC Turning Centre' })).toBeVisible();
    expect(document.querySelectorAll('.xp-card-tag')).toHaveLength(0);
  });

  it('PU-01: an explorer with no area to show renders nothing (the landing shows the plain list)', async () => {
    const { runtime } = await testPlatform();
    const { container } = renderInTab(<AreaExplorer areas={[]} />, {
      runtime,
      navigation: testNavigation('/'),
    });
    expect(container).toBeEmptyDOMElement();
  });
});
