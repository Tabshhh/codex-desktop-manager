import type { CodexDesktopApi } from '@shared/api';

export function getDesktopBridge(): CodexDesktopApi | null {
  return typeof window.codexSwitcher === 'undefined' ? null : window.codexSwitcher;
}

export function getDesktopBridgeError() {
  return 'Desktop bridge is unavailable. Open this app in the Electron window, not a regular browser tab.';
}
