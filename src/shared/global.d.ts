import type { CodexDesktopApi } from './api';

declare global {
  interface Window {
    codexSwitcher: CodexDesktopApi;
  }
}

export {};
