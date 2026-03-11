import { describe, expect, it } from 'vitest';
import { createMainWindowOptions } from './window-options';

describe('createMainWindowOptions', () => {
  it('points preload to the built electron-vite preload entry', () => {
    const options = createMainWindowOptions('C:\\work\\codex-auth\\dist-electron\\main');

    expect(options.webPreferences.preload).toBe('C:\\work\\codex-auth\\dist-electron\\preload\\index.mjs');
  });

  it('uses explicit bridge-friendly web preferences', () => {
    const options = createMainWindowOptions('C:\\work\\codex-auth\\dist-electron\\main');

    expect(options.webPreferences.contextIsolation).toBe(true);
    expect(options.webPreferences.nodeIntegration).toBe(false);
    expect(options.webPreferences.sandbox).toBe(false);
  });

  it('merges saved window bounds into the browser-window options', () => {
    const options = createMainWindowOptions('C:\\work\\codex-auth\\dist-electron\\main', {
      width: 1280,
      height: 860,
      x: 90,
      y: 40,
      isMaximized: false
    });

    expect(options.width).toBe(1280);
    expect(options.height).toBe(860);
    expect(options.x).toBe(90);
    expect(options.y).toBe(40);
  });
});
