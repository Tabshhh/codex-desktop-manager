import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { LocalUsageSummary } from '@shared/types';
import { readLatestSessionRateLimits } from './session-rate-limits';

interface UsageOptions {
  sessionsDir: string;
  logsDir: string;
  plan: string;
  accountEmail: string | null;
  accountSubject: string | null;
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
          return countFiles(join(root, entry.name));
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

function formatPercent(value: number): string {
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

export async function summarizeLocalUsage(options: UsageOptions): Promise<LocalUsageSummary> {
  const now = options.now ?? new Date();
  const recentSessionCount = await countFiles(options.sessionsDir);
  const recentLogCount = await countFiles(options.logsDir);
  const freshness = computeFreshness(options.lastRefresh, options.tokenExpiry, now);
  const rateLimits = await readLatestSessionRateLimits(options.sessionsDir);
  const planLabel = rateLimits?.planType ?? options.plan;

  return {
    statusLabel: rateLimits
      ? `Plan: ${planLabel} · 5h left ${formatPercent(rateLimits.fiveHourRemainingPercent)} · week left ${formatPercent(rateLimits.weeklyRemainingPercent)}`
      : `Plan: ${planLabel} · local activity ${recentSessionCount}`,
    freshness,
    accountEmail: options.accountEmail,
    accountSubject: options.accountSubject,
    lastRefresh: options.lastRefresh,
    tokenExpiry: options.tokenExpiry,
    recentSessionCount,
    recentLogCount,
    quotaSource: rateLimits ? 'session_rate_limits' : null,
    quotaCapturedAt: rateLimits?.capturedAt ?? null,
    quotaPlanType: rateLimits?.planType ?? null,
    fiveHourUsedPercent: rateLimits?.fiveHourUsedPercent ?? null,
    fiveHourRemainingPercent: rateLimits?.fiveHourRemainingPercent ?? null,
    fiveHourWindowMinutes: rateLimits?.fiveHourWindowMinutes ?? null,
    fiveHourResetsAt: rateLimits?.fiveHourResetsAt ?? null,
    weeklyUsedPercent: rateLimits?.weeklyUsedPercent ?? null,
    weeklyRemainingPercent: rateLimits?.weeklyRemainingPercent ?? null,
    weeklyWindowMinutes: rateLimits?.weeklyWindowMinutes ?? null,
    weeklyResetsAt: rateLimits?.weeklyResetsAt ?? null
  };
}
