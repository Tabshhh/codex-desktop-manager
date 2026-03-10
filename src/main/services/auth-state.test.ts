import { describe, expect, it } from 'vitest';
import { decodeJwtPayload } from './jwt';
import { mapAccountSummary, parseAuthState } from './auth-state';

function encodeBase64Url(value: string) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function createJwt(payload: Record<string, unknown>) {
  return [
    encodeBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' })),
    encodeBase64Url(JSON.stringify(payload)),
    'signature'
  ].join('.');
}

describe('decodeJwtPayload', () => {
  it('decodes a base64url payload', () => {
    const token = createJwt({ email: 'alice@example.com', plan: 'pro' });

    expect(decodeJwtPayload(token)).toMatchObject({
      email: 'alice@example.com',
      plan: 'pro'
    });
  });
});

describe('parseAuthState', () => {
  it('maps auth.json into a safe account summary', () => {
    const raw = JSON.stringify({
      auth_mode: 'chatgpt',
      last_refresh: '2026-03-10T09:19:31.445Z',
      OPENAI_API_KEY: null,
      tokens: {
        id_token: createJwt({
          email: 'alice@example.com',
          name: 'Alice',
          plan: 'pro',
          exp: 1773139999,
          sub: 'user_123'
        })
      }
    });

    const summary = mapAccountSummary(parseAuthState(raw));

    expect(summary).toMatchObject({
      email: 'alice@example.com',
      displayName: 'Alice',
      authMode: 'chatgpt',
      plan: 'pro',
      subject: 'user_123'
    });
    expect(summary.tokenExpiry).toBe('2026-03-10T10:53:19.000Z');
    expect(summary.hasApiKey).toBe(false);
  });

  it('falls back safely when claims are missing', () => {
    const raw = JSON.stringify({
      auth_mode: 'api_key',
      last_refresh: null,
      OPENAI_API_KEY: 'sk-test',
      tokens: {}
    });

    const summary = mapAccountSummary(parseAuthState(raw));

    expect(summary.email).toBe('Unknown account');
    expect(summary.plan).toBe('Unknown');
    expect(summary.hasApiKey).toBe(true);
    expect(summary.tokenExpiry).toBeNull();
  });
});

