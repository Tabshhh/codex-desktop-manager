import type { AccountSummary, CodexAuthState } from '@shared/types';
import { decodeJwtPayload } from './jwt';

interface RawAuthState {
  auth_mode?: string | null;
  last_refresh?: string | null;
  OPENAI_API_KEY?: string | null;
  tokens?: {
    id_token?: string | null;
  } | null;
}

function normalizeAuthMode(value: string | null | undefined): CodexAuthState['authMode'] {
  if (value === 'chatgpt' || value === 'api_key') {
    return value;
  }

  return 'unknown';
}

export function parseAuthState(raw: string): CodexAuthState {
  const parsed = JSON.parse(raw) as RawAuthState;

  return {
    authMode: normalizeAuthMode(parsed.auth_mode),
    lastRefresh: parsed.last_refresh ?? null,
    hasApiKey: Boolean(parsed.OPENAI_API_KEY),
    idToken: parsed.tokens?.id_token ?? null
  };
}

export function mapAccountSummary(state: CodexAuthState): AccountSummary {
  const claims = state.idToken ? decodeJwtPayload(state.idToken) : {};
  const exp = typeof claims.exp === 'number' ? new Date(claims.exp * 1000).toISOString() : null;
  const email = typeof claims.email === 'string' && claims.email ? claims.email : 'Unknown account';
  const displayName = typeof claims.name === 'string' && claims.name ? claims.name : email;

  return {
    email,
    displayName,
    authMode: state.authMode,
    plan: typeof claims.plan === 'string' && claims.plan ? claims.plan : 'Unknown',
    subject: typeof claims.sub === 'string' ? claims.sub : null,
    lastRefresh: state.lastRefresh,
    tokenExpiry: exp,
    hasApiKey: state.hasApiKey
  };
}
