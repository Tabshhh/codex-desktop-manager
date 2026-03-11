import { describe, expect, it } from 'vitest';
import { resolveSessionDataPath } from './session-data-path';

describe('resolveSessionDataPath', () => {
  it('uses LOCALAPPDATA when available', () => {
    const path = resolveSessionDataPath('codex-desktop-manager', {
      LOCALAPPDATA: 'C:\\Users\\Tabs\\AppData\\Local'
    });

    expect(path).toBe('C:\\Users\\Tabs\\AppData\\Local\\codex-desktop-manager\\session-data');
  });

  it('falls back to the user home AppData Local path when LOCALAPPDATA is missing', () => {
    const path = resolveSessionDataPath('codex-desktop-manager', {}, 'C:\\Users\\Tabs');

    expect(path).toBe('C:\\Users\\Tabs\\AppData\\Local\\codex-desktop-manager\\session-data');
  });
});
