/**
 * The rail choice, remembered per person in this tab's memory only (Appendix F WP-0.8 "rail
 * preference in memory (X-10)"; owner: no localStorage or cross-tab persistence while VD-20 is
 * open; board 06 "The expand / collapse choice is remembered per person").
 */
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { railPreference, setRailPreference, useRailPreference } from './rail-preference';

function Probe({ person }: { readonly person: string }) {
  const [preference, set] = useRailPreference(person);
  return (
    <button type="button" onClick={() => set(preference === 'rail' ? 'expanded' : 'rail')}>
      {`${person}: ${preference}`}
    </button>
  );
}

describe('the rail preference', () => {
  afterEach(() => vi.restoreAllMocks());

  it('starts at the board default and is kept per person', () => {
    expect(railPreference('per-person-a')).toBe('auto');
    setRailPreference('per-person-a', 'rail');
    expect(railPreference('per-person-a')).toBe('rail');
    expect(railPreference('per-person-b')).toBe('auto');
  });

  it('writes nothing to browser storage or cookies', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    const cookie = document.cookie;
    setRailPreference('storage-person', 'expanded');
    render(<Probe person="storage-person" />);
    act(() => screen.getByRole('button').click());
    expect(setItem).not.toHaveBeenCalled();
    expect(getItem).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(document.cookie).toBe(cookie);
  });

  it('a change reaches every shell of that person, and only of that person', () => {
    render(
      <>
        <Probe person="hook-person-a" />
        <Probe person="hook-person-a" />
        <Probe person="hook-person-b" />
      </>,
    );
    act(() => screen.getAllByRole('button')[0]!.click());
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'hook-person-a: rail',
      'hook-person-a: rail',
      'hook-person-b: auto',
    ]);
  });
});
