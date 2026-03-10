import { BrowserWindow, app, ipcMain } from 'electron';
import { join } from 'node:path';
import { registerIpcHandlers } from './ipc';
import { createDesktopApi } from './services/desktop-api';

let handlersRegistered = false;

async function createWindow() {
  const window = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 960,
    minHeight: 640,
    autoHideMenuBar: true,
    backgroundColor: '#0b1116',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js')
    }
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    await window.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    await window.loadFile(join(__dirname, '../../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  if (!handlersRegistered) {
    const desktopApi = await createDesktopApi({ appDataDir: app.getPath('userData') });
    registerIpcHandlers(ipcMain, desktopApi);
    handlersRegistered = true;
  }

  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
