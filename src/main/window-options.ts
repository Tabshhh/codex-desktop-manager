import { join } from 'node:path';
import type { WindowState } from './window-state';

interface MainWindowOptions {
  width: number;
  height: number;
  x?: number;
  y?: number;
  minWidth: number;
  minHeight: number;
  autoHideMenuBar: boolean;
  backgroundColor: string;
  webPreferences: {
    preload: string;
    contextIsolation: boolean;
    nodeIntegration: boolean;
    sandbox: boolean;
  };
}

export function createMainWindowOptions(mainDir: string, state?: WindowState): MainWindowOptions {
  return {
    width: state?.width ?? 1200,
    height: state?.height ?? 780,
    x: state?.x,
    y: state?.y,
    minWidth: 960,
    minHeight: 640,
    autoHideMenuBar: true,
    backgroundColor: '#0b1116',
    webPreferences: {
      preload: join(mainDir, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  };
}
