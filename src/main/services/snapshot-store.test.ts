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
        ].join('.')
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
    expect(listed).toHaveLength(1);
    expect(listed[0]?.label).toBe('Alice');
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
});
