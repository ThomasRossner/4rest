import { describe, expect, it } from 'vitest';
import { resolveMainPageBackgroundKey } from './pageBackgrounds';

describe('resolveMainPageBackgroundKey', () => {
  it('maps the five guest main pages to configurable background keys', () => {
    expect(resolveMainPageBackgroundKey('/')).toBe('home');
    expect(resolveMainPageBackgroundKey('/tasks')).toBe('tasks');
    expect(resolveMainPageBackgroundKey('/tasks/c/nature')).toBe('tasks');
    expect(resolveMainPageBackgroundKey('/forest')).toBe('forest');
    expect(resolveMainPageBackgroundKey('/rewards')).toBe('rewards');
    expect(resolveMainPageBackgroundKey('/groups')).toBe('groups');
  });

  it('leaves secondary guest pages on the default stylesheet background', () => {
    expect(resolveMainPageBackgroundKey('/statistics')).toBeNull();
    expect(resolveMainPageBackgroundKey('/profile')).toBeNull();
    expect(resolveMainPageBackgroundKey('/forest-lab')).toBeNull();
  });
});
