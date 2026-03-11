export type AuthMode = 'chatgpt' | 'api_key' | 'unknown';

export interface CodexAuthState {
  authMode: AuthMode;
  lastRefresh: string | null;
  hasApiKey: boolean;
  idToken: string | null;
}

export interface AccountSummary {
  email: string;
  displayName: string;
  authMode: AuthMode;
  plan: string;
  subject: string | null;
  lastRefresh: string | null;
  tokenExpiry: string | null;
  hasApiKey: boolean;
}

export interface SnapshotQuotaSummary {
  source: 'remote_usage_api';
  refreshedAt: string;
  authStatus: 'ok' | 'refreshed';
  planType: string | null;
  fiveHourUsedPercent: number;
  fiveHourRemainingPercent: number;
  fiveHourWindowSeconds: number | null;
  fiveHourResetsAt: string | null;
  weeklyUsedPercent: number;
  weeklyRemainingPercent: number;
  weeklyWindowSeconds: number | null;
  weeklyResetsAt: string | null;
}

export interface SnapshotManifest {
  id: string;
  label: string;
  createdAt: string;
  updatedAt: string;
  account: AccountSummary;
  quota: SnapshotQuotaSummary | null;
}

export interface LocalUsageSummary {
  statusLabel: string;
  freshness: 'fresh' | 'stale' | 'unknown';
  accountEmail: string | null;
  accountSubject: string | null;
  lastRefresh: string | null;
  tokenExpiry: string | null;
  recentSessionCount: number;
  recentLogCount: number;
  quotaSource: 'session_rate_limits' | null;
  quotaCapturedAt: string | null;
  quotaPlanType: string | null;
  fiveHourUsedPercent: number | null;
  fiveHourRemainingPercent: number | null;
  fiveHourWindowMinutes: number | null;
  fiveHourResetsAt: string | null;
  weeklyUsedPercent: number | null;
  weeklyRemainingPercent: number | null;
  weeklyWindowMinutes: number | null;
  weeklyResetsAt: string | null;
}
