import { describe, expect, it } from 'vitest';

describe('bootstrap smoke', () => {
  it('loads the package manifest name', async () => {
    const pkg = await import('../../package.json');

    expect(pkg.default.name).toBe('codex-account-switcher');
  });

  it('expects the renderer app module to exist', async () => {
    await expect(import('./App')).resolves.toBeDefined();
  });
});
