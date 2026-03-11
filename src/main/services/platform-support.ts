export interface PlatformSupport {
  id: NodeJS.Platform;
  label: 'Windows' | 'macOS' | 'Linux' | 'Unknown';
  switchingSupported: boolean;
  reason: string | null;
}

const WINDOWS_ONLY_REASON = 'Codex account switching is currently packaged and supported on Windows only.';

function getPlatformLabel(platform: NodeJS.Platform): PlatformSupport['label'] {
  if (platform === 'win32') {
    return 'Windows';
  }

  if (platform === 'darwin') {
    return 'macOS';
  }

  if (platform === 'linux') {
    return 'Linux';
  }

  return 'Unknown';
}

export function getPlatformSupport(platform: NodeJS.Platform = process.platform): PlatformSupport {
  if (platform === 'win32') {
    return {
      id: platform,
      label: 'Windows',
      switchingSupported: true,
      reason: null
    };
  }

  return {
    id: platform,
    label: getPlatformLabel(platform),
    switchingSupported: false,
    reason: WINDOWS_ONLY_REASON
  };
}
