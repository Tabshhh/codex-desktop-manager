import { readFile, writeFile } from 'node:fs/promises';
import { decodeJwtPayload } from './jwt';
import type { SnapshotQuotaSummary } from '@shared/types';

const TOKEN_ENDPOINT = 'https://auth.openai.com/oauth/token';
const USAGE_ENDPOINT = 'https://chatgpt.com/backend-api/wham/usage';
const DEFAULT_CODEX_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
const REFRESH_THRESHOLD_SECONDS = 300;

interface RemoteUsageOptions {
  fetchImpl?: typeof fetch;
  now?: Date;
}

interface AuthTokens {
  access_token?: string | null;
  refresh_token?: string | null;
  id_token?: string | null;
  account_id?: string | null;
}

interface AuthFile {
  last_refresh?: string | null;
  tokens?: AuthTokens | null;
}

interface UsageResponseWindow {
  used_percent?: number | null;
  limit_window_seconds?: number | null;
  reset_after_seconds?: number | null;
}

interface UsageResponse {
  plan_type?: string | null;
  rate_limit?: {
    primary_window?: UsageResponseWindow | null;
    secondary_window?: UsageResponseWindow | null;
  } | null;
}

interface TokenRefreshResponse {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
}

function readJwtExpirySeconds(token: string): number | null {
  const claims = decodeJwtPayload(token);
  return typeof claims.exp === 'number' ? claims.exp : null;
}

function shouldRefreshAccessToken(token: string, now: Date): boolean {
  const exp = readJwtExpirySeconds(token);
  if (exp === null) {
    return false;
  }

  return exp - Math.floor(now.getTime() / 1000) <= REFRESH_THRESHOLD_SECONDS;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

function addSeconds(now: Date, seconds: number | null | undefined): string | null {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) {
    return null;
  }

  return new Date(now.getTime() + seconds * 1000).toISOString();
}

async function readAuthFile(authPath: string): Promise<AuthFile> {
  return JSON.parse(await readFile(authPath, 'utf8')) as AuthFile;
}

async function writeAuthFile(authPath: string, auth: AuthFile) {
  await writeFile(authPath, JSON.stringify(auth, null, 2));
}

async function refreshTokens(auth: AuthFile, fetchImpl: typeof fetch, now: Date): Promise<void> {
  const refreshToken = auth.tokens?.refresh_token;
  if (!refreshToken) {
    throw new Error('Snapshot auth.json is missing tokens.refresh_token');
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: DEFAULT_CODEX_CLIENT_ID
  });

  const response = await fetchImpl(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as TokenRefreshResponse;
  if (!payload.access_token) {
    throw new Error('Token refresh did not return access_token');
  }

  auth.tokens = {
    ...auth.tokens,
    access_token: payload.access_token.trim(),
    refresh_token: payload.refresh_token?.trim() ?? auth.tokens?.refresh_token ?? null,
    id_token: payload.id_token?.trim() ?? auth.tokens?.id_token ?? null
  };
  auth.last_refresh = now.toISOString();
}

async function fetchUsage(fetchImpl: typeof fetch, accessToken: string, accountId: string): Promise<UsageResponse> {
  const response = await fetchImpl(USAGE_ENDPOINT, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'chatgpt-account-id': accountId,
      'User-Agent': 'codex-auth-switcher'
    }
  });

  if (response.status === 401) {
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    throw new Error(`Usage request failed: HTTP ${response.status}`);
  }

  return (await response.json()) as UsageResponse;
}

function normalizeUsageSnapshot(usage: UsageResponse, now: Date, authStatus: SnapshotQuotaSummary['authStatus']): SnapshotQuotaSummary {
  const primary = usage.rate_limit?.primary_window;
  const secondary = usage.rate_limit?.secondary_window;
  const primaryUsed = clampPercent(typeof primary?.used_percent === 'number' ? primary.used_percent : 0);
  const secondaryUsed = clampPercent(typeof secondary?.used_percent === 'number' ? secondary.used_percent : 0);

  return {
    source: 'remote_usage_api',
    refreshedAt: now.toISOString(),
    authStatus,
    planType: typeof usage.plan_type === 'string' ? usage.plan_type : null,
    fiveHourUsedPercent: primaryUsed,
    fiveHourRemainingPercent: clampPercent(100 - primaryUsed),
    fiveHourWindowSeconds: typeof primary?.limit_window_seconds === 'number' ? primary.limit_window_seconds : null,
    fiveHourResetsAt: addSeconds(now, primary?.reset_after_seconds ?? null),
    weeklyUsedPercent: secondaryUsed,
    weeklyRemainingPercent: clampPercent(100 - secondaryUsed),
    weeklyWindowSeconds: typeof secondary?.limit_window_seconds === 'number' ? secondary.limit_window_seconds : null,
    weeklyResetsAt: addSeconds(now, secondary?.reset_after_seconds ?? null)
  };
}

export async function refreshUsageFromAuthFile(authPath: string, options: RemoteUsageOptions = {}): Promise<SnapshotQuotaSummary> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? new Date();
  const auth = await readAuthFile(authPath);
  const accountId = auth.tokens?.account_id;

  if (!accountId) {
    throw new Error('Snapshot auth.json is missing tokens.account_id');
  }

  let accessToken = auth.tokens?.access_token;
  if (!accessToken) {
    throw new Error('Snapshot auth.json is missing tokens.access_token');
  }

  let authStatus: SnapshotQuotaSummary['authStatus'] = 'ok';

  if (shouldRefreshAccessToken(accessToken, now)) {
    await refreshTokens(auth, fetchImpl, now);
    accessToken = auth.tokens?.access_token ?? null;
    await writeAuthFile(authPath, auth);
    authStatus = 'refreshed';
  }

  try {
    const usage = await fetchUsage(fetchImpl, accessToken, accountId);
    return normalizeUsageSnapshot(usage, now, authStatus);
  } catch (error) {
    if (!(error instanceof Error) || error.message !== 'Unauthorized') {
      throw error;
    }

    await refreshTokens(auth, fetchImpl, now);
    accessToken = auth.tokens?.access_token ?? null;
    await writeAuthFile(authPath, auth);
    if (!accessToken) {
      throw new Error('Snapshot auth.json is missing tokens.access_token');
    }

    const usage = await fetchUsage(fetchImpl, accessToken, accountId);
    return normalizeUsageSnapshot(usage, now, 'refreshed');
  }
}
