/**
 * `@xr/ui` links render through `next/link` inside the app (Appendix E §2.6; Appendix F §3.2),
 * while `@xr/ui` itself never imports `next/*`.
 */
import { render, screen } from '@testing-library/react';
import { Link } from '@xr/ui';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

const received = vi.hoisted(() => ({ props: [] as Record<string, unknown>[] }));

vi.mock('next/link', () => ({
  default: function NextLinkProbe(props: ComponentProps<'a'>) {
    received.props.push(props as Record<string, unknown>);
    return <a {...props} data-next-link="" />;
  },
}));

const { AppLinkProvider } = await import('./link');

describe('AppLinkProvider', () => {
  it('renders @xr/ui links with next/link, passing every prop through', () => {
    render(
      <AppLinkProvider>
        <Link href="/student/help" className="probe">
          Help &amp; support
        </Link>
      </AppLinkProvider>,
    );
    const link = screen.getByRole('link', { name: 'Help & support' });
    expect(link).toHaveAttribute('href', '/student/help');
    expect(link).toHaveAttribute('data-next-link');
    expect(received.props.at(-1)).toMatchObject({ href: '/student/help', className: 'probe' });
  });

  it('without the provider @xr/ui falls back to a plain anchor', () => {
    received.props.length = 0;
    render(<Link href="/student/help">Help</Link>);
    expect(screen.getByRole('link', { name: 'Help' })).not.toHaveAttribute('data-next-link');
    expect(received.props).toEqual([]);
  });
});
