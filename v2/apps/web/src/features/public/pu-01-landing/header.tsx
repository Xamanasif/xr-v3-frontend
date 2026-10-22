'use client';

import { Link } from '@xr/ui';
import type { MouseEvent } from 'react';

import { LANDING_V1 } from '@/copy/landing-v1';

import { LANDING_HREF } from './bind';
import { LogoTile } from './parts';

/** The in-page sections the header and the footer scroll to (frozen `goSection`, 1559–1563). */
export type LandingSection = 'featured' | 'formats' | 'for-institutions';

/** An in-page link that scrolls as the frozen buttons do (smooth; instant under reduced motion). */
export function SectionLink({
  section,
  className,
  goSection,
  children,
}: {
  readonly section: LandingSection;
  readonly className: string;
  readonly goSection: (section: LandingSection) => void;
  readonly children: string;
}) {
  return (
    <a
      className={className}
      href={`#${section}`}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        goSection(section);
      }}
    >
      {children}
    </a>
  );
}

/**
 * The sticky header (frozen 404–421; values 1972–1980): the logo tile, the product name, the
 * in-page links, and the gold catalogue button. Owner decisions: the product name is
 * “XR Learning Platform” (D-4); “Sign in” is the fourth link of the frozen nav at ≥ 1024 px and a
 * small text link beside the gold button below it (D-3). Adapter-only: a `header` landmark, a
 * `nav` named Main, and links where the frozen file has buttons.
 */
export function LandingHeader({
  goSection,
}: {
  readonly goSection: (section: LandingSection) => void;
}) {
  const words = LANDING_V1.header;
  return (
    <header className="pl1-hdr">
      <div className="pl1-hdr-row">
        <Link className="pl1-brand" href={LANDING_HREF.home}>
          <LogoTile place="header" />
          <span className="pl1-brand-sep" />
          <span className="pl1-brand-text">
            <span className="pl1-brand-name">{words.productName}</span>
          </span>
        </Link>
        <nav className="pl1-nav" aria-label={words.mainNav}>
          <SectionLink section="featured" className="pl1-navlink" goSection={goSection}>
            {words.featured}
          </SectionLink>
          <SectionLink section="formats" className="pl1-navlink" goSection={goSection}>
            {words.formats}
          </SectionLink>
          <SectionLink section="for-institutions" className="pl1-navlink" goSection={goSection}>
            {words.institutions}
          </SectionLink>
          <Link className="pl1-navlink pl1-signin" href={LANDING_HREF.signIn}>
            {words.signIn}
          </Link>
          <Link className="pl1-headcta" href={LANDING_HREF.catalogue}>
            <span className="pl1-not-phone">{words.catalogue}</span>
            <span className="pl1-phone-only">{words.catalogueShort}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
