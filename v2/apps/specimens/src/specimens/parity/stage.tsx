import type { ReactNode } from 'react';

/**
 * One parity item (WP-0.15): a harness box that holds exactly one product component, on the
 * surface the board draws it on, so the comparison captures the component's own pixels. The
 * compared element is the item's first child; the box itself is harness furniture, never compared.
 *
 * `surface` is the colour the board puts behind the specimen: `card` = a white `.doc-card`,
 * `canvas` = the page background, `navy` = a navy band (#141B5E). `width` gives a container its board width (px).
 */
export function ParityItem({
  id,
  surface = 'card',
  width,
  flow = 'flex',
  children,
}: {
  readonly id: string;
  readonly surface?: 'card' | 'canvas' | 'navy' | 'none';
  readonly width?: number;
  /** `block`: the component stays inline, as in a board table cell or paragraph. */
  readonly flow?: 'flex' | 'block';
  readonly children: ReactNode;
}) {
  return (
    <div
      data-parity={id}
      className={`parity-item parity-item--${surface}${flow === 'block' ? ' parity-item--block' : ''}`}
      style={width === undefined ? undefined : { inlineSize: `${width}px` }}
    >
      {children}
    </div>
  );
}

/** A page of parity items, in board order. */
export function ParityPage({ children }: { readonly children: ReactNode }) {
  return <div className="parity-page">{children}</div>;
}
