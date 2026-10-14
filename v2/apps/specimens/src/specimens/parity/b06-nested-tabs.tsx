import { SectionTabs } from '@xr/ui';

import { ParityItem, ParityPage } from './stage';

/**
 * Board 06 "Nested destinations · section tabs, not a second sidebar level" (WP-0.15 parity): the
 * four drawn tab strips through the product SectionTabs, on the page background the frames draw
 * them on (#F4F5FB).
 */
const NESTED = [
  ['super-admin-content', 'Content', ['Updates', 'All content'], 0],
  ['super-admin-operations', 'Operations', ['Device transfers', 'Support', 'Access ending'], 1],
  ['institute-admin-people', 'People', ['Students', 'Faculty', 'Groups', 'Faculty courses'], 2],
  ['institute-admin-requests', 'Requests', ['Requests to BITS', 'Device requests'], 1],
] as const;

export function B06NestedTabs() {
  return (
    <ParityPage>
      {NESTED.map(([id, destination, tabs, current]) => (
        <ParityItem key={id} id={id} surface="canvas">
          <SectionTabs
            label={`${destination} sections`}
            tabs={tabs.map((label, index) => ({
              href: '#h-sub',
              label,
              current: index === current,
            }))}
          />
        </ParityItem>
      ))}
    </ParityPage>
  );
}

/** Board 11 "Section tabs at 375 px · each People tab as the current one" (four strips). */
export const PEOPLE_TABS = ['Students', 'Faculty', 'Groups', 'Faculty courses'] as const;

export function B11PeopleTabs() {
  return (
    <ParityPage>
      {PEOPLE_TABS.map((current) => (
        <ParityItem
          key={current}
          id={`tabs-375-${current.toLowerCase().replace(' ', '-')}`}
          surface="none"
        >
          {/* The frame's content box mirrored: 375 px, 16 px padding, page background. */}
          <div
            className="xr-content"
            style={{ width: 375, padding: 16, background: '#F4F5FB', boxSizing: 'border-box' }}
          >
            <SectionTabs
              label="People sections"
              tabs={PEOPLE_TABS.map((label) => ({
                href: '#proof',
                label,
                current: label === current,
              }))}
            />
          </div>
        </ParityItem>
      ))}
    </ParityPage>
  );
}
