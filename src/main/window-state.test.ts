import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { defaultWindowState, loadWindowState, saveWindowState } from './window-state';

describe('window state', () => {
  const tempRoots: string[] = [];

  afterEach(async () => {
    const { rm } = await import('node:fs/promises');
    await Promise.all(tempRoots.map((root) => rm(root, { recursive: true, force: true })));
    tempRoots.length = 0;
  });

  it('falls back to defaults when no state file exists', async () => {
    const root = await mkdtemp(join(tmpdir(), 'codex-window-state-'));
    tempRoots.push(root);

    const state = await loadWindowState(join(root, 'window-state.json'), [
      { x: 0, y: 0, width: 1920, height: 1080 }
    ]);

    expect(state).toEqual(defaultWindowState);
  });

  it('loads saved bounds when they fit on a known display', async () => {
    const root = await mkdtemp(join(tmpdir(), 'codex-window-state-'));
    tempRoots.push(root);
    const filePath = join(root, 'window-state.json');

    await saveWindowState(filePath, {
      width: 1360,
      height: 900,
      x: 120,
      y: 80,
      isMaximized: false
    });

    const state = await loadWindowState(filePath, [{ x: 0, y: 0, width: 1920, height: 1080 }]);

    expect(state).toEqual({
      width: 1360,
      height: 900,
      x: 120,
      y: 80,
      isMaximized: false
    });
  });

  it('rejects malformed or off-screen saved bounds', async () => {
    const root = await mkdtemp(join(tmpdir(), 'codex-window-state-'));
    tempRoots.push(root);
    const filePath = join(root, 'window-state.json');

    await saveWindowState(filePath, {
      width: 1360,
      height: 900,
      x: 5000,
      y: 5000,
      isMaximized: false
    });

    const state = await loadWindowState(filePath, [{ x: 0, y: 0, width: 1920, height: 1080 }]);

    expect(state).toEqual(defaultWindowState);
  });
});
