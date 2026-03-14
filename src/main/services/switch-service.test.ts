import { mkdtemp, mkdir, rm, writeFile, readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mapAccountSummary, parseAuthState } from './auth-state';
import { createSnapshotStore } from './snapshot-store';
import { createSwitchService } from './switch-service';

async function writeAuth(root: string, email: string) {
  await mkdir(root, { recursive: true });
  await writeFile(
    join(root, 'auth.json'),
    JSON.stringify({
      auth_mode: 'chatgpt',
      last_refresh: '2026-03-10T09:19:31.445Z',
      OPENAI_API_KEY: null,
      tokens: {
        id_token: [
          'header',
          Buffer.from(JSON.stringify({ email, name: email, plan: 'plus', exp: 1773142222 }), 'utf8').toString('base64url'),
          'signature'
        ].join('.')
      }
    })
  );
}

async function exists(path: string) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

describe('switch service', () => {
  const tempRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(tempRoots.map((root) => rm(root, { recursive: true, force: true })));
    tempRoots.length = 0;
  });

  it('switches to the target snapshot and verifies the identity', async () => {
    const root = await mkdtemp(join(tmpdir(), 'codex-switcher-'));
    tempRoots.push(root);
    const codexHomeDir = join(root, '.codex');
    const store = createSnapshotStore({
      appDataDir: join(root, 'app-data'),
      codexHomeDir
    });
    await writeAuth(codexHomeDir, 'current@example.com');
    const target = await store.captureCurrentAccount('Current');
    await writeAuth(codexHomeDir, 'next@example.com');
    const next = await store.captureCurrentAccount('Next');
    await writeAuth(codexHomeDir, 'current@example.com');

    const processManager = {
      stopCodex: vi.fn(async () => undefined),
      startCodex: vi.fn(async () => undefined)
    };
    const service = createSwitchService({ codexHomeDir, appDataDir: join(root, 'app-data'), snapshotStore: store, processManager });

    const result = await service.switchToSnapshot(next.id);
    const liveSummary = mapAccountSummary(parseAuthState(await readFile(join(codexHomeDir, 'auth.json'), 'utf8')));

    expect(result.account.email).toBe('next@example.com');
    expect(liveSummary.email).toBe('next@example.com');
    expect(processManager.stopCodex).toHaveBeenCalledTimes(1);
    expect(processManager.startCodex).toHaveBeenCalledTimes(1);
    expect(target.id).not.toBe(next.id);
  });

  it('rolls back when post-switch verification fails', async () => {
    const root = await mkdtemp(join(tmpdir(), 'codex-switcher-'));
    tempRoots.push(root);
    const codexHomeDir = join(root, '.codex');
    const store = createSnapshotStore({
      appDataDir: join(root, 'app-data'),
      codexHomeDir
    });
    await writeAuth(codexHomeDir, 'current@example.com');
    await store.captureCurrentAccount('Current');
    await writeAuth(codexHomeDir, 'next@example.com');
    const next = await store.captureCurrentAccount('Next');
    await writeAuth(codexHomeDir, 'current@example.com');

    let tamperedOnce = false;
    const processManager = {
      stopCodex: vi.fn(async () => undefined),
      startCodex: vi.fn(async () => {
        if (!tamperedOnce) {
          tamperedOnce = true;
          await writeAuth(codexHomeDir, 'tampered@example.com');
        }
      })
    };
    const service = createSwitchService({ codexHomeDir, appDataDir: join(root, 'app-data'), snapshotStore: store, processManager });

    await expect(service.switchToSnapshot(next.id)).rejects.toThrow(/rolled back/i);

    const liveSummary = mapAccountSummary(parseAuthState(await readFile(join(codexHomeDir, 'auth.json'), 'utf8')));
    expect(liveSummary.email).toBe('current@example.com');
    expect(processManager.stopCodex).toHaveBeenCalledTimes(2);
    expect(processManager.startCodex).toHaveBeenCalledTimes(2);
  });

  it('rolls back when launching the switched account fails', async () => {
    const root = await mkdtemp(join(tmpdir(), 'codex-switcher-'));
    tempRoots.push(root);
    const codexHomeDir = join(root, '.codex');
    const store = createSnapshotStore({
      appDataDir: join(root, 'app-data'),
      codexHomeDir
    });
    await writeAuth(codexHomeDir, 'current@example.com');
    await store.captureCurrentAccount('Current');
    await writeAuth(codexHomeDir, 'next@example.com');
    const next = await store.captureCurrentAccount('Next');
    await writeAuth(codexHomeDir, 'current@example.com');

    const processManager = {
      stopCodex: vi.fn(async () => undefined),
      startCodex: vi
        .fn()
        .mockRejectedValueOnce(new Error('launch failed'))
        .mockResolvedValueOnce(undefined)
    };
    const service = createSwitchService({ codexHomeDir, appDataDir: join(root, 'app-data'), snapshotStore: store, processManager });

    await expect(service.switchToSnapshot(next.id)).rejects.toThrow(/rolled back/i);

    const liveSummary = mapAccountSummary(parseAuthState(await readFile(join(codexHomeDir, 'auth.json'), 'utf8')));
    expect(liveSummary.email).toBe('current@example.com');
    expect(processManager.stopCodex).toHaveBeenCalledTimes(2);
    expect(processManager.startCodex).toHaveBeenCalledTimes(2);
  });

  it('removes files that are absent from the target snapshot', async () => {
    const root = await mkdtemp(join(tmpdir(), 'codex-switcher-'));
    tempRoots.push(root);
    const codexHomeDir = join(root, '.codex');
    const store = createSnapshotStore({
      appDataDir: join(root, 'app-data'),
      codexHomeDir
    });

    await writeAuth(codexHomeDir, 'current@example.com');
    await writeFile(join(codexHomeDir, '.codex-global-state.json'), '{"theme":"dark"}');
    await store.captureCurrentAccount('Current');

    await writeAuth(codexHomeDir, 'next@example.com');
    await rm(join(codexHomeDir, '.codex-global-state.json'));
    const next = await store.captureCurrentAccount('Next');

    await writeAuth(codexHomeDir, 'current@example.com');
    await writeFile(join(codexHomeDir, '.codex-global-state.json'), '{"theme":"dark"}');

    const service = createSwitchService({
      codexHomeDir,
      appDataDir: join(root, 'app-data'),
      snapshotStore: store,
      processManager: {
        stopCodex: vi.fn(async () => undefined),
        startCodex: vi.fn(async () => undefined)
      }
    });

    await service.switchToSnapshot(next.id);

    await expect(exists(join(codexHomeDir, '.codex-global-state.json'))).resolves.toBe(false);
  });
});
