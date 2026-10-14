'use client';

import {
  FormatBadge,
  Icon,
  IdChip,
  Link,
  NavItem,
  Text,
  type IconName,
  type TypeStyle,
} from '@xr/ui';

import { ParityItem, ParityPage } from './stage';

/**
 * Board 02 "Tokens and typography" (WP-0.15 parity): the type scale through `Text`, the link
 * treatment through `Link`, the navy focus specimen through `NavItem`, and the icon sizes and the
 * 48-icon working set through `Icon`. Where the board frames an icon in a tile (48 px, #F4F5FB,
 * navy), the tile is harness furniture mirrored from the board; the icon is the product's.
 */

/** Board 02 "Type scale": the token and the specimen words, in board order. */
export const TYPE_SCALE: readonly (readonly [TypeStyle, string])[] = [
  ['display', 'Engineering, made visible'],
  ['h1', 'Give students access'],
  ['h2', 'Needs your attention'],
  ['h3', 'Learning outcomes'],
  ['lead', 'Choose the experiments to give, then the students.'],
  ['body', 'Your institution’s access to this experiment includes WEB and VR.'],
  ['small', 'Sent 3 Oct · reference SUP-0213'],
  ['meta', 'Last changed by Kavya Nair · 2 Oct'],
  ['overline', 'Institute Admin'],
  ['caption', 'Illustration'],
];

/** Board 02 "Icon sizing and working icon set": the 48 icons in board order. */
export const ICON_SET: readonly IconName[] = [
  'home',
  'overview',
  'myCourses',
  'assessments',
  'progress',
  'questionBank',
  'marking',
  'studentsPeople',
  'contentAccess',
  'studentAccess',
  'requests',
  'usage',
  'myExperiments',
  'reviewQueue',
  'reviewedByMe',
  'readyToPublish',
  'contentLibrary',
  'updates',
  'courseCodes',
  'institutions',
  'content',
  'academicStructure',
  'platformRoles',
  'operations',
  'help',
  'menu',
  'close',
  'back',
  'collapseMenu',
  'search',
  'filter',
  'info',
  'attention',
  'failed',
  'done',
  'paused',
  'readOnly',
  'waiting',
  'retry',
  'myDevice',
  'signOut',
  'notAvailable',
  'withAnotherRole',
  'attach',
  'externalLink',
  'add',
  'next',
  'document',
];

const TILE = {
  width: 48,
  height: 48,
  borderRadius: 8,
  background: '#F4F5FB',
  color: '#141B5E',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
} as const;

export function B02TypeIcons() {
  return (
    <ParityPage>
      {TYPE_SCALE.map(([variant, words]) => (
        <ParityItem key={variant} id={`type-${variant}`} flow="block">
          <Text variant={variant} as="span">
            {words}
          </Text>
        </ParityItem>
      ))}
      <ParityItem id="type-chip" flow="block">
        <FormatBadge format="VR" glyph={false} />
      </ParityItem>
      <ParityItem id="link-in-text">
        <p className="xr-body">
          Read the <Link href="#h-link">lab brief</Link> before you start.
        </p>
      </ParityItem>
      <ParityItem id="link-hover">
        <p className="xr-body">
          Hover: <Link href="#h-link">lab brief</Link>
        </p>
      </ParityItem>
      <ParityItem id="link-external">
        <p className="xr-body">
          <Link href="#h-link" external>
            Open delivery link
          </Link>
        </p>
      </ParityItem>
      <ParityItem id="id-chip">
        <IdChip>ACC-0107</IdChip>
      </ParityItem>
      {/* Board 02 "Focus on navy": the board's own sidebar excerpt, with the product NavItem. */}
      <ParityItem id="focus-on-navy" surface="navy">
        <nav
          aria-label="Focus example"
          className="xr-side"
          style={{ width: 'auto', minHeight: 0, background: 'transparent' }}
        >
          <ul className="xr-nav" style={{ padding: 0 }}>
            <NavItem label="Content access" href="#h-link" icon="contentAccess" />
          </ul>
        </nav>
      </ParityItem>
      {([16, 20, 24] as const).map((size) => (
        <ParityItem key={size} id={`icon-size-${size}`}>
          <Icon name="waiting" size={size} />
        </ParityItem>
      ))}
      {ICON_SET.map((name) => (
        <ParityItem key={name} id={`icon-${name}`}>
          <span style={TILE}>
            <Icon name={name} size={24} />
          </span>
        </ParityItem>
      ))}
    </ParityPage>
  );
}
