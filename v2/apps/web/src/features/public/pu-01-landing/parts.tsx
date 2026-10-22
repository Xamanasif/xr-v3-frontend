'use client';

import { FORMAT_META, type Technology } from '@xr/domain';

import { formatChipLabel, LANDING_FORMATS, LANDING_V1 } from '@/copy/landing-v1';

/** Joins class names, leaving out the falsy ones. */
export function classes(...names: readonly (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}

/**
 * A format chip set (frozen `techSet`, 1590–1599): all four formats in order, the ones not
 * offered in their off state (owner decision D-16). `dark` is the chip on indigo; `size` the
 * frozen sizes — `ann` the hero annotation (446), `card` a featured card (518), `panel` the
 * academic panel (721).
 */
export function FormatChips({
  offered,
  dark,
  size,
}: {
  readonly offered: readonly Technology[];
  readonly dark: boolean;
  readonly size: 'ann' | 'card' | 'panel';
}) {
  return (
    <span className={`pl1-chips pl1-chips--${size}`}>
      {LANDING_FORMATS.map((format) => {
        const on = offered.includes(format);
        return (
          <span
            key={format}
            aria-label={formatChipLabel(format, on)}
            className={classes(
              'pl1-chip',
              dark ? 'pl1-chip--dark' : 'pl1-chip--light',
              on && 'is-on',
            )}
          >
            {FORMAT_META[format].code}
          </span>
        );
      })}
    </span>
  );
}

/** The frozen `→` after a call to action, hidden from the accessible name. */
export function Arrow({ className }: { readonly className?: string }) {
  return (
    <span aria-hidden="true" className={className}>
      →
    </span>
  );
}

/**
 * The official BITS Pilani WILP lockup on its white tile (frozen 407, 912): the owner's PNG
 * (`branding/bits-pilani-wilp-logo.png`, 632 × 316, byte-copied to the app's public folder as the
 * name the frozen file uses, `bits-wilp-lockup.png`).
 */
export function LogoTile({ place }: { readonly place: 'header' | 'footer' }) {
  return (
    <span className={`pl1-logo pl1-logo--${place}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- features may not import next/*
          (import fences, Appendix F §3.8); the frozen design draws a plain image at fixed sizes. */}
      <img
        className="pl1-logo-img"
        src="/brand/bits-wilp-lockup.png"
        alt={LANDING_V1.header.logoAlt}
        width={place === 'header' ? 68 : 60}
        height={place === 'header' ? 34 : 30}
      />
    </span>
  );
}
