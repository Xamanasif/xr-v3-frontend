import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import { initialsOf } from './people';

describe('initialsOf — the avatar initials board 05 draws for its seven sample people', () => {
  const drawn = [
    ...board('05-Workspace-Shell.dc.html').matchAll(/person: '([^']+)', initials: '([^']+)'/g),
  ].map(([, name, initials]) => [name!, initials!] as const);

  it('board 05 draws seven people', () => {
    expect(drawn).toHaveLength(7);
  });

  it.each(drawn)('%s → %s', (name, initials) => {
    expect(initialsOf(name)).toBe(initials);
  });

  it('a single name gives one letter; a title alone is kept as the name', () => {
    expect(initialsOf('Kavya')).toBe('K');
    expect(initialsOf('Dr')).toBe('D');
    expect(initialsOf('  ')).toBe('');
  });
});
