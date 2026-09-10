import { useId, type ReactNode } from 'react';

export type FoundationCheckState = 'ok' | 'pending' | 'error' | 'info';

export interface FoundationCheck {
  readonly id: string;
  readonly label: string;
  readonly state: FoundationCheckState;
  readonly detail?: ReactNode;
}

const STATE_LABEL: Readonly<Record<FoundationCheckState, string>> = {
  ok: 'OK',
  pending: 'Pending',
  error: 'Error',
  info: 'Info',
};

/**
 * A plain, accessible list of foundation checks. This is a WIRING PROOF for the
 * shared React package, not a design-system component — Design V2 defines those.
 */
export function FoundationStatusList({
  title,
  checks,
}: {
  readonly title: string;
  readonly checks: readonly FoundationCheck[];
}) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} data-component="foundation-status-list">
      <h2 id={headingId}>{title}</h2>
      <ul>
        {checks.map((check) => (
          <li key={check.id} data-check={check.id} data-state={check.state}>
            <span>{check.label}</span>{' '}
            <span aria-label={`state: ${STATE_LABEL[check.state]}`}>
              [{STATE_LABEL[check.state]}]
            </span>
            {check.detail !== undefined ? <div>{check.detail}</div> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
