import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { refreshUsageFromAuthFile } from './remote-usage';

function createJwt(payload: Record<string, unknown>) {
  const encode = (value: object) => Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
  return [encode({ alg: 'RS256', typ: 'JWT' }), encode(payload), 'signature'].join('.');
}

describe('remote usage', () => {
  const tempRoots: string[] = [];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    const { rm } = await import('node:fs/promises');
    await Promise.all(tempRoots.map((root) => rm(root, { recursive: true, force: true })));
    tempRoots.length = 0;
  });

  it('fetches usage for a saved snapshot auth file', async () => {
    const root = await mkdtemp(join(tmpdir(), 'codex-remote-usage-'));
    tempRoots.push(root);
    const authPath = join(root, 'auth.json');
    await mkdir(root, { recursive: true });
    await writeFile(
      authPath,
      JSON.stringify({
        auth_mode: 'chatgpt',
        last_refresh: '2026-03-11T08:45:32.650Z',
        tokens: {
          id_token: createJwt({ email: 'alice@example.com', plan: 'team', exp: 1773300000 }),
          access_token: createJwt({ exp: 1774000000 }),
          refresh_token: 'refresh-token',
          account_id: 'account-123'
        }
      })
    );

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === 'https://chatgpt.com/backend-api/wham/usage') {
        expect(init?.headers).toMatchObject({
          Authorization: expect.stringContaining('Bearer '),
          'chatgpt-account-id': 'account-123'
        });

        return new Response(
          JSON.stringify({
            plan_type: 'team',
            rate_limit: {
              primary_window: {
                used_percent: 30,
                limit_window_seconds: 18000,
                reset_after_seconds: 7200
              },
              secondary_window: {
                used_percent: 12,
                limit_window_seconds: 604800,
                reset_after_seconds: 172800
              },
              limit_reached: false
            }
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const quota = await refreshUsageFromAuthFile(authPath, { fetchImpl: fetchMock, now: new Date('2026-03-11T10:00:00.000Z') });

    expect(quota).toMatchObject({
      source: 'remote_usage_api',
      planType: 'team',
      authStatus: 'ok',
      fiveHourRemainingPercent: 70,
      weeklyRemainingPercent: 88
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refreshes expired tokens before fetching usage and writes new auth tokens back', async () => {
    const root = await mkdtemp(join(tmpdir(), 'codex-remote-usage-'));
    tempRoots.push(root);
    const authPath = join(root, 'auth.json');
    await mkdir(root, { recursive: true });
    await writeFile(
      authPath,
      JSON.stringify({
        auth_mode: 'chatgpt',
        last_refresh: '2026-03-11T08:45:32.650Z',
        tokens: {
          id_token: createJwt({ email: 'alice@example.com', plan: 'team', exp: 1773300000 }),
          access_token: createJwt({ exp: 1773213300 }),
          refresh_token: 'refresh-token',
          account_id: 'account-123'
        }
      })
    );

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://auth.openai.com/oauth/token') {
        return new Response(
          JSON.stringify({
            access_token: createJwt({ exp: 1775000000 }),
            refresh_token: 'refresh-token-2',
            id_token: createJwt({ email: 'alice@example.com', plan: 'team', exp: 1775000000 })
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url === 'https://chatgpt.com/backend-api/wham/usage') {
        return new Response(
          JSON.stringify({
            plan_type: 'team',
            rate_limit: {
              primary_window: {
                used_percent: 55,
                limit_window_seconds: 18000,
                reset_after_seconds: 3600
              },
              secondary_window: {
                used_percent: 20,
                limit_window_seconds: 604800,
                reset_after_seconds: 86400
              },
              limit_reached: false
            }
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    const quota = await refreshUsageFromAuthFile(authPath, { fetchImpl: fetchMock, now: new Date('2026-03-11T10:00:00.000Z') });
    const updatedAuth = JSON.parse(await readFile(authPath, 'utf8')) as { tokens: Record<string, string>; last_refresh: string };

    expect(quota.authStatus).toBe('refreshed');
    expect(updatedAuth.tokens.access_token).toContain('.');
    expect(updatedAuth.tokens.refresh_token).toBe('refresh-token-2');
    expect(updatedAuth.last_refresh).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
