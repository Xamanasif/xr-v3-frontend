/** The Content Manager pages' date line is the session's day, in the shell's words. */
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { weekdayDate } from '@/copy/dates';
import { renderInTab, tabPlatform, testNavigation } from '@/test-support/workspace';

import { useCmTodayLine } from './today-line';

function DateLine() {
  return <p>{useCmTodayLine() ?? 'signed out'}</p>;
}

describe('useCmTodayLine', () => {
  it('signed in: the sign-in day as the top bar writes it; signed out: nothing', async () => {
    const { runtime } = await tabPlatform('per-kavya-nair', 'spine-start');
    const session = runtime.session.getSnapshot();
    if (session.status !== 'signed-in') throw new Error('expected a session');
    renderInTab(<DateLine />, { runtime, navigation: testNavigation('/content-manager') });
    await waitFor(() =>
      expect(screen.getByText(weekdayDate(session.signedInAt))).toBeInTheDocument(),
    );
    expect(weekdayDate(session.signedInAt)).toMatch(/^[A-Z][a-z]+day \d{1,2} [A-Z][a-z]+ \d{4}$/);
    const visitor = await tabPlatform(null, 'spine-start');
    renderInTab(<DateLine />, {
      runtime: visitor.runtime,
      navigation: testNavigation('/content-manager'),
    });
    expect(await screen.findByText('signed out')).toBeInTheDocument();
  });
});
