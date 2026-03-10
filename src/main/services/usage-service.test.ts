import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { summarizeLocalUsage } from './usage-service';

describe('usage service', () => {
  const tempRoots: string[] = [];

  afterEach(async () => {
    const { rm } = await import('node:fs/promises');
    await Promise.all(tempRoots.map((root) => rm(root, { recursive: true, force: true })));
    tempRoots.length = 0;
  });

  it('summarizes fresh local activity', async () => {
    const root = await mkdtemp(join(tmpdir(), 'codex-usage-'));
    tempRoots.push(root);
    const sessionsDir = join(root, 'sessions', '2026', '03', '10');
    const logsDir = join(root, 'logs');
    await mkdir(sessionsDir, { recursive: true });
    await mkdir(logsDir, { recursive: true });
    await writeFile(join(sessionsDir, 'session-a.jsonl'), '[]');
    await writeFile(join(sessionsDir, 'session-b.jsonl'), '[]');
    await writeFile(join(logsDir, 'a.log'), 'entry');

    const summary = await summarizeLocalUsage({
      sessionsDir: join(root, 'sessions'),
      logsDir,
      plan: 'pro',
      lastRefresh: '2026-03-10T09:19:31.445Z',
      tokenExpiry: '2026-03-10T12:19:31.445Z',
      now: new Date('2026-03-10T10:00:00.000Z')
    });

    expect(summary.recentSessionCount).toBe(2);
    expect(summary.recentLogCount).toBe(1);
    expect(summary.freshness).toBe('fresh');
    expect(summary.statusLabel).toContain('pro');
  });

  it('falls back to unknown when there is no recent metadata', async () => {
    const root = await mkdtemp(join(tmpdir(), 'codex-usage-'));
    tempRoots.push(root);

    const summary = await summarizeLocalUsage({
      sessionsDir: join(root, 'sessions'),
      logsDir: join(root, 'logs'),
      plan: 'Unknown',
      lastRefresh: null,
      tokenExpiry: null,
      now: new Date('2026-03-10T10:00:00.000Z')
    });

    expect(summary.recentSessionCount).toBe(0);
    expect(summary.recentLogCount).toBe(0);
    expect(summary.freshness).toBe('unknown');
  });
});
