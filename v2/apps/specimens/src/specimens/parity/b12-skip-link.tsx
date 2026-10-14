import { SkipLink } from '@xr/ui';

/**
 * Board 12 "Keyboard and focus · Shell tab order" (WP-0.15 parity): the skip link, shown on
 * keyboard focus, inside a box like the board's (72 px, page background, hairline border) — the
 * box is harness furniture mirrored from the board; the link is the product's.
 */
export function B12SkipLink() {
  return (
    <div style={{ padding: 24 }}>
      <div
        data-parity="skip-link"
        style={{
          position: 'relative',
          height: 72,
          background: '#F4F5FB',
          border: '1px solid #E1E4F3',
          borderRadius: 8,
          width: 520,
        }}
      >
        <SkipLink />
      </div>
      <main id="main" tabIndex={-1} />
    </div>
  );
}
