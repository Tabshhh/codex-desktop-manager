import { readdir } from 'node:fs/promises';
import type { LocalUsageSummary } from '@shared/types';

interface UsageOptions {
  sessionsDir: string;
  logsDir: string;
  plan: string;
  lastRefresh: string | null;
  tokenExpiry: string | null;
  now?: Date;
}

async function countFiles(root: string): Promise<number> {
  try {
    const entries = await readdir(root, { withFileTypes: true });
    const counts = await Promise.all(
      entries.map(async (entry) => {
        if (entry.isDirectory()) {
          return countFiles(`${root}/${entry.name}`);
        }

        return 1;
      })
    );

    return counts.reduce((sum, value) => sum + value, 0);
  } catch {
    return 0;
  }
}

function computeFreshness(lastRefresh: string | null, tokenExpiry: string | null, now: Date): LocalUsageSummary['freshness'] {
  if (!lastRefresh && !tokenExpiry) {
    return 'unknown';
  }

  const refreshTime = lastRefresh ? new Date(lastRefresh).getTime() : Number.NaN;
  const expiryTime = tokenExpiry ? new Date(tokenExpiry).getTime() : Number.NaN;
  const dayMs = 24 * 60 * 60 * 1000;

  if (!Number.isNaN(refreshTime) && now.getTime() - refreshTime <= dayMs && (Number.isNaN(expiryTime) || expiryTime > now.getTime())) {
    return 'fresh';
  }

  return 'stale';
}

export async function summarizeLocalUsage(options: UsageOptions): Promise<LocalUsageSummary> {
  const now = options.now ?? new Date();
  const recentSessionCount = await countFiles(options.sessionsDir);
  const recentLogCount = await countFiles(options.logsDir);
  const freshness = computeFreshness(options.lastRefresh, options.tokenExpiry, now);

  return {
    statusLabel: `Plan: ${options.plan} · local activity ${recentSessionCount}`,
    freshness,
    lastRefresh: options.lastRefresh,
    tokenExpiry: options.tokenExpiry,
    recentSessionCount,
    recentLogCount
  };
}
