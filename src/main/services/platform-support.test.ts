import { describe, expect, it } from 'vitest';
import { getPlatformSupport } from './platform-support';

describe('platform support', () => {
  it('marks Windows as supported for desktop switching features', () => {
    expect(getPlatformSupport('win32')).toEqual({
      id: 'win32',
      label: 'Windows',
      switchingSupported: true,
      reason: null
    });
  });

  it('marks macOS as not yet supported', () => {
    expect(getPlatformSupport('darwin')).toEqual({
      id: 'darwin',
      label: 'macOS',
      switchingSupported: false,
      reason: 'Codex account switching is currently packaged and supported on Windows only.'
    });
  });

  it('marks Linux as not yet supported', () => {
    expect(getPlatformSupport('linux')).toEqual({
      id: 'linux',
      label: 'Linux',
      switchingSupported: false,
      reason: 'Codex account switching is currently packaged and supported on Windows only.'
    });
  });
});
