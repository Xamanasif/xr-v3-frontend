import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FoundationStatusList } from './foundation-status-list.js';

describe('FoundationStatusList', () => {
  it('renders each check with its state', () => {
    render(
      <FoundationStatusList
        title="Foundation checks"
        checks={[
          { id: 'boot', label: 'Boots', state: 'ok' },
          { id: 'api', label: 'API', state: 'pending', detail: <em>waiting</em> },
        ]}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Foundation checks' })).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute('data-state', 'ok');
    expect(items[1]).toHaveAttribute('data-state', 'pending');
    expect(screen.getByText('waiting')).toBeInTheDocument();
  });
});
