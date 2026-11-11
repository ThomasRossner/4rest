import { describe, expect, it } from 'vitest';
import {
  CONTROLLER_CHANGE_DEBOUNCE_MS,
  nextServerReload,
  shouldReloadAfterControllerChange,
} from './clientVersion';

describe('nextServerReload', () => {
  it('lädt nicht neu, wenn der laufende Build der Server-Version entspricht', () => {
    expect(nextServerReload('1.2.1-a', '1.2.1-a', null)).toEqual({
      reload: false,
      attempt: null,
    });
  });

  it('lädt bei einer neuen Server-Version und zählt den Versuch', () => {
    expect(nextServerReload('1.2.1-old', '1.2.1-new', null)).toEqual({
      reload: true,
      attempt: '1.2.1-new:1',
    });
    expect(nextServerReload('1.2.1-old', '1.2.1-new', '1.2.1-new:1')).toEqual({
      reload: true,
      attempt: '1.2.1-new:2',
    });
  });

  it('stoppt nach dem Reload-Budget, damit ein Tab nicht in einer Schleife hängt', () => {
    expect(nextServerReload('1.2.1-old', '1.2.1-new', '1.2.1-new:2')).toEqual({
      reload: false,
      attempt: '1.2.1-new:2',
    });
  });

  it('beginnt bei einer anderen Server-Version wieder bei eins', () => {
    expect(nextServerReload('1.2.1-old', '1.2.1-newer', '1.2.1-new:2')).toEqual({
      reload: true,
      attempt: '1.2.1-newer:1',
    });
  });
});

describe('shouldReloadAfterControllerChange', () => {
  it('erlaubt den ersten Wechsel und einen späteren Deploy', () => {
    expect(shouldReloadAfterControllerChange(1_000, null)).toBe(true);
    expect(
      shouldReloadAfterControllerChange(10_000, 10_000 - CONTROLLER_CHANGE_DEBOUNCE_MS)
    ).toBe(true);
  });

  it('unterdrückt das zweite controllerchange-Event im selben Augenblick', () => {
    expect(shouldReloadAfterControllerChange(5_000, 4_000)).toBe(false);
  });
});
