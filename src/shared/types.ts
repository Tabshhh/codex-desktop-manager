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

export interface SnapshotManifest {
  id: string;
  label: string;
  createdAt: string;
  updatedAt: string;
  account: AccountSummary;
}

export interface LocalUsageSummary {
  statusLabel: string;
  freshness: 'fresh' | 'stale' | 'unknown';
  lastRefresh: string | null;
  tokenExpiry: string | null;
  recentSessionCount: number;
  recentLogCount: number;
}
