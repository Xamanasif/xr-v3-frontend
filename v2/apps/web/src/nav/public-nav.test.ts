/**
 * The public surface's navigation (Packages 1B, 1C; ADR-0005 §8): the header, menu sheet and footer
 * render only built destinations — since Package 1C the Selection and Request access (PU-07) too —
 * and the section a page belongs to is current (B1-03 PU-05 keeps Areas, B1-05 PU-06 keeps Browse
 * experiments, B1-06 marks the Selection on PU-07 only).
 */
import { describe, expect, it } from 'vitest';

import {
  FOR_INSTITUTIONS_HREF,
  PUBLIC_FOOTER_LINKS,
  PUBLIC_MAIN_NAV,
  PUBLIC_REQUEST_ACCESS,
  PUBLIC_SELECTION_LINK,
  PUBLIC_SIGN_IN,
  SELECTION_BUILT,
  publicPlaceOf,
} from './public-nav';
import { resolveAddress } from './routes';

describe('the public header, sheet and footer', () => {
  it('Browse experiments · Areas · For institutions, each to a built page', () => {
    expect(PUBLIC_MAIN_NAV.map((item) => [item.label, item.href])).toEqual([
      ['Browse experiments', '/experiments'],
      ['Areas', '/areas'],
      ['For institutions', '/#for-institutions'],
    ]);
    for (const item of PUBLIC_MAIN_NAV)
      expect(resolveAddress(item.href).kind, item.label).toBe('public-screen');
    expect(FOR_INSTITUTIONS_HREF).toBe('/#for-institutions');
  });

  it('PU-07 is built (Package 1C): "Selection (n)" and "Request access" both open it (HB-02)', () => {
    expect(SELECTION_BUILT).toBe(true);
    expect(PUBLIC_SELECTION_LINK).toMatchObject({
      label: 'Selection',
      href: '/selection',
      counted: true,
    });
    expect(PUBLIC_REQUEST_ACCESS).toMatchObject({ label: 'Request access', href: '/selection' });
    expect(resolveAddress('/selection')).toEqual({ kind: 'public-screen', screen: 'PU-07' });
  });

  it('Sign in opens the built sign-in card; the footer has the four real links', () => {
    expect(PUBLIC_SIGN_IN).toMatchObject({ label: 'Sign in', href: '/sign-in' });
    expect(resolveAddress(PUBLIC_SIGN_IN.href)).toEqual({ kind: 'sign-in' });
    expect(PUBLIC_FOOTER_LINKS.map((item) => item.label)).toEqual([
      'Browse experiments',
      'Areas',
      'For institutions',
      'Sign in',
    ]);
  });
});

describe('the current place', () => {
  it.each([
    ['/', null],
    ['/experiments', 'browse'],
    ['/experiments/shell-and-tube-heat-exchanger', 'browse'],
    ['/areas', 'areas'],
    ['/areas/chemical-process', 'areas'],
    ['/courses/fluid-mechanics', 'areas'],
    ['/selection', 'selection'],
    // The request's later steps mark nothing current (B1-07, B1-08: no `aria-current` in the header).
    ['/request-access', null],
    ['/request-access/sent', null],
    ['/requests/rq-0012', null],
    ['/zz-unknown', null],
  ] as const)('%s → %s', (pathname, place) => {
    expect(publicPlaceOf(pathname)).toBe(place);
  });
});
