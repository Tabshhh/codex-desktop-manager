import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { createSnapshotStore } from './snapshot-store';

async function makeLiveState(root: string, email: string) {
  const codexDir = join(root, '.codex');
  await mkdir(codexDir, { recursive: true });
  await writeFile(
    join(codexDir, 'auth.json'),
    JSON.stringify({
      auth_mode: 'chatgpt',
      last_refresh: '2026-03-10T09:19:31.445Z',
      OPENAI_API_KEY: null,
      tokens: {
        id_token: [
          'header',
          Buffer.from(JSON.stringify({ email, name: email.split('@')[0], plan: 'plus', exp: 1773142222 }), 'utf8')
            .toString('base64url'),
          'signature'
        ].join('.'),
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        account_id: 'account-123'
      }
    })
  );
  await writeFile(join(codexDir, 'config.toml'), 'model = "gpt-5.4"');
}

describe('snapshot store', () => {
  const tempRoots: string[] = [];

  afterEach(async () => {
    const { rm } = await import('node:fs/promises');
    await Promise.all(tempRoots.map((root) => rm(root, { recursive: true, force: true })));
    tempRoots.length = 0;
  });

  it('captures and lists account snapshots', async () => {
    const root = await mkdtemp(join(tmpdir(), 'codex-switcher-'));
    tempRoots.push(root);
    await makeLiveState(root, 'alice@example.com');
    const store = createSnapshotStore({
      appDataDir: join(root, 'app-data'),
      codexHomeDir: join(root, '.codex')
    });

    const created = await store.captureCurrentAccount('Alice');
    const listed = await store.listSnapshots();

    expect(created.account.email).toBe('alice@example.com');
    expect(created.quota).toBeNull();
    expect(listed).toHaveLength(1);
    expect(listed[0]?.label).toBe('Alice');
  });

  it('persists per-snapshot quota summaries', async () => {
    const root = await mkdtemp(join(tmpdir(), 'codex-switcher-'));
    tempRoots.push(root);
    await makeLiveState(root, 'alice@example.com');
    const store = createSnapshotStore({
      appDataDir: join(root, 'app-data'),
      codexHomeDir: join(root, '.codex')
    });

    const created = await store.captureCurrentAccount('Alice');
    const updated = await store.updateSnapshotQuota(created.id, {
      source: 'remote_usage_api',
      refreshedAt: '2026-03-11T11:00:00.000Z',
      authStatus: 'ok',
      planType: 'team',
      fiveHourUsedPercent: 40,
      fiveHourRemainingPercent: 60,
      fiveHourWindowSeconds: 18000,
      fiveHourResetsAt: '2026-03-11T16:00:00.000Z',
      weeklyUsedPercent: 25,
      weeklyRemainingPercent: 75,
      weeklyWindowSeconds: 604800,
      weeklyResetsAt: '2026-03-17T08:00:00.000Z'
    });

    const reread = await store.readSnapshot(created.id);

    expect(updated.quota?.fiveHourRemainingPercent).toBe(60);
    expect(reread.quota?.weeklyRemainingPercent).toBe(75);
    expect(reread.quota?.source).toBe('remote_usage_api');
  });

  it('rejects incomplete snapshots', async () => {
    const root = await mkdtemp(join(tmpdir(), 'codex-switcher-'));
    tempRoots.push(root);
    const store = createSnapshotStore({
      appDataDir: join(root, 'app-data'),
      codexHomeDir: join(root, '.codex')
    });

    await expect(store.readSnapshot('missing')).rejects.toThrow(/not found/i);
  });

  it('falls back to snapshots captured by the old app data directory name', async () => {
    const root = await mkdtemp(join(tmpdir(), 'codex-switcher-'));
    tempRoots.push(root);
    const legacyAppDataDir = join(root, 'legacy-app-data');
    const legacySnapshotsDir = join(legacyAppDataDir, 'snapshots', 'legacy-1');
    await mkdir(legacySnapshotsDir, { recursive: true });
    await writeFile(
      join(legacySnapshotsDir, 'manifest.json'),
      JSON.stringify({
        id: 'legacy-1',
        label: 'Legacy Account',
        createdAt: '2026-03-10T09:00:00.000Z',
        updatedAt: '2026-03-10T09:00:00.000Z',
        account: {
          email: 'legacy@example.com',
          displayName: 'Legacy',
          authMode: 'chatgpt',
          plan: 'pro',
          subject: 'legacy-subject',
          lastRefresh: '2026-03-10T09:19:31.445Z',
          tokenExpiry: '2026-03-10T12:19:31.445Z',
          hasApiKey: false
        },
        quota: null
      })
    );

    const store = createSnapshotStore({
      appDataDir: join(root, 'app-data'),
      codexHomeDir: join(root, '.codex'),
      legacyAppDataDirs: [legacyAppDataDir]
    });

    const listed = await store.listSnapshots();

    expect(listed).toHaveLength(1);
    expect(listed[0]?.label).toBe('Legacy Account');
    expect(listed[0]?.account.email).toBe('legacy@example.com');
  });

  it('merges legacy snapshots into the new app data directory without hiding new ones', async () => {
    const root = await mkdtemp(join(tmpdir(), 'codex-switcher-'));
    tempRoots.push(root);
    const appDataDir = join(root, 'app-data');
    const currentSnapshotsDir = join(appDataDir, 'snapshots', 'current-1');
    const legacyAppDataDir = join(root, 'legacy-app-data');
    const legacySnapshotsDir = join(legacyAppDataDir, 'snapshots', 'legacy-1');

    await mkdir(currentSnapshotsDir, { recursive: true });
    await mkdir(legacySnapshotsDir, { recursive: true });

    await writeFile(
      join(currentSnapshotsDir, 'manifest.json'),
      JSON.stringify({
        id: 'current-1',
        label: 'Current Account',
        createdAt: '2026-03-11T09:00:00.000Z',
        updatedAt: '2026-03-11T09:00:00.000Z',
        account: {
          email: 'current@example.com',
          displayName: 'Current',
          authMode: 'chatgpt',
          plan: 'pro',
          subject: 'current-subject',
          lastRefresh: '2026-03-11T09:19:31.445Z',
          tokenExpiry: '2026-03-11T12:19:31.445Z',
          hasApiKey: false
        },
        quota: null
      })
    );

    await writeFile(
      join(legacySnapshotsDir, 'manifest.json'),
      JSON.stringify({
        id: 'legacy-1',
        label: 'Legacy Account',
        createdAt: '2026-03-10T09:00:00.000Z',
        updatedAt: '2026-03-10T09:00:00.000Z',
        account: {
          email: 'legacy@example.com',
          displayName: 'Legacy',
          authMode: 'chatgpt',
          plan: 'pro',
          subject: 'legacy-subject',
          lastRefresh: '2026-03-10T09:19:31.445Z',
          tokenExpiry: '2026-03-10T12:19:31.445Z',
          hasApiKey: false
        },
        quota: null
      })
    );

    const store = createSnapshotStore({
      appDataDir,
      codexHomeDir: join(root, '.codex'),
      legacyAppDataDirs: [legacyAppDataDir]
    });

    const listed = await store.listSnapshots();

    expect(listed).toHaveLength(2);
    expect(listed.map((snapshot) => snapshot.label)).toEqual(['Current Account', 'Legacy Account']);
  });

  it('skips incomplete snapshot folders while keeping valid ones', async () => {
    const root = await mkdtemp(join(tmpdir(), 'codex-switcher-'));
    tempRoots.push(root);
    const snapshotsDir = join(root, 'app-data', 'snapshots');
    await mkdir(join(snapshotsDir, 'valid-1'), { recursive: true });
    await mkdir(join(snapshotsDir, 'broken-1'), { recursive: true });
    await writeFile(
      join(snapshotsDir, 'valid-1', 'manifest.json'),
      JSON.stringify({
        id: 'valid-1',
        label: 'Valid Account',
        createdAt: '2026-03-11T09:00:00.000Z',
        updatedAt: '2026-03-11T09:00:00.000Z',
        account: {
          email: 'valid@example.com',
          displayName: 'Valid',
          authMode: 'chatgpt',
          plan: 'pro',
          subject: 'valid-subject',
          lastRefresh: '2026-03-11T09:19:31.445Z',
          tokenExpiry: '2026-03-11T12:19:31.445Z',
          hasApiKey: false
        },
        quota: null
      })
    );

    const store = createSnapshotStore({
      appDataDir: join(root, 'app-data'),
      codexHomeDir: join(root, '.codex')
    });

    const listed = await store.listSnapshots();

    expect(listed).toHaveLength(1);
    expect(listed[0]?.label).toBe('Valid Account');
  });

  it('deletes a saved snapshot without affecting the rest of the pool', async () => {
    const root = await mkdtemp(join(tmpdir(), 'codex-switcher-'));
    tempRoots.push(root);
    await makeLiveState(root, 'alice@example.com');
    const store = createSnapshotStore({
      appDataDir: join(root, 'app-data'),
      codexHomeDir: join(root, '.codex')
    });

    const first = await store.captureCurrentAccount('Alice');
    const second = await store.captureCurrentAccount('Alice Backup');

    await store.deleteSnapshot(first.id);

    const listed = await store.listSnapshots();

    expect(listed).toHaveLength(1);
    expect(listed[0]?.id).toBe(second.id);
    await expect(store.readSnapshot(first.id)).rejects.toThrow(/not found/i);
  });
});
