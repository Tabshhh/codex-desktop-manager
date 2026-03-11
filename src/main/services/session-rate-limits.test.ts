import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { readLatestSessionRateLimits } from './session-rate-limits';

describe('session rate limits', () => {
  const tempRoots: string[] = [];

  afterEach(async () => {
    const { rm } = await import('node:fs/promises');
    await Promise.all(tempRoots.map((root) => rm(root, { recursive: true, force: true })));
    tempRoots.length = 0;
  });

  it('extracts the latest non-null codex rate limits from local session files', async () => {
    const root = await mkdtemp(join(tmpdir(), 'codex-rate-limits-'));
    tempRoots.push(root);
    const olderDir = join(root, '2026', '03', '10');
    const newerDir = join(root, '2026', '03', '11');
    await mkdir(olderDir, { recursive: true });
    await mkdir(newerDir, { recursive: true });

    await writeFile(
      join(olderDir, 'older.jsonl'),
      [
        JSON.stringify({
          timestamp: '2026-03-10T09:21:44.628Z',
          type: 'event_msg',
          payload: {
            type: 'token_count',
            rate_limits: {
              limit_id: 'codex',
              primary: { used_percent: 1, window_minutes: 300, resets_at: 1773152385 },
              secondary: { used_percent: 0, window_minutes: 10080, resets_at: 1773739185 },
              plan_type: 'team'
            }
          }
        })
      ].join('\n')
    );

    await writeFile(
      join(newerDir, 'newer.jsonl'),
      [
        JSON.stringify({
          timestamp: '2026-03-11T07:58:22.615Z',
          type: 'event_msg',
          payload: {
            type: 'token_count',
            rate_limits: null
          }
        }),
        JSON.stringify({
          timestamp: '2026-03-11T08:01:09.981Z',
          type: 'event_msg',
          payload: {
            type: 'token_count',
            rate_limits: {
              limit_id: 'codex',
              primary: { used_percent: 78, window_minutes: 300, resets_at: 1773152385 },
              secondary: { used_percent: 23, window_minutes: 10080, resets_at: 1773739185 },
              plan_type: 'team'
            }
          }
        })
      ].join('\n')
    );

    const rateLimits = await readLatestSessionRateLimits(root);

    expect(rateLimits).toMatchObject({
      limitId: 'codex',
      planType: 'team',
      capturedAt: '2026-03-11T08:01:09.981Z',
      sourcePath: join(newerDir, 'newer.jsonl'),
      fiveHourUsedPercent: 78,
      fiveHourRemainingPercent: 22,
      fiveHourWindowMinutes: 300,
      fiveHourResetsAt: '2026-03-10T14:19:45.000Z',
      weeklyUsedPercent: 23,
      weeklyRemainingPercent: 77,
      weeklyWindowMinutes: 10080,
      weeklyResetsAt: '2026-03-17T09:19:45.000Z'
    });
  });

  it('returns null when no usable rate-limit events are present', async () => {
    const root = await mkdtemp(join(tmpdir(), 'codex-rate-limits-'));
    tempRoots.push(root);
    const sessionsDir = join(root, '2026', '03', '11');
    await mkdir(sessionsDir, { recursive: true });
    await writeFile(
      join(sessionsDir, 'session.jsonl'),
      [
        JSON.stringify({
          timestamp: '2026-03-11T07:58:22.615Z',
          type: 'event_msg',
          payload: {
            type: 'token_count',
            rate_limits: null
          }
        }),
        '{"timestamp":"2026-03-11T07:58:23.000Z","type":"broken"'
      ].join('\n')
    );

    await expect(readLatestSessionRateLimits(root)).resolves.toBeNull();
  });
});
