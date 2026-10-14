import { Button } from '@xr/ui';

import { ParityItem, ParityPage } from './stage';

/**
 * Board 03 "Actions" (WP-0.15 parity): every drawn button with the board's words, as the product
 * `Button` renders it. Hover and keyboard-focus states are produced in the browser by the parity
 * suite (pointer over the button, keyboard focus), never by a static class. Busy uses the
 * component's own `busy`/`busyLabel`.
 */
const VARIANTS = [
  { key: 'primary', variant: 'primary', label: 'Give access', busy: 'Giving access…' },
  { key: 'secondary', variant: 'secondary', label: 'Save draft', busy: 'Saving…' },
  { key: 'text', variant: 'text', label: 'View my reports', busy: null },
  { key: 'danger', variant: 'danger', label: 'Withdraw access', busy: 'Withdrawing…' },
  { key: 'danger-quiet', variant: 'danger-quiet', label: 'Deactivate account', busy: null },
] as const;

export const ACTION_VARIANTS = VARIANTS;

export function B03Actions() {
  return (
    <ParityPage>
      {VARIANTS.flatMap(({ key, variant, label, busy }) => [
        ...(['default', 'hover', 'focus'] as const).map((state) => (
          <ParityItem key={`${key}-${state}`} id={`btn-${key}-${state}`}>
            <Button variant={variant}>{label}</Button>
          </ParityItem>
        )),
        ...(busy
          ? [
              <ParityItem key={`${key}-busy`} id={`btn-${key}-busy`}>
                <Button variant={variant} busy busyLabel={busy}>
                  {label}
                </Button>
              </ParityItem>,
            ]
          : []),
      ])}
      <ParityItem id="btn-size-default">
        <Button variant="secondary">Default 44</Button>
      </ParityItem>
      <ParityItem id="btn-size-small">
        <Button variant="secondary" size="sm">
          Small 36
        </Button>
      </ParityItem>
      <ParityItem id="btn-unavailable">
        <Button variant="primary" disabled>
          Submit feedback
        </Button>
      </ParityItem>
    </ParityPage>
  );
}
