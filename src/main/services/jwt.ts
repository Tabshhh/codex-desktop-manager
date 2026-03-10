function normalizeBase64Url(segment: string) {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const remainder = normalized.length % 4;

  return remainder === 0 ? normalized : normalized.padEnd(normalized.length + (4 - remainder), '=');
}

export function decodeJwtPayload(token: string): Record<string, unknown> {
  const [, payload] = token.split('.');

  if (!payload) {
    return {};
  }

  try {
    const decoded = Buffer.from(normalizeBase64Url(payload), 'base64').toString('utf8');
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return {};
  }
}
