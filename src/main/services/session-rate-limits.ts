import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

interface RawRateWindow {
  used_percent?: number | null;
  window_minutes?: number | null;
  resets_at?: number | null;
}

interface RawRateLimits {
  limit_id?: string | null;
  primary?: RawRateWindow | null;
  secondary?: RawRateWindow | null;
  plan_type?: string | null;
}

interface RawTokenCountEvent {
  timestamp?: string | null;
  type?: string | null;
  payload?: {
    type?: string | null;
    rate_limits?: RawRateLimits | null;
  } | null;
}

export interface SessionRateLimits {
  limitId: string;
  sourcePath: string;
  capturedAt: string;
  planType: string | null;
  fiveHourUsedPercent: number;
  fiveHourRemainingPercent: number;
  fiveHourWindowMinutes: number;
  fiveHourResetsAt: string;
  weeklyUsedPercent: number;
  weeklyRemainingPercent: number;
  weeklyWindowMinutes: number;
  weeklyResetsAt: string;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizePercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

function toIsoFromUnixSeconds(value: number): string {
  return new Date(value * 1000).toISOString();
}

async function collectSessionFiles(root: string): Promise<string[]> {
  try {
    const entries = await readdir(root, { withFileTypes: true });
    const collected = await Promise.all(
      entries.map(async (entry) => {
        const resolved = join(root, entry.name);
        if (entry.isDirectory()) {
          return collectSessionFiles(resolved);
        }

        return entry.isFile() && resolved.endsWith('.jsonl') ? [resolved] : [];
      })
    );

    return collected.flat();
  } catch {
    return [];
  }
}

function parseRateLimitsRecord(rawLine: string, sourcePath: string): SessionRateLimits | null {
  let parsed: RawTokenCountEvent;

  try {
    parsed = JSON.parse(rawLine) as RawTokenCountEvent;
  } catch {
    return null;
  }

  if (parsed.type !== 'event_msg' || parsed.payload?.type !== 'token_count' || !parsed.payload.rate_limits) {
    return null;
  }

  const capturedAt = typeof parsed.timestamp === 'string' ? parsed.timestamp : null;
  const rateLimits = parsed.payload.rate_limits;
  const primary = rateLimits.primary;
  const secondary = rateLimits.secondary;

  if (!capturedAt || Number.isNaN(new Date(capturedAt).getTime())) {
    return null;
  }

  if (
    !primary ||
    !secondary ||
    !isFiniteNumber(primary.used_percent) ||
    !isFiniteNumber(primary.window_minutes) ||
    !isFiniteNumber(primary.resets_at) ||
    !isFiniteNumber(secondary.used_percent) ||
    !isFiniteNumber(secondary.window_minutes) ||
    !isFiniteNumber(secondary.resets_at)
  ) {
    return null;
  }

  const fiveHourUsedPercent = normalizePercent(primary.used_percent);
  const weeklyUsedPercent = normalizePercent(secondary.used_percent);

  return {
    limitId: typeof rateLimits.limit_id === 'string' && rateLimits.limit_id ? rateLimits.limit_id : 'codex',
    sourcePath,
    capturedAt,
    planType: typeof rateLimits.plan_type === 'string' && rateLimits.plan_type ? rateLimits.plan_type : null,
    fiveHourUsedPercent,
    fiveHourRemainingPercent: normalizePercent(100 - fiveHourUsedPercent),
    fiveHourWindowMinutes: primary.window_minutes,
    fiveHourResetsAt: toIsoFromUnixSeconds(primary.resets_at),
    weeklyUsedPercent,
    weeklyRemainingPercent: normalizePercent(100 - weeklyUsedPercent),
    weeklyWindowMinutes: secondary.window_minutes,
    weeklyResetsAt: toIsoFromUnixSeconds(secondary.resets_at)
  };
}

export async function readLatestSessionRateLimits(sessionsDir: string): Promise<SessionRateLimits | null> {
  const sessionFiles = await collectSessionFiles(sessionsDir);
  let latestRateLimits: SessionRateLimits | null = null;
  let latestTimestamp = Number.NEGATIVE_INFINITY;

  for (const sessionFile of sessionFiles) {
    let rawFile: string;

    try {
      rawFile = await readFile(sessionFile, 'utf8');
    } catch {
      continue;
    }

    for (const rawLine of rawFile.split(/\r?\n/)) {
      if (!rawLine.trim()) {
        continue;
      }

      const parsed = parseRateLimitsRecord(rawLine, sessionFile);
      if (!parsed) {
        continue;
      }

      const timestamp = new Date(parsed.capturedAt).getTime();
      if (timestamp > latestTimestamp) {
        latestTimestamp = timestamp;
        latestRateLimits = parsed;
      }
    }
  }

  return latestRateLimits;
}
